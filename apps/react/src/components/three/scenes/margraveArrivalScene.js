import * as THREE from "three";
import { createInkWorld } from "../rezeKit";
import { canvasTexture, createParticles, easeInOutCubic, hash, lerp, segment, softDot } from "../kit";
import { outline } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createCaption } from "../sfx";

/**
 * Read the scene before you touch it — the opening of Killing Floor. On a
 * whim Reacher asks the Greyhound driver to let him off at the Margrave exit,
 * then walks the fourteen miles of county road into town in the rain, with no
 * bag. He arrives knowing nobody and reads the place before he says a word.
 *
 *   0    – 2.4   a grey wet morning, flat farmland and pines. The coach sits
 *                on the shoulder; the door folds open and he steps down
 *   2.4  – 4.6   behind him: the door closes and the coach pulls away, its
 *                taillights going small in the rain. He watches it go
 *   4.6  – 8.0   he walks. The camera tracks beside him, then swings behind;
 *                the green sign on the shoulder: MARGRAVE 14
 *   8.0  – 8.95  dip to black: the fourteen miles
 *   8.95 – 10.6  the edge of town, over his shoulder as he stops on the
 *                gravel and looks down the street
 *   10.6 – 14.9  a slow pan, as if reading it: the gas station, the
 *                barbershop, the diner sign glowing through the rain. No
 *                police yet: they come for him later, at the diner
 *   14.9 – 15.5  dip to black; reset
 *
 * Captions give the why: Joe once said Blind Blake died in Margrave, so he
 * asked the driver to stop. Reduced motion holds 10.3 (no caption): over his
 * shoulder, the street ahead.
 * Reacher is the same Quaternius CC0 rig and painted outfit as the 110th
 * scene (canvas jacket over a charcoal tee, jeans, boots); everything else is
 * built here.
 */

const CYCLE = 15.5;
const STATIC_TIME = 10.3;
const CUT = 8.45; // road to town

// Overcast: soft top light, grey air, nothing brighter than a wet sky.
const OVERCAST = { ground: "#3a3f45", lines: "#c3cad0", accent: "#7a5a40", rim: "#b9c3cc", shade: "#93a0ae" };
const KEY = [0.3, 0.8, 0.55];
const AIR = "#a1a9af";
const JACKET = "#3a2f25";

// The coach on the shoulder, facing down the road (-z). Its door is on the
// right (+x) just behind the windscreen.
const BUS_X = 3.4;
const BUS_HALF = 1.3;
const DOOR_Z = [-5.65, -4.6];
const STEP_Y = 0.36;
const START = new THREE.Vector3(BUS_X + 1.05, STEP_Y, -5.13);
const KERB = new THREE.Vector3(5.35, 0, -5.13);
const DEPART = 2.7;

// The walk.
const SPEED = 1.45; // m/s: a big man's easy pace
const STRIDE = 1.6; // metres per full gait cycle
const WALK_AT = 4.4;
const RAMP = 0.5;
// Town: he walks the last few steps onto the gravel and stops.
const TOWN_STOP = new THREE.Vector3(4.3, 0, 0);
const TOWN_CRUISE = 9.05;
const TOWN_HALT = 9.95;
const TOWN_DIST = SPEED * (TOWN_CRUISE - CUT) + (SPEED * (TOWN_HALT - TOWN_CRUISE)) / 2;

