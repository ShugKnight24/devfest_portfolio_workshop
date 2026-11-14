import * as THREE from "three";
import { createCuts, createInkWorld } from "../rezeKit";
import { canvasTexture, clamp01, createParticles, easeInCubic, easeInOutCubic, easeOutCubic, hash, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { outline } from "../ink";

/**
 * Ganryū-jima, 1612 — the backdrop for "You already have a Way".
 *
 * Morning on a small flat island in the Kanmon strait, the sun just off the
 * sea. Musashi comes late, standing in the bow of a rowboat with the long
 * wooden sword he cut from a spare oar on the way over. Kojirō has been
 * waiting on the sand with the Drying Pole, his three-foot blade. Musashi
 * keeps the sun at his back the whole fight.
 *
 * Story time (the exchange runs in slow motion, so the loop is longer on the
 * clock — LOOP below):
 *
 *   0     – 4.6   the boat glides in out of the glare; Kojirō waits on the sand
 *   4.6   – 5.3   Musashi steps over the gunwale into shin-deep water
 *   5.3   – 8.3   he wades in, the oar-sword low in his right hand;
 *                 Kojirō strides down to the water's edge
 *   7.8   – 8.45  Kojirō draws, the left hand pulling the scabbard back
 *   8.45  – 9.6   he flings the scabbard into the sea; it splashes and floats
 *   9.6   – 10.8  "You have already lost": Musashi, still in the shallows
 *   10.8  – 13.0  they stalk: Musashi comes out of the water in waki-gamae, the
 *                 sword's length hidden behind him; Kojirō gives ground in hassō
 *   13.0  – 13.6  both rush in; Kojirō's first cut, a diagonal, falls short
 *   13.6  – 13.86 (slow) Musashi leaps and brings the oar down overhead while
 *                 Kojirō turns his blade back up, the swallow cut; it takes
 *                 only the headband (13.80) — the oar lands on his head (13.86)
 *   13.86 – 15.6  Kojirō staggers, the sword falls, he drops to his knees, falls
 *   15.6  – 17.6  Musashi holds, then bows
 *   17.6  – 22    he walks back into the water to the boat; fade, and again
 *
 * Bodies are the Quaternius Superhero base (CC0) in painted period clothes,
 * with split-leg hakama skinned to the legs. Both swords are held in the
 * figures' hands (fig.hold) and a small two-bone IK closes the second hand on
 * the handle, so hands wrap the grips from every angle. Every figure is
 * planted on the sand or the sea bed with fig.groundTo each frame. Sea and
 * sky are one shared sky function, so the water reflects the dawn it sits
 * under. Reduced motion holds the stalk: Musashi in waki-gamae on the wet sand
 * with the sun behind him, Kojirō in hassō, the scabbard floating.
 */

// ── Time: story seconds, with the exchange slowed to a fifth ─────────────────
const S_LOOP = 22;
const STATIC_TIME = 11.9;
const SLOW = [13.42, 13.6, 13.88, 14.05]; // ramp in, full slow, ramp out, normal
const SLOW_RATE = 0.2;

// Toward the sun: just right of the action axis, six degrees up.
const SUN = new THREE.Vector3(0.12, 0.1, -0.99).normalize();
// The key comes from the sun but higher, so the wrap still models a body.
const KEY = [0.14, 0.38, -0.92];
const PAL = { ground: "#1a1420", lines: "#ffd2a8", accent: "#ff9a5a", rim: "#ffb27a", shade: "#8090c4" };
const HAZE = "#8a6c80";

// ── The island ───────────────────────────────────────────────────────────────
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
// The shore bows out toward the sea in the middle: a small island, not a coast.
const shoreZ = (x) => 0.012 * x * x - 0.4 * Math.sin(x * 0.21);
const heightAt = (x, z) => {
  const d = z - shoreZ(x);
  let y = d > 0 ? Math.min(0.065 * d, 0.5 + 0.02 * d) : d * 0.11 * (1 + Math.max(0, -d - 6) * 0.06);
  y += 0.05 * Math.exp(-((d - 5.5) ** 2) / 6); // a soft berm above the tide line
  y += Math.sin(x * 1.3 + z * 0.4) * Math.sin(z * 1.7 - x * 0.5) * 0.012;
  return Math.max(y, -3.2);
};

// The same swell in JS and GLSL, so the boat rides the water it is drawn on.
const WAVES = [
  [0.148, 0.989, 0.838, 0.07],
  [-0.33, 0.944, 1.496, 0.035],
  [0.514, 0.857, 2.732, 0.018],
  [-0.8, 0.6, 4.488, 0.008],
];
const swellAt = (x, z, t) => WAVES.reduce((h, [dx, dz, k, a]) => h + a * Math.sin(k * (dx * x + dz * z) - Math.sqrt(9.8 * k) * t), 0);
const tideAt = (t) => 0.03 * Math.sin(t * 0.7) + 0.012 * Math.sin(t * 1.9 + 1.3);
const ampAt = (depth) => smooth(0, 1.4, depth);

const WAVES_GLSL = /* glsl */ `
  uniform float uTime, uTide;
  void wave(vec2 p, float t, vec2 d, float k, float a, inout float h, inout vec2 g) {
    float ph = k * dot(d, p) - sqrt(9.8 * k) * t;
    h += a * sin(ph);
    g += a * k * cos(ph) * d;
  }
  float swell(vec2 p, float t, out vec2 g) {
    float h = 0.0;
    g = vec2(0.0);
    ${WAVES.map(([dx, dz, k, a]) => `wave(p, t, vec2(${dx}, ${dz}), ${k}, ${a}, h, g);`).join("\n    ")}
    return h;
  }
`;

/** Dawn over the strait: warm horizon, dusk-blue zenith, thin lit stratus. */
const SKY_GLSL = /* glsl */ `
  uniform vec3 uSun, uSunColor, uZenith, uUpper, uHorizon, uGlow, uBelow, uCloud;
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
  }
  vec3 skyColor(vec3 d, float disc, float clouds) {
    float e = d.y;
    float mu = max(dot(d, uSun), 0.0);
    float near = max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0);
    vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.22, e));
    col = mix(col, uZenith, smoothstep(0.18, 0.75, e));
    // The horizon burns brightest under the sun.
    col += uGlow * pow(near, 4.0) * (1.0 - smoothstep(0.0, 0.3, e)) * 0.22;
    col += uGlow * (pow(mu, 14.0) * 0.16 + pow(mu, 240.0) * 0.32);
    // Stratus: dark against the sky, gold where it crosses the sun.
    if (clouds > 0.0) {
      vec2 q = vec2(atan(d.x, -d.z) * 5.0, e * 34.0);
      float n = vnoise(q + vec2(0.0, 3.0)) * 0.6 + vnoise(q * vec2(2.7, 2.1)) * 0.3 + vnoise(q * vec2(6.3, 5.0)) * 0.1;
      float cloud = smoothstep(0.52, 0.72, n) * smoothstep(0.035, 0.07, e) * (1.0 - smoothstep(0.13, 0.3, e));
      col = mix(col, mix(uCloud, uGlow * 1.6, pow(mu, 10.0)), cloud * 0.7 * clouds);
    }
    col = mix(uBelow, col, smoothstep(-0.03, 0.0, e));
    col += uSunColor * smoothstep(0.9999, 0.99994, mu) * disc;
    return col;
  }
`;

// The clock → story table: the rate dips to SLOW_RATE through the exchange.
const rateAt = (s) => 1 - (1 - SLOW_RATE) * smooth(SLOW[0], SLOW[1], s) * (1 - smooth(SLOW[2], SLOW[3], s));
const DC = 1 / 240;
const WARP = (() => {
  const out = [0];
  let s = 0;
  while (s < S_LOOP) {
    s = Math.min(S_LOOP, s + rateAt(s) * DC);
    out.push(s);
  }
  return out;
})();
const LOOP = (WARP.length - 1) * DC;
const storyAt = (c) => {
  const f = c / DC;
  const i = Math.min(WARP.length - 2, Math.floor(f));
  return lerp(WARP[i], WARP[i + 1], f - i);
};

// ── Poses (figure.js convention: faces +z, left is +x) ──────────────────────
// Arms only matter for a free hand: a hand on a handle is placed by reach().
const M_STAND = {
  spine: [0.05, 0, 0],
  head: [0.04, 0, 0],
  lShoulder: [0.04, 0, 0.1],
  lElbow: [-0.2, 0, 0],
  rShoulder: [-0.25, 0, -0.1],
  rElbow: [-0.35, 0, 0],
  lHip: [0, 0, 0.05],
  rHip: [0, 0, -0.05],
};
// Over the gunwale: the right knee high, stepping off to his right.
const M_STEP = {
  ...M_STAND,
  spine: [0.2, 0, 0],
  head: [-0.05, 0, 0],
  lHip: [0.1, 0, 0.06],
  lKnee: [0.3, 0, 0],
  rHip: [-1.15, 0, -0.3],
  rKnee: [1.3, 0, 0],
};
// Waki-gamae: right foot back, the body turned right so the sword hides behind him.
const M_WAKI = {
  spine: [0.12, -0.42, 0],
  head: [0.02, 0.38, 0],
  lShoulder: [-0.3, 0, -0.2],
  lElbow: [-0.6, 0, 0],
  lHip: [-0.42, 0.3, 0.1],
  lKnee: [0.45, 0, 0],
  rHip: [0.32, 0.3, -0.14],
  rKnee: [0.35, 0, 0],
};
const M_CREEP = { ...M_WAKI, spine: [0.2, -0.45, 0], head: [-0.06, 0.4, 0], lHip: [-0.55, 0.3, 0.1], lKnee: [0.7, 0, 0], rHip: [0.3, 0.3, -0.14], rKnee: [0.6, 0, 0] };
// The leap: knees tucked, the back arched under the raised sword.
const M_LEAP = {
  spine: [-0.12, 0, 0],
  chest: [-0.06, 0, 0],
  head: [-0.12, 0, 0],
  lHip: [-1.0, 0, 0.1],
  lKnee: [1.15, 0, 0],
  rHip: [-0.15, 0, -0.1],
  rKnee: [1.0, 0, 0],
};
// The blow lands: arms long, the body behind it, a deep front knee.
const M_IMPACT = {
  spine: [0.24, 0, 0],
  chest: [0.06, 0, 0],
  head: [-0.18, 0, 0],
  lHip: [-0.75, 0, 0.1],
  lKnee: [0.8, 0, 0],
  rHip: [0.45, 0, -0.08],
  rKnee: [0.3, 0, 0],
};
const M_STRIKE = { ...M_IMPACT, spine: [0.36, 0, 0], chest: [0.1, 0, 0], neck: [-0.1, 0, 0], head: [-0.28, 0, 0], lHip: [-0.85, 0, 0.1], lKnee: [1.0, 0, 0], rHip: [0.5, 0, -0.08], rKnee: [0.35, 0, 0] };
// Zanshin: upright, the point still on the man on the sand.
const M_ZANSHIN = {
  spine: [0.1, 0, 0],
  head: [0.22, 0, 0],
  lHip: [-0.25, 0, 0.08],
  lKnee: [0.25, 0, 0],
  rHip: [0.2, 0, -0.08],
  rKnee: [0.15, 0, 0],
};
const M_BOW = { ...M_ZANSHIN, spine: [0.42, 0, 0], chest: [0.08, 0, 0], head: [0.25, 0, 0], lHip: [-0.08, 0, 0.06], lKnee: [0.08, 0, 0], rHip: [0.05, 0, -0.06], rKnee: [0.05, 0, 0] };

// Kojirō: the sheathed sword in his left hand at the hip, then the draw and the throw.
const K_WAIT = {
  spine: [0.02, 0, 0],
  lShoulder: [-0.3, 0, 0.05],
  lElbow: [-1.1, 0, 0],
  rShoulder: [0.05, 0, -0.12],
  rElbow: [-0.2, 0, 0],
  lHip: [0, 0, 0.07],
  rHip: [0, 0, -0.07],
};
const K_REACH = { ...K_WAIT, spine: [0.1, 0.3, 0], head: [0, -0.25, 0], rShoulder: [-0.7, 0, 0.5], rElbow: [-0.9, 0, 0], lHip: [-0.2, 0, 0.08], lKnee: [0.25, 0, 0], rHip: [0.18, 0, -0.08], rKnee: [0.2, 0, 0] };
const K_DRAW = { ...K_REACH, spine: [0.06, -0.12, 0], head: [0, 0.1, 0] };
// The throw, side-arm with the left: wound back, then whipped through toward the sea.
const K_WIND = {
  spine: [0.02, 0.42, 0],
  head: [0, -0.32, 0],
  lShoulder: [0.9, 0, 0.95],
  lElbow: [-0.45, 0, 0],
  lHip: [-0.25, 0, 0.1],
  lKnee: [0.3, 0, 0],
  rHip: [0.2, 0, -0.1],
  rKnee: [0.25, 0, 0],
};
const K_FLING = { ...K_WIND, spine: [0.16, -0.38, 0], head: [0, 0.25, 0], lShoulder: [-1.3, 0, 0.75], lElbow: [-0.1, 0, 0], lHip: [-0.38, 0, 0.1], lKnee: [0.45, 0, 0] };
// Hassō: the long blade by the right shoulder, raked back; left foot forward.
const K_HASSO = {
  spine: [0.06, 0.18, 0],
  head: [0, -0.15, 0],
  lHip: [-0.28, 0, 0.1],
  lKnee: [0.32, 0, 0],
  rHip: [0.22, 0, -0.1],
  rKnee: [0.28, 0, 0],
};
const K_JODAN = { spine: [-0.06, 0, 0], head: [-0.05, 0, 0], lHip: [-0.42, 0, 0.1], lKnee: [0.42, 0, 0], rHip: [0.26, 0, -0.1], rKnee: [0.26, 0, 0] };
// The first cut: down from the right shoulder to the left knee.
const K_CUT = {
  spine: [0.32, 0.3, 0],
  chest: [0.08, 0, 0],
  head: [-0.25, -0.22, 0],
  lHip: [-0.68, 0, 0.1],
  lKnee: [0.78, 0, 0],
  rHip: [0.42, 0, -0.1],
  rKnee: [0.3, 0, 0],
};
// The swallow's turn: the same blade straight back up, the body unwinding.
const K_REV = {
  spine: [0.1, -0.35, 0],
  head: [-0.22, 0.28, 0],
  lHip: [-0.62, 0, 0.1],
  lKnee: [0.66, 0, 0],
  rHip: [0.42, 0, -0.1],
  rKnee: [0.3, 0, 0],
};
const K_HIT = {
  spine: [-0.25, 0, 0.1],
  chest: [-0.1, 0, 0],
  head: [-0.45, 0.2, 0],
  lShoulder: [-0.5, 0, 0.1],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-0.6, 0, -0.05],
  rElbow: [-0.25, 0, 0],
  lHip: [-0.2, 0, 0.1],
  lKnee: [0.35, 0, 0],
  rHip: [0.3, 0, -0.1],
  rKnee: [0.4, 0, 0],
};
// On both knees, head hanging, hands loose.
const K_KNEES = {
  spine: [0.45, 0, 0.05],
  chest: [0.2, 0, 0],
  neck: [0.2, 0, 0],
  head: [0.35, 0, 0],
  lShoulder: [-0.15, 0, 0.15],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-0.3, 0, -0.1],
  rElbow: [-0.3, 0, 0],
  lHip: [-0.25, 0, 0.12],
  lKnee: [1.75, 0, 0],
  rHip: [-0.2, 0, -0.12],
  rKnee: [1.75, 0, 0],
};
// Face down (the root is tipped over on top of this).
const K_DOWN = {
  spine: [0.05, 0, 0],
  head: [-0.3, 0.6, 0],
  lShoulder: [0.1, 0, 0.35],
  lElbow: [-0.2, 0, 0],
  rShoulder: [0.1, 0, -0.6],
  rElbow: [-0.2, 0, 0],
  lHip: [0, 0, 0.12],
  lKnee: [0.1, 0, 0],
  rHip: [0, 0, -0.1],
  rKnee: [0.05, 0, 0],
};

