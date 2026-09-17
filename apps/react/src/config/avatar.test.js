/**
 * Avatar config tests
 *
 * `normalizeAvatar` is the only thing standing between a stale/corrupt
 * localStorage blob and a broken landing page, so it is tested hard.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  AVATAR_CHOICES,
  AVATAR_STORAGE_KEY,
  AVATAR_TOGGLES,
  DEFAULT_AVATAR,
  DEFAULT_PROP_POSITIONS,
  SCENE_PROPS,
  SCENE_SURFACES,
  SKIN_TONES,
  HAIR_STYLES,
  addCompanion,
  arrangeProps,
  clampPropPosition,
  clearStoredAvatar,
  describeAvatar,
  findFreeSlot,
  findItem,
  findOption,
  hopSurface,
  itemCollides,
  isPropEnabled,
  loadAvatar,
  moveItem,
  normalizeAvatar,
  placedItems,
  plushKey,
  companionKey,
  removeCompanion,
  setCompanionVariant,
  togglePlush,
  propBounds,
  propCollides,
  propFootprint,
  propsByDepth,
  randomAvatar,
  readPosition,
  saveAvatar,
} from "./avatar";
import { BOOKCASE, COMPANION_KINDS, MAX_COMPANIONS, PLUSH_KINDS, shelfBookBoxes } from "./sceneItems";

const CHOICE_KEYS = AVATAR_CHOICES.map((choice) => choice.id);
const TOGGLE_KEYS = AVATAR_TOGGLES.map((toggle) => toggle.id);
const PROP_KEYS = SCENE_PROPS.map((prop) => prop.id);
const ALL_KEYS = [...CHOICE_KEYS, ...TOGGLE_KEYS, "positions", "companions", "plushies"];

const expectComplete = (avatar) => {
  expect(Object.keys(avatar).sort()).toEqual([...ALL_KEYS].sort());
  AVATAR_CHOICES.forEach(({ id, options }) => {
    expect(options.some((option) => option.id === avatar[id])).toBe(true);
  });
  TOGGLE_KEYS.forEach((key) => {
    expect(typeof avatar[key]).toBe("boolean");
  });
  expect(Object.keys(avatar.positions).sort()).toEqual([...PROP_KEYS].sort());
  SCENE_PROPS.forEach((prop) => {
    const bounds = propBounds(prop);
    const { x, y } = avatar.positions[prop.id];
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(bounds.minX);
    expect(x).toBeLessThanOrEqual(bounds.maxX);
    expect(y).toBeGreaterThanOrEqual(bounds.minY);
    expect(y).toBeLessThanOrEqual(bounds.maxY);
  });
};

const positionsOf = (overrides = {}) => ({
  ...Object.fromEntries(
    SCENE_PROPS.map((prop) => [prop.id, { ...DEFAULT_PROP_POSITIONS[prop.id] }]),
  ),
  ...overrides,
});

describe("normalizeAvatar", () => {
  it("passes a fully valid config through unchanged", () => {
    const valid = {
      skinTone: "espresso",
      hairStyle: "locs",
      hairColor: "auburn",
      facialHair: "goatee",
      topColor: "rust",
      glasses: false,
      headphones: false,
      display: "dual",
      deskSurface: "concrete",
      chairColor: "crimson",
      backdrop: "day",
      mug: false,
      plant: false,
      books: true,
      lamp: false,
      mechKeyboard: true,
      phone: true,
      bookcase: false,
      positions: positionsOf({ mug: { x: 600, y: 344 } }),
      companions: [
        { id: "luna", kind: "dog", variant: "luna", x: 186, y: 480 },
        { id: "pochita-1", kind: "pochita", variant: null, x: 600, y: 344 },
      ],
      plushies: [{ kind: "vegeta", x: 900, y: 352 }],
    };

    expect(normalizeAvatar(valid)).toEqual(valid);
  });

  it("fills the gaps in a partial config from the defaults", () => {
    const result = normalizeAvatar({ skinTone: "deep", display: "monitor" });

    expect(result.skinTone).toBe("deep");
    expect(result.display).toBe("monitor");
    expect(result.hairStyle).toBe(DEFAULT_AVATAR.hairStyle);
    expect(result.chairColor).toBe(DEFAULT_AVATAR.chairColor);
    expect(result.mug).toBe(DEFAULT_AVATAR.mug);
    expectComplete(result);
  });

  it("repairs unknown option ids back to the default for that axis", () => {
    const result = normalizeAvatar({
      skinTone: "chartreuse",
      hairStyle: "mullet-from-2009",
      display: "holodeck",
      backdrop: 42,
      chairColor: null,
    });

    expect(result.skinTone).toBe(DEFAULT_AVATAR.skinTone);
    expect(result.hairStyle).toBe(DEFAULT_AVATAR.hairStyle);
    expect(result.display).toBe(DEFAULT_AVATAR.display);
    expect(result.backdrop).toBe(DEFAULT_AVATAR.backdrop);
    expect(result.chairColor).toBe(DEFAULT_AVATAR.chairColor);
    expectComplete(result);
  });

  it("keeps known values while discarding unknown ones in the same object", () => {
    const result = normalizeAvatar({ skinTone: "porcelain", hairColor: "neon-plaid" });

    expect(result.skinTone).toBe("porcelain");
    expect(result.hairColor).toBe(DEFAULT_AVATAR.hairColor);
  });

  it("coerces non-boolean toggle values to the default rather than trusting them", () => {
    const result = normalizeAvatar({
      glasses: "yes",
      headphones: 1,
      mug: null,
      plant: undefined,
      books: "true",
    });

    TOGGLE_KEYS.forEach((key) => {
      expect(result[key]).toBe(DEFAULT_AVATAR[key]);
    });
  });

  it("accepts explicit false for toggles", () => {
    const result = normalizeAvatar({ glasses: false, lamp: false });

    expect(result.glasses).toBe(false);
    expect(result.lamp).toBe(false);
  });

  it("returns the defaults for empty input", () => {
    expect(normalizeAvatar({})).toEqual({ ...DEFAULT_AVATAR });
  });

  it("returns the defaults for null, undefined and non-objects", () => {
    [null, undefined, "", 0, false, "laptop", 12, [], [1, 2, 3], NaN].forEach((input) => {
      const result = normalizeAvatar(input);
      expect(result).toEqual({ ...DEFAULT_AVATAR });
      expectComplete(result);
    });
  });

  it("drops keys it does not recognise", () => {
    const result = normalizeAvatar({ skinTone: "tan", jetpack: true, legacyHair: "spiky" });

    expect(result).not.toHaveProperty("jetpack");
    expect(result).not.toHaveProperty("legacyHair");
    expectComplete(result);
  });

  it("does not mutate its input or the frozen defaults", () => {
    const input = { skinTone: "fair" };
    const result = normalizeAvatar(input);

    result.skinTone = "espresso";

    expect(input).toEqual({ skinTone: "fair" });
    // Assert the frozen defaults were not mutated, without pinning the value:
    // DEFAULT_AVATAR is the owner's likeness and is expected to be retuned.
    expect(DEFAULT_AVATAR.skinTone).not.toBe("espresso");
    expect(Object.isFrozen(DEFAULT_AVATAR)).toBe(true);
  });

  it("is idempotent", () => {
    const once = normalizeAvatar({ hairStyle: "braids", books: true, display: "nope" });
    expect(normalizeAvatar(once)).toEqual(once);
  });
});

/**
 * Prop positions.
 *
 * Every desk prop and every added item carries an {x, y} anchor so they can be
 * dragged or arrow-keyed. The same rule applies as to every other axis: a
 * stale or hostile localStorage blob must not be able to put a prop somewhere
 * the scene cannot draw it.
 */
