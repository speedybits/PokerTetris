/*
 * AudioManager — a self-contained casino sound engine.
 *
 * Every sound is synthesized live with the Web Audio API, so the game stays a
 * single deployable page with zero binary assets. The palette is tuned to feel
 * like a real slot floor: chip clicks, coin cascades, celebratory chimes and a
 * warm ambient bed.
 *
 * iOS/iPadOS start every AudioContext in a "suspended" state until a real user
 * gesture resumes it, so unlock() is wired to the first touch/click.
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientNodes = null;
        this.unlocked = false;

        // Persisted preference (default: sound on).
        const stored = localStorage.getItem('cardtrisMuted');
        this.muted = stored === 'true';
    }

    /* Lazily build the audio graph. Safe to call repeatedly. */
    _ensureContext() {
        if (this.ctx) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;

        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1;
        this.sfxGain.connect(this.master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.master);

        return true;
    }

    /* Called on the first user gesture to satisfy mobile autoplay policies. */
    unlock() {
        if (this.unlocked) return;
        if (!this._ensureContext()) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // A one-sample silent blip primes the pipeline on stubborn browsers.
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);

        this.unlocked = true;
        if (!this.muted) this.startAmbient();
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('cardtrisMuted', this.muted);
        if (this.master) {
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, now, 0.05);
        }
        if (this.muted) {
            this.stopAmbient();
        } else {
            this._ensureContext();
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            this.startAmbient();
        }
        return this.muted;
    }

    /* ---- Low-level voice helpers ------------------------------------ */

    _now() { return this.ctx.currentTime; }

    /* A single enveloped oscillator note. */
    _tone(freq, start, dur, {
        type = 'sine', gain = 0.3, attack = 0.005, release = 0.08,
        detune = 0, dest = null, sweepTo = null
    } = {}) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
        osc.detune.value = detune;

        env.gain.setValueAtTime(0.0001, start);
        env.gain.exponentialRampToValueAtTime(gain, start + attack);
        env.gain.exponentialRampToValueAtTime(0.0001, start + dur + release);

        osc.connect(env);
        env.connect(dest || this.sfxGain);
        osc.start(start);
        osc.stop(start + dur + release + 0.02);
        return osc;
    }

    /* Short burst of filtered noise — great for chips, whooshes, shakers. */
    _noise(start, dur, {
        gain = 0.3, type = 'bandpass', freq = 1200, q = 1,
        sweepTo = null, dest = null
    } = {}) {
        const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
        const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(freq, start);
        if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
        filter.Q.value = q;

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, start);
        env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        src.connect(filter);
        filter.connect(env);
        env.connect(dest || this.sfxGain);
        src.start(start);
        src.stop(start + dur + 0.02);
    }

    /* A bright metallic coin "ting" (two detuned partials + click). */
    _coinTing(start, freq = 2400, gain = 0.22) {
        this._tone(freq, start, 0.05, { type: 'triangle', gain, release: 0.18 });
        this._tone(freq * 1.5, start, 0.04, { type: 'sine', gain: gain * 0.6, release: 0.16 });
        this._noise(start, 0.03, { gain: gain * 0.5, type: 'highpass', freq: 5000 });
    }

    _guard() {
        if (this.muted) return false;
        if (!this._ensureContext()) return false;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    }

    /* ---- Public game sounds ----------------------------------------- */

    move() {
        if (!this._guard()) return;
        const t = this._now();
        this._tone(660, t, 0.02, { type: 'square', gain: 0.08, release: 0.03 });
    }

    land() {
        if (!this._guard()) return;
        const t = this._now();
        // Soft felt "tap": low body + tiny click.
        this._tone(180, t, 0.05, { type: 'sine', gain: 0.22, sweepTo: 90, release: 0.06 });
        this._noise(t, 0.03, { gain: 0.12, type: 'lowpass', freq: 900 });
    }

    drop() {
        if (!this._guard()) return;
        const t = this._now();
        // Descending whoosh.
        this._noise(t, 0.18, { gain: 0.16, type: 'bandpass', freq: 1800, sweepTo: 300, q: 0.8 });
        this._tone(420, t, 0.14, { type: 'sawtooth', gain: 0.08, sweepTo: 140, release: 0.05 });
    }

    button() {
        if (!this._guard()) return;
        const t = this._now();
        this._tone(880, t, 0.03, { type: 'square', gain: 0.12, release: 0.05 });
        this._tone(1320, t + 0.02, 0.03, { type: 'square', gain: 0.08, release: 0.05 });
    }

    invalid() {
        if (!this._guard()) return;
        const t = this._now();
        this._tone(200, t, 0.12, { type: 'sawtooth', gain: 0.12, sweepTo: 150, release: 0.06 });
        this._tone(150, t + 0.04, 0.12, { type: 'sawtooth', gain: 0.1, sweepTo: 110, release: 0.06 });
    }

    /* A cascade of coins — length/brightness scale with the payout. */
    coinCascade(count = 8, spread = 0.5) {
        if (!this._guard()) return;
        const t = this._now();
        const n = Math.max(3, Math.min(count, 26));
        for (let i = 0; i < n; i++) {
            const when = t + Math.random() * spread + i * (spread / n) * 0.6;
            const freq = 1800 + Math.random() * 1600;
            this._coinTing(when, freq, 0.14 + Math.random() * 0.08);
        }
    }

    /*
     * Win jingle keyed to the hand rank (0 = smallest .. 8 = royal flush).
     * Bigger hands get longer, brighter ascending arpeggios plus coins.
     */
    win(rank = 0) {
        if (!this._guard()) return;
        const t = this._now();

        // Major-scale arpeggios, escalating with rank.
        const scales = [
            [523.25, 659.25, 783.99],                                   // pair
            [523.25, 659.25, 783.99, 1046.5],                           // two pair
            [523.25, 659.25, 783.99, 1046.5, 1318.5],                   // trips
            [392, 523.25, 659.25, 783.99, 1046.5],                      // straight
            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568],             // flush
            [392, 523.25, 659.25, 783.99, 1046.5, 1318.5],              // full house
            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093],       // quads
            [392, 493.88, 587.33, 783.99, 987.77, 1174.7, 1568],        // straight flush
            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093, 2637]  // royal flush
        ];
        const notes = scales[Math.max(0, Math.min(rank, scales.length - 1))];
        const step = rank >= 6 ? 0.09 : 0.075;

        notes.forEach((f, i) => {
            const when = t + i * step;
            this._tone(f, when, 0.14, { type: 'triangle', gain: 0.22, release: 0.2 });
            this._tone(f * 2, when, 0.1, { type: 'sine', gain: 0.08, release: 0.15 });
        });

        // Coins rain in behind the melody.
        this.coinCascade(5 + rank * 2, 0.35 + rank * 0.06);

        // Sparkle shimmer on top for the big ones.
        if (rank >= 4) {
            for (let i = 0; i < 6 + rank; i++) {
                this._coinTing(t + 0.2 + Math.random() * (0.5 + rank * 0.1),
                    2600 + Math.random() * 2200, 0.08);
            }
        }

        // Royal / straight flush get a triumphant sustained chord + gong.
        if (rank >= 7) {
            const chordStart = t + notes.length * step;
            [523.25, 659.25, 783.99, 1046.5].forEach(f =>
                this._tone(f, chordStart, 0.6, { type: 'triangle', gain: 0.14, release: 0.5 }));
            this._tone(130.81, chordStart, 0.9, { type: 'sine', gain: 0.18, release: 0.6 });
        }
    }

    jackpot() {
        // Alias for the biggest celebration.
        this.win(8);
    }

    levelUp() {
        if (!this._guard()) return;
        const t = this._now();
        // Rising fanfare.
        const notes = [392, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => {
            this._tone(f, t + i * 0.08, 0.16, { type: 'triangle', gain: 0.2, release: 0.2 });
        });
        // Shimmer sweep.
        this._noise(t, 0.5, { gain: 0.08, type: 'bandpass', freq: 600, sweepTo: 6000, q: 0.7 });
        this.coinCascade(6, 0.5);
    }

    gameOver() {
        if (!this._guard()) return;
        const t = this._now();
        // Gentle descending "aww".
        const notes = [659.25, 523.25, 415.30, 329.63];
        notes.forEach((f, i) => {
            this._tone(f, t + i * 0.18, 0.3, { type: 'triangle', gain: 0.18, release: 0.25 });
        });
    }

    /* ---- Ambient casino bed ----------------------------------------- */

    startAmbient() {
        // Ambient bed intentionally disabled: the sustained oscillator pad read
        // as a constant droning hum. The gameplay SFX (chips, coins, win chimes)
        // carry the casino feel on their own.
    }

    stopAmbient() {
        if (!this.ambientNodes) return;
        if (this.ambientNodes.sparkle) clearInterval(this.ambientNodes.sparkle);
        this.ambientNodes = null;
    }
}

// Global instance, mirroring the existing `highScores` pattern.
const audio = new AudioManager();
