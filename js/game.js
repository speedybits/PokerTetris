class Game {
    constructor() {
        this.initializeScreens();
        this.resetGame();
        this.initializeControls();
        this.baseDropInterval = 500; // Base speed of 1 second
        this.minDropInterval = 200;   // Maximum speed (minimum interval) of 0.2 seconds
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
        this.dropInterval = this.baseDropInterval;
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
        // Touch controls
        const gameContainer = document.getElementById('game-container');
        const touchLeft = document.getElementById('touch-left');
        const touchRight = document.getElementById('touch-right');
        const gameBoard = document.getElementById('game-board');

        // Prevent default touch behavior
        [gameContainer, touchLeft, touchRight, gameBoard].forEach(element => {
            element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            element.addEventListener('touchend', (e) => e.preventDefault());
        });

        // Left touch area
        touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        }, { passive: false });

        // Right touch area
        touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX + 1, this.currentY)) {
                this.currentX++;
            }
        }, { passive: false });

        // Quick drop on game board touch
        gameBoard.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;

            const rect = gameBoard.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const column = Math.floor((touchX / rect.width) * this.board.width);
            
            if (column >= 0 && column < this.board.width) {
                this.dropToColumn(column);
            }
        }, { passive: false });

        // Mouse controls for testing
        touchLeft.addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        });

        touchRight.addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.board.isValidPosition(this.currentX + 1, this.currentY)) {
                this.currentX++;
            }
        });

        gameBoard.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const rect = gameBoard.getBoundingClientRect();
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
        if (hands.length > 0) {
            // Create and show the poker hand notification
            const notification = document.createElement('div');
            notification.className = 'poker-notification';
            
            // Process each hand
            let totalScore = 0;
            const handMessages = hands.map(hand => {
                const score = this.evaluatePokerHand(hand.cards);
                const handName = this.getPokerHandName(hand.cards);
                totalScore += score;
                
                // Highlight the matching cards
                hand.positions.forEach(pos => {
                    const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                    const card = cell.firstChild;
                    if (card) {
                        card.classList.add('matching');
                    }
                });
                
                return `${handName}: ${score} points!`;
            });

            notification.innerHTML = handMessages.join('<br>');
            if (hands.length > 1) {
                notification.innerHTML += `<br>Total: ${totalScore} points!`;
            }
            document.getElementById('game-container').appendChild(notification);

            // Pause for 3 seconds, then remove cards with explosion effect
            setTimeout(() => {
                hands.forEach(hand => {
                    // Add explosion effect to each card
                    hand.positions.forEach(pos => {
                        const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                        const card = cell.firstChild;
                        if (card) {
                            card.classList.add('exploding');
                        }
                    });
                });

                // Wait for explosion animation, then remove cards and apply gravity
                setTimeout(() => {
                    hands.forEach(hand => {
                        const score = this.evaluatePokerHand(hand.cards);
                        this.score += score;
                        hand.cards.forEach(card => this.deck.addCard(card));
                    });
                    
                    // Remove all matched cards at once
                    const allPositions = hands.flatMap(hand => hand.positions);
                    this.board.removeCards(allPositions);
                    
                    // Update speed based on score
                    this.dropInterval = Math.max(
                        this.minDropInterval,
                        this.baseDropInterval - Math.floor(this.score / 1000) * 50
                    );
                    
                    document.getElementById('score').textContent = this.score;
                    notification.remove();

                    // Check for new matches after cards have fallen
                    setTimeout(() => {
                        this.checkForMatches();
                    }, 500); // Wait for cards to finish falling
                }, 500); // Explosion animation duration
            }, 3000); // Display duration
        }
    }

    getPokerHandName(cards) {
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

        // Check hand types in descending order of value
        if (isFlush && isStraight && cards[0].value === 1 && cards[4].value === 13) {
            return "Royal Flush";
        }
        if (isFlush && isStraight) {
            return "Straight Flush";
        }
        if (counts.includes(4)) {
            return "Four of a Kind";
        }
        if (counts.includes(3) && counts.includes(2)) {
            return "Full House";
        }
        if (isFlush) {
            return "Flush";
        }
        if (isStraight) {
            return "Straight";
        }
        if (counts.includes(3)) {
            return "Three of a Kind";
        }
        if (counts.filter(count => count === 2).length === 2) {
            return "Two Pair";
        }
        if (counts.includes(2)) {
            return "One Pair";
        }
        return "High Card";
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