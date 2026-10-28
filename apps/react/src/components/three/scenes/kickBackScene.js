import * as THREE from "three";
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createSfx } from "../sfx";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets } from "../rezeKit";

/**
 * KICK BACK — season one: the warehouse, the zombies, the cord.
 *
 *   0  – 5    a warehouse in the dark; Denji alone under the bulbs, the
 *             devils shuffle in from the shadows
 *   5  – 7.5  he finds the cord in his chest and takes the grip
 *   7.5 – 8.5 he yanks it out to arm's length; it snaps home — VRRRN
 *   8.5 – 21  through them, one on each beat, the page strobing red
 *   21 – 27   from above: him standing in the middle of what is left
 *   27 – 33   close on the Chainsaw Man; KICK BACK
 *   33 – 36   black
 */

const CYCLE = 36;
const STATIC_TIME = 15.3;
const BEAT = 0.47;
const DEVILS = 6;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const SLUMP = { spine: [0.3, 0, 0], head: [0.55, 0, 0], lShoulder: [0.1, 0, 0.15], rShoulder: [0.1, 0, -0.15], lElbow: [-0.3, 0, 0], rElbow: [-0.3, 0, 0] };
const CORD = { ...STAND, head: [0.3, 0, 0], rShoulder: [-0.3, 0.9, 0.1], rElbow: [-1.8, 0, 0] };
const YANK = { spine: [-0.05, -0.35, 0], chest: [0, -0.25, 0], head: [-0.15, -0.2, 0], lShoulder: [-0.2, 0, 0.35], rShoulder: [-0.6, -0.7, -0.5], rElbow: [-0.3, 0, 0] };
const CUT_R = { spine: [0.35, 0.5, 0], head: [-0.25, -0.3, 0], rShoulder: [-1.4, 0.6, -0.9], rElbow: [-0.2, 0, 0], lShoulder: [-0.6, 0, 0.8], lElbow: [-0.9, 0, 0], lHip: [-0.8, 0, 0.1], lKnee: [0.8, 0, 0], rHip: [0.4, 0, -0.1], rKnee: [0.4, 0, 0], lift: -0.1 };
const CUT_L = { spine: [0.35, -0.5, 0], head: [-0.25, 0.3, 0], rShoulder: [-1.4, -0.6, -0.2], rElbow: [-0.3, 0, 0], lShoulder: [-1.0, 0, 0.9], lElbow: [-0.6, 0, 0], lHip: [0.4, 0, 0.1], lKnee: [0.4, 0, 0], rHip: [-0.8, 0, -0.1], rKnee: [0.8, 0, 0], lift: -0.1 };
const VICTORY = (t) => ({ spine: [-0.1, 0, 0], head: [-0.3 + Math.sin(t * 3) * 0.03, 0, 0], rShoulder: [-0.3, 0, -0.9], rElbow: [-0.3, 0, 0], lShoulder: [-0.2, 0, 0.9], lElbow: [-0.4, 0, 0], lHip: [-0.1, 0, 0.18], rHip: [0.05, 0, -0.18] });
const SHAMBLE = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.45, 0, 0.08 * s],
    head: [0.1, 0.2 * s, 0],
    lShoulder: [-1.4, 0, 0.15],
    lElbow: [-0.4, 0, 0],
    rShoulder: [-1.3, 0, -0.2],
    rElbow: [-0.5, 0, 0],
    lHip: [0.3 * s - 0.1, 0, 0.08],
    lKnee: [Math.max(0, -s) * 0.5 + 0.2, 0, 0],
    rHip: [-0.3 * s - 0.1, 0, -0.08],
    rKnee: [Math.max(0, s) * 0.5 + 0.2, 0, 0],
  };
};
const FALLEN = { spine: [-1.2, 0, 0.3], head: [0.5, 0.4, 0], lShoulder: [-0.5, 0, 1.3], rShoulder: [-2.4, 0, -0.5], lHip: [-1.2, 0, 0.3], lKnee: [1.4, 0, 0], rHip: [-0.4, 0, -0.2], rKnee: [0.5, 0, 0], lift: -0.75 };

