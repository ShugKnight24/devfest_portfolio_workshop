import * as THREE from "three";
import { OUTFITS, LIGHT, createInkWorld } from "../rezeKit";
import { createParticles, easeInOutCubic, hash, lerp, segment } from "../kit";
import { createModelFigure } from "../modelFigure";
import { createCaption } from "../sfx";
import { outline } from "../ink";
import { buildPochita } from "../pochita";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The Next Mountain — one mountain in the middle of the frame, and the places
 * you can stand to look at it. Nothing in the world changes between shots;
 * only the camera does. One loop is CYCLE, each move a slow crane. On slide
 * 16 the clicker walks it instead, holding at each moment (see VIEW_STOPS).
 *
 *    0– 5  valley   low in the fog at its foot: it fills the sky, a wall.
 *    5–10  above    high over it at dawn: a small peak, the fog a soft sea. A
 *                   bald eagle circles below the camera, banking, sharing its
 *                   bird's-eye view: from up here it was easy.
 *   10–15  summit   over Denji's shoulder on the top: he is looking at the
 *                   next mountain, taller, behind it.
 *   15–26  home     late, warm light in the yard below. A plank bench in front
 *                   of the shack: Pochita, Denji, Shug and Luna, sitting in a
 *                   row, all looking out at the mountain.
 *                     16.6  over their shoulders: Denji's eyes are still on
 *                           the summit. Pochita is looking up at Denji.
 *                     19.6  the camera swings round to the front.
 *                     20.8  Denji turns to Pochita and rests a hand on his
 *                           back; Shug turns to Luna and does the same. She
 *                           looks up at him, tail sweeping the grass.
 *                     22–26 the quiet moment, held.
 *   26–32  wide     the whole range turning slowly: same mountain, every view.
 *
 * Denji said he should have been happy just living with Pochita; the home shot
 * is that beat. Shug (bald, full dark beard, charcoal henley, jeans) and Luna
 * (a fawn shepherd-boxer mix with a black muzzle, white chest and socks) sit
 * beside them and mirror it. Reduced motion holds the end of that moment.
 *
 * Denji, Shug: Quaternius CC0 bodies with painted clothes. Pochita and Luna
 * are built here from smooth swept tubes and ellipsoids, inked like the rest.
 */

const MOVE = 1.6;

// The middle mountain, the taller one behind it, and the range around them.
const PEAKS = [
  { x: 0, z: 0, h: 11, r: 6 },
  { x: -7, z: -28, h: 20, r: 9 },
  { x: 19, z: -17, h: 12, r: 7 },
  { x: -23, z: -9, h: 10, r: 7 },
  { x: 27, z: 5, h: 7, r: 6 },
  { x: -29, z: 15, h: 6.5, r: 6 },
];
// On his own summit he has not noticed the range yet: the middle mountain alone.
const SOLO = [PEAKS[0]];
const rawHeight = (x, z, peaks = PEAKS) => {
  let h = 0;
  for (const p of peaks) {
    const d = Math.hypot(x - p.x, z - p.z) / p.r;
    h = Math.max(h, p.h * Math.exp(-(d ** 1.6)));
  }
  // Ridged rock: sharp creases high up, so the peaks read as stone, not
  // cream, and the valley floor stays soft.
  let rock = 0;
  let amp = 1;
  let f = 0.28;
  for (let o = 0; o < 5; o++) {
    const n = Math.sin(x * f + o * 1.7 + Math.sin(z * f * 0.8 + o)) * Math.cos(z * f * 1.1 - o * 2.3 + Math.cos(x * f * 0.6));
    rock += (0.5 - Math.abs(n)) * amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return h + rock * (0.25 + h * 0.13);
};

// Home: a bench in the yard, facing the mountain, the shack behind it.
// Bench space: origin at the middle of the bench on the ground, +z out toward
// the mountain, +x along the bench to the sitters' left.
const BENCH = { x: 8.5, z: 13.5 };
const BENCH_YAW = Math.atan2(-BENCH.x, -BENCH.z);
const YARD = (() => {
  // The yard is levelled: a flat patch round the bench and the shack.
  const c = new THREE.Vector3(-1, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), BENCH_YAW);
  return { x: BENCH.x + c.x, z: BENCH.z + c.z, y: rawHeight(BENCH.x + c.x, BENCH.z + c.z) };
})();
const heightAt = (x, z, peaks = PEAKS) => {
  const h = rawHeight(x, z, peaks);
  const d = Math.hypot(x - YARD.x, z - YARD.z);
  const flat = 1 - segment(d, 6, 9);
  return lerp(h, YARD.y, flat * flat * (3 - 2 * flat));
};
const GROUND = YARD.y;

const SEAT_Y = 0.42; // top of the bench plank, above the yard
const BENCH_X = [-1.3, 0.85];
const AT = {
  pochita: { x: -0.98, z: 0.0, yaw: 0.4 },
  denji: { x: -0.35, z: -0.04 },
  shug: { x: 0.42, z: -0.04 },
  luna: { x: 1.13, z: 0.02, yaw: -0.25 },
};
const SHACK = { x: -2.9, z: -4.6, yaw: 0.35 };

// The valley's light: cold, low, no colour in it.
const GLOOM = { ground: "#0e1218", lines: "#8796ab", accent: "#56637a", rim: "#a9b8cc", shade: "#4b5568" };
// Late afternoon at home: low gold sun, warm shadows.
const GOLDEN = { ground: "#2a1b17", lines: "#ffd8a8", accent: "#ff9a5c", rim: "#ffc690", shade: "#a8888a" };

// Where Denji stands at the foot, looking up, and the trail he could take.
const VALLEY_SPOT = { x: -0.9, z: 8.4 };
// Valley beats (seconds into the valley shot): the reframe warms the light
// and draws the way up.
const REFRAME = [5.2, 7.6];
const TRAIL = [5.6, 9.2];
// Summit beats: the range sinks as he arrives, and comes back when he looks up.
const RISE = [7.2, 9.2];
const CHEER = [1.4, 2.2, 5.0, 6.2]; // arms up, held, down
// The eagle's circle in the view from above: centre, radius, speed (rad/s,
// negative is clockwise seen from above), where on the circle it starts,
// its bank and size.
const EAGLE = { c: [12.6, 22.0, 18.6], r: 2.4, speed: -0.42, start: 2.3, bank: 0.42, scale: 1.25 };
// Slide 18's eagle circles the summit itself, once per loop (so the loop never
// jumps), a little above Denji: behind him while the camera faces him, and out
// over the next peak when it swings round. Two flaps a loop, long glides.
const PEAK_EAGLE = { r: 8, alt: 2.2, speed: (-Math.PI * 2) / 19, start: 0, bank: 0.38, scale: 1.3, flaps: 3, glide: 9.5 };

const SHOTS = [
  {
    dur: 10.5,
    captions: [
      [1.8, 4.9, "From the valley: it's over."],
      [5.4, 10.5, "Reframe: a fun climb that will stretch me and my skills."],
    ],
    light: GLOOM,
    reframe: LIGHT.dawn,
    sun: [-0.4, 0.6, -0.7],
    pos: [-1.5, 2.8, 10.5],
    look: [0, 8, 0],
    denji: "valley",
  },
  {
    dur: 6,
    captions: [[1.3, 5.8, "From above, it was easy. The task is complete."]],
    light: LIGHT.dawn,
    sun: [0.85, 0.35, -0.4],
    pos: [16, 27, 24],
    look: [0, 6, -1],
    denji: "summit",
    eagle: true,
  },
  {
    dur: 9.6,
    captions: [
      [1.8, 4.4, "The top. You did it."],
      [4.6, 7.1, "That feeling fades fast."],
      [7.4, 9.6, "Then he sees the next one."],
    ],
    light: LIGHT.dawn,
    sun: [0.85, 0.35, -0.4],
    summit: true,
    solo: true,
    denji: "cheer",
  },
  {
    dur: 7,
    captions: [
      [0.4, 3.6, "Reframe: is it what you really want?"],
      [3.8, 7, "If it is, go. If it isn't, that's fine too."],
    ],
    light: LIGHT.dawn,
    sun: [0.85, 0.35, -0.4],
    summit: "next",
    denji: "summit",
    lift: 0,
  },
  {
    dur: 11,
    captions: [
      [1.3, 4.6, "Even at home, he looks at the next one."],
      [7.0, 9.3, "What you have is already right beside you."],
      [9.4, 11, "Be grateful for it."],
    ],
    light: GOLDEN,
    home: true,
    parallax: 0.12,
    denji: "bench",
  },
  { dur: 6, caption: "Same mountain. Your perspective is the judge.", light: LIGHT.dawn, sun: [0.85, 0.35, -0.4], wide: true, denji: "bench" },
];
/**
 * The Next Peak (slide 17): his summit only, the whole range in view. He
 * celebrates, kneels on a flat shelf of the summit to smell a big rose bush
 * growing there, then stands and looks out at the next one. One shot; the
 * camera moves inside it.
 */
const PEAK_SHOTS = [
  {
    dur: 19,
    captions: [
      [1.0, 4.6, "Celebrate the win. Even the small ones."],
      [6.6, 11.2, "Stop and smell the roses."],
      [13.6, 18.4, "Then pick your next mission."],
    ],
    light: LIGHT.dawn,
    sun: [0.85, 0.35, -0.4],
    peak: true,
    denji: "peak",
    lift: 0.6,
  },
];
// Peak beats (seconds into the shot).
const PEAK = { cheer: [0.6, 1.3, 3.6, 4.6], kneel: [5.0, 6.4], sniff: [7.0, 10.6], stand: [11.0, 12.4], swing: [12.0, 14.2] };

const plan = (shots) => {
  const starts = shots.reduce((a, s) => [...a, a[a.length - 1] + s.dur], [0]);
  return { shots, starts, cycle: starts[shots.length] };
};
const VIEWS = plan(SHOTS);
export const CYCLE = VIEWS.cycle;
const HOME_IDX = SHOTS.findIndex((s) => s.home);
const HOME_START = VIEWS.starts[HOME_IDX];
// Reduced motion: the end of the quiet moment on the bench.
export const STATIC_TIME = HOME_START + 9.5;

/**
 * Slide 16 is walked, not timed: each clicker press plays the film on to the
 * next of these moments and holds there, idling (breath, wagging tails, the
 * eagle circling, drifting fog) until the next press. Back plays it back to
 * the one before. Each hold sits inside its caption, so the line stays up.
 * Step 0 is the slide arriving; the deck's beats are the presses after it.
 */
const stop = (shot, into) => VIEWS.starts[shot] + into;
export const VIEW_STOPS = [
  stop(0, 3.6), // valley: it fills the sky, "it's over" (the doom)
  stop(0, 9.6), // the reframe: warm light, the trail drawn up
  stop(1, 4.2), // from above with the eagle: "it was easy" (the hype)
  stop(2, 3.4), // the summit: fists up, "you did it"
  stop(2, 6.5), // arms down: "that feeling fades fast"
  stop(2, 9.2), // the range is back: the next one
  stop(3, 3.0), // reframe: is it what you really want?
  stop(3, 6.4), // if it is, go; if it isn't, that's fine too
  stop(4, 4.0), // home, over their shoulders: still looking at the next one
  stop(4, 8.8), // turned to each other: what you have is beside you
  stop(4, 10.5), // be grateful for it
  stop(5, 3.0), // the whole range: same mountain, your perspective
];
/** Presses slide 16 takes before it advances: one per stop after the first. */
export const VIEW_BEATS = VIEW_STOPS.length - 1;

/**
 * Fly the eagle round a level circle, banked into the turn. `flaps` adds a
 * few slow wingbeats at the top of each `glide` seconds, then a long glide.
 */
