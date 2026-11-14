import * as THREE from "three";
import { easeInOutCubic, easeOutBack, hash, lerp, segment } from "../kit";
import { INK, outline } from "../ink";
import { createSfx } from "../sfx";
import { blendPose } from "../figure";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, shotAt } from "../rezeKit";

/**
 * slow summer eve — the good night, before it turns. A summer festival, the
 * hill above town she knows, the fireworks, the question, and the snap.
 *
 *   0    – 6.5   the festival lane at dusk: the two of them walk under the
 *                lanterns, and she laughs at him
 *   6.5  – 13.5  at a stall: she holds out a dango skewer and he bites the
 *                top one off; she laughs again
 *   13.5 – 22.5  the hill path at dusk: she leads, glancing back; he follows
 *   22.5 – 28    from behind them at the top: her secret spot, the whole town
 *                lit up below, and the first fireworks go up over it
 *   28   – 34    in front of them, faces lit by the bursts
 *   34   – 40.5  she turns to him.  HER: "Run away with me?"
 *   40.5 – 48    over her shoulder.  HIM: "I can't. Things are finally going
 *                good for me."
 *   48   – 56.5  in profile against the fireworks: she steps in, they kiss
 *                holding each other, and the picture fades to black
 *   56.5 – 66    black. A finger snap: SNAP. Then BOOM — her first turn.
 *
 * Two lines and nothing else: the user's plain-English renderings of the
 * film's exchange. The Bomb Devil is never shown; the snap and the BOOM on
 * black are the beat.
 */

const CYCLE = 66;
const STATIC_TIME = 51.6;

const SHOTS = [
  { t: 0, id: "lane" },
  { t: 6.5, id: "stall" },
  { t: 13.5, id: "climb" },
  { t: 22.5, id: "top" },
  { t: 28, id: "watch" },
  { t: 34, id: "ask" },
  { t: 40.5, id: "refuse" },
  { t: 48, id: "kiss" },
  { t: 56.5, id: "black" },
];

const LINES = [
  [35.0, 40.2, "her", "Run away with me?"],
  [41.2, 47.6, "him", "I can't. Things are finally going good for me."],
];

const SNAP_AT = 58.4;
const BOOM_AT = 60.6;

/* ── Light ── */

const DUSK = { ground: "#2b1835", lines: "#ffb98f", accent: "#ff7a3d", rim: "#ffb48a", shade: "#8e6a9c" };
const VOID = { ground: "#000000", lines: "#000000", accent: "#000000", rim: "#000000", shade: "#000000" };
// Dusk on the lane: a deeper sky behind them, a warm lantern key and a softer
// rim than the festival's, so the white shirts don't flare and soften.
const LANE = { ...LIGHT.festival, lines: "#e7a2bf", rim: "#b8708a", shade: "#7a4f86" };
const NIGHT = { ground: "#020309", lines: "#3d4a86", accent: "#ff6fb0", rim: "#c9b8ff", shade: "#3a4270" };

/* ── Poses (figure.js convention: faces +z, left is +x) ── */

