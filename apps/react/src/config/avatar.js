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
 */
/**
 * Companions.
 *
 * "luna" is drawn from photographs of Shug's late dog: a big lean fawn mix with
 * a cream chest and legs, dark mascara markings around the eyes, a grey muzzle
 * and large soft folded ears. She is the default because this scene is his.
 */
export const COMPANIONS = [
  { id: "none", label: "No companion" },
  { id: "luna", label: "Luna" },
];

export const COMPANION_POSES = [
  { id: "sitting", label: "Sitting up" },
  { id: "curled", label: "Curled up asleep" },
];

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
  { id: "companion", label: "Companion", group: "scene", options: COMPANIONS },
  { id: "companionPose", label: "Companion pose", group: "scene", options: COMPANION_POSES },
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
];

export const AVATAR_GROUPS = [
  { id: "character", label: "Character" },
  { id: "desk", label: "Desk" },
  { id: "scene", label: "Scene" },
];

/**
 * The default is Shug — this is his workshop, so the scene opens as him.
 * Matched from apps/react/public/assets/images/shug_headshot.jpg: shaved head,
 * full dark beard, heavy brows, warm olive skin, broad build, navy jacket.
 * Attendees reshape it from the Customize panel; nothing here is locked.
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
  companion: "luna",
  companionPose: "curled",
  mug: true,
  plant: true,
  books: false,
  lamp: true,
  mechKeyboard: false,
  phone: false,
});

/** Resolve an option object by id, falling back to the list's first entry. */
export const findOption = (options, id) =>
  options.find((option) => option.id === id) || options[0];

/**
 * Repair any input into a complete, renderable avatar config.
 *
 * Accepts partial objects, unknown ids, wrong types, `null`, JSON that used to
 * be a different shape — anything. The scene never has to defend itself.
 */
export const normalizeAvatar = (input) => {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
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

  return result;
};

const pick = (options) => options[Math.floor(Math.random() * options.length)].id;

/** A complete, valid, deliberately varied config. */
export const randomAvatar = () => {
  const result = {};

  AVATAR_CHOICES.forEach(({ id, options }) => {
    result[id] = pick(options);
  });

  AVATAR_TOGGLES.forEach(({ id }) => {
    result[id] = Math.random() < 0.5;
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

  const sentences = [
    `Illustration of a developer with ${skin.label.toLowerCase()} skin and ${hair}, in ${article(top.label)} ${top.label.toLowerCase()} top, coding ${backdrop.phrase}.`,
    worn.length ? `They are wearing ${listToText(worn)}.` : "",
    `They sit in a ${chair.label.toLowerCase()} chair at a ${desk.label.toLowerCase()} desk with ${display.phrase}.`,
    props.length ? `On the desk: ${listToText(props)}.` : "The desk is clear.",
    // The companion is part of the picture, so it belongs in the alt text too.
    avatar.companion === "luna"
      ? `Luna, a fawn dog with a cream chest and dark markings around her eyes, is ${
          avatar.companionPose === "curled" ? "curled up asleep" : "sitting up"
        } beside the desk.`
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