// The boatman sculls with the ro over the stern, facing the side of the boat.
const B_SCULL = {
  spine: [0.22, 0, 0],
  head: [-0.12, 0, 0],
  lShoulder: [-0.9, 0, -0.25],
  lElbow: [-0.8, 0, 0],
  rShoulder: [-0.9, 0, 0.25],
  rElbow: [-0.8, 0, 0],
  lHip: [-0.3, 0, 0.12],
  lKnee: [0.35, 0, 0],
  rHip: [0.25, 0, -0.12],
  rKnee: [0.25, 0, 0],
};

// ── The timeline (story seconds) ─────────────────────────────────────────────
const M_KEYS = [
  { t: 0, pose: M_STAND },
  { t: 4.6, pose: M_STAND },
  { t: 4.85, pose: M_STEP },
  { t: 5.3, pose: M_STAND },
  { t: 10.75, pose: M_STAND },
  { t: 11.25, pose: M_WAKI },
  { t: 12.95, pose: M_WAKI },
  { t: 13.3, pose: M_CREEP },
  { t: 13.6, pose: M_CREEP },
  { t: 13.72, pose: M_LEAP, ease: easeOutCubic },
  { t: 13.86, pose: M_IMPACT, ease: easeInCubic },
  { t: 13.98, pose: M_STRIKE, ease: easeOutCubic },
  { t: 14.6, pose: M_STRIKE },
  { t: 15.5, pose: M_ZANSHIN },
  { t: 16.4, pose: M_ZANSHIN },
  { t: 16.9, pose: M_BOW },
  { t: 17.25, pose: M_BOW },
  { t: 17.7, pose: M_STAND },
];

/*
 * Where the sword is, per key, in the shoulder frame (origin between the
 * shoulders, +x to the figure's left, +y up, +z the way the chest faces):
 * `grip` is the right hand's grip point, `dir` the blade, `palm` the way the
 * edge faces (the palms sit on the back of the handle; default: away from the
 * chest), `two` how much the left hand is on it, `aim` how far the blade turns
 * onto a target (Musashi: the top of Kojirō's head; Kojirō: past Musashi's
 * temple, across the headband).
 */
const CARRY = { grip: [-0.24, -0.5, 0.08], dir: [-0.05, -0.42, 0.9], two: 0 };
const WAKI = { grip: [-0.18, -0.55, 0.04], dir: [-0.25, -0.62, -0.74], two: 1 };
const M_SWORD = [
  { t: 0, ...CARRY },
  { t: 10.75, ...CARRY },
  { t: 11.25, ...WAKI },
  { t: 13.3, ...WAKI },
  { t: 13.6, grip: [-0.18, -0.56, 0.06], dir: [-0.3, -0.62, -0.72], two: 1 },
  { t: 13.67, grip: [-0.24, 0.02, 0.24], dir: [-0.3, 0.88, -0.36], two: 1 },
  { t: 13.74, grip: [-0.04, 0.34, 0.06], dir: [0, 0.45, -0.89], two: 1, ease: easeOutCubic },
  { t: 13.86, grip: [-0.02, 0.06, 0.5], dir: [0, 0.05, 1], two: 1, aim: 1, ease: easeInCubic },
  { t: 13.95, grip: [-0.02, 0.07, 0.5], dir: [0, 0.08, 1], two: 1, aim: 0.85 },
  { t: 14.6, grip: [-0.03, -0.18, 0.46], dir: [0, -0.3, 0.95], two: 1 },
  { t: 15.5, grip: [-0.05, -0.36, 0.38], dir: [0, -0.3, 0.95], two: 1 },
  { t: 17.2, grip: [-0.05, -0.36, 0.38], dir: [0, -0.3, 0.95], two: 1 },
  { t: 17.7, ...CARRY },
];

const K_KEYS = [
  { t: 0, pose: K_WAIT },
  { t: 7.75, pose: K_WAIT },
  { t: 7.98, pose: K_REACH },
  { t: 8.45, pose: K_DRAW },
  { t: 8.62, pose: K_WIND },
  { t: 8.78, pose: K_FLING, ease: easeOutCubic },
  { t: 9.35, pose: K_HASSO },
  { t: 12.95, pose: K_HASSO },
  { t: 13.4, pose: K_JODAN },
  { t: 13.58, pose: K_CUT, ease: easeInCubic },
  { t: 13.65, pose: K_CUT },
  { t: 13.8, pose: K_REV, ease: easeOutCubic },
  { t: 13.86, pose: K_REV },
  { t: 14.05, pose: K_HIT, ease: easeOutCubic },
  { t: 14.5, pose: K_KNEES },
  { t: 14.95, pose: K_KNEES },
  { t: 15.6, pose: K_DOWN, ease: easeInCubic },
];
// The scabbard in his left hand: grip point and mouth→tip, in his shoulder frame.
const SAYA_GRIP = [0.12, -0.34, -0.05];
const SAYA_DIR = [0.6, -0.2, -0.77];
const SAYA_PULL = 0.35; // how far the left hand pulls the scabbard back off the blade
const REACH = [7.78, 8.0];
const DRAW = [8.0, 8.45];
const FLING = [8.78, 9.6];
const DRAWN_GRIP = SAYA_GRIP.map((v, i) => v + (SAYA_PULL - 0.147 - 0.95) * SAYA_DIR[i]);
const K_SWORD = [
  { t: 8.45, grip: DRAWN_GRIP, dir: SAYA_DIR, two: 0 },
  { t: 8.8, grip: [-0.32, 0.12, 0.24], dir: [-0.3, 0.9, 0.3], two: 0 },
  { t: 9.35, grip: [-0.12, 0.05, 0.22], dir: [-0.1, 0.9, -0.42], two: 1, low: 1 },
  { t: 12.95, grip: [-0.12, 0.05, 0.22], dir: [-0.1, 0.9, -0.42], two: 1, low: 1 },
  { t: 13.4, grip: [-0.03, 0.32, 0.12], dir: [0, 0.6, -0.8], two: 1 },
  { t: 13.5, grip: [0.0, 0.06, 0.4], dir: [0.45, 0.32, 0.83], palm: [0.6, -0.75, 0.3], two: 1 },
  { t: 13.58, grip: [0.1, -0.28, 0.32], dir: [0.6, -0.45, 0.66], palm: [0.4, -0.85, -0.3], two: 1, ease: easeInCubic },
  { t: 13.65, grip: [0.1, -0.3, 0.32], dir: [0.62, -0.48, 0.62], palm: [-0.4, 0.85, 0.3], two: 1 },
  { t: 13.74, grip: [-0.05, 0.0, 0.42], dir: [-0.25, 0.2, 0.95], palm: [-0.5, 0.85, 0], two: 1, aim: 0.6 },
  { t: 13.8, grip: [-0.1, 0.22, 0.42], dir: [-0.4, 0.45, 0.8], palm: [-0.55, 0.8, -0.2], two: 1, aim: 1 },
  { t: 13.86, grip: [-0.15, 0.22, 0.32], dir: [-0.55, 0.6, 0.58], palm: [-0.6, 0.6, -0.5], two: 1, ease: easeOutCubic },
  { t: 13.95, grip: [-0.18, 0.2, 0.38], dir: [-0.5, 0.5, 0.7], two: 0.4 },
  { t: 14.1, grip: [-0.14, -0.3, 0.3], dir: [-0.1, -0.75, 0.65], two: 0 },
  { t: 14.4, grip: [-0.12, -0.42, 0.26], dir: [-0.1, -0.85, 0.5], two: 0 },
];
const BAND_CUT = 13.8;
const IMPACT = 13.86;
const DROP = [14.4, 14.75];
const FALL = [14.95, 15.6];
const FALL_DIR = new THREE.Vector3(0.6, 0, -0.8);
const FALL_AXIS = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), FALL_DIR);
const FALL_YAW = Math.atan2(FALL_DIR.x, FALL_DIR.z);
const TAU = Math.PI * 2;

// Where people stand (x, z). The shore runs along z ≈ 0; the sea is -z.
const M_IN = [0.15, -2.25]; // where he lands off the boat, shin deep
const M_STOP = [0.1, -0.7]; // ankle deep, for the scabbard and the words
const M_SET = [0.12, 0.5]; // out on the wet sand
const M_JUMP = [0.13, 1.05];
const M_LAND = [0.15, 1.75];
const M_BACK = [0.32, -2.2]; // beside the bow again
const K_START = [0.35, 7.2];
const K_EDGE = [0.35, 2.5];
const K_SET = [0.3, 3.5];
const K_CUTAT = [0.25, 3.22];
const K_FIGHT = [0.2, 2.98];
const K_KNEEL = [0.24, 3.14];
const SAYA_WATER = new THREE.Vector3(-1.9, 0, -1.2);
const SWORD_REST = new THREE.Vector3(-0.45, 0, 3.0);

/*
 * Shots, cut hard between: each dollies from p0/l0 to p1/l1. The wide on the
 * sand, low at the waterline for the step, the scabbard's flight, over
 * Kojirō's shoulder into the sun for the words and the slow exchange, a low
 * profile for the stalk, and a crane back as Musashi leaves.
 */
const SHOTS = [
  { t: 0, p0: [1.0, 0.7, 12.6], p1: [1.4, 0.68, 11.9], l0: [2.6, 1.45, -12], l1: [1.6, 1.3, -8] },
  { t: 4.6, p0: [4.6, 0.5, -1.0], p1: [4.3, 0.55, 0.1], l0: [0.6, 0.75, -2.3], l1: [0.2, 0.85, -0.9] },
  { t: 7.7, p0: [2.3, 1.05, -0.4], p1: [2.0, 1.0, 0.0], l0: [0.3, 1.25, 2.5], l1: [-0.9, 0.6, 0.6] },
  { t: 9.6, p0: [0.95, 1.66, 3.75], p1: [0.85, 1.62, 3.45], l0: [0.1, 1.5, -0.7], l1: [0.1, 1.52, -0.7] },
  { t: 10.8, p0: [7.1, 0.44, 0.9], p1: [6.7, 0.4, 2.0], l0: [0.15, 0.95, 0.9], l1: [0.15, 1.0, 2.0] },
  { t: 13.0, p0: [-0.9, 1.2, -1.6], p1: [-0.75, 1.15, -1.0], l0: [0.3, 1.25, 3.0], l1: [0.3, 1.25, 3.0] },
  { t: 13.45, p0: [1.7, 0.35, 5.3], p1: [1.5, 0.33, 5.15], l0: [0.1, 1.62, 1.4], l1: [0.12, 1.5, 1.75] },
  { t: 13.98, p0: [-3.7, 0.4, 3.1], p1: [-3.6, 0.45, 2.9], l0: [0.2, 1.0, 2.5], l1: [0.2, 0.95, 2.6] },
  { t: 16.0, p0: [3.4, 1.6, 6.8], p1: [3.7, 3.4, 9.6], l0: [0.2, 0.7, 1.8], l1: [0.6, 0.3, -1.6] },
  { t: S_LOOP },
];
const shotAt = (s) => {
  let i = 0;
  while (i < SHOTS.length - 2 && s >= SHOTS[i + 1].t) i++;
  return { shot: SHOTS[i], u: easeInOutCubic(segment(s, SHOTS[i].t, SHOTS[i + 1].t)) };
};