describe("prop positions", () => {
  it("ships a default position for every placeable prop", () => {
    expect(Object.keys(DEFAULT_PROP_POSITIONS).sort()).toEqual([...PROP_KEYS].sort());
    expect(Object.keys(DEFAULT_AVATAR.positions).sort()).toEqual([...PROP_KEYS].sort());

    SCENE_PROPS.forEach((prop) => {
      expect(DEFAULT_AVATAR.positions[prop.id]).toEqual({ x: prop.x, y: prop.y });
    });
  });

  it("keeps every default inside its own legal region", () => {
    expectComplete(normalizeAvatar({}));
  });

  it("keeps a prop's whole footprint on its surface, not just its anchor", () => {
    SCENE_PROPS.forEach((prop) => {
      const bounds = propBounds(prop);
      const surface = SCENE_SURFACES[prop.surface];

      const left = propFootprint(prop, { x: bounds.minX, y: prop.y });
      const right = propFootprint(prop, { x: bounds.maxX, y: prop.y });

      expect(left.x).toBeGreaterThanOrEqual(surface.minX);
      expect(right.x + right.w).toBeLessThanOrEqual(surface.maxX);
    });
  });

  it("puts desk props on the desk and floor props below the desk line", () => {
    SCENE_PROPS.forEach((prop) => {
      if (prop.surface === "desk") {
        expect(prop.y).toBe(344);
      } else {
        expect(prop.y).toBeGreaterThan(366);
      }
    });
  });

  it("clamps a position that is off the end of the surface", () => {
    const farLeft = clampPropPosition("mug", { x: -5000, y: 344 });
    const farRight = clampPropPosition("mug", { x: 5000, y: 344 });
    const bounds = propBounds(SCENE_PROPS.find((prop) => prop.id === "mug"));

    expect(farLeft.x).toBe(bounds.minX);
    expect(farRight.x).toBe(bounds.maxX);
  });

  it("clamps a floor companion into the floor band rather than onto the desk", () => {
    const { companions } = normalizeAvatar({
      companions: [
        { id: "a", kind: "cat", x: 300, y: 10 },
        { id: "b", kind: "cat", x: 300, y: 900 },
      ],
    });

    expect(companions[0].y).toBe(SCENE_SURFACES.floor.minY);
    expect(companions[0].y).toBeGreaterThan(366);
    expect(companions[1].y).toBe(SCENE_SURFACES.floor.maxY);
  });

  it("repairs a malformed coordinate one axis at a time", () => {
    const prop = SCENE_PROPS.find((entry) => entry.id === "lamp");

    expect(clampPropPosition("lamp", { x: 300, y: Number.NaN })).toEqual({ x: 300, y: prop.y });
    expect(clampPropPosition("lamp", { x: "300", y: 344 })).toEqual({ x: prop.x, y: 344 });
    expect(clampPropPosition("lamp", { y: 344 })).toEqual({ x: prop.x, y: 344 });
    expect(clampPropPosition("lamp", { x: Infinity, y: -Infinity })).toEqual({
      x: prop.x,
      y: prop.y,
    });
  });

  it("falls back to the default for a position that is not an object at all", () => {
    [null, undefined, 42, "500,344", [500, 344], true, {}].forEach((input) => {
      expect(clampPropPosition("plant", input)).toEqual(DEFAULT_PROP_POSITIONS.plant);
    });
  });

  it("returns null for a prop that does not exist", () => {
    expect(clampPropPosition("hovercraft", { x: 1, y: 2 })).toBe(null);
  });
});

