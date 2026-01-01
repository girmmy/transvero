// Transcript Card Component
import React, { useState, useEffect } from "react";
import { Transcript } from "../types";
import { exportTranscriptToPDF, formatTimestamp } from "../utils/pdfExporter";
import { exportTranscriptToBRF } from "../utils/brfExporter";
import { deleteTranscript, updateTranscript } from "../services/firestoreService";
import { useAuth } from "../contexts/AuthContext";
import { FiEdit, FiDownload, FiTrash2, FiClock, FiGlobe, FiChevronDown, FiCheck, FiX, FiPlay } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";

interface TranscriptCardProps {
  transcript: Transcript;
  onDelete: (transcriptId: string) => void;
  onUpdate: (transcriptId: string, updates: Partial<Transcript>) => void;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  onDelete,
  onUpdate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(transcript.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setNewTitle(transcript.title);
  }, [transcript.title]);

  const handleDeleteClick = () => {
    if (!user) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;

    setShowDeleteDialog(false);
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

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleRename = async () => {
    if (!user || !newTitle.trim() || newTitle === transcript.title) {
      setIsRenaming(false);
      setNewTitle(transcript.title);
      return;
    }

    try {
      await updateTranscript(user.uid, transcript.id, { title: newTitle.trim() });
      onUpdate(transcript.id, { title: newTitle.trim() });
      setIsRenaming(false);
    } catch (error) {
      console.error("Error renaming transcript:", error);
      alert("Failed to rename transcript. Please try again.");
      setNewTitle(transcript.title);
      setIsRenaming(false);
    }
  };

  const handleCancelRename = () => {
    setNewTitle(transcript.title);
    setIsRenaming(false);
  };

  const handleContinue = () => {
    navigate(`/live?continue=${transcript.id}`);
  };

  const handleExportPDF = async () => {
    try {
      await exportTranscriptToPDF(transcript);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        {isRenaming ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") handleCancelRename();
              }}
              className="flex-1 min-w-0 px-2 py-1 text-lg font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="flex-shrink-0 p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              aria-label="Save rename"
            >
              <FiCheck className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelRename}
              className="flex-shrink-0 p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              aria-label="Cancel rename"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 min-w-0">
            {transcript.title}
          </h3>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isRenaming && (
            <>
              <button
                onClick={handleContinue}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                aria-label="Continue transcript"
                title="Continue this transcript"
              >
                <FiPlay className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsRenaming(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Rename transcript"
              >
                <FiEdit className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((s) => !s)}
              className="inline-flex items-center p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded"
              aria-haspopup="true"
              aria-expanded={exportOpen}
            >
              <FiDownload className="h-4 w-4 mr-1" />
              <FiChevronDown className="h-4 w-4" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-50">
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
                    exportTranscriptToBRF(transcript);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export BRF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete transcript"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
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
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
            Multi-speaker
          </span>
        )}
      </div>

      {/* Content */}
      <div className="text-gray-700 dark:text-gray-300">
        <p className="line-clamp-3">{truncateContent(transcript.content)}</p>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Transcript"
        message={`Are you sure you want to delete "${transcript.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
};

export default TranscriptCard;
