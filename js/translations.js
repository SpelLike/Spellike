// ==========================================
// SPELLIKE - Translation System
// ==========================================

const Translations = {
    es: {
        codexOr: "O",
        // === MAIN MENU ===
        gameTitle: 'SpelLike',
        tagline: 'Combina. Conquista. Repite hasta morir.',
        loadingSequence: [
            "Cargando",
            "Cargando Dungeons",
            "Cargando Bosses",
            "Error",
            "Preguntando a la IA por el error",
            "La IA no supo responder",
            "Entro en crisis",
            "Ayuda por favor",
            "Ya encontré el error",
            "Me faltaba un ;",
            "Dios dame paciencia"
        ],
        loadingPhases: [
            "Inicializando UI",
            "Cargando assets",
            "Preparando dungeon"
        ],
        btnPlay: 'INICIAR PARTIDA',
        btnMeta: 'MEJORAS',
        btnSettings: 'AJUSTES',
        btnFeedback: 'FEEDBACK',
        btnQuit: 'SALIR',
        btnUpdates: 'NOVEDADES',
        updatesTitle: 'ACTUALIZACIONES',
        updatesVersion013: 'v0.1.3 - Early Access',
        updatesNotes013: '✨ [Codex] Sinergias visibles y añadidas al Códex (se registran y se muestran correctamente).\n🌱 [Seeds] Seeds copiables/compartibles (podés usar tus seeds o las de otros).\n🎯 [Combate] Texto “CRITIC!” amarillo titilante al hacer crítico.\n🎁 [Cofres] Animaciones nuevas en cofres + bonus chiquito y visual al abrir.\n🌍 [Idioma] Traducción completa al inglés + opción para cambiar idioma desde el juego.\n🎯 [Combate] Cap de velocidad de disparo: máx +100% (2x).\n🧩 [Runas] Stackeo real: si ya tenés el stack al máximo, esas runas dejan de aparecer (antes seguían saliendo “de más”).\n🎯 [Balance] Reducción del alcance de proyectiles.\n👹 [Enemigos] Spawn de enemigos modificado/ajustado (encuentros más consistentes).\n🌩️ [Set] SET DE LA TORMENTA ahora es funcional (ver detalles en el Códex).\n🛡️ [Feedback] Anti-spam en Feedback (evita envíos repetidos) + feedback visual de bloqueo.\n✅ [Objetivos] Se añadieron objetivos durante las partidas (más variedad de runs).',
        updatesVersion012: 'v0.1.2 - Early Access',
        updatesNotes012: '✨ [Meta] Nueva moneda permanente: Esencia (se guarda entre partidas).\n✨ [Meta] Esencia se gana al finalizar la run: +1 cada 2 bosses derrotados, +3 por cada NG+ completado.\n✨ [Meta] Nuevo menú ✨ MEJORAS en el inicio para comprar upgrades permanentes con Esencia.\n🛒 [Mejoras] Slots de tienda escalables (arranca con menos) hasta máx. 8.\n🔁 [Mejoras] Rerolls de tienda escalables hasta máx. 4.\n🍀 [Mejoras] Suerte escalable hasta máx. 20% + nerfeo fuerte al spawn base de épicos/legendarios.\n💨 [Mejoras] Dash por cargas: hasta 3 dashes seguidos (cargas regenerables).\n🛒 [Tienda] Añadidas pociones de vida y maná (uso instantáneo, no ocupan slots).\n♻️ [Tienda] Recicladora (máx. 1 uso) + 💱 Vendedor con precio visible (💰 +X oro por carta).\n🎁 [Cofres/Boss] Fixes de flujo (cancelar swap no rompe pantalla) + runas ya no se aplican gratis: siempre ocupan slot y se muestran.\n🎯 [Combate] Cap de velocidad de disparo: máx +100% (2x).\n🧪 [Balance] Toque del Vacío nerfeado: 8%→2%, máx 2 stacks (descripción actualizada).\n🧪 [Balance] Nerfs: Aniquilación y Singularidad balanceadas. Vampírico rework: cura 5% vida máx por kill (no lifesteal).\n🩹 [Bug] Arreglado el desfasaje de disparo (balas “se alejan”).\n🩹 [Bug] Enemigos/boss aparecían con vida baja: fix de escalado (al entrar: HP = MaxHP).\n🩹 [QoL] Clear de sala: al matar a todos, rellena 50% del maná. Monedas imantadas más rápidas.\n🎨 [Menu] Logo 🔮 reemplazado por la S (mantiene animación) + favicon actualizado + fix de textos versión/esencia.',
        updatesVersion011: 'v0.1.1 - Early Access',
        updatesNotes011: '✨ [HUD] Interfaz totalmente rediseñada.\n✨ [Info] Nuevo panel (arriba-izquierda): Bioma, Sala y Eventos activos.\n✨ [Items] Panel derecho con ítems pasivos y colores de rareza.\n✨ [Minimap] Leyenda bajo el minimapa (Tienda, Jefe, Completado, etc.).\n✨ [Eventos] Los eventos ahora muestran nombres localizados (sin códigos internos).\n🛡️ [Gameplay] Invencibilidad temporal al entrar a salas (anti-daño instantáneo).\n🧩 [Runas] Al hacer click para ver runas, el personaje ya no dispara.\n⚖️ [Economía] Arreglado el costo de las Runas Vacías.\n⚖️ [Economía] El precio de las runas ahora escala según rareza.\n🛡️ [Balance] Nerfeo al daño de rayo en cadena (-40%).\n⚔️ [Dificultad] Desafío Infinito: gran pico de dificultad en runs largas.\n⚔️ [Dificultad] Activación: después de derrotar al 3.er Jefe.\n⚔️ [Dificultad] Escalado: cada jefe extra multiplica HP enemigos x2 y Daño x1.2.\n🐛 [Bug] Sistema de guardado: los ítems recolectados ya no desaparecen al recargar.\n🐛 [Bug] Pausa: ESC vuelve a reanudar correctamente (sin doble ESC).\n🐛 [Bug] Contador de Bioma actualizado correctamente tras derrotar un jefe.\n🐛 [Bug] Recompensas dobles: removida la pantalla extra al entrar a un nuevo bioma.\n🐛 [Bug] Eventos: ya no aparecen como "---" cuando están activos.\n🐛 [Bug] Hitboxes de proyectiles más precisas.\n🎯 [Boss] Patrones de balas más justos (más espacio para esquivar).\n🛡️ [Feedback] Anti-spam en Feedback (evita envíos repetidos).\n✅ [Feedback] Cualquier bug, problema o recomendación no dudes en enviarlo al Feedback y lo arreglaré.',
        
        audioHint: '🔊 Activar música: hacé <b>click</b> o presioná <b>una tecla</b>.',
        metaEssence: 'Esencia',
        version: 'v0.1.3 Early Access',
        
        // === META UPGRADES ===
        metaTitle: '✨ MEJORAS PERMANENTES',
        btnBack: 'VOLVER',
        rewardTitle: 'RECOMPENSAS',
        btnDiscard: 'DESCARTAR',
        // === SHRINE ===
        shrine_title: 'SANTUARIO',
        shrine_subtitle: 'Elige una bendición rápida:',
        shrine_close: 'Cerrar',
        shrine_heal_name: 'Sanación',
        shrine_heal_desc: 'Cura 40% de tu HP máximo',
        shrine_gold_name: 'Ofrenda',
        shrine_gold_desc: '+200 oro',
        shrine_potion_name: 'Frascos',
        shrine_potion_desc: '+2 pociones',
        toastSynergy: '⚡ SINERGIA:',
        // === CAMPFIRE ===
        campfire_title: 'HOGUERA',
        campfire_subtitle: 'Tomate un respiro y elegí un beneficio:',
        campfire_close: 'Cerrar',
        campfire_rest_name: 'Descansar',
        campfire_rest_desc: 'Cura 35% de tu HP máximo',
        campfire_sharpen_name: 'Afilado',
        campfire_sharpen_desc: '+4 daño permanente (run)',
        campfire_refill_name: 'Reponer',
        campfire_refill_desc: '+1 poción',

        synergiesNoneTitle: 'Sin sinergias activas',
        synergiesNoneDesc: 'Combina runas para activar sinergias.',
        codexTabBestiary: 'Bestiario',
        codexTabAchievements: 'Logros',
        codexTabHistory: 'Historial',
        codexTabSets: 'Sets',
        codexTabSynergies: 'Sinergias',
        codexTabBook: 'Libro',
        // === CODEX (Bestiary) ===
        codexEnemiesTitle: 'ENEMIGOS',
        codexBossesTitle: 'JEFES',
        codexSelectEntry: 'Selecciona una entrada',
        codexTip: 'Tip: Abrís el códex con C. Las entradas se desbloquean cuando derrotás al enemigo/jefe por primera vez.',
        codexAdviceLabel: 'Consejo',
        codexAdviceEnemy: 'Leé su patrón y no te quedes quieto.',
        codexAdviceBoss: 'Guardá dash para los ataques fuertes.',
        codexHpBaseLabel: 'HP Base',
        codexDamageBaseLabel: 'Daño Base',
        codexSpeedLabel: 'Velocidad',
        codexKills: 'Kills',
        codexLocked: 'Bloqueado',
        hudEnemiesRemaining: '{n} enemigos',
        historyFilterPlaceholder: 'filtrar...',
        historySortDate: 'fecha',
        historySortNg: 'ng+',
        historySortGold: 'oro',
        historySortKills: 'kills',
        historySortTime: 'tiempo',
        historyClear: 'limpiar',
        historyRunsLabel: 'Runs',
        historyBestNgLabel: 'Mejor NG+',
        historyMaxGoldLabel: 'Oro máx',
        historyMaxKillsLabel: 'Kills máx',
        historyBestTimeLabel: 'Tiempo máx',
        historyNoRuns: 'No hay runs para mostrar.',
        historyDetailTitle: 'Historial',
        historyDetailHint: 'Jugá una run y al morir se guarda acá.',
        codexRequirement: 'Requisito',
        codexBonus: 'Bonus',
        codexReq_barrage: '2+ runas que den proyectiles extra',
        codexReq_efficient_caster: '2+ runas que reduzcan costo de maná',
        codexReq_rapid_fire: '2+ runas que aumenten velocidad de disparo',
        codexReq_sniper_elite: '2+ runas que aumenten rango',
        codexReq_hypersonic: '2+ runas que aumenten velocidad de proyectil',
        codexReq_special: 'Condición especial (auto-detectada en partida)',
        codexSynergyDbMissing: 'No se encontró SynergyDatabase. Asegurate de que js/synergies.js esté cargado.',
        codexNoSynergies: 'No hay sinergias definidas todavía.',
        critPopup: 'CRITIC!',

        // === PACT EVENT ===
        pactTitle: '☠️ PACTO',
        pactSubtitle: 'Poder a cambio de un costo:',
        pactReject: 'Rechazar',
        pactCursedBagTitle: 'Bolsa Maldita',
        pactCursedBagDesc: '+1 slot de runas, -10% HP máximo',
        pactProfaneSheathTitle: 'Funda Profana',
        pactProfaneSheathDesc: '+1 slot de activo, -12% velocidad',
        pactFuryTitle: 'Furia',
        pactFuryDesc: '+20% daño, -15% maná máximo',
        
        // === SLOT SELECTION ===
        slotSelectTitle: 'SELECCIONAR PARTIDA',
        emptySlot: 'Vacío',
        newGame: 'Nueva Partida',
        
        // === DIFFICULTY ===
        difficultyTitle: 'ELIGE TU DIFICULTAD',
        diffNormal: 'NORMAL',
        diffNormalDesc: 'Experiencia estándar. Recomendado para nuevos jugadores.',
        diffNormalPoint1: '✓ Tutoriales activos',
        diffNormalPoint2: '✓ Dificultad balanceada',
        diffHard: 'DIFÍCIL',
        diffHardDesc: 'Para jugadores experimentados. Mejor loot, más riesgo.',
        diffHardPoint1: '• Enemigos +50% HP',
        diffHardPoint2: '• Enemigos +25% daño',
        diffHardPoint3: '• Cofres +1 rareza',
        diffHardLocked: '🔒 Derrota 1 jefe en Normal',
        diffDemonic: 'DEMENCIAL',
        diffDemonicDesc: 'El verdadero desafío. Programa tu destino.',
        diffDemonicPoint1: '• Enemigos +150% HP',
        diffDemonicPoint2: '• Runas Vacías + Forjas',
        diffDemonicPoint3: '• Sin piedad',
        diffDemonicLocked: '🔒 Derrota tu primer jefe',
        seedLabel: '🎲 Seed (opcional):',
        seedPlaceholder: 'Dejar vacío para random',
        negativeEvents: 'Eventos negativos en salas',
        btnStart: 'INICIAR',
        
        // === SETTINGS ===
        settingsTitle: '⚙ AJUSTES',
        tabAudio: '🔊 Audio',
        tabGraphics: '🖥 Gráficos',
        tabControls: '🎮 Controles',
        tabLanguage: '🌐 Idioma',
        volMaster: 'Volumen Maestro',
        volMusic: 'Música',
        volSfx: 'Efectos de Sonido',
        volUi: 'UI / Interfaz',
        screenMode: 'Modo de Pantalla',
        screenWindowed: 'Ventana',
        screenFullscreen: 'Pantalla Completa',
        pixelScaling: 'Escalado de Pixel',
        pixelPerfect: 'Pixel Perfect',
        pixelStretched: 'Estirado',
        vfxQuality: 'Calidad de VFX',
        vfxLow: 'Bajo',
        vfxMedium: 'Medio',
        vfxHigh: 'Alto',
        optScreenshake: 'Screenshake',
        optParticles: 'Partículas',
        optHitflash: 'Flash en Hit',
        optSynergiesVisible: 'Sinergias siempre visibles',
        optSynergiesHint: 'Mostrar panel de sinergias sin presionar B',
        btnApply: 'APLICAR',
        
        // === CONTROLS ===
        ctrlMovement: 'Movimiento',
        ctrlAim: 'Apuntar',
        ctrlShoot: 'Disparar',
        ctrlDash: 'Dash',
        ctrlInteract: 'Interactuar',
        ctrlPotion: 'Usar Poción',
        ctrlActive: 'Usar Activo',
        ctrlActive2: 'Usar Activo 2 (si lo desbloqueas)',
        ctrlInventory: 'Inventario',
        ctrlPause: 'Pausa',
        
        // === FEEDBACK ===
        feedbackTitle: '💬 FEEDBACK',
        feedbackHint: 'Usá esto para reportar bugs o tirar ideas. Podés copiar el texto y pegarlo en el chat.',
        feedbackType: 'Tipo',
        feedbackBug: 'Bug',
        feedbackSuggestion: 'Recomendación',
        feedbackBalance: 'Balance',
        feedbackOther: 'Otro',
        feedbackDetail: 'Detalle',
        feedbackPlaceholder: 'Ej: Sala 4, boss Golem, el láser se queda clavado... Pasos para reproducir: 1) ... 2) ... Resultado esperado: ... Resultado obtenido: ...',
        btnSend: 'ENVIAR',
        btnCopy: 'COPIAR',
        btnClear: 'LIMPIAR',
        feedbackMailHint: 'Si tiene fotos o videos por favor adjuntelos via LINK en el mensaje.',
        feedbackSent: 'Enviado, Muchas gracias por contribuir!',
        feedbackCooldown: 'Esperá {s}s antes de enviar otro feedback.',
        feedbackCopied: 'Copiado al portapapeles.',
        
        // === HUD ===
        hudLife: 'VIDA',
        hudMana: '💧 MANÁ',
        hudBiome: 'Bioma',
        hudRoom: 'Sala',
        setBonus: 'BONUS DE SET',
        hudEvent: 'Evento',
        hudNone: 'Ninguno',
        hudSetBonus: 'Bonus de Set',
        hudObjectives: 'OBJETIVOS',
        hudSynergies: 'SINERGIAS',
        hudSynergiesHint: 'Presioná B para ocultar/mostrar',
        hudItems: 'ITEMS',
        
        // === MINIMAP ===
        mapCompleted: 'Completadas',
        mapIncomplete: 'Incompletas',
        mapShop: 'Tienda',
        mapMiniboss: 'MiniBoss',
        mapBoss: 'Boss',
        
        // === PAUSE MENU ===
        pauseTitle: '⏸ PAUSA',
        btnResume: '▶ CONTINUAR',
        btnStats: '📊 ESTADÍSTICAS',
        btnCodex: '📖 CÓDEX',
        btnPauseSettings: '⚙ AJUSTES',
        btnAbandon: '💀 ABANDONAR RUN',
        
        // === LANGUAGE SELECTOR ===
        langSpanish: 'Español',
        langEnglish: 'English',
        langRestart: 'Se recargará la página',
        
        // === GAME MESSAGES ===
        msgRoomCleared: '¡Sala despejada!',
        msgBossDefeated: '¡Boss derrotado!',
        msgLevelUp: '¡SUBISTE DE NIVEL!',
        msgGameOver: 'GAME OVER',
        msgVictory: '¡VICTORIA!',
        msgPaused: 'PAUSADO',
        
        // === SHOP ===
        shopTitle: '🛒 TIENDA',
        shopBlackmarket: '☠️ MERCADO NEGRO',
        shopReroll: '🔄 REROLL ({n})',
        shopRecycle: '♻️ RECICLAR',
        shopSell: '💱 VENDER',
        shopSellHint: 'Elige una Runa o Activo para vender por oro.',
        shopRecycleHint: 'Elige una Runa o Activo para reciclar: obtienes otro de la misma rareza.',
        shopBuy: 'COMPRAR',
        metaLevel: 'Nivel',
        shopClose: 'Cerrar',
        shopGold: 'Oro',
        shopFull: 'Inventario lleno',
        shopNoGold: 'SIN ORO',
        shopSold: '¡Vendido!',
        shopBought: 'COMPRADO',
        shopRecycled: '¡Reciclado!',
        metaNotAvailable: 'Meta no disponible.',
        codexEnemiesTitle: 'ENEMIGOS',
        codexBossesTitle: 'JEFES',
        codexKills: 'Kills',
        codexLocked: 'Bloqueado',
        unlockBossNormal: 'Derrota 1 jefe en Normal',
        unlockBossHard: 'Derrota 1 jefe en Difícil',
        codexUnlockEnemy: 'Derrota a este enemigo para desbloquear información.',
        codexUnlockBoss: 'Derrota a este jefe para desbloquear información.',
        lockedUpgradeShop: 'Bloqueado (Mejorar en tienda)',
        // === EXTRA I18N (added) ===
        lootChooseTitle: '¡ELIGE TU RECOMPENSA!',
        lootRune: 'RUNA',
        lootItem: 'ITEM',
        lootOr: 'O',
        lootDiscardBoth: 'Descartar Ambos',
        promptAdvance: '[E] Avanzar',
        enemiesRemaining: '💀 {n} enemigos',
        metaEssenceLabel: 'Esencia: {n}',
        metaShopSlotsTitle: 'Más slots en tienda',
        metaShopSlotsDesc: 'Reduce la tienda a 4 y desbloquea hasta 8 slots.',
        metaShopRerollsTitle: 'Rerolls de tienda',
        metaShopRerollsDesc: 'Más rerolls por tienda (máx 4).',
        metaShopLuckTitle: 'Suerte',
        metaShopLuckDesc: 'Aumenta chances de ítems/runas mejores (máx 20%).',
        metaShopDashTitle: 'Dash extra',
        metaShopDashDesc: 'Hasta 3 dashes en cadena. Se recargan con el tiempo.',
        metaShopStartGoldTitle: 'Bolsillo inicial',
        metaShopStartGoldDesc: 'Empieza cada run con oro extra.',
        metaShopVitalityTitle: 'Vitalidad',
        metaShopVitalityDesc: 'Aumenta tu HP máximo al iniciar.',
        metaShopPotionBeltTitle: 'Cinturón de pociones',
        metaShopPotionBeltDesc: 'Comienzas con más pociones.',
        shopTitle: '🛒 TIENDA',
        shopBlackmarket: '☠️ MERCADO NEGRO',
        shopSub: 'Compra runas, activos y mejoras.',
        shopSubBlackmarket: 'Ofertas poderosas… con consecuencias.',
        shopGoldLabel: 'Oro: 💰 {n}',
        shopReroll: '🔄 REROLL ({n})',
        shopRecycle: '♻️ RECICLAR',
        shopSell: '💱 VENDER',
        shopSellHint: 'Elige una Runa o Activo para vender por oro.',
        shopRecycleHint: 'Elige una Runa o Activo para reciclar: obtienes otro de la misma rareza.',
        shopBuy: 'COMPRAR',
        shopBought: 'COMPRADO',
        shopNoGold: 'SIN ORO',
        shopClose: 'Cerrar',
        statDmgDealt: 'Daño Infligido',
        statDmgTaken: 'Daño Recibido',
        statRoomsCleared: 'Salas Limpiadas',
        statBiomesCleared: 'Biomas Completados',
        statsRunesEquipped: 'RUNAS EQUIPADAS',

        // === EXTRA UI KEYS (added) ===
        campfireTitle: '🔥 HOGUERA',
        campfireSubtitle: 'Tomate un respiro y elegí un beneficio:',
        codexSelectEntry: 'Selecciona una entrada',
        codexTip: 'Tip: Abrís el códex con C. Las entradas se desbloquean cuando derrotás al enemigo/jefe por primera vez.',
        enemiesRemainingLabel: 'enemigos',

        // === SHOP ===
        shopSub: "Comprá runas, ítems y mejoras.",
        shopGoldLabel: "Oro: {n}",
        shopReroll: "Reroll ({n} restantes)",
        shopRecycle: "Reciclar",
        shopSell: "Vender",

        // === STATS ===
        statsTitle: "Estadísticas",
        statBiome: "Bioma",
        statRoom: "Sala",
        statGold: "Oro",
        statDmgDealt: "Daño Hecho",
        statDmgTaken: "Daño Recibido",
        statRoomsCleared: "Salas Completadas",
        statBiomesCleared: "Biomas Completados",
        statTime: "Tiempo",
        statsRunesEquipped: "Runas equipadas",
        btnClose: "Cerrar",
        btnCancel: 'CANCELAR',
        runeSwapTitle: 'INTERCAMBIAR RUNA',
        runeSwapNew: 'Nueva:',
        runeSwapChoose: 'Elige cuál runa reemplazar:',

        // === CODEX: SETS & SYNERGIES ===
        codexSetLabel: "Set:",
        codexBonus2: "Bonus 2 piezas:",
        codexBonus3: "Bonus 3 piezas:",

        // Set: Storm
        setStormName: "Tormenta",
        setStormBonus2Desc: "+15% velocidad de proyectil",
        setStormBonus3Desc: "El dash deja un disparo de rayo",
        codexNoSets: "Todavía no tenés sets. Buscá piezas en tiendas y cofres.",
        codexRequirement: "Requisito:",
        codexBonusLabel: "Bonus:",
        codexRequirementExtraProjectiles: "Requisito: 2+ runas que den proyectiles extra",
        codexNoSynergies: "Todavía no desbloqueaste sinergias. Probá combinar runas e ítems.",

    },
    en: {
        codexOr: "OR",
        
    // Meta shop / permanent upgrades
    metaEssenceLabel: 'Essence: {n}',
    metaShopSlotsTitle: 'Shop Slots',
    metaShopSlotsDesc: 'Start runs with more shop item slots.',
    metaShopRerollsTitle: 'Shop Rerolls',
    metaShopRerollsDesc: 'Gain extra rerolls in the shop each run.',
    metaShopLuckTitle: 'Luck',
    metaShopLuckDesc: 'Increases chance of higher rarity loot.',
    metaShopDashTitle: 'Dash Charges',
    metaShopDashDesc: 'Gain extra dash charges.',
    metaShopStartGoldTitle: 'Starting Gold',
    metaShopStartGoldDesc: 'Start runs with extra gold.',
    metaShopVitalityTitle: 'Vitality',
    metaShopVitalityDesc: 'Increase maximum HP.',
    metaShopPotionBeltTitle: 'Potion Belt',
    metaShopPotionBeltDesc: 'Carry more potions.',
// === MAIN MENU ===
        gameTitle: 'SpelLike',
        tagline: 'Combine. Conquer. Repeat until death.',
        loadingSequence: [
            "Loading",
            "Loading Dungeons",
            "Loading Bosses",
            "Error",
            "Asking the AI about the error",
            "The AI couldn't answer",
            "Having a meltdown",
            "Help, please",
            "Found the error",
            "I was missing a ;",
            "God, give me patience"
        ],
        loadingPhases: [
            "Initializing UI",
            "Loading assets",
            "Preparing dungeon"
        ],
        // === SHRINE ===
        shrine_title: 'SHRINE',
        shrine_subtitle: 'Choose a quick blessing:',
        shrine_close: 'Close',
        shrine_heal_name: 'Healing',
        shrine_heal_desc: 'Heal 40% of your max HP',
        shrine_gold_name: 'Offering',
        shrine_gold_desc: '+200 gold',
        shrine_potion_name: 'Flasks',
        shrine_potion_desc: '+2 potions',
        btnPlay: 'START GAME',
        // === CAMPFIRE ===
        campfire_title: 'CAMPFIRE',
        campfire_subtitle: 'Take a breath and choose a benefit:',
        campfire_close: 'Close',
        campfire_rest_name: 'Rest',
        campfire_rest_desc: 'Heal 35% of your max HP',
        campfire_sharpen_name: 'Sharpen',
        campfire_sharpen_desc: '+4 permanent damage (run)',
        campfire_refill_name: 'Refill',
        campfire_refill_desc: '+1 potion',

        btnMeta: 'UPGRADES',
        btnSettings: 'SETTINGS',
        btnFeedback: 'FEEDBACK',
        btnQuit: 'QUIT',
        btnUpdates: 'UPDATES',
        updatesTitle: 'UPDATES',
        updatesVersion013: 'v0.1.3 - Early Access',
        updatesNotes013: '✨ [Codex] Visible synergies added to the Codex (properly tracked and displayed).\n🌱 [Seeds] Copyable/shareable seeds (use your seeds or others\' seeds).\n🎯 [Combat] Flashing yellow “CRITIC!” text on critical hits.\n🎁 [Chests] New chest animations + a small visual bonus when opening.\n🌍 [Language] Full English translation + in-game language switch.\n🎯 [Combat] Fire rate cap: max +100% (2x).\n🧩 [Runes] True stacking: once you\'re at max stacks, those runes stop appearing (previously they could still roll).\n🎯 [Balance] Reduced projectile range.\n👹 [Enemies] Adjusted enemy spawns (more consistent encounters).\n🌩️ [Set] STORM SET is now functional (see details in the Codex).\n🛡️ [Feedback] Anti-spam in Feedback (prevents repeated sends) + visual lock feedback.\n✅ [Objectives] Added in-run objectives (more variety per run).',
        updatesVersion012: 'v0.1.2 - Early Access',
        updatesNotes012: '✨ [Meta] New permanent currency: Essence (persists between runs).\n✨ [Meta] Essence is earned at the end of a run: +1 per 2 bosses defeated, +3 per NG+ completed.\n✨ [Meta] New ✨ UPGRADES menu on the start screen to buy permanent upgrades with Essence.\n🛒 [Upgrades] Scalable shop slots (starts lower) up to max 8.\n🔁 [Upgrades] Scalable shop rerolls up to max 4.\n🍀 [Upgrades] Scalable luck up to max 20% + heavy nerf to base epic/legendary spawn.\n💨 [Upgrades] Charge-based dash: up to 3 dashes in a row (regen charges).\n🛒 [Shop] Added health and mana potions (instant use, don\'t take slots).\n♻️ [Shop] Recycler (max 1 use) + 💱 Seller with visible price (💰 +X gold per card).\n🎁 [Chests/Boss] Flow fixes (cancel swap no longer breaks the screen) + runes no longer apply for free: they always take a slot and are shown.\n🎯 [Combat] Fire rate cap: max +100% (2x).\n🧪 [Balance] Void Touch nerfed: 8%→2%, max 2 stacks (description updated).\n🧪 [Balance] Nerfs: Annihilation and Singularity balanced. Vampiric rework: heal 5% max HP per kill (no lifesteal).\n🩹 [Bug] Fixed shot desync (bullets “drift away”).\n🩹 [Bug] Enemies/boss spawning with low HP: scaling fix (on room enter: HP = MaxHP).\n🩹 [QoL] Room clear: after killing all enemies, restore 50% mana. Coins magnetize faster.\n🎨 [Menu] Logo 🔮 replaced with the S (keeps animation) + favicon updated + version/essence text fixes.',
        updatesVersion011: 'v0.1.1 - Early Access',
        updatesNotes011: '✨ [HUD] Fully redesigned interface.\n✨ [Info] New panel (top-left): Biome, Room and Active Events.\n✨ [Items] Right panel with passive items and rarity colors.\n✨ [Minimap] Legend under the minimap (Shop, Boss, Cleared, etc.).\n✨ [Events] Events now display localized names (no internal codes).\n🛡️ [Gameplay] Brief invulnerability when entering rooms (anti-instant damage).\n🧩 [Runes] Clicking to view runes no longer makes the character shoot.\n⚖️ [Economy] Fixed the cost of Empty Runes.\n⚖️ [Economy] Rune prices now scale with rarity.\n🛡️ [Balance] Chain lightning damage nerfed (-40%).\n⚔️ [Difficulty] Infinite Challenge: huge difficulty spike in long runs.\n⚔️ [Difficulty] Activation: after defeating the 3rd Boss.\n⚔️ [Difficulty] Scaling: each extra boss multiplies enemy HP x2 and damage x1.2.\n🐛 [Bug] Save system: collected items no longer disappear on reload.\n🐛 [Bug] Pause: ESC now resumes correctly (no double ESC).\n🐛 [Bug] Biome counter updates correctly after defeating a boss.\n🐛 [Bug] Double rewards: removed the extra screen when entering a new biome.\n🐛 [Bug] Events: no longer show "---" when active.\n🐛 [Bug] More accurate projectile hitboxes.\n🎯 [Boss] Fairer bullet patterns (more space to dodge).\n🛡️ [Feedback] Anti-spam on Feedback (prevents repeated sends).\n✅ [Feedback] If you find any bug, issue, or suggestion, send it through Feedback and I\'ll fix it.',
        
        audioHint: '🔊 Enable music: <b>click</b> or press <b>any key</b>.',
        metaEssence: 'Essence',
        version: 'v0.1.3 Early Access',
        
        // === META UPGRADES ===
        metaTitle: '✨ PERMANENT UPGRADES',
        btnBack: 'BACK',
        rewardTitle: 'REWARDS',
        btnDiscard: 'DISCARD',
        toastSynergy: '⚡ SYNERGY:',
        synergiesNoneTitle: 'No active synergies',
        synergiesNoneDesc: 'Combine runes to activate synergies.',
        codexTabBestiary: 'Bestiary',
        codexTabAchievements: 'Achievements',
        codexTabHistory: 'History',
        codexTabSets: 'Sets',
        codexTabSynergies: 'Synergies',
        codexTabBook: 'Book',
        // === CODEX (Bestiary) ===
        codexEnemiesTitle: 'ENEMIES',
        codexBossesTitle: 'BOSSES',
        codexSelectEntry: 'Select an entry',
        codexTip: 'Tip: Open the Codex with C. Entries unlock the first time you defeat an enemy/boss.',
        codexAdviceLabel: 'Tip',
        codexAdviceEnemy: "Learn its pattern and don't stand still.",
        codexAdviceBoss: 'Save your dash for heavy attacks.',
        codexHpBaseLabel: 'HP Base',
        codexDamageBaseLabel: 'Base Damage',
        codexSpeedLabel: 'Speed',
        codexKills: 'Kills',
        codexLocked: 'Locked',
        hudEnemiesRemaining: '{n} enemies',
        historyFilterPlaceholder: 'filter...',
        historySortDate: 'date',
        historySortNg: 'ng+',
        historySortGold: 'gold',
        historySortKills: 'kills',
        historySortTime: 'time',
        historyClear: 'clear',
        historyRunsLabel: 'Runs',
        historyBestNgLabel: 'Best NG+',
        historyMaxGoldLabel: 'Max Gold',
        historyMaxKillsLabel: 'Max Kills',
        historyBestTimeLabel: 'Best Time',
        historyNoRuns: 'No runs to display.',
        historyDetailTitle: 'History',
        historyDetailHint: 'Play a run—when you die, it will be saved here.',
        codexRequirement: 'Requirement',
        codexBonus: 'Bonus',
        codexReq_barrage: '2+ runes that grant extra projectiles',
        codexReq_efficient_caster: '2+ runes that reduce mana cost',
        codexReq_rapid_fire: '2+ runes that increase fire rate',
        codexReq_sniper_elite: '2+ runes that increase range',
        codexReq_hypersonic: '2+ runes that increase projectile speed',
        codexReq_special: 'Condición especial (auto-detectada en partida)',
        codexSynergyDbMissing: 'No se encontró SynergyDatabase. Asegurate de que js/synergies.js esté cargado.',
        codexNoSynergies: 'No hay sinergias definidas todavía.',
        critPopup: 'CRIT!',

        // === PACT EVENT ===
        pactTitle: '☠️ PACT',
        pactSubtitle: 'Power at a cost:',
        pactReject: 'Decline',
        pactCursedBagTitle: 'Cursed Bag',
        pactCursedBagDesc: '+1 rune slot, -10% max HP',
        pactProfaneSheathTitle: 'Profane Sheath',
        pactProfaneSheathDesc: '+1 active slot, -12% speed',
        pactFuryTitle: 'Fury',
        pactFuryDesc: '+20% damage, -15% max mana',
        
        // === SLOT SELECTION ===
        slotSelectTitle: 'SELECT SAVE SLOT',
        emptySlot: 'Empty',
        newGame: 'New Game',
        
        // === DIFFICULTY ===
        difficultyTitle: 'CHOOSE YOUR DIFFICULTY',
        diffNormal: 'NORMAL',
        diffNormalDesc: 'Standard experience. Recommended for new players.',
        diffNormalPoint1: '✓ Tutorials enabled',
        diffNormalPoint2: '✓ Balanced difficulty',
        diffHard: 'HARD',
        diffHardDesc: 'For experienced players. Better loot, more risk.',
        diffHardPoint1: '• Enemies +50% HP',
        diffHardPoint2: '• Enemies +25% damage',
        diffHardPoint3: '• Chests +1 rarity',
        diffHardLocked: '🔒 Defeat 1 boss on Normal',
        diffDemonic: 'DEMONIC',
        diffDemonicDesc: 'The true challenge. Program your destiny.',
        diffDemonicPoint1: '• Enemies +150% HP',
        diffDemonicPoint2: '• Empty Runes + Forges',
        diffDemonicPoint3: '• No mercy',
        diffDemonicLocked: '🔒 Defeat your first boss',
        seedLabel: '🎲 Seed (optional):',
        seedPlaceholder: 'Leave empty for random',
        negativeEvents: 'Negative events in rooms',
        btnStart: 'START',
        
        // === SETTINGS ===
        settingsTitle: '⚙ SETTINGS',
        tabAudio: '🔊 Audio',
        tabGraphics: '🖥 Graphics',
        tabControls: '🎮 Controls',
        tabLanguage: '🌐 Language',
        volMaster: 'Master Volume',
        volMusic: 'Music',
        volSfx: 'Sound Effects',
        volUi: 'UI / Interface',
        screenMode: 'Screen Mode',
        screenWindowed: 'Windowed',
        screenFullscreen: 'Fullscreen',
        pixelScaling: 'Pixel Scaling',
        pixelPerfect: 'Pixel Perfect',
        pixelStretched: 'Stretched',
        vfxQuality: 'VFX Quality',
        vfxLow: 'Low',
        vfxMedium: 'Medium',
        vfxHigh: 'High',
        optScreenshake: 'Screenshake',
        optParticles: 'Particles',
        optHitflash: 'Hit Flash',
        optSynergiesVisible: 'Synergies always visible',
        optSynergiesHint: 'Show synergies panel without pressing B',
        btnApply: 'APPLY',
        
        // === CONTROLS ===
        ctrlMovement: 'Movement',
        ctrlAim: 'Aim',
        ctrlShoot: 'Shoot',
        ctrlDash: 'Dash',
        ctrlInteract: 'Interact',
        ctrlPotion: 'Use Potion',
        ctrlActive: 'Use Active',
        ctrlActive2: 'Use Active 2 (if unlocked)',
        ctrlInventory: 'Inventory',
        ctrlPause: 'Pause',
        
        // === FEEDBACK ===
        feedbackTitle: '💬 FEEDBACK',
        feedbackHint: 'Use this to report bugs or share ideas. You can copy the text and paste it in the chat.',
        feedbackType: 'Type',
        feedbackBug: 'Bug',
        feedbackSuggestion: 'Suggestion',
        feedbackBalance: 'Balance',
        feedbackOther: 'Other',
        feedbackDetail: 'Details',
        feedbackPlaceholder: 'E.g: Room 4, Golem boss, laser gets stuck... Steps to reproduce: 1) ... 2) ... Expected result: ... Actual result: ...',
        btnSend: 'SEND',
        btnCopy: 'COPY',
        btnClear: 'CLEAR',
        feedbackMailHint: 'If you have photos or videos, please attach them via LINK in the message.',
        feedbackSent: 'Sent. Thank you for contributing!',
        feedbackCooldown: 'Please wait {s}s before sending again.',
        feedbackCopied: 'Copied to clipboard.',
        
        // === HUD ===
        hudLife: 'LIFE',
        hudMana: '💧 MANA',
        hudBiome: 'Biome',
        hudRoom: 'Room',
        setBonus: 'SET BONUS',
        hudEvent: 'Event',
        hudNone: 'None',
        hudSetBonus: 'Set Bonus',
        hudObjectives: 'OBJECTIVES',
        hudSynergies: 'SYNERGIES',
        hudSynergiesHint: 'Press B to toggle',
        hudItems: 'ITEMS',
        
        // === MINIMAP ===
        mapCompleted: 'Completed',
        mapIncomplete: 'Incomplete',
        mapShop: 'Shop',
        mapMiniboss: 'MiniBoss',
        mapBoss: 'Boss',
        
        // === PAUSE MENU ===
        pauseTitle: '⏸ PAUSED',
        btnResume: '▶ RESUME',
        btnStats: '📊 STATISTICS',
        btnCodex: '📜 CODEX',
        btnPauseSettings: '⚙ SETTINGS',
        btnAbandon: '💀 ABANDON RUN',
        
        // === LANGUAGE SELECTOR ===
        langSpanish: 'Español',
        langEnglish: 'English',
        langRestart: 'Page will reload',
        
        // === GAME MESSAGES ===
        msgRoomCleared: 'Room cleared!',
        msgBossDefeated: 'Boss defeated!',
        msgLevelUp: 'LEVEL UP!',
        msgGameOver: 'GAME OVER',
        msgVictory: 'VICTORY!',
        msgPaused: 'PAUSED',
        
        // === SHOP ===
        shopTitle: 'SHOP',
        shopBlackmarket: 'BLACK MARKET',
        shopReroll: 'Reroll',
        shopRecycle: 'Recycle',
        shopSell: 'Sell',
        shopSellHint: 'Choose a Rune or Active to sell for gold.',
        shopRecycleHint: 'Choose a Rune or Active to recycle: you get another of the same rarity.',
        shopBuy: 'BUY',
        metaLevel: 'Level',
        shopClose: 'Close',
        shopGold: 'Gold',
        metaNotAvailable: 'Meta unavailable.',
        codexEnemiesTitle: 'ENEMIES',
        shopFull: 'Inventory full',
        unlockBossNormal: 'Defeat 1 boss on Normal',
        unlockBossHard: 'Defeat 1 boss on Hard',
        shopNoGold: 'Insufficient gold',
        shopSold: 'Sold!',
        shopBought: 'Bought!',
        lockedUpgradeShop: 'Locked (Upgrade in shop)',
        shopRecycled: 'Recycled!',

        // === EXTRA UI KEYS (added) ===
        campfireTitle: '🔥 CAMPFIRE',
        campfireSubtitle: 'Take a breath and choose a boon:',
        codexSelectEntry: 'Select an entry',
        codexTip: 'Tip: Open the Codex with C. Entries unlock the first time you defeat that enemy/boss.',
        enemiesRemainingLabel: 'enemies',

    
        // --- Added/Fixed UI keys (shop/codex/stats/loot) ---
        shopSub: 'Pick one:',
        shopGoldLabel: 'Gold:',
        shopReroll: 'Reroll ({n})',
        shopRecycle: 'Recycle',
        shopSell: 'Sell',
        shopSellTitle: 'Sell',
        shopSellDesc: 'Choose a rune or active to sell for gold.',
        shopNoSellables: "You don't have runes/actives to sell.",
        shopRecycleTitle: 'Recycle',
        shopRecycleDesc: 'Choose a rune or active to recycle; you get another of the same rarity.',
        shopNoRecyclables: "You don't have runes/actives to recycle.",
        btnBack: 'Back',
        btnClose: 'Close',
        btnCancel: 'CANCEL',
        runeSwapTitle: 'SWAP RUNE',
        runeSwapNew: 'New:',
        runeSwapChoose: 'Choose a rune to replace:',

        lootChooseTitle: 'Choose your reward',
        lootRune: 'Rune',
        lootItem: 'Item',
        lootOr: 'OR',
        lootDiscardBoth: 'Discard both',
        promptAdvance: '[E] Advance',

        statsTitle: 'Run Stats',
        statBiome: 'Biome',
        statRoom: 'Room',
        statGold: 'Gold',
        statTime: 'Time',
        statKills: 'Kills',
        statDmgDealt: 'Damage Dealt',
        statDmgTaken: 'Damage Taken',
        statRoomsCleared: 'Rooms Cleared',
        statBiomesCleared: 'Biomes Cleared',
        statsRunesEquipped: 'Runes Equipped',

        codexSetLabel: 'Set:',
        codexBonus2: '2-piece bonus:',
        codexBonus3: '3-piece bonus:',

        // Set: Storm
        setStormName: 'Storm',
        setStormBonus2Desc: '+15% projectile speed',
        setStormBonus3Desc: 'Dash leaves a lightning shot',
        codexRequirement: 'Requirement',
        codexBonusLabel: "Bonus:",

        eventShrine: 'SHRINE',
        eventCampfire: 'CAMPFIRE',
        eventPact: 'PACT',
        eventForge: 'FORGE',
}
};

