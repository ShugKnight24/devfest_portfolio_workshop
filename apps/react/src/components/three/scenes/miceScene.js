import * as THREE from "three";
import { easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, lightBeam, segment, smoothstep } from "../kit";
import { INK, PAPER, outline } from "../ink";
import { buildDaisy, createInkWorld } from "../rezeKit";

/**
 * City mouse, or country mouse? Different dreams, different paths, both valid.
 *
 * Two panels, one gutter, the same beats at the same moments on both sides.
 * Left, the country: Reze as a mouse by her cottage. Right, the city: Denji
 * as a mouse at his café table under the neon. Each wants something else, so
 * each does something else to get there, and each ends up happy.
 *
 *   0  – 2.6   the dream: a thought bubble over each. A daisy for her, a
 *              slice of toast for him. His plate is empty; her bed is bare.
 *   2.6 – 6.6  set out: she walks, slow and steady, to the seed sack and back
 *              to her garden. He darts from one neon pool to the next and
 *              climbs the crates to the toaster on the sill.
 *   6.6 – 9.8  work for it: she kneels, plants, pats the soil, waters; a
 *              sprout comes up. He grabs the toast, holds it up, and hops
 *              back down with it on his head.
 *   9.8 – 11.5 arrive: both back where they started, each with the thing
 *              they dreamed of. The daisy blooms; the toast reaches the table.
 *   11.5 – 16  enjoy: dusk and fireflies over her garden, she sits content;
 *              the skyline glows, he eats every bite.
 *   15 – 16    the loop: the daisy folds for the night and a new morning
 *              comes; the last bite goes and the toaster pops a fresh slice.
 *
 * Reduced motion holds 12.8 s: both dreams still in their bubbles, both come
 * true beneath them.
 */

const CYCLE = 16;
const STATIC_AT = 12.8;
const TAU = Math.PI * 2;

const COUNTRY = { ground: "#e8b778", lines: "#fff1d6", accent: "#ff9f6b", rim: "#fff1d6", shade: "#c9a07e" };
const COUNTRY_DUSK = { ground: "#8e5a7c", lines: "#ffc9a8", accent: "#ff8a6b", rim: "#ffb27e", shade: "#7a68a0" };
const CITY = { ground: "#17122b", lines: "#ff7ad9", accent: "#3fe0ff", rim: "#ff7ad9", shade: "#7a5fa8" };
const CITY_X = 60;

const wrapAngle = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);
/** Heading (rotation.y) from one [x, z] spot to another; the mice face +z. */
const face = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2]);

/**
 * Where a mouse is at `c` along its keys: [time, [x, y, z], heading, hop].
 * `hop` is the arc height of the move that ends on that key.
 */
const track = (keys, c, ease) => {
  let i = 0;
  while (i < keys.length - 2 && c >= keys[i + 1][0]) i++;
  const [t0, a, ra] = keys[i];
  const [t1, b, rb, hop = 0] = keys[i + 1];
  const u = segment(c, t0, t1);
  const e = ease(u);
  const dist = Math.hypot(b[0] - a[0], b[2] - a[2]);
  return {
    x: lerp(a[0], b[0], e),
    y: lerp(a[1], b[1], e) + hop * Math.sin(Math.PI * u),
    z: lerp(a[2], b[2], e),
    ry: ra + wrapAngle(rb - ra) * e,
    moving: dist > 0.3 && u > 0 && u < 1,
    airborne: hop > 0 && u > 0 && u < 1,
    t0,
  };
};

/**
 * A storybook mouse standing on its hind legs, dressed as one of them.
 * Returns the parts that move: head, ears, tail, both arms and both feet.
 */
