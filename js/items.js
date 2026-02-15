// ==========================================
// ARCANE DEPTHS - Items System (IMPROVED)
// ==========================================

const ItemRarity = {
    COMMON: { name: 'common', color: '#888', weight: 60 },
    RARE: { name: 'rare', color: '#4fc3f7', weight: 25 },
    EPIC: { name: 'epic', color: '#9c27b0', weight: 12 },
    LEGENDARY: { name: 'legendary', color: '#ff9800', weight: 3 }
};

class Item {
    constructor(config) {
        this.id = config.id;
        this.icon = config.icon || '📦';
        this.type = config.type || 'item';
        this.rarity = config.rarity || 'common';

        // Translation system
        if (window.i18n) {
            const trans = window.i18n.item(this.id);
            this.name = trans.name;
            this.desc = trans.desc;
        } else {
            // Fallback if translation system not loaded
            this.name = config.name || this.id;
            this.desc = config.desc || '';
        }

        // Effects
        this.heal = config.heal || 0;
        this.maxHpBonus = config.maxHpBonus || 0;
        this.damageBonus = config.damageBonus || 0;
        this.speedBonus = config.speedBonus || 0;
        this.maxManaBonus = config.maxManaBonus || 0;
        this.manaRegenBonus = config.manaRegenBonus || 0;
        this.fireRateBonus = config.fireRateBonus || 0;
        this.projectileSpeedBonus = config.projectileSpeedBonus || 0;
        this.projectileRangeBonus = config.projectileRangeBonus || 0;
        this.manaCostFlat = config.manaCostFlat || 0;
        this.potions = config.potions || 0;
        this.gold = config.gold || 0;
        this.runeSlotBonus = config.runeSlotBonus || 0;
        this.activeSlotBonus = config.activeSlotBonus || 0;
        this.cooldown = config.cooldown || 0;
        this.activeEffect = config.activeEffect || null;
        this.duration = config.duration || 0;
        this.shopOnly = !!config.shopOnly;

        // Sets
        this.setId = config.setId || null;
        this.setPiece = config.setPiece || null;
    }
}

class Chest {
    constructor(x, y, rarity = 'common', options = {}) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 20;
        this.rarity = rarity;
        this.opened = false;
        this.sprite = Sprites.getChest(rarity);

        // Loot seed for deterministic loot
        this.lootSeed = options.lootSeed || null;
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.glowPhase = Math.random() * Math.PI * 2;
        this.openAnimation = 0; // 0 to 1
        
        // Optional behavior hooks
        this.forceLegendary = !!options.forceLegendary;
        this.isBossChest = !!options.isBossChest;
        this.onOpen = typeof options.onOpen === 'function' ? options.onOpen : null;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    open(player) {
        if (this.opened) return null;
        this.opened = true;
        AudioManager.play('chest');

        // Open animation
        this.openAnimation = 0;
        
        // Bonus based on rarity
        const bonuses = {
            common: { gold: 10, mana: 2 },
            rare: { gold: 25, mana: 4 },
            epic: { gold: 50, mana: 6 },
            legendary: { gold: 100, mana: 10 }
        };
        
        const bonus = bonuses[this.rarity] || bonuses.common;
        
        // Give bonuses
        if (player && bonus.gold > 0) {
            player.gold += bonus.gold;
            if (window.FloatingTextSystem) {
                FloatingTextSystem.gold(this.centerX, this.centerY - 20, bonus.gold);
            }
        }
        if (player && bonus.mana > 0) {
            player.mana = Math.min(player.maxMana, player.mana + bonus.mana);
            if (window.FloatingTextSystem) {
                FloatingTextSystem.mana(this.centerX, this.centerY - 10, bonus.mana);
            }
        }
        
        // Particles
        if (window.ParticleSystem) {
            ParticleSystem.burst(this.centerX, this.centerY, 15, {
                color: '#ffd700',
                life: 0.8,
                size: 4,
                speed: 3
            });
            ParticleSystem.burst(this.centerX, this.centerY, 10, {
                color: '#00d4ff',
                life: 0.6,
                size: 3,
                speed: 2
            });
        }

        if (this.onOpen) {
            try { this.onOpen(); } catch (e) { /* ignore */ }
        }

        // Return loot descriptor with seed
        if (this.isBossChest || this.forceLegendary) {
            return { 
                rarity: this.rarity, 
                forceLegendary: this.forceLegendary, 
                bossChest: this.isBossChest,
                lootSeed: this.lootSeed
            };
        }
        return { rarity: this.rarity, lootSeed: this.lootSeed };
    }

