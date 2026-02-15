// ==========================================
// ARCANE DEPTHS - Floating Texts System
// ==========================================

class FloatingText {
    constructor(x, y, text, config = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = config.life || 1.5;
        this.maxLife = this.life;
        this.vy = config.vy || -30;
        this.color = config.color || '#ffffff';
        this.fontSize = config.fontSize || 16;
        this.bold = config.bold || false;
        this.outline = config.outline !== false;
        this.flash = config.flash || false; // titilante
        this.flashSpeed = config.flashSpeed || 6;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.vy *= 0.95; // slow down
        this.life -= dt;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife);
        
        // Flash effect (titilante)
        let flashAlpha = 1;
        if (this.flash) {
            flashAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.01 * this.flashSpeed);
        }
        
        ctx.save();
        ctx.globalAlpha = alpha * flashAlpha;
        ctx.font = `${this.bold ? 'bold ' : ''}${this.fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outline
        if (this.outline) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.text, Math.floor(this.x), Math.floor(this.y));
        }
        
        // Text
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, Math.floor(this.x), Math.floor(this.y));
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

const FloatingTextSystem = {
    texts: [],
    maxTexts: 50,

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update(dt);
            if (this.texts[i].isDead()) {
                this.texts.splice(i, 1);
            }
        }
    },

    draw(ctx) {
        for (const text of this.texts) {
            text.draw(ctx);
        }
    },

    add(x, y, text, config = {}) {
        if (this.texts.length >= this.maxTexts) {
            this.texts.shift(); // remove oldest
        }
        this.texts.push(new FloatingText(x, y, text, config));
    },

    // ===== PRESETS =====
    
    critical(x, y) {
        this.add(x, y, (window.i18n ? i18n.t('critPopup') : 'CRIT!'), {
            color: '#ffff00',
            fontSize: 16,
            bold: true,
            flash: true,
            flashSpeed: 8,
            vy: -40,
            life: 1.2
        });
    },

    damage(x, y, amount) {
        this.add(x, y, `-${Math.floor(amount)}`, {
            color: '#ff6666',
            fontSize: 14,
            vy: -35
        });
    },

    heal(x, y, amount) {
        this.add(x, y, `+${Math.floor(amount)}`, {
            color: '#66ff66',
            fontSize: 14,
            vy: -35
        });
    },

    gold(x, y, amount) {
        this.add(x, y, `+${amount}💰`, {
            color: '#ffd700',
            fontSize: 14,
            vy: -30,
            life: 1.2
        });
    },

    mana(x, y, amount) {
        this.add(x, y, `+${amount}💧`, {
            color: '#00d4ff',
            fontSize: 14,
            vy: -30,
            life: 1.2
        });
    },

    synergy(x, y, name) {
        this.add(x, y, `${i18n.t('toastSynergy')} ${name}`, {
            color: '#ff00ff',
            fontSize: 16,
            bold: true,
            flash: true,
            flashSpeed: 5,
            vy: -25,
            life: 2.0
        });
    },

    custom(x, y, text, color = '#ffffff', fontSize = 14) {
        this.add(x, y, text, { color, fontSize });
    },

    clear() {
        this.texts = [];
    }
};

window.FloatingText = FloatingText;
window.FloatingTextSystem = FloatingTextSystem;