# Diseño + Hook Técnico de Bosses (Pack Masivo)

- Límite de proyectiles simultáneos: total=220, enemigos=150, jugador=90.
- Ataques de alta cobertura siempre con gaps/safe zones o duración acotada.
- Escalado Normal/Hard/NG+: velocidad y rotación suben; nunca se elimina el espacio de esquiva.

## guardian (El Guardián)

### Orbe de Bastion Rebotante
- Nombre del ataque: Orbe de Bastion Rebotante
- Boss: guardian
- Rol del ataque: control de espacio y castigo de walls
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=235 | range=1700 | radius=9 | damageMul=0.8.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_ricochet_orb'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_ricochet_orb'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Abanico del Centinela
- Nombre del ataque: Abanico del Centinela
- Boss: guardian
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=7 | spreadDeg=85 | speed=310 | waves=1 | waveInterval=0.28 | damageMul=0.7 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'guardian_bastion_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_bastion_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Lanzas de Muralla
- Nombre del ataque: Lanzas de Muralla
- Boss: guardian
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right] | countPerWall=5 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_wall_lances'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_wall_lances'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Quebranto en Cruz
- Nombre del ataque: Quebranto en Cruz
- Boss: guardian
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=cross_player | strikeCount=6 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_quake_cross'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_quake_cross'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Anillo de Escudos
- Nombre del ataque: Anillo de Escudos
- Boss: guardian
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=16 | gapSize=2 | speed=245 | waves=2 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'guardian_shield_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_shield_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Embestida Ancla
- Nombre del ataque: Embestida Ancla
- Boss: guardian
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 520.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=520 | dashDuration=0.62 | trailEvery=0.13 | trailRadius=24 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_anchor_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_anchor_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Pinza de Acero
- Nombre del ataque: Pinza de Acero
- Boss: guardian
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=8 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_pincer_strike'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_pincer_strike'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Lluvia de Martillos
- Nombre del ataque: Lluvia de Martillos
- Boss: guardian
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 1.05s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.58s: lectura activa del patrón por parte del jugador.
  - 1.05s: release del ataque principal.
  - 1.53s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.53s | cooldown 8.50s.
- Parámetros ajustables: pattern=random_room | strikeCount=9 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.24s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_hammer_rain'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_hammer_rain'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Pulso de Empuje
- Nombre del ataque: Pulso de Empuje
- Boss: guardian
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=12 | gapSize=2 | speed=245 | waves=1 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'guardian_zone_push'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_zone_push'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Orbitas del Juramento
- Nombre del ataque: Orbitas del Juramento
- Boss: guardian
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (radial).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=6 | orbitRadius=62 | orbitDuration=2 | speed=285 | releaseMode=radial | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_warded_orbit'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_warded_orbit'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Aplastamiento con Brecha
- Nombre del ataque: Aplastamiento con Brecha
- Boss: guardian
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=14 | warn=0.82 | radius=26 | gapSize=3 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_safe_gap'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_safe_gap'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Cuadricula de Juicio
- Nombre del ataque: Cuadricula de Juicio
- Boss: guardian
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=12 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'guardian_judgement_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['guardian_judgement_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Combos (guardian)
- guardian_combo_ancla: guardian_wall_lances -> guardian_anchor_dash | phaseMin=2 | chance=22% | cd=16.00s.
- guardian_combo_gap: guardian_quake_cross -> guardian_safe_gap | phaseMin=3 | chance=20% | cd=15.00s.
- guardian_combo_orbit: guardian_warded_orbit -> guardian_bastion_fan | phaseMin=3 | chance=24% | cd=14.00s.

### Distribución por Fase (guardian)
- Fase 1: guardian_ricochet_orb, guardian_bastion_fan, guardian_quake_cross, guardian_zone_push.
- Fase 2: guardian_wall_lances, guardian_anchor_dash, guardian_pincer_strike, guardian_shield_ring.
- Fase 3: guardian_hammer_rain, guardian_warded_orbit, guardian_safe_gap, guardian_judgement_grid.

## demon_lord (Señor Demonio)

### Meteoros del Abismo
- Nombre del ataque: Meteoros del Abismo
- Boss: demon_lord
- Rol del ataque: objetivo secundario persistente
- Telegraph: Círculo+sombras de impacto meteor y sonido descendente. Duración aviso: 1.04s.
- Ejecución paso a paso:
  - 0.00s: casteo y marcadores de impacto iniciales.
  - 1.04s: cae primer meteorito (daño de área).
  - 1.99s: siguiente meteorito; cada impacto deja nido si aplica.
  - 3.54s: fin del patrón (nidos siguen hasta romperse).
- Duración total y Cooldown recomendado: total 3.54s | cooldown 12.00s.
- Parámetros ajustables: meteorCount=3 | meteorInterval=0.95 | warn=1 | impactRadius=52 | impactDamageMul=0.82 | nestHp=220 | nestSpawnEvery=3 | nestRange=115 | nestMaxMobs=6 | nestGlobalCap=12 | nestPool=[brute, mage, charger, summoner].
- Counterplay: Salir del impacto y focusear el nido para cortar spawns.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.23s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_meteor_spawner'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_meteor_spawner'].
  - Qué spawnea: room.addBossMeteorDrop -> addBossNest (HP propio).
  - Colisiones: Explosión meteor + colisión proyectiles del jugador contra nido.