describe("normalizeAvatar positions", () => {
  it("repairs out-of-range coordinates from storage", () => {
    const result = normalizeAvatar({
      positions: { mug: { x: 99999, y: -99999 } },
    });

    const mugBounds = propBounds(SCENE_PROPS.find((prop) => prop.id === "mug"));
    expect(result.positions.mug.x).toBe(mugBounds.maxX);
    expect(result.positions.mug.y).toBe(SCENE_SURFACES.desk.minY);
    expectComplete(result);
  });

  it("repairs NaN, missing and wrongly typed coordinates", () => {
    const result = normalizeAvatar({
      positions: {
        mug: { x: Number.NaN, y: Number.NaN },
        plant: { x: 200 },
        books: "over there",
        lamp: null,
        phone: [1, 2],
      },
    });

    expect(result.positions.mug).toEqual(DEFAULT_PROP_POSITIONS.mug);
    expect(result.positions.plant).toEqual({ x: 200, y: DEFAULT_PROP_POSITIONS.plant.y });
    expect(result.positions.books).toEqual(DEFAULT_PROP_POSITIONS.books);
    expect(result.positions.lamp).toEqual(DEFAULT_PROP_POSITIONS.lamp);
    expect(result.positions.phone).toEqual(DEFAULT_PROP_POSITIONS.phone);
    expectComplete(result);
  });

  it("fills in positions when the key is missing or the wrong shape", () => {
    [undefined, null, "left", 7, [], { }].forEach((positions) => {
      const result = normalizeAvatar({ positions });
      expect(result.positions).toEqual(positionsOf());
      expectComplete(result);
    });
  });

  it("drops position entries for props that do not exist", () => {
    const result = normalizeAvatar({
      positions: { mug: { x: 500, y: 344 }, hovercraft: { x: 10, y: 10 } },
    });

    expect(result.positions).not.toHaveProperty("hovercraft");
    expect(result.positions.mug).toEqual({ x: 500, y: 344 });
  });

  it("keeps a valid moved position exactly as it was", () => {
    const moved = { x: 250, y: 338 };
    expect(normalizeAvatar({ positions: { mug: moved } }).positions.mug).toEqual(moved);
  });

  it("never hands back a reference into the frozen defaults", () => {
    const first = normalizeAvatar({});
    first.positions.mug.x = 1;

    expect(DEFAULT_AVATAR.positions.mug.x).toBe(495);
    expect(DEFAULT_PROP_POSITIONS.mug.x).toBe(495);
    expect(normalizeAvatar({}).positions.mug.x).toBe(495);
  });

  it("is idempotent with positions in play", () => {
    const once = normalizeAvatar({ positions: { mug: { x: 9999, y: 300 } }, books: true });
    expect(normalizeAvatar(once)).toEqual(once);
  });
});