const buildMouse = (w, { fur, clothes, collar, tie, belt, choker, hair }) => {
  const g = new THREE.Group();
  g.rotation.order = "YXZ";
  const furMat = w.ink({ tint: fur, tone: 0.95, rim: 1.2 });
  const pink = w.ink({ tint: "#f2a7b4", tone: 1, rim: 0.4 });
  const cloth = w.ink({ tint: clothes, tone: 0.9, rim: 1 });
  const add = (geo, mat, pos, scale = [1, 1, 1], parent = g, line = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    parent.add(m);
    if (line) outline(m, w.line);
    return m;
  };

  // Body in its clothes; feet and a fur neck.
  add(new THREE.SphereGeometry(0.5, 28, 20), cloth, [0, 0.62, 0], [0.78, 1, 0.72]);
  const feet = [-1, 1].map((s) => add(new THREE.SphereGeometry(0.13, 14, 10), furMat, [s * 0.18, 0.08, 0.12], [0.9, 0.55, 1.5]));
  if (collar) for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.16, 0.07, 0.03), w.ink({ tint: collar, tone: 1.1, rim: 0.5 }), [s * 0.08, 1.02, 0.28], [1, 1, 1]).rotation.set(-0.3, s * 0.4, s * -0.5);
  if (tie) add(new THREE.BoxGeometry(0.08, 0.42, 0.02), w.ink({ tint: tie, tone: 0.5, rim: 0.8 }), [0, 0.78, 0.36]).rotation.x = -0.18;
  if (belt) add(new THREE.TorusGeometry(0.39, 0.035, 6, 32), w.ink({ tint: belt, tone: 0.8, rim: 0.6 }), [0, 0.42, 0], [1, 0.92, 0.95], g, false).rotation.x = Math.PI / 2;

  // Head, snout, nose, eyes, whiskers.
  const head = new THREE.Group();
  head.position.set(0, 1.2, 0.02);
  g.add(head);
  add(new THREE.SphereGeometry(0.36, 28, 20), furMat, [0, 0, 0], [1, 0.95, 1.02], head);
  add(new THREE.SphereGeometry(0.17, 18, 12), furMat, [0, -0.08, 0.3], [1, 0.82, 1.25], head);
  add(new THREE.SphereGeometry(0.05, 12, 8), pink, [0, -0.06, 0.5], [1, 1, 1], head, false);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.055, 12, 8), w.flat, [s * 0.14, 0.06, 0.29], [1, 1.2, 0.6], head, false);
    add(new THREE.SphereGeometry(0.016, 8, 6), w.ink({ tint: PAPER, tone: 1.4, rim: 0 }), [s * 0.14 + 0.015, 0.085, 0.32], [1, 1, 1], head, false);
    for (let k = 0; k < 3; k++) {
      const wh = add(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 4), w.flat, [s * 0.2, -0.08 + k * 0.03, 0.4], [1, 1, 1], head, false);
      wh.rotation.z = s * (Math.PI / 2 - 0.15 + k * 0.15);
    }
  }
  // Big round ears.
  const ears = [-1, 1].map((s) => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.27, 0.3, -0.04);
    head.add(ear);
    add(new THREE.SphereGeometry(0.22, 20, 14), furMat, [0, 0.08, 0], [1, 1, 0.28], ear);
    add(new THREE.SphereGeometry(0.15, 16, 10), pink, [0, 0.08, 0.04], [1, 1, 0.2], ear, false);
    return ear;
  });

  // Hair, in their styles.
  if (hair === "spikes") {
    const blond = w.ink({ tint: "#e3a849", tone: 1, rim: 0.8 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 2.2;
      const spike = add(new THREE.ConeGeometry(0.09, 0.3, 6), blond, [Math.sin(a) * 0.2, 0.32 - Math.abs(a) * 0.06, 0.06 + Math.cos(a) * 0.12], [1, 1, 1], head);
      spike.rotation.set(0.7, 0, -a * 0.55);
    }
  } else if (hair === "bob") {
    const violet = w.ink({ tint: "#2a2140", tone: 0.8, rim: 1.2 });
    // A cap over the crown and down the back and sides, open at the face.
    // (phi = π/2 faces +z, so the gap is centred there.)
    // Open shells take no outline: its inside would show through the gap as stripes.
    violet.side = THREE.DoubleSide;
    add(new THREE.SphereGeometry(0.385, 28, 18, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI * 0.6), violet, [0, 0.03, -0.03], [1.03, 1, 1.03], head, false);
    // A fringe: one curved slab over the forehead, stopping above the eyes.
    add(new THREE.SphereGeometry(0.415, 28, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.1, Math.PI * 0.24), violet, [0, 0.03, 0], [1, 1, 1.02], head, false);
  }
  if (choker) {
    add(new THREE.TorusGeometry(0.17, 0.025, 8, 28), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }), [0, 1.0, 0.02], [1, 1, 1], g, false).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.035, 0.009, 6, 16), w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 }), [0, 0.95, 0.19], [1, 1, 1], g, false);
  }

  // Arms (pivot at the shoulder) and the tail.
  const arms = [-1, 1].map((s) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 0.88, 0.08);
    g.add(arm);
    add(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), cloth, [0, -0.15, 0], [1, 1, 1], arm);
    add(new THREE.SphereGeometry(0.065, 10, 8), furMat, [0, -0.33, 0], [1, 1, 1], arm);
    return arm;
  });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.25, -0.32),
    new THREE.Vector3(0, 0.12, -0.6),
    new THREE.Vector3(0.15, 0.1, -0.9),
    new THREE.Vector3(0.35, 0.3, -1.1),
    new THREE.Vector3(0.3, 0.5, -1.25),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.028, 8), pink);
  g.add(tail);
  outline(tail, w.line);
  return { group: g, head, ears, arms, feet, tail };
};

const box = (w, size, pos, tint, tone = 0.8, parent, line = false) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), w.ink({ tint, tone, rim: 0.6 }));
  m.position.set(...pos);
  parent.add(m);
  if (line) outline(m, w.line);
  return m;
};
const glow = (color) => new THREE.MeshBasicMaterial({ color });
const softGlow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

/** A big slice of toast, upright, jam side to +z. Centred on the bread. */
const buildToast = (w, line = true) => {
  const g = new THREE.Group();
  const crust = w.ink({ tint: "#b8732e", tone: 0.9, rim: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.07), crust);
  g.add(body);
  // The domed top of a sandwich loaf: a half-disc on the slice.
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.07, 24, 1, false, Math.PI / 2, Math.PI), crust);
  dome.rotation.x = Math.PI / 2;
  dome.position.y = 0.2;
  g.add(dome);
  if (line) [body, dome].forEach((m) => outline(m, w.line));
  const crumb = w.ink({ tint: "#f0c27a", tone: 1.05, rim: 0.4 });
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.02), crumb);
  inner.position.set(0, -0.01, 0.03);
  g.add(inner);
  const innerDome = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24, 1, false, Math.PI / 2, Math.PI), crumb);
  innerDome.rotation.x = Math.PI / 2;
  innerDome.position.set(0, 0.16, 0.03);
  g.add(innerDome);
  // Jam, spread to the edges, a drip off the side.
  const jamMat = w.ink({ tint: "#c8102e", tone: 0.95, rim: 0.9 });
  const jam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.015), jamMat);
  jam.position.set(0, 0.01, 0.045);
  g.add(jam);
  const drip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), jamMat);
  drip.position.set(0.12, -0.15, 0.05);
  drip.scale.set(0.8, 1.4, 0.4);
  g.add(drip);
  return g;
};

/** A thought bubble: three puffs, two dots trailing down-left, the dream inside. */
const buildBubble = (w, icon, haloColor) => {
  const g = new THREE.Group();
  const cloud = w.ink({ tint: "#ffffff", tone: 1.2, rim: 0.3 });
  const puffs = new THREE.Group();
  g.add(puffs);
  for (const [x, y, r] of [[0, 0, 0.27], [-0.2, -0.04, 0.19], [0.2, -0.03, 0.2], [-0.1, 0.13, 0.17], [0.12, 0.12, 0.18]]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloud);
    p.position.set(x, y, 0);
    p.scale.z = 0.35;
    puffs.add(p);
    outline(p, w.line);
  }
  const dots = [[-0.3, -0.3, 0.06], [-0.42, -0.44, 0.04]].map(([x, y, r]) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), cloud);
    d.position.set(x, y, 0);
    g.add(d);
    outline(d, w.line);
    return d;
  });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), softGlow(haloColor, 0.5));
  halo.position.z = 0.1;
  puffs.add(halo);
  icon.position.z = 0.14;
  puffs.add(icon);
  return { group: g, puffs, dots, halo, icon };
};

/** A ring of glints that blooms out and fades: the dream, come true. */
const buildSparkle = (color) => {
  const g = new THREE.Group();
  const mat = softGlow(color, 1);
  const dots = Array.from({ length: 10 }, (_, i) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(i % 2 ? 0.02 : 0.032, 8, 6), mat);
    g.add(d);
    return d;
  });
  return {
    group: g,
    update(u) {
      g.visible = u > 0 && u < 1;
      if (!g.visible) return;
      const r = 0.12 + easeOutCubic(u) * 0.45;
      dots.forEach((d, i) => {
        const a = (i / dots.length) * TAU + u * 0.8;
        d.position.set(Math.cos(a) * r * (i % 2 ? 0.75 : 1), Math.sin(a) * r * (i % 2 ? 0.75 : 1), 0);
      });
      mat.opacity = 1 - easeInCubic(u);
    },
  };
};

