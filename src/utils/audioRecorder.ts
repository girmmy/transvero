// Mobile-compatible Audio Recorder
// Uses MediaRecorder when available, falls back to Web Audio API for mobile

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  private audioChunks: Blob[] = [];
  private audioBuffer: Float32Array[] = [];
  private isRecording: boolean = false;
  private useWebAudio: boolean = false;
  private mimeType: string = "audio/webm";
  private sampleRate: number = 44100;

  async startRecording(): Promise<void> {
    try {
      // Get media stream with mobile-friendly constraints
      // On mobile, we should be more flexible with constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Don't force sampleRate on mobile - let the device choose
          // sampleRate: 44100, // Commented out for better mobile compatibility
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Try MediaRecorder first (desktop browsers)
      if (typeof MediaRecorder !== "undefined") {
        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/aac",
          "audio/ogg;codecs=opus",
        ];

        let supportedMimeType = "";
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            supportedMimeType = type;
            break;
          }
        }

        try {
          const options: MediaRecorderOptions = supportedMimeType
            ? { mimeType: supportedMimeType, audioBitsPerSecond: 128000 }
            : { audioBitsPerSecond: 128000 };

          this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
          this.mimeType = this.mediaRecorder.mimeType || supportedMimeType || "audio/webm";
          this.audioChunks = [];

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.start(1000);
          this.useWebAudio = false;
          this.isRecording = true;
          return;
        } catch (err) {
          console.warn("MediaRecorder failed, falling back to Web Audio API:", err);
          // Fall through to Web Audio API
        }
      }

      // Fallback to Web Audio API (mobile browsers)
      this.useWebAudio = true;
      await this.startWebAudioRecording();
    } catch (error: any) {
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  private async startWebAudioRecording(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("Media stream not available");
    }

    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API not supported");
    }

    try {
      this.audioContext = new AudioContextClass({
        sampleRate: 44100,
      });

      // Resume AudioContext if suspended (required on mobile/iOS)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.sampleRate = this.audioContext.sampleRate;
      this.audioBuffer = [];

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    } catch (err: any) {
      throw new Error(`Failed to initialize AudioContext: ${err.message}`);
    }

    // Use ScriptProcessorNode (widely supported on mobile, including iOS)
    // Buffer size: 4096 is a good balance for mobile devices
    // Smaller buffers (2048) work better on some devices but use more CPU
    const bufferSize = 4096;
    
    try {
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isRecording && this.audioContext && this.audioContext.state === "running") {
          try {
            const inputData = e.inputBuffer.getChannelData(0);
            // Copy the Float32Array to avoid reference issues
            this.audioBuffer.push(new Float32Array(inputData));
          } catch (err) {
            console.warn("Error processing audio:", err);
          }
        }
      };

      // Connect nodes
      if (this.sourceNode) {
        this.sourceNode.connect(this.scriptProcessor);
        // Connect to destination to keep the audio processing active
        // On mobile, we need to connect to destination to prevent audio from being suspended
        this.scriptProcessor.connect(this.audioContext.destination);
      }
      
      this.isRecording = true;
    } catch (err: any) {
      throw new Error(`Failed to create ScriptProcessorNode: ${err.message}`);
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) {
        reject(new Error("Not currently recording"));
        return;
      }

      this.isRecording = false;

      if (this.useWebAudio && this.audioContext) {
        // Stop Web Audio API recording
        try {
          if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
          }
          if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
          }

          // Small delay to ensure all audio data is captured
          // This is especially important on mobile devices
          setTimeout(() => {
            try {
              // Convert Float32Array buffers to WAV format
              if (this.audioBuffer.length === 0) {
                this.cleanup();
                reject(new Error("No audio data recorded. Please ensure your microphone is working."));
                return;
              }
              
              const wavBlob = this.convertToWAV(this.audioBuffer, this.sampleRate);
              
              // Validate the blob
              if (!wavBlob || wavBlob.size === 0) {
                this.cleanup();
                reject(new Error("Failed to create audio file. Please try again."));
                return;
              }
              
              this.cleanup();
              resolve(wavBlob);
            } catch (err: any) {
              this.cleanup();
              reject(new Error(`Failed to convert audio: ${err.message}`));
            }
          }, 150); // Slightly longer delay for mobile devices
        } catch (err: any) {
          this.cleanup();
          reject(new Error(`Failed to stop recording: ${err.message}`));
        }
      } else if (this.mediaRecorder) {
        // Stop MediaRecorder
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: this.mimeType });
          this.cleanup();
          resolve(blob);
        };

        this.mediaRecorder.onerror = (event: any) => {
          reject(new Error(`MediaRecorder error: ${event.error?.message || "Unknown error"}`));
        };

        this.mediaRecorder.stop();
      } else {
        reject(new Error("No recording method available"));
      }
    });
  }

  private convertToWAV(audioBuffers: Float32Array[], sampleRate: number): Blob {
    // Calculate total length
    let totalLength = 0;
    for (const buffer of audioBuffers) {
      totalLength += buffer.length;
    }

    // Ensure we have audio data
    if (totalLength === 0) {
      throw new Error("No audio data to convert");
    }

    // Create ArrayBuffer for WAV file
    const arrayBuffer = new ArrayBuffer(44 + totalLength * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + totalLength * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, 1, true); // number of channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, "data");
    view.setUint32(40, totalLength * 2, true);

    // Convert Float32Array to Int16Array and write to buffer
    let offset = 44;
    for (const buffer of audioBuffers) {
      for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  private cleanup(): void {
    try {
      // Disconnect nodes first
      if (this.scriptProcessor) {
        try {
          this.scriptProcessor.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        this.scriptProcessor = null;
      }
      
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        this.sourceNode = null;
      }

      // Stop media stream tracks
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            // Ignore stop errors
          }
        });
        this.mediaStream = null;
      }

      // Close audio context (but don't force close if recording might resume)
      if (this.audioContext && this.audioContext.state !== "closed") {
        this.audioContext.close().catch((err) => {
          console.warn("Error closing AudioContext:", err);
        });
        this.audioContext = null;
      }

      // Reset state
      this.mediaRecorder = null;
      this.audioWorkletNode = null;
      this.audioChunks = [];
      this.audioBuffer = [];
    } catch (err) {
      console.warn("Error during cleanup:", err);
    }
  }

  getMimeType(): string {
    return this.useWebAudio ? "audio/wav" : this.mimeType;
  }

  isUsingWebAudio(): boolean {
    return this.useWebAudio;
  }
}

