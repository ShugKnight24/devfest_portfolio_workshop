import * as THREE from "three";
import { canvasTexture, easeInOutCubic, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createCaption } from "../sfx";
import { DRESS, LIGHT, OUTFITS, createCast, createCuts, createFx, createInkWorld, createSets, shotAt } from "../rezeKit";

/**
 * in the pool — a night at school, a swimming lesson, and a spider.
 *
 *   0  – 5    an empty classroom by moonlight; she writes 1 + 1 on the board
 *   5  – 9    she turns to her class of one: does anyone know the answer?
 *             his hand shoots up, "Two!", and she chalks the 2 in
 *   9  – 12.6 she writes "big ass" and asks if he knows what it means
 *   12.6–13.8 he can't read it: "I don't know."
 *   13.8–16   she comes down the aisle, leans in: "It means big ass."
 *   16 – 18   he jolts back in his chair: "You pervert!" "Sex-crazed girl!"
 *   18 – 20.3 he clutches his steaming head: "It's heating up from thinking
 *             this hard."
 *   20.3–23   "I know a way we can cool off": she holds her hand out, he
 *             stands, and his comes up under it; they hold hands
 *   23 – 26.5 out by the pool fence a black widow spins her web
 *   26.5–29   the deck: he can't swim, so she'll teach him
 *   29 – 33.5 she strips and tells him to, or his clothes will sink him
 *             (censored: a TV mosaic on her, a Pochita sticker on him)
 *   33.5–37.5 she jumps in; he stands shaking at the edge, then jumps
 *   37.5–42   the lesson: she walks backward holding his hands, he kicks
 *   42 – 46.5 a splash fight
 *   46.5–51   floating on their backs, side by side, from above
 *   51 – 57   she stands in the shallows looking down at herself; a ripple
 *             runs through, and for a moment the face in the water is the
 *             Bomb Devil's, finned casing and grin, until it settles back
 *   57 – 59   fade
 *
 * The lines in quotes are the beats of the film's scene, as told by the
 * speaker; the narration captions are original.
 */

const CYCLE = 59;
const STATIC_TIME = 48;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
// At the board, chalk up: the right arm raised to the slate, a small scrawl in the wrist.
const WRITE = (t) => ({
  ...STAND,
  head: [-0.12, 0.1, 0],
  rShoulder: [-2.05 + Math.sin(t * 9) * 0.06, 0, -0.18],
  rElbow: [-0.55 + Math.sin(t * 13) * 0.08, 0, 0],
});
// Turned to the room, chalk still up in her hand: a teacher's question.
const ASK = { ...STAND, head: [0.05, 0, 0.12], rShoulder: [-0.7, 0, -0.25], rElbow: [-1.5, 0, 0], lShoulder: [0.1, 0, 0.18] };
const walk = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.05, 0, 0],
    lShoulder: [0.35 * s, 0, 0.08],
    rShoulder: [-0.35 * s, 0, -0.08],
    lElbow: [-0.3, 0, 0],
    rElbow: [-0.3, 0, 0],
    lHip: [-0.45 * s, 0, 0],
    rHip: [0.45 * s, 0, 0],
    lKnee: [Math.max(0, s) * 0.6 + 0.1, 0, 0],
    rKnee: [Math.max(0, -s) * 0.6 + 0.1, 0, 0],
  };
};
// Square on the chair, facing the board, forearms down on his thighs.
const SIT = (t) => ({
  spine: [0.05, 0, 0],
  head: [0.02, Math.sin(t * 0.7) * 0.15, 0],
  lHip: [-1.45, 0, 0.07],
  rHip: [-1.45, 0, -0.07],
  lKnee: [1.5, 0, 0],
  rKnee: [1.5, 0, 0],
  lShoulder: [-0.35, 0, 0.04],
  lElbow: [-0.85, 0, 0],
  rShoulder: [-0.35, 0, -0.04],
  rElbow: [-0.85, 0, 0],
});
// Hand up, he knows this one.
const HAND_UP = (t) => ({
  ...SIT(t),
  spine: [-0.04, 0, 0],
  head: [-0.08, 0, 0],
  lShoulder: [-2.75, 0, 0.3],
  lElbow: [-0.15, 0, 0],
});
// Shocked: reeling back in the chair, both palms up at her, head pulled back.
const SHOCK = (t) => ({
  ...SIT(t),
  spine: [-0.28, 0, 0],
  head: [-0.25, Math.sin(t * 3) * 0.06, 0],
  lShoulder: [-1.35, 0, 0.55],
  lElbow: [-1.35, 0, 0],
  rShoulder: [-1.35, 0, -0.55],
  rElbow: [-1.35, 0, 0],
});
// He can't read it: head cocked, palms turned up off his thighs.
const DUNNO = (t) => ({
  ...SIT(t),
  head: [0.05, 0, 0.22],
  lShoulder: [-0.55, 0, 0.32],
  lElbow: [-1.55, 0, 0],
  rShoulder: [-0.55, 0, -0.32],
  rElbow: [-1.55, 0, 0],
});
// Overheating: both hands clamped to the sides of his head, which shakes.
const HEAT = (t) => ({
  ...SIT(t),
  spine: [0.12, 0, 0],
  head: [0.18, Math.sin(t * 16) * 0.09, 0],
  lShoulder: [-1.9, 0, 0.62],
  lElbow: [-2.8, 0, 0],
  rShoulder: [-1.7, 0, -1.1],
  rElbow: [-2.4, 0, 0],
});
// Her right hand out to him, low between them; his left back to her.
const REACH = { ...STAND, head: [0.1, 0, 0], rShoulder: [-0.55, 0, -0.12], rElbow: [-0.5, 0, 0] };
const REACH_L = { ...STAND, head: [0.1, 0, 0], lShoulder: [-0.5, 0, 0.12], lElbow: [-0.5, 0, 0] };
// Leaning in over his desk.
const LEAN = { ...STAND, spine: [0.35, 0, 0], head: [0.1, 0, 0.1], lShoulder: [0.15, 0, 0.2], rShoulder: [0.15, 0, -0.2] };
// The strip: arms flung up as it all comes off, then hands on her hips.
const ARMS_UP = { ...STAND, head: [-0.15, 0, 0], lShoulder: [-2.9, 0, 0.3], rShoulder: [-2.9, 0, -0.3], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const HIPS = { ...STAND, head: [0.02, 0, 0.12], lShoulder: [0.15, 0, 0.75], lElbow: [-1.5, 0, 0], rShoulder: [0.15, 0, -0.75], rElbow: [-1.5, 0, 0] };
// At the edge: hunched, hugging himself, knees soft, looking down at the water.
const SCARED = {
  spine: [0.35, 0, 0],
  head: [0.45, 0, 0],
  lShoulder: [-0.45, 0, -0.4],
  rShoulder: [-0.45, 0, 0.4],
  lElbow: [-2.1, 0, 0],
  rElbow: [-2.1, 0, 0],
  lHip: [-0.35, 0, 0],
  rHip: [-0.35, 0, 0],
  lKnee: [0.6, 0, 0],
  rKnee: [0.6, 0, 0],
};
// Off the edge: arms flung up and forward, one knee tucked.
const LEAP = {
  spine: [0.12, 0, 0],
  head: [-0.2, 0, 0],
  lShoulder: [-2.5, 0, 0.35],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-2.5, 0, -0.35],
  rElbow: [-0.3, 0, 0],
  lHip: [-1.1, 0, 0.1],
  lKnee: [1.5, 0, 0],
  rHip: [-0.3, 0, -0.08],
  rKnee: [0.7, 0, 0],
};
// Treading water, heads up: arms sculling just under the surface, legs cycling.
const SWIM = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.1, 0, 0],
    head: [-0.2, 0, 0],
    lShoulder: [-0.6 + s * 0.25, 0, 0.95],
    lElbow: [-0.5 - s * 0.3, 0, 0],
    rShoulder: [-0.6 - s * 0.25, 0, -0.95],
    rElbow: [-0.5 + s * 0.3, 0, 0],
    lHip: [-0.4 - s * 0.4, 0, 0.1],
    rHip: [-0.4 + s * 0.4, 0, -0.1],
    lKnee: [0.8 + s * 0.4, 0, 0],
    rKnee: [0.8 - s * 0.4, 0, 0],
  };
};
// The lesson. Her: standing in the water, arms out in front holding his hands.
const HOLD = { ...STAND, spine: [0.15, 0, 0], head: [0.15, 0, 0], lShoulder: [-1.35, 0, 0.12], rShoulder: [-1.35, 0, -0.12], lElbow: [-0.15, 0, 0], rElbow: [-0.15, 0, 0] };
// Him: face down, arms out ahead to her, flutter kick.
const KICK = (p) => ({
  head: [-0.5, 0, 0],
  lShoulder: [-2.95, 0, 0.12],
  rShoulder: [-2.95, 0, -0.12],
  lElbow: [-0.05, 0, 0],
  rElbow: [-0.05, 0, 0],
  lHip: [Math.sin(p) * 0.35, 0, 0.04],
  rHip: [-Math.sin(p) * 0.35, 0, -0.04],
  lKnee: [0.25 + Math.max(0, Math.sin(p)) * 0.4, 0, 0],
  rKnee: [0.25 + Math.max(0, -Math.sin(p)) * 0.4, 0, 0],
});
// A splash: the right arm sweeps forward along the surface.
const sweep = (k) => ({ rShoulder: [lerp(0.2, -1.4, k), 0, lerp(-1.2, -0.2, k)], rElbow: [-0.2, 0, 0] });
// On their backs. `inner` is the arm on the side of the other one.
const FLOAT = (t, inner) => {
  const sway = Math.sin(t * 0.8) * 0.08;
  const wide = 1.2 + sway;
  const near = 0.42 + sway * 0.3;
  return {
    spine: [-0.05, 0, 0],
    head: [-0.15, 0, 0],
    lShoulder: [inner === "l" ? 0.05 : -0.2, 0, inner === "l" ? near : wide],
    lElbow: [-0.3, 0, 0],
    rShoulder: [inner === "r" ? 0.05 : -0.2, 0, -(inner === "r" ? near : wide)],
    rElbow: [-0.3, 0, 0],
    lHip: [0, 0, 0.15],
    rHip: [0, 0, -0.15],
  };
};

