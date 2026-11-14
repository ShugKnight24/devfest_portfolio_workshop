import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createInkWorld } from "../rezeKit";
import { canvasTexture, createParticles, easeInOutCubic, hash, hdr, lerp, lightBeam, segment, softDot } from "../kit";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { outline, outlineMaterial } from "../ink";

/**
 * The 110th Special Investigators — "you do not mess with the special
 * investigators." Four of them walk out of the dark, side by side, down the
 * middle of a wet street under one sodium light, and stop in a line.
 *
 *   0    – 1.3   fade up: an empty wet street, rain in the lamp's cone
 *   0    – 8.0   they walk, in step, out of the dark and under the light
 *   8.0  – 9.4   they slow; the last step lands
 *   8.7  – 10.5  settle: weight set, hands loose; Reacher folds his arms
 *                (right arm first, under; the left lands on top of it)
 *   10.5 – 13.0  the line-up (reduced motion holds this frame)
 *   13.0 – 14.0  fade to dark; they start again
 *
 * Left to right, as on the season-two poster: Neagley (a fitted dark
 * teal-green long-sleeve top, dark trousers, braids pulled up into a high
 * ponytail), Dixon (a black leather jacket with a big shearling collar over a
 * cream top, dark jeans, long wavy dark-brown hair), Reacher (by far the
 * biggest: short dark-blond hair, stubble, a plain olive crew-neck tee, jeans,
 * boots; arms folded for the hold) and O'Donnell (a grey wool blazer over a
 * dark shirt, slacks, swept blond hair and a short beard, hands in pockets).
 * The camera sits low and pushes in slowly with a little lateral drift.
 *
 * Lighting: one high-pressure sodium lamp overhangs the street just behind
 * the line, so the stop puts it on their heads and shoulders; on the four of
 * them it is cut toward white, and the rim and fill are cool and neutral so
 * the teal, olive, grey and cream read true. The street is a real mirror
 * (Reflector) broken up by puddles, rain rings and roughness, so the four of
 * them stand on their own reflections.
 */

const CYCLE = 14;
const STATIC_TIME = 11.6;
const WALK_END = 8; // constant speed until here
const STOP = 9.4; // the last step lands
const SPEED = 1.3; // m/s
const STRIDE = 1.5; // metres per full gait cycle (two steps)
const DISTANCE = SPEED * WALK_END + (SPEED * (STOP - WALK_END)) / 2;

// One sodium lamp: the cobra head overhangs the street from the right kerb.
const LAMP = new THREE.Vector3(1.3, 4.25, -1.8);
const POST_X = 3.9;
const SODIUM = new THREE.Color("#ffad5c");
const AIR = "#140f0d"; // fog: a dark sodium haze
const NIGHT = { ground: "#05070b", lines: "#5c3c22", accent: "#140c06", rim: "#b4c2d8", shade: "#7086b4" };

/** Light at a world point from the lamp, in key units (1 ≈ well lit). */
// Bodies: a front-leaning key, a brighter cool fill so cloth colours read.
const FRONT = new THREE.Vector3(0.15, 0.45, 1).normalize();
const WHITE_KEY = new THREE.Color("#fff1dc");
// The lamp on the bodies, cut mostly to white: sodium alone turns teal and olive to mud.
const BODY_KEY = SODIUM.clone().lerp(WHITE_KEY, 0.62);
const FILL = new THREE.Color("#a9b7d2");
const lampAt = (p) => 27 / (9 + p.distanceToSquared(LAMP));

// ── Poses ──────────────────────────────────────────────────────────────────
/**
 * A walk at gait phase `phi`. Left leg angle is A·sin(phi) (positive = back),
 * so the left leg swings forward while cos(phi) < 0; arms run opposite the
 * legs, the pelvis twists and drops on the swing side, the chest counters,
 * and the hips bob lowest at double support. `amp` scales it down to a stop.
 */
