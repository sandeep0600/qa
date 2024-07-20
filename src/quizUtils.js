export const fetchQuestions = async (setQuestions) => {
    const apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const sheetId = '1f1vCtTVOmLhhzyuO2b0vo9YCCl6DxjciZMqQC3F0iuQ';
    const range = 'Questions!A:E'; // Adjust range according to your sheet

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`
        );
        const data = await response.json();

        if (data.values) {
            const formattedQuestions = data.values.map((row, index) => ({
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

export const submitQuizResponses = async (user, responses) => {
    const apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    const sheetId = 'your_google_sheet_id';
    const range = 'Responses!A1:D1';
    const timestamp = new Date().toISOString();
    const responseArray = [timestamp, user.name, user.department, user.module, ...Object.values(responses)];

    try {
        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${apiKey}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    range: range,
                    values: [responseArray],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error('Error submitting quiz:', error);
    }
};