const flyEagle = (eagle, { c, r, speed, start, bank, flaps = 0, glide = 9.5 }, et) => {
  const th = start + speed * et;
  const dirTurn = Math.sign(speed);
  const u = ((et % glide) + glide) % glide;
  const env = flaps ? Math.sin(Math.PI * Math.min(1, u / (flaps / 1.8))) : 0;
  const flap = flaps && u < flaps / 1.8 ? Math.sin(u * 1.8 * Math.PI * 2) * env : 0;
  const ec = v3(...c);
  const bp = v3(ec.x + Math.cos(th) * r, ec.y + Math.sin(et * 0.7) * 0.15 - flap * 0.04, ec.z + Math.sin(th) * r);
  const fwd = v3(-Math.sin(th) * dirTurn, 0, Math.cos(th) * dirTurn).normalize();
  const inward = ec.clone().setY(bp.y).sub(bp).normalize();
  const up = UP.clone().multiplyScalar(Math.cos(bank)).addScaledVector(inward, Math.sin(bank)).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
  up.crossVectors(fwd, right).normalize();
  eagle.bird.position.copy(bp);
  eagle.bird.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
  const flex = Math.sin(et * 1.25);
  eagle.wings.forEach(({ shoulder, wrist, side }) => {
    // Dihedral up at the shoulder, the hand drooping a little at the wrist;
    // on a wingbeat the hand trails the arm.
    shoulder.rotation.z = side * (0.12 + 0.06 * flex + 0.45 * flap);
    shoulder.rotation.y = -side * 0.04 * flex;
    wrist.rotation.z = -0.1 + 0.05 * Math.sin(et * 1.25 + 0.7) - 0.3 * flap;
  });
};

// Home beats (seconds into the home shot).
const SWING = [4.6, 7.6]; // camera round to the front
const TURN = [5.8, 7.2]; // the four turn to each other

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);
const X_AXIS = v3(1, 0, 0);
/** A light part-way between two palettes. */
const blendLight = (a, b, k) => {
  const out = {};
  for (const key of Object.keys(a)) out[key] = `#${new THREE.Color(a[key]).lerp(new THREE.Color(b[key] ?? a[key]), k).getHexString()}`;
  return out;
};
const smooth = (u) => easeInOutCubic(Math.min(1, Math.max(0, u)));
const pulse = (c, at, width = 0.08) => Math.exp(-(((c - at) / width) ** 2));

// ── Geometry helpers ───────────────────────────────────────────────────────

/**
 * A smooth tube swept along a curve, its cross-section an ellipse whose radii
 * `radius(t)` returns as [rx, ry] (rx along `side`), with rounded caps. Every
 * limb, neck, tail and torso of the two dogs is one of these.
 */
const sweep = (points, radius, { segs = 20, rings = 24, cap = 6, side = X_AXIS } = {}) => {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => v3(...p)), false, "centripetal");
  const frame = (t) => {
    const c = curve.getPointAt(t);
    const T = curve.getTangentAt(t);
    let s = side;
    if (Math.abs(T.dot(s)) > 0.95) s = Math.abs(T.y) < 0.9 ? UP : v3(0, 0, 1);
    const X = s.clone().addScaledVector(T, -T.dot(s)).normalize();
    const Y = new THREE.Vector3().crossVectors(T, X);
    return { c, T, X, Y };
  };
  const rows = [];
  const f0 = frame(0);
  const f1 = frame(1);
  const [s0x, s0y] = radius(0);
  const [s1x, s1y] = radius(1);
  for (let i = 0; i < cap; i++) {
    const a = -Math.PI / 2 + (i / cap) * (Math.PI / 2);
    rows.push({ c: f0.c.clone().addScaledVector(f0.T, Math.sin(a) * Math.min(s0x, s0y)), X: f0.X, Y: f0.Y, rx: s0x * Math.cos(a), ry: s0y * Math.cos(a) });
  }
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const [rx, ry] = radius(t);
    rows.push({ ...frame(t), rx, ry });
  }
  for (let i = 1; i <= cap; i++) {
    const a = (i / cap) * (Math.PI / 2);
    rows.push({ c: f1.c.clone().addScaledVector(f1.T, Math.sin(a) * Math.min(s1x, s1y)), X: f1.X, Y: f1.Y, rx: s1x * Math.cos(a), ry: s1y * Math.cos(a) });
  }
  const pos = [];
  const idx = [];
  const p = new THREE.Vector3();
  for (const r of rows) {
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2;
      p.copy(r.c).addScaledVector(r.X, Math.cos(th) * r.rx).addScaledVector(r.Y, Math.sin(th) * r.ry);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};
/** Radii eased between keys: [[t, rx, ry], ...]. */
const profile = (keys) => (t) => {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, ax, ay] = keys[i];
  const [tb, bx, by] = keys[i + 1];
  const k = smooth((t - ta) / Math.max(1e-6, tb - ta));
  return [lerp(ax, bx, k), lerp(ay, by, k)];
};

/** A small builder: mesh + optional outline, added to a parent. */
const maker = (line) => (parent, geometry, material, { at, scale, rot, ink = true } = {}) => {
  const mesh = new THREE.Mesh(geometry, material);
  if (at) mesh.position.set(...at);
  if (scale) mesh.scale.set(...scale);
  if (rot) mesh.rotation.set(...rot);
  parent.add(mesh);
  if (ink) outline(mesh, line);
  return mesh;
};
const BALL = new THREE.SphereGeometry(1, 28, 20);

// ── The eagle ──────────────────────────────────────────────────────────────

/**
 * A bald eagle soaring: dark brown body and broad wings, white head and tail,
 * yellow hooked beak. Each wing is an inner panel hinged at the shoulder and
 * an outer one hinged at the wrist, ending in five spread primary feathers,
 * the "fingers". Bird space: beak to +z, wings along x, back to +y.
 */
const buildEagle = (w) => {
  const add = maker(w.line);
  const brown = w.ink({ tint: "#3d2a1d", tone: 0.85, rim: 0.7 });
  const brownLight = w.ink({ tint: "#5a3f2a", tone: 0.9, rim: 0.7 });
  const white = w.ink({ tint: "#f3efe6", tone: 1.0, rim: 0.5 });
  const yellow = w.ink({ tint: "#e8b22e", tone: 1.0, rim: 0.4 });
  const bird = new THREE.Group();
  const flat = (pts, depth = 0.014) => {
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 });
    // The shape is drawn in x/y; lay it flat in x/z, thickness up.
    g.rotateX(Math.PI / 2);
    g.translate(0, depth / 2, 0);
    return g;
  };
  // Body, head, beak, tail.
  add(bird, BALL, brown, { scale: [0.085, 0.075, 0.27] });
  add(bird, BALL, white, { at: [0, 0.025, 0.27], scale: [0.06, 0.06, 0.085] });
  const beak = add(bird, new THREE.ConeGeometry(0.026, 0.08, 10), yellow, { at: [0, 0.012, 0.37], rot: [Math.PI / 2 + 0.35, 0, 0] });
  beak.scale.set(0.8, 1, 1);
  add(bird, flat([[-0.05, -0.2], [0.05, -0.2], [0.12, -0.44], [0.04, -0.47], [0, -0.45], [-0.04, -0.47], [-0.12, -0.44]], 0.012), white, { at: [0, 0.01, 0] });
  // Yellow feet tucked under the tail.
  for (const s of [-1, 1]) add(bird, BALL, yellow, { at: [s * 0.035, -0.055, -0.17], scale: [0.018, 0.016, 0.05] });

  // Wings: [shoulder group, wrist group] per side.
  const inner = [[0, 0.12], [0.2, 0.15], [0.46, 0.14], [0.46, -0.17], [0.3, -0.21], [0.12, -0.22], [0, -0.19]];
  const outer = [[0, 0.14], [0.22, 0.135], [0.38, 0.11]];
  for (let i = 0; i < 5; i++) {
    const zc = 0.075 - i * 0.058;
    outer.push([0.41 + i * 0.006, zc + 0.024], [0.62 - Math.abs(i - 1.5) * 0.028, zc - 0.004], [0.43 + i * 0.006, zc - 0.026]);
  }
  outer.push([0.34, -0.18], [0.14, -0.2], [0, -0.17]);
  const wings = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.05, 0.03, 0.04);
    shoulder.scale.x = side;
    bird.add(shoulder);
    add(shoulder, flat(inner), brownLight);
    const wrist = new THREE.Group();
    wrist.position.set(0.44, 0, 0);
    shoulder.add(wrist);
    add(wrist, flat(outer), brown);
    return { shoulder, wrist, side };
  });
  return { bird, wings };
};

// ── Luna ───────────────────────────────────────────────────────────────────

/**
 * Luna, sitting: a medium-large shepherd-boxer mix. Fawn coat, a black muzzle
 * and mask, white chest blaze and white lower legs, ears up with the tips
 * folding over, a long tail lying on the grass with an upward curl at the end.
 * Dog space: nose to +z, sitting on y = 0, metres. Deep chest, the haunches
 * folded under, front legs straight, hocks flat on the ground.
 */
