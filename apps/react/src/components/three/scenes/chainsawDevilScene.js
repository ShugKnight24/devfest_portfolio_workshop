import * as THREE from "three";
import { OUTFITS } from "../rezeKit";
import { clamp01, easeOutBack, easeOutCubic, hash, lerp, segment } from "../kit";
import { PAPER, RED, inkMaterial, mangaBackdrop, outlineMaterial, syncInk, setInkStyle } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { aim, createBlade, createChainsawHead } from "../chainsawParts";
import { createSfx } from "../sfx";

/**
 * The Chainsaw Devil, true form — the finale. The page turns negative: ink
 * ground, paper lines, and a giant in the middle of it, hunched, blades for
 * arms, cords trailing from his waist like a pulled-out engine. Three lesser
 * demons crouch in front of him for scale.
 *
 *   armed   he breathes; cords sway; the chains tick over
 *   fired   he rears up, arms wide, every chain screams
 */

const DURATION = 2.0;

const HUNCH = {
  spine: [0.42, 0, 0],
  chest: [0.22, 0, 0],
  neck: [-0.2, 0, 0],
  head: [-0.28, 0, 0],
  lShoulder: [-0.55, 0, 0.42],
  lElbow: [-0.55, 0, 0],
  rShoulder: [-0.55, 0, -0.42],
  rElbow: [-0.55, 0, 0],
  lHip: [-0.35, 0, 0.22],
  lKnee: [0.7, 0, 0],
  rHip: [-0.3, 0, -0.22],
  rKnee: [0.62, 0, 0],
  lift: -0.12,
};
const REAR = {
  spine: [-0.12, 0, 0],
  chest: [-0.18, 0, 0],
  neck: [-0.08, 0, 0],
  head: [-0.12, 0, 0],
  lShoulder: [-0.35, 0, 2.15],
  lElbow: [-0.7, 0, 0],
  rShoulder: [-0.35, 0, -2.15],
  rElbow: [-0.7, 0, 0],
  lHip: [-0.25, 0, 0.28],
  lKnee: [0.4, 0, 0],
  rHip: [-0.2, 0, -0.28],
  rKnee: [0.35, 0, 0],
  lift: -0.06,
};
// Lesser demons at his feet: hunched, claws out, heads craned up at him.
const ONLOOKER = {
  spine: [0.35, 0, 0],
  chest: [0.1, 0, 0],
  neck: [-0.35, 0, 0],
  head: [-0.45, 0, 0],
  lShoulder: [-0.7, 0, 0.55],
  lElbow: [-0.9, 0, 0],
  rShoulder: [-0.7, 0, -0.55],
  rElbow: [-0.9, 0, 0],
  lHip: [-0.4, 0, 0.25],
  lKnee: [0.75, 0, 0],
  rHip: [-0.35, 0, -0.25],
  rKnee: [0.7, 0, 0],
  lift: -0.14,
};

