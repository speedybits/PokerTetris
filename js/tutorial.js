/*
 * Tutorial — an interactive, dismissible walkthrough that replaces the old
 * static "How To Play" screen.
 *
 * Design goals:
 *   - Almost no text: one short prompt line per step, one short "done" line.
 *   - Teach with motion: an animated guide hand points at the gesture, and the
 *     card visibly falls when it drops.
 *   - Same controls as the real game: tap the board to slide the card, and a
 *     Quick Drop button to drop it.
 *
 * Steps: steer → row → column → wild Joker → X blocker → play. It reuses the
 * game's .card / .card-cell styles and the shared `effects` / `audio` engines,
 * and remembers when it has been seen (localStorage) so it isn't forced on
 * returning players.
 */
class Tutorial {
    constructor(game) {
        this.game = game;
        this.cols = 5;
        this.rows = 8;            // per-step, set in _setupStep
        this.step = 0;
        this.solved = false;
        this.locked = false;
        this.cur = null;          // falling card: { card, x, y }
        this.fallTimer = null;
        this.grid = [];
        this.stepDef = null;
        this.steps = this._buildSteps();

        this.screen = document.getElementById('tutorial-screen');
        this.promptEl = this.screen.querySelector('.tutorial-prompt');
        this.boardEl = document.getElementById('tutorial-board');
        this.progressEl = this.screen.querySelector('.tutorial-progress');
        this.controlsEl = document.getElementById('tutorial-controls');
        this.dropBtn = document.getElementById('tutorial-drop');
        this.prevBtn = document.getElementById('tutorial-prev');
        this.nextBtn = document.getElementById('tutorial-next');
        this.skipBtn = this.screen.querySelector('.tutorial-skip');
        this.hand = document.getElementById('tutorial-hand');

        this._wire();
    }

    static seen() {
        return localStorage.getItem('cardtrisTutorialSeen') === 'true';
    }