// === RUNES DATABASE TRANSLATIONS ===
Translations.runesES = {
    // COMMON
    spark: { name: 'Chispa', desc: '+3 daño base a todos tus proyectiles' },
    velocity: { name: 'Velocidad', desc: '+20% velocidad de proyectil' },
    dual_cast: { name: 'Doble Lanzamiento', desc: 'Dispara 1 proyectil adicional' },
    ember: { name: 'Ascua', desc: 'Proyectiles aplican Quemadura (5 daño/seg)' },
    frost: { name: 'Escarcha', desc: 'Proyectiles ralentizan enemigos' },
    venom: { name: 'Veneno', desc: 'Proyectiles aplican Veneno (4 daño/seg)' },
    light: { name: 'Luz', desc: '+5% rango de proyectil' },
    minor_arcana: { name: 'Arcana Menor', desc: '+2 maná máximo' },
    quick_hands: { name: 'Manos Rápidas', desc: '+10% velocidad de disparo' },
    focus: { name: 'Enfoque', desc: '+5% daño' },
    mana_sip: { name: 'Sorbo de Maná', desc: '+15% regen de maná' },
    reach: { name: 'Alcance', desc: '+8% rango de proyectil' },
    twin_spark: { name: 'Chispas Gemelas', desc: '+1 daño y +10% velocidad proyectil' },
    frugal: { name: 'Frugal', desc: '-0.5 costo de mana por disparo, -5% daño' },
    arcane_edge: { name: 'Filo Arcano', desc: '+2 daño contra enemigos elite' },
    glimmer: { name: 'Destello', desc: '+1 maná máximo y +5% daño' },
    
    // RARE
    power_surge: { name: 'Descarga de Poder', desc: '+8 daño base' },
    triple_cast: { name: 'Triple Lanzamiento', desc: 'Dispara 2 proyectiles adicionales' },
    piercing: { name: 'Perforación', desc: 'Proyectiles atraviesan 2 enemigos' },
    vampiric: { name: 'Vampírico', desc: 'Cura 5% de tu vida máxima al matar un enemigo' },
    chain: { name: 'Cadena', desc: 'Proyectiles saltan a 2 enemigos cercanos' },
    explosion: { name: 'Explosión', desc: 'Proyectiles explotan al impactar' },
    mana_flow: { name: 'Flujo de Maná', desc: '+50% regeneración de maná' },
    amplify: { name: 'Amplificar', desc: '+15% a todo el daño' },
    sniper: { name: 'Francotirador', desc: '+12% rango de proyectil' },
    overpressure: { name: 'Sobrepresión', desc: '+35% velocidad de proyectil' },
    cold_bite: { name: 'Mordida Fría', desc: 'Slow más fuerte' },
    toxic_bite: { name: 'Mordida Tóxica', desc: 'Poison más consistente' },
    efficient_cast: { name: 'Lanzamiento Eficiente', desc: '-1 costo de mana por disparo, -10% daño' },
    arcane_rhythm: { name: 'Ritmo Arcano', desc: '+20% velocidad de disparo' },
    glass_cannon: { name: 'Cañón de Vidrio', desc: '+35% daño, recibes +10% daño' },
    
    // EPIC
    arcane_fury: { name: 'Furia Arcana', desc: '+15 daño y +1 proyectil extra' },
    hyper_pierce: { name: 'Hiper Perforación', desc: 'Proyectiles atraviesan infinitos enemigos' },
    critical: { name: 'Crítico', desc: '25% chance de daño x3' },
    homing: { name: 'Teledirigido', desc: 'Proyectiles persiguen enemigos' },
    split: { name: 'Dividir', desc: 'Proyectiles se dividen en 3 al impactar' },
    overload: { name: 'Sobrecarga', desc: '+50% daño pero cuesta +10 maná' },
    stormcaster: { name: 'Tormenta', desc: '+2 proyectiles y +20% velocidad' },
    volatile_core: { name: 'Núcleo Volátil', desc: 'Explosión más grande' },
    chain_master: { name: 'Maestro de Cadena', desc: 'Cadena a 4 enemigos' },
    blood_price: { name: 'Precio de Sangre', desc: '+60% daño, pero +2 costo de maná' },
    deep_freeze: { name: 'Congelación', desc: 'Slow + control' },
    poison_mist: { name: 'Nube Tóxica', desc: 'Poison + daño base' },
    
    // LEGENDARY
    annihilation: { name: 'Aniquilación', desc: '+15 daño, +1 proyectil, explosión' },
    void_touch: { name: 'Toque del Vacío', desc: 'Quita 2% de HP máxima del enemigo por hit (máx 2 stacks)' },
    infinity: { name: 'Infinito', desc: '+20% rango de proyectil' },
    godslayer: { name: 'Matadios', desc: 'Daño x2 contra jefes (max 1)' },
    time_warp: { name: 'Distorsión Temporal', desc: 'Al matar, disparás 3x más rápido por 5s' },
    singularity: { name: 'Singularidad', desc: '+2 proyectiles, +15% daño' },
    executioner: { name: 'Verdugo', desc: '+15 daño y 35% crit x3' },
    archmage: { name: 'Archimago', desc: '+8 maná, +60% regen, +20% fire rate' },
    
    // SPECIAL
    empty_rune: { name: 'Runa Vacía', desc: 'No hace nada... hasta ser programada en una Forja-Terminal.' },
};

