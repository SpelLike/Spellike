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
        this.name = config.name;
        this.icon = config.icon || '📦';
        this.desc = config.desc || '';
        this.type = config.type || 'item';
        this.rarity = config.rarity || 'common';

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

        // Optional behavior hooks
        this.forceLegendary = !!options.forceLegendary;
        this.isBossChest = !!options.isBossChest;
        this.onOpen = typeof options.onOpen === 'function' ? options.onOpen : null;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    open() {
        if (this.opened) return null;
        this.opened = true;
        AudioManager.play('chest');

        if (this.onOpen) {
            try { this.onOpen(); } catch (e) { /* ignore */ }
        }

        // Backwards compatible:
        // - Normal chests return a string rarity
        // - Boss chests can return a richer descriptor
        if (this.isBossChest || this.forceLegendary) {
            return { rarity: this.rarity, forceLegendary: this.forceLegendary, bossChest: this.isBossChest };
        }
        return this.rarity;
    }

    draw(ctx) {
        if (this.opened) {
            // Draw open chest (darker)
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this.sprite, this.x, this.y);
            ctx.globalAlpha = 1;
        } else {
            ctx.drawImage(this.sprite, this.x, this.y);

            // Sparkle effect
            if (Math.random() < 0.1) {
                const sparkX = this.x + Math.random() * this.width;
                const sparkY = this.y + Math.random() * this.height;
                ctx.fillStyle = '#fff';
                ctx.fillRect(sparkX, sparkY, 2, 2);
            }

            // Interaction prompt
            ctx.fillStyle = '#44ff88';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E]', this.centerX, this.y - 5);

            // Boss chest label
            if (this.isBossChest) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillText('BOSS', this.centerX, this.y - 14);
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
            id: 'small_potion', name: 'Poción Pequeña', icon: '🧪',
            desc: 'Cura 20 HP (instantáneo)', type: 'item', rarity: 'common', heal: 20
        }));
        this.register(new Item({
            id: 'med_potion', name: 'Poción Mediana', icon: '🧴',
            desc: 'Restaura 50 HP', type: 'heal', rarity: 'rare', heal: 50
        }));
        this.register(new Item({
            id: 'large_potion', name: 'Poción Grande', icon: '⚗️',
            desc: 'Restaura 100 HP', type: 'heal', rarity: 'epic', heal: 100
        }));
        this.register(new Item({
            id: 'elixir', name: 'Elixir de Vida', icon: '💎',
            desc: 'Restaura toda tu HP', type: 'heal', rarity: 'legendary', heal: 999
        }));

        // Mana potion (shop)
        this.register(new Item({
            id: 'mana_potion', name: 'Poción de Maná', icon: '🔷',
            desc: 'Restaura 40 Maná (instantáneo)', type: 'item', rarity: 'common', manaRestore: 40
        }));

        // Legendary stat items (for boss rewards / late game)
        this.register(new Item({
            id: 'arcane_crown', name: 'Corona Arcana', icon: '👑',
            desc: '+20 daño permanente', type: 'item', rarity: 'legendary', damageBonus: 20
        }));
        this.register(new Item({
            id: 'dragon_heart', name: 'Corazón de Dragón', icon: '🐉',
            desc: '+100 HP Máxima', type: 'item', rarity: 'legendary', maxHpBonus: 100
        }));
        this.register(new Item({
            id: 'void_boots', name: 'Botas del Vacío', icon: '🥾',
            desc: '+60 velocidad permanente', type: 'item', rarity: 'legendary', speedBonus: 60
        }));

        // Stat items
        this.register(new Item({
            id: 'heart_container', name: 'Contenedor de Corazón', icon: '❤️',
            desc: '+20 HP Máxima', type: 'item', rarity: 'rare', maxHpBonus: 20
        }));
        this.register(new Item({
            id: 'mega_heart', name: 'Corazón Dorado', icon: '💛',
            desc: '+50 HP Máxima', type: 'item', rarity: 'epic', maxHpBonus: 50
        }));

        // Utility items
        this.register(new Item({
            id: 'potion_refill', name: 'Recarga de Pociones', icon: '🍶',
            desc: '+2 Pociones', type: 'item', rarity: 'common', potions: 2
        }));
        this.register(new Item({
            id: 'gold_bag', name: 'Bolsa de Oro', icon: '💰',
            desc: '+50 Oro', type: 'item', rarity: 'common', gold: 50
        }));
        this.register(new Item({
            id: 'treasure', name: 'Tesoro', icon: '👑',
            desc: '+200 Oro', type: 'item', rarity: 'rare', gold: 200
        }));
        this.register(new Item({
            id: 'royal_treasure', name: 'Tesoro Real', icon: '💎',
            desc: '+500 Oro', type: 'item', rarity: 'epic', gold: 500
        }));

        // Shop upgrade
        this.register(new Item({
            id: 'rune_pouch', name: 'Bolsa de Runas', icon: '🎒',
            desc: '+1 slot de runas (permanente)', type: 'item', rarity: 'rare', runeSlotBonus: 1, shopOnly: true
        }));

        // Active slot upgrade (shop only, expensive)
        this.register(new Item({
            id: 'active_bandolier', name: 'Funda de Reliquias', icon: '🧷',
            desc: '+1 slot de activo (permanente)', type: 'item', rarity: 'epic', activeSlotBonus: 1, shopOnly: true
        }));

        // Active items (shop only)
        this.register(new Item({
            id: 'blink_stone', name: 'Piedra de Blink', icon: '💠',
            desc: 'Teletransporta hacia donde apuntas. [F]', type: 'active', rarity: 'rare',
            cooldown: 8, activeEffect: 'blink', shopOnly: true
        }));
        this.register(new Item({
            id: 'smoke_bomb', name: 'Bomba de Humo', icon: '💨',
            desc: '1.2s de invulnerabilidad. [F]', type: 'active', rarity: 'rare',
            cooldown: 12, activeEffect: 'smoke', shopOnly: true
        }));
        this.register(new Item({
            id: 'healing_totem', name: 'Totem de Curación', icon: '🌿',
            desc: 'Cura 20 HP (2 veces por sala). [F]', type: 'active', rarity: 'epic',
            cooldown: 18, activeEffect: 'heal', shopOnly: true
        }));

        // Mana potion (shop consumable)
        this.register(new Item({
            id: 'mana_potion', name: 'Poción de Maná', icon: '🔷',
            desc: 'Restaura 30 Maná', type: 'mana', rarity: 'common', manaRestore: 30
        }));