### Abanico Abisal
- Nombre del ataque: Abanico Abisal
- Boss: demon_lord
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=9 | spreadDeg=105 | speed=310 | waves=2 | waveInterval=0.28 | damageMul=0.7 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'demon_abyss_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_abyss_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Corona de Cenizas
- Nombre del ataque: Corona de Cenizas
- Boss: demon_lord
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=20 | gapSize=3 | speed=245 | waves=2 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'demon_hell_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_hell_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Muro Sombrio
- Nombre del ataque: Muro Sombrio
- Boss: demon_lord
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[top, bottom] | countPerWall=6 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_shadow_walls'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_shadow_walls'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Carga de Sangre
- Nombre del ataque: Carga de Sangre
- Boss: demon_lord
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 560.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=560 | dashDuration=0.62 | trailEvery=0.13 | trailRadius=24 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_blood_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_blood_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Prision Hexagonal
- Nombre del ataque: Prision Hexagonal
- Boss: demon_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=10 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_hex_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_hex_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Reja Infernal
- Nombre del ataque: Reja Infernal
- Boss: demon_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=14 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_inferno_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_inferno_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Orbitas del Pavor
- Nombre del ataque: Orbitas del Pavor
- Boss: demon_lord
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (aimed).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=7 | orbitRadius=62 | orbitDuration=2 | speed=285 | releaseMode=aimed | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_dread_orbit'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_dread_orbit'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Invocacion Profana
- Nombre del ataque: Invocacion Profana
- Boss: demon_lord
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=3 | summonTypes=[summoner, mage, charger] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_summon_wave'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_summon_wave'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Caos Refractado
- Nombre del ataque: Caos Refractado
- Boss: demon_lord
- Rol del ataque: control de trayectorias
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=235 | range=1700 | radius=9 | damageMul=0.9.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_chaos_ricochet'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_chaos_ricochet'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Colapso con Brecha
- Nombre del ataque: Colapso con Brecha
- Boss: demon_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=16 | warn=0.82 | radius=26 | gapSize=3 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_collapse_gap'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_collapse_gap'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Pinza de Rayos
- Nombre del ataque: Pinza de Rayos
- Boss: demon_lord
- Rol del ataque: control angular
- Telegraph: Boss al centro, anillo de carga y flash de inversión de giro. Duración aviso: 1.10s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph de centro + alineación del boss.
  - 1.10s: activan 3 rayos giratorios (0.55 rad/s).
  - 1.50s: si hay inversión, flash/sonido y cambio de sentido.
  - 7.60s: termina giro y entra recovery.
- Duración total y Cooldown recomendado: total 8.15s | cooldown 12.80s.
- Parámetros ajustables: beamCount=3 | beamLength=460 | beamWidth=12 | rotSpeed=0.55 | invertCheckEvery=1.7 | invertChance=0.24 | duration=6.5 | damageMul=0.68.
- Counterplay: Caminar entre rayos (gaps reales), no gastar dash salvo inversión.
- Variantes:
  - Hard/NG+: rotación +12%, telegraph x0.88 (mín 0.97s).
  - Easy: rotación -15%, telegraph x1.18 (1.30s).
- Hook de implementación:
  - Pattern string sugerido: 'demon_laser_pincer'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['demon_laser_pincer'].
  - Qué spawnea: Beams continuos en special_move con rotDir + invertWindup.
  - Colisiones: Distancia punto-segmento entre rayos y jugador.

### Combos (demon_lord)
- demon_combo_nest: demon_meteor_spawner -> demon_hex_prison | phaseMin=2 | chance=20% | cd=17.00s.
- demon_combo_beams: demon_shadow_walls -> demon_laser_pincer | phaseMin=3 | chance=18% | cd=18.00s.
- demon_combo_chaos: demon_chaos_ricochet -> demon_collapse_gap -> demon_abyss_fan | phaseMin=3 | chance=16% | cd=19.00s.

### Distribución por Fase (demon_lord)
- Fase 1: demon_abyss_fan, demon_hell_ring, demon_shadow_walls.
- Fase 2: demon_meteor_spawner, demon_blood_dash, demon_hex_prison, demon_dread_orbit.
- Fase 3: demon_summon_wave, demon_chaos_ricochet, demon_collapse_gap, demon_inferno_grid, demon_laser_pincer.

## skeleton_king (Rey Esqueleto)

