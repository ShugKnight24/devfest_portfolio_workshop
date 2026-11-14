import * as THREE from "three";
import { createInkWorld } from "../rezeKit";
import { canvasTexture, easeInCubic, easeInOutCubic, easeOutCubic, hash, hdr, lerp, segment, softDot } from "../kit";
import { outline } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createCaption } from "../sfx";

/**
 * More, and more garbage — the slop truck. Behind "You can build ten times
 * more. Including ten times more garbage."
 *
 * A city street at dawn. Two wheelie bins on the kerb overflow with AI slop:
 * crumpled printouts of code, the same to-do app icon five times over,
 * half-rendered boxes in missing-texture pink, sticky notes reading TODO and
 * v2_final_FINAL. A green side-loader comes for them.
 *
 *   0    – 4.0   the truck rolls in and stops at the first bin
 *   4.0  – 8.9   its arm reaches out, grips the bin and draws it in to the
 *                rail, lifts it straight up past the roof, reaches in and tips
 *                it into the hopper well; the lid falls open, the slop pours
 *                in; then down the same way, back on the kerb, lid shut
 *   8.9  – 13.9  it creeps on to the second bin and does it again
 *   13.9 – 15.5  it drives off; dip
 *   15.5 – 22.5  the transfer station: it backs up to the heap, the tailgate
 *                swings up, the body tips, and the load slides out on top
 *   22.5 – 27.0  an engineer in a hoodie, bag on his hip, walks up and climbs
 *                onto the heap
 *   27.0 – 31.4  he crouches and digs, tossing junk aside
 *   31.4 – 37.0  something glows under it. He pulls it out, stands, and holds
 *                it up: a gem, warm in the morning light.
 *                "One man's trash is another man's treasure."
 *
 * A dip to black resets the loop. Reduced motion holds the find with the
 * caption up. Original staging; the body is Quaternius's CC0 rig.
 */

const CYCLE = 37;
const STATIC_TIME = 34.5;
const DUMP_X = 60;

// Dawn: a cool street, a warm low sun coming in from the left.
const DAWN = { ground: "#262332", lines: "#ffd8b6", accent: "#ff9b6a", rim: "#ffc89a", shade: "#7d78a6" };
const SUN = [-0.72, 0.42, 0.55];

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rand = (i, k = 0) => hash(i * 12.9898 + k * 78.233);

/* ── The truck's moves, as pure functions of the loop time ──────────────── */

// Truck-local: it faces +x; the kerb (and the camera) is on its right, +z.
const ARM_X = 1.55; // the lift rail on the body's kerb side
const RAIL_Z = 1.22;
const GRAB_HOME = { y: 0.78, z: 1.27 };
const FLIP = -2.45; // the bin over the hopper, upside down
const LIFT_Y = 3.95; // the grip at the top of the rail: the bin clears the roof
const Z_OVER = 1.02; // and the boom draws it in over the hopper to tip
const HOPPER = { x0: 1.0, x1: 1.98, floor: 2.35, wall: 0.08 }; // a well in the body, open at the top
// The lid, on its hinge at the truck side of the rim: leaning back at the kerb,
// upright while it rides the lift, hanging open into the hopper when tipped.
const LID_REST = -1.9;
const LID_UP = -1.5;
const LID_HANG = -2.26;
const BIN_Z = 2.67; // bin origin on the pavement
const KERB_Y = 0.15;
const BIN_H = 1.02;
const BIN_GRIP = { y: 0.6, z: -0.36 }; // where the claws close, bin-local
const BINS = [-1.4, 0.05];
const STOP = BINS.map((x) => x - ARM_X);
const BED_PIVOT = { x: -2.7, y: 0.72 };
const Z_PULL = 1.32; // the bin drawn in against the body for the lift

/**
 * One pick, `t0` the moment the arm starts out. The order keeps the bin clear
 * of the truck: draw it in to the rail, lift it straight up past the roof,
 * and only then reach in over the hopper and tip it. Down the same way.
 */
const pick = (c, t0, s = 1) => {
  const at = (a, b) => segment(c, t0 + a * s, t0 + b * s);
  const out = easeInOutCubic(at(0, 0.55)) - easeInOutCubic(at(4.0, 4.4));
  const pull = easeInOutCubic(at(0.75, 1.1)) - easeInOutCubic(at(3.55, 3.85));
  const lift = easeInOutCubic(at(1.1, 1.95)) - easeInOutCubic(at(3.1, 3.55));
  const flip = easeInOutCubic(at(1.9, 2.5)) - easeInOutCubic(at(2.75, 3.15));
  const over = easeInOutCubic(at(1.9, 2.4)) - easeInOutCubic(at(2.8, 3.1));
  const shake = Math.sin((c - t0) * 38) * 0.06 * (at(2.45, 2.55) - at(2.65, 2.75));
  const held = c > t0 + 0.6 * s && c < t0 + 3.9 * s;
  const reach = BIN_Z + BIN_GRIP.z; // the grabber where it meets the bin
  const z = held ? lerp(lerp(reach, Z_PULL, pull), Z_OVER, over) : lerp(GRAB_HOME.z, reach, out);
  // The lid: eased upright before the pull, hanging as it tips, shut once it's back.
  const lid = held
    ? lerp(LID_UP, LID_HANG, flip)
    : c < t0 + 2 * s
      ? lerp(LID_REST, LID_UP, easeInOutCubic(at(0.2, 0.6)))
      : lerp(LID_UP, -0.06, easeInOutCubic(at(3.9, 4.3)));
  return {
    held,
    claw: at(0.5, 0.65) - at(3.85, 4.0),
    y: lerp(GRAB_HOME.y, LIFT_Y, lift),
    z,
    theta: FLIP * flip + shake,
    lid,
    pour: at(2.3, 2.95),
    emptied: c > t0 + 2.35 * s,
  };
};

const PICKS = [
  { t0: 4.0, s: 1.15 },
  { t0: 10.0, s: 0.95 },
];

const truckX = (c) => {
  if (c < 15.5) {
    if (c < 4.0) return lerp(-17, STOP[0], 1 - (1 - segment(c, 0, 4.0)) ** 2.2);
    if (c < 9.1) return STOP[0];
    if (c < 13.95) return lerp(STOP[0], STOP[1], easeInOutCubic(segment(c, 9.1, 10.0)));
    return lerp(STOP[1], STOP[1] + 16, easeInCubic(segment(c, 13.95, 15.5)));
  }
  // At the transfer station: backing up to the heap, then away.
  if (c < 21.8) return DUMP_X + lerp(17, 6.25, easeOutCubic(segment(c, 15.5, 18.3)));
  return DUMP_X + lerp(6.25, 15, easeInCubic(segment(c, 21.8, 23.2)));
};
const tailgate = (c) => easeOutCubic(segment(c, 18.3, 18.95)) * (1 - easeInOutCubic(segment(c, 21.0, 21.6)));
const tip = (c) => easeInOutCubic(segment(c, 18.6, 20.0)) * (1 - easeInOutCubic(segment(c, 20.9, 21.8)));
const TIP = 0.78;

