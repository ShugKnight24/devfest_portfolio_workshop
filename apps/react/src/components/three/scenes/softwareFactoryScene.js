import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import {
  canvasTexture,
  clamp01,
  createParticles,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  flowMaterial,
  hash,
  hdr,
  lerp,
  lightBeam,
  noiseTexture,
  segment,
} from "../kit";
import { PRODUCTS, buildDevice, problemTexture } from "../factoryProducts";
import { createRobotArm } from "../robotArm";
import { createAgentBot, createSupervisor } from "../agents";

/**
 * The Agent Software Factory — the home page's opening shot.
 *
 * Everyday problems go in one end, the outcome someone wanted comes out the other,
 * built by a crew of robot agents. It is the talk's loop, shown rather than
 * told:
 *
 *   01 PROBLEM   a real complaint arrives, with the outcome its owner wants
 *   02 SPEC      the investigator scans it into a blueprint of the tool
 *   03 BUILD     two builder arms place the UI parts onto a real device
 *   04 REVIEW    the reviewer checks it: red first, fixed, stamped green
 *   05 SHIP      it launches up the beam, live, for an audience of one
 *
 * Four products ride the line a quarter-cycle apart, so every station is
 * always busy. Each product's look is a pure function of its own progress,
 * so reduced motion just holds one frame.
 *
 * The cell is laid out like a real one: the investigator reaches over the line
 * from behind, the builders and the reviewer stand in front of it, because the
 * work lands on the screen's face. Every tool contact is solved with the arm's
 * six-axis `aim`, and a carried part is drawn on the suction cups, so nothing
 * the crew handles floats.
 */

export const FACTORY_STATIONS = [
  { id: "problem", num: "01", name: "THE PROBLEM", x: -8.4 },
  { id: "spec", num: "02", name: "SPEC", x: -4.2 },
  { id: "build", num: "03", name: "BUILD", x: 0 },
  { id: "review", num: "04", name: "REVIEW", x: 4.2 },
  { id: "ship", num: "05", name: "SHIP", x: 8.4 },
];

/** Viewer controls: the paint on the crew, the light on the floor, the camera, the line speed. */
export const FACTORY_PAINTS = [
  { id: "white", name: "Cleanroom white", color: "#d9dde2", roughness: 0.32, metalness: 0.1 },
  { id: "orange", name: "Safety orange", color: "#ff6a13", roughness: 0.3, metalness: 0.15 },
  { id: "yellow", name: "Signal yellow", color: "#f2b705", roughness: 0.3, metalness: 0.15 },
  { id: "graphite", name: "Graphite", color: "#3a3f47", roughness: 0.28, metalness: 0.55 },
];
export const FACTORY_MOODS = [
  { id: "shift", name: "Day shift" },
  { id: "night", name: "Night shift" },
];
export const FACTORY_VIEWS = [
  { id: "line", name: "Whole line" },
  { id: "follow", name: "Follow a job" },
  { id: "chief", name: "The chief" },
  ...FACTORY_STATIONS.map((s) => ({ id: s.id, name: s.num })),
];
export const FACTORY_SPEEDS = [0, 1, 2];

const [PROBLEM_X, SPEC_X, BUILD_X, REVIEW_X, SHIP_X] = FACTORY_STATIONS.map((s) => s.x);

const PERIOD = 22;
const DEVICE_SCALE = 1.2;
const BELT_Y = 0.55;
const PART_DEPTH = 0.04;
const T = {
  enter: [0, 0.04],
  problem: [0.04, 0.15],
  toSpec: [0.15, 0.19],
  spec: [0.19, 0.33],
  toBuild: [0.33, 0.37],
  build: [0.37, 0.58],
  toReview: [0.58, 0.62],
  review: [0.62, 0.75],
  toShip: [0.75, 0.79],
  charge: [0.79, 0.84],
  launch: [0.84, 0.93],
};
const CYAN = "#00e5ff";
const AMBER = "#ffb300";
const GREEN = "#39ff88";
const RED = "#ff2d55";

const MOVES = [
  [T.enter, -13, PROBLEM_X],
  [T.toSpec, PROBLEM_X, SPEC_X],
  [T.toBuild, SPEC_X, BUILD_X],
  [T.toReview, BUILD_X, REVIEW_X],
  [T.toShip, REVIEW_X, SHIP_X],
];
const lineX = (u) => {
  for (const [[a, b], from, to] of MOVES) {
    if (u < a) return from;
    if (u < b) return lerp(from, to, a === 0 ? easeOutCubic(segment(u, a, b)) : easeInOutCubic(segment(u, a, b)));
  }
  return SHIP_X;
};

// Mood: how bright the hall is, how hard the station lamps and the neon push.
const MOODS = {
  shift: { exposure: 0.95, key: 2.0, hemi: 0.45, rim: 0.7, env: 0.38, spot: 5, fog: 0.026, grid: 0.22, bloom: 0.38, threshold: 1.25, vignette: 0.32 },
  night: { exposure: 0.95, key: 0.45, hemi: 0.1, rim: 0.9, env: 0.14, spot: 12, fog: 0.034, grid: 0.55, bloom: 0.55, threshold: 1.0, vignette: 0.5 },
};

// The reviewer's verdict: a solid badge with a thick white glyph and a dark rim,
// so it reads against a bright screen at line distance. Drawn as strokes, not a
// font glyph, so every platform gets the same weight.
const stamp = (pass, color) =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.beginPath();
    ctx.arc(c, c, c - 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0e12";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, c - 20, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 30;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (pass) {
      ctx.moveTo(72, 134);
      ctx.lineTo(112, 174);
      ctx.lineTo(186, 90);
    } else {
      ctx.moveTo(86, 86);
      ctx.lineTo(170, 170);
      ctx.moveTo(170, 86);
      ctx.lineTo(86, 170);
    }
    ctx.stroke();
  });

const floorGrid = () =>
  canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,229,255,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,229,255,0.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo((i * w) / 4, 0);
        ctx.lineTo((i * w) / 4, h);
        ctx.moveTo(0, (i * h) / 4);
        ctx.lineTo(w, (i * h) / 4);
        ctx.stroke();
      }
    },
    { repeat: [26, 26] },
  );

/** Yellow and black floor tape: the line every robot cell is fenced with. */
const hazardTape = () =>
  canvasTexture(
    256,
    32,
    (ctx, w, h) => {
      ctx.fillStyle = "#f2b705";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#111";
      for (let x = -h; x < w + h; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + 16, h);
        ctx.lineTo(x + 16 + h, 0);
        ctx.lineTo(x + h, 0);
        ctx.fill();
      }
    },
    { repeat: [1, 1] },
  );