describe("collision and placement", () => {
  const propAt = (id, avatar) => propFootprint(
    SCENE_PROPS.find((prop) => prop.id === id),
    readPosition(avatar, id),
  );

  const overlap = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it("paints back to front, lowest depth first", () => {
    const depths = propsByDepth().map((prop) => prop.depth);
    expect([...depths].sort((a, b) => a - b)).toEqual(depths);
  });

  it("knows which props the current config actually shows", () => {
    expect(isPropEnabled({ ...DEFAULT_AVATAR, mug: true }, "mug")).toBe(true);
    expect(isPropEnabled({ ...DEFAULT_AVATAR, mug: false }, "mug")).toBe(false);
    // The keyboard is implied by any non-laptop display, not just the toggle.
    expect(isPropEnabled({ ...DEFAULT_AVATAR, display: "laptop", mechKeyboard: false }, "keyboard")).toBe(false);
    expect(isPropEnabled({ ...DEFAULT_AVATAR, display: "monitor", mechKeyboard: false }, "keyboard")).toBe(true);
  });

  it("reports a collision when two props are stacked", () => {
    const avatar = normalizeAvatar({
      ...DEFAULT_AVATAR,
      books: true,
      positions: { books: { x: 205, y: 344 }, plant: { x: 205, y: 344 } },
    });

    expect(propCollides(avatar, "books", { x: 205, y: 344 })).toBe(true);
  });

  it("finds a free slot instead of dropping a prop on an occupied one", () => {
    const avatar = normalizeAvatar({
      ...DEFAULT_AVATAR,
      books: true,
      positions: { books: { x: 135, y: 344 } },
    });

    const slot = findFreeSlot(avatar, "books");

    expect(propCollides(avatar, "books", slot)).toBe(false);
    expect(slot).not.toEqual({ x: 135, y: 344 });
  });

  it("leaves a prop where it is when that spot is already free", () => {
    const avatar = normalizeAvatar({ ...DEFAULT_AVATAR, mug: true, plant: false, lamp: false });
    expect(findFreeSlot(avatar, "mug")).toEqual(readPosition(avatar, "mug"));
  });

  it("lays every enabled prop out without overlaps", () => {
    const crowded = normalizeAvatar({
      ...DEFAULT_AVATAR,
      mug: true,
      plant: true,
      books: true,
      lamp: true,
      phone: true,
      mechKeyboard: true,
    });
    const arranged = { ...crowded, positions: arrangeProps(crowded) };

    const desk = SCENE_PROPS.filter(
      (prop) => prop.surface === "desk" && isPropEnabled(arranged, prop.id),
    );

    desk.forEach((a, i) => {
      desk.slice(i + 1).forEach((b) => {
        expect(overlap(propAt(a.id, arranged), propAt(b.id, arranged))).toBe(false);
      });
    });
  });
});

