// Browser Detection and Compatibility Utilities
export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  features: {
    speechRecognition: boolean;
    microphone: boolean;
    localStorage: boolean;
    webRTC: boolean;
  };
  fallbackOptions: string[];
}

export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isOpera = /Opera/.test(userAgent) || /OPR/.test(userAgent);
  const isIE = /MSIE/.test(userAgent) || /Trident/.test(userAgent);
  const isBrave = /Brave/.test(userAgent) || (window as any).brave;

  // Detect browser name and version
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (isBrave) {
    browserName = "Brave";
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isChrome) {
    browserName = "Chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isEdge) {
    browserName = "Edge";
    const match = userAgent.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isSafari) {
    browserName = "Safari";
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isFirefox) {
    browserName = "Firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isOpera) {
    browserName = "Opera";
    const match = userAgent.match(/Opera\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (isIE) {
    browserName = "Internet Explorer";
    const match =
      userAgent.match(/MSIE (\d+)/) || userAgent.match(/Trident.*rv:(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }

  // Check feature support
  const speechRecognition = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
  const microphone = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  const localStorage = typeof Storage !== "undefined";
  const webRTC = !!(
    window.RTCPeerConnection || (window as any).webkitRTCPeerConnection
  );

  // Determine if browser is supported for speech recognition
  const isSupported = speechRecognition && microphone && localStorage;

  // Generate fallback options based on browser
  const fallbackOptions: string[] = [];

  if (!speechRecognition) {
    fallbackOptions.push("Manual text input");
    fallbackOptions.push("Copy-paste from other sources");
  }

  if (!microphone) {
    fallbackOptions.push("Use external microphone");
    fallbackOptions.push("Check microphone permissions");
  }

  if (isFirefox) {
    fallbackOptions.push("Try Chrome or Edge for full speech recognition");
  }

  if (isIE) {
    fallbackOptions.push("Upgrade to a modern browser");
  }

  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    features: {
      speechRecognition,
      microphone,
      localStorage,
      webRTC,
    },
    fallbackOptions,
  };
};

export const getBrowserRecommendations = (
  browserInfo: BrowserInfo
): string[] => {
  const recommendations: string[] = [];

  if (browserInfo.name === "Brave") {
    recommendations.push(
      "Brave has strict privacy settings that may block speech recognition"
    );
    recommendations.push("Try disabling Brave Shields for this site");
    recommendations.push(
      "Check Brave's privacy settings and allow microphone access"
    );
    recommendations.push(
      "You can also use manual text input as an alternative"
    );
  }

  if (browserInfo.name === "Firefox") {
    recommendations.push("Firefox doesn't support Web Speech API");
    recommendations.push("Try Chrome, Edge, or Safari for speech recognition");
    recommendations.push("You can still use manual text input features");
  }

  if (browserInfo.name === "Internet Explorer") {
    recommendations.push("Internet Explorer is not supported");
    recommendations.push("Please upgrade to Chrome, Edge, Firefox, or Safari");
  }

  if (browserInfo.name === "Safari" && parseInt(browserInfo.version) < 14) {
    recommendations.push("Safari version is outdated");
    recommendations.push("Update to Safari 14+ for better speech recognition");
  }

  if (!browserInfo.features.microphone) {
    recommendations.push("Microphone access is not available");
    recommendations.push("Check browser permissions and hardware");
  }

  if (!browserInfo.features.localStorage) {
    recommendations.push("Local storage is not available");
    recommendations.push("Session data cannot be saved locally");
  }

  return recommendations;
};

export const isHTTPSRequired = (): boolean => {
  return (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  );
};

export const getCompatibilityMessage = (browserInfo: BrowserInfo): string => {
  if (browserInfo.isSupported) {
    return `✅ ${browserInfo.name} ${browserInfo.version} is fully supported!`;
  }

  let message = `⚠️ ${browserInfo.name} ${browserInfo.version} has limited support.\n\n`;

  if (!browserInfo.features.speechRecognition) {
    message += "❌ Speech recognition not supported\n";
  }

  if (!browserInfo.features.microphone) {
    message += "❌ Microphone access not available\n";
  }

  if (!browserInfo.features.localStorage) {
    message += "❌ Local storage not available\n";
  }

  message += "\nAlternative options:\n";
  browserInfo.fallbackOptions.forEach((option) => {
    message += `• ${option}\n`;
  });

  return message;
};