    _wire() {
        this.skipBtn.addEventListener('click', () => { audio.button(); this.close(); });
        this.prevBtn.addEventListener('click', () => { audio.button(); this.go(this.step - 1); });
        this.nextBtn.addEventListener('click', () => {
            if (this.nextBtn.disabled) return;
            audio.button();
            if (this.step >= this.steps.length - 1) this.finish();
            else this.go(this.step + 1);
        });

        const drop = (e) => { if (e) e.preventDefault(); this._quickDrop(); };
        this.dropBtn.addEventListener('click', drop);
        this.dropBtn.addEventListener('touchstart', drop, { passive: false });

        this.boardEl.addEventListener('click', (e) => this._tapMove(e.clientX));
        this.boardEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches && e.touches[0]) this._tapMove(e.touches[0].clientX);
        }, { passive: false });
    }

    /* ---- lifecycle -------------------------------------------------- */

    open() {
        audio.unlock();
        this.step = 0;
        this.game.showScreen('tutorial-screen');
        this.render();
    }

    close() {
        this._stopFall();
        this._hideHand();
        localStorage.setItem('cardtrisTutorialSeen', 'true');
        this.game.showScreen('start-screen');
    }

    finish() {
        this._stopFall();
        this._hideHand();
        localStorage.setItem('cardtrisTutorialSeen', 'true');
        this.game.startGame();
    }

    go(i) {
        this.step = Math.max(0, Math.min(i, this.steps.length - 1));
        this.render();
    }

    /* ---- rendering -------------------------------------------------- */

    render() {
        this._stopFall();
        const s = this.steps[this.step];
        this.stepDef = s;
        this.solved = !s.interactive;
        this.locked = false;
        this.cur = null;

        this.promptEl.className = 'tutorial-prompt';
        this.promptEl.innerHTML = s.prompt || '';
        this.progressEl.textContent = `${this.step + 1} / ${this.steps.length}`;
        this.prevBtn.style.visibility = this.step === 0 ? 'hidden' : 'visible';
        this.controlsEl.style.visibility =
            (s.interactive && s.showDrop !== false) ? 'visible' : 'hidden';

        this._setupStep(s);
        this._updateNext(s);
        if (s.interactive) this._showHand(s); else this._hideHand();
    }

    _updateNext(s) {
        const last = this.step >= this.steps.length - 1;
        this.nextBtn.textContent = last ? 'Play ▶' : 'Next ›';
        const waiting = s.interactive && !this.solved;
        this.nextBtn.disabled = waiting;
        this.nextBtn.classList.toggle('waiting', waiting);
    }

    _setupStep(s) {
        this.rows = s.rows || 8;
        this.boardEl.style.setProperty('--rows', this.rows);
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.boardEl.innerHTML = '';
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'card-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.boardEl.appendChild(cell);
            }
        }

        (s.cards || []).forEach(c => { this.grid[c.y][c.x] = new Card(c.suit, c.value); });

        this._clearHighlight();
        if (s.interactive) {
            if (s.targetColumn != null) this._highlightColumn(s.targetColumn);
            this.cur = { card: new Card(s.spawn.suit, s.spawn.value), x: s.spawn.startX, y: 0 };
            this._drawBoard();
            // Movement / X steps descend on their own; hand steps hover and wait
            // for Quick Drop.
            if (s.autoFall) {
                setTimeout(() => { if (this.cur && !this.locked) this._startFall(s.fast ? 220 : 1000); }, 550);
            }
        } else {
            this._drawBoard();
        }
    }

    _drawBoard() {
        const cells = this.boardEl.querySelectorAll('.card-cell');
        cells.forEach(c => (c.innerHTML = ''));
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x]) this._placeCard(x, y, this.grid[y][x]);
            }
        }
        if (this.cur) {
            const el = this._placeCard(this.cur.x, this.cur.y, this.cur.card);
            el.classList.add('tut-active');
        }
    }

    _placeCard(x, y, card) {
        const cell = this._cell(x, y);
        const div = document.createElement('div');
        const classes = ['card'];
        if (card.isRed()) classes.push('red');
        if (card.isJoker()) classes.push('joker');
        if (card.isX()) classes.push('x');
        div.className = classes.join(' ');
        div.innerHTML = card.toString();
        cell.appendChild(div);
        return div;
    }

    _cell(x, y) {
        return this.boardEl.querySelector(`.card-cell[data-x="${x}"][data-y="${y}"]`);
    }

    _cardEl(x, y) {
        const cell = this._cell(x, y);
        return cell ? cell.querySelector('.card') : null;
    }

    _highlightColumn(x) {
        for (let y = 0; y < this.rows; y++) {
            const cell = this._cell(x, y);
            if (cell) cell.classList.add('tut-target');
        }
    }

    _clearHighlight() {
        this.boardEl.querySelectorAll('.tut-target').forEach(c => c.classList.remove('tut-target'));
    }

    /* ---- controls --------------------------------------------------- */

    _tapMove(clientX) {
        if (!this.cur || this.locked) return;
        const rect = this.boardEl.getBoundingClientRect();
        const col = Math.floor(((clientX - rect.left) / rect.width) * this.cols);
        if (col < 0 || col >= this.cols) return;

        if (this.stepDef.movable === false) {
            audio.invalid();
            this._nudge(this.stepDef.blockHint || 'It can’t be moved!');
            return;
        }

        const dir = col > this.cur.x ? 1 : col < this.cur.x ? -1 : 0;
        if (dir === 0) return;
        const nx = this.cur.x + dir;
        if (nx >= 0 && nx < this.cols && this.grid[this.cur.y][nx] === null) {
            this.cur.x = nx;
            audio.move();
            this.game.haptic(8);
            this._hideHand();
            this._drawBoard();

            // Steering step: no time pressure — once it's over the target
            // column, drop it in.
            if (this.stepDef.kind === 'move' && this.cur.x === this.stepDef.targetColumn) {
                this._dropIntoTarget();
            }
        }
    }

    _dropIntoTarget() {
        this.locked = true;
        setTimeout(() => { if (this.cur) this._slamDown(); }, 220);
    }

    _quickDrop() {
        if (!this.cur || this.locked) return;
        this._hideHand();
        this._slamDown();
    }

    /* Animate the card falling one row at a time so the drop is clearly seen. */
    _slamDown() {
        this.locked = true;
        audio.drop();
        const stepDown = () => {
            if (!this.cur) return;
            if (this.cur.y + 1 < this.rows && this.grid[this.cur.y + 1][this.cur.x] === null) {
                this.cur.y++;
                this._drawBoard();
                setTimeout(stepDown, 50);
            } else {
                this._lock();
            }
        };
        stepDown();
    }

    _startFall(interval) {
        this._stopFall();
        this.fallTimer = setInterval(() => this._fallTick(), interval);
    }

    _stopFall() {
        if (this.fallTimer) { clearInterval(this.fallTimer); this.fallTimer = null; }
    }

    _fallTick() {
        if (!this.cur || this.locked) return;
        if (this.cur.y + 1 < this.rows && this.grid[this.cur.y + 1][this.cur.x] === null) {
            this.cur.y++;
            this._drawBoard();
        } else {
            this._lock();
        }
    }

    _lock() {
        this._stopFall();
        this._hideHand();
        if (!this.cur) return;
        const { card, x, y } = this.cur;
        this.grid[y][x] = card;
        const landedX = x;
        this.cur = null;
        this._drawBoard();

        const s = this.stepDef;
        if (s.kind === 'block') {
            this._blockLanded(s);
        } else if (s.kind === 'move') {
            if (landedX === s.targetColumn) this._moveSuccess(s);
            else this._fail(s);
        } else if (landedX === s.targetColumn) {
            this._celebrate(s);
        } else {
            this._fail(s);
        }
    }

    _setDone(text) {
        this.promptEl.classList.add('done');
        this.promptEl.innerHTML = text;
    }

    _nudge(msg) {
        this.promptEl.innerHTML = msg;
        this.promptEl.classList.remove('shake');
        void this.promptEl.offsetWidth;
        this.promptEl.classList.add('shake');
    }

    _fail(s) {
        this.locked = true;
        audio.invalid();
        this.game.haptic([15, 30, 15]);
        this._nudge('Not quite — try again!');
        setTimeout(() => { this.promptEl.classList.remove('shake'); this._setupStep(s); this._updateNext(s); if (s.interactive) this._showHand(s); }, 1100);
    }

    _moveSuccess(s) {
        this.locked = true;
        audio.land();
        this.game.haptic(15);
        if (effects) {
            const r = this._cell(s.targetColumn, this.rows - 1).getBoundingClientRect();
            effects.sparkle(r.left + r.width / 2, r.top + r.height / 2, 12, '#fff6b0');
        }
        this.solved = true;
        this._setDone(s.done);
        this._updateNext(s);
    }

    _blockLanded(s) {
        this.locked = true;
        audio.land();
        this.game.haptic([25, 40, 25]);
        this.solved = true;
        this._setDone(s.done);
        this._updateNext(s);
    }

    _celebrate(s) {
        this.locked = true;
        const line = s.winLine;
        line.forEach(pos => {
            const el = this._cardEl(pos.x, pos.y);
            if (el) el.classList.add('matching');
        });

        audio.win(s.winRank);
        this.game.haptic([20, 30, 40]);
        this._setDone(s.done);

        if (effects) {
            line.forEach(pos => {
                const r = this._cell(pos.x, pos.y).getBoundingClientRect();
                effects.sparkle(r.left + r.width / 2, r.top + r.height / 2, 9, '#fff6b0');
            });
            const br = this.boardEl.getBoundingClientRect();
            effects.floatText(br.left + br.width / 2, br.top + br.height * 0.3,
                s.winName + '!', '#ffd700', 30);
        }

        setTimeout(() => {
            if (effects) {
                line.forEach(pos => {
                    const r = this._cell(pos.x, pos.y).getBoundingClientRect();
                    effects.coinSplash(r.left + r.width / 2, r.top + r.height / 2, 9, 1.1);
                });
            }
            line.forEach(pos => {
                const el = this._cardEl(pos.x, pos.y);
                if (el) el.classList.add('exploding');
            });
            setTimeout(() => {
                line.forEach(pos => {
                    const el = this._cardEl(pos.x, pos.y);
                    if (el) el.remove();
                    this.grid[pos.y][pos.x] = null;
                });
                this.solved = true;
                this.locked = false;
                this._updateNext(this.stepDef);
            }, 750);
        }, 750);
    }

    /* ---- guide hand ------------------------------------------------- */

    _showHand(s) {
        if (!this.hand) return;
        requestAnimationFrame(() => {
            let tx, ty;
            if (s.kind === 'move') {
                const r = this.boardEl.getBoundingClientRect();
                tx = r.left + r.width * 0.82;
                ty = r.top + r.height * 0.22;
            } else if (s.showDrop !== false) {
                const r = this.dropBtn.getBoundingClientRect();
                tx = r.left + r.width * 0.5;
                ty = r.top + r.height * 0.5;
            } else {
                this._hideHand();
                return;
            }
            this.hand.style.left = (tx - 24) + 'px';
            this.hand.style.top = (ty - 6) + 'px';
            this.hand.classList.add('active');
        });
    }

    _hideHand() {
        if (this.hand) this.hand.classList.remove('active');
    }

    /* ---- step content ----------------------------------------------- */

    _buildSteps() {
        return [
            {
                // Steer practice — the card waits, then drops in on arrival.
                kind: 'move',
                prompt: 'Tap the board to move the card',
                done: 'Nice steering!',
                rows: 8,
                interactive: true,
                movable: true,
                autoFall: false,
                showDrop: false,
                spawn: { suit: 'diamonds', value: 7, startX: 0 },
                targetColumn: 3
            },
            {
                kind: 'hand',
                prompt: 'Press <b>Quick Drop</b>',
                done: 'Straight! 🎉',
                rows: 8,
                interactive: true,
                axis: 'row',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 0, y: 7, suit: 'clubs', value: 4 },
                    { x: 1, y: 7, suit: 'diamonds', value: 5 },
                    { x: 2, y: 7, suit: 'spades', value: 6 },
                    { x: 3, y: 7, suit: 'hearts', value: 7 }
                ],
                spawn: { suit: 'clubs', value: 8, startX: 4 },
                targetColumn: 4,
                winName: 'Straight',
                winRank: 3,
                winLine: [{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }]
            },
            {
                kind: 'hand',
                prompt: 'Press <b>Quick Drop</b>',
                done: 'Flush! 🎉',
                rows: 8,
                interactive: true,
                axis: 'column',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 2, y: 4, suit: 'spades', value: 3 },
                    { x: 2, y: 5, suit: 'spades', value: 7 },
                    { x: 2, y: 6, suit: 'spades', value: 9 },
                    { x: 2, y: 7, suit: 'spades', value: 13 }
                ],
                spawn: { suit: 'spades', value: 5, startX: 2 },
                targetColumn: 2,
                winName: 'Flush',
                winRank: 4,
                winLine: [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }]
            },
            {
                kind: 'hand',
                prompt: 'The <b>?</b> is wild — <b>Quick Drop</b>!',
                done: 'Royal Flush! 🃏',
                rows: 8,
                interactive: true,
                axis: 'row',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 0, y: 7, suit: 'hearts', value: 10 },
                    { x: 1, y: 7, suit: 'hearts', value: 11 },
                    { x: 2, y: 7, suit: 'hearts', value: 12 },
                    { x: 3, y: 7, suit: 'hearts', value: 13 }
                ],
                spawn: { suit: 'joker', value: 0, startX: 4 },
                targetColumn: 4,
                winName: 'Royal Flush',
                winRank: 8,
                winLine: [{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }]
            },
            {
                // Almost a Full House (K K _ Q Q) — the X drops into the gap and
                // wrecks it. No Quick Drop button; it just falls in.
                kind: 'block',
                prompt: 'The <b>X</b> can’t be moved…',
                done: 'The X blocks the Full House!',
                rows: 8,
                interactive: true,
                movable: false,
                autoFall: true,
                fast: true,
                showDrop: false,
                blockHint: '🚫 X cards can’t be moved!',
                cards: [
                    { x: 0, y: 7, suit: 'hearts', value: 13 },
                    { x: 1, y: 7, suit: 'spades', value: 13 },
                    { x: 3, y: 7, suit: 'diamonds', value: 12 },
                    { x: 4, y: 7, suit: 'clubs', value: 12 }
                ],
                spawn: { suit: 'x', value: 0, startX: 2 }
            },
            {
                prompt: 'You’re ready — good luck! 🎰',
                rows: 4,
                interactive: false,
                cards: [
                    { x: 1, y: 3, suit: 'joker', value: 0 },
                    { x: 2, y: 3, suit: 'x', value: 0 },
                    { x: 3, y: 3, suit: 'hearts', value: 1 }
                ]
            }
        ];
    }
}

// Global instance, created after DOM is ready (see game.js).
let tutorial = null;
