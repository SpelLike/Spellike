// ==========================================
// ARCANE DEPTHS - Projectile System (ENHANCED WITH ALL RUNE EFFECTS)
// ==========================================

class Projectile extends Entity {
    constructor(x, y, angle, damage, speed, range, owner, effects = [], runeData = {}) {
        super(x, y, 6, 6); // Smaller, more precise hitbox
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.baseDamage = damage;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
        this.owner = owner; // 'player' or 'enemy'
        this.effects = effects;
        this.runeData = runeData; // Store rune data for complex effects

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.color = owner === 'player' ? '#00e5ff' : '#ff5722';
        this.sprite = Sprites.getProjectile(this.color);

        // Enhanced piercing with count
        this.pierceCount = runeData.pierceCount || 0;
        this.pierceRemaining = this.pierceCount;
        this.piercing = this.pierceCount > 0 || effects.includes('pierce');

        // Homing
        this.homing = effects.includes('homing');
        this.homingStrength = 5;
        this.homingTarget = null;

        // Explosion
        this.explodes = effects.includes('explode');
        this.explosionRadius = runeData.radius || 40;

        // Chain lightning
        this.chains = effects.includes('chain');
        this.chainCount = runeData.chainCount || 2;
        this.chainRemaining = this.chainCount;

        // Split on impact
        this.splits = effects.includes('split');
        this.splitCount = runeData.splitCount || 3;
        this.isChild = runeData.isChild || false;
        this._splitDone = false;

        // Critical hit
        this.canCrit = effects.includes('crit');
        this.critChance = runeData.critChance || 0.25;
        this.critDamage = runeData.critDamage || 3;
        this.isCrit = false;

        // Lifesteal
        this.lifeSteal = runeData.lifeSteal || 0;

        // Percent damage
        this.percentDamage = runeData.percentDamage || 0;

        // Boss damage multiplier
        this.bossMultiplier = runeData.bossMultiplier || 1;

        this.hitTargets = new Set();

        // Apply crit roll at spawn
        if (this.canCrit && Math.random() < this.critChance) {
            this.isCrit = true;
            this.damage = Math.floor(this.damage * this.critDamage);
            this.color = '#ffff00'; // Yellow for crit
        }
    }