export const createChainsawDevilScene = (stage, { props = {}, overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  let fired = Boolean(props.fired);
  let firedAt = null;
  let chain = 0;

  const backdrop = mangaBackdrop();
  backdrop.material.uniforms.uInvert.value = 1;
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  const lineThin = outlineMaterial(0.7);
  // On a black page the giant is one mass of ink, cut out by a paper rim.
  const hide = inkMaterial({ tone: 0.22, rim: 1.8, spec: 0 });
  hide.uniforms.uRimColor.value.set(PAPER);
  const skin = inkMaterial({ tint: "#d65a24", tone: 0.92, rim: 1.4, spec: 0 });
  skin.uniforms.uRimColor.value.set(PAPER);
  const steel = inkMaterial({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 });
  const rail = inkMaterial({ tint: "#2b2b2b", tone: 1.1, rim: 0.8 });
  const ink = inkMaterial({ flat: true });
  const bone = inkMaterial({ tone: 1.2, rim: 0 });
  const glow = inkMaterial({ tint: RED, tone: 2, rim: 0, spec: 0 });
  const cordMat = inkMaterial({ tone: 0.7, rim: 1.2, spec: 0 });
  cordMat.uniforms.uRimColor.value.set(RED);

  // The giant: the Quaternius Superhero body (CC0) at three times a man's
  // height, one mass of ink. His head bone collapses; the chainsaw skull and
  // its horn blades ride the neck, and blades ride the forearms.
  const GIANT = 5.2;
  const HEAD_SCALE = 3.6;
  const BLADE_SCALE = 2.6;
  let devil = null;
  const { head, blade: crown } = createChainsawHead({ skin, steel, rail, ink, bone, line, lineThin, scale: 1, bladeLength: 0.8 });
  // Red eyes over the ink holes.
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), glow);
    eye.position.set(s * 0.075, 0.19, 0.15);
    head.add(eye);
  }
  // Horn blades: two more bars swept back off the skull.
  const horns = [-1, 1].map((s) => {
    const b = createBlade({ length: 0.45, radius: 0.06, steel, rail, ink, line: lineThin, teeth: 18, thickness: 0.03 });
    b.group.position.set(s * 0.13, 0.3, -0.02);
    aim(b.group, new THREE.Vector3(s * 0.75, 0.35, -0.55), new THREE.Vector3(0, 0, 1));
    head.add(b.group);
    return b;
  });
  const arms = [0, 1].map(() => createBlade({ length: 0.85, radius: 0.08, steel, rail, ink, line: lineThin, teeth: 26, thickness: 0.035 }));
  const blades = [crown, ...horns, ...arms];

  // Three lesser demons, small and white, in the foreground: horned, hunched.
  const SPOTS = [
    [-1.3, 1.5],
    [-0.95, 1.7],
    [1.25, 1.6],
  ];
  const ready = Promise.all([
    createModelFigure({ height: GIANT, line, ink: { tone: 0.6, rim: 1.8, rimColor: PAPER }, outfit: OUTFITS.denji }),
    ...SPOTS.map((_, i) => createModelFigure({ height: 1.5 + i * 0.08, horns: true, line, ink: { tone: 0.5, rim: 1.2, rimColor: PAPER }, outfit: OUTFITS.devil })),
  ]).then(([giant, ...crowd]) => {
    devil = giant;
    scene.add(devil.root);
    devil.apply({});
    devil.root.updateMatrixWorld(true);
    const neck = devil.model.getObjectByName("neck_01") ?? devil.bones.neck;
    head.position.copy(devil.bones.neck.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, -0.12, 0.05));
    head.scale.setScalar(HEAD_SCALE);
    scene.add(head);
    neck.attach(head);
    devil.bones.head.scale.setScalar(0.001);
    arms.forEach((blade, i) => {
      const hand = devil.model.getObjectByName(i ? "hand_r" : "hand_l");
      blade.group.position.copy(hand.getWorldPosition(new THREE.Vector3()));
      blade.group.scale.setScalar(BLADE_SCALE);
      aim(blade.group, new THREE.Vector3(0, -1, 0.15), new THREE.Vector3(0, 0, 1));
      scene.add(blade.group);
      devil.bones[i ? "rElbow" : "lElbow"].attach(blade.group);
    });
    crowd.forEach((f, i) => {
      const [x, z] = SPOTS[i];
      f.root.position.set(x, 0, z);
      f.root.rotation.y = Math.PI + (x < 0 ? -0.2 : 0.25);
      f.apply(ONLOOKER);
      scene.add(f.root);
    });
    syncInk(scene, renderer.getPixelRatio());
  });

  // Cords trailing from the waist: the engine's guts, pulled out and swaying.
  const CORDS = Array.from({ length: 7 }, (_, i) => ({
    side: (i / 6) * 2 - 1,
    phase: hash(i) * 6,
    len: 1.6 + hash(i + 3) * 1.4,
    mesh: (() => {
      const m = new THREE.Mesh(new THREE.BufferGeometry(), cordMat);
      scene.add(m);
      return m;
    })(),
  }));
  const anchor = new THREE.Vector3();

  const roar = createSfx(overlay, { text: "VRRRRRRMMM!!!", crescendo: 1.1 });
  const hum = createSfx(overlay, { text: "vrrr…", crescendo: 0.2, color: PAPER });

  const camRig = { distance: 12 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    camRig.distance = aspect < 1.2 ? 12 / (aspect / 1.2) ** 0.8 : 12;
  });
  const lookAt = new THREE.Vector3(0, 3.0, 0);
  const tmp = new THREE.Vector3();
  const toScreen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (-tmp.y * 0.5 + 0.5) * 100];
  };

  const update = (time, dt) => {
    if (fired && firedAt === null) firedAt = staticMode ? time - DURATION : time;
    if (!fired) firedAt = null;
    const t = firedAt === null ? 0 : clamp01((time - firedAt) / DURATION);
    const go = firedAt !== null;
    if (!devil) return; // bodies still loading

    const rear = easeOutBack(segment(t, 0.05, 0.45));
    const breathe = Math.sin(time * 1.1) * 0.04;
    const pose = blendPose(HUNCH, REAR, rear);
    pose.spine = [pose.spine[0] + breathe, pose.spine[1] + Math.sin(time * 0.4) * 0.05, pose.spine[2]];
    devil.apply(pose);
    const quake = go && !staticMode ? 0.04 * segment(t, 0.2, 0.5) : 0;
    devil.root.position.set(Math.sin(time * 70) * quake, 0, Math.sin(time * 53) * quake);
    devil.root.updateMatrixWorld(true);

    chain += (go ? lerp(1, 12, segment(t, 0.1, 0.5)) : 0.6) * dt;
    blades.forEach((b, i) => {
      b.extend(1);
      b.run(chain * (1 + i * 0.07));
    });

    // Cords hang from the hips and coil away behind him, swaying.
    devil.bones.hips.getWorldPosition(anchor);
    CORDS.forEach((c) => {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        const sway = Math.sin(time * 1.3 + c.phase + u * 3) * 0.25 * u * (1 + rear);
        pts.push(
          new THREE.Vector3(
            anchor.x + c.side * (0.25 + u * 1.4) + sway,
            Math.max(0.05, anchor.y - u * c.len * 0.7 + Math.sin(u * Math.PI) * 0.3),
            anchor.z - u * c.len * 0.6 + Math.cos(time + c.phase) * 0.1 * u,
          ),
        );
      }
      c.mesh.geometry.dispose();
      c.mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 8);
    });

    // The page: negative, lines boiling; on the roar they thicken and a red
    // sun opens behind his head.
    const u = backdrop.material.uniforms;
    u.uSeed.value = Math.floor(time * (go ? 12 : 6));
    u.uIntensity.value = go ? lerp(0.8, 1.6, rear) : 0.75;
    u.uSplash.value = 1;
    u.uSpread.value = lerp(0.65, 1.25, easeOutCubic(segment(t, 0.1, 0.6)));
    const headPt = head.getWorldPosition(new THREE.Vector3());
    const [hx, hy] = toScreen(headPt);
    u.uFocus.value.set(hx / 100, 1 - hy / 100);

    // Camera: a worm's-eye view up at him, slow drift; the roar shakes it.
    const orbit = 0.18 + Math.sin(time * 0.1) * 0.06 + pointer.x * 0.1;
    tmp.set(Math.sin(orbit), -0.12 + pointer.y * 0.04, Math.cos(orbit)).normalize();
    camera.position.copy(tmp).multiplyScalar(camRig.distance).add(lookAt);
    camera.position.y = Math.max(0.35, camera.position.y);
    if (go && !staticMode) {
      camera.position.x += Math.sin(time * 61) * 0.05 * (1 - segment(t, 0.6, 1));
      camera.position.y += Math.sin(time * 73) * 0.04 * (1 - segment(t, 0.6, 1));
    }
    camera.lookAt(lookAt);

    hum.update({ x: hx + 14, y: hy + 20, size: 5, rotate: -6, opacity: go ? 1 - segment(t, 0, 0.1) : 0.7, boil: Math.floor(time * 5), jitter: 0.04 });
    const slam = segment(t, 0.2, 0.45);
    roar.update({
      x: 50,
      y: 9,
      size: 8,
      rotate: -4,
      opacity: go ? Math.min(1, slam * 4) : 0,
      scale: lerp(2.4, 1, easeOutBack(slam)),
      boil: Math.floor(time * 12),
      jitter: 0.1,
      shake: go && !staticMode ? [Math.sin(time * 97) * 7, Math.sin(time * 89) * 6] : [0, 0],
    });
  };

  // The show's look: lit like a frame of it, not printed like a page.
  setInkStyle(scene, { film: true, shade: "#7a6a8a" });
  ready.then(() => setInkStyle(scene, { film: true, shade: "#7a6a8a" }));

  return {
    ready,
    update,
    setProps(next) {
      fired = Boolean(next.fired);
    },
    dispose() {
      unsubscribeResize();
      CORDS.forEach((c) => c.mesh.geometry.dispose());
      [roar, hum].forEach((s) => s.dispose());
    },
  };
};
