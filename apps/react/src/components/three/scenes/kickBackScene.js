import * as THREE from "three";
import { canvasTexture, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, lightBeam, segment, softDot, createParticles } from "../kit";
import { outline, outlineMaterial } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createChainsawMan } from "../chainsawMan";
import { createSfx } from "../sfx";
import { createCuts, createInkWorld } from "../rezeKit";

/**
 * KICK BACK — Chainsaw Man, episode one. The yakuza lured Denji to an empty
 * warehouse; the Zombie Devil turned them, they cut him to pieces and threw
 * him in a dumpster with Pochita. Pochita became his heart.
 *
 *   0    – 3.0   the warehouse at night: moonlight through the high windows,
 *                chains and hooks, a green dumpster. The zombies (the yakuza,
 *                still in their suits) shamble toward it; the Zombie Devil
 *                looms at the back
 *   3.0  – 4.6   the lid bangs open; Denji pops up out of the trash, vaults
 *                the rim and lands in front of them
 *   4.6  – 6.0   his fist closes on the starter grip in his chest; he draws
 *                and YANKS the cord
 *   6.0  – 7.2   the change: chainsaw head, blades out of both forearms, the
 *                engine catches — VRRRN!!
 *   7.2  – 11.3  through them: a cut on every beat, blood, a whip pan
 *   11.3 – 12.25 the Zombie Devil, from his feet: he crouches
 *   12.25 – 13.6 he leaps; one diagonal cut through it at 12.95
 *   13.6 – 15.0  it comes apart: the top half slides off the cut and falls,
 *                the legs fold
 *   15.0 – 18.0  he stands among the bodies, saws idling, blood raining;
 *                dip to black and loop
 *
 * Reduced motion holds 13.3: him in the air, the devil split behind the cut.
 * Bodies are Quaternius's CC0 rigs with painted suits; Denji is chainsawMan.js;
 * the warehouse and the Zombie Devil are built here.
 */

const CYCLE = 18;
const STATIC_TIME = 13.3;
const TC = 12.95; // the cut through the Zombie Devil

// Night in the warehouse: moonlight, blue-grey air, red for the blood.
const NIGHT = { ground: "#05070d", lines: "#8ea2c8", accent: "#c8102e", rim: "#9fb6e8", shade: "#45557a" };
const SLASH = { ground: "#140406", lines: "#ff9a8a", accent: "#ff1d3d", rim: "#ff6a6a", shade: "#7a3a46" };
const MOON_DIR = [0.62, 0.72, -0.3];

// The room: floor at y 0, side walls at ±X_WALL, back wall far down -z.
const X_WALL = 8;
const BACK_Z = -12.5;
const FRONT_Z = 6.5;
const ROOF = 8;

// The dumpster: centre (0, DUMP_Z), its front (toward the zombies) at -z.
const DUMP_Z = 1.6;
const DUMP_W = 1.9;
const DUMP_D = 1.2;
const DUMP_FLOOR = 0.2;
const DUMP_RIM = 1.35;
// Where Denji lands, and the Zombie Devil's feet.
const LAND = new THREE.Vector3(0, 0, 0.15);
const DEVIL_AT = new THREE.Vector3(0.6, 0, -8.6);

// ── Poses (figure.js: x < 0 swings a limb forward; +z raises the left arm) ──
const CROUCH_IN = {
  spine: [0.7, 0, 0],
  head: [0.4, 0, 0],
  lShoulder: [-0.7, 0, 0.2],
  lElbow: [-1.6, 0, 0],
  rShoulder: [-0.7, 0, -0.2],
  rElbow: [-1.6, 0, 0],
  lHip: [-1.7, 0, 0.12],
  lKnee: [2.3, 0, 0],
  rHip: [-1.7, 0, -0.12],
  rKnee: [2.3, 0, 0],
};
// Standing in the trash, both hands on the rim.
const POP = {
  spine: [0.28, 0, 0],
  head: [-0.12, 0, 0],
  lShoulder: [-0.85, 0, 0.32],
  lElbow: [-0.95, 0, 0],
  rShoulder: [-0.85, 0, -0.32],
  rElbow: [-0.95, 0, 0],
  lHip: [-0.05, 0, 0.06],
  rHip: [-0.05, 0, -0.06],
};
// Over the rim: knees tucked, hands pushing off.
const VAULT = {
  spine: [0.45, 0, 0],
  head: [-0.3, 0, 0],
  lShoulder: [-0.35, 0, 0.5],
  lElbow: [-0.4, 0, 0],
  rShoulder: [-0.35, 0, -0.5],
  rElbow: [-0.4, 0, 0],
  lHip: [-1.5, 0, 0.12],
  lKnee: [1.9, 0, 0],
  rHip: [-1.2, 0, -0.12],
  rKnee: [1.7, 0, 0],
};
const LAND_CROUCH = {
  spine: [0.5, 0, 0],
  head: [-0.4, 0, 0],
  lShoulder: [-0.35, 0, 0.55],
  lElbow: [-0.5, 0, 0],
  rShoulder: [-0.3, 0, -0.5],
  rElbow: [-0.45, 0, 0],
  lHip: [-1.15, 0, 0.25],
  lKnee: [1.65, 0, 0],
  rHip: [-0.65, 0, -0.25],
  rKnee: [1.25, 0, 0],
};
// The cord (denjiScene's beats): fist on the grip at his sternum, draw, yank.
const REST = {
  spine: [0.06, 0, 0],
  head: [0.1, 0, 0],
  lShoulder: [0.05, 0, 0.12],
  lElbow: [-0.2, 0, 0],
  rShoulder: [-0.6, 0, -0.4],
  rElbow: [-1.7, 0, 1.2],
  lHip: [0, 0, 0.08],
  rHip: [0, 0, -0.08],
};
const DRAW = { ...REST, spine: [0.15, 0.2, 0], rShoulder: [-0.9, 0, -0.15], rElbow: [-2.45, 0.3, 0], lift: -0.03 };
const YANK = {
  spine: [-0.05, -0.35, 0],
  chest: [0, -0.25, 0],
  head: [-0.15, -0.2, 0],
  lShoulder: [-0.2, 0, 0.35],
  lElbow: [-0.4, 0, 0],
  rShoulder: [-0.3, 0, -1.6],
  rElbow: [-0.1, 0, 0],
  lHip: [-0.1, 0, 0.12],
  lKnee: [0.15, 0, 0],
  rHip: [0.05, 0, -0.14],
};
const STANCE = {
  spine: [0.32, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.32, 0, 0],
  lShoulder: [-0.75, 0, 0.75],
  lElbow: [-1.0, 0, 0],
  rShoulder: [-0.75, 0, -0.75],
  rElbow: [-1.0, 0, 0],
  lHip: [-0.45, 0, 0.32],
  lKnee: [0.85, 0, 0],
  rHip: [-0.2, 0, -0.3],
  rKnee: [0.65, 0, 0],
  lift: -0.17,
};
// The run between cuts: low, blades trailing.
const RUN = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.55, 0, 0],
    chest: [0.1, 0, 0],
    head: [-0.55, 0, 0],
    lShoulder: [0.55, 0, 0.4],
    lElbow: [-0.5, 0, 0],
    rShoulder: [0.6, 0, -0.4],
    rElbow: [-0.45, 0, 0],
    lHip: [-0.35 - 0.55 * s, 0, 0.1],
    lKnee: [0.5 + 0.55 * Math.max(0, s), 0, 0],
    rHip: [-0.35 + 0.55 * s, 0, -0.1],
    rKnee: [0.5 + 0.55 * Math.max(0, -s), 0, 0],
    lift: -0.08,
  };
};
// A cut: the arm goes up and out, then sweeps the bar across the body.
const WIND = [
  { ...STANCE, spine: [0.25, 0.45, 0], rShoulder: [-1.2, 0, -1.9], rElbow: [-0.5, 0, 0], lShoulder: [-1.0, 0, 0.5], lElbow: [-1.3, 0, 0] },
  { ...STANCE, spine: [0.25, -0.45, 0], lShoulder: [-1.2, 0, 1.9], lElbow: [-0.5, 0, 0], rShoulder: [-1.0, 0, -0.5], rElbow: [-1.3, 0, 0] },
];
const CUT = [
  { ...STANCE, spine: [0.4, -0.5, 0], head: [-0.3, 0.3, 0], rShoulder: [-1.4, 0.6, 0.5], rElbow: [-0.15, 0, 0], lShoulder: [-0.4, 0, 1.0], lElbow: [-0.9, 0, 0], lHip: [-0.8, 0, 0.2], lKnee: [1.0, 0, 0] },
  { ...STANCE, spine: [0.4, 0.5, 0], head: [-0.3, -0.3, 0], lShoulder: [-1.4, -0.6, -0.5], lElbow: [-0.15, 0, 0], rShoulder: [-0.4, 0, -1.0], rElbow: [-0.9, 0, 0], rHip: [-0.8, 0, -0.2], rKnee: [1.0, 0, 0] },
];
const CROUCH_LEAP = {
  spine: [0.75, 0, 0],
  head: [-0.7, 0, 0],
  lShoulder: [0.9, 0, 0.35],
  lElbow: [-0.3, 0, 0],
  rShoulder: [0.9, 0, -0.35],
  rElbow: [-0.3, 0, 0],
  lHip: [-1.45, 0, 0.22],
  lKnee: [2.0, 0, 0],
  rHip: [-1.3, 0, -0.22],
  rKnee: [1.85, 0, 0],
};
// In the air: both bars up over his right shoulder, then down through it.
const AIR_RAISE = {
  spine: [-0.15, 0.3, 0],
  head: [-0.25, 0, 0],
  lShoulder: [-2.7, 0, -0.2],
  lElbow: [-0.4, 0, 0],
  rShoulder: [-2.9, 0, -0.55],
  rElbow: [-0.25, 0, 0],
  lHip: [-1.2, 0, 0.1],
  lKnee: [1.7, 0, 0],
  rHip: [-0.5, 0, -0.1],
  rKnee: [1.2, 0, 0],
};
const AIR_SLASH = {
  spine: [0.6, -0.35, 0],
  head: [-0.4, 0, 0],
  lShoulder: [-0.5, 0, 1.0],
  lElbow: [-0.2, 0, 0],
  rShoulder: [-0.9, 0.6, 0.45],
  rElbow: [-0.2, 0, 0],
  lHip: [-0.9, 0, 0.15],
  lKnee: [1.1, 0, 0],
  rHip: [-0.2, 0, -0.15],
  rKnee: [0.6, 0, 0],
};
const IDLE = (t) => ({
  spine: [0.14 + Math.sin(t * 1.7) * 0.02, 0, 0],
  chest: [0.05, 0, 0],
  head: [-0.22 + Math.sin(t * 1.7 + 0.6) * 0.03, 0, 0],
  lShoulder: [-0.2, 0, 0.42],
  lElbow: [-0.35, 0, 0],
  rShoulder: [-0.2, 0, -0.42],
  rElbow: [-0.35, 0, 0],
  lHip: [-0.05, 0, 0.17],
  rHip: [0.02, 0, -0.17],
});

