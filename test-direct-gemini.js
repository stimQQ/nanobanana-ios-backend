const axios = require('axios');

async function testGeminiDirect() {
    const apiKey = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
    const model = 'gemini-2.5-flash-image-preview';

    console.log('Testing direct Gemini API call...\n');
    console.log('Model:', model);
    console.log('API Key:', apiKey.substring(0, 10) + '...');

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: "Generate an image of a cute cat wearing a wizard hat"
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('\n✅ API call successful!');
        console.log('Response status:', response.status);

        if (response.data.candidates && response.data.candidates[0]) {
            const parts = response.data.candidates[0].content.parts;
            console.log(`Response has ${parts.length} parts:`);

            parts.forEach((part, index) => {
                if (part.text) {
                    console.log(`  Part ${index}: Text response`);
                } else if (part.inlineData) {
                    console.log(`  Part ${index}: ✅ IMAGE GENERATED! (${part.inlineData.mimeType})`);
                }
            });
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGeminiDirect();