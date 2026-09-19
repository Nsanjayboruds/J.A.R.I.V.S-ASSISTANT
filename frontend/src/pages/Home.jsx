import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userDataContext } from '../context/UserContext';
import EmotionPanel from '../components/EmotionPanel';

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [speechLanguage, setSpeechLanguage] = useState(window.navigator.language || 'en-US');

  const [listening, setListening] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt');
  const [micMessage, setMicMessage] = useState('');
  const [manualInput, setManualInput] = useState("");
  const [aiCode, setAiCode] = useState("");
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    updateVoices();
  }, []);

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
    if (micPermission === 'denied') {
      setMicMessage('Microphone access is blocked. Allow microphone permission for this site in your browser settings, then click Enable Mic.');
      return;
    }
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error("Start error:", error);
      }
    }
  };

  const enableMicrophone = async () => {
    setMicMessage('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicMessage('Your browser does not support microphone access.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setMicMessage('Microphone enabled. You can speak now.');
      setTimeout(() => startRecognition(), 200);
    } catch (error) {
      setMicPermission('denied');
      setMicMessage('Microphone permission was denied. Enable it in site settings and try again.');
    }
  };

  const speak = async (text, aiLanguage = 'en-US') => {
    if (!text) return;
    
    isSpeakingRef.current = true;
    
    try {
      // Pass the language dynamically detected by the LLM, fallback to user's selected language
      const langToUse = aiLanguage || speechLanguage;
      const res = await axios.post(`${serverUrl}/api/voice/generate`, { 
        text, 
        language: langToUse,
        engine: 'edge' 
      }, { withCredentials: true });

      if (res.data.success && res.data.audioUrl) {
        const audio = new Audio(res.data.audioUrl);
        audio.onended = () => {
          isSpeakingRef.current = false;
          setAiText("");
          setTimeout(() => startRecognition(), 800);
        };
        audio.play();
      } else {
        throw new Error("Failed to get audio URL");
      }
    } catch (error) {
      console.error("Backend TTS failed, falling back to browser TTS:", error);
      
      // Fallback to Browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = aiLanguage || speechLanguage;
      
      const baseLang = utterance.lang.split('-')[0];
      let preferredVoice = voices.find(v => v.lang === utterance.lang && v.name.includes('Google'));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(baseLang) && v.name.includes('Google'));
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang === utterance.lang);
      if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(baseLang));
      
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setAiText("");
        setTimeout(() => startRecognition(), 800);
      };
      synth.cancel();
      synth.speak(utterance);
    }
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

  const processUserInput = async (inputText) => {
    const transcript = inputText.trim();
    if (!transcript) return;

    setUserText(transcript);
    setGeneratedImage(null);
    setAiCode("");

    const data = await getGeminiResponse(transcript);
    if (!data?.response) {
      speak("Sorry, I didn't understand that.");
      return;
    }

    setAiText(data.response);
    if (data.codeResult) {
      setAiCode(data.codeResult);
    }
    await handleCommand(data);
    setUserText("");
  };




  const safeOpen = (url) => {
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('Popup blocked! Please allow popups for this site in your browser URL bar (the small icon with a red X) so Jarvis can open links for you.');
    }
  };

  const handleCommand = async ({ type, language, userInput, response, commandToRun }) => {
    speak(response, language);
    const encoded = encodeURIComponent(userInput);

    switch (type) {
      case 'google-search':
        safeOpen(`https://www.google.com/search?q=${encoded}`); break;
      case 'calculator-open':
        safeOpen('https://www.google.com/search?q=calculator'); break;
      case 'instagram-open':
        safeOpen('https://www.instagram.com/'); break;
      case 'facebook-open':
        safeOpen('https://www.facebook.com/'); break;
      case 'youtube-open':
        safeOpen('https://www.youtube.com/'); break;
      case 'weather-show':
        safeOpen(`https://www.google.com/search?q=weather+${encoded}`); break;
      case 'youtube-search':
      case 'youtube-play':
        safeOpen(`https://www.youtube.com/results?search_query=${encoded}`); break;
      case 'image-generate': {
        const imageUrl = await generateImageFromPrompt(userInput);
        if (imageUrl) setGeneratedImage(imageUrl);
        break;
      }
      case 'system-command': {
        if (commandToRun) {
          try {
            const res = await axios.post(`${serverUrl}/api/command/execute`, { commandToRun }, { withCredentials: true });
            console.log("Command output:", res.data.output);
          } catch (error) {
            console.error("Failed to execute command:", error);
            alert("Failed to execute system command. Ensure the backend is running locally and has the correct permissions.");
            speak("Sorry, I encountered an error while running the command.");
          }
        }
        break;
      }
      case 'read-screen': {
        try {
          speak("Scanning your screen now...");
          const res = await axios.get(`${serverUrl}/api/vision/screen`, { withCredentials: true });
          if (res.data.success && res.data.description) {
            speak(res.data.description);
            setAiText(res.data.description);
          }
        } catch (error) {
          console.error("Failed to read screen:", error);
          speak("Sorry, I encountered an error while trying to read your screen.");
        }
        break;
      }
      case 'project-analyze': {
        try {
          speak("Analyzing the project directory now. Please wait.");
          const res = await axios.get(`${serverUrl}/api/project/analyze`, { withCredentials: true });
          if (res.data.success && res.data.data) {
            const stats = res.data.data.statistics;
            const text = `Project analyzed successfully. I found ${stats.totalFiles} files and ${stats.totalFolders} folders. The project size is ${stats.projectSizeMB} megabytes. Frameworks detected are: ${res.data.data.frameworks.join(', ')}.`;
            speak(text);
            setAiText(text);
          }
        } catch (error) {
          console.error("Failed to analyze project:", error);
          speak("Sorry, I encountered an error while analyzing the project.");
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicMessage('Speech recognition is not supported in this browser.');
      return;
    }

    let currentPermission = 'prompt';

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' }).then((status) => {
        currentPermission = status.state;
        setMicPermission(status.state);
        if (status.state === 'denied') {
          setMicMessage('Microphone access is blocked. Allow it in browser settings, then click Enable Mic.');
          return;
        }

        if (status.state === 'granted') {
          setMicMessage('Microphone enabled. You can speak now.');
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (error) {
              if (error.name !== 'InvalidStateError') console.error(error);
            }
          }, 1000);
        }

        status.onchange = () => {
          currentPermission = status.state;
          setMicPermission(status.state);

          if (status.state === 'granted') {
            setMicMessage('Microphone enabled. You can speak now.');
            setTimeout(() => startRecognition(), 250);
          }

          if (status.state === 'denied') {
            setMicMessage('Microphone access is blocked. Allow it in browser settings, then click Enable Mic.');
          }
        };
      });
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    // use the dynamic state or default to english if unset
    recognition.lang = speechLanguage;
    recognition.interimResults = false;

    recognitionRef.current = recognition;
    let isMounted = true;

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current && currentPermission !== 'denied') {
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
      recognition.stop();
      await processUserInput(transcript);
    };

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
    };
  }, []);

  return (
    <div className="tech-bg relative w-full h-screen overflow-hidden flex justify-center items-center p-4 font-mono">
      <div className="absolute inset-0 z-0 opacity-20"></div>

      <div className="absolute top-6 right-6 flex gap-3 z-20 items-center">
        <select 
          value={speechLanguage}
          onChange={(e) => {
            setSpeechLanguage(e.target.value);
            if (recognitionRef.current) {
              recognitionRef.current.lang = e.target.value;
            }
          }}
          className="px-2 py-2 border border-cyan-500/50 text-cyan-400 bg-black/50 text-xs tracking-widest hover:bg-cyan-900/40 uppercase transition-colors outline-none cursor-pointer"
        >
          <option value="en-US">EN</option>
          <option value="hi-IN">HI</option>
          <option value="mr-IN">MR</option>
          <option value="es-ES">ES</option>
          <option value="fr-FR">FR</option>
          <option value="ja-JP">JA</option>
        </select>

        <button
          className="px-4 py-2 border border-cyan-500 text-cyan-400 bg-black/50 text-xs tracking-widest hover:bg-cyan-900/40 uppercase transition-colors"
          onClick={() => navigate("/customize")}
        >
          [ Settings ]
        </button>
        <button
          className="px-4 py-2 border border-cyan-500/50 text-cyan-500/80 bg-black/50 text-xs tracking-widest hover:bg-cyan-900/40 uppercase transition-colors"
          onClick={handleLogout}
        >
          [ Disconnect ]
        </button>
      </div>

      <EmotionPanel serverUrl={serverUrl} />

      <div className="relative z-10 w-full flex flex-col items-center max-w-[800px] mx-auto pt-4">
        {micMessage && (
          <div className="mb-4 border border-cyan-500/30 bg-cyan-900/20 px-4 py-2 text-xs text-cyan-300 max-w-md text-center uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            {micMessage}
          </div>
        )}

        <button
          type="button"
          onClick={enableMicrophone}
          className="mb-8 border border-cyan-400 text-cyan-400 px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
        >
          Initialize Audio Link
        </button>

        {/* HYPER-REALISTIC TRIANGLE ARC REACTOR */}
        <div className={`relative w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] flex justify-center items-center mb-8 mt-2 transition-all duration-300 ${aiText ? 'arc-speaking scale-[1.02]' : listening ? 'animate-pulse' : ''}`}>
          
          {/* Faint ambient glow */}
          <div className="absolute inset-0 rounded-full bg-[#00e5ff] blur-[120px] opacity-20"></div>

          {/* 1. Outer Large Thin Circle (Glass rim) */}
          <div className="absolute inset-[0px] rounded-full border border-white/30 shadow-[0_0_15px_rgba(0,229,255,0.4),inset_0_0_20px_rgba(0,229,255,0.2)] bg-cyan-900/5 backdrop-blur-[2px]"></div>
          
          {/* Tick marks ring */}
          <div className="absolute inset-[4px] rounded-full arc-ticks opacity-90 animate-[spin_120s_linear_infinite]"></div>

          {/* 2. Medium Thick Blue Ring (Neon Tubing) */}
          <div className="absolute inset-[20px] rounded-full border-[6px] border-white/20 shadow-[0_0_20px_#00e5ff,inset_0_0_20px_#00e5ff] bg-[#00e5ff]/10 backdrop-blur-sm"></div>
          {/* 2b. Thin line just outside medium ring */}
          <div className="absolute inset-[16px] rounded-full border border-[#00e5ff]/80 shadow-[0_0_10px_#00e5ff]"></div>

          {/* 3. Chunky Segmented Ring */}
          <div className="absolute inset-[40px] rounded-full arc-segment-ring opacity-100 animate-[spin_40s_linear_infinite]"></div>

          {/* 4. Solid Inner Bright Blue Ring (Core Containment) */}
          <div className="absolute inset-[95px] rounded-full border-[8px] border-white/40 shadow-[0_0_30px_#00e5ff,inset_0_0_30px_#00e5ff] bg-[#00e5ff]/20 backdrop-blur-md"></div>

          {/* 5. Small inner thin ring */}
          <div className="absolute inset-[115px] rounded-full border-2 border-[#bdf4ff]/80 shadow-[0_0_10px_#fff,inset_0_0_10px_#fff]"></div>

          {/* Core Text "CORE ACTIVE" */}
          <div className="absolute top-[31%] text-white text-[10px] sm:text-xs font-bold tracking-[0.3em] opacity-100 drop-shadow-[0_0_8px_#00e5ff] z-20">
             CORE ACTIVE
          </div>

          {/* 6. The Center Triangle */}
          <div className="absolute inset-[130px] flex justify-center items-center z-10">
             <div className="relative flex justify-center items-center mt-3">
                <div className="arc-triangle-outer flex justify-center items-start pt-2">
                  <div className="arc-triangle-inner"></div>
                </div>
             </div>
          </div>
          
          {/* Center Light Flare */}
          <div className={`absolute w-20 h-20 rounded-full bg-[#ffffff] blur-[15px] transition-all duration-100 mix-blend-overlay pointer-events-none z-30 ${aiText ? 'scale-150 opacity-100 shadow-[0_0_80px_20px_#fff]' : 'opacity-80 scale-100 shadow-[0_0_40px_10px_#00e5ff]'}`}></div>

        </div>

        <h1 className="text-cyan-400 text-lg uppercase tracking-[0.3em] mb-8 font-bold">
          SYS.{userData?.assistantName || "CORE"} ONLINE
        </h1>

        <div className="w-full max-w-md min-h-[60px] border-l-2 border-cyan-500 pl-4 mb-8">
          <p className="text-cyan-100 text-sm sm:text-base leading-relaxed tracking-wide font-mono whitespace-pre-wrap">
            {userText ? `USER: ${userText}` : aiText ? `SYS: ${aiText}` : "AWAITING INPUT..."}
          </p>
        </div>

        {aiCode && (
          <div className="w-full max-w-3xl mb-8 border border-cyan-500/30 rounded-lg overflow-hidden bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-cyan-900/40 text-cyan-300 text-xs px-4 py-2 uppercase tracking-widest border-b border-cyan-500/30">
              Generated Code
            </div>
            <pre className="p-4 text-cyan-100 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {aiCode}
            </pre>
          </div>
        )}

        <form
          className="flex w-full max-w-md gap-0 px-4 mb-4 border-b border-cyan-500/50 pb-1"
          onSubmit={(event) => {
            event.preventDefault();
            processUserInput(manualInput);
            setManualInput('');
          }}
        >
          <span className="text-cyan-500 mr-2 flex items-center font-bold">{'>'}</span>
          <input
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="MANUAL OVERRIDE..."
            className="flex-1 bg-transparent text-cyan-300 text-sm uppercase tracking-wider outline-none placeholder:text-cyan-900"
          />
          <button
            type="submit"
            className="text-cyan-500 text-xs uppercase tracking-widest hover:text-white transition-colors pl-2"
          >
            [ EXEC ]
          </button>
        </form>

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
