// ==========================================
// ARCANE DEPTHS - Player Class (FIXED)
// ==========================================

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, 40);

        this.isPlayer = true;

        // Status effects
        this.slowTimer = 0;
        this.slowMult = 1;

        // Sprites con direcciones
        this.sprites = Sprites.getPlayerSprites();
        this.direction = 'down';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.15; // seconds per frame
        this.isMoving = false;

        // Stats base
        this.maxHp = 100;
        this.hp = 100;
        this.maxMana = 50;
        this.mana = 50;
        this.speed = 180;
        this.damage = 10;
        this.fireRate = 0.2;
        this.projectileSpeed = 500;
        this.projectileRange = 800;

        // Base mana cost per shot (runes/items can modify)
        this.baseManaCost = 3;

        // Temporary buffs
        this.frenzyTimer = 0;
        this.frenzyFireRateMult = 0.33; // 3x faster while active

        // Multipliers from items
        this.projectileSpeedMult = 1;
        this.projectileRangeMult = 1;
        this.fireRateMult = 1;
        this.manaCostFlat = 0;

        // Dash
        this.echoBoots = false; // NG relic
        this.chainCountBonus = 0; // NG relic
        this.fragmentationCore = false; // NG relic
        this.brokenClock = false; // NG relic
        this.precisionLens = false; // NG relic
        this.eliteCrown = false; // NG relic
        this.dashSpeed = 600;
        this.dashDuration = 0.15;
        this.dashCooldown = 1.2;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.isDashing = false;
        this.dashDirection = new Vector2();

        // Invincibility
        this.iFrames = 0.3;
        this.iFrameTimer = 0;

        // Combat
        this.fireTimer = 0;

        // Knockback (from certain enemies)
        this.knockbackVx = 0;
        this.knockbackVy = 0;

        this.aimAngle = 0;

        // Runes (dynamic slots)
        this.runes = [null, null, null, null, null];

        // Active items (1 slot by default; shop can add +1 slot)
        this.activeItems = [null];
        this.activeCooldowns = [0];

        // Perks
        this.perks = [];

        // Passive Items (displayed separately from runes)
        this.passiveItems = [];
        this.setPieces = {}; // setId -> { pieces:Set }
        this.setBonusesApplied = {}; // setId -> {2:true,3:true}
        this.setStormDash = false;

        // Items
        this.potions = 3;
        this.gold = 0;

        // Mana regen bonus from runes
        this.manaRegenMultiplier = 1;

        // Stats tracking
        this.stats = {
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            roomsCleared: 0,
            biomesCleared: 0,
            goldCollected: 0,
            potionsUsed: 0
        };
    }

    update(dt, room) {
        // Timers
        if (this.fireTimer > 0) this.fireTimer -= dt;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
        if (this.iFrameTimer > 0) this.iFrameTimer -= dt;
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) { this.slowTimer = 0; this.slowMult = 1; }
        }

        // Apply knockback
        this.x += this.knockbackVx * dt;
        this.y += this.knockbackVy * dt;
        this.knockbackVx *= 0.85;
        this.knockbackVy *= 0.85;

        // Active item cooldowns
        for (let i = 0; i < this.activeCooldowns.length; i++) {
            if (this.activeCooldowns[i] > 0) this.activeCooldowns[i] -= dt;
            if (this.activeCooldowns[i] < 0) this.activeCooldowns[i] = 0;
        }

        // Frenzy timer
        if (this.frenzyTimer > 0) {
            this.frenzyTimer -= dt;
            if (this.frenzyTimer < 0) this.frenzyTimer = 0;
        }

        // Dashing
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashDirection.x * this.dashSpeed * dt;
            this.y += this.dashDirection.y * this.dashSpeed * dt;
            ParticleSystem.dash(this.centerX, this.centerY);

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                // Set bonus: Tormenta (3/3)
                try {
                    if (this.setStormDash && window.Game && Game && typeof Game.spawnProjectile === 'function') {
                        const aS = this.aimAngle;
                        Game.spawnProjectile(this.centerX, this.centerY, aS, Math.max(3, Math.floor(this.calculateDamage() * 0.45)), this.getProjectileSpeed() * 1.05, 480, 'player', ['chain'], { chainCount: 1 });
                        ParticleSystem.burst(this.centerX, this.centerY, 10, { color: '#b3e5fc', life: 0.35, size: 3, speed: 2 });
                    }
                } catch (e) {}

                // Dash echo shot (NG relic)
                try {
                    if (this.echoBoots && window.Game && Game && typeof Game.spawnProjectile === 'function') {
                        const a = this.aimAngle;
                        Game.spawnProjectile(this.centerX, this.centerY, a, Math.max(3, Math.floor(this.calculateDamage() * 0.55)), this.getProjectileSpeed() * 0.95, 520, 'player', [], {});
                        ParticleSystem.burst(this.centerX, this.centerY, 8, { color: '#b388ff', life: 0.35, size: 3, speed: 2 });
                    }
                } catch (e) {}
            }
        } else {
            // Normal movement
            const move = Input.getMovementVector();
            const moveMult = (room && typeof room.getMoveMultiplier === 'function') ? room.getMoveMultiplier(this) : 1;
            const effSpeed = this.speed * (this.slowTimer > 0 ? this.slowMult : 1);
            const targetVx = move.x * effSpeed * moveMult;
            const targetVy = move.y * effSpeed * moveMult;
            const onIce = !!(room && room.hasIce);
            if (onIce) {
                const t = Utils.clamp(dt * 6, 0, 1);
                this.vx = Utils.lerp(this.vx, targetVx, t);
                this.vy = Utils.lerp(this.vy, targetVy, t);
            } else {
                this.vx = targetVx;
                this.vy = targetVy;
            }
            this.isMoving = move.length() > 0;

            // Update direction based on movement
            if (this.isMoving) {
                const dir = Input.getMovementDirection();
                if (dir) this.direction = dir;
            }

            super.update(dt);
        }

        // Animation
        if (this.isMoving || this.isDashing) {
            this.animationTimer += dt;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % 4;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }

        // Room bounds collision
        // Safety: on some load/transition edges, "room" may be a plain object without bounds.
        // Never crash the whole game because bounds are missing.
        if (room && room.bounds && typeof room.bounds.x === 'number') {
            this.x = Utils.clamp(this.x, room.bounds.x, room.bounds.x + room.bounds.width - this.width);
            this.y = Utils.clamp(this.y, room.bounds.y, room.bounds.y + room.bounds.height - this.height);
        } else {
            // Fallback to full canvas bounds
            const w = (room && typeof room.width === 'number') ? room.width : ((window.Game && Game.width) ? Game.width : 800);
            const h = (room && typeof room.height === 'number') ? room.height : ((window.Game && Game.height) ? Game.height : 500);
            this.x = Utils.clamp(this.x, 0, w - this.width);
            this.y = Utils.clamp(this.y, 0, h - this.height);
        }

        // Mana regen (with rune bonuses)
        if (this.mana < this.maxMana) {
            const baseRegen = 5;
            const totalRegen = baseRegen * this.manaRegenMultiplier;
            this.mana = Math.min(this.maxMana, this.mana + totalRegen * dt);
        }
    }

    // ------------------------------
    // Stat helpers
    // ------------------------------
    getManaCost() {
        // Base mana cost can be reduced/increased by runes and items.
        let cost = (this.baseManaCost || 0) + (this.manaCostFlat || 0);

        for (const rune of this.runes) {
            if (!rune) continue;
            // RuneDatabase uses `manaCost` as an additive delta (often negative).
            if (typeof rune.manaCost === 'number') cost += rune.manaCost;
        }

        // Never allow negative cost. Keep a tiny floor so "free spam" doesn't break pacing.
        return Math.max(0, Math.round(cost * 10) / 10);
    }

    getEffectiveFireRate() {
        // `fireRate` is the interval between shots (seconds). Lower = faster.
        let interval = this.fireRate;

        // Item multiplier (kept as interval multiplier)
        interval *= (this.fireRateMult || 1);

        // Rune bonuses are % faster casting: reduce interval.
        let bonus = 0;
        for (const rune of this.runes) {
            if (!rune) continue;
            if (typeof rune.fireRateBonus === 'number') bonus += rune.fireRateBonus;
        }
        interval *= (1 - bonus);

        // Temporary frenzy
        if (this.frenzyTimer > 0) interval *= (this.frenzyFireRateMult || 1);

        // Clamp to keep it playable
        return Math.max(0.05, interval);
    }

    getProjectileSpeed() {
        let spd = this.projectileSpeed * (this.projectileSpeedMult || 1);
        for (const rune of this.runes) {
            if (!rune) continue;
            if (typeof rune.speedBonus === 'number') {
                // RuneDatabase uses integer percent for speedBonus.
                spd *= (1 + rune.speedBonus / 100);
            }
        }
        return spd;
    }

    handleInput(camera, canvasRect, scale) {
        // Get mouse world position for aiming
        const mouseWorld = Input.getMouseWorldPosition(scale, canvasRect);
        this.aimAngle = Utils.angle(this.centerX, this.centerY, mouseWorld.x, mouseWorld.y);

        // Shoot when clicking
        const manaCost = this.getManaCost();
        if (Input.isMouseDown(0) && this.fireTimer <= 0 && !this.isDashing && this.mana >= manaCost) {
            this.mana -= manaCost;
            this.shoot(mouseWorld);
        }

        // Dash
        this.echoBoots = false; // NG relic
        this.chainCountBonus = 0; // NG relic
        this.fragmentationCore = false; // NG relic
        this.brokenClock = false; // NG relic
        this.precisionLens = false; // NG relic
        this.eliteCrown = false; // NG relic
        if (Input.isKeyJustPressed('Space') && this.dashCooldownTimer <= 0 && !this.isDashing) {
            this.dash();
        }

        // Use potion
        if (Input.isKeyJustPressed('KeyQ') && this.potions > 0 && this.hp < this.maxHp) {
            this.usePotion();
        }


        // Use active items
        if (Input.isKeyJustPressed('KeyF')) {
            this.useActive(0);
        }
        if (Input.isKeyJustPressed('KeyG')) {
            this.useActive(1);
        }
    }

    shoot(targetPos) {
                this.fireTimer = this.getEffectiveFireRate();

        // Calculate angle to mouse click position
        const angle = Utils.angle(this.centerX, this.centerY, targetPos.x, targetPos.y);

        // Scripted runes: OnCast
        try {
            if (window.RuneScript) {
                RuneScript.trigger('OnCast', { player: this, room: (window.Game && Game.dungeon ? Game.dungeon.getCurrentRoom() : null), angle });
            }
        } catch (e) {}


        // Update direction based on shooting
        if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
            this.direction = Math.cos(angle) > 0 ? 'right' : 'left';
        } else {
            this.direction = Math.sin(angle) > 0 ? 'down' : 'up';
        }

        // Calculate projectile count from runes
        let projectileCount = 1;
        let spreadAngle = 0;

        for (const rune of this.runes) {
            if (rune && rune.extraProjectiles) {
                projectileCount += rune.extraProjectiles;
                spreadAngle = Math.PI / 12 * (projectileCount - 1);
            }
        }

        // Get effects and rune data for projectiles
        const effects = this.getProjectileEffects();
        const runeData = this.getRuneData();
        // Consume temporary script bonuses
        this._scriptPierce = 0;
        this._scriptBounce = 0;

        const startAngle = angle - spreadAngle / 2;
        const angleStep = projectileCount > 1 ? spreadAngle / (projectileCount - 1) : 0;

        // Calculate projectile range with bonuses
                let finalRange = this.projectileRange * this.projectileRangeMult;
        for (const rune of this.runes) {
            if (rune && rune.rangeBonus) finalRange *= (1 + rune.rangeBonus);
            if (rune && rune.rangeMultiplier) finalRange *= rune.rangeMultiplier;
        }

        for (let i = 0; i < projectileCount; i++) {
            const projAngle = projectileCount === 1 ? angle : startAngle + angleStep * i;
            Game.spawnProjectile(
                this.centerX,
                this.centerY,
                projAngle,
                this.calculateDamage(),
                this.getProjectileSpeed(),
                finalRange,
                'player',
                effects,
                runeData
            );
        }

        AudioManager.play('shoot');
    }

    calculateDamage() {
        let dmg = this.damage;
        for (const rune of this.runes) {
            if (rune && rune.damageBonus) dmg += rune.damageBonus;
            if (rune && rune.damageMultiplier) dmg *= rune.damageMultiplier;
        }
        for (const perk of this.perks) {
            if (perk.damageBonus) dmg += perk.damageBonus;
            if (perk.damageMultiplier) dmg *= perk.damageMultiplier;
        }
        if (window.Game && Game.modifiers && Game.modifiers.playerDamageMult) {
            dmg *= Game.modifiers.playerDamageMult;
        }
        return Math.floor(dmg);
    }

    getProjectileEffects() {
        const effects = [];
        for (const rune of this.runes) {
            if (rune && rune.effect) effects.push(rune.effect);
        }
        // Relic: chain seal
        if ((this.chainCountBonus || 0) > 0 && !effects.includes('chain')) effects.push('chain');
        return effects;
    }

    getRuneData() {
        const data = {};
        for (const rune of this.runes) {
            if (!rune) continue;
            if (rune.pierceCount) data.pierceCount = (data.pierceCount || 0) + rune.pierceCount;
            if (rune.lifeSteal) data.lifeSteal = (data.lifeSteal || 0) + rune.lifeSteal;
            if (rune.critChance) data.critChance = Math.max(data.critChance || 0, rune.critChance);
            if (rune.critDamage) data.critDamage = Math.max(data.critDamage || 1, rune.critDamage);
            if (rune.chainCount) data.chainCount = (data.chainCount || 0) + rune.chainCount;
            if (rune.splitCount) data.splitCount = Math.max(data.splitCount || 0, rune.splitCount);
            if (rune.radius) data.radius = Math.max(data.radius || 0, rune.radius);
            if (rune.percentDamage) data.percentDamage = (data.percentDamage || 0) + rune.percentDamage;
            if (rune.bossMultiplier) data.bossMultiplier = Math.max(data.bossMultiplier || 1, rune.bossMultiplier);
        }
        if ((this.chainCountBonus || 0) > 0) { data.chainCount = (data.chainCount || 0) + this.chainCountBonus; }
        if (this._scriptPierce) { data.pierceCount = (data.pierceCount || 0) + this._scriptPierce; }
        if (this._scriptBounce) { data.bounceCount = (data.bounceCount || 0) + this._scriptBounce; }
        return data;
    }

    dash() {
        const move = Input.getMovementVector();
        if (move.length() === 0) {
            this.dashDirection = Vector2.fromAngle(this.aimAngle);
        } else {
            this.dashDirection = move;
        }

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        this.iFrameTimer = this.dashDuration + 0.1;

        AudioManager.play('dash');
    }

    usePotion() {
        if (this.potions <= 0) return;
        this.potions--;
        this.stats.potionsUsed = (this.stats.potionsUsed || 0) + 1;
        const healAmount = 30;
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        ParticleSystem.burst(this.centerX, this.centerY, 10, {
            color: '#44ff88', life: 0.5, size: 3, speed: 2
        });
        AudioManager.play('pickup');
    }

    applySlow(mult = 0.6, duration = 1.5) {
        this.slowMult = Utils.clamp(mult, 0.3, 1);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    takeDamage(amount) {
        if (this.iFrameTimer > 0 || this.isDashing) return false;

        this.hp -= amount;
        this.stats.damageTaken += amount;
        this.iFrameTimer = this.iFrames;

        ParticleSystem.hit(this.centerX, this.centerY, '#ff3333');
        AudioManager.play('hurt');

        // Scripted runes: OnDamageTaken
        try {
            if (window.RuneScript) {
                RuneScript.trigger('OnDamageTaken', { player: this, room: (window.Game && Game.dungeon ? Game.dungeon.getCurrentRoom() : null), amount });
            }
        } catch (e) {}


        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addGold(amount) {
        const n = Math.max(0, Math.floor(amount || 0));
        this.gold += n;
        this.stats.goldCollected = (this.stats.goldCollected || 0) + n;
        try {
            if (window.Meta && typeof Meta.recordGold === 'function') {
                Meta.recordGold(n);
            }
        } catch (e) {}
    }

    ensureRuneSlots(count) {
        const target = Math.max(1, Math.floor(count || 5));
        while (this.runes.length < target) this.runes.push(null);
        while (this.runes.length > target) this.runes.pop();
    }

    addRuneSlots(amount = 1) {
        const n = Math.max(0, Math.floor(amount));
        for (let i = 0; i < n; i++) this.runes.push(null);
    }


    // ===========================
    // ACTIVE ITEMS
    // ===========================

    ensureActiveSlots(count) {
        const target = Math.max(1, Math.floor(count || 1));
        while (this.activeItems.length < target) this.activeItems.push(null);
        while (this.activeCooldowns.length < target) this.activeCooldowns.push(0);
        while (this.activeItems.length > target) this.activeItems.pop();
        while (this.activeCooldowns.length > target) this.activeCooldowns.pop();
    }

    addActiveSlots(amount = 1) {
        const n = Math.max(0, Math.floor(amount));
        for (let i = 0; i < n; i++) {
            this.activeItems.push(null);
            this.activeCooldowns.push(0);
        }
    }

    equipActiveItem(item, slotIndex = null) {
        if (!item) return false;
        this.ensureActiveSlots(this.activeItems.length);

        // Choose slot: provided, else first empty
        let slot = slotIndex;
        if (slot === null || slot === undefined) {
            slot = this.activeItems.findIndex(a => a === null);
        }
        if (slot === -1) slot = 0;

        this.activeItems[slot] = item;
        this.activeCooldowns[slot] = 0;
        return true;
    }

    useActive(slotIndex = 0) {
        if (slotIndex < 0 || slotIndex >= this.activeItems.length) return;
        const item = this.activeItems[slotIndex];
        if (!item) return;

        const cd = this.activeCooldowns[slotIndex] || 0;
        if (cd > 0) return;

        // Trigger effects
        switch (item.activeEffect) {
            case 'blink': {
                const dist = 160;
                const nx = this.x + Math.cos(this.aimAngle) * dist;
                const ny = this.y + Math.sin(this.aimAngle) * dist;
                const room = Game?.dungeon?.getCurrentRoom?.();
                if (room) {
                    this.x = Utils.clamp(nx, room.bounds.x, room.bounds.x + room.bounds.width - this.width);
                    this.y = Utils.clamp(ny, room.bounds.y, room.bounds.y + room.bounds.height - this.height);
                } else {
                    this.x = nx; this.y = ny;
                }
                ParticleSystem.burst(this.centerX, this.centerY, 18, { color: '#7b4dff', life: 0.6, size: 4, speed: 3 });
                AudioManager.play('dash');
                break;
            }
            case 'smoke': {
                // Temporary invulnerability (iFrames)
                this.iFrameTimer = Math.max(this.iFrameTimer, 1.2);
                ParticleSystem.burst(this.centerX, this.centerY, 22, { color: '#b0bec5', life: 0.9, size: 5, speed: 2 });
                AudioManager.play('pickup');
                break;
            }
            case 'heal': {
                const before = this.hp;
                this.heal(40);
                if (this.hp > before) {
                    ParticleSystem.burst(this.centerX, this.centerY, 14, { color: '#44ff88', life: 0.7, size: 4, speed: 2 });
                    AudioManager.play('pickup');
                }
                break;
            }
            default:
                break;
        }

        this.activeCooldowns[slotIndex] = Math.max(0.5, item.cooldown || 10);
    }

    equipRune(rune, slot) {
        if (slot >= 0 && slot < this.runes.length) {
            // Remove bonuses from old rune if exists
            const oldRune = this.runes[slot];
            if (oldRune) {
                if (oldRune.manaBonus) {
                    this.maxMana -= oldRune.manaBonus;
                    this.mana = Math.min(this.mana, this.maxMana);
                }
                if (oldRune.manaRegen) {
                    this.manaRegenMultiplier /= (1 + oldRune.manaRegen);
                }
            }

            // Equip new rune
            this.runes[slot] = rune;

            // Apply stat bonuses from new rune
            if (rune) {
                if (rune.manaBonus) {
                    this.maxMana += rune.manaBonus;
                    this.mana += rune.manaBonus;
                }
                if (rune.manaRegen) {
                    this.manaRegenMultiplier *= (1 + rune.manaRegen);
                }
                if (rune.fireRateBonus) {
                    // fireRateBonus is applied dynamically in shoot
                }
            }
        }
    }

    addPassiveItem(item) {
        // Track passive items for display (max 10)
        try {
            const already = this.passiveItems.find(p => p && p.id === item.id);
            if (already) return;
        } catch (e) {}
        if (this.passiveItems.length < 10) {
            this.passiveItems.push({
                id: item.id,
                name: item.name,
                icon: item.icon,
                desc: item.desc,
                setId: item.setId || null,
                setPiece: item.setPiece || null
            });
        }
    }

    addPerk(perk) {
        this.perks.push(perk);
        if (perk.maxHpBonus) {
            this.maxHp += perk.maxHpBonus;
            this.hp += perk.maxHpBonus;
        }
        if (perk.speedBonus) this.speed += perk.speedBonus;
        if (perk.fireRateBonus) this.fireRate *= (1 - perk.fireRateBonus);
    }

    draw(ctx) {
        // Blink when invincible
        if (this.iFrameTimer > 0 && Math.floor(this.iFrameTimer * 20) % 2 === 0) {
            return;
        }

        // Get correct sprite based on state
        let sprite;
        if (this.isMoving || this.isDashing) {
            sprite = this.sprites.walk[this.direction][this.animationFrame];
        } else {
            sprite = this.sprites.idle[this.direction];
        }

        if (sprite) {
            ctx.drawImage(sprite, Math.floor(this.x), Math.floor(this.y));
        }
    }
}

window.Player = Player;
