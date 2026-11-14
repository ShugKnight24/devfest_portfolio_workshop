import * as THREE from "three";
import { clamp01, easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { PAPER, RED, inkMaterial, mangaBackdrop, outlineMaterial, syncInk, setInkStyle } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createCaption, createSfx } from "../sfx";

/**
 * Play the Fight First — Reacher's pre-visualization, as a crime-comic page.
 *
 * In the show he runs the whole fight in his head before the first punch: the
 * moves play out as ghosts, then the real fight happens exactly that way.
 * That is the talk's Act 2 (plan before you prompt), so the scene is the plan
 * and the execution, back to back, on loop.
 *
 * Three men, three directions, so the eye reads three separate targets: one
 * at his front-left (screen right), one at his front-right (screen left,
 * nearer the lens), and one who steps in behind him (screen right, deep).
 *
 *   0    – 1.4  standoff: three men square up; the third steps in behind him
 *   1.4  – 5.0  he plays it first: time stops, a red ghost runs all three moves
 *               1  right elbow, swung across into the man at his front-left
 *               2  both fists in the front-right man's collar, then a headbutt
 *               3  left elbow driven straight back into the man behind him
 *   5.0  – 7.0  then it happens: the same three moves on the same three men,
 *               full speed; each one drops where he was hit
 *   7.0  – 9.6  exactly as planned: three men down, one standing
 *
 * Reduced motion holds the aftermath frame.
 */

const CYCLE = 9.6;
const PLAN = [1.4, 5.0];
const REAL = [5.0, 7.0];
const STATIC_TIME = 8.4;
/** Where the camera sits, and which way he faces: a touch to his right of
 * square-on, so the man behind him shows past his left shoulder. */
const CAMERA = -0.35;
const HEADING = CAMERA - 0.15;

