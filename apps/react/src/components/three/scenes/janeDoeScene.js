import * as THREE from "three";
import { canvasTexture, easeInCubic, easeInOutCubic, easeOutBack, lerp, segment } from "../kit";
import { INK, outline } from "../ink";
import { createCaption } from "../sfx";
import { createDaisy, createDaisyVase } from "../props";
import { createModelFigure } from "../modelFigure";
import { blendPose } from "../figure";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets } from "../rezeKit";

/**
 * JANE DOE — the close. Quiet, after everything. The song is a duet, so the
 * two of them answer each other in speech bubbles, apart and then together.
 *
 *   0  – 4.5  dawn at the station, the storm thinning: she waits alone on
 *             the platform, a red daisy in her hand
 *   4.5– 8    close on her and the daisy; she looks down the line
 *   8  – 18.5 from across the tracks: the train pulls in between us and her,
 *             stands, and pulls out. She is still there. She looks at the
 *             daisy, turns, and runs
 *   18.5– 23.5 her café, from behind the bar: he waits on a stool, daisies in
 *             a vase on the bar.  HIM: "Where are you?"
 *   23.5– 28  the street: she runs toward us, the red daisy in her hand.
 *             HER: "I'm here."
 *   28 – 32.5 close on him at the bar.  HIM: "What are you doing?"
 *   32.5– 37.5 alongside her, still running.
 *             HER: "I've always been watching over you."
 *   37.5– 38.9 the morning comes up white
 *   38.9– 45.5 the bar: the two of them side by side on the stools, the
 *             daisies between them.  BOTH: "Let's fill this world with mistakes."
 *   45.5– 50.5 he turns to her.  HIM: "Stay by my side. Let's go have some fun."
 *   50.5– 51.7 white again
 *   51.7– 56  the same frame, evening: he is alone, asleep with his head on
 *             the bar, her stool empty. He lifts his head. It was a dream.
 *   56 – 63   wide from the door: the old man who runs the café walks over.
 *             BOSS: "Denji, I have to close the shop."
 *   63 – 65   fade
 *
 * The lines are the user's plain-English renderings of the duet, and the
 * user's own line for the café's owner. Nothing shows what happened to her:
 * she just never arrives.
 */

const CYCLE = 65;
const STATIC_TIME = 42;

const RUN = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.2, 0, 0],
    head: [-0.1, 0, 0],
    lShoulder: [-0.8 * s - 0.2, 0, 0.15],
    lElbow: [-1.3, 0, 0],
    lHip: [0.9 * s - 0.2, 0, 0.05],
    lKnee: [Math.max(0, -s) * 1.2 + 0.15, 0, 0],
    rHip: [-0.9 * s - 0.2, 0, -0.05],
    rKnee: [Math.max(0, s) * 1.2 + 0.15, 0, 0],
    // The daisy hand held in front of her chest, pumping a little.
    rShoulder: [-0.5 + 0.12 * s, 0, -0.2],
    rElbow: [-1.45, 0, 0],
  };
};
// On a bar stool, leaning on the bar: forearms flat on it, hands near the
// edge (solved so the hand sits 60 cm in front of the hips at bar height).
const BAR = (t, phase = 0) => ({
  spine: [0.3 + Math.sin(t * 0.9 + phase) * 0.012, 0, 0],
  chest: [0.08, 0, 0],
  head: [-0.3, 0, 0],
  lHip: [-1.45, 0, 0.08],
  rHip: [-1.45, 0, -0.08],
  lKnee: [1.2, 0, 0],
  rKnee: [1.2, 0, 0],
  lShoulder: [-1.2, -0.2, 0],
  lElbow: [-0.6, 0, 0],
  rShoulder: [-1.2, 0.2, 0],
  rElbow: [-0.6, 0, 0],
});
const look = (pose, yaw, pitch = 0) => ({ ...pose, neck: [0, yaw * 0.4, 0], head: [pose.head[0] + pitch, yaw * 0.6, 0] });

const STOOL_Y = 0.76;
const HIS_STOOL = new THREE.Vector3(-1.0, 0, 0.35);
const HER_STOOL = new THREE.Vector3(0.1, 0, 0.35);

