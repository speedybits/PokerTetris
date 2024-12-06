class Game {
    constructor() {
        this.initializeScreens();
        this.resetGame();
        this.initializeControls();
    }

    initializeScreens() {
        // Show high scores on start screen
        highScores.displayScores();

        // Start button handler
        document.querySelector('.start-button').addEventListener('click', () => {
            this.startGame();
        });

        // Initials input handler
        const initialsInput = document.getElementById('initials');
        initialsInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        initialsInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && e.target.value.length === 3) {
                this.submitScore(e.target.value);
            }
        });
    }

    resetGame() {
        this.board = new Board();
        this.deck = new Deck();
        this.score = 0;
        this.currentCard = null;
        this.currentX = 3;
        this.currentY = 0;
        this.nextCard = this.deck.draw();
        this.gameOver = false;
        this.dropInterval = 1000;
        this.lastDrop = 0;
    }

    startGame() {
        this.resetGame();
        this.showScreen('game-screen');
        this.spawnCard();
        this.gameLoop();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    initializeControls() {
        // Touch areas for left/right movement
        document.getElementById('touch-left').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        });

        document.getElementById('touch-right').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX + 1, this.currentY)) {
                this.currentX++;
            }
        });

        // Game board for instant drop
        document.getElementById('game-board').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;

            const rect = e.target.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const column = Math.floor((touchX / rect.width) * this.board.width);

            if (column >= 0 && column < this.board.width) {
                this.dropToColumn(column);
            }
        });

        // Mouse controls for testing
        document.getElementById('touch-left').addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        });

        document.getElementById('touch-right').addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX + 1, this.currentY)) {
                this.currentX++;
            }
        });

        document.getElementById('game-board').addEventListener('click', (e) => {
            if (this.gameOver) return;

            const rect = e.target.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const column = Math.floor((clickX / rect.width) * this.board.width);

            if (column >= 0 && column < this.board.width) {
                this.dropToColumn(column);
            }
        });
    }

    dropToColumn(column) {
        // Move card to target column if possible
        while (this.currentX < column && this.board.isValidPosition(this.currentX + 1, this.currentY)) {
            this.currentX++;
        }
        while (this.currentX > column && this.board.isValidPosition(this.currentX - 1, this.currentY)) {
            this.currentX--;
        }
        
        // Drop card to lowest possible position
        while (this.board.isValidPosition(this.currentX, this.currentY + 1)) {
            this.currentY++;
        }
        this.lockCard();
    }

    spawnCard() {
        this.currentCard = this.nextCard;
        this.nextCard = this.deck.draw();
        this.currentX = 3;
        this.currentY = 0;

        // Update next card display
        const nextCardElement = document.getElementById('next-card');
        nextCardElement.innerHTML = '';
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${this.nextCard.isRed() ? 'red' : ''}`;
        cardDiv.textContent = this.nextCard.toString();
        nextCardElement.appendChild(cardDiv);

        if (!this.board.isValidPosition(this.currentX, this.currentY)) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('final-score').textContent = this.score;
        
        // Check if it's a high score
        if (highScores.isHighScore(this.score)) {
            document.querySelector('.high-score-message').style.display = 'block';
        }
        
        this.showScreen('game-over-screen');
        document.getElementById('initials').focus();
    }

    submitScore(initials) {
        highScores.addScore(initials, this.score);
        setTimeout(() => {
            this.showScreen('start-screen');
            highScores.displayScores();
        }, 3000);
    }

    lockCard() {
        this.board.placeCard(this.currentCard, this.currentX, this.currentY);
        this.checkForMatches();
        this.spawnCard();
    }

    checkForMatches() {
        const hands = this.board.checkForPokerHands();
        hands.forEach(hand => {
            const score = this.evaluatePokerHand(hand.cards);
            this.score += score;
            this.board.removeCards(hand.positions);
            hand.cards.forEach(card => this.deck.addCard(card));
        });
        document.getElementById('score').textContent = this.score;
    }

    evaluatePokerHand(cards) {
        // Sort cards by value for easier evaluation
        cards.sort((a, b) => a.value - b.value);
        
        // Check for flush (all same suit)
        const isFlush = cards.every(card => card.suit === cards[0].suit);
        
        // Check for straight (consecutive values)
        let isStraight = true;
        for (let i = 1; i < cards.length; i++) {
            if (cards[i].value !== cards[i-1].value + 1) {
                // Special case for Ace-high straight
                if (i === cards.length - 1 && cards[0].value === 1 && cards[1].value === 10) {
                    continue;
                }
                isStraight = false;
                break;
            }
        }

        // Count card values for pairs, three of a kind, etc.
        const valueCounts = {};
        cards.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        const counts = Object.values(valueCounts);

        // Royal Flush
        if (isFlush && isStraight && cards[0].value === 1 && cards[4].value === 13) {
            return 2000;
        }
        // Straight Flush
        if (isFlush && isStraight) {
            return 1000;
        }
        // Four of a Kind
        if (counts.includes(4)) {
            return 500;
        }
        // Full House
        if (counts.includes(3) && counts.includes(2)) {
            return 300;
        }
        // Flush
        if (isFlush) {
            return 200;
        }
        // Straight
        if (isStraight) {
            return 150;
        }
        // Three of a Kind
        if (counts.includes(3)) {
            return 100;
        }
        // Two Pair
        if (counts.filter(count => count === 2).length === 2) {
            return 50;
        }
        // One Pair
        if (counts.includes(2)) {
            return 25;
        }
        
        return 0;
    }

    gameLoop() {
        const now = Date.now();
        if (now - this.lastDrop > this.dropInterval) {
            if (this.board.isValidPosition(this.currentX, this.currentY + 1)) {
                this.currentY++;
            } else {
                this.lockCard();
            }
            this.lastDrop = now;
        }

        // Get a clean copy of the locked cards
        const displayGrid = this.board.grid.map(row => [...row]);

        // Only add the current falling card to its current position
        if (this.currentCard && !this.gameOver) {
            displayGrid[this.currentY][this.currentX] = this.currentCard;
        }

        // Update the display with the current state
        this.board.updateDisplay(displayGrid);

        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 