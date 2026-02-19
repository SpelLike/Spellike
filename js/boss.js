// ==========================================
// ARCANE DEPTHS - Boss System (FINAL BOSS WITH PHASES)
// ==========================================

class Boss extends Enemy {
    constructor(x, y, bossType, difficultyMult = 1, ngPlusLevel = 0) {
        // Get boss configuration
        const bossConfig = BossTypes[bossType] || BossTypes.guardian;
        const config = { ...bossConfig };

        // Scale with difficulty.
        // NOTE: NG+ scaling is already baked into Dungeon.difficultyMult, so avoid double counting here.
        // Extra boss tankiness (requested): make bosses much harder
        const bossHpMult = (config.isFinalBoss ? 6 : 4);
        config.hp = Math.floor(config.hp * difficultyMult * bossHpMult);
        config.damage = Math.floor(config.damage * Math.sqrt(difficultyMult)); // Damage scales slower than HP
        config.isBoss = true;
        config.width = config.width || 64;
        config.height = config.height || 64;

        super(x, y, bossType, config);

        this.bossType = bossType;
        this.phase = 1;
        this.maxPhases = config.phases || 3;
        this.phaseThresholds = config.phaseThresholds || [0.66, 0.33];

        // Boss-specific stats
        this.bossName = config.name || 'Boss';
        this.ngPlusLevel = ngPlusLevel;

        // Flag for end-of-run behavior
        this.isFinalBoss = !!config.isFinalBoss;

        // Attack patterns
        this.attackPatterns = config.attackPatterns || ['melee', 'ranged'];
        this.currentPattern = 0;
        this.patternCooldown = 0;
        this.patternDuration = 0;

        // Massive special move pack (data-driven patterns)
        this.attackPack = (window.BossAttackPack && BossAttackPack.byBoss)
            ? (BossAttackPack.byBoss[this.bossType] || [])
            : [];
        this.attackCombos = (window.BossAttackPack && BossAttackPack.combosByBoss)
            ? (BossAttackPack.combosByBoss[this.bossType] || [])
            : [];
        this.moveCooldowns = {};
        this.comboCooldowns = {};
        this.comboQueue = [];
        this.comboActive = false;
        this.specialMove = null;
        this.specialMoveTimer = 0;
        this.specialMoveData = null;
        this.specialDamageTick = 0;

        // Merge classic + new pattern strings for compatibility.
        for (const m of this.attackPack) {
            if (m && m.id && !this.attackPatterns.includes(m.id)) this.attackPatterns.push(m.id);
        }

        // Special attack timers
        this.specialCooldown = config.specialCooldown || 8;
        this.specialTimer = this.specialCooldown;

        // Summon ability
        this.canSummon = config.canSummon || false;
        this.summonCooldown = config.summonCooldown || 10;
        this.summonTimer = this.summonCooldown;

        // Charge attack
        this.chargeSpeed = config.chargeSpeed || 400;
        this.isCharging = false;

        // Laser sweep
        this.laserAngle = 0;
        this.laserActive = false;
        this.laserDuration = 0;

        // Ground slam
        this.slamRadius = config.slamRadius || 100;

        // Invulnerability during phase transition
        this.isInvulnerable = false;
        this.transitionTimer = 0;

        // Anti-burst (prevents instakill without making it a sponge)
        const diff = (window.Game && Game.difficulty) ? Game.difficulty : 'normal';
        if (diff === 'demonic') { this.toughnessThreshold = 0.15; this.toughnessReduce = 0.55; }
        else if (diff === 'hard') { this.toughnessThreshold = 0.18; this.toughnessReduce = 0.45; }
        else { this.toughnessThreshold = 0.22; this.toughnessReduce = 0.35; }
        this._burstWindow = 0;
        this._burstDamage = 0;
        this.toughnessTimer = 0;

        // Death reward
        this.rewardRarity = config.rewardRarity || 'legendary';

        // Boss mutations (NG+/Demencial): real changes, not just more HP
        this.mutations = [];
        this._mutTimers = { overcharged: 3.8, antiMagic: 6.5 };
        this.initMutations();
    }

    hasMutation(id) {
        try { return Array.isArray(this.mutations) && this.mutations.some(m => m && (m.id === id || m === id)); } catch (e) { return false; }
    }

    initMutations() {
        // Decide how many mutations to apply (1-3)
        const diff = (window.Game && Game.difficulty) ? Game.difficulty : 'normal';
        const k = (window.Game && typeof Game.bossKillsThisRun === 'number') ? Game.bossKillsThisRun : 0;
        let count = 0;
        if ((this.ngPlusLevel || 0) > 0) count += 1;
        if (diff === 'demonic') count += 1;
        if (k >= 2) count += 1;
        count = Math.max(1, Math.min(3, count));

        const pool = [
            { id: 'overcharged', label: 'Overcharged' },
            { id: 'molten_core', label: 'Molten' },
            { id: 'summoner', label: 'Summoner' },
            { id: 'anti_magic_pulse', label: 'Anti-Magic' },
            { id: 'phase_rush', label: 'Phase Rush' }
        ];

        // Basic fairness rules (avoid too many anti-mobility at once)
        const picked = [];
        while (pool.length && picked.length < count) {
            const idx = Math.floor(Math.random() * pool.length);
            const p = pool.splice(idx, 1)[0];
            // Avoid stacking both overcharged + anti-magic too early unless count is 3
            if (picked.length < 2 && (p.id === 'anti_magic_pulse') && picked.some(x => x.id === 'overcharged') && count < 3) {
                pool.push(p);
                continue;
            }
            picked.push(p);
        }

        this.mutations = picked;

        // Apply stat/behavior tweaks
        if (this.hasMutation('phase_rush')) {
            this._phaseRush = true;
            this.speed *= 1.12;
            this.attackCooldown *= 0.9;
            this.specialCooldown *= 0.85;
            this.patternCooldown *= 0.9;
        }

        if (this.hasMutation('summoner')) {
            this.canSummon = true;
            this.summonCooldown = Math.max(6, this.summonCooldown * 0.75);
            this.summonTimer = Math.min(this.summonTimer, 3);
            this._summonThresholds = { t75: false, t45: false };
        }

        // Timers
        this._mutTimers = this._mutTimers || { overcharged: 3.8, antiMagic: 6.5 };
        this._mutTimers.overcharged = 2.8 + Math.random() * 1.2;
        this._mutTimers.antiMagic = 5.5 + Math.random() * 1.5;
    }

    tickMutations(dt, player, room) {
        if (!dt) return;

        // Phase Rush accelerates boss cadence slightly (but keep it readable)
        if (this._phaseRush) {
            this.patternCooldown -= dt * 0.18;
            this.specialTimer -= dt * 0.12;
        }

        // Overcharged: periodic telegraphed strikes around the player
        if (this.hasMutation('overcharged') && room && player && typeof room.addBossStrike === 'function') {
            this._mutTimers.overcharged -= dt;
            if (this._mutTimers.overcharged <= 0) {
                this._mutTimers.overcharged = 2.8 + Math.random() * 1.4;
                const base = Math.random() * Math.PI * 2;
                const strikes = 3;
                for (let i = 0; i < strikes; i++) {
                    const a = base + (i / strikes) * Math.PI * 2;
                    const dist = 60 + Math.random() * 80;
                    const x = Utils.clamp(player.centerX + Math.cos(a) * dist, room.bounds.x + 50, room.bounds.x + room.bounds.width - 50);
                    const y = Utils.clamp(player.centerY + Math.sin(a) * dist, room.bounds.y + 70, room.bounds.y + room.bounds.height - 50);
                    room.addBossStrike(x, y, 26 + Math.random() * 8, 0.85, 0.18, Math.max(10, Math.floor(this.damage * 0.25)));
                }
                ParticleSystem.burst(this.centerX, this.centerY, 10, { color: '#b3e5fc', life: 0.4, size: 3, speed: 3 });
            }
        }

        // Anti-Magic Pulse: periodic zones
        if (this.hasMutation('anti_magic_pulse') && room && typeof room.addBossAntiMagicZone === 'function') {
            this._mutTimers.antiMagic -= dt;
            if (this._mutTimers.antiMagic <= 0) {
                this._mutTimers.antiMagic = 5.8 + Math.random() * 1.8;
                const x = this.centerX;
                const y = this.centerY;
                room.addBossAntiMagicZone(x, y, 120, 2.4);
                ParticleSystem.burst(x, y, 14, { color: '#b388ff', life: 0.45, size: 4, speed: 3 });
            }
        }

        // Summoner thresholds: spawn adds at HP thresholds
        if (this.hasMutation('summoner') && room && this._summonThresholds) {
            const hpPct = this.hp / Math.max(1, this.maxHp);
            if (hpPct <= 0.75 && !this._summonThresholds.t75) {
                this._summonThresholds.t75 = true;
                this.summonMinions(room);
            }
            if (hpPct <= 0.45 && !this._summonThresholds.t45) {
                this._summonThresholds.t45 = true;
                this.summonMinions(room);
            }
        }
    }


