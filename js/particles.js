// ==========================================
// ARCANE DEPTHS - Particle System
// ==========================================

class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.size = config.size || 2;
        this.color = config.color || '#ffffff';
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        this.shrink = config.shrink !== false;
        this.fadeOut = config.fadeOut !== false;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += this.gravity * dt * 60;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt;
    }

    draw(ctx) {
        const alpha = this.fadeOut ? this.life / this.maxLife : 1;
        const size = this.shrink ? this.size * (this.life / this.maxLife) : this.size;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x - size / 2), Math.floor(this.y - size / 2), Math.ceil(size), Math.ceil(size));
        ctx.globalAlpha = 1;
    }

    isDead() { return this.life <= 0; }
}

const ParticleSystem = {
    particles: [],
    maxParticles: 500,

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    },

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    },

    emit(x, y, config = {}, count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) return;
            this.particles.push(new Particle(x, y, { ...config }));
        }
    },

    burst(x, y, count, config = {}) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) return;
            const angle = (Math.PI * 2 / count) * i + Utils.randomFloat(-0.2, 0.2);
            const speed = config.speed || Utils.randomFloat(1, 3);
            this.particles.push(new Particle(x, y, {
                ...config,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            }));
        }
    },

    // Preset effects
    hit(x, y, color = '#ffffff') {
        this.burst(x, y, 8, { color, life: 0.3, size: 3, speed: 2, friction: 0.9 });
    },

    death(x, y, color = '#ff0000') {
        this.burst(x, y, 20, { color, life: 0.5, size: 4, speed: 3, gravity: 0.1, friction: 0.95 });
    },

    dash(x, y, color = '#7b4dff') {
        for (let i = 0; i < 5; i++) {
            this.emit(x + Utils.randomFloat(-5, 5), y + Utils.randomFloat(-5, 5), {
                color, life: 0.2, size: 4, vx: 0, vy: 0
            });
        }
    },

    magic(x, y, color = '#00e5ff') {
        this.emit(x + Utils.randomFloat(-3, 3), y + Utils.randomFloat(-3, 3), {
            color, life: 0.4, size: 2, vy: -1, friction: 0.98
        });
    },

    explosion(x, y, color = '#ff9800', radius = 30) {
        this.burst(x, y, 30, { color, life: 0.4, size: 5, speed: radius / 10, friction: 0.92 });
        this.burst(x, y, 15, { color: '#ffeb3b', life: 0.3, size: 3, speed: radius / 15, friction: 0.9 });
    },

    clear() { this.particles = []; }
};

window.Particle = Particle;
window.ParticleSystem = ParticleSystem;
