/*
 * EffectsManager — a lightweight canvas particle system that layers casino
 * "juice" on top of the DOM board: splashing gold coins, confetti bursts,
 * sparkle stars, floating score popups and a screen-shake driver.
 *
 * Everything is drawn on a single full-screen <canvas id="fx-canvas"> that sits
 * above the board but ignores pointer events, so gameplay is untouched.
 */
class EffectsManager {
    constructor() {
        this.canvas = document.getElementById('fx-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.dpr = Math.min(window.devicePixelRatio || 1, 3);
        this.running = false;
        this.lastTime = 0;

        this.shake = { time: 0, duration: 0, magnitude: 0 };
        this.shakeTarget = document.getElementById('game-container');

        this._resize = this._resize.bind(this);
        this._loop = this._loop.bind(this);

        if (this.canvas) {
            this._resize();
            window.addEventListener('resize', this._resize);
            window.addEventListener('orientationchange', () => setTimeout(this._resize, 200));
        }
    }

    _resize() {
        if (!this.canvas) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.floor(w * this.dpr);
        this.canvas.height = Math.floor(h * this.dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.W = w;
        this.H = h;
    }

    _start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = 0;
        requestAnimationFrame(this._loop);
    }

    _loop(ts) {
        if (!this.lastTime) this.lastTime = ts;
        const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;

        this.ctx.clearRect(0, 0, this.W, this.H);
        this._updateShake(dt);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt, this);
            p.draw(this.ctx);
            if (p.dead) this.particles.splice(i, 1);
        }

        if (this.particles.length > 0 || this.shake.time < this.shake.duration) {
            requestAnimationFrame(this._loop);
        } else {
            this.running = false;
        }
    }

    /* ---- Public API -------------------------------------------------- */

    /*
     * Burst of coins that splash upward out of (x, y) then fall under gravity
     * and bounce along the bottom of the screen. `amount` scales the count.
     */
    coinSplash(x, y, amount = 12, power = 1) {
        const n = Math.max(4, Math.min(Math.round(amount), 40));
        for (let i = 0; i < n; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
            const speed = (260 + Math.random() * 320) * power;
            this.particles.push(new Coin(
                x + (Math.random() - 0.5) * 24,
                y + (Math.random() - 0.5) * 24,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
        }
        this._start();
    }

    /* A quick sparkle star burst at a point. */
    sparkle(x, y, count = 10, color = '#fff6b0') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 200;
            this.particles.push(new Spark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color
            ));
        }
        this._start();
    }

    /* Confetti raining from the top of the screen. */
    confetti(count = 90) {
        const colors = ['#ffd700', '#ff00de', '#00e5ff', '#7CFC00', '#ff4d4d', '#ffffff', '#ff9900'];
        for (let i = 0; i < count; i++) {
            this.particles.push(new Confetti(
                Math.random() * this.W,
                -20 - Math.random() * this.H * 0.4,
                colors[(Math.random() * colors.length) | 0]
            ));
        }
        this._start();
    }

    /* A full-screen shower of coins (used for jackpots / royal flush). */
    coinShower(count = 40) {
        for (let i = 0; i < count; i++) {
            const c = new Coin(
                Math.random() * this.W,
                -20 - Math.random() * this.H * 0.5,
                (Math.random() - 0.5) * 80,
                40 + Math.random() * 120
            );
            this.particles.push(c);
        }
        this._start();
    }

    /* Floating "+points" text that drifts up and fades. */
    floatText(x, y, text, color = '#ffd700', size = 34) {
        this.particles.push(new FloatText(x, y, text, color, size));
        this._start();
    }

    screenShake(magnitude = 10, duration = 0.4) {
        this.shake.magnitude = Math.max(this.shake.magnitude, magnitude);
        this.shake.duration = duration;
        this.shake.time = 0;
        this._start();
    }

    _updateShake(dt) {
        if (!this.shakeTarget) return;
        if (this.shake.time < this.shake.duration) {
            this.shake.time += dt;
            const decay = 1 - this.shake.time / this.shake.duration;
            const m = this.shake.magnitude * decay;
            const dx = (Math.random() - 0.5) * 2 * m;
            const dy = (Math.random() - 0.5) * 2 * m;
            this.shakeTarget.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (this.shakeTarget.style.transform) {
            this.shakeTarget.style.transform = '';
        }
    }

    /* Convenience: centre point of a board cell in viewport coordinates. */
    cellCenter(x, y) {
        const cell = document.querySelector(`.card-cell[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return null;
        const r = cell.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
}

/* ---- Particle types --------------------------------------------------- */

class Coin {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.r = 9 + Math.random() * 7;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 16;
        this.life = 0;
        this.maxLife = 1.8 + Math.random() * 1.2;
        this.bounces = 0;
        this.dead = false;
    }

    update(dt, mgr) {
        this.life += dt;
        this.vy += 1400 * dt;          // gravity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.spin += this.spinSpeed * dt;

        // Bounce off the floor a couple of times, then let them fall away.
        const floor = mgr.H - 6;
        if (this.y > floor && this.vy > 0 && this.bounces < 2) {
            this.y = floor;
            this.vy *= -0.42;
            this.vx *= 0.6;
            this.bounces++;
        }
        if (this.life > this.maxLife || this.y > mgr.H + 40) this.dead = true;
    }

    draw(ctx) {
        const fade = this.life > this.maxLife - 0.5
            ? Math.max(0, (this.maxLife - this.life) / 0.5) : 1;
        // Spinning is faked by squashing the horizontal radius.
        const rx = Math.abs(Math.cos(this.spin)) * this.r + 1;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(this.x, this.y);

        const grd = ctx.createRadialGradient(-rx * 0.3, -this.r * 0.3, 1, 0, 0, this.r);
        grd.addColorStop(0, '#fff6c0');
        grd.addColorStop(0.5, '#ffdf5e');
        grd.addColorStop(1, '#d99a1c');

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, this.r, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#b8791a';
        ctx.stroke();

        // Inner rim + shine to sell the metal.
        if (rx > 3) {
            ctx.beginPath();
            ctx.ellipse(0, 0, rx * 0.62, this.r * 0.62, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#a9700f';
            ctx.font = `bold ${this.r}px Georgia, serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, this.r * 0.06);
        }
        ctx.restore();
    }
}

