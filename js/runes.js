// ==========================================
// ARCANE DEPTHS - Rune Database (EXPANDED)
// ==========================================

const RuneDatabase = {
    common: [
        { id: 'spark', icon: '⚡', damageBonus: 3 },
        { id: 'velocity', icon: '💨', speedBonus: 20 },
        { id: 'dual_cast', icon: '✨', extraProjectiles: 1 },
        { id: 'ember', icon: '🔥', effect: 'burn' },
        { id: 'frost', icon: '❄️', effect: 'slow' },
        { id: 'venom', icon: '🧪', effect: 'poison' },
        { id: 'light', icon: '💡', rangeBonus: 0.05 },
        { id: 'minor_arcana', icon: '🌀', manaBonus: 2 },
        { id: 'quick_hands', icon: '👐', fireRateBonus: 0.10 },
        { id: 'focus', icon: '🎯', damageMultiplier: 1.05 },
        { id: 'mana_sip', icon: '🥤', manaRegen: 0.15 },
        { id: 'reach', icon: '📏', rangeBonus: 0.08 },
        { id: 'twin_spark', icon: '⚡', damageBonus: 1, speedBonus: 10 },
        { id: 'arcane_edge', icon: '🗡️', damageBonus: 2 },
        { id: 'glimmer', icon: '✨', manaBonus: 1, damageMultiplier: 1.05 }
    ],

    rare: [
        { id: 'power_surge', icon: '💥', damageBonus: 8 },
        { id: 'triple_cast', icon: '🌟', extraProjectiles: 2 },
        { id: 'piercing', icon: '🎯', effect: 'pierce', pierceCount: 2 },
        { id: 'vampiric', icon: '🩸', onKillHealPct: 0.05 },
        { id: 'chain', icon: '⛓️', effect: 'chain', chainCount: 2 },
        { id: 'explosion', icon: '💣', effect: 'explode', radius: 50 },
        { id: 'mana_flow', icon: '🌊', manaRegen: 0.5 },
        { id: 'amplify', icon: '📡', damageMultiplier: 1.15 },
        { id: 'sniper', icon: '🔭', rangeBonus: 0.12 },
        { id: 'overpressure', icon: '🧯', speedBonus: 35 },
        { id: 'cold_bite', icon: '🥶', effect: 'slow' },
        { id: 'toxic_bite', icon: '☠️', effect: 'poison' },
        { id: 'arcane_rhythm', icon: '🎵', fireRateBonus: 0.20 },
        { id: 'glass_cannon', icon: '🪞', damageMultiplier: 1.35, damageTakenMultiplier: 1.10 }
    ],

    epic: [
        { id: 'arcane_fury', icon: '🔮', damageBonus: 15, extraProjectiles: 1 },
        { id: 'hyper_pierce', icon: '🏹', effect: 'pierce', pierceCount: 999 },
        { id: 'critical', icon: '⚔️', effect: 'crit', critChance: 0.25, critDamage: 3 },
        { id: 'homing', icon: '🧭', effect: 'homing' },
        { id: 'split', icon: '🔱', effect: 'split', splitCount: 3 },
        { id: 'overload', icon: '⚡', damageMultiplier: 1.5, manaCost: 10 },
        { id: 'stormcaster', icon: '🌩️', extraProjectiles: 2, speedBonus: 20 },
        { id: 'volatile_core', icon: '🧨', effect: 'explode', radius: 80 },
        { id: 'chain_master', icon: '🔗', effect: 'chain', chainCount: 4 },
        { id: 'blood_price', icon: '🩸', damageMultiplier: 1.6, manaCost: 2 },
        { id: 'deep_freeze', icon: '🧊', effect: 'slow', fireRateBonus: 0.08 },
        { id: 'poison_mist', icon: '🌫️', effect: 'poison', damageBonus: 6 }
    ],

    legendary: [
        { id: 'annihilation', icon: '☄️', damageBonus: 15, extraProjectiles: 1, effect: 'explode', radius: 75 },
        { id: 'void_touch', icon: '🌑', percentDamage: 0.02, maxStacks: 2 },
        { id: 'infinity', icon: '♾️', rangeBonus: 0.2 },
        { id: 'godslayer', icon: '👁️', bossMultiplier: 2, maxStacks: 1 },
        { id: 'time_warp', icon: '⏱️', effect: 'frenzy' },
        { id: 'singularity', icon: '🕳️', extraProjectiles: 2, damageMultiplier: 1.15 },
        { id: 'executioner', icon: '🪓', damageBonus: 15, effect: 'crit', critChance: 0.35, critDamage: 3 },
        { id: 'archmage', icon: '🧙', manaBonus: 8, manaRegen: 0.6, fireRateBonus: 0.2 }
    ]
};

