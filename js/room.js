// ==========================================
// ARCANE DEPTHS - Room System with DOOR
// ==========================================

class Room {
    constructor(config = {}) {
        this.width = config.width || 800;
        this.height = config.height || 500;
        this.tileSize = 16;
        this.biome = config.biome || 'forest';

        this.bounds = {
            x: 32,
            y: 48, // Más espacio arriba para la puerta
            width: this.width - 64,
            height: this.height - 80
        };

        this.tiles = [];
        this.enemies = [];
        this.items = [];
        this.chests = [];
        this.gold = [];
        this.shop = null;
        this.events = [];

        // Coordinated encounters
        this.director = null;
        this.traps = []; // enemy trapper mines
        this.lavaPools = []; // boss mutation hazards

        // Negative room modifiers (hazards) - applied when entering room
        this.roomModifiers = [];
        this.hazards = [];
        this.barrels = [];
        this._entryModsApplied = false;
        this._progressApplied = false;
        this._eliteApplied = false;
        this._hazardTick = 0;
        this._hazardTick2 = 0;

        this.cleared = false;
        this.type = config.type || 'combat';
        this.doorOpen = false;

        // Door position
        this.doorX = this.width / 2 - 24;
        this.doorY = 8;
        this.doorWidth = 48;
        this.doorHeight = 40;

        // Backtracking portal (bottom)
        this.backDoorX = this.width / 2 - 22;
        this.backDoorY = this.height - 52;
        this.backDoorWidth = 44;
        this.backDoorHeight = 32;

        this.generateLayout();
        this.initDirector();
    }

    generateLayout() {
        const cols = Math.floor(this.width / this.tileSize);
        const rows = Math.floor(this.height / this.tileSize);

        this.tiles = [];
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < cols; x++) {
                if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
                    row.push({ type: 'wall', solid: true });
                } else if (x === 1 || x === cols - 2 || y === 1 || y === rows - 2) {
                    row.push({ type: 'wall', solid: true });
                } else {
                    row.push({ type: 'floor', solid: false });
                }
            }
            this.tiles.push(row);
        }
    }


// -------------------------
// Coordinated encounter spawning (role compositions)
// -------------------------
initDirector() {
    if (this.type === 'combat' || this.type === 'elite' || this.type === 'miniboss' || this.type === 'boss') {
        this.director = new RoomAIDirector(this);
    }
}


addTrap(trap) {
    this.traps.push({ ...trap, t: 0, active: true });
}

updateTraps(dt, player) {
    if (!this.traps || this.traps.length === 0) return;
    for (const t of this.traps) {
        if (!t.active) continue;
        t.t += dt;
        const armed = (t.t >= (t.arm || 0.3));
        // Pulse draw indicator via particles
        if (armed && Math.random() < 0.15) {
            ParticleSystem.burst(t.x, t.y, 1, { color: '#ffcc33', life: 0.25, size: 2, speed: 0 });
        }
        if (!player || !armed) continue;
        const d = Utils.distance(player.centerX, player.centerY, t.x, t.y);
        if (d <= (t.r || 20)) {
            t.active = false;
            ParticleSystem.burst(t.x, t.y, 18, { color: '#ffcc33', life: 0.35, size: 4, speed: 3 });
            AudioManager.play('hit');
            try { player.takeDamage(t.dmg || 8); } catch (e) {}
            try { if (typeof player.applySlow === 'function') player.applySlow(t.slow || 0.6, t.slowDur || 1.4); } catch (e) {}
        }
    }
    // Cleanup
    this.traps = this.traps.filter(t => t.active);
}

