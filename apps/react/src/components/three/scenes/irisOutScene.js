import * as THREE from "three";
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createSfx } from "../sfx";
import { INK, LIGHT, PAPER, createCast, createCuts, createFx, createInkWorld, createSets, seat } from "../rezeKit";

/**
 * IRIS OUT — the theme, cut to the song the way its music video is: the arc
 * from the first meeting to the blackout, on manga pages that slam in on the
 * bar, closing on an iris.
 *
 * Timed to the track (2:32, 135 BPM) and, on the song slide, locked to the
 * official video's own clock (`setProps({ clock })`). Sections follow the
 * video's:
 *
 *   0:00  intro — a hand dips into still water; Denji walks under a grey sky,
 *         looking up; Reze walks in the rain; they meet under the shelter;
 *         Makima's ringed eyes flash, mice in their shadow
 *   0:18  verse — her smile behind the café counter, the night school, the
 *         pool, her pulling him close
 *   0:49  pre-chorus and chorus — frantic cuts; the music drops; BOOM: she
 *         becomes the Bomb Devil, and an iris closes round her (tunnel vision)
 *   1:16  verse and bridge — Othello discs flip to black; Chainsaw Man and
 *         the Bomb Devil across a rainy city, a different move every bar
 *         (her blast-off, finger bombs, his leap, her exploding punch, the
 *         cord, a mid-air collision, the chase, the grab); the Typhoon
 *         Devil; then the festival, ending with him holding on and the two of
 *         them going into the water
 *   1:56  last chorus — blows traded in fire, fireworks and rain; her human
 *         smile, then her bomb face, cut against each other; iris out to black
 *
 * Every panel is its own shot. Before a panel draws, its shot puts the cast
 * in its set, lights it and frames it; `render` draws them scissored.
 */

const BEAT = 60 / 135;
const BAR = BEAT * 4;
const CYCLE = 152;
const STATIC_TIME = BAR * 46 + 0.3;

/* ---------- poses ---------- */
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
  };
};
const WAITING = { spine: [0.02, 0, 0], head: [0.12, 0.25, 0], lShoulder: [-0.5, 0, 0.2], lElbow: [-1.7, 0.4, 0], rShoulder: [-0.4, 0, -0.25], rElbow: [-1.5, -0.5, 0], rHip: [0.12, 0, -0.04], rKnee: [0.18, 0, 0] };
const OFFER = { spine: [0.05, 0, 0], head: [0.1, -0.1, 0], rShoulder: [-1.25, 0.35, -0.15], rElbow: [-0.35, 0, 0], lShoulder: [0, 0, 0.12] };
const SIT = { spine: [0.08, 0, 0], head: [-0.05, 0, 0], lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKnee: [1.45, 0, 0], rKnee: [1.45, 0, 0], lShoulder: [-0.7, 0, 0.2], lElbow: [-1.1, 0, 0], rShoulder: [-0.7, 0, -0.2], rElbow: [-1.1, 0, 0] };
const LEAN = { spine: [0.42, 0, 0], chest: [0.12, 0, 0], head: [-0.42, 0, 0.1], lShoulder: [-1.05, 0, 0.35], lElbow: [-1.3, 0, 0], rShoulder: [-1.05, 0, -0.35], rElbow: [-1.3, 0, 0] };
const SIT_DESK = (t) => ({ lHip: [-1.45, 0, 0.1], rHip: [-1.45, 0, -0.1], lKnee: [1.25 + Math.sin(t * 2.4) * 0.3, 0, 0], rKnee: [1.25 + Math.sin(t * 2.4 + 1.6) * 0.3, 0, 0], lShoulder: [0.3, 0, 0.35], rShoulder: [0.3, 0, -0.35] });
const TREAD = (p) => {
  const s = Math.sin(p);
  return { spine: [0.1, 0, 0], head: [-0.2, 0, 0], lShoulder: [-0.6 + s * 0.25, 0, 0.95], lElbow: [-0.5, 0, 0], rShoulder: [-0.6 - s * 0.25, 0, -0.95], rElbow: [-0.5, 0, 0], lHip: [-0.4 - s * 0.4, 0, 0.1], rHip: [-0.4 + s * 0.4, 0, -0.1], lKnee: [0.8, 0, 0], rKnee: [0.8, 0, 0] };
};
const FLOAT = { spine: [-0.05, 0, 0], head: [-0.15, 0, 0], lShoulder: [-0.2, 0, 0.85], lElbow: [-0.3, 0, 0], rShoulder: [-0.2, 0, -0.85], rElbow: [-0.3, 0, 0] };
const LEAN_IN = { spine: [0.15, 0, 0], neck: [0.1, 0, 0], head: [0.05, 0, 0], lShoulder: [-0.3, 0, 0.15], rShoulder: [-0.3, 0, -0.15], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0] };
const HOLD = { ...LEAN_IN, lShoulder: [-1.2, -0.4, 0.2], lElbow: [-1.0, 0, 0], rShoulder: [-1.2, 0.4, -0.2], rElbow: [-1.0, 0, 0] };
const RECOIL = { spine: [-0.35, 0.2, 0], head: [-0.5, 0.3, 0], lShoulder: [-1.3, 0, 0.3], lElbow: [-1.9, 0, 0], rShoulder: [-0.2, 0, -0.6], rElbow: [-0.6, 0, 0] };
const PIN = { spine: [-0.05, 0, 0], head: [-0.18, 0, 0], lShoulder: [0.1, 0, 0.3], lElbow: [-0.3, 0, 0], rShoulder: [-1.05, 0, -0.45], rElbow: [-2.35, 0.3, 0] };
const YANKED = { ...PIN, rShoulder: [-2.2, 0, -0.9], rElbow: [-0.2, 0, 0] };
const DEVIL = (t) => ({ spine: [-0.08, 0, 0], head: [-0.1 + Math.sin(t * 2) * 0.03, 0, 0], lShoulder: [-0.2, 0, 0.8], lElbow: [-0.5, 0, 0], rShoulder: [-0.2, 0, -0.8], rElbow: [-0.5, 0, 0], lHip: [0, 0, 0.12], rHip: [0, 0, -0.12] });
const THROW = { spine: [0.2, -0.4, 0], head: [0, 0.3, 0], rShoulder: [-1.6, 0, -0.3], rElbow: [-0.1, 0, 0], lShoulder: [0.3, 0, 0.6], lHip: [-0.5, 0, 0.1], lKnee: [0.4, 0, 0], rHip: [0.4, 0, -0.1], rKnee: [0.5, 0, 0] };
// Hand on the grip in the middle of his chest; then out to arm's length.
const CORD = { ...STAND, head: [0.3, 0, 0], rShoulder: [-0.3, 0.9, 0.1], rElbow: [-1.8, 0, 0] };
const YANK = { spine: [-0.05, -0.35, 0], chest: [0, -0.25, 0], head: [-0.15, -0.2, 0], lShoulder: [-0.2, 0, 0.35], rShoulder: [-0.6, -0.7, -0.5], rElbow: [-0.3, 0, 0] };
// The kiss: apart at the chest, heads tilted opposite ways so they meet, not bump.
const KISS_HIM = { spine: [0.12, 0, 0], neck: [0.12, 0, 0], head: [0.22, 0, 0.2], lShoulder: [-0.25, 0, 0.12], rShoulder: [-0.25, 0, -0.12], lElbow: [-0.5, 0, 0], rElbow: [-0.5, 0, 0] };
const KISS_HER = { spine: [-0.04, 0, 0], neck: [-0.1, 0, 0], head: [-0.22, 0, -0.2], lShoulder: [-0.85, -0.35, 0.15], lElbow: [-1.35, 0, 0], rShoulder: [-0.85, 0.35, -0.15], rElbow: [-1.35, 0, 0] };
/* The fight. Reze flies on her own blasts, punches with explosions and throws
   bombs off her fingers; Denji leaps in with the saws, gets blown apart and
   pulls the cord to get up again; it ends with him holding on to her and the
   two of them going into the water. */
