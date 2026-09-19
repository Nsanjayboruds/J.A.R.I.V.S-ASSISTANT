import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiUrl = process.env.GEMINI_API_URL;
const prompt = "Hello, are you there?";

axios.post(apiUrl, {
  contents: [{
    role: "user",
    parts: [{ text: prompt }]
  }]
}).then(res => {
  console.log("Success:", JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error("Error:", err.response ? err.response.data : err.message);
});
