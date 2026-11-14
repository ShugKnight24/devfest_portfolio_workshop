import * as THREE from "three";
import { DRESS, OUTFITS, createCuts, createInkWorld } from "../rezeKit";
import { canvasTexture, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, segment, settle, smoothstep, softDot } from "../kit";
import { outline } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { buildPochita } from "../pochita";
import { createDaisy, createDaisyVase } from "../props";
import { createCaption, createSfx } from "../sfx";

/**
 * Devil Hunter — how Chainsaw Man starts, for people who never saw it. A boy
 * with his dead father's debt, a hurt chainsaw devil who limps up to him after
 * the funeral, the deal they make in blood, and the job that pays: killing
 * devils. Behind "A boy, a dog, and a debt."
 *
 *   0    – 6.0   the debt: a yakuza ledger on a crate in the shack, under a
 *                bare bulb, Dad's photo in its mourning ribbon. Demand notices
 *                flutter down onto it one by one (0.4 – 3.6) and land flat; a
 *                hanko comes down and slams a red 督促 (pay up) seal onto the
 *                ledger (3.9), then onto the top notice (4.8).
 *                "Dad died. The debt didn't."
 *   6.0  – 8.6   the funeral, on a bright sunny day: a plain wooden cross in a
 *                small stone base, Denji (white tank top) in front of it, head
 *                down; the yakuza boss's small boxy sedan pulled up behind him.
 *                "The funeral was on a sunny day."
 *   8.6  – 13.0  low by the car door, up at the boss at the wheel: an old man,
 *                grey fedora, thin glasses that catch the sun, white beard,
 *                dark coat. "Even though your spineless father killed himself,
 *                you still owe us." / "I don't care what you have to do."
 *   13.0 – 16.2  low in the grass: Pochita limps out from behind the tree,
 *                bandaged and bleeding, and collapses on his side (15.6).
 *   16.2 – 19.0  past him at Denji, who comes over and kneels.
 *                "You're hurt... Are you gonna die too?"
 *   19.0 – 26.7  he thrusts his forearm out (20.65) — "If you don't wanna die,
 *                bite me!" — Pochita rolls up, rears and bites the forearm
 *                (21.7), drinks; his eyes snap open (24.1); up, wagging.
 *                "I'll save you... so you save me."
 *   26.7 – 32.2  the countryside, years on: over Denji's shoulder, crouched
 *                behind a broken concrete wall with Pochita in his arms; by the
 *                old farmhouse the Tomato Devil — a red tomato the size of a
 *                car, a leaf crown, a dozen bulging eyes, a vertical toothed
 *                slit for a mouth, on ten long human legs.
 *                "One devil nets about ¥300,000."
 *   32.2 – 37.2  closer: every eye on the devil swings round to the wall (34.6)
 *   37.2 – 40.6  Denji stands, steps out and pulls Pochita's tail (39.2):
 *                VRRRRMMM — the chain runs
 *   40.6 – 42.7  the charge, the camera running with him; the devil lunges
 *   42.7 – 44.0  the leap, the saw wound up over his head, and the chop
 *                (43.3): straight down through the slit of its mouth
 *   44.0 – 48.7  the two halves part, tip and slump down where they stood, the
 *                dead legs splay out clear of him, juice rains; dip to black
 *
 * Every move is eased and every shot change inside a set is a camera blend;
 * the sets change under a dip to black. Loops on its own clock; reduced motion
 * holds 33.2 (behind the wall, the devil looming, the caption up). Denji is the
 * Quaternius CC0 body in his white tank top and navy trousers throughout (white
 * reads against the grey wall and the red devil alike); Pochita is the shared
 * model (pochita.js), hurt and whole. The Tomato Devil, the yakuza boss and
 * his car, the sets and the paper are built here.
 */

const CYCLE = 48.7;
const STATIC_TIME = 33.2;

const T = {
  notices: [0.4, 1.0, 1.6, 2.2],
  fallFor: 1.4,
  stamp: [3.9, 4.8],
  funeral: 6.0,
  boss: 8.6,
  limp: [13.0, 15.6],
  look: [13.4, 14.0],
  collapse: [15.6, 16.2],
  walk: [16.2, 18.2],
  kneel: [18.1, 19.0],
  reach: [20.65, 21.4],
  bite: 21.7,
  wake: 24.1,
  up: [24.6, 25.3],
  back: [25.4, 26.2],
  farm: 26.7,
  wall2: 32.2,
  stare: 34.6,
  fight: 37.2,
  pull: [39.2, 39.5, 39.8, 40.3],
  run: [40.6, 42.7],
  leap: [42.7, 43.55],
  strike: 43.3,
  after: 44.0,
};

// The three sets, side by side on the lot; only the one on camera is shown.
const DEBT_X = -60;
const FUN_X = 0;
const FARM_X = 60;

// The shack: one warm bulb. The funeral: a bright, cloudless noon. The farm: a hazy afternoon.
const SHACK = { ground: "#0b0a10", lines: "#ffcf9a", accent: "#c8102e", rim: "#ffc48a", shade: "#6c5a78" };
const SUNNY = { ground: "#4c7a38", lines: "#fff7e2", accent: "#c8102e", rim: "#fff3cf", shade: "#7f93b8" };
const FARM = { ground: "#5a4a3a", lines: "#fff0d2", accent: "#d8452c", rim: "#ffe6bc", shade: "#8f7f9a" };
const LIGHTS = {
  debt: { pal: SHACK, dir: [0.1, 0.9, 0.35], key: 0.86, fog: [6, 30], sky: ["#07060a", "#3a2a22"], page: { mode: "still" } },
  funeral: { pal: SUNNY, dir: [-0.35, 0.85, 0.5], key: 1.12, fog: [30, 160], sky: ["#3d8fe0", "#d9efff"], air: "#cfe4f6", page: { mode: "still" } },
  farm: { pal: FARM, dir: [-0.55, 0.7, 0.45], key: 1.0, fog: [24, 150], sky: ["#c9bfa6", "#fff2d6"], air: "#c7c0aa", page: { mode: "still" } },
};

const BLOOD = "#8e0d14";
const S_PUP = 0.27; // Pochita, hurt, on the grass
const S_FARM = 0.2; // and in Denji's arms

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const pulse = (c, at, width = 0.08) => Math.exp(-(((c - at) / width) ** 2));
const ease = (c, a, b) => easeInOutCubic(segment(c, a, b));
const smooth = (c, a, b) => smoothstep(segment(c, a, b));
const scratchEuler = new THREE.Euler();
const qEuler = (r, out = new THREE.Quaternion()) => out.setFromEuler(scratchEuler.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0));
const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
/** Blend two angles the short way round. */
const lerpAngle = (a, b, k) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};

// ── Poses (figure.js: x < 0 swings a limb forward; +z raises the left arm) ──
// At the grave: head hung, shoulders down.
const MOURN = {
  spine: [0.06, 0, 0],
  chest: [0.05, 0, 0],
  neck: [0.18, 0, 0],
  head: [0.38, 0, 0],
  lShoulder: [0.02, 0, 0.04],
  rShoulder: [0.02, 0, -0.04],
  lElbow: [-0.12, 0, 0],
  rElbow: [-0.12, 0, 0],
};
// Walking, slow: a step cycle at phase `p`, arms swinging a little.
const WALK = (p) => {
  const s = Math.sin(p);
  const up = (x) => (x + Math.sqrt(x * x + 0.02)) / 2;
  return {
    spine: [0.08, 0, 0],
    chest: [0.04, 0, 0],
    neck: [0.1, 0, 0],
    head: [0.15, 0, 0],
    lShoulder: [0.3 * s, 0, 0.05],
    rShoulder: [-0.3 * s, 0, -0.05],
    lElbow: [-0.25, 0, 0],
    rElbow: [-0.25, 0, 0],
    lHip: [-0.38 * s - 0.05, 0, 0.04],
    lKnee: [0.15 + 0.6 * up(s), 0, 0],
    rHip: [0.38 * s - 0.05, 0, -0.04],
    rKnee: [0.15 + 0.6 * up(-s), 0, 0],
  };
};
// Down on both knees, sat back toward his heels, shins flat on the grass,
// leaning in to Pochita.
const KNEEL = {
  spine: [0.75, 0, 0],
  chest: [0.08, 0, 0],
  neck: [0.1, 0, 0],
  head: [0.2, 0, 0],
  lShoulder: [-0.25, 0, 0.12],
  lElbow: [-0.7, 0, 0],
  rShoulder: [-0.3, 0, -0.12],
  rElbow: [-0.8, 0, 0],
  lHip: [-0.85, 0, 0.1],
  lKnee: [2.42, 0, 0],
  rHip: [-0.8, 0, -0.1],
  rKnee: [2.37, 0, 0],
};
// Squatting behind the wall, peeking round its end.
const CROUCH = {
  spine: [0.55, 0, 0],
  chest: [0.05, 0, 0],
  head: [-0.42, 0, 0],
  lHip: [-1.75, 0, 0.18],
  lKnee: [2.3, 0, 0],
  rHip: [-1.55, 0, -0.18],
  rKnee: [2.05, 0, 0],
};
// Up, braced, the saw held low in front.
const STANCE = {
  spine: [0.28, 0, 0],
  chest: [0.06, 0, 0],
  head: [-0.22, 0, 0],
  lHip: [-0.45, 0, 0.22],
  lKnee: [0.7, 0, 0],
  rHip: [-0.05, 0, -0.2],
  rKnee: [0.35, 0, 0],
};
const RUN = (p) => {
  const s = Math.sin(p);
  // Smooth knee lift (no kink where the sine crosses zero).
  const up = (x) => (x + Math.sqrt(x * x + 0.04)) / 2;
  return {
    spine: [0.5, 0, 0],
    chest: [0.1, 0, 0],
    head: [-0.5, 0, 0],
    lHip: [-0.4 - 0.65 * s, 0, 0.1],
    lKnee: [0.55 + 0.75 * up(s), 0, 0],
    rHip: [-0.4 + 0.65 * s, 0, -0.1],
    rKnee: [0.55 + 0.75 * up(-s), 0, 0],
  };
};
// In the air: knees tucked, chest open, the saw wound up overhead.
const LEAP = {
  spine: [-0.05, 0, 0],
  chest: [-0.12, 0, 0],
  head: [-0.35, 0, 0],
  lHip: [-1.5, 0, 0.15],
  lKnee: [1.9, 0, 0],
  rHip: [-0.9, 0, -0.15],
  rKnee: [1.6, 0, 0],
};
// Landed out of the chop: deep lunge, folded over the saw.
const LAND = {
  spine: [0.75, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.55, 0, 0],
  lHip: [-1.45, 0, 0.2],
  lKnee: [1.75, 0, 0],
  rHip: [0.15, 0, -0.2],
  rKnee: [0.9, 0, 0],
};
const HINT = { l: v3(0.7, -0.7, -0.15).normalize(), r: v3(-0.7, -0.7, -0.15).normalize() };

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

// ── Paper: drawn once on canvases, no image requests ───────────────────────
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

