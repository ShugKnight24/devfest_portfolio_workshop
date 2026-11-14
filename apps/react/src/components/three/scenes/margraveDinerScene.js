import * as THREE from "three";
import { createInkWorld, seat } from "../rezeKit";
import { canvasTexture, createParticles, easeInOutCubic, hash, lerp, lightBeam, segment, softDot } from "../kit";
import { inkMaterial, outline } from "../ink";
import { blendPose } from "../figure";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createModelFigure } from "../modelFigure";

/**
 * Walk in like Reacher — Eno's diner, Margrave, Georgia, a little before noon.
 * The opening of Killing Floor: he is in a booth by the window with eggs and
 * coffee, back to the wall, facing the door. He reads the room one thing at a
 * time, the camera riding his eyeline, and then they come for him: he is
 * arrested in Eno's at twelve o'clock, and he finishes his breakfast first.
 *
 *   0    – 2.2   the booth: hot white daylight, eggs, a sip of coffee
 *   2.2  – 3.4   over his shoulder: the front door
 *   3.4  – 4.6   the counter, through the pass: the cook plates an order
 *   4.6  – 6.6   the waitress comes round the counter with a slice of pie
 *   6.6  – 10.0  at his table: she sets the plate down and says her line,
 *                "Best pie in Georgia. Our little slice of heaven."
 *   10.0 – 11.8  the window. Two cruisers pull up hard, lightbars going
 *   11.8 – 12.9  the door bangs open: two officers come in fast, pistols up
 *                in both hands, and stop in the aisle aimed at him
 *   12.9 – 15.0  the room, from behind the counter: guns on him, and he takes
 *                another bite
 *   15.0 – 17.6  over the officer's shoulder: he sets his fork down and looks
 *                up at them
 *
 * A dip to black resets the loop. Reduced motion holds 14.4: guns drawn, pie
 * on the table, bars lit. Bodies are Quaternius's CC0 rigs with painted
 * clothes; everything else is built here.
 */

const CYCLE = 17.6;
const OLIVE = "#465038";
const STATIC_TIME = 14.4;
const NAVY = "#24314a";

// The diner's light: hot noon outside, warm interior, cool shade.
const DINER = { ground: "#2b2119", lines: "#fff0d2", accent: "#ff9a4a", rim: "#ffe0b0", shade: "#9fb0c8" };
const KEY = [-0.3, 0.85, -0.45];
const SUN_OUT = [0.2, 0.92, 0.35];
// Interior sun shafts run in from the street, down and across the floor.
const SHAFT = new THREE.Vector3(0.3, -0.72, 0.62).normalize();

// The room. Front (street) wall's inner face at z = -3; counter along +z.
const WALL_Z = -3;
const BACK_Z = 3;
const END_X = 2.8;
const WEST_X = -5.2;
const CEIL = 3.1;
const SILL = 0.95;
const HEAD = 2.55;
const DOOR = [-4.6, -3.6];
const TABLES = [1.765, -0.235, -2.235];
const TABLE_Z = [-2.95, -2.0];
const TABLE_TOP = 0.785;
const SEAT_TOP = 0.535;
const STOOL_Z = 0.22;
const STOOL_TOP = 0.78;

// Reacher: seated on the inner bench of the end booth, facing the door (-x).
const RX = 2.4;
const RZ = -2.42;
const EYE = new THREE.Vector3(RX - 0.2, 1.42, RZ);
const CHEST = new THREE.Vector3(RX - 0.05, 1.12, RZ);
/** Reacher's root space (x his left, z his front) to world, on the floor. */
const toWorld = (x, y, z) => new THREE.Vector3(RX - z, y, RZ + x);

// ── Poses ──────────────────────────────────────────────────────────────────
// Measured on the 2.0 m rig with seatOn: thighs on the vinyl, soles on the tiles.
const LEGS = { lHip: [-1.45, 0, 0.1], rHip: [-1.45, 0, -0.1], lKnee: [1.5, 0, 0], rKnee: [1.5, 0, 0] };
// Left hand round the mug on the table (the mug sits a little back in the
// grip so it stands upright there); right hand turned palm-down over the
// plate with the fork.
const REST = {
  ...LEGS,
  spine: [0.22, 0, 0],
  chest: [0.05, 0, 0],
  neck: [-0.05, 0, 0],
  head: [-0.1, 0, 0],
  lShoulder: [-0.3, 0, 0.1],
  lElbow: [-1.2, 0, 0],
  rShoulder: [-0.6, 0, -0.12],
  rElbow: [-1.0, 1.2, 0],
};
// The mug up to his mouth.
const SIP = { ...REST, spine: [0.12, 0, 0], head: [-0.15, 0, 0], lShoulder: [-1.2, -0.6, 0.05], lElbow: [-1.75, 0, 0] };
// Fork up: a bite of egg, or of pie.
const BITE = { ...REST, spine: [0.26, 0, 0], head: [0.02, 0, 0], rShoulder: [-1.0, 0.45, -0.1], rElbow: [-2.0, 1.2, 0] };
// Fork down on the plate, hand flat beside it.
const DOWN = { ...REST, rShoulder: [-0.45, 0, -0.12], rElbow: [-1.15, 1.35, 0] };

