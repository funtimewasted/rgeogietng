// subjects.js
export const subjectStructure = {
    english: {
        semesters: {
            semester1: {
                name: "Semester 1",
                units: {
                    unit1: {
                        name: "Unit 1",
                        lessons: ["Introduction", "Basic Grammar", "Reading Comprehension"]
                    },
                    unit2: {
                        name: "Unit 2",
                        lessons: ["Advanced Grammar", "Writing Skills", "Literature"]
                    }
                }
            },
            semester2: {
                name: "Semester 2",
                units: {
                    unit1: {
                        name: "Unit 1",
                        lessons: ["Poetry", "Essay Writing", "Critical Analysis"]
                    },
                    unit2: {
                        name: "Unit 2",
                        lessons: ["Research Writing", "Public Speaking", "Final Review"]
                    }
                }
            }
        }
    },
    // Add other subjects following the same structure
};

// questions/english.js
export const englishQuestions = {
    semester1: {
        unit1: {
            "Introduction": {
                questions: [
                    {
                        question: "What is the main purpose of English grammar?",
                        type: "multiple",
                        options: [
                            "To make communication clearer",
                            "To make writing difficult",
                            "To confuse readers",
                            "To create new words"
                        ],
                        correctAnswer: 0,
                        explanation: "Grammar helps make communication clearer and more effective."
                    },
                    // Add more questions following the same structure
                ]
            },
            // Add other lessons following the same structure
        }
    }
};

// app.js
class QuestionBankApp {
    constructor() {
        this.initializeState();
        this.initializeElements();
        this.initializeEventListeners();
        this.loadProgress();
    }

    initializeState() {
        this.state = {
            currentQuestions: [],
            currentQuestionIndex: 0,
            score: 0,
            startTime: null,
            questionBank: {
                english: englishQuestions,
                // Add other subjects
            }
        };
    }

    initializeElements() {
        const requiredElements = {
            subjectSelect: 'Subject',
            semesterSelect: 'Semester',
            unitSelect: 'Unit',
            lessonSelect: 'Lesson',
            questionArea: 'Question Area',
            questionContent: 'Question Content',
            resultsArea: 'Results Area'
        };

        this.elements = {};

        for (const [key, label] of Object.entries(requiredElements)) {
            const element = document.getElementById(key);
            if (!element) {
                throw new Error(`Required element #${key} (${label}) not found`);
            }
            this.elements[key] = element;
        }

        // Initialize select elements
        this.initializeDropdowns();
    }

    initializeDropdowns() {
        // Reset and disable all dropdowns except subject
        this.resetDropdowns();
        
        // Populate subject dropdown
        this.populateSelect(
            this.elements.subjectSelect,
            Object.keys(subjectStructure),
            'Select Subject'
        );
    }

    resetDropdowns() {
        const selects = ['semester', 'unit', 'lesson'];
        selects.forEach(select => {
            const element = this.elements[`${select}Select`];
            element.innerHTML = `<option value="">Select ${select.charAt(0).toUpperCase() + select.slice(1)}</option>`;
            element.disabled = true;
        });
        this.hideQuestions();
    }

