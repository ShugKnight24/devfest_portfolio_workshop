import * as THREE from "three";
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createCaption, createSfx } from "../sfx";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, seat, shotAt } from "../rezeKit";

/**
 * first glance — they run into each other, and can't wait to again.
 *
 *   0  – 6    the storm: Denji runs for cover
 *   6  – 10   the booth: round to its open front, in, shaking off the rain
 *   10 – 14   she runs in after him, the same way
 *   14 – 18.5 he coughs, and a daisy comes up out of his mouth — the one he
 *             swallowed earlier; he pulls it out and offers it
 *   18.5– 21.6 she takes it, holds it low, and laughs
 *   21.6– 24  her eyes, close: green, fixed on him, like a girl with a crush
 *             (the last flicker says it is not quite that)
 *   24 – 26   iris out on her
 *   26 – 33   next morning: her café, the daisy in a cup on the counter
 *   33 – 40   the two of them across the counter; fade
 *
 * Loops under the song. Captions are original lines.
 */

const CYCLE = 40;
const STATIC_TIME = 20.5;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const jog = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.2, 0, 0],
    head: [-0.1, 0, 0],
    lShoulder: [-0.7 * s - 0.2, 0, 0.12],
    lElbow: [-1.4, 0, 0],
    rShoulder: [0.7 * s - 0.2, 0, -0.12],
    rElbow: [-1.4, 0, 0],
    lHip: [0.8 * s - 0.15, 0, 0.05],
    lKnee: [Math.max(0, -s) * 1.1 + 0.15, 0, 0],
    rHip: [-0.8 * s - 0.15, 0, -0.05],
    rKnee: [Math.max(0, s) * 1.1 + 0.15, 0, 0],
    lift: -0.03 + Math.abs(Math.cos(p)) * 0.03,
  };
};
// Shaking the rain off: hunched, arms crossed, the head going.
const SHAKE = (t) => ({
  spine: [0.25, Math.sin(t * 18) * 0.06, 0],
  head: [0.2, Math.sin(t * 22) * 0.35, 0],
  lShoulder: [-0.9, 0, 0.5],
  lElbow: [-1.9, 0, 0],
  rShoulder: [-0.9, 0, -0.5],
  rElbow: [-1.9, 0, 0],
});
const WIPE_HAIR = { ...STAND, head: [0.15, 0, 0], lShoulder: [-2.3, 0, 0.5], lElbow: [-1.6, 0, 0], rShoulder: [-0.2, 0, -0.2] };
const COUGH = { spine: [0.35, 0, 0], head: [0.4, 0, 0], rShoulder: [-1.35, 0, -0.35], rElbow: [-2.25, 0.25, 0], lShoulder: [-0.4, 0, 0.3], lElbow: [-1.2, 0, 0] };
const OFFER = { spine: [0.05, 0, 0], head: [0.1, -0.1, 0], rShoulder: [-1.25, 0.35, -0.15], rElbow: [-0.35, 0, 0], lShoulder: [0, 0, 0.12] };
const TAKE = { ...STAND, head: [0.15, 0.15, 0], lShoulder: [-1.15, -0.3, 0.1], lElbow: [-0.6, 0, 0] };
// The daisy held low at her chest, so it never covers her face.
const LAUGH = (t) => ({
  spine: [-0.08 + Math.sin(t * 9) * 0.03, 0, 0],
  head: [-0.22 + Math.sin(t * 11) * 0.05, 0.1, 0.12],
  lShoulder: [-0.55, -0.2, 0.15],
  lElbow: [-1.45, 0, 0],
  rShoulder: [-0.5, 0, -0.35],
  rElbow: [-1.5, 0, 0],
});
const SIT = { spine: [0.08, 0, 0], head: [-0.05, 0, 0], lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKnee: [1.45, 0, 0], rKnee: [1.45, 0, 0], lShoulder: [-0.7, 0, 0.2], lElbow: [-1.1, 0, 0], rShoulder: [-0.7, 0, -0.2], rElbow: [-1.1, 0, 0] };
const LEAN = (t) => ({
  spine: [0.42, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.42 + Math.sin(t * 1.3) * 0.04, Math.sin(t * 0.8) * 0.08, 0.1],
  lShoulder: [-1.05, 0, 0.35],
  lElbow: [-1.3, 0, 0],
  rShoulder: [-1.05, 0, -0.35],
  rElbow: [-1.3, 0, 0],
});

const SHOTS = [
  { t: 0, id: "run" },
  { t: 6, id: "duck" },
  { t: 10, id: "her" },
  { t: 14, id: "cough" },
  { t: 18.5, id: "take" },
  { t: 24, id: "iris" },
  { t: 26, id: "cafe" },
  { t: 33, id: "counter" },
];

