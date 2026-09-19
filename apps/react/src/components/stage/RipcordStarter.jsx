import { useEffect, useRef, useState } from "react";
import { useBeatClock, useIdleClock, span, easeOutCubic, easeOutBack, shake } from "./beatClock";

/**
 * RipcordStarter — the "pull the cord" stage beat.
 *
 * A Pochita-orange chainsaw engine with a T-handle ripcord. The next click
 * yanks the cord, the engine catches and shakes, and the chain revs up until
 * the saw ends lit and running. Every pixel is a pure function of `t` from the
 * shared beat clock:
 *
 *   0    -> 0.3   pull: handle yanked out, cord taut, housing kicks back
 *   0.3  -> 0.55  catch: cord snaps home, engine shakes, exhaust and sparks
 *   0.5  -> 1     rev: teeth race round the bar, hot glow, "VRRRMM", RUNNING
 *
 * Past t = 1 the saw does not stop. An idle clock takes over the parts of a
 * running engine that should never settle — the chain, the housing buzz, the
 * heat in the glow — at the exact chain speed the rev ended on, so the handover
 * is invisible. It runs until the component leaves the screen, which is what
 * unmounts it: the saw idles for as long as the slide is up.
 *
 * The saw is drawn once in "saw space" (hero scale, origin at the housing
 * centre) and placed per variant with a single transform, so hero and compact
 * are the same beat at different sizes. The chain teeth are placed along the
 * bar's stadium outline by arc length, which is what lets them lap the bar as
 * a function of `t` instead of a CSS animation.
 *
 * `bleeding` is the other input: it wets the chain, hangs drips off the bar and
 * throws spray off the nose while the chain turns. It is driven by the track
 * playing, not by the pull, so the saw can be bloody before it ever starts.
 *
 * The whole drawing is the button (a big target for a presenter), but the drag
 * gesture tracks horizontal pointer travel: past a threshold it pulls. The only
 * CSS animation is the armed handle's idle bob, switched off for reduced motion.
 */

const DURATION = 1800;

const ACCENT = "var(--stage-accent, #00ffcc)";
const ACCENT_ALT = "var(--stage-accent-alt, #ffcc00)";
const TEXT = "var(--stage-text, #ffffff)";
const TEXT_MUTED = "var(--stage-text-muted, #a3adbd)";
const FONT_MONO = "var(--stage-font-mono, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace)";
const FONT_DISPLAY = "var(--stage-font-display, 'Space Grotesk', 'Arial Black', Impact, sans-serif)";

const ORANGE = "#F0892B";
const ORANGE_SHADOW = "#C4621A";
const ORANGE_LIGHT = "#F7A95E";
const STEEL = "#9AA4B2";
const STEEL_DARK = "#6B7482";
const CHAIN = "#1B2029";
const INK = "#14181F";
const ROPE = "#E9E3D2";
const BLOOD = "#D7263D";
const BLOOD_DARK = "#8E1128";

const VARIANTS = {
  hero: {
    width: 560,
    height: 220,
    maxWidth: 560,
    origin: [304, 116],
    scale: 1,
    pull: 130,
    dragThreshold: 40,
    label: { x: 436, y: 206, size: 20, anchor: "middle" },
    vroom: { x: 466, y: 50, size: 34 },
    guide: true,
  },
  compact: {
    width: 320,
    height: 90,
    maxWidth: 320,
    origin: [120, 50],
    scale: 0.4,
    pull: 80,
    dragThreshold: 20,
    label: { x: 316, y: 50, size: 11.5, anchor: "end" },
    vroom: { x: 266, y: 24, size: 19 },
    guide: false,
  },
};

/* Bar geometry in saw space: a stadium from the nose (X0) to where it vanishes
   into the housing (X1). The chain runs along the top toward the nose. */
const X0 = -228;
const X1 = -40;
const CY = 14;
const R = 17;
const LEN = X1 - X0;
const PERIM = 2 * LEN + 2 * Math.PI * R;
const TOOTH_COUNT = 26;
const TOOTH_STEP = PERIM / TOOTH_COUNT;
const LAPS = 3;

