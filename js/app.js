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
        
        // Load saved progress if it exists
        this.loadProgress();
        
        // Initialize
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Previous event listeners...
        this.subjectSelect.addEventListener('change', () => this.handleSubjectChange());
        this.semesterSelect.addEventListener('change', () => this.handleSemesterChange());
        this.unitSelect.addEventListener('change', () => this.handleUnitChange());
        this.lessonSelect.addEventListener('change', () => this.handleLessonChange());
        
        // Add save progress button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn secondary';
        saveBtn.textContent = 'Save Progress';
        saveBtn.addEventListener('click', () => this.saveProgress());
        
        // Add it to the button group
        const buttonGroup = document.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.appendChild(saveBtn);
        }

        // Add window unload event to auto-save
        window.addEventListener('beforeunload', () => this.saveProgress());
        
        // Other existing event listeners...
    }

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    loadQuestions(subject, semester, unit, lesson) {
        try {
            if (!questionBank[subject]?.[semester]?.[unit]?.[lesson]?.questions) {
                throw new Error('Questions not found for this selection');
            }
            
            // Create a copy of the questions array and shuffle it
            this.currentQuestions = [...questionBank[subject][semester][unit][lesson].questions];
            this.shuffleArray(this.currentQuestions);
            
            // Try to load saved progress for this lesson
            const savedProgress = this.loadProgress();
            if (savedProgress && 
                savedProgress.subject === subject && 
                savedProgress.semester === semester && 
                savedProgress.unit === unit && 
                savedProgress.lesson === lesson) {
                
                this.currentQuestionIndex = savedProgress.questionIndex;
                this.score = savedProgress.score;
                this.startTime = new Date(savedProgress.startTime);
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

    saveProgress() {
        const progress = {
            subject: this.subjectSelect.value,
            semester: this.semesterSelect.value,
            unit: this.unitSelect.value,
            lesson: this.lessonSelect.value,
            questionIndex: this.currentQuestionIndex,
            score: this.score,
            startTime: this.startTime.toISOString(),
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
        
        // Restore selection dropdowns if there's saved progress
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
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new QuestionBankApp();
});
