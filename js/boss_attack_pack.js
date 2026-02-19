// ==========================================
// ARCANE DEPTHS - Massive Boss Attack Pack
// ==========================================

(function () {
    const K = {
        arc_burst: {
            role: 'burst frontal',
            cooldown: 6.4,
            telegraph: 0.72,
            recovery: 0.45,
            weight: 2,
            minDist: 90,
            maxDist: 9999,
            count: 7,
            spreadDeg: 92,
            speed: 310,
            damageMul: 0.7,
            range: 640,
            waves: 1,
            waveInterval: 0.28
        },
        ring_burst: {
            role: 'control radial',
            cooldown: 7.4,
            telegraph: 0.76,
            recovery: 0.48,
            weight: 1,
            minDist: 0,
            maxDist: 9999,
            count: 16,
            speed: 245,
            damageMul: 0.68,
            range: 620,
            waves: 1,
            waveInterval: 0.35,
            gapSize: 2
        },
        wall_volley: {
            role: 'castigo de walls',
            cooldown: 8.2,
            telegraph: 0.94,
            recovery: 0.5,
            weight: 1,
            walls: ['left', 'right'],
            countPerWall: 5,
            speed: 245,
            damageMul: 0.68,
            targeted: true
        },
        strike_pattern: {
            role: 'control de espacio',
            cooldown: 8.5,
            telegraph: 0.9,
            recovery: 0.48,
            weight: 1,
            pattern: 'cross_player',
            strikeCount: 8,
            warn: 0.82,
            radius: 26,
            damageMul: 0.78,
            minSpacing: 90,
            gapSize: 2
        },
        dash_trail: {
            role: 'burst de movilidad',
            cooldown: 8.6,
            telegraph: 0.88,
            recovery: 0.4,
            weight: 1,
            minDist: 105,
            maxDist: 9999,
            dashSpeed: 540,
            dashDuration: 0.62,
            trailEvery: 0.13,
            trailRadius: 24,
            trailDamageMul: 0.58
        },
        orbit_release: {
            role: 'presion circular',
            cooldown: 8.9,
            telegraph: 0.86,
            recovery: 0.5,
            weight: 1,
            orbitCount: 6,
            orbitRadius: 62,
            orbitDuration: 2.0,
            speed: 285,
            damageMul: 0.72,
            releaseMode: 'radial'
        },
        summon_wave: {
            role: 'presion de adds',
            cooldown: 10.2,
            telegraph: 1.02,
            recovery: 0.55,
            weight: 1,
            summonTypes: ['skeleton', 'charger', 'mage'],
            count: 3,
            summonRadius: 110
        },
        ricochet_orb: {
            role: 'control de trayectorias',
            cooldown: 9.3,
            telegraph: 0.92,
            recovery: 0.5,
            weight: 1,
            minDist: 110,
            maxDist: 9999,
            bounces: 5,
            speed: 235,
            damageMul: 0.84,
            range: 1700,
            radius: 9
        },
        rotating_beams: {
            role: 'control angular',
            cooldown: 12.8,
            telegraph: 1.1,
            recovery: 0.55,
            weight: 1,
            duration: 8.5,
            beamCount: 5,
            beamLength: 460,
            beamWidth: 12,
            rotSpeed: 0.45,
            invertCheckEvery: 1.7,
            invertChance: 0.24,
            invertTelegraph: 0.4,
            damageMul: 0.68
        },
        meteor_spawner: {
            role: 'objetivo secundario persistente',
            cooldown: 12.0,
            telegraph: 1.04,
            recovery: 0.6,
            weight: 1,
            meteorCount: 2,
            meteorInterval: 0.95,
            warn: 1.0,
            impactRadius: 52,
            impactDamageMul: 0.82,
            nestHp: 220,
            nestSpawnEvery: 3.0,
            nestRange: 115,
            nestMaxMobs: 6,
            nestGlobalCap: 12,
            nestPool: ['brute', 'mage', 'charger', 'summoner'],
            nestLabel: 'Nido'
        },
        bite_rush: {
            role: 'castigo de melee',
            cooldown: 7.8,
            telegraph: 0.8,
            recovery: 0.42,
            weight: 1,
            minDist: 0,
            maxDist: 220,
            bites: 3,
            biteInterval: 0.3,
            biteRange: 105,
            coneDeg: 44,
            damageMul: 0.8
        }
    };

    function m(id, name, kind, opts) {
        return Object.assign({
            id,
            name,
            kind,
            phaseMin: 1,
            phaseMax: 4
        }, K[kind] || {}, opts || {});
    }

    const byBoss = {
        guardian: [
            m('guardian_ricochet_orb', 'Orbe de Bastion Rebotante', 'ricochet_orb', { role: 'control de espacio y castigo de walls', damageMul: 0.8 }),
            m('guardian_bastion_fan', 'Abanico del Centinela', 'arc_burst', { count: 7, spreadDeg: 85 }),
            m('guardian_wall_lances', 'Lanzas de Muralla', 'wall_volley', { phaseMin: 2, walls: ['left', 'right'], countPerWall: 5 }),
            m('guardian_quake_cross', 'Quebranto en Cruz', 'strike_pattern', { pattern: 'cross_player', strikeCount: 6 }),
            m('guardian_shield_ring', 'Anillo de Escudos', 'ring_burst', { phaseMin: 2, waves: 2, gapSize: 2 }),
            m('guardian_anchor_dash', 'Embestida Ancla', 'dash_trail', { phaseMin: 2, dashSpeed: 520 }),
            m('guardian_pincer_strike', 'Pinza de Acero', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 8 }),
            m('guardian_hammer_rain', 'Lluvia de Martillos', 'strike_pattern', { phaseMin: 3, pattern: 'random_room', strikeCount: 9, telegraph: 1.05 }),
            m('guardian_zone_push', 'Pulso de Empuje', 'ring_burst', { phaseMin: 2, maxDist: 240, count: 12 }),
            m('guardian_warded_orbit', 'Orbitas del Juramento', 'orbit_release', { phaseMin: 3, orbitCount: 6 }),
            m('guardian_safe_gap', 'Aplastamiento con Brecha', 'strike_pattern', { phaseMin: 3, pattern: 'ring_gap_player', strikeCount: 14, gapSize: 3 }),
            m('guardian_judgement_grid', 'Cuadricula de Juicio', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 12 })
        ],

        demon_lord: [
            m('demon_meteor_spawner', 'Meteoros del Abismo', 'meteor_spawner', { phaseMin: 2, meteorCount: 3, nestLabel: 'Nido Infernal' }),
            m('demon_abyss_fan', 'Abanico Abisal', 'arc_burst', { count: 9, spreadDeg: 105, waves: 2 }),
            m('demon_hell_ring', 'Corona de Cenizas', 'ring_burst', { phaseMin: 2, count: 20, waves: 2, gapSize: 3 }),
            m('demon_shadow_walls', 'Muro Sombrio', 'wall_volley', { phaseMin: 2, walls: ['top', 'bottom'], countPerWall: 6 }),
            m('demon_blood_dash', 'Carga de Sangre', 'dash_trail', { phaseMin: 2, dashSpeed: 560 }),
            m('demon_hex_prison', 'Prision Hexagonal', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 10 }),
            m('demon_inferno_grid', 'Reja Infernal', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 14 }),
            m('demon_dread_orbit', 'Orbitas del Pavor', 'orbit_release', { phaseMin: 2, orbitCount: 7, releaseMode: 'aimed' }),
            m('demon_summon_wave', 'Invocacion Profana', 'summon_wave', { phaseMin: 2, summonTypes: ['summoner', 'mage', 'charger'] }),
            m('demon_chaos_ricochet', 'Caos Refractado', 'ricochet_orb', { phaseMin: 3, damageMul: 0.9 }),
            m('demon_collapse_gap', 'Colapso con Brecha', 'strike_pattern', { phaseMin: 3, pattern: 'ring_gap_player', strikeCount: 16, gapSize: 3 }),
            m('demon_laser_pincer', 'Pinza de Rayos', 'rotating_beams', { phaseMin: 3, duration: 6.5, beamCount: 3, rotSpeed: 0.55 })
        ],

        skeleton_king: [
            m('skel_bone_ricochet', 'Calavera Ricoshock', 'ricochet_orb', { damageMul: 0.8 }),
            m('skel_coffin_wall', 'Ataud Mural', 'wall_volley', { walls: ['left', 'right'], countPerWall: 5 }),
            m('skel_rib_fan', 'Abanico Costillar', 'arc_burst', { count: 8, spreadDeg: 90 }),
            m('skel_grave_ring', 'Ronda de Tumbas', 'ring_burst', { phaseMin: 2, waves: 2 }),
            m('skel_lance_dash', 'Lanza Osaria', 'dash_trail', { phaseMin: 2 }),
            m('skel_bone_prison', 'Jaula de Femor', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 9 }),
            m('skel_marrow_grid', 'Malla de Medula', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 11 }),
            m('skel_banner_summon', 'Estandarte Necro', 'summon_wave', { phaseMin: 2, summonTypes: ['skeleton', 'archer', 'wisp'] }),
            m('skel_orbit_skulls', 'Orbitas Calavericas', 'orbit_release', { phaseMin: 2, releaseMode: 'aimed' }),
            m('skel_corner_cross', 'Cruce de Criptas', 'strike_pattern', { phaseMin: 2, pattern: 'corners_center', strikeCount: 8 }),
            m('skel_safe_lane', 'Pasillo Mortuorio', 'strike_pattern', { phaseMin: 3, pattern: 'ring_gap_player', strikeCount: 14, gapSize: 2 }),
            m('skel_skull_hail', 'Granizo de Craneos', 'wall_volley', { phaseMin: 3, walls: ['top'], countPerWall: 8, targeted: false })
        ],

        spider_queen: [
            m('spider_web_fan', 'Abanico de Seda', 'arc_burst', { role: 'castigo de melee', speed: 255, damageMul: 0.58, waves: 2, effects: ['web'], effectData: { webSlow: 0.45, webDuration: 1.8 } }),
            m('spider_venom_ring', 'Anillo Venenoso', 'ring_burst', { phaseMin: 2, count: 15 }),
            m('spider_web_walls', 'Telar Mural', 'wall_volley', { phaseMin: 2, walls: ['left', 'right', 'top'], countPerWall: 4, effects: ['web'], effectData: { webSlow: 0.5, webDuration: 2.0 } }),
            m('spider_trap_dash', 'Emboscada de Seda', 'dash_trail', { phaseMin: 2, dashSpeed: 560 }),
            m('spider_egg_mortar', 'Mortero de Huevos', 'strike_pattern', { phaseMin: 2, pattern: 'random_player_bias', strikeCount: 7, telegraph: 1.0 }),
            m('spider_brood_nest', 'Nido de Camada', 'meteor_spawner', { phaseMin: 2, nestHp: 180, nestPool: ['wisp', 'goblin', 'slime', 'charger'], nestLabel: 'Nido Aracnido' }),
            m('spider_silk_prison', 'Prision de Hilos', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 8 }),
            m('spider_ambush_cross', 'Cruz de Emboscada', 'strike_pattern', { pattern: 'cross_player', strikeCount: 6 }),
            m('spider_orbit_spiders', 'Orbitas de Cria', 'orbit_release', { phaseMin: 3, orbitCount: 8, speed: 260 }),
            m('spider_gap_bite', 'Mordida con Brecha', 'bite_rush', { phaseMin: 3, maxDist: 210 }),
            m('spider_summon_wave', 'Oleada de Cria', 'summon_wave', { phaseMin: 2, count: 4, summonTypes: ['slime', 'wisp', 'charger'] }),
            m('spider_corner_spray', 'Rocio de Esquinas', 'wall_volley', { phaseMin: 3, walls: ['corners'], countPerWall: 2 })
        ],

        golem: [
            m('golem_quarry_fan', 'Abanico de Cantera', 'arc_burst', { damageMul: 0.85, count: 6, spreadDeg: 78 }),
            m('golem_boulder_ring', 'Anillo de Rocas', 'ring_burst', { phaseMin: 2, maxDist: 230, damageMul: 0.82, count: 14 }),
            m('golem_wall_slam', 'Embate de Muralla', 'wall_volley', { phaseMin: 2, walls: ['left', 'right', 'top', 'bottom'], countPerWall: 3 }),
            m('golem_fault_dash', 'Falla Tectonica', 'dash_trail', { phaseMin: 2, dashSpeed: 500, dashDuration: 0.7, trailRadius: 30 }),
            m('golem_seismic_grid', 'Malla Sismica', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 14, damageMul: 0.88 }),
            m('golem_pillar_cross', 'Pilares Cruzados', 'strike_pattern', { phaseMin: 2, pattern: 'cross_player', strikeCount: 6, radius: 32 }),
            m('golem_rock_ricochet', 'Peñasco Rebotante', 'ricochet_orb', { phaseMin: 3, speed: 215, damageMul: 0.95, radius: 10 }),
            m('golem_orbit_shards', 'Orbitas Liticas', 'orbit_release', { phaseMin: 2, orbitCount: 5, orbitRadius: 70, damageMul: 0.8 }),
            m('golem_crush_gap', 'Aplastamiento con Hueco', 'strike_pattern', { phaseMin: 3, pattern: 'ring_gap_player', strikeCount: 15, gapSize: 3, damageMul: 1.0 }),
            m('golem_boulder_rain', 'Lluvia de Bloques', 'strike_pattern', { phaseMin: 3, pattern: 'random_room', strikeCount: 10, telegraph: 1.05 }),
            m('golem_guard_summon', 'Guardianes de Piedra', 'summon_wave', { phaseMin: 2, summonTypes: ['brute', 'skeleton', 'goblin'] }),
            m('golem_corner_maul', 'Mazo de Esquinas', 'wall_volley', { phaseMin: 3, walls: ['corners'], countPerWall: 2, targeted: false, damageMul: 0.8 })
        ],

        hydra: [
            m('hydra_spit_fan', 'Saliva de Multiples Fauces', 'arc_burst', { count: 8, spreadDeg: 100, waves: 2 }),
            m('hydra_tide_ring', 'Marea Escamosa', 'ring_burst', { phaseMin: 2, count: 18 }),
            m('hydra_neck_dash', 'Latigazo Cervical', 'dash_trail', { phaseMin: 2, dashSpeed: 535 }),
            m('hydra_maw_prison', 'Prision de Mandibulas', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 9 }),
            m('hydra_toxic_grid', 'Reticula Toxica', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 12 }),
            m('hydra_head_wall', 'Choque de Cabezas', 'wall_volley', { phaseMin: 2, walls: ['left', 'right'], countPerWall: 6 }),
            m('hydra_orbit_spit', 'Orbitas Hidricas', 'orbit_release', { phaseMin: 2, orbitCount: 7, releaseMode: 'aimed' }),
            m('hydra_swarm_nest', 'Pozo de Crias', 'meteor_spawner', { phaseMin: 2, nestHp: 210, nestPool: ['slime', 'wisp', 'charger', 'brute'], nestLabel: 'Pozo de Hydra' }),
            m('hydra_ricochet_glob', 'Globulo Rebotante', 'ricochet_orb', { phaseMin: 3, damageMul: 0.86 }),
            m('hydra_safe_channel', 'Canal Seguro', 'strike_pattern', { phaseMin: 3, pattern: 'ring_gap_player', strikeCount: 15, gapSize: 3 }),
            m('hydra_summon_wave', 'Oleada de Serpientes', 'summon_wave', { phaseMin: 2, count: 4, summonTypes: ['slime', 'charger', 'skeleton'] }),
            m('hydra_triple_bite', 'Triple Mordida', 'bite_rush', { phaseMin: 1, maxDist: 190, damageMul: 0.85 })
        ],

        fire_lord: [
            m('fire_rotating_beams', 'Corona de Rayos Giratorios', 'rotating_beams', { role: 'control angular con gaps caminables', phaseMin: 2, duration: 10.0, beamCount: 5, rotSpeed: 0.43, invertChance: 0.24 }),
            m('fire_magma_fan', 'Abanico Magmatico', 'arc_burst', { count: 8, spreadDeg: 96, speed: 340, damageMul: 0.78, waves: 2 }),
            m('fire_ember_ring', 'Anillo de Brasas', 'ring_burst', { phaseMin: 2, count: 18, speed: 260, damageMul: 0.72 }),
            m('fire_wall_flare', 'Llamarada Mural', 'wall_volley', { phaseMin: 2, walls: ['left', 'right', 'top', 'bottom'], countPerWall: 4 }),
            m('fire_inferno_dash', 'Ariete del Inferno', 'dash_trail', { phaseMin: 2, dashSpeed: 590, trailEvery: 0.11, trailDamageMul: 0.66 }),
            m('fire_pillar_grid', 'Cuadricula de Pilares', 'strike_pattern', { phaseMin: 3, pattern: 'grid_room', strikeCount: 14, damageMul: 0.84 }),
            m('fire_meteor_nest', 'Forja Meteoritica', 'meteor_spawner', { phaseMin: 3, meteorCount: 3, nestHp: 240, nestLabel: 'Forja Viva', impactDamageMul: 0.9 }),
            m('fire_orbit_flames', 'Orbitas Candentes', 'orbit_release', { phaseMin: 2, orbitCount: 7, orbitRadius: 70, speed: 300 }),
            m('fire_safe_arc', 'Arco Seguro Invertido', 'strike_pattern', { phaseMin: 2, pattern: 'ring_gap_player', strikeCount: 14, gapSize: 3 }),
            m('fire_corner_volley', 'Volcada de Esquinas', 'wall_volley', { phaseMin: 3, walls: ['corners'], countPerWall: 2 }),
            m('fire_lava_prison', 'Prision de Lava', 'strike_pattern', { phaseMin: 2, pattern: 'prison_player', strikeCount: 9, damageMul: 0.8 }),
            m('fire_summon_wave', 'Ola de Incinerados', 'summon_wave', { phaseMin: 2, count: 4, summonTypes: ['wisp', 'mage', 'charger'] })
        ],

        final_boss: [
            m('cataclysm_omnifire', 'Omnifuego', 'arc_burst', { phaseMin: 1, phaseMax: 4, count: 10, spreadDeg: 112, speed: 350, waves: 2, waveInterval: 0.24 }),
            m('cataclysm_ricochet', 'Cataclismo Refractado', 'ricochet_orb', { phaseMin: 2, phaseMax: 4, speed: 260, damageMul: 0.92, range: 1900, radius: 10 }),
            m('cataclysm_rotating_beams', 'Corona del Fin', 'rotating_beams', { phaseMin: 3, phaseMax: 4, duration: 10.0, beamCount: 5, rotSpeed: 0.5, invertChance: 0.3 }),
            m('cataclysm_meteor_spawner', 'Semilla del Fin', 'meteor_spawner', { phaseMin: 3, phaseMax: 4, meteorCount: 4, meteorInterval: 0.8, nestHp: 280, nestLabel: 'Nexo Cataclismico', impactDamageMul: 0.95 }),
            m('cataclysm_wall_furnace', 'Horno de Muros', 'wall_volley', { phaseMin: 2, phaseMax: 4, walls: ['left', 'right', 'top', 'bottom'], countPerWall: 5 }),
            m('cataclysm_void_dash', 'Corte del Vacio', 'dash_trail', { phaseMin: 2, phaseMax: 4, dashSpeed: 620, dashDuration: 0.7, trailEvery: 0.1, trailDamageMul: 0.68 }),
            m('cataclysm_prison', 'Prision Terminus', 'strike_pattern', { phaseMin: 2, phaseMax: 4, pattern: 'prison_player', strikeCount: 10 }),
            m('cataclysm_grid', 'Malla Omega', 'strike_pattern', { phaseMin: 2, phaseMax: 4, pattern: 'grid_room', strikeCount: 16 }),
            m('cataclysm_orbit', 'Orbitas del Colapso', 'orbit_release', { phaseMin: 2, phaseMax: 4, orbitCount: 8, orbitRadius: 76, speed: 320, releaseMode: 'aimed' }),
            m('cataclysm_summon_wave', 'Cortejo del Fin', 'summon_wave', { phaseMin: 2, phaseMax: 4, count: 4, summonTypes: ['brute', 'mage', 'charger', 'summoner'] }),
            m('cataclysm_safe_gap', 'Compresion con Brecha', 'strike_pattern', { phaseMin: 3, phaseMax: 4, pattern: 'ring_gap_player', strikeCount: 16, gapSize: 3, damageMul: 0.96 }),
            m('cataclysm_finale_ring', 'Anillo de Ruptura', 'ring_burst', { phaseMin: 4, phaseMax: 4, count: 24, speed: 285, waves: 2, gapSize: 3, damageMul: 0.82 })
        ]
    };

    const combosByBoss = {
        guardian: [
            { id: 'guardian_combo_ancla', sequence: ['guardian_wall_lances', 'guardian_anchor_dash'], phaseMin: 2, cooldown: 16, chance: 0.22 },
            { id: 'guardian_combo_gap', sequence: ['guardian_quake_cross', 'guardian_safe_gap'], phaseMin: 3, cooldown: 15, chance: 0.2 },
            { id: 'guardian_combo_orbit', sequence: ['guardian_warded_orbit', 'guardian_bastion_fan'], phaseMin: 3, cooldown: 14, chance: 0.24 }
        ],
        demon_lord: [
            { id: 'demon_combo_nest', sequence: ['demon_meteor_spawner', 'demon_hex_prison'], phaseMin: 2, cooldown: 17, chance: 0.2 },
            { id: 'demon_combo_beams', sequence: ['demon_shadow_walls', 'demon_laser_pincer'], phaseMin: 3, cooldown: 18, chance: 0.18 },
            { id: 'demon_combo_chaos', sequence: ['demon_chaos_ricochet', 'demon_collapse_gap', 'demon_abyss_fan'], phaseMin: 3, cooldown: 19, chance: 0.16 }
        ],
        skeleton_king: [
            { id: 'skel_combo_crypt', sequence: ['skel_corner_cross', 'skel_bone_prison'], phaseMin: 2, cooldown: 16, chance: 0.2 },
            { id: 'skel_combo_ricochet', sequence: ['skel_bone_ricochet', 'skel_rib_fan'], phaseMin: 2, cooldown: 15, chance: 0.24 },
            { id: 'skel_combo_army', sequence: ['skel_banner_summon', 'skel_safe_lane'], phaseMin: 3, cooldown: 18, chance: 0.18 }
        ],
        spider_queen: [
            { id: 'spider_combo_nest', sequence: ['spider_brood_nest', 'spider_silk_prison'], phaseMin: 2, cooldown: 17, chance: 0.2 },
            { id: 'spider_combo_dash', sequence: ['spider_ambush_cross', 'spider_trap_dash'], phaseMin: 2, cooldown: 15, chance: 0.22 },
            { id: 'spider_combo_bite', sequence: ['spider_orbit_spiders', 'spider_gap_bite'], phaseMin: 3, cooldown: 16, chance: 0.2 }
        ],
        golem: [
            { id: 'golem_combo_fault', sequence: ['golem_pillar_cross', 'golem_fault_dash'], phaseMin: 2, cooldown: 16, chance: 0.22 },
            { id: 'golem_combo_grid', sequence: ['golem_boulder_rain', 'golem_seismic_grid'], phaseMin: 3, cooldown: 17, chance: 0.18 },
            { id: 'golem_combo_guard', sequence: ['golem_guard_summon', 'golem_crush_gap'], phaseMin: 3, cooldown: 18, chance: 0.18 }
        ],
        hydra: [
            { id: 'hydra_combo_maw', sequence: ['hydra_maw_prison', 'hydra_triple_bite'], phaseMin: 2, cooldown: 15, chance: 0.24 },
            { id: 'hydra_combo_swarm', sequence: ['hydra_swarm_nest', 'hydra_toxic_grid'], phaseMin: 3, cooldown: 18, chance: 0.18 },
            { id: 'hydra_combo_ricochet', sequence: ['hydra_ricochet_glob', 'hydra_safe_channel'], phaseMin: 3, cooldown: 16, chance: 0.2 }
        ],
        fire_lord: [
            { id: 'fire_combo_beams', sequence: ['fire_rotating_beams', 'fire_safe_arc'], phaseMin: 2, cooldown: 18, chance: 0.18 },
            { id: 'fire_combo_forge', sequence: ['fire_meteor_nest', 'fire_corner_volley'], phaseMin: 3, cooldown: 18, chance: 0.17 },
            { id: 'fire_combo_dash', sequence: ['fire_lava_prison', 'fire_inferno_dash', 'fire_ember_ring'], phaseMin: 3, cooldown: 19, chance: 0.15 }
        ],
        final_boss: [
            { id: 'cat_combo_void', sequence: ['cataclysm_prison', 'cataclysm_void_dash', 'cataclysm_omnifire'], phaseMin: 2, cooldown: 17, chance: 0.2 },
            { id: 'cat_combo_end', sequence: ['cataclysm_meteor_spawner', 'cataclysm_rotating_beams'], phaseMin: 3, cooldown: 20, chance: 0.16 },
            { id: 'cat_combo_final', sequence: ['cataclysm_ricochet', 'cataclysm_safe_gap', 'cataclysm_finale_ring'], phaseMin: 4, cooldown: 22, chance: 0.15 }
        ]
    };

    const phasePlan = {
        guardian: {
            1: ['guardian_ricochet_orb', 'guardian_bastion_fan', 'guardian_quake_cross', 'guardian_zone_push'],
            2: ['guardian_wall_lances', 'guardian_anchor_dash', 'guardian_pincer_strike', 'guardian_shield_ring'],
            3: ['guardian_hammer_rain', 'guardian_warded_orbit', 'guardian_safe_gap', 'guardian_judgement_grid']
        },
        demon_lord: {
            1: ['demon_abyss_fan', 'demon_hell_ring', 'demon_shadow_walls'],
            2: ['demon_meteor_spawner', 'demon_blood_dash', 'demon_hex_prison', 'demon_dread_orbit'],
            3: ['demon_summon_wave', 'demon_chaos_ricochet', 'demon_collapse_gap', 'demon_inferno_grid', 'demon_laser_pincer']
        },
        skeleton_king: {
            1: ['skel_rib_fan', 'skel_coffin_wall', 'skel_corner_cross'],
            2: ['skel_lance_dash', 'skel_bone_prison', 'skel_grave_ring', 'skel_banner_summon'],
            3: ['skel_marrow_grid', 'skel_bone_ricochet', 'skel_orbit_skulls', 'skel_safe_lane', 'skel_skull_hail']
        },
        spider_queen: {
            1: ['spider_web_fan', 'spider_ambush_cross', 'spider_egg_mortar'],
            2: ['spider_web_walls', 'spider_trap_dash', 'spider_silk_prison', 'spider_summon_wave', 'spider_brood_nest'],
            3: ['spider_venom_ring', 'spider_orbit_spiders', 'spider_gap_bite', 'spider_corner_spray']
        },
        golem: {
            1: ['golem_quarry_fan', 'golem_pillar_cross', 'golem_boulder_ring'],
            2: ['golem_wall_slam', 'golem_fault_dash', 'golem_orbit_shards', 'golem_guard_summon'],
            3: ['golem_seismic_grid', 'golem_rock_ricochet', 'golem_crush_gap', 'golem_boulder_rain', 'golem_corner_maul']
        },
        hydra: {
            1: ['hydra_spit_fan', 'hydra_triple_bite', 'hydra_head_wall'],
            2: ['hydra_tide_ring', 'hydra_neck_dash', 'hydra_maw_prison', 'hydra_summon_wave'],
            3: ['hydra_toxic_grid', 'hydra_swarm_nest', 'hydra_ricochet_glob', 'hydra_orbit_spit', 'hydra_safe_channel']
        },
        fire_lord: {
            1: ['fire_magma_fan', 'fire_ember_ring', 'fire_wall_flare'],
            2: ['fire_inferno_dash', 'fire_lava_prison', 'fire_orbit_flames', 'fire_rotating_beams'],
            3: ['fire_pillar_grid', 'fire_meteor_nest', 'fire_safe_arc', 'fire_corner_volley', 'fire_summon_wave']
        },
        final_boss: {
            1: ['cataclysm_omnifire', 'cataclysm_wall_furnace', 'cataclysm_prison'],
            2: ['cataclysm_grid', 'cataclysm_void_dash', 'cataclysm_orbit', 'cataclysm_ricochet'],
            3: ['cataclysm_rotating_beams', 'cataclysm_meteor_spawner', 'cataclysm_safe_gap', 'cataclysm_summon_wave'],
            4: ['cataclysm_finale_ring', 'cataclysm_rotating_beams', 'cataclysm_meteor_spawner', 'cataclysm_ricochet', 'cataclysm_omnifire']
        }
    };

    const moveIndex = {};
    Object.keys(byBoss).forEach(bossId => {
        byBoss[bossId].forEach(move => {
            moveIndex[move.id] = Object.assign({ bossId }, move);
        });
    });

    window.BossAttackPack = {
        limits: {
            maxProjectilesTotal: 220,
            maxEnemyProjectiles: 150,
            maxPlayerProjectiles: 90
        },
        byBoss,
        combosByBoss,
        phasePlan,
        moveIndex
    };
})();