/* Laps per second the chain is doing as the rev ends — derived, not guessed, so
   the idle picks up at exactly the speed the beat handed over. */
const IDLE_LAPS_PER_SECOND = ((LAPS / 0.9) * 2) / (DURATION / 1000);
const IDLE_BUZZ_HZ = 13;

/* Blood. Each drip hangs from the underside of the bar at its own x, swells,
   lets go and falls on its own period, so the loop never pulses in unison.
   Phase, not state — the whole thing is a function of the gore clock. */
const WET_IN = 0.6;
const DRIPS = [
  { x: -196, period: 1.7, delay: 0.0, fall: 60 },
  { x: -150, period: 2.3, delay: 0.7, fall: 76 },
  { x: -104, period: 1.9, delay: 1.2, fall: 54 },
  { x: -64, period: 2.6, delay: 0.3, fall: 68 },
  { x: X0 - 4, period: 2.1, delay: 1.5, fall: 84 },
];
/* Flung off the nose once the chain is turning. Angles fan up and back, the
   way a saw throws it. */
const SPRAY = [
  { angle: 202, speed: 190, period: 0.55, delay: 0.0, r: 3.4 },
  { angle: 218, speed: 240, period: 0.7, delay: 0.12, r: 2.6 },
  { angle: 186, speed: 210, period: 0.62, delay: 0.26, r: 3 },
  { angle: 232, speed: 170, period: 0.78, delay: 0.4, r: 2.2 },
  { angle: 168, speed: 230, period: 0.66, delay: 0.55, r: 2.8 },
  { angle: 245, speed: 200, period: 0.72, delay: 0.68, r: 2 },
];
const GRAVITY = 320;
const SPATTER = [
  { x: X0 - 34, y: CY + 30, r: 3.2 },
  { x: X0 - 52, y: CY + 12, r: 2.1 },
  { x: X0 - 22, y: CY + 44, r: 1.6 },
  { x: X0 - 62, y: CY - 22, r: 2.6 },
  { x: X0 - 12, y: CY - 36, r: 1.9 },
];

/* A drip: bead swells while it holds on, then falls and stretches. */
const dripAt = (phase, fall) => {
  if (phase < 0.45) {
    const hold = phase / 0.45;
    return { drop: 0, r: 1.6 + hold * 2.6, stretch: 1 + hold * 0.5, opacity: 1 };
  }
  const f = (phase - 0.45) / 0.55;
  return {
    drop: fall * f * f,
    r: 3.6 - f * 1.2,
    stretch: 1 + f * 2.4,
    opacity: 1 - f * f,
  };
};

const CORD_Y = 10;
const EXIT_X = 76;
const HANDLE_REST = 98;

const pointOnBar = (s) => {
  const d = ((s % PERIM) + PERIM) % PERIM;
  if (d < LEN) return { x: X1 - d, y: CY - R, tx: -1, ty: 0, nx: 0, ny: -1 };
  if (d < LEN + Math.PI * R) {
    const a = (d - LEN) / R;
    return {
      x: X0 - R * Math.sin(a),
      y: CY - R * Math.cos(a),
      tx: -Math.cos(a),
      ty: Math.sin(a),
      nx: -Math.sin(a),
      ny: -Math.cos(a),
    };
  }
  if (d < 2 * LEN + Math.PI * R) {
    return { x: X0 + (d - LEN - Math.PI * R), y: CY + R, tx: 1, ty: 0, nx: 0, ny: 1 };
  }
  const a = (d - 2 * LEN - Math.PI * R) / R;
  return {
    x: X1 + R * Math.sin(a),
    y: CY + R * Math.cos(a),
    tx: Math.cos(a),
    ty: -Math.sin(a),
    nx: Math.sin(a),
    ny: Math.cos(a),
  };
};

