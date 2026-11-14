import * as THREE from "three";
import { easeInOutCubic, easeOutBack, easeOutCubic, lerp, segment } from "../kit";
import { blendPose } from "../figure";
import { createCaption, createSfx } from "../sfx";
import { outline } from "../ink";
import { createDaisy, createDaisyVase } from "../props";
import { LIGHT, createCast, createCuts, createFx, createInkWorld, createSets, shotAt } from "../rezeKit";

/**
 * first glance — they run into each other, and can't wait to again.
 *
 *  -5.4– 0    the storm: he runs in out of the rain to the phone booth on
 *             the corner; a moment later she runs in after him, to shelter
 *             there too. (The loop starts here: the times below are after it.)
 *   0  – 4.6  the booth, in the storm, both of them soaked: she takes one look
 *             at him and laughs
 *   4.6– 9.4  close on her: his face looks just like her dog's. Her dog died.
 *             The laugh goes, a hand up to her eye
 *   9.4– 14   he wants to cheer her up: he heaves, and a daisy comes up out of
 *             his mouth — the one he swallowed earlier; he pulls it out
 *   14 – 21.6 he holds it out; she takes it, holds it low, and laughs again
 *   21.6– 24.8 she points up the street: she works at a café, Crossroads.
 *             Come by
 *   24.8– 27.2 her eyes, close: green, fixed on him, like a girl with a crush
 *             (the last flicker says it is not quite that)
 *   27.2– 29.2 iris out on her
 *   29.2– 33  out of the booth, he beats her to Crossroads, its name over the
 *             window. Side by side in a booth, she pushes a coffee over to
 *             him, to pay him back
 *   33 – 36   he sips. Coffee's gross
 *   36 – 39   she laughs, a hand on his shoulder
 *   39 – 46   his daisy in the vase with two of hers: she glances at him, he
 *             glances back, she looks away, then they both look. He couldn't
 *             wait to come back; fade
 *
 * She wears jeans under her black top all the way through: this is before
 * she is anyone else. Loops under the song. Captions are original lines.
 */

// The run in out of the rain, before the opening: the film's own clock (`c`)
// starts at 0 after it, so every beat below keeps its time.
const INTRO = 5.4;
const CYCLE = 46 + INTRO;
const STATIC_TIME = 18;

