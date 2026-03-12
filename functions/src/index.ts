import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as https from "https";

admin.initializeApp();

// Proxy endpoint for AssemblyAI token generation
// This allows the API key to stay secure on the server
export const getAssemblyAIToken = functions.https.onCall(async (data, context) => {
  // Require authentication to prevent unauthorized usage
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use this service"
    );
  }

  // Use environment variable (recommended) or fall back to functions.config() for backward compatibility
  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY || functions.config().assemblyai?.key;
  
  if (!assemblyAIKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AssemblyAI API key not configured on server. Set ASSEMBLYAI_API_KEY environment variable."
    );
  }

  try {
    const requestData = JSON.stringify({
      expires_in: data.expires_in || 3600,
    });

    const options = {
      hostname: "api.assemblyai.com",
      path: "/v2/realtime/token",
      method: "POST",
      headers: {
        "Authorization": assemblyAIKey,
        "Content-Type": "application/json",
        "Content-Length": requestData.length,
      },
    };

    const tokenData = await new Promise<any>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = "";
        
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error: ${res.statusCode} - ${responseData}`));
            return;
          }
          
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(requestData);
      req.end();
    });

    return { token: tokenData.token };
  } catch (error: any) {
    console.error("Error getting AssemblyAI token:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to get AssemblyAI token"
    );
  }
});

// Proxy endpoint to submit a transcription job with speaker diarization
export const submitTranscriptionJob = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use this service"
    );
  }

  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY || functions.config().assemblyai?.key;
  if (!assemblyAIKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AssemblyAI API key not configured on server"
    );
  }

  const { audioUrl, speakerCount, language } = data;
  if (!audioUrl) {
    throw new functions.https.HttpsError("invalid-argument", "audioUrl is required");
  }

  const count = speakerCount || 2;
  const requestBody = JSON.stringify({
    audio_url: audioUrl,
    speech_models: ["best"],
    speaker_labels: true,
    speaker_options: {
      min_speakers_expected: count,
      max_speakers_expected: Math.min(count + 1, 10),
    },
    language_code: language || "en",
    punctuate: true,
    format_text: true,
  });

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.assemblyai.com",
          path: "/v2/transcript",
          method: "POST",
          headers: {
            Authorization: assemblyAIKey,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestBody),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => { body += chunk; });
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`Transcription request failed: ${res.statusCode} - ${body}`));
              return;
            }
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error("Invalid JSON response from AssemblyAI")); }
          });
        }
      );
      req.on("error", reject);
      req.write(requestBody);
      req.end();
    });

    if (!result.id) {
      throw new Error("No transcript ID returned from AssemblyAI");
    }
    return { id: result.id };
  } catch (error: any) {
    console.error("Error submitting transcription job:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to submit transcription job");
  }
});

// Proxy endpoint to check transcription job status
export const getTranscriptionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use this service"
    );
  }

  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY || functions.config().assemblyai?.key;
  if (!assemblyAIKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AssemblyAI API key not configured on server"
    );
  }

  const { transcriptId } = data;
  if (!transcriptId) {
    throw new functions.https.HttpsError("invalid-argument", "transcriptId is required");
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.assemblyai.com",
          path: `/v2/transcript/${transcriptId}`,
          method: "GET",
          headers: {
            Authorization: assemblyAIKey,
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => { body += chunk; });
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`Status check failed: ${res.statusCode} - ${body}`));
              return;
            }
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error("Invalid JSON response from AssemblyAI")); }
          });
        }
      );
      req.on("error", reject);
      req.end();
    });

    return {
      status: result.status,
      text: result.text || null,
      utterances: result.utterances || null,
      error: result.error || null,
    };
  } catch (error: any) {
    console.error("Error checking transcription status:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to check transcription status");
  }
});

// Proxy endpoint for AssemblyAI audio upload
// This allows secure uploads without exposing API key to client
export const uploadAudioToAssemblyAI = functions.https.onCall(async (data, context) => {
  // Require authentication to prevent unauthorized usage
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to upload audio"
    );
  }
  
  // Validate input size (prevent abuse)
  if (!data.audioData || typeof data.audioData !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid audio data provided"
    );
  }
  
  // Check size (base64 is ~33% larger than binary)
  const estimatedSize = (data.audioData.length * 3) / 4;
  const maxSize = 10 * 1024 * 1024; // 10MB limit for Firebase Functions
  if (estimatedSize > maxSize) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Audio file too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    );
  }

  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY || functions.config().assemblyai?.key;
  
  if (!assemblyAIKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AssemblyAI API key not configured on server. Set ASSEMBLYAI_API_KEY environment variable."
    );
  }

  try {
    // Decode base64 audio data
    const audioBuffer = Buffer.from(data.audioData, "base64");
    const mimeType = data.mimeType || "audio/wav";

    const options = {
      hostname: "api.assemblyai.com",
      path: "/v2/upload",
      method: "POST",
      headers: {
        "Authorization": assemblyAIKey,
        "Content-Type": mimeType,
        "Content-Length": audioBuffer.length,
      },
    };

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = "";
        
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Upload failed: ${res.statusCode} - ${responseData}`));
            return;
          }
          
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            reject(new Error("Invalid JSON response from upload"));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(audioBuffer);
      req.end();
    });

    return { upload_url: uploadResult.upload_url };
  } catch (error: any) {
    console.error("Error uploading audio to AssemblyAI:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to upload audio"
    );
  }
});

