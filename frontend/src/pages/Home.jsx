import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userDataContext } from '../context/UserContext';
import Galaxy from '../components/Galaxy';
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch {
      setUserData(null);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error("Start error:", error);
      }
    }
  };

  const speak = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    const hindiVoice = synth.getVoices().find(v => v.lang === 'hi-IN');
    if (hindiVoice) utterance.voice = hindiVoice;

    isSpeakingRef.current = true;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAiText("");
      setTimeout(() => startRecognition(), 800);
    };
    synth.cancel();
    synth.speak(utterance);
  };

  const generateImageFromPrompt = async (prompt) => {
    try {
      const res = await axios.post(`${serverUrl}/api/image/generate`, { prompt }, { withCredentials: true });
      return res.data.imageUrl;
    } catch (err) {
      console.error("Image generation failed:", err);
      return null;
    }
  };




  const handleCommand = async ({ type, userInput, response }) => {
    speak(response);
    const encoded = encodeURIComponent(userInput);

    switch (type) {
      case 'google-search':
        window.open(`https://www.google.com/search?q=${encoded}`, '_blank'); break;
      case 'calculator-open':
        window.open('https://www.google.com/search?q=calculator', '_blank'); break;
      case 'instagram-open':
        window.open('https://www.instagram.com/', '_blank'); break;
      case 'facebook-open':
        window.open('https://www.facebook.com/', '_blank'); break;
      case 'weather-show':
        window.open(`https://www.google.com/search?q=weather+${encoded}`, '_blank'); break;
      case 'youtube-search':
      case 'youtube-play':
        window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank'); break;
      case 'image-generate': {
        const imageUrl = await generateImageFromPrompt(userInput);
        if (imageUrl) setGeneratedImage(imageUrl);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    recognitionRef.current = recognition;
    let isMounted = true;

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          if (e.name !== "InvalidStateError") console.error(e);
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }, 1000);
      }
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      setUserText(transcript);
      setGeneratedImage(null);
      recognition.stop();

      const data = await getGeminiResponse(transcript);
      if (!data?.response) {
        speak("Sorry, I didn't understand that.");
        return;
      }
      await handleCommand(data);
      setAiText(data.response);
      setUserText("");
    };

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex justify-center items-center p-4">
      <div className="absolute inset-0 z-0">
        <Galaxy />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-10"></div>
      </div>

      <div className="absolute top-6 right-6 flex gap-3 z-20">
        <button
          className="px-4 py-2 border-2 border-blue-400 text-blue-400 rounded-lg text-sm hover:bg-blue-400/20"
          onClick={() => navigate("/customize")}
        >
          Customize Assistant
        </button>
        <button
          className="px-4 py-2 border-2 border-red-400 text-red-400 rounded-lg text-sm hover:bg-red-400/20"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center max-w-[600px] mx-auto pt-10">
        <div className="w-[200px] sm:w-[300px] h-[300px] sm:h-[400px] flex justify-center items-center rounded-2xl shadow-xl mb-6 bg-[#0a0a2a]">
          <img src={userData?.assistantImage} alt="Assistant" className="h-full object-cover rounded-4xl" />
        </div>

        <h1 className="text-white text-xl font-semibold mb-4">I'm {userData?.assistantName}</h1>

        <p className="text-white text-center text-base sm:text-lg mb-6 px-4">
          {userText || aiText || "Say something..."}
        </p>

        <div className="flex justify-center mb-4">
          {!aiText && <img src={userImg} alt="User" className="w-[100px] sm:w-[150px]" />}
          {aiText && <img src={aiImg} alt="AI" className="w-[100px] sm:w-[150px]" />}
        </div>

        {generatedImage && (
          <div className="w-full mt-6 flex justify-center">
            <img src={generatedImage} alt="Generated" className="rounded-xl shadow-xl w-full max-w-md border border-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
