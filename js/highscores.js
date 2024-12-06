class HighScores {
    constructor() {
        this.scores = this.loadScores();
        this.maxScores = 5;
    }

    loadScores() {
        const savedScores = localStorage.getItem('cardtrisHighScores');
        return savedScores ? JSON.parse(savedScores) : [];
    }

    saveScores() {
        localStorage.setItem('cardtrisHighScores', JSON.stringify(this.scores));
    }

    addScore(initials, score) {
        const date = new Date().toLocaleDateString();
        this.scores.push({ initials, score, date });
        this.scores.sort((a, b) => b.score - a.score);
        if (this.scores.length > this.maxScores) {
            this.scores = this.scores.slice(0, this.maxScores);
        }
        this.saveScores();
        return this.isHighScore(score);
    }

    isHighScore(score) {
        return this.scores.length < this.maxScores || score > this.scores[this.scores.length - 1].score;
    }

    displayScores() {
        const scoreList = document.querySelector('.score-list');
        scoreList.innerHTML = this.scores.length === 0 ? 
            '<div class="score-item">No high scores yet!</div>' :
            this.scores.map(score => `
                <div class="score-item">
                    <span>${score.initials}</span>
                    <span>${score.score}</span>
                    <span>${score.date}</span>
                </div>
            `).join('');
    }
}

// Create global instance
const highScores = new HighScores(); 