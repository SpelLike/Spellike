// ==========================================
// ARCANE DEPTHS - Enemy Classes (ENHANCED WITH NEW ENEMY TYPES)
// ==========================================

class Enemy extends Entity {
    static _nextId = 1;
    constructor(x, y, type, config = {}) {
        super(x, y, config.width || 32, config.height || 32);
        this._id = Enemy._nextId++; // stable room-level id
        this.type = type;

        this.sprites = Sprites.getEnemySprites(type);
        this.direction = 'down';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.2;
        this.isMoving = false;

        this.maxHp = config.hp || 20;
        this.hp = this.maxHp;
        this.damage = config.damage || 5;
        this.speed = config.speed || 60;
        this.baseSpeed = this.speed;
        this.baseDamage = this.damage;
        this.xpValue = config.xp || 10;
        this.goldValue = config.gold || Utils.random(2, 8);

        this.behavior = config.behavior || 'chase';
        this.attackRange = config.attackRange || 35;
        this.attackCooldown = config.attackCooldown || 1;
        this.attackTimer = 0;

        // Collision cooldown
        this.collisionCooldown = 0.5;
        this.collisionTimer = 0;

        this.isElite = config.isElite || false;
        this.isBoss = config.isBoss || false;
        this.isMiniBoss = config.isMiniBoss || false;
        this._miniRingTimer = config._miniRingTimer || 0;

        this.target = null;
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        this.state = 'idle';
        this.stateTimer = 0;

        // Burn/slow status effects
        this.burnDuration = 0;
        this.burnDamage = 0;
        this.slowDuration = 0;
        this.slowAmount = 1;

        // Poison status
        this.poisonDuration = 0;
        this.poisonDamage = 0;

        // Bomber specific
        this.explodeOnDeath = config.explodeOnDeath || false;
        this.explosionDamage = config.explosionDamage || 20;
        this.explosionRadius = config.explosionRadius || 60;

        // Summoner specific
        this.summonCooldown = config.summonCooldown || 5;
        this.summonTimer = this.summonCooldown;
        this.maxSummons = config.maxSummons || 3;
        this.currentSummons = 0;

        // Mage specific
        this.teleportCooldown = config.teleportCooldown || 4;
        this.teleportTimer = 0;
        this.projectileCount = config.projectileCount || 1;

        // Variant / elite modifiers support
        this.damageTakenMult = typeof config.damageTakenMult === 'number' ? config.damageTakenMult : 1;
        this.projectileSpeedMult = typeof config.projectileSpeedMult === 'number' ? config.projectileSpeedMult : 1;
        this.reflectPct = typeof config.reflectPct === 'number' ? config.reflectPct : 0;
        this.vampiricPct = typeof config.vampiricPct === 'number' ? config.vampiricPct : 0;
        this.eliteMods = Array.isArray(config.eliteMods) ? config.eliteMods.slice() : [];
        this.variantId = config.variantId || null;
        this.variantName = config.variantName || null;
        this.variantTimer = typeof config.variantTimer === 'number' ? config.variantTimer : 0;


        // Role-based AI (coordinated encounters)
        // When role is set, behavior becomes 'role' and reads RoomAIDirector signals.
        this.role = config.role || null; // 'healer','protector','sniper','trapper','commander'
        if (this.role) this.behavior = 'role';
        this.roleState = 'idle';
        this.roleStateTimer = 0;
        this.roleCooldown = 0;
        this.guardTargetId = -1;

        // Shields (used by commanders/protectors)
        this.shieldHp = 0;
        this.shieldTimer = 0;

        // Marked / debuffed
        this.markedTimer = 0;
        this.markedDamageMult = 1.0;
        this.debuffTimer = 0;
        this.debuffType = null;

        // Stuck safeguard (prevents rare cases of "enemy frozen doing nothing")
        this._stuckX = x;
        this._stuckY = y;
        this._stuckT = 0;
    }

