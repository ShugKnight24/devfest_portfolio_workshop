import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  CHAIR_COLORS,
  DEFAULT_AVATAR,
  DESK_SURFACES,
  DESK_TOP,
  DISPLAY_DEPTH,
  PROP_FOR_TOGGLE,
  addCompanion,
  clampItemPosition,
  companionKey,
  describeAvatar,
  findFreeSlot,
  findItem,
  findOption,
  findProp,
  hasPlush,
  hopSurface,
  isPropEnabled,
  itemBounds,
  itemCollides,
  loadAvatar,
  moveItem,
  normalizeAvatar,
  placedItems,
  propFootprint,
  randomAvatar,
  readPosition,
  removeCompanion,
  saveAvatar,
  setCompanionVariant,
  togglePlush,
} from "../config/avatar";
import { BOOKCASE, MAX_COMPANIONS, findPlushKind } from "../config/sceneItems";
import { CHARACTER_ART } from "./scene/characterArt";
import { LunaPlush, PET_ART } from "./scene/petArt";
import { SIDEKICK_ART } from "./scene/sidekickArt";
import { SceneCustomizer } from "./SceneCustomizer";
import { downloadSvgAsPng } from "./scene/exportSvg";
import { Displays } from "./scene/displayArt";
import { KeyboardArt, propArt } from "./scene/propArt";
import { AvatarBack, AvatarBody, AvatarBust, AvatarDefs, AvatarHands, AvatarHead, AvatarStanding, INK, resolveLook } from "./scene/avatarArt";

/**
 * Animated SVG Scene: a developer building their website.
 *
 * The figure is drawn with real seated proportions — a 7.5-head standing adult
 * cropped at the desk, so roughly 3.2 heads of visible height — and lit by the
 * display in front of it. The screen is the key light: it rakes up under the
 * jaw and across the chest, while the outer edges of the head and torso fall
 * into shadow. That single decision does most of the work of making a flat
 * vector read as a person.
 *
 * Everything the scene draws comes from a single `avatar` config object
 * (see `src/config/avatar.js`), so new options are a data change.
 */

/* --------------------------------------------------------------------------
 * Geometry — the whole figure is built off these, centred on x = 400.
 * ------------------------------------------------------------------------ */
const CENTER = 400;
/** Where the standing figure plants its feet: in front of the desk's right end. */
const STANDING_SPOT = "translate(228 20)";
/** Monitors emit a cool blue-white, not the brand hue. */
const SCREEN_LIGHT = "#BFE6FF";
const mirror = "translate(800, 0) scale(-1, 1)";

/**
 * The room's light. Day was a pale wash; it is now a real blue sky over a warm
 * floor, and golden hour sits between it and night.
 */
const SKIES = {
  night: { bg: ["#0B1020", "#0A0D14", "#12101E"], floor: ["#171B2A", "#0B0D14"], orb: [664, 90], sun: "#F4EBD0", glow: "#C7D2FE" },
  day: { bg: ["#4FB0EC", "#8FD0F6", "#CDEBFB", "#FFE7C4"], floor: ["#E2B582", "#C48F55"], orb: [664, 92], sun: "#FFC93C", glow: "#FFE27A", cloudShade: "#D5E9F7" },
  sunset: { bg: ["#4B3DB8", "#C95A9C", "#FF8F66", "#FFD08A"], floor: ["#B87548", "#87502F"], orb: [700, 150], sun: "#FFB347", glow: "#FF8A5B", cloudShade: "#F7B9C7" },
};

/**
 * The Studio's tiles: your bust, at thumbnail size, in the scene's own art.
 * Each tile is its own SVG, so it gets its own id prefix for the art's clips.
 */
export const HeadPreview = ({ look }) => {
  const uid = `hp${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="304 74 192 192" className="h-full w-full" aria-hidden="true">
      <AvatarBust look={look} uid={uid} />
    </svg>
  );
};

/** An SVG framed on a box `{ dx, dy, w, h }` around an anchor, with a little air. */
const Framed = ({ x = 0, y = 0, box, pad = 6, children }) => {
  const id = `fr${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox={`${x + box.dx - pad} ${y + box.dy - pad} ${box.w + pad * 2} ${box.h + pad * 2}`}
      className="h-full w-full"
      aria-hidden="true"
      overflow="visible"
    >
      {/* The scene's ink line, so a tile looks like the thing you will place. */}
      <InkFilter id={id} radius={Math.max(box.w, box.h) / 64} />
      <g filter={`url(#${id})`}>{children}</g>
    </svg>
  );
};

