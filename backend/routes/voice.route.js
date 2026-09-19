import express from 'express';
import { generateVoice } from '../services/voice/voiceRouter.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.post('/generate', isAuth, async (req, res) => {
  try {
    const { text, language, engine } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const audioBase64 = await generateVoice(text, language || 'en-US', engine || 'edge');
    
    res.json({
      success: true,
      audioUrl: audioBase64
    });
  } catch (error) {
    console.error("Voice Route Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate voice" });
  }
});

export default router;