// Special runes (not part of normal rarity tables)
RuneDatabase.special = [
    {
        id: 'empty_rune',
        icon: '⬜',
        programmable: true
    }
];

function getEmptyRune() {
    const r = { ...RuneDatabase.special[0] };
    r.rarity = 'special';
    r.programmed = false;
    r.scriptText = '';
    r.script = null;
    // Add translations
    if (window.i18n) {
        const trans = window.i18n.rune(r.id);
        r.name = trans.name;
        r.desc = trans.desc;
    }
    return r;
}

// IDs of PURE fire-rate runes (only give fireRateBonus, nothing else)
const PURE_FIRE_RATE_RUNES = new Set(['quick_hands', 'arcane_rhythm']);
// IDs of PURE projectile-speed runes (only give speedBonus, nothing else)
const PURE_PROJ_SPEED_RUNES = new Set(['velocity', 'overpressure']);

// Check if player has hit a cap — reads from window.Game.player
function isFireRateCapped() {
    const p = window.Game && window.Game.player;
    if (!p) return false;
    let bonus = 0;
    for (const r of (p.runes || [])) { if (r && typeof r.fireRateBonus === 'number') bonus += r.fireRateBonus; }
    if (p.synergyBonuses && p.synergyBonuses.fireRateBonus) bonus += p.synergyBonuses.fireRateBonus;
    return bonus >= 0.60; // >= 150% fire rate
}
function isProjSpeedCapped() {
    const p = window.Game && window.Game.player;
    if (!p) return false;
    let spd = p.projectileSpeed || 500;
    for (const r of (p.runes || [])) { if (r && typeof r.speedBonus === 'number') spd *= (1 + r.speedBonus / 100); }
    if (p.synergyBonuses && p.synergyBonuses.speedBonus) spd *= (1 + p.synergyBonuses.speedBonus / 100);
    return spd >= (p.projectileSpeed || 500) * 2.30; // >= 130% over base
}

function getRandomRune(rarity) {
    const allRunes = RuneDatabase[rarity];
    if (!allRunes || allRunes.length === 0) return null;

    // Filter out pure capped runes and maxed-stack runes
    const fireCapped = isFireRateCapped();
    const speedCapped = isProjSpeedCapped();
    const player = window.Game && window.Game.player;
    let pool = allRunes;
    {
        const filtered = allRunes.filter(r => {
            if (fireCapped && PURE_FIRE_RATE_RUNES.has(r.id)) return false;
            if (speedCapped && PURE_PROJ_SPEED_RUNES.has(r.id)) return false;
            // Respect maxStacks: filter out runes player already has max of
            if (typeof r.maxStacks === 'number' && r.maxStacks > 0 && player) {
                const count = (player.runes || []).filter(eq => eq && eq.id === r.id).length;
                if (count >= r.maxStacks) return false;
            }
            return true;
        });
        if (filtered.length > 0) pool = filtered;
    }

    const rune = { ...Utils.randomChoice(pool) };
    rune.rarity = rarity;
    rune.type = 'rune';
    // If capped stat, zero it out on mixed runes
    if (fireCapped && typeof rune.fireRateBonus === 'number') rune.fireRateBonus = 0;
    if (speedCapped && typeof rune.speedBonus === 'number') rune.speedBonus = 0;

    // Add translations
    if (window.i18n) {
        const trans = window.i18n.rune(rune.id);
        rune.name = trans.name;
        rune.desc = trans.desc;
    }
        // Ensure UI-friendly fields exist even if we rely on i18n tables
    try {
        const t = (typeof getRuneText === 'function') ? getRuneText(rune) : null;
        if (!rune.name) rune.name = (t && t.name) ? t.name : (rune.id || 'Rune');
        if (rune.desc == null) rune.desc = (t && t.desc) ? t.desc : '';
    } catch (e) {
        if (!rune.name) rune.name = rune.id || 'Rune';
        if (rune.desc == null) rune.desc = '';
    }
    return rune;
}

