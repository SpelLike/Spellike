// ==========================================
// ARCANE DEPTHS - Isometric 3D Pixel Sprites
// ==========================================

const Sprites = {
    cache: {},
    animationFrames: {},
    externalPlayerEnabled: true,
    _externalPlayerLoaded: false,
    _externalPlayerImgs: null,
    _externalPlayerAnim: null,
    _chargerSkinLoaded: false,
    _chargerFrames: null,


    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { canvas, ctx: canvas.getContext('2d') };
    },

    pixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    },

    // Preload external player PNG assets (synchronous boot: Game starts only after this resolves)
    preloadExternalPlayer() {
        if (!this.externalPlayerEnabled) return Promise.resolve();
        if (this._externalPlayerLoaded && (this._externalPlayerImgs || this._externalPlayerAnim)) return Promise.resolve();

        const loadImg = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image: ' + src));
            img.src = src;
        });

        const dirs8 = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

        // 1) Prefer the full animation pack if present (MOVEMENT.zip integration)
        const base = 'assets/player/MOVEMENT/animations';
        const tryLoadAnimPack = async () => {
            const anim = { idle: {}, walk: {} };
            for (const d of dirs8) {
                anim.idle[d] = await Promise.all([
                    loadImg(`${base}/breathing-idle/${d}/frame_000.png`),
                    loadImg(`${base}/breathing-idle/${d}/frame_001.png`),
                    loadImg(`${base}/breathing-idle/${d}/frame_002.png`),
                    loadImg(`${base}/breathing-idle/${d}/frame_003.png`)
                ]);
                anim.walk[d] = await Promise.all([
                    loadImg(`${base}/walking-4-frames/${d}/frame_000.png`),
                    loadImg(`${base}/walking-4-frames/${d}/frame_001.png`),
                    loadImg(`${base}/walking-4-frames/${d}/frame_002.png`),
                    loadImg(`${base}/walking-4-frames/${d}/frame_003.png`)
                ]);
            }

            this._externalPlayerAnim = anim;
            this._externalPlayerImgs = null;
            this._externalPlayerLoaded = true;
            delete this.cache.playerSprites;
        };

        // 2) Fallback: 4 static direction PNGs (older integration)
        const loadSimple4 = async () => {
            const [up, down, left, right] = await Promise.all([
                loadImg('assets/player/player_up.png'),
                loadImg('assets/player/player_down.png'),
                loadImg('assets/player/player_left.png'),
                loadImg('assets/player/player_right.png')
            ]);
            this._externalPlayerImgs = { up, down, left, right };
            this._externalPlayerAnim = null;
            this._externalPlayerLoaded = true;
            delete this.cache.playerSprites;
        };

        // Try anim pack first, then simple.
        return tryLoadAnimPack().catch((e) => {
            console.warn('External player anim pack failed to load, trying simple sprites.', e);
            return loadSimple4();
        }).catch((e2) => {
            console.warn('External player assets failed to load, falling back to procedural sprites.', e2);
            this.externalPlayerEnabled = false;
        });
    },

    async preloadChargerSkin() {
        if (this._chargerSkinLoaded) return;
        try {
            const loadImg = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load ' + src));
                img.src = src;
            });

            const base = 'assets/enemies/charger';
            const dirs = ['up','down','left','right'];
            const frames = { idle: {}, walk: {} };

            for (const d of dirs) {
                // idle
                const idleImg = await loadImg(`${base}/idle_${d}.png`);
                const { canvas: idleC, ctx: idleCtx } = this.createCanvas(40, 40);
                // Pixel-perfect: draw at native resolution centered in a 40x40 frame.
                // This avoids blur (no smoothing) and keeps the sprite identical to the source asset.
                idleCtx.imageSmoothingEnabled = false;
                const iw = idleImg.width, ih = idleImg.height;
                const dx = Math.floor((40 - iw) / 2);
                const dy = Math.floor((40 - ih) / 2);
                idleCtx.clearRect(0, 0, 40, 40);
                idleCtx.drawImage(idleImg, dx, dy);
                frames.idle[d] = idleC;

                // walk (supports 4 frames if available)
const walkFrames = [];
for (let i = 0; i < 4; i++) {
    let imgW;
    try {
        imgW = await loadImg(`${base}/walk_${d}_${i}.png`);
    } catch (e) {
        // If a frame is missing, stop at what we have (at least 1–2)
        break;
    }

    const { canvas: cw, ctx: xw } = this.createCanvas(40, 40);
    // Pixel-perfect: draw at native resolution centered (no blur).
    xw.imageSmoothingEnabled = false;
    const sw = imgW.width, sh = imgW.height;
    const dxw = Math.floor((40 - sw) / 2);
    const dyw = Math.floor((40 - sh) / 2);
    xw.clearRect(0, 0, 40, 40);
    xw.drawImage(imgW, dxw, dyw);

    walkFrames.push(cw);
}
// Fallback to 2 frames if only 1 loaded
if (walkFrames.length === 1) walkFrames.push(walkFrames[0]);
frames.walk[d] = walkFrames;

            }

            this._chargerFrames = frames;
            this._chargerSkinLoaded = true;
        } catch (e) {
            // If anything fails, keep default procedural sprites
            this._chargerFrames = null;
            this._chargerSkinLoaded = false;
        }
    },

    _drawExternalIntoFrame(ctx, img, frame) {
        // Create a consistent 32x40 frame from a 64x64 input (nearest scaling)
        const bobOffset = frame === 1 || frame === 2 ? 1 : 0;

        // Subtle aura behind sprite (keeps the game vibe)
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16, 28 + bobOffset, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(16, 38, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw sprite scaled down to 32x32
        // Use imageSmoothingEnabled=false for crisp pixels
        ctx.imageSmoothingEnabled = false;
        const yOff = 6 + bobOffset; // place feet near bottom
        // src is 64x64 (full frame). scale to 32x32.
        ctx.drawImage(img, 0, 0, img.width || 64, img.height || 64, 0, yOff, 32, 32);
    },

    // =============================================
    // PLAYER SPRITES - Isometric 3D with directions
    // =============================================

    getPlayerSprites() {
        if (this.cache.playerSprites) return this.cache.playerSprites;

        // We support both the classic 4-dir keys (up/down/left/right)
        // and 8-dir keys (north-east, etc.) when external animation pack is available.
        const dirs4 = ['down', 'up', 'left', 'right'];
        const dirs8 = ['south', 'north', 'west', 'east', 'north-east', 'north-west', 'south-east', 'south-west'];
        const allDirs = this._externalPlayerAnim ? dirs8 : dirs4;

        const sprites = { idle: {}, walk: {} };

        // Build frames
        for (const d of allDirs) {
            sprites.idle[d] = this.createPlayerFrame(d, 0, 'idle');
            sprites.walk[d] = [
                this.createPlayerFrame(d, 0, 'walk'),
                this.createPlayerFrame(d, 1, 'walk'),
                this.createPlayerFrame(d, 2, 'walk'),
                this.createPlayerFrame(d, 3, 'walk')
            ];
        }

        // Aliases for legacy direction names
        // up/down/left/right map to north/south/west/east
        if (this._externalPlayerAnim) {
            sprites.idle.up = sprites.idle.north;
            sprites.idle.down = sprites.idle.south;
            sprites.idle.left = sprites.idle.west;
            sprites.idle.right = sprites.idle.east;
            sprites.walk.up = sprites.walk.north;
            sprites.walk.down = sprites.walk.south;
            sprites.walk.left = sprites.walk.west;
            sprites.walk.right = sprites.walk.east;
        }

        this.cache.playerSprites = sprites;
        return sprites;
    },

    _normalizeExternalDir(direction) {
        // Normalize common direction keys to the MOVEMENT pack naming.
        switch (direction) {
            case 'up': return 'north';
            case 'down': return 'south';
            case 'left': return 'west';
            case 'right': return 'east';
            default: return direction;
        }
    },

    createPlayerFrame(direction, frame, state = 'idle') {
        const { canvas, ctx } = this.createCanvas(32, 40);

        if (this.externalPlayerEnabled && this._externalPlayerLoaded) {
            // New: full anim pack
            if (this._externalPlayerAnim) {
                const d = this._normalizeExternalDir(direction);
                const bank = state === 'walk' ? this._externalPlayerAnim.walk : this._externalPlayerAnim.idle;
                const frames = bank[d] || bank.south || bank.down;
                const img = frames ? frames[Math.max(0, frame) % frames.length] : null;
                if (img) {
                    this._drawExternalIntoFrame(ctx, img, frame);
                    return canvas;
                }
            }

            // Fallback: 4 static sprites
            if (this._externalPlayerImgs) {
                const key = (direction === 'north') ? 'up' : (direction === 'south') ? 'down' : direction;
                const img = this._externalPlayerImgs[key] || this._externalPlayerImgs.down;
                this._drawExternalIntoFrame(ctx, img, frame);
                return canvas;
            }
        }

        // Colors
        // Upgraded arcane mage palette
        const robe = '#1a237e';
        const robeDark = '#0d133d';
        const robeLight = '#3949ab';
        const trim = '#fdd835';
        const skin = '#ffcc99';
        const skinDark = '#e5a87a';
        const hair = '#3e2723';
        const staff = '#8d6e63';
        const staffDark = '#5d4037';
        const gem = '#00e5ff';
        const gemGlow = '#80deea';

        // Animation offset
        const walkOffset = frame === 1 ? -1 : (frame === 2 ? 1 : 0);
        const bobOffset = frame === 1 || frame === 2 ? 1 : 0;

        ctx.save();

        // Arcane aura (subtle glow)
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16, 28 + bobOffset, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (direction === 'down') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(16, 38, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body - front view with 3D depth
            // Robe back layer (darker for depth)
            ctx.fillStyle = robeDark;
            ctx.fillRect(8, 18 + bobOffset, 16, 16);

            // Robe main body
            ctx.fillStyle = robe;
            ctx.fillRect(9, 16 + bobOffset, 14, 14);

            // Trim belt
            ctx.fillStyle = trim;
            ctx.fillRect(9, 24 + bobOffset, 14, 2);

            // Robe highlights (3D effect)
            ctx.fillStyle = robeLight;
            ctx.fillRect(10, 17 + bobOffset, 3, 10);

            // Legs animation
            ctx.fillStyle = robeDark;
            ctx.fillRect(10 + walkOffset, 30 + bobOffset, 4, 6);
            ctx.fillRect(18 - walkOffset, 30 + bobOffset, 4, 6);

            // Head - 3D sphere effect
            ctx.fillStyle = skinDark;
            ctx.beginPath();
            ctx.arc(16, 12 + bobOffset, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(15, 11 + bobOffset, 6, 0, Math.PI * 2);
            ctx.fill();

            // Hood
            ctx.fillStyle = robe;
            ctx.beginPath();
            ctx.arc(16, 10 + bobOffset, 8, Math.PI, 0, false);
            ctx.fill();
            ctx.fillStyle = robeLight;
            this.pixel(ctx, 10, 8 + bobOffset, robeLight);
            this.pixel(ctx, 11, 7 + bobOffset, robeLight);

            // Face
            // Eyes
            ctx.fillStyle = '#000';
            this.pixel(ctx, 13, 12 + bobOffset, '#000');
            this.pixel(ctx, 18, 12 + bobOffset, '#000');
            // Eye shine
            this.pixel(ctx, 13, 11 + bobOffset, '#fff');
            this.pixel(ctx, 18, 11 + bobOffset, '#fff');

            // Staff (in front)
            ctx.fillStyle = staffDark;
            ctx.fillRect(24, 8 + bobOffset, 3, 26);
            ctx.fillStyle = staff;
            ctx.fillRect(25, 8 + bobOffset, 2, 25);

            // Gem on staff (glowing 3D orb)
            ctx.fillStyle = gem;
            ctx.beginPath();
            ctx.arc(26, 6 + bobOffset, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = gemGlow;
            ctx.beginPath();
            ctx.arc(25, 5 + bobOffset, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            this.pixel(ctx, 24, 4 + bobOffset, '#fff');

        } else if (direction === 'up') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(16, 38, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Robe back (visible from behind)
            ctx.fillStyle = robeDark;
            ctx.fillRect(8, 16 + bobOffset, 16, 18);
            ctx.fillStyle = robe;
            ctx.fillRect(9, 17 + bobOffset, 14, 15);

            // Legs
            ctx.fillStyle = robeDark;
            ctx.fillRect(10 + walkOffset, 30 + bobOffset, 4, 6);
            ctx.fillRect(18 - walkOffset, 30 + bobOffset, 4, 6);

            // Hood/back of head
            ctx.fillStyle = robe;
            ctx.beginPath();
            ctx.arc(16, 12 + bobOffset, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = robeLight;
            this.pixel(ctx, 10, 10 + bobOffset, robeLight);

            // Staff behind
            ctx.fillStyle = staff;
            ctx.fillRect(5, 8 + bobOffset, 2, 25);
            ctx.fillStyle = gem;
            ctx.beginPath();
            ctx.arc(6, 6 + bobOffset, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (direction === 'left') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(16, 38, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Staff behind body
            ctx.fillStyle = staff;
            ctx.fillRect(20, 8 + bobOffset, 2, 25);
            ctx.fillStyle = gem;
            ctx.beginPath();
            ctx.arc(21, 6 + bobOffset, 3, 0, Math.PI * 2);
            ctx.fill();

            // Robe - side view 3D
            ctx.fillStyle = robeDark;
            ctx.fillRect(10, 16 + bobOffset, 12, 18);
            ctx.fillStyle = robe;
            ctx.fillRect(12, 17 + bobOffset, 8, 15);

            // Legs
            ctx.fillStyle = robeDark;
            ctx.fillRect(12 + walkOffset * 2, 30 + bobOffset, 4, 6);
            ctx.fillRect(16 - walkOffset, 30 + bobOffset, 4, 6);

            // Head - side view
            ctx.fillStyle = skinDark;
            ctx.beginPath();
            ctx.arc(14, 12 + bobOffset, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(13, 11 + bobOffset, 5, 0, Math.PI * 2);
            ctx.fill();

            // Hood side
            ctx.fillStyle = robe;
            ctx.beginPath();
            ctx.arc(15, 10 + bobOffset, 7, Math.PI * 0.5, Math.PI * 1.5, false);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#000';
            this.pixel(ctx, 11, 11 + bobOffset, '#000');
            this.pixel(ctx, 11, 10 + bobOffset, '#fff');

        } else if (direction === 'right') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(16, 38, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Robe - side view 3D
            ctx.fillStyle = robeDark;
            ctx.fillRect(10, 16 + bobOffset, 12, 18);
            ctx.fillStyle = robe;
            ctx.fillRect(12, 17 + bobOffset, 8, 15);
            ctx.fillStyle = robeLight;
            ctx.fillRect(18, 18 + bobOffset, 2, 8);

            // Legs
            ctx.fillStyle = robeDark;
            ctx.fillRect(12 + walkOffset, 30 + bobOffset, 4, 6);
            ctx.fillRect(16 - walkOffset * 2, 30 + bobOffset, 4, 6);

            // Head - side view
            ctx.fillStyle = skinDark;
            ctx.beginPath();
            ctx.arc(18, 12 + bobOffset, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(19, 11 + bobOffset, 5, 0, Math.PI * 2);
            ctx.fill();

            // Hood side
            ctx.fillStyle = robe;
            ctx.beginPath();
            ctx.arc(17, 10 + bobOffset, 7, -Math.PI * 0.5, Math.PI * 0.5, false);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#000';
            this.pixel(ctx, 21, 11 + bobOffset, '#000');
            this.pixel(ctx, 21, 10 + bobOffset, '#fff');

            // Staff in front
            ctx.fillStyle = staffDark;
            ctx.fillRect(24, 8 + bobOffset, 3, 26);
            ctx.fillStyle = staff;
            ctx.fillRect(25, 8 + bobOffset, 2, 25);
            ctx.fillStyle = gem;
            ctx.beginPath();
            ctx.arc(26, 6 + bobOffset, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = gemGlow;
            ctx.beginPath();
            ctx.arc(25, 5 + bobOffset, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        return canvas;
    },

    // =============================================
    // ENEMY SPRITES - Isometric 3D
    // =============================================

    getEnemySprites(type) {
        // External skin override for Charger
        if (type === 'charger' && this._chargerFrames) {
            const key = `enemySprites_${type}`;
            if (this.cache[key]) return this.cache[key];
            const sprites = {
                idle: {
                    down: this._chargerFrames.idle.down,
                    up: this._chargerFrames.idle.up,
                    left: this._chargerFrames.idle.left,
                    right: this._chargerFrames.idle.right
                },
                walk: {
                    down: this._chargerFrames.walk.down,
                    up: this._chargerFrames.walk.up,
                    left: this._chargerFrames.walk.left,
                    right: this._chargerFrames.walk.right
                }
            };
            this.cache[key] = sprites;
            return sprites;
        }

        const key = `enemySprites_${type}`;
        if (this.cache[key]) return this.cache[key];

        const sprites = {
            idle: {
                down: this.createEnemyFrame(type, 'down', 0),
                up: this.createEnemyFrame(type, 'up', 0),
                left: this.createEnemyFrame(type, 'left', 0),
                right: this.createEnemyFrame(type, 'right', 0)
            },
            walk: {
                down: [this.createEnemyFrame(type, 'down', 0), this.createEnemyFrame(type, 'down', 1)],
                up: [this.createEnemyFrame(type, 'up', 0), this.createEnemyFrame(type, 'up', 1)],
                left: [this.createEnemyFrame(type, 'left', 0), this.createEnemyFrame(type, 'left', 1)],
                right: [this.createEnemyFrame(type, 'right', 0), this.createEnemyFrame(type, 'right', 1)]
            }
        };

        this.cache[key] = sprites;
        return sprites;
    },

    createEnemyFrame(type, direction, frame) {
        // Bosses use larger canvases for cleaner scaling
        const bossTypes = new Set([
            'guardian', 'skeleton_king', 'spider_queen', 'golem', 'hydra', 'fire_lord', 'demon_lord', 'final_boss'
        ]);
        const isBoss = bossTypes.has(type);
        const size = isBoss ? 64 : 32;

        const { canvas, ctx } = this.createCanvas(size, size);
        const walkOffset = frame === 1 ? (isBoss ? 2 : 1) : 0;

        switch (type) {
            // Regular enemies
            case 'goblin':
                this.drawGoblin3D(ctx, direction, walkOffset);
                break;
            case 'skeleton':
                this.drawSkeleton3D(ctx, direction, walkOffset);
                break;
            case 'slime':
                this.drawSlime3D(ctx, direction, walkOffset);
                break;

            // Bosses
            case 'guardian':
            case 'golem':
                this.drawBossGuardian(ctx, direction, walkOffset, size);
                break;
            case 'skeleton_king':
                this.drawBossSkeletonKing(ctx, direction, walkOffset, size);
                break;
            case 'spider_queen':
            case 'hydra':
                this.drawBossBeast(ctx, direction, walkOffset, size);
                break;
            case 'fire_lord':
            case 'demon_lord':
                this.drawBossDemon(ctx, direction, walkOffset, size);
                break;
            case 'final_boss':
                this.drawBossCataclysm(ctx, direction, walkOffset, size);
                break;

            default:
                this.drawGoblin3D(ctx, direction, walkOffset);
        }

        return canvas;
    },

    // =============================================
    // BOSS SPRITES - Simple but readable 3D-ish
    // =============================================

    drawBossGuardian(ctx, direction, walkOffset, size) {
        const cx = size / 2;
        const cy = size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, size - 10, size * 0.28, size * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (stone armor)
        ctx.fillStyle = '#4e4e58';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6 + walkOffset, size * 0.22, size * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a6a78';
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy + 4 + walkOffset, size * 0.20, size * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crest / gem
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(cx, cy - 10 + walkOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(cx - 2, cy - 13 + walkOffset, 2, 2);

        // Eyes (directional)
        if (direction === 'down') {
            ctx.fillStyle = '#ff3d00';
            ctx.fillRect(cx - 10, cy - 2 + walkOffset, 4, 4);
            ctx.fillRect(cx + 6, cy - 2 + walkOffset, 4, 4);
        }

        // Shoulder plates
        ctx.fillStyle = '#3b3b44';
        ctx.fillRect(cx - 22, cy - 6 + walkOffset, 12, 12);
        ctx.fillRect(cx + 10, cy - 6 + walkOffset, 12, 12);
    },

    drawBossSkeletonKing(ctx, direction, walkOffset, size) {
        const cx = size / 2;
        const cy = size / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, size - 10, size * 0.26, size * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // Robe
        ctx.fillStyle = '#2d2d35';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10 + walkOffset, size * 0.22, size * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8 + walkOffset, size * 0.16, size * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 14, cy - 22 + walkOffset, 28, 6);
        ctx.fillRect(cx - 10, cy - 28 + walkOffset, 6, 6);
        ctx.fillRect(cx + 4, cy - 28 + walkOffset, 6, 6);

        // Eyes
        if (direction === 'down') {
            ctx.fillStyle = '#00e676';
            ctx.fillRect(cx - 8, cy - 12 + walkOffset, 4, 4);
            ctx.fillRect(cx + 4, cy - 12 + walkOffset, 4, 4);
        }

        // Staff
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(cx + 16, cy - 6 + walkOffset, 4, 32);
        ctx.fillStyle = '#7b4dff';
        ctx.beginPath();
        ctx.arc(cx + 18, cy - 10 + walkOffset, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBossBeast(ctx, direction, walkOffset, size) {
        const cx = size / 2;
        const cy = size / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, size - 10, size * 0.30, size * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chunky body
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8 + walkOffset, size * 0.24, size * 0.20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43a047';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy + 6 + walkOffset, size * 0.22, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes / legs
        ctx.fillStyle = '#1b5e20';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const rx = cx + Math.cos(a) * size * 0.24;
            const ry = cy + 8 + walkOffset + Math.sin(a) * size * 0.10;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(a) * 10, ry + Math.sin(a) * 10);
            ctx.lineTo(rx + Math.cos(a + 0.4) * 6, ry + Math.sin(a + 0.4) * 6);
            ctx.closePath();
            ctx.fill();
        }

        // Eyes
        if (direction === 'down') {
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(cx - 10, cy + 2 + walkOffset, 4, 4);
            ctx.fillRect(cx + 6, cy + 2 + walkOffset, 4, 4);
        }
    },

    drawBossDemon(ctx, direction, walkOffset, size) {
        const cx = size / 2;
        const cy = size / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, size - 10, size * 0.28, size * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8 + walkOffset, size * 0.22, size * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy + 6 + walkOffset, size * 0.20, size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy - 16 + walkOffset);
        ctx.lineTo(cx - 8, cy - 10 + walkOffset);
        ctx.lineTo(cx - 18, cy - 4 + walkOffset);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 16, cy - 16 + walkOffset);
        ctx.lineTo(cx + 8, cy - 10 + walkOffset);
        ctx.lineTo(cx + 18, cy - 4 + walkOffset);
        ctx.closePath();
        ctx.fill();

        // Eyes
        if (direction === 'down') {
            ctx.fillStyle = '#ffee58';
            ctx.fillRect(cx - 10, cy - 2 + walkOffset, 4, 4);
            ctx.fillRect(cx + 6, cy - 2 + walkOffset, 4, 4);
        }

        // Flame core
        ctx.fillStyle = 'rgba(255,87,34,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy + 6 + walkOffset, 8, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBossCataclysm(ctx, direction, walkOffset, size) {
        const cx = size / 2;
        const cy = size / 2;
        const t = Date.now() / 500;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, size - 10, size * 0.30, size * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer void shell
        ctx.fillStyle = '#1a0033';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8 + walkOffset, size * 0.24, size * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swirl core
        ctx.save();
        ctx.translate(cx, cy + 6 + walkOffset);
        ctx.rotate(t * 0.8);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * 18, Math.sin(a) * 18);
            grad.addColorStop(0, 'rgba(0,229,255,0.85)');
            grad.addColorStop(1, 'rgba(123,77,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 22, a - 0.25, a + 0.25);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Eyes
        if (direction === 'down') {
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(cx - 12, cy - 2 + walkOffset, 6, 6);
            ctx.fillRect(cx + 6, cy - 2 + walkOffset, 6, 6);
        }

        // Crown spikes
        ctx.fillStyle = '#00e5ff';
        for (let i = 0; i < 5; i++) {
            const x = cx - 18 + i * 9;
            ctx.beginPath();
            ctx.moveTo(x, cy - 22 + walkOffset);
            ctx.lineTo(x + 4.5, cy - 32 + walkOffset);
            ctx.lineTo(x + 9, cy - 22 + walkOffset);
            ctx.closePath();
            ctx.fill();
        }
    },

    drawGoblin3D(ctx, direction, walkOffset) {
        const green = '#4caf50';
        const greenDark = '#2e7d32';
        const greenLight = '#81c784';
        const eyeRed = '#f44336';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(16, 30, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (direction === 'down' || direction === 'up') {
            // Body 3D
            ctx.fillStyle = greenDark;
            ctx.beginPath();
            ctx.ellipse(16, 20 + walkOffset, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = green;
            ctx.beginPath();
            ctx.ellipse(15, 19 + walkOffset, 7, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = greenLight;
            ctx.beginPath();
            ctx.ellipse(13, 17 + walkOffset, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ears
            ctx.fillStyle = green;
            ctx.beginPath();
            ctx.moveTo(5, 12); ctx.lineTo(10, 16); ctx.lineTo(8, 10); ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(27, 12); ctx.lineTo(22, 16); ctx.lineTo(24, 10); ctx.closePath();
            ctx.fill();

            // Face
            if (direction === 'down') {
                ctx.fillStyle = eyeRed;
                ctx.beginPath(); ctx.arc(12, 16, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(20, 16, 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                this.pixel(ctx, 11, 15, '#fff');
                this.pixel(ctx, 19, 15, '#fff');
            }
        } else {
            // Side view
            ctx.fillStyle = greenDark;
            ctx.beginPath();
            ctx.ellipse(16, 20 + walkOffset, 6, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = green;
            ctx.beginPath();
            ctx.ellipse(direction === 'left' ? 15 : 17, 19 + walkOffset, 5, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ear
            ctx.fillStyle = green;
            const earX = direction === 'left' ? 8 : 24;
            ctx.beginPath();
            ctx.moveTo(earX, 10); ctx.lineTo(earX + (direction === 'left' ? 5 : -5), 15); ctx.lineTo(earX, 18); ctx.closePath();
            ctx.fill();

            // Eye
            const eyeX = direction === 'left' ? 12 : 20;
            ctx.fillStyle = eyeRed;
            ctx.beginPath(); ctx.arc(eyeX, 16, 2, 0, Math.PI * 2); ctx.fill();
        }
    },

    drawSkeleton3D(ctx, direction, walkOffset) {
        const bone = '#e8dcc4';
        const boneDark = '#c4b89a';
        const eyeBlue = '#4fc3f7';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(16, 30, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull 3D
        ctx.fillStyle = boneDark;
        ctx.beginPath();
        ctx.arc(16, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bone;
        ctx.beginPath();
        ctx.arc(15, 9, 7, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = bone;
        ctx.fillRect(14, 16 + walkOffset, 4, 12);

        // Ribs
        ctx.fillStyle = boneDark;
        ctx.fillRect(10, 18 + walkOffset, 12, 2);
        ctx.fillRect(10, 22 + walkOffset, 12, 2);

        if (direction === 'down') {
            // Eyes
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(13, 10, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(19, 10, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = eyeBlue;
            ctx.beginPath(); ctx.arc(13, 10, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(19, 10, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    },

    drawSlime3D(ctx, direction, walkOffset) {
        const slimeGreen = '#7cb342';
        const slimeDark = '#558b2f';
        const slimeLight = '#aed581';

        const squash = walkOffset ? 1 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(16, 28 + squash, 10 + squash, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body 3D blob
        ctx.fillStyle = slimeDark;
        ctx.beginPath();
        ctx.ellipse(16, 20 + squash, 10 + squash, 10 - squash * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = slimeGreen;
        ctx.beginPath();
        ctx.ellipse(15, 18 + squash, 9 + squash, 9 - squash * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = slimeLight;
        ctx.beginPath();
        ctx.ellipse(12, 14, 3, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        if (direction === 'down' || direction === 'left' || direction === 'right') {
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(12, 18, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(20, 18, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            this.pixel(ctx, 11, 17, '#fff');
            this.pixel(ctx, 19, 17, '#fff');
        }
    },

    // =============================================
    // TILES AND OTHER SPRITES
    // =============================================

    getProjectile(color = '#00e5ff') {
        const key = `proj_${color}`;
        if (this.cache[key]) return this.cache[key];

        const { canvas, ctx } = this.createCanvas(12, 12);

        // Glow
        const gradient = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '88');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 12, 12);

        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, 6, 2, 0, Math.PI * 2);
        ctx.fill();

        this.cache[key] = canvas;
        return canvas;
    },

    getChest(rarity = 'common') {
        const key = `chest_${rarity}`;
        if (this.cache[key]) return this.cache[key];

        const colors = {
            common: { main: '#8d6e63', accent: '#6d4c41', metal: '#9e9e9e' },
            rare: { main: '#1e88e5', accent: '#1565c0', metal: '#90caf9' },
            epic: { main: '#9c27b0', accent: '#7b1fa2', metal: '#ce93d8' },
            legendary: { main: '#ffd700', accent: '#ff8f00', metal: '#fff59d' }
        };
        const c = colors[rarity] || colors.common;

        const { canvas, ctx } = this.createCanvas(24, 20);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(12, 18, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base 3D
        ctx.fillStyle = c.accent;
        ctx.fillRect(2, 8, 20, 10);
        ctx.fillStyle = c.main;
        ctx.fillRect(3, 6, 18, 8);

        // Lid
        ctx.fillStyle = c.accent;
        ctx.beginPath();
        ctx.moveTo(2, 6); ctx.lineTo(12, 2); ctx.lineTo(22, 6); ctx.lineTo(2, 6);
        ctx.fill();
        ctx.fillStyle = c.main;
        ctx.beginPath();
        ctx.moveTo(3, 6); ctx.lineTo(12, 3); ctx.lineTo(21, 6); ctx.lineTo(3, 6);
        ctx.fill();

        // Lock
        ctx.fillStyle = c.metal;
        ctx.fillRect(10, 8, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(11, 10, 2, 1);

        this.cache[key] = canvas;
        return canvas;
    },

    getTile(type, biome = 'forest') {
        const key = `tile_${type}_${biome}`;
        if (this.cache[key]) return this.cache[key];

        const { canvas, ctx } = this.createCanvas(16, 16);
        const colors = this.getBiomeColors(biome);

        if (type === 'floor') {
            ctx.fillStyle = colors.floor;
            ctx.fillRect(0, 0, 16, 16);
            // Texture
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = colors.floorDark;
                this.pixel(ctx, Utils.random(0, 15), Utils.random(0, 15), colors.floorDark);
                ctx.fillStyle = colors.floorLight || colors.floor;
                this.pixel(ctx, Utils.random(0, 15), Utils.random(0, 15), colors.floorLight || colors.floor);
            }
        } else if (type === 'wall') {
            // 3D wall
            ctx.fillStyle = colors.wallDark;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = colors.wall;
            ctx.fillRect(0, 0, 16, 12);
            ctx.fillStyle = colors.wallLight || colors.wall;
            ctx.fillRect(1, 1, 14, 2);
        }

        this.cache[key] = canvas;
        return canvas;
    },

    getBiomeColors(biome) {
        const palettes = {
            forest: { floor: '#3a5c3a', floorDark: '#2d4a2d', floorLight: '#4a6d4a', wall: '#6d4c41', wallDark: '#4e342e', wallLight: '#8d6e63' },
            crypt: { floor: '#3d3d4a', floorDark: '#2a2a35', floorLight: '#4d4d5a', wall: '#5a5a6a', wallDark: '#404050', wallLight: '#6a6a7a' },
            crystal: { floor: '#2c2c3a', floorDark: '#1a1a2e', floorLight: '#3c3c4a', wall: '#5a4d7e', wallDark: '#4a3d6e', wallLight: '#7a6d9e' },
            volcano: { floor: '#4a3a3a', floorDark: '#3a2a2a', floorLight: '#5a4a4a', wall: '#6d4037', wallDark: '#5d3027', wallLight: '#8d6057' }
        };
        return palettes[biome] || palettes.forest;
    }
};

window.Sprites = Sprites;
