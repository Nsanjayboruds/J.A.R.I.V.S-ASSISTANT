import { emotionMemory } from './emotionMemory.js';

export const updateEmotionState = (userId, data) => {
  emotionMemory.update(userId, data);
};

export const getEmotionState = (userId) => {
  return emotionMemory.get(userId);
};
