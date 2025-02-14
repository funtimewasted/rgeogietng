// app.js

import { subjectStructure } from './subjects.js';
import { englishQuestions } from './questions/english.js';
import { arabicQuestions } from './questions/arabic.js';
import { historyQuestions } from './questions/history.js';
import { islamicQuestions } from './questions/islamic.js';

// Question bank mapping
const questionBank = {
    english: englishQuestions,
    arabic: arabicQuestions,
    history: historyQuestions,
    islamic: islamicQuestions
};

class QuestionBankApp {
    constructor() {
        // DOM Elements
        this.subjectSelect = document.getElementById('subjectSelect');
        this.semesterSelect = document.getElementById('semesterSelect');
        this.unitSelect = document.getElementById('unitSelect');
        this.lessonSelect = document.getElementById('lessonSelect');
        this.questionArea = document.getElementById('questionArea');
        this.questionContent = document.getElementById('questionContent');
        this.resultsArea = document.getElementById('resultsArea');
        
        // State
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.startTime = null;
        
        // Initialize the app
        this.initializeDropdowns();
        this.initializeEventListeners();
        this.loadProgress();
    }

    initializeDropdowns() {
        // Reset all dropdowns
        this.resetAllDropdowns();
        
        // Populate subject dropdown
        this.populateSubjectSelect();
    }