    update(dt, player, room) {
        if (!this.active) return;

        // Temporary enrage (from room modifier)
        if (this.enragedTimer && this.enragedTimer > 0) {
            this.enragedTimer -= dt;
            this.speed = this.baseSpeed * 1.35;
            this.damage = Math.floor(this.baseDamage * 1.15);
        } else {
            this.speed = this.baseSpeed;
            this.damage = this.baseDamage;
            this.enragedTimer = 0;
        }

        this.target = player;
        this.attackTimer -= dt;
        this.teleportTimer -= dt;
        this.summonTimer -= dt;

        if (this.isMiniBoss) {
            this._miniRingTimer -= dt;
            if (this._miniRingTimer <= 0) {
                this._miniRingTimer = 2.6;
                this.fireMiniBossRing();
            }
        }

        // Status effects
        this.updateStatusEffects(dt);

        // Timed buffs/debuffs
        if (this.shieldTimer > 0) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldTimer = 0;
                this.shieldHp = 0;
            }
        }
        if (this.markedTimer > 0) this.markedTimer -= dt;
        if (this.debuffTimer > 0) {
            this.debuffTimer -= dt;
            if (this.debuffTimer <= 0) { this.debuffType = null; }
        }

        // Collision timer
        if (this.collisionTimer > 0) {
            this.collisionTimer -= dt;
        }

        this.stateTimer -= dt;

        // Apply knockback
        this.x += this.knockbackVx * dt;
        this.y += this.knockbackVy * dt;
        this.knockbackVx *= 0.85;
        this.knockbackVy *= 0.85;

        // Get effective speed (affected by slow)
        const effectiveSpeed = this.speed * (this.slowDuration > 0 ? this.slowAmount : 1);

        // Run behavior
        this.isMoving = false;
        switch (this.behavior) {
            case 'chase': this.behaviorChase(dt, effectiveSpeed); break;
            case 'ranged': this.behaviorRanged(dt, effectiveSpeed); break;
            case 'charger': this.behaviorCharger(dt, effectiveSpeed); break;
            case 'mage': this.behaviorMage(dt, effectiveSpeed, room); break;
            case 'bomber': this.behaviorBomber(dt, effectiveSpeed); break;
            case 'summoner': this.behaviorSummoner(dt, effectiveSpeed, room); break;
            case 'role': this.behaviorRole(dt, effectiveSpeed, room); break;
            default: this.behaviorChase(dt, effectiveSpeed);
        }


        // Variant procs (lightweight gameplay changes)
        if (this.variantId) {
            this.variantTimer -= dt;
            if (this.variantTimer <= 0) {
                this.variantTimer = 0.8 + Math.random() * 1.2;
                // Arcane-ish variants: occasional extra orb
                if (this.variantId === 'arcane' || this.variantId === 'radiant' || this.variantId === 'rift') {
                    if (this.target) {
                        const a = this.angleTo(this.target);
                        const spd = Math.floor(180 * (this.projectileSpeedMult || 1));
                        const dmg = Math.max(4, Math.floor(this.damage * 0.35));
                        Game.spawnProjectile(this.centerX, this.centerY, a, dmg, spd, 380, 'enemy', ['arcane_orb'], {});
                    }
                }
            }
        }

        // Update direction based on velocity
        if (Math.abs(this.vx) > 0 || Math.abs(this.vy) > 0) {
            this.isMoving = true;
            if (Math.abs(this.vx) > Math.abs(this.vy)) {
                this.direction = this.vx > 0 ? 'right' : 'left';
            } else {
                this.direction = this.vy > 0 ? 'down' : 'up';
            }
        }

        // Animation
        if (this.isMoving) {
            this.animationTimer += dt;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                const walkArr = (this.sprites && this.sprites.walk && this.sprites.walk[this.direction]) ? this.sprites.walk[this.direction] : null;
            const frameCount = Array.isArray(walkArr) && walkArr.length > 0 ? walkArr.length : 2;
            this.animationFrame = (this.animationFrame + 1) % frameCount;
            }
        } else {
            this.animationFrame = 0;
        }

        // Room bounds
        if (room) {
            this.x = Utils.clamp(this.x, room.bounds.x, room.bounds.x + room.bounds.width - this.width);
            this.y = Utils.clamp(this.y, room.bounds.y, room.bounds.y + room.bounds.height - this.height);
        }

        super.update(dt);

        // --- Stuck safeguard ---
        // If an enemy hasn't moved for a while even though it should be chasing, force a nudge.
        // This is intentionally conservative so it won't break normal kiting/role logic.
        try {
            const dx = this.x - this._stuckX;
            const dy = this.y - this._stuckY;
            const moved = Math.sqrt(dx * dx + dy * dy);
            if (moved < 0.35) this._stuckT += dt;
            else {
                this._stuckT = 0;
                this._stuckX = this.x;
                this._stuckY = this.y;
            }

            const shouldChase = (this.behavior === 'chase' || this.behavior === 'bomber' || this.behavior === 'summoner');
            if (this._stuckT > 1.2 && shouldChase && this.target) {
                const dist = this.distanceTo(this.target);
                if (dist > (this.attackRange || 25) + 10) {
                    const a = this.angleTo(this.target);
                    const spd = Math.max(20, this.speed);
                    this.vx = Math.cos(a) * spd;
                    this.vy = Math.sin(a) * spd;
                    this.state = 'idle';
                    this.stateTimer = 0;
                }
                this._stuckT = 0;
                this._stuckX = this.x;
                this._stuckY = this.y;
            }
        } catch (e) {}
    }

    updateStatusEffects(dt) {
        // Burn damage over time
        if (this.burnDuration > 0) {
            this.burnDuration -= dt;
            this.hp -= this.burnDamage * dt;

            // Burn particles
            if (Math.random() < 0.3) {
                ParticleSystem.burst(this.centerX, this.centerY, 1, {
                    color: '#ff6600', life: 0.3, size: 3, speed: 1
                });
            }

            if (this.hp <= 0) {
                this.die();
            }
        }

        // Poison damage over time
        if (this.poisonDuration > 0) {
            this.poisonDuration -= dt;
            this.hp -= this.poisonDamage * dt;

            if (Math.random() < 0.25) {
                ParticleSystem.burst(this.centerX, this.centerY, 1, {
                    color: '#7cb342', life: 0.3, size: 3, speed: 1
                });
            }

            if (this.hp <= 0) {
                this.die();
            }
        }

        // Slow duration countdown
        if (this.slowDuration > 0) {
            this.slowDuration -= dt;
        }
    }

    canDealContactDamage() {
        return this.collisionTimer <= 0;
    }

    onDealtContactDamage() {
        this.collisionTimer = this.collisionCooldown;
    }

    // Role-AI helper: optional melee "swing" used by some roles (e.g., Protector fallback).
    // The game already applies contact damage via collision in room.update(), so this is
    // conservative and shares the same collision cooldown to avoid double hits.
    tryAttack(target) {
        if (!target || !target.active) return false;
        if (this.attackTimer > 0) return false;

        const dist = Utils.distance(this.centerX, this.centerY, target.centerX, target.centerY);
        const range = (this.attackRange || 30);
        if (dist > range) return false;

        // Use collision cooldown as the "hit gate" so we don't double-hit with collision.
        if (!this.canDealContactDamage()) return false;

        const prevHp = target.hp;
        const dmg = Math.max(1, Math.floor(this.damage * 0.8));
        target.takeDamage(dmg);
        this.attackTimer = (this.attackCooldown || 1);
        this.onDealtContactDamage();

        const dealt = prevHp - target.hp;
        if (dealt > 0 && typeof this.onHitPlayer === 'function') this.onHitPlayer(dealt);

        // Small feedback (kept subtle so it doesn't look like a second invisible attack)
        try { ParticleSystem.hit(target.centerX, target.centerY, '#ffdddd'); } catch (e) {}
        return true;
    }

    onHitPlayer(damageDealt) {
        // Elite mod: Vampiric heals a % of damage dealt to the player
        if (this.vampiricPct > 0 && damageDealt > 0) {
            const heal = Math.max(1, Math.floor(damageDealt * this.vampiricPct));
            this.hp = Math.min(this.maxHp, this.hp + heal);
            ParticleSystem.burst(this.centerX, this.centerY, 2, { color: '#44ff88', life: 0.25, size: 2, speed: 1 });
        }
    }

    behaviorChase(dt, speed) {
        if (!this.target) return;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);

        if (dist > this.attackRange) {
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    behaviorRanged(dt, speed) {
        if (!this.target) return;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);
        const preferredDist = 180;

        if (dist < preferredDist - 30) {
            this.vx = -Math.cos(angle) * speed * 0.5;
            this.vy = -Math.sin(angle) * speed * 0.5;
        } else if (dist > preferredDist + 30) {
            this.vx = Math.cos(angle) * speed * 0.5;
            this.vy = Math.sin(angle) * speed * 0.5;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        if (this.attackTimer <= 0 && dist < 400) {
            this.shootAtPlayer();
        }
    }

    behaviorCharger(dt, speed) {
        if (!this.target) return;

        // Always chase, but perform a dash when in range and off cooldown.
        // States: idle -> windup -> charging -> recovery
        if (this.chargeCooldown == null) this.chargeCooldown = 1.8;
        if (this.chargeCooldownTimer == null) this.chargeCooldownTimer = 0;
        if (this.chargeCooldownTimer > 0) this.chargeCooldownTimer -= dt;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);

        if (this.state === 'idle') {
            // Chase
            if (dist > this.attackRange) {
                this.vx = Math.cos(angle) * speed * 0.9;
                this.vy = Math.sin(angle) * speed * 0.9;
            } else {
                this.vx = Math.cos(angle) * speed * 0.4;
                this.vy = Math.sin(angle) * speed * 0.4;
            }

            // Trigger charge
            if (dist < 260 && this.chargeCooldownTimer <= 0) {
                this.state = 'windup';
                this.stateTimer = 0.55;
                this.chargeAngle = angle;
                this.vx = 0;
                this.vy = 0;
            }
        } else if (this.state === 'windup') {
            // Telegraph: tiny shake / glow
            if (Math.random() < 0.35) {
                ParticleSystem.magic(this.centerX, this.centerY, '#ffcc00');
            }
            if (this.stateTimer <= 0) {
                this.state = 'charging';
                this.stateTimer = 0.55;
                // lock angle on release for fairness
            }
        } else if (this.state === 'charging') {
            const dashSpeed = speed * 6.2;
            this.vx = Math.cos(this.chargeAngle) * dashSpeed;
            this.vy = Math.sin(this.chargeAngle) * dashSpeed;

            if (this.stateTimer <= 0) {
                this.state = 'recovery';
                this.stateTimer = 0.75;
                this.vx = 0;
                this.vy = 0;
                this.chargeCooldownTimer = this.chargeCooldown;
            }
        } else if (this.state === 'recovery') {
            // Keep pressure: slow chase instead of standing still
            if (dist > this.attackRange) {
                this.vx = Math.cos(angle) * speed * 0.6;
                this.vy = Math.sin(angle) * speed * 0.6;
            } else {
                this.vx = 0;
                this.vy = 0;
            }
            if (this.stateTimer <= 0) {
                this.state = 'idle';
            }
        }
    }

    // NEW: Mage behavior - ranged with teleport - ranged with teleport
    behaviorMage(dt, speed, room) {
        if (!this.target) return;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);
        const preferredDist = 200;

        // Teleport away if player gets too close
        if (dist < 80 && this.teleportTimer <= 0) {
            this.teleport(room);
        }

        // Maintain distance
        if (dist < preferredDist - 40) {
            this.vx = -Math.cos(angle) * speed * 0.7;
            this.vy = -Math.sin(angle) * speed * 0.7;
        } else if (dist > preferredDist + 40) {
            this.vx = Math.cos(angle) * speed * 0.5;
            this.vy = Math.sin(angle) * speed * 0.5;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Shoot projectiles
        if (this.attackTimer <= 0 && dist < 350) {
            this.shootMageProjectiles();
        }
    }

    teleport(room) {
        if (!room) return;
        this.teleportTimer = this.teleportCooldown;

        // Teleport to random position away from player
        const targetAngle = this.angleTo(this.target);
        const teleportAngle = targetAngle + Math.PI + (Math.random() - 0.5) * Math.PI;
        const teleportDist = 150 + Math.random() * 100;

        let newX = this.x + Math.cos(teleportAngle) * teleportDist;
        let newY = this.y + Math.sin(teleportAngle) * teleportDist;

        // Clamp to room bounds
        newX = Utils.clamp(newX, room.bounds.x + 20, room.bounds.x + room.bounds.width - this.width - 20);
        newY = Utils.clamp(newY, room.bounds.y + 20, room.bounds.y + room.bounds.height - this.height - 20);

        // Teleport effect at old position
        ParticleSystem.burst(this.centerX, this.centerY, 15, {
            color: '#9c27b0', life: 0.4, size: 4, speed: 3
        });

        this.x = newX;
        this.y = newY;

        // Teleport effect at new position
        ParticleSystem.burst(this.centerX, this.centerY, 15, {
            color: '#9c27b0', life: 0.4, size: 4, speed: 3
        });

        AudioManager.play('dash');
    }

    shootMageProjectiles() {
        if (!this.target) return;
        this.attackTimer = this.attackCooldown;

        const baseAngle = this.angleTo(this.target);
        const spread = Math.PI / 8;

        // Shoot multiple projectiles
        for (let i = 0; i < this.projectileCount; i++) {
            const offset = (i - (this.projectileCount - 1) / 2) * spread;
            const angle = baseAngle + offset;

            Game.spawnProjectile(
                this.centerX,
                this.centerY,
                angle,
                this.damage,
                300,
                600,
                'enemy'
            );
        }
    }

    // NEW: Bomber behavior - rushes player and explodes
    behaviorBomber(dt, speed) {
        if (!this.target) return;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);

        // Always chase, faster when closer
        const speedMult = dist < 100 ? 1.5 : 1;
        this.vx = Math.cos(angle) * speed * speedMult;
        this.vy = Math.sin(angle) * speed * speedMult;

        // Pulse effect when close (warning)
        if (dist < 60) {
            if (Math.random() < 0.2) {
                ParticleSystem.burst(this.centerX, this.centerY, 2, {
                    color: '#ff0000', life: 0.2, size: 3, speed: 2
                });
            }
        }

        // Explode on contact is handled in die() when explodeOnDeath is true
    }

    // NEW: Summoner behavior - stays back and summons minions
    behaviorSummoner(dt, speed, room) {
        if (!this.target) return;

        const dist = this.distanceTo(this.target);
        const angle = this.angleTo(this.target);
        const preferredDist = 250;

        // Stay far from player
        if (dist < preferredDist - 50) {
            this.vx = -Math.cos(angle) * speed * 0.5;
            this.vy = -Math.sin(angle) * speed * 0.5;
        } else if (dist > preferredDist + 50) {
            this.vx = Math.cos(angle) * speed * 0.3;
            this.vy = Math.sin(angle) * speed * 0.3;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Summon minions
        if (this.summonTimer <= 0 && this.currentSummons < this.maxSummons && room) {
            this.summonMinion(room);
        }
    }

    summonMinion(room) {
        this.summonTimer = this.summonCooldown;

        // Summon effect
        ParticleSystem.burst(this.centerX, this.centerY, 20, {
            color: '#00ff00', life: 0.5, size: 4, speed: 3
        });

        // Spawn a slime minion nearby
        const angle = Math.random() * Math.PI * 2;
        const dist = 40;
        const x = this.centerX + Math.cos(angle) * dist;
        const y = this.centerY + Math.sin(angle) * dist;

        const minion = createEnemy('slime', x, y, 0.8);
        minion.goldValue = 1;
        minion.xpValue = 3;
        room.enemies.push(minion);

        this.currentSummons++;
    }

    shootAtPlayer() {
        if (!this.target) return;
        this.attackTimer = this.attackCooldown;

        const angle = this.angleTo(this.target);
        Game.spawnProjectile(
            this.centerX,
            this.centerY,
            angle,
            this.damage,
            250,
            500,
            'enemy'
        );
    }

// ----------------------------------------------------------
// ROLE AI: coordinated behavior driven by RoomAIDirector signals
// ----------------------------------------------------------
behaviorRole(dt, speed, room) {
    if (!this.target) return;

    // Read room signals (blackboard)
    const bb = room && room.director ? room.director.bb : null;
    const player = this.target;

    // Helper: steer towards point with simple velocity (no expensive pathing)
    const steerTo = (tx, ty, desiredSpeed) => {
        const a = Math.atan2(ty - this.centerY, tx - this.centerX);
        this.vx = Math.cos(a) * desiredSpeed;
        this.vy = Math.sin(a) * desiredSpeed;
    };

    const steerAwayFrom = (tx, ty, desiredSpeed) => {
        const a = Math.atan2(this.centerY - ty, this.centerX - tx);
        this.vx = Math.cos(a) * desiredSpeed;
        this.vy = Math.sin(a) * desiredSpeed;
    };

    const distToPlayer = this.distanceTo(player);

    // Cooldowns
    if (this.roleCooldown > 0) this.roleCooldown -= dt;

    // Resolve protect target (id stored in blackboard)
    let protectTarget = null;
    if (bb && typeof bb.protectTargetId === 'number' && bb.protectTargetId >= 0 && room && room.enemies) {
        protectTarget = room.enemies.find(e => e && e.active && e._id === bb.protectTargetId) || null;
    }

    // Default movement
    this.vx = 0; this.vy = 0;

    // Role logic
    switch (this.role) {
        case 'healer': {
            // Stay at medium distance, behind protector if exists
            const idealMin = 170, idealMax = 260;
            const fallbackX = (room.bounds.x + room.bounds.width * 0.5);
            const fallbackY = (room.bounds.y + room.bounds.height * 0.4);

            // Heal priority: elites + summoners first
            if (room && room.enemies && this.roleCooldown <= 0) {
                const candidates = room.enemies.filter(e => e && e.active && e !== this && !e.isBoss);
                let best = null;
                let bestScore = -999;
                for (const e of candidates) {
                    const hpPct = e.hp / Math.max(1, e.maxHp);
                    if (hpPct >= 0.95) continue;
                    let score = (1 - hpPct) * 10;
                    if (e.isElite) score += 6;
                    if (e.behavior === 'summoner' || e.type === 'summoner') score += 4;
                    score -= Utils.distance(this.centerX, this.centerY, e.centerX, e.centerY) / 120;
                    if (score > bestScore) { bestScore = score; best = e; }
                }
                if (best && bestScore > 0) {
                    // Heal pulse
                    const healAmt = Math.max(6, Math.floor(this.damage * 0.9));
                    best.hp = Math.min(best.maxHp, best.hp + healAmt);
                    ParticleSystem.burst(best.centerX, best.centerY, 10, { color: '#44ff88', life: 0.4, size: 4, speed: 2 });
                    AudioManager.play('pickup');
                    this.roleCooldown = 3.2;
                }
            }

            // If player pressures healer, kite to protector or away
            if (distToPlayer < idealMin) {
                if (protectTarget) {
                    steerTo(protectTarget.centerX, protectTarget.centerY, speed * 1.05);
                } else {
                    steerAwayFrom(player.centerX, player.centerY, speed * 1.15);
                }
            } else if (distToPlayer > idealMax) {
                // Reposition closer to room core, not directly to player
                const tx = protectTarget ? protectTarget.centerX : fallbackX;
                const ty = protectTarget ? protectTarget.centerY : fallbackY;
                steerTo(tx, ty, speed * 0.9);
            } else {
                // Light strafe
                const a = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX) + Math.PI / 2;
                this.vx = Math.cos(a) * speed * 0.35;
                this.vy = Math.sin(a) * speed * 0.35;
            }

            // Panic mode if alone (no other allies alive)
            const alliesAlive = room && room.enemies ? room.enemies.filter(e => e && e.active && e !== this && !e.isBoss).length : 0;
            if (alliesAlive <= 0 && this.roleCooldown <= 0) {
                // Debuff shot (slow-ish)
                const a = this.angleTo(player);
                Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(4, Math.floor(this.damage * 0.6)), 190, 420, 'enemy', ['debuff'], { slow: 0.7, slowDuration: 1.8 });
                this.roleCooldown = 2.6;
            }
            break;
        }

        case 'protector': {
            // Stick to protected target; intercept player line; peel if player close
            if (protectTarget) {
                const d = Utils.distance(this.centerX, this.centerY, protectTarget.centerX, protectTarget.centerY);
                if (d > 70) steerTo(protectTarget.centerX, protectTarget.centerY, speed * 1.05);
                else {
                    // Orbit
                    const ang = Math.atan2(this.centerY - protectTarget.centerY, this.centerX - protectTarget.centerX) + 1.2 * dt;
                    this.vx = Math.cos(ang) * speed * 0.25;
                    this.vy = Math.sin(ang) * speed * 0.25;
                }

                const playerToProt = Utils.distance(player.centerX, player.centerY, protectTarget.centerX, protectTarget.centerY);
                if (playerToProt < 110 && this.roleCooldown <= 0) {
                    // Peel dash (knockback)
                    const a = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
                    this.knockbackVx = Math.cos(a) * 220;
                    this.knockbackVy = Math.sin(a) * 220;
                    player.takeDamage(Math.max(3, Math.floor(this.damage * 0.35)));
                    // Push player away from protected
                    const pushA = Math.atan2(player.centerY - protectTarget.centerY, player.centerX - protectTarget.centerX);
                    player.knockbackVx = Math.cos(pushA) * 260;
                    player.knockbackVy = Math.sin(pushA) * 260;
                    ParticleSystem.burst(player.centerX, player.centerY, 10, { color: '#88ccff', life: 0.35, size: 4, speed: 3 });
                    this.roleCooldown = 3.0;
                }

                // Short shield on protected if focused
                if (bb && bb.focusPlayer && this.roleCooldown <= 0 && protectTarget.shieldHp <= 0) {
                    protectTarget.shieldHp = Math.max(10, Math.floor(protectTarget.maxHp * 0.12));
                    protectTarget.shieldTimer = 2.2;
                    ParticleSystem.burst(protectTarget.centerX, protectTarget.centerY, 10, { color: '#88ccff', life: 0.35, size: 4, speed: 2 });
                    this.roleCooldown = 4.0;
                }
            } else {
                // No protect target: behave as tanky chaser
                if (distToPlayer > 55) steerTo(player.centerX, player.centerY, speed);
                else this.tryAttack(player);
            }
            break;
        }

        case 'sniper': {
            // Seek LoS-ish angles (cheap: corner-ish anchors), kite when rushed, shoot while moving
            const rushDist = 140;
            const anchor = bb && bb.holdZone ? bb.holdZone : { x: room.bounds.x + room.bounds.width / 2, y: room.bounds.y + room.bounds.height / 2 };
            const points = [
                { x: room.bounds.x + 90, y: room.bounds.y + 90 },
                { x: room.bounds.x + room.bounds.width - 90, y: room.bounds.y + 90 },
                { x: room.bounds.x + 90, y: room.bounds.y + room.bounds.height - 90 },
                { x: room.bounds.x + room.bounds.width - 90, y: room.bounds.y + room.bounds.height - 90 }
            ];

            // Pick point far from player
            let best = points[0], bestD = -1;
            for (const pt of points) {
                const d = Utils.distance(pt.x, pt.y, player.centerX, player.centerY);
                if (d > bestD) { bestD = d; best = pt; }
            }

            if (distToPlayer < rushDist) {
                steerAwayFrom(player.centerX, player.centerY, speed * 1.25);
                // shoot while kiting
                if (this.attackTimer <= 0) {
                    const a = this.angleTo(player);
                    Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(8, Math.floor(this.damage * 1.25)), 260, 650, 'enemy', ['sniper'], {});
                    this.attackTimer = 1.6;
                    AudioManager.play('shoot');
                }
            } else {
                // Move to angle and fire
                const dToBest = Utils.distance(this.centerX, this.centerY, best.x, best.y);
                if (dToBest > 20) steerTo(best.x, best.y, speed * 0.95);
                if (this.attackTimer <= 0) {
                    const a = this.angleTo(player);
                    Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(10, Math.floor(this.damage * 1.35)), 270, 720, 'enemy', ['arrow'], {});
                    this.attackTimer = 2.0;
                    AudioManager.play('shoot');
                }
            }

            // If there is a protector/tank, try to stand behind it (cheap: bias toward protected)
            if (protectTarget && distToPlayer > rushDist) {
                const b = Math.atan2(this.centerY - protectTarget.centerY, this.centerX - protectTarget.centerX);
                this.vx += Math.cos(b) * speed * 0.15;
                this.vy += Math.sin(b) * speed * 0.15;
            }
            break;
        }

        case 'trapper': {
            // Place mines to cut routes; occasionally push player into hazards
            if (room && this.roleCooldown <= 0) {
                // Place mine at predicted player pos (simple)
                const px = player.centerX + (player.vx || 0) * 0.35;
                const py = player.centerY + (player.vy || 0) * 0.35;
                room.addTrap({ x: Utils.clamp(px, room.bounds.x + 40, room.bounds.x + room.bounds.width - 40), y: Utils.clamp(py, room.bounds.y + 60, room.bounds.y + room.bounds.height - 40), r: 22, dmg: Math.max(6, Math.floor(this.damage * 0.8)), slow: 0.55, slowDur: 1.6, arm: 0.4 });
                ParticleSystem.burst(px, py, 8, { color: '#ffcc33', life: 0.35, size: 3, speed: 2 });
                this.roleCooldown = 2.9;
            }

            // Keep distance (not dumb chase)
            if (distToPlayer < 140) steerAwayFrom(player.centerX, player.centerY, speed * 1.1);
            else {
                // Hold zone / center defense
                const hz = bb && bb.holdZone ? bb.holdZone : { x: room.bounds.x + room.bounds.width / 2, y: room.bounds.y + room.bounds.height / 2 };
                steerTo(hz.x, hz.y, speed * 0.55);
            }

            // Occasional shove shot (knockback) toward hazards
            if (this.attackTimer <= 0 && distToPlayer < 280) {
                const a = this.angleTo(player);
                Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(4, Math.floor(this.damage * 0.6)), 210, 520, 'enemy', ['push'], { knockback: 180 });
                this.attackTimer = 2.4;
                AudioManager.play('shoot');
            }
            break;
        }

        case 'commander': {
            // Doesn't hit hard: buffs, shields, focus calls
            // Maintain distance
            if (distToPlayer < 200) steerAwayFrom(player.centerX, player.centerY, speed * 1.05);
            else if (distToPlayer > 320) steerTo(player.centerX, player.centerY, speed * 0.6);

            // Call play: buff allies
            if (room && room.enemies && this.roleCooldown <= 0) {
                const allies = room.enemies.filter(e => e && e.active && e !== this && !e.isBoss);
                for (const a of allies) {
                    // haste/enrage
                    a.enragedTimer = Math.max(a.enragedTimer || 0, 2.2);
                    // shield small
                    if (!a.shieldHp || a.shieldHp <= 0) {
                        a.shieldHp = Math.max(8, Math.floor(a.maxHp * 0.08));
                        a.shieldTimer = 2.0;
                    }
                }
                // Mark focus
                if (bb) bb.focusPlayer = true;
                ParticleSystem.burst(this.centerX, this.centerY, 14, { color: '#b388ff', life: 0.45, size: 4, speed: 2 });
                AudioManager.play('pickup');
                this.roleCooldown = 5.5;
            }

            // Light poke shot
            if (this.attackTimer <= 0 && distToPlayer < 360) {
                const a = this.angleTo(player);
                Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(3, Math.floor(this.damage * 0.55)), 220, 520, 'enemy', ['orb'], {});
                this.attackTimer = 2.7;
            }
            break;
        }

        default:
            this.behaviorChase(dt, speed);
    }
}

    fireMiniBossRing() {
        if (!this.active) return;
        // Telegraph
        ParticleSystem.burst(this.centerX, this.centerY, 12, { color: '#b388ff', life: 0.5, size: 4, speed: 2 });
        AudioManager.play('shoot');

        const count = 12;
        const base = Utils.random(0, Math.PI * 2);
        for (let i = 0; i < count; i++) {
            const a = base + (i / count) * Math.PI * 2;
            Game.spawnProjectile(
                this.centerX,
                this.centerY,
                a,
                Math.max(6, Math.floor(this.damage * 0.7)),
                180,
                420,
                'enemy',
                ['mini_ring'],
                {}
            );
        }
    }

    takeDamage(amount, knockbackAngle = 0, knockbackForce = 0) {
        let amt = amount;
        // Marked target takes increased damage (Hunter Mark relic)
        if (this.markedTimer > 0 && this.markedDamageMult && this.markedDamageMult !== 1) {
            amt = Math.floor(amt * this.markedDamageMult);
        }
        const final = Math.max(0, Math.floor(amt * (this.damageTakenMult || 1)));

        // Shield absorbs damage first
        if (this.shieldHp && this.shieldHp > 0) {
            const absorbed = Math.min(this.shieldHp, final);
            this.shieldHp -= absorbed;
            const leftover = final - absorbed;
            if (leftover > 0) this.hp -= leftover;
            // Visual hint
            ParticleSystem.hit(this.centerX, this.centerY, '#88ccff');
        } else {
            this.hp -= final;
        }

        if (knockbackForce > 0) {
            this.knockbackVx = Math.cos(knockbackAngle) * knockbackForce;
            this.knockbackVy = Math.sin(knockbackAngle) * knockbackForce;
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

        // Bomber explosion on death
        if (this.explodeOnDeath) {
            this.doExplosion();
        }
        // Global curse/mutation: enemies explode on death (not bosses)
        if (!this.isBoss && window.Game && ((Game.modifiers && Game.modifiers.enemyExplodeOnDeath) || (Game.biomeMutation && Game.biomeMutation.enemyExplodeOnDeath))) {
            this.doExplosion();
        }


        // Variant: Crystal shards on death
        if (this.variantId === 'crystal_shards') {
            const count = 6;
            const base = Utils.random(0, Math.PI * 2);
            for (let i = 0; i < count; i++) {
                const a = base + (i / count) * Math.PI * 2;
                const dmg = Math.max(3, Math.floor(this.damage * 0.25));
                Game.spawnProjectile(this.centerX, this.centerY, a, dmg, 220, 360, 'enemy', ['shard'], {});
            }
        }
        // Variant: Toxic burst on death
        if (this.variantId === 'toxic_burst') {
            ParticleSystem.burst(this.centerX, this.centerY, 18, { color: '#7cb342', life: 0.5, size: 5, speed: 3 });
            if (this.target) {
                const dist = this.distanceTo(this.target);
                if (dist < 110) {
                    this.target.takeDamage(Math.max(6, Math.floor(this.damage * 0.4)));
                }
            }
        }

        ParticleSystem.death(this.centerX, this.centerY, '#ff6666');
        Game.onEnemyKilled(this);
    }

    doExplosion() {
        // Visual explosion
        ParticleSystem.burst(this.centerX, this.centerY, 30, {
            color: '#ff6600', life: 0.5, size: 6, speed: 5
        });
        AudioManager.play('hit');

        // Damage player if close
        if (this.target) {
            const distToPlayer = this.distanceTo(this.target);
            if (distToPlayer < this.explosionRadius) {
                this.target.takeDamage(this.explosionDamage);
            }
        }
    }

    draw(ctx, room = null, player = null) {
        if (!this.active) return;

        // Darkness modifier: enemies are invisible outside the player's light radius (bosses stay visible)
        if (room && player && !this.isBoss) {
            try {
                const dark = (room.roomModifiers || []).find(m => m.id === 'darkness');
                if (dark) {
                    const d = Utils.distance(this.centerX, this.centerY, player.centerX, player.centerY);
                    if (d > (dark.radius + 8)) return;
                }
            } catch (e) { /* ignore */ }
        }

        if (room && player && !this.isBoss) {
            try {
                const dark = (room.roomModifiers || []).find(m => m.id === 'darkness');
                if (dark) {
                    const d = Utils.distance(this.centerX, this.centerY, player.centerX, player.centerY);
                    if (d <= (dark.radius + 8)) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(230, 230, 255, 0.55)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
                        ctx.restore();
                    }
                }
            } catch (e) {}
        }



// Outline in darkness (fairness): when inside light radius, give a soft outline
if (room && player && !this.isBoss) {
    try {
        const dark = (room.roomModifiers || []).find(m => m.id === 'darkness');
        if (dark) {
            const d = Utils.distance(this.centerX, this.centerY, player.centerX, player.centerY);
            if (d <= (dark.radius + 8)) {
                ctx.save();
                ctx.strokeStyle = 'rgba(230, 230, 255, 0.65)';
                ctx.lineWidth = 2;
                ctx.strokeRect(Math.floor(this.x) - 1, Math.floor(this.y) - 1, this.width + 2, this.height + 2);
                ctx.restore();
            }
        }
    } catch (e) {}
}

        // Slow effect tint
        if (this.slowDuration > 0) {
            ctx.filter = 'hue-rotate(180deg)';
        }

        let sprite;
        if (this.isMoving) {
            const walkArr = this.sprites.walk[this.direction];
        const idx = (Array.isArray(walkArr) && walkArr.length > 0) ? (this.animationFrame % walkArr.length) : 0;
        sprite = walkArr[idx];
        } else {
            sprite = this.sprites.idle[this.direction];
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.floor(this.x), Math.floor(this.y));
        } else {
            // Fallback colored rectangle if no sprite
            ctx.fillStyle = this.getDefaultColor();
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.filter = 'none';

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.width;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = this.isBoss ? '#ff00ff' : (this.isElite ? '#ffd700' : '#ff3333');
            ctx.fillRect(this.x, this.y - 8, barWidth * hpPercent, barHeight);
        }

        // Elite / Variant indicator
        if (this.isElite) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px monospace';
            const starX = this.x + 2;
            const starY = this.y - 12;
            ctx.fillText('★', starX, starY);
            if (this.eliteMods && this.eliteMods.length) {
                const mods = this.eliteMods.map(id => (window.getEliteModAbbr ? getEliteModAbbr(id) : id.slice(0, 3).toUpperCase())).join(' ');
                ctx.fillText(mods, starX + 12, starY);
            }
        }
        if (this.variantName && !this.isBoss) {
            ctx.fillStyle = '#b388ff';
            ctx.font = '9px monospace';
            ctx.fillText(this.variantName, this.x, this.y + this.height + 10);
        }

        // Burn effect indicator
        if (this.burnDuration > 0) {
            ctx.fillStyle = '#ff6600';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        }
    }

    getDefaultColor() {
        const colors = {
            goblin: '#4CAF50',
            skeleton: '#E0E0E0',
            slime: '#8BC34A',
            archer: '#795548',
            charger: '#F44336',
            mage: '#9C27B0',
            bomber: '#FF5722',
            summoner: '#00BCD4',
            stalker: '#7b1fa2',
            brute: '#6d4c41',
            wisp: '#26c6da',
            turret: '#8d6e63'
        };
        return colors[this.type] || '#888';
    }
}

