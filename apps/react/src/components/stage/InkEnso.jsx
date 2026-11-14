import { useId, useRef, useState } from "react";
import { useBeatClock, span, easeOutCubic, easeInOutCubic, easeOutBack, shake } from "./beatClock";

/**
 * InkEnso — Musashi's brush, the "find your Way" stage beat.
 *
 * A strip of washi paper and a tag hanging from a brush. Pulling the tag
 * (click, Enter/Space or a downward drag) sweeps the brush round in one
 * stroke: an ensō, the open circle painted in a single breath, then a red
 * seal with 道 (the Way) lands beside it.
 *
 * Everything below is a pure function of the beat clock's `t`:
 *   0    → 0.12  the tag is yanked, the brush lifts
 *   0.12 → 0.72  the stroke runs round the circle, thick to dry
 *   0.72 → 0.86  the seal slams in (easeOutBack), the paper shakes on impact
 *   0.86 → 1     the caption settles
 * Same layout and controls as the evidence thread, so the three title beats
 * read as one set.
 */

const DURATION = 2000;

const ACCENT = "var(--stage-accent, #00ffcc)";
const ON_ACCENT = "var(--stage-on-accent, #020304)";
const TEXT = "var(--stage-text, #ffffff)";
const MONO = "var(--stage-font-mono, ui-monospace, 'SF Mono', Menlo, Consolas, monospace)";
const SERIF = "'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif";
const INK = "#15110d";
const PAPER = "#efe6d2";
const SEAL = "#c8261b";

const V = {
  width: 560,
  height: 220,
  tag: { x: 6, y: 124, w: 102, h: 44, pull: 26, drag: 16 },
  brush: { x: 57, top: 8, len: 92 },
  paper: { x: 116, y: 6, w: 438, h: 208 },
  enso: { cx: 290, cy: 110, r: 76 },
  seal: { x: 438, y: 120, s: 64 },
};

/* The stroke starts lower left and runs clockwise, stopping short of closing. */
const START_DEG = 115;
const SWEEP_DEG = 330;
const STROKE_START = 0.12;
const STROKE_END = 0.72;
const SEAL_START = 0.72;
const SEAL_LAND = 0.82;

const arcPath = (cx, cy, r, from, sweep) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a = { x: cx + r * Math.cos(rad(from)), y: cy + r * Math.sin(rad(from)) };
  const b = { x: cx + r * Math.cos(rad(from + sweep)), y: cy + r * Math.sin(rad(from + sweep)) };
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

