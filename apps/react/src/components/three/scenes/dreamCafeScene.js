import * as THREE from "three";
import { createCuts, createInkWorld } from "../rezeKit";
import { createModelFigure } from "../modelFigure";
import { canvasTexture, easeInOutCubic, easeOutBack, easeOutCubic, hash, hdr, lightBeam, segment, smoothstep } from "../kit";
import { outline } from "../ink";
import { createDaisyVase } from "../props";

/**
 * Dream Café — two developers at a corner table, late afternoon, working out
 * what they could build now that a crew of agents will build it with them.
 * The backdrop for "What is your dream?":
 *
 *   0   – 6    coffee and lids up: he sips his latte, she opens her laptop,
 *              he opens his, and they both start typing
 *   6   – 15   what could we build? Ideas float up off the table as ink
 *              cards (APP, a phone wireframe, PLATFORM, a dashboard, TOOL,
 *              "?"); she sketches on a napkin, he points at his screen, she
 *              takes a sip
 *   15  – 23   over his shoulder: the agent at work. Code scrolls on the
 *              left, a UI assembles itself on the right, two agent cursors
 *              placing each block; he sits back and watches it go
 *   23  – 29   the aha: the cards fold into the "?", it turns into a bulb and
 *              lights up; a fist bump across the table, then both lean in
 *   29  – 36   the dream: the bulb drifts to the window and draws itself
 *              there as a little shop with its own app, the window light
 *              swells, and they look up at it. Dip to black, loop
 *
 * Ordinary people, no one from the show: a hoodie, a sweater, jeans. Bodies
 * are Quaternius's CC0 rigs posed by a two-bone arm IK (as in breakfast), so
 * hands land on the keys, the lid, the cup and each other. Every glowing
 * thing (screens, cards, the drawing) is a shader or a canvas texture made
 * here: nothing to load but the bodies. Reduced motion holds t = 31.5: the
 * dream in the window, both of them looking up at it.
 */

const LOOP = 36;
const STATIC_TIME = 31.5;
const UP = new THREE.Vector3(0, 1, 0);

// Late afternoon in a small café: amber air, a cool lilac shade so a white
// cup still reads white in shadow.
const CAFE = { ground: "#22140d", lines: "#ffd9a8", accent: "#ff9a52", rim: "#ffc690", shade: "#a6a0c2" };
const EXPOSURE = 0.72;
// The key: high and in front of them, cheated toward the camera so faces read;
// the window behind gives the rim.
const KEY = [-0.35, 0.75, 0.55];

// The room: back (window) wall at z = WALL_Z, the table in the middle.
const WALL_Z = -2.4;
const TOP = 0.74;
const TABLE = { w: 1.0, d: 0.74 };
const SEAT_TOP = 0.47;
// He sits on the left (-x) facing +x, she on the right facing -x. His right
// hand and her left are on the camera's side (+z); she sketches left-handed.
const SEATS = { him: { x: -0.76, yaw: Math.PI / 2 }, her: { x: 0.76, yaw: -Math.PI / 2 } };
const LAPTOPS = { him: { x: -0.27, z: -0.06 }, her: { x: 0.27, z: -0.06 } };
// His by his left (far) hand, hers by her right.
const CUPS = { him: [-0.42, -0.27], her: [0.45, -0.28] };
const NAPKIN = [0.2, 0.2];
const LID_OPEN = 1.85;

// Seated, thighs on the chair and soles on the floor (as in margrave's booth).
const LEGS = { lHip: [-1.45, 0, 0.1], rHip: [-1.45, 0, -0.1], lKnee: [1.45, 0, 0], rKnee: [1.45, 0, 0] };

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * The bodies' feet (and the shoes built round them) are cartoon-big. Each
 * foot bone is scaled down — width, length (toward the toes), height — and
 * the foot set back down so the sole still rests on the floor.
 */
const FEET = { him: [0.8, 0.8, 0.85], her: [0.8, 0.76, 0.88] };
const bodyOf = (f) => {
  let body = null;
  f.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  return body;
};
/** World positions of the body's vertices that ride one foot ("l" or "r"), as posed now. */
const footPoints = (f, s) => {
  const body = bodyOf(f);
  const bones = new Set(body.skeleton.bones.flatMap((b, i) => (new RegExp(`^(foot|ball)(_leaf)?_${s}$`, "i").test(b.name) ? [i] : [])));
  f.root.updateMatrixWorld(true);
  body.skeleton.update();
  const si = body.geometry.attributes.skinIndex;
  const sw = body.geometry.attributes.skinWeight;
  const out = [];
  for (let i = 0; i < si.count; i++) {
    let wf = 0;
    for (let k = 0; k < 4; k++) if (bones.has(si.getComponent(i, k))) wf += sw.getComponent(i, k);
    if (wf > 0.5) out.push(body.localToWorld(body.getVertexPosition(i, new THREE.Vector3())));
  }
  return out;
};
const fitFeet = (f, [sx, sy, sz], shoeColor) => {
  // Where the foot itself shows through the shoe's toe, it is the shoe.
  const body = bodyOf(f);
  const feet = new Set(body?.skeleton.bones.flatMap((b, i) => (/^(foot|ball)/i.test(b.name) ? [i] : [])));
  const col = body?.geometry.attributes.color;
  if (col && feet.size) {
    const shoe = new THREE.Color(shoeColor);
    const si = body.geometry.attributes.skinIndex;
    const sw = body.geometry.attributes.skinWeight;
    const pos = body.geometry.attributes.position;
    body.geometry.computeBoundingBox();
    const { min, max } = body.geometry.boundingBox;
    for (let i = 0; i < col.count; i++) {
      // Only below the shoe's collar: the ankle above it keeps the trousers.
      if ((pos.getY(i) - min.y) / (max.y - min.y) > 0.035) continue;
      let wFoot = 0;
      for (let k = 0; k < 4; k++) if (feet.has(si.getComponent(i, k))) wFoot += sw.getComponent(i, k);
      if (wFoot > 0.5) col.setXYZ(i, shoe.r, shoe.g, shoe.b);
    }
    col.needsUpdate = true;
  }
  const box = new THREE.Box3();
  const lowest = (o) => {
    f.root.updateMatrixWorld(true);
    return box.setFromObject(o, true).min.y;
  };
  for (const s of ["l", "r"]) {
    const foot = f.model.getObjectByName(`foot_${s}`);
    if (!foot) continue;
    // The built shoe if it has one, else the bare (painted) foot.
    const shoe = foot.children.find((m) => m.isMesh);
    const low = () => (shoe ? lowest(shoe) : Math.min(...footPoints(f, s).map((p) => p.y)));
    const before = low();
    foot.scale.set(sx, sy, sz);
    const drop = before - low();
    // A world drop into the parent's frame.
    const down = foot.parent.worldToLocal(foot.getWorldPosition(new THREE.Vector3()).add(v3(0, drop, 0)));
    foot.position.copy(down);
  }
  f.root.updateMatrixWorld(true);
};
/** Up, hold, down: an envelope in [0, 1]. */
const envelope = (c, a, b, d, e) => easeInOutCubic(segment(c, a, b)) * (1 - easeInOutCubic(segment(c, d, e)));

/**
 * The two sips. While a hand is on its cup the wrist is turned so the cup
 * stays upright (rim level) all the way up and down; only at the lips does it
 * tip, a little, toward the mouth. `turn`: the wrist turning in to the cup
 * before the grab and back after the release. `tip`: up, hold, down.
 * `grip`: the point of the cup in the hand (cup units). He drinks with his far
 * (left) hand by the handle, so the cup faces the camera, not his forearm; she
 * holds hers low round the body. `lips`: the cup's middle below the mouth point.
 */
const DRINKS = {
  him: { hand: "l", handle: true, grip: [0.066, -0.004, 0], radius: 0.009, lips: -0.003, turn: [0.15, 0.6, 3.5, 3.9], tip: [1.5, 1.85, 2.35, 2.75] },
  her: { hand: "r", handle: false, grip: [0, -0.015, 0], radius: 0.04, lips: -0.015, turn: [12.35, 12.8, 15.25, 15.7], tip: [13.55, 13.9, 14.1, 14.5] },
};
const SIP_TILT = 0.38;
/**
 * A man's derby, built round a foot as it is posed (the legs never move): a
 * sole that follows the shoe's outline a few millimetres proud, an upper
 * lofted from heel to toe — a rounded heel counter, the collar, the instep
 * rising under the laces, a toe that tapers and drops — and the facings,
 * tongue and laces on top. Sized to enclose the foot's own vertices.
 */
const SHOE = { sole: 0.011, margin: 0.007, collar: 0.068, instep: 0.072, toe: 0.026 };
const buildShoe = (f, s, mats) => {
  const pts = footPoints(f, s);
  if (!pts.length) return null;
  const foot = f.model.getObjectByName(`foot_${s}`);
  const tip = f.model.getObjectByName(`ball_leaf_${s}`) ?? f.model.getObjectByName(`ball_${s}`);
  const fwd = tip.getWorldPosition(new THREE.Vector3()).sub(foot.getWorldPosition(new THREE.Vector3())).setY(0).normalize();
  const side = new THREE.Vector3().crossVectors(UP, fwd); // +x of the shoe
  let a0 = Infinity;
  let a1 = -Infinity;
  let c0 = Infinity;
  let c1 = -Infinity;
  let y0 = Infinity;
  for (const p of pts) {
    const a = p.dot(fwd);
    const c = p.dot(side);
    a0 = Math.min(a0, a);
    a1 = Math.max(a1, a);
    c0 = Math.min(c0, c);
    c1 = Math.max(c1, c);
    y0 = Math.min(y0, p.y);
  }
  const floor = Math.max(0.001, y0 - 0.004);
  const heel = a0 - 0.012;
  // Room past the toes for the toe to taper in.
  const L = a1 + 0.036 - heel;
  const mid = (c0 + c1) / 2;
  // What the upper must cover, per station heel to toe: the foot's half-width and height (below the collar).
  const M = 28;
  const need = Array.from({ length: M + 1 }, () => ({ w: 0, h: 0 }));
  for (const p of pts) {
    const y = p.y - floor - SHOE.sole;
    if (y > SHOE.collar) continue;
    const k = Math.round(THREE.MathUtils.clamp((p.dot(fwd) - heel) / L, 0, 1) * M);
    for (const j of [k - 1, k, k + 1]) {
      if (j < 0 || j > M) continue;
      need[j].w = Math.max(need[j].w, Math.abs(p.dot(side) - mid) + SHOE.margin);
      need[j].h = Math.max(need[j].h, y + SHOE.margin);
    }
  }
  // Smoothed, so the upper is one clean line rather than every bump of the foot.
  for (let pass = 0; pass < 4; pass++) {
    const prev = need.map((n) => ({ ...n }));
    for (let j = 1; j < M; j++)
      for (const key of ["w", "h"]) need[j][key] = Math.max(need[j][key] * 0.6, prev[j - 1][key] * 0.25 + prev[j][key] * 0.5 + prev[j + 1][key] * 0.25);
  }
  const W = Math.max(...need.map((n) => n.w));
  // Plan view: a rounded heel, widest at the ball, tapering to a narrow round toe.
  const shape = (t) => {
    const body = t < 0.66 ? 0.8 + 0.2 * smoothstep(t / 0.66) : 1 - 0.42 * ((t - 0.66) / 0.34) ** 2;
    const heelCap = Math.sqrt(1 - (1 - Math.min(1, t / 0.09)) ** 2);
    const toeCap = Math.sqrt(Math.max(0, 1 - Math.max(0, (t - 0.86) / 0.14) ** 2));
    return body * heelCap * toeCap;
  };
  // Side view: the heel counter and collar, the instep under the laces, the toe.
  const rise = (t) => {
    if (t < 0.3) return SHOE.collar - 0.006 * smoothstep(t / 0.3);
    if (t < 0.5) return THREE.MathUtils.lerp(SHOE.collar - 0.006, SHOE.instep, smoothstep((t - 0.3) / 0.2));
    return THREE.MathUtils.lerp(SHOE.instep, SHOE.toe, smoothstep((t - 0.5) / 0.5));
  };
  const halfW = (j) => Math.max(W * shape(j / M), Math.min(need[j].w, W) * Math.min(1, shape(j / M) * 1.15));
  const height = (j) => Math.max(rise(j / M), need[j].h) * Math.min(1, 0.35 + shape(j / M));

  // The upper: rings of a squared-off arch, sole edge to sole edge.
  const N = 18;
  const pos = [];
  const idx = [];
  for (let j = 0; j <= M; j++) {
    const w = halfW(j);
    const h = height(j);
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI;
      const cx = Math.cos(th);
      const sy = Math.sin(th);
      pos.push(Math.sign(cx) * Math.abs(cx) ** 0.7 * w, Math.abs(sy) ** 0.55 * h, (j / M) * L);
    }
  }
  for (let j = 0; j < M; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      const b = a + N + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const upperGeo = new THREE.BufferGeometry();
  upperGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  upperGeo.setIndex(idx);
  upperGeo.computeVertexNormals();
  upperGeo.translate(0, SHOE.sole, 0);

  // The sole: the outline, 3 mm proud of the upper, a thin slab (a little thicker at the heel).
  const outline2 = new THREE.Shape();
  const ring = [];
  for (let j = 0; j <= M; j++) ring.push([halfW(j) + 0.003, (j / M) * L]);
  outline2.moveTo(0, -0.003);
  for (const [x, z] of ring) outline2.lineTo(x, z);
  outline2.lineTo(0, L + 0.003);
  for (const [x, z] of [...ring].reverse()) outline2.lineTo(-x, z);
  outline2.closePath();
  const soleGeo = new THREE.ExtrudeGeometry(outline2, { depth: SHOE.sole, bevelEnabled: false, curveSegments: 4 });
  soleGeo.rotateX(Math.PI / 2); // the outline's y runs heel to toe (+z), the depth runs down
  soleGeo.translate(0, SHOE.sole, 0);

  // On top: the tongue, the two facings either side of it, and four laces.
  const topAt = (t) => {
    const j = Math.round(t * M);
    return SHOE.sole + height(j);
  };
  const parts = [];
  const tongue = new THREE.BoxGeometry(0.026, 0.004, L * 0.24);
  tongue.rotateX(Math.atan2(topAt(0.38) - topAt(0.62), L * 0.24));
  tongue.translate(0, (topAt(0.38) + topAt(0.62)) / 2 + 0.002, L * 0.5);
  parts.push([tongue, mats.tongue]);
  for (let k = 0; k < 4; k++) {
    const t = 0.42 + k * 0.05;
    const bar = new THREE.BoxGeometry(0.034, 0.003, 0.004);
    bar.translate(0, topAt(t) + 0.004, t * L);
    parts.push([bar, mats.lace]);
  }
  for (const sx of [-1, 1]) {
    // The facing's edge: a stitched line down each side of the laces.
    const seam = new THREE.BoxGeometry(0.004, 0.003, L * 0.26);
    seam.rotateX(Math.atan2(topAt(0.37) - topAt(0.64), L * 0.26));
    seam.translate(sx * 0.021, (topAt(0.37) + topAt(0.64)) / 2 + 0.001, L * 0.505);
    parts.push([seam, mats.sole]);
  }

  const g = new THREE.Group();
  const add = (geo, mat, line) => {
    const m = new THREE.Mesh(geo, mat);
    g.add(m);
    if (line) outline(m, line);
    return m;
  };
  add(upperGeo, mats.upper, mats.line);
  add(soleGeo, mats.sole, mats.line);
  for (const [geo, mat] of parts) add(geo, mat, null);
  // Shoe frame: +x across, +y up, +z heel to toe; the heel's floor point at the origin.
  const origin = fwd.clone().multiplyScalar(heel).addScaledVector(side, mid).setY(floor);
  g.matrix.makeBasis(side, UP, fwd).setPosition(origin);
  g.matrix.decompose(g.position, g.quaternion, g.scale);
  return g;
};