// Enhanced enemy types with new enemies
const EnemyTypes = {
    goblin: { hp: 25, damage: 8, speed: 80, behavior: 'chase', attackRange: 30, attackCooldown: 1, xp: 10 },
    skeleton: { hp: 35, damage: 10, speed: 60, behavior: 'chase', attackRange: 35, attackCooldown: 1.2, xp: 15 },
    slime: { hp: 18, damage: 5, speed: 50, behavior: 'chase', attackRange: 25, attackCooldown: 0.8, xp: 8 },
    archer: { hp: 20, damage: 12, speed: 50, behavior: 'ranged', attackCooldown: 2, xp: 15 },
    charger: { hp: 50, damage: 18, speed: 70, behavior: 'charger', attackRange: 45, xp: 25, width: 40, height: 40 },

    // NEW ENEMY TYPES
    mage: {
        hp: 30, damage: 15, speed: 55, behavior: 'mage',
        attackCooldown: 1.5, xp: 20,
        teleportCooldown: 3, projectileCount: 3
    },
    bomber: {
        hp: 25, damage: 10, speed: 100, behavior: 'bomber',
        attackRange: 20, xp: 18,
        explodeOnDeath: true, explosionDamage: 25, explosionRadius: 70
    },
    summoner: {
        hp: 60, damage: 8, speed: 40, behavior: 'summoner',
        attackCooldown: 3, xp: 30, width: 36, height: 36,
        summonCooldown: 4, maxSummons: 4
    }

    ,
    // Extra enemies (for new biomes / variety)
    stalker: { hp: 22, damage: 9, speed: 120, behavior: 'chase', attackRange: 28, attackCooldown: 0.9, xp: 14 },
    brute: { hp: 80, damage: 16, speed: 45, behavior: 'chase', attackRange: 40, attackCooldown: 1.4, xp: 28, width: 44, height: 44 },
    wisp: { hp: 18, damage: 11, speed: 70, behavior: 'ranged', attackCooldown: 1.6, xp: 16 },
    turret: { hp: 55, damage: 14, speed: 0, behavior: 'ranged', attackCooldown: 1.2, xp: 22, width: 36, height: 36 }

};