    update(dt) {
        // Bob animation
        this.bobOffset += dt * 2;
        
        // Glow animation
        this.glowPhase += dt * 3;
        
        // Open animation
        if (this.opened && this.openAnimation < 1) {
            this.openAnimation += dt * 3;
            if (this.openAnimation > 1) this.openAnimation = 1;
        }
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 2;
        const drawY = this.y + bobY;
        
        if (this.opened) {
            // Draw open chest (darker + bounce effect)
            const bounce = Math.max(0, 1 - this.openAnimation) * 5;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this.sprite, this.x, drawY - bounce);
            ctx.globalAlpha = 1;
        } else {
            // Glow effect
            const glowAlpha = 0.3 + Math.sin(this.glowPhase) * 0.2;
            const glowSize = 4;
            ctx.globalAlpha = glowAlpha;
            ctx.fillStyle = this.rarity === 'legendary' ? '#ff00ff' : 
                           this.rarity === 'epic' ? '#9c27b0' :
                           this.rarity === 'rare' ? '#2196f3' : '#4caf50';
            ctx.fillRect(
                this.x - glowSize/2, 
                drawY - glowSize/2, 
                this.width + glowSize, 
                this.height + glowSize
            );
            ctx.globalAlpha = 1;
            
            // Draw chest
            ctx.drawImage(this.sprite, this.x, drawY);

            // Sparkle effect
            if (Math.random() < 0.1) {
                const sparkX = this.x + Math.random() * this.width;
                const sparkY = drawY + Math.random() * this.height;
                ctx.fillStyle = '#fff';
                ctx.fillRect(sparkX, sparkY, 2, 2);
            }

            // Interaction prompt
            ctx.fillStyle = '#44ff88';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E]', this.centerX, drawY - 5);

            // Boss chest label
            if (this.isBossChest) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillText('BOSS', this.centerX, drawY - 14);
            }
        }
    }
}

class Gold {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.value = value;
        this.active = true;

        this.vx = (Math.random() - 0.5) * 100;
        this.vy = -50 - Math.random() * 50;
        this.friction = 0.95;
        this.magnetRange = 80;
        this.magnetSpeed = 300;

        this.life = 30; // seconds
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    update(dt, player) {
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Physics - NO gravity, just friction and floor collision
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Floor collision - prevent falling through map
        const floorY = 420;
        if (this.y > floorY) {
            this.y = floorY;
            this.vy = 0;
        }

        // Magnet to player
        const dist = Utils.distance(this.centerX, this.centerY, player.centerX, player.centerY);
        if (dist < this.magnetRange) {
            const angle = Utils.angle(this.centerX, this.centerY, player.centerX, player.centerY);
            const strength = 1 - (dist / this.magnetRange);
            this.vx += Math.cos(angle) * this.magnetSpeed * strength * dt;
            this.vy += Math.sin(angle) * this.magnetSpeed * strength * dt;
        }

        // Collect
        if (dist < 20) {
            player.addGold(this.value);
            this.active = false;
            AudioManager.play('pickup');
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 1, this.y + 1, 2, 2);
    }
}

// ==========================================
// ITEM DATABASE - Items you can get from chests
// ==========================================

