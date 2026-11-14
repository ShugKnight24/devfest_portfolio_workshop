import * as THREE from "three";
import { easeInOutCubic, hash, lerp, lightBeam, segment } from "../kit";
import { blendPose } from "../figure";
import { outline } from "../ink";
import { createModelFigure } from "../modelFigure";
import { LIGHT, OUTFITS, createCuts, createFx, createInkWorld, createSets, shotAt } from "../rezeKit";
import { createCaption } from "../sfx";

/**
 * Jane slept in the church — one day out together, morning to night. Reze
 * takes Denji (her "Jane") from the church to the festival and back.
 *
 * Cut to the track (1:23, vocals from the first second, timings from its
 * synced lyrics) and, on the song slide, locked to the video's own clock
 * (`setProps({ clock })`). Each beat cuts on the sung line that names it:
 *
 *   0:00   morning: the two of them walk up the aisle of a small church
 *   0:03.5 side by side in a pew, coloured light across them
 *   0:11.4 a café: coffee for her, an omelet he wolfs down
 *   0:22.4 a walk in the park, under the trees
 *   0:31.7 the aquarium: the two of them against the big blue tank, a
 *          dolphin crossing behind
 *   0:37   over his shoulder: Denji's palms and nose on the glass, his
 *          breath fogging it, as the dolphin glides right past his face
 *   0:42.6 further down the hall, a separate exhibit: penguins on icy
 *          rocks round a shallow pool, the two of them at its rail
 *   0:48   after lunch, a bench in the park; he dozes on her shoulder
 *   0:57.5 evening: the summer festival, lanterns, the first fireworks
 *   1:13.1 night: back in the church, asleep in the pew under the moon,
 *          dip to black as the song ends
 *
 * Told as a dream: this is where the film turns, and the girl is not who he
 * thinks she is. None of that is shown. The day is the idealised version,
 * slowed down, washed warm and hazy at the edges with motes of light in the
 * air.
 *
 * Reze sings it in Russian, so the words run under the film in English, one
 * line as she sings it (LYRICS, in song seconds), with a preface over the
 * aisle: an imaginary date, as sung by Reze. The beats are staged in story
 * time (SHOTS, 0–CYCLE); BEATS stretches each one over its stretch of the
 * song. Without the video's clock the film keeps its own and loops with the
 * song's length.
 */

const CYCLE = 24;
// Gait, breath and motes: a little slower than life.
const SLOW = 1.45;
/** The track, in seconds. */
const SONG = 83;
/** [song seconds, story seconds]: where each beat starts in the song. */
const BEATS = [
  [0, 0],
  [3.52, 1.6],
  [11.43, 4.2],
  [22.38, 6.8],
  [31.67, 9.8],
  [36.95, 11.2],
  [42.59, 12.4],
  [48.03, 13.8],
  [57.47, 16.4],
  [73.13, 20.8],
  [SONG, CYCLE],
];
/** Story time at `t` seconds into the song. */
const storyAt = (t) => {
  for (let i = 1; i < BEATS.length; i++) {
    const [s1, c1] = BEATS[i];
    const [s0, c0] = BEATS[i - 1];
    if (t < s1) return lerp(c0, c1, (t - s0) / (s1 - s0));
  }
  return CYCLE - 1e-3;
};
// Song seconds: the over-the-shoulder shot at the glass.
const STATIC_TIME = 39.5;

/* ── Poses (figure.js convention: faces +z, left is +x) ── */

const SIT = {
  spine: [0.04, 0, 0],
  head: [0.06, 0, 0],
  lHip: [-1.45, 0, 0.07],
  rHip: [-1.45, 0, -0.07],
  lKnee: [1.4, 0, 0],
  rKnee: [1.4, 0, 0],
  lShoulder: [-0.45, 0, 0.02],
  rShoulder: [-0.45, 0, -0.02],
  lElbow: [-0.62, 0, 0],
  rElbow: [-0.62, 0, 0],
};
/**
 * A walk at phase `p` (one stride per 2π); `amp` scales the swing. Each knee
 * bends while its thigh swings forward and stays straight while it sweeps
 * back.
 */
const walk = (p, look = 0, amp = 1) => {
  const s = Math.sin(p);
  const k = Math.cos(p);
  // The thighs swing on a rounded triangle, not a sine: an even sweep, so the
  // planted foot moves back as steadily as the body moves on.
  const h = Math.asin(0.96 * s) / Math.asin(0.96);
  return {
    spine: [0.04, 0, 0],
    head: [0.02, look, 0],
    lShoulder: [-0.3 * s * amp, 0, 0.08],
    lElbow: [-0.35, 0, 0],
    rShoulder: [0.3 * s * amp, 0, -0.08],
    rElbow: [-0.35, 0, 0],
    lHip: [0.42 * h * amp - 0.05, 0, 0.03],
    lKnee: [Math.max(0, -k) * 0.6 * amp + 0.06, 0, 0],
    rHip: [-0.42 * h * amp - 0.05, 0, -0.03],
    rKnee: [Math.max(0, k) * 0.6 * amp + 0.06, 0, 0],
  };
};
// A stroll: a shorter swing than `walk`'s full one.
const STROLL = 0.8;
/**
 * Gait phase per metre walked at STROLL, per figure: the walk is driven by
 * the distance travelled, so a planted foot stays planted however slowly the
 * beat moves them.
 */
const GAIT = { denji: 5.8, reze: 6.03 };
const LOOK_UP = { spine: [0.02, 0, 0], neck: [-0.28, 0, 0], head: [-0.32, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.25, 0, 0], rElbow: [-0.25, 0, 0] };

// The café: she holds her cup up by her chin; he shovels omelet.
const REZE_CUP = { ...SIT, spine: [0.1, 0, 0], head: [0.08, 0, 0], lShoulder: [-0.42, 0, 0.1], lElbow: [-1.45, 0, 0], rShoulder: [-0.42, 0, -0.18], rElbow: [-1.75, 0, 0] };
const REZE_SIP = { ...REZE_CUP, head: [0.0, 0, 0], rShoulder: [-0.62, 0, -0.16], rElbow: [-2.15, 0, 0] };
const DENJI_EAT = { ...SIT, spine: [0.3, 0, 0], head: [0.25, 0, 0], lShoulder: [-0.5, 0, 0.12], lElbow: [-1.3, 0, 0], rShoulder: [-0.62, 0, -0.08], rElbow: [-1.2, 0, 0] };
const DENJI_BITE = { ...DENJI_EAT, head: [0.12, 0, 0], rShoulder: [-0.82, 0, -0.12], rElbow: [-2.05, 0, 0] };