const SHOTS = [
  { t: 0, id: "room" },
  { t: 5, id: "ask" },
  { t: 6.4, id: "answer" },
  { t: 7.5, id: "chalk" },
  { t: 9, id: "ass" },
  { t: 12.6, id: "dunno" },
  { t: 13.8, id: "tell" },
  { t: 16, id: "shock" },
  { t: 18, id: "heat" },
  { t: 20.3, id: "cool" },
  { t: 23, id: "web" },
  { t: 26.5, id: "deck" },
  { t: 29, id: "strip" },
  { t: 33.5, id: "edge" },
  { t: 37.5, id: "lesson" },
  { t: 42, id: "play" },
  { t: 46.5, id: "float" },
  { t: 51, id: "mirror" },
];
// When the face in the water is not hers.
const OTHER = { from: 52.9, to: 54.4 };
// Where she stands for it, in the shallow end by the near wall.
const MIRROR_R = { x: -1.25, z: 2.3 };
// When the clothes come off.
const STRIP = { reze: 29.6, denji: 31.8 };

/* ---- Hand in hand: a two-bone arm IK that puts a palm on a point ---- */
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const qOf = (r, out) => out.setFromEuler(_e.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));
/**
 * For one figure: `reach(pose, s, palmAt, palmFacing, hint)` returns a copy
 * of `pose` with the `s` arm ("l"/"r") solved so the middle of that palm's
 * skin sits on `palmAt` (world) and the palm faces `palmFacing` (world, unit),
 * the elbow out toward `hint` (the figure's own frame). The figure must be
 * placed (root position and rotation set, grounded) before the call; it is
 * left applied in the returned pose. Solved in a few passes against the
 * posed hand itself, so the palm lands exactly whatever the rig's proportions.
 */
const createReach = (fig) => {
  fig.apply({});
  fig.root.updateMatrixWorld(true);
  const local = (o) => fig.root.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  const arms = {};
  for (const s of ["l", "r"]) {
    const sh = fig.bones[`${s}Shoulder`];
    const el = fig.bones[`${s}Elbow`];
    const H = fig.handRig?.[s];
    if (!sh || !el || !H) continue;
    const S = local(sh);
    const E = local(el);
    const W = local(H.bone);
    // The middle of the palm's skin, in the hand bone's frame.
    const palm = H.u.clone().multiplyScalar(H.mcpU * 0.55).addScaledVector(H.n, H.palmPad);
    arms[s] = { sh, el, H, palm, l1: S.distanceTo(E), l2: E.distanceTo(W) };
  }
  const dp = new THREE.Quaternion();
  const dpInv = new THREE.Quaternion();
  const q1 = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const d = new THREE.Vector3();
  const v = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const h = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const ax = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  const got = new THREE.Vector3();
  const n = new THREE.Vector3();
  const fore = new THREE.Vector3();
  const elW = new THREE.Vector3();
  // Shoulder and elbow angles that put the wrist on `target` (world).
  const solve = (pose, s, target, hint, roll) => {
    const { sh, l1, l2 } = arms[s];
    dp.copy(qOf(pose.hips, _q));
    dp.multiply(qOf(pose.spine, _q)).multiply(qOf(pose.chest, _q));
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
    twist.setFromAxisAngle(d, Math.atan2(d.dot(ax.crossVectors(a, b)), a.dot(b)));
    q1.premultiply(twist);
    _e.setFromQuaternion(q1, "XYZ");
    pose[`${s}Shoulder`] = [_e.x, _e.y, _e.z];
    // The forearm's own roll (about its length) turns the palm.
    pose[`${s}Elbow`] = [e, roll, 0];
  };
  const reach = (base, s, palmAt, palmFacing, hint) => {
    const arm = arms[s];
    const pose = { ...base };
    if (!arm) return pose;
    let roll = 0;
    wrist.copy(palmAt);
    for (let i = 0; i < 4; i++) {
      solve(pose, s, wrist, hint, roll);
      fig.apply(pose);
      fig.root.updateMatrixWorld(true);
      // Roll the forearm until the palm faces the way it should.
      arm.H.bone.getWorldPosition(got);
      arm.el.getWorldPosition(elW);
      fore.subVectors(elW, got).normalize();
      n.copy(arm.H.n).transformDirection(arm.H.bone.matrixWorld);
      a.copy(n).addScaledVector(fore, -fore.dot(n));
      b.copy(palmFacing).addScaledVector(fore, -fore.dot(palmFacing));
      if (a.lengthSq() > 1e-8 && b.lengthSq() > 1e-8) roll += Math.atan2(fore.dot(ax.crossVectors(a, b)), a.dot(b));
      solve(pose, s, wrist, hint, roll);
      fig.apply(pose);
      fig.root.updateMatrixWorld(true);
      // Then move the wrist by however far the palm still misses.
      arm.H.bone.localToWorld(got.copy(arm.palm));
      wrist.add(v.subVectors(palmAt, got));
    }
    solve(pose, s, wrist, hint, roll);
    fig.apply(pose);
    fig.root.updateMatrixWorld(true);
    return pose;
  };
  /** Where the `s` palm's skin is now, and which way it faces (world). */
  const palmOf = (s, at = new THREE.Vector3(), facing = new THREE.Vector3()) => {
    const arm = arms[s];
    arm.H.bone.localToWorld(at.copy(arm.palm));
    facing.copy(arm.H.n).transformDirection(arm.H.bone.matrixWorld);
    return { at, facing };
  };
  return { reach, palmOf };
};
const reachers = new WeakMap();
const reacherOf = (fig) => {
  if (!reachers.has(fig)) reachers.set(fig, createReach(fig));
  return reachers.get(fig);
};

