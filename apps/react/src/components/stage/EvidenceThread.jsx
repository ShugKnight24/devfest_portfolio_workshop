import { useId, useRef, useState } from "react";
import { useBeatClock, span, easeOutCubic, easeInOutCubic, easeOutBack, shake } from "./beatClock";

/**
 * EvidenceThread — Reacher's case board, the "bring backup" stage beat.
 *
 * A strip of steel board with the items pinned as index cards, and a spool of
 * red thread with a tag hanging under it. Pulling the tag (click, Enter/Space
 * or a downward drag) spins the spool, the thread runs pin to pin in order,
 * each card straightens and lights the moment the thread reaches its pin, and
 * a rubber stamp lands across the board.
 *
 * Everything below is a pure function of the beat clock's `t`:
 *   0    → 0.25  the tag is yanked, the spool spins, the hanging string goes taut
 *   0.22 → 0.8   the thread's visible length grows along the pin path
 *   0.8  → 1     the stamp slams in (easeOutBack), the board shakes on impact
 * A card's light-up time is solved from the thread length that reaches its pin,
 * so cards light exactly when the red line arrives, whatever the spacing.
 *
 * Cards hang from their pins: the askew rotation pivots on the pin, so the pin
 * (and the thread path through it) never moves while a card straightens.
 * The spool sits LEFT of the board so the thread reads in the same direction as
 * the card order, and the "▸" on the tag points where the thread is about to go.
 */

const DURATION = 2200;

const ACCENT = "var(--stage-accent, #00ffcc)";
const ON_ACCENT = "var(--stage-on-accent, #020304)";
const TEXT = "var(--stage-text, #ffffff)";
const MUTED = "var(--stage-text-muted, #a3adbd)";
const DANGER = "var(--stage-danger, #ef4444)";
const THREAD = "#ff3b3b";
const PIN = "#e11d2e";
const MONO = "var(--stage-font-mono, ui-monospace, 'SF Mono', Menlo, Consolas, monospace)";
const DISPLAY = "var(--stage-font-display, 'Space Grotesk', ui-sans-serif, system-ui, sans-serif)";

export const EVIDENCE_THREAD_DEFAULT_ITEMS = [
  { label: "NEAGLEY", sub: "110th MP" },
  { label: "DIXON", sub: "the numbers" },
  { label: "O'DONNELL", sub: "heavy hands" },
  { label: "REACHER", sub: "not alone" },
];

const VARIANTS = {
  hero: {
    width: 560,
    height: 220,
    maxItems: 5,
    spool: { x: 57, y: 52, r: 25 },
    tag: { x: 6, y: 124, w: 102, h: 44, pull: 26, drag: 16 },
    board: { x: 116, y: 6, w: 438, h: 208 },
    card: { maxW: 84, h: 150, pinY: 34, gap: 12 },
    offsets: [-8, 10, -4, 12, -6],
    askew: [-5, 4, -3, 5, -4],
    stamp: { w: 330, h: 54, size: 31, cy: 78, rot: -6 },
  },
  compact: {
    width: 420,
    height: 100,
    maxItems: 4,
    spool: { x: 41, y: 22, r: 16 },
    tag: { x: 2, y: 52, w: 78, h: 34, pull: 10, drag: 8 },
    board: { x: 86, y: 3, w: 331, h: 94 },
    card: { maxW: 76, h: 50, pinY: 15, gap: 8 },
    offsets: [-3, 3, -2, 3],
    askew: [-4, 3.5, -3, 4],
    stamp: { w: 270, h: 25, size: 17, cy: 76, rot: -2.5 },
  },
};

/* Monospace width estimate: shrink to fit, then truncate below the floor size. */
const MONO_CHAR = 0.62;
const fit = (value, maxWidth, size, minSize) => {
  const text = String(value ?? "").toUpperCase();
  const fitted = maxWidth / (Math.max(1, text.length) * MONO_CHAR);
  if (fitted >= minSize) return { text, size: Math.min(size, fitted) };
  const keep = Math.max(1, Math.floor(maxWidth / (MONO_CHAR * minSize)) - 1);
  return { text: `${text.slice(0, keep)}…`, size: minSize };
};

const initialsOf = (label) =>
  String(label ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("") || "?";

/* Half linear, half ease-in-out: a pure ease-in-out spends too long crawling off
   the spool before the first pin, and the audience needs that first card fast. */
const drawEase = (x) => (x + easeInOutCubic(x)) / 2;

/* Inverse of drawEase by bisection — it is monotone on [0, 1]. */
const invertEase = (y) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (drawEase(mid) < y) lo = mid;
    else hi = mid;
  }
  return hi;
};

