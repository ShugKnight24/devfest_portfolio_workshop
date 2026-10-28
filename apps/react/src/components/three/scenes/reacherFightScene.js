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
 * and the execution, back to back, on loop:
 *
 *   0    – 1.4  standoff: three men square up to one very large one
 *   1.4  – 5.0  he plays it first: time stops, a red ghost runs all three moves
 *               (elbow, collar-and-headbutt, reverse elbow: how he actually fights)
 *   5.0  – 7.0  then it happens: the same three moves, full speed, in ink
 *   7.0  – 9.6  exactly as planned: three men down, one standing
 *
 * Reduced motion holds the aftermath frame.
 */

const CYCLE = 9.6;
const STANDOFF = 1.4;
const PLAN = [1.4, 5.0];
const REAL = [5.0, 7.0];
const STATIC_TIME = 8.4;

// ── Poses ──────────────────────────────────────────────────────────────────
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
// 1: right elbow, swung into the man on his right.
const ELBOW = {
  hips: [0, -0.55, 0],
  spine: [0.15, -0.35, 0],
  chest: [0, -0.4, 0],
  head: [0, -0.5, 0],
  lShoulder: [-0.9, 0, 0.3],
  lElbow: [-2.0, 0, 0],
  rShoulder: [-0.25, 0, -1.55],
  rElbow: [-2.35, 0, 0],
  lHip: [-0.3, 0, 0.1],
  lKnee: [0.45, 0, 0],
  rHip: [0.15, 0, -0.1],
  rKnee: [0.25, 0, 0],
  lift: -0.07,
};
// 2: both fists in the man's collar, then a forward headbutt — Reacher's
// signature. He never throws a fancy kick; he closes the distance.
const HEADBUTT = {
  hips: [0, 0.6, 0],
  spine: [0.38, 0.25, 0],
  chest: [0.12, 0.15, 0],
  neck: [0.35, 0, 0],
  head: [0.45, 0, 0],
  lShoulder: [-1.25, 0, 0.15],
  lElbow: [-0.75, 0, 0],
  rShoulder: [-1.25, 0, -0.15],
  rElbow: [-0.75, 0, 0],
  lHip: [-0.4, 0, 0.12],
  lKnee: [0.45, 0, 0],
  rHip: [0.25, 0, -0.1],
  rKnee: [0.3, 0, 0],
  lift: -0.08,
};
// 3: reverse elbow, driven straight back into the man behind him.
const BACK_ELBOW = {
  hips: [0, -0.35, 0],
  spine: [-0.05, -0.45, 0],
  chest: [0, -0.35, 0],
  head: [0, -1.1, 0],
  lShoulder: [-0.9, 0, 0.3],
  lElbow: [-1.9, 0, 0],
  rShoulder: [1.05, 0, -0.2],
  rElbow: [-2.3, 0, 0],
  lHip: [-0.2, 0, 0.1],
  lKnee: [0.4, 0, 0],
  rHip: [0.1, 0, -0.12],
  rKnee: [0.3, 0, 0],
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
const THUG_DOWN = {
  spine: [-0.1, 0, 0],
  lShoulder: [-2.6, 0, 0.6],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-2.4, 0, -0.8],
  rElbow: [-0.6, 0, 0],
  lHip: [-0.3, 0, 0.2],
  lKnee: [0.6, 0, 0],
  rHip: [0.05, 0, -0.1],
  rKnee: [0.2, 0, 0],
};

const STRIKES = [ELBOW, HEADBUTT, BACK_ELBOW];
const WORDS = ["CRACK!", "THOK!", "WHUMP!"];

/**
 * Reacher's pose at strike-progress s in [0, 3]: each unit is one strike —
 * load, snap out, hold, and recover toward guard. Past 3 he stands down.
 */
const reacherPose = (s) => {
  if (s >= 3) return blendPose(GUARD, STAND, easeInOutCubic(clamp01((s - 3) / 0.6)));
  const k = Math.floor(s);
  const f = s - k;
  const out = easeOutBack(segment(f, 0, 0.4));
  const back = easeInOutCubic(segment(f, 0.65, 1));
  return blendPose(blendPose(GUARD, STRIKES[k], out), GUARD, back);
};
/** The moment inside a strike where it lands. */
const IMPACT = 0.32;