describe("randomAvatar", () => {
  it("always produces a config that survives normalization untouched", () => {
    for (let i = 0; i < 40; i += 1) {
      const random = randomAvatar();
      expectComplete(random);
      expect(normalizeAvatar(random)).toEqual(random);
    }
  });
});

describe("findOption", () => {
  it("resolves a known id", () => {
    expect(findOption(SKIN_TONES, "deep").label).toBe("Deep");
  });

  it("falls back to the first option for an unknown id", () => {
    expect(findOption(HAIR_STYLES, "not-a-style")).toBe(HAIR_STYLES[0]);
  });
});

describe("describeAvatar", () => {
  it("describes the current customization in plain language", () => {
    const description = describeAvatar({
      skinTone: "deep",
      hairStyle: "locs",
      hairColor: "jet",
      glasses: true,
      headphones: false,
      display: "dual",
      mug: true,
      plant: false,
      books: false,
      lamp: false,
      mechKeyboard: false,
      phone: false,
    });

    expect(description).toMatch(/deep skin/i);
    expect(description).toMatch(/jet black locs/i);
    expect(description).toMatch(/glasses/i);
    expect(description).not.toMatch(/headphones/i);
    expect(description).toMatch(/dual monitors/i);
    expect(description).toMatch(/coffee mug/i);
  });

  it("says the head is shaved instead of naming a hair colour", () => {
    const description = describeAvatar({ hairStyle: "bald", hairColor: "ginger" });

    expect(description).toMatch(/shaved head/i);
    expect(description).not.toMatch(/ginger/i);
  });

  it("reports an empty desk when every prop is off", () => {
    const off = Object.fromEntries(TOGGLE_KEYS.map((key) => [key, false]));
    expect(describeAvatar(off)).toMatch(/desk is clear/i);
  });

  it("produces a usable label for garbage input", () => {
    expect(describeAvatar(undefined)).toEqual(describeAvatar(DEFAULT_AVATAR));
    expect(describeAvatar("not-an-avatar")).toEqual(describeAvatar({}));
  });
});

describe("storage round trip", () => {
  afterEach(() => {
    clearStoredAvatar();
  });

  it("brings a moved prop back exactly where it was left", () => {
    const moved = normalizeAvatar({
      ...DEFAULT_AVATAR,
      books: true,
      positions: { mug: { x: 612, y: 338 } },
      companions: [{ id: "luna", kind: "dog", variant: "luna", x: 420, y: 462 }],
    });

    expect(saveAvatar(moved)).toBe(true);
    const restored = loadAvatar();

    expect(restored.positions.mug).toEqual({ x: 612, y: 338 });
    expect(restored.companions[0]).toMatchObject({ x: 420, y: 462 });
    expect(restored).toEqual(moved);
    expectComplete(restored);
  });

  it("repairs a stored position that is out of range or corrupt", () => {
    window.localStorage.setItem(
      AVATAR_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_AVATAR,
        positions: { mug: { x: 100000, y: "up" }, plant: null, ghost: { x: 1, y: 2 } },
      }),
    );

    const restored = loadAvatar();
    const mugBounds = propBounds(SCENE_PROPS.find((prop) => prop.id === "mug"));

    expect(restored.positions.mug.x).toBe(mugBounds.maxX);
    expect(restored.positions.mug.y).toBe(DEFAULT_PROP_POSITIONS.mug.y);
    expect(restored.positions.plant).toEqual(DEFAULT_PROP_POSITIONS.plant);
    expect(restored.positions).not.toHaveProperty("ghost");
    expectComplete(restored);
  });

  it("survives a blob written before positions existed", () => {
    window.localStorage.setItem(
      AVATAR_STORAGE_KEY,
      JSON.stringify({ skinTone: "deep", hairStyle: "locs", mug: true }),
    );

    const restored = loadAvatar();

    expect(restored.skinTone).toBe("deep");
    expect(restored.positions).toEqual(positionsOf());
    expectComplete(restored);
  });

  it("falls back to the defaults when the stored value is not JSON", () => {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, "{not json");
    expect(loadAvatar()).toEqual({ ...DEFAULT_AVATAR });
    expectComplete(loadAvatar());
  });
});