// ── Poses ──────────────────────────────────────────────────────────────────
// Figure convention: faces +z, his left is +x; positive yaw turns him left.
const GUARD = {
  spine: [0.12, 0, 0],
  lShoulder: [-0.95, 0, 0.25],
  lElbow: [-1.95, 0, 0],
  rShoulder: [-0.85, 0, -0.25],
  rElbow: [-2.0, 0, 0],
  lHip: [-0.18, 0, 0.06],
  lKnee: [0.32, 0, 0],
  rHip: [0.12, 0, -0.06],
  rKnee: [0.22, 0, 0],
  lift: -0.04,
};
// 1: right elbow. He turns left and the elbow point sweeps across at face
// height into the man at his front-left; the fist folds in by his chest.
const ELBOW = {
  hips: [0, 0.6, 0],
  spine: [0.18, 0.48, 0],
  chest: [0, 0.36, 0],
  head: [0, 0.15, 0],
  lShoulder: [-0.9, 0, 0.35],
  lElbow: [-2.0, 0, 0],
  rShoulder: [0, 2.0, -1.45],
  rElbow: [-2.3, 0, 0],
  lHip: [-0.35, 0, 0.12],
  lKnee: [0.4, 0, 0],
  rHip: [0.2, 0, -0.1],
  rKnee: [0.3, 0, 0],
  lift: -0.07,
};
// 2a: both fists in the front-right man's collar — Reacher closes the
// distance; he never throws a fancy kick.
const COLLAR = {
  hips: [0, -0.4, 0],
  spine: [0.3, -0.35, 0],
  chest: [0.08, -0.2, 0],
  neck: [0.1, 0, 0],
  lShoulder: [-1.05, 0, -0.42],
  lElbow: [-1.4, 0, 0],
  rShoulder: [-1.05, 0, 0.42],
  rElbow: [-1.4, 0, 0],
  lHip: [0.2, 0, 0.1],
  lKnee: [0.3, 0, 0],
  rHip: [-0.35, 0, -0.08],
  rKnee: [0.4, 0, 0],
  lift: -0.06,
};
// 2b: yank him in and drive the forehead through his face.
const HEADBUTT = {
  hips: [0, -0.4, 0],
  spine: [0.6, -0.35, 0],
  chest: [0.12, -0.2, 0],
  neck: [0.3, 0, 0],
  head: [0.35, 0, 0],
  lShoulder: [-0.9, 0, -0.45],
  lElbow: [-1.9, 0, 0],
  rShoulder: [-0.9, 0, 0.45],
  rElbow: [-1.9, 0, 0],
  lHip: [0.2, 0, 0.1],
  lKnee: [0.35, 0, 0],
  rHip: [-0.45, 0, -0.08],
  rKnee: [0.5, 0, 0],
  lift: -0.08,
};
// 3: left elbow driven straight back into the man behind; he looks over the
// left shoulder at him. The right fist stays up.
const BACK_ELBOW = {
  hips: [0, 0.2, 0],
  spine: [0.15, 0.1, 0],
  chest: [0, 0.05, 0],
  neck: [0, 0.5, 0],
  head: [-0.05, 0.75, 0],
  lShoulder: [1.15, 0, 0.25],
  lElbow: [-2.2, 0, 0],
  rShoulder: [-0.9, 0, -0.3],
  rElbow: [-2.0, 0, 0],
  lHip: [0.15, 0, 0.1],
  lKnee: [0.35, 0, 0],
  rHip: [-0.3, 0, -0.1],
  rKnee: [0.35, 0, 0],
  lift: -0.06,
};
const STAND = {
  spine: [0.02, 0, 0],
  head: [0.08, 0, 0],
  lShoulder: [0, 0, 0.14],
  lElbow: [-0.25, 0, 0],
  rShoulder: [0, 0, -0.14],
  rElbow: [-0.25, 0, 0],
  lHip: [0, 0, 0.07],
  rHip: [0, 0, -0.07],
};
const THUG_GUARD = {
  spine: [0.2, 0, 0],
  lShoulder: [-1.1, 0, 0.2],
  lElbow: [-1.7, 0, 0],
  rShoulder: [-0.6, 0, -0.3],
  rElbow: [-2.1, 0, 0],
  lHip: [-0.25, 0, 0.05],
  lKnee: [0.4, 0, 0],
  rHip: [0.15, 0, -0.05],
  rKnee: [0.3, 0, 0],
  lift: -0.06,
};
// Winding up a right hand as he steps in — the elbow gets there first.
const THUG_COCK = {
  spine: [0.22, 0.35, 0],
  chest: [0, 0.15, 0],
  lShoulder: [-1.25, 0, 0.15],
  lElbow: [-1.5, 0, 0],
  rShoulder: [0.35, 0, -0.55],
  rElbow: [-2.2, 0, 0],
  lHip: [-0.4, 0, 0.05],
  lKnee: [0.35, 0, 0],
  rHip: [0.2, 0, -0.05],
  rKnee: [0.3, 0, 0],
  lift: -0.07,
};
// Grabbed by the shirt and yanked forward, hands coming up too late.
const THUG_HELD = {
  spine: [0.32, 0, 0],
  neck: [0.1, 0, 0],
  lShoulder: [-1.0, 0, 0.35],
  lElbow: [-1.3, 0, 0],
  rShoulder: [-1.0, 0, -0.35],
  rElbow: [-1.3, 0, 0],
  lHip: [-0.3, 0, 0.05],
  lKnee: [0.35, 0, 0],
  rHip: [0.25, 0, -0.05],
  rKnee: [0.3, 0, 0],
  lift: -0.07,
};
// The instant after: head snapped back, arms flung.
const THUG_HIT = {
  spine: [-0.25, 0, 0],
  neck: [-0.35, 0, 0],
  head: [-0.45, 0, 0],
  lShoulder: [-1.6, 0, 0.7],
  lElbow: [-0.5, 0, 0],
  rShoulder: [-1.4, 0, -0.8],
  rElbow: [-0.6, 0, 0],
  lHip: [-0.1, 0, 0.08],
  lKnee: [0.2, 0, 0],
  rHip: [0.1, 0, -0.06],
  rKnee: [0.15, 0, 0],
};
// Out cold: legs buckled under him, arms thrown wide. Laid on his back.
const THUG_DOWN = {
  spine: [0.1, 0, 0],
  head: [-0.2, 0.4, 0],
  lShoulder: [-0.5, 0, 1.25],
  lElbow: [-0.7, 0, 0],
  rShoulder: [-0.3, 0, -1.35],
  rElbow: [-0.5, 0, 0],
  lHip: [-0.95, 0, 0.2],
  lKnee: [1.45, 0, 0],
  rHip: [-0.6, 0, -0.12],
  rKnee: [1.0, 0, 0],
};
/** How far over he goes: flat on his back. */
const DOWN_TILT = 1.5;