const STOOL_SIT = {
  spine: [0.18, 0, 0],
  head: [0.12, 0, 0],
  lHip: [-1.45, 0, 0.12],
  rHip: [-1.45, 0, -0.12],
  lKnee: [1.6, 0, 0],
  rKnee: [1.6, 0, 0],
  lShoulder: [-0.72, 0, 0.08],
  lElbow: [-1.0, 0, 0],
  rShoulder: [-0.68, 0, -0.1],
  rElbow: [-1.0, 0, 0],
};
const COOK = {
  spine: [0.18, 0, 0],
  neck: [0.15, 0, 0],
  head: [0.3, 0, 0],
  lShoulder: [-0.85, 0, 0.12],
  lElbow: [-0.95, 0, 0],
  rShoulder: [-0.75, 0, -0.1],
  rElbow: [-1.15, 0, 0],
};
const REACH = { ...COOK, spine: [0.3, 0, 0], head: [0.15, 0, 0], lShoulder: [-1.35, 0, 0.1], lElbow: [-0.35, 0, 0], rShoulder: [-1.3, 0, -0.1], rElbow: [-0.35, 0, 0] };
/** A walk (or, with `run`, a run); the right forearm carries the plate level. */
const walkPose = (p, amount, run = 0) => {
  const s = Math.sin(p);
  const k = amount * (1 + run * 0.7);
  return {
    spine: [0.04 + run * 0.1, 0, 0],
    head: [0.04 - run * 0.08, 0, 0],
    lHip: [-0.42 * s * k, 0, 0.04],
    rHip: [0.42 * s * k, 0, -0.04],
    lKnee: [(0.08 + 0.6 * Math.max(0, Math.sin(p + 1.3))) * k + 0.04, 0, 0],
    rKnee: [(0.08 + 0.6 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * k + 0.04, 0, 0],
    lShoulder: [0.3 * s * amount, 0, 0.1],
    lElbow: [-0.25, 0, 0],
    rShoulder: [-0.32, 0, -0.14],
    rElbow: [-1.35, 0, 0],
  };
};
// The waitress bends to set the plate on the table.
const SET_DOWN = { spine: [0.6, 0, 0], chest: [0.1, 0, 0], head: [0.15, 0, 0], lHip: [-0.25, 0, 0], rHip: [-0.25, 0, 0], lKnee: [0.2, 0, 0], rKnee: [0.2, 0, 0], lShoulder: [-0.2, 0, 0.12], lElbow: [-0.4, 0, 0], rShoulder: [-1.1, 0, -0.05], rElbow: [-0.1, 0, 0] };
// Then stands by the booth, and backs off, hands up, when the guns come in.
const STAND = { spine: [0.02, 0, 0], lShoulder: [0.05, 0, 0.12], lElbow: [-0.3, 0, 0], rShoulder: [0.05, 0, -0.12], rElbow: [-0.3, 0, 0] };
const SHRINK = { spine: [-0.06, 0, 0], head: [-0.05, 0, 0], lShoulder: [-0.75, 0, 0.25], lElbow: [-1.9, 0, 0], rShoulder: [-0.75, 0, -0.25], rElbow: [-1.9, 0, 0] };
// Isosceles: both arms out straight, hands meeting on the gun. `pitch` lowers
// the muzzle onto a seated man.
const aimArms = (pitch) => ({
  rShoulder: [-1.45 + pitch, 0, 0.3],
  rElbow: [-0.15, 0, 0],
  lShoulder: [-1.36 + pitch, 0, -0.3],
  lElbow: [-0.3, 0, 0],
});
const STANCE = { spine: [0.08, 0, 0], chest: [0.04, 0, 0], head: [0.06, 0, 0], lHip: [-0.3, 0, 0.12], rHip: [0.12, 0, -0.12], lKnee: [0.35, 0, 0], rKnee: [0.22, 0, 0] };

/** Two pulses on each side, red then blue, the way a bar strobes. */
const strobe = (t, phase) => {
  const p = (((t * 1.55 + phase) % 1) + 1) % 1;
  const on = (a, b) => (p >= a && p < b ? 1 : 0);
  return [Math.max(on(0, 0.11), on(0.18, 0.29)), Math.max(on(0.5, 0.61), on(0.68, 0.79))];
};
const RED = new THREE.Color("#ff2a2a");
const BLUE = new THREE.Color("#2f5bff");

/** Up, hold, down: an envelope in [0, 1]. */
const envelope = (c, a, b, d, e) => easeInOutCubic(segment(c, a, b)) * (1 - easeInOutCubic(segment(c, d, e)));

export const createMargraveDinerScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  // Daylight wants less glow than the night sets: only the lightbars bloom.
  const bloom = stage.bloomPass;
  const baseBloom = bloom ? { strength: bloom.strength, threshold: bloom.threshold } : null;
  if (bloom) Object.assign(bloom, { strength: 0.32, threshold: 0.97 });
  let disposed = false;

  const add = (mesh, parent = scene, line = false) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  /** A box between two corners. */
  const slab = (x0, x1, y0, y1, z0, z1, mat, line = false, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, line);
  };
  const cyl = (r0, r1, h, mat, x, y, z, seg = 20, parent = scene, line = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
    m.position.set(x, y, z);
    return add(m, parent, line);
  };
  const basic = (color, intensity = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), ...o });
  const additive = (color, opacity = 1, map = null) =>
    new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

  // Exterior: brighter key, sky fill and heat haze; kept out of the interior palette.
  const outs = [];
  const outside = (tint, { tone = 1, rim = 0.4, spec = 0 } = {}) => {
    const m = inkMaterial({ tint, tone, rim, spec, light: SUN_OUT });
    const u = m.uniforms;
    u.uAnime.value = 2;
    // About a stop over the interior: hot, but the street keeps its colour.
    u.uKey.value.setRGB(1.0, 0.9, 0.74);
    u.uShade.value.set("#93a6c0");
    u.uFog.value.set("#c9bea4");
    u.uFogRange.value.set(8, 70);
    u.uRimColor.value.set("#fff2d6");
    outs.push(m);
    return m;
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    cream: w.ink({ tint: "#efe2c6", tone: 0.95, rim: 0.2 }),
    wainscot: w.ink({ tint: "#7c1f24", tone: 0.8, rim: 0.4 }),
    ceiling: w.ink({ tint: "#f4eee0", tone: 1.0, rim: 0 }),
    chrome: w.ink({ tint: "#dfe3e8", tone: 1.15, rim: 1.1, spec: 1 }),
    steel: w.ink({ tint: "#b9bec4", tone: 0.95, rim: 0.8, spec: 1 }),
    vinyl: w.ink({ tint: "#b3232c", tone: 0.85, rim: 0.7, spec: 0.6 }),
    vinylDark: w.ink({ tint: "#4a1418", tone: 0.6, rim: 0.4 }),
    formica: w.ink({ tint: "#d4e5de", tone: 1.0, rim: 0.3, spec: 0.5 }),
    counterTop: w.ink({ tint: "#ebe5d6", tone: 1.0, rim: 0.3, spec: 0.5 }),
    counterFront: w.ink({ tint: "#9e1f26", tone: 0.8, rim: 0.6, spec: 0.4 }),
    black: w.ink({ tint: "#1b1b1d", tone: 0.4, rim: 0.4 }),
    china: w.ink({ tint: "#fbf8f1", tone: 1.05, rim: 0.3, spec: 0.8 }),
    coffee: w.ink({ tint: "#2e1b10", tone: 0.5, rim: 0.2, spec: 1 }),
    yolk: w.ink({ tint: "#f4a615", tone: 1.0, rim: 0.3, spec: 1 }),
    eggWhite: w.ink({ tint: "#fffaf0", tone: 1.05, rim: 0.2 }),
    toast: w.ink({ tint: "#c98a46", tone: 0.9, rim: 0.3 }),
    crust: w.ink({ tint: "#d9a35a", tone: 0.95, rim: 0.4 }),
    cherry: w.ink({ tint: "#9c1b2a", tone: 0.8, rim: 0.4 }),
    ketchup: w.ink({ tint: "#c0201c", tone: 0.85, rim: 0.6, spec: 1 }),
    wood: w.ink({ tint: "#8a5a36", tone: 0.8, rim: 0.4 }),
    kitchen: w.ink({ tint: "#9aa1a6", tone: 0.7, rim: 0.4, spec: 0.6 }),
    kitchenFloor: w.ink({ tint: "#6f6a64", tone: 0.6, rim: 0 }),
    paper: w.ink({ tint: "#fbfaf4", tone: 1.0, rim: 0.2 }),
    mint: w.ink({ tint: "#7fb9a4", tone: 0.9, rim: 0.6, spec: 0.6 }),
  };
  const glass = new THREE.MeshBasicMaterial({ color: "#fff6e2", transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
  const dot = softDot();

  // ── Floor: black and white checkerboard ──────────────────────────────────
  const checker = (x0, x1, z0, z1, size) => {
    const pos = [];
    const col = [];
    const nor = [];
    const idx = [];
    const a = new THREE.Color("#ece5d3");
    const b = new THREE.Color("#1c1c1f");
    let v = 0;
    for (let i = 0; x0 + i * size < x1; i++) {
      for (let j = 0; z0 + j * size < z1; j++) {
        const xa = x0 + i * size;
        const xb = Math.min(x1, xa + size);
        const za = z0 + j * size;
        const zb = Math.min(z1, za + size);
        const c = (i + j) % 2 ? a : b;
        pos.push(xa, 0, za, xb, 0, za, xb, 0, zb, xa, 0, zb);
        for (let k = 0; k < 4; k++) {
          col.push(c.r, c.g, c.b);
          nor.push(0, 1, 0);
        }
        idx.push(v, v + 2, v + 1, v, v + 3, v + 2);
        v += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  };
  add(new THREE.Mesh(checker(WEST_X, END_X, WALL_Z, BACK_Z, 0.32), w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.95, rim: 0.1, spec: 0.5 })));
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(END_X - WEST_X, BACK_Z - WALL_Z), M.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set((END_X + WEST_X) / 2, CEIL, 0);
  add(ceiling);
  // Ceiling panels: soft daylight-white fixtures.
  for (const x of [-3.6, -1.4, 0.8]) {
    for (const z of [-1.6, 1.6]) slab(x - 0.55, x + 0.55, CEIL - 0.03, CEIL - 0.01, z - 0.28, z + 0.28, basic("#ffe9c8", 0.62));
  }

  // ── Walls ────────────────────────────────────────────────────────────────
  const FZ = [WALL_Z - 0.2, WALL_Z];
  // Front wall around the windows and the door.
  slab(WEST_X, DOOR[0], 0, SILL, ...FZ, M.wainscot);
  slab(DOOR[1], END_X, 0, SILL, ...FZ, M.wainscot);
  slab(WEST_X, END_X, HEAD, CEIL, ...FZ, M.cream);
  slab(DOOR[0], DOOR[1], 2.2, HEAD, ...FZ, M.cream);
  slab(WEST_X, DOOR[0], SILL, HEAD, ...FZ, M.cream);
  slab(DOOR[1], -3.3, SILL, HEAD, ...FZ, M.cream);
  slab(2.6, END_X, SILL, HEAD, ...FZ, M.cream);
  const WINDOWS = [
    [-3.3, -1.235],
    [-1.235, 0.765],
    [0.765, 2.6],
  ];
  for (const x of [-1.235, 0.765]) slab(x - 0.06, x + 0.06, SILL, HEAD, WALL_Z - 0.16, WALL_Z + 0.01, M.chrome, true);
  for (const [x0, x1] of WINDOWS) {
    slab(x0, x1, HEAD - 0.04, HEAD, WALL_Z - 0.12, WALL_Z + 0.01, M.chrome);
    slab(x0, x1, SILL, SILL + 0.035, WALL_Z - 0.12, WALL_Z + 0.14, M.chrome, true); // the sill ledge
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, HEAD - SILL), glass);
    pane.position.set((x0 + x1) / 2, (SILL + HEAD) / 2, WALL_Z - 0.1);
    add(pane);
  }
  // The front door: a glass leaf in a chrome frame, hinged on the west jamb
  // and swinging in, push bar, a bell over it.
  const doorLeaf = new THREE.Group();
  const doorBell = new THREE.Group();
  {
    const [d0, d1] = DOOR;
    slab(d0 - 0.05, d0, 0, 2.25, WALL_Z - 0.16, WALL_Z - 0.04, M.chrome, true);
    slab(d1, d1 + 0.05, 0, 2.25, WALL_Z - 0.16, WALL_Z - 0.04, M.chrome, true);
    slab(d0 - 0.05, d1 + 0.05, 2.2, 2.25, WALL_Z - 0.16, WALL_Z - 0.04, M.chrome, true);
    doorLeaf.position.set(d0, 0, WALL_Z - 0.1);
    scene.add(doorLeaf);
    const wd = d1 - d0;
    slab(0, 0.06, 0, 2.2, -0.04, 0.04, M.chrome, true, doorLeaf);
    slab(wd - 0.06, wd, 0, 2.2, -0.04, 0.04, M.chrome, true, doorLeaf);
    slab(0, wd, 2.14, 2.2, -0.04, 0.04, M.chrome, true, doorLeaf);
    slab(0, wd, 0, 0.22, -0.04, 0.04, M.chrome, true, doorLeaf);
    slab(0.12, wd - 0.12, 1.02, 1.06, 0.06, 0.1, M.chrome, true, doorLeaf);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(wd - 0.12, 1.92), glass);
    pane.position.set(wd / 2, 1.18, 0);
    doorLeaf.add(pane);
    doorBell.position.set(d1 - 0.12, 2.17, WALL_Z + 0.06);
    scene.add(doorBell);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome);
    bell.rotation.x = Math.PI;
    bell.position.y = -0.05;
    doorBell.add(bell);
  }
  // End wall behind Reacher, west wall, chrome rail at the wainscot line.
  slab(END_X, END_X + 0.2, 0, 1.0, WALL_Z - 0.2, BACK_Z, M.wainscot);
  slab(END_X, END_X + 0.2, 1.0, CEIL, WALL_Z - 0.2, BACK_Z, M.cream);
  slab(WEST_X - 0.2, WEST_X, 0, 1.0, WALL_Z - 0.2, BACK_Z, M.wainscot);
  // The west wall is what the door shots look at: its own cream, bounce-lit
  // once the cast is in (see the ceiling), and dressed below.
  const westCream = w.ink({ tint: "#efe2c6", tone: 0.95, rim: 0.2 });
  slab(WEST_X - 0.2, WEST_X, 1.0, CEIL, WALL_Z - 0.2, BACK_Z, westCream);
  slab(END_X - 0.02, END_X, 0.98, 1.03, WALL_Z, BACK_Z, M.chrome);
  // Deep enough that its top reads as a solid line from across the room, not a dashed one.
  slab(WEST_X, WEST_X + 0.04, 0.98, 1.03, WALL_Z, BACK_Z, M.chrome);
  // Eno's menu board on the west wall, and a framed photo of the water tower.
  {
    const board = canvasTexture(512, 288, (ctx, wd, h) => {
      ctx.fillStyle = "#1e2622";
      ctx.fillRect(0, 0, wd, h);
      ctx.fillStyle = "#efe8d6";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "700 42px Georgia, serif";
      ctx.fillText("ENO'S", wd / 2, 40);
      ctx.font = "400 25px Georgia, serif";
      [
        ["EGGS, ANY STYLE", "1.95"],
        ["GRITS", ".75"],
        ["TOAST & JELLY", ".60"],
        ["CHERRY PIE", "1.25"],
        ["COFFEE", ".50"],
      ].forEach(([item, price], i) => {
        ctx.textAlign = "left";
        ctx.fillText(item, 44, 98 + i * 38);
        ctx.textAlign = "right";
        ctx.fillText(price, wd - 44, 98 + i * 38);
      });
    });
    // Unlit, so dimmed by hand to sit in the wall's shade.
    const shaded = new THREE.Color(0.62, 0.6, 0.56);
    slab(WEST_X, WEST_X + 0.03, 1.36, 2.34, -2.15, -0.45, M.wood, true);
    const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.86), new THREE.MeshBasicMaterial({ map: board, color: shaded }));
    menu.rotation.y = Math.PI / 2;
    menu.position.set(WEST_X + 0.04, 1.85, -1.3);
    add(menu);
    const photo = canvasTexture(128, 160, (ctx, wd, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#e9dcc0");
      g.addColorStop(1, "#b89d74");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, wd, h);
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(0, 128, wd, 32);
      ctx.fillRect(58, 70, 4, 60);
      ctx.fillRect(74, 70, 4, 60);
      ctx.fillRect(44, 50, 48, 26);
      ctx.beginPath();
      ctx.moveTo(40, 50);
      ctx.lineTo(68, 30);
      ctx.lineTo(96, 50);
      ctx.fill();
    });
    slab(WEST_X, WEST_X + 0.03, 1.5, 2.1, 0.2, 0.7, M.black, true);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshBasicMaterial({ map: photo, color: shaded }));
    pic.rotation.y = Math.PI / 2;
    pic.position.set(WEST_X + 0.04, 1.8, 0.45);
    add(pic);
  }
  // Back wall with the pass-through to the kitchen.
  const PASS = [-2.1, -0.5];
  const BZ = [BACK_Z, BACK_Z + 0.15];
  slab(WEST_X, PASS[0], 0, CEIL, ...BZ, M.cream);
  slab(PASS[1], END_X, 0, CEIL, ...BZ, M.cream);
  slab(PASS[0], PASS[1], 0, 1.15, ...BZ, M.cream);
  slab(PASS[0], PASS[1], 1.95, CEIL, ...BZ, M.cream);
  slab(WEST_X, END_X, 0, 0.12, BACK_Z - 0.02, BACK_Z, M.black);
  slab(PASS[0] - 0.05, PASS[1] + 0.05, 1.13, 1.17, BACK_Z - 0.12, BACK_Z + 0.35, M.steel, true);
  slab(PASS[0], PASS[1], 1.86, 1.95, BACK_Z, BACK_Z + 0.32, M.steel);
  slab(PASS[0] + 0.1, PASS[1] - 0.1, 1.845, 1.86, BACK_Z + 0.08, BACK_Z + 0.24, basic("#ff7a2a", 2.4)); // heat lamp
  const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome);
  bellDome.position.set(PASS[1] - 0.15, 1.17, BACK_Z - 0.05);
  add(bellDome);
  for (let i = 0; i < 4; i++) {
    const ticket = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.13), M.paper);
    ticket.position.set(PASS[0] + 0.25 + i * 0.16, 1.78, BACK_Z - 0.01);
    ticket.rotation.set(0, Math.PI, 0.04 * (i % 2 ? 1 : -1));
    add(ticket);
  }
  // A clock over the pass at noon: no numbers, both hands up.
  {
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 40), M.paper);
    face.position.set(-1.3, 2.5, BACK_Z - 0.02);
    face.rotation.y = Math.PI;
    add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 40), M.chrome);
    rim.position.copy(face.position);
    add(rim);
    slab(-1.31, -1.29, 2.5, 2.66, BACK_Z - 0.04, BACK_Z - 0.03, M.black);
    slab(-1.312, -1.288, 2.5, 2.62, BACK_Z - 0.05, BACK_Z - 0.04, M.black).rotation.z = 0.06;
  }
  // The kitchen beyond: steel, a hood, the flat-top.
  slab(-3.4, 0.8, 0, 0.01, BACK_Z + 0.15, 5.2, M.kitchenFloor);
  slab(-3.4, 0.8, 0, CEIL, 5.2, 5.35, M.kitchen);
  // From the back face of the diner wall: started at BACK_Z, their fronts lay
  // in the wall's own face and fought it as two flickering strips.
  slab(-3.55, -3.4, 0, CEIL, BZ[1], 5.35, M.kitchen);
  slab(0.8, 0.95, 0, CEIL, BZ[1], 5.35, M.kitchen);
  slab(-3.4, 0.8, CEIL - 0.01, CEIL, BZ[1], 5.35, M.ceiling);
  slab(-2.4, -0.2, 0, 0.92, 4.25, 5.2, M.steel, true);
  slab(-2.35, -0.25, 0.92, 0.96, 4.3, 5.1, M.black);
  slab(-2.5, -0.1, 2.15, 2.6, 4.2, 5.2, M.steel, true);
  slab(-2.3, -0.3, 2.13, 2.15, 4.35, 5.1, basic("#ffd29a", 1.3));

  // ── Booths along the window ──────────────────────────────────────────────
  for (const tx of TABLES) {
    const [tz0, tz1] = TABLE_Z;
    const tzc = (tz0 + tz1) / 2;
    for (const s of [1, -1]) {
      const a = tx + s * 0.385;
      const b = tx + s * 0.835;
      const c = tx + s * 1.0;
      slab(a, b, SEAT_TOP - 0.12, SEAT_TOP, WALL_Z, -1.85, M.vinyl, true);
      slab(a + s * 0.02, c, 0, SEAT_TOP - 0.12, WALL_Z, -1.86, M.vinylDark);
      slab(b, c - s * 0.02, SEAT_TOP, 1.2, WALL_Z, -1.85, M.vinyl, true);
      slab(b - s * 0.02, c, 1.2, 1.25, WALL_Z, -1.84, M.chrome);
      slab(a + s * 0.02, c, 0.06, 0.09, -1.86, -1.845, M.chrome);
    }
    slab(tx - 0.375, tx + 0.375, TABLE_TOP - 0.035, TABLE_TOP, tz0, tz1, M.formica, true);
    slab(tx - 0.381, tx + 0.381, TABLE_TOP - 0.033, TABLE_TOP - 0.004, tz0 - 0.006, tz1 + 0.006, M.chrome);
    cyl(0.045, 0.05, TABLE_TOP - 0.035, M.chrome, tx, (TABLE_TOP - 0.035) / 2, tzc, 14);
    cyl(0.24, 0.26, 0.025, M.chrome, tx, 0.0125, tzc, 24);
    // On the sill: a napkin box and the tabletop jukebox selector.
    slab(tx - 0.3, tx - 0.06, SILL + 0.035, SILL + 0.24, WALL_Z + 0.0, WALL_Z + 0.13, M.chrome, true);
    slab(tx - 0.27, tx - 0.09, SILL + 0.1, SILL + 0.22, WALL_Z + 0.13, WALL_Z + 0.135, basic("#ffd9a0", 0.9));
    slab(tx + 0.1, tx + 0.22, SILL + 0.035, SILL + 0.15, WALL_Z + 0.01, WALL_Z + 0.11, M.chrome, true);
    // Salt, pepper, ketchup, sugar, at the window end of each table.
    cyl(0.018, 0.02, 0.07, M.china, tx - 0.05, TABLE_TOP + 0.035, tz0 + 0.09, 10);
    cyl(0.018, 0.02, 0.07, M.black, tx + 0.0, TABLE_TOP + 0.035, tz0 + 0.09, 10);
    cyl(0.025, 0.03, 0.19, M.ketchup, tx + 0.07, TABLE_TOP + 0.095, tz0 + 0.1, 12, scene, true);
    cyl(0.03, 0.03, 0.1, glass, tx + 0.14, TABLE_TOP + 0.05, tz0 + 0.09, 12);
    cyl(0.031, 0.031, 0.025, M.chrome, tx + 0.14, TABLE_TOP + 0.11, tz0 + 0.09, 12);
  }
  // Another customer's leftovers two booths down: a plate and a mug.
  cyl(0.12, 0.1, 0.018, M.china, TABLES[1] + 0.12, TABLE_TOP + 0.009, -2.4, 24, scene, true);
  cyl(0.042, 0.038, 0.095, M.china, TABLES[1] - 0.15, TABLE_TOP + 0.048, -2.2, 16, scene, true);

  // ── The counter, stools, pie case ────────────────────────────────────────
  const CX = [-3.8, 1.6];
  slab(CX[0], CX[1], 0.1, 1.03, 0.75, 1.3, M.counterFront, true);
  slab(CX[0], CX[1], 0, 0.1, 0.78, 1.3, M.black);
  for (const y of [0.3, 0.86]) slab(CX[0], CX[1], y, y + 0.035, 0.735, 0.75, M.chrome);
  slab(CX[0] - 0.1, CX[1] + 0.1, 1.03, 1.07, 0.5, 1.35, M.counterTop, true);
  slab(CX[0] - 0.1, CX[1] + 0.1, 1.0, 1.075, 0.49, 0.505, M.chrome);
  for (let i = 0; i < 7; i++) {
    const x = -3.3 + i * 0.75;
    cyl(0.04, 0.04, STOOL_TOP - 0.05, M.chrome, x, (STOOL_TOP - 0.05) / 2, STOOL_Z, 12);
    cyl(0.2, 0.22, 0.025, M.chrome, x, 0.0125, STOOL_Z, 20);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 24), M.chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.3, STOOL_Z);
    add(ring);
    cyl(0.205, 0.205, 0.035, M.chrome, x, STOOL_TOP - 0.06, STOOL_Z, 24);
    cyl(0.2, 0.19, 0.07, M.vinyl, x, STOOL_TOP - 0.035, STOOL_Z, 24, scene, true);
  }
  // Behind the counter: back bar, coffee machine, mixer, shelves of mugs.
  slab(WEST_X, PASS[0] - 0.1, 0, 0.95, 2.45, BACK_Z, M.steel, true);
  slab(PASS[1] + 0.1, 2.2, 0, 0.95, 2.45, BACK_Z, M.steel, true);
  slab(0.25, 0.85, 0.95, 1.55, 2.5, 2.95, M.steel, true);
  slab(0.3, 0.8, 1.42, 1.44, 2.48, 2.5, basic("#ff3b2b", 1.6));
  for (const x of [0.4, 0.68]) {
    cyl(0.07, 0.08, 0.17, glass, x, 1.06, 2.42, 16);
    cyl(0.066, 0.076, 0.1, M.coffee, x, 1.03, 2.42, 16);
    cyl(0.05, 0.07, 0.03, M.black, x, 1.16, 2.42, 16);
  }
  slab(1.25, 1.5, 0.95, 1.4, 2.6, 2.85, M.mint, true);
  cyl(0.06, 0.05, 0.18, M.chrome, 1.375, 1.2, 2.55, 14);
  for (const y of [1.6, 2.0]) slab(-4.8, -2.4, y, y + 0.03, 2.75, BACK_Z, M.wood);
  for (const y of [1.6, 2.0]) slab(0.1, 2.4, y, y + 0.03, 2.75, BACK_Z, M.wood);
  {
    const mugs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 12), M.china, 40);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const y of [1.675, 2.075]) {
      for (const [a, b] of [
        [-4.7, -2.5],
        [0.2, 2.3],
      ]) {
        for (let x = a; x < b && n < 40; x += 0.22) mugs.setMatrixAt(n++, m4.makeTranslation(x, y, 2.88));
      }
    }
    mugs.count = n;
    add(mugs);
  }
  // The pie case: chrome frame, glass, two shelves of pie, a cake dome beside it.
  {
    const px = 1.05;
    const pz = 0.95;
    slab(px - 0.34, px + 0.34, 1.07, 1.11, pz - 0.26, pz + 0.26, M.chrome, true);
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      slab(px + dx * 0.33 - 0.01, px + dx * 0.33 + 0.01, 1.11, 1.6, pz + dz * 0.25 - 0.01, pz + dz * 0.25 + 0.01, M.chrome);
    slab(px - 0.34, px + 0.34, 1.6, 1.63, pz - 0.26, pz + 0.26, M.chrome, true);
    slab(px - 0.32, px + 0.32, 1.34, 1.35, pz - 0.24, pz + 0.24, glass);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.49, 0.5), glass);
    box.position.set(px, 1.355, pz);
    add(box);
    for (const [y, dx, fill] of [
      [1.11, -0.15, M.crust],
      [1.11, 0.15, M.cherry],
      [1.35, -0.15, M.crust],
      [1.35, 0.15, M.crust],
    ]) {
      cyl(0.12, 0.11, 0.05, M.crust, px + dx, y + 0.03, pz, 24, scene, true);
      cyl(0.105, 0.105, 0.01, fill, px + dx, y + 0.056, pz, 24);
    }
    const cx = px - 0.62;
    cyl(0.15, 0.06, 0.12, M.chrome, cx, 1.13, pz - 0.05, 20);
    cyl(0.12, 0.12, 0.12, M.paper, cx, 1.25, pz - 0.05, 24, scene, true);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    dome.position.set(cx, 1.19, pz - 0.05);
    add(dome);
  }
  // A gumball machine by the door.
  {
    const gx = -4.85;
    const gz = -2.55;
    cyl(0.03, 0.03, 0.9, M.chrome, gx, 0.45, gz, 12);
    cyl(0.16, 0.18, 0.03, M.chrome, gx, 0.015, gz, 18);
    cyl(0.1, 0.12, 0.22, M.counterFront, gx, 1.0, gz, 16, scene, true);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), glass);
    globe.position.set(gx, 1.24, gz);
    add(globe);
    const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 8, 6), w.ink({ tint: "#ffffff", tone: 1, rim: 0.3, spec: 1 }), 34);
    const tints = ["#e8452c", "#f2c230", "#3a8ee6", "#4fb35a", "#f1ece2"];
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 34; i++) {
      const a = hash(i * 2.3) * Math.PI * 2;
      const r = Math.sqrt(hash(i * 7.1)) * 0.11;
      m4.makeTranslation(gx + Math.cos(a) * r, 1.14 + hash(i * 3.7) * 0.11 * (1 - r / 0.14), gz + Math.sin(a) * r);
      balls.setMatrixAt(i, m4);
      balls.setColorAt(i, new THREE.Color(tints[i % tints.length]));
    }
    add(balls);
  }
  // Ceiling fans, turning lazily in the heat.
  const fans = [-3.1, -0.6, 1.9].map((x) => {
    const fan = new THREE.Group();
    fan.position.set(x, CEIL, -0.4);
    cyl(0.015, 0.015, 0.36, M.wood, 0, -0.18, 0, 8, fan);
    cyl(0.1, 0.12, 0.12, M.wood, 0, -0.42, 0, 16, fan, true);
    const blades = new THREE.Group();
    blades.position.y = -0.43;
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.13), M.wood);
      blade.geometry.translate(0.4, 0, 0);
      blade.rotation.set(0.12, (i * Math.PI) / 2, 0);
      blades.add(blade);
      outline(blade, w.line);
    }
    fan.add(blades);
    scene.add(fan);
    return blades;
  });

  // ── Reacher's table: eggs, toast, the mug, a fork ────────────────────────
  {
    const plate = toWorld(-0.05, TABLE_TOP, 0.56);
    cyl(0.135, 0.11, 0.018, M.china, plate.x, TABLE_TOP + 0.009, plate.z, 28, scene, true);
    const eggShape = (seed) => {
      const pts = [];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const r = 0.05 * (1 + 0.18 * Math.sin(a * 3 + seed) + 0.1 * Math.sin(a * 5 + seed * 2));
        pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
      }
      return new THREE.ShapeGeometry(new THREE.Shape(pts));
    };
    [
      [-0.035, 0.03, 1.3],
      [0.04, -0.025, 4.1],
    ].forEach(([dx, dz, seed]) => {
      const white = new THREE.Mesh(eggShape(seed), M.eggWhite);
      white.rotation.x = -Math.PI / 2;
      white.position.set(plate.x + dx, TABLE_TOP + 0.02, plate.z + dz);
      add(white);
      const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.02, 14, 10), M.yolk);
      yolk.scale.set(1, 0.55, 1);
      yolk.position.set(plate.x + dx + 0.005, TABLE_TOP + 0.024, plate.z + dz);
      add(yolk);
    });
    const toast = slab(-0.045, 0.045, TABLE_TOP + 0.02, TABLE_TOP + 0.032, -0.05, 0.05, M.toast);
    toast.position.set(plate.x - 0.06, TABLE_TOP + 0.03, plate.z - 0.075);
    toast.rotation.set(0.1, 0.5, 0);
  }
  // Held props follow fig.hold's convention: origin at the gripped point,
  // +Y out past the thumb, +Z along the fingers.
  const cup = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.038, 0.095, 20), M.china);
    cup.add(body);
    outline(body, w.line);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(0.039, 20), M.coffee);
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.036;
    cup.add(surface);
    // The handle off the free side of the grip, away from the palm.
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 14, Math.PI * 1.2), M.china);
    handle.position.set(-0.045, 0, 0);
    handle.rotation.z = Math.PI * 0.4;
    cup.add(handle);
  }
  const fork = new THREE.Group();
  {
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.15, 0.004), M.chrome);
    stem.position.y = 0.0;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.003), M.chrome);
    neck.position.y = 0.085;
    fork.add(stem, neck);
    for (const dx of [-0.0075, 0, 0.0075]) {
      const tine = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.04, 0.003), M.chrome);
      tine.position.set(dx, 0.115, 0);
      fork.add(tine);
    }
  }
  // Where the fork ends up when he puts it down: across the rim of his plate.
  const FORK_REST = { pos: toWorld(-0.13, TABLE_TOP + 0.022, 0.5), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.5, "YXZ")) };

  // A slice of Georgia peach pie on a plate: bottom crust, filling showing on
  // the cut faces, lattice-brown top, a spoon of cream. Origin: plate bottom.
  const piePlate = new THREE.Group();
  {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.014, 26), M.china);
    plate.position.y = 0.007;
    outline(plate, w.line);
    piePlate.add(plate);
    const R = 0.092;
    const A = 0.78;
    const wedge = (r, h, mat, y) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, r, 0, A, false);
      shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 10 });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat);
      m.position.y = y;
      return m;
    };
    const slice = new THREE.Group();
    const peach = w.ink({ tint: "#e8963a", tone: 0.95, rim: 0.3, spec: 0.8 });
    const bottom = wedge(R, 0.012, M.crust, 0);
    const filling = wedge(R * 0.96, 0.03, peach, 0.012);
    const top = wedge(R, 0.012, M.toast, 0.042);
    outline(top, w.line);
    outline(bottom, w.line);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.002, 0.05, 12, 1, true, Math.PI / 2, A), M.crust);
    rim.position.y = 0.027;
    const cream = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), M.eggWhite);
    cream.scale.y = 0.7;
    cream.position.set(Math.cos(A / 2) * 0.05, 0.058, -Math.sin(A / 2) * 0.05);
    slice.add(bottom, filling, top, rim, cream);
    // Centre the wedge on the plate, point toward the diner.
    slice.position.set(-Math.cos(A / 2) * 0.05, 0.014, Math.sin(A / 2) * 0.05);
    const turn = new THREE.Group();
    turn.add(slice);
    turn.rotation.y = -A / 2;
    piePlate.add(turn);
  }

  // Service pistols: matte black, the grip at the origin, the slide forward.
  const pistol = () => {
    const gun = new THREE.Group();
    const black = M.black;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.105, 0.036), black);
    grip.rotation.x = 0.28;
    grip.position.set(0, -0.005, -0.008);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.15), black);
    frame.position.set(0, 0.055, 0.045);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.026, 0.185), w.ink({ tint: "#2a2c30", tone: 0.5, rim: 0.6, spec: 0.8 }));
    slide.position.set(0, 0.078, 0.05);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 5, 12, Math.PI), black);
    guard.rotation.set(0, Math.PI / 2, Math.PI);
    guard.position.set(0, 0.04, 0.035);
    gun.add(grip, frame, slide, guard);
    [grip, frame, slide].forEach((m) => outline(m, w.line));
    return gun;
  };
  const guns = [pistol(), pistol()];

  // ── Outside: Main Street, Margrave, at noon ──────────────────────────────
  const O = {
    concrete: outside("#d8cfbd", { tone: 0.9, rim: 0.2 }),
    asphalt: outside("#55545a", { tone: 0.62, rim: 0.1 }),
    stripe: outside("#e2b93b", { tone: 0.9, rim: 0.1 }),
    brick: outside("#9a5039", { tone: 0.78 }),
    tan: outside("#cdb085", { tone: 0.85 }),
    white: outside("#ece5d4", { tone: 0.82 }),
    green: outside("#3c6b50", { tone: 0.7 }),
    navy: outside("#2f3f5c", { tone: 0.6 }),
    awningRed: outside("#a8342b", { tone: 0.75 }),
    window: outside("#2a3038", { tone: 0.5, spec: 1 }),
    leaf: outside("#46602f", { tone: 0.7, rim: 0.3 }),
    leafFar: outside("#5f7547", { tone: 0.7, rim: 0.2 }),
    bark: outside("#4a3a2c", { tone: 0.6 }),
    pole: outside("#6a5848", { tone: 0.6 }),
    tank: outside("#d7d9d6", { tone: 0.9, spec: 0.6 }),
  };
  // The street runs on past both ends of the frame: from the booth the door
  // shot looks down it, along the windows, nearly end-on.
  slab(-110, 110, 0, 0.13, -5.0, WALL_Z - 0.2, O.concrete);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(240, 70), O.asphalt);
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, -40);
  add(street);
  {
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.01, 0.12), O.stripe, 66);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 66; i++) dashes.setMatrixAt(i, m4.makeTranslation(-106.6 + i * 3.2, 0.005, -11));
    add(dashes);
  }
  slab(-110, 110, 0, 0.13, -19, -17, O.concrete);
  // Storefronts across the street: brick, stucco, awnings, dark glass.
  {
    const walls = [O.brick, O.tan, O.white, O.brick, O.green, O.tan, O.white, O.brick];
    const awnings = [O.awningRed, O.green, O.navy, O.awningRed];
    // `line`: outlined in the frame; the blocks past it go without (deep in the haze).
    const store = (x, wdt, i, line) => {
      const h = 4 + hash(i * 1.7) * 3;
      slab(x, x + wdt - 0.1, 0, h, -25, -19, walls[i % walls.length], line);
      slab(x - 0.05, x + wdt - 0.05, h, h + 0.35, -19.2, -18.9, walls[(i + 3) % walls.length]);
      slab(x + 0.5, x + wdt - 0.6, 0.4, 2.6, -18.95, -18.9, O.window);
      for (let k = 0; k < Math.floor(wdt / 1.6); k++) slab(x + 0.6 + k * 1.6, x + 1.5 + k * 1.6, 3.1, 4.0, -18.95, -18.92, O.window);
      if (i % 2 === 0) {
        const aw = slab(x + 0.3, x + wdt - 0.4, 2.7, 2.78, -18.9, -17.6, awnings[(i / 2) % awnings.length], line);
        aw.rotation.x = -0.32;
      }
    };
    let x = -34;
    let i = 0;
    while (x < 34) {
      const wdt = 5 + hash(i * 3.3) * 4;
      store(x, wdt, i, true);
      x += wdt;
      i += 1;
    }
    // On down Main Street both ways, so the window never shows the end of the world.
    for (let e = x; e < 104; i += 1) {
      const wdt = 5 + hash(i * 3.3) * 4;
      store(e, wdt, i, false);
      e += wdt;
    }
    for (let e = -34; e > -104; i += 1) {
      const wdt = 5 + hash(i * 3.3) * 4;
      e -= wdt;
      store(e, wdt, i, false);
    }
  }
  // Two big oaks and the telephone line, then the water tower over the trees.
  const tree = (x, z, s, mat) => {
    cyl(0.18 * s, 0.25 * s, 3 * s, O.bark, x, 1.5 * s, z, 10);
    for (let k = 0; k < 6; k++) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry((1.2 + hash(k + x) * 0.6) * s, 1), mat);
      blob.position.set(x + (hash(k * 3.1 + x) - 0.5) * 2.6 * s, (3.3 + hash(k * 1.9 + z) * 1.6) * s, z + (hash(k * 5.3) - 0.5) * 1.6 * s);
      add(blob);
    }
  };
  tree(-9.5, -18, 1.15, O.leaf);
  tree(8.5, -18.2, 1.0, O.leaf);
  for (let i = 0; i < 26; i++) tree(-60 + i * 4.8 + hash(i) * 2, -34 - hash(i * 2.1) * 6, 1.6 + hash(i * 4.4), O.leafFar);
  const poles = [-24, -12, 0, 12, 24];
  poles.forEach((x) => {
    cyl(0.1, 0.13, 8, O.pole, x, 4, -17.6, 8);
    slab(x - 0.9, x + 0.9, 7.3, 7.42, -17.66, -17.54, O.pole);
  });
  {
    const wire = new THREE.LineBasicMaterial({ color: "#3a3430" });
    for (const dx of [-0.7, 0.7]) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const x = -24 + i * 0.5;
        const local = (((x + 24) % 12) + 12) % 12;
        pts.push(new THREE.Vector3(x + dx, 7.45 - Math.sin((local / 12) * Math.PI) * 0.55, -17.6));
      }
      add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
    }
  }
  {
    const tower = new THREE.Group();
    tower.position.set(-17, 0, -48);
    for (const [dx, dz] of [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 14, 8), O.tank);
      leg.position.set(dx * 0.85, 7, dz * 0.85);
      leg.rotation.set(dz * -0.04, 0, dx * 0.04);
      tower.add(leg);
    }
    const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.6, 28), O.tank);
    tankBody.position.y = 15.6;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.6, 28), O.tank);
    roof.position.y = 18.2;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(3.2, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), O.tank);
    bowl.position.y = 13.8;
    bowl.scale.y = 0.4;
    tower.add(tankBody, roof, bowl);
    scene.add(tower);
  }
  // The sky: Georgia haze, nearly white at the horizon.
  {
    const tex = canvasTexture(8, 256, (ctx, wd, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#8fb6d6");
      g.addColorStop(0.55, "#cfe0e6");
      g.addColorStop(0.8, "#f4eedf");
      g.addColorStop(1, "#f6efe0");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, wd, h);
    });
    const skyMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.78, 0.74, 0.68) });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(320, 110), skyMat);
    sky.position.set(0, 40, -75);
    add(sky);
    // And a drum all the way round behind it: looking down the street, past the
    // card's edge, the glass showed the bare page. Inside the far plane (200).
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(170, 170, 100, 48, 1, true), new THREE.MeshBasicMaterial({ map: tex, color: skyMat.color, side: THREE.BackSide }));
    drum.position.y = 35;
    add(drum);
  }

  // ── Cruisers ─────────────────────────────────────────────────────────────
  const P = {
    black: outside("#16181c", { tone: 0.75, rim: 0.7, spec: 1 }),
    white: outside("#f2f1ec", { tone: 0.95, rim: 0.5, spec: 1 }),
    glass: outside("#1e2632", { tone: 0.55, rim: 0.6, spec: 1 }),
    chrome: outside("#cfd3d8", { tone: 1.1, rim: 0.6, spec: 1 }),
    tire: outside("#131313", { tone: 0.4, rim: 0.2 }),
    hub: outside("#b8bcc2", { tone: 1.0, spec: 1 }),
    gold: outside("#c9a646", { tone: 0.95, spec: 1 }),
  };
  const profile = (pts, depth, mat, bevel = 0.04) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  };
  const buildCruiser = () => {
    const car = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = 0.45;
    car.add(body);
    const part = (m) => {
      m.position.y -= 0.45;
      body.add(m);
      outline(m, w.line);
      return m;
    };
    // Black hood, fenders and trunk; white doors and roof.
    part(
      profile(
        [
          [2.5, 0.48],
          [2.56, 0.6],
          [2.45, 0.86],
          [1.15, 0.95],
          [-1.55, 0.96],
          [-2.45, 0.94],
          [-2.56, 0.62],
          [-2.48, 0.48],
        ],
        1.72,
        P.black,
      ),
    );
    part(
      profile(
        [
          [1.15, 0.95],
          [0.42, 1.4],
          [-0.88, 1.42],
          [-1.55, 0.96],
        ],
        1.5,
        P.glass,
        0.03,
      ),
    );
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 1.48), P.white);
    roof.position.set(-0.23, 1.45, 0);
    part(roof);
    for (const s of [1, -1]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.41, 0.02), P.white);
      door.position.set(-0.08, 0.725, s * 0.905);
      part(door);
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.11, 5), P.gold);
      star.position.set(0.45, 0.72, s * 0.92);
      star.rotation.y = s > 0 ? 0 : Math.PI;
      star.position.y -= 0.45;
      body.add(star);
      for (const x of [1.5, -1.5]) {
        const arch = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20, 0, Math.PI), P.tire);
        arch.position.set(x, 0.34 - 0.45, s * 0.903);
        arch.rotation.y = s > 0 ? 0 : Math.PI;
        body.add(arch);
      }
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), P.black);
      mirror.position.set(1.0, 1.02, s * 0.95);
      part(mirror);
    }
    // Push bar, grille, lights.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 1.3), P.black);
    bar.position.set(2.68, 0.58, 0);
    part(bar);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 1.0), P.chrome);
    grille.position.set(2.56, 0.66, 0);
    grille.position.y -= 0.45;
    body.add(grille);
    for (const s of [1, -1]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.3), basic("#fff6e6", 1.6));
      head.position.set(2.53, 0.72 - 0.45, s * 0.65);
      body.add(head);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.34), basic("#d1121c", 1.2));
      tail.position.set(-2.55, 0.74 - 0.45, s * 0.62);
      body.add(tail);
    }
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), P.chrome);
    spot.rotation.z = Math.PI / 2;
    spot.position.set(0.95, 1.1 - 0.45, 0.82);
    body.add(spot);
    // The lightbar: driver's side red, passenger's side blue.
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.34), P.black);
    base.position.set(-0.05, 1.5, 0);
    part(base);
    const lamps = [1, -1].map((s) => {
      const mat = basic(s > 0 ? RED : BLUE, 1);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.56), mat);
      lamp.position.set(-0.05, 1.585 - 0.45, s * 0.36);
      body.add(lamp);
      const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: s > 0 ? RED : BLUE, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glowSprite.position.copy(lamp.position);
      glowSprite.scale.setScalar(1.6);
      body.add(glowSprite);
      // The bar's light on the street around the car.
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), additive(s > 0 ? RED : BLUE, 0, dot));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.02, s * 1.2);
      car.add(pool);
      return { mat, color: (s > 0 ? RED : BLUE).clone(), glow: glowSprite, pool };
    });
    const wheels = [];
    for (const x of [1.5, -1.5]) {
      for (const s of [1, -1]) {
        const wheel = new THREE.Group();
        wheel.position.set(x, 0.34, s * 0.8);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20), P.tire);
        tire.rotation.x = Math.PI / 2;
        wheel.add(tire);
        outline(tire, w.line);
        const hub = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), P.hub);
        hub.position.z = s * 0.125;
        hub.rotation.y = s > 0 ? 0 : Math.PI;
        wheel.add(hub);
        car.add(wheel);
        wheels.push(wheel);
      }
    }
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.9), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: 0.7, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    car.add(shadow);
    scene.add(car);
    return { car, body, wheels, lamps };
  };
  // A comes from the east and slews to a stop in the far lane, right outside
  // Reacher's window; B from the west, nosing in toward the curb.
  const cars = [
    { ...buildCruiser(), from: 22, to: 1.0, z: -8.5, t0: 10.1, t1: 11.1, dir: -1, yaw: -0.12, phase: 0 },
    { ...buildCruiser(), from: -22, to: -1.8, z: -6.45, t0: 10.35, t1: 11.35, dir: 1, yaw: -0.2, phase: 0.37 },
  ];

  // ── Light in the room ────────────────────────────────────────────────────
  // Sun shafts through each window, a bright patch on the floor, dust in the air.
  const patchGeo = (x0, x1) => {
    const corner = (x, y) => {
      const t = y / -SHAFT.y;
      return [x + SHAFT.x * t, 0.004, WALL_Z + SHAFT.z * t];
    };
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...corner(x0, SILL), ...corner(x1, SILL), ...corner(x1, HEAD), ...corner(x0, HEAD)], 3));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    return g;
  };
  const spills = [];
  for (const [x0, x1] of WINDOWS) {
    add(new THREE.Mesh(patchGeo(x0 + 0.06, x1 - 0.06), additive("#ffb866", 0.09)));
    const spill = new THREE.Mesh(patchGeo(x0 - 0.4, x1 + 0.4), additive("#ffffff", 0));
    spill.position.y = 0.002;
    add(spill);
    spills.push(spill);
    const mid = (x0 + x1) / 2;
    const top = new THREE.Vector3(mid, 2.2, WALL_Z - 0.05);
    const end = top.clone().addScaledVector(SHAFT, 2.2 / -SHAFT.y);
    const beam = lightBeam({ from: top.toArray(), to: end.toArray(), radiusFrom: (x1 - x0) * 0.3, radiusTo: (x1 - x0) * 0.45, color: "#ffd9a0" });
    beam.material.uniforms.uIntensity.value = 0.05;
    scene.add(beam);
  }
  // Table-top spill of the bars on Reacher's table.
  const tableSpill = slab(TABLES[0] - 0.37, TABLES[0] + 0.37, TABLE_TOP + 0.001, TABLE_TOP + 0.002, TABLE_Z[0], TABLE_Z[1], additive("#ffffff", 0));
  spills.push(tableSpill);

  const dust = createParticles({ count: 170, blending: "add" });
  scene.add(dust.points);
  let dustSeed = 0;
  const mote = () => {
    dustSeed += 1;
    const x = WEST_X + 0.8 + hash(dustSeed * 1.3) * (END_X - WEST_X - 1.2);
    dust.emit({
      position: [x, 0.7 + hash(dustSeed * 2.7) * 1.9, WALL_Z + 0.2 + hash(dustSeed * 5.1) * 2.0],
      velocity: [(hash(dustSeed * 7.3) - 0.5) * 0.05, 0.015 + hash(dustSeed) * 0.02, (hash(dustSeed * 9.1) - 0.5) * 0.05],
      life: 7 + hash(dustSeed * 3.9) * 3,
      size: 0.006 + hash(dustSeed * 4.4) * 0.006,
      color: "#fff0cc",
      alpha: 0.55,
    });
  };
  for (let i = 0; i < 170; i++) {
    mote();
    dust.step(9 / 170);
  }
  let moteDebt = 0;
  const grit = createParticles({ count: 90, blending: "normal" });
  scene.add(grit.points);

  // ── People ───────────────────────────────────────────────────────────────
  const cast = { reacher: null, cook: null, waitress: null, patron: null, copA: null, copB: null };
  const ink = { tone: 0.88, rim: 0.7 };
  // Margrave PD: navy short-sleeved uniform shirts, duty belts, peaked caps.
  const UNIFORM = { top: NAVY, collar: NAVY, bottom: "#1c2333", shoes: "#141414", belt: "#121212", sleeves: "short" };
  const loads = [
    createModelFigure({ height: 2.0, hair: ["HairBuzzed", "EyebrowsRegular"], line: w.line, ink: { tone: 0.92, rim: 0.55 }, outfit: { skin: "#c99572", top: OLIVE, collar: "#1c1e21", bottom: "#172033", shoes: "#2a1d16", hair: "#5a3d24", sleeves: "long" } }),
    createModelFigure({ height: 1.8, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink, outfit: { skin: "#8d5a3c", top: "#f3f1ea", bottom: "#e6e3db", shoes: "#2b2b2b", hair: "#1b1410", sleeves: "short" } }),
    // The waitress: hair pinned up in a bun, a mint uniform dress (its
    // collar, cuffs, skirt, apron and updo are cut in tailorWaitress), nude
    // stockings, white work shoes.
    createModelFigure({
      body: "SuperheroFemale",
      height: 1.66,
      hair: ["HairSimpleParted", "EyebrowsFemale"],
      line: w.line,
      ink,
      outfit: { skin: "#f0cdb0", top: "#a6cdc4", bottom: "#a6cdc4", shoes: "#efebe2", hair: "#7a4a2a", sleeves: "short", skirt: 0.31, stockings: "#e2bfa4", stockingsTop: 0.27, footwear: "loafers" },
    }),
    createModelFigure({ height: 1.78, hair: ["HairBeard", "EyebrowsRegular"], line: w.line, ink, outfit: { skin: "#c58e6a", top: "#5f7f9e", bottom: "#3f4b5e", shoes: "#5a3a22", hair: "#b9b4ac", sleeves: "rolled" } }),
    createModelFigure({ height: 1.86, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink, outfit: { ...UNIFORM, skin: "#d9a98a", hair: "#4a3424" }, dress: { collar: true, placket: true, belt: true } }),
    createModelFigure({ height: 1.82, hair: ["HairBuzzed", "EyebrowsRegular"], line: w.line, ink, outfit: { ...UNIFORM, skin: "#7a4b32", hair: "#141010" }, dress: { collar: true, placket: true, belt: true } }),
  ];
  const tmp = new THREE.Vector3();
  /** Bind a mesh to a bone where it sits now (figure at rest at the origin). */
  const bind = (fig, boneName, mesh, at) => {
    fig.root.updateMatrixWorld(true);
    const bone = fig.bones[boneName] ?? fig.model.getObjectByName(boneName);
    mesh.position.copy(at);
    scene.add(mesh);
    bone.attach(mesh);
    return mesh;
  };
  /** The body mesh with the most vertices (the painted base body). */
  const bodyMesh = (fig) => {
    let body = null;
    fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
    return body;
  };
  /**
   * The outfit painter leaves the trapezius band (just under its head-and-neck
   * line) as skin, which from behind reads as bare shoulders. Paint that band,
   * outside the neck, with the top's colour. Bind-space test, as the painter's.
   */
  const coverShoulders = (fig, top) => {
    const geo = bodyMesh(fig)?.geometry;
    if (!geo?.attributes.color) return;
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const H = max.y - min.y;
    const cx = (min.x + max.x) / 2;
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    const c = new THREE.Color(top);
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - min.y) / H;
      const ax = Math.abs(pos.getX(i) - cx) / H;
      if (ny > 0.82 && ny < 0.88 && ax > 0.045) col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  };
  /** The front of the posed body (largest z) near (x, y): where a badge sits flush. */
  const frontAt = (fig, x, y, r = 0.03) => {
    const body = bodyMesh(fig);
    fig.root.updateMatrixWorld(true);
    let z = -Infinity;
    const p = new THREE.Vector3();
    for (let i = 0; i < body.geometry.attributes.position.count; i++) {
      body.getVertexPosition(i, p).applyMatrix4(body.matrixWorld);
      if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r) z = Math.max(z, p.z);
    }
    return z;
  };
  const boneAt = (fig, name) => (fig.bones[name] ?? fig.model.getObjectByName(name)).getWorldPosition(new THREE.Vector3());

  // ── The waitress's uniform ───────────────────────────────────────────────
  // Eno's girl wears the classic: a pale mint short-sleeved dress with a white
  // Peter Pan collar and cuffs, a white half apron over it tied in a bow at
  // the back, an order pad and pen in the apron pocket, a name tag. The
  // painted body gives the fitted bodice; the rest is cut here as cloth over
  // it, one skinned shell on her own skeleton, so every piece follows her
  // walk and her bend. The skirt is weighted from the pelvis at the waist
  // toward each thigh at the hem, so it swings with the stride and flares
  // clear of the knees.
  const WAITRESS_DRESS = "#a6cdc4";
  const WHITE_TRIM = "#fbfaf5";
  const APRON_WHITE = "#f8f6ef";
  const tailorWaitress = (fig) => {
    const body = bodyMesh(fig);
    const geo = body.geometry;
    const bp = geo.attributes.position;
    const bn = geo.attributes.normal;
    const bi = geo.attributes.skinIndex;
    const bw = geo.attributes.skinWeight;
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const H = max.y - min.y;
    const S = H / 1.82;
    const cx = (min.x + max.x) / 2;
    const at = (f) => min.y + f * H;
    const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    const vert = (i) => V(bp.getX(i), bp.getY(i), bp.getZ(i));
    const bones = body.skeleton.bones;
    const boneIndex = (name) => bones.findIndex((b) => b.name === name);
    const bindOf = (i) => V().setFromMatrixPosition(body.skeleton.boneInverses[i].clone().invert());
    const limb = new Set(bones.flatMap((b, i) => (/upperarm|lowerarm|hand|index|middle|pinky|ring|thumb/.test(b.name) ? [i] : [])));
    const dominant = (i) => {
      let k = 0;
      for (let j = 1; j < 4; j++) if (bw.getComponent(i, j) > bw.getComponent(i, k)) k = j;
      return bi.getComponent(i, k);
    };

    // Body vertices in a coarse grid, for the cloth to find the skin under it.
    const CELL = 0.04 * S;
    const cells = new Map();
    const key = (a, b, c) => `${a},${b},${c}`;
    for (let i = 0; i < bp.count; i++) {
      const k = key(Math.floor(bp.getX(i) / CELL), Math.floor(bp.getY(i) / CELL), Math.floor(bp.getZ(i) / CELL));
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(i);
    }
    /** Body vertices within `r` of p (torso only: arms left out), nearest first if none. */
    const near = (p, r, torso) => {
      for (let grow = r; grow < 0.3 * S; grow *= 1.6) {
        const out = [];
        const n = Math.ceil(grow / CELL);
        const gx = Math.floor(p.x / CELL);
        const gy = Math.floor(p.y / CELL);
        const gz = Math.floor(p.z / CELL);
        for (let a = -n; a <= n; a++)
          for (let b = -n; b <= n; b++)
            for (let c = -n; c <= n; c++) {
              for (const i of cells.get(key(gx + a, gy + b, gz + c)) ?? []) {
                if (torso && limb.has(dominant(i))) continue;
                const d = Math.sqrt((bp.getX(i) - p.x) ** 2 + (bp.getY(i) - p.y) ** 2 + (bp.getZ(i) - p.z) ** 2);
                if (d < grow) out.push([i, 1 - d / grow]);
              }
            }
        if (out.length) return out;
      }
      return [];
    };
    /** Lay p on the skin under it, `off` out along the skin's normal. */
    const onBody = (p, off, r = 0.035 * S) => {
      for (let pass = 0; pass < 3; pass++) {
        const o = V();
        const nrm = V();
        let sum = 0;
        for (const [i, wt] of near(p, r, true)) {
          o.addScaledVector(vert(i), wt);
          nrm.addScaledVector(V(bn.getX(i), bn.getY(i), bn.getZ(i)), wt);
          sum += wt;
        }
        if (!sum) break;
        o.divideScalar(sum);
        nrm.normalize();
        p.addScaledVector(nrm, off - V().subVectors(p, o).dot(nrm));
      }
      return p;
    };
    /** Skin weights blended from the body under p. */
    const skinNear = (p, torso, r = 0.03 * S) => {
      const acc = new Map();
      for (const [i, wt] of near(p, r, torso))
        for (let j = 0; j < 4; j++) {
          const b = bi.getComponent(i, j);
          acc.set(b, (acc.get(b) ?? 0) + wt * bw.getComponent(i, j));
        }
      return acc;
    };

    // The skirt: an A-line from the waist to just below the knee, round the
    // hull of the hips and legs, never narrowing on the way down.
    const yTop = at(0.585);
    const yHem = at(0.255);
    const legs = [];
    for (let i = 0; i < bp.count; i++) if (bp.getY(i) > at(0.2) && bp.getY(i) < at(0.64) && Math.abs(bp.getX(i) - cx) < 0.14 * H) legs.push(i);
    let zLo = Infinity;
    let zHi = -Infinity;
    legs.forEach((i) => bp.getY(i) > at(0.48) && bp.getY(i) < at(0.56) && ((zLo = Math.min(zLo, bp.getZ(i))), (zHi = Math.max(zHi, bp.getZ(i)))));
    const cz = (zLo + zHi) / 2;
    const ROWS = 18;
    const COLS = 72;
    const yRow = (v) => lerp(yTop, yHem, v);
    const base = [];
    for (let r = 0; r <= ROWS; r++) {
      const y = yRow(r / ROWS);
      let row = Array.from({ length: COLS }, (_, c) => {
        const th = (c / COLS) * Math.PI * 2;
        const dx = Math.sin(th);
        const dz = Math.cos(th);
        let m = 0;
        for (const i of legs) if (Math.abs(bp.getY(i) - y) < (r < 3 ? 0.008 : 0.02) * H) m = Math.max(m, (bp.getX(i) - cx) * dx + (bp.getZ(i) - cz) * dz);
        return m;
      });
      for (let pass = 0; pass < 3; pass++) row = row.map((m, c) => Math.max(m, (row[(c + COLS - 1) % COLS] + 2 * m + row[(c + 1) % COLS]) / 4));
      base.push(r ? row.map((m, c) => Math.max(m, base[r - 1][c])) : row);
    }
    const baseAt = (v, th) => {
      const fr = Math.min(Math.max(v, 0), 1) * ROWS;
      const r0 = Math.min(Math.floor(fr), ROWS - 1);
      const fc = ((((th / (Math.PI * 2)) % 1) + 1) % 1) * COLS;
      const c0 = Math.floor(fc) % COLS;
      const c1 = (c0 + 1) % COLS;
      const row = (r) => lerp(base[r][c0], base[r][c1], fc - Math.floor(fc));
      return lerp(row(r0), row(r0 + 1), fr - r0);
    };
    const ease = (v) => 0.004 * S + 0.05 * S * Math.pow(Math.max(v, 0), 1.6);
    const foldAmp = (v) => 0.013 * S * Math.pow(Math.max(v, 0), 1.2);
    const folds = (v, th) => foldAmp(v) * (0.62 * Math.sin(9 * th + 0.4) + 0.38 * Math.sin(14 * th + 2.1));
    const vOf = (y) => (yTop - y) / (yTop - yHem);
    /** A point `extra` out from the skirt's smooth surface at (v, θ). */
    const round = (v, th, extra) => {
      const rr = baseAt(v, th) + ease(v) + extra;
      return V(cx + Math.sin(th) * rr, yRow(v), cz + Math.cos(th) * rr);
    };
    const outward = (p) => V(p.x - cx, 0, p.z - cz).normalize();

    // Thighs: which one is on +x in bind space.
    const tl = boneIndex("thigh_l");
    const tr = boneIndex("thigh_r");
    const [legPos, legNeg] = bindOf(tl).x > bindOf(tr).x ? [tl, tr] : [tr, tl];
    const pelvis = boneIndex("pelvis");
    const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    /** Skirt weights: the body's at the waist, pelvis and the near thigh below. */
    const skirtSkin = (p) => {
      const v = vOf(p.y);
      const t = 0.92 * smooth(v * 1.15);
      const side = smooth((p.x - cx) / (0.11 * H) + 0.5);
      const acc = new Map([
        [pelvis, 1 - t],
        [legPos, t * side],
        [legNeg, t * (1 - side)],
      ]);
      const b = smooth(v / 0.2);
      if (b >= 1) return acc;
      const top = skinNear(p, true);
      let tsum = 0;
      top.forEach((x) => (tsum += x));
      const mix = new Map();
      acc.forEach((x, k) => mix.set(k, x * b));
      top.forEach((x, k) => mix.set(k, (mix.get(k) ?? 0) + (x / tsum) * (1 - b)));
      return mix;
    };

    const pieces = [];
    /** Colour and skin a piece; `skin` is "skirt", "torso" or "limb". */
    const finish = (g, color, skin) => {
      g.deleteAttribute("uv");
      if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
      if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      const si = new Uint16Array(n * 4);
      const sw = new Float32Array(n * 4);
      const p = V();
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        p.fromBufferAttribute(g.attributes.position, i);
        c.set(typeof color === "function" ? color(p) : color);
        col.set([c.r, c.g, c.b], i * 3);
        const acc = skin === "skirt" ? skirtSkin(p) : skinNear(p, skin === "torso");
        const top = [...acc].sort((a, b) => b[1] - a[1]).slice(0, 4);
        const sum = top.reduce((s, x) => s + x[1], 0) || 1;
        top.forEach(([b, x], j) => {
          si[i * 4 + j] = b;
          sw[i * 4 + j] = x / sum;
        });
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
      pieces.push(g);
      return g;
    };
    /**
     * Cloth of thickness `t` from a grid of points (rows × cols): the outer
     * face, the inner face and the cut edges between them. `wrap` joins the
     * last column to the first; `out(p)` points away from the body.
     */
    const panel = (pts, { t = 0.004 * S, wrap = false, out = outward } = {}) => {
      const R = pts.length;
      const C = pts[0].length;
      const cl = (k) => (wrap ? (k + C) % C : Math.min(C - 1, Math.max(0, k)));
      const pos = [];
      const index = [];
      const nrm = [];
      for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++) {
          const a = V().subVectors(pts[r][cl(c + 1)], pts[r][cl(c - 1)]);
          const b = V().subVectors(pts[Math.min(R - 1, r + 1)][c], pts[Math.max(0, r - 1)][c]);
          const n = a.cross(b).normalize();
          if (n.dot(out(pts[r][c])) < 0) n.negate();
          nrm.push(n);
        }
      for (const s of [1, -1]) for (let k = 0; k < R * C; k++) pos.push(pts[Math.floor(k / C)][k % C].clone().addScaledVector(nrm[k], (s * t) / 2));
      const tri = (a, b, c, facing) => {
        const f = V().subVectors(pos[b], pos[a]).cross(V().subVectors(pos[c], pos[a]));
        index.push(...(f.dot(facing) >= 0 ? [a, b, c] : [a, c, b]));
      };
      const quad = (a, b, c, d, facing) => {
        tri(a, b, c, facing);
        tri(a, c, d, facing);
      };
      for (let r = 0; r < R - 1; r++)
        for (let c = 0; c < (wrap ? C : C - 1); c++) {
          const k = [r * C + c, r * C + cl(c + 1), (r + 1) * C + cl(c + 1), (r + 1) * C + c];
          const n = nrm[k[0]].clone().add(nrm[k[2]]);
          quad(...k, n);
          quad(...k.map((x) => x + R * C), n.clone().negate());
        }
      // The cut edges, with their own vertices so the faces keep a crisp edge.
      const rim = (k0, k1, away) => {
        const i = pos.length;
        pos.push(pos[k0].clone(), pos[k1].clone(), pos[k1 + R * C].clone(), pos[k0 + R * C].clone());
        quad(i, i + 1, i + 2, i + 3, away);
      };
      for (let c = 0; c < (wrap ? C : C - 1); c++) {
        rim(c, cl(c + 1), V().subVectors(pts[0][c], pts[1][c]));
        rim((R - 1) * C + c, (R - 1) * C + cl(c + 1), V().subVectors(pts[R - 1][c], pts[R - 2][c]));
      }
      if (!wrap)
        for (let r = 0; r < R - 1; r++) {
          rim(r * C, (r + 1) * C, V().subVectors(pts[r][0], pts[r][1]));
          rim(r * C + C - 1, (r + 1) * C + C - 1, V().subVectors(pts[r][C - 1], pts[r][C - 2]));
        }
      const g = new THREE.BufferGeometry().setFromPoints(pos);
      g.setIndex(index);
      g.computeVertexNormals();
      return g;
    };
    const gridOf = (rows, cols, f) => Array.from({ length: rows + 1 }, (_, r) => Array.from({ length: cols + 1 }, (_, c) => f(r / rows, c / cols)));
    /** Put a small rigid piece at `o`, its +z along `n`, +y up the body. */
    const placed = (g, o, n, tilt = 0) => {
      const z = n.clone().normalize();
      const x = V(0, 1, 0).cross(z).normalize();
      const y = z.clone().cross(x);
      g.applyMatrix4(new THREE.Matrix4().makeRotationZ(tilt));
      return g.applyMatrix4(new THREE.Matrix4().makeBasis(x, y, z).setPosition(o));
    };

    // Skirt: folds that start at the waist and deepen toward the hem.
    // Its top row tucks in to the waist above, so no gap shows from above.
    const tuckY = yTop + 0.03 * S;
    const tuck = Array.from({ length: COLS }, (_, c) => {
      const th = (c / COLS) * Math.PI * 2;
      let m = 0;
      for (const i of legs) if (Math.abs(bp.getY(i) - tuckY) < 0.008 * H) m = Math.max(m, (bp.getX(i) - cx) * Math.sin(th) + (bp.getZ(i) - cz) * Math.cos(th));
      return Math.min(m + 0.002 * S, base[0][c] + ease(0));
    });
    const tuckAt = (c, extra) => V(cx + Math.sin((c / COLS) * Math.PI * 2) * (tuck[c] + extra), tuckY, cz + Math.cos((c / COLS) * Math.PI * 2) * (tuck[c] + extra));
    const skirtGrid = [
      Array.from({ length: COLS }, (_, c) => tuckAt(c, 0)),
      ...gridOf(ROWS, COLS, (v, u) => round(v, u * Math.PI * 2, folds(v, u * Math.PI * 2))).map((row) => row.slice(0, COLS)),
    ];
    finish(panel(skirtGrid, { wrap: true }), WAITRESS_DRESS, "skirt");

    // The half apron: front and sides, three quarters of the skirt's length,
    // clear of the deepest fold, with a few broad folds of its own.
    const AP_V = 0.74;
    const AP_TH = 1.72;
    const apronOff = (v, th) => foldAmp(v) + 0.007 * S + 0.006 * S * v * (0.5 + 0.5 * Math.sin(5 * th + 0.8));
    const apronAt = (v, th, extra = 0) => round(v, th, apronOff(v, th) + extra);
    finish(panel(gridOf(14, 40, (v, u) => apronAt(v * AP_V, lerp(-AP_TH, AP_TH, u)))), APRON_WHITE, "skirt");
    // Its waistband, running on round the back as the ties.
    const bandOff = 0.012 * S;
    finish(
      panel(
        gridOf(2, COLS, (v, u) => {
          // The top edge drawn in snug to the waist, the bottom over the apron.
          const c = Math.round(u * COLS) % COLS;
          const p = v === 0 ? tuckAt(c, 0.006 * S) : round(0, u * Math.PI * 2, bandOff);
          p.y = yTop + 0.02 * S - v * 0.045 * S;
          return p;
        }).map((row) => row.slice(0, COLS)),
        { wrap: true },
      ),
      APRON_WHITE,
      "skirt",
    );
    // The bow at the small of the back: a knot, two loops, two tails.
    const knotY = yTop - 0.008 * S;
    const back = V(0, 0, -1);
    const knotAt = round(0, Math.PI, bandOff + 0.012 * S).setY(knotY);
    finish(placed(new THREE.BoxGeometry(0.03 * S, 0.034 * S, 0.016 * S), knotAt, back), APRON_WHITE, "skirt");
    for (const s of [-1, 1]) {
      // Each loop a flattened ring, wider than tall, pinched toward the knot.
      const loop = new THREE.TorusGeometry(0.03 * S, 0.016 * S, 8, 24);
      loop.scale(1.55, 0.7, 0.45);
      const o = round(0, Math.PI - s * 0.2, bandOff + 0.014 * S).setY(knotY + 0.01 * S);
      finish(placed(loop, o, outward(o), s * 0.32), APRON_WHITE, "skirt");
      const tail = gridOf(8, 2, (v, u) => {
        const th = Math.PI - s * (0.05 + 0.1 * v) + (u - 0.5) * 0.11;
        const vv = 0.04 + v * 0.36;
        return round(vv, th, foldAmp(vv) + 0.012 * S + 0.004 * S * Math.sin(v * 3));
      });
      finish(panel(tail), APRON_WHITE, "skirt");
    }

    // The pocket on her right, baggy where the pad sits in it.
    const PK = { th0: -0.78, th1: -0.3, v0: 0.13, v1: 0.39 };
    const bag = (u, w) => 0.004 * S + 0.013 * S * Math.pow(Math.sin(Math.PI * u), 0.5) * Math.min(1, 0.25 + w * 1.6);
    finish(panel(gridOf(8, 10, (w, u) => apronAt(lerp(PK.v1, PK.v0, w), lerp(PK.th0, PK.th1, u), bag(u, 1 - w)))), "#efece3", "skirt");
    // A green guest-check pad and a pen standing up out of it.
    const pkTop = yRow(PK.v0);
    const padTh = lerp(PK.th0, PK.th1, 0.42);
    const padO = apronAt(vOf(pkTop - 0.012 * S), padTh, 0.009 * S).setY(pkTop - 0.012 * S);
    finish(placed(new THREE.BoxGeometry(0.075 * S, 0.1 * S, 0.008 * S), padO, outward(padO), 0.05), "#cfe0c2", "skirt");
    const penTh = lerp(PK.th0, PK.th1, 0.8);
    const penO = apronAt(vOf(pkTop - 0.01 * S), penTh, 0.009 * S).setY(pkTop - 0.01 * S);
    const pen = new THREE.CylinderGeometry(0.0045 * S, 0.0045 * S, 0.13 * S, 10);
    finish(placed(pen, penO, outward(penO), -0.12), "#1f2f52", "skirt");

    // Peter Pan collar: two rounded white flaps lying on the shoulders.
    let nz0 = Infinity;
    let nz1 = -Infinity;
    for (let i = 0; i < bp.count; i++) if (Math.abs(bp.getX(i) - cx) < 0.036 * S && Math.abs(bp.getY(i) - at(0.86)) < 0.009 * H) ((nz0 = Math.min(nz0, bp.getZ(i))), (nz1 = Math.max(nz1, bp.getZ(i))));
    const neckZ = (nz0 + nz1) / 2;
    const neckR = (nz1 - nz0) / 2;
    const yNeck = at(0.842);
    const TH0 = 0.09;
    for (const s of [-1, 1]) {
      const flap = gridOf(5, 22, (w, u) => {
        const th = lerp(TH0, Math.PI, u);
        const round01 = Math.sqrt(1 - Math.pow(1 - Math.min(1, Math.max(0.12, (th - TH0) / 0.55)), 2));
        const width = (0.056 * S - 0.018 * S * u) * round01;
        const d = (neckR + 0.004 * S + w * width);
        const p = V(cx + s * Math.sin(th) * d, yNeck - w * width * 0.75, neckZ + Math.cos(th) * d);
        return onBody(p, 0.004 * S + 0.0035 * S * w);
      });
      finish(panel(flap, { out: (p) => V(p.x - cx, 0.6, p.z - neckZ).normalize() }), WHITE_TRIM, "torso");
    }
    // Buttons down the front of the bodice, and the name tag on her left.
    const front = (x, y, off) => onBody(V(x, y, max.z), off);
    const frontN = (p) => {
      const n = V();
      for (const [i, wt] of near(p, 0.03 * S, true)) n.addScaledVector(V(bn.getX(i), bn.getY(i), bn.getZ(i)), wt);
      return n.normalize();
    };
    for (const f of [0.808, 0.765, 0.715, 0.665, 0.615]) {
      const p = front(cx, at(f), 0.004 * S);
      finish(placed(new THREE.CylinderGeometry(0.0075 * S, 0.0075 * S, 0.004 * S, 10).rotateX(Math.PI / 2), p, frontN(p)), WHITE_TRIM, "torso");
    }
    const tagP = front(cx + 0.082 * S, at(0.79), 0.004 * S);
    finish(placed(new THREE.BoxGeometry(0.062 * S, 0.02 * S, 0.004 * S), tagP, frontN(tagP)), "#f3efe2", "torso");
    finish(placed(new THREE.BoxGeometry(0.04 * S, 0.0045 * S, 0.002 * S), tagP.clone().addScaledVector(frontN(tagP), 0.003 * S), frontN(tagP)), "#24314a", "torso");

    // White cuffs on the short sleeves, flaring a little off the arm.
    for (const s of [-1, 1]) {
      const xs = cx + s * 0.22 * H;
      let y0 = Infinity;
      let y1 = -Infinity;
      let z0 = Infinity;
      let z1 = -Infinity;
      for (let i = 0; i < bp.count; i++)
        if (Math.abs(bp.getX(i) - xs) < 0.012 * H && bp.getY(i) > at(0.7)) {
          y0 = Math.min(y0, bp.getY(i));
          y1 = Math.max(y1, bp.getY(i));
          z0 = Math.min(z0, bp.getZ(i));
          z1 = Math.max(z1, bp.getZ(i));
        }
      const ac = V(xs, (y0 + y1) / 2, (z0 + z1) / 2);
      const ar = Math.max(y1 - y0, z1 - z0) / 2;
      const cuff = gridOf(3, 32, (w, u) => {
        const ph = u * Math.PI * 2;
        const rr = ar + 0.002 * S + 0.003 * S * w;
        return V(xs - s * 0.026 * S * (1 - w) + s * 0.004 * S * w, ac.y + Math.sin(ph) * rr, ac.z + Math.cos(ph) * rr);
      }).map((row) => row.slice(0, 32));
      finish(panel(cuff, { wrap: true, out: (p) => V(0, p.y - ac.y, p.z - ac.z).normalize() }), WHITE_TRIM, "limb");
    }

    // Hair pinned up, sixties style: the back of the head gathered smooth
    // from the nape and over the ears up into a bun on the crown, fuller toward
    // the top, with strands drawn as light and dark bands running up to it.
    // The painter leaves a band of the dress colour on the neck above the
    // collar; above the collar it is all skin.
    const bc = geo.attributes.color;
    const skinC = new THREE.Color("#f0cdb0");
    for (let i = 0; i < bp.count; i++) if (bp.getY(i) > yNeck + 0.004 * S && Math.abs(bp.getX(i) - cx) < 0.05 * H) bc.setXYZ(i, skinC.r, skinC.g, skinC.b);
    bc.needsUpdate = true;
    const HAIR = new THREE.Color("#7a4a2a");
    let hb = null;
    for (let i = 0; i < bp.count; i++) if (bp.getY(i) > at(0.885) && Math.abs(bp.getX(i) - cx) < 0.1 * H) (hb ??= new THREE.Box3()).expandByPoint(vert(i));
    const hc = hb.getCenter(V());
    const hr = hb.getSize(V()).multiplyScalar(0.5);
    const SPAN = 1.8;
    const yNape = at(0.872);
    const bunC = V();
    const bunN = V(0, 0.55, -1).normalize();
    const updo = gridOf(16, 96, (e, u) => {
      const th = Math.PI + lerp(-SPAN, SPAN, u);
      const side = Math.pow(Math.abs(th - Math.PI) / SPAN, 2);
      const y = lerp(yNape + side * (at(0.93) - yNape), hc.y + 0.97 * hr.y, Math.pow(e, 0.85));
      const k = Math.sqrt(Math.max(0.08, 1 - Math.pow(Math.max(0, y - hc.y) / hr.y, 2)));
      const p = V(hc.x + Math.sin(th) * hr.x * k, y, hc.z + Math.cos(th) * hr.z * k);
      // A lift at the crown, tucked tight at the nape and over the ears.
      return onBody(p, 0.008 * S + 0.016 * S * Math.pow(e, 1.3) * (1 - 0.5 * side), 0.03 * S);
    });
    const strands = (p) => {
      const a = Math.atan2(p.x - hc.x, p.z - hc.z);
      const band = 0.5 + 0.5 * Math.sin(a * 46 + 2.2 * Math.sin(p.y * 60 + a * 3));
      const nape = segment(p.y, yNape, yNape + 0.06 * S);
      const fine = 0.5 + 0.5 * Math.sin(a * 131 + 1.3);
      return HAIR.clone().multiplyScalar((0.5 + 0.75 * band * band + 0.2 * fine) * lerp(0.8, 1.05, nape));
    };
    finish(panel(updo, { t: 0.006 * S, out: (p) => V().subVectors(p, hc).normalize() }), strands, "torso");
    // The bun, on the back of the crown, its strands wound round it.
    bunC.copy(updo[11][48]).addScaledVector(bunN, 0.03 * S);
    const bun = new THREE.SphereGeometry(0.043 * S, 32, 20);
    bun.scale(1.2, 0.95, 0.7);
    const bx = V(1, 0, 0);
    const by = bunN.clone().cross(bx).negate();
    finish(placed(bun, bunC, bunN), (p) => {
      const d = V().subVectors(p, bunC);
      const a = Math.atan2(d.dot(by), d.dot(bx));
      const band = 0.5 + 0.5 * Math.sin(a * 3 + d.length() / (0.0032 * S));
      return HAIR.clone().multiplyScalar(0.5 + 0.8 * band * band);
    }, "torso");

    const merged = mergeGeometries(pieces);
    pieces.forEach((g) => g.dispose());
    const cloth = new THREE.SkinnedMesh(merged, body.material);
    cloth.frustumCulled = false;
    body.parent.add(cloth);
    cloth.position.copy(body.position);
    cloth.quaternion.copy(body.quaternion);
    cloth.scale.copy(body.scale);
    cloth.bind(body.skeleton, body.bindMatrix);
    const line = new THREE.SkinnedMesh(merged, w.line);
    line.bind(body.skeleton, body.bindMatrix);
    line.frustumCulled = false;
    line.raycast = () => {};
    cloth.add(line);
    return cloth;
  };

  // The order on the pass.
  const orderUp = new THREE.Group();
  {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.018, 24), M.china);
    outline(plate, w.line);
    const hash1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.08), M.toast);
    hash1.position.set(0.03, 0.02, 0);
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), M.yolk);
    yolk.scale.y = 0.55;
    yolk.position.set(-0.05, 0.015, 0.02);
    orderUp.add(plate, hash1, yolk);
    orderUp.position.set(-1.25, 1.18, BACK_Z + 0.05);
    orderUp.visible = false;
    scene.add(orderUp);
  }

  const ready = Promise.all(loads).then(([reacher, cook, waitress, patron, copA, copB]) => {
    if (disposed) return null;
    Object.assign(cast, { reacher, cook, waitress, patron, copA, copB });
    coverShoulders(reacher, OLIVE);
    coverShoulders(cook, "#f3f1ea");
    // Her collar covers the shoulders, so her neck stays skin.
    coverShoulders(patron, "#5f7f9e");
    coverShoulders(copA, NAVY);
    coverShoulders(copB, NAVY);
    [reacher, cook, waitress, patron, copA, copB].forEach((f) => {
      scene.add(f.root);
      w.register(f.root);
    });

    // Reacher: the mug wrapped in his left hand, the fork in his right.
    reacher.root.position.set(RX, 0, RZ);
    reacher.root.rotation.y = -Math.PI / 2;
    reacher.apply(REST);
    reacher.hold(cup, { hand: "left", grip: "grip", radius: 0.042, rotation: new THREE.Euler(-0.33, 0, 0) });
    reacher.hold(fork, { hand: "right", grip: "grip", radius: 0.008, rotation: new THREE.Euler(0, 0, -0.6) });

    // The cook's paper cap.
    cook.apply({});
    const crown = boneAt(cook, "head");
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.105, 0.13, 20), M.paper);
    outline(cap, w.line);
    bind(cook, "head", cap, crown.clone().add(new THREE.Vector3(0, 0.2, -0.01)));
    cook.root.position.set(-1.3, 0, BACK_Z + 0.56);
    cook.root.rotation.y = Math.PI;

    // The waitress: uniform and apron. The pie rides in her right hand.
    waitress.root.name = "waitress";
    tailorWaitress(waitress);

    // The man at the counter: a feed cap, coffee in front of him.
    patron.apply({});
    const top = boneAt(patron, "head");
    const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.118, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.vinyl);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 16), M.vinyl);
    brim.scale.set(1, 1, 0.75);
    brim.position.set(0, -0.005, 0.12);
    const feedCap = new THREE.Group();
    feedCap.add(capCrown, brim);
    outline(capCrown, w.line);
    bind(patron, "head", feedCap, top.clone().add(new THREE.Vector3(0, 0.1, 0.015)));
    cyl(0.04, 0.036, 0.09, M.china, -1.8, 1.115, 0.62, 16, scene, true);

    // The officers: peaked cap, a gold badge on the left breast, the pistol in
    // the right hand and the left wrapped round it.
    const capNavy = w.ink({ tint: NAVY, tone: 0.65, rim: 0.5 });
    const gold = w.ink({ tint: "#d0ac4c", tone: 1.0, rim: 0.4, spec: 1 });
    [copA, copB].forEach((cop, i) => {
      cop.apply({});
      cop.root.updateMatrixWorld(true);
      const head = boneAt(cop, "head");
      const peaked = new THREE.Group();
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.104, 0.06, 20), M.black);
      const crownTop = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.11, 0.05, 22), capNavy);
      crownTop.position.y = 0.05;
      const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 16, 1, false, -Math.PI / 2, Math.PI), M.black);
      peak.scale.set(1, 1, 0.7);
      peak.position.set(0, -0.028, 0.08);
      peak.rotation.x = 0.25;
      const capBadge = new THREE.Mesh(new THREE.CircleGeometry(0.018, 6), gold);
      capBadge.position.set(0, 0.01, 0.107);
      peaked.add(band, crownTop, peak, capBadge);
      [band, crownTop, peak].forEach((m) => outline(m, w.line));
      bind(cop, "head", peaked, head.clone().add(new THREE.Vector3(0, 0.15, 0.0)));
      const chest = boneAt(cop, "chest");
      const bx = 0.085;
      const by = chest.y + 0.06;
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.026, 5), gold);
      bind(cop, "chest", badge, new THREE.Vector3(bx, by, frontAt(cop, bx, by) + 0.006));
      cop.hold(guns[i], { hand: "right", grip: "grip", radius: 0.016, rotation: new THREE.Euler(-0.14, -0.34, 0) });
      cop.setHand("left", "grip", 1, { radius: 0.034 });
      cop.root.visible = false;
    });

    w.palette(DINER);
    // Warm and well under white: the palette key is tuned for night sets.
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.setRGB(0.8, 0.7, 0.56);
      m.uniforms.uShade.value.set("#7f8ea6");
    });
    w.light(...KEY);
    // The ceiling faces away from the key and sank to a dark night-sky grey,
    // the dust twinkling on it like stars. Light it with the sun bounced up off
    // the street-side floor instead: a warm, low cream.
    M.ceiling.uniforms.uLightWorld.value.set(0.4, -0.25, -0.88).normalize();
    // The west wall, likewise: away from the key, so it takes the bounce too.
    westCream.uniforms.uLightWorld.value.set(0.45, 0.3, -0.84).normalize();
    w.page({ mode: "still" });
    w.sync();
    stage.invalidate();
    return cast;
  });

  // ── Blocking ─────────────────────────────────────────────────────────────
  /**
   * A route through timed waypoints [t, x, z]: straight legs, the last one
   * easing to a stop. Returns where, how far along (for the stride) and the
   * heading.
   */
  const route = (pts) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const at = (c) => {
      const n = pts.length - 1;
      if (c <= pts[0][0]) return { x: pts[0][1], z: pts[0][2], s: 0, i: 0, u: 0 };
      if (c >= pts[n][0]) return { x: pts[n][1], z: pts[n][2], s: cum[n], i: n, u: 1 };
      let i = 0;
      while (c >= pts[i + 1][0]) i++;
      let u = (c - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      if (i === n - 1) u = 1 - (1 - u) ** 2;
      return { x: lerp(pts[i][1], pts[i + 1][1], u), z: lerp(pts[i][2], pts[i + 1][2], u), s: cum[i] + u * (cum[i + 1] - cum[i]), i, u };
    };
    const heading = (c) => {
      const a = at(c - 0.18);
      const b = at(c + 0.18);
      return Math.hypot(b.x - a.x, b.z - a.z) > 1e-4 ? Math.atan2(b.x - a.x, b.z - a.z) : null;
    };
    return { at, heading, start: pts[0][0], end: pts[pts.length - 1][0], lastLeg: pts[pts.length - 2][0] };
  };
  const lerpAngle = (a, b, t) => a + ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * t;

  // The waitress: from the pie case, round the end of the counter, to his table.
  const WAITRESS_WALK = route([
    [4.3, 1.05, 1.85],
    [5.2, 2.2, 1.75],
    [6.3, 2.2, 0.05],
    [7.4, 1.45, -1.65],
  ]);
  const WAITRESS_BACK = route([
    [12.0, 1.45, -1.65],
    [12.9, 2.25, -0.6],
  ]);
  const T_PIE_DOWN = 7.85;
  const PIE_SPOT = new THREE.Vector3(1.58, TABLE_TOP, -2.15);
  const PIE_QUAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  const T_FORK_DOWN = 15.6;
  // Out of the cars, along the sidewalk, through the door, up the aisle.
  const COP_ROUTES = [
    route([
      [11.2, -1.8, -5.2],
      [11.8, -4.1, -3.45],
      [12.0, -4.05, -2.45],
      [12.3, -3.25, -1.35],
      [13.2, 0.45, -1.3],
    ]),
    route([
      [11.45, -1.0, -5.5],
      [12.05, -4.15, -3.45],
      [12.25, -4.1, -2.45],
      [12.6, -3.35, -0.8],
      [13.45, -0.75, -1.45],
    ]),
  ];
  const SPEECH = "Best pie in Georgia. Our little slice of heaven.";

  // Her line, in a plain speech balloon over her head.
  const bubble = (() => {
    if (!overlay) return null;
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    Object.assign(box.style, {
      position: "absolute",
      left: "0",
      top: "0",
      maxWidth: "13em",
      padding: "0.5em 0.75em",
      background: "#fffdf7",
      color: "#1b1b1d",
      border: "2px solid #1b1b1d",
      borderRadius: "0.9em",
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      fontWeight: "600",
      lineHeight: "1.3",
      textAlign: "center",
      pointerEvents: "none",
      opacity: "0",
      willChange: "transform, opacity",
    });
    box.textContent = SPEECH;
    const tail = document.createElement("div");
    Object.assign(tail.style, {
      position: "absolute",
      bottom: "-0.42em",
      left: "calc(50% - 0.4em)",
      width: "0.8em",
      height: "0.8em",
      background: "#fffdf7",
      borderRight: "2px solid #1b1b1d",
      borderBottom: "2px solid #1b1b1d",
      transform: "rotate(45deg)",
    });
    box.appendChild(tail);
    overlay.appendChild(box);
    return box;
  })();
  const ndc = new THREE.Vector3();
  const placeBubble = (anchor, opacity) => {
    if (!bubble) return;
    ndc.copy(anchor).project(camera);
    if (opacity <= 0.001 || ndc.z > 1) {
      bubble.style.opacity = "0";
      return;
    }
    const W = overlay.clientWidth || 1;
    const H = overlay.clientHeight || 1;
    bubble.style.fontSize = `${Math.max(12, Math.min(24, H * 0.03))}px`;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const tailPx = Math.max(12, Math.min(24, H * 0.03)) * 0.6;
    const x = Math.min(W * 0.97 - bw / 2, Math.max(W * 0.03 + bw / 2, ((ndc.x + 1) / 2) * W));
    const y = Math.max(H * 0.03 + bh + tailPx, ((1 - ndc.y) / 2) * H);
    bubble.style.opacity = String(opacity);
    bubble.style.transform = `translate(${x - bw / 2}px, ${y - bh - tailPx}px)`;
  };

  // ── Camera, per shot ─────────────────────────────────────────────────────
  const T_DOOR = new THREE.Vector3(-4.1, 1.3, -2.85);
  const T_COOK = new THREE.Vector3(-1.3, 1.55, 3.2);
  const T_WIN = new THREE.Vector3(0.55, 1.0, -6.4);
  // Live targets, refreshed each frame once the cast is in.
  const waitressHead = new THREE.Vector3(1.05, 1.5, 1.85);
  const copHead = new THREE.Vector3(-1.8, 1.7, -5.2);
  const gazeTarget = (c, out) => {
    const pts = [T_DOOR, T_COOK, waitressHead, T_WIN, copHead];
    const moves = [
      [3.4, 4.0],
      [4.5, 5.1],
      [9.45, 9.95],
      [11.3, 11.8],
    ];
    out.copy(pts[0]);
    for (let i = 0; i < moves.length; i++) {
      if (c >= moves[i][0]) out.lerpVectors(pts[i], pts[i + 1], easeInOutCubic(segment(c, moves[i][0], moves[i][1])));
    }
    return out;
  };
  const g = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  /** Over his shoulder, riding his eyeline toward `target`. */
  const eyeline = (target) => {
    g.subVectors(target, EYE).normalize();
    const flat = Math.hypot(g.x, g.z) || 1;
    // Back and off to his left, high: his head is a sliver in a lower corner
    // and the thing he is looking at owns the frame. Walls clamp the move.
    camPos.copy(EYE).addScaledVector(g, -1.35);
    camPos.y = EYE.y + 0.22;
    camPos.x += (g.z / flat) * 0.42;
    camPos.z += (-g.x / flat) * 0.42;
    camPos.x = Math.min(camPos.x, END_X - 0.08);
    camPos.z = Math.max(camPos.z, WALL_Z + 0.1);
    camLook.copy(target);
  };
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = {
    booth: { from: v3(0.72, 1.62, -0.5), to: v3(0.95, 1.54, -0.78), lookFrom: v3(2.1, 1.05, -2.5), lookTo: v3(2.1, 1.1, -2.5) },
    // Down the aisle at his table: her, the pie, him.
    delivery: { from: v3(0.05, 1.62, -1.15), to: v3(0.25, 1.58, -1.25), lookFrom: v3(1.75, 1.08, -2.0), lookTo: v3(1.8, 1.08, -2.05) },
    // From behind the counter: the guns, the booth, the cruisers outside.
    standoff: { from: v3(-0.85, 1.66, 2.2), to: v3(-0.65, 1.62, 1.95), lookFrom: v3(0.35, 1.1, -1.6), lookTo: v3(0.45, 1.1, -1.65) },
    // Over the first officer's right shoulder, down the barrel at him.
    hero: { from: v3(0.0, 1.76, -0.62), to: v3(0.12, 1.72, -0.78), lookFrom: v3(2.2, 1.06, -2.4), lookTo: v3(2.2, 1.1, -2.42) },
  };
  const fixed = (shot, k) => {
    camPos.lerpVectors(shot.from, shot.to, k);
    camLook.lerpVectors(shot.lookFrom, shot.lookTo, k);
  };
  const BASE_FOV = camera.fov;
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames widen the lens rather than back through a wall.
    camera.fov = BASE_FOV * Math.max(1, (1.6 / aspect) ** 0.55);
    camera.updateProjectionMatrix();
    dust.resize(stage.size.height, camera.fov, renderer.getPixelRatio());
    grit.resize(stage.size.height, camera.fov, renderer.getPixelRatio());
    w.sync();
  });

  // ── The frame ────────────────────────────────────────────────────────────
  const gazeNow = new THREE.Vector3();
  const flash = new THREE.Color();
  const rimBase = new THREE.Color(DINER.rim);
  const rimOut = new THREE.Color("#fff2d6");
  const rimTmp = new THREE.Color();
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  let prevC = -1;
  // What is in whose hand.
  let pieHeld = false;
  let pieDrop = null;
  let forkHeld = true;
  let forkDrop = null;

  /** Set a released prop down: ease from where the hand let go to its rest. */
  const settle = (obj, drop, pos, quat, c, len) => {
    const k = drop && !staticMode ? easeInOutCubic(Math.min(1, Math.max(0, (c - drop.t) / len))) : 1;
    obj.position.copy(drop ? drop.pos : pos).lerp(pos, k);
    obj.quaternion.copy(drop ? drop.quat : quat).slerp(quat, k);
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const wrapped = c < prevC;
    prevC = c;

    // Dip to black across the loop point.
    const fade = staticMode ? 1 : Math.min(segment(c, 0, 0.6), 1 - segment(c, CYCLE - 0.6, CYCLE));
    renderer.toneMappingExposure = baseExposure * 0.88 * (0.02 + 0.98 * fade);

    // Cruisers: in hard, brake, the nose dips and settles.
    let wash = 0;
    cars.forEach((car) => {
      const u = segment(c, car.t0, car.t1);
      const k = 1 - (1 - u) ** 2.4;
      const x = lerp(car.from, car.to, k);
      car.car.position.set(x, 0, car.z);
      const turnIn = car.yaw * easeInOutCubic(segment(u, 0.55, 1));
      car.car.rotation.y = (car.dir > 0 ? 0 : Math.PI) + turnIn;
      car.car.position.z = car.z + Math.sin(turnIn) * -0.6 * car.dir;
      const since = c - car.t1;
      const dip = since >= 0 ? Math.exp(-5.5 * since) * Math.cos(since * 10) : u > 0.55 ? segment(u, 0.55, 1) ** 2 : 0;
      car.body.rotation.z = -0.045 * dip;
      car.body.position.y = 0.45 - 0.02 * dip;
      const roll = -Math.abs(x - car.from) / 0.34;
      car.wheels.forEach((wh) => (wh.rotation.z = roll));
      car.car.visible = u > 0;
      if (!wrapped && c >= car.t1 && c - dt < car.t1) {
        // Grit off the tyres as they bite.
        for (let i = 0; i < 16; i++) {
          const s = i % 2 ? 1 : -1;
          grit.emit({
            position: [car.to + (i % 4 < 2 ? 1.5 : -1.5) * car.dir, 0.15, car.z + s * 0.9],
            velocity: [(hash(i + c) - 0.3) * car.dir * 1.2, 0.25 + hash(i * 2.2) * 0.3, s * hash(i * 3.3) * 0.5],
            life: 1.6,
            size: 0.5 + hash(i) * 0.4,
            grow: 2.2,
            drag: 1.5,
            color: "#d8c7a6",
            alpha: 0.32,
          });
        }
      }
      const on = u > 0 && fade > 0;
      const [r, b] = staticMode ? [1, 0.75] : strobe(time, car.phase);
      car.lamps.forEach((lamp, i) => {
        const v = on ? (i === 0 ? r : b) : 0;
        lamp.mat.color.copy(lamp.color).multiplyScalar(0.35 + v * 4.2);
        lamp.glow.material.opacity = v * 0.9;
        lamp.pool.material.opacity = v * 0.4;
      });
      if (on) wash = Math.max(wash, segment(c, car.t0 + 0.3, car.t1));
    });
    // Both bars together for the room: whichever colour is up colours the rims.
    let fr = 0;
    let fb = 0;
    if (wash > 0) {
      cars.forEach((car) => {
        const [r, b] = staticMode ? [1, 0.75] : strobe(time, car.phase);
        fr = Math.max(fr, r);
        fb = Math.max(fb, b);
      });
      fr *= wash;
      fb *= wash;
    }
    flash.setRGB(RED.r * fr + BLUE.r * fb, RED.g * fr + BLUE.g * fb, RED.b * fr + BLUE.b * fb);
    const amt = Math.min(1, fr + fb);
    if (amt > 0) rimTmp.copy(flash).multiplyScalar(1 / (fr + fb));
    w.inks.forEach((m) => m.uniforms.uRimColor.value.copy(rimBase).lerp(rimTmp, amt * 0.75));
    outs.forEach((m) => m.uniforms.uRimColor.value.copy(rimOut).lerp(rimTmp, amt * 0.5));
    spills.forEach((s, i) => {
      s.material.color.copy(flash);
      s.material.opacity = i === spills.length - 1 ? 0.18 : 0.26;
    });

    // The door bangs open as the first officer hits it; the closer brings it back.
    const open = easeInOutCubic(segment(c, 11.76, 11.92)) * (1 - easeInOutCubic(segment(c, 13.0, 14.6)));
    doorLeaf.rotation.y = -1.45 * open;
    const rung = c - 11.8;
    doorBell.rotation.z = rung > 0 && !staticMode ? Math.sin(rung * 22) * 0.4 * Math.exp(-rung * 2.2) : 0;

    // The room.
    if (!staticMode) fans.forEach((blades, i) => (blades.rotation.y = time * (1.6 + i * 0.15)));
    moteDebt += dt * (170 / 9);
    while (moteDebt >= 1) {
      moteDebt -= 1;
      mote();
    }
    dust.step(dt);
    grit.step(dt);

    const { reacher, cook, waitress, patron, copA, copB } = cast;
    if (reacher) {
      // The officers: a run with the gun up, then planted, aimed at him.
      [copA, copB].forEach((cop, i) => {
        const r = COP_ROUTES[i];
        cop.root.visible = c >= r.start;
        const p = r.at(c);
        const moving = c > r.start && c < r.end ? 1 - segment(c, r.end - 0.25, r.end) : 0;
        const planted = easeInOutCubic(segment(c, r.end - 0.3, r.end + 0.1));
        const legs = blendPose(walkPose((p.s / 1.7) * Math.PI * 2, moving, 1), STANCE, planted);
        const aimYaw = Math.atan2(CHEST.x - p.x, CHEST.z - p.z);
        const dist = Math.hypot(CHEST.x - p.x, CHEST.z - p.z);
        const pitch = Math.atan2(1.48 - CHEST.y, Math.max(0.5, dist - 0.45));
        // Muzzle low while they run outside; up on him once through the door.
        const up = easeInOutCubic(segment(c, r.lastLeg - 0.2, r.lastLeg + 0.3));
        Object.assign(legs, aimArms(lerp(0.55, pitch, up)));
        legs.spine[0] += 0.12 * moving;
        legs.head[0] -= 0.1 * moving;
        cop.apply(legs);
        const head = r.heading(c);
        const runYaw = head ?? aimYaw;
        const face = easeInOutCubic(segment(c, r.lastLeg, r.lastLeg + 0.45));
        cop.root.rotation.y = lerpAngle(runYaw, aimYaw, face);
        cop.root.position.set(p.x, 0, p.z);
        cop.groundTo(0);
      });
      copA.bones.head.getWorldPosition(copHead).y += 0.08;

      // The waitress: round the counter with the pie, sets it down, says her
      // line; backs away, hands up, when the guns come in.
      const walk = WAITRESS_WALK.at(c);
      const back = WAITRESS_BACK.at(c);
      const retreating = c >= WAITRESS_BACK.start;
      const pos = retreating ? back : walk;
      const strolling = c > WAITRESS_WALK.start && c < WAITRESS_WALK.end ? Math.min(segment(c, 4.3, 4.6), 1 - segment(c, 7.1, 7.4)) : 0;
      const stepping = retreating && c < WAITRESS_BACK.end ? 1 - segment(c, 12.6, 12.9) : 0;
      let wPose = walkPose(((retreating ? -back.s : walk.s) / 1.2) * Math.PI * 2, Math.max(strolling, stepping * 0.6));
      const bend = envelope(c, 7.35, 7.75, 7.95, 8.4);
      wPose = blendPose(wPose, SET_DOWN, bend);
      const standing = segment(c, 7.9, 8.4);
      if (standing > 0 && !retreating) wPose = blendPose(wPose, { ...STAND, head: [0.05, 0, 0] }, standing * (1 - bend));
      const shrink = easeInOutCubic(segment(c, 11.95, 12.5));
      if (shrink > 0) wPose = blendPose(wPose, { ...STAND, ...SHRINK, lHip: wPose.lHip, rHip: wPose.rHip, lKnee: wPose.lKnee, rKnee: wPose.rKnee }, shrink);
      // A glance out at the cruisers.
      const peek = easeInOutCubic(segment(c, 10.5, 11.1)) * (1 - shrink);
      wPose.neck = [0, -0.35 * peek, 0];
      wPose.head = [(wPose.head?.[0] ?? 0) - 0.05 * peek, -0.35 * peek, 0];
      waitress.apply(wPose);
      let wYaw = WAITRESS_WALK.heading(c) ?? -Math.PI / 2;
      if (c >= WAITRESS_WALK.end - 0.5) wYaw = lerpAngle(WAITRESS_WALK.heading(WAITRESS_WALK.end - 0.5) ?? Math.PI, Math.PI, easeInOutCubic(segment(c, WAITRESS_WALK.end - 0.5, WAITRESS_WALK.end)));
      // Before she sets off she faces the pie case across the counter.
      if (c < WAITRESS_WALK.start + 0.45) wYaw = lerpAngle(Math.PI, WAITRESS_WALK.heading(WAITRESS_WALK.start + 0.45), easeInOutCubic(segment(c, WAITRESS_WALK.start, WAITRESS_WALK.start + 0.45)));
      // Backing off, she keeps her eyes on the guns.
      if (retreating) wYaw = lerpAngle(Math.PI, -1.9, easeInOutCubic(segment(c, 12.0, 12.4)));
      waitress.root.rotation.y = wYaw;
      waitress.root.position.set(pos.x, 0, pos.z);
      waitress.groundTo(0);
      waitress.bones.head.getWorldPosition(waitressHead).y += 0.06;

      // The pie: in her hand, level, until she lets go over the table.
      const wantPie = c < T_PIE_DOWN && !staticMode;
      if (wantPie && !pieHeld) {
        waitress.hold(piePlate, { hand: "right", grip: "pinch" });
        pieHeld = true;
        pieDrop = null;
      } else if (!wantPie && pieHeld) {
        waitress.release("right", { to: scene });
        pieHeld = false;
        pieDrop = { pos: piePlate.position.clone(), quat: piePlate.quaternion.clone(), t: c };
      }
      if (pieHeld) {
        // Pinched by the rim, thumb on top: the plate hangs level off her fingers.
        const holder = waitress.socket("right");
        holder.updateWorldMatrix(true, false);
        holder.getWorldPosition(va);
        holder.getWorldQuaternion(qa);
        vb.set(0, 0, 1).applyQuaternion(qa).setY(0);
        if (vb.lengthSq() < 1e-6) vb.set(Math.sin(wYaw), 0, Math.cos(wYaw));
        vb.normalize();
        va.addScaledVector(vb, 0.088);
        va.y -= 0.007;
        piePlate.position.copy(holder.worldToLocal(va));
        piePlate.quaternion.copy(qa.invert().multiply(PIE_QUAT));
      } else {
        if (piePlate.parent !== scene) scene.add(piePlate);
        settle(piePlate, pieDrop, PIE_SPOT, PIE_QUAT, c, 0.18);
      }

      // Reacher: eats, reads the room, looks up at her, then at the window;
      // under the guns he takes another bite, sets the fork down, looks up.
      const sip = envelope(c, 0.3, 0.85, 1.5, 2.1);
      const bite = envelope(c, 13.3, 13.75, 13.95, 14.4);
      const down = easeInOutCubic(segment(c, 15.05, 15.55)) * (1 - easeInOutCubic(segment(c, CYCLE - 0.5, CYCLE)));
      const pose = blendPose(blendPose(blendPose(REST, SIP, sip), BITE, bite), DOWN, down);
      const look = segment(c, 1.9, 2.4) * (1 - easeInOutCubic(segment(c, 12.5, 13.1))) + easeInOutCubic(segment(c, 15.9, 16.5)) * (1 - segment(c, CYCLE - 0.4, CYCLE));
      let yaw = 0;
      let pitchH = 0.08;
      if (look > 0) {
        gazeTarget(Math.max(2.2, c), gazeNow);
        g.subVectors(gazeNow, EYE);
        yaw = Math.max(-1.25, Math.min(1.25, Math.atan2(g.z, -g.x))) * look;
        pitchH = lerp(0.08, Math.atan2(-g.y, Math.hypot(g.x, g.z)), look);
      }
      pose.spine[1] += yaw * 0.12;
      pose.chest[1] += yaw * 0.2;
      pose.neck[1] += yaw * 0.3;
      pose.head[1] += yaw * 0.38;
      pose.head[0] += pitchH * 0.7 - 0.05;
      pose.neck[0] += pitchH * 0.3;
      pose.spine[0] += Math.sin(time * 1.3) * 0.008;
      reacher.apply(pose);
      reacher.root.position.set(RX, 0, RZ);
      reacher.seatOn(SEAT_TOP);

      const wantFork = c < T_FORK_DOWN || staticMode;
      if (wantFork && !forkHeld) {
        reacher.hold(fork, { hand: "right", grip: "grip", radius: 0.008, rotation: new THREE.Euler(0, 0, -0.6) });
        forkHeld = true;
        forkDrop = null;
      } else if (!wantFork && forkHeld) {
        reacher.release("right", { to: scene });
        forkHeld = false;
        forkDrop = { pos: fork.position.clone(), quat: fork.quaternion.clone(), t: c };
      }
      if (!forkHeld) settle(fork, forkDrop, FORK_REST.pos, FORK_REST.quat, c, 0.25);

      // The cook works the flat-top, plates an order, looks up at the sirens.
      const plating = envelope(c, 3.9, 4.3, 4.55, 4.95);
      const cookPose = blendPose(COOK, REACH, plating);
      cookPose.rShoulder[0] += Math.sin(time * 5) * 0.12 * (1 - plating);
      const startle = easeInOutCubic(segment(c, 10.7, 11.1));
      cookPose.head[0] = lerp(cookPose.head[0], -0.12, startle);
      cookPose.neck[0] = lerp(cookPose.neck[0], 0, startle);
      cookPose.head[1] += -0.22 * startle;
      cookPose.spine[0] = lerp(cookPose.spine[0], 0.04, startle);
      cook.apply(cookPose);
      orderUp.visible = c >= 4.45;

      // The man at the counter swivels round on his stool.
      const swivel = easeInOutCubic(segment(c, 10.6, 11.4));
      const pPose = blendPose(STOOL_SIT, { ...STOOL_SIT, head: [-0.05, 0.45, 0], neck: [0, 0.3, 0], chest: [0, 0.15, 0], spine: [0.06, 0.1, 0], lShoulder: [-0.35, 0, 0.1], lElbow: [-0.9, 0, 0], rShoulder: [-0.4, 0, -0.1], rElbow: [-0.9, 0, 0] }, swivel);
      pPose.spine[0] += Math.sin(time * 1.1 + 2) * 0.01;
      patron.apply(pPose);
      patron.root.rotation.y = 1.55 * swivel;
      patron.root.position.set(-1.8, 0, STOOL_Z);
      seat(patron, new THREE.Vector3(-1.8, STOOL_TOP, STOOL_Z), 0.1);
    }

    // Camera.
    if (c < 2.2) fixed(SHOTS.booth, easeInOutCubic(segment(c, 0, 2.2)));
    else if (c < 6.6) eyeline(gazeTarget(c, gazeNow));
    else if (c < 10.0) fixed(SHOTS.delivery, easeInOutCubic(segment(c, 6.6, 10.0)));
    else if (c < 12.9) eyeline(gazeTarget(c, gazeNow));
    else if (c < 15.0) fixed(SHOTS.standoff, easeInOutCubic(segment(c, 12.9, 15.0)));
    else fixed(SHOTS.hero, easeInOutCubic(segment(c, 15.0, CYCLE)));
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.03;
    camera.position.y += pointer.y * 0.02;
    camera.lookAt(camLook);
    camera.updateMatrixWorld();

    // Her line, while she stands at the table.
    const say = staticMode || !cast.waitress ? 0 : envelope(c, 7.95, 8.2, 9.7, 9.95);
    placeBubble(tmp.copy(waitressHead).add(va.set(0, 0.24, 0)), say);
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      bubble?.remove();
      renderer.toneMappingExposure = baseExposure;
      if (bloom) Object.assign(bloom, baseBloom);
    },
  };
};