    update(dt, player, room) {
        if (!this.active) return;

        // Never allow a "warning line" without the corresponding attack.
        // If the boss gets interrupted (phase transition invulnerability, etc.), cancel windups
        // and beams so telegraphs don't stay on screen doing nothing.
        const cancelTelegraphs = () => {
            // Cancel charge/slam windups & movement
            if (this.state === 'charge_windup' || this.state === 'charging' || this.state === 'slam_windup' || this.state === 'slamming') {
                this.state = 'idle';
                this.stateTimer = 0;
                this.vx = 0;
                this.vy = 0;
                this.isCharging = false;
            }

            // Cancel laser windup/beam
            if (this.state === 'laser_windup' || this.state === 'laser_fire' || this.laserActive || this.laserTelegraphActive) {
                if (this.stopLaser) this.stopLaser();
                this.laserActive = false;
                this.laserTelegraphActive = false;
            }

            // Cancel custom special moves (meteor/ricochet/beams/etc.)
            if (this.state === 'special_move' || this.specialMove) {
                this.endSpecialMove(true);
            }
        };

        // Hard cleanup: never keep a laser beam on screen if we are not in a laser state.
        if ((this.laserActive || this.laserTelegraphActive) && this.state !== 'laser_windup' && this.state !== 'laser_fire') {
            this.stopLaser && this.stopLaser();
        }
        if (this.toughnessTimer > 0) this.toughnessTimer -= dt;
        if (this._burstWindow > 0) this._burstWindow -= dt;

        // Phase transition invulnerability
        if (this.isInvulnerable) {
            // If we were mid-windup, we must cancel telegraphs; otherwise players see a line that never fires.
            cancelTelegraphs();
            this.transitionTimer -= dt;
            if (this.transitionTimer <= 0) {
                this.isInvulnerable = false;
            }
            // Transition particle effect
            ParticleSystem.burst(this.centerX, this.centerY, 3, {
                color: '#ff00ff', life: 0.3, size: 4, speed: 2
            });
            return;
        }

        // Check phase transitions
        this.checkPhaseTransition();

        // Update timers
        this.specialTimer -= dt;
        this.summonTimer -= dt;
        this.patternCooldown -= dt;
        this.patternDuration -= dt;
        this.specialMoveTimer = Math.max(0, this.specialMoveTimer - dt);

        for (const id in this.moveCooldowns) {
            this.moveCooldowns[id] = Math.max(0, (this.moveCooldowns[id] || 0) - dt);
        }
        for (const id in this.comboCooldowns) {
            this.comboCooldowns[id] = Math.max(0, (this.comboCooldowns[id] || 0) - dt);
        }

        // Boss behavior based on phase
        this.tickMutations(dt, player, room);
        this.updateBossBehavior(dt, player, room);

        // Call parent update for movement and standard behavior
        super.update(dt, player, room);
    }

    checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHp;
        const newPhase = this.phase;