// ----------------------------------------------------------
// BIOME VARIANTS (adds flavor without new enemy types)
// ----------------------------------------------------------

const BiomeVariantPool = {
    forest:   [{ id: 'thorned',        name: 'Espinoso',    chance: 0.35, hpMult: 1.05, speedMult: 1.08 }],
    crypt:    [{ id: 'haunted',        name: 'Maldito',     chance: 0.35, hpMult: 1.08 }],
    crystal:  [{ id: 'crystal_shards', name: 'Cristalino',  chance: 0.35, dmgMult: 1.05 }],
    ruins:    [{ id: 'armored',        name: 'Blindado',    chance: 0.40, hpMult: 1.15, damageTakenMult: 0.85 }],
    swamp:    [{ id: 'toxic_burst',    name: 'Tóxico',      chance: 0.40, speedMult: 1.05 }],
    volcano:  [{ id: 'molten',         name: 'Fundido',     chance: 0.40, dmgMult: 1.10, explodeOnDeath: true }],
    tundra:   [{ id: 'frostbite',      name: 'Escarcha',    chance: 0.35, hpMult: 1.08 }],
    library:  [{ id: 'arcane',         name: 'Arcano',      chance: 0.40, projectileSpeedMult: 1.15 }],
    clockwork:[{ id: 'overclocked',    name: 'Overclock',   chance: 0.40, speedMult: 1.10 }],
    abyss:    [{ id: 'void',           name: 'Del Vacío',   chance: 0.35, hpMult: 1.10 }],
    skytemple:[{ id: 'radiant',        name: 'Radiante',    chance: 0.35, projectileSpeedMult: 1.10 }],
    voidlands:[{ id: 'rift',           name: 'Grieta',      chance: 0.35, hpMult: 1.12 }]
};

