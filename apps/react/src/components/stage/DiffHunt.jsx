import { useEffect, useRef, useState } from "react";

/**
 * DiffHunt — "Read the diff": the room hunts the flaws in an agent's PR.
 *
 * The slide shows a pull request that looks finished: confident description,
 * CI green. Pairs get a few minutes to find what is wrong. Then each clicker
 * press reveals one flaw, in order: its lines light up red with the exhibit
 * letter from the Reacher scene, and the panel says what it is, why it
 * matters, and which piece of evidence it was dressed up as.
 *
 * Reveals are beats (one per flaw), so the clicker reveals before it
 * advances, and back hides the last one before it leaves. Any flaw already
 * found can be clicked to bring it back up without hiding the rest. Each one
 * also carries a real incident from a big codebase where the same mistake got
 * through, so the room sees it is not a classroom trick.
 */

const FlawMark = ({ letter, active }) => (
  <span
    aria-hidden="true"
    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black"
    style={{
      borderColor: "#e5484d",
      color: active ? "#fff" : "#e5484d",
      backgroundColor: active ? "#e5484d" : "transparent",
    }}
  >
    {letter}
  </span>
);

const lineTone = (type) =>
  type === "+" ? "rgb(46 160 67 / 0.12)" : type === "-" ? "rgb(248 81 73 / 0.12)" : "transparent";

export const DiffHuntSlide = ({ slide, isActive, beatStep = 0, onBeat = () => {}, onBack }) => {
  const revealed = Math.min(beatStep, slide.flaws.length);
  // Which found flaw is up: the newest, unless one was clicked since.
  const [picked, setPicked] = useState(null);
  useEffect(() => setPicked(null), [revealed]);
  const focus = picked ?? revealed - 1;
  const latest = revealed > 0 ? slide.flaws[focus] : null;
  const done = revealed === slide.flaws.length;
  const flawAt = (key) => slide.flaws.findIndex((f) => f.lines.includes(key));
  // On a short screen the diff scrolls; each reveal brings its line into view.
  const currentRef = useRef(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [focus]);

  return (
    <div className={`mx-auto w-full max-w-7xl transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="stage-kicker mb-1">{slide.badge}</p>
          <h2 className="stage-h2" style={{ fontSize: "clamp(1.6rem, 3vw, 3rem)" }}>
            {slide.title}
          </h2>
          <p className="stage-body mt-1" style={{ color: "var(--stage-text-muted)" }}>
            {slide.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
        {onBack && revealed > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="stage-kicker border px-4 py-2"
            style={{ borderColor: "var(--stage-border)", color: "var(--stage-text-muted)", borderRadius: "var(--stage-radius)" }}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => !done && onBeat(revealed)}
          aria-disabled={done}
          className="stage-kicker border px-4 py-2"
          style={{
            borderColor: done ? "var(--stage-border)" : "#e5484d",
            color: done ? "var(--stage-text-muted)" : "#e5484d",
            borderRadius: "var(--stage-radius)",
          }}
        >
          {done ? "All six found" : `Reveal ${revealed + 1} of ${slide.flaws.length}`}
        </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* The PR, as the agent opened it. */}
        <div
          className="overflow-y-auto border"
          style={{ maxHeight: "calc(100vh - 17rem)", borderColor: "var(--stage-border)", borderRadius: "var(--stage-radius)", backgroundColor: "#0b0f15" }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5" style={{ borderColor: "var(--stage-border)" }}>
            <span className="font-mono text-sm font-bold text-(--stage-text)">{slide.pr.title}</span>
            {slide.pr.claims.map((claim) => (
              <span key={claim} className="rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: "rgb(46 160 67 / 0.6)", color: "#3fb950" }}>
                {claim}
              </span>
            ))}
          </div>
          {slide.files.map((file) => (
            <div key={file.path}>
              <div className="border-b px-4 py-1.5 font-mono text-[12px]" style={{ borderColor: "var(--stage-border)", color: "var(--stage-text-muted)", backgroundColor: "rgb(255 255 255 / 0.03)" }}>
                {file.path}
              </div>
              <pre className="m-0 overflow-x-auto py-1 font-mono leading-[1.55]" style={{ fontSize: "clamp(11px, 0.95vw, 15px)" }}>
                {file.lines.map((line, i) => {
                  const key = `${file.path}:${i + 1}`;
                  const f = flawAt(key);
                  const shown = f >= 0 && f < revealed;
                  const current = shown && f === focus;
                  return (
                    <div
                      key={key}
                      ref={current && slide.flaws[f].lines[0] === key ? currentRef : undefined}
                      className="flex items-start gap-2 pr-4 transition-colors duration-300"
                      style={{
                        backgroundColor: shown ? "rgb(229 72 77 / 0.2)" : lineTone(line[0]),
                        boxShadow: current ? "inset 3px 0 0 #e5484d" : "none",
                      }}
                    >
                      <span className="w-9 shrink-0 select-none text-right" style={{ color: "var(--stage-text-muted)" }}>
                        {i + 1}
                      </span>
                      <span className="w-3 shrink-0 select-none" style={{ color: line[0] === "+" ? "#3fb950" : "var(--stage-text-muted)" }}>
                        {line[0] === " " ? "" : line[0]}
                      </span>
                      <code className="min-w-0 flex-1 whitespace-pre text-(--stage-text)">{line.slice(1)}</code>
                      <span className="w-5 shrink-0">{shown && <FlawMark letter={slide.flaws[f].exhibit} active={current} />}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          ))}
        </div>

        {/* The read: the brief before, the findings as they land. */}
        <div className="flex min-w-0 flex-col gap-3">
          {!latest ? (
            <div className="stage-card">
              <p className="stage-kicker mb-2">The brief</p>
              <ul className="stage-body m-0 list-none space-y-2 p-0">
                {slide.brief.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="stage-card" style={{ borderColor: "#e5484d" }} aria-live="polite">
              <p className="mb-2 flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest" style={{ color: "#e5484d" }}>
                <FlawMark letter={latest.exhibit} active /> Exhibit {latest.exhibit} — {latest.clue}
              </p>
              <p className="text-lg font-bold leading-snug text-(--stage-text)">{latest.title}</p>
              <p className="stage-body mt-2 leading-relaxed">{latest.why}</p>
              {latest.wild && (
                <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--stage-border)" }}>
                  <p className="m-0 font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--stage-accent)" }}>
                    In the wild // {latest.wild.when}
                  </p>
                  <p className="m-0 mt-1 font-bold text-(--stage-text)">{latest.wild.name}</p>
                  <p className="stage-body m-0 mt-1 text-sm leading-relaxed">{latest.wild.what}</p>
                </div>
              )}
            </div>
          )}
          {revealed > 1 && (
            <ol className="m-0 list-none space-y-1 p-0">
              {slide.flaws.slice(0, revealed).map((f, i) =>
                i === focus ? null : (
                  <li key={f.exhibit}>
                    <button
                      type="button"
                      onClick={() => setPicked(i)}
                      className="flex w-full items-center gap-2 text-left font-mono text-[13px] text-(--stage-text-muted) hover:text-(--stage-text)"
                    >
                      <FlawMark letter={f.exhibit} /> {f.title}
                    </button>
                  </li>
                ),
              )}
            </ol>
          )}
          {done && (
            <p className="stage-lead mt-auto font-mono uppercase" style={{ color: "var(--stage-accent)" }}>
              {slide.verdict}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffHuntSlide;
