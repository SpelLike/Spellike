// ==========================================
// ARCANE DEPTHS - Meta Progress (Codex + Achievements)
// ==========================================

(function () {
    const META_KEY = 'arcane_depths_meta_v1';

    // Friendly names/descriptions for codex.
    const EnemyLore = {
        goblin: { name: 'Goblin', icon: '🟢', desc: 'Rápidos y molestos. Te presionan en grupo.' },
        skeleton: { name: 'Esqueleto', icon: '💀', desc: 'Resistentes. Pegan más fuerte de lo que parece.' },
        slime: { name: 'Slime', icon: '🟩', desc: 'Lentos pero persistentes. Controlan espacio.' },
        archer: { name: 'Arquero', icon: '🏹', desc: 'Se mantiene lejos y te castiga si te quedás quieto.' },
        charger: { name: 'Cargador', icon: '🐗', desc: 'Embiste con fuerza. Castiga errores y mala posición.' },
        mage: { name: 'Mago', icon: '🧙', desc: 'Teleporta y dispara salvas. Prioridad alta.' },
        bomber: { name: 'Bombardero', icon: '💥', desc: 'Si lo dejás llegar, explota. No lo subestimes.' },
        summoner: { name: 'Invocador', icon: '🌀', desc: 'Crea aliados. Si lo ignorás, la sala se descontrola.' }
    };

    const BossLore = {
        guardian: { name: 'El Guardián', icon: '🗿', desc: 'Prueba de fuerza. Alterna presión melee y ranged.' },
        demon_lord: { name: 'Señor Demonio', icon: '😈', desc: 'Agresivo y caótico. Controla el combate.' },
        skeleton_king: { name: 'Rey Esqueleto', icon: '👑', desc: 'Convoca esbirros. Mantener el ritmo es clave.' },
        spider_queen: { name: 'Reina Araña', icon: '🕷️', desc: 'Velocidad y patrones. Castiga la falta de movilidad.' },
        golem: { name: 'Gólem Antiguo', icon: '🪨', desc: 'Tanque brutal. Leer telegraphs te salva.' },
        hydra: { name: 'Hidra', icon: '🐍', desc: 'Ataques en ráfaga. No te quedes encerrado.' },
        fire_lord: { name: 'Señor del Fuego', icon: '🔥', desc: 'Fuego por todos lados. Manejá el espacio.' },
        final_boss: { name: 'EL CATACLISMO', icon: '🌌', desc: 'El final… y el inicio del NG+. Fases y patrones letales.' }
    };

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
            this.save();
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
                    if (a) UI.toastAchievement(a);
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
