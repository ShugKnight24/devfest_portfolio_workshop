import * as THREE from "three";
import { DRESS, OUTFITS, createCuts, createInkWorld } from "../rezeKit";
import { easeInOutCubic, easeOutBack, easeOutCubic, easeInCubic, hash, lerp, segment, softDot } from "../kit";
import { INK, outline } from "../ink";
import { blendPose } from "../figure";
import { createChainsawMan } from "../chainsawMan";
import { buildPochita } from "../pochita";

/**
 * The contract — Chainsaw Man, episode 1. The yakuza have cut Denji up and
 * thrown him in a dumpster with Pochita, both dead. A drop of Denji's blood
 * falls into Pochita's mouth; in the dark Denji dreams Pochita sitting on his
 * chest, and Pochita makes the deal.
 *
 *   0    – 3.0   night rain, from above: an open dumpster in an alley. Denji
 *                lies broken on the trash bags, propped on the heap, white
 *                shirt soaked red, eyes shut; his left arm hangs off a bag over
 *                Pochita, who lies limp on his back beside him
 *   3.0  – 5.85  close on the hand: blood runs down the middle finger (3.3),
 *                swells at the tip, falls (4.65) into Pochita's open mouth
 *                (4.9); his eye opens (5.15) and he shivers
 *   5.85 – 6.1   a brief white-to-red flash: the cut
 *   5.9  – 7.0   the dream: a dark, quiet floor. Denji on his back, Pochita
 *                sitting on his chest looking at his face; Denji's eyes open
 *                (6.6), dazed, and he lifts his head to look
 *   7.0  – 17.2  Pochita's four lines, one speech bubble at a time:
 *                "I always loved hearing you talk about your dreams, Denji."
 *                (7.0) / "Here's the deal." (9.9) / "I'll give you my heart."
 *                (11.8) / "In exchange... I want you to show me your dreams."
 *                (14.0)
 *   17.2 – 18.4  Pochita slides to the left of Denji's chest and sinks in,
 *                over his heart
 *   18.45 – 20.6 back in the dumpster, Pochita gone: Denji's hand twitches
 *                (18.9), the closed lid over his legs starts to lift (19.3);
 *                dip to black, reset
 *
 * Loops on its own clock (CYCLE) and ignores the clicker beat (`fired`).
 * Reduced motion holds 15.6: the dream, Pochita on his chest, the last line
 * up. Denji is createChainsawMan at form 0 (plain Denji; no tie, no cord);
 * Pochita is the shared model (pochita.js); the dumpster, the bags and
 * the alley are built here.
 */

const CYCLE = 20.6;
const STATIC_TIME = 15.6;

const T = {
  close: 3.0,
  trickle: [3.3, 4.3],
  swell: [4.3, 4.65],
  fall: [4.65, 4.9],
  eye: 5.15,
  flash: 5.85,
  dream: 5.92,
  denjiEyes: 6.6,
  merge: [17.2, 18.4],
  back: 18.45,
  twitch: 18.9,
  lid: [19.3, 20.1],
};
const LINES = [
  ["I always loved hearing you talk about your dreams, Denji.", 7.0, 9.9],
  ["Here's the deal.", 9.9, 11.8],
  ["I'll give you my heart.", 11.8, 14.0],
  ["In exchange... I want you to show me your dreams.", 14.0, 17.2],
];

// Night in the alley: a cold streetlight, wet steel. The dream: warm, dim, still.
const ALLEY = { ground: "#05070d", lines: "#a7b8d8", accent: "#c8102e", rim: "#9fb4e0", shade: "#46516e" };
const DREAMLIGHT = { ground: "#08060b", lines: "#e6d4c4", accent: "#c8102e", rim: "#f0c9a8", shade: "#5e4f66" };
const ALLEY_DIR = [0.35, 0.85, 0.4];
const DREAM_DIR = [-0.25, 0.85, 0.5];

const BLOOD = "#8e0d14";
const POCHITA_SCALE = 0.14;

// The dumpster: inner box, wheels under it, two lids hinged at the back.
const BIN = { x0: -1.0, x1: 1.0, z0: -0.6, z1: 0.6, floor: 0.2, rim: 1.15, wall: 0.04 };
const DREAM_X = 40; // the dream floor, well away from the alley

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pulse = (c, at, width = 0.08) => Math.exp(-(((c - at) / width) ** 2));
const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));

// ── Poses (figure.js convention: standing frame, the root lays him down) ──
// Propped on the heap, broken: head lolled toward Pochita, right arm at his
// side, one knee up, the other leg flung out.
const SPRAWL = {
  spine: [0.05, 0, 0.06],
  chest: [0.03, 0.06, 0],
  neck: [0.08, 0.12, 0.04],
  head: [0.04, 0.62, 0.16],
  rShoulder: [-0.12, 0.1, -0.3],
  rElbow: [-0.4, 0, 0],
  lHip: [-0.62, 0.12, 0.14],
  lKnee: [0.55, 0, 0],
  rHip: [-0.85, -0.2, -0.24],
  rKnee: [1.0, 0, 0],
};
// The dream: flat on his back, arms loose at his sides.
const LIE = {
  spine: [0.02, 0, 0],
  head: [0.05, 0.08, 0],
  lShoulder: [0, 0, 0.18],
  lElbow: [-0.25, 0, 0],
  rShoulder: [0, 0, -0.16],
  rElbow: [-0.3, 0, 0],
  lHip: [-0.06, 0, 0.06],
  lKnee: [0.1, 0, 0],
  rHip: [-0.12, 0, -0.07],
  rKnee: [0.22, 0, 0],
};
// He lifts his head to look at Pochita on his chest.
const LOOK = { ...LIE, spine: [0.08, 0, 0], neck: [0.5, 0, 0], head: [0.42, 0.05, 0] };

/** Two-bone arm IK on the pose library's arms (the breakfast table's solver). */
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
    /** Put the `s` wrist on `target` (world); `hint` (root space) is where the elbow points. */
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

/** Every vertex of the visible, posed meshes under `root` (outlines skipped), in world space. */
const eachVertex = (root, fn) => {
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const shown = (o) => {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  root.traverse((o) => {
    if (!o.isMesh || o.material?.uniforms?.uWidth || !shown(o)) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (o.isSkinnedMesh) o.getVertexPosition(i, v);
      else v.fromBufferAttribute(pos, i);
      v.applyMatrix4(o.matrixWorld);
      fn(v, o, i);
    }
  });
};

/**
 * Closed eyes: the painted eyeballs (white, iris, heavy lid) repainted as a
 * lid of skin with a dark lash line across the middle. Returns `set(closed)`.
 */