### Calavera Ricoshock
- Nombre del ataque: Calavera Ricoshock
- Boss: skeleton_king
- Rol del ataque: control de trayectorias
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=235 | range=1700 | radius=9 | damageMul=0.8.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_bone_ricochet'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_bone_ricochet'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Ataud Mural
- Nombre del ataque: Ataud Mural
- Boss: skeleton_king
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right] | countPerWall=5 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_coffin_wall'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_coffin_wall'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Abanico Costillar
- Nombre del ataque: Abanico Costillar
- Boss: skeleton_king
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=8 | spreadDeg=90 | speed=310 | waves=1 | waveInterval=0.28 | damageMul=0.7 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'skel_rib_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_rib_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Ronda de Tumbas
- Nombre del ataque: Ronda de Tumbas
- Boss: skeleton_king
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=16 | gapSize=2 | speed=245 | waves=2 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'skel_grave_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_grave_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Lanza Osaria
- Nombre del ataque: Lanza Osaria
- Boss: skeleton_king
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 540.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=540 | dashDuration=0.62 | trailEvery=0.13 | trailRadius=24 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_lance_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_lance_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Jaula de Femor
- Nombre del ataque: Jaula de Femor
- Boss: skeleton_king
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=9 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_bone_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_bone_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Malla de Medula
- Nombre del ataque: Malla de Medula
- Boss: skeleton_king
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=11 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_marrow_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_marrow_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Estandarte Necro
- Nombre del ataque: Estandarte Necro
- Boss: skeleton_king
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=3 | summonTypes=[skeleton, archer, wisp] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_banner_summon'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_banner_summon'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Orbitas Calavericas
- Nombre del ataque: Orbitas Calavericas
- Boss: skeleton_king
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (aimed).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=6 | orbitRadius=62 | orbitDuration=2 | speed=285 | releaseMode=aimed | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_orbit_skulls'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_orbit_skulls'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Cruce de Criptas
- Nombre del ataque: Cruce de Criptas
- Boss: skeleton_king
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=corners_center | strikeCount=8 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_corner_cross'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_corner_cross'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Pasillo Mortuorio
- Nombre del ataque: Pasillo Mortuorio
- Boss: skeleton_king
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=14 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_safe_lane'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_safe_lane'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Granizo de Craneos
- Nombre del ataque: Granizo de Craneos
- Boss: skeleton_king
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[top] | countPerWall=8 | speed=245 | targeted=false | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'skel_skull_hail'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['skel_skull_hail'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Combos (skeleton_king)
- skel_combo_crypt: skel_corner_cross -> skel_bone_prison | phaseMin=2 | chance=20% | cd=16.00s.
- skel_combo_ricochet: skel_bone_ricochet -> skel_rib_fan | phaseMin=2 | chance=24% | cd=15.00s.
- skel_combo_army: skel_banner_summon -> skel_safe_lane | phaseMin=3 | chance=18% | cd=18.00s.

### Distribución por Fase (skeleton_king)
- Fase 1: skel_rib_fan, skel_coffin_wall, skel_corner_cross.
- Fase 2: skel_lance_dash, skel_bone_prison, skel_grave_ring, skel_banner_summon.
- Fase 3: skel_marrow_grid, skel_bone_ricochet, skel_orbit_skulls, skel_safe_lane, skel_skull_hail.

## spider_queen (Reina Araña)

### Abanico de Seda
- Nombre del ataque: Abanico de Seda
- Boss: spider_queen
- Rol del ataque: castigo de melee
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=7 | spreadDeg=92 | speed=255 | waves=2 | waveInterval=0.28 | damageMul=0.58 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'spider_web_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_web_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Anillo Venenoso
- Nombre del ataque: Anillo Venenoso
- Boss: spider_queen
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=15 | gapSize=2 | speed=245 | waves=1 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'spider_venom_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_venom_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Telar Mural
- Nombre del ataque: Telar Mural
- Boss: spider_queen
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right, top] | countPerWall=4 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_web_walls'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_web_walls'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Emboscada de Seda
- Nombre del ataque: Emboscada de Seda
- Boss: spider_queen
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 560.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=560 | dashDuration=0.62 | trailEvery=0.13 | trailRadius=24 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_trap_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_trap_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Mortero de Huevos
- Nombre del ataque: Mortero de Huevos
- Boss: spider_queen
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 1.00s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.55s: lectura activa del patrón por parte del jugador.
  - 1.00s: release del ataque principal.
  - 1.48s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.48s | cooldown 8.50s.
- Parámetros ajustables: pattern=random_player_bias | strikeCount=7 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.88s).
  - Easy: telegraph x1.18 (1.18s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_egg_mortar'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_egg_mortar'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Nido de Camada
- Nombre del ataque: Nido de Camada
- Boss: spider_queen
- Rol del ataque: objetivo secundario persistente
- Telegraph: Círculo+sombras de impacto meteor y sonido descendente. Duración aviso: 1.04s.
- Ejecución paso a paso:
  - 0.00s: casteo y marcadores de impacto iniciales.
  - 1.04s: cae primer meteorito (daño de área).
  - 1.99s: siguiente meteorito; cada impacto deja nido si aplica.
  - 2.59s: fin del patrón (nidos siguen hasta romperse).
- Duración total y Cooldown recomendado: total 2.59s | cooldown 12.00s.
- Parámetros ajustables: meteorCount=2 | meteorInterval=0.95 | warn=1 | impactRadius=52 | impactDamageMul=0.82 | nestHp=180 | nestSpawnEvery=3 | nestRange=115 | nestMaxMobs=6 | nestGlobalCap=12 | nestPool=[wisp, goblin, slime, charger].
- Counterplay: Salir del impacto y focusear el nido para cortar spawns.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.23s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_brood_nest'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_brood_nest'].
  - Qué spawnea: room.addBossMeteorDrop -> addBossNest (HP propio).
  - Colisiones: Explosión meteor + colisión proyectiles del jugador contra nido.

### Prision de Hilos
- Nombre del ataque: Prision de Hilos
- Boss: spider_queen
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=8 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_silk_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_silk_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Cruz de Emboscada
- Nombre del ataque: Cruz de Emboscada
- Boss: spider_queen
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=cross_player | strikeCount=6 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_ambush_cross'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_ambush_cross'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Orbitas de Cria
- Nombre del ataque: Orbitas de Cria
- Boss: spider_queen
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (radial).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=8 | orbitRadius=62 | orbitDuration=2 | speed=260 | releaseMode=radial | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_orbit_spiders'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_orbit_spiders'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Mordida con Brecha
- Nombre del ataque: Mordida con Brecha
- Boss: spider_queen
- Rol del ataque: castigo de melee
- Telegraph: Apertura de fauces/cono corto delante del boss. Duración aviso: 0.80s.
- Ejecución paso a paso:
  - 0.00s: telegraph corto de mordida.
  - 0.80s: primer bite.
  - 1.10s: segundo bite (si aplica).
  - 2.12s: secuencia finalizada.
- Duración total y Cooldown recomendado: total 2.12s | cooldown 7.80s.
- Parámetros ajustables: bites=3 | biteInterval=0.3 | biteRange=105 | coneDeg=44 | damageMul=0.8.
- Counterplay: Micro-step lateral por mordida y evitar quedarse melee fijo.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.70s).
  - Easy: telegraph x1.18 (0.94s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_gap_bite'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_gap_bite'].
  - Qué spawnea: Secuencia de bites con intervalos (biteTimer).
  - Colisiones: Chequeo de cono + proyectiles cortos de mordida.