export function InkEnso({ fired = false, onPull, label = "FIND YOUR WAY", caption = "MUSASHI // THE WAY", frame }) {
  const t = useBeatClock(fired, DURATION, frame);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `ie${uid}`;
  const { tag, brush, paper, enso, seal } = V;

  const [drag, setDrag] = useState(0);
  const dragRef = useRef(null);
  const heldDrag = useRef(0);
  const suppressClick = useRef(false);

  const pull = () => {
    if (fired) return;
    onPull?.();
  };

  const onKeyDown = (event) => {
    if (fired) return;
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      event.stopPropagation();
      pull();
    }
  };

  const onPointerDown = (event) => {
    if (fired) return;
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg?.getBoundingClientRect?.();
    const scale = rect && rect.width > 0 ? V.width / rect.width : 1;
    dragRef.current = { y: event.clientY, scale };
    suppressClick.current = false;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* capture is a nicety */
    }
  };

  const onPointerMove = (event) => {
    const start = dragRef.current;
    if (!start || fired) return;
    const dy = (event.clientY - start.y) * start.scale;
    if (Math.abs(dy) > 3) suppressClick.current = true;
    const follow = Math.max(0, Math.min(tag.drag, dy * 0.6));
    setDrag(follow);
    if (dy > tag.drag * 1.6) {
      heldDrag.current = follow;
      dragRef.current = null;
      pull();
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDrag(0);
  };

  const onClick = () => {
    // The click that ends a drag (fired or abandoned) is not a second pull.
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    pull();
  };

  /* ---- timeline ---- */
  const yank = easeOutCubic(span(t, 0, 0.08));
  const settle = easeInOutCubic(span(t, 0.08, 0.2));
  const pullOffset = tag.pull * yank - tag.pull * 0.4 * settle;
  const tagOffset = fired ? Math.max(pullOffset, heldDrag.current * (1 - span(t, 0, 0.12))) : drag;
  const stroke = easeInOutCubic(span(t, STROKE_START, STROKE_END));
  const stampIn = span(t, SEAL_START, SEAL_LAND);
  const impact = span(t, SEAL_LAND, 1);
  const paperDx = impact > 0 ? shake(impact, 4) * 3 : 0;
  const paperDy = impact > 0 ? shake(impact, 5) * 1.8 : 0;
  const sealScale = 2.3 - 1.3 * easeOutBack(stampIn);
  const done = span(t, 0.86, 1);

  // The brush tip rides the head of the stroke while it paints.
  const headDeg = START_DEG + SWEEP_DEG * stroke;
  const painting = stroke > 0 && stroke < 1;
  const tip = {
    x: enso.cx + enso.r * Math.cos((headDeg * Math.PI) / 180),
    y: enso.cy + enso.r * Math.sin((headDeg * Math.PI) / 180),
  };

  const main = arcPath(enso.cx, enso.cy, enso.r, START_DEG, SWEEP_DEG);
  const dryOuter = arcPath(enso.cx, enso.cy, enso.r + 6, START_DEG + 40, SWEEP_DEG - 40);
  const dryInner = arcPath(enso.cx, enso.cy, enso.r - 7, START_DEG + 70, SWEEP_DEG - 70);
  // Each strand only shows the share of its arc the brush has passed.
  const strand = (offsetDeg) => Math.max(0, Math.min(1, (stroke * SWEEP_DEG - offsetDeg) / (SWEEP_DEG - offsetDeg)));
  const status = fired && t > 0 ? (stampIn > 0 ? "道 ✓" : "INK") : "PULL ▸";
  const lit = stampIn > 0.5;

  return (
    <svg
      viewBox={`0 0 ${V.width} ${V.height}`}
      width="100%"
      style={{ maxWidth: V.width, display: "block", overflow: "visible" }}
      className={cls}
      data-t={t.toFixed(3)}
    >
      <style>{`
        @keyframes ${cls}-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
        .${cls}-bob { animation: ${cls}-bob 1.6s ease-in-out infinite; }
        .${cls}-focus { opacity: 0; }
        .${cls}-btn:focus { outline: none; }
        .${cls}-btn:focus-visible .${cls}-focus { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .${cls}-bob { animation: none; } }
      `}</style>
      <defs>
        <filter id={`${cls}-bleed`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
      </defs>

      {/* ---- paper ---- */}
      <g transform={`translate(${paperDx.toFixed(2)} ${paperDy.toFixed(2)})`}>
        <rect x={paper.x} y={paper.y} width={paper.w} height={paper.h} rx={4} fill={PAPER} stroke="#263042" strokeWidth={2} />
        <rect x={paper.x + 6} y={paper.y + 6} width={paper.w - 12} height={paper.h - 12} rx={2} fill="none" stroke="#d8ccb1" strokeWidth={1} />

        {/* the circle: one wet stroke and two dry strands, by the share of the sweep painted */}
        <g filter={`url(#${cls}-bleed)`} strokeLinecap="round" fill="none">
          <path d={main} pathLength={1} stroke={INK} strokeWidth={15} strokeDasharray="1" strokeDashoffset={1 - stroke} />
          <path d={dryOuter} pathLength={1} stroke={INK} strokeWidth={2.5} opacity={0.7} strokeDasharray="1" strokeDashoffset={1 - strand(40)} />
          <path d={dryInner} pathLength={1} stroke={INK} strokeWidth={2} opacity={0.55} strokeDasharray="1" strokeDashoffset={1 - strand(70)} />
        </g>

        {/* the brush, riding the stroke */}
        {painting && (
          <g transform={`translate(${tip.x.toFixed(2)} ${tip.y.toFixed(2)}) rotate(${(headDeg + 200).toFixed(1)})`}>
            <rect x={-3} y={-58} width={6} height={44} rx={2} fill="#b8894f" />
            <path d="M -5 -16 Q 0 4 0 6 Q 0 4 5 -16 Z" fill={INK} />
          </g>
        )}

        {/* the seal */}
        {stampIn > 0 && (
          <g
            transform={`translate(${seal.x + seal.s / 2} ${seal.y + seal.s / 2}) scale(${sealScale.toFixed(3)}) rotate(-4)`}
            opacity={Math.min(1, stampIn * 2)}
          >
            <rect x={-seal.s / 2} y={-seal.s / 2} width={seal.s} height={seal.s} rx={6} fill={SEAL} />
            <rect x={-seal.s / 2 + 5} y={-seal.s / 2 + 5} width={seal.s - 10} height={seal.s - 10} rx={3} fill="none" stroke={PAPER} strokeWidth={2} opacity={0.85} />
            <text x={0} y={14} textAnchor="middle" fontSize={40} fontWeight={700} fill={PAPER} style={{ fontFamily: SERIF }}>
              道
            </text>
          </g>
        )}

        <text
          x={paper.x + 18}
          y={paper.y + paper.h - 16}
          fontSize={11}
          fontWeight={800}
          fill={INK}
          opacity={0.35 + 0.65 * done}
          style={{ fontFamily: MONO, letterSpacing: "0.14em" }}
        >
          {caption}
        </text>
      </g>

      {/* ---- the hanging brush and its tag: the pull control ---- */}
      <g
        role="button"
        tabIndex={fired ? -1 : 0}
        aria-label={fired ? `${label}: pulled` : `${label}: pull the brush`}
        aria-disabled={fired ? "true" : undefined}
        className={`${cls}-btn`}
        style={{ cursor: fired ? "default" : "grab", touchAction: "none", outline: "none" }}
        onClick={fired ? undefined : onClick}
        onKeyDown={fired ? undefined : onKeyDown}
        onPointerDown={fired ? undefined : onPointerDown}
        onPointerMove={fired ? undefined : onPointerMove}
        onPointerUp={fired ? undefined : onPointerUp}
        onPointerCancel={fired ? undefined : onPointerUp}
      >
        <rect x={tag.x - 2} y={brush.top} width={tag.w + 4} height={V.height - brush.top} fill="transparent" />
        {/* the brush on its peg: it leaves the peg while it paints */}
        <g opacity={painting ? 0.25 : 1}>
          <circle cx={brush.x} cy={brush.top + 4} r={4} fill="#263042" />
          <rect x={brush.x - 4} y={brush.top + 8} width={8} height={brush.len - 30} rx={3} fill="#b8894f" stroke="#7a5a33" strokeWidth={1} />
          <path
            d={`M ${brush.x - 6} ${brush.top + brush.len - 22} Q ${brush.x} ${brush.top + brush.len + 6} ${brush.x} ${brush.top + brush.len + 8} Q ${brush.x} ${brush.top + brush.len + 6} ${brush.x + 6} ${brush.top + brush.len - 22} Z`}
            fill={INK}
            stroke="#3a3027"
            strokeWidth={1}
          />
        </g>
        <path
          d={`M ${brush.x} ${brush.top + brush.len + 8} L ${brush.x} ${tag.y + tagOffset + 6}`}
          stroke={TEXT}
          strokeOpacity={0.5}
          strokeWidth={1.6}
        />
        <g className={fired ? undefined : `${cls}-bob`}>
          <g transform={`translate(0 ${tagOffset.toFixed(2)})`}>
            <rect
              className={`${cls}-focus`}
              x={tag.x - 3}
              y={tag.y - 3}
              width={tag.w + 6}
              height={tag.h + 6}
              rx={5}
              fill="none"
              stroke={TEXT}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <rect x={tag.x} y={tag.y} width={tag.w} height={tag.h} rx={3} fill="#131a27" stroke={ACCENT} strokeWidth={2} />
            <rect x={tag.x} y={tag.y} width={tag.w} height={tag.h} rx={3} fill={ACCENT} opacity={stampIn} />
            <circle cx={brush.x} cy={tag.y + 6} r={2.6} fill="#05070a" stroke={lit ? ON_ACCENT : ACCENT} strokeWidth={1.2} />
            <text
              x={tag.x + tag.w / 2}
              y={tag.y + 25}
              textAnchor="middle"
              fontSize={label.length > 11 ? 11.5 : 14}
              fontWeight={900}
              fill={lit ? ON_ACCENT : TEXT}
              style={{ fontFamily: MONO }}
            >
              {label}
            </text>
            <text
              x={tag.x + tag.w / 2}
              y={tag.y + 38}
              textAnchor="middle"
              fontSize={10}
              fontWeight={800}
              fill={lit ? ON_ACCENT : ACCENT}
              style={{ fontFamily: MONO, letterSpacing: "0.08em" }}
            >
              {status}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}

export default InkEnso;
