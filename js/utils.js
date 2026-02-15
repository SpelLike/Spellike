// ==========================================
// ARCANE DEPTHS - Utility Functions
// ==========================================

const Utils = {
    // ===== SEEDED RNG =====
    // Simple hash function to convert string to number
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    },
    
    // Mulberry32 - Fast seeded random generator
    createSeededRNG(seed) {
        let state = typeof seed === 'string' ? this.hashString(seed) : seed;
        return function() {
            state = (state + 0x6D2B79F5) | 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },
    
    // Seeded versions of random functions
    seededRandom(rng, min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
    },
    seededRandomFloat(rng, min, max) {
        return rng() * (max - min) + min;
    },
    seededChoice(rng, array) {
        return array[Math.floor(rng() * array.length)];
    },
    seededShuffle(rng, array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },
    
    // ===== REGULAR RNG (unchanged) =====
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
    },

    // ------------------------------
    // Loot / Shop filters (caps)
    // ------------------------------
    countRune(player, runeId) {
        if (!player || !Array.isArray(player.runes)) return 0;
        return player.runes.reduce((acc, r) => acc + ((r && r.id === runeId) ? 1 : 0), 0);
    },
    isFireRateCapped(player) {
        try {
            if (!player || typeof player.getEffectiveFireRate !== 'function') return false;
            const base = player.fireRate || 0;
            const eff = player.getEffectiveFireRate();
            // Cap is x2 speed => half interval
            return eff <= (base * 0.5 + 1e-6);
        } catch (e) { return false; }
    },
    _isPureBonusObject(obj, allowedKey) {
        if (!obj) return false;
        const ignore = new Set([
            'id','name','icon','desc','rarity','type','shopOnly',
            'programmable','programmed','scriptText','script','price'
        ]);
        const keys = Object.keys(obj).filter(k => !ignore.has(k));
        return keys.length === 1 && keys[0] === allowedKey;
    },
    isPureFireRateRune(rune) {
        return this._isPureBonusObject(rune, 'fireRateBonus');
    },
    isPureFireRateItem(item) {
        return this._isPureBonusObject(item, 'fireRateBonus');
    },
    shouldExcludeRune(rune, player) {
        if (!rune) return false;
        // Void Touch max stacks = 2
        if (rune.id === 'void_touch' && this.countRune(player, 'void_touch') >= 2) return true;

        // Fire rate cap: exclude ONLY pure fire rate runes
        if (this.isFireRateCapped(player) && this.isPureFireRateRune(rune)) return true;

        return false;
    },
    shouldExcludeItem(item, player) {
        if (!item) return false;

        // Item Sets: never offer the same set piece twice in the same run.
        // Only applies to items that belong to a set (setId).
        try {
            if (item.setId && player && Array.isArray(player.passiveItems)) {
                const has = player.passiveItems.some(p => p && p.id === item.id);
                if (has) return true;
            }
        } catch (e) { }

        // Fire rate cap: exclude ONLY pure fire rate items
        if (this.isFireRateCapped(player) && this.isPureFireRateItem(item)) return true;

        return false;
    },
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
