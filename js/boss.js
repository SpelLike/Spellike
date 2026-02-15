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
        config.damage = Math.floor(config.damage * difficultyMult);
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
        ParticleSystem.burst(this.centerX, this.centerY, 40, {
            color: '#ff00ff', life: 0.8, size: 6, speed: 5
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

        const dist = this.distanceTo(player);
        const angle = this.angleTo(player);

        // Choose attack pattern based on distance and phase
        if (this.patternCooldown <= 0) {
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
        const patterns = [];

        // Always have melee chase as option
        patterns.push('chase');

        // Add ranged if far enough
        if (dist > 100) {
            patterns.push('ranged');
        }

        // Add charge attack in phase 2+
        if (this.phase >= 2 && dist > 150) {
            patterns.push('charge');
        }

        // Add ground slam in phase 2+ when close
        if (this.phase >= 2 && dist < 120) {
            patterns.push('slam');
        }

        // Add laser sweep in phase 3
        if (this.phase >= 3) {
            patterns.push('laser');
        }

        // Add bullet hell for final boss in later phases
        if (this.bossType === 'final_boss' && this.phase >= 2) {
            patterns.push('bullet_hell');
        }

        // Randomly select pattern
        const selectedPattern = Utils.randomChoice(patterns);
        this.startPattern(selectedPattern);
    }

    startPattern(pattern) {
        this.patternCooldown = 2 + Math.random() * 2;

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
        if (this.stateTimer <= 0) {
            this.state = 'slamming';
            this.stateTimer = 0.3;
        }
    }

    stateSlamming(dt, player, room) {
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
        damage: 20,
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
        damage: 25,
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
        height: 72
    },

    // Biome bosses used by BiomeDatabase
    skeleton_king: {
        name: 'Rey Esqueleto',
        hp: 900,
        damage: 22,
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
        height: 80
    },
    spider_queen: {
        name: 'Reina Araña',
        hp: 850,
        damage: 20,
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
        height: 78
    },
    golem: {
        name: 'Gólem Antiguo',
        hp: 1100,
        damage: 28,
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
        height: 90
    },
    hydra: {
        name: 'Hidra',
        hp: 1250,
        damage: 26,
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
        height: 92
    },
    fire_lord: {
        name: 'Señor del Fuego',
        hp: 1400,
        damage: 32,
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
        height: 96
    },

    // === FINAL BOSS (end-of-run) ===
    final_boss: {
        name: 'EL CATACLISMO',
        hp: 2400,
        damage: 38,
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