// The aquarium: palms flat on the glass, face nearly on it.
const PRESSED = {
  spine: [0.2, 0, 0],
  chest: [0.08, 0, 0],
  head: [-0.12, 0, 0],
  lShoulder: [-1.35, 0, 0.04],
  lElbow: [-1.15, 0, 0],
  rShoulder: [-1.35, 0, -0.04],
  rElbow: [-1.15, 0, 0],
  lHip: [0, 0, 0.05],
  rHip: [0, 0, -0.05],
};
const GAZE = { spine: [0.04, 0, 0], head: [0.0, 0, 0], lShoulder: [-0.1, 0, 0.08], lElbow: [-0.45, 0, 0], rShoulder: [-0.1, 0, -0.08], rElbow: [-0.45, 0, 0], lHip: [0, 0, 0.05], rHip: [0, 0, -0.05] };
const WATCH = { spine: [0.02, 0, 0], head: [0.05, 0, 0], lShoulder: [-0.38, 0, -0.02], lElbow: [-1.2, 0, 0], rShoulder: [-0.38, 0, 0.02], rElbow: [-1.2, 0, 0], lHip: [0, 0, 0.04], rHip: [0, 0, -0.04] };

// After lunch: he leans on her and dozes; she sits still for him.
// Spaced so his head lands on her shoulder, not in her face.
const DOZE = { ...SIT, spine: [0.1, 0, 0.2], chest: [0.04, 0, 0.1], neck: [0.1, 0, 0.14], head: [0.15, 0.12, 0.34], lShoulder: [-0.3, 0, 0.1], rShoulder: [-0.5, 0, 0.18], lElbow: [-1.0, 0, 0], rElbow: [-0.95, 0, 0] };
const STILL = { ...SIT, spine: [0.02, 0, -0.07], head: [0.2, 0.32, -0.04] };

// Night: asleep in the pew, her head on his shoulder this time.
const SLEEP_HER = { ...SIT, spine: [0.08, 0, -0.21], chest: [0.03, 0, -0.09], neck: [0.12, 0, -0.13], head: [0.16, -0.18, -0.34], lShoulder: [-0.25, 0, 0.12], rShoulder: [-0.3, 0, -0.1], lElbow: [-0.95, 0, 0], rElbow: [-1.0, 0, 0] };
const SLEEP_HIM = { ...SIT, spine: [-0.08, 0, -0.03], neck: [0.25, 0, 0], head: [0.42, 0, -0.06], lShoulder: [-0.2, 0, 0.1], rShoulder: [-0.22, 0, -0.12], lElbow: [-0.95, 0, 0], rElbow: [-0.95, 0, 0] };

/* ── Light, per beat ── */

const MORNING = { ground: "#2a2234", lines: "#ffe2c6", accent: "#c8102e", rim: "#ffe0c2", shade: "#9886ae" };
const DAY = { ground: "#4d7fae", lines: "#fff0d4", accent: "#ff9fb8", rim: "#fff0d6", shade: "#8796b8" };
const CAFE = LIGHT.cafe;
const AQUARIUM = { ground: "#03101c", lines: "#8fe3ff", accent: "#b7f0ff", rim: "#9fe6ff", shade: "#4c7aa4" };
const AFTERNOON = { ground: "#5a7fa6", lines: "#ffe6bf", accent: "#ff9f6b", rim: "#ffe2b8", shade: "#8a8fb0" };
const MOON = { ground: "#05070f", lines: "#a9bcff", accent: "#c8102e", rim: "#b9c8ff", shade: "#57608e" };

const SHOTS = [
  { t: 0, id: "aisle" },
  { t: 1.6, id: "pew" },
  { t: 4.2, id: "cafe" },
  { t: 6.8, id: "park" },
  { t: 9.8, id: "tank" },
  { t: 11.2, id: "glass" },
  { t: 12.4, id: "penguins" },
  { t: 13.8, id: "bench" },
  { t: 16.4, id: "festival" },
  { t: 20.8, id: "night" },
];

/**
 * The song, in English: [from, to, line], in song seconds, as she sings it.
 * Line starts are the track's synced lyrics; where one sung line carries two
 * of ours, the split is by syllable count.
 */
const PREFACE = [0, 3.5, "An imaginary date, as sung by Reze"];
const LYRICS = [
  [0.2, 3.45, "The day of my date with Jane"],
  [3.52, 6.5, "Everything is ready"],
  [6.6, 11.35, "In the morning, we will go to church together"],
  [11.43, 22.3, "We will drink coffee and eat omelets at a café"],
  [22.38, 28.4, "After we take a walk in the park"],
  [28.5, 31.6, "Eh"],
  [31.67, 42.5, "We'll go to the aquarium and see Jane's favorites,"],
  [42.59, 47.95, "The dolphins and penguins"],
  [48.03, 52.6, "After lunch, we'll rest"],
  [52.7, 57.4, "So, what did we do in the morning?"],
  [57.47, 68.25, "We'll talk about it until we forget"],
  [68.35, 73.05, "We won't remember"],
  [73.13, SONG, "And at night, we will sleep in the church"],
];
/** A line's opacity at song time `t`: a soft fade at each end. */
const lineIn = ([a, b], t) => Math.min(segment(t, a, a + 0.35), 1 - segment(t, b - 0.35, b));

/* ── Their clothes for a day off: a tee and slacks; a summer dress ── */

// Dark trousers. The rim on his body is turned down too (see `ready`): on
// the trouser legs it lit the whole front pale, and they read as bare skin.
const DENJI_DAY = { ...OUTFITS.denji, top: "#4a6a96", sleeves: "short", tie: null, belt: null, collar: null, bottom: "#1c1f27" };
const DENJI_RIM = 0.12;
const REZE_DAY = { skin: "#f3d9cc", top: "#6f9a84", sleeve: "#6f9a84", bottom: "#6f9a84", shoes: "#5a3a26", hair: "#2a2140", sleeves: "short", skirt: 0.15 };

/* ── Sets the kit doesn't have, built here on the same page ── */

const box = (w, h, d, mat, x, y, z, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
};
const cyl = (rt, rb, h, mat, x, y, z, parent, seg = 18) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
};
const ground = (w, tint, size = [30, 24], tone = 0.8) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), w.ink({ tint, tone, rim: 0.3 }));
  m.rotation.x = -Math.PI / 2;
  return m;
};
/** Paint a geometry per vertex. */
const paint = (geo, fn) => {
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    c.set(fn(p.getX(i), p.getY(i), p.getZ(i)));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
};

/** A plain wooden chair, seat top at 0.46, facing +z. */
const chair = (w, wood) => {
  const g = new THREE.Group();
  box(0.42, 0.04, 0.42, wood, 0, 0.44, 0, g);
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(0.035, 0.44, 0.035, wood, x, 0.22, z, g);
  for (const x of [-0.18, 0.18]) box(0.035, 0.5, 0.035, wood, x, 0.7, -0.19, g);
  box(0.4, 0.14, 0.025, wood, 0, 0.86, -0.19, g);
  return g;
};

