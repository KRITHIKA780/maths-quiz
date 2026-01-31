// Game State
const state = {
    currentScore: 0,
    questionsAnswered: 0,
    currentQuestion: null,
    isQuizActive: false,
    badges: [],
};

// Config
const TOTAL_QUESTIONS_PER_ROUND = 10;
const POINTS_PER_QUESTION = 10;
const ANSWER_DELAY_MS = 1500;

// DOM Elements
const screens = {
    dashboard: document.getElementById('dashboard'),
    quiz: document.getElementById('quiz'),
    result: document.getElementById('result')
};

const dom = {
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn'),
    scoreDisplay: document.getElementById('score'),
    questionText: document.getElementById('question'),
    optionsContainer: document.getElementById('options-container'),
    feedbackText: document.getElementById('feedback'),
    timerFill: document.getElementById('timer-fill'),
    finalScore: document.getElementById('final-score-display'),
    perfMsg: document.getElementById('performance-msg'),
    badgesContainer: document.getElementById('badges-container'),
    finalBadges: document.getElementById('final-badges')
};

// --- NAVIGATION ---
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });

    // Small delay to allow fade out
    setTimeout(() => {
        const target = screens[screenName];
        target.classList.remove('hidden');
        // Force reflow
        void target.offsetWidth;
        target.classList.add('active');
    }, 100);
}

// --- MATH LOGIC ---
const generateQuestion = () => {
    const operations = ['+', '-', '×', '÷'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;

    // Difficulty scaling (simple for now)
    const range = state.questionsAnswered < 5 ? 10 : 20;

    switch (op) {
        case '+':
            num1 = Math.floor(Math.random() * range) + 1;
            num2 = Math.floor(Math.random() * range) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * range) + 5;
            num2 = Math.floor(Math.random() * num1); // Ensure positive result
            answer = num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 * num2;
            break;
        case '÷':
            num2 = Math.floor(Math.random() * 9) + 2; // Avoid divide by 1 or 0
            answer = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * answer; // Ensure clean division
            break;
    }

    return {
        text: `${num1} ${op} ${num2} = ?`,
        correct: answer,
        options: generateOptions(answer)
    };
};

const generateOptions = (correctAnswer) => {
    const options = new Set([correctAnswer]);
    while (options.size < 4) {
        // Generate believable wrong answers (close to correct)
        const offset = Math.floor(Math.random() * 5) + 1;
        const sign = Math.random() > 0.5 ? 1 : -1;
        const badOption = correctAnswer + (offset * sign);
        if (badOption >= 0) options.add(badOption);
    }
    return Array.from(options).sort(() => Math.random() - 0.5); // Shuffle
};

// --- GAME LOOP ---
function startGame() {
    state.currentScore = 0;
    state.questionsAnswered = 0;
    state.badges = [];
    state.isQuizActive = true;
    updateUI();
    showScreen('quiz');
    nextQuestion();
}

function nextQuestion() {
    if (state.questionsAnswered >= TOTAL_QUESTIONS_PER_ROUND) {
        endGame();
        return;
    }

    state.currentQuestion = generateQuestion();
    renderQuestion();

    // Reset timer bar animation
    dom.timerFill.style.transition = 'none';
    dom.timerFill.style.width = '100%';
    setTimeout(() => {
        dom.timerFill.style.transition = 'width 10s linear'; // Not effectively used for logic yet
        dom.timerFill.style.width = '0%';
    }, 50);
}

function renderQuestion() {
    dom.questionText.textContent = state.currentQuestion.text;
    dom.optionsContainer.innerHTML = '';
    dom.feedbackText.textContent = '';
    dom.feedbackText.className = 'feedback-text hidden';

    state.currentQuestion.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt, btn);
        dom.optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selected, btnElement) {
    // Disable all buttons
    const buttons = dom.optionsContainer.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);

    const isCorrect = selected === state.currentQuestion.correct;

    if (isCorrect) {
        btnElement.classList.add('correct');
        state.currentScore += POINTS_PER_QUESTION;
        dom.feedbackText.textContent = "Correct! 🎉";
        dom.feedbackText.className = 'feedback-text';
        triggerConfetti(btnElement);
        checkBadges();
    } else {
        btnElement.classList.add('wrong');
        dom.feedbackText.textContent = "Oops! Try next time.";
        dom.feedbackText.className = 'feedback-text';

        // Highlight correct one
        buttons.forEach(b => {
            if (parseInt(b.textContent) === state.currentQuestion.correct) {
                b.classList.add('correct');
            }
        });
    }

    state.questionsAnswered++;
    updateUI();

    setTimeout(() => {
        nextQuestion();
    }, ANSWER_DELAY_MS);
}

function updateUI() {
    dom.scoreDisplay.textContent = state.currentScore;

    // Update Badges
    dom.badgesContainer.innerHTML = state.badges.map(b => `<span class="badge">${b}</span>`).join('');
}

function checkBadges() {
    const milestones = [
        { score: 30, badge: '🥉', name: 'Bronze' },
        { score: 60, badge: '🥈', name: 'Silver' },
        { score: 90, badge: '🥇', name: 'Gold' },
        { score: 100, badge: '🏆', name: 'Perfect' }
    ];

    milestones.forEach(m => {
        if (state.currentScore >= m.score && !state.badges.includes(m.badge)) {
            state.badges.push(m.badge);
            // Could add a toast notification here
        }
    });
}

function endGame() {
    state.isQuizActive = false;
    dom.finalScore.textContent = state.currentScore;

    // Performance Message
    const percentage = (state.currentScore / (TOTAL_QUESTIONS_PER_ROUND * POINTS_PER_QUESTION)) * 100;
    if (percentage === 100) dom.perfMsg.textContent = "Legendary! Perfect Score! 🌟";
    else if (percentage >= 80) dom.perfMsg.textContent = "Excellent Work! 🚀";
    else if (percentage >= 50) dom.perfMsg.textContent = "Good Job! Keep practicing! 👍";
    else dom.perfMsg.textContent = "Don't give up! Try again! 💪";

    dom.finalBadges.innerHTML = state.badges.map(b => `<span class="badge" style="font-size: 3rem">${b}</span>`).join('');

    if (percentage >= 80) fireMassiveConfetti();

    showScreen('result');
}

// --- FX ---
function triggerConfetti(element) {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
        particleCount: 50,
        spread: 70,
        origin: { x, y }
    });
}

function fireMassiveConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// --- EVENT LISTENERS ---
dom.startBtn.addEventListener('click', startGame);
dom.restartBtn.addEventListener('click', startGame);
dom.homeBtn.addEventListener('click', () => showScreen('dashboard'));

// Initial UI Update
updateUI();
