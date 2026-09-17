/**
 * Avatar / desk configuration for the landing page scene.
 *
 * Everything the animated scene can draw is described here as data, so adding
 * a new hair style or desk prop is a change to a list — not surgery on the SVG.
 *
 * Every option carries a human readable `label`; colour options additionally
 * carry a `base` swatch (and sometimes `shadow` / `highlight`) so the UI can
 * render a preview next to the label. Colour is never the only signal.
 */

import {
  BOOKCASE,
  BOOKCASE_SURFACES,
  COMPANION_KINDS,
  MAX_COMPANIONS,
  PLUSH_KINDS,
  SHELF_IDS,
  companionName,
  findCompanionKind,
  findPlushKind,
  resolveVariant,
  shelfBookBoxes,
} from "./sceneItems";

export const AVATAR_STORAGE_KEY = "scene_avatar";

/** Deliberately spans the full human range, light to deep. */
export const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain", base: "#F7DDC9", shadow: "#D6AD91", highlight: "#FFF2E7" },
  { id: "fair", label: "Fair", base: "#EFC6A2", shadow: "#CB9871", highlight: "#FBE2CA" },
  { id: "light", label: "Light", base: "#DEA97C", shadow: "#B67D52", highlight: "#F0CBA3" },
  { id: "medium", label: "Medium", base: "#C4835A", shadow: "#9B5C35", highlight: "#D9A279" },
  { id: "tan", label: "Tan", base: "#A96C3E", shadow: "#81491F", highlight: "#C08D5D" },
  { id: "brown", label: "Brown", base: "#875127", shadow: "#63340F", highlight: "#A26F41" },
  { id: "deep", label: "Deep", base: "#63381B", shadow: "#44210B", highlight: "#7E5231" },
  { id: "espresso", label: "Espresso", base: "#43220F", shadow: "#291206", highlight: "#5E3823" },
];

/** Textures matter as much as length — coils, curls, locs and braids included. */
export const HAIR_STYLES = [
  { id: "bald", label: "Bald" },
  { id: "buzz", label: "Buzz cut" },
  { id: "crop", label: "Short crop" },
  { id: "coils", label: "Coily afro" },
  { id: "curls", label: "Loose curls" },
  { id: "locs", label: "Locs" },
  { id: "braids", label: "Box braids" },
  { id: "bun", label: "Top knot" },
  { id: "long", label: "Long straight" },
  { id: "wavyBob", label: "Wavy bob" },
];

export const HAIR_COLORS = [
  { id: "jet", label: "Jet black", base: "#17161A", shadow: "#08070A" },
  { id: "darkBrown", label: "Dark brown", base: "#3B2415", shadow: "#21130A" },
  { id: "chestnut", label: "Chestnut", base: "#6B3A1E", shadow: "#46220F" },
  { id: "auburn", label: "Auburn", base: "#8C3B1B", shadow: "#5C230E" },
  { id: "ginger", label: "Ginger", base: "#C2571F", shadow: "#8B3A11" },
  { id: "blonde", label: "Blonde", base: "#D8A43F", shadow: "#A87724" },
  { id: "platinum", label: "Platinum", base: "#E3DECF", shadow: "#B4AE9D" },
  { id: "silver", label: "Silver", base: "#A8A7A5", shadow: "#77766F" },
  { id: "electricCyan", label: "Electric cyan", base: "#22D3EE", shadow: "#0E7490" },
  { id: "hotMagenta", label: "Hot magenta", base: "#E11D8F", shadow: "#8E0E57" },
];

export const FACIAL_HAIR = [
  { id: "none", label: "Clean shaven" },
  { id: "stubble", label: "Stubble" },
  { id: "moustache", label: "Moustache" },
  { id: "goatee", label: "Goatee" },
  { id: "fullBeard", label: "Full beard" },
];

/**
 * `theme` follows the live `--color-primary` token so the character re-skins
 * with the active theme.
 */
export const TOP_COLORS = [
  { id: "theme", label: "Theme accent", base: "var(--color-primary, #00FFCC)" },
  { id: "slate", label: "Slate", base: "#475569" },
  { id: "charcoal", label: "Charcoal", base: "#22262E" },
  { id: "indigo", label: "Indigo", base: "#4F46E5" },
  { id: "teal", label: "Teal", base: "#0D9488" },
  { id: "rust", label: "Rust", base: "#B44B21" },
  { id: "mustard", label: "Mustard", base: "#CA9B23" },
  { id: "plum", label: "Plum", base: "#6D2C6B" },
  { id: "bone", label: "Bone", base: "#D8D2C4" },
];

export const DISPLAY_SETUPS = [
  { id: "laptop", label: "Laptop", phrase: "a laptop" },
  { id: "monitor", label: "External monitor", phrase: "an external monitor" },
  { id: "dual", label: "Dual monitors", phrase: "dual monitors" },
];

