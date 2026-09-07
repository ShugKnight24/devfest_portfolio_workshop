import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * ErrorBoundary — Cyber-Brutalist Fault Isolation
 *
 * Catches unhandled runtime exceptions in descendant components,
 * preventing total app white-screens while providing attendees
 * with a 1-click Reacher Root-Cause prompt for fast AI debugging.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log forensic trace to console
    console.error("[REACHER PROTOCOL] Forensic Crash Intercepted:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showStack: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyPrompt = () => {
    const { error, errorInfo } = this.state;
    const prompt = [
      "Listen up, Gemini. We are executing the Reacher Protocol on my repository: devfest_portfolio_workshop.",
      "",
      "The app threw an unhandled runtime exception. Deduce the exact root cause and return surgical diffs only.",
      "",
      `### ERROR:`,
      `\`\`\``,
      error?.toString() || "Unknown error",
      `\`\`\``,
      "",
      `### COMPONENT TRACE:`,
      `\`\`\``,
      errorInfo?.componentStack?.trim() || "No component stack trace available",
      `\`\`\``,
      "",
      "### CONSTRAINTS:",
      "1. Zero bloat. Pure native React 19 / Modern CSS.",
      "2. No civilian filler or conversational apologies.",
      "3. Output diffs only.",
    ].join("\n");

    navigator.clipboard.writeText(prompt).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.handleReset,
      });
    }

    const { error, errorInfo, copied, showStack } = this.state;
    const isInline = this.props.inline;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`${
          isInline
            ? "p-6 my-4 rounded-2xl"
            : "min-h-screen p-6 md:p-12 flex items-center justify-center"
        } bg-[#05070a] text-white border-2 border-[#ff0055] shadow-[0_0_30px_rgba(255,0,85,0.25)] font-mono selection:bg-[#ff0055] selection:text-white`}
      >
        <div className="max-w-3xl w-full space-y-6">
          {/* Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ff0055]/30 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff0055]/15 border border-[#ff0055] rounded text-xs uppercase tracking-widest text-[#ff0055] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
              SYSTEM OFFLINE: CHECK YOUR CODE
            </div>
            <span className="text-xs text-gray-400">
              REACHER PROTOCOL // FAULT ISOLATION
            </span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">
              Runtime Exception Intercepted
            </h1>
            <p className="mt-2 text-sm text-gray-300 font-sans leading-relaxed">
              An unhandled crash was halted by the workshop isolation boundary.
              Your other tabs, local state, and runtime environment remain intact.
            </p>
          </div>

          {/* Error Message Box */}
          <div className="p-4 bg-[#0d1117] border border-[#ff0055]/40 rounded-xl space-y-2">
            <div className="text-xs uppercase tracking-wider text-[#ff0055] font-bold">
              Diagnostic String:
            </div>
            <div className="text-sm text-red-300 font-mono break-words bg-black/60 p-3 rounded border border-red-900/40">
              {error?.toString() || "Unknown error encountered"}
            </div>
          </div>

          {/* Component Trace Toggle */}
          {errorInfo?.componentStack && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => this.setState({ showStack: !showStack })}
                className="text-xs text-[#00ffcc] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] rounded px-1"
                aria-expanded={showStack}
              >
                <span>{showStack ? "[-] Hide" : "[+] Inspect"} Forensic Component Stack</span>
              </button>

              {showStack && (
                <pre className="text-xs text-gray-400 bg-black/80 p-4 rounded-xl border border-gray-800 overflow-x-auto max-h-64 leading-relaxed font-mono">
                  {errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={this.handleCopyPrompt}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc] ${
                copied
                  ? "bg-[#00ffcc] text-black shadow-[0_0_15px_rgba(0,255,204,0.4)]"
                  : "bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc] hover:bg-[#00ffcc] hover:text-black"
              }`}
            >
              {copied ? "✓ Copied Debug Prompt" : "Copy Reacher Debug Prompt"}
            </button>

            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Reboot Component
            </button>

            {!isInline && (
              <Link
                to="/"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
              >
                Return to Base (Home)
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
