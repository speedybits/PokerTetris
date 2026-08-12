/*
 * Tutorial — an interactive, dismissible walkthrough that replaces the old
 * static "How To Play" screen.
 *
 * It runs a small game-engine that uses the SAME controls as the real game:
 *   - a card falls from the top on its own,
 *   - tap a column to move the falling card to it,
 *   - press Quick Drop to slam it straight down.
 *
 * The player completes a poker hand in a ROW and a COLUMN, sees how a JOKER
 * works as a wild card, and how an X card can't be moved and blocks hands —
 * each with the game's real clear + coins + sound. It reuses the game's
 * .card / .card-cell styles (so cards keep their proper 5:7 shape) and the
 * shared `effects` / `audio` engines.
 *
 * It can be skipped at any time (Skip ✕), and remembers that it has been seen
 * (localStorage) so experienced players aren't forced through it again.
 */
class Tutorial {
    constructor(game) {
        this.game = game;
        this.cols = 5;
        this.rows = 5;
        this.step = 0;
        this.solved = false;
        this.locked = false;      // true during win/fail animations
        this.cur = null;          // the falling card: { card, x, y }
        this.fallTimer = null;
        this.grid = [];
        this.stepDef = null;
        this.steps = this._buildSteps();

        this.screen = document.getElementById('tutorial-screen');
        this.titleEl = this.screen.querySelector('.tutorial-title');
        this.textEl = this.screen.querySelector('.tutorial-text');
        this.boardEl = document.getElementById('tutorial-board');
        this.hintEl = this.screen.querySelector('.tutorial-hint');
        this.progressEl = this.screen.querySelector('.tutorial-progress');
        this.controlsEl = document.getElementById('tutorial-controls');
        this.dropBtn = document.getElementById('tutorial-drop');
        this.prevBtn = document.getElementById('tutorial-prev');
        this.nextBtn = document.getElementById('tutorial-next');
        this.skipBtn = this.screen.querySelector('.tutorial-skip');

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

        // Quick Drop — same control as the real game.
        const drop = (e) => { if (e) e.preventDefault(); this._quickDrop(); };
        this.dropBtn.addEventListener('click', drop);
        this.dropBtn.addEventListener('touchstart', drop, { passive: false });

        // Tap the left / right side of the board to nudge the falling card one
        // column that way — same idea as the real game's side taps.
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
        localStorage.setItem('cardtrisTutorialSeen', 'true');
        this.game.showScreen('start-screen');
    }

    finish() {
        this._stopFall();
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

        this.titleEl.textContent = s.title;
        this.textEl.innerHTML = s.text;
        this.hintEl.innerHTML = s.hint || '';
        this.hintEl.classList.remove('shake');
        this.progressEl.textContent = `${this.step + 1} / ${this.steps.length}`;
        this.prevBtn.style.visibility = this.step === 0 ? 'hidden' : 'visible';
        // Quick Drop is shown on steps that ask for it; the pure movement step
        // hides it so the player focuses on steering.
        this.controlsEl.style.visibility =
            (s.interactive && s.showDrop !== false) ? 'visible' : 'hidden';

        this._setupStep(s);
        this._updateNext(s);
    }

    _updateNext(s) {
        const last = this.step >= this.steps.length - 1;
        this.nextBtn.textContent = last ? 'Play ▶' : 'Next ›';
        const waiting = s.interactive && !this.solved;
        this.nextBtn.disabled = waiting;
        this.nextBtn.classList.toggle('waiting', waiting);
    }

