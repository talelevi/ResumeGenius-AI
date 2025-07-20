const fetch = require('node-fetch');

exports.handler = async (event) => {
    // 1. ודא שהבקשה היא מסוג POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. קבל את ה-API key מהמשתנים הסביבתיים המאובטחים של Netlify
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: 'API key not configured.' };
    }

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

    try {
        // 3. קח את גוף הבקשה שנשלח מהלקוח
        const requestBody = JSON.parse(event.body);

        // 4. שלח את הבקשה ל-API האמיתי של Gemini
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody) // העבר את גוף הבקשה כמו שהוא
        });

        if (!response.ok) {
            const errorBody = await response.text();
            return { statusCode: response.status, body: errorBody };
        }

        const data = await response.json();

        // 5. החזר את התשובה מה-API של Gemini בחזרה לקוד הלקוח
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};