export const DESK_SURFACES = [
  { id: "oak", label: "Oak", base: "#B5803F", shadow: "#875A27", highlight: "#D8A660" },
  { id: "walnut", label: "Walnut", base: "#6B4226", shadow: "#492B17", highlight: "#8C5B36" },
  { id: "ebony", label: "Ebony", base: "#2B2B30", shadow: "#17171A", highlight: "#404048" },
  { id: "whiteLaminate", label: "White laminate", base: "#E4E7EC", shadow: "#BFC4CD", highlight: "#F6F7F9" },
  { id: "concrete", label: "Concrete", base: "#8C8E93", shadow: "#67696E", highlight: "#A8AAAF" },
  { id: "bamboo", label: "Bamboo", base: "#CBA36A", shadow: "#A07A44", highlight: "#E2C08D" },
];

export const CHAIR_COLORS = [
  { id: "graphite", label: "Graphite", base: "#3A3F48", shadow: "#23272E" },
  { id: "blackMesh", label: "Black mesh", base: "#1E2128", shadow: "#0E1014" },
  { id: "crimson", label: "Crimson", base: "#7F1D2E", shadow: "#50101D" },
  { id: "teal", label: "Teal", base: "#14575C", shadow: "#0A3538" },
  { id: "olive", label: "Olive", base: "#4C5A33", shadow: "#2F381F" },
  { id: "camel", label: "Camel", base: "#8B6B4A", shadow: "#5D462E" },
];

export const BACKDROPS = [
  { id: "night", label: "Night", phrase: "at night" },
  { id: "day", label: "Day", phrase: "in daylight" },
];

/**
 * Single-select axes. `swatch` names the option key the panel renders as a
 * colour chip; axes without it render as plain text buttons.
 *
 * Companions are no longer one of these. A single "companion" axis could only
 * ever hold Luna or nobody; they are now a list — see `companions` below and
 * src/config/sceneItems.js.
 */
export const AVATAR_CHOICES = [
  { id: "skinTone", label: "Skin tone", group: "character", swatch: "base", options: SKIN_TONES },
  { id: "hairStyle", label: "Hair style", group: "character", options: HAIR_STYLES },
  { id: "hairColor", label: "Hair colour", group: "character", swatch: "base", options: HAIR_COLORS },
  { id: "facialHair", label: "Facial hair", group: "character", options: FACIAL_HAIR },
  { id: "topColor", label: "Top colour", group: "character", swatch: "base", options: TOP_COLORS },
  { id: "display", label: "Display setup", group: "desk", options: DISPLAY_SETUPS },
  { id: "deskSurface", label: "Desk surface", group: "desk", swatch: "base", options: DESK_SURFACES },
  { id: "chairColor", label: "Chair colour", group: "desk", swatch: "base", options: CHAIR_COLORS },
  { id: "backdrop", label: "Time of day", group: "scene", options: BACKDROPS },
];

/** Boolean axes. */
export const AVATAR_TOGGLES = [
  { id: "glasses", label: "Glasses", group: "character" },
  { id: "headphones", label: "Headphones", group: "character" },
  { id: "mug", label: "Coffee mug", group: "desk" },
  { id: "plant", label: "Plant", group: "desk" },
  { id: "books", label: "Books", group: "desk" },
  { id: "lamp", label: "Desk lamp", group: "desk" },
  { id: "mechKeyboard", label: "Mechanical keyboard", group: "desk" },
  { id: "phone", label: "Phone", group: "desk" },
  { id: "bookcase", label: "Bookcase", group: "scene" },
];

export const AVATAR_GROUPS = [
  { id: "character", label: "Character" },
  { id: "desk", label: "Desk" },
  { id: "scene", label: "Scene" },
];

/* --------------------------------------------------------------------------
 * Placeable props
 *
 * Everything on the desk used to be nailed to a literal in the SVG, so two
 * props enabled at once could land on top of each other and there was no way
 * to move either. Each one now carries an anchor — the point where it meets
 * the surface it stands on — plus the bounding box it occupies relative to that
 * anchor. The SVG art itself is unchanged: it is drawn at the default anchor and
 * translated by the delta, which keeps this file the single source of truth for
 * where things are.
 *
 * Companions and plushies go through the same placement code as PLACED ITEMS
 * (see `findItem`). The difference is only where their position lives: a desk
 * prop's in `avatar.positions`, an added item's on the item itself.
 * ------------------------------------------------------------------------ */

/** Desk surface line. The SVG imports this so the two can never drift. */
export const DESK_TOP = 344;

/**
 * Legal regions, expressed as the box a prop's FOOTPRINT must stay inside.
 * Desk props keep a shallow vertical band around the desk top so the arrow
 * keys can push something a little further back or forward without letting it
 * float off the surface; floor items live below the desk line (y=366). Each
 * bookcase shelf is a line: things sit ON a board, not in front of it.
 */
