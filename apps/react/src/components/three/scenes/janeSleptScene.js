import * as THREE from "three";
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createCaption, createSfx } from "../sfx";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, seat, shotAt } from "../rezeKit";

/**
 * Jane slept in the church — the girl from the café was never only that.
 *
 *   0  – 7    an empty chapel at night; she sits alone in a pew
 *   7  – 11   close: red glass on her face, her fingers find the pin
 *   11 – 12   cut
 *   12 – 21   the festival: lanterns, the two of them, the first fireworks
 *   21 – 27   face to face under the sky; they lean in
 *   27 – 29   she bites
 *   29 – 32   she pulls the pin
 *   32 – 34   the blast
 *   34 – 42   the Bomb Devil in the smoke; fireworks still going off
 *   42 – 44   black
 *
 * Captions are original lines.
 */

const CYCLE = 44;
const STATIC_TIME = 37;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const PEW = { spine: [0.18, 0, 0], head: [0.35, 0, 0], lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKnee: [1.5, 0, 0], rKnee: [1.5, 0, 0], lShoulder: [-0.15, 0, 0.12], lElbow: [-1.0, 0, 0], rShoulder: [-0.15, 0, -0.12], rElbow: [-1.0, 0, 0] };
const PEW_PIN = { ...PEW, head: [0.1, 0.25, 0], rShoulder: [-1.0, 0, -0.45], rElbow: [-2.35, 0.3, 0] };
const walk = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.05, 0, 0],
    lShoulder: [-0.3 * s, 0, 0.1],
    lElbow: [-0.4, 0, 0],
    rShoulder: [0.3 * s, 0, -0.1],
    rElbow: [-0.4, 0, 0],
    lHip: [0.45 * s - 0.05, 0, 0.03],
    lKnee: [Math.max(0, -s) * 0.6 + 0.05, 0, 0],
    rHip: [-0.45 * s - 0.05, 0, -0.03],
    rKnee: [Math.max(0, s) * 0.6 + 0.05, 0, 0],
  };
};
const LOOK_UP = { ...STAND, neck: [-0.3, 0, 0], head: [-0.35, 0, 0] };
const LEAN_IN = { spine: [0.15, 0, 0], neck: [0.1, 0, 0], head: [0.05, 0, 0], lShoulder: [-0.3, 0, 0.15], rShoulder: [-0.3, 0, -0.15], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] };
const HOLD = { ...LEAN_IN, lShoulder: [-1.2, -0.4, 0.2], lElbow: [-1.0, 0, 0], rShoulder: [-1.2, 0.4, -0.2], rElbow: [-1.0, 0, 0] };
const RECOIL = { spine: [-0.35, 0.2, 0], head: [-0.5, 0.3, 0], lShoulder: [-1.3, 0, 0.3], lElbow: [-1.9, 0, 0], rShoulder: [-0.2, 0, -0.6], rElbow: [-0.6, 0, 0], lHip: [-0.3, 0, 0], lKnee: [0.4, 0, 0] };
const PIN = { spine: [-0.05, 0, 0], head: [-0.18, 0, 0], lShoulder: [0.1, 0, 0.3], lElbow: [-0.3, 0, 0], rShoulder: [-1.05, 0, -0.45], rElbow: [-2.35, 0.3, 0] };
const YANKED = { ...PIN, rShoulder: [-2.2, 0, -0.9], rElbow: [-0.2, 0, 0] };
const DEVIL = (t) => ({
  spine: [-0.08, 0, 0],
  head: [-0.1 + Math.sin(t * 2) * 0.03, 0, 0],
  lShoulder: [-0.2, 0, 0.8],
  lElbow: [-0.5, 0, 0],
  rShoulder: [-0.2, 0, -0.8],
  rElbow: [-0.5, 0, 0],
  lHip: [0, 0, 0.12],
  rHip: [0, 0, -0.12],
});
const DOWN = { spine: [-0.9, 0, 0], head: [0.4, 0, 0], lShoulder: [-0.3, 0, 1.0], rShoulder: [-0.6, 0, -0.9], lHip: [-1.3, 0, 0.2], lKnee: [1.2, 0, 0], rHip: [-0.5, 0, -0.1], rKnee: [0.4, 0, 0], lift: -0.55 };

const SHOTS = [
  { t: 0, id: "chapel" },
  { t: 7, id: "pin-close" },
  { t: 11, id: "cut" },
  { t: 12, id: "festival" },
  { t: 21, id: "faces" },
  { t: 27, id: "bite" },
  { t: 29, id: "pull" },
  { t: 32, id: "blast" },
  { t: 34, id: "devil" },
];

