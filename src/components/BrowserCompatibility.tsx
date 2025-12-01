// Browser Compatibility Component
import React from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiDownload,
} from "react-icons/fi";
import {
  BrowserInfo,
  getCompatibilityMessage,
} from "../utils/browserDetection";

interface BrowserCompatibilityProps {
  browserInfo: BrowserInfo;
  onDismiss?: () => void;
}

const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({
  browserInfo,
  onDismiss,
}) => {
  const compatibilityMessage = getCompatibilityMessage(browserInfo);

  const getStatusIcon = () => {
    if (browserInfo.isSupported) {
      return <FiCheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />;
    }
    return <FiAlertCircle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />;
  };

  const getStatusColor = () => {
    if (browserInfo.isSupported) {
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    }
    return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
            Browser Compatibility
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {browserInfo.name} {browserInfo.version}
          </span>
          <span
            className={`ml-2 px-2 py-1 rounded-full text-xs ${
              browserInfo.isSupported
                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
            }`}
          >
            {browserInfo.isSupported ? "Supported" : "Limited Support"}
          </span>
        </div>
        <div className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
          {compatibilityMessage}
        </div>
      </div>

      {/* Feature Support Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Feature Support:
          </h4>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              {browserInfo.features.speechRecognition ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
              )}
              <span>Speech Recognition</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              {browserInfo.features.microphone ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
              )}
              <span>Microphone Access</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              {browserInfo.features.localStorage ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
              )}
              <span>Local Storage</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              {browserInfo.features.webRTC ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
              )}
              <span>WebRTC</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Alternative Options:
          </h4>
          <div className="space-y-1">
            {browserInfo.fallbackOptions.map((option, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <FiInfo className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brave-specific troubleshooting */}
      {browserInfo.name === "Brave" && !browserInfo.isSupported && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
            Brave Browser Fix:
          </h4>
          <div className="text-sm text-orange-800 dark:text-orange-300 space-y-2">
            <p>
              <strong>Step 1:</strong> Click the Brave Shield icon (🛡️) in the
              address bar
            </p>
            <p>
              <strong>Step 2:</strong> Toggle "Shields down" for this site
            </p>
            <p>
              <strong>Step 3:</strong> Refresh the page and try recording again
            </p>
            <p>
              <strong>Alternative:</strong> Go to brave://settings/privacy and
              allow microphone access
            </p>
          </div>
        </div>
      )}

      {/* Download Links */}
      {!browserInfo.isSupported && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recommended Browsers:
          </h4>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <FiDownload className="h-3 w-3 mr-1" />
              Chrome
            </a>
            <a
              href="https://www.microsoft.com/edge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <FiDownload className="h-3 w-3 mr-1" />
              Edge
            </a>
            <a
              href="https://www.apple.com/safari/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <FiDownload className="h-3 w-3 mr-1" />
              Safari
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserCompatibility;