const CROUCH = { spine: [0.5, 0, 0], head: [-0.3, 0, 0], lShoulder: [0.4, 0, 0.5], rShoulder: [0.4, 0, -0.5], lHip: [-1.4, 0, 0.12], lKnee: [2.0, 0, 0], rHip: [-1.4, 0, -0.12], rKnee: [2.0, 0, 0], lift: -0.4 };
const FLY = { spine: [0.35, 0, 0], head: [-0.4, 0, 0], lShoulder: [0.7, 0, 0.45], lElbow: [-0.2, 0, 0], rShoulder: [0.7, 0, -0.45], rElbow: [-0.2, 0, 0], lHip: [-0.15, 0, 0.05], lKnee: [0.7, 0, 0], rHip: [0.1, 0, -0.05], rKnee: [0.35, 0, 0] };
const PUNCH = { spine: [0.25, -0.55, 0], head: [-0.2, 0.4, 0], rShoulder: [-1.6, 0, -0.1], rElbow: [-0.05, 0, 0], lShoulder: [-0.5, 0, 0.6], lElbow: [-1.9, 0, 0], lHip: [-0.6, 0, 0.1], lKnee: [0.5, 0, 0], rHip: [0.35, 0, -0.1], rKnee: [0.15, 0, 0] };
const DODGE = { spine: [-0.45, 0.3, 0.2], head: [-0.2, 0.3, 0], lShoulder: [-0.4, 0, 1.0], rShoulder: [-0.4, 0, -1.0], lHip: [0.3, 0, 0.15], rHip: [-0.6, 0, -0.1], rKnee: [0.8, 0, 0] };
const LEAP = { spine: [-0.25, 0, 0], head: [-0.2, 0, 0], rShoulder: [-2.9, 0, -0.25], rElbow: [-0.2, 0, 0], lShoulder: [-2.6, 0, 0.35], lElbow: [-0.3, 0, 0], lHip: [-1.3, 0, 0.1], lKnee: [1.7, 0, 0], rHip: [-0.5, 0, -0.1], rKnee: [1.2, 0, 0] };
const SLASH = { spine: [0.6, 0, 0], head: [-0.5, 0, 0], rShoulder: [-0.7, 0, -0.25], rElbow: [-0.1, 0, 0], lShoulder: [0.2, 0, 0.7], lElbow: [-0.4, 0, 0], lHip: [-1.2, 0, 0.1], lKnee: [1.4, 0, 0], rHip: [0.4, 0, -0.1], rKnee: [0.6, 0, 0], lift: -0.3 };
const KNOCKED = { spine: [-0.7, 0, 0], head: [-0.5, 0, 0], lShoulder: [-2.3, 0, 0.7], lElbow: [-0.4, 0, 0], rShoulder: [-2.3, 0, -0.7], rElbow: [-0.4, 0, 0], lHip: [-0.9, 0, 0.1], lKnee: [1.3, 0, 0], rHip: [-0.5, 0, -0.1], rKnee: [0.9, 0, 0] };
const KNEEL = { spine: [0.45, 0, 0], head: [0.35, 0, 0], lShoulder: [-0.2, 0, 0.3], rShoulder: [-0.2, 0, -0.3], lElbow: [-0.6, 0, 0], rElbow: [-0.6, 0, 0], lHip: [-1.6, 0, 0.1], lKnee: [1.6, 0, 0], rHip: [-0.15, 0, -0.1], rKnee: [2.2, 0, 0], lift: -0.45 };
const RISE = { spine: [-0.15, 0, 0], head: [-0.35, 0, 0], lShoulder: [-0.4, 0, 1.1], lElbow: [-0.3, 0, 0], rShoulder: [-0.4, 0, -1.1], rElbow: [-0.3, 0, 0] };
const CLINCH = { spine: [0.1, 0, 0], head: [0.15, 0.4, 0], lShoulder: [-1.35, 0, 0.55], lElbow: [-1.4, 0, 0], rShoulder: [-1.35, 0, -0.55], rElbow: [-1.4, 0, 0] };
const STRUGGLE = (t) => ({ spine: [-0.2, Math.sin(t * 7) * 0.2, 0], head: [-0.3, 0.3, 0], lShoulder: [-0.6, 0, 1.2 + Math.sin(t * 9) * 0.2], rShoulder: [-0.6, 0, -1.2], lElbow: [-0.8, 0, 0], rElbow: [-0.8, 0, 0], lHip: [-0.3, 0, 0], lKnee: [0.6, 0, 0] });
const MOVES = {
  city: ["rocket", "fingerBombs", "sawLeap", "bombPunch", "regrow", "airClash", "chase", "grab"],
  festival: ["airClash", "bombPunch", "sawLeap", "fingerBombs", "grab", "plunge", "sink"],
};
// The word each move slams in, and on which beat of its bar.
const MOVE_WORD = { rocket: ["boom", 1], bombPunch: ["boom", 1], sawLeap: ["vroom", 2], regrow: ["vroom", 2], airClash: ["boom", 2], fingerBombs: ["boom", 3] };
const LUNGE = { spine: [0.45, 0.2, 0], head: [-0.35, -0.1, 0], rShoulder: [-1.55, 0, -0.25], rElbow: [-0.15, 0, 0], lShoulder: [-0.4, 0, 0.9], lElbow: [-0.8, 0, 0], lHip: [-0.95, 0, 0.08], lKnee: [0.9, 0, 0], rHip: [0.55, 0, -0.08], rKnee: [0.35, 0, 0], lift: -0.12 };

/* ---------- pages ---------- */
// A panel is [x0, y0, x1, y1] in frame fractions from the top left, the shot it
// shows, and the beat (from the page's start) on which it slams in.
const FULL = [0, 0, 1, 1];
const full = (shot) => [{ r: FULL, shot }];
const three = (a, b, c) => [
  { r: [0, 0, 0.36, 1], shot: a },
  { r: [0.36, 0, 0.68, 1], shot: b, beat: 4 },
  { r: [0.68, 0, 1, 1], shot: c, beat: 8 },
];
const two = (a, b) => [{ r: [0, 0, 1, 0.55], shot: a }, { r: [0, 0.55, 1, 1], shot: b, beat: 4 }];
const four = (a, b, c, d, step = 1) => [
  { r: [0, 0, 0.55, 0.5], shot: a },
  { r: [0.55, 0, 1, 0.5], shot: b, beat: step },
  { r: [0, 0.5, 0.45, 1], shot: c, beat: step * 2 },
  { r: [0.45, 0.5, 1, 1], shot: d, beat: step * 3 },
];
const bar = (n) => n * BAR;

const FRANTIC = ["eye", "faces", "pin", "daisy", "smile", "bite", "faces", "pin", "eye", "swim", "smile", "pin", "faces", "eye", "pin", "bite"];
const FINALE = [
  ["move:festival:bombPunch", "faces", "move:city:airClash", "bomb"],
  ["smile:booth", "cord", "typhoon", "bombFace:low"],
  ["move:city:chase", "daisy", "move:festival:grab", "smile:festival"],
];
// Her two faces, cut against each other: a different place and angle every bar.
const SMILES = ["festival", "booth", "cafe", "pool"];
const BOMB_FACES = ["low", "profile", "close", "fire"];

