// ==========================================
// ARCANE DEPTHS - Main Game (FIX: Save only on door)
// ==========================================

const Game = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 500,
    scale: 1,
    canvasRect: null,

    running: false,
    paused: false,
    lastTime: 0,
    playTime: 0,

    player: null,
    dungeon: null,
    currentBiome: 'forest',
    difficulty: 'normal',
    // Demencial: rune programming + pity systems
    emptyRunePityBoss: 0,
    emptyRunePityChest: 0,
    forgePity: 0,


    camera: { x: 0, y: 0 },
    screenshake: { x: 0, y: 0, intensity: 0 },

    // New Game+ level (how many times player has looped)
    ngPlusLevel: 0,

    // Run progression: increases after each boss kill (scales later rooms)
    bossKillsThisRun: 0,

    // Global run modifiers (blessings/curses/mutations)
    modifiers: {
        playerDamageMult: 1,
        enemyCountMult: 1,
        enemyStatMult: 1,
        enemyProjectileSpeedMult: 1,
        enemyExplodeOnDeath: false
    },
    blessings: [],
    curses: [],

    // NG-only relics (build-defining; chosen only when starting a new NG loop)
    relics: [],
    relicState: { hitCount: 0, reactionCharged: false, hunterMarkTargetId: null, hunterMarkTimer: 0, brokenClockTimer: 12 },

    biomeMutation: null,
    mutationCountMult: 1,

    // If true, bosses will NOT draw their own internal HP bars.
    // We render a single unified boss HUD from Game.drawBossHud() to avoid duplicates.
    _useUnifiedBossHud: true,

    // For save state - snapshot when entering room
    roomEntryState: null,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        ItemDatabase.init();
    },

    resize() {
        const container = this.canvas.parentElement;
        const containerW = container.clientWidth || window.innerWidth;
        const containerH = container.clientHeight || window.innerHeight;

        this.scale = Math.min(containerW / this.width, containerH / this.height);
        if (this.scale < 0.5) this.scale = 0.5;

        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

        this.canvasRect = this.canvas.getBoundingClientRect();
    },

    newGame(slotId, difficulty, eventsEnabled = true) {
        // Enforce difficulty unlock gates:
        // - DIFÍCIL requires defeating 1 boss in NORMAL
        // - DEMENCIAL requires defeating 1 boss in DIFÍCIL
        let diff = difficulty || 'normal';
        try {
            const m = window.Meta && Meta.data ? Meta.data : null;
            const s = (m && m.stats) ? m.stats : {};
            const hardUnlocked = (s.bossKillsNormal || 0) >= 1;
            const demonicUnlocked = (s.bossKillsHard || 0) >= 1;

            if (diff === 'hard' && !hardUnlocked) diff = 'normal';
            if (diff === 'demonic' && !demonicUnlocked) diff = hardUnlocked ? 'hard' : 'normal';
        } catch (e) { /* ignore */ }

        this.difficulty = diff;
        this.eventsEnabled = (eventsEnabled !== false);
        this.currentBiome = 'forest';
        this.playTime = 0;
        this.ngPlusLevel = 0;
        this.bossKillsThisRun = 0;
        this.modifiers = { playerDamageMult: 1, enemyCountMult: 1, enemyStatMult: 1, enemyProjectileSpeedMult: 1, enemyExplodeOnDeath: false };
        this.blessings = [];
        this.curses = [];
        this.relics = [];
        this.relicState = { hitCount: 0, reactionCharged: false, hunterMarkTargetId: null, hunterMarkTimer: 0, brokenClockTimer: 12 };
        this.rollBiomeMutation();
        this.emptyRunePityBoss = 0;
        this.emptyRunePityChest = 0;
        this.forgePity = 0;

        this.player = new Player(this.width / 2 - 16, this.height - 100);
        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel);
        // Clear transient systems (prevents projectiles/particles carrying across runs)
        ProjectileManager.clear();
        ParticleSystem.clear();


        // Player starts with NO runes
        // (removed starting rune - player earns them through gameplay)

        this.canvasRect = this.canvas.getBoundingClientRect();

        // Save entry state
        this.saveRoomEntryState();

        // Apply per-room difficulty/events
        this.onEnterRoom(this.dungeon.getCurrentRoom());
    },

    loadFromSave(saveData) {
        // Enforce difficulty unlock gates even when loading:
        // - DIFÍCIL requires defeating 1 boss in NORMAL
        // - DEMENCIAL requires defeating 1 boss in DIFÍCIL
        let diff = (saveData && saveData.difficulty) ? saveData.difficulty : 'normal';
        try {
            const m = (window.Meta && Meta.data) ? Meta.data : null;
            const s = (m && m.stats) ? m.stats : {};
            const hardUnlocked = (s.bossKillsNormal || 0) >= 1;
            const demonicUnlocked = (s.bossKillsHard || 0) >= 1;
            if (diff === 'hard' && !hardUnlocked) diff = 'normal';
            if (diff === 'demonic' && !demonicUnlocked) diff = hardUnlocked ? 'hard' : 'normal';
        } catch (e) { /* ignore */ }
        this.difficulty = diff;
        this.eventsEnabled = (saveData && typeof saveData.eventsEnabled === 'boolean') ? saveData.eventsEnabled : true;
        this.currentBiome = saveData.biome;
        this.playTime = saveData.playTime || 0;
        this.ngPlusLevel = saveData.ngPlusLevel || 0;
        this.bossKillsThisRun = saveData.bossKillsThisRun || 0;
        this.modifiers = saveData.modifiers || { playerDamageMult: 1, enemyCountMult: 1, enemyStatMult: 1, enemyProjectileSpeedMult: 1, enemyExplodeOnDeath: false };
        this.blessings = saveData.blessings || [];
        this.curses = saveData.curses || [];
        this.rollBiomeMutation(saveData.biomeMutationId || null);

        this.emptyRunePityBoss = saveData.emptyRunePityBoss || 0;
        this.emptyRunePityChest = saveData.emptyRunePityChest || 0;
        this.forgePity = saveData.forgePity || 0;

        this.player = new Player(this.width / 2 - 16, this.height - 100);
        SaveManager.applyLoadedData(this.player, saveData);

        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel);
        // Clear transient systems after loading
        ProjectileManager.clear();
        ParticleSystem.clear();

        // Dungeon.currentRoomIndex is a getter (derived from history). Use helper.
        if (this.dungeon && typeof this.dungeon.setRoomIndex === 'function') {
            this.dungeon.setRoomIndex(saveData.roomIndex || 0);
        }

        this.canvasRect = this.canvas.getBoundingClientRect();

        // Save entry state
        this.saveRoomEntryState();

        // Apply per-room difficulty/events
        this.onEnterRoom(this.dungeon.getCurrentRoom());
    },

    // FIX: Save state when entering a room (to restore if player quits mid-room)
    saveRoomEntryState() {
        this.roomEntryState = {
            hp: this.player.hp,
            mana: this.player.mana,
            gold: this.player.gold,
            potions: this.player.potions,
            stats: { ...this.player.stats },
            runes: this.player.runes.map(r => r ? { ...r } : null),
            perks: this.player.perks.map(p => ({ ...p })),
            playTime: this.playTime
        };
    },

    // FIX: Restore to entry state (when quitting mid-room)
    restoreToRoomEntryState() {
        if (!this.roomEntryState) return;

        this.player.hp = this.roomEntryState.hp;
        this.player.mana = this.roomEntryState.mana;
        this.player.gold = this.roomEntryState.gold;
        this.player.potions = this.roomEntryState.potions;
        this.player.stats = { ...this.roomEntryState.stats };
        this.player.runes = this.roomEntryState.runes.map(r => r ? { ...r } : null);
        this.player.perks = this.roomEntryState.perks.map(p => ({ ...p }));
        this.playTime = this.roomEntryState.playTime;
    },


    rollBiomeMutation(forceId = null) {
        const pool = [
            { id: 'stable', name: 'Estable', desc: 'Sin cambios raros.', enemyStatMult: 1, enemySpeedMult: 1 },
            { id: 'brutal', name: 'Brutal', desc: 'Enemigos +20% HP/Daño.', enemyStatMult: 1.2, enemySpeedMult: 1 },
            { id: 'haste', name: 'Acelerado', desc: 'Enemigos +25% velocidad.', enemyStatMult: 1, enemySpeedMult: 1.25 },
            { id: 'swarm', name: 'Enjambre', desc: '+35% cantidad de enemigos.', enemyStatMult: 1, enemySpeedMult: 1, enemyCountMult: 1.35 },
            { id: 'volatile', name: 'Volátil', desc: 'Enemigos explotan al morir.', enemyStatMult: 1.05, enemySpeedMult: 1, enemyExplodeOnDeath: true }
        ];

        const chosen = forceId ? pool.find(p => p.id === forceId) : Utils.randomChoice(pool);
        this.biomeMutation = { ...chosen };

        // Apply mutation multipliers for this biome only
        this.mutationCountMult = (chosen.enemyCountMult || 1);

        // Mutation baseline for HP/DMG is provided through Dungeon.getDifficultyMult via biomeMutation.enemyStatMult
        return this.biomeMutation;
    },


    // =========================
    // RUN PROGRESSION SCALING (per boss kill, across all modes)
    // =========================
    getProgressionParams() {
        const diff = this.difficulty || 'normal';
        const k = Math.max(0, this.bossKillsThisRun || 0);
        const lateGameBonus = k >= 3 ? 0.15 : 0; // Extra scaling after 3 bosses

        if (diff === 'demonic') return {
            hpStep: 0.28 + lateGameBonus, dmgStep: 0.18 + lateGameBonus * 0.6, eliteStep: 0.22 + lateGameBonus, eliteBase: 0.12
        };
        if (diff === 'hard') return {
            hpStep: 0.18 + lateGameBonus, dmgStep: 0.12 + lateGameBonus * 0.5, eliteStep: 0.16 + lateGameBonus, eliteBase: 0.12
        };
        return { hpStep: 0.10 + lateGameBonus, dmgStep: 0.07 + lateGameBonus * 0.4, eliteStep: 0.10 + lateGameBonus, eliteBase: 0.12 };
    },
    getEnemyProgressMult() {
        const p = this.getProgressionParams();
        const k = Math.max(0, this.bossKillsThisRun || 0);

        // Exponential scaling after 3 bosses as requested
        if (k >= 3) {
            // Calculate base at k=3
            const baseHp = (1 + p.hpStep * 3);
            const baseDmg = (1 + p.dmgStep * 3);

            // Apply exponential growth for kills beyond 3
            const extraKills = k - 3;
            // HP x2 per boss
            const hpMult = baseHp * Math.pow(2, extraKills);
            // Dmg x1.2 per boss
            const dmgMult = baseDmg * Math.pow(1.2, extraKills);

            return { hp: hpMult, dmg: dmgMult };
        }

        return { hp: (1 + p.hpStep * k), dmg: (1 + p.dmgStep * k) };
    },
    getEliteChance() {
        const p = this.getProgressionParams();
        const k = Math.max(0, this.bossKillsThisRun || 0);
        let c = Math.min(1, Math.max(0, p.eliteBase + p.eliteStep * k));
        try { if (this.player && this.player.eliteCrown) c = Math.min(1, c + 0.15); } catch (e) { }
        return c;
    },
    onEnterRoom(room) {
        if (!room) return;

        // Safety: Invincibility on room entry to prevent unfair hits
        if (this.player) {
            this.player.iFrameTimer = 1.5;
        }

        // Navigation flags (backtracking/minimap)
        try {
            if (this.dungeon && typeof this.dungeon.canGoBack === 'function') {
                room.allowBack = !!this.dungeon.canGoBack();
            }
            if (this.dungeon && typeof this.dungeon.getNextOptions === 'function') {
                room._nextOptionsCount = (this.dungeon.getNextOptions() || []).length;
            }
            room._inBossFight = !!(room.type === 'boss' && room.enemies && room.enemies.some(e => e && e.active && e.isBoss));
        } catch (e) { }

        // Music state: boss vs normal gameplay
        try {
            if (window.AudioManager && typeof AudioManager.setMusicState === 'function') {
                AudioManager.setMusicState(room.type === 'boss' ? 'boss' : 'party');
            }
        } catch (e) { }

        try { if (typeof room.applyEntryModifiers === 'function') room.applyEntryModifiers(this); } catch (e) { }
    },

    applyBlessing(blessing) {
        if (!blessing) return;
        this.blessings.push(blessing);
        switch (blessing.id) {
            case 'power': this.modifiers.playerDamageMult *= 1.18; break;
            case 'swift': this.player.speed *= 1.08; break;
            case 'sustain': this.player.maxHp += 20; this.player.hp += 20; break;
            case 'rich': this.player.gold += 120; break;
        }
    },

    applyCurse(curse) {
        if (!curse) return;
        this.curses.push(curse);
        switch (curse.id) {
            case 'fragile': this.player.maxHp = Math.max(30, Math.floor(this.player.maxHp * 0.9)); this.player.hp = Math.min(this.player.hp, this.player.maxHp); break;
            case 'wrath': this.modifiers.enemyStatMult = (this.modifiers.enemyStatMult || 1) * 1.2; break;
            case 'swarm': this.modifiers.enemyCountMult = (this.modifiers.enemyCountMult || 1) * 1.25; break;
            case 'sniper': this.modifiers.enemyProjectileSpeedMult = (this.modifiers.enemyProjectileSpeedMult || 1) * 1.25; break;
        }
    },
    start() {
        if (this.running) return;
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.canvasRect = this.canvas.getBoundingClientRect();

        // Start music
        AudioManager.startMusic(this.currentBiome);

        this.loop();
    },

    stop() {

        // Clear transient systems on death (prevents ghost bullets next run)
        ProjectileManager.clear();
        ParticleSystem.clear();

        this.running = false;
    },

    loop() {
        if (!this.running) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        const modalOpen = (window.UI && typeof UI.isBlockingOverlayOpen === 'function') ? UI.isBlockingOverlayOpen() : false;

        // ALways check for pause toggle input, even if paused
        this.handlePauseInput();

        // Hard-freeze the simulation when a blocking overlay is open.
        // This guarantees the player cannot be damaged while choosing relics / UI.
        if (!this.paused && !modalOpen) {
            this.update(dt);
            this.playTime += dt;
        } else {
            // Prevent a big dt jump after long pauses/modals
            this.lastTime = now;
        }

        this.render();
        Input.update();

        requestAnimationFrame(() => this.loop());
    },

    handlePauseInput() {
        if (Input.isKeyJustPressed('Escape')) {
            const pauseMenu = document.getElementById('pause-menu');
            const isCurrentlyVisible = pauseMenu && !pauseMenu.classList.contains('hidden');

            // If a blocking overlay is open (like Shop), ESC might be handled by UI to close it.
            // But if we are just Paused, we want to Unpause.
            // Let's assume UI.js handles closing modals if they are open.
            // If NO modal is open, we toggle pause.

            // However, Game.paused is distinct from Shop Modal.
            // If Game.paused is true, we want to unpause.

            if (this.paused) {
                // Try to resume
                this.togglePause();
            } else {
                // Try to pause, but only if no other blocking UI is effectively handling the input?
                // Actually, standard behavior: ESC pauses if playing.
                // If a modal is open, UI might catch it first?
                // For now, let's just toggle.

                // Check if UI is already handling ESC (e.g. closing shop)
                // If a modal is open, we usually DON'T want to open the Pause Menu on top of it.
                // But we moved the modal check in loop.
                const modalOpen = (window.UI && typeof UI.isBlockingOverlayOpen === 'function') ? UI.isBlockingOverlayOpen() : false;
                if (!modalOpen) {
                    this.togglePause();
                }
            }
        }
    },

    tickRelics(dt, room) {
        if (!this.player) return;

        // Broken Clock: periodic global slow
        if (this.player.brokenClock) {
            this.relicState.brokenClockTimer -= dt;
            if (this.relicState.brokenClockTimer <= 0) {
                this.relicState.brokenClockTimer = 12;
                if (room && room.enemies) {
                    for (const e of room.enemies) {
                        if (e && e.active && !e.isBoss) {
                            // don't override stronger slows
                            if (!e.slowDuration || e.slowDuration < 0.6) {
                                e.slowDuration = 1.5;
                                e.slowAmount = 0.55;
                            }
                        }
                    }
                    ParticleSystem.burst(this.player.centerX, this.player.centerY, 18, { color: '#9cf', life: 0.5, size: 4, speed: 3 });
                    AudioManager.play('pickup');
                }
            }
        }

        // Hunter Mark duration countdown handled on enemy
        if (this.relicState.hunterMarkTimer > 0) this.relicState.hunterMarkTimer -= dt;
    },

    update(dt) {
        const room = this.dungeon.getCurrentRoom();

        // Absolute safety: if a blocking overlay is open (relic draft / etc),
        // do NOT advance the simulation even if some other pause flag got out of sync.
        try {
            if (window.UI && typeof UI.isBlockingOverlayOpen === 'function' && UI.isBlockingOverlayOpen()) {
                return;
            }
        } catch (e) { }

        if (Math.random() < 0.01) {
            this.canvasRect = this.canvas.getBoundingClientRect();
        }

        this.player.handleInput(this.camera, this.canvasRect, this.scale);
        this.player.update(dt, room);

        room.update(dt, this.player);

        ProjectileManager.update(dt, this.player, room.getActiveEnemies(), room);

        ParticleSystem.update(dt);

        // Relics (NG-only)
        this.tickRelics(dt, room);

        // Screenshake
        this.screenshake.intensity *= 0.9;
        if (this.screenshake.intensity < 0.1) this.screenshake.intensity = 0;
        this.screenshake.x = (Math.random() - 0.5) * this.screenshake.intensity;
        this.screenshake.y = (Math.random() - 0.5) * this.screenshake.intensity;

        // Interaction
        if (Input.isKeyJustPressed('KeyE')) {
            const result = room.handleInteraction(this.player);
            if (result) {
                if (result.type === 'loot') {
                    this.handleLootWithChoice(result.item);
                } else if (result.type === 'nextRoom') {
                    this.goToNextRoom();
                } else if (result.type === 'prevRoom') {
                    this.goToPreviousRoom();
                } else if (result.type === 'shop') {
                    UI.showShop(result.shop);
                } else if (result.type === 'forge') {
                    UI.showForgeTerminal(result.forge);
                } else if (result.type === 'event') {
                    if (result.event === 'shrine') {
                        UI.showShrineChoice();
                    }
                }
            }
        }

        // Pause logic moved to handlePauseInput called from loop()

        // Codex / Achievements
        if (Input.isKeyJustPressed('KeyC')) {
            try {
                if (window.UI && typeof UI.toggleCodex === 'function') {
                    UI.toggleCodex();
                }
            } catch (e) { }
        }

        // Check death
        if (this.player.hp <= 0) {
            this.onPlayerDeath();
        }

        UI.updateHUD(this.player, room, this.dungeon);
    },

    render() {
        this.ctx.save();
        this.ctx.translate(this.screenshake.x, this.screenshake.y);

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const room = this.dungeon.getCurrentRoom();
        room.draw(this.ctx);

        this.player.draw(this.ctx);

        ProjectileManager.draw(this.ctx);

        ParticleSystem.draw(this.ctx);

        // Boss HUD
        try { this.drawBossHud(this.ctx, room); } catch (e) { }

        this.ctx.restore();
    },

    spawnProjectile(x, y, angle, damage, speed, range, owner, effects, runeData = {}) {
        // Room modifier: anti-magic reduces player projectile damage while inside zone
        if (owner === 'player') {
            try {
                const room = (this.dungeon && typeof this.dungeon.getCurrentRoom === 'function') ? this.dungeon.getCurrentRoom() : null;
                if (room && typeof room.isPlayerInAntiMagic === 'function' && room.isPlayerInAntiMagic(this.player)) {
                    damage = Math.max(1, Math.floor(damage * 0.55));
                }
            } catch (e) { }
        }
        let finalSpeed = speed;
        if (owner === 'enemy' && this.modifiers && this.modifiers.enemyProjectileSpeedMult) {
            finalSpeed *= this.modifiers.enemyProjectileSpeedMult;
        }
        ProjectileManager.spawn(x, y, angle, damage, finalSpeed, range, owner, effects, runeData);
    },

    // =========================
    // DEMENCIAL SYSTEMS
    // =========================
    isDemencial() { return this.difficulty === 'demonic'; },

    rollEmptyRune(source = 'chest') {
        if (!this.isDemencial()) return null;
        const pity = (source === 'boss') ? this.emptyRunePityBoss : this.emptyRunePityChest;

        // Base chances (balanced)
        const base = (source === 'boss') ? 18 : 6; // %
        const pityBonus = Math.min(30, pity * ((source === 'boss') ? 6 : 3)); // grows
        const chance = Math.min(60, base + pityBonus);

        if (Math.random() * 100 < chance) {
            // reset pity for that source
            if (source === 'boss') this.emptyRunePityBoss = 0;
            else this.emptyRunePityChest = 0;
            return getEmptyRune();
        }

        // Increase pity
        if (source === 'boss') this.emptyRunePityBoss++;
        else this.emptyRunePityChest++;
        return null;
    },

    shouldSpawnForgeTerminal(biomeId) {
        if (!this.isDemencial()) return false;
        const biomeIdx = (window.BiomeOrder) ? Math.max(0, BiomeOrder.indexOf(biomeId)) : 0;

        // Base chance per biome
        const base = 0.30 + biomeIdx * 0.04; // 30% -> ~74% late
        const pity = Math.min(0.45, this.forgePity * 0.15); // +15% per miss
        let bonus = 0;

        // More likely if player has unprogrammed empty runes
        const unprog = (this.player && this.player.runes) ? this.player.runes.filter(r => r && r.id === 'empty_rune' && !r.programmed).length : 0;
        if (unprog >= 1) bonus += 0.15;
        if (unprog >= 2) bonus += 0.20;

        const p = Math.min(0.90, base + pity + bonus);
        const roll = Math.random();

        // Anti-frustration: guarantee if missed 2 biomes while holding >=2 empty runes
        if (unprog >= 2 && this.forgePity >= 2) return true;

        return roll < p;
    },

    spawnForgeTerminalInRoom(room, biomeId) {
        if (!room || !this.isDemencial()) return;
        const biomeIdx = (window.BiomeOrder) ? Math.max(0, BiomeOrder.indexOf(biomeId)) : 0;
        const cost = 250 + biomeIdx * 80 + (this.ngPlusLevel || 0) * 40;

        const ev = {
            kind: 'forge',
            x: room.bounds.x + room.bounds.width - 150,
            y: room.bounds.y + 20,
            w: 120,
            h: 64,
            used: false,
            cost,
            biomeId
        };
        room.events = room.events || [];
        room.events.push(ev);
    },

    onForgeUsed() {
        // Risk: small ambush chance
        const room = this.dungeon ? this.dungeon.getCurrentRoom() : null;
        if (!room) return;
        if (Math.random() < 0.15) {
            const enemies = (room.biome && BiomeDatabase[room.biome] && BiomeDatabase[room.biome].enemies) ? BiomeDatabase[room.biome].enemies : ['goblin'];
            const count = 2 + Utils.random(0, 1);
            for (let i = 0; i < count; i++) {
                room.enemies.push(createEnemy(Utils.randomChoice(enemies), room.bounds.x + Utils.random(80, room.bounds.width - 80), room.bounds.y + Utils.random(80, room.bounds.height - 80), this.dungeon.difficultyMult));
            }
            room.doorOpen = false;
            setTimeout(() => { room.doorOpen = true; }, 1200);
            this.shake(8);
        }
    },


    onEnemyKilled(enemy) {
        this.player.stats.kills++;
        this.player.stats.damageDealt += enemy.maxHp;


        if (this.player && typeof this.player.onKill === 'function') {
            this.player.onKill();
        }

        // Codex / achievements tracking
        try {
            if (window.Meta && typeof Meta.recordEnemyKill === 'function') {
                Meta.recordEnemyKill(enemy.type);
            }
        } catch (e) { }

        const room = this.dungeon.getCurrentRoom();

        // Demencial scripted runes: OnKill hook
        try {
            if (window.RuneScript && typeof RuneScript.trigger === 'function') {
                RuneScript.trigger('OnKill', { eventName: 'OnKill', player: this.player, room, target: enemy, damage: enemy.maxHp || 0 });
            }
        } catch (e) { }
        // Base gold
        room.spawnGold(enemy.centerX, enemy.centerY, enemy.goldValue);

        // Relic: Fragmentation Core (player kills)
        try {
            if (this.player && this.player.fragmentationCore && enemy._lastHitOwner === 'player' && Math.random() < 0.25) {
                const a0 = Math.random() * Math.PI * 2;
                for (let i = 0; i < 3; i++) {
                    const a = a0 + (i - 1) * 0.35;
                    this.spawnProjectile(enemy.centerX, enemy.centerY, a, Math.max(3, Math.floor(this.player.calculateDamage() * 0.25)), this.player.getProjectileSpeed() * 1.05, 420, 'player', ['homing'], {});
                }
                ParticleSystem.burst(enemy.centerX, enemy.centerY, 12, { color: '#b388ff', life: 0.5, size: 4, speed: 3 });
            }
        } catch (e) { }

        // Relic: Elite Crown (extra gold + rare chest chance)
        try {
            if (this.player && this.player.eliteCrown && enemy.isElite) {
                room.spawnGold(enemy.centerX, enemy.centerY, Math.max(4, Math.floor(enemy.goldValue * 0.8)));
                if (Math.random() < 0.12) {
                    room.chests.push(new Chest(enemy.centerX - 12, enemy.centerY - 10, 'rare'));
                }
            }
        } catch (e) { }

        this.shake(3);
    },

    // NEW: Handler for boss death - gives legendary reward and NG+ portal
    onBossKilled(boss) {
        // Run progression: each boss kill makes future rooms harder
        this.bossKillsThisRun = (this.bossKillsThisRun || 0) + 1;

        this.player.stats.kills++;
        this.player.stats.damageDealt += boss.maxHp;


        if (this.player && typeof this.player.onKill === 'function') {
            this.player.onKill();
        }

        // Codex / achievements tracking
        try {
            if (window.Meta && typeof Meta.recordBossKill === 'function') {
                Meta.recordBossKill(boss.bossType || boss.type, this.difficulty);
            }
        } catch (e) { }

        const room = this.dungeon.getCurrentRoom();

        // Demencial scripted runes: treat bosses as valid OnKill triggers too
        try {
            if (window.RuneScript && typeof RuneScript.trigger === 'function') {
                RuneScript.trigger('OnKill', { eventName: 'OnKill', player: this.player, room, target: boss, damage: boss.maxHp || 0 });
            }
        } catch (e) { }
        room.bossDefeated = true;

        // Spawn lots of gold
        room.spawnGold(boss.centerX, boss.centerY, boss.goldValue || 100);

        // FINAL BOSS FLOW:
        // 1) Spawn a boss chest
        // 2) Chest grants LEGENDARY Rune OR LEGENDARY Item
        // 3) After loot modal closes, open portal to NG+
        const isFinalBiome = (window.BiomeOrder && BiomeOrder[BiomeOrder.length - 1] === this.currentBiome);
        const isFinalBoss = (boss && boss.bossType === 'final_boss') || (boss && boss.type === 'final_boss');
        const shouldTriggerNgPlus = isFinalBiome && isFinalBoss;

        if (shouldTriggerNgPlus) {
            // Keep door closed until loot happens
            room.cleared = true;
            room.doorOpen = false;
            room.isNgPlusPortal = false;

            // Mark for portal open after loot UI closes
            room._pendingNgPlusPortal = true;

            // Spawn boss chest
            const chestX = room.bounds.x + room.bounds.width / 2 - 12;
            const chestY = room.bounds.y + room.bounds.height / 2 - 10;
            room.chests.push(new Chest(chestX, chestY, 'legendary', {
                isBossChest: true,
                forceLegendary: true
            }));

            this.shake(12);
            return;
        }

        // NORMAL BOSS FLOW: reward screen then door continues to next biome
        const legendaryRune = getRandomRune('legendary');
        const epicRune = getRandomRune('epic');
        const rareRune = getRandomRune('rare');

        setTimeout(() => {
            UI.showRewardScreen([legendaryRune, epicRune, rareRune].filter(r => r));
            this.paused = true;
        }, 1200);

        setTimeout(() => {
            room.cleared = true;
            room.doorOpen = true;
            room.isNgPlusPortal = false;

            // Demencial: chance to spawn Forge-Terminal at end of biome
            try {
                if (Game.shouldSpawnForgeTerminal(Game.currentBiome)) {
                    Game.spawnForgeTerminalInRoom(room, Game.currentBiome);
                    Game.forgePity = 0;
                } else if (Game.isDemencial()) {
                    Game.forgePity = (Game.forgePity || 0) + 1;
                }
            } catch (e) { }

        }, 1300);

        this.shake(10);
    },

    // NEW: Loot with choice (rune vs item)

    handleLootWithChoice(chestLoot) {
        // chestLoot can be a string rarity or an object descriptor
        const rarity = typeof chestLoot === 'string' ? chestLoot : (chestLoot?.rarity || 'common');
        const forceLegendary = !!(typeof chestLoot === 'object' && chestLoot?.forceLegendary);
        const bossChest = !!(typeof chestLoot === 'object' && chestLoot?.bossChest);

        // Demencial: chance to drop an Empty Rune (with pity)
        let empty = null;
        try {
            empty = this.rollEmptyRune(bossChest ? 'boss' : 'chest');
        } catch (e) { empty = null; }

        // Loot tuning by difficulty
        const diff = this.difficulty || 'normal';
        const demencial = (diff === 'demonic');

        function upgradeRarity(r) {
            const order = ['common', 'rare', 'epic', 'legendary'];
            const idx = Math.max(0, order.indexOf(r));
            const shift = (diff === 'hard') ? 1 : (diff === 'demonic') ? 2 : 0;
            return order[Math.min(order.length - 1, idx + shift)];
        }

        const tunedRarity = demencial ? upgradeRarity(rarity) : (diff === 'hard' ? upgradeRarity(rarity) : rarity);

        const runeOption = empty ? empty : (forceLegendary ? getRandomRune('legendary') : getWeightedRandomRune(tunedRarity));
        const itemOption = forceLegendary ? ItemDatabase.getRandomItem('legendary') : ItemDatabase.getRandomItem(tunedRarity);

        if (runeOption && itemOption) {
            UI.showLootChoice(runeOption, itemOption);
        } else if (runeOption) {
            UI.handleRuneChoice(runeOption);
        } else {
            this.applyItem(itemOption);
        }
    },


    // Called by UI when loot modal closes
    onLootModalClosed() {
        const room = this.dungeon?.getCurrentRoom?.();
        if (!room) return;

        if (room._pendingNgPlusPortal) {
            room._pendingNgPlusPortal = false;
            room.doorOpen = true;
            room.isNgPlusPortal = true;

            // Small burst to announce portal
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 30, {
                color: '#00e5ff', life: 0.8, size: 5, speed: 4
            });
            AudioManager.play('door');
        }
    },

    // FIX: Separate rune handling from item handling
    handleLoot(item) {
        if (!item) return;

        // FIRST: Check if explicitly marked as item type
        // Items with type='item' should NEVER go to rune slots
        if (item.type === 'item') {
            this.applyItem(item);
            return;
        }

        // Active items go to active slots (not rune slots)
        if (item.type === 'active') {
            // Ensure at least 1 slot exists
            if (typeof this.player.ensureActiveSlots === 'function') {
                this.player.ensureActiveSlots(this.player.activeItems?.length || 1);
            }
            const empty = (this.player.activeItems || []).findIndex(a => a === null);
            if (empty >= 0) {
                this.player.equipActiveItem(item, empty);
                ParticleSystem.burst(this.player.centerX, this.player.centerY, 12, { color: '#7b4dff', life: 0.6, size: 4, speed: 2 });
                AudioManager.play('pickup');
                return;
            }
            // Choose which to replace
            this.paused = true;
            if (window.UI && typeof UI.showActiveSwapDialog === 'function') {
                UI.showActiveSwapDialog(item);
            } else {
                this.player.equipActiveItem(item, 0);
                this.paused = false;
            }
            return;
        }

        // Check if this is a RUNE (has rune-specific properties like effect)
        // Runes have 'effect' property for combat effects (burn, pierce, chain, etc)
        const isRune = item.effect !== undefined ||
            item.extraProjectiles !== undefined ||
            item.manaBonus !== undefined ||
            item.fireRateBonus !== undefined ||
            item.damageMultiplier !== undefined ||
            item.manaRegen !== undefined ||
            item.pierceCount !== undefined ||
            item.lifeSteal !== undefined ||
            item.chainCount !== undefined ||
            item.critChance !== undefined ||
            item.rangeMultiplier !== undefined ||
            item.bossMultiplier !== undefined;

        if (isRune) {
            // This is a RUNE - goes to rune slots
            const emptySlot = this.player.runes.findIndex(r => r === null);
            if (emptySlot >= 0) {
                this.player.equipRune(item, emptySlot);
            } else {
                // Let the player choose which rune to replace
                this.paused = true;
                if (window.UI && typeof UI.showRuneSwapDialog === 'function') {
                    UI.showRuneSwapDialog(item);
                } else {
                    // Fallback
                    this.player.equipRune(item, 0);
                    this.paused = false;
                }
                return;
            }

            ParticleSystem.burst(this.player.centerX, this.player.centerY, 15, {
                color: '#ffd700', life: 0.5, size: 4, speed: 3
            });
            AudioManager.play('pickup');
        } else {
            // This is an ITEM - apply effects immediately, don't use rune slots
            this.applyItem(item);
        }
    },

    // NEW: Apply item effects immediately
    applyItem(item) {
        if (!item) return;

        let appliedSomething = false;

        // Healing
        if (item.heal && item.heal > 0) {
            const healAmount = item.heal >= 999 ? this.player.maxHp : item.heal;
            this.player.heal(healAmount);
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 10, {
                color: '#44ff88', life: 0.5, size: 3, speed: 2
            });
            appliedSomething = true;
        }

        // Potions
        if (item.potions && item.potions > 0) {
            this.player.potions += item.potions;
            appliedSomething = true;
        }

        // Gold
        if (item.gold && item.gold > 0) {
            this.player.gold += item.gold;
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 8, {
                color: '#ffd700', life: 0.4, size: 3, speed: 2
            });
            appliedSomething = true;
        }

        // Max HP bonus (permanent stat increase)
        if (item.maxHpBonus && item.maxHpBonus > 0) {
            this.player.maxHp += item.maxHpBonus;
            this.player.hp += item.maxHpBonus;
            this.player.addPassiveItem(item); // Track for display
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 12, {
                color: '#ff4444', life: 0.6, size: 4, speed: 2
            });
            appliedSomething = true;
        }

        // Damage bonus (permanent)
        if (item.damageBonus && item.damageBonus > 0) {
            this.player.damage += item.damageBonus;
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Speed bonus (permanent)
        if (item.speedBonus && item.speedBonus > 0) {
            this.player.speed += item.speedBonus;
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Max Mana bonus (permanent)
        if (item.maxManaBonus && item.maxManaBonus !== 0) {
            this.player.maxMana += item.maxManaBonus;
            this.player.mana += item.maxManaBonus;
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Mana regen bonus (multiplier)
        if (item.manaRegenBonus && item.manaRegenBonus !== 0) {
            this.player.manaRegenMultiplier *= (1 + item.manaRegenBonus);
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Fire rate bonus (permanent casting speed)
        if (item.fireRateBonus && item.fireRateBonus !== 0) {
            // stored as multiplier on player
            this.player.fireRateMult *= (1 - item.fireRateBonus);
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Projectile speed/range bonuses
        if (item.projectileSpeedBonus && item.projectileSpeedBonus !== 0) {
            this.player.projectileSpeedMult *= (1 + item.projectileSpeedBonus);
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }
        if (item.projectileRangeBonus && item.projectileRangeBonus !== 0) {
            this.player.projectileRangeMult *= (1 + item.projectileRangeBonus);
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Flat mana cost modifier (can be negative)
        if (typeof item.manaCostFlat === 'number' && item.manaCostFlat !== 0) {
            this.player.manaCostFlat = (this.player.manaCostFlat || 0) + item.manaCostFlat;
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        // Rune slots (permanent)
        if (item.runeSlotBonus && item.runeSlotBonus > 0) {
            this.player.addRuneSlots(item.runeSlotBonus);
            this.player.addPassiveItem(item);
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 18, {
                color: '#4fc3f7', life: 0.7, size: 4, speed: 3
            });
            appliedSomething = true;
        }

        // Active item slots (permanent)
        if (item.activeSlotBonus && item.activeSlotBonus > 0) {
            if (typeof this.player.addActiveSlots === 'function') {
                this.player.addActiveSlots(item.activeSlotBonus);
            }
            this.player.addPassiveItem(item);
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 18, {
                color: '#7b4dff', life: 0.7, size: 4, speed: 3
            });
            appliedSomething = true;
        }

        if (appliedSomething) {
            // Apply set thresholds (2/3, 3/3)
            try { this.applySetBonuses(); } catch (e) { }
            AudioManager.play('pickup');
        }
    },



    applySetBonuses() {
        const sets = window.SetDatabase || {};
        if (!this.player || !sets) return;
        if (!this.player._appliedSetBonuses) this.player._appliedSetBonuses = {};

        const owned = {};
        for (const it of (this.player.passiveItems || [])) {
            if (!it || !it.setId) continue;
            owned[it.setId] = owned[it.setId] || new Set();
            if (it.setPiece) owned[it.setId].add(it.setPiece);
        }

        for (const sid of Object.keys(sets)) {
            const def = sets[sid];
            const count = owned[sid] ? owned[sid].size : 0;
            this.player._appliedSetBonuses[sid] = this.player._appliedSetBonuses[sid] || { two: false, three: false };
            const flags = this.player._appliedSetBonuses[sid];
            if (count >= 2 && !flags.two && def.bonus2 && typeof def.bonus2.apply === 'function') {
                def.bonus2.apply(this.player);
                flags.two = true;
                ParticleSystem.burst(this.player.centerX, this.player.centerY, 16, { color: '#b3e5fc', life: 0.55, size: 4, speed: 3 });
                try { AudioManager.play('pickup'); } catch (e) { }
            }
            if (count >= 3 && !flags.three && def.bonus3 && typeof def.bonus3.apply === 'function') {
                def.bonus3.apply(this.player);
                flags.three = true;
                ParticleSystem.burst(this.player.centerX, this.player.centerY, 22, { color: '#ffd700', life: 0.65, size: 4, speed: 3 });
                try { AudioManager.play('pickup'); } catch (e) { }
            }
        }
    },

    selectReward(reward) {
        if (!reward) {
            this.paused = false;
            return;
        }

        // Rewards are usually runes. If all rune slots are full, let the player choose which one to replace.
        const isRune = reward.effect !== undefined ||
            reward.extraProjectiles !== undefined ||
            reward.manaBonus !== undefined ||
            reward.fireRateBonus !== undefined ||
            reward.damageMultiplier !== undefined ||
            reward.manaRegen !== undefined ||
            reward.pierceCount !== undefined ||
            reward.lifeSteal !== undefined ||
            reward.chainCount !== undefined ||
            reward.critChance !== undefined ||
            reward.rangeMultiplier !== undefined ||
            reward.bossMultiplier !== undefined;

        if (isRune) {
            UI.handleRuneChoice({ ...reward });
            // UI.closeLootModal() will unpause; if it doesn't open a modal (empty slot), it still unpauses.
            return;
        }

        this.handleLoot({ ...reward });
        this.paused = false;
    },

    hasRelic(id) {
        return !!(this.relics && this.relics.some(r => r && r.id === id));
    },

    applyRelic(relic) {
        if (!relic) return;
        if (this.hasRelic(relic.id)) return;
        this.relics.push({ id: relic.id, name: relic.name, icon: relic.icon, desc: relic.desc });
        try { if (typeof relic.apply === 'function') relic.apply(this); } catch (e) { }
    },

    rollNgRelicChoices() {
        // Choose 3 distinct relics
        const pool = (typeof RelicDatabase !== 'undefined') ? RelicDatabase.slice() : [];
        const choices = [];
        while (pool.length && choices.length < 3) {
            const idx = Math.floor(Math.random() * pool.length);
            const pick = pool.splice(idx, 1)[0];
            choices.push(pick);
        }
        return choices;
    },

    goToNextRoom() {
        const currentRoom = this.dungeon.getCurrentRoom();

        // Check if this is NG+ portal from boss room
        if (currentRoom.isNgPlusPortal) {
            this.startNewGamePlus();
            return;
        }

        // SAVE when passing through door
        this.saveGameToDisk();

        const opts = (this.dungeon && typeof this.dungeon.getNextOptions === 'function') ? this.dungeon.getNextOptions() : [];
        if (!opts || opts.length === 0) {
            this.onBiomeComplete();
            return;
        }

        const doTransition = (nextRoom) => {
            if (!nextRoom) return;

            // If we go forward, spawn from bottom
            this.player.x = this.width / 2 - this.player.width / 2;
            this.player.y = this.height - 80;
            this.player.direction = 'up';

            ProjectileManager.clear();
            ParticleSystem.clear();

            // Save entry state for new room
            this.saveRoomEntryState();

            // Apply per-room difficulty/events
            this.onEnterRoom(nextRoom);
        };

        if (opts.length === 1) {
            const nextRoom = (typeof this.dungeon.moveTo === 'function') ? this.dungeon.moveTo(opts[0]) : this.dungeon.nextRoom();
            doTransition(nextRoom);
            return;
        }

        // Multiple paths: DISABLED (linear dungeon). Always take the first option.
        const pick = opts[0];
        const nextRoom = (typeof this.dungeon.moveTo === 'function') ? this.dungeon.moveTo(pick) : this.dungeon.nextRoom();
        doTransition(nextRoom);
    },

    goToPreviousRoom() {
        const currentRoom = this.dungeon ? this.dungeon.getCurrentRoom() : null;
        if (!currentRoom) return;

        // Only allow backtracking if cleared and not in a boss fight
        if (!currentRoom.cleared || currentRoom.type === 'boss' || currentRoom._inBossFight) {
            try { AudioManager.play('menuHover'); } catch (e) { }
            return;
        }
        if (!this.dungeon || typeof this.dungeon.back !== 'function' || !this.dungeon.canGoBack()) {
            try { AudioManager.play('menuHover'); } catch (e) { }
            return;
        }

        const prevRoom = this.dungeon.back();
        if (!prevRoom) return;

        // Coming back: spawn near top entrance, heading down
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = 60;
        this.player.direction = 'down';

        ProjectileManager.clear();
        ParticleSystem.clear();

        // Save entry state for the room we returned to
        this.saveRoomEntryState();
        this.onEnterRoom(prevRoom);
    },

    // NEW: Start New Game+ loop
    startNewGamePlus() {
        this.ngPlusLevel++;
        this.bossKillsThisRun = 0;

        try {
            if (window.Meta && typeof Meta.recordNgPlus === 'function') {
                Meta.recordNgPlus(this.ngPlusLevel);
            }
        } catch (e) { }

        // Save progress
        this.saveGameToDisk();

        // Reset to first biome with increased difficulty
        this.currentBiome = 'forest';
        // Roll new biome mutation for the new loop
        this.rollBiomeMutation();

        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel);


        // NEW NG relic draft: choose 1 of 3 (only here; never in chests/shops)
        try {
            const choices = this.rollNgRelicChoices();
            this.paused = true;
            if (window.UI && typeof UI.showRelicDraft === 'function') {
                UI.showRelicDraft(choices, (picked) => {
                    this.applyRelic(picked);
                    this.paused = false;
                });
            } else {
                // Fallback: auto-pick
                this.applyRelic(choices[0]);
                this.paused = false;
            }
        } catch (e) { }

        // Reposition player
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - 80;
        this.player.direction = 'up';

        // Full heal for NG+
        this.player.hp = this.player.maxHp;
        this.player.mana = this.player.maxMana;
        this.player.potions = Math.min(this.player.potions + 2, 10);

        ProjectileManager.clear();
        ParticleSystem.clear();

        // Start music
        AudioManager.stopMusic();
        AudioManager.startMusic(this.currentBiome);

        // NG+ message
        ParticleSystem.burst(this.player.centerX, this.player.centerY, 50, {
            color: '#ffd700', life: 1, size: 6, speed: 5
        });

        // Save entry state
        this.saveRoomEntryState();

        // Pact choice: 1 blessing + 1 curse per loop
        const blessings = [
            { id: 'power', name: 'Poder', desc: '+18% daño' },
            { id: 'swift', name: 'Celeridad', desc: '+8% velocidad' },
            { id: 'sustain', name: 'Vitalidad', desc: '+20 HP Máx.' },
            { id: 'rich', name: 'Oro Fácil', desc: '+120 oro inmediato' }
        ];
        const curses = [
            { id: 'fragile', name: 'Frágil', desc: '-10% HP máximo' },
            { id: 'wrath', name: 'Ira', desc: 'Enemigos +20% HP/Daño' },
            { id: 'swarm', name: 'Enjambre', desc: '+25% enemigos por sala' },
            { id: 'sniper', name: 'Balística', desc: 'Proyectiles enemigos +25% velocidad' }
        ];

        this.paused = true;
        UI.showNgPlusPactChoice(blessings, curses, (b, c) => {
            this.applyBlessing(b);
            this.applyCurse(c);
            this.paused = false;
        });
    },

    // FIX: Save game to disk (only called when passing doors)
    saveGameToDisk() {
        const saveData = SaveManager.createSaveData(
            this.player,
            this.dungeon,
            this.currentBiome,
            this.playTime
        );
        SaveManager.saveSlot(UI.selectedSlot, saveData);
    },

    onBiomeComplete() {
        this.player.stats.biomesCleared++;

        // Save progress
        this.saveGameToDisk();

        const nextBiome = getNextBiome(this.currentBiome);
        this.currentBiome = nextBiome;
        this.rollBiomeMutation();

        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel);

        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - 80;

        this.player.heal(30);

        // Change music
        AudioManager.stopMusic();
        AudioManager.startMusic(this.currentBiome);

        // No free rewards on biome entry - boss killed gave rewards already
        this.paused = false;

        // Save entry state
        this.saveRoomEntryState();

        // Apply per-room difficulty/events
        this.onEnterRoom(this.dungeon.getCurrentRoom());
    },

    onPlayerDeath() {
        // Meta progression (across runs)
        try {
            if (window.Meta) {
                if (typeof Meta.recordRunSummary === 'function') {
                    Meta.recordRunSummary({
                        biomesCleared: (this.player?.stats?.biomesCleared || 0),
                        usedPotions: (this.player?.stats?.potionsUsed || 0)
                    });
                }
                if (typeof Meta.recordDeath === 'function') {
                    Meta.recordDeath();
                }
            }
        } catch (e) { }

        // Run history + codex persistence (lightweight)
        try {
            const histKey = 'arcane_depths_run_history';
            const prev = JSON.parse(localStorage.getItem(histKey) || '[]');

            const entry = {
                date: new Date().toLocaleString(),
                time: this.playTime,
                kills: this.player.stats.kills,
                gold: this.player.gold,
                biome: this.currentBiome,
                room: (this.dungeon ? (this.dungeon.currentRoomIndex + 1) : 0),
                ngPlusLevel: this.ngPlusLevel
            };

            prev.unshift(entry);
            localStorage.setItem(histKey, JSON.stringify(prev.slice(0, 20)));
        } catch (e) { }

        this.running = false;

        SaveManager.deleteSlot(UI.selectedSlot);

        AudioManager.stopMusic();
        AudioManager.play('death');
        UI.showDeathScreen(this.player);
    },

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            UI.showPauseMenu();
        } else {
            UI.hidePauseMenu();
        }
    },

    // FIX: When quitting, restore to room entry state (no mid-room farming)
    quitToMenu() {
        // Restore to state when entering room
        this.restoreToRoomEntryState();

        // Save that restored state
        this.saveGameToDisk();

        this.stop();
        AudioManager.stopMusic();
    },



    drawBossHud(ctx, room) {
        if (!ctx || !room || !room.enemies) return;
        const boss = room.enemies.find(e => e && e.active && (e.isBoss || e.bossType));
        if (!boss) return;

        const name = boss.bossName || boss.bossType || 'BOSS';
        const hpPct = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));

        ctx.save();
        // Backplate
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(70, 10, 660, 32);

        // HP bar
        ctx.fillStyle = 'rgba(255,0,255,0.35)';
        ctx.fillRect(80, 28, 640, 10);
        ctx.fillStyle = 'rgba(255,0,255,0.95)';
        ctx.fillRect(80, 28, 640 * hpPct, 10);

        // Text
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(name, 80, 22);

        // Mutations line
        try {
            const muts = boss.mutations && boss.mutations.length ? boss.mutations.map(m => m.label || m).join(' • ') : '';
            if (muts) {
                ctx.fillStyle = '#d1c4e9';
                ctx.font = '8px monospace';
                ctx.fillText('Mutaciones: ' + muts, 80, 52);
            }
        } catch (e) { }

        ctx.restore();
    },

    shake(intensity) {
        this.screenshake.intensity = Math.max(this.screenshake.intensity, intensity);
    }
};

