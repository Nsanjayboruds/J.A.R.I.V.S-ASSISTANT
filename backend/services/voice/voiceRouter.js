import { normalizeText } from './pronunciationDictionary.js';
import { generateEdgeTTS } from './edgeTTS.js';

export const generateVoice = async (text, language = 'en-US', engine = 'edge') => {
  try {
    // 1. Text Normalization
    const cleanText = normalizeText(text, language);

    // 2. Select Engine
    if (engine === 'edge') {
      return await generateEdgeTTS(cleanText, language);
    }
    
    if (engine === 'piper') {
      // Future implementation for Piper local TTS
      throw new Error("Piper TTS is not fully configured yet. Please use edge.");
    }

    throw new Error("Unsupported voice engine");
  } catch (error) {
    console.error("Voice Generation Error:", error);
    throw error;
  }
};