const buildCafeTable = (w) => {
  const g = new THREE.Group();
  g.add(ground(w, "#b7835a", [14, 10], 0.75));
  const wall = w.ink({ tint: "#efd7b5", tone: 0.95, rim: 0.2 });
  box(12, 4, 0.1, wall, 0, 2, -2.2, g);
  box(0.1, 4, 8, wall, -3.5, 2, 1.6, g);
  // A window onto the morning street, light falling on the table.
  const frame = w.ink({ tint: "#3b2415", tone: 0.45, rim: 0.8 });
  box(2.6, 0.08, 0.14, frame, 0.2, 2.55, -2.1, g);
  box(2.6, 0.08, 0.14, frame, 0.2, 1.05, -2.1, g);
  for (const x of [-1.05, 0.2, 1.45]) box(0.07, 1.5, 0.14, frame, x, 1.8, -2.1, g);
  box(2.5, 1.45, 0.02, new THREE.MeshBasicMaterial({ color: "#d8c6a2" }), 0.2, 1.8, -2.15, g);
  const sun = lightBeam({ from: [0.4, 2.3, -2.0], to: [0, 0.74, 0], radiusFrom: 0.7, radiusTo: 1.0, color: "#ffd59a" });
  sun.material.uniforms.uIntensity.value = 0.16;
  g.add(sun);
  // The table: a round top on a pedestal, two chairs across it.
  const wood = w.ink({ tint: "#7a4a2a", tone: 0.8, rim: 0.7 });
  const top = cyl(0.4, 0.4, 0.035, w.ink({ tint: "#f2ebdd", tone: 1.0, rim: 0.4 }), 0, 0.74, 0, g, 28);
  outline(top, w.line);
  cyl(0.04, 0.05, 0.72, frame, 0, 0.37, 0, g);
  cyl(0.2, 0.22, 0.03, frame, 0, 0.015, 0, g);
  const left = chair(w, wood);
  left.position.set(-0.62, 0, 0);
  left.rotation.y = Math.PI / 2;
  const right = chair(w, wood);
  right.position.set(0.62, 0, 0);
  right.rotation.y = -Math.PI / 2;
  g.add(left, right);
  // Breakfast: a plate each with an omelet, her coffee, his coffee.
  const plateMat = w.ink({ tint: "#fbf8f2", tone: 1.0, rim: 0.4 });
  const egg = w.ink({ tint: "#f2c14e", tone: 0.95, rim: 0.5 });
  const ketchup = w.ink({ tint: "#c8102e", tone: 0.7, rim: 0.4 });
  const plates = [];
  for (const side of [-1, 1]) {
    const plate = new THREE.Group();
    const dish = cyl(0.12, 0.09, 0.016, plateMat, 0, 0.008, 0, plate, 28);
    outline(dish, w.line);
    const om = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), egg);
    om.scale.set(1.25, 0.42, 0.7);
    om.position.y = 0.016;
    plate.add(om);
    outline(om, w.line);
    box(0.09, 0.008, 0.012, ketchup, 0, 0.049, 0, plate).rotation.y = 0.5;
    plate.position.set(side * 0.2, 0.757, 0.02);
    plate.rotation.y = side * 1.4;
    g.add(plate);
    plates.push(plate);
  }
  return { group: g, plates };
};

/** A coffee cup: origin at the grip point (the middle of the cup), +Y up. */
const buildCup = (w) => {
  const g = new THREE.Group();
  const china = w.ink({ tint: "#fbf8f2", tone: 1.0, rim: 0.5 });
  const cup = cyl(0.042, 0.034, 0.09, china, 0, 0, 0, g, 20);
  outline(cup, w.line);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.038, 20), w.ink({ tint: "#3a2214", tone: 0.6, rim: 0.2 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.041;
  g.add(coffee);
  return g;
};
/** A fork: origin at the grip, tines out past the thumb (+Y). */
const buildFork = (w) => {
  const g = new THREE.Group();
  const steel = w.ink({ tint: "#d9d9d4", tone: 1.2, rim: 0.5 });
  box(0.012, 0.15, 0.005, steel, 0, 0.02, 0, g);
  for (const x of [-0.009, -0.003, 0.003, 0.009]) box(0.0025, 0.04, 0.003, steel, x, 0.115, 0, g);
  return g;
};

const tree = (w, bark, leaves, x, z, s, seed) => {
  const g = new THREE.Group();
  cyl(0.11 * s, 0.16 * s, 2.4 * s, bark, 0, 1.2 * s, 0, g, 10);
  for (let i = 0; i < 5; i++) {
    const r = (0.75 + hash(seed + i) * 0.45) * s;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaves[i % leaves.length]);
    blob.position.set((hash(seed + i * 3.1) - 0.5) * 1.3 * s, (2.5 + hash(seed + i * 1.7) * 0.9) * s, (hash(seed + i * 5.3) - 0.5) * 1.0 * s);
    g.add(blob);
  }
  g.position.set(x, 0, z);
  return g;
};

/** The park: a path under trees, and a bench (seat top at 0.45) facing +z. */
const buildPark = (w) => {
  const g = new THREE.Group();
  g.add(ground(w, "#5f8a4a", [60, 40], 0.7));
  const path = ground(w, "#d3bf98", [60, 1.6], 0.85);
  path.position.y = 0.005;
  g.add(path);
  const bark = w.ink({ tint: "#5a3b26", tone: 0.6, rim: 0.6 });
  const leaves = [w.ink({ tint: "#4f8a3a", tone: 0.75, rim: 0.6 }), w.ink({ tint: "#3e7432", tone: 0.7, rim: 0.6 }), w.ink({ tint: "#6aa04a", tone: 0.8, rim: 0.6 })];
  [[-7, -3.2, 1.1], [-3.8, -2.6, 1.0], [-0.6, -3.6, 1.2], [2.0, -2.5, 0.9], [5.4, -3.4, 1.15], [8.6, -2.7, 1.0], [-5.2, 3.6, 1.1], [1.4, 4.2, 1.2], [6.5, 3.4, 1.0], [-9, -6, 1.3], [3.6, -6.5, 1.3]].forEach(([x, z, s], i) =>
    g.add(tree(w, bark, leaves, x, z, s, i * 7.7)),
  );
  // Lamp posts along the path.
  const iron = w.ink({ tint: "#2a2d33", tone: 0.5, rim: 0.9 });
  for (const x of [-5.5, 0.6, 6.8]) {
    cyl(0.04, 0.05, 2.8, iron, x, 1.4, -1.05, g, 8);
    box(0.16, 0.24, 0.16, iron, x, 2.9, -1.05, g);
  }
  // The bench, off the path on the grass.
  const bench = new THREE.Group();
  const slat = w.ink({ tint: "#8a5a34", tone: 0.85, rim: 0.7 });
  for (let i = 0; i < 4; i++) box(1.5, 0.03, 0.09, slat, 0, 0.435, -0.16 + i * 0.105, bench);
  for (let i = 0; i < 3; i++) box(1.5, 0.08, 0.025, slat, 0, 0.58 + i * 0.12, -0.24 - i * 0.02, bench);
  for (const x of [-0.68, 0.68]) {
    box(0.05, 0.43, 0.42, iron, x, 0.215, 0, bench);
    box(0.05, 0.42, 0.04, iron, x, 0.66, -0.26, bench);
    box(0.05, 0.04, 0.4, iron, x, 0.66, -0.02, bench);
  }
  bench.position.set(3.2, 0, -1.4);
  g.add(bench);
  return { group: g, bench: bench.position };
};

