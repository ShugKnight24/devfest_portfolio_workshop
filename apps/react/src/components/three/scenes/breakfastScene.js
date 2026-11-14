import * as THREE from "three";
import { OUTFITS, createInkWorld } from "../rezeKit";
import { createModelFigure } from "../modelFigure";
import { blendPose } from "../figure";
import { easeInOutCubic, hash, hdr, lightBeam, segment } from "../kit";
import { outline } from "../ink";

/**
 * Breakfast at Aki's — the found-family mornings of part 1. A small 1990s
 * Tokyo apartment, sun through sheer curtains, three at a low table:
 *
 *   0   – 1.8   Denji wolfs his toast, three bites
 *   1.8 – 2.9   he lowers it to talk to Aki; Power has been watching it
 *   2.9 – 3.5   she snatches it out of his hand
 *   3.1 – 5.7   "Hey!" — he reaches; she leans away and eats it, smug
 *   3.4 – 6.8   Aki lifts his tea, sips, puts it down, and sighs
 *   6.2 – 9.6   Denji laughs (Power with him, pointing); Aki watches them
 *   9.3 – 12    Aki takes a fresh slice from the rack and hands it to Denji,
 *               who goes straight back in; Power is eyeing it again
 *
 * Every hand is placed by a two-bone IK on the pose library's arms, so a
 * reach lands where the toast, the cup or the other hand actually is. The
 * camera drifts round the table at seated eye level on a slower cycle.
 * Reduced motion holds t = 8: Denji and Power laughing, Aki watching.
 */

const LOOP = 12;
const STATIC_TIME = 8;
const UP = new THREE.Vector3(0, 1, 0);

// Morning in a small kitchen: warm air, a soft warm fill so faces stay readable.
// Morning in a small kitchen: warm key, a cooler fill so a white shirt's shadow
// goes blue-grey while skin stays warm.
const MORNING = { ground: "#1e130d", lines: "#ffd6a8", accent: "#ffa860", rim: "#ffc48a", shade: "#a9adc4" };
// One stop down from the stage default: warm, not milky.
const EXPOSURE = 0.62;

// The key: from the window side, high, cheated forward so faces catch it.
const SUN = [-0.6, 0.62, 0.3];

const TABLE = { w: 1.2, d: 0.8, top: 0.36 };
const CUSHION = 0.07;
const SIT = CUSHION + 0.12;
const SEATS = {
  denji: { x: 0.4, z: -0.68, yaw: 0 },
  power: { x: -0.4, z: -0.68, yaw: 0 },
  aki: { x: 0.98, z: 0, yaw: -Math.PI / 2 },
};

// Legs: cross-legged for the two of them, seiza for Aki. Solved so the thighs
// run forward and out and the shins cross low, under the table's edge.
const CROSS = { lHip: [-2.582, 1.022, 1.29], rHip: [-2.582, -1.022, -1.29], lKnee: [2.4, 0, 0], rKnee: [2.4, 0, 0] };
const SEIZA = { lHip: [-1.4, 0, 0.06], rHip: [-1.4, 0, -0.06], lKnee: [2.95, 0, 0], rKnee: [2.95, 0, 0] };

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pulse = (c, at, width = 0.09) => Math.exp(-(((c - at) / width) ** 2));
const steps = (c, times, w = 0.05) => times.reduce((n, t) => n + segment(c, t - w, t + w), 0);

/** Sequential pose blends: [from, to, pose] — each eases in over the last. */
const schedule = (c, base, list) => {
  let pose = typeof base === "function" ? base(c) : base;
  for (const [a, b, next] of list) if (c > a) pose = blendPose(pose, typeof next === "function" ? next(c) : next, easeInOutCubic(segment(c, a, b)));
  return pose;
};

/** A keyframed world point: [[t, point | () => point], ...], eased between keys. */
const track = (c, keys, out) => {
  let i = keys.length - 1;
  while (i > 0 && c < keys[i][0]) i--;
  const [t0, a] = keys[i];
  const [t1, b] = keys[Math.min(i + 1, keys.length - 1)];
  const k = t1 > t0 ? easeInOutCubic(segment(c, t0, t1)) : 0;
  return out.copy(typeof a === "function" ? a() : a).lerp(typeof b === "function" ? b() : b, k);
};

/* ------------------------------------------------------------------------
 * Torso and head. Arms come from the IK, legs from CROSS / SEIZA.
 * ---------------------------------------------------------------------- */

const BITES = [0.3, 0.9, 1.5];
const POWER_BITES = [3.8, 4.5, 5.15];
const TOAST_TILT = -0.3;
/** How much of the slice is left: his three bites, then her three. */
const toastScale = (c) => {
  if (c >= 9) return 1;
  if (c < 2.9) return 1 - 0.17 * steps(c, BITES);
  return Math.max(0, 0.49 - 0.17 * steps(c, POWER_BITES));
};
/** Aki's cup tipped toward him while he drinks. */
const cupTip = (c) => segment(c, 3.9, 4.2) * (1 - segment(c, 4.8, 5.1));

const denjiPoses = {
  eat: (c) => {
    const b = BITES.reduce((s, t) => s + pulse(c, t), 0);
    return { spine: [0.24 + b * 0.05, 0, 0], chest: [0.05, 0, 0], neck: [0.05, 0, 0], head: [0.06 + b * 0.12, 0.04, 0] };
  },
  talk: (c) => ({ spine: [0.12, 0.22, 0], chest: [0.02, 0.08, 0], head: [0.04 + Math.sin(c * 9) * 0.04, 0.5, -0.04] }),
  hey: (c) => ({ spine: [0.22, -0.28, 0.12], chest: [0.05, -0.1, 0], head: [-0.02 + Math.sin(c * 14) * 0.03, -0.55, 0.06] }),
  sulk: { spine: [0.2, 0, 0.02], chest: [0.06, 0, 0], head: [0.24, -0.12, 0] },
  laugh: (c) => {
    const bob = Math.sin(c * 17);
    return { spine: [-0.16 + bob * 0.05, 0.05, 0], chest: [-0.08 + bob * 0.03, 0, 0], neck: [-0.08, 0, 0], head: [-0.3 + Math.sin(c * 17 + 0.6) * 0.05, 0.12, 0.06] };
  },
  take: { spine: [0.22, 0.3, 0], chest: [0.05, 0.08, 0], head: [0.05, 0.42, 0] },
};

const powerPoses = {
  eye: (c) => ({ spine: [0.12, 0.14, -0.06], chest: [0.02, 0.04, 0], head: [0.12 + Math.sin(c * 1.3) * 0.02, 0.5, -0.08] }),
  lunge: { spine: [0.32, 0.32, -0.24], chest: [0.06, 0.1, 0], head: [0.12, 0.38, 0] },
  smug: (c) => {
    const chew = POWER_BITES.reduce((s, t) => s + pulse(c, t, 0.12), 0) + Math.max(0, Math.sin(c * 11)) * 0.3;
    return { spine: [-0.04, -0.18, 0.18], chest: [-0.02, -0.04, 0], head: [-0.2 + chew * 0.05, -0.22, 0.12] };
  },
  laugh: (c) => {
    const bob = Math.sin(c * 15 + 1);
    return { spine: [-0.2 + bob * 0.05, 0.08, 0.04], chest: [-0.06, 0, 0], neck: [-0.08, 0, 0], head: [-0.32 + bob * 0.05, 0.3, -0.06] };
  },
};