function getWeightedRandomRune(preferredRarity = null) {
    // Base rarity weights (v0.1.2): épicos/legendarios mucho más raros.
    const weights = { common: 70, rare: 26, epic: 3.5, legendary: 0.5 };

    // Luck (permanent): up to +20% effective boost towards high rarity.
    let luck = 0;
    if (window.Meta && typeof Meta.getLuckPct === 'function') {
        luck = Meta.getLuckPct(); // 0.05..0.20
    }

    if (luck > 0) {
        const mult = 1 + luck * 2.5; // 1.125..1.5
        weights.epic *= mult;
        weights.legendary *= mult;
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

// ==========================================
// SEEDED VERSIONS (for deterministic loot)
// ==========================================

function getRandomRuneSeeded(rarity, rng) {
    const runes = RuneDatabase[rarity];
    if (!runes || runes.length === 0) return null;
    const rune = { ...Utils.seededChoice(rng, runes) };
    rune.rarity = rarity;
    rune.type = 'rune';
    // Add translations
    if (window.i18n) {
        const trans = window.i18n.rune(rune.id);
        rune.name = trans.name;
        rune.desc = trans.desc;
    }
        // Ensure UI-friendly fields exist even if we rely on i18n tables
    try {
        const t = (typeof getRuneText === 'function') ? getRuneText(rune) : null;
        if (!rune.name) rune.name = (t && t.name) ? t.name : (rune.id || 'Rune');
        if (rune.desc == null) rune.desc = (t && t.desc) ? t.desc : '';
    } catch (e) {
        if (!rune.name) rune.name = rune.id || 'Rune';
        if (rune.desc == null) rune.desc = '';
    }
    return rune;
}

function getWeightedRandomRuneSeeded(preferredRarity, rng) {
    const weights = { common: 70, rare: 26, epic: 3.5, legendary: 0.5 };
    
    // Luck (permanent): up to +20% effective boost towards high rarity.
    let luck = 0;
    if (window.Meta && typeof Meta.getLuckPct === 'function') {
        luck = Meta.getLuckPct();
    }

    if (luck > 0) {
        const mult = 1 + luck * 2.5;
        weights.epic *= mult;
        weights.legendary *= mult;
        weights.common = Math.max(10, weights.common - (luck * 30));
    }

    if (preferredRarity && weights[preferredRarity]) {
        weights[preferredRarity] *= 2;
    }

    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = rng() * total;

    for (const [rarity, weight] of Object.entries(weights)) {
        rand -= weight;
        if (rand <= 0) return getRandomRuneSeeded(rarity, rng);
    }
    return getRandomRuneSeeded('common', rng);
}

window.RuneDatabase = RuneDatabase;
window.getRandomRune = getRandomRune;
window.getWeightedRandomRune = getWeightedRandomRune;
window.getRandomRuneSeeded = getRandomRuneSeeded;
window.getWeightedRandomRuneSeeded = getWeightedRandomRuneSeeded;
window.getRunesByRarity = getRunesByRarity;
window.getEmptyRune = getEmptyRune;