// =========================
// RELICS (chosen only on NEW NG)
// =========================
const RelicDatabase = [
    {
        id: 'reaction_gauntlet',
        name: 'Guantelete de Reacción',
        icon: '🧤',
        desc: 'Cada 5 impactos, el próximo hit explota (CD interno).',
        apply: (game) => { /* state handled in projectile hits */ }
    },
    {
        id: 'hunter_mark',
        name: 'Marca del Cazador',
        icon: '🎯',
        desc: 'El primer enemigo que golpeás queda marcado y recibe +50% daño por 4s.',
        apply: (game) => { /* state handled in projectile hits */ }
    },
    {
        id: 'echo_boots',
        name: 'Botas del Eco',
        icon: '👢',
        desc: 'Tu dash deja una sombra que dispara 1 proyectil al final del dash.',
        apply: (game) => { game.player.echoBoots = true; }
    },
    {
        id: 'chain_seal',
        name: 'Sello de Cadena',
        icon: '⛓️',
        desc: 'Tus proyectiles tienen +1 chain, pero -10% daño.',
        apply: (game) => { game.player.chainCountBonus = (game.player.chainCountBonus || 0) + 1; game.modifiers.playerDamageMult *= 0.90; }
    },
    {
        id: 'fragmentation_core',
        name: 'Núcleo de Fragmentación',
        icon: '💠',
        desc: 'Al matar, 25% chance de soltar 3 fragmentos que buscan otro enemigo.',
        apply: (game) => { game.player.fragmentationCore = true; }
    },
    {
        id: 'broken_clock',
        name: 'Reloj Roto',
        icon: '🕒',
        desc: 'Cada 12s, ralentiza a todos los enemigos 1.5s (no stackea con slow fuerte).',
        apply: (game) => { game.player.brokenClock = true; game.relicState.brokenClockTimer = 12; }
    },
    {
        id: 'precision_lens',
        name: 'Lente de Precisión',
        icon: '🔎',
        desc: 'Cuanto más lejos el objetivo, más daño (hasta +35%).',
        apply: (game) => { game.player.precisionLens = true; }
    },
    {
        id: 'elite_crown',
        name: 'Corona del Elite',
        icon: '👑',
        desc: 'Élites dropean +oro y +chance rare, pero spawnean más élites.',
        apply: (game) => { game.player.eliteCrown = true; game._eliteCrownActive = true; }
    },
];

window.Game = Game;
