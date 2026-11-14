import * as THREE from "three";
import { DRESS, OUTFITS, createInkWorld } from "../rezeKit";
import { easeInOutCubic, easeOutBack, easeInCubic, hash, lerp, segment, softDot } from "../kit";
import { inkMaterial, outline, outlineMaterial } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { buildPochita } from "../pochita";

/**
 * Your dream — Chainsaw Man, chapter 1, before any of it. Denji in the shack,
 * crushed by the yakuza's debt, eating plain bread with nothing on it, and
 * telling Pochita what he wants: bread with jam, a warm bed, something hot to
 * eat, a girlfriend. Small, ordinary, and completely his.
 *
 *   0    – 3.0   night: the tin shack alone under the stars, one warm window
 *   3.0  – 4.8   the camera drifts in through that window
 *   4.8  – 7.4   inside, on a thin futon: Denji pinches a corner off the slice
 *                in his left hand and feeds it to Pochita in his lap (he lets
 *                go at the mouth; chomp), takes a bite himself
 *   7.4  – 12.9  he looks up and talks; a thought bubble rises over them and
 *                fills one thing at a time: toast with red jam (8.4), a soft
 *                bed with a pillow (9.25), a steaming bowl (10.1), a girl
 *                waving, a heart over her (11.0). He strokes Pochita, whose
 *                pull-cord tail wags
 *   12.9 – 15.9  the camera backs out of the window, the dream still lit in it,
 *                and tilts up: the shack's roofline against a moonlit sky full
 *                of stars
 *   15.9 – 16.5  dip to black, reset
 *
 * Reduced motion holds 12.0: the whole dream in the bubble, Denji looking up
 * at it, Pochita wagging. Denji is the Quaternius CC0 body with painted
 * clothes (his white shirt, black tie and slacks, bare feet); the bread sits in his hands
 * through fig.hold. Everything else is built here.
 */

const CYCLE = 16.5;
const STATIC_TIME = 12.0;

// Inside: one bare bulb, warm; the sky outside the window stays night.
const ROOM = { ground: "#0a0c18", lines: "#ffcf9a", accent: "#ff9a4a", rim: "#ffc48a", shade: "#6c5a78" };
const BULB_DIR = [0.15, 0.8, 0.6];
const MOON_DIR = [-0.5, 0.7, 0.45];

// The shack: a tin lean-to, front wall (window, door) at +z.
const W = 1.8;
const D = 1.7;
const FRONT_H = 2.25;
const BACK_H = 2.0;
const roofY = (z) => lerp(BACK_H, FRONT_H, (z + D) / (2 * D)) + 0.04;
const WIN = { x0: -0.2, x1: 0.7, y0: 0.8, y1: 1.6 };
const DOOR = { x0: -1.45, x1: -0.75, y1: 1.9 };

// Denji: cross-legged on the futon against the back wall, facing the window.
const DX = -0.1;
const DZ = -1.15;
const FUTON_TOP = 0.07;
const SIT = FUTON_TOP + 0.12;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ── Poses (legs from the breakfast table: cross-legged) ────────────────────
const CROSS = { lHip: [-2.582, 1.022, 1.29], rHip: [-2.582, -1.022, -1.29], lKnee: [2.4, 0, 0], rKnee: [2.4, 0, 0] };
const DOWN = { spine: [0.3, 0, 0], chest: [0.08, 0, 0], neck: [0.1, 0, 0], head: [0.28, -0.08, 0] };
// Leaning in to feed Pochita: further over, the right shoulder turned forward.
const FEED = { spine: [0.46, 0.14, 0], chest: [0.12, 0.06, 0], neck: [0.06, 0, 0], head: [0.3, -0.16, 0] };
const BITE = { spine: [0.16, 0, 0], chest: [0.04, 0, 0], neck: [0.02, 0, 0], head: [0.04, 0, 0] };
const DREAM = { spine: [0.1, 0.05, 0], chest: [-0.04, 0.04, 0], neck: [-0.12, 0.06, 0], head: [-0.34, 0.24, 0.05] };

// ── What his hands hold (fig.hold placements, measured against the hand mesh) ─
// The slice: its up to the open side of the curled left hand, width across the
// fingers; gripped 1 cm above the bottom crust, 3 cm off centre. The fingers
// touch its back, the thumb its face, nothing passes into it.
const SLICE_GRIP = {
  radius: 0.016,
  rotation: new THREE.Quaternion()
    .setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1)))
    .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.158, -0.188, -0.109))),
  point: new THREE.Vector3(0.136, -0.152, 0.009), // in the slice's own (unscaled) units
};
// The torn corner, pinched by its corner between thumb pad and index pad.
const PIECE_GRIP = { grip: "pinch", weight: 0.75, rotation: new THREE.Euler(-0.314, 1.481, 1.066), offset: new THREE.Vector3(-0.0187, -0.0183, 0.0073) };

/** Sequential pose blends: [from, to, pose] — each eases in over the last. */
const schedule = (c, base, list) => {
  let pose = blendPose(base, base, 0); // a full copy: the constants stay untouched
  for (const [a, b, next] of list) if (c > a) pose = blendPose(pose, next, easeInOutCubic(segment(c, a, b)));
  return pose;
};
/** A keyframed point: [[t, point | () => point], ...], eased between keys. */
const track = (c, keys, out) => {
  let i = keys.length - 1;
  while (i > 0 && c < keys[i][0]) i--;
  const [t0, a] = keys[i];
  const [t1, b] = keys[Math.min(i + 1, keys.length - 1)];
  const k = t1 > t0 ? easeInOutCubic(segment(c, t0, t1)) : 0;
  return out.copy(typeof a === "function" ? a() : a).lerp(typeof b === "function" ? b() : b, k);
};
const pulse = (c, at, width = 0.08) => Math.exp(-(((c - at) / width) ** 2));

const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

/** Two-bone arm IK on the pose library's arms (as at the breakfast table). */
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
    arms[s] = { sh, el, hand, l1: S.distanceTo(E), l2: E.distanceTo(H) };
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
    /** Put the `s` wrist on `target` (world); `hint` is where the elbow points. */
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
 * The outfit painter leaves the trapezius band as skin, which from behind or
 * under a rim reads as bare shoulders. Paint it with the shirt.
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

/** A slice of sandwich bread, upright, face to +z, centred on the slice. */
const buildSlice = (w, { crust, crumb, jam = null, line = true }) => {
  const g = new THREE.Group();
  const crustMat = w.ink({ tint: crust, tone: 0.9, rim: 0.5 });
  const crumbMat = w.ink({ tint: crumb, tone: 0.95, rim: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.07), crustMat);
  g.add(body);
  const top = new THREE.Group();
  g.add(top);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.07, 24, 1, false, Math.PI / 2, Math.PI), crustMat);
  dome.rotation.x = Math.PI / 2;
  dome.position.y = 0.2;
  top.add(dome);
  if (line) [body, dome].forEach((m) => outline(m, w.line));
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.02), crumbMat);
  inner.position.set(0, -0.01, 0.03);
  g.add(inner);
  const innerDome = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24, 1, false, Math.PI / 2, Math.PI), crumbMat);
  innerDome.rotation.x = Math.PI / 2;
  innerDome.position.set(0, 0.16, 0.03);
  top.add(innerDome);
  if (jam) {
    // A glossy blob of jam spread in the middle, golden crumb showing all round it.
    const jamMat = w.ink({ tint: jam, tone: 0.9, rim: 0.5, spec: 1 });
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r = 1 + 0.12 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 5 + 2.1);
      pts.push(new THREE.Vector2(Math.cos(a) * 0.12 * r, Math.sin(a) * 0.13 * r));
    }
    const blob = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.008, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 3, curveSegments: 4 });
    const spread = new THREE.Mesh(blob, jamMat);
    spread.position.set(0, 0.03, 0.042);
    g.add(spread);
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), jamMat);
    drip.position.set(0.07, -0.11, 0.05);
    drip.scale.set(0.7, 1.3, 0.4);
    g.add(drip);
  }
  return { group: g, top };
};