Translations.runesEN = {
    // COMMON
    spark: { name: 'Spark', desc: '+3 base damage to all your projectiles' },
    velocity: { name: 'Velocity', desc: '+20% projectile speed' },
    dual_cast: { name: 'Dual Cast', desc: 'Fire 1 additional projectile' },
    ember: { name: 'Ember', desc: 'Projectiles apply Burn (5 damage/sec)' },
    frost: { name: 'Frost', desc: 'Projectiles slow enemies' },
    venom: { name: 'Venom', desc: 'Projectiles apply Poison (4 damage/sec)' },
    light: { name: 'Light', desc: '+5% projectile range' },
    minor_arcana: { name: 'Minor Arcana', desc: '+2 max mana' },
    quick_hands: { name: 'Quick Hands', desc: '+10% fire rate' },
    focus: { name: 'Focus', desc: '+5% damage' },
    mana_sip: { name: 'Mana Sip', desc: '+15% mana regen' },
    reach: { name: 'Reach', desc: '+8% projectile range' },
    twin_spark: { name: 'Twin Sparks', desc: '+1 damage and +10% projectile speed' },
    frugal: { name: 'Frugal', desc: '-0.5 mana cost per shot, -5% damage' },
    arcane_edge: { name: 'Arcane Edge', desc: '+2 damage against elite enemies' },
    glimmer: { name: 'Glimmer', desc: '+1 max mana and +5% damage' },
    
    // RARE
    power_surge: { name: 'Power Surge', desc: '+8 base damage' },
    triple_cast: { name: 'Triple Cast', desc: 'Fire 2 additional projectiles' },
    piercing: { name: 'Piercing', desc: 'Projectiles pierce through 2 enemies' },
    vampiric: { name: 'Vampiric', desc: 'Heal 5% of your max life on enemy kill' },
    chain: { name: 'Chain', desc: 'Projectiles chain to 2 nearby enemies' },
    explosion: { name: 'Explosion', desc: 'Projectiles explode on impact' },
    mana_flow: { name: 'Mana Flow', desc: '+50% mana regeneration' },
    amplify: { name: 'Amplify', desc: '+15% to all damage' },
    sniper: { name: 'Sniper', desc: '+12% projectile range' },
    overpressure: { name: 'Overpressure', desc: '+35% projectile speed' },
    cold_bite: { name: 'Cold Bite', desc: 'Stronger slow effect' },
    toxic_bite: { name: 'Toxic Bite', desc: 'More consistent poison' },
    efficient_cast: { name: 'Efficient Cast', desc: '-1 mana cost per shot, -10% damage' },
    arcane_rhythm: { name: 'Arcane Rhythm', desc: '+20% fire rate' },
    glass_cannon: { name: 'Glass Cannon', desc: '+35% damage, take +10% damage' },
    
    // EPIC
    arcane_fury: { name: 'Arcane Fury', desc: '+15 damage and +1 extra projectile' },
    hyper_pierce: { name: 'Hyper Pierce', desc: 'Projectiles pierce infinite enemies' },
    critical: { name: 'Critical', desc: '25% chance for x3 damage' },
    homing: { name: 'Homing', desc: 'Projectiles seek enemies' },
    split: { name: 'Split', desc: 'Projectiles split into 3 on impact' },
    overload: { name: 'Overload', desc: '+50% damage but costs +10 mana' },
    stormcaster: { name: 'Stormcaster', desc: '+2 projectiles and +20% speed' },
    volatile_core: { name: 'Volatile Core', desc: 'Larger explosion' },
    chain_master: { name: 'Chain Master', desc: 'Chain to 4 enemies' },
    blood_price: { name: 'Blood Price', desc: '+60% damage, but +2 mana cost' },
    deep_freeze: { name: 'Deep Freeze', desc: 'Slow + control' },
    poison_mist: { name: 'Poison Mist', desc: 'Poison + base damage' },
    
    // LEGENDARY
    annihilation: { name: 'Annihilation', desc: '+15 damage, +1 projectile, explosion' },
    void_touch: { name: 'Void Touch', desc: 'Remove 2% of enemy max HP per hit (max 2 stacks)' },
    infinity: { name: 'Infinity', desc: '+20% projectile range' },
    godslayer: { name: 'Godslayer', desc: 'x2 damage against bosses (max 1)' },
    time_warp: { name: 'Time Warp', desc: 'On kill, fire 3x faster for 5s' },
    singularity: { name: 'Singularity', desc: '+2 projectiles, +15% damage' },
    executioner: { name: 'Executioner', desc: '+15 damage and 35% crit x3' },
    archmage: { name: 'Archmage', desc: '+8 mana, +60% regen, +20% fire rate' },
    
    // SPECIAL
    empty_rune: { name: 'Empty Rune', desc: 'Does nothing... until programmed at a Forge Terminal.' },
};

