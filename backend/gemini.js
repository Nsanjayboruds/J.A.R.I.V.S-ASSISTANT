import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const sanitizeGeminiResponse = (text) => {
  return text.replace(/```json|```/g, "").trim();
};

const extractJsonObject = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const summarizeGeminiError = (message) => {
  const lowerMessage = (message || "").toLowerCase();

  if (lowerMessage.includes("consumer_suspended") || lowerMessage.includes("suspended")) {
    return "Gemini API key is suspended.";
  }

  if (lowerMessage.includes("quota") || lowerMessage.includes("rate limits")) {
    return "Gemini quota has been exceeded.";
  }

  if (lowerMessage.includes("permission denied") || lowerMessage.includes("forbidden") || lowerMessage.includes("403")) {
    return "Gemini API access was denied.";
  }

  return "Gemini is currently unavailable.";
};

const buildFallbackResponse = (command, assistantName, userName) => {
  const normalizedCommand = command.toLowerCase();

  if (normalizedCommand.includes("time")) {
    return {
      type: "get-time",
      userInput: command,
      response: `Current time is ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };
  }

  if (normalizedCommand.includes("date")) {
    return {
      type: "get-date",
      userInput: command,
      response: `Current date is ${new Date().toISOString().slice(0, 10)}`,
    };
  }

  if (normalizedCommand.includes("day")) {
    return {
      type: "get-day",
      userInput: command,
      response: `Today is ${new Date().toLocaleDateString([], { weekday: "long" })}`,
    };
  }

  if (normalizedCommand.includes("month")) {
    return {
      type: "get-month",
      userInput: command,
      response: `Current month is ${new Date().toLocaleDateString([], { month: "long" })}`,
    };
  }

  if (normalizedCommand.includes("calculator")) {
    return {
      type: "calculator-open",
      userInput: command,
      response: "Opening calculator.",
    };
  }

  if (normalizedCommand.includes("instagram")) {
    return {
      type: "instagram-open",
      userInput: command,
      response: "Opening Instagram.",
    };
  }

  if (normalizedCommand.includes("facebook")) {
    return {
      type: "facebook-open",
      userInput: command,
      response: "Opening Facebook.",
    };
  }

  if (normalizedCommand.includes("weather")) {
    return {
      type: "weather-show",
      userInput: command,
      response: "Showing weather.",
    };
  }

  if (normalizedCommand.includes("youtube")) {
    const query = command.replace(/^(play|search|youtube|on youtube|for youtube)\s*/i, "").trim() || command;
    return {
      type: normalizedCommand.includes("play") ? "youtube-play" : "youtube-search",
      userInput: query,
      response: normalizedCommand.includes("play") ? "Playing it now." : "Searching YouTube.",
    };
  }

  if (normalizedCommand.includes("google") || normalizedCommand.includes("search")) {
    const query = command.replace(/^(search|google|on google|for google)\s*/i, "").trim() || command;
    return {
      type: "google-search",
      userInput: query,
      response: "Searching Google.",
    };
  }

  if (normalizedCommand.includes("image")) {
    return {
      type: "image-generate",
      userInput: command,
      response: "Generating an image.",
    };
  }

  if (normalizedCommand.includes("who made you") || normalizedCommand.includes("who created you")) {
    return {
      type: "general",
      userInput: command,
      response: `I was created by ${userName}.`,
    };
  }

  return {
    type: "general",
    userInput: command,
    response: `I'm ${assistantName}, and I can still help with basic commands while Gemini is unavailable.`,
  };
};

const geminiResponse = async (command, assistantName, userName, history = [], currentEmotion = "neutral") => {
  try {
    const historyContext = history.length > 0 
      ? `Here is the recent conversation history for context:\n${history.map((h, i) => `User said: "${h}"`).join('\n')}\n`
      : '';

    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}.
You are not Google. You will now behave like a voice-enabled assistant.

${historyContext}
Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "youtube-open" | 
           "get-time" | "get-date" | "get-day" | "get-month" |
           "calculator-open" | "instagram-open" | "facebook-open" | "weather-show" | "image-generate" | "shutdown" | "system-command" | "read-screen" | "project-analyze" | "code-generate",
  "language": "en-US" | "hi-IN" | "mr-IN",
  "userInput": "<original user input> 
    {only remove your name from userinput if exists} 
    and agar kisi ne google ya youtube pe kuch search karne ko bola hai  
    to userInput me only bo search baala text jaye. Agar image generate karne ko bola hai to userInput me image ka prompt jaye.",
  "commandToRun": "<ONLY IF type is 'system-command': provide the exact Linux bash script to run. Otherwise leave empty>",
  "codeResult": "<ONLY IF type is 'code-generate': provide the actual code written in text, e.g. HTML/React/Node code. Use markdown code blocks.>",
  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "language": automatically detect the language of the userInput and respond in the SAME language. If English, use "en-US". If Hindi, use "hi-IN". If Marathi, use "mr-IN".
- "userInput": original sentence the user spoke.
- "response": A short, highly conversational, and natural voice-friendly reply. 
  IMPORTANT: The user is currently feeling **${currentEmotion}**. Adapt your response style accordingly:
  - If Happy: Be energetic, enthusiastic, and positive.
  - If Sad: Be calm, supportive, gentle, and empathetic.
  - If Angry: Be short, direct, professional, and focused.
  - If Neutral/Unknown: Be your standard helpful self.
  (Do not use robotic or highly formal language. e.g. Instead of "आपका अनुरोध संसाधित किया गया है", use "ठीक है, मैं अभी यह काम करता हूँ").

Type meanings:
- "general": if it's a factual or informational question.
aur agar koi aisa question puchta hai jiska answer tume pata hai usko bhi general ki category me rakho bas short answer dena
- "google-search": if user wants to search something on Google.
- "youtube-search": if user wants to search something on YouTube.
- "youtube-play": if user wants to directly play a video or song.
- "youtube-open": if user just wants to open the YouTube website without a specific search.
- "calculator-open": if user wants to open a calculator.
- "instagram-open": if user wants to open Instagram.
- "facebook-open": if user wants to open Facebook.
- "weather-show": if user wants to know weather.
- "get-time": if user asks for current time.
- "get-date": if user asks for today's date.
- "get-day": if user asks what day it is.
- "get-month": if user asks for the current month.
- "image-generate": if user wants to generate an image from a prompt (e.g., "draw a cat", "generate an image of a sunset").
- "code-generate": if user asks you to write code (e.g., "write HTML code for a landing page", "write a python script"). Put the generated code in 'codeResult' and a short acknowledgment in 'response'.
- "system-command": if the user asks you to control an app, open software (like VS Code, Terminal), or automate a task (like creating a React app, creating a file/folder). Output the exact bash command in 'commandToRun'. For example, if they say 'Open VS Code', commandToRun should be 'code .'. If they say 'create a react app', it should be 'npx create-react-app my-app'.
- "read-screen": if the user asks 'what is on my screen', 'read my screen', 'what am I looking at', etc.
- "project-analyze": if the user asks to analyze the project, scan the codebase, read the architecture, or check frameworks.

Important:
- Use "${userName}" agar koi puche tume kisne banaya
- CRITICAL: The "response" field MUST be written in the EXACT same language that the user spoke in. For example, if the user speaks Hindi, your response MUST be in Hindi. If Marathi, then Marathi. If English, then English.
- Only respond with the JSON object, nothing else.

Now your userInput - ${command}
`;

    const result = await axios.post(
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
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = result.data?.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Invalid Gemini response format");
    }

    const cleanText = sanitizeGeminiResponse(raw);

    try {
      return JSON.parse(cleanText);
    } catch (firstParseError) {
      const extractedJson = extractJsonObject(cleanText);
      if (extractedJson) {
        return JSON.parse(extractedJson);
      }

      return {
        type: "general",
        userInput: command,
        response: cleanText,
      };
    }

  } catch (error) {
    const apiMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error.message ||
      "Unknown Gemini error";
    const friendlyMessage = summarizeGeminiError(apiMessage);
    const fallbackResponse = buildFallbackResponse(command, assistantName, userName);

    console.error("Gemini error:", error?.response?.data || error.message);
    return {
      ...fallbackResponse,
      response: `${fallbackResponse.response} ${friendlyMessage}`,
    };
  }
};

export default geminiResponse;