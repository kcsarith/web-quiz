"use client"
import { useState, useEffect } from "react";
const WebSpeechTTS: React.FC<{ text: string }> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  const speakText = () => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    setIsPlaying(true);

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!isSupported) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-700">
          Speech synthesis is not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h4 className="text-sm font-medium text-blue-700 mb-2">
        Browser TTS Fallback
      </h4>
      <p className="text-sm text-gray-700 mb-3">
        Server-side TTS failed. You can use your browser's speech synthesis
        instead:
      </p>
      <div className="flex gap-2">
        {isPlaying ? (
          <button
            onClick={stopSpeaking}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={speakText}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Speak Text
          </button>
        )}
      </div>
    </div>
  );
};

export default WebSpeechTTS
