import * as THREE from "three";
import { OUTFITS } from "../rezeKit";
import { canvasTexture, clamp01, createParticles, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, segment } from "../kit";
import { INK, PAPER, RED, inkMaterial, mangaBackdrop, outlineMaterial, syncInk, setInkStyle } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createChainsawMan } from "../chainsawMan";
import { createSfx } from "../sfx";

/**
 * Pull the Cord — Denji becomes Chainsaw Man. The talk's Act 3: commitment.
 *
 *   armed        Denji stands in the dark, fist closed on the starter cord in
 *                his chest; the page breathes, a low "...."
 *   0    -> 0.15 he draws the arm back
 *   0.15 -> 0.3  YANK: the cord rips out to arm's length
 *   0.3  -> 0.42 the page flashes to negative
 *   0.42 -> 0.8  the change: his head goes, the chainsaw head (orange
 *                casing, fangs, cords down his neck) takes its place; the
 *                bar comes out of the forehead, one out of each forearm; the
 *                starter grip snaps home to his chest; blood
 *   0.8  -> 1    he drops into his stance, jaw open; chains run; VRRRN!!
 *
 * Denji in his clothes, and the hybrid form, are chainsawMan.js.
 */

const DURATION = 2.2;

const REST = {
  spine: [0.05, 0, 0],
  head: [0.12, 0, 0],
  lShoulder: [0.05, 0, 0.12],
  lElbow: [-0.2, 0, 0],
  // Right fist closed on the cord's grip at his sternum.
  rShoulder: [-0.6, 0, -0.4],
  rElbow: [-1.7, 0, 1.2],
  lHip: [0, 0, 0.06],
  rHip: [0, 0, -0.06],
};
const DRAW = {
  ...REST,
  spine: [0.15, 0.2, 0],
  rShoulder: [-0.9, 0, -0.15],
  rElbow: [-2.45, 0.3, 0],
  lift: -0.03,
};
const YANK = {
  spine: [-0.05, -0.35, 0],
  chest: [0, -0.25, 0],
  head: [-0.15, -0.2, 0],
  lShoulder: [-0.2, 0, 0.35],
  lElbow: [-0.4, 0, 0],
  rShoulder: [-0.3, 0, -1.6],
  rElbow: [-0.1, 0, 0],
  lHip: [-0.1, 0, 0.12],
  lKnee: [0.15, 0, 0],
  rHip: [0.05, 0, -0.14],
};
// Chainsaw Man's stance: low, wide, blades out.
const STANCE = {
  spine: [0.32, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.32, 0, 0],
  lShoulder: [-0.75, 0, 0.75],
  lElbow: [-1.0, 0, 0],
  rShoulder: [-0.75, 0, -0.75],
  rElbow: [-1.0, 0, 0],
  lHip: [-0.45, 0, 0.32],
  lKnee: [0.85, 0, 0],
  rHip: [-0.2, 0, -0.3],
  rKnee: [0.65, 0, 0],
  lift: -0.17,
};

// The demon: hunched over him, arms wide; then thrown back by the blades.
const DEMON_LOOM = {
  spine: [0.4, 0, 0],
  chest: [0.15, 0, 0],
  head: [-0.3, 0, 0],
  lShoulder: [-0.9, 0, 0.7],
  lElbow: [-0.8, 0, 0],
  rShoulder: [-0.9, 0, -0.7],
  rElbow: [-0.8, 0, 0],
  lHip: [-0.35, 0, 0.25],
  lKnee: [0.6, 0, 0],
  rHip: [-0.25, 0, -0.25],
  rKnee: [0.5, 0, 0],
  lift: -0.12,
};
const DEMON_REEL = {
  spine: [-0.45, 0, 0.1],
  chest: [-0.2, 0, 0],
  head: [-0.5, 0.3, 0],
  lShoulder: [-0.3, 0, 1.4],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-0.3, 0, -1.4],
  rElbow: [-0.3, 0, 0],
  lHip: [0.2, 0, 0.2],
  lKnee: [0.3, 0, 0],
  rHip: [-0.4, 0, -0.2],
  rKnee: [0.5, 0, 0],
  lift: -0.05,
};

