// ARCHIVED: the Chesterton's Fence backdrop, cut from the DevFest deck: it
// felt out of place in this talk. To bring it back, move this file up to
// scenes/, set its imports back to "../", register "chesterton-fence" in
// SceneStage.jsx, and put the slides below back after "investigation-scene".
//
// The two slides, as they stood in devfestSlides.js:
//
//     from("chestertons-fence", {
//       budget: 50,
//       backdrop: "chesterton-fence",
//       backdropAlt: "Film-style animation: a man in shirtsleeves, waistcoat and flat cap carries a sledgehammer up an English country lane between clipped hedgerows to a wooden five-bar gate. A thought bubble reads 'Who would build a fence here?' He raises the hammer, thinking 'I should tear this fence down.' Then he lowers it, climbs the gate and sees that the lane beyond ends at a washed-out bridge over a fast, foaming river. A last thought bubble reads 'Oh. There was a reason this fence was put here.' He climbs down, leans the hammer against the gate post and leaves the gate standing.",
//       description:
//         "When an agent calls a block dead, unreachable, or safe to remove, it is reporting a pattern, not a reason. It has never seen the outage that put the line there, the customer it protects, or the night someone added it in a hurry. Make the agent show you the blame line, the ticket, the test — or go ask the person who was there.",
//     }),
//
//     handsUp(
//       "hands-up-act-1",
//       "reacher",
//       "What fence did you almost\ntear down?",
//       "The check that looked dead, the line nobody could explain. What was it guarding?",
//     ),
//
// // Presenter notes:
//     "chestertons-fence":
//       "Let the scene play: he thinks 'Who would build a fence here?', then 'I should tear this down', climbs it, and sees why it is there. Read the parable. Then: 'The agent is the man with the hammer. It cannot see past the gate. Make it show you the blame line, the ticket, the test, or go ask the person who was there.' Then click the thread.",
//     "hands-up-act-1":
//       "Same card, Reacher's colours. Ask, then wait. A real answer from the room beats any example you could give. If it is quiet, tell your own, briefly.",

import * as THREE from "three";
import { createInkWorld } from "../../rezeKit";
import { canvasTexture, createParticles, easeInCubic, easeInOutCubic, easeOutBack, hash, lerp, segment } from "../../kit";
import { outline } from "../../ink";
import { blendPose } from "../../figure";
import { createModelFigure } from "../../modelFigure";

/**
 * Chesterton's fence — G. K. Chesterton, The Thing (1929). A gate across a
 * road; the reformer says clear it away, the wiser man says first go and find
 * out why it is there.
 *
 * An English lane between hedgerows, late afternoon. A weathered five-bar gate
 * stands across it. A man in shirtsleeves, waistcoat and flat cap comes up the
 * lane with a sledgehammer on his shoulder.
 *
 *   0    – 4.2   from beyond the gate: he walks up the lane toward it
 *   4.2  – 6.6   over his shoulder: he studies the gate.
 *                Thought: "Who would build a fence here?"
 *   6.6  – 9.6   he raises the hammer, and holds it there.
 *                Thought: "I should tear this fence down."
 *   9.6  – 10.9  he lowers it and leans it against the bars
 *   10.9 – 12.2  he climbs onto the bottom rail to look over
 *   11.6 – 17.0  the camera rises over his shoulder: a few metres past the
 *                gate the lane ends at a crumbling lip. The bridge has washed
 *                out; snapped timbers hang over a fast river and a broken
 *                pier right below. Hold on it.
 *                Thought: "Oh. There was a reason this fence was put here."
 *   17.0 – 18.1  he climbs down
 *   18.1 – 20.3  on the lane side, framed on the latch post: he takes the
 *                hammer off the bars, carries it across, leans it against
 *                the post, steps back. The gate
 *                stays, the drop plain behind it.
 *
 * The thoughts are manga clouds drawn in screen space beside his head, so
 * they stay readable and in frame whatever the camera does.
 *
 * A dip to black resets the loop. Reduced motion holds 15.2: him on the gate,
 * the washed-out bridge below, the last thought up. The body is Quaternius's
 * CC0 rig with a painted period outfit; everything else is built here.
 */

const CYCLE = 20.6;
const STATIC_TIME = 15.2;

// Late afternoon: low warm sun off to the right of the lane, hazy blue above.
const LANE = { ground: "#2a2418", lines: "#ffe2b8", accent: "#ffb070", rim: "#ffd49a", shade: "#8696b8" };
const SUN = new THREE.Vector3(0.97, 0.17, 0.05).normalize();
// The key is cheated per shot, the way a film relights a reverse: from the
// lane side of the gate it falls on his face; from behind him, on the far bank.
const KEY_FRONT = [0.75, 0.5, -0.42];
const KEY_BACK = [0.8, 0.5, 0.38];
const HAZE = "#c8bea6";

// The lane runs along -z; the gate stands across it at z = 0.
const LANE_W = 1.7;
const POST_X = 1.76;
const RAILS = [0.18, 0.4, 0.62, 0.84, 1.14];
const RAIL_TOP = 0.218; // top of the bottom rail: where he stands
const RAIL_R = 0.03; // a hand closed round a rail
const ON_RAIL_Z = 0.12;
const CLIMB_Z = 0.32; // one foot up on the second rail // his root, up on the bottom rail
// The gorge: a river valley across the lane, its centre line wandering a little.
// Past the gate the lane runs down a little to the lip; then the drop.
const GORGE_Z = -8.6; // the near lip only a few metres past the gate
const RIM = 5.0;
const APPROACH = 0.6;
const DROP = 4.4;
const gorgeZ = (x) => GORGE_Z + 0.9 * (Math.sin(x * 0.07 + 0.6) - Math.sin(0.6));
const crumble = (x) => 0.25 * Math.sin(x * 2.3) + 0.15 * Math.sin(x * 5.7 + 1);
const rimAt = (x, near) => RIM + crumble(x) * (near ? 1 : 0.6);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Smooth 3D value noise in [0, 1]: the leafy surface of the hedges. */
const lattice = (x, y, z) => hash(x * 157.31 + y * 113.17 + z * 271.93);
const vnoise3 = (x, y, z) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const k = fz * fz * (3 - 2 * fz);
  const plane = (zz) =>
    lerp(lerp(lattice(ix, iy, zz), lattice(ix + 1, iy, zz), u), lerp(lattice(ix, iy + 1, zz), lattice(ix + 1, iy + 1, zz), u), v);
  return lerp(plane(iz), plane(iz + 1), k);
};

/** Ground before the gorge is cut: lane, hedge banks, rolling fields, the slope down to the river. */
const surfaceAt = (x, z) => {
  const ax = Math.abs(x);
  const fields = 0.32 * Math.sin(x * 0.11) * Math.cos(z * 0.09) + 0.18 * Math.sin(z * 0.05 + x * 0.03);
  let h = fields * smooth(2.0, 4.0, ax);
  // The banks the hedges grow on.
  h += 0.25 * smooth(1.75, 2.0, ax) * (1 - smooth(2.6, 3.0, ax));
  const dz = z - gorgeZ(x);
  const W = rimAt(x, dz > 0);
  // Both sides run down toward the river, and the far side climbs away beyond.
  h -= APPROACH * smooth(W + 2.5, W, Math.abs(dz));
  if (dz < 0) h += Math.max(0, -dz - W - 2.5) * 0.05;
  return h;
};
/** How far the gorge has cut down here, 0 to DROP. */
const cutAt = (x, z) => {
  const dz = z - gorgeZ(x);
  const W = rimAt(x, dz > 0);
  return DROP * smooth(W, W - 1.6, Math.abs(dz));
};
const heightAt = (x, z) => surfaceAt(x, z) - cutAt(x, z);
const RIVER_Y = -APPROACH - DROP * 0.72;

/** Dense near the gate and the gorge, stretched out to the horizon. */
const stretch = (u, lin, span, max) => {
  const a = Math.abs(u);
  const s = Math.sign(u);
  const slope = span / lin;
  if (a <= lin) return s * a * slope;
  const k = (max - span - slope * (1 - lin)) / (1 - lin) ** 2;
  return s * (span + slope * (a - lin) + k * (a - lin) ** 2);
};

