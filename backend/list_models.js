import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_URL.split("key=")[1];
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

axios.get(url).then(res => {
  const models = res.data.models.map(m => m.name);
  console.log("Available models:", models.join(", "));
}).catch(err => {
  console.error("Error fetching models:", err.response ? err.response.data : err.message);
});