const WORDS = ["CRACK!", "THOK!", "WHUMP!"];
/** The moment inside a strike where it lands. */
const IMPACT = 0.32;

// The three men, in his frame: angle off his nose (positive = his left) and
// distance. Each strike steps him `step` toward its man and pivots him `turn`
// on the balls of his feet, then back again. `fall` is the way the man goes
// down: away from him, and away from the lens so the body stays in frame.
const deg = Math.PI / 180;
const MEN = [
  { angle: 80 * deg, r: 0.85, step: 0.3, turn: 0.3, lunge: 0.04, word: [9, -3], tilt: -10 }, // front-left: the elbow
  { angle: -50 * deg, r: 0.8, step: 0.17, turn: -0.1, lunge: 0, word: [-11, 1], tilt: 8 }, // front-right: collar and headbutt
  { angle: 145 * deg, r: 0.8, step: 0.18, turn: 0, lunge: 0.04, word: [7, -11], tilt: -6, from: 1.25 }, // behind: the reverse elbow
].map((m) => {
  const dir = [Math.sin(m.angle), Math.cos(m.angle)];
  const lens = [Math.sin(CAMERA - HEADING), Math.cos(CAMERA - HEADING)];
  const fx = dir[0] - 0.6 * lens[0];
  const fz = dir[1] - 0.6 * lens[1];
  const n = Math.hypot(fx, fz);
  return { ...m, dir, fall: [fx / n, fz / n] };
});

/**
 * Reacher at strike-progress s in [0, 3]: each unit is one strike — load,
 * snap out, hold, and recover toward guard; past 3 he stands down. Returns
 * the pose, how hard his hands grip the collar, and his step (x, z) off the
 * mark. The ghost and the real man both run this, so the plan and the fight
 * match move for move.
 */
const reacherAt = (s) => {
  if (s >= 3) return { pose: blendPose(GUARD, STAND, easeInOutCubic(clamp01((s - 3) / 0.6))), grip: 0, step: [0, 0], turn: 0 };
  const k = Math.floor(s);
  const f = s - k;
  const back = easeInOutCubic(segment(f, 0.65, 1));
  let pose;
  let grip = 0;
  let reach;
  if (k === 1) {
    // Grab first, then the head comes through.
    const grab = easeOutCubic(segment(f, 0, 0.18));
    const butt = easeOutBack(segment(f, 0.18, IMPACT + 0.02));
    pose = blendPose(blendPose(GUARD, COLLAR, grab), HEADBUTT, butt);
    grip = segment(f, 0.06, 0.16) * (1 - segment(f, IMPACT + 0.04, IMPACT + 0.14));
    reach = grab;
  } else {
    reach = easeOutBack(segment(f, 0, 0.4));
    pose = blendPose(GUARD, k === 0 ? ELBOW : BACK_ELBOW, reach);
  }
  const out = reach * (1 - back);
  const d = MEN[k].step * out;
  return { pose: blendPose(pose, GUARD, back), grip, step: [MEN[k].dir[0] * d, MEN[k].dir[1] * d], turn: MEN[k].turn * out };
};

