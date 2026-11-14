import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, lightBeam, segment } from "../kit";
import { blendPose } from "../figure";
import { outline } from "../ink";
import { createModelFigure } from "../modelFigure";
import { createSfx } from "../sfx";
import { INK, LIGHT, PAPER, buildDaisy, createCast, createCuts, createFx, createInkWorld, createSets, seat } from "../rezeKit";

/**
 * IRIS OUT — the theme, cut to the song the way its music video is: the arc
 * from the first meeting to the blackout, on manga pages that slam in on the
 * bar, closing on an iris.
 *
 * Timed to the track (2:32, 135 BPM) and, on the song slide, locked to the
 * official video's own clock (`setProps({ clock })`). Sections follow the
 * video's:
 *
 *   0:00  intro — the night-school pool: Reze sits on the edge, legs in the
 *         water, and dips her hand in; Denji walks under a grey sky, looking
 *         up; Reze walks in the rain; they meet under the shelter; Makima's
 *         ringed eyes flash, mice in their shadow
 *   0:18  verse — her smile behind the café counter, the night school, the
 *         pool, her pulling him close
 *   0:49  pre-chorus and chorus — frantic cuts; the music drops; BOOM: she
 *         becomes the Bomb Devil, and an iris closes round her (tunnel vision)
 *   1:15  verse two — the films the video tips its hat to, each opened and
 *         shut on an iris (the song's title):
 *           1:15  Pulp Fiction: a floor-level shot of Makima's bare feet
 *                 doing the twist; cut to the windshield, Aki driving, her
 *                 bare feet up on the dash (Once Upon a Time in Hollywood)
 *           1:19  Constantine: the Angel Devil coming down a beam of light
 *           1:21  Bande à part: Denji, Power and Aki doing the Madison in
 *                 a line across the café, in black and white
 *           1:23  The Horse in Motion: Denji on a galloping horse, six
 *                 sepia frames in a strip
 *           1:25  Léon: Makima holds up a grenade pin on her finger to Denji
 *   1:27  bridge — Chainsaw Man and the Bomb Devil across a rainy city, a
 *         different move every bar (her blast-off, finger bombs, the cord,
 *         the chase, the grab); the Typhoon Devil; then the festival: the
 *         clash in the air, her punch, his saws, then his chain wound round
 *         the two of them; they fall together into the sea, wash up on the
 *         sand at dawn as Denji and Reze, and a white daisy and a red one
 *         come down onto the water
 *   1:56  last chorus — blows traded in fire, fireworks and rain; her human
 *         smile, then her bomb face, cut against each other; iris out to black
 *
 * Every panel is its own shot. Before a panel draws, its shot puts the cast
 * in its set, lights it and frames it; `render` draws them scissored.
 */

const BEAT = 60 / 135;
const BAR = BEAT * 4;
const CYCLE = 152;
const STATIC_TIME = BAR * 49 + 0.3;

/* ---------- poses ---------- */
const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const jog = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.2, 0, 0],
    head: [-0.1, 0, 0],
    lShoulder: [-0.7 * s - 0.2, 0, 0.12],
    lElbow: [-1.4, 0, 0],
    rShoulder: [0.7 * s - 0.2, 0, -0.12],
    rElbow: [-1.4, 0, 0],
    lHip: [0.8 * s - 0.15, 0, 0.05],
    lKnee: [Math.max(0, -s) * 1.1 + 0.15, 0, 0],
    rHip: [-0.8 * s - 0.15, 0, -0.05],
    rKnee: [Math.max(0, s) * 1.1 + 0.15, 0, 0],
  };
};
const WAITING = { spine: [0.02, 0, 0], head: [0.12, 0.25, 0], lShoulder: [-0.5, 0, 0.2], lElbow: [-1.7, 0.4, 0], rShoulder: [-0.4, 0, -0.25], rElbow: [-1.5, -0.5, 0], rHip: [0.12, 0, -0.04], rKnee: [0.18, 0, 0] };
const OFFER = { spine: [0.05, 0, 0], head: [0.1, -0.1, 0], rShoulder: [-1.25, 0.35, -0.15], rElbow: [-0.35, 0, 0], lShoulder: [0, 0, 0.12] };
const SIT = { spine: [0.08, 0, 0], head: [-0.05, 0, 0], lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKnee: [1.45, 0, 0], rKnee: [1.45, 0, 0], lShoulder: [-0.7, 0, 0.2], lElbow: [-1.1, 0, 0], rShoulder: [-0.7, 0, -0.2], rElbow: [-1.1, 0, 0] };
const LEAN = { spine: [0.42, 0, 0], chest: [0.12, 0, 0], head: [-0.42, 0, 0.1], lShoulder: [-1.05, 0, 0.35], lElbow: [-1.3, 0, 0], rShoulder: [-1.05, 0, -0.35], rElbow: [-1.3, 0, 0] };
const SIT_DESK = (t) => ({ lHip: [-1.45, 0, 0.1], rHip: [-1.45, 0, -0.1], lKnee: [1.25 + Math.sin(t * 2.4) * 0.3, 0, 0], rKnee: [1.25 + Math.sin(t * 2.4 + 1.6) * 0.3, 0, 0], lShoulder: [0.3, 0, 0.35], rShoulder: [0.3, 0, -0.35] });
const TREAD = (p) => {
  const s = Math.sin(p);
  return { spine: [0.1, 0, 0], head: [-0.2, 0, 0], lShoulder: [-0.6 + s * 0.25, 0, 0.95], lElbow: [-0.5, 0, 0], rShoulder: [-0.6 - s * 0.25, 0, -0.95], rElbow: [-0.5, 0, 0], lHip: [-0.4 - s * 0.4, 0, 0.1], rHip: [-0.4 + s * 0.4, 0, -0.1], lKnee: [0.8, 0, 0], rKnee: [0.8, 0, 0] };
};
const FLOAT = { spine: [-0.05, 0, 0], head: [-0.15, 0, 0], lShoulder: [-0.2, 0, 0.85], lElbow: [-0.3, 0, 0], rShoulder: [-0.2, 0, -0.85], rElbow: [-0.3, 0, 0] };
const LEAN_IN = { spine: [0.15, 0, 0], neck: [0.1, 0, 0], head: [0.05, 0, 0], lShoulder: [-0.3, 0, 0.15], rShoulder: [-0.3, 0, -0.15], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] };
const HOLD = { ...LEAN_IN, lShoulder: [-1.2, -0.4, 0.2], lElbow: [-1.0, 0, 0], rShoulder: [-1.2, 0.4, -0.2], rElbow: [-1.0, 0, 0] };
const RECOIL = { spine: [-0.35, 0.2, 0], head: [-0.5, 0.3, 0], lShoulder: [-1.3, 0, 0.3], lElbow: [-1.9, 0, 0], rShoulder: [-0.2, 0, -0.6], rElbow: [-0.6, 0, 0] };
const PIN = { spine: [-0.05, 0, 0], head: [-0.18, 0, 0], lShoulder: [0.1, 0, 0.3], lElbow: [-0.3, 0, 0], rShoulder: [-1.05, 0, -0.45], rElbow: [-2.35, 0.3, 0] };
const YANKED = { ...PIN, rShoulder: [-2.2, 0, -0.9], rElbow: [-0.2, 0, 0] };
const DEVIL = (t) => ({ spine: [-0.08, 0, 0], head: [-0.1 + Math.sin(t * 2) * 0.03, 0, 0], lShoulder: [-0.2, 0, 0.8], lElbow: [-0.5, 0, 0], rShoulder: [-0.2, 0, -0.8], rElbow: [-0.5, 0, 0], lHip: [0, 0, 0.12], rHip: [0, 0, -0.12] });
const THROW = { spine: [0.2, -0.4, 0], head: [0, 0.3, 0], rShoulder: [-1.6, 0, -0.3], rElbow: [-0.1, 0, 0], lShoulder: [0.3, 0, 0.6], lHip: [-0.5, 0, 0.1], lKnee: [0.4, 0, 0], rHip: [0.4, 0, -0.1], rKnee: [0.5, 0, 0] };
// Hand on the grip in the middle of his chest; then out to arm's length.
const CORD = { ...STAND, head: [0.3, 0, 0], rShoulder: [-0.3, 0.9, 0.1], rElbow: [-1.8, 0, 0] };
const YANK = { spine: [-0.05, -0.35, 0], chest: [0, -0.25, 0], head: [-0.15, -0.2, 0], lShoulder: [-0.2, 0, 0.35], rShoulder: [-0.6, -0.7, -0.5], rElbow: [-0.3, 0, 0] };
// The kiss: apart at the chest, heads tilted opposite ways so they meet, not bump.
const KISS_HIM = { spine: [0.12, 0, 0], neck: [0.12, 0, 0], head: [0.22, 0, 0.2], lShoulder: [-0.25, 0, 0.12], rShoulder: [-0.25, 0, -0.12], lElbow: [-0.5, 0, 0], rElbow: [-0.5, 0, 0] };
const KISS_HER = { spine: [-0.04, 0, 0], neck: [-0.1, 0, 0], head: [-0.22, 0, -0.2], lShoulder: [-0.85, -0.35, 0.15], lElbow: [-1.35, 0, 0], rShoulder: [-0.85, 0.35, -0.15], rElbow: [-1.35, 0, 0] };
/* The fight. Reze flies on her own blasts, punches with explosions and throws
   bombs off her fingers; Denji leaps in with the saws, gets blown apart and
   pulls the cord to get up again; it ends with him chaining her to him and
   the two of them going into the sea. */
const CROUCH = { spine: [0.5, 0, 0], head: [-0.3, 0, 0], lShoulder: [0.4, 0, 0.5], rShoulder: [0.4, 0, -0.5], lHip: [-1.4, 0, 0.12], lKnee: [2.0, 0, 0], rHip: [-1.4, 0, -0.12], rKnee: [2.0, 0, 0], lift: -0.4 };
const FLY = { spine: [0.35, 0, 0], head: [-0.4, 0, 0], lShoulder: [0.7, 0, 0.45], lElbow: [-0.2, 0, 0], rShoulder: [0.7, 0, -0.45], rElbow: [-0.2, 0, 0], lHip: [-0.15, 0, 0.05], lKnee: [0.7, 0, 0], rHip: [0.1, 0, -0.05], rKnee: [0.35, 0, 0] };
const PUNCH = { spine: [0.25, -0.55, 0], head: [-0.2, 0.4, 0], rShoulder: [-1.6, 0, -0.1], rElbow: [-0.05, 0, 0], lShoulder: [-0.5, 0, 0.6], lElbow: [-1.9, 0, 0], lHip: [-0.6, 0, 0.1], lKnee: [0.5, 0, 0], rHip: [0.35, 0, -0.1], rKnee: [0.15, 0, 0] };
const DODGE = { spine: [-0.45, 0.3, 0.2], head: [-0.2, 0.3, 0], lShoulder: [-0.4, 0, 1.0], rShoulder: [-0.4, 0, -1.0], lHip: [0.3, 0, 0.15], rHip: [-0.6, 0, -0.1], rKnee: [0.8, 0, 0] };
const LEAP = { spine: [-0.25, 0, 0], head: [-0.2, 0, 0], rShoulder: [-2.9, 0, -0.25], rElbow: [-0.2, 0, 0], lShoulder: [-2.6, 0, 0.35], lElbow: [-0.3, 0, 0], lHip: [-1.3, 0, 0.1], lKnee: [1.7, 0, 0], rHip: [-0.5, 0, -0.1], rKnee: [1.2, 0, 0] };
const SLASH = { spine: [0.6, 0, 0], head: [-0.5, 0, 0], rShoulder: [-0.7, 0, -0.25], rElbow: [-0.1, 0, 0], lShoulder: [0.2, 0, 0.7], lElbow: [-0.4, 0, 0], lHip: [-1.2, 0, 0.1], lKnee: [1.4, 0, 0], rHip: [0.4, 0, -0.1], rKnee: [0.6, 0, 0], lift: -0.3 };
const KNOCKED = { spine: [-0.7, 0, 0], head: [-0.5, 0, 0], lShoulder: [-2.3, 0, 0.7], lElbow: [-0.4, 0, 0], rShoulder: [-2.3, 0, -0.7], rElbow: [-0.4, 0, 0], lHip: [-0.9, 0, 0.1], lKnee: [1.3, 0, 0], rHip: [-0.5, 0, -0.1], rKnee: [0.9, 0, 0] };
const KNEEL = { spine: [0.45, 0, 0], head: [0.35, 0, 0], lShoulder: [-0.2, 0, 0.3], rShoulder: [-0.2, 0, -0.3], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0], lHip: [-1.6, 0, 0.1], lKnee: [1.6, 0, 0], rHip: [-0.15, 0, -0.1], rKnee: [2.2, 0, 0], lift: -0.45 };
const RISE = { spine: [-0.15, 0, 0], head: [-0.35, 0, 0], lShoulder: [-0.4, 0, 1.1], lElbow: [-0.3, 0, 0], rShoulder: [-0.4, 0, -1.1], rElbow: [-0.3, 0, 0] };
const CLINCH = { spine: [0.1, 0, 0], head: [0.15, 0.4, 0], lShoulder: [-1.35, 0, 0.55], lElbow: [-1.4, 0, 0], rShoulder: [-1.35, 0, -0.55], rElbow: [-1.4, 0, 0] };
const STRUGGLE = (t) => ({ spine: [-0.2, Math.sin(t * 7) * 0.2, 0], head: [-0.3, 0.3, 0], lShoulder: [-0.6, 0, 1.2 + Math.sin(t * 9) * 0.2], rShoulder: [-0.6, 0, -1.2], lElbow: [-0.8, 0, 0], rElbow: [-0.8, 0, 0], lHip: [-0.3, 0, 0], lKnee: [0.6, 0, 0] });
const MOVES = {
  city: ["rocket", "fingerBombs", "regrow", "chase", "grab"],
  festival: ["airClash", "bombPunch", "sawLeap", "chains", "plunge", "shore", "daisies"],
};
// The word each move slams in, and on which beat of its bar.
const MOVE_WORD = { rocket: ["boom", 1], bombPunch: ["boom", 1], sawLeap: ["vroom", 2], regrow: ["vroom", 2], airClash: ["boom", 2], fingerBombs: ["boom", 3] };
const LUNGE = { spine: [0.45, 0.2, 0], head: [-0.35, -0.1, 0], rShoulder: [-1.55, 0, -0.25], rElbow: [-0.15, 0, 0], lShoulder: [-0.4, 0, 0.9], lElbow: [-0.8, 0, 0], lHip: [-0.95, 0, 0.08], lKnee: [0.9, 0, 0], rHip: [0.55, 0, -0.08], rKnee: [0.35, 0, 0], lift: -0.12 };