/* ---- Chalk on the board ---- */
const chalkLine = (text, w, h) => {
  // How much of the canvas the words take up, so the reveal ends on the last letter.
  let used = 1;
  const tex = canvasTexture(1024, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${Math.round(H * 0.62)}px "Chalkboard SE", "Comic Sans MS", "Marker Felt", cursive`;
    ctx.textBaseline = "middle";
    // Two passes, a hair apart: the dry, broken edge of chalk.
    ctx.fillStyle = "rgba(236, 242, 232, 0.55)";
    ctx.fillText(text, 14, H * 0.54);
    ctx.fillStyle = "rgba(244, 248, 240, 0.85)";
    ctx.fillText(text, 10, H * 0.5);
    used = Math.min(1, (ctx.measureText(text).width + 24) / W);
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  mesh.userData = { w, h };
  /** Written up to `k` of the way along, left to right. */
  mesh.userData.reveal = (k, left, y, z) => {
    const r = Math.max(0.001, k * used);
    mesh.scale.set(w * r, h, 1);
    mesh.position.set(left + (w * r) / 2, y, z);
    tex.repeat.x = r;
    mesh.visible = k > 0;
  };
  return mesh;
};

/* ---- The censors ---- */
// Broadcast mosaic: big skin-tone pixels.
const mosaic = (seed) =>
  canvasTexture(
    64,
    64,
    (ctx) => {
      let s = seed;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const l = 78 + rnd() * 14;
          ctx.fillStyle = `hsl(${18 + rnd() * 10}, ${40 + rnd() * 20}%, ${l}%)`;
          ctx.fillRect(x * 8, y * 8, 8, 8);
        }
      }
    },
    { color: true },
  );
// Pochita, keeping Denji decent: an orange pup with a chainsaw out of his forehead.
const pochita = () =>
  canvasTexture(
    256,
    256,
    (ctx) => {
      ctx.clearRect(0, 0, 256, 256);
      // The blade.
      ctx.fillStyle = "#cfd3d6";
      ctx.strokeStyle = "#1b1414";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(104, 18, 48, 92, 20);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1b1414";
      for (let y = 30; y < 104; y += 16) {
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(90, y + 7);
        ctx.lineTo(100, y + 12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(156, y);
        ctx.lineTo(166, y + 7);
        ctx.lineTo(156, y + 12);
        ctx.fill();
      }
      // The pup.
      ctx.fillStyle = "#f08a2b";
      ctx.beginPath();
      ctx.ellipse(128, 160, 92, 76, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Ears.
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(128 + sx * 84, 150, 18, 30, sx * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // Eyes, nose, a toothy grin.
      ctx.fillStyle = "#1b1414";
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(128 + sx * 34, 150, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(128, 172, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 182, 26, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(128 + sx * 14, 205);
        ctx.lineTo(128 + sx * 8, 218);
        ctx.lineTo(128 + sx * 2, 206);
        ctx.fill();
      }
    },
    { color: true },
  );
const censorSprite = (map, sx, sy) => {
  // Drawn over the body whatever bends in front of it; `pin` hides it under the water.
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, toneMapped: false, depthTest: false }));
  s.scale.set(sx, sy, 1);
  s.renderOrder = 30;
  s.visible = false;
  return s;
};

/* ---- The black widow and her web ---- */
const buildWeb = (hub, rect) => {
  // Twelve radials out to a frame, the frame anchored to the posts and the
  // rails, then the capture spiral laid from the outside in.
  const N = 16;
  const reach = (a) => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    // A radial that runs dead level never meets the rails: skip them rather than divide by zero.
    const tx = Math.abs(dx) < 1e-9 ? Infinity : dx > 0 ? (rect.x1 - hub.x) / dx : (rect.x0 - hub.x) / dx;
    const ty = Math.abs(dy) < 1e-9 ? Infinity : dy > 0 ? (rect.y1 - hub.y) / dy : (rect.y0 - hub.y) / dy;
    return Math.min(tx, ty);
  };
  const angles = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2 + 0.06 * Math.sin(i * 2.7));
  const R = angles.map((a) => reach(a));
  const pt = (i, f) => [hub.x + Math.cos(angles[i % N]) * R[i % N] * f, hub.y + Math.sin(angles[i % N]) * R[i % N] * f];
  const segs = [];
  for (let i = 0; i < N; i++) {
    segs.push([pt(i, 1), pt(i, 0.86)]); // anchor to the frame
    segs.push([pt(i, 0.86), pt(i + 1, 0.86)]); // the frame
  }
  for (let i = 0; i < N; i++) segs.push([[hub.x, hub.y], pt(i, 0.86)]); // radials
  const scaffold = segs.length;
  // A small open hub ring first, so the centre reads as a real orb.
  for (let i = 0; i < N; i++) segs.push([pt(i, 0.07), pt(i + 1, 0.07)]);
  const TURNS = 13;
  let prev = pt(0, 0.82);
  for (let k = 1; k <= TURNS * N; k++) {
    const f = 0.82 - (k / (TURNS * N)) * 0.64;
    const p = pt(k, f);
    segs.push([prev, p]);
    prev = p;
  }
  const verts = new Float32Array(segs.length * 6);
  segs.forEach(([a, b], i) => verts.set([a[0], a[1], 0, b[0], b[1], 0], i * 6));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#eef4ff", transparent: true, opacity: 0.85, toneMapped: false }));
  // Dew on the capture spiral, catching the moon: one bead on every other crossing.
  const beadPts = [];
  for (let i = scaffold + N; i < segs.length; i += 2) beadPts.push(segs[i][0][0], segs[i][0][1], 0.001);
  const beadGeo = new THREE.BufferGeometry();
  beadGeo.setAttribute("position", new THREE.Float32BufferAttribute(beadPts, 3));
  const beads = new THREE.Points(
    beadGeo,
    new THREE.PointsMaterial({ color: "#f4f8ff", size: 2.6, sizeAttenuation: false, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }),
  );
  const beadFrom = scaffold + N;
  return { lines, beads, beadFrom, segs, scaffold, pt };
};

/**
 * A black widow, built to read at a glance: a glossy round abdomen with the
 * red hourglass on its belly, a small cephalothorax, and eight thin legs in
 * three joints each, knees bent up off the web the way a widow stands.
 * Head up the +y axis, belly toward +z (out of the web, toward the pool); the
 * web lies at local z = -0.012. Exported for the church hint in Jane slept.
 */
export const buildSpider = (w) => {
  const g = new THREE.Group();
  const black = w.ink({ tint: "#0e0c12", tone: 0.5, rim: 1.1 });
  const red = new THREE.MeshBasicMaterial({ color: "#e3132d", toneMapped: false, side: THREE.DoubleSide });
  const gloss = new THREE.MeshBasicMaterial({ color: "#dfe7ff", transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false });

  // The abdomen: big, round, glossy.
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.027, 24, 18), black);
  abdomen.scale.set(1, 1.18, 0.95);
  abdomen.position.set(0, -0.03, 0);
  g.add(abdomen);
  // A moonlit highlight on the shoulder of the abdomen.
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), gloss);
  shine.scale.set(1.5, 0.8, 0.3);
  shine.position.set(-0.009, -0.016, 0.022);
  shine.rotation.z = 0.5;
  g.add(shine);
  // The red hourglass on her belly: two triangles, tip to tip.
  const hg = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.0075, 0.011, 0), new THREE.Vector3(0.0075, 0.011, 0), new THREE.Vector3(0, 0.0005, 0),
    new THREE.Vector3(0, -0.0005, 0), new THREE.Vector3(0.0075, -0.011, 0), new THREE.Vector3(-0.0075, -0.011, 0),
  ]);
  const hourglass = new THREE.Mesh(hg, red);
  hourglass.position.set(0, -0.03, 0.0262);
  hourglass.renderOrder = 2;
  g.add(hourglass);

  // The waist, then the cephalothorax with the fangs at its front.
  const waist = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), black);
  waist.position.set(0, -0.002, 0);
  g.add(waist);
  const head = new THREE.Group();
  head.position.set(0, 0.012, 0);
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), black);
  thorax.scale.set(1, 1.2, 0.75);
  head.add(thorax);
  for (const sx of [-1, 1]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.0022, 0.007, 6), black);
    fang.position.set(sx * 0.003, 0.014, 0.002);
    head.add(fang);
  }
  g.add(head);

  // Eight legs, three segments each, drawn between computed joints so the
  // knees can lift and the feet stay on the silk.
  const segGeo = new THREE.CylinderGeometry(0.0016, 0.0012, 1, 6).translate(0, 0.5, 0);
  const UP = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const place = (mesh, a, b) => {
    dir.subVectors(b, a);
    const len = dir.length();
    mesh.position.copy(a);
    mesh.quaternion.setFromUnitVectors(UP, dir.multiplyScalar(1 / (len || 1)));
    mesh.scale.set(1, len, 1);
  };
  // Angle of each pair from straight ahead, and its length: the front pair
  // longest, the third shortest, as on a real widow.
  const PAIRS = [
    { a: 0.42, len: 1.3 },
    { a: 1.0, len: 1.05 },
    { a: 1.95, len: 0.82 },
    { a: 2.55, len: 1.12 },
  ];
  const legs = [];
  for (const side of [-1, 1]) {
    PAIRS.forEach((pair, i) => {
      const parts = [0, 1, 2].map(() => {
        const m = new THREE.Mesh(segGeo, black);
        g.add(m);
        return m;
      });
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0021, 6, 5), black);
      g.add(knob);
      legs.push({ side, i, ...pair, parts, knob, hip: new THREE.Vector3(side * 0.0075, 0.016 - i * 0.0045, 0.001) });
    });
  }
  const K = new THREE.Vector3();
  const A = new THREE.Vector3();
  const T = new THREE.Vector3();
  const pose = (t, speed) => {
    for (const leg of legs) {
      const ph = t * 22 + leg.i * 1.6 + (leg.side > 0 ? Math.PI : 0);
      const ang = leg.a + Math.sin(ph) * 0.2 * speed;
      const lift = Math.max(0, Math.cos(ph)) * 0.008 * speed;
      const dx = leg.side * Math.sin(ang);
      const dy = Math.cos(ang);
      const L = 0.03 * leg.len;
      // The knee rises off the web; the shin comes back down; the foot grips the silk.
      K.set(leg.hip.x + dx * L * 0.75, leg.hip.y + dy * L * 0.75, 0.017 * leg.len + lift);
      A.set(K.x + dx * L * 0.95, K.y + dy * L * 0.95, 0.002 + lift * 0.5);
      T.set(A.x + dx * L * 0.75, A.y + dy * L * 0.75, -0.012 + lift * 0.3);
      place(leg.parts[0], leg.hip, K);
      place(leg.parts[1], K, A);
      place(leg.parts[2], A, T);
      leg.knob.position.copy(K);
    }
  };
  pose(0, 0);
  const gait = (t, speed) => pose(t, speed);
  return { group: g, gait, abdomen, head };
};

/* ---- The face in the water ---- */
// Her head and shoulders as the pool gives them back, drawn upright and
// turned three-quarters to the right.
// Each shape is stroked wide in moonlight, then filled dark over the top, so
// what is left is one pale rim round the whole silhouette.
const silhouette = (shapes, details) =>
  canvasTexture(512, 512, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c9f4ff";
    ctx.lineWidth = 20;
    shapes(ctx, () => ctx.stroke());
    ctx.fillStyle = "#030c16";
    shapes(ctx, () => ctx.fill());
    details?.(ctx);
  });
const shoulders = (ctx, paint) => {
  ctx.beginPath();
  ctx.moveTo(24, 512);
  ctx.quadraticCurveTo(48, 404, 196, 392);
  ctx.lineTo(312, 392);
  ctx.quadraticCurveTo(462, 404, 488, 512);
  ctx.closePath();
  paint();
  ctx.beginPath();
  ctx.rect(214, 300, 76, 100);
  paint();
};
const herFace = () =>
  silhouette((ctx, paint) => {
    shoulders(ctx, paint);
    // Long hair down her back and over the shoulders, the bun high behind.
    ctx.beginPath();
    ctx.moveTo(140, 190);
    ctx.quadraticCurveTo(118, 330, 150, 430);
    ctx.lineTo(352, 430);
    ctx.quadraticCurveTo(372, 330, 350, 190);
    ctx.closePath();
    paint();
    ctx.beginPath();
    ctx.ellipse(250, 210, 104, 118, 0, 0, Math.PI * 2);
    paint();
    ctx.beginPath();
    ctx.arc(176, 92, 50, 0, Math.PI * 2);
    paint();
  });
// The Bomb Devil's head on the same shoulders: a warhead on its side, nose
// forward and down, a finned tail lifted behind, and the grin.
const WARHEAD = { x: 272, y: 196, tilt: 0.36 };
const casing = (ctx) => {
  // Nose (+x) round and full, tapering back to the tail (-x).
  ctx.moveTo(130, 0);
  ctx.bezierCurveTo(130, 70, 70, 104, 10, 104);
  ctx.bezierCurveTo(-70, 104, -120, 52, -170, 26);
  ctx.lineTo(-170, -26);
  ctx.bezierCurveTo(-120, -52, -70, -104, 10, -104);
  ctx.bezierCurveTo(70, -104, 130, -70, 130, 0);
};
const bombFace = () =>
  silhouette(
    (ctx, paint) => {
      shoulders(ctx, paint);
      ctx.save();
      ctx.translate(WARHEAD.x, WARHEAD.y);
      ctx.rotate(WARHEAD.tilt);
      ctx.beginPath();
      casing(ctx);
      paint();
      // Two fins swept back off the tail, a third edge-on between them.
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-130, s * 30);
        ctx.lineTo(-205, s * 92);
        ctx.lineTo(-222, s * 84);
        ctx.lineTo(-196, s * 22);
        ctx.closePath();
        paint();
      }
      ctx.beginPath();
      ctx.rect(-226, -7, 70, 14);
      paint();
      ctx.restore();
    },
    (ctx) => {
      ctx.save();
      ctx.translate(WARHEAD.x, WARHEAD.y);
      ctx.rotate(WARHEAD.tilt);
      // Seams round the shell, catching a little light.
      ctx.strokeStyle = "rgba(143, 227, 255, 0.45)";
      ctx.lineWidth = 5;
      for (const [x, r] of [[-30, 92], [-95, 66]]) {
        ctx.beginPath();
        ctx.ellipse(x, 0, 16, r, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
      // The grin across the bottom of the nose: a dark slot, square teeth above and below.
      const at = (k) => [lerp(-6, 112, k), 96 - Math.pow(k, 1.5) * 62];
      ctx.strokeStyle = "#02070d";
      ctx.lineWidth = 24;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(...at(0));
      for (let i = 1; i <= 12; i++) ctx.lineTo(...at(i / 12));
      ctx.stroke();
      ctx.fillStyle = "#f4f1ea";
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const k = (i + 0.5) / 8;
        const [x, y] = at(k);
        const tilt = Math.atan2(at(k + 0.01)[1] - y, at(k + 0.01)[0] - x);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(tilt);
          ctx.fillRect(-6, side < 0 ? -22 : 3, 12, 19);
          ctx.strokeRect(-6, side < 0 ? -22 : 3, 12, 19);
          ctx.restore();
        }
      }
      ctx.restore();
      // The neck wound with fuse.
      ctx.strokeStyle = "rgba(143, 227, 255, 0.45)";
      ctx.lineWidth = 6;
      ctx.lineCap = "butt";
      for (let y = 322; y < 392; y += 16) {
        ctx.beginPath();
        ctx.moveTo(214, y + 8);
        ctx.lineTo(290, y);
        ctx.stroke();
      }
    },
  );
/**
 * Her reflection, laid flat on the water: `mix` crossfades from her face to
 * the other one, `ripple` sets how hard the surface breaks it up.
 */
const buildReflection = () => {
  const her = herFace();
  const other = bombFace();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uHer: { value: her }, uOther: { value: other }, uMix: { value: 0 }, uTime: { value: 0 }, uRipple: { value: 1 }, uFade: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uHer, uOther;
      uniform float uMix, uTime, uRipple, uFade;
      varying vec2 vUv;
      void main() {
        // Head and neck only, the shoulders lost in the water, and all of it
        // broken into wavering bands by the swell.
        vec2 uv = vec2(vUv.x, 0.2 + vUv.y * 0.8);
        uv.x += sin(uv.y * 44.0 + uTime * 5.0) * 0.007 * uRipple;
        uv.y += sin(uv.x * 23.0 - uTime * 3.0) * 0.005 * uRipple;
        vec4 col = mix(texture2D(uHer, uv), texture2D(uOther, uv), uMix);
        float sink = smoothstep(0.2, 0.42, uv.y);
        gl_FragColor = vec4(col.rgb, col.a * 0.9 * sink * uFade);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  // Flat on the water; the group's yaw turns its top away from the camera.
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3;
  const group = new THREE.Group();
  group.add(mesh);
  group.visible = false;
  return { group, mesh, uniforms: mat.uniforms, textures: [her, other] };
};

/* ---- Steam off an overheated head ---- */
const puff = () =>
  canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    const blobs = [[46, 74, 26], [78, 70, 28], [62, 46, 26]];
    ctx.fillStyle = "#1b1414";
    blobs.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#f6f8fa";
    blobs.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  });

export const createInThePoolScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["school", "pool"]);
  const cast = createCast(w, { chainsaw: false });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  const water = lot.sets.pool.water.material.uniforms;
  const school = lot.sets.school.group;
  const pool = lot.sets.pool.group;
  // The pool set's one lit school window sits right above the web and reads as
  // an empty caption box hanging in frame; here the school is dark like the rest.
  pool.traverse((o) => {
    if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.color.getHexString() === "ffe3a3") o.material.color.set("#24324a");
  });

  // The same two, with nothing on: swapped in when the clothes come off.
  const bareOf = (o) => ({ ...o, top: o.skin, bottom: o.skin, sleeve: o.skin, shoes: o.skin, footwear: "none", sleeves: "none", stockings: null, belt: null, tie: null, collar: null, neckband: null, trim: null, panel: null, drape: true });
  const bare = { denji: null, reze: null };
  const bareReady = Promise.all([
    createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.78, rim: 1.4 }, outfit: bareOf(OUTFITS.denji), dress: { spikes: DRESS.denji.spikes, shoes: false }, fist: 0.35 }),
    createModelFigure({ body: "SuperheroFemale", height: 1.62, hair: ["HairLong", "EyebrowsFemale"], line: w.line, ink: { tone: 0.8, rim: 1.4 }, outfit: bareOf(OUTFITS.reze), dress: { bun: true, fringe: "right", shoes: false }, fist: 0.3 }),
  ]).then(([d, r]) => {
    bare.denji = d;
    bare.reze = r;
    [d, r].forEach((f) => {
      f.root.visible = false;
      w.scene.add(f.root);
      w.register(f.root);
    });
  });
  // The censors ride the bare bodies.
  const censor = {
    rezeChest: censorSprite(mosaic(7), 0.27, 0.13),
    rezeHips: censorSprite(mosaic(31), 0.17, 0.15),
    denji: censorSprite(pochita(), 0.22, 0.22),
  };
  Object.values(censor).forEach((s) => w.scene.add(s));

  // Chalk, and what she writes with it.
  const chalk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.055, 8), w.ink({ tint: "#f4f6f0", tone: 1, rim: 0.4 }));
  const BOARD_Z = -3.085;
  const line1 = chalkLine("1 + 1 = ?", 2.4, 0.6);
  // The same line answered: swapped in as she chalks the 2 over the question mark.
  const line1a = chalkLine("1 + 1 = 2", 2.4, 0.6);
  const line2 = chalkLine("big ass", 2.6, 0.65);
  school.add(line1, line1a, line2);

  // Steam off his head when he thinks too hard.
  const steamMap = puff();
  const steam = [0, 1, 2].map(() => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamMap, transparent: true, depthWrite: false, toneMapped: false }));
    s.visible = false;
    w.scene.add(s);
    return s;
  });

  // Her face in the water, and the other one.
  const reflection = buildReflection();
  w.scene.add(reflection.group);

  // Out by the pool fence, between two posts and the rails: her web.
  const WEB_Z = -4.965;
  const web = buildWeb({ x: -0.5, y: 1.5 }, { x0: -0.97, x1: -0.03, y0: 0.84, y1: 2.11 });
  const webGroup = new THREE.Group();
  webGroup.position.z = WEB_Z;
  webGroup.add(web.lines, web.beads);
  pool.add(webGroup);
  const spider = buildSpider(w);
  webGroup.add(spider.group);
  const nSeg = web.segs.length;
  const spiderAt = { x: -0.5, y: 1.5, ang: Math.PI };

  // Their clothes, flung off on the deck.
  const cloth = (wd, d, tint) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.025, d), w.ink({ tint, tone: 0.8, rim: 0.5 }));
    m.visible = false;
    pool.add(m);
    return m;
  };
  const CLOTHES = {
    reze: [
      { m: cloth(0.34, 0.28, "#f1efe9"), v: [-1.1, 2.4, 0.5], spin: 7 },
      { m: cloth(0.28, 0.2, "#1d1b22"), v: [-0.7, 1.6, 0.9], spin: -9 },
      { m: cloth(0.08, 0.5, "#17161b"), v: [-1.4, 1.9, 0.2], spin: 11 },
    ],
    denji: [
      { m: cloth(0.4, 0.3, "#eef0ea"), v: [1.2, 2.5, 0.4], spin: -8 },
      { m: cloth(0.3, 0.55, "#2c3436"), v: [0.9, 1.7, 0.8], spin: 9 },
      { m: cloth(0.05, 0.4, "#15161b"), v: [1.4, 2.8, 0.1], spin: 14 },
    ],
  };

  const look = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  let prevC = -1;

  // Where things rest, in set coordinates.
  const CHAIR_TOP = 0.47; // the chair of the desk at (0.2, -1.4)
  const SEAT_D = { x: 0.2, z: -0.8 };
  const STOOD_D = { x: 0.02, z: -0.8 };
  const BESIDE = { x: -0.6, z: -0.92 };
  // Her walk from the board, where she stepped clear of it, down the aisle to his desk.
  const AISLE = [
    [-0.45, -2.62],
    [-0.6, -2.0],
    [-0.6, BESIDE.z],
  ];
  // Where their hands meet when he gets up: between them, on the side toward
  // us, at his belt. Half the skin gap above it for her palm, half below for his.
  const HOLD_AT = { x: -0.24, y: 1.06, z: -0.6 };
  const HOLD_GAP = 0.006;
  // Each palm sits back toward its owner (she is on -x, he on +x), so her
  // fingers close round the heel of his hand and his round hers.
  const HOLD_SLIDE = 0.035;
  const HOLD_R = 0.022;
  const handHold = new THREE.Vector3();
  const palmOn = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  // Elbows out and down, in each one's own frame.
  const HINT_R = new THREE.Vector3(-0.6, -0.8, -0.1).normalize();
  const HINT_L = new THREE.Vector3(0.6, -0.8, -0.1).normalize();
  const COPING = { z0: 2.8, z1: 3.0, top: 0.08 };
  const DECK_R = { x: -1.35, z: 3.5 };
  const DECK_D = { x: -0.55, z: 3.5 };
  const EDGE_D = { x: -0.62, z: 3.06 };
  const IN_R = { x: -1.2, z: 2.05 };
  const IN_D = { x: -0.66, z: 1.95 };

  const rest = (fig, { seatY = null, groundY = null, k = 1 }) => {
    fig.root.position.y = 0;
    const sy = seatY == null ? 0 : fig.seatOn(seatY, { update: false });
    fig.root.position.y = 0;
    const gy = groundY == null ? sy : fig.groundTo(groundY, { update: false });
    fig.root.position.y = seatY == null ? gy : groundY == null ? sy : Math.max(gy, lerp(sy, gy, k));
    fig.root.updateMatrixWorld(true);
  };
  const deckAt = (z) => (z > COPING.z0 - 0.12 && z < COPING.z1 + 0.12 ? COPING.top : 0);
  const along = (pts, k) => {
    const n = pts.length - 1;
    const f = Math.min(n - 1e-6, Math.max(0, k * n));
    const i = Math.floor(f);
    const u = f - i;
    const [a, b] = [pts[i], pts[i + 1]];
    return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), ry: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  };
  const shortWay = (from, to) => to + Math.round((from - to) / (Math.PI * 2)) * Math.PI * 2;
  /** A hop from one spot to another: up off the edge and down into the water. */
  const hop = (fig, from, to, j, topY, endY) => {
    fig.root.position.copy(at("pool", lerp(from.x, to.x, j), 0, lerp(from.z, to.z, j)));
    fig.root.position.y = lerp(topY, endY, j) + 1.6 * j * (1 - j);
  };

  const pelvis = new THREE.Vector3();
  const neck = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const mirrorAt = new THREE.Vector3();
  /**
   * A censor on the body: `along` of the way from the pelvis to the neck
   * (negative is below the pelvis), stood off the skin toward the camera so
   * it covers from any angle.
   */
  const pin = (sprite, fig, along, off) => {
    fig.bones.hips.getWorldPosition(pelvis);
    fig.bones.neck.getWorldPosition(neck);
    sprite.position.copy(pelvis).lerp(neck, along);
    toCam.copy(camera.position).sub(sprite.position).normalize();
    sprite.position.addScaledVector(toCam, off);
    // Under the surface the water covers them.
    sprite.visible = sprite.position.y > 0.04;
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    if (c < prevC) prevC = -1;
    const crossed = (t) => dt > 0 && prevC < t && c >= t;
    if (!cast.denji || !bare.denji) return;
    // Who is on screen: clothed until their strip, bare after.
    const nude = { reze: c >= 23 && c >= STRIP.reze, denji: c >= 23 && c >= STRIP.denji };
    const reze = nude.reze ? bare.reze : cast.reze;
    const denji = nude.denji ? bare.denji : cast.denji;
    cast.reze.root.visible = !nude.reze;
    bare.reze.root.visible = nude.reze;
    cast.denji.root.visible = !nude.denji;
    bare.denji.root.visible = nude.denji;
    Object.values(censor).forEach((s) => (s.visible = false));
    steam.forEach((s) => (s.visible = false));
    reflection.group.visible = false;
    const { shot, u } = shotAt(SHOTS, c);
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#e8fbff" };
    let text = "";
    let textR = "";
    [denji, reze].forEach((f) => f.root.rotation.set(0, 0, 0, "XYZ"));

    if (c < 23) {
      // ── The classroom ──
      lot.show("school");
      w.light(0.9, 0.5, 0.2); // moonlight from the windows
      w.palette(LIGHT.school);
      w.page({ mode: "still" });
      const o = lot.sets.school.origin;
      if (!chalk.parent || chalk.parent === school) reze.hold(chalk, { hand: "right", grip: "pinch" });
      chalk.visible = c < 20.9;

      // The board.
      const answered = c >= 8.2;
      line1.userData.reveal(answered ? 0 : easeInOutCubic(segment(c, 1.6, 3.8)), -2.1, 2.2, BOARD_Z);
      line1a.userData.reveal(answered ? 1 : 0, -2.1, 2.2, BOARD_Z);
      line2.userData.reveal(easeInOutCubic(segment(c, 9.4, 11.2)), -2.1, 1.55, BOARD_Z);

      // Her.
      const writing1 = segment(c, 1.6, 3.8);
      const writing2 = segment(c, 9.4, 11.2);
      const toHim = Math.atan2(SEAT_D.x - -1.4, SEAT_D.z - -2.62);
      let rx = -2.35;
      let rz = -2.62;
      let ry = Math.PI;
      let pose = STAND;
      if (c < 5) {
        rx = lerp(-2.35, -1.4, writing1);
        pose = c > 1.4 && c < 4 ? WRITE(time) : STAND;
      } else if (c < 9) {
        // Asks, hears his answer, turns to chalk the 2 in, and turns back pleased.
        rx = -1.4;
        const chalkIt = easeInOutCubic(segment(c, 7.4, 7.8)) * (1 - easeInOutCubic(segment(c, 8.4, 8.8)));
        ry = lerp(lerp(Math.PI, toHim, easeInOutCubic(segment(c, 5, 5.6))), Math.PI, chalkIt);
        pose = c > 7.8 && c < 8.4 ? WRITE(time) : blendPose(STAND, ASK, easeInOutCubic(segment(c, 5.2, 5.8)) * (1 - chalkIt));
      } else if (c < 12.4) {
        // Back to the board, write it, and turn round again.
        rx = lerp(-2.35, -1.25, writing2);
        const back = easeInOutCubic(segment(c, 9, 9.4));
        const round = easeInOutCubic(segment(c, 11.4, 12));
        rx = c < 9.4 ? lerp(-1.4, -2.35, back) : c > 11.4 ? lerp(-1.25, -0.45, round) : rx;
        ry = c < 11.4 ? lerp(toHim, Math.PI, back) : lerp(Math.PI, toHim, round);
        pose = c > 9.3 && c < 11.4 ? WRITE(time) : blendPose(STAND, ASK, round);
      } else {
        // Down the aisle to him.
        const k = easeInOutCubic(segment(c, 12.4, 14.6));
        const p = along(AISLE, k);
        rx = p.x;
        rz = p.z;
        const faceHim = Math.PI / 2;
        ry = k < 1 ? p.ry : faceHim;
        ry = lerp(ry, faceHim, segment(c, 14.2, 14.7));
        const walking = k > 0 && k < 1;
        pose = walking ? walk(time * 7) : STAND;
        // Leans in to tell him, straightens when he jolts, leans in again with a cure for his head.
        const lean = Math.max(
          easeInOutCubic(segment(c, 14.6, 15.2)) * (1 - easeInOutCubic(segment(c, 16.2, 16.8))),
          easeInOutCubic(segment(c, 20.0, 20.7)) * (1 - segment(c, 21.1, 21.7)),
        );
        if (c > 14.6) pose = blendPose(STAND, LEAN, lean);
        if (c > 21.1) pose = blendPose(LEAN, REACH, easeInOutCubic(segment(c, 21.1, 21.8)));
      }
      reze.root.position.set(o.x + rx, 0, o.z + rz);
      reze.root.rotation.y = ry;
      reze.apply(pose);
      rest(reze, { groundY: 0 });
      // She holds her hand out, palm down, to where his will come up to meet
      // it: one point between them, the two palms on it, skin to skin.
      const clasp = handHold.set(o.x + HOLD_AT.x, HOLD_AT.y, o.z + HOLD_AT.z);
      const herReach = easeInOutCubic(segment(c, 21.4, 22.1));
      if (herReach > 0) {
        const held = reacherOf(reze).reach(pose, "r", palmOn.set(clasp.x - HOLD_SLIDE, clasp.y + HOLD_GAP, clasp.z), DOWN, HINT_R);
        reze.apply(herReach < 1 ? blendPose(pose, held, herReach) : held);
        reze.root.updateMatrixWorld(true);
      }
      reze.setHands("relaxed");
      if (c > 21.5) reze.setHand("right", "open", 0.4);
      const meet = segment(c, 22.42, 22.75);
      if (meet > 0) reze.setHand("right", "grip", 0.85 * meet, { radius: HOLD_R });

      // Him: at the desk, then up and turned to her.
      const up = easeInOutCubic(segment(c, 21.6, 22.4));
      denji.root.position.set(o.x + lerp(SEAT_D.x, STOOD_D.x, up), 0, o.z + lerp(SEAT_D.z, STOOD_D.z, up));
      denji.root.rotation.y = lerp(Math.PI, Math.PI * 1.5, up);
      const hand = easeInOutCubic(segment(c, 6.5, 6.8)) * (1 - easeInOutCubic(segment(c, 7.1, 7.45)));
      const dunno = easeInOutCubic(segment(c, 12.65, 13.0)) * (1 - easeInOutCubic(segment(c, 13.9, 14.4)));
      const shock = easeOutCubic(segment(c, 16.05, 16.3)) * (1 - easeInOutCubic(segment(c, 17.8, 18.4)));
      const heat = easeInOutCubic(segment(c, 18.1, 18.5)) * (1 - easeInOutCubic(segment(c, 20.2, 20.7)));
      let seated = SIT(time);
      if (hand > 0) seated = blendPose(seated, HAND_UP(time), hand);
      if (dunno > 0) seated = blendPose(seated, DUNNO(time), dunno);
      if (shock > 0) seated = blendPose(seated, SHOCK(time), shock);
      if (heat > 0) seated = blendPose(seated, HEAT(time), heat);
      const standing = up > 0 ? blendPose(seated, REACH_L, up) : seated;
      denji.apply(standing);
      rest(denji, { seatY: CHAIR_TOP, groundY: 0, k: up });
      // His hand comes up under hers as he stands, palm up, and they hold.
      // Into place a hand's length under and short of hers, then straight up into it.
      const hisReach = easeInOutCubic(segment(c, 21.8, 22.1));
      if (hisReach > 0) {
        const rise = 1 - easeInOutCubic(segment(c, 22.1, 22.45));
        const held = reacherOf(denji).reach(standing, "l", palmOn.set(clasp.x + HOLD_SLIDE + 0.06 * rise, clasp.y - HOLD_GAP - 0.14 * rise, clasp.z), UP, HINT_L);
        denji.apply(hisReach < 1 ? blendPose(standing, held, hisReach) : held);
        denji.root.updateMatrixWorld(true);
      }
      denji.setHands("relaxed");
      if (hand > 0) denji.setHand("left", "open", 0.8 * hand);
      if (dunno > 0) denji.setHands("open", 0.7 * dunno);
      if (shock > 0) denji.setHands("open", 0.9 * shock);
      if (heat > 0) denji.setHands("open", 0.6 * heat);
      if (up > 0) denji.setHand("left", "open", 0.4 * up);
      if (meet > 0) denji.setHand("left", "grip", 0.85 * meet, { radius: HOLD_R });
      if (shot.id === "room") {
        const k = easeInOutCubic(u);
        cam(at("school", 1.6, 1.9, 2.6).lerp(at("school", 1.2, 1.75, 1.9), k), at("school", -1.2, 1.5, -2.4));
        text = "Neither of them ever went to school.";
        cut.black = 1 - segment(c, 0, 1.2);
      } else if (shot.id === "ask" || shot.id === "chalk") {
        // Over his shoulder to her and the board.
        cam(at("school", 0.55, 1.35, 0.05), at("school", -1.3, 1.55, -2.6));
        text = shot.id === "ask" && c > 5.6 ? "“Does anyone know the answer?”" : "";
      } else if (shot.id === "answer") {
        // From the board: his hand shoots up.
        cam(at("school", -0.4, 1.4, -2.2), at("school", 0.2, 1.2, -0.8));
        textR = c > 6.7 ? "“Two!”" : "";
      } else if (shot.id === "ass") {
        cam(at("school", 1.0, 1.55, 0.6).lerp(at("school", 0.8, 1.55, 0.2), easeInOutCubic(u)), at("school", -1.3, 1.65, -3.0));
        text = c > 11.9 ? "“Do you know what this means?”" : "";
      } else if (shot.id === "dunno") {
        // On him, from the board side: he can't read it.
        cam(at("school", -0.25, 1.25, -1.9), at("school", 0.2, 1.0, -0.8));
        textR = c > 12.8 ? "“I don't know.”" : "";
      } else if (shot.id === "tell") {
        // From the front of the room: his face, and her coming in at his side to tell him.
        const k = easeInOutCubic(u);
        cam(at("school", 0.15, 1.45, -2.55).lerp(at("school", 0.0, 1.38, -2.25), k), at("school", -0.2, 1.1, -0.85));
        text = c > 14.9 ? "“It means big ass.”" : "";
      } else if (shot.id === "shock") {
        // On him, from the board side: the jolt back.
        cam(at("school", -0.25, 1.25, -1.9), at("school", 0.2, 1.0, -0.8));
        textR = c > 17 ? "“Sex-crazed girl!”" : c > 16.2 ? "“You pervert!”" : "";
      } else if (shot.id === "heat") {
        // Same angle, edging in: he holds his head together while it steams.
        const k = easeInOutCubic(u);
        cam(at("school", -0.25, 1.36, -2.05).lerp(at("school", -0.2, 1.36, -1.9), k), at("school", 0.2, 1.2, -0.8));
        textR = c > 18.4 ? "“My head's heating up from thinking this hard.”" : "";
        denji.bones.head.getWorldPosition(tmp);
        steam.forEach((s, i) => {
          // Each puff rises off the crown and thins out, one after another.
          const p = (c * 1.3 + i / 3) % 1;
          s.visible = heat > 0.5;
          s.position.set(tmp.x + Math.sin((c + i) * 2.1) * 0.06, tmp.y + 0.14 + p * 0.3, tmp.z);
          s.scale.setScalar(0.1 + p * 0.12);
          s.material.opacity = Math.min(1, (1 - p) * 2) * heat;
        });
      } else {
        // Swings round as he stands, to side on: the gap between them, and
        // their two hands meeting in it.
        const k = easeInOutCubic(segment(c, 21.3, 22.5));
        cam(at("school", 1.5, 1.45, 1.1).lerp(at("school", 0.2, 1.4, 1.25), k), at("school", -0.3, 1.0, -0.85).lerp(at("school", -0.28, 1.08, -0.75), k));
        text = c > 20.6 ? "“I know a way we can cool off.”" : "";
      }
    } else {
      // ── The pool ──
      lot.show("pool");
      w.light(0.3, 0.8, -0.5); // the moon, behind and above
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      water.uA.value.set(0, 0, 0);
      water.uB.value.set(0, 0, 0);
      chalk.visible = false;

      // The web, and the widow on it.
      // Slow and careful: a little under three seconds, finished with half a second to spare.
      const spin = segment(c, 23.1, 26.0);
      const shown = Math.floor(spin * nSeg);
      web.lines.geometry.setDrawRange(0, Math.max(0, shown) * 2);
      web.beads.geometry.setDrawRange(0, Math.max(0, Math.floor((shown - web.beadFrom) / 2)));
      let speed = 0;
      if (spin > 0 && spin < 1) {
        const f = spin * nSeg - shown;
        const [a, b] = web.segs[Math.min(nSeg - 1, shown)];
        const nx = lerp(a[0], b[0], f);
        const ny = lerp(a[1], b[1], f);
        if (dt > 0) {
          const target = Math.atan2(-(nx - spiderAt.x), ny - spiderAt.y);
          if (Math.hypot(nx - spiderAt.x, ny - spiderAt.y) > 1e-4) spiderAt.ang += (shortWay(spiderAt.ang, target) - spiderAt.ang) * Math.min(1, dt * 12);
        }
        spiderAt.x = nx;
        spiderAt.y = ny;
        speed = 1;
      } else {
        // Done: back at the hub, head down, waiting.
        spiderAt.x = -0.5;
        spiderAt.y = 1.5;
        spiderAt.ang = Math.PI;
      }
      spider.group.position.set(spiderAt.x, spiderAt.y, 0.012);
      spider.group.rotation.set(0, 0, spiderAt.ang);
      spider.gait(time, speed);

      // ── Them ──
      const o = lot.sets.pool.origin;
      const place = (fig, x, z, ry = 0) => {
        fig.root.position.set(o.x + x, 0, o.z + z);
        fig.root.rotation.y = ry;
      };
      if (c < 33.6) {
        // On the deck, turned to each other and a little to us.
        place(reze, DECK_R.x, DECK_R.z, 0.9);
        place(denji, DECK_D.x, DECK_D.z, -0.9);
        const fling = easeOutCubic(segment(c, STRIP.reze - 0.2, STRIP.reze + 0.3)) * (1 - segment(c, STRIP.reze + 0.4, STRIP.reze + 1.1));
        reze.apply(c < STRIP.reze + 1.1 ? blendPose(STAND, ARMS_UP, fling) : blendPose(STAND, HIPS, easeInOutCubic(segment(c, STRIP.reze + 1.1, STRIP.reze + 1.7))));
        const dFling = easeOutCubic(segment(c, STRIP.denji - 0.2, STRIP.denji + 0.3)) * (1 - segment(c, STRIP.denji + 0.4, STRIP.denji + 1.1));
        denji.apply(blendPose({ ...STAND, head: [0.3, 0, 0] }, ARMS_UP, dFling));
        rest(reze, { groundY: 0 });
        rest(denji, { groundY: 0 });
        reze.setHands("relaxed");
        denji.setHands("relaxed");
      } else if (c < 37.5) {
        // She goes in first; he walks to the edge and stalls there, shaking.
        const j = segment(c, 33.6, 34.4);
        reze.root.rotation.y = shortWay(0.9, Math.atan2(IN_R.x - DECK_R.x, IN_R.z - DECK_R.z));
        if (j < 1) {
          reze.apply(blendPose(HIPS, LEAP, easeOutCubic(Math.min(1, j * 2.5))));
          hop(reze, DECK_R, IN_R, j, 0, -1.0);
        } else {
          place(reze, IN_R.x, IN_R.z, 0);
          reze.root.position.y = lerp(-1.0, -1.33, segment(c, 34.4, 34.8));
          reze.apply(SWIM(time * 3));
        }
        reze.setHands("open", 0.6);
        const step = easeInOutCubic(segment(c, 33.7, 34.6));
        const jj = segment(c, 36.5, 37.3);
        if (jj <= 0) {
          place(denji, lerp(DECK_D.x, EDGE_D.x, step), lerp(DECK_D.z, EDGE_D.z, step), lerp(-0.9, -Math.PI, step));
          const scared = easeInOutCubic(segment(c, 34.4, 35));
          denji.apply(step > 0 && step < 1 ? walk(time * 7) : blendPose(STAND, SCARED, scared));
          rest(denji, { groundY: deckAt(denji.root.position.z - o.z) });
          // Shivering.
          denji.root.position.x += Math.sin(time * 47) * 0.006 * scared;
        } else {
          denji.root.rotation.y = -Math.PI;
          denji.apply(blendPose(SCARED, LEAP, easeOutCubic(Math.min(1, jj * 2.5))));
          hop(denji, EDGE_D, IN_D, jj, COPING.top, -1.1);
        }
        denji.setHands("fist", 0.5);
        if (crossed(34.4)) fx.splash(at("pool", IN_R.x, 0.1, IN_R.z), 120);
        if (crossed(37.3)) fx.splash(at("pool", IN_D.x, 0.1, IN_D.z), 140);
        water.uA.value.set(o.x + IN_R.x, o.z + IN_R.z, 1);
      } else if (c < 42) {
        // The lesson: she walks backward down the lane, holding his hands.
        const k = segment(c, 37.5, 42);
        const hx = lerp(-1.9, -3.2, k);
        place(reze, hx, 1.9, Math.PI / 2);
        reze.root.position.y = -1.28;
        reze.apply(HOLD);
        reze.setHands("grip", 0.5, { radius: 0.03 });
        denji.root.position.copy(at("pool", hx + 2.55, -0.06, 1.9));
        denji.root.rotation.set(Math.PI / 2, -Math.PI / 2, 0, "YXZ");
        denji.apply(KICK(time * 11));
        denji.setHands("grip", 0.5, { radius: 0.03 });
        if (dt > 0 && Math.random() < dt * 10) fx.splash(at("pool", hx + 2.55 + 0.1, 0.08, 1.9), 8);
        water.uA.value.set(o.x + hx, o.z + 1.9, 1);
        water.uB.value.set(o.x + hx + 2.0, o.z + 1.9, 1);
      } else if (c < 46.5) {
        // A splash fight.
        place(reze, -1.6, 1.9, Math.PI / 2);
        place(denji, -0.45, 1.9, -Math.PI / 2);
        reze.root.position.y = -1.33;
        denji.root.position.y = -1.42;
        const throws = [
          [42.5, reze],
          [43.6, denji],
          [44.5, reze],
          [45.4, denji],
          [45.6, reze],
        ];
        [reze, denji].forEach((f, i) => {
          let s = 0;
          throws.forEach(([t, who]) => who === f && (s = Math.max(s, segment(c, t - 0.25, t) * (1 - segment(c, t + 0.1, t + 0.5)))));
          const tread = SWIM(time * 3 + i * 1.5);
          f.apply(s > 0 ? { ...tread, ...sweep(easeOutCubic(s)) } : tread);
          f.setHands("open", 0.6);
        });
        throws.forEach(([t, who]) => {
          if (crossed(t)) {
            const from = who.root.position;
            const toward = who === reze ? 0.45 : -0.45;
            fx.splash(new THREE.Vector3(from.x + toward, 0.12, from.z), 90);
            fx.splash(new THREE.Vector3(from.x + toward * 1.6, 0.4, from.z), 50);
          }
        });
        water.uA.value.set(o.x - 1.6, o.z + 1.9, 1);
        water.uB.value.set(o.x - 0.45, o.z + 1.9, 1);
      } else if (c < 51) {
        // Floating, face up, side by side down the near lane.
        const drift = (c - 46.5) * 0.04;
        reze.root.position.copy(at("pool", -1.05 + drift, 0.0, 2.67));
        denji.root.position.copy(at("pool", -0.31 + drift, 0.0, 2.75));
        reze.root.rotation.set(-Math.PI / 2, 0, 0.05);
        denji.root.rotation.set(-Math.PI / 2, 0, -0.05);
        reze.apply(FLOAT(time, "l"));
        denji.apply(FLOAT(time + 2, "r"));
        reze.setHands("relaxed");
        denji.setHands("relaxed");
        water.uA.value.set(reze.root.position.x, reze.root.position.z - 0.9, 0.5);
        water.uB.value.set(denji.root.position.x, denji.root.position.z - 0.9, 0.5);
      } else {
        // He floats on, eyes on the sky. She has stood up in the shallows to
        // look down at herself; once it has passed she lifts her head to him.
        const drift = (c - 46.5) * 0.04;
        denji.root.position.copy(at("pool", -0.31 + drift, 0.0, 2.75));
        denji.root.rotation.set(-Math.PI / 2, 0, -0.05);
        denji.apply(FLOAT(time + 2, "r"));
        denji.setHands("relaxed");
        place(reze, MIRROR_R.x, MIRROR_R.z, Math.PI);
        reze.root.position.y = -1.3;
        const lift = easeInOutCubic(segment(c, 55.1, 56.1));
        reze.apply({ ...SWIM(time * 1.2), spine: [lerp(0.2, 0.05, lift), 0, 0], head: [lerp(0.5, 0.0, lift), lerp(0, 0.7, lift), 0] });
        reze.setHands("open", 0.4);
        water.uB.value.set(denji.root.position.x, denji.root.position.z - 0.9, 0.5);
      }
      [reze, denji].forEach((f) => f.root.updateMatrixWorld(true));

      // Clothes: off in a flurry, then on the deck where they fell.
      Object.entries(CLOTHES).forEach(([who, items]) => {
        const t0 = STRIP[who];
        const fig = who === "reze" ? bare.reze : bare.denji;
        const base = who === "reze" ? DECK_R : DECK_D;
        items.forEach(({ m, v, spin: sp }, i) => {
          m.visible = c >= t0;
          if (!m.visible) return;
          const T = Math.max(0, c - t0);
          const y0 = 1.15 - i * 0.25;
          const tLand = (v[1] + Math.sqrt(v[1] * v[1] + 2 * 9.8 * (y0 - 0.02))) / 9.8;
          const tt = Math.min(T, tLand);
          m.position.set(base.x + v[0] * 0.45 * tt, Math.max(0.0125 + i * 0.004, y0 + v[1] * tt - 4.9 * tt * tt), base.z + v[2] * 0.45 * tt);
          m.rotation.set(T < tLand ? tt * sp : 0, tt * sp * 0.6, T < tLand ? tt * sp * 0.4 : 0);
        });
        if (crossed(t0)) {
          fig.bones.chest.getWorldPosition(tmp);
          fx.splash(tmp.clone(), 70);
        }
      });

      // The censors, on whichever bare body is on screen.
      if (nude.reze) {
        pin(censor.rezeChest, reze, 0.62, 0.17);
        pin(censor.rezeHips, reze, -0.16, 0.13);
      }
      // Face down in the lesson, he is decent on his own.
      if (nude.denji && shot.id !== "lesson") pin(censor.denji, denji, -0.17, 0.15);

      // Shots.
      if (shot.id === "web") {
        const k = easeInOutCubic(u);
        cam(at("pool", -0.25, 1.55, -4.0).lerp(at("pool", -0.38, 1.52, -4.35), k), at("pool", -0.5, 1.48, WEB_Z));
      } else if (shot.id === "deck") {
        cam(at("pool", 1.4, 1.5, 6.4), at("pool", -0.95, 0.85, 3.3));
        text = c > 26.8 ? "He couldn't swim. She'd teach him." : "";
      } else if (shot.id === "strip") {
        cam(at("pool", -0.95, 1.05, 7.0), at("pool", -0.95, 0.95, 3.45));
        textR = c > STRIP.reze + 0.3 ? "“Get naked. Your clothes will make you sink.”" : "";
      } else if (shot.id === "edge") {
        // From the water, up at him on the edge.
        cam(at("pool", 0.35, 0.3, 0.2), at("pool", -0.75, 0.85, 2.7));
        text = c > 34.6 ? "Scared of the water. More scared of missing his chance." : "";
      } else if (shot.id === "lesson") {
        // Alongside, keeping her and his reaching hands in the middle.
        const mx = lerp(-1.9, -3.2, segment(c, 37.5, 42)) + 0.6;
        cam(at("pool", mx + 0.25, 0.55, 3.7), at("pool", mx, 0.1, 1.9));
        text = "Swimming lessons, at midnight.";
      } else if (shot.id === "play") {
        cam(at("pool", -1.0, 0.45, 4.0), at("pool", -1.0, 0.2, 1.9));
        textR = c > 43 ? "Everything they missed, in one night." : "";
      } else if (shot.id === "float") {
        const k = easeInOutCubic(u);
        const over = at("pool", -0.7, 0, 1.88);
        cam(at("pool", -0.7, 4.0 - k * 0.6, 1.9), over);
        camera.up.set(0, 0, -1);
        camera.lookAt(over);
        camera.up.set(0, 1, 0);
        textR = "A childhood neither of them had.";
      } else {
        // Over her shoulder, down at the water she is looking into: her face
        // looking back up. A ripple runs through, and for a breath it is not
        // her face.
        const k = easeInOutCubic(segment(c, 51, 57));
        cam(
          at("pool", MIRROR_R.x + 0.42, 1.3, MIRROR_R.z + 0.75).lerp(at("pool", MIRROR_R.x + 0.34, 1.16, MIRROR_R.z + 0.58), k),
          at("pool", MIRROR_R.x - 0.02, 0.0, MIRROR_R.z - 0.62),
        );
        const R = reflection.uniforms;
        const bump = (t0) => segment(c, t0 - 0.25, t0 + 0.05) * (1 - segment(c, t0 + 0.05, t0 + 0.9));
        R.uTime.value = time;
        R.uFade.value = segment(c, 51.2, 52) * (1 - segment(c, 56.4, 57.2));
        R.uMix.value = easeInOutCubic(segment(c, OTHER.from, OTHER.from + 0.2)) * (1 - easeInOutCubic(segment(c, OTHER.to, OTHER.to + 0.3)));
        R.uRipple.value = 1 + 3.5 * Math.max(bump(OTHER.from), bump(OTHER.to));
        // Laid on the water just ahead of her face, its top away from us and
        // stretched along the line of sight so it reads upright-sized.
        const wy = lot.sets.pool.origin.y + 0.02;
        reze.bones.head.getWorldPosition(tmp);
        const P = mirrorAt.set(tmp.x - 0.04, wy + 0.004, tmp.z - 0.66);
        const C = camera.position;
        reflection.group.position.copy(P);
        reflection.group.rotation.y = Math.atan2(-(P.x - C.x), -(P.z - C.z));
        reflection.mesh.scale.set(0.6, (0.48 * P.distanceTo(C)) / (C.y - wy), 1);
        reflection.group.visible = true;
        // The water rings out from her face as it changes.
        water.uA.value.set(P.x, P.z, Math.max(bump(OTHER.from), bump(OTHER.to)) * 1.5 + 0.3);
        cut.bars = 0.35 + 0.15 * segment(c, OTHER.from - 0.6, OTHER.from) * (1 - segment(c, OTHER.to + 0.4, OTHER.to + 1.2));
        cut.black = segment(c, 57, 58.6);
      }
      // The moon streak behind whatever we are looking at; under her face at the end, so it shows dark on light.
      water.uMoonX.value = lot.sets.pool.origin.x + (shot.id === "float" ? -0.7 : shot.id === "mirror" ? MIRROR_R.x + 0.1 : 0.6);
    }

    prevC = c;
    fx.step(dt);
    cuts.update(cut);
    cap.update({ text, size: 2.3 });
    capR.update({ text: textR, size: 2.3 });
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fx.resize(height, camera.fov, stage.renderer.getPixelRatio());
  });

  return {
    ready: Promise.all([cast.ready, bareReady]),
    update,
    dispose() {
      unsubscribeResize();
      [cap, capR, cuts].forEach((x) => x.dispose());
      // Uniform textures are out of reach of the graph walk.
      reflection.textures.forEach((t) => t.dispose());
    },
  };
};