drawTraps(ctx) {
    if (!this.traps || this.traps.length === 0) return;
    ctx.save();
    for (const t of this.traps) {
        if (!t.active) continue;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = 'rgba(255, 204, 51, 0.9)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, (t.r || 20), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

addLavaPool(x, y, r = 70, duration = 4.5) {
    this.lavaPools.push({ x, y, r, t: duration, active: true, tick: 0 });
}


addBossStrike(x, y, r = 28, warnTime = 0.85, strikeTime = 0.18, dmg = 12) {
    if (!this._bossStrikes) this._bossStrikes = [];
    this._bossStrikes.push({ x, y, r, warn: warnTime, strike: strikeTime, t: warnTime, phase: 'warn', dmg });
}

updateBossStrikes(dt, player) {
    if (!this._bossStrikes || this._bossStrikes.length === 0) return;
    for (let i = this._bossStrikes.length - 1; i >= 0; i--) {
        const s = this._bossStrikes[i];
        s.t -= dt;
        if (s.phase === 'warn' && s.t <= 0) {
            s.phase = 'strike';
            s.t = s.strike;
            // Damage on strike start
            if (player) {
                const d = Utils.distance(player.centerX, player.centerY, s.x, s.y);
                if (d <= s.r) {
                    try { player.takeDamage(s.dmg || 12); } catch (e) {}
                }
            }
            try { ParticleSystem.burst(s.x, s.y, 14, { color: '#b3e5fc', life: 0.35, size: 3, speed: 3 }); } catch (e) {}
            try { if (window.Game) Game.shake(4); } catch (e) {}
        } else if (s.phase === 'strike' && s.t <= 0) {
            this._bossStrikes.splice(i, 1);
        }
    }
}

drawBossStrikes(ctx) {
    if (!this._bossStrikes || this._bossStrikes.length === 0) return;
    ctx.save();
    for (const s of this._bossStrikes) {
        if (!s) continue;
        if (s.phase === 'warn') {
            const a = Math.max(0.15, Math.min(0.6, s.t / Math.max(0.01, s.warn)));
            ctx.globalAlpha = a;
            ctx.strokeStyle = 'rgba(180,220,255,0.95)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = 'rgba(180,220,255,0.9)';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

addBossAntiMagicZone(x, y, r = 110, duration = 2.2) {
    if (!this._bossAntiMagic) this._bossAntiMagic = [];
    this._bossAntiMagic.push({ x, y, r, t: duration });
}

updateBossAntiMagic(dt) {
    if (!this._bossAntiMagic || this._bossAntiMagic.length === 0) return;
    for (const z of this._bossAntiMagic) z.t -= dt;
    this._bossAntiMagic = this._bossAntiMagic.filter(z => z.t > 0);
}

isPlayerInAntiMagic(player) {
    if (!player) return false;
    const mods = (this.roomModifiers || []).filter(m => m.id === 'anti_magic');
    for (const m of mods) {
        for (const z of (m.zones || [])) {
            const d = Utils.distance(player.centerX, player.centerY, z.x, z.y);
            if (d <= z.r) return true;
        }
    }
    if (this._bossAntiMagic && this._bossAntiMagic.length) {
        for (const z of this._bossAntiMagic) {
            const d = Utils.distance(player.centerX, player.centerY, z.x, z.y);
            if (d <= z.r) return true;
        }
    }
    return false;
}

    spawnEnemies(count, difficulty = 1, biomeEnemies = ['goblin']) {
        for (let i = 0; i < count; i++) {
            const type = Utils.randomChoice(biomeEnemies);
            const x = Utils.random(this.bounds.x + 80, this.bounds.x + this.bounds.width - 80);
            const y = Utils.random(this.bounds.y + 80, this.bounds.y + this.bounds.height - 80);
            const enemy = createEnemy(type, x, y, difficulty);
            this.enemies.push(enemy);
        }
    }


    spawnMiniBoss(type = 'goblin', difficulty = 2) {
        const x = this.bounds.x + this.bounds.width / 2 - 16;
        const y = this.bounds.y + this.bounds.height / 2 - 16;
        const mini = createEnemy(type, x, y, difficulty);
        mini.isMiniBoss = true;
        mini.isElite = true;
        mini.maxHp = Math.floor(mini.maxHp * 6);
        mini.hp = mini.maxHp;
        mini.damage = Math.floor(mini.damage * 2);
        mini.speed = mini.speed * 1.2;
        mini.goldValue = (mini.goldValue || 10) * 4;
        // Mini-boss special attack timer
        mini._miniRingTimer = 2.2;
        this.enemies.push(mini);
        this.type = 'miniboss';
    }

    spawnBlackMarket(ngPlusLevel = 0) {
        const x = this.bounds.x + this.bounds.width / 2 - 40;
        const y = this.bounds.y + this.bounds.height / 2 + 40;

        this.shop = {
            x,
            y,
            width: 90,
            height: 34,
            theme: 'blackmarket',
            rerollsLeft: 1,
            inventory: []
        };

        // High tier runes + risky relics
        const epic = getRandomRune('epic');
        const legendary = getRandomRune('legendary');
        if (epic) this.shop.inventory.push({ kind: 'rune', rune: { ...epic, rarity: 'epic' }, price: 650 + ngPlusLevel * 120, sold: false, locked: false });
        if (legendary) this.shop.inventory.push({ kind: 'rune', rune: { ...legendary, rarity: 'legendary' }, price: 1100 + ngPlusLevel * 200, sold: false, locked: false });

        // Corrupted deals (big upside + downside via onBuy)
        const pactBlade = { id: 'pact_blade', name: 'Hoja del Pacto', icon: '🩸', desc: '+25 daño, pero -15% HP máximo', type: 'item', rarity: 'legendary', damageBonus: 25 };
        this.shop.inventory.push({
            kind: 'item', item: pactBlade, price: 1200 + ngPlusLevel * 220, sold: false, locked: false,
            onBuy: () => {
                Game.player.maxHp = Math.max(30, Math.floor(Game.player.maxHp * 0.85));
                Game.player.hp = Math.min(Game.player.hp, Game.player.maxHp);
                Game.player.addPassiveItem({ ...pactBlade, desc: pactBlade.desc + ' (Corrompido)' });
            }
        });

        const cursedPouch = { ...ItemDatabase.get('rune_pouch'), id: 'cursed_rune_pouch', name: 'Bolsa Maldita', icon: '🪬', desc: '+2 slots de runas, pero enemigos +20% daño', type: 'item', rarity: 'epic', runeSlotBonus: 2 };
        this.shop.inventory.push({
            kind: 'item', item: cursedPouch, price: 950 + ngPlusLevel * 180, sold: false, locked: false,
            onBuy: () => {
                Game.player.addRuneSlots(2);
                Game.player.addPassiveItem({ ...cursedPouch });
                Game.modifiers.enemyStatMult = (Game.modifiers.enemyStatMult || 1) * 1.2;
            }
        });

        // Mid-game expensive active slot upgrade also appears here sometimes
        const activeSlot = ItemDatabase.get('active_bandolier');
        if (activeSlot) this.shop.inventory.push({ kind: 'item', item: { ...activeSlot, type: 'item' }, price: 1700 + ngPlusLevel * 250, sold: false, locked: false });

        this.shop.allowReroll = true;
        this.shop.allowLock = true;
    }

    maybeSpawnRoomEvent() {
        // Simple random shrine event after clearing combat-like rooms
        if (this.type !== 'combat' && this.type !== 'elite' && this.type !== 'miniboss') return;
        if (this._eventSpawned) return;

        const chance = 0.18;
        if (Math.random() > chance) return;

        this._eventSpawned = true;

        // Keep events away from center chest/shop lanes.
        const x = Utils.clamp(
            this.bounds.x + 84,
            this.bounds.x + 24,
            this.bounds.x + this.bounds.width - 60
        );
        const y = Utils.clamp(
            this.bounds.y + this.bounds.height / 2 - 28,
            this.bounds.y + 72,
            this.bounds.y + this.bounds.height - 88
        );

        const pool = ['shrine', 'shrine', 'campfire', 'campfire', 'pact'];
        try { if (window.Game && Game.difficulty === 'demonic') pool.push('pact'); } catch (e) { }
        const kind = Utils.randomChoice(pool);

        this.events.push({
            kind,
            x, y, w: 36, h: 36,
            used: false
        });

        // If a chest already exists (common room-clear flow), push it away from the event.
        const chest = (this.chests || []).find(c => c && !c.opened);
        if (chest) {
            chest.x = Utils.clamp(
                this.bounds.x + this.bounds.width * 0.68 - chest.width / 2,
                this.bounds.x + 40,
                this.bounds.x + this.bounds.width - chest.width - 40
            );
            chest.y = Utils.clamp(
                this.bounds.y + this.bounds.height / 2 - 72,
                this.bounds.y + 40,
                this.bounds.y + this.bounds.height - chest.height - 60
            );
        }
    }
    spawnChest(rarity = 'common', chestIndex = 0) {
        let x = this.bounds.x + this.bounds.width / 2 - 12;
        if (this.events && this.events.some(ev => !ev.used)) {
            x = Utils.clamp(
                this.bounds.x + this.bounds.width * 0.68 - 12,
                this.bounds.x + 40,
                this.bounds.x + this.bounds.width - 52
            );
        }
        // Move chest a bit up so it doesn't overlap with shop terminals in mixed rooms
        const y = Utils.clamp(
            this.bounds.y + this.bounds.height / 2 - 70,
            this.bounds.y + 40,
            this.bounds.y + this.bounds.height - 60
        );
        
        // Generate deterministic loot seed
        let lootSeed = null;
        try {
            if (window.Game && Game.seedText && Game.dungeon) {
                const biomeIdx = window.BiomeOrder ? BiomeOrder.indexOf(Game.currentBiome) : 0;
                const roomIdx = Game.dungeon.currentRoomIndex || 0;
                const seedBase = `${Game.seedText}-${biomeIdx}-${roomIdx}-chest-${chestIndex}`;
                lootSeed = seedBase;
            }
        } catch (e) { }
        
        const chest = new Chest(x, y, rarity, { lootSeed });
        this.chests.push(chest);
    }

    spawnShop() {
        const x = this.bounds.x + this.bounds.width / 2 - 40;
        // Move shop down to keep clear separation from the center chest
        const y = Utils.clamp(
            this.bounds.y + this.bounds.height / 2 + 90,
            this.bounds.y + 40,
            this.bounds.y + this.bounds.height - 60
        );

        this.shop = {
            x,
            y,
            width: 80,
            height: 32,
            theme: 'shop',
            rerollsLeft: (window.Meta && typeof Meta.getShopRerolls === 'function') ? Meta.getShopRerolls() : 1,
            allowReroll: true,
            allowLock: true,
            inventory: []
        };

        // Build shop inventory: runes + upgrades + some active items
        const rare1 = getRandomRune('rare');
        const rare2 = getRandomRune('rare');
        const epic = getRandomRune('epic');

        if (rare1) this.shop.inventory.push({ kind: 'rune', rune: { ...rare1, rarity: 'rare' }, price: 180, sold: false, locked: false });
        if (rare2) this.shop.inventory.push({ kind: 'rune', rune: { ...rare2, rarity: 'rare' }, price: 180, sold: false, locked: false });
        if (epic) this.shop.inventory.push({ kind: 'rune', rune: { ...epic, rarity: 'epic' }, price: 320, sold: false, locked: false });

        // Special upgrade item: +1 rune slot
        const slotItem = ItemDatabase.get('rune_pouch');
        if (slotItem) this.shop.inventory.push({ kind: 'item', item: { ...slotItem, type: 'item' }, price: 1200, sold: false, locked: false });

        // Expensive upgrade: +1 active item slot (mid game)
        const activeSlot = ItemDatabase.get('active_bandolier');
        if (activeSlot) this.shop.inventory.push({ kind: 'item', item: { ...activeSlot, type: 'item' }, price: 1500, sold: false, locked: false });

        // Active items for sale (shop only)
        const blink = ItemDatabase.get('blink_stone');
        const smoke = ItemDatabase.get('smoke_bomb');
        const healTotem = ItemDatabase.get('healing_totem');
        if (blink) this.shop.inventory.push({ kind: 'item', item: { ...blink, type: 'active' }, price: 420, sold: false, locked: false });
        if (smoke) this.shop.inventory.push({ kind: 'item', item: { ...smoke, type: 'active' }, price: 520, sold: false, locked: false });
        if (healTotem) this.shop.inventory.push({ kind: 'item', item: { ...healTotem, type: 'active' }, price: 680, sold: false, locked: false });

        // Potions
        const hpPot = ItemDatabase.get('small_potion');
        const mpPot = ItemDatabase.get('mana_potion');
        if (hpPot) this.shop.inventory.push({ kind: 'item', item: { ...hpPot }, price: 80, sold: false, locked: false });
        if (mpPot) this.shop.inventory.push({ kind: 'item', item: { ...mpPot }, price: 90, sold: false, locked: false });

        // Limit visible offers based on permanent upgrade (slots), keeping potions always available.
        const maxOffers = (window.Meta && typeof Meta.getShopSlots === 'function') ? Meta.getShopSlots() : 4;
        const isPotion = (e) => e && e.kind === 'item' && e.item && (e.item.id === 'small_potion' || e.item.id === 'mana_potion');
        const potions = this.shop.inventory.filter(isPotion);
        const offers = this.shop.inventory.filter(e => !isPotion(e));

        // Shuffle offers for variety
        for (let i = offers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = offers[i];
            offers[i] = offers[j];
            offers[j] = t;
        }

        const totalSlots = Math.max(4, Math.min(8, maxOffers));
        const maxPotionSlots = totalSlots <= 4 ? 1 : 2;
        const chosenPotions = potions.slice(0, Math.min(maxPotionSlots, potions.length));
        const offerSlots = Math.max(1, totalSlots - chosenPotions.length);

        let finalInventory = offers.slice(0, offerSlots).concat(chosenPotions);
        if (finalInventory.length < totalSlots) {
            const missing = totalSlots - finalInventory.length;
            finalInventory = finalInventory.concat(potions.slice(chosenPotions.length, chosenPotions.length + missing));
        }
        this.shop.inventory = finalInventory.slice(0, totalSlots);
    }



// ==========================
// Entry modifiers: scaling + elites + negative room hazards
// ==========================
applyEntryModifiers(game) {
    if (this._entryModsApplied) return;
    this._entryModsApplied = true;

    // Only apply to rooms that actually have enemies (including boss rooms)
    const hasEnemies = (this.enemies && this.enemies.length > 0);
    if (hasEnemies) {
        this.applyRunProgressScaling(game);
        this.applyEliteTransformations(game);
    }
    // Negative room modifiers only for enemy rooms (not shops/event rooms)
    if (this.type === 'combat' || this.type === 'elite' || this.type === 'miniboss' || this.type === 'boss') {
        this.initNegativeRoomModifiers(game);
    }
}

applyRunProgressScaling(game) {
    if (this._progressApplied) return;
    this._progressApplied = true;
    if (!game || typeof game.getEnemyProgressMult !== 'function') return;

    const mult = game.getEnemyProgressMult();
    if (!mult) return;

    for (const e of this.enemies) {
        if (!e || !e.active) continue;
        // Bosses also scale, but slightly less to keep patterns readable
        const isBoss = !!(e.isBoss || e.bossType);
        const hpM = isBoss ? (1 + (mult.hp - 1) * 0.65) : mult.hp;
        const dmgM = isBoss ? (1 + (mult.dmg - 1) * 0.55) : mult.dmg;

        // IMPORTANT: scaling is applied on room entry; enemies should start at full HP.
        // Keeping previous hp while increasing maxHp makes them look "damaged" on spawn.
        e.maxHp = Math.floor(e.maxHp * hpM);
        e.hp = e.maxHp;
        e.damage = Math.floor(e.damage * dmgM);
    }
}

applyEliteTransformations(game) {
    if (this._eliteApplied) return;
    this._eliteApplied = true;
    if (!game || typeof game.getEliteChance !== 'function') return;

    const chance = game.getEliteChance(); // 0..1
    const roomIndex = (game.dungeon && typeof game.dungeon.currentRoomIndex === 'number') ? game.dungeon.currentRoomIndex : 0;
    const biome = this.biome || (game.currentBiome || 'forest');

    // Transform PER ENEMY (your request). At 100% -> ALL become elites.
    for (const e of this.enemies) {
        if (!e || !e.active) continue;
        if (e.isBoss || e.bossType || e.isMiniBoss) continue;
        if (e.isElite) continue;

        if (chance >= 1 || Math.random() < chance) {
            e.isElite = true;
            // Elite baseline buff (then mods)
            e.maxHp = Math.floor(e.maxHp * 2.0);
            e.hp = e.maxHp;
            e.damage = Math.floor(e.damage * 1.35);
            e.goldValue = Math.floor((e.goldValue || 6) * 1.5);
            e.damageTakenMult = (e.damageTakenMult || 1) * 0.95;

            // Apply biome variant (already applied at spawn, but keep safe)
            try { if (window.applyBiomeVariantToEnemy) applyBiomeVariantToEnemy(e, biome); } catch (err) {}
            // Apply elite modifiers (VMP/SHD/etc)
            try { if (window.applyEliteModifiers) applyEliteModifiers(e, { roomIndex, biome }); } catch (err) {}
        }
    }
}

initNegativeRoomModifiers(game) {
    // Already initialized?
    if (this.roomModifiers && this.roomModifiers.length > 0) return;

    // Global toggle: allow starting runs with events off
    if (game && game.eventsEnabled === false) return;

    const diff = (game && game.difficulty) ? game.difficulty : 'normal';
    const k = (game && typeof game.bossKillsThisRun === 'number') ? game.bossKillsThisRun : 0;

    // How many negatives per room?
    let minMods = 0, maxMods = 1;
    if (diff === 'hard') { minMods = 0; maxMods = 2; }
    if (diff === 'demonic') { minMods = 1; maxMods = 2; }

    // As you kill bosses, chance of more modifiers rises
    const bossBonus = Math.min(0.35, k * 0.08);
    if (Math.random() < bossBonus) minMods = Math.min(maxMods, minMods + 1);

    const count = Utils.clamp(Utils.random(minMods, maxMods), 0, 2);

    const pool = [
        'mud','meteors','toxic_fog','darkness','lightning','ice',
        'gravity_wells','spikes','mana_drain','anti_magic','enrage','barrels'
    ];

    // Avoid some brutal combos
    const bannedPairs = new Set([
        'darkness|meteors',
        'darkness|lightning',
        'meteors|lightning'
    ]);

    const chosen = [];
    let tries = 0;
    while (chosen.length < count && tries++ < 50) {
        const pick = Utils.randomChoice(pool);
        if (chosen.includes(pick)) continue;

        const ok = chosen.every(x => !bannedPairs.has(`${x}|${pick}`) && !bannedPairs.has(`${pick}|${x}`));
        if (!ok) continue;

        chosen.push(pick);
    }

    for (const id of chosen) {
        this.addRoomModifier(id);
    }
}

addRoomModifier(id) {
    const mod = { id, t: 0 };
    this.roomModifiers.push(mod);

    // Initialize modifier data
    if (id === 'mud') {
        mod.zones = [];
        const zCount = Utils.random(2, 4);
        for (let i = 0; i < zCount; i++) {
            const w = Utils.random(120, 220);
            const h = Utils.random(70, 140);
            const x = Utils.random(this.bounds.x + 40, this.bounds.x + this.bounds.width - w - 40);
            const y = Utils.random(this.bounds.y + 50, this.bounds.y + this.bounds.height - h - 40);
            mod.zones.push({ x, y, w, h });
        }
    } else if (id === 'meteors') {
        mod.timer = 1.3;
        mod.pending = [];
        mod.lastPoints = [];
    } else if (id === 'toxic_fog') {
        mod.timer = 0;
        mod.safeZones = [];
        const sCount = 2;
        for (let i = 0; i < sCount; i++) {
            mod.safeZones.push(this._randomSafeZone());
        }
        mod.rotateTimer = 6.0;
    } else if (id === 'darkness') {
        mod.radius = 130;
    } else if (id === 'lightning') {
        mod.timer = 1.4;
        mod.lines = [];
    } else if (id === 'ice') {
        // No extra state; player movement handles it via room flag.
        this.hasIce = true;
    } else if (id === 'gravity_wells') {
        mod.wells = [];
        const c = Utils.random(1, 2);
        for (let i = 0; i < c; i++) {
            const x = Utils.random(this.bounds.x + 90, this.bounds.x + this.bounds.width - 90);
            const y = Utils.random(this.bounds.y + 90, this.bounds.y + this.bounds.height - 90);
            mod.wells.push({ x, y, r: 85, pull: 180 });
        }
    } else if (id === 'spikes') {
        mod.tiles = [];
        const c = Utils.random(6, 10);
        for (let i = 0; i < c; i++) {
            const x = Utils.random(this.bounds.x + 60, this.bounds.x + this.bounds.width - 60);
            const y = Utils.random(this.bounds.y + 80, this.bounds.y + this.bounds.height - 60);
            mod.tiles.push({ x, y, r: 18, phase: Math.random() * 2 });
        }
    } else if (id === 'mana_drain') {
        mod.timer = 0;
    } else if (id === 'anti_magic') {
        mod.zones = [];
        const zCount = Utils.random(1, 2);
        for (let i = 0; i < zCount; i++) {
            const r = Utils.random(70, 110);
            const x = Utils.random(this.bounds.x + r, this.bounds.x + this.bounds.width - r);
            const y = Utils.random(this.bounds.y + r, this.bounds.y + this.bounds.height - r);
            mod.zones.push({ x, y, r });
        }
    } else if (id === 'enrage') {
        mod.timer = 3.0;
        mod.active = false;
        mod.activeTimer = 0;
    } else if (id === 'barrels') {
        const c = Utils.random(3, 6);
        for (let i = 0; i < c; i++) {
            const x = Utils.random(this.bounds.x + 70, this.bounds.x + this.bounds.width - 70);
            const y = Utils.random(this.bounds.y + 90, this.bounds.y + this.bounds.height - 70);
            // Barrel hitbox is slightly taller (looks like a real barrel)
            this.barrels.push({ x, y, w: 22, h: 26, active: true });
        }
    }
}

_randomSafeZone() {
    const r = Utils.random(80, 110);
    const x = Utils.random(this.bounds.x + r, this.bounds.x + this.bounds.width - r);
    const y = Utils.random(this.bounds.y + r, this.bounds.y + this.bounds.height - r);
    return { x, y, r };
}

isPlayerInAntiMagic(player) {
    if (!player) return false;
    const mod = (this.roomModifiers || []).find(m => m.id === 'anti_magic');
    if (!mod) return false;
    const px = player.centerX, py = player.centerY;
    return mod.zones.some(z => Utils.distance(px, py, z.x, z.y) <= z.r);
}

getMoveMultiplier(player) {
    let mult = 1;
    const mud = (this.roomModifiers || []).find(m => m.id === 'mud');
    if (mud && player) {
        const px = player.centerX, py = player.centerY;
        for (const z of mud.zones) {
            if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
                mult *= 0.75;
                break;
            }
        }
    }
    return mult;
}

updateRoomModifiers(dt, player) {
    if (!this.roomModifiers || this.roomModifiers.length === 0) return;

    // Toxic fog rotation + damage
    const fog = this.roomModifiers.find(m => m.id === 'toxic_fog');
    if (fog) {
        fog.rotateTimer -= dt;
        if (fog.rotateTimer <= 0) {
            fog.rotateTimer = 6.0;
            fog.safeZones = [this._randomSafeZone(), this._randomSafeZone()];
        }
        // Damage if outside safe zones
        if (player && player.hp > 0) {
            const px = player.centerX, py = player.centerY;
            const safe = fog.safeZones.some(z => Utils.distance(px, py, z.x, z.y) <= z.r);
            if (!safe) {
                this._hazardTick += dt;
                if (this._hazardTick >= 0.5) {
                    this._hazardTick = 0;
                    player.takeDamage(2);
                }
            }
        }
    }

    // Meteors
    const met = this.roomModifiers.find(m => m.id === 'meteors');
    if (met) {
        met.timer -= dt;
        if (met.timer <= 0) {
            met.timer = 1.2 + Math.random() * 0.6;

            // Pick a truly random point, avoiding repeating the same spots
            let x = 0, y = 0;
            for (let tries = 0; tries < 12; tries++) {
                x = Utils.random(this.bounds.x + 70, this.bounds.x + this.bounds.width - 70);
                y = Utils.random(this.bounds.y + 90, this.bounds.y + this.bounds.height - 70);
                const ok = !(met.lastPoints || []).some(p => Utils.distance(p.x, p.y, x, y) < 120);
                if (ok) break;
            }
            met.lastPoints = met.lastPoints || [];
            met.lastPoints.push({ x, y });
            while (met.lastPoints.length > 6) met.lastPoints.shift();

            const total = 0.95;
            met.pending.push({ x, y, r: 30, t: total, total });
        }
        for (let i = met.pending.length - 1; i >= 0; i--) {
            const p = met.pending[i];
            p.t -= dt;
            if (p.t <= 0) {
                // explode
                this.explodeAt(p.x, p.y, 80, 18, player, { source: 'meteor' });
                met.pending.splice(i, 1);
            }
        }
    }

    // Lightning lines
    const lig = this.roomModifiers.find(m => m.id === 'lightning');
    if (lig) {
        lig.timer -= dt;
        if (lig.timer <= 0) {
            lig.timer = 1.6 + Math.random() * 0.7;
            const vertical = Math.random() < 0.5;
            if (vertical) {
                const x = Utils.random(this.bounds.x + 60, this.bounds.x + this.bounds.width - 60);
                lig.lines.push({ x1: x, y1: this.bounds.y, x2: x, y2: this.bounds.y + this.bounds.height, phase: 'warn', t: 0.9 });
            } else {
                const y = Utils.random(this.bounds.y + 60, this.bounds.y + this.bounds.height - 60);
                lig.lines.push({ x1: this.bounds.x, y1: y, x2: this.bounds.x + this.bounds.width, y2: y, phase: 'warn', t: 0.9 });
            }
        }
        for (let i = lig.lines.length - 1; i >= 0; i--) {
            const l = lig.lines[i];
            l.t -= dt;
            if (l.phase === 'warn' && l.t <= 0) {
                // FIRE phase: brief, strong line + damage
                l.phase = 'strike';
                l.t = 0.18;

                // Damage player and enemies now (at the start of strike)
                const distToLine = (px, py) => (l.x1 === l.x2) ? Math.abs(px - l.x1) : Math.abs(py - l.y1);
                if (player) {
                    const dist = distToLine(player.centerX, player.centerY);
                    if (dist < 18) player.takeDamage(14);
                }
                for (const e of this.enemies) {
                    if (!e || !e.active || e.isBoss) continue;
                    const dist = distToLine(e.centerX, e.centerY);
                    if (dist < 18) e.takeDamage(8);
                }
                try { ParticleSystem.burst((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 10, { color: '#b3e5fc', life: 0.35, size: 3, speed: 3 }); } catch (e) {}
                try { if (window.Game) Game.shake(4); } catch (e) {}
            } else if (l.phase === 'strike' && l.t <= 0) {
                lig.lines.splice(i, 1);
            }
        }
    }

    // Gravity wells
    const grav = this.roomModifiers.find(m => m.id === 'gravity_wells');
    if (grav && player) {
        for (const w of grav.wells) {
            const dx = w.x - player.centerX;
            const dy = w.y - player.centerY;
            const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            if (d < w.r) {
                const pull = (1 - d / w.r) * w.pull;
                player.x += (dx / d) * pull * dt;
                player.y += (dy / d) * pull * dt;
                if (d < 26) {
                    this._hazardTick2 += dt;
                    if (this._hazardTick2 >= 0.5) { this._hazardTick2 = 0; player.takeDamage(2); }
                }
            }
        }
        // Clamp after pull
        player.x = Utils.clamp(player.x, this.bounds.x, this.bounds.x + this.bounds.width - player.width);
        player.y = Utils.clamp(player.y, this.bounds.y, this.bounds.y + this.bounds.height - player.height);
    }

    // Spikes
    const spikes = this.roomModifiers.find(m => m.id === 'spikes');
    if (spikes && player) {
        for (const t of spikes.tiles) {
            t.phase += dt;
            const active = (Math.sin(t.phase * Math.PI) > 0.6);
            if (active) {
                const d = Utils.distance(player.centerX, player.centerY, t.x, t.y);
                if (d < t.r) {
                    this._hazardTick2 += dt;
                    if (this._hazardTick2 >= 0.45) { this._hazardTick2 = 0; player.takeDamage(4); }
                }
            }
        }
    }

    // Mana drain
    const md = this.roomModifiers.find(m => m.id === 'mana_drain');
    if (md && player) {
        md.timer += dt;
        if (md.timer >= 1.0) {
            md.timer = 0;
            player.mana = Math.max(0, player.mana - 4);
        }
    }

    // Enrage
    const enr = this.roomModifiers.find(m => m.id === 'enrage');
    if (enr) {
        enr.timer -= dt;
        if (enr.timer <= 0) {
            enr.timer = 4.0 + Math.random() * 2;
            enr.active = true;
            enr.activeTimer = 2.2;
            // Apply to enemies
            for (const e of this.enemies) {
                if (!e || !e.active || e.isBoss) continue;
                e.enragedTimer = enr.activeTimer;
            }
        }
        if (enr.active) {
            enr.activeTimer -= dt;
            if (enr.activeTimer <= 0) enr.active = false;
        }
    }
}

explodeAt(x, y, radius, damage, player = null, opts = {}) {
    // Visual
    try { ParticleSystem.burst(x, y, 26, { color: '#ffb74d', life: 0.55, size: 5, speed: 5 }); } catch (e) {}
    try { if (window.Game) Game.shake(8); } catch (e) {}

    // Damage player
    if (player) {
        const d = Utils.distance(player.centerX, player.centerY, x, y);
        if (d < radius) player.takeDamage(damage);
    }

    // Damage enemies (barrels/meteors feel fairer and more chaotic)
    if (this.enemies && this.enemies.length) {
        for (const e of this.enemies) {
            if (!e || !e.active) continue;
            const d = Utils.distance(e.centerX, e.centerY, x, y);
            if (d < radius) {
                const a = Utils.angle(x, y, e.centerX, e.centerY);
                let dmg = damage;
                // Bosses take reduced explosion damage to keep patterns alive
                if (e.isBoss || e.bossType) dmg = Math.floor(damage * 0.6);
                try { e.takeDamage(dmg, a, 140); } catch (err) {}
            }
        }
    }
}

drawRoomModifiers(ctx, player) {
    if (!this.roomModifiers || this.roomModifiers.length === 0) return;

    // Mud
    const mud = this.roomModifiers.find(m => m.id === 'mud');
    if (mud) {
        ctx.save();
        ctx.fillStyle = 'rgba(90, 60, 25, 0.35)';
        for (const z of mud.zones) ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.restore();
    }

    // Anti-magic zones
    const am = this.roomModifiers.find(m => m.id === 'anti_magic');
    if (am) {
        ctx.save();
        ctx.strokeStyle = 'rgba(140, 200, 255, 0.85)';
        ctx.fillStyle = 'rgba(20, 40, 80, 0.18)';
        ctx.lineWidth = 2;
        for (const z of am.zones) {
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    // Toxic fog overlay
    const fog = this.roomModifiers.find(m => m.id === 'toxic_fog');
    if (fog) {
        ctx.save();
        ctx.fillStyle = 'rgba(30, 120, 60, 0.15)';
        ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        // Safe zones
        ctx.strokeStyle = 'rgba(140, 255, 190, 0.9)';
        ctx.lineWidth = 2;
        for (const z of fog.safeZones) {
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Meteors telegraphs
    const met = this.roomModifiers.find(m => m.id === 'meteors');
    if (met) {
        ctx.save();
        for (const p of met.pending) {
            const frac = p.total ? Utils.clamp(p.t / p.total, 0, 1) : 1;
            const alpha = 0.15 + (1 - frac) * 0.35;
            // Filled danger zone
            ctx.fillStyle = `rgba(255, 90, 30, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 140, 60, ${0.9})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Center marker + countdown ticks
            ctx.fillStyle = `rgba(255,255,255,${0.75})`;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', p.x, p.y + 5);
        }
        ctx.restore();
    }

    // Lightning telegraphs
    const lig = this.roomModifiers.find(m => m.id === 'lightning');
    if (lig) {
        ctx.save();
        for (const l of lig.lines) {
            const warn = (l.phase === 'warn');
            ctx.strokeStyle = warn ? 'rgba(180, 220, 255, 0.35)' : 'rgba(220, 245, 255, 0.95)';
            ctx.lineWidth = warn ? 2 : 6;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();

            // Flash edges during strike
            if (!warn) {
                ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    // Gravity wells
    const grav = this.roomModifiers.find(m => m.id === 'gravity_wells');
    if (grav) {
        ctx.save();
        for (const w of grav.wells) {
            ctx.strokeStyle = 'rgba(170, 120, 255, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Spikes
    const spikes = this.roomModifiers.find(m => m.id === 'spikes');
    if (spikes) {
        ctx.save();
        for (const t of spikes.tiles) {
            const active = (Math.sin(t.phase * Math.PI) > 0.6);

            // Base plate
            const plate = Math.max(14, (t.r || 18) + 4);
            ctx.fillStyle = active ? 'rgba(60,60,65,0.55)' : 'rgba(40,40,45,0.35)';
            ctx.strokeStyle = active ? 'rgba(120,120,130,0.55)' : 'rgba(90,90,100,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(t.x - plate / 2, t.y - plate / 2, plate, plate);
            ctx.fill();
            ctx.stroke();

            // Spikes (retracted vs extended)
            const innerR = Math.max(6, (t.r || 18) * 0.35);
            const outerR = active ? (t.r || 18) * 1.15 : (t.r || 18) * 0.55;
            const spikeCount = 4;
            const baseA = Math.PI / 4;
            for (let i = 0; i < spikeCount; i++) {
                const a = baseA + (i / spikeCount) * Math.PI * 2;
                const tipX = t.x + Math.cos(a) * outerR;
                const tipY = t.y + Math.sin(a) * outerR;
                const leftX = t.x + Math.cos(a - 0.35) * innerR;
                const leftY = t.y + Math.sin(a - 0.35) * innerR;
                const rightX = t.x + Math.cos(a + 0.35) * innerR;
                const rightY = t.y + Math.sin(a + 0.35) * innerR;

                ctx.fillStyle = active ? 'rgba(230,230,240,0.95)' : 'rgba(180,180,190,0.35)';
                ctx.strokeStyle = active ? 'rgba(90,90,95,0.75)' : 'rgba(80,80,85,0.25)';
                ctx.lineWidth = active ? 1.5 : 1;
                ctx.beginPath();
                ctx.moveTo(leftX, leftY);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(rightX, rightY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    // Barrels
    if (this.barrels && this.barrels.length > 0) {
        ctx.save();
        for (const b of this.barrels) {
            if (!b.active) continue;
            // Draw a small barrel sprite (no emoji, no horizontal scroll)
            const x = b.x, y = b.y, w = b.w, h = b.h;
            // Body
            ctx.fillStyle = 'rgba(140, 86, 40, 0.95)';
            ctx.strokeStyle = 'rgba(60, 30, 10, 0.95)';
            ctx.lineWidth = 1;
            // Rounded rect body
            const r = 4;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Metal hoops
            ctx.strokeStyle = 'rgba(30, 30, 30, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 6);
            ctx.lineTo(x + w - 2, y + 6);
            ctx.moveTo(x + 2, y + h - 7);
            ctx.lineTo(x + w - 2, y + h - 7);
            ctx.stroke();

            // Warning dot
            ctx.fillStyle = 'rgba(255, 90, 40, 0.9)';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Darkness overlay drawn last
    const dark = this.roomModifiers.find(m => m.id === 'darkness');
    if (dark && player) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);

        // Cut-out circle
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(player.centerX, player.centerY, dark.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

    update(dt, player) {
        // Director (coordinated roles)
        if (this.director && typeof this.director.update === 'function') {
            this.director.update(dt, player, this);
        }

        // Traps (from trappers)
        this.updateTraps(dt, player);
        this.updateBossAntiMagic(dt);
        this.updateBossStrikes(dt, player);

        // Lava pools (boss mutations)
        if (this.lavaPools && this.lavaPools.length) {
            for (const p of this.lavaPools) {
                if (!p.active) continue;
                p.t -= dt;
                if (p.t <= 0) { p.active = false; continue; }
                // damage over time
                const d = Utils.distance(player.centerX, player.centerY, p.x, p.y);
                if (d < p.r) {
                    p.tick = (p.tick || 0) + dt;
                    if (p.tick >= 0.45) {
                        p.tick = 0;
                        player.takeDamage(2);
                    }
                }
            }
        }

        // Update enemies
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(dt, player, this);

                // FIX: Melee collision with player - use separate collision cooldown
                if (enemy.collidesWith(player) && enemy.canDealContactDamage()) {
                    const prevHp = player.hp;
                    player.takeDamage(enemy.damage);
                    enemy.onDealtContactDamage(); // Reset enemy's collision cooldown
                    const dmgDone = prevHp - player.hp;
                    if (dmgDone > 0 && typeof enemy.onHitPlayer === 'function') {
                        enemy.onHitPlayer(dmgDone);
                    }
                }
            }
        }

        // Update gold
        for (let i = this.gold.length - 1; i >= 0; i--) {
            this.gold[i].update(dt, player);
            if (!this.gold[i].active) {
                this.gold.splice(i, 1);
            }
        }

        // Update chests (animations)
        for (const chest of this.chests) {
            if (chest && typeof chest.update === 'function') {
                chest.update(dt);
            }
        }

        // Update negative room modifiers
        this.updateRoomModifiers(dt, player);

        // Check if room cleared
        // Elite rooms are also combat rooms, so they must open the door when cleared.
        if (!this.cleared && (this.type === 'combat' || this.type === 'elite' || this.type === 'miniboss')) {
            const aliveEnemies = this.enemies.filter(e => e.active);
            if (aliveEnemies.length === 0) {
                this.onCleared(player);
            }
        }
    }

    onCleared(player) {
        this.cleared = true;
        // Mark once-cleared so backtracking never re-activates enemies.
        this._clearedOnce = true;
        this.doorOpen = true;
        player.stats.roomsCleared++;

        // Reward: refill 50% of max mana on room clear (additive, capped).
        // (Only after all enemies are dead.)
        try {
            if (player && typeof player.maxMana === 'number' && typeof player.mana === 'number') {
                const add = player.maxMana * 0.5;
                player.mana = Math.min(player.maxMana, player.mana + add);
            }
        } catch (e) { }

        // Spawn reward chest
        if (this.chests.length === 0) {
            const rarities = (this.type === 'miniboss') ? ['epic','epic','rare'] : (this.type === 'elite' ? ['rare','rare','epic'] : ['common','common','rare']);
            this.spawnChest(Utils.randomChoice(rarities));
        }

        this.maybeSpawnRoomEvent();

        AudioManager.play('chest');

        // Scripted runes: OnRoomClear
        try {
            if (window.RuneScript && window.Game && Game.player) {
                RuneScript.trigger('OnRoomClear', { player: player, room: this });
            }
        } catch (e) {}

    }

    draw(ctx) {
        // Draw tiles
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const sprite = Sprites.getTile(tile.type, this.biome);
                ctx.drawImage(sprite, x * this.tileSize, y * this.tileSize);
            }
        }

        // Draw door
        this.drawDoor(ctx);
        this.drawBackDoor(ctx);

        // Draw shop (if any)
        this.drawShop(ctx);

        // Draw events
        this.drawEvents(ctx);

        // Draw negative room modifiers (hazards)
        try { this.drawRoomModifiers(ctx, (window.Game ? Game.player : null)); } catch (e) {}

        // Enemy traps + boss telegraphs + boss lava
        try { this.drawTraps(ctx); } catch (e) {}
        try { this.drawBossStrikes(ctx); } catch (e) {}
        try {
            if (this._bossAntiMagic && this._bossAntiMagic.length) {
                ctx.save();
                for (const z of this._bossAntiMagic) {
                    ctx.globalAlpha = 0.35;
                    ctx.strokeStyle = 'rgba(160, 120, 255, 0.9)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }
        } catch (e) {}

        try {
            if (this.lavaPools && this.lavaPools.length) {
                ctx.save();
                for (const p of this.lavaPools) {
                    if (!p.active) continue;
                    ctx.globalAlpha = 0.55;
                    ctx.fillStyle = 'rgba(255,80,0,0.55)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        } catch (e) {}

        // Draw chests
        for (const chest of this.chests) {
            chest.draw(ctx);
        }

        // Draw gold
        for (const g of this.gold) {
            g.draw(ctx);
        }

        // Draw enemies
        const p = (window.Game ? Game.player : null);
        for (const enemy of this.enemies) {
            if (enemy.active) enemy.draw(ctx, this, p);
        }
    }


    drawEvents(ctx) {
        if (!this.events || this.events.length === 0) return;
        const t = Date.now() / 1000;

        const labelByKind = {
            shrine: i18n.t('eventShrine'),
            campfire: i18n.t('eventCampfire'),
            pact: i18n.t('eventPact'),
            forge: i18n.t('eventForge')
        };
        const colorByKind = {
            shrine: '#b388ff',
            campfire: '#ffb74d',
            pact: '#ff6b6b',
            forge: '#7db7ff'
        };
        const promptByKind = {
            shrine: 'rgba(170, 255, 210, ALPHA)',
            campfire: 'rgba(255, 220, 170, ALPHA)',
            pact: 'rgba(255, 180, 180, ALPHA)',
            forge: 'rgba(190, 230, 255, ALPHA)'
        };

        for (const ev of this.events) {
            const pulse = 0.5 + 0.5 * Math.sin(t * 4 + ev.x * 0.04);
            const x = ev.x;
            const y = ev.y;
            const w = ev.w;
            const h = ev.h;
            const cx = x + w / 2;
            const cy = y + h / 2;
            const frame = colorByKind[ev.kind] || '#9aa0a6';

            ctx.save();

            // Base shadow and pedestal.
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(x + 2, y + h - 4, w, 6);

            ctx.fillStyle = ev.used ? 'rgba(55, 55, 55, 0.78)' : 'rgba(22, 26, 34, 0.88)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = ev.used ? '#4b4b4b' : frame;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Inner pattern by event type.
            if (ev.kind === 'shrine') {
                ctx.strokeStyle = ev.used ? '#666' : '#d9c4ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 9, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx, cy - 7);
                ctx.lineTo(cx + 7, cy);
                ctx.lineTo(cx, cy + 7);
                ctx.lineTo(cx - 7, cy);
                ctx.closePath();
                ctx.stroke();
            } else if (ev.kind === 'campfire') {
                ctx.strokeStyle = ev.used ? '#666' : '#e8c08a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx - 8, cy + 7);
                ctx.lineTo(cx + 8, cy + 2);
                ctx.moveTo(cx - 8, cy + 2);
                ctx.lineTo(cx + 8, cy + 7);
                ctx.stroke();

                ctx.fillStyle = ev.used ? '#6f5a3d' : '#ff9f43';
                ctx.beginPath();
                ctx.moveTo(cx, cy - 8);
                ctx.lineTo(cx + 5, cy + 3);
                ctx.lineTo(cx, cy + 1);
                ctx.lineTo(cx - 5, cy + 3);
                ctx.closePath();
                ctx.fill();
            } else if (ev.kind === 'pact') {
                ctx.strokeStyle = ev.used ? '#666' : '#ff9a9a';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx - 6, cy - 9, 12, 18);
                ctx.beginPath();
                ctx.moveTo(cx, cy - 6);
                ctx.lineTo(cx + 7, cy + 6);
                ctx.lineTo(cx - 7, cy + 6);
                ctx.closePath();
                ctx.stroke();
            } else if (ev.kind === 'forge') {
                ctx.fillStyle = ev.used ? '#4b5a66' : '#22445e';
                ctx.fillRect(cx - 9, cy - 8, 18, 12);
                ctx.strokeStyle = ev.used ? '#6b6b6b' : '#9bd4ff';
                ctx.strokeRect(cx - 9, cy - 8, 18, 12);
                ctx.fillStyle = ev.used ? '#5f6f7a' : '#8de1ff';
                ctx.fillRect(cx - 6, cy - 5, 12, 4);
            }

            // Prompt
            if (!ev.used) {
                const alpha = (0.55 + pulse * 0.35).toFixed(3);
                const promptColor = (promptByKind[ev.kind] || 'rgba(210, 230, 255, ALPHA)').replace('ALPHA', alpha);
                ctx.fillStyle = promptColor;
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`[E] ${labelByKind[ev.kind] || 'EVENTO'}`, cx, y - 7);
            }

            ctx.restore();
        }
    }
    drawShop(ctx) {
        if (!this.shop) return;

        const x = this.shop.x;
        const y = this.shop.y;
        const w = this.shop.width;
        const h = this.shop.height;
        const t = Date.now() / 1000;

        // Stall base
        ctx.save();
        ctx.shadowColor = (this.shop.theme === 'blackmarket') ? '#ff2d95' : '#4fc3f7';
        ctx.shadowBlur = 10 + Math.sin(t * 3) * 4;
        ctx.fillStyle = (this.shop.theme === 'blackmarket') ? '#2b0b1f' : '#102a43';
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = (this.shop.theme === 'blackmarket') ? '#ff2d95' : '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Icon & label
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.shop.theme === 'blackmarket' ? 'BM' : '$', x + w / 2, y + 20);

        // Interaction prompt
        ctx.fillStyle = '#44ff88';
        ctx.font = '10px monospace';
        const shopLabel = (window.i18n ? i18n.t(this.shop.theme === 'blackmarket' ? 'shopBlackmarket' : 'shopTitle') : (this.shop.theme === 'blackmarket' ? 'MERCADO NEGRO' : 'TIENDA'));
        ctx.fillText(`[E] ${shopLabel}`, x + w / 2, y - 6);
        ctx.restore();
    }

    drawDoor(ctx) {
        const x = this.doorX;
        const y = this.doorY;
        const w = this.doorWidth;
        const h = this.doorHeight;
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const time = Date.now() / 1000;

        if (this.doorOpen) {
            // === EPIC ANIMATED PORTAL ===

            // Outer glow
            const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w);
            outerGlow.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
            outerGlow.addColorStop(0.5, 'rgba(123, 77, 255, 0.2)');
            outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = outerGlow;
            ctx.fillRect(x - 20, y - 20, w + 40, h + 40);

            // Door frame with glow
            ctx.shadowColor = '#7b4dff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x - 6, y - 4, 6, h + 8);
            ctx.fillRect(x + w, y - 4, 6, h + 8);
            ctx.fillRect(x - 6, y - 8, w + 12, 8);
            ctx.shadowBlur = 0;

            // Portal background - dark void
            ctx.fillStyle = '#0a0015';
            ctx.fillRect(x, y, w, h);

            // Swirling vortex layers
            for (let layer = 0; layer < 4; layer++) {
                const layerOffset = layer * 0.5;
                const radius = (w / 2 - 5) * (1 - layer * 0.15);

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(time * (1.5 + layer * 0.3) * (layer % 2 === 0 ? 1 : -1));

                // Spiral arms
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * radius, Math.sin(angle) * radius);

                    const hue = 180 + layer * 30 + Math.sin(time * 2 + i) * 20;
                    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
                    gradient.addColorStop(1, `hsla(${hue + 40}, 100%, 50%, 0)`);

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    const armWidth = 0.3 + Math.sin(time * 3 + i) * 0.1;
                    ctx.arc(0, 0, radius, angle - armWidth, angle + armWidth);
                    ctx.closePath();
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
                ctx.restore();
            }

            // Central bright core
            const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 12);
            coreGradient.addColorStop(0, '#ffffff');
            coreGradient.addColorStop(0.3, '#00e5ff');
            coreGradient.addColorStop(0.7, '#7b4dff');
            coreGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 12 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
            ctx.fill();

            // Floating particles in rings
            for (let ring = 0; ring < 3; ring++) {
                const ringRadius = 8 + ring * 8;
                const particleCount = 6 + ring * 2;
                const ringSpeed = (ring + 1) * 1.5;

                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2 + time * ringSpeed;
                    const wobble = Math.sin(time * 3 + i + ring) * 3;
                    const px = centerX + Math.cos(angle) * (ringRadius + wobble);
                    const py = centerY + Math.sin(angle) * (ringRadius + wobble) * 0.7;

                    const particleSize = 2 + Math.sin(time * 5 + i) * 1;
                    const alpha = 0.6 + Math.sin(time * 4 + i * 2) * 0.4;

                    ctx.fillStyle = `hsla(${200 + ring * 40}, 100%, 70%, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Energy arcs/lightning
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 + Math.sin(time * 8) * 0.3})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const startAngle = time * 2 + i * (Math.PI / 2);
                const startR = 5;
                const endR = w / 2 - 5;

                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(startAngle) * startR,
                    centerY + Math.sin(startAngle) * startR * 0.7
                );

                // Jagged lightning path
                for (let j = 0; j < 4; j++) {
                    const t = (j + 1) / 4;
                    const r = startR + (endR - startR) * t;
                    const jitterAngle = startAngle + (Math.random() - 0.5) * 0.3;
                    ctx.lineTo(
                        centerX + Math.cos(jitterAngle) * r + (Math.random() - 0.5) * 4,
                        centerY + Math.sin(jitterAngle) * r * 0.7 + (Math.random() - 0.5) * 4
                    );
                }
                ctx.stroke();
            }

            // Sparkle particles escaping
            for (let i = 0; i < 8; i++) {
                const sparkTime = (time * 2 + i * 0.5) % 2;
                const sparkAngle = (i / 8) * Math.PI * 2 + time * 0.5;
                const sparkDist = sparkTime * 30;
                const sparkAlpha = 1 - sparkTime / 2;

                if (sparkAlpha > 0) {
                    const sx = centerX + Math.cos(sparkAngle) * sparkDist;
                    const sy = centerY + Math.sin(sparkAngle) * sparkDist * 0.6 - sparkTime * 10;

                    ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
                    ctx.fillRect(sx - 1, sy - 1, 2, 2);
                }
            }

            // Text prompt with glow
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#44ff88';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText((window.i18n ? i18n.t('promptAdvance') : '[E] Advance'), centerX, y + h + 16);
            ctx.shadowBlur = 0;

        } else {
            // Closed door
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(x, y, w, h);

            // Door frame
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x - 4, y, 4, h);
            ctx.fillRect(x + w, y, 4, h);
            ctx.fillRect(x - 4, y - 4, w + 8, 8);

            // Door details
            ctx.fillStyle = '#2d1f1a';
            ctx.fillRect(x + 8, y + 8, w - 16, h - 16);

            // Lock with pulsing glow
            const lockPulse = 0.5 + Math.sin(time * 3) * 0.3;
            ctx.shadowColor = '#ff5722';
            ctx.shadowBlur = 8 * lockPulse;
            ctx.fillStyle = '#ff5722';
            ctx.fillRect(x + w / 2 - 4, y + h / 2 - 4, 8, 8);
            ctx.shadowBlur = 0;

            // Enemies remaining
            const remaining = this.enemies.filter(e => e.active).length;
            ctx.fillStyle = '#ff4444';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const remTxt = (window.i18n ? `💀 ${i18n.f('hudEnemiesRemaining', { n: remaining })}` : `💀 ${remaining} enemies`);
            ctx.fillText(remTxt, x + w / 2, y + h + 14);
        }
    }


    drawBackDoor(ctx) {
        if (!this.allowBack) return;
        if (!this.cleared) return;
        if (this.type === 'boss') return;

        const x = this.backDoorX, y = this.backDoorY, w = this.backDoorWidth, h = this.backDoorHeight;
        ctx.save();
        ctx.fillStyle = 'rgba(40, 60, 90, 0.85)';
        ctx.strokeStyle = 'rgba(120, 190, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(170, 220, 255, 0.95)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const backLabel = (window.i18n ? i18n.t('btnBack') : 'VOLVER');
        ctx.fillText(`[E] ${backLabel}`, x + w / 2, y + h / 2 + 3);
        ctx.restore();
    }

    getActiveEnemies() {
        return this.enemies.filter(e => e.active);
    }

    spawnGold(x, y, amount) {
        const count = Utils.random(2, 5);
        for (let i = 0; i < count; i++) {
            const gold = new Gold(
                x + Utils.random(-15, 15),
                y + Utils.random(-15, 15),
                Math.ceil(amount / count)
            );
            this.gold.push(gold);
        }
    }

    handleInteraction(player) {
        // Check events
        if (this.events && this.events.length) {
            for (const ev of this.events) {
                if (ev.used) continue;
                const cx = ev.x + ev.w / 2;
                const cy = ev.y + ev.h / 2;
                const dist = Utils.distance(player.centerX, player.centerY, cx, cy);

                if (ev.kind === 'shrine' && dist < 70) {
                    ev.used = true;
                    return { type: 'event', event: 'shrine' };
                }

                if (ev.kind === 'campfire' && dist < 70) {
                    ev.used = true;
                    return { type: 'event', event: 'campfire' };
                }

                if (ev.kind === 'pact' && dist < 70) {
                    ev.used = true;
                    return { type: 'event', event: 'pact' };
                }

                if (ev.kind === 'forge' && dist < 80) {
                    AudioManager.play('menuClick');
                    // Don't mark as used hereâ€”UI will handle final use. We mark on close/program.
                    return { type: 'forge', forge: ev };
                }
            }
        }

        // Check shop
        if (this.shop) {
            const sx = this.shop.x + this.shop.width / 2;
            const sy = this.shop.y + this.shop.height / 2;
            const distToShop = Utils.distance(player.centerX, player.centerY, sx, sy);
            if (distToShop < 70) {
                AudioManager.play('menuClick');
                return { type: 'shop', shop: this.shop };
            }
        }

        // Check chests
        for (const chest of this.chests) {
            if (!chest.opened && player.distanceTo(chest) < 50) {
                const loot = chest.open(player);
                if (loot) return { type: 'loot', item: loot };
            }
        }

        // Check back door (bottom) - only if cleared
        if (this.allowBack && this.cleared && this.type !== 'boss') {
            const bx = this.backDoorX + this.backDoorWidth / 2;
            const by = this.backDoorY + this.backDoorHeight / 2;
            const distBack = Utils.distance(player.centerX, player.centerY, bx, by);
            if (distBack < 60) {
                AudioManager.play('door');
                return { type: 'prevRoom' };
            }
        }

        // Check door - player near door at top
        if (this.doorOpen) {
            const doorCenterX = this.doorX + this.doorWidth / 2;
            const doorCenterY = this.doorY + this.doorHeight / 2;
            const distToDoor = Utils.distance(player.centerX, player.centerY, doorCenterX, doorCenterY);

            if (distToDoor < 60) {
                AudioManager.play('door');
                return { type: 'nextRoom' };
            }
        }

        return null;
    }

    // For save/load - get room state
    getState() {
        return {
            cleared: this.cleared,
            doorOpen: this.doorOpen,
            enemiesAlive: this.enemies.filter(e => e.active).length,
            chestsOpened: this.chests.filter(c => c.opened).length
        };
    }
}



class RoomAIDirector {
    constructor(room) {
        this.room = room;
        this.bb = {
            protectTargetId: -1,
            focusPlayer: true,
            holdZone: { x: room.bounds.x + room.bounds.width / 2, y: room.bounds.y + room.bounds.height / 2 },
            flankSide: 0
        };
        this._tick = 0;
        this._tickInterval = 0.35;
        this._lastPlayerX = null;
        this._lastPlayerY = null;
        this._stationaryT = 0;
        this._commanderDeadPulse = 0;
    }

    update(dt, player, room) {
        this._tick += dt;
        if (this._commanderDeadPulse > 0) this._commanderDeadPulse -= dt;

        // Stationary detection
        if (player) {
            if (this._lastPlayerX == null) { this._lastPlayerX = player.centerX; this._lastPlayerY = player.centerY; }
            const d = Utils.distance(player.centerX, player.centerY, this._lastPlayerX, this._lastPlayerY);
            if (d < 10) this._stationaryT += dt;
            else this._stationaryT = 0;
            this._lastPlayerX = player.centerX;
            this._lastPlayerY = player.centerY;
        }

        if (this._tick < this._tickInterval) return;
        this._tick = 0;

        // Protect the healer if present, else the sniper
        let healer = null, sniper = null, commander = null;
        for (const e of (room.enemies || [])) {
            if (!e || !e.active || e.isBoss) continue;
            if (e.role === 'healer') healer = healer || e;
            if (e.role === 'sniper') sniper = sniper || e;
            if (e.role === 'commander') commander = commander || e;
        }
        const protect = healer || sniper;
        this.bb.protectTargetId = protect ? protect._id : -1;

        // Focus player if stationary too long (punish)
        this.bb.focusPlayer = (this._stationaryT > 1.2);

        // Flank side based on player's horizontal position relative to room center
        if (player) {
            const cx = room.bounds.x + room.bounds.width / 2;
            this.bb.flankSide = (player.centerX < cx) ? 1 : -1;
        }

        // If commander died recently, brief berserk pulse
        if (commander && !commander.active) {
            this._commanderDeadPulse = 3.5;
        }
        if (this._commanderDeadPulse > 0) {
            for (const e of (room.enemies || [])) {
                if (!e || !e.active || e.isBoss) continue;
                e.enragedTimer = Math.max(e.enragedTimer || 0, 1.2);
            }
        }
    }
}

window.Room = Room;