const buildLuna = (w) => {
  const add = maker(w.line);
  const fawn = w.ink({ tint: "#c89660", tone: 0.95, rim: 0.6 });
  const saddle = w.ink({ tint: "#a87644", tone: 0.92, rim: 0.6 });
  const black = w.ink({ tint: "#221a16", tone: 0.8, rim: 0.5 });
  const nose = w.ink({ tint: "#141010", tone: 0.8, rim: 0.4, spec: 0.8 });
  const white = w.ink({ tint: "#ece4d6", tone: 0.92, rim: 0.3 });
  const earTip = w.ink({ tint: "#4a3324", tone: 0.85, rim: 0.5 });
  const earIn = w.ink({ tint: "#d9a68a", tone: 0.85, rim: 0.3 });
  const eyeMat = w.ink({ tint: "#2a170c", tone: 0.7, rim: 0.2, spec: 1.0 });

  const dog = new THREE.Group();

  // Torso: pelvis on the grass, rising to a deep chest; the waist tucks in.
  const body = new THREE.Group();
  dog.add(body);
  add(
    body,
    sweep(
      [
        [0, 0.135, -0.25],
        [0, 0.235, -0.185],
        [0, 0.355, -0.08],
        [0, 0.455, 0.025],
      ],
      profile([
        [0, 0.112, 0.118],
        [0.38, 0.098, 0.1],
        [0.75, 0.12, 0.152],
        [1, 0.108, 0.128],
      ]),
    ),
    fawn,
  );
  // A darker saddle down the back, and the white chest blaze in front.
  add(body, BALL, saddle, { at: [0, 0.36, -0.13], scale: [0.085, 0.05, 0.15], rot: [-0.85, 0, 0], ink: false });
  add(body, BALL, white, { at: [0, 0.37, 0.105], scale: [0.078, 0.125, 0.06], rot: [0.45, 0, 0], ink: false });

  // Neck, thick, up and a little forward.
  add(
    body,
    sweep(
      [
        [0, 0.45, 0.04],
        [0, 0.56, 0.095],
        [0, 0.66, 0.135],
        [0, 0.72, 0.15],
      ],
      profile([
        [0, 0.078, 0.088],
        [1, 0.06, 0.064],
      ]),
    ),
    fawn,
  );

  // Head, on a pivot at the top of the neck so it can turn and tilt.
  const head = new THREE.Group();
  head.position.set(0, 0.71, 0.15);
  body.add(head);
  add(head, BALL, fawn, { at: [0, 0.07, 0.025], scale: [0.072, 0.068, 0.084] });
  [-1, 1].forEach((s) => {
    add(head, BALL, fawn, { at: [s * 0.04, 0.038, 0.072], scale: [0.042, 0.042, 0.05], ink: false });
    // Brow: the stop between skull and muzzle.
    add(head, BALL, fawn, { at: [s * 0.03, 0.092, 0.085], scale: [0.026, 0.016, 0.022], ink: false });
    // Eyes: dark brown, set under the brow.
    const eye = add(head, BALL, eyeMat, { at: [s * 0.037, 0.078, 0.1], scale: [0.0125, 0.0115, 0.009], ink: false });
    eye.userData.eye = true;
  });
  // The black mask: muzzle, chin and the lip line, and a glossy nose.
  add(
    head,
    sweep(
      [
        [0, 0.05, 0.08],
        [0, 0.045, 0.14],
        [0, 0.04, 0.185],
      ],
      profile([
        [0, 0.044, 0.042],
        [1, 0.036, 0.033],
      ]),
    ),
    black,
  );
  add(head, BALL, black, { at: [0, 0.008, 0.13], scale: [0.03, 0.02, 0.048] });
  add(head, BALL, nose, { at: [0, 0.056, 0.212], scale: [0.022, 0.016, 0.014], ink: false });
  // Ears: shepherd ears standing up and out, the top third folding forward.
  const ears = [-1, 1].map((s) => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.048, 0.118, 0.012);
    ear.rotation.set(-0.15, s * 0.25, -s * 0.38);
    head.add(ear);
    const tri = (wd, ht) => {
      const sh = new THREE.Shape();
      sh.moveTo(-wd / 2, 0);
      sh.quadraticCurveTo(-wd * 0.3, ht * 0.7, 0, ht);
      sh.quadraticCurveTo(wd * 0.3, ht * 0.7, wd / 2, 0);
      sh.lineTo(-wd / 2, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 8 });
      g.translate(0, 0, -0.004);
      return g;
    };
    add(ear, tri(0.064, 0.062), fawn);
    add(ear, tri(0.04, 0.046), earIn, { at: [0, 0.006, 0.006], ink: false });
    const tip = new THREE.Group();
    tip.position.y = 0.056;
    tip.rotation.x = 1.05;
    ear.add(tip);
    add(tip, tri(0.03, 0.036), earTip, { at: [0, -0.004, 0] });
    return ear;
  });

  // Front legs: shoulder, elbow tucked to the chest, straight forearm, white
  // from the wrist down, the paws on the grass.
  [-1, 1].forEach((s) => {
    add(
      body,
      sweep(
        [
          [s * 0.083, 0.46, 0.065],
          [s * 0.094, 0.37, 0.03],
          [s * 0.09, 0.27, 0.04],
        ],
        profile([
          [0, 0.05, 0.062],
          [1, 0.038, 0.042],
        ]),
      ),
      fawn,
    );
    add(
      body,
      sweep(
        [
          [s * 0.089, 0.285, 0.042],
          [s * 0.084, 0.2, 0.068],
          [s * 0.08, 0.13, 0.092],
        ],
        profile([
          [0, 0.032, 0.034],
          [1, 0.026, 0.027],
        ]),
      ),
      fawn,
    );
    add(
      body,
      sweep(
        [
          [s * 0.08, 0.145, 0.088],
          [s * 0.078, 0.075, 0.108],
          [s * 0.077, 0.035, 0.128],
        ],
        profile([
          [0, 0.026, 0.027],
          [0.6, 0.022, 0.022],
          [1, 0.024, 0.024],
        ]),
      ),
      white,
    );
    add(body, BALL, white, { at: [s * 0.077, 0.021, 0.152], scale: [0.03, 0.021, 0.042] });
    // Hind leg folded: the thigh a big oval on the flank, the shin back to
    // the hock, the long foot flat on the grass forward to the paw.
    add(body, BALL, fawn, { at: [s * 0.104, 0.15, -0.155], scale: [0.058, 0.108, 0.138], rot: [-0.45, 0, 0] });
    add(
      body,
      sweep(
        [
          [s * 0.114, 0.11, -0.05],
          [s * 0.118, 0.085, -0.17],
          [s * 0.112, 0.055, -0.255],
        ],
        profile([
          [0, 0.038, 0.04],
          [1, 0.028, 0.03],
        ]),
      ),
      fawn,
    );
    add(
      body,
      sweep(
        [
          [s * 0.112, 0.045, -0.265],
          [s * 0.108, 0.03, -0.18],
          [s * 0.103, 0.026, -0.085],
        ],
        profile([
          [0, 0.026, 0.026],
          [1, 0.02, 0.02],
        ]),
      ),
      white,
    );
    add(body, BALL, white, { at: [s * 0.103, 0.02, -0.058], scale: [0.027, 0.02, 0.038] });
  });

  // Tail: from the rump along the grass, curling up at the end. It sweeps.
  const tail = new THREE.Group();
  tail.position.set(0, 0.12, -0.33);
  body.add(tail);
  add(
    tail,
    sweep(
      [
        [0, 0, 0],
        [0, -0.065, -0.09],
        [0.02, -0.095, -0.21],
        [0.075, -0.085, -0.32],
        [0.13, -0.03, -0.37],
        [0.15, 0.04, -0.35],
      ],
      profile([
        [0, 0.03, 0.03],
        [0.5, 0.022, 0.022],
        [1, 0.013, 0.013],
      ]),
      { rings: 30 },
    ),
    fawn,
  );

  // Where a hand rests: between the shoulder blades.
  const back = new THREE.Object3D();
  back.position.set(0, 0.555, -0.02);
  body.add(back);

  const eyes = [];
  head.traverse((o) => o.userData.eye && eyes.push(o));
  return { dog, body, head, ears, tail, back, eyes };
};

// ── Figures ────────────────────────────────────────────────────────────────

const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

/** Two-bone arm IK on the pose library's arms (as at the breakfast table). Targets in world, hints in the root's frame. */
const createArmIK = (fig) => {
  fig.apply({});
  fig.root.updateMatrixWorld(true);
  const local = (o) => fig.root.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  const arms = {};
  for (const s of ["l", "r"]) {
    const sh = fig.bones[`${s}Shoulder`];
    const el = fig.bones[`${s}Elbow`];
    const hand = fig.model.getObjectByName(`hand_${s}`);
    const S = local(sh);
    const E = local(el);
    const H = local(hand);
    arms[s] = { sh, el, hand, rest: hand.quaternion.clone(), l1: S.distanceTo(E), l2: E.distanceTo(H) };
  }
  const dp = new THREE.Quaternion();
  const dpInv = new THREE.Quaternion();
  const tq = new THREE.Quaternion();
  const q1 = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const S = new THREE.Vector3();
  const d = new THREE.Vector3();
  const v = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const h = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const ax = new THREE.Vector3();
  return {
    arms,
    solve(pose, s, target, hint) {
      const { sh, l1, l2 } = arms[s];
      dp.copy(qEuler(pose.hips, tq));
      dp.multiply(qEuler(pose.spine, tq)).multiply(qEuler(pose.chest, tq));
      dpInv.copy(dp).invert();
      fig.root.worldToLocal(sh.getWorldPosition(S));
      fig.root.worldToLocal(d.copy(target)).sub(S).applyQuaternion(dpInv);
      const len = THREE.MathUtils.clamp(d.length(), Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.998);
      const e = -Math.acos(THREE.MathUtils.clamp((len * len - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1));
      v.set(0, -l1 - l2 * Math.cos(e), -l2 * Math.sin(e)).normalize();
      d.normalize();
      q1.setFromUnitVectors(v, d);
      elbow.set(0, -1, 0).applyQuaternion(q1);
      h.copy(hint).applyQuaternion(dpInv);
      a.copy(elbow).addScaledVector(d, -d.dot(elbow));
      b.copy(h).addScaledVector(d, -d.dot(h));
      const phi = Math.atan2(d.dot(ax.crossVectors(a, b)), a.dot(b));
      twist.setFromAxisAngle(d, phi);
      q1.premultiply(twist);
      euler.setFromQuaternion(q1, "XYZ");
      pose[`${s}Shoulder`] = [euler.x, euler.y, euler.z];
      pose[`${s}Elbow`] = [e, 0, 0];
    },
  };
};

/**
 * Turn a hand so its palm faces `normal` (world), fingers keeping their
 * heading — a hand laid flat on a back instead of hanging edge-on. The hand
 * bone is not in the pose library, so this is set fresh every frame.
 */
const _pa = new THREE.Vector3();
const _pb = new THREE.Vector3();
const _pc = new THREE.Vector3();
const _pu = new THREE.Vector3();
const _pn = new THREE.Vector3();
const _m1 = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const palmTo = (fig, s, normal, weight) => {
  const arm = fig.ik.arms[s];
  arm.hand.quaternion.copy(arm.rest);
  if (weight <= 0.001) return;
  fig.root.updateMatrixWorld(true);
  const base = fig.model.getObjectByName(`middle_01_${s}`);
  const tip = fig.model.getObjectByName(`middle_03_${s}`);
  if (!base || !tip) return;
  arm.hand.getWorldPosition(_pa);
  base.getWorldPosition(_pb);
  tip.getWorldPosition(_pc);
  const u = _pu.subVectors(_pb, _pa).normalize();
  const n = _pn.subVectors(_pc, _pb);
  n.addScaledVector(u, -n.dot(u)).normalize();
  const n2 = normal.clone().normalize();
  const u2 = u.clone().addScaledVector(n2, -u.dot(n2)).normalize();
  _m1.makeBasis(u, n, new THREE.Vector3().crossVectors(u, n));
  _m2.makeBasis(u2, n2, new THREE.Vector3().crossVectors(u2, n2));
  _q1.setFromRotationMatrix(_m1);
  _q2.setFromRotationMatrix(_m2);
  const q = _q2.multiply(_q1.invert());
  q.slerp(_q3.identity(), 1 - weight);
  const world = arm.hand.getWorldQuaternion(new THREE.Quaternion());
  const parent = arm.hand.parent.getWorldQuaternion(new THREE.Quaternion());
  arm.hand.quaternion.copy(parent.invert().multiply(q.multiply(world)));
};

/** Bend the knees until the soles just touch the floor, sitting at seatY. */
const fitKnees = (fig, legs, seatY, floorY) => {
  const hip = Math.abs(legs.lHip[0]);
  const gap = (k) => {
    fig.apply({ ...legs, lKnee: [k, 0, 0], rKnee: [k, 0, 0] });
    fig.seatOn(seatY);
    const y0 = fig.root.position.y;
    const dy = fig.groundTo(floorY);
    fig.root.position.y = y0;
    fig.root.updateMatrixWorld(true);
    return -dy; // > 0: the soles float
  };
  let lo = 0.6;
  let hi = hip;
  if (gap(hi) > 0) return hi;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return hi;
};

// Shug: stocky, clean-shaved head, a full thick dark-brown beard, dark brows.
// A charcoal henley, jeans, brown boots.
const SHUG = {
  skin: "#e2b493",
  top: "#2f3338",
  sleeve: "#2f3338",
  bottom: "#3b4c66",
  shoes: "#4a3322",
  hair: "#2a1a11",
  brows: "#1f140d",
  iris: "#5a3a1c",
  sleeves: "long",
  collar: "#3a3f45",
};

/** Thicken the Quaternius beard into a full one: out from the jaw, and longer. */
const fillBeard = (fig) => {
  fig.model.traverse((m) => {
    if (!m.isMesh || !/beard/i.test(m.name)) return;
    const g = m.geometry.clone();
    g.computeBoundingBox();
    const { min, max } = g.boundingBox;
    const c = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const hgt = max.y - min.y;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const low = 1 - (y - min.y) / Math.max(1e-6, hgt); // 1 at the chin
      const k = 1.1 + 0.08 * low;
      p.setXYZ(i, c.x + (x - c.x) * k, y - low * low * hgt * 0.22, c.z + (z - c.z) * k);
    }
    g.computeVertexNormals();
    m.geometry = g;
    // Its ink shell shares the old geometry: point it at the new one.
    m.children.forEach((o) => o.isMesh && (o.geometry = g));
  });
};

