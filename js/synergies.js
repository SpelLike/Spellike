// ==========================================
// ARCANE DEPTHS - Synergy System
// ==========================================

const SynergyDatabase = {
    // Format: { id, requires: [rune/item ids], bonus: {stat: value} }
    // name and desc are obtained via getName() and getDesc() methods from translations
    
    // ELEMENTAL COMBOS
    flame_burst: {
        id: 'flame_burst',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Estallido de Llamas';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+8% daño con efectos de fuego';
        },
        requires: ['ember', 'explosion'],
        bonus: { damageMultiplier: 1.08 },
        tags: ['fire', 'explosion']
    },
    
    frozen_shatter: {
        id: 'frozen_shatter',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Congelación Explosiva';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+10% daño y +15 radio de explosión';
        },
        requires: ['frost', 'explosion'],
        bonus: { damageMultiplier: 1.10, explosionRadius: 15 },
        tags: ['ice', 'explosion']
    },
    
    toxic_burst: {
        id: 'toxic_burst',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Nube Tóxica';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+6% daño de veneno';
        },
        requires: ['venom', 'poison_mist'],
        bonus: { damageMultiplier: 1.06 },
        tags: ['poison']
    },
    
    elemental_master: {
        id: 'elemental_master',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Maestro Elemental';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+12% daño con 3+ elementos';
        },
        requiresAny: [
            ['ember', 'frost', 'venom'],
            ['ember', 'frost', 'poison_mist'],
            ['cold_bite', 'toxic_bite', 'ember']
        ],
        bonus: { damageMultiplier: 1.12 },
        tags: ['elemental']
    },
    
    // MULTISHOT COMBOS
    barrage: {
        id: 'barrage',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Andanada';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+5% daño por proyectil extra';
        },
        requiresCheck: (player) => {
            const extraProj = player.runes.filter(r => r && (r.extraProjectiles || 0) > 0).length;
            return extraProj >= 2;
        },
        bonus: { damageMultiplier: 1.05 },
        tags: ['multishot']
    },
    
    // PIERCING/CHAIN COMBOS
    chain_reaction: {
        id: 'chain_reaction',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Reacción en Cadena';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+1 chain adicional';
        },
        requires: ['chain', 'chain_master'],
        bonus: { chainCount: 1 },
        tags: ['chain']
    },
    
    piercing_volley: {
        id: 'piercing_volley',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Salva Perforante';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+2 piercing';
        },
        requires: ['piercing', 'hyper_pierce'],
        bonus: { pierceCount: 2 },
        tags: ['pierce']
    },
    
    // CRITICAL COMBOS
    assassin: {
        id: 'assassin',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Asesino';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+4% crit chance';
        },
        requires: ['critical', 'executioner'],
        bonus: { critChance: 0.04 },
        tags: ['crit']
    },
    
    glass_cannon_synergy: {
        id: 'glass_cannon_synergy',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Cañón de Cristal';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+6% daño crítico';
        },
        requires: ['glass_cannon', 'critical'],
        bonus: { critDamage: 0.3 },
        tags: ['crit', 'damage']
    },
    
    // MANA COMBOS
    mana_battery: {
        id: 'mana_battery',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Batería Arcana';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+25% regen de maná';
        },
        requiresAny: [
            ['mana_flow', 'archmage'],
            ['mana_sip', 'minor_arcana', 'mana_flow']
        ],
        bonus: { manaRegen: 0.25 },
        tags: ['mana']
    },
    
    efficient_caster: {
        id: 'efficient_caster',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Lanzador Eficiente';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '-0.5 costo de maná';
        },
        requiresCheck: (player) => {
            const manaCostReducers = player.runes.filter(r => 
                r && (r.manaCost || 0) < 0
            ).length;
            return manaCostReducers >= 2;
        },
        bonus: { manaCost: -0.5 },
        tags: ['mana']
    },
    
    // SPEED COMBOS
    rapid_fire: {
        id: 'rapid_fire',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Fuego Rápido';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+15% velocidad de disparo';
        },
        requiresCheck: (player) => {
            const fireRateBonus = player.runes.filter(r => 
                r && (r.fireRateBonus || 0) > 0
            ).length;
            return fireRateBonus >= 2;
        },
        bonus: { fireRateBonus: 0.15 },
        tags: ['firerate']
    },
    
    // VAMPIRE COMBOS
    blood_mage: {
        id: 'blood_mage',
        getName() {
            return window.i18n ? window.i18n.synergy(this.id).name : 'Mago de Sangre';
        },
        getDesc() {
            return window.i18n ? window.i18n.synergy(this.id).desc : '+3% vida por kill';
        },
        requires: ['vampiric', 'blood_price'],
        bonus: { onKillHealPct: 0.03 },
        tags: ['lifesteal']
    },
    
    // PROJECTILE RANGE/SPEED
    sniper_elite: {
        id: 'sniper_elite',
        name: 'Francotirador Elite',
        desc: '+10% rango',
        requiresCheck: (player) => {
            const rangeBonus = player.runes.filter(r => 
                r && (r.rangeBonus || 0) > 0
            ).length;
            return rangeBonus >= 2;
        },
        bonus: { rangeBonus: 0.10 },
        tags: ['range']
    },
    
    hypersonic: {
        id: 'hypersonic',
        name: 'Hipersónico',
        desc: '+20% velocidad de proyectil',
        requiresCheck: (player) => {
            const speedBonus = player.runes.filter(r => 
                r && (r.speedBonus || 0) > 0
            ).length;
            return speedBonus >= 2;
        },
        bonus: { speedBonus: 20 },
        tags: ['projectile_speed']
    }
};

