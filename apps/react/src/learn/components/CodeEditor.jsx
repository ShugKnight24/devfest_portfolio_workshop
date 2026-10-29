import { useLayoutEffect, useRef } from "react";

// A plain textarea that behaves enough like an editor for lessons:
// Tab indents two spaces, Shift+Tab outdents, Enter keeps the indent, Cmd/Ctrl+Enter runs,
// and the box grows with the code so nothing scrolls inside a scroll.
export function CodeEditor({ value, onChange, onRun, onEscape, autoFocus, label = "Code editor", minRows = 4 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, minRows * 22) + 4 + "px";
  }, [value, minRows]);

  useLayoutEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const edit = (el, start, end, text, caret) => {
    const v = el.value.slice(0, start) + text + el.value.slice(end);
    onChange(v);
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  const onKeyDown = (e) => {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end, value: v } = el;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onRun?.();
    } else if (e.key === "Escape" && onEscape) {
      e.preventDefault();
      onEscape();
    } else if (e.key === "Tab" && !e.shiftKey && s === end) {
      e.preventDefault();
      edit(el, s, end, "  ", s + 2);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      if (v.startsWith("  ", lineStart)) edit(el, lineStart, lineStart + 2, "", Math.max(lineStart, s - 2));
    } else if (e.key === "Enter" && !e.shiftKey && s === end) {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const indent = v.slice(lineStart).match(/^ */)[0];
      const opener = /[{[(:]\s*$/.test(v.slice(lineStart, s)) ? "  " : "";
      if (indent || opener) {
        e.preventDefault();
        edit(el, s, end, "\n" + indent + opener, s + 1 + indent.length + opener.length);
      }
    }
  };

  return (
    <textarea
      ref={ref}
      className="learn-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      aria-label={label}
    />
  );
}

export function Output({ result, pending }) {
  if (pending) return <div className="learn-output muted">{pending}</div>;
  if (!result) return null;
  const errors = result.results.filter((r) => !r.pass);
  const empty = !result.logs.length && !errors.length;
  return (
    <div className={"learn-output" + (errors.length ? " bad" : "")} role="status">
      {result.logs.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      {errors.map((r, i) => (
        <div key={"e" + i} className="err">
          {r.error}
        </div>
      ))}
      {empty && <div className="muted">(nothing printed)</div>}
    </div>
  );
}