/** Water behind glass: deep below, sunlit near the top, caustics drifting. */
const tankWater = () =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDeep: { value: new THREE.Color("#04263d") }, uTop: { value: new THREE.Color("#2b86ad") } },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeep, uTop;
      varying vec3 vW;
      void main() {
        float h = clamp(vW.y / 3.4, 0.0, 1.0);
        vec3 col = mix(uDeep, uTop, smoothstep(0.0, 1.0, h));
        float n = sin(vW.x * 3.1 + uTime * 0.8) * sin(vW.y * 2.3 - uTime * 0.6 + vW.x) + 0.6 * sin((vW.x + vW.y) * 5.2 + uTime * 1.3);
        col += vec3(0.55, 0.85, 1.0) * smoothstep(1.05, 1.5, n) * 0.07 * (0.4 + h);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

/** A bottlenose dolphin, ~2 m, nose along +x, belly pale. */
const buildDolphin = (w) => {
  const g = new THREE.Group();
  const prof = [[0.0, -1.0], [0.05, -0.92], [0.09, -0.7], [0.15, -0.42], [0.21, -0.1], [0.23, 0.15], [0.2, 0.42], [0.14, 0.6], [0.09, 0.7], [0.05, 0.78], [0.035, 0.92], [0.0, 0.96]];
  const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20);
  geo.rotateZ(-Math.PI / 2);
  paint(geo, (x, y) => (y < -0.06 - 0.02 * Math.sin(x * 3) ? "#d9dfe3" : "#6c869b"));
  const skin = w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.9, rim: 0.8 });
  const body = new THREE.Mesh(geo, skin);
  body.scale.set(1, 1, 0.92);
  g.add(body);
  outline(body, w.line);
  const grey = w.ink({ tint: "#647d92", tone: 0.85, rim: 0.8 });
  const fin = (r, h, sx, sz) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), grey);
    m.scale.set(1, 1, sz);
    m.scale.x *= sx;
    outline(m, w.line);
    return m;
  };
  const dorsal = fin(0.1, 0.24, 1, 0.22);
  dorsal.position.set(-0.05, 0.27, 0);
  dorsal.rotation.z = 0.45;
  g.add(dorsal);
  for (const s of [-1, 1]) {
    const pec = fin(0.06, 0.24, 1, 0.25);
    pec.position.set(0.32, -0.12, s * 0.2);
    pec.rotation.set(s * 1.1, 0, 0.6);
    g.add(pec);
  }
  const tail = new THREE.Group();
  tail.position.set(-0.9, 0, 0);
  for (const s of [-1, 1]) {
    const fluke = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), grey);
    fluke.scale.set(0.55, 0.12, 1.15);
    fluke.position.set(-0.1, 0, s * 0.15);
    fluke.rotation.y = s * 0.5;
    outline(fluke, w.line);
    tail.add(fluke);
  }
  g.add(tail);
  return { group: g, tail };
};

/** Where the penguin exhibit sits along the aquarium hall, in set x. */
const PEN_X = 30;

/** A little penguin, ~0.42 m tall, facing +z: black back, white front. */
const buildPenguin = (w) => {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.11, 18, 14);
  geo.scale(1, 1.55, 0.95);
  geo.translate(0, 0.17, 0);
  paint(geo, (x, y, z) => (z > 0.025 + Math.abs(x) * 0.6 && y < 0.3 ? "#f3f1ea" : "#1b1d22"));
  const mat = w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.85, rim: 0.9 });
  const body = new THREE.Mesh(geo, mat);
  outline(body, w.line);
  g.add(body);
  const headGeo = new THREE.SphereGeometry(0.075, 16, 12);
  paint(headGeo, (x, y, z) => (z > 0.03 && y < -0.01 ? "#f3f1ea" : "#1b1d22"));
  const head = new THREE.Mesh(headGeo, mat);
  head.position.set(0, 0.37, 0.01);
  outline(head, w.line);
  g.add(head);
  const orange = w.ink({ tint: "#e8892f", tone: 0.9, rim: 0.5 });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 8), orange);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.36, 0.1);
  g.add(beak);
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), orange);
    foot.scale.set(0.9, 0.3, 1.4);
    foot.position.set(s * 0.045, 0.008, 0.04);
    g.add(foot);
    const flipper = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), w.ink({ tint: "#1b1d22", tone: 0.8, rim: 0.9 }));
    flipper.scale.set(0.25, 1.4, 0.6);
    flipper.position.set(s * 0.11, 0.2, -0.01);
    flipper.rotation.z = s * 0.25;
    g.add(flipper);
  }
  return g;
};

/**
 * The aquarium: a dark gallery, one long glass wall at z = −1, the tank
 * behind it with the dolphin's water. The penguins have their own exhibit,
 * further down the hall at x = PEN_X.
 */