// ===========================
// EXTRA ITEMS (build variety)
// ===========================
// Mana / casting
this.register(new Item({
    id: 'mana_orb', name: 'Orbe de Maná', icon: '🔵',
    desc: '+15 Maná Máx.', type: 'item', rarity: 'common', maxManaBonus: 15
}));
this.register(new Item({
    id: 'mana_tome', name: 'Tomo de Maná', icon: '📘',
    desc: '+30 Maná Máx.', type: 'item', rarity: 'rare', maxManaBonus: 30
}));
this.register(new Item({
    id: 'mana_font', name: 'Fuente Arcana', icon: '⛲',
    desc: '+60% regen de maná', type: 'item', rarity: 'epic', manaRegenBonus: 0.6
}));
this.register(new Item({
    id: 'mana_forged', name: 'Cristal Forjado', icon: '🔷',
    desc: '-1 costo de maná por disparo', type: 'item', rarity: 'rare', manaCostFlat: -1
}));

// DPS / casting speed
this.register(new Item({
    id: 'spell_focus', name: 'Foco de Hechizo', icon: '🧿',
    desc: '+15% velocidad de disparo', type: 'item', rarity: 'rare', fireRateBonus: 0.15
}));
this.register(new Item({
    id: 'arcane_metronome', name: 'Metrónomo Arcano', icon: '🎵',
    desc: '+30% velocidad de disparo', type: 'item', rarity: 'epic', fireRateBonus: 0.3
}));

// Projectiles
this.register(new Item({
    id: 'long_barrel', name: 'Conducto Largo', icon: '📏',
    desc: '+20% rango de proyectil', type: 'item', rarity: 'rare', projectileRangeBonus: 0.2
}));
this.register(new Item({
    id: 'eagle_eye', name: 'Ojo de Águila', icon: '🦅',
    desc: '+40% rango de proyectil', type: 'item', rarity: 'epic', projectileRangeBonus: 0.4
}));
this.register(new Item({
    id: 'wind_core', name: 'Núcleo de Viento', icon: '🌪️',
    desc: '+20% velocidad de proyectil', type: 'item', rarity: 'common', projectileSpeedBonus: 0.2
}));
this.register(new Item({
    id: 'storm_core', name: 'Núcleo de Tormenta', icon: '⛈️',
    desc: '+45% velocidad de proyectil', type: 'item', rarity: 'rare', projectileSpeedBonus: 0.45
}));