const STAND = { spine: [0.04, 0, 0], head: [0.06, 0, 0], lShoulder: [0, 0, 0.1], rShoulder: [0, 0, -0.1], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] };
const WIPE_HAIR = { ...STAND, head: [0.15, 0, 0], lShoulder: [-2.3, 0, 0.5], lElbow: [-1.6, 0, 0], rShoulder: [-0.2, 0, -0.2] };
// Him, puzzled: head on one side, a finger at his own chest. "Me?"
const ME = { ...STAND, head: [0.1, 0.15, 0.22], rShoulder: [-0.45, 0.5, -0.25], rElbow: [-1.95, -0.6, 0] };
// Her, doubled up laughing: a hand over her mouth, the other on her stomach.
const HA = (t) => ({
  ...STAND,
  spine: [0.3 + Math.sin(t * 9) * 0.05, 0, 0],
  head: [0.1 + Math.sin(t * 11) * 0.06, 0.15, 0.1],
  rShoulder: [-1.0, 1.0, -0.6],
  rElbow: [-1.8, -1.2, 0],
  lShoulder: [-0.45, 0, 0.3],
  lElbow: [-1.5, 0, 0],
});
// Her dog: the laugh gone, head down, the back of a hand to her eye.
const TEAR = { ...STAND, spine: [0.12, 0, 0], head: [0.38, 0.1, 0.12], rShoulder: [-1.15, 0.9, -0.5], rElbow: [-2.0, -1.2, 0] };
// A fist up to his mouth (the same arm angles as a cup to the lips).
const COUGH = { spine: [0.35, 0, 0], head: [0.3, 0, 0], rShoulder: [-1.0, 1.0, -0.6], rElbow: [-1.8, -1.2, 0], lShoulder: [-0.4, 0, 0.3], lElbow: [-1.2, 0, 0] };
// Held out to her, across in front of him (she is on his left).
const OFFER = { spine: [0.05, 0, 0], head: [0.1, 0.25, 0], rShoulder: [-1.2, -0.35, -0.1], rElbow: [-0.4, 0, 0], lShoulder: [0, 0, 0.12] };
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
// The daisy still low in her left hand; her right points out of the booth
// and up the street, toward the café.
// Her body turns that way; her head stays back on him.
const POINT = { ...TAKE, head: [0.02, -0.6, 0.06], lShoulder: [-0.55, -0.2, 0.15], lElbow: [-1.45, 0, 0], rShoulder: [-1.45, 0, -0.3], rElbow: [-0.1, 0, 0] };
// Seated, her right hand pushing a cup across the table to him.
const PUSH = { spine: [0.18, 0, 0], rShoulder: [-0.75, -0.3, 0.35], rElbow: [-0.45, 0, 0] };
// Laughing, her right hand on his shoulder (he sits on her right; she
// turns to him as well, which brings the hand back onto it).
const SHOULDER = { rShoulder: [-0.1, 0, -1.7], rElbow: [-0.95, 0, 0] };
// Seated in the booth: knees under the table, the cup hand held over the
// saucer, the other hand resting by it. Arm angles were solved so the grip
// sits 34 cm in front of the hips at table height, cup upright.
const BOOTH_SIT = {
  spine: [0.06, 0, 0],
  head: [-0.04, 0, 0],
  lHip: [-1.5, 0, 0.06],
  rHip: [-1.5, 0, -0.06],
  lKnee: [1.5, 0, 0],
  rKnee: [1.5, 0, 0],
  lShoulder: [-0.4, 0, 0],
  lElbow: [-1.2, 0, 0],
  rShoulder: [-0.4, 0, 0],
  rElbow: [-1.2, 0, 0],
};
// Her, with nothing in her hands: forearms down on the table, hands loose.
const HER_REST = { lShoulder: [-0.3, 0, 0.1], lElbow: [-1.05, 0, 0], rShoulder: [-0.3, 0, -0.1], rElbow: [-1.05, 0, 0] };
// The cup up to the lips (his right hand), head tipped back a touch.
const SIP_HIM = { rShoulder: [-1.0, 1.0, -0.6], rElbow: [-1.8, -1.2, 0], head: [-0.16, 0, 0] };
// Coffee's gross: the cup back down, head pulled back and turned away from it.
const GROSS = (t) => ({ spine: [-0.08, 0, 0], head: [-0.2, 0.3 + Math.sin(t * 16) * 0.12, 0.15] });
const withPart = (base, part, k) => blendPose(base, { ...base, ...part }, k);
// Running for cover, arms pumping, leaning into it. `p` is the stride phase.
const RUN = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.22, 0, 0],
    head: [-0.12, 0, 0],
    lShoulder: [-0.75 * s - 0.15, 0, 0.12],
    lElbow: [-1.35, 0, 0],
    rShoulder: [0.75 * s - 0.15, 0, -0.12],
    rElbow: [-1.35, 0, 0],
    lHip: [0.85 * s - 0.25, 0, 0.04],
    lKnee: [Math.max(0, -s) * 1.25 + 0.2, 0, 0],
    rHip: [-0.85 * s - 0.25, 0, -0.04],
    rKnee: [Math.max(0, s) * 1.25 + 0.2, 0, 0],
  };
};
// Ground covered per stride cycle (two steps), so the feet keep pace with the ground.
const STRIDE = 2.1;
// Their runs in, along the street and in through the booth's open front
// (+z, between the posts at x = ±0.7), in street coordinates. Each ends on
// the spot and facing the opening has them at.
const RUNS = {
  denji: { from: -INTRO + 0.3, to: -INTRO + 2.5, yaw: 0.35, path: [[-5.2, 1.9], [-2.4, 1.75], [-0.7, 1.35], [-0.36, 0.62], [-0.32, 0.12]] },
  reze: { from: -INTRO + 2.7, to: -INTRO + 4.5, yaw: -0.5, path: [[4.6, 2.4], [2.0, 1.9], [0.62, 1.2], [0.34, 0.5], [0.3, -0.05]] },
};
for (const r of Object.values(RUNS)) {
  r.curve = new THREE.CatmullRomCurve3(r.path.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  r.length = r.curve.getLength();
}

const SHOTS = [
  { t: -INTRO, id: "arrive" },
  { t: 0, id: "laughs" },
  { t: 4.6, id: "dog" },
  { t: 9.4, id: "cough" },
  { t: 14, id: "take" },
  { t: 21.6, id: "invite" },
  { t: 27.2, id: "iris" },
  { t: 29.2, id: "cafe" },
  { t: 33, id: "sip" },
  { t: 36, id: "laugh" },
  { t: 39, id: "booth" },
];
const CAFE = 29.2;

// Jeans: her figure's legs, waist to ankle, repainted denim (the base paint
// gives her a skirt and stockings). Same regions as modelFigure's painter:
// a darker waistband, a lighter rolled hem, and the normals eased toward a
// plain cylinder round each leg so it shades as cloth, not as a bare leg.
const WAIST = 0.575;
const DENIM = new THREE.Color("#5677ab");
const BAND = new THREE.Color("#3a5683");
const HEM = new THREE.Color("#7593bf");
const wearJeans = (fig) => {
  let body = null;
  fig.model.traverse((m) => m.isSkinnedMesh && m.geometry.attributes.color && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  if (!body) return;
  const geo = body.geometry;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const nor = geo.attributes.normal;
  const n = new THREE.Vector3();
  const r = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    if (ny <= 0.06 || ny > WAIST) continue;
    const x = pos.getX(i) - cx;
    const z = pos.getZ(i) - cz;
    const c = ny > WAIST - 0.018 ? BAND : ny < 0.078 ? HEM : DENIM;
    col.setXYZ(i, c.r, c.g, c.b);
    if (nor && ny < WAIST - 0.06) {
      n.fromBufferAttribute(nor, i).lerp(r.set(x - Math.sign(x) * 0.09 * H, 0, z).normalize(), 0.7).normalize();
      nor.setXYZ(i, n.x, n.y, n.z);
    }
  }
  col.needsUpdate = true;
  if (nor) nor.needsUpdate = true;
};

/** A café coffee cup, origin at the middle of the bowl (where a hand grips it), rim up +y. */
const coffeeCup = (w) => {
  const g = new THREE.Group();
  const china = w.ink({ tint: "#f4efe6", tone: 1.0, rim: 0.5 });
  china.side = THREE.DoubleSide;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.031, 0.085, 22, 1, true), china);
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.031, 22), china);
  base.rotation.x = Math.PI / 2;
  base.position.y = -0.0425;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.037, 22), w.ink({ tint: "#3a2216", tone: 0.6, rim: 0.2 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.03;
  g.add(bowl, base, coffee);
  outline(bowl, w.line);
  return g;
};

/**
 * The booth by the café window: a bench with a high upholstered back and end
 * panels, a pedestal table in front of it. Built into the café set (local
 * coordinates), facing +z. Bench top at BENCH_Y, table top at TABLE_Y.
 */
const BOOTH_X = 2.5;
const BENCH_Y = 0.46;
const TABLE_Y = 0.74;
const TABLE_Z = -1.38;
const SAUCER_X = BOOTH_X - 0.42;
const SAUCER_Z = -1.56;
const buildBooth = (w, parent) => {
  const g = new THREE.Group();
  const wood = w.ink({ tint: "#5a3420", tone: 0.7, rim: 0.7 });
  const cushion = w.ink({ tint: "#8e1d2b", tone: 0.65, rim: 0.8 });
  const top = w.ink({ tint: "#efe6d6", tone: 1.0, rim: 0.4 });
  const block = (sx, sy, sz, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    outline(m, w.line);
    g.add(m);
    return m;
  };
  block(1.6, BENCH_Y - 0.08, 0.5, wood, BOOTH_X, (BENCH_Y - 0.08) / 2, -1.97);
  block(1.56, 0.08, 0.52, cushion, BOOTH_X, BENCH_Y - 0.04, -1.96);
  block(1.56, 0.66, 0.12, cushion, BOOTH_X, BENCH_Y + 0.35, -2.24);
  block(1.7, 1.22, 0.06, wood, BOOTH_X, 0.61, -2.33);
  for (const side of [-1, 1]) block(0.06, 1.22, 0.66, wood, BOOTH_X + side * 0.83, 0.61, -2.0);
  block(1.3, 0.04, 0.62, top, BOOTH_X, TABLE_Y - 0.02, TABLE_Z);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, TABLE_Y - 0.04, 12), wood);
  post.position.set(BOOTH_X, (TABLE_Y - 0.04) / 2, TABLE_Z);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.03, 24), wood);
  foot.position.set(BOOTH_X, 0.015, TABLE_Z);
  [post, foot].forEach((m) => (outline(m, w.line), g.add(m)));
  // His saucer, under where his cup hand rests.
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.058, 0.012, 24), w.ink({ tint: "#f4efe6", tone: 1.0, rim: 0.5 }));
  saucer.position.set(SAUCER_X, TABLE_Y + 0.006, SAUCER_Z);
  outline(saucer, w.line);
  g.add(saucer);
  parent.add(g);
  return g;
};