export const createFirstGlanceScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe"]);
  const cast = createCast(w, { chainsaw: false, daisy: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  const hurk = createSfx(overlay, { text: "HURK!", crescendo: 0.3 });
  const haha = createSfx(overlay, { text: "AHAHA!", crescendo: 0.3 });

  // Her eyes, close: a manga strip across the frame. Green, lashes, a blush;
  // the highlights are what make it a crush, and they go out for a beat at the end.
  const eye = (cx, flip) => `<g transform="translate(${cx} 52) scale(${flip * 0.8} 0.8)">
      <path d="M-34 4 Q-6 -24 34 -6 Q8 22 -34 4 Z" fill="#fbf6ee"/>
      <clipPath id="fg-eye-${cx}"><path d="M-34 4 Q-6 -24 34 -6 Q8 22 -34 4 Z"/></clipPath>
      <g clip-path="url(#fg-eye-${cx})">
        <circle cx="2" cy="-2" r="17" fill="url(#fg-green)"/>
        <circle cx="2" cy="-2" r="17" fill="none" stroke="#0e3b24" stroke-width="2"/>
        <ellipse class="fg-pupil" cx="2" cy="-1" rx="6.5" ry="8" fill="#0b1a12"/>
        <g class="fg-shine"><ellipse cx="-5" cy="-9" rx="5" ry="3.6" fill="#fff"/><circle cx="9" cy="5" r="2.2" fill="#fff"/></g>
      </g>
      <path d="M-38 6 Q-8 -30 38 -8" fill="none" stroke="#141014" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 -11 l9 -6 M34 -7 l9 -3" stroke="#141014" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-26 14 Q4 22 30 2" fill="none" stroke="#141014" stroke-width="1.4"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M${-14 + i * 7} 30 l-4 6" stroke="#e36a7a" stroke-width="1.6" stroke-linecap="round"/>`).join("")}
    </g>`;
  const crush = cuts.el({ inset: "0", display: "none", background: "rgb(13 12 12 / 0.55)" });
  crush.innerHTML = `<div class="fg-band" style="position:absolute;left:0;right:0;top:30%;height:40%;background:#f3e7e2;border-top:0.5vmin solid #0d0c0c;border-bottom:0.5vmin solid #0d0c0c;overflow:hidden;transform-origin:50% 50%">
    <svg viewBox="0 22 200 58" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
      <defs><radialGradient id="fg-green" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#8fe3a8"/><stop offset="0.55" stop-color="#2f9a5c"/><stop offset="1" stop-color="#0f4a2b"/></radialGradient></defs>
      <path d="M0 0 H200 V30 Q170 40 150 28 Q128 42 100 26 Q74 42 52 28 Q30 40 0 30 Z" fill="#2a1f33"/>
      ${eye(58, -1)}${eye(142, 1)}
    </svg>
  </div>`;
  const band = crush.querySelector(".fg-band");
  const shines = [...crush.querySelectorAll(".fg-shine")];
  const pupils = [...crush.querySelectorAll(".fg-pupil")];
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze, daisy } = cast;
    if (!denji) return;
    const { shot, s, u } = shotAt(SHOTS, c);
    let cuts_ = { iris: 1, flash: 0, black: 0, bars: 0.35 };
    let text = "";
    let textR = "";

    if (c < 24) {
      // ── The storm and the booth ──
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(c < 10 ? LIGHT.stormWarm : LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.75, disc: [0.8, 0.82, 0], seed: Math.floor(time * 10) });
      // The booth's sides are glass and its back is a wall: both of them come
      // round to the open front (+z) and step in, never through a pane.
      const him0 = at("street", -9, 0, 1.6);
      const himDoor = at("street", -0.75, 0, 1.6);
      const himBooth = at("street", -0.32, 0, 0.12);
      const herBooth = at("street", 0.3, 0, -0.05);

      // Denji
      if (c < 6.5) {
        denji.root.position.lerpVectors(him0, himDoor, segment(c, 0, 6.5));
        denji.root.rotation.y = Math.PI / 2;
        denji.apply(jog(time * 9));
      } else {
        const k = easeInOutCubic(segment(c, 6.5, 7.6));
        denji.root.position.lerpVectors(himDoor, himBooth, k);
        // Turn in toward the door, then round to face her side.
        denji.root.rotation.y = k < 0.6 ? lerp(Math.PI / 2, Math.PI, k / 0.6) : lerp(Math.PI, Math.PI * 2 + 0.35, (k - 0.6) / 0.4);
        let pose = blendPose(jog(time * 9), SHAKE(time), k);
        if (c > 9) pose = blendPose(pose, WIPE_HAIR, easeInOutCubic(segment(c, 9, 10)));
        if (c > 11.5) pose = blendPose(pose, STAND, easeInOutCubic(segment(c, 11.5, 12.5)));
        if (c > 14) pose = blendPose(pose, COUGH, easeOutCubic(segment(c, 14, 14.6)));
        if (c > 16) pose = blendPose(pose, OFFER, easeInOutCubic(segment(c, 16, 17)));
        if (c > 20) pose = blendPose(pose, STAND, easeInOutCubic(segment(c, 20, 21.2)));
        if (c > 14.2 && c < 15.6) pose.spine = [0.35 + Math.sin(time * 30) * 0.08, 0, 0];
        denji.apply(pose);
      }

      // Reze
      if (c < 10) {
        reze.root.position.copy(at("street", 7, 0, 1.6));
      } else {
        const herDoor = at("street", 0.6, 0, 1.6);
        const run = segment(c, 10, 11.5);
        const step = easeInOutCubic(segment(c, 11.5, 12.3));
        if (run < 1) reze.root.position.lerpVectors(at("street", 4.5, 0, 1.6), herDoor, easeOutCubic(run));
        else reze.root.position.lerpVectors(herDoor, herBooth, step);
        reze.root.rotation.y = run < 1 ? -Math.PI / 2 : lerp(-Math.PI * 0.9, -0.45, step);
        let pose = blendPose(jog(time * 9), STAND, easeInOutCubic(segment(c, 11.4, 12.4)));
        if (c > 12.4) pose = blendPose(pose, WIPE_HAIR, easeInOutCubic(segment(c, 12.4, 13.2)) * (1 - segment(c, 13.6, 14.4)));
        if (c > 17.6) pose = blendPose(pose, TAKE, easeInOutCubic(segment(c, 17.6, 18.6)));
        if (c > 19.6) pose = blendPose(pose, LAUGH(time), easeInOutCubic(segment(c, 19.6, 20.4)));
        reze.root.rotation.y = c > 12.3 ? lerp(-0.45, -0.75, easeInOutCubic(segment(c, 14, 15))) : reze.root.rotation.y;
        reze.apply(pose);
      }
      denji.root.updateMatrixWorld(true);
      reze.root.updateMatrixWorld(true);

      // The daisy: out of his mouth, into his hand, into hers.
      const hisHand = denji.model.getObjectByName("hand_r");
      const herHand = reze.model.getObjectByName("hand_l");
      daisy.visible = c > 14.7;
      daisy.scale.setScalar(1.6);
      if (c < 16.1) {
        // Up out of his mouth, head first, the stem still in his teeth; then
        // his hand closes on it and draws it out.
        const yaw = denji.root.rotation.y;
        const fwd = tmp.set(Math.sin(yaw), 0, Math.cos(yaw));
        const mouthAt = denji.bones.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.07, 0)).addScaledVector(fwd, 0.1);
        const emerge = easeOutCubic(segment(c, 14.7, 15.3));
        const inMouth = mouthAt.clone().addScaledVector(fwd, 0.05 + emerge * 0.17);
        const inHand = hisHand.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.1, 0));
        daisy.position.lerpVectors(inMouth, inHand, easeInOutCubic(segment(c, 15.5, 16.1)));
        daisy.rotation.set(Math.PI / 2 - 0.2, yaw, 0);
      } else {
        if (c < 18.6) hisHand.getWorldPosition(daisy.position);
        else herHand.getWorldPosition(daisy.position);
        daisy.position.y += 0.1;
        daisy.rotation.set(Math.PI / 2.6, c < 18.6 ? 0.4 : -0.5, 0);
      }

      // Cameras
      if (shot.id === "run") {
        cam(tmp.copy(denji.root.position).add(new THREE.Vector3(0.9, 1.35, 3.6)), denji.root.position.clone().add(new THREE.Vector3(0.6, 1.0, -0.2)));
        text = "Caught in the rain.";
      } else if (shot.id === "duck") {
        cam(at("street", 1.8, 1.5, 4.4), at("street", -0.3, 1.15, 0));
      } else if (shot.id === "her") {
        cam(at("street", 2.6, 1.35, 3.6).lerp(at("street", 1.2, 1.4, 2.8), easeInOutCubic(u)), at("street", 0.2, 1.2, 0));
        text = "Then someone else ran in.";
      } else if (shot.id === "cough") {
        denji.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.9, -0.15, 1.5)), tmp.clone().add(new THREE.Vector3(0.15, -0.25, 0)));
        if (c > 15) text = "A daisy. He'd swallowed it earlier.";
      } else if (shot.id === "take") {
        const k = easeInOutCubic(u);
        cam(at("street", 0.9, 1.45, 2.3).lerp(at("street", 0.55, 1.5, 1.7), k), at("street", 0.05, 1.3, 0));
        textR = "A flower he'd swallowed. She kept it anyway.";
      } else {
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(-0.5, 0, 1.2)), tmp);
        cuts_.iris = 1 - easeInOutCubic(segment(c, 24, 25.6));
        cuts_.at = [50, 42];
      }

      const ha = segment(c, 19.8, 20.1);
      haha.update({ x: 72, y: 24, size: 6.5, rotate: 8, opacity: c > 19.8 && c < 21.5 ? Math.min(1, ha * 4) : 0, scale: lerp(1.6, 1, easeOutBack(ha)) * (1 + Math.sin(time * 18) * 0.03), boil: Math.floor(time * 10), jitter: 0.05 });
      const slam = segment(c, 14.6, 14.9);
      hurk.update({ x: 64, y: 30, size: 8, rotate: -8, opacity: c > 14.6 && c < 16 ? Math.min(1, slam * 4) : 0, scale: lerp(1.8, 1, easeOutBack(slam)), boil: Math.floor(time * 12), jitter: 0.06 });
    } else {
      // ── Next morning: her café ──
      hurk.update({ opacity: 0 });
      haha.update({ opacity: 0 });
      lot.show("cafe");
      // Morning sun through the window, side-on across the counter.
      w.light(0.85, 0.55, 0.1);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      const cafe = lot.sets.cafe;
      reze.root.position.copy(cafe.spots.her).add(cafe.origin);
      reze.root.rotation.y = 0;
      reze.apply(blendPose(STAND, LEAN(time), easeInOutCubic(segment(c, 27.5, 29))));
      denji.root.position.copy(cafe.spots.him).add(cafe.origin);
      denji.root.position.y = 0.32;
      denji.root.rotation.y = Math.PI;
      denji.apply(SIT);
      seat(denji, cafe.spots.stool.clone().add(cafe.origin));
      // His daisy, stood in her vase on the counter with two of hers: stems
      // down inside the glass, heads just over the rim.
      daisy.visible = true;
      daisy.scale.setScalar(1.4);
      daisy.position.copy(cafe.spots.vase).add(cafe.origin).add(new THREE.Vector3(0, 0.27, 0));
      daisy.rotation.set(0.12, 0, 0.1);

      if (shot.id === "cafe") {
        cuts_.iris = easeInOutCubic(segment(c, 26, 27.4));
        cuts_.at = [50, 50];
        const k = easeInOutCubic(segment(c, 26, 33));
        cam(at("cafe", 3.2, 2.0, 4.2).lerp(at("cafe", 2.2, 1.7, 3.0), k), at("cafe", -1.0, 1.15, -0.5));
        text = "Next morning. Her café.";
      } else {
        const k = easeInOutCubic(u);
        // Side-on across the counter: her leaning in, him on the stool.
        cam(at("cafe", 1.7, 1.62, -0.55).lerp(at("cafe", 1.3, 1.58, -0.6), k), at("cafe", -1.0, 1.32, -0.55));
        textR = "He couldn't wait to come back.";
        cuts_.black = segment(c, 38.6, 40);
      }
    }

    // Her eyes, close.
    const eyesOn = c >= 21.6 && c < 24;
    crush.style.display = eyesOn ? "block" : "none";
    if (eyesOn) {
      const open = easeOutCubic(segment(c, 21.6, 21.9)) * (1 - easeInOutCubic(segment(c, 23.75, 24)));
      band.style.transform = `scaleY(${Math.max(0.001, open)})`;
      // The crush is in the shine. For a moment near the end it goes out and
      // the pupils tighten: not what it seems.
      const cold = c > 23.2 && c < 23.55;
      shines.forEach((g) => (g.style.opacity = cold ? "0" : String(0.85 + Math.sin(time * 7) * 0.15)));
      pupils.forEach((p) => p.setAttribute("rx", cold ? "3" : "6.5"));
      text = "";
      textR = "";
    }

    fx.step(dt);
    cuts.update(cuts_);
    cap.update({ text, size: 2.3 });
    capR.update({ text: textR, size: 2.3 });
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
      [cap, capR, hurk, haha, cuts].forEach((x) => x.dispose());
    },
  };
};