const stadium = (r) =>
  `M ${X1} ${CY - r} L ${X0} ${CY - r} A ${r} ${r} 0 0 0 ${X0} ${CY + r} L ${X1} ${CY + r} A ${r} ${r} 0 0 0 ${X1} ${CY - r} Z`;

/* Chain travel: a quick quadratic spin-up that joins a constant speed, so the
   live chain never looks like it is winding down before the final frame. */
const chainTravel = (x) => (x < 0.2 ? (x * x) / 0.4 : x - 0.1) / 0.9;

const HOUSING =
  "M -54 -38 Q -54 -52 -38 -52 L 46 -52 Q 72 -52 74 -26 L 76 30 Q 76 50 56 50 L -42 50 Q -58 50 -58 34 Z";
const HOUSING_SHADOW = "M -58 22 L 76 22 L 76 30 Q 76 50 56 50 L -42 50 Q -58 50 -58 34 Z";

const SPARK_ANGLES = [130, 150, 170, 192, 212, 232, 120, 160];
const MOTION_LINES = [
  { x: -200, y: CY - R - 12, len: 46 },
  { x: -120, y: CY - R - 20, len: 62 },
  { x: -170, y: CY + R + 13, len: 54 },
  { x: -92, y: CY + R + 21, len: 38 },
  { x: X0 - R - 44, y: CY - 6, len: 30 },
  { x: X0 - R - 58, y: CY + 7, len: 40 },
];
const PUFFS = [0, 1, 2];
const BURST = [-165, -135, -105, -75, -45, -15, 12, 168];

const cordPath = (hx, sag) => {
  const mx = (EXIT_X + hx) / 2;
  return `M ${EXIT_X} ${CORD_Y} Q ${mx} ${CORD_Y + sag} ${hx} ${CORD_Y}`;
};

const css = `
.rcs-btn { cursor: grab; outline: none; }
.rcs-btn[aria-disabled="true"] { cursor: default; }
.rcs-btn:active { cursor: grabbing; }
.rcs-ring { opacity: 0; }
.rcs-btn:focus-visible .rcs-ring { opacity: 1; }
.rcs-bob { transform-box: fill-box; transform-origin: 0% 50%; animation: rcs-bob 1.6s ease-in-out infinite; }
@keyframes rcs-bob {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  45% { transform: translateX(5px) rotate(3deg); }
  60% { transform: translateX(3px) rotate(-2deg); }
}
.rcs-hint { animation: rcs-hint 1.6s ease-in-out infinite; }
@keyframes rcs-hint { 0%, 100% { opacity: 0.55; } 45% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .rcs-bob, .rcs-hint { animation: none; }
}
`;

