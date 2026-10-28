import * as THREE from "three";
import { OUTFITS } from "../rezeKit";
import { canvasTexture, clamp01, createParticles, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, segment } from "../kit";
import { INK, PAPER, RED, inkMaterial, mangaBackdrop, outlineMaterial, syncInk, setInkStyle } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { aim, createBlade, createChainsawHead } from "../chainsawParts";
import { createSfx } from "../sfx";

/**
 * Pull the Cord — Denji becomes Chainsaw Man. The talk's Act 3: commitment.
 *
 *   armed        Denji stands in the dark, fist closed on the starter cord in
 *                his chest; the page breathes, a low "...."
 *   0    -> 0.15 he draws the arm back
 *   0.15 -> 0.3  YANK: the cord rips out to arm's length
 *   0.3  -> 0.42 the page flashes to negative
 *   0.42 -> 0.8  the blades come: one out of the forehead, one out of each
 *                forearm, the human head gone under the Chainsaw Man skull
 *   0.8  -> 1    he drops into his stance; chains run; VRRRN!!
 *
 * Denji is a silhouette (ink, red rim); the chainsaw parts carry the detail.
 */

const DURATION = 2.2;

const REST = {
  spine: [0.05, 0, 0],
  head: [0.12, 0, 0],
  lShoulder: [0.05, 0, 0.12],
  lElbow: [-0.2, 0, 0],
  // Right fist closed on the cord handle at his sternum.
  rShoulder: [-1.15, 0, -0.35],
  rElbow: [-2.1, 0.3, 0],
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
  let chain = 0;

  const backdrop = mangaBackdrop();
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  const lineThin = outlineMaterial(0.7);
  const body = inkMaterial({ tone: 0.16, rim: 1.6, spec: 0 });
  const skin = inkMaterial({ tint: "#d65a24", tone: 0.92, rim: 1.2, spec: 0 });
  const steel = inkMaterial({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 });
  const rail = inkMaterial({ tint: "#2b2b2b", tone: 1.1, rim: 0.6 });
  const ink = inkMaterial({ flat: true });
  const bone = inkMaterial({ tone: 1.15, rim: 0.2 });
  const ropeMat = inkMaterial({ tone: 1.05, rim: 0.4 });

  // Denji: the Quaternius Superhero body (CC0), near-solid ink rimmed in red.
  // His own head is the model's; on the change the head bone collapses to
  // nothing and the chainsaw skull, riding the neck bone, takes its place.
  let denji = null;
  let demon = null;
  const { head: csmHead, blade: headBlade } = createChainsawHead({ skin, steel, rail, ink, bone, line, lineThin, scale: 1.15, bladeLength: 0.7 });
  const armBlades = ["lElbow", "rElbow"].map(() =>
    createBlade({ length: 0.62, radius: 0.07, steel, rail, ink, line: lineThin, teeth: 22, thickness: 0.03 }),
  );
  const ready = Promise.all([
    createModelFigure({ height: 1.82, hair: ["HairSimpleParted", "EyebrowsRegular"], line, ink: { tone: 0.78, rim: 1.4 }, outfit: OUTFITS.denji, fist: 0.6 }),
    // The demon he is about to fight: bigger, horned, rimmed in paper.
    createModelFigure({ height: 2.35, horns: true, line, ink: { tone: 0.55, rim: 1.3, rimColor: PAPER }, outfit: OUTFITS.devil }),
  ]).then(([figure, foe]) => {
    denji = figure;
    scene.add(denji.root);
    // Bind the chainsaw parts at rest, so they follow every pose after.
    denji.apply({});
    denji.root.updateMatrixWorld(true);
    const at = (bone) => denji.bones[bone].getWorldPosition(new THREE.Vector3());
    const neck = denji.model.getObjectByName("neck_01") ?? denji.bones.neck;
    csmHead.position.copy(at("neck"));
    scene.add(csmHead);
    neck.attach(csmHead);
    headScale.copy(csmHead.scale); // whatever undoes the bone chain's scale
    armBlades.forEach((blade, i) => {
      const elbow = denji.bones[i ? "rElbow" : "lElbow"];
      const hand = denji.model.getObjectByName(i ? "hand_r" : "hand_l");
      blade.group.position.copy(hand.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 0.05, -0.03));
      aim(blade.group, new THREE.Vector3(0, -1, 0.08), new THREE.Vector3(0, 0, 1));
      scene.add(blade.group);
      elbow.attach(blade.group);
    });
    hands.l = denji.model.getObjectByName("hand_l");
    hands.r = denji.model.getObjectByName("hand_r");

    demon = foe;
    demon.root.position.set(1.6, 0, -0.9);
    demon.root.rotation.y = Math.atan2(-1.6, 0.9);
    scene.add(demon.root);
    syncInk(scene, renderer.getPixelRatio());
  });
  const hands = { l: null, r: null };
  const headScale = new THREE.Vector3(1, 1, 1);

  // The starter cord: from his chest to his fist, rebuilt every frame.
  const cord = new THREE.Mesh(new THREE.BufferGeometry(), ropeMat);
  scene.add(cord);
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 10), ink);
  scene.add(handle);
  const cordCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());

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

    // The change: human head out, chainsaw skull and blades in.
    const change = easeOutBack(segment(t, 0.42, 0.72));
    denji.bones.head.scale.setScalar(change < 0.5 ? 1 : 0.001);
    csmHead.visible = change > 0.01;
    csmHead.scale.copy(headScale).multiplyScalar(Math.max(0.001, change));
    headBlade.extend(easeOutCubic(segment(t, 0.48, 0.8)));
    armBlades.forEach((b, i) => b.extend(easeOutCubic(segment(t, 0.52 + i * 0.05, 0.85))));
    chain += (go ? lerp(0, 9, segment(t, 0.6, 0.9)) : 0) * dt;
    headBlade.run(chain);
    armBlades.forEach((b) => b.run(chain * 1.1));

    // Cord: chest to fist while he holds it; it drops slack once he lets go.
    denji.bones.chest.getWorldPosition(chestPt).add(tmp.set(0.03, 0.05, 0.16).applyQuaternion(denji.root.quaternion));
    hands.r.getWorldPosition(fistPt);
    const held = 1 - segment(t, 0.42, 0.5);
    cord.visible = held > 0;
    handle.visible = held > 0;
    if (held > 0) {
      cordCurve.v0.copy(chestPt);
      cordCurve.v2.copy(fistPt);
      cordCurve.v1.lerpVectors(chestPt, fistPt, 0.5);
      cordCurve.v1.y -= lerp(0.12, 0, yank);
      cord.geometry.dispose();
      cord.geometry = new THREE.TubeGeometry(cordCurve, 24, 0.014, 6);
      handle.position.copy(fistPt);
      handle.quaternion.copy(denji.bones.rElbow.getWorldQuaternion(new THREE.Quaternion()));
      handle.rotateZ(Math.PI / 2);
    }

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
      const sources = [headBlade, ...armBlades].map((b) => b.group.getWorldPosition(new THREE.Vector3()));
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
      cord.geometry.dispose();
      [hush, vroom, rip].forEach((s) => s.dispose());
    },
  };
};