/** Grabber and bin in world space for a pick state, at truck x `tx`. */
const rotX = (y, z, th) => [y * Math.cos(th) - z * Math.sin(th), y * Math.sin(th) + z * Math.cos(th)];
const binMouth = (st, tx, out) => {
  const [oy, oz] = rotX(-BIN_GRIP.y, -BIN_GRIP.z, st.theta);
  const [my, mz] = rotX(BIN_H, 0, st.theta);
  return out.set(tx + ARM_X, st.y + oy + my, st.z + oz + mz);
};

/* ── The heap ──────────────────────────────────────────────────────────── */

const HEAP_R = 3.3;
const HEAP_H = 1.45;
const heapAt = (x, z) => {
  const dx = x - DUMP_X;
  const r = Math.hypot(dx, z) / HEAP_R;
  if (r >= 1) return 0;
  const lump = 0.07 * Math.sin(dx * 3.1 + z * 1.7) + 0.05 * Math.sin(dx * 5.3 - z * 4.1);
  return HEAP_H * (1 - r * r) ** 0.85 + lump * (1 - r);
};
// Where he digs: on the near flank, toward the camera.
const DIG_ANG = 0.95;
const DIG_R = 2.25;
const DIG = v3(DUMP_X + DIG_R * Math.cos(DIG_ANG), 0, DIG_R * Math.sin(DIG_ANG));
DIG.y = heapAt(DIG.x, DIG.z);
// Toward the middle of the heap from where he digs, and across it.
const INWARD = v3(-Math.cos(DIG_ANG), 0, -Math.sin(DIG_ANG));
const SIDE = v3(-Math.sin(DIG_ANG), 0, Math.cos(DIG_ANG)); // the sunlit side
const GEM_AT = v3(DUMP_X + 1.62 * Math.cos(DIG_ANG - 0.05), 0, 1.62 * Math.sin(DIG_ANG - 0.05));
GEM_AT.y = heapAt(GEM_AT.x, GEM_AT.z) - 0.03;
const FIND = 31.4;

/* ── Textures: the slop ───────────────────────────────────────────────── */

const codePage = (seed) =>
  canvasTexture(256, 320, (ctx, W, H) => {
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 0, W, H);
    const cols = ["#6b5bd6", "#2f8f6a", "#c8572f", "#2b6fb3", "#7a7a7a"];
    let y = 22;
    for (let i = 0; y < H - 12; i++) {
      const indent = (Math.floor(rand(seed, i) * 4) % 3) * 18;
      let x = 16 + indent;
      const words = 2 + Math.floor(rand(seed + 1, i) * 4);
      for (let k = 0; k < words; k++) {
        const len = 14 + rand(seed + 2, i * 7 + k) * 46;
        ctx.fillStyle = cols[Math.floor(rand(seed + 3, i * 5 + k) * cols.length)];
        ctx.fillRect(x, y, len, 7);
        x += len + 7;
      }
      y += 16;
    }
    // Somebody's red pen.
    ctx.strokeStyle = "#d0261d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 20; x < W - 30; x += 10) ctx.lineTo(x, 120 + Math.sin(x * 0.4) * 4);
    ctx.stroke();
  });

const ICONS = [
  { bg: ["#7b5cff", "#c86dff"], glyph: "✦", label: "TODO APP" },
  { bg: ["#ff7a59", "#ffb347"], glyph: "✓", label: "TODO APP" },
  { bg: ["#1fb6ff", "#4ae0c0"], glyph: "✦", label: "AI NOTES" },
  { bg: ["#20232a", "#4b5563"], glyph: "◎", label: "WRAPPER" },
];
const iconTex = (k) =>
  canvasTexture(128, 128, (ctx, W, H) => {
    const ic = ICONS[k];
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, ic.bg[0]);
    g.addColorStop(1, ic.bg[1]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, 26);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ic.glyph, W / 2, H / 2 - 6);
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(ic.label, W / 2, H - 26);
  });

// The texture nothing loaded: magenta and black, and a band of scan glitch.
const missingTex = () =>
  canvasTexture(64, 64, (ctx, W, H) => {
    const n = 4;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#141414" : "#ff2bd6";
      ctx.fillRect((i * W) / n, (j * H) / n, W / n, H / n);
    }
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(0, 27, W, 4);
    ctx.fillStyle = "#c6ff00";
    ctx.fillRect(10, 36, W - 20, 2);
  });

const NOTES = [
  { bg: "#ffe45c", text: "TODO" },
  { bg: "#ff9ec7", text: "v2_final\nFINAL" },
  { bg: "#9fe7ff", text: "// fix\nlater" },
  { bg: "#ffe45c", text: "lorem\nipsum" },
  { bg: "#c8f59a", text: "untitled\n-47" },
];
const noteTex = (k) =>
  canvasTexture(128, 128, (ctx, W, H) => {
    const n = NOTES[k];
    ctx.fillStyle = n.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, W, 16);
    ctx.fillStyle = "#1b1414";
    ctx.font = "bold 28px 'Marker Felt', 'Comic Sans MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = n.text.split("\n");
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 32 + 6));
  });

const sideSign = () =>
  canvasTexture(1024, 160, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f2efe6";
    ctx.font = "900 54px 'Space Grotesk', 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MUNICIPAL SLOP COLLECTION", W / 2, H / 2 - 14);
    ctx.font = "700 30px 'Space Grotesk', sans-serif";
    ctx.fillText("WE TAKE ALL OF IT  ·  NO QUESTIONS ASKED", W / 2, H / 2 + 42);
  });

const stationSign = () =>
  canvasTexture(512, 192, (ctx, W, H) => {
    ctx.fillStyle = "#1f5a3d";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#f2efe6";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = "#f2efe6";
    ctx.font = "900 46px 'Space Grotesk', 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TRANSFER STATION", W / 2, 72);
    ctx.font = "700 30px 'Space Grotesk', sans-serif";
    ctx.fillText("ALL SLOP — CELL 4", W / 2, 132);
  });

/* ── Poses (faces +z, left is +x) ──────────────────────────────────────── */