export const createReacherFightScene = (stage, { overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  const backdrop = mangaBackdrop();
  backdrop.material.uniforms.uRain.value = 1;
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  const world = new THREE.Group();
  scene.add(world);

  // Three men, each facing him.
  const SPECS = [
    { at: [-1.05, 0, 0.35], away: [-1, 0, 0.25], word: [-12, 6] }, // his right: the elbow
    { at: [0.95, 0, 0.55], away: [1, 0, 0.45], word: [10, 2] }, // front left: collar and headbutt
    { at: [0.1, 0, -1.05], away: [0.05, 0, -1], word: [2, -14] }, // behind: the reverse elbow
  ];
  const THUGS = SPECS.map((spec) => ({
    ...spec,
    fig: null,
    facing: Math.atan2(-spec.at[0], -spec.at[2]),
    axis: new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...spec.away).normalize()),
  }));
  let reacher = null;
  let ghosts = [];
  let pools = [];

  // Modelled bodies (Quaternius Superhero base, CC0) drawn in ink. Reacher is
  // the 6'5" one, near-solid ink rimmed in red; the men are rimmed in paper.
  const ready = Promise.all([
    // Dressed, because lit bodies read as people: Reacher in a charcoal tee and
    // jeans, the three men in a leather jacket, a work shirt, a dark hoodie.
    createModelFigure({ height: 2.0, hair: ["HairBuzzed", "EyebrowsRegular"], line, ink: { tone: 0.92, rim: 0.55 }, outfit: { skin: "#d2a07c", top: "#3b414d", bottom: "#2c3a52", shoes: "#2a1d16", hair: "#5a3d24", sleeves: "short" } }),
    ...THUGS.map((t, i) =>
      createModelFigure({
        height: 1.8 + i * 0.03,
        hair: [["HairBeard"], ["HairSimpleParted", "EyebrowsRegular"], ["HairBuzzed"]][i],
        line,
        ink: { tone: 0.9, rim: 1.2, rimColor: PAPER },
        outfit: [
          { skin: "#c99572", top: "#4a2e20", bottom: "#26262a", shoes: "#1a1614", hair: "#2a1d16", sleeves: "long" },
          { skin: "#e0b294", top: "#6f6d5c", bottom: "#33405a", shoes: "#3a2a1e", hair: "#3b2a1a", sleeves: "short" },
          { skin: "#8d5e43", top: "#25262c", bottom: "#3a3a3d", shoes: "#151515", hair: "#151210", sleeves: "long" },
        ][i],
      }),
    ),
    // The plan: a red ghost of him, with two trailing afterimages.
    ...[0.42, 0.3, 0.18].map((opacity) =>
      createModelFigure({
        height: 2.0,
        hair: ["HairBuzzed"],
        material: new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity, depthWrite: false }),
      }),
    ),
  ]).then(([hero, ...rest]) => {
    reacher = hero;
    world.add(reacher.root);
    THUGS.forEach((t, i) => {
      t.fig = rest[i];
      t.fig.root.position.set(...t.at);
      world.add(t.fig.root);
    });
    ghosts = rest.slice(THUGS.length).map((g, i) => {
      world.add(g.root);
      return { ...g, lag: [0, 0.035, 0.07][i], mat: g.model.getObjectByProperty("isMesh", true).material, base: [0.42, 0.3, 0.18][i] };
    });
    // Ground: ink pools under each figure.
    const poolGeo = new THREE.CircleGeometry(0.42, 32);
    const poolMat = inkMaterial({ flat: true });
    pools = [reacher.root, ...THUGS.map((t) => t.fig.root)].map((owner, i) => {
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.scale.set(i === 0 ? 1.5 : 1.1, i === 0 ? 1.1 : 0.9, 1);
      pool.position.y = 0.002;
      world.add(pool);
      return { pool, owner };
    });
    syncInk(scene, renderer.getPixelRatio());
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
  const screen = new THREE.Vector3();
  const toScreen = (v) => {
    screen.copy(v).project(camera);
    return [(screen.x * 0.5 + 0.5) * 100, (-screen.y * 0.5 + 0.5) * 100];
  };

  const update = (time) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const planning = c >= PLAN[0] && c < PLAN[1];
    const plan = segment(c, ...PLAN); // 0..1 through the ghost run
    const real = segment(c, ...REAL);

    // Camera: low and wide, slow drift; it leans in while he thinks.
    const think = Math.sin(plan * Math.PI);
    const orbit = -0.35 + Math.sin(time * 0.12) * 0.08 + pointer.x * 0.12;
    tmp.set(Math.sin(orbit), 0.16 + pointer.y * 0.05, Math.cos(orbit)).normalize();
    camera.position.copy(tmp).multiplyScalar(camRig.distance - think * 0.9).add(lookAt);
    camera.lookAt(lookAt);
    if (!reacher) return; // bodies still loading: the page alone is fine

    // Reacher himself: gone while he plans (the plan is the red ghost), then
    // the real thing in ink.
    const sReal = c < REAL[0] ? 0 : c < REAL[1] ? real * 3 : 3 + (c - REAL[1]) * 1.5;
    reacher.apply(c < REAL[0] ? GUARD : reacherPose(sReal));
    reacher.root.visible = !planning;
    // Step in on the headbutt, step back into the reverse elbow.
    const step = sReal >= 1 && sReal < 2 ? Math.sin((sReal - 1) * Math.PI) : 0;
    reacher.root.position.set(step * 0.28, 0, step * 0.18 + (sReal >= 2 && sReal < 3 ? -0.14 * Math.sin((sReal - 2) * Math.PI) : 0));

    // The ghost runs the same choreography, slower, while time stands still.
    ghosts.forEach((g) => {
      const s = clamp01(plan - g.lag) * 3;
      g.root.visible = planning && plan > g.lag;
      g.apply(reacherPose(Math.min(2.999, s)));
      const lead = g.lag === 0;
      g.mat.opacity = (lead ? 0.85 : 0.4 - g.lag * 3) * segment(c, PLAN[0], PLAN[0] + 0.3) * (1 - segment(c, PLAN[1] - 0.3, PLAN[1]));
    });

    // The men: guard and sway until struck; then knocked flat, away from him.
    THUGS.forEach((thug, i) => {
      const hitAt = i + IMPACT;
      const struck = c >= REAL[0] ? clamp01((sReal - hitAt) / 0.5) : 0;
      const fall = easeOutCubic(struck);
      const sway = c < PLAN[0] || c >= PLAN[1] ? Math.sin(time * 2.2 + i * 2) * 0.03 : 0;
      thug.fig.apply(blendPose(THUG_GUARD, THUG_DOWN, fall));
      thug.fig.root.position.set(thug.at[0] + thug.away[0] * fall * 0.7, sway * 0.2 + fall * 0.16, thug.at[2] + thug.away[2] * fall * 0.7);
      thug.fig.root.rotation.set(0, thug.facing, 0);
      thug.fig.root.rotateOnWorldAxis(thug.axis, fall * 1.45 + sway);
    });
    pools.forEach(({ pool, owner }) => pool.position.set(owner.position.x, 0.002, owner.position.z));

    // The page: rain falls, then freezes while he plans; the disc sits behind him.
    backdrop.material.uniforms.uSeed.value = planning ? 0 : Math.floor(time * 10);
    backdrop.material.uniforms.uIntensity.value = planning ? 0.55 : 1;
    // A red moon, upper right: off his body, so the red ghost reads on paper.
    backdrop.material.uniforms.uDisc.value.set(0.76, 0.72, 0.17);

    // Plan marks: a red number on each man as the ghost reaches him.
    marks.forEach((mark, i) => {
      const [x, y] = toScreen(tmp.set(THUGS[i].at[0], 2.05, THUGS[i].at[2]));
      const shown = segment(plan * 3, i + IMPACT, i + IMPACT + 0.15);
      mark.update({ x, y, size: 7, rotate: -6, opacity: planning ? shown : 0, scale: lerp(1.8, 1, easeOutBack(shown)), boil: 0, jitter: 0 });
    });
    // Impact words: one per strike, the instant it lands.
    hits.forEach((hit, i) => {
      const land = segment(sReal, i + IMPACT, i + IMPACT + 0.12);
      const fade = 1 - segment(sReal, i + 1.1, i + 1.6);
      const [x, y] = toScreen(tmp.set(THUGS[i].at[0], 1.6, THUGS[i].at[2]));
      hit.update({
        x: x + THUGS[i].word[0],
        y: y + THUGS[i].word[1],
        size: 8,
        rotate: i === 1 ? 8 : -10,
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

