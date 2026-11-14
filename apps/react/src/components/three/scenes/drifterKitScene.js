import * as THREE from "three";
import { createInkWorld } from "../rezeKit";
import { canvasTexture, easeInOutCubic, easeOutCubic, hash, hdr, lerp, lightBeam, segment, smoothstep, softDot } from "../kit";
import { outline } from "../ink";
import { blendPose } from "../figure";
import { HAND_POSES, blendHand, createModelFigure } from "../modelFigure";

/**
 * A drifter with a toothbrush. Jack Reacher owns a folding toothbrush, some
 * cash, an ATM card and his passport. No phone, no car, no bag, no address.
 * When his clothes get dirty he buys new ones and throws the old ones away,
 * then he gets on a bus.
 *
 *   0    – 2.0   night, a cheap motel room. The nightstand by the bedside lamp:
 *                the folding toothbrush, a fold of cash with the card, the
 *                passport with a bus ticket stub in it, the room key. Slow push-in.
 *   2.0  – 3.4   his big hand comes into frame, pinches the toothbrush up
 *                between thumb and forefinger and folds it
 *   3.4  – 5.45  seated on the edge of the bed: toothbrush into his jacket
 *                pocket, then the cash, then the passport and ticket, each
 *                pinched up off the nightstand the same way
 *   5.45 – 6.55  he reaches down beside him, takes the store bag of old
 *                clothes by its handles and stands
 *   6.55 – 8.1   two steps to the waste bin; the bag goes in
 *   8.1  – 10.6  he walks to the door and out. The key stays on the nightstand.
 *   10.6 – 15.4  outside: across the motel lot to a bus waiting under the one
 *                street light, door open
 *   15.4 – 16    dip to black; the loop resets
 *
 * The room is lit by the lamp; a small red VACANCY sign burns outside the
 * window. Reduced motion holds 2.95: the half-folded toothbrush pinched in
 * his fingers, the rest of his kit still on the nightstand. Bodies are
 * Quaternius's CC0 rigs with painted clothes (his jacket's collar and front
 * facings are cloth riding the bones); everything else is built here.
 */

const CYCLE = 16;
const STATIC_TIME = 2.95;
const T_OUT = 10.6; // the cut to the lot

// Reacher's clothes, bought cheap and thrown away: a plain dark canvas work
// jacket worn open over a navy shirt, jeans, boots.
const JACKET = "#3a352e";
const JACKET_HEM = "#26231f";
const ZIP = "#57524a";
const BELT = "#2a1d14";
const SHIRT = "#232a36"; // dark navy: a pale V under the open jacket reads as bare chest
const JEANS = "#33476a";
const BOOTS = "#3a2617";

// Light. The room: one warm lamp, a red sign outside. The lot: sodium and night.
const ROOM = { ground: "#07050a", lines: "#3a2a22", accent: "#ff3b30", rim: "#ff6a55", shade: "#6b5f80" };
const NIGHT = { ground: "#04060c", lines: "#1c2538", accent: "#ff3b30", rim: "#ffb070", shade: "#55648c" };
const LAMP_KEY = new THREE.Color("#ffc890");
const SODIUM = new THREE.Color("#ffb46a");
const NEON = new THREE.Color("#ff3b30");

// ── The room ───────────────────────────────────────────────────────────────
// Lot-side wall (window and door) at x = WALL_X; the bed's headboard on the back wall.
const WALL_X = -2.0;
const BACK_Z = -2.6;
const RIGHT_X = 2.4;
const FRONT_Z = 2.2;
const CEIL = 2.5;
const WIN = { z0: -2.25, z1: -0.95, y0: 0.72, y1: 1.85 };
const DOOR = { z0: 0.5, z1: 1.4, h: 2.1 };
const BED = { x0: -0.65, x1: 0.95, z0: -2.55, z1: -0.5, top: 0.53 };
const SEAT_TOP = BED.top + 0.005; // the mattress gives a little under him
const NS = { x0: -1.25, x1: -0.72, z0: -2.58, z1: -2.0, top: 0.62 };
const LAMP = new THREE.Vector3(-1.06, 1.0, -2.42);
const BIN = new THREE.Vector3(-1.1, 0, -0.5);

// Reacher seated on the bed's edge by the nightstand, facing the window wall (-x).
const RX = -0.53;
const RZ = -1.7;
const SEAT_HEAD = -Math.PI / 2;
// Standing up moves his root half a metre forward, over where his feet were.
const STAND_AT = new THREE.Vector2(RX - 0.5, RZ);
// Far enough off the bin that his left boot stands clear of it (the bag reaches it).
const BIN_STOP = new THREE.Vector2(-1.52, -0.84);
const BIN_HEAD = Math.atan2(BIN_STOP.x - STAND_AT.x, BIN_STOP.y - STAND_AT.y);
const ROOM_PATH = [BIN_STOP, new THREE.Vector2(-1.58, 0.95), new THREE.Vector2(-3.4, 0.95)];

// ── The lot ────────────────────────────────────────────────────────────────
// Motel facade along z = 0 (rooms behind it), the lot, a sidewalk, the street.
const CURB_Z = 6.8;
const KERB_Z = 8.45;
const BUS = { x0: 1.3, x1: 13.3, z0: 8.55, z1: 11.1 };
const BUS_DOOR = { x0: 1.85, x1: 2.85 };
const STREET_LAMP = new THREE.Vector3(3.3, 5.0, 8.0);
const LOT_PATH = [new THREE.Vector2(0.15, 1.2), new THREE.Vector2(2.4, 8.05)];

// ── Poses (measured on the 2.0 m rig) ──────────────────────────────────────
// Thighs sloping a touch down to the knee, shins plumb: soles flat on the carpet
// with the seat of his jeans on the mattress (measured with seatOn / groundTo).
const LEGS = { lHip: [-1.4, 0, 0.1], rHip: [-1.4, 0, -0.1], lKnee: [1.4, 0, 0], rKnee: [1.4, 0, 0] };
const SIT = {
  ...LEGS,
  spine: [0.22, 0, 0],
  chest: [0.05, 0, 0],
  neck: [-0.05, 0, 0],
  head: [-0.1, 0, 0],
  lShoulder: [-0.72, 0, 0.08],
  lElbow: [-1.0, 0, 0],
  rShoulder: [-0.68, 0, -0.1],
  rElbow: [-1.0, 0, 0],
};
// Leaning over to the nightstand on his right, eyes on what he is picking up.
// Each reach is solved so his pinch lands on the edge of the thing he takes.
const LEAN = { ...SIT, spine: [0.6, 0, 0.2], chest: [0.1, -0.2, 0], neck: [0, 0, 0], head: [0.25, -0.3, 0] };
const R1 = { ...LEAN, rShoulder: [-0.3, 0, -0.56], rElbow: [-1.08, 0, 0] }; // the toothbrush
const R2 = { ...LEAN, rShoulder: [-0.46, 0, -0.24], rElbow: [-1.0, 0, 0] }; // the cash
const R3 = { ...LEAN, rShoulder: [-0.9, 0, -0.48], rElbow: [-0.48, 0, 0] }; // the passport
const HOLD = { ...SIT, spine: [0.35, 0, 0], head: [0.3, -0.1, 0], rShoulder: [-0.9, 0.2, -0.05], rElbow: [-1.3, 0, 0] };
const LIFT = blendPose(R1, HOLD, 0.3); // the toothbrush up off the table to fold it
// Slipping it into the pocket at the front of his right hip.
const POCKET = { ...SIT, spine: [0.25, 0, 0], head: [0.15, -0.15, 0], rShoulder: [0.4, 0, -0.16], rElbow: [-1.36, 0, 0] };
// Reaching down beside him for the bag's handles.
const SIT_BAG = { ...SIT, spine: [0.3, 0, 0.25], head: [0.15, 0.25, 0], lShoulder: [-0.04, 0, 0.74], lElbow: [-0.08, 0, 0] };
// Pushing up off the mattress with his right hand, the bag held clear in his left.
const PUSH = { ...SIT, spine: [0.62, 0, 0.1], head: [-0.15, 0, 0], lShoulder: [-0.5, 0, 0.6], lElbow: [-0.6, 0, 0], rShoulder: [-0.45, 0, -0.15], rElbow: [-0.5, 0, 0] };
const STAND = {
  spine: [-0.02, 0, 0],
  chest: [-0.03, 0, 0],
  neck: [0.02, 0, 0],
  head: [0.03, 0, 0],
  lShoulder: [0.03, 0, 0.2],
  lElbow: [-0.2, 0, 0],
  rShoulder: [0.03, 0, -0.2],
  rElbow: [-0.2, 0, 0],
  lHip: [0, 0, 0.08],
  lKnee: [0.03, 0, 0],
  rHip: [0, 0, -0.08],
  rKnee: [0.03, 0, 0],
  lift: -0.01,
};
const CARRY = { lShoulder: [0.05, 0, 0.14], lElbow: [-0.25, 0, 0] };
const DROP = { ...STAND, head: [0.3, 0.25, 0], lShoulder: [-0.3, 0, 0.42], lElbow: [-0.35, 0, 0] };

// The seated part, keyed: [time, pose]. Eased between keys.
const SEATED = [
  [0, SIT],
  [2.0, SIT],
  [2.6, R1],
  [2.65, R1],
  [2.95, LIFT],
  [3.45, LIFT],
  [3.85, POCKET],
  [3.9, POCKET],
  [4.25, R2],
  [4.3, R2],
  [4.65, POCKET],
  [4.7, POCKET],
  [5.05, R3],
  [5.1, R3],
  [5.45, POCKET],
  [5.5, POCKET],
  [5.75, SIT_BAG],
];
const keyed = (keys, c) => {
  for (let i = 0; i < keys.length - 1; i++) {
    if (c < keys[i + 1][0]) return blendPose(keys[i][1], keys[i + 1][1], easeInOutCubic(segment(c, keys[i][0], keys[i + 1][0])));
  }
  return blendPose(keys[keys.length - 1][1], keys[keys.length - 1][1], 0);
};