export const createJaneSleptScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["church", "festival"]);
  const cast = createCast(w, { chainsaw: false, bomb: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  const crunch = createSfx(overlay, { text: "CRNCH!", crescendo: 0.4 });
  const tink = createSfx(overlay, { text: "tink", crescendo: 0, italic: false, weight: 700 });
  const boom = createSfx(overlay, { text: "BOOM!!", crescendo: 0.8 });

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  const state = { rocket: 0, bit: false, blasted: false };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze, pin } = cast;
    if (!denji) return;
    const { shot, u } = shotAt(SHOTS, c);
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#fff6ea" };
    let text = "";
    let textR = "";
    cast.untransform();
    pin.visible = true;

    if (c < 11) {
      // ── The chapel ──
      lot.show("church");
      w.light(0.9, 0.45, 0.3); // through the red glass
      w.palette(LIGHT.church);
      w.page({ mode: "still" });
      denji.root.position.copy(at("church", 0, -20, 0)); // not in this scene
      reze.root.position.copy(at("church", -1.6, 0.14, -1.6));
      reze.root.rotation.set(0, Math.PI, 0);
      reze.apply(c < 8.5 ? PEW : blendPose(PEW, PEW_PIN, easeInOutCubic(segment(c, 8.5, 9.6))));
      seat(reze, at("church", -1.6, 0.52, -1.85));
      lot.sets.church.candles.forEach((f, i) => f.scale.set(1, 1.8 + Math.sin(time * 9 + i * 2) * 0.35, 1));
      if (shot.id === "chapel") {
        const k = easeInOutCubic(u);
        cam(at("church", 0.2, 1.7, 7).lerp(at("church", -0.1, 1.5, 3.2), k), at("church", -1.4, 1.1, -2));
        text = "The girl from the café was never only that.";
        cut.black = 1 - segment(c, 0, 1.4);
      } else {
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.75, 0.0, -0.65)), tmp.clone().add(new THREE.Vector3(0, -0.12, 0)));
        const slam = segment(c, 9.6, 9.8);
        tink.update({ x: 62, y: 62, size: 4, rotate: -4, opacity: c > 9.6 && c < 10.8 ? Math.min(1, slam * 4) : 0, scale: 1, boil: 0, jitter: 0 });
      }
      if (c < 9.6 || c > 10.8) tink.update({ opacity: 0 });
      cut.black = Math.max(cut.black, segment(c, 10.6, 11));
    } else {
      tink.update({ opacity: 0 });
      // ── The festival ──
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(c < 27 ? LIGHT.festival : c < 34 ? LIGHT.blood : LIGHT.devil);
      w.page({ mode: c >= 27 && c < 34 ? "lines" : "still", intensity: 0.9, focus: [0.5, 0.55], seed: Math.floor(time * 12) });

      // Walking up the lane, then face to face.
      if (c < 19) {
        const k = segment(c, 12, 19);
        denji.root.position.copy(at("festival", -0.3, 0, lerp(5, 0.6, k)));
        reze.root.position.copy(at("festival", 0.3, 0, lerp(5.1, 0.7, k)));
        denji.root.rotation.set(0, Math.PI, 0);
        reze.root.rotation.set(0, Math.PI, 0);
        denji.apply(c > 16 ? blendPose(walk(time * 6), LOOK_UP, segment(c, 16, 17.5)) : walk(time * 6));
        reze.apply(c > 16.4 ? blendPose(walk(time * 6 + 0.5), LOOK_UP, segment(c, 16.4, 17.8)) : walk(time * 6 + 0.5));
      } else {
        const turn = easeInOutCubic(segment(c, 19, 21));
        denji.root.position.copy(at("festival", -0.3, 0, 0.6));
        reze.root.position.copy(at("festival", 0.3, 0, 0.6));
        denji.root.rotation.set(0, lerp(Math.PI, Math.PI / 2, turn), 0);
        reze.root.rotation.set(0, lerp(Math.PI, -Math.PI / 2, turn), 0);
        let dp = blendPose(LOOK_UP, LEAN_IN, turn);
        let rp = blendPose(LOOK_UP, HOLD, turn);
        if (c > 23) {
          // Closer.
          const k = easeInOutCubic(segment(c, 23, 27));
          denji.root.position.x = lot.sets.festival.origin.x + lerp(-0.3, -0.17, k);
          reze.root.position.x = lot.sets.festival.origin.x + lerp(0.3, 0.17, k);
        }
        if (c > 27.4) dp = blendPose(dp, RECOIL, easeOutCubic(segment(c, 27.4, 27.9)));
        if (c > 28.6) {
          // Denji staggers back from her.
          const k = easeOutCubic(segment(c, 28.6, 30));
          denji.root.position.x = lot.sets.festival.origin.x + lerp(-0.17, -1.1, k);
        }
        if (c > 29.2) rp = blendPose(rp, PIN, easeInOutCubic(segment(c, 29.2, 30.4)));
        if (c > 31) rp = blendPose(rp, YANKED, easeOutCubic(segment(c, 31, 31.3)));
        if (c > 33.5) {
          rp = blendPose(rp, DEVIL(time), easeInOutCubic(segment(c, 33.5, 35)));
          dp = blendPose(dp, DOWN, easeOutCubic(segment(c, 32, 33)));
        }
        denji.apply(dp);
        reze.apply(rp);
      }
      denji.root.updateMatrixWorld(true);
      reze.root.updateMatrixWorld(true);

      // The pin comes away in her hand.
      if (c > 31.05 && c < 34) {
        pin.visible = false;
      }
      // The Bomb Devil: the head is the bomb.
      if (c > 32.2) cast.transform(lerp(0.2, 1, easeOutBack(segment(c, 32.2, 33))));

      // Fireworks overhead from the walk to the end.
      if (dt > 0 && c > 15) {
        state.rocket += dt;
        if (state.rocket > (c > 34 ? 0.3 : 0.5)) {
          state.rocket = 0;
          fx.firework(at("festival", -6 + Math.random() * 12, 6 + Math.random() * 3, -9 - Math.random() * 4), Math.random() < 0.5);
        }
      }
      // The bite, the blast.
      if (dt > 0 && c > 27.4 && !state.bit) {
        state.bit = true;
        denji.bones.head.getWorldPosition(tmp);
        fx.blood(tmp.add(new THREE.Vector3(0.1, -0.08, 0)), 120);
      }
      if (dt > 0 && c > 32 && !state.blasted) {
        state.blasted = true;
        reze.bones.neck.getWorldPosition(tmp);
        fx.blast(tmp);
      }
      if (c < 27) state.bit = false;
      if (c < 32) state.blasted = false;

      if (shot.id === "festival" || shot.id === "cut") {
        const k = easeInOutCubic(segment(c, 12, 21));
        cam(at("festival", 0.9, 1.35, -2.2).lerp(at("festival", 0.6, 1.3, -1.4), k), at("festival", 0, 1.5, 2.5));
        text = "The festival. The fireworks.";
        cut.black = 1 - segment(c, 11, 12.4);
      } else if (shot.id === "faces") {
        // Profile two-shot, the sky going off behind them.
        const k = easeInOutCubic(u);
        cam(at("festival", 0.05, 1.5, 2.2 - k * 0.9), at("festival", 0, 1.48, 0.6));
        textR = c < 24 ? "" : "Then, finally, she leaned in.";
      } else if (shot.id === "bite") {
        cam(at("festival", 0.02, 1.52, 1.25), at("festival", 0, 1.5, 0.6));
        cut.flash = (1 - segment(c, 27.4, 27.9)) * (c > 27.4 ? 1 : 0);
        cut.flashColor = "#ff1d3d";
        const slam = segment(c, 27.4, 27.65);
        crunch.update({ x: 50, y: 30, size: 10, rotate: -6, opacity: c > 27.4 ? Math.min(1, slam * 4) : 0, scale: lerp(2.4, 1, easeOutBack(slam)), boil: Math.floor(time * 12), jitter: 0.1 });
      } else if (shot.id === "pull") {
        reze.bones.neck.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(-0.85, 0.05, 0.45)), tmp.clone().add(new THREE.Vector3(0, -0.05, 0)));
        textR = "There was a pin in her choker all along.";
      } else if (shot.id === "blast") {
        cam(at("festival", -1.4, 1.3, 3.6), at("festival", 0.2, 1.4, 0.4));
        cut.flash = 1 - segment(c, 32, 33.4);
        const slam = segment(c, 32.1, 32.4);
        boom.update({ x: 50, y: 36, size: 14, rotate: 6, opacity: Math.min(1, slam * 4), scale: lerp(2.6, 1, easeOutBack(slam)), boil: Math.floor(time * 12), jitter: 0.12 });
      } else {
        const k = easeInOutCubic(u);
        cam(at("festival", -1.5, 0.45, 3.6).lerp(at("festival", -1.15, 0.4, 2.8), k), at("festival", 0.25, 1.55, 0.5));
        text = "Some things go off.";
        cut.black = segment(c, 41.6, 43.6);
      }
      if (shot.id !== "bite") crunch.update({ opacity: 0 });
      if (shot.id !== "blast") boom.update({ opacity: 0 });
    }

    fx.step(dt);
    if (c < 0.1) fx.clear();
    cuts.update(cut);
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
      [cap, capR, crunch, tink, boom, cuts].forEach((x) => x.dispose());
    },
  };
};
