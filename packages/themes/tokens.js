/**
 * Theme token resolution — contrast-aware.
 *
 * 27 of the 34 themes in this package declare only 7 of the 17 tokens the UI
 * needs (primary, secondary, accent, background, dark, text, textDark). The
 * other ten are derived here.
 *
 * The previous derivation was arithmetic only — lighten the canvas by a fixed
 * factor, pick black or white text off a hard luminance threshold — and it left
 * 28 of 34 themes failing WCAG AA somewhere. Worst cases were unreadable rather
 * than merely tight: `monochrome`'s primary sat at 1.03:1 against its own dark
 * surface, i.e. invisible.
 *
 * So derivation here does not guess and hope. It derives a starting value, then
 * MEASURES it and walks lightness until the pair actually clears its target, in
 * HSL so hue and saturation survive. A theme's brand colour is only moved when
 * it is genuinely unreadable, and only as far as it takes to fix that.
 *
 * Authored values win wherever they are legible. A declared token is passed
 * through untouched unless it fails its own contrast target — `reacher` set
 * mutedTextDark to #64748b, which measures 4.08:1 on its own dark surface, so
 * that one gets nudged. Readability outranks intent only where they conflict,
 * and themeContrast.test.js asserts every correction was actually justified.
 */

/* ── colour space ─────────────────────────────────────────────────────────── */