export const createFirstGlanceScene = (stage, { overlay } = {}) => {
  const { camera, staticMode } = stage;
  const w = createInkWorld(stage);
  const lot = createSets(w, ["street", "cafe"]);
  const cast = createCast(w, { chainsaw: false, rezeLook: "casual" });
  // The props, built to fit: the daisy he coughs up (held in a pinch), the
  // vase it ends up in on the booth table, and the coffee she brings him.
  const daisy = createDaisy({ stemLength: 0.26, size: 0.075, ink: w.ink, line: w.line, seed: 3 });
  const cafe = lot.sets.cafe;
  buildBooth(w, cafe.group);
  // The set's sunbeams and window glow wash out the close-ups here: turn the
  // beams well down and the glass from white to a warm daylight.
  cafe.group.traverse((o) => {
    const u = o.material?.uniforms?.uIntensity;
    if (u) u.value *= 0.3;
    else if (o.material?.isMeshBasicMaterial && !o.material.map && o.material.color.getHex() === 0xfff3d6) o.material.color.set("#c9a77c");
  });
  const vase = createDaisyVase({ count: 3, vaseHeight: 0.17, fan: 0.45, ink: w.ink, line: w.line, seed: 2 });
  vase.position.set(BOOTH_X + 0.02, TABLE_Y, TABLE_Z + 0.1);
  vase.rotation.y = Math.PI * 0.8;
  cafe.group.add(vase);
  // The set's own counter vase and its two daisies are retired: the daisies
  // live in the booth's vase now.
  cafe.group.children.forEach((o) => {
    if (o.position.y > 1.15 && Math.hypot(o.position.x - cafe.spots.vase.x, o.position.z - cafe.spots.vase.z) < 0.12) o.visible = false;
  });
  const cupHim = coffeeCup(w);
  // Who holds what this frame; changes go through hold/release once.
  const held = { daisy: null, cupHim: null };
  const give = (key, obj, fig, hand, opts) => {
    const want = fig ? `${hand}:${fig.root.id}` : null;
    if (held[key]?.id === want) return;
    if (held[key]) held[key].fig.release(held[key].hand);
    held[key] = fig ? { id: want, fig, hand } : null;
    if (fig) fig.hold(obj, { hand, ...opts });
  };
  const ready = cast.ready.then((c) => {
    wearJeans(c.reze);
    return c;
  });
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
  // Her dog, as she remembers him: a round inset over her close-up. Scruffy,
  // blond, a lot like Denji. The halo comes in on "he died".
  const dog = cuts.el({ right: "7%", top: "10%", width: "21%", aspectRatio: "1", display: "none", borderRadius: "50%", overflow: "hidden", background: "#f3e7e2", border: "0.5vmin solid #0d0c0c", boxShadow: "0.6vmin 0.6vmin 0 #0d0c0c" });
  dog.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%;height:100%">
    <ellipse class="fg-halo" cx="50" cy="15" rx="19" ry="5" fill="none" stroke="#e8b923" stroke-width="3.2"/>
    <path d="M31 36 Q12 38 16 66 Q27 64 35 46 Z M69 36 Q88 38 84 66 Q73 64 65 46 Z" fill="#a8702f" stroke="#141014" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="50" cy="54" rx="24" ry="22" fill="#e2b56a" stroke="#141014" stroke-width="2"/>
    <path d="M27 46 Q26 30 35 38 Q36 25 44 35 Q48 22 53 34 Q60 23 63 37 Q72 29 73 46 Q62 40 50 41 Q38 40 27 46 Z" fill="#e2b56a" stroke="#141014" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="41" cy="50" r="3.2" fill="#141014"/><circle cx="59" cy="50" r="3.2" fill="#141014"/>
    <circle cx="42" cy="49" r="1" fill="#fff"/><circle cx="60" cy="49" r="1" fill="#fff"/>
    <ellipse cx="50" cy="65" rx="12" ry="9" fill="#f4dcae" stroke="#141014" stroke-width="1.4"/>
    <path d="M47 69 q3 9 6 0 Z" fill="#e36a7a" stroke="#141014" stroke-width="1.2"/>
    <ellipse cx="50" cy="59.5" rx="4.6" ry="3.2" fill="#141014"/>
    <path d="M50 62.5 v4 M43 67 Q50 71 57 67" fill="none" stroke="#141014" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
  const halo = dog.querySelector(".fg-halo");
  // Free hands, eased from the resting curl toward a pose. Set only on a
  // change; `hold`/`release` own a hand while it has something in it, so a
  // hand's key is dropped then and set fresh after.
  const handKeys = new Map();
  const handTo = (fig, hand, pose, k) => {
    const id = `${fig.root.id}:${hand}`;
    const key = pose && `${pose}:${k.toFixed(2)}`;
    if (handKeys.get(id) === key) return;
    handKeys.set(id, key);
    if (pose) fig.setHand(hand, pose, k);
  };
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const at = (set, x, y, z) => lot.at(set, x, y, z);
  const cam = (pos, target) => {
    camera.position.copy(pos);
    look.copy(target);
    camera.lookAt(look);
  };
  // A run in along `r` (see RUNS), easing to a stop on its spot in `settled`.
  // Out of sight till it starts.
  const along = new THREE.Vector3();
  const runIn = (fig, r, c, settled) => {
    fig.root.visible = c >= r.from;
    const k = segment(c, r.from, r.to);
    // Full pace, then easing off over the last third into the booth.
    const slow = Math.max(0, k - 0.65);
    const u = (Math.min(k, 0.65) + slow - (slow * slow) / 0.7) / 0.825;
    const p = r.curve.getPointAt(Math.min(1, u));
    fig.root.position.copy(at("street", p.x, 0, p.z));
    r.curve.getTangentAt(Math.min(1, u), along);
    const heading = Math.atan2(along.x, along.z);
    const turn = easeInOutCubic(segment(k, 0.72, 1));
    fig.root.rotation.set(0, lerp(heading, r.yaw + Math.round((heading - r.yaw) / (Math.PI * 2)) * Math.PI * 2, turn), 0);
    const running = 1 - easeInOutCubic(segment(k, 0.78, 1));
    fig.apply(running > 0 ? blendPose(settled, RUN((u * r.length * Math.PI * 2) / STRIDE), running) : settled);
    fig.groundTo(0);
    handTo(fig, "left", "fist", 0.6 * running);
    handTo(fig, "right", "fist", 0.6 * running);
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : (time % CYCLE) - INTRO;
    const { denji, reze } = cast;
    if (!denji) return;
    const { shot, s, u } = shotAt(SHOTS, c);
    let cuts_ = { iris: 1, flash: 0, black: 0, bars: 0.35 };
    let text = "";
    let textR = "";

    if (c < CAFE) {
      // ── The booth, in the storm ──
      lot.show("street");
      w.light(-0.55, 0.75, 0.45);
      w.palette(LIGHT.storm);
      w.page({ mode: "rain", intensity: 0.75, disc: [0.8, 0.82, 0], seed: Math.floor(time * 10) });
      // Where they end up, in out of the rain, at the booth's open front (+z).
      const himBooth = at("street", -0.32, 0, 0.12);
      const herBooth = at("street", 0.3, 0, -0.05);

      if (c < 0) {
        // In out of the rain: him first, then her. He pushes his wet hair
        // back; she gets one look at him and starts to laugh.
        runIn(denji, RUNS.denji, c, blendPose(STAND, WIPE_HAIR, easeInOutCubic(segment(c, -1.2, -0.2))));
        runIn(reze, RUNS.reze, c, blendPose(STAND, HA(time), easeInOutCubic(segment(c, -0.6, 0))));
      } else {
        denji.root.visible = true;
        reze.root.visible = true;
        // Denji: wet hair, then "my face?", then the daisy.
        denji.root.position.copy(himBooth);
        // Turned a little to her; he turns all the way to offer the daisy, and stays turned.
        denji.root.rotation.y = 0.35 + 0.55 * easeInOutCubic(segment(c, 13.2, 14.2));
        {
          let pose = blendPose(WIPE_HAIR, STAND, easeInOutCubic(segment(c, 1.0, 1.8)));
          const me = easeInOutCubic(segment(c, 2.2, 2.9)) * (1 - easeInOutCubic(segment(c, 5.0, 5.8)));
          pose = blendPose(pose, ME, me);
          if (c > 11.0) pose = blendPose(pose, COUGH, easeOutCubic(segment(c, 11.0, 11.5)));
          if (c > 13.2) pose = blendPose(pose, OFFER, easeInOutCubic(segment(c, 13.2, 14.2)));
          if (c > 16.6) pose = blendPose(pose, STAND, easeInOutCubic(segment(c, 16.6, 17.8)));
          // The heave: doubled over, retching, till it's out.
          if (c > 11.2 && c < 12.6) pose.spine = [0.5 + Math.sin(time * 30) * 0.1, 0, 0];
          denji.apply(pose);
          denji.groundTo(0);
          if (c < 12.7) handTo(denji, "right", "point", me);
          else handTo(denji, "right", null);
        }

        // Reze
        {
          reze.root.position.copy(herBooth);
          reze.root.rotation.y = lerp(-0.5, -0.75, easeInOutCubic(segment(c, 13, 14)));
          // The laugh, then the dog, then up again to watch him heave.
          let pose = blendPose(HA(time), { ...STAND, head: [-0.02, 0.1, 0.1] }, easeInOutCubic(segment(c, 5.0, 5.8)));
          pose = blendPose(pose, TEAR, easeInOutCubic(segment(c, 7.0, 7.7)) * (1 - easeInOutCubic(segment(c, 10.4, 11.2))));
          if (c > 14.6) pose = blendPose(pose, TAKE, easeInOutCubic(segment(c, 14.6, 15.6)));
          if (c > 16.4) pose = blendPose(pose, LAUGH(time), easeInOutCubic(segment(c, 16.4, 17.2)));
          // Then the invite: up the street, her café. She looks back to him on "come by".
          if (c > 21.6) pose = blendPose(pose, POINT, easeInOutCubic(segment(c, 21.6, 22.4)));
          if (c > 23.6) pose.head = blendPose({ head: pose.head }, { head: [0.08, -0.75, 0.12] }, easeInOutCubic(segment(c, 23.6, 24.1))).head;
          if (c > 21.6) reze.root.rotation.y += 1.1 * easeInOutCubic(segment(c, 21.6, 22.4));
          reze.apply(pose);
          reze.groundTo(0);
          // Her hands: loose over her mouth and at her eye, a finger out up the street.
          handTo(reze, "left", c < 15.6 && "open", 0.5);
          if (c > 21.6) handTo(reze, "right", "point", easeInOutCubic(segment(c, 21.6, 22.4)));
          else handTo(reze, "right", "open", 0.5 * (1 - easeInOutCubic(segment(c, 15.6, 16.4))));
        }
      }

      // The daisy: out of his mouth, then pinched in his hand, then hers.
      give("cupHim", cupHim, null);
      cupHim.removeFromParent();
      if (c < 12.7) {
        give("daisy", daisy, null);
        // Up out of his mouth, head first, the stem still in his teeth.
        if (!daisy.parent) w.scene.add(daisy);
        daisy.visible = c > 11.9;
        const yaw = denji.root.rotation.y;
        const fwd = tmp.set(Math.sin(yaw), 0, Math.cos(yaw));
        const mouthAt = denji.bones.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.01, 0)).addScaledVector(fwd, 0.14);
        const emerge = easeOutCubic(segment(c, 11.9, 12.5));
        // Stem base back inside his mouth; only the head and a little stem show.
        const dir = fwd.clone().add(new THREE.Vector3(0, -0.1, 0)).normalize();
        daisy.position.copy(mouthAt).addScaledVector(dir, -0.27 + emerge * 0.1);
        daisy.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, dir);
      } else {
        daisy.visible = true;
        // Held by the stem, head up past the thumb.
        if (c < 15.6) give("daisy", daisy, denji, "right", { grip: "pinch", offset: new THREE.Vector3(0, 0.06, 0) });
        else give("daisy", daisy, reze, "left", { grip: "pinch", offset: new THREE.Vector3(0, 0.06, 0) });
      }

      // Cameras
      if (shot.id === "arrive") {
        // Out on the street, wide on the lit booth: he runs in from the left,
        // she from the right; then in, to where the opening picks them up.
        const k = easeInOutCubic(segment(c, -INTRO, -1.4));
        const into = easeInOutCubic(segment(c, -1.4, 0));
        cam(
          at("street", -0.5, 1.75, 5.4).lerp(at("street", 0.3, 1.7, 5.0), k).lerp(at("street", 0.9, 1.45, 2.7), into),
          at("street", -0.5, 1.1, 0.6).lerp(at("street", 0.15, 1.1, 0.4), k).lerp(at("street", 0.0, 1.25, 0), into),
        );
        cuts_.black = 1 - segment(c, -INTRO, -INTRO + 0.8);
        if (c > -INTRO + 0.6 && c < -INTRO + 2.8) text = "Caught in the storm, he ran for the phone booth.";
        if (c > -INTRO + 3.0 && c < -0.3) textR = "So did she.";
      } else if (shot.id === "laughs") {
        // From the open front: the two of them, dripping, and her in stitches.
        const k = easeInOutCubic(u);
        cam(at("street", 0.9, 1.45, 2.7).lerp(at("street", 0.6, 1.45, 2.25), k), at("street", 0.0, 1.25, 0));
        if (c > 0.4) text = "She took one look at him and laughed.";
      } else if (shot.id === "dog") {
        // Close on her, from in front and a touch to his side.
        reze.bones.head.getWorldPosition(tmp);
        const yaw = reze.root.rotation.y;
        cam(tmp.clone().add(new THREE.Vector3(Math.sin(yaw) * 1.1 + 0.15, 0.02, Math.cos(yaw) * 1.1)), tmp.clone().add(new THREE.Vector3(0.12, -0.08, 0)));
        if (c > 5.0) textR = c < 7.2 ? "“Your face looks just like my dog's.”" : "“He died.”";
      } else if (shot.id === "cough") {
        denji.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(0.9, -0.15, 1.5)), tmp.clone().add(new THREE.Vector3(0.15, -0.25, 0)));
        if (c < 11.2) text = "He wanted to cheer her up.";
        else if (c > 12.5) text = "So he threw up a daisy.";
      } else if (shot.id === "take") {
        const k = easeInOutCubic(u);
        cam(at("street", 0.9, 1.45, 2.3).lerp(at("street", 0.55, 1.5, 1.7), k), at("street", 0.05, 1.3, 0));
        textR = c < 16.4 ? "One he'd swallowed earlier." : "She kept it anyway.";
      } else if (shot.id === "invite") {
        // Out front and to his side, so her arm runs across the frame.
        const k = easeInOutCubic(u);
        cam(at("street", -1.8, 1.45, 2.6).lerp(at("street", -1.5, 1.45, 2.3), k), at("street", 0.35, 1.3, -0.05));
        text = "She works at a café near here. Crossroads.";
        if (c > 23.4) textR = "“Come by.”";
      } else {
        reze.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(-0.5, 0, 1.2)), tmp);
        cuts_.iris = 1 - easeInOutCubic(segment(c, 27.2, 28.8));
        cuts_.at = [50, 42];
      }

      // Her dog, over her close-up; the halo on "he died".
      const dogOn = c > 5.4 && c < 9.2;
      dog.style.display = dogOn ? "block" : "none";
      if (dogOn) {
        const pop = easeOutBack(segment(c, 5.4, 5.75)) * (1 - easeInOutCubic(segment(c, 8.9, 9.2)));
        dog.style.transform = `rotate(-5deg) scale(${Math.max(0.001, pop)})`;
        halo.style.opacity = String(easeOutCubic(segment(c, 7.2, 7.6)));
      }

      // She laughs twice: at his face, and at the daisy.
      const ha = c < 10 ? segment(c, 0.3, 0.6) : segment(c, 16.6, 16.9);
      const haOn = (c > 0.3 && c < 4.4) || (c > 16.6 && c < 18.6);
      haha.update({ x: 72, y: 24, size: 6.5, rotate: 8, opacity: haOn ? Math.min(1, ha * 4) : 0, scale: lerp(1.6, 1, easeOutBack(ha)) * (1 + Math.sin(time * 18) * 0.03), boil: Math.floor(time * 10), jitter: 0.05 });
      const slam = segment(c, 11.4, 11.7);
      hurk.update({ x: 64, y: 30, size: 8, rotate: -8, opacity: c > 11.4 && c < 12.8 ? Math.min(1, slam * 4) : 0, scale: lerp(1.8, 1, easeOutBack(slam)), boil: Math.floor(time * 12), jitter: 0.06 });
    } else {
      // ── Crossroads: he got there first. She serves him, then sits with him ──
      hurk.update({ opacity: 0 });
      dog.style.display = "none";
      lot.show("cafe");
      // Daylight through the window behind the booth.
      w.light(0.55, 0.6, 0.6);
      w.palette(LIGHT.cafe);
      w.page({ mode: "still" });
      // His daisy is in the vase on the table now.
      give("daisy", daisy, null);
      daisy.visible = false;

      // His one sip: lift, hold at the lips, set it down. Then the face.
      const sip = easeInOutCubic(segment(c, 33.3, 34.0)) * (1 - easeInOutCubic(segment(c, 34.6, 35.1)));
      const gross = easeOutCubic(segment(c, 34.7, 35.1)) * (1 - easeInOutCubic(segment(c, 37.6, 38.6)));
      // The glance: she looks at him, he looks back as she looks away, then both.
      const herLook = easeInOutCubic(segment(c, 39.6, 40.3)) * (1 - easeInOutCubic(segment(c, 41.1, 41.6))) + easeInOutCubic(segment(c, 42.4, 43.1));
      const hisLook = easeInOutCubic(segment(c, 40.8, 41.5));
      // His eyes on her as she pushes the cup over.
      const watch = easeInOutCubic(segment(c, 31.2, 31.8)) * (1 - easeInOutCubic(segment(c, 32.8, 33.3)));
      const breathe = Math.sin(time * 1.4) * 0.015;

      const him = withPart(BOOTH_SIT, SIP_HIM, sip);
      him.neck = [0, 0.35 * (hisLook + watch), 0];
      him.head = [him.head[0] + 0.04 * hisLook, 0.5 * (hisLook + watch), 0];
      him.spine = [0.06 + breathe, 0, 0];
      if (gross > 0) {
        const g = GROSS(time);
        him.spine = blendPose({ spine: him.spine }, g, gross).spine;
        him.head = blendPose({ head: him.head }, g, gross).head;
      }
      denji.root.position.copy(at("cafe", BOOTH_X - 0.3, 0, -1.93));
      denji.root.rotation.set(0, 0, 0);
      denji.apply(him);
      denji.seatOn(BENCH_Y);

      // Beside him in the booth. She pushes a coffee across to him, to pay
      // him back; laughing at his face, a hand on his shoulder.
      const push = easeInOutCubic(segment(c, 31.4, 32.0)) * (1 - easeInOutCubic(segment(c, 32.5, 33.0)));
      const laugh = easeInOutCubic(segment(c, 35.3, 35.9)) * (1 - easeInOutCubic(segment(c, 38.4, 39.0)));
      // Her arms otherwise down on the table: she holds nothing in here.
      let her = { ...BOOTH_SIT, ...HER_REST };
      her.neck = [0, -0.35 * herLook, 0];
      her.head = [her.head[0] - 0.08 * herLook, -0.5 * herLook - 0.3 * push, -0.08 * herLook];
      her.spine = [0.06 - breathe, 0, 0];
      her = blendPose(her, { ...her, ...PUSH }, push);
      // The laugh without the daisy: her left arm stays down, not at her chest.
      if (laugh > 0) her = blendPose(her, { ...her, ...LAUGH(time), lShoulder: her.lShoulder, lElbow: her.lElbow, ...SHOULDER }, laugh);
      reze.root.position.copy(at("cafe", BOOTH_X + 0.3, 0, -1.93));
      reze.root.rotation.set(0, -0.4 * laugh, 0);
      reze.apply(her);
      reze.seatOn(BENCH_Y);
      // Her hands: cupped round the coffee as she slides it over, then let go,
      // loose and open, flat on his shoulder when she laughs.
      handTo(reze, "left", "open", 0.5);
      handTo(reze, "right", "open", 0.5 * (1 - push) + 0.35 * laugh);
      // The cup: in front of her, slid across to his saucer, then in his hand.
      if (c < 33.0) {
        give("cupHim", cupHim, null);
        if (cupHim.parent !== cafe.group) cafe.group.add(cupHim);
        cupHim.position.set(lerp(BOOTH_X + 0.12, SAUCER_X, easeInOutCubic(segment(c, 31.6, 32.4))), TABLE_Y + 0.055, SAUCER_Z);
        cupHim.quaternion.identity();
      } else give("cupHim", cupHim, denji, "right", { grip: "grip", radius: 0.04 });

      const ha = segment(c, 36.0, 36.3);
      haha.update({ x: 74, y: 20, size: 6.5, rotate: 8, opacity: c > 36 && c < 38.6 ? Math.min(1, ha * 4) : 0, scale: lerp(1.6, 1, easeOutBack(ha)) * (1 + Math.sin(time * 18) * 0.03), boil: Math.floor(time * 10), jitter: 0.05 });

      if (shot.id === "cafe") {
        cuts_.iris = easeInOutCubic(segment(c, CAFE, CAFE + 1.4));
        cuts_.at = [50, 50];
        // Up on the name over the window, then down to the two of them in the booth.
        const k = easeInOutCubic(segment(c, CAFE + 1.2, 32.4));
        cam(at("cafe", 2.9, 1.9, 1.5).lerp(at("cafe", BOOTH_X + 0.15, 1.55, 0.75), k), at("cafe", 2.4, 3.3, -2.5).lerp(at("cafe", BOOTH_X, 1.0, -1.7), k));
        text = "He got to Crossroads before she did.";
        if (c > 31.4) textR = "A coffee, to pay him back.";
      } else if (shot.id === "sip") {
        // Close on him, straight across the table: between her and the vase.
        const k = easeInOutCubic(u);
        denji.bones.head.getWorldPosition(tmp);
        cam(tmp.clone().add(new THREE.Vector3(-0.1, 0.02, 1.15 - 0.12 * k)), tmp.clone().add(new THREE.Vector3(0, -0.12, 0)));
        if (c > 34.9) textR = "“Coffee's gross.”";
      } else if (shot.id === "laugh") {
        // Across the table, close on the two of them.
        cam(at("cafe", BOOTH_X + 0.05, 1.3, -0.35), at("cafe", BOOTH_X, 1.1, -1.9));
      } else {
        const k = easeInOutCubic(u);
        // Across the table, front on: the two of them, the daisies between.
        cam(at("cafe", BOOTH_X + 0.1, 1.28, 0.25).lerp(at("cafe", BOOTH_X + 0.05, 1.24, 0.0), k), at("cafe", BOOTH_X, 1.0, -1.85));
        textR = "He couldn't wait to come back.";
        cuts_.black = segment(c, 44.6, 46);
      }
    }

    // Her eyes, close.
    const eyesOn = c >= 24.8 && c < 27.2;
    crush.style.display = eyesOn ? "block" : "none";
    if (eyesOn) {
      const open = easeOutCubic(segment(c, 24.8, 25.1)) * (1 - easeInOutCubic(segment(c, 26.95, 27.2)));
      band.style.transform = `scaleY(${Math.max(0.001, open)})`;
      // The crush is in the shine. For a moment near the end it goes out and
      // the pupils tighten: not what it seems.
      const cold = c > 26.4 && c < 26.75;
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
    ready,
    update,
    dispose() {
      unsubscribeResize();
      [cap, capR, hurk, haha, cuts].forEach((x) => x.dispose());
      [crush, dog].forEach((x) => x.remove());
    },
  };
};
