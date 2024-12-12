class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        if (this.suit === 'joker') {
            return `<span class="number">?</span>`;
        }

        const valueMap = {
            1: 'A',
            11: 'J',
            12: 'Q',
            13: 'K'
        };
        const suitMap = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        
        const displayValue = valueMap[this.value] || this.value;
        return `<span class="number">${displayValue}</span><span class="suit">${suitMap[this.suit]}</span>`;
    }

    isRed() {
        return this.suit === 'hearts' || this.suit === 'diamonds';
    }

    isJoker() {
        return this.suit === 'joker';
    }
} 