    _setupStep(s) {
        // Fresh grid + cells.
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
            // Spawn the falling card.
            this.cur = { card: new Card(s.spawn.suit, s.spawn.value), x: s.spawn.startX, y: 0 };
            this._drawBoard();
            // Movement / X steps descend on their own; pre-positioned hand steps
            // hover at the top and wait for the player to press Quick Drop.
            if (s.autoFall) {
                setTimeout(() => { if (this.cur && !this.locked) this._startFall(s.fast ? 380 : 1000); }, 550);
            }
        } else {
            this._drawBoard();
            if (s.illustrate) {
                // Show the example hand glowing.
                (s.cards || []).forEach(c => {
                    const el = this._cardEl(c.x, c.y);
                    if (el) el.classList.add('matching');
                });
            }
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

    /* ---- controls (mirror the real game) ---------------------------- */

    _tapMove(clientX) {
        if (!this.cur || this.locked) return;
        const rect = this.boardEl.getBoundingClientRect();
        const col = Math.floor(((clientX - rect.left) / rect.width) * this.cols);
        if (col < 0 || col >= this.cols) return;

        if (this.stepDef.movable === false) {
            // X cards can't be moved horizontally.
            audio.invalid();
            this._nudge(this.stepDef.blockHint || 'X cards can’t be moved!');
            return;
        }

        // Step one column toward the side that was tapped (like the game).
        const dir = col > this.cur.x ? 1 : col < this.cur.x ? -1 : 0;
        if (dir === 0) return;
        const nx = this.cur.x + dir;
        if (nx >= 0 && nx < this.cols && this.grid[this.cur.y][nx] === null) {
            this.cur.x = nx;
            audio.move();
            this.game.haptic(8);
            this._drawBoard();

            // On the steering step there's no time pressure: the card waits at
            // the top while you line it up, then drops in once it's over the
            // target column.
            if (this.stepDef.kind === 'move' && this.cur.x === this.stepDef.targetColumn) {
                this._dropIntoTarget();
            }
        }
    }

    _dropIntoTarget() {
        this.locked = true;  // no more steering while it drops in
        setTimeout(() => {
            if (!this.cur) return;
            while (this.cur.y + 1 < this.rows && this.grid[this.cur.y + 1][this.cur.x] === null) {
                this.cur.y++;
            }
            audio.drop();
            this._drawBoard();
            this._lock();
        }, 260);
    }

    _quickDrop() {
        if (!this.cur || this.locked) return;
        while (this.cur.y + 1 < this.rows && this.grid[this.cur.y + 1][this.cur.x] === null) {
            this.cur.y++;
        }
        audio.drop();
        this._drawBoard();
        this._lock();
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

    _nudge(msg) {
        this.hintEl.innerHTML = msg;
        this.hintEl.classList.remove('shake');
        void this.hintEl.offsetWidth;
        this.hintEl.classList.add('shake');
    }

    _fail(s) {
        this.locked = true;
        audio.invalid();
        this.game.haptic([15, 30, 15]);
        const what = s.kind === 'move'
            ? 'land the card in the glowing column'
            : `complete the ${s.axis}`;
        this._nudge(`Not quite — try to ${what}. Let’s go again!`);
        setTimeout(() => this._setupStep(s), 1100);
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
        this.hintEl.innerHTML = '✅ Nice steering! Tap <b>Next</b> to learn how to score.';
        this._updateNext(s);
    }

    _blockLanded(s) {
        this.locked = true;
        audio.land();
        this.game.haptic(20);
        this.hintEl.innerHTML = s.successHint;
        this.solved = true;
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

        if (effects) {
            line.forEach(pos => {
                const r = this._cell(pos.x, pos.y).getBoundingClientRect();
                effects.sparkle(r.left + r.width / 2, r.top + r.height / 2, 9, '#fff6b0');
            });
            const br = this.boardEl.getBoundingClientRect();
            effects.floatText(br.left + br.width / 2, br.top + br.height * 0.32,
                s.winName + '!', '#ffd700', 30);
        }

        this.hintEl.innerHTML = `✅ <b>${s.winName}</b> — that clears the ${s.axis}!`;

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
                this.hintEl.innerHTML = 'Nice! Tap <b>Next</b> to continue.';
                this._updateNext(this.stepDef);
            }, 750);
        }, 750);
    }

    /* ---- step content ----------------------------------------------- */

    _buildSteps() {
        return [
            {
                // Pure controls practice: steer the card, then it drops in when
                // it reaches the target column (no time pressure).
                title: 'Steer the Card',
                text: 'Line the card up before it drops. <b>Tap the left or right side</b> of the board to slide it across.',
                hint: '👆 Tap left / right to move the card over the <b>glowing column</b> — it drops in once it’s there.',
                interactive: true,
                kind: 'move',
                movable: true,
                autoFall: false,
                showDrop: false,
                spawn: { suit: 'diamonds', value: 7, startX: 0 },
                targetColumn: 3
            },
            {
                // Pre-positioned — the player just presses Quick Drop.
                title: 'Complete a Row',
                text: 'Four cards sit in a row, needing one more for a <b>Straight</b> (4-5-6-7-8). The <b>8</b> is already lined up above the empty spot.',
                hint: '👆 Press <b>Quick Drop</b> to drop the 8 and finish the row.',
                interactive: true,
                kind: 'hand',
                axis: 'row',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 0, y: 4, suit: 'clubs', value: 4 },
                    { x: 1, y: 4, suit: 'diamonds', value: 5 },
                    { x: 2, y: 4, suit: 'spades', value: 6 },
                    { x: 3, y: 4, suit: 'hearts', value: 7 }
                ],
                spawn: { suit: 'clubs', value: 8, startX: 4 },
                targetColumn: 4,
                winName: 'Straight',
                winRank: 3,
                winLine: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }]
            },
            {
                title: 'Complete a Column',
                text: 'This column has four <b>spades</b>; one more makes a <b>Flush</b>. The <b>5♠</b> is lined up right on top.',
                hint: '👆 Press <b>Quick Drop</b> to drop the 5♠ and finish the column.',
                interactive: true,
                kind: 'hand',
                axis: 'column',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 2, y: 1, suit: 'spades', value: 3 },
                    { x: 2, y: 2, suit: 'spades', value: 7 },
                    { x: 2, y: 3, suit: 'spades', value: 9 },
                    { x: 2, y: 4, suit: 'spades', value: 13 }
                ],
                spawn: { suit: 'spades', value: 5, startX: 2 },
                targetColumn: 2,
                winName: 'Flush',
                winRank: 4,
                winLine: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }]
            },
            {
                title: 'Jokers Are Wild',
                text: 'A <b>?</b> Joker can become <b>any</b> card. These four hearts are one short of a <b>Royal Flush</b> — the Joker becomes the Ace! It’s lined up on top.',
                hint: '👆 Press <b>Quick Drop</b> to drop the Joker and win big.',
                interactive: true,
                kind: 'hand',
                axis: 'row',
                autoFall: false,
                showDrop: true,
                cards: [
                    { x: 0, y: 4, suit: 'hearts', value: 10 },
                    { x: 1, y: 4, suit: 'hearts', value: 11 },
                    { x: 2, y: 4, suit: 'hearts', value: 12 },
                    { x: 3, y: 4, suit: 'hearts', value: 13 }
                ],
                spawn: { suit: 'joker', value: 0, startX: 4 },
                targetColumn: 4,
                winName: 'Royal Flush',
                winRank: 8,
                winLine: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }]
            },
            {
                title: 'X Blocks the Board',
                text: 'An <b>X</b> card can’t be moved left or right and falls fast — it never forms a hand, it just gets in the way.',
                hint: 'Try tapping to move it (it won’t budge), then press <b>Quick Drop</b>.',
                interactive: true,
                kind: 'block',
                movable: false,
                autoFall: true,
                fast: true,
                showDrop: true,
                blockHint: '🚫 X cards can’t be moved — only dropped!',
                successHint: 'See? The <b>X</b> just sits there as a blocker. Plan around it!',
                spawn: { suit: 'x', value: 0, startX: 2 }
            },
            {
                title: 'You’re Ready!',
                text: 'Steer cards with left/right taps, drop them to build hands in rows and columns, use Jokers as wild cards and dodge the X blockers. Climb the levels and chase the jackpot!',
                hint: 'Tap <b>Play</b> to start your game.',
                interactive: false,
                cards: [
                    { x: 1, y: 4, suit: 'joker', value: 0 },
                    { x: 2, y: 4, suit: 'x', value: 0 },
                    { x: 3, y: 4, suit: 'hearts', value: 1 }
                ]
            }
        ];
    }
}

// Global instance, created after DOM is ready (see game.js).
let tutorial = null;
