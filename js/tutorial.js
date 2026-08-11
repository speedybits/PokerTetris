/*
 * Tutorial — an interactive, dismissible walkthrough that replaces the old
 * static "How To Play" screen.
 *
 * It runs a few guided steps on a small demo board where the player actually
 * taps to drop a card and complete a poker hand — once in a ROW and once in a
 * COLUMN — and sees the same clear + coins + sound as the real game. It reuses
 * the game's .card / .card-cell styles (so cards keep their proper 5:7 shape)
 * and the shared `effects` / `audio` engines.
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
        this.locked = false;
        this.steps = this._buildSteps();

        this.screen = document.getElementById('tutorial-screen');
        this.titleEl = this.screen.querySelector('.tutorial-title');
        this.textEl = this.screen.querySelector('.tutorial-text');
        this.boardEl = document.getElementById('tutorial-board');
        this.hintEl = this.screen.querySelector('.tutorial-hint');
        this.progressEl = this.screen.querySelector('.tutorial-progress');
        this.prevBtn = document.getElementById('tutorial-prev');
        this.nextBtn = document.getElementById('tutorial-next');
        this.skipBtn = this.screen.querySelector('.tutorial-skip');

        this._wire();
    }

    _wire() {
        this.skipBtn.addEventListener('click', () => { audio.button(); this.close(); });

        this.prevBtn.addEventListener('click', () => {
            audio.button();
            this.go(this.step - 1);
        });

        this.nextBtn.addEventListener('click', () => {
            if (this.nextBtn.disabled) return;
            audio.button();
            if (this.step >= this.steps.length - 1) this.finish();
            else this.go(this.step + 1);
        });

        const onTap = (clientX) => this._handleBoardTap(clientX);
        this.boardEl.addEventListener('click', (e) => onTap(e.clientX));
        this.boardEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches && e.touches[0]) onTap(e.touches[0].clientX);
        }, { passive: false });
    }

    /* Whether the tutorial has been completed or skipped before. */
    static seen() {
        return localStorage.getItem('cardtrisTutorialSeen') === 'true';
    }

    open() {
        audio.unlock();
        this.step = 0;
        this.game.showScreen('tutorial-screen');
        this.render();
    }

    close() {
        localStorage.setItem('cardtrisTutorialSeen', 'true');
        this.game.showScreen('start-screen');
    }

    finish() {
        localStorage.setItem('cardtrisTutorialSeen', 'true');
        this.game.startGame();
    }

    go(i) {
        this.step = Math.max(0, Math.min(i, this.steps.length - 1));
        this.render();
    }

    render() {
        const s = this.steps[this.step];
        this.solved = !s.interactive;
        this.locked = false;

        this.titleEl.textContent = s.title;
        this.textEl.innerHTML = s.text;
        this.hintEl.innerHTML = s.hint || '';
        this.hintEl.classList.remove('shake');
        this.progressEl.textContent = `${this.step + 1} / ${this.steps.length}`;
        this.prevBtn.style.visibility = this.step === 0 ? 'hidden' : 'visible';

        this._renderBoard(s);
        this._updateNext(s);
    }

    _updateNext(s) {
        const last = this.step >= this.steps.length - 1;
        this.nextBtn.textContent = last ? 'Play ▶' : 'Next ›';
        const waiting = s.interactive && !this.solved;
        this.nextBtn.disabled = waiting;
        this.nextBtn.classList.toggle('waiting', waiting);
    }

    _renderBoard(s) {
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

        (s.cards || []).forEach(c => {
            const el = this._placeCard(c.x, c.y, new Card(c.suit, c.value));
            if (s.illustrate) el.classList.add('matching');
        });

        this.dropCardEl = null;
        if (s.interactive && s.drop) {
            this._highlightColumn(s.targetColumn);
            const el = this._placeCard(s.targetColumn, 0, new Card(s.drop.suit, s.drop.value));
            el.classList.add('tut-drop');
            el.style.transform = 'translateX(-50%) translateY(-58%)';
            this.dropCardEl = el;
        }
    }

    _placeCard(x, y, card) {
        const cell = this.boardEl.querySelector(`.card-cell[data-x="${x}"][data-y="${y}"]`);
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

    _highlightColumn(x) {
        for (let y = 0; y < this.rows; y++) {
            const cell = this._cell(x, y);
            if (cell) cell.classList.add('tut-target');
        }
    }

    _clearHighlight() {
        this.boardEl.querySelectorAll('.tut-target').forEach(c => c.classList.remove('tut-target'));
    }

    _columnFromX(clientX) {
        const rect = this.boardEl.getBoundingClientRect();
        return Math.floor(((clientX - rect.left) / rect.width) * this.cols);
    }

    _handleBoardTap(clientX) {
        const s = this.steps[this.step];
        if (!s.interactive || this.solved || this.locked) return;
        const col = this._columnFromX(clientX);
        if (col === s.targetColumn) {
            this._solve(s);
        } else {
            audio.move();
            this.hintEl.classList.remove('shake');
            void this.hintEl.offsetWidth;
            this.hintEl.classList.add('shake');
        }
    }

    _solve(s) {
        this.locked = true;
        this._clearHighlight();
        audio.drop();
        this.game.haptic(12);

        // Drop the card from its hovering spot down into the target cell.
        const cardEl = this.dropCardEl;
        const fromRect = cardEl.getBoundingClientRect();
        cardEl.classList.remove('tut-drop');
        this._cell(s.drop.x, s.drop.y).appendChild(cardEl);
        const toRect = cardEl.getBoundingClientRect();
        const dy = fromRect.top - toRect.top;

        cardEl.style.transition = 'none';
        cardEl.style.transform = `translateX(-50%) translateY(${dy}px)`;
        requestAnimationFrame(() => {
            cardEl.style.transition = 'transform 0.38s cubic-bezier(.34,1.35,.5,1)';
            cardEl.style.transform = 'translateX(-50%)';
        });

        setTimeout(() => {
            audio.land();
            this._celebrate(s);
        }, 400);
    }

    _celebrate(s) {
        const line = s.winLine;
        line.forEach(pos => {
            const card = this._cell(pos.x, pos.y).querySelector('.card');
            if (card) card.classList.add('matching');
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

        // A beat later: coins burst and the hand explodes away.
        setTimeout(() => {
            if (effects) {
                line.forEach(pos => {
                    const r = this._cell(pos.x, pos.y).getBoundingClientRect();
                    effects.coinSplash(r.left + r.width / 2, r.top + r.height / 2, 9, 1.1);
                });
            }
            line.forEach(pos => {
                const card = this._cell(pos.x, pos.y).querySelector('.card');
                if (card) card.classList.add('exploding');
            });

            setTimeout(() => {
                line.forEach(pos => {
                    const card = this._cell(pos.x, pos.y).querySelector('.card');
                    if (card) card.remove();
                });
                this.solved = true;
                this.locked = false;
                this.hintEl.innerHTML = `Nice! Tap <b>Next</b> to continue.`;
                this._updateNext(this.steps[this.step]);
            }, 750);
        }, 750);
    }

    _buildSteps() {
        return [
            {
                title: 'Welcome to Cardtris',
                text: 'Cards fall from the top. Line up <b>5 cards</b> that make a poker hand — in a <b>row</b> or a <b>column</b> — to clear them and score.',
                hint: 'Here’s a winning row. Tap <b>Next</b> to try it yourself.',
                interactive: false,
                illustrate: true,
                cards: [
                    { x: 0, y: 4, suit: 'hearts', value: 1 },
                    { x: 1, y: 4, suit: 'hearts', value: 13 },
                    { x: 2, y: 4, suit: 'hearts', value: 12 },
                    { x: 3, y: 4, suit: 'hearts', value: 11 },
                    { x: 4, y: 4, suit: 'hearts', value: 10 }
                ]
            },
            {
                title: 'Complete a Row',
                text: 'These four cards need one more to make a <b>Straight</b> (4-5-6-7-8). The <b>8</b> is waiting at the top.',
                hint: '👆 Tap the glowing column to drop the <b>8</b> and finish the row.',
                interactive: true,
                axis: 'row',
                cards: [
                    { x: 0, y: 4, suit: 'clubs', value: 4 },
                    { x: 1, y: 4, suit: 'diamonds', value: 5 },
                    { x: 2, y: 4, suit: 'spades', value: 6 },
                    { x: 3, y: 4, suit: 'hearts', value: 7 }
                ],
                drop: { x: 4, y: 4, suit: 'clubs', value: 8 },
                targetColumn: 4,
                winName: 'Straight',
                winRank: 3,
                winLine: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }]
            },
            {
                title: 'Complete a Column',
                text: 'This column already has four <b>spades</b>. One more spade makes a <b>Flush</b>.',
                hint: '👆 Tap the glowing column to drop the <b>5♠</b> and finish the column.',
                interactive: true,
                axis: 'column',
                cards: [
                    { x: 2, y: 1, suit: 'spades', value: 3 },
                    { x: 2, y: 2, suit: 'spades', value: 7 },
                    { x: 2, y: 3, suit: 'spades', value: 9 },
                    { x: 2, y: 4, suit: 'spades', value: 13 }
                ],
                drop: { x: 2, y: 0, suit: 'spades', value: 5 },
                targetColumn: 2,
                winName: 'Flush',
                winRank: 4,
                winLine: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }]
            },
            {
                title: 'You’re Ready!',
                text: 'Watch for <b>?</b> Jokers (wild — they can be any card) and <b>X</b> blockers (they break up hands). Clear hands, climb the levels, and chase the jackpot!',
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
