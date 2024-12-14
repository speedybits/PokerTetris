class Board {
    constructor() {
        this.width = 5;
        this.height = 10;
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.element = document.getElementById('game-board');
        this.lastPlacedPosition = null;  // Track the position of the last placed card
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
            this.lastPlacedPosition = {x, y};  // Update the last placed position
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
        let allMoves = []; // Store all moves across all columns
        
        // Process each column independently
        for (let x = 0; x < this.width; x++) {
            let writePos = this.height - 1; // Start from bottom
            let columnMoves = []; // Store moves for this column
            
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
                            columnMoves.push({
                                fromY: y,
                                toY: writePos,
                                card: this.grid[y][x],
                                element: cardElement
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
                        }
                    }
                    writePos--;
                }
            }
            
            // Add this column's moves to the overall moves
            if (columnMoves.length > 0) {
                allMoves.push({ x, moves: columnMoves });
            }
        }
        
        // If we have moves to make, set up a single timeout for all animations
        if (allMoves.length > 0) {
            setTimeout(() => {
                // Process all moves after animations complete
                allMoves.forEach(({ x, moves }) => {
                    moves.forEach((move, index) => {
                        // Reset animation styles
                        move.element.style.transform = '';
                        move.element.classList.remove('falling');
                        
                        // Move card to new position
                        const targetCell = this.element.children[move.toY * this.width + x];
                        targetCell.appendChild(move.element);
                        
                        // Update grid state
                        this.grid[move.toY][x] = move.card;
                        this.grid[move.fromY][x] = null;

                        // Update lastPlacedPosition for the last card that falls in this column
                        if (index === moves.length - 1) {
                            this.lastPlacedPosition = { x, y: move.toY };
                        }
                    });
                });
            }, 1000);
        }
        
        return cardsMoved;
    }

    checkForPokerHands() {
        const hands = [];
        const lastPlacedCard = this.lastPlacedPosition;  // We'll need to add this as a class property
        
        if (!lastPlacedCard) return hands;  // If no card was just placed, return empty array
        
        // Check horizontal hands that include the last placed card
        const y = lastPlacedCard.y;
        // Check all possible 5-card sequences that include the last placed card
        for (let startX = Math.max(0, lastPlacedCard.x - 4); startX <= Math.min(this.width - 5, lastPlacedCard.x); startX++) {
            const cards = [];
            const positions = [];
            let xCount = 0;
            
            // Collect 5 cards and their positions
            for (let i = 0; i < 5; i++) {
                const card = this.grid[y][startX + i];
                if (card === null) break;
                if (card.isX()) {
                    xCount++;
                    break;
                }
                cards.push(card);
                positions.push({x: startX + i, y});
            }
            
            // Only add if we found exactly 5 cards and no X cards
            if (cards.length === 5 && xCount === 0) {
                hands.push({cards, positions});
            }
        }

        // Check vertical hands that include the last placed card
        const x = lastPlacedCard.x;
        // Check all possible 5-card sequences that include the last placed card
        for (let startY = Math.max(0, lastPlacedCard.y - 4); startY <= Math.min(this.height - 5, lastPlacedCard.y); startY++) {
            const cards = [];
            const positions = [];
            let xCount = 0;
            
            // Collect 5 cards and their positions
            for (let i = 0; i < 5; i++) {
                const card = this.grid[startY + i][x];
                if (card === null) break;
                if (card.isX()) {
                    xCount++;
                    break;
                }
                cards.push(card);
                positions.push({x, y: startY + i});
            }
            
            // Only add if we found exactly 5 cards and no X cards
            if (cards.length === 5 && xCount === 0) {
                hands.push({cards, positions});
            }
        }

        console.log('Found potential hands:', hands.length);
        hands.forEach((hand, index) => {
            console.log(`Hand ${index}:`, 
                hand.cards.map(card => `${card.value}${card.suit[0]}`),
                'at positions:', hand.positions
            );
        });

        return hands;
    }
} 