/** The yakuza's ledger: ruled columns of what his father borrowed. */
const ledgerTexture = () =>
  canvasTexture(768, 540, (ctx, w, h) => {
    ctx.fillStyle = "#efe5cc";
    ctx.fillRect(0, 0, w, h);
    // Foxing and a coffee ring: it has been handled.
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(140,100,50,${0.03 + hash(i) * 0.05})`;
      ctx.beginPath();
      ctx.arc(hash(i * 3) * w, hash(i * 7) * h, 4 + hash(i * 11) * 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(120,80,40,0.35)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.78, 54, 0.4, 5.6);
    ctx.stroke();
    ctx.fillStyle = "#1d1714";
    ctx.font = `700 64px ${MINCHO}`;
    ctx.fillText("借用書", 40, 84);
    ctx.font = `400 22px ${MINCHO}`;
    ctx.fillText("返済期日 — 利息 月一割", 300, 80);
    ctx.strokeStyle = "#7a2a24";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const y = 120 + i * 44;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }
    for (const x of [150, 470]) {
      ctx.beginPath();
      ctx.moveTo(x, 110);
      ctx.lineTo(x, 120 + 8 * 44);
      ctx.stroke();
    }
    const rows = [
      ["4/02", "借入", "¥ 2,000,000"],
      ["5/18", "借入", "¥ 850,000"],
      ["7/30", "利息", "¥ 1,420,000"],
      ["9/09", "借入", "¥ 4,300,000"],
      ["11/21", "利息", "¥ 2,960,000"],
      ["1/15", "借入", "¥ 9,600,000"],
      ["3/03", "利息", "¥ 6,180,000"],
    ];
    rows.forEach(([d, kind, amt], i) => {
      const y = 152 + i * 44;
      ctx.fillStyle = "#231c18";
      ctx.font = `400 26px ${HAND}`;
      ctx.fillText(d, 52, y);
      ctx.font = `400 26px ${MINCHO}`;
      ctx.fillText(kind, 200, y);
      ctx.font = `400 30px ${HAND}`;
      ctx.fillText(amt, 520, y);
    });
    ctx.font = `700 30px ${MINCHO}`;
    ctx.fillText("合計", 52, 152 + 7 * 44 + 8);
  });

/** A demand notice: 督促状 across the top, small print, a red border. */
const noticeTexture = (seed) =>
  canvasTexture(384, 512, (ctx, w, h) => {
    ctx.fillStyle = seed % 2 ? "#f1ece0" : "#e9e2d0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a3161e";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = "#a3161e";
    ctx.font = `700 64px ${MINCHO}`;
    ctx.fillText("督促状", 92, 100);
    ctx.fillStyle = "rgba(30,25,22,0.75)";
    for (let i = 0; i < 12; i++) ctx.fillRect(44, 150 + i * 24, (w - 88) * (0.55 + hash(i + seed * 13) * 0.45), 8);
    ctx.font = `700 34px ${MINCHO}`;
    ctx.fillStyle = "#1d1714";
    ctx.fillText("至急", 44, h - 60);
  });

/** The seal: a red ring with 督促 inside, hand-stamped, ink missing in places. */
const sealTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#c8102e";
    ctx.fillStyle = "#c8102e";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 108, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `900 92px ${MINCHO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("督", w / 2, h / 2 - 44);
    ctx.fillText("促", w / 2, h / 2 + 50);
    // Where the stamp did not take.
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(hash(i * 1.7) * w, hash(i * 2.9) * h, 1 + hash(i * 4.3) * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

/** The inside of a tomato: wall, pulp, seed jelly in three lobes. */
const fleshTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = "#c3281e";
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e85a3e";
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      ctx.fillStyle = "#f2a05a";
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * c * 0.48, c + Math.sin(a) * c * 0.48, c * 0.3, c * 0.2, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6e09a";
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(c + Math.cos(a) * c * (0.36 + hash(k * 9 + i) * 0.24), c + Math.sin(a) * c * (0.36 + hash(k * 5 + i) * 0.24), 6, 3.5, a + i, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#f07a58";
    ctx.beginPath();
    ctx.arc(c, c, c * 0.18, 0, Math.PI * 2);
    ctx.fill();
  });

/** Dad's photo for the altar: a grey portrait in a black frame, the mourning ribbon across its corners. */
const portraitTexture = () =>
  canvasTexture(192, 256, (ctx, w, h) => {
    ctx.fillStyle = "#151313";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#b9b4aa");
    g.addColorStop(1, "#8d877c");
    ctx.fillStyle = g;
    ctx.fillRect(16, 16, w - 32, h - 32);
    // Head and shoulders, a man in a collar, in soft grey.
    ctx.fillStyle = "#4a4640";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.4, 34, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(30, h - 16);
    ctx.quadraticCurveTo(w / 2, h * 0.52, w - 30, h - 16);
    ctx.fill();
    ctx.fillStyle = "#d8d2c6";
    ctx.beginPath();
    ctx.moveTo(w / 2 - 14, h * 0.62);
    ctx.lineTo(w / 2, h * 0.72);
    ctx.lineTo(w / 2 + 14, h * 0.62);
    ctx.fill();
    // The black ribbon over the top corners.
    ctx.strokeStyle = "#0b0a0a";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(46, 0);
    ctx.moveTo(w - 46, 0);
    ctx.lineTo(w, 46);
    ctx.stroke();
  });

/**
 * The Tomato Devil, as the first chapter's colour spread draws it: a tomato
 * the size of a car, ribbed, with a crown of sepals and a stalk; a dozen
 * bloodshot eyeballs bulging out of the skin all over; a vertical slit of a
 * mouth down the front with a row of flat teeth along each lip; and under it
 * ten long, pale human limbs — legs ending in feet, arms in hands — knees
 * bent up and out like a spider's.
 *
 * Devil space: faces +z, feet on y = 0. The body is built in two halves
 * (`halves[0]` x < 0, `halves[1]` x > 0) cut down the slit of the mouth, so
 * the chop splits it left and right. `pose({ t, look, stare, lunge, cut })`.
 */
const R = 1.25; // body radius
const Y0 = 2.65; // body centre, at rest
const SQUASH = 0.9;
const LEGS = 10;
const LEG_LEN = 3.1;
// Where a half's centre comes to rest once it has tipped over onto its dome.
const REST_Y = R * 0.98;
// How far either side of straight ahead the dead legs splay to (radians).
const FRONT_CLEAR = 1.15;

const buildTomatoDevil = (w) => {
  const skinRed = w.ink({ tint: "#d23a28", tone: 0.98, rim: 0.6, spec: 0.8 });
  const lipRed = w.ink({ tint: "#9c2222", tone: 0.9, rim: 0.4, spec: 0.6 });
  const leaf = w.ink({ tint: "#4f8f3a", tone: 0.9, rim: 0.5 });
  const leafDark = w.ink({ tint: "#3b6e2c", tone: 0.85, rim: 0.4 });
  const pale = w.ink({ tint: "#ead1b6", tone: 0.98, rim: 0.4 });
  const eyeWhite = w.ink({ tint: "#efe4d0", tone: 0.9, rim: 0.25, spec: 0.3 });
  const irisMat = w.ink({ tint: "#b8323a", tone: 0.95, rim: 0.2 });
  const tooth = w.ink({ tint: "#efe0b4", tone: 1.0, rim: 0.2 });
  const flesh = new THREE.MeshBasicMaterial({ map: fleshTexture(), color: new THREE.Color("#e6d4c8"), side: THREE.DoubleSide });
  const add = (parent, geo, mat, line = true) => {
    const m = new THREE.Mesh(geo, mat);
    parent.add(m);
    if (line) outline(m, w.line);
    return m;
  };

  const root = new THREE.Group();
  const body = new THREE.Group(); // bob, sway and lunge; legs stay planted
  root.add(body);
  // side -1: x < 0; side +1: x > 0. Each half pivots on its own centre.
  const halves = [-1, 1].map((side) => {
    const g = new THREE.Group();
    g.userData.side = side;
    body.add(g);
    return g;
  });
  const halfOf = (x) => halves[x < 0 ? 0 : 1];

  // The skin: a sphere ribbed six ways, squashed a little, dimpled at the stalk.
  // phi from π/2 to 3π/2 is the x > 0 side (three.js: x = -cos φ sin θ).
  const skin = (side) => {
    const g = new THREE.SphereGeometry(R, 30, 40, side > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const az = Math.atan2(x, z);
      const ring = Math.sqrt(x * x + z * z) / R;
      const rib = 1 + 0.045 * Math.cos(az * 6) * ring;
      const dimple = y > 0 ? 1 - 0.18 * Math.exp(-((ring / 0.32) ** 2)) : 1;
      p.setXYZ(i, x * rib, y * SQUASH * dimple, z * rib);
    }
    g.computeVertexNormals();
    return g;
  };
  halves.forEach((h) => add(h, skin(h.userData.side), skinRed));
  // The cut faces: flat discs in the x = 0 plane, hidden inside the whole tomato.
  const capGeo = new THREE.CircleGeometry(R * 1.0, 48);
  capGeo.scale(1, SQUASH * 0.98, 1);
  halves.forEach((h) => {
    const cap = new THREE.Mesh(capGeo, flesh);
    cap.rotation.y = h.userData.side > 0 ? -Math.PI / 2 : Math.PI / 2;
    cap.position.x = h.userData.side * 0.004;
    h.add(cap);
  });

  // The crown: six sepals splayed over the top, and the stalk.
  const sepal = new THREE.ConeGeometry(0.2, 1.05, 5);
  sepal.translate(0, 0.525, 0);
  sepal.scale(1, 1, 0.28);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const s = new THREE.Group();
    s.position.set(0, R * 0.8, 0);
    s.rotation.set(0, a, 0);
    halfOf(Math.sin(a)).add(s);
    const m = add(s, sepal, i % 2 ? leaf : leafDark);
    m.rotation.set(1.25 + hash(i) * 0.25, 0, 0);
    m.scale.setScalar(0.85 + hash(i * 3) * 0.35);
  }
  const stalk = add(halves[1], new THREE.CylinderGeometry(0.07, 0.1, 0.5, 8), leaf);
  stalk.position.set(0.08, R * 0.98, 0);
  stalk.rotation.z = -0.3;

  // The mouth: a vertical slit down the front, one lip and its teeth per half.
  const MOUTH_H = R * 0.62;
  const mouths = halves.map((h) => {
    const side = h.userData.side;
    const g = new THREE.Group();
    g.position.set(0, 0, R * 0.9);
    h.add(g);
    const phi0 = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const lips = add(g, new THREE.SphereGeometry(1, 12, 20, phi0, Math.PI), lipRed);
    lips.scale.set(0.2, MOUTH_H, 0.16);
    const cavity = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 16, phi0, Math.PI), w.flat);
    cavity.scale.set(0.085, MOUTH_H * 0.94, 0.12);
    cavity.position.z = 0.07;
    g.add(cavity);
    // Flat teeth along the lip, tallest at the middle of the slit.
    const N = 16;
    const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), tooth, N);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const y = (u * 2 - 1) * MOUTH_H * 0.86;
      const along = Math.sqrt(Math.max(0, 1 - (y / MOUTH_H) ** 2));
      m4.compose(v3(side * 0.05 * along, y, 0.15 * along + 0.02), q.identity(), v3(0.05 * along + 0.01, MOUTH_H * 0.095, 0.03));
      teeth.setMatrixAt(i, m4);
    }
    g.add(teeth);
    outline(teeth, w.line);
    return { g, cavity, lips };
  });

  // Eyes: bulging out of the skin all over, the front ones biggest. [azimuth, elevation, radius]
  const EYES = [
    [-0.52, 0.42, 0.3], [0.58, 0.4, 0.27], [-0.42, -0.3, 0.32], [0.5, -0.36, 0.25],
    [-0.98, 0.04, 0.24], [1.0, 0.12, 0.26], [-0.22, 0.86, 0.2], [0.3, 0.9, 0.18],
    [-1.35, 0.56, 0.2], [1.3, -0.42, 0.22], [-0.8, -0.66, 0.22], [0.86, 0.78, 0.19],
    [-1.62, -0.22, 0.2], [1.66, 0.34, 0.2], [0.16, -1.0, 0.16],
  ];
  const whiteGeo = new THREE.SphereGeometry(1, 24, 16);
  const irisGeo = new THREE.SphereGeometry(1, 20, 12);
  const eyes = EYES.map(([az, el, r], i) => {
    const n = v3(Math.sin(az) * Math.cos(el), Math.sin(el) * 0.9, Math.cos(az) * Math.cos(el)).normalize();
    const eye = new THREE.Group();
    eye.position.copy(n).multiplyScalar(R + r * 0.25);
    eye.position.y *= 0.92;
    halfOf(az).add(eye);
    const white = add(eye, whiteGeo, eyeWhite);
    white.scale.setScalar(r);
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.scale.set(r * 0.55, r * 0.55, r * 0.3);
    iris.position.z = r * 0.82;
    eye.add(iris);
    const pupil = new THREE.Mesh(irisGeo, w.flat);
    pupil.scale.set(r * 0.28, r * 0.28, r * 0.2);
    pupil.position.z = r * 0.98;
    eye.add(pupil);
    // A green fleck of sepal at the rim of some, as the spread draws them.
    if (hash(i * 5.1) > 0.55) {
      const fleck = add(eye, sepal, leaf);
      fleck.scale.setScalar(r * 0.32);
      fleck.position.set(r * 0.6, r * 0.65, 0);
      fleck.rotation.set(0.5, 0, -0.7);
    }
    return { eye, normal: n, pupil, r, phase: hash(i * 7.7) * Math.PI * 2 };
  });

  // Limbs: thigh, knee, shin, and a foot or a hand on the ground.
  const thighGeo = new THREE.CylinderGeometry(0.075, 0.105, 1, 10);
  const shinGeo = new THREE.CylinderGeometry(0.05, 0.075, 1, 10);
  const kneeGeo = new THREE.SphereGeometry(0.085, 12, 8);
  const footGeo = new THREE.SphereGeometry(1, 14, 10);
  const fingerGeo = new THREE.CapsuleGeometry(0.022, 0.13, 3, 6);
  fingerGeo.rotateX(Math.PI / 2);
  fingerGeo.translate(0, 0, 0.08);
  const legs = Array.from({ length: LEGS }, (_, i) => {
    const a = (i / LEGS) * Math.PI * 2 + 0.31;
    const hip = v3(Math.sin(a) * R * 0.5, -R * 0.7, Math.cos(a) * R * 0.5);
    const foot = v3(Math.sin(a + 0.12) * R * 1.75, 0, Math.cos(a + 0.12) * R * 1.75);
    const thigh = add(root, thighGeo, pale);
    const shin = add(root, shinGeo, pale);
    const knee = add(root, kneeGeo, pale);
    const end = new THREE.Group();
    root.add(end);
    const isHand = i % 2 === 1;
    const sole = add(end, footGeo, pale);
    if (isHand) {
      sole.scale.set(0.09, 0.035, 0.1);
      sole.position.set(0, 0.03, 0.04);
      for (let f = 0; f < 4; f++) {
        const fing = add(end, fingerGeo, pale);
        fing.position.set(-0.06 + f * 0.04, 0.025, 0.1);
        fing.rotation.y = (f - 1.5) * 0.18;
      }
      const thumb = add(end, fingerGeo, pale);
      thumb.position.set(0.08, 0.025, 0.02);
      thumb.rotation.y = 1.0;
    } else {
      sole.scale.set(0.08, 0.05, 0.16);
      sole.position.set(0, 0.04, 0.06);
    }
    return { hip, foot, half: halfOf(hip.x), thigh, shin, knee, end, phase: hash(i * 3.3) * Math.PI * 2 };
  });

  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const hipW = new THREE.Vector3();
  const footW = new THREE.Vector3();
  const kneeW = new THREE.Vector3();
  const out = new THREE.Vector3();
  const kd = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  const place = (mesh, a, b) => {
    mesh.position.lerpVectors(a, b, 0.5);
    tmpA.subVectors(a, b);
    const len = tmpA.length();
    mesh.quaternion.setFromUnitVectors(Y, tmpA.divideScalar(len || 1));
    mesh.scale.set(1, len, 1);
  };
  const lookW = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();

  /**
   * How the halves come apart, `cut` seconds after the chop: a beat where the
   * seam opens, then each tips outward about its own centre while the legs
   * give, and they come to rest on their domes where they stood — no roll.
   */
  const fallOf = (cut) => {
    if (cut <= 0) return { part: 0, tip: 0, drop: 0, splay: 0 };
    const part = easeOutCubic(segment(cut, 0, 0.45));
    const g = easeInCubic(segment(cut, 0.3, 1.15)); // gravity
    const bounce = cut > 1.15 ? settle(cut - 1.15, 2) * 0.12 : 0;
    const tip = 0.12 * part + 1.18 * g - bounce * 0.6;
    const drop = g + (cut > 1.15 ? -bounce * 0.08 : 0);
    const splay = easeOutCubic(segment(cut, 0.25, 1.3));
    return { part, tip, drop, splay };
  };

  /**
   * t: time (gait, idle); look: world point the eyes turn to, `stare` 0..1 how
   * far; lunge 0..1 (leans at the camera, mouth open); cut: seconds since the
   * strike (< 0 before it).
   */
  const pose = ({ t, look, stare = 0, lunge = 0, cut = -1 }) => {
    const f = fallOf(cut);
    const alive = 1 - f.splay;
    // The body: a slow bob and sway on its legs; the lunge leans it forward;
    // cut, it comes down to where the halves rest.
    const bobY = Y0 + Math.sin(t * 1.7) * 0.06 * alive;
    body.position.set(Math.sin(t * 0.9) * 0.08 * alive, lerp(bobY, REST_Y, f.drop), lunge * 0.35);
    body.rotation.set(lunge * 0.22 * (1 - f.drop), Math.sin(t * 0.5) * 0.12 * alive, Math.sin(t * 0.9 + 1) * 0.05 * alive);
    // The mouth opens on the lunge, and gapes once cut.
    const open = Math.max(lunge, 0.7 * smoothstep(segment(cut, 0, 0.3))) * 0.9 + Math.sin(t * 2.3) * 0.05 * alive;
    for (const m of mouths) {
      m.lips.scale.x = 0.2 + open * 0.12;
      m.cavity.scale.x = 0.085 + open * 0.13;
    }
    // The halves: apart along the cut, tipped outward, down onto their domes.
    for (const h of halves) {
      const s = h.userData.side;
      h.position.set(s * (0.06 * f.part + 0.3 * f.splay), 0, 0);
      h.rotation.set(0, 0, -s * f.tip);
    }
    root.updateMatrixWorld(true);

    // Eyes: each wanders on its own, until they all lock on to `look`; cut,
    // the pupils shrink to pins and the eyes roll.
    const shock = lerp(1, 0.45, smoothstep(segment(cut, 0, 0.3)));
    for (const e of eyes) {
      e.eye.getWorldPosition(tmpB);
      lookW.copy(e.normal).applyQuaternion(e.eye.parent.getWorldQuaternion(tmpQ)).multiplyScalar(3).add(tmpB);
      lookW.x += Math.sin(t * 0.7 + e.phase) * 1.4;
      lookW.y += Math.sin(t * 0.55 + e.phase * 2) * 1.0;
      if (look) lookW.lerp(look, stare * alive);
      e.eye.lookAt(lookW);
      e.pupil.scale.set(e.r * 0.28 * shock, e.r * 0.28 * shock, e.r * 0.2);
    }

    // Legs: planted feet that lift in turn; the knee wherever a fixed-length
    // leg puts it, bowed up and out. Cut, the feet slide out until the legs lie
    // nearly flat, and they twitch.
    for (const L of legs) {
      hipW.copy(L.hip).applyMatrix4(L.half.matrixWorld);
      root.worldToLocal(hipW);
      const lift = Math.max(0, Math.sin(t * 2.2 + L.phase)) ** 3 * 0.18 * alive;
      footW.copy(L.foot);
      // Spread far enough that a near-straight leg reaches from the fallen hip.
      const flatR = Math.sqrt(Math.max(0, (LEG_LEN * 0.97) ** 2 - Math.max(0.05, hipW.y) ** 2));
      const baseR = Math.hypot(L.foot.x, L.foot.z);
      const r = lerp(baseR, Math.max(baseR, flatR * 0.98 + Math.hypot(hipW.x, hipW.z) * 0.3), f.splay);
      footW.multiplyScalar(r / baseR);
      // Dead, the legs fall clear of the front, where Denji stands.
      const az0 = Math.atan2(L.foot.x, L.foot.z);
      if (Math.abs(az0) < FRONT_CLEAR && f.splay > 0) {
        const az = lerp(az0, Math.sign(az0 || 1) * FRONT_CLEAR, f.splay);
        const rr = Math.hypot(footW.x, footW.z);
        footW.set(Math.sin(az) * rr, 0, Math.cos(az) * rr);
      }
      const twitch = f.splay > 0 ? Math.sin(t * 19 + L.phase * 3) * 0.04 * Math.exp(-Math.max(0, cut - 1.2) * 1.4) * f.splay : 0;
      footW.y = lift + Math.max(0, twitch);
      footW.z += lunge * 0.15;
      kd.subVectors(hipW, footW);
      const d = kd.length();
      kd.divideScalar(d || 1);
      out.set(footW.x, 0, footW.z).normalize().multiplyScalar(0.55).add(tmpA.set(0, 0.85, 0));
      out.addScaledVector(kd, -out.dot(kd)).normalize();
      const reach = Math.sqrt(Math.max(0.0004, (LEG_LEN / 2) ** 2 - (d / 2) ** 2));
      kneeW.lerpVectors(hipW, footW, 0.5).addScaledVector(out, reach);
      place(L.thigh, hipW, kneeW);
      place(L.shin, kneeW, footW);
      L.knee.position.copy(kneeW);
      L.end.position.copy(footW);
      L.end.rotation.set(0, Math.atan2(L.foot.x, L.foot.z), 0);
    }
  };
  return { root, body, halves, pose, fallOf };
};

