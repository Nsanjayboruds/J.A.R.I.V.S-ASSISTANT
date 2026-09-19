import screenshot from "screenshot-desktop";
import axios from "axios";

export const analyzeScreen = async (req, res) => {
    try {
        console.log("Taking screenshot...");
        const imgBuffer = await screenshot({ format: "jpeg" });
        const base64Image = imgBuffer.toString("base64");

        console.log("Screenshot taken. Sending to Groq Vision...");

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'You are Jarvis, an AI assistant analyzing the user\'s computer screen. Briefly and concisely describe what is currently visible on the screen. Do not be overly verbose, just get to the point.' },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }
                ],
                max_tokens: 200
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        console.log("Groq Vision Response:", aiResponse);

        res.json({ success: true, description: aiResponse });

    } catch (error) {
        console.error("Vision Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Error analyzing screen", error: error.message });
    }
};
