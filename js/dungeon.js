// ==========================================
// ARCANE DEPTHS - Dungeon Generator (GRAPH + ENCOUNTER ARCHETYPES + NG+)
// ==========================================

class Dungeon {
    constructor(biome, difficulty = 'normal', ngPlusLevel = 0) {
        this.biome = biome;
        this.difficulty = difficulty;
        this.ngPlusLevel = ngPlusLevel;

        // Graph nodes (supports forks + backtracking)
        this.nodes = []; // { id, room, type, connections: [id], pos:{x,y} }
        this.currentNodeId = 0;
        this.history = []; // stack of previous nodeIds

        // Kept for legacy HUD expectations (now derived)
        this.roomsPerBiome = 8;

        this.difficultyMult = this.getDifficultyMult();
        this.generate();
    }

    getDifficultyMult() {
        let baseMult = 1.0;
        switch (this.difficulty) {
            case 'hard': baseMult = 1.5; break;
            case 'demonic': baseMult = 1.75; break;
            default: baseMult = 1.0;
        }
        // NG+ scaling: each loop adds +100% difficulty (NG+1 => 2x, NG+2 => 3x, etc)
        const mut = ((window.Game && Game.biomeMutation && Game.biomeMutation.enemyStatMult) ? Game.biomeMutation.enemyStatMult : 1);
        return baseMult * (1 + this.ngPlusLevel * 1.0) * mut;
    }

    getRoomMult(roomStep = 0) {
        let mult = this.difficultyMult;
        // IMPORTANT: biome scaling should NOT reset when looping biomes in NG+.
        // We treat NG+ loops as extra "virtual" biome sets.
        const baseIdx = (window.BiomeOrder) ? Math.max(0, BiomeOrder.indexOf(this.biome)) : 0;
        const loops = Math.max(0, this.ngPlusLevel || 0);
        const biomeIdx = baseIdx + (window.BiomeOrder ? BiomeOrder.length * loops : 0);
        if (this.difficulty === 'demonic') mult *= (1 + biomeIdx * 0.07 + roomStep * 0.03);
        else if (this.difficulty === 'hard') mult *= (1 + biomeIdx * 0.04 + roomStep * 0.015);
        return mult;
    }

    // -------------------------
    // Encounter archetypes (compositions)
    // -------------------------
    chooseEncounterArchetype(roomStep = 0) {
        const k = (window.Game && typeof Game.bossKillsThisRun === 'number') ? Game.bossKillsThisRun : 0;

        // Biome flavored pools
        const pools = {
            forest:   ['bunker','pursuit','swarm','killbox'],
            crypt:    ['bunker','swarm','pursuit','killbox'],
            crystal:  ['killbox','bunker','pursuit','swarm'],
            ruins:    ['bunker','killbox','pursuit','swarm'],
            swamp:    ['swarm','pursuit','bunker','killbox'],
            inferno:  ['pursuit','killbox','bunker','swarm']
        };
        const pool = pools[this.biome] || ['bunker','pursuit','swarm','killbox'];

        // Progress bias: after boss kills, more tactical rooms
        const bias = Math.min(3, k);
        const weights = pool.map((id, idx) => 1 + (idx === 0 ? bias * 0.3 : 0) + (Math.random() * 0.15));
        const total = weights.reduce((a,b)=>a+b,0);
        let r = Math.random() * total;
        for (let i=0;i<pool.length;i++){
            r -= weights[i];
            if (r <= 0) return pool[i];
        }
        return pool[0];
    }

    // Create a node with a room
    addNode(type, pos) {
        const id = this.nodes.length;
        const room = new Room({ biome: this.biome, type, width: 800, height: 500 });
        this.nodes.push({ id, type, room, connections: [], pos: pos || { x: id, y: 0 } });
        return id;
    }

    connect(a, b) {
        const na = this.nodes[a], nb = this.nodes[b];
        if (!na || !nb) return;
        if (!na.connections.includes(b)) na.connections.push(b);
        if (!nb.connections.includes(a)) nb.connections.push(a);
    }

    generate() {
        const biomeData = BiomeDatabase[this.biome] || BiomeDatabase.forest;

        // LINEAR dungeon only (no forks / no room choice).
        // 8 rooms per biome:
        // 0 combat -> 1 combat -> 2 combat -> 3 event/shop -> 4 combat -> 5 miniboss -> 6 elite -> 7 boss
        const n0 = this.addNode('combat',   { x: 0, y: 0 });
        const n1 = this.addNode('combat',   { x: 1, y: 0 });
        const n2 = this.addNode('combat',   { x: 2, y: 0 });
        const n3 = this.addNode('event',    { x: 3, y: 0 }); // shop/event
        const n4 = this.addNode('combat',   { x: 4, y: 0 });
        const n5 = this.addNode('miniboss', { x: 5, y: 0 });
        const n6 = this.addNode('elite',    { x: 6, y: 0 });
        const n7 = this.addNode('boss',     { x: 7, y: 0 });

        this.connect(n0, n1);
        this.connect(n1, n2);
        this.connect(n2, n3);
        this.connect(n3, n4);
        this.connect(n4, n5);
        this.connect(n5, n6);
        this.connect(n6, n7);

        // Populate rooms (composition-based) - IMPORTANT:
        // Keep `node.room` as a Room instance (it drives update/render/bounds).
        // Store progression index on both node and room and spawn contents now.
        const order = [n0, n1, n2, n3, n4, n5, n6, n7];
        for (let step = 0; step < order.length; step++) {
            const nodeId = order[step];
            const node = this.nodes[nodeId];
            if (!node || !node.room) continue;

            node.roomIndex = step;
            node.room.roomIndex = step;

            // Ensure room type matches node type (constructor already sets it, but keep consistent)
            node.room.type = node.type;

            // Spawn the actual room contents (enemies, shop, boss, etc)
            this.populateRoom(node.room, node.type, biomeData, step);
        }

        this.currentNodeId = n0;
        this.history = [];
        this.roomsPerBiome = order.length;
    }

    // Set current room by legacy room index (0..roomsPerBiome-1)
    // Some parts of the codebase (save/load, HUD) use "roomIndex" semantics.
    // In the graph dungeon implementation, we derive currentRoomIndex from history.
    // This helper positions the dungeon deterministically without assigning to the getter.
    setRoomIndex(roomIndex) {
        const idx = Math.max(0, Math.floor(roomIndex || 0));
        const ordered = this.nodes
            .slice()
            .sort((a, b) => ((a.roomIndex ?? a.id) - (b.roomIndex ?? b.id)));

        const clamped = Math.min(idx, Math.max(0, ordered.length - 1));
        const targetNode = ordered[clamped];
        if (!targetNode) {
            this.currentNodeId = 0;
            this.history = [];
            return;
        }

        // Build a backtrack path consistent with a linear progression.
        this.history = ordered.slice(0, clamped).map(n => n.id);
        this.currentNodeId = targetNode.id;
    }

    populateRoom(room, roomType, biomeData, step) {
        const enemies = this.getEnemiesForRoom(biomeData.enemies, step);

        if (roomType === 'combat') {
            // Archetype-driven encounter (no random soup)
            const archetype = this.chooseEncounterArchetype(step);
            const mult = this.getRoomMult(step);
            if (typeof room.spawnEncounter === 'function') room.spawnEncounter(archetype, mult, enemies, this.biome);
            else room.spawnEnemies(Math.max(1, Utils.random(4, 7)), mult, enemies);
        } else if (roomType === 'elite') {
            // Tactical elite: guaranteed "bunker" feel
            const mult = this.getRoomMult(step);
            if (typeof room.spawnEncounter === 'function') room.spawnEncounter('bunker', mult * 1.15, enemies, this.biome, { forceElite: true });
            else {
                room.spawnEnemies(1, mult * 2.5, enemies);
                room.enemies[0].isElite = true;
            }
        } else if (roomType === 'miniboss') {
            const miniType = Utils.randomChoice(enemies);
            room.spawnMiniBoss(miniType, this.getRoomMult(step) * 2.2);
            room.spawnEnemies(2 + Math.floor(step / 3), this.getRoomMult(step) * 0.9, enemies);
        } else if (roomType === 'event') {
            // One-shot rewards (supports backtracking)
            room.spawnChest('rare');
            room.cleared = true;
            room.doorOpen = true;
            room.spawnShop();
        } else if (roomType === 'boss') {
            this.spawnBoss(room);
        }
    }