const akiPoses = {
  eat: (c) => ({ spine: [0.2, 0, 0], chest: [0.03, 0, 0], head: [0.2 + Math.sin(c * 0.9) * 0.03, -0.05, 0] }),
  sip: { spine: [0.12, 0, 0], chest: [0, 0, 0], head: [-0.14, 0, 0] },
  inhale: { spine: [0.02, 0, 0], chest: [-0.1, 0, 0], neck: [-0.05, 0, 0], head: [-0.12, 0, 0] },
  slump: (c) => ({ spine: [0.3, 0, 0], chest: [0.08, 0, 0], head: [0.36, Math.sin(c * 19) * 0.14 * (1 - segment(c, 6.3, 6.9)), 0] }),
  watch: (c) => ({ spine: [0.14, -0.06, 0], chest: [0.02, 0, 0], head: [0.06 + Math.sin(c * 1.1) * 0.02, -0.42, -0.06] }),
  reach: { spine: [0.38, -0.16, 0.04], chest: [0.08, -0.06, 0], head: [0.14, -0.3, 0] },
};

/* ------------------------------------------------------------------------
 * Bodies: dressing, hair details, eyes, and a two-bone arm IK.
 * ---------------------------------------------------------------------- */

const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

/** Eyes painted per character: sclera, iris, pupil, by distance from each eye's centre. */
const paintEyes = (fig, iris, pupil) => {
  fig.model.traverse((o) => {
    if (!o.isMesh || !/^eyes/i.test(o.name) || !o.geometry.attributes.color) return;
    const pos = o.geometry.attributes.position;
    const col = o.geometry.attributes.color;
    const boxes = [new THREE.Box3(), new THREE.Box3()];
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) boxes[pos.getX(i) > 0 ? 1 : 0].expandByPoint(p.fromBufferAttribute(pos, i));
    const cWhite = new THREE.Color("#f3eee6");
    const cIris = new THREE.Color(iris);
    const cPupil = new THREE.Color(pupil);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      const b = boxes[p.x > 0 ? 1 : 0];
      const cx = (b.min.x + b.max.x) / 2;
      const cy = (b.min.y + b.max.y) / 2;
      const r = Math.max(1e-5, (b.max.x - b.min.x) / 2);
      const front = p.z > (b.min.z + b.max.z) / 2;
      const d = Math.hypot(p.x - cx, p.y - cy) / r;
      const c = !front || d > 0.62 ? cWhite : d > 0.28 ? cIris : cPupil;
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  });
};

/** Attach meshes to a bone at the rest pose (call with the root at the origin). */
const pin = (scene, bone, ...meshes) => {
  meshes.forEach((m) => {
    scene.add(m);
    bone.attach(m);
  });
};

/** A cone from `base` along `dir`, its base sunk into whatever it grows from. */
const spike = (mat, base, dir, length, radius) => {
  const geo = new THREE.ConeGeometry(radius, length, 6);
  geo.translate(0, length / 2, 0);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(base);
  m.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  return m;
};

/**
 * The female body's throat sits outside the figure's neck test, so the tee's
 * colour climbs it in a blue patch under the chin. Paint it skin: anything in
 * the top's colour above the shoulders and within the neck's width.
 */
const clearThroat = (fig, topHex) => {
  let body = null;
  fig.model.traverse((o) => {
    if (o.isSkinnedMesh && o.geometry.attributes.color && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count)) body = o;
  });
  if (!body) return;
  const g = body.geometry;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const pos = g.attributes.position;
  const col = g.attributes.color;
  const top = new THREE.Color(topHex);
  // Her own skin, read off the neck just under the jaw.
  const skin = new THREE.Color(0, 0, 0);
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    if (ny > 0.88 && ny < 0.9) {
      skin.r += col.getX(i);
      skin.g += col.getY(i);
      skin.b += col.getZ(i);
      n++;
    }
  }
  if (!n) return;
  skin.multiplyScalar(1 / n);
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    if (ny < 0.836 || Math.abs(pos.getX(i) - cx) / H > 0.06) continue;
    if (Math.hypot(col.getX(i) - top.r, col.getY(i) - top.g, col.getZ(i) - top.b) < 0.08) col.setXYZ(i, skin.r, skin.g, skin.b);
  }
  col.needsUpdate = true;
};

/** The finger bones a held thing is placed from, per hand. */
const gripBones = (fig) => {
  const b = (n) => fig.model.getObjectByName(n);
  fig.grip = {};
  for (const s of ["l", "r"]) {
    fig.grip[s] = {
      hand: b(`hand_${s}`),
      thumb: b(`thumb_04_leaf_${s}`) ?? b(`thumb_03_${s}`),
      index: b(`index_02_${s}`),
      knuckle: b(`middle_01_${s}`),
      tip: b(`middle_04_leaf_${s}`) ?? b(`middle_03_${s}`),
      // Where the held thing sits, relative to the wrist; measured every frame.
      pinchOff: new THREE.Vector3(),
      palmOff: new THREE.Vector3(),
    };
  }
};

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
    arms[s] = { sh, el, hand, l1: S.distanceTo(E), l2: E.distanceTo(H), sign: s === "l" ? 1 : -1, fore: v3(0, -1, 0) };
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
    /**
     * Put the `s` hand's wrist on `target` (world). The figure must already be
     * applied in `pose` (sans arms) with its matrices current. `hint` is the
     * way the elbow should point, in the figure's own frame.
     */
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
      // Roll the arm about the shoulder–wrist line until the elbow points along the hint.
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
    /** After the final apply: remember each forearm's direction (for what the hand holds). */
    measure() {
      for (const s of ["l", "r"]) {
        const arm = arms[s];
        arm.hand.getWorldPosition(a);
        arm.el.getWorldPosition(b);
        arm.fore.subVectors(a, b).normalize();
      }
    },
  };
};

/**
 * Shirt details with a silhouette: a crisp collar, the tie standing proud of
 * the chest (offsets measured off the body's front profile) and a belt.
 */
const dress = (w, fig, { collar, tie, belt }) => {
  const neckAt = fig.bones.neck.getWorldPosition(new THREE.Vector3());
  const hipsAt = fig.bones.hips.getWorldPosition(new THREE.Vector3());
  const chestBone = fig.bones.chest ?? fig.bones.spine;
  const white = w.ink({ tint: collar, tone: 1.1, rim: 0.4 });
  for (const side of [-1, 1]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.014), white);
    flap.position.copy(neckAt).add(v3(side * 0.045, -0.04, 0.1));
    flap.rotation.set(-0.45, side * 0.55, side * -0.65);
    outline(flap, w.line);
    pin(w.scene, fig.bones.neck, flap);
  }
  // Solid ink: a lit dark tie goes grey against a lit shirt.
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.035), w.flat);
  knot.position.copy(neckAt).add(v3(0, -0.068, 0.132));
  outline(knot, w.line);
  pin(w.scene, fig.bones.neck, knot);
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.022, 0.36, 4, 1), w.flat);
  blade.geometry.rotateY(Math.PI / 4);
  blade.geometry.scale(1, 1, 0.25);
  blade.geometry.translate(0, -0.18, 0);
  blade.position.copy(neckAt).add(v3(0, -0.085, 0.163));
  outline(blade, w.line);
  pin(w.scene, chestBone, blade);
  if (tie !== "flat") blade.material = knot.material = w.ink({ tint: tie, tone: 0.35, rim: 0.3 });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 6, 32), w.ink({ tint: belt, tone: 0.6, rim: 0.5 }));
  strap.rotation.x = Math.PI / 2;
  strap.scale.set(1.08, 0.93, 1);
  strap.position.copy(hipsAt).add(v3(0, 0.075, 0.0));
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.036, 0.014), w.ink({ tint: "#c9c4b8", tone: 1.2, rim: 0.4 }));
  buckle.position.copy(hipsAt).add(v3(0, 0.075, 0.145));
  pin(w.scene, fig.bones.hips, strap, buckle);
};

