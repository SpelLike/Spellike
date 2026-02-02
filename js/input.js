// ==========================================
// ARCANE DEPTHS - Input System (FIXED)
// ==========================================

const Input = {
    keys: {},
    keysJustPressed: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, clickX: 0, clickY: 0 },
    mouseButtons: {},
    mouseJustPressed: {},
    lastClickPosition: { x: 0, y: 0 },

    init() {
        document.addEventListener('keydown', e => {
            try { if (window.AudioManager) AudioManager.userGesture(); } catch (e) {}
            if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
            this.keys[e.code] = true;
        });
        document.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
        document.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        document.addEventListener('mousedown', e => {
            try { if (window.AudioManager) AudioManager.userGesture(); } catch (e) {}
            if (!this.mouseButtons[e.button]) {
                this.mouseJustPressed[e.button] = true;
                // Store click position for shooting
                this.lastClickPosition.x = e.clientX;
                this.lastClickPosition.y = e.clientY;
            }
            this.mouseButtons[e.button] = true;
        });
        document.addEventListener('mouseup', e => {
            this.mouseButtons[e.button] = false;
        });
        document.addEventListener('contextmenu', e => e.preventDefault());
    },

    update() {
        this.keysJustPressed = {};
        this.mouseJustPressed = {};
    },

    isKeyDown(code) { return !!this.keys[code]; },
    isKeyJustPressed(code) { return !!this.keysJustPressed[code]; },
    isMouseDown(button = 0) { return !!this.mouseButtons[button]; },
    isMouseJustPressed(button = 0) { return !!this.mouseJustPressed[button]; },

    getMovementVector() {
        const v = new Vector2();
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) v.y -= 1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) v.y += 1;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) v.x -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) v.x += 1;
        return v.normalize();
    },

    // Get angle to current mouse position
    getAimAngle(playerScreenX, playerScreenY) {
        return Utils.angle(playerScreenX, playerScreenY, this.mouse.x, this.mouse.y);
    },

    // Get the world position of the mouse given canvas scale
    getMouseWorldPosition(scale, canvasRect) {
        return {
            x: (this.mouse.x - canvasRect.left) / scale,
            y: (this.mouse.y - canvasRect.top) / scale
        };
    },

    // Get movement direction for animation
    getMovementDirection() {
        const v = this.getMovementVector();
        if (!v || v.length() < 0.1) return null;

        // 8-direction movement for better player animation.
        // Note: we keep classic names for cardinals (up/down/left/right)
        // and use hyphenated names for diagonals (north-east, etc.).
        const ang = Math.atan2(v.y, v.x) * 180 / Math.PI; // -180..180, y+ is down

        // Sector size = 45deg. Boundaries at +/-22.5, 67.5, 112.5, 157.5
        if (ang >= -22.5 && ang < 22.5) return 'right';
        if (ang >= 22.5 && ang < 67.5) return 'south-east';
        if (ang >= 67.5 && ang < 112.5) return 'down';
        if (ang >= 112.5 && ang < 157.5) return 'south-west';
        if (ang >= 157.5 || ang < -157.5) return 'left';
        if (ang >= -157.5 && ang < -112.5) return 'north-west';
        if (ang >= -112.5 && ang < -67.5) return 'up';
        if (ang >= -67.5 && ang < -22.5) return 'north-east';

        return null;
    }
};

window.Input = Input;