const ItemDatabase = {
    items: {},

    init() {
        // Healing items
        this.register(new Item({
            id: 'small_potion', icon: '🧪',
            type: 'item', rarity: 'common', heal: 20
        }));
        this.register(new Item({
            id: 'med_potion', icon: '🧴',
            type: 'heal', rarity: 'rare', heal: 50
        }));
        this.register(new Item({
            id: 'large_potion', icon: '⚗️',
            type: 'heal', rarity: 'epic', heal: 100
        }));
        this.register(new Item({
            id: 'elixir', icon: '💎',
            type: 'heal', rarity: 'legendary', heal: 999
        }));

        // Mana potion (shop)
        this.register(new Item({
            id: 'mana_potion', icon: '🔷',
            type: 'item', rarity: 'common', manaRestore: 40
        }));

        // Legendary stat items (for boss rewards / late game)
        this.register(new Item({
            id: 'arcane_crown', icon: '👑',
            type: 'item', rarity: 'legendary', damageBonus: 20
        }));
        this.register(new Item({
            id: 'dragon_heart', icon: '🐉',
            type: 'item', rarity: 'legendary', maxHpBonus: 100
        }));
        this.register(new Item({
            id: 'void_boots', icon: '🥾',
            type: 'item', rarity: 'legendary', speedBonus: 60
        }));

        // Stat items
        this.register(new Item({
            id: 'heart_container', icon: '❤️',
            type: 'item', rarity: 'rare', maxHpBonus: 20
        }));
        this.register(new Item({
            id: 'mega_heart', icon: '💛',
            type: 'item', rarity: 'epic', maxHpBonus: 50
        }));

        // Utility items
        this.register(new Item({
            id: 'potion_refill', icon: '🍶',
            type: 'item', rarity: 'common', potions: 2
        }));
        this.register(new Item({
            id: 'gold_bag', icon: '💰',
            type: 'item', rarity: 'common', gold: 50
        }));
        this.register(new Item({
            id: 'treasure', icon: '👑',
            type: 'item', rarity: 'rare', gold: 200
        }));
        this.register(new Item({
            id: 'royal_treasure', icon: '💎',
            type: 'item', rarity: 'epic', gold: 500
        }));

        // Shop upgrade
        this.register(new Item({
            id: 'rune_pouch', icon: '🎒',
            type: 'item', rarity: 'rare', runeSlotBonus: 1, shopOnly: true
        }));

        // Active slot upgrade (shop only, expensive)
        this.register(new Item({
            id: 'active_bandolier', icon: '🧷',
            type: 'item', rarity: 'epic', activeSlotBonus: 1, shopOnly: true
        }));

        // Active items (shop only)
        this.register(new Item({
            id: 'blink_stone', icon: '💠',
            type: 'active', rarity: 'rare',
            cooldown: 8, activeEffect: 'blink', shopOnly: true
        }));
        this.register(new Item({
            id: 'smoke_bomb', icon: '💨',
            type: 'active', rarity: 'rare',
            cooldown: 12, activeEffect: 'smoke', shopOnly: true
        }));
        this.register(new Item({
            id: 'healing_totem', icon: '🌿',
            type: 'active', rarity: 'epic',
            cooldown: 18, activeEffect: 'heal', shopOnly: true
        }));

        // Mana potion (shop consumable)
        this.register(new Item({
            id: 'mana_potion', icon: '🔷',
            type: 'mana', rarity: 'common', manaRestore: 30
        }));

// ===========================
// EXTRA ITEMS (build variety)
// ===========================
// Mana / casting
this.register(new Item({
    id: 'mana_orb', icon: '🔵',
    type: 'item', rarity: 'common', maxManaBonus: 15
}));
this.register(new Item({
    id: 'mana_tome', icon: '📘',
    type: 'item', rarity: 'rare', maxManaBonus: 30
}));
this.register(new Item({
    id: 'mana_font', icon: '⛲',
    type: 'item', rarity: 'epic', manaRegenBonus: 0.6
}));
this.register(new Item({
    id: 'mana_forged', icon: '🔷',
    type: 'item', rarity: 'rare', manaCostFlat: -1
}));

// DPS / casting speed
this.register(new Item({
    id: 'spell_focus', icon: '🧿',
    type: 'item', rarity: 'rare', fireRateBonus: 0.15
}));
this.register(new Item({
    id: 'arcane_metronome', icon: '🎵',
    type: 'item', rarity: 'epic', fireRateBonus: 0.3
}));

// Projectiles
this.register(new Item({
    id: 'long_barrel', icon: '📏',
    type: 'item', rarity: 'rare', projectileRangeBonus: 0.2
}));
this.register(new Item({
    id: 'eagle_eye', icon: '🦅',
    type: 'item', rarity: 'epic', projectileRangeBonus: 0.4
}));
this.register(new Item({
    id: 'wind_core', icon: '🌪️',
    type: 'item', rarity: 'common', projectileSpeedBonus: 0.2
}));
this.register(new Item({
    id: 'storm_core', icon: '⛈️',
    type: 'item', rarity: 'rare', projectileSpeedBonus: 0.45
}));

// ===========================
// ITEM SETS (pieces + visible progress)
// ===========================
// Set: Storm (0/3)
// - Storm Ring
// - Storm Cloak
// - Storm Nucleus
this.register(new Item({
    id: 'storm_ring', icon: '💍',
    type: 'item', rarity: 'rare',
    setId: 'storm', setPiece: 'storm_ring'
}));
this.register(new Item({
    id: 'storm_cloak', icon: '🧥',
    type: 'item', rarity: 'epic',
    setId: 'storm', setPiece: 'storm_cloak'
}));
this.register(new Item({
    id: 'storm_nucleus', icon: '⚡',
    type: 'item', rarity: 'epic',
    setId: 'storm', setPiece: 'storm_nucleus'
}));


// Survivability
this.register(new Item({
    id: 'iron_skin', icon: '🛡️',
    type: 'item', rarity: 'rare', maxHpBonus: 40
}));


// Combat stats
this.register(new Item({
    id: 'ruby_focus', icon: '♦️',
    type: 'item', rarity: 'epic', damageBonus: 12
}));
this.register(new Item({
    id: 'obsidian_edge', icon: '🗡️',
    type: 'item', rarity: 'rare', damageBonus: 6
}));
this.register(new Item({
    id: 'swift_boots', icon: '👟',
    type: 'item', rarity: 'rare', speedBonus: 30
}));
this.register(new Item({
    id: 'swift_cloak', icon: '🧥',
    type: 'item', rarity: 'epic', speedBonus: 55
}));

// Potions / sustain
this.register(new Item({
    id: 'alchemist_kit', icon: '🧫',
    type: 'item', rarity: 'rare', potions: 3
}));
this.register(new Item({
    id: 'potion_belt', icon: '🧷',
    type: 'item', rarity: 'epic', potions: 5
}));

// More mana goodies
this.register(new Item({
    id: 'mana_battery', icon: '🔋',
    type: 'item', rarity: 'common', maxManaBonus: 20
}));
this.register(new Item({
    id: 'ether_conduit', icon: '🧬',
    type: 'item', rarity: 'rare', projectileSpeedBonus: 0.25
}));
this.register(new Item({
    id: 'astral_compass', icon: '🧭',
    type: 'item', rarity: 'rare', projectileRangeBonus: 0.25
}));

// Fire rate / casting
this.register(new Item({
    id: 'spell_sandglass', icon: '⌛',
    type: 'item', rarity: 'rare', fireRateBonus: 0.20
}));
this.register(new Item({
    id: 'caster_gloves', icon: '🧤',
    type: 'item', rarity: 'common', fireRateBonus: 0.10
}));

// Economy
this.register(new Item({
    id: 'coin_charm', icon: '🪙',
    type: 'item', rarity: 'rare', gold: 150
}));
    },

    register(item) {
        this.items[item.id] = item;
    },

    get(id) {
        return this.items[id];
    },

    getRandomItem(preferredRarity = 'common') {
        const itemList = Object.values(this.items).filter(i => !i.shopOnly && i.type !== 'active');

        // Filter by rarity preference
        let filtered = itemList.filter(i => i.rarity === preferredRarity);
        if (filtered.length === 0) {
            filtered = itemList.filter(i => i.rarity === 'common');
        }

        return { ...Utils.randomChoice(filtered) };
    },

    // Seeded version for deterministic loot
    getRandomItemSeeded(preferredRarity = 'common', rng) {
        const itemList = Object.values(this.items).filter(i => !i.shopOnly && i.type !== 'active');

        // Filter by rarity preference
        let filtered = itemList.filter(i => i.rarity === preferredRarity);
        if (filtered.length === 0) {
            filtered = itemList.filter(i => i.rarity === 'common');
        }

        return { ...Utils.seededChoice(rng, filtered) };
    },

    getByRarity(rarity) {
        return Object.values(this.items).filter(i => i.rarity === rarity);
    }
};

window.ItemRarity = ItemRarity;
window.Item = Item;
window.Chest = Chest;
window.Gold = Gold;
window.ItemDatabase = ItemDatabase;

// Sets: definitions + bonuses (applied when collecting pieces)
const SetDatabase = {
    storm: {
        id: 'storm',
        nameKey: 'setStormName',
        pieces: ['storm_ring','storm_cloak','storm_nucleus'],
        bonus2: { descKey: 'setStormBonus2Desc', apply: (p)=>{ p.projectileSpeedMult *= 1.15; } },
        bonus3: { descKey: 'setStormBonus3Desc', apply: (p)=>{ p.setStormDash = true; } }
    }
};
window.SetDatabase = SetDatabase;
