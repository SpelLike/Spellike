// ==========================================
// ARCANE DEPTHS - Utility Functions
// ==========================================

const Utils = {
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    rectCollision(r1, r2) {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    },
    circleCollision(c1, c2) {
        return this.distance(c1.x, c1.y, c2.x, c2.y) < c1.radius + c2.radius;
    },
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
};

class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    set(x, y) { this.x = x; this.y = y; return this; }
    clone() { return new Vector2(this.x, this.y); }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    multiply(s) { this.x *= s; this.y *= s; return this; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const l = this.length(); if (l > 0) { this.x /= l; this.y /= l; } return this; }
    angle() { return Math.atan2(this.y, this.x); }
    distanceTo(v) { return Utils.distance(this.x, this.y, v.x, v.y); }
    static fromAngle(angle, len = 1) { return new Vector2(Math.cos(angle) * len, Math.sin(angle) * len); }
}

window.Utils = Utils;
window.Vector2 = Vector2;
