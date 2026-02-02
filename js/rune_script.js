// ==========================================
// ARCANE DEPTHS - Rune Script Engine (Demencial)
// Mini pseudo-language compiler + runtime with hard limits
// ==========================================

(function () {
  const MAX_LINES = 16;
  const MAX_CPU_PER_EVENT = 30;
  const MAX_REPEAT = 6;
  const MAX_SPAWNS_PER_SEC = 8;
  const MIN_CAST_COOLDOWN = 0.25;

  // Hard caps per action (anti-exploit). Anything outside range is rejected.
  const ACTION_CAPS = {
    SpawnProjectile: {
      damage: { min: 1, max: 30 },
      count: { min: 1, max: 8, int: true },
      spread: { min: 0, max: 40 },
      speed: { min: 80, max: 600 },
      range: { min: 150, max: 1200 },
      chance: { min: 0, max: 100 },
    },
    ApplyStatus: {
      type: { enum: ['burn','poison','slow'] },
      damage: { min: 1, max: 18 },
      duration: { min: 0.5, max: 6 },
      amount: { min: 0.1, max: 0.9 },
      chance: { min: 0, max: 100 },
    },
    Explode: {
      radius: { min: 40, max: 160 },
      damage: { min: 6, max: 40 },
      chance: { min: 0, max: 100 },
    },
    Heal: {
      amount: { min: 4, max: 35 },
      chance: { min: 0, max: 100 },
    },
    Shield: {
      amount: { min: 6, max: 45 },
      duration: { min: 1, max: 8 },
      chance: { min: 0, max: 100 },
    },
    Chain: {
      count: { min: 1, max: 4, int: true },
      range: { min: 80, max: 220 },
      damage: { min: 2, max: 22 },
      chance: { min: 0, max: 100 },
    },
    Bounce: {
      count: { min: 1, max: 4, int: true },
      chance: { min: 0, max: 100 },
    },
    Pierce: {
      count: { min: 1, max: 5, int: true },
      chance: { min: 0, max: 100 },
    },
    Summon: {
      type: { enum: ['wisp','stalker','brute','turret'] },
      count: { min: 1, max: 2, int: true },
      chance: { min: 0, max: 100 },
    },
  };

  // Action CPU costs (rough)
  const CPU_COST = {
    SpawnProjectile: 5,
    ApplyStatus: 4,
    Explode: 6,
    Heal: 4,
    Shield: 5,
    Summon: 8,
    Chain: 5,
    Bounce: 4,
    Pierce: 4,
  };

  const EVENTS = new Set(['OnCast', 'OnHit', 'OnKill', 'OnRoomClear', 'OnDamageTaken']);

  // -------- Condition validation (supports and/or) --------
  const VARS = new Set(['mana','cooldown','stacks','chance','range','damage','count']);

  function validateCondTerm(term) {
    const t = term.trim();
    const m = t.match(/^([a-zA-Z_]+)\s*(<=|>=|==|<|>)\s*(\d+(?:\.\d+)?)$/);
    if (!m) return false;
    const key = m[1];
    if (!VARS.has(key)) return false;
    // chance can use < <= > >= (no == restriction needed)
    return true;
  }

  function validateCondExpr(expr) {
    // Allow: term (and term)* (or term (and term)*)*
    const orParts = expr.split(/\s+or\s+/i);
    if (!orParts.length) return false;
    for (const part of orParts) {
      const andParts = part.split(/\s+and\s+/i);
      if (!andParts.length) return false;
      for (const term of andParts) {
        if (!validateCondTerm(term)) return false;
      }
    }
    return true;
  }

  function parseKV(rest) {
    const out = {};
    const parts = rest.trim().split(/\s+/).filter(Boolean);
    for (const p of parts) {
      const m = p.match(/^([a-zA-Z_]+)=(.+)$/);
      if (!m) continue;
      let v = m[2];
      if (/^-?\d+(\.\d+)?$/.test(v)) v = parseFloat(v);
      out[m[1]] = v;
    }
    return out;
  }

  function validateArgs(action, args) {
    const caps = ACTION_CAPS[action] || null;
    if (!caps) return;

    // Disallow unknown keys (except repeat which is handled separately)
    for (const k of Object.keys(args)) {
      if (k === 'repeat') continue;
      if (!(k in caps)) throw new Error(`${action}: parámetro inválido '${k}'.`);
    }

    for (const [k, rule] of Object.entries(caps)) {
      if (!(k in args)) continue;
      const v = args[k];

      if (rule.enum) {
        const s = String(v).toLowerCase();
        if (!rule.enum.includes(s)) throw new Error(`${action} ${k} inválido. Valores: ${rule.enum.join(', ')}.`);
        args[k] = s;
        continue;
      }

      if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`${action} ${k} debe ser número.`);
      if (rule.int && Math.floor(v) !== v) throw new Error(`${action} ${k} debe ser entero.`);
      if (typeof rule.min === 'number' && v < rule.min) throw new Error(`${action} ${k} demasiado bajo (min ${rule.min}).`);
      if (typeof rule.max === 'number' && v > rule.max) throw new Error(`${action} ${k} demasiado alto (max ${rule.max}).`);
    }
  }

  function indentOf(line) {
    const m = line.match(/^\s*/);
    return m ? m[0].length : 0;
  }

  function compile(src) {
    try {
      src = (src || '').replace(/\r/g, '');
      const rawLines = src.split('\n');

      // Strip comments and keep meaningful lines for limits
      const cleaned = rawLines
        .map(l => l.replace(/#.*$/,''))
        .filter(l => l.trim().length > 0);

      if (cleaned.length === 0) return { ok: false, error: 'Script vacío.' };
      if (cleaned.length > MAX_LINES) return { ok: false, error: `Máximo ${MAX_LINES} líneas.` };

      let currentEvent = null;
      const program = {};

      // Stack frames: { type:'if'|'repeat', indent, node }
      const stack = [];

      function addInstr(instr, lineIndent) {
        if (!currentEvent) throw new Error('Definí un evento (OnCast:, OnHit:, etc.) antes de acciones.');
        const root = program[currentEvent] || (program[currentEvent] = []);
        // find current container from stack based on indent
        while (stack.length && lineIndent <= stack[stack.length - 1].indent) stack.pop();
        const container = stack.length ? stack[stack.length - 1].node.body : root;
        container.push(instr);
      }

      function pushFrame(type, indent, node) {
        // Attach node already to current container
        stack.push({ type, indent, node });
      }

      for (let i = 0; i < cleaned.length; i++) {
        const line = cleaned[i];
        const ind = indentOf(line);
        const t = line.trim();

        // Event header
        if (/^On[A-Za-z]+:\s*$/.test(t)) {
          const ev = t.replace(':','');
          if (!EVENTS.has(ev)) throw new Error(`Evento inválido: ${ev}`);
          currentEvent = ev;
          if (!program[currentEvent]) program[currentEvent] = [];
          // reset stack at new event
          stack.length = 0;
          continue;
        }

        // else:
        if (t === 'else:') {
          // find nearest if frame
          let j = stack.length - 1;
          while (j >= 0 && stack[j].type !== 'if') j--;
          if (j < 0) throw new Error('else: sin if.');
          const ifNode = stack[j].node;
          ifNode.elseBody = [];
          // switch active frame node to else by replacing node.body pointer
          stack[j].node = { ...ifNode, _active: 'else' };
          // Replace frame to point to else container
          stack[j] = { type:'if_else', indent: stack[j].indent, node: { body: ifNode.elseBody } };
          continue;
        }

        // if condition:
        let mm = t.match(/^if\s+(.+):\s*$/);
        if (mm) {
          const cond = mm[1].trim();
	          // only allow safe conditions (supports and/or)
	          if (!validateCondExpr(cond)) {
	            throw new Error('Condición no permitida. Usá variables permitidas con and/or (ej: chance < 25 and mana >= 5).');
	          }
          const node = { op: 'if', cond, body: [], elseBody: null };
          addInstr(node, ind);
          pushFrame('if', ind, { body: node.body });
          continue;
        }

        // repeat N:
        mm = t.match(/^repeat\s+(\d+)\s*:\s*$/);
        if (mm) {
          const n = parseInt(mm[1], 10);
          if (!(n >= 1 && n <= MAX_REPEAT)) throw new Error(`repeat máximo ${MAX_REPEAT}.`);
          const node = { op: 'repeat', n, body: [] };
          addInstr(node, ind);
          pushFrame('repeat', ind, { body: node.body });
          continue;
        }

        // Action line
        mm = t.match(/^([A-Za-z_]+)(.*)$/);
        if (!mm) throw new Error('Línea inválida.');
        const action = mm[1];
        const args = parseKV(mm[2] || '');

        // Validate action
        const allowed = ['SpawnProjectile','ApplyStatus','Chain','Bounce','Pierce','Explode','Heal','Shield','Summon'];
        if (!allowed.includes(action)) throw new Error(`Acción inválida: ${action}`);

        // Basic arg sanity
        if (args.repeat && args.repeat > MAX_REPEAT) throw new Error(`repeat máximo ${MAX_REPEAT}`);
        validateArgs(action, args);
        addInstr({ op: 'act', action, args }, ind);
      }

      // Quick CPU estimation per event (upper bound)
      for (const [ev, list] of Object.entries(program)) {
        const est = estimateCpu(list);
        if (est > MAX_CPU_PER_EVENT) return { ok: false, error: `CPU excedida en ${ev} (estimado ${est} > ${MAX_CPU_PER_EVENT}).` };
      }

      return { ok: true, program };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  function estimateCpu(list) {
    let cpu = 0;
    function walk(nodes, mult=1) {
      for (const n of nodes) {
        if (!n) continue;
        if (n.op === 'act') cpu += (CPU_COST[n.action] || 5) * mult;
        else if (n.op === 'if') { walk(n.body, mult); if (n.elseBody) walk(n.elseBody, mult); }
        else if (n.op === 'repeat') { walk(n.body, mult * n.n); }
      }
    }
    walk(list, 1);
    return cpu;
  }

  // Analyze script for dynamic forging price.
  // Price increases with: more actions, repeats, higher parameter values (within caps), and frequent events.
  function analyze(src) {
    const res = compile(src);
    if (!res.ok) return { ok: false, error: res.error };

    const program = res.program;
    const perEventCpu = {};
    const perEventActions = {};

    for (const [ev, list] of Object.entries(program)) {
      perEventCpu[ev] = estimateCpu(list);
      perEventActions[ev] = 0;
    }

    const eventMult = {
      OnCast: 1.00,
      OnHit: 1.30,
      OnKill: 1.20,
      OnDamageTaken: 1.20,
      OnRoomClear: 0.60,
    };

    function chanceMult(args) {
      if (typeof args.chance !== 'number') return 1.0;
      const c = Math.max(0, Math.min(100, args.chance));
      return 0.35 + 0.65 * (c / 100);
    }

    function actionIntensity(action, args) {
      // Convert params into a rough "power" number.
      const a = args || {};
      switch (action) {
        case 'SpawnProjectile': {
          const dmg = typeof a.damage === 'number' ? a.damage : 6;
          const cnt = typeof a.count === 'number' ? a.count : 1;
          const rng = typeof a.range === 'number' ? a.range : 300;
          const spd = typeof a.speed === 'number' ? a.speed : 240;
          const spr = typeof a.spread === 'number' ? a.spread : 10;
          return 1.0 + dmg * 0.70 + cnt * 2.0 + (rng / 200) * 0.8 + (spd / 200) * 0.5 + (spr / 10) * 0.25;
        }
        case 'ApplyStatus': {
          const type = String(a.type || 'burn');
          const dmg = typeof a.damage === 'number' ? a.damage : 4;
          const dur = typeof a.duration === 'number' ? a.duration : 3;
          const amt = typeof a.amount === 'number' ? a.amount : 0.5;
          const base = (type === 'slow') ? 6 : 4;
          return 1.0 + base + dmg * 0.55 + dur * 0.9 + amt * 4.0;
        }
        case 'Explode': {
          const dmg = typeof a.damage === 'number' ? a.damage : 18;
          const rad = typeof a.radius === 'number' ? a.radius : 70;
          return 1.0 + dmg * 0.9 + (rad / 20) * 0.9;
        }
        case 'Heal': {
          const amt = typeof a.amount === 'number' ? a.amount : 10;
          return 1.0 + amt * 0.55;
        }
        case 'Shield': {
          const amt = typeof a.amount === 'number' ? a.amount : 18;
          const dur = typeof a.duration === 'number' ? a.duration : 4;
          return 1.0 + amt * 0.45 + dur * 1.1;
        }
        case 'Chain': {
          const cnt = typeof a.count === 'number' ? a.count : 2;
          const rng = typeof a.range === 'number' ? a.range : 120;
          const dmg = typeof a.damage === 'number' ? a.damage : 8;
          return 1.0 + cnt * 3.0 + (rng / 40) * 0.8 + dmg * 0.45;
        }
        case 'Bounce': {
          const cnt = typeof a.count === 'number' ? a.count : 1;
          return 1.0 + cnt * 4.0;
        }
        case 'Pierce': {
          const cnt = typeof a.count === 'number' ? a.count : 1;
          return 1.0 + cnt * 3.5;
        }
        case 'Summon': {
          const cnt = typeof a.count === 'number' ? a.count : 1;
          return 1.0 + cnt * 10.0;
        }
      }
      return 1.0;
    }

    let extraCost = 0;
    let lines = 0;

    // Count meaningful lines (no comments)
    if (src) {
      lines = String(src).replace(/\r/g,'').split('\n').map(l => l.replace(/#.*$/,'')).filter(l => l.trim().length>0).length;
    }

    function walk(nodes, ev, mult=1) {
      for (const n of nodes) {
        if (!n) continue;
        if (n.op === 'act') {
          perEventActions[ev] = (perEventActions[ev] || 0) + mult;
          const base = 55; // baseline per action
          const cpu = (CPU_COST[n.action] || 5);
          const intensity = actionIntensity(n.action, n.args);
          const cm = chanceMult(n.args);
          const em = eventMult[ev] || 1.0;
          // Price rises with repeats (mult), cpu, intensity, and event frequency.
          extraCost += Math.round(mult * (base + cpu * 35) * intensity * cm * em);
        } else if (n.op === 'if') {
          walk(n.body, ev, mult);
          if (n.elseBody) walk(n.elseBody, ev, mult);
        } else if (n.op === 'repeat') {
          walk(n.body, ev, mult * n.n);
        }
      }
    }

    for (const [ev, list] of Object.entries(program)) walk(list, ev, 1);

    // Small additive price for script size/complexity.
    extraCost += Math.round(lines * 25);
    extraCost += Math.round(Object.values(perEventCpu).reduce((a,b)=>a+b,0) * 12);

    // Ensure integer and non-negative
    extraCost = Math.max(0, Math.floor(extraCost));

    return { ok: true, extraCost, lines, perEventCpu, perEventActions };
  }
  // A tiny in-game reference panel (used by Forge UI) - paged
  function getDocsHTML() {
    function capLine(action) {
      const caps = ACTION_CAPS[action];
      if (!caps) return '';
      const parts = [];
      for (const [k, r] of Object.entries(caps)) {
        if (r.enum) parts.push(`${k}=[${r.enum.join('|')}]`);
        else if (typeof r.min === 'number' && typeof r.max === 'number') parts.push(`${k}=${r.min}..${r.max}`);
      }
      return parts.join(' • ');
    }

    const evs = [
      { id:'OnCast', title:'OnCast', desc:'Cuando lanzás/disparás.' },
      { id:'OnHit', title:'OnHit', desc:'Cuando tu proyectil pega.' },
      { id:'OnKill', title:'OnKill', desc:'Cuando matás un enemigo.' },
      { id:'OnRoomClear', title:'OnRoomClear', desc:'Cuando limpias una sala.' },
      { id:'OnDamageTaken', title:'OnDamageTaken', desc:'Cuando recibís daño.' }
    ];

    const actions = [
      { id:'SpawnProjectile', desc:'Dispara proyectiles extra.' },
      { id:'ApplyStatus', desc:'Aplica burn/poison/slow.' },
      { id:'Explode', desc:'Explosión alrededor del objetivo.' },
      { id:'Heal', desc:'Curación instantánea.' },
      { id:'Shield', desc:'Escudo temporal.' },
      { id:'Chain', desc:'Rebota al siguiente objetivo cercano.' },
      { id:'Bounce', desc:'Rebota contra paredes.' },
      { id:'Pierce', desc:'Atraviesa enemigos.' },
      { id:'Summon', desc:'Invoca una entidad simple.' }
    ];

    const globals = [
      `• Máx líneas: <b>${MAX_LINES}</b>`,
      `• CPU por evento: <b>${MAX_CPU_PER_EVENT}</b>`,
      `• repeat máx: <b>${MAX_REPEAT}</b>`,
      `• spawns/s máx: <b>${MAX_SPAWNS_PER_SEC}</b>`
    ].join('<br>');

    const pages = [
      { key:'index', label:'Índice' },
      { key:'events', label:'Eventos' },
      { key:'actions', label:'Acciones' },
      { key:'rules', label:'Reglas' },
      { key:'examples', label:'Ejemplos' }
    ];

    function tabsHTML() {
      return `<div class="forge-docs-tabs">${
        pages.map((p,i)=>`<button class="forge-docs-tab ${i===0?'active':''}" data-page="${p.key}">${p.label}</button>`).join('')
      }</div>`;
    }

    function pageWrap(key, inner, active=false){
      return `<div class="forge-docs-page ${active?'active':''}" data-page="${key}">${inner}</div>`;
    }

    // Page: Index / contents
    const indexHtml = `
      <div class="doc-block">
        <div class="doc-title">Cómo usar la FORJA</div>
        <div class="doc-muted">Elegí una <b>Runa Vacía</b>, escribí tu pseudo-código, tocá <b>Validar</b> y después <b>Programar</b>. El precio sube con la potencia del script.</div>
      </div>

      <div class="doc-block">
        <div class="doc-title">Páginas</div>
        <button class="forge-docs-link" data-go="events">📌 Eventos — cuándo se ejecuta tu script</button>
        <button class="forge-docs-link" data-go="actions">🧩 Acciones — comandos + parámetros</button>
        <button class="forge-docs-link" data-go="rules">🛡️ Reglas — límites, variables y anti-exploit</button>
        <button class="forge-docs-link" data-go="examples">🧪 Ejemplos — plantillas listas</button>
      </div>

      <div class="doc-block">
        <div class="doc-title">Límites globales</div>
        <div class="doc-muted">${globals}</div>
      </div>
    `;

    // Page: Events
    const eventsHtml = `
      <div class="doc-block">
        <div class="doc-title">Eventos</div>
        <div class="doc-muted">Elegí <b>uno</b> y escribí acciones debajo. Podés usar varios eventos en la misma runa.</div>
      </div>
      ${evs.map(e=>`
        <div class="doc-block">
          <div class="doc-title">${e.title}</div>
          <div class="doc-muted">${e.desc}</div>
          <pre class="doc-code">${e.id}:\n  SpawnProjectile damage=4 count=2 spread=10 chance=35</pre>
        </div>
      `).join('')}
    `;

    // Page: Actions
    const actionsHtml = `
      <div class="doc-block">
        <div class="doc-title">Acciones (comandos)</div>
        <div class="doc-muted">Cada acción tiene <b>máximos</b>. Si te pasás, la validación falla.</div>
      </div>
      ${actions.map(a=>`
        <div class="doc-block">
          <div class="doc-title">${a.id}</div>
          <div class="doc-muted">${a.desc}</div>
          <div class="doc-muted"><b>Parámetros:</b><br>${capLine(a.id)}</div>
        </div>
      `).join('')}
    `;

    // Page: Rules
    const rulesHtml = `
      <div class="doc-block">
        <div class="doc-title">Condiciones</div>
        <div class="doc-muted">Usá <b>if</b> / <b>else</b> con <b>and</b>/<b>or</b>.</div>
        <pre class="doc-code">if chance &lt; 25 and mana &gt;= 5:\n  SpawnProjectile damage=12 count=2\nelse:\n  ApplyStatus type=burn damage=6 duration=2 chance=25</pre>
      </div>

      <div class="doc-block">
        <div class="doc-title">Variables permitidas</div>
        <div class="doc-muted"><b>mana</b>, <b>cooldown</b>, <b>stacks</b>, <b>chance</b>, <b>range</b>, <b>damage</b>, <b>count</b></div>
      </div>

      <div class="doc-block">
        <div class="doc-title">Loops (controlados)</div>
        <div class="doc-muted">Solo existe <b>repeat N:</b> (máx ${MAX_REPEAT}). No hay while infinito.</div>
        <pre class="doc-code">OnCast:\n  repeat 3:\n    SpawnProjectile damage=4 count=1 spread=6</pre>
      </div>

      <div class="doc-block">
        <div class="doc-title">Anti-exploit</div>
        <div class="doc-muted">
          • máximo de spawns por segundo<br>
          • CPU/budget por evento<br>
          • cooldown mínimo<br>
          • límites de Chain/Bounce/Pierce<br>
          • sin recursión / sin loops infinitos
        </div>
      </div>
    `;

    // Page: Examples
    const examplesHtml = `
      <div class="doc-block">
        <div class="doc-title">Ejemplos listos</div>
        <div class="doc-muted">Podés copiar y modificar números. Más fuerte = más caro.</div>
      </div>

      <div class="doc-block">
        <div class="doc-title">Doble Disparo</div>
        <pre class="doc-code">OnCast:\n  SpawnProjectile damage=6 count=2 spread=10</pre>
      </div>

      <div class="doc-block">
        <div class="doc-title">Quemadura al pegar</div>
        <pre class="doc-code">OnHit:\n  ApplyStatus type=burn damage=6 duration=2 chance=35</pre>
      </div>

      <div class="doc-block">
        <div class="doc-title">Explosión rara</div>
        <pre class="doc-code">OnHit:\n  Explode radius=90 damage=22 chance=15</pre>
      </div>

      <div class="doc-block">
        <div class="doc-title">Escudo al recibir daño</div>
        <pre class="doc-code">OnDamageTaken:\n  Shield amount=0.25 duration=2 chance=40</pre>
      </div>
    `;

    let html = '';
    html += tabsHTML();
    html += `<div class="forge-docs-body">`;
    html += pageWrap('index', indexHtml, true);
    html += pageWrap('events', eventsHtml, false);
    html += pageWrap('actions', actionsHtml, false);
    html += pageWrap('rules', rulesHtml, false);
    html += pageWrap('examples', examplesHtml, false);
    html += `</div>`;
    return html;
  }

  function evalCond(cond, ctx) {
    // Supports: term (and term)* (or term ...)*
    const orParts = cond.split(/\s+or\s+/i);
    for (const part of orParts) {
      const andParts = part.split(/\s+and\s+/i);
      let andOk = true;
      for (const term of andParts) {
        const m = term.trim().match(/^([a-zA-Z_]+)\s*(<=|>=|==|<|>)\s*(\d+(?:\.\d+)?)$/);
        if (!m) { andOk = false; break; }
        const key = m[1];
        const op = m[2];
        const val = parseFloat(m[3]);
        const a = (key === 'chance') ? (ctx.chance || 0) : (ctx.vars[key] || 0);
        let ok = false;
        switch (op) {
          case '<': ok = a < val; break;
          case '<=': ok = a <= val; break;
          case '>': ok = a > val; break;
          case '>=': ok = a >= val; break;
          case '==': ok = a == val; break;
        }
        if (!ok) { andOk = false; break; }
      }
      if (andOk) return true;
    }
    return false;
  }

  function ensureState(rune) {
    if (!rune._scriptState) {
      rune._scriptState = { lastCastAt: -999, spawnsWindowStart: 0, spawnsInWindow: 0, stacks: 0 };
    }
    return rune._scriptState;
  }

  function canSpawn(rune, now) {
    const st = ensureState(rune);
    if (now - st.spawnsWindowStart >= 1) {
      st.spawnsWindowStart = now;
      st.spawnsInWindow = 0;
    }
    if (st.spawnsInWindow >= MAX_SPAWNS_PER_SEC) return false;
    st.spawnsInWindow++;
    return true;
  }

  function executeList(nodes, ctx, rune, budget) {
    for (const n of nodes) {
      if (budget.cpu <= 0) return;
      if (!n) continue;

      if (n.op === 'act') {
        const cost = CPU_COST[n.action] || 5;
        if (budget.cpu - cost < 0) return;
        budget.cpu -= cost;
        runAction(n.action, n.args, ctx, rune, budget);
      } else if (n.op === 'if') {
        const ok = evalCond(n.cond, ctx);
        executeList(ok ? n.body : (n.elseBody || []), ctx, rune, budget);
      } else if (n.op === 'repeat') {
        for (let i=0;i<n.n;i++) executeList(n.body, ctx, rune, budget);
      }
    }
  }

  function runAction(action, args, ctx, rune, budget) {
    const player = ctx.player;
    const room = ctx.room;
    const now = (window.Game ? Game.playTime : 0);

    const chanceRoll = Math.random() * 100;
    const chanceReq = (typeof args.chance === 'number') ? args.chance : null;
    if (chanceReq !== null && chanceRoll > chanceReq) return;

    // Small extra mana cost for scripted actions on cast (prevents exploits but stays light)
    if (ctx.eventName === 'OnCast' && player) {
      let extra = 0;
      const cnt = (typeof args.count === 'number') ? Math.max(1, Math.floor(args.count)) : 1;
      const dmg = (typeof args.damage === 'number') ? args.damage : 6;
      switch (action) {
        case 'SpawnProjectile':
          extra = 0.10 + 0.12 * cnt + 0.01 * Math.min(20, dmg);
          break;
        case 'ApplyStatus':
          extra = 0.18;
          break;
        case 'Chain':
        case 'Bounce':
        case 'Pierce':
          extra = 0.16;
          break;
        case 'Explode':
          extra = 0.25;
          break;
        case 'Heal':
        case 'Shield':
          extra = 0.22;
          break;
        case 'Summon':
          extra = 0.30;
          break;
      }
      extra = Math.min(1.2, Math.max(0, extra));
      if ((player.mana || 0) < extra) return;
      player.mana -= extra;
    }

    // Convenience defaults
    const damage = (typeof args.damage === 'number') ? args.damage : 6;
    const count = (typeof args.count === 'number') ? Math.max(1, Math.floor(args.count)) : 1;
    const range = (typeof args.range === 'number') ? args.range : 300;

    if (action === 'SpawnProjectile') {
      const spread = (typeof args.spread === 'number') ? args.spread : 10;
      const speed = (typeof args.speed === 'number') ? args.speed : (player ? player.getProjectileSpeed() : 240);
      const angleBase = (typeof ctx.angle === 'number') ? ctx.angle : 0;

      for (let i=0;i<count;i++) {
        if (!canSpawn(rune, now)) return;
        const off = (i - (count-1)/2) * (spread * Math.PI/180);
        Game.spawnProjectile(player.centerX, player.centerY, angleBase + off, damage, speed, range, 'player', [], {});
      }
      return;
    }

    if (action === 'ApplyStatus') {
      const target = ctx.target;
      if (!target) return;
      const type = String(args.type || 'burn');
      if (type === 'burn') { target.burnDuration = (args.duration||3); target.burnDamage = (args.damage||4); }
      if (type === 'poison') { target.poisonDuration = (args.duration||4); target.poisonDamage = (args.damage||4); }
      if (type === 'slow') { target.slowDuration = (args.duration||2); target.slowAmount = (args.amount||0.5); }
      return;
    }

    if (action === 'Explode') {
      const target = ctx.target;
      if (!target || !room) return;
      const radius = (typeof args.radius === 'number') ? args.radius : 70;
      const dmg = (typeof args.damage === 'number') ? args.damage : 18;
      for (const e of room.enemies) {
        if (!e.active) continue;
        const d = Utils.distance(target.centerX, target.centerY, e.centerX, e.centerY);
        if (d <= radius) e.takeDamage(dmg, 0, 40);
      }
      ParticleSystem.burst(target.centerX, target.centerY, 10, { color:'#ffcc55', life:0.25, size:4, speed:2 });
      return;
    }

    if (action === 'Heal') {
      if (!player) return;
      const amt = (typeof args.amount === 'number') ? args.amount : 10;
      player.heal(Math.floor(amt));
      return;
    }

    if (action === 'Shield') {
      if (!player) return;
      const amt = (typeof args.amount === 'number') ? args.amount : 18;
      player.shield = (player.shield || 0) + Math.floor(amt);
      player.shieldTimer = Math.max(player.shieldTimer || 0, (typeof args.duration === 'number') ? args.duration : 4);
      ParticleSystem.burst(player.centerX, player.centerY, 8, { color:'#77bbff', life:0.3, size:3, speed:2 });
      return;
    }

    if (action === 'Chain') {
      // A light chain: on hit, deal reduced damage to nearest enemies
      if (!ctx.target || !room) return;
      const n = Math.min(4, Math.max(1, Math.floor(args.count || 2)));
      const r = (typeof args.range === 'number') ? args.range : 120;
      let cur = ctx.target;
      for (let i=0;i<n;i++) {
        let best = null, bd = 1e9;
        for (const e of room.enemies) {
          if (!e.active || e === cur) continue;
          const d = Utils.distance(cur.centerX, cur.centerY, e.centerX, e.centerY);
          if (d < bd && d <= r) { bd = d; best = e; }
        }
        if (!best) break;
        best.takeDamage(Math.max(2, Math.floor(damage * 0.6)), 0, 30);
        ParticleSystem.burst(best.centerX, best.centerY, 4, { color:'#88ddff', life:0.2, size:2, speed:2 });
        cur = best;
      }
      return;
    }

    if (action === 'Pierce') {
      // supported via projectile runeData in base game; here we bump player's temporary pierce for next cast
      if (!player) return;
      player._scriptPierce = Math.min(5, (player._scriptPierce || 0) + Math.floor(args.count || 1));
      return;
    }

    if (action === 'Bounce') {
      if (!player) return;
      player._scriptBounce = Math.min(4, (player._scriptBounce || 0) + Math.floor(args.count || 1));
      return;
    }

    if (action === 'Summon') {
      if (!room) return;
      const type = String(args.type || 'wisp');
      const n = Math.min(2, Math.max(1, Math.floor(args.count || 1)));
      for (let i=0;i<n;i++) {
        room.enemies.push(createEnemy(type, player.centerX + Utils.random(-60,60), player.centerY + Utils.random(-40,40), 0.8));
      }
      return;
    }
  }

  function trigger(eventName, ctx) {
    if (!ctx || !ctx.player) return;
    const player = ctx.player;
    const now = (window.Game ? Game.playTime : 0);

    for (const rune of (player.runes || [])) {
      if (!rune || rune.id !== 'empty_rune' || !rune.programmed || !rune.script) continue;

      const st = ensureState(rune);

      // Event-specific anti-spam
      if (eventName === 'OnCast') {
        if (now - st.lastCastAt < MIN_CAST_COOLDOWN) continue;
        st.lastCastAt = now;
      }

      const list = rune.script[eventName];
      if (!list || !list.length) continue;

      const budget = { cpu: MAX_CPU_PER_EVENT };
      const vars = {
        mana: player.mana || 0,
        cooldown: 0,
        stacks: st.stacks || 0,
        chance: 0,
        range: 300,
        damage: ctx.damage || 0,
        count: 1,
      };

      const localCtx = { ...ctx, eventName, vars, chance: Math.random() * 100 };
      executeList(list, localCtx, rune, budget);
    }
  }

  const templates = {
    double_cast: `OnCast:
  SpawnProjectile damage=4 count=1 spread=12`,
    burn_on_hit: `OnHit:
  ApplyStatus type=burn damage=5 duration=2 chance=35`,
    rare_explode: `OnHit:
  if chance < 10:
    Explode radius=70 damage=20`,
    shield_on_damage: `OnDamageTaken:
  Shield amount=22 duration=4 chance=40`,
  };

  window.RuneScript = {
    compile,
    analyze,
    trigger,
    getDocsHTML,
    templates,
    limits: { MAX_LINES, MAX_CPU_PER_EVENT, MAX_REPEAT, MAX_SPAWNS_PER_SEC, MIN_CAST_COOLDOWN },
    caps: ACTION_CAPS
  };
})();
