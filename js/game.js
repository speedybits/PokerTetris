class Game {
    constructor() {
        this.initializeScreens();
        this.resetGame();
        this.initializeControls();
        this.baseDropInterval = 500; // Base speed of 1 second
        this.minDropInterval = 200;   // Maximum speed (minimum interval) of 0.2 seconds
        this.isPaused = false;  // Add pause state
        this.updateGameInfo();

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
        this.level = 1;
        this.cardsUsed = 0;
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
        const quickDrop = document.getElementById('quick-drop');

        console.log('Quick Drop button found:', quickDrop !== null);  // Debug if button exists

        // Quick Drop button handler
        if (quickDrop) {
            console.log('Setting up Quick Drop button');
            // Add both click and touchstart events for better mobile response
            ['click', 'touchstart'].forEach(eventType => {
                const handler = function(e) {
                    e.preventDefault();
                    console.log(`Quick Drop activated via button (${eventType})`);
                    if (!this.gameOver && !this.isPaused) {
                        this.dropToBottom();
                    }
                };
                quickDrop.addEventListener(eventType, handler.bind(this));
                console.log(`Added ${eventType} listener to Quick Drop button`);
            });

            // Also add direct onclick handler as backup
            const onClickHandler = function(e) {
                e.preventDefault();
                console.log('Quick Drop activated via onclick');
                if (!this.gameOver && !this.isPaused) {
                    this.dropToBottom();
                }
            };
            quickDrop.onclick = onClickHandler.bind(this);
        } else {
            console.error('Quick Drop button not found in DOM');
        }

        // Log all button properties to ensure it's properly set up
        console.log('Quick Drop button properties:', {
            id: quickDrop.id,
            onclick: quickDrop.onclick,
            listeners: quickDrop.getEventListeners,
            style: quickDrop.style.display
        });

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

        // Test that dropToBottom is working
        this.dropToBottom = this.dropToBottom.bind(this);
        console.log('dropToBottom method bound:', typeof this.dropToBottom);  // Debug log
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
        this.cardsUsed++;
        
        // Check if we've used all cards in the deck
        if (this.cardsUsed >= 52) {
            this.level++;
            this.cardsUsed = 0;
        }

        this.currentX = 3;
        this.currentY = 0;

        // Update next card display
        const nextCardElement = document.getElementById('next-card');
        nextCardElement.innerHTML = '';
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${this.nextCard.isRed() ? 'red' : ''}`;
        cardDiv.innerHTML = this.nextCard.toString();
        nextCardElement.appendChild(cardDiv);

        // Update game info display
        this.updateGameInfo();

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
        this.showScreen('start-screen');
        highScores.displayScores();
    }

    lockCard() {
        this.board.placeCard(this.currentCard, this.currentX, this.currentY);
        
        // Quick initial match check
        setTimeout(() => {
            this.checkForMatches();
        }, 300); // Keep quick initial check

        this.spawnCard();
    }

    checkForMatches() {
        const hands = this.board.checkForPokerHands();
        console.log('Checking for hands:', hands);
        
        if (hands.length > 0) {
            console.log('Found hands:', hands.length);
            this.isPaused = true;
            let totalPoints = 0;
            let validHandFound = false;
            let cardsToRemove = new Set();
            
            hands.forEach((hand, index) => {
                console.log(`Evaluating hand ${index}:`, 
                    hand.cards.map(card => `${card.value}${card.suit[0]}`));
                const handResult = this.evaluatePokerHand(hand.cards);
                console.log(`Hand ${index} result:`, handResult);
                
                if (handResult.score > 0 && this.isHandValid(handResult.name)) {
                    validHandFound = true;
                    totalPoints += Math.ceil(handResult.score * this.getPointMultiplier());
                    console.log(`Valid hand found! Points awarded:`, 
                        handResult.score, 
                        'with multiplier:', 
                        this.getPointMultiplier());
                    
                    // Only highlight and remove the cards that are part of the winning hand
                    handResult.matchingIndices.forEach(idx => {
                        const pos = hand.positions[idx];
                        cardsToRemove.add(`${pos.x},${pos.y}`);
                        
                        // Highlight only the matching cards
                        const cardElement = document.querySelector(
                            `.card-cell[data-x="${pos.x}"][data-y="${pos.y}"] .card`
                        );
                        if (cardElement) {
                            cardElement.classList.add('matching');
                        }
                    });
                } else {
                    console.log(`Hand ${index} invalid:`, 
                        handResult.name, 
                        'Score:', handResult.score,
                        'Valid for level:', this.isHandValid(handResult.name));
                }
            });

            if (totalPoints > 0) {
                this.score += totalPoints;
                console.log('Updated total score:', this.score);
                this.updateGameInfo();
            }

            if (validHandFound) {
                // Convert Set back to array of positions
                const positionsToRemove = Array.from(cardsToRemove)
                    .map(pos => {
                        const [x, y] = pos.split(',');
                        return {x: parseInt(x), y: parseInt(y)};
                    });

                setTimeout(() => {
                    console.log('Removing cards at positions:', positionsToRemove);
                    this.board.removeCards(positionsToRemove);
                    
                    setTimeout(() => {
                        this.isPaused = false;
                        this.checkForMatches();
                    }, 500);
                }, 1000);
            } else {
                this.isPaused = false;
            }
        } else {
            this.isPaused = false;
        }
    }

    evaluatePokerHand(cards) {
        // Sort cards by value for easier evaluation
        const sortedCards = [...cards].sort((a, b) => a.value - b.value);
        
        // Check for flush (all same suit)
        const isFlush = cards.every(card => card.suit === cards[0].suit);
        
        // Check for straight
        let isStraight = false;
        
        // Check normal straight
        if (sortedCards[4].value - sortedCards[0].value === 4 &&
            new Set(sortedCards.map(c => c.value)).size === 5) {
            isStraight = true;
        }
        
        // Check Ace-high straight (10-J-Q-K-A)
        if (!isStraight && sortedCards[0].value === 1 && sortedCards[1].value === 10) {
            isStraight = sortedCards[1].value === 10 &&
                         sortedCards[2].value === 11 &&
                         sortedCards[3].value === 12 &&
                         sortedCards[4].value === 13;
        }
        
        // Count card values
        const valueCounts = new Map();
        cards.forEach((card, index) => {
            if (!valueCounts.has(card.value)) {
                valueCounts.set(card.value, { count: 0, indices: [] });
            }
            const data = valueCounts.get(card.value);
            data.count++;
            data.indices.push(index);
        });
        
        const counts = Array.from(valueCounts.values()).map(v => v.count);
        
        // Check hands in descending order of value
        if (isFlush && isStraight) {
            if (sortedCards[0].value === 1 && sortedCards[4].value === 13) {
                return { 
                    score: 2000, 
                    name: "Royal Flush",
                    matchingIndices: [0, 1, 2, 3, 4]  // All cards are part of the hand
                };
            }
            return { 
                score: 1000, 
                name: "Straight Flush",
                matchingIndices: [0, 1, 2, 3, 4]  // All cards are part of the hand
            };
        }
        
        // Four of a Kind
        for (const [value, data] of valueCounts.entries()) {
            if (data.count === 4) {
                return { 
                    score: 500, 
                    name: "Four of a Kind",
                    matchingIndices: data.indices  // Only the 4 matching cards
                };
            }
        }
        
        // Full House
        let threeOfAKindIndices = null;
        let pairIndices = null;
        for (const [value, data] of valueCounts.entries()) {
            if (data.count === 3) threeOfAKindIndices = data.indices;
            if (data.count === 2) pairIndices = data.indices;
        }
        if (threeOfAKindIndices && pairIndices) {
            return { 
                score: 300, 
                name: "Full House",
                matchingIndices: [...threeOfAKindIndices, ...pairIndices]
            };
        }
        
        if (isFlush) {
            return { 
                score: 200, 
                name: "Flush",
                matchingIndices: [0, 1, 2, 3, 4]  // All cards are part of the hand
            };
        }
        
        if (isStraight) {
            return { 
                score: 150, 
                name: "Straight",
                matchingIndices: [0, 1, 2, 3, 4]  // All cards are part of the hand
            };
        }
        
        // Three of a Kind
        for (const [value, data] of valueCounts.entries()) {
            if (data.count === 3) {
                return { 
                    score: 100, 
                    name: "Three of a Kind",
                    matchingIndices: data.indices  // Only the 3 matching cards
                };
            }
        }
        
        // Two Pair
        const pairs = Array.from(valueCounts.entries())
            .filter(([_, data]) => data.count === 2);
        if (pairs.length === 2) {
            return { 
                score: 50, 
                name: "Two Pair",
                matchingIndices: [...pairs[0][1].indices, ...pairs[1][1].indices]  // Only the 4 paired cards
            };
        }
        
        // One Pair
        for (const [value, data] of valueCounts.entries()) {
            if (data.count === 2) {
                return { 
                    score: 25, 
                    name: "One Pair",
                    matchingIndices: data.indices  // Only the 2 matching cards
                };
            }
        }
        
        return { score: 0, name: "No Hand", matchingIndices: [] };
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
                console.log('Quick Drop activated via spacebar');
                this.dropToBottom();
                break;
        }
    }

    dropToBottom() {
        console.log('Starting dropToBottom');
        if (!this.gameOver && !this.isPaused) {
            let initialY = this.currentY;
            while (this.board.isValidPosition(this.currentX, this.currentY + 1)) {
                this.currentY++;
            }
            console.log(`Card dropped from row ${initialY} to row ${this.currentY}`);
            this.lockCard();
        }
    }

    getPointMultiplier() {
        return (this.level);
    }

    isHandValid(handType) {
        // Level restrictions as per markdown:
        // Level 1: All poker hands are valid (except high card)
        // Level 2: Pairs no longer count
        // Level 3: Two Pairs also no longer count
        // Level 4: Three of a Kind also no longer count
        // Level 5: Straight also no longer count
        // Level 6: Flush also no longer count
        // Level 7: Full House also no longer count
        // Level 8: Four of a Kind also no longer count
        // Level 9+: Only Royal Flush and Straight Flush count
        
        const invalidHandsByLevel = {
            2: ['One Pair'],
            3: ['One Pair', 'Two Pair'],
            4: ['One Pair', 'Two Pair', 'Three of a Kind'],
            5: ['One Pair', 'Two Pair', 'Three of a Kind', 'Straight'],
            6: ['One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush'],
            7: ['One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House'],
            8: ['One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind']
        };

        // Level 9 and above only allow Royal Flush and Straight Flush
        if (this.level >= 9) {
            return handType === 'Royal Flush' || handType === 'Straight Flush';
        }

        // For other levels, check if the hand type is invalid for current level
        return !invalidHandsByLevel[this.level]?.includes(handType);
    }

    calculateHandPoints(handType) {
        const basePoints = {
            'Royal Flush': 2000,
            'Straight Flush': 1000,
            'Four of a Kind': 500,
            'Full House': 300,
            'Flush': 200,
            'Straight': 150,
            'Three of a Kind': 100,
            'Two Pair': 50,
            'One Pair': 25
        };

        // If the hand type is not valid for current level, return 0 points
        if (!this.isHandValid(handType)) {
            return 0;
        }

        // Calculate points with level multiplier and round up
        const points = basePoints[handType];
        if (!points) return 0;
        
        return Math.ceil(points * this.getPointMultiplier());
    }

    updateGameInfo() {
        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.innerHTML = `
            Level ${this.level} (${52 - this.cardsUsed} cards left)<br>
            Score: ${this.score}
        `;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 