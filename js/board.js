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

    checkForPokerHands() {
        const hands = [];
        // Check horizontal hands
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x <= this.width - 5; x++) {
                const hand = this.grid[y].slice(x, x + 5).filter(card => card !== null);
                if (hand.length === 5) {
                    hands.push({cards: hand, positions: Array.from({length: 5}, (_, i) => ({x: x + i, y}))});
                }
            }
        }

        // Check vertical hands
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y <= this.height - 5; y++) {
                const hand = Array.from({length: 5}, (_, i) => this.grid[y + i][x]).filter(card => card !== null);
                if (hand.length === 5) {
                    hands.push({cards: hand, positions: Array.from({length: 5}, (_, i) => ({x, y: y + i}))});
                }
            }
        }

        return hands;
    }

    removeCards(positions) {
        positions.forEach(({x, y}) => {
            this.grid[y][x] = null;
        });
        // Update display after removing cards
        this.updateDisplay(this.grid);
    }
} 