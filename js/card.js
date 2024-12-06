class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
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
        return `${displayValue}${suitMap[this.suit]}`;
    }

    isRed() {
        return this.suit === 'hearts' || this.suit === 'diamonds';
    }
} 