const walkPose = (phi, g, amp) => {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const A = g.stride * amp;
  const knee = (ph) => {
    const u = ((((ph - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / Math.PI;
    // Swing: the knee folds early, then reaches; stance: a little give at heel strike.
    if (u < 1) return 0.07 + g.knee * amp * Math.sin(Math.PI * u ** 0.7);
    return 0.07 + 0.16 * amp * Math.sin(Math.PI * Math.min(1, (u - 1) / 0.45));
  };
  const as = Math.sin(phi - 0.25) * amp; // arms trail the legs a touch
  const arms = g.pocket
    ? {
        lShoulder: [0.13 - 0.05 * as, 0, 0.07],
        lElbow: [-0.42, 0, 0],
        rShoulder: [0.13 + 0.05 * as, 0, -0.07],
        rElbow: [-0.42, 0, 0],
      }
    : {
        lShoulder: [-g.arm * as + 0.03, 0, g.armOut],
        lElbow: [-(0.22 + 0.25 * Math.max(0, as)), 0, 0],
        rShoulder: [g.arm * as + 0.03, 0, -g.armOut],
        rElbow: [-(0.22 + 0.25 * Math.max(0, -as)), 0, 0],
      };
  return {
    hips: [0.03, 0.07 * s * amp, 0.04 * g.roll * c * amp],
    spine: [g.lean, 0, -0.02 * g.roll * c * amp],
    chest: [0.0, -0.13 * s * amp, 0],
    neck: [0, 0.03 * s * amp, 0],
    head: [-0.02 - g.lean * 0.6, 0.03 * s * amp, -0.02 * g.roll * c * amp],
    ...arms,
    lHip: [A * s - 0.04, 0, 0.025],
    rHip: [-A * s - 0.04, 0, -0.025],
    lKnee: [knee(phi), 0, 0],
    rKnee: [knee(phi + Math.PI), 0, 0],
    lift: -(g.bob * s * s + 0.01) * amp,
  };
};

// The line-up. Each one stands like themselves.
// Square, feet apart, chin level; the arms come from FOLD.
const REACHER_STAND = {
  spine: [-0.02, 0, 0],
  chest: [-0.04, 0, 0],
  neck: [0.02, 0, 0],
  head: [0.04, 0, 0],
  lHip: [0, 0, 0.08],
  lKnee: [0.03, 0, 0],
  rHip: [0, 0, -0.08],
  rKnee: [0.03, 0, 0],
  lift: -0.01,
};
/**
 * Reacher's folded arms, as wrist targets in his own frame (metres for a
 * 2 m man, facing +z; left is +x) with the way each elbow points. The right
 * forearm crosses first, low and close to the body, its hand tucked under the
 * left arm; the left forearm lies on top of it, further out, its hand over the
 * right biceps.
 */
const FOLD = {
  r: { wrist: [0.02, 1.28, 0.185], hint: [-1, -0.4, 0.15] },
  l: { wrist: [-0.02, 1.36, 0.25], hint: [1, -0.4, 0.2] },
};
// Weight on her right leg, left knee soft, chin down, eyes on the street.
const NEAGLEY_STAND = {
  hips: [0, 0.06, -0.05],
  spine: [0, 0, 0.04],
  chest: [0, -0.04, 0.02],
  head: [0.06, -0.08, -0.02],
  lShoulder: [0.02, 0, 0.13],
  lElbow: [-0.3, 0, 0],
  rShoulder: [0.08, 0, -0.12],
  rElbow: [-0.55, 0, 0],
  lHip: [-0.06, 0, 0.07],
  lKnee: [0.2, 0, 0],
  rHip: [0.02, 0, -0.02],
  rKnee: [0.02, 0, 0],
  lift: -0.01,
};
// Weight on her left, right foot out, head tilted, chin up a touch.
const DIXON_STAND = {
  hips: [0, -0.08, 0.05],
  spine: [0, 0, -0.04],
  chest: [0, 0.05, -0.02],
  head: [-0.03, 0.06, 0.05],
  lShoulder: [0.04, 0, 0.12],
  lElbow: [-0.28, 0, 0],
  rShoulder: [-0.02, 0, -0.15],
  rElbow: [-0.35, 0, 0],
  lHip: [0.02, 0, 0.02],
  lKnee: [0.03, 0, 0],
  rHip: [-0.1, 0, -0.1],
  rKnee: [0.16, 0, 0],
  lift: -0.01,
};
// Square, hands in the trouser pockets under the blazer.
const ODONNELL_STAND = {
  chest: [-0.02, 0, 0],
  head: [0.02, 0.04, 0.03],
  lShoulder: [0.14, 0, 0.06],
  lElbow: [-0.42, 0, 0],
  rShoulder: [0.14, 0, -0.06],
  rElbow: [-0.42, 0, 0],
  lHip: [0, 0, 0.05],
  rHip: [0, 0, -0.05],
  lift: -0.008,
};

/** Hip swing for a stride of STRIDE on legs about half the body's height. */
const strideFor = (height) => STRIDE / (4 * 0.5 * height);

const CREW = [
  {
    // Frances Neagley: a fitted dark teal-green long-sleeve top, dark trousers,
    // her braids pulled tight back into a high ponytail (the close cap is the
    // pulled-back hair; the braids are built below).
    x: -1.76,
    z: -0.06,
    body: "SuperheroFemale",
    height: 1.68,
    hair: ["HairBuzzed", "EyebrowsFemale"],
    outfit: { skin: "#8a5a3f", top: "#1e3d38", bottom: "#17191f", shoes: "#0f0f10", hair: "#0d0a09", sleeves: "long" },
    braids: true,
    coat: null,
    neckline: null,
    jacket: "#1e3d38",
    gait: { arm: 0.32, armOut: 0.13, roll: 1.1, lean: 0.05, knee: 1.0 },
    stand: NEAGLEY_STAND,
    spec: 0.5,
    fist: 0.5,
    phase: 0.05,
  },
  {
    // Karla Dixon: a black leather jacket with a big black shearling collar, a
    // cream top under it, dark jeans, long wavy dark-brown hair.
    x: -0.62,
    z: 0.06,
    body: "SuperheroFemale",
    height: 1.72,
    hair: ["HairLong", "EyebrowsFemale"],
    outfit: { skin: "#e3b598", top: "#111113", collar: "#e9dfcc", bottom: "#1e2637", shoes: "#0e0e10", hair: "#3a2416", sleeves: "long" },
    coat: { top: 0.62, bottom: 0.5, gap: 0.55 },
    neckline: "fur",
    jacket: "#111113",
    gait: { arm: 0.28, armOut: 0.12, roll: 1.3, lean: 0.02, knee: 0.95 },
    stand: DIXON_STAND,
    spec: 1.6, // leather, wet
    fist: 0.45,
    phase: 0.12,
  },
  {
    // Jack Reacher: 6'5" and built like a wardrobe. Short dark-blond hair,
    // stubble, a plain olive crew-neck tee, jeans, brown boots.
    x: 0.52,
    z: 0.25,
    body: "SuperheroMale",
    height: 2.0,
    hair: ["HairBuzzed", "HairBeard", "EyebrowsRegular"],
    outfit: { skin: "#d6a37f", top: "#585c43", bottom: "#2b3a52", shoes: "#3a2819", hair: "#8a6a42", sleeves: "short" },
    coat: null,
    neckline: "crew",
    jacket: "#585c43",
    gait: { arm: 0.24, armOut: 0.17, roll: 0.6, lean: 0.035, knee: 0.9 },
    stand: REACHER_STAND,
    fold: FOLD,
    spec: 0.5,
    fist: 0.6,
    phase: 0,
  },
  {
    // David O'Donnell: a grey wool blazer over a dark shirt, slacks, swept
    // blond hair and a short beard; hands in his trouser pockets.
    x: 1.74,
    z: -0.18,
    body: "SuperheroMale",
    height: 1.82,
    hair: ["HairSimpleParted", "HairBeard", "EyebrowsRegular"],
    outfit: { skin: "#e3b597", top: "#6d6c6a", collar: "#27303d", bottom: "#2d2d31", shoes: "#121112", hair: "#b38e5c", sleeves: "long" },
    coat: { top: 0.62, bottom: 0.42, gap: 0.5 },
    neckline: "stand",
    jacket: "#6d6c6a",
    gait: { arm: 0.06, armOut: 0.07, roll: 0.5, lean: 0.01, knee: 0.9, pocket: true },
    stand: ODONNELL_STAND,
    spec: 0.5,
    fist: 0.6,
    phase: 0.2,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Half-width and half-depth of the bind-pose body in a height band (fractions of height), in metres. */
const girth = (fig, height, lo, hi, maxAx) => {
  let body = null;
  fig.model.traverse((m) => {
    if (!m.isSkinnedMesh || !m.material?.uniforms?.uKey) return;
    if (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) body = m;
  });
  const g = body.geometry;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const p = g.attributes.position;
  let rx = 0;
  let rz = 0;
  for (let i = 0; i < p.count; i++) {
    const ny = (p.getY(i) - min.y) / H;
    if (ny < lo || ny > hi) continue;
    const ax = Math.abs(p.getX(i) - cx) / H;
    if (ax > maxAx) continue;
    rx = Math.max(rx, ax);
    rz = Math.max(rz, Math.abs(p.getZ(i) - cz) / H);
  }
  return { rx: (rx || 0.1) * height, rz: (rz || 0.07) * height };
};

/**
 * Bind `object` (built in the figure's rest space) to a bone, so it rides the
 * pose. Its own axes stay the figure's axes at rest, so a child can swing
 * about x like a leg does.
 */
const bindTo = (bone, object) => {
  bone.attach(object);
  return object;
};

/** A coat or jacket skirt: two open panels from the waist that swing with the legs. */
const addCoat = (fig, spec, mat, line) => {
  const { height } = spec;
  const { top, bottom, gap } = spec.coat;
  const waist = girth(fig, height, top - 0.02, top + 0.02, 0.15);
  const hip = girth(fig, height, 0.46, 0.54, 0.2);
  const rTop = waist.rx * 1.12;
  const hipR = hip.rx * 1.1;
  const f = (top - 0.5) / (top - bottom);
  const rBot = Math.max(rTop + (hipR - rTop) / Math.max(0.2, f), hipR) + height * 0.012;
  const depth = Math.max(waist.rz / waist.rx, hip.rz / hip.rx) * 1.06;
  const len = (top - bottom) * height;

  const pivot = new THREE.Group();
  pivot.position.set(0, top * height, 0);
  bindTo(fig.bones.hips, pivot);
  const panels = [1, -1].map((side) => {
    const swing = new THREE.Group();
    pivot.add(swing);
    const start = side > 0 ? gap : Math.PI;
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20, 2, true, start, Math.PI - gap);
    geo.translate(0, -len / 2, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.z = depth;
    mesh.frustumCulled = false;
    outline(mesh, line);
    swing.add(mesh);
    return swing;
  });
  return { left: panels[0], right: panels[1] };
};

/** A stand collar on the shoulders, open at the front. */
const addCollar = (fig, height, mat, line) => {
  const neck = girth(fig, height, 0.835, 0.855, 0.07);
  const r = Math.max(neck.rx, neck.rz);
  const geo = new THREE.CylinderGeometry(r * 1.75, r * 1.45, height * 0.05, 22, 1, true, 0.75, Math.PI * 2 - 1.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, height * 0.838, -r * 0.15);
  mesh.rotation.x = -0.12; // leans back off the throat
  mesh.frustumCulled = false;
  outline(mesh, line);
  bindTo(fig.bones.chest ?? fig.bones.spine, mesh);
};

/** Front and back of the bind-pose body in a height band, within `maxAx` of the midline: z in metres from its centre. */
const depthAt = (fig, height, lo, hi, maxAx) => {
  let body = null;
  fig.model.traverse((m) => {
    if (!m.isSkinnedMesh || !m.material?.uniforms?.uKey) return;
    if (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) body = m;
  });
  const g = body.geometry;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const p = g.attributes.position;
  let front = -Infinity;
  let back = Infinity;
  for (let i = 0; i < p.count; i++) {
    const ny = (p.getY(i) - min.y) / H;
    if (ny < lo || ny > hi || Math.abs(p.getX(i) - cx) / H > maxAx) continue;
    front = Math.max(front, (p.getZ(i) - cz) / H);
    back = Math.min(back, (p.getZ(i) - cz) / H);
  }
  return { front: front * height, back: back * height };
};

/** A crew neck: the ribbed band round the base of the neck. */
const addCrewNeck = (fig, height, mat, line) => {
  const neck = girth(fig, height, 0.835, 0.855, 0.07);
  const r = Math.max(neck.rx, neck.rz);
  const geo = new THREE.TorusGeometry(r * 1.18, height * 0.0065, 6, 32);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 1, neck.rz / neck.rx);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, height * 0.836, -r * 0.05);
  mesh.rotation.x = 0.22; // dips at the throat
  mesh.frustumCulled = false;
  outline(mesh, line);
  bindTo(fig.bones.chest ?? fig.bones.spine, mesh);
};

/** A smooth hash of a position, so duplicated seam vertices move together. */
const posHash = (x, y, z) => hash(Math.round(x * 900) * 0.137 + Math.round(y * 900) * 0.291 + Math.round(z * 900) * 0.533);

/**
 * A shearling collar: a thick, shaggy roll round the neck and over the tops of
 * the shoulders, open at the throat, and its two lapels down onto the bust
 * either side of the top underneath.
 */
const addFurCollar = (fig, height, mat, line) => {
  const neck = girth(fig, height, 0.835, 0.855, 0.07);
  const r = Math.max(neck.rx, neck.rz);
  const R = r * 1.95;
  const tube = height * 0.03;
  const GAP = 1.25; // radians open at the front
  const ring = new THREE.TorusGeometry(R, tube, 9, 44, Math.PI * 2 - GAP);
  // Shag: push each vertex off the tube's core by a little noise.
  const p = ring.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const u = Math.atan2(y, x);
    const cx = R * Math.cos(u);
    const cy = R * Math.sin(u);
    const k = 0.82 + 0.38 * posHash(x, y, z);
    p.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, z * k);
  }
  ring.computeVertexNormals();
  // Lay it flat, the gap at the front (+z).
  ring.rotateX(Math.PI / 2);
  ring.rotateY(-(Math.PI / 2 + GAP / 2));
  ring.scale(1, 0.85, (neck.rz / neck.rx) * 1.05);
  ring.rotateX(0.2); // lower at the throat than at the nape
  ring.translate(0, height * 0.826, -r * 0.1);

  // Lapels: from the ends of the roll down to the bust, lying on the chest.
  const lapels = [1, -1].map((side) => {
    const top = new THREE.Vector3(side * R * Math.sin(GAP / 2), height * 0.818, R * Math.cos(GAP / 2) * (neck.rz / neck.rx) * 1.05 - r * 0.1);
    const yLow = 0.705;
    const chest = depthAt(fig, height, yLow - 0.01, yLow + 0.01, 0.06);
    const low = new THREE.Vector3(side * height * 0.055, height * yLow, chest.front + tube * 0.55);
    const len = top.distanceTo(low);
    const geo = new THREE.CapsuleGeometry(tube * 0.75, len, 4, 10);
    geo.scale(1.25, 1, 0.6);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(low).normalize());
    geo.applyQuaternion(q);
    const mid = top.clone().add(low).multiplyScalar(0.5);
    geo.translate(mid.x, mid.y, mid.z);
    return geo;
  });
  const mesh = new THREE.Mesh(mergeGeometries([ring, ...lapels]), mat);
  mesh.frustumCulled = false;
  outline(mesh, line);
  bindTo(fig.bones.chest ?? fig.bones.spine, mesh);
};

/**
 * Neagley's braids: gathered high at the back of the head in a band, arcing
 * back and falling between her shoulder blades. Each braid is a string of
 * beads, so it reads as a plait and not a rope.
 */
const addBraids = (fig, height, mat, line) => {
  let cap = null;
  fig.model.traverse((o) => o.isSkinnedMesh && /^hair/i.test(o.name) && (cap = o));
  const head = new THREE.Box3().setFromObject(cap, true);
  const k = height / 1.7;
  const gather = new THREE.Vector3(0, head.max.y - 0.045 * k, head.min.z + 0.018 * k);
  const back = depthAt(fig, height, 0.78, 0.84, 0.08).back;
  const geos = [];
  // The band and the gathered root.
  const band = new THREE.TorusGeometry(0.019 * k, 0.006 * k, 6, 16);
  band.rotateX(-0.9);
  band.translate(gather.x, gather.y, gather.z - 0.006 * k);
  geos.push(band);
  const root = new THREE.SphereGeometry(0.024 * k, 10, 8);
  root.scale(1, 0.9, 1.1);
  root.translate(gather.x, gather.y + 0.004 * k, gather.z - 0.016 * k);
  geos.push(root);
  const UPV = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const N = 9;
  for (let b = 0; b < N; b++) {
    const s = (b / (N - 1)) * 2 - 1; // -1 … 1 across the bunch
    const j = hash(b * 3.1 + 2);
    const curve = new THREE.CatmullRomCurve3([
      gather.clone().add(new THREE.Vector3(s * 0.012 * k, 0.006 * k, -0.02 * k)),
      gather.clone().add(new THREE.Vector3(s * 0.03 * k, 0.012 * k, -0.07 * k)),
      gather.clone().add(new THREE.Vector3(s * 0.045 * k, -0.07 * k, -0.105 * k)),
      new THREE.Vector3(s * 0.055 * k, height * 0.83, back - 0.04 * k - 0.01 * j),
      new THREE.Vector3(s * 0.06 * k + (j - 0.5) * 0.012, height * (0.77 - 0.025 * j), back - 0.035 * k),
    ]);
    const M = 22;
    for (let i = 0; i < M; i++) {
      const t = (i + 0.5) / M;
      const at = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const rad = (0.0105 - 0.004 * t) * k;
      const bead = new THREE.SphereGeometry(rad, 7, 5);
      bead.scale(1, 1.7, 1);
      bead.rotateY(i % 2 ? 0.5 : -0.5); // the plait's alternating lean
      bead.applyQuaternion(q.setFromUnitVectors(UPV, tan));
      bead.translate(at.x, at.y, at.z);
      geos.push(bead);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
  mesh.frustumCulled = false;
  outline(mesh, line);
  bindTo(fig.bones.head, mesh);
};

/**
 * Two-bone arm IK (after breakfastScene's): writes the shoulder and elbow
 * angles that put the `s` wrist on `target` (the figure's frame, its root at
 * the origin) into `pose`, the elbow pointing along `hint`. The figure must
 * already be applied in `pose` without its arms.
 */
const createArmSolver = (fig) => {
  fig.apply({});
  fig.root.updateMatrixWorld(true);
  const at = (o) => o.getWorldPosition(new THREE.Vector3());
  const arms = {};
  for (const s of ["l", "r"]) {
    const sh = fig.bones[`${s}Shoulder`];
    const el = fig.bones[`${s}Elbow`];
    const hand = fig.model.getObjectByName(`hand_${s}`);
    arms[s] = { sh, l1: at(sh).distanceTo(at(el)), l2: at(el).distanceTo(at(hand)) };
  }
  const euler = new THREE.Euler();
  const rot = (r) => new THREE.Quaternion().setFromEuler(euler.set(...(r ?? [0, 0, 0])));
  return (pose, s, target, hint) => {
    const { sh, l1, l2 } = arms[s];
    const body = rot(pose.hips).multiply(rot(pose.spine)).multiply(rot(pose.chest));
    const inv = body.clone().invert();
    const d = target.clone().sub(at(sh)).applyQuaternion(inv);
    const len = THREE.MathUtils.clamp(d.length(), Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.998);
    const e = -Math.acos(THREE.MathUtils.clamp((len * len - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1));
    const reach = new THREE.Vector3(0, -l1 - l2 * Math.cos(e), -l2 * Math.sin(e)).normalize();
    d.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(reach, d);
    // Roll about the shoulder–wrist line until the elbow points along the hint.
    const elbow = new THREE.Vector3(0, -1, 0).applyQuaternion(q);
    const h = hint.clone().applyQuaternion(inv);
    const a = elbow.addScaledVector(d, -d.dot(elbow));
    const b = h.addScaledVector(d, -d.dot(h));
    const phi = Math.atan2(d.dot(new THREE.Vector3().crossVectors(a, b)), a.dot(b));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(d, phi));
    euler.setFromQuaternion(q, "XYZ");
    pose[`${s}Shoulder`] = [euler.x, euler.y, euler.z];
    pose[`${s}Elbow`] = [e, 0, 0];
  };
};

/** Soft blob texture for contact and lamp shadows: dense at the feet (v = 0), fading out. */
const shadowTexture = (long) =>
  canvasTexture(
    64,
    long ? 256 : 64,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = (x + 0.5) / w - 0.5;
          const v = 1 - (y + 0.5) / h; // 0 at the bottom of the canvas = feet
          let a;
          if (long) {
            const width = 0.5 * (1 - v * 0.45);
            a = Math.max(0, 1 - (Math.abs(u) / width) ** 2) * (1 - v) ** 1.3 * Math.min(1, v * 12 + 0.4);
          } else {
            const r = Math.hypot(u, v - 0.5) * 2;
            a = Math.max(0, 1 - r * r) ** 1.5;
          }
          const i = (y * w + x) * 4;
          img.data[i] = 255;
          img.data[i + 1] = 255;
          img.data[i + 2] = 255;
          img.data[i + 3] = Math.round(a * 255);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { color: false },
  );

// Shared GLSL: hash, value noise, fbm, and the lamp's light on a surface.
const NOISE = /* glsl */ `
  float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;
const LAMP_UNIFORMS = () => ({
  uLamp: { value: LAMP.clone() },
  uLampColor: { value: SODIUM.clone() },
  uLampPower: { value: 30 },
  uAmbient: { value: new THREE.Color(0.02, 0.026, 0.042) },
  uFog: { value: new THREE.Color(AIR) },
  uFogRange: { value: new THREE.Vector2(9, 42) },
});

/** The wet street: a mirror broken up by puddles, rings, paint and grain, lit by the lamp. */
const StreetShader = {
  name: "WetStreet",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    ...LAMP_UNIFORMS(),
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vW;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uLampPower;
    uniform vec3 uLamp, uLampColor, uAmbient, uFog;
    uniform vec2 uFogRange;
    varying vec4 vUv;
    varying vec3 vW;
    ${NOISE}
    // Rain rings: a few expanding circles per cell, as a uv push outward.
    vec2 ripples(vec2 p, float t) {
      vec2 off = vec2(0.0);
      for (int k = 0; k < 2; k++) {
        float fk = float(k);
        vec2 q = p * (1.9 + fk * 1.2) + fk * 17.3;
        vec2 id = floor(q);
        vec2 f = fract(q) - 0.5;
        vec2 c = (vec2(h21(id + 3.1), h21(id + 5.7)) - 0.5) * 0.45;
        float ph = fract(t * (0.75 + 0.4 * h21(id + 9.2)) + h21(id));
        vec2 d = f - c;
        float r = length(d);
        float wv = exp(-pow((r - ph * 0.42) * 26.0, 2.0)) * (1.0 - ph);
        off += d / max(r, 1e-3) * wv;
      }
      return off;
    }
    void main() {
      vec3 P = vW;
      vec3 V = normalize(cameraPosition - P);

      // Asphalt: grain and aggregate; puddles where the fbm pools.
      float n = fbm(P.xz * 0.3 + vec2(3.1, 7.7));
      float puddle = smoothstep(0.5, 0.58, n + 0.07 * vnoise(P.xz * 3.0));
      float grain = vnoise(P.xz * 38.0) * 0.6 + vnoise(P.xz * 7.0) * 0.4;
      vec3 albedo = vec3(0.03, 0.031, 0.034) * (0.65 + 0.7 * grain);

      // Paint: a worn double yellow down the middle, white edge lines, a crosswalk ahead.
      float wear = smoothstep(0.2, 0.62, vnoise(P.xz * vec2(4.0, 1.1)));
      float yellow = 1.0 - smoothstep(0.045, 0.058, abs(abs(P.x) - 0.1));
      float edgeLine = 1.0 - smoothstep(0.05, 0.064, abs(abs(P.x - 0.0) - 3.15));
      float bars = (1.0 - smoothstep(0.2, 0.215, abs(fract(P.x / 0.9 + 0.5) - 0.5) * 0.9)) * step(1.5, P.z) * step(P.z, 4.4) * step(abs(P.x), 2.95);
      float paint = max(yellow, max(edgeLine, bars)) * wear;
      vec3 paintCol = mix(vec3(0.36), vec3(0.42, 0.28, 0.04), yellow);
      albedo = mix(albedo, paintCol, paint * (1.0 - puddle * 0.7));

      // The lamp on the ground: inverse square and cosine.
      vec3 Ld = uLamp - P;
      float d2 = dot(Ld, Ld);
      float dl = sqrt(d2);
      vec3 L = Ld / dl;
      float E = uLampPower * max(L.y, 0.0) / (d2 + 1.0);
      vec3 col = albedo * (uAmbient + uLampColor * E) * (1.0 - puddle * 0.6);

      // Reflection: rippled and smeared vertically on wet asphalt, clean in puddles.
      float cosT = clamp(V.y, 0.0, 1.0);
      float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
      vec2 uv = vUv.xy / vUv.w;
      vec2 rough = (vec2(vnoise(P.xz * 6.0), vnoise(P.xz * 6.0 + 4.7)) - 0.5) * 0.014 * (1.0 - puddle);
      uv += rough + ripples(P.xz, uTime) * 0.006 * (0.4 + puddle);
      float sp = mix(0.016, 0.0025, puddle);
      vec3 refl = texture2D(tDiffuse, uv).rgb * 0.3;
      refl += texture2D(tDiffuse, uv + vec2(0.0, sp)).rgb * 0.2;
      refl += texture2D(tDiffuse, uv - vec2(0.0, sp)).rgb * 0.2;
      refl += texture2D(tDiffuse, uv + vec2(0.0, sp * 2.2)).rgb * 0.15;
      refl += texture2D(tDiffuse, uv - vec2(0.0, sp * 2.2)).rgb * 0.15;
      float reflAmt = (mix(0.4, 1.0, puddle) * F + 0.04) * (1.0 - paint * 0.45);
      col += refl * reflAmt;

      // A broad sodium glare on the wet asphalt, running toward the camera.
      vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
      float glare = pow(max(dot(R, L), 0.0), 28.0) * (1.0 - puddle * 0.7);
      col += uLampColor * glare * E * F * 2.2;

      float depth = length(P - cameraPosition);
      col = mix(col, uFog, smoothstep(uFogRange.x, uFogRange.y, depth) * 0.9);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

/** Kerbs and pavements: the same lamp and fog, no mirror. */
const surfaceMaterial = (albedo) =>
  new THREE.ShaderMaterial({
    uniforms: { uAlbedo: { value: new THREE.Color(albedo) }, ...LAMP_UNIFORMS() },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      varying vec3 vN;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uAlbedo, uLamp, uLampColor, uAmbient, uFog;
      uniform float uLampPower;
      uniform vec2 uFogRange;
      varying vec3 vW;
      varying vec3 vN;
      ${NOISE}
      void main() {
        vec3 N = normalize(vN);
        vec3 Ld = uLamp - vW;
        float d2 = dot(Ld, Ld);
        vec3 L = Ld * inversesqrt(d2);
        float E = uLampPower * max(dot(N, L), 0.0) / (d2 + 1.0);
        // Paving slabs: a joint every 1.5 m along the street.
        float joint = smoothstep(0.0, 0.03, abs(fract(vW.z / 1.5) - 0.5) * 1.5 - 0.0) * 0.4 + 0.6;
        vec3 albedo = uAlbedo * (0.75 + 0.5 * vnoise(vW.xz * 20.0)) * mix(1.0, joint, step(0.5, N.y));
        vec3 col = albedo * (uAmbient + uLampColor * E);
        vec3 V = normalize(cameraPosition - vW);
        col += uLampColor * pow(max(dot(reflect(-V, N), L), 0.0), 24.0) * E * 0.25;
        col = mix(col, uFog, smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition)) * 0.9);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

/** Rain as short streaks, bright where they fall through the lamp's cone. */
const createRain = (count) => {
  const min = new THREE.Vector3(-7, 0, -17);
  const size = new THREE.Vector3(14, 7.5, 23);
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = min.x + hash(i * 1.13) * size.x;
    const y = min.y + hash(i * 2.71 + 4) * size.y;
    const z = min.z + hash(i * 3.97 + 9) * size.z;
    const s = hash(i * 5.3 + 1);
    for (let k = 0; k < 2; k++) {
      pos.set([x, y, z], (i * 2 + k) * 3);
      end[i * 2 + k] = k;
      seed[i * 2 + k] = s;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMin: { value: min }, uSize: { value: size }, uLamp: { value: LAMP.clone() }, uLampColor: { value: SODIUM.clone() } },
    vertexShader: /* glsl */ `
      attribute float aEnd;
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uMin, uSize, uLamp, uLampColor;
      varying vec3 vC;
      varying float vA;
      void main() {
        vec3 p = position;
        float fall = uTime * 8.5 * (0.85 + 0.3 * aSeed);
        p.y = uMin.y + mod(p.y - uMin.y - fall, uSize.y);
        p.x += (uSize.y - (p.y - uMin.y)) * 0.07;
        p -= normalize(vec3(0.07, -1.0, 0.0)) * (0.28 + 0.18 * aSeed) * aEnd;
        vec2 dl = p.xz - uLamp.xz;
        float cone = exp(-dot(dl, dl) / 7.0) * smoothstep(uLamp.y + 0.1, uLamp.y - 0.7, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        vA = (0.05 + 1.5 * cone) * (1.0 - smoothstep(12.0, 26.0, depth)) * smoothstep(0.8, 2.0, depth) * (1.0 - aEnd * 0.9);
        vC = mix(vec3(0.5, 0.58, 0.72), uLampColor * 1.4, cone);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vC;
      varying float vA;
      void main() {
        gl_FragColor = vec4(vC, clamp(vA, 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 15;
  return lines;
};

/** A sedan's side profile, extruded: length along z (front at +z), parked. */
const buildCar = (w, line) => {
  const car = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-2.35, 0.35);
  s.lineTo(-2.4, 0.62);
  s.lineTo(-2.3, 0.84);
  s.lineTo(-1.45, 0.9);
  s.lineTo(-0.95, 1.32);
  s.lineTo(0.35, 1.38);
  s.lineTo(0.95, 0.97);
  s.lineTo(2.2, 0.83);
  s.lineTo(2.38, 0.62);
  s.lineTo(2.3, 0.35);
  s.lineTo(1.82, 0.35);
  s.absarc(1.4, 0.35, 0.42, 0, Math.PI, false);
  s.lineTo(-1.03, 0.35);
  s.absarc(-1.45, 0.35, 0.42, 0, Math.PI, false);
  s.lineTo(-2.35, 0.35);
  const width = 1.78;
  const bevel = 0.06;
  const geo = new THREE.ExtrudeGeometry(s, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: 0.05, bevelSegments: 3, curveSegments: 10 });
  geo.translate(0, 0, -(width - bevel * 2) / 2);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  const paint = w.ink({ tint: "#1d2430", tone: 0.55, rim: 0.5, spec: 2.2 });
  const body = new THREE.Mesh(geo, paint);
  outline(body, line);
  car.add(body);

  const glass = w.ink({ tint: "#0a0d13", tone: 0.4, rim: 0.3, spec: 3 });
  glass.side = THREE.DoubleSide;
  const pane = (pts) => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))));
    g.rotateY(-Math.PI / 2);
    return g;
  };
  const windows = [
    [[-1.3, 0.97], [-0.88, 1.27], [-0.24, 1.3], [-0.24, 0.97]],
    [[-0.12, 0.97], [-0.12, 1.31], [0.3, 1.32], [0.8, 0.99]],
  ];
  for (const side of [-1, 1]) {
    for (const pts of windows) {
      const m = new THREE.Mesh(pane(pts), glass);
      m.position.x = side * (width / 2 + 0.004);
      car.add(m);
    }
  }
  const windscreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), glass);
  windscreen.position.set(0, 1.18, 0.65);
  windscreen.rotation.x = -0.96;
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), glass);
  rear.position.set(0, 1.12, -1.2);
  rear.rotation.x = -2.26;
  car.add(windscreen, rear);

  const rubber = w.ink({ tint: "#101012", tone: 0.4, rim: 0.4, spec: 0.3 });
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 22);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const z of [1.4, -1.45]) {
    for (const x of [-0.8, 0.8]) {
      const wheel = new THREE.Mesh(wheelGeo, rubber);
      wheel.position.set(x, 0.34, z);
      car.add(wheel);
    }
  }
  // Unlit lamps: they still catch the sodium light.
  const tail = w.ink({ tint: "#6a1010", tone: 0.7, rim: 0.4, spec: 2 });
  const head = w.ink({ tint: "#cfcabb", tone: 0.8, rim: 0.4, spec: 2 });
  for (const x of [-0.62, 0.62]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.04), tail);
    t.position.set(x, 0.76, -2.39);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.04), head);
    h.position.set(x, 0.7, 2.37);
    car.add(t, h);
  }
  return { car, materials: [paint, glass, rubber, tail, head] };
};

