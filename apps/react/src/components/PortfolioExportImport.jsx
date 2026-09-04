import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Close, Download, Checkmark } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { useToast } from "./Toast";

/**
 * Portfolio Export/Import System
 *
 * Allows users to:
 * - Export their portfolio data as JSON
 * - Import portfolio configurations
 * - Share portfolio settings with others
 */

// Upload icon
const Upload = ({ className = "size-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
    />
  </svg>
);

// Validate imported data structure
const validatePortfolioData = (data) => {
  const required = ["personal", "skills", "projects"];
  const errors = [];

  required.forEach((field) => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (data.personal) {
    if (!data.personal.name) errors.push("Missing personal.name");
  }

  if (data.skills && !Array.isArray(data.skills)) {
    errors.push("Skills must be an array");
  }

  if (data.projects && !Array.isArray(data.projects)) {
    errors.push("Projects must be an array");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const PortfolioExportImport = ({
  portfolioData,
  onImport,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("export");
  const [importData, setImportData] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  // Generate export data
  const exportData = JSON.stringify(portfolioData, null, 2);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      addToast("Portfolio data copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  // Download as file
  const handleDownload = () => {
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${
      portfolioData.personal?.name?.toLowerCase().replace(/\s+/g, "-") || "data"
    }-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Portfolio downloaded!", "success");
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      setImportData(content);
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };

  // Validate and preview import
  const validateAndPreview = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const validation = validatePortfolioData(data);
      setImportErrors(validation.errors);
      return validation.isValid ? data : null;
    } catch (err) {
      setImportErrors(["Invalid JSON format: " + err.message]);
      return null;
    }
  };

  // Handle import
  const handleImport = () => {
    const data = validateAndPreview(importData);
    if (data) {
      onImport(data);
      addToast("Portfolio imported successfully!", "success");
      setIsModalOpen(false);
      setImportData("");
      setImportErrors([]);
    }
  };

  // Handle paste
  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        setImportData(text);
        validateAndPreview(text);
      })
      .catch(() => {
        addToast("Failed to read clipboard", "error");
      });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors ${className}`}
      >
        <Download className="w-4 h-4" />
        Export/Import
      </button>

      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 inline-flex items-center gap-2">
                    <EmojiIcon name="box" className="w-6 h-6" /> Export & Import
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Save or load your portfolio configuration
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close export/import modal"
                >
                  <Close className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab("export")}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === "export"
                      ? "text-blue-500 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === "import"
                      ? "text-blue-500 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Import
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "export" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your portfolio data is ready to export. You can copy it to
                      clipboard or download as a JSON file.
                    </p>

                    {/* Preview */}
                    <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {exportData}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                      >
                        {copied ? (
                          <>
                            <Checkmark className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          "Copy to Clipboard"
                        )}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download JSON
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Import a portfolio configuration by pasting JSON or
                      uploading a file.
                    </p>

                    {/* File Upload */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        .json files only
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        aria-label="Upload portfolio JSON file"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-sm text-gray-500">or</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Paste Area */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Paste JSON
                        </label>
                        <button
                          onClick={handlePaste}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          Paste from clipboard
                        </button>
                      </div>
                      <textarea
                        value={importData}
                        onChange={(e) => {
                          setImportData(e.target.value);
                          if (e.target.value) {
                            validateAndPreview(e.target.value);
                          } else {
                            setImportErrors([]);
                          }
                        }}
                        aria-label="Paste portfolio JSON configuration"
                        placeholder='{"personal": { ... }, "skills": [ ... ], "projects": [ ... ]}'
                        className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Validation Errors */}
                    {importErrors.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h4 className="font-medium text-red-700 dark:text-red-300 mb-2 inline-flex items-center gap-1.5">
                          <EmojiIcon name="warning" className="w-4 h-4" />{" "}
                          Validation Errors
                        </h4>
                        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                          {importErrors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Import Button */}
                    <button
                      onClick={handleImport}
                      disabled={!importData || importErrors.length > 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Import Portfolio
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 text-center inline-flex items-center justify-center gap-1 w-full">
                  <EmojiIcon name="lightbulb" className="w-3.5 h-3.5" /> Tip: Share
                  your exported JSON with classmates to compare portfolios!
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default PortfolioExportImport;