/** Reacher's walk (as the 110th scene): gait phase `phi`, scaled down by `amp`. */
const GAIT = { arm: 0.24, armOut: 0.17, roll: 0.6, lean: 0.035, knee: 0.9 };
const STRIDE = 1.5;
const GAIT_STRIDE = STRIDE / (4 * 0.5 * 2.0);
const walkPose = (phi, amp) => {
  const g = { ...GAIT, stride: GAIT_STRIDE, bob: 0.55 * 0.925 * (1 - Math.cos(GAIT_STRIDE)) };
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const A = g.stride * amp;
  const knee = (ph) => {
    const u = ((((ph - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / Math.PI;
    if (u < 1) return 0.07 + g.knee * amp * Math.sin(Math.PI * u ** 0.7);
    return 0.07 + 0.16 * amp * Math.sin(Math.PI * Math.min(1, (u - 1) / 0.45));
  };
  const as = Math.sin(phi - 0.25) * amp;
  return {
    hips: [0.03, 0.07 * s * amp, 0.04 * g.roll * c * amp],
    spine: [g.lean, 0, -0.02 * g.roll * c * amp],
    chest: [0.0, -0.13 * s * amp, 0],
    neck: [0, 0.03 * s * amp, 0],
    head: [-0.02 - g.lean * 0.6, 0.03 * s * amp, -0.02 * g.roll * c * amp],
    lShoulder: [-g.arm * as + 0.03, 0, g.armOut],
    lElbow: [-(0.22 + 0.25 * Math.max(0, as)), 0, 0],
    rShoulder: [g.arm * as + 0.03, 0, -g.armOut],
    rElbow: [-(0.22 + 0.25 * Math.max(0, -as)), 0, 0],
    lHip: [A * s - 0.04, 0, 0.025],
    rHip: [-A * s - 0.04, 0, -0.025],
    lKnee: [knee(phi), 0, 0],
    rKnee: [knee(phi + Math.PI), 0, 0],
    lift: -(g.bob * s * s + 0.01) * amp,
  };
};

/**
 * Distance along a walk from t0 to t1 covering `L`, ramping up over `a`
 * seconds and down over `b`. Returns [distance, fraction of full speed].
 */
const travel = (c, t0, t1, L, a, b) => {
  const T = t1 - t0;
  const v = L / (T - (a + b) / 2);
  const t = Math.min(T, Math.max(0, c - t0));
  if (t < a) return [(v * t * t) / (2 * a), t / a];
  if (t <= T - b) return [v * (a / 2) + v * (t - a), 1];
  return [L - (v * (T - t) ** 2) / (2 * b), (T - t) / b];
};

/** A point `s` along a polyline of Vector2s, and its length. */
const pathLength = (pts) => pts.reduce((sum, p, i) => (i ? sum + p.distanceTo(pts[i - 1]) : 0), 0);
const along = (pts, s, out) => {
  let d = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const seg = pts[i].distanceTo(pts[i - 1]);
    if (d <= seg || i === pts.length - 1) return out.copy(pts[i - 1]).lerp(pts[i], Math.min(1.2, d / seg));
    d -= seg;
  }
  return out.copy(pts[pts.length - 1]);
};
/** Facing along a path at `s`: looks a little ahead so corners turn smoothly. */
const headingAlong = (pts, s) => {
  const a = along(pts, s - 0.05, new THREE.Vector2());
  const b = along(pts, s + 0.45, new THREE.Vector2());
  return Math.atan2(b.x - a.x, b.y - a.y);
};
const lerpAngle = (a, b, t) => a + ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * t;

// ── His jacket ─────────────────────────────────────────────────────────────
// A plain canvas work jacket, zip open over the shirt: painted onto the body
// (the open front, the zip tapes, the hem band, cuffs, pocket flaps), with
// the parts that need an edge built as cloth riding the bones: a turned-down
// collar lying on the shoulders and the two front facings.
const HEM = 0.53; // the jacket stops at the hip (fraction of body height)
const WAIST = 0.575;
/** Half-width of the open front at body height `ny`: a narrow gap, wider toward the collar. */
const frontGap = (ny) => 0.02 + 0.026 * smoothstep(Math.min(1, Math.max(0, (ny - 0.6) / 0.22)));
const largestSkinned = (fig) => {
  let body = null;
  fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  return body;
};
/** The open front, zip tapes, hem, cuffs and pockets, painted in bind space. */
const paintJacket = (fig) => {
  const body = largestSkinned(fig);
  const geo = body?.geometry;
  if (!geo?.attributes.color) return;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  // Which way is front: the toes reach further forward than the heels.
  let toe = 0;
  let ankle = 0;
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    if (ny < 0.015) toe += pos.getZ(i) - cz;
    else if (ny > 0.05 && ny < 0.07) ankle += pos.getZ(i) - cz;
  }
  const front = Math.sign(toe - ankle) || 1;
  const C = (hex) => new THREE.Color(hex);
  const jacket = C(JACKET);
  const hem = C(JACKET_HEM);
  const zip = C(ZIP);
  const shirt = C(SHIRT);
  const jeans = C(JEANS);
  const belt = C(BELT);
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    const x = (pos.getX(i) - cx) / H;
    const ax = Math.abs(x);
    const z = ((pos.getZ(i) - cz) * front) / H;
    let c = null;
    if (ax > 0.12 && ny > 0.7) {
      // Sleeve: a cuff band at the wrist.
      if (ax > 0.343 && ax <= 0.37) c = hem;
    } else if (ny > HEM && ny < 0.835) {
      const gap = frontGap(ny);
      const facing = z > 0.02;
      c = jacket;
      if (ny < HEM + 0.016) c = hem; // the hem band
      if (facing && ax < gap) c = ny > WAIST + 0.02 ? shirt : ny > WAIST ? belt : jeans; // the open front
      else if (facing && ax < gap + 0.005) c = zip; // the zip tapes
      // Chest pocket flaps, and the slant of the hand-warmer pockets.
      else if (facing && ny > 0.742 && ny < 0.756 && ax > 0.058 && ax < 0.098) c = hem;
      else if (facing && ny > 0.585 && ny < 0.65 && ax > 0.064 && ax < 0.104 && Math.abs(ny - 0.585 - (ax - 0.064) * 1.6) < 0.004) c = hem;
    }
    if (c) col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
};
/**
 * The collar and the front facings, measured off his posed body at rest and
 * bound to the bones under them. Call with the rig at rest, root at origin.
 */
const buildJacket = (fig, mat, line) => {
  const body = largestSkinned(fig);
  if (!body) return;
  fig.root.updateMatrixWorld(true);
  const n = body.geometry.attributes.position.count;
  const P = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    body.getVertexPosition(i, v).applyMatrix4(body.matrixWorld);
    P.set([v.x, v.y, v.z], i * 3);
    y0 = Math.min(y0, v.y);
    y1 = Math.max(y1, v.y);
  }
  const H = y1 - y0;
  const Y = (ny) => y0 + ny * H;
  // The neck's centre, just above the shoulders.
  let nzMin = Infinity;
  let nzMax = -Infinity;
  for (let i = 0; i < n; i++) {
    if (Math.abs(P[i * 3 + 1] - Y(0.85)) < 0.006 * H && Math.abs(P[i * 3]) < 0.03 * H) {
      nzMin = Math.min(nzMin, P[i * 3 + 2]);
      nzMax = Math.max(nzMax, P[i * 3 + 2]);
    }
  }
  const zc = Number.isFinite(nzMin) ? (nzMin + nzMax) / 2 : 0;
  /** The body's surface in direction `theta` (0 = front, +z) round the neck axis at height `y`. */
  const surface = (theta, y, out, push) => {
    let r = 0;
    for (let i = 0; i < n; i++) {
      const dy = P[i * 3 + 1] - y;
      if (dy > 0.007 * H || dy < -0.007 * H) continue;
      const x = P[i * 3];
      const z = P[i * 3 + 2] - zc;
      if (Math.abs(x) > 0.06 * H) continue; // not out along the shoulders: a collar, not a cape
      let d = Math.atan2(x, z) - theta;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) < 0.14) r = Math.max(r, Math.hypot(x, z));
    }
    r = (r || 0.06 * H) + push;
    return out.set(Math.sin(theta) * r, y, zc + Math.cos(theta) * r);
  };
  /** The front of the body at (x, y). */
  const frontAt = (x, y) => {
    let z = -Infinity;
    for (let i = 0; i < n; i++) {
      if (Math.abs(P[i * 3] - x) < 0.008 * H && Math.abs(P[i * 3 + 1] - y) < 0.008 * H && P[i * 3 + 2] > zc) z = Math.max(z, P[i * 3 + 2]);
    }
    return Number.isFinite(z) ? z : zc + 0.1 * H;
  };

  // The collar: from a fold just above the neckline it falls outward and down
  // onto the shoulders, flat, round the back; at the front its ends run down
  // into two points on the chest either side of the open zip.
  const GAP = 0.5; // half-angle of the opening at the throat
  const N = 40;
  const rows = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const theta = GAP + t * (Math.PI * 2 - 2 * GAP);
    const toFront = 1 - Math.min(1, Math.min(theta - GAP, Math.PI * 2 - GAP - theta) / 0.9);
    const ridge = surface(theta, Y(0.851), new THREE.Vector3(), 0.012 * H / 1.82);
    const fold = surface(theta, Y(0.857), new THREE.Vector3(), 0.007 * H / 1.82);
    const fallY = Y(0.826 - 0.03 * toFront * toFront);
    const edge = surface(theta, fallY, new THREE.Vector3(), 0.01 * H / 1.82);
    // The points flare out from the opening.
    if (toFront > 0.6) edge.x += Math.sign(edge.x) * 0.012 * H * (toFront - 0.6);
    rows.push([fold, ridge, edge]);
  }
  const pts = [];
  rows.forEach((r) => r.forEach((p) => pts.push(p.x, p.y, p.z)));
  const index = [];
  for (let k = 0; k < N; k++) {
    for (let j = 0; j < 2; j++) {
      const a = k * 3 + j;
      const b = (k + 1) * 3 + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const collarGeo = new THREE.BufferGeometry();
  collarGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  collarGeo.setIndex(index);
  collarGeo.computeVertexNormals();
  const bone = (name, fallback) => fig.model.getObjectByName(name) ?? fallback;
  const upper = bone("spine_03", fig.bones.chest ?? fig.bones.spine);
  const pin = (geo, b) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    fig.root.add(mesh);
    outline(mesh, line);
    b.attach(mesh);
    return mesh;
  };
  pin(collarGeo, upper);

  // The front facings: a strip each side of the opening, standing just proud
  // of the shirt, in three pieces so each rides the bone under it.
  const facing = (from, to, b) => {
    const geos = [];
    for (const s of [-1, 1]) {
      const strip = [];
      const M = 8;
      for (let k = 0; k <= M; k++) {
        const ny = from + ((to - from) * k) / M;
        const y = Y(ny);
        const xi = s * frontGap(ny) * H;
        const xo = s * (frontGap(ny) + 0.011) * H;
        strip.push([new THREE.Vector3(xi, y, frontAt(xi, y) + 0.006 * H / 1.82), new THREE.Vector3(xo, y, frontAt(xo, y) + 0.005 * H / 1.82)]);
      }
      const p = [];
      strip.forEach(([a, c]) => p.push(a.x, a.y, a.z, c.x, c.y, c.z, a.x, a.y, a.z - 0.006, c.x, c.y, c.z - 0.006));
      const idx = [];
      for (let k = 0; k < M; k++) {
        const q = k * 4;
        const r = q + 4;
        idx.push(q, r, q + 1, r, r + 1, q + 1); // face
        idx.push(q, q + 2, r, r, q + 2, r + 2); // inner edge
        idx.push(q + 1, r + 1, q + 3, r + 1, r + 3, q + 3); // outer edge
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      geos.push(g);
    }
    for (const g of geos) pin(g, b);
  };
  facing(0.7, 0.8, upper);
  facing(0.6, 0.705, fig.bones.spine ?? upper);
  facing(HEM + 0.004, 0.605, fig.bones.hips ?? upper);
};
/**
 * The outfit painter leaves the trapezius band as skin, which reads as bare
 * shoulders from behind. Paint that band, outside the neck, with the jacket.
 */
const coverShoulders = (fig, top) => {
  let body = null;
  fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  const geo = body?.geometry;
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

/** Lettering on a canvas: centred, optionally on a ground, optionally glowing. */
const lettering = (text, { w = 512, h = 128, color = "#ffffff", bg = null, size = 80, weight = 700, glow = 0, family = "Helvetica, Arial, sans-serif" } = {}) =>
  canvasTexture(w, h, (ctx, W, H) => {
    if (!ctx) return;
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, H / 2 + size * 0.04);
  });

export const createDrifterKitScene = (stage, { overlay } = {}) => {
  void overlay; // no overlay text: the slide's words sit beside it
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene, line } = w;
  let disposed = false;

  const room = new THREE.Group();
  const lot = new THREE.Group();
  scene.add(room, lot);
  lot.visible = false;

  // Ink per set, so each takes its own light.
  const roomInks = [];
  const lotInks = [];
  const R = (tint, { tone = 0.85, rim = 0.15, spec = 0 } = {}) => {
    const m = w.ink({ tint, tone, rim, spec });
    roomInks.push(m);
    return m;
  };
  const L = (tint, { tone = 0.85, rim = 0.2, spec = 0 } = {}) => {
    const m = w.ink({ tint, tone, rim, spec });
    lotInks.push(m);
    return m;
  };
  const basic = (color, intensity = 1, o = {}) => new THREE.MeshBasicMaterial({ color: hdr(color, intensity), ...o });
  const additive = (color, opacity = 1, map = null) =>
    new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const dot = softDot();

  const add = (mesh, parent, lined = false) => {
    parent.add(mesh);
    if (lined) outline(mesh, line);
    return mesh;
  };
  /** A box between two corners. */
  const slab = (x0, x1, y0, y1, z0, z1, mat, parent, lined = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, lined);
  };
  const cyl = (r0, r1, h, mat, x, y, z, parent, seg = 20, lined = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
    m.position.set(x, y, z);
    return add(m, parent, lined);
  };
  /** A flat glow on a surface: `normal` axis 'y' (floor), 'z' or 'x' (walls). */
  const pool = (color, opacity, size, x, y, z, normal, parent) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), additive(color, opacity, dot));
    if (normal === "y") m.rotation.x = -Math.PI / 2;
    if (normal === "x") m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ════════════════════════════════════════════════════════════════════════
  // The room
  // ════════════════════════════════════════════════════════════════════════
  const M = {
    carpet: R("#3a332d", { tone: 0.6, rim: 0 }),
    wall: R("#8a7a62", { tone: 0.62, rim: 0.05 }),
    ceiling: R("#6e6556", { tone: 0.4, rim: 0 }),
    trim: R("#5a4632", { tone: 0.6 }),
    frame: R("#9a9a96", { tone: 0.85, rim: 0.3, spec: 0.6 }),
    curtain: R("#6b5f3a", { tone: 0.7, rim: 0.3 }),
    ac: R("#cfc8b8", { tone: 0.8, rim: 0.2 }),
    acGrille: R("#55524c", { tone: 0.5 }),
    door: R("#6f4f35", { tone: 0.7, rim: 0.2 }),
    brass: R("#c9a24f", { tone: 1.0, rim: 0.5, spec: 1 }),
    bedBase: R("#2a221c", { tone: 0.45 }),
    sheet: R("#d9d2c3", { tone: 0.9, rim: 0.15 }),
    spread: R("#6a2f33", { tone: 0.72, rim: 0.2 }),
    spreadBand: R("#8a5a3a", { tone: 0.75, rim: 0.2 }),
    headboard: R("#5a3d28", { tone: 0.7, rim: 0.2, spec: 0.3 }),
    wood: R("#6a4a30", { tone: 0.8, rim: 0.25, spec: 0.4 }),
    woodDark: R("#3d2a1c", { tone: 0.55 }),
    ceramic: R("#c9b896", { tone: 0.95, rim: 0.25, spec: 0.6 }),
    bin: R("#3d4044", { tone: 0.6, rim: 0.3, spec: 0.4 }),
    picture: R("#5b6a62", { tone: 0.6 }),
    pictureSky: R("#a59a7a", { tone: 0.7 }),
    // His kit.
    brushHandle: R("#2c4f86", { tone: 0.95, rim: 0.4, spec: 1 }),
    brushHead: R("#e8e6df", { tone: 1.0, rim: 0.3, spec: 0.8 }),
    bristle: R("#f6f3ea", { tone: 1.05, rim: 0.2 }),
    bills: R("#8a9a78", { tone: 0.9, rim: 0.2 }),
    billsTop: R("#a3b08e", { tone: 0.95, rim: 0.2 }),
    card: R("#2d4f8a", { tone: 0.9, rim: 0.3, spec: 0.8 }),
    passport: R("#1f2a44", { tone: 0.75, rim: 0.3, spec: 0.3 }),
    gold: R("#b8964a", { tone: 0.95, rim: 0.3, spec: 1 }),
    ticket: R("#efe8d6", { tone: 1.0, rim: 0.2 }),
    ticketBand: R("#b0302a", { tone: 0.85 }),
    fob: R("#a8242b", { tone: 0.85, rim: 0.3, spec: 0.8 }),
    bag: R("#e4e2dc", { tone: 0.95, rim: 0.35, spec: 0.6 }),
    oldClothes: R("#3e4a3c", { tone: 0.6 }),
  };

  // Floor, ceiling, walls.
  slab(WALL_X, RIGHT_X, -0.02, 0, BACK_Z, FRONT_Z, M.carpet, room);
  slab(WALL_X, RIGHT_X, CEIL, CEIL + 0.02, BACK_Z, FRONT_Z, M.ceiling, room);
  slab(WALL_X, RIGHT_X, 0, CEIL, BACK_Z - 0.12, BACK_Z, M.wall, room);
  slab(RIGHT_X, RIGHT_X + 0.12, 0, CEIL, BACK_Z, FRONT_Z, M.wall, room);
  slab(WALL_X, RIGHT_X, 0, CEIL, FRONT_Z, FRONT_Z + 0.12, M.wall, room);
  // The lot-side wall, round the window and the door.
  {
    const X = [WALL_X - 0.15, WALL_X];
    slab(...X, 0, CEIL, BACK_Z, WIN.z0, M.wall, room);
    slab(...X, 0, WIN.y0, WIN.z0, WIN.z1, M.wall, room);
    slab(...X, WIN.y1, CEIL, WIN.z0, WIN.z1, M.wall, room);
    slab(...X, 0, CEIL, WIN.z1, DOOR.z0, M.wall, room);
    slab(...X, DOOR.h, CEIL, DOOR.z0, DOOR.z1, M.wall, room);
    slab(...X, 0, CEIL, DOOR.z1, FRONT_Z, M.wall, room);
  }
  // Skirting.
  slab(WALL_X, RIGHT_X, 0, 0.08, BACK_Z, BACK_Z + 0.015, M.trim, room);
  slab(WALL_X, WALL_X + 0.015, 0, 0.08, BACK_Z, DOOR.z0, M.trim, room);

  // The window: aluminium frame, glass, a heavy curtain pulled to one side.
  {
    const fz = (z0, z1, y0, y1) => slab(WALL_X - 0.08, WALL_X + 0.02, y0, y1, z0, z1, M.frame, room, true);
    fz(WIN.z0, WIN.z0 + 0.05, WIN.y0, WIN.y1);
    fz(WIN.z1 - 0.05, WIN.z1, WIN.y0, WIN.y1);
    fz(WIN.z0, WIN.z1, WIN.y0, WIN.y0 + 0.05);
    fz(WIN.z0, WIN.z1, WIN.y1 - 0.05, WIN.y1);
    fz((WIN.z0 + WIN.z1) / 2 - 0.02, (WIN.z0 + WIN.z1) / 2 + 0.02, WIN.y0, WIN.y1);
    slab(WALL_X, WALL_X + 0.16, WIN.y0 - 0.03, WIN.y0, WIN.z0 - 0.05, WIN.z1 + 0.05, M.trim, room, true); // sill
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(WIN.z1 - WIN.z0, WIN.y1 - WIN.y0),
      new THREE.MeshBasicMaterial({ color: "#c8d2e0", transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    );
    glass.rotation.y = Math.PI / 2;
    glass.position.set(WALL_X - 0.04, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2);
    room.add(glass);
    // Rod and the curtain bunched at the door end, in folds.
    cyl(0.012, 0.012, WIN.z1 - WIN.z0 + 0.7, M.frame, WALL_X + 0.1, WIN.y1 + 0.12, (WIN.z0 + WIN.z1) / 2 + 0.2, room, 8).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, WIN.y1 + 0.1 - 0.05, 10, 1), M.curtain);
      fold.scale.set(0.6, 1, 1);
      fold.position.set(WALL_X + 0.1 + (i % 2) * 0.03, (WIN.y1 + 0.1 + 0.05) / 2, WIN.z1 - 0.2 + i * 0.085);
      add(fold, room, i === 0);
    }
    // The wall unit under the window: every motel room has one.
    slab(WALL_X, WALL_X + 0.24, 0.12, 0.6, -1.9, -1.15, M.ac, room, true);
    slab(WALL_X + 0.241, WALL_X + 0.245, 0.42, 0.56, -1.85, -1.2, M.acGrille, room);
    for (let i = 0; i < 4; i++) slab(WALL_X + 0.241, WALL_X + 0.246, 0.18 + i * 0.05, 0.2 + i * 0.05, -1.85, -1.2, M.acGrille, room);
  }

  // The door, hinged at its far edge, swinging into the room.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(WALL_X - 0.02, 0, DOOR.z1);
  room.add(doorPivot);
  {
    slab(-0.025, 0.025, 0, DOOR.h - 0.01, -(DOOR.z1 - DOOR.z0) + 0.01, 0, M.door, doorPivot, true);
    slab(0.025, 0.04, 1.0, 1.06, -(DOOR.z1 - DOOR.z0) + 0.06, -(DOOR.z1 - DOOR.z0) + 0.12, M.brass, doorPivot); // knob plate
    cyl(0.025, 0.025, 0.05, M.brass, 0.06, 1.03, -(DOOR.z1 - DOOR.z0) + 0.09, doorPivot, 12).rotation.z = Math.PI / 2;
    slab(0.025, 0.035, 1.55, 1.57, -(DOOR.z1 - DOOR.z0) + 0.05, -(DOOR.z1 - DOOR.z0) + 0.22, M.brass, doorPivot); // the chain
    // The frame round it.
    slab(WALL_X, WALL_X + 0.05, 0, DOOR.h + 0.06, DOOR.z0 - 0.06, DOOR.z0, M.trim, room, true);
    slab(WALL_X, WALL_X + 0.05, 0, DOOR.h + 0.06, DOOR.z1, DOOR.z1 + 0.06, M.trim, room, true);
    slab(WALL_X, WALL_X + 0.05, DOOR.h, DOOR.h + 0.06, DOOR.z0 - 0.06, DOOR.z1 + 0.06, M.trim, room, true);
  }

  // Outside the window and the door: the night lot, and the sign.
  {
    const night = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), basic("#070a12"));
    night.rotation.y = Math.PI / 2;
    night.position.set(-9, 4, 0);
    room.add(night);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 30), basic("#0c0c10"));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(WALL_X - 4.1, -0.01, 0);
    room.add(ground);
    // A far row of lit windows across the road, very dim.
    for (let i = 0; i < 9; i++) {
      const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), basic(i % 3 ? "#3a2c1c" : "#5a4428", 1));
      lit.rotation.y = Math.PI / 2;
      lit.position.set(-8.9, 1.2 + (i % 2) * 0.6, -6 + i * 1.6);
      room.add(lit);
    }
  }
  // VACANCY, red neon on a dark board, out past the window. Small: it is a sign, not a light show.
  const neonMats = [];
  {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.36), basic("#140c0c"));
    board.rotation.y = Math.PI / 2;
    board.position.set(-4.62, 1.36, -0.9);
    room.add(board);
    const tex = lettering("VACANCY", { w: 512, h: 128, color: "#ff5040", size: 86, glow: 10 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: tex, color: NEON.clone().multiplyScalar(1.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sign.rotation.y = Math.PI / 2;
    sign.position.set(-4.6, 1.36, -0.9);
    room.add(sign);
    neonMats.push({ mat: sign.material, base: sign.material.color.clone() });
    // Its light on the sill, the floor under the window and the curtain.
    const spill = [
      pool(NEON, 0.08, [1.8, 1.4], WALL_X + 0.7, 0.004, -1.5, "y", room),
      pool(NEON, 0.06, [1.0, 1.2], WALL_X + 0.17, 1.2, -0.65, "x", room),
      pool(NEON, 0.05, [1.4, 0.3], WALL_X + 0.08, WIN.y0 + 0.002, -1.6, "y", room),
    ];
    spill.forEach((m) => neonMats.push({ mat: m.material, base: m.material.color.clone(), opacity: m.material.opacity }));
  }

  // The bed: base, sheet, bedspread with a band, pillows, headboard.
  {
    const { x0, x1, z0, z1, top } = BED;
    slab(x0 + 0.03, x1 - 0.03, 0, 0.28, z0, z1 - 0.03, M.bedBase, room);
    slab(x0, x1, 0.28, top - 0.02, z0, z1, M.sheet, room, true);
    slab(x0 - 0.015, x1 + 0.015, top - 0.17, top + 0.015, z0 + 0.42, z1 + 0.015, M.spread, room, true);
    slab(x0 - 0.017, x1 + 0.017, top - 0.1, top - 0.06, z0 + 0.42, z1 + 0.017, M.spreadBand, room);
    for (const px of [-0.12, 0.6]) {
      const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 10), M.sheet);
      pillow.scale.set(1, 0.17, 0.4);
      pillow.position.set(px, top + 0.05, z0 + 0.2);
      add(pillow, room, true);
    }
    slab(x0 - 0.05, x1 + 0.05, 0.3, 1.15, BACK_Z, BACK_Z + 0.06, M.headboard, room, true);
    slab(x0 - 0.05, x1 + 0.05, 1.15, 1.19, BACK_Z, BACK_Z + 0.08, M.woodDark, room);
    // A print over the bed: a field and a sky, the colour gone out of both.
    slab(-0.25, 0.55, 1.45, 1.95, BACK_Z, BACK_Z + 0.03, M.woodDark, room, true);
    slab(-0.21, 0.51, 1.49, 1.68, BACK_Z + 0.03, BACK_Z + 0.035, M.picture, room);
    slab(-0.21, 0.51, 1.68, 1.91, BACK_Z + 0.03, BACK_Z + 0.035, M.pictureSky, room);
  }

  // The nightstand and the lamp.
  {
    const { x0, x1, z0, z1, top } = NS;
    slab(x0, x1, 0.06, top, z0, z1, M.wood, room, true);
    slab(x0 + 0.02, x1 - 0.02, 0, 0.06, z0 + 0.02, z1 - 0.02, M.woodDark, room);
    slab(x0 + 0.04, x1 - 0.04, top - 0.17, top - 0.04, z1, z1 + 0.012, M.wood, room, true); // drawer
    cyl(0.012, 0.012, 0.02, M.brass, (x0 + x1) / 2, top - 0.105, z1 + 0.02, room, 10).rotation.x = Math.PI / 2;
    // Lamp: ceramic base, a shade glowing warm from inside.
    cyl(0.07, 0.08, 0.02, M.ceramic, LAMP.x, top + 0.01, LAMP.z, room, 20);
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), M.ceramic);
    base.scale.set(1, 1.25, 1);
    base.position.set(LAMP.x, top + 0.12, LAMP.z);
    add(base, room, true);
    cyl(0.012, 0.012, 0.16, M.brass, LAMP.x, top + 0.29, LAMP.z, room, 8);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 28, 1, true), basic("#d99a58", 0.5, { side: THREE.DoubleSide }));
    shade.position.set(LAMP.x, LAMP.y + 0.02, LAMP.z);
    room.add(shade);
    outline(shade, line);
    // The light it throws: up and down the wall, a pool on the nightstand and bed.
    pool("#ffb870", 0.22, [1.1, 1.4], LAMP.x, LAMP.y, BACK_Z + 0.004, "z", room);
    pool("#ffb870", 0.16, [0.9, 0.7], (x0 + x1) / 2, top + 0.002, (z0 + z1) / 2, "y", room);
    pool("#ffb870", 0.08, [1.6, 1.4], -0.2, BED.top + 0.02, -1.9, "y", room);
    pool("#ffb870", 0.06, [2.4, 2.0], -1.2, 0.003, -1.6, "y", room);
  }

  // The waste bin by the foot of the bed.
  {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.115, 0.32, 20, 1, true), M.bin);
    bin.material.side = THREE.DoubleSide;
    bin.position.set(BIN.x, 0.16, BIN.z);
    add(bin, room, true);
    cyl(0.115, 0.115, 0.01, M.woodDark, BIN.x, 0.005, BIN.z, room, 20);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.008, 6, 24), M.bin);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(BIN.x, 0.32, BIN.z);
    room.add(rim);
  }

  // ── His kit, on the nightstand ───────────────────────────────────────────
  const TOP = NS.top;
  // Folding toothbrush: two halves on a hinge at the top face. Built along x,
  // laid with its length across the camera's view.
  const brush = new THREE.Group();
  const brushHinge = new THREE.Group();
  {
    const len = 0.095;
    const h = 0.006;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(len, h * 2, 0.016), M.brushHandle);
    handle.position.set(len / 2, -h, 0);
    add(handle, brush, true);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(len * 0.5, h * 2.1, 0.012), M.brushHead);
    grip.position.set(len * 0.6, -h, 0);
    brush.add(grip);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(len, h * 1.6, 0.01), M.brushHead);
    neck.position.set(-len / 2, -h, 0);
    add(neck, brushHinge, true);
    const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.011), M.bristle);
    bristles.position.set(-len + 0.018, h * 0.4, 0);
    brushHinge.add(bristles);
    brush.add(brushHinge);
  }
  // A fold of bills, the card under it.
  const cash = new THREE.Group();
  {
    slab(-0.043, 0.043, 0, 0.002, -0.027, 0.027, M.card, cash);
    slab(-0.036, 0.036, 0.002, 0.014, -0.018, 0.018, M.bills, cash, true);
    slab(-0.038, 0.034, 0.014, 0.017, -0.019, 0.017, M.billsTop, cash);
  }
  // The passport, a bus ticket stub tucked in it.
  const passport = new THREE.Group();
  {
    slab(-0.045, 0.045, 0, 0.009, -0.063, 0.063, M.passport, passport, true);
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), M.gold);
    seal.rotation.x = -Math.PI / 2;
    seal.position.set(0, 0.0095, 0.008);
    passport.add(seal);
    slab(-0.026, 0.026, 0.0035, 0.0055, -0.035, 0.1, M.ticket, passport, true);
    slab(-0.026, 0.026, 0.0056, 0.0058, 0.075, 0.088, M.ticketBand, passport);
  }
  // The room key on its plastic fob: it stays.
  {
    const fob = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.06), M.fob);
    fob.rotation.y = Math.PI / 4 + 0.3;
    fob.position.set(-1.13, TOP + 0.004, -2.17);
    add(fob, room, true);
    slab(-1.1, -1.04, TOP, TOP + 0.004, -2.13, -2.122, M.brass, room);
  }
  // Each is pinched between thumb and index pad at one edge (`grip`, in its
  // own units), the rest of it out past the thumb: its -x turned to the hand's +Y.
  // `arrive` is when his fingers reach it; `hide` when it goes into his pocket.
  const PINCH_TURN = new THREE.Euler(0, -1.4, -Math.PI / 2); // its flat faces to the pads (measured)
  const KIT = [
    { obj: brush, at: new THREE.Vector3(-0.84, TOP + 0.012, -2.25), yaw: -Math.PI / 2 + 0.15, arrive: 2.6, hide: 3.85, grip: new THREE.Vector3(0.075, -0.006, 0) },
    { obj: cash, at: new THREE.Vector3(-0.95, TOP, -2.05), yaw: 0.35, arrive: 4.25, hide: 4.65, grip: new THREE.Vector3(0.034, 0.009, 0) },
    { obj: passport, at: new THREE.Vector3(-1.0, TOP, -2.25), yaw: -0.25, arrive: 5.05, hide: 5.45, grip: new THREE.Vector3(0.04, 0.0045, -0.03) },
  ];
  KIT.forEach((k) => {
    k.obj.position.copy(k.at);
    k.obj.rotation.y = k.yaw;
    k.rest = k.obj.quaternion.clone();
    scene.add(k.obj);
  });

  // The store bag of old clothes, on the bed beside him. Its origin is where the handles are held.
  const bag = new THREE.Group();
  {
    const geo = new THREE.IcosahedronGeometry(0.13, 2);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + (hash(Math.round(v.x * 50) * 7.1 + Math.round(v.y * 50) * 3.3 + Math.round(v.z * 50) * 1.7) - 0.5) * 0.18;
      v.multiplyScalar(k);
      if (v.y > 0.06) v.x *= 0.7; // gathered toward the handles
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, M.bag);
    body.scale.set(1.05, 1.15, 0.78);
    body.position.y = -0.2;
    add(body, bag, true);
    for (const s of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 16, Math.PI), M.bag);
      handle.position.set(s * 0.012, -0.075, 0);
      handle.rotation.y = s * 0.25;
      bag.add(handle);
    }
    // A dark sleeve over the top: what is in it.
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.14, 10), M.oldClothes);
    sleeve.rotation.z = 1.1;
    sleeve.position.set(0.05, -0.1, 0.02);
    bag.add(sleeve);
  }
  const BAG_REST = new THREE.Vector3(-0.54, BED.top + 0.015 + 0.35, -1.05);
  const BAG_REST_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0));
  // Carried: the top of the handles through his curled fingers (along the
  // hand's +Y), the bag hanging on past the fingertips (its -y along +Z).
  const BAG_GRIP = new THREE.Vector3(0, -0.03, 0);
  const BAG_TURN = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0)));
  const BIN_DROP = new THREE.Vector3(BIN.x, 0.36, BIN.z);
  const BIN_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.9, 0.15));
  const BIN_SQUASH = 0.78; // pushed down into the bin: inside its walls, not through them
  bag.position.copy(BAG_REST);
  bag.quaternion.copy(BAG_REST_Q);
  scene.add(bag);

  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _m4 = new THREE.Matrix4();
  /**
   * An object just taken into a hand: blend it from where it lay (world
   * `pos`, `quat`) to where the hand holds it, `k` 0..1, by rewriting its
   * transform in the hand's frame.
   */
  const settleFrom = (obj, pos, quat, k) => {
    if (k >= 1) return;
    obj.updateWorldMatrix(true, false);
    obj.matrixWorld.decompose(_p, _q, _s);
    _p.lerpVectors(pos, _p, k);
    _q.slerpQuaternions(quat, _q, k);
    _m4.compose(_p, _q, _s.set(1, 1, 1));
    _m4.premultiply(obj.parent.matrixWorld.clone().invert());
    _m4.decompose(obj.position, obj.quaternion, obj.scale);
  };

  // ════════════════════════════════════════════════════════════════════════
  // The lot
  // ════════════════════════════════════════════════════════════════════════
  const O = {
    asphalt: L("#2d2e33", { tone: 0.6, rim: 0 }),
    stripe: L("#c9c4b4", { tone: 0.8, rim: 0 }),
    concrete: L("#8d8a82", { tone: 0.75, rim: 0.05 }),
    stucco: L("#b9ad94", { tone: 0.8, rim: 0.1 }),
    trim: L("#7a2e2a", { tone: 0.7, rim: 0.2 }),
    door: L("#2e5f66", { tone: 0.7, rim: 0.25 }),
    window: L("#1a1e26", { tone: 0.5, spec: 0.6 }),
    roof: L("#3a3430", { tone: 0.55 }),
    pole: L("#5e6166", { tone: 0.7, rim: 0.3, spec: 0.6 }),
    busBody: L("#c9ccd1", { tone: 0.95, rim: 0.35, spec: 0.8 }),
    busStripe: L("#2e4a7a", { tone: 0.8, rim: 0.3, spec: 0.6 }),
    busGlass: L("#151a22", { tone: 0.55, rim: 0.4, spec: 1 }),
    tire: L("#141414", { tone: 0.4, rim: 0.1 }),
    hub: L("#a9adb3", { tone: 0.9, spec: 0.8 }),
    signBlue: L("#2a4f8f", { tone: 0.85, rim: 0.2 }),
    hedge: L("#22301f", { tone: 0.5 }),
  };

  // Ground: the lot, a curb and sidewalk, the street.
  slab(-30, 30, -0.02, 0, -0.5, CURB_Z, O.asphalt, lot);
  slab(-30, 30, 0, 0.12, CURB_Z, KERB_Z, O.concrete, lot);
  slab(-30, 30, -0.02, 0, KERB_Z, 30, O.asphalt, lot);
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    slab(i * 2.6 - 0.05, i * 2.6 + 0.05, 0, 0.004, 2.4, 5.4, O.stripe, lot);
  }
  {
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.01, 0.1), O.stripe, 16);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 16; i++) dashes.setMatrixAt(i, m4.makeTranslation(-24 + i * 3.4, 0.005, 13.6));
    lot.add(dashes);
  }
  // Across the street: a dark hedge line and low buildings, nearly lost to the night.
  slab(-30, 30, 0, 1.1, 19.5, 20.5, O.hedge, lot);
  for (let i = 0; i < 6; i++) slab(-26 + i * 9, -20 + i * 9, 0, 3 + hash(i) * 2.5, 23, 28, O.roof, lot);

  // The motel: a long stucco block, red trim, an overhang over the walkway.
  slab(-14, -0.5, 0, 3.0, -8, 0, O.stucco, lot);
  slab(0.5, 14, 0, 3.0, -8, 0, O.stucco, lot);
  slab(-0.5, 0.5, 2.1, 3.0, -8, 0, O.stucco, lot);
  slab(-14.1, 14.1, 2.7, 2.85, 0, 1.9, O.trim, lot, true);
  slab(-14.1, 14.1, 2.85, 3.05, -8, 1.95, O.roof, lot);
  for (let i = -3; i <= 4; i++) cyl(0.06, 0.06, 2.7, O.trim, 0.9 + (i - 1) * 3.5, 1.35, 1.75, lot, 10, true);
  for (let i = -3; i <= 3; i++) {
    const x = i * 3.5;
    if (i !== 0) slab(x - 0.47, x + 0.47, 0, 2.1, -0.02, 0.03, O.door, lot, true);
    slab(x - 0.53, x + 0.53, 2.1, 2.16, -0.02, 0.05, O.trim, lot);
    // The window beside each door, a couple lit behind the curtain.
    const wx = x + 1.55;
    slab(wx - 0.7, wx + 0.7, 0.9, 1.95, -0.02, 0.02, i % 3 === 1 ? basic("#8a6a3e", 0.42) : O.window, lot, true);
    slab(wx - 0.75, wx + 0.75, 0.86, 0.9, -0.02, 0.12, O.trim, lot);
    // A small lamp over the door, and its pool on the walkway.
    slab(x + 0.55, x + 0.7, 2.3, 2.45, 0.0, 0.1, basic("#ffd9a0", 0.8), lot);
    pool("#ffc080", 0.14, [1.8, 1.8], x + 0.62, 0.004, 0.8, "y", lot);
    pool("#ffc080", 0.08, [1.2, 1.6], x + 0.62, 1.9, 0.035, "z", lot);
  }
  // His door, open: the room behind it lit by the lamp.
  {
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 2.1), basic("#4a3020", 0.75));
    inside.position.set(0, 1.05, -0.6);
    lot.add(inside);
    slab(-0.47, 0.47, 0, 0.01, -0.6, 0, basic("#3a2a1e", 0.6), lot);
    slab(-0.5, -0.47, 0, 2.1, -0.6, 0, O.stucco, lot);
    slab(0.47, 0.5, 0, 2.1, -0.6, 0, O.stucco, lot);
    slab(-0.47, 0.47, 2.07, 2.1, -0.6, 0, O.stucco, lot);
    const leaf = slab(-0.025, 0.025, 0, 2.08, -0.9, 0, O.door, lot, true);
    leaf.position.set(-0.45, 1.04, -0.45);
    pool("#ffb870", 0.12, [1.3, 1.6], 0, 0.004, 0.55, "y", lot);
    // A room number on the door frame.
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshBasicMaterial({ map: lettering("12", { w: 128, h: 96, color: "#e8dcc0", size: 72 }), transparent: true, color: hdr("#ffffff", 0.6) }));
    num.position.set(0.66, 1.7, 0.035);
    lot.add(num);
  }
  // The roadside sign: MOTEL on a lit box, VACANCY in red neon under it. Two-faced.
  {
    const sx = 0.3;
    const sz = 6.3;
    cyl(0.06, 0.06, 2.75, O.pole, sx - 0.75, 1.375, sz, lot, 10, true);
    cyl(0.06, 0.06, 2.75, O.pole, sx + 0.75, 1.375, sz, lot, 10, true);
    slab(sx - 0.9, sx + 0.9, 1.95, 2.7, sz - 0.12, sz + 0.12, O.trim, lot, true);
    const motelTex = lettering("MOTEL", { w: 512, h: 192, color: "#8a1f1a", bg: "#e8dcc4", size: 130, weight: 800 });
    for (const s of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 0.62), new THREE.MeshBasicMaterial({ map: motelTex, color: hdr("#ffffff", 0.5) }));
      face.position.set(sx, 2.325, sz + s * 0.125);
      if (s < 0) face.rotation.y = Math.PI;
      lot.add(face);
      const neonTex = lettering("VACANCY", { w: 512, h: 128, color: "#ff5040", size: 86, glow: 10 });
      const neon = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.27), new THREE.MeshBasicMaterial({ map: neonTex, color: NEON.clone().multiplyScalar(1.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      neon.position.set(sx, 1.68, sz + s * 0.02);
      if (s < 0) neon.rotation.y = Math.PI;
      lot.add(neon);
      neonMats.push({ mat: neon.material, base: neon.material.color.clone() });
    }
    slab(sx - 0.62, sx + 0.62, 1.52, 1.84, sz - 0.01, sz + 0.01, basic("#120a0a"), lot);
    const glowRed = pool(NEON, 0.1, [2.6, 2.0], sx, 0.004, sz - 0.4, "y", lot);
    neonMats.push({ mat: glowRed.material, base: glowRed.material.color.clone(), opacity: glowRed.material.opacity });
  }
  // The bus stop sign.
  {
    cyl(0.03, 0.03, 2.6, O.pole, 0.9, 1.42, 8.2, lot, 8, true);
    const tex = lettering("BUS STOP", { w: 256, h: 128, color: "#f4f1ea", bg: "#2a4f8f", size: 52, weight: 800 });
    for (const s of [-1, 1]) {
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.24), new THREE.MeshBasicMaterial({ map: tex, color: hdr("#ffffff", 0.55) }));
      plate.position.set(0.9, 2.45, 8.2 + s * 0.035);
      if (s < 0) plate.rotation.y = Math.PI;
      lot.add(plate);
    }
  }
  // The one street light: a pole on the sidewalk, the head out over the bus door.
  {
    cyl(0.08, 0.11, 5.1, O.pole, 4.3, 2.67, 7.75, lot, 10, true);
    const top = new THREE.Vector3(4.3, 5.2, 7.75);
    const reach = new THREE.Vector3(STREET_LAMP.x, STREET_LAMP.y + 0.07, STREET_LAMP.z).sub(top);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, reach.length(), 8), O.pole);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), reach.clone().normalize());
    arm.position.copy(top).addScaledVector(reach, 0.5);
    add(arm, lot, true);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.28), O.pole);
    head.position.set(STREET_LAMP.x, STREET_LAMP.y + 0.07, STREET_LAMP.z);
    add(head, lot, true);
    slab(STREET_LAMP.x - 0.22, STREET_LAMP.x + 0.22, STREET_LAMP.y - 0.0, STREET_LAMP.y + 0.012, STREET_LAMP.z - 0.1, STREET_LAMP.z + 0.1, basic("#ffcf94", 1.05), lot);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: SODIUM, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(STREET_LAMP.x, STREET_LAMP.y - 0.05, STREET_LAMP.z);
    glow.scale.setScalar(1.1);
    lot.add(glow);
    const cone = lightBeam({ from: [STREET_LAMP.x, STREET_LAMP.y - 0.05, STREET_LAMP.z], to: [STREET_LAMP.x, 0, STREET_LAMP.z], radiusFrom: 0.15, radiusTo: 2.4, color: "#ffad5c" });
    cone.material.uniforms.uIntensity.value = 0.11;
    lot.add(cone);
    pool(SODIUM, 0.32, [6.5, 6.5], STREET_LAMP.x, 0.125, STREET_LAMP.z - 0.4, "y", lot);
  }

  // The bus: nose to the left, door at the front on the kerb side, open.
  {
    const { x0, x1, z0, z1 } = BUS;
    const g = new THREE.Group();
    lot.add(g);
    slab(x0 + 0.12, x1, 0.42, 3.2, z0, z1, O.busBody, g, true);
    slab(x0 + 0.25, x1 - 0.2, 3.2, 3.32, z0 + 0.15, z1 - 0.15, O.busBody, g); // roof cap
    slab(x1 - 2.6, x1 - 0.4, 3.32, 3.55, z0 + 0.4, z1 - 0.4, O.busBody, g, true); // the unit on the roof
    // Kerb side: the stripe, the window band lit dim from inside, the mullions.
    slab(3.0, x1, 1.18, 1.36, z0 - 0.006, z0, O.busStripe, g);
    slab(x0 + 0.12, BUS_DOOR.x0 - 0.05, 1.18, 1.36, z0 - 0.006, z0, O.busStripe, g);
    slab(3.05, x1 - 0.25, 1.55, 2.6, z0 - 0.008, z0, basic("#7f93a8", 0.36), g);
    for (let x = 3.05; x <= x1 - 0.2; x += 1.3) slab(x - 0.04, x + 0.04, 1.55, 2.6, z0 - 0.012, z0, O.busGlass, g);
    slab(3.05, x1 - 0.25, 2.6, 2.66, z0 - 0.012, z0, O.busGlass, g);
    slab(3.05, x1 - 0.25, 1.5, 1.55, z0 - 0.012, z0, O.busGlass, g);
    slab(x0 + 0.2, BUS_DOOR.x0 - 0.08, 1.55, 2.75, z0 - 0.008, z0, O.busGlass, g); // the driver's window
    // The open door: the stairwell lit, two steps, the folding leaves pushed back.
    slab(BUS_DOOR.x0, BUS_DOOR.x1, 0.42, 2.75, z0 - 0.01, z0 + 0.02, basic("#a9bccd", 0.5), g);
    slab(BUS_DOOR.x0 + 0.03, BUS_DOOR.x1 - 0.03, 0.3, 0.42, z0 - 0.18, z0 + 0.1, O.concrete, g, true);
    slab(BUS_DOOR.x0 + 0.03, BUS_DOOR.x1 - 0.03, 0.58, 0.68, z0 - 0.04, z0 + 0.1, O.concrete, g, true);
    for (const x of [BUS_DOOR.x0 + 0.03, BUS_DOOR.x1 - 0.03]) slab(x - 0.02, x + 0.02, 0.45, 2.7, z0 - 0.28, z0, O.busGlass, g, true);
    pool("#b9cfe6", 0.16, [1.5, 1.6], (BUS_DOOR.x0 + BUS_DOOR.x1) / 2, 0.126, z0 - 0.75, "y", lot);
    // Front: windshield, headlights, the destination sign.
    slab(x0, x0 + 0.12, 1.35, 3.0, z0 + 0.12, z1 - 0.12, O.busGlass, g, true);
    slab(x0 + 0.02, x0 + 0.12, 0.42, 1.35, z0 + 0.05, z1 - 0.05, O.busBody, g, true);
    for (const z of [z0 + 0.35, z1 - 0.35]) slab(x0 - 0.005, x0 + 0.03, 0.68, 0.8, z - 0.14, z + 0.14, basic("#fff2dc", 1.0), g);
    const dest = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.22), new THREE.MeshBasicMaterial({ map: lettering("EXPRESS", { w: 512, h: 80, color: "#ffb347", bg: "#0b0b0b", size: 60, weight: 700 }), color: hdr("#ffffff", 0.75) }));
    dest.rotation.y = -Math.PI / 2;
    dest.position.set(x0 - 0.01, 2.82, (z0 + z1) / 2);
    g.add(dest);
    for (const z of [z0 + 0.3, z1 - 0.3]) slab(x1, x1 + 0.02, 0.7, 0.95, z - 0.15, z + 0.15, basic("#b3121c", 0.8), g);
    // Wheels.
    for (const wx of [3.6, 10.5, 11.6]) {
      for (const wz of [z0 + 0.12, z1 - 0.12]) {
        const tire = cyl(0.5, 0.5, 0.32, O.tire, wx, 0.5, wz, g, 22, true);
        tire.rotation.x = Math.PI / 2;
      }
      const hub = new THREE.Mesh(new THREE.CircleGeometry(0.26, 18), O.hub);
      hub.position.set(wx, 0.5, z0 - 0.05);
      hub.rotation.y = Math.PI;
      g.add(hub);
    }
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.6, z1 - z0 + 0.8), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: 0.75, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set((x0 + x1) / 2, 0.006, (z0 + z1) / 2);
    g.add(shadow);
  }

  // ── The fade between loops (and a blink at the cut outside) ──────────────
  const fade = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uA: { value: 1 } },
      vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform float uA; void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uA); }",
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  fade.frustumCulled = false;
  fade.renderOrder = 999;
  scene.add(fade);

  // ── Light, per set ───────────────────────────────────────────────────────
  const ROOM_DIR = new THREE.Vector3(-0.45, 0.62, -0.65).normalize();
  const LOT_DIR = new THREE.Vector3(0.3, 0.85, 0.45).normalize();
  let lookMode = null;
  const applyMode = (mode) => {
    lookMode = mode;
    w.palette(mode === "room" ? ROOM : NIGHT);
    roomInks.forEach((m) => {
      m.uniforms.uLightWorld.value.copy(ROOM_DIR);
      m.uniforms.uKey.value.copy(LAMP_KEY).multiplyScalar(0.85);
      m.uniforms.uShade.value.set(ROOM.shade);
      m.uniforms.uFogRange.value.set(8, 40);
    });
    lotInks.forEach((m) => {
      m.uniforms.uLightWorld.value.copy(LOT_DIR);
      m.uniforms.uKey.value.copy(SODIUM).multiplyScalar(0.62);
      m.uniforms.uShade.value.set(NIGHT.shade);
      m.uniforms.uFogRange.value.set(14, 60);
    });
    w.page({ mode: "still" });
    w.sync();
  };
  applyMode("room");

  // ── Reacher ──────────────────────────────────────────────────────────────
  const cast = { reacher: null, mats: [], hands: null, kit: KIT, bag };
  const ready = createModelFigure({
    height: 2.0,
    hair: ["HairBuzzed", "EyebrowsRegular"],
    line,
    ink: { tone: 0.95, rim: 0.2 },
    outfit: { skin: "#c99572", top: JACKET, bottom: JEANS, shoes: BOOTS, hair: "#5a3d24", sleeves: "long" },
    hands: "relaxed",
  }).then((reacher) => {
    if (disposed) return cast;
    coverShoulders(reacher, JACKET);
    paintJacket(reacher);
    reacher.apply({}); // rest: the collar and facings bind to the bones here
    const cloth = w.ink({ tint: JACKET, tone: 0.95, rim: 0.2 });
    cloth.side = THREE.DoubleSide;
    buildJacket(reacher, cloth, line);
    // His hand shapes, solved for his hands: resting, half open on the reach,
    // the pinch, and the left hand round the bag's handles.
    const rest = reacher.handRig.r.base;
    reacher.setHand("right", "pinch");
    const pinch = reacher.handRig.r.current;
    reacher.hold(bag, { hand: "left", grip: "grip", radius: 0.009 });
    const gripL = reacher.handRig.l.current;
    reacher.release("left", { to: scene });
    reacher.setHand("right", rest);
    cast.hands = { rest, reach: blendHand(rest, HAND_POSES.open, 0.55), pinch, restL: reacher.handRig.l.base, gripL };
    scene.add(reacher.root);
    w.register(reacher.root);
    reacher.root.traverse((o) => o.material?.uniforms?.uKey && !cast.mats.includes(o.material) && cast.mats.push(o.material));
    cast.reacher = reacher;
    applyMode(lookMode ?? "room");
    stage.invalidate();
    return cast;
  });

  // ── Camera ───────────────────────────────────────────────────────────────
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = {
    // The nightstand, close, pushing in. The window and its red sign behind.
    // Ends back far enough that his forearm and sleeve come in from the top left.
    kit: { from: v3(-0.1, 0.86, -2.52), to: v3(-0.3, 0.8, -2.5), lookFrom: v3(-0.94, 0.7, -2.02), lookTo: v3(-0.95, 0.74, -2.0) },
    // From the window corner: him on the bed's edge, the nightstand by his knee.
    bed: { from: v3(-1.86, 1.3, -2.47), to: v3(-1.84, 1.26, -2.4), lookFrom: v3(-0.74, 0.98, -1.84), lookTo: v3(-0.72, 0.96, -1.8) },
    // The room, wide, from the far corner.
    room: v3(1.85, 1.72, 1.6),
    // The lot, from under the walkway.
    lotFrom: v3(-1.45, 1.35, 0.6),
    lotTo: v3(-0.95, 1.85, 1.35),
  };
  const BUS_LOOK = v3(2.6, 1.6, 8.6);
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const roomLook = new THREE.Vector3();
  const BASE_FOV = camera.fov;
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames widen the lens rather than back through a wall.
    camera.fov = BASE_FOV * Math.max(1, (1.6 / aspect) ** 0.55);
    camera.updateProjectionMatrix();
    w.sync();
  });

  // ── The frame ────────────────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const chest = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const p2 = new THREE.Vector2();
  const roomLen = pathLength(ROOM_PATH);
  const lotLen = pathLength(LOT_PATH);
  /**
   * His pose and where he is, at loop time `c`: `at` is [x, z, heading],
   * `stand` 0 seated on the bed's edge .. 1 on his feet, `floor` under them.
   */
  const place = (c) => {
    const seated = [RX, RZ, SEAT_HEAD];
    if (c < 5.75) return { pose: keyed(SEATED, c), at: seated, stand: 0, floor: 0 };
    if (c < 6.05) return { pose: blendPose(SIT_BAG, PUSH, easeInOutCubic(segment(c, 5.75, 6.05))), at: seated, stand: 0, floor: 0 };
    if (c < 6.55) {
      const k = easeInOutCubic(segment(c, 6.05, 6.55));
      const pose = blendPose(PUSH, { ...STAND, ...CARRY }, k);
      return { pose, at: [lerp(RX, STAND_AT.x, k), RZ, SEAT_HEAD], stand: easeOutCubic(k), floor: 0 };
    }
    if (c < T_OUT) {
      // Two steps to the bin; the bag goes in; then on round the bed to the door.
      const legA = [STAND_AT, BIN_STOP];
      let s;
      let frac;
      let path;
      let pathS;
      if (c < 8.1) {
        [s, frac] = travel(c, 6.55, 7.65, STAND_AT.distanceTo(BIN_STOP), 0.35, 0.35);
        path = legA;
        pathS = s;
      } else {
        // About a metre a second: through the doorway as the shot ends.
        [s, frac] = travel(c, 8.1, 8.1 + 0.175 + roomLen, roomLen, 0.35, 0);
        path = ROOM_PATH;
        pathS = s;
        s += STAND_AT.distanceTo(BIN_STOP);
      }
      along(path, pathS, p2);
      let head = headingAlong(path, pathS);
      if (c < 7.0) head = lerpAngle(SEAT_HEAD, head, easeInOutCubic(segment(c, 6.5, 7.0)));
      else if (c >= 8.1 && c < 8.5) head = lerpAngle(BIN_HEAD, head, easeInOutCubic(segment(c, 8.1, 8.5)));
      const gait = walkPose((s / STRIDE) * Math.PI * 2, 1);
      const still = c < 8.1 ? blendPose(STAND, DROP, Math.min(easeInOutCubic(segment(c, 7.6, 7.8)), 1 - easeInOutCubic(segment(c, 8.0, 8.25)))) : STAND;
      const pose = blendPose(still, gait, smoothstep(frac));
      if (c < 7.75) Object.assign(pose, blendPose(pose, { ...pose, ...CARRY }, 1 - smoothstep(segment(c, 7.6, 7.75))));
      return { pose, at: [p2.x, p2.y, head], stand: 1, floor: 0 };
    }
    // Outside: across the lot to the bus.
    const [s, frac] = travel(c, T_OUT, 15.75, lotLen, 0.001, 0.5);
    along(LOT_PATH, s, p2);
    const gait = walkPose((s / STRIDE) * Math.PI * 2 + 1.1, 1);
    const pose = blendPose(STAND, gait, smoothstep(frac));
    const curb = 0.12 * smoothstep(segment(p2.y, CURB_Z - 0.1, CURB_Z + 0.15));
    return { pose, at: [p2.x, p2.y, headingAlong(LOT_PATH, s)], stand: 1, floor: curb };
  };

  const update = (time) => {
    const c = staticMode ? STATIC_TIME : ((time % CYCLE) + CYCLE) % CYCLE;
    const outside = c >= T_OUT;
    const mode = outside ? "lot" : "room";
    if (mode !== lookMode) applyMode(mode);
    room.visible = !outside;
    lot.visible = outside;

    // Dip to black over the loop point, and a blink on the cut outside.
    const blink = 1 - segment(Math.abs(c - T_OUT), 0, 0.2);
    const dip = staticMode ? 0 : Math.max(1 - segment(c, 0, 0.6), segment(c, CYCLE - 0.6, CYCLE), blink);
    fade.material.uniforms.uA.value = easeInOutCubic(Math.min(1, dip));

    // The neon: steady, with a rare stutter.
    const stutter = staticMode ? 1 : hash(Math.floor(time * 11)) > 0.965 ? 0.45 : 1;
    neonMats.forEach((n) => {
      n.mat.color.copy(n.base).multiplyScalar(stutter);
      if (n.opacity !== undefined) n.mat.opacity = n.opacity * stutter;
    });

    // Reacher.
    const { reacher } = cast;
    let have = false;
    if (reacher) {
      const { pose, at, stand, floor } = place(c);
      pose.chest = [pose.chest[0] + Math.sin(time * 1.4) * 0.008, pose.chest[1], pose.chest[2]];
      reacher.apply(pose);
      reacher.root.position.set(at[0], 0, at[1]);
      reacher.root.rotation.y = at[2];
      // Seated: the seat of his jeans on the mattress. Standing: soles on the floor.
      const onBed = stand < 1 ? reacher.seatOn(SEAT_TOP, { update: false }) : 0;
      reacher.root.position.y = 0;
      const onFloor = reacher.groundTo(floor, { update: false });
      // Never through the floor, even halfway up off the bed.
      reacher.root.position.y = Math.max(onFloor, lerp(onBed, onFloor, stand));
      reacher.root.updateMatrixWorld(true);
      have = true;
    }

    // Camera.
    if (c < 3.4) {
      const k = easeOutCubic(segment(c, 0, 3.4));
      camPos.lerpVectors(SHOTS.kit.from, SHOTS.kit.to, k);
      camLook.lerpVectors(SHOTS.kit.lookFrom, SHOTS.kit.lookTo, k);
    } else if (c < 5.6) {
      const k = easeInOutCubic(segment(c, 3.4, 5.6));
      camPos.lerpVectors(SHOTS.bed.from, SHOTS.bed.to, k);
      camLook.lerpVectors(SHOTS.bed.lookFrom, SHOTS.bed.lookTo, k);
    } else if (c < T_OUT) {
      // Wide, panning with him; the look settles a beat behind his chest.
      const target = have ? chest.copy(reacher.root.position).setY(reacher.root.position.y + 1.15) : v3(-0.6, 1.0, -1.7);
      target.lerp(tmp.set(WALL_X, 1.2, (DOOR.z0 + DOOR.z1) / 2), easeInOutCubic(segment(c, 9.7, 10.4)));
      roomLook.copy(target).lerp(v3(-0.9, 1.0, -0.9), 0.35);
      camPos.copy(SHOTS.room);
      camLook.copy(roomLook);
    } else {
      const k = easeInOutCubic(segment(c, T_OUT, CYCLE));
      camPos.lerpVectors(SHOTS.lotFrom, SHOTS.lotTo, k);
      const him = have ? chest.copy(reacher.root.position).setY(1.3) : v3(0.6, 1.3, 3);
      camLook.copy(him).lerp(BUS_LOOK, 0.45 + 0.2 * k);
    }
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.02;
    camera.position.y += pointer.y * 0.015;
    camera.lookAt(camLook);

    // His kit: on the nightstand, pinched up between thumb and finger, into his pocket.
    if (have) {
      const H = cast.hands;
      let right = H.rest;
      let inHand = null;
      KIT.forEach((k) => {
        const { obj } = k;
        // The hand: half opens on the reach, closes on it, relaxes once it is pocketed.
        if (c > k.arrive - 0.45 && c < k.hide + 0.25) {
          if (c < k.arrive - 0.14) right = blendHand(H.rest, H.reach, smoothstep(segment(c, k.arrive - 0.45, k.arrive - 0.14)));
          else if (c < k.hide) right = blendHand(H.reach, H.pinch, smoothstep(segment(c, k.arrive - 0.14, k.arrive + 0.02)));
          else right = blendHand(H.pinch, H.rest, smoothstep(segment(c, k.hide, k.hide + 0.25)));
        }
        if (!outside && c >= k.arrive && c < k.hide) {
          inHand = k;
          return;
        }
        if (obj.parent !== scene) {
          if (reacher.socket("right") === obj.parent) reacher.release("right", { to: scene });
          else scene.attach(obj);
        }
        obj.visible = !outside && c < k.hide;
        obj.position.copy(k.at);
        obj.quaternion.copy(k.rest);
        obj.scale.setScalar(1);
      });
      if (inHand) {
        const k = inHand;
        reacher.hold(k.obj, { hand: "right", grip: "pinch", offset: k.grip, rotation: PINCH_TURN });
        k.obj.visible = true;
        // Lifted off the table: a short ease from where it lay into the fingers.
        settleFrom(k.obj, k.at, k.rest, smoothstep(segment(c, k.arrive, k.arrive + 0.25)));
      }
      reacher.setHand("right", right);
    }
    brushHinge.rotation.z = -Math.PI * easeInOutCubic(segment(c, 2.75, 3.15));

    // The bag: on the bed, in his left hand by its handles, into the bin.
    bag.visible = !outside;
    if (have) {
      const H = cast.hands;
      const held = !outside && c >= 5.8 && c < 7.98;
      if (held) {
        reacher.hold(bag, { hand: "left", grip: "grip", radius: 0.009, offset: BAG_GRIP, rotation: BAG_TURN });
        bag.scale.setScalar(1);
        if (c < 6.0) settleFrom(bag, BAG_REST, BAG_REST_Q, easeInOutCubic(segment(c, 5.8, 6.0)));
        else if (c >= 7.75) {
          // Let go over the bin: it drops in.
          bag.updateWorldMatrix(true, false);
          bag.matrixWorld.decompose(tmp, _q, _s);
          const k = segment(c, 7.75, 7.98);
          reacher.release("left", { to: scene, keepPose: true });
          bag.position.copy(tmp).lerp(BIN_DROP, k * k);
          bag.quaternion.copy(_q).slerp(BIN_Q, k);
          bag.scale.setScalar(lerp(1, BIN_SQUASH, k));
        }
      } else {
        if (bag.parent !== scene) reacher.release("left", { to: scene, keepPose: true });
        if (c < 5.8) {
          bag.position.copy(BAG_REST);
          bag.quaternion.copy(BAG_REST_Q);
          bag.scale.setScalar(1);
        } else {
          bag.position.copy(BIN_DROP);
          bag.quaternion.copy(BIN_Q);
          bag.scale.setScalar(BIN_SQUASH);
        }
      }
      // The left hand closes on the handles as he reaches, opens as it falls.
      const close = smoothstep(segment(c, 5.6, 5.82)) * (1 - smoothstep(segment(c, 7.75, 7.95)));
      reacher.setHand("left", blendHand(H.restL, H.gripL, close));
    } else {
      bag.position.copy(BAG_REST);
      bag.quaternion.copy(BAG_REST_Q);
    }

    // The door opens as he comes round the bed.
    doorPivot.rotation.y = -1.45 * easeInOutCubic(segment(c, 9.3, 9.9));

    // The light on him: the lamp inside, the street light out on the lot,
    // swung a little toward the camera so his face and clothes read.
    if (have) {
      chest.copy(reacher.root.position).setY(reacher.root.position.y + 1.3);
      toCam.subVectors(camera.position, chest).normalize();
      const src = outside ? STREET_LAMP : LAMP;
      const dist = chest.distanceTo(src);
      const dir = tmp.subVectors(src, chest).normalize().lerp(toCam, 0.45).normalize();
      const k = outside ? Math.min(1.35, 0.42 + 26 / (9 + dist * dist)) : Math.min(1.1, 0.55 + 1.2 / (1 + dist * dist));
      cast.mats.forEach((m) => {
        m.uniforms.uLightWorld.value.copy(dir);
        m.uniforms.uKey.value.copy(outside ? SODIUM : LAMP_KEY).lerp(new THREE.Color("#fff1dc"), 0.25).multiplyScalar(k);
        m.uniforms.uShade.value.set(outside ? "#7486b0" : "#8a7894");
        m.uniforms.uRimColor.value.copy(outside ? SODIUM : NEON);
        m.uniforms.uRim.value = outside ? 0.22 : 0.08; // a thin edge, not armour
      });
    }
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
    },
  };
};
