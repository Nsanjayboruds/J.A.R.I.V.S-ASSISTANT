import axios from "axios";

export const speakWithElevenLabs = async (text) => {
  const apiKey = "sk_c962dd1833ac824d0f831a1473f9a674d0b7eb9f9b5d10af";
  const voiceId = "jqcCZkN6Knx8BJ5TBdYR";

  const response = await axios({
    method: "POST",
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    data: {
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    },
    responseType: "blob"
  });

  const audioUrl = URL.createObjectURL(response.data);
  const audio = new Audio(audioUrl);
  audio.play();
};