// === ITEMS DATABASE TRANSLATIONS ===
Translations.itemsES = {
    small_potion: { name: 'Poción Pequeña', desc: 'Cura 20 HP (instantáneo)' },
    med_potion: { name: 'Poción Mediana', desc: 'Restaura 50 HP' },
    large_potion: { name: 'Poción Grande', desc: 'Restaura 100 HP' },
    elixir: { name: 'Elixir de Vida', desc: 'Restaura toda tu HP' },
    mana_potion: { name: 'Poción de Maná', desc: 'Restaura 40 Maná (instantáneo)' },
    arcane_crown: { name: 'Corona Arcana', desc: '+20 daño permanente' },
    dragon_heart: { name: 'Corazón de Dragón', desc: '+100 HP Máxima' },
    void_boots: { name: 'Botas del Vacío', desc: '+60 velocidad permanente' },
    heart_container: { name: 'Contenedor de Corazón', desc: '+20 HP Máxima' },
    mega_heart: { name: 'Corazón Dorado', desc: '+50 HP Máxima' },
    potion_refill: { name: 'Recarga de Pociones', desc: '+2 Pociones' },
    gold_bag: { name: 'Bolsa de Oro', desc: '+50 Oro' },
    treasure: { name: 'Tesoro', desc: '+200 Oro' },
    royal_treasure: { name: 'Tesoro Real', desc: '+500 Oro' },
    rune_pouch: { name: 'Bolsa de Runas', desc: '+1 slot de runas (permanente)' },
    active_bandolier: { name: 'Funda de Reliquias', desc: '+1 slot de activo (permanente)' },
    blink_stone: { name: 'Piedra de Blink', desc: 'Teletransporta hacia donde apuntas. [F]' },
    smoke_bomb: { name: 'Bomba de Humo', desc: '1.2s de invulnerabilidad. [F]' },
    healing_totem: { name: 'Totem de Curación', desc: 'Cura 20 HP (2 veces por sala). [F]' },
    mana_orb: { name: 'Orbe de Maná', desc: '+15 Maná Máx.' },
    mana_tome: { name: 'Tomo de Maná', desc: '+30 Maná Máx.' },
    mana_font: { name: 'Fuente Arcana', desc: '+60% regen de maná' },
    mana_forged: { name: 'Cristal Forjado', desc: '-1 costo de maná por disparo' },
    spell_focus: { name: 'Foco de Hechizo', desc: '+15% velocidad de disparo' },
    arcane_metronome: { name: 'Metrónomo Arcano', desc: '+30% velocidad de disparo' },
    long_barrel: { name: 'Conducto Largo', desc: '+20% rango de proyectil' },
    eagle_eye: { name: 'Ojo de Águila', desc: '+40% rango de proyectil' },
    wind_core: { name: 'Núcleo de Viento', desc: '+20% velocidad de proyectil' },
    storm_core: { name: 'Núcleo de Tormenta', desc: '+45% velocidad de proyectil' },
    storm_ring: { name: 'Anillo de Tormenta', desc: 'Pieza del Set Tormenta.' },
    storm_cloak: { name: 'Capa de Tormenta', desc: 'Pieza del Set Tormenta.' },
    storm_nucleus: { name: 'Núcleo de Tormenta', desc: 'Pieza del Set Tormenta.' },
    iron_skin: { name: 'Piel de Hierro', desc: '+40 HP Máx.' },
    ruby_focus: { name: 'Foco Rubí', desc: '+12 daño permanente' },
    obsidian_edge: { name: 'Borde Obsidiana', desc: '+6 daño permanente' },
    swift_boots: { name: 'Botas de Prisa', desc: '+30 velocidad permanente' },
    swift_cloak: { name: 'Capa Veloz', desc: '+55 velocidad permanente' },
    alchemist_kit: { name: 'Kit de Alquimista', desc: '+3 pociones' },
    potion_belt: { name: 'Cinturón de Pociones', desc: '+5 pociones' },
    mana_battery: { name: 'Batería Arcana', desc: '+20 Maná Máx.' },
    ether_conduit: { name: 'Conducto Etéreo', desc: '+25% velocidad de proyectil' },
    astral_compass: { name: 'Brújula Astral', desc: '+25% rango de proyectil' },
    spell_sandglass: { name: 'Reloj de Arena', desc: '+20% velocidad de disparo' },
    caster_gloves: { name: 'Guantes del Hechicero', desc: '+10% velocidad de disparo' },
    coin_charm: { name: 'Amuleto de Monedas', desc: '+150 oro' },
};

