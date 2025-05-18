class GuessMaster {
    constructor() {
        this.difficulties = {
            easy: { range: 100, attempts: 5, points: 100 },
            medium: { range: 500, attempts: 8, points: 200 },
            hard: { range: 1000, attempts: 10, points: 300 }
        };
        
        this.currentDifficulty = 'easy';
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gamesWon = parseInt(localStorage.getItem('gamesWon')) || 0;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        
        // Initialize sound effects
        this.sounds = {
            victory: new Audio('assets/victory.mp3'),
            guess: new Audio('assets/guess.mp3'),
            error: new Audio('assets/error.mp3'),
            gameOver: new Audio('assets/game-over.mp3'),
            click: new Audio('assets/click.mp3'),
            achievement: new Audio('assets/achievement.mp3')
        };
        
        // Set volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.6;
        });
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeGame();
        this.createParticles();
        this.updateTheme();
    }

    initializeElements() {       
        this.guessInput = document.getElementById('guess-input');
        this.guessBtn = document.getElementById('guess-btn');
        this.incrementBtn = document.getElementById('increment');
        this.decrementBtn = document.getElementById('decrement');
        this.message = document.getElementById('message');
        this.progressFill = document.getElementById('progress-fill');
        this.historyList = document.getElementById('history-list');
        this.attemptsDisplay = document.getElementById('attempts');
        this.scoreDisplay = document.getElementById('score');
        this.rangeDisplay = document.getElementById('range');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.gamesWonDisplay = document.getElementById('games-won');
        

        this.winOverlay = document.getElementById('win-overlay');
        this.winningNumber = document.getElementById('winning-number');
        this.finalAttempts = document.getElementById('final-attempts');
        this.finalScore = document.getElementById('final-score');
        this.playAgainBtn = document.getElementById('play-again');
    }

    initializeEventListeners() {
        this.guessBtn.addEventListener('click', () => this.makeGuess());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        this.incrementBtn.addEventListener('click', () => this.adjustNumber(1));
        this.decrementBtn.addEventListener('click', () => this.adjustNumber(-1));
        this.playAgainBtn.addEventListener('click', () => this.resetGame());

        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeDifficulty(btn.dataset.diff));
        });

        // Theme switcher
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme(btn.dataset.mode));
        });
    }

    initializeGame() {
        const diff = this.difficulties[this.currentDifficulty];
        this.secretNumber = Math.floor(Math.random() * diff.range) + 1;
        this.maxAttempts = diff.attempts;
        this.attempts = 0;
        this.score = 0;
        this.gameOver = false;
        this.guessHistory = [];

        // Update UI
        this.updateUI();
        this.updateRange();
        this.bestScoreDisplay.textContent = this.bestScore;
        this.gamesWonDisplay.textContent = this.gamesWon;
    }

    makeGuess() {
        if (this.gameOver) return;

        const guess = parseInt(this.guessInput.value);
        const diff = this.difficulties[this.currentDifficulty];
        this.guessInput.value = '';

        if (isNaN(guess) || guess < 1 || guess > diff.range) {
            this.showMessage(`Please enter a valid number between 1 and ${diff.range}`, 'error');
            this.sounds.error.currentTime = 0;
            this.sounds.error.play().catch(error => console.log('Error playing sound:', error));
            return;
        }

        this.sounds.guess.currentTime = 0;
        this.sounds.guess.play().catch(error => console.log('Error playing sound:', error));

        this.attempts++;
        this.guessHistory.push(guess);
        this.updateUI();

        if (guess === this.secretNumber) {
            this.handleWin();
        } else {
            const hint = this.generateHint(guess);
            this.showMessage(hint, 'hint');

            if (this.attempts >= this.maxAttempts) {
                this.handleLoss();
            }
        }
    }

    generateHint(guess) {
        const difference = Math.abs(this.secretNumber - guess);
        const diff = this.difficulties[this.currentDifficulty];
        
        if (guess < this.secretNumber) {
            if (difference > diff.range / 2) return "Way too low! Aim much higher! 🚀";
            if (difference > diff.range / 4) return "Too low! Go higher! ⬆️";
            if (difference > diff.range / 8) return "Getting closer, but still too low! 📈";
            return "Almost there! Just a bit higher! ��";
        } else {
            if (difference > diff.range / 2) return "Way too high! Aim much lower! 🔻";
            if (difference > diff.range / 4) return "Too high! Go lower! ⬇️";
            if (difference > diff.range / 8) return "Getting closer, but still too high! 📉";
            return "Almost there! Just a bit lower! 🎯";
        }
    }

    calculateScore() {
        const diff = this.difficulties[this.currentDifficulty];
        const basePoints = diff.points;
        const attemptsBonus = (diff.attempts - this.attempts + 1) * 20;
        return basePoints + attemptsBonus;
    }

    handleWin() {
        this.gameOver = true;
        this.score = this.calculateScore();
        
        // Play victory sound
        this.sounds.victory.currentTime = 0;
        this.sounds.victory.play().catch(error => console.log('Error playing sound:', error));
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            // Play achievement sound for new best score
            setTimeout(() => {
                this.sounds.achievement.currentTime = 0;
                this.sounds.achievement.play().catch(error => console.log('Error playing sound:', error));
            }, 1000); // Play after victory sound
        }
        
        this.gamesWon++;
        localStorage.setItem('gamesWon', this.gamesWon);

        // Update win overlay
        this.winningNumber.textContent = this.secretNumber;
        this.finalAttempts.textContent = this.attempts;
        this.finalScore.textContent = this.score;
        this.winOverlay.classList.add('show');
        
        // Update stats
        this.bestScoreDisplay.textContent = this.bestScore;
        this.gamesWonDisplay.textContent = this.gamesWon;
        
        // Celebrate
        this.createWinParticles();
    }

    handleLoss() {
        this.gameOver = true;
        this.sounds.gameOver.currentTime = 0;
        this.sounds.gameOver.play().catch(error => console.log('Error playing sound:', error));
        this.showMessage(`Game Over! The number was ${this.secretNumber}`, 'error');
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = `message show ${type}`;
        
        const hintIcon = document.querySelector('.hint-icon');
        hintIcon.classList.add('pulse');
        setTimeout(() => hintIcon.classList.remove('pulse'), 500);
    }

    updateUI() {
        // Update attempts and score
        this.attemptsDisplay.textContent = this.maxAttempts - this.attempts;
        this.scoreDisplay.textContent = this.score;

        // Update progress bar
        const progress = (this.attempts / this.maxAttempts) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Update history
        this.historyList.innerHTML = '';
        this.guessHistory.forEach(guess => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = guess;
            
            if (guess === this.secretNumber) {
                item.classList.add('correct');
            } else if (guess < this.secretNumber) {
                item.classList.add('low');
            } else {
                item.classList.add('high');
            }
            
            this.historyList.appendChild(item);
        });
    }

    updateRange() {
        const range = this.difficulties[this.currentDifficulty].range;
        this.rangeDisplay.textContent = `1-${range}`;
        this.guessInput.max = range;
    }

    changeDifficulty(difficulty) {
        if (this.gameOver || this.attempts === 0) {
            this.sounds.click.currentTime = 0;
            this.sounds.click.play().catch(error => console.log('Error playing sound:', error));
            document.querySelectorAll('.diff-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.diff === difficulty);
            });
            this.currentDifficulty = difficulty;
            this.resetGame();
        }
    }

    adjustNumber(delta) {
        const currentValue = parseInt(this.guessInput.value) || 0;
        const newValue = currentValue + delta;
        const diff = this.difficulties[this.currentDifficulty];
        
        if (newValue >= 1 && newValue <= diff.range) {
            this.sounds.click.currentTime = 0;
            this.sounds.click.play().catch(error => console.log('Error playing sound:', error));
            this.guessInput.value = newValue;
            this.guessInput.classList.add('pulse');
            setTimeout(() => this.guessInput.classList.remove('pulse'), 200);
        }
    }

    toggleTheme(mode) {
        this.sounds.click.currentTime = 0;
        this.sounds.click.play().catch(error => console.log('Error playing sound:', error));
        
        this.darkMode = mode === 'dark';
        localStorage.setItem('darkMode', this.darkMode);
        
        // Update active state of mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.updateTheme();
    }

    updateTheme() {
        // Set theme using data attribute
        document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        
        // Update specific elements that need theme-specific styles
        const gameCard = document.querySelector('.game-card');
        if (gameCard) {
            gameCard.style.background = this.darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        }
        
        // Update particles color for dark mode
        document.querySelectorAll('.particle').forEach(particle => {
            particle.style.background = `rgba(${this.darkMode ? '255, 255, 255' : '255, 255, 255'}, ${Math.random() * 0.3})`;
        });
    }

    createParticles() {
        const particles = document.querySelector('.particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 5 + 2}px;
                height: ${Math.random() * 5 + 2}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.3});
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 5}s linear infinite;
            `;
            particles.appendChild(particle);
        }
    }

    createWinParticles() {
        const particles = document.createElement('div');
        particles.className = 'win-particles';
        this.winOverlay.appendChild(particles);

        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'win-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${this.getRandomColor()};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: confetti ${Math.random() * 2 + 1}s ease-out forwards;
            `;
            particles.appendChild(particle);
        }

        setTimeout(() => particles.remove(), 3000);
    }

    getRandomColor() {
        const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    resetGame() {
        this.winOverlay.classList.remove('show');
        this.initializeGame();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GuessMaster();
}); 