/** Up, hold, down, smoothstepped: [a, b, d, e] -> [0, 1]. */
const ramp = (c, [a, b, d, e]) => smoothstep(segment(c, a, b)) * (1 - smoothstep(segment(c, d, e)));

/* ------------------------------------------------------------------------
 * Poses: torso and head only. Arms come from the IK, legs from LEGS, and the
 * gaze is added on top of whatever the torso is doing.
 * ---------------------------------------------------------------------- */

const ZERO = [0, 0, 0];
const TORSO = ["spine", "chest", "neck", "head"];
const P = (spine, chest = 0.03, yaw = 0) => ({ spine: [spine, yaw, 0], chest: [chest, yaw * 0.5, 0], neck: [0, 0, 0], head: [0, 0, 0] });
const POSES = {
  sit: P(0.12),
  type: P(0.22, 0.05),
  sip: P(0.06, 0.0),
  back: P(-0.06, -0.04),
  point: P(0.24, 0.06),
  sketch: P(0.34, 0.08),
  lean: P(0.34, 0.1),
  reach: P(0.3, 0.06),
  up: P(-0.02, -0.06),
};

/** Mix `b` into `out` by `k`, torso joints only, in place. */
const mixInto = (out, b, k) => {
  for (const j of TORSO) {
    const o = out[j];
    const y = b[j] ?? ZERO;
    o[0] += (y[0] - o[0]) * k;
    o[1] += (y[1] - o[1]) * k;
    o[2] += (y[2] - o[2]) * k;
  }
  return out;
};
/** Sequential torso blends: [from, to, pose], each easing in over the last. */
const schedule = (c, out, base, list) => {
  for (const j of TORSO) {
    const s = base[j] ?? ZERO;
    out[j][0] = s[0];
    out[j][1] = s[1];
    out[j][2] = s[2];
  }
  for (const [a, b, next] of list) if (c > a) mixInto(out, next, easeInOutCubic(segment(c, a, b)));
  return out;
};

/**
 * A keyframed world point: [[t, point | () => point, ease?], ...], eased
 * between keys (by the arriving key's `ease`, else easeInOutCubic).
 */
const track = (c, keys, out) => {
  let i = keys.length - 1;
  while (i > 0 && c < keys[i][0]) i--;
  const [t0, a] = keys[i];
  const [t1, b, ease = easeInOutCubic] = keys[Math.min(i + 1, keys.length - 1)];
  const k = t1 > t0 ? ease(segment(c, t0, t1)) : 0;
  return out.copy(typeof a === "function" ? a() : a).lerp(typeof b === "function" ? b() : b, k);
};

/* ------------------------------------------------------------------------
 * Two-bone arm IK (breakfast's), writing into the pose in place.
 * ---------------------------------------------------------------------- */

const scratchEuler = new THREE.Euler();
const qEuler = (r, out) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

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
    arms[s] = { sh, hand, l1: S.distanceTo(E), l2: E.distanceTo(H) };
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
    /** Put the `s` wrist on `target` (world); `hint` is where the elbow points, in the root's frame. */
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
      const sp = pose[`${s}Shoulder`];
      sp[0] = euler.x;
      sp[1] = euler.y;
      sp[2] = euler.z;
      pose[`${s}Elbow`][0] = e;
    },
  };
};

/**
 * The outfit painter leaves the trapezius band (just under the neck line) as
 * skin, which over a shoulder reads as a bare back. Paint it the top's colour,
 * outside the neck (margrave's fix).
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

/* ------------------------------------------------------------------------
 * Drawn things: the idea cards, the napkin sketch, the dream. Strokes are
 * drawn with their order in the red channel, so a shader can draw them on
 * one after another (`uReveal` 0 → 1).
 * ---------------------------------------------------------------------- */

const INK_HEX = "#2a1d17";
const ACCENT = "#e8693a";

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** A paper card with an ink border; `draw` puts the idea on it. */
const cardTexture = (draw) =>
  canvasTexture(512, 384, (ctx, W, H) => {
    ctx.fillStyle = "#f7ecd8";
    ctx.beginPath();
    roundRect(ctx, 10, 10, W - 20, H - 20, 34);
    ctx.fill();
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK_HEX;
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK_HEX;
    ctx.fillStyle = INK_HEX;
    draw(ctx, W, H);
  });

const label = (text, size = 112) => (ctx, W, H) => {
  ctx.font = `800 ${size}px "Space Grotesk", "Avenir Next", "Helvetica Neue", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H * 0.53);
};

const CARD_ART = {
  app: label("APP", 150),
  platform: label("PLATFORM", 88),
  tool: label("TOOL", 140),
  phone: (ctx, W, H) => {
    ctx.lineWidth = 12;
    ctx.beginPath();
    roundRect(ctx, W / 2 - 78, 52, 156, 280, 26);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 22, 78);
    ctx.lineTo(W / 2 + 22, 78);
    ctx.stroke();
    ctx.fillStyle = ACCENT;
    ctx.fillRect(W / 2 - 54, 104, 108, 66);
    ctx.fillStyle = INK_HEX;
    for (let i = 0; i < 3; i++) ctx.fillRect(W / 2 - 54, 190 + i * 34, i === 2 ? 64 : 108, 14);
  },
  dashboard: (ctx, W, H) => {
    ctx.lineWidth = 10;
    ctx.beginPath();
    roundRect(ctx, 70, 60, W - 140, H - 120, 14);
    ctx.stroke();
    const heights = [70, 120, 92, 160];
    heights.forEach((h, i) => {
      ctx.fillStyle = i === 3 ? ACCENT : INK_HEX;
      ctx.fillRect(110 + i * 52, H - 84 - h, 34, h);
    });
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(330, 240);
    ctx.lineTo(370, 190);
    ctx.lineTo(400, 214);
    ctx.lineTo(436, 120);
    ctx.stroke();
  },
  question: (ctx, W, H) => {
    ctx.fillStyle = ACCENT;
    ctx.font = `900 260px "Space Grotesk", "Avenir Next", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W / 2, H * 0.55);
  },
  bulb: (ctx, W, H) => {
    const cx = W / 2;
    ctx.fillStyle = "#ffd36b";
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(cx, 160, 78, Math.PI * 0.8, Math.PI * 2.2);
    ctx.lineTo(cx + 34, 262);
    ctx.lineTo(cx - 34, 262);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 9;
    for (const y of [284, 306]) {
      ctx.beginPath();
      ctx.moveTo(cx - 30, y);
      ctx.lineTo(cx + 30, y);
      ctx.stroke();
    }
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 16, 240);
    ctx.lineTo(cx - 16, 196);
    ctx.arc(cx, 196, 16, Math.PI, 0);
    ctx.lineTo(cx + 16, 240);
    ctx.stroke();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 10;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.95 + (i / 6) * 1.1);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 104, 160 + Math.sin(a) * 104);
      ctx.lineTo(cx + Math.cos(a) * 134, 160 + Math.sin(a) * 134);
      ctx.stroke();
    }
  },
};

/** Strokes in order: each `fn(ctx)` traces one path, its order written as grey. */
const strokeTexture = (W, H, width, strokes) =>
  canvasTexture(
    W,
    H,
    (ctx) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = width;
      strokes.forEach((fn, i) => {
        const v = Math.round(((i + 1) / (strokes.length + 1)) * 255);
        ctx.strokeStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        fn(ctx);
        ctx.stroke();
      });
    },
    { color: false },
  );