export const createKickBackScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["warehouse"]);
  const cast = createCast(w, { chainsaw: true, devils: DEVILS });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const vroom = createSfx(overlay, { text: "VRRRN!!", crescendo: 0.8 });
  const kick = createSfx(overlay, { text: "KICK BACK", crescendo: 0.3 });
  const hits = ["SHNK!", "GRAK!", "VRRT!"].map((text) => createSfx(overlay, { text, crescendo: 0.5 }));

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (x, y, z) => lot.at("warehouse", x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  // Where each devil starts, in a ring round him; the order he reaches them.
  // Turned so the gap in the ring faces the close-up camera: a devil closing
  // in straight toward the lens would fill the frame while he finds the cord.
  const RING = Array.from({ length: DEVILS }, (_, i) => {
    const a = (i / DEVILS) * Math.PI * 2 + 0.92;
    return { a, x: Math.cos(a) * 3.2, z: 1.2 + Math.sin(a) * 2.6 };
  });
  const state = { hitBeat: -1 };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze, devils, saw } = cast;
    if (!denji) return;
    lot.show("warehouse");
    reze.root.position.set(0, -50, 0);
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#fff6ea" };
    const rampage = segment(c, 8.5, 21);
    const beat = Math.floor((c - 8.5) / BEAT);
    const struck = c < 8.5 ? -1 : Math.min(DEVILS - 1, Math.floor(rampage * DEVILS * 1.15));

    // The page: a dim warehouse, then strobing red with every hit.
    const strobe = c >= 8.5 && c < 21 ? beat % 2 : 0;
    w.palette(c < 7.5 ? LIGHT.stormWarm : strobe ? LIGHT.blood : LIGHT.devil);
    w.light(-0.4, 0.8, 0.4);
    w.page({ mode: c >= 7.5 && c < 21 ? "lines" : c >= 27 && c < 33 ? "lines" : "still", intensity: 0.9, focus: [0.5, 0.5], seed: Math.floor(time * 12) });

    // ── Denji ──
    const center = at(0, 0, 1.2);
    denji.root.position.copy(center);
    denji.root.rotation.set(0, 0, 0);
    let pose = SLUMP;
    if (c > 5) pose = blendPose(SLUMP, CORD, easeInOutCubic(segment(c, 5, 6.2)));
    if (c > 7.5) pose = blendPose(CORD, YANK, easeOutCubic(segment(c, 7.5, 7.8)));
    saw.set(easeOutBack(segment(c, 7.75, 8.4)), time);
    // The cord: he finds the grip, takes it, yanks it out to arm's length, and
    // it snaps back into his chest as the saws come out.
    const grab = c < 5.6 ? 0 : c < 7.95 ? easeOutCubic(segment(c, 5.6, 6.1)) : 1 - easeInOutCubic(segment(c, 7.95, 8.15));
    if (c >= 8.5 && c < 21) {
      // Whirl to each devil in turn; a cut on every beat.
      const target = RING[Math.max(0, struck)];
      denji.root.position.lerp(at(target.x * 0.55, 0, 1.2 + (target.z - 1.2) * 0.55), 0.85);
      denji.root.rotation.y = Math.atan2(target.x, target.z - 1.2);
      pose = beat % 2 ? CUT_R : CUT_L;
    }
    if (c >= 21) pose = VICTORY(time);
    denji.apply(pose);
    denji.root.updateMatrixWorld(true);
    cast.cord?.set(c > 4.5 && c < 8.3, grab);

    // ── The devils ──
    devils.forEach((d, i) => {
      const r = RING[i];
      const down = i <= struck || c >= 21;
      const close = c < 8.5 ? easeInOutCubic(segment(c, 0.5, 8)) * 0.35 : 0.35;
      d.root.position.copy(at(r.x * (1 - close), 0, 1.2 + (r.z - 1.2) * (1 - close)));
      d.root.rotation.set(0, Math.atan2(-r.x, -(r.z - 1.2)), 0);
      d.apply(down ? FALLEN : SHAMBLE(time * 3 + i));
    });

    // Blood on every hit.
    if (dt > 0 && c >= 8.5 && c < 21 && beat !== state.hitBeat) {
      state.hitBeat = beat;
      const r = RING[Math.max(0, struck)];
      fx.blood(at(r.x * 0.65, 1.3, 1.2 + (r.z - 1.2) * 0.65), 140);
    }
    if (c < 8.5) state.hitBeat = -1;
    if (dt > 0 && c >= 21 && c < 33 && Math.random() < dt * 6) fx.blood(at((Math.random() - 0.5) * 6, 4.5, Math.random() * 3), 8);
    fx.step(dt);
    if (c < 0.05) fx.clear();

    // ── Cameras ──
    if (c < 5) {
      const k = easeInOutCubic(segment(c, 0, 5));
      cam(at(4.5 - k * 1.5, 2.6, 7 - k * 2), at(0, 1.2, 1));
      cut.black = 1 - segment(c, 0, 1);
    } else if (c < 8.5) {
      denji.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(0.25, -0.05, 1.6)), tmp.clone().add(new THREE.Vector3(0, -0.2, 0)));
      cut.flash = c > 7.75 ? 1 - segment(c, 7.75, 8.4) : 0;
    } else if (c < 21) {
      // Handheld, circling with him, a jolt on each hit.
      const a = (c - 8.5) * 0.45;
      const jolt = Math.max(0, 1 - ((c - 8.5) % BEAT) / 0.15) * 0.08;
      cam(at(Math.sin(a) * 3.6 + (Math.random() - 0.5) * jolt, 1.4 + jolt, 1.2 + Math.cos(a) * 3.6), at(0, 1.1, 1.2));
      cut.flash = Math.max(0, 1 - ((c - 8.5) % BEAT) / 0.1) * 0.45;
      cut.flashColor = beat % 2 ? "#ff1d3d" : "#fff6ea";
    } else if (c < 27) {
      const k = easeInOutCubic(segment(c, 21, 27));
      camera.up.set(0, 0, -1);
      cam(at(0.2, 7.5 - k * 2.5, 1.4), at(0, 0, 1.2));
      camera.up.set(0, 1, 0);
    } else {
      denji.bones.neck.getWorldPosition(tmp);
      const k = easeInOutCubic(segment(c, 27, 33));
      cam(tmp.clone().add(new THREE.Vector3(0.6 - k * 0.3, -0.35 + k * 0.1, 1.9 - k * 0.7)), tmp.clone().add(new THREE.Vector3(0, 0.1, 0)));
      cut.black = segment(c, 32.4, 33.2);
    }
    if (c >= 33) cut.black = 1;
    cuts.update(cut);

    // ── Lettering ──
    const sv = segment(c, 7.8, 8.05);
    vroom.update({ x: 52, y: 26, size: 12, rotate: -8, opacity: c > 7.8 && c < 9.5 ? Math.min(1, sv * 4) : 0, scale: lerp(2.4, 1, easeOutBack(sv)), boil: Math.floor(time * 12), jitter: 0.1 });
    hits.forEach((h, i) => {
      const on = c >= 8.5 && c < 21 && beat % 3 === i;
      const local = ((c - 8.5) % BEAT) / BEAT;
      h.update({ x: 30 + i * 22, y: 22 + (i % 2) * 50, size: 8, rotate: (i - 1) * 9, opacity: on ? 1 - local * 0.5 : 0, scale: lerp(1.6, 1, easeOutBack(Math.min(1, local * 3))), boil: Math.floor(time * 12), jitter: 0.08 });
    });
    const sk = segment(c, 28, 28.3);
    kick.update({ x: 50, y: 74, size: 15, rotate: -5, opacity: c > 28 && c < 33 ? Math.min(1, sk * 4) : 0, scale: lerp(2.4, 1, easeOutBack(sk)), boil: Math.floor(time * 12), jitter: 0.08 });
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
      [vroom, kick, ...hits, cuts].forEach((x) => x.dispose());
    },
  };
};