/** Small tail and ear life every mouse has, whatever it is doing. */
const idle = (m, t, phase, rate = 1) => {
  m.tail.rotation.y = Math.sin(t * 1.6 * rate + phase) * 0.25;
  m.ears.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * (0.05 + Math.max(0, Math.sin(t * 3.1 + phase * 2 + i)) * 0.12)));
};

/** Arms as [pitch, spread]: pitch < 0 lifts forward, spread > 0 opens outward. */
const setArms = (m, a0, a1) => {
  m.arms[0].rotation.set(a0[0], 0, -a0[1]);
  m.arms[1].rotation.set(a1[0], 0, a1[1]);
};
const mix = (arm, target, k) => {
  arm[0] = lerp(arm[0], target[0], k);
  arm[1] = lerp(arm[1], target[1], k);
};
/** Feet: a walk cycle from `gait` in [-1, 1], or tucked forward when seated. */
const setFeet = (m, gait, seated) => {
  m.feet.forEach((f, i) => {
    const s = i ? -1 : 1;
    f.position.set(f.position.x, 0.08 + Math.max(0, s * gait) * 0.05 + seated * 0.06, lerp(0.12 + s * gait * 0.09, 0.3, seated));
  });
};

// ── The paths ──
// Country: bench, seed sack, the garden bed, back to the bench. She is wider
// than the bench is deep, so she never cuts across it: down off the front,
// along the front, round its right end to the sack behind, and the same way
// home. The bench sits left of the bed, clear of where she kneels.
const R_BENCH = [-1.1, 0.25, 0.25];
const R_UP = [-1.1, 0, 0.88];
const R_TURN = [-0.2, 0, 0.75];
const R_SACK = [-0.25, 0, -0.4];
const R_KNEEL = [-0.2, 0, 0.6];
const R_BACK = [-0.35, 0, 0.95];
const R_SEAT = 0.6;
const SACK_AT = [-0.4, 0.24, -0.95];
const REZE_KEYS = [
  [0, R_BENCH, R_SEAT],
  [2.6, R_BENCH, R_SEAT],
  [3.0, R_UP, R_SEAT, 0.18],
  [3.1, R_UP, face(R_UP, R_TURN)],
  [3.75, R_TURN, face(R_TURN, R_SACK)],
  [4.6, R_SACK, face(R_TURN, R_SACK)],
  [5.2, R_SACK, face(R_TURN, R_SACK)],
  [5.45, R_SACK, face(R_SACK, R_KNEEL)],
  [6.6, R_KNEEL, face(R_SACK, R_KNEEL)],
  [6.85, R_KNEEL, Math.PI / 2],
  [9.8, R_KNEEL, Math.PI / 2],
  [10.05, R_KNEEL, face(R_KNEEL, R_BACK)],
  [10.45, R_BACK, face(R_BACK, R_UP)],
  [11.0, R_UP, face(R_BACK, R_UP)],
  [11.2, R_UP, R_SEAT],
  [11.5, R_BENCH, R_SEAT, 0.18],
  [CYCLE, R_BENCH, R_SEAT],
];
const DAISY_AT = [0.2, 0.08, 0.6];

// City: stool, three neon pools, the crates, the sill, and back.
const D_STOOL = [0.15, 0.27, 0.85];
const D_DOWN = [-0.15, 0, 1.25];
const D_P1 = [-0.65, 0, 0.35];
const D_P2 = [0.35, 0, -0.45];
const D_P3 = [-1.15, 0, -0.85];
const D_C1 = [-1.2, 0.6, -1.3];
const D_C2 = [-1.3, 1.1, -1.62];
const D_G = [-0.95, 0, -0.75];
const D_P1B = [-0.5, 0, 0.25];
const D_SEAT = 0.5;
const DENJI_KEYS = [
  [0, D_STOOL, D_SEAT],
  [2.6, D_STOOL, D_SEAT],
  [2.72, D_STOOL, face(D_STOOL, D_DOWN)],
  [3.0, D_DOWN, face(D_STOOL, D_DOWN), 0.25],
  [3.1, D_DOWN, face(D_DOWN, D_P1)],
  [3.42, D_P1, face(D_DOWN, D_P1), 0.05],
  [3.75, D_P1, face(D_DOWN, D_P1)],
  [3.85, D_P1, face(D_P1, D_P2)],
  [4.15, D_P2, face(D_P1, D_P2), 0.05],
  [4.5, D_P2, face(D_P1, D_P2)],
  [4.6, D_P2, face(D_P2, D_P3)],
  [4.95, D_P3, face(D_P2, D_P3), 0.05],
  [5.1, D_P3, Math.PI],
  [5.45, D_C1, Math.PI, 0.45],
  [5.75, D_C1, Math.PI],
  [6.15, D_C2, Math.PI, 0.45],
  [7.15, D_C2, Math.PI],
  [7.5, D_C2, 0.35],
  [7.85, D_C2, 0.35, 0.3],
  [8.05, D_C2, 0.35],
  [8.4, D_C1, 0.35, 0.3],
  [8.85, D_G, 0.35, 0.3],
  [8.95, D_G, face(D_G, D_P1B)],
  [9.4, D_P1B, face(D_G, D_P1B), 0.05],
  [9.55, D_P1B, face(D_P1B, D_DOWN)],
  [10.0, D_DOWN, face(D_P1B, D_DOWN), 0.05],
  [10.5, D_DOWN, 0.2],
  [11.0, D_STOOL, D_SEAT, 0.35],
  [CYCLE, D_STOOL, D_SEAT],
];
const TOASTER_AT = [-1.3, 1.73, -2.12];
const TOAST_REST = [TOASTER_AT[0], 1.93, TOASTER_AT[2]];

