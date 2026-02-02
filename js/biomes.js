// ==========================================
// ARCANE DEPTHS - Biome Database (EXPANDED TO 12)
// ==========================================

const BiomeDatabase = {
    forest: {
        id: 'forest',
        name: 'Bosque Antiguo',
        order: 1,
        enemies: ['goblin', 'slime', 'stalker'],
        boss: 'guardian',
        colors: { floor: '#2d4a2d', wall: '#5c4033', accent: '#7cb342' },
        music: 'forest_theme'
    },
    crypt: {
        id: 'crypt',
        name: 'Cripta Olvidada',
        order: 2,
        enemies: ['skeleton', 'archer', 'wisp'],
        boss: 'skeleton_king',
        colors: { floor: '#3d3d4a', wall: '#4a4a5a', accent: '#4fc3f7' },
        music: 'crypt_theme'
    },
    crystal: {
        id: 'crystal',
        name: 'Cavernas de Cristal',
        order: 3,
        enemies: ['slime', 'charger', 'wisp'],
        boss: 'spider_queen',
        colors: { floor: '#2c2c3a', wall: '#4a3d6e', accent: '#00bcd4' },
        music: 'crystal_theme'
    },
    ruins: {
        id: 'ruins',
        name: 'Ruinas Antiguas',
        order: 4,
        enemies: ['skeleton', 'charger', 'turret'],
        boss: 'golem',
        colors: { floor: '#d4b896', wall: '#8e8e93', accent: '#26c6da' },
        music: 'ruins_theme'
    },
    swamp: {
        id: 'swamp',
        name: 'Pantano Venenoso',
        order: 5,
        enemies: ['slime', 'archer', 'bomber', 'stalker'],
        boss: 'hydra',
        colors: { floor: '#4a5d23', wall: '#5d4037', accent: '#7cb342' },
        music: 'swamp_theme'
    },
    volcano: {
        id: 'volcano',
        name: 'Volcán Ardiente',
        order: 6,
        enemies: ['charger', 'goblin', 'bomber', 'brute'],
        boss: 'fire_lord',
        colors: { floor: '#37474f', wall: '#5d4037', accent: '#ff5722' },
        music: 'volcano_theme'
    },

    // New biomes
    tundra: {
        id: 'tundra',
        name: 'Tundra Helada',
        order: 7,
        enemies: ['skeleton', 'wisp', 'stalker'],
        boss: 'skeleton_king',
        colors: { floor: '#263238', wall: '#546e7a', accent: '#b3e5fc' },
        music: 'crypt_theme'
    },
    library: {
        id: 'library',
        name: 'Biblioteca Arcana',
        order: 8,
        enemies: ['mage', 'archer', 'wisp', 'turret'],
        boss: 'demon_lord',
        colors: { floor: '#2b2a3a', wall: '#3a2f4a', accent: '#ce93d8' },
        music: 'crystal_theme'
    },
    clockwork: {
        id: 'clockwork',
        name: 'Forja Mecánica',
        order: 9,
        enemies: ['turret', 'charger', 'brute', 'summoner'],
        boss: 'golem',
        colors: { floor: '#2e2e2e', wall: '#5d4037', accent: '#ffcc80' },
        music: 'ruins_theme'
    },
    abyss: {
        id: 'abyss',
        name: 'Abismo',
        order: 10,
        enemies: ['stalker', 'mage', 'summoner', 'bomber'],
        boss: 'demon_lord',
        colors: { floor: '#121212', wall: '#2b2b2b', accent: '#00e5ff' },
        music: 'crypt_theme'
    },
    skytemple: {
        id: 'skytemple',
        name: 'Templo Celeste',
        order: 11,
        enemies: ['archer', 'wisp', 'charger', 'mage'],
        boss: 'guardian',
        colors: { floor: '#263238', wall: '#37474f', accent: '#ffd54f' },
        music: 'forest_theme'
    },
    voidlands: {
        id: 'voidlands',
        name: 'Tierras del Vacío',
        order: 12,
        enemies: ['stalker', 'brute', 'summoner', 'mage', 'turret'],
        boss: 'demon_lord',
        colors: { floor: '#0b0b14', wall: '#1c1c2a', accent: '#ff00ff' },
        music: 'crystal_theme'
    }
};

const BiomeOrder = ['forest', 'crypt', 'crystal', 'ruins', 'swamp', 'volcano', 'tundra', 'library', 'clockwork', 'abyss', 'skytemple', 'voidlands'];

function getBiome(id) {
    return BiomeDatabase[id] || BiomeDatabase.forest;
}

function getNextBiome(currentId) {
    const index = BiomeOrder.indexOf(currentId);
    if (index >= 0 && index < BiomeOrder.length - 1) return BiomeOrder[index + 1];
    return BiomeOrder[0];
}

window.BiomeDatabase = BiomeDatabase;
window.BiomeOrder = BiomeOrder;
window.getBiome = getBiome;
window.getNextBiome = getNextBiome;
