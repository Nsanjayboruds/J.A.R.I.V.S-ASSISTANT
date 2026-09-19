class EmotionMemory {
  constructor() {
    this.memory = new Map(); // Store by userId
  }

  update(userId, data) {
    const current = this.memory.get(userId) || {
      currentEmotion: 'unknown',
      previousEmotion: 'unknown',
      emotionTrend: 'Stable',
      confidence: 0,
      timestamp: Date.now()
    };

    this.memory.set(userId, {
      currentEmotion: data.emotion,
      previousEmotion: current.currentEmotion,
      emotionTrend: data.trend,
      confidence: data.confidence,
      timestamp: Date.now()
    });
  }

  get(userId) {
    return this.memory.get(userId) || {
      currentEmotion: 'unknown',
      previousEmotion: 'unknown',
      emotionTrend: 'Stable',
      confidence: 0,
      timestamp: Date.now()
    };
  }
}

export const emotionMemory = new EmotionMemory();