function applyBiomeVariantToEnemy(enemy, biomeId) {
    if (!enemy || enemy.isBoss || enemy.isMiniBoss) return;

    const pool = BiomeVariantPool[biomeId];
    if (!pool || pool.length === 0) return;

    const variant = pool[0];
    const p = enemy.isElite ? Math.min(0.75, variant.chance + 0.25) : variant.chance;
    if (Math.random() > p) return;

    enemy.variantId = variant.id;
    enemy.variantName = variant.name;
    enemy.variantTimer = 0.6 + Math.random() * 1.0;

    if (variant.hpMult) {
        enemy.maxHp = Math.floor(enemy.maxHp * variant.hpMult);
        enemy.hp = enemy.maxHp;
    }
    if (variant.dmgMult) enemy.damage = Math.floor(enemy.damage * variant.dmgMult);
    if (variant.speedMult) enemy.speed *= variant.speedMult;
    if (typeof variant.damageTakenMult === 'number') enemy.damageTakenMult *= variant.damageTakenMult;
    if (typeof variant.projectileSpeedMult === 'number') enemy.projectileSpeedMult *= variant.projectileSpeedMult;

    if (variant.explodeOnDeath) {
        enemy.explodeOnDeath = true;
        enemy.explosionDamage = Math.max(enemy.explosionDamage || 20, Math.floor(enemy.damage * 1.1));
        enemy.explosionRadius = Math.max(enemy.explosionRadius || 60, 80);
    }
}
window.applyBiomeVariantToEnemy = applyBiomeVariantToEnemy;

