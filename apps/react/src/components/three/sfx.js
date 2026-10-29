import { INK, PAPER, RED } from "./ink";

/**
 * Manga sound-effect lettering over a WebGL scene.
 *
 * Real DOM text, not texture: it stays razor sharp at projector resolution
 * and a screen reader can skip it (aria-hidden). Each letter is its own span
 * so the word can "boil" — letters re-jitter a few times a second, the way
 * hand lettering never sits identically between two panels.
 *
 * The scene owns timing; this only draws. Call `update(...)` every frame.
 */

const hash = (n) => {
  const s = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return s - Math.floor(s);
};

export const createSfx = (overlay, { text, crescendo = 0, color = PAPER, weight = 900, italic = true } = {}) => {
  if (!overlay) return { update() {}, dispose() {} };
  const word = document.createElement("div");
  word.setAttribute("aria-hidden", "true");
  Object.assign(word.style, {
    position: "absolute",
    left: "0",
    top: "0",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    fontFamily: '"Bangers", "Impact", "Haettenschweiler", "Arial Black", sans-serif',
    fontWeight: String(weight),
    fontStyle: italic ? "italic" : "normal",
    lineHeight: "1",
    letterSpacing: "-0.02em",
    color,
    WebkitTextStroke: `0.075em ${INK}`,
    paintOrder: "stroke fill",
    textShadow: `0.07em 0.07em 0 ${RED}`,
    transformOrigin: "50% 50%",
    willChange: "transform, opacity",
    opacity: "0",
  });
  const letters = [...text].map((ch, i) => {
    const span = document.createElement("span");
    span.textContent = ch;
    span.style.display = "inline-block";
    // Crescendo: letters swell toward the end of the word, like the sound.
    span.style.fontSize = `${1 + (i / Math.max(1, text.length - 1)) * crescendo}em`;
    word.appendChild(span);
    return span;
  });
  overlay.appendChild(word);
  let lastBoil = -1;

  return {
    /**
     * @param {object} s
     * @param {number} s.x, s.y   position, percent of the overlay (word centre)
     * @param {number} s.size     font size in vmin-ish units of the overlay height
     * @param {number} s.rotate   degrees
     * @param {number} s.scale    pop scale
     * @param {number} s.opacity
     * @param {number} s.boil     integer frame of the boil; letters re-jitter when it changes
     * @param {number} s.jitter   jitter strength in em
     * @param {[number, number]} s.shake  extra px offset (camera shake)
     */
    update({ x, y, size, rotate = 0, scale = 1, opacity = 1, boil = 0, jitter = 0.04, shake = [0, 0] }) {
      const h = overlay.clientHeight || 1;
      word.style.fontSize = `${(size * h) / 100}px`;
      word.style.opacity = String(opacity);
      word.style.transform = `translate(${(x / 100) * overlay.clientWidth + shake[0]}px, ${(y / 100) * h + shake[1]}px) translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`;
      if (boil !== lastBoil) {
        lastBoil = boil;
        letters.forEach((span, i) => {
          const dx = (hash(i * 7 + boil) - 0.5) * jitter;
          const dy = (hash(i * 13 + boil * 3) - 0.5) * jitter * 2;
          const r = (hash(i * 3 + boil * 5) - 0.5) * jitter * 120;
          span.style.transform = `translate(${dx}em, ${dy}em) rotate(${r}deg)`;
        });
      }
    },
    dispose() {
      word.remove();
    },
  };
};

/**
 * A manga narration box: paper panel, ink border, small caps. For the one line
 * of story a scene needs ("He plays the fight first.").
 */
export const createCaption = (overlay, { x = 4, y = 6, align = "left" } = {}) => {
  if (!overlay) return { update() {}, dispose() {} };
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, {
    position: "absolute",
    left: align === "left" ? `${x}%` : "auto",
    right: align === "right" ? `${x}%` : "auto",
    top: `${y}%`,
    padding: "0.5em 0.8em",
    background: PAPER,
    color: INK,
    border: `0.16em solid ${INK}`,
    boxShadow: `0.25em 0.25em 0 ${INK}`,
    fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    pointerEvents: "none",
    opacity: "0",
  });
  overlay.appendChild(box);
  let last = null;
  return {
    update({ text, size = 2.4, opacity = 1 }) {
      const h = overlay.clientHeight || 1;
      box.style.fontSize = `${(size * h) / 100}px`;
      box.style.opacity = String(text ? opacity : 0);
      if (text && text !== last) {
        last = text;
        box.textContent = text;
      }
    },
    dispose() {
      box.remove();
    },
  };
};
