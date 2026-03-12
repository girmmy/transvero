// Live Text Display Component
import React, { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

interface LiveTextDisplayProps {
  transcript: string;
  isRecording: boolean;
  isMultispeakerEnabled?: boolean;
}

const LiveTextDisplay: React.FC<LiveTextDisplayProps> = ({
  transcript,
  isRecording,
  isMultispeakerEnabled = false,
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

    return text.split("\n").map((line, index) => {
      const speakerMatch = line.match(/^(\[Speaker [^\]]+\])\s*/);
      if (speakerMatch) {
        const label = speakerMatch[1];
        const content = line.slice(speakerMatch[0].length);
        return (
          <p
            key={index}
            className="mb-3 leading-relaxed"
            style={{ fontSize: `${textSize}px` }}
          >
            <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">{label}</span>
            <span className="text-gray-800 dark:text-gray-200">{content}</span>
          </p>
        );
      }
      return (
        <p
          key={index}
          className="mb-2 text-gray-800 dark:text-gray-200 leading-relaxed"
          style={{ fontSize: `${textSize}px` }}
        >
          {line}
        </p>
      );
    });
  };

  const handleIncreaseSize = () => {
    setTextSize((prev) => Math.min(prev + 2, 48)); // Max 48px
  };

  const handleDecreaseSize = () => {
    setTextSize((prev) => Math.max(prev - 2, 12)); // Min 12px
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64 sm:h-80 md:h-96 flex flex-col">
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
      <div className="flex-1 p-4 overflow-y-auto relative">
        {transcript ? (
          <div className="space-y-1">{formatTranscript(transcript)}</div>
        ) : isRecording && isMultispeakerEnabled ? (
          /* Multi-speaker recording popup */
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-sm mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center shadow-inner">
              {/* Animated recording rings */}
              <div className="relative flex items-center justify-center mb-5">
                <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-400 opacity-30 animate-ping"></span>
                <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-40 animate-ping" style={{ animationDelay: "0.3s" }}></span>
                <div className="relative flex items-center justify-center w-12 h-12 bg-red-500 rounded-full shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <p className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Capturing All Speakers
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Keep talking — your full transcript with speaker labels will appear here once you stop the recording.
              </p>

              {/* Animated audio wave bars */}
              <div className="flex items-end justify-center gap-1 h-8">
                {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1, 0.6].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce"
                    style={{
                      height: `${h * 100}%`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: "0.9s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
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
            {transcript ? (() => {
              // Remove speaker labels like "[Speaker A]" and count only actual text
              const textOnly = transcript.replace(/\[Speaker [A-Z]\]\s*/g, '').trim();
              return `${textOnly.length} characters`;
            })() : "No content yet"}
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