// ----------------------------------------------------------
// ELITE MODIFIERS (Diablo-style) - only for elites
// ----------------------------------------------------------

const EliteModPool = [
    { id: 'haste',      abbr: 'HST', apply: (e) => { e.speed *= 1.35; } },
    { id: 'vampiric',   abbr: 'VMP', apply: (e) => { e.vampiricPct = Math.max(e.vampiricPct || 0, 0.35); e.maxHp = Math.floor(e.maxHp * 1.15); e.hp = e.maxHp; } },
    { id: 'molten',     abbr: 'MLT', apply: (e) => { e.explodeOnDeath = true; e.explosionDamage = Math.max(e.explosionDamage || 20, Math.floor(e.damage * 1.2)); e.explosionRadius = Math.max(e.explosionRadius || 60, 90); } },
    { id: 'reflect',    abbr: 'RFL', apply: (e) => { e.reflectPct = Math.max(e.reflectPct || 0, 0.18); } },
    { id: 'shielded',   abbr: 'SHD', apply: (e) => { e.damageTakenMult *= 0.70; } },
    { id: 'juggernaut', abbr: 'JUG', apply: (e) => { e.maxHp = Math.floor(e.maxHp * 1.75); e.hp = e.maxHp; e.damageTakenMult *= 0.90; } },
    { id: 'berserk',    abbr: 'BRK', apply: (e) => { e.damage = Math.floor(e.damage * 1.35); e.speed *= 1.10; } },
    { id: 'arcane',     abbr: 'ARC', apply: (e) => { e.projectileSpeedMult *= 1.35; if (!e.variantId) { e.variantId = 'arcane'; e.variantName = 'Arcano'; e.variantTimer = 0.7 + Math.random() * 0.8; } } }
];

