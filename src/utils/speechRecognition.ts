// Web Speech API wrapper with enhanced browser compatibility
import { SpeechRecognition } from "../types";

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private browserSupport: {
    chrome: boolean;
    edge: boolean;
    safari: boolean;
    firefox: boolean;
    opera: boolean;
  } = {
    chrome: false,
    edge: false,
    safari: false,
    firefox: false,
    opera: false,
  };

  constructor() {
    this.initializeRecognition();
    this.detectBrowserSupport();
  }

  private improveTranscription(text: string): string {
    if (!text) return text;

    // Basic grammar improvements
    let improved = text
      // Fix common speech recognition errors
      .replace(/\b(um|uh|er|ah)\b/gi, "") // Remove filler words
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Capitalize first letter of sentences
    improved = improved.replace(
      /(^|[.!?]\s+)([a-z])/g,
      (match, prefix, letter) => {
        return prefix + letter.toUpperCase();
      }
    );

    // Fix common contractions
    const contractions: { [key: string]: string } = {
      "do not": "don't",
      "does not": "doesn't",
      "did not": "didn't",
      "will not": "won't",
      "would not": "wouldn't",
      "could not": "couldn't",
      "should not": "shouldn't",
      cannot: "can't",
      "is not": "isn't",
      "are not": "aren't",
      "was not": "wasn't",
      "were not": "weren't",
      "have not": "haven't",
      "has not": "hasn't",
      "had not": "hadn't",
      "i am": "I'm",
      "you are": "you're",
      "he is": "he's",
      "she is": "she's",
      "it is": "it's",
      "we are": "we're",
      "they are": "they're",
      "i will": "I'll",
      "you will": "you'll",
      "he will": "he'll",
      "she will": "she'll",
      "it will": "it'll",
      "we will": "we'll",
      "they will": "they'll",
      "i have": "I've",
      "you have": "you've",
      "we have": "we've",
      "they have": "they've",
      "i would": "I'd",
      "you would": "you'd",
      "he would": "he'd",
      "she would": "she'd",
      "it would": "it'd",
      "we would": "we'd",
      "they would": "they'd",
    };

    // Apply contractions
    Object.entries(contractions).forEach(([full, contracted]) => {
      const regex = new RegExp(`\\b${full}\\b`, "gi");
      improved = improved.replace(regex, contracted);
    });

    // Add periods at the end if missing
    if (improved && !improved.match(/[.!?]$/)) {
      improved += ".";
    }

    return improved;
  }

  private detectBrowserSupport(): void {
    const userAgent = navigator.userAgent;
    this.browserSupport = {
      chrome:
        /Chrome/.test(userAgent) &&
        !/Edge/.test(userAgent) &&
        !/Brave/.test(userAgent),
      edge: /Edge/.test(userAgent),
      safari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      firefox: /Firefox/.test(userAgent),
      opera: /Opera/.test(userAgent) || /OPR/.test(userAgent),
    };
  }

  private initializeRecognition(): void {
    // Try different speech recognition implementations
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.isSupported = true;
        this.setupRecognition();
      } catch (error) {
        console.warn("Failed to initialize speech recognition:", error);
        this.isSupported = false;
      }
    } else {
      this.isSupported = false;
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 3; // Get more alternatives for better accuracy
  }

  public isBrowserSupported(): boolean {
    return this.isSupported;
  }

  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public startRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.recognition || !this.isSupported) {
      onError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    // Check microphone permissions first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          this.startRecognitionInternal(onResult, onError, onStart, onEnd);
        })
        .catch((error) => {
          console.error("Microphone access error:", error);
          if (error.name === "NotAllowedError") {
            onError(
              "Microphone access denied. Please allow microphone permissions and refresh the page."
            );
          } else if (error.name === "NotFoundError") {
            onError(
              "No microphone found. Please connect a microphone and try again."
            );
          } else if (error.name === "NotReadableError") {
            onError(
              "Microphone is being used by another application. Please close other apps using the microphone."
            );
          } else {
            onError(
              `Microphone error: ${error.message}. Please check your microphone settings.`
            );
          }
        });
    } else {
      // Fallback for older browsers
      this.startRecognitionInternal(onResult, onError, onStart, onEnd);
    }
  }

  private startRecognitionInternal(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log("Speech recognition started successfully");
      onStart?.();
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      onEnd?.();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Use the best alternative (highest confidence)
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          // Only use high-confidence results for final transcript
          if (confidence > 0.7) {
            finalTranscript += transcript;
          }
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const improvedTranscript = this.improveTranscription(finalTranscript);
        onResult(improvedTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error, event.message);
      let errorMessage = "Speech recognition error occurred";

      switch (event.error) {
        case "no-speech":
          errorMessage =
            "No speech detected. Please speak clearly into your microphone.";
          break;
        case "audio-capture":
          errorMessage =
            "No microphone found. Please check that your microphone is connected and working.";
          break;
        case "not-allowed":
          errorMessage =
            "Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.";
          break;
        case "network":
          const browserInfo = this.getBrowserInfo();
          if (browserInfo.name === "Brave") {
            errorMessage =
              "Network error in Brave browser. This is likely due to Brave's privacy settings.\n\nTo fix this:\n• Click the Brave Shield icon (lion icon) in the address bar\n• Toggle 'Shields down' for this site\n• Refresh the page and try again\n• Or go to brave://settings/privacy and allow microphone access\n\nYou can also use manual text input as an alternative.";
          } else {
            errorMessage =
              "Network error occurred. This might be due to:\n• Poor internet connection\n• Firewall blocking speech recognition\n• Browser security settings\n\nPlease check your internet connection and try again.";
          }
          break;
        case "aborted":
          errorMessage =
            "Speech recognition was stopped. This usually happens when:\n• The microphone is disconnected\n• Another app is using the microphone\n• The browser tab lost focus\n\nPlease check your microphone and try again.";
          break;
        case "language-not-supported":
          errorMessage =
            "Selected language is not supported by your browser. Please try a different language.";
          break;
        case "service-not-allowed":
          errorMessage =
            "Speech recognition service is not allowed. Please check your browser's privacy settings.";
          break;
        case "bad-grammar":
          errorMessage = "Speech recognition grammar error. Please try again.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}\n\nThis might be due to:\n• Browser compatibility issues\n• Microphone hardware problems\n• Network connectivity issues\n\nPlease try refreshing the page or using a different browser.`;
      }

      onError(errorMessage);
    };

    try {
      console.log("Starting speech recognition...");
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      onError(
        "Failed to start speech recognition. Please ensure your microphone is working and try again."
      );
    }
  }

  public stopRecognition(): void {
    if (this.recognition && this.isSupported) {
      this.recognition.stop();
    }
  }

  public abortRecognition(): void {
    if (this.recognition && this.isSupported) {
      this.recognition.abort();
    }
  }

  public getBrowserInfo(): { name: string; support: boolean } {
    const userAgent = navigator.userAgent;
    const isBrave = /Brave/.test(userAgent) || (window as any).brave;

    if (isBrave) {
      return { name: "Brave", support: true };
    } else if (this.browserSupport.chrome) {
      return { name: "Chrome", support: true };
    } else if (this.browserSupport.edge) {
      return { name: "Edge", support: true };
    } else if (this.browserSupport.safari) {
      return { name: "Safari", support: true };
    } else if (this.browserSupport.firefox) {
      return { name: "Firefox", support: false };
    } else if (this.browserSupport.opera) {
      return { name: "Opera", support: false };
    } else {
      return { name: "Unknown", support: false };
    }
  }

  public getFallbackMessage(): string {
    const browserInfo = this.getBrowserInfo();

    if (browserInfo.support) {
      return "Speech recognition is supported in your browser!";
    }

    let message = `Speech recognition is not supported in ${browserInfo.name}.\n\n`;

    if (browserInfo.name === "Brave") {
      message +=
        "Brave has strict privacy settings that may block speech recognition.\n\n";
      message += "To fix this, try:\n";
      message +=
        "• Click the Brave Shield icon and disable shields for this site\n";
      message +=
        "• Go to brave://settings/privacy and allow microphone access\n";
      message += "• Check that microphone permissions are enabled\n";
      message += "• Try refreshing the page after changing settings\n\n";
      message += "You can also use manual text input as an alternative.";
    } else if (browserInfo.name === "Firefox") {
      message += "Firefox doesn't support the Web Speech API.\n";
      message += "You can still use manual text input features.\n\n";
      message += "For full speech recognition, try:\n";
      message += "• Google Chrome (recommended)\n";
      message += "• Microsoft Edge\n";
      message += "• Safari (macOS)\n";
    } else {
      message += "For the best experience, please use:\n";
      message += "• Google Chrome (recommended)\n";
      message += "• Microsoft Edge\n";
      message += "• Safari (macOS)\n\n";
      message += "You can still use manual text input as an alternative.";
    }

    return message;
  }

  public getSupportedLanguages(): string[] {
    // Different browsers support different languages
    const baseLanguages = [
      "en-US",
      "en-GB",
      "es-ES",
      "es-MX",
      "fr-FR",
      "de-DE",
      "it-IT",
      "pt-BR",
      "ja-JP",
      "ko-KR",
      "zh-CN",
      "ru-RU",
    ];

    // Chrome/Edge support more languages
    if (this.browserSupport.chrome || this.browserSupport.edge) {
      return [
        ...baseLanguages,
        "en-AU",
        "en-CA",
        "es-AR",
        "fr-CA",
        "pt-PT",
        "zh-TW",
        "ar-SA",
        "hi-IN",
        "nl-NL",
        "sv-SE",
        "no-NO",
        "da-DK",
        "fi-FI",
      ];
    }

    // Safari has limited language support
    if (this.browserSupport.safari) {
      return [
        "en-US",
        "en-GB",
        "es-ES",
        "fr-FR",
        "de-DE",
        "it-IT",
        "ja-JP",
        "ko-KR",
        "zh-CN",
      ];
    }

    return baseLanguages;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
