import React, { useEffect, useRef, useState } from 'react';
import { emotionDetector } from '../services/emotionDetector';
import axios from 'axios';

const EmotionPanel = ({ serverUrl }) => {
  const videoRef = useRef(null);
  const [emotionData, setEmotionData] = useState({
    faceDetected: false,
    emotion: 'unknown',
    confidence: 0
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [trend, setTrend] = useState('Stable');
  const prevEmotionRef = useRef('unknown');

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startVideo();

    return () => {
      emotionDetector.stop();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVideoPlaying = () => {
    emotionDetector.init(videoRef.current, async (data) => {
      setEmotionData(data);
      
      let newTrend = 'Stable';
      if (prevEmotionRef.current !== 'unknown' && data.emotion !== 'unknown' && prevEmotionRef.current !== data.emotion) {
        newTrend = 'Shifting';
      }
      setTrend(newTrend);
      prevEmotionRef.current = data.emotion;

      // Send to backend
      if (serverUrl && data.faceDetected) {
        try {
          await axios.post(`${serverUrl}/api/emotion/update`, {
            emotion: data.emotion,
            confidence: data.confidence,
            trend: newTrend
          }, { withCredentials: true });
        } catch (error) {
          // Silent error for continuous polling
        }
      }
    });
  };

  return (
    <div className="absolute top-24 right-6 w-64 bg-black/60 border border-cyan-500/50 backdrop-blur-md rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.2)] font-mono z-50">
      <div className="bg-cyan-900/40 p-2 border-b border-cyan-500/50 text-xs text-cyan-300 tracking-widest uppercase flex justify-between items-center">
        <span>Camera: {cameraActive ? 'Active' : 'Offline'}</span>
        {cameraActive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
      </div>
      
      {/* Webcam Preview PiP */}
      <div className="relative w-full h-36 bg-gray-900 overflow-hidden">
        <video 
          ref={videoRef}
          onPlaying={handleVideoPlaying}
          autoPlay 
          muted 
          className="w-full h-full object-cover opacity-60"
        />
        {!emotionData.faceDetected && cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-cyan-400/80">
            Scanning for face...
          </div>
        )}
      </div>

      <div className="p-3 text-xs tracking-wider space-y-2">
        {!emotionData.faceDetected ? (
          <div className="text-red-400">Face: Not Detected</div>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-cyan-500/80">Emotion:</span>
              <span className="text-cyan-100 capitalize">{emotionData.emotion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-500/80">Confidence:</span>
              <span className="text-cyan-100">{Math.round(emotionData.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-500/80">Trend:</span>
              <span className="text-cyan-100">{trend}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmotionPanel;