/* ------------------------------------------------------------------------
 * Soft light: dust in the sunbeam, steam off the tea and the kettle, glows.
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
    p.copy(from).addScaledVector(axis, 0.08 + hash(i * 1.7) * 0.86);
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
    uniforms: { uTime: { value: 0 }, uScale: { value: 1000 }, uColor: { value: hdr("#ffdcae", 0.9) } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale;
      varying float vA;
      void main() {
        float s = aSeed * 6.2831;
        vec3 p = position + vec3(sin(uTime * 0.13 + s) * 0.08, sin(uTime * 0.09 + s * 1.7) * 0.06, cos(uTime * 0.11 + s * 2.3) * 0.07);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.006 + 0.007 * fract(aSeed * 13.7)) * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed) + s * 3.0);
        vA = 0.25 + 0.75 * tw * tw;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      ${SOFT_DISC}
      void main() {
        float a = soft(gl_PointCoord) * vA;
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

const createSteam = (count, { rise = 0.22, spread = 0.02, size = 0.035, speed = 0.32, alpha = 0.3 } = {}) => {
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
const softQuad = (w, h, color, opacity, { additive = false, round = false } = {}) => {
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
        ${round ? "float a = smoothstep(0.5, 0.15, length(vUv - 0.5));" : "float a = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);"}
        a *= uOpacity;
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

/* ------------------------------------------------------------------------
 * The apartment.
 * ---------------------------------------------------------------------- */