// Denji's devil-hunter suit: white shirt, solid black trousers, a thin dark
// tie (built as a real tie below, so the shirt carries no painted stripe).
const DENJI = { ...OUTFITS.denji, bottom: "#0b0b0d", tie: null };
const TIE = "#1a1b21";

/**
 * Black cloth stays black: the film shader adds its rim and sheen on top of
 * the paint, which washes dark trousers pale pink in the dawn light, and the
 * far air greys them. A copy of the figure's material that scales all three
 * by how light the paint is.
 */
const deepBlacks = (fig) => {
  const swap = new Map();
  fig.model.traverse((m) => {
    if (!m.isMesh || !m.material?.uniforms?.uRimColor || !m.material.vertexColors) return;
    if (!swap.has(m.material)) {
      const mat = m.material.clone();
      mat.fragmentShader = mat.fragmentShader
        .replace("vec3 Hf = normalize(L + V);", "vec3 Hf = normalize(L + V);\n          float paintL = smoothstep(0.02, 0.35, dot(vPaint, vec3(0.299, 0.587, 0.114)));")
        .replace("* (0.06 + 0.3 * uSpec) * diff;", "* (0.06 + 0.3 * uSpec) * diff * mix(0.1, 1.0, paintL);")
        .replace("* uRim * (0.25 + 0.45 * (1.0 - diff));", "* uRim * (0.25 + 0.45 * (1.0 - diff)) * mix(0.1, 1.0, paintL);")
        .replace("smoothstep(uFogRange.x, uFogRange.y, vDepth) * 0.6);", "smoothstep(uFogRange.x, uFogRange.y, vDepth) * 0.6 * mix(0.08, 1.0, paintL));");
      swap.set(m.material, mat);
    }
    m.material = swap.get(m.material);
  });
};

/** A thin plate through rows of [left, right] front points, `thick` deep toward the body (+z is out). */
const plate = (rows, thick) => {
  const v = [];
  const index = [];
  rows.forEach(([l, r]) => v.push(l.x, l.y, l.z, r.x, r.y, r.z, l.x, l.y, l.z - thick, r.x, r.y, r.z - thick));
  const quad = (a, b, c, d) => index.push(a, b, c, a, c, d);
  for (let i = 0; i < rows.length - 1; i++) {
    const [fl, fr, bl, br] = [0, 1, 2, 3].map((k) => i * 4 + k);
    const [fl2, fr2, bl2, br2] = [0, 1, 2, 3].map((k) => (i + 1) * 4 + k);
    // Rows run top to bottom, left (-x) to right: front out, back in, the edges.
    quad(fl, fl2, fr2, fr);
    quad(bl, br, br2, bl2);
    quad(fl, bl, bl2, fl2);
    quad(fr, fr2, br2, br);
  }
  const last = (rows.length - 1) * 4;
  quad(0, 1, 3, 2);
  quad(last, last + 2, last + 3, last + 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
};

/**
 * Denji's necktie, on his chest bone so it rides every pose: a knot at the
 * collar, then the blade — slim under the knot, widening to a pointed tip —
 * laid on the shirt front following the chest. The blade hangs from a pivot
 * at the knot, so `swayTie` can let it swing a little and fall away from the
 * chest when he bends over. Measured off the body's bind-pose surface.
 */
const addTie = (fig, mat, line) => {
  let body = null;
  fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  const chest = fig.model.getObjectByName("spine_03") ?? fig.bones.chest ?? fig.bones.spine;
  const neckBone = fig.model.getObjectByName("neck_01") ?? fig.bones.neck;
  const bi = body ? body.skeleton.bones.indexOf(chest) : -1;
  if (bi < 0) return null;
  const geo = body.geometry;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const S = H / 1.82;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const bp = geo.attributes.position;
  /** The front of the body at height y on the centre line: its furthest-forward vertex nearby. */
  const frontAt = (y, r = 0.02 * S) => {
    for (let k = 0; k < 5; k++, r *= 1.6) {
      let z = -Infinity;
      for (let i = 0; i < bp.count; i++) {
        if (Math.abs(bp.getX(i) - cx) < r && Math.abs(bp.getY(i) - y) < r && bp.getZ(i) > cz) z = Math.max(z, bp.getZ(i));
      }
      if (Number.isFinite(z)) return z;
    }
    return max.z;
  };
  const ni = body.skeleton.bones.indexOf(neckBone);
  const y0 = ni >= 0 ? new THREE.Vector3().setFromMatrixPosition(body.skeleton.boneInverses[ni].clone().invert()).y : min.y + 0.835 * H;

  // The knot: a squat wedge, wide at the top, bulging forward in the middle.
  const kTop = y0 - 0.012 * S;
  const kBot = y0 - 0.055 * S;
  const kz = Math.max(frontAt(kTop), frontAt(kBot)) + 0.014 * S;
  const knotRows = [];
  for (let k = 0; k <= 4; k++) {
    const t = k / 4;
    const y = lerp(kTop, kBot, t);
    const w = lerp(0.02, 0.01, t) * S;
    const z = kz + Math.sin(Math.PI * t) * 0.007 * S;
    knotRows.push([v3(cx - w, y, z), v3(cx + w, y, z)]);
  }
  const knot = plate(knotRows, 0.016 * S);

  // The blade: from under the knot down to just above the belt, lying on the
  // shirt (never inside it), its width slim then widening to a pointed tip.
  const yTop = kBot + 0.006 * S;
  const yTip = min.y + 0.6 * H;
  const rows = [];
  const N = 22;
  let z = kz - 0.01 * S;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const y = lerp(yTop, yTip + 0.028 * S, t);
    z = Math.max(z - 0.004 * S, frontAt(y) + 0.008 * S);
    const w = (t < 0.18 ? lerp(0.0085, 0.0075, t / 0.18) : lerp(0.0075, 0.023, ((t - 0.18) / 0.82) ** 1.3)) * S;
    rows.push([v3(cx - w, y, z), v3(cx + w, y, z)]);
  }
  rows.push([v3(cx - 0.0004 * S, yTip, z), v3(cx + 0.0004 * S, yTip, z)]);
  const blade = plate(rows, 0.004 * S);

  const tie = mat;
  const group = new THREE.Group();
  new THREE.Matrix4().multiplyMatrices(body.skeleton.boneInverses[bi], body.bindMatrix).decompose(group.position, group.quaternion, group.scale);
  chest.add(group);
  const knotMesh = new THREE.Mesh(knot, tie);
  // The blade swings about its top, just under the knot.
  const pivot = new THREE.Group();
  pivot.position.set(cx, yTop, z - 0.002 * S);
  const bladeMesh = new THREE.Mesh(blade, tie);
  bladeMesh.position.set(-cx, -yTop, -(z - 0.002 * S));
  pivot.add(bladeMesh);
  group.add(knotMesh, pivot);
  for (const m of [knotMesh, bladeMesh]) {
    m.frustumCulled = false;
    if (line) outline(m, line);
  }
  return { group, pivot, swing: new THREE.Vector2() };
};

const _q = new THREE.Quaternion();
const _down = new THREE.Vector3();
/** Let the tie hang: a slight sway, and away from the chest when he bends over (never into it). */
const swayTie = (tie, time, dt) => {
  if (!tie) return;
  tie.group.getWorldQuaternion(_q).invert();
  _down.set(0, -1, 0).applyQuaternion(_q);
  const fwd = Math.max(0, Math.atan2(_down.z, -_down.y));
  const side = THREE.MathUtils.clamp(Math.atan2(_down.x, -_down.y), -0.12, 0.12);
  const k = 1 - Math.exp(-dt * 6);
  tie.swing.x += (Math.min(fwd, 0.9) - tie.swing.x) * k;
  tie.swing.y += (side - tie.swing.y) * k;
  tie.pivot.rotation.set(-tie.swing.x - 0.01 * (1 + Math.sin(time * 1.3)), 0, tie.swing.y + 0.035 * Math.sin(time * 1.7) + 0.012 * Math.sin(time * 3.1 + 1));
};

// ── The scene ──────────────────────────────────────────────────────────────

/** Slide 18: the summit alone, with a rose bush, and the next peak. */
export const createNextPeakScene = (stage, opts = {}) => createNextMountainScene(stage, { ...opts, variant: "peak" });

