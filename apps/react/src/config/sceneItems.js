/**
 * Companions, plushies and the bookcase — the parts of the scene people ADD.
 *
 * The desk props in avatar.js are a fixed set, each switched on or off. These
 * are open-ended: a scene can hold several companions (two huskies and a
 * parrot is a legitimate desk), and a bookcase of plushies. So they are stored
 * as lists of placed instances rather than booleans, and this file is the
 * catalogue those lists are validated against.
 *
 * Geometry follows the same contract as SCENE_PROPS: an anchor where the item
 * meets its surface, and the box it occupies relative to that anchor. Art is
 * drawn with its anchor at (0, 0) — see src/components/scene/.
 */

/** Hard ceiling, so a scene stays a scene and storage stays small. */
export const MAX_COMPANIONS = 8;

/* --------------------------------------------------------------------------
 * Bookcase
 *
 * Stands to the right of the desk, in the strip the viewBox gained for it.
 * `boards` are the y of each shelf's top face — the line plushies stand on.
 * Each shelf keeps a few decorative books at one end; they are furniture, so
 * they own shelf space the same way the display owns desk space.
 * ------------------------------------------------------------------------ */
export const BOOKCASE = Object.freeze({
  x: 810,
  y: 118,
  w: 180,
  h: 360,
  inner: Object.freeze({ minX: 822, maxX: 978 }),
  boards: Object.freeze([196, 274, 352, 430]),
  // 22 wide each, so every shelf still seats three plushies beside its books.
  books: Object.freeze([
    Object.freeze({ shelf: 0, minX: 822, maxX: 844 }),
    Object.freeze({ shelf: 1, minX: 956, maxX: 978 }),
    Object.freeze({ shelf: 2, minX: 822, maxX: 844 }),
    Object.freeze({ shelf: 3, minX: 956, maxX: 978 }),
  ]),
});

export const SHELF_IDS = BOOKCASE.boards.map((_, i) => `shelf${i + 1}`);

/** One surface per shelf: a line, not a band — a plushie sits ON the board. */
export const BOOKCASE_SURFACES = Object.freeze(
  Object.fromEntries(
    BOOKCASE.boards.map((y, i) => [
      SHELF_IDS[i],
      Object.freeze({ minX: BOOKCASE.inner.minX, maxX: BOOKCASE.inner.maxX, minY: y, maxY: y }),
    ]),
  ),
);

/** The shelf books as occupied boxes, keyed by surface id. */
export const shelfBookBoxes = (surfaceId) => {
  const index = SHELF_IDS.indexOf(surfaceId);
  if (index === -1) return [];
  return BOOKCASE.books
    .filter((book) => book.shelf === index)
    .map((book) => ({ x: book.minX, y: BOOKCASE.boards[index] - 56, w: book.maxX - book.minX, h: 56 }));
};

/* --------------------------------------------------------------------------
 * Companions
 *
 * `surfaces` lists where a kind may stand; "shelf" means any bookcase shelf.
 * `depth` is paint order, as for desk props: floor animals sit behind the
 * display plane (50), anything that can climb onto the desk paints in front.
 * `naming` decides the spoken label: "variant" -> "Husky", "variantKind" ->
 * "Tabby cat", "kind" -> "Pochita".
 * ------------------------------------------------------------------------ */
export const COMPANION_FAMILIES = [
  { id: "pets", label: "Pets" },
  { id: "sidekicks", label: "Sidekicks" },
  { id: "characters", label: "Characters" },
];

const floor = ["floor"];