// Asleep on the bar: arms folded on it, head down on them.
const SLEEP = (t) => ({
  spine: [0.62 + Math.sin(t * 0.8) * 0.015, 0, 0],
  chest: [0.22, 0, 0],
  neck: [0.15, 0, 0],
  head: [0.32, -0.25, 0.1],
  lHip: [-1.45, 0, 0.08],
  rHip: [-1.45, 0, -0.08],
  lKnee: [1.2, 0, 0],
  rKnee: [1.2, 0, 0],
  lShoulder: [-1.15, -0.55, 0.15],
  lElbow: [-1.75, 0, 0],
  rShoulder: [-1.15, 0.55, -0.15],
  rElbow: [-1.75, 0, 0],
});
// On the platform, the daisy held up in front of her in her right hand.
const WAIT = (t) => ({
  spine: [0.02 + Math.sin(t * 1.1) * 0.01, 0, 0],
  head: [0.05, 0, 0],
  lShoulder: [0.08, 0, 0.1],
  lElbow: [-0.2, 0, 0],
  rShoulder: [-0.55, 0, 0.12],
  rElbow: [-1.7, 0, 0],
  lHip: [0, 0, 0.03],
  rHip: [0, 0, -0.03],
  lKnee: [0.04, 0, 0],
  rKnee: [0.04, 0, 0],
});
const WALK = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.04, 0, 0],
    lShoulder: [0.3 * s, 0, 0.08],
    rShoulder: [-0.3 * s, 0, -0.08],
    lElbow: [-0.3, 0, 0],
    rElbow: [-0.3, 0, 0],
    lHip: [-0.4 * s, 0, 0],
    rHip: [0.4 * s, 0, 0],
    lKnee: [Math.max(0, s) * 0.55 + 0.08, 0, 0],
    rKnee: [Math.max(0, -s) * 0.55 + 0.08, 0, 0],
  };
};
const STAND = { spine: [0.02, 0, 0], lShoulder: [0.05, 0, 0.08], rShoulder: [0.05, 0, -0.08], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };

/** The old man who runs the café: grey beard, white shirt, brown apron. */
const BOSS_LOOK = {
  skin: "#e3bf9e", top: "#f1efe9", bottom: "#4a3020", shoes: "#2a1d16", hair: "#bdb8b0", sleeves: "rolled",
  iris: "#3a2a20", pupil: "#0f0907", brows: "#a29c94",
};

/**
 * The station: a platform at dawn under a canopy, the tracks in a cut beside
 * it, and the far platform the camera stands on. Its own spot on the lot,
 * clear of the sets createSets lays out.
 */
const STATION = new THREE.Vector3(-70, 0, 0);
const TRACK_Z = 3.0;
const CAR = { len: 15, w: 2.8, gap: 0.6 };
const TRAIN_LEN = CAR.len * 3 + CAR.gap * 2;
const STOP_X = 23;