// The knee folds while its leg swings through (hip angle falling), straight
// again by heel-strike; the arms swing against the legs. `stride` is the hip
// swing, so a step is about 2·leg·sin(stride).
const walk = (p, look = 0, lean = 0.04, stride = 0.42) => {
  // A softened triangle, not a sine: the hip sweeps at an even rate through
  // the stance, so the planted foot moves with the ground, not against it.
  const s = (Math.sin(p) - Math.sin(3 * p) / 9) * 0.9;
  const c = Math.cos(p);
  const swingL = Math.max(0, -c) ** 1.5;
  const swingR = Math.max(0, c) ** 1.5;
  return {
    spine: [lean, 0, 0],
    head: [0.02, look, 0],
    lShoulder: [-0.3 * s, 0, 0.08],
    lElbow: [-0.3 - 0.18 * Math.max(0, s), 0, 0],
    rShoulder: [0.3 * s, 0, -0.08],
    rElbow: [-0.3 - 0.18 * Math.max(0, -s), 0, 0],
    lHip: [stride * s - 0.05, 0, 0.03],
    lKnee: [swingL * 0.62 + 0.06, 0, 0],
    rHip: [-stride * s - 0.05, 0, -0.03],
    rKnee: [swingR * 0.62 + 0.06, 0, 0],
  };
};
/** Walk phase for `dist` metres walked: one cycle is two steps, so the planted foot keeps pace with the ground. */
const STRIDE = { denji: 0.32, reze: 0.3 };
const LEG = { denji: 0.86, reze: 0.8 };
const phaseAt = (who, dist) => (dist / (4 * LEG[who] * Math.sin(STRIDE[who]))) * Math.PI * 2;
// Uphill: a longer step, the knee lifting higher, the body leaning in.
const climb = (p, look = 0) => {
  const s = Math.sin(p);
  return {
    ...walk(p, look, 0.22),
    lHip: [0.55 * s - 0.25, 0, 0.03],
    lKnee: [Math.max(0, -s) * 0.9 + 0.2, 0, 0],
    rHip: [-0.55 * s - 0.25, 0, -0.03],
    rKnee: [Math.max(0, s) * 0.9 + 0.2, 0, 0],
  };
};
const STAND = { spine: [0.02, 0, 0], lShoulder: [0, 0, 0.08], rShoulder: [0, 0, -0.08], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0], lHip: [0, 0, 0.04], rHip: [0, 0, -0.04] };
const LOOK_UP = { ...STAND, neck: [-0.18, 0, 0], head: [-0.22, 0, 0] };
// She laughs: head back, a hand up to her mouth.
const LAUGH = { ...STAND, spine: [-0.06, 0, 0], neck: [-0.12, 0, 0], head: [-0.2, 0.15, 0.08], lShoulder: [-0.75, 0, 0.12], lElbow: [-2.1, 0, 0] };
// The same laugh from the waist up, laid over a walk.
const LAUGH_UP = { spine: LAUGH.spine, neck: LAUGH.neck, head: LAUGH.head, lShoulder: LAUGH.lShoulder, lElbow: LAUGH.lElbow };
// The skewer held out to him in her left hand.
const OFFER = { ...STAND, spine: [0.04, 0, 0], head: [0.0, 0.1, 0], lShoulder: [-1.5, -0.15, 0.05], lElbow: [-0.35, 0, 0] };
const BITE = { ...STAND, spine: [0.22, 0, 0], neck: [0.0, 0, 0], head: [-0.12, 0, 0], lShoulder: [-0.15, 0, 0.12], rShoulder: [-0.15, 0, -0.12], lElbow: [-0.4, 0, 0], rElbow: [-0.4, 0, 0] };
const CHEW = { ...STAND, spine: [0.08, 0, 0], head: [0.05, -0.1, 0] };
// The kiss: he bends his head to her, she lifts hers. The arms are solved
// onto each other's bodies in the shot (see the kiss below).
const KISS_HIM = { ...STAND, spine: [0.1, 0, 0], neck: [0.16, 0, 0], head: [0.22, 0, -0.18] };
const KISS_HER = { ...STAND, spine: [-0.03, 0, 0], neck: [-0.12, 0, 0], head: [-0.24, 0, 0.16] };
// Elbows (root frame): hers out and down round his neck, his out and back round her waist.
const HUG_HINT = {
  her: { l: new THREE.Vector3(0.85, -0.5, 0.1).normalize(), r: new THREE.Vector3(-0.85, -0.5, 0.1).normalize() },
  him: { l: new THREE.Vector3(0.8, -0.45, -0.4).normalize(), r: new THREE.Vector3(-0.8, -0.45, -0.4).normalize() },
};

/* ── Arms round each other ── */

const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

/** Two-bone arm IK on the pose library's arms (as on the next mountain). Targets in world, hints in the root's frame. */
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

/* ── The hill above town ── */

const smooth = THREE.MathUtils.smoothstep;
/** Ground height of the hill (local): a flat top round the origin, a steep drop to the town at +z, the path up from −z. */
const hillY = (x, z) => {
  const front = -14 * smooth(z, 3, 13);
  const back = -6 * smooth(-z, 1.5, 16);
  const side = -2.5 * smooth(Math.abs(x), 6, 18);
  return front + back + side + Math.sin(x * 0.35 + z * 0.2) * 0.15 * smooth(Math.abs(z), 2, 6);
};
const TOWN_Y = -14;

