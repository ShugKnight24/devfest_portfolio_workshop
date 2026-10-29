import * as THREE from "three";
import { easeInOutCubic, lerp, segment } from "../kit";
import { createCaption } from "../sfx";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, seat } from "../rezeKit";

/**
 * JANE DOE — the close. Quiet, after everything.
 *
 *   0  – 7    dawn: the storm thinning over the empty booth
 *   7  – 13   her café: he waits at the counter with a handful of daisies
 *   13 – 19   the street: she is walking back, his daisy in her hand
 *   19 – 24   close on his flowers; he waits
 *   24 – 31   she runs; the morning comes up white
 *   31 – 38   wide from the café door: still waiting
 *   38 – 42   fade
 *
 * Captions are original lines.
 */

const CYCLE = 42;
const STATIC_TIME = 20;

const WALK = (p) => {
  const s = Math.sin(p);
  return { spine: [0.05, 0, 0], lShoulder: [-0.3 * s, 0, 0.1], lElbow: [-0.4, 0, 0], lHip: [0.45 * s - 0.05, 0, 0.03], lKnee: [Math.max(0, -s) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * s - 0.05, 0, -0.03], rKnee: [Math.max(0, s) * 0.6 + 0.05, 0, 0] };
};
const RUN = (p) => {
  const s = Math.sin(p);
  return { spine: [0.2, 0, 0], head: [-0.1, 0, 0], lShoulder: [-0.8 * s - 0.2, 0, 0.15], lElbow: [-1.3, 0, 0], lHip: [0.9 * s - 0.2, 0, 0.05], lKnee: [Math.max(0, -s) * 1.2 + 0.15, 0, 0], rHip: [-0.9 * s - 0.2, 0, -0.05], rKnee: [Math.max(0, s) * 1.2 + 0.15, 0, 0] };
};
const WAIT = (t) => ({
  spine: [0.12, 0, 0],
  head: [0.18 + Math.sin(t * 0.5) * 0.05, -0.25 + Math.sin(t * 0.3) * 0.15, 0],
  lHip: [-1.5, 0, 0.08],
  rHip: [-1.5, 0, -0.08],
  lKnee: [1.45, 0, 0],
  rKnee: [1.45, 0, 0],
  lShoulder: [-0.85, 0.2, 0.15],
  lElbow: [-1.3, 0, 0],
  rShoulder: [-0.85, -0.2, -0.15],
  rElbow: [-1.3, 0, 0],
});