const buildStation = (w) => {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, line = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    g.add(m);
    return m;
  };
  const block = (sx, sy, sz, mat, x, y, z, line = false) => add(new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z, line);
  const concrete = w.ink({ tint: "#bdb7ae", tone: 0.85, rim: 0.4 });
  const steel = w.ink({ tint: "#3b3f46", tone: 0.55, rim: 0.9 });
  // Her platform (top at y 0), the yellow line along its edge.
  block(90, 1.2, 5.6, concrete, 0, -0.6, -1.3, true);
  block(90, 0.012, 0.3, w.ink({ tint: "#e8c23a", tone: 1.0, rim: 0.2 }), 0, 0.006, 1.0);
  // The cut: ballast, sleepers and two rails.
  block(90, 0.2, 3.0, w.ink({ tint: "#3a3532", tone: 0.55, rim: 0.3 }), 0, -1.3, TRACK_Z);
  const sleeper = w.ink({ tint: "#5a4a3c", tone: 0.6, rim: 0.3 });
  for (let x = -44; x <= 44; x += 0.9) block(0.2, 0.1, 2.3, sleeper, x, -1.15, TRACK_Z);
  for (const dz of [-0.53, 0.53]) block(90, 0.1, 0.07, steel, 0, -1.05, TRACK_Z + dz);
  // The far platform.
  block(90, 1.2, 5.6, concrete, 0, -0.6, 7.3, true);
  block(90, 0.012, 0.3, w.ink({ tint: "#e8c23a", tone: 1.0, rim: 0.2 }), 0, 0.006, 4.95);
  // Her canopy: posts down the middle of the platform, a long flat roof.
  for (let x = -20; x <= 20; x += 5) add(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 10), steel, x, 1.65, -1.6, true);
  block(44, 0.16, 4.2, w.ink({ tint: "#59606a", tone: 0.6, rim: 0.8 }), 0, 3.35, -1.2, true);
  // A wall at the back, a bench against it.
  block(90, 1.3, 0.2, w.ink({ tint: "#d8d0c2", tone: 0.9, rim: 0.3 }), 0, 0.65, -3.9);
  block(2.0, 0.08, 0.45, w.ink({ tint: "#8a5a34", tone: 0.8, rim: 0.5 }), 3.2, 0.45, -3.4, true);
  for (const dx of [-0.85, 0.85]) block(0.06, 0.45, 0.4, steel, 3.2 + dx, 0.22, -3.4);
  // A clock hung from the canopy: a quarter past six.
  const face = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = "#f7f2e6";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = W * 0.04;
    ctx.strokeStyle = "#1b1414";
    ctx.stroke();
    ctx.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.lineWidth = W * 0.02;
      ctx.beginPath();
      ctx.moveTo(W / 2 + Math.sin(a) * W * 0.36, H / 2 - Math.cos(a) * H * 0.36);
      ctx.lineTo(W / 2 + Math.sin(a) * W * 0.41, H / 2 - Math.cos(a) * H * 0.41);
      ctx.stroke();
    }
    const hand = (a, len, width) => {
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(W / 2 + Math.sin(a) * len, H / 2 - Math.cos(a) * len);
      ctx.stroke();
    };
    hand(((6 + 15 / 60) / 12) * Math.PI * 2, W * 0.22, W * 0.04);
    hand((15 / 60) * Math.PI * 2, W * 0.33, W * 0.025);
  });
  add(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ map: face, toneMapped: false }), -3.5, 2.75, -1.05);
  block(0.02, 0.45, 0.02, steel, -3.5, 3.12, -1.05);
  // Poles carrying the overhead wire, on the far side of the track.
  for (let x = -42; x <= 42; x += 12) {
    add(new THREE.CylinderGeometry(0.09, 0.11, 6, 10), steel, x, 2.0, 4.75, true);
    block(0.08, 0.08, 2.4, steel, x, 4.8, 3.7);
  }
  block(90, 0.025, 0.025, steel, 0, 4.55, TRACK_Z);
  return g;
};

