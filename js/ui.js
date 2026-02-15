// ==========================================
// ARCANE DEPTHS - UI Manager (MAJOR UPDATE)
// ==========================================

const UI = {
    screens: {},
    currentScreen: 'main-menu',
    previousScreen: null, // Para volver correctamente desde ajustes
    selectedSlot: null,
    selectedDifficulty: 'normal',
    runeTooltip: null,
    lootModal: null,
    shopModal: null,
    _hudRuneSlots: 0,
    _hudActiveSlots: 0,
    codexOpen: false,
    codexReturn: 'game',
    synergyPanelVisible: false,
    synergyAlwaysVisible: false,

    init() {
        this.screens = {
            'main-menu': document.getElementById('main-menu'),
            'feedback-screen': document.getElementById('feedback-screen'),
            'meta-screen': document.getElementById('meta-screen'),
            'slot-select': document.getElementById('slot-select'),
            'difficulty-select': document.getElementById('difficulty-select'),
            'settings-screen': document.getElementById('settings-screen'),
            'game-screen': document.getElementById('game-screen'),
            'updates-screen': document.getElementById('updates-screen'), // New screen
        };

        this.setupMenuEvents();
        this.setupMetaEvents();
        this.setupFeedbackEvents();
        this.setupSettingsEvents();
        this.setupSlotEvents();
        this.setupDifficultyEvents();
        this.setupGameUIEvents();
        this.setupCodexEvents();
        this.setupRuneTooltips();
        this.setupUpdatesEvents(); // New events

        // Global escape to close blocking modals (prevents "stuck" shop on small screens)
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            // Close in priority order
            if (this.shopModal) { this.closeShop(); return; }
            if (this.lootModal) { this.closeLootModal(); return; }
            // Settings screen is navigated via buttons; do not force-close other screens here.
        });

        // Load synergy setting
        const savedSynergy = localStorage.getItem('synergyAlwaysVisible');
        if (savedSynergy !== null) {
            this.synergyAlwaysVisible = savedSynergy === 'true';
        }
        
        // Synergy panel toggle (tecla B)
        if (window.Input && typeof Input.onKeyPress === 'function') {
            Input.onKeyPress('KeyB', () => {
                if (Game.running && !Game.paused) {
                    this.synergyPanelVisible = !this.synergyPanelVisible;
                }
            });
        }

        this.hideLoading();
    },

    // -------------------------
    // FORGE DOCS (tabs/pages)
    // -------------------------
    // Binds the documentation tabs inside the Forge Terminal modal.
    initForgeDocs(docsRoot) {
        if (!docsRoot) return;

        const tabs = Array.from(docsRoot.querySelectorAll('.forge-docs-tab'));
        const pages = Array.from(docsRoot.querySelectorAll('.forge-docs-page'));
        const links = Array.from(docsRoot.querySelectorAll('.forge-docs-link'));

        const showPage = (key) => {
            const target = key || 'index';
            for (const p of pages) {
                p.classList.toggle('active', p.dataset.page === target);
            }
            for (const t of tabs) {
                t.classList.toggle('active', t.dataset.page === target);
            }
        };

        for (const t of tabs) {
            t.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.AudioManager && typeof AudioManager.play === 'function') AudioManager.play('menuClick');
                showPage(t.dataset.page);
            };
        }

        for (const l of links) {
            l.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.AudioManager && typeof AudioManager.play === 'function') AudioManager.play('menuClick');
                showPage(l.dataset.go);
            };
        }

        // default
        showPage('index');
    },


    ensureRuneSlotElements(count) {
        const target = Math.max(1, Math.floor(count || 5));
        if (this._hudRuneSlots === target) return;

        const container = document.getElementById('runes-display');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < target; i++) {
            const slot = document.createElement('div');
            slot.className = 'rune-slot empty';
            container.appendChild(slot);
        }

        this._hudRuneSlots = target;
        // Rebind tooltips/clicks for the new slots
        this.setupRuneTooltips();
    },

    ensureActiveSlotElements(count) {
        const target = Math.max(1, Math.floor(count || 1));
        if (this._hudActiveSlots === target) return;

        const container = document.getElementById('active-display');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < target; i++) {
            const slot = document.createElement('div');
            slot.className = 'active-slot empty';
            slot.dataset.slot = String(i);

            // Structure: icon + cooldown clock overlay + optional text
            const icon = document.createElement('span');
            icon.className = 'slot-icon';
            icon.textContent = i === 0 ? 'F' : 'G';

            const clock = document.createElement('div');
            clock.className = 'cd-clock';
            clock.style.opacity = '0';

            const cdText = document.createElement('div');
            cdText.className = 'cd-text';
            cdText.textContent = '';

            slot.appendChild(icon);
            slot.appendChild(clock);
            slot.appendChild(cdText);

            container.appendChild(slot);
        }

        this._hudActiveSlots = target;
    },
    showScreen(screenId) {
        for (const [id, el] of Object.entries(this.screens)) {
            el.classList.toggle('active', id === screenId);
        }
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenId;
        // Music: menu vs gameplay
        try {
            // IMPORTANT: Don't swap to menu music when opening overlays/screens during an active run
            // (e.g., Pause -> Settings). Only switch to menu music when the run is not active.
            // Also: when returning to the game-screen, restore the *correct* in-run context (boss vs party).
            if (window.AudioManager && typeof AudioManager.setMusicState === 'function') {
                const inRun = (window.Game && Game.running);

                if (screenId === 'game-screen') {
                    // If we're currently in a boss room / boss fight, keep boss music.
                    let state = 'party';
                    try {
                        const room = (window.Game && Game.dungeon && typeof Game.dungeon.getCurrentRoom === 'function')
                            ? Game.dungeon.getCurrentRoom()
                            : null;

                        const bossAlive = !!(room && room.enemies && room.enemies.some(e => e && e.active && e.isBoss && (e.hp === undefined || e.hp > 0)));
                        const inBossContext = !!(room && room.type === 'boss' && (room._inBossFight || bossAlive));
                        if (inBossContext) state = 'boss';
                    } catch (e) { }

                    AudioManager.setMusicState(state);
                } else if (!inRun) {
                    AudioManager.setMusicState('menu');
                }
                // else: keep current track (party/boss) while paused/in settings
            }
        } catch (e) { }

        if (screenId === 'difficulty-select') {
            // Ensure difficulty cards reflect unlocks (e.g., Demencial unlock after first boss)
            if (typeof this.updateDifficultyLocks === 'function') {
                this.updateDifficultyLocks();
            }

            // Reset selection state for a clean start
            this.selectedDifficulty = null;
            document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
            const startBtn = document.getElementById('btn-start-run');
            if (startBtn) startBtn.disabled = true;
            const opt = document.getElementById('opt-negative-events');
            if (opt && typeof opt.checked === 'boolean') opt.checked = true;
        }

        // Update meta currency display on any screen change
        if (typeof this.updateMetaEssenceUI === 'function') {
            this.updateMetaEssenceUI();
        }
        if (screenId === 'meta-screen') {
            if (typeof this.renderMetaShop === 'function') this.renderMetaShop();
        }
        if (screenId === 'updates-screen') {
            if (typeof this.renderUpdates === 'function') this.renderUpdates();
        }
    },

    renderUpdates() {
        try {
            const notes013 = document.getElementById('updates-notes-013');
            const notes012 = document.getElementById('updates-notes-012');
            const notes011 = document.getElementById('updates-notes-011');
            if (notes013) notes013.textContent = (window.i18n && typeof i18n.t === 'function') ? i18n.t('updatesNotes013') : '';
            if (notes012) notes012.textContent = (window.i18n && typeof i18n.t === 'function') ? i18n.t('updatesNotes012') : '';
            if (notes011) notes011.textContent = (window.i18n && typeof i18n.t === 'function') ? i18n.t('updatesNotes011') : '';
        } catch (e) { }
    },


    updateMetaEssenceUI() {
        const val = (window.Meta && typeof Meta.getEssence === 'function') ? Meta.getEssence() : 0;
        const small = document.getElementById('meta-essence');
        if (small) small.textContent = (window.i18n ? i18n.f('metaEssenceLabel',{n:val}) : `Essence: ${val}`);
        const big = document.getElementById('meta-screen-essence');
        if (big) big.textContent = (window.i18n ? i18n.f('metaEssenceLabel',{n:val}) : `Essence: ${val}`);
    },

    renderMetaShop() {
        const root = document.getElementById('meta-shop-list');
        if (!root) return;
        const val = (window.Meta && typeof Meta.getEssence === 'function') ? Meta.getEssence() : 0;
        const defs = [
            {
                key: 'shop_slots',
                title: i18n.t('metaShopSlotsTitle'),
                desc: i18n.t('metaShopSlotsDesc'),
                value: () => {
                    const slots = (window.Meta && Meta.getShopSlots) ? Meta.getShopSlots() : 4;
                    return `${slots}/8 ${i18n.currentLang==='es'?'slots':'slots'}`;
                }
            },
            {
                key: 'shop_rerolls',
                title: i18n.t('metaShopRerollsTitle'),
                desc: i18n.t('metaShopRerollsDesc'),
                value: () => {
                    const rr = (window.Meta && Meta.getShopRerolls) ? Meta.getShopRerolls() : 1;
                    return `${rr}/4 ${i18n.currentLang==='es'?'rerolls':'rerolls'}`;
                }
            },
            {
                key: 'luck',
                title: i18n.t('metaShopLuckTitle'),
                desc: i18n.t('metaShopLuckDesc'),
                value: () => {
                    const pct = (window.Meta && Meta.getLuckPct) ? Meta.getLuckPct() : 0.05;
                    return `${Math.round(pct*100)}%/20%`;
                }
            },
            {
                key: 'dash',
                title: i18n.t('metaShopDashTitle'),
                desc: i18n.t('metaShopDashDesc'),
                value: () => {
                    const d = (window.Meta && Meta.getDashCharges) ? Meta.getDashCharges() : 1;
                    return `${d}/3 ${i18n.currentLang==='es'?'cargas':'charges'}`;
                }
            },
            {
                key: 'start_gold',
                title: i18n.t('metaShopStartGoldTitle'),
                desc: i18n.t('metaShopStartGoldDesc'),
                value: () => {
                    const g = (window.Meta && Meta.getStartGold) ? Meta.getStartGold() : 0;
                    return `+${g} ${i18n.currentLang==='es'?'oro':'gold'}`;
                }
            },
            {
                key: 'vitality',
                title: i18n.t('metaShopVitalityTitle'),
                desc: i18n.t('metaShopVitalityDesc'),
                value: () => {
                    const hp = (window.Meta && Meta.getMaxHpBonus) ? Meta.getMaxHpBonus() : 0;
                    return `+${hp} HP`;
                }
            },
            {
                key: 'potion_belt',
                title: i18n.t('metaShopPotionBeltTitle'),
                desc: i18n.t('metaShopPotionBeltDesc'),
                value: () => {
                    const p = (window.Meta && Meta.getStartPotions) ? Meta.getStartPotions() : 0;
                    return `+${p} ${i18n.currentLang==='es'?'pociones':'potions'}`;
                }
            }
        ];

        const mkCard = (d) => {
            const lvl = (window.Meta && Meta.getUpgradeLevel) ? Meta.getUpgradeLevel(d.key) : 1;
            const max = (window.Meta && Meta.getUpgradeMaxLevel) ? Meta.getUpgradeMaxLevel(d.key) : lvl;
            const cost = (window.Meta && Meta.getUpgradeCost) ? Meta.getUpgradeCost(d.key) : 999;
            const canBuy = (window.Meta && Meta.canBuyUpgrade) ? Meta.canBuyUpgrade(d.key) : false;
            const isMax = lvl >= max;

            const card = document.createElement('div');
            card.className = 'meta-upgrade-card';

            const info = document.createElement('div');
            info.className = 'meta-upgrade-info';
            const title = document.createElement('div');
            title.className = 'meta-upgrade-title';
            title.textContent = d.title;
            const desc = document.createElement('div');
            desc.className = 'meta-upgrade-desc';
            desc.textContent = d.desc;
            info.appendChild(title);
            info.appendChild(desc);

            const right = document.createElement('div');
            right.className = 'meta-upgrade-right';
            const level = document.createElement('div');
            level.className = 'meta-upgrade-level';
            level.textContent = `Nivel ${lvl}/${max} - ${d.value()}`;

            const btn = document.createElement('button');
            btn.className = 'meta-buy-btn';
            btn.disabled = isMax || !canBuy;
            btn.textContent = isMax ? 'MAX' : `COMPRAR (${cost})`;
            btn.onclick = () => {
                AudioManager.play('menuClick');
                if (window.Meta && typeof Meta.buyUpgrade === 'function') {
                    const ok = Meta.buyUpgrade(d.key);
                    if (ok) {
                        this.updateMetaEssenceUI();
                        this.renderMetaShop();
                    }
                }
            };

            right.appendChild(level);
            right.appendChild(btn);

            card.appendChild(info);
            card.appendChild(right);
            return card;
        };

        root.innerHTML = '';
        defs.forEach(d => root.appendChild(mkCard(d)));
    },
    // Lock/unlock difficulties based on meta progression
    updateDifficultyLocks() {
        const hardCard = document.querySelector('.difficulty-card[data-difficulty="hard"]');
        const demonicCard = document.querySelector('.difficulty-card[data-difficulty="demonic"]');
        if (!hardCard && !demonicCard) return;

        let bossNormal = 0, bossHard = 0;
        try {
            const m = (window.Meta && Meta.data) ? Meta.data : null;
            bossNormal = (m && m.stats && (m.stats.bossKillsNormal || 0)) || 0;
            bossHard = (m && m.stats && (m.stats.bossKillsHard || 0)) || 0;
        } catch (e) { }

        const unlockedHard = bossNormal >= 1;
        const unlockedDemonic = bossHard >= 1;

        // Ensure overlays exist
        function ensureOverlay(card) {
            if (!card) return null;
            let ov = card.querySelector('.locked-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.className = 'locked-overlay';
                card.appendChild(ov);
            }
            return ov;
        }

        if (hardCard) {
            const ov = ensureOverlay(hardCard);
            if (unlockedHard) {
                hardCard.classList.remove('locked');
                if (ov) ov.style.display = 'none';
            } else {
                hardCard.classList.add('locked');
                if (ov) {
                    ov.style.display = 'block';
            ov.textContent = `🔒 ${i18n.t('unlockBossNormal')}`;
                }
            }
        }

        if (demonicCard) {
            const ov = ensureOverlay(demonicCard);
            if (unlockedDemonic) {
                demonicCard.classList.remove('locked');
                if (ov) ov.style.display = 'none';
            } else {
                demonicCard.classList.add('locked');
                if (ov) {
                    ov.style.display = 'block';
            ov.textContent = `🔒 ${i18n.t('unlockBossHard')}`;
                }
            }
        }
    },


    setupMenuEvents() {
        document.getElementById('btn-play').onclick = () => {
            AudioManager.play('menuClick');
            this.showScreen('slot-select');
            this.renderSlots();
        };

        document.getElementById('btn-settings').onclick = () => {
            AudioManager.play('menuClick');
            this.showScreen('settings-screen');
        };

        const fbBtn = document.getElementById('btn-feedback');
        if (fbBtn) {
            fbBtn.onclick = () => {
                AudioManager.play('menuClick');
                this.showScreen('feedback-screen');
            };
        }

        // Updates / Novedades button
        const updatesBtn = document.getElementById('btn-updates');
        if (updatesBtn) {
            updatesBtn.onclick = () => {
                AudioManager.play('menuClick');
                this.showScreen('updates-screen');
            };
        }

        // Meta upgrades (permanent)
        const metaBtn = document.getElementById('btn-meta');
        if (metaBtn) {
            metaBtn.onclick = () => {
                AudioManager.play('menuClick');
                this.showScreen('meta-screen');
                if (typeof this.renderMetaShop === 'function') this.renderMetaShop();
            };
        }

        document.getElementById('btn-quit').onclick = () => {
            AudioManager.play('menuClick');
            if (confirm('Â¿Salir del juego?')) window.close();
        };

        // Seed input handlers
        const btnRandomSeed = document.getElementById('btn-random-seed');
        const btnClearSeed = document.getElementById('btn-clear-seed');
        const btnCopySeed = document.getElementById('btn-copy-seed');
        const seedInput = document.getElementById('seed-input');
        
        if (btnRandomSeed) {
            btnRandomSeed.addEventListener('click', () => {
                const seed = Game.generateRandomSeed();
                if (seedInput) seedInput.value = seed;
                this.showToast('🎲 Seed generada: ' + seed);
                AudioManager.play('menuClick');
            });
        }
        
        if (btnClearSeed) {
            btnClearSeed.addEventListener('click', () => {
                if (seedInput) seedInput.value = '';
                this.showToast('✖ Seed limpiada');
                AudioManager.play('menuClick');
            });
        }
        
        if (btnCopySeed) {
            btnCopySeed.addEventListener('click', () => {
                if (seedInput && seedInput.value) {
                    navigator.clipboard.writeText(seedInput.value).then(() => {
                        this.showToast('📋 Seed copiada: ' + seedInput.value);
                    });
                    AudioManager.play('menuClick');
                }
            });
        }

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.onmouseenter = () => AudioManager.play('menuHover');
        });
    },

    setupMetaEvents() {
        const back = document.getElementById('btn-meta-back');
        if (back) {
            back.onclick = () => {
                AudioManager.play('menuClick');
                this.showScreen('main-menu');
            };
        }
    },

    setupFeedbackEvents() {
        const back = document.getElementById('btn-back-feedback');
        if (back) {
            back.onclick = () => {
                AudioManager.play('menuClick');
                // If we came here from pause/settings mid-run, go back to previous screen
                this.showScreen('main-menu');
            };
        }

        const toast = document.getElementById('feedback-toast');
        const typeSel = document.getElementById('feedback-type');
        const textarea = document.getElementById('feedback-text');
        const FB_COOLDOWN_MS = 120000; // 2 minutes
        const FB_LAST_SENT_KEY = 'spellikedev_feedback_lastSent';

        const getFbRemainingMs = () => {
            const last = parseInt(localStorage.getItem(FB_LAST_SENT_KEY) || '0', 10);
            if (!last) return 0;
            const elapsed = Date.now() - last;
            return Math.max(0, FB_COOLDOWN_MS - elapsed);
        };

        const markFbSentNow = () => {
            localStorage.setItem(FB_LAST_SENT_KEY, String(Date.now()));
        };

        const showToast = (msg) => {
            if (!toast) return;
            toast.textContent = msg;
            toast.style.color = '#8fff8f';
            clearTimeout(this._fbToastTimer);
            this._fbToastTimer = setTimeout(() => {
                toast.textContent = '';
            }, 1800);
        };

        const safeGet = (fn, fallback = '') => {
            try { return fn(); } catch (e) { return fallback; }
        };

        const buildPayload = () => {
            const t = typeSel ? (typeSel.value || 'bug') : 'bug';
            const body = textarea ? (textarea.value || '').trim() : '';

            const version = safeGet(() => {
                const v = document.querySelector('.version');
                return v ? v.textContent.trim() : 'unknown';
            }, 'unknown');

            // Pull some runtime context if we are in a run
            const inRun = !!(window.Game && Game.running);
            const ctx = [];
            ctx.push(`Tipo: ${t}`);
            ctx.push(`Version: ${version}`);
            ctx.push(`Pantalla: ${this.currentScreen}`);

            if (inRun) {
                ctx.push(`En partida: si`);
                ctx.push(`Bioma: ${safeGet(() => Game.biomeIndex + 1, '?')}/12`);
                ctx.push(`Sala: ${safeGet(() => Game.dungeon ? (Game.dungeon.depth + 1) : (Game.roomIndex + 1), '?')}`);
                ctx.push(`Oro: ${safeGet(() => Game.player ? Game.player.gold : '?', '?')}`);
                ctx.push(`HP: ${safeGet(() => Game.player ? `${Game.player.hp}/${Game.player.maxHp}` : '?', '?')}`);
            } else {
                ctx.push(`En partida: no`);
            }

            // Friendly template. Keep it clean and readable (no literal "\\n" sequences).
            const template = body.length ? body : (
                `Describe el problema/recomendación:
...

Pasos para reproducir:
1) ...
2) ...

Resultado esperado:
...

Resultado obtenido:
...`
            );

            return `${ctx.join('\n')}
Mensaje:
${template}
`;
        };

        const buildSubject = () => {
            const t = typeSel ? (typeSel.value || 'bug') : 'bug';
            const version = safeGet(() => {
                const v = document.querySelector('.version');
                return v ? v.textContent.trim() : 'unknown';
            }, 'unknown');
            const label = (t === 'bug') ? 'Bug' : (t === 'suggestion') ? 'Recomendación' : (t === 'balance') ? 'Balance' : 'Otro';
            return `SpelLike Feedback - ${label} (${version})`;
        };

        const sendBtn = document.getElementById('btn-feedback-send');
        if (sendBtn) {
            sendBtn.onclick = async () => {
                AudioManager.play('menuClick');

                const remainingMs = getFbRemainingMs();
                if (remainingMs > 0) {
                    const s = Math.ceil(remainingMs / 1000);
                    showToast(i18n.t('feedbackCooldown').replace('{s}', s));
                    return;
                }
                const payload = buildPayload();
                const subject = buildSubject();
                const to = 'spellikedev@gmail.com';

                // âœ… Best UX: send directly without requiring the player to sign into an email client.
                // We use FormSubmit (no backend needed). First time only: it will ask YOU (the receiver)
                // to confirm/activate via an email from FormSubmit. After activation, it just works.
                const sendDirect = async () => {
                    const url = `https://formsubmit.co/ajax/${encodeURIComponent(to)}`;
                    const data = new FormData();
                    data.append('name', 'SpelLike Player');
                    data.append('type', typeSel ? (typeSel.value || 'bug') : 'bug');
                    data.append('message', payload);
                    data.append('_subject', subject);
                    // Keep it frictionless for players. (If you get spam later, we can enable captcha.)
                    data.append('_captcha', 'false');
                    data.append('_honey', '');
                    data.append('_template', 'table');

                    const res = await fetch(url, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json().catch(() => ({}));
                    // FormSubmit returns JSON; treat any OK as success.
                    return json;
                };

                try {
                    await sendDirect();
                    markFbSentNow();
                    showToast(i18n.t('feedbackSent'));
                } catch (e) {
                    // Network/CORS blocked, or service down: fall back to copy + optional mailto.
                    try {
                        await navigator.clipboard.writeText(payload);
                        showToast(i18n.t('feedbackCopied'));
                    } catch (_) {
                        if (textarea) {
                            textarea.value = payload;
                            textarea.focus();
                            textarea.select();
                        }
                        showToast('📋 Seleccionado: Ctrl+C');
                    }

                    // Optional: open mail composer as a secondary fallback (best-effort).
                    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload)}`;
                    window.open(mailto, '_blank');
                }
            };
        }

        const copyBtn = document.getElementById('btn-feedback-copy');
        if (copyBtn) {
            copyBtn.onclick = async () => {
                AudioManager.play('menuClick');
                const payload = buildPayload();
                try {
                    await navigator.clipboard.writeText(payload);
                    showToast(i18n.t('feedbackCopied'));
                } catch (e) {
                    // Fallback: select text for manual copy
                    if (textarea) {
                        textarea.value = payload;
                        textarea.focus();
                        textarea.select();
                    }
                    showToast('📋 Seleccionado: Ctrl+C');
                }
            };
        }

        const clearBtn = document.getElementById('btn-feedback-clear');
        if (clearBtn) {
            clearBtn.onclick = () => {
                AudioManager.play('menuClick');
                if (textarea) textarea.value = '';
                showToast('🧽 Limpio');
            };
        }
    },

    setupSlotEvents() {
        document.getElementById('btn-back-slots').onclick = () => {
            AudioManager.play('menuClick');
            this.showScreen('main-menu');
        };
    },

    renderSlots() {
        const container = document.getElementById('slots-container');
        container.innerHTML = '';

        for (let i = 1; i <= 3; i++) {
            const save = SaveManager.getSlot(i);
            const slot = document.createElement('div');
            slot.className = 'slot-card' + (save ? '' : ' empty');

            if (save) {
                slot.innerHTML = `
                    <div class="slot-header">
                        <span class="slot-title">SLOT ${i}</span>
                        <div class="slot-actions">
                            <button class="slot-action-btn play-btn">▶ JUGAR</button>
                            <button class="slot-action-btn delete delete-btn">🗑</button>
                        </div>
                    </div>
                    <div class="slot-info">
                        <span>🗺️ ${save.biomeName || 'Bosque'} (${save.biomeNum || 1}/12)</span>
                        <span>⏱ ${Utils.formatTime(save.playTime || 0)}</span>
                        <span>⚔️ Nivel ${save.level || 1}</span>
                        <span>📅 ${save.lastPlayed || 'Nuevo'}</span>
                    </div>
                    <div class="slot-runes">
                        ${(save.runes || [null, null, null, null, null]).map(r =>
                    `<div class="slot-rune">${r ? r.icon : ''}</div>`
                ).join('')}
                    </div>
                `;

                slot.querySelector('.play-btn').onclick = (e) => {
                    e.stopPropagation();
                    AudioManager.play('menuClick');
                    this.loadGame(i);
                };

                slot.querySelector('.delete-btn').onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('¿Eliminar esta partida?')) {
                        SaveManager.deleteSlot(i);
                        this.renderSlots();
                    }
                };
            } else {
                slot.innerHTML = `
                    <div class="slot-title">SLOT ${i}</div>
                    <p>➕ ${i18n.t('newGame')}</p>
                `;
                slot.onclick = () => {
                    AudioManager.play('menuClick');
                    this.selectedSlot = i;
                    this.showScreen('difficulty-select');
                };
            }

            container.appendChild(slot);
        }
    },

    loadGame(slotId) {
        this.selectedSlot = slotId;
        const save = SaveManager.getSlot(slotId);
        Game.loadFromSave(save);
        this.showScreen('game-screen');
        Game.start();
    },

    setupDifficultyEvents() {
        const startBtn = document.getElementById('btn-start-run');
        const eventsOpt = document.getElementById('opt-negative-events');

        // Select difficulty card (no auto-start)
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.onclick = () => {
                if (card.classList.contains('locked')) return;

                AudioManager.play('menuClick');
                document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedDifficulty = card.dataset.difficulty;

                if (startBtn) startBtn.disabled = false;
            };
        });

        // Start run with chosen difficulty + events toggle
        if (startBtn) {
            startBtn.onclick = () => {
                if (!this.selectedDifficulty) return;
                AudioManager.play('menuClick');
                this.eventsEnabled = eventsOpt ? !!eventsOpt.checked : true;
                this.startNewGame();
            };
        }

        document.getElementById('btn-back-diff').onclick = () => {
            AudioManager.play('menuClick');
            this.showScreen('slot-select');
        };
    },

    startNewGame() {
        const ev = (typeof this.eventsEnabled === 'boolean') ? this.eventsEnabled : true;
        const seedInput = document.getElementById('seed-input');
        const seedText = seedInput ? seedInput.value.trim() : '';
        Game.newGame(this.selectedSlot, this.selectedDifficulty, ev, seedText);
        this.showScreen('game-screen');
        Game.start();
    },

    setupSettingsEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
                AudioManager.play('menuClick');
            };
        });

        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.oninput = () => {
                slider.nextElementSibling.textContent = `${slider.value}%`;
                this.applyTemporaryAudio();
            };
        });

        // Graphics options
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.onclick = () => {
                const group = btn.parentElement;
                group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AudioManager.play('menuClick');
            };
        });

                // Language selector (ES/EN)
        const langButtons = document.querySelectorAll('.language-btn');
        if (langButtons && langButtons.length) {
            langButtons.forEach(btn => {
                btn.onclick = () => {
                    langButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    AudioManager.play('menuClick');
                };
            });

            // Ensure active button matches saved language
            const savedLang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : (localStorage.getItem('spellike_language') || 'en');
            const match = Array.from(langButtons).find(b => b.dataset && b.dataset.lang === savedLang);
            if (match) {
                langButtons.forEach(b => b.classList.remove('active'));
                match.classList.add('active');
            }
        }

document.getElementById('btn-apply-settings').onclick = () => {
            AudioManager.play('menuClick');
            this.saveSettings();
        };

        // Synergy always visible setting
        const synergyCheckbox = document.getElementById('setting-synergy-always-visible');
        if (synergyCheckbox) {
            synergyCheckbox.checked = this.synergyAlwaysVisible;
            synergyCheckbox.addEventListener('change', (e) => {
                this.synergyAlwaysVisible = e.target.checked;
                localStorage.setItem('synergyAlwaysVisible', this.synergyAlwaysVisible);
            });
        }

        document.getElementById('btn-back-settings').onclick = () => {
            AudioManager.play('menuClick');
            // FIX: Volver a la pantalla correcta
            if (this.previousScreen === 'game-screen' && Game.running) {
                this.showScreen('game-screen');
                Game.paused = false;
            } else {
                this.showScreen('main-menu');
            }
        };
    },

    applyTemporaryAudio() {
        AudioManager.setMasterVolume(document.getElementById('vol-master').value / 100);
        AudioManager.setMusicVolume(document.getElementById('vol-music').value / 100);
        AudioManager.setSfxVolume(document.getElementById('vol-sfx').value / 100);
        AudioManager.setUiVolume(document.getElementById('vol-ui').value / 100);
    },

    saveSettings() {
        const settings = {
            audio: {
                master: parseInt(document.getElementById('vol-master').value),
                music: parseInt(document.getElementById('vol-music').value),
                sfx: parseInt(document.getElementById('vol-sfx').value),
                ui: parseInt(document.getElementById('vol-ui').value)
            },
            graphics: {
                screenshake: document.getElementById('opt-screenshake').checked,
                particles: document.getElementById('opt-particles').checked,
                hitflash: document.getElementById('opt-hitflash').checked
            }
        };
        // Persist language if changed
        const selectedLangBtn = document.querySelector('.language-btn.active');
        const selectedLang = (selectedLangBtn && selectedLangBtn.dataset) ? selectedLangBtn.dataset.lang : null;
        const prevLang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : (localStorage.getItem('spellike_language') || 'en');

        SaveManager.saveSettings(settings);

        if (selectedLang && window.i18n && typeof window.i18n.setLanguage === 'function' && selectedLang !== prevLang) {
            window.i18n.setLanguage(selectedLang);
            // Force reload with explicit ?lang= so it works even if localStorage is blocked on file://
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('lang', selectedLang);
                window.location.href = url.toString();
            } catch (e) {
                location.reload();
            }
            return;
        }
    },

    setupGameUIEvents() {
        // Some builds can miss the death screen DOM (merge/template mismatch).
        // If it doesn't exist, death will throw and freeze the game loop.
        this._ensureDeathScreen();

        // Resume
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.onclick = () => {
            AudioManager.play('menuClick');
            Game.togglePause();
        };

        // Stats button - FIX
        const btnStats = document.getElementById('btn-stats');
        if (btnStats) btnStats.onclick = () => {
            AudioManager.play('menuClick');
            this.showStatsOverlay();
        };

        // Codex button
        const codexBtn = document.getElementById('btn-codex');
        if (codexBtn) {
            codexBtn.onclick = () => {
                AudioManager.play('menuClick');
                this.showCodex('bestiary', 'pause');
            };
        }

        // Settings from pause - FIX
        const btnPauseSettings = document.getElementById('btn-pause-settings');
        if (btnPauseSettings) btnPauseSettings.onclick = () => {
            AudioManager.play('menuClick');
            document.getElementById('pause-menu').classList.add('hidden');
            this.previousScreen = 'game-screen';
            Game.paused = true;
            this.showScreen('settings-screen');
        };

        // Abandon run - FIX
        const btnAbandon = document.getElementById('btn-abandon');
        if (btnAbandon) btnAbandon.onclick = () => {
            AudioManager.play('menuClick');
            if (confirm('Â¿Abandonar run? Perderás todo el progreso de esta partida.')) {
                SaveManager.deleteSlot(this.selectedSlot);
                Game.stop();
                AudioManager.stopMusic();
                document.getElementById('pause-menu').classList.add('hidden');
                this.showScreen('main-menu');
            }
        };

        // Main menu from pause
        const btnMainMenu = document.getElementById('btn-main-menu');
        if (btnMainMenu) btnMainMenu.onclick = () => {
            AudioManager.play('menuClick');
            // NO guardar - solo guardar al pasar puertas
            Game.stop();
            AudioManager.stopMusic();
            document.getElementById('pause-menu').classList.add('hidden');
            this.showScreen('main-menu');
        };

        // Death buttons
        const btnRetry = document.getElementById('btn-retry');
        if (btnRetry) btnRetry.onclick = () => {
            AudioManager.play('menuClick');
            const ds = document.getElementById('death-screen');
            if (ds) ds.classList.add('hidden');
            this.startNewGame();
        };
        const btnDeathMenu = document.getElementById('btn-death-menu');
        if (btnDeathMenu) btnDeathMenu.onclick = () => {
            AudioManager.play('menuClick');
            const ds = document.getElementById('death-screen');
            if (ds) ds.classList.add('hidden');
            this.showScreen('main-menu');
        };
    },

    _ensureDeathScreen() {
        if (document.getElementById('death-screen')) return;

        const overlay = document.createElement('div');
        overlay.id = 'death-screen';
        overlay.className = 'overlay hidden';
        overlay.innerHTML = `
            <div class="pause-content" style="max-width: 760px;">
                <h2 style="margin-bottom: 12px;">💀 GAME OVER</h2>
                <div style="text-align:left; width: 100%;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div><strong>Biomas</strong>: <span id="stat-biomes">0</span></div>
                        <div><strong>Kills</strong>: <span id="stat-kills">0</span></div>
                        <div><strong>Daño</strong>: <span id="stat-damage">0</span></div>
                        <div><strong>Oro</strong>: <span id="stat-gold">0</span></div>
                        <div><strong>Tiempo</strong>: <span id="stat-time">00:00</span></div>
                        <div><strong>MVP</strong>: <span id="stat-mvp">-</span></div>
                        <div><strong>Esencia ganada</strong>: <span id="stat-essence-earned">0</span></div>
                        <div><strong>Esencia total</strong>: <span id="stat-essence-total">0</span></div>
                    </div>

                    <div id="death-seed-container" style="margin-top: 14px;"></div>
                </div>
                <div class="pause-buttons" style="margin-top: 16px;">
                    <button class="menu-btn" id="btn-retry">🔁 VOLVER A JUGAR</button>
                    <button class="menu-btn" id="btn-death-menu">🏠 MENÚ PRINCIPAL</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    // ===========================
    // CODEX (Bestiary + Achievements)
    // ===========================

    setupCodexEvents() {
        let overlay = document.getElementById('codex-overlay');
        if (!overlay) {
            overlay = this._createCodexOverlay();
        }
        if (!overlay) return;

        const closeBtn = document.getElementById('btn-close-codex');
        if (closeBtn) closeBtn.onclick = () => {
            AudioManager.play('menuClick');
            this.hideCodex();
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideCodex();
            }
        });

        overlay.querySelectorAll('.codex-tab').forEach(btn => {
            btn.onclick = () => {
                AudioManager.play('menuClick');
                overlay.querySelectorAll('.codex-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                overlay.querySelectorAll('.codex-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(`codex-panel-${tab}`);
                if (panel) panel.classList.add('active');

                if (tab === 'bestiary') this.renderBestiary();
                if (tab === 'achievements') this.renderAchievements();
                if (tab === 'history') this.renderRunHistory();
                if (tab === 'sets') this.renderSetsPanel();
                if (tab === 'synergies') this.renderSynergiesCodex();
            };
        });
    },

    toggleCodex() {
        // Don't open codex over other modals
        const rewardOpen = !document.getElementById('reward-screen')?.classList.contains('hidden');
        const deathOpen = !document.getElementById('death-screen')?.classList.contains('hidden');
        if (rewardOpen || deathOpen || this.lootModal || this.shopModal) return;

        if (this.codexOpen) {
            this.hideCodex();
        } else {
            const pauseMenuVisible = !document.getElementById('pause-menu')?.classList.contains('hidden');
            this.showCodex('bestiary', pauseMenuVisible ? 'pause' : 'game');
        }
    },

    showCodex(initialTab = 'bestiary', returnTo = 'game') {
        let overlay = document.getElementById('codex-overlay');
        if (!overlay) {
            overlay = this._createCodexOverlay();
        }
        if (!overlay) return;

        this.codexOpen = true;
        this.codexReturn = returnTo;

        // Pause game while codex is open
        try { Game.paused = true; } catch (e) { }

        // Hide pause menu if it was open
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.add('hidden');

        overlay.classList.remove('hidden');

        // Select tab
        overlay.querySelectorAll('.codex-tab').forEach(b => b.classList.remove('active'));
        overlay.querySelectorAll('.codex-panel').forEach(p => p.classList.remove('active'));
        const tabBtn = overlay.querySelector(`.codex-tab[data-tab="${initialTab}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        const panel = document.getElementById(`codex-panel-${initialTab}`);
        if (panel) panel.classList.add('active');

        if (initialTab === 'bestiary') this.renderBestiary();
        if (initialTab === 'achievements') this.renderAchievements();
        if (initialTab === 'history') this.renderRunHistory();
        if (initialTab === 'sets') this.renderSetsPanel();
        if (initialTab === 'synergies') this.renderSynergiesCodex();
    },


    _createCodexOverlay() {
        try {
            const overlay = document.createElement('div');
            overlay.id = 'codex-overlay';
            overlay.className = 'overlay hidden';
            overlay.innerHTML = `
                <div class="codex-window">
                    <div class="codex-header">
                        <div class="codex-title">${(window.i18n ? i18n.t('btnCodex') : 'CODEX')}</div>
                        <button id="btn-close-codex" class="codex-close">✕</button>
                    </div>
        <div class="codex-tabs">
          <button class="codex-tab active" data-tab="bestiary">${(window.i18n ? i18n.t('codexTabBestiary') : 'Bestiary')}</button>
          <button class="codex-tab" data-tab="achievements">${(window.i18n ? i18n.t('codexTabAchievements') : 'Achievements')}</button>
          <button class="codex-tab" data-tab="history">${(window.i18n ? i18n.t('codexTabHistory') : 'History')}</button>
          <button class="codex-tab" data-tab="sets">${(window.i18n ? i18n.t('codexTabSets') : 'Sets')}</button>
          <button class="codex-tab" data-tab="synergies">${(window.i18n ? i18n.t('codexTabSynergies') : 'Synergies')}</button>
        </div>
        <div class="codex-body">
                        <div class="codex-panel active" id="codex-panel-bestiary">
                            <div class="codex-split">
                                <div id="bestiary-list" class="codex-list"></div>
                                <div id="bestiary-detail" class="codex-detail"></div>
                            </div>
                        </div>
                        <div class="codex-panel" id="codex-panel-achievements">
                            <div id="achievements-list" class="codex-list"></div>
                        </div>
                        <div class="codex-panel" id="codex-panel-history">
                            <div class="history-controls">
                                <input id="history-filter" placeholder="${i18n.t('historyFilterPlaceholder')}" />
                                <select id="history-sort">
                                    <option value="date_desc">${i18n.t('historySortDate')}</option>
                                    <option value="ng_desc">${i18n.t('historySortNg')}</option>
                                    <option value="gold_desc">${i18n.t('historySortGold')}</option>
                                    <option value="kills_desc">${i18n.t('historySortKills')}</option>
                                    <option value="time_desc">${i18n.t('historySortTime')}</option>
                                </select>
                                <button id="btn-history-clear">${i18n.t('historyClear')}</button>
                            </div>
                            <div id="history-summary" class="history-summary"></div>
                            <div class="codex-split">
                                <div id="history-list" class="codex-list"></div>
                                <div id="history-detail" class="codex-detail"></div>
                            </div>
                        </div>
                        <div class="codex-panel" id="codex-panel-sets">
                            <div id="sets-panel" class="codex-detail"></div>
                        </div>
                        <div class="codex-panel" id="codex-panel-synergies">
                            <div id="synergies-codex" class="codex-detail">
                                <div id="synergies-list"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            // Minimal styling fallback if css missing
            if (!document.getElementById('codex-style')) {
                const st = document.createElement('style');
                st.id = 'codex-style';
                st.textContent = `
                    #codex-overlay .codex-window{width:860px;max-width:92vw;max-height:86vh;background:rgba(10,10,20,0.95);border:2px solid rgba(160,120,255,0.7);border-radius:10px;padding:10px;overflow:hidden;font-family:'Press Start 2P',monospace}
                    #codex-overlay .codex-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
                    #codex-overlay .codex-close{background:transparent;border:0;color:white;font-size:16px;cursor:pointer}
                    #codex-overlay .codex-tabs{display:flex;gap:6px;margin-bottom:10px}
                    #codex-overlay .codex-tab{background:rgba(120,80,255,0.25);border:1px solid rgba(160,120,255,0.6);color:white;padding:6px 8px;cursor:pointer}
                    #codex-overlay .codex-tab.active{background:rgba(120,80,255,0.55)}
                    #codex-overlay .codex-body{overflow:auto;max-height:72vh}
                    #codex-overlay .codex-panel{display:none}
                    #codex-overlay .codex-panel.active{display:block}
                    #codex-overlay .codex-split{display:grid;grid-template-columns:1fr 1.2fr;gap:10px}
                    #codex-overlay .codex-list{border:1px solid rgba(255,255,255,0.15);padding:8px;max-height:64vh;overflow:auto}
                    #codex-overlay .codex-detail{border:1px solid rgba(255,255,255,0.15);padding:8px;max-height:64vh;overflow:auto}
                    /* SYNERGIES TAB (clean layout) */
                    #codex-panel-synergies #synergies-codex{height:100%;overflow:auto;padding-right:6px}
                    #codex-panel-synergies .syn-row{display:grid;grid-template-columns:220px 1fr;gap:14px;align-items:center;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:12px 14px;margin:10px 0}
                    #codex-panel-synergies .syn-left{display:flex;align-items:center;gap:10px;min-width:0}
                    #codex-panel-synergies .syn-icon{width:18px;height:18px;display:grid;place-items:center;opacity:0.95}
                    #codex-panel-synergies .syn-name{font-size:12px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                    #codex-panel-synergies .syn-right{display:grid;gap:8px;min-width:0}
                    #codex-panel-synergies .syn-line{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:start}
                    #codex-panel-synergies .syn-label{opacity:0.9;font-size:9px;letter-spacing:0.6px;text-transform:uppercase;line-height:1.1}
                    #codex-panel-synergies .syn-value{font-size:10px;line-height:1.25;word-break:break-word;overflow-wrap:anywhere;min-width:0}
                    #codex-panel-synergies .syn-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
                    #codex-panel-synergies .syn-chip{display:inline-flex;align-items:center;gap:8px;padding:4px 8px;border-radius:999px;background:rgba(120,80,255,0.12);border:1px solid rgba(160,120,255,0.35)}
                    #codex-panel-synergies .syn-plus{opacity:0.7;margin:0 2px}
                    #codex-panel-synergies .syn-or{opacity:0.75;margin:6px 0 4px;font-size:9px;letter-spacing:0.6px}
                    #codex-panel-synergies .syn-combo{margin:0 0 6px}
                    
                    #codex-overlay .history-controls{display:flex;gap:6px;align-items:center;margin-bottom:8px}
                    #codex-overlay input,#codex-overlay select,#codex-overlay button{font-family:'Press Start 2P',monospace;font-size:10px}
                `;
                document.head.appendChild(st);
            }
            // Bind events now that it exists
            this.setupCodexEvents();
            return overlay;
        } catch (e) {
            console.error(e);
            return null;
        }
    },


    hideCodex() {
        let overlay = document.getElementById('codex-overlay');
        if (!overlay) {
            overlay = this._createCodexOverlay();
        }
        if (!overlay) return;
        overlay.classList.add('hidden');
        this.codexOpen = false;

        // Return to pause or game
        if (this.codexReturn === 'pause') {
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) pauseMenu.classList.remove('hidden');
            try { Game.paused = true; } catch (e) { }
        } else {
            try { Game.paused = false; } catch (e) { }
        }
    },

    renderBestiary() {
        const list = document.getElementById('bestiary-list');
        const detail = document.getElementById('bestiary-detail');
        if (!list || !detail) return;

        if (!window.Meta) {
            list.innerHTML = `<p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9">${i18n.t('metaNotAvailable')}</p>`;
            detail.innerHTML = '';
            return;
        }

        const meta = (window.Meta && Meta.data) ? Meta.data : null;
        const enemyKeys = window.EnemyTypes ? Object.keys(EnemyTypes) : [];
        const bossKeys = window.BossTypes ? Object.keys(BossTypes) : [];

        const entries = [];
        enemyKeys.forEach(k => entries.push({ kind: 'enemy', id: k }));
        bossKeys.forEach(k => entries.push({ kind: 'boss', id: k }));

        const isUnlocked = (kind, id) => {
            if (!meta) return false;
            if (kind === 'enemy') return (meta.codex?.enemies?.[id]?.kills || 0) > 0;
            return (meta.codex?.bosses?.[id]?.kills || 0) > 0;
        };

        const getKills = (kind, id) => {
            if (!meta) return 0;
            if (kind === 'enemy') return meta.codex?.enemies?.[id]?.kills || 0;
            return meta.codex?.bosses?.[id]?.kills || 0;
        };

        const nameFor = (kind, id) => {
            if (kind === 'enemy') return Meta.getEnemyInfo(id).name;
            return Meta.getBossInfo(id).name;
        };
        const iconFor = (kind, id) => {
            if (kind === 'enemy') return Meta.getEnemyInfo(id).icon;
            return Meta.getBossInfo(id).icon;
        };

        // Render list grouped
        let html = '';
        const renderGroup = (title, groupEntries) => {
            html += `<div style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;margin:12px 0 8px 0">${title}</div>`;
            groupEntries.forEach((e, idx) => {
                const unlocked = isUnlocked(e.kind, e.id);
                const kills = getKills(e.kind, e.id);
                const icon = unlocked ? iconFor(e.kind, e.id) : '❔';
                const name = unlocked ? nameFor(e.kind, e.id) : '???';
                html += `
                    <div class="codex-entry" data-kind="${e.kind}" data-id="${e.id}">
                        <div class="codex-left">
                            <div class="codex-icon">${icon}</div>
                            <div class="codex-name">${name}</div>
                        </div>
                        <div class="codex-meta">${unlocked ? `${i18n.t('codexKills')}: ${kills}` : i18n.t('codexLocked')}</div>
                    </div>
                `;
            });
        };

        renderGroup(i18n.t('codexEnemiesTitle'), entries.filter(e => e.kind === 'enemy'));
        renderGroup(i18n.t('codexBossesTitle'), entries.filter(e => e.kind === 'boss'));

        list.innerHTML = html;

        // Default detail
        detail.innerHTML = `
            <h3>${i18n.t('codexSelectEntry')}</h3>
            <p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;line-height:1.5">
                ${i18n.t('codexTip').replace('C', '<b>C</b>')}
            </p>
        `;

        const selectEntry = (kind, id, el) => {
            list.querySelectorAll('.codex-entry').forEach(x => x.classList.remove('active'));
            if (el) el.classList.add('active');

            const unlocked = isUnlocked(kind, id);
            const kills = getKills(kind, id);
            const info = (kind === 'enemy') ? Meta.getEnemyInfo(id) : Meta.getBossInfo(id);

            if (!unlocked) {
                detail.innerHTML = `
                    <h3>???</h3>
                    <p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;line-height:1.5">
            ov.textContent = (kind === 'enemy') ? i18n.t('codexUnlockEnemy') : i18n.t('codexUnlockBoss');
                    </p>
                `;
                return;
            }

            const cfg = info.cfg || {};
            detail.innerHTML = `
                <h3>${info.icon} ${info.name}</h3>
                <p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;line-height:1.5">${info.desc}</p>
                <div class="detail-grid">
                    <div class="detail-card">${i18n.t('codexHpBaseLabel')}: ${cfg.hp ?? '-'} </div>
                    <div class="detail-card">${i18n.t('codexDamageBaseLabel')}: ${cfg.damage ?? '-'} </div>
                    <div class="detail-card">${i18n.t('codexSpeedLabel')}: ${cfg.speed ?? '-'} </div>
                    <div class="detail-card">${i18n.t('codexKills')}: ${kills}</div>
                </div>
                <div style="font-family:'Press Start 2P',monospace;font-size:9px;opacity:0.9;line-height:1.6">
                    <b>${i18n.t('codexAdviceLabel')}:</b> ${i18n.t(kind === 'enemy' ? 'codexAdviceEnemy' : 'codexAdviceBoss')}
                </div>
            `;
        };

        list.querySelectorAll('.codex-entry').forEach(el => {
            el.onclick = () => {
                const kind = el.dataset.kind;
                const id = el.dataset.id;
                AudioManager.play('menuClick');
                selectEntry(kind, id, el);
            };
        });
    },

    renderAchievements() {
        const list = document.getElementById('achievements-list');
        if (!list) return;

        if (!window.Meta || typeof Meta.getAchievementDB !== 'function') {
            list.innerHTML = `<p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9">${i18n.t('metaNotAvailable')}</p>`;
            return;
        }

        const db = Meta.getAchievementDB();
        const meta = Meta.data || { ach: { unlocked: {} }, stats: {} };

        let html = '';
        db.forEach(a => {
            const unlocked = !!(meta.ach?.unlocked?.[a.id]);
            const loc = (window.i18n && typeof i18n.objective === 'function') ? i18n.objective(a.id) : { name: a.name, desc: a.desc };
            const p = a.progress ? a.progress(meta) : { cur: 0, target: 1 };
            const cur = Math.max(0, Math.floor(p.cur || 0));
            const target = Math.max(1, Math.floor(p.target || 1));
            const pct = Math.floor((cur / target) * 100);
            const date = unlocked ? meta.ach.unlocked[a.id].date : '';
            const progText = unlocked ? `✅ ${date}` : `${cur}/${target} (${Math.min(100, pct)}%)`;

            html += `
                <div class="achievement ${unlocked ? '' : 'locked'}">
                    <div class="a-left">
                        <div class="a-icon">${a.icon || '🏆'}</div>
                        <div style="min-width:0">
                            <div class="a-title">${loc.name}</div>
                            <div class="a-desc">${loc.desc}</div>
                        </div>
                    </div>
                    <div class="a-progress">${progText}</div>
                </div>
            `;
        });

        list.innerHTML = html;
    },

    // ------------------------------
    // RUN HISTORY (Codex)
    // ------------------------------

    _getRunHistory() {
        try {
            const key = 'arcane_depths_run_history';
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    },

    _setRunHistory(arr) {
        try {
            const key = 'arcane_depths_run_history';
            localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
        } catch (e) { }
    },

    _formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds || 0));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    },

    _bindHistoryControlsOnce() {
        if (this._historyBound) return;
        this._historyBound = true;

        const filter = document.getElementById('history-filter');
        const sort = document.getElementById('history-sort');
        const clear = document.getElementById('btn-history-clear');

        const rerender = () => {
            if (!this.codexOpen) return;
            const activePanel = document.getElementById('codex-panel-history');
            if (!activePanel || !activePanel.classList.contains('active')) return;
            this._renderRunHistoryList();
        };

        if (filter) {
            filter.addEventListener('input', () => {
                clearTimeout(this._historyFilterTimer);
                this._historyFilterTimer = setTimeout(rerender, 80);
            });
        }

        if (sort) {
            sort.addEventListener('change', rerender);
        }

        if (clear) {
            clear.addEventListener('click', () => {
                AudioManager.play('menuClick');
                this._setRunHistory([]);
                if (filter) filter.value = '';
                if (sort) sort.value = 'date_desc';
                this._selectedHistoryIndex = -1;
                this._renderRunHistoryList();
            });
        }
    },

    renderRunHistory() {
        this._bindHistoryControlsOnce();
        this._selectedHistoryIndex = this._selectedHistoryIndex ?? -1;
        this._renderRunHistoryList();
    },

    _renderRunHistoryList() {
        const listEl = document.getElementById('history-list');
        const detailEl = document.getElementById('history-detail');
        const summaryEl = document.getElementById('history-summary');

        if (!listEl || !detailEl || !summaryEl) return;

        const filterEl = document.getElementById('history-filter');
        const sortEl = document.getElementById('history-sort');

        const raw = this._getRunHistory();

        // Summary
        const total = raw.length;
        const bestNg = raw.reduce((m, r) => Math.max(m, Number(r?.ngPlusLevel || 0)), 0);
        const bestGold = raw.reduce((m, r) => Math.max(m, Number(r?.gold || 0)), 0);
        const bestKills = raw.reduce((m, r) => Math.max(m, Number(r?.kills || 0)), 0);
        const bestTime = raw.reduce((m, r) => Math.max(m, Number(r?.time || 0)), 0);

        summaryEl.innerHTML = `
            <div>${i18n.t('historyRunsLabel')}: <span style="color:#ffd27a">${total}</span></div>
            <div>${i18n.t('historyBestNgLabel')}: <span style="color:#ffd27a">${bestNg}</span> | ${i18n.t('historyMaxGoldLabel')}: <span style="color:#ffd27a">${bestGold}</span></div>
            <div>${i18n.t('historyMaxKillsLabel')}: <span style="color:#ffd27a">${bestKills}</span> | ${i18n.t('historyBestTimeLabel')}: <span style="color:#ffd27a">${this._formatTime(bestTime)}</span></div>
        `;

        // Filter
        const q = (filterEl?.value || '').trim().toLowerCase();
        let items = raw.map((r, idx) => ({ r, idx }));

        if (q) {
            items = items.filter(({ r }) => {
                const blob = [
                    r?.date,
                    r?.biome,
                    r?.room,
                    r?.ngPlusLevel,
                    r?.gold,
                    r?.kills,
                    this._formatTime(r?.time)
                ].join(' ').toLowerCase();
                return blob.includes(q);
            });
        }

        // Sort
        const sortMode = (sortEl?.value || 'date_desc');
        const num = (v) => Number(v || 0);
        items.sort((a, b) => {
            const A = a.r, B = b.r;
            switch (sortMode) {
                case 'ng_desc': return num(B.ngPlusLevel) - num(A.ngPlusLevel);
                case 'gold_desc': return num(B.gold) - num(A.gold);
                case 'kills_desc': return num(B.kills) - num(A.kills);
                case 'time_desc': return num(B.time) - num(A.time);
                case 'date_desc':
                default:
                    return a.idx - b.idx;
            }
        });

        listEl.innerHTML = '';

        if (items.length === 0) {
            listEl.innerHTML = `<div class="history-empty">${i18n.t('historyNoRuns')}</div>`;
            detailEl.innerHTML = `<div class="history-detail-box"><h3>📌 ${i18n.t('historyDetailTitle')}</h3><div class="history-empty">${i18n.t('historyDetailHint')}</div></div>`;
            return;
        }

        // Ensure selection
        if (this._selectedHistoryIndex < 0 || !items.some(x => x.idx === this._selectedHistoryIndex)) {
            this._selectedHistoryIndex = items[0].idx;
        }

        items.forEach(({ r, idx }) => {
            const entry = document.createElement('div');
            entry.className = 'history-entry' + (idx === this._selectedHistoryIndex ? ' active' : '');
            const ng = Number(r?.ngPlusLevel || 0);
            const biomeLabel = (window.i18n ? i18n.t('hudBiome') : 'Bioma');
            const biome = (r?.biome != null) ? `${biomeLabel} ${r.biome}` : `${biomeLabel} -`;
            const roomLabel = (window.i18n ? i18n.t('hudRoom') : 'Sala');
            const room = (r?.room != null) ? `${roomLabel} ${r.room}` : `${roomLabel} -`;
            const gold = Number(r?.gold || 0);
            const kills = Number(r?.kills || 0);

            entry.innerHTML = `
                <div class="top">
                    <div class="date">${r?.date || ''}</div>
                    <div class="ng">NG+ ${ng}</div>
                </div>
                <div class="bottom">${biome} | ${room}<br/>Oro: ${gold} | Kills: ${kills} | Tiempo: ${this._formatTime(r?.time)}</div>
            `;

            entry.onclick = () => {
                AudioManager.play('menuClick');
                this._selectedHistoryIndex = idx;
                this._renderRunHistoryList();
            };

            listEl.appendChild(entry);
        });

        // Detail render
        const selected = raw[this._selectedHistoryIndex] || items[0].r;
        this._renderHistoryDetail(selected, detailEl);
    },

    _renderHistoryDetail(entry, detailEl) {
        if (!detailEl) return;
        const e = entry || {};
        const ng = Number(e.ngPlusLevel || 0);
        const biome = (e.biome != null) ? `Bioma ${e.biome}` : '-';
        const room = (e.room != null) ? `Sala ${e.room}` : '-';

        detailEl.innerHTML = `
            <div class="history-detail-box">
                <h3>🗂️ Run</h3>
                <div class="history-detail-grid">
                    <div class="label">Fecha</div><div>${e.date || '-'}</div>
                    <div class="label">NG+</div><div>${ng}</div>
                    <div class="label">Bioma</div><div>${biome}</div>
                    <div class="label">Sala</div><div>${room}</div>
                    <div class="label">Oro</div><div>${Number(e.gold || 0)}</div>
                    <div class="label">Kills</div><div>${Number(e.kills || 0)}</div>
                    <div class="label">Tiempo</div><div>${this._formatTime(e.time)}</div>
                </div>
                <div style="margin-top:12px; font-size:10px; color:rgba(255,255,255,0.65); line-height:1.6;">
                    Tip: filtrá por â€œNG+ 3â€, â€œBioma 2â€, â€œoroâ€, etc.
                </div>
            </div>
        `;
    },

    toastAchievement(ach) {
        // One toast at a time
        const prev = document.querySelector('.ad-toast');
        if (prev) prev.remove();

        const t = document.createElement('div');
        t.className = 'ad-toast';
        t.innerHTML = `
            <div class="t-title">🏆 Logro desbloqueado: ${ach.name}</div>
            <div class="t-desc">${ach.desc}</div>
        `;
        document.body.appendChild(t);
        setTimeout(() => {
            try { t.remove(); } catch (e) { }
        }, 3600);
    },

    // Generic small toast (used for quick feedback like "tótem agotado")
    toastMessage(msg) {
        try {
            const prev = document.querySelector('.ad-toast');
            if (prev) prev.remove();

            const t = document.createElement('div');
            t.className = 'ad-toast';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => { try { t.remove(); } catch (e) { } }, 1500);
        } catch (e) { }
    },

    // ===========================
    // RUNE TOOLTIPS
    // ===========================

    setupRuneTooltips() {
        const runeSlots = document.querySelectorAll('.rune-slot');
        runeSlots.forEach((slot, index) => {
            slot.onclick = () => {
                if (Game.player && Game.player.runes[index]) {
                    this.showRuneTooltip(Game.player.runes[index], slot);
                }
            };
        });
    },

    showRuneTooltip(rune, element) {
        this.hideRuneTooltip();

        const tooltip = document.createElement('div');
        tooltip.id = 'rune-tooltip';
        tooltip.className = 'rune-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon">${rune.icon}</span>
                <span class="tooltip-name">${rune.name}</span>
            </div>
            <div class="tooltip-desc">${rune.desc || 'Runa mágica'}</div>
            <div class="tooltip-rarity rarity-${rune.rarity}">${rune.rarity?.toUpperCase() || 'COMÃšN'}</div>
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 5) + 'px';

        this.runeTooltip = tooltip;

        // Auto hide
        setTimeout(() => this.hideRuneTooltip(), 3000);
    },

    hideRuneTooltip() {
        if (this.runeTooltip) {
            this.runeTooltip.remove();
            this.runeTooltip = null;
        }
    },

    // ===========================
    // LOOT CHOICE MODAL
    // ===========================

    showLootChoice(runeOption, itemOption) {
        Game.paused = true;

        // If a previous loot modal exists (e.g., coming back from swap cancel), remove it.
        try { if (this.lootModal) this.lootModal.remove(); } catch (e) {}
        this.lootModal = null;

        // Keep the current loot options so swap-cancel can return here instead of
        // closing the chest flow.
        this._lastLootOptions = { runeOption, itemOption };

        const modal = document.createElement('div');
        modal.id = 'loot-modal';
        modal.className = 'loot-modal';
        modal.innerHTML = `
            <div class="loot-content">
                <h2>${i18n.t('lootChooseTitle')}</h2>
                <div class="loot-options">
                    <div class="loot-option rune-option" id="choose-rune">
                        <div class="option-type">${i18n.t('lootRune')}</div>
                        <div class="option-icon">${runeOption.icon}</div>
                        <div class="option-name">${runeOption.name}</div>
                        <div class="option-desc">${runeOption.desc || ''}</div>
                        <div class="option-rarity rarity-${runeOption.rarity}">${runeOption.rarity?.toUpperCase() || 'COMÚN'}</div>
                    </div>
                    <div class="loot-divider">${i18n.t('lootOr')}</div>
                    <div class="loot-option item-option" id="choose-item">
                        <div class="option-type">${i18n.t('lootItem')}</div>
                        <div class="option-icon">${itemOption.icon}</div>
                        <div class="option-name">${itemOption.name}</div>
                        <div class="option-desc">${itemOption.desc || itemOption.effect || ''}</div>
                    </div>
                </div>
                <button class="discard-btn" id="discard-loot">${i18n.t('lootDiscardBoth')}</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.lootModal = modal;

        document.getElementById('choose-rune').onclick = () => {
            this.handleRuneChoice(runeOption, 'loot');
        };

        document.getElementById('choose-item').onclick = () => {
            Game.handleLoot({ ...itemOption, type: 'item' });
            this.closeLootModal();
        };

        document.getElementById('discard-loot').onclick = () => {
            this.closeLootModal();
        };
    },

    // source: 'loot' | 'shop'
    handleRuneChoice(rune, source = 'loot') {
        this._runeChoiceSource = source;
        // Check if player has empty slot
        const emptySlot = Game.player.runes.findIndex(r => r === null);

        if (emptySlot >= 0) {
            // Has empty slot, equip directly
            Game.player.equipRune(rune, emptySlot);
            AudioManager.play('pickup');
            ParticleSystem.burst(Game.player.centerX, Game.player.centerY, 15, {
                color: '#ffd700', life: 0.5, size: 4, speed: 3
            });
            this.closeLootModal();
        } else {
            // All slots full, show swap dialog
            this.showRuneSwapDialog(rune);
        }
    },

    showRuneSwapDialog(newRune) {
        if (this.lootModal) this.lootModal.remove();

        const modal = document.createElement('div');
        modal.id = 'loot-modal';
        modal.className = 'loot-modal';

        let slotsHtml = '';
        Game.player.runes.forEach((rune, i) => {
            if (rune) {
                slotsHtml += `
                    <div class="swap-slot" data-slot="${i}">
                        <div class="swap-icon">${rune.icon}</div>
                        <div class="swap-name">${rune.name}</div>
                        <div class="swap-desc">${rune.desc || ''}</div>
                    </div>
                `;
            }
        });

        modal.innerHTML = `
            <div class="loot-content">
                <h2>INTERCAMBIAR RUNA</h2>
                <div class="new-rune-preview">
                    <span>Nueva: ${newRune.icon} ${newRune.name}</span>
                    <p>${newRune.desc || ''}</p>
                </div>
                <p class="swap-instruction">Elige cuál runa reemplazar:</p>
                <div class="swap-slots">
                    ${slotsHtml}
                </div>
                <button class="discard-btn" id="cancel-swap">Cancelar</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.lootModal = modal;

        modal.querySelectorAll('.swap-slot').forEach(slot => {
            slot.onclick = () => {
                const slotIndex = parseInt(slot.dataset.slot);
                Game.player.equipRune(newRune, slotIndex);
                AudioManager.play('pickup');
                this.closeLootModal();
            };
        });

        document.getElementById('cancel-swap').onclick = () => {
            // Cancel behavior depends on where the rune came from.
            // - Loot chest: go back to Rune vs Item choice.
            // - Shop: just close the swap dialog and return to the shop.
            // - Boss reward: return to the boss reward screen.

            try { if (this.lootModal) this.lootModal.remove(); } catch (e) {}
            this.lootModal = null;

            if (this._runeChoiceSource === 'shop') {
                AudioManager.play('menuClick');
                return;
            }

            if (this._runeChoiceSource === 'boss') {
                AudioManager.play('menuClick');
                try {
                    // Keep the game paused while choosing boss rewards
                    if (window.Game) Game.paused = true;
                    const r = this._lastRewardScreenRewards;
                    if (r && Array.isArray(r) && r.length) {
                        this.showRewardScreen(r);
                        return;
                    }
                } catch (e) {}
                // Fallback: just close
                this.closeLootModal();
                return;
            }

            const opts = this._lastLootOptions;
            if (opts && opts.runeOption && opts.itemOption) {
                AudioManager.play('menuClick');
                this.showLootChoice(opts.runeOption, opts.itemOption);
            } else {
                this.closeLootModal();
            }
        };
    },


    showActiveSwapDialog(newActiveItem) {
        if (this.lootModal) this.lootModal.remove();

        const modal = document.createElement('div');
        modal.id = 'loot-modal';
        modal.className = 'loot-modal';

        let slotsHtml = '';
        (Game.player.activeItems || []).forEach((it, i) => {
            if (it) {
                const cd = Game.player.activeCooldowns ? Game.player.activeCooldowns[i] : 0;
                slotsHtml += `
                    <div class="swap-slot" data-slot="${i}">
                        <div class="swap-icon">${it.icon}</div>
                        <div class="swap-name">${it.name}</div>
                        <div class="swap-desc">${it.desc || ''}</div>
                        <div class="swap-desc" style="opacity:0.8; margin-top:6px">Cooldown: ${it.cooldown || 0}s (actual: ${cd ? cd.toFixed(1) : '0.0'}s)</div>
                    </div>
                `;
            } else {
                slotsHtml += `
                    <div class="swap-slot" data-slot="${i}">
                        <div class="swap-icon">âž•</div>
                        <div class="swap-name">Slot vacío</div>
                        <div class="swap-desc">Equipar aquí</div>
                    </div>
                `;
            }
        });

        modal.innerHTML = `
            <div class="loot-content">
                <h2>EQUIPAR ACTIVO</h2>
                <div class="new-rune-preview">
                    <span>Nuevo: ${newActiveItem.icon} ${newActiveItem.name}</span>
                    <p>${newActiveItem.desc || ''}</p>
                </div>
                <p class="swap-instruction">Elige en qué slot equiparlo:</p>
                <div class="swap-slots">
                    ${slotsHtml}
                </div>
                <button class="discard-btn" id="cancel-active-swap">Cancelar</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.lootModal = modal;

        modal.querySelectorAll('.swap-slot').forEach(slot => {
            slot.onclick = () => {
                const slotIndex = parseInt(slot.dataset.slot);
                Game.player.equipActiveItem(newActiveItem, slotIndex);
                AudioManager.play('pickup');
                this.closeLootModal();
            };
        });

        const cancel = document.getElementById('cancel-active-swap');
        if (cancel) cancel.onclick = () => this.closeLootModal();
    },

    closeLootModal() {
        if (this.lootModal) {
            this.lootModal.remove();
            this.lootModal = null;
        }
        // If the shop is open, keep the game paused after closing a loot/swap modal.
        Game.paused = !!this.shopModal;

        // Optional hook for game flow (e.g., open portal after boss loot)
        if (typeof Game.onLootModalClosed === 'function') {
            Game.onLootModalClosed();
        }
    },


    // ===========================
    // NG+ PACT MODAL (Blessing + Curse)
    // ===========================
    showNgPlusPactChoice(blessings, curses, onDone) {
        Game.paused = true;

        const modal = document.createElement('div');
        modal.className = 'loot-modal';
        modal.id = 'pact-modal';

        let pickedBlessing = null;

        const render = () => {
            const leftTitle = pickedBlessing ? 'ELIGE UNA MALDICIÃ“N' : 'ELIGE UNA BENDICIÃ“N';
            const list = pickedBlessing ? curses : blessings;

            let cards = '';
            list.forEach((opt, idx) => {
                cards += `
                    <div class="reward-card epic" style="cursor:pointer" data-idx="${idx}">
                        <div class="reward-icon">${pickedBlessing ? '☠️' : 'âœ¨'}</div>
                        <div class="reward-name">${opt.name}</div>
                        <div class="reward-desc">${opt.desc}</div>
                    </div>
                `;
            });

            modal.innerHTML = `
                <div class="loot-content">
                    <h2>NG+ ${Game.ngPlusLevel} â€” ${leftTitle}</h2>
                    <p style="margin:0 0 10px 0; opacity:0.9">
                        Mutación del bioma: <b>${Game.biomeMutation ? Game.biomeMutation.name : 'â€”'}</b>
                        ${Game.biomeMutation ? ` â€” ${Game.biomeMutation.desc}` : ''}
                    </p>
                    ${pickedBlessing ? `<p style="margin:0 0 10px 0; opacity:0.9">Bendición elegida: <b>${pickedBlessing.name}</b></p>` : ''}
                    <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center">
                        ${cards}
                    </div>
                </div>
            `;

            modal.querySelectorAll('[data-idx]').forEach(card => {
                card.onclick = () => {
                    const idx = parseInt(card.dataset.idx);
                    const opt = list[idx];
                    if (!pickedBlessing) {
                        pickedBlessing = opt;
                        AudioManager.play('pickup');
                        render();
                    } else {
                        // picked curse
                        const pickedCurse = opt;
                        AudioManager.play('pickup');
                        modal.remove();
                        Game.paused = false;
                        if (typeof onDone === 'function') onDone(pickedBlessing, pickedCurse);
                    }
                };
            });
        };

        document.body.appendChild(modal);
        render();
    },

    // ===========================
    // SHRINE EVENT
    // ===========================
    showShrineChoice() {
        Game.paused = true;

        const modal = document.createElement('div');
        modal.className = 'loot-modal';
        modal.id = 'shrine-modal';

        const p = Game.player;

        const options = [
            { id: 'heal', icon: '💚', name: 'Sanación', desc: 'Cura 40% de tu HP máximo', apply: () => p.heal(Math.floor(p.maxHp * 0.4)) },
            { id: 'gold', icon: '💰', name: 'Ofrenda', desc: '+200 oro', apply: () => { p.gold += 200; } },
            { id: 'potion', icon: '🧪', name: 'Frascos', desc: '+2 pociones', apply: () => { p.potions = Math.min(10, p.potions + 2); } }
        ];

        let cards = '';
        options.forEach((opt, idx) => {
            cards += `
                <div class="reward-card rare" style="cursor:pointer" data-idx="${idx}">
                    <div class="reward-icon">${opt.icon}</div>
                    <div class="reward-name">${opt.name}</div>
                    <div class="reward-desc">${opt.desc}</div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="loot-content">
                <h2>â›©ï¸ SANTUARIO</h2>
                <p style="margin:0 0 10px 0; opacity:0.9">Elige una bendición rápida:</p>
                <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center">
                    ${cards}
                </div>
                <button class="discard-btn" id="close-shrine">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('[data-idx]').forEach(card => {
            card.onclick = () => {
                const idx = parseInt(card.dataset.idx);
                options[idx].apply();
                ParticleSystem.burst(p.centerX, p.centerY, 18, { color: '#b388ff', life: 0.7, size: 4, speed: 3 });
                AudioManager.play('pickup');
                modal.remove();
                Game.paused = false;
            };
        });

        const closeBtn = modal.querySelector('#close-shrine');
        if (closeBtn) closeBtn.onclick = () => { modal.remove(); Game.paused = false; };
    },

    // ===========================
    // CAMPFIRE EVENT
    // ===========================
    showCampfireChoice() {
        Game.paused = true;

        const modal = document.createElement('div');
        modal.className = 'loot-modal';
        modal.id = 'campfire-modal';

        const p = Game.player;

        const options = [
            { id: 'rest', icon: '🔥', name: 'Descansar', desc: 'Cura 35% de tu HP maximo', apply: () => p.heal(Math.floor(p.maxHp * 0.35)) },
            { id: 'sharpen', icon: '⚔️', name: 'Afilado', desc: '+4 dano permanente (run)', apply: () => { p.damage += 4; } },
            { id: 'brew', icon: '🧪', name: 'Reponer', desc: '+1 pocion', apply: () => { p.potions = Math.min(10, p.potions + 1); } }
        ];

        let cards = '';
        options.forEach((opt, idx) => {
            cards += `
                <div class="reward-card rare" style="cursor:pointer" data-idx="${idx}">
                    <div class="reward-icon">${opt.icon}</div>
                    <div class="reward-name">${opt.name}</div>
                    <div class="reward-desc">${opt.desc}</div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="loot-content">
                <h2>🔥 HOGUERA</h2>
                <p style="margin:0 0 10px 0; opacity:0.9">Tomate un respiro y elegi un beneficio:</p>
                <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center">
                    ${cards}
                </div>
                <button class="discard-btn" id="close-campfire">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('[data-idx]').forEach(card => {
            card.onclick = () => {
                const idx = parseInt(card.dataset.idx);
                options[idx].apply();
                ParticleSystem.burst(p.centerX, p.centerY, 18, { color: '#ffcc80', life: 0.7, size: 4, speed: 3 });
                AudioManager.play('pickup');
                modal.remove();
                Game.paused = false;
            };
        });

        const closeBtn = modal.querySelector('#close-campfire');
        if (closeBtn) closeBtn.onclick = () => { modal.remove(); Game.paused = false; };
    },

    // ===========================
    // PACT EVENT
    // ===========================
    showPactChoice() {
        Game.paused = true;

        const modal = document.createElement('div');
        modal.className = 'loot-modal';
        modal.id = 'pact-event-modal';

        const p = Game.player;

        const options = [];

        const optRune = {
            id: 'rune_slot', icon: '🎒',
            name: i18n.t('pactCursedBagTitle'),
            desc: i18n.t('pactCursedBagDesc'),
            apply: () => {
                if (typeof p.addRuneSlots === 'function') p.addRuneSlots(1);
                p.maxHp = Math.max(30, Math.floor(p.maxHp * 0.9));
                p.hp = Math.min(p.hp, p.maxHp);
            }
        };

        const optActive = {
            id: 'active_slot', icon: '🧰',
            name: i18n.t('pactProfaneSheathTitle'),
            desc: i18n.t('pactProfaneSheathDesc'),
            apply: () => {
                if (typeof p.addActiveSlots === 'function') p.addActiveSlots(1);
                p.speed = Math.max(80, Math.floor(p.speed * 0.88));
            }
        };

        const optRage = {
            id: 'rage', icon: '☠️',
            name: i18n.t('pactFuryTitle'),
            desc: i18n.t('pactFuryDesc'),
            apply: () => {
                p.damage = Math.floor(p.damage * 1.2);
                p.maxMana = Math.max(20, Math.floor(p.maxMana * 0.85));
                p.mana = Math.min(p.mana, p.maxMana);
            }
        };

        options.push(optRune);
        if (!p.activeItems || p.activeItems.length < 2) options.push(optActive);
        options.push(optRage);

        let cards = '';
        options.forEach((opt, idx) => {
            cards += `
                <div class="reward-card epic" style="cursor:pointer" data-idx="${idx}">
                    <div class="reward-icon">${opt.icon}</div>
                    <div class="reward-name">${opt.name}</div>
                    <div class="reward-desc">${opt.desc}</div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="loot-content">
                <h2>${i18n.t('pactTitle')}</h2>
                <p style="margin:0 0 10px 0; opacity:0.9">${i18n.t('pactSubtitle')}</p>
                <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center">
                    ${cards}
                </div>
                <button class="discard-btn" id="close-pact-event">${i18n.t('pactReject')}</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('[data-idx]').forEach(card => {
            card.onclick = () => {
                const idx = parseInt(card.dataset.idx);
                options[idx].apply();
                ParticleSystem.burst(p.centerX, p.centerY, 18, { color: '#ef9a9a', life: 0.7, size: 4, speed: 3 });
                AudioManager.play('pickup');
                modal.remove();
                Game.paused = false;
            };
        });

        const closeBtn = modal.querySelector('#close-pact-event');
        if (closeBtn) closeBtn.onclick = () => { modal.remove(); Game.paused = false; };
    },
    // ===========================
    // SHOP MODAL
    // ===========================
    showShop(shop) {
        if (!shop || !Array.isArray(shop.inventory)) return;

        Game.paused = true;

        if (this.shopModal) {
            this.shopModal.remove();
            this.shopModal = null;
        }

        const modal = document.createElement('div');
        modal.id = 'shop-modal';
        modal.className = 'loot-modal';

        // Click outside the shop panel closes it (prevents being trapped if content overflows)
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) {
                AudioManager.play('menuClick');
                this.closeShop();
            }
        });


        // Sanitize shop inventory against caps (fire rate cap x2, Void Touch max 2)
        const sanitizeShopInventory = () => {
            const p = Game.player;
            if (!p) return;
            for (const entry of shop.inventory) {
                if (!entry || entry.sold) continue;
                // Never touch permanent upgrades
                const itemId = entry.kind === 'item' ? entry.item?.id : null;
                if (itemId === 'rune_pouch' || itemId === 'active_bandolier') continue;

                if (entry.kind === 'rune') {
                    const rarity = entry.rune?.rarity || 'rare';
                    let tries = 0;
                    while (tries++ < 20 && entry.rune && Utils.shouldExcludeRune(entry.rune, p)) {
                        const r = getRandomRune(rarity);
                        if (r) entry.rune = { ...r, rarity };
                        else break;
                    }
                } else if (entry.kind === 'item') {
                    // Only filter normal items (not actives/potions)
                    if (entry.item?.type === 'item') {
                        let tries = 0;
                        while (tries++ < 20 && entry.item && Utils.shouldExcludeItem(entry.item, p)) {
                            const it = ItemDatabase.getRandomItem(entry.item.rarity || 'common');
                            if (it) entry.item = { ...it, type: it.type || 'item' };
                            else break;
                        }
                    }
                }
            }
        };

        sanitizeShopInventory();
        const rerollShop = () => {
            if (!shop.allowReroll) return;
            if ((shop.rerollsLeft || 0) <= 0) return;

            shop.rerollsLeft--;

            shop.inventory.forEach(entry => {
                if (!entry || entry.sold || entry.locked) return;
                // Never reroll permanent upgrades
                const itemId = entry.kind === 'item' ? entry.item?.id : null;
                if (itemId === 'rune_pouch' || itemId === 'active_bandolier') return;

                if (entry.kind === 'rune') {
                    const rarity = entry.rune?.rarity || 'rare';
                    let newRune = null;
                    for (let t = 0; t < 20; t++) {
                        const r = getRandomRune(rarity);
                        if (!r) continue;
                        if (!Utils.shouldExcludeRune(r, Game.player)) { newRune = r; break; }
                    }
                    if (newRune) entry.rune = { ...newRune, rarity };
                } else if (entry.kind === 'item') {
                    // Reroll active items among the known set
                    if (entry.item?.type === 'active') {
                        const pool = ['blink_stone', 'smoke_bomb', 'healing_totem'].map(id => ItemDatabase.get(id)).filter(Boolean);
                        if (pool.length) entry.item = { ...Utils.randomChoice(pool), type: 'active' };
                    }
                }
            });
        };

        const render = () => {
            const p = Game.player;
            let itemsHtml = '';
            shop.inventory.forEach((entry, idx) => {
                const sold = !!entry.sold;
                const price = entry.price || 0;
                const canAfford = p.gold >= price;

                const icon = entry.kind === 'rune' ? entry.rune.icon : entry.item.icon;
                const name = entry.kind === 'rune' ? entry.rune.name : entry.item.name;
                const desc = entry.kind === 'rune' ? (entry.rune.desc || '') : (entry.item.desc || entry.item.effect || '');
                const rarity = entry.kind === 'rune' ? (entry.rune.rarity || 'common') : (entry.item.rarity || 'common');
                const kindLabel = entry.kind === 'rune' ? 'RUNA' : 'ITEM';

                const locked = !!entry.locked;

                const lockBtn = shop.allowLock ? `
                    <button class="action-btn" style="margin-top:6px; padding:6px 10px; font-size:11px" ${sold ? 'disabled' : ''} data-lock="${idx}">
                        ${locked ? '🔒 LOCK' : '🔓 LOCK'}
                    </button>` : '';

                itemsHtml += `
                    <div class="reward-card ${rarity} ${sold ? 'sold' : ''}" style="cursor:${sold ? 'not-allowed' : 'pointer'}" data-idx="${idx}">
                        <div class="reward-icon">${icon}</div>
                        <div class="reward-name">${name}</div>
                        <div class="reward-desc" style="margin-top:4px; opacity:0.85; font-size:10px; letter-spacing:1px">${kindLabel}</div>
                        <div class="reward-desc">${desc}</div>
                        <div class="reward-desc" style="margin-top:6px; opacity:0.9">💰 ${price}</div>
                        <button class="action-btn" style="margin-top:8px; padding:8px 12px; font-size:12px" ${sold || !canAfford ? 'disabled' : ''}>
                            ${sold ? i18n.t('shopBought') : (canAfford ? i18n.t('shopBuy') : i18n.t('shopNoGold'))}
                        </button>
                        ${lockBtn}
                    </div>
                `;
            });

            const title = shop.theme === 'blackmarket' ? i18n.t('shopBlackmarket') : i18n.t('shopTitle');
            const sub = shop.theme === 'blackmarket'
                ? i18n.t('shopSubBlackmarket')
                : i18n.t('shopSub');

            const rerollBtn = shop.allowReroll ? `
                <button class="action-btn" id="reroll-shop" style="margin:6px 6px 0 0; padding:8px 12px; font-size:12px" ${(shop.rerollsLeft || 0) <= 0 ? 'disabled' : ''}>
                    ${i18n.f('shopReroll',{n:(shop.rerollsLeft||0)})}
                </button>` : '';

            const recyclerBtn = `
                <button class="action-btn" id="open-recycler" style="margin:6px 6px 0 0; padding:8px 12px; font-size:12px">
                    ${i18n.t('shopRecycle')}
                </button>`;

            const sellerBtn = `
                <button class="action-btn" id="open-seller" style="margin:6px 6px 0 0; padding:8px 12px; font-size:12px">
                    ${i18n.t('shopSell')}
                </button>`;

            modal.innerHTML = `
                <div class="loot-content">
                    <h2>${title}</h2>
                    <p style="margin:0 0 6px 0; opacity:0.9">${sub}</p>
                    <p style="margin:0 0 10px 0; opacity:0.9">${i18n.f('shopGoldLabel',{n:Game.player.gold})}</p>
                    <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap">
                        ${rerollBtn}
                        ${recyclerBtn}
                        ${sellerBtn}
                    </div>
                    <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center; margin-top:10px">
                        ${itemsHtml}
                    </div>
                    <button class="discard-btn" id="close-shop">${i18n.t('shopClose')}</button>
                </div>
            `;

            const reroll = modal.querySelector('#reroll-shop');
            if (reroll) reroll.onclick = () => { AudioManager.play('menuClick'); rerollShop(); render(); };

            const btnRec = modal.querySelector('#open-recycler');
            if (btnRec) btnRec.onclick = () => {
                AudioManager.play('menuClick');
                this.showExchangeModal('recycle', () => render());
            };

            const btnSell = modal.querySelector('#open-seller');
            if (btnSell) btnSell.onclick = () => {
                AudioManager.play('menuClick');
                this.showExchangeModal('sell', () => render());
            };

            modal.querySelectorAll('[data-lock]').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.lock);
                    const entry = shop.inventory[idx];
                    if (!entry || entry.sold) return;
                    entry.locked = !entry.locked;
                    AudioManager.play('menuClick');
                    render();
                };
            });

            modal.querySelectorAll('[data-idx]').forEach(card => {
                const idx = parseInt(card.dataset.idx);
                const buyBtn = card.querySelector('button');
                if (!buyBtn) return;

                buyBtn.onclick = (e) => {
                    e.stopPropagation();
                    const entry = shop.inventory[idx];
                    if (!entry || entry.sold) return;
                    const price = entry.price || 0;
                    if (Game.player.gold < price) {
                        AudioManager.play('hurt');
                        return;
                    }
                    Game.player.gold -= price;
                    entry.sold = true;

                    if (entry.kind === 'rune') {
                        UI.handleRuneChoice({ ...entry.rune }, 'shop');
                    } else {
                        Game.handleLoot({ ...entry.item });
                    }

                    // Meta tracking for permanent upgrades
                    try {
                        if (window.Meta && typeof Meta.recordPurchase === 'function') {
                            const id = entry.kind === 'item' ? entry.item?.id : null;
                            if (id) Meta.recordPurchase(id);
                        }
                    } catch (e) { }

                    // Optional downside
                    if (typeof entry.onBuy === 'function') {
                        entry.onBuy();
                    }

                    AudioManager.play('pickup');
                    render();
                };
            });

            const closeBtn = modal.querySelector('#close-shop');
            if (closeBtn) closeBtn.onclick = () => this.closeShop();
        };

        document.body.appendChild(modal);
        this.shopModal = modal;
        render();
    },

    // mode: 'recycle' | 'sell'
    showExchangeModal(mode = 'recycle', onDone = null) {
        // Close existing exchange modal
        try { if (this.exchangeModal) this.exchangeModal.remove(); } catch (e) {}
        this.exchangeModal = null;

        const modal = document.createElement('div');
        modal.id = 'loot-modal';
        modal.className = 'loot-modal';

        const p = Game.player;

        // Build selectable entries: runes + active items
        const entries = [];
        (p.runes || []).forEach((r, idx) => {
            if (!r) return;
            // Skip placeholder/empty runes
            if (r.id === 'empty_rune') return;
            entries.push({ kind: 'rune', idx, obj: r, rarity: (r.rarity || 'common') });
        });
        (p.activeItems || []).forEach((it, idx) => {
            if (!it) return;
            entries.push({ kind: 'active', idx, obj: it, rarity: (it.rarity || 'rare') });
        });

        const title = mode === 'sell' ? i18n.t('shopSell') : i18n.t('shopRecycle');
        const hint = mode === 'sell'
            ? i18n.t('shopSellHint')
            : i18n.t('shopRecycleHint');

        // Gold values
        const runeSellValue = (rarity) => {
            switch ((rarity || 'common').toLowerCase()) {
                case 'legendary': return 350;
                case 'epic': return 220;
                case 'rare': return 130;
                default: return 70;
            }
        };
        const activeSellValue = (rarity) => {
            switch ((rarity || 'rare').toLowerCase()) {
                case 'legendary': return 420;
                case 'epic': return 320;
                default: return 200;
            }
        };

        let listHtml = '';
        if (!entries.length) {
            listHtml = `<p style="opacity:0.85">No tenés runas/activos para ${mode === 'sell' ? 'vender' : 'reciclar'}.</p>`;
        } else {
            entries.forEach((e, i) => {
                const icon = e.obj.icon || 'â“';
                const name = e.obj.name || 'Sin nombre';
                const kind = e.kind === 'rune' ? 'RUNA' : 'ACTIVO';
                const rarity = (e.rarity || 'common');
                const value = e.kind === 'rune' ? runeSellValue(rarity) : activeSellValue(rarity);
                const extra = mode === 'sell' ? `💰 ${value}` : `🎲 ${rarity.toUpperCase()}`;
                listHtml += `
                    <div class="reward-card ${rarity}" style="cursor:pointer; min-width:220px" data-ex="${i}">
                        <div class="reward-icon">${icon}</div>
                        <div class="reward-name">${name}</div>
                        <div class="reward-desc" style="margin-top:4px; opacity:0.85; font-size:10px; letter-spacing:1px">${kind}</div>
                        <div class="reward-desc" style="margin-top:6px; opacity:0.9">${extra}</div>
                        <button class="action-btn" style="margin-top:8px; padding:8px 12px; font-size:12px">
                            ${mode === 'sell' ? 'VENDER' : 'RECICLAR'}
                        </button>
                    </div>
                `;
            });
        }

        modal.innerHTML = `
            <div class="loot-content">
                <h2>${title}</h2>
                <p style="margin:0 0 10px 0; opacity:0.9">${hint}</p>
                <p style="margin:0 0 10px 0; opacity:0.9">Oro: 💰 ${p.gold}</p>
                <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center; margin-top:10px">
                    ${listHtml}
                </div>
                <button class="discard-btn" id="close-exchange">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.exchangeModal = modal;

        const close = modal.querySelector('#close-exchange');
        if (close) close.onclick = () => {
            try { modal.remove(); } catch (e) {}
            this.exchangeModal = null;
            if (typeof onDone === 'function') onDone();
        };

        modal.querySelectorAll('[data-ex]').forEach(card => {
            const i = parseInt(card.dataset.ex);
            const entry = entries[i];
            const btn = card.querySelector('button');
            if (!btn) return;
            btn.onclick = (ev) => {
                ev.stopPropagation();
                if (!entry) return;

                if (mode === 'sell') {
                    if (entry.kind === 'rune') {
                        const v = runeSellValue(entry.rarity);
                        p.gold += v;
                        p.equipRune(null, entry.idx);
                    } else {
                        const v = activeSellValue(entry.rarity);
                        p.gold += v;
                        p.activeItems[entry.idx] = null;
                        p.activeCooldowns[entry.idx] = 0;
                    }
                    AudioManager.play('pickup');
                    this.toastMessage('💰 Venta realizada');
                } else {
                    if (entry.kind === 'rune') {
                        const r = getRandomRune(entry.rarity || 'common');
                        if (r) {
                            p.equipRune({ ...r, rarity: (entry.rarity || r.rarity || 'common') }, entry.idx);
                            AudioManager.play('pickup');
                            this.toastMessage('♻️ Runa reciclada');
                        }
                    } else {
                        const pool = ['blink_stone', 'smoke_bomb', 'healing_totem'].map(id => ItemDatabase.get(id)).filter(Boolean);
                        if (pool.length) {
                            const newIt = { ...Utils.randomChoice(pool), type: 'active' };
                            p.activeItems[entry.idx] = newIt;
                            p.activeCooldowns[entry.idx] = 0;
                            AudioManager.play('pickup');
                            this.toastMessage('♻️ Activo reciclado');
                        }
                    }
                }

                // Re-render the modal (gold + list)
                try { modal.remove(); } catch (e) {}
                this.exchangeModal = null;
                this.showExchangeModal(mode, onDone);
            };
        });
    },

    // =========================
    // FORGE TERMINAL (Demencial)
    // =========================
    showForgeTerminal(forgeData) {
        // forgeData: { cost, biomeId }
        if (this.forgeModal) return;
        const overlay = document.getElementById('forge-overlay');
        if (!overlay) return;

        // Pause game while open
        try { Game.paused = true; } catch (e) { }

        this.forgeModal = true;
        overlay.classList.remove('hidden');

        // Populate rune list
        const list = document.getElementById('forge-rune-list');
        const editor = document.getElementById('forge-editor');
        const info = document.getElementById('forge-info');
        const docs = document.getElementById('forge-docs');
        const costEl = document.getElementById('forge-cost');
        const btnProgram = document.getElementById('btn-forge-program');
        const btnClose = document.getElementById('btn-close-forge');
        const btnValidate = document.getElementById('btn-forge-validate');
        const templates = document.getElementById('forge-templates');

        const emptyRunes = (Game.player && Game.player.runes) ? Game.player.runes
            .map((r, idx) => ({ r, idx }))
            .filter(x => x.r && x.r.id === 'empty_rune' && !x.r.programmed) : [];

        list.innerHTML = '';
        let selectedIdx = emptyRunes.length ? emptyRunes[0].idx : -1;

        function renderList() {
            list.innerHTML = '';
            for (const it of emptyRunes) {
                const btn = document.createElement('button');
                btn.className = 'forge-rune-btn' + (it.idx === selectedIdx ? ' active' : '');
                btn.textContent = `â¬œ Runa Vacía (slot ${it.idx + 1})`;
                btn.onclick = () => { selectedIdx = it.idx; renderList(); };
                list.appendChild(btn);
            }
            if (emptyRunes.length === 0) {
                const p = document.createElement('div');
                p.className = 'forge-empty';
                p.textContent = 'No tenés Runas Vacías.';
                list.appendChild(p);
            }
        }
        renderList();

        if (templates) {
            templates.onchange = () => {
                const v = templates.value;
                if (v && window.RuneScript && RuneScript.templates[v]) {
                    editor.value = RuneScript.templates[v];
                    try { updateCost(); } catch (e) { }
                }
            };
        }

        if (info) info.textContent = `Costo base: ${forgeData.cost} oro â€¢ Bioma: ${forgeData.biomeId}`;

        // Docs panel
        if (docs && window.RuneScript && typeof RuneScript.getDocsHTML === 'function') {
            docs.innerHTML = RuneScript.getDocsHTML();
        } else if (docs) {
            docs.innerHTML = '<div class="doc-section"><h4>Comandos</h4><div class="doc-kv">Cargando…</div></div>';
        }

        // Init docs tabs/pages
        if (docs) this.initForgeDocs(docs);

        let lastValidation = null;

        function updateCost() {
            if (!costEl || !window.RuneScript || typeof RuneScript.analyze !== 'function') return;
            const a = RuneScript.analyze(editor.value || '');
            if (!a.ok) {
                costEl.textContent = '';
                return;
            }
            const total = forgeData.cost + a.extraCost;
            costEl.textContent = `Total: ${total} (base ${forgeData.cost} + script ${a.extraCost})`;
        }

        function validate() {
            if (!window.RuneScript) return { ok: false, error: 'Motor de runas no cargado.' };
            const res = RuneScript.compile(editor.value || '');
            lastValidation = res;
            const out = document.getElementById('forge-validate-output');
            if (out) {
                out.textContent = res.ok ? 'âœ… OK' : ('❌ ' + res.error);
                out.className = res.ok ? 'forge-ok' : 'forge-bad';
            }
            return res;
        }

        // Recalculate dynamic cost live
        if (editor) {
            editor.oninput = () => { updateCost(); };
            updateCost();
        }

        if (btnValidate) btnValidate.onclick = () => { AudioManager.play('menuClick'); validate(); };

        if (btnProgram) btnProgram.onclick = () => {
            AudioManager.play('menuClick');
            if (selectedIdx < 0) return;
            const res = validate();
            if (!res.ok) return;

            const a = (window.RuneScript && typeof RuneScript.analyze === 'function')
                ? RuneScript.analyze(editor.value || '')
                : { ok: true, extraCost: 0 };
            if (!a.ok) return;

            const totalCost = forgeData.cost + (a.extraCost || 0);

            if (!Game.player || Game.player.gold < totalCost) {
                const out = document.getElementById('forge-validate-output');
                if (out) { out.textContent = `❌ Oro insuficiente (necesitás ${totalCost})`; out.className = 'forge-bad'; }
                return;
            }

            // Apply programming
            Game.player.gold -= totalCost;
            const rune = Game.player.runes[selectedIdx];
            rune.programmed = true;
            rune.scriptText = editor.value || '';
            rune.script = res.program;
            rune.name = 'Runa Programada';
            rune.icon = '🧩';
            rune.desc = 'Ejecuta tu pseudo-código.';

            // Risk: small chance of ambush
            try { Game.onForgeUsed && Game.onForgeUsed(); } catch (e) { }

            this.hideForgeTerminal();
        };

        if (btnClose) btnClose.onclick = () => { AudioManager.play('menuClick'); this.hideForgeTerminal(); };
    },

    hideForgeTerminal() {
        const overlay = document.getElementById('forge-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.forgeModal = false;
        try { Game.paused = false; } catch (e) { }
    },


    closeShop() {
        if (this.shopModal) {
            this.shopModal.remove();
            this.shopModal = null;
        }
        Game.paused = false;
    },

    // =========================
    // SHOP: RECYCLER / SELLER
    // =========================
    showExchangeModal(mode = 'recycle', onDone = null) {
        // mode: 'recycle' | 'sell'
        const p = Game.player;
        if (!p) return;

        // Build list: runes + active items (avoid permanent passive items)
        const entries = [];
        (p.runes || []).forEach((r, idx) => {
            if (!r || r.id === 'empty_rune') return;
            entries.push({ kind: 'rune', idx, icon: r.icon, name: r.name, desc: r.desc || '', rarity: r.rarity || 'common' });
        });
        (p.activeItems || []).forEach((it, idx) => {
            if (!it) return;
            entries.push({ kind: 'active', idx, icon: it.icon, name: it.name, desc: it.desc || it.effect || '', rarity: it.rarity || 'common' });
        });

        const title = (mode === 'sell') ? i18n.t('shopSell') : i18n.t('shopRecycle');
        const hint = (mode === 'sell')
            ? i18n.t('shopSellHint')
            : i18n.t('shopRecycleHint');

        const overlay = document.createElement('div');
        overlay.className = 'loot-modal';
        overlay.id = 'exchange-modal';

        const listHtml = entries.length ? entries.map((e, i) => {
            const tag = e.kind === 'rune' ? 'RUNA' : 'ACTIVO';
            let sellLine = '';
            if (mode === 'sell') {
                let gain = 80;
                const r = e.rarity || 'common';
                if (r === 'rare') gain = 140;
                if (r === 'epic') gain = 240;
                if (r === 'legendary') gain = 420;
                sellLine = `<div class="reward-desc" style="margin-top:6px; opacity:0.95">💰 +${gain} oro</div>`;
            }
            return `
                <div class="reward-card ${e.rarity}" style="cursor:pointer" data-ex="${i}">
                    <div class="reward-icon">${e.icon}</div>
                    <div class="reward-name">${e.name}</div>
                    <div class="reward-desc" style="margin-top:4px; opacity:0.85; font-size:10px; letter-spacing:1px">${tag}</div>
                    <div class="reward-desc">${e.desc}</div>
                    ${sellLine}
                </div>
            `;
        }).join('') : `<div style="opacity:0.8; padding:12px">No tenés runas/activos para ${mode === 'sell' ? 'vender' : 'reciclar'}.</div>`;

        overlay.innerHTML = `
            <div class="loot-content">
                <h2>${title}</h2>
                <p style="margin:0 0 10px 0; opacity:0.9">${hint}</p>
                <p style="margin:0 0 10px 0; opacity:0.9">Oro: 💰 ${p.gold}</p>
                <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center; margin-top:10px">
                    ${listHtml}
                </div>
                <button class="discard-btn" id="close-exchange">Volver</button>
            </div>
        `;

        const close = () => {
            try { overlay.remove(); } catch (e) { }
            if (typeof onDone === 'function') onDone();
        };

        overlay.querySelector('#close-exchange').onclick = () => { AudioManager.play('menuClick'); close(); };

        overlay.querySelectorAll('[data-ex]').forEach(card => {
            card.onclick = () => {
                const pick = entries[parseInt(card.dataset.ex)];
                if (!pick) return;

                if (mode === 'sell') {
                    let gain = 80;
                    const r = pick.rarity || 'common';
                    if (r === 'rare') gain = 140;
                    if (r === 'epic') gain = 240;
                    if (r === 'legendary') gain = 420;

                    if (pick.kind === 'rune') {
                        p.runes[pick.idx] = null;
                    } else if (pick.kind === 'active') {
                        p.activeItems[pick.idx] = null;
                        p.activeCooldowns[pick.idx] = 0;
                    }
                    p.gold += gain;
                    try { if (window.UI && typeof UI.toastMessage === 'function') UI.toastMessage(`+${gain} oro`); } catch (e) {}
                    AudioManager.play('pickup');
                    close();
                    return;
                }

                // recycle
                if (pick.kind === 'rune') {
                    const rarity = pick.rarity || 'common';
                    const newRune = (typeof getRandomRune === 'function') ? getRandomRune(rarity) : null;
                    if (newRune) {
                        p.equipRune({ ...newRune, rarity }, pick.idx);
                        AudioManager.play('pickup');
                    }
                    close();
                    return;
                }

                if (pick.kind === 'active') {
                    const pool = ['blink_stone', 'smoke_bomb', 'healing_totem']
                        .map(id => ItemDatabase.get(id))
                        .filter(Boolean);
                    if (pool.length) {
                        p.activeItems[pick.idx] = { ...Utils.randomChoice(pool), type: 'active' };
                        p.activeCooldowns[pick.idx] = 0;
                        AudioManager.play('pickup');
                    }
                    close();
                    return;
                }
            };
        });

        document.body.appendChild(overlay);
    },

    // ===========================
    // STATS OVERLAY
    // ===========================

    showStatsOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'stats-overlay';
        overlay.className = 'overlay';

        const p = Game.player;
        const d = Game.dungeon;

        overlay.innerHTML = `
            <div class="stats-content">
                <h2>${i18n.t('statsTitle')}</h2>
                <div class="stats-grid">
                    <div class="stat-item"><span>${i18n.t('statBiome')}</span><span>${Game.currentBiome}</span></div>
                    <div class="stat-item"><span>${i18n.t('statRoom')}</span><span>${d.currentRoomIndex + 1}/${d.roomsPerBiome}</span></div>
                    <div class="stat-item"><span>HP</span><span>${Math.floor(p.hp)}/${p.maxHp}</span></div>
                    <div class="stat-item"><span>${i18n.t('statGold')}</span><span>💰 ${p.gold}</span></div>
                    <div class="stat-item"><span>Kills</span><span>💀 ${p.stats.kills}</span></div>
                    <div class="stat-item"><span>${i18n.t('statDmgDealt')}</span><span>⚔️ ${p.stats.damageDealt}</span></div>
                    <div class="stat-item"><span>${i18n.t('statDmgTaken')}</span><span>❤️ ${p.stats.damageTaken}</span></div>
                    <div class="stat-item"><span>${i18n.t('statRoomsCleared')}</span><span>🚪 ${p.stats.roomsCleared}</span></div>
                    <div class="stat-item"><span>${i18n.t('statBiomesCleared')}</span><span>🗺️ ${p.stats.biomesCleared}</span></div>
                    <div class="stat-item"><span>${i18n.t('statTime')}</span><span>⏱️ ${Utils.formatTime(Game.playTime)}</span></div>
                </div>
                <h3>${i18n.t('statsRunesEquipped')}</h3>
                <div class="stats-runes">
                    ${p.runes.map((r, i) => r ? `<div class="stat-rune">${r.icon} ${r.name}</div>` : '').join('')}
                </div>
                <button class="close-stats-btn" id="close-stats">${i18n.t('btnClose')}</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('close-stats').onclick = () => {
            overlay.remove();
        };
    },

    // ===========================
    // HUD UPDATE
    // ===========================

    setupUpdatesEvents() {
        const backBtn = document.getElementById('btn-back-updates');
        if (backBtn) {
            backBtn.onclick = () => {
                AudioManager.play('menuClick');
                this.showScreen('main-menu');
            };
        }
    },



    // New helper to check if mouse is over UI (to prevent shooting)
    shouldPreventShooting() {
        // If any overlay is active (pause, shop, etc)
        if (this.currentScreen !== 'game-screen') return true;
        if (this.isBlockingOverlayOpen()) return true;

        // Check exact hover on interactive elements
        // We use :hover pseudo-class check safely
        const hovered = document.querySelector('.rune-slot:hover, .skill-slot:hover, .menu-btn:hover, .codex-tab:hover, .set-icon:hover, .passive-icon:hover');
        return !!hovered;
    },

    updateHUD(player, room, dungeon) {
        if (!player) return;

        // Vitals
        const hpPct = (player.hp / player.maxHp) * 100;
        const manaPct = (player.mana / player.maxMana) * 100;

        const hpFill = document.getElementById('health-fill');
        const manaFill = document.getElementById('mana-fill');
        const hpText = document.getElementById('health-text');
        const manaText = document.getElementById('mana-text');

        if (hpFill) hpFill.style.width = `${Math.max(0, hpPct)}%`;
        if (manaFill) manaFill.style.width = `${Math.max(0, manaPct)}%`;
        if (hpText) hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
        if (manaText) manaText.textContent = `${Math.floor(player.mana)}/${player.maxMana}`;

        // Top Right Stats
        const goldEl = document.getElementById('gold-display');
        if (goldEl) goldEl.textContent = `💰 ${player.gold}`;

        // Biome / Sala / Event Info (Top Left)
        const biomeEl = document.getElementById('biome-display');
        const roomNumEl = document.getElementById('room-num-display');
        const eventRow = document.getElementById('event-row');
        const eventNameEl = document.getElementById('event-name');

        if (biomeEl && window.Game && window.BiomeOrder) {
            const idx = BiomeOrder.indexOf(Game.currentBiome);
            const biomeNum = (idx >= 0 ? idx : 0) + 1;
            biomeEl.textContent = `${biomeNum}/12`;
        }
        if (roomNumEl && dungeon) {
            roomNumEl.textContent = `${dungeon.currentRoomIndex + 1}/${dungeon.roomsPerBiome}`;
        }
        // Event display
        if (eventRow && eventNameEl && room) {
            // Event display lookup
            const eventNames = {
                'mud': 'Barro', 'meteors': 'Meteoritos', 'toxic_fog': 'Niebla Tóxica',
                'darkness': 'Oscuridad', 'lightning': 'Rayos', 'ice': 'Hielo',
                'gravity_wells': 'Pozos de Gravedad', 'spikes': 'Pinchos',
                'mana_drain': 'Drenaje Maná', 'anti_magic': 'Anti-Magia',
                'enrage': 'Furia', 'barrels': 'Barriles'
            };

            const mods = room.roomModifiers || [];
            if (mods.length > 0) {
                eventRow.style.display = 'flex';
                // Map ID to name, fallback to ID if missing
                eventNameEl.textContent = mods.map(m => eventNames[m.id] || m.id).join(', ');
            } else {
                eventRow.style.display = 'flex';
                eventNameEl.textContent = '---';
            }
        }

        // Set bonus display (Top Left)
        try {
            const setRow = document.getElementById('set-row');
            const setNameEl = document.getElementById('set-name');
            const sets = window.SetDatabase || {};

            const owned = {};
            if (player && Array.isArray(player.passiveItems)) {
                for (const it of player.passiveItems) {
                    if (!it || !it.setId) continue;
                    owned[it.setId] = owned[it.setId] || new Set();
                    if (it.setPiece) owned[it.setId].add(it.setPiece);
                }
            }

            const completed = [];
            for (const sid of Object.keys(sets)) {
                const def = sets[sid];
                const total = (def.pieces || []).length;
                const got = owned[sid] ? owned[sid].size : 0;
                if (total > 0 && got >= total) completed.push(def.name || sid);
            }

            if (setRow && setNameEl) {
                if (completed.length) {
                    setRow.style.display = 'flex';
                    setNameEl.textContent = completed.map(n => `${(window.i18n ? i18n.t('setBonus') : 'BONUS DE SET')}: ${n}`).join(' | ');
                } else {
                    setRow.style.display = 'none';
                }
            }
        } catch (e) { }

        // Run Objectives
        const objList = document.getElementById('objectives-list');
        if (objList && window.Game && Array.isArray(Game.runObjectives)) {
            objList.innerHTML = '';
            const list = Game.runObjectives;
            if (!list.length) {
                objList.innerHTML = '<div class="objective"><div class="obj-line"><span class="obj-name">Sin objetivos</span></div></div>';
            } else {
                list.forEach(o => {
                    const cur = (Game.getObjectiveProgress ? Game.getObjectiveProgress(o) : 0) || 0;
                    const target = (typeof o.target === 'number') ? o.target : 1;
                    const done = !!o.completed || cur >= target;
                    const curVal = Math.floor(cur);
                    const targetVal = Math.max(1, Math.floor(target));
                    const progText = (o.id === 'time')
                        ? `${Utils.formatTime(curVal)}/${Utils.formatTime(targetVal)}`
                        : `${Math.min(curVal, targetVal)}/${targetVal}`;
                    const rewardText = (o.reward && o.reward.text) ? o.reward.text : '';

                    const div = document.createElement('div');
                    div.className = 'objective' + (done ? ' done' : '');
                    div.innerHTML = `
                        <div class="obj-line">
                            <span class="obj-name">${done ? 'OK ' : ''}${o.name || 'Objetivo'}</span>
                            <span class="obj-progress">${progText}</span>
                        </div>
                        <div class="obj-desc">${o.desc || ''}</div>
                        ${rewardText ? `<div class="obj-reward">Recompensa: ${rewardText}</div>` : ''}
                    `;
                    objList.appendChild(div);
                });
            }
        }

        // HUD Synergies (below objectives)
        const synPanel = document.getElementById('synergies-panel');
        const synList = document.getElementById('synergies-list');
        if (synPanel && synList && window.SynergySystem) {
            const synergies = SynergySystem.getActiveSynergies ? SynergySystem.getActiveSynergies() : [];
            const has = Array.isArray(synergies) && synergies.length > 0;

            // Mode A: always visible (show empty state)
            // Mode B: visible only when toggled AND there are active synergies
            const visible = this.synergyAlwaysVisible ? true : (this.synergyPanelVisible && has);

            if (!visible) {
                synPanel.classList.add('hidden');
            } else {
                synPanel.classList.remove('hidden');
                synList.innerHTML = '';
                if (!has) {
                    synList.innerHTML = `<div class="synergy-item"><div class="syn-name">${(window.i18n&&i18n.t)?i18n.t('synergiesNoneTitle'):'No active synergies'}</div><div class="syn-desc">${(window.i18n&&i18n.t)?i18n.t('synergiesNoneDesc'):'Combine runes to activate synergies.'}</div></div>`;
                } else {
                    synergies.forEach(s => {
                        const div = document.createElement('div');
                        div.className = 'synergy-item';
                        div.innerHTML = `
                            <div class="syn-name">⚡ ${s.name}</div>
                            <div class="syn-desc">${s.desc || ''}</div>
                        `;
                        synList.appendChild(div);
                    });
                }
            }
        }


        // Bottom Center: Runs
        this.ensureRuneSlotElements(player.runes.length);
        const runeSlots = document.querySelectorAll('.rune-slot');
        player.runes.forEach((rune, i) => {
            const el = runeSlots[i];
            if (!el) return;
            // Clear content first
            el.innerHTML = '';
            el.className = 'rune-slot ' + (rune ? 'filled' : 'empty');

            if (rune) {
                el.textContent = rune.icon;
                el.title = `${rune.name}\n${rune.desc || ''}`;
            } else {
                el.title = 'Runa Vacía';
            }
        });

        // Bottom Center: Skills
        // Dash
        const dashFill = document.getElementById('dash-cooldown-fill');
        if (dashFill) {
            // Inverted logic: fill means "on cooldown" usually, or "ready"?
            // Let's make it an overlay that shrinks as CD recovers (height 100% -> 0%)
            // player.dashCooldownTimer counts DOWN from max.
            if (player.dashCooldown > 0) {
                const ratio = player.dashCooldownTimer / player.dashCooldown; // 1.0 -> 0.0
                dashFill.style.height = `${ratio * 100}%`;
            } else {
                dashFill.style.height = '0%';
            }
        }

        // Active Slots
        // Slot 0 (F)
        const active0 = document.getElementById('active-slot-0');
        if (active0) {
            const item = (player.activeItems && player.activeItems[0]);
            const icon = active0.querySelector('.skill-icon');
            const cdOverlay = active0.querySelector('.cooldown-overlay');

            if (item) {
                active0.classList.remove('empty');
                if (icon) { icon.textContent = item.icon; icon.classList.remove('empty'); }
                active0.title = `${item.name} [F]\n${item.desc}`;

                // CD
                const current = (player.activeCooldowns && player.activeCooldowns[0]) || 0;
                const max = item.cooldown || 1;
                const ratio = Math.max(0, Math.min(1, current / max));
                if (cdOverlay) cdOverlay.style.height = `${ratio * 100}%`;
            } else {
                active0.classList.add('empty');
                if (icon) { icon.textContent = ''; icon.classList.add('empty'); }
                active0.title = 'Slot Vacío [F]';
                if (cdOverlay) cdOverlay.style.height = '0%';
            }
        }

        // Slot 1 (G)
        const active1 = document.getElementById('active-slot-1');
        if (active1) {
            // Check if unlocked? 
            // In game.js, adding slots is supported. We assume if player.activeItems.length > 1, it's unlocked.
            const unlocked = (player.activeItems && player.activeItems.length > 1);
            if (unlocked) {
                active1.classList.remove('locked');
                const item = player.activeItems[1];
                // Need to create structure similarly if not exists? 
                // HTML has simple structure. Let's just update if unlocked.
                if (!active1.querySelector('.skill-icon')) {
                    // Lazy init structure if needed, or assume HTML is static for now.
                    // The HTML was: <div class="skill-slot locked" id="active-slot-1"><span class="key-hint">G</span></div>
                    // We need to add icon/overlay if unlocked
                    active1.innerHTML = `<div class="skill-icon empty"></div><div class="cooldown-overlay"></div><span class="key-hint">G</span>`;
                }

                const icon = active1.querySelector('.skill-icon');
                const cdOverlay = active1.querySelector('.cooldown-overlay');

                if (item) {
                    active1.classList.remove('empty');
                    if (icon) { icon.textContent = item.icon; icon.classList.remove('empty'); }
                    active1.title = `${item.name} [G]\n${item.desc}`;

                    const current = (player.activeCooldowns && player.activeCooldowns[1]) || 0;
                    const max = item.cooldown || 1;
                    const ratio = Math.max(0, Math.min(1, current / max));
                    if (cdOverlay) cdOverlay.style.height = `${ratio * 100}%`;
                } else {
                    active1.classList.add('empty');
                    if (icon) { icon.textContent = ''; icon.classList.add('empty'); }
                    active1.title = 'Slot Vacío [G]';
                    if (cdOverlay) cdOverlay.style.height = '0%';
                }
            } else {
                active1.classList.add('locked');
                active1.innerHTML = `<span class="key-hint">G</span>`;
        active1.title = i18n.t('lockedUpgradeShop');
            }
        }

        // Potion
        const potionSlot = document.getElementById('potion-slot');
        if (potionSlot) {
            const count = potionSlot.querySelector('.potion-count');
            if (count) count.textContent = `x${player.potions}`;
        }

        // Items Panel (Right Side) - Only items, NOT runes
        const itemsList = document.getElementById('items-list');
        if (itemsList) {
            itemsList.innerHTML = '';
            if (player.passiveItems && player.passiveItems.length > 0) {
                player.passiveItems.forEach(it => {
                    const entry = document.createElement('div');
                    entry.className = 'item-entry rarity-' + (it.rarity || 'common');
                    entry.innerHTML = `<span class="item-icon">${it.icon || '📦'}</span><span>${it.name}</span>`;
                    entry.title = it.desc || '';
                    itemsList.appendChild(entry);
                });
            }
        }
        // Minimap
        try { this.updateMinimap(dungeon); } catch (e) { }
    },

    // ===========================
    // PAUSE MENU
    // ===========================

    showPauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (!menu) return;
        menu.classList.remove('hidden');

        // Fill pause info (safe if Game is not ready)
        try {
            const p = Game.player;
            const d = Game.dungeon;
            const biomesTotal = (window.Biomes && Array.isArray(Biomes)) ? Biomes.length : 12;

            const elBiome = document.getElementById('pause-biome');
            if (elBiome) elBiome.textContent = `Bioma ${Game.currentBiome}/${biomesTotal}`;

            const elRoom = document.getElementById('pause-room');
            if (elRoom && d) elRoom.textContent = `Sala ${d.currentRoomIndex + 1}/${d.roomsPerBiome}`;

            const elHp = document.getElementById('pause-hp');
            if (elHp && p) elHp.textContent = `HP ${Math.floor(p.hp)}/${p.maxHp}`;

            const elGold = document.getElementById('pause-gold');
            if (elGold && p) elGold.textContent = `💰 ${p.gold}`;
            
            // Add seed display
            const seedContainer = document.getElementById('pause-seed-container');
            if (seedContainer && Game.seedText) {
                seedContainer.innerHTML = `
                    <div class="seed-display">
                        <span>🎲 Seed: <code>${Game.seedText}</code></span>
                        <button id="pause-copy-seed" class="copy-seed-btn">📋 Copiar</button>
                    </div>
                `;
                
                const copyBtn = document.getElementById('pause-copy-seed');
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(Game.seedText).then(() => {
                            this.showToast('📋 Seed copiada');
                        });
                        AudioManager.play('menuClick');
                    });
                }
            }
        } catch (e) { }
    },

    hidePauseMenu() {
        document.getElementById('pause-menu').classList.add('hidden');
    },

    showDeathScreen(player) {
        this._ensureDeathScreen();
        const screen = document.getElementById('death-screen');
        if (!screen) {
            console.warn('[UI] death-screen missing; cannot show death UI');
            return;
        }
        screen.classList.remove('hidden');

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('stat-biomes', player?.stats?.biomesCleared ?? 0);
        setText('stat-kills', player?.stats?.kills ?? 0);
        setText('stat-damage', Utils.formatNumber(player?.stats?.damageDealt ?? 0));
        setText('stat-gold', player?.gold ?? 0);
        setText('stat-time', Utils.formatTime(Game?.playTime ?? 0));

        // Meta currency (v0.1.2): show essence gained this run and total
        try {
            const earned = Math.max(0, Math.floor(Game?._lastEssenceEarned || 0));
            const total = (window.Meta && typeof Meta.getEssence === 'function') ? Meta.getEssence() : 0;
            const elEarned = document.getElementById('stat-essence-earned');
            const elTotal = document.getElementById('stat-essence-total');
            if (elEarned) elEarned.textContent = earned;
            if (elTotal) elTotal.textContent = total;
        } catch (e) { }

        const mvpRune = (player?.runes || []).find(r => r !== null);
        setText('stat-mvp', mvpRune ? mvpRune.name : '-');

        // Add seed display
        const deathSeedContainer = document.getElementById('death-seed-container');
        if (deathSeedContainer && Game.seedText) {
            deathSeedContainer.innerHTML = `
                <div class="seed-display">
                    <span>🎲 Seed usada: <code>${Game.seedText}</code></span>
                    <button id="death-copy-seed" class="copy-seed-btn">📋 Copiar</button>
                </div>
            `;
            
            const copyBtn = document.getElementById('death-copy-seed');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(Game.seedText).then(() => {
                        this.showToast('📋 Seed copiada');
                    });
                    AudioManager.play('menuClick');
                });
            }
        }
    },

    showRewardScreen(rewards) {
        const screen = document.getElementById('reward-screen');
        const container = document.getElementById('reward-options');
        container.innerHTML = '';
        this._lastRewardScreenRewards = rewards;

        rewards.forEach((reward, i) => {
            if (!reward) return;
            const card = document.createElement('div');
            card.className = `reward-card ${reward.rarity || 'common'}`;
            card.innerHTML = `
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-name">${reward.name}</div>
                <div class="reward-desc">${reward.desc || ''}</div>
            `;
            card.onclick = () => {
                Game.selectReward(reward);
                screen.classList.add('hidden');
            };
            container.appendChild(card);
        });

        
        // Add discard option
        try {
            const discard = document.createElement('button');
            discard.className = 'discard-btn';
            discard.style.marginTop = '14px';
            discard.textContent = 'Descartar';
            discard.onclick = () => {
                screen.classList.add('hidden');
                Game.paused = false;
            };
            // avoid duplicates
            const existing = screen.querySelector('#reward-discard-btn');
            if (existing) existing.remove();
            discard.id = 'reward-discard-btn';
            screen.querySelector('.reward-content')?.appendChild(discard);
        } catch (e) {}
screen.classList.remove('hidden');
    },

    hideRewardScreen() {
        document.getElementById('reward-screen').classList.add('hidden');
    },

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
    },

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    },

    // ===========================
    // RELIC DRAFT (New NG)
    // ===========================
    showRelicDraft(choices, onPick) {
        const overlay = document.getElementById('relic-draft-overlay');
        const container = document.getElementById('relic-draft-options');
        if (!overlay || !container) {
            if (choices && choices[0]) onPick && onPick(choices[0]);
            return;
        }

        // Pause the game while drafting (player must be safe)
        // We only auto-resume if we were the ones to pause.
        const shouldResume = (window.Game && !Game.paused);
        if (window.Game && shouldResume) {
            Game.paused = true;
            overlay.dataset.resume = '1';
        } else {
            overlay.dataset.resume = '0';
        }

        // Close on click outside
        const closeIfBackdrop = (e) => {
            if (e.target === overlay) {
                // Don't allow skipping (forces choice)
                AudioManager.play('menuHover');
            }
        };
        overlay.addEventListener('click', closeIfBackdrop);

        container.innerHTML = '';
        (choices || []).forEach((rel) => {
            if (!rel) return;
            const card = document.createElement('div');
            card.className = 'choice-card';
            card.innerHTML = `
                <div class="choice-icon">${rel.icon || 'âœ¨'}</div>
                <div class="choice-name">${rel.name || 'Reliquia'}</div>
                <div class="choice-desc">${rel.desc || ''}</div>
            `;
            card.onclick = () => {
                AudioManager.play('menuClick');
                overlay.classList.add('hidden');
                overlay.removeEventListener('click', closeIfBackdrop);
                if (window.Game && overlay.dataset.resume === '1') Game.paused = false;
                // Small grace window after resuming so the player can't be instantly clipped.
                try {
                    if (window.Game && Game.player) {
                        Game.player.iFrameTimer = Math.max(Game.player.iFrameTimer || 0, 0.75);
                    }
                } catch (e) { }

                try { onPick && onPick(rel); } catch (e) { }
            };
            container.appendChild(card);
        });

        overlay.classList.remove('hidden');
    },

    // ===========================
    // PATH CHOICE (Fork)
    // ===========================
    showPathChoice(nodeIds, onPick) {
        const overlay = document.getElementById('path-choice-overlay');
        const container = document.getElementById('path-choice-options');
        const cancel = document.getElementById('path-choice-cancel');
        if (!overlay || !container) {
            const pick = (nodeIds && nodeIds.length) ? nodeIds[0] : null;
            onPick && onPick(pick);
            return;
        }

        // Pause while choosing a route (prevents taking damage during UI)
        const shouldResume = (window.Game && !Game.paused);
        if (window.Game && shouldResume) {
            Game.paused = true;
            overlay.dataset.resume = '1';
        } else {
            overlay.dataset.resume = '0';
        }

        const iconFor = (type) => {
            const map = { combat: '⚔️', event: '🎁', miniboss: '💹', elite: '⭐', boss: '👑' };
            return map[type] || '🧩';
        };

        container.innerHTML = '';
        (nodeIds || []).forEach((id, idx) => {
            const node = (window.Game && Game.dungeon && Game.dungeon.nodes) ? Game.dungeon.nodes[id] : null;
            const type = node ? node.type : 'combat';
            const label = node ? `Sala ${type}` : `Ruta ${idx + 1}`;
            const card = document.createElement('div');
            card.className = 'choice-card';
            card.innerHTML = `
                <div class="choice-icon">${iconFor(type)}</div>
                <div class="choice-name">${label}</div>
                <div class="choice-desc">${type === 'event' ? 'Tienda + cofre (one-shot)' : (type === 'elite' ? 'Enemigos fuertes + loot' : (type === 'miniboss' ? 'Mini-jefe' : 'Encuentro'))}</div>
            `;
            card.onclick = () => {
                AudioManager.play('menuClick');
                overlay.classList.add('hidden');
                if (cancel) cancel.onclick = null;
                if (window.Game && overlay.dataset.resume === '1') Game.paused = false;
                // Small grace window after resuming so the player can't be instantly clipped.
                try {
                    if (window.Game && Game.player) {
                        Game.player.iFrameTimer = Math.max(Game.player.iFrameTimer || 0, 0.75);
                    }
                } catch (e) { }

                try { onPick && onPick(id); } catch (e) { }
            };
            container.appendChild(card);
        });

        if (cancel) {
            cancel.onclick = () => {
                AudioManager.play('menuClick');
                // If user cancels, just pick the first option
                overlay.classList.add('hidden');
                if (window.Game && overlay.dataset.resume === '1') Game.paused = false;
                // Small grace window after resuming so the player can't be instantly clipped.
                try {
                    if (window.Game && Game.player) {
                        Game.player.iFrameTimer = Math.max(Game.player.iFrameTimer || 0, 0.75);
                    }
                } catch (e) { }

                const pick = (nodeIds && nodeIds.length) ? nodeIds[0] : null;
                onPick && onPick(pick);
            };
        }

        overlay.classList.remove('hidden');
    },

    // ===========================
    // MINIMAP (Graph)
    // ===========================
    updateMinimap(dungeon) {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas || !dungeon) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, w, h);

        const nodes = dungeon.nodes || [];
        if (!nodes.length) return;

        // bounds from node positions
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of nodes) {
            if (!n || !n.pos) continue;
            minX = Math.min(minX, n.pos.x);
            maxX = Math.max(maxX, n.pos.x);
            minY = Math.min(minY, n.pos.y);
            maxY = Math.max(maxY, n.pos.y);
        }
        if (!isFinite(minX)) return;
        const pad = 16;
        const sx = (w - pad * 2) / Math.max(1e-6, (maxX - minX));
        const sy = (h - pad * 2) / Math.max(1e-6, (maxY - minY));
        const s = Math.min(sx, sy);

        const mapX = (x) => pad + (x - minX) * s;
        const mapY = (y) => pad + (y - minY) * s;

        // Draw connections
        ctx.strokeStyle = 'rgba(180,180,220,0.35)';
        ctx.lineWidth = 2;
        for (const n of nodes) {
            if (!n) continue;
            const x1 = mapX(n.pos.x), y1 = mapY(n.pos.y);
            for (const c of (n.connections || [])) {
                if (c < n.id) continue; // avoid double
                const m = nodes[c];
                if (!m) continue;
                const x2 = mapX(m.pos.x), y2 = mapY(m.pos.y);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }

        // Draw nodes
        for (const n of nodes) {
            if (!n) continue;
            const x = mapX(n.pos.x), y = mapY(n.pos.y);
            const cleared = !!(n.room && n.room.cleared);
            const isCurrent = (n.id === dungeon.currentNodeId);

            let fill = 'rgba(120,120,140,0.75)';
            if (cleared) fill = 'rgba(68,255,136,0.75)';
            if (n.type === 'boss') fill = cleared ? 'rgba(255,150,255,0.75)' : 'rgba(255,80,180,0.75)';
            if (n.type === 'elite') fill = cleared ? 'rgba(255,215,0,0.65)' : 'rgba(255,215,0,0.45)';
            if (n.type === 'event') fill = cleared ? 'rgba(120,200,255,0.75)' : 'rgba(120,200,255,0.55)';

            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(x, y, isCurrent ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();

            if (isCurrent) {
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    },

    // ===========================
    // SETS PANEL
    // ===========================
    renderSetsPanel() {
        const root = document.getElementById('sets-panel');
        if (!root) return;
        const sets = window.SetDatabase || {};
        const player = (window.Game && Game.player) ? Game.player : null;
        const owned = {};
        if (player && Array.isArray(player.passiveItems)) {
            for (const it of player.passiveItems) {
                if (!it || !it.setId) continue;
                owned[it.setId] = owned[it.setId] || new Set();
                if (it.setPiece) owned[it.setId].add(it.setPiece);
            }
        }

        const cards = [];
        for (const sid of Object.keys(sets)) {
            const s = sets[sid];
            const got = owned[sid] ? owned[sid].size : 0;
            const total = (s.pieces || []).length;
            const piecesHtml = (s.pieces || []).map(pieceId => {
                const ok = owned[sid] && owned[sid].has(pieceId);

                // Set pieces are item ids (e.g. "storm_ring"). Prefer localized item name if available.
                let label = pieceId;
                try {
                    if (window.i18n) {
                        const it = (typeof window.i18n.item === 'function') ? window.i18n.item(pieceId) : null;
                        if (it && it.name) {
                            label = it.name;
                        } else if (typeof window.i18n.t === 'function') {
                            const v = window.i18n.t(pieceId);
                            if (typeof v === 'string') label = v;
                        }
                    }
                } catch (e) { /* ignore */ }

                return `<div class="set-piece"><span>${label}</span><span class="${ok ? 'ok' : 'no'}">${ok ? '✅' : '❌'}</span></div>`;
            }).join('');

            const b2 = s.bonus2 ? (s.bonus2.descKey ? window.i18n.t(s.bonus2.descKey) : s.bonus2.desc) : '';
            const b3 = s.bonus3 ? (s.bonus3.descKey ? window.i18n.t(s.bonus3.descKey) : s.bonus3.desc) : '';

            const setName = s.nameKey ? window.i18n.t(s.nameKey) : (s.name || sid);

            const active2 = got >= 2;
            const active3 = got >= 3;

            cards.push(`
                <div class="set-card">
                    <div class="set-title"><strong>${window.i18n.t('codexSetLabel')} ${setName}</strong><span class="set-count">${got}/${total}</span></div>
                    <div class="set-pieces">${piecesHtml}</div>
                    <div class="set-bonuses">
                        <div class="${active2 ? 'active' : ''}"><strong>${window.i18n.t('codexBonus2')}</strong> ${b2 || '—'}</div>
                        <div class="${active3 ? 'active' : ''}"><strong>${window.i18n.t('codexBonus3')}</strong> ${b3 || '—'}</div>
                    </div>
                </div>
            `);
        }

        if (!cards.length) {
            root.innerHTML = `<div style="font-family:'Press Start 2P', monospace; font-size: 10px; color: #b0b0c0; line-height: 1.6;">${window.i18n.t('codexNoSets')}</div>`;
            return;
        }

        root.innerHTML = cards.join('');
    },
// ===========================
// SYNERGIES CODEX
// ===========================
renderSynergiesCodex() {
    const root = document.getElementById('synergies-codex');
    if (!root) return;

    // Make it scrollable inside the codex panel
    root.style.height = '100%';
    root.style.overflow = 'auto';
    root.style.paddingRight = '6px';

    const db = window.SynergyDatabase;
    if (!db) {
        root.innerHTML = `<div style="font-family:'Press Start 2P', monospace; font-size: 10px; color: #b0b0c0; line-height: 1.6;">
            ${window.i18n.t('codexSynergyDbMissing')}
        </div>`;
        return;
    }

    // Build a map of runeId -> rune data (icon/name) for nicer recipes
    const runeMap = {};
    try {
        if (window.RuneDatabase) {
            for (const k of Object.keys(RuneDatabase)) {
                const arr = RuneDatabase[k];
                if (!Array.isArray(arr)) continue;
                for (const r of arr) {
                    if (r && r.id) runeMap[r.id] = r;
                }
            }
        }
    } catch (e) { }

    const fmt = (id) => {
        const r = runeMap[id];
        // Prefer rune translations (so we don't show raw ids like "blood_price")
        const runeT = (window.i18n && typeof window.i18n.rune === 'function') ? window.i18n.rune(id) : null;
        const itemT = (window.i18n && typeof window.i18n.item === 'function') ? window.i18n.item(id) : null;
        const name = (runeT && runeT.name && runeT.name !== id) ? runeT.name
                   : (itemT && itemT.name && itemT.name !== id) ? itemT.name
                   : id;
        const icon = r?.icon || '';
        return `${icon ? icon + ' ' : ''}${name}`;
    };

    const checkHints = {
        barrage: 'codexReq_barrage',
        efficient_caster: 'codexReq_efficient_caster',
        rapid_fire: 'codexReq_rapid_fire',
        sniper_elite: 'codexReq_sniper_elite',
        hypersonic: 'codexReq_hypersonic'
    };

    const synergies = Object.values(db || {}).slice().sort((a, b) => {
        const an = (a?.name || '').toLowerCase();
        const bn = (b?.name || '').toLowerCase();
        return an.localeCompare(bn);
    });

    if (!synergies.length) {
        root.innerHTML = `<div style="font-family:'Press Start 2P', monospace; font-size: 10px; color: #b0b0c0; line-height: 1.6;">
            ${window.i18n.t('codexNoSynergies')}
        </div>`;
        return;
    }

    const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

    const chip = (txt) => `<span class="syn-chip">${esc(txt)}</span>`;
    const plus = () => `<span class="syn-plus">+</span>`;

    const buildCombo = (ids) => {
        const parts = ids.map(fmt);
        // Chips with explicit + between them
        let out = '';
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) out += plus();
            out += chip(parts[i]);
        }
        return `<div class="syn-chips">${out}</div>`;
    };

    const cards = synergies.map(s => {
        let recipeHtml = '';
        if (Array.isArray(s.requires)) {
            recipeHtml = buildCombo(s.requires);
        } else if (Array.isArray(s.requiresAny)) {
            // One of the combos must be complete
            recipeHtml = s.requiresAny.map((combo, idx) => {
                const block = buildCombo(combo);
                if (idx === 0) return `<div class="syn-combo">${block}</div>`;
                return `<div class="syn-or">${esc(window.i18n.t('codexOr') || 'OR')}</div><div class="syn-combo">${block}</div>`;
            }).join('');
        } else if (typeof s.requiresCheck === 'function') {
            const text = (checkHints[s.id] ? window.i18n.t(checkHints[s.id]) : null) || window.i18n.t('codexReq_special') || 'Special condition (auto-detected in run)';
            recipeHtml = `<div class="syn-text">${esc(text)}</div>`;
        } else {
            recipeHtml = `<div class="syn-text">—</div>`;
        }

        const bonusText = (typeof s.getDesc === 'function' ? s.getDesc() : (window.i18n?.synergy?.(s.id)?.desc)) || s.desc || '—';
        const bonusHtml = esc(bonusText).replace(/\n/g, '<br>');

        const prettyName = ((typeof s.getName === 'function' ? s.getName() : (window.i18n?.synergy?.(s.id)?.name)) || s.name || s.id || '').toString()
            .replace(/_/g,' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        const reqLabel = (window.i18n.t('codexRequirement') || window.i18n.t('codexRequirementLabel') || 'Requirement');
        const bonusLabel = (window.i18n.t('codexBonus') || window.i18n.t('codexBonusLabel') || 'Bonus');

        return `
            <div class="syn-row">
                <div class="syn-left">
                    <div class="syn-icon">⚡</div>
                    <div class="syn-name">${esc(prettyName)}</div>
                </div>
                <div class="syn-right">
                    <div class="syn-line">
                        <div class="syn-label">${esc(reqLabel)}</div>
                        <div class="syn-value">${recipeHtml}</div>
                    </div>
                    <div class="syn-line">
                        <div class="syn-label">${esc(bonusLabel)}</div>
                        <div class="syn-value">${bonusHtml}</div>
                    </div>
                </div>
            </div>
        `;
    });
root.innerHTML = cards.join('');
},


    // Returns true when a blocking overlay (draft/choice) is visible.
    // Used by Game loop to hard-freeze simulation so the player never gets hit while choosing UI.
    isBlockingOverlayOpen() {
        const ids = ['relic-draft-overlay', 'path-choice-overlay'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && !el.classList.contains('hidden')) return true;
        }
        return false;
    },

    // ==========================================
    // SYNERGY PANEL (Tecla B)
    // ==========================================
    drawSynergyPanel(ctx) {
        if (!window.SynergySystem) return;
        
        const synergies = SynergySystem.getActiveSynergies();
        
        // Solo mostrar si: (hay sinergias Y panel visible) O (setting always visible)
        if (synergies.length === 0 && !this.synergyAlwaysVisible) return;
        if (synergies.length === 0 || (!this.synergyPanelVisible && !this.synergyAlwaysVisible)) return;
        
        const panelX = 10;
        const panelY = Game.height - 200;
        const panelW = 280;
        const lineHeight = 16;
        const panelH = Math.max(60, 40 + synergies.length * lineHeight);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        
        // Border
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // Title
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`⚡ SINERGIAS ACTIVAS (${synergies.length})`, panelX + 10, panelY + 20);
        
        // Hint
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '8px monospace';
        ctx.fillText('Presioná B para ocultar', panelX + 10, panelY + 35);
        
        // Synergies list
        ctx.font = '10px monospace';
        let y = panelY + 50;
        
        if (synergies.length === 0) {
            ctx.fillStyle = '#888888';
            ctx.fillText('No hay sinergias activas', panelX + 10, y);
        } else {
            for (const synergy of synergies) {
                ctx.fillStyle = '#ffff00';
                ctx.fillText(`- ${synergy.name}`, panelX + 10, y);
                
                ctx.fillStyle = '#cccccc';
                ctx.font = '8px monospace';
                ctx.fillText(synergy.desc, panelX + 20, y + 10);
                
                ctx.font = '10px monospace';
                y += lineHeight;
            }
        }
    },

    // ==========================================
    // SEED PILL (HUD)
    // ==========================================
    drawSeedPill(ctx) {
        if (!Game.seedText) return;
        
        const seedText = `Seed: ${Game.seedText}`;
        ctx.font = '10px monospace';
        const seedWidth = ctx.measureText(seedText).width + 16;
        
        // Pill background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(Game.width - seedWidth - 8, 8, seedWidth, 20);
        
        // Border
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.strokeRect(Game.width - seedWidth - 8, 8, seedWidth, 20);
        
        // Text
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(seedText, Game.width - seedWidth, 20);
    },

};

window.UI = UI;