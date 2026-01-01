// External Speech Recognition API Service
// Uses AssemblyAI for real-time transcription (works in all browsers including Brave)

export class SpeechRecognitionAPIService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private socket: WebSocket | null = null;
  private isRecording: boolean = false;
  private sessionId: string | null = null;
  private apiKey: string;
  private language: string = "en";
  private isProcessing: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(apiKey?: string) {
    // Get API key from environment or use provided one
    // Note: API key not required if using Firebase Functions proxy
    this.apiKey = apiKey || process.env.REACT_APP_ASSEMBLYAI_API_KEY || "";

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Speech Recognition API Service initialized");
      console.log("Will try Firebase Functions proxy first, then direct API if needed");
    }
  }

  public isConfigured(): boolean {
    // Always return true - we'll try Firebase Functions first, then direct API
    // This allows the service to work with or without client-side API key
    return true;
  }

  public setLanguage(language: string): void {
    // Map language codes to AssemblyAI language codes
    const languageMap: { [key: string]: string } = {
      "en-US": "en",
      "en-GB": "en",
      "es-ES": "es",
      "es-MX": "es",
      "fr-FR": "fr",
      "de-DE": "de",
      "it-IT": "it",
      "pt-BR": "pt",
      "ja-JP": "ja",
      "ko-KR": "ko",
      "zh-CN": "zh",
      "ru-RU": "ru",
      "ar-SA": "ar",
      "hi-IN": "hi",
      "nl-NL": "nl",
      "vi-VN": "vi",
    };
    this.language = languageMap[language] || "en";
  }

  public async startRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    // No need to check configuration - we'll try Firebase Functions first

    if (this.isRecording) {
      onError("Recording is already in progress.");
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });

      // Create audio source
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.isRecording && this.socket?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16Array = this.convertFloat32ToInt16(inputData);
          this.socket.send(int16Array.buffer);
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      // Get temporary token from AssemblyAI via Firebase Functions proxy
      // This avoids CORS and privacy shield issues
      let tokenData;
      try {
        // Try using Firebase Functions proxy first (works in all browsers)
        const { getFunctions, httpsCallable } = await import("firebase/functions");
        const functions = getFunctions();
        const getToken = httpsCallable(functions, "getAssemblyAIToken");

        const result = await getToken({ expires_in: 3600 });
        tokenData = result.data as { token: string };
      } catch (proxyError: any) {
        console.warn("Firebase Functions proxy not available, trying direct API:", proxyError);

        // Fallback to direct API call (may be blocked by Brave)
        try {
          const tokenResponse = await fetch("https://api.assemblyai.com/v2/realtime/token", {
            method: "POST",
            headers: {
              authorization: this.apiKey.trim(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              expires_in: 3600,
            }),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`API error (${tokenResponse.status}): ${errorText}`);
          }

          tokenData = await tokenResponse.json();
        } catch (fetchError: any) {
          console.error("Fetch error:", fetchError);
          // If we don't have an API key for fallback, give helpful error
          if (!this.apiKey) {
            throw new Error(
              "Unable to connect to speech recognition service.\n\n" +
              "Please ensure:\n" +
              "1. Firebase Functions are deployed (see FIREBASE_FUNCTIONS_SETUP.md)\n" +
              "2. Or set REACT_APP_ASSEMBLYAI_API_KEY in .env file\n" +
              "3. Or disable browser privacy shields for this site"
            );
          }
          throw new Error(
            `Network error connecting to AssemblyAI. Please ensure Firebase Functions are deployed or disable browser privacy shields. Error: ${fetchError.message}`
          );
        }
      }

      if (!tokenData || !tokenData.token) {
        throw new Error("No token received from AssemblyAI API");
      }
      const { token } = tokenData;

      // Connect to AssemblyAI WebSocket
      const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}&language_code=${this.language}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isRecording = true;
        onStart?.();
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.message_type === "SessionBegins") {
          this.sessionId = data.session_id;
        } else if (data.message_type === "PartialTranscript") {
          if (this.onResultCallback) {
            this.onResultCallback(data.text, false);
          }
        } else if (data.message_type === "FinalTranscript") {
          if (this.onResultCallback) {
            this.onResultCallback(data.text, true);
          }
        } else if (data.message_type === "SessionTerminated") {
          this.isRecording = false;
          onEnd?.();
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        const isBrave = !!(window as any).brave || /Brave/.test(navigator.userAgent);
        if (this.onErrorCallback) {
          if (isBrave) {
            this.onErrorCallback(
              "WebSocket connection error in Brave.\n\n" +
              "If Brave Shields are blocking the connection:\n" +
              "1. Click the Brave Shield icon and disable shields for this site\n" +
              "2. Go to brave://settings/privacy\n" +
              "3. Disable 'Block cross-site trackers' temporarily\n" +
              "4. Refresh and try again\n\n" +
              "Alternatively, check your internet connection and API key."
            );
          } else {
            this.onErrorCallback(
              "Connection error. Please check your internet connection and API key."
            );
          }
        }
        this.stopRecognition();
      };

      this.socket.onclose = () => {
        this.isRecording = false;
        onEnd?.();
      };
    } catch (error: any) {
      console.error("Error starting speech recognition:", error);
      const isBrave = !!(window as any).brave || /Brave/.test(navigator.userAgent);

      if (this.onErrorCallback) {
        if (error.name === "NotAllowedError") {
          this.onErrorCallback(
            "Microphone access denied. Please allow microphone permissions and try again."
          );
        } else if (error.name === "NotFoundError") {
          this.onErrorCallback(
            "No microphone found. Please connect a microphone and try again."
          );
        } else if (error.message?.includes("Network error") || error.message?.includes("fetch")) {
          if (isBrave) {
            this.onErrorCallback(
              "Network error in Brave: Unable to connect to AssemblyAI API.\n\n" +
              "This is likely due to Brave's privacy settings blocking the API connection.\n\n" +
              "To fix:\n" +
              "1. Click the Brave Shield icon (lion) in the address bar\n" +
              "2. Toggle 'Shields down' for this site\n" +
              "3. Go to brave://settings/privacy\n" +
              "4. Temporarily disable 'Block cross-site trackers'\n" +
              "5. Refresh the page and try again\n\n" +
              "Error details: " + (error.message || "Unknown network error")
            );
          } else {
            this.onErrorCallback(
              `Network error: ${error.message || "Unable to connect to AssemblyAI API. Please check your internet connection."}`
            );
          }
        } else if (error.message?.includes("Invalid API key") || error.message?.includes("401")) {
          this.onErrorCallback(
            "Invalid AssemblyAI API key.\n\n" +
            "Please check:\n" +
            "1. Your .env file contains REACT_APP_ASSEMBLYAI_API_KEY\n" +
            "2. The API key is correct (no extra spaces or quotes)\n" +
            "3. You've restarted the development server after adding the key\n" +
            "4. Your AssemblyAI account is active"
          );
        } else {
          this.onErrorCallback(
            `Error: ${error.message || "Failed to start speech recognition"}\n\n` +
            (isBrave ? "If this persists, try disabling Brave Shields for this site." : "")
          );
        }
      }
      this.cleanup();
    }
  }

  public stopRecognition(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ terminate_session: true }));
      this.socket.close();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const int16Array = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  public isBrowserSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      (window.AudioContext || (window as any).webkitAudioContext) &&
      typeof WebSocket !== "undefined"
    );
  }

  public async uploadAudio(audioBlob: Blob): Promise<string> {
    try {
      // Validate blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("Audio blob is empty or invalid");
      }

      // Check blob size (Firebase Functions has 10MB limit for callable functions)
      // For larger files, we'll use direct upload
      const firebaseFunctionsMaxSize = 9 * 1024 * 1024; // 9MB (slightly under 10MB limit)
      const assemblyAIMaxSize = 200 * 1024 * 1024; // 200MB
      
      if (audioBlob.size > assemblyAIMaxSize) {
        throw new Error(`Audio file is too large (${(audioBlob.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 200MB.`);
      }

      const useDirectUpload = audioBlob.size > firebaseFunctionsMaxSize;

      // Try Firebase Functions proxy first (more reliable, especially on mobile) if file is small enough
      if (!useDirectUpload) {
        try {
          const { getFunctions, httpsCallable } = await import("firebase/functions");
          const functions = getFunctions();
          const uploadAudioProxy = httpsCallable(functions, "uploadAudioToAssemblyAI");

          // Convert blob to base64 for Firebase Functions
          const base64Audio = await this.blobToBase64(audioBlob);
          const mimeType = audioBlob.type || "audio/wav";

          const result = await uploadAudioProxy({
            audioData: base64Audio,
            mimeType: mimeType,
          });

          const data = result.data as { upload_url: string };
          if (!data.upload_url) {
            throw new Error("No upload URL returned from proxy");
          }

          return data.upload_url;
        } catch (proxyError: any) {
          console.warn("Firebase Functions proxy failed, trying direct upload:", proxyError);
          // Fall through to direct upload
        }
      }

      // Direct upload (for large files or if proxy fails)
      if (!this.apiKey || this.apiKey.trim() === "") {
        throw new Error(
          "Unable to upload audio.\n\n" +
          "Please ensure:\n" +
          "1. Firebase Functions are deployed with uploadAudioToAssemblyAI function (for files < 10MB)\n" +
          "2. Or set REACT_APP_ASSEMBLYAI_API_KEY in .env file\n" +
          "3. Check your network connection"
        );
      }

      const response = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          authorization: this.apiKey.trim(),
          "Content-Type": audioBlob.type || "application/octet-stream",
        },
        body: audioBlob,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Upload failed (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.error || errorText}`;
        } catch {
          errorMessage += `: ${errorText || response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.upload_url) {
        throw new Error("No upload URL in response from AssemblyAI");
      }

      return data.upload_url;
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      
      // Provide more helpful error messages
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error("Network error uploading audio. Please check your internet connection and try again.");
      } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Authentication failed. Please check your AssemblyAI API key configuration.");
      } else if (error.message.includes("413") || error.message.includes("too large")) {
        throw new Error(`Audio file is too large. Please record a shorter session or use a lower quality setting.`);
      }
      
      throw new Error(`Failed to upload audio: ${error.message}`);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          // Remove data URL prefix (e.g., "data:audio/wav;base64,")
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public async transcribeWithDiarization(
    audioUrl: string,
    speakerCount: number = 2
  ): Promise<string> {
    try {
      this.isProcessing = true;

      // 1. Submit transcription job
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: this.apiKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: true,
          speakers_expected: speakerCount,
          language_code: this.language,
          punctuate: true,
          format_text: true,
          dual_channel: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Transcription request failed: ${response.statusText}`);
      }

      const { id } = await response.json();

      // 2. Poll for completion
      while (true) {
        const statusResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${id}`,
          {
            headers: {
              authorization: this.apiKey.trim(),
            },
          }
        );

        const statusData = await statusResponse.json();

        if (statusData.status === "completed") {
          // 3. Format result with speaker labels
          if (!statusData.utterances) {
            return statusData.text;
          }

          const getSpeakerLabel = (speaker: any) => {
            if (speaker === null || speaker === undefined) return "Unknown";
            const num = parseInt(speaker);
            if (isNaN(num)) return speaker.toString();

            // AssemblyAI uses 0-based speaker indexing (0, 1, 2, ...)
            // Map to alphabetical labels: 0→A, 1→B, 2→C, etc.
            return String.fromCharCode(65 + (num % 26));
          };

          return statusData.utterances
            .map((u: any) => `[Speaker ${getSpeakerLabel(u.speaker)}] ${u.text}`)
            .join("\n");
        } else if (statusData.status === "error") {
          throw new Error(`Transcription error: ${statusData.error}`);
        }

        // Wait 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error("Error in diarized transcription:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

// Export singleton instance
export const speechRecognitionAPIService = new SpeechRecognitionAPIService();

