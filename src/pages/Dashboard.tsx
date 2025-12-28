// Dashboard Page Component
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserTranscripts,
  searchTranscripts,
} from "../services/firestoreService";
import { Transcript } from "../types";
import TranscriptCard from "../components/TranscriptCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiSearch, FiMic, FiClock, FiFileText } from "react-icons/fi";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [filteredTranscripts, setFilteredTranscripts] = useState<Transcript[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const loadTranscripts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTranscripts = await getUserTranscripts(user.uid);
      setTranscripts(userTranscripts);
      setFilteredTranscripts(userTranscripts);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearch = useCallback(
    async (term: string) => {
      if (!user) return;

      try {
        const results = await searchTranscripts(user.uid, term);
        setFilteredTranscripts(results);
      } catch (error: any) {
        console.error("Search error:", error);
        setFilteredTranscripts(transcripts);
      }
    },
    [user, transcripts]
  );

  useEffect(() => {
    if (user) {
      loadTranscripts();
    }
  }, [user, loadTranscripts]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    } else {
      setFilteredTranscripts(transcripts);
    }
  }, [searchTerm, transcripts, handleSearch]);

  const handleDeleteTranscript = (transcriptId: string) => {
    setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId));
    setFilteredTranscripts((prev) => prev.filter((t) => t.id !== transcriptId));
  };

  const stats = [
    {
      label: "Total Transcripts",
      value: transcripts.length,
      icon: <FiFileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "This Month",
      value: transcripts.filter((t) => {
        const transcriptDate = new Date(t.timestamp);
        const now = new Date();
        return (
          transcriptDate.getMonth() === now.getMonth() &&
          transcriptDate.getFullYear() === now.getFullYear()
        );
      }).length,
      icon: <FiClock className="h-6 w-6 text-green-600 dark:text-green-400" />,
      color: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your transcripts..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage your transcripts and start new recording sessions
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <Link
                to="/live"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                <FiMic className="h-4 w-4 mr-2" />
                Start New Session
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search transcripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Transcripts Grid */}
        {filteredTranscripts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTranscripts.map((transcript) => (
              <TranscriptCard
                key={transcript.id}
                transcript={transcript}
                onDelete={handleDeleteTranscript}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FiFileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No transcripts found" : "No transcripts yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start your first recording session to create transcripts"}
            </p>
            {!searchTerm && (
              <Link
                to="/live"
                className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                <FiMic className="h-4 w-4 mr-2" />
                Start Recording
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
