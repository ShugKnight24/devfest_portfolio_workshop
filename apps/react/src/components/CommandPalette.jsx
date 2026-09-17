import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShell } from "../context/ShellContext";
import { MODES, groupBySection, searchRoutes } from "../config/navigation.js";

/*
 * CommandPalette — Cmd+K reaches every route, in every mode.
 *
 * The nav bar is deliberately short; this is the escape hatch that makes that
 * safe. Nothing in the app is unreachable, it is just not all on screen at once.
 *
 * Search, ranking and the route registry itself all live in config/navigation.js
 * so the palette stays a view over one list rather than a second copy of it.
 */

const LISTBOX_ID = "command-palette-listbox";
const INPUT_ID = "command-palette-input";
const optionId = (index) => `command-palette-option-${index}`;

const modeList = Object.values(MODES);

export const CommandPalette = () => {
  const navigate = useNavigate();
  const { mode, setMode, isPaletteOpen, openPalette, closePalette } = useShell();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const results = useMemo(() => searchRoutes(query), [query]);

  // Results render grouped, so the keyboard index has to follow the grouped
  // order, not the raw scored order.
  const groups = useMemo(() => groupBySection(results), [results]);

  const flatResults = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Global hotkey. Cmd+K is ignored while typing elsewhere in the app, but once
  // the palette is up it owns the binding so a second press closes it.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key?.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        const tag = e.target?.tagName;
        const isTyping =
          tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
        if (isTyping && !isPaletteOpen) return;
        e.preventDefault();
        if (isPaletteOpen) {
          closePalette();
        } else {
          openPalette();
        }
        return;
      }

      if (key === "escape" && isPaletteOpen) {
        e.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen, openPalette, closePalette]);

  // Focus the input on open, hand focus back to wherever it came from on close.
  useEffect(() => {
    if (!isPaletteOpen) return undefined;
    restoreFocusRef.current = document.activeElement;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [isPaletteOpen]);

  // Keep the active row in the scroll viewport.
  useEffect(() => {
    if (!isPaletteOpen) return;
    const node = document.getElementById(optionId(activeIndex));
    node?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, isPaletteOpen, flatResults.length]);

  const go = useCallback(
    (route) => {
      if (!route) return;
      navigate(route.to);
      setQuery("");
      setActiveIndex(0);
      // Do NOT restore focus to whatever opened the palette: after navigating,
      // that element usually belongs to the page we just left, and calling
      // .focus() on a detached node silently drops focus to <body>. Send it to
      // the new page's main region instead, which already has tabIndex={-1}.
      restoreFocusRef.current = null;
      closePalette();
      requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus?.();
      });
    },
    [navigate, closePalette]
  );

  /**
   * Keep Tab inside the dialog.
   *
   * `aria-modal` tells assistive tech the rest of the page is inert, but it
   * does not stop Tab from walking into the nav behind us. This sits on the
   * dialog rather than the input so it still holds when focus is on a mode
   * button or a result row.
   */
  const handleDialogKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!flatResults.length) return;
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!flatResults.length) return;
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(0, flatResults.length - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      go(flatResults[activeIndex]);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setActiveIndex(0);
  };

  if (!isPaletteOpen) return null;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      {/* Backdrop — click anywhere off the panel to dismiss. Escape does the same. */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closePalette}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        onKeyDown={handleDialogKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        id="command-palette"
        className="relative w-full max-w-2xl bg-(--color-surface-dark) border border-(--color-primary)/60 rounded-[2px] shadow-[0_0_60px_-10px_var(--color-primary)] overflow-hidden"
      >
        {/* Mode switcher — the shell you are wearing, changeable without leaving. */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-(--color-border-dark)">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-(--color-muted-text-dark)">
            Mode
          </span>
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            {modeList.map((m) => {
              const isActive = m.id === mode;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    id={`command-palette-mode-${m.id}`}
                    onClick={() => setMode(m.id)}
                    aria-pressed={isActive}
                    title={m.description}
                    className={`px-2.5 py-1 rounded-[2px] text-[11px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                      isActive
                        ? "bg-(--color-primary) text-(--color-primary-text,black) border-(--color-primary)"
                        : "border-(--color-border-dark) text-(--color-muted-text-dark) hover:text-(--color-text-dark) hover:border-(--color-primary)/50"
                    }`}
                  >
                    {m.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Query */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-(--color-border-dark)">
          <span
            className="text-(--color-primary) font-mono font-bold text-sm select-none"
            aria-hidden="true"
          >
            &gt;
          </span>
          <label htmlFor={INPUT_ID} className="sr-only">
            Search routes
          </label>
          <input
            id={INPUT_ID}
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Jump to anything..."
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={flatResults.length > 0}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={
              flatResults.length ? optionId(activeIndex) : undefined
            }
            className="flex-1 bg-transparent border-0 outline-none text-(--color-text-dark) font-mono text-sm placeholder:text-(--color-muted-text-dark)"
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-(--color-muted-text-dark)">
            {flatResults.length} {flatResults.length === 1 ? "result" : "results"}
          </span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto">
          {flatResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs font-mono uppercase tracking-wider text-(--color-muted-text-dark)">
              No route matches "{query}"
            </p>
          ) : (
            <ul id={LISTBOX_ID} role="listbox" aria-label="Routes" className="list-none m-0 p-0">
              {groups.map((group) => (
                <li key={group.section} role="presentation">
                  <p
                    id={`command-palette-section-${group.section.toLowerCase()}`}
                    className="px-4 pt-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-(--color-primary)/70"
                  >
                    {group.section}
                  </p>
                  <ul role="presentation" className="list-none m-0 p-0">
                    {group.items.map((route) => {
                      runningIndex += 1;
                      const index = runningIndex;
                      const isActive = index === activeIndex;
                      return (
                        <li key={route.to} role="presentation">
                          <div
                            id={optionId(index)}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => go(route)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`px-4 py-2 cursor-pointer border-l-2 transition-colors ${
                              isActive
                                ? "border-(--color-primary) bg-(--color-primary)/10"
                                : "border-transparent"
                            }`}
                          >
                            <span
                              className={`block text-sm font-mono font-bold ${
                                isActive
                                  ? "text-(--color-primary)"
                                  : "text-(--color-text-dark)"
                              }`}
                            >
                              {route.label}
                            </span>
                            <span className="block text-[11px] text-(--color-muted-text-dark) leading-tight">
                              {route.desc}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Key bindings */}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-(--color-border-dark) text-[10px] font-mono uppercase tracking-wider text-(--color-muted-text-dark)">
          <span>&uarr;&darr; Navigate</span>
          <span>&crarr; Open</span>
          <span>Esc Close</span>
          <span>&#8984;K Toggle</span>
        </p>
      </div>
    </div>
  );
};

export default CommandPalette;