const DRAW_START = 0.22;
const DRAW_END = 0.8;
const STAMP_START = 0.8;
const STAMP_LAND = 0.9;

const layoutFor = (variant, items) => {
  const v = VARIANTS[variant] ?? VARIANTS.hero;
  const list = (Array.isArray(items) && items.length ? items : EVIDENCE_THREAD_DEFAULT_ITEMS).slice(0, v.maxItems);
  const n = list.length;
  const inner = v.board.w - 16;
  const pitch = inner / n;
  const cardW = Math.min(v.card.maxW, pitch - v.card.gap);
  const cards = list.map((item, i) => ({
    item,
    x: v.board.x + 8 + pitch * (i + 0.5),
    y: v.board.y + v.card.pinY + v.offsets[i % v.offsets.length],
    askew: v.askew[i % v.askew.length],
  }));

  const start = { x: v.spool.x + v.spool.r * 0.72, y: v.spool.y };
  const points = [start, ...cards.map((c) => ({ x: c.x, y: c.y }))];
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }
  const total = cumulative[cumulative.length - 1];
  cards.forEach((card, i) => {
    card.reach = DRAW_START + (DRAW_END - DRAW_START) * invertEase(cumulative[i + 1] / total);
  });

  return { v, cards, cardW, points, cumulative, total };
};

const pointAt = (points, cumulative, length) => {
  for (let i = 1; i < points.length; i += 1) {
    if (length <= cumulative[i]) {
      const seg = cumulative[i] - cumulative[i - 1] || 1;
      const k = (length - cumulative[i - 1]) / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * k,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * k,
      };
    }
  }
  return points[points.length - 1];
};

const Tick = ({ x, y, r, scale }) =>
  scale <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={r} fill={ACCENT} />
      <path
        d={`M ${-r * 0.45} ${r * 0.02} L ${-r * 0.1} ${r * 0.38} L ${r * 0.5} ${-r * 0.35}`}
        fill="none"
        stroke={ON_ACCENT}
        strokeWidth={r * 0.32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );

const Card = ({ card, w, h, t, compact }) => {
  const lit = span(t, card.reach, card.reach + 0.1);
  const rot = card.askew * (1 - easeOutBack(lit));
  const tick = easeOutBack(span(t, card.reach + 0.02, card.reach + 0.11));
  const snap = span(t, card.reach, card.reach + 0.07);
  const top = compact ? -6 : -8;
  const pad = compact ? 5 : 6;
  const textW = w - pad * 2;
  const label = compact ? fit(card.item?.label, textW, 12, 8) : fit(card.item?.label, textW, 14, 9);
  const sub = compact ? fit(card.item?.sub, textW, 9.5, 7) : fit(card.item?.sub, textW, 10.5, 7.5);
  const textOpacity = 0.5 + 0.5 * lit;

  return (
    <g>
      <g transform={`rotate(${rot.toFixed(3)} ${card.x} ${card.y}) translate(${card.x} ${card.y})`}>
        <rect x={-w / 2 + 2} y={top + 3} width={w} height={h} rx={2} fill="#000" opacity={0.45} />
        <rect x={-w / 2} y={top} width={w} height={h} rx={2} fill="#121826" stroke="#2c3647" strokeWidth={1.5} />
        {lit > 0 && (
          <>
            <rect x={-w / 2} y={top} width={w} height={h} rx={2} fill={ACCENT} opacity={0.1 * lit} />
            <rect
              x={-w / 2}
              y={top}
              width={w}
              height={h}
              rx={2}
              fill="none"
              stroke={ACCENT}
              strokeWidth={compact ? 2 : 2.5}
              opacity={lit}
            />
          </>
        )}

        {!compact && (
          <g opacity={0.55 + 0.45 * lit}>
            {/* Dossier photo: mugshot height lines, a plain silhouette, initials. */}
            <rect x={-w / 2 + pad} y={top + 14} width={textW} height={78} fill="#0a0e16" />
            {[0, 1, 2, 3].map((line) => (
              <line
                key={line}
                x1={-w / 2 + pad}
                x2={-w / 2 + pad + textW}
                y1={top + 26 + line * 17}
                y2={top + 26 + line * 17}
                stroke="#243044"
                strokeWidth={1}
              />
            ))}
            <circle cx={0} cy={top + 44} r={13} fill="#2a3446" />
            <path
              d={`M ${-24} ${top + 92} C ${-22} ${top + 64}, ${22} ${top + 64}, ${24} ${top + 92} Z`}
              fill="#2a3446"
            />
            <text
              x={-w / 2 + pad + 4}
              y={top + 88}
              fontSize={15}
              fontWeight={900}
              fill={lit > 0.5 ? ACCENT : MUTED}
              style={{ fontFamily: MONO }}
            >
              {initialsOf(card.item?.label)}
            </text>
          </g>
        )}

        <text
          x={0}
          y={compact ? top + 29 : top + 114}
          textAnchor="middle"
          fontSize={label.size}
          fontWeight={900}
          fill={TEXT}
          opacity={textOpacity}
          style={{ fontFamily: MONO, letterSpacing: 0 }}
        >
          {label.text}
        </text>
        <text
          x={0}
          y={compact ? top + 43 : top + 132}
          textAnchor="middle"
          fontSize={sub.size}
          fontWeight={700}
          fill={lit > 0.5 ? ACCENT : MUTED}
          opacity={textOpacity}
          style={{ fontFamily: MONO }}
        >
          {sub.text}
        </text>
        {/* Compact cards have no spare corner, so the tick overhangs the card's edge. */}
        <Tick x={compact ? w / 2 - 1 : w / 2 - 9} y={compact ? top + h - 1 : top + h - 9} r={compact ? 6 : 8.5} scale={tick} />
      </g>

      {/* The pin stays put: cards pivot on it. The ring is the "snap" when the thread lands. */}
      {snap > 0 && snap < 1 && (
        <circle
          cx={card.x}
          cy={card.y}
          r={5 + (compact ? 9 : 14) * easeOutCubic(snap)}
          fill="none"
          stroke={THREAD}
          strokeWidth={2.5}
          opacity={1 - snap}
        />
      )}
      <circle cx={card.x + 1} cy={card.y + 2} r={compact ? 4 : 5} fill="#000" opacity={0.5} />
      <circle cx={card.x} cy={card.y} r={(compact ? 4 : 5) + (lit > 0 ? 1 - snap : 0)} fill={PIN} />
      <circle cx={card.x - 1.5} cy={card.y - 1.5} r={1.4} fill="#ffd1d1" />
    </g>
  );
};

