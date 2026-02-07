// ==========================================
// ARCANE DEPTHS - Rune Database (EXPANDED)
// ==========================================

const RuneDatabase = {
    common: [
        { id: 'spark', name: 'Chispa', icon: '⚡', desc: '+3 daño base a todos tus proyectiles', damageBonus: 3 },
        { id: 'velocity', name: 'Velocidad', icon: '💨', desc: '+20% velocidad de proyectil', speedBonus: 20 },
        { id: 'dual_cast', name: 'Doble Lanzamiento', icon: '✨', desc: 'Dispara 1 proyectil adicional', extraProjectiles: 1 },
        { id: 'ember', name: 'Ascua', icon: '🔥', desc: 'Proyectiles aplican Quemadura (5 daño/seg)', effect: 'burn' },
        { id: 'frost', name: 'Escarcha', icon: '❄️', desc: 'Proyectiles ralentizan enemigos', effect: 'slow' },
        { id: 'venom', name: 'Veneno', icon: '🧪', desc: 'Proyectiles aplican Veneno (4 daño/seg)', effect: 'poison' },
        { id: 'light', name: 'Luz', icon: '💡', desc: '+10% rango de proyectil', rangeBonus: 0.1 },
        { id: 'minor_arcana', name: 'Arcana Menor', icon: '🌀', desc: '+2 maná máximo', manaBonus: 2 },
        { id: 'quick_hands', name: 'Manos Rápidas', icon: '👐', desc: '+10% velocidad de disparo', fireRateBonus: 0.10 },

        { id: 'focus', name: 'Enfoque', icon: '🎯', desc: '+5% daño', damageMultiplier: 1.05 },
        { id: 'mana_sip', name: 'Sorbo de Maná', icon: '🥤', desc: '+15% regen de maná', manaRegen: 0.15 },
        { id: 'reach', name: 'Alcance', icon: '📏', desc: '+20% rango de proyectil', rangeBonus: 0.2 },
        { id: 'twin_spark', name: 'Chispas Gemelas', icon: '⚡', desc: '+1 daño y +10% velocidad proyectil', damageBonus: 1, speedBonus: 10 },
        { id: 'frugal', name: 'Frugal', icon: '💧', desc: '-1 costo de maná por disparo', manaCost: -1 },
        { id: 'arcane_edge', name: 'Filo Arcano', icon: '🗡️', desc: '+6 daño contra enemigos élite', damageBonus: 2 },
        { id: 'glimmer', name: 'Destello', icon: '✨', desc: '+1 maná máximo y +5% daño', manaBonus: 1, damageMultiplier: 1.05 }
    ],

    rare: [
        { id: 'power_surge', name: 'Descarga de Poder', icon: '💥', desc: '+8 daño base', damageBonus: 8 },
        { id: 'triple_cast', name: 'Triple Lanzamiento', icon: '🌟', desc: 'Dispara 2 proyectiles adicionales', extraProjectiles: 2 },
        { id: 'piercing', name: 'Perforación', icon: '🎯', desc: 'Proyectiles atraviesan 2 enemigos', effect: 'pierce', pierceCount: 2 },
        { id: 'vampiric', name: 'Vampírico', icon: '🩸', desc: 'Cura 5% de tu vida máxima al matar un enemigo', onKillHealPct: 0.05 },
        { id: 'chain', name: 'Cadena', icon: '⛓️', desc: 'Proyectiles saltan a 2 enemigos cercanos', effect: 'chain', chainCount: 2 },
        { id: 'explosion', name: 'Explosión', icon: '💣', desc: 'Proyectiles explotan al impactar', effect: 'explode', radius: 50 },
        { id: 'mana_flow', name: 'Flujo de Maná', icon: '🌊', desc: '+50% regeneración de maná', manaRegen: 0.5 },
        { id: 'amplify', name: 'Amplificar', icon: '📡', desc: '+15% a todo el daño', damageMultiplier: 1.15 },

        { id: 'sniper', name: 'Francotirador', icon: '🔭', desc: '+60% rango de proyectil', rangeBonus: 0.6 },
        { id: 'overpressure', name: 'Sobrepresión', icon: '🧯', desc: '+35% velocidad de proyectil', speedBonus: 35 },
        { id: 'cold_bite', name: 'Mordida Fría', icon: '🥶', desc: 'Slow más fuerte', effect: 'slow' },
        { id: 'toxic_bite', name: 'Mordida Tóxica', icon: '☠️', desc: 'Poison más consistente', effect: 'poison' },
        { id: 'efficient_cast', name: 'Lanzamiento Eficiente', icon: '🧠', desc: '-2 costo de maná por disparo', manaCost: -2 },
        { id: 'arcane_rhythm', name: 'Ritmo Arcano', icon: '🎵', desc: '+20% velocidad de disparo', fireRateBonus: 0.20 },
        { id: 'glass_cannon', name: 'Cañón de Vidrio', icon: '🪞', desc: '+35% daño', damageMultiplier: 1.35 }
    ],

    epic: [
        { id: 'arcane_fury', name: 'Furia Arcana', icon: '🔮', desc: '+15 daño y +1 proyectil extra', damageBonus: 15, extraProjectiles: 1 },
        { id: 'hyper_pierce', name: 'Hiper Perforación', icon: '🏹', desc: 'Proyectiles atraviesan infinitos enemigos', effect: 'pierce', pierceCount: 999 },
        { id: 'critical', name: 'Crítico', icon: '⚔️', desc: '25% chance de daño x3', effect: 'crit', critChance: 0.25, critDamage: 3 },
        { id: 'homing', name: 'Teledirigido', icon: '🧭', desc: 'Proyectiles persiguen enemigos', effect: 'homing' },
        { id: 'split', name: 'Dividir', icon: '🔱', desc: 'Proyectiles se dividen en 3 al impactar', effect: 'split', splitCount: 3 },
        { id: 'overload', name: 'Sobrecarga', icon: '⚡', desc: '+50% daño pero cuesta +10 maná', damageMultiplier: 1.5, manaCost: 10 },

        { id: 'stormcaster', name: 'Tormenta', icon: '🌩️', desc: '+2 proyectiles y +20% velocidad', extraProjectiles: 2, speedBonus: 20 },
        { id: 'volatile_core', name: 'Núcleo Volátil', icon: '🧨', desc: 'Explosión más grande', effect: 'explode', radius: 80 },
        { id: 'chain_master', name: 'Maestro de Cadena', icon: '🔗', desc: 'Cadena a 4 enemigos', effect: 'chain', chainCount: 4 },
        { id: 'blood_price', name: 'Precio de Sangre', icon: '🩸', desc: '+60% daño, pero +2 costo de maná', damageMultiplier: 1.6, manaCost: 2 },
        { id: 'deep_freeze', name: 'Congelación', icon: '🧊', desc: 'Slow + control', effect: 'slow', fireRateBonus: 0.08 },
        { id: 'poison_mist', name: 'Nube Tóxica', icon: '🌫️', desc: 'Poison + daño base', effect: 'poison', damageBonus: 6 }
    ],

    legendary: [
        { id: 'annihilation', name: 'Aniquilación', icon: '☄️', desc: '+15 daño, +1 proyectil, explosión', damageBonus: 15, extraProjectiles: 1, effect: 'explode', radius: 75 },
        { id: 'void_touch', name: 'Toque del Vacío', icon: '🌑', desc: 'Quita 2% de HP máxima del enemigo por hit (máx 2 stacks)', percentDamage: 0.02 },
        { id: 'infinity', name: 'Infinito', icon: '♾️', desc: 'Proyectiles sin límite de rango', rangeMultiplier: 999 },
        { id: 'godslayer', name: 'Matadios', icon: '👁️', desc: 'Daño x4 contra jefes', bossMultiplier: 4 },
        { id: 'time_warp', name: 'Distorsión Temporal', icon: '⏱️', desc: 'Al matar, disparás 3x más rápido por 5s', effect: 'frenzy' },

        { id: 'singularity', name: 'Singularidad', icon: '🕳️', desc: '+2 proyectiles, +15% daño', extraProjectiles: 2, damageMultiplier: 1.15 },
        { id: 'executioner', name: 'Verdugo', icon: '🪓', desc: '+15 daño y 35% crit x3', damageBonus: 15, effect: 'crit', critChance: 0.35, critDamage: 3 },
        { id: 'archmage', name: 'Archimago', icon: '🧙', desc: '+8 maná, +60% regen, +20% fire rate', manaBonus: 8, manaRegen: 0.6, fireRateBonus: 0.2 }
    ]
};



