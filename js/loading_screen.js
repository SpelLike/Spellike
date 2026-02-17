// ==========================================
// SPELLIKE - Startup Loading Screen (22s)
// Cycles through translated messages while blocking input.
// ==========================================

(function () {
  const TOTAL_MS = 22000;
  const STEP_MS = 2000; // 11 messages * 2s = 22s

  // 3-phase status (keeps it simple + feels more “real”)
  const PHASE_MS = Math.floor(TOTAL_MS / 3);

  // Tiny SFX (no external assets). Will be silent if audio isn't unlocked.
  let _audioCtx = null;
  function blip(freq, ms, gain){
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!_audioCtx) _audioCtx = new AC();
      if (_audioCtx.state === 'suspended') {
        // try resume, may still be blocked by browser policy
        _audioCtx.resume().catch(()=>{});
      }
      const o = _audioCtx.createOscillator();
      const g = _audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(_audioCtx.destination);
      o.start();
      setTimeout(()=>{ try{ o.stop(); }catch(e){} }, ms);
    } catch(e){}
  }

  function getLang() {
    try {
      if (window.i18n && typeof window.i18n.getCurrentLang === 'function') {
        const l = window.i18n.getCurrentLang();
        if (l === 'es' || l === 'en') return l;
      }
    } catch (e) {}
    // Fallback: HTML lang attr
    try {
      const l = (document.documentElement && document.documentElement.lang) || 'en';
      if (l === 'es' || l === 'en') return l;
    } catch (e) {}
    return 'en';
  }

  function getSequence(lang) {
    try {
      const t = window.Translations && window.Translations[lang];
      if (t && Array.isArray(t.loadingSequence) && t.loadingSequence.length) {
        return t.loadingSequence.slice();
      }
    } catch (e) {}

    // Hard fallback (shouldn't be needed)
    return lang === 'es'
      ? [
          'Cargando',
          'Cargando Dungeons',
          'Cargando Bosses',
          'Error',
          'Preguntando a la IA por el error',
          'La IA no supo responder',
          'Entro en crisis',
          'Ayuda por favor',
          'Ya encontré el error',
          'Me faltaba un ;',
          'Dios dame paciencia'
        ]
      : [
          'Loading',
          'Loading Dungeons',
          'Loading Bosses',
          'Error',
          'Asking the AI about the error',
          "The AI couldn't answer",
          'Having a meltdown',
          'Help, please',
          'Found the error',
          'I was missing a ;',
          'God, give me patience'
        ];
  }

  function getPhases(lang){
    try{
      const t = window.Translations && window.Translations[lang];
      if (t && Array.isArray(t.loadingPhases) && t.loadingPhases.length === 3) {
        return t.loadingPhases.slice();
      }
    }catch(e){}
    return lang === 'es'
      ? ['Inicializando UI', 'Cargando assets', 'Preparando dungeon']
      : ['Initializing UI', 'Loading assets', 'Preparing dungeon'];
  }

  function phaseIndexByTime(ms){
    if (ms < PHASE_MS) return 0;
    if (ms < PHASE_MS * 2) return 1;
    return 2;
  }

  function start() {
    const overlay = document.getElementById('loading-screen');
    const textEl = document.getElementById('loading-text');
    const msgEl = document.getElementById('loading-message') || textEl;
    const phaseEl = document.getElementById('loading-phase');
    if (!overlay || !textEl || !msgEl) return;

    // Ensure it blocks clicks/inputs
    overlay.classList.add('active');
    // Prevent other UI code from hiding this overlay during the 22s startup sequence
    try { overlay.dataset.startupLock = '1'; } catch (e) {}

    const lang = getLang();
    const seq = getSequence(lang);
    const phases = getPhases(lang);

    // Parallax (subtle) - only while the overlay is visible
    function onMove(ev){
      try{
        const r = overlay.getBoundingClientRect();
        const cx = r.left + r.width/2;
        const cy = r.top + r.height/2;
        const dx = (ev.clientX - cx) / (r.width/2);
        const dy = (ev.clientY - cy) / (r.height/2);
        overlay.style.setProperty('--px', String(dx * 10));
        overlay.style.setProperty('--py', String(dy * 10));
      }catch(e){}
    }
    window.addEventListener('mousemove', onMove, { passive: true });

    // Set initial phase
    try{ if (phaseEl) phaseEl.textContent = phases[0] || ''; }catch(e){}

    function setMessage(s){
      try{ msgEl.textContent = s; }catch(e){}
      // Glitch ONLY on the explicit “Error…” line
      if (/^error\s*\.*$/i.test(String(s))) {
        try{
          textEl.classList.remove('fx-glitch');
          void textEl.offsetWidth;
          textEl.classList.add('fx-glitch');
          setTimeout(()=>textEl.classList.remove('fx-glitch'), 460);
        } catch(e) {}
        // slightly harsher blip on the error moment
        blip(220, 70, 0.015);
      } else {
        // tiny, subtle blip per message change
        blip(620, 35, 0.006);
      }
    }

    let idx = 0;
    setMessage(seq[idx] || (lang === 'es' ? 'Cargando' : 'Loading'));

    const interval = setInterval(() => {
      idx++;
      if (idx < seq.length) {
        setMessage(seq[idx]);
      }
    }, STEP_MS);

    // Phase updater (3 steps across 22s)
    const t0 = performance.now();
    const phaseTimer = setInterval(() => {
      const elapsed = Math.max(0, performance.now() - t0);
      const pIdx = phaseIndexByTime(elapsed);
      try{ if (phaseEl) phaseEl.textContent = phases[pIdx] || ''; }catch(e){}
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      clearInterval(phaseTimer);
      try{ window.removeEventListener('mousemove', onMove); }catch(e){}

      // Release startup lock, then hide overlay
      try { delete overlay.dataset.startupLock; } catch (e) {}
      // Hide overlay
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      // Keep DOM but remove from layout just in case
      overlay.style.display = 'none';

      // soft “done” blip
      blip(880, 55, 0.008);
    }, TOTAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