/** One warm outline around every solid silhouette; faint glows are skipped. */
const InkFilter = ({ id, radius = 1.6 }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feComponentTransfer in="SourceAlpha" result="solid">
      <feFuncA type="discrete" tableValues="0 1" />
    </feComponentTransfer>
    <feMorphology in="solid" operator="dilate" radius={radius} result="grown" />
    <feFlood floodColor={INK} />
    <feComposite in2="grown" operator="in" result="line" />
    <feMerge>
      <feMergeNode in="line" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const TROUSER = { base: "#2B3242", shadow: "#1B2030", light: "#3B4660" };
const SHOE = { base: "#15171C", sole: "#2A2D34" };

const Leg = ({ flip }) => (
  <g transform={flip ? mirror : undefined}>
    {/* shin, tapering from knee to ankle */}
    <path d="M355 360 L393 360 L388 452 L360 452 Z" fill={TROUSER.base} />
    {/* inner edge falls away from the screen light */}
    <path d="M387 360 L393 360 L388 452 L383 452 Z" fill={TROUSER.shadow} opacity={0.85} />
    {/* knee catching the light spilling under the desk */}
    <ellipse cx={373} cy={368} rx={13} ry={6} fill={TROUSER.light} opacity={0.55} />
    {/* trouser crease */}
    <path d="M373 374 L374 450" stroke={TROUSER.shadow} strokeWidth={1.5} opacity={0.6} />
    {/* hem break over the shoe */}
    <path d="M359 448 C366 452 382 452 389 448" stroke={TROUSER.shadow} strokeWidth={2} fill="none" opacity={0.8} />
    {/* contact shadow under the shoe */}
    <ellipse cx={374} cy={473} rx={27} ry={4} fill="#000000" opacity={0.35} />
    {/* shoe, toe toward the viewer */}
    <path
      d="M352 453 C352 447 358 444 364 444 L384 444 C392 444 398 448 398 456 L398 466 C398 470 395 472 391 472 L357 472 C353 472 350 469 350 465 Z"
      fill={SHOE.base}
    />
    <rect x={350} y={467} width={48} height={5} rx={2.5} fill={SHOE.sole} />
    <ellipse cx={372} cy={452} rx={12} ry={3.5} fill="#FFFFFF" opacity={0.1} />
  </g>
);

/** The chair's gas lift and star base, visible under the desk between the legs. */
const ChairBase = ({ color }) => (
  <g>
    <rect x={395} y={362} width={10} height={80} rx={3} fill={color} />
    <path
      d="M400 440 L340 456 M400 440 L368 462 M400 440 L432 462 M400 440 L460 456"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
    />
    {[
      [340, 459],
      [368, 465],
      [432, 465],
      [460, 459],
    ].map(([cx, cy]) => (
      <circle key={cx} cx={cx} cy={cy} r={4.5} fill="#0B0D12" />
    ))}
  </g>
);

/* --------------------------------------------------------------------------
 * Movable props
 *
 * Each prop's art is still drawn at the coordinates it was authored at; the
 * wrapper translates it by the delta between that anchor and the position held
 * in the avatar config. Pointer drags and arrow-key nudges both write to the
 * same place, so the two input methods can never disagree.
 * ------------------------------------------------------------------------ */
const NUDGE = 4;
const NUDGE_FAST = 16;
const RING_PAD = 5;
const ARROW_DELTAS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** A focus/drag ring that survives both backdrops: dark halo, accent core. */
const PropRing = ({ box, invalid }) => (
  <g pointerEvents="none" data-export="skip">
    <rect
      x={box.x - RING_PAD}
      y={box.y - RING_PAD}
      width={box.w + RING_PAD * 2}
      height={box.h + RING_PAD * 2}
      rx={7}
      fill={invalid ? "#F97316" : "#FFFFFF"}
      fillOpacity={invalid ? 0.16 : 0.07}
      stroke="#05070B"
      strokeOpacity={0.55}
      strokeWidth={5}
    />
    <rect
      x={box.x - RING_PAD}
      y={box.y - RING_PAD}
      width={box.w + RING_PAD * 2}
      height={box.h + RING_PAD * 2}
      rx={7}
      fill="none"
      stroke={invalid ? "#FDBA74" : "var(--color-primary, #00FFCC)"}
      strokeWidth={2}
      strokeDasharray={invalid ? "6 4" : "5 4"}
    />
  </g>
);

const MovableProp = ({
  item,
  position,
  interactive = true,
  active,
  invalid,
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  onFocus,
  onBlur,
  children,
}) => {
  // Desk props were authored at their default anchor, so only the delta moves.
  // Added items (companions, plushies) are drawn around (0, 0) and move whole.
  const origin = item.prop ? { x: item.prop.x, y: item.prop.y } : { x: 0, y: 0 };
  const dx = Math.round((position.x - origin.x) * 100) / 100;
  const dy = Math.round((position.y - origin.y) * 100) / 100;
  const box = propFootprint(item, origin);
  const transform = dx || dy ? `translate(${dx} ${dy})` : undefined;

  if (!interactive) {
    return <g transform={transform}>{children}</g>;
  }

  return (
    <g
      className="scene-prop"
      transform={transform}
      tabIndex={0}
      role="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        cursor: active === "drag" ? "grabbing" : "grab",
        touchAction: "none",
        outline: "none",
      }}
    >
      {/* Generous hit area — a lamp arm is 5px wide and impossible to grab. */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="transparent" />
      {children}
      {active && <PropRing box={box} invalid={invalid} />}
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Bookcase
 *
 * Built in the desk's own wood, so the two read as one room's furniture. The
 * geometry lives in src/config/sceneItems.js because the placement code needs
 * the same shelf lines and book spans the art draws.
 * ------------------------------------------------------------------------ */
const BOOK_SPINES = [
  { w: 7, h: 46, fill: "#1D4ED8", edge: "#60A5FA" },
  { w: 7, h: 54, fill: "#B91C1C", edge: "#EF4444" },
  { w: 8, h: 40, fill: "#047857", edge: "#34D399" },
];

const Bookcase = ({ wood }) => {
  const { x, y, w, h, boards, books, inner } = BOOKCASE;
  const bottom = y + h;
  const side = inner.minX - x;

  return (
    <g>
      <ellipse cx={x + w / 2} cy={bottom} rx={w / 2 + 8} ry={6} fill="#000000" opacity={0.3} />
      {/* back panel, in shadow: the shelves are recessed */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill={wood.shadow} />
      <rect x={inner.minX} y={y + 12} width={inner.maxX - inner.minX} height={h - 12} fill="#000000" opacity={0.28} />
      {/* sides and top */}
      <rect x={x} y={y} width={side} height={h} rx={2} fill={wood.base} />
      <rect x={inner.maxX} y={y} width={side} height={h} rx={2} fill={wood.base} />
      <rect x={x} y={y} width={3} height={h} fill={wood.highlight} opacity={0.35} />
      <rect x={x - 4} y={y - 6} width={w + 8} height={14} rx={3} fill={wood.base} />
      <rect x={x - 4} y={y - 6} width={w + 8} height={3} rx={1.5} fill={wood.highlight} opacity={0.7} />
      {/* kick plate below the last shelf */}
      <rect x={inner.minX} y={boards[boards.length - 1] + 8} width={inner.maxX - inner.minX} height={bottom - boards[boards.length - 1] - 8} fill={wood.base} opacity={0.85} />
      {boards.map((boardY) => (
        <g key={boardY}>
          <rect x={inner.minX} y={boardY} width={inner.maxX - inner.minX} height={8} fill={wood.base} />
          <rect x={inner.minX} y={boardY} width={inner.maxX - inner.minX} height={2} fill={wood.highlight} opacity={0.75} />
          <rect x={inner.minX} y={boardY + 8} width={inner.maxX - inner.minX} height={4} fill="#000000" opacity={0.25} />
        </g>
      ))}
      {books.map((book) => {
        let cursor = book.minX;
        return (
          <g key={`${book.shelf}-${book.minX}`}>
            {BOOK_SPINES.map((spine, i) => {
              const bx = cursor;
              cursor += spine.w;
              return (
                <g key={i}>
                  <rect x={bx} y={boards[book.shelf] - spine.h} width={spine.w - 0.6} height={spine.h} rx={1} fill={spine.fill} />
                  <rect x={bx} y={boards[book.shelf] - spine.h + 6} width={spine.w - 0.6} height={2} fill={spine.edge} opacity={0.6} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------ */
export const StudentBuildingScene = ({
  className = "",
  avatar: avatarProp,
  customizable = true,
  /** The mood light: lamp glow, screen accents and the room's ambient tint. */
  accent: accentProp,
  /** Rendered under the illustration, in the scene's column (mood chips). */
  footer = null,
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const gid = useCallback((name) => `${uid}-${name}`, [uid]);

  const [storedAvatar, setStoredAvatar] = useState(() =>
    avatarProp ? normalizeAvatar(avatarProp) : loadAvatar(),
  );
  /** Live drag state. `null` whenever nothing is being dragged. */
  const [drag, setDrag] = useState(null);
  const [focusedProp, setFocusedProp] = useState(null);
  /** Spoken, not drawn: every move and every addition is announced. */
  const [status, setStatus] = useState("");
  const svgRef = useRef(null);
  const badgeRef = useRef(null);

  const avatar = useMemo(
    () => normalizeAvatar(avatarProp ?? storedAvatar),
    [avatarProp, storedAvatar],
  );

  const commit = useCallback((next) => {
    const normalized = normalizeAvatar(next);
    setStoredAvatar(normalized);
    saveAvatar(normalized);
    return normalized;
  }, []);

  /**
   * Turning a prop on puts it in the first free slot rather than on a fixed
   * literal that something else may already occupy. Takes one `(key, value)`
   * or a whole patch object (a Studio look), applied in a single commit.
   */
  const handleChange = useCallback(
    (keyOrPatch, value) => {
      const patch = typeof keyOrPatch === "string" ? { [keyOrPatch]: value } : keyOrPatch;
      let next = avatar;
      let message = "";

      for (const [key, val] of Object.entries(patch)) {
        const before = next;
        next = { ...before, [key]: val };
        const propId = PROP_FOR_TOGGLE[key];

        if (propId && !isPropEnabled(before, propId) && isPropEnabled(next, propId)) {
          const slot = findFreeSlot(next, propId);
          next.positions = { ...before.positions, [propId]: slot };
          const prop = findProp(propId);
          const moved = Math.round(slot.x) !== Math.round(readPosition(before, propId).x);
          message =
            `${prop.label} added${moved ? " in the nearest free space" : ""}. ` +
            "Drag it, or focus it and use the arrow keys, to move it.";
        } else if (propId && isPropEnabled(before, propId) && !isPropEnabled(next, propId)) {
          message = `${findProp(propId).label} removed.`;
        } else if (key === "bookcase" && Boolean(before.bookcase) !== Boolean(val)) {
          message = val ? "Bookcase added beside the desk." : "Bookcase removed, and its plushies with it.";
        }
      }

      if (typeof keyOrPatch !== "string") message = "Look applied.";
      if (message) setStatus(message);
      commit(next);
    },
    [avatar, commit],
  );

  const handleAddCompanion = useCallback(
    (kindId, variantId) => {
      const next = addCompanion(avatar, kindId, variantId);
      if (next === avatar) {
        setStatus(`The scene holds ${MAX_COMPANIONS} companions. Remove one to add another.`);
        return;
      }
      const added = next.companions[next.companions.length - 1];
      commit(next);
      setStatus(
        `${findItem(next, companionKey(added.id)).label} added. ` +
          "Drag it, or focus it and use the arrow keys, to move it.",
      );
    },
    [avatar, commit],
  );

  const handleRemoveCompanion = useCallback(
    (id) => {
      const item = findItem(avatar, companionKey(id));
      commit(removeCompanion(avatar, id));
      setStatus(`${item ? item.label : "Companion"} removed.`);
    },
    [avatar, commit],
  );

  const handleCompanionVariant = useCallback(
    (id, variantId) => {
      const next = commit(setCompanionVariant(avatar, id, variantId));
      const item = findItem(next, companionKey(id));
      if (item) setStatus(`Now ${item.label}.`);
    },
    [avatar, commit],
  );

  const handleTogglePlush = useCallback(
    (kindId) => {
      const had = hasPlush(avatar, kindId);
      commit(togglePlush(avatar, kindId));
      const name = findPlushKind(kindId)?.label ?? "Plushie";
      setStatus(
        had
          ? `${name} plushie taken off the bookcase.`
          : `${name} plushie added to the bookcase. Up and down arrows move it between shelves.`,
      );
    },
    [avatar, commit],
  );

  const handleRandomize = useCallback(() => {
    commit(randomAvatar());
    setStatus("Scene randomized. Every prop was laid out in free space.");
  }, [commit]);

  const handleReset = useCallback(() => {
    commit(DEFAULT_AVATAR);
    setStatus("Scene reset to its starting layout.");
  }, [commit]);

  /** Save what you made: the whole desk, or your avatar as a round badge. */
  const handleDownload = useCallback(async (kind) => {
    const avatarOnly = kind === "avatar";
    const svg = avatarOnly ? badgeRef.current : svgRef.current;
    if (!svg) return;
    try {
      await downloadSvgAsPng(svg, avatarOnly ? { width: 1024, height: 1024, filename: "my-dev-avatar.png" } : { width: 2000, height: 1000, filename: "my-dev-desk.png" });
      setStatus(avatarOnly ? "Avatar badge downloaded." : "Desk scene downloaded.");
    } catch {
      setStatus("The download did not work in this browser.");
    }
  }, []);

  /* ---------------- moving props ---------------- */

  /**
   * Client pixels to SVG user units. The viewBox is 1000x500 but the element is
   * fluid, so the two are never 1:1 — the screen CTM is the only honest way to
   * convert, and it also handles page zoom and any ancestor transform.
   */
  const toSvgPoint = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg || typeof svg.getScreenCTM !== "function") return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  /* Props, companions and plushies all move through one set of handlers, keyed
     by item key: a prop id, `companion:<id>` or `plush:<kind>`. */
  const positionOf = useCallback(
    (key) => (drag && drag.id === key ? { x: drag.x, y: drag.y } : findItem(avatar, key)?.position),
    [avatar, drag],
  );

  const movePropTo = useCallback(
    (key, target) => {
      // moveItem rounds to whole units: the CTM inverse leaves float noise that
      // nobody can see but everybody would read in the stored config.
      const next = commit(moveItem(avatar, key, target));
      const item = findItem(next, key);
      if (!item) return null;
      const { x, y } = item.position;
      const overlapping = itemCollides(next, key, item.position);
      setStatus(
        `${item.label} moved to x ${Math.round(x)}, y ${Math.round(y)}` +
          `${overlapping ? ", overlapping another item" : ""}.`,
      );
      return item.position;
    },
    [avatar, commit],
  );

  const handlePropPointerDown = useCallback(
    (id) => (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = toSvgPoint(event);
      const item = findItem(avatar, id);
      if (!point || !item) return;
      event.preventDefault();
      const target = event.currentTarget;
      try {
        // Throws for a pointer id the UA no longer considers active.
        target.setPointerCapture?.(event.pointerId);
      } catch {
        // Capture is an optimisation; the move handler works without it.
      }
      // preventScroll: focusing must not yank the page mid-drag.
      if (typeof target.focus === "function") target.focus({ preventScroll: true });
      const start = item.position;
      setDrag({
        id,
        pointerId: event.pointerId,
        grabX: point.x - start.x,
        grabY: point.y - start.y,
        x: start.x,
        y: start.y,
        invalid: false,
      });
    },
    [avatar, toSvgPoint],
  );

  const handlePropPointerMove = useCallback(
    (id) => (event) => {
      if (!drag || drag.id !== id) return;
      const point = toSvgPoint(event);
      const item = findItem(avatar, id);
      if (!point || !item) return;
      const next = clampItemPosition(item, {
        x: point.x - drag.grabX,
        y: point.y - drag.grabY,
      });
      setDrag((prev) =>
        prev && prev.id === id
          ? { ...prev, ...next, invalid: itemCollides(avatar, id, next) }
          : prev,
      );
    },
    [avatar, drag, toSvgPoint],
  );

  const handlePropPointerUp = useCallback(
    (id) => (event) => {
      if (!drag || drag.id !== id) return;
      const target = event.currentTarget;
      try {
        if (target.hasPointerCapture?.(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Already released, or never captured.
      }
      movePropTo(id, { x: drag.x, y: drag.y });
      setDrag(null);
    },
    [drag, movePropTo],
  );

  /**
   * Drag is a mouse affordance; the arrow keys are the real contract. Shelves
   * are lines, so up/down against the edge of a surface hops to the next one.
   */
  const handlePropKeyDown = useCallback(
    (id) => (event) => {
      const delta = ARROW_DELTAS[event.key];
      const item = findItem(avatar, id);
      if (!delta || !item) return;
      event.preventDefault();
      event.stopPropagation();
      const from = item.position;
      const hop = delta[1] ? hopSurface(item, from, delta[1]) : null;
      if (hop) {
        movePropTo(id, hop);
        return;
      }
      const step = event.shiftKey ? NUDGE_FAST : NUDGE;
      movePropTo(id, { x: from.x + delta[0] * step, y: from.y + delta[1] * step });
    },
    [avatar, movePropTo],
  );

  const desk = findOption(DESK_SURFACES, avatar.deskSurface);
  const chair = findOption(CHAIR_COLORS, avatar.chairColor);
  const seated = avatar.pose !== "standing";

  const accent = accentProp || "var(--color-primary, #00FFCC)";
  const isNight = avatar.backdrop === "night";
  const sky = SKIES[avatar.backdrop] ?? SKIES.night;
  const look = resolveLook(avatar, accent);
  /** The accent is legible on the dark backdrop; daylight needs real ink. */
  const motifInk = isNight ? accent : "#0E7490";
  const label = describeAvatar(avatar);

  /** A scene driven by a fixed `avatar` prop is a picture, not a workspace. */
  const interactive = customizable && !avatarProp;

  /* The art for each desk prop, drawn at its authored anchor. */
  const propArtMap = propArt({ accent, lit: isNight || avatar.backdrop === "sunset", mech: avatar.mechKeyboard });

  /** Companions and plushies are drawn around (0, 0); see src/components/scene. */
  const renderArt = (item) => {
    if (item.type === "prop") return propArtMap[item.key];
    if (item.type === "plush") {
      if (item.kind.id === "luna") return <LunaPlush />;
      const Plush = SIDEKICK_ART[item.kind.id] || CHARACTER_ART[item.kind.id];
      return Plush ? <Plush mode="plush" /> : null;
    }
    const Art = PET_ART[item.kind.id] || SIDEKICK_ART[item.kind.id] || CHARACTER_ART[item.kind.id];
    return Art ? <Art variant={item.companion.variant} mode="figure" /> : null;
  };

  /**
   * Paint order: back to front, by the depth declared in the config — a lamp
   * belongs behind the books whatever the two are dragged to.
   *
   * Deliberately NOT re-sorted by the live y of each anchor: that reorders the
   * DOM mid-nudge, and moving a focused <g> blurs it, which would break the
   * arrow keys for exactly the people who depend on them.
   */
  const visibleItems = placedItems(avatar);

  const renderProp = (item) => {
    const position = positionOf(item.key);
    const dragging = drag?.id === item.key;
    const bounds = itemBounds(item, position);

    return (
      <MovableProp
        key={item.key}
        item={item}
        position={position}
        interactive={interactive}
        active={dragging ? "drag" : focusedProp === item.key ? "focus" : null}
        invalid={dragging ? drag.invalid : false}
        label={
          `${item.label}, movable. Position ${Math.round(position.x)}, ${Math.round(position.y)} ` +
          `of ${Math.round(bounds.minX)} to ${Math.round(bounds.maxX)} across. ` +
          "Arrow keys move it, shift and arrow moves further." +
          (item.surfaces.length > 1 ? " Up and down arrows also move it between surfaces." : "")
        }
        onPointerDown={handlePropPointerDown(item.key)}
        onPointerMove={handlePropPointerMove(item.key)}
        onPointerUp={handlePropPointerUp(item.key)}
        onKeyDown={handlePropKeyDown(item.key)}
        onFocus={() => {
          setFocusedProp(item.key);
          setStatus(`${item.label} selected. Use the arrow keys to move it.`);
        }}
        onBlur={() => setFocusedProp((current) => (current === item.key ? null : current))}
      >
        <g filter={`url(#${gid("ink")})`}>{renderArt(item)}</g>
      </MovableProp>
    );
  };

  /** What the Studio's tiles draw: the same art, at thumbnail size. */
  const previews = {
    head: (patch = {}) => <HeadPreview look={resolveLook({ ...avatar, ...patch }, accent)} />,
    prop: (toggleId) => {
      const prop = findProp(PROP_FOR_TOGGLE[toggleId]);
      if (!prop) return null;
      const art = toggleId === "mechKeyboard" ? <KeyboardArt mech accent={accent} /> : propArtMap[prop.id];
      return (
        <Framed x={prop.x} y={prop.y} box={prop.box}>
          {art}
        </Framed>
      );
    },
    companion: (kind, variant) => {
      const Art = PET_ART[kind.id] || SIDEKICK_ART[kind.id] || CHARACTER_ART[kind.id];
      return Art ? (
        <Framed box={kind.box}>
          <Art variant={variant} mode="figure" />
        </Framed>
      ) : null;
    },
    plush: (kind) => {
      const Plush = kind.id === "luna" ? LunaPlush : SIDEKICK_ART[kind.id] || CHARACTER_ART[kind.id];
      return Plush ? (
        <Framed box={kind.box}>
          <Plush mode="plush" />
        </Framed>
      ) : null;
    },
  };

  const propsBehindDisplay = visibleItems.filter((item) => item.depth < DISPLAY_DEPTH);
  const propsInFrontOfDisplay = visibleItems.filter((item) => item.depth >= DISPLAY_DEPTH);

  return (
    <div className={`@container ${className}`}>
      <style>{`
        @keyframes scene-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes scene-float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes scene-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scene-steam { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 100% { transform: translateY(-14px) scale(1.4); opacity: 0; } }
        @keyframes scene-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.6; } }
        @keyframes scene-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scene-lid { 0%, 90%, 100% { transform: scaleY(0); } 94%, 96% { transform: scaleY(1); } }

        .scene-lid { transform-box: fill-box; transform-origin: center top; transform: scaleY(0); }

        @media (prefers-reduced-motion: no-preference) {
          .scene-float { animation: scene-float 3s ease-in-out infinite; }
          .scene-float-delay { animation: scene-float 3.6s ease-in-out infinite 0.5s; }
          .scene-float-slow { animation: scene-float-slow 4.2s ease-in-out infinite 1s; }
          .scene-steam1 { animation: scene-steam 2.4s ease-out infinite; }
          .scene-steam2 { animation: scene-steam 2.4s ease-out infinite 0.8s; }
          .scene-steam3 { animation: scene-steam 2.4s ease-out infinite 1.6s; }
          .scene-blink { animation: scene-blink 1.1s step-end infinite; }
          .scene-glow { animation: scene-pulse 2.4s ease-in-out infinite; }
          .scene-spin { animation: scene-spin 9s linear infinite; transform-origin: center; }
          .scene-lid { animation: scene-lid 5.4s ease-in-out infinite; }
          .scene-lid-b { animation-delay: 0.04s; }
        }
      `}</style>

      {/*
       * The Studio sits BESIDE the scene once there is room, at the scene's
       * height, so every change lands where you are already looking. On a
       * narrow screen the scene pins to the top and the Studio scrolls under
       * it — never a panel that drops below the fold.
       */}
      <div className={interactive ? "grid gap-0 @3xl:grid-cols-[minmax(0,1fr)_26rem]" : ""}>
        <div
          className={`relative z-10 flex min-w-0 flex-col justify-center gap-3 p-3 @3xl:p-5 ${interactive ? "sticky top-14 @3xl:static" : ""}`}
          style={interactive ? { backgroundColor: "var(--stage-bg, #05070a)" } : undefined}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1000 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            role="img"
            aria-label={label}
          >
            <defs>
              <linearGradient id={gid("bg")} x1="0" y1="0" x2="1000" y2="500" gradientUnits="userSpaceOnUse">
                {sky.bg.map((c, i) => (
                  <stop key={c + i} offset={`${(i / (sky.bg.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>

              <radialGradient id={gid("ambient")} cx="0.5" cy="0.62" r="0.55">
                <stop offset="0%" stopColor={accent} stopOpacity={isNight ? 0.22 : 0.12} />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>

              {/* separates the figure from the backdrop: a lift at night, a
                  soft cast shadow in daylight */}
              <radialGradient id={gid("figureHalo")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={isNight ? accent : "#0F172A"} stopOpacity={isNight ? 0.16 : 0.08} />
                <stop offset="100%" stopColor={isNight ? accent : "#0F172A"} stopOpacity="0" />
              </radialGradient>

              <linearGradient id={gid("desk")} x1="0" y1="344" x2="0" y2="366" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={desk.base} />
                <stop offset="100%" stopColor={desk.shadow} />
              </linearGradient>

              <linearGradient id={gid("chair")} x1="0" y1="220" x2="0" y2="348" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={chair.base} />
                <stop offset="100%" stopColor={chair.shadow} />
              </linearGradient>

              <linearGradient id={gid("screen")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#141A2E" />
                <stop offset="100%" stopColor="#1F1B44" />
              </linearGradient>

              <linearGradient id={gid("screenGlow")} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
              </linearGradient>

              <radialGradient id={gid("spill")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>

              {/* Ink outline for everything not hand-inked: one warm line around
                  each silhouette, as the avatar has. Faint glows (alpha < 0.5)
                  are dropped before the dilate, so only solid shapes get a line. */}
              <InkFilter id={gid("ink")} />
              <linearGradient id={gid("floor")} x1="0" y1="440" x2="0" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={sky.floor[0]} />
                <stop offset="100%" stopColor={sky.floor[1]} />
              </linearGradient>
              <radialGradient id={gid("sunGlow")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={sky.glow} stopOpacity={isNight ? 0.25 : 0.7} />
                <stop offset="100%" stopColor={sky.glow} stopOpacity="0" />
              </radialGradient>

              <filter id={gid("soft")} x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.35" />
              </filter>
            </defs>
            <AvatarDefs uid={gid("av")} look={look} />

            <rect width="1000" height="500" rx="16" fill={`url(#${gid("bg")})`} />
            <rect width="1000" height="500" rx="16" fill={`url(#${gid("ambient")})`} />

            {/* ---------- BACKDROP: sun or moon, stars or clouds, then the floor ---------- */}
            <circle cx={sky.orb[0]} cy={sky.orb[1]} r={110} fill={`url(#${gid("sunGlow")})`} />
            <g className="scene-float-slow">
              {!isNight && (
                <g opacity={0.5}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    const [cx, cy] = sky.orb;
                    return (
                      <path
                        key={`ray-${i}`}
                        d={`M${cx + Math.cos(a) * 40} ${cy + Math.sin(a) * 40} L${cx + Math.cos(a) * 54} ${cy + Math.sin(a) * 54}`}
                        stroke={sky.sun}
                        strokeWidth={4}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              )}
              <circle cx={sky.orb[0]} cy={sky.orb[1]} r={28} fill={sky.sun} stroke={INK} strokeWidth={3} />
              {isNight ? (
                <circle cx={sky.orb[0] - 11} cy={sky.orb[1] - 7} r={25} fill={sky.bg[0]} />
              ) : (
                <ellipse cx={sky.orb[0] - 9} cy={sky.orb[1] - 9} rx={9} ry={6} fill="#FFFFFF" opacity={0.6} transform={`rotate(-30 ${sky.orb[0] - 9} ${sky.orb[1] - 9})`} />
              )}
            </g>
            {isNight &&
              [
                [92, 64],
                [180, 108],
                [268, 56],
                [556, 72],
                [730, 168],
                [620, 46],
                [120, 148],
                [470, 40],
                [790, 70],
              ].map(([cx, cy], i) => (
                <path
                  key={`star-${i}`}
                  d={`M${cx} ${cy - 4} L${cx + 1.2} ${cy - 1.2} L${cx + 4} ${cy} L${cx + 1.2} ${cy + 1.2} L${cx} ${cy + 4} L${cx - 1.2} ${cy + 1.2} L${cx - 4} ${cy} L${cx - 1.2} ${cy - 1.2} Z`}
                  fill="#FFF4C7"
                  opacity={i % 3 ? 0.55 : 0.9}
                />
              ))}
            {!isNight &&
              [
                [140, 96, 30],
                [250, 70, 20],
                [548, 120, 26],
                [800, 150, 22],
              ].map(([cx, cy, r], i) => (
                <g key={`cloud-${i}`} className={i % 2 ? "scene-float-slow" : "scene-float-delay"} filter={`url(#${gid("ink")})`}>
                  <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.62} fill="#FFFFFF" />
                  <ellipse cx={cx + r * 0.75} cy={cy + 4} rx={r * 0.72} ry={r * 0.48} fill="#FFFFFF" />
                  <ellipse cx={cx - r * 0.7} cy={cy + 5} rx={r * 0.6} ry={r * 0.42} fill="#FFFFFF" />
                  <path d={`M${cx - r * 1.2} ${cy + r * 0.5} L${cx + r * 1.4} ${cy + r * 0.5}`} stroke={sky.cloudShade} strokeWidth={r * 0.3} strokeLinecap="round" />
                </g>
              ))}
            {/* the floor the desk stands on, so nothing floats */}
            <rect x={0} y={448} width={1000} height={52} fill={`url(#${gid("floor")})`} />
            <path d="M0 448 L1000 448" stroke={INK} strokeWidth={3} opacity={isNight ? 0.6 : 0.85} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <path key={`board-${i}`} d={`M${i * 140 + 60} 450 L${i * 140 + 20} 500`} stroke={INK} strokeWidth={1.4} opacity={0.12} />
            ))}

            {/* ---------- FLOATING CODE MOTIFS (background layer) ---------- */}
            <g opacity={isNight ? 0.85 : 0.9}>
              <g className="scene-float" style={{ transformOrigin: "138px 116px" }}>
                <g className="scene-spin" style={{ transformOrigin: "138px 116px" }}>
                  {[0, 60, 120].map((deg) => (
                    <ellipse
                      key={`atom-${deg}`}
                      cx={138}
                      cy={116}
                      rx={22}
                      ry={8}
                      fill="none"
                      stroke={isNight ? "#61DAFB" : "#0E7490"}
                      strokeWidth={1.5}
                      opacity={0.6}
                      transform={`rotate(${deg} 138 116)`}
                    />
                  ))}
                </g>
                <circle cx={138} cy={116} r={3} fill={isNight ? "#61DAFB" : "#0E7490"} />
              </g>

              <g className="scene-float-delay">
                <text x={690} y={226} fontSize={28} fill={motifInk} opacity={0.5} fontFamily="monospace" fontWeight="bold">
                  {"{ }"}
                </text>
              </g>
              <g className="scene-float-slow">
                <text x={78} y={236} fontSize={22} fill={motifInk} opacity={0.45} fontFamily="monospace" fontWeight="bold">
                  {"</>"}
                </text>
              </g>
              <g className="scene-float">
                <path d="M234 168 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#FBBF24" opacity={0.5} />
              </g>
              <g className="scene-float-delay">
                <path d="M614 292 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" fill="#818CF8" opacity={0.45} />
              </g>
              <g className="scene-float-slow" style={{ transformOrigin: "724px 112px" }}>
                <circle cx={724} cy={112} r={12} fill="#FBBF24" opacity={0.2} className="scene-glow" />
                <path
                  d="M719 108 Q719 100 724 98 Q729 100 729 108 Q729 111 727 112 L721 112 Q719 111 719 108Z"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth={1.5}
                  opacity={0.75}
                />
                <rect x={721} y={112} width={6} height={3} rx={1} fill="#FBBF24" opacity={0.75} />
              </g>
            </g>

            {/* separates the figure from the backdrop */}
            <ellipse cx={CENTER} cy={268} rx={190} ry={150} fill={`url(#${gid("figureHalo")})`} />

            {/* ---------- BOOKCASE (furniture; its plushies are placed items) ---------- */}
            {avatar.bookcase && (
              <g filter={`url(#${gid("ink")})`}>
                <Bookcase wood={desk} />
              </g>
            )}

            {/* ---------- CHAIR ---------- */}
            <g filter={`url(#${gid("ink")})`}>
              <path
                d="M308 246 C308 226, 320 216, 340 216 L460 216 C480 216, 492 226, 492 246 L492 330
                   C492 342, 484 348, 470 348 L330 348 C316 348, 308 342, 308 330 Z"
                fill={`url(#${gid("chair")})`}
              />
              {/* lumbar seam + edge light so the chair reads behind the figure */}
              <path
                d="M316 248 C316 234, 326 226, 342 226 L458 226 C474 226, 484 234, 484 248"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2}
                opacity={0.1}
              />
              <path
                d="M308 246 C308 226, 320 216, 340 216 L460 216 C480 216, 492 226, 492 246"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={2}
                opacity={0.14}
              />
              {/* armrests */}
              <rect x={286} y={306} width={34} height={12} rx={6} fill={chair.shadow} />
              <rect x={480} y={306} width={34} height={12} rx={6} fill={chair.shadow} />
            </g>

            {/* ---------- FIGURE ----------
                The chibi rig (scene/avatarArt): hair volume, then body and
                arms, then the head and everything worn on it. */}
            {seated && (
              <>
                <AvatarBack look={look} />
                <AvatarBody look={look} uid={gid("av")} />
                <AvatarHead look={look} uid={gid("av")} />
              </>
            )}

            {/* ---------- LEGS ----------
                Drawn before the desk so its apron overlaps the knees, which is
                what makes the legs read as running up to the seat. The chair
                base goes first so the shins stand in front of it. */}
            <g filter={`url(#${gid("ink")})`}>
              <ChairBase color={chair.shadow} />
              {seated && <Leg />}
              {seated && <Leg flip />}
            </g>

            {/* ---------- DESK ---------- */}
            <g filter={`url(#${gid("soft")})`}>
             <g filter={`url(#${gid("ink")})`}>
              <rect x={96} y={DESK_TOP} width={620} height={22} rx={3} fill={`url(#${gid("desk")})`} />
              <rect x={96} y={DESK_TOP} width={620} height={3} rx={1.5} fill={desk.highlight} opacity={0.75} />
              <rect x={126} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
              <rect x={672} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
              <rect x={126} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
              <rect x={672} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
             </g>
            </g>

            {/* ---------- MOVABLE PROPS (behind the display plane) ----------
                Lamp, plant, books and floor companions: everything the screen
                should occlude. */}
            {propsBehindDisplay.map(renderProp)}

            {/* ---------- DISPLAY(S) ---------- */}
            <g filter={`url(#${gid("ink")})`}>
              <Displays display={avatar.display} accent={accent} uid={gid("disp")} />
            </g>

            {/* light spilling from the display onto the desk */}
            <ellipse cx={CENTER} cy={340} rx={130} ry={26} fill={`url(#${gid("spill")})`} />

            {/* ---------- MOVABLE PROPS (in front of the display plane) ----------
                Keyboard, phone and mug: the things that live between you and the
                screen. The hands stay on top of all of them. */}
            {propsInFrontOfDisplay.map(renderProp)}

            {/* ---------- HANDS ---------- */}
            {seated && <AvatarHands look={look} />}

            {/* ---------- STANDING ----------
                On your feet in front of the desk's right end, nearer the viewer
                than everything on it; the chair waits empty behind. */}
            {!seated && (
              <g transform={STANDING_SPOT}>
                <AvatarStanding look={look} uid={gid("av")} />
              </g>
            )}
          </svg>
          {footer}
          {/* The download badge: your bust in a sticker ring. Never shown, only exported. */}
          <svg
            ref={badgeRef}
            viewBox="294 62 212 212"
            aria-hidden="true"
            focusable="false"
            style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
          >
            <defs>
              <clipPath id={gid("badge")}>
                <circle cx={400} cy={168} r={100} />
              </clipPath>
              <linearGradient id={gid("badgeBg")} x1="0" y1="68" x2="0" y2="268" gradientUnits="userSpaceOnUse">
                {sky.bg.map((c, i) => (
                  <stop key={c + i} offset={`${(i / (sky.bg.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
            <circle cx={400} cy={168} r={104} fill="#FFFFFF" />
            <circle cx={400} cy={168} r={100} fill={`url(#${gid("badgeBg")})`} />
            <g clipPath={`url(#${gid("badge")})`}>
              <AvatarBust look={look} uid={gid("badgeav")} />
            </g>
            <circle cx={400} cy={168} r={100} fill="none" stroke={INK} strokeWidth={4} />
          </svg>
        </div>

        {interactive && (
          <div className="relative @3xl:min-h-[30rem]">
            <SceneCustomizer
              avatar={avatar}
              previews={previews}
              onChange={handleChange}
              onRandomize={handleRandomize}
              onReset={handleReset}
              onAddCompanion={handleAddCompanion}
              onRemoveCompanion={handleRemoveCompanion}
              onCompanionVariant={handleCompanionVariant}
              onTogglePlush={handleTogglePlush}
              onDownload={handleDownload}
              description={label}
            />
          </div>
        )}
      </div>

      {/* Moves and additions are not visible to everyone — say them out loud. */}
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
};

export default StudentBuildingScene;