export const createDevilHunterScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  const cuts = createCuts(overlay);
  const caption = createCaption(overlay, { x: 5, y: 6 });
  const vroom = createSfx(overlay, { text: "VRRRRMMM!!", crescendo: 0.8 });
  let disposed = false;
  const dot = softDot();

  const add = (mesh, parent, line = false) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  const slab = (x0, x1, y0, y1, z0, z1, mat, parent, line = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, line);
  };
  const softShadow = (wd, dp, x, y, z, o, parent) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, dp), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: o, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const instanced = (geo, mat, list, parent, line = true) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    list.forEach(([x, y, z, s, ry = 0, sy = s], i) => mesh.setMatrixAt(i, m4.compose(v3(x, y, z), q.setFromEuler(new THREE.Euler(0, ry, 0)), v3(s, sy, s))));
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    crate: w.ink({ tint: "#7a5a3e", tone: 0.85, rim: 0.3 }),
    crateDark: w.ink({ tint: "#5c432e", tone: 0.8, rim: 0.2 }),
    floor: w.ink({ tint: "#3e3026", tone: 0.7, rim: 0.1 }),
    tin: w.ink({ tint: "#5b5852", tone: 0.7, rim: 0.2 }),
    coin: w.ink({ tint: "#c9b27a", tone: 1.0, rim: 0.6, spec: 0.9 }),
    cord: w.ink({ tint: "#1e1a18", tone: 0.5, rim: 0.2 }),
    hankoWood: w.ink({ tint: "#6b3f22", tone: 0.9, rim: 0.5, spec: 0.6 }),
    hankoFace: w.ink({ tint: "#b3121e", tone: 0.9, rim: 0.3 }),
    blood: w.ink({ tint: BLOOD, tone: 0.8, rim: 0.4, spec: 0.9 }),
    lawn: w.ink({ tint: "#6f9e48", tone: 0.95, rim: 0.2 }),
    lawnDark: w.ink({ tint: "#56853a", tone: 0.9, rim: 0.3 }),
    granite: w.ink({ tint: "#8d8f90", tone: 0.95, rim: 0.5, spec: 0.7 }),
    graniteDark: w.ink({ tint: "#6c6e70", tone: 0.9, rim: 0.4, spec: 0.5 }),
    gravel: w.ink({ tint: "#c9c3b4", tone: 0.95, rim: 0.2 }),
    sotoba: w.ink({ tint: "#d8c49a", tone: 0.95, rim: 0.3 }),
    bark: w.ink({ tint: "#5e4632", tone: 0.85, rim: 0.4 }),
    canopy: w.ink({ tint: "#4f8a3c", tone: 0.92, rim: 0.4 }),
    canopyDark: w.ink({ tint: "#3d7030", tone: 0.88, rim: 0.4 }),
    carPaint: w.ink({ tint: "#2f3542", tone: 0.8, rim: 0.35, spec: 0.6 }),
    carGlass: w.ink({ tint: "#55697a", tone: 0.75, rim: 0.4, spec: 0.8 }),
    carInside: w.ink({ tint: "#1c1a1c", tone: 0.5, rim: 0.1 }),
    chrome: w.ink({ tint: "#b9bcc0", tone: 1.0, rim: 0.6, spec: 1 }),
    lamp: w.ink({ tint: "#f4eed8", tone: 1.0, rim: 0.3 }),
    tyre: w.ink({ tint: "#1d1c1e", tone: 0.55, rim: 0.3 }),
    glassesRim: w.ink({ tint: "#141416", tone: 0.5, rim: 0.2 }),
    lens: new THREE.MeshBasicMaterial({ color: "#2a2d33", transparent: true, opacity: 0.82 }),
    tailLamp: w.ink({ tint: "#b3202a", tone: 0.95, rim: 0.3 }),
    fedora: w.ink({ tint: "#8a8a8c", tone: 0.9, rim: 0.5 }),
    hatBand: w.ink({ tint: "#141416", tone: 0.5, rim: 0.3 }),
    bandage: w.ink({ tint: "#e2dccd", tone: 0.85, rim: 0.1 }),
    dirt: w.ink({ tint: "#b08c62", tone: 0.92, rim: 0.1 }),
    grass: w.ink({ tint: "#6f8a46", tone: 0.88, rim: 0.3 }),
    stone: w.ink({ tint: "#8d877a", tone: 0.85, rim: 0.3 }),
    concrete: w.ink({ tint: "#77786f", tone: 0.85, rim: 0.3 }),
    moss: w.ink({ tint: "#66704e", tone: 0.8, rim: 0.2 }),
    rebar: w.ink({ tint: "#5a3a2a", tone: 0.7, rim: 0.3 }),
    wood: w.ink({ tint: "#7a5236", tone: 0.85, rim: 0.3 }),
    woodDark: w.ink({ tint: "#55392a", tone: 0.8, rim: 0.3 }),
    shoji: w.ink({ tint: "#efe6d0", tone: 0.95, rim: 0.2 }),
    roof: w.ink({ tint: "#4e5560", tone: 0.8, rim: 0.4, spec: 0.4 }),
    tree: w.ink({ tint: "#4f6a3a", tone: 0.85, rim: 0.3 }),
    treeDark: w.ink({ tint: "#3e5530", tone: 0.8, rim: 0.3 }),
    hill: w.ink({ tint: "#7d7a8e", tone: 0.9, rim: 0.1 }),
    juice: w.ink({ tint: "#c8241c", tone: 0.95, rim: 0.4, spec: 0.8 }),
  };

  // ── 1. The debt: a crate in the shack, the ledger, the notices ───────────
  const debt = new THREE.Group();
  debt.position.x = DEBT_X;
  scene.add(debt);
  const CRATE_TOP = 0.46;
  {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), M.floor);
    floor.rotation.x = -Math.PI / 2;
    debt.add(floor);
    for (let i = 0; i < 4; i++) slab(-0.36, 0.36, i * 0.115, i * 0.115 + 0.105, -0.28, 0.28, i % 2 ? M.crate : M.crateDark, debt, true);
    slab(-0.38, 0.38, CRATE_TOP - 0.02, CRATE_TOP, -0.3, 0.3, M.crate, debt, true);
    // The back wall: corrugated tin, just a dark band behind.
    slab(-3, 3, 0, 2.4, -1.2, -1.15, M.tin, debt);
    softShadow(1.4, 1.1, 0, 0.004, 0, 0.6, debt);
  }
  // Paper: a printed face, and a plain back so nothing shows through from under it.
  const paperMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color("#d9c7a8") });
  const paperBack = new THREE.MeshBasicMaterial({ color: new THREE.Color("#b7a689") });
  const sheet = (wd, ht, front) => {
    const g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(wd, ht), front);
    const back = new THREE.Mesh(face.geometry, paperBack);
    back.rotation.y = Math.PI;
    g.add(face, back);
    g.userData.face = face;
    return g;
  };
  const ledger = sheet(0.5, 0.35, paperMat(ledgerTexture()));
  ledger.rotation.set(-Math.PI / 2, 0, 0.08);
  ledger.position.set(-0.04, CRATE_TOP + 0.003, 0.02);
  debt.add(ledger);
  const noticeTex = [noticeTexture(1), noticeTexture(2)];
  const noticeMats = noticeTex.map(paperMat);
  // Two already on the crate; four flutter down onto the pile, clear of the
  // ledger's figures so its seal stays in view.
  const NOTICES = [
    { at: [-0.25, -0.16], rot: 0.5, y: 0.006, tex: 1, fall: null },
    { at: [0.27, -0.14], rot: -0.35, y: 0.008, tex: 0, fall: null },
    { at: [-0.24, 0.13], rot: -0.6, y: 0.012, tex: 0, fall: T.notices[0], from: [-0.35, 0.1] },
    { at: [0.06, -0.17], rot: 0.9, y: 0.016, tex: 1, fall: T.notices[1], from: [0.3, -0.2] },
    { at: [-0.06, -0.06], rot: -0.25, y: 0.02, tex: 1, fall: T.notices[2], from: [-0.2, -0.3] },
    { at: [0.28, 0.12], rot: 0.22, y: 0.024, tex: 0, fall: T.notices[3], from: [0.15, 0.25] },
  ].map((n) => {
    const m = sheet(0.18, 0.24, noticeMats[n.tex]);
    debt.add(m);
    return { ...n, m };
  });
  // The seals: printed onto the face of the sheet they are stamped on, so they
  // move with it and never show through from underneath.
  const sealTex = sealTexture();
  const seals = [
    { on: ledger, at: [0.11, -0.07], size: 0.12, t: T.stamp[0], spin: 0.15 },
    { on: NOTICES[5].m, at: [0.0, 0.01], size: 0.1, t: T.stamp[1], spin: -0.3 },
  ].map((s) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: sealTex, transparent: true, depthWrite: false, opacity: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    m.position.set(s.at[0], s.at[1], 0.0008);
    m.rotation.z = s.spin;
    m.renderOrder = 2;
    s.on.userData.face.add(m);
    return { ...s, m, world: new THREE.Vector3() };
  });
  // The hanko that stamps them: a turned wooden handle, the red seal face.
  const hanko = new THREE.Group();
  {
    const shaft = add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.11, 20), M.hankoWood), hanko, true);
    shaft.position.y = 0.075;
    const knob = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 18, 12), M.hankoWood), hanko, true);
    knob.position.y = 0.14;
    const face = add(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 24), M.hankoFace), hanko, true);
    face.position.y = 0.01;
  }
  debt.add(hanko);
  // Coins, the last of what he has.
  instanced(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 16), M.coin, [
    [0.3, CRATE_TOP + 0.003, -0.24, 1], [0.32, CRATE_TOP + 0.007, -0.23, 1], [0.27, CRATE_TOP + 0.003, -0.2, 1],
  ], debt, false);
  // Dad's photo, propped at the back of the crate in its mourning ribbon.
  {
    const frame = new THREE.Group();
    frame.position.set(-0.24, CRATE_TOP, -0.25);
    frame.rotation.set(-0.22, 0.25, 0);
    debt.add(frame);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), new THREE.MeshBasicMaterial({ map: portraitTexture(), color: new THREE.Color("#cfc6b6") }));
    photo.position.set(0, 0.085, 0.006);
    frame.add(photo);
    slab(-0.068, 0.068, 0, 0.17, -0.004, 0.004, M.cord, frame, true);
  }
  // The bulb on its flex, and its warm pool.
  {
    const flex = slab(-0.004, 0.004, 1.15, 2.4, -0.004, 0.004, M.cord, debt);
    flex.position.x = 0.05;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd49a").multiplyScalar(1.5) }));
    bulb.position.set(0.05, 1.1, 0);
    debt.add(bulb);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ color: "#ffb06a", map: dot, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, CRATE_TOP + 0.035, 0);
    debt.add(pool);
  }

  // ── 2. The funeral: a cemetery at noon, cloudless ────────────────────────
  const funeral = new THREE.Group();
  funeral.position.x = FUN_X;
  scene.add(funeral);
  const UX = (x) => FUN_X + x;
  // Dad's grave, Denji in front of it, the yakuza's car pulled up behind him.
  const GRAVE_AT = v3(UX(0), 0, -1.4);
  const STAND_AT = v3(UX(0.05), 0, -0.3);
  const CAR_AT = v3(UX(1.55), 0, 1.05);
  const TREE_AT = v3(UX(-2.5), 0, -0.95);
  // Where Denji kneels by Pochita, and where Pochita lies: in the grass beside
  // the tree, the two of them in profile to the lens so both faces and the
  // arm between them read.
  const KNEEL_AT = v3(UX(-1.1), 0, -0.5);
  const POCHITA_LIE = KNEEL_AT.clone().add(v3(-0.52, 0, 0.08));
  const POCHITA_FACE = yawTo(POCHITA_LIE, KNEEL_AT) - 0.3;
  // Out from behind the trunk, limping, to where he drops.
  const LIMP_PATH = new THREE.CatmullRomCurve3([v3(UX(-2.85), 0, -1.3), v3(UX(-2.5), 0, -0.6), v3(UX(-2.0), 0, -0.38), POCHITA_LIE.clone()]);
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), M.lawn);
    ground.rotation.x = -Math.PI / 2;
    funeral.add(ground);
    // Grass in tufts, kept off the ground he walks and kneels on.
    const tufts = [];
    for (let i = 0; tufts.length < 220 && i < 900; i++) {
      const x = (hash(i * 1.37) - 0.5) * 16;
      const z = 3.5 - hash(i * 2.91) * 16;
      if (x > -2.0 && x < 2.8 && z > -1.2 && z < 1.6) continue;
      tufts.push([x, 0.05, z, 0.5 + hash(i * 4.3) * 0.9, hash(i) * 3]);
    }
    instanced(new THREE.ConeGeometry(0.035, 0.14, 4), M.lawnDark, tufts, funeral, false);

    // Dad's grave: all Denji could manage — a plain wooden cross in a small
    // stone base, a low mound of fresh dirt, a few flowers.
    const grave = new THREE.Group();
    grave.position.copy(GRAVE_AT).sub(funeral.position);
    funeral.add(grave);
    slab(-0.2, 0.2, 0, 0.16, -0.15, 0.15, M.granite, grave, true);
    slab(-0.15, 0.15, 0.16, 0.22, -0.11, 0.11, M.graniteDark, grave, true);
    slab(-0.035, 0.035, 0.2, 1.08, -0.03, 0.03, M.sotoba, grave, true);
    slab(-0.24, 0.24, 0.76, 0.83, -0.028, 0.028, M.sotoba, grave, true);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.dirt);
    mound.scale.set(0.34, 0.07, 0.42);
    mound.position.set(0, 0, 0.5);
    add(mound, grave, true);
    for (let i = 0; i < 4; i++) {
      const d = createDaisy({ stemLength: 0.22, size: 0.05, ink: w.ink, line: w.line, seed: i + 4, palette: { petal: i % 2 ? "#fbf8ef" : "#f6d24a", centre: i % 2 ? "#f0b72a" : "#c86a1a" } });
      d.rotation.set(-Math.PI / 2 + 0.05, 0, (i - 1.5) * 0.3 + Math.PI);
      d.position.set(-0.1 + i * 0.065, 0.012, 0.24);
      grave.add(d);
    }
    softShadow(1.0, 0.8, 0, 0.004, 0.05, 0.3, grave);

    // Other graves in rows behind, older and greyer.
    const stones = [];
    const caps = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = -5.6 + i * 1.5 + (row % 2) * 0.6 + (hash(i + row * 9) - 0.5) * 0.3;
        const z = -3.6 - row * 1.9;
        if (Math.abs(x - TREE_AT.x) < 1.0 && row === 0) continue;
        const h = 0.75 + hash(i * 3 + row) * 0.45;
        stones.push([x, h / 2 + 0.3, z, 0.34, 0, h]);
        caps.push([x, 0.15, z, 0.9, 0, 0.3]);
      }
    }
    instanced(new THREE.BoxGeometry(1, 1, 0.8), M.granite, stones, funeral, true);
    instanced(new THREE.BoxGeometry(1, 1, 0.8), M.graniteDark, caps, funeral, true);
    // A clipped hedge round the plot, the hills beyond.
    slab(-9, 9, 0, 0.7, -9.8, -9.2, M.canopyDark, funeral, true);
    for (const [x, z, r, h] of [[-30, -90, 46, 22], [30, -110, 60, 30], [-80, -120, 50, 26], [75, -100, 40, 18]]) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), M.hill);
      m.position.set(x, h / 2 - 1, z);
      m.rotation.y = hash(x) * 3;
      funeral.add(m);
    }

    // The tree: a thick old trunk and a full crown, its shade on the grass.
    const tree = new THREE.Group();
    tree.position.copy(TREE_AT).sub(funeral.position);
    funeral.add(tree);
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 2.6, 14);
    const trunk = add(new THREE.Mesh(trunkGeo, M.bark), tree, true);
    trunk.position.y = 1.3;
    for (const [x, y, z, a] of [[0.4, 2.3, 0, -0.8], [-0.35, 2.5, 0.1, 0.7]]) {
      const bough = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.0, 10), M.bark), tree, true);
      bough.position.set(x, y, z);
      bough.rotation.z = a;
    }
    // Roots splayed at the foot.
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const root = add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 6), M.bark), tree, true);
      root.position.set(Math.sin(a) * 0.3, 0.06, Math.cos(a) * 0.3);
      root.rotation.set(Math.cos(a) * 1.35, 0, -Math.sin(a) * 1.35);
    }
    instanced(new THREE.IcosahedronGeometry(1, 1), M.canopy, [[0, 3.4, 0, 1.4], [0.9, 3.0, 0.3, 1.0], [-0.95, 3.1, -0.2, 1.1], [0.2, 3.0, -0.9, 1.0], [-0.2, 4.1, 0.1, 0.9]], tree, true);
    instanced(new THREE.IcosahedronGeometry(1, 1), M.canopyDark, [[0.4, 3.6, 0.8, 0.9], [-0.6, 3.7, 0.7, 0.8]], tree, true);
    softShadow(4.4, 3.2, 0.5, 0.004, 0.5, 0.32, tree);
    // Background trees along the hedge.
    const far = [];
    for (let i = 0; i < 14; i++) far.push([-16 + i * 2.5 + hash(i) * 1.2, 1.8 + hash(i * 4.1) * 1.4, -12 - hash(i * 2.3) * 5, 1.6 + hash(i * 6.1) * 1.2, hash(i) * 3]);
    instanced(new THREE.IcosahedronGeometry(1, 1), M.canopy, far, funeral, true);
  }

  // The yakuza's car: a small boxy 80s sedan, three boxes — bonnet, cabin,
  // a short boot — dark paint, chrome bumpers, square headlamps, pulled up on
  // the grass behind him with the driver's window down. Long axis along z
  // (nose to +z); the driver's side (x < 0) toward Denji.
  const car = new THREE.Group();
  car.position.copy(CAR_AT).sub(funeral.position);
  car.rotation.y = 0.12;
  funeral.add(car);
  const CAR = { w: 0.74, len: 1.95, belt: 0.86, roof: 1.42, cabF: 0.42, cabB: -0.95, bonnet: 0.8, boot: 0.84 };
  /** A box from point a to point b (car space), `w` by `d` across. */
  const strut = (a, b, wd, dp, mat, line = true) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, dp), mat);
    m.position.lerpVectors(a, b, 0.5);
    m.quaternion.setFromUnitVectors(v3(0, 1, 0), tmpV.subVectors(b, a).normalize());
    return add(m, car, line);
  };
  const tmpV = new THREE.Vector3();
  {
    const { w: W, len: L, belt, roof, cabF, cabB } = CAR;
    const paint = M.carPaint;
    // The lower body, the bonnet stepped down in front, the boot behind.
    slab(-W, W, 0.24, 0.62, -L, L, paint, car, true);
    // Sills down between the wheels and a closed floor and firewall, so
    // nothing of the driver shows under or through the car.
    slab(-W + 0.01, W - 0.01, 0.03, 0.25, -0.92, 0.92, M.carInside, car, true);
    slab(-W + 0.03, W - 0.03, 0.2, 0.86, 0.55, 0.62, M.carInside, car);
    slab(-W, W, 0.62, CAR.bonnet, cabF + 0.32, L - 0.02, paint, car, true);
    slab(-W, W, 0.62, belt, cabB - 0.25, cabF + 0.32, paint, car, true);
    slab(-W, W, 0.62, CAR.boot, -L + 0.02, cabB - 0.25, paint, car, true);
    // The cabin: roof, raked windscreen and back light, square pillars.
    slab(-W + 0.06, W - 0.06, roof, roof + 0.05, cabB, cabF, paint, car, true);
    for (const s of [-1, 1]) {
      const x = s * (W - 0.05);
      strut(v3(x, CAR.bonnet, cabF + 0.32), v3(x, roof, cabF), 0.06, 0.06, paint); // A
      strut(v3(x, belt, -0.12), v3(x, roof, -0.12), 0.06, 0.07, paint); // B
      strut(v3(x, CAR.boot, cabB - 0.25), v3(x, roof, cabB), 0.07, 0.1, paint); // C
    }
    const glass = M.carGlass;
    const pane = (a, b, wd) => strut(a, b, wd, 0.012, glass, false);
    pane(v3(0, CAR.bonnet + 0.01, cabF + 0.3), v3(0, roof - 0.01, cabF + 0.01), 2 * W - 0.14); // windscreen
    pane(v3(0, CAR.boot + 0.01, cabB - 0.23), v3(0, roof - 0.01, cabB + 0.01), 2 * W - 0.16); // back light
    slab(W - 0.06, W - 0.045, belt, roof, cabB, cabF + 0.1, glass, car); // far side
    slab(-W + 0.045, -W + 0.06, belt, roof, cabB, -0.15, glass, car); // rear door, near side
    // A dark interior, the seat back, the wheel.
    slab(-W + 0.08, W - 0.08, 0.3, 0.62, cabB, cabF + 0.3, M.carInside, car);
    slab(-0.62, -0.06, 0.4, 1.12, -0.42, -0.3, M.carInside, car);
    const wheel = add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 24), M.tyre), car, false);
    wheel.position.set(-0.36, 1.0, 0.42);
    wheel.rotation.x = -0.45;
    // Chrome bumpers, a grille, square headlamps and tail lamps, a plate.
    slab(-W - 0.02, W + 0.02, 0.24, 0.36, L, L + 0.08, M.chrome, car, true);
    slab(-W - 0.02, W + 0.02, 0.24, 0.36, -L - 0.08, -L, M.chrome, car, true);
    slab(-0.32, 0.32, 0.5, 0.72, L, L + 0.015, M.carInside, car);
    for (const s of [-1, 1]) {
      slab(s * 0.62 - 0.11, s * 0.62 + 0.11, 0.5, 0.7, L, L + 0.02, M.lamp, car);
      slab(s * 0.6 - 0.12, s * 0.6 + 0.12, 0.56, 0.72, -L - 0.02, -L, M.tailLamp, car);
    }
    slab(-0.16, 0.16, 0.38, 0.47, -L - 0.03, -L - 0.02, M.lamp, car);
    // A side trim line and the door shut lines.
    for (const s of [-1, 1]) slab(s * W - 0.006, s * W + 0.006, 0.5, 0.53, -L + 0.1, L - 0.1, M.chrome, car);
    // Wheels in their arches.
    const wheelGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.18, 22);
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.19, 16);
    hubGeo.rotateZ(Math.PI / 2);
    for (const x of [-W + 0.07, W - 0.07]) {
      for (const z of [-1.2, 1.2]) {
        add(new THREE.Mesh(wheelGeo, M.tyre), car, true).position.set(x, 0.27, z);
        add(new THREE.Mesh(hubGeo, M.chrome), car, false).position.set(x, 0.27, z);
      }
    }
    softShadow(2.0, 4.4, 0, 0.004, 0, 0.45, car);
  }

  // The boss at the wheel: the deck's human figure as an old man — white side
  // hair and a beard close to the jaw, a dark coat with its collar up — with a
  // grey fedora (black band), thin rectangular glasses that catch the sun,
  // built here and riding his head bone. Seated, turned out of the window
  // toward Denji, chin down so his eyes sit in the shade of the brim.
  const BOSS_SEAT = v3(-0.36, 0.42, 0.06);
  const BOSS_LOOK = {
    ...OUTFITS.denji,
    skin: "#d6ab86", top: "#25262c", sleeves: "long", bottom: "#202126", shoes: "#141416", sole: "#141416", hair: "#d9d6cf", brows: "#bdb8ae",
    iris: "#2a1d16", pupil: "#0b0807", tie: null, belt: null, panel: null, trim: null, tired: true,
  };
  const SEATED = {
    spine: [-0.08, -0.22, 0],
    chest: [0.02, -0.12, 0],
    neck: [0.12, -0.45, 0],
    head: [0.22, -0.62, 0.04],
    lHip: [-1.55, 0, 0.06],
    lKnee: [2.1, 0, 0],
    rHip: [-1.55, 0, -0.06],
    rKnee: [2.1, 0, 0],
    // Left hand on the wheel; right hand on his knee.
    lShoulder: [-0.95, 0, 0.15],
    lElbow: [-0.7, 0, 0],
    rShoulder: [-0.4, 0, -0.12],
    rElbow: [-0.95, 0, 0],
  };
  const bossFace = new THREE.Group(); // head centre, +z out of the face
  const bossHeadW = new THREE.Vector3();
  const glints = [];
  const bossReady = createModelFigure({
    height: 1.7,
    hair: ["HairSimpleParted", "HairBeard", "EyebrowsRegular"],
    line: w.line,
    ink: { tone: 0.85, rim: 0.7, spec: 0.3 },
    outfit: BOSS_LOOK,
    dress: { collar: true, placket: true },
    hands: "relaxed",
  }).then((fig) => {
    if (disposed) return;
    // Build the hat and glasses at bind pose, square to his face, then hand
    // them to the head bone so they follow every turn of it.
    fig.apply({});
    fig.root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(fig.model, true);
    const head = fig.bones.head.getWorldPosition(new THREE.Vector3());
    bossFace.position.set(head.x, bb.max.y - 0.115, head.z + 0.012);
    bossFace.quaternion.copy(fig.root.getWorldQuaternion(new THREE.Quaternion()));
    const R0 = 0.095; // head radius
    // The fedora: a wide brim snapped down at the front, a pinched crown, a black band.
    const hat = new THREE.Group();
    hat.position.set(0, 0.05, -0.005);
    hat.rotation.x = 0.16;
    bossFace.add(hat);
    const brimGeo = new THREE.CylinderGeometry(R0 * 1.95, R0 * 1.95, 0.01, 40);
    const bp = brimGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i);
      const z = bp.getZ(i);
      const r = Math.hypot(x, z) / (R0 * 1.95);
      // Down at the front and back, up at the sides.
      bp.setY(i, bp.getY(i) + r * r * (0.022 * Math.abs(x) / (R0 * 1.95) - 0.03 * Math.abs(z) / (R0 * 1.95)));
    }
    brimGeo.computeVertexNormals();
    const brim = add(new THREE.Mesh(brimGeo, M.fedora), hat, true);
    brim.scale.set(1, 1, 1.12);
    const crownGeo = new THREE.CylinderGeometry(R0 * 0.95, R0 * 1.18, 0.12, 32);
    const cp = crownGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      // The pinch and the centre dent on top.
      if (cp.getY(i) > 0.05) {
        const x = cp.getX(i);
        const z = cp.getZ(i);
        cp.setXYZ(i, x * (z > 0 ? 0.82 : 1), cp.getY(i) - 0.02 * (1 - Math.hypot(x, z) / R0), z);
      }
    }
    crownGeo.computeVertexNormals();
    const crown = add(new THREE.Mesh(crownGeo, M.fedora), hat, true);
    crown.position.y = 0.064;
    crown.scale.set(1, 1, 1.15);
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(R0 * 1.17, R0 * 1.18, 0.028, 32, 1, true), M.hatBand), hat, false);
    band.material.side = THREE.DoubleSide;
    band.position.y = 0.02;
    band.scale.set(1.01, 1, 1.16);
    // Thin rectangular glasses: wire rims, smoked lenses, a glint each.
    const glasses = new THREE.Group();
    glasses.position.set(0, -0.026, R0 * 1.06);
    bossFace.add(glasses);
    const wire = (x0, y0, x1, y1) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.004, Math.abs(x1 - x0)), Math.max(0.004, Math.abs(y1 - y0)), 0.004), M.glassesRim);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      glasses.add(m);
    };
    for (const s of [-1, 1]) {
      const cx = s * 0.033;
      wire(cx - 0.024, 0.011, cx + 0.024, 0.011);
      wire(cx - 0.024, -0.011, cx + 0.024, -0.011);
      wire(cx - 0.024, -0.011, cx - 0.024, 0.011);
      wire(cx + 0.024, -0.011, cx + 0.024, 0.011);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.046, 0.02), M.lens);
      lens.position.set(cx, 0, 0.001);
      glasses.add(lens);
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.022), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      glint.position.set(cx + 0.008, 0.001, 0.003);
      glint.rotation.z = -0.6;
      glasses.add(glint);
      glints.push(glint);
      // The arm back to the ear.
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.09), M.glassesRim);
      arm.position.set(s * 0.058, 0.006, -0.045);
      glasses.add(arm);
    }
    wire(-0.009, 0.006, 0.009, 0.006);
    scene.add(bossFace);
    bossFace.updateMatrixWorld(true);
    fig.bones.head.attach(bossFace);
    // Into his seat.
    car.add(fig.root);
    fig.root.position.set(BOSS_SEAT.x, 0, BOSS_SEAT.z);
    fig.apply(SEATED);
    fig.seatOn(BOSS_SEAT.y);
    w.register(fig.root);
    w.sync();
  });


  // The sun: a hot white disc high in the sky behind the grave.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fffaf0").multiplyScalar(1.6), fog: false, depthWrite: false }));
  const sunHalo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#fff4d0", map: dot, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sun.position.set(UX(30), 30, -150);
  sun.scale.setScalar(4.2);
  sunHalo.position.copy(sun.position).add(v3(0, 0, 0.5));
  sunHalo.scale.setScalar(34);
  sun.renderOrder = -1;
  sunHalo.renderOrder = -1;
  funeral.add(sun, sunHalo);
  sun.position.x -= FUN_X;
  sunHalo.position.x -= FUN_X;
  // His blood: a pool under him, and drops off the arm while he drinks.
  const trail = Array.from({ length: 7 }, (_, i) => {
    const u = 0.15 + (i / 6) * 0.75;
    const p = LIMP_PATH.getPointAt(u);
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), M.blood);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x + (hash(i * 2.1) - 0.5) * 0.05, 0.006, p.z + (hash(i * 3.7) - 0.5) * 0.05);
    m.userData.r = 0.012 + hash(i * 5.3) * 0.014;
    m.userData.u = u;
    scene.add(m);
    return m;
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 24), M.blood);
  pool.rotation.x = -Math.PI / 2;
  pool.position.copy(POCHITA_LIE).add(v3(-0.02, 0.006, 0.02));
  scene.add(pool);
  const drops = Array.from({ length: 4 }, () => add(new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), M.blood), scene));
  const biteSpot = new THREE.Mesh(new THREE.CircleGeometry(1, 16), M.blood);
  biteSpot.rotation.x = -Math.PI / 2;
  scene.add(biteSpot);

  // ── 3. The farm: the countryside, a broken wall, the house, the devil ────
  const farm = new THREE.Group();
  farm.position.x = FARM_X;
  scene.add(farm);
  const FX = (x) => FARM_X + x;
  const DEVIL_AT = v3(FX(-1.5), 0, -10.4);
  const CROUCH_AT = v3(FX(1.32), 0, 0.62);
  const DEVIL_YAW = yawTo(DEVIL_AT, CROUCH_AT);
  const DEVIL_FWD = v3(Math.sin(DEVIL_YAW), 0, Math.cos(DEVIL_YAW));
  const DEVIL_SIDE = v3(DEVIL_FWD.z, 0, -DEVIL_FWD.x);
  // The run: out round the end of the wall, then straight down the devil's
  // nose; he takes off four metres out and lands just in front of it.
  const TAKEOFF = DEVIL_AT.clone().addScaledVector(DEVIL_FWD, 4.2);
  const LAND_AT = DEVIL_AT.clone().addScaledVector(DEVIL_FWD, 1.85);
  const RUN_PATH = new THREE.CatmullRomCurve3([CROUCH_AT.clone(), v3(FX(2.1), 0, -0.3), v3(FX(1.2), 0, -3.6), DEVIL_AT.clone().addScaledVector(DEVIL_FWD, 6.6), TAKEOFF]);
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.dirt);
    ground.rotation.x = -Math.PI / 2;
    farm.add(ground);
    // Grass in tufts and patches, stones, the odd weed.
    const tufts = [];
    for (let i = 0; tufts.length < 160 && i < 600; i++) {
      const x = (hash(i * 1.37) - 0.5) * 30;
      const z = 6 - hash(i * 2.91) * 34;
      if (Math.abs(x + 1.5) < 4.5 && z < -5 && z > -15) continue; // the devil's ground
      if (Math.abs(x - 1.0) < 1.6 && z > -8 && z < 1.5) continue; // his run
      tufts.push([x, 0.1, z, 0.7 + hash(i * 4.3) * 1.2, hash(i) * 3]);
    }
    instanced(new THREE.ConeGeometry(0.07, 0.3, 4), M.grass, tufts, farm, false);
    const stones = [];
    for (let i = 0; i < 50; i++) {
      const x = (hash(i * 5.7) - 0.5) * 16;
      const z = 4 - hash(i * 6.1) * 20;
      if (Math.abs(x + 1.5) < 4.5 && z < -6 && z > -14) continue;
      stones.push([x, 0.03, z, 0.06 + hash(i * 8.3) * 0.12, hash(i) * 3, 0.04 + hash(i * 2) * 0.05]);
    }
    instanced(new THREE.IcosahedronGeometry(1, 0), M.stone, stones, farm, true);

    // The wall: a slab of old concrete, its top broken away toward the end he
    // hides behind; moss on it, rebar out of the break.
    const shape = new THREE.Shape();
    const top = [[-2.4, 1.85], [-1.7, 1.9], [-1.2, 1.82], [-0.7, 1.86], [-0.3, 1.7], [0.05, 1.62], [0.25, 1.4], [0.55, 1.45], [0.8, 1.2], [1.0, 1.25], [1.15, 0.95], [1.32, 1.02], [1.45, 0.6], [1.55, 0.0]];
    shape.moveTo(-2.4, 0);
    top.forEach(([x, y]) => shape.lineTo(x, y));
    shape.lineTo(-2.4, 0);
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false }), M.concrete);
    wall.position.set(0, 0, -0.12);
    add(wall, farm, true);
    for (const [x, y, s] of [[-1.6, 0.35, 0.3], [0.5, 0.25, 0.22]]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.moss);
      m.scale.set(s, s * 0.7, 0.03);
      m.position.set(x, y, 0.125);
      farm.add(m);
    }
    for (const [x, y, a] of [[0.25, 1.38, 0.3], [0.85, 1.18, -0.4], [1.2, 0.9, 0.6]]) {
      const bar = slab(-0.008, 0.008, 0, 0.3, -0.008, 0.008, M.rebar, farm);
      bar.position.set(x, y + 0.12, 0);
      bar.rotation.z = a;
    }
    // Rubble at its foot.
    const rubble = [];
    for (let i = 0; i < 14; i++) rubble.push([1.2 + hash(i * 3.3) * 1.0, 0.06, -0.5 + hash(i * 4.1) * 1.4, 0.06 + hash(i * 5.9) * 0.1, hash(i) * 3]);
    instanced(new THREE.BoxGeometry(1, 1, 1), M.concrete, rubble, farm, true);
    softShadow(4.6, 1.0, -0.4, 0.004, 0.3, 0.35, farm);

    // The farmhouse: one storey of dark timber, shoji, a deep veranda, a hipped
    // roof of grey tiles.
    const house = new THREE.Group();
    house.position.set(-5.2, 0, -16.5);
    house.rotation.y = 0.35;
    farm.add(house);
    slab(-4.5, 4.5, 0, 0.45, -3, 3, M.woodDark, house, true);
    slab(-4.2, 4.2, 0.45, 2.7, -2.7, 2.2, M.wood, house, true);
    for (let i = 0; i < 6; i++) {
      const x = -3.9 + i * 1.32;
      slab(x, x + 1.18, 0.6, 2.4, 2.2, 2.23, M.shoji, house);
      slab(x + 0.57, x + 0.61, 0.6, 2.4, 2.23, 2.25, M.woodDark, house);
      slab(x, x + 1.18, 1.48, 1.52, 2.23, 2.25, M.woodDark, house);
    }
    slab(-4.5, 4.5, 0.42, 0.5, 2.2, 3.2, M.wood, house, true);
    for (const x of [-4.4, -1.5, 1.5, 4.4]) slab(x - 0.07, x + 0.07, 0.5, 2.9, 3.05, 3.19, M.woodDark, house, true);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4, 1), M.roof);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(7.4, 2.0, 5.6);
    roof.position.set(0, 3.75, 0.1);
    add(roof, house, true);
    slab(-5.2, 5.2, 2.7, 2.85, -3.8, 3.9, M.roof, house, true);
    softShadow(11, 8, 0, 0.004, 0.5, 0.4, house);

    // Trees round the house and behind it; the mountains beyond, in the haze.
    const trees = [];
    for (let i = 0; i < 28; i++) {
      const x = -22 + i * 1.7 + hash(i) * 1.5;
      const z = -24 - hash(i * 2.3) * 12;
      trees.push([x, 2 + hash(i * 4.1) * 2.2, z, 2.2 + hash(i * 6.1) * 1.8, hash(i) * 3]);
    }
    instanced(new THREE.IcosahedronGeometry(1, 1), M.tree, trees, farm, true);
    instanced(new THREE.IcosahedronGeometry(1, 1), M.treeDark, [[3.5, 1.6, -15, 1.8], [5.5, 2.2, -19, 2.4], [-11, 1.8, -13, 2.0], [-12.5, 2.4, -17, 2.6], [8.5, 1.4, -11, 1.4]], farm, true);
    const hills = [[-30, -110, 48, 30], [25, -130, 60, 42], [-80, -140, 55, 26], [70, -120, 40, 22]];
    hills.forEach(([x, z, r, h]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), M.hill);
      m.position.set(x, h / 2 - 1, z);
      m.rotation.y = hash(x) * 3;
      farm.add(m);
    });
    // A utility pole and its wire, the countryside's one straight line.
    const pole = slab(-0.09, 0.09, 0, 7.5, -0.09, 0.09, M.woodDark, farm, true);
    pole.position.set(6.5, 3.75, -7);
    slab(5.6, 7.4, 6.9, 7.0, -7.05, -6.95, M.woodDark, farm);
  }
  // The Tomato Devil, and the juice it is full of.
  const devil = buildTomatoDevil(w);
  devil.root.position.copy(DEVIL_AT).sub(farm.position);
  devil.root.rotation.y = DEVIL_YAW;
  farm.add(devil.root);
  const devilShadow = softShadow(6.5, 6.5, DEVIL_AT.x - FARM_X, 0.006, DEVIL_AT.z, 0.45, farm);
  const JUICE = 110;
  const juice = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.juice, JUICE);
  juice.frustumCulled = false;
  scene.add(juice);
  const juiceSeed = Array.from({ length: JUICE }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return {
      delay: hash(i * 1.9) * 0.3,
      // Out of the seam to either side, up and forward, as the halves part.
      from: (hash(i * 6.1) - 0.5) * 2.0,
      v: [side * (0.8 + hash(i * 2.3) * 3.2), 1.5 + hash(i * 3.7) * 4.5, 0.4 + hash(i * 4.1) * 3.2],
      size: 0.015 + hash(i * 5.3) * 0.035,
    };
  });
  const splats = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 18), M.juice);
    m.rotation.x = -Math.PI / 2;
    const side = i % 2 ? 1 : -1;
    m.position.copy(DEVIL_AT).addScaledVector(DEVIL_SIDE, side * (0.6 + hash(i * 7.1) * 2.6)).addScaledVector(DEVIL_FWD, 0.5 + hash(i * 8.3) * 2.8);
    m.position.y = 0.008 + i * 0.0005;
    scene.add(m);
    return { m, at: 0.45 + hash(i * 9.1) * 0.6, r: 0.06 + hash(i * 3.9) * 0.18 };
  });
  // The chop's trail: a hot white streak down the devil's front.
  const slash = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff3e6").multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  );
  slash.geometry.translate(0, -0.5, 0);
  slash.renderOrder = 3;
  scene.add(slash);

  // ── Pochita, twice: hurt at the funeral, and whole on the job ────────────
  const hurt = buildPochita(w, { hurt: true, blood: BLOOD });
  const hurtRoot = new THREE.Group();
  hurtRoot.scale.setScalar(S_PUP);
  hurtRoot.add(hurt.pup);
  // His root sits between his hind feet, so he rears up on them.
  const HIND = 0.32;
  hurt.pup.position.z = HIND;
  scene.add(hurtRoot);
  // Bandages: a wrap round his middle, a strip over the left eye's brow, a
  // plaster cross on his cheek; a cut across his flank.
  {
    const wrap = add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 40, 1, true), M.bandage), hurt.body, true);
    wrap.material.side = THREE.DoubleSide;
    wrap.rotation.x = Math.PI / 2;
    wrap.rotation.z = 0.12;
    wrap.scale.set(0.86, 1, 0.82);
    wrap.position.set(0, 0.74, -0.25);
    const brow = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.11, 0.05), M.bandage), hurt.body, true);
    brow.position.set(-0.36, 1.33, 0.7);
    brow.rotation.set(-0.5, -0.5, 0.35);
    for (const a of [0.7, -0.7]) {
      const strip = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.02), M.bandage), hurt.body, true);
      strip.position.set(0.62, 0.72, 0.62);
      strip.rotation.set(0, 0.75, a);
    }
    for (let i = 0; i < 3; i++) {
      const cut = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.02), M.blood), hurt.body, false);
      cut.position.set(0.79, 1.0 - i * 0.09, -0.3 - i * 0.07);
      cut.rotation.set(0, Math.PI / 2 + 0.25, 0.45);
    }
  }
  const saw = buildPochita(w);
  const sawRoot = new THREE.Group();
  sawRoot.scale.setScalar(S_FARM);
  // Held by his middle: the pup's origin sits under the body's centre.
  saw.pup.position.set(0, -0.85, 0.15);
  sawRoot.add(saw.pup);
  scene.add(sawRoot);
  // The chain on his bar: re-laid every frame so it runs on the rev.
  const BAR_LEN = 1.5;
  const BAR_R = 0.25;
  const PERIM = 2 * BAR_LEN + 2 * Math.PI * BAR_R;
  const TEETH = 30;
  const onBar = (s) => {
    const d = ((s % PERIM) + PERIM) % PERIM;
    if (d < BAR_LEN) return [d, BAR_R, 0];
    if (d < BAR_LEN + Math.PI * BAR_R) {
      const a = (d - BAR_LEN) / BAR_R;
      return [BAR_LEN + Math.sin(a) * BAR_R, Math.cos(a) * BAR_R, -a];
    }
    if (d < 2 * BAR_LEN + Math.PI * BAR_R) return [BAR_LEN - (d - BAR_LEN - Math.PI * BAR_R), -BAR_R, Math.PI];
    const a = (d - 2 * BAR_LEN - Math.PI * BAR_R) / BAR_R;
    return [-Math.sin(a) * BAR_R, -Math.cos(a) * BAR_R, Math.PI - a];
  };
  const chain = saw.saw.children.find((o) => o.isInstancedMesh);
  const chainDummy = new THREE.Object3D();
  let chainAt = null;
  const runChain = (offset) => {
    if (!chain || chainAt === offset) return;
    chainAt = offset;
    for (let i = 0; i < TEETH; i++) {
      const [x, y, a] = onBar(offset + (i / TEETH) * PERIM);
      chainDummy.position.set(x, y, 0);
      chainDummy.rotation.set(0, 0, a);
      chainDummy.updateMatrix();
      chain.setMatrixAt(i, chainDummy.matrix);
    }
    chain.instanceMatrix.needsUpdate = true;
  };
  // The starter cord, out of his tail to Denji's fist while he pulls.
  const cordGeo = new THREE.CylinderGeometry(0.011, 0.011, 1, 6);
  cordGeo.translate(0, 0.5, 0);
  const cord = add(new THREE.Mesh(cordGeo, M.cord), scene);
  cord.visible = false;

  // ── Denji ────────────────────────────────────────────────────────────────
  // The ragged white tank top and dark work trousers he owns, at the funeral
  // and on the job: white reads against the grey wall, the dirt and the red
  // devil alike, and the trousers stay a dark, solid navy.
  const TANK = { ...OUTFITS.denji, top: "#f2efe6", sleeves: "none", tie: null, belt: null, bottom: "#1d2638", shoes: "#3a332c", panel: null, trim: null };
  const cast = { tank: null, jacket: null };
  const denjiReady = createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.95, rim: 0.6, spec: 0.3 }, outfit: TANK, dress: { spikes: DRESS.denji.spikes }, fist: 0.35 }).then((fig) => {
    if (disposed) return;
    fig.ik = createArmIK(fig);
    scene.add(fig.root);
    w.register(fig.root);
    cast.tank = fig;
    cast.jacket = fig;
  });
  const ready = Promise.all([denjiReady, bossReady]).then(() => {
    if (disposed) return;
    setLight(lit, true);
    w.sync();
    stage.invalidate?.();
  });

  // ── Light, per set ───────────────────────────────────────────────────────
  let lit = null;
  const setLight = (id, force = false) => {
    if (lit === id && !force) return;
    lit = id;
    const L = LIGHTS[id];
    w.palette(L.pal);
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.multiplyScalar(L.key);
      m.uniforms.uFogRange.value.set(...L.fog);
      if (L.air) m.uniforms.uFog.value.set(L.air);
    });
    w.light(...L.dir);
    w.page(L.page);
    w.bu.uInk.value.set(L.sky[0]);
    w.bu.uPaper.value.set(L.sky[1]);
    w.bu.uRed.value.set("#000000");
    debt.visible = id === "debt";
    funeral.visible = id === "funeral";
    farm.visible = id === "farm";
    hurtRoot.visible = id === "funeral";
    pool.visible = id === "funeral";
    trail.forEach((m) => (m.visible = id === "funeral"));
    biteSpot.visible = id === "funeral";
    sawRoot.visible = id === "farm";
    juice.visible = id === "farm";
    slash.visible = id === "farm";
    splats.forEach((s) => (s.m.visible = id === "farm"));
    drops.forEach((d) => (d.visible = false));
    if (cast.tank) cast.tank.root.visible = id !== "debt";
  };
  setLight("debt", true);
  w.sync();

  // ── Per-frame: the debt ──────────────────────────────────────────────────
  const hankoAt = new THREE.Vector3();
  const updateDebt = (c) => {
    for (const n of NOTICES) {
      if (n.fall === null) {
        n.m.position.set(n.at[0], CRATE_TOP + n.y, n.at[1]);
        n.m.rotation.set(-Math.PI / 2, 0, n.rot);
        continue;
      }
      // Down from above the lens, swinging side to side the way paper falls,
      // the swing dying out as it settles flat; it never tips past edge-on,
      // so only its printed face is ever seen from above.
      const k = segment(c, n.fall, n.fall + T.fallFor);
      const h = 1 - smoothstep(k);
      const air = 1 - easeOutCubic(k);
      const sway = Math.sin(k * Math.PI * 3);
      n.m.visible = c > n.fall;
      n.m.position.set(lerp(n.at[0], n.from[0], air * 0.6) + sway * 0.06 * air, CRATE_TOP + n.y + h * 0.95, lerp(n.at[1], n.from[1], air * 0.6));
      n.m.rotation.set(-Math.PI / 2 + Math.cos(k * Math.PI * 3) * 0.32 * air, sway * 0.4 * air, n.rot + air * 0.9);
    }
    debt.updateMatrixWorld(true);
    // The seals: on the instant the hanko lands, a hair big, then pressed flat.
    for (const s of seals) {
      const on = c >= s.t;
      s.m.visible = on;
      s.m.scale.setScalar(s.size * (on ? lerp(1.12, 1, easeOutCubic(segment(c, s.t, s.t + 0.2))) : 1));
      s.m.getWorldPosition(s.world);
    }
    // The hanko: in from above, down hard, a beat pressed, up and away.
    const [a, b] = seals;
    const between = smooth(c, a.t + 0.35, b.t - 0.3);
    hankoAt.lerpVectors(a.world, b.world, between);
    const press = (at) => {
      const down = easeInCubic(segment(c, at - 0.32, at));
      const up = easeOutCubic(segment(c, at + 0.14, at + 0.5));
      return Math.max(0, down - up);
    };
    const contact = Math.max(press(a.t), press(b.t));
    hanko.visible = c > a.t - 0.6 && c < b.t + 0.9;
    hanko.position.set(hankoAt.x - DEBT_X, hankoAt.y + (1 - contact) * 0.75, hankoAt.z);
    hanko.rotation.set(0.25 * (1 - contact), 0, -0.2 * (1 - contact));
    // A squash on impact.
    const hit = Math.max(pulse(c, a.t + 0.04, 0.05), pulse(c, b.t + 0.04, 0.05));
    hanko.scale.set(1 + hit * 0.08, 1 - hit * 0.1, 1 + hit * 0.08);
  };

  // ── Per-frame: the funeral ───────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const mouthW = new THREE.Vector3();
  const pupQ = new THREE.Quaternion();
  const pupAt = new THREE.Vector3();
  const pupNext = new THREE.Vector3();

  /** Pochita's lie at `c`: on his side, rolled up onto his front, reared to the arm. */
  const LIMP_STEPS = 8;
  const pupAngles = (c) => {
    // Limping out, head hung; then he drops onto his side.
    const u = segment(c, ...T.limp);
    const moving = smoothstep(segment(u, 0, 0.08)) * (1 - smoothstep(segment(u, 0.85, 1)));
    const phase = u * LIMP_STEPS * Math.PI * 2;
    const fallK = segment(c, ...T.collapse);
    const fall = easeInCubic(fallK);
    const rise = ease(c, T.reach[0] - 0.2, T.bite - 0.1);
    const rear = ease(c, T.reach[0] + 0.1, T.bite) * (1 - ease(c, T.back[0], T.back[1]));
    const well = ease(c, T.up[0], T.up[1]);
    const roll = lerp(lerp(0, 1.38, fall), 0, Math.max(rise, well));
    const droop = 0.34 + 0.07 * Math.abs(Math.sin(phase)) * moving;
    const pitch = lerp(lerp(lerp(droop, 0.12, fall), 0.3, rise), -0.85, rear) * (1 - well) + -0.08 * well;
    return { roll, pitch, rise, rear, well, u, moving, phase, fall };
  };
  // How high each lie holds his root so he rests on the grass (measured
  // vertex-exact on a grid of angles, blended between grid points).
  const restY = new Map();
  const box = new THREE.Box3();
  const STEP = 0.1;
  const measure = (roll, pitch) => {
    const key = `${roll.toFixed(2)}:${pitch.toFixed(2)}`;
    if (!restY.has(key)) {
      hurtRoot.position.set(0, 0, 0);
      qEuler([pitch, 0, roll], hurtRoot.quaternion);
      hurtRoot.updateMatrixWorld(true);
      box.makeEmpty();
      hurt.pup.traverse((o) => o.isMesh && !o.material?.uniforms?.uWidth && box.expandByObject(o, true));
      restY.set(key, -box.min.y);
    }
    return restY.get(key);
  };
  const settleHurt = (roll, pitch) => {
    const r0 = Math.floor(roll / STEP) * STEP;
    const p0 = Math.floor(pitch / STEP) * STEP;
    const kr = (roll - r0) / STEP;
    const kp = (pitch - p0) / STEP;
    const a = lerp(measure(r0, p0), measure(r0 + STEP, p0), kr);
    const b = lerp(measure(r0, p0 + STEP), measure(r0 + STEP, p0 + STEP), kr);
    return lerp(a, b, kp);
  };
  // Measure every lie he passes through now, not mid-show.
  for (let c = T.funeral; c < T.farm; c += 0.01) {
    const { roll, pitch } = pupAngles(c);
    settleHurt(roll, pitch);
  }

  const updateHurt = (c, t) => {
    const p = hurt;
    const { roll, pitch, rear, well, u, moving, phase, fall } = pupAngles(c);
    // Measure first: a measurement poses the root itself.
    const rest = settleHurt(roll, pitch);
    hurtRoot.visible = c > T.limp[0] - 0.05;
    // Along the path, slow and uneven: a hitch on every bad step.
    const along = THREE.MathUtils.clamp(smoothstep(u) * 0.35 + u * 0.65 - Math.sin(phase) * 0.006 * moving, 0, 1);
    LIMP_PATH.getPointAt(along, pupAt);
    LIMP_PATH.getPointAt(Math.min(1, along + 0.02), pupNext);
    const pathYaw = along < 0.98 ? yawTo(pupAt, pupNext) : POCHITA_FACE;
    const yaw = lerpAngle(pathYaw, POCHITA_FACE, smooth(u, 0.7, 1));
    pupQ.setFromAxisAngle(Yaxis, yaw);
    hurtRoot.quaternion.copy(pupQ).multiply(qEuler([pitch, 0, roll], tiltQ));
    // Lying still but for the breath; a happy hop once he is up.
    const hop = well * (1 - smooth(c, T.back[1] - 0.3, T.back[1] + 0.3)) * Math.abs(Math.sin((c - T.up[1]) * 7)) * 0.03 * smooth(c, T.up[1], T.up[1] + 0.2);
    const bob = Math.abs(Math.sin(phase)) * 0.05 * moving * S_PUP;
    tmp.set(0, rest + hop + bob, 0);
    hurtRoot.position.copy(pupAt).add(tmp);
    // Panting, the jaw wide as the arm comes, clamped on it, open and happy after.
    let mouth = 0.3 + Math.sin(t * 5) * 0.06;
    mouth = lerp(mouth, 0.95, smooth(c, T.reach[0] + 0.2, T.bite - 0.08));
    mouth = lerp(mouth, 0.36 + Math.sin(t * 7) * 0.03, smooth(c, T.bite - 0.08, T.bite + 0.05));
    mouth = lerp(mouth, 0.6, smooth(c, T.back[0], T.back[0] + 0.3));
    p.setMouth(mouth);
    // Eyes half shut until the blood reaches him; then wide, pupils pinned.
    const wake = easeOutBack(segment(c, T.wake, T.wake + 0.35));
    p.setEyes(lerp(0.22 + 0.08 * Math.sin(t * 0.8) + 0.12 * rear, 1, wake));
    const pin = smooth(c, T.wake, T.wake + 0.15) * (1 - smooth(c, T.up[1], T.up[1] + 0.5));
    p.eyes.forEach((e) => e.pupil.scale.set(1 - 0.3 * pin, 1 - 0.3 * pin, 0.5));
    p.bead.visible = c > T.bite && c < T.back[0] + 0.2;
    // Shallow, fast breaths lying there; gulps while he drinks; a shiver as he wakes.
    const breath = (1 - well) * (1 - rear) * Math.sin(t * 6) * 0.025;
    const drinking = smooth(c, T.bite, T.bite + 0.2) * (1 - smooth(c, T.wake - 0.2, T.wake));
    const gulp = Math.max(0, Math.sin((c - T.bite) * 7)) * 0.04 * drinking;
    const shiver = c > T.wake ? Math.exp(-(c - T.wake) * 2.5) * Math.sin(t * 60) * 0.02 : 0;
    p.body.scale.set(1 + gulp + shiver + breath, 1 - gulp * 0.4 + breath, 1 + gulp);
    // Tail: limp, then wagging hard.
    p.tail.rotation.set(lerp(0.6, 0.1, well), Math.sin(t * lerp(2, 16, well)) * lerp(0.05, 0.6, well), 0);
    // Legs: limp and splayed lying down; under him once he is up.
    p.legs.forEach((g, i) => {
      const step = i === 0 ? -0.75 - 0.1 * Math.sin(phase) : Math.sin(phase + i * 1.9) * 0.38 * moving;
      const lie = lerp(i % 2 ? 0.5 : -0.4, 0, Math.max(rear, well)) - 0.3 * rear * (i === 2 ? 1 : 0);
      g.rotation.set(lerp(step, lie, Math.max(fall, rear, well)), 0, 0);
    });
    hurtRoot.updateMatrixWorld(true);
    p.mouth.getWorldPosition(mouthW);
    // The pool under him spreads while he lies there.
    const spread = smooth(c, T.collapse[0] + 0.3, T.collapse[1] + 1.5) * (0.75 + 0.25 * smooth(c, T.collapse[1], T.bite)) + 0.001;
    pool.scale.set(0.24 * spread, 0.17 * spread, 1);
    // Spots behind him on the way out.
    for (const m of trail) {
      const k = smooth(along, m.userData.u - 0.01, m.userData.u + 0.05) * (c > T.limp[0] ? 1 : 0);
      m.visible = k > 0.01;
      m.scale.set(m.userData.r * k, m.userData.r * k * 0.8, 1);
    }
  };

  // Where he holds the arm out to be bitten: the forearm level over Pochita's
  // snout, the wrist past his face, so the teeth close on the forearm.
  const wristT = new THREE.Vector3();
  const biteW = new THREE.Vector3();
  const elbowW = new THREE.Vector3();
  const handW = new THREE.Vector3();
  const walkAt = new THREE.Vector3();
  const updateTank = (c, t) => {
    const fig = cast.tank;
    // At the grave facing it; head round to the car for the boss's line; round
    // to the tree at the whimper; across to Pochita; down on his knees.
    const faceGrave = yawTo(STAND_AT, GRAVE_AT);
    const faceWalk = yawTo(STAND_AT, KNEEL_AT);
    const facePup = yawTo(KNEEL_AT, POCHITA_LIE) + 0.25;
    const walkK = segment(c, ...T.walk);
    const go = smoothstep(walkK);
    const turnIn = ease(c, T.walk[0] - 0.3, T.walk[0] + 0.4);
    const turnDown = ease(c, T.walk[1] - 0.4, T.kneel[0] + 0.3);
    walkAt.lerpVectors(STAND_AT, KNEEL_AT, go);
    fig.root.position.copy(walkAt);
    fig.root.rotation.set(0, lerpAngle(lerpAngle(faceGrave, faceWalk, turnIn), facePup, turnDown), 0);
    const toCar = ease(c, T.boss + 0.4, T.boss + 1.1) * (1 - ease(c, T.look[0] - 0.6, T.look[0]));
    const look = ease(c, ...T.look) * (1 - turnIn);
    const kneel = ease(c, ...T.kneel);
    const reach = ease(c, ...T.reach) * (1 - ease(c, ...T.back));
    // Walking: a step cycle that fades in and out with the move.
    const stride = Math.sin(walkK * Math.PI) ** 0.6 * (walkK > 0 && walkK < 1 ? 1 : 0);
    let pose = blendPose(MOURN, WALK((c - T.walk[0]) * 7.2), stride);
    pose = blendPose(pose, KNEEL, kneel);
    const breath = Math.sin(t * 1.4) * 0.015;
    pose.spine = [pose.spine[0] + reach * 0.35 + breath, 0, 0];
    pose.chest = [pose.chest[0] + reach * 0.12, 0, 0];
    // His head: down at the grave, round to the car, round to the tree, down
    // at the dog, and up a little at the bite, so his face reads.
    const headDown = lerp(lerp(lerp(0.38, 0.12, toCar), 0.15, look), 0.12, Math.max(stride, kneel)) - 0.15 * smooth(c, T.reach[1], T.reach[1] + 0.5);
    pose.neck = [lerp(0.18, 0.08, Math.max(look, kneel, toCar)) - 0.2 * reach, 0, 0];
    pose.head = [headDown - 0.45 * reach, -0.55 * toCar + look * 0.85 + 0.35 * reach, 0];
    fig.apply(pose);
    fig.groundTo(0);
    fig.root.updateMatrixWorld(true);
    if (reach > 0.001) {
      biteW.copy(mouthW).add(tmp.set(0, 0.03, 0));
      wristT.copy(biteW).add(tmp.set(-0.1, 0.0, 0.02));
      const reached = blendPose(pose, pose, 0);
      fig.ik.solve(reached, "l", wristT, tmp2.set(0.3, -0.6, 0.7).normalize());
      fig.apply(blendPose(pose, reached, reach));
      fig.root.updateMatrixWorld(true);
    }
    // However far the arm got, Pochita closes the last of the gap himself:
    // up off the grass with his jaw on the middle of the forearm.
    const latch = smooth(c, T.bite - 0.4, T.bite) * (1 - ease(c, T.back[0], T.back[0] + 0.5));
    if (latch > 0) {
      fig.ik.arms.l.el.getWorldPosition(elbowW);
      fig.ik.arms.l.hand.getWorldPosition(handW);
      biteW.lerpVectors(elbowW, handW, 0.62);
      tmp.subVectors(biteW, mouthW).add(tmp2.set(0, -0.012, 0)).multiplyScalar(latch);
      hurtRoot.position.add(tmp);
      hurtRoot.updateMatrixWorld(true);
      hurt.mouth.getWorldPosition(mouthW);
    }
    fig.setHand("left", "fist", 0.7 * reach);
    fig.setHand("right", "open", 0.2);
    // Blood off the forearm while Pochita drinks.
    const bleeding = c > T.bite && c < T.back[1];
    drops.forEach((d, i) => {
      const ph = (c - T.bite + i * 0.31) % 0.9;
      d.visible = bleeding && c - T.bite > i * 0.31;
      d.position.copy(biteW).add(tmp.set(0.015 * (i - 1.5), -0.02 - 4.9 * ph * ph, 0.01));
      if (d.position.y < 0.01) d.visible = false;
      d.scale.set(1, 1.6, 1);
    });
    const spot = smooth(c, T.bite + 0.3, T.back[1]);
    biteSpot.visible = spot > 0.01;
    biteSpot.position.set(biteW.x, 0.007, biteW.z);
    biteSpot.scale.setScalar(0.06 * spot + 0.001);
  };

  // ── Per-frame: the farm ──────────────────────────────────────────────────
  const fwd = new THREE.Vector3();
  const hold = new THREE.Vector3();
  const chestW = new THREE.Vector3();
  const headW = new THREE.Vector3();
  const lT = new THREE.Vector3();
  const rT = new THREE.Vector3();
  const sawQ = new THREE.Quaternion();
  const yawQ = new THREE.Quaternion();
  const tiltQ = new THREE.Quaternion();
  const Yaxis = v3(0, 1, 0);
  const pupPoint = (x, y, z, out) => saw.pup.localToWorld(out.set(x, y, z));
  const runAt = new THREE.Vector3();
  const runNext = new THREE.Vector3();
  const LEAP_H = 1.55;
  let denjiLift = 0;

  // Where the saw is held, relative to his chest: forward, up, its pitch.
  const GRIP = {
    hug: [0.3, -0.06, -1.05],
    low: [0.36, -0.22, -0.25],
    wind: [0.06, 0.5, -2.35],
    chop: [0.5, -0.78, 0.95],
  };
  const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  /** Where Denji is and how he stands at `c`: { at, yaw, pose, lift, grip }. */
  const blockJacket = (c, t) => {
    const toDevil = yawTo(CROUCH_AT, DEVIL_AT);
    const up = ease(c, T.fight + 0.4, T.fight + 1.4);
    // Position: the crouch, a step out, the run, the leap, the landing.
    let yaw = lerpAngle(toDevil + 0.25, toDevil, up);
    if (c < T.run[0]) {
      runAt.copy(CROUCH_AT).lerp(RUN_PATH.getPointAt(0.04), up);
    } else if (c < T.leap[0]) {
      const ramp = segment(c, T.run[0], T.run[0] + 0.5);
      const u = easeInCubic(ramp) * 0.08 + segment(c, T.run[0] + 0.5, T.leap[0]) * 0.92;
      const s = 0.04 + 0.96 * u;
      RUN_PATH.getPointAt(Math.min(1, s), runAt);
      RUN_PATH.getPointAt(Math.min(1, s + 0.01), runNext);
      const pathYaw = s < 0.99 ? yawTo(runAt, runNext) : yawTo(runAt, DEVIL_AT);
      yaw = lerpAngle(toDevil, lerpAngle(pathYaw, yawTo(runAt, DEVIL_AT), smooth(s, 0.85, 1)), smooth(c, T.run[0], T.run[0] + 0.35));
    } else {
      // Most of the distance early, so he is over the devil by the chop.
      const k = segment(c, ...T.leap);
      runAt.lerpVectors(TAKEOFF, LAND_AT, 1 - (1 - k) ** 2.5);
      yaw = yawTo(TAKEOFF, DEVIL_AT);
    }
    const k = segment(c, ...T.leap);
    const lift = c > T.leap[0] && c < T.leap[1] ? 4 * LEAP_H * k * (1 - k) : 0;
    denjiLift = lift;

    // Body: crouch → stance → run → air → landing → stance, every hand-off blended.
    let pose = blendPose(CROUCH, STANCE, up);
    pose.spine = [pose.spine[0] + Math.sin(t * 1.3) * 0.02 * (1 - up), 0, 0];
    const yank = segment(c, T.pull[1], T.pull[2]) * (1 - segment(c, T.pull[2], T.pull[3]));
    pose.spine = [pose.spine[0], -0.35 * smoothstep(yank), 0];
    const runIn = smooth(c, T.run[0], T.run[0] + 0.35);
    if (runIn > 0) pose = blendPose(pose, RUN((c - T.run[0]) * 13), runIn);
    const air = smooth(c, T.leap[0] - 0.1, T.leap[0] + 0.12);
    if (air > 0) pose = blendPose(pose, LEAP, air);
    const land = easeOutCubic(segment(c, T.leap[1] - 0.12, T.leap[1] + 0.12));
    if (land > 0) pose = blendPose(pose, LAND, land);
    const rise = ease(c, T.leap[1] + 0.45, T.leap[1] + 1.4);
    if (rise > 0) pose = blendPose(pose, STANCE, rise);
    // The chop folds him forward over the blade.
    const chopK = easeInOutCubic(segment(c, T.strike - 0.14, T.strike + 0.12));
    pose.spine = [pose.spine[0] + 0.45 * chopK * (1 - land), pose.spine[1], 0];

    // The grip: hugged, then low, wound up overhead, chopped down, back low.
    let grip = mix3(GRIP.hug, GRIP.low, up);
    grip = mix3(grip, GRIP.wind, ease(c, T.leap[0] - 0.12, T.leap[0] + 0.22));
    grip = mix3(grip, GRIP.chop, chopK);
    grip = mix3(grip, GRIP.low, ease(c, T.leap[1] + 0.5, T.leap[1] + 1.4));
    return { at: runAt, yaw, pose, lift, grip, hug: 1 - up };
  };

  const updateJacket = (c, t) => {
    const fig = cast.jacket;
    const b = blockJacket(c, t);
    fig.root.position.copy(b.at);
    fig.root.rotation.set(0, b.yaw, 0);
    fig.apply(b.pose);
    fig.groundTo(0);
    fig.root.position.y += b.lift;
    fig.root.updateMatrixWorld(true);

    // Pochita in front of his chest: hugged upright behind the wall, held low
    // once he is up, wound up overhead in the air and chopped down through.
    fig.bones.chest.getWorldPosition(chestW);
    fwd.set(0, 0, 1).applyAxisAngle(Yaxis, b.yaw);
    hold.copy(chestW).addScaledVector(fwd, b.grip[0]).add(tmp2.set(0, b.grip[1], 0));
    sawRoot.position.copy(hold);
    yawQ.setFromAxisAngle(Yaxis, b.yaw);
    // Rev: a buzz through him.
    const rev = smooth(c, T.pull[2], T.pull[2] + 0.2) * (staticMode ? 0 : 1);
    const buzz = Math.sin(t * 70) * 0.03 * rev;
    sawQ.copy(yawQ).multiply(qEuler([b.grip[2] + buzz, 0, 0], tiltQ));
    sawRoot.quaternion.copy(sawQ);
    sawRoot.updateMatrixWorld(true);

    // Hands: left on the D-handle, right on the rear grip; the right goes to
    // the tail and yanks for the pull.
    pupPoint(0.55, 1.95, -0.12, lT);
    pupPoint(-0.1, 0.95, -1.28, rT);
    const toTail = ease(c, T.pull[0], T.pull[1]) * (1 - ease(c, T.pull[2], T.pull[3]));
    const yank = easeOutCubic(segment(c, T.pull[1], T.pull[2])) * (1 - ease(c, T.pull[2] + 0.1, T.pull[3]));
    if (toTail > 0) {
      pupPoint(0, 2.1, -0.75, tmp);
      tmp.addScaledVector(fwd, -0.35 * yank).add(tmp2.set(0, 0.25 * yank, 0)).addScaledVector(tmp2.set(-fwd.z, 0, fwd.x), 0.45 * yank);
      rT.lerp(tmp, toTail);
    }
    const ikPose = blendPose(b.pose, b.pose, 0);
    fig.ik.solve(ikPose, "l", lT, HINT.l);
    fig.ik.solve(ikPose, "r", rT, HINT.r);
    fig.apply(ikPose);
    fig.setHands("fist", 0.8);
    fig.root.updateMatrixWorld(true);

    // The cord, from his tail to the fist, while it is out.
    cord.visible = yank > 0.05;
    if (cord.visible) {
      pupPoint(0, 2.05, -0.72, tmp);
      fig.ik.arms.r.hand.getWorldPosition(tmp2);
      cord.position.copy(tmp);
      tmp2.sub(tmp);
      cord.scale.set(1, tmp2.length(), 1);
      cord.quaternion.setFromUnitVectors(Yaxis, tmp2.normalize());
    }
    fig.bones.head.getWorldPosition(headW);
  };

  const updateSaw = (c, t) => {
    const p = saw;
    const rev = segment(c, T.pull[2], T.pull[2] + 0.4);
    // The chain: still, then racing.
    runChain(c > T.pull[2] ? (c - T.pull[2]) * lerp(4, 16, rev) : 0);
    p.setMouth(lerp(0.12, 0.55 + Math.sin(t * 30) * 0.08, smooth(c, T.pull[2], T.pull[2] + 0.15)));
    p.setEyes(lerp(1, 0.85, smooth(c, T.after, T.after + 0.5)));
    p.tail.rotation.set(0.1, Math.sin(t * lerp(3, 25, rev)) * 0.25, 0);
    const pin = 1 - 0.25 * smooth(c, T.pull[2], T.pull[2] + 0.2);
    p.eyes.forEach((e) => e.pupil.scale.set(pin, pin, 0.5));
  };

  const juiceM = new THREE.Matrix4();
  const juiceQ = new THREE.Quaternion();
  const cutAt = new THREE.Vector3();
  const updateDevil = (c, t) => {
    const cut = c - T.strike;
    // It rears and lunges at him as he comes, mouth opening.
    const lunge = ease(c, T.run[0] + 0.8, T.strike - 0.12) * (1 - ease(c, T.strike, T.strike + 0.4));
    const stare = ease(c, T.stare, T.stare + 0.5);
    const look = cast.jacket ? headW : CROUCH_AT;
    devil.pose({ t, look, stare, lunge, cut });
    devilShadow.scale.setScalar(1 + 0.25 * devil.fallOf(cut).splay);
    // The slash: drawn top to bottom down the front in a tenth of a second.
    const draw = easeOutCubic(segment(cut, -0.06, 0.06));
    const fade = 1 - smoothstep(segment(cut, 0.08, 0.5));
    slash.visible = farm.visible && cut > -0.06 && cut < 0.5;
    slash.material.opacity = 0.95 * fade;
    slash.position.copy(DEVIL_AT).addScaledVector(DEVIL_FWD, R * 1.12).setY(Y0 + R * 1.35);
    slash.rotation.set(0, DEVIL_YAW + Math.PI / 2, 0);
    slash.scale.set(0.09 * fade + 0.02, (R * 2.4 + 0.6) * draw + 0.001, 1);
    // Juice: thrown out of the seam to both sides, arcing down, flattened where it lands.
    const live = cut > 0;
    for (let i = 0; i < JUICE; i++) {
      const j = juiceSeed[i];
      const s = cut - j.delay;
      if (!live || s < 0 || s > 2.6) {
        juiceM.makeScale(0, 0, 0);
      } else {
        cutAt.copy(DEVIL_AT).addScaledVector(DEVIL_FWD, R * 0.6).setY(Y0 + j.from * R * 0.6);
        tmp.copy(cutAt).addScaledVector(DEVIL_SIDE, j.v[0] * s).addScaledVector(DEVIL_FWD, j.v[2] * s);
        tmp.y += j.v[1] * s - 4.9 * s * s;
        const landed = tmp.y < 0.02;
        if (landed) tmp.y = 0.012;
        const sz = j.size * (landed ? 1.4 : 1);
        juiceM.compose(tmp, juiceQ, tmp2.set(sz, landed ? sz * 0.15 : sz * 1.8, sz));
      }
      juice.setMatrixAt(i, juiceM);
    }
    juice.instanceMatrix.needsUpdate = true;
    for (const s of splats) {
      const k = live ? easeOutCubic(segment(cut, s.at, s.at + 0.3)) : 0;
      s.m.visible = k > 0.01;
      s.m.scale.set(s.r * k, s.r * k * 0.8, 1);
    }
  };

  // ── Camera: shots per set, blended into one another ──────────────────────
  // Each shot writes (pos, look) for time c. Inside a set, a shot change is a
  // smoothstep blend over `blend` seconds from where the last shot would have
  // been; between sets the dip to black covers the change.
  const F = (x, y, z, out) => out.set(FX(x), y, z);
  const U = (x, y, z, out) => out.set(UX(x), y, z);
  const dpos = () => cast.jacket?.root.position ?? CROUCH_AT;
  const shots = [
    {
      t: 0,
      // Over the crate, the bulb above: a slow push down onto the ledger.
      at(c, pos, look) {
        const k = smooth(c, 0, T.funeral);
        pos.set(DEBT_X + lerp(0.42, 0.12, k), lerp(1.42, 1.02, k), lerp(0.92, 0.5, k));
        look.set(DEBT_X + lerp(0.0, 0.03, k), CRATE_TOP, lerp(-0.05, -0.02, k));
        const jolt = pulse(c, T.stamp[0] + 0.04, 0.06) + pulse(c, T.stamp[1] + 0.04, 0.06) * 0.8;
        pos.y -= jolt * 0.03;
      },
    },
    {
      t: T.funeral,
      cut: true,
      // Wide and bright: the cross, the boy, the car pulled up behind him.
      at(c, pos, look) {
        const k = smooth(c, T.funeral, T.boss + 1);
        U(lerp(-1.75, -1.5, k), lerp(1.6, 1.45, k), lerp(3.9, 3.5, k), pos);
        U(lerp(1.0, 0.95, k), lerp(0.95, 0.9, k), lerp(-0.1, 0, k), look);
      },
    },
    {
      t: T.boss,
      blend: 1.1,
      // Low by the car door, up at the boss in his window: hat, glasses, beard.
      at(c, pos, look) {
        const k = smooth(c, T.boss, T.limp[0]);
        car.updateMatrixWorld(true);
        if (bossFace.parent && bossFace.parent !== scene) bossFace.getWorldPosition(bossHeadW);
        else car.localToWorld(bossHeadW.set(-0.36, 1.18, 0));
        car.localToWorld(pos.set(lerp(-1.5, -1.25, k), lerp(0.62, 0.66, k), lerp(-0.12, -0.05, k)));
        look.copy(bossHeadW).add(tmp.set(0, -0.03, 0));
      },
    },
    {
      t: T.limp[0] - 0.1,
      cut: true, // under a dip to black
      // Low in the grass in front of him: Pochita limps out from behind the
      // tree, bleeding, and drops — his face to the lens as he goes down.
      at(c, pos, look) {
        const k = smooth(c, T.limp[0], T.collapse[1]);
        pos.copy(POCHITA_LIE).add(tmp.set(lerp(0.95, 1.05, k), lerp(0.62, 0.5, k), lerp(2.3, 1.75, k)));
        look.copy(hurtRoot.position).lerp(POCHITA_LIE, 0.4).setY(lerp(0.3, 0.15, k));
      },
    },
    {
      t: T.walk[0] - 0.1,
      blend: 1.4,
      // Low by the tree, past the dog bleeding in the grass, at Denji as he
      // comes over.
      at(c, pos, look) {
        const d = cast.tank?.root.position ?? STAND_AT;
        const k = smooth(c, T.walk[0], T.kneel[1]);
        const down = smooth(c, ...T.kneel);
        pos.copy(POCHITA_LIE).add(tmp.set(lerp(-1.2, -0.9, k), lerp(0.75, 1.0, k) - 0.2 * down, lerp(2.0, 3.0, k)));
        look.copy(POCHITA_LIE).lerp(d, 0.55).setY(lerp(1.0, 0.55, down));
      },
    },
    {
      t: T.kneel[0] + 0.2,
      blend: 1.1,
      // In close, side on: the boy and the dying dog.
      at(c, pos, look) {
        const k = smooth(c, T.kneel[0] + 0.2, T.reach[0]);
        pos.copy(KNEEL_AT).add(tmp.set(lerp(-0.1, -0.2, k), lerp(0.8, 0.7, k), lerp(2.7, 2.4, k)));
        look.copy(KNEEL_AT).add(tmp.set(-0.24, lerp(0.5, 0.42, k), -0.05));
      },
    },
    {
      t: T.reach[0] - 0.2,
      blend: 0.9,
      // The bite, low and side on, Denji's face over his arm.
      at(c, pos, look) {
        const k = smooth(c, T.reach[0], T.farm);
        pos.copy(KNEEL_AT).add(tmp.set(lerp(-0.48, -0.54, k), lerp(0.6, 0.64, k), lerp(2.25, 2.05, k)));
        look.copy(KNEEL_AT).add(tmp.set(-0.3, lerp(0.44, 0.48, k), 0.05));
      },
    },
    {
      t: T.farm,
      cut: true,
      // Over his shoulder, over the wall, at the devil by the house.
      at(c, pos, look) {
        const k = smooth(c, T.farm, T.wall2);
        F(lerp(2.0, 1.85, k), lerp(1.8, 1.7, k), lerp(3.6, 3.1, k), pos);
        F(-0.9, lerp(1.3, 1.4, k), -6.0, look);
      },
    },
    {
      t: T.wall2,
      blend: 1.6,
      // Three-quarters behind him: his face turned to it, Pochita in his arms.
      at(c, pos, look) {
        const k = smooth(c, T.wall2, T.fight);
        F(lerp(2.45, 2.3, k), lerp(1.2, 1.15, k), lerp(2.4, 2.15, k), pos);
        F(-0.6, lerp(1.45, 1.55, k), -5.0, look);
      },
    },
    {
      t: T.fight,
      blend: 1.2,
      // In front of him as he stands and pulls: his face, the cord, the saw.
      at(c, pos, look) {
        const k = smooth(c, T.fight, T.run[0]);
        const d = dpos();
        pos.set(d.x + lerp(1.7, 1.5, k), lerp(1.2, 1.3, k), d.z - lerp(1.9, 1.6, k));
        look.set(d.x, lerp(0.9, 1.1, k), d.z);
      },
    },
    {
      t: T.run[0],
      blend: 1.1,
      // Running with him, behind and to his right.
      at(c, pos, look) {
        const d = dpos();
        pos.copy(d).add(tmp.set(1.2, 1.25, 2.4));
        look.copy(d).lerp(DEVIL_AT, 0.45).setY(1.4);
      },
    },
    {
      t: T.leap[0] - 0.6,
      blend: 0.8,
      // Side on and close: Denji big in the frame, the tomato filling the rest.
      at(c, pos, look) {
        const k = smooth(c, T.leap[0] - 0.25, T.after);
        pos.copy(LAND_AT).addScaledVector(DEVIL_SIDE, lerp(4.0, 3.6, k)).addScaledVector(DEVIL_FWD, lerp(1.9, 1.5, k)).setY(1.15 + denjiLift * 0.45);
        look.copy(LAND_AT).addScaledVector(DEVIL_FWD, -0.35).setY(1.45 + denjiLift * 0.7);
      },
    },
    {
      t: T.after,
      blend: 1.0,
      // After: low behind him, between the halves coming down.
      at(c, pos, look) {
        const k = smooth(c, T.after, CYCLE);
        pos.copy(LAND_AT).addScaledVector(DEVIL_FWD, lerp(3.6, 4.4, k)).addScaledVector(DEVIL_SIDE, lerp(0.9, 1.3, k)).setY(lerp(1.7, 2.3, k));
        look.copy(DEVIL_AT).addScaledVector(DEVIL_FWD, 0.6).setY(lerp(1.3, 1.0, k));
      },
    },
  ];
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const prevPos = new THREE.Vector3();
  const prevLook = new THREE.Vector3();
  const dirA = new THREE.Vector3();
  const dirB = new THREE.Vector3();
  const shoot = (c) => {
    let i = shots.length - 1;
    while (i > 0 && c < shots[i].t) i--;
    const s = shots[i];
    s.at(c, camPos, camLook);
    if (i > 0 && !s.cut && s.blend) {
      const k = smoothstep(segment(c, s.t, s.t + s.blend));
      if (k < 1) {
        // Blend where the lens is and which way it points (not the point it
        // looks at), so the turn is even even when the targets are far apart.
        shots[i - 1].at(c, prevPos, prevLook);
        const dA = prevLook.distanceTo(prevPos);
        const dB = camLook.distanceTo(camPos);
        dirA.subVectors(prevLook, prevPos).normalize();
        dirB.subVectors(camLook, camPos).normalize();
        dirA.lerp(dirB, k).normalize();
        camPos.lerpVectors(prevPos, camPos, k);
        camLook.copy(camPos).addScaledVector(dirA, lerp(dA, dB, k));
      }
    }
  };

  const BASE_FOV = camera.fov;
  let fitFov = BASE_FOV;
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    w.bu.uAspect.value = aspect;
    // Narrow frames (the theatre half) widen the lens rather than lose the edges.
    fitFov = BASE_FOV * Math.max(1, (1.1 / aspect) ** 0.6);
    camera.fov = fitFov;
    camera.updateProjectionMatrix();
    w.sync();
  });

  // ── The frame ────────────────────────────────────────────────────────────
  const CAPTIONS = [
    [0.8, T.funeral - 0.4, "Dad died. The debt didn't."],
    [T.funeral + 0.6, T.boss + 0.1, "The funeral was on a sunny day."],
    [T.boss + 0.3, T.boss + 2.4, "\u201cEven though your spineless father killed himself, you still owe us.\u201d"],
    [T.boss + 2.5, T.limp[0] - 0.1, "\u201cI don't care what you have to do.\u201d"],
    [T.kneel[0] + 0.3, T.reach[0] - 0.2, "\u201cYou're hurt\u2026 Are you gonna die too?\u201d"],
    [T.reach[0] - 0.1, T.bite + 1.3, "\u201cIf you don't wanna die, bite me!\u201d"],
    [T.bite + 1.6, T.farm - 0.5, "\u201cI'll save you\u2026 so you save me.\u201d"],
    [T.farm + 0.8, T.fight - 0.4, "One devil nets about ¥300,000."],
  ];
  const update = (time) => {
    const c = staticMode ? STATIC_TIME : ((time % CYCLE) + CYCLE) % CYCLE;
    const t = staticMode ? STATIC_TIME : time;
    const set = c < T.funeral ? "debt" : c < T.farm ? "funeral" : "farm";
    setLight(set);

    if (set === "debt") updateDebt(c);
    if (set === "funeral") {
      // The sun catches his glasses as he speaks.
      const glint = staticMode ? 0 : Math.max(pulse(c, T.boss + 1.2, 0.22), 0.7 * pulse(c, T.boss + 2.3, 0.18));
      glints.forEach((g) => (g.material.opacity = 0.95 * glint));
      updateHurt(c, t);
      if (cast.tank) updateTank(c, t);
    }
    if (set === "farm") {
      if (cast.jacket) updateJacket(c, t);
      else headW.copy(CROUCH_AT).setY(1);
      updateSaw(c, t);
      updateDevil(c, t);
    }

    shoot(c);
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.03;
    camera.position.y += pointer.y * 0.02;
    // The stamps, the rev and the cut shake the frame; the rev's shake eases in
    // and out rather than switching.
    const revShake = smooth(c, T.pull[2], T.pull[2] + 0.25) * (1 - smooth(c, T.leap[0] - 0.3, T.leap[0])) * 0.012;
    const shake = staticMode ? 0 : revShake + pulse(c, T.strike + 0.05, 0.14) * 0.06 + pulse(c, T.after + 0.4, 0.2) * 0.025;
    camera.position.x += Math.sin(t * 83) * shake;
    camera.position.y += Math.sin(t * 71 + 1) * shake * 0.7;
    camera.lookAt(camLook);
    camera.updateMatrixWorld(true);

    // Dips to black at the loop point and at each change of set; the strike
    // flashes white, then red.
    const black = staticMode ? 0 : Math.max(1 - smooth(c, 0, 0.6), smooth(c, CYCLE - 0.7, CYCLE), pulse(c, T.funeral, 0.2), pulse(c, T.limp[0] - 0.1, 0.2), pulse(c, T.farm, 0.2));
    const flash = staticMode ? 0 : Math.max(pulse(c, T.strike, 0.05) * 0.85, pulse(c, T.strike + 0.12, 0.08) * 0.55);
    cuts.update({ black, flash, flashColor: c > T.strike + 0.06 ? "#b0101e" : "#fff6ea" });

    // The lettering: the debt, the funeral, the deal, the rate, the rev.
    let text = "";
    let opacity = 0;
    for (const [a, b, line] of CAPTIONS) {
      if (c > a && c < b) {
        text = line;
        opacity = staticMode ? 1 : Math.min(segment(c, a, a + 0.4), 1 - segment(c, b - 0.4, b));
      }
    }
    caption.update({ text, size: 2.4, opacity });
    const slam = segment(c, T.pull[2], T.pull[2] + 0.2);
    vroom.update({
      x: 62,
      y: 18,
      size: 8,
      rotate: -8,
      opacity: c > T.pull[2] && c < T.leap[0] + 0.1 ? Math.min(1, slam * 4) * (1 - segment(c, T.leap[0] - 0.2, T.leap[0] + 0.1)) : 0,
      scale: lerp(2.0, 1, easeOutBack(slam)),
      boil: Math.floor(t * 10),
      jitter: 0.08,
      shake: staticMode ? [0, 0] : [Math.sin(t * 97) * 4, Math.sin(t * 89) * 3],
    });
    renderer.toneMappingExposure = baseExposure * (set === "farm" ? 1.0 : set === "funeral" ? 1.02 : 0.95);
  };

  runChain(0);

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      cuts.dispose();
      caption.dispose();
      vroom.dispose();
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = baseExposure;
      dot.dispose();
    },
  };
};