/** Three commuter cars, silver with a red band, lit inside. Origin at the cab's nose. */
const buildTrain = (w) => {
  const g = new THREE.Group();
  const body = w.ink({ tint: "#d6dadd", tone: 1.0, rim: 0.7 });
  const band = w.ink({ tint: "#c8102e", tone: 0.85, rim: 0.6 });
  const under = w.ink({ tint: "#24262a", tone: 0.5, rim: 0.4 });
  const door = w.ink({ tint: "#b9bec3", tone: 0.9, rim: 0.5 });
  const lit = new THREE.MeshBasicMaterial({ color: "#ffe7bd", toneMapped: false });
  const glass = new THREE.MeshBasicMaterial({ color: "#20242c" });
  for (let i = 0; i < 3; i++) {
    const cx = -CAR.len / 2 - i * (CAR.len + CAR.gap);
    const car = new THREE.Mesh(new THREE.BoxGeometry(CAR.len, 2.75, CAR.w), body);
    car.position.set(cx, 1.4, 0);
    outline(car, w.line);
    g.add(car);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(CAR.len + 0.01, 0.16, CAR.w + 0.02), band);
    strip.position.set(cx, 0.7, 0);
    g.add(strip);
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(CAR.len - 1.5, 0.9, CAR.w - 0.5), under);
    chassis.position.set(cx, -0.4, 0);
    g.add(chassis);
    for (const side of [-1, 1]) {
      const z = side * (CAR.w / 2 + 0.012);
      // Four doors a side, windows between them.
      for (let d = 0; d < 4; d++) {
        const dx = cx - CAR.len / 2 + 1.6 + d * ((CAR.len - 3.2) / 3);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.0), door);
        p.position.set(dx, 1.05, z);
        p.rotation.y = side > 0 ? 0 : Math.PI;
        g.add(p);
        const dw = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.75), lit);
        for (const o of [-0.3, 0.3]) {
          const q = dw.clone();
          q.position.set(dx + o, 1.6, z + side * 0.002);
          q.rotation.y = p.rotation.y;
          g.add(q);
        }
        if (d < 3) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.85), lit);
          win.position.set(dx + (CAR.len - 3.2) / 6, 1.65, z);
          win.rotation.y = p.rotation.y;
          g.add(win);
        }
      }
    }
  }
  // The cab: a dark windscreen on the nose and two headlights.
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(CAR.w - 0.4, 0.9), glass);
  screen.position.set(0.012, 2.0, 0);
  screen.rotation.y = Math.PI / 2;
  g.add(screen);
  for (const z of [-0.85, 0.85]) {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: "#fff6dc", toneMapped: false }));
    lamp.position.set(0.014, 0.95, z);
    lamp.rotation.y = Math.PI / 2;
    g.add(lamp);
  }
  return g;
};

/** Where the train's nose is: in, stood at the platform, out. */
const trainX = (c) => {
  if (c < 8) return -200;
  if (c < 10.8) return STOP_X - 90 * (1 - segment(c, 8, 10.8)) ** 2;
  if (c < 12.4) return STOP_X;
  if (c < 16) return STOP_X + 150 * easeInCubic(segment(c, 12.4, 16));
  return 400;
};

/**
 * A manga speech bubble on the DOM overlay: a paper ellipse with an ink edge,
 * plain sentence-case lettering, and one tail per speaker pointing at their
 * mouth (two tails for a line they say together). Positions are in % of the
 * overlay; the scene projects the speakers' heads each frame.
 */
