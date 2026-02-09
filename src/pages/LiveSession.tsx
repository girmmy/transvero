// Live Session Page Component
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { saveTranscript, getTranscriptById, appendToTranscript } from "../services/firestoreService";
import {
  exportTranscriptToPDF,
  generateTranscriptTitle,
} from "../utils/pdfExporter";
import { exportTranscriptToBRF } from "../utils/brfExporter";
import { speechRecognitionService } from "../utils/speechRecognition";
import RecorderControls from "../components/RecorderControls";
import LiveTextDisplay from "../components/LiveTextDisplay";
import LanguageSelector from "../components/LanguageSelector";
import LoadingSpinner from "../components/LoadingSpinner";
import ManualTextInput from "../components/ManualTextInput";
import BrowserCompatibility from "../components/BrowserCompatibility";
import ConfirmDialog from "../components/ConfirmDialog";
import { detectBrowser, BrowserInfo } from "../utils/browserDetection";
import {
  FiSave,
  FiDownload,
  FiArrowLeft,
  FiAlertCircle,
  FiMic,
  FiType,
  FiPlus,
  FiChevronDown,
  FiInfo,
  FiPlay,
} from "react-icons/fi";

const LiveSession: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState("");
  const [isMultispeakerEnabled, setIsMultispeakerEnabled] = useState(false);
  const [speakerCount, setSpeakerCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // Browser compatibility state
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);

  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Session state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [continuingTranscriptId, setContinuingTranscriptId] = useState<string | null>(null);
  const [originalTranscriptContent, setOriginalTranscriptContent] = useState("");

  // Refs
  const recognitionRef = useRef<any>(null);
  const sessionContentRef = useRef<string[]>([]);
  const audioRecorderRef = useRef<any>(null);

  useEffect(() => {
    // Detect browser compatibility
    const detectedBrowser = detectBrowser();
    setBrowserInfo(detectedBrowser);

    // Check browser support
    if (!speechRecognitionService.isBrowserSupported()) {
      setIsSupported(false);
      setError("");
      setShowCompatibilityInfo(true);
      return;
    }

    // Check if we're on HTTPS (required for microphone access)
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setIsSupported(false);
      setError(
        "Speech recognition requires a secure connection (HTTPS).\n\nPlease access this site using HTTPS or try running it locally."
      );
      return;
    }

    // Set up speech recognition
    recognitionRef.current = speechRecognitionService;
    recognitionRef.current.setLanguage(language);

    return () => {
      if (isRecording) {
        recognitionRef.current?.stopRecognition();
      }
    };
  }, [language, isRecording]);

  useEffect(() => {
    // Auto-save to localStorage with timestamp
    if (transcript) {
      localStorage.setItem(
        "transvero-session",
        JSON.stringify({
          transcript,
          sessionStartTime: sessionStartTime?.toISOString(),
          language,
          savedAt: new Date().toISOString(), // Add timestamp for session freshness check
        })
      );
    }
  }, [transcript, sessionStartTime, language]);

  useEffect(() => {
    // Track unsaved changes
    setHasUnsavedChanges(transcript.length > 0);
  }, [transcript]);

  useEffect(() => {
    // Add beforeunload event listener for page refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNavigationWithConfirm = (navigationFn: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowConfirmDialog(true);
    } else {
      navigationFn();
    }
  };

  const handleConfirmNavigation = () => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  useEffect(() => {
    // Check if we should start a fresh session (e.g., from URL parameter or coming from Dashboard)
    const urlParams = new URLSearchParams(location.search);
    const startNew = urlParams.get("new") === "true";
    const continueId = urlParams.get("continue");

    // If explicitly starting new, clear any saved session
    if (startNew) {
      localStorage.removeItem("transvero-session");
      sessionStorage.removeItem("transvero-loaded");
      setContinuingTranscriptId(null);
      setOriginalTranscriptContent("");
      return;
    }

    // Load existing transcript if continuing
    if (continueId && user && !continuingTranscriptId) {
      const loadExistingTranscript = async () => {
        try {
          const existingTranscript = await getTranscriptById(user.uid, continueId);
          if (existingTranscript) {
            setContinuingTranscriptId(continueId);
            setOriginalTranscriptContent(existingTranscript.content);
            setTranscript(existingTranscript.content);
            setLanguage(existingTranscript.language || "en-US");
            // Set session start time to original transcript's timestamp
            if (existingTranscript.timestamp) {
              setSessionStartTime(new Date(existingTranscript.timestamp));
            }
            localStorage.removeItem("transvero-session");
            sessionStorage.setItem("transvero-loaded", "true");
          }
        } catch (error) {
          console.error("Error loading transcript to continue:", error);
          setError("Failed to load transcript. Starting new session.");
        }
      };
      loadExistingTranscript();
      return;
    }

    // Load previous session from localStorage only on first load
    // Only restore if session is recent (within 1 hour) to prevent old sessions from reappearing
    const savedSession = localStorage.getItem("transvero-session");
    const hasLoadedBefore = sessionStorage.getItem("transvero-loaded");

    if (savedSession && !transcript && !sessionStartTime && !hasLoadedBefore) {
      try {
        const session = JSON.parse(savedSession);

        // Check if session is recent (within 1 hour)
        const SESSION_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
        const now = new Date().getTime();
        const savedAt = session.savedAt ? new Date(session.savedAt).getTime() : 0;
        const isRecent = savedAt && (now - savedAt) < SESSION_MAX_AGE;

        // Only restore if session is recent or if savedAt is not present (for backward compatibility with old sessions)
        // If session is old, clear it to prevent it from reappearing
        if (isRecent || !session.savedAt) {
          setTranscript(session.transcript || "");
          setLanguage(session.language || "en-US");
          if (session.sessionStartTime) {
            setSessionStartTime(new Date(session.sessionStartTime));
          }
          sessionStorage.setItem("transvero-loaded", "true");
        } else {
          // Session is too old, clear it
          localStorage.removeItem("transvero-session");
          sessionStorage.setItem("transvero-loaded", "true");
        }
      } catch (error) {
        console.error("Error loading saved session:", error);
        // If there's an error parsing, clear the corrupted session
        localStorage.removeItem("transvero-session");
        sessionStorage.setItem("transvero-loaded", "true");
      }
    }
  }, [transcript, sessionStartTime, location.search, continuingTranscriptId, user]);

  const handleStartRecording = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setIsRecording(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }

    if (isMultispeakerEnabled) {
      // Clear UI for multi-speaker recording
      setInterimTranscript("");
      setTranscript("");
      sessionContentRef.current = [];

      try {
        // Use the mobile-compatible AudioRecorder
        const { AudioRecorder } = await import("../utils/audioRecorder");
        const recorder = new AudioRecorder();
        await recorder.startRecording();
        audioRecorderRef.current = recorder;
      } catch (err: any) {
        console.error("Failed to start audio recording:", err);
        
        // Clean up if recorder was partially created
        if (audioRecorderRef.current) {
          try {
            await audioRecorderRef.current.stopRecording();
          } catch (e) {
            // Ignore cleanup errors
          }
          audioRecorderRef.current = null;
        }
        
        const errorMessage = err.message || "Audio recording not supported on this device";
        setError(
          `Failed to start audio recording: ${errorMessage}. Please ensure microphone permissions are granted.`
        );
        setIsMultispeakerEnabled(false);
        setIsRecording(false);
      }
    }

    recognitionRef.current?.startRecognition(
      (transcriptText: string, isFinal: boolean) => {
        // Skip real-time updates when multi-speaker mode is enabled
        // The diarized transcript will replace everything when recording stops
        if (isMultispeakerEnabled) {
          return;
        }

        if (isFinal) {
          const timestamp = new Date().toLocaleTimeString();
          const formattedText = `[${timestamp}] ${transcriptText}`;

          setTranscript((prev) => prev + (prev ? "\n" : "") + formattedText);
          sessionContentRef.current.push(formattedText);
          setInterimTranscript("");
        } else {
          setInterimTranscript(transcriptText);
        }
      },
      (errorMessage: string) => {
        setError(errorMessage);
        setIsRecording(false);
      },
      () => {
        console.log("Speech recognition started");
      },
      () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
      }
    );
  };

  const handleStopRecording = async () => {
    recognitionRef.current?.stopRecognition();
    setIsRecording(false);

    if (isMultispeakerEnabled && audioRecorderRef.current) {
      setIsProcessing(true);

      try {
        // Stop recording and get the audio blob
        const audioBlob = await audioRecorderRef.current.stopRecording();
        audioRecorderRef.current = null;

        // Validate blob
        if (!audioBlob || audioBlob.size === 0) {
          throw new Error("No audio data was recorded. Please ensure your microphone is working and try again.");
        }

        // Log blob info for debugging
        console.log("Audio blob info:", {
          size: audioBlob.size,
          type: audioBlob.type,
          sizeMB: (audioBlob.size / 1024 / 1024).toFixed(2),
        });

        // Use the speechRecognitionAPIService directly for diarization
        const { speechRecognitionAPIService } = await import("../utils/speechRecognitionAPI");

        // Show progress messages in overlay (not as errors)
        setProcessingMessage(`Uploading audio (${(audioBlob.size / 1024 / 1024).toFixed(2)}MB)...`);

        let uploadUrl: string;
        try {
          uploadUrl = await speechRecognitionAPIService.uploadAudio(audioBlob);
          setProcessingMessage("Processing audio and identifying speakers...");
        } catch (uploadError: any) {
          console.error("Upload error details:", uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        // Update progress message
        setProcessingMessage("Analyzing speakers and transcribing... This may take a moment.");
        
        // Pass the current language to the transcription service
        const diarizedTranscript = await speechRecognitionAPIService.transcribeWithDiarization(
          uploadUrl,
          speakerCount,
          language // Pass the selected language for proper multi-language support
        );

        if (diarizedTranscript && diarizedTranscript.trim()) {
          setTranscript(diarizedTranscript);
          sessionContentRef.current = [diarizedTranscript];
          setError(""); // Clear any error messages
          setProcessingMessage(""); // Clear processing message
        } else {
          throw new Error("No transcript was generated from the audio. Please try recording again.");
        }
      } catch (err: any) {
        console.error("Diarization failed:", err);
        
        // Provide user-friendly error messages
        let errorMessage = "Multi-speaker analysis failed. ";
        
        if (err.message.includes("timeout") || err.message.includes("timed out")) {
          errorMessage += "The analysis is taking too long. Please try recording a shorter session.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage += "Network error. Please check your internet connection and try again.";
        } else if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          errorMessage += "Authentication error. Please check your API configuration.";
        } else if (err.message.includes("Upload failed")) {
          errorMessage += err.message;
        } else {
          errorMessage += err.message || "Unknown error. Please try recording again.";
        }
        
        setError(errorMessage);
        setProcessingMessage(""); // Clear processing message on error
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    }
  };

  const handleManualTextAdd = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedText = `[${timestamp}] ${text}`;

    setTranscript((prev) => prev + (prev ? "\n" : "") + formattedText);
    sessionContentRef.current.push(formattedText);
  };

  const handleSwitchToManual = () => {
    setUseManualInput(true);
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleSwitchToSpeech = () => {
    setUseManualInput(false);
  };

  const handleStartNewSession = () => {
    // Clear all session data
    setTranscript("");
    setInterimTranscript("");
    setSessionStartTime(null);
    setError("");
    setHasUnsavedChanges(false);
    setContinuingTranscriptId(null);
    setOriginalTranscriptContent("");
    sessionContentRef.current = [];

    // Clear localStorage and sessionStorage
    localStorage.removeItem("transvero-session");
    sessionStorage.removeItem("transvero-loaded");

    // Stop any ongoing recording and clean up audio recorder
    if (isRecording) {
      handleStopRecording();
    } else if (audioRecorderRef.current) {
      // Clean up audio recorder if it exists but recording wasn't active
      try {
        audioRecorderRef.current.stopRecording().catch(() => {
          // Ignore errors during cleanup
        });
      } catch (e) {
        // Ignore errors
      }
      audioRecorderRef.current = null;
    }
  };

  const handleSaveTranscript = async () => {
    if (!user || !transcript.trim()) return;

    setIsSaving(true);
    try {
      if (continuingTranscriptId) {
        // Append new content to existing transcript
        // Only append content that was added after the original
        if (transcript.length > originalTranscriptContent.length) {
          const newContent = transcript.slice(originalTranscriptContent.length).trim();
          if (newContent) {
            await appendToTranscript(user.uid, continuingTranscriptId, newContent);
          }
        }
      } else {
        // Create new transcript
        const title = generateTranscriptTitle();
        const transcriptData = {
          title,
          content: transcript,
          timestamp: sessionStartTime?.toISOString() || new Date().toISOString(),
          speakers: false,
          language,
        };

        await saveTranscript(user.uid, transcriptData);
      }

      // Clear session
      setTranscript("");
      setInterimTranscript("");
      setSessionStartTime(null);
      setHasUnsavedChanges(false);
      setContinuingTranscriptId(null);
      setOriginalTranscriptContent("");
      sessionContentRef.current = [];
      localStorage.removeItem("transvero-session");
      sessionStorage.removeItem("transvero-loaded");

      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToDashboard = () => {
    handleNavigationWithConfirm(() => navigate("/dashboard"));
  };

  const handleExportPDF = async () => {
    if (!transcript.trim()) return;

    const title = generateTranscriptTitle();
    const transcriptData = {
      id: "temp",
      title,
      content: transcript,
      timestamp: sessionStartTime?.toISOString() || new Date().toISOString(),
      speakers: false,
      language,
    };

    try {
      await exportTranscriptToPDF(transcriptData);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setError("Failed to export PDF. Please try again.");
    }
  };

  const handleExportBRF = async () => {
    if (!transcript.trim()) return;

    const title = generateTranscriptTitle();
    const transcriptData = {
      id: "temp",
      title,
      content: transcript,
      timestamp: sessionStartTime?.toISOString() || new Date().toISOString(),
      speakers: false,
      language,
    };

    try {
      await exportTranscriptToBRF(transcriptData);
    } catch (error) {
      console.error("Error exporting BRF:", error);
      setError("Failed to export BRF. Please try again.");
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(newLanguage);
    }
  };

  if (!isSupported && !useManualInput) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center">
          <FiAlertCircle className="h-16 w-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Browser Not Supported
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Speech recognition requires a supported browser for optimal functionality.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-base">
                Please use one of these supported browsers:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li className="flex items-center">
                  <span className="font-bold mr-2">✓</span>
                  <span><strong className="font-bold">Google Chrome</strong> - Full support (Recommended)</span>
                </li>
                <li className="flex items-center">
                  <span className="font-bold mr-2">✓</span>
                  <span><strong className="font-bold">Microsoft Edge</strong> - Full support</span>
                </li>
                <li className="flex items-center">
                  <span className="font-bold mr-2">✓</span>
                  <span><strong className="font-bold">Safari</strong> - Full support (macOS/iOS)</span>
                </li>
              </ul>
            </div>
            {browserInfo && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Current browser: <strong>{browserInfo.name} {browserInfo.version}</strong></p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              Alternative Options:
            </h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
              <li>• Use manual text input mode (works in any browser)</li>
              <li>• Switch to a supported browser for speech recognition</li>
              <li>• Copy-paste text from other sources</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setUseManualInput(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              <FiType className="h-5 w-5 mr-2" />
              Use Manual Input
            </button>
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Unsaved Changes"
        message="You have unsaved changes in your current session. If you leave now, your recording history will be lost. Are you sure you want to continue?"
        confirmText="Leave Page"
        cancelText="Stay on Page"
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        type="warning"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
              <LoadingSpinner size="lg" text="" />
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white text-center">
                Analyzing Speakers
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-center text-sm">
                {processingMessage || "Transvero is identifying different voices in your recording. This may take a moment..."}
              </p>
              {language && language !== "en-US" && (
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 text-center">
                  Processing in {language.split("-")[0].toUpperCase()} language
                </p>
              )}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button
                  onClick={handleBackToDashboard}
                  className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 sm:mb-4 text-sm sm:text-base"
                >
                  <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Back to Dashboard
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Live Session
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {continuingTranscriptId
                    ? "Continuing existing transcript"
                    : "Real-time speech recognition and transcription"}
                </p>
                {continuingTranscriptId && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                    <FiPlay className="h-3 w-3 mr-1" />
                    Continuing transcript
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {transcript && (
                  <>
                    <button
                      onClick={handleStartNewSession}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors text-sm sm:text-base"
                    >
                      <FiPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden sm:inline">Start New Session</span>
                      <span className="sm:hidden">New</span>
                    </button>

                    <div className="relative inline-block">
                      <button
                        onClick={() => setExportOpen((s) => !s)}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm sm:text-base"
                      >
                        <FiDownload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="hidden sm:inline">Export</span>
                        <span className="sm:hidden">Export</span>
                        <FiChevronDown className="h-4 w-4 ml-2" />
                      </button>

                      {exportOpen && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-50">
                          <button
                            onClick={() => {
                              setExportOpen(false);
                              handleExportPDF();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Export PDF
                          </button>
                          <button
                            onClick={() => {
                              setExportOpen(false);
                              handleExportBRF();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Export BRF
                          </button>
                        </div>
                      )}
                    </div>



                    <button
                      onClick={handleSaveTranscript}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      {isSaving ? (
                        <LoadingSpinner size="sm" text="" />
                      ) : (
                        <>
                          <FiSave className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="hidden sm:inline">
                            Save Transcript
                          </span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Main Input Controls */}
            <div className="lg:col-span-2">
              {useManualInput ? (
                <ManualTextInput
                  onTextAdd={handleManualTextAdd}
                  onSave={handleSaveTranscript}
                  disabled={isSaving}
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Recording Controls
                  </h3>
                  <RecorderControls
                    isRecording={isRecording}
                    onToggleRecording={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                    disabled={!isSupported}
                  />
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex flex-col space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <LanguageSelector
                  selectedLanguage={language}
                  onLanguageChange={handleLanguageChange}
                  disabled={isRecording}
                />
              </div>

              {/* Multispeaker Controls */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <input
                      id="multispeaker-toggle"
                      type="checkbox"
                      checked={isMultispeakerEnabled}
                      onChange={(e) => setIsMultispeakerEnabled(e.target.checked)}
                      disabled={isRecording || isProcessing}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 cursor-pointer"
                    />
                    <label htmlFor="multispeaker-toggle" className="font-medium text-gray-900 dark:text-white cursor-pointer select-none">
                      Multi-speaker Analysis
                    </label>
                    <div className="group relative flex items-center">
                      <FiInfo className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ml-1 cursor-help" />
                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 max-w-xs p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center pointer-events-none whitespace-normal break-words">
                        When you end the recording, Transvero will process the audio and replace the text with speaker labels. Works on both desktop and mobile devices.
                        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>

                  {isMultispeakerEnabled && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="speaker-count" className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Expected Speakers:
                        </label>
                        <select
                          id="speaker-count"
                          value={speakerCount}
                          onChange={(e) => setSpeakerCount(parseInt(e.target.value))}
                          disabled={isRecording || isProcessing}
                          className="ml-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                      {isProcessing && (
                        <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
                          <span>Analyzing audio...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Browser Compatibility Info */}
          {showCompatibilityInfo && browserInfo && (
            <div className="mb-6">
              <BrowserCompatibility
                browserInfo={browserInfo}
                onDismiss={() => setShowCompatibilityInfo(false)}
              />
            </div>
          )}

          {/* Error Message */}
          {error && !showCompatibilityInfo && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <div className="flex items-start">
                <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div className="whitespace-pre-line text-sm">{error}</div>
              </div>
            </div>
          )}


          {/* Input Mode Toggle */}
          {isSupported && (
            <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Input Mode
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSwitchToSpeech}
                    disabled={!isSupported}
                    className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${!useManualInput
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      } ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <FiMic className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Speech Recognition</span>
                    <span className="sm:hidden">Speech</span>
                  </button>
                  <button
                    onClick={handleSwitchToManual}
                    className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${useManualInput
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                  >
                    <FiType className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Manual Input</span>
                    <span className="sm:hidden">Manual</span>
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-3">
                {useManualInput
                  ? "Type or paste text manually. Perfect for unsupported browsers or when you prefer typing."
                  : "Use your microphone for real-time speech recognition. Works best in Chrome, Edge, or Safari."}
              </p>
            </div>
          )}

          {/* Live Text Display */}
          <LiveTextDisplay
            transcript={
              transcript + (interimTranscript ? "\n" + interimTranscript : "")
            }
            isRecording={isRecording}
            isMultispeakerEnabled={isMultispeakerEnabled}
          />

          {/* Session Info */}
          {sessionStartTime && (
            <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Session started: {sessionStartTime.toLocaleTimeString()}
                </span>
                <span>
                  Duration:{" "}
                  {Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveSession;
