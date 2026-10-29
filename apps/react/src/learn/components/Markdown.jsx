import { useMemo, useState } from "react";
import { mdBlocks, esc } from "../engine/markdown";
import { RUNNABLE, loadingNote, runCode } from "../engine/run";
import { CodeEditor, Output } from "./CodeEditor";

// Lesson text. Fenced blocks in a runnable language (~~~js, ~~~ts, ~~~py) get Run / Edit buttons;
// other fences (diagrams, shell commands, ~~~text) render as plain code.
export function Markdown({ src, packages, className = "" }) {
  const blocks = useMemo(() => mdBlocks(src), [src]);
  return (
    <div className={"learn-prose " + className}>
      {blocks.map((b, i) =>
        b.type === "html" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />
        ) : RUNNABLE.has(b.lang) ? (
          <RunnableBlock key={i} code={b.code} lang={b.lang} packages={packages} />
        ) : (
          <CodeBlock key={i} code={b.code} lang={b.lang} />
        ),
      )}
    </div>
  );
}

export function CodeBlock({ code, lang }) {
  return (
    <pre className="learn-code" data-lang={lang || undefined}>
      <code dangerouslySetInnerHTML={{ __html: esc(code) }} />
    </pre>
  );
}

// Read-only until you press Edit; "Done editing" keeps your change, "Undo my changes" restores the original.
export function RunnableBlock({ code: original, lang, packages, startEditing = false }) {
  const [code, setCode] = useState(original);
  const [editing, setEditing] = useState(startEditing);
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(null);

  const run = async () => {
    setPending(loadingNote(lang));
    const r = await runCode(lang, code, packages);
    setPending(null);
    setResult(r);
  };

  return (
    <div className="learn-runnable">
      <div className="learn-codebar">
        <span className="learn-lang">{lang}</span>
        {!editing && code !== original && (
          <button
            type="button"
            className="learn-btn small"
            onClick={() => {
              setCode(original);
              setResult(null);
            }}
          >
            Undo my changes
          </button>
        )}
        <button type="button" className="learn-btn small" onClick={() => setEditing(!editing)} title={editing ? "Stop editing (Esc)" : "Edit this code"}>
          {editing ? "✓ Done editing" : "✎ Edit"}
        </button>
        <button type="button" className="learn-btn small run" onClick={run}>
          ▶ Run
        </button>
      </div>
      {editing ? (
        <CodeEditor value={code} onChange={setCode} onRun={run} onEscape={() => setEditing(false)} autoFocus minRows={2} />
      ) : (
        <CodeBlock code={code} />
      )}
      <Output result={result} pending={pending} />
    </div>
  );
}