export const createDenjiDreamScene = (stage, { overlay } = {}) => {
  void overlay; // no lettering: it sits behind the slide
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  let disposed = false;

  const add = (mesh, parent = scene, line = false) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  const slab = (x0, x1, y0, y1, z0, z1, mat, line = false, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, line);
  };
  const cyl = (r0, r1, h, mat, x, y, z, seg = 16, parent = scene, line = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
    m.position.set(x, y, z);
    return add(m, parent, line);
  };
  const dot = softDot();
  const additive = (color, opacity) => new THREE.MeshBasicMaterial({ color, map: dot, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

  // Outside: moonlight, cool air. Kept out of the room's warm palette.
  const outs = [];
  const outside = (tint, { tone = 0.8, rim = 0.3, spec = 0, side = THREE.FrontSide } = {}) => {
    const m = inkMaterial({ tint, tone, rim, spec, light: MOON_DIR });
    m.side = side;
    const u = m.uniforms;
    u.uAnime.value = 2;
    u.uKey.value.setRGB(0.5, 0.56, 0.78);
    u.uShade.value.set("#2c3560");
    u.uFog.value.set("#0b1024");
    u.uFogRange.value.set(12, 70);
    u.uRimColor.value.set("#8a9ad0");
    outs.push(m);
    return m;
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    plyA: w.ink({ tint: "#7a5a3e", tone: 0.85, rim: 0.2 }),
    plyB: w.ink({ tint: "#6c4f36", tone: 0.82, rim: 0.2 }),
    floorA: w.ink({ tint: "#5e4632", tone: 0.8, rim: 0.1 }),
    floorB: w.ink({ tint: "#53402e", tone: 0.78, rim: 0.1 }),
    beam: w.ink({ tint: "#4a3626", tone: 0.7, rim: 0.3 }),
    tinIn: w.ink({ tint: "#6b6660", tone: 0.7, rim: 0.2 }),
    futon: w.ink({ tint: "#c9c0ae", tone: 0.85, rim: 0.3 }),
    futonEdge: w.ink({ tint: "#9b8f7c", tone: 0.8, rim: 0.2 }),
    blanket: w.ink({ tint: "#5d6f8e", tone: 0.8, rim: 0.3 }),
    pillow: w.ink({ tint: "#d8d0c0", tone: 0.88, rim: 0.3 }),
    cardboard: w.ink({ tint: "#a07a4e", tone: 0.85, rim: 0.3 }),
    can: w.ink({ tint: "#9aa0a6", tone: 0.9, rim: 0.6, spec: 0.8 }),
    bag: w.ink({ tint: "#e6e1d6", tone: 0.9, rim: 0.4, spec: 0.6 }),
    curtain: w.ink({ tint: "#7d8c9a", tone: 0.8, rim: 0.3 }),
    cord: w.ink({ tint: "#1e1a18", tone: 0.5, rim: 0.2 }),
    paper: w.ink({ tint: "#e8e2d4", tone: 0.9, rim: 0.2 }),
  };
  const O = {
    tin: outside("#7a746c", { side: THREE.DoubleSide }),
    rust: outside("#7d4a30", { side: THREE.DoubleSide }),
    roof: outside("#5f564e", { side: THREE.DoubleSide }),
    wood: outside("#5a4430", { tone: 0.75 }),
    ground: outside("#2e2b2a", { tone: 0.6, rim: 0 }),
    weed: outside("#2c3a2a", { tone: 0.6, rim: 0.2 }),
    drum: outside("#4f3b2c", { tone: 0.75, rim: 0.5, spec: 0.5 }),
    pole: outside("#3d3530", { tone: 0.6 }),
    far: outside("#141a2c", { tone: 0.5, rim: 0.1 }),
  };

  // ── Corrugated tin: sheets with the ripple phased to world x (or z) ──────
  const RIPPLE = (2 * Math.PI) / 0.076;
  const AMP = 0.012;
  /** A wall sheet in a vertical plane: along `u` (world x or z), up y; top may slope. */
  const sheet = (u0, u1, y0, top, mat, { axis = "x", at, out = 1 } = {}) => {
    const n = Math.max(8, Math.ceil(((u1 - u0) / 0.076) * 4));
    const g = new THREE.PlaneGeometry(u1 - u0, 1, n, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + (u0 + u1) / 2;
      const yTop = typeof top === "function" ? top(u) : top;
      const y = pos.getY(i) > 0 ? yTop : y0;
      const ripple = Math.sin(u * RIPPLE) * AMP;
      if (axis === "x") pos.setXYZ(i, u, y, at + out * (0.012 + ripple));
      else pos.setXYZ(i, at + out * (0.012 + ripple), y, u);
    }
    g.computeVertexNormals();
    // Face outward whichever way the remap wound the triangles.
    const nrm = g.attributes.normal;
    if ((axis === "x" ? nrm.getZ(0) : nrm.getX(0)) * out < 0) {
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
      g.computeVertexNormals();
    }
    return add(new THREE.Mesh(g, mat));
  };

  // ── The shack ────────────────────────────────────────────────────────────
  const shack = new THREE.Group();
  scene.add(shack);
  const frontTop = FRONT_H;
  // Exterior cladding: front around the window and door, back, both sides.
  sheet(-W, DOOR.x0, 0, frontTop, O.tin, { at: D });
  sheet(DOOR.x1, WIN.x0, 0, frontTop, O.tin, { at: D });
  sheet(WIN.x1, W, 0, frontTop, O.rust, { at: D });
  sheet(WIN.x0, WIN.x1, 0, WIN.y0, O.tin, { at: D });
  sheet(WIN.x0, WIN.x1, WIN.y1, frontTop, O.tin, { at: D });
  sheet(DOOR.x0, DOOR.x1, DOOR.y1, frontTop, O.tin, { at: D });
  sheet(-W, W, 0, BACK_H, O.tin, { at: -D, out: -1 });
  sheet(-D, D, 0, (z) => lerp(BACK_H, FRONT_H, (z + D) / (2 * D)), O.tin, { axis: "z", at: W });
  sheet(-D, D, 0, (z) => lerp(BACK_H, FRONT_H, (z + D) / (2 * D)), O.rust, { axis: "z", at: -W, out: -1 });
  // A rust patch riveted over the front, and corner trims.
  sheet(-W + 0.1, -W + 0.32, 0.2, 1.1, O.rust, { at: D + 0.012 });
  for (const x of [-W, W]) for (const z of [-D, D]) slab(x - 0.03, x + 0.03, 0, z > 0 ? FRONT_H : BACK_H, z - 0.03, z + 0.03, O.wood);
  // The roof: one tin sheet sloping back, ridges running down the slope.
  {
    const g = new THREE.PlaneGeometry(2 * W + 0.4, 2 * D + 0.5, 200, 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + 0.05;
      pos.setXYZ(i, x, roofY(z) + Math.sin(x * RIPPLE) * AMP, z);
    }
    g.computeVertexNormals();
    add(new THREE.Mesh(g, O.roof));
    // Its underside, seen from inside, in the room's light.
    const gi = g.clone();
    gi.translate(0, -0.035, 0);
    const idx = gi.index.array;
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    gi.computeVertexNormals();
    add(new THREE.Mesh(gi, M.tinIn));
    // Stones holding it down.
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 + hash(i) * 0.05, 0), O.pole);
      const x = -1.5 + i * 0.75 + hash(i * 3) * 0.2;
      const z = (hash(i * 7) - 0.5) * 2.4;
      s.position.set(x, roofY(z) + 0.06, z);
      s.scale.y = 0.6;
      add(s, scene, true);
    }
  }
  // The door: planks, a hasp.
  {
    for (let i = 0; i < 4; i++) {
      const x0 = DOOR.x0 + (i * (DOOR.x1 - DOOR.x0)) / 4;
      slab(x0 + 0.005, x0 + (DOOR.x1 - DOOR.x0) / 4 - 0.005, 0.02, DOOR.y1, D + 0.0, D + 0.04, i % 2 ? O.wood : O.drum, true);
    }
    slab(DOOR.x0, DOOR.x1, 1.3, 1.38, D + 0.04, D + 0.06, O.wood);
    slab(DOOR.x0, DOOR.x1, 0.4, 0.48, D + 0.04, D + 0.06, O.wood);
    slab(DOOR.x1 - 0.12, DOOR.x1 - 0.05, 0.95, 1.0, D + 0.06, D + 0.08, O.pole);
  }
  // Window: a wooden frame, no glass left in it, a rag of curtain inside.
  slab(WIN.x0 - 0.05, WIN.x1 + 0.05, WIN.y0 - 0.06, WIN.y0, D - 0.08, D + 0.07, O.wood, true);
  slab(WIN.x0 - 0.05, WIN.x1 + 0.05, WIN.y1, WIN.y1 + 0.05, D - 0.08, D + 0.06, O.wood, true);
  slab(WIN.x0 - 0.05, WIN.x0, WIN.y0, WIN.y1, D - 0.08, D + 0.06, O.wood, true);
  slab(WIN.x1, WIN.x1 + 0.05, WIN.y0, WIN.y1, D - 0.08, D + 0.06, O.wood, true);

  // Interior lining: plywood sheets, a seam every 1.2 m.
  const FZ = [D - 0.06, D];
  slab(-W, WIN.x0, 0, FRONT_H, ...FZ, M.plyA);
  slab(WIN.x1, W, 0, FRONT_H, ...FZ, M.plyB);
  slab(WIN.x0, WIN.x1, 0, WIN.y0, ...FZ, M.plyA);
  slab(WIN.x0, WIN.x1, WIN.y1, FRONT_H, ...FZ, M.plyA);
  for (let i = 0; i < 3; i++) slab(-W + i * 1.2, -W + (i + 1) * 1.2, 0, BACK_H, -D, -D + 0.06, i % 2 ? M.plyB : M.plyA);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z0 = -D + (i * 2 * D) / 3;
      const z1 = -D + ((i + 1) * 2 * D) / 3;
      const m = slab(s * W - 0.06 * s, s * W, 0, roofY(z1) - 0.04, z0, z1, (i + (s > 0 ? 1 : 0)) % 2 ? M.plyB : M.plyA);
      m.position.x = s * (W - 0.03);
    }
  }
  // Floor planks.
  for (let i = 0; i < 20; i++) {
    const x0 = -W + i * 0.18;
    slab(x0 + 0.004, x0 + 0.176, 0, 0.012 + hash(i) * 0.006, -D, D, i % 2 ? M.floorA : M.floorB);
  }
  // Rafters, and the bulb on its flex hanging off the middle one.
  for (const z of [-1.0, 0.2, 1.2]) slab(-W, W, roofY(z) - 0.14, roofY(z) - 0.04, z - 0.05, z + 0.05, M.beam, true);
  const BULB = v3(0.15, 1.72, 0.2);
  const bulbRig = new THREE.Group();
  bulbRig.position.set(BULB.x, roofY(0.2) - 0.14, BULB.z);
  scene.add(bulbRig);
  const flexLen = bulbRig.position.y - BULB.y;
  cyl(0.006, 0.006, flexLen, M.cord, 0, -flexLen / 2, 0, 6, bulbRig);
  cyl(0.02, 0.022, 0.05, M.cord, 0, -flexLen - 0.01, 0, 10, bulbRig);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd49a").multiplyScalar(1.5) }));
  bulb.position.y = -flexLen - 0.06;
  bulb.scale.y = 1.25;
  bulbRig.add(bulb);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: "#ffb870", transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(bulb.position);
  halo.scale.setScalar(0.28);
  bulbRig.add(halo);
  // The bulb's warm pool on the floor, and the window's on the dirt outside.
  const floorPool = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), additive("#ffb06a", 0.07));
  floorPool.rotation.x = -Math.PI / 2;
  floorPool.position.set(0.1, 0.03, -0.3);
  scene.add(floorPool);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.9), additive("#ffb866", 0.12));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set((WIN.x0 + WIN.x1) / 2 + 0.05, 0.02, D + 1.0);
  scene.add(spill);

  // The futon on the floor, a thin blanket kicked to one end, a flat pillow.
  slab(DX - 0.95, DX + 0.95, 0.012, FUTON_TOP, -D + 0.08, -D + 1.02, M.futon, true);
  slab(DX - 0.96, DX + 0.96, 0.012, FUTON_TOP - 0.025, -D + 0.07, -D + 1.03, M.futonEdge);
  {
    const blanket = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), M.blanket);
    blanket.scale.set(0.32, 0.08, 0.4);
    blanket.position.set(DX + 0.72, FUTON_TOP + 0.04, -D + 0.55);
    blanket.rotation.y = 0.4;
    add(blanket, scene, true);
    const pillow = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), M.pillow);
    pillow.scale.set(0.24, 0.05, 0.15);
    pillow.position.set(DX - 0.68, FUTON_TOP + 0.03, -D + 0.3);
    add(pillow, scene, true);
  }
  // Beside him: the rest of the loaf in its bag, a crate with an empty can,
  // a stack of envelopes he cannot pay.
  {
    const bag = new THREE.Group();
    const sack = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 12), M.bag);
    sack.rotation.z = Math.PI / 2;
    sack.scale.set(1, 1, 0.8);
    bag.add(sack);
    outline(sack, w.line);
    const twist = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), M.bag);
    twist.rotation.z = -Math.PI / 2;
    twist.position.x = 0.21;
    bag.add(twist);
    bag.position.set(DX - 0.62, FUTON_TOP + 0.06, -D + 0.85);
    bag.rotation.y = 0.5;
    scene.add(bag);
    const crate = new THREE.Group();
    crate.position.set(1.15, 0, -1.2);
    crate.rotation.y = -0.3;
    scene.add(crate);
    slab(-0.25, 0.25, 0.0, 0.36, -0.2, 0.2, M.cardboard, true, crate);
    slab(-0.26, 0.26, 0.34, 0.37, -0.21, 0.21, M.cardboard, false, crate);
    cyl(0.035, 0.035, 0.11, M.can, -0.1, 0.43, 0.02, 14, crate, true);
    for (let i = 0; i < 4; i++) {
      const env = slab(-0.06, 0.08, 0.37 + i * 0.006, 0.375 + i * 0.006, -0.05, 0.05, M.paper, false, crate);
      env.position.x = 0.1 + (hash(i) - 0.5) * 0.03;
      env.rotation.y = (hash(i * 3) - 0.5) * 0.4;
    }
  }
  // The curtain: a rag pushed to one side of the window.
  {
    const rag = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.8, 4, 8), M.curtain);
    const pos = rag.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 40 + pos.getY(i) * 3) * 0.02);
    rag.geometry.computeVertexNormals();
    rag.material.side = THREE.DoubleSide;
    rag.position.set(WIN.x1 + 0.1, WIN.y1 - 0.38, D - 0.1);
    rag.rotation.y = Math.PI;
    scene.add(rag);
    slab(WIN.x0 - 0.1, WIN.x1 + 0.25, WIN.y1 + 0.04, WIN.y1 + 0.055, D - 0.12, D - 0.1, M.cord);
  }

  // ── Outside: dirt yard, weeds, a drum, the pole, far rooflines ───────────
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), O.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.002;
    scene.add(ground);
    const weeds = new THREE.InstancedMesh(new THREE.ConeGeometry(0.03, 0.32, 4), O.weed, 90);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let n = 0;
    for (let i = 0; i < 160 && n < 90; i++) {
      const x = (hash(i * 1.7) - 0.5) * 12;
      const z = (hash(i * 3.1) - 0.5) * 12;
      if (Math.abs(x) < W + 0.15 && Math.abs(z) < D + 0.15) continue;
      if (Math.abs(x - 0.25) < 0.9 && z > D && z < 9) continue; // keep the camera's path clear
      const s = 0.6 + hash(i * 5.3) * 1.0;
      q.setFromEuler(new THREE.Euler((hash(i) - 0.5) * 0.5, 0, (hash(i * 2) - 0.5) * 0.5));
      m4.compose(v3(x, 0.15 * s, z), q, v3(s, s, s));
      weeds.setMatrixAt(n++, m4);
    }
    weeds.count = n;
    scene.add(weeds);
    // An oil drum and a broken pallet by the wall.
    cyl(0.28, 0.28, 0.86, O.drum, 1.45, 0.43, D + 0.45, 20, scene, true);
    for (const y of [0.25, 0.6]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.012, 6, 24), O.pole);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(1.45, y, D + 0.45);
      scene.add(hoop);
    }
    const pallet = new THREE.Group();
    pallet.position.set(-2.25, 0, 0.6);
    pallet.rotation.set(0, 0.2, -1.25);
    for (let i = 0; i < 5; i++) slab(-0.5, 0.5, 0, 0.02, -0.4 + i * 0.2, -0.32 + i * 0.2, O.wood, true, pallet);
    scene.add(pallet);
    // The utility pole and the wire that brings the bulb its power.
    cyl(0.09, 0.12, 7, O.pole, -3.6, 3.5, 2.4, 10);
    slab(-4.3, -2.9, 6.5, 6.6, 2.35, 2.45, O.pole);
    const wire = new THREE.LineBasicMaterial({ color: "#1a1a22" });
    const sag = (a, b, drop) => {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        pts.push(a.clone().lerp(b, t).add(v3(0, -Math.sin(Math.PI * t) * drop, 0)));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
    };
    sag(v3(-3.6, 6.4, 2.4), v3(-W + 0.05, roofY(0.6) + 0.02, 0.6), 0.6);
    sag(v3(-4.2, 6.55, 2.4), v3(-30, 6.55, -6), 1.4);
    sag(v3(-3.0, 6.55, 2.4), v3(20, 6.55, -14), 1.6);
    // Far rooflines and trees against the sky.
    for (let i = 0; i < 22; i++) {
      const x = -40 + i * 3.8 + hash(i) * 2;
      const z = -26 - hash(i * 2.3) * 8;
      const h = 2.2 + hash(i * 4.1) * 3.5;
      if (hash(i * 9.7) > 0.45) slab(x, x + 2.5 + hash(i * 5.5) * 2, 0, h, z - 1.5, z + 1.5, O.far);
      else {
        const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 + hash(i * 6.1) * 1.4, 1), O.far);
        blob.position.set(x, h, z);
        scene.add(blob);
      }
    }
  }

  // ── Stars: two fields that twinkle against each other ───────────────────
  const STAR_SIZE = [2.8, 4.0];
  const starFields = [0, 1].map((k) => {
    const N = 340;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const s = i * 2 + k * 977;
      const az = (hash(s * 1.3) - 0.5) * Math.PI * 1.7;
      const el = Math.asin(0.06 + hash(s * 2.7) * 0.92);
      const r = 90;
      pos.set([Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r - 10], i * 3);
      const b = 0.55 + hash(s * 4.9) ** 2 * 0.45;
      c.set(hash(s * 6.1) > 0.8 ? "#ffe2c0" : "#cfdaff").multiplyScalar(b);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: STAR_SIZE[k], sizeAttenuation: false, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    pts.renderOrder = -1;
    scene.add(pts);
    return mat;
  });

  // ── Pochita, the bread ───────────────────────────────────────────────────
  const POCHITA_SCALE = 0.16;
  const pochita = buildPochita(w);
  const pochitaRoot = new THREE.Group();
  pochitaRoot.position.set(DX + 0.02, SIT - 0.02, DZ + 0.36);
  pochitaRoot.scale.setScalar(POCHITA_SCALE);
  pochitaRoot.add(pochita.pup);
  scene.add(pochitaRoot);
  const shadow = (wd, dp, x, y, z, o = 0.5) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, dp), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: o, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };
  shadow(1.1, 0.9, DX, FUTON_TOP + 0.003, DZ + 0.12, 0.55);

  const BREAD = { crust: "#c99a5e", crumb: "#efe4c8" };
  const slice = buildSlice(w, BREAD);
  slice.group.scale.setScalar(0.24);
  scene.add(slice.group);
  // The torn corner: crumb with a strip of crust, centred on its bounding box.
  const piece = new THREE.Group();
  {
    const crumb = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.03, 0.016), w.ink({ tint: BREAD.crumb, tone: 0.95, rim: 0.3 }));
    crumb.position.y = -0.0035;
    const crust = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.008, 0.018), w.ink({ tint: BREAD.crust, tone: 0.9, rim: 0.4 }));
    crust.position.y = 0.0145;
    crust.rotation.z = 0.15;
    piece.add(crumb, crust);
    outline(crumb, w.line);
  }
  piece.visible = false;

  // ── The thought bubble and the dream in it ──────────────────────────────
  const bubbleLine = outlineMaterial(0.95);
  bubbleLine.uniforms.uInk.value.set("#1b1414");
  const cloud = w.ink({ tint: "#f2eee6", tone: 0.98, rim: 0.15 });
  const bubble = new THREE.Group();
  // Up and to his left (screen right), clear of his face; the trail ends beside his head.
  const BUBBLE_AT = v3(DX + 0.6, 1.42, DZ + 0.25);
  bubble.position.copy(BUBBLE_AT);
  scene.add(bubble);
  const puffs = new THREE.Group();
  bubble.add(puffs);
  const BUBBLE_RX = 0.44;
  {
    const N = 12;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + 0.2;
      const r = 0.12 + hash(i * 3.3) * 0.035;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloud);
      p.position.set(Math.cos(a) * BUBBLE_RX, Math.sin(a) * 0.15, 0);
      p.scale.z = 0.3;
      puffs.add(p);
      outline(p, bubbleLine);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), cloud);
    core.scale.set(BUBBLE_RX + 0.06, 0.2, 0.06);
    puffs.add(core);
  }
  // The trail of circles down toward his head.
  const trail = [
    [-0.24, -0.29, 0.05],
    [-0.33, -0.4, 0.035],
    [-0.4, -0.49, 0.024],
  ].map(([x, y, r]) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), cloud);
    d.position.set(x, y, 0);
    d.scale.z = 0.5;
    bubble.add(d);
    outline(d, bubbleLine);
    return d;
  });

  // 1. Toast, with red jam on it.
  const toast = buildSlice(w, { crust: "#8f5424", crumb: "#e2a456", jam: "#c4162e" });
  toast.group.scale.setScalar(0.34);
  const toastItem = new THREE.Group();
  toastItem.add(toast.group);
  toastItem.position.set(-0.33, 0.0, 0.08);
  toastItem.rotation.set(-0.35, 0.3, 0.1); // tipped back, face to the camera
  puffs.add(toastItem);

  // 2. A bed: a frame, a thick mattress, a pillow, the blanket turned down.
  const bedItem = new THREE.Group();
  {
    const g = new THREE.Group();
    const wood = w.ink({ tint: "#8a5a36", tone: 0.85, rim: 0.4 });
    const sheetMat = w.ink({ tint: "#eeeae0", tone: 0.95, rim: 0.3 });
    const quilt = w.ink({ tint: "#c0453a", tone: 0.85, rim: 0.4 });
    slab(-0.11, 0.11, -0.03, 0.0, -0.065, 0.065, wood, true, g);
    slab(-0.105, 0.105, 0.0, 0.035, -0.06, 0.06, sheetMat, true, g);
    slab(-0.125, -0.11, -0.04, 0.07, -0.065, 0.065, wood, true, g);
    const pillowMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), sheetMat);
    pillowMesh.scale.set(0.028, 0.016, 0.045);
    pillowMesh.position.set(-0.075, 0.048, 0);
    add(pillowMesh, g, true);
    slab(-0.035, 0.108, 0.033, 0.046, -0.062, 0.062, quilt, true, g);
    slab(-0.05, -0.03, 0.036, 0.05, -0.062, 0.062, sheetMat, false, g);
    g.scale.setScalar(1.15);
    bedItem.add(g);
  }
  bedItem.position.set(-0.11, -0.02, 0.08);
  bedItem.rotation.set(0.6, -0.55, 0);
  puffs.add(bedItem);

  // 3. A bowl of something hot: rice, an egg, green onion, steam.
  const bowlItem = new THREE.Group();
  const steam = [];
  {
    const g = new THREE.Group();
    const lacquer = w.ink({ tint: "#7e2a1c", tone: 0.8, rim: 0.5, spec: 0.6 });
    lacquer.side = THREE.DoubleSide;
    const bowlMesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lacquer);
    bowlMesh.scale.y = 0.85;
    add(bowlMesh, g, true);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.005, 6, 28), lacquer);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    cyl(0.025, 0.028, 0.012, lacquer, 0, -0.058, 0, 16, g);
    const rice = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: "#f1ece0", tone: 0.95, rim: 0.2 }));
    rice.scale.y = 0.4;
    g.add(rice);
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), w.ink({ tint: "#f2a21a", tone: 0.95, rim: 0.3, spec: 0.8 }));
    yolk.scale.y = 0.6;
    yolk.position.set(0.015, 0.024, 0.01);
    const eggWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 16), w.ink({ tint: "#f8f4ea", tone: 0.98, rim: 0.2 }));
    eggWhite.position.set(0.012, 0.02, 0.01);
    g.add(eggWhite, yolk);
    const onion = w.ink({ tint: "#5f9a3a", tone: 0.85, rim: 0.3 });
    for (let i = 0; i < 6; i++) {
      const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 6), onion);
      bit.position.set(-0.025 + hash(i) * 0.02, 0.022, -0.02 + hash(i * 3) * 0.04);
      g.add(bit);
    }
    const steamMat = new THREE.MeshBasicMaterial({ color: "#f4efe6", transparent: true, opacity: 0.5, depthWrite: false });
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push(v3(Math.sin(i * 0.7 + k * 2) * 0.012, i * 0.009, 0));
      const wisp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.004, 5), steamMat.clone());
      wisp.position.set((k - 1) * 0.028, 0.03, 0);
      g.add(wisp);
      steam.push(wisp);
    }
    g.scale.setScalar(1.25);
    bowlItem.add(g);
  }
  bowlItem.position.set(0.11, -0.03, 0.08);
  bowlItem.rotation.set(0.45, 0, 0);
  puffs.add(bowlItem);
  // 4. A girl: the girlfriend he wants. Shoulder-length hair, a sundress,
  // waving at him; a little heart pops up beside her.
  const girlItem = new THREE.Group();
  const girl = {};
  {
    const g = new THREE.Group();
    const skin = w.ink({ tint: "#f3cfb0", tone: 0.95, rim: 0.3 });
    const hairMat = w.ink({ tint: "#4a2f24", tone: 0.8, rim: 0.5 });
    hairMat.side = THREE.DoubleSide;
    const dressMat = w.ink({ tint: "#f2b8c6", tone: 0.92, rim: 0.4 });
    const shoe = w.ink({ tint: "#8a3b3b", tone: 0.85, rim: 0.3 });
    const blushMat = new THREE.MeshBasicMaterial({ color: "#f08a8a", transparent: true, opacity: 0.55, depthWrite: false });
    const part = (geo, mat, x, y, z, line = true, parent = g) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      parent.add(m);
      if (line) outline(m, bubbleLine);
      return m;
    };
    // Legs and shoes.
    for (const sx of [-1, 1]) {
      part(new THREE.CapsuleGeometry(0.007, 0.034, 4, 8), skin, sx * 0.011, 0.028, 0);
      const foot = part(new THREE.SphereGeometry(0.009, 12, 8), shoe, sx * 0.012, 0.007, 0.004);
      foot.scale.set(1, 0.7, 1.4);
    }
    // The dress: a soft bell from the shoulders to the knee.
    const bell = new THREE.LatheGeometry([v3(0.001, 0.13, 0), v3(0.017, 0.128, 0), v3(0.02, 0.11, 0), v3(0.026, 0.08, 0), v3(0.036, 0.05, 0), v3(0.038, 0.044, 0), v3(0.001, 0.044, 0)], 24);
    const dress = part(bell, dressMat, 0, 0, 0);
    dress.scale.z = 0.75;
    // Arms: one down at her side, one up and waving (a pivot at the shoulder).
    const armGeo = new THREE.CapsuleGeometry(0.0055, 0.042, 4, 8);
    armGeo.translate(0, -0.026, 0);
    const lArm = new THREE.Group();
    lArm.position.set(0.021, 0.122, 0);
    lArm.rotation.z = 0.28;
    g.add(lArm);
    part(armGeo, skin, 0, 0, 0, true, lArm);
    part(new THREE.SphereGeometry(0.0075, 10, 8), skin, 0, -0.056, 0, true, lArm);
    const wave = new THREE.Group();
    wave.position.set(-0.021, 0.122, 0);
    g.add(wave);
    part(armGeo, skin, 0, 0, 0, true, wave);
    part(new THREE.SphereGeometry(0.0085, 10, 8), skin, 0, -0.057, 0, true, wave);
    girl.wave = wave;
    // Neck and head.
    part(new THREE.CylinderGeometry(0.006, 0.007, 0.014, 10), skin, 0, 0.136, 0, false);
    const HEAD_Y = 0.162;
    const head = part(new THREE.SphereGeometry(0.027, 24, 18), skin, 0, HEAD_Y, 0);
    head.scale.set(1, 1.04, 0.95);
    // Hair: a cap over the crown, a bob falling to her shoulders round the
    // back and sides (open at the face), and a fringe.
    const cap = part(new THREE.SphereGeometry(0.03, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, 0, HEAD_Y + 0.002, -0.002);
    cap.scale.set(1, 1.02, 1);
    part(new THREE.CylinderGeometry(0.03, 0.037, 0.05, 28, 1, true, 0.95, Math.PI * 2 - 1.9), hairMat, 0, HEAD_Y - 0.018, -0.002);
    const fringe = part(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat, 0, HEAD_Y + 0.012, 0.012);
    fringe.scale.set(0.026, 0.014, 0.02);
    fringe.rotation.x = 0.35;
    // Face: two dark eyes, pink cheeks, a small smile.
    for (const sx of [-1, 1]) {
      part(new THREE.SphereGeometry(0.0038, 10, 8), w.flat, sx * 0.0095, HEAD_Y + 0.001, 0.025, false);
      const blush = part(new THREE.CircleGeometry(0.0055, 14), blushMat, sx * 0.016, HEAD_Y - 0.008, 0.0235, false);
      blush.rotation.y = sx * 0.5;
    }
    const smile = part(new THREE.TorusGeometry(0.0065, 0.0013, 6, 16, Math.PI), w.flat, 0, HEAD_Y - 0.008, 0.0255, false);
    smile.rotation.z = Math.PI;
    // The heart, floating up by her waving hand.
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.012);
    heartShape.bezierCurveTo(-0.004, -0.007, -0.014, -0.002, -0.014, 0.005);
    heartShape.bezierCurveTo(-0.014, 0.012, -0.005, 0.014, 0, 0.007);
    heartShape.bezierCurveTo(0.005, 0.014, 0.014, 0.012, 0.014, 0.005);
    heartShape.bezierCurveTo(0.014, -0.002, 0.004, -0.007, 0, -0.012);
    const heart = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 8 }), w.ink({ tint: "#e2364e", tone: 0.95, rim: 0.4 }));
    heart.position.set(-0.068, 0.19, 0.01);
    g.add(heart);
    outline(heart, bubbleLine);
    girl.heart = heart;
    g.position.y = -0.105;
    g.scale.setScalar(1.15);
    girlItem.add(g);
  }
  girlItem.position.set(0.33, 0.0, 0.08);
  puffs.add(girlItem);

  const ITEMS = [
    [toastItem, 8.4],
    [bedItem, 9.25],
    [bowlItem, 10.1],
    [girlItem, 11.0],
  ];

  // ── Denji ────────────────────────────────────────────────────────────────
  // The same white shirt, black tie and dark slacks as every other scene,
  // barefoot on the futon. The face and the hair are the film model's.
  const SHIRT = { ...OUTFITS.denji, shoes: OUTFITS.denji.skin, panel: null, trim: null };
  const DRESSED = { ...DRESS.denji, sneakers: false };
  const cast = { denji: null };
  const ready = createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 1.15, rim: 0.4, spec: 0.4 }, outfit: SHIRT, dress: DRESSED }).then((denji) => {
    if (disposed) return;
    coverShoulders(denji, SHIRT.top);
    denji.ik = createArmIK(denji);
    // The slice in his left hand: bottom crust in the curled fingers, thumb on
    // its face (placement measured against the hand mesh: no finger inside it).
    denji.hold(slice.group, { hand: "left", grip: "grip", radius: SLICE_GRIP.radius, rotation: SLICE_GRIP.rotation });
    denji.apply({ ...CROSS });
    denji.root.updateMatrixWorld(true);
    const hips = denji.bones.hips.getWorldPosition(new THREE.Vector3());
    denji.root.position.set(DX - hips.x, SIT - hips.y, DZ - hips.z);
    denji.root.updateMatrixWorld(true);
    scene.add(denji.root);
    w.register(denji.root);
    cast.denji = denji;
    applyLight();
    // A lower key on him than on the set, so the tee never matches his skin.
    denji.root.traverse((o) => o.material?.uniforms?.uKey && o.material.uniforms.uKey.value.multiplyScalar(0.88));
    w.sync();
    stage.invalidate();
  });

  /** The room's light, and a night sky behind everything. */
  const applyLight = () => {
    w.palette(ROOM);
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.multiplyScalar(0.86);
      m.uniforms.uFogRange.value.set(9, 36);
    });
    w.light(...BULB_DIR);
    w.page({ mode: "still" });
    w.bu.uInk.value.set("#05070f");
    w.bu.uPaper.value.set("#22305a");
    w.bu.uRed.value.set("#000000");
  };
  applyLight();
  w.sync();

  // ── Per-frame helpers ────────────────────────────────────────────────────
  const tq = new THREE.Quaternion();
  const dq = new THREE.Quaternion();
  const off = new THREE.Vector3();
  /** A point on his face, in the head's frame (x left, y up, z forward). */
  const facePoint = (f, pose, x, y, z, out) => {
    dq.copy(qEuler(pose.hips, tq));
    for (const j of ["spine", "chest", "neck", "head"]) dq.multiply(qEuler(pose[j], tq));
    dq.premultiply(f.root.quaternion);
    return f.bones.head.getWorldPosition(out).add(off.set(x, y, z).applyQuaternion(dq));
  };
  const pupPoint = (x, y, z, out) => pochita.pup.localToWorld(out.set(x, y, z));
  const P = {};
  const pt = (name) => (P[name] ??= new THREE.Vector3());
  const D0 = v3(DX, 0, DZ);
  // Left-hand keys are where the middle of the slice goes; the IK aims the
  // wrist so the held bread lands there. Right-hand keys are the wrist at
  // rest and while petting, the torn piece's centre while he has it.
  const L_HOLD = D0.clone().add(v3(0.26, 0.64, 0.3));
  const L_LAP = D0.clone().add(v3(0.2, 0.34, 0.27));
  const HINT = { l: v3(0.7, -0.7, -0.1).normalize(), r: v3(-0.7, -0.7, -0.1).normalize() };
  const SLICE_MID = v3(0, 0.115, 0.0025);
  const SLICE_TOP = v3(0, 0.4, 0.0025);
  const SLICE_CORNER = v3(-0.19, 0.4, 0.0025); // just past the dome's edge
  const MOUTH_IN = v3(0, 0.68, 0.98); // just inside Pochita's mouth, pup space
  // Wrist minus the point each hand steers by, re-measured every frame.
  const corr = { l: new THREE.Vector3(), r: new THREE.Vector3() };
  const wrist = new THREE.Vector3();
  const lead = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const releasedAt = new THREE.Vector3();
  // The slice's far corner where his left hand last put it (mid-frame the arms
  // are briefly at rest while the IK runs).
  const cornerAt = new THREE.Vector3();
  let pieceIn = "none"; // "hand" | "mouth" | "none"

  /** The torn piece: pinched in his right hand, let go at Pochita's mouth, eaten. */
  const syncPiece = (denji, c, pinch) => {
    if (c >= 4.4 && c < 5.95) {
      if (pieceIn !== "hand") {
        if (pieceIn === "mouth") piece.removeFromParent();
        piece.scale.setScalar(1);
        denji.hold(piece, { hand: "right", ...PIECE_GRIP, weight: PIECE_GRIP.weight * pinch }); // the fingers keep closing per frame
        pieceIn = "hand";
      }
    } else if (c >= 5.95 && c < 6.06) {
      if (pieceIn !== "mouth") {
        if (pieceIn === "hand") {
          denji.release("right", { to: pochita.pup, keepPose: true });
        } else {
          piece.scale.setScalar(1 / POCHITA_SCALE);
          piece.position.set(0, 0.69, 1.3);
          pochita.pup.add(piece);
        }
        releasedAt.copy(piece.position);
        pieceIn = "mouth";
      }
      piece.position.lerpVectors(releasedAt, MOUTH_IN, easeInCubic(segment(c, 5.95, 6.05)));
    } else if (pieceIn !== "none") {
      if (pieceIn === "hand") denji.release("right", { keepPose: true });
      else piece.removeFromParent();
      pieceIn = "none";
    }
    piece.visible = c >= 5.2 && c < 6.06;
  };

  /** Re-measure each hand's wrist against the point it steers by. */
  const measure = (denji, lw) => {
    const { l, r } = denji.ik.arms;
    slice.group.localToWorld(lead.copy(SLICE_MID).lerp(SLICE_TOP, lw));
    corr.l.subVectors(l.hand.getWorldPosition(wrist), lead);
    if (pieceIn === "hand") corr.r.subVectors(r.hand.getWorldPosition(wrist), piece.getWorldPosition(lead));
    slice.group.localToWorld(cornerAt.copy(SLICE_CORNER));
  };

  const updateDenji = (c, time) => {
    const denji = cast.denji;
    // The slice in his hand: the corner gone once torn, a bite gone after 7.15.
    slice.top.visible = c < 5.2;
    slice.group.scale.set(0.24, c > 7.15 ? 0.2 : 0.24, 0.24);
    slice.group.position.copy(SLICE_GRIP.point).multiply(slice.group.scale).applyQuaternion(slice.group.quaternion).negate();

    // Upper body: over Pochita, a bite, then up at the bubble while he talks.
    let pose = schedule(c, DOWN, [
      [5.4, 5.9, FEED],
      [6.35, 6.85, DOWN],
      [6.85, 7.1, BITE],
      [7.35, 8.0, DREAM],
      [13.0, 14.0, DOWN],
    ]);
    const talking = segment(c, 7.9, 8.2) * (1 - segment(c, 12.4, 12.8));
    pose.head = [pose.head[0] + Math.sin(time * 7) * 0.025 * talking, pose.head[1] + Math.sin(time * 1.3) * 0.04 * talking, pose.head[2]];
    pose.spine = [pose.spine[0] + Math.sin(time * 1.6) * 0.012, pose.spine[1], pose.spine[2]];
    pose = { ...pose, ...CROSS };
    denji.apply(pose);
    denji.root.updateMatrixWorld(true);

    // Left hand: the slice held up; its top to his mouth for a bite; then in his lap.
    const lMouth = () => facePoint(denji, pose, 0, -0.05, 0.19, pt("lMouth"));
    const lTarget = track(c, [
      [0, L_HOLD],
      [6.7, L_HOLD],
      [7.0, lMouth],
      [7.3, lMouth],
      [7.7, L_LAP],
      [13.6, L_LAP],
      [14.4, L_HOLD],
    ], pt("l"));
    const lw = easeInOutCubic(segment(c, 6.7, 7.0)) * (1 - easeInOutCubic(segment(c, 7.3, 7.7)));
    // Right hand: pinches the slice's far corner, tears it off, holds it to
    // Pochita's mouth and lets go; then strokes him.
    const corner = () => cornerAt;
    const pulled = () => pt("pulled").copy(cornerAt).add(off.set(-0.1, 0.1, 0.03));
    const feed = () => pupPoint(0, 0.69, 1.3, pt("feed"));
    // Right-hand waypoints, measured clear of Pochita's head, D-handle and
    // blade: resting by his own knee, up over the handle to the slice, round
    // the outside of Pochita's head to his mouth and back, then a stroke along
    // the side of his head (the wrist rides high so the fingers lie on him).
    const rest = () => pt("rest").set(DX - 0.32, 0.3, DZ + 0.05);
    const lift = () => pt("lift").copy(cornerAt).add(off.set(-0.2, 0.04, 0.04));
    const around = () => pupPoint(-1.0, 0.9, 1.6, pt("around"));
    const clear = () => pupPoint(-0.9, 0.95, 1.65, pt("clear"));
    const back = () => pupPoint(-1.7, 1.4, 0.8, pt("back"));
    const over = () => pupPoint(-1.7, 2.1, -0.3, pt("over"));
    const stroke = (Math.sin(time * 2.1) + 1) / 2;
    const pet = () => pupPoint(-1.15, 1.82, lerp(0.25, -0.05, stroke), pt("pet"));
    const rTarget = track(c, [
      [0, rest],
      [4.4, rest],
      [4.62, lift],
      [4.85, corner],
      [5.1, corner],
      [5.35, pulled],
      [5.5, pulled],
      [5.72, around],
      [5.95, feed],
      [6.2, clear],
      [6.6, clear],
      [7.0, back],
      [7.6, over],
      [8.2, pet],
      [12.8, pet],
      [13.25, over],
      [13.8, rest],
    ], pt("r"));
    const rw = easeInOutCubic(segment(c, 4.4, 4.85)) * (1 - easeInOutCubic(segment(c, 6.6, 7.3)));
    // Fingers: the pinch closes as he reaches, opens after letting go; a
    // flatter hand to stroke Pochita.
    const pinch = segment(c, 4.4, 4.85) * (1 - segment(c, 5.95, 6.3));
    if (pinch > 0) denji.setHand("right", PIECE_GRIP.grip, PIECE_GRIP.weight * pinch);
    else denji.setHand("right", "open", 0.55 * segment(c, 7.6, 8.2) * (1 - segment(c, 12.8, 13.4)));

    // Two passes: aim, re-measure where the held thing landed, aim again.
    for (let pass = 0; pass < 2; pass++) {
      denji.ik.solve(pose, "l", aim.copy(lTarget).add(corr.l), HINT.l);
      denji.ik.solve(pose, "r", aim.copy(rTarget).addScaledVector(corr.r, rw), HINT.r);
      denji.apply(pose);
      denji.root.updateMatrixWorld(true);
      measure(denji, lw);
    }
    // Pick up or let go only once the hand is where this frame puts it.
    syncPiece(denji, c, pinch);
  };

  const updatePochita = (c, time) => {
    const { pup, body, eyes, tail } = pochita;
    // Turns to the bread, chomps; then looks up while Denji talks.
    const toBread = easeInOutCubic(segment(c, 5.5, 5.95)) * (1 - easeInOutCubic(segment(c, 6.6, 7.1)));
    const lookUp = easeInOutCubic(segment(c, 7.8, 8.4)) * (1 - easeInOutCubic(segment(c, 13.0, 13.8)));
    pup.rotation.set(-0.12 * toBread - 0.2 * lookUp, -0.15 - 0.7 * toBread + 0.15 * lookUp, 0);
    const chomp = Math.max(pulse(c, 6.05, 0.06), pulse(c, 6.25, 0.06), pulse(c, 6.45, 0.06));
    const open = Math.max(chomp, 0.6 * segment(c, 5.7, 5.95) * (1 - segment(c, 6.0, 6.05)));
    pochita.setMouth(open * 0.8);
    // Breathing, and a happy wriggle while he is stroked.
    const petted = segment(c, 8.2, 8.6) * (1 - segment(c, 12.6, 13.0));
    const breathe = Math.sin(time * 2.4) * 0.015 + Math.sin(time * 4.2) * 0.012 * petted;
    body.scale.set(1 + breathe, 1 - breathe * 0.6, 1);
    // Blink.
    const blink = Math.max(pulse(c, 2.2, 0.05), pulse(c, 7.6, 0.05), pulse(c, 10.0, 0.05), pulse(c, 13.9, 0.05));
    eyes.forEach((e) => e.scale.set(1, 1 - 0.9 * blink, 1));
    // The tail: a lazy sway, a real wag once the dream comes.
    const wag = 0.15 + 0.85 * (segment(c, 6.1, 6.4) * (1 - segment(c, 6.9, 7.3)) * 0.6 + segment(c, 8.2, 8.6) * (1 - segment(c, 13.2, 13.8)));
    tail.rotation.set(0.1 * wag, lerp(Math.sin(time * 3), Math.sin(time * 13), segment(wag, 0.3, 0.8)) * 0.55 * wag, 0);
    pochitaRoot.updateMatrixWorld(true);
  };

  const updateBubble = (c, time) => {
    const out = 1 - easeInCubic(segment(c, 14.7, 15.3));
    const dotsIn = trail.map((_, i) => easeOutBack(segment(c, 7.45 + (2 - i) * 0.12, 7.8 + (2 - i) * 0.12)) * out);
    const grow = easeOutBack(segment(c, 7.8, 8.3)) * out;
    bubble.visible = grow > 0.01 || dotsIn[2] > 0.01;
    if (!bubble.visible) return;
    bubble.quaternion.copy(camera.quaternion);
    trail.forEach((d, i) => d.scale.set(Math.max(0.001, dotsIn[i]), Math.max(0.001, dotsIn[i]), Math.max(0.001, dotsIn[i] * 0.5)));
    puffs.scale.setScalar(Math.max(0.001, grow));
    puffs.position.y = Math.sin(time * 1.5) * 0.012;
    ITEMS.forEach(([item, at], i) => {
      const k = easeOutBack(segment(c, at, at + 0.45));
      item.visible = k > 0.01;
      item.scale.setScalar(Math.max(0.001, k));
      item.position.y = [0, -0.02, -0.03, 0][i] + Math.sin(time * 1.8 + i * 2) * 0.008;
    });
    toastItem.rotation.z = 0.12 + Math.sin(time * 1.4) * 0.05;
    // She waves; the heart pops up after her and bobs.
    girl.wave.rotation.z = -2.45 + Math.sin(time * 7) * 0.3;
    const love = easeOutBack(segment(c, 11.4, 11.8));
    girl.heart.scale.setScalar(Math.max(0.001, love));
    girl.heart.position.y = 0.19 + Math.sin(time * 2.6) * 0.006;
    steam.forEach((s, k) => {
      const ph = (time * 0.6 + k * 0.33) % 1;
      s.position.y = 0.03 + ph * 0.02;
      s.material.opacity = 0.5 * Math.sin(Math.PI * ph);
    });
  };

  // ── Camera ───────────────────────────────────────────────────────────────
  const PATH_IN = new THREE.CatmullRomCurve3([v3(3.0, 1.9, 9.6), v3(1.6, 1.5, 5.6), v3(0.5, 1.24, 2.8), v3(0.26, 1.16, 1.7), v3(0.28, 1.05, 1.3)]);
  const PATH_OUT = new THREE.CatmullRomCurve3([v3(0.34, 1.06, 1.42), v3(0.3, 1.17, 1.85), v3(0.4, 1.5, 3.6), v3(0.7, 2.1, 7.4)]);
  const LOOK_EXT = v3(0.1, 1.15, -0.4);
  const LOOK_FEED = v3(-0.05, 0.55, -0.9);
  const LOOK_DREAM = v3(0.33, 1.02, -0.95);
  // The last frame: stars over the top two-thirds, the roofline and the lit
  // window along the bottom.
  const LOOK_SKY = v3(0.15, 5.6, -26);
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const shoot = (c) => {
    if (c < 4.8) {
      PATH_IN.getPointAt(easeInOutCubic(segment(c, 0, 4.8)), camPos);
      camLook.lerpVectors(LOOK_EXT, LOOK_FEED, easeInOutCubic(segment(c, 2.6, 4.8)));
    } else if (c < 12.9) {
      // Inside: creep in on the feeding, then rise for the bubble.
      tmpA.lerpVectors(v3(0.28, 1.05, 1.3), v3(0.24, 1.02, 1.18), easeInOutCubic(segment(c, 4.8, 7.4)));
      // Back and wider for the bubble: his face, Pochita and the whole dream in frame.
      tmpB.lerpVectors(tmpA, v3(0.36, 1.04, 1.5), easeInOutCubic(segment(c, 7.3, 8.6)));
      camPos.lerpVectors(tmpB, v3(0.34, 1.06, 1.42), easeInOutCubic(segment(c, 8.6, 12.9)));
      camLook.lerpVectors(LOOK_FEED, LOOK_DREAM, easeInOutCubic(segment(c, 7.3, 8.6)));
    } else {
      PATH_OUT.getPointAt(easeInOutCubic(segment(c, 12.9, 15.6)), camPos);
      camLook.lerpVectors(LOOK_DREAM, LOOK_SKY, easeInOutCubic(segment(c, 13.8, 15.6)));
    }
  };

  const BASE_FOV = camera.fov;
  let fitFov = BASE_FOV;
  let zoom = 1;
  const applyFov = () => {
    const fov = fitFov * zoom;
    if (Math.abs(camera.fov - fov) < 1e-4) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames widen the lens rather than back through a wall.
    fitFov = BASE_FOV * Math.max(1, (1.1 / aspect) ** 0.6);
    applyFov();
    w.sync();
  });

  const SKY_LOW = new THREE.Color("#05070f");
  const SKY_LOW_END = new THREE.Color("#1c2c62");
  const SKY_HIGH = new THREE.Color("#22305a");
  const SKY_HIGH_END = new THREE.Color("#8299e0");
  // The moonlit tin, dimmed in the last shot so the shack reads as a silhouette.
  const outKeys = outs.map((m) => m.uniforms.uKey.value.clone());

  // ── The frame ────────────────────────────────────────────────────────────
  const update = (time) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const t = staticMode ? STATIC_TIME : time;

    // Dip to black across the loop point.
    const fade = staticMode ? 1 : Math.min(segment(c, 0, 0.6), 1 - segment(c, CYCLE - 0.6, CYCLE));
    // The last shot is mostly sky: a moonlit glow just above the roofline, the
    // tin darker than the sky behind it, the stars bigger and brighter.
    const sky = easeInOutCubic(segment(c, 13.6, 15.2));
    renderer.toneMappingExposure = baseExposure * lerp(0.86, 1.15, sky) * (0.02 + 0.98 * fade);
    w.bu.uInk.value.lerpColors(SKY_LOW, SKY_LOW_END, sky);
    w.bu.uPaper.value.lerpColors(SKY_HIGH, SKY_HIGH_END, sky);
    w.bu.uFocus.value.set(0.5, lerp(0.5, 0.34, sky));
    outs.forEach((m, i) => m.uniforms.uKey.value.copy(outKeys[i]).multiplyScalar(1 - 0.4 * sky));
    starFields.forEach((m, k) => (m.size = STAR_SIZE[k] * (1 + 0.45 * sky)));

    shoot(c);
    // The bubble beat widens the lens a touch (the front wall stops the dolly).
    zoom = 1 + 0.15 * easeInOutCubic(segment(c, 7.3, 8.6)) * (1 - easeInOutCubic(segment(c, 12.9, 14.0)));
    applyFov();
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.02;
    camera.position.y += pointer.y * 0.015;
    camera.lookAt(camLook);

    // The bulb sways a hair on its flex; the stars twinkle.
    bulbRig.rotation.z = Math.sin(t * 0.7) * 0.03;
    bulbRig.rotation.x = Math.sin(t * 0.53 + 1) * 0.02;
    starFields[0].opacity = Math.min(1, (0.75 + Math.sin(t * 1.3) * 0.2) * (1 + 0.3 * sky));
    starFields[1].opacity = Math.min(1, (0.7 + Math.sin(t * 1.9 + 2) * 0.25) * (1 + 0.3 * sky));

    updatePochita(c, t);
    updateBubble(c, t);
    if (cast.denji) updateDenji(c, t);
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      renderer.toneMappingExposure = baseExposure;
    },
  };
};
