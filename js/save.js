// ==========================================
// ARCANE DEPTHS - Save System
// ==========================================

const SaveManager = {
    SETTINGS_KEY: 'arcane_depths_settings',
    SLOT_PREFIX: 'arcane_depths_slot_',

    getDefaultSettings() {
        return {
            audio: { master: 75, music: 80, sfx: 70, ui: 80 },
            graphics: { screenshake: true, particles: true, hitflash: true }
        };
    },

    getSettings() {
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (e) {
            return this.getDefaultSettings();
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    },

    getSlot(slotId) {
        try {
            const saved = localStorage.getItem(this.SLOT_PREFIX + slotId);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    },

    saveSlot(slotId, data) {
        try {
            data.lastPlayed = new Date().toLocaleDateString();
            localStorage.setItem(this.SLOT_PREFIX + slotId, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save slot:', e);
        }
    },

    deleteSlot(slotId) {
        try {
            localStorage.removeItem(this.SLOT_PREFIX + slotId);
        } catch (e) {
            console.error('Failed to delete slot:', e);
        }
    },

    createSaveData(player, dungeon, biomeId, playTime) {
        return {
            slotId: UI.selectedSlot,
            biome: biomeId,
            biomeName: getBiome(biomeId).name,
            biomeNum: BiomeOrder.indexOf(biomeId) + 1,
            roomIndex: dungeon.currentRoomIndex,
            difficulty: dungeon.difficulty,
            eventsEnabled: (window.Game ? (Game.eventsEnabled !== false) : true),
            playTime: playTime,
            ngPlusLevel: (window.Game ? Game.ngPlusLevel : (dungeon.ngPlusLevel || 0)),
            bossKillsThisRun: (window.Game ? (Game.bossKillsThisRun || 0) : 0),
            emptyRunePityBoss: (window.Game ? (Game.emptyRunePityBoss || 0) : 0),
            emptyRunePityChest: (window.Game ? (Game.emptyRunePityChest || 0) : 0),
            forgePity: (window.Game ? (Game.forgePity || 0) : 0),
            biomeMutationId: (window.Game && Game.biomeMutation ? Game.biomeMutation.id : null),
            modifiers: (window.Game ? Game.modifiers : null),
            blessings: (window.Game ? Game.blessings : null),
            curses: (window.Game ? Game.curses : null),
            level: Math.floor(player.stats.kills / 10) + 1,
            player: {
                hp: player.hp,
                maxHp: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana,
                gold: player.gold,
                potions: player.potions,
                damage: player.damage,
                speed: player.speed,
                fireRate: player.fireRate,
                projectileSpeed: player.projectileSpeed,
                projectileRange: player.projectileRange,
                projectileSpeedMult: player.projectileSpeedMult || 1,
                projectileRangeMult: player.projectileRangeMult || 1,
                fireRateMult: player.fireRateMult || 1,
                manaRegenMultiplier: player.manaRegenMultiplier || 1,
                manaCostFlat: player.manaCostFlat || 0
            },
            runeSlots: player.runes.length,
            runes: player.runes.map(r => r ? { id: r.id, name: r.name, icon: r.icon } : null),
            activeSlots: (player.activeItems && player.activeItems.length) ? player.activeItems.length : 1,
            activeItems: (player.activeItems || []).map(a => a ? { id: a.id, name: a.name, icon: a.icon } : null),
            perks: player.perks.map(p => ({ id: p.id, name: p.name })),
            passiveItems: (player.passiveItems || []).map(it => ({ id: it.id, name: it.name, icon: it.icon, rarity: it.rarity, setId: it.setId, setPiece: it.setPiece })),
            stats: { ...player.stats }
        };
    },

    applyLoadedData(player, saveData) {
        player.hp = saveData.player.hp;
        player.maxHp = saveData.player.maxHp;
        player.mana = saveData.player.mana;
        player.maxMana = saveData.player.maxMana;
        player.gold = saveData.player.gold;
        player.potions = saveData.player.potions;
        player.damage = saveData.player.damage;
        player.speed = saveData.player.speed;
        player.fireRate = saveData.player.fireRate || player.fireRate;
        player.projectileSpeed = saveData.player.projectileSpeed || player.projectileSpeed;
        player.projectileRange = saveData.player.projectileRange || player.projectileRange;
        player.projectileSpeedMult = saveData.player.projectileSpeedMult || 1;
        player.projectileRangeMult = saveData.player.projectileRangeMult || 1;
        player.fireRateMult = saveData.player.fireRateMult || 1;
        player.manaRegenMultiplier = saveData.player.manaRegenMultiplier || player.manaRegenMultiplier || 1;
        player.manaCostFlat = (typeof saveData.player.manaCostFlat === 'number') ? saveData.player.manaCostFlat : (player.manaCostFlat || 0);
        player.stats = { ...saveData.stats };

        // Runes need to be re-fetched from DB
        const slots = saveData.runeSlots || (saveData.runes ? saveData.runes.length : 5) || 5;
        if (typeof player.ensureRuneSlots === 'function') {
            player.ensureRuneSlots(slots);
        }
        (saveData.runes || []).forEach((r, i) => {
            if (r) {
                const fullRune = this.findRuneById(r.id);
                const runeObj = fullRune || r;
                if (typeof player.equipRune === 'function') {
                    player.equipRune(runeObj, i);
                } else {
                    player.runes[i] = runeObj;
                }
            }
        });

        // Active items
        const activeSlots = saveData.activeSlots || (saveData.activeItems ? saveData.activeItems.length : 1) || 1;
        if (typeof player.ensureActiveSlots === 'function') {
            player.ensureActiveSlots(activeSlots);
        } else {
            // Fallback
            player.activeItems = new Array(activeSlots).fill(null);
            player.activeCooldowns = new Array(activeSlots).fill(0);
        }
        (saveData.activeItems || []).forEach((a, i) => {
            if (a) {
                const fullItem = ItemDatabase.get(a.id);
                player.activeItems[i] = fullItem ? { ...fullItem } : a;
            }
        });

        // Passive Items
        player.passiveItems = [];
        (saveData.passiveItems || []).forEach(p => {
            const fullItem = ItemDatabase.get(p.id);
            // If full item exists, use it to get latest stats/methods, but preserve saved props if needed
            // Actually, just re-fetching from DB is usually safest for static items.
            if (fullItem) {
                player.passiveItems.push({ ...fullItem });
            } else {
                // Fallback if item removed from DB
                player.passiveItems.push(p);
            }
        });
        // Re-apply passives logic? 
        // In many games, you might need to re-run 'onPickup' logic.
        // But here, stats are already saved in player.stats/damage/etc.
        // However, some passives might have continuous effects or flags.
        // Ideally, we trust the saved stats, but sets need to be re-calculated.
        // game.js applySetBonuses calls it every frame/update or once?
        // Let's ensure we don't double-apply stats if they are permanent.
        // If stats are saved (damage, speed etc), we DON'T need to re-apply "onPickup" stats.
        // But we DO need the items in the list for the UI AND for Set Bonuses.

    },

    findRuneById(id) {
        for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
            const rune = RuneDatabase[rarity].find(r => r.id === id);
            if (rune) return { ...rune, rarity };
        }
        return null;
    }
};

window.SaveManager = SaveManager;