    populateSubjectSelect() {
        this.subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        Object.keys(subjectStructure).forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
            this.subjectSelect.appendChild(option);
        });
    }

    resetAllDropdowns() {
        // Disable all dropdowns except subject
        this.semesterSelect.disabled = true;
        this.unitSelect.disabled = true;
        this.lessonSelect.disabled = true;

        // Clear all dropdowns except subject
        this.resetSelects(['semester', 'unit', 'lesson']);
    }

    initializeEventListeners() {
        // Dropdown event listeners
        this.subjectSelect.addEventListener('change', () => {
            this.handleSubjectChange();
            this.saveProgress();
        });
        
        this.semesterSelect.addEventListener('change', () => {
            this.handleSemesterChange();
            this.saveProgress();
        });
        
        this.unitSelect.addEventListener('change', () => {
            this.handleUnitChange();
            this.saveProgress();
        });
        
        this.lessonSelect.addEventListener('change', () => {
            this.handleLessonChange();
            this.saveProgress();
        });

        // Question navigation buttons
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        const restartBtn = document.getElementById('restartBtn');

        if (submitBtn) submitBtn.addEventListener('click', () => this.submitAnswer());
        if (nextBtn) nextBtn.addEventListener('click', () => this.showNextQuestion());
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartQuiz());

        // Save progress button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn secondary';
        saveBtn.textContent = 'Save Progress';
        saveBtn.addEventListener('click', () => this.saveProgress());
        
        const buttonGroup = document.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.appendChild(saveBtn);
        }

        // Auto-save
        window.addEventListener('beforeunload', () => this.saveProgress());

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    }

    handleSubjectChange() {
        const subject = this.subjectSelect.value;
        
        // Reset dependent dropdowns
        this.resetSelects(['semester', 'unit', 'lesson']);
        
        if (!subject) return;

        // Enable and populate semester dropdown
        this.semesterSelect.disabled = false;
        this.populateSemesterSelect(subject);
    }

    handleSemesterChange() {
        const subject = this.subjectSelect.value;
        const semester = this.semesterSelect.value;
        
        // Reset dependent dropdowns
        this.resetSelects(['unit', 'lesson']);
        
        if (!semester) return;

        // Enable and populate unit dropdown
        this.unitSelect.disabled = false;
        this.populateUnitSelect(subject, semester);
    }

    handleUnitChange() {
        const subject = this.subjectSelect.value;
        const semester = this.semesterSelect.value;
        const unit = this.unitSelect.value;
        
        // Reset lesson dropdown
        this.resetSelects(['lesson']);
        
        if (!unit) return;

        // Enable and populate lesson dropdown
        this.lessonSelect.disabled = false;
        this.populateLessonSelect(subject, semester, unit);
    }

    handleLessonChange() {
        const subject = this.subjectSelect.value;
        const semester = this.semesterSelect.value;
        const unit = this.unitSelect.value;
        const lesson = this.lessonSelect.value;

        if (!lesson) {
            this.hideQuestions();
            return;
        }

        this.loadQuestions(subject, semester, unit, lesson);
    }

    populateSemesterSelect(subject) {
        const semesters = subjectStructure[subject]?.semesters;
        if (!semesters) return;
        
        this.semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        Object.entries(semesters).forEach(([key, semester]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = semester.name;
            this.semesterSelect.appendChild(option);
        });
    }

    populateUnitSelect(subject, semester) {
        const units = subjectStructure[subject]?.semesters[semester]?.units;
        if (!units) return;
        
        this.unitSelect.innerHTML = '<option value="">Select Unit</option>';
        Object.entries(units).forEach(([key, unit]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = unit.name;
            this.unitSelect.appendChild(option);
        });
    }

    populateLessonSelect(subject, semester, unit) {
        const lessons = subjectStructure[subject]?.semesters[semester]?.units[unit]?.lessons;
        if (!lessons) return;
        
        this.lessonSelect.innerHTML = '<option value="">Select Lesson</option>';
        lessons.forEach(lesson => {
            const option = document.createElement('option');
            option.value = lesson;
            option.textContent = lesson;
            this.lessonSelect.appendChild(option);
        });
    }

    loadQuestions(subject, semester, unit, lesson) {
        try {
            if (!questionBank[subject]?.[semester]?.[unit]?.[lesson]?.questions) {
                throw new Error('Questions not found for this selection');
            }
            
            // Create a copy and shuffle questions
            this.currentQuestions = [...questionBank[subject][semester][unit][lesson].questions];
            this.shuffleArray(this.currentQuestions);
            
            // Check for saved progress
            const savedProgress = this.loadProgress();
            if (savedProgress && 
                savedProgress.subject === subject && 
                savedProgress.semester === semester && 
                savedProgress.unit === unit && 
                savedProgress.lesson === lesson) {
                
                this.currentQuestionIndex = savedProgress.questionIndex;
                this.score = savedProgress.score;
                this.startTime = new Date(savedProgress.startTime);
                this.currentQuestions = savedProgress.questions;
            } else {
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.startTime = new Date();
            }
            
            this.showQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showErrorMessage(error.message || 'Error loading questions. Please try another selection.');
        }
    }

    showQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        this.questionArea.classList.remove('hidden');
        this.resultsArea.classList.add('hidden');

        document.getElementById('lessonTitle').textContent = 
            this.lessonSelect.options[this.lessonSelect.selectedIndex].text;
        document.getElementById('questionCounter').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.currentQuestions.length}`;

        this.questionContent.innerHTML = this.createQuestionHTML(question);

        // Reattach event listeners
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitAnswer());
        if (nextBtn) nextBtn.addEventListener('click', () => this.showNextQuestion());
    }

    createQuestionHTML(question) {
        let html = `
            <div class="question-card">
                <p class="question-text">${question.question}</p>
                <div class="answer-options">
        `;

        switch (question.type) {
            case 'multiple':
                html += question.options.map((option, index) => `
                    <label class="answer-option">
                        <input type="radio" name="answer" value="${index}">
                        ${option}
                    </label>
                `).join('');
                break;

            case 'true-false':
                html += `
                    <label class="answer-option">
                        <input type="radio" name="answer" value="true"> True
                    </label>
                    <label class="answer-option">
                        <input type="radio" name="answer" value="false"> False
                    </label>
                `;
                break;

            case 'short':
                html += `
                    <textarea class="short-answer" rows="4" placeholder="Type your answer here..."></textarea>
                `;
                break;
        }

        html += `
                </div>
                <div id="feedback" class="feedback hidden"></div>
                <div class="button-group">
                    <button id="submitBtn" class="btn primary">Submit Answer</button>
                    <button id="nextBtn" class="btn secondary hidden">Next Question</button>
                </div>
            </div>
        `;

        return html;
    }

    submitAnswer() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const feedback = document.getElementById('feedback');
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        let isCorrect = false;

        switch (question.type) {
            case 'multiple':
            case 'true-false':
                const selectedAnswer = document.querySelector('input[name="answer"]:checked');
                if (!selectedAnswer) {
                    feedback.textContent = 'Please select an answer.';
                    feedback.className = 'feedback incorrect';
                    feedback.classList.remove('hidden');
                    return;
                }
                isCorrect = this.checkAnswer(selectedAnswer.value, question);
                break;

            case 'short':
                const answer = document.querySelector('.short-answer').value.trim();
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
                break;
        }

        feedback.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');

        if (question.type !== 'short') {
            feedback.innerHTML = `
                <p>${isCorrect ? 'Correct!' : 'Incorrect.'}</p>
                <p>${question.explanation}</p>
            `;
            feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            if (isCorrect) this.score++;
        }

        this.saveProgress();
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
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.currentQuestions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        const endTime = new Date();
        const timeSpent = Math.floor((endTime - this.startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;

        this.questionArea.classList.add('hidden');
        this.resultsArea.classList.remove('hidden');
        
        document.getElementById('finalScore').textContent = 
            `${Math.round((this.score / this.currentQuestions.length) * 100)}%`;
        document.getElementById('correctAnswers').textContent = this.score;
        document.getElementById('incorrectAnswers').textContent = 
            this.currentQuestions.length - this.score;
        document.getElementById('timeSpent').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    handleFilterClick(e) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const filterType = e.target.dataset.type;
        this.filterQuestions(filterType);
    }

    filterQuestions(type) {
        if (type === 'all') {
            this.showQuestion();
            return;
        }

        const filteredQuestions = this.currentQuestions.filter(q => q.type === type);
        if (filteredQuestions.length > 0) {
            this.currentQuestions = filteredQuestions;
            this.currentQuestionIndex = 0;
            this.showQuestion();
        } else {
            this.showErrorMessage(`No ${type} questions available`);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    saveProgress() {
        const progress = {
            subject: this.subjectSelect.value,
            semester: this.semesterSelect.value,
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
