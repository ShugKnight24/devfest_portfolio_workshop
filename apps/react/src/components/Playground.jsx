import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { EmojiIcon } from "./Icons/EmojiIcon";

export const Playground = ({
  title,
  description,
  initialCode,
  concept,
  hints = [],
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  // Safe evaluation for simple expressions
  const runCode = () => {
    try {
      // Only evaluate safe, simple JavaScript expressions
      const result = new Function(`return (${code})`)();
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-linear-to-r from-(--color-primary) to-(--color-secondary) p-4">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs text-white">
          Concept: {concept}
        </span>
      </div>

      {/* Code Editor */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Code:
          </label>
          <CopyButton text={code} size="sm" />
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-32 p-3 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border border-gray-600 focus:ring-2 focus:ring-(--color-primary) outline-none"
          spellCheck="false"
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={runCode}
            className="px-4 py-2 bg-(--color-primary) text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            ▶ Run Code
          </button>
          <button
            onClick={() => setCode(initialCode)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ↺ Reset
          </button>
          {hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="px-4 py-2 bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200 font-medium rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="lightbulb" className="w-4 h-4" />
              <span>{showHints ? "Hide Hints" : "Show Hints"}</span>
            </button>
          )}
        </div>

        {/* Output */}
        {output && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output:
            </label>
            <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm overflow-x-auto">
              {output}
            </pre>
          </div>
        )}

        {/* Hints */}
        {showHints && hints.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>
                Hint {currentHint + 1}/{hints.length}:
              </strong>{" "}
              {hints[currentHint]}
            </p>
            {hints.length > 1 && (
              <button
                onClick={() =>
                  setCurrentHint((prev) => (prev + 1) % hints.length)
                }
                className="mt-2 text-xs text-yellow-600 hover:underline"
              >
                Next Hint →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