export const COMPANION_KINDS = Object.freeze(
  [
    {
      id: "dog",
      label: "Dog",
      family: "pets",
      surfaces: floor,
      depth: 40,
      box: { dx: -38, dy: -100, w: 76, h: 100 },
      naming: "variant",
      // Luna is one dog, not a breed: a new dog starts as a golden, and Luna
      // stays the first variant only so repaired data falls back to her.
      defaultVariant: "golden",
      variants: [
        { id: "luna", label: "Luna" },
        { id: "golden", label: "Golden" },
        { id: "husky", label: "Husky" },
        { id: "blackLab", label: "Black lab" },
        { id: "beagle", label: "Beagle" },
      ],
    },
    {
      id: "cat",
      label: "Cat",
      family: "pets",
      surfaces: floor,
      depth: 40,
      box: { dx: -23, dy: -58, w: 46, h: 58 },
      naming: "variantKind",
      variants: [
        { id: "tabby", label: "Tabby" },
        { id: "black", label: "Black" },
        { id: "orange", label: "Orange" },
        { id: "calico", label: "Calico" },
        { id: "tuxedo", label: "Tuxedo" },
      ],
    },
    {
      id: "bird",
      label: "Bird",
      family: "pets",
      surfaces: ["desk", "shelf"],
      depth: 65,
      box: { dx: -14, dy: -40, w: 28, h: 40 },
      naming: "variant",
      variants: [
        { id: "parrot", label: "Parrot" },
        { id: "cockatiel", label: "Cockatiel" },
        { id: "budgie", label: "Budgie" },
      ],
    },
    {
      id: "bunny",
      label: "Bunny",
      family: "pets",
      surfaces: floor,
      depth: 40,
      box: { dx: -20, dy: -46, w: 40, h: 46 },
      naming: "variantKind",
      variants: [
        { id: "white", label: "White" },
        { id: "brown", label: "Brown" },
      ],
    },
    {
      id: "hamster",
      label: "Hamster",
      family: "pets",
      surfaces: ["desk", "shelf"],
      depth: 65,
      box: { dx: -13, dy: -20, w: 26, h: 20 },
      naming: "variantKind",
      variants: [
        { id: "golden", label: "Golden" },
        { id: "white", label: "White" },
      ],
    },
    {
      id: "turtle",
      label: "Turtle",
      family: "pets",
      surfaces: ["desk", "floor"],
      depth: 65,
      box: { dx: -23, dy: -24, w: 46, h: 24 },
      naming: "kind",
      variants: [{ id: "green", label: "Green" }],
    },
    {
      id: "pochita",
      label: "Pochita",
      theme: "Chainsaw Man",
      family: "sidekicks",
      surfaces: ["floor", "desk"],
      depth: 65,
      box: { dx: -22, dy: -44, w: 44, h: 44 },
      naming: "kind",
    },
    {
      id: "meowy",
      label: "Meowy",
      theme: "Chainsaw Man",
      family: "sidekicks",
      surfaces: floor,
      depth: 40,
      box: { dx: -21, dy: -50, w: 42, h: 50 },
      naming: "kind",
    },
    {
      id: "nimbus",
      label: "Flying Nimbus",
      theme: "Dragon Ball",
      family: "sidekicks",
      surfaces: floor,
      depth: 40,
      box: { dx: -30, dy: -40, w: 60, h: 40 },
      naming: "kind",
    },
    {
      id: "divineDog",
      label: "Divine Dog",
      theme: "Jujutsu Kaisen",
      family: "sidekicks",
      surfaces: floor,
      depth: 40,
      box: { dx: -28, dy: -70, w: 56, h: 70 },
      naming: "variantKind",
      variants: [
        { id: "white", label: "White" },
        { id: "black", label: "Black" },
      ],
    },
    {
      id: "igris",
      label: "Igris",
      theme: "Solo Leveling",
      family: "sidekicks",
      surfaces: floor,
      depth: 40,
      box: { dx: -24, dy: -80, w: 48, h: 80 },
      naming: "kind",
    },
    ...[
      ["denji", "Denji", "Chainsaw Man"],
      ["power", "Power", "Chainsaw Man"],
      ["reze", "Reze", "Chainsaw Man"],
      ["bombDevil", "Bomb Devil", "Chainsaw Man"],
      ["reacher", "Reacher", "Reacher"],
      ["neagley", "Neagley", "Reacher"],
      ["roscoe", "Roscoe", "Reacher"],
      ["goku", "Goku", "Dragon Ball"],
      ["youngGoku", "Kid Goku", "Dragon Ball"],
      ["vegeta", "Vegeta", "Dragon Ball"],
    ].map(([id, label, theme]) => ({
      id,
      label,
      theme,
      family: "characters",
      surfaces: floor,
      depth: 40,
      box: id === "reacher" ? { dx: -31, dy: -100, w: 62, h: 100 } : { dx: -28, dy: -96, w: 56, h: 96 },
      naming: "kind",
    })),
  ].map((kind) =>
    Object.freeze({
      ...kind,
      box: Object.freeze(kind.box),
      surfaces: Object.freeze([...kind.surfaces]),
      variants: Object.freeze((kind.variants || []).map(Object.freeze)),
    }),
  ),
);

export const findCompanionKind = (id) => COMPANION_KINDS.find((kind) => kind.id === id);

/** Unknown or missing variant ids resolve to the kind's first variant, or null. */
export const resolveVariant = (kind, variantId) => {
  if (!kind || !kind.variants.length) return null;
  return kind.variants.find((variant) => variant.id === variantId) || kind.variants[0];
};

export const companionName = (kind, variantId) => {
  const variant = resolveVariant(kind, variantId);
  if (!variant || kind.naming === "kind") return kind.label;
  if (kind.naming === "variant") return variant.label;
  return `${variant.label} ${kind.label.toLowerCase()}`;
};

/* --------------------------------------------------------------------------
 * Plushies
 *
 * At most one of each: it is a collection, not an inventory. They only ever
 * live on the bookcase, so their surfaces are the shelves.
 * ------------------------------------------------------------------------ */
export const PLUSH_BOX = Object.freeze({ dx: -20, dy: -50, w: 40, h: 50 });

export const PLUSH_KINDS = Object.freeze(
  [
    ["pochita", "Pochita", "Chainsaw Man"],
    ["denji", "Denji", "Chainsaw Man"],
    ["power", "Power", "Chainsaw Man"],
    ["reze", "Reze", "Chainsaw Man"],
    ["bombDevil", "Bomb Devil", "Chainsaw Man"],
    ["reacher", "Reacher", "Reacher"],
    ["neagley", "Neagley", "Reacher"],
    ["roscoe", "Roscoe", "Reacher"],
    ["goku", "Goku", "Dragon Ball"],
    ["youngGoku", "Kid Goku", "Dragon Ball"],
    ["vegeta", "Vegeta", "Dragon Ball"],
    ["luna", "Luna", "Luna"],
  ].map(([id, label, theme]) =>
    Object.freeze({ id, label, theme, surfaces: Object.freeze(["shelf"]), depth: 90, box: PLUSH_BOX }),
  ),
);

export const findPlushKind = (id) => PLUSH_KINDS.find((kind) => kind.id === id);