const buildApartment = (w) => {
  const g = new THREE.Group();
  const box = (sx, sy, sz, mat, x, y, z, line = false, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    parent.add(m);
    return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 24, line = false, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    parent.add(m);
    return m;
  };

  // Shell: wood floor, plaster walls, a ceiling.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), w.ink({ tint: "#a8744a", tone: 0.8, rim: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.25, 0, 0.6);
  g.add(floor);
  // Floorboard seams.
  const seam = w.ink({ tint: "#6d4428", tone: 0.6, rim: 0 });
  for (let i = 0; i < 26; i++) box(0.008, 0.002, 7, seam, -3.2 + i * 0.26, 0.001, 0.6);
  const plaster = w.ink({ tint: "#efe0c8", tone: 0.95, rim: 0.15 });
  box(5.8, 2.5, 0.1, plaster, 0.25, 1.25, -1.95);
  box(0.1, 2.5, 5, plaster, -2.45, 1.25, 0.5);
  box(0.1, 2.5, 5, plaster, 2.95, 1.25, 0.5);
  box(5.8, 0.06, 5, w.ink({ tint: "#f4ead8", tone: 0.9, rim: 0.1 }), 0.25, 2.5, 0.5);
  // Skirting.
  const trim = w.ink({ tint: "#6a4228", tone: 0.6, rim: 0.3 });
  box(5.8, 0.08, 0.02, trim, 0.25, 0.04, -1.89);
  box(0.02, 0.08, 5, trim, -2.39, 0.04, 0.5);

  // The window: bright morning beyond, sheer curtains, a pot of grass on the sill.
  const win = { x: -1.78, y: 1.5, w: 1.0, h: 1.1, z: -1.9 };
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(win.w, win.h), new THREE.MeshBasicMaterial({ color: hdr("#ffe2b8", 1.25) }));
  pane.position.set(win.x, win.y, win.z + 0.052);
  g.add(pane);
  const frame = w.ink({ tint: "#5a3a24", tone: 0.55, rim: 0.6 });
  box(win.w + 0.1, 0.06, 0.08, frame, win.x, win.y + win.h / 2 + 0.03, win.z + 0.07, true);
  box(win.w + 0.16, 0.05, 0.16, frame, win.x, win.y - win.h / 2 - 0.025, win.z + 0.1, true);
  box(0.06, win.h, 0.08, frame, win.x - win.w / 2 - 0.03, win.y, win.z + 0.07, true);
  box(0.06, win.h, 0.08, frame, win.x + win.w / 2 + 0.03, win.y, win.z + 0.07, true);
  box(0.035, win.h, 0.05, frame, win.x, win.y, win.z + 0.07);
  box(win.w, 0.03, 0.05, frame, win.x, win.y + 0.18, win.z + 0.07);
  // The curtain rod and two sheer panels that breathe in a draught.
  cyl(0.012, 0.012, win.w + 0.6, frame, win.x, win.y + win.h / 2 + 0.12, win.z + 0.16, 8).rotation.z = Math.PI / 2;
  const sheer = new THREE.MeshBasicMaterial({ color: hdr("#fff1dc", 0.85), transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
  const curtains = [-1, 1].map((side) => {
    const geo = new THREE.PlaneGeometry(0.46, win.h + 0.22, 18, 6);
    const m = new THREE.Mesh(geo, sheer);
    m.position.set(win.x + side * (win.w / 2 - 0.12), win.y + 0.02, win.z + 0.15);
    m.renderOrder = 11;
    g.add(m);
    return { m, base: Float32Array.from(geo.attributes.position.array), side };
  });
  // Touch grass: a pot of it on the sill.
  const pot = cyl(0.06, 0.045, 0.09, w.ink({ tint: "#b5562e", tone: 0.8, rim: 0.6 }), win.x + 0.28, win.y - win.h / 2 + 0.045, win.z + 0.12, 16, true);
  const blade = w.ink({ tint: "#5f9a3c", tone: 0.85, rim: 0.6 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const tip = v3(Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35);
    g.add(spike(blade, v3(pot.position.x + Math.cos(a) * 0.025, pot.position.y + 0.04, pot.position.z + Math.sin(a) * 0.025), tip, 0.09 + hash(i) * 0.06, 0.008));
  }

  // The kitchen along the back wall: cabinets, counter, sink, stove, toaster,
  // kettle, rice cooker; wall cupboards over it.
  const k = { x0: 0.05, x1: 2.4, z: -1.6, h: 0.86 };
  const cab = w.ink({ tint: "#e8d6b4", tone: 0.92, rim: 0.4 });
  box(k.x1 - k.x0, k.h - 0.08, 0.6, cab, (k.x0 + k.x1) / 2, (k.h - 0.08) / 2 + 0.08, k.z, true);
  box(k.x1 - k.x0, 0.08, 0.56, w.ink({ tint: "#3b2a20", tone: 0.4, rim: 0.2 }), (k.x0 + k.x1) / 2, 0.04, k.z - 0.02);
  const handle = w.ink({ tint: "#8d8a84", tone: 1.0, rim: 0.6 });
  for (let i = 0; i < 4; i++) {
    const cx = k.x0 + 0.3 + i * 0.58;
    box(0.002, k.h - 0.16, 0.002, seam, cx + 0.29, 0.47, k.z + 0.301);
    box(0.1, 0.015, 0.02, handle, cx, 0.74, k.z + 0.31);
  }
  const counterTop = w.ink({ tint: "#b9bcbd", tone: 1.0, rim: 0.7, spec: 0.6 });
  box(k.x1 - k.x0 + 0.04, 0.04, 0.64, counterTop, (k.x0 + k.x1) / 2, k.h + 0.02, k.z, true);
  // Tiled splashback: grout lines over pale tile.
  box(k.x1 - k.x0, 0.62, 0.012, w.ink({ tint: "#dfe6e2", tone: 1.0, rim: 0.2 }), (k.x0 + k.x1) / 2, k.h + 0.35, -1.895);
  const grout = w.ink({ tint: "#a9b2ae", tone: 0.7, rim: 0 });
  for (let i = 0; i <= 5; i++) box(k.x1 - k.x0, 0.005, 0.004, grout, (k.x0 + k.x1) / 2, k.h + 0.05 + i * 0.12, -1.887);
  for (let i = 0; i <= 19; i++) box(0.005, 0.62, 0.004, grout, k.x0 + i * 0.124, k.h + 0.35, -1.887);
  // Sink and a gooseneck tap.
  box(0.46, 0.012, 0.36, w.ink({ tint: "#6f7375", tone: 0.6, rim: 0.4 }), 1.0, k.h + 0.045, k.z - 0.02);
  const tap = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 20, Math.PI), handle);
  tap.position.set(1.0, k.h + 0.2, k.z - 0.17);
  tap.rotation.y = Math.PI / 2;
  g.add(tap);
  cyl(0.012, 0.012, 0.16, handle, 1.0, k.h + 0.12, k.z - 0.25, 8);
  // Two-burner gas stove, the kettle on it.
  box(0.52, 0.06, 0.42, w.ink({ tint: "#2b2b2e", tone: 0.5, rim: 0.6 }), 1.65, k.h + 0.07, k.z, true);
  for (const x of [1.52, 1.78]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 18), handle);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, k.h + 0.105, k.z);
    g.add(ring);
  }
  const kettleMat = w.ink({ tint: "#d9dcd8", tone: 1.05, rim: 0.9, spec: 0.8 });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), kettleMat);
  kettle.scale.set(1, 0.85, 1);
  kettle.position.set(1.52, k.h + 0.2, k.z);
  outline(kettle, w.line);
  g.add(kettle);
  const kHandle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 16, Math.PI), w.ink({ tint: "#2a2a2a", tone: 0.5, rim: 0.4 }));
  kHandle.position.set(1.52, k.h + 0.27, k.z);
  g.add(kHandle);
  const spout = spike(kettleMat, v3(1.6, k.h + 0.18, k.z), v3(1, 0.9, 0.2), 0.1, 0.018);
  g.add(spout);
  const spoutTip = v3(1.6, k.h + 0.18, k.z).add(v3(1, 0.9, 0.2).normalize().multiplyScalar(0.1));
  // Toaster: cream body, two dark slots with the elements glowing, a lever.
  const toaster = new THREE.Group();
  toaster.position.set(0.42, k.h + 0.04, k.z + 0.05);
  g.add(toaster);
  box(0.27, 0.18, 0.15, w.ink({ tint: "#efe4cc", tone: 1.0, rim: 0.8, spec: 0.7 }), 0, 0.09, 0, true, toaster);
  for (const dz of [-0.03, 0.03]) {
    box(0.18, 0.008, 0.022, w.flat, 0, 0.181, dz, false, toaster);
    box(0.16, 0.004, 0.012, new THREE.MeshBasicMaterial({ color: hdr("#ff7a2a", 1.8) }), 0, 0.184, dz, false, toaster);
  }
  box(0.02, 0.025, 0.04, w.ink({ tint: "#2a2a2a", tone: 0.5 }), 0.145, 0.07, 0, false, toaster);
  // Rice cooker, its "keep warm" light on.
  const cooker = cyl(0.13, 0.14, 0.2, w.ink({ tint: "#f2efe8", tone: 1.05, rim: 0.7 }), 2.1, k.h + 0.14, k.z, 24, true);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), cooker.material);
  lid.scale.y = 0.4;
  lid.position.set(2.1, k.h + 0.24, k.z);
  g.add(lid);
  box(0.02, 0.012, 0.01, new THREE.MeshBasicMaterial({ color: hdr("#ff9b3d", 2.2) }), 2.1, k.h + 0.12, k.z + 0.138);
  // Wall cupboards.
  box(k.x1 - 0.25, 0.6, 0.34, cab, (0.3 + k.x1) / 2, 1.85, -1.73, true);
  for (let i = 0; i < 3; i++) box(0.08, 0.012, 0.02, handle, 0.65 + i * 0.68, 1.6, -1.555);
  // A tea towel over a cupboard door.
  box(0.16, 0.24, 0.012, w.ink({ tint: "#c94f45", tone: 0.8, rim: 0.4 }), 0.75, 0.66, k.z + 0.312);
  // The fridge at the end, 90s cream.
  box(0.62, 1.5, 0.62, w.ink({ tint: "#efe9db", tone: 1.0, rim: 0.6, spec: 0.5 }), 2.65, 0.75, -1.58, true);
  box(0.62, 0.006, 0.006, seam, 2.65, 1.05, -1.268);
  box(0.02, 0.24, 0.03, handle, 2.4, 1.24, -1.25);
  box(0.02, 0.3, 0.03, handle, 2.4, 0.8, -1.25);

  // Between window and kitchen: a wall clock (twenty to eight) and a calendar.
  const clock = cyl(0.13, 0.13, 0.03, w.ink({ tint: "#fbf7ee", tone: 1.05, rim: 0.4 }), -0.12, 1.86, -1.88, 28, true);
  clock.rotation.x = Math.PI / 2;
  const handMat = w.flat;
  const hHand = box(0.012, 0.06, 0.005, handMat, -0.12, 1.86, -1.86);
  hHand.geometry.translate(0, 0.03, 0);
  hHand.rotation.z = -(7.66 / 12) * Math.PI * 2;
  const mHand = box(0.008, 0.095, 0.005, handMat, -0.12, 1.86, -1.858);
  mHand.geometry.translate(0, 0.0475, 0);
  mHand.rotation.z = -(40 / 60) * Math.PI * 2;
  box(0.3, 0.42, 0.006, w.ink({ tint: "#fbf6ec", tone: 1.05, rim: 0.2 }), -0.12, 1.3, -1.895);
  box(0.3, 0.1, 0.008, w.ink({ tint: "#d0473d", tone: 0.85, rim: 0.2 }), -0.12, 1.46, -1.893);
  for (let r = 0; r < 4; r++) box(0.25, 0.003, 0.004, grout, -0.12, 1.36 - r * 0.07, -1.89);

  // The left wall: a CRT on a low cabinet, a stack of manga.
  const tvStand = box(0.7, 0.4, 0.42, w.ink({ tint: "#6b4a30", tone: 0.7, rim: 0.4 }), -2.15, 0.2, 0.55, true);
  tvStand.rotation.y = Math.PI / 2;
  const tv = box(0.52, 0.42, 0.46, w.ink({ tint: "#3a3a3e", tone: 0.55, rim: 0.8 }), -2.15, 0.61, 0.55, true);
  tv.rotation.y = Math.PI / 2;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.3), w.ink({ tint: "#2a3134", tone: 0.4, rim: 0.3, spec: 1 }));
  screen.position.set(-1.915, 0.62, 0.55);
  screen.rotation.y = Math.PI / 2;
  g.add(screen);
  for (let i = 0; i < 5; i++) box(0.13, 0.025, 0.18, w.ink({ tint: ["#d8473a", "#f1ece2", "#3d6db5", "#f2c14e", "#f1ece2"][i], tone: 0.85, rim: 0.3 }), -2.15, 0.415 + i * 0.026, 0.95 + hash(i) * 0.02);

  // The ceiling's round fluorescent light, off in daylight.
  cyl(0.28, 0.3, 0.07, w.ink({ tint: "#f6f1e6", tone: 1.0, rim: 0.4 }), 0.1, 2.44, -0.05, 28);

  // A rug under the table, its border, and the table's soft shadow.
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), w.ink({ tint: "#cdb98a", tone: 0.9, rim: 0.1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.15, 0.004, -0.15);
  g.add(rug);
  const border = w.ink({ tint: "#5b6e4a", tone: 0.7, rim: 0.1 });
  box(2.6, 0.003, 0.06, border, 0.15, 0.006, -1.22);
  box(2.6, 0.003, 0.06, border, 0.15, 0.006, 0.92);
  box(0.06, 0.003, 2.2, border, -1.12, 0.006, -0.15);
  box(0.06, 0.003, 2.2, border, 1.42, 0.006, -0.15);
  const shadow = softQuad(1.6, 1.2, "#1a0e08", 0.42, { round: true });
  shadow.position.set(0, 0.008, 0);
  g.add(shadow);

  // The sunlight: shafts from the window, a warm patch on the table and floor.
  const shafts = [
    lightBeam({ from: [win.x - 0.22, win.y + 0.15, win.z + 0.1], to: [-0.25, 0, 0.75], radiusFrom: 0.32, radiusTo: 0.72, color: "#ffcf8f" }),
    lightBeam({ from: [win.x + 0.22, win.y + 0.1, win.z + 0.1], to: [0.4, 0, 0.6], radiusFrom: 0.3, radiusTo: 0.68, color: "#ffd8a0" }),
  ];
  shafts.forEach((s) => {
    s.material.uniforms.uIntensity.value = 0.045;
    g.add(s);
  });
  const tablePatch = softQuad(0.7, 0.42, "#ffcf95", 0.07, { additive: true });
  tablePatch.position.set(-0.08, TABLE.top + 0.012, 0.08);
  tablePatch.rotation.z = 0.5;
  g.add(tablePatch);
  const floorPatch = softQuad(1.3, 0.8, "#ffcf95", 0.06, { additive: true });
  floorPatch.position.set(0.0, 0.01, 0.85);
  floorPatch.rotation.z = 0.45;
  g.add(floorPatch);

  return { group: g, curtains, spoutTip, win };
};

