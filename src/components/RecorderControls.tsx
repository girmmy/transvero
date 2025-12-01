// Recorder Controls Component
import React from "react";
import { FiMic, FiMicOff } from "react-icons/fi";

interface RecorderControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

const RecorderControls: React.FC<RecorderControlsProps> = ({
  isRecording,
  onToggleRecording,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
      <button
        onClick={onToggleRecording}
        disabled={disabled}
        className={`
          flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${
            isRecording
              ? "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 focus:ring-red-300 dark:focus:ring-red-400 text-white"
              : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-300 dark:focus:ring-blue-400 text-white"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <FiMicOff className="h-6 w-6 sm:h-8 sm:w-8" />
        ) : (
          <FiMic className="h-6 w-6 sm:h-8 sm:w-8" />
        )}
      </button>

      <div className="text-center sm:text-left">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {isRecording
            ? "Recording... Click to stop"
            : "Click to start recording"}
        </p>
        {isRecording && (
          <div className="flex items-center justify-center sm:justify-start mt-1">
            <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-red-600 dark:text-red-400">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecorderControls;