### Oleada de Cria
- Nombre del ataque: Oleada de Cria
- Boss: spider_queen
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=4 | summonTypes=[slime, wisp, charger] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_summon_wave'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_summon_wave'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Rocio de Esquinas
- Nombre del ataque: Rocio de Esquinas
- Boss: spider_queen
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[corners] | countPerWall=2 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'spider_corner_spray'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['spider_corner_spray'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Combos (spider_queen)
- spider_combo_nest: spider_brood_nest -> spider_silk_prison | phaseMin=2 | chance=20% | cd=17.00s.
- spider_combo_dash: spider_ambush_cross -> spider_trap_dash | phaseMin=2 | chance=22% | cd=15.00s.
- spider_combo_bite: spider_orbit_spiders -> spider_gap_bite | phaseMin=3 | chance=20% | cd=16.00s.

### Distribución por Fase (spider_queen)
- Fase 1: spider_web_fan, spider_ambush_cross, spider_egg_mortar.
- Fase 2: spider_web_walls, spider_trap_dash, spider_silk_prison, spider_summon_wave, spider_brood_nest.
- Fase 3: spider_venom_ring, spider_orbit_spiders, spider_gap_bite, spider_corner_spray.

## golem (Gólem Antiguo)

### Abanico de Cantera
- Nombre del ataque: Abanico de Cantera
- Boss: golem
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=6 | spreadDeg=78 | speed=310 | waves=1 | waveInterval=0.28 | damageMul=0.85 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_quarry_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_quarry_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Anillo de Rocas
- Nombre del ataque: Anillo de Rocas
- Boss: golem
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=14 | gapSize=2 | speed=245 | waves=1 | waveInterval=0.35 | damageMul=0.82 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'golem_boulder_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_boulder_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Embate de Muralla
- Nombre del ataque: Embate de Muralla
- Boss: golem
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right, top, bottom] | countPerWall=3 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_wall_slam'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_wall_slam'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Falla Tectonica
- Nombre del ataque: Falla Tectonica
- Boss: golem
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 500.
  - 1.23s: deja trail dañino periódico.
  - 1.98s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.98s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=500 | dashDuration=0.7 | trailEvery=0.13 | trailRadius=30 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_fault_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_fault_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Malla Sismica
- Nombre del ataque: Malla Sismica
- Boss: golem
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=14 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.88.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_seismic_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_seismic_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Pilares Cruzados
- Nombre del ataque: Pilares Cruzados
- Boss: golem
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=cross_player | strikeCount=6 | warn=0.82 | radius=32 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_pillar_cross'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_pillar_cross'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Peñasco Rebotante
- Nombre del ataque: Peñasco Rebotante
- Boss: golem
- Rol del ataque: control de trayectorias
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=215 | range=1700 | radius=10 | damageMul=0.95.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_rock_ricochet'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_rock_ricochet'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Orbitas Liticas
- Nombre del ataque: Orbitas Liticas
- Boss: golem
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (radial).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=5 | orbitRadius=70 | orbitDuration=2 | speed=285 | releaseMode=radial | damageMul=0.8.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_orbit_shards'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_orbit_shards'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Aplastamiento con Hueco
- Nombre del ataque: Aplastamiento con Hueco
- Boss: golem
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=15 | warn=0.82 | radius=26 | gapSize=3 | damageMul=1.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_crush_gap'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_crush_gap'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Lluvia de Bloques
- Nombre del ataque: Lluvia de Bloques
- Boss: golem
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 1.05s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.58s: lectura activa del patrón por parte del jugador.
  - 1.05s: release del ataque principal.
  - 1.53s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.53s | cooldown 8.50s.
- Parámetros ajustables: pattern=random_room | strikeCount=10 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.24s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_boulder_rain'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_boulder_rain'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Guardianes de Piedra
- Nombre del ataque: Guardianes de Piedra
- Boss: golem
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=3 | summonTypes=[brute, skeleton, goblin] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_guard_summon'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_guard_summon'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Mazo de Esquinas
- Nombre del ataque: Mazo de Esquinas
- Boss: golem
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[corners] | countPerWall=2 | speed=245 | targeted=false | damageMul=0.8.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'golem_corner_maul'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['golem_corner_maul'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Combos (golem)
- golem_combo_fault: golem_pillar_cross -> golem_fault_dash | phaseMin=2 | chance=22% | cd=16.00s.
- golem_combo_grid: golem_boulder_rain -> golem_seismic_grid | phaseMin=3 | chance=18% | cd=17.00s.
- golem_combo_guard: golem_guard_summon -> golem_crush_gap | phaseMin=3 | chance=18% | cd=18.00s.

### Distribución por Fase (golem)
- Fase 1: golem_quarry_fan, golem_pillar_cross, golem_boulder_ring.
- Fase 2: golem_wall_slam, golem_fault_dash, golem_orbit_shards, golem_guard_summon.
- Fase 3: golem_seismic_grid, golem_rock_ricochet, golem_crush_gap, golem_boulder_rain, golem_corner_maul.

## hydra (Hidra)

### Saliva de Multiples Fauces
- Nombre del ataque: Saliva de Multiples Fauces
- Boss: hydra
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=8 | spreadDeg=100 | speed=310 | waves=2 | waveInterval=0.28 | damageMul=0.7 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'hydra_spit_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_spit_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Marea Escamosa
- Nombre del ataque: Marea Escamosa
- Boss: hydra
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=18 | gapSize=2 | speed=245 | waves=1 | waveInterval=0.35 | damageMul=0.68 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'hydra_tide_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_tide_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Latigazo Cervical
- Nombre del ataque: Latigazo Cervical
- Boss: hydra
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 535.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=535 | dashDuration=0.62 | trailEvery=0.13 | trailRadius=24 | trailDamageMul=0.58.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_neck_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_neck_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Prision de Mandibulas
- Nombre del ataque: Prision de Mandibulas
- Boss: hydra
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=9 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_maw_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_maw_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Reticula Toxica
- Nombre del ataque: Reticula Toxica
- Boss: hydra
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=12 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_toxic_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_toxic_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Choque de Cabezas
- Nombre del ataque: Choque de Cabezas
- Boss: hydra
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right] | countPerWall=6 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_head_wall'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_head_wall'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Orbitas Hidricas
- Nombre del ataque: Orbitas Hidricas
- Boss: hydra
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (aimed).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=7 | orbitRadius=62 | orbitDuration=2 | speed=285 | releaseMode=aimed | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_orbit_spit'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_orbit_spit'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Pozo de Crias
- Nombre del ataque: Pozo de Crias
- Boss: hydra
- Rol del ataque: objetivo secundario persistente
- Telegraph: Círculo+sombras de impacto meteor y sonido descendente. Duración aviso: 1.04s.
- Ejecución paso a paso:
  - 0.00s: casteo y marcadores de impacto iniciales.
  - 1.04s: cae primer meteorito (daño de área).
  - 1.99s: siguiente meteorito; cada impacto deja nido si aplica.
  - 2.59s: fin del patrón (nidos siguen hasta romperse).
