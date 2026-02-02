// ==========================================
// ARCANE DEPTHS - Base Entity Class
// ==========================================

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.speed = 100;
        this.active = true;
        this.sprite = null;
        this.flipX = false;
        this.flashTimer = 0;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get bounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        if (this.flashTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = '#ffffff';
        }

        if (this.sprite) {
            if (this.flipX) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.sprite, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
            }
        } else {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }

    flash(duration = 0.1) { this.flashTimer = duration; }

    collidesWith(other) {
        return Utils.rectCollision(this.bounds, other.bounds);
    }

    distanceTo(other) {
        return Utils.distance(this.centerX, this.centerY, other.centerX, other.centerY);
    }

    angleTo(other) {
        return Utils.angle(this.centerX, this.centerY, other.centerX, other.centerY);
    }
}

window.Entity = Entity;