// Special runes (not part of normal rarity tables)
RuneDatabase.special = [
    {
        id: 'empty_rune',
        name: 'Runa Vacía',
        icon: '⬜',
        desc: 'No hace nada… hasta ser programada en una Forja-Terminal.',
        programmable: true
    }
];

function getEmptyRune() {
    const r = { ...RuneDatabase.special[0] };
    r.rarity = 'special';
    r.programmed = false;
    r.scriptText = '';
    r.script = null;
    return r;
}
function getRandomRune(rarity) {
    const runes = RuneDatabase[rarity];
    if (!runes || runes.length === 0) return null;
    const rune = { ...Utils.randomChoice(runes) };
    rune.rarity = rarity;
    rune.type = 'rune';
    return rune;
}

function getWeightedRandomRune(preferredRarity = null) {
    // Base rarity weights (v0.1.2): épicos/legendarios MUCHO más raros.
    const weights = { common: 70, rare: 26, epic: 3.5, legendary: 0.5 };

    // Luck (permanent): up to +20% effective boost towards high rarity.
    let luck = 0;
    if (window.Meta && typeof Meta.getLuckPct === 'function') {
        luck = Meta.getLuckPct(); // 0.05..0.20
    }
    // Convert luck into a smooth multiplier for epic/legendary odds.
    if (luck > 0) {
        const mult = 1 + luck * 2.5; // 1.125..1.5
        weights.epic *= mult;
        weights.legendary *= mult;
        // Keep total somewhat stable by shaving a bit off common
        weights.common = Math.max(10, weights.common - (luck * 30));
    }

    if (preferredRarity && weights[preferredRarity]) {
        weights[preferredRarity] *= 2;
    }

    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;

    for (const [rarity, weight] of Object.entries(weights)) {
        rand -= weight;
        if (rand <= 0) return getRandomRune(rarity);
    }
    return getRandomRune('common');
}

function getRunesByRarity(rarity) {
    return RuneDatabase[rarity] || [];
}

window.RuneDatabase = RuneDatabase;
window.getRandomRune = getRandomRune;
window.getWeightedRandomRune = getWeightedRandomRune;
window.getRunesByRarity = getRunesByRarity;
window.getEmptyRune = getEmptyRune;