- Duración total y Cooldown recomendado: total 2.59s | cooldown 12.00s.
- Parámetros ajustables: meteorCount=2 | meteorInterval=0.95 | warn=1 | impactRadius=52 | impactDamageMul=0.82 | nestHp=210 | nestSpawnEvery=3 | nestRange=115 | nestMaxMobs=6 | nestGlobalCap=12 | nestPool=[slime, wisp, charger, brute].
- Counterplay: Salir del impacto y focusear el nido para cortar spawns.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.23s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_swarm_nest'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_swarm_nest'].
  - Qué spawnea: room.addBossMeteorDrop -> addBossNest (HP propio).
  - Colisiones: Explosión meteor + colisión proyectiles del jugador contra nido.

### Globulo Rebotante
- Nombre del ataque: Globulo Rebotante
- Boss: hydra
- Rol del ataque: control de trayectorias
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=235 | range=1700 | radius=9 | damageMul=0.86.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_ricochet_glob'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_ricochet_glob'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Canal Seguro
- Nombre del ataque: Canal Seguro
- Boss: hydra
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=15 | warn=0.82 | radius=26 | gapSize=3 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_safe_channel'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_safe_channel'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Oleada de Serpientes
- Nombre del ataque: Oleada de Serpientes
- Boss: hydra
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=4 | summonTypes=[slime, charger, skeleton] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_summon_wave'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_summon_wave'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Triple Mordida
- Nombre del ataque: Triple Mordida
- Boss: hydra
- Rol del ataque: castigo de melee
- Telegraph: Apertura de fauces/cono corto delante del boss. Duración aviso: 0.80s.
- Ejecución paso a paso:
  - 0.00s: telegraph corto de mordida.
  - 0.80s: primer bite.
  - 1.10s: segundo bite (si aplica).
  - 2.12s: secuencia finalizada.
- Duración total y Cooldown recomendado: total 2.12s | cooldown 7.80s.
- Parámetros ajustables: bites=3 | biteInterval=0.3 | biteRange=105 | coneDeg=44 | damageMul=0.85.
- Counterplay: Micro-step lateral por mordida y evitar quedarse melee fijo.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.70s).
  - Easy: telegraph x1.18 (0.94s).
- Hook de implementación:
  - Pattern string sugerido: 'hydra_triple_bite'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['hydra_triple_bite'].
  - Qué spawnea: Secuencia de bites con intervalos (biteTimer).
  - Colisiones: Chequeo de cono + proyectiles cortos de mordida.

### Combos (hydra)
- hydra_combo_maw: hydra_maw_prison -> hydra_triple_bite | phaseMin=2 | chance=24% | cd=15.00s.
- hydra_combo_swarm: hydra_swarm_nest -> hydra_toxic_grid | phaseMin=3 | chance=18% | cd=18.00s.
- hydra_combo_ricochet: hydra_ricochet_glob -> hydra_safe_channel | phaseMin=3 | chance=20% | cd=16.00s.

### Distribución por Fase (hydra)
- Fase 1: hydra_spit_fan, hydra_triple_bite, hydra_head_wall.
- Fase 2: hydra_tide_ring, hydra_neck_dash, hydra_maw_prison, hydra_summon_wave.
- Fase 3: hydra_toxic_grid, hydra_swarm_nest, hydra_ricochet_glob, hydra_orbit_spit, hydra_safe_channel.

## fire_lord (Señor del Fuego)

### Corona de Rayos Giratorios
- Nombre del ataque: Corona de Rayos Giratorios
- Boss: fire_lord
- Rol del ataque: control angular con gaps caminables
- Telegraph: Boss al centro, anillo de carga y flash de inversión de giro. Duración aviso: 1.10s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph de centro + alineación del boss.
  - 1.10s: activan 5 rayos giratorios (0.43 rad/s).
  - 1.50s: si hay inversión, flash/sonido y cambio de sentido.
  - 11.10s: termina giro y entra recovery.
