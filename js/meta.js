// ==========================================
// ARCANE DEPTHS - Meta Progress (Codex + Achievements)
// ==========================================

(function () {
    const META_KEY = 'arcane_depths_meta_v1';

    // Friendly names/descriptions for codex.
    // Friendly names/descriptions for codex (localized via i18n).
    const EnemyLore = new Proxy({}, {
        get: (_, id) => {
            try { return (window.i18n && typeof i18n.enemyLore === 'function') ? i18n.enemyLore(id) : { name: id, icon: '❓', desc: '' }; }
            catch (e) { return { name: id, icon: '❓', desc: '' }; }
        }
    });


    const BossLore = new Proxy({}, {
        get: (_, id) => {
            try { return (window.i18n && typeof i18n.bossLore === 'function') ? i18n.bossLore(id) : { name: id, icon: '❓', desc: '' }; }
            catch (e) { return { name: id, icon: '❓', desc: '' }; }
        }
    });


    // Achievement database.
    const AchievementDB = [
        {
            id: 'first_blood', icon: '🩸',
            name: 'Primera Sangre',
            desc: 'Derrota a tu primer enemigo.',
            progress: (m) => ({ cur: Math.min(1, m.stats.totalKills), target: 1 })
        },
        {
            id: 'exterminator_100', icon: '💀',
            name: 'Exterminador',
            desc: 'Derrota 100 enemigos (acumulado).',
            progress: (m) => ({ cur: Math.min(100, m.stats.totalKills), target: 100 })
        },
        {
            id: 'slayer_500', icon: '☠️',
            name: 'Segador',
            desc: 'Derrota 500 enemigos (acumulado).',
            progress: (m) => ({ cur: Math.min(500, m.stats.totalKills), target: 500 })
        },
        {
            id: 'first_boss', icon: '👑',
            name: 'Cazajefes',
            desc: 'Derrota a tu primer jefe.',
            progress: (m) => ({ cur: Math.min(1, m.stats.totalBossKills), target: 1 })
        },
        {
            id: 'cataclysm_down', icon: '🌌',
            name: 'Fin del Mundo',
            desc: 'Derrota a EL CATACLISMO.',
            progress: (m) => ({ cur: m.codex.bosses.final_boss?.kills ? 1 : 0, target: 1 })
        },
        {
            id: 'ngplus_1', icon: '➕',
            name: 'New Game Plus',
            desc: 'Entra a NG+ por primera vez.',
            progress: (m) => ({ cur: Math.min(1, m.stats.maxNgPlus), target: 1 })
        },
        {
            id: 'ngplus_5', icon: '🔁',
            name: 'Bucle Infinito',
            desc: 'Alcanza NG+5.',
            progress: (m) => ({ cur: Math.min(5, m.stats.maxNgPlus), target: 5 })
        },
        {
            id: 'rich_5000', icon: '💰',
            name: 'Acaparador',
            desc: 'Recolecta 5000 de oro total (acumulado).',
            progress: (m) => ({ cur: Math.min(5000, m.stats.totalGold), target: 5000 })
        },
        {
            id: 'rune_slot_plus', icon: '🎒',
            name: 'Más Espacio',
            desc: 'Compra una Bolsa de Runas (+1 slot).',
            progress: (m) => ({ cur: m.stats.runeSlotsBought > 0 ? 1 : 0, target: 1 })
        },
        {
            id: 'active_slot_plus', icon: '🧷',
            name: 'Doble Reliquia',
            desc: 'Compra una Funda de Reliquias (+1 slot activo).',
            progress: (m) => ({ cur: m.stats.activeSlotsBought > 0 ? 1 : 0, target: 1 })
        },
        {
            id: 'biomes_3', icon: '🗺️',
            name: 'Explorador',
            desc: 'Completa 3 biomas en una sola run.',
            progress: (m) => ({ cur: Math.min(3, m.stats.bestBiomesInRun), target: 3 })
        },
        {
            id: 'no_potions_biome', icon: '🥶',
            name: 'A Sangre Fría',
            desc: 'Completa 1 bioma sin usar pociones (en una run).',
            progress: (m) => ({ cur: m.stats.bestBiomesNoPotions ? 1 : 0, target: 1 })
        }
    ];

    function nowStr() {
        try { return new Date().toLocaleString(); } catch (e) { return '' + Date.now(); }
    }

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    const Meta = {
        data: null,

        init() {
            this.load();
            // Ensure structure
            this.data.codex = this.data.codex || { enemies: {}, bosses: {} };
            this.data.ach = this.data.ach || { unlocked: {} };
            // Meta currency + permanent upgrades (v0.1.2)
            if (this.data.essence === undefined) this.data.essence = 0;
            if (!this.data.upgrades) {
                this.data.upgrades = {
                    shop_slots: 1,   // lvl 1..5 => slots = 3 + lvl (4..8)
                    shop_rerolls: 1, // lvl 1..4 => rerolls = lvl (1..4)
                    luck: 1,         // lvl 1..4 => luckPct = lvl*5% (5..20)
                    dash: 1,         // lvl 1..3 => dashCharges = lvl (1..3)
                    start_gold: 1,   // lvl 1..4 => +0..150 oro inicial
                    vitality: 1,     // lvl 1..4 => +0..15 HP max
                    potion_belt: 1   // lvl 1..3 => +0..2 pociones iniciales
                };
            }
            this.data.stats = this.data.stats || {
                totalKills: 0,
                totalBossKills: 0,
                totalGold: 0,
                deaths: 0,
                maxNgPlus: 0,
                runeSlotsBought: 0,
                activeSlotsBought: 0,
                bestBiomesInRun: 0,
                bestBiomesNoPotions: false,
                bossKillsNormal: 0,
                bossKillsHard: 0,
                bossKillsDemonic: 0
            };
            // Backward-compatible defaults (older meta saves)
            const s = this.data.stats;
            if (s.bossKillsNormal === undefined) s.bossKillsNormal = 0;
            if (s.bossKillsHard === undefined) s.bossKillsHard = 0;
            if (s.bossKillsDemonic === undefined) s.bossKillsDemonic = 0;

            // Backward-compatible defaults for upgrades
            this.data.upgrades = this.data.upgrades || {};
            const u = this.data.upgrades;
            if (u.shop_slots === undefined) u.shop_slots = 1;
            if (u.shop_rerolls === undefined) u.shop_rerolls = 1;
            if (u.luck === undefined) u.luck = 1;
            if (u.dash === undefined) u.dash = 1;
            if (u.start_gold === undefined) u.start_gold = 1;
            if (u.vitality === undefined) u.vitality = 1;
            if (u.potion_belt === undefined) u.potion_belt = 1;
            if (this.data.essence === undefined) this.data.essence = 0;
            this.save();
        },

        // -------- Essence + Upgrades --------
        getEssence() {
            return Math.max(0, Math.floor(this.data.essence || 0));
        },

        addEssence(amount) {
            const n = Math.max(0, Math.floor(amount || 0));
            if (!n) return;
            this.data.essence = this.getEssence() + n;
            this.save();
        },

        getUpgradeLevel(key) {
            const u = this.data.upgrades || {};
            return Math.max(1, Math.floor(u[key] || 1));
        },

        getUpgradeMax(key) {
            if (key === 'shop_slots') return 5;
            if (key === 'shop_rerolls') return 4;
            if (key === 'luck') return 4;
            if (key === 'dash') return 3;
            if (key === 'start_gold') return 4;
            if (key === 'vitality') return 4;
            if (key === 'potion_belt') return 3;
            return 1;
        },

        getUpgradeCost(key) {
            const lvl = this.getUpgradeLevel(key);
            // Increasing cost curve (tuned for small numbers)
            if (key === 'shop_slots') return 3 + (lvl - 1) * 2;      // 3,5,7,9
            if (key === 'shop_rerolls') return 4 + (lvl - 1) * 3;    // 4,7,10
            if (key === 'luck') return 5 + (lvl - 1) * 4;           // 5,9,13
            if (key === 'dash') return 6 + (lvl - 1) * 5;           // 6,11
            if (key === 'start_gold') return 3 + (lvl - 1) * 2;     // 3,5,7
            if (key === 'vitality') return 4 + (lvl - 1) * 2;       // 4,6,8
            if (key === 'potion_belt') return 4 + (lvl - 1) * 3;    // 4,7
            return 999;
        },

        canBuyUpgrade(key) {
            const lvl = this.getUpgradeLevel(key);
            if (lvl >= this.getUpgradeMax(key)) return false;
            return this.getEssence() >= this.getUpgradeCost(key);
        },

        buyUpgrade(key) {
            const lvl = this.getUpgradeLevel(key);
            const max = this.getUpgradeMax(key);
            if (lvl >= max) return { ok: false, reason: 'max' };
            const cost = this.getUpgradeCost(key);
            if (this.getEssence() < cost) return { ok: false, reason: 'funds' };
            this.data.essence = this.getEssence() - cost;
            this.data.upgrades[key] = lvl + 1;
            this.save();
            return { ok: true, newLevel: lvl + 1 };
        },

        // Convenience getters (used by gameplay)
        getShopSlots() {
            const lvl = this.getUpgradeLevel('shop_slots');
            return Math.min(8, 3 + lvl);
        },

        getShopRerolls() {
            const lvl = this.getUpgradeLevel('shop_rerolls');
            return Math.min(4, Math.max(1, lvl));
        },

        getLuckPct() {
            const lvl = this.getUpgradeLevel('luck');
            return Math.min(0.20, Math.max(0.05, lvl * 0.05));
        },

        getDashChargesMax() {
            const lvl = this.getUpgradeLevel('dash');
            return Math.min(3, Math.max(1, lvl));
        },

        load() {
            try {
                const raw = localStorage.getItem(META_KEY);
                this.data = raw ? JSON.parse(raw) : { codex: { enemies: {}, bosses: {} }, ach: { unlocked: {} }, stats: {} };
            } catch (e) {
                this.data = { codex: { enemies: {}, bosses: {} }, ach: { unlocked: {} }, stats: {} };
            }
        },

        save() {
            try {
                localStorage.setItem(META_KEY, JSON.stringify(this.data));
            } catch (e) { }
        },

        // -------- Codex --------
        getEnemyInfo(type) {
            const base = EnemyLore[type] || { name: type, icon: '❔', desc: 'Entidad desconocida.' };
            const cfg = (window.EnemyTypes && EnemyTypes[type]) ? EnemyTypes[type] : null;
            return {
                type,
                icon: base.icon,
                name: base.name,
                desc: base.desc,
                cfg
            };
        },

        getBossInfo(type) {
            const base = BossLore[type] || { name: type, icon: '❔', desc: 'Entidad desconocida.' };
            const cfg = (window.BossTypes && BossTypes[type]) ? BossTypes[type] : null;
            return {
                type,
                icon: base.icon,
                name: base.name,
                desc: base.desc,
                cfg
            };
        },

        recordEnemyKill(type) {
            if (!type) return;
            const e = this.data.codex.enemies[type] || { kills: 0, firstSeen: nowStr() };
            if (e.kills === 0) e.firstSeen = nowStr();
            e.kills++;
            this.data.codex.enemies[type] = e;

            this.data.stats.totalKills = (this.data.stats.totalKills || 0) + 1;
            this.checkAchievements();
            this.save();
        },

        recordBossKill(type, difficulty) {
            if (!type) return;
            const b = this.data.codex.bosses[type] || { kills: 0, firstSeen: nowStr() };
            if (b.kills === 0) b.firstSeen = nowStr();
            b.kills++;
            this.data.codex.bosses[type] = b;

            // Global boss kills
            this.data.stats.totalBossKills = (this.data.stats.totalBossKills || 0) + 1;
            // Difficulty-gated unlocks
            const diff = (difficulty || (window.Game && Game.difficulty) || 'normal').toLowerCase();
            if (diff === 'normal') this.data.stats.bossKillsNormal = (this.data.stats.bossKillsNormal || 0) + 1;
            else if (diff === 'hard') this.data.stats.bossKillsHard = (this.data.stats.bossKillsHard || 0) + 1;
            else if (diff === 'demonic') this.data.stats.bossKillsDemonic = (this.data.stats.bossKillsDemonic || 0) + 1;

            this.checkAchievements();
            this.save();
        },

        recordGold(amount) {
            const n = Math.max(0, Math.floor(amount || 0));
            if (!n) return;
            this.data.stats.totalGold = (this.data.stats.totalGold || 0) + n;
            this.checkAchievements();
            this.save();
        },

        // -------- Meta currency & permanent upgrades (v0.1.2) --------
        getEssence() {
            return Math.max(0, Math.floor(this.data.essence || 0));
        },

        addEssence(amount) {
            const n = Math.max(0, Math.floor(amount || 0));
            if (!n) return;
            this.data.essence = this.getEssence() + n;
            this.save();
        },

        getUpgradeLevel(key) {
            const u = this.data.upgrades || {};
            const v = u[key];
            return (v === undefined || v === null) ? 1 : Math.max(1, Math.floor(v));
        },

        // Values derived from levels
        getShopSlots() {
            const lvl = Utils.clamp ? Utils.clamp(this.getUpgradeLevel('shop_slots'), 1, 5) : clamp(this.getUpgradeLevel('shop_slots'), 1, 5);
            return 3 + lvl; // 4..8
        },
        getShopRerolls() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('shop_rerolls'), 1, 4) : clamp(this.getUpgradeLevel('shop_rerolls'), 1, 4));
            return lvl; // 1..4
        },
        getLuckPct() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('luck'), 1, 4) : clamp(this.getUpgradeLevel('luck'), 1, 4));
            return lvl * 0.05; // 0.05..0.20
        },
        getDashCharges() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('dash'), 1, 3) : clamp(this.getUpgradeLevel('dash'), 1, 3));
            return lvl; // 1..3
        },
        getStartGold() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('start_gold'), 1, 4) : clamp(this.getUpgradeLevel('start_gold'), 1, 4));
            return Math.max(0, (lvl - 1) * 50);
        },
        getMaxHpBonus() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('vitality'), 1, 4) : clamp(this.getUpgradeLevel('vitality'), 1, 4));
            return Math.max(0, (lvl - 1) * 5);
        },
        getStartPotions() {
            const lvl = (Utils.clamp ? Utils.clamp(this.getUpgradeLevel('potion_belt'), 1, 3) : clamp(this.getUpgradeLevel('potion_belt'), 1, 3));
            return Math.max(0, (lvl - 1) * 1);
        },

        // Pricing (increases per level)
        getUpgradeMaxLevel(key) {
            if (key === 'shop_slots') return 5;
            if (key === 'shop_rerolls') return 4;
            if (key === 'luck') return 4;
            if (key === 'dash') return 3;
            if (key === 'start_gold') return 4;
            if (key === 'vitality') return 4;
            if (key === 'potion_belt') return 3;
            return 1;
        },

        getUpgradeCost(key) {
            const lvl = this.getUpgradeLevel(key);
            const next = lvl + 1;
            // Base costs tuned so upgrades feel earned; costs rise per purchase.
            const base = {
                shop_slots: 4,
                shop_rerolls: 3,
                luck: 5,
                dash: 6,
                start_gold: 3,
                vitality: 4,
                potion_belt: 4
            };
            const b = base[key] || 5;
            // Cost curve: b * (next-1) with a small ramp
            return Math.floor(b * (next - 1) * 1.2);
        },

        canBuyUpgrade(key) {
            const lvl = this.getUpgradeLevel(key);
            const max = this.getUpgradeMaxLevel(key);
            if (lvl >= max) return false;
            const cost = this.getUpgradeCost(key);
            return this.getEssence() >= cost;
        },

        buyUpgrade(key) {
            const lvl = this.getUpgradeLevel(key);
            const max = this.getUpgradeMaxLevel(key);
            if (lvl >= max) return false;
            const cost = this.getUpgradeCost(key);
            if (this.getEssence() < cost) return false;
            this.data.essence = this.getEssence() - cost;
            this.data.upgrades = this.data.upgrades || {};
            this.data.upgrades[key] = lvl + 1;
            this.save();
            return true;
        },

        recordNgPlus(level) {
            const l = Math.max(0, Math.floor(level || 0));
            this.data.stats.maxNgPlus = Math.max(this.data.stats.maxNgPlus || 0, l);
            this.checkAchievements();
            this.save();
        },

        recordPurchase(itemId) {
            if (itemId === 'rune_pouch') this.data.stats.runeSlotsBought = (this.data.stats.runeSlotsBought || 0) + 1;
            if (itemId === 'active_bandolier') this.data.stats.activeSlotsBought = (this.data.stats.activeSlotsBought || 0) + 1;
            this.checkAchievements();
            this.save();
        },

        recordRunSummary(summary) {
            // summary: { biomesCleared, usedPotions }
            if (!summary) return;
            const bc = Math.max(0, Math.floor(summary.biomesCleared || 0));
            this.data.stats.bestBiomesInRun = Math.max(this.data.stats.bestBiomesInRun || 0, bc);
            if (bc >= 1 && summary.usedPotions === 0) this.data.stats.bestBiomesNoPotions = true;
            this.checkAchievements();
            this.save();
        },

        recordDeath() {
            this.data.stats.deaths = (this.data.stats.deaths || 0) + 1;
            this.save();
        },

        // -------- Achievements --------
        isUnlocked(id) {
            return !!(this.data.ach && this.data.ach.unlocked && this.data.ach.unlocked[id]);
        },

        unlock(id) {
            if (this.isUnlocked(id)) return false;
            this.data.ach.unlocked[id] = { date: nowStr() };
            this.save();
            // Toast if UI available
            try {
                if (window.UI && typeof UI.toastAchievement === 'function') {
                    const a = AchievementDB.find(x => x.id === id);
                    if (a) { const loc = (window.i18n && typeof i18n.objective === 'function') ? i18n.objective(id) : {}; UI.toastAchievement(Object.assign({}, a, loc)); }
                }
            } catch (e) { }
            return true;
        },

        checkAchievements() {
            for (const a of AchievementDB) {
                if (this.isUnlocked(a.id)) continue;
                const p = a.progress ? a.progress(this.data) : { cur: 0, target: 1 };
                if ((p.cur || 0) >= (p.target || 1)) {
                    this.unlock(a.id);
                }
            }
        },

        getAchievementDB() { return AchievementDB; }
    };

    window.Meta = Meta;
})();