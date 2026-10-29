import * as THREE from "three";
import { easeInOutCubic, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createCaption } from "../sfx";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, seat, shotAt } from "../rezeKit";

/**
 * in the pool — a school at night, and the childhood neither of them had.
 *
 *   0  – 6    an empty classroom by moonlight; she sits on a desk, he at one
 *   6  – 11   closer: she swings her legs; he looks round the room
 *   11 – 14   she hops down and takes his hand
 *   14 – 17   the pool deck: they run for the edge
 *   17 – 19   in — the splash
 *   19 – 29   swimming under the moon, rings spreading round them
 *   29 – 37   floating on their backs, side by side, from above
 *   37 – 40   fade
 *
 * Captions are original lines.
 */

const CYCLE = 40;
const STATIC_TIME = 32;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const SIT_DESK = (t) => ({
  spine: [0.0, 0, 0],
  head: [0.05, 0, 0.05],
  lHip: [-1.45, 0, 0.1],
  rHip: [-1.45, 0, -0.1],
  lKnee: [1.25 + Math.sin(t * 2.4) * 0.3, 0, 0],
  rKnee: [1.25 + Math.sin(t * 2.4 + 1.6) * 0.3, 0, 0],
  lShoulder: [0.3, 0, 0.35],
  lElbow: [-0.2, 0, 0],
  rShoulder: [0.3, 0, -0.35],
  rElbow: [-0.2, 0, 0],
});
const SIT_CHAIR = (t) => ({
  spine: [-0.05, 0, 0],
  head: [-0.05, Math.sin(t * 0.7) * 0.4, 0],
  lHip: [-1.5, 0, 0.12],
  rHip: [-1.5, 0, -0.12],
  lKnee: [1.5, 0, 0],
  rKnee: [1.5, 0, 0],
  lShoulder: [-0.6, 0, 0.25],
  lElbow: [-1.0, 0, 0],
  rShoulder: [-0.6, 0, -0.25],
  rElbow: [-1.0, 0, 0],
});
const REACH = { ...STAND, head: [0.1, 0, 0], rShoulder: [-1.1, 0, -0.2], rElbow: [-0.2, 0, 0] };
const run = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.22, 0, 0],
    head: [-0.15, 0, 0],
    lShoulder: [-0.8 * s - 0.2, 0, 0.15],
    lElbow: [-1.3, 0, 0],
    rShoulder: [0.8 * s - 0.2, 0, -0.15],
    rElbow: [-1.3, 0, 0],
    lHip: [0.9 * s - 0.2, 0, 0.05],
    lKnee: [Math.max(0, -s) * 1.2 + 0.15, 0, 0],
    rHip: [-0.9 * s - 0.2, 0, -0.05],
    rKnee: [Math.max(0, s) * 1.2 + 0.15, 0, 0],
  };
};
// Treading water, heads up: arms sculling just under the surface, legs cycling.
const SWIM = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.1, 0, 0],
    head: [-0.2, 0, 0],
    lShoulder: [-0.6 + s * 0.25, 0, 0.95],
    lElbow: [-0.5 - s * 0.3, 0, 0],
    rShoulder: [-0.6 - s * 0.25, 0, -0.95],
    rElbow: [-0.5 + s * 0.3, 0, 0],
    lHip: [-0.4 - s * 0.4, 0, 0.1],
    rHip: [-0.4 + s * 0.4, 0, -0.1],
    lKnee: [0.8 + s * 0.4, 0, 0],
    rKnee: [0.8 - s * 0.4, 0, 0],
  };
};
const FLOAT = (t) => ({
  spine: [-0.05, 0, 0],
  head: [-0.15, 0, 0],
  lShoulder: [-0.2, 0, 1.2 + Math.sin(t * 0.8) * 0.08],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-0.2, 0, -1.2 - Math.sin(t * 0.8) * 0.08],
  rElbow: [-0.3, 0, 0],
  lHip: [0, 0, 0.15],
  rHip: [0, 0, -0.15],
});

const SHOTS = [
  { t: 0, id: "room" },
  { t: 6, id: "close" },
  { t: 11, id: "hand" },
  { t: 14, id: "deck" },
  { t: 17, id: "jump" },
  { t: 19, id: "swim" },
  { t: 29, id: "float" },
];

