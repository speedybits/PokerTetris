class Game {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.cardsUsed = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.isLevelTransition = false;  // New flag for level transitions
        this.board = new Board();
        this.deck = new Deck(this.level);
        this.nextCard = this.deck.draw();
        this.currentCard = null;
        this.currentX = 2;
        this.currentY = 0;
        this.baseDropInterval = 500; // Base speed of 1 second
        this.minDropInterval = 200;  // Maximum speed (minimum interval) of 0.2 seconds
        this.dropInterval = this.baseDropInterval;
        this.lastDrop = 0;
        this.xCardDropInterval = this.baseDropInterval / 4; // X cards fall 4x faster

        // Initialize help overlay
        const helpOverlay = document.getElementById('help-overlay');
        if (helpOverlay) {
            helpOverlay.style.display = 'none';
        }

        this.initializeScreens();
        this.initializeControls();
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

        // How To Play button handler
        document.querySelector('.how-to-play-button').addEventListener('click', () => {
            this.showScreen('how-to-play-screen');
            this.initializeHowToPlay();
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

    initializeHowToPlay() {
        let currentPage = 1;
        const totalPages = 4;
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const doneButton = document.querySelector('.done-button');
        const pageIndicator = document.querySelector('.page-indicator');
        const contentContainer = document.querySelector('.how-to-play-content');

        const updateNavigation = () => {
            prevButton.disabled = currentPage === 1;
            
            // On the last page, hide Next and show Done
            if (currentPage === totalPages) {
                nextButton.style.display = 'none';
                doneButton.style.display = 'inline-block';
            } else {
                nextButton.style.display = 'inline-block';
                doneButton.style.display = 'none';
            }
            
            pageIndicator.textContent = `Page ${currentPage}/${totalPages}`;

            // Update visible page
            document.querySelectorAll('.how-to-play-page').forEach(page => {
                page.classList.remove('active');
            });
            document.querySelector(`.how-to-play-page[data-page="${currentPage}"]`).classList.add('active');
            
            // Scroll to top of content
            contentContainer.scrollTop = 0;
        };

        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateNavigation();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateNavigation();
            }
        });

        doneButton.addEventListener('click', () => {
            this.showScreen('start-screen');
        });

        // Initialize navigation state
        updateNavigation();
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
        this.startLevel();
    }

    startLevel() {
        console.log('Starting level', this.level);
        // 1. Game is paused and level transition starts
        this.isPaused = true;
        this.isLevelTransition = true;
        
        // 2. Board is cleared
        this.board = new Board();
        
        // Clear any existing cards
        this.currentCard = null;
        this.nextCard = this.deck.draw();  // Draw first card but don't display yet
        
        // Clear next card display
        const nextCardElement = document.getElementById('next-card');
        nextCardElement.innerHTML = '';
        
        // Force a clean board display
        this.board.updateDisplay(this.board.grid);

        // Update help screen to reflect new level restrictions
        this.updateHelpScreen();
        
        // 3-6. Show popup, wait, then start game
        this.showLevelPopup(() => {
            console.log('Level popup finished, starting game');
            this.isLevelTransition = false;  // Level transition ends
            this.spawnCard();
            this.gameLoop();
        });
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
        const helpOverlay = document.getElementById('help-overlay');
        const helpButton = document.getElementById('help-button');
        const helpDoneButton = document.querySelector('.help-done-button');

        // Help screen functionality
        const showHelpScreen = () => {
            console.log('Showing help screen');
            if (this.gameOver) return;
            
            this.isPaused = true;
            this.updateHelpScreen();
            helpOverlay.style.display = 'flex';
            // Scroll help content to top
            const helpContent = document.querySelector('.help-content');
            if (helpContent) {
                helpContent.scrollTop = 0;
            }
        };

        const hideHelpScreen = () => {
            console.log('Hiding help screen');
            helpOverlay.style.display = 'none';
            this.isPaused = false;
        };

        // Add help button handlers
        if (helpButton) {
            console.log('Setting up Help button');
            helpButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Help button clicked');
                showHelpScreen();
            };
            
            helpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Help button touched');
                showHelpScreen();
            }, { passive: false });
        } else {
            console.error('Help button not found in DOM');
        }

        // Add help done button handler
        if (helpDoneButton) {
            console.log('Setting up Help Done button');
            helpDoneButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Help Done button clicked');
                hideHelpScreen();
            };
            
            helpDoneButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Help Done button touched');
                hideHelpScreen();
            }, { passive: false });
        } else {
            console.error('Help Done button not found in DOM');
        }

        // Debug log to check elements
        console.log('Help elements found:', {
            helpButton: helpButton !== null,
            helpOverlay: helpOverlay !== null,
            helpDoneButton: helpDoneButton !== null
        });

        // Prevent default touch behavior
        [gameContainer, touchLeft, touchRight, gameBoard].forEach(element => {
            if (element) {
                element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
                element.addEventListener('touchend', (e) => e.preventDefault());
            }
        });

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

        // Left touch area
        touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver || !this.currentCard) return;
            if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        }, { passive: false });

        // Right touch area
        touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver || !this.currentCard) return;
            if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX + 1, this.currentY)) {
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
            if (this.gameOver || !this.currentCard) return;
            if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                this.currentX--;
            }
        });

        touchRight.addEventListener('click', (e) => {
            if (this.gameOver || !this.currentCard) return;
            if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX + 1, this.currentY)) {
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
        if (this.isPaused || this.isLevelTransition || this.gameOver || !this.currentCard || this.currentCard.isX()) return;
        
        if (column >= 0 && column < 5 && this.board.isValidPosition(column, this.currentY)) {
            this.currentX = column;
        }
    }

    spawnCard() {
        // Don't spawn cards if the game is paused or during level transition
        if (this.isPaused || this.isLevelTransition) {
            console.log('Attempted to spawn card while paused or during level transition');
            return;
        }

        console.log('Spawning new card');
        this.currentCard = this.nextCard;
        this.nextCard = this.deck.draw();
        this.cardsUsed++;
        
        // Check if we've used all cards in the deck
        if (this.cardsUsed >= 52) {
            this.level++;
            this.cardsUsed = 0;
            this.deck.setLevel(this.level);
            
            // Start the new level sequence
            this.startLevel();
            return;  // Don't continue with spawn until new level is started
        }

        // Choose a random column between 0 and 4 (inclusive)
        this.currentX = Math.floor(Math.random() * 5);
        this.currentY = 0;

        // Set drop interval based on card type
        this.dropInterval = this.currentCard.isX() ? this.xCardDropInterval : this.baseDropInterval;

        // Update next card display
        const nextCardElement = document.getElementById('next-card');
        nextCardElement.innerHTML = '';
        const cardDiv = document.createElement('div');
        
        // Debug logging
        console.log('Creating card:', {
            isRed: this.nextCard.isRed(),
            isJoker: this.nextCard.isJoker(),
            isX: this.nextCard.isX(),
            suit: this.nextCard.suit,
            value: this.nextCard.value
        });

        const classes = ['card'];
        if (this.nextCard.isRed()) classes.push('red');
        if (this.nextCard.isJoker()) classes.push('joker');
        if (this.nextCard.isX()) classes.push('x');
        
        cardDiv.className = classes.join(' ');
        console.log('Card classes:', cardDiv.className);
        
        cardDiv.innerHTML = this.nextCard.toString();
        console.log('Card HTML:', cardDiv.outerHTML);
        
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
        // Don't lock cards if the game is paused or during level transition
        if (this.isPaused || this.isLevelTransition) {
            console.log('Attempted to lock card while paused or during level transition');
            return;
        }

        console.log('Locking card');
        this.board.placeCard(this.currentCard, this.currentX, this.currentY);
        
        // Quick initial match check
        setTimeout(() => {
            this.checkForMatches();
        }, 300);

        this.spawnCard();
    }

    showPokerHandNotification(handResult, positions) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.poker-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'poker-notification';
        const points = Math.ceil(handResult.score * this.getPointMultiplier());
        notification.textContent = `${handResult.name}: ${points} points!`;

        // Add to game board and remove after animation
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.appendChild(notification);
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
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
                    const matchingPositions = handResult.matchingIndices.map(idx => hand.positions[idx]);
                    matchingPositions.forEach(pos => {
                        cardsToRemove.add(`${pos.x},${pos.y}`);
                        
                        // Highlight only the matching cards
                        const cardElement = document.querySelector(
                            `.card-cell[data-x="${pos.x}"][data-y="${pos.y}"] .card`
                        );
                        if (cardElement) {
                            cardElement.classList.add('matching');
                        }
                    });

                    // Show notification next to the matched cards
                    this.showPokerHandNotification(handResult, matchingPositions);
                } else if (handResult.score > 0) {
                    // Show notification for invalid hand due to level restriction
                    const matchingPositions = handResult.matchingIndices.map(idx => hand.positions[idx]);
                    const invalidNotification = {
                        name: `Level ${this.level}: ${handResult.name} not matched!`,
                        score: 0
                    };
                    this.showPokerHandNotification(invalidNotification, matchingPositions);
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
        // Find all Jokers in the hand
        const jokerIndices = cards.map((card, index) => card.isJoker() ? index : -1).filter(i => i !== -1);
        
        if (jokerIndices.length === 0) {
            // No Jokers, evaluate normally
            return this.evaluateRegularHand(cards);
        }

        // Try all possible combinations for each Joker
        let bestResult = { score: 0, name: "No Hand", matchingIndices: [] };
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = Array.from({length: 13}, (_, i) => i + 1);

        // Helper function to recursively try all combinations
        const tryJokerCombinations = (currentCards, jokerIndex) => {
            // Base case: all Jokers have been assigned
            if (jokerIndex >= jokerIndices.length) {
                const result = this.evaluateRegularHand([...currentCards]);
                if (result.score > bestResult.score) {
                    bestResult = {
                        ...result,
                        // Map back the matching indices to include Jokers
                        matchingIndices: result.matchingIndices.map(i => {
                            const originalIndex = jokerIndices.indexOf(i);
                            return originalIndex >= 0 ? jokerIndices[originalIndex] : i;
                        })
                    };
                }
                return;
            }

            // Try each possible card for this Joker
            for (const suit of suits) {
                for (const value of values) {
                    currentCards[jokerIndices[jokerIndex]] = new Card(suit, value);
                    tryJokerCombinations(currentCards, jokerIndex + 1);
                }
            }
        };

        // Start the recursive evaluation with a copy of the cards
        tryJokerCombinations([...cards], 0);

        return bestResult;
    }

    evaluateRegularHand(cards) {
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
        
        // Only update falling cards if the game isn't paused and not in level transition
        if (!this.isPaused && !this.gameOver && !this.isLevelTransition) {
            if (now - this.lastDrop > this.dropInterval) {
                if (this.board.isValidPosition(this.currentX, this.currentY + 1)) {
                    this.currentY++;
                } else {
                    this.lockCard();
                }
                this.lastDrop = now;
            }

            // Only update display if not paused or in transition
            const displayGrid = this.board.grid.map(row => [...row]);
            if (this.currentCard) {
                displayGrid[this.currentY][this.currentX] = this.currentCard;
            }
            this.board.updateDisplay(displayGrid);
        }

        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    handleKeyPress(event) {
        if (this.isPaused || this.isLevelTransition || this.gameOver || !this.currentCard) return;

        switch (event.key) {
            case 'ArrowLeft':
                if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX - 1, this.currentY)) {
                    this.currentX--;
                }
                break;
            case 'ArrowRight':
                if (!this.currentCard.isX() && this.board.isValidPosition(this.currentX + 1, this.currentY)) {
                    this.currentX++;
                }
                break;
            case ' ':
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

    showLevelPopup(callback) {
        const popup = document.getElementById('level-popup');
        let message = '';

        // Determine the message based on level
        if (this.level === 1) {
            message = "Level 1: All Poker Hands Valid!";
        } else if (this.level === 2) {
            message = "Level 2: Pairs No Longer Count!";
        } else if (this.level === 3) {
            message = "Level 3: Two Pairs No Longer Count!";
        } else if (this.level === 4) {
            message = "Level 4: Three of a Kind No Longer Count!";
        } else if (this.level === 5) {
            message = "Level 5: Straight No Longer Count!";
        } else if (this.level === 6) {
            message = "Level 6: Flush No Longer Count!";
        } else if (this.level === 7) {
            message = "Level 7: Full House No Longer Count!";
        } else if (this.level === 8) {
            message = "Level 8: Four of a Kind No Longer Count!";
        } else {
            message = `Level ${this.level}: Only Royal/Straight Flush!`;
        }

        // 3. Show the popup
        popup.textContent = message;
        popup.classList.add('active');

        // 4. Wait 4 seconds, then 5. Fade out popup
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => {
                popup.classList.remove('active', 'fade-out');
                // 6. Game unpauses
                this.isPaused = false;
                // 7. Callback (which will spawn next card)
                if (callback) callback();
            }, 300);
        }, 4000);
    }

    updateHelpScreen() {
        const handItems = document.querySelectorAll('.poker-hand-item');
        handItems.forEach(item => {
            const handType = item.getAttribute('data-hand');
            const isValid = this.isHandValid(handType);
            
            item.classList.toggle('restricted', !isValid);
            
            // Add or update restriction level text
            let restrictionSpan = item.querySelector('.restriction');
            if (!isValid) {
                if (!restrictionSpan) {
                    restrictionSpan = document.createElement('span');
                    restrictionSpan.className = 'restriction';
                    item.appendChild(restrictionSpan);
                }
                // Find the level at which this hand becomes restricted
                const restrictionLevel = this.getHandRestrictionLevel(handType);
                restrictionSpan.textContent = `(Level ${restrictionLevel}+)`;
            } else if (restrictionSpan) {
                restrictionSpan.remove();
            }
        });
    }

    getHandRestrictionLevel(handType) {
        const restrictionLevels = {
            'One Pair': 2,
            'Two Pair': 3,
            'Three of a Kind': 4,
            'Straight': 5,
            'Flush': 6,
            'Full House': 7,
            'Four of a Kind': 8
        };
        return restrictionLevels[handType] || 9;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 