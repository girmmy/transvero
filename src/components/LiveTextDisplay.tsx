// Live Text Display Component
import React, { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

interface LiveTextDisplayProps {
  transcript: string;
  isRecording: boolean;
}

const LiveTextDisplay: React.FC<LiveTextDisplayProps> = ({
  transcript,
  isRecording,
}) => {
  // Text size state (in pixels, default 18px)
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem("transvero-text-size");
    return saved ? parseInt(saved, 10) : 18;
  });

  // Save text size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("transvero-text-size", textSize.toString());
  }, [textSize]);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTranscript = (text: string) => {
    if (!text) return "";

    return text.split("\n").map((line, index) => (
      <p
        key={index}
        className="mb-2 text-gray-800 dark:text-gray-200 leading-relaxed"
        style={{ fontSize: `${textSize}px` }}
      >
        {line}
      </p>
    ));
  };

  const handleIncreaseSize = () => {
    setTextSize((prev) => Math.min(prev + 2, 48)); // Max 48px
  };

  const handleDecreaseSize = () => {
    setTextSize((prev) => Math.max(prev - 2, 12)); // Min 12px
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Transcript
          </h3>
          {isRecording && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">LIVE</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Text Size Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={handleDecreaseSize}
              disabled={textSize <= 12}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300 font-semibold"
              title="Decrease text size"
              aria-label="Decrease text size"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-center">
              {textSize}px
            </span>
            <button
              onClick={handleIncreaseSize}
              disabled={textSize >= 48}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300 font-semibold"
              title="Increase text size"
              aria-label="Increase text size"
            >
              +
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FiClock className="h-4 w-4" />
            <span>{formatTime()}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {transcript ? (
          <div className="space-y-1">{formatTranscript(transcript)}</div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">🎤</div>
              <p className="text-lg font-medium mb-2">Ready to transcribe</p>
              <p className="text-sm">
                {isRecording
                  ? "Start speaking to see live captions appear here..."
                  : "Click the microphone button to start recording"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {transcript ? `${transcript.length} characters` : "No content yet"}
          </span>
          <span>
            {isRecording ? "Recording in progress..." : "Ready to record"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveTextDisplay;
