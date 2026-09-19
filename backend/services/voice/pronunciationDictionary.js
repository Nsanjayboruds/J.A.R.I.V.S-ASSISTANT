export const normalizeText = (text, language) => {
  if (!text) return text;
  let normalized = text;

  if (language === 'hi-IN' || language === 'mr-IN') {
    // English words that sound bad in Hindi/Marathi TTS
    const dict = {
      'Jarvis': 'जार्विस',
      'AI': 'ए आई',
      'API': 'ए पी आय',
      'GPU': 'जी पी यू',
      'GitHub': 'गिटहब',
      'UI': 'यू आई',
      'React': 'रियाक्ट',
      'Node': 'नोड'
    };

    for (const [eng, local] of Object.entries(dict)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      normalized = normalized.replace(regex, local);
    }
  }

  return normalized;
};