/** The low table and breakfast for three. Returns the pieces that move. */
const buildTable = (w) => {
  const g = new THREE.Group();
  const mesh = (geo, mat, x, y, z, line = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    g.add(m);
    return m;
  };
  const wood = w.ink({ tint: "#8b5a35", tone: 0.85, rim: 0.6, spec: 0.5 });
  mesh(new THREE.BoxGeometry(TABLE.w, 0.035, TABLE.d), wood, 0, TABLE.top - 0.0175, 0, true);
  const legMat = w.ink({ tint: "#6a4226", tone: 0.7, rim: 0.4 });
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(new THREE.BoxGeometry(0.05, TABLE.top - 0.035, 0.05), legMat, x * 0.52, (TABLE.top - 0.035) / 2, z * 0.31);

  // Cushions: his orange, hers pink, Aki's navy.
  const cushion = (color, x, z) => {
    const m = mesh(new THREE.BoxGeometry(0.56, CUSHION, 0.56), w.ink({ tint: color, tone: 0.85, rim: 0.5 }), x, CUSHION / 2, z, true);
    const shade = softQuad(0.75, 0.75, "#1a0e08", 0.35, { round: true });
    shade.position.set(x, 0.009, z);
    g.add(shade);
    return m;
  };
  cushion("#c8553d", SEATS.denji.x, SEATS.denji.z - 0.04);
  cushion("#d98aa0", SEATS.power.x, SEATS.power.z - 0.04);
  cushion("#3e5878", SEATS.aki.x + 0.04, SEATS.aki.z);

  const T = TABLE.top;
  const china = w.ink({ tint: "#f7f3ea", tone: 1.05, rim: 0.5, spec: 0.6 });
  const plate = (x, z, r = 0.1) => mesh(new THREE.CylinderGeometry(r, r * 0.75, 0.016, 28), china, x, T + 0.008, z, true);
  const white = w.ink({ tint: "#fbf8f1", tone: 1.1, rim: 0.3 });
  const yolk = w.ink({ tint: "#ffb021", tone: 1.0, rim: 0.3, spec: 1 });
  const egg = (x, z, rot = 0) => {
    const e = mesh(new THREE.CylinderGeometry(0.055, 0.058, 0.008, 18), white, x, T + 0.02, z);
    e.scale.set(1, 1, 0.82);
    e.rotation.y = rot;
    const y = mesh(new THREE.SphereGeometry(0.022, 14, 10), yolk, x + 0.008, T + 0.024, z - 0.004);
    y.scale.y = 0.55;
  };
  const bowl = (x, z, color, fill, r = 0.06) => {
    const b = mesh(new THREE.CylinderGeometry(r, r * 0.6, r * 0.9, 22, 1, true), w.ink({ tint: color, tone: 0.9, rim: 0.6 }), x, T + r * 0.45, z, true);
    b.material.side = THREE.DoubleSide;
    const top = mesh(new THREE.SphereGeometry(r * 0.93, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: fill, tone: 1.0, rim: 0.3 }), x, T + r * 0.62, z);
    top.scale.y = 0.35;
    return b;
  };
  const sticks = (x, z, yaw) => {
    const s = w.ink({ tint: "#3a2216", tone: 0.6, rim: 0.3 });
    for (const dx of [-0.006, 0.006]) {
      const c = mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.21, 6), s, x + dx, T + 0.006, z);
      c.rotation.set(Math.PI / 2, 0, yaw);
    }
  };
  const mug = (x, z, color, liquid) => {
    const m = mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 20), w.ink({ tint: color, tone: 0.9, rim: 0.7 }), x, T + 0.045, z, true);
    const top = mesh(new THREE.CircleGeometry(0.035, 18), w.ink({ tint: liquid, tone: 0.7, rim: 0 }), x, T + 0.085, z);
    top.rotation.x = -Math.PI / 2;
    return m;
  };

  // Denji: fried egg, rice, coffee.
  plate(0.44, -0.2);
  egg(0.42, -0.21, 0.4);
  bowl(0.22, -0.18, "#2e4a6b", "#fbf8f0");
  sticks(0.08, -0.25, 0.1);
  mug(0.08, -0.04, "#d8473a", "#3a2214");
  // Power: egg, sausages, and the vegetables pushed to the edge, untouched.
  plate(-0.42, -0.2);
  egg(-0.44, -0.18, -0.6);
  const sausage = w.ink({ tint: "#b8573a", tone: 0.85, rim: 0.4 });
  for (const dz of [-0.05, -0.02]) {
    const s = mesh(new THREE.CapsuleGeometry(0.011, 0.05, 4, 8), sausage, -0.37, T + 0.026, -0.2 + dz);
    s.rotation.z = Math.PI / 2;
  }
  const greens = w.ink({ tint: "#5f9a3c", tone: 0.85, rim: 0.4 });
  for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.012, 8, 6), greens, -0.5 + (i % 3) * 0.014, T + 0.026, -0.26 + Math.floor(i / 3) * 0.014);
  bowl(-0.2, -0.16, "#c75b6f", "#fbf8f0");
  sticks(-0.07, -0.26, -0.15);
  mug(-0.6, -0.02, "#f2efe6", "#f4ecd8");
  // Aki: grilled fish, miso, rice, and his tea.
  const fishPlate = mesh(new THREE.BoxGeometry(0.2, 0.014, 0.1), china, 0.32, T + 0.007, 0.2, true);
  fishPlate.rotation.y = 0.1;
  const fish = mesh(new THREE.CapsuleGeometry(0.022, 0.09, 4, 10), w.ink({ tint: "#c9874a", tone: 0.85, rim: 0.4 }), 0.32, T + 0.028, 0.2);
  fish.rotation.set(0, 0.1, Math.PI / 2);
  fish.scale.set(1, 1, 0.6);
  bowl(0.18, 0.27, "#5a3322", "#b0763e", 0.055);
  bowl(0.06, 0.18, "#2e2e33", "#fbf8f0");
  // His yunomi: a tall handleless cup; it lives in his hand while he drinks.
  const cup = new THREE.Group();
  const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.028, 0.085, 20), w.ink({ tint: "#7c8f6e", tone: 0.85, rim: 0.7 }));
  cupBody.position.y = 0.0425;
  outline(cupBody, w.line);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(0.029, 18), w.ink({ tint: "#a4a44a", tone: 0.8, rim: 0 }));
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.078;
  cup.add(cupBody, tea);
  g.add(cup);
  const cupRest = v3(0.5, T, 0.12);
  // In the middle: the teapot, soy sauce, butter, a toast rack, a sprig in a glass.
  const pot = mesh(new THREE.SphereGeometry(0.075, 20, 14), w.ink({ tint: "#55382a", tone: 0.7, rim: 0.8, spec: 0.8 }), -0.06, T + 0.06, 0.17, true);
  pot.scale.y = 0.85;
  const potHandle = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), w.ink({ tint: "#2a1a12", tone: 0.5 }), 0.02, T + 0.1, 0.12);
  potHandle.rotation.set(0.6, 0, -0.9);
  mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.11, 12), w.ink({ tint: "#3a1c14", tone: 0.5, rim: 0.6 }), -0.22, T + 0.055, 0.26);
  mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.03, 10), w.ink({ tint: "#c8102e", tone: 0.8 }), -0.22, T + 0.125, 0.26);
  mesh(new THREE.BoxGeometry(0.09, 0.03, 0.06), china, 0.2, T + 0.015, 0.06, true);
  mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), w.ink({ tint: "#f7df8a", tone: 1.0, rim: 0.3 }), 0.2, T + 0.04, 0.06);
  const glass = mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 14, 1, true), w.ink({ tint: "#cfe3ea", tone: 1.0, rim: 1.0 }), -0.3, T + 0.04, 0.06, true);
  glass.material.side = THREE.DoubleSide;
  const leaf = w.ink({ tint: "#6aa846", tone: 0.9, rim: 0.6 });
  for (let i = 0; i < 4; i++) g.add(spike(leaf, v3(-0.3, T + 0.03, 0.06), v3(Math.cos(i * 1.7) * 0.4, 1, Math.sin(i * 1.7) * 0.4), 0.13 + i * 0.015, 0.01));
  const rack = v3(0.42, T, -0.03);
  const metal = w.ink({ tint: "#c4c2bc", tone: 1.0, rim: 0.8, spec: 0.8 });
  mesh(new THREE.BoxGeometry(0.15, 0.01, 0.08), metal, rack.x, T + 0.005, rack.z);
  const toast = (parent) => {
    const t = new THREE.Group();
    const crust = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.11, 0.013), w.ink({ tint: "#b8742f", tone: 0.85, rim: 0.6 }));
    crust.geometry.translate(0, 0.055, 0);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.094, 0.015), w.ink({ tint: "#efbd72", tone: 0.95, rim: 0.4 }));
    face.geometry.translate(0, 0.055, 0);
    outline(crust, w.line);
    t.add(crust, face);
    parent.add(t);
    return t;
  };
  for (let i = 0; i < 4; i++) {
    mesh(new THREE.BoxGeometry(0.004, 0.09, 0.07), metal, rack.x - 0.06 + i * 0.04, T + 0.05, rack.z);
    if (i < 3) {
      const slice = toast(g);
      slice.position.set(rack.x - 0.04 + i * 0.04, T + 0.008, rack.z);
      slice.rotation.y = Math.PI / 2;
    }
  }
  // The slice that goes round the table.
  const held = toast(g);

  return { group: g, cup, cupRest, rack, held };
};