// ===========================
// ITEM SETS (pieces + visible progress)
// ===========================
// Set: Tormenta (0/3)
// - Anillo de Tormenta
// - Capa de Tormenta
// - Núcleo de Tormenta
this.register(new Item({
    id: 'storm_ring', name: 'Anillo de Tormenta', icon: '💍',
    desc: 'Set Tormenta (1/3).', type: 'item', rarity: 'rare',
    setId: 'storm', setPiece: 'Anillo de Tormenta',
    projectileSpeedBonus: 0.15
}));
this.register(new Item({
    id: 'storm_cloak', name: 'Capa de Tormenta', icon: '🧥',
    desc: 'Set Tormenta (1/3).', type: 'item', rarity: 'epic',
    setId: 'storm', setPiece: 'Capa de Tormenta',
    speedBonus: 20
}));
this.register(new Item({
    id: 'storm_nucleus', name: 'Núcleo de Tormenta', icon: '⚡',
    desc: 'Set Tormenta (1/3).', type: 'item', rarity: 'epic',
    setId: 'storm', setPiece: 'Núcleo de Tormenta',
    damageBonus: 8
}));


// Survivability
this.register(new Item({
    id: 'iron_skin', name: 'Piel de Hierro', icon: '🛡️',
    desc: '+40 HP Máx.', type: 'item', rarity: 'rare', maxHpBonus: 40
}));


// Combat stats
this.register(new Item({
    id: 'ruby_focus', name: 'Foco Rubí', icon: '♦️',
    desc: '+12 daño permanente', type: 'item', rarity: 'epic', damageBonus: 12
}));
this.register(new Item({
    id: 'obsidian_edge', name: 'Borde Obsidiana', icon: '🗡️',
    desc: '+6 daño permanente', type: 'item', rarity: 'rare', damageBonus: 6
}));
this.register(new Item({
    id: 'swift_boots', name: 'Botas de Prisa', icon: '👟',
    desc: '+30 velocidad permanente', type: 'item', rarity: 'rare', speedBonus: 30
}));
this.register(new Item({
    id: 'swift_cloak', name: 'Capa Veloz', icon: '🧥',
    desc: '+55 velocidad permanente', type: 'item', rarity: 'epic', speedBonus: 55
}));

// Potions / sustain
this.register(new Item({
    id: 'alchemist_kit', name: 'Kit de Alquimista', icon: '🧫',
    desc: '+3 pociones', type: 'item', rarity: 'rare', potions: 3
}));
this.register(new Item({
    id: 'potion_belt', name: 'Cinturón de Pociones', icon: '🧷',
    desc: '+5 pociones', type: 'item', rarity: 'epic', potions: 5
}));

// More mana goodies
this.register(new Item({
    id: 'mana_battery', name: 'Batería Arcana', icon: '🔋',
    desc: '+20 Maná Máx.', type: 'item', rarity: 'common', maxManaBonus: 20
}));
this.register(new Item({
    id: 'ether_conduit', name: 'Conducto Etéreo', icon: '🧬',
    desc: '+25% velocidad de proyectil', type: 'item', rarity: 'rare', projectileSpeedBonus: 0.25
}));
this.register(new Item({
    id: 'astral_compass', name: 'Brújula Astral', icon: '🧭',
    desc: '+25% rango de proyectil', type: 'item', rarity: 'rare', projectileRangeBonus: 0.25
}));

// Fire rate / casting
this.register(new Item({
    id: 'spell_sandglass', name: 'Reloj de Arena', icon: '⌛',
    desc: '+20% velocidad de disparo', type: 'item', rarity: 'rare', fireRateBonus: 0.20
}));
this.register(new Item({
    id: 'caster_gloves', name: 'Guantes del Hechicero', icon: '🧤',
    desc: '+10% velocidad de disparo', type: 'item', rarity: 'common', fireRateBonus: 0.10
}));

// Economy
this.register(new Item({
    id: 'coin_charm', name: 'Amuleto de Monedas', icon: '🪙',
    desc: '+150 oro', type: 'item', rarity: 'rare', gold: 150
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
        name: 'Tormenta',
        pieces: ['Anillo de Tormenta','Capa de Tormenta','Núcleo de Tormenta'],
        bonus2: { desc: '+15% velocidad de proyectil', apply: (p)=>{ p.projectileSpeedMult *= 1.15; } },
        bonus3: { desc: 'Dash deja un disparo de rayo', apply: (p)=>{ p.setStormDash = true; } }
    }
};
window.SetDatabase = SetDatabase;