const strokeMaterial = (map, color, { additive = false, opacity = 1 } = {}) =>
  new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uColor: { value: new THREE.Color(color) }, uReveal: { value: 0 }, uAlpha: { value: opacity }, uSpark: { value: additive ? 1.6 : 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uReveal, uAlpha, uSpark;
      varying vec2 vUv;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float order = t.r;
        float on = smoothstep(order, order + 0.015, uReveal * 1.02);
        float tip = smoothstep(0.045, 0.0, abs(order - uReveal)) * step(0.001, uReveal) * step(uReveal, 0.999);
        float a = t.a * (on + tip * uSpark) * uAlpha;
        if (a < 0.004) discard;
        ${additive ? "gl_FragColor = vec4(uColor * a, 1.0);" : "gl_FragColor = vec4(uColor, a);"}
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

/** The napkin: a phone, an arrow, a box with a chart, and a question mark. */
const napkinStrokes = () =>
  strokeTexture(256, 256, 7, [
    (c) => roundRect(c, 30, 40, 64, 112, 12),
    (c) => {
      c.moveTo(42, 70);
      c.lineTo(82, 70);
      c.moveTo(42, 90);
      c.lineTo(72, 90);
      c.moveTo(42, 110);
      c.lineTo(80, 110);
    },
    (c) => {
      c.moveTo(108, 96);
      c.lineTo(150, 96);
      c.moveTo(138, 84);
      c.lineTo(150, 96);
      c.lineTo(138, 108);
    },
    (c) => c.rect(162, 52, 70, 84),
    (c) => {
      c.moveTo(174, 120);
      c.lineTo(192, 96);
      c.lineTo(206, 108);
      c.lineTo(222, 70);
    },
    (c) => {
      c.moveTo(108, 190);
      c.quadraticCurveTo(128, 160, 146, 186);
      c.quadraticCurveTo(150, 202, 130, 212);
      c.lineTo(130, 222);
      c.moveTo(130, 238);
      c.lineTo(130, 240);
    },
  ]);

/** The dream, in light: a little shop with an awning, and its own app on a phone. */
const dreamStrokes = () => {
  const W = 1024;
  const H = 640;
  return strokeTexture(W, H, 8, [
    (c) => {
      c.moveTo(60, 580);
      c.lineTo(964, 580);
    },
    (c) => {
      c.moveTo(110, 580);
      c.lineTo(110, 270);
      c.moveTo(520, 270);
      c.lineTo(520, 580);
    },
    // The awning: a scalloped edge and its stripes.
    (c) => {
      c.moveTo(90, 270);
      c.lineTo(130, 190);
      c.lineTo(500, 190);
      c.lineTo(540, 270);
      for (let i = 0; i < 9; i++) {
        const x0 = 90 + i * 50;
        c.moveTo(x0, 270);
        c.quadraticCurveTo(x0 + 25, 300, x0 + 50, 270);
      }
    },
    (c) => {
      for (let i = 1; i < 9; i++) {
        c.moveTo(90 + i * 50, 270);
        c.lineTo(130 + i * 41, 190);
      }
    },
    // A sign over it with a heart.
    (c) => roundRect(c, 210, 96, 210, 72, 12),
    (c) => {
      c.moveTo(315, 152);
      c.bezierCurveTo(270, 124, 290, 96, 315, 116);
      c.bezierCurveTo(340, 96, 360, 124, 315, 152);
    },
    // Door and window.
    (c) => {
      c.rect(150, 360, 110, 220);
      c.moveTo(240, 470);
      c.lineTo(240, 480);
    },
    (c) => {
      c.rect(300, 350, 180, 140);
      c.moveTo(390, 350);
      c.lineTo(390, 490);
      c.moveTo(300, 420);
      c.lineTo(480, 420);
    },
    // The phone, with the shop's app on it.
    (c) => roundRect(c, 640, 120, 230, 440, 36),
    (c) => {
      c.moveTo(728, 150);
      c.lineTo(782, 150);
    },
    (c) => roundRect(c, 700, 190, 110, 110, 26),
    (c) => {
      c.moveTo(755, 278);
      c.bezierCurveTo(715, 250, 730, 212, 755, 234);
      c.bezierCurveTo(780, 212, 795, 250, 755, 278);
    },
    (c) => {
      for (let i = 0; i < 3; i++) {
        c.moveTo(690, 350 + i * 50);
        c.lineTo(i === 2 ? 760 : 820, 350 + i * 50);
      }
    },
    // A few sparkles.
    (c) => {
      for (const [x, y, r] of [[580, 120, 22], [930, 220, 18], [600, 470, 14], [60, 160, 18]]) {
        c.moveTo(x - r, y);
        c.lineTo(x + r, y);
        c.moveTo(x, y - r);
        c.lineTo(x, y + r);
      }
    },
  ]);
};

/* ------------------------------------------------------------------------
 * The laptop screens: an editor scrolling code on the left, a UI the agent is
 * building on the right (`uBuild` 0 → 1), its two cursors placing blocks.
 * ---------------------------------------------------------------------- */

const screenMaterial = (seed) =>
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBuild: { value: 0 }, uOn: { value: 0 }, uSeed: { value: seed }, uBright: { value: 0.85 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uBuild, uOn, uSeed, uBright;
      varying vec2 vUv;
      float h1(float n) { return fract(sin(n * 91.345 + uSeed * 17.31) * 47453.5453); }
      float inRect(vec2 p, vec4 r) { vec2 a = step(r.xy, p) * step(p, r.zw); return a.x * a.y; }
      float edge(vec2 p, vec4 r, float w) { return inRect(p, r) * (1.0 - inRect(p, r + vec4(w, w * 1.6, -w, -w * 1.6))); }
      vec3 tokenColor(float n) {
        float k = floor(h1(n) * 5.0);
        if (k < 1.0) return vec3(1.0, 0.62, 0.42);
        if (k < 2.0) return vec3(0.45, 0.85, 0.8);
        if (k < 3.0) return vec3(0.95, 0.8, 0.45);
        if (k < 4.0) return vec3(0.75, 0.65, 0.98);
        return vec3(0.62, 0.6, 0.66);
      }
      vec2 blockCentre(float k) {
        if (k < 0.5) return vec2(0.5, 0.915);
        if (k < 1.5) return vec2(0.5, 0.67);
        if (k < 2.5) return vec2(0.33, 0.43);
        if (k < 3.5) return vec2(0.33, 0.31);
        if (k < 4.5) return vec2(0.33, 0.19);
        return vec2(0.75, 0.065);
      }
      void main() {
        vec2 p = vUv;
        vec3 col = vec3(0.075, 0.07, 0.09);
        // Title bar, its three dots, and the agent's status light.
        if (p.y > 0.93) {
          col = vec3(0.15, 0.13, 0.16);
          for (int i = 0; i < 3; i++) {
            float d = length((p - vec2(0.03 + float(i) * 0.028, 0.965)) * vec2(1.6, 1.0));
            col = mix(col, vec3(0.5, 0.42, 0.4), smoothstep(0.012, 0.008, d));
          }
          float busy = step(0.001, uBuild) * step(uBuild, 0.999);
          vec3 lamp = mix(vec3(0.35, 0.3, 0.3), mix(vec3(1.0, 0.6, 0.25) * (0.6 + 0.4 * sin(uTime * 9.0)), vec3(0.35, 0.95, 0.5), step(0.999, uBuild)), max(busy, step(0.999, uBuild)));
          col = mix(col, lamp, smoothstep(0.014, 0.009, length((p - vec2(0.5, 0.965)) * vec2(1.6, 1.0))));
          float chip = inRect(p, vec4(0.53, 0.952, 0.53 + 0.16 * min(1.0, uBuild * 1.4 + busy * 0.3), 0.978));
          col = mix(col, vec3(0.32, 0.28, 0.3), chip);
        }
        // Code: rows type in at the bottom and hop up when done.
        vec4 pane = vec4(0.02, 0.03, 0.5, 0.91);
        if (inRect(p, pane) > 0.5) {
          float ROWS = 17.0;
          float T = uTime * (0.9 + 1.9 * step(0.001, uBuild) * step(uBuild, 0.999));
          float s = floor(T) + smoothstep(0.82, 1.0, fract(T));
          float r = (pane.w - p.y) / (pane.w - pane.y) * ROWS;
          float idx = floor(r + s);
          float fy = fract(r + s);
          float newest = floor(T) + ROWS - 1.0;
          float typed = idx > newest ? 0.0 : (idx == newest ? smoothstep(0.0, 0.8, fract(T)) : 1.0);
          float blank = step(h1(idx + 3.1), 0.12);
          float indent = floor(h1(idx) * 4.0) * 0.035;
          float x = (p.x - 0.045 - indent) / 0.42;
          float l1 = 0.12 + h1(idx + 1.7) * 0.25;
          float l2 = 0.08 + h1(idx + 2.9) * 0.3;
          float l3 = 0.05 + h1(idx + 4.3) * 0.2;
          float seg = -1.0;
          if (x > 0.0 && x < l1) seg = 0.0;
          else if (x > l1 + 0.03 && x < l1 + 0.03 + l2) seg = 1.0;
          else if (x > l1 + l2 + 0.06 && x < l1 + l2 + 0.06 + l3) seg = 2.0;
          float lineOn = step(0.0, seg) * step(0.3, fy) * step(fy, 0.7) * (1.0 - blank) * step(x, (l1 + l2 + l3 + 0.06) * typed);
          col = mix(col, tokenColor(idx * 3.0 + seg), lineOn * 0.9);
          // The caret on the line being typed.
          float caretX = 0.045 + indent + (l1 + l2 + l3 + 0.06) * typed * 0.42;
          float caret = step(abs(p.x - caretX), 0.004) * step(abs(r + s - newest - 0.5), 0.3) * step(0.5, fract(uTime * 2.0));
          col = mix(col, vec3(0.95), caret * (1.0 - blank));
          // Line numbers.
          col = mix(col, vec3(0.3, 0.28, 0.32), step(p.x, 0.035) * step(0.38, fy) * step(fy, 0.62));
        }
        // The preview: a UI built block by block.
        vec4 prev = vec4(0.53, 0.04, 0.98, 0.91);
        if (inRect(p, prev) > 0.5) {
          vec2 q = (p - prev.xy) / (prev.zw - prev.xy);
          vec3 paper = vec3(0.86, 0.81, 0.73);
          float lit = smoothstep(0.0, 0.06, uBuild);
          col = mix(vec3(0.12, 0.11, 0.13), paper, lit);
          // Faint layout grid before anything is placed.
          float grid = (step(fract(q.x * 8.0), 0.03) + step(fract(q.y * 10.0), 0.03)) * (1.0 - lit);
          col += grid * 0.05;
          float g = uBuild * 6.0;
          vec4 blocks[6];
          blocks[0] = vec4(0.04, 0.87, 0.96, 0.96);
          blocks[1] = vec4(0.04, 0.53, 0.96, 0.81);
          blocks[2] = vec4(0.04, 0.39, 0.62, 0.47);
          blocks[3] = vec4(0.04, 0.27, 0.62, 0.35);
          blocks[4] = vec4(0.04, 0.15, 0.62, 0.23);
          blocks[5] = vec4(0.55, 0.03, 0.96, 0.1);
          for (int i = 0; i < 6; i++) {
            float e = clamp(g - float(i), 0.0, 1.0);
            vec3 fill = i == 0 || i == 5 ? vec3(0.95, 0.45, 0.25) : (i == 1 ? vec3(0.32, 0.62, 0.6) : vec3(0.55, 0.5, 0.48));
            float dash = step(0.5, fract((q.x + q.y) * 40.0));
            col = mix(col, vec3(0.35, 0.3, 0.32), edge(q, blocks[i], 0.008) * step(0.001, e) * (1.0 - step(0.999, e)) * dash);
            col = mix(col, fill, inRect(q, blocks[i]) * smoothstep(0.35, 1.0, e));
          }
          // Two agent cursors, going from block to block.
          float k = min(5.0, floor(g));
          float u = smoothstep(0.0, 0.45, fract(g));
          vec2 from = blockCentre(max(0.0, k - 1.0));
          vec2 to = blockCentre(k);
          vec2 ca = mix(from, to, u) + vec2(0.05 * sin(uTime * 3.0), 0.02 * cos(uTime * 4.0));
          vec2 cb = mix(from, to, smoothstep(0.1, 0.6, fract(g))) + vec2(-0.12 + 0.04 * cos(uTime * 2.6), -0.03);
          float act = step(0.001, uBuild) * (1.0 - step(0.999, uBuild));
          vec2 asp = vec2(1.0, 1.25);
          col = mix(col, vec3(0.2, 0.85, 0.8), smoothstep(0.03, 0.022, length((q - ca) * asp)) * act);
          col = mix(col, vec3(1.0, 0.45, 0.7), smoothstep(0.03, 0.022, length((q - cb) * asp)) * act);
        }
        gl_FragColor = vec4(col * uBright * mix(0.04, 1.0, uOn), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

/* ------------------------------------------------------------------------
 * Soft light: dust in the window light, steam off the cups (breakfast's).
 * ---------------------------------------------------------------------- */

const SOFT_DISC = /* glsl */ `
  float soft(vec2 pc) { return smoothstep(0.5, 0.05, length(pc - 0.5)); }
`;

const createMotes = (count, from, to, radius) => {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const p = new THREE.Vector3();
  const axis = to.clone().sub(from);
  for (let i = 0; i < count; i++) {
    p.copy(from).addScaledVector(axis, 0.05 + hash(i * 1.7) * 0.9);
    const r = radius * Math.sqrt(hash(i * 3.3));
    const a = hash(i * 5.1) * Math.PI * 2;
    p.x += Math.cos(a) * r;
    p.y += (hash(i * 7.9) - 0.5) * radius;
    p.z += Math.sin(a) * r;
    pos.set([p.x, p.y, p.z], i * 3);
    seed[i] = hash(i * 11.3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 1000 }, uColor: { value: hdr("#ffdcae", 0.9) }, uGain: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale;
      varying float vA;
      void main() {
        float s = aSeed * 6.2831;
        vec3 p = position + vec3(sin(uTime * 0.13 + s) * 0.1, sin(uTime * 0.09 + s * 1.7) * 0.07, cos(uTime * 0.11 + s * 2.3) * 0.08);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.006 + 0.007 * fract(aSeed * 13.7)) * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed) + s * 3.0);
        vA = 0.25 + 0.75 * tw * tw;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uGain;
      varying float vA;
      ${SOFT_DISC}
      void main() {
        float a = soft(gl_PointCoord) * vA * uGain;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor * a, 1.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 22;
  return points;
};

const createSteam = (count, { rise = 0.16, spread = 0.014, size = 0.032, speed = 0.3, alpha = 0.26 } = {}) => {
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) seed[i] = i / count + hash(i * 2.9) * 0.02;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1000 },
      uOrigin: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Color("#fff4e6") },
      uAlpha: { value: alpha },
      uRise: { value: rise },
      uSpread: { value: spread },
      uSize: { value: size },
      uSpeed: { value: speed },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale, uRise, uSpread, uSize, uSpeed, uAlpha;
      uniform vec3 uOrigin;
      varying float vA;
      void main() {
        float life = fract(uTime * uSpeed + aSeed);
        float s = aSeed * 31.0;
        vec3 p = uOrigin + vec3(sin(life * 5.0 + s) * uSpread * (0.3 + life * 2.5), life * uRise, cos(life * 4.0 + s * 1.3) * uSpread * (0.3 + life * 2.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (0.5 + life * 1.6) * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(0.0, 0.18, life) * (1.0 - life) * uAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      ${SOFT_DISC}
      void main() {
        float a = soft(gl_PointCoord) * vA;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 21;
  return points;
};

/** A soft-edged quad: sun patches (additive) and contact shadows (dark). */
const softQuad = (w, h, color, opacity, { additive = false } = {}) => {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float a = smoothstep(0.5, 0.15, length(vUv - 0.5)) * uOpacity;
        ${additive ? "gl_FragColor = vec4(uColor * a, 1.0);" : "gl_FragColor = vec4(uColor, a);"}
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = additive ? 12 : 1;
  return m;
};

/** A cone from `base` along `dir` (a leaf, a blade). */
const spike = (mat, base, dir, length, radius) => {
  const geo = new THREE.ConeGeometry(radius, length, 6);
  geo.translate(0, length / 2, 0);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(base);
  m.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  return m;
};

/* ------------------------------------------------------------------------
 * The café.
 * ---------------------------------------------------------------------- */

/** The window's view: a warm street at golden hour, soft rooftops, a tree. */
const streetTexture = () =>
  canvasTexture(1024, 512, (ctx, W, H) => {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#ffe2b6");
    sky.addColorStop(0.55, "#ffc58a");
    sky.addColorStop(1, "#f4a46c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.72, H * 0.32, 0, W * 0.72, H * 0.32, H * 0.6);
    sun.addColorStop(0, "rgba(255,250,232,1)");
    sun.addColorStop(0.25, "rgba(255,236,200,0.65)");
    sun.addColorStop(1, "rgba(255,220,170,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
    // Across the street: low buildings in haze.
    ctx.fillStyle = "rgba(214,136,96,0.45)";
    const roofs = [[0, 300], [120, 250], [250, 280], [370, 220], [520, 270], [640, 240], [790, 290], [900, 230], [1024, 260]];
    ctx.beginPath();
    ctx.moveTo(0, H);
    roofs.forEach(([x, y], i) => {
      ctx.lineTo(x, y);
      if (i < roofs.length - 1) ctx.lineTo(roofs[i + 1][0], y);
    });
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = "rgba(190,112,80,0.35)";
    for (let i = 0; i < 14; i++) ctx.fillRect(40 + i * 72, 300 + (i % 3) * 18, 26, 34);
    // A street tree on the left.
    ctx.fillStyle = "rgba(150,100,70,0.5)";
    ctx.fillRect(150, 300, 14, 212);
    ctx.fillStyle = "rgba(170,140,80,0.42)";
    for (const [x, y, r] of [[157, 260, 80], [110, 300, 56], [210, 296, 60], [160, 200, 56]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

const buildCafe = (w) => {
  const g = new THREE.Group();
  const box = (sx, sy, sz, mat, x, y, z, line = false, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    parent.add(m);
    return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 20, line = false, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    parent.add(m);
    return m;
  };

  // Shell: plank floor, plaster walls over green wainscot, a ceiling.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), w.ink({ tint: "#9a6a44", tone: 0.8, rim: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0.8);
  g.add(floor);
  const seam = w.ink({ tint: "#5e3b24", tone: 0.6, rim: 0 });
  for (let i = 0; i < 28; i++) box(0.008, 0.002, 8, seam, -3.6 + i * 0.27, 0.001, 0.8);
  const plaster = w.ink({ tint: "#f0dcc0", tone: 0.95, rim: 0.15 });
  const green = w.ink({ tint: "#3f5c4c", tone: 0.75, rim: 0.3 });
  const trim = w.ink({ tint: "#5b3a24", tone: 0.6, rim: 0.4 });
  // The back wall, in four pieces round the window.
  const win = { x0: -1.55, x1: 1.55, y0: 0.95, y1: 2.55 };
  box(4, 3.2, 0.1, plaster, -3.55, 1.6, WALL_Z);
  box(4, 3.2, 0.1, plaster, 3.55, 1.6, WALL_Z);
  box(win.x1 - win.x0, 3.2 - win.y1, 0.1, plaster, 0, (3.2 + win.y1) / 2, WALL_Z);
  box(win.x1 - win.x0, win.y0, 0.1, green, 0, win.y0 / 2, WALL_Z);
  box(3.95, 0.9, 0.02, green, -3.55, 0.45, WALL_Z + 0.06);
  box(3.95, 0.9, 0.02, green, 3.55, 0.45, WALL_Z + 0.06);
  box(11, 0.05, 0.05, trim, 0, 0.92, WALL_Z + 0.08);
  box(0.1, 3.2, 6, plaster, -3.1, 1.6, 0.6);
  box(0.1, 3.2, 6, plaster, 3.1, 1.6, 0.6);
  box(0.02, 0.9, 6, green, -3.04, 0.45, 0.6);
  box(0.02, 0.9, 6, green, 3.04, 0.45, 0.6);
  box(6.4, 0.06, 6, w.ink({ tint: "#efe2cc", tone: 0.9, rim: 0.1 }), 0, 3.2, 0.6);

  // The window: the street beyond, a frame, mullions, a deep sill.
  const viewMat = new THREE.MeshBasicMaterial({ map: streetTexture(), color: hdr("#ffffff", 0.98) });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(win.x1 - win.x0, win.y1 - win.y0), viewMat);
  view.position.set(0, (win.y0 + win.y1) / 2, WALL_Z - 0.06);
  g.add(view);
  const frame = w.ink({ tint: "#2e2a26", tone: 0.45, rim: 0.7 });
  box(win.x1 - win.x0 + 0.12, 0.07, 0.12, frame, 0, win.y1 + 0.035, WALL_Z + 0.02, true);
  box(win.x1 - win.x0 + 0.2, 0.05, 0.24, w.ink({ tint: "#7a4e30", tone: 0.7, rim: 0.5 }), 0, win.y0 - 0.02, WALL_Z + 0.08, true);
  for (const x of [win.x0 - 0.03, win.x1 + 0.03]) box(0.07, win.y1 - win.y0, 0.12, frame, x, (win.y0 + win.y1) / 2, WALL_Z + 0.02, true);
  for (const x of [-0.52, 0.52]) box(0.035, win.y1 - win.y0, 0.05, frame, x, (win.y0 + win.y1) / 2, WALL_Z + 0.01);
  box(win.x1 - win.x0, 0.03, 0.05, frame, 0, win.y1 - 0.42, WALL_Z + 0.01);
  // A pot of herbs and a little stack of books on the sill.
  const pot = cyl(0.07, 0.055, 0.11, w.ink({ tint: "#b65a34", tone: 0.8, rim: 0.6 }), -1.15, win.y0 + 0.06, WALL_Z + 0.12, 16, true);
  const leaf = w.ink({ tint: "#5f9a3c", tone: 0.85, rim: 0.6 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(spike(leaf, v3(pot.position.x + Math.cos(a) * 0.03, pot.position.y + 0.05, pot.position.z + Math.sin(a) * 0.03), v3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4), 0.12 + hash(i) * 0.08, 0.012));
  }
  ["#c94f45", "#e6c46a", "#4f7aa8"].forEach((c, i) => box(0.22, 0.035, 0.15, w.ink({ tint: c, tone: 0.85, rim: 0.3 }), 1.1 + i * 0.01, win.y0 + 0.025 + i * 0.036, WALL_Z + 0.12, true));

  // Left of the window: a shelf of mugs and a plant; right: a chalk menu.
  const wood = w.ink({ tint: "#8a5a36", tone: 0.8, rim: 0.5 });
  box(1.1, 0.04, 0.22, wood, -2.35, 1.75, WALL_Z + 0.16, true);
  box(1.1, 0.04, 0.22, wood, -2.35, 1.35, WALL_Z + 0.16, true);
  const mugTints = ["#f2ede2", "#d9744a", "#7fa7a0", "#f2ede2", "#e3b04b"];
  mugTints.forEach((c, i) => cyl(0.04, 0.035, 0.09, w.ink({ tint: c, tone: 0.9, rim: 0.6 }), -2.75 + i * 0.2, 1.815, WALL_Z + 0.16, 14, true));
  for (let i = 0; i < 3; i++) box(0.05, 0.22, 0.16, w.ink({ tint: ["#5a6e8a", "#b35a3c", "#e1d3b4"][i], tone: 0.8, rim: 0.3 }), -2.0 + i * 0.06, 1.48, WALL_Z + 0.16, true);
  box(0.9, 1.1, 0.04, w.ink({ tint: "#1f2a24", tone: 0.4, rim: 0.4 }), 2.35, 1.75, WALL_Z + 0.08, true);
  const chalk = w.ink({ tint: "#e9e2d4", tone: 0.9, rim: 0 });
  for (let i = 0; i < 6; i++) box(0.2 + hash(i * 3.1) * 0.4, 0.018, 0.01, chalk, 2.2 + hash(i) * 0.08, 2.1 - i * 0.14, WALL_Z + 0.105);
  box(0.6, 0.018, 0.01, w.ink({ tint: "#f0a060", tone: 0.9, rim: 0 }), 2.35, 2.2, WALL_Z + 0.105);

  // A counter along the right wall with the espresso machine and a cake stand.
  const counterWood = w.ink({ tint: "#6e4428", tone: 0.7, rim: 0.5 });
  box(0.7, 1.0, 2.2, counterWood, 2.7, 0.5, -0.9, true);
  box(0.8, 0.05, 2.3, w.ink({ tint: "#e9e2d4", tone: 1.0, rim: 0.5 }), 2.7, 1.025, -0.9, true);
  box(0.45, 0.4, 0.5, w.ink({ tint: "#c9c6c0", tone: 1.0, rim: 0.9 }), 2.75, 1.25, -1.5, true);
  box(0.36, 0.08, 0.36, w.ink({ tint: "#2b2b2e", tone: 0.5, rim: 0.6 }), 2.75, 1.49, -1.5);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: "#dfe9ec", tone: 1.0, rim: 1.0 }));
  dome.position.set(2.7, 1.07, -0.4);
  outline(dome, w.line);
  g.add(dome);

  // Another table, empty, by the wall; daisies on it.
  const far = new THREE.Group();
  far.position.set(-1.95, 0, -1.35);
  g.add(far);
  cyl(0.36, 0.36, 0.03, w.ink({ tint: "#a06b42", tone: 0.85, rim: 0.6 }), 0, TOP - 0.015, 0, 28, true, far);
  cyl(0.035, 0.035, TOP - 0.05, frame, 0, (TOP - 0.05) / 2 + 0.02, 0, 10, false, far);
  cyl(0.2, 0.22, 0.02, frame, 0, 0.01, 0, 20, false, far);
  const vase = createDaisyVase({ count: 3, vaseHeight: 0.15, ink: w.ink, line: w.line, seed: 4 });
  vase.position.set(0.05, TOP, 0.02);
  far.add(vase);

  // A plant in the front-right corner.
  const bigPot = cyl(0.2, 0.16, 0.42, w.ink({ tint: "#c8a27a", tone: 0.85, rim: 0.5 }), 2.55, 0.21, 0.9, 20, true);
  const dark = w.ink({ tint: "#3f7a3a", tone: 0.75, rim: 0.7 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + hash(i) * 0.3;
    g.add(spike(dark, v3(bigPot.position.x + Math.cos(a) * 0.06, 0.42, bigPot.position.z + Math.sin(a) * 0.06), v3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5), 0.55 + hash(i * 2.3) * 0.5, 0.05));
  }

  // The pendant over our table.
  const lampY = 2.12;
  box(0.006, 3.2 - lampY, 0.006, frame, 0, (3.2 + lampY) / 2, 0);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 24, 1, true), w.ink({ tint: "#2f4a3e", tone: 0.6, rim: 1.0 }));
  shade.material.side = THREE.DoubleSide;
  shade.position.set(0, lampY, 0);
  outline(shade, w.line);
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color: hdr("#ffd59a", 2.2) }));
  bulb.position.set(0, lampY - 0.08, 0);
  g.add(bulb);
  const pendantBeam = lightBeam({ from: [0, lampY - 0.06, 0], to: [0, TOP, 0], radiusFrom: 0.16, radiusTo: 0.75, color: "#ffcf8a" });
  pendantBeam.material.uniforms.uIntensity.value = 0.12;
  g.add(pendantBeam);

  // The window light: shafts down onto the table and the floor.
  const shafts = [
    // Steep, landing behind the table, so they light the air and not the two of them.
    lightBeam({ from: [-0.8, 2.3, WALL_Z + 0.1], to: [-0.55, 0, -0.75], radiusFrom: 0.45, radiusTo: 0.6, color: "#ffcf8f" }),
    lightBeam({ from: [0.8, 2.2, WALL_Z + 0.1], to: [0.6, 0, -0.8], radiusFrom: 0.42, radiusTo: 0.58, color: "#ffd8a0" }),
  ];
  shafts.forEach((s) => g.add(s));
  const tablePatch = softQuad(0.9, 0.6, "#ffcf95", 0.05, { additive: true });
  tablePatch.position.set(0.05, TOP + 0.002, -0.05);
  g.add(tablePatch);
  const floorPatch = softQuad(2.6, 1.4, "#ffcf95", 0.06, { additive: true });
  floorPatch.position.set(0.0, 0.006, -0.9);
  g.add(floorPatch);
  const shadow = softQuad(1.8, 1.3, "#1a0e08", 0.38);
  shadow.position.set(0, 0.008, 0);
  g.add(shadow);

  return { group: g, viewMat, shafts, tablePatch, floorPatch, win };
};

/** The table, two chairs, two laptops, two lattes, the napkin. */
const buildTable = (w) => {
  const g = new THREE.Group();
  const mesh = (geo, mat, x, y, z, line = false, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    parent.add(m);
    return m;
  };
  const wood = w.ink({ tint: "#a46c40", tone: 0.85, rim: 0.6, spec: 0.4 });
  const iron = w.ink({ tint: "#2a2624", tone: 0.45, rim: 0.7 });
  mesh(new THREE.BoxGeometry(TABLE.w, 0.03, TABLE.d), wood, 0, TOP - 0.015, 0, true);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, TOP - 0.05, 12), iron, 0, (TOP - 0.05) / 2 + 0.02, 0);
  for (const r of [0, Math.PI / 2]) {
    const foot = mesh(new THREE.BoxGeometry(0.6, 0.03, 0.05), iron, 0, 0.015, 0);
    foot.rotation.y = r + Math.PI / 4;
  }

  // Bentwood chairs, the back away from the table.
  const chairWood = w.ink({ tint: "#5a3622", tone: 0.65, rim: 0.7 });
  const seatGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.035, 24);
  const legGeo = new THREE.CylinderGeometry(0.014, 0.012, SEAT_TOP - 0.035, 8);
  const postGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.48, 8);
  const hoopGeo = new THREE.TorusGeometry(0.17, 0.014, 8, 24, Math.PI);
  for (const s of [-1, 1]) {
    const chair = new THREE.Group();
    chair.position.set(s * 0.82, 0, 0);
    chair.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(chair);
    mesh(seatGeo, chairWood, 0, SEAT_TOP - 0.0175, 0, true, chair);
    for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
      const leg = mesh(legGeo, chairWood, x * 1.05, (SEAT_TOP - 0.035) / 2, z * 1.05, false, chair);
      leg.rotation.set(z * 0.3, 0, -x * 0.3);
    }
    for (const x of [-0.17, 0.17]) mesh(postGeo, chairWood, x, SEAT_TOP + 0.24, -0.17, true, chair);
    const hoop = mesh(hoopGeo, chairWood, 0, SEAT_TOP + 0.48, -0.17, true, chair);
    hoop.scale.y = 0.6;
  }

  // Laptops: base, keys, trackpad, and a lid on a hinge with the screen in it.
  const alu = w.ink({ tint: "#b9bcc2", tone: 1.0, rim: 0.9, spec: 0.6 });
  const keysMat = w.ink({ tint: "#2a2a30", tone: 0.5, rim: 0.2 });
  const padMat = w.ink({ tint: "#9da0a8", tone: 0.9, rim: 0.3 });
  const bezelMat = new THREE.MeshBasicMaterial({ color: "#0d0c10" });
  const baseGeo = new THREE.BoxGeometry(0.3, 0.012, 0.21);
  const keysGeo = new THREE.PlaneGeometry(0.26, 0.085);
  const padGeo = new THREE.PlaneGeometry(0.09, 0.05);
  const shellGeo = new THREE.BoxGeometry(0.3, 0.2, 0.007);
  const bezelGeo = new THREE.PlaneGeometry(0.29, 0.19);
  const screenGeo = new THREE.PlaneGeometry(0.272, 0.17);
  const laptop = ({ x, z }, yaw, seed) => {
    const lg = new THREE.Group();
    lg.position.set(x, TOP, z);
    lg.rotation.y = yaw;
    g.add(lg);
    mesh(baseGeo, alu, 0, 0.006, 0, true, lg);
    const keys = mesh(keysGeo, keysMat, 0, 0.0125, -0.03, false, lg);
    keys.rotation.x = -Math.PI / 2;
    const pad = mesh(padGeo, padMat, 0, 0.0125, 0.06, false, lg);
    pad.rotation.x = -Math.PI / 2;
    const lid = new THREE.Group();
    lid.position.set(0, 0.012, -0.105);
    lg.add(lid);
    mesh(shellGeo, alu, 0, 0.1, -0.0035, true, lid);
    mesh(bezelGeo, bezelMat, 0, 0.1, 0.0002, false, lid);
    const screenMat = screenMaterial(seed);
    mesh(screenGeo, screenMat, 0, 0.102, 0.0006, false, lid);
    const edge = v3(0, 0.2, 0.004);
    return { group: lg, lid, screenMat, edge, open: (k) => (lid.rotation.x = Math.PI / 2 - k * LID_OPEN) };
  };
  // His screen faces him (-x), hers faces her (+x).
  const laptops = { him: laptop(LAPTOPS.him, -Math.PI / 2, 1.3), her: laptop(LAPTOPS.her, Math.PI / 2, 4.7) };

  // Lattes on saucers. A cup's origin is the middle of its body (where a hand holds it).
  const saucerGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.012, 24);
  const cupGeo = new THREE.CylinderGeometry(0.045, 0.032, 0.08, 22);
  const foamGeo = new THREE.CircleGeometry(0.041, 22);
  const handleGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16, Math.PI * 1.2);
  const foamMat = w.ink({ tint: "#d9b183", tone: 0.95, rim: 0.2 });
  const cups = {};
  for (const [who, tint, saucerTint] of [["him", "#f3eee4", "#f3eee4"], ["her", "#8fb8ae", "#f3eee4"]]) {
    const [x, z] = CUPS[who];
    mesh(saucerGeo, w.ink({ tint: saucerTint, tone: 0.85, rim: 0.3 }), x, TOP + 0.006, z, true);
    const cup = new THREE.Group();
    const body = mesh(cupGeo, w.ink({ tint, tone: 0.88, rim: 0.4, spec: 0.3 }), 0, 0, 0, true, cup);
    const foam = mesh(foamGeo, foamMat, 0, 0.038, 0, false, cup);
    foam.rotation.x = -Math.PI / 2;
    const handle = mesh(handleGeo, body.material, 0.045, 0.002, 0, false, cup);
    handle.rotation.z = -Math.PI * 0.6;
    const rest = v3(x, TOP + 0.012 + 0.04, z);
    cup.position.copy(rest);
    g.add(cup);
    // His handle points to his left hand (-z), so he can take it by the handle.
    cups[who] = { cup, rest, yaw: who === "him" ? Math.PI / 2 : -2.4 };
    cup.rotation.y = cups[who].yaw;
  }

  // The napkin, her sketch drawing itself on it, and her pen.
  const napkin = mesh(new THREE.PlaneGeometry(0.17, 0.17), w.ink({ tint: "#f4eee2", tone: 0.9, rim: 0.2 }), NAPKIN[0], TOP + 0.002, NAPKIN[1]);
  napkin.rotation.set(-Math.PI / 2, 0, 0.25);
  const sketchMat = strokeMaterial(napkinStrokes(), "#2a2230");
  const sketch = mesh(new THREE.PlaneGeometry(0.16, 0.16), sketchMat, NAPKIN[0], TOP + 0.0035, NAPKIN[1]);
  sketch.rotation.set(-Math.PI / 2, 0, 0.25 + Math.PI / 2);
  sketch.renderOrder = 3;
  const pen = new THREE.Group();
  const barrel = mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.13, 8), w.ink({ tint: "#2b4a7a", tone: 0.7, rim: 0.6 }), 0, 0, 0.0, true, pen);
  barrel.rotation.x = Math.PI / 2;
  const nib = mesh(new THREE.ConeGeometry(0.0045, 0.014, 8), w.ink({ tint: "#d8d4cc", tone: 1.0, rim: 0.5 }), 0, 0, 0.072, false, pen);
  nib.rotation.x = Math.PI / 2;
  const penRest = { pos: v3(NAPKIN[0] + 0.03, TOP + 0.006, NAPKIN[1] + 0.12), yaw: 0.3 };
  pen.position.copy(penRest.pos);
  pen.rotation.set(0, penRest.yaw, 0);
  g.add(pen);

  // A notebook between the cups, closed, its elastic round it.
  const book = mesh(new THREE.BoxGeometry(0.15, 0.016, 0.21), w.ink({ tint: "#2f3b4d", tone: 0.6, rim: 0.6 }), -0.08, TOP + 0.008, 0.25, true);
  book.rotation.y = 0.2;
  const band = mesh(new THREE.BoxGeometry(0.006, 0.018, 0.212), w.ink({ tint: "#e8693a", tone: 0.9, rim: 0.3 }), -0.03, TOP + 0.009, 0.24);
  band.rotation.y = 0.2;

  return { group: g, laptops, cups, sketchMat, pen, penRest };
};