/** A rack's front door: perforated steel, a seam per few rack units, a handle slot. */
const rackDoor = () =>
  canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#191d24";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#07090c";
    for (let y = 18; y < h - 18; y += 12)
      for (let x = 18 + ((y / 12) % 2) * 6; x < w - 18; x += 12) {
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#3a414c";
    ctx.fillRect(w - 30, h * 0.42, 10, h * 0.16);
  });

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, uStrength: { value: 0.35 }, uAspect: { value: 1 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      float v = smoothstep(1.05, 0.25, length(p) / max(uAspect, 1.0) * 1.35);
      c.rgb *= mix(1.0 - uStrength, 1.0, v);
      // A breath of teal in the shadows, so the blacks read as a lit hall, not a void.
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb += vec3(0.0, 0.006, 0.01) * (1.0 - smoothstep(0.0, 0.25, l));
      gl_FragColor = c;
    }
  `,
};

/** Interpolates a tool path: [{ t, p, d, arc }] with eased segments and an optional lift. */
const pathAt = (keys, w, outP, outD) => {
  let i = 0;
  while (i < keys.length - 2 && w >= keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const e = easeInOutCubic(segment(w, a.t, b.t));
  outP.lerpVectors(a.p, b.p, e);
  outP.y += Math.sin(e * Math.PI) * (b.arc ?? 0);
  outD.lerpVectors(a.d, b.d, e).normalize();
  return e;
};

const X_AXIS = new THREE.Vector3(1, 0, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const INTO_SCREEN = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);
const TOTE_UP = new THREE.Vector3(0, 0, -1);

export const createSoftwareFactoryScene = (stage, { props = {}, overlay } = {}) => {
  const { scene, camera, renderer, pointer, composer } = stage;
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2("#05070a", 0.026);

  // ── Light ────────────────────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight("#9db7cc", "#0a0806", 0.4);
  root.add(hemi);
  const key = new THREE.DirectionalLight("#fff1e0", 2.4);
  key.position.set(6, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -15, right: 15, top: 8, bottom: -8, near: 1, far: 36 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  root.add(key);
  const rim = new THREE.DirectionalLight("#9fdcff", 0.7);
  rim.position.set(-6, 6, -10);
  root.add(rim);

  // Station lamps: a housing high over each station, a spot pooling light on its work.
  const lampHousing = new RoundedBoxGeometry(1.8, 0.1, 0.36, 2, 0.03);
  const lampStrip = new THREE.PlaneGeometry(1.6, 0.16);
  const pools = FACTORY_STATIONS.map((s, i) => {
    const color = [RED, CYAN, AMBER, GREEN, CYAN][i];
    const light = new THREE.SpotLight(color, 0, 14, 0.36, 0.7, 1.4);
    light.position.set(s.x, 6.4, 0.2);
    light.target.position.set(s.x, BELT_Y, -0.2);
    root.add(light, light.target);
    const housing = new THREE.Mesh(lampHousing, new THREE.MeshStandardMaterial({ color: "#14181e", roughness: 0.5, metalness: 0.8 }));
    housing.position.set(s.x, 6.5, 0.6);
    const stripMat = new THREE.MeshBasicMaterial({ color: hdr(color, 0.4), toneMapped: false });
    const strip = new THREE.Mesh(lampStrip, stripMat);
    strip.rotation.x = Math.PI / 2;
    strip.position.set(s.x, 6.445, 0.6);
    root.add(housing, strip);
    return { light, stripMat, color: new THREE.Color(color) };
  });

  // ── Floor, racks, line ───────────────────────────────────────────────────
  const floorMat = new THREE.MeshStandardMaterial({
    color: "#0b0e13",
    roughness: 0.62,
    metalness: 0.3,
    roughnessMap: noiseTexture(256, 140, 70, [30, 30]),
    emissive: new THREE.Color("#0a3c48"),
    emissiveMap: floorGrid(),
    emissiveIntensity: 0.25,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const gunmetal = new THREE.MeshStandardMaterial({ color: "#1b2029", roughness: 0.38, metalness: 0.85 });
  const armBody = new THREE.MeshPhysicalMaterial({ color: "#d9dde2", roughness: 0.32, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.22 });
  const armJoint = new THREE.MeshStandardMaterial({ color: "#3a414c", roughness: 0.3, metalness: 0.9 });
  const cable = new THREE.MeshStandardMaterial({ color: "#121417", roughness: 0.65, metalness: 0.05 });
  const steel = new THREE.MeshStandardMaterial({ color: "#6b7480", roughness: 0.26, metalness: 1 });
  const dummy = new THREE.Object3D();

  // Server racks behind the line, LEDs blinking: the compute the crew runs on.
  // Full-height cabinets bayed shoulder to shoulder, as a real row is.
  const RACKS = 22;
  const RACK = { w: 1.4, h: 5.4, d: 1.2, gap: 0.06, z: -5.2 };
  const rackGeo = new RoundedBoxGeometry(RACK.w, RACK.h, RACK.d, 2, 0.04);
  const doorGeo = new THREE.PlaneGeometry(RACK.w - 0.12, RACK.h - 0.2);
  const doorMat = new THREE.MeshStandardMaterial({ map: rackDoor(), roughness: 0.45, metalness: 0.75 });
  const LED_ROWS = 24;
  const LED_COLS = 4;
  const ledCount = RACKS * LED_ROWS * LED_COLS;
  const leds = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.022), new THREE.MeshBasicMaterial({ color: "#ffffff" }), ledCount);
  const ledBase = [];
  const rowStart = -((RACKS - 1) * (RACK.w + RACK.gap)) / 2;
  for (let i = 0; i < RACKS; i++) {
    const x = rowStart + i * (RACK.w + RACK.gap);
    const rack = new THREE.Mesh(rackGeo, gunmetal);
    rack.position.set(x, RACK.h / 2, RACK.z);
    rack.castShadow = true;
    rack.receiveShadow = true;
    root.add(rack);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(x, RACK.h / 2, RACK.z + RACK.d / 2 + 0.002);
    root.add(door);
    for (let r = 0; r < LED_ROWS; r++)
      for (let c = 0; c < LED_COLS; c++) {
        const n = ledBase.length;
        dummy.position.set(x - RACK.w / 2 + 0.2 + c * 0.11, 0.5 + r * ((RACK.h - 1) / LED_ROWS), RACK.z + RACK.d / 2 + 0.006);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        leds.setMatrixAt(n, dummy.matrix);
        const seed = i * 131 + r * 7 + c;
        ledBase.push({ color: hdr(hash(seed) > 0.82 ? AMBER : CYAN, 2), seed });
      }
  }
  // A cable tray running along the top of the row.
  const tray = new THREE.Mesh(new THREE.BoxGeometry(RACKS * (RACK.w + RACK.gap), 0.14, 0.5), gunmetal);
  tray.position.set(0, RACK.h + 0.25, RACK.z + 0.1);
  root.add(tray, leds);
  const ledColor = new THREE.Color();
  const blinkLeds = (time) => {
    ledBase.forEach((l, n) => leds.setColorAt(n, ledColor.copy(l.color).multiplyScalar(hash(l.seed + Math.floor(time * 4 + l.seed)) > 0.25 ? 1 : 0.15)));
    leds.instanceColor.needsUpdate = true;
  };

  const base = new THREE.Mesh(new RoundedBoxGeometry(24, 0.36, 2.2, 3, 0.08), gunmetal);
  base.position.y = 0.18;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);
  const flows = [-1, 1].map((side) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(24, 0.2, 0.14, 2, 0.05), gunmetal);
    rail.position.set(0, 0.5, side * 1.12);
    root.add(rail);
    const flow = flowMaterial({ color: CYAN, count: 48, speed: 0.6, base: 0.2, peak: 3 });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.045), flow);
    strip.position.set(0, 0.5, side * 1.196);
    if (side < 0) strip.rotation.y = Math.PI;
    root.add(strip);
    return flow;
  });
  const ROLLERS = 46;
  const rollerGeo = new THREE.CylinderGeometry(0.11, 0.11, 2.0, 20);
  rollerGeo.rotateX(Math.PI / 2);
  const rollers = new THREE.InstancedMesh(rollerGeo, steel, ROLLERS);
  rollers.receiveShadow = true;
  root.add(rollers);

  // ── The crew ─────────────────────────────────────────────────────────────
  // The investigator works over the line from behind; the builders and the
  // reviewer stand in front, inside taped cells, since their work is on the glass.
  const FRONT_Z = 1.72;
  const armMats = { body: armBody, joint: armJoint, dark: gunmetal, cable };
  const investigator = createRobotArm({ materials: armMats, color: CYAN, tool: "scanner", upper: 1.55, fore: 1.4, detail: true });
  investigator.root.position.set(SPEC_X + 0.1, 0, -1.75);
  const builders = [-1, 1].map((s) => {
    const arm = createRobotArm({ materials: armMats, color: AMBER, tool: "vacuum", upper: 1.6, fore: 1.5, detail: true });
    arm.root.position.set(BUILD_X + s * 1.85, 0, FRONT_Z);
    arm.side = s;
    return arm;
  });
  const reviewer = createRobotArm({ materials: armMats, color: GREEN, tool: "stamp", upper: 1.5, fore: 1.4, toolLength: 0.4, stampSize: 0.56, detail: true });
  reviewer.root.position.set(REVIEW_X + 1.9, 0, FRONT_Z);
  const crew = [investigator, ...builders, reviewer];
  crew.forEach((a) => {
    a.root.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    root.add(a.root);
  });

  // Totes beside the builders, open-topped so a part rises out of them.
  const toteMat = new THREE.MeshStandardMaterial({ color: "#23476e", roughness: 0.55, metalness: 0.05 });
  const tote = (x, z) => {
    const g = new THREE.Group();
    const [w, h, d, t] = [1.0, 0.5, 0.8, 0.04];
    for (const [sx, sy, sz, px, py, pz] of [
      [w, t, d, 0, t / 2, 0],
      [w, h, t, 0, h / 2, -d / 2 + t / 2],
      [w, h, t, 0, h / 2, d / 2 - t / 2],
      [t, h, d, -w / 2 + t / 2, h / 2, 0],
      [t, h, d, w / 2 - t / 2, h / 2, 0],
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), toteMat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    g.position.set(x, 0, z);
    root.add(g);
    return new THREE.Vector3(x, 0.12, z);
  };
  const bins = builders.map((b) => tote(b.root.position.x + b.side * 1.15, FRONT_Z + 0.7));

  // Floor tape around every cell in front of the line.
  const tapeTex = hazardTape();
  const tapeLine = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const tex = tapeTex.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(len / 0.8, 1);
    tex.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    m.rotation.set(-Math.PI / 2, 0, -Math.atan2(z2 - z1, x2 - x1));
    m.position.set((x1 + x2) / 2, 0.004, (z1 + z2) / 2);
    m.receiveShadow = true;
    root.add(m);
  };
  const cell = (x1, x2, z1, z2) => {
    tapeLine(x1, z1, x2, z1);
    tapeLine(x2, z1, x2, z2);
    tapeLine(x2, z2, x1, z2);
    tapeLine(x1, z2, x1, z1);
  };
  cell(BUILD_X - 3.6, BUILD_X + 3.6, 1.32, 3.4);
  cell(REVIEW_X + 0.9, REVIEW_X + 2.9, 1.32, 2.7);

  // ── Mezzanine and the chief ─────────────────────────────────────────────
  // A steel deck behind the line, between build and review: the one place that sees it all.
  const DECK = { x0: 1.0, x1: 3.8, z0: -4.3, z1: -2.9, y: 1.5 };
  const deckCx = (DECK.x0 + DECK.x1) / 2;
  const deckCz = (DECK.z0 + DECK.z1) / 2;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK.x1 - DECK.x0, 0.08, DECK.z1 - DECK.z0), steel);
  deck.position.set(deckCx, DECK.y - 0.04, deckCz);
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);
  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, DECK.y, 10);
  for (const x of [DECK.x0 + 0.08, DECK.x1 - 0.08])
    for (const z of [DECK.z0 + 0.08, DECK.z1 - 0.08]) {
      const post = new THREE.Mesh(postGeo, gunmetal);
      post.position.set(x, DECK.y / 2, z);
      post.castShadow = true;
      root.add(post);
    }
  // Guard rail: top rail, knee rail and stanchions on the open sides, yellow as code requires.
  const railMat = new THREE.MeshStandardMaterial({ color: "#f2b705", roughness: 0.45, metalness: 0.3 });
  const rail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    for (const h of [1.05, 0.55]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 8), railMat);
      r.rotation.z = Math.PI / 2;
      r.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      r.position.set((x0 + x1) / 2, DECK.y + h, (z0 + z1) / 2);
      root.add(r);
    }
    const n = Math.max(2, Math.round(len / 0.9) + 1);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.05, 8), railMat);
      st.position.set(lerp(x0, x1, t), DECK.y + 0.525, lerp(z0, z1, t));
      root.add(st);
    }
  };
  rail(DECK.x0, DECK.z1, DECK.x1, DECK.z1);
  rail(DECK.x0, DECK.z0, DECK.x0, DECK.z1);
  // Stairs down the right side.
  const STEPS = 7;
  for (let i = 0; i < STEPS; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.9), steel);
    step.position.set(DECK.x1 + 0.14 + i * 0.28, DECK.y - (i + 1) * (DECK.y / (STEPS + 1)), DECK.z0 + 0.5);
    step.castShadow = true;
    root.add(step);
  }
  const chief = createSupervisor();
  // On the deck, a step behind the front rail.
  chief.root.position.set(deckCx - 0.2, DECK.y, DECK.z1 - 0.45);
  chief.root.rotation.y = -0.18;
  root.add(chief.root);

  // ── Agent bots ───────────────────────────────────────────────────────────
  const botMats = { paint: armBody, trim: armJoint, dark: gunmetal };
  const courier = createAgentBot({ ...botMats, color: AMBER, carry: true });
  const tech = createAgentBot({ ...botMats, color: CYAN });
  const clerk = createAgentBot({ ...botMats, color: RED });
  clerk.root.position.set(PROBLEM_X - 0.3, 0, -1.65);
  root.add(courier.root, tech.root, clerk.root);
  // Patrols: [time, x, z, facing-or-null]; facing null means face the direction of travel.
  const patrol = (keys, period, t, out) => {
    const u = ((t % period) + period) % period;
    let i = 0;
    while (i < keys.length - 2 && u >= keys[i + 1][0]) i++;
    const [ta, xa, za, fa] = keys[i];
    const [tb, xb, zb] = keys[i + 1];
    const e = easeInOutCubic(segment(u, ta, tb));
    out.x = lerp(xa, xb, e);
    out.z = lerp(za, zb, e);
    const moving = Math.hypot(xb - xa, zb - za) > 0.01;
    out.speed = moving ? (Math.hypot(xb - xa, zb - za) / (tb - ta)) * Math.sin(e * Math.PI) * 1.4 : 0;
    out.stopped = !moving;
    out.yaw = fa ?? (moving ? Math.atan2(xb - xa, zb - za) : out.yaw ?? 0);
    return out;
  };
  const toteStop = bins.map((b) => [b.x, b.z + 0.95]);
  const COURIER = [
    [0, -9, 4.0],
    [3, toteStop[0][0], toteStop[0][1]],
    [3.4, toteStop[0][0], toteStop[0][1], Math.PI],
    [5.2, toteStop[0][0], toteStop[0][1], Math.PI],
    [8.5, toteStop[1][0], toteStop[1][1]],
    [8.9, toteStop[1][0], toteStop[1][1], Math.PI],
    [10.7, toteStop[1][0], toteStop[1][1], Math.PI],
    [14, 9, 4.0],
    [24, -9, 4.0],
  ];
  const TECH_Z = RACK.z + RACK.d / 2 + 0.75;
  const TECH = [
    [0, -14, TECH_Z],
    [4, -10, TECH_Z],
    [4.4, -10, TECH_Z, Math.PI],
    [8, -10, TECH_Z, Math.PI],
    [11, -5.6, TECH_Z],
    [11.4, -5.6, TECH_Z, Math.PI],
    [15, -5.6, TECH_Z, Math.PI],
    [20, -14, TECH_Z],
    [21, -14, TECH_Z],
  ];
  const courierState = {};
  const techState = {};
  // Walkway tape in front of the cells, where the courier drives.
  tapeLine(-12, 3.55, 12, 3.55);
  tapeLine(-12, 4.45, 12, 4.45);

  // Scan beam and ship beam.
  const scanBeam = lightBeam({ from: [0, 0, 0], to: [0, 1, 0], radiusFrom: 0.04, radiusTo: 0.7, color: CYAN });
  root.add(scanBeam);
  const ship = lightBeam({ from: [SHIP_X, 0.5, 0], to: [SHIP_X, 20, 0], radiusFrom: 1.1, radiusTo: 1.4, color: "#7ffff0", bands: 26 });
  root.add(ship);
  const shipPad = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.06, 64), steel);
  shipPad.position.set(SHIP_X, 0.39, 0);
  shipPad.receiveShadow = true;
  root.add(shipPad);
  const shipRings = [1.45, 1.25, 1.05].map((r, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: hdr(CYAN, 1) });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 10, 96, Math.PI * 1.6), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(SHIP_X, 0.7 + i * 0.5, 0);
    root.add(ring);
    return { ring, mat };
  });

  // ── Products ─────────────────────────────────────────────────────────────
  const deviceMats = {
    frame: new THREE.MeshPhysicalMaterial({ color: "#20252d", roughness: 0.3, metalness: 0.6, clearcoat: 0.6 }),
    dots: ["#ff5f57", "#febc2e", "#28c840"].map((c) => new THREE.MeshBasicMaterial({ color: c })),
  };
  const passStamp = new THREE.MeshBasicMaterial({ map: stamp(true, "#12b85a"), transparent: true, depthWrite: false, toneMapped: false });
  const failStamp = new THREE.MeshBasicMaterial({ map: stamp(false, "#e0213f"), transparent: true, depthWrite: false, toneMapped: false });
  const BUILD_SPAN = T.build[1] - T.build[0] - 0.05;
  const items = PRODUCTS.map((product, k) => {
    const group = new THREE.Group();
    root.add(group);
    const sheet = new THREE.Mesh(
      (() => {
        const g = new THREE.PlaneGeometry(0.9, 1.12, 16, 20);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, (hash(i * 1.7 + k) - 0.5) * 0.05);
        g.computeVertexNormals();
        return g;
      })(),
      new THREE.MeshStandardMaterial({ map: problemTexture(product), roughness: 0.85, transparent: true, side: THREE.DoubleSide }),
    );
    sheet.castShadow = true;
    group.add(sheet);
    const device = buildDevice(product, deviceMats);
    group.add(device.group);

    // Each part goes to the builder on its side of the screen; centred ones alternate.
    let tie = 0;
    const parts = device.slots.map((slot, i) => {
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(slot.size[0] * 0.96, slot.size[1] * 0.9, PART_DEPTH, 2, 0.012),
        new THREE.MeshStandardMaterial({ color: product.accent, roughness: 0.4, metalness: 0.2, emissive: new THREE.Color(product.accent), emissiveIntensity: 0.15, transparent: true }),
      );
      mesh.castShadow = true;
      group.add(mesh);
      const x = slot.center.x;
      const arm = Math.abs(x) < 0.02 ? tie++ % 2 : x < 0 ? 0 : 1;
      const world = [slot.size[0] * DEVICE_SCALE, slot.size[1] * DEVICE_SCALE];
      // Parts come out of the tote at tote size and grow to their slot on the way.
      const binScale = Math.min(1, 0.8 / world[0], 0.6 / world[1]);
      return { mesh, slot, i, arm, binScale };
    });
    [0, 1].forEach((arm) => {
      const mine = parts.filter((p) => p.arm === arm);
      mine.forEach((p, j) => {
        const start = T.build[0] + 0.02 + (j / mine.length) * BUILD_SPAN;
        p.window = [start, start + BUILD_SPAN / mine.length];
        p.lands = lerp(p.window[0], p.window[1], 0.74);
      });
    });
    // The reviewer's stamp lands inside the top-left corner of the glass (the far
    // side from the reviewer, so its own arm does not hide the verdict), on top
    // of the built parts (they stand proud of the glass and would hide it).
    const { screen } = device;
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), passStamp);
    mark.renderOrder = 15;
    const faceZ = Math.max(screen.center.z, ...device.slots.map((sl) => sl.center.z + PART_DEPTH / 2));
    mark.position
      .set(-screen.width / 2 + 0.27, screen.center.y + screen.height / 2 - 0.27, faceZ)
      .multiplyScalar(DEVICE_SCALE)
      .add(new THREE.Vector3(0, 0, 0.006));
    group.add(mark);
    return { product, group, sheet, device, parts, mark, offset: k / PRODUCTS.length };
  });
  const partsDone = (item, u) => item.parts.filter((pt) => u >= pt.lands).length;

  const sparks = createParticles({ count: 400, blending: "add" });
  root.add(sparks.points);

  // ── Post: a vignette and a lift in the blacks, before tone mapping ─────────
  const vignette = new ShaderPass(VignetteShader);
  composer.insertPass(vignette, composer.passes.length - 1);

  // ── Camera ───────────────────────────────────────────────────────────────
  // Three-quarter view down the line: the problem recedes to the left, the ship
  // beam stands big in the right foreground. Reads left to right, like the talk.
  const rig = { distance: 15.5, aspectScale: 1, snap: true };
  const LINE_LOOK = new THREE.Vector3(0.9, 1.6, 0);
  const LINE_DIR = new THREE.Vector3(0.62, 0.34, 1).normalize();
  const CLOSE_DIR = new THREE.Vector3(0.42, 0.3, 1).normalize();
  const FOLLOW_DIR = new THREE.Vector3(0.16, 0.4, 1).normalize();
  const camLook = LINE_LOOK.clone();
  const camPos = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const unsubscribeResize = stage.onResize(({ height, aspect }) => {
    sparks.resize(height, camera.fov, renderer.getPixelRatio());
    vignette.uniforms.uAspect.value = aspect;
    rig.aspectScale = aspect >= 1.7 ? 1 : THREE.MathUtils.clamp((1.7 / aspect) ** 0.85, 1, 2.1);
    rig.distance = 15.5 * rig.aspectScale;
  });

  // ── Viewer settings ──────────────────────────────────────────────────────
  const settings = { view: "line", paint: "white", mood: "shift", speed: 1 };
  // Scene time runs at the chosen speed, re-anchored on every change so it never jumps.
  const clock = { anchorTime: 0, anchorScene: 0, lastTime: 0, speed: 1 };
  const sceneTime = (time) => clock.anchorScene + (time - clock.anchorTime) * clock.speed;
  const applySettings = (next = {}) => {
    Object.assign(settings, Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)));
    const paint = FACTORY_PAINTS.find((p) => p.id === settings.paint) ?? FACTORY_PAINTS[0];
    armBody.color.set(paint.color);
    armBody.roughness = paint.roughness;
    armBody.metalness = paint.metalness;
    const mood = MOODS[settings.mood] ?? MOODS.shift;
    renderer.toneMappingExposure = mood.exposure;
    key.intensity = mood.key;
    hemi.intensity = mood.hemi;
    rim.intensity = mood.rim;
    scene.environmentIntensity = mood.env;
    scene.fog.density = mood.fog;
    floorMat.emissiveIntensity = mood.grid;
    if (stage.bloomPass) {
      // Above lit white paint, below the HDR emissives: only the lights glow.
      stage.bloomPass.strength = mood.bloom;
      stage.bloomPass.threshold = mood.threshold;
    }
    vignette.uniforms.uStrength.value = mood.vignette;
    const speed = FACTORY_SPEEDS.includes(settings.speed) ? settings.speed : 1;
    if (speed !== clock.speed) {
      clock.anchorScene = sceneTime(clock.lastTime);
      clock.anchorTime = clock.lastTime;
      clock.speed = speed;
    }
  };
  applySettings(props);

  // ── Labels ───────────────────────────────────────────────────────────────
  const anchors = FACTORY_STATIONS.map((s) => ({
    ...s,
    el: overlay?.querySelector(`[data-anchor="${s.id}"]`) ?? null,
    statusEl: overlay?.querySelector(`[data-anchor="${s.id}"] [data-status]`) ?? null,
    status: "",
    world: new THREE.Vector3(s.x, s.id === "ship" ? 3.3 : 4.6, 0),
  }));
  const projected = new THREE.Vector3();
  const setStatus = (a, text) => {
    if (a.status === text || !a.statusEl) return;
    a.status = text;
    a.statusEl.textContent = text;
  };

  const tmp = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const upHint = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const bx = new THREE.Vector3();
  const lastU = new Array(items.length).fill(-1);
  // Dev only: how far each tool contact missed its mark this frame (should be ~0).
  const debug = { miss: {} };
  if (import.meta.env?.DEV) scene.userData.factory = debug;

  /** Lay a part flat on the cups: its face looks back up the tool, its top follows `up`. */
  const holdPart = (mesh, contact, toolDir, up, scale, group) => {
    const n = tmp.copy(toolDir).negate();
    bx.crossVectors(up, n).normalize();
    upHint.crossVectors(n, bx).normalize();
    basis.makeBasis(bx, upHint, n);
    mesh.quaternion.setFromRotationMatrix(basis);
    mesh.scale.setScalar(scale);
    // The cups hold its face, so its centre sits half a part deeper along the tool.
    mesh.position.copy(contact).addScaledVector(n, -(PART_DEPTH / 2) * scale).sub(group.position);
  };

  const builderHome = (b, t, out) => {
    const bin = bins[builders.indexOf(b)];
    return out.set(bin.x - b.side * 0.1 + Math.sin(t * 0.7 + b.side) * 0.08, 1.35 + Math.sin(t * 1.1 + b.side) * 0.05, bin.z - 0.1);
  };

  const update = (time, dt) => {
    clock.lastTime = time;
    const st = sceneTime(time);
    const sdt = dt * clock.speed;
    const mood = MOODS[settings.mood] ?? MOODS.shift;

    flows.forEach((f) => (f.uniforms.uTime.value = st));
    ship.material.uniforms.uTime.value = st;
    for (let i = 0; i < ROLLERS; i++) {
      dummy.position.set(-11.6 + i * (23.2 / (ROLLERS - 1)), 0.47, 0);
      dummy.rotation.set(0, 0, -st * 2);
      dummy.updateMatrix();
      rollers.setMatrixAt(i, dummy.matrix);
    }
    rollers.instanceMatrix.needsUpdate = true;
    blinkLeds(time);

    const act = { problem: 0, spec: 0, build: 0, review: 0, charge: 0, beam: 0 };
    const status = { problem: "", spec: "", build: "", review: "", ship: "" };
    let scanning = null;
    const building = [null, null];
    let reviewing = null;

    items.forEach((item, k) => {
      const u = (st / PERIOD + item.offset) % 1;
      const visible = u < T.launch[1];
      item.group.visible = visible;
      if (!visible) {
        lastU[k] = u;
        return;
      }
      const x = lineX(u);
      const rise = easeInCubic(segment(u, ...T.launch)) * 15;
      item.group.position.set(x, BELT_Y + rise, 0);
      item.group.rotation.y = easeInCubic(segment(u, ...T.launch)) * 2;
      item.group.updateMatrixWorld(true);
      const on = (a, b) => clamp01(Math.min((u - a) / 0.015, (b - u) / 0.015));
      const { product } = item;

      // PROBLEM: the sheet, rocking on the belt.
      const toBlue = segment(u, T.spec[0] + 0.02, T.spec[1] - 0.02);
      item.sheet.visible = toBlue < 1;
      item.sheet.material.opacity = 1 - toBlue;
      item.sheet.position.set(0, 0.6 + Math.sin(st * 2 + k) * 0.02, 0.1);
      item.sheet.rotation.set(-0.35, Math.sin(st * 0.7 + k) * 0.08, Math.sin(st * 1.3 + k) * 0.04);

      // SPEC: the device fades in as a blueprint where the sheet was.
      const dev = item.device;
      const appear = easeOutBack(segment(u, T.spec[0] + 0.04, T.spec[1]));
      dev.group.visible = appear > 0.001;
      dev.group.scale.setScalar(Math.max(0.001, appear) * DEVICE_SCALE);
      dev.blueprint.material.opacity = 1;
      // BUILD: the finished UI fills in as the parts land.
      const built = segment(u, T.build[0] + 0.05, T.build[1]);
      dev.final.material.opacity = easeInOutCubic(Math.min(1, built * 1.15));
      item.parts.forEach((part) => {
        const [a, b] = part.window;
        part.mesh.visible = u >= a && u < T.launch[1];
        if (!part.mesh.visible) return;
        if (u < part.lands) {
          if (u < b && !building[part.arm]) building[part.arm] = { item, part, w: segment(u, a, b) };
        } else {
          part.mesh.position.copy(part.slot.center).multiplyScalar(DEVICE_SCALE);
          part.mesh.position.z += (PART_DEPTH / 2) * DEVICE_SCALE - 0.03;
          part.mesh.quaternion.identity();
          part.mesh.scale.setScalar(DEVICE_SCALE);
          // Landing sparks, once.
          if (lastU[k] >= 0 && lastU[k] < part.lands && sdt > 0) {
            tmp.copy(part.mesh.position).add(item.group.position);
            for (let s = 0; s < 10; s++) {
              const ang = hash(part.i * 13 + s + k) * Math.PI * 2;
              sparks.emit({
                position: [tmp.x, tmp.y, tmp.z + 0.05],
                velocity: [Math.cos(ang) * 2, 1 + hash(s + part.i) * 2.5, Math.sin(ang) * 1.2 + 1],
                life: 0.5,
                size: 0.05,
                gravity: 9,
                drag: 1.5,
                color: s % 3 ? AMBER : "#ffffff",
                intensity: 4,
              });
            }
          }
        }
        // A placed part dissolves into the screen: it becomes that piece of the UI.
        part.mesh.material.opacity = 1 - segment(u, part.lands + 0.005, part.lands + 0.035) * 0.92;
      });

      act.problem = Math.max(act.problem, on(...T.problem));
      act.spec = Math.max(act.spec, on(...T.spec));
      act.build = Math.max(act.build, on(...T.build));
      act.review = Math.max(act.review, on(...T.review));
      if (u >= T.charge[0] && u < T.launch[1]) {
        act.charge = Math.max(act.charge, segment(u, ...T.charge));
        act.beam = Math.max(act.beam, segment(u, T.launch[0], T.launch[0] + 0.01) * (1 - segment(u, T.launch[1] - 0.03, T.launch[1])));
      }

      // Station statuses name the job in flight.
      if (on(...T.problem) > 0.5) status.problem = `want: ${product.outcome}`;
      if (on(...T.spec) > 0.5) status.spec = `spec · ${product.name}`;
      if (on(...T.build) > 0.5) status.build = `${product.name} · ${partsDone(item, u)}/${item.parts.length}`;
      if (on(...T.review) > 0.5) status.review = segment(u, ...T.review) < 0.55 ? "1 failing ▸ fixing" : "all tests green";
      if (u >= T.charge[0]) status.ship = u >= T.launch[0] ? `live: ${product.outcome}` : "deploying";

      // SPEC: the scanner hovers over the item, lens on it, sweeping.
      if (u >= T.spec[0] && u < T.spec[1]) {
        const sweep = Math.sin(segment(u, ...T.spec) * Math.PI * 3) * 0.35;
        scanning = { x, sweep };
      }
      // REVIEW: the stamp presses onto the glass: red first, then green after the fix.
      const r = segment(u, ...T.review);
      const passed = r >= 0.62;
      item.mark.visible = u >= T.review[0] && (r >= 0.16 || u >= T.review[1]) && u < T.launch[1];
      item.mark.material = passed ? passStamp : failStamp;
      const inked = passed ? segment(r, 0.62, 0.7) : segment(r, 0.16, 0.24);
      item.mark.scale.setScalar(u >= T.review[1] ? 1 : lerp(1.12, 1, easeOutCubic(inked)));
      if (u >= T.review[0] && u < T.review[1]) reviewing = { item, r, passed };

      // Launch trail.
      if (u >= T.launch[0] && u < T.launch[1] - 0.02 && sdt > 0) {
        for (let s = 0; s < 3; s++) {
          sparks.emit({
            position: [x + (Math.random() - 0.5), BELT_Y + rise, (Math.random() - 0.5) * 0.8],
            velocity: [(Math.random() - 0.5) * 0.6, -2 - Math.random() * 2, 0],
            life: 0.7,
            size: 0.09,
            drag: 2,
            color: "#7ffff0",
            intensity: 3,
          });
        }
      }
      lastU[k] = u;
    });

    // ── The crew ──
    // Investigator: lens over the item, pointed at it; idles over the line between jobs.
    if (scanning) {
      pos.set(scanning.x + scanning.sweep, BELT_Y + 1.75, 0.35);
      tip.set(scanning.x + scanning.sweep * 0.5, BELT_Y + 0.65, 0.1);
      dir.subVectors(tip, pos).normalize();
    } else {
      pos.set(SPEC_X + Math.sin(st * 0.6) * 0.4, 2.6 + Math.sin(st * 0.9) * 0.1, -0.3);
      dir.set(0.15, -1, 0.35).normalize();
    }
    debug.miss.investigator = investigator.aim(pos, dir);
    scanBeam.visible = Boolean(scanning);
    if (scanning) {
      investigator.contactWorld(tmp);
      const len = tmp.distanceTo(tip);
      scanBeam.position.copy(tmp);
      scanBeam.scale.set(1, len, 1);
      scanBeam.quaternion.setFromUnitVectors(UP, dir.subVectors(tip, tmp).normalize());
      scanBeam.material.uniforms.uIntensity.value = 0.9 * act.spec;
      scanBeam.material.uniforms.uTime.value = st;
    }

    // Builders: pick from the tote, carry, press onto the slot, release, back to the tote.
    builders.forEach((b, i) => {
      const home = builderHome(b, st, new THREE.Vector3());
      const job = building[i];
      if (!job) {
        debug.miss[`builder${i}`] = b.aim(home, DOWN);
        b.grip(1);
        return;
      }
      const { item, part, w } = job;
      const bin = bins[i];
      const slot = tmp.copy(part.slot.center).multiplyScalar(DEVICE_SCALE).add(item.group.position);
      const contact = slot.clone().setZ(slot.z + PART_DEPTH * DEVICE_SCALE - 0.03);
      const inTote = part.binScale * DEVICE_SCALE;
      const pick = bin.clone().setY(bin.y + PART_DEPTH * inTote);
      const approach = contact.clone().setZ(contact.z + 0.45);
      const keys = [
        { t: 0, p: home, d: DOWN },
        { t: 0.12, p: pick, d: DOWN },
        { t: 0.24, p: home, d: DOWN },
        { t: 0.62, p: approach, d: INTO_SCREEN, arc: 0.5 },
        { t: 0.74, p: contact, d: INTO_SCREEN },
        { t: 0.8, p: contact, d: INTO_SCREEN },
        { t: 0.88, p: approach, d: INTO_SCREEN },
        { t: 1, p: home, d: DOWN, arc: 0.3 },
      ];
      pathAt(keys, w, pos, dir);
      const up = upHint.crossVectors(X_AXIS, dir).normalize().clone();
      debug.miss[`builder${i}`] = b.aim(pos, dir, up);
      const holding = w >= 0.12 && w < 0.74;
      b.grip(holding ? 0 : 1);
      if (w < 0.74) {
        // In the tote until the cups take it; then drawn on the cups, exactly.
        const grow = lerp(part.binScale, 1, easeInOutCubic(segment(w, 0.3, 0.62))) * DEVICE_SCALE;
        if (holding) b.contactWorld(tip);
        else tip.copy(pick);
        if (holding) holdPart(part.mesh, tip, dir, up, grow, item.group);
        else holdPart(part.mesh, tip, DOWN, TOTE_UP, inTote, item.group);
      }
    });

    // Reviewer: stamp face flat on the glass, twice.
    {
      const idle = new THREE.Vector3(reviewer.root.position.x - 0.5 + Math.sin(st * 0.8) * 0.15, 1.9, FRONT_Z - 0.55);
      const stampColor = reviewing && !reviewing.passed ? RED : GREEN;
      reviewer.glow.color.copy(hdr(stampColor, 3));
      if (reviewing) {
        const { item, r } = reviewing;
        const contact = item.mark.position.clone().add(item.group.position);
        contact.z -= 0.004;
        const away = contact.clone().setZ(contact.z + 0.5);
        const press = (c) => c.clone().setZ(c.z - 0.006);
        // Between stamps the head waits up and off to the side, out of the line
        // of sight, so the verdict on the glass stays readable.
        const clear = contact.clone().add(tmp.set(0.45, 0.95, 0.35));
        const keys = [
          { t: 0, p: idle, d: DOWN },
          { t: 0.08, p: away, d: INTO_SCREEN, arc: 0.2 },
          { t: 0.16, p: contact, d: INTO_SCREEN },
          { t: 0.2, p: press(contact), d: INTO_SCREEN },
          { t: 0.25, p: away, d: INTO_SCREEN },
          { t: 0.32, p: clear, d: DOWN },
          { t: 0.5, p: clear, d: DOWN },
          { t: 0.56, p: away, d: INTO_SCREEN },
          { t: 0.62, p: contact, d: INTO_SCREEN },
          { t: 0.66, p: press(contact), d: INTO_SCREEN },
          { t: 0.71, p: away, d: INTO_SCREEN },
          { t: 0.8, p: clear, d: DOWN },
          { t: 1, p: idle, d: DOWN, arc: 0.2 },
        ];
        pathAt(keys, r, pos, dir);
        debug.miss.reviewer = reviewer.aim(pos, dir, UP);
      } else {
        debug.miss.reviewer = reviewer.aim(idle, DOWN);
      }
    }

    // ── Lamps, beam, rings ──
    const lamp = (i, a, extra = 0) => {
      pools[i].light.intensity = mood.spot * (0.25 + a * 0.75) + extra;
      pools[i].stripMat.color.copy(pools[i].color).multiplyScalar(0.5 + a * 2.5);
    };
    lamp(0, act.problem);
    lamp(1, act.spec);
    lamp(2, act.build * (0.85 + Math.random() * 0.15));
    lamp(3, act.review);
    lamp(4, Math.max(act.charge, act.beam), act.beam * mood.spot);
    shipRings.forEach(({ ring, mat }, i) => {
      ring.rotation.z = st * (0.4 + i * 0.3) * (1 + act.charge * 6) * (i % 2 ? -1 : 1);
      mat.color.copy(hdr(CYAN, 0.8 + act.charge * 4 + act.beam * 3));
    });
    ship.material.uniforms.uIntensity.value = act.beam * 1.1;
    ship.visible = act.beam > 0.001;
    sparks.step(sdt);

    // ── Agents ──
    patrol(COURIER, 24, st, courierState);
    courier.root.position.set(courierState.x, 0, courierState.z);
    courier.root.rotation.y = courierState.yaw;
    courier.update(st, { speed: courierState.speed, armsUp: 1, lookPitch: courierState.stopped ? 0.25 : 0 });
    patrol(TECH, 21, st + 3, techState);
    tech.root.position.set(techState.x, 0, techState.z);
    tech.root.rotation.y = techState.yaw;
    tech.update(st, {
      speed: techState.speed,
      armsUp: techState.stopped ? 0.55 : 0,
      scan: techState.stopped ? 1 : 0,
      lookPitch: techState.stopped ? -0.35 + Math.sin(st * 0.9) * 0.3 : 0,
    });
    {
      // The clerk watches whatever is on the intake, arms out while a problem is handed over.
      const nearest = items.reduce((best, it) => (it.group.visible && Math.abs(it.group.position.x - PROBLEM_X) < Math.abs((best?.group.position.x ?? 99) - PROBLEM_X) ? it : best), null);
      const dx = nearest ? nearest.group.position.x - clerk.root.position.x : 0;
      clerk.root.rotation.y = 0.15;
      clerk.update(st, { armsUp: act.problem * 0.7, lookYaw: THREE.MathUtils.clamp(Math.atan2(dx, 1.7), -0.8, 0.8) - 0.15, lookPitch: 0.25, scan: act.problem });
    }
    // The chief watches the build while there is one, the review otherwise; now and then he takes a call.
    const watch = act.build > 0.2 ? FACTORY_STATIONS[2].x : act.review > 0.2 ? FACTORY_STATIONS[3].x : FACTORY_STATIONS[1].x;
    // Hand up in under a second, a few seconds listening, hand back down.
    const callT = st % 13;
    const call = easeInOutCubic(segment(callT, 7, 7.9)) * (1 - easeInOutCubic(segment(callT, 10.4, 11.3)));
    chief.update(st, tmp.set(watch, 1.6, 0.2), call);

    // ── Camera ──
    const station = FACTORY_STATIONS.find((s) => s.id === settings.view);
    if (settings.view === "chief") {
      // Head and shoulders, from where he is looking, a little off his left cheek.
      chief.head.getWorldPosition(wantLook);
      wantLook.y += 0.02;
      chief.head.getWorldDirection(tmp);
      tmp.y = 0;
      tmp.normalize().applyAxisAngle(UP, 0.35);
      wantPos.copy(tmp).multiplyScalar(2.1).add(wantLook);
      wantPos.y += 0.1;
    } else if (station) {
      wantLook.set(station.x + 0.2, 1.7, 0.4);
      wantPos.copy(CLOSE_DIR).multiplyScalar(8.5 * rig.aspectScale).add(wantLook);
    } else if (settings.view === "follow") {
      // A crane shot over the crew's shoulders on the job furthest along. It watches
      // liftoff begin, then hands over to the next job instead of chasing the launch.
      let leadU = -1;
      items.forEach((it) => {
        const u = (st / PERIOD + it.offset) % 1;
        if (u < T.launch[0] + 0.04 && u > leadU) leadU = u;
      });
      const lift = segment(leadU, T.launch[0], T.launch[0] + 0.04);
      wantLook.set(lineX(Math.min(leadU + 0.012, T.launch[0])) + 0.1, BELT_Y + 0.35 + lift * 0.6, 0.2);
      wantPos.copy(FOLLOW_DIR).multiplyScalar(7.4 * rig.aspectScale).add(wantLook);
    } else {
      wantLook.copy(LINE_LOOK);
      wantPos.copy(LINE_DIR).multiplyScalar(rig.distance).add(wantLook);
      wantPos.x += Math.sin(time * 0.06) * 0.8;
    }
    const ease = rig.snap || dt === 0 ? 1 : 1 - Math.exp(-dt * (settings.view === "follow" ? 3.6 : 2.2));
    rig.snap = false;
    camLook.lerp(wantLook, ease);
    camPos.lerp(wantPos, ease);
    camera.position.copy(camPos);
    camera.position.x += pointer.x * 0.9;
    camera.position.y += pointer.y * 0.6;
    camera.lookAt(camLook);
    camera.updateMatrixWorld();

    setStatus(anchors[0], status.problem || "inbox");
    setStatus(anchors[1], status.spec || "ready");
    setStatus(anchors[2], status.build || "standby");
    setStatus(anchors[3], status.review || "armed");
    setStatus(anchors[4], status.ship || "on deck");
    const hot = [act.problem, act.spec, act.build, act.review, Math.max(act.charge, act.beam)];
    anchors.forEach((a, i) => {
      if (!a.el) return;
      projected.copy(a.world).project(camera);
      const inView = projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05;
      a.el.style.visibility = inView ? "" : "hidden";
      a.el.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`;
      a.el.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
      a.el.toggleAttribute("data-hot", hot[i] > 0.5);
    });
  };

  return {
    update,
    setProps(next) {
      applySettings(next);
    },
    dispose() {
      unsubscribeResize();
      composer.removePass(vignette);
      vignette.dispose?.();
      tapeTex.dispose();
      delete scene.userData.factory;
    },
  };
};
