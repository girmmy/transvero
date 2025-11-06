// Hybrid Speech Recognition Service
// Tries external API first, falls back to browser Web Speech API
import { SpeechRecognitionAPIService } from "./speechRecognitionAPI";
import { SpeechRecognitionService } from "./speechRecognition";

export class HybridSpeechRecognitionService {
  private apiService: SpeechRecognitionAPIService;
  private browserService: SpeechRecognitionService;
  private currentService: SpeechRecognitionAPIService | SpeechRecognitionService | null = null;
  private useAPI: boolean = false;

  private apiFailed: boolean = false;

  constructor() {
    this.apiService = new SpeechRecognitionAPIService();
    this.browserService = new SpeechRecognitionService();
    
    // Prefer API if configured, otherwise use browser
    this.useAPI = this.apiService.isConfigured() && !this.apiFailed;
  }

  public isBrowserSupported(): boolean {
    if (this.useAPI) {
      return this.apiService.isBrowserSupported();
    }
    return this.browserService.isBrowserSupported();
  }

  public setLanguage(language: string): void {
    if (this.useAPI) {
      this.apiService.setLanguage(language);
    } else {
      this.browserService.setLanguage(language);
    }
  }

  public async startRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.useAPI && !this.apiFailed) {
      this.currentService = this.apiService;
      
      // Create a wrapper error handler that falls back to browser API
      const wrappedError = (error: string) => {
        // Check if it's a network/fetch error that might be blocked by Brave
        if (error.includes("Network error") || error.includes("Failed to fetch") || error.includes("fetch")) {
          console.warn("AssemblyAI API blocked, falling back to browser Web Speech API");
          this.apiFailed = true;
          this.useAPI = false;
          
          // Try browser API instead
          if (this.browserService.isBrowserSupported()) {
            this.currentService = this.browserService;
            this.browserService.startRecognition(onResult, onError, onStart, onEnd);
          } else {
            onError(
              "AssemblyAI API is blocked by browser privacy settings and browser Web Speech API is not available.\n\n" +
              "For Brave users:\n" +
              "1. Click Brave Shield icon and disable shields for this site\n" +
              "2. Or use Manual Input mode instead"
            );
          }
        } else {
          // Pass through other errors
          onError(error);
        }
      };
      
      try {
        await this.apiService.startRecognition(onResult, wrappedError, onStart, onEnd);
      } catch (error: any) {
        // If API fails immediately, fall back
        if (error.message?.includes("fetch") || error.message?.includes("Network")) {
          this.apiFailed = true;
          this.useAPI = false;
          if (this.browserService.isBrowserSupported()) {
            this.currentService = this.browserService;
            this.browserService.startRecognition(onResult, onError, onStart, onEnd);
          } else {
            onError(
              "Unable to connect to speech recognition service. Please disable browser privacy shields or use Manual Input."
            );
          }
        } else {
          onError(error.message || "Failed to start speech recognition");
        }
      }
    } else {
      this.currentService = this.browserService;
      this.browserService.startRecognition(onResult, onError, onStart, onEnd);
    }
  }

  public stopRecognition(): void {
    if (this.currentService === this.apiService) {
      this.apiService.stopRecognition();
    } else if (this.currentService === this.browserService) {
      this.browserService.stopRecognition();
    }
  }

  public abortRecognition(): void {
    if (this.currentService === this.apiService) {
      this.apiService.stopRecognition();
    } else if (this.currentService === this.browserService) {
      this.browserService.abortRecognition();
    }
  }

  public getActiveService(): "api" | "browser" {
    return (this.useAPI && !this.apiFailed) ? "api" : "browser";
  }
  
  public resetFallback(): void {
    this.apiFailed = false;
    this.useAPI = this.apiService.isConfigured();
  }

  public getBrowserInfo(): { name: string; support: boolean } {
    if (this.useAPI) {
      return { name: "All Browsers (API)", support: this.apiService.isBrowserSupported() };
    }
    return this.browserService.getBrowserInfo();
  }

  public getFallbackMessage(): string {
    if (this.useAPI) {
      if (!this.apiService.isConfigured()) {
        return "Speech recognition API not configured. Please set REACT_APP_ASSEMBLYAI_API_KEY in your environment variables.";
      }
      if (!this.apiService.isBrowserSupported()) {
        return "Your browser doesn't support the required features for speech recognition. Please use a modern browser.";
      }
      return "Speech recognition is available via external API.";
    }
    return this.browserService.getFallbackMessage();
  }
}

export const hybridSpeechRecognitionService = new HybridSpeechRecognitionService();