Translations.itemsEN = {
    small_potion: { name: 'Small Potion', desc: 'Heals 20 HP (instant)' },
    med_potion: { name: 'Medium Potion', desc: 'Restores 50 HP' },
    large_potion: { name: 'Large Potion', desc: 'Restores 100 HP' },
    elixir: { name: 'Elixir of Life', desc: 'Restores all HP' },
    mana_potion: { name: 'Mana Potion', desc: 'Restores 40 Mana (instant)' },
    arcane_crown: { name: 'Arcane Crown', desc: '+20 permanent damage' },
    dragon_heart: { name: 'Dragon Heart', desc: '+100 Max HP' },
    void_boots: { name: 'Void Boots', desc: '+60 permanent speed' },
    heart_container: { name: 'Heart Container', desc: '+20 Max HP' },
    mega_heart: { name: 'Golden Heart', desc: '+50 Max HP' },
    potion_refill: { name: 'Potion Refill', desc: '+2 Potions' },
    gold_bag: { name: 'Gold Bag', desc: '+50 Gold' },
    treasure: { name: 'Treasure', desc: '+200 Gold' },
    royal_treasure: { name: 'Royal Treasure', desc: '+500 Gold' },
    rune_pouch: { name: 'Rune Pouch', desc: '+1 rune slot (permanent)' },
    active_bandolier: { name: 'Relic Bandolier', desc: '+1 active slot (permanent)' },
    blink_stone: { name: 'Blink Stone', desc: 'Teleport to where you aim. [F]' },
    smoke_bomb: { name: 'Smoke Bomb', desc: '1.2s of invulnerability. [F]' },
    healing_totem: { name: 'Healing Totem', desc: 'Heals 20 HP (2 times per room). [F]' },
    mana_orb: { name: 'Mana Orb', desc: '+15 Max Mana' },
    mana_tome: { name: 'Mana Tome', desc: '+30 Max Mana' },
    mana_font: { name: 'Arcane Font', desc: '+60% mana regen' },
    mana_forged: { name: 'Forged Crystal', desc: '-1 mana cost per shot' },
    spell_focus: { name: 'Spell Focus', desc: '+15% fire rate' },
    arcane_metronome: { name: 'Arcane Metronome', desc: '+30% fire rate' },
    long_barrel: { name: 'Long Barrel', desc: '+20% projectile range' },
    eagle_eye: { name: 'Eagle Eye', desc: '+40% projectile range' },
    wind_core: { name: 'Wind Core', desc: '+20% projectile speed' },
    storm_core: { name: 'Storm Core', desc: '+45% projectile speed' },
    storm_ring: { name: 'Storm Ring', desc: 'Storm Set piece.' },
    storm_cloak: { name: 'Storm Cloak', desc: 'Storm Set piece.' },
    storm_nucleus: { name: 'Storm Nucleus', desc: 'Storm Set piece.' },
    iron_skin: { name: 'Iron Skin', desc: '+40 Max HP' },
    ruby_focus: { name: 'Ruby Focus', desc: '+12 permanent damage' },
    obsidian_edge: { name: 'Obsidian Edge', desc: '+6 permanent damage' },
    swift_boots: { name: 'Swift Boots', desc: '+30 permanent speed' },
    swift_cloak: { name: 'Swift Cloak', desc: '+55 permanent speed' },
    alchemist_kit: { name: 'Alchemist Kit', desc: '+3 potions' },
    potion_belt: { name: 'Potion Belt', desc: '+5 potions' },
    mana_battery: { name: 'Arcane Battery', desc: '+20 Max Mana' },
    ether_conduit: { name: 'Ether Conduit', desc: '+25% projectile speed' },
    astral_compass: { name: 'Astral Compass', desc: '+25% projectile range' },
    spell_sandglass: { name: 'Spell Hourglass', desc: '+20% fire rate' },
    caster_gloves: { name: 'Caster Gloves', desc: '+10% fire rate' },
    coin_charm: { name: 'Coin Charm', desc: '+150 gold' },
};

