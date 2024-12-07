class Game {
    constructor() {
        this.initializeScreens();
        this.resetGame();
        this.initializeControls();
        this.baseDropInterval = 500; // Base speed of 1 second
        this.minDropInterval = 200;   // Maximum speed (minimum interval) of 0.2 seconds
        this.isPaused = false;  // Add pause state

        // Add keyboard event listener
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
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
        
        // Wait for any falling animations to complete before checking matches
        setTimeout(() => {
            this.checkForMatches();
        }, 1000); // 1 second delay to match the falling animation duration

        this.spawnCard();
    }

    checkForMatches() {
        const hands = this.board.checkForPokerHands();
        console.log('Checking for hands:', hands);
        
        if (hands.length > 0) {
            console.log('Found hands:', hands.length);
            this.isPaused = true;
            
            let totalScore = 0;
            const handResults = hands.map(hand => {
                const result = this.evaluatePokerHand(hand.cards);
                console.log('Evaluated hand:', result);
                
                if (result.score === 0) return null;

                const positionsToRemove = result.cardsToRemove.map(idx => hand.positions[idx]);
                console.log('Positions to remove:', positionsToRemove);
                
                // Start matching animation
                positionsToRemove.forEach(pos => {
                    const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                    console.log('Found cell:', cell);
                    if (cell.firstChild) {
                        const card = cell.firstChild;
                        console.log('Animating card:', card.textContent);
                        // Apply initial scale animation
                        card.classList.add('matching');
                        console.log('Applied initial animation styles');
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

            console.log('Processed hand results:', handResults);

            if (handResults.length === 0) {
                console.log('No valid hands found');
                this.isPaused = false;
                return;
            }

            // Show notification
            const notification = document.createElement('div');
            notification.className = 'poker-notification';
            notification.innerHTML = handResults.map(result => result.message).join('<br>');
            if (handResults.length > 1) {
                notification.innerHTML += `<br>Total: ${totalScore} points!`;
            }
            document.getElementById('game-container').appendChild(notification);
            console.log('Added notification:', notification.innerHTML);

            // Highlight matching cards
            handResults.forEach(result => {
                result.positions.forEach(pos => {
                    const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                    if (cell.firstChild) {
                        const card = cell.firstChild;
                        console.log('Starting animation for card:', card.textContent);
                        
                        // Make card much larger and red
                        card.style.transform = 'scale(1.5)';
                        card.style.backgroundColor = 'red';
                        card.style.transition = 'all 1s ease-in-out';
                        card.style.zIndex = '1000';
                        console.log('Applied initial animation styles');
                        
                        // After 1 second, start pulsing
                        setTimeout(() => {
                            card.style.animation = 'pulse 0.5s ease-in-out infinite';
                            card.style.backgroundColor = 'yellow';
                            console.log('Started pulsing animation');
                        }, 1000);
                    }
                });
            });

            // Add pulse animation if it doesn't exist
            if (!document.querySelector('#pulse-animation')) {
                const style = document.createElement('style');
                style.id = 'pulse-animation';
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1.5); }
                        50% { transform: scale(1.8); }
                        100% { transform: scale(1.5); }
                    }
                `;
                document.head.appendChild(style);
            }

            // After 3 seconds, remove cards
            setTimeout(() => {
                console.log('Starting card removal sequence');
                handResults.forEach(result => {
                    result.positions.forEach(pos => {
                        const cell = this.board.element.children[pos.y * this.board.width + pos.x];
                        if (cell.firstChild) {
                            console.log('Removing card:', cell.firstChild.textContent);
                            cell.firstChild.remove();
                        }
                    });
                    
                    this.score += result.score;
                    result.cards.forEach(card => this.deck.addCard(card));
                });
                
                const allPositions = handResults.flatMap(result => result.positions);
                this.board.removeCards(allPositions);
                console.log('Cards removed, applying gravity');
                
                document.getElementById('score').textContent = this.score;
                notification.remove();
                console.log('Notification removed');

                // Wait longer for cards to settle after gravity
                setTimeout(() => {
                    console.log('Cards have settled, checking for new hands');
                    const newHands = this.board.checkForPokerHands();
                    console.log('Found new hands:', newHands.length);
                    if (newHands.length === 0) {
                        this.isPaused = false;
                        console.log('Game unpaused');
                    }
                    this.checkForMatches();
                }, 1500); // Increased from 1000 to 1500 to ensure cards have settled
            }, 3000);
        }
    }

    evaluatePokerHand(cards) {
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

        // Royal Flush
        if (isFlush && isStraight && sortedCards[0].value === 1 && sortedCards[4].value === 13) {
            return { score: 2000, cardsToRemove: [0, 1, 2, 3, 4], name: "Royal Flush" };
        }
        // Straight Flush
        if (isFlush && isStraight) {
            return { score: 1000, cardsToRemove: [0, 1, 2, 3, 4], name: "Straight Flush" };
        }
        // Four of a Kind
        if (counts.includes(4)) {
            const fourOfAKind = Object.entries(valueCounts).find(([_, v]) => v.count === 4);
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
        if (counts.includes(3)) {
            const threeOfAKind = Object.entries(valueCounts).find(([_, v]) => v.count === 3);
            return { score: 100, cardsToRemove: threeOfAKind[1].indices, name: "Three of a Kind" };
        }
        // Two Pair
        if (counts.filter(count => count === 2).length === 2) {
            const pairs = Object.entries(valueCounts).filter(([_, v]) => v.count === 2);
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
        
        return { score: 0, cardsToRemove: [], name: "No Hand" };
    }

    gameLoop() {
        const now = Date.now();
        
        // Only update falling cards if the game isn't paused
        if (!this.isPaused && !this.gameOver) {
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
            if (this.currentCard) {
                displayGrid[this.currentY][this.currentX] = this.currentCard;
            }

            // Update the display with the current state
            this.board.updateDisplay(displayGrid);
        }

        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    handleKeyPress(event) {
        if (this.gameOver || this.isPaused) return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault(); // Prevent page scrolling
                this.dropToBottom();
                break;
        }
    }

    dropToBottom() {
        // Drop card to lowest possible position in current column
        while (this.board.isValidPosition(this.currentX, this.currentY + 1)) {
            this.currentY++;
        }
        this.lockCard();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 