const buildHill = (w) => {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(110, 140, 110, 140);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, 40);
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const grass = new THREE.Color("#4e7a3e");
  const dirt = new THREE.Color("#5b4a38");
  const plain = new THREE.Color("#2f3a2c");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = Math.max(TOWN_Y, hillY(x, z));
    p.setY(i, y);
    // The path: a worn strip up the back of the hill.
    const onPath = z < 0 && Math.abs(x - Math.sin(z * 0.25) * 0.6) < 0.7;
    c.copy(y < TOWN_Y + 0.5 ? plain : onPath ? dirt : grass).offsetHSL(0, 0, (hash(i * 0.37) - 0.5) * 0.04);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.75, rim: 0.4 })));

  // Her spot: one old tree at the top, and a low wooden rail at the edge.
  const bark = w.ink({ tint: "#4a3322", tone: 0.55, rim: 0.7 });
  const leaves = [w.ink({ tint: "#3d6a33", tone: 0.7, rim: 0.6 }), w.ink({ tint: "#335a2c", tone: 0.65, rim: 0.6 })];
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 3.4, 10), bark);
  trunk.position.y = 1.7;
  trunk.rotation.z = 0.08;
  tree.add(trunk);
  for (let i = 0; i < 7; i++) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 + hash(i + 3) * 0.6, 1), leaves[i % 2]);
    blob.position.set((hash(i * 3.1) - 0.5) * 2.6, 3.4 + hash(i * 1.7) * 1.2, (hash(i * 5.3) - 0.5) * 2.0);
    tree.add(blob);
  }
  tree.position.set(-3.4, hillY(-3.4, -1.2), -1.2);
  g.add(tree);
  const wood = w.ink({ tint: "#6b4a2e", tone: 0.7, rim: 0.7 });
  for (let i = 0; i < 9; i++) {
    const x = -3.2 + i * 0.8;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.8, 0.07), wood);
    post.position.set(x, hillY(x, 3.0) + 0.4, 3.0);
    g.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.06, 0.06), wood);
  rail.position.set(0, hillY(0, 3.0) + 0.74, 3.0);
  g.add(rail);
  outline(rail, w.line);

  // The town below: dark blocks on the plain, windows and streetlights lit.
  const blockMat = w.ink({ tint: "#2a2d3a", tone: 0.45, rim: 0.5 });
  const lights = [];
  for (let i = 0; i < 140; i++) {
    const x = (hash(i * 1.31) - 0.5) * 90;
    const z = 18 + hash(i * 2.17) * 70;
    const h = 0.8 + hash(i * 3.7) ** 2 * 4.5;
    const wd = 1.2 + hash(i * 4.1) * 2.4;
    const block = new THREE.Mesh(new THREE.BoxGeometry(wd, h, wd * (0.7 + hash(i) * 0.6)), blockMat);
    block.position.set(x, TOWN_Y + h / 2, z);
    g.add(block);
    const n = 1 + Math.floor(hash(i * 5.9) * 5);
    for (let k = 0; k < n; k++) lights.push([x + (hash(i * 7 + k) - 0.5) * wd, TOWN_Y + 0.4 + hash(i * 11 + k) * h * 0.9, z - wd * 0.45]);
  }
  for (let i = 0; i < 260; i++) lights.push([(hash(i * 13.3) - 0.5) * 100, TOWN_Y + 0.15, 16 + hash(i * 17.1) * 75]);
  const lamp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 6, 4), new THREE.MeshBasicMaterial({ color: "#ffd38a", toneMapped: false }), lights.length);
  const m = new THREE.Matrix4();
  lights.forEach(([x, y, z], i) => {
    const s = 0.6 + hash(i * 0.71) * 0.9;
    lamp.setMatrixAt(i, m.makeScale(s, s, s).setPosition(x, y, z));
    lamp.setColorAt(i, new THREE.Color(hash(i * 0.53) < 0.75 ? "#ffd38a" : "#ff9f6b"));
  });
  g.add(lamp);
  return { group: g, lamp };
};

/** A hanami dango: three balls on a skewer. Origin at the pinch, +Y up the stick. */
const buildDango = (w) => {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.22, 6), w.ink({ tint: "#d8b98a", tone: 0.9, rim: 0.4 }));
  stick.position.y = 0.06;
  g.add(stick);
  const balls = ["#f4a7b9", "#fbf6ea", "#9cc77a"].map((tint, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.021, 14, 10), w.ink({ tint, tone: 1.0, rim: 0.5 }));
    b.position.y = 0.075 + i * 0.04;
    outline(b, w.line);
    g.add(b);
    return b;
  });
  return { group: g, top: balls[2] };
};

/**
 * A manga speech bubble on the DOM overlay (the same lettering as JANE DOE):
 * a paper ellipse, ink edge, a tail to the speaker's mouth.
 */