export const createMiceScene = (stage, { overlay } = {}) => {
  const { camera: camL, renderer, staticMode } = stage;
  const camR = new THREE.PerspectiveCamera(camL.fov, 1, 0.1, 200);
  const w = createInkWorld(stage);
  w.page({ mode: "still" });
  const v = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  // ── The country ──
  const country = new THREE.Group();
  w.scene.add(country);
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), w.ink({ tint: "#8dbd5f", tone: 0.95, rim: 0.3 }));
  meadow.rotation.x = -Math.PI / 2;
  country.add(meadow);
  for (const [x, z, r] of [[-6, -9, 4.5], [3, -11, 5.5], [9, -8, 3.5]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: "#6fa24c", tone: 0.85, rim: 0.4 }));
    hill.position.set(x, -0.2, z);
    hill.scale.y = 0.45;
    country.add(hill);
  }
  // The cottage, its window lit.
  const cottage = new THREE.Group();
  cottage.position.set(-2.6, 0, -3.4);
  country.add(cottage);
  box(w, [2, 1.5, 1.6], [0, 0.75, 0], "#f3e3c3", 0.95, cottage);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1, 4), w.ink({ tint: "#b5523b", tone: 0.85, rim: 0.6 }));
  roof.position.y = 2;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.85;
  cottage.add(roof);
  const litColor = new THREE.Color("#ffd27a");
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glow(litColor.clone()));
  lit.position.set(0.45, 0.85, 0.81);
  cottage.add(lit);
  box(w, [0.4, 0.8, 0.04], [-0.4, 0.4, 0.81], "#7a4a2a", 0.8, cottage);
  for (let i = 0; i < 8; i++) box(w, [0.06, 0.55, 0.06], [-4.2 + i * 0.55, 0.27, -1.6], "#c9a36f", 0.9, country);
  box(w, [4.2, 0.05, 0.04], [-2.3, 0.42, -1.6], "#c9a36f", 0.9, country);
  // Buttercups across the meadow, kept off the path she walks.
  const cup = w.ink({ tint: "#ffcf3a", tone: 1.05, rim: 0.4 });
  const stemMat = w.ink({ tint: "#4f8a3a", tone: 0.6, rim: 0.3 });
  const cupGeo = new THREE.SphereGeometry(0.04, 8, 6);
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.008, 0.2, 5);
  const buttercups = [];
  for (let i = 0; i < 90; i++) {
    const x = -4 + hash(i) * 7.5;
    const z = -2.4 + hash(i + 50) * 4.6;
    if (x > -2.1 && x < 1.3 && z > -1.2 && z < 1.7) continue;
    const f = new THREE.Group();
    f.position.set(x, 0.1, z);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    f.add(stem);
    const head = new THREE.Mesh(cupGeo, cup);
    head.position.y = 0.1;
    head.scale.y = 0.7;
    f.add(head);
    country.add(f);
    buttercups.push(f);
  }
  // Her bench by the door.
  const wood = "#a8763f";
  box(w, [1.0, 0.07, 0.45], [R_BENCH[0], 0.33, R_BENCH[2] - 0.05], wood, 0.9, country, true);
  for (const s of [-1, 1]) box(w, [0.07, 0.3, 0.38], [R_BENCH[0] + s * 0.42, 0.15, R_BENCH[2] - 0.05], wood, 0.75, country);
  // The seed sack, slumped behind the bench.
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), w.ink({ tint: "#d9b98a", tone: 0.95, rim: 0.6 }));
  sack.position.set(...SACK_AT);
  sack.scale.set(1, 0.95, 0.9);
  country.add(sack);
  outline(sack, w.line);
  const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.12, 12), w.ink({ tint: "#c9a36f", tone: 0.9, rim: 0.6 }));
  tie.position.set(SACK_AT[0], 0.52, SACK_AT[2]);
  country.add(tie);
  // The garden bed: soil in a wooden frame, a few greens she already grows.
  const bed = new THREE.Group();
  bed.position.set(0.45, 0, 0.6);
  country.add(bed);
  box(w, [1.0, 0.08, 0.55], [0, 0.04, 0], "#6b4a2f", 0.8, bed);
  for (const [sx, sz, lx, lz] of [[0, -0.29, 1.08, 0.05], [0, 0.29, 1.08, 0.05], [-0.52, 0, 0.05, 0.6], [0.52, 0, 0.05, 0.6]]) box(w, [lx, 0.12, lz], [sx, 0.06, sz], wood, 0.85, bed);
  const leafy = w.ink({ tint: "#5aa83c", tone: 1, rim: 0.6 });
  for (const [x, z] of [[0.3, -0.13], [0.3, 0.13], [0.05, -0.15]]) {
    const lettuce = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), leafy);
    lettuce.position.set(x, 0.11, z);
    lettuce.scale.y = 0.7;
    bed.add(lettuce);
    outline(lettuce, w.line);
  }
  // Her daisy: a stem that grows, two leaves, a bud, then the flower.
  const sprout = new THREE.Group();
  sprout.position.set(...DAISY_AT);
  country.add(sprout);
  const STEM_H = 0.6;
  const stemGeoTall = new THREE.CylinderGeometry(0.014, 0.018, 1, 6);
  stemGeoTall.translate(0, 0.5, 0);
  const daisyStem = new THREE.Mesh(stemGeoTall, w.ink({ tint: "#4f8a3a", tone: 0.7, rim: 0.4 }));
  sprout.add(daisyStem);
  const leaves = [-1, 1].map((s) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), leafy);
    leaf.geometry.translate(0.06, 0, 0);
    leaf.scale.set(1, 0.25, 0.5);
    leaf.position.y = 0.12 + (s > 0 ? 0.06 : 0);
    leaf.rotation.set(0, s > 0 ? 0.3 : Math.PI - 0.3, 0.45);
    sprout.add(leaf);
    return leaf;
  });
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), leafy);
  bud.scale.y = 1.3;
  sprout.add(bud);
  const bloom = buildDaisy(w);
  bloom.children[0].visible = false;
  bloom.rotation.y = 0.35;
  sprout.add(bloom);
  // What she carries: a pouch of seeds, then the watering can.
  const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), w.ink({ tint: "#d9b98a", tone: 1, rim: 0.6 }));
  pouch.scale.set(1, 1.1, 0.9);
  country.add(pouch);
  outline(pouch, w.line);
  const seeds = Array.from({ length: 3 }, () => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), w.ink({ tint: "#5a3a1f", tone: 0.8, rim: 0.4 }));
    country.add(s);
    return s;
  });
  const can = new THREE.Group();
  can.rotation.order = "YXZ";
  country.add(can);
  const canMat = w.ink({ tint: "#6fb3c9", tone: 1, rim: 0.8 });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.18, 16), canMat);
  canBody.position.y = -0.15;
  can.add(canBody);
  outline(canBody, w.line);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), canMat);
  handle.position.y = -0.06;
  can.add(handle);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.16, 8), canMat);
  spout.position.set(0, -0.14, 0.13);
  spout.rotation.x = 1.0;
  can.add(spout);
  const spoutTip = new THREE.Object3D();
  spoutTip.position.set(0, -0.09, 0.2);
  can.add(spoutTip);
  const CAN_REST = [0.0, 0.24, 1.1];
  const drops = Array.from({ length: 7 }, () => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), softGlow("#9fdcff", 0.9));
    country.add(d);
    return d;
  });
  // Fireflies: a fixed swarm, so the held frame has them too.
  const fireflies = Array.from({ length: 22 }, (_, i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), softGlow(new THREE.Color("#ffe680").multiplyScalar(2.2), 0));
    f.userData.base = new THREE.Vector3(-2.2 + hash(i * 3.1) * 3.8, 0.35 + hash(i * 7.7) * 1.5, -1.2 + hash(i * 5.3) * 2.4);
    country.add(f);
    return f;
  });

  const reze = buildMouse(w, { fur: "#c9c2bd", clothes: "#1d1b22", collar: "#f1efe9", choker: true, hair: "bob" });
  country.add(reze.group);
  const herDream = buildDaisy(w);
  herDream.children[0].visible = false;
  herDream.rotation.set(Math.PI / 2, 0, 0);
  herDream.scale.setScalar(3.2);
  const rezeBubble = buildBubble(w, herDream, "#fff3b0");
  rezeBubble.group.position.set(-0.5, 2.3, 0.45);
  country.add(rezeBubble.group);
  const rezeSparkle = buildSparkle(new THREE.Color("#fff6c9").multiplyScalar(2));
  country.add(rezeSparkle.group);

  // ── The city ──
  const city = new THREE.Group();
  city.position.x = CITY_X;
  w.scene.add(city);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), w.ink({ tint: "#3a3550", tone: 0.6, rim: 0.3 }));
  street.rotation.x = -Math.PI / 2;
  city.add(street);
  const warm = new THREE.Color("#ffd27a");
  const cool = new THREE.Color("#9ff0ff");
  const winWarm = glow(warm.clone());
  const winCool = glow(cool.clone());
  for (let i = 0; i < 12; i++) {
    const h = 3 + ((i * 7) % 5) * 1.3;
    const bw = 1.3 + (i % 3) * 0.4;
    const x = -8 + i * 1.45;
    const z = -7 - (i % 2) * 1.6;
    box(w, [bw, h, 1.2], [x, h / 2, z], i % 2 ? "#2b2645" : "#342e55", 0.55, city);
    for (let r = 0; r < Math.floor(h / 0.55) - 1; r++) {
      for (let k = 0; k < 2; k++) {
        if ((i * 13 + r * 7 + k * 3) % 4 === 0) continue;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.26), (i + r + k) % 5 ? winWarm : winCool);
        win.position.set(x - 0.25 + k * 0.5, 0.6 + r * 0.55, z + 0.61);
        city.add(win);
      }
    }
  }
  // The café wall, its sill and the toaster up top.
  box(w, [4.6, 2.6, 0.2], [0, 1.3, -2.4], "#3c2f4f", 0.7, city);
  box(w, [0.95, 0.06, 0.34], [TOASTER_AT[0], 1.55, -2.13], "#5a4a6e", 0.8, city, true);
  const toaster = new THREE.Group();
  toaster.position.set(...TOASTER_AT);
  city.add(toaster);
  const chrome = w.ink({ tint: "#c9ccd6", tone: 1.1, rim: 1.2 });
  for (const s of [-1, 1]) box(w, [0.62, 0.3, 0.1], [0, 0, s * 0.09], "#c9ccd6", 1.1, toaster, true);
  for (const s of [-1, 1]) box(w, [0.08, 0.3, 0.08], [s * 0.27, 0, 0], "#c9ccd6", 1.1, toaster);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.06), chrome);
  lever.position.set(0.34, 0.05, 0.05);
  toaster.add(lever);
  // Crates stacked to the sill.
  box(w, [0.8, 0.6, 0.8], [-1.2, 0.3, -1.5], "#8a6a45", 0.8, city, true);
  box(w, [0.55, 0.5, 0.55], [-1.3, 0.85, -1.65], "#9a7a52", 0.85, city, true);
  // Neon over the café, each pouring a pool of light he can dart between.
  const neon = [
    ["#ffb547", [-0.3, 2.45, -2.28], [1.1, 0.24], D_P1],
    ["#3fe0ff", [0.95, 2.05, -2.28], [1.1, 0.22], D_P2],
    ["#ff4fd8", [-1.4, 2.42, -2.28], [0.8, 0.2], D_P3],
  ].map(([c, p, [nw, nh], pool]) => {
    const base = new THREE.Color(c);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(nw, nh), glow(base.clone()));
    sign.position.set(...p);
    city.add(sign);
    const spill = lightBeam({ from: [p[0], p[1], p[2] + 0.1], to: [pool[0], 0, pool[2]], radiusFrom: 0.3, radiusTo: 0.7, color: c });
    spill.material.uniforms.uIntensity.value = 0.2;
    city.add(spill);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), softGlow(c, 0.28));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(pool[0], 0.012, pool[2]);
    disc.scale.y = 0.7;
    city.add(disc);
    return { sign, base, disc };
  });
  // His table, his stool, his empty plate.
  const table = new THREE.Group();
  table.position.set(0.85, 0, 1.1);
  city.add(table);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 28), w.ink({ tint: "#f1efe9", tone: 1, rim: 0.6 }));
  top.position.y = 0.72;
  table.add(top);
  outline(top, w.line);
  box(w, [0.06, 0.7, 0.06], [0, 0.35, 0], "#22222a", 0.6, table);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.03, 24), w.ink({ tint: "#ffffff", tone: 1.1, rim: 0.4 }));
  plate.position.set(-0.12, 0.76, 0.02);
  table.add(plate);
  const cup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 14), w.ink({ tint: "#ff7ad9", tone: 1, rim: 0.6 }));
  cup2.position.set(0.2, 0.8, -0.12);
  table.add(cup2);
  outline(cup2, w.line);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.06, 20), w.ink({ tint: "#c8102e", tone: 0.9, rim: 0.8 }));
  stool.position.set(D_STOOL[0], 0.36, D_STOOL[2] - 0.05);
  city.add(stool);
  outline(stool, w.line);
  box(w, [0.05, 0.34, 0.05], [D_STOOL[0], 0.17, D_STOOL[2] - 0.05], "#22222a", 0.6, city);

  const denji = buildMouse(w, { fur: "#b9a38c", clothes: "#eef0ea", tie: "#15161b", belt: "#6b3f22", hair: "spikes" });
  city.add(denji.group);
  const toast = buildToast(w);
  toast.rotation.order = "YXZ";
  city.add(toast);
  const hisDream = buildToast(w, false);
  hisDream.scale.setScalar(0.42);
  const denjiBubble = buildBubble(w, hisDream, "#ffd27a");
  denjiBubble.group.position.set(0.75, 2.35, 1.0);
  city.add(denjiBubble.group);
  const denjiSparkle = buildSparkle(new THREE.Color("#ffe1a0").multiplyScalar(2));
  city.add(denjiSparkle.group);

  w.sync();
  w.scene.updateMatrixWorld(true);

  // The gutter between the panels.
  const gutter = document.createElement("div");
  gutter.setAttribute("aria-hidden", "true");
  Object.assign(gutter.style, { position: "absolute", pointerEvents: "none", top: "0", bottom: "0", left: "50%", width: "10px", marginLeft: "-5px", background: PAPER, borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}` });
  overlay?.appendChild(gutter);

  // The country's light, day to dusk.
  const dayPal = Object.fromEntries(Object.entries(COUNTRY).map(([k, c]) => [k, new THREE.Color(c)]));
  const duskPal = Object.fromEntries(Object.entries(COUNTRY_DUSK).map(([k, c]) => [k, new THREE.Color(c)]));
  const countryPal = Object.fromEntries(Object.keys(COUNTRY).map((k) => [k, new THREE.Color()]));
  const countryLight = new THREE.Vector3(1, 0.75, 0.45);

  /** A point in a mouse's own frame, in its panel's coordinates. */
  const fromMouse = (m, parent, local, out) => parent.worldToLocal(m.group.localToWorld(out.set(...local)));
  const fromPaw = (arm, parent, out) => parent.worldToLocal(arm.localToWorld(out.set(0, -0.36, 0.02)));

  /** The dream bubble: pops in, floats, pops out. `hold` keeps it up (the still). */
  const showBubble = (b, c, t, cam, hold) => {
    const a = hold ? 1 : easeOutBack(segment(c, 0.45, 0.95)) * (1 - easeInCubic(segment(c, 2.45, 2.85)));
    const dotsIn = hold ? 1 : easeOutBack(segment(c, 0.3, 0.6)) * (1 - easeInCubic(segment(c, 2.6, 2.9)));
    b.group.visible = a > 0.01 || dotsIn > 0.01;
    b.group.quaternion.copy(cam.quaternion);
    b.puffs.scale.setScalar(Math.max(0.001, a));
    b.puffs.position.y = Math.sin(t * 1.8) * 0.025;
    b.dots.forEach((d) => d.scale.setScalar(Math.max(0.001, dotsIn)));
    b.halo.material.opacity = 0.35 + Math.sin(t * 3) * 0.15;
    b.icon.rotation.z = Math.sin(t * 2.2) * 0.12;
  };

  const update = (time) => {
    const t = staticMode ? STATIC_AT : time;
    const c = t % CYCLE;
    const seatedOf = (c0, c1, c2, c3) => 1 - smoothstep(segment(c, c0, c1)) + smoothstep(segment(c, c2, c3));
    // Slow pushes in, opposite ways.
    const k = (Math.sin(t * 0.15) + 1) / 2;
    camL.position.set(lerp(1.35, 1.15, k), 1.75, lerp(6.7, 6.3, k));
    camL.lookAt(-0.3, 1.15, 0.2);
    camR.position.set(CITY_X + lerp(-0.45, -0.25, k), 1.85, lerp(6.9, 6.5, k));
    camR.lookAt(CITY_X, 1.3, -0.1);
    const dusk = easeInOutCubic(segment(c, 11.2, 13.6)) * (1 - easeInOutCubic(segment(c, 15.2, 16)));

    // ── Reze: a quiet life, slow and steady ──
    const R = track(REZE_KEYS, c, smoothstep);
    const rSeat = seatedOf(2.6, 3.0, 11.2, 11.5);
    const rGait = R.moving ? Math.sin(TAU * 1.5 * (c - R.t0)) : 0;
    const rDream = easeInOutCubic(segment(c, 0.35, 0.8)) * (1 - easeInOutCubic(segment(c, 2.35, 2.75)));
    const bend = Math.sin(Math.PI * segment(c, 4.6, 5.2));
    const kneel = easeInOutCubic(segment(c, 6.6, 6.95)) * (1 - easeInOutCubic(segment(c, 9.55, 9.9)));
    const carry = smoothstep(segment(c, 4.85, 5.05)) * (1 - smoothstep(segment(c, 6.8, 7.0)));
    const seedTip = Math.sin(Math.PI * segment(c, 6.95, 7.55));
    const patK = Math.sin(Math.PI * segment(c, 7.55, 8.05));
    const reachCan = Math.sin(Math.PI * segment(c, 7.95, 8.3)) + Math.sin(Math.PI * segment(c, 9.45, 9.8));
    const pour = easeInOutCubic(segment(c, 8.35, 8.6)) * (1 - easeInOutCubic(segment(c, 9.2, 9.45)));
    const admire = easeInOutCubic(segment(c, 11.2, 11.8)) * (1 - easeInOutCubic(segment(c, 14.4, 15.2)));
    const content = rSeat * (c > 11 ? 1 : 0.4);

    const a0 = [-0.15 + rGait * 0.35, 0.35];
    const a1 = [-0.15 - rGait * 0.35, 0.35];
    mix(a0, [-0.55, 0.02], rSeat);
    mix(a1, [-0.55, 0.02], rSeat);
    mix(a0, [-1.05, -0.32], rDream);
    mix(a1, [-1.05, -0.32], rDream);
    mix(a0, [-0.95, 0.15], bend);
    mix(a0, [-0.75, 0.1], carry);
    mix(a0, [-1.25, 0.1], seedTip);
    mix(a0, [-1.0 - Math.max(0, Math.sin(c * 22)) * 0.4, 0.1], patK);
    mix(a1, [-1.0 - Math.max(0, -Math.sin(c * 22)) * 0.4, 0.1], patK);
    mix(a1, [-0.6, 0.15], kneel * (1 - patK));
    mix(a0, [-0.85, 0.3], Math.min(1, reachCan));
    mix(a0, [-1.35, 0.15], pour);
    setArms(reze, a0, a1);
    setFeet(reze, rGait, rSeat);

    const sway = Math.sin(t * 0.9) * 0.04 * content;
    reze.group.position.set(R.x, R.y + Math.abs(rGait) * 0.03 - kneel * 0.22, R.z);
    reze.group.rotation.set(kneel * 0.35 + bend * 0.45 - rSeat * 0.04, R.ry, rGait * 0.04 + sway);
    reze.head.rotation.set(-0.35 * rDream + kneel * 0.3 + bend * 0.2 + pour * 0.1, admire * 0.6, -0.15 * rDream + Math.sin(t * 0.6) * 0.06 * content);
    idle(reze, t, 0, 0.8);
    reze.ears.forEach((e) => e.scale.setScalar(1 + rDream * 0.12));
    reze.group.updateMatrixWorld(true);

    // The pouch: pulled from the sack, tipped over the soil, tucked away.
    const pouchIn = smoothstep(segment(c, 4.85, 5.0)) * (1 - smoothstep(segment(c, 7.5, 7.7)));
    pouch.visible = pouchIn > 0.01;
    fromPaw(reze.arms[0], country, v);
    if (pouch.visible) {
      pouch.position.copy(v);
      pouch.scale.set(pouchIn, pouchIn * 1.1, pouchIn * 0.9);
      pouch.rotation.set(seedTip * 1.2, R.ry, 0);
    }
    seeds.forEach((s, i) => {
      const p = segment(c, 7.05 + i * 0.1, 7.35 + i * 0.1);
      s.visible = p > 0 && p < 1;
      if (s.visible) s.position.set(lerp(v.x, DAISY_AT[0] + (i - 1) * 0.04, p), lerp(v.y, 0.1, p * p), lerp(v.z, DAISY_AT[2], p));
    });
    // The watering can, from the ground to her paw and back.
    if (c > 8.15 && c < 9.62) {
      can.position.copy(v);
      can.rotation.set(pour * 0.9, R.ry, 0);
    } else {
      can.position.set(...CAN_REST);
      can.rotation.set(0, 0.4, 0);
    }
    can.updateMatrixWorld(true);
    spoutTip.getWorldPosition(v2);
    country.worldToLocal(v2);
    drops.forEach((d, i) => {
      const p = (((c - 8.5) * 2.2 + i / drops.length) % 1 + 1) % 1;
      d.visible = pour > 0.6;
      if (d.visible) d.position.set(lerp(v2.x, DAISY_AT[0] + Math.sin(i * 2.1) * 0.05, p), lerp(v2.y, DAISY_AT[1] + 0.03, p * p), lerp(v2.z, DAISY_AT[2] + Math.cos(i * 1.7) * 0.04, p));
    });

    // The sprout comes up while she works; the daisy opens once she is home.
    const grow = easeOutCubic(segment(c, 7.7, 10.6));
    const sink = easeInOutCubic(segment(c, 15.3, 15.95));
    const stemK = grow * (1 - sink);
    daisyStem.visible = stemK > 0.01;
    daisyStem.scale.set(1, Math.max(0.001, stemK * STEM_H), 1);
    const leafK = easeOutBack(segment(c, 8.4, 9.4)) * (1 - sink);
    leaves.forEach((l) => {
      l.visible = leafK > 0.01;
      l.scale.set(leafK, leafK * 0.25, leafK * 0.5);
    });
    const opened = easeOutBack(segment(c, 11.2, 11.75)) * (1 - easeInOutCubic(segment(c, 14.9, 15.5)));
    const budK = easeOutBack(segment(c, 9.5, 10.2)) * (1 - segment(c, 11.2, 11.4)) * (1 - sink);
    const tip = 0.0 + stemK * STEM_H;
    bud.visible = budK > 0.01;
    bud.position.y = tip;
    bud.scale.set(budK, budK * 1.3, budK);
    bloom.visible = opened > 0.01;
    bloom.position.y = tip + 0.02;
    bloom.scale.setScalar(Math.max(0.001, opened * 3.4));
    bloom.rotation.z = Math.sin(t * 0.9) * 0.06;
    sprout.rotation.z = Math.sin(t * 0.9 + 1) * 0.04 * stemK;
    rezeSparkle.group.position.set(DAISY_AT[0], DAISY_AT[1] + STEM_H + 0.04, DAISY_AT[2] + 0.05);
    rezeSparkle.group.quaternion.copy(camL.quaternion);
    rezeSparkle.update(segment(c, 11.3, 12.2));

    showBubble(rezeBubble, c, t, camL, staticMode);
    buttercups.forEach((f, i) => (f.rotation.z = Math.sin(t * 0.9 + i) * 0.08));
    fireflies.forEach((f, i) => {
      const b = f.userData.base;
      f.position.set(b.x + Math.sin(t * 0.7 + i) * 0.18, b.y + Math.sin(t * 1.1 + i * 2) * 0.12, b.z + Math.cos(t * 0.6 + i) * 0.18);
      f.material.opacity = dusk * (0.55 + 0.45 * Math.sin(t * 2.3 + i * 1.7));
      f.visible = dusk > 0.02;
    });
    lit.material.color.copy(litColor).multiplyScalar(1 + dusk * 2.2);
    for (const k of Object.keys(countryPal)) countryPal[k].copy(dayPal[k]).lerp(duskPal[k], dusk * 0.85);
    countryLight.set(1, lerp(0.75, 0.3, dusk), lerp(0.45, 0.25, dusk));

    // ── Denji: the feast and the lights, fast and bold ──
    const D = track(DENJI_KEYS, c, easeOutCubic);
    const dSeat = seatedOf(2.6, 2.75, 10.95, 11.1);
    const dGait = D.moving ? Math.sin(TAU * 3.5 * (c - D.t0)) : 0;
    const plateLook = easeInOutCubic(segment(c, 0.05, 0.3)) * (1 - easeInOutCubic(segment(c, 0.45, 0.65)));
    const dDream = easeInOutCubic(segment(c, 0.5, 0.9)) * (1 - easeInOutCubic(segment(c, 2.35, 2.65)));
    const scan = (from, to) => (c > from && c < to ? Math.sin((c - from) * 18) * 0.55 * Math.sin(Math.PI * segment(c, from, to)) : 0);
    const lookAround = scan(3.45, 3.75) + scan(4.18, 4.5);
    const reach = easeInOutCubic(segment(c, 6.3, 6.6)) * (1 - easeInOutCubic(segment(c, 7.0, 7.25)));
    const onHead = c >= 7.05 && c < 11.05 ? 1 : 0;
    const cheer = Math.sin(Math.PI * segment(c, 7.5, 8.05));
    const eating = c >= 11.05 && c < 15.4 ? 1 : 0;
    const biteU = segment(c, 11.8, 15.4) * 6;
    const biteFrac = biteU % 1;
    const bite = c > 11.8 && c < 15.4 && biteFrac < 0.35 ? Math.sin((Math.PI * biteFrac) / 0.35) : 0;
    const belly = easeInOutCubic(segment(c, 15.4, 15.65)) * (1 - easeInOutCubic(segment(c, 15.75, 16)));

    const b0 = [-0.2 + dGait * 0.6, 0.4];
    const b1 = [-0.2 - dGait * 0.6, 0.4];
    mix(b0, [-0.5, 0.15], dSeat);
    mix(b1, [-0.5, 0.15], dSeat);
    mix(b0, [-1.2 - Math.max(0, Math.sin(c * 16)) * 0.3, -0.25], dDream);
    mix(b1, [-1.2 - Math.max(0, -Math.sin(c * 16)) * 0.3, -0.25], dDream);
    mix(b0, [-2.0, 0.5], D.airborne ? 0.6 : 0);
    mix(b1, [-2.0, 0.5], D.airborne ? 0.6 : 0);
    mix(b0, [-2.5, 0.1], reach);
    mix(b1, [-2.5, 0.1], reach);
    mix(b0, [-2.75 - cheer * 0.2, 0.45 + cheer * 0.3], onHead);
    mix(b1, [-2.75 - cheer * 0.2, 0.45 + cheer * 0.3], onHead);
    mix(b0, [-1.45 - bite * 0.15, -0.3], eating);
    mix(b1, [-1.45 - bite * 0.15, -0.3], eating);
    mix(b0, [-0.6 - Math.max(0, Math.sin(c * 20)) * 0.25, -0.55], belly);
    mix(b1, [-0.6 - Math.max(0, -Math.sin(c * 20)) * 0.25, -0.55], belly);
    setArms(denji, b0, b1);
    setFeet(denji, dGait, dSeat);

    denji.group.position.set(D.x, D.y + Math.abs(dGait) * 0.05, D.z);
    denji.group.rotation.set((D.moving ? 0.22 : 0) - belly * 0.12 - eating * 0.04, D.ry, dGait * 0.06);
    denji.head.rotation.set(plateLook * 0.35 - dDream * 0.42 + bite * 0.28 + eating * 0.06 - cheer * 0.25 - reach * 0.3, plateLook * 0.6 + lookAround, dDream * 0.12);
    idle(denji, t, 1.7, c < 3 ? 2.2 : 1.2);
    denji.ears.forEach((e) => e.scale.setScalar(1 + dDream * 0.15 + cheer * 0.3 + bite * 0.1));
    denji.group.updateMatrixWorld(true);

    // The toast: in the toaster, on his head, in his paws, gone; the toaster pops another.
    const remaining = 1 - (Math.floor(biteU) + easeOutCubic(Math.min(1, biteFrac / 0.35))) / 6;
    const onHeadAt = fromMouse(denji, city, [0, 1.84, 0.02], v);
    if (c < 7.05 || c >= 15.6) {
      const pop = c >= 15.6 ? easeOutBack(segment(c, 15.6, 15.9)) : 1;
      const jiggle = c > 6.45 && c < 7.05 ? Math.sin(c * 40) * 0.01 : 0;
      toast.visible = true;
      toast.position.set(TOAST_REST[0], lerp(1.62, TOAST_REST[1], pop) + jiggle, TOAST_REST[2]);
      toast.rotation.set(0, 0, 0);
      toast.scale.setScalar(1);
    } else if (c < 11.05) {
      const lift = easeOutCubic(segment(c, 7.05, 7.3));
      toast.visible = true;
      toast.position.set(...TOAST_REST).lerp(onHeadAt, lift);
      toast.rotation.set(-0.08, lerp(0, D.ry, lift), Math.sin(c * 9) * 0.04 * lift);
      toast.scale.setScalar(1);
    } else if (c < 15.4) {
      const down = easeInOutCubic(segment(c, 11.05, 11.35));
      fromMouse(denji, city, [0, 0.88 - bite * 0.03, 0.46], v2);
      toast.visible = true;
      toast.position.copy(onHeadAt).lerp(v2, down);
      toast.rotation.set(0.1 * down, D.ry, 0);
      toast.scale.setScalar(lerp(1, 0.7, down) * (c > 11.8 ? 0.35 + 0.65 * remaining : 1));
    } else {
      toast.visible = false;
    }
    lever.position.y = c >= 15.6 || c < 0.1 ? 0.05 : lerp(0.05, -0.08, segment(c, 15.4, 15.55));
    denjiSparkle.group.position.copy(toast.position).add(v.set(0, 0.2, 0.1));
    denjiSparkle.group.quaternion.copy(camR.quaternion);
    denjiSparkle.update(segment(c, 11.3, 12.2));
    showBubble(denjiBubble, c, t, camR, staticMode);

    // The skyline comes up as he eats; neon hums and flickers.
    const shine = easeInOutCubic(segment(c, 11.2, 13.6)) * (1 - easeInOutCubic(segment(c, 15.2, 16)));
    winWarm.color.copy(warm).multiplyScalar(1 + shine * 1.6);
    winCool.color.copy(cool).multiplyScalar(1 + shine * 1.6);
    neon.forEach((n, i) => {
      const on = Math.sin(t * (7 + i * 3)) > -0.92 || i === 1;
      n.sign.visible = on;
      n.sign.material.color.copy(n.base).multiplyScalar(1 + shine * 0.8);
      n.disc.material.opacity = on ? 0.22 + shine * 0.12 : 0.08;
    });

  };

  const render = () => {
    const { width: W, height: H } = stage.size;
    const half = Math.round(W / 2);
    renderer.setScissorTest(true);
    [
      [camL, countryPal, 0, half, countryLight.x, countryLight.y, countryLight.z],
      [camR, CITY, half, W - half, -0.4, 0.6, 0.7],
    ].forEach(([cam, pal, x, pw, lx, ly, lz]) => {
      w.palette(pal);
      w.light(lx, ly, lz);
      cam.aspect = pw / H;
      cam.updateProjectionMatrix();
      w.bu.uAspect.value = pw / H;
      renderer.setViewport(x, 0, pw, H);
      renderer.setScissor(x, 0, pw, H);
      renderer.render(w.scene, cam);
    });
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
  };

  const unsubscribeResize = stage.onResize(() => w.sync());

  return {
    update,
    render,
    dispose() {
      unsubscribeResize();
      gutter.remove();
    },
  };
};