/** Late afternoon: hazy blue zenith, warm gold toward the sun, a few lit clouds. */
const SKY_GLSL = /* glsl */ `
  uniform vec3 uSun, uZenith, uUpper, uHorizon, uGlow, uBelow, uCloud;
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
  }
  vec3 skyColor(vec3 d) {
    float e = d.y;
    float mu = max(dot(d, uSun), 0.0);
    float near = max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0);
    vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.2, e));
    col = mix(col, uZenith, smoothstep(0.15, 0.7, e));
    col += uGlow * pow(near, 3.0) * (1.0 - smoothstep(0.0, 0.35, e)) * 0.18;
    col += uGlow * pow(mu, 18.0) * 0.14;
    // Fair-weather cumulus: soft, lit on the sun side.
    vec2 q = vec2(atan(d.x, -d.z) * 3.0, e * 9.0);
    float n = vnoise(q * vec2(1.0, 1.6)) * 0.6 + vnoise(q * vec2(2.6, 3.1) + 4.0) * 0.3 + vnoise(q * 7.0) * 0.1;
    float cloud = smoothstep(0.56, 0.74, n) * smoothstep(0.06, 0.14, e) * (1.0 - smoothstep(0.35, 0.6, e));
    col = mix(col, mix(uCloud, uGlow, pow(mu, 6.0) * 0.6), cloud * 0.75);
    col = mix(uBelow, col, smoothstep(-0.04, 0.0, e));
    return min(col, vec3(0.92));
  }
`;

// ── Poses (figure.js convention: faces +z, left is +x) ──────────────────────
const REST = {
  spine: [0.02, 0, 0],
  head: [0.02, 0, 0],
  lShoulder: [0.04, 0, 0.08],
  lElbow: [-0.18, 0, 0],
  rShoulder: [0.04, 0, -0.08],
  rElbow: [-0.18, 0, 0],
};
// The hammer on his right shoulder, hand at the haft in front.
const CARRY_ARM = { rShoulder: [-0.55, 0, -0.25], rElbow: [-2.2, 0, 0] };
const CARRY = { ...REST, ...CARRY_ARM };
// Both hands up, the head of the hammer cocked behind him.
const RAISE = {
  spine: [-0.12, 0, 0],
  chest: [-0.08, 0, 0],
  head: [-0.08, 0, 0],
  lShoulder: [-3.25, 0, -0.62],
  lElbow: [-0.5, 0, 0],
  rShoulder: [-3.0, 0, 0.12],
  rElbow: [-0.9, 0, 0],
};
// Lowered: both hands on the haft at his waist, the head up in front of him.
const LOWER = {
  spine: [0.12, 0, 0],
  chest: [0.04, 0, 0],
  head: [0.12, 0, 0],
  lShoulder: [-0.95, 0, -0.6],
  lElbow: [-0.6, 0, 0],
  rShoulder: [-0.45, 0, 0.12],
  rElbow: [-1.0, 0, 0],
};
// Halfway up: right foot on the second rail, hands on the top rail.
const CLIMB = {
  spine: [0.2, 0, 0],
  head: [-0.12, 0, 0],
  lShoulder: [-0.3, 0, 0.1],
  lElbow: [-1.3, 0, 0],
  rShoulder: [-0.3, 0, -0.1],
  rElbow: [-1.3, 0, 0],
  rHip: [-1.65, 0, -0.05],
  rKnee: [1.9, 0, 0],
  lHip: [0.08, 0, 0.03],
  lKnee: [0.1, 0, 0],
};
// Standing on the bottom rail, leaning on the top one, looking over.
const ON_GATE = {
  spine: [0.28, 0, 0],
  chest: [0.06, 0, 0],
  neck: [0.1, 0, 0],
  head: [0.22, 0, 0],
  lShoulder: [0.06, 0, 0.12],
  lElbow: [-0.85, 0, 0],
  rShoulder: [0.06, 0, -0.12],
  rElbow: [-0.85, 0, 0],
  lHip: [-0.05, 0, 0.05],
  rHip: [-0.05, 0, -0.05],
  lKnee: [0.08, 0, 0],
  rKnee: [0.08, 0, 0],
};
// Stooping to his right for the hammer.
const REACH = {
  spine: [0.38, 0, 0],
  head: [0.2, 0, 0],
  lShoulder: [0.0, 0, 0.12],
  lElbow: [-0.3, 0, 0],
  rShoulder: [-0.75, 0, -0.25],
  rElbow: [-0.3, 0, 0],
  lHip: [-0.25, 0, 0.04],
  rHip: [-0.25, 0, -0.04],
  lKnee: [0.3, 0, 0],
  rKnee: [0.3, 0, 0],
  lift: -0.03,
};
const walkPose = (p, amount, carry) => {
  const s = Math.sin(p);
  return {
    spine: [0.05, 0, 0],
    head: [0.03, 0, 0],
    lHip: [-0.42 * s * amount, 0, 0.04],
    rHip: [0.42 * s * amount, 0, -0.04],
    lKnee: [(0.08 + 0.6 * Math.max(0, Math.sin(p + 1.3))) * amount + 0.04, 0, 0],
    rKnee: [(0.08 + 0.6 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * amount + 0.04, 0, 0],
    lShoulder: [0.32 * s * amount, 0, 0.1],
    lElbow: [-0.25, 0, 0],
    rShoulder: carry ? CARRY_ARM.rShoulder : [-0.32 * s * amount, 0, -0.1],
    rElbow: carry ? CARRY_ARM.rElbow : [-0.25, 0, 0],
    lift: -0.012 * Math.abs(Math.cos(p)) * amount,
  };
};

/** Up, hold, down: an envelope in [0, 1]. */
const envelope = (c, a, b, d, e) => easeInOutCubic(segment(c, a, b)) * (1 - easeInOutCubic(segment(c, d, e)));

// Hammer: grip at the origin, haft along +y to the head (fig.hold's convention).
const HAFT = 0.72;
const HAFT_R = 0.02;
// Haft direction (grip → head) in his root space, per hold. The hand sets the
// haft's line; these only nudge it a few degrees inside the closed fist.
const DIR_CARRY = new THREE.Vector3(-0.15, 0.6, -0.8).normalize();
const DIR_RAISE = new THREE.Vector3(0, 0.05, -1).normalize();
const DIR_LOWER = new THREE.Vector3(0, 0.75, 0.66).normalize();
const MAX_NUDGE = 0.3;

// ── The thoughts ───────────────────────────────────────────────────────────
// [text, in, out, side, rise]: side is which side of his head the cloud sits
// on screen (+1 right, -1 left) and rise how far its centre sits above his
// head (in NDC), chosen per shot to keep clear of the action. The last one
// sits low and left, off the washed-out bridge.
const THOUGHTS = [
  ["Who would build a fence here?", 4.45, 6.7, 1, 0.34],
  ["I should tear this fence down.", 6.95, 9.3, 1, 0.34],
  ["Oh. There was a reason this fence was put here.", 13.4, 16.9, -1, 0.0],
];
const BUBBLE_INK = "#1b1414";
const BUBBLE_FILL = "#f4f1ea";
const BUBBLE_TEX = [1024, 600];
const BUBBLE_H = 0.34; // of the frame height
const BUBBLE_FONT = '"Space Grotesk", "Avenir Next", "Helvetica Neue", Arial, sans-serif';

/** A manga thought cloud: a ring of puffs, one dark outer line, the thought in it. */
const drawCloud = (ctx, W, H, text) => {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const puffs = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + 0.15;
    const r = 92 + 22 * hash(i * 3.3 + 1);
    puffs.push([cx + Math.cos(a) * W * 0.36, cy + Math.sin(a) * H * 0.29, r]);
  }
  const fillAll = () => {
    for (const [x, y, r] of puffs) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.38, H * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  // The line: every puff stroked fat, then the fill laid over all of them.
  ctx.fillStyle = BUBBLE_INK;
  ctx.strokeStyle = BUBBLE_INK;
  ctx.lineWidth = 16;
  for (const [x, y, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = BUBBLE_FILL;
  fillAll();
  // The thought: as large as fits, up to three lines.
  const maxW = W * 0.7;
  let size = 84;
  let lines = [];
  for (; size >= 40; size -= 4) {
    ctx.font = `700 ${size}px ${BUBBLE_FONT}`;
    lines = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxW) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    if (lines.length <= 3 && lines.length * size * 1.18 < H * 0.62) break;
  }
  ctx.fillStyle = BUBBLE_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lh = size * 1.18;
  lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * lh));
};
/** A trail circle: white with the same dark line. */
const drawDot = (ctx, W) => {
  ctx.clearRect(0, 0, W, W);
  ctx.beginPath();
  ctx.arc(W / 2, W / 2, W / 2 - 10, 0, Math.PI * 2);
  ctx.fillStyle = BUBBLE_FILL;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = BUBBLE_INK;
  ctx.stroke();
};
// Where he leaves it: against the bars, then against the latch post.
const restAt = (grip, lean) => {
  const g = new THREE.Vector3(...grip);
  const d = new THREE.Vector3(...lean).normalize();
  return { pos: g, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d) };
};
const ON_BARS = restAt([0.95, 0.8, 0.09], [0, -1, 0.33]);
const ON_POST = restAt([POST_X - 0.13, 0.8, 0.16], [-0.26, -1, 0.24]);