const createBubble = (overlay) => {
  if (!overlay) return { update() {}, dispose() {} };
  const NS = "http://www.w3.org/2000/svg";
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, {
    position: "absolute",
    left: "0",
    top: "0",
    maxWidth: "46%",
    padding: "0.95em 1.35em",
    background: "#fffdf7",
    color: INK,
    border: `0.14em solid ${INK}`,
    borderRadius: "50%",
    fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    fontWeight: "700",
    lineHeight: "1.2",
    textAlign: "center",
    letterSpacing: "0.01em",
    pointerEvents: "none",
    transformOrigin: "50% 50%",
    opacity: "0",
  });
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", overflow: "visible", pointerEvents: "none", opacity: "0" });
  const tails = [0, 1].map(() => {
    const fill = document.createElementNS(NS, "path");
    fill.setAttribute("fill", "#fffdf7");
    const edge = document.createElementNS(NS, "path");
    edge.setAttribute("fill", "none");
    edge.setAttribute("stroke", INK);
    edge.setAttribute("stroke-linejoin", "round");
    svg.append(fill, edge);
    return { fill, edge };
  });
  // The tails go over the box so they cut its border where they join it.
  overlay.append(box, svg);
  let last = null;
  return {
    /**
     * @param {object} s
     * @param {string} s.text
     * @param {[number, number]} s.at        bubble centre, % of the overlay
     * @param {[number, number][]} s.anchors  each speaker's mouth, % of the overlay
     * @param {number} s.size   font size, % of the overlay height
     * @param {number} s.show   0..1, fades and pops the bubble in
     */
    update({ text = "", at = [50, 20], anchors = [], size = 3, show = 0 }) {
      const W = overlay.clientWidth || 1;
      const H = overlay.clientHeight || 1;
      const on = text && show > 0.001;
      box.style.opacity = on ? String(Math.min(1, show * 1.6)) : "0";
      svg.style.opacity = box.style.opacity;
      if (!on) return;
      if (text !== last) {
        last = text;
        box.textContent = text;
      }
      const px = (size * H) / 100;
      box.style.fontSize = `${px}px`;
      const cx = (at[0] / 100) * W;
      const cy = (at[1] / 100) * H;
      const pop = lerp(0.82, 1, easeOutBack(Math.min(1, show)));
      box.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${pop})`;
      // Tails: from just inside the ellipse's edge toward the mouth, stopping short of it.
      const rx = ((box.offsetWidth || px * 8) / 2) * pop;
      const ry = ((box.offsetHeight || px * 3) / 2) * pop;
      tails.forEach((t, i) => {
        const a = anchors[i];
        if (!a) {
          t.fill.setAttribute("d", "");
          t.edge.setAttribute("d", "");
          return;
        }
        const ax = (a[0] / 100) * W;
        const ay = (a[1] / 100) * H;
        let dx = ax - cx;
        let dy = ay - cy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        // Where the ray meets the ellipse, pulled in so the tail overlaps the border.
        const k = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
        const bx = cx + dx * k * 0.86;
        const by = cy + dy * k * 0.86;
        const reach = Math.max(px * 1.2, Math.min(len - k, px * 5.5) * 0.75);
        const tx = cx + dx * (k + reach);
        const ty = cy + dy * (k + reach);
        const half = px * 0.55;
        const b1 = [bx - dy * half, by + dx * half];
        const b2 = [bx + dy * half, by - dx * half];
        // A slight curve: manga tails bend toward the speaker.
        const bend = px * 0.35;
        const m1 = [(b1[0] + tx) / 2 + dx * bend, (b1[1] + ty) / 2 + dy * bend];
        t.fill.setAttribute("d", `M${b1[0]} ${b1[1]} Q${m1[0]} ${m1[1]} ${tx} ${ty} L${b2[0]} ${b2[1]} Z`);
        t.edge.setAttribute("d", `M${b1[0]} ${b1[1]} Q${m1[0]} ${m1[1]} ${tx} ${ty} L${b2[0]} ${b2[1]}`);
        t.edge.setAttribute("stroke-width", String(px * 0.14));
      });
    },
    dispose() {
      box.remove();
      svg.remove();
    },
  };
};

/** The exchange, in order: [from, to, who, text]. who: "him" | "her" | "both" | "boss". */
const LINES = [
  [19.5, 23.0, "him", "Where are you?"],
  [24.1, 27.7, "her", "I'm here."],
  [28.5, 32.1, "him", "What are you doing?"],
  [32.9, 37.1, "her", "I've always been watching over you."],
  [40.1, 44.3, "both", "Let's fill this world with mistakes."],
  [45.9, 50.1, "him", "Stay by my side. Let's go have some fun."],
  [59.6, 62.9, "boss", "Denji, I have to close the shop."],
];

// The café at closing time: the same room, the light gone low and orange.
const EVENING = { ground: "#1d0f0b", lines: "#ffbf86", accent: "#ff7a45", rim: "#ffae6a", shade: "#9a7470" };

export const createJaneDoeScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe"]);
  const cast = createCast(w, { chainsaw: false });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  const cap = createCaption(overlay, { x: 4, y: 7 });
  const capR = createCaption(overlay, { x: 4, y: 80, align: "right" });
  const bubble = createBubble(overlay);

  // The station and its train, on their own spot.
  const station = buildStation(w);
  station.position.copy(STATION);
  w.scene.add(station);
  const train = buildTrain(w);
  train.position.set(STATION.x - 200, 0, TRACK_Z);
  w.scene.add(train);

  // The man who runs the café.
  let boss = null;
  const bossReady = createModelFigure({
    height: 1.7, hair: ["HairSimpleParted", "HairBeard", "EyebrowsRegular"], line: w.line, ink: { tone: 0.82, rim: 1.2 },
    outfit: BOSS_LOOK, dress: { collar: true, placket: true }, hands: "relaxed",
  }).then((fig) => {
    boss = fig;
    w.scene.add(fig.root);
    w.register(fig.root);
  });

  // The daisies on the bar, in a vase that fits them, where the set's own
  // vase stood (that one, and its two daisies, are retired).
  const cafe = lot.sets.cafe;
  cafe.group.children.forEach((o) => {
    if (o.position.y > 1.15 && Math.hypot(o.position.x - cafe.spots.vase.x, o.position.z - cafe.spots.vase.z) < 0.12) o.visible = false;
  });
  const vase = createDaisyVase({ count: 4, vaseHeight: 0.17, fan: 0.42, ink: w.ink, line: w.line, seed: 5 });
  vase.position.set(cafe.spots.vase.x, 1.11, cafe.spots.vase.z);
  vase.rotation.y = Math.PI;
  cafe.group.add(vase);
  // The daisy she carries, red, pinched by the stem.
  const daisy = createDaisy({ stemLength: 0.26, size: 0.075, palette: { petal: "#d3202f", centre: "#f2c23a" }, ink: w.ink, line: w.line, seed: 3 });
  let daisyHeld = false;

  const target = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const st = (x, y, z) => new THREE.Vector3(x, y, z).add(STATION);
  const cam = (pos, aim) => {
    camera.position.copy(pos);
    target.copy(aim);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
  };
  /** A world point on screen, in % of the frame. */
  const screen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (0.5 - tmp.y * 0.5) * 100];
  };
  const mouthOf = (fig) => fig.bones.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.05, 0));
  const away = (fig) => fig?.root.position.set(0, -50, 0);
  const onStool = (fig, spot, pose) => {
    fig.root.position.copy(cafe.origin).add(spot);
    fig.root.rotation.set(0, Math.PI, 0);
    fig.apply(pose);
    fig.seatOn(STOOL_Y);
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const { denji, reze } = cast;
    if (!denji || !boss) return;
    if (!daisyHeld) {
      daisyHeld = true;
      reze.hold(daisy, { hand: "right", grip: "pinch", offset: new THREE.Vector3(0, 0.06, 0), rotation: new THREE.Euler(0.8, 0, 0) });
    }
    const cut = { iris: 1, flash: 0, black: 0, bars: 0.35, flashColor: "#fff3e0" };
    let text = "";
    let textR = "";
    const atStation = c < 18.5;
    const street = (c >= 23.5 && c < 28) || (c >= 32.5 && c < 38.9);
    station.visible = atStation;
    train.visible = atStation;
    if (!(c >= 51.7 && c < 65)) away(boss);

    if (atStation) {
      // ── The station at dawn: she waits, the train comes and goes, she runs ──
      lot.show("station");
      w.light(-0.4, 0.7, 0.6);
      w.palette(LIGHT.dawn);
      w.page({ mode: "rain", intensity: c < 4.5 ? 0.6 * (1 - segment(c, 0.3, 4.3)) : 0.04, disc: [0.3, 0.84, 0.05 + segment(c, 0, 18) * 0.03], seed: Math.floor(time * 8) });
      away(denji);
      train.position.set(STATION.x + trainX(c), 0, TRACK_Z);

      // Her: waiting, looking down the line; then at the daisy; then she turns and runs.
      const turn = easeInOutCubic(segment(c, 15.9, 16.6));
      const run = segment(c, 16.4, 18.5);
      let pose = WAIT(time);
      if (c < 14.6) {
        // Down the line, toward where the train comes from (her right).
        const yaw = c < 12.4 ? -0.75 : -0.75 + 0.6 * easeInOutCubic(segment(c, 12.4, 14));
        pose = look(pose, yaw, -0.04);
      } else if (c < 16.4) {
        pose = look(pose, -0.05, 0.28 * (1 - turn));
      }
      if (run > 0) pose = blendPose(pose, RUN(time * 9), Math.min(1, run * 4));
      reze.root.position.copy(st(lerp(0, 9, run * run), 0, 0.2));
      reze.root.rotation.set(0, (Math.PI / 2) * turn, 0);
      reze.apply(pose);
      reze.groundTo(0);

      if (c < 4.5) {
        // Wide from the far platform: the empty station, one figure under the canopy.
        const k = easeInOutCubic(segment(c, 0, 4.5));
        cam(st(4.5 - k * 1.5, 2.6 - k * 0.4, 11.5 - k * 1.5), st(0, 1.1, -0.4));
        text = "The storm passed.";
        cut.black = 1 - segment(c, 0, 1.5);
      } else if (c < 8) {
        // Close on her and the daisy, from over the platform edge.
        const k = easeInOutCubic(segment(c, 4.5, 8));
        cam(st(-1.0 + k * 0.15, 1.32, 1.5 - k * 0.1), st(0.0, 1.2, 0.2));
      } else {
        // Across the tracks. The train stands between us and her.
        const k = easeInOutCubic(segment(c, 8, 18.5));
        const shake = c > 8.4 && c < 15.5 ? Math.sin(time * 41) * 0.006 : 0;
        cam(st(-0.6 + k * 1.4, 2.0 + shake, 10.2 - k * 0.6), st(0.2 + run * run * 3, 1.15, 0));
        cut.black = segment(c, 18.1, 18.5);
      }
    } else if (street) {
      // ── The street: her, running ──
      lot.show("street");
      w.light(-0.3, 0.7, 0.6);
      w.palette(LIGHT.dawn);
      w.page({ mode: "rain", intensity: 0.05, disc: [0.3, 0.84, 0.08], seed: Math.floor(time * 8) });
      away(denji);
      const first = c < 28;
      const x = first ? lerp(-9, -4.5, segment(c, 23.5, 28)) : lerp(-4, 3, segment(c, 32.5, 38.9));
      reze.root.position.copy(at("street", x, 0, 0.9));
      reze.root.rotation.set(0, Math.PI / 2, 0);
      reze.apply(RUN(time * 9));
      reze.groundTo(0);
      if (first) {
        // Low and ahead of her: she runs toward us.
        cam(reze.root.position.clone().add(new THREE.Vector3(2.6, 0.95, 1.4)), reze.root.position.clone().add(new THREE.Vector3(0.2, 1.25, 0)));
      } else {
        // Alongside her; the morning comes up white behind the frame.
        cam(reze.root.position.clone().add(new THREE.Vector3(0.9, 1.25, 2.7)), reze.root.position.clone().add(new THREE.Vector3(0.6, 1.2, 0)));
        cut.flash = segment(c, 37.5, 38.7) * 0.9;
      }
    } else {
      // ── Her café, from behind the bar ──
      lot.show("cafe");
      const dream = c < 51.7;
      w.light(0.85, 0.55, 0.1);
      w.palette(dream ? LIGHT.cafe : EVENING);
      w.page({ mode: "still" });
      const together = c >= 38.9 && c < 50.5;
      if (c < 38.9) {
        // Alone. "What are you doing?" — he looks up toward the door.
        const up = easeInOutCubic(segment(c, 28.3, 29.1)) * (1 - easeInOutCubic(segment(c, 31.9, 32.5)));
        onStool(denji, HIS_STOOL, look(BAR(time), -0.35 * up, -0.12 * up));
      } else if (together) {
        // Side by side. For the shared line they look at each other; then he turns to her.
        const face = easeInOutCubic(segment(c, 40.7, 41.7));
        const turn = easeInOutCubic(segment(c, 45.5, 46.4));
        onStool(denji, HIS_STOOL, look(BAR(time), -0.7 * face - 0.2 * turn, 0));
        onStool(reze, HER_STOOL, look(BAR(time, 1.7), 0.75 * face, -0.06 * face));
        denji.root.rotation.y = Math.PI - 0.35 * turn;
      } else if (c < 50.5) {
        onStool(denji, HIS_STOOL, look(BAR(time), 0, 0.08));
      } else {
        // Asleep on the bar; he lifts his head, looks at the empty stool, then
        // turns to the old man when he speaks.
        const wake = easeInOutCubic(segment(c, 53.4, 54.6));
        const toStool = easeInOutCubic(segment(c, 54.8, 55.6));
        const toBoss = easeInOutCubic(segment(c, 59.2, 60.0));
        const pose = blendPose(SLEEP(time), BAR(time), wake);
        onStool(denji, HIS_STOOL, look(pose, -0.7 * toStool * (1 - toBoss) - 0.5 * toBoss, 0.06 * toStool * (1 - toBoss)));
        denji.root.rotation.y = Math.PI - 1.1 * toBoss;
      }
      if (!together) away(reze);

      if (c < 23.5) {
        const k = easeInOutCubic(segment(c, 18.5, 23.5));
        cam(at("cafe", -0.15 - k * 0.1, 1.55, -1.5 + k * 0.15), at("cafe", -0.85, 1.3, 0.3));
        cut.flash = 0;
      } else if (c < 32.5) {
        // Close on him, across the bar.
        const k = easeInOutCubic(segment(c, 28, 32.5));
        cam(at("cafe", -1.45 + k * 0.05, 1.5, -1.2 + k * 0.12), at("cafe", -1.0, 1.36, 0.3));
      } else if (c < 56) {
        // Side by side, and then the same frame with the stool beside him empty.
        // The reveal holds where the two-shot ended, so the stool beside him reads empty.
        const k = easeInOutCubic(segment(c, 38.9, 50.5));
        if (c < 51.7) cam(at("cafe", -0.45, 1.62, -2.45 + k * 0.3), at("cafe", -0.45, 1.3, 0.3));
        else cam(at("cafe", -0.62, 1.58, -2.25), at("cafe", -0.62, 1.22, 0.3));
        if (c < 40) cut.flash = 1 - segment(c, 38.7, 39.7);
        else if (c > 50.3 && c < 51.7) cut.flash = segment(c, 50.3, 51.5) * 0.9;
        else if (c >= 51.7) cut.flash = 0.9 * (1 - segment(c, 51.7, 52.9));
      } else {
        // Wide from the door: the old man walks over to him.
        const k = easeInOutCubic(segment(c, 56, 63));
        cam(at("cafe", 3.3 - k * 0.4, 1.95 - k * 0.1, 3.6 - k * 0.3), at("cafe", -1.25, 1.0, 0.45));
        cut.black = segment(c, 62.9, 65);
      }

      if (c >= 51.7) {
        // The old man: in from the door at the right, stopping behind Denji's shoulder.
        const walk = segment(c, 56.4, 59.4);
        const from = new THREE.Vector3(2.6, 0, 2.3);
        const to = new THREE.Vector3(-1.6, 0, 1.0);
        const p = from.clone().lerp(to, walk);
        boss.root.position.copy(cafe.origin).add(p);
        const dir = to.clone().sub(from);
        const face = new THREE.Vector3(-1.0, 0, 0.35).sub(to);
        boss.root.rotation.set(0, lerp(Math.atan2(dir.x, dir.z), Math.atan2(face.x, face.z), segment(c, 59.0, 59.6)), 0);
        boss.apply(walk > 0 && walk < 1 ? WALK(time * 6.5) : STAND);
        boss.groundTo(0);
        if (c < 56.4) away(boss);
      }
    }

    // The exchange.
    const line = LINES.find(([a, b]) => c >= a && c < b);
    if (line) {
      const [a, b, who, words] = line;
      const show = segment(c, a, a + 0.3) * (1 - segment(c, b - 0.3, b));
      const speakers = who === "both" ? [denji, reze] : [{ him: denji, her: reze, boss }[who]];
      const anchors = speakers.map((f) => screen(mouthOf(f)));
      // Above the speaker (or between the two), kept inside the frame.
      const mx = anchors.reduce((s, p) => s + p[0], 0) / anchors.length;
      const my = Math.min(...anchors.map((p) => p[1]));
      const bx = Math.min(70, Math.max(30, mx + (who === "both" ? 0 : mx < 50 ? 12 : -12)));
      const by = Math.min(58, Math.max(20, my - 17));
      bubble.update({ text: words, at: [bx, by], anchors, size: 3.1, show });
    } else bubble.update({ show: 0 });

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
    ready: Promise.all([cast.ready, bossReady]),
    update,
    dispose() {
      unsubscribeResize();
      [cap, capR, cuts, bubble].forEach((x) => x.dispose());
    },
  };
};