export const createDenjiScene = (stage, { props = {}, overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  let fired = Boolean(props.fired);
  let firedAt = null;

  const backdrop = mangaBackdrop();
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  const lineThin = outlineMaterial(0.7);
  const ink = inkMaterial({ flat: true });

  // Denji: the Quaternius Superhero body (CC0) in his clothes, starting
  // human, fist closed on the starter grip in his chest. On the change his
  // head collapses and the hybrid form's chainsaw head takes its place.
  let denji = null;
  let demon = null;
  const ready = Promise.all([
    createChainsawMan({ height: 1.82, line, lineThin, ink: { tone: 0.78, rim: 1.4 }, fist: 0.6, form: 0, blades: 0, rev: 0, mouth: 0.1, blood: 0 }),
    // The demon he is about to fight: bigger, horned, rimmed in paper.
    createModelFigure({ height: 2.35, horns: true, line, ink: { tone: 0.55, rim: 1.3, rimColor: PAPER }, outfit: OUTFITS.devil }),
  ]).then(([man, foe]) => {
    denji = man;
    scene.add(denji.root);

    demon = foe;
    demon.root.position.set(1.6, 0, -0.9);
    demon.root.rotation.y = Math.atan2(-1.6, 0.9);
    scene.add(demon.root);
    syncInk(scene, renderer.getPixelRatio());
  });

  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), ink);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(1.3, 0.8, 1);
  pool.position.y = 0.002;
  scene.add(pool);

  const drop = canvasTexture(
    64,
    64,
    (ctx, w) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    },
    { color: false },
  );
  const spray = createParticles({ count: 360, blending: "normal", texture: drop });
  scene.add(spray.points);

  const hush = createSfx(overlay, { text: "……", crescendo: 0 });
  const vroom = createSfx(overlay, { text: "VRRRN!!", crescendo: 0.8 });
  const rip = createSfx(overlay, { text: "RIP", crescendo: 0.3, color: RED });

  const camRig = { distance: 5.1 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    spray.resize(stage.size.height, camera.fov, renderer.getPixelRatio());
    camRig.distance = aspect < 1.1 ? 5.1 / (aspect / 1.1) ** 0.8 : 5.1;
  });
  const lookAt = new THREE.Vector3(0, 0.98, 0);
  const tmp = new THREE.Vector3();
  const chestPt = new THREE.Vector3();
  const fistPt = new THREE.Vector3();
  const toScreen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (-tmp.y * 0.5 + 0.5) * 100];
  };
  let burstDone = false;

  const update = (time, dt) => {
    if (fired && firedAt === null) firedAt = staticMode ? time - DURATION : time;
    if (!fired) {
      firedAt = null;
      burstDone = false;
    }
    const t = firedAt === null ? 0 : clamp01((time - firedAt) / DURATION);
    const go = firedAt !== null;
    if (!denji) return; // bodies still loading

    // Pose through the beats.
    const draw = segment(t, 0, 0.15);
    const yank = easeOutCubic(segment(t, 0.15, 0.3));
    const settle = easeOutBack(segment(t, 0.62, 0.95));
    let pose = blendPose(REST, DRAW, easeInOutCubic(draw));
    pose = blendPose(pose, YANK, yank);
    pose = blendPose(pose, STANCE, settle);
    const breathe = go ? 0 : Math.sin(time * 1.6) * 0.03;
    pose.spine = [pose.spine[0] + breathe, pose.spine[1], pose.spine[2]];
    denji.apply(pose);
    const shake = go && !staticMode ? 0.012 * segment(t, 0.4, 0.6) : 0;
    denji.root.position.set(Math.sin(time * 83) * shake, 0, Math.sin(time * 61) * shake);
    denji.root.updateMatrixWorld(true);

    // The change: human head out, the chainsaw head and the bars in; the
    // engine catches, the jaw drops open on the roar, and he bleeds for it.
    const change = easeOutBack(segment(t, 0.42, 0.72));
    denji.setForm(change, easeOutCubic(segment(t, 0.48, 0.8)));
    denji.setBlades(easeOutCubic(segment(t, 0.52, 0.85)), easeOutCubic(segment(t, 0.57, 0.85)));
    denji.setRev(go ? segment(t, 0.6, 0.9) : 0);
    denji.setMouth(go ? lerp(0.1, 0.75, easeOutCubic(segment(t, 0.62, 0.78))) : 0.1);
    denji.setBlood(go ? 0.75 * easeOutCubic(segment(t, 0.5, 0.75)) : 0);
    denji.update(time, dt);

    // Cord: the grip in his fist, the cord out of his chest to it; once he
    // lets go it snaps home to his sternum.
    denji.cordAnchor(chestPt);
    const held = 1 - easeOutCubic(segment(t, 0.42, 0.5));
    denji.setCord(held, denji.fistPoint("r", fistPt));

    // The demon looms, then reels when the blades come out at him.
    if (demon) {
      const reel = go ? easeOutBack(segment(t, 0.55, 0.75)) : 0;
      const loom = Math.sin(time * 1.3) * 0.04;
      const pose = blendPose(DEMON_LOOM, DEMON_REEL, reel);
      pose.spine = [pose.spine[0] + loom, pose.spine[1], pose.spine[2]];
      demon.apply(pose);
    }

    // Blood when the blades tear out.
    if (go && !burstDone && t >= 0.5 && dt > 0) {
      burstDone = true;
      const sources = [denji.headBlade, ...denji.armBlades].map((b) => b.group.getWorldPosition(new THREE.Vector3()));
      sources.forEach((p, s) => {
        for (let i = 0; i < 60; i++) {
          spray.emit({
            position: [p.x, p.y, p.z],
            velocity: [(hash(i + s * 61) - 0.5) * 5, 1 + hash(i * 3 + s) * 4, (hash(i * 7 + s) - 0.3) * 4],
            life: 0.8 + hash(i + 2) * 0.6,
            size: 0.04 + hash(i + 9) * 0.07,
            gravity: 9.8,
            drag: 0.5,
            color: i % 5 ? RED : INK,
          });
        }
      });
    }
    spray.step(dt);

    // The page: breathe while armed; flash negative on the yank; lines roar after.
    const flash = segment(t, 0.3, 0.33) * (1 - segment(t, 0.4, 0.44));
    const u = backdrop.material.uniforms;
    u.uInvert.value = flash > 0.5 ? 1 : 0;
    u.uSeed.value = Math.floor(time * (go ? 12 : 6));
    u.uIntensity.value = go ? lerp(0.7, 1.5, segment(t, 0.4, 0.8)) : 0.55 + Math.sin(time * 1.6) * 0.08;
    u.uSplash.value = go ? 1 : 0;
    u.uSpread.value = 0.6 + easeOutCubic(segment(t, 0.45, 0.85)) * 0.7;
    const [fx, fy] = toScreen(tmp.set(0, 1.55, 0).applyMatrix4(denji.root.matrixWorld));
    u.uFocus.value.set(fx / 100, 1 - fy / 100);

    // Camera: low, slowly closing; on the change it drops lower and punches in.
    const dive = easeOutCubic(segment(t, 0.4, 0.9));
    const orbit = -0.32 + Math.sin(time * 0.15) * 0.05 + pointer.x * 0.12;
    tmp.set(Math.sin(orbit), lerp(0.12, -0.02, dive) + pointer.y * 0.05, Math.cos(orbit)).normalize();
    camera.position.copy(tmp).multiplyScalar(camRig.distance - dive * 0.7).add(lookAt);
    camera.up.set(0, 1, 0).applyAxisAngle(tmp, dive * 0.1);
    camera.lookAt(lookAt);

    // Lettering.
    const [cx, cy] = toScreen(chestPt);
    hush.update({ x: cx + 16, y: cy - 22, size: 6, rotate: 0, opacity: go ? 1 - segment(t, 0, 0.1) : 0.8, boil: Math.floor(time * 4), jitter: 0.02 });
    const ripIn = segment(t, 0.17, 0.26);
    rip.update({ x: cx - 18, y: cy + 4, size: 8, rotate: -14, opacity: go ? ripIn * (1 - segment(t, 0.45, 0.55)) : 0, scale: lerp(2, 1, easeOutBack(ripIn)), boil: Math.floor(time * 12) });
    const slam = segment(t, 0.62, 0.8);
    vroom.update({
      x: 79,
      y: 9,
      size: 9.5,
      rotate: -9,
      opacity: go ? Math.min(1, slam * 4) : 0,
      scale: lerp(2.3, 1, easeOutBack(slam)),
      boil: Math.floor(time * 12),
      jitter: 0.08,
      shake: go && !staticMode ? [Math.sin(time * 97) * 5, Math.sin(time * 89) * 4] : [0, 0],
    });
  };

  // The show's look: lit like a frame of it, not printed like a page.
  setInkStyle(scene, { film: true, shade: "#8a6a9a" });
  ready.then(() => setInkStyle(scene, { film: true, shade: "#8a6a9a" }));

  return {
    ready,
    update,
    setProps(next) {
      fired = Boolean(next.fired);
    },
    dispose() {
      unsubscribeResize();
      denji?.dispose();
      [hush, vroom, rip].forEach((s) => s.dispose());
    },
  };
};
