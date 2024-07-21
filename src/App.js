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
    const [showWarning, setShowWarning] = useState(false);
    const [userInfo, setUserInfo] = useState({ name: '', department: '', module: '' });
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const departmentOptions = [
        'Sales Call Center (CSR)',
        'L1-Support',
        'Front desk',
        'Inside Valley D2D',
        'Outside Valley D2D',
        'Billing/Digital Support'
    ];

    useEffect(() => {
        gapi.load('client:auth2', initClient);
    }, []);

    const initClient = () => {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            scope: SCOPES,
        }).then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
            setIsSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    };

    const fetchQuestions = async () => {
        const sheetName = userInfo.module === 'SKT' ? 'L1Questions' : 'Questions';

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${sheetName}!A:F`
            });
            const data = response.result.values;

            if (data) {
                const formattedQuestions = data.slice(1).map((row, index) => ({
                    id: index,
                    text: row[0],
                    options: row.slice(1, -1),
                    correctAnswer: row[row.length - 1],
                }));
                setQuestions(formattedQuestions);
            } else {
                console.error('No data found in the specified range');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const submitQuiz = async () => {
        const timestamp = new Date().toISOString();
        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        
        const responseArray = [
            timestamp, 
            userInfo.name, 
            userInfo.department, 
            userInfo.module, 
            ...Object.values(responses),
            `${calculatedScore}/${questions.length}` // Add score to responses
        ];

        try {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: 'Responses!A1:AG1', // Adjust the range if needed
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [responseArray],
                },
            });
            console.log('Submit result:', responseArray);
        } catch (error) {
            console.error('Error submitting quiz:', error);
        }

        setQuizCompleted(true);
        setShowWarning(false); // Hide warning after submission
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach(question => {
            if (responses[question.id] === question.correctAnswer) {
                score++;
            }
        });
        return score;
    };

    const handleResponseChange = (questionId, option) => {
        setResponses(prevResponses => ({
            ...prevResponses,
            [questionId]: option,
        }));
    };

    const handleStartQuiz = () => {
        if (userInfo.name && userInfo.department && userInfo.module) {
            fetchQuestions();
            setQuizStarted(true);
            startTimer();
        } else {
            alert('Please fill out all fields.');
        }
    };

    const handleReset = () => {
        setQuizStarted(false);
        setQuizCompleted(false);
        setResponses({});
        setScore(null);
        setCurrentQuestionIndex(0);
    };

    const startTimer = () => {
        const intervalId = setInterval(() => {
            setTimer(prevTimer => {
                if (prevTimer <= 0) {
                    clearInterval(intervalId);
                    submitQuiz();
                    return 0;
                }
                if (prevTimer <= 120) { // 2 minutes warning
                    setShowWarning(true);
                }
                return prevTimer - 1;
            });
        }, 1000);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    };

    const progress = (questions.length > 0) ? (currentQuestionIndex + 1) / questions.length * 100 : 0;

    if (!quizStarted) {
        return (
            <div className="user-info-form">
                <h1>Start Quiz</h1>
                <input
                    type="text"
                    placeholder="Name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    required
                />
                <select
                    value={userInfo.department}
                    onChange={(e) => setUserInfo({ ...userInfo, department: e.target.value })}
                    required
                >
                    <option value="" disabled>Select Department</option>
                    {departmentOptions.map(department => (
                        <option key={department} value={department}>
                            {department}
                        </option>
                    ))}
                </select>
                <select
                    value={userInfo.module}
                    onChange={(e) => setUserInfo({ ...userInfo, module: e.target.value })}
                    required
                >
                    <option value="" disabled>Select Module</option>
                    <option value="SKT">SKT</option>
                    <option value="PKT">PKT</option>
                </select>
                <button onClick={handleStartQuiz}>Start Quiz</button>
                <p>Note: Please complete the quiz within 10 minutes.</p>
            </div>
        );
    }

    if (quizCompleted) {
        return (
            <div className="quiz-completed">
                <h1>Quiz Completed</h1>
                <p>Thank you for completing the quiz.</p>
                <p>Your score is {score} out of {questions.length}.</p>
                <button onClick={handleReset}>Restart Quiz</button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <div className="timer">Time left: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</div>
            {showWarning && <div className="warning">Only 2 minutes left!</div>}
            <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="question">
                <p>{questions[currentQuestionIndex]?.text}</p>
                {questions[currentQuestionIndex]?.options.map((option, index) => (
                    <label key={index}>
                        <input
                            type="radio"
                            name={questions[currentQuestionIndex].id}
                            value={option}
                            checked={responses[questions[currentQuestionIndex].id] === option}
                            onChange={() => handleResponseChange(questions[currentQuestionIndex].id, option)}
                        />
                        {option}
                    </label>
                ))}
            </div>
            <div className="navigation-buttons">
                <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
                <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>Next</button>
                <button onClick={submitQuiz}>Submit Quiz</button>
            </div>
            <div className="feedback">
                {responses[questions[currentQuestionIndex]?.id] === questions[currentQuestionIndex]?.correctAnswer && (
                    <p>Correct Answer!</p>
                )}
                {responses[questions[currentQuestionIndex]?.id] !== undefined && responses[questions[currentQuestionIndex]?.id] !== questions[currentQuestionIndex]?.correctAnswer && (
                    <p>Incorrect Answer. The correct answer was: {questions[currentQuestionIndex]?.correctAnswer}</p>
                )}
            </div>
        </div>
    );
}

export default App;
