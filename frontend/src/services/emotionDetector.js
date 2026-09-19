import * as faceapi from 'face-api.js';

class EmotionDetector {
  constructor() {
    this.isInitialized = false;
    this.videoElement = null;
    this.history = []; // store last 5 emotions
    this.intervalId = null;
    this.onEmotionUpdate = null;
  }

  async init(videoElement, onEmotionUpdate) {
    this.videoElement = videoElement;
    this.onEmotionUpdate = onEmotionUpdate;

    if (!this.isInitialized) {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      this.isInitialized = true;
    }

    this.startDetection();
  }

  startDetection() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Process every 1500 ms
    this.intervalId = setInterval(async () => {
      if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) return;

      const detection = await faceapi.detectSingleFace(
        this.videoElement,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      if (!detection) {
        this.onEmotionUpdate({ faceDetected: false, emotion: "unknown", confidence: 0 });
        return;
      }

      // Find dominant emotion
      const expressions = detection.expressions;
      let highestEmotion = 'neutral';
      let highestScore = 0;

      for (const [emotion, score] of Object.entries(expressions)) {
        if (score > highestScore) {
          highestScore = score;
          highestEmotion = emotion;
        }
      }

      // Confidence threshold (Step 5)
      if (highestScore < 0.60) {
        highestEmotion = 'neutral';
      }

      this.updateHistory(highestEmotion, highestScore);
    }, 1500);
  }

  updateHistory(emotion, confidence) {
    this.history.push(emotion);
    if (this.history.length > 5) {
      this.history.shift(); // Keep last 5
    }

    const finalEmotion = this.getSmoothedEmotion();
    this.onEmotionUpdate({
      faceDetected: true,
      emotion: finalEmotion,
      confidence: confidence
    });
  }

  getSmoothedEmotion() {
    // Return the most frequent emotion in the last 5 frames
    const counts = {};
    let maxCount = 0;
    let mostFrequent = 'neutral';

    for (const e of this.history) {
      counts[e] = (counts[e] || 0) + 1;
      if (counts[e] > maxCount) {
        maxCount = counts[e];
        mostFrequent = e;
      }
    }
    return mostFrequent;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const emotionDetector = new EmotionDetector();