export const createJaneDoeScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe"]);
  const cast = createCast(w, { chainsaw: false, daisy: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  // A handful of daisies: the cast's one, plus four more beside it.
  const bouquet = new THREE.Group();
  w.scene.add(bouquet);

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  let built = false;

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze, daisy } = cast;
    if (!denji) return;
    if (!built) {
      built = true;
      for (let i = 0; i < 4; i++) {
        const d = daisy.clone();
        d.position.set(Math.cos(i * 1.6) * 0.035, -0.02 * i, Math.sin(i * 1.6) * 0.035);
        d.rotation.set(Math.PI / 2.6 + (i - 1.5) * 0.15, i * 0.9, (i - 1.5) * 0.2);
        bouquet.add(d);
      }
    }
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#fff3e0" };
    let text = "";
    let textR = "";
    const herShot = (c >= 13 && c < 19) || (c >= 24 && c < 31);

    if (c < 7 || herShot) {
      // ── The street at dawn: first empty, then her ──
      lot.show("street");
      w.light(-0.3, 0.7, 0.6);
      w.palette(LIGHT.dawn);
      w.page({ mode: "rain", intensity: c < 7 ? 0.7 * (1 - segment(c, 1, 6)) : 0.05, disc: [0.3, 0.84, 0.05 + segment(c, 0, 30) * 0.04], seed: Math.floor(time * 8) });
      denji.root.position.set(0, -50, 0);
      bouquet.visible = false;
      if (c < 7) {
        reze.root.position.set(0, -50, 0);
        daisy.visible = false;
        const k = easeInOutCubic(segment(c, 0, 7));
        cam(at("street", 3.2 - k * 0.8, 1.5, 5.5 - k * 1.2), at("street", 0, 1.1, 0));
        text = "The storm passed.";
        cut.black = 1 - segment(c, 0, 1.5);
      } else {
        // Walking, then running, the daisy he gave her in her hand.
        const running = c >= 24;
        const x = running ? lerp(-4, 5, segment(c, 24, 31)) : lerp(-9, -4, segment(c, 13, 19));
        reze.root.position.copy(at("street", x, 0, 0.9));
        reze.root.rotation.set(0, Math.PI / 2, 0);
        const gait = running ? RUN(time * 9) : WALK(time * 5.5);
        reze.apply({ ...gait, rShoulder: [-0.75, 0, -0.2], rElbow: [-1.5, 0, 0] });
        reze.root.updateMatrixWorld(true);
        daisy.visible = true;
        reze.model.getObjectByName("hand_r").getWorldPosition(daisy.position);
        daisy.position.y += 0.1;
        daisy.rotation.set(Math.PI / 2.6, 0.9, 0);
        daisy.scale.setScalar(1.6);
        if (!running) {
          // Low and ahead of her, so she walks toward us.
          cam(reze.root.position.clone().add(new THREE.Vector3(2.4, 0.9, 1.6)), reze.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
          textR = "She was on her way back.";
        } else {
          // Alongside her; the morning comes up white behind the frame.
          cam(reze.root.position.clone().add(new THREE.Vector3(0.8, 1.25, 2.6)), reze.root.position.clone().add(new THREE.Vector3(0.6, 1.2, 0)));
          text = "Even after everything.";
          cut.flash = segment(c, 28.5, 31) * 0.85;
        }
      }
    } else {
      // ── Her café: he waits ──
      reze.root.position.set(0, -50, 0);
      lot.show("cafe");
      w.light(0.85, 0.55, 0.1);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      const cafe = lot.sets.cafe;
      denji.root.rotation.set(0, Math.PI, 0);
      denji.apply(WAIT(time));
      seat(denji, cafe.spots.stool.clone().add(cafe.origin));
      // The flowers, held in both hands in his lap.
      const l = denji.model.getObjectByName("hand_l").getWorldPosition(new THREE.Vector3());
      const r = denji.model.getObjectByName("hand_r").getWorldPosition(tmp);
      daisy.visible = true;
      bouquet.visible = true;
      daisy.position.copy(l).add(r).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.14, 0));
      daisy.rotation.set(Math.PI / 2.6, 0, 0);
      daisy.scale.setScalar(1.6);
      bouquet.position.copy(daisy.position);
      bouquet.rotation.y = Math.PI;
      bouquet.scale.setScalar(1.6);

      if (c < 13) {
        const k = easeInOutCubic(segment(c, 7, 13));
        cam(at("cafe", 2.6 - k * 0.6, 1.7, 2.6 - k * 0.5), at("cafe", -0.6, 1.0, 0));
        textR = "He came back to her café with flowers.";
      } else if (c < 24) {
        const k = easeInOutCubic(segment(c, 19, 24));
        cam(daisy.position.clone().add(new THREE.Vector3(0.55 - k * 0.15, 0.25, -0.75 + k * 0.2)), daisy.position.clone().add(new THREE.Vector3(0, 0.05, 0)));
        text = "And waited.";
      } else {
        // Wide from the door: small at the counter, the sun moving across the floor.
        const k = easeInOutCubic(segment(c, 31, 38));
        cam(at("cafe", 4.2 - k * 0.6, 2.3 - k * 0.2, 4.2 - k * 0.4), at("cafe", -0.9, 0.9, 0));
        textR = "Some people are worth waiting for.";
        cut.flash = 1 - segment(c, 31, 32.2);
        cut.black = segment(c, 38.5, 41.5);
      }
    }

    fx.step(dt);
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
      [cap, capR, cuts].forEach((x) => x.dispose());
    },
  };
};