const SynergySystem = {
    activeSynergies: [],
    newSynergiesThisFrame: [],

    detectSynergies(player) {
        const previousActive = [...this.activeSynergies];
        this.activeSynergies = [];
        this.newSynergiesThisFrame = [];
        
        // Get all rune IDs
        const runeIds = player.runes.filter(r => r).map(r => r.id);
        
        // Check each synergy
        for (const synergy of Object.values(SynergyDatabase)) {
            let active = false;
            
            // Check requires (all must be present)
            if (synergy.requires) {
                active = synergy.requires.every(id => runeIds.includes(id));
            }
            
            // Check requiresAny (at least one combo must be complete)
            if (synergy.requiresAny) {
                active = synergy.requiresAny.some(combo => 
                    combo.every(id => runeIds.includes(id))
                );
            }
            
            // Check requiresCheck (custom function)
            if (synergy.requiresCheck) {
                active = synergy.requiresCheck(player);
            }
            
            if (active) {
                this.activeSynergies.push(synergy);
                
                // Check if this is newly activated
                if (!previousActive.some(s => s.id === synergy.id)) {
                    this.newSynergiesThisFrame.push(synergy);
                }
            }
        }
        
        return this.newSynergiesThisFrame;
    },

    applyBonuses(player) {
        // Reset synergy bonuses
        player.synergyBonuses = {
            damageMultiplier: 1,
            critChance: 0,
            critDamage: 0,
            manaRegen: 0,
            manaCost: 0,
            fireRateBonus: 0,
            rangeBonus: 0,
            speedBonus: 0,
            pierceCount: 0,
            chainCount: 0,
            explosionRadius: 0,
            onKillHealPct: 0
        };
        
        // Apply all active synergy bonuses
        for (const synergy of this.activeSynergies) {
            for (const [stat, value] of Object.entries(synergy.bonus)) {
                if (stat === 'damageMultiplier') {
                    player.synergyBonuses.damageMultiplier *= value;
                } else {
                    player.synergyBonuses[stat] += value;
                }
            }
        }
    },

    showNewSynergies(player) {
        for (const synergy of this.newSynergiesThisFrame) {
            // Show floating text
            if (window.FloatingTextSystem) {
                FloatingTextSystem.synergy(
                    player.centerX,
                    player.centerY - 30,
                    synergy.name
                );
            }
            
            // Show toast
            if (window.UI && typeof UI.showToast === 'function') {
                UI.showToast(`${i18n.t('toastSynergy')} ${synergy.name}`);
            }
            
            // Particles
            if (window.ParticleSystem) {
                ParticleSystem.burst(player.centerX, player.centerY, 20, {
                    color: '#ff00ff',
                    life: 0.8,
                    size: 5,
                    speed: 3,
                    friction: 0.92
                });
            }
        }
    },

    getActiveSynergies() {
        return this.activeSynergies;
    },

    clear() {
        this.activeSynergies = [];
        this.newSynergiesThisFrame = [];
    }
};

window.SynergyDatabase = SynergyDatabase;
window.SynergySystem = SynergySystem;