export const hexToRgb = (hex) => {
  if (!hex || typeof hex !== "string") return [0, 0, 0];
  const cleaned = hex.replace("#", "").trim().slice(0, 6);
  const expanded =
    cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const num = parseInt(expanded, 16);
  if (Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((x) => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, "0"))
    .join("")}`;

const rgbToHsl = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
};

const hslToRgb = (h, s, l) => {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
};

/** Set lightness (0-1) while preserving hue and saturation. */
const withLightness = (hex, l) => {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  const [r, g, b] = hslToRgb(h, s, Math.min(1, Math.max(0, l)));
  return rgbToHex(r, g, b);
};

const lightnessOf = (hex) => rgbToHsl(...hexToRgb(hex))[2];

export const lightenColor = (hex, factor) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
};

export const darkenColor = (hex, factor) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
};

/* ── contrast ─────────────────────────────────────────────────────────────── */

export const getLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio, 1:1 to 21:1. */
export const contrastRatio = (a, b) => {
  const la = getLuminance(a);
  const lb = getLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * Walk `color`'s lightness until it clears `target` against `bg`.
 *
 * Tries the direction away from the background first (lighten on a dark bg),
 * then the other way, then falls back to plain white or black — which is always
 * the best available contrast against any single colour.
 */
const ensureContrast = (color, bg, target) => {
  if (contrastRatio(color, bg) >= target) return color;

  const bgIsDark = getLuminance(bg) < 0.5;
  const start = lightnessOf(color);
  const directions = bgIsDark ? [1, -1] : [-1, 1];

  for (const dir of directions) {
    for (let step = 1; step <= 100; step += 1) {
      const l = start + dir * step * 0.01;
      if (l < 0 || l > 1) break;
      const candidate = withLightness(color, l);
      if (contrastRatio(candidate, bg) >= target) return candidate;
    }
  }
  // Fully saturated hues can top out below target; take the best extreme.
  return contrastRatio("#FFFFFF", bg) >= contrastRatio("#000000", bg) ? "#FFFFFF" : "#000000";
};

/** `fg` laid over `bg` at `alpha` — what a `bg-(--color-x)/15` chip renders as. */
export const mixColors = (fg, alpha, bg) => {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  return rgbToHex(...f.map((v, i) => v * alpha + b[i] * (1 - alpha)));
};

/**
 * Tune a brand colour to read as TEXT on the light canvas.
 *
 * 3:1 is enough for a rule or an icon, but these colours are used as body-size
 * text (`text-(--color-primary)` links, kickers, counts), and very often on a
 * 10-15% tint of themselves (`bg-(--color-primary)/10`). A tint sits between
 * the colour and the plane, so it is always the harder background. Every plane
 * is checked, because which one is hardest depends on the theme: the darkest
 * for a bone canvas, the lightest for a theme whose "light" canvas is dark.
 */
const ensureTextOnLight = (color, planes, target = 4.5, tint = 0.15) => {
  const passes = (c) =>
    planes.every(
      (p) => contrastRatio(c, p) >= target && contrastRatio(c, mixColors(c, tint, p)) >= target
    );
  if (passes(color)) return color;

  const hardest = planes.reduce((a, b) => (getLuminance(a) <= getLuminance(b) ? a : b));
  const start = lightnessOf(color);
  const directions = getLuminance(hardest) < 0.5 ? [1, -1] : [-1, 1];
  for (const dir of directions) {
    for (let step = 1; step <= 100; step += 1) {
      const l = start + dir * step * 0.01;
      if (l < 0 || l > 1) break;
      const candidate = withLightness(color, l);
      if (passes(candidate)) return candidate;
    }
  }
  return ensureContrast(color, hardest, target);
};

/** Best of black or white against `bg`, nudged if neither is enough. */
const readableOn = (bg, target = 4.5) => {
  const white = contrastRatio("#FFFFFF", bg);
  const black = contrastRatio("#050608", bg);
  if (white >= target || black >= target) return white >= black ? "#FFFFFF" : "#050608";
  return white >= black ? "#FFFFFF" : "#050608";
};

/* ── token resolution ─────────────────────────────────────────────────────── */

/** Every token the UI expects, in the order the CSS variables are written. */
export const TOKEN_KEYS = [
  "primary",
  "primaryOnLight",
  "primaryTextOnLight",
  "secondary",
  "secondaryOnLight",
  "accent",
  "accentOnLight",
  "background",
  "dark",
  "surface",
  "surfaceDark",
  "surfaceHover",
  "surfaceHoverDark",
  "border",
  "borderDark",
  "borderSubtle",
  "text",
  "textDark",
  "mutedText",
  "mutedTextDark",
  "primaryText",
];

/**
 * Contrast targets enforced during resolution, and asserted by the theme test.
 * 4.5 is WCAG AA for normal text; 3.0 is AA for large text and UI components.
 */
export const CONTRAST_TARGETS = [
  ["text", "surface", 4.5],
  ["text", "background", 4.5],
  ["mutedText", "surface", 4.5],
  ["textDark", "surfaceDark", 4.5],
  ["textDark", "dark", 4.5],
  ["mutedTextDark", "surfaceDark", 4.5],
  ["primaryText", "primary", 4.5],
  ["primary", "surfaceDark", 3.0],
  // The *OnLight brand colours are used as text in light mode, so they carry the
  // text target on every light plane, not the 3:1 non-text one.
  ["primaryOnLight", "surface", 4.5],
  ["primaryOnLight", "background", 4.5],
  ["primaryOnLight", "surfaceHover", 4.5],
  ["primaryTextOnLight", "primaryOnLight", 4.5],
  ["secondaryOnLight", "surface", 4.5],
  ["secondaryOnLight", "background", 4.5],
  ["secondaryOnLight", "surfaceHover", 4.5],
  ["accentOnLight", "surface", 4.5],
  ["accentOnLight", "background", 4.5],
  ["accentOnLight", "surfaceHover", 4.5],
  ["secondary", "surfaceDark", 3.0],
  ["accent", "surfaceDark", 3.0],
];

export const resolveThemeTokens = (theme) => {
  const c = theme?.colors || {};

  const darkCanvas = c.dark || "#020304";
  const lightCanvas = c.background || "#F9FAFB";

  const darkCanvasIsLight = getLuminance(darkCanvas) > 0.2;
  const lightCanvasIsDark = getLuminance(lightCanvas) < 0.3;

  // Surfaces sit one step off their canvas so cards separate from the page.
  const surfaceDarkSeed =
    c.surfaceDark ||
    (darkCanvasIsLight ? darkenColor(darkCanvas, 0.06) : lightenColor(darkCanvas, 0.05));
  const surfaceDark =
    surfaceDarkSeed.toLowerCase() === darkCanvas.toLowerCase()
      ? lightenColor(surfaceDarkSeed, 0.06)
      : surfaceDarkSeed;
  const surfaceHoverDark =
    c.surfaceHoverDark ||
    (darkCanvasIsLight ? darkenColor(darkCanvas, 0.12) : lightenColor(darkCanvas, 0.09));
  // A card has to be distinguishable from the page behind it. `github` declares
  // a pure-white background, so the old rule ("light canvas -> white surface")
  // produced surface === background and the card vanished. Guarantee a step.
  const surfaceSeed =
    c.surface || (lightCanvasIsDark ? lightenColor(lightCanvas, 0.08) : "#FFFFFF");
  const surface =
    surfaceSeed.toLowerCase() === lightCanvas.toLowerCase()
      ? darkenColor(surfaceSeed, 0.04)
      : surfaceSeed;
  const surfaceHover =
    c.surfaceHover ||
    (lightCanvasIsDark ? lightenColor(lightCanvas, 0.14) : darkenColor(surface, 0.03));

  const borderDark =
    c.borderDark ||
    (darkCanvasIsLight ? darkenColor(darkCanvas, 0.2) : lightenColor(darkCanvas, 0.12));
  const border =
    c.border ||
    (lightCanvasIsDark ? lightenColor(lightCanvas, 0.22) : darkenColor(lightCanvas, 0.12));

  // Brand colours are kept as authored unless they are actually unreadable on a
  // surface, in which case lightness moves just far enough to clear the bar.
  //
  // A mid-tone brand colour cannot always clear 3:1 against BOTH a light and a
  // dark surface — the two corrections pull in opposite directions and cancel.
  // So rather than mangle one value into satisfying neither, emit two: `primary`
  // is tuned for the dark canvas (this app is dark by default and by design),
  // and `primaryOnLight` is the same hue retuned for light surfaces.
  const primaryRaw = c.primary || "#3B82F6";
  const primary = ensureContrast(primaryRaw, surfaceDark, 3.0);
  // Tune against whichever light plane is DARKEST — that is the harder one for a
  // dark-ish brand colour to sit on. Tuning only against `surface` (usually near
  // white) left the hero at 2.8:1 on the slightly darker page background, and
  // tuning to 3:1 left every `text-(--color-primary)` label at ~3.5:1.
  const lightPlanes = [surface, lightCanvas, surfaceHover];
  const primaryOnLight = ensureTextOnLight(primaryRaw, lightPlanes);
  // Secondary and accent carry badges, rules and phase labels on dark surfaces,
  // so they need the same floor as primary. Several themes shipped values that
  // measured close to invisible there (divergentFist's secondary was 1.07:1).
  const secondary = ensureContrast(c.secondary || primary, surfaceDark, 3.0);
  const accent = ensureContrast(c.accent || primary, surfaceDark, 3.0);
  // ...and, like primary, they are tuned for the dark canvas: Pochita gold is
  // 2:1 as text on bone. Light mode gets its own retuned pair.
  const secondaryOnLight = ensureTextOnLight(c.secondary || primaryRaw, lightPlanes);
  const accentOnLight = ensureTextOnLight(c.accent || primaryRaw, lightPlanes);

  // Body text must clear its own canvas, not merely be "dark-ish".
  const text = ensureContrast(c.text || "#1F2937", surface, 4.5);
  const textDark = ensureContrast(c.textDark || "#FFFFFF", surfaceDark, 4.5);

  // Muted text is the most common real-world AA failure: it is derived from the
  // canvas rather than from the text colour, so it drifts toward the background.
  const mutedText = ensureContrast(c.mutedText || lightenColor(text, 0.35), surface, 4.5);
  const mutedTextDark = ensureContrast(
    c.mutedTextDark || darkenColor(textDark, 0.35),
    surfaceDark,
    4.5
  );

  // Text sitting ON a filled primary button.
  const primaryText = ensureContrast(c.primaryText || readableOn(primary), primary, 4.5);
  // The light-tuned primary needs its own button-text colour: a value legible
  // on #00F0C0 is not necessarily legible on the darker #00a383.
  const primaryTextOnLight = ensureContrast(readableOn(primaryOnLight), primaryOnLight, 4.5);

  const borderSubtle = c.borderSubtle || `${primary}26`;

  return {
    primary,
    primaryRaw,
    primaryOnLight,
    primaryTextOnLight,
    secondary,
    secondaryOnLight,
    accent,
    accentOnLight,
    background: lightCanvas,
    dark: darkCanvas,
    surface,
    surfaceDark,
    surfaceHover,
    surfaceHoverDark,
    border,
    borderDark,
    borderSubtle,
    text,
    textDark,
    mutedText,
    mutedTextDark,
    primaryText,
  };
};