// The zombies: slumped, heads lolling, a dragging shamble.
const SHAMBLE = (p, v) => {
  const s = Math.sin(p);
  return {
    spine: [0.36 + v.hunch, 0.08 * s, 0.1 * v.lean],
    neck: [0.15, 0, 0],
    head: [0.38 + 0.08 * Math.sin(p * 0.5 + v.k), 0.25 * v.tilt, 0.35 * v.tilt],
    lShoulder: [v.reach ? -1.05 + 0.08 * s : 0.12 * s, 0, 0.12],
    lElbow: [v.reach ? -0.25 : -0.3, 0, 0],
    rShoulder: [v.reach > 1 ? -0.95 - 0.08 * s : -0.12 * s, 0, -0.1],
    rElbow: [-0.25, 0, 0],
    lHip: [0.22 * s - 0.15, 0, 0.06],
    lKnee: [0.25 + Math.max(0, -s) * 0.4, 0, 0],
    rHip: [-0.22 * s - 0.15, 0, -0.06],
    rKnee: [0.25 + Math.max(0, s) * 0.4, 0, 0],
  };
};
const FALLEN = {
  spine: [-0.25, 0, 0.15],
  head: [-0.4, 0.5, 0],
  lShoulder: [-0.4, 0, 1.3],
  lElbow: [-0.5, 0, 0],
  rShoulder: [-1.3, 0, -0.9],
  rElbow: [-0.3, 0, 0],
  lHip: [-0.25, 0, 0.2],
  lKnee: [0.25, 0, 0],
  rHip: [0.05, 0, -0.15],
  rKnee: [0.15, 0, 0],
};

// Eight of them, in their suits. [x, z, height, suit, skin, tie, hair, delay, variation]
const ZOMBIES = [
  [-1.3, -2.6, 1.8, "#24262b", "#8f9a86", "#5a1418", "HairSimpleParted", 0.0, { hunch: 0.05, lean: 1, tilt: 0.6, reach: 1, k: 0 }],
  [1.4, -2.9, 1.86, "#2e2a26", "#98a08b", "#15161b", "HairBuzzed", 0.3, { hunch: 0.15, lean: -1, tilt: -0.5, reach: 0, k: 1 }],
  [-0.2, -3.6, 1.76, "#1f2433", "#87927f", "#2a3550", "HairSimpleParted", 0.6, { hunch: 0.0, lean: 0.4, tilt: 0.2, reach: 2, k: 2 }],
  [2.6, -4.0, 1.9, "#3a3530", "#a0a693", "#6b5a1e", "HairBeard", 0.2, { hunch: 0.2, lean: -0.6, tilt: -0.8, reach: 0, k: 3 }],
  [-2.7, -4.2, 1.82, "#2b2b2e", "#8c967f", "#15161b", "HairBuzzed", 0.9, { hunch: 0.1, lean: 0.8, tilt: 0.7, reach: 1, k: 4 }],
  [0.9, -4.9, 1.78, "#41403c", "#949c88", "#5a1418", "HairSimpleParted", 0.4, { hunch: 0.08, lean: -0.3, tilt: -0.3, reach: 0, k: 5 }],
  [-1.4, -5.6, 1.84, "#26302c", "#8a9482", "#3b1f3a", "HairBuzzed", 1.1, { hunch: 0.18, lean: 0.5, tilt: 0.5, reach: 2, k: 6 }],
  [2.0, -5.9, 1.8, "#332524", "#9aa28e", "#15161b", "HairSimpleParted", 0.7, { hunch: 0.04, lean: -0.9, tilt: -0.6, reach: 0, k: 7 }],
];
const SPEED = 0.22;
const STOP = 1.35;
const RAMPAGE = 7.2;
// The order he cuts them, and when.
const ORDER = [0, 2, 1, 3, 5, 4, 6, 7];
const HIT0 = 7.45;
const HIT_GAP = 0.5;