- Duración total y Cooldown recomendado: total 11.65s | cooldown 12.80s.
- Parámetros ajustables: beamCount=5 | beamLength=460 | beamWidth=12 | rotSpeed=0.43 | invertCheckEvery=1.7 | invertChance=0.24 | duration=10 | damageMul=0.68.
- Counterplay: Caminar entre rayos (gaps reales), no gastar dash salvo inversión.
- Variantes:
  - Hard/NG+: rotación +12%, telegraph x0.88 (mín 0.97s).
  - Easy: rotación -15%, telegraph x1.18 (1.30s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_rotating_beams'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_rotating_beams'].
  - Qué spawnea: Beams continuos en special_move con rotDir + invertWindup.
  - Colisiones: Distancia punto-segmento entre rayos y jugador.

### Abanico Magmatico
- Nombre del ataque: Abanico Magmatico
- Boss: fire_lord
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=8 | spreadDeg=96 | speed=340 | waves=2 | waveInterval=0.28 | damageMul=0.78 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'fire_magma_fan'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_magma_fan'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Anillo de Brasas
- Nombre del ataque: Anillo de Brasas
- Boss: fire_lord
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=18 | gapSize=2 | speed=260 | waves=1 | waveInterval=0.35 | damageMul=0.72 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'fire_ember_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_ember_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Llamarada Mural
- Nombre del ataque: Llamarada Mural
- Boss: fire_lord
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right, top, bottom] | countPerWall=4 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_wall_flare'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_wall_flare'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Ariete del Inferno
- Nombre del ataque: Ariete del Inferno
- Boss: fire_lord
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 590.
  - 1.19s: deja trail dañino periódico.
  - 1.90s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.90s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=590 | dashDuration=0.62 | trailEvery=0.11 | trailRadius=24 | trailDamageMul=0.66.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_inferno_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_inferno_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Cuadricula de Pilares
- Nombre del ataque: Cuadricula de Pilares
- Boss: fire_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=14 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.84.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_pillar_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_pillar_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Forja Meteoritica
- Nombre del ataque: Forja Meteoritica
- Boss: fire_lord
- Rol del ataque: objetivo secundario persistente
- Telegraph: Círculo+sombras de impacto meteor y sonido descendente. Duración aviso: 1.04s.
- Ejecución paso a paso:
  - 0.00s: casteo y marcadores de impacto iniciales.
  - 1.04s: cae primer meteorito (daño de área).
  - 1.99s: siguiente meteorito; cada impacto deja nido si aplica.
  - 3.54s: fin del patrón (nidos siguen hasta romperse).
- Duración total y Cooldown recomendado: total 3.54s | cooldown 12.00s.
- Parámetros ajustables: meteorCount=3 | meteorInterval=0.95 | warn=1 | impactRadius=52 | impactDamageMul=0.9 | nestHp=240 | nestSpawnEvery=3 | nestRange=115 | nestMaxMobs=6 | nestGlobalCap=12 | nestPool=[brute, mage, charger, summoner].
- Counterplay: Salir del impacto y focusear el nido para cortar spawns.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.23s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_meteor_nest'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_meteor_nest'].
  - Qué spawnea: room.addBossMeteorDrop -> addBossNest (HP propio).
  - Colisiones: Explosión meteor + colisión proyectiles del jugador contra nido.

### Orbitas Candentes
- Nombre del ataque: Orbitas Candentes
- Boss: fire_lord
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (radial).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=7 | orbitRadius=70 | orbitDuration=2 | speed=300 | releaseMode=radial | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_orbit_flames'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_orbit_flames'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Arco Seguro Invertido
- Nombre del ataque: Arco Seguro Invertido
- Boss: fire_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=14 | warn=0.82 | radius=26 | gapSize=3 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_safe_arc'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_safe_arc'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Volcada de Esquinas
- Nombre del ataque: Volcada de Esquinas
- Boss: fire_lord
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[corners] | countPerWall=2 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_corner_volley'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_corner_volley'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Prision de Lava
- Nombre del ataque: Prision de Lava
- Boss: fire_lord
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=9 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.8.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_lava_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_lava_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Ola de Incinerados
- Nombre del ataque: Ola de Incinerados
- Boss: fire_lord
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=4 | summonTypes=[wisp, mage, charger] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'fire_summon_wave'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['fire_summon_wave'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Combos (fire_lord)
- fire_combo_beams: fire_rotating_beams -> fire_safe_arc | phaseMin=2 | chance=18% | cd=18.00s.
- fire_combo_forge: fire_meteor_nest -> fire_corner_volley | phaseMin=3 | chance=17% | cd=18.00s.
- fire_combo_dash: fire_lava_prison -> fire_inferno_dash -> fire_ember_ring | phaseMin=3 | chance=15% | cd=19.00s.

### Distribución por Fase (fire_lord)
- Fase 1: fire_magma_fan, fire_ember_ring, fire_wall_flare.
- Fase 2: fire_inferno_dash, fire_lava_prison, fire_orbit_flames, fire_rotating_beams.
- Fase 3: fire_pillar_grid, fire_meteor_nest, fire_safe_arc, fire_corner_volley, fire_summon_wave.

## final_boss (EL CATACLISMO)

### Omnifuego
- Nombre del ataque: Omnifuego
- Boss: final_boss
- Rol del ataque: burst frontal
- Telegraph: Carga frontal con brillo de arma + cono rojo tenue. Duración aviso: 0.72s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.40s: lectura activa del patrón por parte del jugador.
  - 0.72s: release del ataque principal.
  - 1.17s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.17s | cooldown 6.40s.
- Parámetros ajustables: count=10 | spreadDeg=112 | speed=350 | waves=2 | waveInterval=0.24 | damageMul=0.7 | range=640.
- Counterplay: Moverse en diagonal respecto al boss para salir del cono antes del release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.63s),  +1 proyectil (máx legible).
  - Easy: velocidad -12%, telegraph x1.18 (0.85s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_omnifire'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_omnifire'].
  - Qué spawnea: Spawn de proyectiles en arco (owner='enemy').
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Cataclismo Refractado
- Nombre del ataque: Cataclismo Refractado
- Boss: final_boss
- Rol del ataque: control de trayectorias
- Telegraph: Preview de trayectoria con rebotes en paredes (5 rebotes). Duración aviso: 0.92s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.51s: lectura activa del patrón por parte del jugador.
  - 0.92s: release del ataque principal.
  - 1.42s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.42s | cooldown 9.30s.
