class Board {
    constructor() {
        this.width = 7;
        this.height = 15;
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
                    cardDiv.textContent = displayGrid[y][x].toString();
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
        // Process each column independently
        for (let x = 0; x < this.width; x++) {
            let writePos = this.height - 1; // Start from bottom
            
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
                            // Calculate the distance to move
                            const distance = writePos - y;
                            // Move the card to the new cell
                            const targetCell = this.element.children[writePos * this.width + x];
                            targetCell.appendChild(cardElement);
                            // Update the grid
                            this.grid[writePos][x] = this.grid[y][x];
                            this.grid[y][x] = null;
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