const createBubble = (overlay) => {
  if (!overlay) return { update() {}, dispose() {} };
  const NS = "http://www.w3.org/2000/svg";
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, {
    position: "absolute", left: "0", top: "0", maxWidth: "40%", padding: "0.95em 1.35em",
    background: "#fffdf7", color: INK, border: `0.14em solid ${INK}`, borderRadius: "50%",
    fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif', fontWeight: "700", lineHeight: "1.2",
    textAlign: "center", letterSpacing: "0.01em", pointerEvents: "none", transformOrigin: "50% 50%", opacity: "0",
  });
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", overflow: "visible", pointerEvents: "none", opacity: "0" });
  const fill = document.createElementNS(NS, "path");
  fill.setAttribute("fill", "#fffdf7");
  const edge = document.createElementNS(NS, "path");
  edge.setAttribute("fill", "none");
  edge.setAttribute("stroke", INK);
  edge.setAttribute("stroke-linejoin", "round");
  svg.append(fill, edge);
  overlay.append(box, svg);
  let last = null;
  return {
    update({ text = "", at = [50, 20], anchor = null, size = 3, show = 0 }) {
      const W = overlay.clientWidth || 1;
      const H = overlay.clientHeight || 1;
      const on = text && show > 0.001;
      box.style.opacity = on ? String(Math.min(1, show * 1.6)) : "0";
      svg.style.opacity = box.style.opacity;
      if (!on) return;
      if (text !== last) {
        last = text;
        box.textContent = text;
      }
      const px = (size * H) / 100;
      box.style.fontSize = `${px}px`;
      const cx = (at[0] / 100) * W;
      const cy = (at[1] / 100) * H;
      const pop = lerp(0.82, 1, easeOutBack(Math.min(1, show)));
      box.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${pop})`;
      if (!anchor) {
        fill.setAttribute("d", "");
        edge.setAttribute("d", "");
        return;
      }
      const rx = ((box.offsetWidth || px * 8) / 2) * pop;
      const ry = ((box.offsetHeight || px * 3) / 2) * pop;
      let dx = (anchor[0] / 100) * W - cx;
      let dy = (anchor[1] / 100) * H - cy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const k = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
      const bx = cx + dx * k * 0.86;
      const by = cy + dy * k * 0.86;
      const reach = Math.max(px * 1.2, Math.min(len - k, px * 5.5) * 0.75);
      const tx = cx + dx * (k + reach);
      const ty = cy + dy * (k + reach);
      const half = px * 0.55;
      const b1 = [bx - dy * half, by + dx * half];
      const b2 = [bx + dy * half, by - dx * half];
      const bend = px * 0.35;
      const m1 = [(b1[0] + tx) / 2 + dx * bend, (b1[1] + ty) / 2 + dy * bend];
      fill.setAttribute("d", `M${b1[0]} ${b1[1]} Q${m1[0]} ${m1[1]} ${tx} ${ty} L${b2[0]} ${b2[1]} Z`);
      edge.setAttribute("d", `M${b1[0]} ${b1[1]} Q${m1[0]} ${m1[1]} ${tx} ${ty} L${b2[0]} ${b2[1]}`);
      edge.setAttribute("stroke-width", String(px * 0.14));
    },
    dispose() {
      box.remove();
      svg.remove();
    },
  };
};

/* ── The scene ── */

export const createSlowSummerEveScene = (stage, { overlay } = {}) => {
  const { camera, staticMode, scene } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["festival"]);
  const hill = buildHill(w);
  const HILL = new THREE.Vector3(200, 0, 0);
  hill.group.position.copy(HILL);
  scene.add(hill.group);
  const cast = createCast(w, { chainsaw: false });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const bubble = createBubble(overlay);
  const snap = createSfx(overlay, { text: "SNAP", crescendo: 0 });
  const boom = createSfx(overlay, { text: "BOOM!!", crescendo: 0.8 });
  const dango = buildDango(w);
  scene.add(dango.group);

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const fest = (x, y, z) => lot.at("festival", x, y, z);
  const top = (x, y, z) => new THREE.Vector3(x, y, z).add(HILL);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
  };
  const screen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (0.5 - tmp.y * 0.5) * 100];
  };
  const mouthOf = (fig) => fig.bones.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.05, 0));
  /** Stand a figure on the ground under (x, z) of its set. */
  const stand = (fig, pos, yaw, pose, floor = pos.y) => {
    fig.root.position.copy(pos);
    fig.root.rotation.set(0, yaw, 0);
    fig.apply(pose);
    fig.groundTo(floor);
  };
  const onHill = (fig, x, z, yaw, pose) => stand(fig, top(x, 0, z), yaw, pose, hillY(x, z));
  const show = (id) => {
    lot.show(id === "festival" ? "festival" : "none");
    hill.group.visible = id === "hill";
  };

  /** A firework over the town: bigger than the festival's, it's further off. */
  const burst = (warm) => {
    const at = top((Math.random() - 0.5) * 34, 6 + Math.random() * 7, 38 + Math.random() * 14);
    const colors = warm ? ["#ffb36b", "#ff7a3d", "#fff1c9"] : ["#ff6fb0", "#c79bff", "#fff1fb", "#8fd8ff"];
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const v = 7.5 * (0.75 + Math.random() * 0.25);
      fx.sky.emit({
        position: [at.x, at.y, at.z],
        velocity: [Math.sin(b) * Math.cos(a) * v, Math.cos(b) * v, Math.sin(b) * Math.sin(a) * v],
        life: 2.4 * (0.7 + Math.random() * 0.5),
        size: 0.42 + Math.random() * 0.25,
        gravity: 1.4,
        drag: 0.9,
        color: colors[i % colors.length],
        intensity: 2.4,
      });
    }
    return at;
  };
  let rocket = 0;
  let flare = 0;
  let flareColor = "#ffb070";
  const flashed = { ...NIGHT };
  const mix = (a, b, k) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  const flash = (k) => {
    if (k <= 0.001) return NIGHT;
    flashed.lines = mix(NIGHT.lines, flareColor, k * 0.55);
    flashed.rim = mix(NIGHT.rim, flareColor, k * 0.7);
    return flashed;
  };
  let wasSky = false;
  let stillLit = false;

  // The cast's rim light, per set: the film's 1.4 is right for silhouettes
  // against the fireworks, but under the lanterns it glazes dark cloth into a
  // soft pink smear. Scaled from each material's own value.
  const rims = new Map();
  let rimK = 1;
  const castRim = (k) => {
    if (k === rimK) return;
    rimK = k;
    if (!rims.size) [cast.denji, cast.reze].forEach((f) => f.root.traverse((o) => o.material?.uniforms?.uRim && rims.set(o.material, o.material.uniforms.uRim.value)));
    rims.forEach((base, m) => (m.uniforms.uRim.value = base * k));
  };

  let ik = null;
  const fwd = new THREE.Vector3();
  const side = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const hold = { nape: new THREE.Vector3(), waist: new THREE.Vector3(), her: { l: new THREE.Vector3(), r: new THREE.Vector3() }, him: { l: new THREE.Vector3(), r: new THREE.Vector3() } };
  /** Hands to `target` (world), both arms, blended in from the pose's own arms by `w`. */
  const reach = (fig, pose, targets, hint, w) => {
    const solved = { ...pose };
    for (const s of ["l", "r"]) fig.ik.solve(solved, s, targets[s], hint[s]);
    return blendPose(pose, solved, w);
  };

  let handsFor = "";
  const setHands = (id) => {
    if (id === handsFor) return;
    handsFor = id;
    const { reze, denji } = cast;
    reze.release("left");
    reze.setHands("relaxed");
    denji.setHands("relaxed");
    dango.group.visible = id === "stall";
    if (id === "stall") reze.hold(dango.group, { hand: "left", grip: "pinch" });
    if (ik) for (const f of [denji, reze]) for (const s of ["l", "r"]) palmTo(f, s, aim, 0);
    if (id === "kiss") {
      reze.setHands("open", 0.45);
      denji.setHands("open", 0.6);
    }
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze } = cast;
    if (!denji) return;
    ik ??= { denji: createArmIK(denji), reze: createArmIK(reze) };
    denji.ik ??= ik.denji;
    reze.ik ??= ik.reze;
    const { shot, u, s } = shotAt(SHOTS, c);
    const next = SHOTS.find((x) => x.t > c)?.t ?? CYCLE;
    const cut = { black: 0, bars: 0.35 };
    const dip = (a, b) => Math.max(1 - segment(c, a, a + 0.25), segment(c, b - 0.25, b));
    setHands(shot.id);
    denji.root.visible = reze.root.visible = true;
    let sky = false;

    if (shot.id === "lane" || shot.id === "stall") {
      show("festival");
      w.palette(LANE);
      castRim(0.3);
      // Keyed from the side, not from the lens: a lit side and a shaded side.
      w.light(0.8, 0.6, 0.35);
      w.page({ mode: "still" });
      const lanterns = lot.sets.festival.lanterns;
      lanterns.forEach((l, i) => (l.scale.y = 1.3 + Math.sin(time * 2 + i) * 0.05));
      if (shot.id === "lane") {
        // Down the lane toward us; she laughs at him halfway and they slow.
        // The steps come from the distance walked, so no foot skates.
        const laughAt = (t) => segment(t, 2.6, 3.2) * (1 - segment(t, 4.8, 5.6));
        let dist = 0;
        for (let t = 0; t < s; t += 0.05) dist += Math.min(0.05, s - t) * 0.8 * (1 - 0.45 * laughAt(t));
        const laugh = laughAt(s);
        const z = -4.2 + dist;
        stand(denji, fest(-0.3, 0, z), 0, walk(phaseAt("denji", dist), 0.3, 0.04, STRIDE.denji));
        // She laughs from the waist up and keeps walking.
        const herWalk = walk(phaseAt("reze", dist) + Math.PI, -0.25, 0.04, STRIDE.reze);
        stand(reze, fest(0.32, 0, z + 0.12), 0, blendPose(herWalk, { ...herWalk, ...LAUGH_UP }, laugh));
        reze.root.position.y += Math.abs(Math.sin(time * 14)) * 0.01 * laugh;
        // Three-quarter front and low, head to toe: the legs read in the stride.
        cam(fest(1.35, 1.0, z + 3.3), fest(0.05, 0.92, z));
        cut.black = Math.max(1 - segment(c, 0, 0.9), segment(c, 6.25, 6.5));
      } else {
        // At a stall: the skewer held out, he bites the top one off, she laughs.
        const offer = easeInOutCubic(segment(c, 7.2, 8.4)) * (1 - easeInOutCubic(segment(c, 10.6, 11.4)));
        const bite = easeInOutCubic(segment(c, 8.6, 9.3)) * (1 - easeInOutCubic(segment(c, 9.6, 10.3)));
        const laugh = easeInOutCubic(segment(c, 10.8, 11.5));
        dango.top.visible = c < 9.6;
        const her = blendPose(blendPose(STAND, OFFER, offer), LAUGH, laugh);
        stand(reze, fest(2.0, 0, -2.4), -1.25, her);
        reze.root.position.y += Math.abs(Math.sin(time * 14)) * 0.008 * laugh;
        const chew = c > 10.3 ? Math.abs(Math.sin(time * 9)) * 0.06 : 0;
        stand(denji, fest(1.33, 0, -2.25), 1.65, blendPose(blendPose(STAND, BITE, bite), { ...CHEW, head: [0.05 + chew, -0.1, 0] }, c > 10.3 ? 1 : 0));
        cam(fest(1.75, 1.45, 0.75).lerp(fest(1.72, 1.42, 0.3), easeInOutCubic(u)), fest(1.7, 1.3, -2.3));
        cut.black = dip(6.5, next);
      }
    } else if (shot.id !== "black") {
      show("hill");
      castRim(1);
      const night = c >= 22.5;
      // Each burst over the town washes their faces with its colour for a moment.
      flare = Math.max(0, flare - dt * 1.6);
      w.palette(night ? flash(flare) : DUSK);
      w.light(...(night ? [0.2, 0.5, 1] : [0.6, 0.4, 0.7]));
      w.page({ mode: "still" });
      sky = night;

      if (shot.id === "climb") {
        // Up the path: she leads and looks back for him.
        const k = segment(c, 13.5, 22.5);
        const zh = lerp(-14, -2.6, k);
        const zd = zh - 1.3;
        const back = Math.max(0, Math.sin((c - 13.5) * 0.9)) * 0.9;
        const xh = Math.sin(zh * 0.25) * 0.6;
        const xd = Math.sin(zd * 0.25) * 0.6;
        const steep = (z) => Math.min(1, Math.abs(hillY(0, z) - hillY(0, z + 0.5)) * 3);
        onHill(reze, xh + 0.15, zh, 0, blendPose(walk(time * 5.4 + Math.PI, 0), climb(time * 5.4 + Math.PI, back), steep(zh)));
        onHill(denji, xd - 0.15, zd, 0, blendPose(walk(time * 5.4, 0.1), climb(time * 5.4, 0.1), steep(zd)));
        const mid = (zh + zd) / 2;
        cam(top(4.6, hillY(0, mid) + 1.9, mid - 0.6), top(0, hillY(0, mid) + 1.1, mid + 0.4));
        cut.black = dip(13.5, next);
      } else if (shot.id === "top" || shot.id === "watch") {
        // Her spot: they come up to the rail and look out over the town.
        const k = easeInOutCubic(segment(c, 22.5, 25.5));
        const z = lerp(0.6, 2.35, k);
        const settle = easeInOutCubic(segment(c, 24.8, 25.6));
        const up = easeInOutCubic(segment(c, 25.2, 26.6));
        // Stepped off the distance, so they slow into the rail on planted feet.
        const himWalk = blendPose(walk(phaseAt("denji", z - 0.6), 0, 0.04, STRIDE.denji), STAND, settle);
        const herWalk = blendPose(walk(phaseAt("reze", z - 0.6) + Math.PI, 0, 0.04, STRIDE.reze), STAND, settle);
        onHill(denji, -0.32, z, 0, blendPose(himWalk, LOOK_UP, up));
        onHill(reze, 0.3, z + 0.05, 0, blendPose(herWalk, { ...LOOK_UP, head: [-0.18, -0.15, 0] }, up));
        if (shot.id === "top") {
          const p = easeInOutCubic(u);
          cam(top(0.2, 1.7 + p * 0.4, -3.4 - p * 0.8), top(0, -1.5, 22));
        } else {
          // From the town side: their faces turned up, lit by each burst.
          const p = easeInOutCubic(u);
          cam(top(-0.25 + p * 0.3, 1.3, 4.6 - p * 0.4), top(0, 1.5, 2.3));
        }
        cut.black = shot.id === "top" ? dip(22.5, next) : segment(c, next - 0.25, next);
        if (shot.id === "watch") cut.black = Math.max(1 - segment(c, 28, 28.25), cut.black);
      } else if (shot.id === "ask" || shot.id === "refuse") {
        // She turns to him and asks; he looks at the town, then back at her.
        const turn = easeInOutCubic(segment(c, 34.2, 35.2));
        onHill(reze, 0.3, 2.4, lerp(0, -1.2, turn), blendPose(STAND, { ...STAND, head: [0.05, -0.2, 0], spine: [0.04, 0, 0] }, turn));
        const away = shot.id === "refuse" ? Math.max(0, Math.sin(segment(c, 41.4, 44.6) * Math.PI)) : 0;
        const toHer = shot.id === "ask" ? easeInOutCubic(segment(c, 36.6, 37.8)) * 0.7 : 0.75 - away * 0.9;
        onHill(denji, -0.32, 2.35, toHer * 0.9, { ...STAND, head: [0.05, toHer * 0.5, 0] });
        if (shot.id === "ask") {
          const p = easeInOutCubic(u);
          cam(top(0.35 - p * 0.15, 1.5, 4.7 - p * 0.3), top(0, 1.38, 2.35));
        } else {
          // Over her shoulder onto him.
          const p = easeInOutCubic(u);
          cam(top(1.25, 1.62, 3.15 - p * 0.15), top(-0.4, 1.45, 2.2));
        }
        cut.black = dip(shot.id === "ask" ? 34 : 40.5, next);
      } else {
        // The kiss, in profile, the fireworks behind them.
        const step = easeInOutCubic(segment(c, 48.6, 50.4));
        const k = easeInOutCubic(segment(c, 49.4, 50.8));
        const himPose = blendPose(STAND, KISS_HIM, k);
        const herPose = blendPose(STAND, KISS_HER, k);
        onHill(denji, -0.34, 2.3, Math.PI / 2, himPose);
        // Bring her in until their faces just meet: measured off the head bones.
        const gap = lerp(0.62, 0.19, step);
        onHill(reze, 0.3, 2.3, -Math.PI / 2, herPose);
        reze.root.position.y += 0.03 * k;
        denji.root.updateMatrixWorld(true);
        reze.root.updateMatrixWorld(true);
        denji.bones.head.getWorldPosition(tmp);
        reze.bones.head.getWorldPosition(tmp2);
        reze.root.position.x += tmp.x + gap - tmp2.x;
        reze.root.updateMatrixWorld(true);

        // And they hold each other: her hands flat on his shoulders either
        // side of his neck, his flat on the small of her back, fingertips just
        // meeting. Targets are read off the other body's bones, so no hand
        // reaches through a body, or through the other hand.
        const hug = easeInOutCubic(segment(c, 50.1, 51.4));
        denji.bones.neck.getWorldPosition(hold.nape);
        fwd.set(0, 0, 1).applyQuaternion(denji.root.quaternion);
        side.set(1, 0, 0).applyQuaternion(reze.root.quaternion);
        for (const [s, k2] of [["l", 1], ["r", -1]]) hold.her[s].copy(hold.nape).addScaledVector(fwd, -0.06).addScaledVector(side, k2 * 0.145).y += 0.03;
        reze.bones.spine.getWorldPosition(hold.waist);
        fwd.set(0, 0, 1).applyQuaternion(reze.root.quaternion);
        side.set(1, 0, 0).applyQuaternion(denji.root.quaternion);
        for (const [s, k2] of [["l", 1], ["r", -1]]) hold.him[s].copy(hold.waist).addScaledVector(fwd, -0.1).addScaledVector(side, k2 * 0.145).y += 0.1;
        denji.apply(reach(denji, himPose, hold.him, HUG_HINT.him, hug));
        reze.apply(reach(reze, herPose, hold.her, HUG_HINT.her, hug));
        denji.root.updateMatrixWorld(true);
        reze.root.updateMatrixWorld(true);
        // Palms laid on: his against her back, hers down on his shoulders.
        aim.copy(fwd);
        for (const s of ["l", "r"]) palmTo(denji, s, aim, hug);
        aim.set(0, -1, 0);
        for (const s of ["l", "r"]) palmTo(reze, s, aim, hug);
        const p = easeInOutCubic(u);
        cam(top(-0.02, 1.48, -0.6 - p * 0.35), top(-0.02, 1.48, 2.3));
        cut.black = Math.max(1 - segment(c, 48, 48.25), easeInOutCubic(segment(c, 54.4, 56.5)));
      }
    } else {
      // Black. A finger snap, then BOOM. Nothing on the page under it.
      show("none");
      w.palette(VOID);
      denji.root.visible = reze.root.visible = false;
      cut.black = 1;
    }

    // Fireworks over the town once it's dark on the hill.
    if (sky) {
      if (staticMode && !stillLit) {
        stillLit = true;
        for (let i = 0; i < 4; i++) burst(i % 2 === 0);
        fx.step(0.55);
        flare = 0.5;
      }
      if (dt > 0 && c > 24.6) {
        rocket += dt;
        if (rocket > 0.75) {
          rocket = Math.random() * 0.3;
          const warm = Math.random() < 0.5;
          burst(warm);
          flare = 1;
          flareColor = warm ? "#ffb070" : "#ff8fd0";
        }
      }
    }
    if (wasSky && !sky) fx.clear();
    wasSky = sky;
    fx.step(dt);

    // The exchange.
    const line = LINES.find(([a, b]) => c >= a && c < b);
    if (line) {
      const [a, b, who, words] = line;
      const showB = segment(c, a, a + 0.3) * (1 - segment(c, b - 0.3, b));
      const anchor = screen(mouthOf(who === "her" ? reze : denji));
      const bx = Math.min(72, Math.max(28, anchor[0] + (anchor[0] < 50 ? 14 : -14)));
      const by = Math.min(40, Math.max(16, anchor[1] - 20));
      bubble.update({ text: words, at: [bx, by], anchor, size: 3.0, show: showB });
    } else bubble.update({ show: 0 });

    // The snap and the BOOM, on black.
    const snapK = segment(c, SNAP_AT, SNAP_AT + 0.12) * (1 - segment(c, SNAP_AT + 1.2, SNAP_AT + 1.6));
    snap.update({ x: 50, y: 50, size: 9, rotate: -6, scale: lerp(1.5, 1, easeOutBack(segment(c, SNAP_AT, SNAP_AT + 0.25))), opacity: snapK, boil: Math.floor(c * 8), jitter: 0.03 });
    const boomK = segment(c, BOOM_AT, BOOM_AT + 0.08) * (1 - segment(c, CYCLE - 2.2, CYCLE - 1.2));
    const hitK = 1 - segment(c, BOOM_AT, BOOM_AT + 1.4);
    const shake = c > BOOM_AT && c < BOOM_AT + 0.9 ? [(hash(Math.floor(c * 30)) - 0.5) * 30 * hitK, (hash(Math.floor(c * 30) + 7) - 0.5) * 30 * hitK] : [0, 0];
    boom.update({ x: 50, y: 48, size: 14, rotate: -4, scale: lerp(2.2, 1, easeOutBack(segment(c, BOOM_AT, BOOM_AT + 0.35))), opacity: boomK, boil: Math.floor(c * 10), jitter: 0.05, shake });
    if (c > BOOM_AT && c < BOOM_AT + 1.4) {
      // A hot flash through the black as it goes off.
      cut.flash = hitK;
      cut.flashColor = "#ff5a2b";
      cut.black = 1 - hitK * 0.85;
    }
    cuts.update(cut);
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fx.resize(height, camera.fov, stage.renderer.getPixelRatio());
  });

  return {
    ready: cast.ready,
    update,
    dispose() {
      unsubscribeResize();
      [cuts, bubble, snap, boom].forEach((x) => x.dispose());
    },
  };
};
