class Game {
    constructor() {
        this.initializeScreens();
        this.resetGame();
        this.initializeControls();
        this.baseDropInterval = 500; // Base speed of 1 second
        this.minDropInterval = 200;   // Maximum speed (minimum interval) of 0.2 seconds
        this.isPaused = false;  // Add pause state
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
        this.isPaused = false;
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
            // Pause the game while showing notification
            this.isPaused = true;
            
            // Process each hand
            let totalScore = 0;
            const handResults = hands.map(hand => {
                const result = this.evaluatePokerHand(hand.cards);
                if (result.score === 0) return null; // Skip if no valid poker hand

                // Map the indices to the actual positions to remove
                const positionsToRemove = result.cardsToRemove.map(idx => hand.positions[idx]);
                
                // Highlight only the matching cards
                positionsToRemove.forEach(pos => {
                    const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                    const card = cell.firstChild;
                    if (card) {
                        card.classList.add('matching');
                    }
                });

                totalScore += result.score;
                return {
                    message: `${result.name}: ${result.score} points!`,
                    score: result.score,
                    positions: positionsToRemove,
                    cards: result.cardsToRemove.map(idx => hand.cards[idx])
                };
            }).filter(result => result !== null);

            if (handResults.length === 0) {
                this.isPaused = false;
                return;
            }

            // Create and show the poker hand notification
            const notification = document.createElement('div');
            notification.className = 'poker-notification';
            notification.innerHTML = handResults.map(result => result.message).join('<br>');
            if (handResults.length > 1) {
                notification.innerHTML += `<br>Total: ${totalScore} points!`;
            }
            document.getElementById('game-container').appendChild(notification);

            // Pause for 3 seconds, then remove cards with explosion effect
            setTimeout(() => {
                handResults.forEach(result => {
                    // Add explosion effect to each card
                    result.positions.forEach(pos => {
                        const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                        const card = cell.firstChild;
                        if (card) {
                            card.classList.add('exploding');
                        }
                    });
                });

                // Wait for explosion animation, then remove cards and apply gravity
                setTimeout(() => {
                    handResults.forEach(result => {
                        this.score += result.score;
                        result.cards.forEach(card => this.deck.addCard(card));
                    });
                    
                    // Remove all matched cards at once
                    const allPositions = handResults.flatMap(result => result.positions);
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
                        // Resume the game if no new matches are found
                        const newHands = this.board.checkForPokerHands();
                        if (newHands.length === 0) {
                            this.isPaused = false;
                        }
                        this.checkForMatches();
                    }, 500); // Wait for cards to finish falling
                }, 500); // Explosion animation duration
            }, 3000); // Display duration
        }
    }

    evaluatePokerHand(cards, positions) {
        // Sort cards by value for easier evaluation
        const sortedCards = [...cards].sort((a, b) => a.value - b.value);
        
        // Check for flush (all same suit)
        const isFlush = sortedCards.every(card => card.suit === sortedCards[0].suit);
        
        // Check for straight (consecutive values)
        let isStraight = true;
        for (let i = 1; i < sortedCards.length; i++) {
            if (sortedCards[i].value !== sortedCards[i-1].value + 1) {
                // Special case for Ace-high straight
                if (i === sortedCards.length - 1 && sortedCards[0].value === 1 && sortedCards[1].value === 10) {
                    continue;
                }
                isStraight = false;
                break;
            }
        }

        // Count card values for pairs, three of a kind, etc.
        const valueCounts = {};
        cards.forEach((card, index) => {
            valueCounts[card.value] = valueCounts[card.value] || { count: 0, indices: [] };
            valueCounts[card.value].count++;
            valueCounts[card.value].indices.push(index);
        });
        const counts = Object.values(valueCounts).map(v => v.count);

        // Royal Flush or Straight Flush
        if (isFlush && isStraight) {
            if (sortedCards[0].value === 1 && sortedCards[4].value === 13) {
                return { score: 2000, cardsToRemove: [0, 1, 2, 3, 4], name: "Royal Flush" };
            }
            return { score: 1000, cardsToRemove: [0, 1, 2, 3, 4], name: "Straight Flush" };
        }

        // Four of a Kind
        const fourOfAKind = Object.entries(valueCounts).find(([_, v]) => v.count === 4);
        if (fourOfAKind) {
            return { score: 500, cardsToRemove: fourOfAKind[1].indices, name: "Four of a Kind" };
        }

        // Full House
        if (counts.includes(3) && counts.includes(2)) {
            const threeOfAKind = Object.entries(valueCounts).find(([_, v]) => v.count === 3);
            const pair = Object.entries(valueCounts).find(([_, v]) => v.count === 2);
            return { 
                score: 300, 
                cardsToRemove: [...threeOfAKind[1].indices, ...pair[1].indices], 
                name: "Full House" 
            };
        }

        // Flush
        if (isFlush) {
            return { score: 200, cardsToRemove: [0, 1, 2, 3, 4], name: "Flush" };
        }

        // Straight
        if (isStraight) {
            return { score: 150, cardsToRemove: [0, 1, 2, 3, 4], name: "Straight" };
        }

        // Three of a Kind
        const threeOfAKind = Object.entries(valueCounts).find(([_, v]) => v.count === 3);
        if (threeOfAKind) {
            return { score: 100, cardsToRemove: threeOfAKind[1].indices, name: "Three of a Kind" };
        }

        // Two Pair
        const pairs = Object.entries(valueCounts).filter(([_, v]) => v.count === 2);
        if (pairs.length === 2) {
            return { 
                score: 50, 
                cardsToRemove: [...pairs[0][1].indices, ...pairs[1][1].indices], 
                name: "Two Pair" 
            };
        }

        // One Pair
        if (counts.includes(2)) {
            const pair = Object.entries(valueCounts).find(([_, v]) => v.count === 2);
            return { score: 25, cardsToRemove: pair[1].indices, name: "One Pair" };
        }
        
        // No valid poker hand (less than one pair)
        return { score: 0, cardsToRemove: [], name: "No Hand" };
    }

    gameLoop() {
        const now = Date.now();
        if (!this.isPaused && now - this.lastDrop > this.dropInterval) {
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
        if (this.currentCard && !this.gameOver && !this.isPaused) {
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