/** A cobra-head street lamp on the right kerb; `main` is the one that lights the scene. */
const buildLamp = (w, line, { postX, head, glow }) => {
  const g = new THREE.Group();
  const metal = w.ink({ tint: "#2b2d31", tone: 0.5, rim: 0.6, spec: 1.2 });
  const top = head.y + 0.05;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, top, 12), metal);
  post.position.set(postX, top / 2 + 0.15, head.z);
  outline(post, line);
  const out = Math.sign(head.x - postX);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(postX, top + 0.1, head.z), new THREE.Vector3(postX + out * 0.25, top + 0.42, head.z), new THREE.Vector3(head.x - out * 0.2, head.y + 0.16, head.z));
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.04, 8), metal);
  const housing = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 10), metal);
  housing.scale.set(1.25, 0.32, 0.62);
  housing.position.set(head.x, head.y + 0.1, head.z);
  outline(housing, line);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: hdr("#ffb468", glow) }));
  lens.rotation.x = Math.PI / 2;
  lens.scale.set(1.3, 0.62, 1);
  lens.position.set(head.x, head.y + 0.03, head.z);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: hdr("#ffa456", glow * 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(lens.position);
  halo.scale.setScalar(2.4 + glow * 0.08);
  g.add(post, arm, housing, lens, halo);
  return { group: g, metal };
};