- Parámetros ajustables: bounces=5 | speed=260 | range=1900 | radius=10 | damageMul=0.92.
- Counterplay: Anticipar líneas de rebote y moverse al lado muerto de la trayectoria.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.81s).
  - Easy: velocidad -12%, telegraph x1.18 (1.09s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_ricochet'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_ricochet'].
  - Qué spawnea: Projectile con bounceCount=5 y path preview.
  - Colisiones: Colisión orb vs jugador y rebote contra paredes.

### Corona del Fin
- Nombre del ataque: Corona del Fin
- Boss: final_boss
- Rol del ataque: control angular
- Telegraph: Boss al centro, anillo de carga y flash de inversión de giro. Duración aviso: 1.10s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph de centro + alineación del boss.
  - 1.10s: activan 5 rayos giratorios (0.5 rad/s).
  - 1.50s: si hay inversión, flash/sonido y cambio de sentido.
  - 11.10s: termina giro y entra recovery.
- Duración total y Cooldown recomendado: total 11.65s | cooldown 12.80s.
- Parámetros ajustables: beamCount=5 | beamLength=460 | beamWidth=12 | rotSpeed=0.5 | invertCheckEvery=1.7 | invertChance=0.3 | duration=10 | damageMul=0.68.
- Counterplay: Caminar entre rayos (gaps reales), no gastar dash salvo inversión.
- Variantes:
  - Hard/NG+: rotación +12%, telegraph x0.88 (mín 0.97s).
  - Easy: rotación -15%, telegraph x1.18 (1.30s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_rotating_beams'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_rotating_beams'].
  - Qué spawnea: Beams continuos en special_move con rotDir + invertWindup.
  - Colisiones: Distancia punto-segmento entre rayos y jugador.

### Semilla del Fin
- Nombre del ataque: Semilla del Fin
- Boss: final_boss
- Rol del ataque: objetivo secundario persistente
- Telegraph: Círculo+sombras de impacto meteor y sonido descendente. Duración aviso: 1.04s.
- Ejecución paso a paso:
  - 0.00s: casteo y marcadores de impacto iniciales.
  - 1.04s: cae primer meteorito (daño de área).
  - 1.84s: siguiente meteorito; cada impacto deja nido si aplica.
  - 4.04s: fin del patrón (nidos siguen hasta romperse).
- Duración total y Cooldown recomendado: total 4.04s | cooldown 12.00s.
- Parámetros ajustables: meteorCount=4 | meteorInterval=0.8 | warn=1 | impactRadius=52 | impactDamageMul=0.95 | nestHp=280 | nestSpawnEvery=3 | nestRange=115 | nestMaxMobs=6 | nestGlobalCap=12 | nestPool=[brute, mage, charger, summoner].
- Counterplay: Salir del impacto y focusear el nido para cortar spawns.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.92s).
  - Easy: telegraph x1.18 (1.23s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_meteor_spawner'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_meteor_spawner'].
  - Qué spawnea: room.addBossMeteorDrop -> addBossNest (HP propio).
  - Colisiones: Explosión meteor + colisión proyectiles del jugador contra nido.

### Horno de Muros
- Nombre del ataque: Horno de Muros
- Boss: final_boss
- Rol del ataque: castigo de walls
- Telegraph: Bordes de sala se encienden en los muros que disparan. Duración aviso: 0.94s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.52s: lectura activa del patrón por parte del jugador.
  - 0.94s: release del ataque principal.
  - 1.44s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.44s | cooldown 8.20s.
- Parámetros ajustables: walls=[left, right, top, bottom] | countPerWall=5 | speed=245 | targeted=true | damageMul=0.68.
- Counterplay: Cruzar de lane antes del disparo o quedarse entre líneas de entrada.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.83s).
  - Easy: velocidad -12%, telegraph x1.18 (1.11s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_wall_furnace'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_wall_furnace'].
  - Qué spawnea: Spawn desde paredes/corners con targeting opcional.
  - Colisiones: Colisión proyectil vs jugador y walls.

### Corte del Vacio
- Nombre del ataque: Corte del Vacio
- Boss: final_boss
- Rol del ataque: burst de movilidad
- Telegraph: Línea punteada de embestida + pausa de carga. Duración aviso: 0.88s.
- Ejecución paso a paso:
  - 0.00s: telegraph lineal de embestida.
  - 0.88s: dash inicia con velocidad 620.
  - 1.23s: deja trail dañino periódico.
  - 1.98s: recovery y retorno a idle.
- Duración total y Cooldown recomendado: total 1.98s | cooldown 8.60s.
- Parámetros ajustables: dashSpeed=620 | dashDuration=0.7 | trailEvery=0.1 | trailRadius=24 | trailDamageMul=0.68.
- Counterplay: Side-step tardío y evitar seguir el trail posterior.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.77s).
  - Easy: telegraph x1.18 (1.04s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_void_dash'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_void_dash'].
  - Qué spawnea: Estado special_move con dashRemain + trailTimer.
  - Colisiones: Colisión cuerpo/trails/strikes con jugador y paredes.