function getEliteModAbbr(id) {
    const m = EliteModPool.find(x => x.id === id);
    return m ? m.abbr : (id || '').slice(0, 3).toUpperCase();
}
window.getEliteModAbbr = getEliteModAbbr;

function applyEliteModifiers(enemy, ctx = {}) {
    if (!enemy || !enemy.isElite || enemy.isBoss || enemy.isMiniBoss) return;

    const roomIndex = ctx.roomIndex || 0;
    const ng = (window.Game && typeof Game.ngPlusLevel === 'number') ? Game.ngPlusLevel : 0;

    let modCount = 1;
    if (roomIndex >= 4 || ng > 0) if (Math.random() < 0.45) modCount++;
    if (ng >= 2) if (Math.random() < 0.25) modCount++;
    modCount = Math.min(3, modCount);

    const chosen = new Set(enemy.eliteMods || []);
    while (chosen.size < modCount) {
        const pick = EliteModPool[Math.floor(Math.random() * EliteModPool.length)];
        chosen.add(pick.id);
    }
    enemy.eliteMods = Array.from(chosen);

    for (const id of enemy.eliteMods) {
        const mod = EliteModPool.find(m => m.id === id);
        if (mod && typeof mod.apply === 'function') mod.apply(enemy);
    }

    enemy.goldValue = Math.floor((enemy.goldValue || 6) * 1.6);
    enemy.xpValue = Math.floor((enemy.xpValue || 10) * 1.4);
}
window.applyEliteModifiers = applyEliteModifiers;


function createEnemy(type, x, y, difficultyMult = 1, overrides = null) {
    const baseConfig = EnemyTypes[type] || EnemyTypes.goblin;
    const config = { ...baseConfig };

    // Optional overrides (e.g., role-based encounters)
    if (overrides && typeof overrides === 'object') {
        Object.assign(config, overrides);
    }

    config.hp = Math.floor(config.hp * difficultyMult);
    config.damage = Math.floor(config.damage * difficultyMult);

    if (window.Game && Game.biomeMutation && Game.biomeMutation.enemySpeedMult) {
        config.speed = (config.speed || 60) * Game.biomeMutation.enemySpeedMult;
    }

    const enemy = new Enemy(x, y, type, config);
    const biomeId = (window.Game && Game.currentBiome) ? Game.currentBiome : 'forest';
    applyBiomeVariantToEnemy(enemy, biomeId);
    return enemy;
}


window.Enemy = Enemy;
window.EnemyTypes = EnemyTypes;
window.createEnemy = createEnemy;