const PAGES = [
  // Intro (0:00 – 0:17): fate, intersecting.
  { t: bar(0), panels: full("waterHand"), iris: "open" },
  { t: bar(2), panels: full("denjiWalk") },
  { t: bar(4), panels: full("rezeWalk") },
  { t: bar(6), panels: three("rain", "booth", "daisy") },
  { t: bar(8), panels: full("eye"), makima: true },
  { t: bar(8.5), panels: full("boothTwo"), words: [{ id: "title", at: 0, until: bar(1.5), x: 50, y: 74, size: 16 }] },
  // Verse one (0:18 – 0:48): head over heels.
  { t: bar(10), panels: full("cafeSmile") },
  { t: bar(14), panels: full("cafeSchool") },
  { t: bar(16), panels: two("swim", "float") },
  { t: bar(20), panels: full("faces") },
  { t: bar(24), panels: four("smile", "boothTwo", "swim", "faces", 2) },
  // Pre-chorus and chorus (0:49 – 1:15): the drop, the BOOM, the closing ring.
  { t: bar(27), panels: full("frantic"), frantic: true },
  { t: bar(31), panels: [], drop: true },
  { t: bar(31.5), panels: full("bombReveal"), words: [{ id: "boom", at: BEAT * 2, until: bar(2.5), x: 50, y: 30, size: 16 }] },
  { t: bar(34), panels: full("bomb"), ring: true },
  {
    t: bar(38),
    panels: four("bite", "pin", "bomb", "cord", 4),
    words: [
      { id: "crunch", at: 0, until: bar(4), x: 27, y: 18, size: 8 },
      { id: "boom", at: bar(2), until: bar(4), x: 22, y: 70, size: 8 },
      { id: "vroom", at: bar(3), until: bar(4), x: 72, y: 70, size: 8 },
    ],
  },
  // Verse two and bridge (1:16 – 1:55): control, chaos, the city at war.
  { t: bar(42), panels: full("othello") },
  { t: bar(45.5), panels: full("othello"), makima: true },
  { t: bar(46), panels: full("fight:city"), fight: "city" },
  { t: bar(54), panels: full("typhoon") },
  { t: bar(58), panels: full("fight:festival"), fight: "festival" },
  // Last chorus (1:56 – 2:31): the crossfire, her two faces, the blackout.
  ...Array.from({ length: 8 }, (_, i) => ({ t: bar(65 + i), panels: full(i % 2 ? `bombFace:${BOMB_FACES[(i - 1) / 2]}` : `smile:${SMILES[i / 2]}`), pulse: true })),
  ...FINALE.map((shots, i) => ({ t: bar(73 + i * 2), panels: four(...shots, 2), pulse: true })),
  { t: bar(79), panels: full("end"), iris: "close", words: [{ id: "title", at: CYCLE - bar(79) - 4.6, until: CYCLE - bar(79) - 1, x: 50, y: 74, size: 12 }] },
];