/* The homages. */
// The pool, opening the film: sat on the coping, legs down in the water,
// leaning to look; the left hand in her lap, the right reaching down.
const POOL_SIT = (t) => ({
  spine: [0.5, 0, 0.08],
  chest: [0.14, 0, 0],
  head: [0.22, 0.15, 0],
  lHip: [-1.42, 0, 0.12],
  rHip: [-1.46, 0, -0.1],
  lKnee: [1.45 + Math.sin(t * 1.3) * 0.12, 0, 0],
  rKnee: [1.3 + Math.sin(t * 1.3 + 2) * 0.12, 0, 0],
  lShoulder: [-0.45, 0, 0.2],
  lElbow: [-1.05, 0, 0],
  rShoulder: [-0.95, 0.1, -0.42],
  rElbow: [-0.22, 0, 0],
});
// Pulp Fiction: the twist, barefoot. Knees soft, the arms swinging against it.
const TWIST = (t) => {
  const q = Math.sin(t * 7);
  return { spine: [0.05, -0.25 * q, 0], head: [0.05, 0.2 * q, 0], lShoulder: [-0.35, 0, 0.35], lElbow: [-1.5 - q * 0.2, 0, 0], rShoulder: [-0.35, 0, -0.35], rElbow: [-1.5 + q * 0.2, 0, 0], lHip: [-0.3, 0, 0.08], rHip: [-0.3, 0, -0.08], lKnee: [0.55, 0, 0], rKnee: [0.55, 0, 0] };
};
// Once Upon a Time in Hollywood: the passenger leaning back, bare feet up on the dash.
const FEET_UP = (t) => ({ spine: [-0.32, 0, 0], chest: [-0.05, 0, 0], head: [0.25, 0.35 + Math.sin(t * 0.9) * 0.05, 0], lHip: [-2.15, 0, 0.06], rHip: [-2.05, 0, -0.1], lKnee: [0.55, 0, 0], rKnee: [0.75, 0, 0], lShoulder: [0.08, 0, 0.12], lElbow: [-0.35, 0, 0], rShoulder: [-0.35, 0, -0.55], rElbow: [-1.7, 0, 0] });
const DRIVE = { spine: [-0.12, 0, 0], head: [0.12, 0, 0], lHip: [-1.4, 0, 0.08], rHip: [-1.4, 0, -0.08], lKnee: [1.15, 0, 0], rKnee: [1.05, 0, 0], lShoulder: [-0.75, -0.35, 0.05], lElbow: [-0.95, 0, 0], rShoulder: [-0.75, 0.35, -0.05], rElbow: [-0.95, 0, 0] };
// Constantine: coming down limp in the light, arms a little open, head bowed.
const DESCEND = (t) => ({ spine: [0.04, 0, 0], neck: [0.12, 0, 0], head: [0.22, 0, 0.12], lShoulder: [0.12, 0, 0.5 + Math.sin(t) * 0.04], lElbow: [-0.3, 0, 0], rShoulder: [0.12, 0, -0.5 - Math.sin(t) * 0.04], rElbow: [-0.3, 0, 0], lHip: [0.04, 0, 0.03], lKnee: [0.12, 0, 0], rHip: [0.12, 0, -0.03], rKnee: [0.3, 0, 0] });
// Bande à part: the Madison. A step out and a tap on the beat, a kick every
// fourth; the boys with their hands at their pockets, her snapping.
const MADISON = (p, snap) => {
  const q = Math.sin(p * Math.PI);
  const kick = Math.max(0, Math.sin(((p % 4) - 3) * Math.PI)) * ((p % 4) > 3 ? 1 : 0);
  const out = { spine: [0.04, 0, q * 0.06], head: [0.04, 0, -q * 0.05], lHip: [-0.08 - Math.max(0, q) * 0.3, 0, 0.06 + Math.max(0, q) * 0.12], lKnee: [0.1 + Math.max(0, q) * 0.5, 0, 0], rHip: [-0.08 - Math.max(0, -q) * 0.3 - kick * 0.7, 0, -0.06 - Math.max(0, -q) * 0.12], rKnee: [0.1 + Math.max(0, -q) * 0.5 - kick * 0.1, 0, 0] };
  if (snap) Object.assign(out, { lShoulder: [-0.5 + q * 0.15, 0, 0.45], lElbow: [-1.55, 0, 0], rShoulder: [-0.5 - q * 0.15, 0, -0.45], rElbow: [-1.55, 0, 0] });
  else Object.assign(out, { lShoulder: [0.12, 0, 0.22], lElbow: [-0.55, 0, 0], rShoulder: [0.12, 0, -0.22], rElbow: [-0.55, 0, 0] });
  return out;
};
// The Horse in Motion: astride, forward over the withers, hands on the reins.
const RIDE = (k) => ({ spine: [0.32 + k * 0.06, 0, 0], head: [-0.28, 0, 0], lHip: [-1.2, 0, 0.62], rHip: [-1.2, 0, -0.62], lKnee: [1.55, 0, 0], rKnee: [1.55, 0, 0], lShoulder: [-0.85, 0, 0.18], lElbow: [-0.95, 0, 0], rShoulder: [-0.85, 0, -0.18], rElbow: [-0.95, 0, 0] });
// Léon: the pin held up on one finger between them.
const PIN_UP = { spine: [0.02, 0, 0], head: [0.06, -0.05, 0], rShoulder: [-1.0, 0.3, -0.3], rElbow: [-1.75, 0, 0], lShoulder: [0, 0, 0.1], lElbow: [-0.25, 0, 0] };
const TAKE = { spine: [0.06, 0, 0], head: [0.12, 0, 0], rShoulder: [-0.75, 0.15, -0.1], rElbow: [-0.7, 0, 0] };
// Muybridge's sepia, and a second, a touch brighter, for the projector's flicker.
const SEPIA = { ground: "#2b1d10", lines: "#e6cfa0", accent: "#b07a3e", rim: "#f0dcb0", shade: "#8a6a48" };
const SEPIA_FLICKER = { ...SEPIA, lines: "#f0dcb2", rim: "#f6e6c4" };
const GOLDEN = { ground: "#2a1408", lines: "#ffcf94", accent: "#ff8a3d", rim: "#ffb46b", shade: "#a86e5a" };
const HEAVEN = { ground: "#0c0a14", lines: "#e9dcff", accent: "#fff1d0", rim: "#fff1dc", shade: "#7a6aa8" };
const BLACK_AND_WHITE = { ground: "#1c1c1e", lines: "#e4e4e0", accent: "#9a9a96", rim: "#f0f0ec", shade: "#86868c" };
/** What the rest of the cast wear: Public Safety's white shirt and black tie. */
const SUIT = { collar: true, tie: true, placket: true, belt: true };
const EXTRA = {
  // Makima: white shirt, black tie, dark trousers; barefoot, for Tarantino. Gold eyes.
  makima: { skin: "#f4dccd", top: "#f1efe9", bottom: "#24252c", shoes: "#f0d4c4", hair: "#c65a50", sleeves: "long", tie: "#15161b", belt: "#2a2220", iris: "#d9a83a", pupil: "#7a4b14", brows: "#a9473f" },
  aki: { skin: "#e6bc9c", top: "#eef1f4", bottom: "#1c1f26", shoes: "#16161a", hair: "#141418", sleeves: "long", tie: "#15161b", belt: "#241a14", iris: "#33435c", pupil: "#0e1218" },
  power: { skin: "#f2cdb6", top: "#eef0ea", bottom: "#1f2430", shoes: "#3a2a20", hair: "#f0a29a", sleeves: "long", tie: "#15161b", belt: "#2a1f18", iris: "#e8b52a", pupil: "#b0182a" },
  angel: { skin: "#f6e9e0", top: "#f1efe9", bottom: "#23252c", shoes: "#16161a", hair: "#e0cfa6", sleeves: "long", tie: "#15161b", belt: "#2a2220", iris: "#7b6a5a", pupil: "#1a1410" },
};
const CAR_X = 480;
const TRACK_X = 540;
const OCEAN_X = 640;

/* ---------- pages ---------- */
// A panel is [x0, y0, x1, y1] in frame fractions from the top left, the shot it
// shows, and the beat (from the page's start) on which it slams in.
const FULL = [0, 0, 1, 1];
const full = (shot) => [{ r: FULL, shot }];
const three = (a, b, c) => [
  { r: [0, 0, 0.36, 1], shot: a },
  { r: [0.36, 0, 0.68, 1], shot: b, beat: 4 },
  { r: [0.68, 0, 1, 1], shot: c, beat: 8 },
];
const two = (a, b) => [{ r: [0, 0, 1, 0.55], shot: a }, { r: [0, 0.55, 1, 1], shot: b, beat: 4 }];
const four = (a, b, c, d, step = 1) => [
  { r: [0, 0, 0.55, 0.5], shot: a },
  { r: [0.55, 0, 1, 0.5], shot: b, beat: step },
  { r: [0, 0.5, 0.45, 1], shot: c, beat: step * 2 },
  { r: [0.45, 0.5, 1, 1], shot: d, beat: step * 3 },
];
// Muybridge's strip: six frames of one stride, three across, two down.
const six = (shot) => Array.from({ length: 6 }, (_, i) => ({ r: [(i % 3) / 3, Math.floor(i / 3) / 2, ((i % 3) + 1) / 3, (Math.floor(i / 3) + 1) / 2], shot: `${shot}:${i}` }));
const bar = (n) => n * BAR;

const FRANTIC = ["eye", "faces", "pin", "daisy", "smile", "bite", "faces", "pin", "eye", "swim", "smile", "pin", "faces", "eye", "pin", "bite"];
// The crossfire: callbacks, but none of them a shot already seen as it was:
// a fight move on the other set, the opening's hand in the water, the turn again.
const FINALE = [
  ["move:city:bombPunch", "faces", "move:city:airClash", "bomb"],
  ["waterHand", "cord", "typhoon", "bombReveal"],
  ["move:festival:chase", "daisy", "move:festival:chains", "smile:festival"],
];
// Her two faces, cut against each other: a different place and angle every bar.
const SMILES = ["festival", "booth", "cafe", "pool"];
const BOMB_FACES = ["low", "profile", "close", "fire"];

const PAGES = [
  // Intro (0:00 – 0:17): fate, intersecting.
  { t: bar(0), panels: full("waterHand"), iris: "open" },
  { t: bar(2), panels: full("denjiWalk") },
  { t: bar(4), panels: full("rezeWalk") },
  { t: bar(6), panels: three("rain", "booth", "daisy") },
  { t: bar(8), panels: full("eye"), makima: true },
  { t: bar(8.5), panels: full("boothTwo"), words: [{ id: "title", at: 0, until: bar(1.5), x: 50, y: 74, size: 16 }] },
  // Verse one (0:18 – 0:48): head over heels.
  { t: bar(10), panels: full("cafeSmile") },
  { t: bar(14), panels: full("cafeSchool") },
  { t: bar(16), panels: two("swim", "float") },
  { t: bar(20), panels: full("faces") },
  { t: bar(24), panels: four("walk", "vase", "swim:low", "faces:close", 2) },
  // Pre-chorus and chorus (0:49 – 1:15): the drop, the BOOM, the closing ring.
  { t: bar(27), panels: full("frantic"), frantic: true },
  { t: bar(31), panels: [], drop: true },
  { t: bar(31.5), panels: full("bombReveal"), words: [{ id: "boom", at: BEAT * 2, until: bar(2.5), x: 50, y: 30, size: 16 }] },
  { t: bar(34), panels: full("bomb"), ring: true },
  {
    t: bar(38),
    panels: four("bite", "pin", "bomb", "cord", 4),
    words: [
      { id: "crunch", at: 0, until: bar(4), x: 27, y: 18, size: 8 },
      { id: "boom", at: bar(2), until: bar(4), x: 22, y: 70, size: 8 },
      { id: "vroom", at: bar(3), until: bar(4), x: 72, y: 70, size: 8 },
    ],
  },
  // Verse two (1:15 – 1:27): the homages, each opened and shut on an iris.
  { t: bar(42), panels: full("feet"), reel: { in: true, at: [50, 64] } },
  { t: bar(43), panels: full("car"), reel: { out: true, at: [58, 42] } },
  { t: bar(44.25), panels: full("angel"), reel: { in: true, out: true, at: [50, 40] } },
  { t: bar(45.5), panels: full("madison"), reel: { in: true, out: true, at: [50, 52] } },
  { t: bar(46.75), panels: six("horse"), reel: { in: true, out: true, at: [50, 50] } },
  { t: bar(48), panels: full("leon"), reel: { in: true, out: true, at: [52, 42] } },
  // Bridge (1:27 – 1:55): chaos, the city at war.
  { t: bar(49), panels: full("fight:city"), fight: "city" },
  { t: bar(54), panels: full("typhoon") },
  { t: bar(58), panels: full("fight:festival"), fight: "festival" },
  // Last chorus (1:56 – 2:31): the crossfire, her two faces, the blackout.
  ...Array.from({ length: 8 }, (_, i) => ({ t: bar(65 + i), panels: full(i % 2 ? `bombFace:${BOMB_FACES[(i - 1) / 2]}` : `smile:${SMILES[i / 2]}`), pulse: true })),
  ...FINALE.map((shots, i) => ({ t: bar(73 + i * 2), panels: four(...shots, 2), pulse: true })),
  { t: bar(79), panels: full("end"), iris: "close", words: [{ id: "title", at: CYCLE - bar(79) - 4.6, until: CYCLE - bar(79) - 1, x: 50, y: 74, size: 12 }] },
];