describe("companions", () => {
  it("migrates a scene saved when Luna was the only companion", () => {
    const result = normalizeAvatar({ companion: "luna", positions: { companion: { x: 420, y: 462 } } });
    expect(result.companions).toEqual([{ id: "luna", kind: "dog", variant: "luna", x: 420, y: 462 }]);
    expect(result).not.toHaveProperty("companion");
  });

  it("migrates an old scene that had turned Luna off", () => {
    expect(normalizeAvatar({ companion: "none" }).companions).toEqual([]);
  });

  it("drops unknown kinds and junk, repairs variants and duplicate ids", () => {
    const { companions } = normalizeAvatar({
      companions: [
        { id: "a", kind: "dragon" },
        "a cat",
        null,
        { id: "same", kind: "cat", variant: "plaid" },
        { id: "same", kind: "cat", variant: "black" },
        { id: "<script>", kind: "pochita", variant: "anything" },
      ],
    });

    expect(companions.map((c) => c.kind)).toEqual(["cat", "cat", "pochita"]);
    expect(companions[0].variant).toBe("tabby");
    expect(companions[1].variant).toBe("black");
    expect(new Set(companions.map((c) => c.id)).size).toBe(3);
    expect(companions[2].id).toMatch(/^pochita-\d+$/);
    expect(companions[2].variant).toBe(null);
  });

  it("caps the number of companions", () => {
    const many = Array.from({ length: MAX_COMPANIONS + 5 }, (_, i) => ({ id: `c${i}`, kind: "cat" }));
    expect(normalizeAvatar({ companions: many }).companions).toHaveLength(MAX_COMPANIONS);
  });

  it("adds a companion in free space and refuses once the scene is full", () => {
    let avatar = normalizeAvatar({ companions: [] });
    for (let i = 0; i < MAX_COMPANIONS; i += 1) avatar = addCompanion(avatar, "cat", "orange");

    expect(avatar.companions).toHaveLength(MAX_COMPANIONS);
    avatar.companions.forEach((c) => {
      expect(itemCollides(avatar, companionKey(c.id), c)).toBe(false);
    });
    expect(addCompanion(avatar, "dog")).toBe(avatar);
    expect(addCompanion(normalizeAvatar({ companions: [] }), "unicorn").companions).toEqual([]);
  });

  it("starts a new dog as a golden, because Luna is not a breed", () => {
    const avatar = addCompanion(normalizeAvatar({ companions: [] }), "dog");
    expect(avatar.companions[0].variant).toBe("golden");
  });

  it("changes a variant and removes a companion by id", () => {
    let avatar = addCompanion(normalizeAvatar({ companions: [] }), "dog", "husky");
    const { id } = avatar.companions[0];

    avatar = setCompanionVariant(avatar, id, "beagle");
    expect(avatar.companions[0].variant).toBe("beagle");
    expect(removeCompanion(avatar, id).companions).toEqual([]);
  });

  it("lets a bird perch on the desk or a shelf, whichever is nearer", () => {
    const { companions } = normalizeAvatar({
      companions: [
        { id: "a", kind: "bird", x: 600, y: 330 },
        { id: "b", kind: "bird", x: 900, y: 280 },
      ],
    });

    expect(companions[0].y).toBe(SCENE_SURFACES.desk.minY);
    expect(companions[1]).toMatchObject({ x: 900, y: BOOKCASE.boards[1] });
  });

  it("writes a move back onto the companion itself", () => {
    const avatar = normalizeAvatar({});
    const moved = moveItem(avatar, companionKey("luna"), { x: 500.4, y: 470.6 });
    expect(moved.companions[0]).toMatchObject({ x: 500, y: 471 });
    expect(moved.positions).toEqual(avatar.positions);
  });
});