const buildAquarium = (w) => {
  const g = new THREE.Group();
  g.add(ground(w, "#20283a", [20, 16], 0.5));
  const dark = w.ink({ tint: "#141b2a", tone: 0.5, rim: 0.4 });
  box(12, 4.2, 0.2, dark, 0, 2.1, 3.4, g);
  box(12, 0.2, 5, dark, 0, 4.1, 1.1, g);
  for (const sx of [-1, 1]) box(0.2, 4.2, 9, dark, sx * 5.9, 2.1, -0.4, g);
  const water = tankWater();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.6), water);
  back.position.set(0, 1.8, -4.6);
  g.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), water);
    side.rotation.y = -s * Math.PI / 2;
    side.position.set(s * 5.6, 1.8, -2.8);
    g.add(side);
  }
  const sand = ground(w, "#c9b98e", [12, 3.6], 0.6);
  sand.position.set(0, 0.02, -2.8);
  g.add(sand);
  for (let i = 0; i < 3; i++) {
    const shaft = lightBeam({ from: [-2.4 + i * 2.6, 3.6, -3.4], to: [-2.9 + i * 2.6, 0, -2.2], radiusFrom: 0.3, radiusTo: 0.9, color: "#bfefff" });
    shaft.material.uniforms.uIntensity.value = 0.12;
    g.add(shaft);
  }
  // The glass, its frame, a rail at hip height.
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), new THREE.MeshBasicMaterial({ color: "#9fd8ff", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
  glass.position.set(0, 1.85, -1.0);
  g.add(glass);
  // Two faint reflections across the glass, and the fog of his breath on it.
  const sheen = new THREE.MeshBasicMaterial({ color: "#d8f3ff", transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide });
  for (const [x, wd] of [[-1.6, 0.35], [2.0, 0.18]]) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(wd, 3.2), sheen);
    streak.position.set(x, 1.85, -0.99);
    streak.rotation.z = -0.5;
    g.add(streak);
  }
  const breath = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), new THREE.MeshBasicMaterial({ color: "#e8f8ff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  breath.position.set(0, 1.5, -0.985);
  g.add(breath);
  const frame = w.ink({ tint: "#1d2533", tone: 0.5, rim: 0.8 });
  box(10.4, 0.16, 0.2, frame, 0, 3.6, -1.0, g);
  box(10.4, 0.16, 0.2, frame, 0, 0.12, -1.0, g);
  for (const x of [-5.1, -2.6, 2.6, 5.1]) box(0.14, 3.6, 0.2, frame, x, 1.85, -1.0, g);
  // Further down the hall, its own exhibit: the penguins. Icy rocks round a
  // shallow pool behind a low glass wall and a rail, lit cold from above.
  const pen = new THREE.Group();
  pen.position.x = PEN_X;
  g.add(pen);
  pen.add(ground(w, "#20283a", [12, 12], 0.5));
  box(12, 4.2, 0.2, dark, 0, 2.1, -5.2, pen);
  const ice = w.ink({ tint: "#bcd3df", tone: 0.85, rim: 0.6 });
  box(9, 3.2, 0.2, ice, 0, 1.6, -5.05, pen);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), w.ink({ tint: "#3f97bf", tone: 0.9, rim: 0.4 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-1.2, 0.05, -3.0);
  pen.add(pool);
  const shore = ground(w, "#d9e6ec", [9, 4.2], 0.85);
  shore.position.set(0, 0.03, -3.0);
  pen.add(shore);
  [[1.3, 0.28, -2.2, 0.55], [0.6, 0.2, -2.0, 0.42], [2.0, 0.32, -3.1, 0.6], [1.6, 0.4, -3.9, 0.7], [-2.9, 0.26, -3.8, 0.5]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), ice);
    m.scale.set(1.3, 0.62, 0.9);
    m.position.set(x, y, z);
    outline(m, w.line);
    pen.add(m);
  });
  const shaft = lightBeam({ from: [0.4, 3.8, -3.2], to: [0.6, 0, -2.6], radiusFrom: 0.4, radiusTo: 1.4, color: "#e6f6ff" });
  shaft.material.uniforms.uIntensity.value = 0.1;
  pen.add(shaft);
  const penGlass = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.0), new THREE.MeshBasicMaterial({ color: "#9fd8ff", transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
  penGlass.position.set(0, 0.55, -1.0);
  pen.add(penGlass);
  box(9.2, 0.08, 0.12, frame, 0, 1.08, -1.0, pen);
  box(9.2, 0.1, 0.16, frame, 0, 0.05, -1.0, pen);
  for (const x of [-4.5, -1.5, 1.5, 4.5]) box(0.08, 1.05, 0.12, frame, x, 0.55, -1.0, pen);
  const penguins = [
    [0.6, 0.4, -2.0],
    [1.3, 0.55, -2.2],
    [2.0, 0.6, -3.1],
    [-0.4, 0.05, -2.4],
    [-2.2, 0.05, -3.4],
  ].map(([x, y, z]) => {
    // Bigger birds than the tiny ones by the dolphin used to be: they are the exhibit now.
    const p = buildPenguin(w);
    p.scale.setScalar(1.45);
    p.position.set(x, y, z);
    p.userData.home = { x, y, z };
    pen.add(p);
    return p;
  });
  const dolphin = buildDolphin(w);
  g.add(dolphin.group);
  return { group: g, water, penguins, dolphin, breath };
};

/* ── The scene ── */

export const createJaneSleptScene = (stage, { overlay } = {}) => {
  const { camera, staticMode, scene } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["church", "festival"]);
  // Our own sets, further down the lot.
  const own = { cafe: buildCafeTable(w), park: buildPark(w), aquarium: buildAquarium(w) };
  Object.values(own).forEach((s, i) => {
    s.origin = new THREE.Vector3(200 + i * 60, 0, 0);
    s.group.position.copy(s.origin);
    scene.add(s.group);
  });
  const origins = { church: lot.sets.church.origin, festival: lot.sets.festival.origin, cafe: own.cafe.origin, park: own.park.origin, aquarium: own.aquarium.origin };
  const at = (set, x, y, z) => new THREE.Vector3(x, y, z).add(origins[set]);
  // Kneelers along the pews: a high pew, and their feet rest on the board.
  const kneel = w.ink({ tint: "#5a3820", tone: 0.7, rim: 0.6 });
  for (let r = 0; r < 6; r++) {
    for (const side of [-1, 1]) {
      const z = -5 + r * 1.6 - 0.36;
      box(2.7, 0.04, 0.3, kneel, side * 2.1, 0.06, z, lot.sets.church.group);
      for (const dx of [-1.25, 1.25]) box(0.05, 0.06, 0.2, kneel, side * 2.1 + dx, 0.03, z, lot.sets.church.group);
    }
  }
  const show = (id) => {
    lot.show(id);
    for (const [k, s] of Object.entries(own)) s.group.visible = k === id;
  };

  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };

  // The cast, in their day clothes.
  const cast = { denji: null, reze: null };
  const cup = buildCup(w);
  const fork = buildFork(w);
  const ready = Promise.all([
    createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.8, rim: 1.1 }, outfit: DENJI_DAY, dress: { sneakers: true, spikes: true } }),
    createModelFigure({ body: "SuperheroFemale", height: 1.62, hair: ["HairLong", "EyebrowsFemale"], line: w.line, ink: { tone: 0.82, rim: 1.1 }, outfit: REZE_DAY }),
  ]).then(([denji, reze]) => {
    [denji, reze].forEach((f) => {
      scene.add(f.root);
      w.register(f.root);
    });
    // Her choker: a black band and its little ring.
    reze.apply({});
    reze.root.updateMatrixWorld(true);
    const neckAt = reze.bones.neck.getWorldPosition(new THREE.Vector3());
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 28), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }));
    band.rotation.x = Math.PI / 2;
    band.position.copy(neckAt).add(new THREE.Vector3(0, 0.04, 0.005));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0035, 6, 16), w.ink({ tint: "#e6e6e1", tone: 1.2, rim: 0.4 }));
    ring.position.copy(neckAt).add(new THREE.Vector3(0, 0.01, 0.058));
    scene.add(band, ring);
    reze.bones.neck.attach(band);
    reze.bones.neck.attach(ring);
    // The skirt of her dress, flared, riding the hips. Standing beats only:
    // seated, the paint on her lap is the skirt.
    const hipsAt = reze.bones.hips.getWorldPosition(new THREE.Vector3());
    const skirtGeo = new THREE.CylinderGeometry(0.135, 0.235, 0.3, 28, 1, true);
    skirtGeo.scale(1, 1, 0.82);
    cast.skirt = new THREE.Mesh(skirtGeo, w.ink({ tint: REZE_DAY.bottom, tone: 0.82, rim: 1.1 }));
    cast.skirt.material.side = THREE.DoubleSide;
    cast.skirt.position.set(hipsAt.x, hipsAt.y - 0.06, hipsAt.z + 0.03);
    outline(cast.skirt, w.line);
    scene.add(cast.skirt);
    reze.bones.hips.attach(cast.skirt);
    // His body's rim, down: it is the one material for skin, tee and trousers.
    let body = null;
    denji.model.traverse((m) => m.isSkinnedMesh && m.material?.uniforms?.uRim && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
    if (body) body.material.uniforms.uRim.value = DENJI_RIM;
    cast.denji = denji;
    cast.reze = reze;
    w.sync();
    return cast;
  });

  // Hands change only when the beat does: a cup and a fork at the café,
  // open palms on the aquarium glass, resting hands everywhere else.
  let handsFor = "";
  const setHands = (id) => {
    if (id === handsFor) return;
    handsFor = id;
    const { denji, reze } = cast;
    denji.release("right");
    reze.release("right");
    denji.setHands("relaxed");
    reze.setHands("relaxed");
    if (id === "cafe") {
      reze.hold(cup, { hand: "right", grip: "grip", radius: 0.04 });
      denji.hold(fork, { hand: "right", grip: "grip", radius: 0.007, rotation: new THREE.Euler(0, 0, 0.35) });
      denji.setHand("left", "open", 0.7);
      reze.setHand("left", "open", 0.5);
    } else if (id === "glass") {
      denji.setHands("open", 0.8);
    } else if (id === "tank") {
      denji.setHands("open", 0.8);
    }
  };
  /** Keep the cup upright in her hand whatever the forearm does. */
  const level = (obj, yaw = 0) => {
    obj.parent.getWorldQuaternion(q).invert();
    obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw));
  };

  /** Stand a figure: feet planted on `floorY`. */
  const stand = (fig, pos, yaw, pose) => {
    fig.root.position.copy(pos);
    fig.root.rotation.set(0, yaw, 0);
    fig.apply(pose);
    fig.groundTo(pos.y);
    if (fig === cast.reze) cast.skirt.visible = true;
  };
  /** Sit a figure: hips over (x, z), the seat of the pants on `y`. */
  const sit = (fig, x, y, z, yaw, pose) => {
    fig.root.position.set(x, y, z);
    fig.root.rotation.set(0, yaw, 0);
    fig.apply(pose);
    fig.root.updateMatrixWorld(true);
    fig.bones.hips.getWorldPosition(tmp);
    fig.root.position.x += x - tmp.x;
    fig.root.position.z += z - tmp.z;
    fig.seatOn(y);
    if (fig === cast.reze) cast.skirt.visible = false;
  };

  // ── The dream: a warm haze over the frame, soft at the edges ──
  // Centred low, so it gathers at the top and sides and leaves the floor, his
  // dark trousers and the sung line along the bottom clear.
  const haze = document.createElement("div");
  haze.setAttribute("aria-hidden", "true");
  Object.assign(haze.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse 70% 75% at 50% 70%, rgba(255,236,214,0) 52%, rgba(255,232,206,0.34) 82%, rgba(255,240,226,0.62) 100%)",
    mixBlendMode: "screen",
  });
  const blur = document.createElement("div");
  blur.setAttribute("aria-hidden", "true");
  Object.assign(blur.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    backdropFilter: "blur(2.5px) saturate(1.08)",
    WebkitBackdropFilter: "blur(2.5px) saturate(1.08)",
    maskImage: "radial-gradient(ellipse 72% 78% at 50% 70%, transparent 55%, black 100%)",
    WebkitMaskImage: "radial-gradient(ellipse 72% 78% at 50% 70%, transparent 55%, black 100%)",
  });
  const warm = document.createElement("div");
  warm.setAttribute("aria-hidden", "true");
  Object.assign(warm.style, { position: "absolute", inset: "0", pointerEvents: "none", background: "rgba(255,214,170,0.16)", mixBlendMode: "soft-light" });
  overlay?.prepend(warm, blur, haze);

  // Motes of light drifting in front of the lens, carried with the camera.
  const MOTES = 90;
  const moteSeed = Array.from({ length: MOTES }, (_, i) => [hash(i * 3.1) * 2 - 1, hash(i * 7.7) * 2 - 1, hash(i * 1.3), hash(i * 5.9)]);
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
  const moteDot = document.createElement("canvas");
  moteDot.width = moteDot.height = 32;
  const dotCtx = moteDot.getContext("2d");
  const glow = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.35, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  dotCtx.fillStyle = glow;
  dotCtx.fillRect(0, 0, 32, 32);
  const moteTex = new THREE.CanvasTexture(moteDot);
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ map: moteTex, color: "#fff1d6", size: 0.045, transparent: true, opacity: 0.6, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  motes.frustumCulled = false;
  motes.renderOrder = 10;
  scene.add(motes);
  const placeMotes = (t) => {
    motes.position.copy(camera.position);
    motes.quaternion.copy(camera.quaternion);
    const p = moteGeo.attributes.position.array;
    moteSeed.forEach(([x, y, d, ph], i) => {
      const depth = 0.9 + d * 2.2;
      const rise = ((y + 1 + t * (0.03 + ph * 0.03)) % 2) - 1;
      p[i * 3] = (x + Math.sin(t * 0.4 + ph * 6) * 0.05) * depth * 0.75;
      p[i * 3 + 1] = rise * depth * 0.45;
      p[i * 3 + 2] = -depth;
    });
    moteGeo.attributes.position.needsUpdate = true;
  };

  // The words: the preface up top, the sung line along the bottom, clear of faces.
  const preface = createCaption(overlay, { x: 4, y: 7 });
  const lyric = createCaption(overlay, { x: 4, y: 78 });

  let wasFestival = false;
  let rocket = 0;
  // Lock to the song: the video's clock arrives a few times a second, and the
  // film eases toward it so a cut never jumps. Until it arrives (no video, a
  // blocked player) the film runs on its own clock, looping with the song.
  const sync = { offset: 0, goal: null, at: 0 };

  const update = (rawTime, rawDt) => {
    sync.at = rawTime;
    if (sync.goal !== null) {
      // A seek or a restart is a jump: snap. Small drift: ease.
      if (Math.abs(sync.goal - sync.offset) > 1.5) sync.offset = sync.goal;
      else sync.offset += (sync.goal - sync.offset) * Math.min(1, rawDt * 4);
    }
    // Seconds into the song. Locked, the last frame holds once it ends.
    const songT = staticMode
      ? STATIC_TIME
      : sync.goal !== null
        ? THREE.MathUtils.clamp(rawTime + sync.offset, 0, SONG - 1e-3)
        : ((rawTime % SONG) + SONG) % SONG;
    const c = storyAt(songT);
    // Dream time: gait, breath and motes a little slower than life.
    const time = rawTime / SLOW;
    const dt = rawDt / SLOW;
    const { denji, reze } = cast;
    if (!denji) return;
    const { shot, u, s } = shotAt(SHOTS, c);
    // Idle loops (bites, tails, waddles) run on the clock, not the stretched
    // beat: dream time since this beat began in the song.
    const idle = (songT - BEATS[SHOTS.indexOf(shot)][0]) / SLOW;
    const gait = (fig, metres, offset = 0) => walk(metres * GAIT[fig === cast.denji ? "denji" : "reze"] + offset, 0, STROLL);
    const cut = { black: 0, bars: 0.35 };
    // A soft dip between beats.
    const next = SHOTS.find((x) => x.t > c)?.t ?? CYCLE;
    const dip = (a, b) => Math.max(1 - segment(c, a, a + 0.22), segment(c, b - 0.22, b));
    setHands(shot.id);

    if (shot.id === "aisle" || shot.id === "pew" || shot.id === "night") {
      const night = shot.id === "night";
      show("church");
      w.palette(night ? MOON : MORNING);
      w.light(...(night ? [0.8, 0.7, 0.2] : [0.9, 0.45, 0.3]));
      w.page({ mode: "still" });
      lot.sets.church.candles.forEach((f, i) => {
        f.visible = night;
        f.scale.set(1, 1.6 + Math.sin(time * 9 + i * 2) * 0.3, 1);
      });
      if (shot.id === "aisle") {
        // Up the aisle side by side, toward the altar.
        const z = lerp(5.6, 2.4, s / 1.6);
        stand(denji, at("church", -0.32, 0, z), Math.PI, { ...gait(denji, 5.6 - z), head: [0.02, -0.15, 0] });
        stand(reze, at("church", 0.3, 0, z + 0.08), Math.PI, { ...gait(reze, 5.6 - z, Math.PI), head: [0.02, 0.2, 0] });
        cam(at("church", 0.55, 1.45, -1.2).lerp(at("church", 0.45, 1.4, -0.6), u), at("church", 0, 1.15, 3.6));
        cut.black = Math.max(1 - segment(c, 0, 0.6), segment(c, 1.42, 1.6));
      } else {
        // In the pew, row three on the left: Reze by the aisle, Denji inside.
        const sleepy = night ? 1 : 0;
        sit(reze, at("church", -1.27, 0, 0).x, 0.52, -1.68, Math.PI, night ? SLEEP_HER : blendPose(SIT, { ...SIT, head: [0.0, -0.3, 0] }, easeInOutCubic(segment(c, 2.4, 3.0))));
        sit(denji, at("church", -1.8, 0, 0).x, 0.52, -1.68, Math.PI, night ? SLEEP_HIM : blendPose(SIT, { ...SIT, head: [-0.1, 0.25, 0] }, easeInOutCubic(segment(c, 2.2, 2.8))));
        if (night) {
          // Breathing.
          reze.root.position.y += Math.sin(time * 1.6) * 0.003 * sleepy;
          // Square on, so the two of them read as two, not one shape.
          cam(at("church", -1.15, 1.55, -3.25).lerp(at("church", -1.3, 1.48, -2.98), easeInOutCubic(u)), at("church", -1.52, 1.02, -1.7));
          cut.black = Math.max(1 - segment(c, 20.8, 21.2), segment(c, 23.4, 24));
        } else {
          cam(at("church", 0.4, 1.32, -3.1).lerp(at("church", 0.15, 1.25, -2.9), easeInOutCubic(u)), at("church", -1.5, 0.98, -1.72));
          cut.black = dip(1.6, next);
        }
      }
    } else if (shot.id === "cafe") {
      show("cafe");
      w.palette(CAFE);
      w.light(0.2, 0.7, -0.6);
      w.page({ mode: "still" });
      // Across a small table: she sips, he eats like it might be taken away.
      const sip = Math.max(0, Math.sin(idle * 2.0 - 1.2));
      sit(reze, at("cafe", -0.5, 0, 0).x, 0.46, 0, Math.PI / 2, blendPose(REZE_CUP, REZE_SIP, easeInOutCubic(sip)));
      const bite = Math.max(0, Math.sin(idle * 7.0));
      sit(denji, at("cafe", 0.52, 0, 0).x, 0.46, 0, -Math.PI / 2, blendPose(DENJI_EAT, DENJI_BITE, bite));
      level(cup, Math.PI / 2);
      const k = easeInOutCubic(u);
      cam(at("cafe", 0.15, 1.35, 2.3).lerp(at("cafe", 0.05, 1.22, 1.75), k), at("cafe", 0, 0.98, 0));
      cut.black = dip(4.2, next);
    } else if (shot.id === "park") {
      show("park");
      w.palette(DAY);
      w.light(-0.4, 0.8, 0.5);
      w.page({ mode: "still" });
      // A stroll along the path, talking; she glances at him.
      const x = lerp(-4.6, 2.4, s / 3.0);
      stand(denji, at("park", x, 0, 0.28), Math.PI / 2, { ...gait(denji, x + 4.6), head: [0.02, 0.25, 0] });
      stand(reze, at("park", x + 0.1, 0, -0.24), Math.PI / 2, { ...gait(reze, x + 4.6, Math.PI), head: [0.02, -0.35, 0] });
      cam(at("park", x + 2.6, 1.35, 2.7), at("park", x + 0.3, 1.1, 0));
      cut.black = dip(6.8, next);
    } else if (shot.id === "penguins") {
      // Down the hall: the penguin exhibit, the two of them at its rail.
      show("aquarium");
      w.palette(AQUARIUM);
      w.light(0.2, 0.8, -0.4);
      w.page({ mode: "still" });
      const aq = own.aquarium;
      aq.breath.material.opacity = 0;
      aq.penguins.forEach((p, i) => {
        const h = p.userData.home;
        const ph = idle * 7 + i * 2.1;
        const roam = Math.sin(idle * 0.9 + i * 1.7) * 0.12;
        p.position.set(h.x + roam, h.y, h.z);
        p.rotation.set(0, Math.sin(idle * 0.9 + i) * 0.7, Math.sin(ph) * 0.14);
      });
      const px = PEN_X;
      const follow = Math.sin(idle * 1.3) * 0.25;
      stand(denji, at("aquarium", px + 0.3, 0, -0.55), Math.PI, { ...GAZE, spine: [0.22, 0, 0], head: [0.25, follow, 0], lShoulder: [-0.75, 0, 0.12], lElbow: [-0.6, 0, 0], rShoulder: [-0.75, 0, -0.12], rElbow: [-0.6, 0, 0] });
      stand(reze, at("aquarium", px - 0.35, 0, -0.5), Math.PI - 0.35, { ...WATCH, head: [0.12, -0.35, 0.05] });
      // From the far end of the rail: their faces, and the birds past them.
      cam(at("aquarium", px + 2.2, 1.45, 1.2).lerp(at("aquarium", px + 1.9, 1.4, 0.9), easeInOutCubic(u)), at("aquarium", px - 0.2, 0.75, -1.9));
      cut.black = dip(12.4, next);
    } else if (shot.id === "tank" || shot.id === "glass") {
      show("aquarium");
      w.palette(AQUARIUM);
      w.light(0.15, 0.5, -1);
      w.page({ mode: "still" });
      const aq = own.aquarium;
      aq.water.uniforms.uTime.value = time;
      // The dolphin glides left to right, slow beats of the tail.
      // It crosses the tank behind them, then comes round again, nearer the glass.
      const wide = shot.id === "tank";
      const dx = wide ? lerp(-4.4, 3.2, segment(c, 9.8, 11.2)) : lerp(-3.6, 2.8, segment(c, 11.2, 12.4));
      aq.dolphin.group.position.set(dx, (wide ? 1.75 : 1.55) + Math.sin(time * 1.9) * 0.1, wide ? -3.3 : -1.75);
      aq.dolphin.group.rotation.set(0, 0, Math.cos(time * 1.9) * 0.09);
      aq.dolphin.tail.rotation.z = Math.sin(time * 5) * 0.35;
      // Denji at the glass, following the dolphin; Reze watching him.
      const follow = THREE.MathUtils.clamp(-(dx - 0.05) * 0.3, -0.6, 0.6);
      const bounce = Math.abs(Math.sin(time * 6)) * 0.015;
      const press = shot.id === "glass" ? 1 : easeInOutCubic(segment(c, 10.2, 11.0));
      stand(denji, at("aquarium", 0.05, 0, -0.62), Math.PI, blendPose(GAZE, { ...PRESSED, head: [0.05, follow, 0] }, press));
      // Palms to the glass (z = −1): slide him so his hands just touch it.
      denji.model.getObjectByName("hand_r")?.getWorldPosition(tmp);
      denji.model.getObjectByName("hand_l")?.getWorldPosition(tmp2);
      const reach = Math.min(tmp.z, tmp2.z) - origins.aquarium.z;
      denji.root.position.z += lerp(0, -0.93 - reach, press);
      denji.root.position.y += bounce * press;
      denji.root.updateMatrixWorld(true);
      denji.bones.head.getWorldPosition(tmp);
      aq.breath.position.set(tmp.x - origins.aquarium.x, tmp.y - 0.1, -0.985);
      aq.breath.material.opacity = press * (0.1 + Math.sin(time * 3) * 0.04);
      stand(reze, at("aquarium", -0.58, 0, -0.55), Math.PI, { ...WATCH, head: [0.1, 0.4, 0.06] });
      if (wide) {
        cam(at("aquarium", 0.0, 1.45, 3.1).lerp(at("aquarium", 0.0, 1.4, 2.4), easeInOutCubic(u)), at("aquarium", 0.1, 1.4, -1.6));
      } else {
        // Over his shoulder: palms on the glass, the dolphin right past his nose.
        cam(at("aquarium", 1.55, 1.55, 1.25).lerp(at("aquarium", 1.3, 1.5, 0.95), easeInOutCubic(u)), at("aquarium", -0.35, 1.3, -1.4));
      }
      cut.black = shot.id === "tank" ? Math.max(1 - segment(c, 9.8, 10.02), 0) : 0;
    } else if (shot.id === "bench") {
      show("park");
      w.palette(AFTERNOON);
      w.light(0.5, 0.6, 0.6);
      w.page({ mode: "still" });
      const b = own.park.bench;
      const nod = easeInOutCubic(segment(c, 14.0, 15.0));
      sit(reze, origins.park.x + b.x - 0.27, 0.45, b.z - 0.02, 0, STILL);
      sit(denji, origins.park.x + b.x + 0.2, 0.45, b.z - 0.02, 0, blendPose(SIT, DOZE, nod));
      denji.root.position.y += Math.sin(time * 1.5) * 0.003 * nod;
      cam(at("park", b.x + 0.5, 1.15, b.z + 3.2).lerp(at("park", b.x + 0.25, 1.05, b.z + 2.4), easeInOutCubic(u)), at("park", b.x, 0.9, b.z));
      cut.black = dip(13.8, next);
    } else {
      // ── The festival ──
      show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      const k = segment(c, 16.4, 19.0);
      const z = lerp(8.0, 1.7, k);
      const up = segment(c, 18.4, 19.6);
      stand(denji, at("festival", -0.3, 0, z), Math.PI, blendPose({ ...gait(denji, 8.0 - z), head: [0.02, 0.15, 0] }, LOOK_UP, easeInOutCubic(up)));
      stand(reze, at("festival", 0.3, 0, z + 0.1), Math.PI, blendPose({ ...gait(reze, 8.0 - z, Math.PI), head: [0.02, -0.2, 0] }, { ...LOOK_UP, head: [-0.1, -0.45, 0], neck: [-0.05, 0, 0] }, easeInOutCubic(segment(c, 18.8, 19.8))));
      cam(at("festival", 0.8, 1.3, -2.4).lerp(at("festival", 0.55, 1.28, -1.6), easeInOutCubic(u)), at("festival", 0, 1.55, 2.5));
      if (dt > 0 && c > 17.4) {
        rocket += dt;
        if (rocket > 0.55) {
          rocket = 0;
          fx.firework(at("festival", -4 + Math.random() * 8, 4.2 + Math.random() * 1.6, 9 + Math.random() * 4), Math.random() < 0.5);
        }
      }
      cut.black = dip(16.4, next);
    }

    // Fireworks belong to the festival; clear them on the way out.
    const festival = shot.id === "festival";
    if (wasFestival && !festival) fx.clear();
    wasFestival = festival;
    fx.step(dt);
    placeMotes(time);
    cuts.update(cut);
    const line = LYRICS.find(([a, b]) => songT >= a && songT < b);
    preface.update({ text: songT < PREFACE[1] ? PREFACE[2] : "", size: 2.6, opacity: lineIn(PREFACE, songT) });
    lyric.update({ text: line?.[2] ?? "", size: 3.1, opacity: line ? lineIn(line, songT) : 0 });
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fx.resize(height, camera.fov, stage.renderer.getPixelRatio());
  });

  return {
    ready,
    update,
    /** `clock`: seconds into the song, from the video player. */
    setProps({ clock } = {}) {
      if (typeof clock === "number") sync.goal = clock - sync.at;
    },
    dispose() {
      unsubscribeResize();
      cuts.dispose();
      preface.dispose();
      lyric.dispose();
      [warm, blur, haze].forEach((el) => el.remove());
      scene.remove(motes);
      moteGeo.dispose();
      motes.material.dispose();
      moteTex.dispose();
    },
  };
};