/* ------------------------------------------------------------------------
 * The scene.
 * ---------------------------------------------------------------------- */

const CARD_W = 0.25;
// Each idea: its art, where it comes from, where it hangs, when it appears.
const CARDS = [
  { art: "app", from: "her", slot: [-0.42, 1.56, 0.02], at: 6.5 },
  { art: "phone", from: "napkin", slot: [-0.24, 1.82, -0.02], at: 7.6 },
  // Below the pendant lamp, with clearance: never over its bulb.
  { art: "platform", from: "him", slot: [0.03, 1.8, 0.0], at: 8.7 },
  { art: "dashboard", from: "napkin", slot: [0.3, 1.82, -0.02], at: 9.8 },
  { art: "tool", from: "him", slot: [0.44, 1.56, 0.02], at: 10.9 },
  { art: "question", from: "napkin", slot: [0.02, 1.56, 0.12], at: 12.0 },
];
const Q = 5;

export const createDreamCafeScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const exposureWas = renderer.toneMappingExposure;
  renderer.toneMappingExposure = EXPOSURE;
  let disposed = false;

  const cafe = buildCafe(w);
  scene.add(cafe.group);
  const table = buildTable(w);
  scene.add(table.group);
  const cuts = createCuts(overlay);

  // Dust in the window light; steam off both lattes.
  const motes = createMotes(260, v3(0, 1.9, WALL_Z + 0.3), v3(0.1, 0.4, 1.2), 0.9);
  const steam = { him: createSteam(16), her: createSteam(16) };
  scene.add(motes, steam.him, steam.her);
  const softPoints = [motes, steam.him, steam.her];

  // The idea cards: one shared quad, a material per card.
  const textures = [];
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_W * 0.75);
  const cards = CARDS.map((c) => {
    const map = cardTexture(CARD_ART[c.art]);
    textures.push(map);
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.86) });
    const m = new THREE.Mesh(cardGeo, mat);
    m.renderOrder = 30;
    m.visible = false;
    scene.add(m);
    return { ...c, mesh: m, slot: v3(...c.slot), pos: new THREE.Vector3() };
  });
  const bulbMap = cardTexture(CARD_ART.bulb);
  const questionMap = cards[Q].mesh.material.map;
  textures.push(bulbMap);
  // A soft glow behind the card that lights up.
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshBasicMaterial({ map: canvasTexture(128, 128, (ctx, W, H) => {
      const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.3, "rgba(255,255,255,0.45)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }), color: hdr("#ffb866", 1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  halo.renderOrder = 29;
  scene.add(halo);

  // The dream, drawn in light in the window.
  const dreamMap = dreamStrokes();
  textures.push(dreamMap, table.sketchMat.uniforms.uMap.value);
  const dreamMat = strokeMaterial(dreamMap, hdr("#ffb04a", 2.2), { additive: true });
  const dream = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.44), dreamMat);
  dream.position.set(0, 1.78, WALL_Z + 0.2);
  dream.renderOrder = 25;
  scene.add(dream);

  w.light(...KEY);
  w.page({ mode: "still" });
  w.palette(CAFE);
  const fogRange = () => w.inks.forEach((m) => m.uniforms.uFogRange.value.set(7, 26));
  fogRange();

  /* ---- the two of them ---- */
  const cast = {};
  // A light rim: on dark cloth a strong warm rim reads as skin.
  const ink = { tone: 0.84, rim: 0.12 };
  const HIS_TOP = "#5d7a64";
  const HER_TOP = "#d9a441";
  const HIS_SHOES = "#3a2418";
  const HER_SHOES = "#5a3520";
  const loads = [
    // Him: a sage hoodie, dark indigo jeans, dark brown derbies (built below:
    // the kit's lasts read as pillows at this size), glasses (added below).
    createModelFigure({
      height: 1.78,
      hair: ["HairSimpleParted", "EyebrowsRegular"],
      line: w.line,
      ink,
      outfit: { skin: "#c08a64", top: HIS_TOP, bottom: "#1f2b52", shoes: HIS_SHOES, footwear: "none", hair: "#22170f", sleeves: "long", neckband: "#4a6352", iris: "#3a2618", pupil: "#0e0907" },
    }),
    // Her: a mustard sweater, black trousers, brown leather flats, brown hair down.
    createModelFigure({
      body: "SuperheroFemale",
      height: 1.66,
      hair: ["HairLong", "EyebrowsFemale"],
      line: w.line,
      ink,
      outfit: { skin: "#ebc2a2", top: HER_TOP, bottom: "#141418", shoes: HER_SHOES, footwear: "loafers", hair: "#4a2c1c", sleeves: "long", neckband: "#c08e30", iris: "#4d6b3c", pupil: "#0e140b" },
    }),
  ];

  const ready = Promise.all(loads).then(([him, her]) => {
    if (disposed) return null;
    coverShoulders(him, HIS_TOP);
    coverShoulders(her, HER_TOP);
    const headAt = (f) => f.bones.head.getWorldPosition(new THREE.Vector3());
    // His glasses: two rims and a bridge on the head bone, fitted at rest.
    him.apply({});
    him.root.updateMatrixWorld(true);
    const eyes = headAt(him).add(v3(0, 0.085, 0.1));
    const rimMat = w.flat;
    const rimGeo = new THREE.TorusGeometry(0.024, 0.0035, 6, 20);
    const glasses = [-1, 1].map((s) => {
      const r = new THREE.Mesh(rimGeo, rimMat);
      r.position.copy(eyes).add(v3(s * 0.034, 0, 0));
      return r;
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), rimMat);
    bridge.position.copy(eyes).add(v3(0, 0.006, 0));
    const templeGeo = new THREE.BoxGeometry(0.004, 0.004, 0.1);
    const temples = [-1, 1].map((s) => {
      const t = new THREE.Mesh(templeGeo, rimMat);
      t.position.copy(eyes).add(v3(s * 0.06, 0.004, -0.05));
      return t;
    });
    [...glasses, bridge, ...temples].forEach((m) => {
      scene.add(m);
      him.bones.head.attach(m);
    });

    for (const [name, f] of [["him", him], ["her", her]]) {
      cast[name] = f;
      scene.add(f.root);
      w.register(f.root);
      f.ik = createArmIK(f);
      f.pose = { hips: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], lShoulder: [0, 0, 0], lElbow: [0, 0, 0], rShoulder: [0, 0, 0], rElbow: [0, 0, 0], ...structuredClone(LEGS) };
      // Seated: hips over the chair, thighs on it.
      const s = SEATS[name];
      f.root.rotation.y = s.yaw;
      f.apply(f.pose);
      f.root.updateMatrixWorld(true);
      const hips = f.bones.hips.getWorldPosition(new THREE.Vector3());
      f.root.position.x += s.x - hips.x;
      f.root.position.z += 0 - hips.z;
      f.seatOn(SEAT_TOP);
      fitFeet(f, FEET[name], name === "him" ? HIS_SHOES : HER_SHOES);
      if (name === "him") {
        const mats = {
          upper: w.ink({ tint: HIS_SHOES, tone: 0.8, rim: 0.35, spec: 0.6 }),
          tongue: w.ink({ tint: "#4a2e1f", tone: 0.8, rim: 0.2, spec: 0.4 }),
          sole: w.ink({ tint: "#16100c", tone: 0.7, rim: 0.2 }),
          lace: w.ink({ tint: "#1b1310", tone: 0.7, rim: 0.1 }),
          line: w.line,
        };
        for (const side of ["l", "r"]) {
          const shoe = buildShoe(f, side, mats);
          if (!shoe) continue;
          scene.add(shoe);
          f.model.getObjectByName(`foot_${side}`).attach(shoe);
        }
      }
      f.head = headAt(f);
      f.socketAt = new THREE.Vector3();
      f.gripOff = { l: new THREE.Vector3(0.05, 0, 0), r: new THREE.Vector3(0.05, 0, 0) };
      f.handState = { l: "", r: "" };
      f.held = { l: null, r: null };
      f.socket("left");
      f.socket("right");
      // The wrists' own turn at rest, to come back to after a sip.
      f.wristRest = { l: f.handRig.l.bone.quaternion.clone(), r: f.handRig.r.bone.quaternion.clone() };
    }
    w.light(...KEY);
    w.palette(CAFE);
    fogRange();
    w.sync();
    return cast;
  });

  /* ---- per-frame state, allocated once ---- */
  let now = 0;
  const T = TOP;
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const aim = Array.from({ length: 6 }, () => new THREE.Vector3());
  const gazeAt = { him: new THREE.Vector3(), her: new THREE.Vector3() };
  const pts = {};
  const pt = (name) => (pts[name] ??= new THREE.Vector3());

  const HINT = {
    l: v3(0.75, -0.65, -0.1).normalize(),
    r: v3(-0.75, -0.65, -0.1).normalize(),
    lUp: v3(0.8, -0.3, -0.5).normalize(),
    rUp: v3(-0.8, -0.3, -0.5).normalize(),
  };

  // Hands: a named hand pose per side, set only when it changes.
  const hand = (f, s, pose, opts) => {
    if (f.handState[s] === pose) return;
    f.handState[s] = pose;
    f.setHand(s === "l" ? "left" : "right", pose, 1, opts);
  };
  // Holding: a cup or the pen goes into the hand, or back to where it rests.
  const holdIf = (f, s, obj, want, opts, rest) => {
    const side = s === "l" ? "left" : "right";
    if (want && f.held[s] !== obj) {
      f.hold(obj, { hand: side, ...opts });
      f.held[s] = obj;
      f.handState[s] = "held";
    } else if (!want && f.held[s] === obj) {
      f.release(side, { to: table.group });
      f.held[s] = null;
      f.handState[s] = "";
      rest(obj);
    }
  };
  const restCup = (who) => (cup) => {
    const c = table.cups[who];
    cup.position.copy(c.rest);
    cup.rotation.set(0, c.yaw, 0);
    cup.scale.setScalar(1);
  };
  const rests = { him: restCup("him"), her: restCup("her") };
  const cupHold = (who) => ({ grip: "grip", radius: DRINKS[who].radius, offset: v3(...DRINKS[who].grip) });
  const HOLD = {
    him: cupHold("him"),
    her: cupHold("her"),
    pen: { grip: "pinch", rotation: new THREE.Euler(-0.9, 0, 0), offset: v3(0, 0, -0.02) },
  };
  const restPen = (p) => {
    p.position.copy(table.penRest.pos);
    p.rotation.set(0, table.penRest.yaw, 0);
    p.scale.setScalar(1);
  };

  /** The wrist target that puts the hand's grip point at `p`. */
  const wristFor = (f, s, p, out) => out.copy(p).sub(f.gripOff[s]);
  /** In front of the mouth: forward and down from the head bone. */
  const mouth = (f, out, fwd = 0.13, down = 0.03) => {
    const yaw = f.root.rotation.y;
    return out.copy(f.head).add(tmp2.set(Math.sin(yaw) * fwd, -down, Math.cos(yaw) * fwd));
  };
  /** The cup's grip point off its middle, in the world (the cup upright, at its yaw). */
  const gripOffset = (who) => tmp2.set(...DRINKS[who].grip).applyAxisAngle(UP, table.cups[who].yaw);
  /** Where the hand holds a cup at rest. */
  const cupGrip = (who, out) => out.copy(table.cups[who].rest).add(gripOffset(who));
  /** Where the grip sits for a sip: the cup's middle in front of the lips, its rim at them. */
  const sipAt = (who, out) => mouth(cast[who], out, 0.115, DRINKS[who].lips).add(gripOffset(who));
  const lidEdge = (who, out) => table.laptops[who].lid.localToWorld(out.copy(table.laptops[who].edge));

  // Table spots, his then hers (his left is -z, her left is +z).
  const L = LAPTOPS;
  const spots = {
    hRestL: v3(-0.52, T + 0.05, -0.1),
    hRestR: v3(-0.52, T + 0.05, 0.16),
    hKeyL: v3(-0.45, T + 0.04, L.him.z - 0.07),
    hKeyR: v3(-0.45, T + 0.04, L.him.z + 0.07),
    hPoint: v3(-0.26, T + 0.2, L.him.z + 0.04),
    hFive: v3(-0.085, T + 0.34, 0.12),
    hLap: v3(-0.56, T - 0.06, 0.06),
    sRestL: v3(0.5, T + 0.05, 0.2),
    sRestR: v3(0.52, T + 0.05, -0.16),
    sKeyL: v3(0.46, T + 0.04, L.her.z + 0.07),
    sKeyR: v3(0.46, T + 0.04, L.her.z - 0.07),
    sFive: v3(0.085, T + 0.34, 0.12),
  };
  const typing = (base, phase, out) => {
    const t = now * 1.0;
    const tap = Math.max(0, Math.sin(t * 19 + phase)) * Math.max(0, Math.sin(t * 7.3 + phase * 2));
    return out.copy(base).add(tmp2.set(0, tap * 0.018, Math.sin(t * 3.1 + phase) * 0.02));
  };
  const sketching = (out) => {
    const t = now;
    const k = segment(t, 6.3, 11.6);
    return out.set(NAPKIN[0] + 0.08 + Math.sin(t * 6.1) * 0.025, T + 0.05 + Math.max(0, Math.sin(t * 12)) * 0.006, NAPKIN[1] - 0.04 + Math.cos(t * 4.3) * 0.03 + (k - 0.5) * 0.04);
  };

  // Wrist tracks. Function keys are read lazily, so moving things are followed.
  const K = {
    hR: [
      [0, spots.hRestR],
      [3.45, spots.hRestR],
      [3.9, () => lidEdge("him", pt("hLid")).add(tmp2.set(-0.05, -0.01, 0.0))],
      [4.0, () => lidEdge("him", pt("hLid")).add(tmp2.set(-0.05, -0.01, 0.0))],
      [4.9, () => lidEdge("him", pt("hLid")).add(tmp2.set(-0.05, -0.01, 0.0))],
      [5.4, () => typing(spots.hKeyR, 0, pt("hKR"))],
      [10.0, () => typing(spots.hKeyR, 0, pt("hKR"))],
      [10.5, spots.hPoint],
      [12.8, spots.hPoint],
      [13.3, () => typing(spots.hKeyR, 0, pt("hKR"))],
      [15.4, () => typing(spots.hKeyR, 0, pt("hKR"))],
      [16.2, spots.hLap],
      [24.6, spots.hLap],
      [25.6, spots.hFive],
      [26.4, spots.hFive],
      [27.2, spots.hRestR],
      [36, spots.hRestR],
    ],
    hL: [
      [0, spots.hRestL],
      [0.5, () => wristFor(cast.him, "l", cupGrip("him", pt("hCupG")), pt("hCup")), smoothstep],
      [0.75, () => wristFor(cast.him, "l", cupGrip("him", pt("hCupG")), pt("hCup"))],
      [1.6, () => wristFor(cast.him, "l", sipAt("him", pt("hM0")), pt("hSip")), smoothstep],
      [2.75, () => wristFor(cast.him, "l", sipAt("him", pt("hM0")), pt("hSip"))],
      [3.45, () => wristFor(cast.him, "l", cupGrip("him", pt("hCupG")), pt("hCup")), smoothstep],
      [3.55, () => wristFor(cast.him, "l", cupGrip("him", pt("hCupG")), pt("hCup"))],
      [4.1, spots.hRestL, smoothstep],
      [5.0, spots.hRestL],
      [5.5, () => typing(spots.hKeyL, 1.7, pt("hKL"))],
      [15.4, () => typing(spots.hKeyL, 1.7, pt("hKL"))],
      [16.2, spots.hRestL],
      [36, spots.hRestL],
    ],
    sR: [
      [0, spots.sRestR],
      [1.3, spots.sRestR],
      [1.7, () => lidEdge("her", pt("sLid")).add(tmp2.set(0.05, -0.01, 0))],
      [1.8, () => lidEdge("her", pt("sLid")).add(tmp2.set(0.05, -0.01, 0))],
      [3.2, () => lidEdge("her", pt("sLid")).add(tmp2.set(0.05, -0.01, 0))],
      [3.6, () => typing(spots.sKeyR, 0.9, pt("sKR"))],
      [5.7, () => typing(spots.sKeyR, 0.9, pt("sKR"))],
      [6.2, spots.sRestR],
      [12.7, () => wristFor(cast.her, "r", cupGrip("her", pt("sCupG")), pt("sCup")), smoothstep],
      [12.9, () => wristFor(cast.her, "r", cupGrip("her", pt("sCupG")), pt("sCup"))],
      [13.6, () => wristFor(cast.her, "r", sipAt("her", pt("sM0")), pt("sSip")), smoothstep],
      [14.5, () => wristFor(cast.her, "r", sipAt("her", pt("sM0")), pt("sSip"))],
      [15.2, () => wristFor(cast.her, "r", cupGrip("her", pt("sCupG")), pt("sCup")), smoothstep],
      [15.3, () => wristFor(cast.her, "r", cupGrip("her", pt("sCupG")), pt("sCup"))],
      [15.75, spots.sRestR, smoothstep],
      [16.2, () => typing(spots.sKeyR, 0.9, pt("sKR"))],
      [17.4, () => typing(spots.sKeyR, 0.9, pt("sKR"))],
      [18.0, spots.sRestR],
      [36, spots.sRestR],
    ],
    sL: [
      [0, spots.sRestL],
      [3.4, spots.sRestL],
      [3.7, () => typing(spots.sKeyL, 2.4, pt("sKL"))],
      [5.7, () => typing(spots.sKeyL, 2.4, pt("sKL"))],
      [6.1, () => wristFor(cast.her, "l", table.penRest.pos, pt("sPen"))],
      [6.3, () => wristFor(cast.her, "l", table.penRest.pos, pt("sPen"))],
      [6.7, () => sketching(pt("sSk"))],
      [11.6, () => sketching(pt("sSk"))],
      [12.0, () => wristFor(cast.her, "l", table.penRest.pos, pt("sPen"))],
      [12.15, () => wristFor(cast.her, "l", table.penRest.pos, pt("sPen"))],
      [12.6, spots.sRestL],
      [16.2, () => typing(spots.sKeyL, 2.4, pt("sKL"))],
      [17.4, () => typing(spots.sKeyL, 2.4, pt("sKL"))],
      [17.9, spots.sRestL],
      [24.6, spots.sRestL],
      [25.6, spots.sFive],
      [26.4, spots.sFive],
      [27.2, spots.sRestL],
      [36, spots.sRestL],
    ],
  };

  // What each of them looks at.
  const herFace = () => pt("herFace").copy(cast.her.head).add(tmp2.set(0, 0.06, 0));
  const hisFace = () => pt("hisFace").copy(cast.him.head).add(tmp2.set(0, 0.08, 0));
  const hisScreen = () => pt("hisScreen").set(L.him.x - 0.02, T + 0.13, L.him.z);
  const herScreen = () => pt("herScreen").set(L.her.x + 0.02, T + 0.13, L.her.z);
  const napkinAt = v3(NAPKIN[0], T, NAPKIN[1]);
  const cardsAt = v3(0, 1.6, 0);
  const qCard = () => cards[Q].pos;
  const dreamAt = dream.position;
  const G = {
    him: [
      [0, herFace],
      [0.5, herFace],
      [1.0, () => pt("hFwd").set(-0.2, 1.1, 0.05)],
      [2.9, () => pt("hFwd").set(-0.2, 1.1, 0.05)],
      [3.6, hisScreen],
      [6.6, hisScreen],
      [7.2, cardsAt],
      [8.6, cardsAt],
      [9.0, napkinAt],
      [10.0, napkinAt],
      [10.4, hisScreen],
      [12.6, hisScreen],
      [13.0, herFace],
      [14.8, herFace],
      [15.4, hisScreen],
      [23.0, hisScreen],
      [23.6, qCard],
      [25.2, qCard],
      [25.5, herFace],
      [26.6, herFace],
      [27.0, qCard],
      [29.4, qCard],
      [30.4, dreamAt],
      [36, dreamAt],
    ],
    her: [
      [0, hisFace],
      [1.3, hisFace],
      [1.7, herScreen],
      [5.6, herScreen],
      [6.1, napkinAt],
      [8.9, napkinAt],
      [9.3, cardsAt],
      [10.3, cardsAt],
      [10.6, () => pt("hisHand").set(L.him.x + 0.05, T + 0.2, L.him.z + 0.04)],
      [12.6, () => pt("hisHand").set(L.him.x + 0.05, T + 0.2, L.him.z + 0.04)],
      [13.0, hisFace],
      [15.0, hisFace],
      [15.6, herScreen],
      [23.0, herScreen],
      [23.6, qCard],
      [25.2, qCard],
      [25.5, hisFace],
      [26.6, hisFace],
      [27.0, qCard],
      [29.4, qCard],
      [30.4, dreamAt],
      [36, dreamAt],
    ],
  };

  const S = {
    him: [
      [0.8, 1.4, POSES.sip],
      [3.0, 3.6, POSES.sit],
      [5.0, 5.6, POSES.type],
      [10.0, 10.6, POSES.point],
      [12.8, 13.4, POSES.sit],
      [15.6, 16.6, POSES.back],
      [23.2, 24.0, POSES.sit],
      [24.8, 25.6, POSES.reach],
      [26.5, 27.4, POSES.lean],
      [29.4, 30.6, POSES.up],
    ],
    her: [
      [1.3, 1.8, POSES.reach],
      [3.2, 3.7, POSES.type],
      [6.0, 6.8, POSES.sketch],
      [11.6, 12.3, POSES.sit],
      [13.2, 13.7, POSES.sip],
      [15.0, 15.6, POSES.sit],
      [16.0, 16.6, POSES.type],
      [17.6, 18.4, POSES.lean],
      [23.2, 24.0, POSES.sit],
      [24.8, 25.6, POSES.reach],
      [26.5, 27.4, POSES.lean],
      [29.4, 30.6, POSES.up],
    ],
  };

  const local = new THREE.Vector3();
  const headLocal = new THREE.Vector3();
  /** Turn the head (and a little of the chest) toward a world point. */
  const addGaze = (f, pose, target) => {
    f.root.worldToLocal(local.copy(target));
    f.root.worldToLocal(headLocal.copy(f.head));
    local.sub(headLocal);
    const yaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -1.1, 1.1);
    const pitch = THREE.MathUtils.clamp(-Math.atan2(local.y + 0.05, Math.hypot(local.x, local.z)), -0.7, 0.9);
    const tilt = pitch - (pose.spine[0] + pose.chest[0]) * 0.7;
    pose.chest[1] += yaw * 0.2;
    pose.neck[1] += yaw * 0.35;
    pose.head[1] += yaw * 0.45;
    pose.neck[0] += tilt * 0.4;
    pose.head[0] += tilt * 0.6;
  };

  /**
   * Turn the right wrist so the cup in (or about to be in) the hand stands
   * upright, tipped by `tip` toward the mouth, the fingers running the way the
   * forearm does. `turn` blends from the wrist's rest. A held cup is then set
   * exactly: upright (or tipped by `tip`), its handle where it stood.
   */
  const elbowAt = new THREE.Vector3();
  const toFace = new THREE.Vector3();
  const cupUp = new THREE.Vector3();
  const along = new THREE.Vector3();
  const across = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const qWant = new THREE.Quaternion();
  const qParent = new THREE.Quaternion();
  const qWrist = new THREE.Quaternion();
  const qCup = new THREE.Quaternion();
  const orientCup = (f, who, turn, tip) => {
    const D = DRINKS[who];
    const s = D.hand;
    const H = f.handRig[s];
    const { cup, yaw } = table.cups[who];
    H.bone.quaternion.copy(f.wristRest[s]);
    H.bone.updateMatrixWorld(true);
    if (turn <= 0) return;
    // Back toward the face: the way they sit, reversed.
    toFace.set(-Math.sin(f.root.rotation.y), 0, -Math.cos(f.root.rotation.y));
    cupUp.copy(UP).multiplyScalar(Math.cos(tip)).addScaledVector(toFace, Math.sin(tip));
    if (D.handle) {
      // By the handle: the palm faces the cup, so the hand turns with the cup's yaw.
      across.set(Math.cos(yaw), 0, -Math.sin(yaw));
      across.addScaledVector(cupUp, -across.dot(cupUp)).normalize();
      along.crossVectors(across, cupUp);
    } else {
      // Round the body: the fingers run the way the forearm does.
      f.bones[`${s}Elbow`].getWorldPosition(elbowAt);
      H.bone.getWorldPosition(along).sub(elbowAt);
      along.addScaledVector(cupUp, -along.dot(cupUp));
      if (along.lengthSq() < 1e-6) along.crossVectors(cupUp, toFace);
      along.normalize();
      across.crossVectors(cupUp, along);
    }
    qWant.setFromRotationMatrix(basis.makeBasis(across, cupUp, along));
    // The bone's world turn that puts the holder there, then into the parent's frame.
    qWrist.copy(qWant).multiply(qParent.copy(H.holder.quaternion).invert());
    H.bone.parent.getWorldQuaternion(qParent);
    qWrist.premultiply(qParent.invert());
    H.bone.quaternion.copy(f.wristRest[s]).slerp(qWrist, turn);
    H.bone.updateMatrixWorld(true);
    if (f.held[s] !== cup) return;
    qCup.setFromUnitVectors(UP, cupUp).multiply(qWant.setFromAxisAngle(UP, yaw));
    H.holder.getWorldQuaternion(qParent).invert();
    cup.quaternion.copy(qParent).multiply(qCup);
    cup.position.set(...D.grip).negate().applyQuaternion(qCup).applyQuaternion(qParent);
  };

  const sockets = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  /** After the final pose: where each hand's grip point sits off its wrist. */
  const measureGrip = (f) => {
    for (const s of ["l", "r"]) {
      f.socket(s === "l" ? "left" : "right").getWorldPosition(sockets);
      f.ik.arms[s].hand.getWorldPosition(wrist);
      f.gripOff[s].subVectors(sockets, wrist);
    }
  };

  const fix = new THREE.Vector3();
  const aimL = new THREE.Vector3();
  const aimR = new THREE.Vector3();
  const updateOne = (name, c, t) => {
    const f = cast[name];
    const pose = schedule(c, f.pose, POSES.sit, S[name]);
    pose.spine[0] += Math.sin(t * 1.6 + (name === "him" ? 0 : 1.9)) * 0.01;
    addGaze(f, pose, track(c, G[name], gazeAt[name]));
    // At the sip the head tips back a little to meet the cup.
    const turn = ramp(c, DRINKS[name].turn);
    const tip = ramp(c, DRINKS[name].tip);
    pose.neck[0] -= tip * 0.06;
    pose.head[0] -= tip * 0.14;
    f.apply(pose);
    f.root.updateMatrixWorld(true);
    const [kl, kr] = name === "him" ? [K.hL, K.hR] : [K.sL, K.sR];
    const i = name === "him" ? 0 : 2;
    const five = c > 24.6 && c < 27.2;
    // With a cup the wrist turn moves the grip, so solve, turn, re-measure and
    // solve again, folding back what the IK missed, so the cup lifts off its
    // saucer and lands back on it without a jump.
    const cupSide = DRINKS[name].hand;
    fix.set(0, 0, 0);
    for (let pass = turn > 0 ? 4 : 1; pass > 0; pass--) {
      const tl = track(c, kl, aim[i]);
      const tr = track(c, kr, aim[i + 1]);
      aimL.copy(tl);
      aimR.copy(tr);
      (cupSide === "l" ? aimL : aimR).add(fix);
      f.ik.solve(pose, "l", aimL, five && name === "her" ? HINT.lUp : HINT.l);
      f.ik.solve(pose, "r", aimR, five && name === "him" ? HINT.rUp : HINT.r);
      f.apply(pose);
      f.root.updateMatrixWorld(true);
      f.bones.head.getWorldPosition(f.head);
      orientCup(f, name, turn, tip * SIP_TILT);
      measureGrip(f);
      if (turn > 0) fix.add(cupSide === "l" ? tl : tr).sub(f.ik.arms[cupSide].hand.getWorldPosition(wrist));
    }
  };

  const updateCast = (c, t) => {
    const { him, her } = cast;
    // Cups, the pen, and the hand shapes, before the poses (so grips are measured with them in).
    holdIf(him, "l", table.cups.him.cup, c > 0.72 && c < 3.5, HOLD.him, rests.him);
    holdIf(her, "r", table.cups.her.cup, c > 12.85 && c < 15.25, HOLD.her, rests.her);
    holdIf(her, "l", table.pen, c > 6.25 && c < 12.1, HOLD.pen, restPen);
    if (!him.held.r) hand(him, "r", c > 10.2 && c < 13.0 ? "point" : c > 25.2 && c < 26.8 ? "fist" : "relaxed");
    if (!him.held.l) hand(him, "l", "relaxed");
    if (!her.held.l) hand(her, "l", c > 25.2 && c < 26.8 ? "fist" : "relaxed");
    if (!her.held.r) hand(her, "r", "relaxed");
    updateOne("him", c, t);
    updateOne("her", c, t);
  };

  /* ---- the cards ---- */
  const origin = (from, out) => {
    if (from === "napkin") return out.set(NAPKIN[0], T + 0.05, NAPKIN[1]);
    const lap = LAPTOPS[from];
    return out.set(lap.x, T + 0.22, lap.z);
  };
  // Low enough to sit well inside the aha shot's frame, clear of the lamp.
  const qFront = v3(0, 1.56, 0.25);
  const qRise = v3(0, 1.9, -1.2);
  const updateCards = (c, t) => {
    const gather = easeInOutCubic(segment(c, 23.3, 24.8));
    const flash = Math.exp(-(((c - 25.0) / 0.35) ** 2));
    const lit = segment(c, 24.6, 25.1);
    const rise = easeInOutCubic(segment(c, 29.4, 31.2));
    cards.forEach((card, i) => {
      const m = card.mesh;
      const born = segment(c, card.at, card.at + 0.9);
      if (born <= 0 || c > 31.2) {
        m.visible = false;
        return;
      }
      m.visible = true;
      origin(card.from, tmp);
      const p = card.pos.copy(tmp).lerp(card.slot, easeOutCubic(born));
      p.y += Math.sin(t * 1.3 + i * 1.7) * 0.015 * born;
      // Faded out of the way while the agent works over his shoulder (lifting
      // them would carry them up through the pendant lamp).
      const away = envelope(c, 14.6, 15.4, 22.6, 23.4);
      p.y += away * 0.1;
      let s = Math.max(0.001, easeOutBack(born));
      if (i === Q) {
        p.lerp(qFront, gather);
        s *= 1 + gather * 0.45 + flash * 0.2;
        p.lerp(qRise, rise);
        s *= 1 - rise * 0.6;
        m.material.map = c > 25.0 ? bulbMap : questionMap;
        const glow = 0.86 + flash * 2.4 + lit * 0.5 * (1 - rise);
        m.material.color.setScalar(glow);
        m.material.opacity = (1 - segment(c, 30.4, 31.2)) * (1 - away);
      } else {
        p.lerp(cards[Q].slot, gather);
        s *= 1 - gather;
        m.visible = s > 0.01 && away < 0.99;
        m.material.color.setScalar(0.86);
        // Gone before the "?" lights: nothing passes over the bulb.
        m.material.opacity = (1 - away) * (1 - segment(c, 23.9, 24.5));
      }
      m.position.copy(p);
      m.quaternion.copy(camera.quaternion);
      m.rotateZ(Math.sin(t * 0.9 + i * 2.1) * 0.05);
      m.scale.setScalar(s);
    });
    // The halo behind the lit card.
    const q = cards[Q].mesh;
    halo.visible = q.visible && c > 24.4;
    halo.position.copy(q.position).addScaledVector(tmp.set(0, 0, -1).applyQuaternion(camera.quaternion), 0.01);
    halo.quaternion.copy(camera.quaternion);
    halo.scale.setScalar(q.scale.x * (1 + flash * 0.6));
    halo.material.opacity = (flash * 0.9 + lit * 0.45) * (1 - segment(c, 30.2, 31.2));
  };

  /* ---- camera: five fixed shots, each with a slow move ---- */
  const SHOTS = [
    { t: 0, from: v3(1.05, 1.28, 2.35), to: v3(0.8, 1.22, 2.05), lookFrom: v3(0, 0.98, 0), lookTo: v3(0, 0.98, -0.05) },
    { t: 6, from: v3(-0.35, 1.5, 2.55), to: v3(0.25, 1.56, 2.35), lookFrom: v3(0, 1.28, 0), lookTo: v3(0, 1.32, 0) },
    { t: 15, zoom: 1.4, from: v3(-1.06, 1.38, 0.42), to: v3(-0.98, 1.35, 0.36), lookFrom: v3(-0.08, 0.98, -0.07), lookTo: v3(-0.05, 0.97, -0.06) },
    { t: 23, from: v3(0.2, 1.22, 1.95), to: v3(0.05, 1.26, 1.75), lookFrom: v3(0, 1.18, 0), lookTo: v3(0, 1.22, 0) },
    { t: 29, from: v3(0, 1.25, 2.0), to: v3(0, 1.42, 3.15), lookFrom: v3(0, 1.22, 0), lookTo: v3(0, 1.55, -1.6) },
  ];
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const placeCamera = (c) => {
    let i = SHOTS.length - 1;
    while (i > 0 && c < SHOTS[i].t) i--;
    const shot = SHOTS[i];
    const end = SHOTS[i + 1]?.t ?? LOOP;
    const k = easeInOutCubic(segment(c, shot.t, end));
    camPos.lerpVectors(shot.from, shot.to, k);
    camLook.lerpVectors(shot.lookFrom, shot.lookTo, k);
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.04;
    camera.position.y += pointer.y * 0.03;
    camera.lookAt(camLook);
    camera.updateMatrixWorld();
    const zoom = shot.zoom ?? 1;
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  };

  let settled = false;
  const update = (time) => {
    const t = staticMode ? STATIC_TIME : time;
    const c = ((t % LOOP) + LOOP) % LOOP;
    now = c;
    placeCamera(c);

    // Lids, screens, the agent's build.
    const lids = { her: easeInOutCubic(segment(c, 1.8, 3.2)), him: easeInOutCubic(segment(c, 4.0, 4.9)) };
    const build = segment(c, 15.6, 22.2);
    for (const who of ["him", "her"]) {
      const lap = table.laptops[who];
      lap.open(lids[who]);
      const u = lap.screenMat.uniforms;
      u.uTime.value = t + (who === "her" ? 3.7 : 0);
      u.uOn.value = segment(lids[who], 0.4, 1);
      u.uBuild.value = build;
    }

    // Napkin sketch and the dream drawing itself.
    table.sketchMat.uniforms.uReveal.value = segment(c, 6.7, 11.4);
    dreamMat.uniforms.uReveal.value = segment(c, 30.2, 33.4);
    dreamMat.uniforms.uAlpha.value = segment(c, 30.0, 30.4) * (1 - segment(c, 35.2, 35.9));

    // The window light swells for the dream.
    const swell = easeInOutCubic(segment(c, 29.6, 33.5)) * (1 - segment(c, 35.3, 36));
    cafe.viewMat.color.setScalar(0.98 + swell * 0.12);
    cafe.shafts.forEach((s) => (s.material.uniforms.uIntensity.value = 0.05 + swell * 0.07));
    cafe.tablePatch.material.uniforms.uOpacity.value = 0.05 + swell * 0.07;
    cafe.floorPatch.material.uniforms.uOpacity.value = 0.06 + swell * 0.06;
    motes.material.uniforms.uGain.value = 0.8 + swell * 0.8;
    softPoints.forEach((p) => (p.material.uniforms.uTime.value = t));

    if (cast.him?.ik && cast.her?.ik) {
      // The first frame runs twice: grips are measured from the frame before.
      if (!settled) updateCast(c, t);
      settled = true;
      updateCast(c, t);
    }
    for (const who of ["him", "her"]) table.cups[who].cup.getWorldPosition(steam[who].material.uniforms.uOrigin.value).y += 0.045;
    updateCards(c, t);

    // A dip to black over the seam.
    cuts.update({ black: staticMode ? 0 : Math.max(1 - segment(c, 0, 0.6), segment(c, 35.3, 35.95)) });
  };

  const BASE_FOV = camera.fov;
  const unsubscribeResize = stage.onResize(({ height, aspect }) => {
    w.bu.uAspect.value = aspect;
    // Wider than the stage's lens for the cards over the table; wider again in
    // the slightly portrait half-frame rather than lose the table.
    camera.fov = BASE_FOV * 1.16 * Math.max(1, (1.3 / aspect) ** 0.55);
    camera.updateProjectionMatrix();
    const scale = (height * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    softPoints.forEach((p) => (p.material.uniforms.uScale.value = scale));
    w.sync();
  });

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      cuts.dispose();
      camera.fov = BASE_FOV;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = exposureWas;
      // Textures held in shader uniforms, and the cards' swapped-out map.
      textures.forEach((tx) => tx.dispose());
    },
  };
};
