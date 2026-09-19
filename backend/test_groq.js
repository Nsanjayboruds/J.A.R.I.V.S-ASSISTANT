import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const prompt = "What is 2+2? Answer in one word.";

axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  },
  {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  }
).then(res => {
  console.log("Success:", res.data.choices[0].message.content);
}).catch(err => {
  console.error("Error:", err.response ? err.response.data : err.message);
});
