import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import './App.css';

const CLIENT_ID = '1055049298013-ej1eaico8ofgq5onkmel4640us6r5f4q.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDbdoT_4oTySin22j5wi5yx_IDzs3Vfbnc';
const SHEET_ID = '1f1vCtTVOmLhhzyuO2b0vo9YCCl6DxjciZMqQC3F0iuQ';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

function App() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [timer, setTimer] = useState(600); // 10 minutes
    const [userInfo, setUserInfo] = useState({ name: '', department: '', module: '' });
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(null);
    const [existingEmails, setExistingEmails] = useState([]);
    const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const departmentOptions = [
        'Sales Call Center (CSR)',
        'L1-Support',
        'Front desk',
        'Inside Valley D2D',
        'Outside Valley D2D',
        'Billing/Digital Support'
    ];

    useEffect(() => {
        if (userInfo.module) {
            fetchQuestions();
        }
    }, [userInfo.module]);

      const fetchQuestions = async () => {
        const sheetName = userInfo.module === 'SKT' ? SHEET_NAME_L1_QUESTIONS : SHEET_NAME_QUESTIONS;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        const questionsData = data.values.slice(1).map((row, index) => ({
            id: index + 1,
            question: row[0],
            options: row.slice(1),
        }));
        setQuestions(questionsData);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo({ ...userInfo, [name]: value });
    };

    const handleAnswerChange = (selectedOption) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedOption;
        setAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmitQuiz();
        }
    };

    const handleSubmitQuiz = async () => {
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000; // Duration in seconds
        const correctAnswers = questions.filter((question, index) => question.options[0] === answers[index]);
        const score = correctAnswers.length;
        setScore(score);

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_RESPONSES}!A1:E1:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [[userInfo.name, userInfo.email, userInfo.department, answers.join(','), `${score}/${questions.length}`]],
                }),
            }
        );

        const analyticsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_ANALYTICS}!A1:D1:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [[userInfo.name, userInfo.email, duration, score]],
                }),
            }
        );

        if (response.ok && analyticsResponse.ok) {
            setIsQuizCompleted(true);
        } else {
            console.error('Error submitting quiz');
        }
    };

    return (
        <div className="quiz-container">
            {!isQuizCompleted ? (
                !userInfo.name ? (
                    <div className="user-info-form">
                        <h1>Enter Your Information</h1>
                        <input type="text" name="name" placeholder="Name" value={userInfo.name} onChange={handleInputChange} />
                        <input type="text" name="email" placeholder="Email" value={userInfo.email} onChange={handleInputChange} />
                        <select name="department" value={userInfo.department} onChange={handleInputChange}>
                            <option value="">Select Department</option>
                            <option value="Sales Call Center (CSR)">Sales Call Center (CSR)</option>
                            <option value="L1-Support">L1-Support</option>
                            <option value="Front desk">Front desk</option>
                            <option value="Inside Valley D2D">Inside Valley D2D</option>
                            <option value="Outside Valley D2D">Outside Valley D2D</option>
                            <option value="Billing/Digital Support">Billing/Digital Support</option>
                        </select>
                        <select name="module" value={userInfo.module} onChange={handleInputChange}>
                            <option value="SKT">SKT</option>
                            <option value="PKT">PKT</option>
                        </select>
                        <button onClick={() => { setUserInfo({ ...userInfo, name: userInfo.name.trim(), email: userInfo.email.trim() }); setStartTime(new Date()); }}>
                            Start Quiz
                        </button>
                    </div>
                ) : (
                    <div className="question-container">
                        <div className="question">
                            <p>{questions[currentQuestionIndex]?.question}</p>
                        </div>
                        <div className="options">
                            {questions[currentQuestionIndex]?.options.map((option, index) => (
                                <div key={index} className="option" onClick={() => handleAnswerChange(option)}>
                                    {option}
                                </div>
                            ))}
                        </div>
                        <button onClick={handleNextQuestion}>
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                        </button>
                    </div>
                )
            ) : (
                <div className="completion-container">
                    <h1>Quiz Completed!</h1>
                    <p>Your score is: {score}/{questions.length}</p>
                    <button onClick={() => window.location.reload()}>Start New Quiz</button>
                </div>
            )}
        </div>
    );
};

export default App;

// Disable right-click
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    alert('Right-click is disabled on this page.');
});

// Block certain keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+I (F12)
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        alert('Developer tools are disabled.');
    }

    // Ctrl+U
    if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        alert('Viewing source is disabled.');
    }

    // F12
    if (event.key === 'F12') {
        event.preventDefault();
        alert('Developer tools are disabled.');
    }
});