export const SCENE_SURFACES = Object.freeze({
  desk: Object.freeze({ minX: 104, maxX: 708, minY: DESK_TOP - 10, maxY: DESK_TOP + 8 }),
  floor: Object.freeze({ minX: 40, maxX: 780, minY: 436, maxY: 488 }),
  ...BOOKCASE_SURFACES,
});

/**
 * `depth` is the paint order: lower numbers are further back and draw first.
 * The display plane sits at DISPLAY_DEPTH, so a prop with a smaller depth is
 * painted behind the screen and a larger one in front of it.
 */
export const DISPLAY_DEPTH = 50;

export const SCENE_PROPS = Object.freeze([
  { id: "lamp", label: "Desk lamp", surface: "desk", depth: 10, x: 276, y: DESK_TOP, box: { dx: -21, dy: -96, w: 69, h: 96 } },
  { id: "plant", label: "Plant", surface: "desk", depth: 20, x: 135, y: DESK_TOP, box: { dx: -27, dy: -94, w: 64, h: 94 } },
  { id: "books", label: "Books", surface: "desk", depth: 30, x: 205, y: DESK_TOP, box: { dx: -33, dy: -32, w: 66, h: 32 } },
  { id: "keyboard", label: "Keyboard", surface: "desk", depth: 60, x: 400, y: DESK_TOP, box: { dx: -60, dy: -22, w: 120, h: 22 } },
  { id: "phone", label: "Phone", surface: "desk", depth: 70, x: 542, y: DESK_TOP, box: { dx: -18, dy: -40, w: 36, h: 40 } },
  { id: "mug", label: "Coffee mug", surface: "desk", depth: 80, x: 495, y: DESK_TOP, box: { dx: -17, dy: -34, w: 46, h: 34 } },
].map(Object.freeze));

export const PROP_IDS = SCENE_PROPS.map((prop) => prop.id);

export const findProp = (id) => SCENE_PROPS.find((prop) => prop.id === id);

/** Ordered back-to-front, the order the SVG paints them in. */
export const propsByDepth = () => [...SCENE_PROPS].sort((a, b) => a.depth - b.depth);

/**
 * Which avatar key switches each prop on. The keyboard is the odd one out: it
 * appears for a mechanical board OR for any non-laptop display.
 */
export const isPropEnabled = (avatar, id) => {
  if (!avatar) return false;
  if (id === "keyboard") return Boolean(avatar.mechKeyboard) || avatar.display !== "laptop";
  return Boolean(avatar[id]);
};