const createEyelids = (fig, skin) => {
  const eyes = [];
  fig.model.traverse((m) => m.isMesh && /^eyes/i.test(m.name) && m.geometry.attributes.color && eyes.push(m));
  // Which way is front: as the outfit painter measures it, from the feet.
  let body = null;
  fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  let front = 1;
  if (body) {
    const bp = body.geometry.attributes.position;
    body.geometry.computeBoundingBox();
    const { min, max } = body.geometry.boundingBox;
    const H = max.y - min.y;
    let sole = 0;
    let ankle = 0;
    let ns = 0;
    let na = 0;
    for (let i = 0; i < bp.count; i++) {
      const ny = (bp.getY(i) - min.y) / H;
      if (ny < 0.015) (sole += bp.getZ(i)), ns++;
      else if (ny > 0.05 && ny < 0.07) (ankle += bp.getZ(i)), na++;
    }
    front = Math.sign(sole / Math.max(1, ns) - ankle / Math.max(1, na)) || 1;
  }
  const lid = new THREE.Color(skin).multiplyScalar(0.92);
  const lash = new THREE.Color("#2a1810");
  const sets = eyes.map((mesh) => {
    const col = mesh.geometry.attributes.color;
    const open = col.array.slice();
    const closed = col.array.slice();
    const ap = mesh.geometry.attributes.position;
    const boxes = { [-1]: new THREE.Box3(), [1]: new THREE.Box3() };
    const p = new THREE.Vector3();
    for (let k = 0; k < ap.count; k++) boxes[Math.sign(ap.getX(k)) || 1].expandByPoint(p.fromBufferAttribute(ap, k));
    for (let i = 0; i < ap.count; i++) {
      p.fromBufferAttribute(ap, i);
      const b = boxes[Math.sign(p.x) || 1];
      const r = Math.max(1e-5, (b.max.x - b.min.x) / 2);
      const dx = (p.x - (b.min.x + b.max.x) / 2) / r;
      const dy = (p.y - (b.min.y + b.max.y) / 2) / r;
      const out = ((p.z - (b.min.z + b.max.z) / 2) * front) / r;
      // The lash line: a shallow downward curve just under the middle.
      const curve = -0.12 - 0.18 * dx * dx;
      const c = out > 0.15 && Math.abs(dy - curve) < 0.1 && Math.abs(dx) < 0.92 ? lash : lid;
      closed.set([c.r, c.g, c.b], i * 3);
    }
    return { col, open, closed };
  });
  let state = null;
  return (shut) => {
    if (shut === state) return;
    state = shut;
    for (const s of sets) {
      s.col.array.set(shut ? s.closed : s.open);
      s.col.needsUpdate = true;
    }
  };
};

/** A garbage bag: a lumpy sack with a tied neck. Unit size: radius 1, bottom at y = -1. */
const bagGeometry = (seed) => {
  const g = new THREE.SphereGeometry(1, 22, 16);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    // Folds and lumps; a pinch toward the neck at the top; a flat-ish base.
    const lump = 1 + 0.07 * Math.sin(a * 3 + seed * 2.1) * Math.cos(y * 2.3 + seed) + 0.04 * Math.sin(a * 7 + y * 5 + seed * 4.3);
    const pinch = y > 0.55 ? 1 - (y - 0.55) * 0.55 : 1;
    const flat = y < -0.75 ? -0.75 + (y + 0.75) * 0.4 : y;
    p.setXYZ(i, x * lump * pinch, flat * (0.97 + 0.03 * lump), z * lump * pinch);
  }
  g.computeVertexNormals();
  return g;
};

/**
 * The speech bubble: a white manga balloon with an ink border and a tail
 * pointing at the speaker. Real DOM text, one line at a time.
 */
const createSpeech = (overlay) => {
  if (!overlay) return { update() {}, dispose() {} };
  const NS = "http://www.w3.org/2000/svg";
  const PAPER_WHITE = "#fbf8f2";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", opacity: "0" });
  const tail = document.createElementNS(NS, "path");
  tail.setAttribute("fill", PAPER_WHITE);
  tail.setAttribute("stroke", INK);
  tail.setAttribute("stroke-linejoin", "round");
  svg.appendChild(tail);
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, {
    position: "absolute",
    left: "0",
    top: "0",
    boxSizing: "border-box",
    background: PAPER_WHITE,
    color: INK,
    borderStyle: "solid",
    borderColor: INK,
    borderRadius: "50%",
    padding: "1.05em 1.6em",
    textAlign: "center",
    fontFamily: '"Space Grotesk", "Arial", sans-serif',
    fontWeight: "700",
    lineHeight: "1.2",
    letterSpacing: "0.015em",
    textTransform: "uppercase",
    pointerEvents: "none",
    willChange: "transform, opacity",
    transformOrigin: "50% 100%",
    opacity: "0",
  });
  overlay.append(svg, box);
  let last = null;
  return {
    /** `ax, ay`: the speaker, in px of the overlay. */
    update({ text, opacity = 1, scale = 1, ax = 0, ay = 0 }) {
      const W = overlay.clientWidth || 1;
      const H = overlay.clientHeight || 1;
      const show = text && opacity > 0.01;
      box.style.opacity = String(show ? opacity : 0);
      svg.style.opacity = String(show ? opacity : 0);
      if (!show) return;
      const fs = THREE.MathUtils.clamp(H * 0.036, 13, 34);
      box.style.fontSize = `${fs}px`;
      box.style.borderWidth = `${Math.max(2, fs * 0.13)}px`;
      box.style.maxWidth = `${Math.min(W * 0.7, fs * 17)}px`;
      if (text !== last) {
        last = text;
        box.textContent = text;
      }
      const bw = box.offsetWidth || fs * 12;
      const bh = box.offsetHeight || fs * 4;
      // Above the speaker, nudged toward the frame's middle, kept in frame.
      const cx = THREE.MathUtils.clamp(lerp(ax, W / 2, 0.35), bw / 2 + W * 0.03, W - bw / 2 - W * 0.03);
      const cy = THREE.MathUtils.clamp(ay - H * 0.17 - bh / 2, bh / 2 + H * 0.04, Math.max(bh / 2 + H * 0.04, ay - bh / 2 - fs * 1.4));
      box.style.transform = `translate(${cx - bw / 2}px, ${cy - bh / 2}px) scale(${scale})`;
      // The tail: from inside the balloon's lower edge to just short of the speaker.
      const baseY = cy + bh * 0.36;
      const tipX = lerp(cx, ax, 0.8);
      const tipY = Math.max(baseY + fs * 0.8, ay - fs * 1.1);
      const half = fs * 0.55;
      const bx = cx + (tipX - cx) * 0.15;
      tail.setAttribute("d", `M ${bx - half} ${baseY} Q ${lerp(bx, tipX, 0.55) - half * 0.2} ${lerp(baseY, tipY, 0.5)} ${tipX} ${tipY} Q ${lerp(bx, tipX, 0.45) + half * 0.5} ${lerp(baseY, tipY, 0.45)} ${bx + half} ${baseY} Z`);
      tail.setAttribute("stroke-width", String(Math.max(2, fs * 0.13)));
      svg.style.transform = `scale(1)`;
    },
    dispose() {
      svg.remove();
      box.remove();
    },
  };
};