export const createInThePoolScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["school", "pool"]);
  const cast = createCast(w, { chainsaw: false });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  const water = lot.sets.pool.water.material.uniforms;

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  const state = { splashed: false };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze } = cast;
    if (!denji) return;
    const { shot, u } = shotAt(SHOTS, c);
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#e8fbff" };
    let text = "";
    let textR = "";
    denji.root.rotation.set(0, 0, 0);
    reze.root.rotation.set(0, 0, 0);

    if (c < 14) {
      // ── The classroom ──
      lot.show("school");
      w.light(0.9, 0.5, 0.2); // moonlight from the windows
      w.palette(LIGHT.school);
      w.page({ mode: "still" });
      if (c < 11.6) {
        reze.root.position.copy(at("school", 0.2, 0.38, -1.45));
        reze.root.rotation.y = Math.PI / 2;
        reze.apply(SIT_DESK(time));
        seat(reze, at("school", 0.38, 0.76, -1.4));
      } else {
        // Down off the desk, a hand out to him.
        const k = easeInOutCubic(segment(c, 11.6, 12.3));
        reze.root.position.lerpVectors(at("school", 0.2, 0.38, -1.45), at("school", 0.75, 0, -1.1), k);
        reze.root.rotation.y = lerp(Math.PI / 2, Math.PI * 0.75, k);
        reze.apply(blendPose(SIT_DESK(time), REACH, k));
      }
      denji.root.position.copy(at("school", 1.8, 0.06, -0.85));
      denji.root.rotation.y = Math.PI + 0.75;
      denji.apply(c < 12.6 ? SIT_CHAIR(time) : blendPose(SIT_CHAIR(time), REACH, easeInOutCubic(segment(c, 12.6, 13.4))));
      if (c < 12.6) seat(denji, at("school", 1.8, 0.47, -0.85));

      if (shot.id === "room") {
        const k = easeInOutCubic(u);
        cam(at("school", -3.6, 2.2, 3.6).lerp(at("school", -2.8, 1.9, 2.8), k), at("school", 1.0, 0.9, -1.0));
        text = "Neither of them ever went to school.";
        cut.black = 1 - segment(c, 0, 1.2);
      } else if (shot.id === "close") {
        const k = easeInOutCubic(u);
        cam(at("school", 1.9, 1.55, 2.3).lerp(at("school", 1.6, 1.45, 1.9), k), at("school", 0.95, 0.95, -1.15));
        textR = "So they borrowed one for the night.";
      } else {
        cam(at("school", 2.6, 1.3, 0.4), at("school", 1.1, 0.9, -1.0));
      }
    } else {
      // ── The pool ──
      lot.show("pool");
      w.light(0.3, 0.8, -0.5); // the moon, behind and above
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      const herStart = at("pool", -4.5, 0, 4.4);
      if (c < 17.4) {
        const k = segment(c, 14, 17.4);
        reze.root.position.lerpVectors(herStart, at("pool", -1.2, 0, 3.1), k);
        denji.root.position.lerpVectors(at("pool", -5.2, 0, 4.9), at("pool", -0.4, 0, 3.3), k);
        reze.root.rotation.y = denji.root.rotation.y = Math.atan2(3.3, -1.3);
        reze.apply(run(time * 10));
        denji.apply(run(time * 10 + 1));
        if (c > 16.6) {
          // The leap.
          const j = segment(c, 16.6, 17.4);
          const hop = Math.sin(j * Math.PI) * 0.9;
          reze.root.position.y += hop;
          denji.root.position.y += hop;
          reze.root.position.z -= j * 1.4;
          denji.root.position.z -= j * 1.4;
        }
        state.splashed = false;
      } else if (c < 29) {
        // Swimming: heads up, slow circles round each other.
        if (!state.splashed && dt > 0) {
          state.splashed = true;
          fx.splash(at("pool", -1.2, 0.1, 1.6), 120);
          fx.splash(at("pool", -0.4, 0.1, 1.8), 120);
        }
        const a = (c - 17.4) * 0.28;
        const ra = at("pool", -0.8 + Math.cos(a) * 0.9, -1.38, 0.6 + Math.sin(a) * 0.7);
        const da = at("pool", -0.8 + Math.cos(a + 2.6) * 0.9, -1.45, 0.6 + Math.sin(a + 2.6) * 0.7);
        reze.root.position.copy(ra);
        denji.root.position.copy(da);
        reze.root.rotation.y = -a;
        denji.root.rotation.y = -a - 2.6;
        reze.apply(SWIM(time * 3));
        denji.apply(SWIM(time * 3 + 1.5));
        water.uA.value.set(ra.x, ra.z, 1);
        water.uB.value.set(da.x, da.z, 1);
        if (dt > 0 && Math.random() < dt * 3) fx.splash(ra.clone().setY(0.1), 6);
      } else {
        // Floating, face up, side by side.
        const drift = (c - 29) * 0.04;
        reze.root.position.copy(at("pool", -1.05 + drift, 0.0, 1.55));
        denji.root.position.copy(at("pool", -0.35 + drift, 0.0, 1.65));
        reze.root.rotation.set(-Math.PI / 2, 0, 0.05);
        denji.root.rotation.set(-Math.PI / 2, 0, -0.05);
        reze.apply(FLOAT(time));
        denji.apply(FLOAT(time + 2));
        water.uA.value.set(reze.root.position.x, reze.root.position.z - 0.9, 0.5);
        water.uB.value.set(denji.root.position.x, denji.root.position.z - 0.9, 0.5);
      }

      if (shot.id === "deck") {
        cam(at("pool", 2.2, 1.6, 6.2), at("pool", -1.6, 0.9, 3.4));
        text = "Then she found the pool.";
      } else if (shot.id === "jump") {
        cam(at("pool", 1.6, 1.0, 5.4), at("pool", -0.8, 0.4, 2.2));
        cut.flash = segment(c, 17.3, 17.45) * (1 - segment(c, 17.45, 18.2));
      } else if (shot.id === "swim") {
        const a = 0.5 + u * 0.9;
        cam(at("pool", -0.8 + Math.sin(a) * 2.3, 0.55, 0.6 + Math.cos(a) * 2.3), at("pool", -0.8, 0.2, 0.6));
        text = c < 24 ? "Swimming lessons, at midnight." : "";
        textR = c >= 24 ? "Everything they missed, in one night." : "";
      } else {
        // Straight down on them: the moon's streak between them.
        const k = easeInOutCubic(u);
        cam(at("pool", -0.7, 4.2 - k * 0.7, 0.8), at("pool", -0.7, 0, 0.78));
        camera.up.set(0, 0, -1);
        camera.lookAt(at("pool", -0.7, 0, 0.78));
        camera.up.set(0, 1, 0);
        water.uMoonX.value = lot.sets.pool.origin.x - 0.7;
        textR = "A childhood neither of them had.";
        cut.black = segment(c, 37, 39.6);
      }
      if (shot.id !== "float") water.uMoonX.value = lot.sets.pool.origin.x + 0.6;
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