/** The avatar key a toggle in the panel maps to, for re-slotting on enable. */
export const PROP_FOR_TOGGLE = Object.freeze({
  mug: "mug",
  plant: "plant",
  books: "books",
  lamp: "lamp",
  phone: "phone",
  mechKeyboard: "keyboard",
  display: "keyboard",
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** "shelf" in a surface list stands for every shelf of the bookcase. */
const expandSurfaces = (surfaces) =>
  surfaces.flatMap((surface) => (surface === "shelf" ? SHELF_IDS : [surface]));

/** The anchor range that keeps an item's whole footprint inside one surface. */
const surfaceBounds = (item, surfaceId) => {
  const surface = SCENE_SURFACES[surfaceId] || SCENE_SURFACES.desk;
  const minX = surface.minX - item.box.dx;
  const maxX = surface.maxX - (item.box.dx + item.box.w);
  return {
    minX,
    maxX: Math.max(minX, maxX),
    minY: surface.minY,
    maxY: surface.maxY,
  };
};

/** The anchor range that keeps a prop's whole footprint inside its surface. */
export const propBounds = (prop) => surfaceBounds(prop, prop.surface);

/** Absolute bounding box for a prop sitting at `position`. */
export const propFootprint = (prop, position) => ({
  x: position.x + prop.box.dx,
  y: position.y + prop.box.dy,
  w: prop.box.w,
  h: prop.box.h,
});

const boxesOverlap = (a, b, pad = 0) =>
  a.x < b.x + b.w + pad &&
  b.x < a.x + a.w + pad &&
  a.y < b.y + b.h + pad &&
  b.y < a.y + a.h + pad;

/**
 * Clamp into the nearest legal surface. An item allowed on several (a bird on
 * the desk or any shelf) goes to whichever one the point is closest to, which
 * is what makes dragging it from the desk up onto a shelf feel direct.
 * Garbage coordinates fall back one axis at a time to `fallback`.
 */
const clampToSurfaces = (surfaces, box, position, fallback) => {
  const source = position && typeof position === "object" && !Array.isArray(position) ? position : {};
  const x = Number.isFinite(source.x) ? source.x : fallback.x;
  const y = Number.isFinite(source.y) ? source.y : fallback.y;

  let best = null;
  surfaces.forEach((surfaceId) => {
    const bounds = surfaceBounds({ box }, surfaceId);
    const candidate = { x: clamp(x, bounds.minX, bounds.maxX), y: clamp(y, bounds.minY, bounds.maxY) };
    const distance = Math.hypot(candidate.x - x, candidate.y - y);
    if (!best || distance < best.distance) best = { ...candidate, surface: surfaceId, distance };
  });

  return { x: best.x, y: best.y, surface: best.surface };
};

/** The surface a placed item is standing on. */
const surfaceOf = (item, position) => clampToSurfaces(item.surfaces, item.box, position, position).surface;

/* ---------------- default spawn points for added items ---------------- */

/** Where a newly added item starts looking for room, per surface. */
const SPAWN = Object.freeze({
  floor: Object.freeze({ x: 186, y: 480 }),
  desk: Object.freeze({ x: 600, y: DESK_TOP }),
  shelf1: Object.freeze({ x: 870, y: BOOKCASE.boards[0] }),
});

const spawnFor = (surfaces) => {
  const first = surfaces[0];
  return SPAWN[first] || SPAWN.shelf1;
};

/* ---------------- placed items: props, companions, plushies ---------------- */

export const companionKey = (id) => `companion:${id}`;
export const plushKey = (kind) => `plush:${kind}`;

const propItem = (avatar, prop) => ({
  key: prop.id,
  type: "prop",
  label: prop.label,
  surfaces: [prop.surface],
  box: prop.box,
  depth: prop.depth,
  prop,
  position: readPosition(avatar, prop.id),
});

const companionItem = (companion) => {
  const kind = findCompanionKind(companion.kind);
  return {
    key: companionKey(companion.id),
    type: "companion",
    label: companionName(kind, companion.variant),
    surfaces: expandSurfaces(kind.surfaces),
    box: kind.box,
    depth: kind.depth,
    kind,
    companion,
    position: { x: companion.x, y: companion.y },
  };
};

const plushItem = (plush) => {
  const kind = findPlushKind(plush.kind);
  return {
    key: plushKey(plush.kind),
    type: "plush",
    label: `${kind.label} plushie`,
    surfaces: expandSurfaces(kind.surfaces),
    box: kind.box,
    depth: kind.depth,
    kind,
    plush,
    position: { x: plush.x, y: plush.y },
  };
};

/**
 * Everything currently in the scene that can be moved, back to front. Stable
 * within a depth, so two companions never swap paint order mid-drag.
 */
export const placedItems = (avatar) => {
  if (!avatar) return [];
  const items = [
    ...SCENE_PROPS.filter((prop) => isPropEnabled(avatar, prop.id)).map((prop) => propItem(avatar, prop)),
    ...(avatar.companions || []).filter((c) => findCompanionKind(c.kind)).map(companionItem),
    ...(avatar.bookcase ? avatar.plushies || [] : []).filter((p) => findPlushKind(p.kind)).map(plushItem),
  ];
  return items
    .map((item, order) => ({ item, order }))
    .sort((a, b) => a.item.depth - b.item.depth || a.order - b.order)
    .map(({ item }) => item);
};

/** Resolve any key — a prop id, `companion:<id>` or `plush:<kind>` — to its item. */
export const findItem = (avatar, key) => {
  const prop = findProp(key);
  if (prop) return propItem(avatar, prop);
  if (typeof key !== "string" || !avatar) return null;
  if (key.startsWith("companion:")) {
    const companion = (avatar.companions || []).find((c) => companionKey(c.id) === key);
    return companion && findCompanionKind(companion.kind) ? companionItem(companion) : null;
  }
  if (key.startsWith("plush:")) {
    const plush = (avatar.plushies || []).find((p) => plushKey(p.kind) === key);
    return plush && findPlushKind(plush.kind) ? plushItem(plush) : null;
  }
  return null;
};

/** Clamp a position for any item into the nearest surface it may stand on. */
export const clampItemPosition = (item, position) => {
  const { x, y } = clampToSurfaces(item.surfaces, item.box, position, item.position);
  return { x, y };
};

/** The range an item's anchor can take across on the surface it is on. */
export const itemBounds = (item, position = item.position) =>
  surfaceBounds(item, surfaceOf(item, position));

/**
 * The display is furniture, not a prop, but it still owns desk space. The
 * keyboard is exempt: it is *meant* to sit in front of the screen.
 */
const displayFootprint = (avatar) => {
  if (avatar.display === "laptop") return [{ x: 328, y: 242, w: 144, h: 102 }];
  if (avatar.display === "dual") {
    return [
      { x: 330, y: 232, w: 140, h: 112 },
      { x: 556, y: 236, w: 160, h: 110 },
    ];
  }
  return [{ x: 330, y: 232, w: 140, h: 112 }];
};

/**
 * Every box an item has to avoid at `position`, excluding the item itself:
 * whatever else stands on the same surface, plus the furniture that owns part
 * of it (the display on the desk, the books on a shelf).
 */
const boxesToAvoid = (avatar, item, position) => {
  const surface = surfaceOf(item, position);
  const boxes = [];

  placedItems(avatar).forEach((other) => {
    if (other.key === item.key) return;
    if (surfaceOf(other, other.position) !== surface) return;
    boxes.push(propFootprint(other, other.position));
  });

  if (surface === "desk" && item.key !== "keyboard") boxes.push(...displayFootprint(avatar));
  boxes.push(...shelfBookBoxes(surface));

  return boxes;
};

/** Every box a prop has to avoid, excluding the prop itself. */
export const occupiedBoxes = (avatar, id) => {
  const item = findItem(avatar, id);
  return item ? boxesToAvoid(avatar, item, item.position) : [];
};

/** Does `position` put the item under `key` on top of anything in the scene? */
export const itemCollides = (avatar, key, position) => {
  const item = findItem(avatar, key);
  if (!item) return false;
  const box = propFootprint(item, position);
  return boxesToAvoid(avatar, item, position).some((other) => boxesOverlap(box, other, 2));
};

/** Does `position` put `id` on top of anything currently in the scene? */
export const propCollides = itemCollides;

/** Clamp an arbitrary value into a prop's legal region, repairing garbage. */
export const clampPropPosition = (id, position) => {
  const prop = findProp(id);
  if (!prop) return null;
  const { x, y } = clampToSurfaces([prop.surface], prop.box, position, prop);
  return { x, y };
};

export const readPosition = (avatar, id) => {
  const stored = avatar && avatar.positions ? avatar.positions[id] : null;
  return clampPropPosition(id, stored);
};

export const DEFAULT_PROP_POSITIONS = Object.freeze(
  Object.fromEntries(SCENE_PROPS.map((prop) => [prop.id, Object.freeze({ x: prop.x, y: prop.y })])),
);

/**
 * First free slot for an item being switched on or added.
 *
 * Starts where the item already is (so toggling something off and back on puts
 * it where you left it), then walks outwards along that surface in both
 * directions until the footprint stops overlapping anything. An item allowed on
 * several surfaces tries the rest in order before giving up. Falls back to the
 * starting point if everything is genuinely full — better a stacked prop than
 * a prop that refuses to appear.
 */
export const findFreeSlot = (avatar, key, from) => {
  const item = findItem(avatar, key);
  if (!item) return null;

  const start = clampItemPosition(item, from || item.position);
  if (!itemCollides(avatar, key, start)) return start;

  const startSurface = surfaceOf(item, start);
  const surfaces = [startSurface, ...item.surfaces.filter((s) => s !== startSurface)];
  const STEP = 8;

  for (const surfaceId of surfaces) {
    const bounds = surfaceBounds(item, surfaceId);
    const y = clamp(start.y, bounds.minY, bounds.maxY);
    const originX = clamp(start.x, bounds.minX, bounds.maxX);

    // A fixed stride alone misses tight gaps — a shelf that seats exactly three
    // plushies needs each one flush against its neighbour. So also try the spot
    // just clear of each obstacle's edges, and walk outwards from the start.
    const candidates = new Set();
    for (let x = bounds.minX; x <= bounds.maxX; x += STEP) candidates.add(x);
    candidates.add(bounds.maxX);
    boxesToAvoid(avatar, item, { x: originX, y }).forEach((box) => {
      candidates.add(box.x + box.w + 3 - item.box.dx);
      candidates.add(box.x - 3 - (item.box.dx + item.box.w));
    });

    const ordered = [...candidates]
      .filter((x) => x >= bounds.minX && x <= bounds.maxX)
      .sort((a, b) => Math.abs(a - originX) - Math.abs(b - originX) || a - b);

    for (const x of [originX, ...ordered]) {
      if (!itemCollides(avatar, key, { x, y })) return { x, y };
    }
  }

  return start;
};

/**
 * The arrow keys cannot reach a shelf by nudging: shelves are lines, so a
 * vertical nudge clamps straight back. When an item is pressed against the top
 * or bottom of its surface, up/down hops to the next surface it may stand on in
 * that direction instead. Returns null when there is nowhere to go.
 */
export const hopSurface = (item, position, direction) => {
  const current = surfaceOf(item, position);
  const bounds = surfaceBounds(item, current);
  const atEdge = direction < 0 ? position.y <= bounds.minY : position.y >= bounds.maxY;
  if (!atEdge) return null;

  const others = item.surfaces
    .filter((s) => s !== current)
    .map((s) => ({ id: s, bounds: surfaceBounds(item, s) }))
    .filter(({ bounds: b }) => (direction < 0 ? b.maxY < bounds.minY : b.minY > bounds.maxY))
    .sort((a, b) =>
      direction < 0 ? b.bounds.maxY - a.bounds.maxY : a.bounds.minY - b.bounds.minY,
    );
  if (!others.length) return null;

  const next = others[0].bounds;
  return {
    x: clamp(position.x, next.minX, next.maxX),
    y: direction < 0 ? next.maxY : next.minY,
  };
};

/* ---------------- adding, removing and moving ---------------- */

const nextCompanionId = (kindId, taken) => {
  for (let n = 1; ; n += 1) {
    const id = `${kindId}-${n}`;
    if (!taken.has(id)) return id;
  }
};

/** Add a companion in the first free space. Unknown kinds and a full scene are no-ops. */
export const addCompanion = (avatar, kindId, variantId) => {
  const kind = findCompanionKind(kindId);
  const companions = avatar.companions || [];
  if (!kind || companions.length >= MAX_COMPANIONS) return avatar;

  const id = nextCompanionId(kind.id, new Set(companions.map((c) => c.id)));
  const spawn = spawnFor(expandSurfaces(kind.surfaces));
  const companion = {
    id,
    kind: kind.id,
    variant: resolveVariant(kind, variantId ?? kind.defaultVariant)?.id ?? null,
    ...spawn,
  };
  const next = { ...avatar, companions: [...companions, companion] };
  const slot = findFreeSlot(next, companionKey(id), spawn);
  return { ...next, companions: [...companions, { ...companion, ...slot }] };
};

export const removeCompanion = (avatar, id) => ({
  ...avatar,
  companions: (avatar.companions || []).filter((c) => c.id !== id),
});

export const setCompanionVariant = (avatar, id, variantId) => ({
  ...avatar,
  companions: (avatar.companions || []).map((c) => {
    if (c.id !== id) return c;
    const variant = resolveVariant(findCompanionKind(c.kind), variantId);
    return { ...c, variant: variant ? variant.id : null };
  }),
});

export const hasPlush = (avatar, kindId) =>
  (avatar.plushies || []).some((plush) => plush.kind === kindId);

/** Put a plushie on the first shelf with room, or take it off the bookcase. */
export const togglePlush = (avatar, kindId) => {
  const kind = findPlushKind(kindId);
  if (!kind) return avatar;
  const plushies = avatar.plushies || [];
  if (hasPlush(avatar, kindId)) {
    return { ...avatar, plushies: plushies.filter((plush) => plush.kind !== kindId) };
  }

  const surfaces = expandSurfaces(kind.surfaces);
  const withPlush = (position) => ({
    ...avatar,
    plushies: [...plushies, { kind: kind.id, ...position }],
  });

  // Walk the shelves top to bottom; the first genuinely free spot wins.
  for (const surfaceId of surfaces) {
    const bounds = surfaceBounds(kind, surfaceId);
    const start = { x: bounds.minX, y: bounds.minY };
    const slot = findFreeSlot(withPlush(start), plushKey(kind.id), start);
    if (!itemCollides(withPlush(slot), plushKey(kind.id), slot)) return withPlush(slot);
  }

  return withPlush(spawnFor(surfaces));
};

/** Write a clamped position for any item back to wherever that item keeps it. */
export const moveItem = (avatar, key, position) => {
  const item = findItem(avatar, key);
  if (!item) return avatar;
  const clamped = clampItemPosition(item, {
    x: Math.round(position.x),
    y: Math.round(position.y),
  });

  if (item.type === "prop") {
    return { ...avatar, positions: { ...avatar.positions, [key]: clamped } };
  }
  if (item.type === "companion") {
    return {
      ...avatar,
      companions: avatar.companions.map((c) => (c.id === item.companion.id ? { ...c, ...clamped } : c)),
    };
  }
  return {
    ...avatar,
    plushies: avatar.plushies.map((p) => (p.kind === item.plush.kind ? { ...p, ...clamped } : p)),
  };
};

/** Lay every enabled prop out so nothing starts the scene stacked. */
export const arrangeProps = (avatar) => {
  const positions = {};
  SCENE_PROPS.forEach((prop) => {
    positions[prop.id] = { ...DEFAULT_PROP_POSITIONS[prop.id] };
  });

  const working = { ...avatar, positions, companions: [], plushies: [] };
  propsByDepth().forEach((prop) => {
    if (!isPropEnabled(working, prop.id)) return;
    positions[prop.id] = findFreeSlot(working, prop.id, DEFAULT_PROP_POSITIONS[prop.id]);
  });

  return positions;
};

/**
 * The default is Shug — this is his workshop, so the scene opens as him.
 * Matched from apps/react/public/assets/images/shug_headshot.jpg: shaved head,
 * full dark beard, heavy brows, warm olive skin, broad build, navy jacket.
 *
 * Luna is drawn from photographs of Shug's late dog: a big lean fawn mix with a
 * cream chest and legs, dark mascara markings around the eyes, a grey muzzle
 * and large soft folded ears. She is the default companion because this scene
 * is his. Attendees reshape all of it from the Customize panel.
 */
export const DEFAULT_AVATAR = Object.freeze({
  skinTone: "tan",
  hairStyle: "bald",
  hairColor: "jet",
  facialHair: "fullBeard",
  topColor: "indigo",
  glasses: false,
  headphones: false,
  display: "laptop",
  deskSurface: "walnut",
  chairColor: "graphite",
  backdrop: "night",
  mug: true,
  plant: true,
  books: false,
  lamp: true,
  mechKeyboard: false,
  phone: false,
  bookcase: true,
  positions: DEFAULT_PROP_POSITIONS,
  companions: Object.freeze([Object.freeze({ id: "luna", kind: "dog", variant: "luna", x: 186, y: 480 })]),
  plushies: Object.freeze([
    Object.freeze({ kind: "pochita", x: 870, y: BOOKCASE.boards[0] }),
    Object.freeze({ kind: "reacher", x: 890, y: BOOKCASE.boards[1] }),
    Object.freeze({ kind: "luna", x: 900, y: BOOKCASE.boards[2] }),
  ]),
});

/** Resolve an option object by id, falling back to the list's first entry. */
export const findOption = (options, id) =>
  options.find((option) => option.id === id) || options[0];

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Instance ids end up in DOM keys and aria text, so keep them boring. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * Companions from storage. Before companions were a list, a scene stored
 * `companion: "luna" | "none"` with Luna's position under `positions.companion`;
 * that shape is migrated rather than thrown away.
 */
const normalizeCompanions = (source) => {
  let list;
  if (Array.isArray(source.companions)) {
    list = source.companions;
  } else if (source.companion === "none") {
    return [];
  } else if (source.companion === "luna") {
    const legacy = isRecord(source.positions) ? source.positions.companion : null;
    list = [{ id: "luna", kind: "dog", variant: "luna", ...(isRecord(legacy) ? legacy : {}) }];
  } else {
    list = DEFAULT_AVATAR.companions;
  }

  const taken = new Set();
  const result = [];
  list.forEach((entry) => {
    if (result.length >= MAX_COMPANIONS || !isRecord(entry)) return;
    const kind = findCompanionKind(entry.kind);
    if (!kind) return;
    const id = typeof entry.id === "string" && SAFE_ID.test(entry.id) && !taken.has(entry.id)
      ? entry.id
      : nextCompanionId(kind.id, taken);
    taken.add(id);
    const surfaces = expandSurfaces(kind.surfaces);
    const { x, y } = clampToSurfaces(surfaces, kind.box, entry, spawnFor(surfaces));
    result.push({ id, kind: kind.id, variant: resolveVariant(kind, entry.variant)?.id ?? null, x, y });
  });
  return result;
};

/** One of each plushie, each clamped onto a shelf. */
const normalizePlushies = (source) => {
  const list = Array.isArray(source.plushies) ? source.plushies : DEFAULT_AVATAR.plushies;
  const seen = new Set();
  const result = [];
  list.forEach((entry) => {
    if (!isRecord(entry)) return;
    const kind = findPlushKind(entry.kind);
    if (!kind || seen.has(kind.id)) return;
    seen.add(kind.id);
    const surfaces = expandSurfaces(kind.surfaces);
    const { x, y } = clampToSurfaces(surfaces, kind.box, entry, spawnFor(surfaces));
    result.push({ kind: kind.id, x, y });
  });
  return result;
};

/**
 * Repair any input into a complete, renderable avatar config.
 *
 * Accepts partial objects, unknown ids, wrong types, `null`, JSON that used to
 * be a different shape — anything. The scene never has to defend itself.
 */
export const normalizeAvatar = (input) => {
  const source = isRecord(input) ? input : {};
  const result = { ...DEFAULT_AVATAR };

  AVATAR_CHOICES.forEach(({ id, options }) => {
    const candidate = source[id];
    if (typeof candidate === "string" && options.some((option) => option.id === candidate)) {
      result[id] = candidate;
    }
  });

  AVATAR_TOGGLES.forEach(({ id }) => {
    if (typeof source[id] === "boolean") {
      result[id] = source[id];
    }
  });

  /*
   * Positions are rebuilt key by key rather than spread, so a stale blob can
   * neither smuggle in an unknown prop nor hand back a shared reference to the
   * frozen defaults. `clampPropPosition` repairs NaN, strings, nulls, missing
   * axes and anything outside the legal region.
   */
  const rawPositions = isRecord(source.positions) ? source.positions : {};

  result.positions = Object.fromEntries(
    SCENE_PROPS.map((prop) => [prop.id, clampPropPosition(prop.id, rawPositions[prop.id])]),
  );

  result.companions = normalizeCompanions(source);
  result.plushies = normalizePlushies(source);

  return result;
};

const pick = (options) => options[Math.floor(Math.random() * options.length)].id;

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** A complete, valid, deliberately varied config. */
export const randomAvatar = () => {
  let result = {};

  AVATAR_CHOICES.forEach(({ id, options }) => {
    result[id] = pick(options);
  });

  AVATAR_TOGGLES.forEach(({ id }) => {
    result[id] = Math.random() < 0.5;
  });

  // A random scene still has to be a legible one: lay the props out rather
  // than dropping them all on their defaults where several would collide.
  result.positions = arrangeProps(result);
  result.companions = [];
  result.plushies = [];

  shuffle(COMPANION_KINDS)
    .slice(0, Math.floor(Math.random() * 4))
    .forEach((kind) => {
      result = addCompanion(result, kind.id, kind.variants.length ? pick(kind.variants) : null);
    });

  shuffle(PLUSH_KINDS)
    .slice(0, Math.floor(Math.random() * 5))
    .forEach((kind) => {
      result = togglePlush(result, kind.id);
    });

  return result;
};

/**
 * Plain-language summary of the current scene, used as the SVG's `aria-label`
 * so screen reader users hear their own customization.
 */
export const describeAvatar = (input) => {
  const avatar = normalizeAvatar(input);
  const skin = findOption(SKIN_TONES, avatar.skinTone);
  const hairStyle = findOption(HAIR_STYLES, avatar.hairStyle);
  const hairColor = findOption(HAIR_COLORS, avatar.hairColor);
  const facialHair = findOption(FACIAL_HAIR, avatar.facialHair);
  const top = findOption(TOP_COLORS, avatar.topColor);
  const display = findOption(DISPLAY_SETUPS, avatar.display);
  const desk = findOption(DESK_SURFACES, avatar.deskSurface);
  const chair = findOption(CHAIR_COLORS, avatar.chairColor);
  const backdrop = findOption(BACKDROPS, avatar.backdrop);

  const hair =
    avatar.hairStyle === "bald"
      ? "a shaved head"
      : `${hairColor.label.toLowerCase()} ${hairStyle.label.toLowerCase()}`;

  const worn = [
    avatar.glasses && "glasses",
    avatar.headphones && "headphones",
    avatar.facialHair !== "none" &&
      `${article(facialHair.label)} ${facialHair.label.toLowerCase()}`,
  ].filter(Boolean);

  const props = AVATAR_TOGGLES.filter(
    ({ id, group }) => group === "desk" && avatar[id],
  ).map(({ label }) => label.toLowerCase());

  // Luna is named and described; she is the reason this list exists.
  const companions = avatar.companions.map((companion) => {
    const kind = findCompanionKind(companion.kind);
    if (kind.id === "dog" && companion.variant === "luna") {
      return "Luna, a fawn dog with a cream chest and dark markings around her eyes";
    }
    const name = companionName(kind, companion.variant);
    return kind.naming === "kind" ? name : `${article(name)} ${name.toLowerCase()}`;
  });

  const plushies = avatar.bookcase
    ? avatar.plushies.map((plush) => findPlushKind(plush.kind).label)
    : [];

  const sentences = [
    `Illustration of a developer with ${skin.label.toLowerCase()} skin and ${hair}, in ${article(top.label)} ${top.label.toLowerCase()} top, coding ${backdrop.phrase}.`,
    worn.length ? `They are wearing ${listToText(worn)}.` : "",
    `They sit in a ${chair.label.toLowerCase()} chair at a ${desk.label.toLowerCase()} desk with ${display.phrase}.`,
    props.length ? `On the desk: ${listToText(props)}.` : "The desk is clear.",
    // Companions are part of the picture, so they belong in the alt text too.
    companions.length ? `With them: ${listToText(companions)}.` : "",
    avatar.bookcase
      ? plushies.length
        ? `A bookcase beside the desk holds ${plushies.length === 1 ? "a plushie" : "plushies"} of ${listToText(plushies)}.`
        : "A bookcase stands beside the desk."
      : "",
  ];

  return sentences.filter(Boolean).join(" ");
};

/** "a" or "an", so the alt text does not read "a indigo top". */
function article(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function listToText(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Storage helpers. Reads and writes are both guarded: `localStorage` throws
 * outright in Safari private mode and in some embedded webviews.
 */
export const loadAvatar = () => {
  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AVATAR };
    return normalizeAvatar(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AVATAR };
  }
};

export const saveAvatar = (avatar) => {
  try {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(normalizeAvatar(avatar)));
    return true;
  } catch {
    return false;
  }
};

export const clearStoredAvatar = () => {
  try {
    window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