// ── Scene ──────────────────────────────────────────────────────────────────

export const createSpecialInvestigatorsScene = (stage) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene, line } = w;
  const disposables = [];

  // The fade sits on layer 1: the main camera sees it, the street's mirror does not.
  camera.layers.enable(1);
  const onlyMain = (o) => {
    o.layers.set(1);
    return o;
  };

  // ── The street ──
  const street = new Reflector(new THREE.PlaneGeometry(32, 72), { shader: StreetShader, clipBias: 0.003, textureWidth: 512, textureHeight: 512, multisample: 4 });
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, -20);
  scene.add(street);
  const su = street.material.uniforms;
  disposables.push(() => street.dispose());

  const pavement = surfaceMaterial("#2c2d31");
  const kerb = surfaceMaterial("#4a4a4c");
  for (const [x0, x1] of [
    [3.4, 9.5],
    [-10.5, -4.6],
  ]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.15, 72), pavement);
    slab.position.set((x0 + x1) / 2, 0.075, -20);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 72), kerb);
    edge.position.set(x0 > 0 ? x0 + 0.1 : x1 - 0.1, 0.08, -20);
    scene.add(slab, edge);
  }

  // Buildings down both sides, a few windows still lit; a wall closes the far end.
  const brick = [w.ink({ tint: "#2d2a2c", tone: 0.32, rim: 0.25, spec: 0 }), w.ink({ tint: "#262a31", tone: 0.32, rim: 0.25, spec: 0 })];
  const winGeo = new THREE.PlaneGeometry(0.85, 1.15);
  const windows = [];
  for (const side of [-1, 1]) {
    let z = 6;
    let k = side > 0 ? 0 : 50;
    while (z > -50) {
      const width = 4 + hash(k * 1.7) * 4.5;
      const height = 6 + hash(k * 2.3 + 1) * 8;
      const face = side > 0 ? 9.5 : -10.5;
      const block = new THREE.Mesh(new THREE.BoxGeometry(6, height, width - 0.2), brick[k % 2]);
      block.position.set(face + side * 3, height / 2, z - width / 2);
      outline(block, line);
      scene.add(block);
      for (let fl = 0; fl < Math.floor((height - 1.5) / 2.6); fl++) {
        for (let col = 0; col < Math.floor(width / 1.8); col++) {
          const r = hash(k * 13.1 + fl * 3.7 + col * 1.9);
          if (r > 0.16) continue;
          windows.push({ x: face - side * 0.01, y: 2.2 + fl * 2.6, z: z - 1 - col * 1.8, warm: r < 0.11, side });
        }
      }
      z -= width;
      k += 1;
    }
  }
  const farWall = new THREE.Mesh(new THREE.BoxGeometry(24, 11, 1), brick[1]);
  farWall.position.set(0, 5.5, -50);
  scene.add(farWall);
  const winMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const winMesh = new THREE.InstancedMesh(winGeo, winMat, Math.max(1, windows.length));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const tint = new THREE.Color();
  windows.forEach((wn, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), wn.side > 0 ? -Math.PI / 2 : Math.PI / 2);
    m4.compose(new THREE.Vector3(wn.x, wn.y, wn.z), q, one);
    winMesh.setMatrixAt(i, m4);
    // Distance does the fog's job for unlit glass.
    const fade = 0.25 + 0.75 * Math.exp(-Math.max(0, -wn.z - 6) / 22);
    tint.set(wn.warm ? "#d79a52" : "#6f86a8").multiplyScalar(0.55 * fade);
    winMesh.setColorAt(i, tint);
  });
  winMesh.count = windows.length;
  scene.add(winMesh);

  // The lamp, and a dimmer one far down the street for depth.
  const main = buildLamp(w, line, { postX: POST_X, head: LAMP, glow: 9 });
  const far = buildLamp(w, line, { postX: -5.0, head: new THREE.Vector3(-3.6, 4.1, -27), glow: 3.2 });
  scene.add(main.group, far.group);
  const cone = lightBeam({ from: [LAMP.x, LAMP.y - 0.05, LAMP.z], to: [LAMP.x, 0, LAMP.z], radiusFrom: 0.16, radiusTo: 2.3, color: "#ffad5c" });
  cone.material.uniforms.uIntensity.value = 0.16;
  scene.add(cone);

  // A parked car on the left kerb, nose toward us.
  const { car, materials: carMats } = buildCar(w, line);
  car.position.set(-3.55, 0, -2.7);
  scene.add(car);
  const shadowSoft = shadowTexture(false);
  const shadowLong = shadowTexture(true);
  const carShadow = onlyMain(new THREE.Mesh(new THREE.PlaneGeometry(2.1, 5.0), new THREE.MeshBasicMaterial({ color: "#000000", map: shadowSoft, transparent: true, opacity: 0.85, depthWrite: false })));
  carShadow.rotation.x = -Math.PI / 2;
  carShadow.position.set(-3.55, 0.006, -2.7);
  scene.add(carShadow);

  // Environment ink: keyed by the lamp from where each piece stands.
  const env = (mat, at) => {
    const p = new THREE.Vector3(...at);
    mat.uniforms.uLightWorld.value.copy(LAMP).sub(p).normalize();
    mat.uniforms.uKey.value.copy(SODIUM).multiplyScalar(Math.min(1.6, lampAt(p)));
  };

  // Rain, and a low mist behind them that they walk out of.
  const rain = createRain(3000);
  scene.add(rain);
  const mist = createParticles({ count: 70, blending: "normal" });
  scene.add(mist.points);
  disposables.push(() => mist.points.material.uniforms.uMap.value.dispose());
  let mistSeed = 0;
  const puff = () => {
    mistSeed += 1;
    const x = (hash(mistSeed * 1.7) - 0.5) * 12;
    const z = -4 - hash(mistSeed * 2.9) * 16;
    const lit = Math.min(1, lampAt(new THREE.Vector3(x, 0.6, z)) * 0.9);
    mist.emit({ position: [x, 0.2 + hash(mistSeed * 4.1) * 0.9, z], velocity: [0.18, 0.01, 0.05], life: 14, size: 3 + hash(mistSeed * 5.3) * 3, color: new THREE.Color("#3a3f4c").lerp(new THREE.Color("#a0703c"), lit).getStyle(), alpha: 0.13 });
  };
  for (let i = 0; i < 70; i++) {
    puff();
    mist.step(14 / 70);
  }
  let mistDebt = 0;

  // The fade between loops.
  const fade = onlyMain(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 } },
        vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
        fragmentShader: "uniform float uA; void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uA); }",
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    ),
  );
  fade.frustumCulled = false;
  fade.renderOrder = 999;
  scene.add(fade);

  // ── The four ──
  const crew = [];
  const shadowMat = new THREE.MeshBasicMaterial({ color: "#000000", map: shadowSoft, transparent: true, opacity: 0.6, depthWrite: false });
  // The bodies get a finer line than the set: the outline widens with
  // distance, and at the length of the street the set's width pokes through
  // the eye sockets and mouth and turns every face into a black mask.
  const bodyLine = outlineMaterial(0.16);
  bodyLine.uniforms.uInk.value.copy(line.uniforms.uInk.value);
  const ready = Promise.all(
    CREW.map((spec) =>
      createModelFigure({
        body: spec.body,
        height: spec.height,
        hair: spec.hair,
        line: bodyLine,
        // Skin takes a soft highlight; the gloss (wet leather) is the jacket's, below.
        ink: { tone: 1.05, rim: 0.5, spec: 0.15, rimColor: NIGHT.rim },
        outfit: spec.outfit,
        fist: spec.fist,
      }),
    ),
  ).then((figs) => {
    figs.forEach((fig, i) => {
      const spec = CREW[i];
      fig.apply({}); // rest: clothes are bound to the bones here
      const cloth = w.ink({ tint: spec.jacket, tone: 1.05, rim: 0.5, spec: spec.spec });
      cloth.side = THREE.DoubleSide;
      if (spec.neckline === "stand") addCollar(fig, spec.height, cloth, line);
      if (spec.neckline === "crew") addCrewNeck(fig, spec.height, cloth, line);
      if (spec.neckline === "fur") addFurCollar(fig, spec.height, w.ink({ tint: "#121110", tone: 0.9, rim: 0.7, spec: 0 }), line);
      if (spec.braids) addBraids(fig, spec.height, w.ink({ tint: spec.outfit.hair, tone: 1.0, rim: 0.5, spec: 0.8 }), line);
      const coat = spec.coat ? addCoat(fig, spec, cloth, line) : null;
      let stand = spec.stand;
      if (spec.fold) {
        // Solve the folded arms once, on his own body, in the pose he holds.
        const solve = createArmSolver(fig);
        stand = { ...spec.stand };
        fig.apply(stand);
        fig.root.updateMatrixWorld(true);
        const k = spec.height / 2;
        for (const s of ["r", "l"]) {
          const { wrist, hint } = spec.fold[s];
          solve(stand, s, new THREE.Vector3(...wrist).multiplyScalar(k), new THREE.Vector3(...hint).normalize());
        }
        fig.apply({});
      }
      scene.add(fig.root);
      w.register(fig.root);
      const mats = [];
      fig.root.traverse((o) => o.material?.uniforms?.uKey && !mats.includes(o.material) && mats.push(o.material));
      const contact = onlyMain(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat));
      contact.rotation.x = -Math.PI / 2;
      contact.scale.set(spec.height * 0.4, spec.height * 0.32, 1);
      const longGeo = new THREE.PlaneGeometry(1, 1);
      longGeo.translate(0, 0.5, 0);
      longGeo.rotateX(-Math.PI / 2);
      const cast = onlyMain(new THREE.Mesh(longGeo, new THREE.MeshBasicMaterial({ color: "#000000", map: shadowLong, transparent: true, opacity: 0.5, depthWrite: false })));
      scene.add(contact, cast);
      // Soles: the body's own sole vertices at rest, carried rigidly by the
      // foot or toe bone that drives each, so every frame can set the lowest
      // of them back on the street.
      fig.apply({});
      fig.root.updateMatrixWorld(true);
      const feet = [];
      fig.model.traverse((m) => {
        if (!m.isSkinnedMesh || !/superhero/i.test(m.name)) return;
        const { skinIndex, skinWeight } = m.geometry.attributes;
        const p = new THREE.Vector3();
        for (let i = 0; i < m.geometry.attributes.position.count; i++) {
          m.getVertexPosition(i, p).applyMatrix4(m.matrixWorld);
          if (p.y > 0.012) continue;
          let best = 0;
          for (let j = 1; j < 4; j++) if (skinWeight.getComponent(i, j) > skinWeight.getComponent(i, best)) best = j;
          const bone = m.skeleton.bones[skinIndex.getComponent(i, best)];
          if (/^(foot|ball)_/.test(bone.name)) feet.push({ bone, local: bone.worldToLocal(p.clone()) });
        }
      });
      crew.push({ spec, stand, fig, feet, mats, coat, contact, cast, stride: strideFor(spec.height) });
    });
    w.palette(NIGHT);
    w.inks.forEach((m) => {
      m.uniforms.uFogRange.value.set(9, 40);
      m.uniforms.uFog.value.set(AIR);
    });
    // The palette set every key to the sky's; put the lamp back on the set.
    brick.forEach((m) => {
      m.uniforms.uLightWorld.value.set(-0.3, 0.8, 0.5).normalize();
      m.uniforms.uKey.value.setRGB(0.07, 0.085, 0.13);
    });
    carMats.forEach((m) => env(m, [-3.55, 0.9, -2.7]));
    env(main.metal, [POST_X, 2.5, LAMP.z]);
    env(far.metal, [-4.5, 2.5, -27]);
    w.sync();
  });
  w.palette(NIGHT);
  w.page({ mode: "still", focus: [0.6, 0.86] });

  const unsubscribeResize = stage.onResize(({ width, height, aspect }) => {
    w.bu.uAspect.value = aspect;
    const pr = renderer.getPixelRatio();
    street.getRenderTarget().setSize(Math.max(256, Math.round(width * pr * 0.5)), Math.max(256, Math.round(height * pr * 0.5)));
    mist.resize(height, camera.fov, pr);
    w.sync();
  });

  const look = new THREE.Vector3();
  const foot = new THREE.Vector3();
  const chest = new THREE.Vector3();
  const away = new THREE.Vector3();

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : ((time % CYCLE) + CYCLE) % CYCLE;

    // Camera: low, pushing in on the line, drifting right.
    const p = 1 - (1 - segment(c, 0, 13)) ** 2;
    const reach = stage.size.aspect < 1.5 ? (1.5 / stage.size.aspect) ** 0.85 : 1;
    look.set(-0.1 + p * 0.3, 1.45, lerp(-4, -0.4, p));
    camera.position.set(lerp(-0.7, 0.45, p) + Math.sin(time * 0.21) * 0.05 + pointer.x * 0.25, lerp(0.75, 0.6, p) + pointer.y * 0.08, look.z + (lerp(9.4, 6.2, p) - look.z) * reach);
    camera.lookAt(look);

    // The street, the rain, the mist.
    su.uTime.value = time;
    rain.material.uniforms.uTime.value = time;
    if (dt > 0) {
      mistDebt += dt * (70 / 14);
      while (mistDebt >= 1) {
        mistDebt -= 1;
        puff();
      }
      mist.step(dt);
    }
    fade.material.uniforms.uA.value = staticMode ? 0 : Math.max(1 - easeInOutCubic(segment(c, 0, 1.3)), easeInOutCubic(segment(c, 13, CYCLE)));

    if (!crew.length) return;

    // Where they are along the walk, and how fast.
    const u = Math.max(0, c - WALK_END);
    const travelled = c < WALK_END ? SPEED * c : c < STOP ? SPEED * WALK_END + SPEED * (u - (u * u) / (2 * (STOP - WALK_END))) : DISTANCE;
    const speed = c < WALK_END ? 1 : c < STOP ? 1 - u / (STOP - WALK_END) : 0;
    const settle = easeInOutCubic(segment(c, 8.6, 10.2));
    const amp = 0.25 + 0.75 * speed;
    const phase = (travelled / STRIDE) * Math.PI * 2;

    crew.forEach(({ spec, stand, fig, feet, mats, coat, contact, cast, stride }, i) => {
      const phi = phase + spec.phase;
      // Bob: the hips drop most of what straight legs lose at double support.
      const gait = walkPose(phi, { ...spec.gait, stride, bob: 0.55 * 0.925 * (1 - Math.cos(stride)) }, amp);
      const pose = blendPose(gait, stand, settle);
      if (spec.fold) {
        // The fold: the right arm comes across first, the left lands on top of it.
        const r = blendPose(gait, stand, easeInOutCubic(segment(c, 8.7, 9.9)));
        const l = blendPose(gait, stand, easeInOutCubic(segment(c, 9.3, 10.5)));
        Object.assign(pose, { rShoulder: r.rShoulder, rElbow: r.rElbow, lShoulder: l.lShoulder, lElbow: l.lElbow });
      }
      // Breathing once they stand.
      const breath = Math.sin(time * 1.5 + i * 1.7) * 0.012 * settle;
      pose.chest = [pose.chest[0] - breath, pose.chest[1], pose.chest[2]];
      pose.head = [pose.head[0] + breath * 0.5, pose.head[1], pose.head[2]];
      fig.apply(pose);
      const sway = Math.cos(phi) * 0.012 * spec.height * amp * (1 - settle);
      fig.root.position.set(spec.x + sway, 0, spec.z - DISTANCE + travelled);
      // Plant the feet: the lowest sole vertex goes on the ground.
      fig.root.updateMatrixWorld(true);
      let ground = Infinity;
      for (const f of feet) ground = Math.min(ground, f.bone.localToWorld(foot.copy(f.local)).y);
      fig.root.position.y = -ground;

      if (coat) {
        const wind = Math.sin(time * 1.1 + i) * 0.02;
        coat.left.rotation.x = pose.lHip[0] * 0.7 + 0.02 + wind;
        coat.right.rotation.x = pose.rHip[0] * 0.7 + 0.02 + wind * 0.8;
      }

      // The lamp on each of them: key toward it, stronger as they pass under it.
      chest.copy(fig.root.position).setY(spec.height * 0.65);
      const lit = lampAt(chest);
      // Key: the lamp, swung a little toward the camera so faces and clothes catch it.
      const dir = away.copy(LAMP).sub(chest).normalize().lerp(FRONT, 0.45).normalize();
      mats.forEach((m) => {
        m.uniforms.uLightWorld.value.copy(dir);
        m.uniforms.uKey.value.copy(BODY_KEY).multiplyScalar(Math.min(1.8, 0.25 + lit * 1.2));
        m.uniforms.uShade.value.copy(FILL);
        m.uniforms.uRim.value = 0.12 + 0.28 * Math.min(1.2, lit); // a thin edge, not armour
      });

      // Shadows: a soft contact at the feet, and a long one thrown away from the lamp.
      const fx = fig.root.position.x;
      const fz = fig.root.position.z;
      contact.position.set(fx, 0.004, fz + 0.03);
      const dx = fx - LAMP.x;
      const dz = fz - LAMP.z;
      const r = Math.hypot(dx, dz);
      const length = Math.min(7, (r * spec.height) / (LAMP.y - spec.height * 0.92));
      cast.position.set(fx, 0.005, fz);
      cast.rotation.y = Math.atan2(-dx, -dz);
      cast.scale.set(spec.height * 0.32, 1, Math.max(0.3, length));
      cast.material.opacity = Math.min(0.62, 0.15 + 0.45 * lit);
    });
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      unsubscribeResize();
      disposables.forEach((fn) => fn());
      camera.layers.disable(1);
    },
  };
};