describe("bookcase and plushies", () => {
  it("fits every plushie between two shelves", () => {
    const gap = BOOKCASE.boards[1] - BOOKCASE.boards[0];
    PLUSH_KINDS.forEach((kind) => expect(kind.box.h).toBeLessThan(gap - 8));
  });

  it("keeps one of each plushie and sits every one on a board", () => {
    const { plushies } = normalizeAvatar({
      plushies: [
        { kind: "power", x: 900, y: 300 },
        { kind: "power", x: 880, y: 196 },
        { kind: "gundam", x: 880, y: 196 },
      ],
    });

    expect(plushies).toHaveLength(1);
    expect(BOOKCASE.boards).toContain(plushies[0].y);
  });

  it("shelves the whole collection without overlapping books or each other", () => {
    let avatar = normalizeAvatar({ plushies: [] });
    PLUSH_KINDS.forEach((kind) => {
      avatar = togglePlush(avatar, kind.id);
    });

    expect(avatar.plushies).toHaveLength(PLUSH_KINDS.length);
    avatar.plushies.forEach((plush) => {
      expect(itemCollides(avatar, plushKey(plush.kind), plush)).toBe(false);
    });
  });

  it("takes a plushie back off the shelf when toggled again", () => {
    const avatar = togglePlush(normalizeAvatar({ plushies: [] }), "goku");
    expect(togglePlush(avatar, "goku").plushies).toEqual([]);
  });

  it("treats the shelf books as occupied", () => {
    const avatar = normalizeAvatar({ plushies: [{ kind: "denji", x: 842, y: BOOKCASE.boards[0] }] });
    const [book] = shelfBookBoxes("shelf1");
    expect(book).toBeDefined();
    expect(itemCollides(avatar, plushKey("denji"), avatar.plushies[0])).toBe(true);
  });

  it("hides plushies from the scene when the bookcase is off", () => {
    const keys = (avatar) => placedItems(avatar).map((item) => item.key);
    expect(keys(normalizeAvatar({ bookcase: true }))).toContain(plushKey("pochita"));
    expect(keys(normalizeAvatar({ bookcase: false }))).not.toContain(plushKey("pochita"));
  });

  it("hops a plushie between shelves with the arrow keys", () => {
    const avatar = normalizeAvatar({});
    const item = findItem(avatar, plushKey("pochita"));

    const down = hopSurface(item, item.position, 1);
    expect(down).toEqual({ x: item.position.x, y: BOOKCASE.boards[1] });
    expect(hopSurface(item, item.position, -1)).toBe(null);
    expect(hopSurface(item, { x: 900, y: BOOKCASE.boards[3] }, 1)).toBe(null);
  });

  it("keeps every companion kind's footprint on each surface it may use", () => {
    COMPANION_KINDS.forEach((kind) => {
      const avatar = addCompanion(normalizeAvatar({ companions: [] }), kind.id);
      const [companion] = avatar.companions;
      const item = findItem(avatar, companionKey(companion.id));
      const box = propFootprint(item, companion);
      expect(box.w).toBe(kind.box.w);
      expect(Number.isFinite(companion.x) && Number.isFinite(companion.y)).toBe(true);
    });
  });

  it("names companions and plushies in the alt text", () => {
    const text = describeAvatar(
      normalizeAvatar({
        companions: [
          { id: "luna", kind: "dog", variant: "luna" },
          { id: "c", kind: "cat", variant: "orange" },
          { id: "p", kind: "pochita" },
        ],
        plushies: [{ kind: "power" }, { kind: "goku" }],
      }),
    );

    expect(text).toContain("Luna, a fawn dog");
    expect(text).toContain("an orange cat");
    expect(text).toContain("Pochita");
    expect(text).toContain("plushies of Power and Goku");
  });
});
