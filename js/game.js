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

    // Seed system for reproducible runs
    seedText: '',
    
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

    // Meta-points tracking for permanent upgrades (v0.1.2)
    bossKillsTotalRun: 0,
    ngTransitionsThisRun: 0,
    runObjectives: [],

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

    newGame(slotId, difficulty, eventsEnabled = true, seedText = '') {
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
        this.seedText = seedText || this.generateRandomSeed();
        this.currentBiome = 'forest';
        this.playTime = 0;
        this.ngPlusLevel = 0;
        this.bossKillsThisRun = 0;
        this.bossKillsTotalRun = 0;
        this.ngTransitionsThisRun = 0;
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
        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel, this.seedText);
        this.applyMetaUpgrades();
        this.initRunObjectives(true);
        // Clear transient systems (prevents projectiles/particles carrying across runs)
        ProjectileManager.clear();
        ParticleSystem.clear();
        FloatingTextSystem.clear();
        SynergySystem.clear();


        // Player starts with NO runes
        // (removed starting rune - player earns them through gameplay)

        this.canvasRect = this.canvas.getBoundingClientRect();

        // Save entry state
        this.saveRoomEntryState();

        // Apply per-room difficulty/events
        this.onEnterRoom(this.dungeon.getCurrentRoom());
    },

    generateRandomSeed() {
        // Generate a readable seed (8 character alphanumeric)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0O, 1I)
        let seed = '';
        for (let i = 0; i < 8; i++) {
            seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return seed;
    },

    copySeedToClipboard() {
        if (!this.seedText) return;
        
        try {
            navigator.clipboard.writeText(this.seedText).then(() => {
                if (window.UI && typeof UI.showToast === 'function') {
                    UI.showToast('📋 Seed copiada: ' + this.seedText);
                }
            });
        } catch (e) {
            // Fallback
            console.log('Seed:', this.seedText);
            if (window.UI && typeof UI.showToast === 'function') {
                UI.showToast('Seed: ' + this.seedText);
            }
        }
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
        this.seedText = saveData.seedText || this.generateRandomSeed();
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

        this.dungeon = new Dungeon(this.currentBiome, this.difficulty, this.ngPlusLevel, this.seedText);
        // Clear transient systems after loading
        ProjectileManager.clear();
        ParticleSystem.clear();
        FloatingTextSystem.clear();
        SynergySystem.clear();

        this.runObjectives = Array.isArray(saveData.runObjectives) ? saveData.runObjectives : [];
        if (!this.runObjectives.length) this.initRunObjectives(true);
        else this.hydrateRunObjectives();

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
            playTime: this.playTime,
            objectives: JSON.parse(JSON.stringify(this.runObjectives || []))
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
        this.runObjectives = this.roomEntryState.objectives ? JSON.parse(JSON.stringify(this.roomEntryState.objectives)) : (this.runObjectives || []);
        this.hydrateRunObjectives();
    },


    rollBiomeMutation(forceId = null) {
        const pool = [
            { id: 'stable', enemyStatMult: 1, enemySpeedMult: 1 },
            { id: 'brutal', enemyStatMult: 1.2, enemySpeedMult: 1 },
            { id: 'haste', enemyStatMult: 1, enemySpeedMult: 1.25 },
            { id: 'swarm', enemyStatMult: 1, enemySpeedMult: 1, enemyCountMult: 1.35 },
            { id: 'volatile', enemyStatMult: 1.05, enemySpeedMult: 1, enemyExplodeOnDeath: true }
        ];

        // Localize name/desc via i18n
        pool.forEach(p => {
            const loc = (window.i18n && typeof i18n.mutator === 'function') ? i18n.mutator(p.id) : null;
            if (loc) { p.name = loc.name; p.desc = loc.desc; }
        });

        let chosen;
        if (forceId) {
            chosen = pool.find(p => p.id === forceId);
        } else {
            // CAMBIO 20: Usar RNG del dungeon para ser determinista por seed
            const rng = (this.dungeon && typeof this.dungeon.rng === 'function')
                ? this.dungeon.rng
                : () => Math.random();
            const idx = Math.floor(rng() * pool.length);
            chosen = pool[idx] || pool[0];
        }

        this.biomeMutation = { ...(chosen || pool[0]) };

        // Apply mutation multipliers for this biome only
        this.mutationCountMult = (chosen.enemyCountMult || 1);

        // Mutation baseline for HP/DMG is provided through Dungeon.getDifficultyMult via biomeMutation.enemyStatMult
        return this.biomeMutation;
    },

    // =========================
    // RUN OBJECTIVES (Mini-metas)
    // =========================
    applyMetaUpgrades() {
        if (!this.player) return;
        try {
            if (window.Meta) {
                const hpBonus = (typeof Meta.getMaxHpBonus === 'function') ? Meta.getMaxHpBonus() : 0;
                if (hpBonus > 0) {
                    this.player.maxHp += hpBonus;
                    this.player.hp += hpBonus;
                }
                const startGold = (typeof Meta.getStartGold === 'function') ? Meta.getStartGold() : 0;
                if (startGold > 0) {
                    this.player.gold += startGold;
                }
                const startPotions = (typeof Meta.getStartPotions === 'function') ? Meta.getStartPotions() : 0;
                if (startPotions > 0) {
                    this.player.potions = Math.min(10, this.player.potions + startPotions);
                }
            }

            // ── SKILL TREE MODIFIERS ──────────────────────────────────────
            if (window.SkillTree) {
                const mods = SkillTree.getModifiers();
                const p = this.player;

                // Damage % (applied as additive multiplier stored on player)
                if (mods.damagePct !== 0) {
                    p.skillTreeDamageMult = 1 + mods.damagePct;
                }

                // Fire rate (fireRate is seconds between shots; lower = faster)
                if (mods.fireRatePct !== 0) {
                    p.skillTreeFireRateMult = 1 + mods.fireRatePct; // 0.98 = 2% faster
                }

                // Projectile speed
                if (mods.projSpeedPct !== 0) {
                    p.projectileSpeed *= (1 + mods.projSpeedPct);
                }

                // Projectile range
                if (mods.projRangePct !== 0) {
                    p.projectileRange *= (1 + mods.projRangePct);
                }

                // Move speed
                if (mods.moveSpeedPct !== 0) {
                    p.speed *= (1 + mods.moveSpeedPct);
                }

                // Crit chance
                if (mods.critChancePct !== 0) {
                    p.skillTreeCritChance = (p.skillTreeCritChance || 0) + mods.critChancePct;
                }

                // Crit damage bonus
                if (mods.critDmgPct !== 0) {
                    p.skillTreeCritDmgBonus = (p.skillTreeCritDmgBonus || 0) + mods.critDmgPct;
                }

                // Max HP (additive on top of base)
                if (mods.maxHpFlat !== 0) {
                    // Already handled by Meta.getMaxHpBonus() above (which reads from SkillTree)
                    // Avoid double-apply; Meta.getMaxHpBonus is already wired to SkillTree
                }

                // Max Mana
                if (mods.maxManaFlat > 0) {
                    p.maxMana += Math.floor(mods.maxManaFlat);
                    p.mana = Math.min(p.mana + Math.floor(mods.maxManaFlat), p.maxMana);
                }

                // HP regen
                if (mods.hpRegenPerSec > 0) {
                    p.skillTreeHpRegen = (p.skillTreeHpRegen || 0) + mods.hpRegenPerSec;
                }

                // Damage reduction
                if (mods.dmgReductionPct > 0) {
                    p.skillTreeDmgReduction = (p.skillTreeDmgReduction || 0) + mods.dmgReductionPct;
                }

                // Lifesteal
                if (mods.lifeStealPct > 0) {
                    p.skillTreeLifesteal = (p.skillTreeLifesteal || 0) + mods.lifeStealPct;
                }

                // Reflect
                if (mods.reflectDmgPct > 0) {
                    p.skillTreeReflect = (p.skillTreeReflect || 0) + mods.reflectDmgPct;
                }

                // Mana cost reduction
                if (mods.manaCostPct !== 0) {
                    p.skillTreeManaCostMult = 1 + mods.manaCostPct; // <1 = cheaper
                }

                // Double shot
                if (mods.doubleShotChancePct > 0) {
                    p.skillTreeDoubleShotChance = (p.skillTreeDoubleShotChance || 0) + mods.doubleShotChancePct;
                }

                // Dash charges (already handled via Meta.getDashCharges)
                // Dash CD reduction
                if (mods.dashCooldownPct !== 0) {
                    p.dashCooldown = Math.max(0.4, p.dashCooldown * (1 + mods.dashCooldownPct));
                }

                // Phoenix passive
                if (mods.phoenixPassive) {
                    p.skillTreePhoenix = true;
                    p.skillTreePhoenixUsed = false;
                }

                // Chain hit bonus (stored for projectile logic)
                if (mods.chainHitPct > 0) {
                    p.skillTreeChainBonus = (p.skillTreeChainBonus || 0) + mods.chainHitPct;
                }
                if (mods.manaRegenPct && mods.manaRegenPct > 0) {
                    p.manaRegenMultiplier = (p.manaRegenMultiplier || 1) * (1 + mods.manaRegenPct);
                }
                if (mods.moveSpeedPct && mods.moveSpeedPct > 0) {
                    p.speed = Math.min(300, p.speed * (1 + mods.moveSpeedPct));
                }
                if (mods.maxManaFlat && mods.maxManaFlat > 0) {
                    p.maxMana = (p.maxMana || 100) + mods.maxManaFlat;
                    p.mana = Math.min(p.mana + mods.maxManaFlat, p.maxMana);
                }
            }
        } catch (e) { console.warn('[applyMetaUpgrades]', e); }
    },

    initRunObjectives(force = false) {
        if (!force && this.runObjectives && this.runObjectives.length) return;
        const pool = ['kills', 'rooms', 'gold', 'time'];
        const picks = Utils.shuffle(pool).slice(0, 3);
        this.runObjectives = picks.map(id => this.buildObjective(id));
    },

    getObjectiveTarget(id) {
        const diff = this.difficulty || 'normal';
        const diffMult = (diff === 'hard') ? 1.2 : (diff === 'demonic') ? 1.4 : 1.0;
        const ngMult = 1 + (this.ngPlusLevel || 0) * 0.15;
        const mult = diffMult * ngMult;

        switch (id) {
            case 'kills':
                return Math.max(15, Math.round(25 * mult));
            case 'rooms':
                return Math.max(2, Math.round(3 * mult));
            case 'gold':
                return Math.max(200, Math.round(300 * mult));
            case 'time': {
                const sec = Math.max(90, Math.round(180 * mult / 30) * 30);
                return sec;
            }
            default:
                return 1;
        }
    },

    getObjectiveDefinition(id, target) {
        const es = (window.i18n && i18n.getCurrentLang) ? (i18n.getCurrentLang() === 'es') : true;
        switch (id) {
            case 'kills':
                return { 
                    name: es ? 'Cazador' : 'Hunter',
                    desc: es ? `Mata ${target} enemigos` : `Kill ${target} enemies`,
                    reward: { type: 'gold', amount: 150, text: es ? '+150 oro' : '+150 gold' }
                };
            case 'rooms':
                return {
                    name: es ? 'Explorador' : 'Explorer',
                    desc: es ? `Limpia ${target} salas` : `Clear ${target} rooms`,
                    reward: { type: 'potion', amount: 1, text: es ? '+1 poción' : '+1 potion' }
                };
            case 'gold':
                return {
                    name: es ? 'Recaudador' : 'Collector',
                    desc: es ? `Reúne ${target} oro` : `Collect ${target} gold`,
                    reward: { type: 'healPercent', amount: 25, text: es ? 'Cura 25% HP' : 'Heal 25% HP' }
                };
            case 'survive':
                return {
                    name: es ? 'Resistencia' : 'Endurance',
                    desc: es ? `Sobrevive ${Utils.formatTime(target)}` : `Survive ${Utils.formatTime(target)}`,
                    reward: { type: 'damage', amount: 4, text: es ? '+4 daño' : '+4 damage' }
                };
        }
        return { name: id, desc: '', reward: { type: 'gold', amount: 0, text: '' } };
    },

    buildObjective(id) {
        const target = this.getObjectiveTarget(id);
        const def = this.getObjectiveDefinition(id, target);
        return { id, target, name: def.name, desc: def.desc, reward: def.reward, completed: false, claimed: false };
    },

    hydrateRunObjectives() {
        if (!Array.isArray(this.runObjectives)) this.runObjectives = [];
        this.runObjectives = this.runObjectives.map(o => {
            const id = (o && o.id) ? o.id : 'kills';
            const target = (o && typeof o.target === 'number') ? o.target : this.getObjectiveTarget(id);
            const def = this.getObjectiveDefinition(id, target);
            return {
                id,
                target,
                name: (o && o.name) ? o.name : def.name,
                desc: (o && o.desc) ? o.desc : def.desc,
                reward: (o && o.reward) ? o.reward : def.reward,
                completed: !!(o && o.completed),
                claimed: !!(o && o.claimed)
            };
        });
    },

    getObjectiveProgress(obj) {
        if (!obj || !this.player) return 0;
        switch (obj.id) {
            case 'kills': return this.player.stats.kills || 0;
            case 'rooms': return this.player.stats.roomsCleared || 0;
            case 'gold': return this.player.gold || 0;
            case 'time': return this.playTime || 0;
            default: return 0;
        }
    },

    updateObjectives() {
        if (!this.runObjectives || !this.runObjectives.length || !this.player) return;
        for (const obj of this.runObjectives) {
            if (!obj) continue;
            if (obj.completed) {
                if (!obj.claimed) this.grantObjectiveReward(obj);
                continue;
            }
            const cur = this.getObjectiveProgress(obj);
            if (cur >= obj.target) {
                obj.completed = true;
                this.grantObjectiveReward(obj);
            }
        }
    },

    grantObjectiveReward(obj) {
        if (!obj || obj.claimed || !this.player) return;
        obj.claimed = true;
        const r = obj.reward || {};
        const p = this.player;

        switch (r.type) {
            case 'gold':
                if (typeof p.addGold === 'function') p.addGold(r.amount || 0);
                else p.gold += (r.amount || 0);
                break;
            case 'potion':
                p.potions = Math.min(10, p.potions + (r.amount || 1));
                break;
            case 'heal_pct':
                p.heal(Math.floor(p.maxHp * (r.amount || 0)));
                break;
            case 'damage':
                p.damage += (r.amount || 0);
                break;
        }

        try {
            if (window.UI && typeof UI.toastMessage === 'function') {
                UI.toastMessage(`OK ${obj.name}: ${r.text || 'Recompensa'}`);
            }
        } catch (e) { }
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

        // Prevent carry-over projectiles from previous rooms from instantly
        // damaging newly spawned enemies/bosses.
        try { if (window.ProjectileManager && typeof ProjectileManager.clear === 'function') ProjectileManager.clear(); } catch (e) { }

        // Safety: Invincibility on room entry to prevent unfair hits
        if (this.player) {
            this.player.iFrameTimer = 1.5;

            // Prevent accidental "auto-fire" carry-over into a fresh room.
            // Some browsers keep mouseDown true across focus changes / room transitions.
            this.player._shootLockTimer = Math.max(this.player._shootLockTimer || 0, 0.25);
            this.player.fireTimer = Math.max(this.player.fireTimer || 0, 0.10);

            // Reset per-room counters
            this.player._healTotemUsesThisRoom = 0;
        }

        // Give newly-entered rooms a short grace period where enemies/bosses
        // cannot be damaged (prevents "spawned already hurt" from passives/events).
        try {
            if (room && Array.isArray(room.enemies)) {
                for (const e of room.enemies) {
                    if (!e || !e.active) continue;
                    e.spawnInvuln = Math.max(e.spawnInvuln || 0, (e.isBoss || e.bossType) ? 0.8 : 0.6);
                    // Also hard-reset HP once on entry to kill any lingering tick damage
                    if (typeof e.maxHp === 'number') e.hp = e.maxHp;
                }
            }
        } catch (e) { }

        // If this room was already cleared, never re-activate enemies when backtracking.
        try {
            if (room._clearedOnce && Array.isArray(room.enemies)) {
                room.enemies.forEach(e => { if (e) e.active = false; });
            }
        } catch (e) { }

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
        FloatingTextSystem.update(dt);
        
        // Update synergies when runes change
        const newSynergies = SynergySystem.detectSynergies(this.player);
        if (newSynergies.length > 0) {
            SynergySystem.showNewSynergies(this.player);
            try {
                if (window.UI && !UI.synergyAlwaysVisible) {
                    UI.synergyPanelVisible = true; // auto-open on activation (Mode B)
                }
            } catch (e) { }

        }
        SynergySystem.applyBonuses(this.player);
        
        this.updateObjectives();

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
                    if (this.player) this.player._recyclesDoneThisShop = 0;
                    UI.showShop(result.shop);
                } else if (result.type === 'forge') {
                    this._openForgeTerminal(result.forge);
                } else if (result.type === 'event') {
                    if (result.event === 'shrine') {
                        UI.showShrineChoice();
                    } else if (result.event === 'campfire') {
                        UI.showCampfireChoice();
                    } else if (result.event === 'pact') {
                        UI.showPactChoice();
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
        FloatingTextSystem.draw(this.ctx);

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
        return ProjectileManager.spawn(x, y, angle, damage, finalSpeed, range, owner, effects, runeData);
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
        const baseIdx = (window.BiomeOrder) ? Math.max(0, BiomeOrder.indexOf(biomeId)) : 0;
        const loops = Math.max(0, this.ngPlusLevel || 0);
        const biomeIdx = baseIdx + (window.BiomeOrder ? BiomeOrder.length * loops : 0);

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
        const baseIdx = (window.BiomeOrder) ? Math.max(0, BiomeOrder.indexOf(biomeId)) : 0;
        const loops = Math.max(0, this.ngPlusLevel || 0);
        const biomeIdx = baseIdx + (window.BiomeOrder ? BiomeOrder.length * loops : 0);
        const cost = 250 + biomeIdx * 80 + (this.ngPlusLevel || 0) * 40;

        const ev = {
            kind: 'forge',
            x: Utils.clamp(room.bounds.x + room.bounds.width - 180, room.bounds.x + 80, room.bounds.x + room.bounds.width - 180),
            y: Utils.clamp(room.bounds.y + room.bounds.height / 2 - 32, room.bounds.y + 80, room.bounds.y + room.bounds.height - 120),
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

        // Rune: Vampírico (heal % max HP per kill) - only if player got the last hit
        try {
            if (this.player && enemy && enemy._lastHitOwner === 'player') {
                let healPct = 0;
                for (const r of (this.player.runes || [])) {
                    if (r && r.id === 'vampiric' && typeof r.onKillHealPct === 'number') {
                        healPct = Math.max(healPct, r.onKillHealPct);
                    }
                }
                if (healPct > 0) {
                    const heal = Math.max(1, Math.floor((this.player.maxHp || 0) * healPct));
                    this.player.hp = Math.min(this.player.maxHp, (this.player.hp || 0) + heal);
                    if (window.UI && typeof UI.toast === 'function') {
                        UI.toast(`🩸 +${heal} HP`, 900);
                    }
                }
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

        // Boss reward flow
        if (enemy && (enemy.isBoss || enemy.bossType)) {
            try { this.onBossKilled(enemy); } catch (e) { console.error(e); }
        }

        this.shake(3);
    },

    // NEW: Handler for boss death - gives legendary reward and NG+ portal
    onBossKilled(boss) {
        // Run progression: each boss kill makes future rooms harder
        this.bossKillsThisRun = (this.bossKillsThisRun || 0) + 1;
        this.bossKillsTotalRun = (this.bossKillsTotalRun || 0) + 1;

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

        // Rune: Vampírico (heal % max HP per kill) - bosses count too
        try {
            if (this.player && boss && boss._lastHitOwner === 'player') {
                let healPct = 0;
                for (const r of (this.player.runes || [])) {
                    if (r && r.id === 'vampiric' && typeof r.onKillHealPct === 'number') {
                        healPct = Math.max(healPct, r.onKillHealPct);
                    }
                }
                if (healPct > 0) {
                    const heal = Math.max(1, Math.floor((this.player.maxHp || 0) * healPct));
                    this.player.hp = Math.min(this.player.maxHp, (this.player.hp || 0) + heal);
                    if (window.UI && typeof UI.toast === 'function') {
                        UI.toast(`🩸 +${heal} HP`, 900);
                    }
                }
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
            // Reward screen expects reward objects directly (so UI + selection work)
            const runes = [
                legendaryRune ? { ...legendaryRune, type: 'rune', rarity: 'legendary' } : null,
                epicRune ? { ...epicRune, type: 'rune', rarity: 'epic' } : null,
                rareRune ? { ...rareRune, type: 'rune', rarity: 'rare' } : null,
            ].filter(Boolean);
            const rewards = runes;
            try {
                UI.showRewardScreen(rewards);
                this.paused = true;
            } catch (e) {
                console.error('showRewardScreen failed', e);
                this.paused = false;
            }
            // Safety: never freeze the run if the reward screen can't render
            setTimeout(() => {
                const rs = document.getElementById('reward-screen');
                if (this.paused && (!rs || (rs.style.display !== 'block' && rs.style.display !== 'flex'))) this.paused = false;
            }, 250);
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
        // chestLoot can be a string rarity, or an object with {rarity, lootSeed, ...}
        const rarity = typeof chestLoot === 'string' ? chestLoot : (chestLoot?.rarity || 'common');
        const forceLegendary = !!(typeof chestLoot === 'object' && chestLoot?.forceLegendary);
        const bossChest = !!(typeof chestLoot === 'object' && chestLoot?.bossChest);
        const lootSeed = (typeof chestLoot === 'object' && chestLoot?.lootSeed) ? chestLoot.lootSeed : null;

        // Create seeded RNG if we have a loot seed
        const rng = lootSeed ? Utils.createSeededRNG(lootSeed) : null;

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

        // Use seeded RNG for rune/item selection if available
        let runeOption, itemOption;
        
        if (rng) {
            // Deterministic loot
            runeOption = empty ? empty : (forceLegendary ? getRandomRuneSeeded('legendary', rng) : getWeightedRandomRuneSeeded(tunedRarity, rng));
            itemOption = forceLegendary ? ItemDatabase.getRandomItemSeeded('legendary', rng) : ItemDatabase.getRandomItemSeeded(tunedRarity, rng);
        } else {
            // Non-deterministic (fallback)
            runeOption = empty ? empty : (forceLegendary ? getRandomRune('legendary') : getWeightedRandomRune(tunedRarity));
            itemOption = forceLegendary ? ItemDatabase.getRandomItem('legendary') : ItemDatabase.getRandomItem(tunedRarity);
        }


        // Cap filters: avoid offering upgrades that are already maxed (fire rate cap x2, Void Touch max 2)
        const playerRef = this.player;
        const pickValidRune = (rar, attempts = 20) => {
            for (let i = 0; i < attempts; i++) {
                const r = rng
                    ? (forceLegendary ? getRandomRuneSeeded('legendary', rng) : getWeightedRandomRuneSeeded(rar, rng))
                    : (forceLegendary ? getRandomRune('legendary') : getWeightedRandomRune(rar));
                if (!r) continue;
                if (!Utils.shouldExcludeRune(r, playerRef)) return r;
            }
            return null;
        };
        const pickValidItem = (rar, attempts = 20) => {
            for (let i = 0; i < attempts; i++) {
                const it = rng
                    ? (forceLegendary ? ItemDatabase.getRandomItemSeeded('legendary', rng) : ItemDatabase.getRandomItemSeeded(rar, rng))
                    : (forceLegendary ? ItemDatabase.getRandomItem('legendary') : ItemDatabase.getRandomItem(rar));
                if (!it) continue;
                if (!Utils.shouldExcludeItem(it, playerRef)) return it;
            }
            return null;
        };

        if (runeOption && Utils.shouldExcludeRune(runeOption, playerRef)) {
            runeOption = pickValidRune(tunedRarity);
        }
        if (itemOption && Utils.shouldExcludeItem(itemOption, playerRef)) {
            itemOption = pickValidItem(tunedRarity);
        }
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
        // IMPORTANT: Use truthy check so Item instances with 0-value properties
        // (e.g. storm_ring has fireRateBonus=0) are NOT misidentified as runes.
        const isRune = item.type === 'rune' || !!item.effect ||
            !!(item.extraProjectiles) ||
            !!(item.manaBonus) ||
            !!(item.fireRateBonus) ||
            !!(item.damageMultiplier) ||
            !!(item.manaRegen) ||
            !!(item.pierceCount) ||
            !!(item.lifeSteal) ||
            !!(item.chainCount) ||
            !!(item.critChance) ||
            !!(item.rangeMultiplier) ||
            !!(item.bossMultiplier);

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
        const isSetPiece = !!(item && item.setId);

        // Healing
        if (item.heal && item.heal > 0) {
            const healAmount = item.heal >= 999 ? this.player.maxHp : item.heal;
            this.player.heal(healAmount);
            ParticleSystem.burst(this.player.centerX, this.player.centerY, 10, {
                color: '#44ff88', life: 0.5, size: 3, speed: 2
            });
            appliedSomething = true;
        }

        // Mana restore (e.g., mana potion)
        if (item.manaRestore && item.manaRestore > 0) {
            try {
                this.player.mana = Math.min(this.player.maxMana, this.player.mana + item.manaRestore);
                ParticleSystem.burst(this.player.centerX, this.player.centerY, 10, {
                    color: '#4fc3f7', life: 0.5, size: 3, speed: 2
                });
                appliedSomething = true;
            } catch (e) { }
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

        // Speed bonus (permanent, capped at +50% base = 270)
        if (item.speedBonus && item.speedBonus > 0) {
            this.player.speed = Math.min(270, this.player.speed + item.speedBonus);
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

        // Set pieces may have no direct stats (bonuses come from the set itself).
        // Still, we must record the piece and trigger set bonus evaluation.
        if (isSetPiece) {
            this.player.addPassiveItem(item);
            appliedSomething = true;
        }

        if (appliedSomething) {
            // Apply set thresholds (2/3, 3/3)
            try { this.applySetBonuses(); } catch (e) { }
            AudioManager.play('pickup');
        }

        // Set pieces can be "statless" (their power comes from the set bonuses).
        // Ensure they are tracked and trigger set bonus evaluation.
        if (!appliedSomething && isSetPiece) {
            this.player.addPassiveItem(item);
            try { this.applySetBonuses(); } catch (e) { }
            try { AudioManager.play('pickup'); } catch (e) { }
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
        // IMPORTANT: Use truthy check so Item instances with 0-value properties are NOT misidentified as runes.
        const isRune = reward.type === 'rune' || !!reward.effect ||
            !!(reward.extraProjectiles) ||
            !!(reward.manaBonus) ||
            !!(reward.fireRateBonus) ||
            !!(reward.damageMultiplier) ||
            !!(reward.manaRegen) ||
            !!(reward.pierceCount) ||
            !!(reward.lifeSteal) ||
            !!(reward.chainCount) ||
            !!(reward.critChance) ||
            !!(reward.rangeMultiplier) ||
            !!(reward.bossMultiplier);

        if (isRune) {
            UI.handleRuneChoice({ ...reward }, 'boss');
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
        this.ngTransitionsThisRun = (this.ngTransitionsThisRun || 0) + 1;
        // BUG FIX: Do NOT reset bossKillsThisRun to 0 on NG+.
        // This preserves enemy HP/damage scaling between loops so enemies
        // keep getting harder with each NG+ transition instead of resetting.
        // bossKillsThisRun is intentionally kept as-is here.

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
            { id: 'power' },
            { id: 'swift' },
            { id: 'sustain' },
            { id: 'rich' }
        ];
        blessings.forEach(b => {
            const loc = (window.i18n && typeof i18n.blessing === 'function') ? i18n.blessing(b.id) : null;
            if (loc) { b.name = loc.name; b.desc = loc.desc; }
        });
        const curses = [
            { id: 'fragile' },
            { id: 'wrath' },
            { id: 'swarm' },
            { id: 'sniper' }
        ];
        curses.forEach(c => {
            const loc = (window.i18n && typeof i18n.curse === 'function') ? i18n.curse(c.id) : null;
            if (loc) { c.name = loc.name; c.desc = loc.desc; }
        });

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

                // Permanent currency: "Esencia" (v0.1.2)
                // Fórmula: +1 por cada 2 bosses (acumulado en la run) +3 por cada salto a NG+
                if (typeof Meta.addEssence === 'function') {
                    const bosses = Math.max(0, Math.floor(this.bossKillsTotalRun || 0));
                    const ng = Math.max(0, Math.floor(this.ngTransitionsThisRun || 0));
                    const earned = Math.max(bosses >= 1 ? 1 : 0, Math.floor(bosses / 2)) + (ng * 3);
                    if (earned > 0) {
                        Meta.addEssence(earned);
                        // Store for UI (death screen)
                        this._lastEssenceEarned = earned;
                    } else {
                        this._lastEssenceEarned = 0;
                    }
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
    },

    // ── FORGE TERMINAL (standalone, no dependency on ui.js) ───────────────
    _openForgeTerminal(ev) {
        if (!ev || !this.player) return;
        const player = this.player;
        const baseCost = ev.cost || 0;
        if (baseCost > 0 && (player.gold || 0) < baseCost) {
            if (window.UI && typeof UI.toast === 'function') UI.toast(`Necesitas ${baseCost} 💰`, 'warn');
            return;
        }
        const emptyRunes = (player.runes || []).map((r, i) => ({ r, i })).filter(({ r }) => r && r.id === 'empty_rune' && !r.programmed);
        if (emptyRunes.length === 0) { this._showForgeNoRuneMsg(); return; }
        this.paused = true;

        const lang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : 'en';
        const isEs = lang === 'es';

        const T = {
            title:       isEs ? '⚒ FORJA — Programar Runa'             : '⚒ FORGE — Program Rune',
            grimoire:    isEs ? '📖 Grimorio de las Runas'              : '📖 Grimoire of Runes',
            hideGrim:    isEs ? '📖 Ocultar Grimorio'                   : '📖 Hide Grimoire',
            runeLabel:   isEs ? 'Runa a programar:'                     : 'Rune to program:',
            templates:   isEs ? 'Plantillas:'                           : 'Templates:',
            placeholder: isEs ? 'OnCast:\n  SpawnProjectile damage=4 count=1 spread=12' : 'OnCast:\n  SpawnProjectile damage=4 count=1 spread=12',
            cancel:      isEs ? 'Cancelar'                              : 'Cancel',
            program:     isEs ? 'Programar'                             : 'Program',
            free:        isEs ? 'GRATIS'                                : 'FREE',
            costLabel:   isEs ? 'Costo:'                                : 'Cost:',
            scriptCost:  isEs ? 'Costo del script:'                     : 'Script cost:',
            totalCost:   isEs ? 'Total:'                                : 'Total:',
            validOk:     isEs ? '✓ Válido'                              : '✓ Valid',
            errEmpty:    isEs ? '✗ El script no puede estar vacío.'     : '✗ Script cannot be empty.',
            errGold:     (n) => isEs ? `✗ Oro insuficiente (necesitás ${n})` : `✗ Not enough gold (need ${n})`,
            successMsg:  isEs ? '✓ ¡Runa programada!'                   : '✓ Rune programmed!',
            runeSlot:    (idx, slot) => isEs ? `Runa ${idx+1} (slot ${slot+1})` : `Rune ${idx+1} (slot ${slot+1})`,
            cpu:         isEs ? 'CPU'                                   : 'CPU',
            lines:       isEs ? 'Líneas'                                : 'Lines',
        };

        // --- Inject styles ---
        if (!document.getElementById('_forge-styles')) {
            const style = document.createElement('style');
            style.id = '_forge-styles';
            style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Share+Tech+Mono&display=swap');

#_forge-modal {
    position:fixed;inset:0;z-index:9999;
    background: radial-gradient(ellipse at 50% 30%, rgba(10,20,40,0.97) 0%, rgba(4,8,16,0.99) 100%);
    display:flex;align-items:center;justify-content:center;
    animation: forge-fadein 0.25s ease;
}
@keyframes forge-fadein { from{opacity:0} to{opacity:1} }

.forge-panel {
    background: linear-gradient(160deg, #0b1421 0%, #080f1c 100%);
    border: 1px solid rgba(80,160,255,0.3);
    border-radius: 16px;
    padding: 0;
    width: min(1140px, 96vw);
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 60px rgba(60,120,255,0.15), 0 0 120px rgba(60,80,200,0.08), inset 0 1px 0 rgba(100,180,255,0.1);
    animation: forge-slidein 0.3s cubic-bezier(0.34,1.56,0.64,1);
    font-family: 'Share Tech Mono', monospace;
}
@keyframes forge-slidein { from{transform:translateY(20px) scale(0.97);opacity:0} to{transform:none;opacity:1} }

.forge-header {
    padding: 20px 24px 16px;
    background: linear-gradient(90deg, rgba(30,60,120,0.4) 0%, rgba(10,20,50,0.2) 100%);
    border-bottom: 1px solid rgba(80,140,255,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.forge-title {
    font-family: 'Cinzel', serif;
    font-size: 1.1em;
    font-weight: 700;
    color: #7ec8ff;
    letter-spacing: 0.08em;
    text-shadow: 0 0 20px rgba(100,180,255,0.5);
    margin: 0;
}
.forge-cost-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85em;
}
.forge-cost-item {
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid;
    font-size: 0.82em;
    letter-spacing: 0.05em;
}
.forge-cost-base { color: #fa4; border-color: rgba(255,170,60,0.4); background: rgba(255,140,20,0.08); }
.forge-cost-script { color: #a8d8ff; border-color: rgba(100,180,255,0.3); background: rgba(60,120,255,0.06); }
.forge-cost-total { color: #4fdb88; border-color: rgba(60,200,120,0.4); background: rgba(40,180,100,0.1); font-weight:700; }

.forge-body {
    padding: 18px 24px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: row;
    gap: 18px;
    min-height: 0;
}
.forge-left {
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: 1;
    min-width: 0;
    overflow-y: auto;
}
.forge-left::-webkit-scrollbar { width:5px; }
.forge-left::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
.forge-left::-webkit-scrollbar-thumb { background: rgba(80,140,255,0.3); border-radius:3px; }

.forge-row-label {
    font-size: 0.78em;
    color: #6a8aaa;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.forge-select {
    background: rgba(15,30,60,0.8);
    color: #a0c8f0;
    border: 1px solid rgba(80,140,255,0.35);
    border-radius: 8px;
    padding: 6px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.85em;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.forge-select:focus { border-color: rgba(100,180,255,0.7); box-shadow: 0 0 0 2px rgba(80,160,255,0.15); }

.forge-templates {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    align-items: center;
}
.forge-tpl-btn {
    background: rgba(20,40,80,0.6);
    color: #7ab8e8;
    border: 1px solid rgba(80,140,220,0.3);
    border-radius: 20px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 0.75em;
    font-family: 'Share Tech Mono', monospace;
    transition: all 0.18s;
    letter-spacing: 0.03em;
}
.forge-tpl-btn:hover { background: rgba(40,80,160,0.5); border-color: rgba(100,180,255,0.6); color: #bde0ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(60,120,255,0.2); }

.forge-editor {
    width: 100%;
    min-height: 140px;
    background: rgba(6,12,24,0.9);
    color: #64d0ff;
    border: 1px solid rgba(60,120,200,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 0.88em;
    font-family: 'Share Tech Mono', monospace;
    resize: vertical;
    box-sizing: border-box;
    outline: none;
    line-height: 1.6;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.forge-editor:focus { border-color: rgba(80,160,255,0.6); box-shadow: 0 0 0 3px rgba(60,120,255,0.1), inset 0 0 20px rgba(60,100,200,0.05); }
.forge-editor::placeholder { color: rgba(80,130,180,0.4); }

.forge-status {
    font-size: 0.78em;
    min-height: 28px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(6,12,24,0.6);
    border: 1px solid rgba(40,80,140,0.2);
    transition: all 0.2s;
    letter-spacing: 0.03em;
}
.forge-status.ok { color: #4fdb88; border-color: rgba(60,200,120,0.25); background: rgba(20,60,40,0.3); }
.forge-status.err { color: #ff6b6b; border-color: rgba(200,60,60,0.25); background: rgba(60,20,20,0.3); }

/* Grimoire - right column */
.forge-grimoire-toggle {
    display: none; /* hidden - grimoire is always visible as right panel */
}

.forge-grimoire-panel {
    background: rgba(6,14,30,0.95);
    border: 1px solid rgba(60,110,200,0.25);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 360px;
    min-width: 300px;
    max-width: 400px;
    flex-shrink: 0;
    align-self: stretch;
    animation: forge-grim-reveal 0.22s ease;
}
.forge-grimoire-panel.visible { display: flex; }
@keyframes forge-grim-reveal { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }

.forge-grim-header {
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(60,100,200,0.2);
    background: linear-gradient(90deg, rgba(20,40,80,0.5) 0%, transparent 100%);
}
.forge-grim-title {
    font-family: 'Cinzel', serif;
    font-size: 0.95em;
    color: #90c8ff;
    letter-spacing: 0.1em;
    margin: 0 0 10px;
    text-shadow: 0 0 15px rgba(100,180,255,0.4);
}
.forge-grim-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}
.forge-grim-tab {
    background: rgba(15,30,60,0.6);
    color: #6a96c0;
    border: 1px solid rgba(60,100,180,0.25);
    border-radius: 20px;
    padding: 4px 14px;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75em;
    transition: all 0.18s;
    letter-spacing: 0.04em;
}
.forge-grim-tab:hover { background: rgba(30,60,120,0.5); color: #9ac4e8; }
.forge-grim-tab.active { background: linear-gradient(135deg, rgba(40,80,180,0.6), rgba(20,50,120,0.4)); color: #c0e0ff; border-color: rgba(80,150,255,0.4); box-shadow: 0 2px 8px rgba(60,120,255,0.15); }

.forge-grim-body { flex: 1; overflow-y: auto; padding: 16px 18px; min-height: 0; }
.forge-grim-body::-webkit-scrollbar { width:4px; }
.forge-grim-body::-webkit-scrollbar-thumb { background: rgba(80,140,255,0.25); border-radius:2px; }

.forge-grim-page { display:none; }
.forge-grim-page.active { display:block; animation: forge-grim-reveal 0.18s ease; }

.grim-section { margin-bottom: 18px; }
.grim-section-title {
    font-family: 'Cinzel', serif;
    font-size: 0.8em;
    color: #7eb8e8;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(60,100,180,0.2);
}
.grim-text { font-size: 0.78em; color: #8aaac8; line-height: 1.7; }
.grim-text b { color: #a8d0f0; }
.grim-code {
    background: rgba(4,10,22,0.8);
    border: 1px solid rgba(40,80,160,0.3);
    border-radius: 7px;
    padding: 10px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.76em;
    color: #64d0ff;
    white-space: pre;
    margin: 8px 0;
    line-height: 1.6;
    overflow-x: auto;
}
.grim-event-card, .grim-action-card {
    background: rgba(10,20,44,0.7);
    border: 1px solid rgba(50,90,180,0.2);
    border-radius: 9px;
    padding: 10px 14px;
    margin-bottom: 10px;
    transition: border-color 0.2s;
}
.grim-event-card:hover, .grim-action-card:hover { border-color: rgba(80,140,255,0.35); }
.grim-card-title { font-size: 0.82em; color: #a0d4ff; margin-bottom: 4px; letter-spacing: 0.05em; }
.grim-card-desc { font-size: 0.75em; color: #7090b0; line-height:1.5; }
.grim-card-params { font-size: 0.7em; color: #506880; margin-top: 5px; font-family: 'Share Tech Mono', monospace; }
.grim-tip {
    background: rgba(20,50,40,0.4);
    border-left: 3px solid rgba(60,180,120,0.5);
    border-radius: 0 8px 8px 0;
    padding: 8px 12px;
    margin: 8px 0;
    font-size: 0.75em;
    color: #7abda0;
    line-height: 1.6;
}
.grim-apply-btn {
    background: linear-gradient(135deg, rgba(20,60,40,0.7), rgba(10,40,25,0.7));
    color: #4fdb88;
    border: 1px solid rgba(60,180,100,0.4);
    border-radius: 6px;
    padding: 3px 10px;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72em;
    letter-spacing: 0.05em;
    transition: all 0.18s;
    flex-shrink: 0;
}
.grim-apply-btn:hover { background: linear-gradient(135deg, rgba(30,90,55,0.9), rgba(15,60,35,0.9)); border-color: rgba(80,220,120,0.6); color: #6fffa8; transform: scale(1.05); }

.grim-link-btn {
    background: rgba(15,30,70,0.5);
    color: #7ab4e0;
    border: 1px solid rgba(60,100,200,0.25);
    border-radius: 8px;
    padding: 8px 14px;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.77em;
    width: 100%;
    text-align: left;
    margin-bottom: 6px;
    transition: all 0.18s;
    display: block;
}
.grim-link-btn:hover { background: rgba(30,60,140,0.4); border-color: rgba(80,150,255,0.4); color: #a0d0ff; transform: translateX(3px); }

/* Footer */
.forge-footer {
    padding: 14px 24px 18px;
    border-top: 1px solid rgba(60,100,180,0.15);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
.forge-btn {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.85em;
    border-radius: 9px;
    padding: 9px 22px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.05em;
    border: 1px solid;
}
.forge-btn-cancel {
    background: rgba(40,15,15,0.5);
    color: #d08080;
    border-color: rgba(180,60,60,0.35);
}
.forge-btn-cancel:hover { background: rgba(80,20,20,0.5); border-color: rgba(220,80,80,0.5); color: #ffaaaa; transform: translateY(-1px); }
.forge-btn-program {
    background: linear-gradient(135deg, rgba(20,70,40,0.8), rgba(10,50,30,0.8));
    color: #4fdb88;
    border-color: rgba(60,180,100,0.5);
    box-shadow: 0 4px 16px rgba(40,180,90,0.15);
}
.forge-btn-program:hover { background: linear-gradient(135deg, rgba(30,100,55,0.9), rgba(15,70,40,0.9)); border-color: rgba(80,220,120,0.6); color: #6fffa8; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(40,200,100,0.25); }
.forge-btn-program:active { transform: translateY(0); }

/* Rune orbit animation in panel */
.forge-rune-orb {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle, #a0e0ff, #4080ff);
    box-shadow: 0 0 8px #60b0ff;
    display: inline-block;
    margin-right: 6px;
    animation: forge-pulse 2s ease-in-out infinite;
}
@keyframes forge-pulse {
    0%,100% { opacity:0.6; transform:scale(0.9); }
    50% { opacity:1; transform:scale(1.15); }
}
            `;
            document.head.appendChild(style);
        }

        const modal = document.createElement('div');
        modal.id = '_forge-modal';

        const panel = document.createElement('div');
        panel.className = 'forge-panel';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'forge-header';

        const titleEl = document.createElement('h2');
        titleEl.className = 'forge-title';
        titleEl.innerHTML = `<span class="forge-rune-orb"></span>${T.title}`;

        const costBadge = document.createElement('div');
        costBadge.className = 'forge-cost-badge';

        const baseCostEl = document.createElement('span');
        baseCostEl.className = 'forge-cost-item forge-cost-base';
        baseCostEl.textContent = baseCost > 0 ? `${T.costLabel} ${baseCost} 💰` : T.free;

        const scriptCostEl = document.createElement('span');
        scriptCostEl.className = 'forge-cost-item forge-cost-script';
        scriptCostEl.textContent = `${T.scriptCost} 0 💰`;

        const totalCostEl = document.createElement('span');
        totalCostEl.className = 'forge-cost-item forge-cost-total';
        totalCostEl.textContent = `${T.totalCost} ${baseCost} 💰`;

        costBadge.append(baseCostEl, scriptCostEl, totalCostEl);
        header.append(titleEl, costBadge);

        // --- Body ---
        const body = document.createElement('div');
        body.className = 'forge-body';

        // LEFT COLUMN
        const leftCol = document.createElement('div');
        leftCol.className = 'forge-left';

        // Rune selector
        let selectedRuneIdx = emptyRunes[0].i;
        if (emptyRunes.length > 1) {
            const selRow = document.createElement('div');
            const selLabel = document.createElement('div');
            selLabel.className = 'forge-row-label';
            selLabel.textContent = T.runeLabel;
            const sel = document.createElement('select');
            sel.className = 'forge-select';
            emptyRunes.forEach(({ i }, idx) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = T.runeSlot(idx, i);
                sel.append(opt);
            });
            sel.addEventListener('change', () => { selectedRuneIdx = parseInt(sel.value); });
            selRow.append(selLabel, sel);
            leftCol.append(selRow);
        }

        // Templates
        const templates = (window.RuneScript && RuneScript.templates) ? RuneScript.templates : {};
        if (Object.keys(templates).length > 0) {
            const tplRow = document.createElement('div');
            const tplLabel = document.createElement('div');
            tplLabel.className = 'forge-row-label';
            tplLabel.textContent = T.templates;
            const tplBtns = document.createElement('div');
            tplBtns.className = 'forge-templates';
            Object.entries(templates).forEach(([key, code]) => {
                const btn = document.createElement('button');
                btn.className = 'forge-tpl-btn';
                btn.textContent = key;
                btn.addEventListener('click', () => { editor.value = code; updateStatus(); });
                tplBtns.append(btn);
            });
            tplRow.append(tplLabel, tplBtns);
            leftCol.append(tplRow);
        }

        // Editor
        const editor = document.createElement('textarea');
        editor.className = 'forge-editor';
        editor.style.flex = '1';
        editor.style.minHeight = '200px';
        editor.placeholder = T.placeholder;
        leftCol.append(editor);

        // Status bar
        const status = document.createElement('div');
        status.className = 'forge-status';
        leftCol.append(status);

        function updateStatus() {
            const src = editor.value;
            if (!src.trim() || !window.RuneScript) { status.textContent = ''; status.className = 'forge-status'; updateCostDisplay(0); return; }
            const r = RuneScript.compile(src);
            if (r.ok) {
                const a = RuneScript.analyze(src);
                if (a.ok) {
                    const totalCpu = Object.values(a.perEventCpu || {}).reduce((s,v)=>s+v, 0);
                    status.className = 'forge-status ok';
                    status.textContent = `${T.validOk} | ${T.cpu}: ${totalCpu}/${RuneScript.limits.MAX_CPU_PER_EVENT} | ${T.lines}: ${a.lines}/${RuneScript.limits.MAX_LINES}`;
                    updateCostDisplay(a.extraCost || 0);
                } else {
                    status.className = 'forge-status ok';
                    status.textContent = T.validOk;
                    updateCostDisplay(0);
                }
            } else {
                status.className = 'forge-status err';
                status.textContent = `✗ ${r.error}`;
                updateCostDisplay(0);
            }
        }

        function updateCostDisplay(extraCost) {
            const total = baseCost + extraCost;
            scriptCostEl.textContent = `${T.scriptCost} ${extraCost} 💰`;
            totalCostEl.textContent = `${T.totalCost} ${total} 💰`;
            updateBtnCost(total);
        }

        editor.addEventListener('input', updateStatus);

        // Finalize left column
        body.append(leftCol);

        // RIGHT COLUMN - Grimoire (always visible)
        const grimPanel = document.createElement('div');
        grimPanel.className = 'forge-grimoire-panel visible';

        const grimHeader = document.createElement('div');
        grimHeader.className = 'forge-grim-header';

        const grimTitle = document.createElement('div');
        grimTitle.className = 'forge-grim-title';
        grimTitle.textContent = isEs ? '✦ Grimorio de las Runas ✦' : '✦ Grimoire of Runes ✦';

        const MAX_LINES = (window.RuneScript && RuneScript.limits) ? RuneScript.limits.MAX_LINES : 16;
        const MAX_CPU = (window.RuneScript && RuneScript.limits) ? RuneScript.limits.MAX_CPU_PER_EVENT : 30;
        const MAX_REPEAT = (window.RuneScript && RuneScript.limits) ? RuneScript.limits.MAX_REPEAT : 6;
        const MAX_SPAWNS = (window.RuneScript && RuneScript.limits) ? RuneScript.limits.MAX_SPAWNS_PER_SEC : 8;

        const grimTabsEl = document.createElement('div');
        grimTabsEl.className = 'forge-grim-tabs';

        const grimPages = isEs
            ? [
                { key:'index',   label:'Índice' },
                { key:'events',  label:'Eventos' },
                { key:'actions', label:'Acciones' },
                { key:'rules',   label:'Reglas' },
                { key:'examples',label:'Ejemplos' },
              ]
            : [
                { key:'index',   label:'Index' },
                { key:'events',  label:'Events' },
                { key:'actions', label:'Actions' },
                { key:'rules',   label:'Rules' },
                { key:'examples',label:'Examples' },
              ];

        grimHeader.append(grimTitle, grimTabsEl);

        const grimBody = document.createElement('div');
        grimBody.className = 'forge-grim-body';

        grimPanel.append(grimHeader, grimBody);
        body.append(grimPanel);

        // Build grimoire pages
        function makeGrimPage(key, html) {
            const page = document.createElement('div');
            page.className = 'forge-grim-page';
            page.dataset.page = key;
            page.innerHTML = html;
            grimBody.append(page);
            return page;
        }

        const caps = (window.RuneScript && RuneScript.caps) ? RuneScript.caps : {};
        function capLine(action) {
            const c = caps[action]; if (!c) return '';
            return Object.entries(c).map(([k,r]) => r.enum ? `${k}=[${r.enum.join('|')}]` : `${k}=${r.min}..${r.max}`).join(' · ');
        }

        if (isEs) {
            // INDEX
            makeGrimPage('index', `
<div class="grim-section">
    <div class="grim-section-title">¿Cómo funciona la Forja?</div>
    <div class="grim-text">La Forja te deja escribir un pequeño <b>guión mágico</b> que tu runa ejecutará durante el combate.<br>Pensalo como instrucciones: <b>"cuando pase X, hacé Y"</b>.</div>
    <div class="grim-tip">💡 Empezá por un <b>Evento</b> (¿cuándo?), luego agregá <b>Acciones</b> (¿qué hace?).</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Pasos rápidos</div>
    <div class="grim-code">1. Elegí un evento:  OnCast:
2. Escribí una acción indentada:
     SpawnProjectile damage=8 count=2
3. Hacé clic en "Programar" ✓</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Secciones</div>
    <button class="grim-link-btn" data-go="events">📌 Eventos — ¿cuándo se activa?</button>
    <button class="grim-link-btn" data-go="actions">🧩 Acciones — ¿qué hace?</button>
    <button class="grim-link-btn" data-go="rules">🛡 Reglas — límites y condiciones</button>
    <button class="grim-link-btn" data-go="examples">✨ Ejemplos — plantillas listas</button>
</div>`);

            // EVENTS
            makeGrimPage('events', `
<div class="grim-section">
    <div class="grim-section-title">Eventos disponibles</div>
    <div class="grim-text">Cada evento se escribe <b>sin indentación</b>, seguido de dos puntos. Las acciones van <b>indentadas</b> debajo (con 2 espacios o Tab).</div>
</div>
${[
    { id:'OnCast', ico:'⚡', desc: isEs ? 'Cuando disparás. Ideal para proyectiles extra.' : 'On shoot.', tip: isEs ? 'Más efectivo para daño directo' : '' },
    { id:'OnHit',  ico:'💥', desc: isEs ? 'Cuando tu proyectil golpea un enemigo.' : 'On hit.', tip: isEs ? 'Cuesta más, muy poderoso.' : '' },
    { id:'OnKill', ico:'💀', desc: isEs ? 'Cuando matás un enemigo.' : 'On kill.', tip: '' },
    { id:'OnRoomClear', ico:'🏆', desc: isEs ? 'Al limpiar toda la sala. Bueno para escudos y curas.' : 'Room cleared.', tip: '' },
    { id:'OnDamageTaken', ico:'🩹', desc: isEs ? 'Cuando recibís daño. Útil para reacciones defensivas.' : 'On damage.', tip: '' },
].map(e=>`
<div class="grim-event-card">
    <div class="grim-card-title">${e.ico} ${e.id}</div>
    <div class="grim-card-desc">${e.desc}${e.tip ? ` <b>${e.tip}</b>` : ''}</div>
    <div class="grim-code">${e.id}:\n  SpawnProjectile damage=6 count=1</div>
</div>`).join('')}`);

            // ACTIONS
            makeGrimPage('actions', `
<div class="grim-section">
    <div class="grim-section-title">Comandos (Acciones)</div>
    <div class="grim-text">Escribilos <b>indentados</b> bajo un evento. Podés combinar varios. Si el valor está fuera del rango, la runa no se programa.</div>
</div>
${[
    { id:'SpawnProjectile', ico:'🏹', desc:'Dispara proyectiles extra en la dirección que apuntás.' },
    { id:'ApplyStatus',     ico:'🔥', desc:'Aplica un efecto al enemigo golpeado: burn (quema), poison (veneno) o slow (ralentización).' },
    { id:'Explode',         ico:'💣', desc:'Explosión que daña a todos los enemigos cerca del objetivo.' },
    { id:'Heal',            ico:'❤️', desc:'Te cura instantáneamente.' },
    { id:'Shield',          ico:'🛡', desc:'Genera un escudo temporal que absorbe daño.' },
    { id:'Chain',           ico:'⛓', desc:'El daño salta al enemigo más cercano al objetivo.' },
    { id:'Bounce',          ico:'🔄', desc:'Tu proyectil rebota contra enemigos o paredes.' },
    { id:'Pierce',          ico:'➡', desc:'Tu proyectil atraviesa enemigos.' },
    { id:'Summon',          ico:'👻', desc:'Invoca un aliado temporal (wisp, stalker, brute, turret).' },
].map(a=>`
<div class="grim-action-card">
    <div class="grim-card-title">${a.ico} ${a.id}</div>
    <div class="grim-card-desc">${a.desc}</div>
    <div class="grim-card-params">Params: ${capLine(a.id) || '—'}</div>
</div>`).join('')}
<div class="grim-tip">💡 <b>chance=</b> agrega probabilidad (0-100). <b>chance=50</b> = 50% de activarse.</div>`);

            // RULES
            makeGrimPage('rules', `
<div class="grim-section">
    <div class="grim-section-title">Límites del sistema</div>
    <div class="grim-text">Estos límites existen para que el juego no se rompa:</div>
    <div class="grim-code">Máx líneas:   ${MAX_LINES}
CPU/evento:   ${MAX_CPU}
repeat máx:   ${MAX_REPEAT}
spawns/seg:   ${MAX_SPAWNS}</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Condiciones (if / else)</div>
    <div class="grim-text">Podés usar <b>if</b> para condicionar acciones. Variables: <b>mana, cooldown, stacks, chance, range, damage, count</b></div>
    <div class="grim-code">OnHit:
  if chance &lt; 25:
    Explode radius=80 damage=18
  else:
    ApplyStatus type=burn damage=5 duration=2</div>
    <div class="grim-tip">💡 <b>chance &lt; 25</b> significa "25% de probabilidad de activarse"</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Loops (repeat)</div>
    <div class="grim-text">Repetí una acción N veces. Máximo <b>${MAX_REPEAT}</b> repeticiones. Más repeticiones = más caro.</div>
    <div class="grim-code">OnCast:
  repeat 3:
    SpawnProjectile damage=4 count=1 spread=8</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Precios dinámicos</div>
    <div class="grim-text">El costo sube según la potencia: <b>más daño, más proyectiles, eventos frecuentes y repeats</b> encarecen la runa. El precio se actualiza en tiempo real mientras escribís.</div>
</div>`);

            // EXAMPLES
            makeGrimPage('examples', `
<div class="grim-section">
    <div class="grim-section-title">Ejemplos listos para usar</div>
    <div class="grim-text">Hacé clic en <b>Aplicar</b> para cargar el ejemplo en el editor.</div>
</div>
${[
    { title:'Doble Disparo', code:'OnCast:\n  SpawnProjectile damage=6 count=2 spread=10', tip:'Simple y barato. Buen inicio.' },
    { title:'Quemadura al pegar', code:'OnHit:\n  ApplyStatus type=burn damage=6 duration=2 chance=35', tip:'35% de quemar al golpear.' },
    { title:'Explosión rara', code:'OnHit:\n  Explode radius=90 damage=22 chance=15', tip:'15% de explotar. Muy destructivo.' },
    { title:'Escudo defensivo', code:'OnDamageTaken:\n  Shield amount=22 duration=4 chance=40', tip:'40% de generar escudo al recibir daño.' },
    { title:'Combo agresivo', code:'OnCast:\n  SpawnProjectile damage=8 count=3 spread=15\nOnHit:\n  ApplyStatus type=slow duration=1 amount=0.5 chance=50', tip:'Dispara 3 proyectiles que ralentizan.' },
    { title:'Cazador de kills', code:'OnKill:\n  Heal amount=8\n  SpawnProjectile damage=10 count=2 spread=20', tip:'Al matar: cura y dispara más proyectiles.' },
].map(e=>`
<div class="grim-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="grim-section-title" style="margin-bottom:0">${e.title}</div>
        <button class="grim-apply-btn" data-code="${encodeURIComponent(e.code)}">✦ Aplicar</button>
    </div>
    <div class="grim-code">${e.code}</div>
    <div class="grim-tip">💡 ${e.tip}</div>
</div>`).join('')}`);

        } else {
            // ENGLISH pages
            makeGrimPage('index', `
<div class="grim-section">
    <div class="grim-section-title">How does the Forge work?</div>
    <div class="grim-text">The Forge lets you write a small <b>magic script</b> your rune will execute during combat.<br>Think of it as instructions: <b>"when X happens, do Y"</b>.</div>
    <div class="grim-tip">💡 Start with an <b>Event</b> (when?), then add <b>Actions</b> (what happens?).</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Quick steps</div>
    <div class="grim-code">1. Pick an event:  OnCast:
2. Write an indented action:
     SpawnProjectile damage=8 count=2
3. Click "Program" ✓</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Sections</div>
    <button class="grim-link-btn" data-go="events">📌 Events — when does it trigger?</button>
    <button class="grim-link-btn" data-go="actions">🧩 Actions — what does it do?</button>
    <button class="grim-link-btn" data-go="rules">🛡 Rules — limits and conditions</button>
    <button class="grim-link-btn" data-go="examples">✨ Examples — ready templates</button>
</div>`);

            makeGrimPage('events', `
<div class="grim-section">
    <div class="grim-section-title">Available Events</div>
    <div class="grim-text">Events are written <b>without indentation</b>, followed by a colon. Actions go <b>indented</b> below (2 spaces or Tab).</div>
</div>
${[
    { id:'OnCast', ico:'⚡', desc:'When you shoot. Great for extra projectiles.' },
    { id:'OnHit',  ico:'💥', desc:'When your projectile hits an enemy. Powerful but costs more.' },
    { id:'OnKill', ico:'💀', desc:'When you kill an enemy.' },
    { id:'OnRoomClear', ico:'🏆', desc:'When all enemies in the room are cleared. Good for shields/heals.' },
    { id:'OnDamageTaken', ico:'🩹', desc:'When you take damage. Useful for defensive reactions.' },
].map(e=>`
<div class="grim-event-card">
    <div class="grim-card-title">${e.ico} ${e.id}</div>
    <div class="grim-card-desc">${e.desc}</div>
    <div class="grim-code">${e.id}:\n  SpawnProjectile damage=6 count=1</div>
</div>`).join('')}`);

            makeGrimPage('actions', `
<div class="grim-section">
    <div class="grim-section-title">Commands (Actions)</div>
    <div class="grim-text">Write them <b>indented</b> under an event. Combine multiple. Out-of-range values will fail validation.</div>
</div>
${[
    { id:'SpawnProjectile', ico:'🏹', desc:'Fire extra projectiles in your aim direction.' },
    { id:'ApplyStatus',     ico:'🔥', desc:'Apply an effect: burn, poison, or slow.' },
    { id:'Explode',         ico:'💣', desc:'Explosion damaging all enemies near the target.' },
    { id:'Heal',            ico:'❤️', desc:'Instantly heal yourself.' },
    { id:'Shield',          ico:'🛡', desc:'Create a temporary shield that absorbs damage.' },
    { id:'Chain',           ico:'⛓', desc:'Damage jumps to the nearest enemy to the target.' },
    { id:'Bounce',          ico:'🔄', desc:'Projectile bounces off enemies or walls.' },
    { id:'Pierce',          ico:'➡', desc:'Projectile passes through enemies.' },
    { id:'Summon',          ico:'👻', desc:'Summon a temporary ally (wisp, stalker, brute, turret).' },
].map(a=>`
<div class="grim-action-card">
    <div class="grim-card-title">${a.ico} ${a.id}</div>
    <div class="grim-card-desc">${a.desc}</div>
    <div class="grim-card-params">Params: ${capLine(a.id) || '—'}</div>
</div>`).join('')}
<div class="grim-tip">💡 <b>chance=</b> adds probability (0-100). <b>chance=50</b> = 50% chance to trigger.</div>`);

            makeGrimPage('rules', `
<div class="grim-section">
    <div class="grim-section-title">System Limits</div>
    <div class="grim-code">Max lines:    ${MAX_LINES}
CPU/event:    ${MAX_CPU}
Max repeat:   ${MAX_REPEAT}
Spawns/sec:   ${MAX_SPAWNS}</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Conditions (if / else)</div>
    <div class="grim-text">Use <b>if</b> to add conditions. Variables: <b>mana, cooldown, stacks, chance, range, damage, count</b></div>
    <div class="grim-code">OnHit:
  if chance &lt; 25:
    Explode radius=80 damage=18
  else:
    ApplyStatus type=burn damage=5 duration=2</div>
    <div class="grim-tip">💡 <b>chance &lt; 25</b> means "25% probability to trigger"</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Loops (repeat)</div>
    <div class="grim-code">OnCast:
  repeat 3:
    SpawnProjectile damage=4 count=1 spread=8</div>
</div>
<div class="grim-section">
    <div class="grim-section-title">Dynamic Pricing</div>
    <div class="grim-text">Cost rises with power: <b>more damage, more projectiles, frequent events, and repeats</b> all increase the price. Updates in real-time as you type.</div>
</div>`);

            makeGrimPage('examples', `
<div class="grim-section">
    <div class="grim-section-title">Ready-to-use Examples</div>
    <div class="grim-text">Click <b>Apply</b> to load the example into the editor.</div>
</div>
${[
    { title:'Double Shot',     code:'OnCast:\n  SpawnProjectile damage=6 count=2 spread=10', tip:'Simple and cheap. Great starter.' },
    { title:'Burn on Hit',     code:'OnHit:\n  ApplyStatus type=burn damage=6 duration=2 chance=35', tip:'35% to burn on hit.' },
    { title:'Rare Explosion',  code:'OnHit:\n  Explode radius=90 damage=22 chance=15', tip:'15% to explode. Very destructive.' },
    { title:'Defensive Shield',code:'OnDamageTaken:\n  Shield amount=22 duration=4 chance=40', tip:'40% shield on taking damage.' },
    { title:'Aggressive Combo',code:'OnCast:\n  SpawnProjectile damage=8 count=3 spread=15\nOnHit:\n  ApplyStatus type=slow duration=1 amount=0.5 chance=50', tip:'3 slowing projectiles per shot.' },
    { title:'Kill Reward',     code:'OnKill:\n  Heal amount=8\n  SpawnProjectile damage=10 count=2 spread=20', tip:'On kill: heal and fire extra shots.' },
].map(e=>`
<div class="grim-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="grim-section-title" style="margin-bottom:0">${e.title}</div>
        <button class="grim-apply-btn" data-code="${encodeURIComponent(e.code)}">✦ Apply</button>
    </div>
    <div class="grim-code">${e.code}</div>
    <div class="grim-tip">💡 ${e.tip}</div>
</div>`).join('')}`);
        }

        // Init tabs
        function showGrimPage(key) {
            grimBody.querySelectorAll('.forge-grim-page').forEach(p => p.classList.toggle('active', p.dataset.page === key));
            grimTabsEl.querySelectorAll('.forge-grim-tab').forEach(t => t.classList.toggle('active', t.dataset.page === key));
        }

        grimPages.forEach((p, i) => {
            const btn = document.createElement('button');
            btn.className = 'forge-grim-tab' + (i === 0 ? ' active' : '');
            btn.textContent = p.label;
            btn.dataset.page = p.key;
            btn.addEventListener('click', () => showGrimPage(p.key));
            grimTabsEl.append(btn);
        });
        showGrimPage('index');

        // Link buttons and Apply buttons inside grimoire
        grimBody.addEventListener('click', e => {
            const linkBtn = e.target.closest('.grim-link-btn');
            if (linkBtn && linkBtn.dataset.go) { showGrimPage(linkBtn.dataset.go); return; }
            const applyBtn = e.target.closest('.grim-apply-btn');
            if (applyBtn && applyBtn.dataset.code) {
                editor.value = decodeURIComponent(applyBtn.dataset.code);
                updateStatus();
                // Flash the editor to confirm
                editor.style.transition = 'border-color 0.1s';
                editor.style.borderColor = 'rgba(80,220,120,0.8)';
                setTimeout(() => { editor.style.borderColor = ''; }, 400);
            }
        });


        // --- Footer ---
        const footer = document.createElement('div');
        footer.className = 'forge-footer';

        const btnCancel = document.createElement('button');
        btnCancel.className = 'forge-btn forge-btn-cancel';
        btnCancel.textContent = T.cancel;

        const btnSave = document.createElement('button');
        btnSave.className = 'forge-btn forge-btn-program';
        btnSave.textContent = baseCost > 0 ? `${T.program} (${baseCost} 💰)` : `${T.program} (${T.free})`;

        function updateBtnCost(total) {
            btnSave.textContent = total > 0 ? `${T.program} (${total} 💰)` : `${T.program} (${T.free})`;
        }

        footer.append(btnCancel, btnSave);

        // Assemble
        panel.append(header, body, footer);
        modal.append(panel);

        const self = this;
        const close = () => { modal.remove(); self.paused = false; };

        btnCancel.addEventListener('click', close);
        // Only close if mousedown AND mouseup were both on the backdrop (not a text drag)
        let _mousedownOnBackdrop = false;
        modal.addEventListener('mousedown', e => { _mousedownOnBackdrop = (e.target === modal); });
        modal.addEventListener('click', e => { if (e.target === modal && _mousedownOnBackdrop) close(); });

        btnSave.addEventListener('click', () => {
            const src = editor.value;
            if (!src.trim()) {
                status.className = 'forge-status err';
                status.textContent = T.errEmpty;
                return;
            }
            if (!window.RuneScript) return;
            const r = RuneScript.compile(src);
            if (!r.ok) {
                status.className = 'forge-status err';
                status.textContent = `✗ ${r.error}`;
                return;
            }
            const a = RuneScript.analyze(src);
            if (!a.ok) {
                status.className = 'forge-status err';
                status.textContent = `✗ ${a.error}`;
                return;
            }
            const totalCost = baseCost + (a.extraCost || 0);
            if (totalCost > 0 && (player.gold || 0) < totalCost) {
                status.className = 'forge-status err';
                status.textContent = T.errGold(totalCost);
                return;
            }
            if (totalCost > 0) player.gold = Math.max(0, (player.gold || 0) - totalCost);
            const rune = player.runes[selectedRuneIdx];
            if (rune) {
                rune.programmed = true;
                rune.script = r.program;
                rune.scriptRaw = src;
                rune.icon = '🟪';
                rune.name = isEs ? 'Runa Programada' : 'Programmed Rune';
                rune.desc = isEs ? 'Ejecuta tu pseudo-código.' : 'Executes your script.';
            }
            ev.used = true;
            if (typeof self.onForgeUsed === 'function') self.onForgeUsed();
            if (window.UI && typeof UI.toast === 'function') UI.toast(T.successMsg, 'success');
            close();
        });

        document.body.appendChild(modal);
        updateStatus();
        editor.focus();
    },

    _showForgeNoRuneMsg() {
        const lang = (window.i18n && window.i18n.currentLang) ? window.i18n.currentLang : 'en';
        const isEs = lang === 'es';
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.style.cssText = 'background:linear-gradient(160deg,#0b1421,#080f1c);border:1px solid rgba(80,140,255,0.3);border-radius:14px;padding:32px 40px;color:#ddd;font-family:"Share Tech Mono",monospace;text-align:center;max-width:380px;box-shadow:0 0 40px rgba(60,120,255,0.12);';
        box.innerHTML = `
            <div style="font-size:2em;margin-bottom:12px">⚒</div>
            <h3 style="color:#7ec8ff;margin:0 0 14px;font-family:Cinzel,serif;font-size:1em;letter-spacing:0.1em">${isEs ? 'FORJA' : 'FORGE'}</h3>
            <p style="color:#8aaac8;margin:0 0 20px;font-size:0.82em;line-height:1.6">${isEs ? 'Necesitás una <strong style="color:#a0d0ff">Runa Vacía</strong> para usar la Forja.<br>Las runas vacías se consiguen en cofres y tras vencer jefes.' : 'You need an <strong style="color:#a0d0ff">Empty Rune</strong> to use the Forge.<br>Empty runes are found in chests and after defeating bosses.'}</p>`;
        const btn = document.createElement('button');
        btn.textContent = isEs ? 'Entendido' : 'Got it';
        btn.style.cssText = 'background:rgba(20,50,100,0.5);color:#7ec8ff;border:1px solid rgba(80,140,255,0.4);border-radius:9px;padding:8px 24px;cursor:pointer;font-family:inherit;font-size:0.85em;transition:all 0.2s;';
        btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(40,80,160,0.5)'; });
        btn.addEventListener('mouseout', () => { btn.style.background = 'rgba(20,50,100,0.5)'; });
        btn.addEventListener('click', () => modal.remove());
        box.append(btn);
        modal.append(box);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
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