export const createPochitaContractScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  const cuts = createCuts(overlay);
  const speech = createSpeech(overlay);
  let disposed = false;

  const dot = softDot();
  const slab = (x0, x1, y0, y1, z0, z1, mat, parent, line = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    parent.add(m);
    if (line) outline(m, w.line);
    return m;
  };
  const softShadow = (wd, dp, x, y, z, o, parent) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, dp), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: o, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    asphalt: w.ink({ tint: "#262a30", tone: 0.6, rim: 0.1, spec: 0.35 }),
    puddle: w.ink({ tint: "#1a2030", tone: 0.5, rim: 0.4, spec: 1 }),
    brick: w.ink({ tint: "#4e2e26", tone: 0.7, rim: 0.15 }),
    mortar: w.ink({ tint: "#2c2422", tone: 0.6, rim: 0.1 }),
    binSteel: w.ink({ tint: "#2f4d3c", tone: 0.78, rim: 0.45, spec: 0.5 }),
    binInside: w.ink({ tint: "#243a2e", tone: 0.62, rim: 0.2, spec: 0.3 }),
    rust: w.ink({ tint: "#6a3a22", tone: 0.7, rim: 0.2 }),
    lip: w.ink({ tint: "#5a6a60", tone: 0.85, rim: 0.5, spec: 0.7 }),
    lid: w.ink({ tint: "#1d2024", tone: 0.65, rim: 0.55, spec: 0.7 }),
    wheel: w.ink({ tint: "#141416", tone: 0.5, rim: 0.3 }),
    bagDark: w.ink({ tint: "#23262c", tone: 0.7, rim: 0.6, spec: 0.75 }),
    bagDark2: w.ink({ tint: "#2c2f26", tone: 0.7, rim: 0.6, spec: 0.75 }),
    bagLight: w.ink({ tint: "#8d979e", tone: 0.82, rim: 0.4, spec: 0.6 }),
    bagBlue: w.ink({ tint: "#5d6f82", tone: 0.8, rim: 0.4, spec: 0.6 }),
    card: w.ink({ tint: "#8a6a44", tone: 0.8, rim: 0.3 }),
    can: w.ink({ tint: "#9aa0a6", tone: 0.9, rim: 0.6, spec: 0.8 }),
    pipe: w.ink({ tint: "#3a3f44", tone: 0.7, rim: 0.4, spec: 0.5 }),
    blood: w.ink({ tint: BLOOD, tone: 0.8, rim: 0.3, spec: 0.7 }),
    drop: w.ink({ tint: "#a8121c", tone: 0.9, rim: 0.4, spec: 1 }),
    voidFloor: w.ink({ tint: "#17121c", tone: 0.55, rim: 0.05 }),
  };

  // ── The alley ────────────────────────────────────────────────────────────
  const alley = new THREE.Group();
  scene.add(alley);
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), M.asphalt);
    ground.rotation.x = -Math.PI / 2;
    alley.add(ground);
    for (const [x, z, sx, sz] of [
      [1.7, 1.2, 0.9, 0.5],
      [-1.6, 1.6, 0.7, 0.4],
      [0.4, 1.5, 0.5, 0.25],
    ]) {
      const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 24), M.puddle);
      pud.rotation.x = -Math.PI / 2;
      pud.scale.set(sx, sz, 1);
      pud.position.set(x, 0.004, z);
      alley.add(pud);
    }
    // A brick wall behind the bin: courses of brick with dark mortar between.
    slab(-6, 6, 0, 4.2, -1.32, -1.2, M.mortar, alley);
    for (let row = 0; row < 26; row++) {
      const y0 = row * 0.16;
      const off = (row % 2) * 0.13;
      for (let i = 0; i < 46; i++) {
        const x0 = -6 + i * 0.26 + off;
        if (x0 > 5.8) break;
        const b = slab(x0 + 0.01, x0 + 0.25, y0 + 0.012, y0 + 0.15, -1.21, -1.17, M.brick, alley);
        b.position.z += (hash(row * 47 + i) - 0.5) * 0.008;
      }
    }
    // A drainpipe and a bracket lamp on the wall.
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 12), M.pipe);
    pipe.position.set(-1.55, 2.1, -1.1);
    alley.add(pipe);
    outline(pipe, w.line);
    slab(1.25, 1.33, 2.4, 2.46, -1.17, -0.85, M.pipe, alley);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.1, 16, 1, true), M.pipe);
    shade.material.side = THREE.DoubleSide;
    shade.position.set(1.29, 2.36, -0.85);
    alley.add(shade);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#dfe8ff").multiplyScalar(1.25) }));
    lamp.position.set(1.29, 2.31, -0.85);
    alley.add(lamp);
    // The lamp's cold pool on the wet ground.
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0), new THREE.MeshBasicMaterial({ color: "#8fa8d8", map: dot, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(1.0, 0.01, 0.4);
    alley.add(pool);
  }

  // ── The dumpster ─────────────────────────────────────────────────────────
  const bin = new THREE.Group();
  alley.add(bin);
  const { x0, x1, z0, z1, floor, rim, wall } = BIN;
  slab(x0 - wall, x1 + wall, floor - 0.05, floor, z0 - wall, z1 + wall, M.binInside, bin);
  // Walls: steel outside, darker inside (two slabs so each face has its own tone).
  slab(x0 - wall, x1 + wall, floor - 0.05, rim, z1, z1 + wall, M.binSteel, bin, true);
  slab(x0 - wall, x1 + wall, floor - 0.05, rim, z0 - wall, z0, M.binSteel, bin, true);
  slab(x0 - wall, x0, floor - 0.05, rim, z0, z1, M.binSteel, bin, true);
  slab(x1, x1 + wall, floor - 0.05, rim, z0, z1, M.binSteel, bin, true);
  slab(x0 + 0.001, x1 - 0.001, floor, rim - 0.01, z1 - 0.006, z1 - 0.001, M.binInside, bin);
  slab(x0 + 0.001, x1 - 0.001, floor, rim - 0.01, z0 + 0.001, z0 + 0.006, M.binInside, bin);
  slab(x0 + 0.001, x0 + 0.006, floor, rim - 0.01, z0, z1, M.binInside, bin);
  slab(x1 - 0.006, x1 - 0.001, floor, rim - 0.01, z0, z1, M.binInside, bin);
  // The rolled lip round the top, ribs down the front, rust, wheels.
  slab(x0 - wall - 0.025, x1 + wall + 0.025, rim - 0.05, rim, z1 + wall - 0.005, z1 + wall + 0.035, M.lip, bin, true);
  slab(x0 - wall - 0.025, x1 + wall + 0.025, rim - 0.05, rim, z0 - wall - 0.035, z0 - wall + 0.005, M.lip, bin, true);
  slab(x0 - wall - 0.035, x0 - wall + 0.005, rim - 0.05, rim, z0 - wall, z1 + wall, M.lip, bin, true);
  slab(x1 + wall - 0.005, x1 + wall + 0.035, rim - 0.05, rim, z0 - wall, z1 + wall, M.lip, bin, true);
  for (const x of [-0.5, 0, 0.5]) slab(x - 0.03, x + 0.03, floor + 0.05, rim - 0.12, z1 + wall, z1 + wall + 0.025, M.binSteel, bin, true);
  for (const [x, y, sx, sy] of [
    [-0.78, 0.42, 0.16, 0.12],
    [0.72, 0.9, 0.12, 0.08],
    [0.25, 0.3, 0.1, 0.07],
  ]) {
    const r = new THREE.Mesh(new THREE.CircleGeometry(1, 14), M.rust);
    r.scale.set(sx, sy, 1);
    r.position.set(x, y, z1 + wall + 0.002);
    bin.add(r);
  }
  for (const x of [x0 + 0.12, x1 - 0.12]) {
    for (const z of [z0 + 0.1, z1 - 0.1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 14), M.wheel);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.07, z);
      bin.add(wheel);
      slab(x - 0.03, x + 0.03, 0.07, floor - 0.05, z - 0.03, z + 0.03, M.pipe, bin);
    }
  }
  softShadow(2.8, 1.9, 0, 0.006, 0, 0.6, alley);
  // Lids: plastic, hinged on the back edge. The head end hangs open behind the
  // bin; the foot end is shut over his legs (and lifts at the end).
  const HINGE_Y = rim + 0.02;
  const HINGE_Z = z0 - wall - 0.02;
  const makeLid = (xa, xb) => {
    const pivot = new THREE.Group();
    pivot.position.set((xa + xb) / 2, HINGE_Y, HINGE_Z);
    bin.add(pivot);
    const depth = z1 - z0 + 2 * wall + 0.06;
    slab(-(xb - xa) / 2, (xb - xa) / 2, 0, 0.035, 0, depth, M.lid, pivot, true);
    for (const s of [-1, 1]) slab(s * (xb - xa) * 0.25 - 0.03, s * (xb - xa) * 0.25 + 0.03, 0.035, 0.06, 0.08, depth - 0.08, M.lid, pivot, true);
    slab(-(xb - xa) / 2, (xb - xa) / 2, -0.05, 0.035, depth - 0.025, depth, M.lid, pivot);
    return pivot;
  };
  const lidOpen = makeLid(0.01, x1 + wall + 0.02);
  lidOpen.rotation.x = -(Math.PI - 0.22); // hanging down behind the bin, against its back
  const lidShut = makeLid(x0 - wall - 0.02, -0.01);
  lidShut.rotation.x = 0;

  // ── Rain ─────────────────────────────────────────────────────────────────
  const RAIN = 520;
  const rainPos = new Float32Array(RAIN * 6);
  const rainSeed = Array.from({ length: RAIN }, (_, i) => [hash(i * 1.31), hash(i * 2.77), hash(i * 4.13), 0.5 + hash(i * 6.9) * 0.5]);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#a9bbd9", transparent: true, opacity: 0.32, depthWrite: false }));
  rain.frustumCulled = false;
  alley.add(rain);
  const updateRain = (t) => {
    for (let i = 0; i < RAIN; i++) {
      const [a, b, c, s] = rainSeed[i];
      const x = -2.4 + a * 4.8;
      const z = -1.1 + b * 3.6;
      const y = 3.6 - (((t * (5.5 + s * 2) + c * 3.6) % 3.6) + 3.6) % 3.6;
      const len = 0.16 * s;
      rainPos.set([x, y, z, x - 0.02, y + len, z - 0.01], i * 6);
    }
    rainGeo.attributes.position.needsUpdate = true;
  };

  // ── The dream: a dark, quiet floor and nothing else ──────────────────────
  const dream = new THREE.Group();
  dream.position.x = DREAM_X;
  scene.add(dream);
  {
    const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(16, 48), M.voidFloor);
    floorMesh.rotation.x = -Math.PI / 2;
    dream.add(floorMesh);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ color: "#f0c9a8", map: dot, transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.004;
    dream.add(pool);
    softShadow(2.0, 0.8, 0, 0.006, 0, 0.55, dream);
  }
  dream.visible = false;

  // ── Pochita ──────────────────────────────────────────────────────────────
  const pochita = buildPochita(w, { hurt: true });
  const pochitaRoot = new THREE.Group();
  pochitaRoot.scale.setScalar(POCHITA_SCALE);
  pochitaRoot.add(pochita.pup);
  scene.add(pochitaRoot);
  // Limp on his back, his face to us and tipped up, so the bar lies flat
  // along the bags toward the front wall and the open mouth faces the sky.
  const limpQ = (() => {
    const f = v3(0.45, 0.95, 0.65).normalize();
    const u = v3(0.3, -1, 0);
    u.addScaledVector(f, -u.dot(f)).normalize();
    const x = new THREE.Vector3().crossVectors(u, f);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, u, f));
  })();
  // Legs flopped: the fronts fall out to the sides, the hinds stick up.
  const LIMP_LEGS = [
    [0.7, 0, -0.6],
    [0.3, 0, -0.25],
    [0.6, 0, 0.7],
    [0.2, 0, 0.3],
  ];

  // The drop: a bead running down the finger, a swelling drip, a falling drop.
  const drip = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), M.drop);
  drip.visible = false;
  scene.add(drip);
  const smear = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.blood);
  smear.visible = false;
  scene.add(smear);

  // ── Denji ────────────────────────────────────────────────────────────────
  const cast = { denji: null };
  const placed = {
    dumpRoot: new THREE.Vector3(),
    dumpQuat: new THREE.Quaternion(),
    dreamRoot: new THREE.Vector3(),
    dreamQuat: new THREE.Quaternion(),
    sprawl: null,
    tipLocal: [],
    mouth: new THREE.Vector3(),
    tip: new THREE.Vector3(),
    knuckle: new THREE.Vector3(),
    pochitaDump: new THREE.Vector3(),
    pochitaDream: new THREE.Vector3(),
    heart: new THREE.Vector3(),
    chest: new THREE.Vector3(),
  };
  const bags = new THREE.Group();
  bin.add(bags);

  const OUTFIT = { ...OUTFITS.denji, tie: null };
  const DRESSED = { ...DRESS.denji, tie: false };
  const ready = createChainsawMan({ height: 1.72, line: w.line, lineThin: w.line, ink: { tone: 0.82, rim: 0.5 }, outfit: OUTFIT, dress: DRESSED, cord: false, form: 0, blades: 0, mouth: 0, blood: 0.8 }).then((cm) => {
    if (disposed) {
      cm.dispose();
      return;
    }
    const fig = cm.figure;
    fig.setHands("relaxed");
    const eyelids = createEyelids(fig, OUTFIT.skin);
    const ik = createArmIK(fig);
    const root = cm.root;
    scene.add(root);
    w.register(root);

    // The left arm's bones, so the hanging arm does not set how low he lies.
    const leftArm = new Set();
    fig.bones.lShoulder?.traverse((o) => o.isBone && leftArm.add(o));
    let bodyMesh = null;
    fig.model.traverse((m) => m.isSkinnedMesh && (!bodyMesh || m.geometry.attributes.position.count > bodyMesh.geometry.attributes.position.count) && (bodyMesh = m));
    const dominant = (mesh, i) => {
      const si = mesh.geometry.attributes.skinIndex;
      const sw = mesh.geometry.attributes.skinWeight;
      let best = 0;
      for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k;
      return mesh.skeleton.bones[si.getComponent(i, best)];
    };
    /** Drop the root so the lowest point (optionally skipping the left arm) is at `y`. */
    const settle = (y, skipArm) => {
      let low = Infinity;
      eachVertex(root, (v, mesh, i) => {
        if (skipArm && mesh === bodyMesh && leftArm.has(dominant(mesh, i))) return;
        if (skipArm && mesh !== bodyMesh && mesh.isSkinnedMesh === false && leftArm.has(mesh.parent)) return;
        low = Math.min(low, v.y);
      });
      root.position.y += y - low;
      root.updateMatrixWorld(true);
    };
    const tipBone = fig.model.getObjectByName("middle_04_leaf_l");
    const midBone = fig.model.getObjectByName("middle_02_l");

    // 1. The dumpster: propped on the heap, head to +x, his left side to us.
    root.rotation.set(-Math.PI / 2 + 0.38, -Math.PI / 2 - 0.1, 0, "YXZ");
    root.position.set(0, 0, 0);
    const sprawl = blendPose(SPRAWL, SPRAWL, 0);
    fig.apply(sprawl);
    root.updateMatrixWorld(true);
    // Put the hips at the foot end, a little behind centre.
    const hips = fig.bones.hips.getWorldPosition(new THREE.Vector3());
    root.position.x += -0.32 - hips.x;
    root.position.z += -0.27 - hips.z;
    root.updateMatrixWorld(true);
    settle(0.44, true);

    // Pochita lies by his left side, his mouth under where the hand will hang.
    const shoulder = fig.bones.lShoulder.getWorldPosition(new THREE.Vector3());
    pochitaRoot.quaternion.copy(limpQ);
    pochita.legs.forEach((g, i) => g.rotation.set(...LIMP_LEGS[i]));
    pochita.setMouth(0.85);
    pochita.setEyes(0.08);
    const mouthAt = v3(shoulder.x - 0.02, 0, 0.2);
    pochitaRoot.position.set(0, 0, 0);
    pochitaRoot.updateMatrixWorld(true);
    const mouthLocal = pochita.mouth.getWorldPosition(new THREE.Vector3());
    pochitaRoot.position.set(mouthAt.x - mouthLocal.x, 0, mouthAt.z - mouthLocal.z);
    pochitaRoot.updateMatrixWorld(true);
    let low = Infinity;
    eachVertex(pochitaRoot, (v) => (low = Math.min(low, v.y)));
    pochitaRoot.position.y += floor + 0.06 - low; // on a flattened bag
    pochitaRoot.updateMatrixWorld(true);
    placed.pochitaDump.copy(pochitaRoot.position);
    pochita.mouth.getWorldPosition(placed.mouth);

    // The left arm: over a bag, the forearm hanging, the middle finger over his mouth.
    const want = placed.mouth.clone().add(v3(0, 0.15, 0));
    const hint = v3(0.15, 0.6, 0.7).normalize().applyQuaternion(root.quaternion.clone().invert());
    const wrist = want.clone().add(v3(0, 0.12, -0.08));
    const tip = new THREE.Vector3();
    const hand = new THREE.Vector3();
    for (let k = 0; k < 6; k++) {
      ik.solve(sprawl, "l", wrist, hint);
      fig.apply(sprawl);
      root.updateMatrixWorld(true);
      tipBone.getWorldPosition(tip);
      ik.arms.l.hand.getWorldPosition(hand);
      wrist.add(want.clone().sub(tip).multiplyScalar(0.9));
    }
    placed.sprawl = sprawl;
    placed.dumpRoot.copy(root.position);
    placed.dumpQuat.copy(root.quaternion);
    tipBone.getWorldPosition(placed.tip);
    midBone.getWorldPosition(placed.knuckle);

    // 2. The bags, filled in under and around everything now it is all placed.
    const forearm = new Set();
    fig.model.getObjectByName("lowerarm_l")?.traverse((o) => o.isBone && forearm.add(o));
    buildBags(root, (mesh, i) => mesh === bodyMesh && forearm.has(dominant(mesh, i)));

    // 3. The dream: flat on his back on the floor, head to +x.
    root.rotation.set(-Math.PI / 2, -Math.PI / 2, 0, "YXZ");
    root.position.set(0, 0, 0);
    fig.apply(LIE);
    root.updateMatrixWorld(true);
    const h2 = fig.bones.hips.getWorldPosition(new THREE.Vector3());
    root.position.x += DREAM_X - 0.35 - h2.x;
    root.position.z += -h2.z;
    root.updateMatrixWorld(true);
    settle(0, false);
    placed.dreamRoot.copy(root.position);
    placed.dreamQuat.copy(root.quaternion);
    // Pochita sits on his chest, facing his face. When the deal is done he
    // sinks into the left of it, where the heart is, not the belly.
    const chest = (fig.bones.chest ?? fig.bones.spine).getWorldPosition(new THREE.Vector3());
    const hipsD = fig.bones.hips.getWorldPosition(new THREE.Vector3());
    const neckD = (fig.model.getObjectByName("neck_01") ?? fig.bones.neck ?? fig.bones.chest).getWorldPosition(new THREE.Vector3());
    const lShoulder = (fig.model.getObjectByName("upperarm_l") ?? fig.bones.chest).getWorldPosition(new THREE.Vector3());
    const topAt = (at, fallback) => {
      let top = -Infinity;
      eachVertex(root, (v) => {
        if (Math.abs(v.x - at.x) < 0.04 && Math.abs(v.z - at.z) < 0.04) top = Math.max(top, v.y);
      });
      return Number.isFinite(top) ? top : fallback;
    };
    const seatAt = neckD.clone().lerp(hipsD, 0.44);
    placed.chest.set(seatAt.x, topAt(seatAt, chest.y + 0.1), seatAt.z);
    placed.pochitaDream.copy(placed.chest);
    // The heart: a hand below the collarbone, a third of the way out from the
    // breastbone toward his left shoulder.
    const breast = neckD.clone().lerp(hipsD, 0.24);
    const spineDir = hipsD.clone().sub(neckD).normalize();
    const out = lShoulder.clone().sub(breast);
    out.addScaledVector(spineDir, -out.dot(spineDir));
    const heartAt = breast.clone().addScaledVector(out, 0.36);
    placed.heart.set(heartAt.x, topAt(heartAt, chest.y + 0.1), heartAt.z);

    cast.denji = { cm, fig, eyelids, root };
    applyMood(Boolean(mood), true);
    w.sync();
    stage.invalidate?.();
  });

  /**
   * Garbage bags filling the bin, each resting on the floor or on the bags
   * under it. A height map of everything lying in the bin (Denji, Pochita)
   * caps each bag just under what lies on it, so they hold him up and never
   * poke through him; away from him they heap to the bin's fill line.
   */
  const CELL = 0.04;
  const GX = Math.ceil((x1 - x0) / CELL);
  const GZ = Math.ceil((z1 - z0) / CELL);
  const buildBags = (denjiRoot, hanging) => {
    // `under`: the lowest thing over each cell. `rests`: the same without the
    // hanging forearm, so only what lies on a bag makes it rise to meet it.
    const under = new Float32Array(GX * GZ).fill(Infinity);
    const rests = new Float32Array(GX * GZ).fill(Infinity);
    const mark = (v, mesh, idx, support = true) => {
      const i = Math.floor((v.x - x0) / CELL);
      const k = Math.floor((v.z - z0) / CELL);
      if (i < 0 || k < 0 || i >= GX || k >= GZ) return;
      under[k * GX + i] = Math.min(under[k * GX + i], v.y);
      if (support) rests[k * GX + i] = Math.min(rests[k * GX + i], v.y);
    };
    eachVertex(denjiRoot, (v, mesh, i) => mark(v, mesh, i, !hanging(mesh, i)));
    eachVertex(pochitaRoot, mark);
    const FILL = 0.5;
    const SINK = 0.015;
    const geos = Array.from({ length: 6 }, (_, i) => bagGeometry(i * 1.7 + 0.3));
    const mats = [M.bagDark, M.bagDark, M.bagDark2, M.bagLight, M.bagBlue, M.bagDark];
    /** How high a bag of radius r centred at (x, z) may reach without passing through anything. */
    const cap = (x, z, r, hh, map = under) => {
      let top = Infinity;
      const i0 = Math.max(0, Math.floor((x - r - x0) / CELL));
      const i1 = Math.min(GX - 1, Math.floor((x + r - x0) / CELL));
      const k0 = Math.max(0, Math.floor((z - r - z0) / CELL));
      const k1 = Math.min(GZ - 1, Math.floor((z + r - z0) / CELL));
      for (let k = k0; k <= k1; k++) {
        for (let i = i0; i <= i1; i++) {
          const u = map[k * GX + i];
          if (u === Infinity) continue;
          const cx = x0 + (i + 0.5) * CELL;
          const cz = z0 + (k + 0.5) * CELL;
          const d = Math.hypot(cx - x, cz - z) / r;
          if (d > 1) continue;
          top = Math.min(top, u + SINK + hh * (1 - Math.sqrt(1 - d * d)));
        }
      }
      return top;
    };
    const addBag = (x, z, r, base, topY, seed, knot) => {
      const h = topY - base;
      if (h < 0.04) return;
      const hh = h / 2;
      const m = new THREE.Mesh(geos[seed % geos.length], mats[(seed * 7 + 3) % mats.length]);
      m.scale.set(r, hh / 0.8875, r * (0.85 + hash(seed * 3.3) * 0.25)); // the unit bag spans -0.775 .. 1
      m.position.set(x, base + 0.775 * (hh / 0.8875), z);
      m.rotation.y = hash(seed * 5.1) * Math.PI * 2;
      bags.add(m);
      outline(m, w.line);
      if (knot && h > 0.12) {
        const neck = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 6), m.material);
        neck.position.set(x, topY + 0.015, z);
        neck.rotation.set((hash(seed) - 0.5) * 0.8, 0, (hash(seed * 2) - 0.5) * 0.8);
        bags.add(neck);
        for (const s of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), m.material);
          ear.scale.set(0.045, 0.018, 0.025);
          ear.position.set(x + s * 0.035, topY + 0.045, z);
          ear.rotation.z = s * 0.6;
          bags.add(ear);
          outline(ear, w.line);
        }
      }
    };
    let seed = 0;
    const spacing = 0.26;
    for (let gz = 0; gz < 6; gz++) {
      for (let gx = 0; gx < 9; gx++) {
        seed++;
        const r = 0.16 + hash(seed * 1.9) * 0.08;
        const x = THREE.MathUtils.clamp(x0 + 0.13 + gx * spacing + (gz % 2) * 0.12 + (hash(seed * 2.3) - 0.5) * 0.08, x0 + r * 0.9, x1 - r * 0.9);
        const z = THREE.MathUtils.clamp(z0 + 0.12 + gz * 0.21 + (hash(seed * 3.7) - 0.5) * 0.06, z0 + r * 0.9, z1 - r * 0.9);
        // The heap slopes down toward the front wall, so Pochita's corner stays in view.
        const free = FILL - 0.22 * THREE.MathUtils.smoothstep(z, 0.0, 0.4) + (hash(seed * 4.4) - 0.5) * 0.1;
        const nominal = (free - floor) / 2;
        let topY = Math.min(free, cap(x, z, r, nominal));
        // Anything lying on this bag: it reaches up to hold it, whatever the fill line.
        const holds = cap(x, z, r * 0.5, nominal, rests);
        if (holds < Infinity) topY = Math.min(cap(x, z, r, nominal), holds);
        topY = Math.max(floor + 0.03, topY);
        // Too tall for one sack: a pile, each bag squat and sitting in the one below.
        let base = floor;
        let layer = 0;
        while (topY - base > 1.5 * r) {
          const h = 1.05 * r;
          addBag(x + layer * 0.015, z - layer * 0.01, r * (1.06 - layer * 0.04), base, base + h, seed + 100 * (layer + 1), false);
          base += h * 0.78;
          layer++;
        }
        addBag(x + layer * 0.015, z - layer * 0.01, r, base, topY, seed, holds === Infinity);
      }
    }
    // A flattened bag under Pochita, and one more under the elbow so the arm rests.
    {
      const p = placed.pochitaDump;
      addBag(p.x - 0.02, p.z, 0.2, floor, Math.min(floor + 0.06, cap(p.x - 0.02, p.z, 0.2, 0.03)), 51, false);
    }
    // Some loose trash on the heap: a crushed can, a flattened box.
    const box = slab(-0.18, 0.18, 0, 0.02, -0.12, 0.12, M.card, bags, true);
    box.position.set(-0.75, FILL + 0.02, 0.35);
    box.rotation.set(0.3, 0.5, 0.15);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.07, 12), M.can);
    can.position.set(0.78, FILL + 0.03, -0.42);
    can.rotation.set(Math.PI / 2, 0.4, 0);
    bags.add(can);
    outline(can, w.line);
  };

  /** The alley at night, or the dream. */
  let mood = null;
  const applyMood = (inDream, force = false) => {
    if (mood === inDream && !force) return;
    mood = inDream;
    const p = inDream ? DREAMLIGHT : ALLEY;
    w.palette(p);
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.multiplyScalar(inDream ? 0.8 : 0.78);
      m.uniforms.uFogRange.value.set(inDream ? 5 : 6, inDream ? 22 : 28);
    });
    w.light(...(inDream ? DREAM_DIR : ALLEY_DIR));
    w.page({ mode: "still" });
    w.bu.uInk.value.set(inDream ? "#050407" : "#03050a");
    w.bu.uPaper.value.set(inDream ? "#2a2130" : "#1a2338");
    w.bu.uRed.value.set("#000000");
    alley.visible = !inDream;
    dream.visible = inDream;
  };
  applyMood(false, true);
  w.sync();

  // ── Camera ───────────────────────────────────────────────────────────────
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const shoot = (c) => {
    const d = cast.denji;
    if (c < T.close) {
      // From above, at an angle, over the front lip: a slow drift in.
      const k = easeInOutCubic(segment(c, 0, T.close));
      camPos.lerpVectors(v3(1.1, 3.45, 1.45), v3(0.92, 3.15, 1.25), k);
      camLook.lerpVectors(v3(0.2, 0.45, -0.1), v3(0.2, 0.45, -0.05), k);
    } else if (c < T.dream) {
      // Close on the hand and his mouth: the drop's whole fall in frame.
      const k = easeInOutCubic(segment(c, T.close, T.dream));
      const focus = tmp.copy(placed.tip).lerp(placed.mouth, 0.55);
      if (!d) focus.set(0.35, 0.45, 0.3);
      camLook.copy(focus);
      // Over the front lip, looking down past the hand into his face.
      camPos.copy(focus).add(tmp2.set(0.36, 0.8, 0.38).multiplyScalar(lerp(1.05, 0.92, k)));
    } else if (c < T.back) {
      // The dream: low on his left side, his face and Pochita, air above for the words.
      const k = easeInOutCubic(segment(c, T.dream, T.merge[0]));
      const m = easeInOutCubic(segment(c, T.merge[0] - 0.4, T.merge[1]));
      const p = placed.chest;
      camLook.set(p.x + 0.22, p.y + 0.1 + 0.08 * (1 - m), p.z);
      camPos.set(p.x + lerp(0.15, 0.3, k), p.y + lerp(0.55, 0.5, k), p.z + lerp(1.9, 1.7, k));
      camPos.lerp(tmp.set(p.x + 0.2, p.y + 0.55, p.z + 1.25), m * 0.6);
    } else {
      // Back in the bin: the hand and the shut lid in one frame.
      const k = easeInOutCubic(segment(c, T.back, CYCLE));
      camPos.lerpVectors(v3(0.9, 3.2, 1.4), v3(0.8, 3.05, 1.28), k);
      camLook.set(0.05, 0.62, 0.05);
    }
  };

  const BASE_FOV = camera.fov;
  let fitFov = BASE_FOV;
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames widen the lens so the bin and the bubble still fit.
    fitFov = BASE_FOV * Math.max(1, (1.1 / aspect) ** 0.6);
    camera.fov = fitFov;
    camera.updateProjectionMatrix();
    w.sync();
  });

  // ── Per-frame ────────────────────────────────────────────────────────────
  const anchor = new THREE.Vector3();
  const updateDenji = (c, t) => {
    const { cm, fig, eyelids, root } = cast.denji;
    const inDream = c >= T.dream && c < T.back;
    if (inDream) {
      // Dazed: eyes open, then he lifts his head to look at Pochita; breathing.
      const lift = easeInOutCubic(segment(c, T.denjiEyes + 0.2, T.denjiEyes + 1.4)) * (1 - easeInOutCubic(segment(c, T.merge[1] - 0.2, T.merge[1])) * 0.5);
      const pose = blendPose(LIE, LOOK, lift * 0.85);
      const breathe = Math.sin(t * 1.6) * 0.012;
      pose.chest = [pose.chest[0] + breathe, pose.chest[1], pose.chest[2]];
      // A jolt as Pochita sinks into him.
      const jolt = pulse(c, T.merge[1] - 0.15, 0.12);
      pose.spine = [pose.spine[0] - 0.08 * jolt, pose.spine[1], pose.spine[2]];
      root.position.copy(placed.dreamRoot);
      root.quaternion.copy(placed.dreamQuat);
      cm.apply(pose);
      eyelids(c < T.denjiEyes);
      cm.setBlood(0.35);
      fig.setHand("both", "relaxed");
    } else {
      root.position.copy(placed.dumpRoot);
      root.quaternion.copy(placed.dumpQuat);
      cm.apply(placed.sprawl);
      eyelids(true);
      cm.setBlood(0.8);
      // The twitch: the hanging fingers curl, twice, once he is alive again.
      const tw = c >= T.back ? Math.max(pulse(c, T.twitch, 0.07), 0.7 * pulse(c, T.twitch + 0.35, 0.08), 0.5 * segment(c, T.lid[0], T.lid[1])) : 0;
      fig.setHand("left", "fist", tw * 0.85);
    }
    cm.update(t, 1 / 60);
  };

  const updatePochita = (c, t) => {
    const p = pochita;
    const inDream = c >= T.dream && c < T.back;
    pochitaRoot.visible = c < T.merge[1];
    if (!inDream) {
      pochitaRoot.position.copy(placed.pochitaDump);
      pochitaRoot.quaternion.copy(limpQ);
      pochitaRoot.scale.setScalar(POCHITA_SCALE);
      p.legs.forEach((g, i) => g.rotation.set(...LIMP_LEGS[i]));
      // Shut eyes; the drop lands; one eye opens, a shiver runs through him.
      const open = easeOutBack(segment(c, T.eye, T.eye + 0.25));
      p.setEyes(lerp(0.08, 1, open));
      p.eyes.forEach((e) => e.pupil.scale.set(0.75, 0.75, 0.5)); // wide, small pupils: shock
      p.setMouth(0.85 - 0.25 * segment(c, T.fall[1], T.fall[1] + 0.3));
      p.bead.visible = c > T.fall[1] && c < T.dream;
      const shiver = c > T.eye ? Math.exp(-(c - T.eye) * 1.4) * Math.min(1, (c - T.eye) * 6) : 0;
      pochitaRoot.position.x += Math.sin(t * 61) * 0.004 * shiver;
      pochitaRoot.position.y += Math.abs(Math.sin(t * 47)) * 0.003 * shiver;
      p.tail.rotation.set(0, Math.sin(t * 30) * 0.4 * shiver, 0);
      p.body.scale.set(1, 1, 1);
    } else {
      // On Denji's chest, facing his face, sitting up; he talks; then sinks in.
      p.pup.rotation.set(0, 0, 0);
      p.legs.forEach((g) => g.rotation.set(0, 0, 0));
      p.setEyes(1 - 0.9 * Math.max(pulse(c, 8.6, 0.05), pulse(c, 12.9, 0.05), pulse(c, 15.8, 0.05)));
      p.eyes.forEach((e) => e.pupil.scale.set(1, 1, 0.5));
      p.bead.visible = false;
      const sink = easeInCubic(segment(c, T.merge[0], T.merge[1]));
      pochitaRoot.quaternion.setFromAxisAngle(v3(0, 1, 0), Math.PI / 2);
      pochitaRoot.rotateX(-0.08);
      // Into the heart: across to the left of his chest as he sinks.
      const across = easeInOutCubic(segment(c, T.merge[0] - 0.4, T.merge[1] - 0.3));
      pochitaRoot.position.lerpVectors(placed.pochitaDream, placed.heart, across).add(tmp.set(0, -0.12 * sink, 0));
      pochitaRoot.scale.setScalar(POCHITA_SCALE * Math.max(0.001, 1 - sink));
      // Talking: the mouth works through each line; a small bob as each begins.
      let talk = 0;
      let bob = 0;
      for (const [, a, b] of LINES) {
        const len = Math.min(b - a - 0.6, 1.4 + (b - a) * 0.3);
        if (c > a + 0.1 && c < a + 0.1 + len) talk = Math.max(0, Math.sin((c - a) * 14)) * 0.55;
        bob = Math.max(bob, pulse(c, a + 0.08, 0.12));
      }
      p.setMouth(talk);
      const breathe = Math.sin(t * 2.4) * 0.015;
      p.body.scale.set(1 + breathe, 1 - breathe * 0.6 + bob * 0.04, 1);
      p.tail.rotation.set(0.1, Math.sin(t * 3) * 0.25, 0);
    }
    pochitaRoot.updateMatrixWorld(true);
  };

  const updateDrop = (c) => {
    const k1 = segment(c, ...T.trickle);
    const show = cast.denji && c > T.trickle[0] && c < T.fall[1] + 0.02;
    drip.visible = Boolean(show);
    smear.visible = Boolean(cast.denji) && c < T.back;
    if (!cast.denji) return;
    // The smear on the back of his hand, where the cut is.
    smear.position.copy(placed.knuckle).lerp(placed.tip, 0.15);
    smear.scale.set(0.012, 0.006, 0.02);
    if (!show) return;
    if (c < T.trickle[1]) {
      // A bead running down the finger, knuckle to tip.
      drip.position.lerpVectors(placed.knuckle, placed.tip, easeInOutCubic(k1));
      drip.scale.setScalar(0.006);
    } else if (c < T.swell[1]) {
      const k = easeOutCubic(segment(c, ...T.swell));
      drip.position.copy(placed.tip).add(tmp.set(0, -0.006 - 0.006 * k, 0));
      drip.scale.set(0.006 + 0.003 * k, 0.006 + 0.007 * k, 0.006 + 0.003 * k);
    } else {
      const k = easeInCubic(segment(c, ...T.fall));
      drip.position.copy(placed.tip).add(tmp.set(0, -0.012, 0)).lerp(placed.mouth, k);
      drip.scale.set(0.007, 0.012 + 0.01 * Math.sin(Math.PI * k), 0.007);
    }
  };

  const updateSpeech = (c) => {
    let line = null;
    for (const l of LINES) if (c >= l[1] && c < l[2]) line = l;
    if (!line || !cast.denji) {
      speech.update({ text: null, opacity: 0 });
      return;
    }
    const [text, a, b] = line;
    const opacity = Math.min(segment(c, a, a + 0.18), 1 - segment(c, b - 0.15, b));
    const scale = lerp(0.9, 1, easeOutBack(segment(c, a, a + 0.25)));
    pochita.pup.localToWorld(anchor.set(0, 1.45, 0.5));
    anchor.project(camera);
    const W = overlay?.clientWidth || 1;
    const H = overlay?.clientHeight || 1;
    speech.update({ text, opacity, scale, ax: (anchor.x * 0.5 + 0.5) * W, ay: (1 - (anchor.y * 0.5 + 0.5)) * H });
  };

  // ── The frame ────────────────────────────────────────────────────────────
  const update = (time) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const t = staticMode ? STATIC_TIME : time;
    const inDream = c >= T.dream && c < T.back;
    applyMood(inDream);

    // The lid over his legs: shut, then it rattles and starts to lift.
    const lift = c >= T.back ? easeOutCubic(segment(c, ...T.lid)) : 0;
    const rattle = c >= T.back ? pulse(c, T.lid[0] - 0.25, 0.06) : 0;
    lidShut.rotation.x = -(0.3 * lift + 0.025 * rattle + (lift > 0 && lift < 1 ? Math.sin(t * 40) * 0.008 : 0));

    updateRain(t);
    if (cast.denji) {
      updateDenji(c, t);
      updatePochita(c, t);
    }
    updateDrop(c);

    shoot(c);
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.02;
    camera.position.y += pointer.y * 0.015;
    camera.lookAt(camLook);
    camera.updateMatrixWorld(true);
    updateSpeech(c);

    // The cut: a brief white flash bleeding to red, both ways out of the dream.
    const f = staticMode ? 0 : Math.max(pulse(c, T.flash, 0.05) * 0.7, pulse(c, T.flash + 0.12, 0.09) * 0.5, pulse(c, T.back, 0.06) * 0.35);
    const red = segment(c, T.flash, T.flash + 0.1);
    const black = staticMode ? 0 : Math.max(1 - segment(c, 0, 0.5), segment(c, CYCLE - 0.5, CYCLE));
    cuts.update({ flash: f, flashColor: red > 0.5 && c < T.back ? "#b0101e" : "#fff2ea", black });
    renderer.toneMappingExposure = baseExposure * (inDream ? 0.95 : 1);
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      cuts.dispose();
      speech.dispose();
      renderer.toneMappingExposure = baseExposure;
    },
  };
};
