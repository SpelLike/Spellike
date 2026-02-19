// ==========================================
// ARCANE DEPTHS – Skill Tree UI (v3.0 FIXED)
// ==========================================
// Arquitectura de centrado:
//   viewport (overflow:hidden, position:relative)
//     └── st-sizer (position:absolute, tamaño = árbol escalado, centrado via JS)
//           └── st-inner (position:absolute top:0 left:0, solo tiene el scale)
//                 └── svg + nodes
//
// Por qué: CSS con !important en top/left de st-inner NO puede ser sobreescrito
// por JS inline styles. La solución es centrar el PADRE (st-sizer) que no tiene
// !important, y dejar que st-inner esté en 0,0 dentro de él.
// ==========================================

(function () {

    const SkillTreeUI = {
        activeCategory: 'combat',
        _mounted: false,
        _nodeEls: {},
        _confirmReset: false,
        _layoutCache: { combat: null, passive: null },
        _didFit: { combat: false, passive: false },

        init() {
            if (this._mounted) return;
            this._buildScreen();
            this._mounted = true;
            SkillTree.onChange(() => this.refresh());
            window.addEventListener('resize', () => {
                const nodes = this._getLayoutNodes(this.activeCategory);
                if (nodes && nodes.length) requestAnimationFrame(() => this._applyStaticScale(nodes));
            });
        },

        _getLayoutNodes(cat) {
            // Cache: stable layout that doesn't jump after buying.
            if (this._layoutCache[cat]) return this._layoutCache[cat];

            const raw = SkillTreeData.byCategory(cat) || [];
            const nodes = raw.map(n => ({ ...n }));

            // Assign visual tier (0..13) from SkillTree.
            for (const n of nodes) n.vt = SkillTree.getVisualTier(n.id);

            // Group by visual tier.
            const groups = {};
            for (const n of nodes) {
                if (!groups[n.vt]) groups[n.vt] = [];
                groups[n.vt].push(n);
            }

            // Find max nodes per tier to define a consistent tree width.
            let maxCount = 1;
            for (const k of Object.keys(groups)) {
                maxCount = Math.max(maxCount, groups[k].length);
            }

            const NODE = 72;
            const PAD_X = 120;
            const TOP_PAD = 40;
            const ROW_SPACING = 105;
            const GAP = 24;

            const rowWidth = Math.max(950, maxCount * (NODE + GAP));
            const centerX = PAD_X + rowWidth / 2;

            // Layout each tier as a single row.
            for (let vt = 0; vt < 14; vt++) {
                const row = groups[vt] || [];
                row.sort((a, b) => (a.tier - b.tier) || (a.x - b.x) || a.id.localeCompare(b.id));

                const y = TOP_PAD + vt * ROW_SPACING;
                if (row.length === 1) {
                    row[0].x = Math.round(centerX - NODE / 2);
                    row[0].y = y;
                    continue;
                }

                const denom = Math.max(1, row.length - 1);
                for (let i = 0; i < row.length; i++) {
                    const x = PAD_X + (i * rowWidth / denom);
                    row[i].x = Math.round(x);
                    row[i].y = y;
                }
            }

            this._layoutCache[cat] = nodes;
            return nodes;
        },

        _buildScreen() {
            const screen = document.getElementById('skilltree-screen');
            if (!screen) return;
            screen.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'st-header';
            header.innerHTML = `
                <div class="st-title-row">
                    <h2 class="st-title" id="st-title-text"></h2>
                    <div class="st-essence-display">
                        <span class="st-essence-icon">✨</span>
                        <span class="st-essence-label" id="st-essence-label"></span>
                        <span class="st-essence-val" id="st-essence-val">0</span>
                    </div>
                </div>
                <div class="st-tabs">
                    <button class="st-tab active" data-cat="combat" id="st-tab-combat"></button>
                    <button class="st-tab" data-cat="passive" id="st-tab-passive"></button>
                </div>
                <div class="st-subinfo"><span id="st-nodes-info"></span></div>
            `;
            screen.appendChild(header);

            const viewport = document.createElement('div');
            viewport.id = 'st-viewport';
            viewport.className = 'st-viewport';

            // st-sizer: NO tiene CSS !important en top/left.
            // JS puede moverlo libremente para centrar el árbol.
            const sizer = document.createElement('div');
            sizer.id = 'st-sizer';

            // st-inner: siempre en top:0 left:0 dentro del sizer.
            // Solo tiene el transform scale aplicado por JS.
            const inner = document.createElement('div');
            inner.id = 'st-inner';

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'st-svg';
            inner.appendChild(svg);

            const nodesDiv = document.createElement('div');
            nodesDiv.id = 'st-nodes';
            inner.appendChild(nodesDiv);

            sizer.appendChild(inner);
            viewport.appendChild(sizer);

            // Zoom hint
            const zoomHint = document.createElement('div');
            zoomHint.className = 'st-zoom-hint';
            zoomHint.textContent = '🖱️ Scroll para zoom • Alt+drag para mover';
            viewport.appendChild(zoomHint);

            screen.appendChild(viewport);

            const tooltip = document.createElement('div');
            tooltip.id = 'st-tooltip';
            tooltip.className = 'st-tooltip hidden';
            screen.appendChild(tooltip);

            const footer = document.createElement('div');
            footer.className = 'st-footer';
            footer.innerHTML = `
                <button class="st-btn-reset menu-btn small" id="st-btn-reset"></button>
                <button class="menu-btn small" id="st-btn-back"></button>
            `;
            screen.appendChild(footer);

            this._bindHeaderEvents();
        },

        _bindHeaderEvents() {
            document.querySelectorAll('.st-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.AudioManager) AudioManager.play('menuClick');
                    this.activeCategory = btn.dataset.cat;
                    // Fit again on category switch.
                    this._didFit[this.activeCategory] = false;
                    document.querySelectorAll('.st-tab').forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                    this.renderCategory();
                });
            });

            // Zoom with mouse wheel
            this._zoom = 1.0;
            this._panX = 0;
            this._panY = 0;
            this._dragging = false;
            this._dragStart = null;

            setTimeout(() => {
                const vp = document.getElementById('st-viewport');
                if (!vp) return;
                vp.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? 0.9 : 1.1;
                    this._zoom = Math.max(0.15, Math.min(2.5, this._zoom * delta));
                    this._applyZoom();
                }, { passive: false });
                vp.addEventListener('mousedown', (e) => {
                    if (e.button === 1 || (e.button === 0 && e.altKey)) {
                        e.preventDefault();
                        this._dragging = true;
                        this._dragStart = { x: e.clientX - this._panX, y: e.clientY - this._panY };
                        vp.style.cursor = 'grabbing';
                    }
                });
                window.addEventListener('mousemove', (e) => {
                    if (!this._dragging || !this._dragStart) return;
                    this._panX = e.clientX - this._dragStart.x;
                    this._panY = e.clientY - this._dragStart.y;
                    this._applyZoom();
                });
                window.addEventListener('mouseup', () => {
                    this._dragging = false;
                    const vp2 = document.getElementById('st-viewport');
                    if (vp2) vp2.style.cursor = '';
                });
            }, 100);

            const back = document.getElementById('st-btn-back');
            if (back) back.addEventListener('click', () => {
                if (window.AudioManager) AudioManager.play('menuClick');
                if (window.UI) UI.showScreen('main-menu');
            });

            const resetBtn = document.getElementById('st-btn-reset');
            if (resetBtn) resetBtn.addEventListener('click', () => {
                if (!this._confirmReset) {
                    this._confirmReset = true;
                    resetBtn.classList.add('st-confirm');
                    setTimeout(() => {
                        this._confirmReset = false;
                        resetBtn?.classList.remove('st-confirm');
                        this._updateTexts();
                    }, 3000);
                    this._updateTexts();
                    return;
                }
                if (window.AudioManager) AudioManager.play('menuClick');
                SkillTree.reset();
                this._confirmReset = false;
                resetBtn.classList.remove('st-confirm');
                this.refresh();
            });
        },

        _applyZoom() {
            const inner    = document.getElementById('st-inner');
            const sizer    = document.getElementById('st-sizer');
            const viewport = document.getElementById('st-viewport');
            if (!inner || !sizer || !viewport) return;
            const vw = viewport.clientWidth  || 800;
            const vh = viewport.clientHeight || 500;
            const tw = parseInt(inner.style.width)  || 3800;
            const th = parseInt(inner.style.height) || 1200;
            const scaledW = Math.round(tw * this._zoom);
            const scaledH = Math.round(th * this._zoom);
            inner.style.transformOrigin = 'top left';
            inner.style.transform = 'scale(' + this._zoom + ')';
            sizer.style.width  = scaledW + 'px';
            sizer.style.height = scaledH + 'px';
            sizer.style.position = 'absolute';
            const baseLeft = Math.max(0, Math.round((vw - scaledW) / 2));
            sizer.style.left = (baseLeft + this._panX) + 'px';
            sizer.style.top  = Math.max(0, (10 + this._panY)) + 'px';
        },

        // Centra y escala el árbol dentro del viewport.
        _applyStaticScale(nodes) {
            const sizer    = document.getElementById('st-sizer');
            const inner    = document.getElementById('st-inner');
            const viewport = document.getElementById('st-viewport');
            if (!sizer || !inner || !viewport) return;

            let maxX = 0, maxY = 0;
            for (const n of nodes) {
                if (n.x > maxX) maxX = n.x;
                if (n.y > maxY) maxY = n.y;
            }
            const NODE  = 72;
            const PAD   = 80;
            const treeW = maxX + NODE + PAD;
            const treeH = maxY + NODE + PAD;

            const vw = viewport.clientWidth  || 800;

            // Set tree dimensions on inner
            inner.style.width  = treeW + 'px';
            inner.style.height = treeH + 'px';

            // Reset pan and calculate initial zoom to fit width
            this._panX = 0;
            this._panY = 0;
            this._zoom = Math.max(0.12, Math.min(0.9, (vw - 40) / treeW));

            // Enable scroll
            viewport.style.overflowY = 'auto';
            viewport.style.overflowX = 'hidden';

            this._applyZoom();
        },

        open() {
            this.init();
            this._updateTexts();
            this.renderCategory();
        },

        refresh() {
            this._updateTexts();
            const nodes = this._getLayoutNodes(this.activeCategory);
            if (!nodes || !nodes.length) return;
            for (const node of nodes) {
                const el = this._nodeEls[node.id];
                if (!el) continue;
                const state  = SkillTree.getState(node.id);
                el.dataset.state = state;
                el.className = 'st-node st-node--' + state;
                const costEl = el.querySelector('.st-node-cost');
                if (costEl) {
                    if (state === 'owned')        costEl.textContent = '✓';
                    else costEl.textContent = SkillTreeData.getCost(node) + ' ✨';
                }
                // Tier label (visual tier)
                const tierEl = el.querySelector('.st-node-tier');
                if (tierEl) tierEl.textContent = 'T' + (node.vt ?? SkillTree.getVisualTier(node.id));
            }
            this._drawConnections(nodes);
            // IMPORTANT: don't reset pan/zoom after each purchase.
            requestAnimationFrame(() => this._applyZoom());
        },

        renderCategory() {
            const nodesDiv = document.getElementById('st-nodes');
            const svg      = document.getElementById('st-svg');
            if (!nodesDiv || !svg) return;

            nodesDiv.innerHTML = '';
            svg.innerHTML = '';
            this._nodeEls = {};

            const nodes = this._getLayoutNodes(this.activeCategory);
            let maxX = 0, maxY = 0;
            for (const n of nodes) {
                if (n.x > maxX) maxX = n.x;
                if (n.y > maxY) maxY = n.y;
            }
            const NODE = 72, PAD = 80;
            const W = maxX + NODE + PAD;
            const H = maxY + NODE + PAD;

            svg.setAttribute('width', W);
            svg.setAttribute('height', H);
            svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
            nodesDiv.style.width  = W + 'px';
            nodesDiv.style.height = H + 'px';

            this._drawConnections(nodes);
            for (const node of nodes) {
                const el = this._buildNodeEl(node);
                nodesDiv.appendChild(el);
                this._nodeEls[node.id] = el;
            }

            // Fit only the first time (or after category switch).
            requestAnimationFrame(() => {
                if (!this._didFit[this.activeCategory]) {
                    this._applyStaticScale(nodes);
                    this._didFit[this.activeCategory] = true;
                } else {
                    this._applyZoom();
                }
            });
        },

        _drawConnections(nodes) {
            const svg = document.getElementById('st-svg');
            if (!svg) return;
            svg.innerHTML = '<defs><filter id="glow-line"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

            const nodeMap = {};
            for (const n of nodes) nodeMap[n.id] = n;

            const cat = this.activeCategory;
            const unlocked = SkillTree.getUnlockedTier(cat);

            // Draw clean tier-to-tier connections (not prereq-based).
            for (let vt = 1; vt < 14; vt++) {
                if (vt > unlocked + 1) continue; // avoid clutter
                const curIds = SkillTree.getTierIds(cat, vt);
                const prevIds = SkillTree.getTierIds(cat, vt - 1);
                if (!curIds.length || !prevIds.length) continue;

                const denomCur = Math.max(1, curIds.length - 1);
                const denomPrev = Math.max(1, prevIds.length - 1);

                for (let i = 0; i < curIds.length; i++) {
                    const childId = curIds[i];
                    const parentIndex = Math.round(i * denomPrev / denomCur);
                    const parentId = prevIds[parentIndex];
                    const child = nodeMap[childId];
                    const parent = nodeMap[parentId];
                    if (!child || !parent) continue;

                    const childOwned = SkillTree.isOwned(childId);
                    const childState = SkillTree.getState(childId);

                    let strokeColor = '#2b223f', strokeWidth = 1.25;
                    if (childOwned) { strokeColor = '#a78bfa'; strokeWidth = 3; }
                    else if (childState === 'available') { strokeColor = '#6d59a0'; strokeWidth = 2; }
                    else { strokeColor = '#3a2d5a'; strokeWidth = 1.25; }

                    const half = 36;
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', parent.x + half); line.setAttribute('y1', parent.y + half);
                    line.setAttribute('x2', child.x  + half); line.setAttribute('y2', child.y  + half);
                    line.setAttribute('stroke', strokeColor);
                    line.setAttribute('stroke-width', strokeWidth);
                    if (childOwned) line.setAttribute('filter', 'url(#glow-line)');
                    svg.appendChild(line);
                }
            }
        },

        _buildNodeEl(node) {
            const state = SkillTree.getState(node.id);
            const el    = document.createElement('div');
            el.className    = 'st-node st-node--' + state;
            el.dataset.id   = node.id;
            el.style.left   = node.x + 'px';
            el.style.top    = node.y + 'px';
            el.style.position = 'absolute';

            const cost = SkillTreeData.getCost(node);
            const txt  = this._getNodeText(node.id);
            let costLabel = cost + ' ✨';
            if (state === 'owned')   costLabel = '✓';
            if (state === 'blocked') costLabel = '✗';

            const vtLabel = (node.vt ?? SkillTree.getVisualTier(node.id));
            el.innerHTML = '<div class="st-node-tier">T' + vtLabel + '</div>' +
                '<div class="st-node-icon">' + node.icon + '</div>' +
                '<div class="st-node-name">' + txt.name + '</div>' +
                '<div class="st-node-cost">' + costLabel + '</div>';

            el.addEventListener('mouseenter', (e) => this._showTooltip(node, e));
            el.addEventListener('mouseleave', () => this._hideTooltip());
            el.addEventListener('mousemove',  (e) => this._moveTooltip(e));
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (SkillTree.getState(node.id) === 'available') this._tryBuy(node.id, el);
            });
            return el;
        },

        _tryBuy(id, el) {
            const result = SkillTree.buy(id);
            if (result.ok) {
                if (window.AudioManager) AudioManager.play('itemPickup');
                el.classList.add('st-node--pop');
                setTimeout(() => el.classList.remove('st-node--pop'), 400);
                this.refresh();
            } else {
                el.classList.add('st-node--shake');
                setTimeout(() => el.classList.remove('st-node--shake'), 500);
                if (window.AudioManager) AudioManager.play('menuClick');
            }
        },

        _showTooltip(node, e) {
            const tip = document.getElementById('st-tooltip');
            if (!tip) return;
            const txt   = this._getNodeText(node.id);
            const state = SkillTree.getState(node.id);
            const cost  = SkillTreeData.getCost(node);
            const mods  = node.effects || {};
            const t = (k) => window.i18n ? i18n.t(k) : k;
            let stateLabel = '';
            if (state === 'owned')     stateLabel = '<span class="tip-state owned">' + t('stOwned') + '</span>';
            if (state === 'blocked')   stateLabel = '<span class="tip-state blocked">' + t('stBlocked') + '</span>';
            if (state === 'locked')    stateLabel = '<span class="tip-state locked">' + t('stLocked') + '</span>';
            if (state === 'available') stateLabel = '<span class="tip-state available">' + cost + ' ✨</span>';
            const effectLines = [];
            for (const [key, val] of Object.entries(mods)) {
                if (key === 'phoenixPassive' && val) { effectLines.push(t('stEffectPhoenix')); continue; }
                if (typeof val !== 'number' || val === 0) continue;
                const label = this._effectLabel(key, val);
                if (label) effectLines.push(label);
            }
            const prereqStr    = node.prereq.map(r => { const n = SkillTreeData.getNode(r); return n ? this._getNodeText(r).name : r; }).join(', ');
            const prereqAnyStr = (node.prereqAny || []).map(r => { const n = SkillTreeData.getNode(r); return n ? this._getNodeText(r).name : r; }).join(', ');
            const exclStr      = node.excl.map(r => { const n = SkillTreeData.getNode(r); return n ? this._getNodeText(r).name : r; }).join(', ');
            tip.innerHTML =
                '<div class="tip-header"><span class="tip-icon">' + node.icon + '</span>' +
                '<span class="tip-name">' + txt.name + '</span>' + stateLabel + '</div>' +
                '<div class="tip-desc">' + txt.desc + '</div>' +
                (effectLines.length ? '<div class="tip-effects">' + effectLines.map(l => '<div class="tip-effect">▸ ' + l + '</div>').join('') + '</div>' : '') +
                (prereqStr    ? '<div class="tip-meta"><span class="tip-meta-label">' + t('stReq') + ':</span> ' + prereqStr + '</div>' : '') +
                (prereqAnyStr ? '<div class="tip-meta"><span class="tip-meta-label">' + t('stReqAny') + ':</span> ' + prereqAnyStr + '</div>' : '') +
                (exclStr      ? '<div class="tip-excl"><span class="tip-meta-label">⚔️ ' + t('stExcl') + ':</span> ' + exclStr + '</div>' : '') +
                '<div class="tip-tier">' + t('stTier') + ' ' + node.tier + '</div>';
            tip.classList.remove('hidden');
            this._moveTooltip(e);
        },

        _hideTooltip() {
            const tip = document.getElementById('st-tooltip');
            if (tip) tip.classList.add('hidden');
        },

        _moveTooltip(e) {
            const tip = document.getElementById('st-tooltip');
            if (!tip || tip.classList.contains('hidden')) return;
            const screen = document.getElementById('skilltree-screen');
            const rect = screen ? screen.getBoundingClientRect() : { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
            let x = e.clientX - rect.left + 16;
            let y = e.clientY - rect.top  + 16;
            const tw = tip.offsetWidth || 220, th = tip.offsetHeight || 140;
            if (x + tw > rect.width)  x -= tw + 32;
            if (y + th > rect.height) y -= th + 32;
            tip.style.left = Math.max(0, x) + 'px';
            tip.style.top  = Math.max(0, y) + 'px';
        },

        _effectLabel(key, val) {
            const t    = (k) => window.i18n ? i18n.t(k) : k;
            const sign = val >= 0 ? '+' : '';
            const pct  = (v) => sign + (v * 100).toFixed(1) + '%';
            const flat = (v) => sign + Math.round(v);
            const map = {
                damagePct:           () => t('stEffDmg') + ' ' + pct(val),
                fireRatePct:         () => val < 0 ? t('stEffFireRate') + ' ' + pct(-val) + ' ' + t('stFaster') : t('stEffFireRate') + ' ' + pct(val) + ' ' + t('stSlower'),
                projSpeedPct:        () => t('stEffProjSpeed') + ' ' + pct(val),
                projRangePct:        () => t('stEffProjRange') + ' ' + pct(val),
                moveSpeedPct:        () => t('stEffMoveSpeed') + ' ' + pct(val),
                critChancePct:       () => t('stEffCrit') + ' ' + pct(val),
                critDmgPct:          () => t('stEffCritDmg') + ' ' + pct(val),
                chainHitPct:         () => t('stEffChain') + ' ' + pct(val),
                doubleShotChancePct: () => t('stEffDoubleShot') + ' ' + pct(val),
                manaCostPct:         () => val < 0 ? t('stEffManaCost') + ' ' + pct(-val) + ' ' + t('stLess') : t('stEffManaCost') + ' ' + pct(val) + ' ' + t('stMore'),
                maxManaFlat:         () => t('stEffMaxMana') + ' ' + flat(val),
                maxHpFlat:           () => t('stEffMaxHp') + ' ' + flat(val),
                hpRegenPerSec:       () => t('stEffHpRegen') + ' +' + val.toFixed(1) + '/s',
                dmgReductionPct:     () => t('stEffDmgRed') + ' ' + pct(val),
                lifeStealPct:        () => t('stEffLifesteal') + ' ' + pct(val),
                reflectDmgPct:       () => t('stEffReflect') + ' ' + pct(val),
                luckPct:             () => t('stEffLuck') + ' ' + pct(val),
                goldPct:             () => t('stEffGold') + ' ' + pct(val),
                startGoldFlat:       () => t('stEffStartGold') + ' +' + flat(val),
                startPotionsFlat:    () => t('stEffStartPot') + ' +' + flat(val),
                shopSlotsBonus:      () => val > 0 ? t('stEffShopSlot') + ' +' + flat(val) : null,
                shopRerollsBonus:    () => val > 0 ? t('stEffShopReroll') + ' +' + flat(val) : null,
                dashChargesBonus:    () => val > 0 ? t('stEffDashCharge') + ' +' + flat(val) : null,
                dashCooldownPct:     () => val < 0 ? t('stEffDashCD') + ' ' + pct(-val) + ' ' + t('stFaster') : null,
            };
            const fn = map[key];
            return fn ? fn() : null;
        },

        _getNodeText(id) {
            const node = SkillTreeData.getNode(id);
            if (!node) return { name: id, desc: '' };
            if (window.i18n && typeof i18n.t === 'function') {
                return { name: i18n.t(node.nameKey) || id, desc: i18n.t(node.descKey) || '' };
            }
            return { name: id, desc: '' };
        },

        _updateTexts() {
            const t   = (k) => window.i18n ? i18n.t(k) : k;
            const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
            set('st-title-text', t('stTitle'));
            set('st-essence-label', t('metaEssence') + ':');
            set('st-essence-val', window.Meta ? Meta.getEssence() : 0);
            set('st-tab-combat',  t('stCatCombat'));
            set('st-tab-passive', t('stCatPassive'));
            const infoEl = document.getElementById('st-nodes-info');
            if (infoEl) {
                const ownedC = SkillTree.ownedByCategory('combat');
                const ownedP = SkillTree.ownedByCategory('passive');
                const totalC = SkillTreeData.byCategory('combat').length;
                const totalP = SkillTreeData.byCategory('passive').length;
                infoEl.textContent = t('stCatCombat') + ': ' + ownedC + '/' + totalC + '  |  ' + t('stCatPassive') + ': ' + ownedP + '/' + totalP + '  |  ' + t('stSpent') + ': ' + SkillTree.totalSpent() + ' ✨';
            }
            const resetBtn = document.getElementById('st-btn-reset');
            if (resetBtn) resetBtn.textContent = this._confirmReset ? t('stResetConfirm') : t('stReset') + ' (↩ ' + t('stResetRefund') + ')';
            const backBtn = document.getElementById('st-btn-back');
            if (backBtn) backBtn.textContent = t('btnBack');
        },

        _el(tag, cls) {
            const el = document.createElement(tag);
            if (cls) el.className = cls;
            return el;
        },
    };

    window.SkillTreeUI = SkillTreeUI;
})();