/** The two keys around `c` and the eased progress between them. */
const keyAt = (keys, c) => {
  let i = 0;
  while (i < keys.length - 1 && c >= keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const u = a === b ? 0 : segment(c, a.t, b.t);
  return { a, b, k: (b.ease ?? easeInOutCubic)(u) };
};
const poseAt = (keys, c) => {
  const { a, b, k } = keyAt(keys, c);
  return blendPose(a.pose, b.pose, k);
};
/** Walk with a short ease at each end instead of crawling through the middle. */
const cruise = (u, edge = 0.15) => {
  const v = 1 / (1 - edge);
  if (u < edge) return (v * u * u) / (2 * edge);
  if (u > 1 - edge) return 1 - (v * (1 - u) ** 2) / (2 * edge);
  return v * (u - edge / 2);
};
/** Swing the legs (and a free left arm) on top of a pose. */
const gait = (pose, phase, amt, knee = 0.6, arms = false) => {
  if (amt <= 0) return pose;
  const s = Math.sin(phase);
  const co = Math.cos(phase);
  const add = (j, x) => (pose[j] = [(pose[j]?.[0] ?? 0) + x, pose[j]?.[1] ?? 0, pose[j]?.[2] ?? 0]);
  add("lHip", -0.4 * s * amt);
  add("rHip", 0.4 * s * amt);
  add("lKnee", knee * Math.max(0, co) * amt);
  add("rKnee", knee * Math.max(0, -co) * amt);
  if (arms) add("lShoulder", 0.22 * s * amt);
  add("spine", 0.04 * amt);
  return pose;
};
const angleTo = (a, b, k) => a + (((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI) * k;

// ── Props ────────────────────────────────────────────────────────────────────
const BLADE = 0.92;
const sori = (y) => 0.034 * (clamp01(y / BLADE) ** 1.6);
const bladeWidth = (y) => lerp(0.034, 0.026, clamp01(y / BLADE));
const KISSAKI = BLADE - 0.07;

/** The blade's outline, edge on -x, curving back toward the spine. */
const bladeShape = () => {
  const s = new THREE.Shape();
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const y = (KISSAKI * i) / N;
    const x = sori(y) - bladeWidth(y) / 2;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.quadraticCurveTo(sori(BLADE) - bladeWidth(BLADE) * 0.3, BLADE - 0.02, sori(BLADE) + bladeWidth(BLADE) / 2, BLADE);
  for (let i = N; i >= 0; i--) {
    const y = ((BLADE - 0.004) * i) / N;
    s.lineTo(sori(y) + bladeWidth(y) / 2, y);
  }
  return s;
};
/** A thin strip along the cutting edge: the part that catches the sun. */
const edgeShape = () => {
  const s = new THREE.Shape();
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const y = 0.01 + ((KISSAKI - 0.01) * i) / N;
    if (i === 0) s.moveTo(sori(y) - bladeWidth(y) / 2, y);
    else s.lineTo(sori(y) - bladeWidth(y) / 2, y);
  }
  for (let i = N; i >= 0; i--) {
    const y = 0.01 + ((KISSAKI - 0.01) * i) / N;
    s.lineTo(sori(y) - bladeWidth(y) / 2 + 0.0045, y);
  }
  return s;
};
// Extruded flat, then turned so the width runs along local z (edge toward +z)
// and the flat faces ±x; the blade starts just past the tsuba.
const extrudeBlade = (shape, depth) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  g.rotateY(Math.PI / 2);
  g.translate(0, 0.232, 0);
  return g;
};

/** Monohoshizao: a long curved blade, round tsuba, a long dark grip. Origin at the grip. */
const buildNodachi = (w) => {
  const g = new THREE.Group();
  const steel = w.ink({ tint: "#d9dee4", tone: 1.15, rim: 0.6, spec: 1 });
  const iron = w.ink({ tint: "#2a2626", tone: 0.5, rim: 0.8 });
  const blade = new THREE.Mesh(extrudeBlade(bladeShape(), 0.0055), steel);
  const edgeMat = new THREE.MeshBasicMaterial({ color: "#c9d2dc" });
  const edge = new THREE.Mesh(extrudeBlade(edgeShape(), 0.0075), edgeMat);
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.009, 20), iron);
  tsuba.position.y = 0.212;
  tsuba.scale.z = 0.85;
  const habaki = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.04), w.ink({ tint: "#b08a3a", tone: 0.9, rim: 0.6, spec: 1 }));
  habaki.position.y = 0.228;
  const tsuka = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0175, 0.4, 10), w.ink({ tint: "#1d1818", tone: 0.5, rim: 0.7 }));
  tsuka.scale.x = 0.72;
  const kashira = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), iron);
  kashira.position.y = -0.2;
  kashira.scale.set(0.75, 0.6, 1);
  g.add(blade, edge, tsuba, habaki, tsuka, kashira);
  [blade, tsuba, tsuka].forEach((m) => outline(m, w.line));
  return { group: g, edgeMat };
};

/** The scabbard: black lacquer, the blade's curve, origin at the mouth. */
const buildSaya = (w) => {
  const len = BLADE + 0.06;
  const path = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new THREE.Vector3(0, (len * i) / 8, -sori((len * i) / 8))));
  const geo = new THREE.TubeGeometry(path, 28, 0.021, 8, false);
  geo.scale(0.6, 1, 1);
  const lacquer = w.ink({ tint: "#1a1418", tone: 0.55, rim: 0.9, spec: 1 });
  const saya = new THREE.Mesh(geo, lacquer);
  const kojiri = new THREE.Mesh(new THREE.SphereGeometry(0.021, 10, 8), lacquer);
  kojiri.position.set(0, len, -sori(len));
  kojiri.scale.x = 0.6;
  const koiguchi = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.03, 12), w.ink({ tint: "#3a2f2a", tone: 0.6, rim: 0.6 }));
  koiguchi.scale.x = 0.62;
  const g = new THREE.Group();
  g.add(saya, kojiri, koiguchi);
  outline(saya, w.line);
  return g;
};

/**
 * The oar-sword: cut from a spare oar in the boat, so it is thicker than any
 * bokken, faceted where the knife went, unfinished wood. Origin at the grip.
 */
const buildBokken = (w) => {
  const len = 1.3;
  const geo = new THREE.CylinderGeometry(0.021, 0.027, len, 7, 24, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + len / 2) / len;
    // Knife facets: noise by position, so the seam's twin vertices agree.
    const f = 1 + Math.sin(x * 400 + y * 37) * Math.sin(z * 350 - y * 23) * 0.13;
    pos.setXYZ(i, x * 0.85 * f, y + len / 2 - 0.24, z * 1.15 * f - 0.028 * t * t);
  }
  const faceted = geo.toNonIndexed();
  geo.dispose();
  faceted.computeVertexNormals();
  const bokken = new THREE.Mesh(faceted, w.ink({ tint: "#c79f6c", tone: 1.05, rim: 1.0 }));
  outline(bokken, w.line);
  return bokken;
};

/** A kobune: flat-bottomed, flared sides, square transom, the bow sweeping up. */
const buildBoat = (w) => {
  const g = new THREE.Group();
  // The floorboards' height in the hull: well over the waterline (the hull
  // floats with the sea at about 0.16).
  const DECK = 0.28;
  const N = 22;
  const L = 5.4;
  const half = (s) => (s < 0.42 ? 0.6 - 0.12 * ((0.42 - s) / 0.42) ** 2 : 0.6 * Math.max(0, 1 - ((s - 0.42) / 0.58) ** 2) ** 0.55);
  const sheer = (s) => 0.5 + 0.38 * s ** 3;
  const keel = (s) => 0.28 * Math.max(0, (s - 0.72) / 0.28) ** 2;
  const verts = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const z = -L / 2 + s * L;
    const b = half(s);
    const top = sheer(s);
    const bot = keel(s);
    verts.push(-b, top, z, -0.78 * b, bot + 0.07, z, 0, bot, z, 0.78 * b, bot + 0.07, z, b, top, z);
  }
  const index = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < 4; j++) {
      const a = i * 5 + j;
      index.push(a, a + 5, a + 1, a + 5, a + 6, a + 1);
    }
  }
  index.push(0, 1, 2, 0, 2, 3, 0, 3, 4); // the transom
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  hullGeo.setIndex(index);
  hullGeo.computeVertexNormals();
  const wood = w.ink({ tint: "#6b5137", tone: 0.7, rim: 0.5 });
  wood.side = THREE.DoubleSide;
  g.add(new THREE.Mesh(hullGeo, wood));
  const dark = w.ink({ tint: "#3e2c1f", tone: 0.6, rim: 0.7 });
  for (const side of [-1, 1]) {
    const rail = new THREE.CatmullRomCurve3(Array.from({ length: N + 1 }, (_, i) => new THREE.Vector3(side * half(i / N), sheer(i / N), -L / 2 + (i / N) * L)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(rail, 40, 0.028, 6, false), dark);
    outline(m, w.line);
    g.add(m);
  }
  // The floorboards: a deck laid across the hull above the waterline, so the
  // boat reads dry inside (the open shell showed the sea through its bottom)
  // and the two men stand on wood, not in the swell.
  const deckRows = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const b = half(s);
    const bot = keel(s);
    const chine = bot + 0.07;
    let hw;
    if (DECK >= chine) hw = 0.78 * b + 0.22 * b * Math.min(1, (DECK - chine) / Math.max(1e-3, sheer(s) - chine));
    else if (DECK > bot) hw = 0.78 * b * ((DECK - bot) / 0.07);
    else continue;
    deckRows.push([s, Math.max(0, hw - 0.012)]);
  }
  const dv = [];
  const di = [];
  deckRows.forEach(([s, hw], k) => {
    const z = -L / 2 + s * L;
    dv.push(-hw, DECK, z, hw, DECK, z);
    if (k) di.push(2 * k - 2, 2 * k, 2 * k - 1, 2 * k - 1, 2 * k, 2 * k + 1);
  });
  const deckGeo = new THREE.BufferGeometry();
  deckGeo.setAttribute("position", new THREE.Float32BufferAttribute(dv, 3));
  deckGeo.setIndex(di);
  deckGeo.computeVertexNormals();
  const boards = w.ink({ tint: "#8a6a49", tone: 0.78, rim: 0.4 });
  boards.side = THREE.DoubleSide;
  g.add(new THREE.Mesh(deckGeo, boards));
  // Seams between the boards, fore and aft.
  const z0 = -L / 2 + deckRows[0][0] * L;
  const z1 = -L / 2 + deckRows[deckRows.length - 1][0] * L;
  for (const x of [-0.3, -0.1, 0.1, 0.3]) {
    const span = (z1 - z0) * (1 - Math.abs(x) * 0.9);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, span), dark);
    seam.position.set(x, DECK + 0.003, (z0 + z1) / 2 - Math.abs(x) * 0.3);
    g.add(seam);
  }
  for (const s of [0.35, 0.6]) {
    const thwart = new THREE.Mesh(new THREE.BoxGeometry(half(s) * 1.9, 0.04, 0.22), dark);
    thwart.position.set(0, sheer(s) - 0.12, -L / 2 + s * L);
    outline(thwart, w.line);
    g.add(thwart);
  }
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.07), dark);
  stem.position.set(0, sheer(1) + 0.08, L / 2 - 0.02);
  g.add(stem);
  // The ro: one long sculling oar, pivoting on the stern.
  const ro = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 4.3, 8), wood);
  shaft.geometry.translate(0, -2.15, 0);
  const roBlade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.8, 0.13), wood);
  roBlade.position.y = -3.9;
  ro.add(shaft, roBlade);
  outline(shaft, w.line);
  return { group: g, ro, L, floor: DECK, pivot: new THREE.Vector3(0.05, sheer(0) + 0.02, -L / 2 + 0.12) };
};

/** Distant shores across the strait: long low hills, sunk in the morning haze. */
const buildShores = (w) => {
  const g = new THREE.Group();
  const mat = w.ink({ tint: "#4a4054", tone: 0.55, rim: 0 });
  const SHORES = [
    [-70, -140, 55, 18, 9],
    [-130, -95, 40, 25, 14],
    [60, -150, 45, 15, 6],
    [125, -110, 50, 22, 11],
    [150, -20, 30, 40, 16],
    [-150, 20, 30, 50, 18],
  ];
  SHORES.forEach(([x, z, rx, rz, h], n) => {
    const geo = new THREE.SphereGeometry(1, 48, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i);
      const pz = p.getZ(i);
      p.setY(i, p.getY(i) * (0.7 + 0.3 * Math.sin(px * 5.1 + n) * Math.cos(pz * 3.7 - n) + 0.15 * Math.sin(px * 13 + pz * 7)));
    }
    geo.computeVertexNormals();
    const hill = new THREE.Mesh(geo, mat);
    hill.scale.set(rx, h, rz);
    hill.position.set(x, -0.5, z);
    g.add(hill);
  });
  return g;
};