/** Shortest-way blend between two headings. */
const lerpAngle = (a, b, t) => {
  const d = ((((b - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
};

/** Where zombie i stands at time c (before he reaches them). */
const zombieSpot = (i, c, out = new THREE.Vector3()) => {
  const [x, z, , , , , , delay] = ZOMBIES[i];
  const dx = LAND.x - x;
  const dz = LAND.z - z;
  const dist = Math.hypot(dx, dz);
  const d = Math.min(SPEED * Math.max(0, Math.min(c, RAMPAGE) - delay), dist - STOP);
  return out.set(x + (dx / dist) * d, 0, z + (dz / dist) * d);
};

// The cuts: where he stands for each and which way he faces.
const HITS = (() => {
  let prev = LAND.clone();
  return ORDER.map((zi, n) => {
    const z = zombieSpot(zi, RAMPAGE);
    const at = z.clone().add(prev.clone().sub(z).setY(0).normalize().multiplyScalar(0.95));
    const hit = { zi, t: HIT0 + n * HIT_GAP, at, yaw: Math.atan2(z.x - at.x, z.z - at.z), side: n % 2, zombie: z };
    prev = at;
    return hit;
  });
})();
const LAST_HIT = HITS[HITS.length - 1].t;
// The leap: from LAUNCH, feet at SLASH_FEET at the cut, down to TOUCH.
const LAUNCH = new THREE.Vector3(0.9, 0, -5.3);
const SLASH_FEET = new THREE.Vector3(0.65, 2.3, -6.95);
const TOUCH = new THREE.Vector3(0.0, 0, -6.0);
const YAW_DEVIL = Math.atan2(DEVIL_AT.x - LAUNCH.x, DEVIL_AT.z - LAUNCH.z);

export const createKickBackScene = (stage, { overlay } = {}) => {
  const { camera, renderer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  let disposed = false;

  const add = (mesh, parent = scene, line = true) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  const box = (sx, sy, sz, mat, x, y, z, parent = scene, line = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    return add(m, parent, line);
  };
  const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    concrete: w.ink({ tint: "#6d6e70", tone: 0.55, rim: 0.12 }),
    wall: w.ink({ tint: "#474b54", tone: 0.5, rim: 0.15 }),
    rib: w.ink({ tint: "#3a3e46", tone: 0.5, rim: 0.2 }),
    steel: w.ink({ tint: "#5a616c", tone: 0.62, rim: 0.45, spec: 0.4 }),
    rust: w.ink({ tint: "#6e4a36", tone: 0.5, rim: 0.3 }),
    green: w.ink({ tint: "#2f6a44", tone: 0.72, rim: 0.45, spec: 0.3 }),
    greenDark: w.ink({ tint: "#1c3a27", tone: 0.5, rim: 0.3 }),
    black: w.ink({ tint: "#17181b", tone: 0.4, rim: 0.3 }),
    bag: w.ink({ tint: "#1e2024", tone: 0.5, rim: 0.5, spec: 0.6 }),
    chain: w.ink({ tint: "#7c8088", tone: 0.7, rim: 0.6, spec: 0.8 }),
    crate: w.ink({ tint: "#7a5f40", tone: 0.55, rim: 0.3 }),
    drum: w.ink({ tint: "#3e5a78", tone: 0.55, rim: 0.4, spec: 0.4 }),
    flesh: w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.85, rim: 0.45, spec: 0.25 }),
  };
  const glass = basic("#5d72a0");
  const stain = basic("#2a0306", { transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

  // ── The warehouse ────────────────────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X_WALL * 2, FRONT_Z - BACK_Z), M.concrete);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = (FRONT_Z + BACK_Z) / 2;
  scene.add(floor);
  // Old oil stains and seams in the slab.
  const oil = basic("#1d1f24", { transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.4 + hash(i * 3.1) * 0.9, 20), oil);
    s.rotation.x = -Math.PI / 2;
    s.scale.set(1, 0.5 + hash(i * 7.7) * 0.6, 1);
    s.position.set((hash(i * 1.7) - 0.5) * 13, 0.003, BACK_Z + 1 + hash(i * 5.3) * 15);
    scene.add(s);
  }
  for (let i = 0; i < 6; i++) box(X_WALL * 2, 0.004, 0.025, M.black, 0, 0.002, BACK_Z + 2 + i * 3, scene, false);

  // Walls: corrugated sides, a back wall, high windows full of moonlight.
  box(0.3, ROOF, FRONT_Z - BACK_Z, M.wall, -X_WALL, ROOF / 2, (FRONT_Z + BACK_Z) / 2, scene, false);
  box(0.3, ROOF, FRONT_Z - BACK_Z, M.wall, X_WALL, ROOF / 2, (FRONT_Z + BACK_Z) / 2, scene, false);
  box(X_WALL * 2, ROOF, 0.3, M.wall, 0, ROOF / 2, BACK_Z, scene, false);
  box(X_WALL * 2, ROOF, 0.3, M.wall, 0, ROOF / 2, FRONT_Z, scene, false);
  box(X_WALL * 2, 0.2, FRONT_Z - BACK_Z, M.black, 0, ROOF, (FRONT_Z + BACK_Z) / 2, scene, false);
  for (let z = BACK_Z + 0.5; z < FRONT_Z; z += 0.5) {
    for (const s of [-1, 1]) box(0.06, 4.6, 0.12, M.rib, s * (X_WALL - 0.18), 2.3, z, scene, false);
  }
  for (let x = -X_WALL + 0.5; x < X_WALL; x += 0.5) box(0.12, 4.6, 0.06, M.rib, x, 2.3, BACK_Z + 0.18, scene, false);
  const windows = [];
  const window_ = (x, z, ry, wdt) => {
    const g = new THREE.Group();
    g.position.set(x, 6.15, z);
    g.rotation.y = ry;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(wdt, 1.7), glass);
    g.add(pane);
    for (let k = 0; k <= 4; k++) box(0.05, 1.7, 0.06, M.steel, -wdt / 2 + (k * wdt) / 4, 0, 0.02, g, false);
    for (const y of [-0.85, 0, 0.85]) box(wdt, 0.05, 0.06, M.steel, 0, y, 0.02, g, false);
    // A few panes broken out.
    const dark = basic("#0b0e16");
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(wdt / 4 - 0.06, 0.8), dark);
    hole.position.set(-wdt / 2 + wdt / 8 + Math.floor(hash(x + z) * 4) * (wdt / 4), 0.43, 0.01);
    g.add(hole);
    scene.add(g);
    windows.push(g);
  };
  for (const x of [-5, -1.6, 1.8, 5.2]) window_(x, BACK_Z + 0.17, 0, 2.6);
  for (const z of [-9.5, -5.5, -1.5, 2.5]) {
    window_(X_WALL - 0.17, z, -Math.PI / 2, 2.6);
    window_(-X_WALL + 0.17, z, Math.PI / 2, 2.6);
  }
  // The moon, through the back windows.
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), basic("#b9c6de"));
  moon.position.set(-1.0, 6.5, BACK_Z - 3);
  scene.add(moon);
  // Moonlight: shafts down from the right-hand windows, pale patches on the floor.
  const MOON_RAY = new THREE.Vector3(-MOON_DIR[0], -MOON_DIR[1], -MOON_DIR[2]).normalize();
  const patch = basic("#8fa6d6", { transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const z of [-9.5, -5.5, -1.5, 2.5]) {
    const top = new THREE.Vector3(X_WALL - 0.3, 6.1, z);
    const t = top.y / -MOON_RAY.y;
    const end = top.clone().addScaledVector(MOON_RAY, t);
    const beam = lightBeam({ from: top.toArray(), to: end.toArray(), radiusFrom: 0.9, radiusTo: 1.5, color: "#a9bbe0" });
    beam.material.uniforms.uIntensity.value = 0.05;
    scene.add(beam);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.0), patch);
    p.rotation.x = -Math.PI / 2;
    p.position.set(end.x, 0.005, end.z);
    scene.add(p);
  }

  // Steel I-beam columns and the roof trusses on them.
  const column = (x, z) => {
    box(0.08, ROOF, 0.32, M.steel, x, ROOF / 2, z);
    for (const s of [-1, 1]) box(0.3, ROOF, 0.04, M.steel, x, ROOF / 2, z + s * 0.16, scene, false);
    box(0.5, 0.12, 0.5, M.rust, x, 0.06, z);
  };
  for (const z of [-9, -5, -1, 3]) {
    column(-5.6, z);
    column(5.6, z);
    box(X_WALL * 2, 0.32, 0.12, M.steel, 0, 7.3, z, scene, false);
    for (let k = -7; k <= 7; k += 1.75) {
      const diag = box(0.06, 1.2, 0.06, M.steel, k, 7.0, z, scene, false);
      diag.rotation.z = (k / 1.75) % 2 ? 0.6 : -0.6;
    }
  }
  // A runway beam down the middle with chains and hooks hanging from it.
  box(0.18, 0.3, BACK_Z * -1 + 4, M.steel, -2.6, 7.0, -4.2);
  const linkGeo = new THREE.TorusGeometry(0.045, 0.012, 6, 12);
  const hookGeo = new THREE.TorusGeometry(0.09, 0.022, 6, 16, Math.PI * 1.4);
  const chains = [];
  [
    [-2.6, -2.2, 3.4],
    [-2.6, 0.9, 2.9],
    [-2.6, -6.4, 3.8],
    [3.6, -3.4, 3.2],
  ].forEach(([x, z, bottom], ci) => {
    const g = new THREE.Group();
    g.position.set(x, 6.85, z);
    const n = Math.round((6.85 - bottom) / 0.075);
    for (let k = 0; k < n; k++) {
      const link = new THREE.Mesh(linkGeo, M.chain);
      link.position.y = -k * 0.075;
      link.rotation.set(0, k % 2 ? Math.PI / 2 : 0, Math.PI / 2);
      g.add(link);
    }
    const hook = new THREE.Mesh(hookGeo, M.steel);
    hook.position.y = -n * 0.075 - 0.08;
    hook.rotation.z = Math.PI * 0.8;
    add(hook, g);
    scene.add(g);
    chains.push({ g, phase: ci * 1.7 });
  });

  // Junk along the walls: crates, drums, a pallet stack.
  [
    [-6.8, -10.8, 1.1],
    [-5.9, -11.0, 0.9],
    [-6.6, -9.8, 0.8],
    [6.7, 1.2, 1.0],
    [6.9, 4.4, 1.2],
    [6.5, -11.2, 1.1],
  ].forEach(([x, z, s], i) => {
    const b = box(s, s, s, M.crate, x, s / 2, z);
    b.rotation.y = hash(i * 9.1) * 0.6;
  });
  [
    [-7.0, -6.6],
    [-6.5, -7.1],
    [-7.1, -7.6],
    [6.9, -7.4],
    [6.4, -7.9],
  ].forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 18), M.drum);
    d.position.set(x, 0.45, z);
    add(d);
  });

  // ── The dumpster ─────────────────────────────────────────────────────────
  const dumpster = new THREE.Group();
  dumpster.position.set(0, 0, DUMP_Z);
  scene.add(dumpster);
  const T = 0.05;
  const wallH = DUMP_RIM - DUMP_FLOOR + 0.05;
  const wallY = DUMP_FLOOR - 0.05 + wallH / 2;
  box(DUMP_W, T, DUMP_D, M.greenDark, 0, DUMP_FLOOR - 0.025, 0, dumpster);
  box(DUMP_W, wallH, T, M.green, 0, wallY, -DUMP_D / 2, dumpster);
  box(DUMP_W, wallH, T, M.green, 0, wallY, DUMP_D / 2, dumpster);
  for (const s of [-1, 1]) {
    box(T, wallH, DUMP_D, M.green, (s * DUMP_W) / 2, wallY, 0, dumpster);
    // Fork pockets.
    box(0.12, 0.14, DUMP_D * 0.9, M.greenDark, s * (DUMP_W / 2 + 0.06), 0.65, 0, dumpster);
  }
  // Ribs on the front and the rolled lip round the top.
  for (const x of [-0.6, 0, 0.6]) box(0.08, wallH * 0.9, 0.06, M.green, x, wallY, -DUMP_D / 2 - 0.04, dumpster);
  box(DUMP_W + 0.1, 0.07, 0.09, M.green, 0, DUMP_RIM, -DUMP_D / 2, dumpster);
  box(DUMP_W + 0.1, 0.07, 0.09, M.green, 0, DUMP_RIM, DUMP_D / 2, dumpster);
  for (const s of [-1, 1]) box(0.09, 0.07, DUMP_D, M.green, (s * (DUMP_W + 0.02)) / 2, DUMP_RIM, 0, dumpster);
  for (const [x, z] of [
    [-0.8, -0.45],
    [0.8, -0.45],
    [-0.8, 0.45],
    [0.8, 0.45],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), M.black);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.08, z);
    add(wheel, dumpster);
  }
  // Black bags in the trash.
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), M.bag);
    b.scale.set(1, 0.6, 0.9);
    b.position.set(-0.6 + i * 0.4, DUMP_FLOOR + 0.18, (hash(i * 4.4) - 0.5) * 0.5);
    add(b, dumpster);
  }
  // Two lids hinged on the back edge.
  const lids = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set((s * DUMP_W) / 4, DUMP_RIM + 0.04, DUMP_D / 2);
    box(DUMP_W / 2 - 0.02, 0.04, DUMP_D + 0.06, M.greenDark, 0, 0, -DUMP_D / 2, pivot);
    dumpster.add(pivot);
    return pivot;
  });
  const dumpShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), basic("#000000", { map: softDot(), transparent: true, opacity: 0.6, depthWrite: false }));
  dumpShadow.rotation.x = -Math.PI / 2;
  dumpShadow.position.set(0, 0.006, DUMP_Z);
  scene.add(dumpShadow);

  // ── The Zombie Devil ─────────────────────────────────────────────────────
  // A bloated grey-green torso with an old man's sagging face in the middle
  // of it, wide staring eyes; one arm up over the top of the face, one hanging;
  // a small bandaged head on top with the red brain showing; underneath, a mass
  // of red flesh and tendrils for legs. Faces +z. The cut is a plane through
  // P0: everything is built in two halves along it so it can come apart.
  const devil = (() => {
    const root = new THREE.Group();
    root.position.copy(DEVIL_AT);
    const body = new THREE.Group();
    root.add(body);
    const P0 = new THREE.Vector3(0, 3.55, 0.0);
    const N = new THREE.Vector3(-0.6, 1, 0).normalize(); // up-left of the cut is the top half
    const C = {
      skin: new THREE.Color("#959e8a"),
      face: new THREE.Color("#a6aa95"),
      cut: new THREE.Color("#9c1a1f"),
      red: new THREE.Color("#7a1c1e"),
      dark: new THREE.Color("#5e1416"),
      bright: new THREE.Color("#93302c"),
      slit: new THREE.Color("#3a0b0e"),
      white: new THREE.Color("#ebe6d8"),
      pupil: new THREE.Color("#0d0b0a"),
      bandage: new THREE.Color("#c3baa2"),
      brain: new THREE.Color("#8e2b2b"),
      bump: new THREE.Color("#ad4640"),
      hair: new THREE.Color("#2c2a28"),
      tooth: new THREE.Color("#c9b98a"),
      mouth: new THREE.Color("#1a0607"),
    };
    const paint = (geo, color) => {
      const n = geo.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) color.toArray(a, i * 3);
      geo.setAttribute("color", new THREE.BufferAttribute(a, 3));
      return geo;
    };
    /** A geometry placed in devil space: scale, then rotate, then move. */
    const place = (geo, [x, y, z], [sx, sy, sz] = [1, 1, 1], rot = [0, 0, 0]) => {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(sx, sy, sz));
      geo.applyMatrix4(m);
      return geo;
    };
    /** Lumpy: push the surface in and out a little, for the bloat. */
    const lumpy = (geo, amount, seed) => {
      const p = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const k = 1 + amount * Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 2) * Math.sin(v.z * 3.3 + seed * 3);
        v.multiplyScalar(k);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    };
    /** A limb segment: a capsule from a to b. */
    const limb = (a, b, r) => {
      const len = a.distanceTo(b);
      const geo = new THREE.CapsuleGeometry(r, len, 6, 14);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      geo.applyQuaternion(q);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      geo.translate(mid.x, mid.y, mid.z);
      return geo;
    };
    /**
     * Half of a painted geometry: the vertices on the far side of the cut
     * are pressed flat onto it and painted raw red, so each half is closed
     * with a wound for a face.
     */
    const half = (geo, keepTop) => {
      const g = geo.clone();
      const p = g.attributes.position;
      const nrm = g.attributes.normal;
      const col = g.attributes.color;
      const v = new THREE.Vector3();
      let kept = 0;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const s = v.clone().sub(P0).dot(N);
        if (keepTop ? s >= 0 : s <= 0) {
          kept++;
          continue;
        }
        v.addScaledVector(N, -s);
        p.setXYZ(i, v.x, v.y, v.z);
        const face = keepTop ? N.clone().negate() : N;
        nrm.setXYZ(i, face.x, face.y, face.z);
        col.setXYZ(i, C.cut.r, C.cut.g, C.cut.b);
      }
      return kept ? g : null;
    };
    const whole = new THREE.Group();
    const upper = new THREE.Group(); // pivots on the cut centre
    upper.position.copy(P0);
    const lower = new THREE.Group();
    const upperCut = new THREE.Group();
    const lowerCut = new THREE.Group();
    upper.add(upperCut);
    lower.add(lowerCut);
    body.add(whole, upper, lower);
    const mesh = (geo, parent, mat = M.flesh) => add(new THREE.Mesh(geo, mat), parent);
    /** A part the cut goes through: whole before, two halves after. */
    const splitPart = (geo) => {
      mesh(geo, whole);
      const top = half(geo, true);
      const bottom = half(geo, false);
      if (top) mesh(top.translate(-P0.x, -P0.y, -P0.z), upperCut);
      if (bottom) mesh(bottom, lowerCut);
    };
    /** A part wholly on one side: rides that half from the start. */
    const sidePart = (geo, top) => (top ? mesh(geo.translate(-P0.x, -P0.y, -P0.z), upper) : mesh(geo, lower));

    // Torso, belly, the face and its jowls, nose, chin, brow.
    splitPart(paint(place(lumpy(new THREE.SphereGeometry(1, 40, 28), 0.05, 1.3), [0, 3.75, 0], [1.4, 1.2, 1.0]), C.skin));
    splitPart(paint(place(lumpy(new THREE.SphereGeometry(1, 32, 20), 0.05, 2.1), [0, 2.95, 0.12], [1.15, 0.7, 0.85]), C.skin));
    splitPart(paint(place(new THREE.SphereGeometry(1, 28, 20), [0, 3.62, 0.84], [0.62, 0.74, 0.34]), C.face));
    for (const s of [-1, 1]) splitPart(paint(place(new THREE.SphereGeometry(1, 16, 12), [s * 0.31, 3.2, 0.98], [0.26, 0.3, 0.2]), C.face));
    splitPart(paint(place(new THREE.SphereGeometry(1, 14, 10), [0, 3.6, 1.17], [0.1, 0.17, 0.12]), C.face));
    splitPart(paint(place(new THREE.SphereGeometry(1, 16, 10), [0, 2.98, 1.0], [0.3, 0.2, 0.2]), C.face));
    splitPart(paint(place(new THREE.SphereGeometry(1, 18, 10), [0, 4.06, 1.05], [0.5, 0.12, 0.16]), C.face));
    // The hanging arm (his left, screen right): the cut takes it at the shoulder.
    const ra = [new THREE.Vector3(1.2, 4.35, 0.05), new THREE.Vector3(1.75, 3.55, 0.3), new THREE.Vector3(1.5, 2.65, 0.8)];
    splitPart(paint(limb(ra[0], ra[1], 0.4), C.skin));
    splitPart(paint(limb(ra[1], ra[2], 0.32), C.skin));
    splitPart(paint(place(lumpy(new THREE.SphereGeometry(1, 16, 12), 0.08, 4), [1.42, 2.45, 0.92], [0.34, 0.3, 0.28]), C.skin));

    // Eyes: wide, staring, tiny pupils, a tremble. Above the cut.
    const pupils = [];
    for (const s of [-1, 1]) {
      const eye = new THREE.Vector3(s * 0.25, 3.86, 1.08);
      sidePart(paint(place(new THREE.SphereGeometry(0.12, 16, 12), eye.toArray()), C.white), true);
      const pu = new THREE.Mesh(paint(new THREE.SphereGeometry(0.035, 10, 8), C.pupil), M.flesh);
      pu.position.copy(eye).add(new THREE.Vector3(0, 0, 0.105)).sub(P0);
      upper.add(pu);
      pupils.push({ mesh: pu, base: pu.position.clone() });
      // Bags under them.
      sidePart(paint(place(new THREE.TorusGeometry(0.12, 0.025, 6, 16, Math.PI), [s * 0.25, 3.84, 1.1], [1, 1, 1], [0, 0, Math.PI]), C.dark), true);
    }
    // Forehead wrinkles and the thin hair at the sides of the face.
    for (let k = 0; k < 3; k++) sidePart(paint(place(new THREE.BoxGeometry(0.42 - k * 0.08, 0.018, 0.02), [0, 4.17 + k * 0.07, 1.08 - k * 0.04]), C.slit), true);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const cone = new THREE.ConeGeometry(0.05, 0.4, 6);
        sidePart(paint(place(cone, [s * (0.55 + k * 0.05), 4.0 - k * 0.1, 0.8 - k * 0.05], [1, 1, 1], [0.3, 0, s * (1.4 + k * 0.15)]), C.hair), true);
      }
    }
    // The mouth, open on a few teeth. Below the cut.
    sidePart(paint(place(new THREE.SphereGeometry(1, 18, 10), [0, 3.3, 1.08], [0.2, 0.1, 0.1]), C.mouth), false);
    for (let k = 0; k < 5; k++) sidePart(paint(place(new THREE.BoxGeometry(0.045, 0.05, 0.03), [-0.1 + k * 0.05, 3.36, 1.17]), C.tooth), false);

    // Cracks in the skin: dark slits all over the bloat, each on its own side.
    for (let i = 0; i < 22; i++) {
      const th = (hash(i * 3.7) - 0.5) * Math.PI * 1.5;
      const ph = 0.35 + hash(i * 5.9) * 2.2;
      const dir = new THREE.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th));
      if (dir.z > 0.55 && Math.abs(dir.x) < 0.5 && dir.y > -0.4) continue; // keep off the face
      const at = new THREE.Vector3(dir.x * 1.42, 3.75 + dir.y * 1.21, dir.z * 1.01);
      const geo = new THREE.BoxGeometry(0.03, 0.26 + hash(i) * 0.2, 0.06);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
      geo.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), hash(i * 2.2) * Math.PI));
      geo.applyQuaternion(q);
      geo.translate(at.x, at.y, at.z);
      sidePart(paint(geo, C.slit), at.clone().sub(P0).dot(N) > 0);
    }

    // The arm up over the face (his right, screen left), wrapped in bandage.
    const arm = new THREE.Group();
    const shoulder = new THREE.Vector3(-1.2, 4.5, 0.0);
    arm.position.copy(shoulder).sub(P0);
    upper.add(arm);
    const la = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.45, 0.55, 0.55), new THREE.Vector3(0.45, 0.05, 1.05)];
    mesh(paint(limb(la[0], la[1], 0.38), C.skin), arm);
    mesh(paint(limb(la[1], la[2], 0.3), C.skin), arm);
    mesh(paint(place(lumpy(new THREE.SphereGeometry(1, 16, 12), 0.08, 7), [0.72, -0.08, 1.08], [0.32, 0.22, 0.3]), C.skin), arm);
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Vector3(0.85 + k * 0.04, -0.2 - k * 0.02, 0.95 + k * 0.1);
      mesh(paint(limb(new THREE.Vector3(0.75, -0.1, 0.95 + k * 0.1), f.clone().add(new THREE.Vector3(0.12, -0.18, 0.02)), 0.06), C.skin), arm);
    }
    for (let k = 0; k < 3; k++) {
      const p = la[0].clone().lerp(la[1], 0.3 + k * 0.25);
      mesh(paint(place(new THREE.TorusGeometry(0.39, 0.04, 6, 20), p.toArray(), [1, 1, 1], [Math.PI / 2 + 0.6, 0.6, 0]), C.bandage), arm);
    }

    // The small head on top: bandaged, the brain out of the top of it.
    const head = new THREE.Group();
    head.position.set(0.5, 5.15, -0.15).sub(P0);
    upper.add(head);
    mesh(paint(limb(new THREE.Vector3(-0.15, -0.65, 0.05), new THREE.Vector3(0, -0.1, 0), 0.3), C.skin), head);
    mesh(paint(place(lumpy(new THREE.SphereGeometry(1, 20, 14), 0.06, 9), [0, 0, 0], [0.42, 0.46, 0.4]), C.skin), head);
    for (let k = 0; k < 3; k++) mesh(paint(place(new THREE.TorusGeometry(0.42 - k * 0.04, 0.05, 6, 22), [0, -0.12 + k * 0.13, 0], [1, 1, 0.95], [Math.PI / 2 + (k - 1) * 0.15, 0, 0.1 * k]), C.bandage), head);
    mesh(paint(place(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), [0, 0.22, 0], [0.38, 0.28, 0.36]), C.brain), head);
    for (let k = 0; k < 11; k++) {
      const a = hash(k * 4.1) * Math.PI * 2;
      const r = hash(k * 6.3) * 0.28;
      mesh(paint(place(new THREE.SphereGeometry(0.08, 8, 6), [Math.cos(a) * r, 0.36 + (0.28 - r) * 0.5, Math.sin(a) * r], [1.4, 0.7, 1]), C.bump), head);
    }

    // Underneath: the flesh mass, and the tendrils for legs.
    for (const [x, y, z, sx, sy, sz, col] of [
      [0, 2.3, 0.05, 0.95, 0.5, 0.75, C.red],
      [-0.45, 2.05, 0.25, 0.45, 0.4, 0.4, C.bright],
      [0.4, 2.0, -0.1, 0.5, 0.45, 0.45, C.dark],
      [0.1, 1.85, 0.35, 0.4, 0.35, 0.35, C.red],
    ])
      sidePart(paint(place(lumpy(new THREE.SphereGeometry(1, 18, 12), 0.1, x * 7 + 1), [x, y, z], [sx, sy, sz]), col), false);
    const tendrils = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + hash(i) * 0.4;
      const R = 1.2 + hash(i * 2.9) * 1.1;
      const top = new THREE.Vector3(Math.cos(a) * 0.45, 2.0, Math.sin(a) * 0.4 + 0.05);
      const foot = new THREE.Vector3(Math.cos(a) * R, 0.06, Math.sin(a) * R * 0.8 + 0.2);
      const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar((hash(i * 7.7) - 0.5) * 0.9);
      const pts = [
        top,
        top.clone().lerp(foot, 0.3).add(side).add(new THREE.Vector3(0, 0.15, 0)),
        top.clone().lerp(foot, 0.65).sub(side).add(new THREE.Vector3(0, 0.1, 0)),
        foot,
      ].map((p) => p.clone().sub(top));
      const curve = new THREE.CatmullRomCurve3(pts);
      const seg = 24;
      const rad = 8;
      const geo = new THREE.TubeGeometry(curve, seg, 1, rad, false);
      // Taper: thick at the body, thin at the floor.
      const p = geo.attributes.position;
      const c = new THREE.Vector3();
      const v = new THREE.Vector3();
      for (let r = 0; r <= seg; r++) {
        curve.getPointAt(r / seg, c);
        const radius = lerp(0.17, 0.05, r / seg) * (0.8 + hash(i * 3.3) * 0.5);
        for (let k = 0; k <= rad; k++) {
          const j = r * (rad + 1) + k;
          v.fromBufferAttribute(p, j).sub(c).multiplyScalar(radius).add(c);
          p.setXYZ(j, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();
      const t = mesh(paint(geo, [C.red, C.dark, C.bright][i % 3]), lower);
      t.position.copy(top);
      tendrils.push({ mesh: t, a, phase: hash(i * 5.5) * 6 });
    }
    // Shadow pool under it.
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), basic("#000000", { map: softDot(), transparent: true, opacity: 0.65, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.008, 0.2);
    root.add(shadow);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 28), stain);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.012, 0.6);
    pool.scale.setScalar(0.001);
    root.add(pool);
    upperCut.visible = false;
    lowerCut.visible = false;
    scene.add(root);
    return { root, body, whole, upper, lower, upperCut, lowerCut, arm, head, pupils, tendrils, pool, P0, N };
  })();

  // ── Blood, slashes, pools ────────────────────────────────────────────────
  const drop = canvasTexture(
    64,
    64,
    (ctx, wd) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(wd / 2, wd / 2, wd / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    },
    { color: false },
  );
  const blood = createParticles({ count: 1400, blending: "normal", texture: drop });
  scene.add(blood.points);
  const dust = createParticles({ count: 120, blending: "normal" });
  scene.add(dust.points);
  const BLOODS = ["#9e0c1c", "#c8102e", "#5a0410", "#7a0a14"];
  const spray = (at, n, dir, speed = 4, spread = 0.7, size = 0.05) => {
    for (let i = 0; i < n; i++) {
      const s = speed * (0.4 + Math.random() * 0.8);
      blood.emit({
        position: [at.x, at.y, at.z],
        velocity: [dir.x * s + (Math.random() - 0.5) * spread * speed, dir.y * s + (Math.random() - 0.3) * spread * speed, dir.z * s + (Math.random() - 0.5) * spread * speed],
        life: 0.7 + Math.random() * 0.6,
        size: size * (0.5 + Math.random()),
        gravity: 9.8,
        drag: 0.4,
        color: BLOODS[i % BLOODS.length],
      });
    }
  };

  // A slash arc per cut: a pale crescent swept round him, with a red edge.
  const arcWhite = new THREE.RingGeometry(0.72, 0.9, 40, 1, 0, 2.5);
  const arcRed = new THREE.RingGeometry(0.9, 0.98, 40, 1, 0, 2.5);
  const arcs = HITS.map(() => {
    const g = new THREE.Group();
    const a = new THREE.Mesh(arcWhite, basic("#e6ded8", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const b = new THREE.Mesh(arcRed, basic("#c8102e", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    g.add(a, b);
    g.renderOrder = 15;
    scene.add(g);
    return { g, mats: [a.material, b.material] };
  });
  // The big one: a diagonal streak across the Zombie Devil, along the cut.
  const streak = new THREE.Group();
  const streakW = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 0.09), basic("#e8e0da", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  const streakR = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.32), basic("#c8102e", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  streakR.position.z = -0.01;
  streak.add(streakR, streakW);
  streak.position.copy(DEVIL_AT).add(devil.P0).add(new THREE.Vector3(0, 0, 1.35));
  streak.rotation.z = Math.atan2(-devil.N.x, devil.N.y);
  streak.renderOrder = 16;
  scene.add(streak);
  // A pool under each zombie as it goes down.
  const pools = ZOMBIES.map(() => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 24), stain);
    p.rotation.x = -Math.PI / 2;
    p.scale.setScalar(0.001);
    scene.add(p);
    return p;
  });

  // ── Lettering and editing ────────────────────────────────────────────────
  const cuts = createCuts(overlay);
  const bang = createSfx(overlay, { text: "BANG!", crescendo: 0.2 });
  const vroom = createSfx(overlay, { text: "VRRRN!!", crescendo: 0.8 });
  const hitWords = ["SHNK!", "GRAK!", "VRRT!"].map((text) => createSfx(overlay, { text, crescendo: 0.5 }));
  const slash = createSfx(overlay, { text: "SHRAAK!!", crescendo: 0.6 });

  // ── Look: night, a red frame on the big cut ──────────────────────────────
  let shown = null;
  const look = (name) => {
    if (shown === name) return;
    shown = name;
    w.palette(name === "slash" ? SLASH : NIGHT);
    w.inks.forEach((m) => {
      // Night stays night: a cool, dim key, the far end sinking into the air.
      if (name === "slash") m.uniforms.uKey.value.setRGB(0.95, 0.55, 0.52);
      else m.uniforms.uKey.value.setRGB(0.52, 0.58, 0.74);
      m.uniforms.uFogRange.value.set(9, 32);
    });
    w.light(...MOON_DIR);
  };
  w.page({ mode: "still" });

  // ── The cast ─────────────────────────────────────────────────────────────
  const cast = { denji: null, zombies: [] };
  const lineThin = outlineMaterial(0.32);
  lineThin.uniforms.uInk.value.copy(w.line.uniforms.uInk.value);
  /**
   * A suit on the painted body: the jacket over the trapezius band (the
   * painter leaves it as skin), and a white shirt V and the tie at the front.
   */
  const paintSuit = (fig, o) => {
    let body = null;
    fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
    const geo = body?.geometry;
    if (!geo?.attributes.color) return;
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const H = max.y - min.y;
    const cx = (min.x + max.x) / 2;
    const cz = (min.z + max.z) / 2;
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    let sole = 0;
    let ankle = 0;
    let ns = 0;
    let na = 0;
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - min.y) / H;
      if (ny < 0.015) (sole += pos.getZ(i)), ns++;
      else if (ny > 0.05 && ny < 0.07) (ankle += pos.getZ(i)), na++;
    }
    const front = Math.sign(sole / Math.max(1, ns) - ankle / Math.max(1, na)) || 1;
    const jacket = new THREE.Color(o.top);
    const shirt = new THREE.Color(o.collar);
    const tie = new THREE.Color(o.tie);
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - min.y) / H;
      const ax = Math.abs(pos.getX(i) - cx) / H;
      const fz = ((pos.getZ(i) - cz) * front) / H;
      if (ny > 0.82 && ny < 0.88 && ax > 0.045) col.setXYZ(i, jacket.r, jacket.g, jacket.b);
      if (fz > 0.02 && ny > 0.68 && ny < 0.845 && ax < (ny - 0.68) * 0.45) {
        const c = ax < 0.011 && ny < 0.835 ? tie : shirt;
        col.setXYZ(i, c.r, c.g, c.b);
      }
    }
    col.needsUpdate = true;
  };

  const loads = [
    createChainsawMan({ height: 1.76, line: w.line, lineThin, ink: { tone: 0.8, rim: 0.8 }, fist: 0.6, form: 0, blades: 0, rev: 0, mouth: 0.1, blood: 0.3 }),
    ...ZOMBIES.map(([, , height, suit, skin, tie, hair]) =>
      createModelFigure({
        height,
        hair: [hair, "EyebrowsRegular"],
        line: w.line,
        ink: { tone: 0.75, rim: 0.45 },
        outfit: { skin, top: suit, collar: "#cfccc2", bottom: suit, shoes: "#121214", hair: "#16151a", sleeves: "long", tie, iris: "#cfcdbd", pupil: "#a9a796", lid: "#3a3f36", brows: "#26252a", tired: true },
        dress: { tie: true },
        hands: "relaxed",
      }),
    ),
  ];
  const ready = Promise.all(loads).then(([man, ...zs]) => {
    if (disposed) return cast;
    cast.denji = man;
    cast.zombies = zs;
    scene.add(man.root);
    w.register(man.root);
    zs.forEach((z, i) => {
      paintSuit(z, { top: ZOMBIES[i][3], collar: "#cfccc2", tie: ZOMBIES[i][5] });
      z.root.rotation.order = "YXZ";
      scene.add(z.root);
      w.register(z.root);
    });
    shown = null;
    w.sync();
    stage.invalidate?.();
    return { ...cast, devil };
  });


  // ── Camera ───────────────────────────────────────────────────────────────
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const setCam = (pos, target, roll = 0) => {
    camera.position.copy(pos);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -X_WALL + 0.4, X_WALL - 0.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, BACK_Z + 0.4, FRONT_Z - 0.4);
    camera.position.y = Math.max(0.15, camera.position.y);
    viewDir.subVectors(target, camera.position).normalize();
    camera.up.set(0, 1, 0).applyAxisAngle(viewDir, roll);
    camera.lookAt(target);
  };
  const BASE_FOV = camera.fov;
  const unsubscribeResize = stage.onResize(({ aspect, height }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames (theatre mode, phones) widen the lens instead of losing him.
    camera.fov = BASE_FOV * Math.max(1, (1.55 / aspect) ** 0.55);
    camera.updateProjectionMatrix();
    blood.resize(height, camera.fov, renderer.getPixelRatio());
    dust.resize(height, camera.fov, renderer.getPixelRatio());
    w.sync();
  });

  // ── Per frame ────────────────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const neck = new THREE.Vector3();
  const fistPt = new THREE.Vector3();
  const cmPos = new THREE.Vector3();
  const zPos = new THREE.Vector3();
  const toScreen = (v) => {
    tmp2.copy(v).project(camera);
    return [(tmp2.x * 0.5 + 0.5) * 100, (-tmp2.y * 0.5 + 0.5) * 100];
  };
  let prevC = -1;

  /** Denji's pose, feet, heading and spot at loop time c. */
  const denjiAt = (c, time) => {
    const out = { pose: REST, feet: 0, yaw: Math.PI, visible: true };
    cmPos.copy(LAND);
    if (c < 3.05) {
      out.visible = false;
      cmPos.set(0, 0, DUMP_Z);
      out.pose = CROUCH_IN;
      out.feet = DUMP_FLOOR;
    } else if (c < 3.75) {
      // Up out of the trash: crouch to standing with a little hop, a look round.
      const k = easeOutCubic(segment(c, 3.05, 3.4));
      cmPos.set(0, 0, DUMP_Z - 0.15);
      out.pose = blendPose(CROUCH_IN, POP, k);
      out.feet = DUMP_FLOOR + 0.18 * Math.sin(Math.PI * segment(c, 3.05, 3.45));
      const lookRound = Math.sin(segment(c, 3.4, 3.75) * Math.PI * 2) * 0.45;
      out.pose.head = [out.pose.head[0], lookRound, 0];
    } else if (c < 4.2) {
      // Over the rim in one hop, knees tucked, landing in front.
      const k = segment(c, 3.75, 4.2);
      cmPos.set(0, 0, lerp(DUMP_Z - 0.15, LAND.z, k));
      out.feet = lerp(DUMP_FLOOR, 0, k) + 4 * 1.5 * k * (1 - k);
      out.pose = blendPose(POP, VAULT, easeOutCubic(segment(c, 3.75, 3.95)));
      out.pose = blendPose(out.pose, LAND_CROUCH, easeInOutCubic(segment(c, 4.0, 4.2)));
    } else if (c < 6.0) {
      // Up from the landing; the fist finds the grip; draw; yank.
      out.pose = blendPose(LAND_CROUCH, REST, easeInOutCubic(segment(c, 4.25, 4.85)));
      out.pose = blendPose(out.pose, DRAW, easeInOutCubic(segment(c, 5.35, 5.75)));
      out.pose = blendPose(out.pose, YANK, easeOutCubic(segment(c, 5.75, 5.95)));
      if (c < 5.35) out.pose.spine = [out.pose.spine[0] + Math.sin(time * 1.6) * 0.02, out.pose.spine[1], out.pose.spine[2]];
    } else if (c < RAMPAGE) {
      out.pose = blendPose(YANK, STANCE, easeOutBack(segment(c, 6.35, 6.95)));
    } else if (c < LAST_HIT + 0.12) {
      // Through them: run to each, wind up, cut.
      let n = HITS.findIndex((h) => c < h.t + 0.12);
      if (n < 0) n = HITS.length - 1;
      const hit = HITS[n];
      const prev = n ? HITS[n - 1] : { at: LAND, t: RAMPAGE - 0.12, yaw: Math.PI, side: 1 };
      const k = easeInOutCubic(segment(c, prev.t + 0.12, hit.t - 0.07));
      cmPos.copy(prev.at).lerp(hit.at, k);
      out.yaw = lerpAngle(prev.yaw, hit.yaw, easeInOutCubic(segment(c, prev.t + 0.08, prev.t + 0.3)));
      const from = n ? CUT[prev.side] : STANCE;
      out.pose = blendPose(from, RUN(time * 16), segment(c, prev.t + 0.1, prev.t + 0.22));
      out.pose = blendPose(out.pose, WIND[hit.side], easeOutCubic(segment(c, hit.t - 0.2, hit.t - 0.07)));
      out.pose = blendPose(out.pose, CUT[hit.side], easeOutCubic(segment(c, hit.t - 0.07, hit.t + 0.04)));
    } else if (c < 12.25) {
      // Round to face it; a step to the launch spot; down into the crouch.
      const last = HITS[HITS.length - 1];
      cmPos.copy(last.at).lerp(LAUNCH, easeInOutCubic(segment(c, LAST_HIT + 0.15, 11.6)));
      out.yaw = lerpAngle(last.yaw, YAW_DEVIL, easeInOutCubic(segment(c, LAST_HIT + 0.12, 11.5)));
      out.pose = blendPose(CUT[last.side], STANCE, easeInOutCubic(segment(c, LAST_HIT + 0.12, 11.5)));
      out.pose = blendPose(out.pose, CROUCH_LEAP, easeInOutCubic(segment(c, 11.75, 12.2)));
    } else if (c < 13.65) {
      // The leap, the cut, the drop.
      out.yaw = YAW_DEVIL;
      if (c < TC) {
        const k = easeOutCubic(segment(c, 12.25, TC));
        cmPos.copy(LAUNCH).lerp(SLASH_FEET, k).setY(0);
        out.feet = SLASH_FEET.y * k;
      } else if (c < 13.05) {
        cmPos.copy(SLASH_FEET).setY(0);
        out.feet = SLASH_FEET.y;
      } else {
        const k = segment(c, 13.05, 13.65);
        cmPos.copy(SLASH_FEET).lerp(TOUCH, k).setY(0);
        out.feet = SLASH_FEET.y * (1 - k * k);
      }
      out.pose = blendPose(CROUCH_LEAP, AIR_RAISE, easeOutCubic(segment(c, 12.25, 12.6)));
      out.pose = blendPose(out.pose, AIR_SLASH, easeOutCubic(segment(c, TC - 0.06, TC + 0.06)));
      out.pose = blendPose(out.pose, LAND_CROUCH, easeInOutCubic(segment(c, 13.35, 13.65)));
    } else {
      // Down among them. Up, saws idling; he turns round to us.
      cmPos.copy(TOUCH);
      out.yaw = lerpAngle(YAW_DEVIL, 0.25, easeInOutCubic(segment(c, 14.7, 15.5)));
      out.pose = blendPose(LAND_CROUCH, IDLE(time), easeInOutCubic(segment(c, 13.95, 14.6)));
    }
    return out;
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const wrapped = c < prevC;
    const crossed = (t) => dt > 0 && !wrapped && prevC < t && c >= t;
    if (wrapped) {
      blood.step(10);
      dust.step(10);
    }
    const { denji, zombies } = cast;
    look(c >= TC - 0.02 && c < TC + 0.14 ? "slash" : "night");
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.3, flashColor: "#fff6ea" };

    // ── The dumpster lids bang open ──
    lids.forEach((lid, i) => {
      const t0 = 3.0 + i * 0.05;
      const open = c < t0 ? 0 : easeOutBack(segment(c, t0, t0 + 0.16)) * 2.05 - 0.12 * Math.max(0, Math.sin(segment(c, t0 + 0.16, t0 + 0.5) * Math.PI * 2)) * (1 - segment(c, t0 + 0.16, t0 + 0.5));
      lid.rotation.x = c > 17.3 ? 0 : open;
    });
    if (crossed(3.02)) {
      for (let i = 0; i < 30; i++) {
        dust.emit({
          position: [(Math.random() - 0.5) * DUMP_W, DUMP_RIM + 0.1, DUMP_Z + (Math.random() - 0.5) * DUMP_D],
          velocity: [(Math.random() - 0.5) * 1.2, 0.6 + Math.random(), (Math.random() - 0.5) * 1.2],
          life: 1 + Math.random(),
          size: 0.08 + Math.random() * 0.1,
          gravity: 0.3,
          drag: 1.5,
          color: "#6c707a",
          alpha: 0.5,
        });
      }
    }

    // ── Chains sway ──
    chains.forEach(({ g, phase }) => {
      g.rotation.z = Math.sin(time * 0.6 + phase) * 0.025;
      g.rotation.x = Math.sin(time * 0.45 + phase * 2) * 0.02;
    });

    // ── Denji / the Chainsaw Man ──
    if (denji) {
      const d = denjiAt(c, time);
      denji.root.visible = d.visible;
      denji.root.position.set(cmPos.x, 0, cmPos.z);
      denji.root.rotation.set(0, d.yaw, 0);
      denji.apply(d.pose);
      denji.figure.groundTo(d.feet);
      // The change, the engine, the blood on him.
      const change = c < 6.0 ? 0 : easeOutBack(segment(c, 6.05, 6.45));
      denji.setForm(change, easeOutCubic(segment(c, 6.1, 6.5)));
      denji.setBlades(easeOutCubic(segment(c, 6.15, 6.55)), easeOutCubic(segment(c, 6.2, 6.6)));
      const roar = c < 6.3 ? 0 : c < 11.4 ? segment(c, 6.3, 6.8) : c < 13.3 ? 1 : lerp(1, 0.35, segment(c, 13.6, 14.6));
      denji.setRev(roar);
      const mouth = c < 6.4 ? 0.1 : c < 14 ? lerp(0.1, 0.8, easeOutCubic(segment(c, 6.4, 6.6))) : lerp(0.8, 0.45, segment(c, 14, 14.8));
      denji.setMouth(mouth);
      denji.setBlood(0.3 + 0.3 * segment(c, 6.1, 6.6) + 0.4 * segment(c, RAMPAGE, 13.4));
      denji.update(time, dt);
      // The cord: in his fist from 4.85, out to arm's length on the yank, then home.
      const held = c < 4.75 ? 0 : 1 - easeOutCubic(segment(c, 6.05, 6.2));
      denji.setCord(held, denji.fistPoint("r", fistPt));
    }

    // ── The zombies ──
    zombies.forEach((z, i) => {
      const [, , , , , , , , v] = ZOMBIES[i];
      const n = ORDER.indexOf(i);
      const hit = HITS[n];
      zombieSpot(i, c, zPos);
      const struck = c >= hit.t;
      const down = struck ? segment(c, hit.t, hit.t + 0.55) : 0;
      // Before he reaches them they turn after him; struck, they keep that heading.
      const target = struck ? hit.at : c >= RAMPAGE ? cmPos : LAND;
      const yaw = Math.atan2(target.x - zPos.x, target.z - zPos.z);
      const pose = blendPose(SHAMBLE(time * 2.2 + i * 1.3, v), FALLEN, easeOutCubic(down));
      z.root.position.copy(zPos);
      z.root.rotation.set(0, yaw, 0);
      z.apply(pose);
      z.groundTo(0);
      if (struck) {
        // Knocked back off their feet: a pivot over the heels, a bounce.
        const a = (Math.PI / 2) * easeInCubic(down) - 0.07 * Math.sin(Math.PI * segment(c, hit.t + 0.55, hit.t + 0.85));
        const back = tmp.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        z.root.position.addScaledVector(back, 0.45 * easeOutCubic(segment(c, hit.t, hit.t + 0.4)));
        z.root.position.y += 0.31 * Math.sin(Math.max(0, a));
        z.root.rotation.x = -a;
        pools[i].position.copy(zPos).addScaledVector(back, 1.25).setY(0.007);
        pools[i].scale.setScalar(Math.max(0.001, easeOutCubic(segment(c, hit.t + 0.5, hit.t + 2.6)) * (0.55 + hash(i) * 0.35)));
      } else pools[i].scale.setScalar(0.001);
      if (crossed(hit.t)) {
        z.bones.chest?.getWorldPosition(tmp2) ?? tmp2.copy(zPos).setY(1.3);
        const away = tmp.subVectors(zPos, hit.at).setY(0.35).normalize();
        spray(tmp2, 110, away, 4.5, 0.8, 0.06);
      }
    });

    // Slash arcs, one per cut.
    arcs.forEach(({ g, mats }, n) => {
      const hit = HITS[n];
      const k = segment(c, hit.t - 0.04, hit.t + 0.22);
      const on = c >= hit.t - 0.04 && k < 1;
      g.visible = on;
      if (!on) return;
      // Laid near flat round him, the middle of the arc in front, tipped
      // the way the arm swings.
      g.position.copy(hit.at).setY(1.15);
      g.rotation.set(-Math.PI / 2 + (hit.side ? 0.45 : -0.45), hit.yaw, -Math.PI / 2 - 1.25, "YXZ");
      g.scale.setScalar(1.05 + k * 0.35);
      mats[0].opacity = 0.9 * (1 - k);
      mats[1].opacity = 0.8 * (1 - k);
    });

    // ── The Zombie Devil ──
    {
      const { body, whole, upper, lower, upperCut, lowerCut, arm, head, pupils, tendrils, pool, P0 } = devil;
      const split = c >= TC;
      whole.visible = !split;
      upperCut.visible = split;
      lowerCut.visible = split;
      // Alive: it heaves, the arm kneads its scalp, the eyes tremble.
      const alive = split ? 0 : 1;
      body.position.y = Math.sin(time * 1.1) * 0.05 * alive;
      body.rotation.z = Math.sin(time * 0.7) * 0.03 * alive;
      body.rotation.x = -0.12 * easeInOutCubic(segment(c, 12.2, TC)) * alive;
      arm.rotation.set(Math.sin(time * 0.9) * 0.06 * alive, 0, Math.sin(time * 0.75 + 1) * 0.05 * alive);
      head.rotation.z = Math.sin(time * 0.8 + 2) * 0.08 * alive;
      pupils.forEach(({ mesh, base }, i) => mesh.position.set(base.x + Math.sin(time * 37 + i) * 0.006 * alive, base.y + Math.sin(time * 29 + i * 2) * 0.006 * alive, base.z));
      tendrils.forEach(({ mesh, a, phase }) => {
        const splay = 0.4 * easeOutCubic(segment(c, TC + 0.3, TC + 1.8));
        mesh.rotation.set(Math.sin(time * 1.3 + phase) * 0.06 * alive + Math.sin(a) * splay, 0, Math.sin(time * 1.1 + phase * 2) * 0.06 * alive - Math.cos(a) * splay);
      });
      // Cut: the top half slides off down the cut, then drops and tips over;
      // the legs fold under what is left.
      const slide = easeOutCubic(segment(c, TC, TC + 0.5));
      const fall = easeInCubic(segment(c, TC + 0.25, TC + 1.35));
      const tangent = tmp.set(-1, -0.6, 0).normalize();
      upper.position.copy(P0).addScaledVector(tangent, 0.5 * slide).add(tmp2.set(-0.9 * fall, -2.6 * fall, 0.5 * fall));
      upper.rotation.set(0.25 * fall, 0, 1.15 * fall - 0.05 * Math.sin(Math.PI * segment(c, TC + 1.35, TC + 1.7)));
      const fold = easeInOutCubic(segment(c, TC + 0.35, TC + 1.9));
      lower.scale.set(1 + 0.12 * fold, 1 - 0.5 * fold, 1 + 0.12 * fold);
      lower.rotation.x = -0.15 * fold;
      pool.scale.setScalar(Math.max(0.001, easeOutCubic(segment(c, TC + 0.4, TC + 3)) * 2.4));
      if (dt > 0 && c >= TC && c < TC + 1.4) {
        // Blood out of both faces of the cut.
        const n = Math.ceil(dt * 260 * (1 - segment(c, TC, TC + 1.4)));
        devil.lower.localToWorld(tmp2.copy(P0).add(tmp.set((Math.random() - 0.5) * 2.2, 0, 0.3).projectOnPlane(devil.N)));
        spray(tmp2, n, tmp.copy(devil.N).add(new THREE.Vector3(0, 0, 0.6)).normalize(), 5, 0.7, 0.08);
        devil.upper.localToWorld(tmp2.set((Math.random() - 0.5) * 1.6, 0, 0));
        spray(tmp2, Math.ceil(n * 0.5), tmp.set(0.2, -0.3, 0.8).normalize(), 3, 0.8, 0.07);
      }
    }
    // The streak along the cut.
    const sk = segment(c, TC + 0.08, TC + 0.5);
    const streakOn = c >= TC - 0.02 && sk < 1;
    streak.visible = streakOn;
    if (streakOn) {
      streakW.material.opacity = 1 - sk;
      streakR.material.opacity = 0.85 * (1 - sk);
      streak.scale.set(lerp(0.3, 1, easeOutCubic(segment(c, TC - 0.02, TC + 0.05))), 1 + sk * 0.6, 1);
    }

    // Blood rain once it is down.
    if (dt > 0 && c > TC + 0.3 && c < 17.4) {
      const n = Math.ceil(dt * 70);
      for (let i = 0; i < n; i++) {
        blood.emit({
          position: [TOUCH.x + (Math.random() - 0.5) * 7, 5 + Math.random() * 2, TOUCH.z + (Math.random() - 0.5) * 7],
          velocity: [0, -2 - Math.random() * 2, 0],
          life: 1.6,
          size: 0.025 + Math.random() * 0.03,
          gravity: 6,
          drag: 0.1,
          color: BLOODS[i % BLOODS.length],
        });
      }
    }
    blood.step(dt);
    dust.step(dt);

    // ── Cameras ──
    const jolt = (t0) => Math.max(0, 1 - (c - t0) / 0.18) * (c >= t0 ? 1 : 0);
    let roll = 0;
    if (c < 3.0) {
      // Wide from behind the dumpster: them coming, it at the back.
      const k = easeInOutCubic(segment(c, 0, 3.0));
      camPos.set(lerp(1.0, 0.8, k), lerp(2.3, 2.2, k), lerp(5.9, 5.2, k));
      camLook.set(0.2, 1.95, -3.5);
      cut.black = 1 - segment(c, 0, 0.7);
    } else if (c < 4.6) {
      // Low, from behind them: the lid bangs, he comes up and over.
      const k = easeInOutCubic(segment(c, 3.0, 4.6));
      const shake = jolt(3.0) * 0.05;
      camPos.set(lerp(-0.6, -0.5, k) + Math.sin(time * 70) * shake, 1.0, lerp(-4.2, -3.8, k));
      camLook.set(0, 1.3, lerp(1.4, 0.6, segment(c, 3.7, 4.3)));
      if (denji?.root.visible) camLook.lerp(denji.bones.neck.getWorldPosition(neck), 0.5);
    } else if (c < 6.0) {
      // In front of him, low: the fist on the grip, the yank.
      const k = easeInOutCubic(segment(c, 4.6, 6.0));
      camPos.set(lerp(0.55, 0.35, k), lerp(0.95, 0.9, k), lerp(-1.75, -1.45, k));
      camLook.set(0, 1.28, LAND.z);
      cut.flash = c > 5.93 ? 1 - segment(c, 5.93, 6.15) : 0;
    } else if (c < RAMPAGE) {
      // The change: lower, punching in, the frame tipping.
      const k = easeOutCubic(segment(c, 6.0, 6.8));
      camPos.set(lerp(0.6, 0.4, k) + Math.sin(time * 83) * 0.012, lerp(0.55, 0.45, k), lerp(-2.3, -1.6, k));
      camLook.set(0, lerp(1.3, 1.45, k), LAND.z);
      roll = 0.12 * k;
      cut.flash = c < 6.15 ? 0.9 * (1 - segment(c, 6.0, 6.15)) : 0;
      cut.flashColor = "#fff6ea";
    } else if (c < 11.3) {
      // Handheld round him, low; a whip pan halfway.
      const a = 0.6 + (c - RAMPAGE) * 0.32 + 2.1 * easeInOutCubic(segment(c, 9.15, 9.35));
      tmp.copy(cmPos).setY(1.05);
      let hj = 0;
      HITS.forEach((h) => (hj = Math.max(hj, jolt(h.t))));
      camPos.set(tmp.x + Math.sin(a) * 3.4 + Math.sin(time * 61) * hj * 0.06, 0.62 + hj * 0.05, tmp.z + Math.cos(a) * 3.4);
      camLook.copy(tmp);
      roll = Math.sin(a * 0.7) * 0.08;
      HITS.forEach((h) => {
        const f = Math.max(0, 1 - (c - h.t) / 0.1) * (c >= h.t ? 1 : 0);
        if (f > cut.flash) {
          cut.flash = f * 0.35;
          cut.flashColor = h.side ? "#ff1d3d" : "#fff6ea";
        }
      });
    } else if (c < 12.25) {
      // From behind him, at its feet: it fills the frame.
      const k = easeInOutCubic(segment(c, 11.3, 12.25));
      camPos.set(lerp(0.35, 0.5, k), lerp(0.35, 0.3, k), lerp(-3.1, -3.4, k));
      camLook.set(0.6, lerp(3.5, 3.8, k), DEVIL_AT.z);
    } else if (c < 13.6) {
      // Side on: the leap, the cut.
      const k = easeInOutCubic(segment(c, 12.25, 13.6));
      camPos.set(lerp(7.2, 6.8, k) + jolt(TC) * Math.sin(time * 90) * 0.12, lerp(1.6, 2.3, k), lerp(-5.0, -5.6, k));
      denji?.bones.neck.getWorldPosition(neck);
      camLook.set(0.6, 3.3, -7.0).lerp(neck, 0.35);
      cut.flash = c >= TC - 0.02 && c < TC + 0.25 ? 1 - segment(c, TC - 0.02, TC + 0.25) : 0;
      cut.flashColor = c < TC + 0.06 ? "#fff6ea" : "#ff1d3d";
    } else if (c < 15.0) {
      // From the front: it comes apart behind him.
      const k = easeInOutCubic(segment(c, 13.6, 15.0));
      camPos.set(lerp(2.5, 2.1, k), lerp(1.0, 0.9, k), lerp(-2.4, -2.9, k));
      camLook.set(0.2, lerp(2.4, 1.8, k), -7.6);
    } else {
      // Among the bodies, low, slowly round him; he looks at us. Black.
      const k = easeInOutCubic(segment(c, 15.0, CYCLE));
      camPos.set(lerp(1.1, -0.7, k), lerp(0.55, 0.7, k), lerp(-3.4, -3.7, k));
      camLook.set(TOUCH.x, 1.15, TOUCH.z);
      cut.black = segment(c, 17.1, 17.8);
    }
    if (c >= 17.8) cut.black = 1;
    setCam(camPos, camLook, roll);
    camera.updateMatrixWorld();
    cuts.update(cut);

    // ── Lettering ──
    const boil = Math.floor(time * 12);
    const sb = segment(c, 3.0, 3.12);
    bang.update({ x: 50, y: 26, size: 9, rotate: -6, opacity: c > 3.0 && c < 3.9 ? Math.min(1, sb * 4) * (1 - segment(c, 3.6, 3.9)) : 0, scale: lerp(2.2, 1, easeOutBack(sb)), boil, jitter: 0.08 });
    const sv = segment(c, 6.3, 6.5);
    vroom.update({ x: 50, y: 22, size: 11, rotate: -8, opacity: c > 6.3 && c < 7.7 ? Math.min(1, sv * 4) * (1 - segment(c, 7.4, 7.7)) : 0, scale: lerp(2.4, 1, easeOutBack(sv)), boil, jitter: 0.1, shake: staticMode ? [0, 0] : [Math.sin(time * 97) * 4, Math.sin(time * 89) * 3] });
    hitWords.forEach((h, i) => {
      let op = 0;
      let local = 0;
      HITS.forEach((hit, n) => {
        if (n % 3 !== i || c < hit.t || c > hit.t + 0.4) return;
        local = (c - hit.t) / 0.4;
        op = 1 - local;
      });
      h.update({ x: 28 + i * 22, y: 24 + (i % 2) * 46, size: 7.5, rotate: (i - 1) * 9, opacity: op, scale: lerp(1.6, 1, easeOutBack(Math.min(1, local * 3))), boil, jitter: 0.08 });
    });
    const ss = segment(c, TC, TC + 0.12);
    const [sx, sy] = toScreen(tmp.copy(DEVIL_AT).add(devil.P0));
    slash.update({ x: Math.min(78, Math.max(22, sx)), y: Math.min(80, Math.max(16, sy - 16)), size: 12, rotate: -14, opacity: c > TC && c < 14.4 ? Math.min(1, ss * 4) * (1 - segment(c, 14.0, 14.4)) : 0, scale: lerp(2.5, 1, easeOutBack(ss)), boil, jitter: 0.1 });

    prevC = c;
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      cast.denji?.dispose();
      [bang, vroom, slash, ...hitWords, cuts].forEach((x) => x.dispose());
    },
  };
};
