// Manual Text Input Component for Fallback
import React, { useState } from "react";
import { FiType, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";

interface ManualTextInputProps {
  onTextAdd: (text: string) => void;
  onSave: () => void;
  disabled?: boolean;
}

const ManualTextInput: React.FC<ManualTextInputProps> = ({
  onTextAdd,
  onSave,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [textHistory, setTextHistory] = useState<string[]>([]);

  const handleAddText = () => {
    if (inputText.trim()) {
      onTextAdd(inputText.trim());
      setTextHistory((prev) => [...prev, inputText.trim()]);
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddText();
    }
  };

  const handleRemoveFromHistory = (index: number) => {
    setTextHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearHistory = () => {
    setTextHistory([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <FiType className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Manual Text Input
        </h3>
      </div>

      <div className="mb-4">
        <label
          htmlFor="manual-text"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Type or paste your text here:
        </label>
        <textarea
          id="manual-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder="Type your text here... (Press Enter to add, Shift+Enter for new line)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      <div className="flex space-x-3 mb-4">
        <button
          onClick={handleAddText}
          disabled={disabled || !inputText.trim()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus className="h-4 w-4 mr-2" />
          Add Text
        </button>

        <button
          onClick={onSave}
          disabled={disabled}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <FiSave className="h-4 w-4 mr-2" />
          Save Session
        </button>
      </div>

      {textHistory.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Added Text ({textHistory.length} items)
            </h4>
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {textHistory.map((text, index) => (
              <div
                key={index}
                className="flex items-start justify-between bg-gray-50 p-2 rounded text-sm"
              >
                <span className="flex-1 text-gray-700">{text}</span>
                <button
                  onClick={() => handleRemoveFromHistory(index)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 <strong>Tips:</strong>
        </p>
        <ul className="mt-1 space-y-1">
          <li>
            • Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd>{" "}
            to add text
          </li>
          <li>
            • Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
              Shift + Enter
            </kbd>{" "}
            for new lines
          </li>
          <li>• You can copy-paste text from other sources</li>
          <li>• Each addition is timestamped automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualTextInput;