/**
 * Period clothes over the painted body, skinned to its legs so they move with
 * it. Everything is built in the body's bind space, sizes in body heights.
 */
const clothFrame = (fig) => {
  let body = null;
  fig.model.traverse((o) => {
    if (o.isSkinnedMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count)) body = o;
  });
  if (!body) return null;
  body.geometry.computeBoundingBox();
  const { min, max } = body.geometry.boundingBox;
  const H = max.y - min.y;
  const bones = body.skeleton.bones;
  const id = (name) => Math.max(0, bones.findIndex((b) => b.name === name));
  fig.model.updateMatrixWorld(true);
  const local = (name) => body.worldToLocal(fig.model.getObjectByName(name).getWorldPosition(new THREE.Vector3()));
  const tl = local("thigh_l");
  const tr = local("thigh_r");
  // Which way the figure faces, in this space (the root faces +z at rest).
  const o = body.worldToLocal(new THREE.Vector3(0, 1, 0));
  const f = body.worldToLocal(new THREE.Vector3(0, 1, 1)).sub(o);
  return {
    body,
    min,
    H,
    cx: (min.x + max.x) / 2,
    cz: (min.z + max.z) / 2,
    side: Math.sign(tl.x - tr.x) || 1,
    front: Math.atan2(f.z, f.x),
    hipNy: (tl.y - min.y) / H,
    kneeNy: (local("calf_l").y - min.y) / H,
    legs: { l: [tl, local("foot_l")], r: [tr, local("foot_r")] },
    ids: { pelvis: id("pelvis"), tl: id("thigh_l"), cl: id("calf_l"), tr: id("thigh_r"), cr: id("calf_r") },
  };
};

/**
 * One skinned tube of cloth. `at(u, v)` gives a bind-space point (u round the
 * tube, v up it); the angle runs backward with u so the faces point out.
 * `weights(x, ny)` lists [weight, boneIndex] pairs.
 */