export const createChestertonFenceScene = (stage, { overlay } = {}) => {
  void overlay; // no text on this one: it sits behind the slide
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  // Our own sky dome: it has to sit still while the camera cranes.
  w.backdrop.visible = false;
  const baseExposure = renderer.toneMappingExposure;
  const bloom = stage.bloomPass;
  const baseBloom = bloom ? { strength: bloom.strength, threshold: bloom.threshold } : null;
  if (bloom) Object.assign(bloom, { strength: 0.28, threshold: 0.95 });
  let disposed = false;

  const add = (mesh, parent = scene, line = false) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  /** A box between two corners. */
  const slab = (x0, x1, y0, y1, z0, z1, mat, line = false, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, line);
  };
  /** A box of size (sx, sy, sz) at a point, turned. */
  const beam = (sx, sy, sz, mat, [x, y, z], [rx, ry, rz] = [0, 0, 0], line = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    return add(m, scene, line);
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    gate: w.ink({ tint: "#a39a8a", tone: 0.85, rim: 0.3 }),
    post: w.ink({ tint: "#6f6658", tone: 0.7, rim: 0.3 }),
    iron: w.ink({ tint: "#2b2622", tone: 0.4, rim: 0.3 }),
    leafA: w.ink({ tint: "#45602a", tone: 0.8, rim: 0.2, vertexColors: true }),
    leafB: w.ink({ tint: "#587533", tone: 0.85, rim: 0.2, vertexColors: true }),
    tree: w.ink({ tint: "#3a5226", tone: 0.68, rim: 0.2 }),
    bark: w.ink({ tint: "#4a3d2e", tone: 0.55, rim: 0.2 }),
    stone: w.ink({ tint: "#8d877a", tone: 0.82, rim: 0.25 }),
    stoneDark: w.ink({ tint: "#6a655b", tone: 0.65, rim: 0.2 }),
    timber: w.ink({ tint: "#5e4a36", tone: 0.62, rim: 0.25 }),
    earth: w.ink({ tint: "#6b5642", tone: 0.7, rim: 0.2 }),
    hills: w.ink({ tint: "#6f7d60", tone: 0.62, rim: 0 }),
    haft: w.ink({ tint: "#b08a5c", tone: 0.85, rim: 0.3 }),
    cloth: w.ink({ tint: "#55504a", tone: 0.62, rim: 0.3 }),
  };

  // ── Sky ──────────────────────────────────────────────────────────────────
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(170, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: {
        uSun: { value: SUN.clone() },
        uZenith: { value: new THREE.Color("#6a8fbe") },
        uUpper: { value: new THREE.Color("#a7bdd2") },
        uHorizon: { value: new THREE.Color("#e9d2ae") },
        uGlow: { value: new THREE.Color("#ffd49a") },
        uBelow: { value: new THREE.Color("#6d7258") },
        uCloud: { value: new THREE.Color("#e6dccb") },
      },
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
      `,
      fragmentShader: /* glsl */ `
        ${SKY_GLSL}
        varying vec3 vW;
        void main() {
          vec3 col = skyColor(normalize(vW - cameraPosition));
          col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  sky.renderOrder = -2;
  sky.frustumCulled = false;
  scene.add(sky);

  // ── Ground: lane, verges, fields, and the gorge ──────────────────────────
  {
    const geo = new THREE.PlaneGeometry(2, 2, 280, 360);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const C = {
      dirt: new THREE.Color("#9a8462"),
      rut: new THREE.Color("#76624a"),
      crown: new THREE.Color("#7d8a4a"),
      verge: new THREE.Color("#5f7a3a"),
      pasture: new THREE.Color("#7c8c46"),
      stubble: new THREE.Color("#b39a58"),
      rim: new THREE.Color("#6b5440"),
      rock: new THREE.Color("#8a8172"),
      strata: new THREE.Color("#6c6458"),
      bed: new THREE.Color("#3a3a32"),
    };
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = stretch(p.getX(i), 0.5, 12, 90);
      const z = -4 + stretch(p.getZ(i), 0.6, 18, 90);
      const y = heightAt(x, z);
      p.setXYZ(i, x, y, z);
      const ax = Math.abs(x);
      const depth = cutAt(x, z) / DROP; // how far down the gorge wall
      if (ax < LANE_W) {
        c.copy(C.dirt);
        const rut = Math.abs(ax - 0.65);
        if (rut < 0.18) c.lerp(C.rut, 0.7 * (1 - rut / 0.18));
        if (ax < 0.22) c.lerp(C.crown, 0.75 * (1 - ax / 0.22));
      } else if (ax < 3.2) c.copy(C.verge);
      else {
        // Fields between the hedges, pasture and stubble by the plot.
        const plot = Math.floor((x + 200) / 16) * 7 + Math.floor((z + 200) / 18) * 3;
        c.copy(hash(plot) > 0.5 ? C.pasture : C.stubble).lerp(C.verge, 0.15 + 0.15 * hash(i * 0.37));
      }
      if (depth > 0.01) {
        // The gorge walls: raw earth at the lip, rock below in bands, a dark bed.
        const k = Math.min(1, depth * 8);
        c.lerp(C.rim, k);
        if (depth > 0.15) c.copy(C.rock).lerp(C.strata, 0.5 + 0.5 * Math.sin(y * 7.0 + x * 0.3));
        if (depth > 0.9) c.copy(C.bed);
      }
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    add(new THREE.Mesh(geo, w.ink({ tint: "#ffffff", vertexColors: true, tone: 0.9, rim: 0 })));
  }

  // ── The river: fast, blue-green, streaked with foam running downstream ──
  const water = (() => {
    const geo = new THREE.PlaneGeometry(180, 1, 360, 8);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const edge = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const v = p.getZ(i);
      p.setXYZ(i, x, RIVER_Y, gorgeZ(x) + v * 2 * (RIM - 0.85));
      edge[i] = Math.abs(v) * 2;
    }
    geo.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color("#123f47") },
        uLight: { value: new THREE.Color("#2f8582") },
        uFoam: { value: new THREE.Color("#eef3ee") },
        uFog: { value: new THREE.Color(HAZE) },
        uPier: { value: new THREE.Vector2(0, GORGE_Z) },
      },
      vertexShader: /* glsl */ `
        attribute float aEdge;
        varying float vEdge;
        varying vec3 vW;
        varying float vDepth;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz; vEdge = aEdge;
          vec4 mv = viewMatrix * w;
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uDeep, uLight, uFoam, uFog;
        uniform vec2 uPier;
        varying float vEdge;
        varying vec3 vW;
        varying float vDepth;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
        float vn(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
        }
        // Ridged noise: thin bright lines where the noise crosses its middle.
        float ridge(vec2 p) { return 1.0 - abs(vn(p) * 2.0 - 1.0); }
        void main() {
          float t = uTime;
          // Flowing toward +x, fast: the body of the water in slow and quick layers.
          vec2 p = vec2(vW.x * 0.35 - t * 2.4, vW.z * 2.2);
          float n = vn(p) * 0.6 + vn(p * vec2(2.1, 1.7) + vec2(-t * 1.7, 3.0)) * 0.4;
          vec3 col = mix(uDeep, uLight, smoothstep(0.3, 0.85, n));
          // Foam streaks drawn out along the current, two speeds so it reads as rushing.
          float s1 = ridge(vec2(vW.x * 0.55 - t * 3.6, vW.z * 5.5));
          float s2 = ridge(vec2(vW.x * 1.1 - t * 5.2, vW.z * 10.0 + 5.0));
          float streak = smoothstep(0.84, 0.97, s1) * (0.45 + 0.55 * smoothstep(0.35, 0.7, n)) + smoothstep(0.9, 0.985, s2) * 0.75;
          // Broken white water: patches of churn that tumble downstream.
          float churn = vn(vec2(vW.x * 1.6 - t * 4.0, vW.z * 3.2)) * vn(vec2(vW.x * 0.7 - t * 2.8, vW.z * 1.4 + 9.0));
          float caps = smoothstep(0.38, 0.6, churn);
          // Foam along the banks and churned up behind the pier.
          vec2 dp = vW.xz - uPier;
          float wake = exp(-abs(dp.y) * 1.4) * smoothstep(-0.6, 0.6, dp.x) * exp(-max(dp.x, 0.0) * 0.15);
          float stir = exp(-length(dp) * 1.0);
          float foam = streak + caps * 0.7 + smoothstep(0.7, 1.0, vEdge) * (0.55 + 0.4 * s1) + (wake + stir) * smoothstep(0.35, 0.7, n + s1 * 0.3) * 1.1;
          col = mix(col, uFoam, clamp(foam, 0.0, 0.92));
          col = mix(col, uFog, smoothstep(25.0, 130.0, vDepth) * 0.45);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mat;
  })();

  // ── Hedgerows: trimmed, flat-faced masses with a leafy surface ──────────
  {
    /**
     * A clipped hedge along a line, built as one surface: a profile with sheer,
     * slightly battered sides, a flat top and rounded shoulders, swept along
     * the ground and pushed in and out by leafy noise so the faces catch the
     * light leaf by leaf instead of reading as balls. Ends are capped flat.
     */
    const C = { deep: new THREE.Color("#253a19"), mid: new THREE.Color("#46622a"), lit: new THREE.Color("#6c8a37"), sun: new THREE.Color("#8a9a44") };
    const hedgeMat = w.ink({ tint: "#ffffff", tone: 0.88, rim: 0.2, vertexColors: true });
    const tmp = new THREE.Color();
    const hedge = (x0, z0, x1, z1, { height = 2.0, depth = 0.95, step = 0.07, res = step } = {}) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / len;
      const uz = (z1 - z0) / len;
      const nx = -uz;
      const nz = ux;
      // The profile, left bottom round over the top to right bottom: [across, up, normal across, normal up].
      const prof = [];
      const b0 = depth * 0.53;
      const b1 = depth * 0.47;
      const rr = Math.min(0.16, depth * 0.2);
      const side = (s) => {
        const pts = [];
        const nv = Math.max(4, Math.round((height + 0.15 - rr) / res));
        for (let k = 0; k <= nv; k++) {
          const v = -0.15 + (k / nv) * (height - rr + 0.15);
          pts.push([s * lerp(b0, b1, (v + 0.15) / (height + 0.15)), v, s, 0]);
        }
        const na = Math.max(3, Math.round((rr * Math.PI) / 2 / res));
        for (let k = 1; k <= na; k++) {
          const a = (k / (na + 1)) * (Math.PI / 2);
          pts.push([s * (b1 - rr + Math.cos(a) * rr), height - rr + Math.sin(a) * rr, s * Math.cos(a), Math.sin(a)]);
        }
        return pts;
      };
      const top = [];
      const nt = Math.max(3, Math.round((2 * (b1 - rr)) / res));
      for (let k = 0; k <= nt; k++) top.push([lerp(-(b1 - rr), b1 - rr, k / nt), height, 0, 1]);
      prof.push(...side(-1), ...top, ...side(1).reverse());
      const P = prof.length;
      const n = Math.max(2, Math.ceil(len / step));
      const pos = [];
      const col = [];
      const idx = [];
      const put = (x, y, z, d, up, lightness) => {
        pos.push(x, y, z);
        // Hollows dark, bumps lit, the top and sun side brighter, a leafy speckle.
        const leaf = vnoise3(x * 15, y * 15, z * 15);
        tmp.copy(C.deep).lerp(C.mid, smooth(-0.03, 0.02, d) * 0.7 + 0.3 * leaf);
        tmp.lerp(C.lit, smooth(0.0, 0.06, d) * (0.4 + 0.6 * up) * lightness);
        tmp.lerp(C.sun, Math.max(0, up - 0.6) * 0.5 * leaf);
        const shade = 0.6 + 0.4 * smooth(-0.1, height * 0.7, y - heightAtCache);
        col.push(tmp.r * shade, tmp.g * shade, tmp.b * shade);
      };
      let heightAtCache = 0;
      const leafy = (x, y, z) =>
        0.055 * (vnoise3(x * 1.3, y * 1.3, z * 1.3) - 0.5) + 0.04 * (vnoise3(x * 6, y * 6, z * 6) - 0.5) + 0.022 * (vnoise3(x * 15, y * 15, z * 15) - 0.5);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const cx = lerp(x0, x1, t);
        const cz = lerp(z0, z1, t);
        const g = heightAt(cx, cz);
        heightAtCache = g;
        for (const [pu, pv, qu, qv] of prof) {
          const x = cx + nx * pu;
          const z = cz + nz * pu;
          const y = g + pv;
          const d = leafy(x, y, z) * smooth(-0.15, 0.2, pv) * (qv > 0.9 ? 0.6 : 1);
          put(x + nx * qu * d, y + qv * d, z + nz * qu * d, d, qv, 1);
        }
      }
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < P - 1; k++) {
          const a = i * P + k;
          const b = a + P;
          idx.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
      // End caps: rings toward a centre, the flat cut end of the hedge.
      for (const [ring, dir] of [[0, -1], [n, 1]]) {
        const base = pos.length / 3;
        const cx = lerp(x0, x1, ring / n);
        const cz = lerp(z0, z1, ring / n);
        const g = heightAt(cx, cz);
        heightAtCache = g;
        const mid = height * 0.45;
        for (const f of [1, 0.66, 0.33]) {
          for (let k = 0; k < P; k++) {
            const o = (ring * P + k) * 3;
            if (f === 1) {
              put(pos[o], pos[o + 1], pos[o + 2], 0, 0.3, 0.6);
              continue;
            }
            const [pu, pv] = prof[k];
            const x = cx + nx * pu * f;
            const z = cz + nz * pu * f;
            const y = g + mid + (pv - mid) * f;
            const d = leafy(x, y, z) * 0.8;
            put(x + ux * dir * d, y, z + uz * dir * d, d, 0.3, 0.6);
          }
        }
        put(cx, g + mid, cz, 0, 0.3, 0.6);
        const centre = base + 3 * P;
        for (let r = 0; r < 2; r++) {
          for (let k = 0; k < P - 1; k++) {
            const a = base + r * P + k;
            const b = a + P;
            if (dir > 0) idx.push(a, a + 1, b, b, a + 1, b + 1);
            else idx.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
        for (let k = 0; k < P - 1; k++) {
          const a = base + 2 * P + k;
          if (dir > 0) idx.push(a, a + 1, centre);
          else idx.push(a, centre, a + 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      add(new THREE.Mesh(geo, hedgeMat));
    };
    // The lane's hedges: past the gate posts right up to the lip of the gorge, then again beyond it.
    const nearEnd = (s) => gorgeZ(s * 2.25) + rimAt(s * 2.25, true) + 0.5;
    const farEnd = (s) => gorgeZ(s * 2.25) - rimAt(s * 2.25, false) - 0.8;
    for (const s of [-1, 1]) {
      hedge(s * 2.25, 40, s * 2.25, nearEnd(s), { height: 1.95, step: 0.06, res: 0.055 });
      hedge(s * 2.25, farEnd(s), s * 2.25, -48, { height: 2.0, step: 0.12, res: 0.1 });
      // Field boundaries off the lane.
      const far = { height: 1.7, depth: 1.1, step: 0.3, res: 0.25 };
      hedge(s * 2.6, 9, s * 36, 11, far);
      hedge(s * 2.6, 27, s * 42, 25, far);
      hedge(s * 2.6, -26, s * 40, -24, far);
      hedge(s * 16, 10.5, s * 15, 60, far);
      hedge(s * 18, -24.5, s * 20, -70, far);
    }
  }

  // ── Oaks in the hedgerows and the fields: leaf clumps, instanced ────────
  {
    const clumps = [[], []];
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let seed = 0;
    const clump = (x, y, z, r, squash = 1) => {
      seed += 1;
      e.set(hash(seed * 1.7) * 3, hash(seed * 2.3) * 3, 0);
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(r, r * squash, r));
      clumps[hash(seed * 3.1) > 0.5 ? 1 : 0].push(m4.clone());
    };
    // Oaks in the hedgerows and the fields.
    const OAKS = [
      [-4.2, 14, 1.1],
      [5.0, 22, 1.25],
      [-9, 3, 1.0],
      [7.5, 4.5, 1.15],
      [-16, 18, 1.3],
      [21, 9, 1.2],
      [-5.5, -30, 1.3],
      [6.5, -36, 1.1],
      [-24, -28, 1.4],
      [28, -32, 1.3],
      [-34, 6, 1.2],
      [36, 26, 1.4],
    ];
    const trunks = [];
    OAKS.forEach(([x, z, s], n) => {
      const g = heightAt(x, z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 3.4 * s, 10), M.bark);
      trunk.position.set(x, g + 1.7 * s, z);
      add(trunk);
      trunks.push(trunk);
      for (let k = 0; k < 60; k++) {
        const a = hash(n * 13 + k * 1.9) * Math.PI * 2;
        const rr = Math.sqrt(hash(n * 7 + k * 2.7)) * 2.6 * s;
        const up = hash(n + k * 3.3);
        clump(x + Math.cos(a) * rr * (1 - 0.35 * up), g + 3.2 * s + up * 2.6 * s, z + Math.sin(a) * rr * (1 - 0.35 * up), (0.55 + hash(k + n * 5) * 0.45) * s, 0.8);
      }
    });
    // Darker on the underside of every clump: shadowed leaves under lit ones.
    const geo = new THREE.IcosahedronGeometry(1, 1);
    {
      const p = geo.attributes.position;
      const col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const v = 0.42 + 0.58 * smooth(-0.7, 0.75, p.getY(i));
        col.set([v, v, v * 0.92], i * 3);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    [M.leafA, M.leafB].forEach((mat, i) => {
      const list = clumps[i];
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((m, k) => mesh.setMatrixAt(k, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      add(mesh);
    });
  }

  // ── Distant hills, sunk in the haze ──────────────────────────────────────
  {
    const HILLS = [
      [-60, -120, 60, 22, 10],
      [50, -135, 55, 20, 12],
      [130, -60, 35, 50, 14],
      [-135, -40, 35, 55, 13],
      [-110, 90, 50, 30, 11],
      [100, 110, 55, 30, 12],
      [0, 150, 70, 20, 9],
    ];
    HILLS.forEach(([x, z, rx, rz, h], n) => {
      const geo = new THREE.SphereGeometry(1, 40, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const px = p.getX(i);
        const pz = p.getZ(i);
        p.setY(i, p.getY(i) * (0.75 + 0.25 * Math.sin(px * 4.1 + n) * Math.cos(pz * 3.3 - n)));
      }
      geo.computeVertexNormals();
      const hill = new THREE.Mesh(geo, M.hills);
      hill.scale.set(rx, h, rz);
      hill.position.set(x, -1, z);
      add(hill);
    });
  }

  // ── The gate: a weathered five-bar field gate between two posts ─────────
  {
    for (const s of [-1, 1]) {
      slab(s * POST_X - 0.1, s * POST_X + 0.1, -0.2, 1.42, -0.1, 0.1, M.post, true);
      // A weathered top, cut on a slope to shed the rain.
      beam(0.21, 0.05, 0.21, M.post, [s * POST_X, 1.43, 0], [0.18, 0, 0]);
    }
    const G0 = -1.6;
    const G1 = 1.56;
    // Heel stile (hinge side) and head stile (latch side).
    slab(G0, G0 + 0.1, 0.08, 1.22, -0.045, 0.045, M.gate, true);
    slab(G1 - 0.09, G1, 0.08, 1.2, -0.04, 0.04, M.gate, true);
    RAILS.forEach((y, i) => {
      const top = i === RAILS.length - 1;
      const t = top ? 0.1 : 0.075;
      const d = top ? 0.08 : 0.05;
      const r = beam(G1 - G0, t, d, M.gate, [(G0 + G1) / 2, y, 0], [0, 0, (hash(i * 4.1) - 0.5) * 0.012]);
      r.position.y += (hash(i * 2.3) - 0.5) * 0.01;
    });
    // The diagonal brace, heel foot to the top rail, and a middle upright.
    {
      const a = new THREE.Vector2(G0 + 0.1, 0.18);
      const b = new THREE.Vector2(G1 - 0.35, 1.1);
      const len = a.distanceTo(b);
      beam(len, 0.07, 0.045, M.gate, [(a.x + b.x) / 2, (a.y + b.y) / 2, 0.045], [0, 0, Math.atan2(b.y - a.y, b.x - a.x)]);
      beam(0.07, 0.98, 0.045, M.gate, [0.05, 0.66, 0.045]);
    }
    // Iron: two hinge straps, the latch and its keeper.
    for (const y of [0.3, 1.08]) {
      slab(G0, G0 + 0.55, y - 0.02, y + 0.02, 0.045, 0.06, M.iron);
      slab(-POST_X + 0.08, G0, y - 0.03, y + 0.03, -0.03, 0.03, M.iron);
    }
    slab(G1 - 0.14, POST_X - 0.06, 1.0, 1.04, 0.045, 0.065, M.iron);
    slab(POST_X - 0.11, POST_X - 0.09, 0.96, 1.08, 0.05, 0.12, M.iron);
  }

  // ── The washed-out bridge ────────────────────────────────────────────────
  {
    const nearLip = gorgeZ(0) + rimAt(0, true);
    const farLip = gorgeZ(0) - rimAt(0, false);
    const nearY = surfaceAt(0, nearLip);
    const farY = surfaceAt(0, farLip);
    // Stone abutments, in courses, the top courses broken where the flood took them.
    const abutment = (zFace, zBack, topY, side) => {
      const H = 0.45;
      for (let k = 0; ; k++) {
        const y1 = topY - k * H;
        const y0 = y1 - H;
        if (y1 < RIVER_Y - 0.6) break;
        // The near side lost its top course on the downstream (+x) side.
        const broken = k === 0 ? 0.9 : k === 1 ? 0.35 : 0;
        const x1 = side > 0 ? 2.05 - broken * 1.4 : 2.05;
        const x0 = side < 0 ? -2.05 + broken * 1.2 : -2.05;
        slab(x0, x1, y0, y1 - 0.01, zFace, zBack, k % 2 ? M.stoneDark : M.stone, true);
      }
    };
    abutment(nearLip - 1.15, nearLip + 0.05, nearY - 0.01, 1);
    abutment(farLip + 1.15, farLip - 0.05, farY - 0.01, -1);
    // Stubs of the deck: stringers snapped off, two hanging toward the water.
    const stub = (z0, dir, y0, n) => {
      [-1.25, -0.42, 0.42, 1.25].forEach((x, i) => {
        const len = 0.7 + hash(i * 3.7 + n) * 1.1;
        const droop = i === 1 || i === 2 ? 0.45 + 0.5 * hash(i + n * 2) : 0.04 * hash(i * 5 + n);
        const g = new THREE.Group();
        g.position.set(x, y0 - 0.09, z0);
        g.rotation.x = dir * droop;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, len), M.timber);
        m.position.z = dir * (len / 2);
        g.add(m);
        outline(m, w.line);
        scene.add(g);
      });
      // A few deck planks still on the first metre.
      for (let k = 0; k < 4; k++) {
        if (hash(k * 2.1 + n) < 0.3) continue;
        beam(3.0 - hash(k + n) * 1.2, 0.05, 0.22, M.timber, [-0.3 + hash(k * 3 + n) * 0.6, y0 + 0.025, z0 + dir * (0.15 + k * 0.26)], [0, (hash(k * 7 + n) - 0.5) * 0.15, 0]);
      }
      // A railing post, its rail snapped and hanging.
      beam(0.12, 1.0, 0.12, M.timber, [-1.9, y0 + 0.5, z0 + dir * 0.1]);
      beam(0.07, 0.07, 1.3, M.timber, [-1.9, y0 + 0.5, z0 + dir * 0.6], [dir * 0.9, 0, 0]);
    };
    stub(nearLip - 1.15, -1, nearY, 1);
    stub(farLip + 1.15, 1, farY, 2);
    // The middle pier, its top broken away, debris lodged against it.
    const pz = GORGE_Z;
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 3.6, 10), M.stone);
    pier.position.set(0, RIVER_Y + 0.2, pz);
    add(pier, scene, true);
    beam(1.2, 0.6, 1.0, M.stoneDark, [0.15, RIVER_Y + 2.1, pz + 0.1], [0.12, 0.3, 0.18]);
    beam(0.7, 0.4, 0.8, M.stone, [-0.35, RIVER_Y + 2.45, pz - 0.15], [-0.2, 0.6, -0.25]);
    beam(0.16, 0.2, 3.4, M.timber, [-0.7, RIVER_Y + 0.15, pz + 0.3], [0.1, 0.9, 0.05]);
    beam(0.14, 0.16, 2.6, M.timber, [-0.85, RIVER_Y + 0.25, pz - 0.6], [-0.2, 1.4, 0.15]);
    beam(0.16, 0.18, 3.0, M.timber, [5.5, RIVER_Y + 0.05, pz + 1.4], [0, 0.25, 0.08]);
    // Loose earth and stones on the lip of the road where it gave way.
    for (let k = 0; k < 22; k++) {
      const x = (hash(k * 1.3) - 0.5) * 3.6;
      const z = nearLip + 0.1 - hash(k * 2.9) * 0.6;
      const r = 0.06 + hash(k * 4.7) * 0.12;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), hash(k * 6.1) > 0.4 ? M.earth : M.stoneDark);
      m.position.set(x, Math.max(heightAt(x, z), nearY - 0.6) + r * 0.4, z);
      m.rotation.set(hash(k) * 3, hash(k * 2) * 3, 0);
      add(m);
    }
  }

  // ── Pollen in the low sun ────────────────────────────────────────────────
  const motes = createParticles({ count: 90, blending: "add" });
  scene.add(motes.points);
  let moteSeed = 0;
  const mote = () => {
    moteSeed += 1;
    motes.emit({
      position: [(hash(moteSeed * 1.3) - 0.5) * 3.4, 0.4 + hash(moteSeed * 2.7) * 2.2, 3 - hash(moteSeed * 5.1) * 8],
      velocity: [0.05 + hash(moteSeed * 7.3) * 0.08, (hash(moteSeed) - 0.4) * 0.04, (hash(moteSeed * 9.1) - 0.5) * 0.06],
      life: 7 + hash(moteSeed * 3.9) * 3,
      size: 0.008 + hash(moteSeed * 4.4) * 0.008,
      color: "#ffe6b8",
      alpha: 0.4,
    });
  };
  for (let i = 0; i < 90; i++) {
    mote();
    motes.step(9 / 90);
  }
  let moteDebt = 0;

  // ── The hammer: an ash haft and an iron head ─────────────────────────────
  const hammer = new THREE.Group();
  {
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, HAFT + 0.16, 10), M.haft);
    haft.position.y = (HAFT - 0.16) / 2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.095, 0.24), M.iron);
    head.position.y = HAFT;
    hammer.add(haft, head);
    outline(haft, w.line);
    outline(head, w.line);
    hammer.position.copy(ON_BARS.pos);
    hammer.quaternion.copy(ON_BARS.quat);
    scene.add(hammer);
  }

  // ── The man ──────────────────────────────────────────────────────────────
  const WAISTCOAT = "#6e5a44";
  const SHIRT = "#c6cfd8"; // a pale blue work shirt
  const cast = { man: null };
  const load = createModelFigure({
    height: 1.78,
    hair: ["HairSimpleParted", "EyebrowsRegular"],
    line: w.line,
    ink: { tone: 0.92, rim: 0.3 },
    outfit: { skin: "#d6a684", top: WAISTCOAT, sleeve: SHIRT, collar: SHIRT, bottom: "#5a5246", shoes: "#2a1d14", hair: "#4a3020", sleeves: "long", belt: "#2a2018" },
    fist: 0.9,
  });
  /**
   * The outfit painter leaves the trapezius band as skin, which from behind
   * reads as bare shoulders: paint it, outside the neck, with the waistcoat.
   */
  const coverShoulders = (fig, top) => {
    let body = null;
    fig.model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
    const geo = body?.geometry;
    if (!geo?.attributes.color) return;
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const H = max.y - min.y;
    const cx = (min.x + max.x) / 2;
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    const c = new THREE.Color(top);
    for (let i = 0; i < pos.count; i++) {
      const ny = (pos.getY(i) - min.y) / H;
      const ax = Math.abs(pos.getX(i) - cx) / H;
      if (ny > 0.82 && ny < 0.88 && ax > 0.045) col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  };
  const boneAt = (fig, name, out = new THREE.Vector3()) => (fig.bones[name] ?? fig.model.getObjectByName(name)).getWorldPosition(out);

  const ready = load.then((man) => {
    if (disposed) return;
    cast.man = man;
    coverShoulders(man, WAISTCOAT);
    scene.add(man.root);
    w.register(man.root);
    // The flat cap, bound to the head at rest: a low crown with a short peak.
    man.apply({});
    man.root.updateMatrixWorld(true);
    const top = boneAt(man, "head");
    const cap = new THREE.Group();
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.124, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.cloth);
    crown.scale.set(1.1, 0.45, 1.22);
    crown.position.z = 0.02;
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.105, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), M.cloth);
    peak.scale.set(1, 1, 0.75);
    peak.position.set(0, 0.004, 0.1);
    cap.add(crown, peak);
    outline(crown, w.line);
    outline(peak, w.line);
    cap.rotation.x = 0.08;
    cap.position.copy(top).add(new THREE.Vector3(0, 0.15, 0.0));
    scene.add(cap);
    (man.bones.head ?? man.model.getObjectByName("head")).attach(cap);
    man.root.rotation.y = Math.PI; // walking up the lane, toward -z

    w.palette(LANE);
    tune();
    w.sync();
    stage.invalidate();
    return cast;
  });

  /** The lane's light: warm low sun, cool sky fill, hazy distance. */
  let keyNow = KEY_BACK;
  const tune = () => {
    w.light(...keyNow);
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.setRGB(0.98, 0.84, 0.64);
      m.uniforms.uShade.value.set(LANE.shade);
      m.uniforms.uFog.value.set(HAZE);
      m.uniforms.uFogRange.value.set(22, 130);
    });
  };
  w.palette(LANE);
  tune();

  // ── Camera, per shot ─────────────────────────────────────────────────────
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = {
    // From beyond the gate, looking back up the lane at him coming.
    lane: { from: v3(-0.9, 1.6, -2.7), to: v3(-0.75, 1.62, -2.3), lookFrom: v3(0.25, 1.05, 5.0), lookTo: v3(0.3, 1.0, 1.4) },
    // Behind him, off his right shoulder: the gate and the lane past it.
    study: { from: v3(1.35, 1.72, 4.7), to: v3(1.2, 1.66, 4.2), lookFrom: v3(-0.2, 0.95, -1.4), lookTo: v3(-0.15, 0.9, -1.6) },
    // The crane: up over his shoulder until the gorge owns the frame.
    reveal: { from: v3(0.95, 2.1, 2.0), to: v3(0.85, 4.7, 2.3), lookFrom: v3(0.15, 1.3, -4), lookTo: v3(0.0, -3.1, -6.6) },
    // Beyond the gate again, closer: the hammer goes against the post.
    after: { from: v3(0.8, 1.48, 3.6), to: v3(0.9, 1.44, 3.2), lookFrom: v3(1.3, 0.9, 0.2), lookTo: v3(1.34, 0.88, 0.15) },
  };
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const fixed = (shot, k) => {
    camPos.lerpVectors(shot.from, shot.to, k);
    camLook.lerpVectors(shot.lookFrom, shot.lookTo, k);
  };
  const BASE_FOV = camera.fov;
  let fitFov = BASE_FOV;
  let lens = 1;
  const setLens = (k) => {
    if (Math.abs(camera.fov - fitFov * k) < 1e-3) return;
    camera.fov = fitFov * k;
    camera.updateProjectionMatrix();
  };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    // Narrow frames widen the lens rather than lose the gate posts.
    fitFov = BASE_FOV * Math.max(1, (1.5 / aspect) ** 0.5);
    setLens(lens);
    motes.resize(stage.size.height, camera.fov, renderer.getPixelRatio());
    w.sync();
  });

  // ── The thought clouds: drawn flat, placed in screen space beside his head ─
  const bubbleMat = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
  const textures = [];
  const thoughts = THOUGHTS.map(([text, from, to, sideOf, rise]) => {
    const [TW, TH] = BUBBLE_TEX;
    const draw = (ctx, W, H) => ctx && drawCloud(ctx, W, H, text);
    const tex = canvasTexture(TW, TH, draw);
    textures.push(tex);
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(TW / TH, 1), bubbleMat(tex));
    cloud.renderOrder = 31;
    cloud.frustumCulled = false;
    cloud.visible = false;
    scene.add(cloud);
    // Once the deck's display face has loaded, draw again in it.
    document.fonts?.ready?.then(() => {
      if (disposed) return;
      draw(tex.image.getContext?.("2d"), TW, TH);
      tex.needsUpdate = true;
      stage.invalidate?.();
    });
    return { cloud, from, to, side: sideOf, rise };
  });
  const dotTex = canvasTexture(128, 128, (ctx, W) => ctx && drawDot(ctx, W));
  textures.push(dotTex);
  const dots = [0.026, 0.038, 0.052].map((r) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bubbleMat(dotTex));
    m.renderOrder = 30;
    m.frustumCulled = false;
    m.visible = false;
    m.userData.r = r; // of the frame height
    scene.add(m);
    return m;
  });
  const headNdc = new THREE.Vector3();
  const atNdc = (obj, x, y, size) => {
    // One unit in front of the lens, through (x, y) on the frame; `size` of the frame height.
    const hv = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    obj.position.set(x * (hv / 2) * camera.aspect, y * (hv / 2), -1).applyMatrix4(camera.matrixWorld);
    obj.quaternion.copy(camera.quaternion);
    obj.scale.setScalar(Math.max(1e-4, size * hv));
  };
  /** Pop the current thought in (trail first, from his head out), float it, pop it out. */
  const updateThoughts = (man, c, t) => {
    camera.updateMatrixWorld();
    boneAt(man, "head", headNdc);
    headNdc.y += 0.1;
    headNdc.project(camera);
    const live = staticMode ? thoughts[2] : thoughts.find((th) => c > th.from - 0.05 && c < th.to + 0.4);
    thoughts.forEach((th) => (th.cloud.visible = false));
    dots.forEach((d) => (d.visible = false));
    if (!live || headNdc.z > 1) return;
    const out = staticMode ? 0 : easeInCubic(segment(c, live.to, live.to + 0.3));
    const pop = (a) => (staticMode ? 1 : easeOutBack(segment(c, a, a + 0.3)) * (1 - out));
    // The cloud's size on the frame, and where it sits: off to one side of his head, a little above it.
    const hN = 2 * BUBBLE_H;
    const wN = (hN * (BUBBLE_TEX[0] / BUBBLE_TEX[1])) / camera.aspect;
    const s = live.side;
    let cx = headNdc.x + s * (0.1 + wN / 2);
    let cy = headNdc.y + live.rise;
    cx = THREE.MathUtils.clamp(cx, -0.97 + wN / 2, 0.97 - wN / 2);
    cy = THREE.MathUtils.clamp(cy, -0.95 + hN / 2, 0.95 - hN / 2);
    // Never over his face: if clamping pushed it onto him, lift it clear.
    if (Math.abs(cx - headNdc.x) < wN / 2 + 0.08 && Math.abs(cy - headNdc.y) < hN / 2 + 0.1) {
      cy = Math.min(0.95 - hN / 2, headNdc.y + hN / 2 + 0.12);
      if (Math.abs(cy - headNdc.y) < hN / 2 + 0.1) cy = Math.max(-0.95 + hN / 2, headNdc.y - hN / 2 - 0.16);
    }
    const bob = staticMode ? 0 : Math.sin(t * 1.6) * 0.008;
    const k = pop(live.from + 0.36);
    live.cloud.visible = k > 0.01;
    atNdc(live.cloud, cx, cy + bob, BUBBLE_H * Math.max(0.001, k));
    // The trail: from just off his head to the cloud's near lower edge.
    const hx = headNdc.x + s * 0.05;
    const hy = headNdc.y + 0.05;
    const ex = cx - Math.sign(cx - headNdc.x || s) * wN * 0.42;
    const ey = THREE.MathUtils.clamp(headNdc.y + 0.04, cy - hN * 0.3, cy + hN * 0.1);
    dots.forEach((d, i) => {
      const f = 0.12 + i * 0.3;
      const kd = pop(live.from + i * 0.12);
      d.visible = kd > 0.01;
      atNdc(d, lerp(hx, ex, f), lerp(hy, ey, f) + bob * f, d.userData.r * Math.max(0.001, kd));
    });
  };

  // ── The frame ────────────────────────────────────────────────────────────
  const dir = new THREE.Vector3();
  const nudge = new THREE.Quaternion();
  const holderQuat = new THREE.Quaternion();
  const UP = new THREE.Vector3(0, 1, 0);
  const dropPos = new THREE.Vector3();
  const dropQuat = new THREE.Quaternion();
  const placedPos = new THREE.Vector3();
  const placedQuat = new THREE.Quaternion();
  const START_Z = 6.6;
  const STOP_Z = 1.05;
  let inHand = false;

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const t = staticMode ? STATIC_TIME : time;

    // Dip to black across the loop point.
    const fade = staticMode ? 1 : Math.min(segment(c, 0, 0.6), 1 - segment(c, CYCLE - 0.6, CYCLE));
    renderer.toneMappingExposure = baseExposure * 0.92 * (0.02 + 0.98 * fade);

    // Camera.
    if (c < 4.2) fixed(SHOTS.lane, easeInOutCubic(segment(c, 0, 4.2)));
    else if (c < 11.6) fixed(SHOTS.study, easeInOutCubic(segment(c, 4.2, 11.6)));
    else if (c < 18.1) fixed(SHOTS.reveal, easeInOutCubic(segment(c, 11.6, 14.0)));
    else fixed(SHOTS.after, easeInOutCubic(segment(c, 18.1, CYCLE)));
    const key = c < 4.2 ? KEY_FRONT : KEY_BACK;
    if (key !== keyNow) {
      keyNow = key;
      w.light(...keyNow);
    }
    // The crane opens the lens as it rises: him below, the gorge filling the frame.
    lens = c >= 11.6 && c < 18.1 ? 1 + 0.3 * easeInOutCubic(segment(c, 11.6, 14.0)) : 1;
    setLens(lens);
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.04;
    camera.position.y += pointer.y * 0.03;
    camera.lookAt(camLook);
    sky.position.copy(camera.position);

    water.uniforms.uTime.value = t;
    moteDebt += dt * 10;
    while (moteDebt >= 1) {
      moteDebt -= 1;
      mote();
    }
    motes.step(dt);

    const { man } = cast;
    if (!man) return;

    // Where he is: up the lane, at the gate, up on it, down, over to the post, back.
    const walkK = segment(c, 0, 4.2);
    const walkZ = lerp(START_Z, STOP_Z, 1 - (1 - walkK) ** 1.15);
    const up1 = easeInOutCubic(segment(c, 10.9, 11.6)) * (1 - easeInOutCubic(segment(c, 17.6, 18.1)));
    const up2 = easeInOutCubic(segment(c, 11.6, 12.2)) * (1 - easeInOutCubic(segment(c, 17.0, 17.6)));
    // Over to the hammer on the bars, across to the post with it, then back to look.
    const approach = easeInOutCubic(segment(c, 18.1, 18.6));
    const across = easeInOutCubic(segment(c, 18.7, 19.3));
    const back = easeInOutCubic(segment(c, 19.55, 20.3));
    let x = 0.3 + 0.36 * approach + 0.68 * across - 0.45 * back;
    let z = c < 4.2 ? walkZ : STOP_Z;
    z = lerp(z, CLIMB_Z, up1);
    z = lerp(z, ON_RAIL_Z, up2);
    z = lerp(z, 0.5, approach) + 0.05 * across + 0.8 * back; // in close to the gate for the hammer
    man.root.position.set(x, 0, z);
    // Stepping back he turns a little toward the post, to look at what he left.
    man.root.rotation.y = Math.PI - 0.7 * back;

    // His body.
    const raise = easeInOutCubic(segment(c, 6.6, 7.5));
    const lower = easeInOutCubic(segment(c, 9.6, 10.4));
    let pose;
    if (c < 4.2) {
      const dist = START_Z - walkZ;
      pose = walkPose((dist / 1.3) * Math.PI * 2, 1 - segment(c, 3.8, 4.2), true);
      pose = blendPose(pose, CARRY, segment(c, 3.8, 4.2));
    } else {
      pose = blendPose(CARRY, RAISE, raise);
      pose = blendPose(pose, LOWER, lower);
      pose = blendPose(pose, REST, easeInOutCubic(segment(c, 10.4, 10.9)));
      pose = blendPose(pose, CLIMB, up1 * (1 - up2));
      pose = blendPose(pose, ON_GATE, up2);
      pose = blendPose(pose, REACH, envelope(c, 18.45, 18.7, 19.3, 19.55));
    }
    // Studying the gate: his eye runs along it, post to post.
    const study = envelope(c, 4.2, 4.6, 6.2, 6.6);
    pose.head[1] += Math.sin((c - 4.2) * 2.6) * 0.38 * study;
    pose.head[0] += 0.1 * study;
    // The pause with the hammer up: a slight cock of the head.
    const doubt = envelope(c, 8.8, 9.1, 9.4, 9.6);
    pose.head[2] += 0.12 * doubt;
    pose.head[0] += 0.08 * doubt;
    // On the gate: he looks down into the gorge, then along the river.
    const over = envelope(c, 12.2, 12.8, 16.6, 17.0);
    pose.head[0] += 0.22 * over;
    pose.neck[0] += 0.12 * over;
    pose.head[1] += Math.sin((c - 12.2) * 0.8) * 0.22 * over;
    // Stepping back to look at it, standing.
    pose.head[0] += 0.05 * back;
    const stepping = Math.max(Math.sin(Math.PI * segment(c, 18.1, 18.6)), Math.sin(Math.PI * segment(c, 18.7, 19.3)) * 0.7, Math.sin(Math.PI * segment(c, 19.55, 20.3)));
    if (stepping > 0) {
      const st = walkPose((approach * 1.2 + across * 1.0 + back * 1.6) * Math.PI, 0.55 * stepping, false);
      for (const j of ["lHip", "rHip", "lKnee", "rKnee"]) pose[j] = st[j];
    }
    pose.spine[0] += Math.sin(t * 1.4) * 0.008;
    man.apply(pose);
    // Feet on the lane, or on the bottom rail once he is up.
    man.groundTo(RAIL_TOP * up2);

    // The hammer: in his fist until he leans it on the bars; later, onto the post.
    const holding = c < 10.4;
    if (holding && !inHand) {
      man.hold(hammer, { hand: "right", grip: "grip", radius: HAFT_R });
      inHand = true;
    } else if (!holding && inHand) {
      man.release("right", { to: scene });
      hammer.getWorldPosition(dropPos);
      hammer.getWorldQuaternion(dropQuat);
      inHand = false;
    }
    if (inHand) {
      // The fist sets the haft's line; nudge it toward the hold, within the grip.
      if (c < 6.6) dir.copy(DIR_CARRY);
      else if (c < 9.6) dir.copy(DIR_CARRY).lerp(DIR_RAISE, raise).normalize();
      else dir.copy(DIR_RAISE).lerp(DIR_LOWER, lower).normalize();
      dir.applyQuaternion(man.root.quaternion);
      man.socket("right").getWorldQuaternion(holderQuat);
      dir.applyQuaternion(holderQuat.invert());
      nudge.setFromUnitVectors(UP, dir);
      hammer.quaternion.identity().slerp(nudge, Math.min(1, MAX_NUDGE / Math.max(1e-4, 2 * Math.acos(Math.min(1, Math.abs(nudge.w))))));
    } else {
      const moved = across;
      placedPos.lerpVectors(ON_BARS.pos, ON_POST.pos, moved);
      placedPos.y += 0.25 * Math.sin(Math.PI * moved); // lifted across
      placedQuat.slerpQuaternions(ON_BARS.quat, ON_POST.quat, moved);
      // Carried across in his fist: the grip rides to his hand and back down.
      const carried = smooth(0, 0.2, moved) * (1 - smooth(0.8, 1, moved));
      if (carried > 0) placedPos.lerp(man.socket("right").getWorldPosition(dropPos), carried);
      const set = staticMode ? 1 : easeInOutCubic(segment(c, 10.4, 10.8));
      if (c < 10.8 && !staticMode) {
        hammer.position.lerpVectors(dropPos, ON_BARS.pos, set);
        hammer.quaternion.slerpQuaternions(dropQuat, ON_BARS.quat, set);
      } else {
        hammer.position.copy(placedPos);
        hammer.quaternion.copy(placedQuat);
      }
    }
    // Hands: the left joins the haft for the raise and the lowering; both take
    // the top rail to climb and stay on it; the right closes to carry it across.
    const twoHands = raise * (1 - easeInOutCubic(segment(c, 10.3, 10.6)));
    if (!inHand) man.setHand("right", "grip", Math.max(up1, envelope(c, 18.55, 18.7, 19.3, 19.45)), { radius: HAFT_R });
    man.setHand("left", "grip", Math.max(twoHands, up1), { radius: up1 > twoHands ? RAIL_R : HAFT_R });

    updateThoughts(man, c, t);
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = baseExposure;
      if (bloom) Object.assign(bloom, baseBloom);
      textures.forEach((tx) => tx.dispose());
    },
  };
};
