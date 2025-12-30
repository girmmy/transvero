// Home Page Component
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiMic,
  FiClock,
  FiDownload,
  FiUsers,
  FiGlobe,
  FiShield,
} from "react-icons/fi";

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <FiMic className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Real-time Transcription",
      description:
        "Get instant live captions as you speak using advanced speech recognition technology.",
    },
    {
      icon: <FiClock className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Session Management",
      description:
        "Save, organize, and manage your transcriptions with timestamps and speaker identification.",
    },
    {
      icon: <FiDownload className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "PDF & BRF Export",
      description:
        "Download your transcripts as formatted PDF documents or BRF files for easy sharing and archiving.",
    },
    {
      icon: <FiUsers className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Multi-speaker Support",
      description:
        "Identify different speakers in conversations for better organization and clarity.",
    },
    {
      icon: <FiGlobe className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Multiple Languages",
      description:
        "Support for various languages to make transcription accessible to everyone.",
    },
    {
      icon: <FiShield className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: "Secure & Private",
      description:
        "Your data is encrypted and stored securely with Firebase authentication.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              <span className="text-blue-600 dark:text-blue-400">Trans</span>vero
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Real-time captions and transcriptions for accessibility,
              productivity, and communication
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto px-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="bg-blue-600 dark:bg-blue-500 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/live?new=true"
                    className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Start New Session
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-blue-600 dark:bg-blue-500 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Whether you're a student, professional, or need accessibility
              support, Transvero provides the tools you need for accurate
              transcription.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-700 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of users who rely on Transvero for accurate,
            real-time transcription.
          </p>
          <Link
            to={user ? "/live" : "/signup"}
            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-block"
          >
            {user ? "Start Recording" : "Create Free Account"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              <span className="text-blue-400 dark:text-blue-500">Trans</span>vero
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mb-4 text-sm sm:text-base px-4">
              Making communication accessible through real-time transcription
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-600">
              © 2024 Transvero. Built with React, Firebase, and Web Speech API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