export const createNextMountainScene = (stage, { overlay, props = {}, variant = "views" } = {}) => {
  const { camera, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  let disposed = false;
  const isPeak = variant === "peak";
  const { shots: SHOTS, starts: STARTS, cycle: CYCLE } = isPeak ? plan(PEAK_SHOTS) : VIEWS;
  const STATIC_TIME = isPeak ? PEAK.sniff[0] + 1.5 : HOME_START + 9.5;

  // Slide 16, walked by the clicker (see VIEW_STOPS): a `step` prop turns the
  // loop into a playhead that runs to the step's stop and holds there. Arriving
  // on a later step (the print sheet's pre-fired beats) starts on its stop.
  const stepped = !isPeak && typeof props.step === "number";
  const stopFor = (n) => VIEW_STOPS[Math.max(0, Math.min(VIEW_STOPS.length - 1, Math.round(n)))];
  let goal = stepped ? stopFor(props.step) : 0;
  // The first stop is played into from the start of the valley, past the crane.
  let head = stepped && props.step <= 0 ? MOVE : goal;
  let headVel = 0;
  const playTo = (dt) => {
    const gap = goal - head;
    if (Math.abs(gap) < 0.002) {
      head = goal;
      headVel = 0;
      return;
    }
    // Forward at a little over real time (faster on a long run), back quicker;
    // eased off over the last second of film so each hold settles, not stops.
    const cruise = gap > 0 ? Math.max(1.4, gap / 4) : -Math.max(4, -gap / 1.2);
    const want = cruise * Math.min(1, Math.max(0.12, Math.abs(gap) / 1.0));
    if (Math.sign(headVel) !== Math.sign(want)) headVel = 0;
    headVel += (want - headVel) * (1 - Math.exp(-dt * 5));
    const move = headVel * dt;
    head = Math.abs(move) >= Math.abs(gap) ? goal : head + move;
  };

  // Terrain, painted by height: grass, rock, snow. Two heights per vertex: the
  // whole range, and the middle mountain alone; `setRange` blends them.
  const SIZE = 150;
  const ground = new THREE.PlaneGeometry(SIZE, SIZE, 300, 300);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const full = new Float32Array(pos.count);
  const solo = new Float32Array(pos.count);
  const grass = new THREE.Color("#4d6a3c");
  const stone = new THREE.Color("#5e5a57");
  const snow = new THREE.Color("#f4f2ee");
  const c = new THREE.Color();
  // Slide 18 only: the summit levels off into a small shelf, so he kneels on
  // solid, flat ground instead of the point of the peak.
  const SHELF = { y: heightAt(0, 0) - 0.05, r0: 1.7, r1: 3.2 };
  const shelf = (x, z, h) => {
    if (!isPeak) return h;
    const m = 1 - segment(Math.hypot(x, z), SHELF.r0, SHELF.r1);
    const k = m * m * (3 - 2 * m);
    return lerp(h, SHELF.y + 0.02 * Math.sin(x * 5.1) * Math.cos(z * 4.3), k);
  };
  const groundY = (x, z) => shelf(x, z, heightAt(x, z));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    full[i] = shelf(x, z, heightAt(x, z));
    solo[i] = shelf(x, z, heightAt(x, z, SOLO));
  }
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  ground.setAttribute("color", colorAttr);
  let rangeShown = -1;
  const setRange = (k) => {
    if (Math.abs(k - rangeShown) < 0.002) return;
    rangeShown = k;
    for (let i = 0; i < pos.count; i++) {
      const y = lerp(solo[i], full[i], k);
      pos.setY(i, y);
      c.copy(grass).lerp(stone, segment(y, 1.4, 4));
      c.lerp(snow, segment(y, 8.2, 9.6));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    pos.needsUpdate = true;
    colorAttr.needsUpdate = true;
    ground.computeVertexNormals();
  };
  setRange(1);
  const land = new THREE.Mesh(ground, w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.5 }));
  scene.add(land);

  // The way up from the valley: a warm trail of switchbacks, drawn on the reframe.
  const trailPts = [];
  for (let s = 0; s <= 1.0001; s += 1 / 120) {
    const r = lerp(Math.hypot(VALLEY_SPOT.x, VALLEY_SPOT.z) - 0.6, 0.15, s);
    const a = Math.atan2(VALLEY_SPOT.x, VALLEY_SPOT.z) + Math.sin(s * Math.PI * 5) * 0.55 * (1 - s * 0.7);
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    trailPts.push(v3(x, heightAt(x, z) + 0.12, z));
  }
  const trailCurve = new THREE.CatmullRomCurve3(trailPts);
  const TRAIL_SEG = 400;
  const trail = new THREE.Mesh(
    new THREE.TubeGeometry(trailCurve, TRAIL_SEG, 0.03, 6, false),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc46b").multiplyScalar(1.35), fog: false }),
  );
  const TRAIL_INDEX = trail.geometry.index.count;
  trail.geometry.setDrawRange(0, 0);
  trail.visible = false;
  scene.add(trail);

  // A rose bush on the summit shelf, for the peak shot: one big, dense shrub
  // in a pocket of soil and rock, off his front-left, on the side away from
  // the camera, with one bloom on a long cane leaning in toward him. He turns
  // to it as he kneels, so the camera sees him smell it in profile.
  const AHEAD = v3(PEAKS[1].x, 0, PEAKS[1].z).normalize();
  const ASIDE = v3(AHEAD.z, 0, -AHEAD.x);
  const BUSH = { turn: -0.85, dist: 1.0, rx: 0.5, ry: 0.42, rz: 0.46, lift: 0.36 };
  const bush = new THREE.Group();
  bush.visible = isPeak;
  scene.add(bush);
  if (isPeak) {
    const bx = (AHEAD.x * Math.cos(BUSH.turn) + ASIDE.x * Math.sin(BUSH.turn)) * BUSH.dist;
    const bz = (AHEAD.z * Math.cos(BUSH.turn) + ASIDE.z * Math.sin(BUSH.turn)) * BUSH.dist;
    bush.position.set(bx, groundY(bx, bz) - 0.01, bz);
    // Local frame: +z toward him, so the sniffing bloom is easy to place.
    bush.rotation.y = Math.atan2(-bx, -bz);
    const addB = maker(w.line);
    const tinted = (geo, color) => {
      const col = new Float32Array(geo.attributes.position.count * 3);
      for (let k = 0; k < col.length; k += 3) col.set([color.r, color.g, color.b], k);
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      return geo;
    };
    const place = (geo, at, q, sc) => geo.applyMatrix4(new THREE.Matrix4().compose(at, q, sc));
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const tmp = new THREE.Color();
    // The bed: a low mound of dark, turned earth, sunk into the snow at its
    // edge so it sits in the ground, not on it. Lumpy, and mottled darker and
    // lighter; clods and a few pebbles on top, roots running out into it, and
    // a ring of stones round it as a border. The canes start inside the mound.
    const BED = { r: 0.56, h: 0.13, sink: 0.06 };
    const bedY = (r) => BED.h * Math.max(0, 1 - (r / BED.r) ** 2) ** 0.7 - BED.sink * (r / BED.r) ** 3;
    const bedProfile = [];
    for (let k = 0; k <= 14; k++) {
      const r = BED.r * (1 - k / 14) + 0.04;
      bedProfile.push(new THREE.Vector2(Math.max(0.0001, r * (1 - k / 14) ** 0.15), bedY(r) - (k === 0 ? 0.03 : 0)));
    }
    const bed = new THREE.LatheGeometry(bedProfile, 48);
    {
      // Lumps by angle in whole multiples, so the lathe's seam stays closed.
      const bp = bed.attributes.position;
      const col = new Float32Array(bp.count * 3);
      const dark = new THREE.Color("#2e1f15");
      const mid = new THREE.Color("#4a3322");
      const dry = new THREE.Color("#6a4c34");
      for (let k = 0; k < bp.count; k++) {
        const x = bp.getX(k);
        const z = bp.getZ(k);
        const r = Math.hypot(x, z);
        const ang = Math.atan2(z, x);
        const lump = Math.sin(ang * 9 + r * 17) * Math.cos(ang * 5 - r * 23) * 0.5 + Math.sin(ang * 14 + r * 31) * 0.3;
        const edge = segment(r, 0.05, BED.r * 0.8);
        bp.setY(k, bp.getY(k) + lump * 0.018 * edge);
        const grain = 0.5 + 0.5 * Math.sin(ang * 23 + r * 47) * Math.cos(ang * 17 - r * 61);
        tmp.copy(dark).lerp(mid, grain).lerp(dry, Math.max(0, lump) * 0.6 * edge);
        col.set([tmp.r, tmp.g, tmp.b], k * 3);
      }
      bed.setAttribute("color", new THREE.BufferAttribute(col, 3));
      bed.computeVertexNormals();
    }
    addB(bush, bed, w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.8, rim: 0.25 }));
    // Clods of earth and pebbles, resting on the mound.
    const clods = [];
    const clodGeo = new THREE.DodecahedronGeometry(1, 0);
    for (let k = 0; k < 46; k++) {
      const pebble = k % 4 === 3;
      const a = hash(k * 2.3 + 120) * Math.PI * 2;
      const r = 0.12 + Math.sqrt(hash(k * 1.9 + 121)) * (BED.r - 0.16);
      const sc = pebble ? 0.014 + hash(k + 122) * 0.012 : 0.012 + hash(k + 123) * 0.018;
      e.set(hash(k + 124) * 3, hash(k + 125) * 3, hash(k + 126) * 3);
      const g = place(clodGeo.clone(), v3(Math.cos(a) * r, bedY(r) + sc * 0.3, Math.sin(a) * r), q.setFromEuler(e), v3(sc * 1.25, sc * (pebble ? 0.7 : 0.85), sc));
      const color = pebble ? tmp.set("#8b8580").lerp(new THREE.Color("#b3a58f"), hash(k + 127)) : tmp.set("#3a281b").lerp(new THREE.Color("#5c4130"), hash(k + 128));
      clods.push(tinted(g, color));
    }
    addB(bush, mergeGeometries(clods), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.4 }), { ink: false });
    clodGeo.dispose();
    // Roots: from the crown, out across the top of the mound, diving under.
    const roots = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + hash(k + 140) * 0.6;
      const reach = 0.3 + hash(k + 141) * 0.18;
      const along = (f) => {
        const r = 0.03 + reach * f;
        const wob = Math.sin(f * 6 + k) * 0.04 * f;
        return v3(Math.cos(a + wob) * r, bedY(r) + 0.012 - f * f * 0.05, Math.sin(a + wob) * r);
      };
      const curve = new THREE.CatmullRomCurve3([0, 0.3, 0.6, 1].map(along));
      roots.push(tinted(new THREE.TubeGeometry(curve, 12, 0.011 - k * 0.0006, 5, false), tmp.set("#5b4632")));
    }
    addB(bush, mergeGeometries(roots), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.4 }));
    // The border: a ring of flat stones bedded into the snow at the mound's foot.
    const rockMat = w.ink({ tint: "#6b6560", rim: 0.5 });
    const RING = 24;
    for (let k = 0; k < RING; k++) {
      const a = (k / RING) * Math.PI * 2 + hash(k + 40) * 0.12;
      const r = BED.r + 0.035 + hash(k + 41) * 0.02;
      const sc = 0.045 + hash(k + 42) * 0.02;
      addB(bush, new THREE.DodecahedronGeometry(1, 0), rockMat, {
        at: [Math.cos(a) * r, sc * 0.25 - 0.015, Math.sin(a) * r],
        scale: [sc * 1.5, sc * 0.75, sc * 1.05],
        rot: [hash(k) * 0.4, Math.PI / 2 - a + hash(k + 1) * 0.4, hash(k + 2) * 0.3],
      });
    }
    // Woody canes from the crown of the roots out to the shell.
    const canes = [];
    const caneEnds = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + hash(k + 60) * 0.4;
      const up = 0.35 + hash(k + 61) * 0.55;
      const end = v3(Math.cos(a) * BUSH.rx * 0.85 * Math.cos(up), BUSH.lift + Math.sin(up) * BUSH.ry * 0.9, Math.sin(a) * BUSH.rz * 0.85 * Math.cos(up));
      const mid = v3(end.x * 0.35, end.y * 0.55, end.z * 0.35);
      const tube = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(0, 0.06, 0), mid, end), 8, 0.013, 5, false);
      canes.push(tinted(tube, tmp.set("#4a3826")));
      caneEnds.push(end);
    }
    // The long cane that leans in toward him, carrying the bloom he smells.
    const SNIFF = v3(0.01, 0.88, 0.64); // just under his nose as he leans in
    canes.push(tinted(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v3(0, 0.03, 0.05), v3(0.03, 0.75, 0.25), SNIFF), 12, 0.012, 5, false), tmp.set("#4a3826")));
    addB(bush, mergeGeometries(canes), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.4 }), { ink: false });
    // Foliage: a dense, rounded shell of leaf clusters, darker inside.
    const leaves = [];
    const leafGeo = new THREE.SphereGeometry(1, 6, 4);
    for (let k = 0; k < 520; k++) {
      const u = hash(k * 1.3 + 1);
      const v = hash(k * 2.7 + 3);
      const th = u * Math.PI * 2;
      const ph = Math.acos(1 - 1.15 * v); // the top and sides, thin underneath
      const depth = 0.72 + 0.28 * Math.sqrt(hash(k + 9));
      const n = v3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      const at = v3(n.x * BUSH.rx * depth, BUSH.lift + n.y * BUSH.ry * depth, n.z * BUSH.rz * depth);
      if (at.y < 0.06) continue;
      e.set((hash(k + 5) - 0.5) * 2.4, hash(k + 6) * 6.3, (hash(k + 7) - 0.5) * 2.4);
      const sc = 0.75 + hash(k + 8) * 0.5;
      const g = place(leafGeo.clone(), at, q.setFromEuler(e), v3(0.062 * sc, 0.016 * sc, 0.04 * sc));
      tmp.set("#24481f").lerp(new THREE.Color("#4a8a3c"), Math.min(1, (depth - 0.72) / 0.28 * 0.7 + hash(k + 11) * 0.35 + Math.max(0, n.y) * 0.2));
      leaves.push(tinted(g, tmp));
    }
    addB(bush, mergeGeometries(leaves), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.55 }), { ink: false });
    // Blooms: cups of overlapping petals round a dark heart, facing out of
    // the shell, mostly on top; a few tight buds between them.
    const petals = [];
    const hearts = [];
    const petalGeo = new THREE.SphereGeometry(1, 8, 6);
    const bloomAt = (at, out, size, seed) => {
      const base = new THREE.Quaternion().setFromUnitVectors(UP, out.clone().normalize());
      hearts.push(tinted(place(petalGeo.clone(), at.clone().addScaledVector(out, 0.012 * size), base, v3(0.02 * size, 0.024 * size, 0.02 * size)), tmp.set("#6e0818")));
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + hash(seed + k) * 0.4;
        const local = v3(Math.cos(a) * 0.024 * size, 0.014 * size, Math.sin(a) * 0.024 * size).applyQuaternion(base);
        const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, 0.42));
        const qq = base.clone().multiply(tilt);
        tmp.set("#b30f2a").lerp(new THREE.Color("#e2263f"), hash(seed + k + 20));
        petals.push(tinted(place(petalGeo.clone(), at.clone().add(local), qq, v3(0.03 * size, 0.032 * size, 0.017 * size)), tmp));
      }
    };
    for (let k = 0; k < 34; k++) {
      const th = hash(k * 3.1 + 70) * Math.PI * 2;
      const ph = Math.acos(1 - 0.95 * hash(k * 1.7 + 71));
      const n = v3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      const at = v3(n.x * BUSH.rx * 1.02, BUSH.lift + n.y * BUSH.ry * 1.02, n.z * BUSH.rz * 1.02);
      bloomAt(at, n, 0.85 + hash(k + 72) * 0.55, k * 13);
    }
    bloomAt(SNIFF.clone().add(v3(0, 0.015, 0)), v3(0, 0.6, 1), 1.4, 999);
    addB(bush, mergeGeometries(petals), w.ink({ tint: "#ffffff", vertexColors: true, tone: 1.1, rim: 0.9 }));
    addB(bush, mergeGeometries(hearts), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.6 }), { ink: false });
    const buds = [];
    for (let k = 0; k < 10; k++) {
      const th = hash(k * 5.3 + 90) * Math.PI * 2;
      const ph = Math.acos(1 - 0.8 * hash(k * 2.1 + 91));
      const n = v3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      const at = v3(n.x * BUSH.rx * 1.04, BUSH.lift + n.y * BUSH.ry * 1.04, n.z * BUSH.rz * 1.04);
      const qb = new THREE.Quaternion().setFromUnitVectors(UP, n);
      buds.push(tinted(place(petalGeo.clone(), at, qb, v3(0.014, 0.026, 0.014)), tmp.set("#8a0c22")));
      buds.push(tinted(place(petalGeo.clone(), at.clone().addScaledVector(n, -0.012), qb, v3(0.017, 0.012, 0.017)), tmp.set("#2f5a2a")));
    }
    addB(bush, mergeGeometries(buds), w.ink({ tint: "#ffffff", vertexColors: true, rim: 0.6 }), { ink: false });
    leafGeo.dispose();
    petalGeo.dispose();
  }

  // ── Home: the bench, the shack ──
  const home = new THREE.Group();
  home.position.set(BENCH.x, GROUND, BENCH.z);
  home.rotation.y = BENCH_YAW;
  scene.add(home);
  home.updateMatrixWorld(true);
  const H = (x, y, z) => home.localToWorld(v3(x, y, z));
  const add = maker(w.line);
  const wood = w.ink({ tint: "#7a5a3c", rim: 0.6 });
  const plank = w.ink({ tint: "#8d6a48", rim: 0.6 });
  const roofMat = w.ink({ tint: "#4a3a33", rim: 0.6 });
  const bark = w.ink({ tint: "#5b4330", rim: 0.5 });

  // A thick plank on two sawn logs.
  const benchLen = BENCH_X[1] - BENCH_X[0];
  add(home, new THREE.BoxGeometry(benchLen, 0.07, 0.38), plank, { at: [(BENCH_X[0] + BENCH_X[1]) / 2, SEAT_Y - 0.035, 0] });
  const logH = SEAT_Y - 0.07;
  [BENCH_X[0] + 0.28, BENCH_X[1] - 0.26].forEach((x) => add(home, new THREE.CylinderGeometry(0.17, 0.18, logH, 14), bark, { at: [x, logH / 2, 0], scale: [1, 1, 0.9] }));

  // The shack, behind and to the side: tin roof, a warm window, the door.
  const shack = new THREE.Group();
  shack.position.set(SHACK.x, 0, SHACK.z);
  shack.rotation.y = SHACK.yaw;
  home.add(shack);
  add(shack, new THREE.BoxGeometry(3.4, 2.3, 2.8), wood, { at: [0, 1.15, 0] });
  const roof = add(shack, new THREE.ConeGeometry(2.7, 1.3, 4), roofMat, { at: [0, 2.95, 0], rot: [0, Math.PI / 4, 0] });
  roof.scale.set(1, 1, 0.86);
  const windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.52), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb860").multiplyScalar(2.2) }));
  windowGlow.position.set(0.75, 1.35, 1.405);
  shack.add(windowGlow);
  add(shack, new THREE.PlaneGeometry(0.72, 0.6), w.flat, { at: [0.75, 1.35, 1.402], ink: false });
  add(shack, new THREE.PlaneGeometry(0.7, 1.75), w.flat, { at: [-0.8, 0.875, 1.405], ink: false });

  // ── Pochita on the bench, Luna on the grass ──
  // The shared Pochita, at bench size: about 33 cm to the top of his handle.
  const pochita = buildPochita(w, { size: 0.15 });
  pochita.pup.position.set(AT.pochita.x, SEAT_Y, AT.pochita.z);
  pochita.pup.rotation.y = AT.pochita.yaw;
  home.add(pochita.pup);
  const luna = buildLuna(w);
  luna.dog.position.set(AT.luna.x, 0, AT.luna.z);
  luna.dog.rotation.y = AT.luna.yaw;
  luna.dog.scale.setScalar(1.0);
  home.add(luna.dog);

  // The eagle, only in the view from above: it circles below the camera,
  // between it and the peak, so the shot looks down past its wings.
  const eagle = buildEagle(w);
  eagle.bird.scale.setScalar(isPeak ? PEAK_EAGLE.scale : EAGLE.scale);
  eagle.bird.visible = false;
  scene.add(eagle.bird);

  // ── Denji and Shug ──
  const top = new THREE.Vector3(0, groundY(0, 0), 0);
  const next = PEAKS[1];
  const summit = v3(0, PEAKS[0].h, 0);
  const cast = { denji: null, shug: null };
  const LEGS = {
    denji: { lHip: [-1.5, 0, 0.1], rHip: [-1.5, 0, -0.1], lKnee: [1.4, 0, 0], rKnee: [1.4, 0, 0] },
    shug: { lHip: [-1.5, 0, 0.16], rHip: [-1.5, 0, -0.16], lKnee: [1.4, 0, 0], rKnee: [1.4, 0, 0] },
  };
  const seatUp = (fig, name, at) => {
    fig.root.rotation.y = 0; // home is already turned to the mountain
    home.add(fig.root);
    const k = fitKnees(fig, LEGS[name], SEAT_Y, 0);
    fig.legs = { ...LEGS[name], lKnee: [k, 0, 0], rKnee: [k, 0, 0] };
    fig.apply(fig.legs);
    fig.root.position.set(0, 0, 0);
    fig.root.updateMatrixWorld(true);
    const hips = fig.root.worldToLocal(fig.bones.hips.getWorldPosition(new THREE.Vector3()));
    hips.multiply(fig.root.scale);
    fig.seat = { x: at.x - hips.x, z: at.z - hips.z };
    fig.root.position.set(fig.seat.x, 0, fig.seat.z);
    fig.seatOn(SEAT_Y);
    fig.root.updateMatrixWorld(true);
    fig.eye = fig.bones.head.getWorldPosition(new THREE.Vector3()).add(v3(0, 0.07, 0));
  };
  const ready = Promise.all([
    createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.8, rim: 1.0 }, outfit: DENJI, dress: { spikes: true }, hands: "relaxed" }),
    createModelFigure({ height: 1.78, hair: ["HairBeard", "EyebrowsRegular"], line: w.line, ink: { tone: 0.82, rim: 0.9 }, outfit: SHUG, hands: "relaxed" }),
  ]).then(([denji, shug]) => {
    if (disposed) return cast;
    fillBeard(shug);
    shug.root.scale.set(1.07, 1, 1.07); // stocky
    for (const fig of [denji, shug]) fig.ik = createArmIK(fig);
    deepBlacks(denji);
    denji.tie = addTie(denji, w.ink({ tint: TIE, tone: 0.75, rim: 0.35, spec: 0.5 }), w.line);
    seatUp(denji, "denji", AT.denji);
    seatUp(shug, "shug", AT.shug);
    [denji, shug].forEach((f) => w.register(f.root));
    cast.denji = denji;
    cast.shug = shug;
    w.palette(SHOTS[0].light);
    w.sync();
    return cast;
  });

  // The fog: one layer of soft sprites lying in the valley, kept out of the yard.
  const fog = createParticles({ count: 260, blending: "normal" });
  scene.add(fog.points);
  let seed = 0;
  const puff = () => {
    let x = 0;
    let z = 0;
    for (let tries = 0; tries < 6; tries++) {
      seed += 1;
      x = (hash(seed) - 0.5) * 80;
      z = (hash(seed * 3.1) - 0.5) * 70 + 4;
      if (Math.hypot(x - BENCH.x, z - BENCH.z) > 15) break;
    }
    fog.emit({
      position: [x, Math.max(1.2, heightAt(x, z) + 0.6) * 0.5 + hash(seed * 7.7) * 1.6, z],
      velocity: [0.35, 0, 0.08],
      life: 16,
      size: 7 + hash(seed * 1.3) * 7,
      color: "#e9e6ee",
      alpha: 0.26,
    });
  };
  for (let i = 0; i < 260; i++) {
    puff();
    fog.step(16 / 260);
  }
  let puffDebt = 0;

  // Long fog range: this set is a hundred metres across.
  w.inks.forEach((m) => m.uniforms.uFogRange.value.set(18, 110));

  const caption = createCaption(overlay, { x: 4, y: 6 });
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    fog.resize(stage.size.height, camera.fov, stage.renderer.getPixelRatio());
    w.sync();
  });

  // ── Cameras ──
  // Home, in bench space: A over their shoulders at the mountain, B in front.
  const A0 = v3(0.45, 2.1, -7.6);
  const A1 = v3(0.38, 1.95, -6.6);
  const lookA = (p) => p.clone().add(v3(Math.sin(-0.045), Math.tan(0.05), Math.cos(-0.045)).multiplyScalar(8));
  const B0 = v3(0.12, 1.05, 4.15);
  const B1 = v3(0.08, 1.0, 3.7);
  const LOOK_B = v3(0.06, 0.68, 0);
  const HOME_DUR = VIEWS.shots[HOME_IDX].dur;
  const homeCam = (into) => {
    const a = A0.clone().lerp(A1, segment(into, 0, SWING[0]));
    const la = lookA(a);
    if (into <= SWING[0]) return { p: H(a.x, a.y, a.z), l: H(la.x, la.y, la.z) };
    const b = B0.clone().lerp(B1, segment(into, SWING[1], HOME_DUR));
    if (into >= SWING[1]) return { p: H(b.x, b.y, b.z), l: H(LOOK_B.x, LOOK_B.y, LOOK_B.z) };
    // Round the Luna side in an arc, never through the bench.
    const k = smooth(segment(into, SWING[0], SWING[1]));
    const angA = Math.atan2(a.x, a.z);
    let angB = Math.atan2(b.x, b.z);
    if (angB > angA) angB -= Math.PI * 2;
    const th = lerp(angA, angB, k);
    const r = lerp(Math.hypot(a.x, a.z), Math.hypot(b.x, b.z), k);
    const y = lerp(a.y, b.y, k) + Math.sin(k * Math.PI) * 0.35;
    const l = la.clone().lerp(LOOK_B, k);
    return { p: H(Math.sin(th) * r, y, Math.cos(th) * r), l: H(l.x, l.y, l.z) };
  };

  const dir = new THREE.Vector3(next.x - top.x, 0, next.z - top.z).normalize();
  const side = new THREE.Vector3(dir.z, 0, -dir.x);
  const nextLook = new THREE.Vector3(next.x, next.h * 0.55, next.z);
  /** Over his shoulder at the next peak; `push` dollies in past him. */
  const overShoulder = (push = 0) => {
    const p = top.clone().addScaledVector(dir, -3.4 + push).addScaledVector(side, 1.4 - push * 0.3).add(v3(0, 1.9, 0));
    return { p, l: nextLook.clone() };
  };
  /**
   * The peak shot orbits him: in front and to one side (his face, the rose bush,
   * the sky), then round behind his shoulder to the next peak. An arc around
   * him, never through the rock.
   */
  const orbitAt = (ang, r, y) => top.clone().add(v3(Math.sin(ang) * r, y, Math.cos(ang) * r));
  const ahead = Math.atan2(dir.x, dir.z);
  const FRONT = { ang: ahead + 0.62, r: 3.3, y: 1.35 };
  const BACK = { ang: ahead + Math.PI - 0.4, r: 3.5, y: 1.95 };
  // Slide 18's eagle: straight behind him (from the camera) mid-way through
  // the front view, out past the next peak as the camera swings round.
  const peakEagle = {
    ...PEAK_EAGLE,
    c: [top.x, top.y + PEAK_EAGLE.alt, top.z],
    start: Math.PI / 2 - (FRONT.ang + Math.PI) - PEAK_EAGLE.speed * 6,
  };
  const camAt = (shot, time, into) => {
    if (shot.peak) {
      const k = smooth(segment(into, PEAK.swing[0], PEAK.swing[1]));
      // Closer and lower while he kneels.
      const close = smooth(segment(into, PEAK.kneel[0], PEAK.sniff[0])) * (1 - smooth(segment(into, PEAK.stand[0], PEAK.stand[1])));
      const front = { r: FRONT.r - 1.0 * close, y: FRONT.y - 0.55 * close };
      const ang = lerp(FRONT.ang, BACK.ang, k);
      const p = orbitAt(ang, lerp(front.r, BACK.r, k), lerp(front.y, BACK.y, k) + Math.sin(k * Math.PI) * 0.5);
      const faceLook = top.clone().addScaledVector(dir, 0.25 + 0.2 * close).add(v3(0, 1.05 - 0.55 * close, 0));
      return { p, l: faceLook.lerp(nextLook, k) };
    }
    if (shot.summit === "next") return overShoulder(lerp(0, 0.7, smooth(into / shot.dur)));
    if (shot.summit) return overShoulder(0);
    if (shot.home) return homeCam(into);
    if (shot.wide) {
      const a = 0.6 + time * 0.06;
      return { p: new THREE.Vector3(Math.sin(a) * 52, 22, Math.cos(a) * 52), l: new THREE.Vector3(0, 5, -6) };
    }
    return { p: new THREE.Vector3(...shot.pos), l: new THREE.Vector3(...shot.look) };
  };

  // ── Per-frame posing ──
  const gaze = (fig, target) => {
    const d = target.clone().sub(fig.eye).applyAxisAngle(UP, -BENCH_YAW);
    return { yaw: Math.atan2(d.x, d.z), pitch: -Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  };
  const torso = (pose, { yaw, pitch }, lean = 0.05, roll = 0) => {
    pose.spine = [lean + pitch * 0.08, yaw * 0.16, roll];
    pose.chest = [pitch * 0.1, yaw * 0.2, roll * 0.6];
    pose.neck = [pitch * 0.35, yaw * 0.28, 0];
    pose.head = [pitch * 0.47, yaw * 0.36, 0];
  };
  const mixLook = (a, b, k) => ({ yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k) });
  const wp = (o, out = new THREE.Vector3()) => o.getWorldPosition(out);
  // Scratch for the helpers below; the per-frame targets have their own.
  const tmp = { a: v3(0, 0, 0), b: v3(0, 0, 0), c: v3(0, 0, 0), d: v3(0, 0, 0) };
  const at = { pp: v3(0, 0, 0), dPet: v3(0, 0, 0), lf: v3(0, 0, 0), sPet: v3(0, 0, 0) };
  const DOWN = v3(0, -1, 0);

  /** Hand resting on the thigh, just behind the knee. */
  const lapTarget = (fig, s, out) => {
    wp(fig.bones[`${s}Hip`], tmp.a);
    wp(fig.bones[`${s}Knee`], tmp.b);
    out.copy(tmp.a).lerp(tmp.b, 0.62).add(v3(0, 0.1, 0));
    const outward = v3(s === "l" ? 1 : -1, 0, 0).applyAxisAngle(UP, BENCH_YAW);
    return out.addScaledVector(outward, 0.035);
  };
  /** Wrist placed so the palm lies on `point`, fingers running away from the shoulder. */
  const petTarget = (fig, s, point, out) => {
    wp(fig.ik.arms[s].sh, tmp.c);
    const run = tmp.d.subVectors(point, tmp.c).setY(0).normalize();
    return out.copy(point).addScaledVector(run, -0.07).add(v3(0, 0.03, 0));
  };

  const HINT = { l: v3(0.8, -0.3, -0.5).normalize(), r: v3(-0.8, -0.3, -0.5).normalize() };
  const posed = { lap: v3(0, 0, 0), pet: v3(0, 0, 0), hand: v3(0, 0, 0) };
  const sitter = (fig, look, reach) => {
    // reach: { side, point, weight, lean, roll }
    const pose = { ...fig.legs };
    torso(pose, look, 0.05 + reach.lean, reach.roll);
    fig.apply(pose);
    fig.root.position.set(fig.seat.x, 0, fig.seat.z);
    fig.seatOn(SEAT_Y);
    fig.root.updateMatrixWorld(true);
    for (const s of ["l", "r"]) {
      lapTarget(fig, s, posed.lap);
      let target = posed.lap;
      if (s === reach.side && reach.weight > 0) {
        petTarget(fig, s, reach.point, posed.pet);
        // Lift off the lap, over, and down onto the back.
        target = posed.hand.copy(posed.lap).lerp(posed.pet, reach.weight).add(v3(0, Math.sin(reach.weight * Math.PI) * 0.08, 0));
      }
      fig.ik.solve(pose, s, target, HINT[s]);
    }
    fig.apply(pose);
    fig.root.updateMatrixWorld(true);
    palmTo(fig, reach.side === "l" ? "r" : "l", DOWN, 0);
    palmTo(fig, reach.side, DOWN, reach.weight);
  };

  // Summit poses. STAND looks out; UP is both fists in the air; KNEEL is one
  // knee down on the shelf, weight over the knee, the head bowed to the rose.
  const S_STAND = { head: [-0.22, 0, 0], neck: [-0.08, 0, 0], lShoulder: [0.05, 0, 0.1], rShoulder: [0.05, 0, -0.1] };
  const S_UP = { spine: [-0.08, 0, 0], head: [-0.32, 0, 0], neck: [-0.1, 0, 0], lShoulder: [-2.65, 0, 0.45], rShoulder: [-2.65, 0, -0.45], lElbow: [-0.35, 0, 0], rElbow: [-0.35, 0, 0] };
  const S_LOW = { spine: [0.06, 0, 0], head: [0.28, 0, 0], neck: [0.12, 0, 0], lShoulder: [0.08, 0, 0.08], rShoulder: [0.08, 0, -0.08] };
  const S_KNEEL = {
    spine: [0.3, 0, 0],
    chest: [0.14, 0, 0],
    neck: [0.26, 0, 0],
    head: [0.42, 0, 0],
    lHip: [-1.55, 0, 0.08],
    lKnee: [1.65, 0, 0],
    // The back shin lies along the ground, so the knee and toes both rest on it.
    rHip: [0.1, 0, -0.08],
    rKnee: [1.47, 0, 0],
    lShoulder: [-0.5, 0, 0.12],
    lElbow: [-0.9, 0, 0],
    rShoulder: [-0.2, 0, -0.15],
    rElbow: [-0.4, 0, 0],
  };
  const JOINTS = ["spine", "chest", "neck", "head", "lShoulder", "rShoulder", "lElbow", "rElbow", "lHip", "rHip", "lKnee", "rKnee"];
  const mixPose = (a, b, k) => {
    const out = {};
    for (const j of JOINTS) {
      const pa = a[j] ?? [0, 0, 0];
      const pb = b[j] ?? [0, 0, 0];
      if (!a[j] && !b[j]) continue;
      out[j] = [lerp(pa[0], pb[0], k), lerp(pa[1], pb[1], k), lerp(pa[2], pb[2], k)];
    }
    return out;
  };
  const standAt = (fig, x, z, face, pose, floorY) => {
    if (fig.root.parent !== scene) scene.add(fig.root);
    fig.root.rotation.y = Math.atan2(face.x - x, face.z - z);
    fig.root.position.set(x, 0, z);
    fig.apply(pose);
    fig.ik.arms.l.hand.quaternion.copy(fig.ik.arms.l.rest);
    fig.ik.arms.r.hand.quaternion.copy(fig.ik.arms.r.rest);
    fig.groundTo(floorY);
  };
  const standOnSummit = (fig, time, pose = S_STAND, face = next, sink = 0) => {
    const breath = { spine: [Math.sin(time * 1.2) * 0.008, 0, 0] };
    const p = { ...pose, spine: (pose.spine ?? [0, 0, 0]).map((v, n) => v + breath.spine[n]) };
    standAt(fig, top.x, top.z, face, p, top.y - 0.03 - sink);
  };
  /** How far down into the kneel he is on slide 18 (0 standing, 1 kneeling). */
  const kneelOf = (into) => smooth(segment(into, PEAK.kneel[0], PEAK.kneel[1])) * (1 - smooth(segment(into, PEAK.stand[0], PEAK.stand[1])));
  /** Where he faces on slide 18: the next peak, turning to the rose bush as he kneels. */
  const peakFace = (into) => {
    const d = dir.clone().applyAxisAngle(UP, BUSH.turn * kneelOf(into));
    return top.clone().addScaledVector(d, 10);
  };
  /** Slide 15's summit: fists up, then down, then the range comes back. */
  const cheerPose = (into) => {
    const [a0, a1, b0, b1] = CHEER;
    const up = smooth(segment(into, a0, a1)) * (1 - smooth(segment(into, b0, b1)));
    const low = smooth(segment(into, b0, b1)) * (1 - smooth(segment(into, RISE[0], RISE[0] + 1)));
    const pump = Math.sin(Math.max(0, into - a1) * 7) * 0.12 * up * (into < b0 ? 1 : 0);
    const p = mixPose(mixPose(S_STAND, S_LOW, low), S_UP, up);
    p.lShoulder[0] += pump;
    p.rShoulder[0] += pump;
    return p;
  };
  /** Slide 17's summit: fists up, kneel, smell the rose, stand, look out. */
  const peakPose = (into) => {
    const [a0, a1, b0, b1] = PEAK.cheer;
    const up = smooth(segment(into, a0, a1)) * (1 - smooth(segment(into, b0, b1)));
    const kneel = kneelOf(into);
    const sniff = segment(into, PEAK.sniff[0], PEAK.sniff[1]) > 0 && into < PEAK.sniff[1] ? 1 : 0;
    const pump = Math.sin(Math.max(0, into - a1) * 7) * 0.12 * up * (into < b0 ? 1 : 0);
    const p = mixPose(mixPose(S_STAND, S_KNEEL, kneel), S_UP, up);
    p.lShoulder[0] += pump;
    p.rShoulder[0] += pump;
    // A slow breath in, over the bloom.
    const breathIn = sniff * Math.sin(segment(into, PEAK.sniff[0], PEAK.sniff[1]) * Math.PI);
    p.head[0] += 0.12 * breathIn;
    p.spine[0] += 0.06 * breathIn;
    return p;
  };

  const p = new THREE.Vector3();
  const l = new THREE.Vector3();
  let shown = -1;
  const sunHome = (() => {
    // Low and warm, from in front of them and off to the right.
    const d = v3(-0.45, 0.42, 0.78).applyAxisAngle(UP, BENCH_YAW);
    return [d.x, d.y, d.z];
  })();

  const update = (rawTime, dt) => {
    const time = staticMode ? STATIC_TIME : rawTime;
    if (stepped) {
      if (staticMode) head = goal;
      else playTo(Math.min(dt, 0.1));
    }
    const t = stepped ? head : ((time % CYCLE) + CYCLE) % CYCLE;
    let i = 0;
    while (i < SHOTS.length - 1 && t >= STARTS[i + 1]) i++;
    const into = t - STARTS[i];
    const fromIdx = (i + SHOTS.length - 1) % SHOTS.length;
    const from = SHOTS[fromIdx];
    const shot = SHOTS[i];
    const k = staticMode ? 1 : easeInOutCubic(segment(into, 0, MOVE));
    const a = camAt(from, time, from.dur);
    const b = camAt(shot, time, into);
    p.lerpVectors(a.p, b.p, k);
    l.lerpVectors(a.l, b.l, k);
    // A crane, not a cut: lift through the middle of the move.
    p.y += Math.sin(k * Math.PI) * (shot.lift ?? 4);
    const par = (k > 0.5 ? shot.parallax : from.parallax) ?? 1;
    p.x += pointer.x * 0.6 * par;
    p.y += pointer.y * 0.3 * par;
    camera.position.copy(p);
    camera.lookAt(l);

    // The light changes halfway through the move. The valley's reframe warms
    // it in place: same mountain, a different way of seeing it.
    const lightIdx = k > 0.5 ? i : fromIdx;
    const lit = SHOTS[lightIdx];
    const warm = lit.reframe ? smooth(segment(lightIdx === i ? into : lit.dur, REFRAME[0], REFRAME[1])) : 0;
    const look = `${lightIdx}:${warm.toFixed(3)}`;
    if (look !== shown) {
      shown = look;
      w.palette(warm > 0 ? blendLight(lit.light, lit.reframe, warm) : lit.light);
      const sun = lit.home ? sunHome : lit.sun;
      const to = SHOTS[(lightIdx + 1) % SHOTS.length].sun ?? sun;
      w.light(...sun.map((v, n) => lerp(v, to[n], warm)));
      w.inks.forEach((m) => m.uniforms.uFogRange.value.set(18, 110));
      w.page({ mode: "still" });
    }

    // The range: gone while he stands on top (it sinks as the camera arrives),
    // back when he looks up and sees the next one.
    if (!isPeak) {
      const range = shot.solo ? (into < MOVE ? 1 - k : smooth(segment(into, RISE[0], RISE[1]))) : 1;
      setRange(range);
    }
    // The trail up, drawn on the valley's reframe.
    trail.visible = Boolean(lit.reframe);
    if (trail.visible) {
      const drawn = smooth(segment(lightIdx === i ? into : lit.dur, TRAIL[0], TRAIL[1]));
      trail.geometry.setDrawRange(0, Math.floor((drawn * TRAIL_INDEX) / 6 / 6) * 6 * 6);
    }

    // Home beats. Outside the home shot the four sit as at its end.
    const hc = lit.home ? (lightIdx === i ? into : HOME_DUR) : HOME_DUR;
    const turn = smooth(segment(hc, TURN[0], TURN[1]));
    const touch = smooth(segment(hc, TURN[0] + 0.5, TURN[1] + 0.3));
    const settled = segment(hc, TURN[1], TURN[1] + 0.6);

    // Pochita: looks up at Denji the whole time; leans into the hand,
    // squints happily, a little open-mouthed pant, the tail wagging.
    pochita.pup.updateMatrixWorld(true);
    const breathe = Math.sin(time * 2.4) * 0.015;
    pochita.body.scale.set(1 + breathe, 1 - breathe * 0.5, 1);
    const pochitaLook = lerp(-0.2, 0.08, touch);
    pochita.body.rotation.set(pochitaLook, 0.12 * turn, -0.12 * touch);
    const eyeOpen = lerp(1, 0.3, touch) * (1 - 0.9 * pulse(hc, 3.1, 0.06));
    pochita.eyes.forEach((e) => e.scale.set(1, eyeOpen, 1));
    const pant = touch * (0.55 + 0.45 * Math.sin(time * 9)) * 0.6;
    pochita.setMouth(pant);
    const wagP = lerp(0.25, 1, touch);
    pochita.tail.rotation.set(0.15 * wagP, Math.sin(time * lerp(3, 12, touch)) * 0.5 * wagP, 0);

    // Luna: looking out at the mountain, ears up; then up at Shug, ears
    // easing back, tail sweeping the grass; a blink.
    const lunaOut = { yaw: 0.25, pitch: -0.12 };
    let lunaAt = lunaOut;
    if (cast.shug) {
      const face = cast.shug.eye.clone();
      const local = luna.dog.worldToLocal(face).sub(luna.head.position);
      lunaAt = { yaw: THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -1.2, 1.2), pitch: -Math.atan2(local.y, Math.hypot(local.x, local.z)) };
    }
    const lk = smooth(segment(hc, TURN[0] + 0.25, TURN[1] + 0.2));
    luna.head.rotation.set(lerp(lunaOut.pitch, lunaAt.pitch * 0.8, lk) + Math.sin(time * 1.1) * 0.02, lerp(lunaOut.yaw, lunaAt.yaw * 0.85, lk), lerp(0, 0.18, lk));
    luna.body.rotation.set(0, lerp(0, -0.12, lk), 0);
    luna.ears.forEach((e, s) => (e.rotation.x = lerp(-0.15, -0.5, touch) + Math.sin(time * 0.7 + s) * 0.03));
    const lb = 1 + Math.sin(time * 1.9) * 0.012;
    luna.body.scale.set(lb, 1, lb);
    const blink = 1 - 0.85 * Math.max(pulse(hc, 2.4, 0.05), pulse(hc, 8.6, 0.05), pulse(hc, 10.3, 0.05));
    luna.eyes.forEach((e) => (e.scale.y = 0.0115 * blink));
    const wagL = lerp(0.18, 0.55, touch);
    luna.tail.rotation.set(0, Math.sin(time * lerp(2.2, 5.5, touch)) * wagL, 0);

    // The two men.
    const { denji, shug } = cast;
    if (denji && shug) {
      // Denji: on the summit, or on the bench.
      const where = lit.denji;
      const beat = lightIdx === i ? into : lit.dur;
      denji.root.visible = where !== "hidden";
      if (where === "summit") standOnSummit(denji, time);
      else if (where === "cheer") standOnSummit(denji, time, cheerPose(beat));
      // Kneeling, he settles into the snow so the back knee rests on it.
      else if (where === "peak") standOnSummit(denji, time, peakPose(beat), peakFace(beat), 0.06 * kneelOf(beat));
      else if (where === "valley") {
        // At the foot, looking up at it; on the reframe, his chin comes up.
        const up = smooth(segment(beat, REFRAME[0], REFRAME[1]));
        const pose = { spine: [lerp(0.08, -0.04, up), 0, 0], neck: [lerp(-0.05, -0.18, up), 0, 0], head: [lerp(-0.2, -0.42, up), 0, 0], lShoulder: [0.05, 0, lerp(0.08, 0.14, up)], rShoulder: [0.05, 0, lerp(-0.08, -0.14, up)] };
        standAt(denji, VALLEY_SPOT.x, VALLEY_SPOT.z, top, pose, heightAt(VALLEY_SPOT.x, VALLEY_SPOT.z) - 0.03);
      } else {
        if (denji.root.parent !== home) {
          home.add(denji.root);
          denji.root.rotation.y = 0;
        }
        // His eyes on the summit; then down to Pochita.
        const up = gaze(denji, summit);
        const pp = wp(pochita.back, at.pp).add(v3(0, 0.02, 0.06));
        const down = gaze(denji, pp);
        const look = mixLook(up, down, turn);
        look.yaw += Math.sin(time * 0.6) * 0.015;
        const stroke = Math.sin(time * 1.4) * 0.03 * settled;
        const pet = wp(pochita.back, at.dPet).add(v3(0, 0, stroke).applyAxisAngle(UP, BENCH_YAW + AT.pochita.yaw));
        sitter(denji, look, { side: "r", point: pet, weight: touch, lean: 0.1 * turn, roll: 0.14 * turn });
      }
      // Shug: takes in the mountain; then turns to Luna, a hand on her back.
      const out = gaze(shug, v3(0, 6.5, 0));
      const lf = wp(luna.head, at.lf).add(v3(0, 0.05, 0));
      const toLuna = gaze(shug, lf);
      const look = mixLook(out, toLuna, turn);
      look.pitch += Math.sin(time * 0.5) * 0.01;
      const stroke = Math.sin(time * 1.1 + 1) * 0.025 * settled;
      const pet = wp(luna.back, at.sPet).add(v3(0, 0, stroke).applyAxisAngle(UP, BENCH_YAW + AT.luna.yaw));
      sitter(shug, look, { side: "l", point: pet, weight: touch, lean: 0.12 * turn, roll: -0.16 * turn });
      swayTie(denji.tie, time, dt);
    }

    windowGlow.material.color.setRGB(2.2, 1.55, 0.8).multiplyScalar(0.92 + Math.sin(time * 7) * 0.04 + Math.sin(time * 13) * 0.03);

    puffDebt += dt * (260 / 16);
    while (puffDebt >= 1) {
      puffDebt -= 1;
      puff();
    }
    fog.step(dt);

    // The eagle: visible from the start of the move into the view from above
    // until the move out of it, gliding round its circle, banked into the
    // turn, wings flexing on the air.
    const eagleShot = shot.eagle ? i : from.eagle ? fromIdx : -1;
    // On slide 18 it circles the summit the whole shot, once a loop.
    if (isPeak) {
      eagle.bird.visible = true;
      flyEagle(eagle, peakEagle, t);
    } else {
      eagle.bird.visible = eagleShot >= 0 && (shot.eagle || k < 0.6);
      // Held on a step, it keeps circling on the clock instead of freezing.
      if (eagle.bird.visible) flyEagle(eagle, EAGLE, stepped ? time * 0.8 : shot.eagle ? into : from.dur + into);
    }

    // Captions: one per shot, or timed lines within it.
    let text = shot.caption;
    let fade = segment(into, MOVE * 0.6, MOVE) * (1 - segment(into, shot.dur - 0.35, shot.dur));
    if (shot.captions) {
      text = null;
      fade = 0;
      for (const [c0, c1, line] of shot.captions) {
        if (into >= c0 - 0.01 && into <= c1) {
          text = line;
          fade = segment(into, c0, c0 + 0.4) * (1 - segment(into, c1 - 0.35, c1));
        }
      }
    }
    caption.update({ text, size: 2.6, opacity: staticMode ? (text ? 1 : 0) : fade });
  };

  return {
    ready,
    update,
    setProps(next = {}) {
      if (stepped && typeof next.step === "number") goal = stopFor(next.step);
    },
    dispose() {
      disposed = true;
      unsubscribeResize();
      caption.dispose();
    },
  };
};
