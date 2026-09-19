import { response } from "express";
import uploadOnCloudinary from "../config/cloundinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment  from "moment";
import { getEmotionState } from "../services/emotion/emotion.service.js";

export const genCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user=await User.findById(req.userId).select("-password")
        if (!userId) { 
            return res.status(400).json({ message: "No user ID found" });
        }
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        // Return the user object (without password)
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({ message: "get current user error" });
    }
}

export const updateAssistant = async (req, res) => {
    try {
        const { assistantName, imageUrl } = req.body;
        let assistantImage;
        if (req.file) {
            assistantImage = await uploadOnCloudinary(req.file.path);
        } else {
            assistantImage = imageUrl;
        }
        console.log("assistantImage to save:", assistantImage);
        console.log("Cloudinary image URL:", assistantImage);

        const user = await User.findByIdAndUpdate(
            req.userId,
            { assistantName,assistantImage },
            { new: true }
        ).select("-password");

        console.log("Updated user:", user);

        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({ message: "updateAssistantError user error" });
    }
}

// export const askToAssistant=async(req,res)=>{
//     try {
//         const{command}=req.body
//         const user=await User.findById(req.userId);
//         user.history.push(command)
//         user.save()
//         const userName=user.name
//         const assistantName=user.assistantName
//         const result=await geminiResponse(command,assistantName,userName)

//         const jsonMatch=result.match(/{[\s\S]*}/)// Gemeni answer je deti n de pahlech stringfy ast pasun son karch naste
//         if(!jsonMatch){
//             return res.status(400).json({response:"sorry, i can't understand "})

//         }
//         const gemResult=JSON.parse(jsonMatch[0])
//         const type=gemResult.type
//          switch(type){
//             case 'get-date':
//                 return res.json({
//                     type,
//                     userInput:gemResult.userInput,
//                     response:`current date is ${moment().format
//                         ("YYYY-MM-DD") }`
//                 });
//             case 'get-time':
//                 return res.json({
//                     type,
//                     userInput:gemResult.userInput,
//                     response:`current time is ${moment().format("HH:mm A")}`
//                 });
//             case 'get-day':
//                 return res.json({
//                     type,
//                     userInput:gemResult.userInput,
//                     response:`today is ${moment().format("dddd")}`
//                 });
//             case 'get-month':
//                 return res.json({
//                     type,
//                     userInput:gemResult.userInput,
//                     response:`current month is ${moment().format("MMMM")}`
//                 });
//           case 'google-search':
//           case 'youtube-search':
//           case 'youtube-play':
//           case'general':
//           case 'calculator-open': 
//           case 'instagram-open': 
//           case 'facebook-open': 
//           case 'weather-show':
//             return res.json({
//                 type,
//                 userInput:gemResult.userInput,
//                 response:gemResult.response,
               
//             });
//             default:
//             return res.status(400).json({response:"I don't  understand that command."})
//          }
//     } catch (error) {
//             return res.status(500).json({response:"ask assistant error"})
    
//     }
// }

// export const askToAssistant = async (req, res) => {
//   try {
//     const { command } = req.body;
//     const user = await User.findById(req.userId);

//     if (!user) {
//       return res.status(404).json({ response: "User not found." });
//     }

//     user.history.push(command);
//     await user.save();

//     const userName = user.name;
//     const assistantName = user.assistantName;

//     const result = await geminiResponse(command, assistantName, userName);

//     // 🚨 Log Gemini result before parsing
//     console.log("Raw Gemini result:", result);

//     if (!result) {
//       return res.status(500).json({ response: "Gemini API error: No response." });
//     }

//     const jsonMatch = result.match(/{[\s\S]*}/);
//     if (!jsonMatch) {
//       return res.status(400).json({ response: "Invalid format received from Gemini." });
//     }

//     let gemResult;
//     try {
//       gemResult = JSON.parse(jsonMatch[0]);
//     } catch (parseErr) {
//       console.error("JSON parse error:", parseErr);
//       return res.status(400).json({ response: "Gemini returned invalid JSON." });
//     }

//     const type = gemResult.type;

//     switch (type) {
//       case 'get-date':
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Current date is ${moment().format("YYYY-MM-DD")}`
//         });
//       case 'get-time':
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Current time is ${moment().format("HH:mm A")}`
//         });
//       case 'get-day':
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Today is ${moment().format("dddd")}`
//         });
//       case 'get-month':
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: `Current month is ${moment().format("MMMM")}`
//         });
//       case 'google-search':
//       case 'youtube-search':
//       case 'youtube-play':
//       case 'general':
//       case 'calculator-open':
//       case 'instagram-open':
//       case 'facebook-open':
//       case 'weather-show':
//         return res.json({
//           type,
//           userInput: gemResult.userInput,
//           response: gemResult.response,
//         });
//       default:
//         return res.status(400).json({ response: "Unknown command type." });
//     }

//   } catch (error) {
//     console.error("askToAssistant error:", error);
//     return res.status(500).json({ response: "ask assistant error" });
//   }
// };

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ response: "User not found." });
    }

    user.history.push(command);
    await user.save();

    const userName = user.name;
    const assistantName = user.assistantName;

    // Pass the last 10 history items to provide context without overloading the token limit
    const recentHistory = user.history.slice(-10);
    const emotionState = getEmotionState(user._id);

    const result = await geminiResponse(command, assistantName, userName, recentHistory, emotionState.currentEmotion);

    const type = result?.type || "general";
    const language = result?.language || "en-US";
    const userInput = result?.userInput || command;
    const geminiText = result?.response || "Sorry, I couldn't understand that.";
    const codeResult = result?.codeResult || null;
    const commandToRun = result?.commandToRun || null;

    switch (type) {
      case "get-date":
        return res.json({
          type,
          language,
          userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case "get-time":
        return res.json({
          type,
          language,
          userInput,
          response: `Current time is ${moment().format("HH:mm A")}`,
        });

      case "get-day":
        return res.json({
          type,
          language,
          userInput,
          response: `Today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.json({
          type,
          language,
          userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });

      case "system-command":
        return res.json({
          type,
          language,
          userInput,
          response: geminiText,
          commandToRun
        });

      case "code-generate":
        return res.json({
          type,
          language,
          userInput,
          response: geminiText,
          codeResult
        });

      case "general":
      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "youtube-open":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "image-generate":
      case "shutdown":
      case "read-screen":
      case "project-analyze":
        return res.json({
          type,
          language,
          userInput,
          response: geminiText,
        });
    }
  } catch (error) {
    console.error("askToAssistant error:", error);
    return res.status(500).json({ response: "ask assistant error" });
  }
};