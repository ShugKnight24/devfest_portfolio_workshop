/**
 * BuildVerifyShift — where the time goes, before and after coding agents.
 *
 * Two bars of the same length, one per era, split into deciding what to
 * build, building it and checking it. The first bar fills when the slide
 * comes up; a beat later the second fills, and the room watches the build
 * segment collapse while the check segment swallows the bar. The split is
 * illustrative, not measured: it shows the shape of the change, not a stat.
 */

const ERAS = [
  {
    id: "before",
    label: "Before agents",
    note: "Weeks to build, so a wrong idea cost months.",
    parts: { decide: 20, build: 62, verify: 18 },
  },
  {
    id: "after",
    label: "With agents",
    note: "Minutes to build. Proving it works is the job.",
    parts: { decide: 23, build: 13, verify: 64 },
  },
];

const PARTS = [
  { id: "decide", label: "Decide", color: "var(--stage-text-dim)", text: "var(--stage-text)" },
  { id: "build", label: "Build", color: "var(--stage-accent-alt)", text: "var(--stage-on-accent, #020304)" },
  { id: "verify", label: "Verify", color: "var(--stage-accent)", text: "var(--stage-on-accent, #020304)" },
];

export const BuildVerifyShift = ({ isActive }) => (
  <figure className="m-0 min-w-0 flex-1 text-left" aria-label="Where the time goes: before agents, most of it went into building; with agents, most of it goes into verifying.">
    {ERAS.map((era, row) => (
      <div key={era.id} className="mb-3 last:mb-0">
        <div className="mb-1.5 flex items-baseline justify-between gap-4 font-mono text-xs uppercase tracking-widest">
          <span style={{ color: row ? "var(--stage-accent)" : "var(--stage-text-muted)" }}>{era.label}</span>
          <span className="normal-case tracking-normal" style={{ color: "var(--stage-text-muted)" }}>
            {era.note}
          </span>
        </div>
        <div className="flex h-9 w-full gap-[3px] overflow-hidden" style={{ borderRadius: "var(--stage-radius, 4px)" }}>
          {PARTS.map((part, i) => (
            <div
              key={part.id}
              className="flex items-center overflow-hidden whitespace-nowrap px-3 font-mono text-xs font-bold uppercase tracking-widest motion-reduce:transition-none"
              style={{
                width: isActive ? `${era.parts[part.id]}%` : "0%",
                backgroundColor: part.color,
                color: part.text,
                opacity: isActive ? 1 : 0,
                transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease-out",
                // The second era fills after the first has landed.
                transitionDelay: isActive ? `${300 + row * 1100 + i * 120}ms` : "0ms",
              }}
            >
              {part.label}
            </div>
          ))}
        </div>
      </div>
    ))}
    <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--stage-text-dim)" }}>
      Where the time goes. Illustrative, not measured.
    </figcaption>
  </figure>
);

export default BuildVerifyShift;