class Spark {
    constructor(x, y, vx, vy, color) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.life = 0;
        this.maxLife = 0.5 + Math.random() * 0.5;
        this.size = 2 + Math.random() * 3;
        this.dead = false;
    }

    update(dt) {
        this.life += dt;
        this.vy += 300 * dt;
        this.vx *= 0.96;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.life > this.maxLife) this.dead = true;
    }

    draw(ctx) {
        const a = Math.max(0, 1 - this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        const s = this.size * (0.5 + a * 0.5);
        ctx.beginPath();
        ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Confetti {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 120;
        this.vy = 120 + Math.random() * 160;
        this.color = color;
        this.w = 6 + Math.random() * 6;
        this.h = 9 + Math.random() * 8;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 12;
        this.sway = Math.random() * Math.PI * 2;
        this.life = 0;
        this.maxLife = 3 + Math.random() * 1.5;
        this.dead = false;
    }

    update(dt, mgr) {
        this.life += dt;
        this.sway += dt * 4;
        this.x += (this.vx + Math.sin(this.sway) * 40) * dt;
        this.y += this.vy * dt;
        this.rot += this.rotSpeed * dt;
        if (this.life > this.maxLife || this.y > mgr.H + 30) this.dead = true;
    }

    draw(ctx) {
        const fade = this.life > this.maxLife - 0.8
            ? Math.max(0, (this.maxLife - this.life) / 0.8) : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.color;
        // Slight flip via scaleY for a fluttering feel.
        ctx.scale(1, Math.cos(this.sway * 1.5));
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

class FloatText {
    constructor(x, y, text, color, size) {
        this.x = x; this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 0;
        this.maxLife = 1.6;
        this.dead = false;
        this.scale = 0.4;
    }

    update(dt) {
        this.life += dt;
        this.y -= 46 * dt;
        // Quick pop-in then settle.
        const t = this.life / this.maxLife;
        this.scale = t < 0.2 ? 0.4 + (t / 0.2) * 0.7 : 1.1 - (t - 0.2) * 0.1;
        if (this.life > this.maxLife) this.dead = true;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        const a = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.font = `bold ${this.size}px 'Arial Black', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(this.text, 0, 0);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 16;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// Global instance (initialised after DOM is ready, see game.js).
let effects = null;
