// Browser Support Banner Component
import React, { useState } from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { detectBrowser } from "../utils/browserDetection";

const BrowserSupportBanner: React.FC = () => {
  // Check if dismissed first, before any state
  const dismissed = sessionStorage.getItem("browser-support-banner-dismissed");
  const [isVisible, setIsVisible] = useState(dismissed !== "true");
  const [browserInfo] = useState(() => detectBrowser());

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("browser-support-banner-dismissed", "true");
  };

  // Don't show if dismissed
  if (!isVisible) return null;

  // Determine if current browser is supported
  const isCurrentBrowserSupported = browserInfo.isSupported && 
    (browserInfo.name === "Chrome" || browserInfo.name === "Edge" || browserInfo.name === "Safari");

  return (
    <div className={`border-b ${isCurrentBrowserSupported ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <FiAlertCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${isCurrentBrowserSupported ? 'text-blue-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <p className={`text-sm ${isCurrentBrowserSupported ? 'text-blue-800' : 'text-yellow-800'}`}>
                <strong className="font-semibold">For best experience with speech recognition,</strong> please use{" "}
                <strong className="font-bold">Google Chrome</strong>,{" "}
                <strong className="font-bold">Microsoft Edge</strong>, or{" "}
                <strong className="font-bold">Safari</strong>.
                {browserInfo.name && (
                  <span className="ml-1">
                    You're currently using <strong className="font-bold">{browserInfo.name}</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`ml-4 transition-colors flex-shrink-0 ${isCurrentBrowserSupported ? 'text-blue-600 hover:text-blue-800' : 'text-yellow-600 hover:text-yellow-800'}`}
            aria-label="Dismiss banner"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserSupportBanner;