    populateSelect(selectElement, items, defaultText, nameProperty = null) {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        items.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = nameProperty ? item[nameProperty] : item;
            option.textContent = nameProperty ? item[nameProperty] : 
                               (typeof item === 'string' ? item.charAt(0).toUpperCase() + item.slice(1) : item);
            selectElement.appendChild(option);
        });
    }

    initializeEventListeners() {
        // Dropdown change events
        this.elements.subjectSelect.addEventListener('change', () => this.handleSubjectChange());
        this.elements.semesterSelect.addEventListener('change', () => this.handleSemesterChange());
        this.elements.unitSelect.addEventListener('change', () => this.handleUnitChange());
        this.elements.lessonSelect.addEventListener('change', () => this.handleLessonChange());

        // Button events
        this.initializeButtonListeners();

        // Auto-save
        window.addEventListener('beforeunload', () => this.saveProgress());
    }

    initializeButtonListeners() {
        const buttons = {
            submitBtn: () => this.submitAnswer(),
            nextBtn: () => this.showNextQuestion(),
            restartBtn: () => this.restartQuiz(),
            saveBtn: () => this.saveProgress()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) {
                // Remove old listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                newButton.addEventListener('click', handler.bind(this));
            }
        });
    }

    handleSubjectChange() {
        const subject = this.elements.subjectSelect.value;
        this.resetDropdowns();
        
        if (!subject) return;

        const semesters = Object.keys(subjectStructure[subject].semesters);
        this.elements.semesterSelect.disabled = false;
        this.populateSelect(
            this.elements.semesterSelect,
            semesters,
            'Select Semester'
        );
        
        this.saveProgress();
    }

    handleSemesterChange() {
        const subject = this.elements.subjectSelect.value;
        const semester = this.elements.semesterSelect.value;
        
        this.resetDropdowns();
        
        if (!semester) return;

        const units = Object.keys(subjectStructure[subject].semesters[semester].units);
        this.elements.unitSelect.disabled = false;
        this.populateSelect(
            this.elements.unitSelect,
            units,
            'Select Unit'
        );
        
        this.saveProgress();
    }

    handleUnitChange() {
        const subject = this.elements.subjectSelect.value;
        const semester = this.elements.semesterSelect.value;
        const unit = this.elements.unitSelect.value;
        
        if (!unit) {
            this.elements.lessonSelect.innerHTML = '<option value="">Select Lesson</option>';
            this.elements.lessonSelect.disabled = true;
            return;
        }

        const lessons = subjectStructure[subject].semesters[semester].units[unit].lessons;
        this.elements.lessonSelect.disabled = false;
        this.populateSelect(
            this.elements.lessonSelect,
            lessons,
            'Select Lesson'
        );
        
        this.saveProgress();
    }

    handleLessonChange() {
        const selection = {
            subject: this.elements.subjectSelect.value,
            semester: this.elements.semesterSelect.value,
            unit: this.elements.unitSelect.value,
            lesson: this.elements.lessonSelect.value
        };

        if (!selection.lesson) {
            this.hideQuestions();
            return;
        }

        this.loadQuestions(selection);
        this.saveProgress();
    }

    loadQuestions(selection) {
        try {
            const questions = this.state.questionBank[selection.subject]?.[selection.semester]?.[selection.unit]?.[selection.lesson]?.questions;
            
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                throw new Error('No questions available for this selection');
            }

            this.state.currentQuestions = this.shuffleArray([...questions]);
            this.state.currentQuestionIndex = 0;
            this.state.score = 0;
            this.state.startTime = new Date();

            this.showQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load questions. Please try another selection.');
        }
    }

    showQuestion() {
        const question = this.state.currentQuestions[this.state.currentQuestionIndex];
        if (!question) {
            this.showError('Question not found');
            return;
        }

        this.elements.questionArea.classList.remove('hidden');
        this.elements.resultsArea.classList.add('hidden');

        const questionHTML = this.createQuestionHTML(question);
        this.elements.questionContent.innerHTML = questionHTML;

        this.initializeButtonListeners();
    }

    createQuestionHTML(question) {
        return `
            <div class="question-card">
                <p class="question-text">${question.question}</p>
                <div class="answer-options">
                    ${this.createAnswerOptionsHTML(question)}
                </div>
                <div id="feedback" class="feedback hidden"></div>
                <div class="button-group">
                    <button id="submitBtn" class="btn primary">Submit Answer</button>
                    <button id="nextBtn" class="btn secondary hidden">Next Question</button>
                </div>
            </div>
        `;
    }

    createAnswerOptionsHTML(question) {
        switch (question.type) {
            case 'multiple':
                return question.options.map((option, index) => `
                    <label class="answer-option">
                        <input type="radio" name="answer" value="${index}">
                        ${option}
                    </label>
                `).join('');

            case 'true-false':
                return `
                    <label class="answer-option">
                        <input type="radio" name="answer" value="true"> True
                    </label>
                    <label class="answer-option">
                        <input type="radio" name="answer" value="false"> False
                    </label>
                `;

            case 'short':
                return `
                    <textarea class="short-answer" rows="4" placeholder="Type your answer here..."></textarea>
                `;

            default:
                return '<p class="error">Invalid question type</p>';
        }
    }

    submitAnswer() {
        const question = this.state.currentQuestions[this.state.currentQuestionIndex];
        const feedback = document.getElementById('feedback');
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (!feedback || !submitBtn || !nextBtn) {
            this.showError('Required elements not found');
            return;
        }

        let isCorrect = false;
        try {
            switch (question.type) {
                case 'multiple':
                case 'true-false':
                    isCorrect = this.handleStructuredAnswer(question, feedback);
                    break;

                case 'short':
                    this.handleShortAnswer(question, feedback);
                    break;

                default:
                    throw new Error('Invalid question type');
            }

            submitBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
            
            if (isCorrect) this.state.score++;
            
            this.saveProgress();
        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showError('Failed to submit answer. Please try again.');
        }
    }

    handleStructuredAnswer(question, feedback) {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (!selectedAnswer) {
            feedback.textContent = 'Please select an answer.';
            feedback.className = 'feedback incorrect';
            feedback.classList.remove('hidden');
            return false;
        }

        const isCorrect = this.checkAnswer(selectedAnswer.value, question);
        feedback.innerHTML = `
            <p>${isCorrect ? 'Correct!' : 'Incorrect.'}</p>
            <p>${question.explanation}</p>
        `;
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.classList.remove('hidden');
        return isCorrect;
    }

    handleShortAnswer(question, feedback) {
        const answer = document.querySelector('.short-answer')?.value.trim();
        if (!answer) {
            feedback.textContent = 'Please enter an answer.';
            feedback.className = 'feedback incorrect';
            feedback.classList.remove('hidden');
            return;
        }

        feedback.innerHTML = `
            <h4>Sample Answer:</h4>
            <p>${question.sampleAnswer}</p>
            <p class="mt-2">Compare your answer with the sample answer above.</p>
        `;
        feedback.className = 'feedback';
        feedback.classList.remove('hidden');
    }

    checkAnswer(answer, question) {
        switch (question.type) {
            case 'multiple':
                return parseInt(answer) === question.correctAnswer;
            case 'true-false':
                return answer === question.correctAnswer.toString();
            default:
                return false;
        }
    }

    showNextQuestion() {
        this.state.currentQuestionIndex++;
        if (this.state.currentQuestionIndex < this.state.currentQuestions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        const endTime = new Date();
        const timeSpent = Math.floor((endTime - this.state.startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;

        this.elements.questionArea.classList.add('hidden');
        this.elements.resultsArea.classList.remove('hidden');

        const resultsHTML = `
            <div class="results-card">
                <h2>Quiz Results</h2>
                <p>Score: <span id="finalScore">${Math.round((this.state.score / this.state.currentQuestions.length) * 100)}%</span></p>
                <p>Correct Answers: <span id="correctAnswers">${this.state.score}</span></p>
                <p>Incorrect Answers: <span id="incorrectAnswers">${this.state.currentQuestions.length - this.state.score}</span></p>
                <p>Time Spent: <span id="timeSpent">${minutes}:${seconds.toString().padStart(2, '0')}</span></p>
                <button id="restartBtn" class="btn primary">Restart Quiz</button>
            </div>
        `;

        this.elements.resultsArea.innerHTML = resultsHTML;
        this.initializeButtonListeners();
    }

    restartQuiz() {
        try {
            localStorage.removeItem('questionBankProgress');
            this.state.currentQuestionIndex = 0;
            this.state.score = 0;
            this.state.startTime = new Date();
            this.shuffleArray(this.state.currentQuestions);
            this.elements.resultsArea.classList.add('hidden');
            this.showQuestion();
        } catch (error) {
            console.error('Error restarting quiz:', error);
            this.showError('Failed to restart quiz. Please refresh the page.');
        }
    }

    saveProgress() {
        try {
            const progress = {
                subject: this.elements.subjectSelect.value,
                semester: this.elements.semesterSelect.value,
            unit: this.unitSelect.value,
            lesson: this.lessonSelect.value,
            questionIndex: this.currentQuestionIndex,
            score: this.score,
            startTime: this.startTime?.toISOString(),
            questions: this.currentQuestions // Save shuffled questions order
        };
        
        localStorage.setItem('questionBankProgress', JSON.stringify(progress));
        
        // Show save confirmation
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = 'Progress saved!';
            feedback.className = 'feedback correct';
            feedback.classList.remove('hidden');
            setTimeout(() => {
                feedback.classList.add('hidden');
            }, 2000);
        }
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('questionBankProgress');
        if (!savedProgress) return null;
        
        const progress = JSON.parse(savedProgress);
        
        // Restore selection dropdowns if there's save
        if (progress) {
            this.subjectSelect.value = progress.subject;
            this.handleSubjectChange();
            
            this.semesterSelect.value = progress.semester;
            this.handleSemesterChange();
            
            this.unitSelect.value = progress.unit;
            this.handleUnitChange();
            
            this.lessonSelect.value = progress.lesson;
        }
        
        return progress;
    }

    restartQuiz() {
        // Clear saved progress
        localStorage.removeItem('questionBankProgress');
        
        // Reshuffle questions
        this.shuffleArray(this.currentQuestions);
        
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.startTime = new Date();
        document.getElementById('resultsArea').classList.add('hidden');
        this.showQuestion();
    }

    resetSelects(selects) {
        selects.forEach(select => {
            const element = document.getElementById(`${select}Select`);
            element.innerHTML = `<option value="">Select ${select.charAt(0).toUpperCase() + select.slice(1)}</option>`;
            element.disabled = true;
        });
        this.hideQuestions();
    }

    hideQuestions() {
        this.questionArea.classList.add('hidden');
        this.resultsArea.classList.add('hidden');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new QuestionBankApp();
});