const STAND = { spine: [0.02, 0, 0], lShoulder: [0.05, 0, 0.1], rShoulder: [0.05, 0, -0.1], lElbow: [-0.25, 0, 0], rElbow: [-0.25, 0, 0] };
const walk = (p, lean = 0) => {
  const s = Math.sin(p);
  return {
    spine: [0.06 + lean, 0, 0],
    head: [-lean * 0.6, 0, 0],
    lShoulder: [0.32 * s, 0, 0.1],
    rShoulder: [-0.12 * s, 0, -0.14], // the bag strap keeps this arm close
    lElbow: [-0.35, 0, 0],
    rElbow: [-0.5, 0, 0],
    lHip: [-0.45 * s - lean, 0, 0],
    rHip: [0.45 * s - lean, 0, 0],
    lKnee: [Math.max(0, s) * 0.65 + 0.12 + lean, 0, 0],
    rKnee: [Math.max(0, -s) * 0.65 + 0.12 + lean, 0, 0],
  };
};
/** Crouched on the slope, both hands in the pile; `k` sweeps one arm out. */
const dig = (k, side) => {
  const l = side > 0 ? k : 0;
  const r = side < 0 ? k : 0;
  return {
    spine: [0.5, 0, 0],
    chest: [0.2, 0, 0],
    head: [-0.25, 0, 0],
    lHip: [-1.35, 0, 0.18],
    rHip: [-0.95, 0, -0.15],
    lKnee: [1.85, 0, 0],
    rKnee: [1.25, 0, 0],
    lShoulder: [-1.05 - 0.9 * l, 0.25 * l, 0.25 + 0.5 * l],
    lElbow: [-0.45 + 0.3 * l, 0, 0],
    rShoulder: [-1.05 - 0.9 * r, -0.25 * r, -0.25 - 0.5 * r],
    rElbow: [-0.45 + 0.3 * r, 0, 0],
  };
};
const LOOK = {
  spine: [0.42, 0, 0],
  chest: [0.22, 0, 0],
  head: [0.1, 0, 0],
  lHip: [-1.35, 0, 0.18],
  rHip: [-0.95, 0, -0.15],
  lKnee: [1.85, 0, 0],
  rKnee: [1.25, 0, 0],
  lShoulder: [-0.6, 0, 0.3],
  lElbow: [-0.9, 0, 0],
  rShoulder: [-1.25, 0, -0.1],
  rElbow: [-0.2, 0, 0],
};
const HOLD_UP = {
  spine: [-0.06, 0, 0],
  chest: [-0.04, 0, 0],
  head: [-0.32, 0, 0],
  lShoulder: [0.06, 0, 0.14],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-2.55, 0, -0.18],
  rElbow: [-0.45, 0, 0],
  lHip: [-0.12, 0, 0.04],
  lKnee: [0.18, 0, 0],
};

// The tosses: when, which hand, where each piece lands.
const TOSSES = [
  { at: 27.7, side: -1 },
  { at: 28.45, side: 1 },
  { at: 29.15, side: -1 },
  { at: 29.85, side: 1 },
  { at: 30.55, side: -1 },
];

/* ── The scene ────────────────────────────────────────────────────────── */