### Prision Terminus
- Nombre del ataque: Prision Terminus
- Boss: final_boss
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=prison_player | strikeCount=10 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_prison'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_prison'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Malla Omega
- Nombre del ataque: Malla Omega
- Boss: final_boss
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=grid_room | strikeCount=16 | warn=0.82 | radius=26 | gapSize=2 | damageMul=0.78.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_grid'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_grid'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Orbitas del Colapso
- Nombre del ataque: Orbitas del Colapso
- Boss: final_boss
- Rol del ataque: presion circular
- Telegraph: Orbes orbitando al boss antes de soltarse. Duración aviso: 0.86s.
- Ejecución paso a paso:
  - 0.00s: telegraph y aparición de órbitas.
  - 0.86s: fase de órbita alrededor del boss.
  - 2.86s: release de orbes (aimed).
  - 3.36s: fin del patrón.
- Duración total y Cooldown recomendado: total 3.36s | cooldown 8.90s.
- Parámetros ajustables: orbitCount=8 | orbitRadius=76 | orbitDuration=2 | speed=320 | releaseMode=aimed | damageMul=0.72.
- Counterplay: Mantener distancia de la órbita y leer dirección de release.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.76s).
  - Easy: velocidad -12%, telegraph x1.18 (1.01s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_orbit'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_orbit'].
  - Qué spawnea: orbs en specialMoveData y release radial/aimed.
  - Colisiones: Colisión de órbita + proyectiles liberados vs jugador.

### Cortejo del Fin
- Nombre del ataque: Cortejo del Fin
- Boss: final_boss
- Rol del ataque: presion de adds
- Telegraph: Canalización con pulso de invocación en círculo. Duración aviso: 1.02s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.56s: lectura activa del patrón por parte del jugador.
  - 1.02s: release del ataque principal.
  - 1.57s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.57s | cooldown 10.20s.
- Parámetros ajustables: count=4 | summonTypes=[brute, mage, charger, summoner] | summonRadius=110.
- Counterplay: Castigar al boss en canalización o limpiar adds rápido.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.90s),  +1 proyectil (máx legible).
  - Easy: telegraph x1.18 (1.20s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_summon_wave'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_summon_wave'].
  - Qué spawnea: createEnemy en anillo alrededor del boss.
  - Colisiones: Colisión de minions y sus ataques.

### Compresion con Brecha
- Nombre del ataque: Compresion con Brecha
- Boss: final_boss
- Rol del ataque: control de espacio
- Telegraph: Círculos de warning en suelo con cuenta regresiva corta. Duración aviso: 0.90s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.50s: lectura activa del patrón por parte del jugador.
  - 0.90s: release del ataque principal.
  - 1.38s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.38s | cooldown 8.50s.
- Parámetros ajustables: pattern=ring_gap_player | strikeCount=16 | warn=0.82 | radius=26 | gapSize=3 | damageMul=0.96.
- Counterplay: Priorizar zonas sin marcador y reposicionarse tarde pero limpio.
- Variantes:
  - Hard/NG+: telegraph x0.88 (mín 0.79s).
  - Easy: telegraph x1.18 (1.06s).
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_safe_gap'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_safe_gap'].
  - Qué spawnea: room.addBossStrike(x,y,r,warn,strike,dmg).
  - Colisiones: Colisión área del strike vs jugador.

### Anillo de Ruptura
- Nombre del ataque: Anillo de Ruptura
- Boss: final_boss
- Rol del ataque: control radial
- Telegraph: Anillo radial pulsante alrededor del boss. Duración aviso: 0.76s.
- Ejecución paso a paso:
  - 0.00s: inicia telegraph del ataque.
  - 0.42s: lectura activa del patrón por parte del jugador.
  - 0.76s: release del ataque principal.
  - 1.24s: recovery y reset.
- Duración total y Cooldown recomendado: total 1.24s | cooldown 7.40s.
- Parámetros ajustables: count=24 | gapSize=3 | speed=285 | waves=2 | waveInterval=0.35 | damageMul=0.82 | range=620.
- Counterplay: Identificar el gap y caminar por el hueco, no dashing temprano.
- Variantes:
  - Hard/NG+: velocidad +12%, telegraph x0.88 (mín 0.67s).
  - Easy: velocidad -12%, telegraph x1.18 (0.90s), -2 proyectiles.
- Hook de implementación:
  - Pattern string sugerido: 'cataclysm_finale_ring'.
  - Estado/timers: this.state='special_move', this.specialMoveData (t, localTimer, hitCd, timers por tipo), this.moveCooldowns['cataclysm_finale_ring'].
  - Qué spawnea: Spawn circular con hueco configurable (gapSize).
  - Colisiones: Colisión proyectil vs jugador y paredes.

### Combos (final_boss)
- cat_combo_void: cataclysm_prison -> cataclysm_void_dash -> cataclysm_omnifire | phaseMin=2 | chance=20% | cd=17.00s.
- cat_combo_end: cataclysm_meteor_spawner -> cataclysm_rotating_beams | phaseMin=3 | chance=16% | cd=20.00s.
- cat_combo_final: cataclysm_ricochet -> cataclysm_safe_gap -> cataclysm_finale_ring | phaseMin=4 | chance=15% | cd=22.00s.

### Distribución por Fase (final_boss)
- Fase 1: cataclysm_omnifire, cataclysm_wall_furnace, cataclysm_prison.
- Fase 2: cataclysm_grid, cataclysm_void_dash, cataclysm_orbit, cataclysm_ricochet.
- Fase 3: cataclysm_rotating_beams, cataclysm_meteor_spawner, cataclysm_safe_gap, cataclysm_summon_wave.
- Fase 4: cataclysm_finale_ring, cataclysm_rotating_beams, cataclysm_meteor_spawner, cataclysm_ricochet, cataclysm_omnifire.

