import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import './App.css';

const CLIENT_ID = '1055049298013-ej1eaico8ofgq5onkmel4640us6r5f4q.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDbdoT_4oTySin22j5wi5yx_IDzs3Vfbnc';
const SHEET_ID = '1f1vCtTVOmLhhzyuO2b0vo9YCCl6DxjciZMqQC3F0iuQ';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

function App() {
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [timer, setTimer] = useState(600); // 10 minutes
    const [userInfo, setUserInfo] = useState({ name: '', department: '', module: '' });
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(null);
    const [existingEmails, setExistingEmails] = useState([]);
    const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(false);

    const departmentOptions = [
        'Sales Call Center (CSR)',
        'L1-Support',
        'Front desk',
        'Inside Valley D2D',
        'Outside Valley D2D',
        'Billing/Digital Support'
    ];

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

    const fetchExistingEmails = async () => {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: 'Responses!E:E' // Assuming emails are in column E
            });
            const data = response.result.values;
            if (data) {
                setExistingEmails(data.flat());
            }
        } catch (error) {
            console.error('Error fetching existing emails:', error);
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
        setAutoSubmitEnabled(false); // Disable auto-submit after submission
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

    const handleResponseChange = (questionId, selectedOption) => {
        setResponses(prevResponses => ({
            ...prevResponses,
            [questionId]: selectedOption,
        }));
    };

    const handleStartQuiz = async () => {
        if (userInfo.name && userInfo.department && userInfo.module) {
            setAutoSubmitEnabled(true);
            setQuizStarted(true);
            fetchQuestions();
        } else {
            alert('Please fill in all the fields');
        }
    };

    useEffect(() => {
        function start() {
            gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                scope: SCOPES,
            }).then(() => {
                fetchExistingEmails(); // Fetch existing emails on load
            }).catch(error => console.error('GAPI initialization error:', error));
        }
        gapi.load('client', start);
    }, []);

    useEffect(() => {
        if (quizStarted) {
            const timerId = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 0) {
                        clearInterval(timerId);
                        if (!quizCompleted) {
                            submitQuiz();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timerId);
        }
    }, [quizStarted]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (autoSubmitEnabled && document.visibilityState === 'hidden' && !quizCompleted) {
                submitQuiz();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [autoSubmitEnabled, quizCompleted]);

    const handleReset = () => {
        setUserInfo({ name: '', department: '', module: '' });
        setResponses({});
        setTimer(600);
        setQuizStarted(false);
        setQuizCompleted(false);
        setScore(null);
        setAutoSubmitEnabled(false);
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    const handleKeydown = (event) => {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'v') {
                event.preventDefault();
                alert('Copy-pasting is disabled');
            }
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        alert('Copy-pasting is disabled');
    };

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
            </div>
        );
    }

    if (quizCompleted) {
        return (
            <div className="quiz-completed">
                <h1>Quiz Completed!</h1>
                <p>Your score is: {score}/{questions.length}</p>
                <button onClick={handleReset}>Restart</button>
            </div>
        );
    }

    return (
        <div className="quiz-app">
            <div className="timer">Time Left: {Math.floor(timer / 60)}:{timer % 60}</div>
            <div className="questions-container">
                {questions.map(question => (
                    <div key={question.id} className="question">
                        <p>{question.text}</p>
                        {question.options.map(option => (
                            <label key={option}>
                                <input
                                    type="radio"
                                    name={question.id}
                                    value={option}
                                    checked={responses[question.id] === option}
                                    onChange={() => handleResponseChange(question.id, option)}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                ))}
            </div>
            <button className="submit-button" onClick={submitQuiz}>Submit</button>
        </div>
    );
}

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
