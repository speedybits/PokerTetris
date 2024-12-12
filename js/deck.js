class Deck {
    constructor(level = 1) {
        this.level = level;
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = Array.from({length: 13}, (_, i) => i + 1);

        // Add standard cards
        for (const suit of suits) {
            for (const value of values) {
                this.cards.push(new Card(suit, value));
            }
        }

        // Add base Jokers (2 for level 1)
        this.cards.push(new Card('joker', 0));
        this.cards.push(new Card('joker', 0));

        // Add additional Jokers based on level (2 more per level beyond level 1)
        for (let i = 1; i < this.level; i++) {
            this.cards.push(new Card('joker', 0));
            this.cards.push(new Card('joker', 0));
        }

        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) {
            this.reset();
        }
        return this.cards.pop();
    }

    addCard(card) {
        this.cards.push(card);
        this.shuffle();
    }

    setLevel(level) {
        this.level = level;
        this.reset();
    }
} 