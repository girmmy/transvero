// Transcript Card Component
import React, { useState } from "react";
import { Transcript } from "../types";
import { exportTranscriptToPDF, formatTimestamp } from "../utils/pdfExporter";
import { deleteTranscript } from "../services/firestoreService";
import { useAuth } from "../contexts/AuthContext";
import { FiEye, FiDownload, FiTrash2, FiClock, FiGlobe } from "react-icons/fi";

interface TranscriptCardProps {
  transcript: Transcript;
  onDelete: (transcriptId: string) => void;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  onDelete,
}) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleDelete = async () => {
    if (
      !user ||
      !window.confirm("Are you sure you want to delete this transcript?")
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTranscript(user.uid, transcript.id);
      onDelete(transcript.id);
    } catch (error) {
      console.error("Error deleting transcript:", error);
      alert("Failed to delete transcript. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      exportTranscriptToPDF(transcript);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const truncateContent = (
    content: string,
    maxLength: number = 200
  ): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {transcript.title}
        </h3>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            aria-label="View transcript"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportPDF}
            className="p-2 text-gray-500 hover:text-green-600 transition-colors"
            aria-label="Download PDF"
          >
            <FiDownload className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            aria-label="Delete transcript"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <FiClock className="h-4 w-4" />
          <span>{formatTimestamp(transcript.timestamp)}</span>
        </div>
        {transcript.language && (
          <div className="flex items-center space-x-1">
            <FiGlobe className="h-4 w-4" />
            <span>{transcript.language}</span>
          </div>
        )}
        {transcript.speakers && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            Multi-speaker
          </span>
        )}
      </div>

      {/* Content */}
      <div className="text-gray-700">
        {showFullContent ? (
          <div className="whitespace-pre-wrap max-h-96 overflow-y-auto">
            {transcript.content}
          </div>
        ) : (
          <p className="line-clamp-3">{truncateContent(transcript.content)}</p>
        )}
      </div>

      {/* Footer */}
      {!showFullContent && transcript.content.length > 200 && (
        <button
          onClick={() => setShowFullContent(true)}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Read more
        </button>
      )}
    </div>
  );
};

export default TranscriptCard;