/* ------------------------------------------------------------------------
 * The scene.
 * ---------------------------------------------------------------------- */

export const createBreakfastScene = (stage) => {
  const { camera, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const exposureWas = stage.renderer.toneMappingExposure;
  stage.renderer.toneMappingExposure = EXPOSURE;

  const apt = buildApartment(w);
  scene.add(apt.group);
  const table = buildTable(w);
  scene.add(table.group);

  // Dust in the sun, steam off the kettle and the tea.
  const motes = createMotes(240, v3(apt.win.x, apt.win.y, apt.win.z + 0.3), v3(0.1, 0.25, 0.6), 0.5);
  const kettleSteam = createSteam(22, { rise: 0.35, spread: 0.025, size: 0.05, speed: 0.22, alpha: 0.22 });
  kettleSteam.material.uniforms.uOrigin.value.copy(apt.spoutTip);
  const teaSteam = createSteam(16, { rise: 0.16, spread: 0.012, size: 0.03, speed: 0.3, alpha: 0.26 });
  scene.add(motes, kettleSteam, teaSteam);
  const softPoints = [motes, kettleSteam, teaSteam];

  w.light(...SUN);
  w.page({ mode: "still" });
  w.palette(MORNING);
  const fogRange = () => w.inks.forEach((m) => m.uniforms.uFogRange.value.set(7, 26));
  fogRange();

  const cast = {};
  const load = (name, opts) =>
    createModelFigure({ line: w.line, ink: { tone: 0.8, rim: 0.7 }, fist: 0.55, ...opts }).then((fig) => {
      cast[name] = fig;
      scene.add(fig.root);
      return fig;
    });

  const ready = Promise.all([
    load("denji", { height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], outfit: { ...OUTFITS.denji, skin: "#e2ad8a", top: "#dde5ee", bottom: "#23292c", shoes: "#e9e6df", trim: null }, dress: { spikes: true } }),
    load("aki", {
      height: 1.8,
      hair: ["HairSimpleParted", "EyebrowsRegular"],
      outfit: { skin: "#ddab89", top: "#dfe6ef", bottom: "#1c1f26", shoes: "#1d1d22", hair: "#141418", sleeves: "long", tie: "#1c2230", belt: "#2a1f18" },
    }),
    load("power", {
      body: "SuperheroFemale",
      height: 1.66,
      hair: ["HairLong", "EyebrowsFemale"],
      // An oversized tee worn as a dress, long sleeves, bare legs and feet.
      outfit: { skin: "#efc6ae", top: "#4f76b4", bottom: "#4f76b4", shoes: "#efc6ae", hair: "#f29aa2", sleeves: "long", skirt: 0.13 },
    }),
  ]).then(([denji, aki, power]) => {
    const head = (f) => f.bones.head.getWorldPosition(new THREE.Vector3());
    [denji, aki, power].forEach((f) => {
      f.apply({});
      f.root.updateMatrixWorld(true);
    });

    // Denji: his collar and tie (the mop comes with the figure).
    dress(w, denji, { collar: "#f3f6fa", tie: "flat", belt: "#6b3f22" });
    paintEyes(denji, "#8a4a22", "#1a0f0a");

    // Aki: black hair tied up in his topknot.
    dress(w, aki, { collar: "#f3f6fa", tie: "#141a26", belt: "#1f1712" });
    const black = w.ink({ tint: "#141418", tone: 0.8, rim: 1.3 });
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), black);
    bun.scale.set(1, 0.85, 1.15);
    bun.position.copy(head(aki)).add(v3(0, 0.232, -0.07));
    const tuft = spike(black, bun.position.clone().add(v3(0, 0.02, -0.01)), v3(0, 0.75, -0.65), 0.075, 0.03);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.018, 12), w.flat);
    band.position.copy(bun.position).add(v3(0, 0.03, -0.02));
    band.rotation.x = -0.7;
    [bun, tuft].forEach((m) => outline(m, w.line));
    pin(scene, aki.bones.head, bun, tuft, band);
    paintEyes(aki, "#3a4a63", "#0e1218");

    // Power: the two red horns, and her eyes yellow round a red centre.
    const red = w.ink({ tint: "#cf2330", tone: 0.9, rim: 1.0, spec: 0.6 });
    const horns = [-1, 1].map((s) => spike(red, head(power).add(v3(s * 0.05, 0.19, 0.04)), v3(s * 0.35, 0.9, 0.22), 0.085, 0.017));
    horns.forEach((m) => outline(m, w.line));
    pin(scene, power.bones.head, ...horns);
    paintEyes(power, "#e8b52a", "#b0182a");
    clearThroat(power, "#4f76b4");
    [denji, aki, power].forEach(gripBones);

    // Seat each of them: hips over their cushion, facing the table.
    const legs = { denji: CROSS, power: CROSS, aki: SEIZA };
    for (const [name, f] of Object.entries({ denji, aki, power })) {
      const s = SEATS[name];
      f.ik = createArmIK(f);
      f.legs = legs[name];
      f.root.rotation.y = s.yaw;
      f.root.updateMatrixWorld(true);
      const hips = f.bones.hips.getWorldPosition(new THREE.Vector3());
      f.root.position.set(s.x - hips.x, SIT - hips.y, s.z - hips.z);
      f.root.updateMatrixWorld(true);
      w.register(f.root);
    }
    w.light(...SUN);
    w.palette(MORNING);
    // A lower key on the bodies than the set, so a white shirt never matches skin.
    const bodyInks = new Set();
    [denji, aki, power].forEach((f) => f.root.traverse((o) => o.material?.uniforms?.uKey && bodyInks.add(o.material)));
    bodyInks.forEach((m) => m.uniforms.uKey.value.multiplyScalar(0.8));
    fogRange();
    w.sync();
  });

  /* ---- per-frame helpers ---- */
  const tq = new THREE.Quaternion();
  const dq = new THREE.Quaternion();
  const off = new THREE.Vector3();
  /** A point on the face, in the head's frame (x left, y up, z forward). */
  const facePoint = (f, pose, x, y, z, out) => {
    dq.copy(qEuler(pose.hips, tq));
    for (const j of ["spine", "chest", "neck", "head"]) dq.multiply(qEuler(pose[j], tq));
    dq.premultiply(f.root.quaternion);
    return f.bones.head.getWorldPosition(out).add(off.set(x, y, z).applyQuaternion(dq));
  };

  // How a thing is held. Toast: pinched by its bottom edge between thumb and
  // index. The cup: in the palm, the fingers curled round it. `drop` is how far
  // below the grip the thing's own origin sits (the cup's is its base).
  const HOLD_TOAST = "pinch";
  const HOLD_CUP = "palm";
  const CUP_DROP = 0.04;
  const ga = new THREE.Vector3();
  const gb = new THREE.Vector3();
  const gc = new THREE.Vector3();
  /** The grip point of `s` hand, from its finger bones (world). */
  const gripPoint = (f, s, kind, out) => {
    const g = f.grip[s];
    if (kind === "pinch") {
      g.thumb.getWorldPosition(ga);
      g.index.getWorldPosition(gb);
      return out.copy(ga).lerp(gb, 0.5);
    }
    g.hand.getWorldPosition(ga);
    g.knuckle.getWorldPosition(gb);
    g.tip.getWorldPosition(gc);
    return out.copy(ga).lerp(gb, 0.7).lerp(gc, 0.4);
  };
  /** After a figure's final pose: where each hand's grips sit off its wrist. */
  const measureGrip = (f) => {
    for (const s of ["l", "r"]) {
      const g = f.grip[s];
      const wrist = g.hand.getWorldPosition(gc.clone());
      gripPoint(f, s, "pinch", g.pinchOff).sub(wrist);
      gripPoint(f, s, "palm", g.palmOff).sub(wrist);
    }
  };
  const heldAt = (f, s, kind, drop, out) => gripPoint(f, s, kind, out).add(off.set(0, -drop, 0));
  /** The wrist target that puts a held thing at `p` (last frame's grip offset). */
  const wristFor = (f, s, kind, drop, p, out) => out.copy(p).sub(kind === "pinch" ? f.grip[s].pinchOff : f.grip[s].palmOff).add(off.set(0, drop, 0));
  const top = new THREE.Vector3();
  /**
   * The wrist target that brings a held thing's top edge (`tipY` up it, the
   * thing tipped by `tilt` toward the holder) to `reach` in front of the lips.
   */
  const toLips = (f, pose, s, k, drop, tipY, tilt, reach, out) => {
    facePoint(f, pose, 0, 0.03, 0.1 + reach, out);
    top.set(0, tipY * Math.cos(tilt), tipY * Math.sin(tilt)).applyAxisAngle(UP, f.root.rotation.y);
    return wristFor(f, s, k, drop, out.sub(top), out);
  };

  // Scratch points per anchor, so tracks can read them lazily.
  const P = {};
  const pt = (name) => (P[name] ??= new THREE.Vector3());
  // One scratch target per hand, so tracks never allocate.
  const aim = Array.from({ length: 6 }, () => new THREE.Vector3());

  const HINT = {
    l: v3(0.7, -0.7, -0.1).normalize(),
    r: v3(-0.7, -0.7, -0.1).normalize(),
    rFwd: v3(-0.8, -0.55, 0.15).normalize(),
    rDown: v3(-0.2, -0.95, 0.1).normalize(),
    lHigh: v3(0.6, 0.2, -0.75).normalize(),
  };

  // World spots on the table.
  const T = TABLE.top;
  const spots = {
    dRestR: v3(0.25, T + 0.085, -0.36),
    dRestL: v3(0.58, T + 0.085, -0.4),
    dGesture: v3(0.22, T + 0.24, -0.4),
    dReach: v3(-0.06, T + 0.25, -0.5),
    dBelly: v3(0.34, T + 0.02, -0.55),
    dSlapUp: v3(0.58, T + 0.2, -0.38),
    dSlapDown: v3(0.58, T + 0.075, -0.37),
    pRestL: v3(-0.26, T + 0.085, -0.37),
    pRestR: v3(-0.56, T + 0.085, -0.35),
    pPoint: v3(-0.02, T + 0.27, -0.46),
    pBelly: v3(-0.46, T + 0.0, -0.56),
    aRestL: v3(0.54, T + 0.09, 0.22),
    aRestR: v3(0.55, T + 0.09, -0.14),
    handoff: v3(0.5, T + 0.2, -0.34),
    take: v3(0.44, T + 0.15, -0.4),
  };

  const sx = new THREE.Vector3();
  const sy = new THREE.Vector3();
  const sz = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  /**
   * The slice pinched between thumb and index by its bottom edge: upright and
   * tipped toward the holder (the lean the reaches aim for, so the top edge
   * lands at the lips), turned so its faces meet the thumb and the finger.
   */
  const placeHeld = (obj, f, s, scale = 1) => {
    obj.visible = scale > 0.01;
    const g = f.grip[s];
    g.thumb.getWorldPosition(ga);
    g.index.getWorldPosition(gb);
    sy.set(0, Math.cos(TOAST_TILT), Math.sin(TOAST_TILT)).applyAxisAngle(UP, f.root.rotation.y);
    sz.subVectors(gb, ga);
    sz.addScaledVector(sy, -sz.dot(sy));
    if (sz.lengthSq() < 1e-8) sz.set(0, 0, 1).applyAxisAngle(UP, f.root.rotation.y);
    sz.normalize();
    sx.crossVectors(sy, sz).normalize();
    obj.quaternion.setFromRotationMatrix(basis.makeBasis(sx, sy, sz));
    obj.position.copy(ga.lerp(gb, 0.5));
    obj.scale.set(1, Math.max(0.01, scale), 1);
  };

  const updateCast = (c, time) => {
    const { denji, power, aki } = cast;
    const breathe = (ph) => Math.sin(time * 1.7 + ph) * 0.012;

    /* ── Denji ── */
    let dp = schedule(c, denjiPoses.eat, [
      [1.7, 2.3, denjiPoses.talk],
      [3.05, 3.4, denjiPoses.hey],
      [4.5, 5.2, denjiPoses.sulk],
      [6.1, 6.6, denjiPoses.laugh],
      [9.5, 10.2, denjiPoses.take],
      [10.9, 11.7, denjiPoses.eat],
    ]);
    dp.spine[0] += breathe(0);
    dp = { ...dp, ...denji.legs };
    denji.apply(dp);
    denji.root.updateMatrixWorld(true);
    // The slice's top edge just in front of his lips; each bite pushes it in.
    const dMouth = () => {
      const bite = BITES.reduce((s, t) => s + pulse(c, t, 0.08), 0);
      return toLips(denji, dp, "r", HOLD_TOAST, 0, 0.11 * toastScale(c), TOAST_TILT, 0.025 - bite * 0.03, pt("dMouth"));
    };
    const dRight = track(c, [
      [0, dMouth],
      [1.75, dMouth],
      [2.35, spots.dGesture],
      [3.0, spots.dGesture],
      [3.5, spots.dReach],
      [4.3, spots.dReach],
      [5.1, spots.dRestR],
      [6.2, spots.dRestR],
      [6.7, spots.dBelly],
      [9.6, spots.dBelly],
      [10.65, spots.take],
      [10.75, spots.take],
      [11.7, dMouth],
      [12, dMouth],
    ], aim[0]);
    const dLeft = track(c, [
      [0, spots.dRestL],
      [6.3, spots.dRestL],
      [6.75, spots.dSlapUp],
      [7.0, spots.dSlapDown],
      [7.45, spots.dSlapUp],
      [8.1, spots.dSlapUp],
      [8.35, spots.dSlapDown],
      [8.9, spots.dRestL],
      [12, spots.dRestL],
    ], aim[1]);
    denji.ik.solve(dp, "r", dRight, c > 1.8 && c < 3.2 ? HINT.rDown : c > 3.2 && c < 5 ? HINT.rFwd : HINT.r);
    denji.ik.solve(dp, "l", dLeft, HINT.l);
    denji.apply(dp);
    denji.root.updateMatrixWorld(true);
    denji.ik.measure();
    measureGrip(denji);

    /* ── Power ── */
    let pp = schedule(c, powerPoses.eye, [
      [2.15, 2.6, powerPoses.lunge],
      [2.95, 3.4, powerPoses.smug],
      [6.5, 7.0, powerPoses.laugh],
      [9.4, 10.6, powerPoses.eye],
    ]);
    pp.spine[0] += breathe(1.3);
    pp = { ...pp, ...power.legs };
    power.apply(pp);
    power.root.updateMatrixWorld(true);
    const toastNow = () => {
      // The slice where it is in Denji's hand, as she goes for it.
      pt("toast").copy(table.held.position);
      return wristFor(power, "l", HOLD_TOAST, 0, pt("toast"), pt("pGrab"));
    };
    const pMouth = () => {
      const bite = POWER_BITES.reduce((s, t) => s + pulse(c, t, 0.08), 0);
      return toLips(power, pp, "l", HOLD_TOAST, 0, 0.11 * Math.max(0.12, toastScale(c)), TOAST_TILT, 0.025 - bite * 0.03, pt("pMouth"));
    };
    const pLeft = track(c, [
      [0, spots.pRestL],
      [2.2, spots.pRestL],
      [2.85, toastNow],
      [2.95, toastNow],
      [3.5, pMouth],
      [5.7, pMouth],
      [6.3, spots.pRestL],
      [6.75, spots.pPoint],
      [9.4, spots.pPoint],
      [10.0, spots.pRestL],
      [12, spots.pRestL],
    ], aim[2]);
    const pRight = track(c, [
      [0, spots.pRestR],
      [6.6, spots.pRestR],
      [7.0, spots.pBelly],
      [9.4, spots.pBelly],
      [9.9, spots.pRestR],
      [12, spots.pRestR],
    ], aim[3]);
    power.ik.solve(pp, "l", pLeft, c > 2 && c < 3.3 ? HINT.lHigh : HINT.l);
    power.ik.solve(pp, "r", pRight, HINT.r);
    power.apply(pp);
    power.root.updateMatrixWorld(true);
    power.ik.measure();
    measureGrip(power);

    /* ── Aki ── */
    let ap = schedule(c, akiPoses.eat, [
      [3.45, 3.95, akiPoses.sip],
      [4.95, 5.4, akiPoses.eat],
      [5.55, 5.9, akiPoses.inhale],
      [5.9, 6.3, akiPoses.slump],
      [6.9, 7.5, akiPoses.watch],
      [9.3, 9.9, akiPoses.reach],
      [10.8, 11.6, akiPoses.eat],
    ]);
    ap.spine[0] += breathe(2.6);
    ap = { ...ap, ...aki.legs };
    aki.apply(ap);
    aki.root.updateMatrixWorld(true);
    const cupGrab = () => wristFor(aki, "l", HOLD_CUP, CUP_DROP, table.cupRest, pt("cupGrab"));
    const aSip = () => toLips(aki, ap, "l", HOLD_CUP, CUP_DROP, 0.085, -0.55 * cupTip(c), 0.01, pt("aSip"));
    const rackGrab = () => wristFor(aki, "r", HOLD_TOAST, 0, pt("rack").copy(table.rack).add(off.set(0, 0.03, 0)), pt("rackGrab"));
    const aLeft = track(c, [
      [0, spots.aRestL],
      [3.0, spots.aRestL],
      [3.4, cupGrab],
      [3.45, cupGrab],
      [4.1, aSip],
      [4.9, aSip],
      [5.5, cupGrab],
      [5.55, cupGrab],
      [5.95, spots.aRestL],
      [12, spots.aRestL],
    ], aim[4]);
    const aRight = track(c, [
      [0, spots.aRestR],
      [9.3, spots.aRestR],
      [9.95, rackGrab],
      [10.05, rackGrab],
      [10.65, spots.handoff],
      [10.75, spots.handoff],
      [11.4, spots.aRestR],
      [12, spots.aRestR],
    ], aim[5]);
    aki.ik.solve(ap, "l", aLeft, HINT.l);
    aki.ik.solve(ap, "r", aRight, c > 9.3 && c < 11 ? HINT.rFwd : HINT.r);
    aki.apply(ap);
    aki.root.updateMatrixWorld(true);
    aki.ik.measure();
    measureGrip(aki);

    /* ── What they hold ── */
    const { held, cup, cupRest } = table;
    if (c < 2.9 || c >= 10.7) placeHeld(held, denji, "r", toastScale(c));
    else if (c < 5.7) placeHeld(held, power, "l", toastScale(c));
    else if (c < 10.0) held.visible = false;
    else placeHeld(held, aki, "r", 1);

    if (c > 3.42 && c < 5.52) {
      // Tipped toward him while he drinks, the palm round its middle.
      cup.rotation.set(-0.55 * cupTip(c), aki.root.rotation.y, 0, "YXZ");
      gripPoint(aki, "l", HOLD_CUP, cup.position).addScaledVector(sy.set(0, 1, 0).applyEuler(cup.rotation), -CUP_DROP);
    } else {
      cup.position.copy(cupRest);
      cup.rotation.set(0, aki.root.rotation.y, 0, "YXZ");
    }
    teaSteam.material.uniforms.uOrigin.value.copy(cup.position).add(off.set(0, 0.09, 0));
  };

  /* ---- camera: a slow drift round the table at seated eye level ---- */
  const look = new THREE.Vector3();
  const centre = v3(0.15, 0, -0.22);
  const placeCamera = (time) => {
    const ph = ((time - STATIC_TIME) / 28) * Math.PI * 2;
    const a = 0.1 + 0.36 * Math.sin(ph);
    const r = 2.6 - 0.12 * Math.cos(ph * 2);
    camera.position.set(centre.x + Math.sin(a) * r + pointer.x * 0.1, 0.98 + Math.sin(ph * 2) * 0.04 + pointer.y * 0.05, centre.z + Math.cos(a) * r);
    look.set(0.3 + Math.sin(a) * 0.12, 0.6, -0.3);
    camera.lookAt(look);
  };

  let settled = false;
  const update = (time) => {
    const t = staticMode ? STATIC_TIME : time;
    const c = ((t % LOOP) + LOOP) % LOOP;
    placeCamera(t);

    // The curtains breathe; the bottom hem moves most.
    for (const { m, base, side } of apt.curtains) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const hang = 0.5 - y / (apt.win.h + 0.22);
        const fold = Math.sin(x * 32 + side) * 0.018;
        const sway = Math.sin(t * 0.9 + x * 5 + side) * 0.03 * hang + Math.sin(t * 2.1 + x * 9) * 0.008 * hang;
        pos.setZ(i, fold + sway);
      }
      pos.needsUpdate = true;
    }
    softPoints.forEach((p) => (p.material.uniforms.uTime.value = t));

    if (cast.denji?.ik && cast.power?.ik && cast.aki?.ik) {
      // The first frame runs twice: what they hold follows each forearm's last direction.
      if (!settled) updateCast(c, t);
      settled = true;
      updateCast(c, t);
    }
  };

  const unsubscribeResize = stage.onResize(({ height, aspect }) => {
    w.bu.uAspect.value = aspect;
    const scale = (height * stage.renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    softPoints.forEach((p) => (p.material.uniforms.uScale.value = scale));
    w.sync();
  });

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      stage.renderer.toneMappingExposure = exposureWas;
      unsubscribeResize();
    },
  };
};
