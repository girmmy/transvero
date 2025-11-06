import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as https from "https";

admin.initializeApp();

// Proxy endpoint for AssemblyAI token generation
// This allows the API key to stay secure on the server
export const getAssemblyAIToken = functions.https.onCall(async (data, context) => {
  // Optional: Add authentication check
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  // }

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