// === SYNERGIES TRANSLATIONS ===
Translations.synergiesES = {
    flame_burst: { name: 'Estallido de Llamas', desc: '+8% daño con efectos de fuego' },
    frozen_shatter: { name: 'Congelación Explosiva', desc: '+10% daño y +15 radio de explosión' },
    toxic_burst: { name: 'Nube Tóxica', desc: '+6% daño de veneno' },
    elemental_master: { name: 'Maestro Elemental', desc: '+12% daño con 3+ elementos' },
    barrage: { name: 'Andanada', desc: '+5% daño por proyectil extra' },
    chain_reaction: { name: 'Reacción en Cadena', desc: '+1 chain adicional' },
    piercing_volley: { name: 'Salva Perforante', desc: '+2 piercing' },
    assassin: { name: 'Asesino', desc: '+4% crit chance' },
    glass_cannon_synergy: { name: 'Cañón de Cristal', desc: '+6% daño crítico' },
    mana_battery: { name: 'Batería Arcana', desc: '+25% regen de maná' },
    efficient_caster: { name: 'Lanzador Eficiente', desc: '-0.5 costo de maná' },
    rapid_fire: { name: 'Fuego Rápido', desc: '+15% velocidad de disparo' },
    blood_mage: { name: 'Mago de Sangre', desc: '+3% vida por kill' },
    sniper_elite: { name: 'Francotirador Elite', desc: '+10% rango de proyectil' },
    hypersonic: { name: 'Hipersónico', desc: '+20% velocidad de proyectil' },
};

Translations.synergiesEN = {
    flame_burst: { name: 'Flame Burst', desc: '+8% fire damage' },
    frozen_shatter: { name: 'Frozen Shatter', desc: '+10% damage and +15 explosion radius' },
    toxic_burst: { name: 'Toxic Cloud', desc: '+6% poison damage' },
    elemental_master: { name: 'Elemental Master', desc: '+12% damage with 3+ elements' },
    barrage: { name: 'Barrage', desc: '+5% damage per extra projectile' },
    chain_reaction: { name: 'Chain Reaction', desc: '+1 additional chain' },
    piercing_volley: { name: 'Piercing Volley', desc: '+2 piercing' },
    assassin: { name: 'Assassin', desc: '+4% crit chance' },
    glass_cannon_synergy: { name: 'Crystal Cannon', desc: '+6% critical damage' },
    mana_battery: { name: 'Arcane Battery', desc: '+25% mana regen' },
    efficient_caster: { name: 'Efficient Caster', desc: '-0.5 mana cost' },
    rapid_fire: { name: 'Rapid Fire', desc: '+15% fire rate' },
    blood_mage: { name: 'Blood Mage', desc: '+3% life per kill' },
    sniper_elite: { name: 'Elite Sniper', desc: '+10% projectile range' },
    hypersonic: { name: 'Hypersonic', desc: '+20% projectile speed' },
};