export function RipcordStarter({
  fired = false,
  onPull,
  variant = "hero",
  label = "PULL THE CORD",
  firedLabel = "RUNNING",
  bleeding = false,
  frame,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.hero;
  const t = useBeatClock(fired, DURATION, frame);
  /* A frozen `frame` is for previews and tests; never idle under one. */
  const running = t >= 1 && typeof frame !== "number";
  const idle = useIdleClock(running);
  /* Blood runs on its own clock, not the engine's: the track can start before
     the cord is pulled, and the saw should already be wet when it catches. */
  const gore = useIdleClock(bleeding && typeof frame !== "number");
  const svgRef = useRef(null);
  const pulledRef = useRef(false);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState(0);

  useEffect(() => {
    if (!fired) pulledRef.current = false;
  }, [fired]);

  const inert = fired;

  const pull = () => {
    if (fired || pulledRef.current) return;
    pulledRef.current = true;
    dragRef.current = null;
    setDrag(0);
    onPull?.();
  };

  const toViewBox = (dx) => {
    const rect = svgRef.current?.getBoundingClientRect?.();
    return rect && rect.width > 0 ? (dx * v.width) / rect.width : dx;
  };

  const onPointerDown = (event) => {
    if (inert) return;
    dragRef.current = { startX: event.clientX, moved: 0 };
    suppressClickRef.current = false;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* capture is a nicety; synthetic events have no live pointer */
    }
  };

  const onPointerMove = (event) => {
    const state = dragRef.current;
    if (!state || inert) return;
    const dx = toViewBox(event.clientX - state.startX);
    state.moved = Math.max(state.moved, Math.abs(dx));
    if (dx >= v.dragThreshold) {
      suppressClickRef.current = true;
      pull();
      return;
    }
    setDrag(Math.max(0, dx));
  };

  const endDrag = () => {
    const state = dragRef.current;
    if (state && state.moved > 6) suppressClickRef.current = true;
    dragRef.current = null;
    setDrag(0);
  };

  const onClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    pull();
  };

  const onKeyDown = (event) => {
    if (inert) return;
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      event.stopPropagation();
      pull();
    }
  };

  /* ---- timeline ---- */
  const pullP = span(t, 0, 0.3);
  const snapP = span(t, 0.3, 0.42);
  const catchP = span(t, 0.3, 0.58);
  const revP = span(t, 0.5, 1);
  const lit = easeOutCubic(span(t, 0.42, 0.7));
  const glow = easeOutCubic(span(t, 0.5, 0.8));
  const heat = running ? 1 + 0.16 * Math.sin(idle * Math.PI * 2 * 2.6) : 1;
  const vroomP = span(t, 0.55, 0.8);
  const labelOut = span(t, 0.44, 0.52);
  const labelIn = span(t, 0.52, 0.64);

  const dragUnits = Math.min((drag / v.scale) * 0.55, v.pull * 0.3);
  const yank = v.pull * easeOutCubic(pullP);
  const pulledX = HANDLE_REST + Math.max(yank, dragUnits);
  const handleX =
    t < 0.3
      ? pulledX
      : Math.max(HANDLE_REST - 6, HANDLE_REST + v.pull * (1 - easeOutBack(snapP)));
  const sag = t < 0.3 ? 14 * (1 - easeOutCubic(pullP * 1.6 > 1 ? 1 : pullP * 1.6)) : 10 * shake(snapP, 2) * (1 - snapP) + 6 * snapP;

  const kick = easeOutBack(pullP) * (1 - easeOutCubic(span(t, 0.3, 0.44)));
  const hum = Math.sin(t * 220) * 0.9 * span(t, 0.55, 0.7) * (1 - span(t, 0.9, 1));
  const buzz = running ? Math.sin(idle * IDLE_BUZZ_HZ * Math.PI * 2) : 0;
  const buzzY = running ? Math.sin(idle * IDLE_BUZZ_HZ * Math.PI * 2 * 1.7) : 0;
  const shakeX = shake(catchP, 7) * 6 + kick * 7 + hum + buzz * 1.2;
  const shakeY = shake(catchP, 9) * 3.5 + hum * 0.6 + buzzY * 0.6;
  const tilt = kick * 5 + shake(catchP, 5) * 2.5;

  const chainOffset = PERIM * (LAPS * chainTravel(revP) + IDLE_LAPS_PER_SECOND * idle);
  /* Reduced motion pins `gore` at 0, so the saw goes wet and stays wet rather
     than never bleeding at all. */
  const wet = bleeding ? Math.min(1, gore / WET_IN || 1) : 0;
  const armed = t === 0;
  const eyesOpen = t >= 0.32;
  const burstP = span(t, 0.3, 0.46);
  const [ox, oy] = v.origin;

  const teeth = [];
  const wetTips = [];
  for (let i = 0; i < TOOTH_COUNT; i += 1) {
    const p = pointOnBar(i * TOOTH_STEP + chainOffset);
    const back = [p.x - p.tx * 4.5, p.y - p.ty * 4.5];
    const tip = [p.x + p.tx * 1.5 + p.nx * 6, p.y + p.ty * 1.5 + p.ny * 6];
    const front = [p.x + p.tx * 3.5, p.y + p.ty * 3.5];
    teeth.push(
      <path
        key={i}
        d={`M ${back[0].toFixed(2)} ${back[1].toFixed(2)} L ${tip[0].toFixed(2)} ${tip[1].toFixed(2)} L ${front[0].toFixed(2)} ${front[1].toFixed(2)} Z`}
        fill={CHAIN}
      />,
    );
    if (wet > 0) {
      wetTips.push(
        <circle key={i} cx={tip[0].toFixed(2)} cy={tip[1].toFixed(2)} r={1.7} fill={BLOOD} opacity={wet} />,
      );
    }
  }

  const drips =
    wet > 0
      ? DRIPS.map((d, i) => {
          const phase = (((gore + d.delay) % d.period) + d.period) % d.period / d.period;
          const { drop, r, stretch, opacity } = dripAt(phase, d.fall);
          return (
            <g key={i} opacity={opacity * wet}>
              {drop < 2 && (
                <path
                  d={`M ${d.x - r * 0.8} ${CY + R} Q ${d.x} ${CY + R + r * 1.4} ${d.x + r * 0.8} ${CY + R} Z`}
                  fill={BLOOD_DARK}
                />
              )}
              <ellipse
                cx={d.x}
                cy={CY + R + r + drop}
                rx={r}
                ry={r * stretch}
                fill={BLOOD}
              />
            </g>
          );
        })
      : null;

  /* Spray only once the chain is actually turning — a still saw drips, a
     running one throws it. */
  const spray =
    wet > 0 && running
      ? SPRAY.map((sp, i) => {
          const phase = (((gore + sp.delay) % sp.period) + sp.period) % sp.period / sp.period;
          const life = phase * sp.period;
          const rad = (sp.angle * Math.PI) / 180;
          return (
            <circle
              key={i}
              cx={X0 - R * 0.4 + Math.cos(rad) * sp.speed * life}
              cy={CY + Math.sin(rad) * sp.speed * life + GRAVITY * life * life}
              r={sp.r * (1 - phase * 0.4)}
              fill={BLOOD}
              opacity={(1 - phase) * wet}
            />
          );
        })
      : null;

  const sparks = SPARK_ANGLES.map((deg, i) => {
    const sp = span(t, 0.3 + i * 0.012, 0.54 + i * 0.012);
    if (sp <= 0 || sp >= 1) return null;
    const rad = (deg * Math.PI) / 180;
    const dist = 8 + easeOutCubic(sp) * (26 + (i % 3) * 12);
    const sx = X0 - R * 0.6;
    const sy = CY + R * 0.7;
    const len = 16 * (1 - sp) + 3;
    return (
      <line
        key={i}
        x1={sx + Math.cos(rad) * (dist - len)}
        y1={sy + Math.sin(rad) * (dist - len)}
        x2={sx + Math.cos(rad) * dist}
        y2={sy + Math.sin(rad) * dist}
        strokeWidth={3.5}
        strokeLinecap="round"
        style={{ stroke: ACCENT_ALT, opacity: 1 - sp * 0.6 }}
      />
    );
  });

  const puffs = PUFFS.map((i) => {
    const pp = span(t, 0.3 + i * 0.06, 0.66 + i * 0.06);
    if (pp <= 0 || pp >= 1) return null;
    const e = easeOutCubic(pp);
    const cx = 60 + e * (30 + i * 14);
    const cy = -58 - e * (34 + i * 4);
    const r = 5 + e * (9 + i * 2);
    return (
      <g key={i} fill="#C9D1DC" opacity={0.7 * (1 - pp)}>
        <circle cx={cx} cy={cy} r={r} />
        <circle cx={cx + r * 0.9} cy={cy + r * 0.3} r={r * 0.7} />
        <circle cx={cx - r * 0.7} cy={cy + r * 0.45} r={r * 0.6} />
      </g>
    );
  });

  const vroomScale = 1 + (1 - easeOutBack(vroomP)) * 1.1;
  const vroomLetters = "VRRRMM".split("");

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${v.width} ${v.height}`}
      width="100%"
      style={{ maxWidth: v.maxWidth, display: "block", overflow: "visible", touchAction: "none" }}
      data-variant={variant}
      data-state={fired ? "fired" : "armed"}
    >
      <style>{css}</style>
      <g
        className="rcs-btn"
        role="button"
        tabIndex={inert ? -1 : 0}
        aria-label={fired ? firedLabel : label}
        aria-disabled={inert ? "true" : "false"}
        onClick={inert ? undefined : onClick}
        onKeyDown={inert ? undefined : onKeyDown}
        onPointerDown={inert ? undefined : onPointerDown}
        onPointerMove={inert ? undefined : onPointerMove}
        onPointerUp={inert ? undefined : endDrag}
        onPointerCancel={inert ? undefined : endDrag}
      >
        <rect x={0} y={0} width={v.width} height={v.height} fill="transparent" />

        {/* pull-path guide (hero only, armed only) */}
        {v.guide && pullP < 1 && (
          <g opacity={(1 - pullP) * 0.55}>
            <line
              x1={ox + (HANDLE_REST + 20) * v.scale}
              y1={oy + CORD_Y}
              x2={ox + (HANDLE_REST + v.pull + 4) * v.scale}
              y2={oy + CORD_Y}
              strokeWidth={2}
              strokeDasharray="5 7"
              style={{ stroke: TEXT_MUTED }}
            />
          </g>
        )}
        {pullP < 1 && (
          <text
            className={armed ? "rcs-hint" : undefined}
            x={ox + (HANDLE_REST + v.pull + 12) * v.scale}
            y={oy + (CORD_Y + 1) * v.scale}
            dominantBaseline="middle"
            fontSize={v.guide ? 26 : 16}
            fontWeight={700}
            opacity={1 - pullP}
            style={{ fill: ACCENT, fontFamily: FONT_MONO }}
          >
            ▸
          </text>
        )}

        <g transform={`translate(${ox + shakeX * v.scale} ${oy + shakeY * v.scale}) scale(${v.scale})`}>
          <g transform={`rotate(${tilt.toFixed(3)})`}>
            {/* motion lines — they appear with the rev and hold at t = 1 */}
            {glow > 0 &&
              MOTION_LINES.map((m, i) => {
                const grow = easeOutCubic(span(t, 0.56 + i * 0.03, 0.8 + i * 0.02));
                return (
                  <line
                    key={i}
                    x1={m.x}
                    y1={m.y}
                    x2={m.x + m.len * grow}
                    y2={m.y}
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{ stroke: ACCENT, opacity: 0.85 * grow }}
                  />
                );
              })}

            {/* hot glow behind the bar */}
            {glow > 0 && (
              <>
                <path d={stadium(R + 12)} style={{ fill: ACCENT, opacity: 0.12 * glow * heat }} />
                <path d={stadium(R + 6)} style={{ fill: ACCENT, opacity: 0.22 * glow * heat }} />
              </>
            )}

            {/* blood that already landed — behind the bar, like it was thrown */}
            {wet > 0 &&
              SPATTER.map((sp, i) => (
                <circle key={i} cx={sp.x} cy={sp.y} r={sp.r} fill={BLOOD_DARK} opacity={0.75 * wet} />
              ))}

            {/* guide bar */}
            <path d={stadium(R - 1)} fill={STEEL} />
            <path d={`M ${X1} ${CY + 5} L ${X0 + 4} ${CY + 5}`} stroke={STEEL_DARK} strokeWidth={3} strokeLinecap="round" />
            <circle cx={X0 + 2} cy={CY} r={5} fill={STEEL_DARK} />
            {glow > 0 && (
              <path
                d={`M ${X1} ${CY - 3} L ${X0 + 2} ${CY - 3}`}
                strokeWidth={5}
                strokeLinecap="round"
                style={{ stroke: ACCENT, opacity: 0.9 * glow }}
              />
            )}

            {/* chain */}
            <path
              d={stadium(R)}
              fill="none"
              strokeWidth={3.5}
              strokeDasharray="7 3"
              strokeDashoffset={-chainOffset}
              style={{ stroke: glow > 0.5 ? ACCENT : CHAIN }}
            />
            {teeth}
            {wetTips}
            {wet > 0 && (
              <path
                d={stadium(R)}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ stroke: BLOOD, opacity: 0.6 * wet }}
              />
            )}
            {drips}
            {spray}

            {sparks}
            {puffs}

            {/* catch impact burst */}
            {burstP > 0 && burstP < 1 &&
              BURST.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const r0 = 88 + easeOutCubic(burstP) * 26;
                const r1 = r0 + 18 * (1 - burstP);
                return (
                  <line
                    key={deg}
                    x1={10 + Math.cos(rad) * r0}
                    y1={Math.sin(rad) * r0 * 0.8}
                    x2={10 + Math.cos(rad) * r1}
                    y2={Math.sin(rad) * r1 * 0.8}
                    strokeWidth={4}
                    strokeLinecap="round"
                    style={{ stroke: ACCENT_ALT, opacity: 1 - burstP }}
                  />
                );
              })}

            {/* rear handle loop */}
            <path d="M -8 -50 Q -6 -80 24 -80 Q 54 -80 56 -50" fill="none" stroke="#56606F" strokeWidth={12} strokeLinecap="round" />
            <path d="M -8 -50 Q -6 -80 24 -80 Q 54 -80 56 -50" fill="none" stroke="#2A303B" strokeWidth={6} strokeLinecap="round" />

            {/* ears / stubby tail — Pochita nods */}
            <path d="M -48 -46 Q -52 -66 -36 -62 Q -30 -56 -30 -50 Z" fill={ORANGE_SHADOW} />
            <path d="M 72 -8 Q 92 -10 96 -28 Q 98 -36 90 -34 Q 86 -20 74 -22 Z" fill={ORANGE} />

            {/* exhaust port */}
            <rect x={50} y={-60} width={16} height={10} rx={3} fill={INK} />

            {/* housing */}
            <path d={HOUSING} fill={ORANGE} />
            <path d={HOUSING_SHADOW} fill={ORANGE_SHADOW} />
            <path d="M -42 -42 L 40 -42" stroke={ORANGE_LIGHT} strokeWidth={5} strokeLinecap="round" opacity={0.8} />

            {/* face */}
            {eyesOpen ? (
              <g>
                <ellipse cx={-26} cy={-10} rx={7} ry={8.5} fill={INK} />
                <ellipse cx={16} cy={-10} rx={7} ry={8.5} fill={INK} />
                <circle cx={-23.5} cy={-13} r={2.6} fill="#fff" />
                <circle cx={18.5} cy={-13} r={2.6} fill="#fff" />
                <path d="M -18 10 Q -5 26 8 10 Z" fill={INK} />
                <path d="M -13 11 L -10 16 L -7 11 Z M -1 11 L 2 16 L 5 11 Z" fill="#fff" />
                {wet > 0 && (
                  <path
                    d={`M 6 14 Q 9 ${18 + 7 * wet} 6 ${22 + 9 * wet} Q 3 ${18 + 7 * wet} 6 14 Z`}
                    fill={BLOOD}
                    opacity={wet}
                  />
                )}
              </g>
            ) : (
              <g fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round">
                <path d="M -33 -9 Q -26 -3 -19 -9" />
                <path d="M 9 -9 Q 16 -3 23 -9" />
                <path d="M -9 12 Q -5 15 -1 12" strokeWidth={3} />
              </g>
            )}

            {/* shake afterimage — reads as "shaking hard" even in a still frame */}
            {catchP > 0 && catchP < 1 && (
              <path
                d={HOUSING}
                fill="none"
                strokeWidth={3}
                transform={`translate(${(-shake(catchP, 7) * 14).toFixed(2)} ${(-shake(catchP, 9) * 6).toFixed(2)})`}
                style={{ stroke: ACCENT_ALT, opacity: 0.7 * (1 - catchP) }}
              />
            )}

            {/* engine-off dimmer */}
            <path d={HOUSING} fill="#05070a" opacity={0.42 * (1 - lit)} />

            {/* status light */}
            <circle cx={-42} cy={34} r={6} fill={INK} />
            <circle cx={-42} cy={34} r={4} style={{ fill: lit > 0 ? ACCENT : "#3A2A1C", opacity: 0.35 + 0.65 * lit }} />

            {/* cord grommet */}
            <circle cx={EXIT_X} cy={CORD_Y} r={6} fill={INK} />

            {/* cord + T-handle */}
            <path d={cordPath(handleX, sag)} fill="none" stroke={ROPE} strokeWidth={3.5} strokeLinecap="round" />
            <g transform={`translate(${handleX.toFixed(2)} ${CORD_Y})`}>
              <g className={armed && drag === 0 && !fired ? "rcs-bob" : undefined}>
                <rect x={-2} y={-3.5} width={10} height={7} rx={2} fill={INK} />
                <rect
                  className="rcs-ring"
                  x={-2}
                  y={-34}
                  width={24}
                  height={68}
                  rx={10}
                  fill="none"
                  strokeWidth={3}
                  style={{ stroke: ACCENT }}
                />
                <rect x={6} y={-26} width={12} height={52} rx={6} fill={INK} strokeWidth={3} style={{ stroke: ACCENT }} />
                <rect x={9.5} y={-18} width={5} height={36} rx={2.5} fill="#2E3542" />
              </g>
            </g>
          </g>
        </g>

        {/* VRRRMM */}
        {vroomP > 0 && (
          <g
            transform={`translate(${v.vroom.x} ${v.vroom.y}) rotate(-9) scale(${vroomScale.toFixed(3)})`}
            opacity={Math.min(1, vroomP * 4)}
            style={{ fontFamily: FONT_DISPLAY, fontWeight: 900 }}
          >
            <text
              x={v.vroom.size * 0.07}
              y={v.vroom.size * 0.07}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={v.vroom.size}
              style={{ fill: ACCENT }}
            >
              {vroomLetters.join("")}
            </text>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={v.vroom.size}
              strokeWidth={v.vroom.size * 0.08}
              strokeLinejoin="round"
              paintOrder="stroke"
              stroke="#05070a"
              style={{ fill: TEXT }}
            >
              {vroomLetters.map((ch, i) => (
                <tspan
                  key={i}
                  dy={
                    i === 0
                      ? 0
                      : (i % 2 ? -1 : 1) *
                        (running ? buzz * 0.5 : shake(vroomP, 2)) *
                        v.vroom.size *
                        0.08
                  }
                >
                  {ch}
                </tspan>
              ))}
            </text>
          </g>
        )}

        {/* label: call to action, then the running state */}
        {labelOut < 1 && (
          <text
            x={v.label.x}
            y={v.label.y}
            textAnchor={v.label.anchor}
            dominantBaseline="middle"
            fontSize={v.label.size}
            fontWeight={800}
            letterSpacing={v.label.size * 0.08}
            opacity={1 - labelOut}
            style={{ fill: TEXT, fontFamily: FONT_MONO }}
          >
            {label}
          </text>
        )}
        {labelIn > 0 && (
          <g
            transform={`translate(${v.label.x} ${v.label.y}) scale(${(1 + (1 - easeOutBack(labelIn)) * 0.5).toFixed(3)})`}
            opacity={labelIn}
          >
            <text
              textAnchor={v.label.anchor}
              dominantBaseline="middle"
              fontSize={v.label.size * 1.15}
              fontWeight={900}
              letterSpacing={v.label.size * 0.14}
              style={{ fill: ACCENT, fontFamily: FONT_MONO }}
            >
              {firedLabel}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

export default RipcordStarter;