export const createSlopTruckScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  let disposed = false;
  const textures = [];
  const tex = (t) => (textures.push(t), t);

  const M = {
    asphalt: w.ink({ tint: "#4a4a52", tone: 0.62, rim: 0.1 }),
    concrete: w.ink({ tint: "#a7a39a", tone: 0.82, rim: 0.2 }),
    brick: w.ink({ tint: "#8a4a3a", tone: 0.7, rim: 0.2 }),
    brickDark: w.ink({ tint: "#5f3a32", tone: 0.62, rim: 0.2 }),
    door: w.ink({ tint: "#6e7680", tone: 0.7, rim: 0.2 }),
    iron: w.ink({ tint: "#2c2e33", tone: 0.45, rim: 0.3 }),
    green: w.ink({ tint: "#2f7350", tone: 0.82, rim: 0.5 }),
    greenDark: w.ink({ tint: "#1f4d36", tone: 0.7, rim: 0.4 }),
    white: w.ink({ tint: "#e9e5dc", tone: 0.92, rim: 0.5 }),
    rubber: w.ink({ tint: "#1d1d20", tone: 0.4, rim: 0.2 }),
    hub: w.ink({ tint: "#9a9da3", tone: 0.8, rim: 0.4 }),
    bin: w.ink({ tint: "#36404e", tone: 0.66, rim: 0.4 }),
    bag: w.ink({ tint: "#23262b", tone: 0.55, rim: 0.5, spec: 0.15 }),
    dirt: w.ink({ tint: "#ffffff", tone: 0.78, rim: 0.1, vertexColors: true }),
    fence: w.ink({ tint: "#8b8f94", tone: 0.7, rim: 0.3 }),
    hills: w.ink({ tint: "#9a8c7c", tone: 0.8, rim: 0 }),
    canvas: w.ink({ tint: "#4d5a3e", tone: 0.7, rim: 0.3 }),
    strap: w.ink({ tint: "#2a2622", tone: 0.55, rim: 0.3 }),
  };
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2a3346") });
  const unlit = (map, tint = "#e6d8c8") => new THREE.MeshBasicMaterial({ map: tex(map), color: new THREE.Color(tint) });
  const glowMat = (hex, k) => new THREE.MeshBasicMaterial({ color: hdr(hex, k), toneMapped: true });

  const add = (m, parent = scene, line = true) => {
    parent.add(m);
    if (line) outline(m, w.line);
    return m;
  };
  const box = (sx, sy, sz, mat, x, y, z, parent = scene, line = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    return add(m, parent, line);
  };
  /** A box between two corners. */
  const slab = (x0, x1, y0, y1, z0, z1, mat, parent = scene, line = true) =>
    box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent, line);

  /* ---- the slop: a few shared materials, many small pieces ---- */
  const SLOP = {
    page: [0, 1, 2].map((i) => unlit(codePage(11 + i * 7))),
    icon: ICONS.map((_, i) => unlit(iconTex(i), "#f0e2d2")),
    missing: unlit(missingTex(), "#f0dfe8"),
    note: NOTES.map((_, i) => unlit(noteTex(i), "#f3e6d4")),
    edge: w.ink({ tint: "#efe9de", tone: 0.9, rim: 0.3 }),
  };
  SLOP.missing.map.magFilter = THREE.NearestFilter;
  const GEO = {
    ball: new THREE.IcosahedronGeometry(0.1, 0),
    sheet: new THREE.PlaneGeometry(0.21, 0.28),
    icon: new THREE.BoxGeometry(0.2, 0.2, 0.045),
    cube: new THREE.BoxGeometry(0.22, 0.17, 0.2),
    note: new THREE.PlaneGeometry(0.13, 0.13),
  };
  // A half-rendered box: some corners pulled out of true.
  {
    const p = GEO.cube.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0 && p.getX(i) > 0) p.setXYZ(i, p.getX(i) + 0.05, p.getY(i) + 0.04, p.getZ(i) - 0.03);
  }
  /** One piece of slop. `i` picks the kind and the look, deterministically. */
  const junk = (i, big = 1) => {
    const r = rand(i, 3);
    let m;
    if (r < 0.4) m = new THREE.Mesh(GEO.ball, SLOP.page[i % 3]);
    else if (r < 0.58) {
      m = new THREE.Mesh(GEO.sheet, SLOP.page[(i + 1) % 3]);
      m.material.side = THREE.DoubleSide;
    } else if (r < 0.8) {
      // Mostly the same to-do app, over and over.
      const k = rand(i, 5) < 0.6 ? 0 : 1 + (i % 3);
      m = new THREE.Mesh(GEO.icon, [SLOP.edge, SLOP.edge, SLOP.edge, SLOP.edge, SLOP.icon[k], SLOP.icon[k]]);
    } else if (r < 0.88) m = new THREE.Mesh(GEO.cube, SLOP.missing);
    else {
      m = new THREE.Mesh(GEO.note, SLOP.note[i % NOTES.length]);
      m.material.side = THREE.DoubleSide;
    }
    if (m.geometry !== GEO.sheet && m.geometry !== GEO.note) outline(m, w.line);
    const s = big * (0.85 + rand(i, 7) * 0.4);
    m.scale.setScalar(s);
    m.rotation.set(rand(i, 8) * 6.28, rand(i, 9) * 6.28, rand(i, 10) * 6.28);
    return m;
  };

  /* ════════════════ THE STREET ════════════════ */
  const street = new THREE.Group();
  scene.add(street);
  slab(-30, 30, -0.05, 0, -6, 1.55, M.asphalt, street, false);
  slab(-30, 30, 0, KERB_Y, 1.55, 9, M.concrete, street, false);
  slab(-30, 30, 0, KERB_Y + 0.01, 1.55, 1.7, M.concrete, street);
  // Lane paint.
  for (let x = -28; x < 28; x += 3) slab(x, x + 1.6, 0, 0.004, -1.9, -1.78, new THREE.MeshBasicMaterial({ color: "#c9c2a8" }), street, false);
  // The far side: brick fronts, a roll-up door, a couple of lit windows.
  const fronts = [
    [-14, -6.5, 6.5, M.brick],
    [-6.5, -1.2, 4.6, M.brickDark],
    [-1.2, 5.2, 7.4, M.brick],
    [5.2, 14, 5.2, M.brickDark],
  ];
  for (const [x0, x1, h, mat] of fronts) {
    slab(x0, x1, 0, h, -7.4, -4.8, mat, street);
    slab(x0, x1, h, h + 0.22, -7.5, -4.65, M.concrete, street);
    for (let x = x0 + 0.9; x < x1 - 0.8; x += 1.7)
      for (let y = 2.4; y < h - 0.6; y += 1.7) {
        const lit = rand(Math.round(x * 13 + y * 7), 1) > 0.78;
        slab(x, x + 0.85, y, y + 1.0, -4.82, -4.76, lit ? glowMat("#ffc77a", 1.6) : glass, street, true);
      }
  }
  slab(-5.6, -2.6, 0, 2.9, -4.84, -4.7, M.door, street);
  for (let y = 0.2; y < 2.8; y += 0.22) slab(-5.6, -2.6, y, y + 0.03, -4.7, -4.68, M.iron, street, false);
  // A streetlamp still on.
  const lamp = new THREE.Group();
  lamp.position.set(3.6, KERB_Y, 2.05);
  street.add(lamp);
  box(0.09, 4.2, 0.09, M.iron, 0, 2.1, 0, lamp);
  box(0.06, 0.06, 0.9, M.iron, 0, 4.15, -0.42, lamp);
  box(0.32, 0.1, 0.22, M.iron, 0, 4.1, -0.86, lamp);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(softDot()), color: hdr("#ffd38a", 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  lampGlow.position.set(0, 4.0, -0.86);
  lampGlow.scale.setScalar(0.9);
  lamp.add(lampGlow);

  // Black bags of slop on the pavement, the overflow.
  for (const [x, z, s] of [
    [-2.35, 2.5, 1],
    [-2.75, 2.95, 0.85],
    [1.05, 2.75, 0.9],
  ]) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), M.bag);
    bag.scale.set(s, s * 0.85, s * 0.95);
    bag.position.set(x, KERB_Y + 0.27 * s, z);
    add(bag, street);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), M.bag);
    knot.position.set(x, KERB_Y + 0.6 * s, z);
    add(knot, street);
    for (let k = 0; k < 2; k++) {
      const j = junk(Math.round(x * 31 + k * 5), 0.9);
      j.position.set(x + (k ? 0.22 : -0.18) * s, KERB_Y + 0.18 + k * 0.1, z + 0.2 * s);
      street.add(j);
    }
  }

  /** A wheelie bin, origin at the middle of its base, hinge on the kerb side. */
  const buildBin = (seed) => {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.6, BIN_H, 0.7);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setXYZ(i, p.getX(i) * 1.08, p.getY(i), p.getZ(i) * 1.06);
    const body = new THREE.Mesh(geo, M.bin);
    body.position.y = BIN_H / 2;
    add(body, g);
    box(0.68, 0.06, 0.08, M.bin, 0, BIN_H - 0.03, -0.38, g); // the lip the claws hook
    for (const s of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), M.rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(s * 0.27, 0.1, 0.36);
      add(wheel, g);
    }
    box(0.5, 0.04, 0.04, M.iron, 0, BIN_H - 0.02, 0.4, g, false); // the handle
    const lid = new THREE.Group();
    // Hinged on the street side, so it falls back and shows what's in it.
    lid.position.set(0, BIN_H, -0.38);
    g.add(lid);
    box(0.66, 0.05, 0.78, M.bin, 0, 0.025, 0.39, lid);
    // The overflow: slop heaped up out of the top.
    const slop = new THREE.Group();
    g.add(slop);
    for (let k = 0; k < 22; k++) {
      const j = junk(seed * 100 + k, 1.3);
      const up = rand(seed, k + 30);
      j.position.set((rand(seed, k) - 0.5) * 0.52 * (1 - up * 0.5), BIN_H - 0.04 + up * 0.42, (rand(seed, k + 60) - 0.5) * 0.56 * (1 - up * 0.5));
      slop.add(j);
    }
    return { group: g, lid, slop };
  };
  const bins = BINS.map((x, i) => {
    const b = buildBin(i + 1);
    b.home = v3(x, KERB_Y, BIN_Z);
    b.group.position.copy(b.home);
    street.add(b.group);
    return b;
  });

  /* ════════════════ THE TRUCK ════════════════ */
  const truck = new THREE.Group();
  scene.add(truck);
  // Chassis, wheels, cab.
  slab(-2.75, 3.35, 0.42, 0.72, -0.9, 0.9, M.iron, truck);
  const wheels = [];
  for (const x of [-1.85, -0.85, 2.55])
    for (const s of [-1, 1]) {
      const wg = new THREE.Group();
      wg.position.set(x, 0.48, s * 1.0);
      truck.add(wg);
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 22), M.rubber);
      tyre.rotation.x = Math.PI / 2;
      add(tyre, wg);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 10), M.hub);
      hub.rotation.x = Math.PI / 2;
      add(hub, wg, false);
      wheels.push(wg);
    }
  const cab = new THREE.Group();
  truck.add(cab);
  slab(2.05, 3.4, 0.72, 2.65, -1.12, 1.12, M.white, cab);
  slab(2.05, 3.42, 0.72, 1.05, -1.14, 1.14, M.greenDark, cab); // lower band
  slab(3.41, 3.43, 1.6, 2.45, -1.0, 1.0, glass, cab, false); // windscreen
  for (const s of [-1, 1]) slab(2.5, 3.25, 1.6, 2.45, s * 1.13 - 0.005, s * 1.13 + 0.005, glass, cab, false);
  slab(3.38, 3.55, 0.55, 0.8, -1.12, 1.12, M.iron, cab); // bumper
  for (const s of [-1, 1]) slab(3.43, 3.46, 0.9, 1.05, s * 0.85 - 0.14, s * 0.85 + 0.14, glowMat("#fff1c8", 2.2), cab, false);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 12), glowMat("#ffae33", 1));
  beacon.position.set(2.6, 2.72, 0);
  cab.add(beacon);
  const beaconGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(softDot()), color: hdr("#ffae33", 2.5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  beaconGlow.position.copy(beacon.position);
  cab.add(beaconGlow);

  // The body tips on a hinge at its back bottom corner.
  const bed = new THREE.Group();
  bed.position.set(BED_PIVOT.x, BED_PIVOT.y, 0);
  truck.add(bed);
  const B = (x0, x1, y0, y1, z0, z1, mat, line) => slab(x0 - BED_PIVOT.x, x1 - BED_PIVOT.x, y0 - BED_PIVOT.y, y1 - BED_PIVOT.y, z0, z1, mat, bed, line);
  const { x0: HX0, x1: HX1, floor: HF, wall: HW } = HOPPER;
  B(-2.7, HX0, 0.72, 2.98, -1.15, 1.15, M.green);
  B(-2.7, HX0, 2.98, 3.08, -1.17, 1.17, M.greenDark); // roof over the body
  // The hopper: a well at the front of the body, open at the top, so the bins
  // tip into something and the slop has somewhere to land.
  B(HX0, HX1, 0.72, HF, -1.15, 1.15, M.green);
  B(HX0, HX1, HF, 2.98, 1.15 - HW, 1.15, M.green); // kerb-side wall
  B(HX0, HX1, HF, 2.98, -1.15, -1.15 + HW, M.green);
  B(HX1 - HW, HX1, HF, 2.98, -1.15 + HW, 1.15 - HW, M.green); // front wall
  B(HX0, HX1, 2.98, 3.06, 0.95, 1.17, M.greenDark); // hopper lip
  B(HX0, HX1, 2.98, 3.06, -1.17, -0.95, M.greenDark);
  B(HX0 + 0.02, HX1 - HW, HF, HF + 0.01, -1.15 + HW, 1.15 - HW, M.iron, false); // the hopper floor
  B(-2.72, 1.98, 1.25, 1.4, 1.15, 1.18, new THREE.MeshBasicMaterial({ color: hdr("#f2efe6", 0.85) }), false);
  {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.56), new THREE.MeshBasicMaterial({ map: tex(sideSign()), transparent: true, color: "#efe2d2" }));
    sign.position.set(-0.75 - BED_PIVOT.x, 2.1 - BED_PIVOT.y, 1.156);
    bed.add(sign);
  }
  // The tailgate: hinged along the top of the back, swings up and out.
  const gate = new THREE.Group();
  gate.position.set(-2.7 - BED_PIVOT.x, 3.0 - BED_PIVOT.y, 0);
  bed.add(gate);
  slab(-0.14, 0, -2.3, 0.05, -1.18, 1.18, M.greenDark, gate);
  slab(-0.16, -0.14, -1.5, -1.35, -1.0, 1.0, glowMat("#ff4a3a", 1.6), gate, false);
  // The pick-up arm: a rail up the kerb side, a carriage, a boom, two claws.
  // It stops just under the carriage at full lift, so the bin tips over it clear.
  const RAIL_TOP = LIFT_Y - 0.08;
  const rail = box(0.16, RAIL_TOP - 0.75, 0.1, M.hub, ARM_X - BED_PIVOT.x, (0.75 + RAIL_TOP) / 2 - BED_PIVOT.y, RAIL_Z - 0.03, bed);
  void rail;
  const carriage = new THREE.Group();
  truck.add(carriage);
  box(0.3, 0.26, 0.14, M.iron, 0, 0, 0, carriage);
  const boom = box(0.12, 0.12, 1, M.hub, 0, 0, 0, carriage);
  const grab = new THREE.Group();
  carriage.add(grab);
  box(0.74, 0.1, 0.1, M.iron, 0, 0, 0, grab);
  const claws = [-1, 1].map((s) => box(0.06, 0.12, 0.46, M.iron, s * 0.4, 0, 0.23, grab));

  /* ════════════════ THE TRANSFER STATION ════════════════ */
  const dump = new THREE.Group();
  scene.add(dump);
  {
    const geo = new THREE.PlaneGeometry(70, 50, 140, 100);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    const dirt = new THREE.Color("#7a6a58");
    const wet = new THREE.Color("#4f463e");
    const tyreTrack = new THREE.Color("#5a5048");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + DUMP_X;
      const z = p.getZ(i);
      p.setXYZ(i, x, -0.02 + 0.05 * Math.sin(x * 0.7) * Math.sin(z * 0.5), z);
      c.copy(dirt).lerp(wet, 0.5 * hash(Math.floor(x * 2) * 7 + Math.floor(z * 2) * 131));
      if (Math.abs(z - 0.4) < 0.9 && x > DUMP_X + 3) c.lerp(tyreTrack, 0.5);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    dump.add(new THREE.Mesh(geo, M.dirt));
  }
  // Chain-link along the back, the far hills, the sign.
  for (let x = DUMP_X - 16; x <= DUMP_X + 16; x += 2.4) box(0.07, 2.4, 0.07, M.fence, x, 1.2, -7.5, dump);
  slab(DUMP_X - 16, DUMP_X + 16, 2.35, 2.42, -7.53, -7.47, M.fence, dump);
  {
    const pts = [];
    for (let x = DUMP_X - 16; x < DUMP_X + 16; x += 0.3) {
      pts.push(x, 0.05, -7.5, x + 1.2, 2.35, -7.5);
      pts.push(x + 1.2, 0.05, -7.5, x, 2.35, -7.5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    dump.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#5e5f66", transparent: true, opacity: 0.55 })));
  }
  for (const [x, z, r, h] of [
    [DUMP_X - 9, -12, 5, 2.4],
    [DUMP_X + 4, -14, 6.5, 3.2],
    [DUMP_X + 16, -11, 4.5, 2],
  ]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.hills);
    hill.scale.set(r, h, r * 0.6);
    hill.position.set(x, 0, z);
    add(hill, dump, false);
  }
  {
    const sign = new THREE.Group();
    sign.position.set(DUMP_X + 8.5, 0, -2.6);
    sign.rotation.y = -0.35;
    dump.add(sign);
    for (const s of [-1, 1]) box(0.08, 2.1, 0.08, M.iron, s * 0.8, 1.05, 0, sign);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.72), unlit(stationSign(), "#e8dccb"));
    face.position.set(0, 1.85, 0.05);
    sign.add(face);
  }

  // The heap: a mound, and slop all over it.
  const heap = new THREE.Group();
  heap.position.set(DUMP_X, 0, 0);
  dump.add(heap);
  {
    // A ring, so the middle has vertices to lift.
    const ring = new THREE.RingGeometry(0.001, HEAP_R + 0.15, 72, 18);
    ring.rotateX(-Math.PI / 2);
    const p = ring.attributes.position;
    const col = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    const A = new THREE.Color("#8e8678");
    const Bc = new THREE.Color("#5c564f");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      p.setY(i, Math.max(0, heapAt(x + DUMP_X, z)) - 0.04);
      c.copy(A).lerp(Bc, hash(i * 3.7));
      col.set([c.r, c.g, c.b], i * 3);
    }
    ring.setAttribute("color", new THREE.BufferAttribute(col, 3));
    ring.computeVertexNormals();
    heap.add(new THREE.Mesh(ring, M.dirt));
  }
  const NEAR = (x, z) => Math.hypot(x - (DIG.x - DUMP_X), z - DIG.z) < 0.55 || Math.hypot(x - (GEM_AT.x - DUMP_X), z - GEM_AT.z) < 0.35;
  for (let i = 0; i < 150; i++) {
    const a = rand(i, 40) * Math.PI * 2;
    const r = Math.sqrt(rand(i, 41)) * (HEAP_R - 0.2);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (NEAR(x, z)) continue;
    const j = junk(500 + i, 1.15);
    j.position.set(x, heapAt(x + DUMP_X, z) + 0.03, z);
    heap.add(j);
  }
  // Black bags half sunk in it.
  for (let i = 0; i < 9; i++) {
    const a = rand(i, 50) * Math.PI * 2;
    const r = 0.6 + rand(i, 51) * 2.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (NEAR(x, z)) continue;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 9), M.bag);
    bag.scale.set(1, 0.75, 0.9);
    bag.position.set(x, heapAt(x + DUMP_X, z) + 0.08, z);
    add(bag, heap);
  }
  // What he moves to get at it: a few pieces on top of the find.
  const tossed = TOSSES.map((t, i) => {
    const j = junk(900 + i * 3, 1.2);
    const a = DIG_ANG + (i - 2) * 0.12;
    const from = v3(DUMP_X + 1.75 * Math.cos(a), 0, 1.75 * Math.sin(a));
    from.y = heapAt(from.x, from.z) + 0.05;
    // Over his shoulder, out to the side, down the slope.
    const side = t.side;
    const to = v3(from.x + side * 0.9 * Math.sin(DIG_ANG) + 0.4, 0, from.z - side * 0.9 * Math.cos(DIG_ANG) + 0.3);
    to.y = heapAt(to.x, to.z) + 0.05;
    const rest = j.rotation.clone();
    scene.add(j);
    j.position.copy(from);
    return { mesh: j, from, to, at: t.at, rest };
  });

  // The treasure: a cut gem, warm, under it all.
  const gem = new THREE.Group();
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), glowMat("#ffc24a", 2.4));
  stone.scale.set(1, 1.35, 1);
  outline(stone, w.line);
  gem.add(stone);
  const gemGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(softDot()), color: hdr("#ffb347", 1.8), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  gemGlow.scale.setScalar(0.6);
  gem.add(gemGlow);
  const rays = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex(
        canvasTexture(
          256,
          256,
          (ctx, W, H) => {
            ctx.translate(W / 2, H / 2);
            for (let i = 0; i < 12; i++) {
              ctx.rotate((Math.PI * 2) / 12);
              const g = ctx.createLinearGradient(0, 0, W / 2, 0);
              g.addColorStop(0, "rgba(255,255,255,0.9)");
              g.addColorStop(1, "rgba(255,255,255,0)");
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.moveTo(0, -3);
              ctx.lineTo(W / 2, i % 2 ? -1 : -6);
              ctx.lineTo(W / 2, i % 2 ? 1 : 6);
              ctx.lineTo(0, 3);
              ctx.fill();
            }
          },
          { color: false },
        ),
      ),
      color: hdr("#ffcf7a", 1.4),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  rays.scale.setScalar(1.2);
  gem.add(rays);
  scene.add(gem);
  gem.position.copy(GEM_AT);

  // Gulls over the station.
  const gulls = Array.from({ length: 4 }, (_, i) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.07), new THREE.MeshBasicMaterial({ color: "#efe9df", side: THREE.DoubleSide }));
      wing.position.x = s * 0.2;
      const pivot = new THREE.Group();
      pivot.add(wing);
      g.add(pivot);
    }
    g.userData.phase = i * 1.7;
    dump.add(g);
    return g;
  });

  /* ---- pour pieces: from each bin into the hopper, and from the body onto the heap ---- */
  const POUR_N = 12;
  const pourBin = Array.from({ length: POUR_N * PICKS.length }, (_, i) => {
    const j = junk(1300 + i);
    j.visible = false;
    scene.add(j);
    return j;
  });
  const DUMP_N = 46;
  const dumpPieces = Array.from({ length: DUMP_N }, (_, i) => {
    const j = junk(1500 + i, 1.1);
    j.visible = false;
    scene.add(j);
    // Launched from the open back as the body comes up, landing on the heap.
    const t0 = 19.0 + (i / DUMP_N) * 1.7 + rand(i, 60) * 0.15;
    const k = tip(t0) * TIP;
    const h = 0.25 + rand(i, 61) * 1.6;
    const p0 = v3(DUMP_X + 6.25 + BED_PIVOT.x - h * Math.sin(k) - 0.1, BED_PIVOT.y + h * Math.cos(k), (rand(i, 62) - 0.5) * 2);
    const vel = v3(-1.4 - rand(i, 63) * 1.6, 0.4 + rand(i, 64) * 0.6, (rand(i, 65) - 0.5) * 1.2);
    // Find where it lands.
    let T = 0;
    const p = new THREE.Vector3();
    for (; T < 2; T += 0.01) {
      p.set(p0.x + vel.x * T, p0.y + vel.y * T - 4.9 * T * T, p0.z + vel.z * T);
      if (p.y <= heapAt(p.x, p.z) + 0.05) break;
    }
    return { mesh: j, t0, p0, vel, T, land: p.clone(), spin: v3(rand(i, 66) * 8, rand(i, 67) * 8, rand(i, 68) * 8), rest: j.rotation.clone() };
  });

  /* ════════════════ THE ENGINEER ════════════════ */
  const cast = {};
  const HOODIE = "#3b4c63";
  const load = createModelFigure({
    height: 1.8,
    hair: ["HairSimpleParted", "EyebrowsRegular"],
    line: w.line,
    ink: { tone: 0.8, rim: 0.7 },
    fist: 0.35,
    outfit: { skin: "#c88e6a", top: HOODIE, bottom: "#2f3b52", shoes: "#e8e4dc", hair: "#2a1d16", sleeves: "long", belt: "#1d1a18" },
  });
  const ready = load.then((fig) => {
    if (disposed) return;
    cast.dev = fig;
    scene.add(fig.root);
    fig.apply({});
    fig.root.updateMatrixWorld(true);
    const bone = (n) => fig.bones[n] ?? fig.model.getObjectByName(n);
    const world = (n) => bone(n).getWorldPosition(new THREE.Vector3());
    const hoodMat = w.ink({ tint: HOODIE, tone: 0.78, rim: 0.7 });
    // The hood, down, bunched behind the neck.
    const neck = world("neck");
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hoodMat);
    hood.scale.set(1.15, 0.55, 0.85);
    hood.rotation.x = -0.5;
    hood.position.copy(neck).add(v3(0, -0.02, -0.09));
    add(hood, scene);
    bone("neck").attach(hood);
    // Drawstrings.
    for (const s of [-1, 1]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 5), M.white);
      cord.position.copy(neck).add(v3(s * 0.04, -0.12, 0.11));
      scene.add(cord);
      bone("chest").attach(cord);
    }
    // A laptop bag on his left hip, the strap across him.
    const hips = world("hips");
    const bag = new THREE.Group();
    bag.position.copy(hips).add(v3(0.2, -0.04, 0.02));
    scene.add(bag);
    box(0.08, 0.3, 0.38, M.strap, 0, 0, 0, bag);
    box(0.085, 0.12, 0.39, M.canvas, 0.003, 0.1, 0, bag);
    bone("hips").attach(bag);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.012), M.strap);
    const top = world("neck").add(v3(-0.1, -0.06, 0.1));
    const bot = hips.clone().add(v3(0.18, 0.08, 0.13));
    strap.position.copy(top).lerp(bot, 0.5);
    strap.rotation.z = Math.atan2(bot.x - top.x, top.y - bot.y);
    strap.scale.y = top.distanceTo(bot) / 0.72;
    add(strap, scene);
    bone("chest").attach(strap);
    w.register(fig.root);
    w.palette(DAWN);
    tune();
    w.sync();
    stage.invalidate();
  });

  const tune = () => {
    w.light(...SUN);
    w.inks.forEach((m) => {
      m.uniforms.uFogRange.value.set(14, 70);
    });
  };
  w.page({ mode: "still" });
  w.palette(DAWN);
  tune();

  const caption = createCaption(overlay, { x: 5, y: 70 });

  /* ---- camera ---- */
  const BASE_FOV = camera.fov;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const devAt = new THREE.Vector3();
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    // Narrow frames (theatre) widen the lens rather than lose the truck.
    camera.fov = BASE_FOV * Math.max(1, (1.6 / aspect) ** 0.5);
    camera.updateProjectionMatrix();
    w.bu.uAspect.value = aspect;
    w.sync();
  });
  const shot = (c) => {
    if (c < 5.6) {
      const k = segment(c, 0, 5.6);
      camPos.set(lerp(-1.3, -0.7, k), 1.65, 7.6);
      camLook.set(lerp(-1.0, -0.6, k), 1.72, 1.2);
    } else if (c < 15.5) {
      // Low by the cab, looking up the side as the bins go over.
      const k = easeInOutCubic(segment(c, 5.6, 15.5));
      const ax = Math.min(truckX(c), STOP[1]) + ARM_X;
      camPos.set(ax + lerp(2.8, 2.6, k), 0.85, lerp(7.4, 7.0, k));
      camLook.set(ax - 1.2, 3.05, 0.9);
    } else if (c < 22.5) {
      const k = segment(c, 15.5, 22.5);
      camPos.set(DUMP_X + lerp(6.0, 5.2, k), 2.6, lerp(11.2, 10.4, k));
      camLook.set(DUMP_X + 2.6, 1.15, 0);
    } else if (c < 27.0) {
      const k = easeInOutCubic(segment(c, 22.5, 27.0));
      camPos.set(DUMP_X + lerp(6.4, 4.6, k), lerp(2.0, 2.2, k), lerp(7.4, 6.4, k));
      camLook.copy(devAt).add(tmp.set(-0.3, 0.9, 0)).lerp(tmp.copy(DIG).add(v3(-0.4, 0.6, 0)), k * 0.5);
    } else if (c < FIND + 1.7) {
      // From his side, a little ahead of him: his face and his hands in the pile.
      const k = easeInOutCubic(segment(c, 27.0, FIND + 1.7));
      camPos.copy(DIG).addScaledVector(SIDE, lerp(3.0, 2.6, k)).addScaledVector(INWARD, lerp(0.7, 0.55, k));
      const stand = easeInOutCubic(segment(c, FIND + 0.2, FIND + 1.4));
      camPos.y = DIG.y + lerp(1.4, 1.25, k) + 0.25 * stand;
      camLook.copy(DIG).addScaledVector(INWARD, 0.3 * (1 - stand)).add(tmp.set(0, lerp(0.6, 1.35, stand), 0));
    } else {
      // Low, in front of him, as he stands with it.
      const k = easeOutCubic(segment(c, FIND + 1.7, CYCLE));
      camPos.copy(DIG).addScaledVector(INWARD, -lerp(3.2, 2.9, k)).addScaledVector(SIDE, -0.5);
      camPos.y = DIG.y + lerp(0.6, 0.7, k);
      camLook.copy(DIG).add(tmp.set(0, lerp(1.2, 1.5, k), 0));
    }
    camera.position.copy(camPos).add(tmp.set(pointer.x * 0.08, pointer.y * 0.05, 0));
    camera.lookAt(camLook);
  };

  /* ---- the engineer, per frame ---- */
  const WALK_FROM = v3(DUMP_X + 6.6, 0, 2.6);
  const FOOT = v3(DUMP_X + 3.35, 0, 2.15);
  const facing = (dx, dz) => Math.atan2(dx, dz);
  let gemHeld = false;
  const updateDev = (c, t) => {
    const fig = cast.dev;
    if (!fig) return;
    fig.root.visible = c > 22.3;
    let pose = STAND;
    let yaw = facing(DUMP_X - DIG.x, -DIG.z);
    if (c < 25.0) {
      // Walk in to the foot of the heap.
      const k = segment(c, 22.3, 25.0);
      devAt.lerpVectors(WALK_FROM, FOOT, k);
      yaw = facing(FOOT.x - WALK_FROM.x, FOOT.z - WALK_FROM.z);
      pose = walk(t * 6.6);
    } else if (c < 27.0) {
      // Up the slope, leaning into it.
      const k = easeInOutCubic(segment(c, 25.0, 26.8));
      devAt.lerpVectors(FOOT, DIG, k);
      yaw = facing(DIG.x - FOOT.x, DIG.z - FOOT.z) * (1 - segment(c, 26.4, 27)) + facing(DUMP_X - DIG.x, -DIG.z) * segment(c, 26.4, 27);
      pose = blendPose(walk(t * 5.2, 0.28), STAND, segment(c, 26.6, 27.0));
    } else if (c < FIND) {
      devAt.copy(DIG);
      // Down into a crouch, then the tosses.
      const down = easeInOutCubic(segment(c, 27.0, 27.5));
      let p = dig(0, 1);
      for (const ts of TOSSES) {
        const k = segment(c, ts.at - 0.35, ts.at + 0.35);
        if (k > 0 && k < 1) p = dig(Math.sin(k * Math.PI), ts.side);
      }
      // A beat of stillness: he has seen it.
      p = blendPose(p, LOOK, easeInOutCubic(segment(c, 30.9, FIND)));
      pose = blendPose(STAND, p, down);
    } else {
      devAt.copy(DIG);
      // Pull it out, stand, turn a little to us, hold it up.
      const up = easeInOutCubic(segment(c, FIND + 0.2, FIND + 1.3));
      const raise = easeInOutCubic(segment(c, FIND + 0.9, FIND + 2.0));
      pose = blendPose(blendPose(LOOK, STAND, up), HOLD_UP, raise);
      yaw = lerp(facing(DUMP_X - DIG.x, -DIG.z), facing(-INWARD.x, -INWARD.z) - 0.2, easeInOutCubic(segment(c, FIND + 0.4, FIND + 1.6)));
    }
    fig.root.position.set(devAt.x, 0, devAt.z);
    fig.root.rotation.y = yaw;
    fig.apply(pose);
    fig.groundTo(heapAt(devAt.x, devAt.z) - (c > 25 ? 0.03 : 0));

    // The gem: in the heap, then in his right hand.
    const want = c >= FIND + 0.15;
    if (want && !gemHeld) {
      fig.hold(gem, { hand: "right", grip: "pinch" });
      gemHeld = true;
    } else if (!want && gemHeld) {
      fig.release("right");
      scene.add(gem);
      gem.position.copy(GEM_AT);
      gemHeld = false;
    }
    if (gemHeld) fig.setHand("left", "grip", 0.2, { radius: 0.03 });
    else fig.setHands("grip", c > 27.2 && c < FIND ? 0.6 : 0.2, { radius: 0.03 });
  };

  const pieceRot = new THREE.Euler();
  const update = (time) => {
    const c = staticMode ? STATIC_TIME : ((time % CYCLE) + CYCLE) % CYCLE;
    const t = staticMode ? STATIC_TIME : time;

    // Dip to black at the loop, and across the cut to the station.
    const fade = staticMode
      ? 1
      : Math.min(segment(c, 0, 0.7), 1 - segment(c, CYCLE - 0.8, CYCLE), Math.max(1 - segment(c, 15.0, 15.5), segment(c, 15.5, 16.0)));
    renderer.toneMappingExposure = baseExposure * (0.02 + 0.98 * fade);

    const atStreet = c < 15.5;
    street.visible = atStreet;
    dump.visible = !atStreet;

    // Truck.
    const tx = truckX(c);
    truck.visible = c < 22.6;
    truck.position.set(tx, 0, 0);
    wheels.forEach((wg) => (wg.rotation.z = -tx / 0.48));
    bed.rotation.z = tip(c) * TIP;
    gate.rotation.z = -1.35 * tailgate(c);
    const blink = Math.sin(t * 9) > 0.2 ? 1 : 0.15;
    beaconGlow.material.color.copy(hdr("#ffae33", 2.6 * blink));
    beaconGlow.scale.setScalar(0.55 + 0.25 * blink);

    // The arm and the bins.
    let st = { held: false, claw: 0, y: GRAB_HOME.y, z: GRAB_HOME.z, theta: 0, lid: LID_REST };
    let active = -1;
    if (atStreet) {
      PICKS.forEach((pk, i) => {
        if (c >= pk.t0 && c < pk.t0 + 4.4 * pk.s) {
          st = pick(c, pk.t0, pk.s);
          active = i;
        }
      });
    }
    carriage.position.set(ARM_X, st.y, RAIL_Z + 0.06);
    // Out to the kerb, or back in over the roof: the boom runs either way.
    const reach = st.z - RAIL_Z - 0.06;
    boom.scale.z = Math.max(0.05, Math.abs(reach));
    boom.position.z = reach / 2;
    grab.position.set(0, 0, reach);
    grab.rotation.x = st.theta;
    claws.forEach((cl, i) => (cl.position.x = (i ? 1 : -1) * lerp(0.42, 0.36, st.claw)));
    bins.forEach((b, i) => {
      const pk = PICKS[i];
      const done = c >= pk.t0 + 4.4 * pk.s;
      const emptied = c > pk.t0 + 2.35 * pk.s;
      b.slop.visible = !emptied || !atStreet;
      if (i === active && st.held) {
        // Riding the claws: the grip point stays in the claws.
        const [oy, oz] = rotX(-BIN_GRIP.y, -BIN_GRIP.z, st.theta);
        b.group.position.set(tx + ARM_X, st.y + oy, st.z + oz);
        b.group.rotation.set(st.theta, 0, 0);
        b.lid.rotation.x = st.lid;
      } else {
        b.group.position.copy(b.home);
        b.group.rotation.set(0, 0, 0);
        b.lid.rotation.x = i === active ? st.lid : done ? -0.06 : LID_REST;
      }
    });

    // Slop pouring into the hopper.
    pourBin.forEach((j, n) => {
      const i = Math.floor(n / POUR_N);
      const pk = PICKS[i];
      const t0 = pk.t0 + (2.35 + (n % POUR_N) * 0.05) * pk.s;
      const dtp = c - t0;
      j.visible = atStreet && dtp > 0 && dtp < 0.55;
      if (!j.visible) return;
      const at = pick(t0, pk.t0, pk.s);
      binMouth(at, truckX(t0), j.position);
      j.position.x += (rand(n, 70) - 0.5) * 0.4;
      j.position.z += (rand(n, 71) - 0.5) * 0.3 - 0.4 * dtp;
      j.position.y -= 3.6 * dtp * dtp + 0.6 * dtp;
      if (j.position.y < HOPPER.floor + 0.1) j.visible = false;
      j.rotation.set(dtp * 7 + n, dtp * 5, dtp * 3);
    });

    // The load sliding out onto the heap.
    const grow = easeOutCubic(segment(c, 19.2, 21.2));
    heap.scale.set(1, lerp(0.86, 1, grow), 1);
    dumpPieces.forEach((d) => {
      const dtp = c - d.t0;
      d.mesh.visible = !atStreet && dtp > 0;
      if (!d.mesh.visible) return;
      const k = Math.min(dtp, d.T);
      d.mesh.position.set(d.p0.x + d.vel.x * k, d.p0.y + d.vel.y * k - 4.9 * k * k, d.p0.z + d.vel.z * k);
      pieceRot.set(d.rest.x + d.spin.x * k, d.rest.y + d.spin.y * k, d.rest.z + d.spin.z * k);
      d.mesh.rotation.copy(pieceRot);
    });

    // The tosses.
    tossed.forEach((p) => {
      p.mesh.visible = c > 21;
      const k = segment(c, p.at, p.at + 0.6);
      p.mesh.position.lerpVectors(p.from, p.to, easeOutCubic(k));
      p.mesh.position.y += Math.sin(k * Math.PI) * 0.7;
      p.mesh.rotation.set(p.rest.x + k * 6, p.rest.y + k * 4, p.rest.z);
    });

    // The gem: a glint through the junk, then full light once it's out.
    const seen = segment(c, 29.6, 30.9);
    const out = easeOutCubic(segment(c, FIND + 0.2, FIND + 1.6));
    const pulse = 0.85 + 0.15 * Math.sin(t * 3.1);
    gem.visible = !atStreet;
    stone.material.color.copy(hdr("#ffc24a", lerp(1.0, 2.6, Math.max(seen * 0.5, out))));
    gemGlow.material.opacity = (0.25 + 0.75 * Math.max(seen * 0.6, out)) * pulse;
    gemGlow.scale.setScalar(lerp(0.3, 0.6, out) * pulse);
    rays.material.opacity = out * 0.9;
    rays.material.rotation = t * 0.25;
    rays.scale.setScalar(lerp(0.3, 0.95, out));

    // Gulls wheel over the station.
    gulls.forEach((g, i) => {
      const a = t * 0.35 + g.userData.phase;
      g.position.set(DUMP_X + 1 + Math.cos(a) * (5 + i), 6.5 + i * 0.7 + Math.sin(a * 2) * 0.3, -4 + Math.sin(a) * 3);
      g.rotation.y = -a;
      const flap = Math.sin(t * 7 + i) * 0.5;
      g.children[0].rotation.z = flap;
      g.children[1].rotation.z = -flap;
    });

    updateDev(c, t);
    shot(c);

    caption.update({
      text: c > FIND + 2.1 || staticMode ? "One man's trash is another man's treasure." : "",
      size: 2.3,
      opacity: staticMode ? 1 : Math.min(segment(c, FIND + 2.1, FIND + 2.6), 1 - segment(c, CYCLE - 0.9, CYCLE - 0.3)),
    });
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      caption.dispose();
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = baseExposure;
      textures.forEach((tx) => tx?.dispose?.());
    },
  };
};