export function EvidenceThread({
  fired = false,
  onPull,
  variant = "hero",
  label = "BRING BACKUP",
  items,
  stamp = "BACKUP ARRIVED",
  frame,
}) {
  const t = useBeatClock(fired, DURATION, frame);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `et${uid}`;
  const compact = variant === "compact";
  const { v, cards, cardW, points, cumulative, total } = layoutFor(compact ? "compact" : "hero", items);
  const { spool, tag, board } = v;
  const n = cards.length;

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
    const scale = rect && rect.width > 0 ? v.width / rect.width : 1;
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
  const settle = easeInOutCubic(span(t, 0.08, 0.25));
  const pullOffset = tag.pull * yank - tag.pull * 0.4 * settle;
  const tagOffset = fired
    ? Math.max(pullOffset, heldDrag.current * (1 - span(t, 0, 0.12)))
    : drag;
  const taut = easeOutCubic(span(t, 0, 0.14));
  const spin = 900 * easeOutCubic(span(t, 0.02, 0.85));
  const drawn = total * drawEase(span(t, DRAW_START, DRAW_END));
  const connected = cards.filter((card) => t >= card.reach).length;
  const confirm = span(t, STAMP_START, STAMP_LAND);
  const stampIn = span(t, STAMP_START, STAMP_LAND);
  const impact = span(t, STAMP_LAND, 1);
  const boardDx = impact > 0 ? shake(impact, 4) * (compact ? 2 : 3.5) : 0;
  const boardDy = impact > 0 ? shake(impact, 5) * (compact ? 1.2 : 2) : 0;
  const woundR = spool.r * (0.74 - 0.18 * span(t, DRAW_START, DRAW_END));

  const tagTop = tag.y + tagOffset;
  const stringBow = (1 - taut) * (compact ? 7 : 11);
  const head = drawn > 0 && drawn < total ? pointAt(points, cumulative, drawn) : null;

  const tagLabel = fit(label, tag.w - 12, compact ? 11 : 14, compact ? 7.5 : 9);
  const status = fired && t > 0 ? (confirm > 0 ? `${n}/${n} ✓` : `${connected}/${n}`) : "PULL ▸";
  const stampText = fit(stamp, v.stamp.w - 36, v.stamp.size, compact ? 12 : 16);
  const stampScale = 2.3 - 1.3 * easeOutBack(stampIn);
  const threadPath = points.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const bx = board.x;
  const by = board.y;

  return (
    <svg
      viewBox={`0 0 ${v.width} ${v.height}`}
      width="100%"
      style={{ maxWidth: v.width, display: "block", overflow: "visible" }}
      className={cls}
      data-variant={compact ? "compact" : "hero"}
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

      {/* ---- board ---- */}
      <g transform={`translate(${boardDx.toFixed(2)} ${boardDy.toFixed(2)})`}>
        <rect x={bx} y={by} width={board.w} height={board.h} rx={4} fill="#0b0f17" stroke="#263042" strokeWidth={2} />
        <rect
          x={bx + 4}
          y={by + 4}
          width={board.w - 8}
          height={board.h - 8}
          rx={2}
          fill="none"
          stroke="#1a2130"
          strokeWidth={1}
        />
        {Array.from({ length: compact ? 26 : 40 }, (_, i) => (
          <circle
            key={i}
            cx={bx + 10 + ((i * 97) % (board.w - 20))}
            cy={by + 8 + ((i * 53) % (board.h - 16))}
            r={i % 3 === 0 ? 1.2 : 0.8}
            fill="#1c2433"
          />
        ))}
        {[
          [bx + 8, by + 8],
          [bx + board.w - 8, by + 8],
          [bx + 8, by + board.h - 8],
          [bx + board.w - 8, by + board.h - 8],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="#2f3a4e" />
        ))}

        {compact && (
          /* The compact strip keeps a band under the cards for the stamp, so it never hides a label. */
          <rect
            x={bx + board.w / 2 - v.stamp.w / 2}
            y={by + v.stamp.cy - v.stamp.h / 2}
            width={v.stamp.w}
            height={v.stamp.h}
            rx={3}
            fill="none"
            stroke="#1f2837"
            strokeWidth={1.25}
            strokeDasharray="5 4"
          />
        )}
        {cards.map((card, i) => (
          <Card key={i} card={card} w={cardW} h={v.card.h} t={t} compact={compact} />
        ))}

        {/* ---- the thread, drawn by visible length ---- */}
        {drawn > 0 && (
          <>
            <path
              d={threadPath}
              fill="none"
              stroke="#000"
              strokeOpacity={0.45}
              strokeWidth={compact ? 3 : 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${drawn.toFixed(2)} ${(total + 10).toFixed(2)}`}
              transform="translate(1 2)"
            />
            <path
              d={threadPath}
              fill="none"
              stroke={THREAD}
              strokeWidth={compact ? 2 : 2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${drawn.toFixed(2)} ${(total + 10).toFixed(2)}`}
            />
          </>
        )}
        {head && (
          <>
            <circle cx={head.x} cy={head.y} r={compact ? 4 : 6} fill={THREAD} opacity={0.35} />
            <circle cx={head.x} cy={head.y} r={compact ? 1.8 : 2.4} fill="#ffe4e4" />
          </>
        )}
        {cards.map((card, i) =>
          t >= card.reach ? <circle key={i} cx={card.x} cy={card.y} r={compact ? 4 : 5} fill={PIN} /> : null,
        )}

        {/* ---- stamp ---- */}
        {stampIn > 0 && (
          <g
            transform={`translate(${bx + board.w / 2} ${by + v.stamp.cy}) rotate(${v.stamp.rot}) scale(${stampScale.toFixed(3)})`}
            opacity={Math.min(1, stampIn * 4) * 0.94}
          >
            <rect
              x={-v.stamp.w / 2}
              y={-v.stamp.h / 2}
              width={v.stamp.w}
              height={v.stamp.h}
              rx={compact ? 4 : 6}
              fill="#05070a"
              fillOpacity={0.86}
              stroke={DANGER}
              strokeWidth={compact ? 3 : 4.5}
            />
            <rect
              x={-v.stamp.w / 2 + (compact ? 4 : 6)}
              y={-v.stamp.h / 2 + (compact ? 4 : 6)}
              width={v.stamp.w - (compact ? 8 : 12)}
              height={v.stamp.h - (compact ? 8 : 12)}
              rx={compact ? 2 : 3}
              fill="none"
              stroke={DANGER}
              strokeWidth={compact ? 1.2 : 1.75}
            />
            <text
              x={0}
              y={stampText.size * 0.36}
              textAnchor="middle"
              fontSize={stampText.size}
              fontWeight={900}
              fill={DANGER}
              style={{ fontFamily: DISPLAY, letterSpacing: "0.02em" }}
            >
              {stampText.text}
            </text>
            {/* Rubber-stamp dropouts, fixed so every render inks the same. */}
            {[
              [-0.36, -0.1, 7, 2],
              [-0.08, 0.22, 11, 1.6],
              [0.2, -0.18, 6, 2.2],
              [0.41, 0.12, 9, 1.8],
              [-0.46, 0.3, 5, 1.5],
            ].map(([fx, fy, len, hgt], i) => (
              <rect
                key={i}
                x={fx * v.stamp.w}
                y={fy * v.stamp.h}
                width={len * (compact ? 0.7 : 1)}
                height={hgt}
                fill="#0b0f17"
                opacity={0.75}
              />
            ))}
          </g>
        )}
      </g>

      {/* ---- spool ---- */}
      <g>
        <rect x={spool.x - 5} y={4} width={10} height={spool.y - 4} fill="#1f2735" />
        <rect x={spool.x - (compact ? 14 : 20)} y={2} width={compact ? 28 : 40} height={5} rx={1} fill="#2f3a4e" />
        <circle cx={spool.x} cy={spool.y} r={spool.r} fill="#161c28" stroke="#3a4558" strokeWidth={2} />
        <circle cx={spool.x} cy={spool.y} r={woundR} fill="#9f1624" />
        {[0.55, 0.8].map((k) => (
          <circle key={k} cx={spool.x} cy={spool.y} r={woundR * k} fill="none" stroke={THREAD} strokeWidth={1} opacity={0.6} />
        ))}
        <g transform={`rotate(${spin.toFixed(2)} ${spool.x} ${spool.y})`}>
          {[0, 120, 240].map((a) => (
            <line
              key={a}
              x1={spool.x}
              y1={spool.y}
              x2={spool.x + Math.cos((a * Math.PI) / 180) * spool.r * 0.9}
              y2={spool.y + Math.sin((a * Math.PI) / 180) * spool.r * 0.9}
              stroke="#d7dde8"
              strokeWidth={compact ? 1.6 : 2.2}
              strokeLinecap="round"
              opacity={0.8}
            />
          ))}
          <circle cx={spool.x + spool.r * 0.9} cy={spool.y} r={compact ? 1.8 : 2.5} fill="#d7dde8" />
        </g>
        <circle cx={spool.x} cy={spool.y} r={spool.r * 0.24} fill="#0b0f17" stroke="#3a4558" strokeWidth={1.5} />
        {drawn <= 0 && (
          /* The loose end, before the pull draws it out across the board. */
          <path
            d={`M ${points[0].x} ${points[0].y} q ${compact ? 8 : 12} ${compact ? 3 : 4} ${compact ? 10 : 16} ${compact ? 12 : 18}`}
            fill="none"
            stroke={THREAD}
            strokeWidth={compact ? 1.6 : 2}
            strokeLinecap="round"
            opacity={0.8}
          />
        )}
      </g>

      {/* ---- the tag: the pull control ---- */}
      <g
        role="button"
        tabIndex={fired ? -1 : 0}
        aria-label={fired ? `${label}: pulled` : `${label}: pull the thread`}
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
        {/* A generous invisible hit area over the string and tag. */}
        <rect x={tag.x - 2} y={spool.y + spool.r} width={tag.w + 4} height={v.height - spool.y - spool.r} fill="transparent" />
        <path
          d={`M ${spool.x} ${spool.y + spool.r * 0.6} Q ${spool.x + stringBow} ${(spool.y + tagTop) / 2 + 4} ${spool.x} ${tagTop + 6}`}
          fill="none"
          stroke={THREAD}
          strokeWidth={compact ? 1.8 : 2.4}
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
            <rect x={tag.x} y={tag.y} width={tag.w} height={tag.h} rx={3} fill={ACCENT} opacity={confirm} />
            <circle cx={spool.x} cy={tag.y + 6} r={2.6} fill="#05070a" stroke={confirm > 0.5 ? ON_ACCENT : ACCENT} strokeWidth={1.2} />
            <text
              x={tag.x + tag.w / 2}
              y={tag.y + (compact ? 20 : 25)}
              textAnchor="middle"
              fontSize={tagLabel.size}
              fontWeight={900}
              fill={confirm > 0.5 ? ON_ACCENT : TEXT}
              style={{ fontFamily: MONO }}
            >
              {tagLabel.text}
            </text>
            <text
              x={tag.x + tag.w / 2}
              y={tag.y + (compact ? 30 : 38)}
              textAnchor="middle"
              fontSize={compact ? 8 : 10}
              fontWeight={800}
              fill={confirm > 0.5 ? ON_ACCENT : ACCENT}
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

export default EvidenceThread;
