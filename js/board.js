class Board {
    constructor() {
        this.width = 5;
        this.height = 10;
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.element = document.getElementById('game-board');
        this.initializeBoard();
    }

    initializeBoard() {
        this.element.innerHTML = '';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'card-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.element.appendChild(cell);
            }
        }
    }

    updateDisplay(displayGrid) {
        const cells = this.element.getElementsByClassName('card-cell');
        // First clear all cells
        for (let cell of cells) {
            cell.innerHTML = '';
        }
        
        // Then add cards where they exist in the display grid
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (displayGrid[y][x]) {
                    const cell = cells[y * this.width + x];
                    const cardDiv = document.createElement('div');
                    cardDiv.className = `card ${displayGrid[y][x].isRed() ? 'red' : ''}`;
                    cardDiv.innerHTML = displayGrid[y][x].toString();
                    cell.appendChild(cardDiv);
                }
            }
        }
    }

    isValidPosition(x, y) {
        // Check bounds first
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        // Check if position is occupied
        return !this.grid[y][x];
    }

    placeCard(card, x, y) {
        if (this.isValidPosition(x, y)) {
            this.grid[y][x] = card;
            return true;
        }
        return false;
    }

    removeCards(positions) {
        // Remove the cards from their positions
        positions.forEach(pos => {
            this.grid[pos.y][pos.x] = null;
        });
        
        // Apply gravity and wait for cards to settle
        const cardsMoved = this.applyGravity();
        
        // If cards moved due to gravity, they need time to settle
        if (cardsMoved) {
            console.log('Cards are falling, waiting for them to settle...');
        } else {
            console.log('No cards needed to fall');
        }
    }

    applyGravity() {
        let cardsMoved = false;
        let animationsInProgress = 0;
        
        // Process each column independently
        for (let x = 0; x < this.width; x++) {
            let writePos = this.height - 1; // Start from bottom
            let moves = []; // Store moves to make after animation
            
            // Read from bottom to top
            for (let y = this.height - 1; y >= 0; y--) {
                if (this.grid[y][x] !== null) {
                    // If we found a card and it needs to move down
                    if (writePos !== y) {
                        cardsMoved = true;
                        // Get the card element
                        const cell = this.element.children[y * this.width + x];
                        const cardElement = cell.firstChild;
                        if (cardElement) {
                            animationsInProgress++;
                            
                            // Store the move to make
                            moves.push({
                                fromY: y,
                                toY: writePos,
                                card: this.grid[y][x]
                            });
                            
                            // Add falling animation class
                            cardElement.classList.add('falling');
                            
                            // Calculate the vertical distance to move
                            const initialRect = cardElement.getBoundingClientRect();
                            const targetCell = this.element.children[writePos * this.width + x];
                            const targetRect = targetCell.getBoundingClientRect();
                            const yDiff = targetRect.top - initialRect.top;
                            
                            // Apply transform for smooth vertical-only animation
                            cardElement.style.transform = `translateY(${yDiff}px)`;
                            
                            // After animation completes, move to new position and clean up
                            setTimeout(() => {
                                cardElement.style.transform = '';
                                cardElement.classList.remove('falling');
                                targetCell.appendChild(cardElement);
                                animationsInProgress--;
                                
                                // If this was the last animation, update the grid
                                if (animationsInProgress === 0) {
                                    // Apply all moves to the grid
                                    moves.forEach(move => {
                                        this.grid[move.toY][x] = move.card;
                                        this.grid[move.fromY][x] = null;
                                    });
                                }
                            }, 1000);
                        }
                    }
                    writePos--;
                }
            }
        }
        return cardsMoved;
    }

    checkForPokerHands() {
        const hands = [];
        // Check horizontal hands
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x <= this.width - 5; x++) {
                const cards = this.grid[y].slice(x, x + 5);
                // Only consider if we have all 5 cards
                if (!cards.includes(null)) {
                    const positions = Array.from({length: 5}, (_, i) => ({x: x + i, y}));
                    hands.push({
                        cards: cards,
                        positions: positions
                    });
                }
            }
        }

        // Check vertical hands
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y <= this.height - 5; y++) {
                const cards = Array.from({length: 5}, (_, i) => this.grid[y + i][x]);
                // Only consider if we have all 5 cards
                if (!cards.includes(null)) {
                    const positions = Array.from({length: 5}, (_, i) => ({x, y: y + i}));
                    hands.push({
                        cards: cards,
                        positions: positions
                    });
                }
            }
        }

        return hands;
    }
} 