// === ACHIEVEMENTS / OBJECTIVES (localized) ===
Translations.objectivesES = {
    first_blood: { name: 'Primera Sangre', desc: 'Derrota a tu primer enemigo.' },
    exterminator_100: { name: 'Exterminador', desc: 'Derrota 100 enemigos (acumulado).' },
    slayer_500: { name: 'Segador', desc: 'Derrota 500 enemigos (acumulado).' },
    first_boss: { name: 'Cazajefes', desc: 'Derrota a tu primer jefe.' },
    cataclysm_down: { name: 'Fin del Mundo', desc: 'Derrota a EL CATACLISMO.' },
    ngplus_1: { name: 'New Game Plus', desc: 'Entra a NG+ por primera vez.' },
    ngplus_5: { name: 'Bucle Infinito', desc: 'Alcanza NG+5.' },
    rich_5000: { name: 'Acaparador', desc: 'Recolecta 5000 de oro total (acumulado).' },
    rune_slot_plus: { name: 'Más Espacio', desc: 'Compra una Bolsa de Runas (+1 slot).' },
    active_slot_plus: { name: 'Doble Reliquia', desc: 'Compra una Funda de Reliquias (+1 slot activo).' },
    biomes_3: { name: 'Explorador', desc: 'Completa 3 biomas en una sola run.' },
    no_potions_biome: { name: 'A Sangre Fría', desc: 'Completa 1 bioma sin usar pociones (en una run).' },
};
Translations.objectivesEN = {
    first_blood: { name: 'First Blood', desc: 'Defeat your first enemy.' },
    exterminator_100: { name: 'Exterminator', desc: 'Defeat 100 enemies (lifetime).' },
    slayer_500: { name: 'Reaper', desc: 'Defeat 500 enemies (lifetime).' },
    first_boss: { name: 'Boss Hunter', desc: 'Defeat your first boss.' },
    cataclysm_down: { name: 'End of the World', desc: 'Defeat THE CATACLYSM.' },
    ngplus_1: { name: 'New Game Plus', desc: 'Enter NG+ for the first time.' },
    ngplus_5: { name: 'Infinite Loop', desc: 'Reach NG+5.' },
    rich_5000: { name: 'Hoarder', desc: 'Collect 5000 total gold (lifetime).' },
    rune_slot_plus: { name: 'More Space', desc: 'Buy a Rune Bag (+1 slot).' },
    active_slot_plus: { name: 'Double Relic', desc: 'Buy a Relic Sheath (+1 active slot).' },
    biomes_3: { name: 'Explorer', desc: 'Clear 3 biomes in a single run.' },
    no_potions_biome: { name: 'Cold Blooded', desc: 'Clear 1 biome without using potions (in one run).' },
};

// === RUN MUTATORS / CURSES (localized) ===
Translations.mutatorsES = {
    stable: { name: 'Estable', desc: 'Sin cambios raros.' },
    brutal: { name: 'Brutal', desc: 'Enemigos +20% HP/Daño.' },
    haste: { name: 'Acelerado', desc: 'Enemigos +25% velocidad.' },
    swarm: { name: 'Enjambre', desc: '+35% cantidad de enemigos.' },
    volatile: { name: 'Volátil', desc: 'Enemigos explotan al morir.' },
};
Translations.mutatorsEN = {
    stable: { name: 'Stable', desc: 'No weird changes.' },
    brutal: { name: 'Brutal', desc: 'Enemies +20% HP/Damage.' },
    haste: { name: 'Hasty', desc: 'Enemies +25% speed.' },
    swarm: { name: 'Swarm', desc: '+35% enemy count.' },
    volatile: { name: 'Volatile', desc: 'Enemies explode on death.' },
};
Translations.cursesES = {
    fragile: { name: 'Frágil', desc: '-10% HP máximo' },
    wrath: { name: 'Ira', desc: 'Enemigos +20% HP/Daño' },
    swarm: { name: 'Enjambre', desc: '+25% enemigos por sala' },
    sniper: { name: 'Balística', desc: 'Proyectiles enemigos +25% velocidad' },
};
Translations.cursesEN = {
    fragile: { name: 'Fragile', desc: '-10% max HP' },
    wrath: { name: 'Wrath', desc: 'Enemies +20% HP/Damage' },
    swarm: { name: 'Swarm', desc: '+25% enemies per room' },
    sniper: { name: 'Ballistics', desc: 'Enemy projectiles +25% speed' },
};

// === NG+ PACT BLESSINGS (localized) ===
Translations.blessingsES = {
    power: { name: 'Poder', desc: '+18% daño' },
    swift: { name: 'Celeridad', desc: '+8% velocidad' },
    sustain: { name: 'Vitalidad', desc: '+20 HP Máx.' },
    rich: { name: 'Oro Fácil', desc: '+120 oro inmediato' },
};
Translations.blessingsEN = {
    power: { name: 'Power', desc: '+18% damage' },
    swift: { name: 'Swiftness', desc: '+8% speed' },
    sustain: { name: 'Vitality', desc: '+20 Max HP' },
    rich: { name: 'Easy Gold', desc: '+120 gold instantly' },
};

// === CODEX LORE (localized) ===
Translations.enemyLoreES = {
    goblin: { name: 'Goblin', icon: '🟢', desc: 'Rápidos y molestos. Te presionan en grupo.' },
    skeleton: { name: 'Esqueleto', icon: '💀', desc: 'Resistentes. Pegan más fuerte de lo que parece.' },
    slime: { name: 'Slime', icon: '🟩', desc: 'Lentos pero persistentes. Controlan espacio.' },
    archer: { name: 'Arquero', icon: '🏹', desc: 'Se mantiene lejos y te castiga si te quedás quieto.' },
    charger: { name: 'Cargador', icon: '🐗', desc: 'Embiste con fuerza. Castiga errores y mala posición.' },
    mage: { name: 'Mago', icon: '🧙', desc: 'Teleporta y dispara salvas. Prioridad alta.' },
    bomber: { name: 'Bombardero', icon: '💥', desc: 'Si lo dejás llegar, explota. No lo subestimes.' },
    summoner: { name: 'Invocador', icon: '🌀', desc: 'Crea aliados. Si lo ignorás, la sala se descontrola.' },
};
Translations.enemyLoreEN = {
    goblin: { name: 'Goblin', icon: '🟢', desc: 'Fast and annoying. They pressure you in packs.' },
    skeleton: { name: 'Skeleton', icon: '💀', desc: 'Tough. Hits harder than it looks.' },
    slime: { name: 'Slime', icon: '🟩', desc: 'Slow but persistent. Controls space.' },
    archer: { name: 'Archer', icon: '🏹', desc: 'Keeps distance and punishes you if you stand still.' },
    charger: { name: 'Charger', icon: '🐗', desc: 'Slams in hard. Punishes mistakes and bad positioning.' },
    mage: { name: 'Mage', icon: '🧙', desc: 'Teleports and fires volleys. High priority target.' },
    bomber: { name: 'Bomber', icon: '💥', desc: 'If it reaches you, it explodes. Don’t underestimate it.' },
    summoner: { name: 'Summoner', icon: '🌀', desc: 'Creates allies. Ignore it and the room spirals out of control.' },
};
Translations.bossLoreES = {
    guardian: { name: 'El Guardián', icon: '🗿', desc: 'Prueba de fuerza. Alterna presión melee y ranged.' },
    demon_lord: { name: 'Señor Demonio', icon: '😈', desc: 'Agresivo y caótico. Controla el combate.' },
    skeleton_king: { name: 'Rey Esqueleto', icon: '👑', desc: 'Convoca esbirros. Mantener el ritmo es clave.' },
    spider_queen: { name: 'Reina Araña', icon: '🕷️', desc: 'Velocidad y patrones. Castiga la falta de movilidad.' },
    golem: { name: 'Gólem Antiguo', icon: '🪨', desc: 'Tanque brutal. Leer telegraphs te salva.' },
    hydra: { name: 'Hidra', icon: '🐍', desc: 'Ataques en ráfaga. No te quedes encerrado.' },
    fire_lord: { name: 'Señor del Fuego', icon: '🔥', desc: 'Fuego por todos lados. Manejá el espacio.' },
    final_boss: { name: 'EL CATACLISMO', icon: '🌌', desc: 'El final… y el inicio del NG+. Fases y patrones letales.' },
};
Translations.bossLoreEN = {
    guardian: { name: 'The Guardian', icon: '🗿', desc: 'A test of strength. Alternates melee and ranged pressure.' },
    demon_lord: { name: 'Demon Lord', icon: '😈', desc: 'Aggressive and chaotic. Controls the fight.' },
    skeleton_king: { name: 'Skeleton King', icon: '👑', desc: 'Summons minions. Keeping tempo is key.' },
    spider_queen: { name: 'Spider Queen', icon: '🕷️', desc: 'Speed and patterns. Punishes low mobility.' },
    golem: { name: 'Ancient Golem', icon: '🪨', desc: 'A brutal tank. Reading telegraphs saves you.' },
    hydra: { name: 'Hydra', icon: '🐍', desc: 'Burst attacks. Don’t get boxed in.' },
    fire_lord: { name: 'Fire Lord', icon: '🔥', desc: 'Fire everywhere. Manage your space.' },
    final_boss: { name: 'THE CATACLYSM', icon: '🌌', desc: 'The end… and the start of NG+. Deadly phases and patterns.' },
};


// === BIOMES TRANSLATIONS ===
Translations.biomesES = {
    ancient_ruins: 'Ruinas Antiguas',
    crystal_caves: 'Cavernas de Cristal',
    shadow_temple: 'Templo de las Sombras',
    fire_realm: 'Reino de Fuego',
    ice_fortress: 'Fortaleza de Hielo',
    void_dimension: 'Dimensión del Vacío',
    corrupted_forest: 'Bosque Corrupto',
    celestial_tower: 'Torre Celestial',
    abyss: 'Abismo',
    netherworld: 'Inframundo',
    astral_plane: 'Plano Astral',
    oblivion: 'Olvido',
};

Translations.biomesEN = {
    ancient_ruins: 'Ancient Ruins',
    crystal_caves: 'Crystal Caves',
    shadow_temple: 'Shadow Temple',
    fire_realm: 'Fire Realm',
    ice_fortress: 'Ice Fortress',
    void_dimension: 'Void Dimension',
    corrupted_forest: 'Corrupted Forest',
    celestial_tower: 'Celestial Tower',
    abyss: 'Abyss',
    netherworld: 'Netherworld',
    astral_plane: 'Astral Plane',
    oblivion: 'Oblivion',
};

// === EVENTS TRANSLATIONS ===
Translations.eventsES = {
    berserker: 'Berserker',
    glass_armor: 'Armadura de Vidrio',
    titan_blood: 'Sangre de Titán',
    fragile: 'Frágil',
    haste: 'Prisa',
    sluggish: 'Lento',
    enriched: 'Enriquecido',
    poverty: 'Pobreza',
    lucky: 'Suerte',
    cursed: 'Maldito',
    elite_wave: 'Oleada de Elite',
    treasure_hunt: 'Caza de Tesoro',
    mana_drought: 'Sequía de Maná',
    mana_overflow: 'Sobreflujo de Maná',
};

Translations.eventsEN = {
    berserker: 'Berserker',
    glass_armor: 'Glass Armor',
    titan_blood: 'Titan Blood',
    fragile: 'Fragile',
    haste: 'Haste',
    sluggish: 'Sluggish',
    enriched: 'Enriched',
    poverty: 'Poverty',
    lucky: 'Lucky',
    cursed: 'Cursed',
    elite_wave: 'Elite Wave',
    treasure_hunt: 'Treasure Hunt',
    mana_drought: 'Mana Drought',
    mana_overflow: 'Mana Overflow',
};