    getEnemiesForRoom(baseEnemies, roomStep) {
        let enemies = [...baseEnemies];

        if (roomStep >= 2 && !enemies.includes('mage')) enemies.push('mage');
        if (roomStep >= 3 && !enemies.includes('bomber')) enemies.push('bomber');
        if (roomStep >= 4 || this.ngPlusLevel > 0) {
            if (!enemies.includes('summoner')) enemies.push('summoner');
        }
        // Extra roles can reuse these "base types"
        if (!enemies.includes('brute')) enemies.push('brute');
        if (!enemies.includes('wisp')) enemies.push('wisp');
        if (!enemies.includes('turret')) enemies.push('turret');

        return enemies;
    }

    spawnBoss(room) {
        const biomeData = BiomeDatabase[this.biome] || BiomeDatabase.forest;
        let bossType = biomeData.boss || 'guardian';

        const isFinalBiome = (window.BiomeOrder && BiomeOrder[BiomeOrder.length - 1] === this.biome);
        if (isFinalBiome) bossType = 'final_boss';

        const bossX = room.bounds.x + room.bounds.width / 2 - 32;
        const bossY = room.bounds.y + room.bounds.height / 2 - 32;

        const boss = createBoss(bossType, bossX, bossY, this.difficultyMult, this.ngPlusLevel);
        room.enemies.push(boss);
        room.hasBoss = true;
        room.bossDefeated = false;

        if (this.ngPlusLevel > 0) {
            room.spawnEnemies(2 + this.ngPlusLevel, this.difficultyMult * 0.8, biomeData.enemies);
        }
    }

    // -------------------------
    // Navigation
    // -------------------------
    getCurrentNode() {
        // Safety: never return undefined node (can happen with corrupted saves or legacy state).
        return this.nodes[this.currentNodeId] || this.nodes[0] || null;
    }
    getCurrentRoom() {
        const node = this.getCurrentNode();
        return (node && node.room) ? node.room : null;
    }

    getNextOptions() {
        const node = this.getCurrentNode();
        if (!node) return [];
        // forward options = neighbors excluding immediate back (last history)
        const backId = this.history.length ? this.history[this.history.length - 1] : null;
        const opts = node.connections.filter(id => id !== backId);
        return opts;
    }

    canGoBack() { return this.history.length > 0; }

    moveTo(nodeId) {
        if (nodeId == null || !this.nodes[nodeId]) return null;
        if (nodeId === this.currentNodeId) return this.getCurrentRoom();
        this.history.push(this.currentNodeId);
        this.currentNodeId = nodeId;
        return this.getCurrentRoom();
    }

    back() {
        if (!this.canGoBack()) return null;
        this.currentNodeId = this.history.pop();
        return this.getCurrentRoom();
    }

    // Legacy-compatible helpers (used by some UI)
    get currentRoomIndex() {
        // Approximate "step" as path length so far (history length)
        return Math.max(0, this.history.length);
    }

    nextRoom() {
        const opts = this.getNextOptions();
        if (opts.length === 1) return this.moveTo(opts[0]);
        // Multiple options: caller must choose
        return null;
    }

    isComplete() {
        const node = this.getCurrentNode();
        if (!node) return false;
        return node.type === 'boss' && node.room && node.room.cleared;
    }

    isBossRoom() {
        const node = this.getCurrentNode();
        return !!(node && node.type === 'boss');
    }
}

window.Dungeon = Dungeon;
