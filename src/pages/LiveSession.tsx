// Live Session Page Component
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { saveTranscript } from "../services/firestoreService";
import {
  exportTranscriptToPDF,
  generateTranscriptTitle,
} from "../utils/pdfExporter";
import { speechRecognitionService } from "../utils/speechRecognition";
import RecorderControls from "../components/RecorderControls";
import LiveTextDisplay from "../components/LiveTextDisplay";
import LanguageSelector from "../components/LanguageSelector";
import LoadingSpinner from "../components/LoadingSpinner";
import ManualTextInput from "../components/ManualTextInput";
import BrowserCompatibility from "../components/BrowserCompatibility";
import { detectBrowser, BrowserInfo } from "../utils/browserDetection";
import {
  FiSave,
  FiDownload,
  FiArrowLeft,
  FiAlertCircle,
  FiMic,
  FiType,
  FiPlus,
} from "react-icons/fi";

const LiveSession: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState("");

  // Browser compatibility state
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);

  // Session state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const sessionContentRef = useRef<string[]>([]);

  useEffect(() => {
    // Detect browser compatibility
    const detectedBrowser = detectBrowser();
    setBrowserInfo(detectedBrowser);

    // Check browser support
    if (!speechRecognitionService.isBrowserSupported()) {
      setIsSupported(false);
      setError(speechRecognitionService.getFallbackMessage());
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
    // Auto-save to localStorage
    if (transcript) {
      localStorage.setItem(
        "transvero-session",
        JSON.stringify({
          transcript,
          sessionStartTime: sessionStartTime?.toISOString(),
          language,
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

  useEffect(() => {
    // Load previous session from localStorage only on first load
    const savedSession = localStorage.getItem("transvero-session");
    const hasLoadedBefore = sessionStorage.getItem("transvero-loaded");

    if (savedSession && !transcript && !sessionStartTime && !hasLoadedBefore) {
      try {
        const session = JSON.parse(savedSession);
        setTranscript(session.transcript || "");
        setLanguage(session.language || "en-US");
        if (session.sessionStartTime) {
          setSessionStartTime(new Date(session.sessionStartTime));
        }
        sessionStorage.setItem("transvero-loaded", "true");
      } catch (error) {
        console.error("Error loading saved session:", error);
      }
    }
  }, [transcript, sessionStartTime]);

  const handleStartRecording = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setIsRecording(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }

    recognitionRef.current?.startRecognition(
      (transcriptText: string, isFinal: boolean) => {
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

  const handleStopRecording = () => {
    recognitionRef.current?.stopRecognition();
    setIsRecording(false);
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
    sessionContentRef.current = [];

    // Clear localStorage and sessionStorage
    localStorage.removeItem("transvero-session");
    sessionStorage.removeItem("transvero-loaded");

    // Stop any ongoing recording
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleSaveTranscript = async () => {
    if (!user || !transcript.trim()) return;

    setIsSaving(true);
    try {
      const title = generateTranscriptTitle();
      const transcriptData = {
        title,
        content: transcript,
        timestamp: sessionStartTime?.toISOString() || new Date().toISOString(),
        speakers: false,
        language,
      };

      await saveTranscript(user.uid, transcriptData);

      // Clear session
      setTranscript("");
      setInterimTranscript("");
      setSessionStartTime(null);
      setHasUnsavedChanges(false);
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
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes in your current session. If you leave now, your recording history will be lost. Are you sure you want to go back to the dashboard?"
      );
      if (!confirmed) {
        return;
      }
    }
    navigate("/dashboard");
  };

  const handleExportPDF = () => {
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

    exportTranscriptToPDF(transcriptData);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(newLanguage);
    }
  };

  if (!isSupported && !useManualInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <FiAlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Speech Recognition Not Available
          </h2>
          <div className="whitespace-pre-line text-gray-600 mb-6 text-left">
            {error}
          </div>

          {browserInfo && (
            <div className="mb-6">
              <BrowserCompatibility browserInfo={browserInfo} />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              Alternative Options:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use manual text input instead</li>
              <li>• Copy-paste text from other sources</li>
              <li>• Try a different browser (Chrome, Edge, Safari)</li>
              <li>• Check microphone permissions</li>
            </ul>
          </div>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => setUseManualInput(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiType className="h-5 w-5 mr-2" />
              Use Manual Input
            </button>
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={handleBackToDashboard}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2 sm:mb-4 text-sm sm:text-base"
              >
                <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Live Session
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Real-time speech recognition and transcription
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {transcript && (
                <>
                  <button
                    onClick={handleStartNewSession}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                  >
                    <FiPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Start New Session</span>
                    <span className="sm:hidden">New</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                  >
                    <FiDownload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>

                  <button
                    onClick={handleSaveTranscript}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
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
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
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
          <div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <LanguageSelector
                selectedLanguage={language}
                onLanguageChange={handleLanguageChange}
                disabled={isRecording}
              />
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Input Mode Toggle */}
        {isSupported && (
          <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Input Mode
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSwitchToSpeech}
                  disabled={!isSupported}
                  className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    !useManualInput
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FiMic className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Speech Recognition</span>
                  <span className="sm:hidden">Speech</span>
                </button>
                <button
                  onClick={handleSwitchToManual}
                  className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    useManualInput
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <FiType className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Manual Input</span>
                  <span className="sm:hidden">Manual</span>
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
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
        />

        {/* Session Info */}
        {sessionStartTime && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
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
  );
};

export default LiveSession;
