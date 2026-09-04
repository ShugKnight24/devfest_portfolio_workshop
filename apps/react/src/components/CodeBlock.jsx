import { CopyButton } from "./CopyButton";

/**
 * CodeBlock Component
 *
 * A styled code block with copy functionality.
 * Perfect for displaying code snippets in lessons and documentation.
 *
 * Usage:
 * <CodeBlock code="const x = 1;" language="javascript" />
 */

export const CodeBlock = ({
  code,
  language = "javascript",
  title,
  showLineNumbers = false,
  className = "",
}) => {
  const lines = code.trim().split("\n");

  return (
    <div className={`relative group rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-950 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-sm text-gray-400 ml-2">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase">{language}</span>
            <CopyButton text={code} size="xs" />
          </div>
        </div>
      )}

      {/* Code content */}
      <div className="relative bg-gray-900 dark:bg-gray-950">
        {/* Copy button (if no title) */}
        {!title && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={code} size="sm" />
          </div>
        )}

        <pre className="p-4 overflow-x-auto text-sm">
          <code className="text-gray-100 font-mono">
            {showLineNumbers ? (
              <table className="w-full">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-gray-800/50">
                      <td className="pr-4 text-right text-gray-500 select-none w-8">
                        {i + 1}
                      </td>
                      <td className="whitespace-pre">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code.trim()
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