// === ENEMIES TRANSLATIONS ===
Translations.enemiesES = {
    slime: 'Slime',
    goblin: 'Goblin',
    skeleton: 'Esqueleto',
    bat: 'Murciélago',
    zombie: 'Zombie',
    ghost: 'Fantasma',
    imp: 'Diablillo',
    orc: 'Orco',
    demon: 'Demonio',
    wraith: 'Espectro',
    elemental: 'Elemental',
    golem: 'Golem',
    dragon: 'Dragón',
    lich: 'Lich',
    void_spawn: 'Engendro del Vacío',
};

Translations.enemiesEN = {
    slime: 'Slime',
    goblin: 'Goblin',
    skeleton: 'Skeleton',
    bat: 'Bat',
    zombie: 'Zombie',
    ghost: 'Ghost',
    imp: 'Imp',
    orc: 'Orc',
    demon: 'Demon',
    wraith: 'Wraith',
    elemental: 'Elemental',
    golem: 'Golem',
    dragon: 'Dragon',
    lich: 'Lich',
    void_spawn: 'Void Spawn',
};

// === META UPGRADES TRANSLATIONS ===
Translations.metaES = {
    shop_slots: { name: 'Slots de Tienda', desc: 'Slots: %current% → %next%' },
    shop_rerolls: { name: 'Rerolls de Tienda', desc: 'Rerolls: %current% → %next%' },
    luck: { name: 'Suerte', desc: 'Aumenta la probabilidad de loot raro: +%value%%' },
    dash_charges: { name: 'Cargas de Dash', desc: 'Dashes: %current% → %next%' },
    max_hp: { name: 'Vida Máxima', desc: '+%value% HP permanente' },
    starting_gold: { name: 'Oro Inicial', desc: 'Empezás con +%value% oro' },
};

Translations.metaEN = {
    shop_slots: { name: 'Shop Slots', desc: 'Slots: %current% → %next%' },
    shop_rerolls: { name: 'Shop Rerolls', desc: 'Rerolls: %current% → %next%' },
    luck: { name: 'Luck', desc: 'Increases rare loot chance: +%value%%' },
    dash_charges: { name: 'Dash Charges', desc: 'Dashes: %current% → %next%' },
    max_hp: { name: 'Max Health', desc: '+%value% permanent HP' },
    starting_gold: { name: 'Starting Gold', desc: 'Start with +%value% gold' },
};

// === ROOM TYPES TRANSLATIONS ===

// === ROOM EVENTS (localized names shown on HUD) ===
Translations.roomEventsES = {
    darkness: 'Oscuridad',
    gravity_wells: 'Pozos de gravedad',
    toxic_fog: 'Niebla tóxica',
    meteors: 'Meteoritos',
    mud: 'Barro',
    ice: 'Hielo',
    lightning: 'Tormenta eléctrica',
    curse: 'Maldición'
};
Translations.roomEventsEN = {
    darkness: 'Darkness',
    gravity_wells: 'Gravity Wells',
    toxic_fog: 'Toxic Fog',
    meteors: 'Meteors',
    mud: 'Mud',
    ice: 'Ice',
    lightning: 'Lightning Storm',
    curse: 'Curse'
};

Translations.roomTypesES = {
    normal: 'Normal',
    shop: 'Tienda',
    treasure: 'Tesoro',
    miniboss: 'MiniBoss',
    boss: 'Boss',
    forge: 'Forja',
    sanctuary: 'Santuario',
};

Translations.roomTypesEN = {
    normal: 'Normal',
    shop: 'Shop',
    treasure: 'Treasure',
    miniboss: 'MiniBoss',
    boss: 'Boss',
    forge: 'Forge',
    sanctuary: 'Sanctuary',
};

// === NOTIFICATIONS & MESSAGES ===
Translations.es.notifications = {
    notEnoughGold: 'No tenés suficiente oro',
    notEnoughMana: 'No tenés suficiente maná',
    inventoryFull: 'Inventario lleno',
    itemBought: '¡Comprado!',
    itemSold: '¡Vendido!',
    runeEquipped: 'Runa equipada',
    runeRemoved: 'Runa removida',
    potionUsed: 'Poción usada',
    dashReady: 'Dash listo',
    activeReady: 'Activo listo',
    roomCleared: '¡Sala despejada!',
    bossDefeated: '¡Boss derrotado!',
    gameOver: 'GAME OVER',
    victory: '¡VICTORIA!',
    newBiome: '¡Nuevo Bioma!',
    checkpointSaved: 'Progreso guardado',
    essenceGained: 'Esencia ganada',
};

Translations.en.notifications = {
    notEnoughGold: 'Not enough gold',
    notEnoughMana: 'Not enough mana',
    inventoryFull: 'Inventory full',
    itemBought: 'Bought!',
    itemSold: 'Sold!',
    runeEquipped: 'Rune equipped',
    runeRemoved: 'Rune removed',
    potionUsed: 'Potion used',
    dashReady: 'Dash ready',
    activeReady: 'Active ready',
    roomCleared: 'Room cleared!',
    bossDefeated: 'Boss defeated!',
    gameOver: 'GAME OVER',
    victory: 'VICTORY!',
    newBiome: 'New Biome!',
    checkpointSaved: 'Progress saved',
    essenceGained: 'Essence gained',
};

// === TOOLTIPS ===
Translations.es.tooltips = {
    health: 'Vida',
    mana: 'Maná',
    gold: 'Oro',
    damage: 'Daño',
    speed: 'Velocidad',
    fireRate: 'Velocidad de Disparo',
    range: 'Alcance',
    rarity: 'Rareza',
    common: 'Común',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Legendario',
    special: 'Especial',
    pressE: 'Presiona E',
    pressF: 'Presiona F',
    pressQ: 'Presiona Q',
    pressSpace: 'Presiona Espacio',
    clickToEquip: 'Click para equipar',
    clickToUse: 'Click para usar',
    rightClickToRemove: 'Click derecho para remover',
};

Translations.en.tooltips = {
    health: 'Health',
    mana: 'Mana',
    gold: 'Gold',
    damage: 'Damage',
    speed: 'Speed',
    fireRate: 'Fire Rate',
    range: 'Range',
    rarity: 'Rarity',
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    special: 'Special',
    pressE: 'Press E',
    pressF: 'Press F',
    pressQ: 'Press Q',
    pressSpace: 'Press Space',
    clickToEquip: 'Click to equip',
    clickToUse: 'Click to use',
    rightClickToRemove: 'Right-click to remove',
};

// === I18N HELPER FUNCTIONS ===

// === MUTATIONS (enemy modifiers) ===
const MutationNames = {
    es: {
        thorned: 'Espinoso',
        haste: 'Veloz',
        armored: 'Blindado',
        berserk: 'Berserker',
        shielded: 'Escudado',
        vampiric: 'Vampírico',
        void: 'Vacío',
        radiant: 'Radiante',
        rift: 'Grieta',
        molten: 'Fundido',
        frostbite: 'Congelante',
        reflect: 'Reflejo',
        overclocked: 'Sobreacelerado',
        haunted: 'Embrujado',
        juggernaut: 'Juggernaut',
        arcane: 'Arcano',
        crystal_shards: 'Fragmentos',
        toxic_burst: 'Tóxico'
    },
    en: {
        thorned: 'Thorned',
        haste: 'Haste',
        armored: 'Armored',
        berserk: 'Berserk',
        shielded: 'Shielded',
        vampiric: 'Vampiric',
        void: 'Void',
        radiant: 'Radiant',
        rift: 'Rift',
        molten: 'Molten',
        frostbite: 'Frostbite',
        reflect: 'Reflect',
        overclocked: 'Overclocked',
        haunted: 'Haunted',
        juggernaut: 'Juggernaut',
        arcane: 'Arcane',
        crystal_shards: 'Crystal Shards',
        toxic_burst: 'Toxic Burst'
    }
};

class I18n {
    constructor() {
        // Prefer URL override (?lang=en|es), then localStorage, else default to EN.
        let urlLang = null;
        try {
            const params = new URLSearchParams(window.location.search || '');
            urlLang = params.get('lang');
        } catch (e) { /* ignore */ }

        let saved = null;
        try { saved = localStorage.getItem('spellike_language'); } catch (e) { saved = null; }

        const pick = (urlLang || saved || 'en');
        this.currentLang = (pick === 'es' || pick === 'en') ? pick : 'en';
    }
    
    setLanguage(lang) {
        if (lang !== 'es' && lang !== 'en') return;
        this.currentLang = lang;

        // Persist (best effort)
        try { localStorage.setItem('spellike_language', lang); } catch (e) { /* ignore */ }

        // Also persist via URL so it works on file:// origins where storage can be flaky
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            history.replaceState(null, '', url.toString());
        } catch (e) { /* ignore */ }
    }
    
    t(key) {
        return Translations[this.currentLang][key] || key;
    }

    f(key, vars = {}) {
        let s = this.t(key);
        if (typeof s !== 'string') return s;
        for (const k of Object.keys(vars)) {
            s = s.replaceAll('{' + k + '}', String(vars[k]));
        }
        return s;
    }
rune(id) {
        const lang = this.currentLang === 'es' ? 'runesES' : 'runesEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    item(id) {
        const lang = this.currentLang === 'es' ? 'itemsES' : 'itemsEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    synergy(id) {
        const lang = this.currentLang === 'es' ? 'synergiesES' : 'synergiesEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    
    objective(id) {
        const lang = this.currentLang === 'es' ? 'objectivesES' : 'objectivesEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    roomEvent(id) {
        const lang = this.currentLang === 'es' ? 'roomEventsES' : 'roomEventsEN';
        return (Translations[lang] && Translations[lang][id]) ? Translations[lang][id] : id;
    }

    mutator(id) {
        const lang = this.currentLang === 'es' ? 'mutatorsES' : 'mutatorsEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    curse(id) {
        const lang = this.currentLang === 'es' ? 'cursesES' : 'cursesEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }

    enemyLore(id) {
        const lang = this.currentLang === 'es' ? 'enemyLoreES' : 'enemyLoreEN';
        return Translations[lang][id] || { name: id, icon: '❓', desc: '' };
    }
    
    bossLore(id) {
        const lang = this.currentLang === 'es' ? 'bossLoreES' : 'bossLoreEN';
        return Translations[lang][id] || { name: id, icon: '❓', desc: '' };
    }
    
    blessing(id) {
        const lang = this.currentLang === 'es' ? 'blessingsES' : 'blessingsEN';
        return Translations[lang][id] || { name: id, desc: '' };
    }
    
    getCurrentLang() {
        return this.currentLang;
    }
}

// Create global instance
window.i18n = new I18n();
window.Translations = Translations;
// Compatibility aliases (avoid crashes from old code paths)
window.I = window.i18n;
window.I18N = window.i18n;
window.rt = (key, fallback='') => {
    try {
        if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key);
    } catch(e) {}
    return fallback || key;
};
