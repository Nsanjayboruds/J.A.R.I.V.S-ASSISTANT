import edge from 'node-edge-tts';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import fs from 'fs';

export const generateEdgeTTS = async (text, language = 'en-US') => {
  const tts = new edge();
  
  // Select preferred voices
  let voice = 'en-US-AndrewNeural';
  if (language === 'hi-IN') voice = 'hi-IN-SwaraNeural';
  if (language === 'mr-IN') voice = 'mr-IN-AarohiNeural';

  const outputDir = path.join(os.tmpdir(), 'jarvis-voice');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${crypto.randomUUID()}.mp3`);
  
  await tts.ttsPromise(text, outputPath, voice);
  
  // Read file as base64 so we can easily stream it back via JSON or just send the file
  const base64Audio = fs.readFileSync(outputPath, 'base64');
  
  // Clean up
  fs.unlinkSync(outputPath);
  
  return `data:audio/mp3;base64,${base64Audio}`;
};
