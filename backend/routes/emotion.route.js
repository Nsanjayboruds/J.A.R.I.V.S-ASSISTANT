import express from 'express';
import { updateEmotionState } from '../services/emotion/emotion.service.js';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.post('/update', isAuth, (req, res) => {
  try {
    const userId = req.userId;
    const { emotion, confidence, trend } = req.body;
    
    updateEmotionState(userId, { emotion, confidence, trend });

    res.json({ success: true });
  } catch (error) {
    console.error("Emotion update error:", error);
    res.status(500).json({ success: false });
  }
});

export default router;