        for (let i = 0; i < this.phaseThresholds.length; i++) {
            if (hpPercent <= this.phaseThresholds[i] && this.phase <= i + 1) {
                this.enterPhase(i + 2);
                break;
            }
        }
    }

    enterPhase(newPhase) {
        if (newPhase === this.phase) return;

        this.phase = newPhase;
        this.isInvulnerable = true;
        this.transitionTimer = 1.5;

        // Phase transition effects
        const phaseColors = {
            guardian:      '#00e5ff',
            skeleton_king: '#9c27b0',
            spider_queen:  '#76ff03',
            golem:         '#ff6d00',
            hydra:         '#00bfa5',
            fire_lord:     '#ff1744',
            demon_lord:    '#d500f9',
            final_boss:    '#ffffff'
        };
        const phaseColor = phaseColors[this.bossType] || '#ff00ff';
        ParticleSystem.burst(this.centerX, this.centerY, 50, {
            color: phaseColor, life: 1.0, size: 7, speed: 6
        });
        AudioManager.play('hit');
        Game.shake(10);

        // Reset attack timers
        this.attackTimer = 0;
        this.specialTimer = 2;
        this.patternCooldown = 0;
        this.vx = 0;
        this.vy = 0;

        // Phase-specific changes
        if (this.phase === 2) {
            this.speed *= 1.2;
            this.attackCooldown *= 0.8;
        } else if (this.phase === 3) {
            this.speed *= 1.3;
            this.attackCooldown *= 0.6;
            this.canSummon = true;
        }
    }

    updateBossBehavior(dt, player, room) {
        if (!player) return;

        // Keep a reference for pattern starters that need a player but are triggered
        // from helper methods that don't receive the player arg.
        this._lastPlayerRef = player;
        this._lastRoomRef = room;

        const dist = this.distanceTo(player);
        const angle = this.angleTo(player);

        // Choose attack pattern based on distance and phase
        if (this.patternCooldown <= 0 && this.state === 'idle') {
            this.selectAttackPattern(dist);
        }

        // Execute current pattern
        switch (this.state) {
            case 'idle':
                this.stateIdle(dt, player, dist, angle);
                break;
            case 'chase':
                this.stateChase(dt, player, angle);
                break;
            case 'ranged':
                this.stateRanged(dt, player, dist, angle);
                break;
            case 'charge_windup':
                this.stateChargeWindup(dt, player);
                break;
            case 'charging':
                this.stateCharging(dt, room);
                break;
            case 'slam_windup':
                this.stateSlamWindup(dt);
                break;
            case 'slamming':
                this.stateSlamming(dt, player, room);
                break;
            case 'laser_windup':
                this.stateLaserWindup(dt, player);
                break;
            case 'laser_fire':
                this.stateLaserFire(dt, player);
                break;
            case 'summoning':
                this.stateSummoning(dt, room);
                break;
            case 'bullet_hell':
                this.stateBulletHell(dt, player);
                break;
            case 'web_trap':
                this.stateWebTrap(dt, player);
                break;
            case 'bone_spread':
                this.stateBoneSpread(dt, player);
                break;
            case 'egg_burst':
                this.stateEggBurst(dt, room);
                break;
            case 'magma_pillar':
                this.stateMagmaPillar(dt, player, room);
                break;
            case 'hydra_bite':
                this.stateHydraBite(dt, player);
                break;
            case 'special_move':
                this.stateSpecialMove(dt, player, room);
                break;
        }

        // Try special attack
        if (this.specialTimer <= 0 && this.state === 'idle') {
            this.doSpecialAttack(player, room);
        }

        // Summon minions in phase 3
        if (this.canSummon && this.summonTimer <= 0 && this.phase >= 3) {
            this.summonMinions(room);
        }
    }

    selectAttackPattern(dist) {
        const allowed = this.attackPatterns || ['chase', 'ranged'];
        const candidates = [];

        if (allowed.includes('chase') || allowed.includes('melee')) candidates.push('chase');
        if (allowed.includes('ranged') && dist > 100) candidates.push('ranged');
        if (allowed.includes('charge') && this.phase >= 2 && dist > 150) candidates.push('charge');
        if (allowed.includes('slam') && this.phase >= 2 && dist < 120) candidates.push('slam');
        if (allowed.includes('laser') && this.phase >= 3) candidates.push('laser');
        if (allowed.includes('bullet_hell') && this.phase >= 2) candidates.push('bullet_hell');
        if (allowed.includes('web_trap') && this.phase >= 1) candidates.push('web_trap');
        if (allowed.includes('bone_spread') && this.phase >= 1) candidates.push('bone_spread');
        if (allowed.includes('summon') && this.canSummon && this.phase >= 2) candidates.push('summon');
        if (allowed.includes('magma_pillar') && this.phase >= 2) candidates.push('magma_pillar');
        if (allowed.includes('hydra_bite') && dist < 130) candidates.push('hydra_bite');
        if (allowed.includes('egg_burst') && this.phase >= 1) candidates.push('egg_burst');

        // Continue queued combo first for readable 2-3 move sequences.
        if (this.comboQueue && this.comboQueue.length > 0) {
            const next = this.comboQueue.shift();
            this.comboActive = this.comboQueue.length > 0;
            this.startPattern(next);
            return;
        }
        this.comboActive = false;

        // Trigger combo if possible.
        if (this.attackCombos && this.attackCombos.length) {
            const eligible = this.attackCombos.filter(c => {
                if (!c || !Array.isArray(c.sequence) || !c.sequence.length) return false;
                if ((c.phaseMin || 1) > this.phase) return false;
                if ((c.phaseMax || this.maxPhases) < this.phase) return false;
                if ((this.comboCooldowns[c.id] || 0) > 0) return false;
                const first = c.sequence[0];
                if (first && (this.moveCooldowns[first] || 0) > 0) return false;
                return true;
            });
            for (const c of eligible) {
                const chance = Math.max(0, Math.min(1, c.chance || 0.18));
                if (Math.random() < chance) {
                    this.comboQueue = c.sequence.slice(1);
                    this.comboActive = this.comboQueue.length > 0;
                    this.comboCooldowns[c.id] = c.cooldown || 16;
                    this.startPattern(c.sequence[0]);
                    return;
                }
            }
        }

        // Data-driven moves
        if (this.attackPack && this.attackPack.length) {
            const phaseSet = (() => {
                try {
                    const plan = BossAttackPack.phasePlan && BossAttackPack.phasePlan[this.bossType];
                    const arr = plan && plan[this.phase] ? plan[this.phase] : null;
                    return new Set(arr || []);
                } catch (e) {
                    return new Set();
                }
            })();
            for (const move of this.attackPack) {
                if (!move || !move.id) continue;
                if ((move.phaseMin || 1) > this.phase) continue;
                if ((move.phaseMax || this.maxPhases) < this.phase) continue;
                if (dist < (move.minDist || 0) || dist > (move.maxDist || 9999)) continue;
                if ((this.moveCooldowns[move.id] || 0) > 0) continue;
                const w = Math.max(1, Math.floor(move.weight || 1) + (phaseSet.has(move.id) ? 1 : 0));
                for (let i = 0; i < w; i++) candidates.push(move.id);
            }
        }

        const final = candidates.length ? candidates : ['chase'];
        this.startPattern(Utils.randomChoice(final));
    }

    startPattern(pattern) {
        this.patternCooldown = 2 + Math.random() * 2;

        // Data-driven massive special move
        const move = (window.BossAttackPack && BossAttackPack.moveIndex)
            ? BossAttackPack.moveIndex[pattern]
            : null;
        if (move && move.bossId === this.bossType) {
            if (this.startSpecialMove(move)) return;
        }

        switch (pattern) {
            case 'chase':
                this.state = 'chase';
                this.patternDuration = 3;
                break;
            case 'ranged':
                this.state = 'ranged';
                this.patternDuration = 4;
                break;
            case 'charge':
                this.state = 'charge_windup';
                this.stateTimer = 0.8;
                break;
            case 'slam':
                this.state = 'slam_windup';
                this.stateTimer = 0.6;
                break;
            case 'laser':
                // NOTE: startPattern doesn't receive a player parameter.
                // Use the last known player ref from updateBossBehavior (or Game.player as fallback).
                {
                    const p = this._lastPlayerRef || (window.Game ? Game.player : null);
                    if (p) this.startLaser(p);
                    else { this.state = 'ranged'; this.patternDuration = 2.5; }
                }
                break;
            case 'bullet_hell':
                this.state = 'bullet_hell';
                this.stateTimer = 5.0; // Long duration
                this.bulletHellTimer = 0;
                break;
            case 'bone_spread':
                this.state = 'bone_spread';
                this.stateTimer = 0.6;
                break;
            case 'web_trap':
                this.state = 'web_trap';
                this.stateTimer = 0.5;
                break;
            case 'egg_burst':
                this.state = 'egg_burst';
                this.stateTimer = 0.8;
                this._eggs = [];
                this._eggsSpawned = false;
                this._eggTimer = 0;
                break;
            case 'magma_pillar':
                this.state = 'magma_pillar';
                this.stateTimer = 0.7;
                break;
            case 'hydra_bite':
                this.state = 'hydra_bite';
                this.stateTimer = 0.4;
                break;
            case 'summon':
                this.state = 'summoning';
                this.stateTimer = 0.9;
                if (this._lastRoomRef) this.summonMinions(this._lastRoomRef);
                break;
        }
    }

    getMoveScales() {
        const diff = (window.Game && Game.difficulty) ? Game.difficulty : 'normal';
        const ng = Math.max(0, this.ngPlusLevel || 0);
        let speedMult = 1;
        let telegraphMult = 1;
        let rotMult = 1;
        if (diff === 'hard') {
            speedMult = 1.08;
            telegraphMult = 0.93;
            rotMult = 1.08;
        } else if (diff === 'demonic') {
            speedMult = 1.14;
            telegraphMult = 0.86;
            rotMult = 1.14;
        }
        if (ng > 0) {
            const ngBoost = Math.min(0.18, ng * 0.04);
            speedMult += ngBoost;
            rotMult += ngBoost * 0.7;
            telegraphMult = Math.max(0.78, telegraphMult - ngBoost * 0.35);
        }
        return { speedMult, telegraphMult, rotMult };
    }

    tuneMove(move) {
        const tuned = { ...move };
        const s = this.getMoveScales();
        if (typeof tuned.telegraph === 'number') tuned.telegraph = Math.max(0.36, tuned.telegraph * s.telegraphMult);
        if (typeof tuned.speed === 'number') tuned.speed *= s.speedMult;
        if (typeof tuned.dashSpeed === 'number') tuned.dashSpeed *= s.speedMult;
        if (typeof tuned.rotSpeed === 'number') tuned.rotSpeed *= s.rotMult;
        return tuned;
    }

    canSpawnEnemyProjectile(extra = 1) {
        try {
            if (!window.ProjectileManager || !ProjectileManager.projectiles) return true;
            const arr = ProjectileManager.projectiles;
            let enemyCount = 0;
            for (const p of arr) if (p && p.active && p.owner === 'enemy') enemyCount++;
            const lim = (window.BossAttackPack && BossAttackPack.limits) ? BossAttackPack.limits : {};
            const maxEnemy = lim.maxEnemyProjectiles || 150;
            return enemyCount + extra <= maxEnemy;
        } catch (e) {
            return true;
        }
    }

    spawnMoveProjectile(angle, damageMul = 1, speed = 280, range = 620, effects = [], runeData = {}) {
        if (!this.canSpawnEnemyProjectile(1)) return null;
        return Game.spawnProjectile(
            this.centerX,
            this.centerY,
            angle,
            Math.max(1, Math.floor(this.damage * damageMul)),
            speed,
            range,
            'enemy',
            effects,
            runeData
        );
    }

    startSpecialMove(move) {
        if (!move) return false;

        const tuned = this.tuneMove(move);
        this.state = 'special_move';
        this.vx = 0;
        this.vy = 0;
        this.specialMove = tuned;
        this.specialMoveData = {
            t: 0,
            fired: false,
            phase: 'telegraph',
            localTimer: 0,
            hitCd: 0,
            invertWindup: 0,
            beamsAngle: Math.random() * Math.PI * 2
        };
        this.specialDamageTick = 0;
        this.moveCooldowns[tuned.id] = tuned.cooldown || 8.5;

        this.patternCooldown = this.comboActive
            ? (0.55 + Math.random() * 0.25)
            : Math.max(1.15, (tuned.recovery || 0.45) + 0.4 + Math.random() * 0.5);

        if (tuned.kind === 'ricochet_orb') {
            const player = this._lastPlayerRef || (window.Game ? Game.player : null);
            const room = this._lastRoomRef;
            let angle = player ? this.angleTo(player) : Math.random() * Math.PI * 2;
            if (player && this.distanceTo(player) < 78) {
                angle += (Math.random() < 0.5 ? -1 : 1) * 0.7;
            }
            this.specialMoveData.ricochetAngle = angle;
            this.specialMoveData.ricochetPath = room
                ? this.computeRicochetPath(this.centerX, this.centerY, angle, tuned.bounces || 5, room.bounds)
                : null;
        }

        if (tuned.kind === 'rotating_beams') {
            const room = this._lastRoomRef;
            if (room && room.bounds) {
                this.specialMoveData.centerX = room.bounds.x + room.bounds.width / 2;
                this.specialMoveData.centerY = room.bounds.y + room.bounds.height / 2;
            } else {
                this.specialMoveData.centerX = this.centerX;
                this.specialMoveData.centerY = this.centerY;
            }
            this.specialMoveData.rotDir = 1;
            this.specialMoveData.invertCheck = tuned.invertCheckEvery || 1.8;
            this.specialMoveData.activeTime = 0;
        }

        if (tuned.kind === 'meteor_spawner') {
            this.specialMoveData.spawned = 0;
            this.specialMoveData.spawnTimer = 0;
        }

        if (tuned.kind === 'dash_trail') {
            this.specialMoveData.trailTimer = 0;
            this.specialMoveData.dashing = false;
            this.specialMoveData.dashRemain = tuned.dashDuration || 0.6;
            this.specialMoveData.dashAngle = 0;
        }

        if (tuned.kind === 'orbit_release') {
            this.specialMoveData.orbitStarted = false;
            this.specialMoveData.orbitReleased = false;
            this.specialMoveData.orbitHitCd = 0;
            this.specialMoveData.orbitOrbs = [];
        }

        if (tuned.kind === 'bite_rush') {
            this.specialMoveData.biteTimer = 0;
            this.specialMoveData.bitesDone = 0;
        }

        return true;
    }

    endSpecialMove(forceCancel = false) {
        if (!this.specialMove) return;
        this.specialMove = null;
        this.specialMoveData = null;
        this.specialMoveTimer = 0;
        this.specialDamageTick = 0;
        this.vx = 0;
        this.vy = 0;
        if (this.state === 'special_move' || forceCancel) this.state = 'idle';
    }

    stateSpecialMove(dt, player, room) {
        const move = this.specialMove;
        const data = this.specialMoveData;
        if (!move || !data) {
            this.state = 'idle';
            return;
        }

        data.t += dt;
        if (data.hitCd > 0) data.hitCd -= dt;
        if (data.orbitHitCd > 0) data.orbitHitCd -= dt;
        if (data.invertWindup > 0) data.invertWindup -= dt;

        const tele = Math.max(0.1, move.telegraph || 0.7);
        if (data.t < tele) {
            this.vx = 0;
            this.vy = 0;
            if (move.kind === 'rotating_beams') {
                const dx = (data.centerX || this.centerX) - this.centerX;
                const dy = (data.centerY || this.centerY) - this.centerY;
                const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                const moveSpd = 260;
                this.vx = (dx / d) * moveSpd;
                this.vy = (dy / d) * moveSpd;
            }
            if (move.kind === 'dash_trail' && player) {
                this.specialMoveData.dashAngle = this.angleTo(player);
            }
            return;
        }

        switch (move.kind) {
            case 'arc_burst':
            case 'ring_burst':
            case 'wall_volley':
            case 'strike_pattern':
            case 'summon_wave':
            case 'ricochet_orb':
                if (!data.fired) {
                    this.executeOneShotMove(move, player, room, data);
                    data.fired = true;
                    data.localTimer = move.recovery || 0.45;
                }
                data.localTimer -= dt;
                if (data.localTimer <= 0) this.endSpecialMove();
                break;
            case 'dash_trail':
                this.updateDashTrail(move, data, dt, player, room);
                break;
            case 'orbit_release':
                this.updateOrbitRelease(move, data, dt, player);
                break;
            case 'meteor_spawner':
                this.updateMeteorSpawner(move, data, dt, player, room);
                break;
            case 'rotating_beams':
                this.updateRotatingBeams(move, data, dt, player);
                break;
            case 'bite_rush':
                this.updateBiteRush(move, data, dt, player);
                break;
            default:
                this.endSpecialMove();
                break;
        }
    }

    executeOneShotMove(move, player, room, data) {
        switch (move.kind) {
            case 'arc_burst':
                this.executeArcBurst(move, player);
                break;
            case 'ring_burst':
                this.executeRingBurst(move, player);
                break;
            case 'wall_volley':
                this.executeWallVolley(move, player, room);
                break;
            case 'strike_pattern':
                this.executeStrikePattern(move, player, room);
                break;
            case 'summon_wave':
                this.executeSummonWave(move, room);
                break;
            case 'ricochet_orb':
                this.executeRicochet(move, player, room, data);
                break;
        }
    }

    executeArcBurst(move, player) {
        const waves = Math.max(1, Math.floor(move.waves || 1));
        const count = Math.max(1, Math.floor(move.count || 7));
        const spread = (move.spreadDeg || 90) * Math.PI / 180;
        const speed = move.speed || 300;
        const range = move.range || 640;
        const base = player ? this.angleTo(player) : Math.random() * Math.PI * 2;

        for (let w = 0; w < waves; w++) {
            const waveOff = (w - (waves - 1) / 2) * 0.07;
            for (let i = 0; i < count; i++) {
                if (!this.canSpawnEnemyProjectile(1)) return;
                const t = (count === 1) ? 0 : (i / (count - 1));
                const off = -spread / 2 + spread * t;
                this.spawnMoveProjectile(base + off + waveOff, move.damageMul || 0.7, speed, range, move.effects || [], move.effectData || {});
            }
        }
        AudioManager.play('shoot_enemy');
    }

    executeRingBurst(move, player) {
        const waves = Math.max(1, Math.floor(move.waves || 1));
        const count = Math.max(6, Math.floor(move.count || 14));
        const speed = move.speed || 240;
        const range = move.range || 620;
        const gapSlots = Math.max(0, Math.floor(move.gapSize || 0));
        const base = (player ? this.angleTo(player) : 0) + (move.startAngleJitter || 0) * (Math.random() - 0.5);

        for (let w = 0; w < waves; w++) {
            const waveBase = base + w * 0.12;
            const gapCenterIdx = Math.floor((waveBase % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * count);
            for (let i = 0; i < count; i++) {
                if (!this.canSpawnEnemyProjectile(1)) return;
                let inGap = false;
                if (gapSlots > 0) {
                    const d = Math.abs(i - gapCenterIdx);
                    const wrap = Math.min(d, count - d);
                    inGap = wrap <= Math.floor(gapSlots / 2);
                }
                if (inGap) continue;
                const ang = waveBase + (i / count) * Math.PI * 2;
                this.spawnMoveProjectile(ang, move.damageMul || 0.68, speed, range, move.effects || [], move.effectData || {});
            }
        }
        AudioManager.play('shoot_enemy');
    }

    executeWallVolley(move, player, room) {
        if (!room || !room.bounds) return;
        const rb = room.bounds;
        const count = Math.max(1, Math.floor(move.countPerWall || 4));
        const speed = move.speed || 240;
        const walls = Array.isArray(move.walls) ? move.walls : ['left', 'right'];

        const pushFromWall = (x, y, baseAngle) => {
            for (let i = 0; i < count; i++) {
                if (!this.canSpawnEnemyProjectile(1)) return;
                const spread = (i - (count - 1) / 2) * 0.07;
                const a = baseAngle + spread;
                Game.spawnProjectile(
                    x,
                    y,
                    a,
                    Math.max(1, Math.floor(this.damage * (move.damageMul || 0.66))),
                    speed,
                    720,
                    'enemy',
                    move.effects || [],
                    move.effectData || {}
                );
            }
        };

        for (const wall of walls) {
            if (wall === 'left' || wall === 'right') {
                for (let i = 0; i < count; i++) {
                    const y = rb.y + 30 + (i / Math.max(1, count - 1)) * (rb.height - 60);
                    const x = (wall === 'left') ? rb.x + 8 : (rb.x + rb.width - 8);
                    const base = move.targeted && player ? Utils.angle(x, y, player.centerX, player.centerY) : (wall === 'left' ? 0 : Math.PI);
                    pushFromWall(x, y, base);
                }
            } else if (wall === 'top' || wall === 'bottom') {
                for (let i = 0; i < count; i++) {
                    const x = rb.x + 30 + (i / Math.max(1, count - 1)) * (rb.width - 60);
                    const y = (wall === 'top') ? rb.y + 8 : (rb.y + rb.height - 8);
                    const base = move.targeted && player ? Utils.angle(x, y, player.centerX, player.centerY) : (wall === 'top' ? Math.PI / 2 : -Math.PI / 2);
                    pushFromWall(x, y, base);
                }
            } else if (wall === 'corners') {
                const corners = [
                    { x: rb.x + 18, y: rb.y + 18 },
                    { x: rb.x + rb.width - 18, y: rb.y + 18 },
                    { x: rb.x + 18, y: rb.y + rb.height - 18 },
                    { x: rb.x + rb.width - 18, y: rb.y + rb.height - 18 }
                ];
                for (const c of corners) {
                    const base = player ? Utils.angle(c.x, c.y, player.centerX, player.centerY) : Math.random() * Math.PI * 2;
                    pushFromWall(c.x, c.y, base);
                }
            }
        }
        AudioManager.play('shoot_enemy');
    }

    executeStrikePattern(move, player, room) {
        if (!room || typeof room.addBossStrike !== 'function') return;
        const pattern = move.pattern || 'cross_player';
        const warn = move.warn || 0.8;
        const radius = move.radius || 26;
        const count = Math.max(1, Math.floor(move.strikeCount || 8));
        const dmg = Math.max(1, Math.floor(this.damage * (move.damageMul || 0.78)));
        const pts = [];

        const p = player ? { x: player.centerX, y: player.centerY } : { x: this.centerX, y: this.centerY };
        const rb = room.bounds;

        if (pattern === 'cross_player') {
            for (let i = 0; i < count; i++) {
                const d = 30 + i * 20;
                if (i % 2 === 0) {
                    pts.push({ x: p.x + d, y: p.y }, { x: p.x - d, y: p.y });
                } else {
                    pts.push({ x: p.x, y: p.y + d }, { x: p.x, y: p.y - d });
                }
            }
        } else if (pattern === 'prison_player') {
            const ringR = 74;
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                pts.push({ x: p.x + Math.cos(a) * ringR, y: p.y + Math.sin(a) * ringR });
            }
        } else if (pattern === 'grid_room') {
            const cols = Math.max(3, Math.min(6, Math.round(Math.sqrt(count))));
            const rows = Math.max(3, Math.min(6, Math.ceil(count / cols)));
            for (let ry = 0; ry < rows; ry++) {
                for (let cx = 0; cx < cols; cx++) {
                    if (pts.length >= count) break;
                    const x = rb.x + (cx + 0.5) / cols * rb.width;
                    const y = rb.y + (ry + 0.5) / rows * rb.height;
                    pts.push({ x, y });
                }
            }
        } else if (pattern === 'random_room') {
            const minSpacing = move.minSpacing || 90;
            for (let i = 0; i < count; i++) {
                for (let tries = 0; tries < 10; tries++) {
                    const x = Utils.random(rb.x + 40, rb.x + rb.width - 40);
                    const y = Utils.random(rb.y + 50, rb.y + rb.height - 40);
                    const ok = !pts.some(o => Utils.distance(o.x, o.y, x, y) < minSpacing);
                    if (ok) { pts.push({ x, y }); break; }
                }
            }
        } else if (pattern === 'random_player_bias') {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = 55 + Math.random() * 180;
                const x = Utils.clamp(p.x + Math.cos(a) * d, rb.x + 30, rb.x + rb.width - 30);
                const y = Utils.clamp(p.y + Math.sin(a) * d, rb.y + 40, rb.y + rb.height - 30);
                pts.push({ x, y });
            }
        } else if (pattern === 'ring_gap_player') {
            const ringR = 100;
            const gap = Math.max(1, Math.floor(move.gapSize || 2));
            const gapCenter = player ? this.angleTo(player) : 0;
            const slotCenter = ((gapCenter % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                let diff = a - slotCenter;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                const slotAng = (Math.PI * 2 / count) * Math.max(1, gap);
                if (Math.abs(diff) < slotAng * 0.5) continue;
                pts.push({ x: p.x + Math.cos(a) * ringR, y: p.y + Math.sin(a) * ringR });
            }
        } else if (pattern === 'corners_center') {
            pts.push(
                { x: rb.x + 30, y: rb.y + 40 },
                { x: rb.x + rb.width - 30, y: rb.y + 40 },
                { x: rb.x + 30, y: rb.y + rb.height - 30 },
                { x: rb.x + rb.width - 30, y: rb.y + rb.height - 30 },
                { x: rb.x + rb.width / 2, y: rb.y + rb.height / 2 }
            );
        }

        for (const pt of pts) {
            if (!pt) continue;
            const x = Utils.clamp(pt.x, rb.x + 20, rb.x + rb.width - 20);
            const y = Utils.clamp(pt.y, rb.y + 30, rb.y + rb.height - 20);
            room.addBossStrike(x, y, radius, warn, 0.2, dmg);
        }
    }

    executeSummonWave(move, room) {
        if (!room || !room.enemies) return;
        const types = Array.isArray(move.summonTypes) && move.summonTypes.length
            ? move.summonTypes
            : ['skeleton', 'goblin', 'slime'];
        const count = Math.max(1, Math.floor(move.count || 3));
        const r = move.summonRadius || 110;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const d = r * (0.55 + Math.random() * 0.45);
            const x = Utils.clamp(this.centerX + Math.cos(a) * d, room.bounds.x + 28, room.bounds.x + room.bounds.width - 28);
            const y = Utils.clamp(this.centerY + Math.sin(a) * d, room.bounds.y + 36, room.bounds.y + room.bounds.height - 24);
            const t = Utils.randomChoice(types);
            const e = createEnemy(t, x, y, 0.8 + this.ngPlusLevel * 0.2);
            if (e) {
                e.spawnInvuln = Math.max(e.spawnInvuln || 0, 0.4);
                room.enemies.push(e);
            }
        }
        ParticleSystem.burst(this.centerX, this.centerY, 20, { color: '#88ffcc', life: 0.5, size: 4, speed: 3 });
        AudioManager.play('shoot_enemy');
    }

    executeRicochet(move, player, room, data) {
        if (!room || !room.bounds || !player) return;
        let angle = (typeof data.ricochetAngle === 'number') ? data.ricochetAngle : this.angleTo(player);
        const spawnDist = Math.max(24, this.width * 0.5 + 8);
        let sx = this.centerX + Math.cos(angle) * spawnDist;
        let sy = this.centerY + Math.sin(angle) * spawnDist;

        let tries = 0;
        while (Utils.distance(sx, sy, player.centerX, player.centerY) < 40 && tries < 6) {
            angle += (tries % 2 === 0 ? 0.35 : -0.55);
            sx = this.centerX + Math.cos(angle) * spawnDist;
            sy = this.centerY + Math.sin(angle) * spawnDist;
            tries++;
        }

        const proj = Game.spawnProjectile(
            sx,
            sy,
            angle,
            Math.max(1, Math.floor(this.damage * (move.damageMul || 0.84))),
            move.speed || 235,
            move.range || 1700,
            'enemy',
            move.effects || [],
            {
                ...(move.effectData || {}),
                bounceCount: Math.max(0, Math.floor(move.bounces || 5))
            }
        );
        if (proj) {
            proj.radius = move.radius || 9;
            proj.width = proj.height = (move.radius || 9) * 2;
            proj.color = '#66f2ff';
        }
        AudioManager.play('shoot_enemy');
    }

    updateDashTrail(move, data, dt, player, room) {
        if (!data.dashing) {
            data.dashing = true;
            data.dashRemain = move.dashDuration || 0.6;
            data.trailTimer = 0;
            data.dashAngle = player ? this.angleTo(player) : (this.chargeAngle || 0);
        }

        if (data.dashRemain > 0) {
            this.vx = Math.cos(data.dashAngle) * (move.dashSpeed || 540);
            this.vy = Math.sin(data.dashAngle) * (move.dashSpeed || 540);
            data.dashRemain -= dt;
            data.trailTimer -= dt;
            if (room && typeof room.addBossStrike === 'function' && data.trailTimer <= 0) {
                data.trailTimer = Math.max(0.07, move.trailEvery || 0.13);
                room.addBossStrike(
                    this.centerX,
                    this.centerY,
                    move.trailRadius || 24,
                    0.35,
                    0.16,
                    Math.max(1, Math.floor(this.damage * (move.trailDamageMul || 0.55)))
                );
            }
            return;
        }

        this.vx = 0;
        this.vy = 0;
        data.localTimer = (data.localTimer || (move.recovery || 0.4)) - dt;
        if (data.localTimer <= 0) this.endSpecialMove();
    }

    updateOrbitRelease(move, data, dt, player) {
        this.vx = 0;
        this.vy = 0;

        if (!data.orbitStarted) {
            data.orbitStarted = true;
            const n = Math.max(2, Math.floor(move.orbitCount || 6));
            data.orbitOrbs = [];
            for (let i = 0; i < n; i++) data.orbitOrbs.push({ a: (i / n) * Math.PI * 2 });
            data.orbitT = 0;
        }

        const orbitDuration = move.orbitDuration || 2.0;
        if (!data.orbitReleased) {
            data.orbitT += dt;
            const rot = 1.6;
            for (const o of data.orbitOrbs) o.a += rot * dt;

            if (player && data.orbitHitCd <= 0) {
                const r = move.orbitRadius || 62;
                for (const o of data.orbitOrbs) {
                    const ox = this.centerX + Math.cos(o.a) * r;
                    const oy = this.centerY + Math.sin(o.a) * r;
                    if (Utils.distance(ox, oy, player.centerX, player.centerY) < 16) {
                        player.takeDamage(Math.max(1, Math.floor(this.damage * 0.25)));
                        data.orbitHitCd = 0.18;
                        break;
                    }
                }
            }

            if (data.orbitT >= orbitDuration) {
                data.orbitReleased = true;
                const speed = move.speed || 285;
                for (const o of data.orbitOrbs) {
                    const ox = this.centerX + Math.cos(o.a) * (move.orbitRadius || 62);
                    const oy = this.centerY + Math.sin(o.a) * (move.orbitRadius || 62);
                    const ang = (move.releaseMode === 'aimed' && player)
                        ? Utils.angle(ox, oy, player.centerX, player.centerY)
                        : o.a;
                    Game.spawnProjectile(
                        ox,
                        oy,
                        ang,
                        Math.max(1, Math.floor(this.damage * (move.damageMul || 0.72))),
                        speed,
                        700,
                        'enemy',
                        move.effects || [],
                        move.effectData || {}
                    );
                }
                AudioManager.play('shoot_enemy');
                data.localTimer = move.recovery || 0.5;
            }
            return;
        }

        data.localTimer -= dt;
        if (data.localTimer <= 0) this.endSpecialMove();
    }

    updateMeteorSpawner(move, data, dt, player, room) {
        this.vx = 0;
        this.vy = 0;
        if (!room || typeof room.addBossMeteorDrop !== 'function') {
            this.endSpecialMove();
            return;
        }

        const total = Math.max(1, Math.floor(move.meteorCount || 2));
        data.spawnTimer -= dt;
        if (data.spawned < total && data.spawnTimer <= 0) {
            data.spawnTimer = (move.meteorInterval || 0.95);
            data.spawned++;

            const rb = room.bounds;
            let x = Utils.random(rb.x + 70, rb.x + rb.width - 70);
            let y = Utils.random(rb.y + 90, rb.y + rb.height - 70);
            if (player) {
                const a = Math.random() * Math.PI * 2;
                const d = 70 + Math.random() * 120;
                x = Utils.clamp(player.centerX + Math.cos(a) * d, rb.x + 60, rb.x + rb.width - 60);
                y = Utils.clamp(player.centerY + Math.sin(a) * d, rb.y + 80, rb.y + rb.height - 60);
            }

            room.addBossMeteorDrop({
                x,
                y,
                r: move.impactRadius || 52,
                warn: move.warn || 1.0,
                damage: Math.max(1, Math.floor(this.damage * (move.impactDamageMul || 0.82))),
                nest: {
                    hp: move.nestHp || 220,
                    spawnEvery: move.nestSpawnEvery || 3.0,
                    spawnRange: move.nestRange || 115,
                    maxMobs: move.nestMaxMobs || 6,
                    globalCap: move.nestGlobalCap || 12,
                    pool: move.nestPool || ['brute', 'mage', 'charger'],
                    label: move.nestLabel || 'Nido'
                }
            });
        }

        if (data.spawned >= total) {
            data.localTimer = (data.localTimer || (move.recovery || 0.6)) - dt;
            if (data.localTimer <= 0) this.endSpecialMove();
        }
    }

    updateRotatingBeams(move, data, dt, player) {
        this.vx = 0;
        this.vy = 0;

        const cx = data.centerX || this.centerX;
        const cy = data.centerY || this.centerY;
        this.x = cx - this.width / 2;
        this.y = cy - this.height / 2;

        data.activeTime += dt;
        const duration = move.duration || 8.5;
        const beamCount = Math.max(1, Math.floor(move.beamCount || 5));
        const rotSpeed = move.rotSpeed || 0.45;

        if (data.invertWindup <= 0) {
            data.invertCheck -= dt;
            if (data.invertCheck <= 0) {
                data.invertCheck = move.invertCheckEvery || 1.7;
                if (Math.random() < (move.invertChance || 0.24)) {
                    data.invertWindup = move.invertTelegraph || 0.4;
                    ParticleSystem.burst(cx, cy, 12, { color: '#ffe082', life: 0.35, size: 3, speed: 2 });
                    AudioManager.play('hit');
                }
            }
        } else if (data.invertWindup <= 0.001) {
            data.rotDir = -(data.rotDir || 1);
            data.invertWindup = 0;
        }

        data.beamsAngle += (data.rotDir || 1) * rotSpeed * dt;

        if (player && data.hitCd <= 0) {
            const len = move.beamLength || 460;
            const w = move.beamWidth || 12;
            for (let i = 0; i < beamCount; i++) {
                const a = data.beamsAngle + (i / beamCount) * Math.PI * 2;
                const ex = cx + Math.cos(a) * len;
                const ey = cy + Math.sin(a) * len;
                const d = this.distancePointToSegment(player.centerX, player.centerY, cx, cy, ex, ey);
                if (d <= w) {
                    player.takeDamage(Math.max(1, Math.floor(this.damage * (move.damageMul || 0.68))));
                    data.hitCd = 0.18;
                    break;
                }
            }
        }

        if (data.activeTime >= duration) this.endSpecialMove();
    }

    updateBiteRush(move, data, dt, player) {
        this.vx = 0;
        this.vy = 0;
        if (!player) {
            this.endSpecialMove();
            return;
        }

        data.biteTimer -= dt;
        const total = Math.max(1, Math.floor(move.bites || 3));
        if (data.bitesDone < total && data.biteTimer <= 0) {
            data.biteTimer = move.biteInterval || 0.3;
            data.bitesDone++;
            const base = this.angleTo(player);
            const cone = (move.coneDeg || 44) * Math.PI / 180;
            const projN = 3;
            for (let i = 0; i < projN; i++) {
                const off = (i - (projN - 1) / 2) * (cone / Math.max(1, projN - 1));
                this.spawnMoveProjectile(base + off, move.damageMul || 0.8, 360, 220, move.effects || [], move.effectData || {});
            }
            const d = this.distanceTo(player);
            if (d < (move.biteRange || 105)) {
                player.takeDamage(Math.max(1, Math.floor(this.damage * (move.damageMul || 0.8))));
            }
            AudioManager.play('hit');
        }

        if (data.bitesDone >= total) {
            data.localTimer = (data.localTimer || (move.recovery || 0.42)) - dt;
            if (data.localTimer <= 0) this.endSpecialMove();
        }
    }

    computeRicochetPath(x, y, angle, bounces, bounds) {
        const segs = [];
        let px = x;
        let py = y;
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        const maxBounces = Math.max(1, Math.floor(bounces || 5));

        for (let i = 0; i <= maxBounces; i++) {
            let tx = Infinity;
            let ty = Infinity;
            if (vx > 0) tx = (bounds.x + bounds.width - px) / vx;
            else if (vx < 0) tx = (bounds.x - px) / vx;
            if (vy > 0) ty = (bounds.y + bounds.height - py) / vy;
            else if (vy < 0) ty = (bounds.y - py) / vy;

            const t = Math.max(0, Math.min(tx, ty));
            const ex = px + vx * t;
            const ey = py + vy * t;
            segs.push({ x1: px, y1: py, x2: ex, y2: ey });

            const hitVertical = tx < ty;
            if (hitVertical) vx *= -1;
            else vy *= -1;
            px = ex + vx * 0.01;
            py = ey + vy * 0.01;
        }
        return segs;
    }

    distancePointToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy;
        if (l2 <= 0.0001) return Utils.distance(px, py, x1, y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const cx = x1 + t * dx;
        const cy = y1 + t * dy;
        return Utils.distance(px, py, cx, cy);
    }

    drawSpecialMove(ctx) {
        const move = this.specialMove;
        const data = this.specialMoveData;
        if (!move || !data) return;
        const tele = Math.max(0.1, move.telegraph || 0.7);

        if (move.kind === 'ricochet_orb' && data.t < tele && data.ricochetPath) {
            ctx.save();
            ctx.strokeStyle = 'rgba(120, 250, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 7]);
            for (const s of data.ricochetPath) {
                ctx.beginPath();
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();
        }

        if (move.kind === 'rotating_beams' && data.t >= tele) {
            const cx = data.centerX || this.centerX;
            const cy = data.centerY || this.centerY;
            const n = Math.max(1, Math.floor(move.beamCount || 5));
            const len = move.beamLength || 460;
            ctx.save();
            for (let i = 0; i < n; i++) {
                const a = data.beamsAngle + (i / n) * Math.PI * 2;
                const ex = cx + Math.cos(a) * len;
                const ey = cy + Math.sin(a) * len;
                ctx.shadowColor = '#ff7043';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = 'rgba(255, 110, 70, 0.92)';
                ctx.lineWidth = move.beamWidth || 12;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255, 245, 220, 0.9)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
            if (data.invertWindup > 0) {
                ctx.globalAlpha = 0.75;
                ctx.strokeStyle = '#fff59d';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(cx, cy, 38 + 8 * Math.sin(Date.now() * 0.02), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (move.kind === 'orbit_release' && data.orbitOrbs && data.orbitOrbs.length && !data.orbitReleased) {
            const r = move.orbitRadius || 62;
            ctx.save();
            for (const o of data.orbitOrbs) {
                const ox = this.centerX + Math.cos(o.a) * r;
                const oy = this.centerY + Math.sin(o.a) * r;
                ctx.fillStyle = 'rgba(180, 240, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(ox, oy, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (move.kind === 'dash_trail' && data.t < tele) {
            const ang = (typeof data.dashAngle === 'number') ? data.dashAngle : this.angleTo(this._lastPlayerRef || this);
            const len = 220;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,80,80,0.92)';
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 6]);
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(this.centerX + Math.cos(ang) * len, this.centerY + Math.sin(ang) * len);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    stateIdle(dt, player, dist, angle) {
        // Move toward player slowly
        if (dist > 150) {
            this.vx = Math.cos(angle) * this.speed * 0.5;
            this.vy = Math.sin(angle) * this.speed * 0.5;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    stateChase(dt, player, angle) {
        // Aggressive chase
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // Melee attack when close
        if (this.distanceTo(player) < this.attackRange && this.attackTimer <= 0) {
            this.doMeleeCombo(player);
        }

        this.patternDuration -= dt;
        if (this.patternDuration <= 0) {
            this.state = 'idle';
        }
    }

    stateRanged(dt, player, dist, angle) {
        // Maintain distance
        if (dist < 150) {
            this.vx = -Math.cos(angle) * this.speed * 0.5;
            this.vy = -Math.sin(angle) * this.speed * 0.5;
        } else if (dist > 250) {
            this.vx = Math.cos(angle) * this.speed * 0.3;
            this.vy = Math.sin(angle) * this.speed * 0.3;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Ranged attacks
        if (this.attackTimer <= 0) {
            this.doRangedBarrage(player);
        }

        this.patternDuration -= dt;
        if (this.patternDuration <= 0) {
            this.state = 'idle';
        }
    }

    stateChargeWindup(dt, player) {
        this.vx = 0;
        this.vy = 0;

        // Visual warning
        ParticleSystem.burst(this.centerX, this.centerY, 2, {
            color: '#ff0000', life: 0.2, size: 4, speed: 1
        });

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.chargeAngle = this.angleTo(player);
            this.state = 'charging';
            this.stateTimer = 0.8;
            this.isCharging = true;
        }
    }

    stateCharging(dt, room) {
        this.vx = Math.cos(this.chargeAngle) * this.chargeSpeed;
        this.vy = Math.sin(this.chargeAngle) * this.chargeSpeed;

        // Charge particles
        ParticleSystem.burst(this.centerX, this.centerY, 1, {
            color: '#ff6600', life: 0.3, size: 3, speed: 2
        });

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.state = 'idle';
            this.isCharging = false;
            this.vx = 0;
            this.vy = 0;
        }
    }

    stateSlamWindup(dt) {
        this.vx = 0;
        this.vy = 0;

        // Jump up visual
        ParticleSystem.burst(this.centerX, this.centerY, 3, {
            color: '#ffff00', life: 0.3, size: 3, speed: 3
        });

        this.stateTimer -= dt;

        // CAMBIO 19: Telegraph visual del radio del slam
        if (this.stateTimer <= 0.15 && !this._slamCircleShown) {
            this._slamCircleShown = true;
            this._slamWarning = {
                x: this.centerX,
                y: this.centerY,
                r: this.slamRadius,
                timer: 0.4
            };
        }

        if (this.stateTimer <= 0) {
            this.state = 'slamming';
            this.stateTimer = 0.3;
        }
    }

    stateSlamming(dt, player, room) {
        this._slamCircleShown = false;
        this._slamWarning = null;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            // Ground slam AoE damage
            ParticleSystem.burst(this.centerX, this.centerY, 30, {
                color: '#8B4513', life: 0.5, size: 5, speed: 4
            });
            Game.shake(8);
            AudioManager.play('hit');

            // Damage player if in radius
            if (player) {
                const dist = this.distanceTo(player);
                if (dist < this.slamRadius) {
                    player.takeDamage(Math.floor(this.damage * 1.5));
                }
            }

            // Mutation: Molten Core (lava pools after slam)
            if (room && this.hasMutation('molten_core') && typeof room.addLavaPool === 'function') {
                room.addLavaPool(this.centerX, this.centerY, Math.max(60, Math.floor(this.slamRadius * 0.75)), 4.5);
            }

            // Create shockwave projectiles
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                Game.spawnProjectile(
                    this.centerX,
                    this.centerY,
                    angle,
                    Math.floor(this.damage * 0.5),
                    200,
                    150,
                    'enemy'
                );
            }

            this.state = 'idle';
        }
    }

    startLaser(player, opts = null) {
        const windup = (opts && typeof opts.windup === 'number') ? opts.windup : 0.7;
        const fire = (opts && typeof opts.fire === 'number') ? opts.fire : 1.6;

        this.stopLaser();

        this.state = 'laser_windup';
        this.stateTimer = windup;

        this.laserTelegraphActive = true;
        this.laserActive = false;

        this.laserAngle = this.angleTo(player);
        this.laserDuration = fire;

        // Tracking window: keep following the player for the full firing duration,
        // but with a limited turn rate so it feels fair (no teleport aim).
        // This avoids the "tracks a bit then shoots into nothing" feel.
        this.laserTrackTime = Math.min(2.5, fire);
        this.laserHitCooldown = 0;

        // Tunables
        this.laserTurnRate = 2.2; // rad/s during windup
        this.laserTurnRateFire = 1.2; // rad/s while firing (feels fair)
    }

    stopLaser() {
        this.laserActive = false;
        this.laserTelegraphActive = false;
        this.laserTrackTime = 0;
        this.laserHitCooldown = 0;
    }

    stateLaserWindup(dt, player) {
        this.vx = 0;
        this.vy = 0;

        // Smooth aim toward player (telegraph only)
        const targetAngle = this.angleTo(player);
        let angleDiff = targetAngle - this.laserAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const maxStep = this.laserTurnRate * dt;
        const step = Math.max(-maxStep, Math.min(maxStep, angleDiff));
        this.laserAngle += step;

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.state = 'laser_fire';
            this.laserTelegraphActive = false;
            this.laserActive = true;
        }
    }

    stateLaserFire(dt, player) {
        this.vx = 0;
        this.vy = 0;

        // Track for a short window, then mostly lock
        if (this.laserTrackTime > 0) {
            const targetAngle = this.angleTo(player);
            let angleDiff = targetAngle - this.laserAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const maxStep = this.laserTurnRateFire * dt;
            const step = Math.max(-maxStep, Math.min(maxStep, angleDiff));
            this.laserAngle += step;
            this.laserTrackTime -= dt;
        }

        // Laser damage (ray-like, fair width)
        const laserLength = 420;
        if (player) {
            this.laserHitCooldown = Math.max(0, this.laserHitCooldown - dt);

            const playerDist = this.distanceTo(player);
            if (playerDist < laserLength && this.laserHitCooldown <= 0) {
                const playerAngle = this.angleTo(player);
                let diff = playerAngle - this.laserAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;

                // Width: ~0.18rad (~10deg). Tight but not pixel perfect.
                if (Math.abs(diff) < 0.18) {
                    player.takeDamage(Math.floor(this.damage * 0.28));
                    this.laserHitCooldown = 0.18;
                }
            }
        }

        this.laserDuration -= dt;
        if (this.laserDuration <= 0) {
            this.stopLaser();
            this.state = 'idle';
        }
    }


    stateSummoning(dt, room) {
        this.vx = 0;
        this.vy = 0;

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.state = 'idle';
        }
    }

    stateBulletHell(dt, player) {
        this.vx = 0;
        this.vy = 0;

        // Duration of state
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.state = 'idle';
            return;
        }

        // Spiral pattern
        this.bulletHellTimer -= dt;
        if (this.bulletHellTimer <= 0) {
            this.bulletHellTimer = 0.18; // Slower fire rate for better spacing

            // Two spirals rotating in opposite directions
            const spiral1 = (Date.now() / 500) % (Math.PI * 2);
            const spiral2 = -(Date.now() / 500) % (Math.PI * 2);

            // Spawn 3 projectiles per tick (less density)
            for (let i = 0; i < 3; i++) {
                const angleOffset = (i / 3) * Math.PI * 2; // More spacing between bullets

                // Spiral 1
                Game.spawnProjectile(
                    this.centerX, this.centerY,
                    spiral1 + angleOffset,
                    Math.floor(this.damage * 0.4),
                    250, 600, 'enemy'
                );

                // Spiral 2 (only in later phases)
                if (this.phase >= 3) {
                    Game.spawnProjectile(
                        this.centerX, this.centerY,
                        spiral2 + angleOffset + Math.PI / 4,
                        Math.floor(this.damage * 0.4),
                        250, 600, 'enemy'
                    );
                }
            }

            AudioManager.play('shoot_enemy');
        }
    }

    doMeleeCombo(player) {
        this.attackTimer = this.attackCooldown;

        // 3-hit combo over time (simplified to single hit)
        if (this.distanceTo(player) < this.attackRange + 20) {
            player.takeDamage(this.damage);
            ParticleSystem.burst(player.centerX, player.centerY, 5, {
                color: '#ff0000', life: 0.3, size: 3, speed: 2
            });
        }
    }

    doRangedBarrage(player) {
        this.attackTimer = this.attackCooldown;
        const baseAngle = this.angleTo(player);

        // Spread of projectiles based on phase
        const count = 3 + this.phase * 2;
        const spread = Math.PI / 4;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * (spread / (count - 1));
            const angle = baseAngle + offset;

            Game.spawnProjectile(
                this.centerX,
                this.centerY,
                angle,
                this.damage,
                300 + this.phase * 50,
                500,
                'enemy'
            );
        }
    }

    doSpecialAttack(player, room) {
        this.specialTimer = this.specialCooldown;

        // Different special attacks based on phase
        if (this.phase === 1) {
            // Phase 1: Triple charge
            this.state = 'charge_windup';
            this.stateTimer = 0.5;
        } else if (this.phase === 2) {
            // Phase 2: Ground slam
            this.state = 'slam_windup';
            this.stateTimer = 0.4;
        } else if (this.phase >= 3) {
            // Phase 3: Laser sweep + summons
            this.startLaser(player, { windup: 0.75, fire: 1.8 });
        }
    }

    summonMinions(room) {
        this.summonTimer = this.summonCooldown;
        this.state = 'summoning';
        this.stateTimer = 1;

        // Summon effect
        ParticleSystem.burst(this.centerX, this.centerY, 25, {
            color: '#00ff00', life: 0.6, size: 5, speed: 4
        });

        // Spawn 2-3 enemies
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            const x = this.centerX + Math.cos(angle) * dist;
            const y = this.centerY + Math.sin(angle) * dist;

            const enemyType = Utils.randomChoice(['goblin', 'slime', 'skeleton']);
            const minion = createEnemy(enemyType, x, y, 0.7 + this.ngPlusLevel * 0.2);
            room.enemies.push(minion);
        }
    }

    takeDamage(amount, knockbackAngle = 0, knockbackForce = 0) {
        if (this.isInvulnerable) {
            ParticleSystem.burst(this.centerX, this.centerY, 3, {
                color: '#ffffff', life: 0.2, size: 2, speed: 2
            });
            return false;
        }

        // Burst tracking over ~1.2s to prevent instakill
        if (this._burstWindow <= 0) {
            this._burstWindow = 1.2;
            this._burstDamage = 0;
        }

        // Base final damage
        let final = Math.max(0, Math.floor(amount * (this.damageTakenMult || 1)));

        // Toughness active => reduce burst damage
        if (this.toughnessTimer > 0) {
            final = Math.max(1, Math.floor(final * (1 - this.toughnessReduce)));
        }

        this._burstDamage += final;

        // Trigger toughness if too much HP removed quickly
        if (this._burstDamage / this.maxHp > this.toughnessThreshold) {
            this.toughnessTimer = Math.max(this.toughnessTimer, 0.9);
            this._burstDamage = Math.floor(this._burstDamage * 0.35);
        }

        // Apply damage + reduced knockback
        this.hp -= final;
        if (knockbackForce > 0) {
            this.knockbackVx = Math.cos(knockbackAngle) * knockbackForce * 0.2;
            this.knockbackVy = Math.sin(knockbackAngle) * knockbackForce * 0.2;
        }

        ParticleSystem.hit(this.centerX, this.centerY, '#ffffff');
        AudioManager.play('hit');

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.active = false;

        // Epic death effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                ParticleSystem.burst(
                    this.centerX + (Math.random() - 0.5) * 40,
                    this.centerY + (Math.random() - 0.5) * 40,
                    20,
                    { color: '#ff00ff', life: 0.6, size: 6, speed: 4 }
                );
                Game.shake(5);
            }, i * 200);
        }

        // Final explosion
        setTimeout(() => {
            ParticleSystem.burst(this.centerX, this.centerY, 50, {
                color: '#ffd700', life: 1, size: 8, speed: 6
            });
            Game.shake(15);
            AudioManager.play('death');
        }, 1000);

        // Notify game of boss death (handled in Game.js)
        Game.onBossKilled(this);
    }

    // ── stateBoneSpread — Skeleton King: 8 proyectiles en abanico 160° ──
    stateBoneSpread(dt, player) {
        this.vx = 0; this.vy = 0;
        if (this.stateTimer > 0) {
            ParticleSystem.burst(this.centerX, this.centerY, 2,
                { color: '#ff4444', life: 0.2, size: 3, speed: 1 });
        }
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            const base = this.angleTo(player);
            const spread = (Math.PI * 8) / 9;
            const count = 8;
            for (let i = 0; i < count; i++) {
                const a = base - spread/2 + (spread / (count - 1)) * i;
                Game.spawnProjectile(this.centerX, this.centerY, a,
                    Math.floor(this.damage * 0.7), 260, 500, 'enemy');
            }
            if (window.AudioManager) AudioManager.play('shoot_enemy');
            this.state = 'idle';
        }
    }

    // ── stateWebTrap — Spider Queen: 3 proyectiles lentos que inmovilizan ──
    stateWebTrap(dt, player) {
        this.vx = 0; this.vy = 0;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            const base = this.angleTo(player);
            const offsets = [-0.25, 0, 0.25];
            for (const off of offsets) {
                const proj = Game.spawnProjectile(
                    this.centerX, this.centerY, base + off,
                    Math.floor(this.damage * 0.4), 160, 600, 'enemy',
                    ['web'], { webSlow: 0.35, webDuration: 2.0 }
                );
                if (proj) { proj.color = '#e8e8e8'; proj.radius = 6; }
            }
            this.state = 'idle';
        }
    }

    // ── stateEggBurst — Spider Queen: 2 huevos que eclosionan en minions ──
    stateEggBurst(dt, room) {
        this.vx = 0; this.vy = 0;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0 && !this._eggsSpawned) {
            this._eggsSpawned = true;
            this._eggs = [];
            for (let i = 0; i < 2; i++) {
                const ex = room.bounds.x + Utils.random(80, room.bounds.width - 80);
                const ey = room.bounds.y + Utils.random(80, room.bounds.height - 80);
                this._eggs.push({ x: ex, y: ey, active: true, hatched: false });
                ParticleSystem.burst(ex, ey, 8,
                    { color: '#ffffff', life: 0.5, size: 4, speed: 1 });
            }
        }
        if (this._eggsSpawned) {
            this._eggTimer = (this._eggTimer || 0) + dt;
            if (this._eggTimer >= 3.0) {
                for (const egg of (this._eggs || [])) {
                    if (!egg.hatched && egg.active) {
                        egg.hatched = true;
                        for (let j = 0; j < 3; j++) {
                            const minion = createEnemy('wisp',
                                egg.x + Utils.random(-20, 20),
                                egg.y + Utils.random(-20, 20), 0.6);
                            if (room.enemies) room.enemies.push(minion);
                        }
                        ParticleSystem.burst(egg.x, egg.y, 14,
                            { color: '#88ff44', life: 0.6, size: 4, speed: 3 });
                    }
                }
                this._eggsSpawned = false;
                this._eggTimer = 0;
                this._eggs = [];
                this.state = 'idle';
            }
        }
    }

    // ── stateMagmaPillar — Fire Lord: 3 pilares en linea con telegraph ──
    stateMagmaPillar(dt, player, room) {
        this.vx = 0; this.vy = 0;
        ParticleSystem.burst(this.centerX, this.centerY, 2,
            { color: '#ff6600', life: 0.3, size: 3, speed: 2 });
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            const base = this.angleTo(player);
            const distances = [100, 180, 260];
            for (const dist of distances) {
                const tx = this.centerX + Math.cos(base) * dist;
                const ty = this.centerY + Math.sin(base) * dist;
                if (room && typeof room.addBossStrike === 'function') {
                    room.addBossStrike(tx, ty, 40, 0.8, 0.2, Math.floor(this.damage * 0.9));
                } else {
                    Game.spawnProjectile(tx, ty, 0, Math.floor(this.damage * 0.9), 0, 60, 'enemy');
                }
            }
            this.state = 'idle';
        }
    }

    // ── stateHydraBite — Hydra: mordisco triple en cono frontal corto ──
    stateHydraBite(dt, player) {
        this.stateTimer -= dt;
        this.vx = 0; this.vy = 0;
        if (this.stateTimer <= 0) {
            if (player && this.distanceTo(player) < 100) {
                for (let i = 0; i < 3; i++) {
                    const a = this.angleTo(player) + Utils.random(-0.3, 0.3);
                    Game.spawnProjectile(this.centerX, this.centerY, a,
                        Math.floor(this.damage * 1.2), 350, 200, 'enemy');
                }
            }
            this.state = 'idle';
        }
    }

    draw(ctx) {
        if (!this.active) return;

        // Invulnerable flash
        if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw boss (larger sprite or colored rectangle)
        let sprite;
        if (this.isMoving) {
            sprite = this.sprites?.walk?.[this.direction]?.[this.animationFrame];
        } else {
            sprite = this.sprites?.idle?.[this.direction];
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.floor(this.x), Math.floor(this.y), this.width, this.height);
        } else {
            // Fallback: draw colored boss
            const gradient = ctx.createRadialGradient(
                this.centerX, this.centerY, 0,
                this.centerX, this.centerY, this.width / 2
            );
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.5, '#9900ff');
            gradient.addColorStop(1, '#660066');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Boss eyes
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 15, this.y + 20, 8, 8);
            ctx.fillRect(this.x + 41, this.y + 20, 8, 8);
        }

        ctx.globalAlpha = 1;

        // Boss HUD
        // IMPORTANT: avoid double HP bars.
        // The game renders a unified boss HUD in Game.drawBossHud().
        // Older boss code had its own HP bar here; keep it only if unified HUD is disabled.
        if (!(window.Game && Game._useUnifiedBossHud)) {
            const barWidth = 300;
            const barHeight = 20;
            const barX = (ctx.canvas.width / Game.scale - barWidth) / 2;
            const barY = 10;
            const hpPercent = this.hp / this.maxHp;

            ctx.fillStyle = '#222';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            let hpColor = '#ff3333';
            if (this.phase === 2) hpColor = '#ff6600';
            if (this.phase >= 3) hpColor = '#ff00ff';

            ctx.fillStyle = hpColor;
            ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * hpPercent, barHeight - 4);

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.bossName} - Phase ${this.phase}/${this.maxPhases}`, barX + barWidth / 2, barY + barHeight + 15);

            if (this.ngPlusLevel > 0) {
                ctx.fillStyle = '#ffff00';
                ctx.fillText(`NG+${this.ngPlusLevel}`, barX + barWidth / 2, barY + barHeight + 28);
            }
        }

        // Laser telegraph / beam
        if (this.laserTelegraphActive && this.state === 'laser_windup') {
            this.drawLaserTelegraph(ctx);
        }
        if (this.laserActive && this.state === 'laser_fire') {
            this.drawLaser(ctx);
        }
        if (this.state === 'special_move' && this.specialMove) {
            this.drawSpecialMove(ctx);
        }

        // CAMBIO 10: Dibujar huevos pendientes (Spider Queen egg_burst)
        if (this._eggs && this._eggs.length) {
            for (const egg of this._eggs) {
                if (!egg.active || egg.hatched) continue;
                const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
                ctx.save();
                ctx.globalAlpha = pulse;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#88ff44';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(egg.x, egg.y, 12, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                const remaining = Math.ceil(3.0 - (this._eggTimer || 0));
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(remaining, egg.x, egg.y + 4);
                ctx.restore();
            }
        }

        // CAMBIO 19: Telegraph del slam
        if (this._slamWarning && this._slamWarning.timer > 0) {
            this._slamWarning.timer -= 0.016;
            ctx.save();
            ctx.globalAlpha = (this._slamWarning.timer / 0.4) * 0.5;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this._slamWarning.x, this._slamWarning.y, this._slamWarning.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Charge warning indicator
        if (this.state === 'charge_windup') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            const lineLength = 200;
            ctx.lineTo(
                this.centerX + Math.cos(this.angleTo(this.target)) * lineLength,
                this.centerY + Math.sin(this.angleTo(this.target)) * lineLength
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }


    drawLaserTelegraph(ctx) {
        const laserLength = 420;
        const endX = this.centerX + Math.cos(this.laserAngle) * laserLength;
        const endY = this.centerY + Math.sin(this.laserAngle) * laserLength;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 10;

        ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);

        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
    }

    drawLaser(ctx) {
        const laserLength = 400;
        const endX = this.centerX + Math.cos(this.laserAngle) * laserLength;
        const endY = this.centerY + Math.sin(this.laserAngle) * laserLength;

        // Laser glow
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;

        // Laser beam
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Inner white beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}

// Boss configurations
const BossTypes = {
    guardian: {
        name: 'El Guardián',
        hp: 500,
        damage: 31,
        speed: 70,
        attackRange: 50,
        attackCooldown: 1.5,
        phases: 3,
        phaseThresholds: [0.66, 0.33],
        specialCooldown: 6,
        canSummon: false,
        summonCooldown: 12,
        chargeSpeed: 400,
        slamRadius: 100,
        rewardRarity: 'legendary',
        attackPatterns: ['melee', 'ranged', 'charge', 'slam']
    },
    demon_lord: {
        name: 'Señor Demonio',
        hp: 800,
        damage: 38,
        speed: 60,
        attackRange: 60,
        attackCooldown: 1.2,
        phases: 3,
        phaseThresholds: [0.70, 0.35],
        specialCooldown: 5,
        canSummon: true,
        summonCooldown: 8,
        chargeSpeed: 350,
        slamRadius: 120,
        rewardRarity: 'legendary',
        width: 72,
        height: 72,
        attackPatterns: ['ranged', 'bullet_hell', 'summon', 'laser', 'slam']
    },

    // Biome bosses used by BiomeDatabase
    skeleton_king: {
        name: 'Rey Esqueleto',
        hp: 900,
        damage: 35,
        speed: 65,
        attackRange: 65,
        attackCooldown: 1.0,
        phases: 3,
        phaseThresholds: [0.70, 0.35],
        specialCooldown: 5,
        canSummon: true,
        summonCooldown: 10,
        chargeSpeed: 420,
        slamRadius: 140,
        rewardRarity: 'legendary',
        width: 80,
        height: 80,
        attackPatterns: ['chase', 'ranged', 'bone_spread', 'summon', 'charge']
    },
    spider_queen: {
        name: 'Reina Araña',
        hp: 850,
        damage: 34,
        speed: 75,
        attackRange: 55,
        attackCooldown: 0.9,
        phases: 3,
        phaseThresholds: [0.75, 0.40],
        specialCooldown: 4,
        canSummon: true,
        summonCooldown: 8,
        chargeSpeed: 480,
        slamRadius: 120,
        rewardRarity: 'legendary',
        width: 78,
        height: 78,
        attackPatterns: ['ranged', 'web_trap', 'egg_burst', 'charge']
    },
    golem: {
        name: 'Gólem Antiguo',
        hp: 1100,
        damage: 42,
        speed: 55,
        attackRange: 85,
        attackCooldown: 1.2,
        phases: 3,
        phaseThresholds: [0.70, 0.30],
        specialCooldown: 6,
        canSummon: false,
        summonCooldown: 12,
        chargeSpeed: 380,
        slamRadius: 180,
        rewardRarity: 'legendary',
        width: 90,
        height: 90,
        attackPatterns: ['chase', 'slam', 'charge', 'ranged']
    },
    hydra: {
        name: 'Hidra',
        hp: 1250,
        damage: 41,
        speed: 60,
        attackRange: 80,
        attackCooldown: 1.0,
        phases: 3,
        phaseThresholds: [0.72, 0.34],
        specialCooldown: 5,
        canSummon: true,
        summonCooldown: 12,
        chargeSpeed: 420,
        slamRadius: 160,
        rewardRarity: 'legendary',
        width: 92,
        height: 92,
        attackPatterns: ['chase', 'ranged', 'hydra_bite', 'summon']
    },
    fire_lord: {
        name: 'Señor del Fuego',
        hp: 1400,
        damage: 46,
        speed: 62,
        attackRange: 90,
        attackCooldown: 0.9,
        phases: 3,
        phaseThresholds: [0.72, 0.34],
        specialCooldown: 4,
        canSummon: true,
        summonCooldown: 10,
        chargeSpeed: 520,
        slamRadius: 190,
        rewardRarity: 'legendary',
        width: 96,
        height: 96,
        attackPatterns: ['ranged', 'charge', 'magma_pillar', 'laser']
    },

    // === FINAL BOSS (end-of-run) ===
    final_boss: {
        name: 'EL CATACLISMO',
        hp: 2400,
        damage: 52,
        speed: 58,
        attackRange: 90,
        attackCooldown: 0.75,
        phases: 4,
        phaseThresholds: [0.75, 0.50, 0.25],
        specialCooldown: 3,
        canSummon: true,
        summonCooldown: 15,
        chargeSpeed: 500,
        slamRadius: 200,
        rewardRarity: 'legendary',
        width: 100,
        height: 100,
        attackPatterns: ['melee', 'ranged', 'charge', 'slam', 'laser', 'bullet_hell'],
        isFinalBoss: true
    }
};

// Localize boss display names via i18n (uses Codex lore tables).
try {
    if (window.i18n && typeof i18n.bossLore === 'function') {
        Object.keys(BossTypes).forEach(id => {
            const loc = i18n.bossLore(id);
            if (loc && loc.name) BossTypes[id].name = loc.name;
        });
    }
} catch (e) { }


// Create a boss for a specific biome/level
function createBoss(bossType, x, y, difficultyMult = 1, ngPlusLevel = 0) {
    return new Boss(x, y, bossType, difficultyMult, ngPlusLevel);
}

// Get boss type for specific biome
function getBossForBiome(biomeIndex, ngPlusLevel = 0) {
    // Fallback mapping if a biome has no explicit boss
    const bosses = ['guardian', 'skeleton_king', 'spider_queen', 'golem', 'hydra', 'fire_lord'];
    const idx = Math.max(0, Math.min(biomeIndex, bosses.length - 1));
    return bosses[idx] || 'guardian';
}

window.Boss = Boss;
window.BossTypes = BossTypes;
window.createBoss = createBoss;
window.getBossForBiome = getBossForBiome;