    update(dt, enemies) {
        // Homing behavior
        if (this.homing && this.owner === 'player' && enemies && enemies.length > 0) {
            // Find closest enemy
            let closest = null;
            let closestDist = 200; // Max homing range

            for (const enemy of enemies) {
                if (!enemy.active || this.hitTargets.has(enemy)) continue;
                const dist = Utils.distance(this.centerX, this.centerY, enemy.centerX, enemy.centerY);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            }

            if (closest) {
                const targetAngle = Utils.angle(this.centerX, this.centerY, closest.centerX, closest.centerY);
                let angleDiff = targetAngle - this.angle;

                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Gradually turn toward target
                this.angle += angleDiff * this.homingStrength * dt;
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }

        super.update(dt);

        // Trail particles
        if (this.isCrit) {
            ParticleSystem.magic(this.centerX, this.centerY, '#ffff00');
        } else {
            ParticleSystem.magic(this.centerX, this.centerY, this.color);
        }

        // Check range
        const dist = Utils.distance(this.startX, this.startY, this.x, this.y);
        if (dist >= this.range) {
            this.active = false;
        }
    }

    onHit(target, allEnemies) {
        if (this.hitTargets.has(target)) return false;
        this.hitTargets.add(target);

        // Calculate final damage
        let finalDamage = this.damage;

        // Percent damage (deals % of enemy max HP)
        if (this.percentDamage > 0) {
            finalDamage += Math.floor(target.maxHp * this.percentDamage);
        }

        // Boss damage multiplier
        if (target.isBoss && this.bossMultiplier > 1) {
            finalDamage = Math.floor(finalDamage * this.bossMultiplier);
        }

        // Apply damage
        const knockbackAngle = this.angle;
        const knockbackForce = 100;

        // Track last hit source (for on-death procs)
        try { target._lastHitOwner = this.owner; } catch (e) { }

        // Relics / set modifiers (player-only)
        if (this.owner === 'player' && window.Game && Game.player) {
            // Precision Lens: more damage with distance (up to +35%)
            if (Game.player.precisionLens) {
                const d = Utils.distance(Game.player.centerX, Game.player.centerY, target.centerX, target.centerY);
                const bonus = Math.min(0.35, (d / 500) * 0.35);
                finalDamage = Math.floor(finalDamage * (1 + bonus));
            }

            // Hunter Mark: first hit marks target for 4s (+50% damage taken)
            if (Game.hasRelic && Game.hasRelic('hunter_mark')) {
                const canMark = (!Game.relicState.hunterMarkTargetId) || (Game.relicState.hunterMarkTimer <= 0);
                if (canMark) {
                    target.markedTimer = 4;
                    target.markedDamageMult = 1.5;
                    Game.relicState.hunterMarkTargetId = target._id || 0;
                    Game.relicState.hunterMarkTimer = 4;
                    ParticleSystem.burst(target.centerX, target.centerY, 10, { color: '#ffee58', life: 0.4, size: 4, speed: 2 });
                }
            }

            // Reaction Gauntlet: every 5 hits, next hit explodes (internal CD via charged flag)
            if (Game.hasRelic && Game.hasRelic('reaction_gauntlet')) {
                if (!Game.relicState.reactionCharged) {
                    Game.relicState.hitCount = (Game.relicState.hitCount || 0) + 1;
                    if (Game.relicState.hitCount >= 5) {
                        Game.relicState.hitCount = 0;
                        Game.relicState.reactionCharged = true;
                    }
                } else {
                    // Trigger explosion on this hit
                    Game.relicState.reactionCharged = false;
                    if (allEnemies) {
                        ParticleSystem.burst(target.centerX, target.centerY, 26, { color: '#ff884d', life: 0.45, size: 5, speed: 4 });
                        AudioManager.play('hit');
                        for (const e of allEnemies) {
                            if (!e || !e.active || e === target) continue;
                            const d2 = Utils.distance(target.centerX, target.centerY, e.centerX, e.centerY);
                            if (d2 <= 70) {
                                e.takeDamage(Math.max(2, Math.floor(finalDamage * 0.6)), 0, 60);
                            }
                        }
                    }
                }
            }
        }

        const killed = target.takeDamage(finalDamage, knockbackAngle, knockbackForce);

        // Show CRITIC! floating text if this was a critical hit
        if (this.isCrit && window.FloatingTextSystem) {
            FloatingTextSystem.critical(target.centerX, target.centerY - 10);
        }

        // Elite mod: Reflect (returns a portion of damage to the player)
        if (this.owner === 'player' && target.reflectPct > 0 && Game.player) {
            const raw = Math.floor(finalDamage * target.reflectPct);
            const cap = Math.max(6, Math.floor(Game.player.maxHp * 0.20));
            const rd = Math.min(cap, Math.max(1, raw));
            Game.player.takeDamage(rd);
            ParticleSystem.burst(Game.player.centerX, Game.player.centerY, 4, { color: '#ffd54f', life: 0.25, size: 3, speed: 2 });
        }

        // Biome variant: Thorned (small counter-shot)
        if (this.owner === 'player' && target.variantId === 'thorned' && Game.player) {
            if (Math.random() < 0.25) {
                const a2 = Utils.angle(target.centerX, target.centerY, Game.player.centerX, Game.player.centerY);
                const dmg2 = Math.max(2, Math.floor(finalDamage * 0.08));
                Game.spawnProjectile(target.centerX, target.centerY, a2, dmg2, 240, 280, 'enemy', ['thorn'], {});
            }
        }

        // Crit visual feedback
        if (this.isCrit) {
            ParticleSystem.burst(target.centerX, target.centerY, 8, {
                color: '#ffff00', life: 0.3, size: 4, speed: 3
            });
        }

        // Lifesteal
        if (this.lifeSteal > 0 && this.owner === 'player' && Game.player) {
            const healAmount = Math.floor(finalDamage * this.lifeSteal);
            if (healAmount > 0) {
                Game.player.heal(healAmount);
                ParticleSystem.burst(Game.player.centerX, Game.player.centerY, 3, {
                    color: '#44ff88', life: 0.3, size: 2, speed: 1
                });
            }
        }

        // Apply status effects
        for (const effect of this.effects) {
            this.applyEffect(effect, target);
        }

        // Demencial scripted runes: OnHit hook (after damage + effects)
        try {
            if (this.owner === 'player' && window.RuneScript && typeof RuneScript.trigger === 'function' && Game && Game.player) {
                const room = (Game.dungeon && typeof Game.dungeon.getCurrentRoom === 'function') ? Game.dungeon.getCurrentRoom() : null;
                RuneScript.trigger('OnHit', {
                    eventName: 'OnHit',
                    player: Game.player,
                    room,
                    target,
                    damage: finalDamage,
                    angle: this.angle,
                    killed: !!killed
                });
            }
        } catch (e) { }


        // Fragmentation Core: on kill, 25% chance to spawn 3 homing fragments
        if (killed && this.owner === 'player' && window.Game && Game.player && Game.hasRelic && Game.hasRelic('fragmentation_core')) {
            if (Math.random() < 0.25 && allEnemies) {
                for (let i = 0; i < 3; i++) {
                    const a3 = Utils.random(0, Math.PI * 2);
                    const dmg3 = Math.max(2, Math.floor(finalDamage * 0.35));
                    Game.spawnProjectile(target.centerX, target.centerY, a3, dmg3, 260, 420, 'player', ['homing'], {});
                }
                ParticleSystem.burst(target.centerX, target.centerY, 12, { color: '#b388ff', life: 0.4, size: 4, speed: 3 });
            }
        }

        // Explosion on hit
        if (this.explodes && allEnemies) {
            this.doExplosion(allEnemies);
        }

        // Chain lightning
        if (this.chains && this.chainRemaining > 0 && allEnemies) {
            this.doChain(allEnemies);
        }
        // Split into multiple projectiles (once per projectile)
        if (this.splits && !this.isChild && !this._splitDone) {
            this._splitDone = true;
            this.doSplit();
        }

        // Handle piercing
        if (this.piercing) {
            if (this.pierceCount > 0) {
                this.pierceRemaining--;
                if (this.pierceRemaining <= 0) {
                    this.active = false;
                }
            }
            // Infinite pierce (pierceCount = 999) never deactivates from pierce
        } else {
            this.active = false;
        }

        return true;
    }

    doExplosion(enemies) {
        // Create explosion visual
        ParticleSystem.burst(this.centerX, this.centerY, 20, {
            color: '#ff6600', life: 0.4, size: 5, speed: 4
        });
        AudioManager.play('hit');

        // Damage nearby enemies
        for (const enemy of enemies) {
            if (!enemy.active || this.hitTargets.has(enemy)) continue;

            const dist = Utils.distance(this.centerX, this.centerY, enemy.centerX, enemy.centerY);
            if (dist < this.explosionRadius) {
                const explosionDamage = Math.floor(this.baseDamage * 0.5);
                enemy.takeDamage(explosionDamage, 0, 50);
                this.hitTargets.add(enemy);
            }
        }
    }

    doChain(enemies) {
        // Find nearest enemy not yet hit
        let nearest = null;
        let nearestDist = 100; // Reduced chain range

        for (const enemy of enemies) {
            if (!enemy.active || this.hitTargets.has(enemy)) continue;

            const dist = Utils.distance(this.centerX, this.centerY, enemy.centerX, enemy.centerY);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        if (nearest) {
            // Create chain visual (line between targets)
            ParticleSystem.burst(nearest.centerX, nearest.centerY, 5, {
                color: '#00e5ff', life: 0.2, size: 3, speed: 2
            });

            // Deal chain damage
            const chainDamage = Math.floor(this.baseDamage * 0.4); // Reduced damage
            nearest.takeDamage(chainDamage, 0, 30);
            this.hitTargets.add(nearest);
            this.chainRemaining--;

            // Continue chaining from new position
            if (this.chainRemaining > 0) {
                this.x = nearest.centerX;
                this.y = nearest.centerY;
                this.doChain(enemies);
            }
        }
    }

    doSplit() {
        // Spawn child projectiles in a spread (inherit effects except split)
        const spreadAngle = Math.PI / 5; // ~36 degree spread (tighter so it feels consistent)
        const startAngle = this.angle - spreadAngle / 2;
        const angleStep = (this.splitCount > 1) ? (spreadAngle / (this.splitCount - 1)) : 0;

        const childEffects = (this.effects || []).filter(e => e !== 'split');
        const childRuneData = Object.assign({}, this.runeData || {}, { isChild: true });

        // Spawn from projectile center but using top-left coordinates (8x8) to avoid out-of-bounds culling
        const sx = this.centerX - (this.width / 2);
        const sy = this.centerY - (this.height / 2);

        for (let i = 0; i < this.splitCount; i++) {
            const childAngle = (this.splitCount === 1) ? this.angle : (startAngle + angleStep * i);
            const childDamage = Math.max(1, Math.floor(this.baseDamage * 0.4));

            ProjectileManager.spawn(
                sx,
                sy,
                childAngle,
                childDamage,
                this.speed * 0.85,
                this.range * 0.55,
                this.owner,
                childEffects,
                childRuneData
            );
        }

        // Small visual to make the split obvious
        try { ParticleSystem.burst(this.centerX, this.centerY, 8, { color: '#b388ff', life: 0.25, size: 3, speed: 2.5 }); } catch (e) { }
    }

    applyEffect(effect, target) {
        switch (effect) {
            case 'burn':
                target.burnDuration = 3;
                target.burnDamage = 5;
                break;
            case 'poison':
                target.poisonDuration = 4;
                target.poisonDamage = 4;
                break;
            case 'slow':
                target.slowDuration = 2;
                target.slowAmount = 0.5;
                break;
        }
    }

    draw(ctx) {
        // Draw projectile
        if (this.sprite) {
            ctx.drawImage(this.sprite, Math.floor(this.x), Math.floor(this.y));
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Crit indicator
        if (this.isCrit) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

const ProjectileManager = {
    projectiles: [],

    spawn(x, y, angle, damage, speed, range, owner, effects = [], runeData = {}) {
        const proj = new Projectile(x, y, angle, damage, speed, range, owner, effects, runeData);
        this.projectiles.push(proj);
        return proj;
    },

    update(dt, player, enemies, room) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, enemies);

            // Darkness modifier: player projectiles can't travel outside the light radius
            if (room && player && proj.owner === 'player' && proj.active) {
                try {
                    const dark = (room.roomModifiers || []).find(m => m.id === 'darkness');
                    if (dark) {
                        const d = Utils.distance(proj.centerX, proj.centerY, player.centerX, player.centerY);
                        if (d > (dark.radius + 2)) proj.active = false;
                    }
                } catch (e) { }
            }

            // Check room bounds
            if (room && !Utils.rectCollision(proj.bounds, room.bounds)) {
                proj.active = false;
            }

            // Room modifier: explosive barrels
            if (room && room.barrels && room.barrels.length > 0 && proj.active) {
                for (const b of room.barrels) {
                    if (!b.active) continue;
                    const bb = { x: b.x, y: b.y, width: b.w, height: b.h };
                    if (Utils.rectCollision(proj.bounds, bb)) {
                        b.active = false;
                        proj.active = false;
                        try { if (typeof room.explodeAt === 'function') room.explodeAt(b.x + b.w / 2, b.y + b.h / 2, 120, 28, player, { source: 'barrel' }); } catch (e) { }
                        break;
                    }
                }
            }

            // Collision detection
            if (proj.owner === 'player') {
                for (const enemy of enemies) {
                    if (enemy.active && proj.collidesWith(enemy)) {
                        proj.onHit(enemy, enemies);
                    }
                }
            } else if (proj.owner === 'enemy') {
                // Tight hurtbox so near-miss bullets feel fair.
                const hb = {
                    x: player.x + player.width * 0.28,
                    y: player.y + player.height * 0.22,
                    width: player.width * 0.44,
                    height: player.height * 0.56
                };
                if (Utils.rectCollision(proj.bounds, hb)) {
                    player.takeDamage(proj.damage);
                    proj.active = false;
                }
            }

            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
    },

    draw(ctx) {
        for (const proj of this.projectiles) {
            proj.draw(ctx);
        }
    },

    clear() {
        this.projectiles = [];
    }
};

window.Projectile = Projectile;
window.ProjectileManager = ProjectileManager;