export const createIrisOutScene = (stage, { overlay } = {}) => {
  const { camera, renderer, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe", "school", "pool", "festival"]);
  const cast = createCast(w, { chainsaw: true, bomb: true, daisy: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const water = lot.sets.pool.water.material.uniforms;

  const title = createSfx(overlay, { text: "IRIS\u00a0OUT", crescendo: 0.2 });
  const crunch = createSfx(overlay, { text: "CRNCH!", crescendo: 0.4 });
  const boom = createSfx(overlay, { text: "BOOM!!", crescendo: 0.8 });
  const vroom = createSfx(overlay, { text: "VRRRN!!", crescendo: 0.8 });
  const words = [title, crunch, boom, vroom];

  // ── Othello: a board, every disc turning black ──
  const othello = new THREE.Group();
  othello.position.set(400, 0, 0);
  w.scene.add(othello);
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 4.2), w.ink({ tint: "#1f6a46", tone: 0.85, rim: 0.4 }));
  othello.add(board);
  for (let i = 0; i <= 8; i++) {
    for (const along of [0, 1]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.015 : 4.0, 0.01, along ? 4.0 : 0.015), w.flat);
      line.position.set(along ? -2 + i * 0.5 : 0, 0.065, along ? 0 : -2 + i * 0.5);
      othello.add(line);
    }
  }
  const whiteSide = w.ink({ tint: "#f4f1ea", tone: 1.1, rim: 0.4 });
  const blackSide = w.ink({ tint: "#16161a", tone: 0.6, rim: 0.8 });
  const discs = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const d = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 24), whiteSide);
      top.position.y = 0.018;
      const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 24), blackSide);
      bottom.position.y = -0.018;
      d.add(top, bottom);
      d.position.set(-1.75 + c * 0.5, 0.11, -1.75 + r * 0.5);
      othello.add(d);
      // The order they fall: outward from one corner, a little out of step.
      discs.push({ d, at: (Math.hypot(r, c) / 11.3) * 0.8 + ((r * 7 + c * 3) % 5) * 0.02, black: (r * 3 + c) % 7 === 0 });
    }
  }

  // ── The Typhoon Devil: a funnel of rings over the city ──
  const typhoon = new THREE.Group();
  typhoon.position.copy(lot.sets.street.origin).add(new THREE.Vector3(2, 0, -26));
  w.scene.add(typhoon);
  const swirl = w.ink({ tint: "#5b6478", tone: 0.7, rim: 1.2 });
  const rings = Array.from({ length: 16 }, (_, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1 + i * 0.75, 0.25 + i * 0.05, 6, 28), swirl);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = i * 1.4;
    typhoon.add(ring);
    return ring;
  });

  // ── Makima's eyes: ringed, gold, watching; mice in the shadow below ──
  const ringsSvg = (cx) =>
    [34, 26, 19, 13, 8].map((r, i) => `<circle cx="${cx}" cy="50" r="${r}" fill="${i % 2 ? "#f2c14e" : "#b8862b"}" stroke="#3a2412" stroke-width="1.4"/>`).join("") +
    `<circle cx="${cx}" cy="50" r="4" fill="#3a2412"/>`;
  const mouse = (x) => `<g transform="translate(${x} 92) scale(0.55)" fill="#0d0c0c"><ellipse cx="0" cy="0" rx="9" ry="6"/><circle cx="8" cy="-4" r="4.5"/><circle cx="7" cy="-9" r="3"/><path d="M-9 0 Q-18 -2 -22 4" stroke="#0d0c0c" stroke-width="1.4" fill="none"/></g>`;
  const makima = cuts.el({ inset: "0", display: "none", background: "radial-gradient(circle at 50% 50%, #3a0d12, #0d0c0c 70%)" });
  makima.innerHTML = `<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
    <g>${["M20 50 Q60 12 100 50 Q60 84 20 50 Z", "M100 50 Q140 12 180 50 Q140 84 100 50 Z"].map((d) => `<path d="${d}" fill="#f6efe2" stroke="#0d0c0c" stroke-width="2"/>`).join("")}</g>
    <clipPath id="iris-l"><path d="M20 50 Q60 12 100 50 Q60 84 20 50 Z"/></clipPath><clipPath id="iris-r"><path d="M100 50 Q140 12 180 50 Q140 84 100 50 Z"/></clipPath>
    <g clip-path="url(#iris-l)">${ringsSvg(60)}</g><g clip-path="url(#iris-r)">${ringsSvg(140)}</g>
    ${[70, 84, 98, 112, 126].map(mouse).join("")}
  </svg>`;

  // Ink borders round each panel (DOM), so the page reads as a page.
  const borders = Array.from({ length: 4 }, () => cuts.el({ border: `0.35vmin solid ${INK}`, boxSizing: "border-box", display: "none" }));

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  const away = (f) => f.root.position.set(0, -50, 0);

  /** Back to neutral between panels: nobody transformed, nobody holding anything. */
  const reset = () => {
    const { denji, reze, pin, saw, daisy } = cast;
    denji.root.rotation.set(0, 0, 0);
    reze.root.rotation.set(0, 0, 0);
    cast.untransform();
    pin.visible = true;
    daisy.visible = false;
    othello.visible = false;
    typhoon.visible = false;
    saw.set(0, 0);
    cast.cord?.set(false);
    camera.up.set(0, 1, 0);
  };
  const bombOn = () => {
    cast.reze.root.updateMatrixWorld(true);
    cast.transform(1);
  };

  /* ---------- shots: each stages one panel at local time s ---------- */
  const SHOTS = {
    eye(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(Math.floor(time / BEAT) % 4 === 3 ? LIGHT.blood : LIGHT.festival);
      w.page({ mode: "lines", intensity: 0.8, focus: [0.42, 0.55], seed: Math.floor(time / BEAT) });
      away(denji);
      reze.root.position.copy(at("festival", 0, 0, 0));
      reze.apply({ ...STAND, head: [-0.08, 0.15, 0] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      const k = easeOutCubic(segment(s, 0, 3.6));
      // Three-quarter profile, the festival light raking across her.
      cam(tmp.clone().add(new THREE.Vector3(0.55 - k * 0.1, 0.02, 0.62 - k * 0.12)), tmp.clone().add(new THREE.Vector3(-0.02, -0.02, 0)));
    },
    rain(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.stormWarm);
      w.page({ mode: "rain", intensity: 0.8, disc: [0.75, 0.82, 0], seed: Math.floor(time * 10) });
      away(reze);
      denji.root.position.copy(at("street", -6 + s * 1.6, 0, 0.9));
      denji.root.rotation.y = Math.PI / 2;
      denji.apply(jog(time * 9));
      cam(tmp.copy(denji.root.position).add(new THREE.Vector3(0.6, 1.2, 2.6)), denji.root.position.clone().add(new THREE.Vector3(0.4, 1.1, 0)));
    },
    booth(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.8, seed: Math.floor(time * 10) });
      away(denji);
      reze.root.position.copy(at("street", 0.3, 0, -0.05));
      reze.root.rotation.y = 0.15;
      reze.apply(WAITING);
      reze.root.updateMatrixWorld(true);
      reze.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.1, 0.05, 1.6 - s * 0.08)), tmp.clone().add(new THREE.Vector3(0, -0.2, 0)));
    },
    daisy(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.6, seed: Math.floor(time * 10) });
      away(reze);
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.6;
      denji.apply(OFFER);
      denji.root.updateMatrixWorld(true);
      daisy.visible = true;
      denji.model.getObjectByName("hand_r").getWorldPosition(daisy.position);
      daisy.position.y += 0.1;
      daisy.rotation.set(Math.PI / 2.6, 0.6, 0);
      daisy.scale.setScalar(1.8);
      cam(daisy.position.clone().add(new THREE.Vector3(0.35, 0.05, 0.5)), daisy.position);
    },
    boothTwo(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.7, seed: Math.floor(time * 10) });
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.6;
      denji.apply(STAND);
      reze.root.position.copy(at("street", 0.3, 0, -0.05));
      reze.root.rotation.y = -0.75;
      const laugh = Math.sin(time * 9) * 0.04;
      // The daisy held low, so her laugh stays in the frame.
      reze.apply({ ...STAND, spine: [-0.06, 0, 0], head: [-0.2 + laugh, 0.1, 0.12], lShoulder: [-0.55, -0.2, 0.15], lElbow: [-1.45, 0, 0] });
      reze.root.updateMatrixWorld(true);
      daisy.visible = true;
      reze.model.getObjectByName("hand_l").getWorldPosition(daisy.position);
      daisy.position.y += 0.1;
      daisy.rotation.set(Math.PI / 2.6, -0.5, 0);
      daisy.scale.setScalar(1.6);
      const k = easeInOutCubic(segment(s, 0, BAR * 4));
      cam(at("street", 0.9, 1.45, 2.4).lerp(at("street", 0.55, 1.5, 1.7), k), at("street", 0.05, 1.3, 0));
    },
    walk(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      const k = segment(s, 0, BAR * 4);
      denji.root.position.copy(at("festival", -0.3, 0, lerp(5, 1.2, k)));
      reze.root.position.copy(at("festival", 0.3, 0, lerp(5.1, 1.3, k)));
      denji.root.rotation.y = reze.root.rotation.y = Math.PI;
      const walk = (p) => {
        const q = Math.sin(p);
        return { spine: [0.05, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] };
      };
      denji.apply(walk(time * 6));
      reze.apply({ ...walk(time * 6 + 0.5), head: [-0.3, -0.2, 0] });
      cam(at("festival", 0.9, 1.3, lerp(-1.8, -1.2, k)), at("festival", 0, 1.5, 2.6));
    },
    waterHand(s, time) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time * 0.4;
      away(denji);
      // Crouched at the edge, one hand into the water.
      reze.root.position.copy(at("pool", -1.2, 0, 3.25));
      reze.root.rotation.y = Math.PI;
      reze.apply({ spine: [0.75, 0, 0], head: [0.3, 0, 0], lHip: [-2.0, 0, 0.15], lKnee: [2.3, 0, 0], rHip: [-1.4, 0, -0.15], rKnee: [2.1, 0, 0], rShoulder: [-1.2, 0, -0.1], rElbow: [-0.15, 0, 0], lShoulder: [0.2, 0, 0.3], lift: -0.45 });
      // Place her by the hand: it comes down and breaks the surface.
      const touch = at("pool", -1.2, lerp(0.22, -0.03, easeInOutCubic(segment(s, 0.5, 1.6))), 2.5);
      reze.root.updateMatrixWorld(true);
      reze.root.position.add(touch.clone().sub(reze.model.getObjectByName("hand_r").getWorldPosition(tmp)));
      reze.root.updateMatrixWorld(true);
      water.uA.value.set(touch.x, touch.z, s > 1.3 ? 1 : 0);
      water.uB.value.set(0, 0, 0);
      water.uMoonX.value = touch.x;
      cam(touch.clone().add(new THREE.Vector3(0.6, 0.18, -0.55)), touch.clone().add(new THREE.Vector3(0, 0.08, 0)));
    },
    denjiWalk(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.2, 0.8, 0.5);
      w.palette(LIGHT.gray);
      w.page({ mode: "still" });
      away(reze);
      denji.root.position.copy(at("street", -3 + s * 0.6, 0, 1.6));
      denji.root.rotation.y = 0.9;
      const q = Math.sin(time * 5.5);
      denji.apply({ spine: [-0.05, 0, 0], neck: [-0.25, 0, 0], head: [-0.35, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] });
      // Low, looking up past him at the grey sky.
      cam(denji.root.position.clone().add(new THREE.Vector3(1.4, 0.35, 1.6)), denji.root.position.clone().add(new THREE.Vector3(-0.2, 1.9, -0.4)));
    },
    rezeWalk(s, time) {
      const { denji, reze } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.75, seed: Math.floor(time * 10) });
      away(denji);
      reze.root.position.copy(at("street", 4.5 - s * 0.7, 0, 0.8));
      reze.root.rotation.y = -Math.PI / 2;
      const q = Math.sin(time * 5.5);
      reze.apply({ spine: [0.04, 0, 0], head: [0.08, 0, 0], lShoulder: [-0.3 * q, 0, 0.1], rShoulder: [0.3 * q, 0, -0.1], lHip: [0.45 * q - 0.05, 0, 0.03], lKnee: [Math.max(0, -q) * 0.6 + 0.05, 0, 0], rHip: [-0.45 * q - 0.05, 0, -0.03], rKnee: [Math.max(0, q) * 0.6 + 0.05, 0, 0] });
      cam(reze.root.position.clone().add(new THREE.Vector3(-0.6, 1.2, 2.4)), reze.root.position.clone().add(new THREE.Vector3(-0.3, 1.15, 0)));
    },
    cafeSmile(s, time) {
      const { denji, reze } = cast;
      lot.show("cafe");
      w.light(0.85, 0.55, 0.1);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      away(denji);
      const cafe = lot.sets.cafe;
      reze.root.position.copy(cafe.spots.her).add(cafe.origin);
      reze.apply({ ...LEAN, head: [-0.5, 0.15, 0.2 + Math.sin(time * 1.2) * 0.05] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      // His side of the counter: her, smiling up at him.
      const k = easeInOutCubic(segment(s, 0, BAR * 4));
      cam(tmp.clone().add(new THREE.Vector3(0.25, 0.05, 1.3 - k * 0.35)), tmp.clone().add(new THREE.Vector3(0, -0.04, 0)));
    },
    frantic(s, time) {
      SHOTS[FRANTIC[Math.floor(s / BEAT) % FRANTIC.length]](s, time);
    },
    smile(s, time, where = "festival") {
      const { denji, reze } = cast;
      away(denji);
      if (where === "cafe") return SHOTS.cafeSmile(s, time);
      if (where === "booth") {
        SHOTS.boothTwo(BAR * 4, time);
        away(denji);
        cast.daisy.visible = false;
        reze.root.updateMatrixWorld(true);
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.55, -0.02, 0.75 - s * 0.04)), tmp.clone().add(new THREE.Vector3(0, -0.03, 0)));
        return;
      }
      if (where === "pool") {
        lot.show("pool");
        w.light(0.3, 0.8, -0.5);
        w.palette(LIGHT.pool);
        w.page({ mode: "still" });
        water.uTime.value = time;
        reze.root.position.copy(at("pool", -0.8, -1.38, 0.6));
        reze.root.rotation.y = 0.3;
        reze.apply(TREAD(time * 3));
        water.uA.value.set(reze.root.position.x, reze.root.position.z, 1);
        water.uB.value.set(0, 0, 0);
        reze.root.updateMatrixWorld(true);
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.35, 0.12, 0.9)), tmp.clone().add(new THREE.Vector3(0, -0.02, 0)));
        return;
      }
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -0.4;
      reze.apply({ ...STAND, head: [-0.12, 0.2, 0.15] });
      reze.root.updateMatrixWorld(true);
      reze.bones.head.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.15, 0.0, 0.85 - s * 0.05)), tmp.clone().add(new THREE.Vector3(0, -0.02, 0)));
    },
    bombFace(s, time, angle = "close") {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(0.5, 0.3, 0.8);
      w.palette(LIGHT.devil);
      w.page({ mode: "lines", intensity: 1, focus: [0.5, 0.45], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -0.4;
      reze.apply(DEVIL(time));
      bombOn();
      cast.bombHead.getWorldPosition(tmp);
      const VIEW = {
        close: [new THREE.Vector3(-0.2, 0.15, 1.15), 0.15],
        low: [new THREE.Vector3(0.35, -1.2, 1.5), 0.1],
        profile: [new THREE.Vector3(-1.15, 0.18, 0.1), 0.18],
        fire: [new THREE.Vector3(0.6, 0.3, 1.7), 0.1],
      }[angle];
      cam(tmp.clone().add(VIEW[0]).add(new THREE.Vector3(0, 0, -s * 0.06)), tmp.clone().add(new THREE.Vector3(0, VIEW[1], 0)));
      if (angle === "fire" && frame.dt > 0 && Math.random() < frame.dt * 3) fx.blast(tmp.clone().add(new THREE.Vector3(-1.2 + Math.random() * 2.4, -0.4, -2.5)));
    },
    bombReveal(s, time) {
      const { denji, reze, pin } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(s < BEAT * 2 ? LIGHT.blood : LIGHT.devil);
      w.page({ mode: "lines", intensity: 1, focus: [0.5, 0.4], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.2, 0, 0.6));
      reze.apply(s < BEAT ? PIN : s < BEAT * 2 ? YANKED : DEVIL(time));
      pin.visible = s < BEAT;
      if (s >= BEAT * 2) {
        reze.root.updateMatrixWorld(true);
        cast.transform(lerp(0.2, 1, easeOutBack(segment(s, BEAT * 2, BEAT * 3))));
      }
      cam(at("festival", 0.5, 0.45, 2.7), at("festival", 0.2, 1.45, 0.6));
    },
    othello(s, time) {
      const { denji, reze } = cast;
      lot.show("none");
      othello.visible = true;
      w.light(-0.3, 0.9, 0.4);
      w.palette(LIGHT.devil);
      w.page({ mode: "still" });
      away(denji);
      away(reze);
      // Each disc turns over in its moment; by the end, all of them are black.
      const k = segment(s, 0.3, BAR * 3.5) * 1.05;
      discs.forEach(({ d, at: when, black }) => (d.rotation.x = black ? Math.PI : Math.PI * easeInOutCubic(segment(k, when, when + 0.08))));
      cam(new THREE.Vector3(400 + 2.4 - s * 0.05, 3.2, 3.2), new THREE.Vector3(400, 0, 0.1));
    },
    /** One fight, a move per bar: which moves, and where, come from MOVES. */
    fight(s, time, where) {
      const list = MOVES[where];
      const i = Math.min(list.length - 1, Math.floor(s / BAR));
      SHOTS.move(s - i * BAR, time, where, list[i], `${where}${i}`);
    },
    /** A single move of the fight, `m` seconds into its bar. */
    move(m, time, where, name, key = `${where}-${name}`) {
      const { denji, reze, saw } = cast;
      const set = where === "city" ? "street" : where === "pool" ? "pool" : "festival";
      // The city fight is staged up the street, clear of the booth.
      const [cx, cz] = set === "street" ? [-4.4, 1.8] : [0, 0.6];
      const P = (x, y, z) => at(set, cx + x, y, cz + z);
      const b = Math.floor(m / BEAT);
      const hit = (beat, fn) => {
        const id = `${key}:${Math.floor(frame.c / BAR)}:${beat}`;
        if (b >= beat && !hits.has(id) && frame.dt > 0) {
          hits.add(id);
          fn();
        }
      };
      lot.show(name === "plunge" || name === "sink" ? "pool" : set);
      const night = set === "street" ? LIGHT.storm : LIGHT.festival;
      w.palette(b === (MOVE_WORD[name]?.[1] ?? -1) ? LIGHT.blood : [night, LIGHT.devil][b % 2]);
      w.light(b % 2 ? 0.6 : -0.6, 0.5, 0.6);
      w.page(set === "street" ? { mode: "rain", intensity: 0.9, seed: b + Math.floor(time * 10) } : { mode: "lines", intensity: 1, focus: [0.5, 0.5], seed: Math.floor(time * 12) });
      saw.set(1, time);
      denji.root.rotation.set(0, Math.PI / 2, 0);
      reze.root.rotation.set(0, -Math.PI / 2, 0);
      const shake = (k) => new THREE.Vector3((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, 0);
      const her = (pose) => {
        reze.apply(pose);
        bombOn();
      };

      if (name === "rocket") {
        // She crouches, and goes up on her own blast.
        away(denji);
        const up = easeOutCubic(segment(m, BEAT, BAR));
        reze.root.position.copy(P(1.0 + up * 1.6, up * 4.2, 0));
        her(m < BEAT ? CROUCH : FLY);
        hit(1, () => fx.blast(P(1.0, 0.1, 0)));
        cam(P(-0.8, 0.25, 2.8).add(shake(b === 1 ? 0.1 : 0)), P(1.4 + up, 1.4 + up * 3, 0));
      } else if (name === "fingerBombs") {
        // Bombs off her fingers, one a beat; he runs straight through them.
        reze.root.position.copy(P(2.4, 1.4 + Math.sin(time * 3) * 0.1, -0.5));
        her(b % 2 ? PUNCH : DEVIL(time));
        const run = segment(m, 0, BAR);
        denji.root.position.copy(P(lerp(-2.6, 0.4, run), 0, 0.2));
        denji.apply(blendPose(jog(time * 11), LUNGE, 0.45));
        for (let k = 0; k < 4; k++) hit(k, () => fx.blast(P(lerp(-2.2, 0.6, k / 3) + (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.5, (k % 2 ? 0.7 : -0.5))));
        // Over her shoulder: her in the foreground, him coming through the fire.
        cam(P(3.5, 2.4, 0.5), P(-0.6, 1.0, 0.1));
      } else if (name === "sawLeap") {
        // He comes down on her saws first; she slips back out of it.
        const air = segment(m, 0, BEAT * 2);
        denji.root.position.copy(P(lerp(-2.4, 0.1, easeOutCubic(air)), Math.sin(Math.PI * air) * 1.3, 0));
        denji.apply(m < BEAT * 1.6 ? LEAP : SLASH);
        const slip = easeOutCubic(segment(m, BEAT * 1.4, BEAT * 2.2));
        reze.root.position.copy(P(lerp(1.1, 2.2, slip), 0, lerp(0, -0.4, slip)));
        her(slip > 0.05 ? DODGE : DEVIL(time));
        hit(2, () => fx.blood(P(1.3, 1.3, -0.2), 70));
        cam(P(-0.1 + m * 0.1, 1.1, 4.4 - m * 0.2), P(0.1, 1.2, 0));
      } else if (name === "bombPunch") {
        // She closes the gap and punches; the punch is an explosion. He flies.
        const dash = easeOutCubic(segment(m, 0, BEAT));
        reze.root.position.copy(P(lerp(2.7, 0.9, dash), 0, 0));
        her(m < BEAT * 0.5 ? DEVIL(time) : PUNCH);
        const fly = segment(m, BEAT, BAR);
        denji.root.position.copy(P(-easeOutCubic(fly) * 3.4, Math.sin(Math.PI * Math.min(1, fly * 1.2)) * 0.9, 0));
        denji.root.rotation.z = fly * 0.9;
        denji.apply(fly > 0 ? KNOCKED : LUNGE);
        hit(1, () => {
          fx.blast(P(0.4, 1.35, 0));
          fx.blood(P(0.2, 1.3, 0), 90);
        });
        cam(P(1.0, 1.5, 4.3).add(shake(b === 1 ? 0.12 : 0.02)), P(-0.7, 1.1, 0));
      } else if (name === "regrow") {
        // On one knee, in pieces; the cord; he comes back up revving.
        reze.root.position.copy(P(2.8, 0, -1.4));
        reze.root.rotation.y = -Math.PI / 2 - 0.5;
        her(DEVIL(time));
        denji.root.position.copy(P(-0.6, 0, 0));
        denji.root.rotation.y = Math.PI / 2 + 0.5;
        let pose = KNEEL;
        if (m > BEAT) pose = blendPose(KNEEL, { ...KNEEL, ...CORD, head: KNEEL.head }, easeOutCubic(segment(m, BEAT, BEAT * 1.4)));
        if (m > BEAT * 2) pose = blendPose(pose, { ...KNEEL, ...YANK }, easeOutCubic(segment(m, BEAT * 2, BEAT * 2.2)));
        if (m > BEAT * 3) pose = blendPose(pose, RISE, easeOutBack(segment(m, BEAT * 3, BEAT * 3.6)));
        denji.apply(pose);
        saw.set(m < BEAT * 2 ? 0 : easeOutBack(segment(m, BEAT * 2.1, BEAT * 2.7)), time);
        cast.cord?.set(m > BEAT * 0.8 && m < BEAT * 2.4, m < BEAT * 2.2 ? easeOutCubic(segment(m, BEAT, BEAT * 1.3)) : 1 - segment(m, BEAT * 2.2, BEAT * 2.4));
        hit(2, () => fx.blood(P(-0.6, 1.0, 0), 60));
        cam(P(0.5, 0.75, 1.9), P(-0.5, 0.95, 0));
      } else if (name === "airClash") {
        // Both off the ground, into each other; the blast throws them apart.
        const go = easeInOutCubic(segment(m, 0, BEAT * 2));
        const apart = easeOutCubic(segment(m, BEAT * 2, BAR));
        denji.root.position.copy(P(lerp(-2.6, -0.42, go) - apart * 1.8, lerp(0.3, 2.3, go) - apart * 0.8, 0));
        reze.root.position.copy(P(lerp(2.6, 0.42, go) + apart * 1.8, lerp(0.5, 2.2, go) + apart * 0.6, 0));
        denji.apply(apart > 0 ? KNOCKED : LEAP);
        her(apart > 0 ? FLY : PUNCH);
        hit(2, () => fx.blast(P(0, 2.7, 0)));
        cam(P(0.2, 0.35, 3.4).add(shake(b === 2 ? 0.12 : 0)), P(0, 2.3, 0));
      } else if (name === "chase") {
        // Over the street on her blasts; him under her, keeping up.
        const k = segment(m, 0, BAR);
        reze.root.position.copy(P(lerp(-2.5, 2.8, k), 3.0 + Math.sin(time * 4) * 0.15, -0.6));
        reze.root.rotation.set(0, Math.PI / 2, 0.15);
        her(FLY);
        denji.root.position.copy(P(lerp(-3.4, 1.6, k), 0, 0.5));
        denji.apply(jog(time * 12));
        for (let k2 = 0; k2 < 4; k2++) hit(k2, () => fx.blast(reze.root.position.clone().add(new THREE.Vector3(-0.6, -0.3, 0))));
        const mid = lerp(-2.9, 2.2, k);
        cam(P(mid - 0.6, 1.4, 6.4), P(mid, 1.9, 0));
      } else if (name === "grab") {
        // He gets hold of her and does not let go. Backlit: two shapes turning.
        w.light(0, 0.35, -1);
        const a = m * 1.6;
        const ox = Math.cos(a) * 0.4;
        const oz = Math.sin(a) * 0.4;
        denji.root.position.copy(P(-ox, 0, -oz));
        reze.root.position.copy(P(ox, 0, oz));
        denji.root.rotation.y = Math.atan2(ox, oz);
        reze.root.rotation.y = Math.atan2(-ox, -oz);
        denji.apply(CLINCH);
        her(STRUGGLE(time));
        cam(P(0.3, 1.45, 2.6), P(0, 1.35, 0));
      } else if (name === "plunge") {
        // Off the edge together, still holding on, into the water.
        const pool = lot.sets.pool;
        w.palette(LIGHT.storm);
        w.page({ mode: "rain", intensity: 0.8, seed: Math.floor(time * 10) });
        water.uTime.value = time;
        const Q = (x, y, z) => at("pool", -0.8 + x, y, 0.6 + z);
        const fall = easeInOutCubic(segment(m, 0, BEAT * 2.2));
        const y = lerp(3.2, -0.9, fall);
        denji.root.position.copy(Q(-0.4, y, 0));
        reze.root.position.copy(Q(0.4, y + 0.05, 0));
        denji.root.rotation.set(0, Math.PI / 2, 0.15);
        reze.root.rotation.set(0, -Math.PI / 2, -0.15);
        denji.apply(CLINCH);
        her(STRUGGLE(time * 0.4));
        hit(2, () => fx.splash(Q(0, 0.05, 0), 120));
        water.uA.value.set(pool.origin.x - 0.8, pool.origin.z + 0.6, fall > 0.9 ? 1 : 0);
        water.uB.value.set(0, 0, 0);
        water.uMoonX.value = pool.origin.x - 0.8;
        cam(Q(2.4, 1.1, 2.6), Q(0, lerp(2.4, 0.2, fall), 0));
      } else {
        // sink: they are gone under. Only the daisy comes back up, turning on the rings.
        const pool = lot.sets.pool;
        w.palette(LIGHT.storm);
        w.page({ mode: "rain", intensity: 0.6, seed: Math.floor(time * 10) });
        water.uTime.value = time;
        away(denji);
        away(reze);
        const spot = at("pool", -0.8, 0, 0.6);
        water.uA.value.set(spot.x, spot.z, 1);
        water.uB.value.set(0, 0, 0);
        water.uMoonX.value = spot.x;
        const { daisy } = cast;
        daisy.visible = true;
        daisy.scale.setScalar(2.2);
        daisy.position.copy(spot).add(new THREE.Vector3(0, lerp(-0.12, 0.02, easeOutCubic(segment(m, 0, BEAT * 2))), 0));
        daisy.rotation.set(-0.1, time * 0.3, 0.05);
        cam(spot.clone().add(new THREE.Vector3(0.7, 0.45, 0.9)), spot.clone().add(new THREE.Vector3(0, 0.02, 0)));
      }
    },
    typhoon(s, time) {
      const { denji, reze, saw } = cast;
      lot.show("street");
      typhoon.visible = true;
      w.light(-0.3, 0.6, 0.6);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 1, seed: Math.floor(time * 10) });
      away(reze);
      rings.forEach((ring, i) => {
        ring.rotation.z = time * (0.6 + i * 0.05);
        ring.position.x = Math.sin(time * 0.8 + i * 0.35) * (0.4 + i * 0.12);
      });
      // Small in the foreground: him, facing it.
      denji.root.position.copy(at("street", 0, 0, 2.5));
      denji.root.rotation.y = Math.PI;
      denji.apply({ ...STAND, lShoulder: [0, 0, 0.5], rShoulder: [0, 0, -0.5] });
      saw.set(1, time);
      cam(at("street", 1.6, 0.6, 7), at("street", 0.6, 6, -20));
    },
    cafeSchool(s, time) {
      const { denji, reze } = cast;
      const school = Math.floor(s / (BEAT * 2)) % 2 === 1;
      if (!school) {
        lot.show("cafe");
        w.light(0.85, 0.55, 0.1);
        w.palette(LIGHT.cafe);
        w.page({ mode: "still" });
        const cafe = lot.sets.cafe;
        reze.root.position.copy(cafe.spots.her).add(cafe.origin);
        reze.apply(LEAN);
        denji.root.position.copy(cafe.spots.him).add(cafe.origin);
        denji.root.position.y = 0.32;
        denji.root.rotation.y = Math.PI;
        denji.apply(SIT);
        seat(denji, cafe.spots.stool.clone().add(cafe.origin));
        cam(at("cafe", 1.5 - s * 0.05, 1.6, -0.6), at("cafe", -1.0, 1.32, -0.55));
      } else {
        lot.show("school");
        w.light(0.9, 0.5, 0.2);
        w.palette(LIGHT.school);
        w.page({ mode: "still" });
        reze.root.position.copy(at("school", 0.2, 0.38, -1.45));
        reze.root.rotation.y = Math.PI / 2;
        reze.apply(SIT_DESK(time));
        seat(reze, at("school", 0.38, 0.76, -1.4));
        denji.root.position.copy(at("school", 1.8, 0.06, -0.85));
        denji.root.rotation.y = Math.PI + 0.75;
        denji.apply(SIT);
        seat(denji, at("school", 1.8, 0.47, -0.85));
        cam(at("school", 1.9, 1.55, 2.3), at("school", 0.95, 0.95, -1.15));
      }
    },
    swim(s, time) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      const a = time * 0.3;
      const ra = at("pool", -0.8 + Math.cos(a) * 0.9, -1.38, 0.6 + Math.sin(a) * 0.7);
      const da = at("pool", -0.8 + Math.cos(a + 2.6) * 0.9, -1.45, 0.6 + Math.sin(a + 2.6) * 0.7);
      reze.root.position.copy(ra);
      denji.root.position.copy(da);
      reze.root.rotation.y = -a;
      denji.root.rotation.y = -a - 2.6;
      reze.apply(TREAD(time * 3));
      denji.apply(TREAD(time * 3 + 1.5));
      water.uA.value.set(ra.x, ra.z, 1);
      water.uB.value.set(da.x, da.z, 1);
      water.uMoonX.value = lot.sets.pool.origin.x + 0.6;
      cam(at("pool", -0.8 + Math.sin(0.8 + s * 0.1) * 2.3, 0.6, 0.6 + Math.cos(0.8 + s * 0.1) * 2.3), at("pool", -0.8, 0.2, 0.6));
    },
    float(s, time) {
      const { denji, reze } = cast;
      lot.show("pool");
      w.light(0.3, 0.8, -0.5);
      w.palette(LIGHT.pool);
      w.page({ mode: "still" });
      water.uTime.value = time;
      reze.root.position.copy(at("pool", -1.2, 0.0, 1.55));
      denji.root.position.copy(at("pool", -0.2, 0.0, 1.65));
      reze.root.rotation.set(-Math.PI / 2, 0, 0.05);
      denji.root.rotation.set(-Math.PI / 2, 0, -0.05);
      reze.apply(FLOAT);
      denji.apply(FLOAT);
      water.uA.value.set(0, 0, 0);
      water.uB.value.set(0, 0, 0);
      water.uMoonX.value = lot.sets.pool.origin.x - 0.7;
      camera.up.set(0, 0, -1);
      cam(at("pool", -0.7, 3.6, 0.8), at("pool", -0.7, 0, 0.78));
    },
    faces(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      // Backlit by the fireworks: the kiss reads in silhouette.
      w.light(0.1, 0.35, -1);
      w.palette(LIGHT.festival);
      w.page({ mode: "still" });
      const k = easeInOutCubic(segment(s, 0, 3.6));
      // Chests stay apart; the lean and the tilt close the gap at the face.
      denji.root.position.copy(at("festival", lerp(-0.42, -0.25, k), 0, 0.6));
      reze.root.position.copy(at("festival", lerp(0.42, 0.25, k), 0, 0.6));
      denji.root.rotation.y = Math.PI / 2;
      reze.root.rotation.y = -Math.PI / 2;
      denji.apply(blendPose(STAND, KISS_HIM, k));
      reze.apply(blendPose(STAND, KISS_HER, k));
      cam(at("festival", 0.03, 1.5, 2.0 - k * 0.5), at("festival", 0, 1.5, 0.6));
    },
    bite(s, time) {
      SHOTS.faces(3.6, time);
      const { denji } = cast;
      w.palette(LIGHT.blood);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.5], seed: Math.floor(time * 12) });
      denji.apply(RECOIL);
      cam(at("festival", 0.02, 1.52, 1.25), at("festival", 0, 1.5, 0.6));
    },
    pin(s, time) {
      const { denji, reze, pin } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.blood);
      w.page({ mode: "still" });
      away(denji);
      reze.root.position.copy(at("festival", 0.17, 0, 0.6));
      reze.root.rotation.y = -Math.PI / 2;
      reze.apply(s < 0.6 ? PIN : YANKED);
      pin.visible = s < 0.6;
      reze.root.updateMatrixWorld(true);
      reze.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(-0.8, 0.05, 0.45)), tmp.clone().add(new THREE.Vector3(0, -0.05, 0)));
    },
    bomb(s, time) {
      const { denji, reze } = cast;
      lot.show("festival");
      w.light(-0.3, 0.6, 0.8);
      w.palette(LIGHT.devil);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.35], seed: Math.floor(time * 12) });
      away(denji);
      reze.root.position.copy(at("festival", 0.2, 0, 0.6));
      reze.root.rotation.y = 0;
      reze.apply(DEVIL(time));
      bombOn();
      cam(at("festival", 0.6, 0.35, 2.6), at("festival", 0.2, 1.55, 0.6));
    },
    cord(s, time) {
      const { denji, reze, saw } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.stormWarm);
      w.page({ mode: "lines", intensity: 0.9, focus: [0.5, 0.45], seed: Math.floor(time * 12) });
      away(reze);
      denji.root.position.copy(at("street", -0.32, 0, 0.12));
      denji.root.rotation.y = 0.3;
      const k = segment(s, 0.1, 0.5);
      denji.apply(blendPose(CORD, YANK, easeOutCubic(k)));
      saw.set(easeOutBack(segment(s, 0.45, 0.9)), time);
      denji.root.updateMatrixWorld(true);
      cast.cord?.set(s < 0.6, 1 - segment(s, 0.5, 0.6));
      denji.bones.neck.getWorldPosition(tmp);
      cam(tmp.clone().add(new THREE.Vector3(0.15, 0, 1.7)), tmp.clone().add(new THREE.Vector3(0, -0.15, 0)));
    },
    end(s, time) {
      const { denji, reze, daisy } = cast;
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.7, disc: [0.5, 0.78, 0], seed: Math.floor(time * 10) });
      away(denji);
      away(reze);
      daisy.visible = true;
      // Face up on the booth floor, where she dropped it.
      daisy.position.copy(at("street", 0.05, 0.02, 0.15));
      daisy.rotation.set(-0.3, 0.4, 0.1);
      daisy.scale.setScalar(2.4);
      const k = easeInOutCubic(segment(s, 0, 8));
      cam(at("street", 0.7 - k * 0.35, 1.3 - k * 0.6, 1.9 - k * 1.0), at("street", 0.05, 0.05, 0.15));
    },
  };

  /* ---------- the frame ---------- */
  const frame = { panels: [], time: 0, c: 0, dt: 0 };
  // Fight hits that already went off this pass, so each lands once.
  const hits = new Set();
  const state = { rocket: 0 };
  // Lock to the song: the video's clock arrives a few times a second, and the
  // film eases toward it so the cut never jumps.
  const sync = { offset: 0, goal: null };
  const WORDS = { title, crunch, boom, vroom };

  const update = (time, dt) => {
    if (sync.goal !== null) {
      // A seek or a new loop is a jump: snap. Small drift: ease.
      if (Math.abs(sync.goal - sync.offset) > 1.5) sync.offset = sync.goal;
      else sync.offset += (sync.goal - sync.offset) * Math.min(1, dt * 4);
    }
    const c = staticMode ? STATIC_TIME : (((time + sync.offset) % CYCLE) + CYCLE) % CYCLE;
    if (!cast.denji) return;
    let page = PAGES[0];
    for (const p of PAGES) if (c >= p.t) page = p;
    const s = c - page.t;
    const beat = Math.floor(s / BEAT);
    frame.time = time;
    frame.c = c;
    frame.dt = dt;
    frame.panels = page.panels.map((p) => ({ ...p, s, on: beat >= (p.beat ?? 0), fresh: Math.max(0, 1 - (s - (p.beat ?? 0) * BEAT) / 0.18) }));

    // Fireworks over the festival pages.
    const FESTIVAL = new Set(["faces", "walk", "bite", "bomb", "eye", "bombFace", "bombReveal", "smile:festival", "fight:festival", "move:festival"]);
    const festival = frame.panels.some((p) => FESTIVAL.has(p.shot) || FESTIVAL.has(p.shot.split(":")[0]) || FESTIVAL.has(p.shot.split(":").slice(0, 2).join(":")));
    if (dt > 0 && festival) {
      state.rocket += dt;
      if (state.rocket > 0.35) {
        state.rocket = 0;
        fx.firework(at("festival", -6 + Math.random() * 12, 6 + Math.random() * 3, -9 - Math.random() * 4), Math.random() < 0.5);
      }
    }
    fx.step(dt);
    if (c < 0.05) {
      fx.clear();
      hits.clear();
    }

    // ── Editing ──
    const cut = { iris: 1, flash: 0, black: 0, bars: 0, ring: "#c8102e" };
    if (page.iris === "open") {
      // Opens in two moves, the second on the downbeat of bar 2, pulsing on the beat between.
      cut.iris = segment(s, 0.2, BAR * 0.8) * 0.55 + 0.45 * easeOutCubic(segment(s, BAR * 3, BAR * 3.6)) + (s > BAR && s < BAR * 3 ? Math.sin((s / BEAT) * Math.PI) * 0.04 : 0);
      cut.at = [46, 44];
    }
    if (page.iris === "close") {
      const left = CYCLE - c;
      cut.iris = Math.min(easeOutCubic(segment(s, 0, 1.2)), 1 - easeInOutCubic(segment(left, 5, 1.2)) * 0.97 - (left < 1.2 ? 0.03 : 0));
      cut.at = [48, 70];
      cut.black = 1 - segment(left, 0.6, 0.05);
    }
    // Slam: a flash as each panel lands; chorus pages flash on the bar, the fight on each hit.
    // The drop: the music cuts out, and so does the picture.
    if (page.drop) cut.black = 1;
    // Tunnel vision: the iris closes to a ring round her and breathes on the beat.
    if (page.ring) {
      cut.iris = lerp(1, 0.4 + Math.sin((s / BEAT) * Math.PI) * 0.03, easeOutCubic(segment(s, 0, BAR)));
      cut.at = [50, 42];
    }
    const onBeat = Math.max(0, 1 - (s % BEAT) / 0.12);
    const onBar = Math.max(0, 1 - (s % BAR) / 0.14);
    // The fight: which move this bar is, and the beat it lands on.
    const move = page.fight ? MOVES[page.fight][Math.min(MOVES[page.fight].length - 1, Math.floor(s / BAR))] : null;
    const landed = move && MOVE_WORD[move] && Math.floor((s % BAR) / BEAT) === MOVE_WORD[move][1];
    cut.flash = Math.max(0, ...frame.panels.map((p) => (p.on && p.r !== FULL ? p.fresh * 0.6 : 0)), landed ? onBeat * 0.7 : 0, page.pulse ? onBar * 0.4 : 0, page.frantic ? onBeat * 0.35 : 0);
    makima.style.display = page.makima ? "block" : "none";
    if (page.fight) cut.flashColor = move === "bombPunch" || move === "airClash" ? "#fff6ea" : "#ff1d3d";
    else if (page.pulse) cut.flashColor = Math.floor(s / BAR) % 2 ? "#ff1d3d" : "#fff6ea";
    cuts.update(cut);

    // ── Lettering ──
    const shown = new Set();
    for (const word of page.words ?? []) {
      const k = segment(s, word.at, word.at + 0.25);
      const on = s > word.at && s < word.until;
      if (!on) continue;
      shown.add(word.id);
      WORDS[word.id].update({ x: word.x, y: word.y, size: word.size, rotate: word.id === "vroom" ? -8 : word.id === "title" ? -4 : 6, opacity: Math.min(1, k * 4), scale: lerp(2.4, 1, easeOutBack(k)), boil: Math.floor(time * 12), jitter: 0.08 });
    }
    if (move && MOVE_WORD[move]) {
      // One word per move, slammed on its hit and held to the end of the bar.
      const [id, on] = MOVE_WORD[move];
      const since = (s % BAR) - on * BEAT;
      if (since >= 0) {
        shown.add(id);
        const k = Math.min(1, since / 0.2);
        const left = Math.floor(s / BAR) % 2 === 0;
        WORDS[id].update({ x: left ? 30 : 68, y: left ? 72 : 26, size: 12, rotate: left ? -8 : 7, opacity: Math.min(1, k * 4), scale: lerp(2.2, 1, easeOutBack(k)), boil: Math.floor(time * 12), jitter: 0.1 });
      }
    }
    for (const [id, w] of Object.entries(WORDS)) if (!shown.has(id)) w.update({ opacity: 0 });

    // ── Panel borders ──
    borders.forEach((b, i) => {
      const p = frame.panels[i];
      if (!p || p.r === FULL) {
        b.style.display = "none";
        return;
      }
      b.style.display = "block";
      b.style.left = `${p.r[0] * 100}%`;
      b.style.top = `${p.r[1] * 100}%`;
      b.style.width = `${(p.r[2] - p.r[0]) * 100}%`;
      b.style.height = `${(p.r[3] - p.r[1]) * 100}%`;
      b.style.outline = `0.5vmin solid ${PAPER}`;
      b.style.outlineOffset = "-0.85vmin";
      b.style.opacity = p.on ? "1" : "0";
    });
  };

  /** Each panel: stage its shot, then draw it into its own scissored rectangle. */
  const render = () => {
    if (!cast.denji) {
      renderer.render(w.scene, camera);
      return;
    }
    const { width: W, height: H } = stage.size;
    const gutter = Math.max(2, Math.round(Math.min(W, H) * 0.008));
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, W, H);
    renderer.setViewport(0, 0, W, H);
    renderer.setClearColor(PAPER, 1);
    renderer.clear();
    for (const p of frame.panels) {
      const full = p.r === FULL;
      const g = full ? 0 : gutter;
      const x = Math.round(p.r[0] * W) + g;
      const y = Math.round((1 - p.r[3]) * H) + g;
      const pw = Math.round((p.r[2] - p.r[0]) * W) - g * 2;
      const ph = Math.round((p.r[3] - p.r[1]) * H) - g * 2;
      if (pw < 2 || ph < 2) continue;
      renderer.setScissor(x, y, pw, ph);
      renderer.setViewport(x, y, pw, ph);
      if (!p.on) {
        renderer.setClearColor(INK, 1);
        renderer.clear();
        continue;
      }
      reset();
      // A panel that just landed is drawn a touch large, then settles.
      camera.fov = 36 * (1 - p.fresh * 0.08);
      const [id, ...args] = p.shot.split(":");
      SHOTS[id](p.s - (p.beat ?? 0) * BEAT, frame.time, ...args);
      camera.aspect = pw / ph;
      camera.updateProjectionMatrix();
      w.bu.uAspect.value = pw / ph;
      renderer.render(w.scene, camera);
    }
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    camera.fov = 36;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fx.resize(height, camera.fov, renderer.getPixelRatio());
  });

  return {
    ready: cast.ready,
    update,
    render,
    /** `clock`: seconds into the song, from the video player. */
    setProps({ clock } = {}) {
      if (typeof clock === "number") sync.goal = clock - frame.time;
    },
    dispose() {
      unsubscribeResize();
      words.forEach((x) => x.dispose());
      borders.forEach((b) => b.remove());
      cuts.dispose();
    },
  };
};