/**
 * A posed body's resting footprint, relative to its root, in `frame`'s space:
 * the horizontal middle of its skin and how far its lowest point sits below
 * the root (so `y` lifts it to stand on the ground).
 */
const bodyRest = (fig, frame) => {
  frame.updateMatrixWorld(true);
  const toFrame = new THREE.Matrix4().copy(frame.matrixWorld).invert();
  const root = fig.root.position.clone();
  const p = new THREE.Vector3();
  let low = Infinity;
  let sx = 0;
  let sz = 0;
  let n = 0;
  fig.model.traverse((m) => {
    if (!m.isSkinnedMesh) return;
    const count = m.geometry.attributes.position.count;
    for (let i = 0; i < count; i += 4) {
      m.getVertexPosition(i, p).applyMatrix4(m.matrixWorld).applyMatrix4(toFrame);
      low = Math.min(low, p.y);
      sx += p.x;
      sz += p.z;
      n++;
    }
  });
  return n ? { x: sx / n - root.x, z: sz / n - root.z, y: root.y - low } : { x: 0, z: 0, y: 0.16 };
};

export const createReacherFightScene = (stage, { overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  const backdrop = mangaBackdrop();
  backdrop.material.uniforms.uRain.value = 1;
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  // Everything stands in his frame; the ring turns him square to the camera.
  const ring = new THREE.Group();
  ring.rotation.y = HEADING;
  scene.add(ring);

  const THUGS = MEN.map((m) => ({
    ...m,
    fig: null,
    facing: Math.atan2(-m.dir[0], -m.dir[1]),
    axis: new THREE.Vector3(m.fall[1], 0, -m.fall[0]), // up × fall: tips him over backwards
    base: new THREE.Vector3(),
    down: { x: 0, z: 0, y: 0 }, // where his body lies, measured once it loads
  }));
  let reacher = null;
  let ghosts = [];
  let pools = [];

  // Modelled bodies (Quaternius Superhero base, CC0) drawn in ink. Reacher is
  // the 6'5" one, near-solid ink rimmed in red; the men are rimmed in paper.
  // Closed fists all round: this is a fight.
  const ready = Promise.all([
    // Dressed, because lit bodies read as people: Reacher in a charcoal tee and
    // jeans, the three men in a leather jacket, a work shirt, a dark hoodie.
    createModelFigure({ height: 2.0, hands: "fist", hair: ["HairBuzzed", "EyebrowsRegular"], line, ink: { tone: 0.92, rim: 0.55 }, outfit: { skin: "#d2a07c", top: "#3b414d", bottom: "#2c3a52", shoes: "#2a1d16", hair: "#5a3d24", sleeves: "short" } }),
    ...THUGS.map((t, i) =>
      createModelFigure({
        height: 1.8 + i * 0.03,
        hands: "fist",
        hair: [["HairBeard"], ["HairSimpleParted", "EyebrowsRegular"], ["HairBuzzed"]][i],
        line,
        ink: { tone: 0.9, rim: 1.2, rimColor: PAPER },
        outfit: [
          { skin: "#c99572", top: "#4a2e20", bottom: "#26262a", shoes: "#1a1614", hair: "#2a1d16", sleeves: "long" },
          { skin: "#e0b294", top: "#6f6d5c", bottom: "#33405a", shoes: "#3a2a1e", hair: "#3b2a1a", sleeves: "short", collar: "#5d5b4c" },
          { skin: "#8d5e43", top: "#25262c", bottom: "#3a3a3d", shoes: "#151515", hair: "#151210", sleeves: "long" },
        ][i],
      }),
    ),
    // The plan: a red ghost of him, with two trailing afterimages.
    ...[0.42, 0.3, 0.18].map((opacity) =>
      createModelFigure({
        height: 2.0,
        hands: "fist",
        hair: ["HairBuzzed"],
        material: new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity, depthWrite: false }),
      }),
    ),
  ]).then(([hero, ...rest]) => {
    reacher = hero;
    ring.add(reacher.root);
    THUGS.forEach((t, i) => {
      t.fig = rest[i];
      ring.add(t.fig.root);
      // Lay him down once, at the origin, to learn where the body ends up:
      // its middle (so he lands where he was hit, not a body-length away) and
      // its lowest point (so he lies on the ground, not in it).
      t.fig.apply(THUG_DOWN);
      t.fig.root.position.set(0, 0, 0);
      t.fig.root.rotation.set(0, t.facing, 0);
      t.fig.root.rotateOnWorldAxis(t.axis, DOWN_TILT);
      t.down = bodyRest(t.fig, ring);
    });
    ghosts = rest.slice(THUGS.length).map((g, i) => {
      ring.add(g.root);
      return { ...g, lag: [0, 0.035, 0.07][i], mat: g.model.getObjectByProperty("isMesh", true).material };
    });
    // Ground: ink pools under each figure.
    const poolGeo = new THREE.CircleGeometry(0.42, 32);
    const poolMat = inkMaterial({ flat: true });
    pools = [reacher.root, ...THUGS.map((t) => t.fig.root)].map((owner, i) => {
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.scale.set(i === 0 ? 1.5 : 1.1, i === 0 ? 1.1 : 0.9, 1);
      pool.position.y = 0.002;
      ring.add(pool);
      return { pool, owner };
    });
    syncInk(scene, renderer.getPixelRatio());
    return { reacher, thugs: THUGS.map((t) => t.fig), ghosts };
  });

  // Lettering: numbered marks on the plan, impact words on the real thing.
  const marks = THUGS.map((_, i) => createSfx(overlay, { text: String(i + 1), crescendo: 0, color: RED }));
  const hits = WORDS.map((w) => createSfx(overlay, { text: w, crescendo: 0.5 }));
  const caption = createCaption(overlay, { x: 4, y: 7 });

  const camRig = { distance: 6.2 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    camRig.distance = aspect < 1.2 ? 6.2 / (aspect / 1.2) ** 0.8 : 6.2;
  });
  const lookAt = new THREE.Vector3(0, 0.95, 0);
  const tmp = new THREE.Vector3();
  const neck = new THREE.Vector3();
  const grip = new THREE.Vector3();
  const pull = new THREE.Vector3(); // how far the collar grab dragged the second man
  const screen = new THREE.Vector3();
  /** A point in his frame → percent of the overlay. */
  const toScreen = (x, y, z) => {
    ring.updateMatrixWorld();
    screen.set(x, y, z).applyMatrix4(ring.matrixWorld).project(camera);
    return [(screen.x * 0.5 + 0.5) * 100, (-screen.y * 0.5 + 0.5) * 100];
  };
  /** The grip centre between both fists, in his frame. */
  const gripCentre = (fig) => {
    fig.socket("right").getWorldPosition(grip);
    fig.socket("left").getWorldPosition(tmp);
    return ring.worldToLocal(grip.add(tmp).multiplyScalar(0.5));
  };

  /** Fists close round a handful of shirt; only re-solved when it changes. */
  const gripShirt = (fig, weight) => {
    if (fig.userGrip === weight) return;
    fig.userGrip = weight;
    fig.setHands("grip", weight, { radius: 0.022 });
  };

  const update = (time) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const planning = c >= PLAN[0] && c < PLAN[1];
    const plan = segment(c, ...PLAN); // 0..1 through the ghost run
    const real = segment(c, ...REAL);

    // Camera: low and wide, slow drift; it leans in while he thinks.
    const think = Math.sin(plan * Math.PI);
    const orbit = CAMERA + Math.sin(time * 0.12) * 0.08 + pointer.x * 0.12;
    tmp.set(Math.sin(orbit), 0.22 + pointer.y * 0.05, Math.cos(orbit)).normalize();
    camera.position.copy(tmp).multiplyScalar(camRig.distance - think * 0.9).add(lookAt);
    camera.lookAt(lookAt);
    if (!reacher) return; // bodies still loading: the page alone is fine

    // Reacher himself: gone while he plans (the plan is the red ghost), then
    // the real thing in ink. Feet stay planted; he steps, never floats.
    const sReal = c < REAL[0] ? 0 : c < REAL[1] ? real * 3 : 3 + (c - REAL[1]) * 1.5;
    const me = c < REAL[0] ? { pose: GUARD, grip: 0, step: [0, 0], turn: 0 } : reacherAt(sReal);
    reacher.apply(me.pose);
    gripShirt(reacher, me.grip);
    reacher.root.position.set(me.step[0], 0, me.step[1]);
    reacher.root.rotation.y = me.turn;
    reacher.groundTo(0);
    reacher.root.visible = !planning;

    // The ghost runs the same choreography, slower, while time stands still.
    ghosts.forEach((g) => {
      const s = Math.min(2.999, clamp01(plan - g.lag) * 3);
      const run = reacherAt(s);
      g.root.visible = planning && plan > g.lag;
      g.apply(run.pose);
      gripShirt(g, run.grip);
      g.root.position.set(run.step[0], 0, run.step[1]);
      g.root.rotation.y = run.turn;
      g.groundTo(0);
      const lead = g.lag === 0;
      g.mat.opacity = (lead ? 0.85 : 0.4 - g.lag * 3) * segment(c, PLAN[0], PLAN[0] + 0.3) * (1 - segment(c, PLAN[1] - 0.3, PLAN[1]));
    });

    // The men: guard and sway until their turn; then hit, and down where they
    // stood, tipped over backwards away from him. Time stops while he plans.
    if (c < REAL[0]) pull.set(0, 0, 0);
    THUGS.forEach((thug, i) => {
      const live = c < PLAN[0] || c >= PLAN[1];
      const hitAt = i + IMPACT;
      const struck = c >= REAL[0] ? clamp01((sReal - hitAt) / 0.6) : 0;
      const snap = easeOutCubic(segment(struck, 0, 0.3));
      const fall = easeInOutCubic(segment(struck, 0.15, 1));
      // The man behind starts back and steps in during the standoff.
      const walk = thug.from ? segment(c, 0.2, 1.2) : 1;
      const r = thug.from ? lerp(thug.from, thug.r, easeInOutCubic(walk)) : thug.r;
      // Three short steps in, not a glide.
      const stride = Math.sin(walk * Math.PI * 3) * Math.sin(walk * Math.PI) * 0.35;
      // His swing: wound up as he steps in, just too late.
      const windup = c >= REAL[0] ? segment(sReal, i - 0.15, hitAt) : 0;
      const lunge = thug.lunge * easeOutCubic(windup);
      const sway = live ? Math.sin(time * 2.2 + i * 2) * 0.05 : 0;
      const stance = i === 1 ? blendPose(THUG_GUARD, THUG_HELD, segment(sReal, 1, 1.18)) : blendPose(THUG_GUARD, THUG_COCK, easeOutCubic(windup));
      stance.spine = [stance.spine[0], stance.spine[1] + sway, stance.spine[2]];
      if (stride) {
        stance.lHip = [stance.lHip[0] - stride, stance.lHip[1], stance.lHip[2]];
        stance.rHip = [stance.rHip[0] + stride, stance.rHip[1], stance.rHip[2]];
        stance.lKnee = [stance.lKnee[0] + Math.max(0, stride) * 0.8, 0, 0];
        stance.rKnee = [stance.rKnee[0] + Math.max(0, -stride) * 0.8, 0, 0];
      }
      thug.fig.apply(blendPose(blendPose(stance, THUG_HIT, snap), THUG_DOWN, fall));
      thug.fig.root.rotation.set(0, thug.facing, 0);
      thug.base.set(thug.dir[0] * (r - lunge), 0, thug.dir[1] * (r - lunge));
      thug.fig.root.position.copy(thug.base);
      thug.fig.groundTo(0);
      // The collar: drag his shirt to Reacher's fists while they grip it,
      // and he goes down from where he was dragged to.
      if (i === 1 && c >= REAL[0]) {
        if (me.grip > 0 && sReal < 1 + IMPACT + 0.04) {
          thug.fig.bones.neck.getWorldPosition(neck);
          ring.worldToLocal(neck);
          // The shirt front at the collar: just under and ahead of the neck.
          neck.x -= thug.dir[0] * 0.1;
          neck.z -= thug.dir[1] * 0.1;
          const g = gripCentre(reacher);
          pull.set(g.x - neck.x, 0, g.z - neck.z).multiplyScalar(me.grip);
        }
        thug.base.add(pull);
      }
      // Knocked back, and flat on his back right where he was hit: the
      // body's middle lands half a metre behind the spot he stood on.
      const { x: dx, z: dz, y: dy } = thug.down;
      thug.fig.root.position.set(
        thug.base.x + (thug.fall[0] * 0.5 - dx) * fall,
        lerp(thug.fig.root.position.y, dy, fall),
        thug.base.z + (thug.fall[1] * 0.5 - dz) * fall,
      );
      thug.fig.root.rotateOnWorldAxis(thug.axis, fall * DOWN_TILT);
    });
    pools.forEach(({ pool, owner }) => pool.position.set(owner.position.x, 0.002, owner.position.z));

    // The page: rain falls, then freezes while he plans.
    backdrop.material.uniforms.uSeed.value = planning ? 0 : Math.floor(time * 10);
    backdrop.material.uniforms.uIntensity.value = planning ? 0.55 : 1;
    // A red moon, upper right: off his body, so the red ghost reads on paper.
    backdrop.material.uniforms.uDisc.value.set(0.76, 0.72, 0.17);

    // Plan marks: a red number over each man as the ghost reaches him.
    marks.forEach((mark, i) => {
      const t = THUGS[i];
      const [x, y] = toScreen(t.dir[0] * t.r, 2.05, t.dir[1] * t.r);
      const shown = segment(plan * 3, i + IMPACT, i + IMPACT + 0.15);
      mark.update({ x, y, size: 7, rotate: -6, opacity: planning ? shown : 0, scale: lerp(1.8, 1, easeOutBack(shown)), boil: 0, jitter: 0 });
    });
    // Impact words: one per strike, on its man, the instant it lands.
    hits.forEach((hit, i) => {
      const t = THUGS[i];
      const land = segment(sReal, i + IMPACT, i + IMPACT + 0.12);
      const fade = 1 - segment(sReal, i + 1.1, i + 1.6);
      const [x, y] = toScreen(t.dir[0] * t.r, 1.6, t.dir[1] * t.r);
      hit.update({
        x: Math.min(92, Math.max(8, x + t.word[0])),
        y: Math.min(90, Math.max(10, y + t.word[1])),
        size: 8,
        rotate: t.tilt,
        opacity: c >= REAL[0] ? land * fade : 0,
        scale: lerp(2, 1, easeOutBack(land)),
        boil: Math.floor(time * 10),
      });
    });

    caption.update({
      text: c < PLAN[0] ? "Three men. One Reacher." : planning ? "He plays the fight first." : c < REAL[1] ? "Then it happens." : "Exactly as planned.",
      size: 2.3,
    });
  };

  // The show's look: a lit, rainy night rather than a printed page.
  const film = () => setInkStyle(scene, { film: true, shade: "#5c6a86", fog: "#141820" });
  film();
  ready.then(film);

  return {
    ready,
    update,
    dispose() {
      unsubscribeResize();
      [...marks, ...hits, caption].forEach((s) => s.dispose());
    },
  };
};