const clothTube = (F, w, { color, cols = 32, rows = 10, at, weights, tone = 0.85 }) => {
  const count = (cols + 1) * (rows + 1);
  const position = new Float32Array(count * 3);
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const index = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const i = r * (cols + 1) + c;
      const [x, y, z] = at(c / cols, r / rows);
      position.set([x, y, z], i * 3);
      const ws = weights(x, (y - F.min.y) / F.H)
        .sort((p, q) => q[0] - p[0])
        .slice(0, 4);
      const sum = ws.reduce((t, [wt]) => t + wt, 0) || 1;
      ws.forEach(([wt, bone], j) => {
        skinIndex[i * 4 + j] = bone;
        skinWeight[i * 4 + j] = wt / sum;
      });
      if (r < rows && c < cols) {
        const up = i + cols + 1;
        index.push(i, i + 1, up, i + 1, up + 1, up);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mat = w.ink({ tint: color, tone, rim: 1.2 });
  mat.side = THREE.DoubleSide;
  const { body } = F;
  const mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
  mesh.scale.copy(body.scale);
  body.parent.add(mesh);
  mesh.bind(body.skeleton, body.bindMatrix);
  mesh.frustumCulled = false;
  const shell = new THREE.SkinnedMesh(geo, w.line);
  shell.bind(body.skeleton, body.bindMatrix);
  shell.frustumCulled = false;
  mesh.add(shell);
};

/** A ring of cloth round the body's axis between two heights. */
const ring = (F, ny0, ny1, r0, r1, { depth = 0.8, pleats = 0, a0 = 0, a1 = Math.PI * 2 } = {}) => (u, v) => {
  const ang = F.front + a1 - u * (a1 - a0);
  const r = lerp(r0, r1, v) * F.H * (1 + pleats * (0.5 - 0.5 * Math.cos(ang * 14)));
  return [F.cx + Math.cos(ang) * r, F.min.y + lerp(ny0, ny1, v) * F.H, F.cz + Math.sin(ang) * r * depth];
};

/**
 * Hakama: wide pleated trousers, split at the crotch. A seat round the hips
 * on the pelvis, one wide pleated leg per thigh down to the ankle (a crease
 * where the two meet), and the obi above them.
 */
const addHakama = (fig, w, { color, obi }) => {
  const F = clothFrame(fig);
  if (!F) return;
  const { ids, hipNy, kneeNy, H } = F;
  const top = 0.567;
  clothTube(F, w, { color: obi, cols: 32, rows: 2, at: ring(F, 0.555, 0.615, 0.097, 0.095, { depth: 0.78 }), weights: () => [[1, ids.pelvis]], tone: 0.8 });
  clothTube(F, w, {
    color,
    at: ring(F, hipNy - 0.05, top, 0.112, 0.098, { depth: 0.8, pleats: 0.05 }),
    weights: (x, ny) => {
      const leg = smooth(hipNy + 0.01, hipNy - 0.05, ny) * 0.5;
      const left = smooth(-0.03 * H, 0.03 * H, (x - F.cx) * F.side);
      return [[1 - leg, ids.pelvis], [leg * left, ids.tl], [leg * (1 - left), ids.tr]];
    },
  });
  for (const s of ["l", "r"]) {
    const [hip, foot] = F.legs[s];
    const thigh = ids[`t${s}`];
    const calf = ids[`c${s}`];
    clothTube(F, w, {
      color,
      cols: 24,
      rows: 12,
      at: (u, v) => {
        const ny = lerp(0.07, hipNy + 0.03, v);
        // Down the leg from the hip joint to the ankle, pushed a little outward.
        const k = clamp01((ny - 0.07) / (hipNy - 0.07));
        const lx = F.cx + (lerp(foot.x, hip.x, k) - F.cx) * 1.2;
        const lz = lerp(foot.z, hip.z, k);
        const ang = F.front + Math.PI * 2 - u * Math.PI * 2;
        const r = lerp(0.078, 0.07, v) * H * (1 + 0.06 * (0.5 - 0.5 * Math.cos(ang * 10)));
        return [lx + Math.cos(ang) * r, F.min.y + ny * H, lz + Math.sin(ang) * r * 0.9];
      },
      weights: (x, ny) => {
        const leg = smooth(hipNy + 0.03, hipNy - 0.06, ny);
        const shin = smooth(kneeNy + 0.05, kneeNy - 0.05, ny);
        return [[1 - leg, ids.pelvis], [leg * (1 - shin), thigh], [leg * shin, calf]];
      },
    });
  }
};

/** A haori's skirt: hips to mid-thigh over the hakama, open down the front. */
const addHaoriHem = (fig, w, { color }) => {
  const F = clothFrame(fig);
  if (!F) return;
  const { ids, hipNy, H } = F;
  clothTube(F, w, {
    color,
    rows: 6,
    at: ring(F, 0.47, 0.63, 0.15, 0.118, { depth: 0.82, a0: 0.45, a1: Math.PI * 2 - 0.45 }),
    weights: (x, ny) => {
      const leg = smooth(0.62, hipNy - 0.06, ny);
      const left = smooth(-0.04 * H, 0.04 * H, (x - F.cx) * F.side);
      return [[1 - leg, ids.pelvis], [leg * left, ids.tl], [leg * (1 - left), ids.tr]];
    },
  });
};

// ── Grounding and grips ──────────────────────────────────────────────────────
const UPV = new THREE.Vector3(0, 1, 0);
const IDENT = new THREE.Quaternion();

/**
 * Per figure: the arm chains for reach(), each hand's handedness, the shoulder
 * frame, and the non-foot contacts (knees, hands, seat, chest, head) that keep
 * a kneeling or fallen body out of the sand once groundTo has planted the soles.
 */
const rigFigure = (fig) => {
  fig.apply({});
  fig.root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  fig.contacts = [["calf_l", 0.055], ["calf_r", 0.055], ["hand_l", 0.035], ["hand_r", 0.035], ["pelvis", 0.11], ["spine_03", 0.14]]
    .map(([name, r]) => {
      const b = fig.model.getObjectByName(name);
      return b && { b, r: r ?? b.getWorldPosition(v).y };
    })
    .filter(Boolean);
  if (fig.bones.head) {
    fig.contacts.push({ b: fig.bones.head, r: 0.1 });
    // The top and the middle of the skull, in the head bone's frame.
    const h = fig.bones.head.getWorldPosition(new THREE.Vector3());
    const tall = fig.root.getWorldScale(new THREE.Vector3()).x;
    fig.crown = fig.bones.head.worldToLocal(h.clone().add(new THREE.Vector3(0, 0.205 * tall, 0.01)));
    fig.skull = fig.bones.head.worldToLocal(h.clone().add(new THREE.Vector3(0, 0.1 * tall, 0.01)));
  }
  // Foot bones and their height over the sole plane at rest, for the slope check.
  fig.groundTo(0);
  fig.feet = ["foot_l", "foot_r", "ball_l", "ball_r"]
    .map((name) => fig.model.getObjectByName(name))
    .filter(Boolean)
    .map((b) => ({ b, r: b.getWorldPosition(v).y }));
  fig.root.position.set(0, 0, 0);
  const arm = (s) => {
    const hand = fig.model.getObjectByName(`hand_${s}`);
    const H = fig.handRig[s];
    // Which way the palm faces in the hand's grip socket: +1 or -1 along its x.
    const sign = H ? Math.sign(H.n.dot(new THREE.Vector3().crossVectors(H.w, H.u))) || 1 : 1;
    return {
      name: s === "l" ? "left" : "right",
      side: s === "l" ? 1 : -1,
      upper: fig.bones[`${s}Shoulder`],
      fore: fig.bones[`${s}Elbow`],
      hand,
      rest: hand.quaternion.clone(),
      axis: hand.position.clone().normalize(),
      // A sword grip: thumb toward the blade, fingers running on from the
      // forearm and round to the edge (the object's +z), so the palms face in.
      weapon: new THREE.Quaternion(),
      sign,
    };
  };
  fig.arms = { l: arm("l"), r: arm("r") };
  fig.frame = { o: new THREE.Vector3(), x: new THREE.Vector3(), z: new THREE.Vector3(), l: new THREE.Vector3(), r: new THREE.Vector3() };
};

const _g = new THREE.Vector3();
/**
 * Plant the soles on the ground, then lift if a knee, hand or the body is
 * lower. With `ground(x, z)` the sand's slope counts: groundTo plants the
 * lowest sole at `y` (the height under the root), then the feet are checked
 * against the sand under each of them, and the contacts likewise.
 */
const plant = (fig, y, ground = null) => {
  fig.groundTo(y);
  if (ground) {
    let flat = Infinity;
    let real = Infinity;
    for (const { b, r } of fig.feet) {
      b.getWorldPosition(_g);
      flat = Math.min(flat, _g.y - r - y);
      real = Math.min(real, _g.y - r - ground(_g.x, _g.z));
    }
    if (Number.isFinite(real)) fig.root.position.y += flat - real;
  }
  let low = Infinity;
  for (const { b, r } of fig.contacts) {
    b.getWorldPosition(_g);
    low = Math.min(low, _g.y - r - (ground ? ground(_g.x, _g.z) : y));
  }
  if (low < 0) fig.root.position.y -= low;
  fig.root.updateMatrixWorld(true);
};

/** The shoulder frame: between the shoulders, +x to the figure's left, +z the way the chest faces. */
const frameOf = (fig) => {
  const F = fig.frame;
  fig.arms.l.upper.getWorldPosition(F.l);
  fig.arms.r.upper.getWorldPosition(F.r);
  F.o.addVectors(F.l, F.r).multiplyScalar(0.5);
  F.x.subVectors(F.l, F.r).setY(0).normalize();
  F.z.crossVectors(F.x, UPV);
  return F;
};
const inFrame = (F, v, out) => out.copy(F.o).addScaledVector(F.x, v.x).addScaledVector(UPV, v.y).addScaledVector(F.z, v.z);
const dirInFrame = (F, v, out) => {
  const { x, y, z } = v;
  return out.set(0, 0, 0).addScaledVector(F.x, x).addScaledVector(UPV, y).addScaledVector(F.z, z).normalize();
};

const _bx = new THREE.Vector3();
const _bz = new THREE.Vector3();
const _bm = new THREE.Matrix4();
/** A frame whose +y runs along `y` and +z leans toward `zHint`. */
const basisQ = (q, y, zHint) => {
  _bz.copy(zHint).addScaledVector(y, -zHint.dot(y));
  if (_bz.lengthSq() < 1e-8) _bz.set(0, 0, 1).addScaledVector(y, -y.z);
  _bz.normalize();
  _bx.crossVectors(y, _bz);
  return q.setFromRotationMatrix(_bm.makeBasis(_bx, y, _bz));
};

const _ra = new THREE.Vector3();
const _rb = new THREE.Vector3();
const _rc = new THREE.Vector3();
const _rS = new THREE.Vector3();
const _rE = new THREE.Vector3();
const _rW = new THREE.Vector3();
const _rD = new THREE.Vector3();
const _rP = new THREE.Vector3();
const _rT = new THREE.Vector3();
const _rq = new THREE.Quaternion();
const _rq2 = new THREE.Quaternion();
const _rq3 = new THREE.Quaternion();
const _rq4 = new THREE.Quaternion();
const _rhq = new THREE.Quaternion();
const setWorldQ = (bone, q) => {
  bone.parent.getWorldQuaternion(_rq2).invert();
  bone.quaternion.copy(_rq2.multiply(q));
  bone.updateMatrixWorld(true);
};
/** Swing `bone` the shortest way so `child` lies toward `target`. */
const aimBone = (bone, child, target) => {
  bone.getWorldPosition(_ra);
  child.getWorldPosition(_rb);
  _rq.setFromUnitVectors(_rb.sub(_ra).normalize(), _rc.subVectors(target, _ra).normalize());
  bone.getWorldQuaternion(_rq3);
  setWorldQ(bone, _rq.multiply(_rq3));
};

/** Every frame, before reaching: hands back to their rest turn on the forearm. */
const resetHands = (fig) => {
  for (const A of Object.values(fig.arms)) A.hand.quaternion.copy(A.rest);
  fig.root.updateMatrixWorld(true);
};

/** The hand's roll about the forearm, away from rest (radians, signed). */
const wristTwist = (A) => {
  _rq.copy(A.hand.quaternion).multiply(_rq2.copy(A.rest).invert());
  const along = _rq.x * A.axis.x + _rq.y * A.axis.y + _rq.z * A.axis.z;
  const a = 2 * Math.atan2(along, _rq.w);
  return a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a;
};
const _ru = new THREE.Quaternion();
/** Upper arm from `from`, turned `th` about shoulder→elbow (_rT); forearm re-aimed, hand re-set. */
const turnUpper = (A, from, th) => {
  A.upper.quaternion.copy(from);
  A.upper.updateMatrixWorld(true);
  _ru.setFromAxisAngle(_rT, th);
  A.upper.getWorldQuaternion(_rq3);
  setWorldQ(A.upper, _ru.multiply(_rq3));
  aimBone(A.fore, A.hand, _rW);
  setWorldQ(A.hand, _rhq);
};
/** Elbow → wrist, in the world. */
const forearmDir = (A, out) => out.copy(A.hand.getWorldPosition(_ra)).sub(A.fore.getWorldPosition(_rb)).normalize();

/**
 * Two-bone IK: put the hand's grip socket at `pos` turned to `quat` (blended
 * from where the posed arm already has it by `w`). The elbow bends out and
 * down, or out and forward when the hands are high; half the wrist's roll is
 * handed to the forearm so the wrist does not wring. Returns the miss in metres.
 */
const reach = (fig, A, pos, quat, w = 1) => {
  if (w <= 0) return 0;
  const holder = fig.socket(A.name);
  if (w < 1) {
    holder.getWorldPosition(_rT).lerp(pos, w);
    holder.getWorldQuaternion(_rq4).slerp(quat, w);
    pos = _rT;
    quat = _rq4;
  }
  // The hand's turn, and where the wrist must be for the socket to land on `pos`.
  _rhq.copy(quat).multiply(_rq.copy(holder.quaternion).invert());
  A.hand.getWorldScale(_rc);
  _rW.copy(holder.position).multiplyScalar(_rc.x).applyQuaternion(_rhq);
  _rW.subVectors(pos, _rW);
  A.upper.getWorldPosition(_rS);
  A.fore.getWorldPosition(_rE);
  A.hand.getWorldPosition(_rb);
  const l1 = _rS.distanceTo(_rE);
  const l2 = _rE.distanceTo(_rb);
  _rD.subVectors(_rW, _rS);
  const want = _rD.length();
  const d = THREE.MathUtils.clamp(want, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999);
  _rD.normalize();
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const F = fig.frame;
  const raise = smooth(-0.25, 0.2, _rW.y - _rS.y) * (1 - (fig.low ?? 0));
  _rP.copy(F.x).multiplyScalar(A.side * 0.8).addScaledVector(UPV, -0.9 * (1 - raise)).addScaledVector(F.z, 0.35 * raise - 0.25 * (1 - raise));
  _rP.addScaledVector(_rD, -_rP.dot(_rD)).normalize();
  _rE.copy(_rS).addScaledVector(_rD, a).addScaledVector(_rP, h);
  _rW.copy(_rS).addScaledVector(_rD, d);
  aimBone(A.upper, A.fore, _rE);
  aimBone(A.fore, A.hand, _rW);
  setWorldQ(A.hand, _rhq);
  // A turned grip (thumbs back, say) needs more roll than a wrist has: share it
  // with the upper arm, turning it about shoulder→elbow, whichever way helps.
  const tau = wristTwist(A);
  if (Math.abs(tau) > 0.6) {
    _rT.subVectors(_rE, _rS).normalize();
    _rq4.copy(A.upper.quaternion);
    let best = Math.abs(tau);
    let bestTh = 0;
    for (const th of [0.45 * tau, -0.45 * tau]) {
      turnUpper(A, _rq4, th);
      const left = Math.abs(wristTwist(A));
      if (left < best) (best = left), (bestTh = th);
    }
    turnUpper(A, _rq4, bestTh);
  }
  // Split what is left of the wrist's roll between wrist and forearm.
  _rq.copy(A.hand.quaternion).multiply(_rq2.copy(A.rest).invert());
  const along = _rq.x * A.axis.x + _rq.y * A.axis.y + _rq.z * A.axis.z;
  _rq3.set(A.axis.x * along, A.axis.y * along, A.axis.z * along, _rq.w);
  if (_rq3.lengthSq() > 1e-8) {
    _rq3.normalize();
    if (_rq3.w < 0) _rq3.set(-_rq3.x, -_rq3.y, -_rq3.z, -_rq3.w);
    _rq3.slerpQuaternions(IDENT, _rq3, 0.5);
    A.fore.quaternion.multiply(_rq3);
    A.hand.quaternion.premultiply(_rq3.invert());
    A.fore.updateMatrixWorld(true);
  }
  return Math.max(0, want - d);
};

const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
/** Orient so local +y runs along `dir` and local +x leans toward `side`. */
const orient = (q, dir, side) => {
  _y.copy(dir).normalize();
  _x.copy(side).addScaledVector(_y, -side.dot(_y));
  if (_x.lengthSq() < 1e-6) _x.set(0, 1, 0).addScaledVector(_y, -_y.y);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
};

export const createGanryujimaScene = (stage, { overlay } = {}) => {
  const { camera, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  // Our own sky dome replaces the page: it has to sit still while the camera moves.
  w.backdrop.visible = false;

  // Sky and sea share the sky's uniforms, so the water reflects this dawn.
  const skyU = {
    uSun: { value: SUN.clone() },
    uSunColor: { value: new THREE.Color(1, 0.8, 0.55).multiplyScalar(3.2) },
    uZenith: { value: new THREE.Color("#3b4569") },
    uUpper: { value: new THREE.Color("#b37f8a") },
    uHorizon: { value: new THREE.Color("#f2a273") },
    uGlow: { value: new THREE.Color("#ffc48a") },
    uBelow: { value: new THREE.Color("#2a2c40") },
    uCloud: { value: new THREE.Color("#5b4a63") },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(170, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: skyU,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
      `,
      fragmentShader: /* glsl */ `
        ${SKY_GLSL}
        varying vec3 vW;
        void main() {
          vec3 col = skyColor(normalize(vW - cameraPosition), 1.0, 1.0);
          col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  sky.renderOrder = -2;
  sky.frustumCulled = false;
  scene.add(sky);

  // The sea: one plane, dense where the action is and stretched to the horizon.
  const SEA_R = 190;
  const seaGeo = new THREE.PlaneGeometry(2, 2, 200, 200);
  seaGeo.rotateX(-Math.PI / 2);
  const warp = (u) => Math.sign(u) * (Math.sinh(Math.abs(u) * 4) / Math.sinh(4)) * SEA_R;
  const sp = seaGeo.attributes.position;
  const seaDepth = new Float32Array(sp.count);
  for (let i = 0; i < sp.count; i++) {
    const x = warp(sp.getX(i));
    const z = warp(sp.getZ(i)) - 6;
    sp.setXYZ(i, x, 0, z);
    seaDepth[i] = -heightAt(x, z);
  }
  seaGeo.setAttribute("aDepth", new THREE.BufferAttribute(seaDepth, 1));
  seaGeo.computeBoundingSphere();
  const seaU = {
    ...skyU,
    uTime: { value: 0 },
    uTide: { value: 0 },
    uDeep: { value: new THREE.Color("#16263a") },
    uShallow: { value: new THREE.Color("#2a5560") },
    uSandBed: { value: new THREE.Color("#8b7356") },
    uFoam: { value: new THREE.Color("#efe4d4") },
  };
  const sea = new THREE.Mesh(
    seaGeo,
    new THREE.ShaderMaterial({
      uniforms: seaU,
      vertexShader: /* glsl */ `
        ${WAVES_GLSL}
        attribute float aDepth;
        varying vec3 vW;
        varying float vDepth;
        varying float vAmp;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vAmp = smoothstep(0.0, 1.4, aDepth);
          vec2 g;
          w.y += swell(w.xz, uTime, g) * vAmp + uTide;
          vW = w.xyz;
          vDepth = aDepth;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        ${WAVES_GLSL}
        ${SKY_GLSL}
        uniform vec3 uDeep, uShallow, uSandBed, uFoam;
        varying vec3 vW;
        varying float vDepth;
        varying float vAmp;
        void main() {
          vec2 g;
          float h = swell(vW.xz, uTime, g);
          g *= vAmp;
          // Fine chop: what the sun glitters on. Faded with distance so it never shimmers.
          float dist = length(cameraPosition - vW);
          float hc = 0.0;
          vec2 gc = vec2(0.0);
          wave(vW.xz, uTime, vec2(0.7071, 0.7071), 10.5, 0.004, hc, gc);
          wave(vW.xz, uTime, vec2(-0.6, 0.8), 15.7, 0.0026, hc, gc);
          wave(vW.xz, uTime, vec2(0.196, -0.98), 23.0, 0.0016, hc, gc);
          g += gc * (1.0 - smoothstep(20.0, 90.0, dist)) * (0.4 + vAmp * 0.6);
          vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
          vec3 V = normalize(cameraPosition - vW);
          float fres = 0.02 + 0.98 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
          vec3 R = reflect(-V, N);
          R.y = abs(R.y);
          float depth = vDepth + uTide + h * vAmp;
          vec3 body = mix(uShallow, uDeep, smoothstep(0.2, 3.0, depth));
          body = mix(uSandBed, body, smoothstep(0.0, 0.5, depth));
          vec3 col = mix(body, skyColor(R, 0.0, 1.0), clamp(fres, 0.0, 1.0));
          // The sun's road on the water.
          float sd = max(dot(R, uSun), 0.0);
          col += uSunColor * (pow(sd, 1500.0) * 0.45 + pow(sd, 160.0) * 0.07);
          // Surf: a broken line where water meets sand, swash lines behind it.
          float n1 = vnoise(vW.xz * 3.0 + vec2(uTime * 0.2, uTime * 0.35));
          float edge = 1.0 - smoothstep(0.0, 0.1 + 0.08 * n1, depth);
          float lines = smoothstep(0.7, 1.0, sin(depth * 30.0 - uTime * 2.2 + n1 * 4.0)) * (1.0 - smoothstep(0.05, 0.45, depth));
          float foam = clamp(edge + lines * 0.55, 0.0, 1.0) * smoothstep(0.25, 0.55, vnoise(vW.xz * 7.0 - uTime * 0.25) + 0.25);
          col = mix(col, uFoam * (0.55 + 0.35 * fres), foam * 0.85);
          // Far water sinks into the horizon.
          col = mix(col, skyColor(normalize(vec3(-V.x, 0.015, -V.z)), 0.0, 0.0), smoothstep(50.0, 185.0, dist) * 0.85);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }),
  );
  sea.frustumCulled = false;
  scene.add(sea);

  // The island: sand painted dry, damp and drowned by height.
  const landGeo = new THREE.PlaneGeometry(110, 70, 220, 140);
  landGeo.rotateX(-Math.PI / 2);
  landGeo.translate(0, 0, 18);
  const lp = landGeo.attributes.position;
  const landColors = new Float32Array(lp.count * 3);
  const dry = new THREE.Color("#c9ab84");
  const damp = new THREE.Color("#8a6f55");
  const drowned = new THREE.Color("#5f5244");
  const c = new THREE.Color();
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i);
    const z = lp.getZ(i);
    const y = heightAt(x, z);
    lp.setY(i, y);
    c.copy(drowned).lerp(damp, smooth(-0.6, 0, y)).lerp(dry, smooth(0.05, 0.3, y));
    c.multiplyScalar(0.95 + 0.1 * Math.sin(x * 0.9) * Math.sin(z * 1.3));
    landColors.set([c.r, c.g, c.b], i * 3);
  }
  landGeo.setAttribute("color", new THREE.BufferAttribute(landColors, 3));
  landGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(landGeo, w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.85, rim: 0.25 })));

  // A few dark rocks on the beach and in the shallows.
  const rockMat = w.ink({ tint: "#4a4340", tone: 0.5, rim: 0.5 });
  [
    [-6.5, -1.2, 0.9],
    [-7.6, 0.4, 0.5],
    [-5.4, -2.6, 0.35],
    [7.2, 1.0, 0.7],
    [8.6, -1.8, 1.3],
    [-11, -7, 1.6],
    [5.5, -9, 0.8],
    [12, 4, 1.0],
  ].forEach(([x, z, s], n) => {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const f = 0.75 + 0.35 * hash(Math.round(v.x * 3) * 7.1 + Math.round(v.y * 3) * 13.7 + Math.round(v.z * 3) * 29.3 + n);
      p.setXYZ(i, v.x * f, v.y * f * 0.55, v.z * f);
    }
    geo.computeVertexNormals();
    const rock = new THREE.Mesh(geo, rockMat);
    rock.scale.setScalar(s);
    rock.rotation.y = n * 1.7;
    rock.position.set(x, heightAt(x, z) - 0.15 * s, z);
    outline(rock, w.line);
    scene.add(rock);
  });
  scene.add(buildShores(w));

  // The boat, the swords, the scabbard.
  const boat = buildBoat(w);
  scene.add(boat.group, boat.ro);
  const nodachi = buildNodachi(w);
  const saya = buildSaya(w);
  const bokken = buildBokken(w);
  scene.add(nodachi.group, saya, bokken);

  // Spray, wake and kicked sand.
  const spray = createParticles({ count: 420, blending: "normal" });
  scene.add(spray.points);
  const burst = (at, n, color, speed, life = 0.9, size = 0.08, gravity = 4, up = 1.2) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      spray.emit({
        position: [at.x, at.y, at.z],
        velocity: [Math.cos(a) * v, up * (0.5 + Math.random()), Math.sin(a) * v],
        life: life * (0.7 + Math.random() * 0.5),
        size: size * (0.7 + Math.random() * 0.8),
        grow: 1.2,
        gravity,
        drag: 1.5,
        color,
        alpha: 0.7,
      });
    }
  };

  // Rings on the water where he steps in, and foam round his shins as he wades.
  const ringGeo = new THREE.RingGeometry(0.2, 0.3, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const rings = Array.from({ length: 4 }, () => {
    const mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: "#f3ece2", transparent: true, opacity: 0, depthWrite: false }));
    mesh.renderOrder = 5;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, t0: -10, size: 1 };
  });
  let nextRing = 0;
  const splashRing = (at, c0, size = 1) => {
    const r = rings[nextRing++ % rings.length];
    r.mesh.position.copy(at);
    r.t0 = c0;
    r.size = size;
  };
  const collar = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.36, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#efe6da", transparent: true, opacity: 0.5, depthWrite: false }));
  collar.renderOrder = 5;
  scene.add(collar);

  // Long morning shadows, thrown back from the sun toward the lens.
  const shadowTex = canvasTexture(
    64,
    64,
    (ctx, cw) => {
      const g = ctx.createRadialGradient(cw / 2, cw / 2, 0, cw / 2, cw / 2, cw / 2);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.6, "rgba(255,255,255,0.45)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, cw);
    },
    { color: false },
  );
  const shadowGeo = new THREE.PlaneGeometry(1, 1);
  shadowGeo.translate(0, 0.42, 0);
  const SHADOW_YAW = Math.atan2(SUN.x, SUN.z);
  const shadows = [0, 1].map(() => {
    const mesh = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: "#1a1020", map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false }));
    mesh.rotation.order = "YXZ";
    mesh.scale.set(0.75, 2.2, 1);
    mesh.renderOrder = 4;
    scene.add(mesh);
    return mesh;
  });
  const castShadow = (mesh, x, z) => {
    // Along the ground away from the sun, tilted with the slope of the sand.
    const sx = -Math.sin(SHADOW_YAW) * 2.2;
    const sz = -Math.cos(SHADOW_YAW) * 2.2;
    const h0 = heightAt(x, z);
    mesh.position.set(x, h0 + 0.02, z);
    mesh.rotation.set(-Math.PI / 2 + Math.atan2(heightAt(x + sx, z + sz) - h0, 2.2), SHADOW_YAW, 0);
  };

  let musashi = null;
  let kojiro = null;
  let boatman = null;
  const band = new THREE.Group();
  const cloth = w.ink({ tint: "#e8dfcf", tone: 1.0, rim: 0.5 });
  cloth.side = THREE.DoubleSide;

  // The cut headband: a loose strip of cloth that flutters down onto the sand.
  const RIB_N = 24;
  const RIB_L = 0.62;
  const RIB_W = 0.034;
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(RIB_L, RIB_W, RIB_N, 1), cloth);
  ribbon.frustumCulled = false;
  ribbon.visible = false;
  outline(ribbon, w.line);
  scene.add(ribbon);
  const ribbonFrom = new THREE.Vector3();
  const rib = { c: new THREE.Vector3(), a: new THREE.Vector3(), wd: new THREE.Vector3(), p: new THREE.Vector3(), q: new THREE.Vector3() };
  const flutter = (u) => {
    const groundY = heightAt(ribbonFrom.x - 0.2 * u, ribbonFrom.z - 0.3 * u) + 0.012;
    let cy = ribbonFrom.y + 0.32 * (1 - Math.exp(-4 * u)) - 0.5 * u;
    const rest = smooth(groundY + 0.3, groundY, cy);
    cy = Math.max(cy, groundY);
    rib.c.set(ribbonFrom.x - 0.22 * u + 0.1 * Math.sin(2.3 * u), cy, ribbonFrom.z - 0.3 * u);
    const th = 0.7 + 1.4 * u * (1 - 0.6 * rest);
    rib.a.set(Math.cos(th), 0.35 * Math.sin(3 * u) * (1 - rest), Math.sin(th)).normalize();
    rib.wd.crossVectors(rib.a, UPV).normalize();
    const pos = ribbon.geometry.attributes.position;
    for (let i = 0; i <= RIB_N; i++) {
      const v = i / RIB_N - 0.5;
      const wave = 0.06 * Math.sin(10 * v - 8 * u) * (1 - rest);
      const roll = 0.9 * Math.sin(7 * v - 6 * u) * (1 - rest);
      rib.p.copy(rib.c).addScaledVector(rib.a, v * RIB_L).addScaledVector(UPV, wave);
      rib.q.copy(rib.wd).multiplyScalar(Math.cos(roll)).addScaledVector(UPV, Math.sin(roll));
      for (const [row, sgn] of [
        [0, 1],
        [1, -1],
      ]) {
        _g.copy(rib.p).addScaledVector(rib.q, (sgn * RIB_W) / 2);
        _g.y = Math.max(_g.y, groundY - 0.004);
        pos.setXYZ(row * (RIB_N + 1) + i, _g.x, _g.y, _g.z);
      }
    }
    pos.needsUpdate = true;
    ribbon.geometry.computeVertexNormals();
    ribbon.geometry.computeBoundingSphere();
  };

  // The scabbard's grip in the left hand: thumb toward the hilt, fingers along its +z.
  const SAYA_M = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
  const holdSaya = () => kojiro.hold(saya, { hand: "left", radius: 0.016, offset: new THREE.Vector3(0, 0.06, 0), rotation: SAYA_M.clone().invert() });
  const holdNodachi = () => kojiro.hold(nodachi.group, { hand: "right", radius: 0.017, offset: new THREE.Vector3(0, 0.13, 0), rotation: kojiro.arms.r.weapon.clone().invert() });

  const ready = Promise.all([
    // Musashi: a worn dark kimono and hakama, sleeves tied back, barefoot.
    createModelFigure({
      height: 1.82,
      hair: ["HairLong", "EyebrowsRegular"],
      line: w.line,
      ink: { tone: 0.85, rim: 1.5 },
      hands: "relaxed",
      outfit: { skin: "#c08d68", top: "#34302e", collar: "#6d665c", bottom: "#2b2724", belt: "#7a6448", shoes: "#9a7458", hair: "#141213", sleeves: "rolled" },
    }),
    // Kojirō: a crimson haori open over a white kimono, pale hakama, white tabi.
    createModelFigure({
      height: 1.74,
      hair: ["HairSimpleParted", "EyebrowsRegular"],
      line: w.line,
      ink: { tone: 0.85, rim: 1.5 },
      hands: "relaxed",
      outfit: { skin: "#e2b896", top: "#a3182a", collar: "#f0ece4", tie: "#f0ece4", belt: "#2a2433", bottom: "#8d8496", shoes: "#ece8de", hair: "#1a1514", sleeves: "long" },
    }),
    // The boatman: indigo work clothes, short trousers.
    createModelFigure({
      height: 1.62,
      hair: ["HairBuzzed"],
      line: w.line,
      ink: { tone: 0.85, rim: 1.4 },
      hands: "relaxed",
      outfit: { skin: "#b9845e", top: "#2c3a56", bottom: "#2c3a56", shoes: "#6b5236", hair: "#1a1716", sleeves: "short", skirt: 0.22 },
    }),
  ]).then(([m, k, b]) => {
    musashi = m;
    kojiro = k;
    boatman = b;
    [m, k, b].forEach(rigFigure);
    addHakama(m, w, { color: "#2b2724", obi: "#7a6448" });
    addHakama(k, w, { color: "#8d8496", obi: "#2a2433" });
    addHaoriHem(k, w, { color: "#a3182a" });

    // Musashi's headband, tied round the brow: Kojirō's cut will take it.
    m.apply({});
    m.root.updateMatrixWorld(true);
    let body = null;
    m.model.traverse((o) => {
      if (o.isSkinnedMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count)) body = o;
    });
    body.geometry.computeBoundingBox();
    const bb = body.geometry.boundingBox;
    const crown = body.localToWorld(new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2));
    const headAt = m.bones.head.getWorldPosition(new THREE.Vector3());
    const ringGeo = new THREE.TorusGeometry(0.1, 0.012, 6, 28);
    ringGeo.rotateX(Math.PI / 2);
    ringGeo.scale(0.98, 1, 1.12);
    const brow = new THREE.Mesh(ringGeo, cloth);
    band.add(brow);
    for (const s of [-1, 1]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.006), cloth);
      tail.geometry.translate(0, -0.08, 0);
      tail.position.set(s * 0.025, 0, -0.11);
      tail.rotation.set(0.5, 0, s * 0.15);
      band.add(tail);
    }
    outline(brow, w.line);
    band.position.set(headAt.x, crown.y - 0.075, headAt.z + 0.012);
    scene.add(band);
    m.bones.head.attach(band);

    // Weapons in hand. The bokken never leaves Musashi's right hand.
    m.hold(bokken, { hand: "right", radius: 0.025, rotation: m.arms.r.weapon.clone().invert() });
    holdSaya();
    b.setHands("grip", 1, { radius: 0.022 });

    [m, k, b].forEach((f) => {
      scene.add(f.root);
      w.register(f.root);
    });
    w.palette(PAL);
    w.light(...KEY);
    w.inks.forEach((mat) => {
      mat.uniforms.uFog.value.set(HAZE);
      mat.uniforms.uFogRange.value.set(25, 160);
    });
    w.sync();
    // Reduced motion drew its one frame before anyone had loaded.
    stage.invalidate();
    return { musashi: m, kojiro: k, boatman: b };
  });

  // Palette for the set until the cast arrives.
  w.palette(PAL);
  w.light(...KEY);
  w.inks.forEach((mat) => {
    mat.uniforms.uFog.value.set(HAZE);
    mat.uniforms.uFogRange.value.set(25, 160);
  });

  const cuts = createCuts(overlay);
  const unsubscribeResize = stage.onResize(() => {
    spray.resize(stage.size.height, camera.fov, stage.renderer.getPixelRatio());
    w.sync();
  });

  // Scratch.
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const side = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const camP = new THREE.Vector3();
  const camL = new THREE.Vector3();
  const boatEuler = new THREE.Euler(0, 0, 0, "YXZ");
  const kv = new THREE.Vector3();
  const kv2 = new THREE.Vector3();
  const aimM = new THREE.Vector3();
  const aimK = new THREE.Vector3();
  const skullK = new THREE.Vector3();
  const sayaLocal = new THREE.Vector3();
  const sheathed = new THREE.Vector3(0, -0.217, 0);
  const W = { grip: new THREE.Vector3(), dir: new THREE.Vector3(), palm: new THREE.Vector3(), q: new THREE.Quaternion(), two: 0, low: 0, keyed: false };
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const BOKKEN_LEFT = new THREE.Vector3(0, -0.19, 0);
  const NODACHI_LEFT = new THREE.Vector3(0, -0.13, 0);
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const D_WADE = dist(M_IN, M_STOP);
  const D_STALK = dist(M_STOP, M_SET);
  const D_CREEP = dist(M_SET, M_JUMP);
  const D_BACK = dist(M_LAND, M_BACK);
  const D_DOWN = dist(K_START, K_EDGE);
  const D_GIVE = dist(K_EDGE, K_SET);

  /** The sword's place this instant: keyed in the shoulder frame, then turned onto `aimAt`. */
  const wieldAt = (keys, s, F, aimAt) => {
    const { a, b, k } = keyAt(keys, s);
    inFrame(F, pa.fromArray(a.grip).lerp(pb.fromArray(b.grip), k), W.grip);
    dirInFrame(F, pa.fromArray(a.dir).lerp(pb.fromArray(b.dir), k), W.dir);
    // The edge: keyed, or away from the chest and a little down (two-handed),
    // or on from the right shoulder (one-handed; see wield's second pass).
    const two = lerp(a.two ?? 0, b.two ?? 0, k);
    v3.subVectors(W.grip, v1.lerpVectors(F.r, F.o, two)).normalize();
    v3.y -= 0.6 * two;
    v3.normalize();
    if (a.palm) dirInFrame(F, pa.fromArray(a.palm), pa);
    else pa.copy(v3);
    if (b.palm) dirInFrame(F, pb.fromArray(b.palm), pb);
    else pb.copy(v3);
    W.palm.lerpVectors(pa, pb, k);
    const aim = lerp(a.aim ?? 0, b.aim ?? 0, k);
    if (aim > 0 && aimAt) W.dir.lerp(v3.subVectors(aimAt, W.grip).normalize(), aim).normalize();
    W.low = lerp(a.low ?? 0, b.low ?? 0, k);
    W.two = two;
    W.keyed = !!(a.palm || b.palm);
    basisQ(W.q, W.dir, W.palm);
    return W;
  };
  /**
   * Both hands onto the sword at W. Without a keyed edge, a second pass rolls
   * the sword so the fingers run on from the forearms, wrists near straight.
   */
  const wield = (fig, weapon, local, radius) => {
    const A = fig.arms;
    fig.low = W.low;
    let missed = reach(fig, A.r, W.grip, q1.copy(W.q).multiply(A.r.weapon));
    if (local) secondHand(fig, weapon, local, W.two, radius);
    if (!W.keyed) {
      // Toward the forearms' own line where it is well defined (not when they
      // run along the blade, arms out straight behind the point).
      forearmDir(A.r, kv);
      if (W.two > 0) kv.addScaledVector(forearmDir(A.l, kv2), W.two);
      kv.addScaledVector(W.dir, -kv.dot(W.dir));
      const sure = W.two < 0.5 ? 1 : smooth(0.3, 0.7, kv.length() / (1 + W.two));
      kv.normalize().lerp(W.palm, 1 - sure);
      basisQ(W.q, W.dir, kv);
      missed = reach(fig, A.r, W.grip, q1.copy(W.q).multiply(A.r.weapon));
      if (local) secondHand(fig, weapon, local, W.two, radius);
    }
    return missed;
  };
  /** The second hand onto the handle of what the first hand holds. */
  const secondHand = (fig, weapon, local, two, radius) => {
    fig.setHand("left", "grip", clamp01(two * 1.4), { radius });
    if (two <= 0) return 0;
    weapon.updateMatrixWorld(true);
    weapon.localToWorld(v1.copy(local));
    weapon.getWorldQuaternion(q1).multiply(fig.arms.l.weapon);
    return reach(fig, fig.arms.l, v1, q1, two);
  };

  /** How far the oar's blade passes from a point. */
  const clearance = (weapon, at) => {
    weapon.updateMatrixWorld(true);
    weapon.localToWorld(pa.set(0, 0.1, 0));
    weapon.localToWorld(pb.set(0, 1.06, 0));
    pb.sub(pa);
    const u = clamp01(v3.subVectors(at, pa).dot(pb) / pb.lengthSq());
    return pa.addScaledVector(pb, u).distanceTo(at);
  };

  // What a hand let go of, where it was: the throw and the drop start there.
  const flight = {
    saya: { p: new THREE.Vector3(), q: new THREE.Quaternion(), ok: false },
    sword: { p: new THREE.Vector3(), q: new THREE.Quaternion(), ok: false },
  };
  let prevS = -1;
  let prevStep = 0;
  let sNow = 0;
  const crossed = (t) => !staticMode && prevS >= 0 && prevS < t && t <= sNow;
  const miss = { m: 0, k: 0, b: 0, s: 0 };

  const boatAt = (s) => {
    const u = segment(s, 0, 4.6);
    const k = Math.sin((u * Math.PI) / 2);
    return { x: lerp(2.2, 1.0, k), z: lerp(-12.5, -4.0, k), speed: u < 1 ? (Math.cos((u * Math.PI) / 2) * Math.PI * 8.58) / (2 * 4.6) : 0 };
  };

  /** A new take: everything back where it starts. */
  const reset = () => {
    flight.saya.ok = flight.sword.ok = false;
    band.visible = true;
    ribbon.visible = false;
    if (kojiro) {
      if (nodachi.group.parent !== scene) kojiro.release("right", { to: scene });
      if (saya.parent === scene) holdSaya();
    }
    spray.step(10);
    rings.forEach((r) => (r.t0 = -10));
    prevS = -1;
  };

  const update = (time, dt) => {
    const c = staticMode ? 0 : ((time % LOOP) + LOOP) % LOOP;
    const s = staticMode ? STATIC_TIME : storyAt(c);
    const t = staticMode ? STATIC_TIME : Math.floor(time / LOOP) * S_LOOP + s;
    const rate = staticMode ? 1 : rateAt(s);
    const slow = (1 - rate) / (1 - SLOW_RATE);
    sNow = s;
    miss.s = s;
    if (s < prevS) reset();

    // Camera: hard cuts between dollies.
    const { shot, u } = shotAt(s);
    camP.fromArray(shot.p0).lerp(v1.fromArray(shot.p1), u);
    camL.fromArray(shot.l0).lerp(v1.fromArray(shot.l1), u);
    camP.x += pointer.x * 0.25;
    camP.y += pointer.y * 0.08;
    const shake = staticMode || s < IMPACT ? 0 : 0.03 * Math.exp(-(s - IMPACT) * 9);
    camP.x += Math.sin(t * 97) * shake;
    camP.y += Math.sin(t * 83) * shake;
    camera.position.copy(camP);
    camera.lookAt(camL);
    sky.position.copy(camera.position);

    // Water.
    seaU.uTime.value = t;
    const tide = tideAt(t);
    seaU.uTide.value = tide;
    const waterAt = (x, z) => swellAt(x, z, t) * ampAt(-heightAt(x, z)) + tide;

    // The boat rides the swell, settling as the water shoals.
    const bp = boatAt(s);
    const yaw = -0.14;
    const fwd = v1.set(Math.sin(yaw), 0, Math.cos(yaw));
    const hb = waterAt(bp.x + fwd.x * 2.4, bp.z + fwd.z * 2.4);
    const hs = waterAt(bp.x - fwd.x * 2.4, bp.z - fwd.z * 2.4);
    const hl = waterAt(bp.x + fwd.z * 0.6, bp.z - fwd.x * 0.6);
    const hr = waterAt(bp.x - fwd.z * 0.6, bp.z + fwd.x * 0.6);
    boat.group.position.set(bp.x, (hb + hs + hl + hr) / 4 - 0.16, bp.z);
    boatEuler.set(-Math.atan2(hb - hs, 4.8), yaw, Math.atan2(hl - hr, 1.2) * 0.6 + Math.sin(t * 1.3) * 0.015);
    boat.group.quaternion.setFromEuler(boatEuler);
    boat.group.updateMatrixWorld(true);
    if (!staticMode && bp.speed > 0.3) {
      // Wake: foam peeling off the bow and the stern.
      const n = Math.random() < dt * rate * 40 * Math.min(1, bp.speed / 2) ? 1 : 0;
      for (let i = 0; i < n; i++) {
        for (const [lx, lz, out] of [
          [-0.45, 2.1, -1],
          [0.45, 2.1, 1],
          [0, -2.7, 0],
        ]) {
          boat.group.localToWorld(v2.set(lx, 0, lz));
          spray.emit({
            position: [v2.x, tide + 0.03, v2.z],
            velocity: [out * 0.5 * Math.cos(yaw), 0, -out * 0.5 * Math.sin(yaw) - 0.3],
            life: 1.8,
            size: 0.3,
            grow: 1.5,
            color: "#f1e8dc",
            alpha: 0.35,
          });
        }
      }
    }

    if (musashi) {
      // ── The boatman: sculls until the keel touches, then rests on the ro.
      const scull = 1 - segment(s, 4.0, 4.8);
      const ph = t * 3.4;
      const sway = Math.sin(ph) * scull;
      const bpose = blendPose(B_SCULL, B_SCULL, 0);
      bpose.spine = [0.22 + sway * 0.1 - (1 - scull) * 0.08, Math.cos(ph) * 0.12 * scull, 0];
      boatman.apply(bpose);
      resetHands(boatman);
      boat.group.localToWorld(v2.set(-0.12, boat.floor, -1.95));
      boatman.root.position.set(v2.x, 0, v2.z);
      boatman.root.rotation.set(0, yaw + Math.PI / 2, 0);
      plant(boatman, v2.y);
      frameOf(boatman);
      // The ro: its loom swings across in front of him, pivoting on the stern.
      boat.group.localToWorld(kv.set(0.2 + 0.24 * sway, 1.0 + 0.05 * Math.cos(ph) * scull, -1.72));
      boat.group.localToWorld(v2.copy(boat.pivot));
      dir.subVectors(kv, v2).normalize();
      boat.ro.position.copy(kv);
      orient(boat.ro.quaternion, dir, side.set(Math.cos(yaw), 0, -Math.sin(yaw)));
      for (const [A, along] of [
        [boatman.arms.r, 0.08],
        [boatman.arms.l, 0.45],
      ]) {
        kv2.copy(kv).addScaledVector(dir, -along);
        basisQ(q1, dir, v3.subVectors(kv2, boatman.frame.o));
        reach(boatman, A, kv2, q1.multiply(A.weapon));
      }

      // ── Where the two of them are (story time is all it takes).
      let kx = K_START[0];
      let kz = K_START[1];
      let kWalk = 0;
      let kAmt = 0;
      if (s >= 5.4 && s < 7.9) {
        const e = cruise(segment(s, 5.4, 7.9));
        kx = lerp(K_START[0], K_EDGE[0], e);
        kz = lerp(K_START[1], K_EDGE[1], e);
        kWalk = D_DOWN * e;
        kAmt = segment(s, 5.4, 5.7) * (1 - segment(s, 7.6, 7.9));
      } else if (s >= 7.9 && s < 10.8) {
        [kx, kz] = K_EDGE;
        kWalk = D_DOWN;
      } else if (s >= 10.8 && s < 13.0) {
        const e = cruise(segment(s, 10.8, 13.0));
        kx = lerp(K_EDGE[0], K_SET[0], e) - 0.35 * Math.sin(Math.PI * e);
        kz = lerp(K_EDGE[1], K_SET[1], e);
        kWalk = D_DOWN + D_GIVE * e;
        kAmt = 0.4 * segment(s, 10.8, 11.1) * (1 - segment(s, 12.7, 13.0));
      } else if (s >= 13.0 && s < 13.62) {
        const e = easeInOutCubic(segment(s, 13.0, 13.58));
        kx = lerp(K_SET[0], K_CUTAT[0], e);
        kz = lerp(K_SET[1], K_CUTAT[1], e);
        kWalk = D_DOWN + D_GIVE + (K_SET[1] - kz);
        kAmt = 0.35 * (1 - segment(s, 13.35, 13.5));
      } else if (s >= 13.62 && s < IMPACT) {
        const e = easeInOutCubic(segment(s, 13.62, 13.82));
        kx = lerp(K_CUTAT[0], K_FIGHT[0], e);
        kz = lerp(K_CUTAT[1], K_FIGHT[1], e);
      } else if (s >= IMPACT) {
        const e = easeOutCubic(segment(s, IMPACT, 14.5));
        kx = lerp(K_FIGHT[0], K_KNEEL[0], e);
        kz = lerp(K_FIGHT[1], K_KNEEL[1], e);
      }

      let mx;
      let mz;
      let mGround;
      let lift = 0;
      let walk = 0;
      let mAmt = 0;
      boat.group.localToWorld(v2.set(0, boat.floor + 0.013, 1.5));
      if (s < 4.6) [mx, mz, mGround] = [v2.x, v2.z, v2.y];
      else if (s < 5.3) {
        const e = easeInOutCubic(segment(s, 4.6, 5.3));
        mx = lerp(v2.x, M_IN[0], e);
        mz = lerp(v2.z, M_IN[1], e);
        mGround = lerp(v2.y, heightAt(M_IN[0], M_IN[1]), e);
        lift = 0.42 * Math.sin(Math.PI * e);
      } else if (s < 8.3) {
        const e = cruise(segment(s, 5.3, 8.3));
        mx = lerp(M_IN[0], M_STOP[0], e);
        mz = lerp(M_IN[1], M_STOP[1], e);
        walk = D_WADE * e;
        mAmt = segment(s, 5.3, 5.6) * (1 - segment(s, 8.0, 8.3));
      } else if (s < 10.8) {
        [mx, mz] = M_STOP;
        walk = D_WADE;
      } else if (s < 13.0) {
        const e = cruise(segment(s, 10.8, 13.0));
        mx = lerp(M_STOP[0], M_SET[0], e) + 0.35 * Math.sin(Math.PI * e);
        mz = lerp(M_STOP[1], M_SET[1], e);
        walk = D_WADE + D_STALK * e;
        mAmt = 0.45 * segment(s, 10.8, 11.1) * (1 - segment(s, 12.7, 13.0));
      } else if (s < 13.62) {
        const e = easeInOutCubic(segment(s, 13.0, 13.6));
        mx = lerp(M_SET[0], M_JUMP[0], e);
        mz = lerp(M_SET[1], M_JUMP[1], e);
        walk = D_WADE + D_STALK + D_CREEP * e;
        mAmt = 0.35 * (1 - segment(s, 13.4, 13.55));
      } else if (s < 17.7) {
        const e = segment(s, 13.62, 13.88);
        mx = lerp(M_JUMP[0], M_LAND[0], easeOutCubic(e));
        mz = lerp(M_JUMP[1], M_LAND[1], easeOutCubic(e));
        lift = 0.18 * Math.sin(Math.PI * e);
      } else {
        const e = cruise(segment(s, 17.7, 21.6));
        mx = lerp(M_LAND[0], M_BACK[0], e);
        mz = lerp(M_LAND[1], M_BACK[1], e);
        walk = D_BACK * e;
        mAmt = segment(s, 17.7, 18.0) * (1 - segment(s, 21.3, 21.6));
      }
      if (s >= 4.6) mGround = s < 5.3 ? mGround : heightAt(mx, mz);
      const toK = Math.atan2(kx - mx, kz - mz);
      let face = s < 4.6 ? yaw : angleTo(yaw, toK, easeInOutCubic(segment(s, 4.6, 5.3)));
      if (s >= 17.45) face = angleTo(toK, Math.atan2(M_BACK[0] - M_LAND[0], M_BACK[1] - M_LAND[1]), easeInOutCubic(segment(s, 17.45, 17.95)));

      // ── Kojirō's body.
      const kFace = Math.atan2(mx - kx, mz - kz);
      const kPose = gait(poseAt(K_KEYS, s), (kWalk / 0.7) * Math.PI, kAmt, 0.5);
      if (s < 4.85) kPose.spine = [kPose.spine[0] + Math.sin(t * 1.5) * 0.012, kPose.spine[1], kPose.spine[2]];
      kojiro.apply(kPose);
      resetHands(kojiro);
      kojiro.root.position.set(kx, 0, kz);
      // As he goes down he twists toward the way he falls, away from Musashi's feet.
      const after = Math.atan2(M_LAND[0] - K_KNEEL[0], M_LAND[1] - K_KNEEL[1]);
      const twist = easeInOutCubic(segment(s, 14.7, 15.2));
      kojiro.root.rotation.set(0, s < IMPACT ? kFace : angleTo(after, FALL_YAW, twist), 0);
      const fall = easeInCubic(segment(s, ...FALL)) + (s > FALL[1] ? Math.sin(segment(s, FALL[1], FALL[1] + 0.4) * Math.PI) * 0.03 : 0);
      if (fall > 0) {
        kojiro.root.position.addScaledVector(FALL_DIR, fall * 0.3);
        kojiro.root.rotateOnWorldAxis(FALL_AXIS, fall * 1.57);
      }
      kojiro.root.updateMatrixWorld(true);
      plant(kojiro, heightAt(kojiro.root.position.x, kojiro.root.position.z), heightAt);
      frameOf(kojiro);
      castShadow(shadows[1], kojiro.root.position.x, kojiro.root.position.z);
      if (crossed(14.45)) burst(v2.set(kx, heightAt(kx, kz), kz), 16, "#cdb08a", 0.8, 0.8, 0.12, 2);
      if (crossed(FALL[1])) burst(v2.copy(kojiro.root.position).addScaledVector(FALL_DIR, 0.9), 30, "#cdb08a", 1.2, 1.0, 0.14, 2);

      // ── Musashi's body.
      const wading = s >= 5.2 && heightAt(mx, mz) < tide - 0.03;
      const phase = (walk / 0.72) * Math.PI;
      const mPose = gait(poseAt(M_KEYS, s), phase, mAmt, wading ? 0.95 : 0.6, s > 17.7);
      // "You have already lost": a small lift of the chin as he says it.
      const hd = mPose.head ?? [0, 0, 0];
      mPose.head = [hd[0] - 0.1 * Math.sin(Math.PI * segment(s, 9.8, 10.6)), hd[1], hd[2]];
      musashi.apply(mPose);
      resetHands(musashi);
      musashi.root.position.set(mx, 0, mz);
      musashi.root.rotation.set(0, face, 0);
      musashi.root.updateMatrixWorld(true);
      plant(musashi, mGround + lift, s >= 5.3 ? (x, z) => heightAt(x, z) + lift : null);
      frameOf(musashi);
      castShadow(shadows[0], mx, mz);
      // A splash where he steps into the surf, and at every footfall in the water.
      if (crossed(5.2)) {
        burst(v2.set(mx, tide, mz), 36, "#f3ece2", 1.6, 0.9, 0.09, 6, 1.6);
        splashRing(v2.set(mx, tide + 0.01, mz), s, 1.4);
      }
      const stepIdx = Math.floor(phase / Math.PI);
      if (!staticMode && wading && mAmt > 0.5 && stepIdx !== prevStep) {
        burst(v2.set(mx, tide, mz), 9, "#efe6da", 0.9, 0.7, 0.07, 6, 1.1);
        splashRing(v2.set(mx, tide + 0.01, mz), s, 0.7);
      }
      prevStep = stepIdx;
      if (crossed(13.88)) burst(v2.set(M_LAND[0], heightAt(M_LAND[0], M_LAND[1]), M_LAND[1]), 22, "#cdb08a", 1.0, 0.9, 0.12, 2);
      const shin = clamp01((tide - heightAt(mx, mz)) / 0.1) * (s >= 5.15 ? 1 : 0);
      collar.visible = shin > 0;
      collar.position.set(mx, waterAt(mx, mz) + 0.012, mz);
      collar.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
      collar.material.opacity = 0.5 * shin;

      // Musashi's sword: the oar-sword in the right hand, the left joining it to fight.
      kojiro.bones.head.localToWorld(aimM.copy(kojiro.crown));
      aimM.y += 0.03;
      wieldAt(M_SWORD, s, musashi.frame, aimM);
      miss.m = wield(musashi, bokken, BOKKEN_LEFT, 0.025);
      // After the blow the oar rests on him, never in him: lift it clear of the skull.
      kojiro.bones.head.localToWorld(skullK.copy(kojiro.skull));
      for (let i = 0; i < 24 && s > IMPACT - 0.02 && s < 15.6 && clearance(bokken, skullK) < 0.125; i++) {
        W.dir.y += 0.02;
        W.dir.normalize();
        basisQ(W.q, W.dir, W.palm);
        miss.m = wield(musashi, bokken, BOKKEN_LEFT, 0.025);
      }

      // ── Kojirō's hands: the scabbard, the draw, the throw, the swallow cut.
      const A = kojiro.arms;
      const slide = easeInOutCubic(segment(s, ...DRAW));
      if (s >= FLING[0] && saya.parent !== scene) {
        // The throw: let go, keeping where the hand had it.
        kojiro.release("left", { to: scene });
        saya.localToWorld(flight.saya.p.set(0, 0.5, 0));
        flight.saya.q.copy(saya.quaternion);
        flight.saya.ok = !staticMode;
      }
      if (saya.parent !== scene) {
        const leftW = 1 - segment(s, 8.45, 8.56);
        if (leftW > 0) {
          inFrame(kojiro.frame, pa.fromArray(SAYA_GRIP).addScaledVector(pb.fromArray(SAYA_DIR), SAYA_PULL * slide), v2);
          dirInFrame(kojiro.frame, pb.fromArray(SAYA_DIR), dir);
          basisQ(q2, dir, v3.subVectors(v2, kojiro.frame.l));
          reach(kojiro, A.l, v2, q1.copy(q2).multiply(SAYA_M), leftW);
          basisQ(q2, dir, forearmDir(A.l, v3));
          miss.k = reach(kojiro, A.l, v2, q1.copy(q2).multiply(SAYA_M), leftW);
        }
      } else {
        // Thrown: an arc end over end into the shallows, then afloat on the swell.
        const e = segment(s, ...FLING);
        const restDir = v1.set(0.8, 0, 0.6).normalize();
        const drift = Math.max(0, s - FLING[1]) * 0.05;
        const rest = v3.set(SAYA_WATER.x - drift, 0, SAYA_WATER.z - drift * 0.4);
        rest.y = waterAt(rest.x, rest.z) + 0.004;
        orient(q2, restDir, UPV);
        q2.premultiply(q1.setFromAxisAngle(restDir, Math.sin(t * 1.7) * 0.12));
        if (e < 1 && flight.saya.ok) {
          const center = v2.copy(flight.saya.p).lerp(rest, e);
          center.y += 1.4 * 4 * e * (1 - e);
          side.crossVectors(UPV, v1.subVectors(rest, flight.saya.p).setY(0).normalize());
          q1.setFromAxisAngle(side, (1 - e) * Math.PI * 2.5);
          saya.quaternion.copy(flight.saya.q).slerp(q2, smooth(0, 0.9, e)).premultiply(q1);
          dir.set(0, 1, 0).applyQuaternion(saya.quaternion);
          saya.position.copy(center).addScaledVector(dir, -0.5);
        } else {
          saya.quaternion.copy(q2);
          dir.set(0, 1, 0).applyQuaternion(q2);
          saya.position.copy(rest).addScaledVector(dir, -0.5);
        }
        if (crossed(FLING[1])) {
          burst(rest, 40, "#f3ece2", 1.4, 0.9, 0.09, 6, 1.5);
          splashRing(v2.set(rest.x, tide + 0.01, rest.z), s, 1.2);
        }
      }

      // The sword: sheathed, reached for, drawn along the scabbard, wielded, dropped.
      if (s < DROP[0] && s >= DRAW[0] && nodachi.group.parent === scene) holdNodachi();
      if (s >= DROP[0] && nodachi.group.parent !== scene) {
        kojiro.release("right", { to: scene });
        flight.sword.p.copy(nodachi.group.position);
        flight.sword.q.copy(nodachi.group.quaternion);
        flight.sword.ok = !staticMode;
      }
      saya.updateMatrixWorld(true);
      if (s < DRAW[0]) {
        // Still in the scabbard.
        saya.localToWorld(nodachi.group.position.copy(sheathed));
        saya.getWorldQuaternion(nodachi.group.quaternion);
        const reachW = easeInOutCubic(segment(s, ...REACH));
        kojiro.setHand("right", "grip", reachW, { radius: 0.017 });
        if (reachW > 0) {
          saya.localToWorld(v2.set(0, -0.087, 0));
          saya.getWorldQuaternion(q1).multiply(A.r.weapon);
          reach(kojiro, A.r, v2, q1, reachW);
        }
      } else if (s < DRAW[1]) {
        saya.localToWorld(v2.set(0, -0.087 - 0.95 * slide, 0));
        saya.getWorldQuaternion(q1).multiply(A.r.weapon);
        reach(kojiro, A.r, v2, q1);
      } else if (s < DROP[0]) {
        if (kojiro.bones.head && band.visible) band.getWorldPosition(aimK).addScaledVector(kojiro.frame.x, -0.125);
        wieldAt(K_SWORD, s, kojiro.frame, band.visible ? aimK : null);
        if (saya.parent !== scene) W.two = 0;
        miss.b = wield(kojiro, nodachi.group, saya.parent === scene ? NODACHI_LEFT : null, 0.017);
      } else {
        const e = easeInCubic(segment(s, ...DROP));
        const restDir = v1.set(-0.25, 0, -0.97).normalize();
        orient(q2, restDir, UPV);
        const rest = v3.copy(SWORD_REST).setY(heightAt(SWORD_REST.x, SWORD_REST.z) + 0.01).addScaledVector(restDir, -0.45);
        if (flight.sword.ok) {
          nodachi.group.position.lerpVectors(flight.sword.p, rest, e);
          nodachi.group.quaternion.copy(flight.sword.q).slerp(q2, e);
        } else {
          nodachi.group.position.copy(rest);
          nodachi.group.quaternion.copy(q2);
        }
        if (crossed(DROP[1])) burst(rest, 10, "#cdb08a", 0.7, 0.7, 0.1, 2);
      }
      // The edge flashes when it turns the sun toward the lens.
      nodachi.group.updateMatrixWorld(true);
      nodachi.group.getWorldQuaternion(q1);
      nodachi.group.getWorldPosition(v3);
      v1.set(1, 0, 0).applyQuaternion(q1);
      v2.subVectors(camera.position, v3).normalize().add(SUN).normalize();
      const glint = Math.abs(v1.dot(v2)) ** 40 * (s > DRAW[0] ? 1 : 0);
      nodachi.edgeMat.color.setRGB(0.45, 0.5, 0.56).multiplyScalar(1 + glint * 9);

      // The headband: on his brow until the swallow cut takes it.
      if (s >= BAND_CUT && band.visible) {
        band.getWorldPosition(ribbonFrom);
        if (staticMode || s > BAND_CUT + 0.5) ribbonFrom.set(M_JUMP[0] + 0.3, 1.9, M_JUMP[1] + 0.5);
        band.visible = false;
        ribbon.visible = true;
      }
      if (ribbon.visible) flutter(s - BAND_CUT);
    }

    rings.forEach((r) => {
      const age = s - r.t0;
      r.mesh.visible = !staticMode && age >= 0 && age < 1.3;
      if (!r.mesh.visible) return;
      r.mesh.scale.setScalar(r.size * (0.6 + age * 2.2));
      r.mesh.material.opacity = 0.7 * (1 - age / 1.3);
    });

    // The blow: a breath of warm light; slow motion under letterbox bars.
    if (!staticMode) spray.step(dt * rate);
    const flash = staticMode ? 0 : segment(s, IMPACT, IMPACT + 0.01) * (1 - segment(s, IMPACT + 0.01, IMPACT + 0.12)) * 0.35;
    const black = staticMode ? 0 : Math.max(1 - segment(s, 0, 0.6), segment(s, S_LOOP - 0.6, S_LOOP));
    cuts.update({ black, flash, flashColor: "#ffe7c4", bars: staticMode ? 0 : 0.3 * slow });
    prevS = s;
  };

  return {
    ready,
    update,
    setProps() {},
    /** For tests: how far each hand fell short of its grip last frame. */
    miss,
    dispose() {
      unsubscribeResize();
      cuts.dispose();
      spray.points.material.uniforms.uMap.value.dispose();
      shadowTex.dispose();
    },
  };
};