// ── Poses ──────────────────────────────────────────────────────────────────
/** The 110th scene's walk at gait phase `phi`; `amp` scales it down to a stop. */
const walkPose = (phi, g, amp) => {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const A = g.stride * amp;
  const knee = (ph) => {
    const u = ((((ph - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / Math.PI;
    if (u < 1) return 0.07 + g.knee * amp * Math.sin(Math.PI * u ** 0.7);
    return 0.07 + 0.16 * amp * Math.sin(Math.PI * Math.min(1, (u - 1) / 0.45));
  };
  const as = Math.sin(phi - 0.25) * amp;
  return {
    hips: [0.03, 0.07 * s * amp, 0.04 * g.roll * c * amp],
    spine: [g.lean, 0, -0.02 * g.roll * c * amp],
    chest: [0.0, -0.13 * s * amp, 0],
    neck: [0, 0.03 * s * amp, 0],
    head: [-0.02 - g.lean * 0.6, 0.03 * s * amp, -0.02 * g.roll * c * amp],
    lShoulder: [-g.arm * as + 0.03, 0, g.armOut],
    lElbow: [-(0.14 + 0.22 * Math.max(0, as)), 0, 0],
    rShoulder: [g.arm * as + 0.03, 0, -g.armOut],
    rElbow: [-(0.14 + 0.22 * Math.max(0, -as)), 0, 0],
    lHip: [A * s - 0.04, 0, 0.025],
    rHip: [-A * s - 0.04, 0, -0.025],
    lKnee: [knee(phi), 0, 0],
    rKnee: [knee(phi + Math.PI), 0, 0],
    lift: -(g.bob * s * s + 0.01) * amp,
  };
};
const STRIDE_ANGLE = 1.5 / (4 * 0.5 * 2.0);
const GAIT = { arm: 0.3, armOut: 0.09, roll: 0.6, lean: 0.035, knee: 0.9, stride: STRIDE_ANGLE, bob: 0.55 * 0.925 * (1 - Math.cos(STRIDE_ANGLE)) };
const STAND = {
  spine: [-0.02, 0, 0],
  chest: [-0.03, 0, 0],
  neck: [0.02, 0, 0],
  head: [0.03, 0, 0],
  lShoulder: [0.03, 0, 0.2],
  lElbow: [-0.2, 0, 0],
  rShoulder: [0.03, 0, -0.2],
  rElbow: [-0.2, 0, 0],
  lHip: [0, 0, 0.08],
  lKnee: [0.03, 0, 0],
  rHip: [0, 0, -0.08],
  rKnee: [0.03, 0, 0],
  lift: -0.01,
};

/** Up, hold, down: an envelope in [0, 1]. */
const envelope = (c, a, b, d, e) => easeInOutCubic(segment(c, a, b)) * (1 - easeInOutCubic(segment(c, d, e)));

/** Distance walked `u` seconds after setting off, easing up to SPEED over RAMP. */
const walked = (u) => (u <= 0 ? 0 : u < RAMP ? (SPEED * u * u) / (2 * RAMP) : SPEED * (u - RAMP / 2));

// ── Figure helpers (as the 110th scene) ────────────────────────────────────
const bodyMesh = (fig) => {
  let body = null;
  fig.model.traverse((m) => {
    if (!m.isSkinnedMesh) return;
    if (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) body = m;
  });
  return body;
};
/** Half-width and half-depth of the bind-pose body in a height band (fractions of height), in metres. */
const girth = (fig, height, lo, hi, maxAx) => {
  const g = bodyMesh(fig).geometry;
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const p = g.attributes.position;
  let rx = 0;
  let rz = 0;
  for (let i = 0; i < p.count; i++) {
    const ny = (p.getY(i) - min.y) / H;
    if (ny < lo || ny > hi) continue;
    const ax = Math.abs(p.getX(i) - cx) / H;
    if (ax > maxAx) continue;
    rx = Math.max(rx, ax);
    rz = Math.max(rz, Math.abs(p.getZ(i) - cz) / H);
  }
  return { rx: (rx || 0.1) * height, rz: (rz || 0.07) * height };
};
/** The jacket's skirt: two open panels from the waist that swing with the legs. */
const addJacket = (fig, height, mat, line) => {
  const top = 0.62;
  const bottom = 0.47;
  const gap = 0.6;
  const waist = girth(fig, height, top - 0.02, top + 0.02, 0.15);
  const hip = girth(fig, height, 0.46, 0.54, 0.2);
  const rTop = waist.rx * 1.12;
  const hipR = hip.rx * 1.1;
  const f = (top - 0.5) / (top - bottom);
  const rBot = Math.max(rTop + (hipR - rTop) / Math.max(0.2, f), hipR) + height * 0.012;
  const depth = Math.max(waist.rz / waist.rx, hip.rz / hip.rx) * 1.06;
  const len = (top - bottom) * height;
  const pivot = new THREE.Group();
  pivot.position.set(0, top * height, 0);
  fig.bones.hips.attach(pivot);
  const [left, right] = [1, -1].map((side) => {
    const swing = new THREE.Group();
    pivot.add(swing);
    const start = side > 0 ? gap : Math.PI;
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20, 2, true, start, Math.PI - gap);
    geo.translate(0, -len / 2, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.z = depth;
    mesh.frustumCulled = false;
    outline(mesh, line);
    swing.add(mesh);
    return swing;
  });
  return { left, right };
};
/** A stand collar on the shoulders, open at the front. */
const addCollar = (fig, height, mat, line) => {
  const neck = girth(fig, height, 0.835, 0.855, 0.07);
  const r = Math.max(neck.rx, neck.rz);
  const geo = new THREE.CylinderGeometry(r * 1.75, r * 1.45, height * 0.05, 22, 1, true, 0.75, Math.PI * 2 - 1.5);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, height * 0.838, -r * 0.15);
  mesh.rotation.x = -0.12;
  mesh.frustumCulled = false;
  outline(mesh, line);
  (fig.bones.chest ?? fig.bones.spine).attach(mesh);
};
/** Paint the trapezius band the outfit painter leaves as skin (reads as bare shoulders from behind). */
const coverShoulders = (fig, top) => {
  const geo = bodyMesh(fig)?.geometry;
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

/** Rain as short grey streaks in a box that wraps around the camera, fixed in the world. */
const createRain = (count) => {
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const r = [hash(i * 1.13), hash(i * 2.71 + 4), hash(i * 3.97 + 9)];
    const s = hash(i * 5.3 + 1);
    for (let k = 0; k < 2; k++) {
      pos.set(r, (i * 2 + k) * 3);
      end[i * 2 + k] = k;
      seed[i * 2 + k] = s;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uSize: { value: new THREE.Vector3(30, 9, 30) } },
    vertexShader: /* glsl */ `
      attribute float aEnd;
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uCenter, uSize;
      varying float vA;
      void main() {
        vec2 lo = uCenter.xz - uSize.xz * 0.5;
        vec3 p;
        p.x = lo.x + mod(position.x * uSize.x - lo.x, uSize.x);
        p.z = lo.y + mod(position.z * uSize.z - lo.y, uSize.z);
        float fall = uTime * 8.0 * (0.85 + 0.3 * aSeed);
        p.y = mod(position.y * uSize.y - fall, uSize.y);
        p.x += (uSize.y - p.y) * 0.08;
        p -= normalize(vec3(0.08, -1.0, 0.02)) * (0.3 + 0.18 * aSeed) * aEnd;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        vA = 0.3 * (1.0 - smoothstep(9.0, 15.0, depth)) * smoothstep(0.6, 1.8, depth) * (1.0 - aEnd * 0.85);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        gl_FragColor = vec4(vec3(0.74, 0.78, 0.82), clamp(vA, 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 15;
  return lines;
};

/** A road sign face, drawn on canvas. */
const signTexture = (w, h, draw) => canvasTexture(w, h, draw);

export const createMargraveArrivalScene = (stage, { overlay } = {}) => {
  // Why he got off: Joe once told him Blind Blake died in Margrave.
  const caption = createCaption(overlay, { x: 4, y: 7 });
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  renderer.toneMappingExposure = baseExposure * 0.92;
  // Overcast wants almost no glow: only the taillights and the diner sign come near it.
  const bloom = stage.bloomPass;
  const baseBloom = bloom ? { strength: bloom.strength, threshold: bloom.threshold } : null;
  if (bloom) Object.assign(bloom, { strength: 0.3, threshold: 0.92 });
  let disposed = false;
  const textures = [];

  const roadSet = new THREE.Group();
  const townSet = new THREE.Group();
  scene.add(roadSet, townSet);

  const add = (mesh, parent = scene, line = false) => {
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  const slab = (x0, x1, y0, y1, z0, z1, mat, parent = scene, line = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return add(m, parent, line);
  };
  const cyl = (r0, r1, h, mat, x, y, z, seg = 16, parent = scene, line = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
    m.position.set(x, y, z);
    return add(m, parent, line);
  };
  const flatPlane = (wd, d, mat, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    return add(m, parent);
  };
  const basic = (color, intensity = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), ...o });
  const additive = (color, opacity = 1, map = null) =>
    new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const dot = softDot();
  textures.push(dot);

  // ── Materials ────────────────────────────────────────────────────────────
  const M = {
    // Wet asphalt: dark, a strong grazing rim so the far road shines with the sky.
    asphalt: w.ink({ tint: "#4a4d52", tone: 0.5, rim: 1.25, spec: 1 }),
    stripe: w.ink({ tint: "#d9b13c", tone: 0.85, rim: 0.6, spec: 0.6 }),
    edge: w.ink({ tint: "#dedfdc", tone: 0.85, rim: 0.6, spec: 0.6 }),
    gravel: w.ink({ tint: "#77736b", tone: 0.7, rim: 0.4 }),
    verge: w.ink({ tint: "#4f5b38", tone: 0.62, rim: 0.2 }),
    fieldA: w.ink({ tint: "#5b5d3f", tone: 0.62, rim: 0.15 }),
    fieldB: w.ink({ tint: "#4c5a35", tone: 0.6, rim: 0.15 }),
    furrow: w.ink({ tint: "#3d3a2c", tone: 0.5, rim: 0.1 }),
    pine: w.ink({ tint: "#2c3b2c", tone: 0.55, rim: 0.15 }),
    pineFar: w.ink({ tint: "#3a4a3a", tone: 0.6, rim: 0.1 }),
    bark: w.ink({ tint: "#4a3a2c", tone: 0.55, rim: 0.2 }),
    pole: w.ink({ tint: "#5e5246", tone: 0.55, rim: 0.3 }),
    post: w.ink({ tint: "#8a8e92", tone: 0.8, rim: 0.4, spec: 0.6 }),
    signBack: w.ink({ tint: "#9aa0a5", tone: 0.8, rim: 0.4, spec: 0.5 }),
    barn: w.ink({ tint: "#7a3a2c", tone: 0.65, rim: 0.2 }),
    roofTin: w.ink({ tint: "#8d9196", tone: 0.75, rim: 0.3, spec: 0.6 }),
    // The coach: brushed silver, a blue band, tinted glass.
    silver: w.ink({ tint: "#c3c8ce", tone: 0.95, rim: 0.5, spec: 1 }),
    blue: w.ink({ tint: "#2f4f86", tone: 0.7, rim: 0.4, spec: 0.8 }),
    tint: w.ink({ tint: "#1d242c", tone: 0.5, rim: 0.6, spec: 1 }),
    cabin: w.ink({ tint: "#23262a", tone: 0.35, rim: 0.1 }),
    rubber: w.ink({ tint: "#141414", tone: 0.35, rim: 0.2 }),
    hub: w.ink({ tint: "#b6babf", tone: 0.9, rim: 0.4, spec: 1 }),
    tread: w.ink({ tint: "#55585c", tone: 0.55, rim: 0.2 }),
    // Town.
    brick: w.ink({ tint: "#8a4433", tone: 0.7, rim: 0.2 }),
    tan: w.ink({ tint: "#b8925f", tone: 0.75, rim: 0.2 }),
    stucco: w.ink({ tint: "#cbbf9f", tone: 0.78, rim: 0.2 }),
    trim: w.ink({ tint: "#e6e1d4", tone: 0.85, rim: 0.3 }),
    kick: w.ink({ tint: "#4a3f36", tone: 0.55, rim: 0.2 }),
    signBand: w.ink({ tint: "#2d3a4a", tone: 0.55, rim: 0.3 }),
    stripeCanvas: w.ink({ tint: "#ece6d8", tone: 0.85, rim: 0.2 }),
    windowLit: w.ink({ tint: "#6e5a40", tone: 0.7, rim: 0.4, spec: 1 }),
    green: w.ink({ tint: "#3f6450", tone: 0.65, rim: 0.2 }),
    window: w.ink({ tint: "#2a3038", tone: 0.5, rim: 0.5, spec: 1 }),
    awningRed: w.ink({ tint: "#93322b", tone: 0.7, rim: 0.3 }),
    awningGreen: w.ink({ tint: "#2f5a45", tone: 0.65, rim: 0.3 }),
    concrete: w.ink({ tint: "#a9a59c", tone: 0.78, rim: 0.4, spec: 0.4 }),
    canopy: w.ink({ tint: "#e2e3e0", tone: 0.88, rim: 0.3 }),
    canopyBand: w.ink({ tint: "#a2302a", tone: 0.7, rim: 0.3 }),
    pump: w.ink({ tint: "#d9d6cf", tone: 0.85, rim: 0.4, spec: 0.6 }),
    steel: w.ink({ tint: "#bcc2c8", tone: 1.0, rim: 0.6, spec: 1 }),
    steelDark: w.ink({ tint: "#8a9096", tone: 0.8, rim: 0.5, spec: 1 }),
    dinerRed: w.ink({ tint: "#8f2228", tone: 0.7, rim: 0.4, spec: 0.6 }),
    tank: w.ink({ tint: "#c9cbc8", tone: 0.85, rim: 0.3, spec: 0.5 }),
    black: w.ink({ tint: "#16181c", tone: 0.6, rim: 0.6, spec: 1 }),
    chrome: w.ink({ tint: "#c9cdd2", tone: 1.0, rim: 0.6, spec: 1 }),
  };
  // Standing water: the sky lying in the low spots of the road.
  const puddleMat = new THREE.MeshBasicMaterial({ color: "#8e979f", map: dot, transparent: true, opacity: 0.22, depthWrite: false });

  let sky = null;
  let barberPole = null;
  // ── The sky: a low grey ceiling, lighter at the horizon ──────────────────
  {
    const tex = canvasTexture(8, 256, (ctx, wd, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#6c757d");
      g.addColorStop(0.38, "#8d959c");
      g.addColorStop(0.5, "#a7aeb3");
      g.addColorStop(0.56, "#9aa1a6");
      g.addColorStop(1, "#7d8388");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, wd, h);
    });
    textures.push(tex);
    sky = new THREE.Mesh(
      new THREE.SphereGeometry(180, 32, 16),
      new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.9, 0.9, 0.9), side: THREE.BackSide, depthWrite: false, fog: false }),
    );
    sky.renderOrder = -10;
    scene.add(sky);
  }

  // ── Shared ground: wet fields to the horizon ─────────────────────────────
  flatPlane(900, 900, M.fieldA, -455, -0.02, 0);
  flatPlane(900, 900, M.fieldB, 455, -0.02, 0);
  // Pines: dark tree lines across the fields, both sides, out to the haze.
  const pines = [];
  for (let i = 0; i < 220; i++) {
    const side = i % 2 ? 1 : -1;
    const band = hash(i * 3.1);
    const x = side * (22 + band * 70 + hash(i * 7.7) * 10);
    const z = 30 - hash(i * 1.9) * 260;
    pines.push([x, z, 0.75 + hash(i * 5.3) * 0.6, band > 0.5]);
  }
  // A closer stand of them at the road's edge on the left, beyond the poles.
  for (let i = 0; i < 26; i++) pines.push([-12 - hash(i * 2.3) * 7, -18 - i * 6.5 - hash(i) * 3, 0.8 + hash(i * 4.1) * 0.5, false]);
  {
    const trunk = new THREE.CylinderGeometry(0.16, 0.24, 1, 7);
    trunk.translate(0, 0.5, 0);
    const cone = new THREE.ConeGeometry(1, 1, 9);
    cone.translate(0, 0.5, 0);
    const near = pines.filter((p) => !p[3]);
    const far = pines.filter((p) => p[3]);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const plant = (list, mat) => {
      const trunks = new THREE.InstancedMesh(trunk, M.bark, list.length);
      const cones = new THREE.InstancedMesh(cone, mat, list.length * 3);
      list.forEach(([x, z, s], i) => {
        const h = 11 * s;
        trunks.setMatrixAt(i, m4.compose(v.set(x, 0, z), q, sc.set(s, h * 0.45, s)));
        for (let k = 0; k < 3; k++) {
          const r = (2.6 - k * 0.65) * s;
          cones.setMatrixAt(i * 3 + k, m4.compose(v.set(x, h * (0.3 + k * 0.2), z), q, sc.set(r, h * (0.42 - k * 0.04), r)));
        }
      });
      add(trunks);
      add(cones);
    };
    plant(near, M.pine);
    plant(far, M.pineFar);
  }

  // ── The county road ──────────────────────────────────────────────────────
  // Two lanes either side of x = 0, gravel shoulders, grass verges.
  {
    const R = roadSet;
    flatPlane(6.8, 420, M.asphalt, 0, 0.0, -170, R);
    flatPlane(2.6, 420, M.gravel, 4.7, -0.004, -170, R);
    flatPlane(2.6, 420, M.gravel, -4.7, -0.004, -170, R);
    flatPlane(5, 420, M.verge, 8.4, -0.01, -170, R);
    flatPlane(5, 420, M.verge, -8.4, -0.01, -170, R);
    for (const x of [-3.3, 3.3]) slab(x - 0.06, x + 0.06, 0, 0.004, -380, 40, M.edge, R);
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.004, 3), M.stripe, 70);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) dashes.setMatrixAt(i, m4.makeTranslation(0, 0.002, 38 - i * 6));
    add(dashes, R);
    // Puddles: in the ruts and on the shoulder.
    for (let i = 0; i < 26; i++) {
      const p = flatPlane(1.2 + hash(i * 3.3) * 2.4, 0.6 + hash(i * 1.1) * 1.2, puddleMat, (hash(i * 7.9) - 0.5) * 9.4, 0.006, 8 - i * 4.2 - hash(i) * 2, R);
      p.rotation.z = (hash(i * 2.2) - 0.5) * 0.5;
    }
    // Furrows in the field on the right, running out to the trees.
    const furrows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.02, 300), M.furrow, 30);
    for (let i = 0; i < 30; i++) furrows.setMatrixAt(i, m4.makeTranslation(13 + i * 1.6, 0, -120));
    add(furrows, R);
    // A wire fence along the right-hand field.
    const fence = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.06, 1.25, 6), M.pole, 60);
    for (let i = 0; i < 60; i++) fence.setMatrixAt(i, m4.makeTranslation(10.6, 0.62, 12 - i * 3));
    add(fence, R);
    const wire = new THREE.LineBasicMaterial({ color: "#3a3632" });
    for (const y of [0.7, 1.1]) add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(10.6, y, 12), new THREE.Vector3(10.6, y, -165)]), wire), R);
    // Telephone poles down the left side, the line sagging between them.
    const poleZ = [];
    for (let z = 30; z > -330; z -= 42) poleZ.push(z);
    poleZ.forEach((z) => {
      cyl(0.11, 0.15, 8.5, M.pole, -7.4, 4.25, z, 8, R);
      slab(-8.4, -6.4, 7.7, 7.84, z - 0.07, z + 0.07, M.pole, R);
    });
    for (const dx of [-0.8, 0.8]) {
      const pts = [];
      for (let z = 30; z >= -300; z -= 1.5) {
        const local = (((30 - z) % 42) + 42) % 42;
        pts.push(new THREE.Vector3(-7.4 + dx, 7.9 - Math.sin((local / 42) * Math.PI) * 0.7, z));
      }
      add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire), R);
    }
    // A farm off to the left: a barn and a tin-roofed shed.
    slab(-58, -46, 0, 6, -78, -64, M.barn, R, true);
    const barnRoof = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 14, 3, 1, false, 0, Math.PI * 2), M.roofTin);
    barnRoof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    barnRoof.scale.set(0.45, 1, 1);
    barnRoof.position.set(-52, 7.5, -71);
    add(barnRoof, R);
    slab(-44, -36, 0, 3.2, -84, -76, M.roofTin, R, true);

    // The green sign on the right shoulder: MARGRAVE 14.
    const tex = signTexture(768, 256, (ctx, wd, h) => {
      ctx.fillStyle = "#1d6b3f";
      ctx.fillRect(0, 0, wd, h);
      ctx.strokeStyle = "#f2f2ec";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(14, 14, wd - 28, h - 28, 22);
      ctx.stroke();
      ctx.fillStyle = "#f2f2ec";
      ctx.textBaseline = "middle";
      // Fit the name and the mileage inside the border with room to spare.
      const room = wd - 2 * 56 - 70;
      let size = 96;
      const measure = () => {
        ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
        return (ctx.measureText?.("MARGRAVE")?.width ?? 0) + (ctx.measureText?.("14")?.width ?? 0);
      };
      while (size > 40 && measure() > room) size -= 4;
      ctx.textAlign = "left";
      ctx.fillText("MARGRAVE", 56, h / 2 + 4);
      ctx.textAlign = "right";
      ctx.fillText("14", wd - 56, h / 2 + 4);
    });
    textures.push(tex);
    const SX = 7.6;
    const SZ = -14.5;
    // Every camera that sees the sign stands on the near side of it (z > SZ), so
    // the face goes frontmost at SZ, the metal backing sits just behind it and
    // shows only as a 4 cm border, and the posts stand behind the backing with
    // their tops under its top edge: nothing can come between the eye and the
    // lettering.
    for (const dx of [-1.1, 1.1]) cyl(0.05, 0.05, 3.0, M.post, SX + dx, 1.5, SZ - 0.13, 8, R);
    slab(SX - 1.84, SX + 1.84, 1.86, 3.14, SZ - 0.07, SZ - 0.025, M.signBack, R, true);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.62, 0.64, 0.66) }));
    face.position.set(SX, 2.5, SZ);
    add(face, R);
  }

  // ── The coach ────────────────────────────────────────────────────────────
  const bus = (() => {
    const g = new THREE.Group();
    const L = 6.1;
    const B = BUS_HALF;
    const part = (m, line = true) => add(m, g, line);
    const box = (x0, x1, y0, y1, z0, z1, mat, line = true) => slab(x0, x1, y0, y1, z0, z1, mat, g, line);
    // The body behind the door: silver, the blue band, a long tinted window band.
    box(-B, B, 0.42, 3.42, DOOR_Z[1], L, M.silver);
    for (const s of [1, -1]) {
      const x = s * (B + 0.006);
      box(x - 0.006, x + 0.006, 1.78, 2.92, DOOR_Z[1] + 0.25, L - 0.35, M.tint, false);
      box(x - 0.008, x + 0.008, 1.28, 1.54, s > 0 ? DOOR_Z[1] : -L, L - 0.2, M.blue, false);
      box(x - 0.008, x + 0.008, 1.6, 1.64, s > 0 ? DOOR_Z[1] : -L, L - 0.2, M.blue, false);
      // Window pillars.
      for (let z = DOOR_Z[1] + 1.4; z < L - 0.4; z += 1.55) box(x - 0.01, x + 0.01, 1.78, 2.92, z - 0.05, z + 0.05, M.silver, false);
      // The baggage bays: panel seams low on the side.
      for (const z of [-1.6, 0.6, 2.8]) box(x - 0.009, x + 0.009, 0.5, 1.2, z - 0.01, z + 0.01, M.steelDark, false);
    }
    // The cab ahead of it: driver's-side wall, floor and steps, roof, a hollow
    // you see into when the door opens.
    box(-B, -B + 0.08, 0.42, 3.42, -L, DOOR_Z[1], M.silver);
    box(-B, B, 3.34, 3.42, -L, DOOR_Z[1], M.silver);
    box(-B + 0.08, B, 0.3, 0.42, -L + 0.1, DOOR_Z[1], M.cabin, false);
    box(-B + 0.08, B - 0.02, 0.42, 3.34, DOOR_Z[1] - 0.02, DOOR_Z[1], M.cabin, false);
    box(B - 0.55, B, STEP_Y - 0.04, STEP_Y, DOOR_Z[0], DOOR_Z[1], M.tread, false);
    box(B - 1.0, B - 0.55, 0.68, 0.72, DOOR_Z[0], DOOR_Z[1], M.tread, false);
    box(-B + 0.08, B - 1.0, 0.68, 0.72, -L + 0.1, DOOR_Z[1], M.cabin, false);
    // Right side: the pillar ahead of the door, the panel over it.
    box(B - 0.08, B, 0.42, 3.42, -L, DOOR_Z[0], M.silver);
    box(B - 0.08, B, 2.78, 3.42, DOOR_Z[0], DOOR_Z[1], M.silver);
    box(B - 0.04, B + 0.008, 1.28, 1.54, -L, DOOR_Z[0], M.blue, false);
    // The front: bumper, the windscreen, the dark destination glass over it.
    box(-B, B, 0.42, 1.32, -L - 0.08, -L, M.silver);
    box(-B - 0.02, B + 0.02, 0.36, 0.62, -L - 0.2, -L - 0.06, M.rubber);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(2 * B - 0.06, 1.72, 0.05), M.tint);
    screen.position.set(0, 2.2, -L - 0.02);
    screen.rotation.x = -0.06;
    part(screen);
    box(-B, B, 3.08, 3.42, -L - 0.05, -L + 0.05, M.silver);
    box(-B + 0.2, B - 0.2, 3.13, 3.33, -L - 0.07, -L - 0.05, M.cabin, false);
    box(-B, B, 3.42, 3.48, -L + 0.1, L - 0.1, M.silver, false);
    for (const s of [1, -1]) {
      // Lamps: headlights low on the nose, the long red clusters at the back.
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), basic("#f3efe2", 0.82));
      head.position.set(s * (B - 0.35), 0.82, -L - 0.09);
      g.add(head);
      // Mirrors on arms ahead of the windscreen.
      box(s * B, s * (B + 0.35), 2.9, 2.94, -L - 0.05, -L + 0.0, M.rubber, false);
      box(s * (B + 0.3) - 0.06, s * (B + 0.3) + 0.06, 2.4, 2.92, -L - 0.42, -L - 0.32, M.rubber);
    }
    // The back: engine grille, a band of glass, the tail lamps.
    box(-B + 0.25, B - 0.25, 0.7, 1.25, L, L + 0.02, M.steelDark, false);
    box(-B + 0.15, B - 0.15, 2.0, 2.9, L, L + 0.02, M.tint, false);
    const tails = [];
    const glows = [];
    const streaks = [];
    const tailMat = basic("#ff2a1a", 1);
    for (const s of [1, -1]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.03), tailMat);
      tail.position.set(s * (B - 0.12), 1.2, L + 0.02);
      g.add(tail);
      tails.push(tail);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: "#ff3a22", transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.position.set(s * (B - 0.12), 1.2, L + 0.12);
      glow.scale.set(1.0, 1.4, 1);
      g.add(glow);
      glows.push(glow);
      // The lamps' long red smear on the wet road behind it.
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5), additive("#ff3a22", 0.14, dot));
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(s * (B - 0.12), 0.012, L + 2.6);
      g.add(streak);
      streaks.push(streak);
    }
    // Wheels: front axle behind the door, a tandem at the back.
    const wheels = [];
    for (const z of [-3.6, 3.3, 4.55]) {
      for (const s of [1, -1]) {
        const wheel = new THREE.Group();
        wheel.position.set(s * (B - 0.15), 0.5, z);
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 20), M.rubber);
        tire.rotation.z = Math.PI / 2;
        wheel.add(tire);
        outline(tire, w.line);
        const hub = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), M.hub);
        hub.position.x = s * 0.175;
        hub.rotation.y = (s * Math.PI) / 2;
        wheel.add(hub);
        g.add(wheel);
        wheels.push(wheel);
        // The arch over it.
        const arch = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20, 0, Math.PI), M.cabin);
        arch.position.set(s * (B + 0.01), 0.5, z);
        arch.rotation.y = (s * Math.PI) / 2;
        g.add(arch);
      }
    }
    // The folding door: two glass leaves hinged at the jambs, folding inward.
    const leaves = [DOOR_Z[0], DOOR_Z[1]].map((hz, i) => {
      const hinge = new THREE.Group();
      hinge.position.set(B - 0.02, 0, hz);
      const span = (DOOR_Z[1] - DOOR_Z[0]) / 2;
      const d = i === 0 ? span : -span;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.36, span - 0.01), M.silver);
      frame.position.set(0, 0.4 + 1.18, d / 2);
      hinge.add(frame);
      outline(frame, w.line);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.046, 2.1, span - 0.09), M.tint);
      pane.position.set(0, 1.62, d / 2);
      hinge.add(pane);
      g.add(hinge);
      return { hinge, sign: i === 0 ? -1 : 1 };
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 13.6), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: 0.55, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    g.add(shadow);
    roadSet.add(g);
    return { group: g, leaves, wheels, tailMat, glows, streaks };
  })();

  // ── Margrave: the edge of town ───────────────────────────────────────────
  // Main street runs on down the county road (-z). He stops on the gravel on
  // the right at z = 0, where the sidewalk starts.
  {
    const T = townSet;
    flatPlane(7, 200, M.asphalt, 0, 0, -80, T);
    flatPlane(2.6, 40, M.gravel, 4.8, -0.004, 12, T);
    flatPlane(2.6, 40, M.gravel, -4.8, -0.004, 12, T);
    for (const x of [-3.4, 3.4]) slab(x - 0.06, x + 0.06, 0, 0.004, -180, 30, M.edge, T);
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.004, 3), M.stripe, 36);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 36; i++) dashes.setMatrixAt(i, m4.makeTranslation(0, 0.002, 28 - i * 6));
    add(dashes, T);
    // Kerbs and sidewalks from the town line on.
    for (const s of [1, -1]) {
      slab(s * 3.5, s * 7.6, 0, 0.14, -180, -2, M.concrete, T);
      slab(s * 3.5 - 0.06, s * 3.5 + 0.06, 0, 0.16, -180, -2, M.concrete, T, true);
    }
    for (let i = 0; i < 16; i++) {
      const p = flatPlane(1 + hash(i * 3.7) * 2.2, 0.5 + hash(i * 1.3) * 1, puddleMat, (hash(i * 6.1) - 0.5) * 6, 0.006, 6 - i * 4 - hash(i * 2) * 2, T);
      p.rotation.z = (hash(i * 4.2) - 0.5) * 0.6;
    }

    /**
     * A low storefront: walls and parapet, a framed shop window with mullions
     * and a kick plate, a door, a sign band, upstairs windows on the taller
     * ones, maybe a striped awning. `lit` warms the glass a little.
     */
    const storefront = (side, z0, z1, h, wall, awning, lit = false) => {
      const x0 = side * 7.6;
      const x1 = side * 15;
      slab(Math.min(x0, x1), Math.max(x0, x1), 0, h, z1, z0, wall, T, true);
      slab(Math.min(x0, x1) - 0.1, Math.max(x0, x1) + 0.1, h, h + 0.35, z1 - 0.1, z0 + 0.1, wall, T);
      slab(x0 - side * 0.12, x0, h + 0.3, h + 0.4, z1 - 0.1, z0 + 0.1, M.trim, T); // coping
      const at = (d) => x0 - side * d; // d metres out from the wall toward the street
      const face = (d0, d1, y0, y1, za, zb, mat, line = false) => slab(Math.min(at(d0), at(d1)), Math.max(at(d0), at(d1)), y0, y1, Math.min(za, zb), Math.max(za, zb), mat, T, line);
      const wa = z1 + 0.5;
      const wb = z0 - 1.7;
      // Shop window: trim frame, glass, mullions, a kick plate under it.
      face(0, 0.06, 0.5, 2.55, wa - 0.08, wb + 0.08, M.trim);
      face(0.06, 0.08, 0.6, 2.45, wa, wb, lit ? M.windowLit : M.window);
      for (let k = 1; k < 3; k++) {
        const z = wa + ((wb - wa) * k) / 3;
        face(0.06, 0.1, 0.6, 2.45, z - 0.04, z + 0.04, M.trim);
      }
      face(0.06, 0.1, 2.0, 2.05, wa, wb, M.trim);
      face(0, 0.1, 0.14, 0.5, wa - 0.08, wb + 0.08, M.kick);
      // The door: frame, dark glass, a push bar.
      face(0, 0.06, 0.14, 2.35, z0 - 1.5, z0 - 0.4, M.trim);
      face(0.06, 0.08, 0.2, 2.25, z0 - 1.42, z0 - 0.48, M.window);
      face(0.08, 0.11, 1.0, 1.04, z0 - 1.35, z0 - 0.55, M.chrome);
      // The sign band over the window.
      face(0, 0.08, 2.75, 3.35, z1 + 0.3, z0 - 0.3, M.signBand, true);
      face(0.08, 0.09, 2.95, 3.15, z1 + 0.8, z0 - 0.8, M.trim);
      // Upstairs windows with sills.
      if (h > 4.3) {
        for (let z = z1 + 0.9; z < z0 - 0.9; z += 1.5) {
          face(0, 0.05, 3.65, 4.55, z, z + 0.85, M.trim);
          face(0.05, 0.07, 3.72, 4.48, z + 0.07, z + 0.78, M.window);
          face(0, 0.14, 3.58, 3.65, z - 0.05, z + 0.9, M.trim);
        }
      }
      if (awning) {
        // Canvas, white stripes along it, and a valance at the front edge.
        const g = new THREE.Group();
        g.position.set(at(0.02), 2.7, (z0 + z1) / 2);
        g.rotation.z = side * 0.3;
        const len = Math.abs(z0 - z1) - 0.6;
        const canvas = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, len), awning);
        canvas.position.x = -side * 0.65;
        g.add(canvas);
        outline(canvas, w.line);
        for (let z = -len / 2 + 0.3; z < len / 2; z += 0.6) {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.065, 0.24), M.stripeCanvas);
          stripe.position.set(-side * 0.65, 0, z);
          g.add(stripe);
        }
        const valance = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, len), awning);
        valance.position.set(-side * 1.3, -0.12, 0);
        g.add(valance);
        outline(valance, w.line);
        T.add(g);
      }
    };
    // Right side: the barbershop, then the row on down the street.
    storefront(1, -19.5, -27, 4.2, M.stucco, M.awningRed, true);
    storefront(1, -27.2, -34, 5.0, M.brick, null);
    storefront(1, -34.2, -42, 4.4, M.tan, M.awningGreen, true);
    storefront(1, -42.2, -52, 5.4, M.brick, M.awningRed);
    storefront(-1, -30, -38, 4.6, M.brick, M.awningGreen);
    storefront(-1, -38.2, -46, 4.0, M.tan, null);
    storefront(-1, -46.2, -55, 5.2, M.green, M.awningRed, true);
    storefront(-1, -55.2, -64, 4.4, M.stucco, null);
    // The barbershop's sign and its pole by the door.
    {
      const tex = signTexture(512, 128, (ctx, wd, h) => {
        ctx.fillStyle = "#f1ede2";
        ctx.fillRect(0, 0, wd, h);
        ctx.fillStyle = "#2a2626";
        ctx.font = "bold 76px Georgia, 'Times New Roman', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BARBER", wd / 2, h / 2 + 4);
      });
      textures.push(tex);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.58, 0.58, 0.58) }));
      sign.position.set(7.56, 3.4, -23.2);
      sign.rotation.y = -Math.PI / 2;
      add(sign, T);
      const stripes = canvasTexture(64, 128, (ctx, wd, h) => {
        ctx.fillStyle = "#efece4";
        ctx.fillRect(0, 0, wd, h);
        ctx.fillStyle = "#b8252b";
        for (let k = -2; k < 6; k++) {
          ctx.beginPath();
          ctx.moveTo(0, k * 32);
          ctx.lineTo(wd, k * 32 + 40);
          ctx.lineTo(wd, k * 32 + 54);
          ctx.lineTo(0, k * 32 + 14);
          ctx.fill();
        }
      });
      stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
      textures.push(stripes);
      barberPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 16), new THREE.MeshBasicMaterial({ map: stripes, color: new THREE.Color(0.74, 0.74, 0.74) }));
      barberPole.position.set(7.35, 1.9, -20.5);
      add(barberPole, T);
      cyl(0.11, 0.11, 0.08, M.chrome, 7.35, 2.39, -20.5, 12, T);
      cyl(0.11, 0.11, 0.08, M.chrome, 7.35, 1.41, -20.5, 12, T);
    }

    // The gas station on the left: a canopy over two pumps, a little store.
    {
      const gx = -12;
      const gz = -21;
      slab(gx - 5, gx + 4.4, 0, 0.06, gz - 6, gz + 6, M.concrete, T);
      for (const [dx, dz] of [
        [-3, -3.4],
        [3, -3.4],
        [-3, 3.4],
        [3, 3.4],
      ])
        cyl(0.16, 0.16, 4.4, M.canopy, gx + dx, 2.2, gz + dz, 10, T, true);
      slab(gx - 4, gx + 4, 4.4, 5.1, gz - 4.6, gz + 4.6, M.canopy, T, true);
      slab(gx - 4.02, gx + 4.02, 4.62, 4.9, gz - 4.62, gz + 4.62, M.canopyBand, T);
      // Lights under the canopy: small and soft.
      for (const dz of [-2.2, 2.2]) slab(gx - 0.8, gx + 0.8, 4.38, 4.4, gz + dz - 0.3, gz + dz + 0.3, basic("#e6ebee", 0.72), T);
      for (const dz of [-2.2, 2.2]) {
        slab(gx - 0.5, gx + 0.5, 0.06, 0.35, gz + dz - 1.2, gz + dz + 1.2, M.concrete, T);
        slab(gx - 0.3, gx + 0.3, 0.35, 1.9, gz + dz - 0.4, gz + dz + 0.4, M.pump, T, true);
        slab(gx + 0.31, gx + 0.32, 1.25, 1.6, gz + dz - 0.25, gz + dz + 0.25, basic("#2b3a33", 1), T);
      }
      slab(gx - 9.5, gx - 5.5, 0, 3.4, gz - 4, gz + 5, M.stucco, T, true);
      slab(gx - 5.52, gx - 5.48, 0.6, 2.4, gz - 2.5, gz + 3, M.window, T);
    }

    // Eno's diner on the right, set back on its lot: a stainless lunch car.
    {
      const dx0 = 9.6;
      const dx1 = 13.2;
      const dz0 = -15;
      const dz1 = -5;
      slab(7.6, 16, 0, 0.05, -18, -2, M.concrete, T);
      slab(dx0, dx1, 0, 0.55, dz0, dz1, M.dinerRed, T, true);
      slab(dx0, dx1, 0.55, 3.0, dz0, dz1, M.steel, T, true);
      for (const y of [0.75, 0.95, 2.45, 2.65, 2.85]) slab(dx0 - 0.02, dx0, y, y + 0.04, dz0, dz1, M.steelDark, T);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, dz1 - dz0 + 0.2, 24, 1, false, -Math.PI / 2, Math.PI), M.steel);
      roof.rotation.x = Math.PI / 2;
      roof.scale.set(1, 1, 0.32);
      roof.position.set((dx0 + dx1) / 2, 3.0, (dz0 + dz1) / 2);
      add(roof, T, true);
      // The window band, warm inside, broken by the door.
      slab(dx0 - 0.03, dx0 - 0.01, 1.25, 2.25, dz0 + 0.6, -10.6, basic("#e7b87c", 0.74), T);
      slab(dx0 - 0.03, dx0 - 0.01, 1.25, 2.25, -9.4, dz1 - 0.6, basic("#e7b87c", 0.74), T);
      for (let z = dz0 + 1.5; z < dz1 - 0.6; z += 1.1) slab(dx0 - 0.05, dx0 - 0.02, 1.25, 2.25, z - 0.04, z + 0.04, M.steelDark, T);
      slab(dx0 - 0.04, dx0 - 0.01, 0.55, 2.4, -10.5, -9.5, M.window, T);
      slab(dx0 - 0.9, dx0, 0.05, 0.3, -10.8, -9.2, M.concrete, T);
      // The sign on its pole by the road: ENO'S over DINER, glowing faintly.
      const tex = signTexture(512, 256, (ctx, wd, h) => {
        ctx.fillStyle = "#1c1717";
        ctx.fillRect(0, 0, wd, h);
        ctx.strokeStyle = "#7b6a55";
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, wd - 20, h - 20);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f1e2c4";
        ctx.font = "bold 62px Georgia, 'Times New Roman', serif";
        ctx.fillText("ENO'S", wd / 2, h * 0.3);
        ctx.shadowColor = "#ff4a3a";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ff5a44";
        ctx.font = "bold 104px Arial, Helvetica, sans-serif";
        ctx.fillText("DINER", wd / 2, h * 0.67);
      });
      textures.push(tex);
      const px = 8.4;
      const pz = -4.0;
      cyl(0.09, 0.11, 5.2, M.post, px, 2.6, pz, 10, T);
      const signBox = new THREE.Group();
      signBox.position.set(px, 5.2, pz);
      signBox.rotation.y = -0.5;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.3, 0.22), M.black);
      signBox.add(back);
      outline(back, w.line);
      for (const s of [1, -1]) {
        const face = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.86, 0.86, 0.86) }));
        face.position.z = s * 0.115;
        face.rotation.y = s > 0 ? 0 : Math.PI;
        signBox.add(face);
      }
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: "#ff5a40", transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.set(4.2, 2.6, 1);
      halo.position.z = 0.3;
      signBox.add(halo);
      T.add(signBox);
    }

    // Telephone poles down the right side, and the water tower over the roofs.
    [-2, -40, -78].forEach((z) => {
      cyl(0.11, 0.15, 8.5, M.pole, 7.9, 4.25, z, 8, T);
      slab(6.9, 8.9, 7.7, 7.84, z - 0.07, z + 0.07, M.pole, T);
    });
    {
      const tower = new THREE.Group();
      tower.position.set(-24, 0, -105);
      for (const [dx, dz] of [
        [-2, -2],
        [2, -2],
        [-2, 2],
        [2, 2],
      ]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 14, 8), M.tank);
        leg.position.set(dx * 0.85, 7, dz * 0.85);
        leg.rotation.set(dz * -0.04, 0, dx * 0.04);
        tower.add(leg);
      }
      const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.6, 28), M.tank);
      tankBody.position.y = 15.6;
      const roofT = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.6, 28), M.tank);
      roofT.position.y = 18.2;
      tower.add(tankBody, roofT);
      T.add(tower);
    }
  }

  // ── Air: rain and a low haze over the fields ─────────────────────────────
  const rain = createRain(4200);
  scene.add(rain);
  const mist = createParticles({ count: 90, blending: "normal" });
  scene.add(mist.points);
  let mistSeed = 0;
  const puff = () => {
    mistSeed += 1;
    const x = (hash(mistSeed * 1.7) - 0.5) * 70;
    const z = -25 - hash(mistSeed * 2.9) * 110;
    mist.emit({ position: [x, 0.5 + hash(mistSeed * 4.1) * 2.5, z], velocity: [0.35, 0, 0.05], life: 16, size: 8 + hash(mistSeed * 5.3) * 8, color: "#a9b0b5", alpha: 0.16 });
  };
  for (let i = 0; i < 90; i++) {
    puff();
    mist.step(16 / 90);
  }
  let mistDebt = 0;

  // The dip to black between beats and across the loop.
  const fader = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uA: { value: 1 } },
      vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform float uA; void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uA); }",
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  fader.frustumCulled = false;
  fader.renderOrder = 999;
  scene.add(fader);

  // ── Reacher ──────────────────────────────────────────────────────────────
  const cast = { reacher: null, jacket: null };
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.75), new THREE.MeshBasicMaterial({ color: "#000000", map: dot, transparent: true, opacity: 0.45, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  scene.add(contact);

  const FOG_ROAD = [16, 120];
  const FOG_TOWN = [55, 240];
  let fogTown = false;
  /** Fix every ink's light to the overcast after a palette pass. */
  const grade = () => {
    w.palette(OVERCAST);
    w.inks.forEach((m) => {
      m.uniforms.uKey.value.setRGB(0.74, 0.76, 0.78);
      m.uniforms.uShade.value.set("#8f9cab");
      m.uniforms.uFog.value.set(AIR);
      m.uniforms.uFogRange.value.set(...(fogTown ? FOG_TOWN : FOG_ROAD));
    });
    w.light(...KEY);
    w.page({ mode: "still" });
    w.sync();
  };

  const ready = createModelFigure({
    body: "SuperheroMale",
    height: 2.0,
    hair: ["HairBuzzed", "EyebrowsRegular"],
    line: w.line,
    ink: { tone: 1.0, rim: 0.3, spec: 0.6 },
    outfit: { skin: "#d2a07c", top: JACKET, collar: "#3b414d", bottom: "#2c3a52", shoes: "#2a1d16", hair: "#4a321e", sleeves: "long" },
    fist: 0.95, // loosely curled, not an open hand
  }).then((reacher) => {
    if (disposed) return;
    reacher.apply({});
    coverShoulders(reacher, JACKET);
    const cloth = w.ink({ tint: JACKET, tone: 0.95, rim: 0.3, spec: 0.6 });
    cloth.side = THREE.DoubleSide;
    addCollar(reacher, 2.0, cloth, w.line);
    cast.jacket = addJacket(reacher, 2.0, cloth, w.line);
    scene.add(reacher.root);
    w.register(reacher.root);
    cast.reacher = reacher;
    grade();
    stage.invalidate();
  });
  grade();

  // ── Camera ───────────────────────────────────────────────────────────────
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const rPos = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const SHOT_DOOR = { from: v3(10.6, 1.45, -12.8), to: v3(10.0, 1.42, -12.1), lookFrom: v3(4.9, 1.35, -4.8), lookTo: v3(5.0, 1.3, -4.95) };
  const SHOT_GO = { from: v3(6.6, 1.8, -0.9), to: v3(6.35, 1.75, -1.5), lookFrom: v3(3.0, 1.45, -30), lookTo: v3(3.1, 1.4, -30) };
  // Town: from just behind his right shoulder, the eye reads the street.
  const PAN_EYE = v3(TOWN_STOP.x + 0.5, 2.02, TOWN_STOP.z + 1.5);
  const LOOKS = [v3(3.0, 1.55, -30), v3(-10.5, 2.0, -19), v3(8.0, 2.1, -23.5), v3(10.4, 2.4, -9.0)];
  const angles = LOOKS.map((p) => {
    const d = p.clone().sub(PAN_EYE);
    return [Math.atan2(d.x, -d.z), Math.atan2(d.y, Math.hypot(d.x, d.z))];
  });
  const PAN_MOVES = [
    [10.6, 11.3],
    [11.9, 12.9],
    [13.4, 14.3],
  ];
  const panAngles = (c) => {
    let [yaw, pitch] = angles[0];
    PAN_MOVES.forEach(([a, b], i) => {
      if (c < a) return;
      const k = easeInOutCubic(segment(c, a, b));
      yaw = lerp(angles[i][0], angles[i + 1][0], k);
      pitch = lerp(angles[i][1], angles[i + 1][1], k);
    });
    return [yaw, pitch];
  };

  const BASE_FOV = camera.fov;
  const unsubscribeResize = stage.onResize(({ aspect, height }) => {
    w.bu.uAspect.value = aspect;
    // Near-square frames widen the lens a little rather than lose the subject.
    camera.fov = BASE_FOV * Math.max(1, (1.6 / aspect) ** 0.45);
    camera.updateProjectionMatrix();
    mist.resize(height, camera.fov, renderer.getPixelRatio());
    w.sync();
  });

  // ── The frame ────────────────────────────────────────────────────────────
  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : ((time % CYCLE) + CYCLE) % CYCLE;
    const inTown = c >= CUT;
    roadSet.visible = !inTown;
    townSet.visible = inTown;
    // The road wants deep haze; the town is close, so let it keep its colour.
    if (inTown !== fogTown) {
      fogTown = inTown;
      w.inks.forEach((m) => m.uniforms.uFogRange.value.set(...(inTown ? FOG_TOWN : FOG_ROAD)));
      mist.points.visible = !inTown;
    }

    // The why, one line a beat: on the step, as the coach goes, on the road.
    const lines = [
      [0.4, 2.35, "Joe said Blind Blake died in Margrave."],
      [2.55, 4.5, "So he asked the driver to stop."],
      [4.7, 7.85, "No plan. No bag. Just a bluesman's ghost."],
    ];
    const line = staticMode ? null : lines.find(([a, b]) => c >= a && c < b);
    caption.update({ text: line?.[2] ?? "", size: 2.3, opacity: line ? Math.min(segment(c, line[0], line[0] + 0.25), 1 - segment(c, line[1] - 0.25, line[1])) : 0 });

    const dip = inTown ? 1 - easeInOutCubic(segment(c, CUT, 8.95)) : easeInOutCubic(segment(c, 8.0, CUT));
    fader.material.uniforms.uA.value = staticMode ? 0 : Math.max(1 - easeInOutCubic(segment(c, 0, 0.6)), dip, easeInOutCubic(segment(c, CYCLE - 0.6, CYCLE)));

    // The coach: door folds open, closes, it pulls away and merges back into the lane.
    const open = envelope(c, 0.3, 0.9, 2.25, 2.65);
    bus.leaves.forEach(({ hinge, sign }) => (hinge.rotation.y = sign * 1.45 * open));
    const u = Math.max(0, c - DEPART);
    const run = 1.6 * u * u;
    const merge = easeInOutCubic(segment(u, 0.3, 3.5));
    bus.group.position.set(BUS_X - 1.75 * merge, 0, -run);
    bus.group.rotation.y = 0.06 * Math.sin(Math.PI * merge);
    bus.group.visible = run < 260;
    bus.wheels.forEach((wh) => (wh.rotation.x = -run / 0.5));
    // On the brake while he gets off; just the running lamps once it goes.
    const brake = 1 - segment(u, 0, 0.5);
    bus.tailMat.color.setRGB(1, 0.16, 0.1).multiplyScalar(0.55 + 0.75 * brake);
    bus.glows.forEach((g) => (g.material.opacity = 0.28 + 0.22 * brake));
    bus.streaks.forEach((s) => (s.material.opacity = 0.09 + 0.08 * brake));

    // Camera.
    let panYaw = 0;
    if (!inTown) {
      if (c < 2.4) {
        const k = easeInOutCubic(segment(c, 0, 2.4));
        camPos.lerpVectors(SHOT_DOOR.from, SHOT_DOOR.to, k);
        camLook.lerpVectors(SHOT_DOOR.lookFrom, SHOT_DOOR.lookTo, k);
      } else if (c < 4.6) {
        const k = easeInOutCubic(segment(c, 2.4, 4.6));
        camPos.lerpVectors(SHOT_GO.from, SHOT_GO.to, k);
        camLook.lerpVectors(SHOT_GO.lookFrom, SHOT_GO.lookTo, k);
      } else {
        // Beside him, then round behind him as the sign comes up.
        const z = KERB.z - walked(c - WALK_AT);
        rPos.set(KERB.x, 0, z);
        // An orbit round him from his right side to behind his right shoulder.
        const k = easeInOutCubic(segment(c, 5.9, 7.5));
        const theta = lerp(Math.PI / 2 + 0.12, 0.27, k);
        const r = lerp(3.4, 3.75, k);
        camPos.set(Math.sin(theta) * r, lerp(1.45, 1.85, k), Math.cos(theta) * r).add(rPos);
        camLook.copy(tmpA.set(0, 1.25, -0.25).lerp(tmpB.set(-0.8, 1.2, -14), easeInOutCubic(segment(c, 6.8, 7.9)))).add(rPos);
      }
    } else {
      const d = c < TOWN_CRUISE ? SPEED * (c - CUT) : c < TOWN_HALT ? SPEED * (TOWN_CRUISE - CUT) + SPEED * ((c - TOWN_CRUISE) - (c - TOWN_CRUISE) ** 2 / (2 * (TOWN_HALT - TOWN_CRUISE))) : TOWN_DIST;
      const behind = TOWN_DIST - d;
      camPos.copy(PAN_EYE);
      camPos.z += behind * 0.85;
      const [yaw, pitch] = panAngles(c);
      panYaw = yaw;
      camLook.set(camPos.x + Math.sin(yaw) * 20 * Math.cos(pitch), camPos.y + Math.sin(pitch) * 20, camPos.z - Math.cos(yaw) * 20 * Math.cos(pitch));
    }
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.04;
    camera.position.y += pointer.y * 0.025;
    camera.lookAt(camLook);
    sky.position.copy(camera.position);

    // Rain around the camera; haze drifting over the fields.
    rain.material.uniforms.uTime.value = time;
    rain.material.uniforms.uCenter.value.copy(camera.position);
    if (!staticMode) {
      mistDebt += dt * (90 / 16);
      while (mistDebt >= 1) {
        mistDebt -= 1;
        puff();
      }
      mist.step(dt);
    }
    if (barberPole) barberPole.material.map.offset.y = -time * 0.25;

    const { reacher, jacket } = cast;
    if (!reacher) return;

    // Reacher.
    let pose;
    let yawRoot = Math.PI;
    if (!inTown) {
      if (c < 0.9) {
        rPos.copy(START);
        yawRoot = Math.PI / 2;
        pose = blendPose(STAND, STAND, 0);
      } else if (c < 1.8) {
        // Down off the step and out onto the gravel: two strides.
        const k = segment(c, 0.9, 1.8);
        rPos.set(lerp(START.x, KERB.x, easeInOutCubic(k)), STEP_Y * (1 - easeInOutCubic(segment(k, 0.05, 0.55))), START.z);
        yawRoot = Math.PI / 2;
        pose = blendPose(STAND, walkPose(k * Math.PI * 2, GAIT, 0.7), Math.min(1, k * 5) * (1 - segment(k, 0.85, 1)));
      } else if (c < 2.6) {
        // Turns to face down the road after the coach.
        const k = easeInOutCubic(segment(c, 1.8, 2.6));
        rPos.copy(KERB);
        yawRoot = lerp(Math.PI / 2, Math.PI, k);
        pose = blendPose(walkPose(k * Math.PI, GAIT, 0.25), STAND, k);
      } else {
        const uw = c - WALK_AT;
        rPos.set(KERB.x, 0, KERB.z - walked(uw));
        const amp = 0.3 + 0.7 * segment(uw, 0, RAMP);
        pose = blendPose(STAND, walkPose((walked(uw) / STRIDE) * Math.PI * 2, GAIT, amp), segment(uw, 0, 0.35));
        // Watching the coach go: chin up a touch toward the taillights.
        if (uw < 0) pose.head = [pose.head[0] - 0.04, pose.head[1] + 0.06, pose.head[2]];
      }
    } else {
      const d = c < TOWN_CRUISE ? SPEED * (c - CUT) : c < TOWN_HALT ? SPEED * (TOWN_CRUISE - CUT) + SPEED * ((c - TOWN_CRUISE) - (c - TOWN_CRUISE) ** 2 / (2 * (TOWN_HALT - TOWN_CRUISE))) : TOWN_DIST;
      rPos.set(TOWN_STOP.x, 0, TOWN_STOP.z + TOWN_DIST - d);
      const speed = c < TOWN_CRUISE ? 1 : 1 - segment(c, TOWN_CRUISE, TOWN_HALT);
      const settle = easeInOutCubic(segment(c, 9.5, 10.3));
      pose = blendPose(walkPose((d / STRIDE) * Math.PI * 2 + 1.1, GAIT, 0.25 + 0.75 * speed), STAND, settle);
      // His head goes where the eye goes: he reads it one thing at a time.
      const look = Math.max(-0.75, Math.min(0.75, panYaw - angles[0][0])) * settle;
      pose.chest = [pose.chest[0], pose.chest[1] - look * 0.15, pose.chest[2]];
      pose.neck = [pose.neck[0], pose.neck[1] - look * 0.3, pose.neck[2]];
      pose.head = [pose.head[0] + 0.04, pose.head[1] - look * 0.45, pose.head[2]];
    }
    // Breathing.
    const breath = Math.sin(time * 1.4) * 0.012;
    pose.chest = [(pose.chest?.[0] ?? 0) - breath, pose.chest?.[1] ?? 0, pose.chest?.[2] ?? 0];
    reacher.apply(pose);
    reacher.root.position.copy(rPos);
    reacher.root.rotation.y = yawRoot;
    if (jacket) {
      const wind = Math.sin(time * 1.3) * 0.02;
      jacket.left.rotation.x = (pose.lHip?.[0] ?? 0) * 0.4 + 0.02 + wind;
      jacket.right.rotation.x = (pose.rHip?.[0] ?? 0) * 0.4 + 0.02 + wind * 0.8;
    }
    contact.position.set(rPos.x, rPos.y + 0.006, rPos.z);
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      renderer.toneMappingExposure = baseExposure;
      if (bloom) Object.assign(bloom, baseBloom);
      textures.forEach((t) => t.dispose());
      caption.dispose();
    },
  };
};