export const createIrisOutScene = (stage, { overlay } = {}) => {
  const { camera, renderer, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe", "school", "pool", "festival", "church", "warehouse"]);
  const cast = createCast(w, { chainsaw: true, bomb: true, daisy: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const water = lot.sets.pool.water.material.uniforms;

  const title = createSfx(overlay, { text: "IRIS\u00a0OUT", crescendo: 0.2 });
  const crunch = createSfx(overlay, { text: "CRNCH!", crescendo: 0.4 });
  const boom = createSfx(overlay, { text: "BOOM!!", crescendo: 0.8 });
  const vroom = createSfx(overlay, { text: "VRRRN!!", crescendo: 0.8 });
  const words = [title, crunch, boom, vroom];

  /* ── The homages: the rest of the cast, a car, a horse, a beam of light ── */
  const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const UP = v3(0, 1, 0);
  const pinTo = (bone, ...meshes) =>
    meshes.forEach((m) => {
      w.scene.add(m);
      bone.attach(m);
    });
  const lined = (mesh) => {
    outline(mesh, w.line);
    return mesh;
  };
  /** A cone from `base` along `dir` (a clump of hair, a horn), flattened by `flat`. */
  const spike = (mat, base, dir, length, radius, flat = 1) => {
    const geo = new THREE.ConeGeometry(radius, length, 6);
    geo.translate(0, length / 2, 0);
    geo.scale(1, 1, flat);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(base);
    m.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
    return lined(m);
  };
  const capOf = (fig) => {
    let cap = null;
    fig.model.traverse((o) => o.isMesh && /^hair/i.test(o.name) && (cap = o));
    return cap ? new THREE.Box3().setFromObject(cap, true) : null;
  };
  /** The body's skinned vertices in world space (the figure at rest at the origin). */
  const bodyPoints = (fig) => {
    let body = null;
    fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
    const out = [];
    const n = body.geometry.attributes.position.count;
    for (let i = 0; i < n; i++) out.push(body.getVertexPosition(i, v3()).applyMatrix4(body.matrixWorld));
    return out;
  };
  const backAt = (pts, y, band = 0.03) => pts.reduce((z, p) => (Math.abs(p.y - y) < band && Math.abs(p.x) < 0.06 ? Math.min(z, p.z) : z), Infinity);
  const box = (w2, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w2, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const glow = (color) => new THREE.MeshBasicMaterial({ color });

  const extra = { ready: false };
  const makeFig = (opts) => createModelFigure({ line: w.line, ink: { tone: 0.8, rim: 1.4 }, dress: SUIT, ...opts });
  const extrasReady = Promise.all([
    makeFig({ body: "SuperheroFemale", height: 1.7, hair: ["HairLong", "EyebrowsFemale"], outfit: EXTRA.makima }),
    makeFig({ height: 1.8, hair: ["HairSimpleParted", "EyebrowsRegular"], outfit: EXTRA.aki }),
    makeFig({ body: "SuperheroFemale", height: 1.66, hair: ["HairLong", "EyebrowsFemale"], outfit: EXTRA.power }),
    makeFig({ height: 1.76, hair: ["HairLong", "EyebrowsRegular"], outfit: EXTRA.angel }),
  ]).then(([makima, aki, power, angel]) => {
    [makima, aki, power, angel].forEach((f) => {
      w.scene.add(f.root);
      f.apply({});
      f.root.updateMatrixWorld(true);
    });
    const headAt = (f) => f.bones.head.getWorldPosition(v3());

    // Makima: her long hair, and the one long braid down her back.
    {
      const hair = w.ink({ tint: EXTRA.makima.hair, tone: 0.85, rim: 1.2 });
      const cap = capOf(makima);
      const pts = bodyPoints(makima);
      const back = backAt(pts, 1.7 * 0.72);
      const gather = v3(0, cap.max.y - 0.075, cap.min.z + 0.012);
      const curve = new THREE.CatmullRomCurve3([gather, gather.clone().add(v3(0, -0.07, -0.03)), v3(0, 1.7 * 0.8, back - 0.035), v3(0.005, 1.7 * 0.7, back - 0.03), v3(0.012, 1.7 * 0.6, back - 0.03)]);
      const geos = [];
      const q = new THREE.Quaternion();
      const M = 24;
      for (let i = 0; i < M; i++) {
        const t = (i + 0.5) / M;
        const at = curve.getPointAt(t);
        const bead = new THREE.SphereGeometry(0.021 - 0.008 * t, 8, 6);
        bead.scale(1, 1.55, 0.8);
        bead.rotateZ(i % 2 ? 0.45 : -0.45); // the plait's alternating lean
        bead.applyQuaternion(q.setFromUnitVectors(UP, curve.getTangentAt(t)));
        bead.translate(at.x, at.y, at.z);
        geos.push(bead);
      }
      const tail = new THREE.ConeGeometry(0.014, 0.07, 6);
      tail.rotateX(Math.PI);
      tail.translate(0.012, 1.7 * 0.6 - 0.04, back - 0.03);
      geos.push(tail);
      const braid = lined(new THREE.Mesh(mergeGeometries(geos), hair));
      braid.frustumCulled = false;
      pinTo(makima.bones.neck, braid);

      // Bare feet: toes on the front of each foot, so the close-up reads as feet.
      const skin = w.ink({ tint: EXTRA.makima.shoes, tone: 0.82, rim: 1.2 });
      for (const sd of [-1, 1]) {
        const foot = pts.filter((p) => p.y < 0.06 * 1.7 && Math.sign(p.x) === sd);
        const tipZ = foot.reduce((z, p) => Math.max(z, p.z), -Infinity);
        const near = foot.filter((p) => p.z > tipZ - 0.04);
        const xs = near.map((p) => p.x);
        const inner = sd > 0 ? Math.min(...xs) : Math.max(...xs);
        const outer = sd > 0 ? Math.max(...xs) : Math.min(...xs);
        const toes = [];
        for (let k = 0; k < 5; k++) {
          const t = k / 4;
          const r = k === 0 ? 0.012 : 0.0095 - k * 0.0007;
          const g = new THREE.SphereGeometry(r, 10, 8);
          g.scale(1, 0.75, 1.2);
          g.translate(lerp(inner + sd * 0.011, outer - sd * 0.008, t), r * 0.8, tipZ - 0.004 - k * 0.0055 - r * 0.4);
          toes.push(g);
        }
        const mesh = lined(new THREE.Mesh(mergeGeometries(toes), skin));
        const ball = makima.model.getObjectByName(sd > 0 ? "ball_l" : "ball_r") ?? makima.model.getObjectByName(sd > 0 ? "foot_l" : "foot_r");
        if (ball) pinTo(ball, mesh);
      }
    }

    // Aki: black hair tied up in his topknot.
    {
      const black = w.ink({ tint: "#141418", tone: 0.8, rim: 1.3 });
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), black);
      bun.scale.set(1, 0.85, 1.15);
      bun.position.copy(headAt(aki)).add(v3(0, 0.232, -0.07));
      lined(bun);
      const tuft = spike(black, bun.position.clone().add(v3(0, 0.02, -0.01)), v3(0, 0.75, -0.65), 0.075, 0.03);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.018, 12), w.flat);
      band.position.copy(bun.position).add(v3(0, 0.03, -0.02));
      band.rotation.x = -0.7;
      pinTo(aki.bones.head, bun, tuft, band);
    }

    // Power: her two red horns.
    {
      const red = w.ink({ tint: "#cf2330", tone: 0.9, rim: 1.0 });
      const horns = [-1, 1].map((sd) => spike(red, headAt(power).add(v3(sd * 0.05, 0.19, 0.04)), v3(sd * 0.35, 0.9, 0.22), 0.085, 0.017));
      pinTo(power.bones.head, ...horns);
    }

    // The Angel Devil: a thin halo over his head, and his white wings.
    {
      const cap = capOf(angel);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 40), glow("#e9cf86"));
      halo.rotation.x = Math.PI / 2 - 0.2;
      halo.position.set(headAt(angel).x, cap.max.y + 0.07, headAt(angel).z - 0.02);
      pinTo(angel.bones.head, halo);
      const chestBone = angel.bones.chest ?? angel.bones.spine;
      const chestAt = chestBone.getWorldPosition(v3());
      const back = backAt(bodyPoints(angel), chestAt.y + 0.05, 0.04);
      const feather = w.ink({ tint: "#f1eee6", tone: 0.95, rim: 0.7 });
      extra.wings = [-1, 1].map((sd) => {
        const pivot = new THREE.Object3D();
        pivot.position.set(sd * 0.07, chestAt.y + 0.06, back + 0.01);
        const geos = [];
        const N = 11;
        for (let j = 0; j < N; j++) {
          const t = j / (N - 1);
          // Along the leading edge: out and up to the wrist, then out and down to the tip.
          const edge = v3(sd * (0.04 + 0.66 * t), 0.06 + 0.34 * Math.sin(Math.PI * Math.min(1, t * 1.2)) - 0.12 * t, -0.05 - 0.06 * t);
          const len = 0.3 + 0.52 * t;
          const g = new THREE.SphereGeometry(1, 8, 6);
          g.scale(0.045 + 0.012 * t, len / 2, 0.01);
          g.translate(0, -len / 2, 0);
          g.rotateZ(sd * (0.12 + 0.6 * t));
          g.translate(edge.x, edge.y, edge.z);
          geos.push(g);
          const c = new THREE.SphereGeometry(1, 8, 6);
          c.scale(0.05, 0.12, 0.012);
          c.translate(0, -0.08, 0);
          c.rotateZ(sd * (0.1 + 0.35 * t));
          c.translate(edge.x, edge.y, edge.z + 0.012);
          geos.push(c);
        }
        const mesh = lined(new THREE.Mesh(mergeGeometries(geos), feather));
        mesh.frustumCulled = false;
        pivot.add(mesh);
        w.scene.add(pivot);
        chestBone.attach(pivot);
        return { pivot, q0: pivot.quaternion.clone(), sd };
      });
    }

    [makima, aki, power, angel].forEach((f) => {
      w.register(f.root);
      f.root.position.set(0, -50, 0);
    });
    Object.assign(extra, { makima, aki, power, angel, ready: true });
    w.sync();
  });
  const wingQ = new THREE.Quaternion();
  const wingE = new THREE.Euler();
  /** Wings `open` 0 (folded back) … 1 (spread), the tips lifted by `lift`. */
  const spreadWings = (open, lift) =>
    extra.wings?.forEach(({ pivot, q0, sd }) => pivot.quaternion.copy(q0).multiply(wingQ.setFromEuler(wingE.set(0, sd * (1 - open) * 1.1, sd * lift))));

  // The car: a long cream convertible-era sedan, seen through its windshield.
  const car = new THREE.Group();
  car.position.set(CAR_X, 0, 0);
  w.scene.add(car);
  const carParts = {};
  {
    const paint = w.ink({ tint: "#e9dab4", tone: 0.85, rim: 0.8 });
    const chrome = w.ink({ tint: "#d8d8d2", tone: 1.15, rim: 0.5 });
    const dark = w.ink({ tint: "#2a2422", tone: 0.5, rim: 0.6 });
    const leather = w.ink({ tint: "#8a2a22", tone: 0.7, rim: 0.6 });
    const DASH = 0.92;
    carParts.DASH = DASH;
    // An open tub, not a solid block: floor, doors, firewall, hood and trunk,
    // so the cabin (and the two in it) shows over the sills.
    const lines = (m) => (lined(m), m);
    box(1.8, 0.06, 3.9, dark, 0, 0.3, 0.25, car); // floor
    for (const sd of [-1, 1]) {
      lines(box(0.07, 0.6, 3.9, paint, sd * 0.89, 0.62, 0.25, car)); // the doors and quarters
      box(0.09, 0.04, 3.9, chrome, sd * 0.89, 0.94, 0.25, car); // the chrome along the sill
      // Wheels, under arches cut by the dark of the tyre.
      for (const z of [1.55, -1.05]) {
        const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), dark);
        tyre.rotation.z = Math.PI / 2;
        tyre.position.set(sd * 0.86, 0.33, z);
        car.add(lined(tyre));
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 16), chrome);
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(tyre.position);
        car.add(hub);
      }
      // The rear pillars, holding up the back of the roof.
      lines(box(0.06, 0.66, 0.1, paint, sd * 0.85, DASH + 0.33, -0.78, car)).rotation.x = 0.25;
      // A wing mirror on its stalk.
      box(0.12, 0.08, 0.04, chrome, sd * 0.98, DASH + 0.12, 0.82, car);
    }
    box(1.72, 0.5, 0.06, dark, 0, 0.58, 1.05, car); // firewall, under the dash
    lines(box(1.7, 0.2, 0.24, dark, 0, DASH - 0.1, 0.95, car)); // dashboard
    lines(box(1.84, 0.12, 1.25, paint, 0, DASH - 0.1, 1.66, car)).rotation.x = 0.06; // hood
    lines(box(1.84, 0.5, 0.1, paint, 0, 0.6, 2.24, car)); // the nose, under the hood
    box(1.72, 0.06, 0.05, chrome, 0, 0.66, 2.3, car); // grille bar
    lines(box(1.84, 0.12, 0.95, paint, 0, 0.88, -1.2, car)); // trunk lid
    lines(box(1.84, 0.55, 0.08, paint, 0, 0.62, -1.68, car)); // the tail
    box(1.9, 0.14, 0.12, chrome, 0, 0.42, 2.26, car); // bumper
    box(1.9, 0.12, 0.12, chrome, 0, 0.42, -1.74, car); // rear bumper
    for (const sd of [-1, 1]) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 18), glow("#f3e2b4"));
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(sd * 0.68, 0.72, 2.21);
      car.add(lamp);
      // The A-pillars, raked back to the roof.
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), paint);
      pillar.position.set(sd * 0.84, DASH + 0.35, 0.86);
      pillar.rotation.x = -0.55;
      lined(pillar);
      car.add(pillar);
    }
    box(1.74, 0.06, 1.5, paint, 0, DASH + 0.68, -0.06, car); // roof
    box(1.7, 0.06, 0.06, paint, 0, DASH + 0.67, 0.67, car); // header over the glass
    // A faint sheen across the glass, no more.
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.8), new THREE.MeshBasicMaterial({ color: "#ffe9c4", transparent: true, opacity: 0.06, depthWrite: false }));
    glass.position.set(0, DASH + 0.35, 0.84);
    glass.rotation.x = -0.55;
    car.add(glass);
    // The bench seat and its back; the steering wheel on the right (Japan).
    box(1.6, 0.14, 0.55, leather, 0, 0.5, 0.2, car);
    box(1.6, 0.6, 0.12, leather, 0, 0.85, -0.14, car).rotation.x = -0.15;
    carParts.SEAT = 0.57;
    carParts.wheel = lined(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.016, 8, 32), dark));
    carParts.column = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 8), dark);
    car.add(carParts.wheel, carParts.column);
    // The road out behind them, its dashes and lamps running away.
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 90), w.ink({ tint: "#3a3532", tone: 0.5, rim: 0.2 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.001, -40);
    car.add(road);
    const verge = new THREE.Mesh(new THREE.PlaneGeometry(60, 90), w.ink({ tint: "#6d5a3a", tone: 0.5, rim: 0.2 }));
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(0, -0.002, -40);
    car.add(verge);
    carParts.runners = [];
    const lampMat = glow("#ffd9a0");
    const post = w.ink({ tint: "#2c2724", tone: 0.5, rim: 0.8 });
    const frond = w.ink({ tint: "#2f3a22", tone: 0.5, rim: 0.8 });
    for (let i = 0; i < 12; i++) {
      const dash = box(0.12, 0.01, 1.2, w.ink({ tint: "#efe4c4", tone: 0.9, rim: 0.2 }), 0, 0.01, 0, car);
      carParts.runners.push({ obj: dash, gap: 6, offset: i * 6 });
    }
    for (let i = 0; i < 8; i++) {
      const sd = i % 2 ? 1 : -1;
      const g = new THREE.Group();
      if (i % 4 < 2) {
        // A street lamp.
        box(0.08, 4.4, 0.08, post, 0, 2.2, 0, g);
        box(0.9, 0.06, 0.06, post, -sd * 0.45, 4.38, 0, g);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), lampMat);
        bulb.position.set(-sd * 0.88, 4.28, 0);
        g.add(bulb);
      } else {
        // A palm: a tall thin trunk and a burst of fronds.
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 7, 8), post);
        trunk.position.y = 3.5;
        g.add(trunk);
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          g.add(spike(frond, v3(0, 7, 0), v3(Math.cos(a), -0.35, Math.sin(a)), 1.6, 0.16, 0.25));
        }
      }
      g.position.x = sd * 4.6;
      car.add(g);
      carParts.runners.push({ obj: g, gap: 48, offset: i * 6 + (i % 2) * 3 });
    }
    // Far-off hills, gold in the last light.
    for (let i = 0; i < 5; i++) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: "#7a5a3c", tone: 0.5, rim: 0.6 }));
      hill.scale.set(14 + i * 3, 4 + (i % 3) * 2, 6);
      hill.position.set(-30 + i * 15, 0, -70 - (i % 2) * 8);
      car.add(hill);
    }
  }

  // The horse: a bay at the gallop, built in parts, facing +x. A deep barrel
  // between a heavy chest and a round rump, a long neck carried forward, a
  // wedge of a head, and legs that taper from muscle to bone to hoof.
  const track = new THREE.Group();
  track.position.set(TRACK_X, 0, 0);
  w.scene.add(track);
  const horse = new THREE.Group();
  track.add(horse);
  const legs = [];
  const horseParts = {};
  {
    const coat = w.ink({ tint: "#5a3822", tone: 0.82, rim: 1.0 });
    const mane = w.ink({ tint: "#1d140e", tone: 0.6, rim: 0.8 });
    const tack = w.ink({ tint: "#2a1a10", tone: 0.6, rim: 0.6 });
    const ell = (rx, ry, rz, mat, x, y, z, parent) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat);
      m.scale.set(rx, ry, rz);
      m.position.set(x, y, z);
      parent?.add(m);
      return lined(m);
    };
    /** A tapered limb segment hanging from its joint, `len` down, `r0` at the top, `r1` at the bottom. */
    const limb = (r0, r1, len, mat, parent, depth = 1) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 10), mat);
      m.geometry.translate(0, -len / 2, 0);
      m.scale.set(depth, 1, 1);
      parent.add(lined(m));
      return m;
    };
    const body = new THREE.Group();
    body.position.y = 1.1;
    horse.add(body);
    ell(0.6, 0.28, 0.25, coat, 0, 0, 0, body); // barrel
    ell(0.3, 0.31, 0.24, coat, 0.44, 0.03, 0, body); // chest
    ell(0.26, 0.14, 0.14, coat, 0.32, 0.2, 0, body); // withers
    ell(0.34, 0.31, 0.27, coat, -0.45, 0.06, 0, body); // rump
    // The neck: deep at the chest, thin at the throat, carried forward and up.
    const neck = new THREE.Group();
    neck.position.set(0.55, 0.16, 0);
    horseParts.neckZ = -0.8;
    neck.rotation.z = horseParts.neckZ;
    body.add(neck);
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.72, 14), coat);
    neckMesh.geometry.translate(0, 0.33, 0);
    neckMesh.scale.set(1.3, 1, 0.55);
    neck.add(lined(neckMesh));
    // The mane: flat locks along the crest, blowing back.
    horseParts.mane = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const lock = spike(mane, v3(-0.09 - 0.06 * (1 - t), 0.06 + t * 0.62, 0), v3(-0.8, 0.45, 0), 0.16 - t * 0.05, 0.04, 0.35);
      neck.add(lock);
      horseParts.mane.push({ lock, q0: lock.quaternion.clone(), t });
    }
    // The head: a long wedge, broad at the jaw, narrow at the muzzle.
    const head = new THREE.Group();
    head.position.y = 0.68;
    head.rotation.z = -1.25; // forward and down off the top of the neck
    neck.add(head);
    ell(0.1, 0.11, 0.085, coat, 0.0, 0.06, 0, head); // jaw and cheek
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.085, 0.42, 12), coat);
    face.geometry.translate(0, 0.26, 0);
    face.scale.set(1.15, 1, 0.82);
    head.add(lined(face));
    ell(0.06, 0.05, 0.055, coat, 0.01, 0.47, 0, head); // muzzle
    for (const sd of [-1, 1]) {
      head.add(spike(coat, v3(-0.07, -0.02, sd * 0.045), v3(-1, 0.25, sd * 0.25), 0.11, 0.028, 0.6)); // ears, pricked
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), mane);
      nostril.position.set(0.035, 0.5, sd * 0.035);
      head.add(nostril);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mane);
      eye.position.set(0.03, 0.08, sd * 0.07);
      head.add(eye);
    }
    head.add(spike(mane, v3(-0.05, 0.02, 0), v3(0.6, 1, 0), 0.12, 0.035, 0.4)); // forelock
    box(0.012, 0.012, 0.15, tack, 0.04, 0.42, 0, head); // the bit
    horseParts.mouth = new THREE.Object3D();
    horseParts.mouth.position.set(0.04, 0.42, 0);
    head.add(horseParts.mouth);
    // The tail: a fall of long locks from the dock, streaming behind.
    const tail = new THREE.Group();
    tail.position.set(-0.76, 0.18, 0);
    body.add(tail);
    for (let i = 0; i < 5; i++) {
      const lock = spike(mane, v3(0, 0, (i - 2) * 0.018), v3(-0.6 - i * 0.08, -1, (i - 2) * 0.06), 0.62 - Math.abs(i - 2) * 0.06, 0.05, 0.5);
      tail.add(lock);
    }
    horseParts.tail = tail;
    // The saddle, its girth, and the seat.
    ell(0.22, 0.05, 0.27, tack, 0.06, 0.28, 0, body);
    box(0.05, 0.5, 0.52, tack, 0.14, 0.02, 0, body);
    horseParts.seat = new THREE.Object3D();
    horseParts.seat.position.set(0.04, 0.31, 0);
    body.add(horseParts.seat);
    horseParts.body = body;
    horseParts.neck = neck;
    // Legs: [x, z, front, gait offset]. A muscled upper leg (forearm or
    // gaskin), the knee or hock, the slim cannon, the fetlock, the hoof.
    for (const [x, z, front, off] of [[0.48, 0.12, 1, 2.4], [0.48, -0.12, 1, 3.0], [-0.5, 0.13, 0, 0], [-0.5, -0.13, 0, 0.6]]) {
      const hip = new THREE.Group();
      hip.position.set(x, -0.12, z);
      body.add(hip);
      limb(front ? 0.085 : 0.115, front ? 0.05 : 0.055, 0.44, coat, hip, front ? 1 : 1.2);
      const knee = new THREE.Group();
      knee.position.y = -0.44;
      hip.add(knee);
      ell(0.045, 0.045, 0.045, coat, 0, 0, 0, knee);
      limb(0.036, 0.03, 0.34, coat, knee);
      const fetlock = new THREE.Group();
      fetlock.position.y = -0.34;
      knee.add(fetlock);
      ell(0.042, 0.04, 0.04, coat, 0, 0, 0, fetlock);
      limb(0.03, 0.04, 0.09, coat, fetlock);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.058, 0.07, 10), mane);
      hoof.position.y = -0.12;
      fetlock.add(lined(hoof));
      legs.push({ hip, knee, fetlock, front, off });
    }
    // Muybridge's backdrop: a dark wall ruled with numbered white lines, and the track.
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), w.ink({ tint: "#5a4430", tone: 0.55, rim: 0.2 }));
    wall.position.set(0, 2, -1.3);
    track.add(wall);
    horseParts.rules = new THREE.Group();
    horseParts.rules.position.z = -1.28;
    track.add(horseParts.rules);
    const rule = w.ink({ tint: "#efe0bc", tone: 1.0, rim: 0.2 });
    for (let i = -30; i <= 30; i++) box(0.025, 2.6, 0.01, rule, i * 0.53, 1.6, 0, horseParts.rules);
    box(40, 0.03, 0.01, rule, 0, 0.3, 0.005, track);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), w.ink({ tint: "#cdb68c", tone: 0.8, rim: 0.2 }));
    ground.rotation.x = -Math.PI / 2;
    track.add(ground);
    horseParts.rein = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 5), tack);
    horseParts.rein.geometry.translate(0, 0.5, 0);
    track.add(horseParts.rein);
  }

  // The beam the Angel Devil comes down, and a few feathers falling with him.
  const heaven = new THREE.Group();
  heaven.position.copy(lot.sets.church.origin);
  w.scene.add(heaven);
  const beam = lightBeam({ from: [0, 7.5, -2], to: [0, 0, -2], radiusFrom: 0.35, radiusTo: 1.1, color: "#fff1d0" });
  beam.material.uniforms.uIntensity.value = 0.28;
  heaven.add(beam);
  const featherMat = w.ink({ tint: "#f1eee6", tone: 0.95, rim: 0.6 });
  const feathers = Array.from({ length: 8 }, (_, i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), featherMat);
    f.scale.set(0.022, 0.06, 0.005);
    heaven.add(f);
    return { f, x: Math.sin(i * 2.4) * 0.9, z: -2 + Math.cos(i * 1.7) * 0.7, rate: 0.35 + (i % 3) * 0.1, phase: i * 0.37 };
  });

  // ── The ending: the sea. Open water to a far horizon, a beach shelving up
  // out of it, the surf running in and out over the sand. ──
  const ocean = new THREE.Group();
  ocean.position.set(OCEAN_X, 0, 0);
  w.scene.add(ocean);
  const oceanParts = {};
  {
    // The pool's water, re-tinted for open sea at night: its own uniforms.
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), lot.sets.pool.water.material.clone());
    sea.material.uniforms.uDeep.value.set("#061a33");
    sea.material.uniforms.uShallow.value.set("#1d5f86");
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0, -43);
    ocean.add(sea);
    oceanParts.water = sea.material.uniforms;
    const sandMat = w.ink({ tint: "#d9c39a", tone: 0.85, rim: 0.3 });
    const flat = new THREE.Mesh(new THREE.PlaneGeometry(90, 20), sandMat);
    flat.rotation.x = -Math.PI / 2;
    flat.position.set(0, 0.02, 10.6);
    ocean.add(flat);
    // The wet slope down into the water: the waterline runs just past z = 0.3.
    const slope = new THREE.Mesh(new THREE.PlaneGeometry(90, 2.62), w.ink({ tint: "#a8906a", tone: 0.75, rim: 0.3 }));
    slope.rotation.x = -Math.PI / 2 - Math.atan2(0.22, 2.6);
    slope.position.set(0, -0.09, -0.7);
    ocean.add(slope);
    // The surf: a white edge riding in over the slope (the sand hides what is past it).
    oceanParts.foam = new THREE.Mesh(new THREE.PlaneGeometry(90, 0.22), new THREE.MeshBasicMaterial({ color: "#f4f1ea", transparent: true, opacity: 0.85 }));
    oceanParts.foam.rotation.x = -Math.PI / 2;
    ocean.add(oceanParts.foam);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 14), glow("#fff1dc"));
    moon.position.set(-14, 16, -80);
    ocean.add(moon);
  }

  // His chain: links coiled up round the two of them, laid out once in a helix
  // round the origin; `count` lets it wind on.
  const CHAIN_LINKS = 150;
  const chain = new THREE.InstancedMesh(new THREE.TorusGeometry(0.034, 0.009, 6, 12), w.ink({ tint: "#c9c9c4", tone: 1.15, rim: 0.6 }), CHAIN_LINKS);
  {
    const d = new THREE.Object3D();
    const p = v3();
    const next = v3();
    const helix = (u, out) => {
      const a = u * Math.PI * 2 * 5.5;
      return out.set(Math.cos(a) * 0.38, 0.55 + u * 1.0, Math.sin(a) * 0.3);
    };
    for (let i = 0; i < CHAIN_LINKS; i++) {
      helix(i / CHAIN_LINKS, p);
      helix((i + 1) / CHAIN_LINKS, next);
      d.position.copy(p);
      d.quaternion.setFromUnitVectors(v3(1, 0, 0), next.sub(p).normalize());
      // Every other link turned a quarter on the run, so it reads as chain.
      if (i % 2) d.rotateX(Math.PI / 2);
      d.updateMatrix();
      chain.setMatrixAt(i, d.matrix);
    }
    chain.frustumCulled = false;
    w.scene.add(chain);
  }

  // The last two: a white daisy and a red one, falling to the sea.
  const redDaisy = buildDaisy(w, { petals: "#d0182e" });
  w.scene.add(redDaisy);

  // Léon: the pin and its ring, worn on Makima's finger.
  const grenadePin = new THREE.Group();
  {
    const steel = w.ink({ tint: "#d9d9d2", tone: 1.2, rim: 0.5 });
    const ring = lined(new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0024, 8, 24), steel));
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.045, 6), steel);
    wire.position.set(0, -0.034, 0.004);
    const bend = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0016, 6, 12, Math.PI), steel);
    bend.position.set(0.006, -0.012, 0);
    grenadePin.add(ring, wire, bend);
    w.scene.add(grenadePin);
  }


  // ── The Typhoon Devil: a funnel of rings over the city ──
  const typhoon = new THREE.Group();
  typhoon.position.copy(lot.sets.street.origin).add(new THREE.Vector3(2, 0, -26));
  w.scene.add(typhoon);
  const swirl = w.ink({ tint: "#5b6478", tone: 0.7, rim: 1.2 });
  const rings = Array.from({ length: 16 }, (_, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1 + i * 0.75, 0.25 + i * 0.05, 6, 28), swirl);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = i * 1.4;
    typhoon.add(ring);
    return ring;
  });

  // ── Makima's eyes: ringed, gold, watching; mice in the light below ──
  // Lit, not lost in the dark: a red field, the whites and gold rings bright
  // in it, and the mice black against a pool of light on the floor under them.
  const ringsSvg = (cx) =>
    [27, 21, 15.5, 10.5, 6].map((r, i) => `<circle cx="${cx}" cy="47" r="${r}" fill="${i % 2 ? "#ffd35e" : "#d39a2c"}" stroke="#3a2412" stroke-width="1.3"/>`).join("") +
    `<circle cx="${cx}" cy="47" r="2.6" fill="#3a2412"/><ellipse cx="${cx - 8}" cy="38" rx="4" ry="2.4" fill="#fff8e6" opacity="0.85"/>`;
  const mouse = (x, i) =>
    `<g transform="translate(${x} 91) scale(${i % 2 ? -0.8 : 0.8} 0.8)"><path d="M-10 1 Q-22 -1 -28 6" stroke="#0d0c0c" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="0" rx="10" ry="6.5" fill="#0d0c0c"/><circle cx="9" cy="-4" r="5" fill="#0d0c0c"/><circle cx="7.5" cy="-9.5" r="3.4" fill="#0d0c0c"/><circle cx="7.5" cy="-9.5" r="1.6" fill="#5a1a22"/><circle cx="11.5" cy="-4.8" r="1.1" fill="#ff3b4f"/></g>`;
  const LIDS = ["M20 47 Q59 8 98 47 Q59 82 20 47 Z", "M102 47 Q141 8 180 47 Q141 82 102 47 Z"];
  // Ids of its own: a stale copy of this overlay elsewhere in the page would otherwise own the clip.
  const uid = Math.random().toString(36).slice(2, 8);
  const makima = cuts.el({ inset: "0", display: "none", background: "radial-gradient(ellipse at 50% 42%, #e0283c 0%, #9e0c22 45%, #3a050c 100%)" });
  makima.innerHTML = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
    <ellipse cx="100" cy="93" rx="78" ry="9" fill="#ffd9b0" opacity="0.9"/><ellipse cx="100" cy="93" rx="50" ry="6" fill="#fff1dc"/>
    <g>${LIDS.map((d) => `<path d="${d}" fill="#fbf4e6"/>`).join("")}</g>
    <defs><clipPath id="iris-l-${uid}"><path d="${LIDS[0]}"/></clipPath><clipPath id="iris-r-${uid}"><path d="${LIDS[1]}"/></clipPath></defs>
    <g clip-path="url(#iris-l-${uid})">${ringsSvg(59)}</g><g clip-path="url(#iris-r-${uid})">${ringsSvg(141)}</g>
    <g fill="none" stroke="#0d0c0c" stroke-linejoin="round">${LIDS.map((d) => `<path d="${d}" stroke-width="2.4"/>`).join("")}
      <path d="M18 45 Q59 2 100 44" stroke-width="4.2"/><path d="M100 44 Q141 2 182 45" stroke-width="4.2"/></g>
    ${[44, 72, 100, 128, 156].map(mouse).join("")}
  </svg>`;

  // Ink borders round each panel (DOM), so the page reads as a page.
  const borders = Array.from({ length: 6 }, () => cuts.el({ border: `0.35vmin solid ${INK}`, boxSizing: "border-box", display: "none" }));

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  const away = (f) => f.root.position.set(0, -50, 0);
  /** Pose a figure's hands for this panel; reset() puts them back. */
  const posed = new Set();
  const hands = (f, pose, { weight = 1, radius } = {}) => {
    posed.add(f);
    f.setHands(pose, weight, radius ? { radius } : undefined);
  };
  /** Sit a posed figure with its seat on `point`: hips over it, thighs on it. */
  const sitAt = (f, point) => {
    f.root.updateMatrixWorld(true);
    const hips = f.bones.hips.getWorldPosition(v3());
    f.root.position.x += point.x - hips.x;
    f.root.position.z += point.z - hips.z;
    f.seatOn(point.y);
  };

  /** Back to neutral between panels: nobody transformed, nobody holding anything. */
  const reset = () => {
    const { denji, reze, pin, saw, daisy } = cast;
    denji.root.rotation.set(0, 0, 0);
    reze.root.rotation.set(0, 0, 0);
    cast.untransform();
    pin.visible = true;
    daisy.visible = false;
    typhoon.visible = false;
    car.visible = false;
    track.visible = false;
    heaven.visible = false;
    ocean.visible = false;
    chain.visible = false;
    redDaisy.visible = false;
    grenadePin.visible = false;
    for (const f of [extra.makima, extra.aki, extra.power, extra.angel]) {
      if (!f) continue;
      away(f);
      f.root.rotation.set(0, 0, 0);
    }
    // Hands back to rest for anyone a homage posed.
    for (const f of posed) for (const sd of ["l", "r"]) f.handRig[sd] && f.setHand(sd, f.handRig[sd].base);
    posed.clear();
    saw.set(0, 0);
    cast.cord?.set(false);
    camera.up.set(0, 1, 0);
  };
  const bombOn = () => {
    cast.reze.root.updateMatrixWorld(true);
    cast.transform(1);
  };

  /* ---------- shots: each stages one panel at local time s ---------- */
  const SHOTS = {
    eye(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(Math.floor(time / BEAT) % 4 === 3 ? LIGHT.blood : LIGHT.festival);
      w.page({ mode: "lines", intensity: 0.8, focus: [0.42, 0.55], seed: Math.floor(time / BEAT) });
      away(denji);
      reze.root.position.copy(at("festival", 0, 0, 0));
      reze.apply({ ...STAND, head: [-0.08, 0.15, 0] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      const k = easeOutCubic(segment(s, 0, 3.6));
      // Three-quarter profile, the festival light raking across her.
      cam(tmp.clone().add(new THREE.Vector3(0.55 - k * 0.1, 0.02, 0.62 - k * 0.12)), tmp.clone().add(new THREE.Vector3(-0.02, -0.02, 0)));
    },
    rain(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.stormWarm);
      w.page({ mode: "rain", intensity: 0.8, disc: [0.75, 0.82, 0], seed: Math.floor(time * 10) });
      away(reze);
      denji.root.position.copy(at("street", -6 + s * 1.6, 0, 0.9));
      denji.root.rotation.y = Math.PI / 2;
      denji.apply(jog(time * 9));
      cam(tmp.copy(denji.root.position).add(new THREE.Vector3(0.6, 1.2, 2.6)), denji.root.position.clone().add(new THREE.Vector3(0.4, 1.1, 0)));
    },
    booth(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.8, seed: Math.floor(time * 10) });
      away(denji);
      reze.root.position.copy(at("street", 0.3, 0, -0.05));
      reze.root.rotation.y = 0.15;
      reze.apply(WAITING);
      reze.root.updateMatrixWorld(true);
      reze.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.1, 0.05, 1.6 - s * 0.08)), tmp.clone().add(new THREE.Vector3(0, -0.2, 0)));
    },
    daisy(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.6, seed: Math.floor(time * 10) });
      away(reze);
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.6;
      denji.apply(OFFER);
      denji.root.updateMatrixWorld(true);
      daisy.visible = true;
      denji.model.getObjectByName("hand_r").getWorldPosition(daisy.position);
      daisy.position.y += 0.1;
      daisy.rotation.set(Math.PI / 2.6, 0.6, 0);
      daisy.scale.setScalar(1.8);
      cam(daisy.position.clone().add(new THREE.Vector3(0.35, 0.05, 0.5)), daisy.position);
    },
    boothTwo(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.7, seed: Math.floor(time * 10) });
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.6;
      denji.apply(STAND);
      reze.root.position.copy(at("street", 0.3, 0, -0.05));
      reze.root.rotation.y = -0.75;
      const laugh = Math.sin(time * 9) * 0.04;
      // The daisy held low, so her laugh stays in the frame.
      reze.apply({ ...STAND, spine: [-0.06, 0, 0], head: [-0.2 + laugh, 0.1, 0.12], lShoulder: [-0.55, -0.2, 0.15], lElbow: [-1.45, 0, 0] });
      reze.root.updateMatrixWorld(true);
      daisy.visible = true;
      reze.model.getObjectByName("hand_l").getWorldPosition(daisy.position);
      daisy.position.y += 0.1;
      daisy.rotation.set(Math.PI / 2.6, -0.5, 0);
      daisy.scale.setScalar(1.6);
      const k = easeInOutCubic(segment(s, 0, BAR * 4));
      cam(at("street", 0.9, 1.45, 2.4).lerp(at("street", 0.55, 1.5, 1.7), k), at("street", 0.05, 1.3, 0));
    },
    walk(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      const k = segment(s, 0, BAR * 4);
      denji.root.position.copy(at("festival", -0.3, 0, lerp(5, 1.2, k)));
      reze.root.position.copy(at("festival", 0.3, 0, lerp(5.1, 1.3, k)));
      denji.root.rotation.y = reze.root.rotation.y = Math.PI;
      const walk = (p) => {
        const q = Math.sin(p);
        return { spine: [0.05, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] };
      };
      denji.apply(walk(time * 6));
      reze.apply({ ...walk(time * 6 + 0.5), head: [-0.3, -0.2, 0] });
      cam(at("festival", 0.9, 1.3, lerp(-1.8, -1.2, k)), at("festival", 0, 1.5, 2.6));
    },
    waterHand(s, time) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time * 0.6;
      away(denji);
      // Sat on the coping at the near end, facing the water, legs down in it.
      reze.root.position.set(0, 0, 0);
      reze.root.rotation.y = Math.PI;
      const pose = POOL_SIT(time);
      // Her right hand comes down and slips into the water: she leans in just
      // as far as puts her fingertips at this height.
      const goal = lerp(0.2, -0.035, easeInOutCubic(segment(s, 0.5, 1.7)));
      const tip = reze.handRig.r.fingers.middle.bones[2];
      const lean = (k) => ({ ...pose, spine: [k, 0, 0.08], head: [0.22 - (k - 0.3) * 0.4, 0.15, 0] });
      let lo = 0.15;
      let hi = 1.2;
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        reze.apply(lean(mid));
        sitAt(reze, at("pool", -1.2, 0.08, 2.92));
        if (tip.getWorldPosition(tmp).y < goal) hi = mid;
        else lo = mid;
      }
      reze.apply(lean((lo + hi) / 2));
      sitAt(reze, at("pool", -1.2, 0.08, 2.92));
      tip.getWorldPosition(tmp);
      const touch = tmp.clone();
      // Rings where her hand broke the surface, and round her shins.
      reze.bones.rKnee.getWorldPosition(tmp);
      water.uA.value.set(touch.x, touch.z, touch.y < 0.03 ? 1 : 0);
      water.uB.value.set(tmp.x, tmp.z - 0.05, 0.6);
      water.uMoonX.value = touch.x;
      // From over the water, low: her face, the hand going in, the legs under the surface.
      const k = easeInOutCubic(segment(s, 0, BAR * 2));
      const P = (x, y, z) => at("pool", -1.2 + x, y, 2.92 + z);
      cam(P(1.25 - k * 0.15, 0.62, -2.15 + k * 0.25), P(0.08, 0.4, -0.12));
    },
    denjiWalk(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.2, 0.8, 0.5);
      w.palette(LIGHT.gray);
      w.page({ mode: "still" });
      away(reze);
      denji.root.position.copy(at("street", -3 + s * 0.6, 0, 1.6));
      denji.root.rotation.y = 0.9;
      const q = Math.sin(time * 5.5);
      denji.apply({ spine: [-0.05, 0, 0], neck: [-0.25, 0, 0], head: [-0.35, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] });
      // Low, looking up past him at the grey sky.
      cam(denji.root.position.clone().add(new THREE.Vector3(1.4, 0.35, 1.6)), denji.root.position.clone().add(new THREE.Vector3(-0.2, 1.9, -0.4)));
    },
    rezeWalk(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.75, seed: Math.floor(time * 10) });
      away(denji);
      reze.root.position.copy(at("street", 4.5 - s * 0.7, 0, 0.8));
      reze.root.rotation.y = -Math.PI / 2;
      const q = Math.sin(time * 5.5);
      reze.apply({ spine: [0.04, 0, 0], head: [0.08, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] });
      cam(reze.root.position.clone().add(new THREE.Vector3(-0.6, 1.2, 2.4)), reze.root.position.clone().add(new THREE.Vector3(-0.3, 1.15, 0)));
    },
    cafeSmile(s, time) {
      const { denji, reze } = cast;
      lot.show("cafe");
      w.light(0.85, 0.55, 0.1);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      away(denji);
      const cafe = lot.sets.cafe;
      reze.root.position.copy(cafe.spots.her).add(cafe.origin);
      reze.apply({ ...LEAN, head: [-0.5, 0.15, 0.2 + Math.sin(time * 1.2) * 0.05] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      // His side of the counter: her, smiling up at him.
      const k = easeInOutCubic(segment(s, 0, BAR * 4));
      cam(tmp.clone().add(new THREE.Vector3(0.25, 0.05, 1.3 - k * 0.35)), tmp.clone().add(new THREE.Vector3(0, -0.04, 0)));
    },
    frantic(s, time) {
      SHOTS[FRANTIC[Math.floor(s / BEAT) % FRANTIC.length]](s, time);
    },
    smile(s, time, where = "festival") {
      const { denji, reze } = cast;
      away(denji);
      if (where === "cafe") return SHOTS.cafeSmile(s, time);
      if (where === "booth") {
        SHOTS.boothTwo(BAR * 4, time);
        away(denji);
        cast.daisy.visible = false;
        reze.root.updateMatrixWorld(true);
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.55, -0.02, 0.75 - s * 0.04)), tmp.clone().add(new THREE.Vector3(0, -0.03, 0)));
        return;
      }
      if (where === "pool") {
        lot.show("pool");
        w.light(0.3, 0.8, -0.5);
        w.palette(LIGHT.pool);
        w.page({ mode: "still" });
        water.uTime.value = time;
        reze.root.position.copy(at("pool", -0.8, -1.38, 0.6));
        reze.root.rotation.y = 0.3;
        reze.apply(TREAD(time * 3));
        water.uA.value.set(reze.root.position.x, reze.root.position.z, 1);
        water.uB.value.set(0, 0, 0);
        reze.root.updateMatrixWorld(true);
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.35, 0.12, 0.9)), tmp.clone().add(new THREE.Vector3(0, -0.02, 0)));
        return;
      }
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -0.4;
      reze.apply({ ...STAND, head: [-0.12, 0.2, 0.15] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.15, 0.0, 0.85 - s * 0.05)), tmp.clone().add(new THREE.Vector3(0, -0.02, 0)));
    },
    bombFace(s, time, angle = "close") {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(0.5, 0.3, 0.8);
      w.palette(LIGHT.devil);
      w.page({ mode: "lines", intensity: 1, focus: [0.5, 0.45], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -0.4;
      reze.apply(DEVIL(time));
      bombOn();
      cast.bombHead.getWorldPosition(tmp);
      const VIEW = {
        close: [new THREE.Vector3(-0.2, 0.15, 1.15), 0.15],
        low: [new THREE.Vector3(0.35, -1.2, 1.5), 0.1],
        profile: [new THREE.Vector3(-1.15, 0.18, 0.1), 0.18],
        fire: [new THREE.Vector3(0.6, 0.3, 1.7), 0.1],
      }[angle];
      cam(tmp.clone().add(VIEW[0]).add(new THREE.Vector3(0, 0, -s * 0.06)), tmp.clone().add(new THREE.Vector3(0, VIEW[1], 0)));
      if (angle === "fire" && frame.dt > 0 && Math.random() < frame.dt * 3) fx.blast(tmp.clone().add(new THREE.Vector3(-1.2 + Math.random() * 2.4, -0.4, -2.5)));
    },
    bombReveal(s, time) {
      const { denji, reze, pin } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(s < BEAT * 2 ? LIGHT.blood : LIGHT.devil);
      w.page({ mode: "lines", intensity: 1, focus: [0.5, 0.4], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.2, 0, 0.6));
      reze.apply(s < BEAT ? PIN : s < BEAT * 2 ? YANKED : DEVIL(time));
      pin.visible = s < BEAT;
      if (s >= BEAT * 2) {
        reze.root.updateMatrixWorld(true);
        cast.transform(lerp(0.2, 1, easeOutBack(segment(s, BEAT * 2, BEAT * 3))));
      }
      // Head to toe, as she stands up out of the blast: the whole of her.
      const k = easeOutCubic(segment(s, BEAT * 2, BAR * 2.5));
      cam(at("festival", 0.55 - k * 0.15, 1.0, 4.1 - k * 0.5), at("festival", 0.2, 0.95 + k * 0.05, 0.6));
    },
    /* ---------- the homages ---------- */
    /** Pulp Fiction: on the floor with her bare feet, doing the twist. */
    feet(s, time) {
      const { denji, reze } = cast;
      const { makima } = extra;
      lot.show("cafe");
      w.light(0.85, 0.55, 0.1);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      away(denji);
      away(reze);
      const spot = at("cafe", 1.3, 0, 2.4);
      makima.root.position.copy(spot);
      makima.root.rotation.y = 0.35 + Math.sin(time * 7) * 0.32;
      makima.apply(TWIST(time));
      hands(makima, "relaxed");
      makima.groundTo(0);
      // Floor level, the feet filling the bottom of the frame, her towering up out of it.
      const k = easeInOutCubic(segment(s, 0, BAR));
      cam(spot.clone().add(v3(0.32 - k * 0.06, 0.06, 0.82 - k * 0.12)), spot.clone().add(v3(0, 0.2 + k * 0.1, 0)));
    },
    /** Once Upon a Time in Hollywood: through the windshield, Aki at the wheel, her feet up on the dash. */
    car(s, time) {
      const { denji, reze } = cast;
      const { makima, aki } = extra;
      lot.show("none");
      car.visible = true;
      w.light(0.7, 0.35, 0.6);
      w.palette(GOLDEN);
      w.page({ mode: "still" });
      away(denji);
      away(reze);
      const C = (x, y, z) => v3(CAR_X + x, y, z);
      const sway = Math.sin(time * 1.7) * 0.012;
      aki.root.position.set(0, 0, 0);
      aki.root.rotation.y = 0;
      aki.apply({ ...DRIVE, head: [0.12, Math.sin(time * 0.8) * 0.08, 0] });
      sitAt(aki, C(-0.42, carParts.SEAT, 0.2));
      aki.root.position.x += sway;
      aki.root.updateMatrixWorld(true);
      hands(aki, "grip", { radius: 0.016 });
      // The wheel sits in his hands; its column runs down into the dash.
      const hl = aki.socket("left").getWorldPosition(v3());
      const hr = aki.socket("right").getWorldPosition(v3());
      const mid = hl.clone().add(hr).multiplyScalar(0.5);
      carParts.wheel.position.copy(mid).sub(car.position);
      carParts.wheel.lookAt(aki.bones.chest?.getWorldPosition(v3()) ?? aki.root.position);
      const base = C(mid.x - CAR_X, carParts.DASH - 0.1, 0.95);
      const run = base.clone().sub(mid);
      carParts.column.position.copy(mid).sub(car.position);
      carParts.column.quaternion.setFromUnitVectors(UP, run.clone().normalize());
      carParts.column.scale.set(1, run.length(), 1);
      carParts.column.geometry.boundingSphere = null;
      makima.root.position.set(0, 0, 0);
      makima.root.rotation.y = 0;
      // Slid down in the seat, legs raised just as far as rests her heels on the dash.
      const feetUp = FEET_UP(time);
      const legsAt = (k) => ({ ...feetUp, lHip: [k, 0, 0.06], rHip: [k + 0.12, 0, -0.1] });
      let lo = -1.4;
      let hi = -2.9;
      for (let i = 0; i < 9; i++) {
        const mid2 = (lo + hi) / 2;
        makima.apply(legsAt(mid2));
        sitAt(makima, C(0.42, carParts.SEAT, 0.3));
        const dy = makima.groundTo(0, { update: false });
        makima.root.position.y -= dy;
        if (-dy < carParts.DASH + 0.01) lo = mid2;
        else hi = mid2;
      }
      makima.apply(legsAt((lo + hi) / 2));
      sitAt(makima, C(0.42, carParts.SEAT, 0.3));
      makima.root.position.x += sway;
      hands(makima, "relaxed");
      // The road runs away behind them.
      for (const r of carParts.runners) r.obj.position.z = -((r.offset + time * 16) % r.gap) - (r.gap === 6 ? 2 : 3);
      const k = easeInOutCubic(segment(s, 0, BAR * 1.25));
      // Up on the hood, looking down through the glass: the dash, the wheel, the two of them.
      cam(C(0.08 + sway, 1.62 + Math.sin(time * 2.3) * 0.006, 3.0 - k * 0.25), C(0, 0.98, 0.1));
    },
    /** Constantine: the Angel Devil let down through the dark on a beam of light. */
    angel(s, time) {
      const { denji, reze } = cast;
      const { angel } = extra;
      lot.show("church");
      heaven.visible = true;
      w.light(0.1, 1, 0.25);
      w.palette(HEAVEN);
      w.page({ mode: "still" });
      away(denji);
      away(reze);
      const len = BAR * 1.25;
      const k = easeOutCubic(segment(s, 0, len));
      angel.root.position.copy(at("church", 0, 0, -2));
      angel.root.rotation.y = 0.15;
      angel.apply(DESCEND(time));
      hands(angel, "open", { weight: 0.6 });
      // Down the beam, slowing, the toes still a hand's width off the floor at the end.
      angel.groundTo(lerp(2.6, 0.12, k));
      spreadWings(lerp(1, 0.8, k), Math.sin(time * 1.6) * 0.06 + 0.1);
      feathers.forEach(({ f, x, z, rate, phase }) => {
        const y = 4.2 - (((time * rate + phase) % 1) * 4.2);
        f.position.set(x + Math.sin(time * 1.3 + phase * 9) * 0.15, y, z);
        f.rotation.set(Math.sin(time + phase) * 0.8, time * 0.5 + phase, Math.cos(time * 1.2 + phase) * 0.6);
      });
      angel.root.updateMatrixWorld(true);
      angel.bones.chest.getWorldPosition(tmp);
      cam(at("church", 0.12, 0.45, 2.6), tmp.clone().add(v3(0, 0.05, 0)));
    },
    /** Bande à part: the Madison, three across the café floor, in black and white. */
    madison(s, time) {
      const { denji, reze } = cast;
      const { power, aki } = extra;
      lot.show("cafe");
      w.light(0.6, 0.7, 0.4);
      w.palette(BLACK_AND_WHITE);
      w.page({ mode: "still" });
      away(reze);
      const p = time / BEAT;
      const slide = Math.sin((p / 4) * Math.PI) * 0.12;
      [[denji, -2.1, false], [power, -1.3, true], [aki, -0.5, false]].forEach(([f, x, snap]) => {
        f.root.position.copy(at("cafe", x + Math.sin(p * Math.PI * 0.5) * 0.08, 0, 1.9 + slide));
        f.root.rotation.y = Math.sin(p * Math.PI * 0.5) * 0.12;
        f.apply(MADISON(p, snap));
        hands(f, snap ? "pinch" : "fist", { weight: snap ? 1 : 0.7 });
        f.groundTo(0);
      });
      const k = easeInOutCubic(segment(s, 0, BAR * 1.25));
      // Godard's framing: knees up, the line of them filling the width, the feet out of it.
      cam(at("cafe", -1.15 - k * 0.3, 1.42, 4.35), at("cafe", -1.3 - k * 0.1, 1.28, 1.9));
    },
    /** The Horse in Motion: frame `i` of six, a stride cut into a sepia strip. */
    horse(s, time, i) {
      const { denji, reze } = cast;
      lot.show("none");
      track.visible = true;
      w.light(0.3, 0.8, 0.6);
      // The projector's flicker.
      w.palette(Math.floor(time * 12) % 3 === 0 ? SEPIA_FLICKER : SEPIA);
      w.page({ mode: "still" });
      away(reze);
      // Twelve frames a second, like a hand-cranked camera; each panel a sixth of a stride on.
      const c = Number(i) / 6 + Math.floor(s * 12) / 12 * 0.5;
      const th = c * Math.PI * 2;
      horseParts.body.position.y = 1.1 + Math.sin(th * 2) * 0.05;
      horseParts.body.rotation.z = Math.sin(th) * 0.07;
      // The head and neck pump with the stride; mane and tail stream.
      horseParts.neck.rotation.z = horseParts.neckZ + Math.sin(th + 0.6) * 0.12;
      horseParts.tail.rotation.z = Math.sin(th * 2) * 0.12 - 0.15;
      for (const { lock, q0, t } of horseParts.mane) lock.quaternion.copy(q0).multiply(wingQ.setFromEuler(wingE.set(0, 0, Math.sin(th * 2 + t * 3) * 0.18)));
      for (const { hip, knee, fetlock, front, off } of legs) {
        const q = th + off;
        const swing = Math.max(0, Math.cos(q)); // coming forward: folded
        // Fore: forearm swings from the elbow, knee folds back, hoof flicks up.
        // Hind: the gaskin slopes back from the stifle, the hock folds forward.
        hip.rotation.z = front ? 0.6 * Math.sin(q) + 0.05 : 0.5 * Math.sin(q) - 0.3;
        knee.rotation.z = front ? -1.25 * swing : 0.3 + 0.95 * swing;
        fetlock.rotation.z = front ? -0.9 * swing + 0.2 * Math.max(0, -Math.cos(q)) : -0.6 * swing;
      }
      // The horse holds the middle of the frame; the ruled wall slides past behind.
      horseParts.rules.position.x = -((c * 2.4) % 0.53);
      horse.updateMatrixWorld(true);
      denji.root.position.set(0, 0, 0);
      denji.root.rotation.y = Math.PI / 2;
      denji.apply(RIDE(Math.sin(th * 2)));
      sitAt(denji, horseParts.seat.getWorldPosition(v3()));
      hands(denji, "fist", { weight: 0.85 });
      // The reins: from his hands to the bit.
      const hands0 = denji.socket("left").getWorldPosition(v3()).add(denji.socket("right").getWorldPosition(v3())).multiplyScalar(0.5);
      const bit = horseParts.mouth.getWorldPosition(v3());
      const run = bit.clone().sub(hands0);
      horseParts.rein.position.copy(hands0).sub(track.position);
      horseParts.rein.quaternion.setFromUnitVectors(UP, run.clone().normalize());
      horseParts.rein.scale.set(1, run.length(), 1);
      const T = (x, y, z) => v3(TRACK_X + x, y, z);
      cam(T(0.2, 1.3, 4.9), T(0.2, 1.2, 0));
    },
    /** Léon: Makima holds up the grenade pin on her finger; Denji reaches for it. */
    leon(s, time) {
      const { denji, reze } = cast;
      const { makima } = extra;
      lot.show("warehouse");
      w.light(-0.2, 0.9, 0.35);
      w.palette(LIGHT.church);
      w.page({ mode: "still" });
      away(reze);
      makima.root.position.copy(at("warehouse", 0.34, 0, 2));
      makima.root.rotation.y = -Math.PI / 2;
      const up = easeOutCubic(segment(s, 0, 0.5));
      makima.apply(blendPose(STAND, PIN_UP, up));
      makima.groundTo(0);
      hands(makima, "point");
      denji.root.position.copy(at("warehouse", -0.36, 0, 2));
      denji.root.rotation.y = Math.PI / 2;
      denji.apply(blendPose(STAND, TAKE, easeInOutCubic(segment(s, 0.6, BAR))));
      denji.groundTo(0);
      hands(denji, "open", { weight: 0.7 });
      // The ring over the first joint of her index finger.
      makima.root.updateMatrixWorld(true);
      const index = makima.handRig.r.fingers.index.bones;
      const a = index[0].getWorldPosition(v3());
      const b = index[1].getWorldPosition(v3());
      grenadePin.visible = true;
      grenadePin.position.copy(a).lerp(b, 0.6);
      grenadePin.quaternion.setFromUnitVectors(v3(0, 0, 1), b.sub(a).normalize());
      const k = easeInOutCubic(segment(s, 0.2, BAR));
      // Toward the ring, keeping his face in the frame.
      denji.bones.head.getWorldPosition(tmp);
      const focus = grenadePin.position.clone().lerp(tmp, 0.3);
      cam(at("warehouse", 0.02, 1.48, 3.3).lerp(focus.clone().add(v3(-0.05, 0.02, 0.62)), k * 0.75), at("warehouse", 0, 1.45, 2).lerp(focus, k));
    },
    /** One fight, a move per bar: which moves, and where, come from MOVES. */
    fight(s, time, where) {
      const list = MOVES[where];
      const i = Math.min(list.length - 1, Math.floor(s / BAR));
      SHOTS.move(s - i * BAR, time, where, list[i], `${where}${i}`);
    },
    /** A single move of the fight, `m` seconds into its bar. */
    move(m, time, where, name, key = `${where}-${name}`) {
      const { denji, reze, saw } = cast;
      const set = where === "city" ? "street" : where === "pool" ? "pool" : "festival";
      // The city fight is staged up the street, clear of the booth.
      const [cx, cz] = set === "street" ? [-4.4, 1.8] : [0, 0.6];
      const P = (x, y, z) => at(set, cx + x, y, cz + z);
      const b = Math.floor(m / BEAT);
      const hit = (beat, fn) => {
        const id = `${key}:${Math.floor(frame.c / BAR)}:${beat}`;
        if (b >= beat && !hits.has(id) && frame.dt > 0) {
          hits.add(id);
          fn();
        }
      };
      lot.show(set);
      const night = set === "street" ? LIGHT.storm : LIGHT.festival;
      w.palette(b === (MOVE_WORD[name]?.[1] ?? -1) ? LIGHT.blood : [night, LIGHT.devil][b % 2]);
      w.light(b % 2 ? 0.6 : -0.6, 0.5, 0.6);
      w.page(set === "street" ? { mode: "rain", intensity: 0.9, seed: b + Math.floor(time * 10) } : { mode: "lines", intensity: 1, focus: [0.5, 0.5], seed: Math.floor(time * 12) });
      saw.set(1, time);
      denji.root.rotation.set(0, Math.PI / 2, 0);
      reze.root.rotation.set(0, -Math.PI / 2, 0);
      const shake = (k) => new THREE.Vector3((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, 0);
      const her = (pose) => {
        reze.apply(pose);
        bombOn();
      };

      if (name === "rocket") {
        // She crouches, and goes up on her own blast.
        away(denji);
        const up = easeOutCubic(segment(m, BEAT, BAR));
        reze.root.position.copy(P(1.0 + up * 1.6, up * 4.2, 0));
        her(m < BEAT ? CROUCH : FLY);
        hit(1, () => fx.blast(P(1.0, 0.1, 0)));
        cam(P(-0.8, 0.25, 2.8).add(shake(b === 1 ? 0.1 : 0)), P(1.4 + up, 1.4 + up * 3, 0));
      } else if (name === "fingerBombs") {
        // Bombs off her fingers, one a beat; he runs straight through them.
        reze.root.position.copy(P(2.4, 1.4 + Math.sin(time * 3) * 0.1, -0.5));
        her(b % 2 ? PUNCH : DEVIL(time));
        const run = segment(m, 0, BAR);
        denji.root.position.copy(P(lerp(-2.6, 0.4, run), 0, 0.2));
        denji.apply(blendPose(jog(time * 11), LUNGE, 0.45));
        for (let k = 0; k < 4; k++) hit(k, () => fx.blast(P(lerp(-2.2, 0.6, k / 3) + (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.5, (k % 2 ? 0.7 : -0.5))));
        // Over her shoulder: her in the foreground, him coming through the fire.
        cam(P(3.5, 2.4, 0.5), P(-0.6, 1.0, 0.1));
      } else if (name === "sawLeap") {
        // He comes down on her saws first; she slips back out of it.
        const air = segment(m, 0, BEAT * 2);
        denji.root.position.copy(P(lerp(-2.4, 0.1, easeOutCubic(air)), Math.sin(Math.PI * air) * 1.3, 0));
        denji.apply(m < BEAT * 1.6 ? LEAP : SLASH);
        const slip = easeOutCubic(segment(m, BEAT * 1.4, BEAT * 2.2));
        reze.root.position.copy(P(lerp(1.1, 2.2, slip), 0, lerp(0, -0.4, slip)));
        her(slip > 0.05 ? DODGE : DEVIL(time));
        hit(2, () => fx.blood(P(1.3, 1.3, -0.2), 70));
        cam(P(-0.1 + m * 0.1, 1.1, 4.4 - m * 0.2), P(0.1, 1.2, 0));
      } else if (name === "bombPunch") {
        // She closes the gap and punches; the punch is an explosion. He flies.
        const dash = easeOutCubic(segment(m, 0, BEAT));
        reze.root.position.copy(P(lerp(2.7, 0.9, dash), 0, 0));
        her(m < BEAT * 0.5 ? DEVIL(time) : PUNCH);
        const fly = segment(m, BEAT, BAR);
        denji.root.position.copy(P(-easeOutCubic(fly) * 3.4, Math.sin(Math.PI * Math.min(1, fly * 1.2)) * 0.9, 0));
        denji.root.rotation.z = fly * 0.9;
        denji.apply(fly > 0 ? KNOCKED : LUNGE);
        hit(1, () => {
          fx.blast(P(0.4, 1.35, 0));
          fx.blood(P(0.2, 1.3, 0), 90);
        });
        cam(P(1.0, 1.5, 4.3).add(shake(b === 1 ? 0.12 : 0.02)), P(-0.7, 1.1, 0));
      } else if (name === "regrow") {
        // On one knee, in pieces; the cord; he comes back up revving.
        reze.root.position.copy(P(2.8, 0, -1.4));
        reze.root.rotation.y = -Math.PI / 2 - 0.5;
        her(DEVIL(time));
        denji.root.position.copy(P(-0.6, 0, 0));
        denji.root.rotation.y = Math.PI / 2 + 0.5;
        let pose = KNEEL;
        if (m > BEAT) pose = blendPose(KNEEL, { ...KNEEL, ...CORD, head: KNEEL.head }, easeOutCubic(segment(m, BEAT, BEAT * 1.4)));
        if (m > BEAT * 2) pose = blendPose(pose, { ...KNEEL, ...YANK }, easeOutCubic(segment(m, BEAT * 2, BEAT * 2.2)));
        if (m > BEAT * 3) pose = blendPose(pose, RISE, easeOutBack(segment(m, BEAT * 3, BEAT * 3.6)));
        denji.apply(pose);
        saw.set(m < BEAT * 2 ? 0 : easeOutBack(segment(m, BEAT * 2.1, BEAT * 2.7)), time);
        cast.cord?.set(m > BEAT * 0.8 && m < BEAT * 2.4, m < BEAT * 2.2 ? easeOutCubic(segment(m, BEAT, BEAT * 1.3)) : 1 - segment(m, BEAT * 2.2, BEAT * 2.4));
        hit(2, () => fx.blood(P(-0.6, 1.0, 0), 60));
        cam(P(0.5, 0.75, 1.9), P(-0.5, 0.95, 0));
      } else if (name === "airClash") {
        // Both off the ground, into each other; the blast throws them apart.
        const go = easeInOutCubic(segment(m, 0, BEAT * 2));
        const apart = easeOutCubic(segment(m, BEAT * 2, BAR));
        denji.root.position.copy(P(lerp(-2.6, -0.42, go) - apart * 1.8, lerp(0.3, 2.3, go) - apart * 0.8, 0));
        reze.root.position.copy(P(lerp(2.6, 0.42, go) + apart * 1.8, lerp(0.5, 2.2, go) + apart * 0.6, 0));
        denji.apply(apart > 0 ? KNOCKED : LEAP);
        her(apart > 0 ? FLY : PUNCH);
        hit(2, () => fx.blast(P(0, 2.7, 0)));
        cam(P(0.2, 0.35, 3.4).add(shake(b === 2 ? 0.12 : 0)), P(0, 2.3, 0));
      } else if (name === "chase") {
        // Over the street on her blasts; him under her, keeping up.
        const k = segment(m, 0, BAR);
        reze.root.position.copy(P(lerp(-2.5, 2.8, k), 3.0 + Math.sin(time * 4) * 0.15, -0.6));
        reze.root.rotation.set(0, Math.PI / 2, 0.15);
        her(FLY);
        denji.root.position.copy(P(lerp(-3.4, 1.6, k), 0, 0.5));
        denji.apply(jog(time * 12));
        for (let k2 = 0; k2 < 4; k2++) hit(k2, () => fx.blast(reze.root.position.clone().add(new THREE.Vector3(-0.6, -0.3, 0))));
        const mid = lerp(-2.9, 2.2, k);
        cam(P(mid - 0.6, 1.4, 6.4), P(mid, 1.9, 0));
      } else if (name === "grab") {
        // He gets hold of her and does not let go. Backlit: two shapes turning.
        w.light(0, 0.35, -1);
        const a = m * 1.6;
        const ox = Math.cos(a) * 0.4;
        const oz = Math.sin(a) * 0.4;
        denji.root.position.copy(P(-ox, 0, -oz));
        reze.root.position.copy(P(ox, 0, oz));
        denji.root.rotation.y = Math.atan2(ox, oz);
        reze.root.rotation.y = Math.atan2(-ox, -oz);
        denji.apply(CLINCH);
        her(STRUGGLE(time));
        cam(P(0.3, 1.45, 2.6), P(0, 1.35, 0));
      } else if (name === "chains") {
        // He gets hold of her and runs the chain round them both, again and
        // again, pulling it tight: neither of them is getting out of this.
        w.light(0, 0.35, -1);
        denji.root.position.copy(P(-0.2, 0, 0));
        reze.root.position.copy(P(0.2, 0, 0));
        denji.apply(CLINCH);
        her(STRUGGLE(time));
        chain.visible = true;
        chain.count = Math.max(1, Math.round(CHAIN_LINKS * easeOutCubic(segment(m, 0, BEAT * 3.2))));
        chain.position.copy(P(0, 0, 0));
        chain.rotation.set(0, m * 0.8, 0);
        hit(1, () => fx.blood(P(0, 1.3, 0), 40));
        // Low and wide from the side, the lanterns behind: the coil reads against them.
        cam(P(1.7, 0.55, 2.3), P(0, 1.15, 0));
      } else if (name === "plunge") {
        // Chained together, out of the sky and into the sea.
        lot.show("none");
        ocean.visible = true;
        w.palette(LIGHT.storm);
        w.light(-0.4, 0.7, 0.5);
        w.page({ mode: "rain", intensity: 0.8, seed: Math.floor(time * 10) });
        const sea = oceanParts.water;
        sea.uTime.value = time;
        const O = (x, y, z) => v3(OCEAN_X + x, y, z);
        const fall = easeInCubic(segment(m, 0, BEAT * 2));
        const y = lerp(7.5, -1.6, fall);
        denji.root.position.copy(O(-0.2, y, -7));
        reze.root.position.copy(O(0.2, y, -7));
        denji.root.rotation.set(0, Math.PI / 2, 0.25);
        reze.root.rotation.set(0, -Math.PI / 2, 0.25);
        denji.apply(CLINCH);
        her(STRUGGLE(time * 0.4));
        chain.visible = true;
        chain.count = CHAIN_LINKS;
        chain.position.copy(O(0, y, -7));
        chain.rotation.set(0, 0, 0.25);
        hit(2, () => fx.splash(O(0, 0.1, -7), 160));
        sea.uA.value.set(OCEAN_X, -7, m > BEAT * 2 ? 1 : 0);
        sea.uB.value.set(0, 0, 0);
        sea.uMoonX.value = OCEAN_X - 6;
        oceanParts.foam.position.set(0, 0.012, 0.1);
        cam(O(2.6, 1.2, -2.4), O(0, Math.max(0.5, y + 1.1), -7));
      } else if (name === "shore") {
        // Morning. The sea gives them back on the sand: Denji and Reze again,
        // side by side, the surf running up to their feet.
        lot.show("none");
        ocean.visible = true;
        w.palette(LIGHT.dawn);
        w.light(0.6, 0.45, -0.6);
        w.page({ mode: "still" });
        saw.set(0, 0);
        cast.untransform();
        const sea = oceanParts.water;
        sea.uTime.value = time * 0.6;
        sea.uA.value.set(0, 0, 0);
        sea.uB.value.set(0, 0, 0);
        sea.uMoonX.value = OCEAN_X + 2;
        const O = (x, y, z) => v3(OCEAN_X + x, y, z);
        // On their backs, feet to the sea, heads up the beach.
        for (const [f, x, tilt] of [[denji, -0.32, 0.08], [reze, 0.32, -0.1]]) {
          f.root.position.copy(O(x, 0.13, 0.7));
          f.root.rotation.set(Math.PI / 2, Math.PI, tilt);
          f.apply({ spine: [-0.05, 0, 0], head: [0.05, tilt * 3, 0], lShoulder: [0.05, 0, 0.3], lElbow: [-0.25, 0, 0], rShoulder: [0.05, 0, -0.3], rElbow: [-0.25, 0, 0], lKnee: [0.15, 0, 0], rKnee: [0.1, 0, 0] });
        }
        oceanParts.foam.position.set(0, 0.012, 0.25 + Math.sin(time * 1.6) * 0.32);
        // Down on the sand beside them, the sea behind.
        const k = easeInOutCubic(segment(m, 0, BAR));
        cam(O(-2.1 + k * 0.2, 1.35, 2.5), O(0.1, 0.1, 1.35));
      } else if (name === "daisies") {
        // Then a white daisy and a red one come down out of the sky and land
        // on the water, one after the other, rings spreading from each.
        lot.show("none");
        ocean.visible = true;
        w.palette(LIGHT.dawn);
        w.light(0.6, 0.45, -0.6);
        w.page({ mode: "still" });
        away(denji);
        away(reze);
        const sea = oceanParts.water;
        sea.uTime.value = time;
        sea.uMoonX.value = OCEAN_X + 0.4;
        oceanParts.foam.position.set(0, 0.012, 0.25 + Math.sin(time * 1.6) * 0.32);
        const O = (x, y, z) => v3(OCEAN_X + x, y, z);
        const { daisy } = cast;
        [[daisy, -0.18, -1.7, 0], [redDaisy, 0.22, -1.45, BEAT * 1.2]].forEach(([d, x, z, t0], i) => {
          const k = segment(m, t0, t0 + BEAT * 1.1);
          const landed = k >= 1;
          d.visible = m > t0 - 0.01;
          d.scale.setScalar(2.2);
          // Down turning, then flat on the surface, bobbing.
          d.position.copy(O(x, landed ? 0.015 + Math.sin(time * 3 + i) * 0.006 : lerp(2.4, 0.015, easeInCubic(k)), z));
          d.rotation.set(landed ? -0.05 : 0.9 - k * 0.95, time * (landed ? 0.3 : 3) + i, 0.1);
          (i ? sea.uB : sea.uA).value.set(OCEAN_X + x, z, landed ? 1 : 0);
          if (landed) hit(i ? 3 : 2, () => fx.splash(O(x, 0.05, z), 24));
        });
        cam(O(0.85, 0.55, -0.15), O(0.02, 0.15, -1.6));
      }
    },
    typhoon(s, time) {
      const { denji, reze, saw } = cast;
      lot.show("street");
      typhoon.visible = true;
      w.light(-0.3, 0.6, 0.6);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 1, seed: Math.floor(time * 10) });
      away(reze);
      rings.forEach((ring, i) => {
        ring.rotation.z = time * (0.6 + i * 0.05);
        ring.position.x = Math.sin(time * 0.8 + i * 0.35) * (0.4 + i * 0.12);
      });
      // Small in the foreground: him, facing it.
      denji.root.position.copy(at("street", 0, 0, 2.5));
      denji.root.rotation.y = Math.PI;
      denji.apply({ ...STAND, lShoulder: [0, 0, 0.5], rShoulder: [0, 0, -0.5] });
      saw.set(1, time);
      cam(at("street", 1.6, 0.6, 7), at("street", 0.6, 6, -20));
    },
    cafeSchool(s, time) {
      const { denji, reze } = cast;
      const school = Math.floor(s / (BEAT * 2)) % 2 === 1;
      if (!school) {
        lot.show("cafe");
        w.light(0.85, 0.55, 0.1);
        w.palette(LIGHT.cafe);
        w.page({ mode: "still" });
        const cafe = lot.sets.cafe;
        reze.root.position.copy(cafe.spots.her).add(cafe.origin);
        reze.apply(LEAN);
        denji.root.position.copy(cafe.spots.him).add(cafe.origin);
        denji.root.position.y = 0.32;
        denji.root.rotation.y = Math.PI;
        denji.apply(SIT);
        seat(denji, cafe.spots.stool.clone().add(cafe.origin));
        cam(at("cafe", 1.5 - s * 0.05, 1.6, -0.6), at("cafe", -1.0, 1.32, -0.55));
      } else {
        lot.show("school");
        w.light(0.9, 0.5, 0.2);
        w.palette(LIGHT.school);
        w.page({ mode: "still" });
        reze.root.position.copy(at("school", 0.2, 0.38, -1.45));
        reze.root.rotation.y = Math.PI / 2;
        reze.apply(SIT_DESK(time));
        seat(reze, at("school", 0.38, 0.76, -1.4));
        denji.root.position.copy(at("school", 1.8, 0.06, -0.85));
        denji.root.rotation.y = Math.PI + 0.75;
        denji.apply(SIT);
        seat(denji, at("school", 1.8, 0.47, -0.85));
        cam(at("school", 1.9, 1.55, 2.3), at("school", 0.95, 0.95, -1.15));
      }
    },
    swim(s, time, view) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      const a = time * 0.3;
      const ra = at("pool", -0.8 + Math.cos(a) * 0.9, -1.38, 0.6 + Math.sin(a) * 0.7);
      const da = at("pool", -0.8 + Math.cos(a + 2.6) * 0.9, -1.45, 0.6 + Math.sin(a + 2.6) * 0.7);
      reze.root.position.copy(ra);
      denji.root.position.copy(da);
      reze.root.rotation.y = -a;
      denji.root.rotation.y = -a - 2.6;
      reze.apply(TREAD(time * 3));
      denji.apply(TREAD(time * 3 + 1.5));
      water.uA.value.set(ra.x, ra.z, 1);
      water.uB.value.set(da.x, da.z, 1);
      water.uMoonX.value = lot.sets.pool.origin.x + 0.6;
      // `low`: from down at the surface, the two of them over the ripples.
      if (view === "low") cam(at("pool", 0.9 - s * 0.08, 0.14, 2.0), at("pool", -0.8, 0.25, 0.6));
      else cam(at("pool", -0.8 + Math.sin(0.8 + s * 0.1) * 2.3, 0.6, 0.6 + Math.cos(0.8 + s * 0.1) * 2.3), at("pool", -0.8, 0.2, 0.6));
    },
    float(s, time) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      reze.root.position.copy(at("pool", -1.2, 0.0, 1.55));
      denji.root.position.copy(at("pool", -0.2, 0.0, 1.65));
      reze.root.rotation.set(-Math.PI / 2, 0, 0.05);
      denji.root.rotation.set(-Math.PI / 2, 0, -0.05);
      reze.apply(FLOAT);
      denji.apply(FLOAT);
      water.uA.value.set(0, 0, 0);
      water.uB.value.set(0, 0, 0);
      water.uMoonX.value = lot.sets.pool.origin.x - 0.7;
      camera.up.set(0, 0, -1);
      cam(at("pool", -0.7, 3.6, 0.8), at("pool", -0.7, 0, 0.78));
    },
    faces(s, time, view) {
      const { denji, reze } = cast;
      lot.show("festival");
      // Backlit by the fireworks: the kiss reads in silhouette.
      w.light(0.1, 0.35, -1);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      const k = easeInOutCubic(segment(s, 0, 3.6));
      // Chests stay apart; the lean and the tilt close the gap at the face.
      denji.root.position.copy(at("festival", lerp(-0.42, -0.25, k), 0, 0.6));
      reze.root.position.copy(at("festival", lerp(0.42, 0.25, k), 0, 0.6));
      denji.root.rotation.y = Math.PI / 2;
      reze.root.rotation.y = -Math.PI / 2;
      denji.apply(blendPose(STAND, KISS_HIM, k));
      reze.apply(blendPose(STAND, KISS_HER, k));
      // `close`: over his shoulder onto her face, not the frontal two-shot.
      if (view === "close") cam(at("festival", -0.95, 1.62, 1.0), at("festival", 0.2, 1.48, 0.55));
      else cam(at("festival", 0.03, 1.5, 2.0 - k * 0.5), at("festival", 0, 1.5, 0.6));
    },
    /** The bud vase on the counter between them, the two of them soft behind it. */
    vase(s, time) {
      SHOTS.cafeSchool(0, time);
      const v = lot.sets.cafe.spots.vase.clone().add(lot.sets.cafe.origin);
      cam(v.clone().add(v3(0.6 - s * 0.04, 0.16, 0.78)), v.clone().add(v3(-0.08, 0.12, 0)));
    },
    bite(s, time) {
      SHOTS.faces(3.6, time);
      const { denji } = cast;
      w.palette(LIGHT.blood);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.5], seed: Math.floor(time * 12) });
      denji.apply(RECOIL);
      cam(at("festival", 0.02, 1.52, 1.25), at("festival", 0, 1.5, 0.6));
    },
    pin(s, time) {
      const { denji, reze, pin } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.blood);
      w.page({ mode: "still" });
      away(denji);
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -Math.PI / 2;
      reze.apply(s < 0.6 ? PIN : YANKED);
      pin.visible = s < 0.6;
      reze.root.updateMatrixWorld(true);
      reze.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.8, 0.05, 0.45)), tmp.clone().add(new THREE.Vector3(0, -0.05, 0)));
    },
    bomb(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.devil);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.35], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.2, 0, 0.6));
      reze.root.rotation.y = 0;
      reze.apply(DEVIL(time));
      bombOn();
      // Tunnel vision: a slow walk round her, from her right side to the front.
      const a = lerp(-0.75, 0.35, easeInOutCubic(segment(s, 0, BAR * 4)));
      cam(at("festival", 0.2 + Math.sin(a) * 2.1, 1.3, 0.6 + Math.cos(a) * 2.1), at("festival", 0.2, 1.38, 0.6));
    },
    cord(s, time) {
      const { denji, reze, saw } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.stormWarm);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.45], seed: Math.floor(time * 12) });
      away(reze);
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.3;
      const k = segment(s, 0.1, 0.5);
      denji.apply(blendPose(CORD, YANK, easeOutCubic(k)));
      saw.set(easeOutBack(segment(s, 0.45, 0.9)), time);
      denji.root.updateMatrixWorld(true);
      cast.cord?.set(s < 0.6, 1 - segment(s, 0.5, 0.6));
      denji.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(0.15, 0, 1.7)), tmp.clone().add(new THREE.Vector3(0, -0.15, 0)));
    },
    end(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.7, disc: [0.5, 0.78, 0], seed: Math.floor(time * 10) });
      away(denji);
      away(reze);
      daisy.visible = true;
      // Face up on the booth floor, where she dropped it.
      daisy.position.copy(at("street", 0.05, 0.02, 0.15));
      daisy.rotation.set(-0.3, 0.4, 0.1);
      daisy.scale.setScalar(2.4);
      const k = easeInOutCubic(segment(s, 0, 8));
      cam(at("street", 0.7 - k * 0.35, 1.3 - k * 0.6, 1.9 - k * 1.0), at("street", 0.05, 0.05, 0.15));
    },
  };

  /* ---------- the frame ---------- */
  const frame = { panels: [], time: 0, c: 0, dt: 0 };
  // Fight hits that already went off this pass, so each lands once.
  const hits = new Set();
  const state = { rocket: 0 };
  // Lock to the song: the video's clock arrives a few times a second, and the
  // film eases toward it so the cut never jumps.
  const sync = { offset: 0, goal: null };
  const WORDS = { title, crunch, boom, vroom };

  const update = (time, dt) => {
    if (sync.goal !== null) {
      // A seek or a new loop is a jump: snap. Small drift: ease.
      if (Math.abs(sync.goal - sync.offset) > 1.5) sync.offset = sync.goal;
      else sync.offset += (sync.goal - sync.offset) * Math.min(1, dt * 4);
    }
    const c = staticMode ? STATIC_TIME : (((time + sync.offset) % CYCLE) + CYCLE) % CYCLE;
    if (!cast.denji || !extra.ready) return;
    let page = PAGES[0];
    for (const p of PAGES) if (c >= p.t) page = p;
    const s = c - page.t;
    const beat = Math.floor(s / BEAT);
    frame.time = time;
    frame.c = c;
    frame.dt = dt;
    frame.panels = page.panels.map((p) => ({ ...p, s, on: beat >= (p.beat ?? 0), fresh: Math.max(0, 1 - (s - (p.beat ?? 0) * BEAT) / 0.18) }));

    // Fireworks over the festival pages.
    const FESTIVAL = new Set(["faces", "walk", "bite", "bomb", "eye", "bombFace", "bombReveal", "smile:festival", "fight:festival", "move:festival"]);
    const festival = frame.panels.some((p) => FESTIVAL.has(p.shot) || FESTIVAL.has(p.shot.split(":")[0]) || FESTIVAL.has(p.shot.split(":").slice(0, 2).join(":")));
    if (dt > 0 && festival) {
      state.rocket += dt;
      if (state.rocket > 0.35) {
        state.rocket = 0;
        fx.firework(at("festival", -6 + Math.random() * 12, 6 + Math.random() * 3, -9 - Math.random() * 4), Math.random() < 0.5);
      }
    }
    fx.step(dt);
    if (c < 0.05) {
      fx.clear();
      hits.clear();
    }

    // ── Editing ──
    const cut = { iris: 1, flash: 0, black: 0, bars: 0, ring: "#c8102e" };
    if (page.iris === "open") {
      // Opens in two moves, the second on the downbeat of bar 2, pulsing on the beat between.
      cut.iris = segment(s, 0.2, BAR * 0.8) * 0.55 + 0.45 * easeOutCubic(segment(s, BAR * 3, BAR * 3.6)) + (s > BAR && s < BAR * 3 ? Math.sin((s / BEAT) * Math.PI) * 0.04 : 0);
      cut.at = [46, 44];
    }
    if (page.iris === "close") {
      const left = CYCLE - c;
      cut.iris = Math.min(easeOutCubic(segment(s, 0, 1.2)), 1 - easeInOutCubic(segment(left, 5, 1.2)) * 0.97 - (left < 1.2 ? 0.03 : 0));
      cut.at = [48, 70];
      cut.black = 1 - segment(left, 0.6, 0.05);
    }
    // The homages: each opens on an iris and shuts on one (a straight cut where two belong together).
    if (page.reel) {
      const len = PAGES[PAGES.indexOf(page) + 1].t - page.t;
      const open = page.reel.in ? easeOutCubic(segment(s, 0.02, 0.34)) : 1;
      const shut = page.reel.out ? 1 - easeInCubic(segment(s, len - 0.3, len - 0.02)) : 1;
      cut.iris = Math.min(open, shut);
      cut.at = page.reel.at;
    }
    // Slam: a flash as each panel lands; chorus pages flash on the bar, the fight on each hit.
    // The drop: the music cuts out, and so does the picture.
    if (page.drop) cut.black = 1;
    // Tunnel vision: the iris closes to a ring round her and breathes on the beat.
    if (page.ring) {
      cut.iris = lerp(1, 0.4 + Math.sin((s / BEAT) * Math.PI) * 0.03, easeOutCubic(segment(s, 0, BAR)));
      cut.at = [50, 42];
    }
    const onBeat = Math.max(0, 1 - (s % BEAT) / 0.12);
    const onBar = Math.max(0, 1 - (s % BAR) / 0.14);
    // The fight: which move this bar is, and the beat it lands on.
    const move = page.fight ? MOVES[page.fight][Math.min(MOVES[page.fight].length - 1, Math.floor(s / BAR))] : null;
    const landed = move && MOVE_WORD[move] && Math.floor((s % BAR) / BEAT) === MOVE_WORD[move][1];
    cut.flash = Math.max(0, ...frame.panels.map((p) => (p.on && p.r !== FULL && !page.reel ? p.fresh * 0.6 : 0)), landed ? onBeat * 0.7 : 0, page.pulse ? onBar * 0.4 : 0, page.frantic ? onBeat * 0.35 : 0);
    makima.style.display = page.makima ? "block" : "none";
    if (page.fight) cut.flashColor = move === "bombPunch" || move === "airClash" ? "#fff6ea" : "#ff1d3d";
    else if (page.pulse) cut.flashColor = Math.floor(s / BAR) % 2 ? "#ff1d3d" : "#fff6ea";
    cuts.update(cut);

    // ── Lettering ──
    const shown = new Set();
    for (const word of page.words ?? []) {
      const k = segment(s, word.at, word.at + 0.25);
      const on = s > word.at && s < word.until;
      if (!on) continue;
      shown.add(word.id);
      WORDS[word.id].update({ x: word.x, y: word.y, size: word.size, rotate: word.id === "vroom" ? -8 : word.id === "title" ? -4 : 6, opacity: Math.min(1, k * 4), scale: lerp(2.4, 1, easeOutBack(k)), boil: Math.floor(time * 12), jitter: 0.08 });
    }
    if (move && MOVE_WORD[move]) {
      // One word per move, slammed on its hit and held to the end of the bar.
      const [id, on] = MOVE_WORD[move];
      const since = (s % BAR) - on * BEAT;
      if (since >= 0) {
        shown.add(id);
        const k = Math.min(1, since / 0.2);
        const left = Math.floor(s / BAR) % 2 === 0;
        WORDS[id].update({ x: left ? 30 : 68, y: left ? 72 : 26, size: 12, rotate: left ? -8 : 7, opacity: Math.min(1, k * 4), scale: lerp(2.2, 1, easeOutBack(k)), boil: Math.floor(time * 12), jitter: 0.1 });
      }
    }
    for (const [id, w] of Object.entries(WORDS)) if (!shown.has(id)) w.update({ opacity: 0 });

    // ── Panel borders ──
    borders.forEach((b, i) => {
      const p = frame.panels[i];
      if (!p || p.r === FULL) {
        b.style.display = "none";
        return;
      }
      b.style.display = "block";
      b.style.left = `${p.r[0] * 100}%`;
      b.style.top = `${p.r[1] * 100}%`;
      b.style.width = `${(p.r[2] - p.r[0]) * 100}%`;
      b.style.height = `${(p.r[3] - p.r[1]) * 100}%`;
      b.style.outline = `0.5vmin solid ${PAPER}`;
      b.style.outlineOffset = "-0.85vmin";
      b.style.opacity = p.on ? "1" : "0";
    });
  };

  /** Each panel: stage its shot, then draw it into its own scissored rectangle. */
  const render = () => {
    if (!cast.denji || !extra.ready) {
      renderer.render(w.scene, camera);
      return;
    }
    const { width: W, height: H } = stage.size;
    const gutter = Math.max(2, Math.round(Math.min(W, H) * 0.008));
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, W, H);
    renderer.setViewport(0, 0, W, H);
    renderer.setClearColor(PAPER, 1);
    renderer.clear();
    for (const p of frame.panels) {
      const full = p.r === FULL;
      const g = full ? 0 : gutter;
      const x = Math.round(p.r[0] * W) + g;
      const y = Math.round((1 - p.r[3]) * H) + g;
      const pw = Math.round((p.r[2] - p.r[0]) * W) - g * 2;
      const ph = Math.round((p.r[3] - p.r[1]) * H) - g * 2;
      if (pw < 2 || ph < 2) continue;
      renderer.setScissor(x, y, pw, ph);
      renderer.setViewport(x, y, pw, ph);
      if (!p.on) {
        renderer.setClearColor(INK, 1);
        renderer.clear();
        continue;
      }
      reset();
      // A panel that just landed is drawn a touch large, then settles.
      camera.fov = 36 * (1 - p.fresh * 0.08);
      const [id, ...args] = p.shot.split(":");
      SHOTS[id](p.s - (p.beat ?? 0) * BEAT, frame.time, ...args);
      camera.aspect = pw / ph;
      camera.updateProjectionMatrix();
      w.bu.uAspect.value = pw / ph;
      renderer.render(w.scene, camera);
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    camera.fov = 36;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fx.resize(height, camera.fov, renderer.getPixelRatio());
  });

  return {
    ready: Promise.all([cast.ready, extrasReady]).then(() => cast),
    update,
    render,
    /** `clock`: seconds into the song, from the video player. */
    setProps({ clock } = {}) {
      if (typeof clock === "number") sync.goal = clock - frame.time;
    },
    dispose() {
      unsubscribeResize();
      words.forEach((x) => x.dispose());
      borders.forEach((b) => b.remove());
      cuts.dispose();
    },
  };
};
