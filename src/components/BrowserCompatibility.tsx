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
  getBrowserRecommendations,
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
  const recommendations = getBrowserRecommendations(browserInfo);
  const compatibilityMessage = getCompatibilityMessage(browserInfo);

  const getStatusIcon = () => {
    if (browserInfo.isSupported) {
      return <FiCheckCircle className="h-6 w-6 text-green-500" />;
    }
    return <FiAlertCircle className="h-6 w-6 text-yellow-500" />;
  };

  const getStatusColor = () => {
    if (browserInfo.isSupported) {
      return "bg-green-50 border-green-200";
    }
    return "bg-yellow-50 border-yellow-200";
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900 ml-2">
            Browser Compatibility
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {browserInfo.name} {browserInfo.version}
          </span>
          <span
            className={`ml-2 px-2 py-1 rounded-full text-xs ${
              browserInfo.isSupported
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {browserInfo.isSupported ? "Supported" : "Limited Support"}
          </span>
        </div>
        <div className="whitespace-pre-line text-sm text-gray-600">
          {compatibilityMessage}
        </div>
      </div>

      {/* Feature Support Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Feature Support:
          </h4>
          <div className="space-y-1">
            <div className="flex items-center text-sm">
              {browserInfo.features.speechRecognition ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>Speech Recognition</span>
            </div>
            <div className="flex items-center text-sm">
              {browserInfo.features.microphone ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>Microphone Access</span>
            </div>
            <div className="flex items-center text-sm">
              {browserInfo.features.localStorage ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>Local Storage</span>
            </div>
            <div className="flex items-center text-sm">
              {browserInfo.features.webRTC ? (
                <FiCheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <FiAlertCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span>WebRTC</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Alternative Options:
          </h4>
          <div className="space-y-1">
            {browserInfo.fallbackOptions.map((option, index) => (
              <div key={index} className="flex items-center text-sm">
                <FiInfo className="h-4 w-4 text-blue-500 mr-2" />
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brave-specific troubleshooting */}
      {browserInfo.name === "Brave" && !browserInfo.isSupported && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-orange-900 mb-2">
            Brave Browser Fix:
          </h4>
          <div className="text-sm text-orange-800 space-y-2">
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
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recommended Browsers:
          </h4>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <FiDownload className="h-3 w-3 mr-1" />
              Chrome
            </a>
            <a
              href="https://www.microsoft.com/edge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <FiDownload className="h-3 w-3 mr-1" />
              Edge
            </a>
            <a
              href="https://www.apple.com/safari/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
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
