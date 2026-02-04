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

    init() {
        this.screens = {
            'main-menu': document.getElementById('main-menu'),
            'feedback-screen': document.getElementById('feedback-screen'),
            'slot-select': document.getElementById('slot-select'),
            'difficulty-select': document.getElementById('difficulty-select'),
            'settings-screen': document.getElementById('settings-screen'),
            'game-screen': document.getElementById('game-screen'),
            'updates-screen': document.getElementById('updates-screen'), // New screen
        };

        this.setupMenuEvents();
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
                    ov.textContent = '🔒 Derrota 1 jefe en Normal';
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
                    ov.textContent = '🔒 Derrota 1 jefe en Difícil';
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

        document.getElementById('btn-quit').onclick = () => {
            AudioManager.play('menuClick');
            if (confirm('¿Salir del juego?')) window.close();
        };

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.onmouseenter = () => AudioManager.play('menuHover');
        });
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
                const payload = buildPayload();
                const subject = buildSubject();
                const to = 'spellikedev@gmail.com';

                // ✅ Best UX: send directly without requiring the player to sign into an email client.
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
                    showToast('✅ Enviado. ¡Gracias!');
                } catch (e) {
                    // Network/CORS blocked, or service down: fall back to copy + optional mailto.
                    try {
                        await navigator.clipboard.writeText(payload);
                        showToast('📋 Copiado. Si querés, pegalo en un mail.');
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
                    showToast('✅ Copiado al portapapeles');
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
                        <span>🗺 ${save.biomeName || 'Bosque'} (${save.biomeNum || 1}/12)</span>
                        <span>⏱ ${Utils.formatTime(save.playTime || 0)}</span>
                        <span>⚔ Nivel ${save.level || 1}</span>
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
                    <p>➕ Nueva Partida</p>
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
        Game.newGame(this.selectedSlot, this.selectedDifficulty, ev);
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

        document.getElementById('btn-apply-settings').onclick = () => {
            AudioManager.play('menuClick');
            this.saveSettings();
        };

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
        SaveManager.saveSettings(settings);
    },

    setupGameUIEvents() {
        // Resume
        document.getElementById('btn-resume').onclick = () => {
            AudioManager.play('menuClick');
            Game.togglePause();
        };

        // Stats button - FIX
        document.getElementById('btn-stats').onclick = () => {
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
        document.getElementById('btn-pause-settings').onclick = () => {
            AudioManager.play('menuClick');
            document.getElementById('pause-menu').classList.add('hidden');
            this.previousScreen = 'game-screen';
            Game.paused = true;
            this.showScreen('settings-screen');
        };

        // Abandon run - FIX
        document.getElementById('btn-abandon').onclick = () => {
            AudioManager.play('menuClick');
            if (confirm('¿Abandonar run? Perderás todo el progreso de esta partida.')) {
                SaveManager.deleteSlot(this.selectedSlot);
                Game.stop();
                AudioManager.stopMusic();
                document.getElementById('pause-menu').classList.add('hidden');
                this.showScreen('main-menu');
            }
        };

        // Main menu from pause
        document.getElementById('btn-main-menu').onclick = () => {
            AudioManager.play('menuClick');
            // NO guardar - solo guardar al pasar puertas
            Game.stop();
            AudioManager.stopMusic();
            document.getElementById('pause-menu').classList.add('hidden');
            this.showScreen('main-menu');
        };

        // Death buttons
        document.getElementById('btn-retry').onclick = () => {
            AudioManager.play('menuClick');
            document.getElementById('death-screen').classList.add('hidden');
            this.startNewGame();
        };
        document.getElementById('btn-death-menu').onclick = () => {
            AudioManager.play('menuClick');
            document.getElementById('death-screen').classList.add('hidden');
            this.showScreen('main-menu');
        };
    },

    // ===========================
    // CODEX (Bestiary + Achievements)
    // ===========================

    setupCodexEvents() {
        const overlay = document.getElementById('codex-overlay');
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
                if (tab === 'book') this.renderBook();
                if (tab === 'sets') this.renderSetsPanel();
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
        const overlay = document.getElementById('codex-overlay');
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
        if (initialTab === 'book') this.renderBook();
        if (initialTab === 'sets') this.renderSetsPanel();
    },

    hideCodex() {
        const overlay = document.getElementById('codex-overlay');
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
            list.innerHTML = '<p style="font-family:\'Press Start 2P\',monospace;font-size:10px;opacity:0.9">Meta no disponible.</p>';
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
                        <div class="codex-meta">${unlocked ? `Kills: ${kills}` : 'Bloqueado'}</div>
                    </div>
                `;
            });
        };

        renderGroup('ENEMIGOS', entries.filter(e => e.kind === 'enemy'));
        renderGroup('JEFES', entries.filter(e => e.kind === 'boss'));

        list.innerHTML = html;

        // Default detail
        detail.innerHTML = `
            <h3>Selecciona una entrada</h3>
            <p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;line-height:1.5">
                Tip: Abrís el códex con <b>C</b>. Las entradas se desbloquean cuando derrotás al enemigo/jefe por primera vez.
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
                        Derrota a este ${kind === 'enemy' ? 'enemigo' : 'jefe'} para desbloquear información.
                    </p>
                `;
                return;
            }

            const cfg = info.cfg || {};
            detail.innerHTML = `
                <h3>${info.icon} ${info.name}</h3>
                <p style="font-family:'Press Start 2P',monospace;font-size:10px;opacity:0.9;line-height:1.5">${info.desc}</p>
                <div class="detail-grid">
                    <div class="detail-card">HP Base: ${cfg.hp ?? '-'} </div>
                    <div class="detail-card">Daño Base: ${cfg.damage ?? '-'} </div>
                    <div class="detail-card">Velocidad: ${cfg.speed ?? '-'} </div>
                    <div class="detail-card">Kills: ${kills}</div>
                </div>
                <div style="font-family:'Press Start 2P',monospace;font-size:9px;opacity:0.9;line-height:1.6">
                    <b>Consejo:</b> ${kind === 'enemy' ? 'Leé su patrón y no te quedes quieto.' : 'Guardá dash para los ataques fuertes.'}
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
            list.innerHTML = '<p style="font-family:\'Press Start 2P\',monospace;font-size:10px;opacity:0.9">Meta no disponible.</p>';
            return;
        }

        const db = Meta.getAchievementDB();
        const meta = Meta.data || { ach: { unlocked: {} }, stats: {} };

        let html = '';
        db.forEach(a => {
            const unlocked = !!(meta.ach?.unlocked?.[a.id]);
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
                            <div class="a-title">${a.name}</div>
                            <div class="a-desc">${unlocked ? a.desc : a.desc}</div>
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
            <div>Runs: <span style="color:#ffd27a">${total}</span></div>
            <div>Mejor NG+: <span style="color:#ffd27a">${bestNg}</span> · Oro máx: <span style="color:#ffd27a">${bestGold}</span></div>
            <div>Kills máx: <span style="color:#ffd27a">${bestKills}</span> · Tiempo máx: <span style="color:#ffd27a">${this._formatTime(bestTime)}</span></div>
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
            listEl.innerHTML = `<div class="history-empty">No hay runs para mostrar.</div>`;
            detailEl.innerHTML = `<div class="history-detail-box"><h3>📌 Historial</h3><div class="history-empty">Jugá una run y al morir se guarda acá.</div></div>`;
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
            const biome = (r?.biome != null) ? `Bioma ${r.biome}` : 'Bioma -';
            const room = (r?.room != null) ? `Sala ${r.room}` : 'Sala -';
            const gold = Number(r?.gold || 0);
            const kills = Number(r?.kills || 0);

            entry.innerHTML = `
                <div class="top">
                    <div class="date">${r?.date || ''}</div>
                    <div class="ng">NG+ ${ng}</div>
                </div>
                <div class="bottom">${biome} · ${room}<br/>Oro: ${gold} · Kills: ${kills} · Tiempo: ${this._formatTime(r?.time)}</div>
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
                    Tip: filtrá por “NG+ 3”, “Bioma 2”, “oro”, etc.
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
            <div class="tooltip-rarity rarity-${rune.rarity}">${rune.rarity?.toUpperCase() || 'COMÚN'}</div>
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

        const modal = document.createElement('div');
        modal.id = 'loot-modal';
        modal.className = 'loot-modal';
        modal.innerHTML = `
            <div class="loot-content">
                <h2>¡ELIGE TU RECOMPENSA!</h2>
                <div class="loot-options">
                    <div class="loot-option rune-option" id="choose-rune">
                        <div class="option-type">RUNA</div>
                        <div class="option-icon">${runeOption.icon}</div>
                        <div class="option-name">${runeOption.name}</div>
                        <div class="option-desc">${runeOption.desc || ''}</div>
                        <div class="option-rarity rarity-${runeOption.rarity}">${runeOption.rarity?.toUpperCase() || 'COMÚN'}</div>
                    </div>
                    <div class="loot-divider">O</div>
                    <div class="loot-option item-option" id="choose-item">
                        <div class="option-type">ITEM</div>
                        <div class="option-icon">${itemOption.icon}</div>
                        <div class="option-name">${itemOption.name}</div>
                        <div class="option-desc">${itemOption.desc || itemOption.effect || ''}</div>
                    </div>
                </div>
                <button class="discard-btn" id="discard-loot">Descartar Ambos</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.lootModal = modal;

        document.getElementById('choose-rune').onclick = () => {
            this.handleRuneChoice(runeOption);
        };

        document.getElementById('choose-item').onclick = () => {
            Game.handleLoot({ ...itemOption, type: 'item' });
            this.closeLootModal();
        };

        document.getElementById('discard-loot').onclick = () => {
            this.closeLootModal();
        };
    },

    handleRuneChoice(rune) {
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
            this.closeLootModal();
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
                        <div class="swap-icon">➕</div>
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
            const leftTitle = pickedBlessing ? 'ELIGE UNA MALDICIÓN' : 'ELIGE UNA BENDICIÓN';
            const list = pickedBlessing ? curses : blessings;

            let cards = '';
            list.forEach((opt, idx) => {
                cards += `
                    <div class="reward-card epic" style="cursor:pointer" data-idx="${idx}">
                        <div class="reward-icon">${pickedBlessing ? '☠️' : '✨'}</div>
                        <div class="reward-name">${opt.name}</div>
                        <div class="reward-desc">${opt.desc}</div>
                    </div>
                `;
            });

            modal.innerHTML = `
                <div class="loot-content">
                    <h2>NG+ ${Game.ngPlusLevel} — ${leftTitle}</h2>
                    <p style="margin:0 0 10px 0; opacity:0.9">
                        Mutación del bioma: <b>${Game.biomeMutation ? Game.biomeMutation.name : '—'}</b>
                        ${Game.biomeMutation ? ` — ${Game.biomeMutation.desc}` : ''}
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
                <h2>⛩️ SANTUARIO</h2>
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
                    const newRune = getRandomRune(rarity);
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

                const locked = !!entry.locked;

                const lockBtn = shop.allowLock ? `
                    <button class="action-btn" style="margin-top:6px; padding:6px 10px; font-size:11px" ${sold ? 'disabled' : ''} data-lock="${idx}">
                        ${locked ? '🔒 LOCK' : '🔓 LOCK'}
                    </button>` : '';

                itemsHtml += `
                    <div class="reward-card ${rarity} ${sold ? 'sold' : ''}" style="cursor:${sold ? 'not-allowed' : 'pointer'}" data-idx="${idx}">
                        <div class="reward-icon">${icon}</div>
                        <div class="reward-name">${name}</div>
                        <div class="reward-desc">${desc}</div>
                        <div class="reward-desc" style="margin-top:6px; opacity:0.9">💰 ${price}</div>
                        <button class="action-btn" style="margin-top:8px; padding:8px 12px; font-size:12px" ${sold || !canAfford ? 'disabled' : ''}>
                            ${sold ? 'COMPRADO' : (canAfford ? 'COMPRAR' : 'SIN ORO')}
                        </button>
                        ${lockBtn}
                    </div>
                `;
            });

            const title = shop.theme === 'blackmarket' ? '☠️ MERCADO NEGRO' : '🛒 TIENDA';
            const sub = shop.theme === 'blackmarket'
                ? 'Ofertas poderosas… con consecuencias.'
                : 'Compra runas, activos y mejoras.';

            const rerollBtn = shop.allowReroll ? `
                <button class="action-btn" id="reroll-shop" style="margin:6px 6px 0 0; padding:8px 12px; font-size:12px" ${(shop.rerollsLeft || 0) <= 0 ? 'disabled' : ''}>
                    🔄 REROLL (${shop.rerollsLeft || 0})
                </button>` : '';

            modal.innerHTML = `
                <div class="loot-content">
                    <h2>${title}</h2>
                    <p style="margin:0 0 6px 0; opacity:0.9">${sub}</p>
                    <p style="margin:0 0 10px 0; opacity:0.9">Oro: 💰 ${Game.player.gold}</p>
                    <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap">
                        ${rerollBtn}
                    </div>
                    <div class="loot-options" style="gap:12px; flex-wrap:wrap; justify-content:center; margin-top:10px">
                        ${itemsHtml}
                    </div>
                    <button class="discard-btn" id="close-shop">Cerrar</button>
                </div>
            `;

            const reroll = modal.querySelector('#reroll-shop');
            if (reroll) reroll.onclick = () => { AudioManager.play('menuClick'); rerollShop(); render(); };

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
                        UI.handleRuneChoice({ ...entry.rune });
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
                btn.textContent = `⬜ Runa Vacía (slot ${it.idx + 1})`;
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

        if (info) info.textContent = `Costo base: ${forgeData.cost} oro • Bioma: ${forgeData.biomeId}`;

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
                out.textContent = res.ok ? '✅ OK' : ('❌ ' + res.error);
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
                <h2>📊 ESTADÍSTICAS</h2>
                <div class="stats-grid">
                    <div class="stat-item"><span>Bioma</span><span>${Game.currentBiome}</span></div>
                    <div class="stat-item"><span>Sala</span><span>${d.currentRoomIndex + 1}/${d.roomsPerBiome}</span></div>
                    <div class="stat-item"><span>HP</span><span>${Math.floor(p.hp)}/${p.maxHp}</span></div>
                    <div class="stat-item"><span>Oro</span><span>💰 ${p.gold}</span></div>
                    <div class="stat-item"><span>Kills</span><span>💀 ${p.stats.kills}</span></div>
                    <div class="stat-item"><span>Daño Infligido</span><span>⚔️ ${p.stats.damageDealt}</span></div>
                    <div class="stat-item"><span>Daño Recibido</span><span>❤️ ${p.stats.damageTaken}</span></div>
                    <div class="stat-item"><span>Salas Limpiadas</span><span>🚪 ${p.stats.roomsCleared}</span></div>
                    <div class="stat-item"><span>Biomas Completados</span><span>🗺️ ${p.stats.biomesCleared}</span></div>
                    <div class="stat-item"><span>Tiempo</span><span>⏱️ ${Utils.formatTime(Game.playTime)}</span></div>
                </div>
                <h3>RUNAS EQUIPADAS</h3>
                <div class="stats-runes">
                    ${p.runes.map((r, i) => r ? `<div class="stat-rune">${r.icon} ${r.name}</div>` : '').join('')}
                </div>
                <button class="close-stats-btn" id="close-stats">CERRAR</button>
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
                active1.title = 'Bloqueado (Mejorar en tienda)';
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
        } catch (e) { }
    },

    hidePauseMenu() {
        document.getElementById('pause-menu').classList.add('hidden');
    },

    showDeathScreen(player) {
        const screen = document.getElementById('death-screen');
        screen.classList.remove('hidden');

        document.getElementById('stat-biomes').textContent = player.stats.biomesCleared;
        document.getElementById('stat-kills').textContent = player.stats.kills;
        document.getElementById('stat-damage').textContent = Utils.formatNumber(player.stats.damageDealt);
        document.getElementById('stat-gold').textContent = player.gold;
        document.getElementById('stat-time').textContent = Utils.formatTime(Game.playTime);

        const mvpRune = player.runes.find(r => r !== null);
        document.getElementById('stat-mvp').textContent = mvpRune ? mvpRune.name : '-';
    },

    showRewardScreen(rewards) {
        const screen = document.getElementById('reward-screen');
        const container = document.getElementById('reward-options');
        container.innerHTML = '';

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
                <div class="choice-icon">${rel.icon || '✨'}</div>
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
            const map = { combat: '⚔️', event: '🎁', miniboss: '👹', elite: '⭐', boss: '👑' };
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
            const piecesHtml = (s.pieces || []).map(name => {
                const ok = owned[sid] && owned[sid].has(name);
                return `<div class="set-piece"><span>${name}</span><span class="${ok ? 'ok' : 'no'}">${ok ? '✅' : '❌'}</span></div>`;
            }).join('');

            const b2 = s.bonus2 ? s.bonus2.desc : '';
            const b3 = s.bonus3 ? s.bonus3.desc : '';

            const active2 = got >= 2;
            const active3 = got >= 3;

            cards.push(`
                <div class="set-card">
                    <div class="set-title"><strong>Set: ${s.name}</strong><span class="set-count">${got}/${total}</span></div>
                    <div class="set-pieces">${piecesHtml}</div>
                    <div class="set-bonuses">
                        <div class="${active2 ? 'active' : ''}"><strong>Bonus 2 piezas:</strong> ${b2 || '—'}</div>
                        <div class="${active3 ? 'active' : ''}"><strong>Bonus 3 piezas:</strong> ${b3 || '—'}</div>
                    </div>
                </div>
            `);
        }

        if (!cards.length) {
            root.innerHTML = `<div style="font-family:'Press Start 2P', monospace; font-size: 10px; color: #b0b0c0; line-height: 1.6;">Todavía no tenés sets. Buscá piezas en tiendas y cofres.</div>`;
            return;
        }

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

};

window.UI = UI;
