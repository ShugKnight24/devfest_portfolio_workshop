import * as THREE from "three";
import { createParticles, lightBeam } from "./kit";
import { INK, PAPER, inkMaterial, mangaBackdrop, outlineMaterial, outline, syncInk } from "./ink";
import { createModelFigure } from "./modelFigure";
import { aim, createBlade, createChainsawHead } from "./chainsawParts";

/**
 * The Reze arc kit — what the pre-show songs are shot with.
 *
 * Every song is a short film over the same world: one ink page, a handful of
 * sets laid out side by side (only the one on camera is drawn), and one cast
 * that walks from set to set. A scene module just writes its shot list.
 *
 *   createInkWorld   the sky (the film mode of the manga backdrop), one fine
 *                    outline, and `palette()` — the movie's lighting as
 *                    [ground, lines, accent, rim, shade], applied to the sky,
 *                    the fill, the rim and the air of every material
 *   SETS             street + booth, the café, the night school, the pool,
 *                    the festival, the church, the warehouse
 *   createCast       Denji (his chainsaw bound to him at rest), Reze (the pin
 *                    on her choker), a daisy, the Bomb Devil's head, devils
 *   createCuts       the editing on the DOM overlay: iris in/out, flashes,
 *                    black, letterbox bars
 *
 * Original staging, CC0 bodies (Quaternius); no frames from the film.
 */

/** The film's light, per beat. [ground, lines, accent, rim] */
export const LIGHT = {
  storm: { ground: "#0b1030", lines: "#a9bcff", accent: "#ff5fa2", rim: "#ff6fb0", shade: "#6f78c8" },
  stormWarm: { ground: "#160b0d", lines: "#ffb27a", accent: "#ff4b2b", rim: "#ff5a36", shade: "#a0687a" },
  cafe: { ground: "#2a1710", lines: "#ffd9a6", accent: "#ff8a5b", rim: "#ffc28a", shade: "#c99a8a" },
  school: { ground: "#0a1424", lines: "#9ec5ff", accent: "#7ad7ff", rim: "#a8e1ff", shade: "#7088c0" },
  pool: { ground: "#03121e", lines: "#8fe3ff", accent: "#b7f0ff", rim: "#c9f4ff", shade: "#5f8fb8" },
  festival: { ground: "#1a0b1f", lines: "#ffb3d9", accent: "#ff7a3d", rim: "#ff8ac2", shade: "#a7709e" },
  church: { ground: "#0c0a14", lines: "#c7b2ff", accent: "#c8102e", rim: "#d6c4ff", shade: "#7a6aa8" },
  blood: { ground: "#140406", lines: "#ff9a8a", accent: "#ff1d3d", rim: "#ff3b4f", shade: "#a8505e" },
  dawn: { ground: "#1b1530", lines: "#ffd2c2", accent: "#ff9fb8", rim: "#ffc9b8", shade: "#9e88b0" },
  devil: { ground: "#0d0c0c", lines: "#f1ece2", accent: "#c8102e", rim: "#f1ece2", shade: "#7a7486" },
  gray: { ground: "#2c2f38", lines: "#d6dbe4", accent: "#9aa4b5", rim: "#e8ecf2", shade: "#8890a6" },
};

export const createInkWorld = (stage) => {
  const { scene, renderer } = stage;
  scene.background = null;
  scene.environment = null;

  const backdrop = mangaBackdrop();
  const bu = backdrop.material.uniforms;
  bu.uInvert.value = 1;
  scene.add(backdrop);

  // Film: a lit sky, and a fine warm-black line instead of the page's ink.
  bu.uFilm.value = 1;
  const line = outlineMaterial(0.45);
  line.uniforms.uInk.value.set("#1b1414");
  const inks = [];
  const ink = (o = {}) => {
    const m = inkMaterial({ spec: 0, ...o });
    inks.push(m);
    return m;
  };
  const flat = inkMaterial({ flat: true });
  /** Pull an inkified model's materials into the palette's reach. */
  const register = (root) => root.traverse((o) => o.material?.uniforms?.uRimColor && !inks.includes(o.material) && inks.push(o.material));

  /** Where the key light comes from, for every ink material on the page. */
  const light = (x, y, z) => {
    const d = new THREE.Vector3(x, y, z).normalize();
    inks.forEach((m) => m.uniforms.uLightWorld.value.copy(d));
  };
  // The film's look: lit like the show, the fill and the air tinted per beat.
  const air = new THREE.Color();
  const key = new THREE.Color();
  const palette = (p) => {
    bu.uInk.value.set(p.ground);
    bu.uPaper.value.set(p.lines);
    bu.uRed.value.set(p.accent);
    air.set(p.ground).lerp(new THREE.Color(p.lines), 0.12);
    // Half the set's colour, half white: a white shirt under pink lanterns
    // reads as a lit white shirt, not as skin.
    key.set("#ffffff").lerp(new THREE.Color(p.lines), 0.45).multiplyScalar(1.08);
    inks.forEach((m) => {
      m.uniforms.uRimColor.value.set(p.rim);
      m.uniforms.uAnime.value = 2;
      m.uniforms.uShade.value.set(p.shade ?? "#9a93c4");
      m.uniforms.uFog.value.copy(air);
      // The key takes the set's light colour; night stays night.
      m.uniforms.uKey.value.copy(key);
    });
  };
  /** The page: `rain`, `lines` (focus lines), or `still` (just the ground). */
  const page = ({ mode = "still", intensity = 0.6, focus = [0.5, 0.5], disc = null, seed = 0 } = {}) => {
    bu.uRain.value = mode === "rain" ? 1 : 0;
    bu.uIntensity.value = mode === "still" ? 0 : intensity;
    bu.uSplash.value = mode === "rain" && disc ? 1 : 0;
    bu.uFocus.value.set(focus[0], focus[1]);
    bu.uSeed.value = seed;
    if (disc) bu.uDisc.value.set(disc[0], disc[1], disc[2]);
    else bu.uDisc.value.set(0, 0, 0);
  };

  // Start on a still, dark page: nothing to see until the cast has loaded.
  page({ mode: "still" });
  palette(LIGHT.storm);

  return { scene, renderer, backdrop, bu, line, ink, flat, inks, register, palette, page, light, sync: () => syncInk(scene, renderer.getPixelRatio()) };
};

/* --------------------------------------------------------------------------
 * Sets. Each is a Group at its own spot on the lot; `show(id)` draws one.
 * ------------------------------------------------------------------------ */

const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent?.add(m);
  return m;
};
const glow = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending });

export const BOOTH = { w: 1.4, d: 1.3, h: 2.35 };

const buildStreet = (w) => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), w.ink({ tone: 0.22, rim: 0.4 }));
  ground.rotation.x = -Math.PI / 2;
  g.add(ground);
  const frame = w.ink({ tone: 0.3, rim: 1.2 });
  const booth = new THREE.Group();
  g.add(booth);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.07, BOOTH.h, 0.07, frame, (x * BOOTH.w) / 2, BOOTH.h / 2, (z * BOOTH.d) / 2, booth);
  box(BOOTH.w + 0.16, 0.14, BOOTH.d + 0.16, frame, 0, BOOTH.h + 0.07, 0, booth);
  box(BOOTH.w, BOOTH.h * 0.9, 0.04, w.ink({ tone: 0.45, rim: 0.6 }), 0, BOOTH.h * 0.47, -BOOTH.d / 2, booth);
  box(0.22, 0.32, 0.1, frame, -0.3, 1.35, -BOOTH.d / 2 + 0.07, booth);
  const glass = new THREE.MeshBasicMaterial({ color: "#9fb4ff", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(BOOTH.d, BOOTH.h * 0.8), glass);
    pane.rotation.y = Math.PI / 2;
    pane.position.set((side * BOOTH.w) / 2, BOOTH.h * 0.5, 0);
    booth.add(pane);
  }
  box(0.6, 0.03, 0.3, glow("#ffe2b0"), 0, BOOTH.h - 0.02, 0, booth);
  const beam = lightBeam({ from: [0, BOOTH.h, 0], to: [0, 0, 0], radiusFrom: 0.25, radiusTo: 0.95, color: "#ffd9a0" });
  beam.material.uniforms.uIntensity.value = 0.32;
  g.add(beam);
  for (const x of [-8.5, -5, 4.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.4, 10), frame);
    post.position.set(x, 1.7, -1.4);
    g.add(post);
    const cone = lightBeam({ from: [x, 3.3, -1.4], to: [x, 0, -0.8], radiusFrom: 0.1, radiusTo: 1.2, color: "#ffb27a" });
    cone.material.uniforms.uIntensity.value = 0.25;
    g.add(cone);
  }
  return { group: g, spots: { him: new THREE.Vector3(-0.32, 0, 0.12), her: new THREE.Vector3(0.3, 0, -0.08) } };
};

const buildCafe = (w) => {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), w.ink({ tint: "#e7c9a2", tone: 0.95, rim: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const wall = w.ink({ tint: "#f3dcbc", tone: 1.0, rim: 0.2 });
  box(12, 4, 0.1, wall, 0, 2, -2.65, g);
  // A big window onto the street, sunlight pouring in.
  const frame = w.ink({ tint: "#3b2415", tone: 0.4, rim: 0.8 });
  box(4.2, 0.08, 0.14, frame, 2.4, 3.1, -2.52, g);
  box(4.2, 0.08, 0.14, frame, 2.4, 1.0, -2.52, g);
  for (const x of [0.3, 1.7, 3.1, 4.5]) box(0.08, 2.1, 0.14, frame, x, 2.05, -2.52, g);
  box(4.1, 2.0, 0.02, glow("#fff3d6"), 2.4, 2.05, -2.57, g);
  const sun = lightBeam({ from: [2.6, 2.6, -2.4], to: [1.0, 0, 0.6], radiusFrom: 1.0, radiusTo: 1.8, color: "#ffd59a" });
  sun.material.uniforms.uIntensity.value = 0.22;
  g.add(sun);
  // The counter she works behind, the stools he sits on.
  const wood = w.ink({ tint: "#9a6038", tone: 0.85, rim: 0.7 });
  box(5.2, 1.05, 0.7, wood, -1.4, 0.52, -0.6, g);
  box(5.4, 0.06, 0.85, w.ink({ tint: "#f6eedf", tone: 1.0, rim: 0.4 }), -1.4, 1.08, -0.6, g);
  for (const x of [-3.2, -2.1, -1.0, 0.1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), frame);
    leg.position.set(x, 0.35, 0.35);
    g.add(leg);
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 18), w.ink({ tint: "#c8102e", tone: 0.6, rim: 0.8 }));
    seat.position.set(x, 0.72, 0.35);
    g.add(seat);
  }
  // A bud vase on the counter between them (a glass of water with daisies in
  // it), a menu board, two pendants. The vase is open-topped so stems sit in it.
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.2, 18, 1, true), w.ink({ tint: "#cfe3ea", tone: 1.0, rim: 0.9 }));
  vase.material.side = THREE.DoubleSide;
  vase.position.set(-0.45, 1.21, -0.42);
  outline(vase, w.line);
  g.add(vase);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.046, 18), w.ink({ tint: "#9cc7d6", tone: 0.9, rim: 0.2 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(-0.45, 1.26, -0.42);
  g.add(water);
  for (const [tilt, yaw] of [[-0.22, 0.4], [0.25, -0.6]]) {
    const own = buildDaisy(w);
    own.scale.setScalar(1.25);
    own.rotation.set(tilt, yaw, tilt * 0.6);
    own.position.set(-0.45 + tilt * 0.12, 1.21 + 0.27, -0.42);
    g.add(own);
  }
  box(1.4, 0.8, 0.05, w.ink({ tint: "#1d2a22", tone: 0.4, rim: 0.4 }), -2.4, 2.6, -2.5, g);
  for (const x of [-2.6, -0.4]) {
    box(0.01, 1.2, 0.01, frame, x, 3.4, -0.6, g);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.22, 16, 1, true), w.ink({ tint: "#2b2b2b", tone: 0.5, rim: 1 }));
    shade.position.set(x, 2.75, -0.6);
    g.add(shade);
    const cone = lightBeam({ from: [x, 2.7, -0.6], to: [x, 1.05, -0.6], radiusFrom: 0.18, radiusTo: 0.7, color: "#ffcf8a" });
    cone.material.uniforms.uIntensity.value = 0.3;
    g.add(cone);
  }
  return { group: g, spots: { her: new THREE.Vector3(-1.0, 0, -1.4), him: new THREE.Vector3(-1.0, 0.36, 0.35), stool: new THREE.Vector3(-1.0, 0.76, 0.35), cup: vase.position, vase: vase.position } };
};

const buildSchool = (w) => {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), w.ink({ tint: "#9fb3d4", tone: 0.8, rim: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const wall = w.ink({ tint: "#b9c8e6", tone: 0.75, rim: 0.2 });
  box(12, 4, 0.1, wall, 0, 2, -3.2, g);
  box(0.1, 4, 10, wall, -5, 2, 0, g);
  // Chalkboard, and what is left on it.
  box(4.6, 1.5, 0.06, w.ink({ tint: "#203a2c", tone: 0.4, rim: 0.4 }), -0.5, 1.9, -3.12, g);
  // Tall windows down the right side: moonlight in long bars across the desks.
  const frame = w.ink({ tint: "#2b3550", tone: 0.4, rim: 0.8 });
  for (const z of [-2.2, -0.4, 1.4]) {
    box(0.08, 2.2, 1.3, glow("#cfe6ff"), 4.9, 2.1, z, g);
    box(0.12, 2.3, 0.07, frame, 4.85, 2.1, z - 0.66, g);
    const bar = lightBeam({ from: [4.8, 2.6, z], to: [1.2, 0, z + 0.5], radiusFrom: 0.55, radiusTo: 0.9, color: "#bcdcff" });
    bar.material.uniforms.uIntensity.value = 0.2;
    g.add(bar);
  }
  // Rows of desks and chairs.
  const desk = w.ink({ tint: "#d7aa72", tone: 0.85, rim: 0.6 });
  const metal = w.ink({ tint: "#7a8498", tone: 0.7, rim: 0.8 });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = -3 + c * 1.6;
      const z = -1.4 + r * 1.5;
      box(0.75, 0.04, 0.5, desk, x, 0.74, z, g);
      for (const [dx, dz] of [[-0.33, -0.2], [0.33, -0.2], [-0.33, 0.2], [0.33, 0.2]]) box(0.03, 0.72, 0.03, metal, x + dx, 0.36, z + dz, g);
      box(0.42, 0.04, 0.4, desk, x, 0.45, z + 0.55, g);
      box(0.42, 0.4, 0.03, desk, x, 0.68, z + 0.76, g);
    }
  }
  return { group: g, spots: { her: new THREE.Vector3(0.2, 0.78, -1.4), him: new THREE.Vector3(1.8, 0.45, -0.85) } };
};

/** Toon water: banded swells, a moon streak, rings where someone is swimming. */
const waterMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#04263d") },
      uShallow: { value: new THREE.Color("#0f6b8f") },
      uGlint: { value: new THREE.Color("#d8f6ff") },
      uMoonX: { value: 0.6 },
      uA: { value: new THREE.Vector3(0, 0, 0) },
      uB: { value: new THREE.Vector3(0, 0, 0) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uMoonX;
      uniform vec3 uDeep, uShallow, uGlint, uA, uB;
      varying vec3 vW;
      float rings(vec3 c) {
        if (c.z <= 0.0) return 0.0;
        float d = length(vW.xz - c.xy);
        return smoothstep(0.82, 1.0, sin(d * 16.0 - uTime * 4.0)) * exp(-d * 2.6) * c.z;
      }
      void main() {
        float n = sin(vW.x * 2.3 + uTime * 0.9) * sin(vW.z * 2.9 - uTime * 0.7) + 0.5 * sin((vW.x - vW.z) * 5.0 + uTime * 1.6);
        vec3 col = mix(uDeep, uShallow, smoothstep(-1.2, 1.4, n) * 0.85);
        float band = step(1.05, n + 0.25 * sin(vW.x * 9.0 + uTime));
        float streak = exp(-pow((vW.x - uMoonX) * 1.8, 2.0)) * step(0.5, fract(n * 1.6 + vW.z * 0.4));
        col += uGlint * (band * 0.22 + streak * 0.5 + rings(uA) * 0.45 + rings(uB) * 0.45);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

const buildPool = (w) => {
  const g = new THREE.Group();
  const deck = w.ink({ tint: "#cfd8de", tone: 0.4, rim: 0.3 });
  const deckPlane = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), deck);
  deckPlane.rotation.x = -Math.PI / 2;
  g.add(deckPlane);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.6), waterMaterial());
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.02;
  g.add(water);
  const edge = w.ink({ tint: "#ffffff", tone: 0.7, rim: 0.5 });
  box(10.4, 0.08, 0.2, edge, 0, 0.04, 2.9, g);
  box(10.4, 0.08, 0.2, edge, 0, 0.04, -2.9, g);
  box(0.2, 0.08, 6, edge, 5.1, 0.04, 0, g);
  box(0.2, 0.08, 6, edge, -5.1, 0.04, 0, g);
  // Lane ropes, a ladder, a fence and the school beyond it.
  for (const z of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), w.ink({ tint: i % 2 ? "#ff5fa2" : "#ffffff", tone: 0.8, rim: 0.4 }));
      f.position.set(-4.8 + i * 0.385, 0.05, z * 0.95);
      g.add(f);
    }
  }
  const rail = w.ink({ tint: "#c9d3db", tone: 0.9, rim: 0.8 });
  for (const x of [3.6, 4.1]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 6, 20, Math.PI), rail);
    r.position.set(x, 0.45, 2.85);
    r.rotation.y = Math.PI / 2;
    g.add(r);
  }
  const fence = w.ink({ tint: "#2c3e50", tone: 0.4, rim: 0.9 });
  for (let i = 0; i < 24; i++) box(0.03, 2.2, 0.03, fence, -11 + i, 1.1, -5, g);
  box(24, 0.04, 0.04, fence, 0, 2.15, -5, g);
  box(24, 0.04, 0.04, fence, 0, 0.8, -5, g);
  box(14, 4.5, 2, w.ink({ tint: "#1b2a3e", tone: 0.3, rim: 0.5 }), 0, 2.25, -9, g);
  for (let i = 0; i < 7; i++) box(0.8, 0.9, 0.05, glow(i === 2 ? "#ffe3a3" : "#24324a"), -5.4 + i * 1.8, 2.6, -7.95, g);
  return { group: g, water, spots: { her: new THREE.Vector3(-0.6, 0, 0.2), him: new THREE.Vector3(0.6, 0, -0.2) } };
};

const buildFestival = (w) => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), w.ink({ tint: "#40303a", tone: 0.3, rim: 0.3 }));
  ground.rotation.x = -Math.PI / 2;
  g.add(ground);
  // Stalls down both sides, awnings striped red and paper.
  const post = w.ink({ tint: "#3b2415", tone: 0.4, rim: 0.8 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side * 3.2;
      const z = -6 + i * 3;
      box(1.8, 0.9, 1.2, w.ink({ tint: "#6b4226", tone: 0.5, rim: 0.6 }), x, 0.45, z, g);
      for (let s = 0; s < 6; s++) box(0.3, 0.06, 1.5, w.ink({ tint: s % 2 ? PAPER : "#c8102e", tone: 0.8, rim: 0.6 }), x - 0.75 + s * 0.3, 2.15, z, g);
      for (const dz of [-0.55, 0.55]) box(0.05, 2.1, 0.05, post, x - side * 0.85, 1.05, z + dz, g);
    }
  }
  // Lantern strings overhead.
  const lanterns = [];
  for (let i = 0; i < 22; i++) {
    const z = -8 + i * 0.6;
    const y = 3.3 - Math.sin((i / 21) * Math.PI) * 0.4;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), glow(i % 3 === 0 ? "#ffd27a" : "#ff8a5b"));
    l.scale.y = 1.3;
    l.position.set(Math.sin(i * 1.7) * 0.4, y, z);
    g.add(l);
    lanterns.push(l);
  }
  return { group: g, lanterns, spots: { her: new THREE.Vector3(0.28, 0, 0), him: new THREE.Vector3(-0.28, 0, 0) } };
};

const buildChurch = (w) => {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), w.ink({ tint: "#5a5070", tone: 0.7, rim: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const stone = w.ink({ tint: "#6a6080", tone: 0.62, rim: 0.4 });
  box(0.3, 7, 20, stone, -4.5, 3.5, 0, g);
  box(0.3, 7, 20, stone, 4.5, 3.5, 0, g);
  box(9, 7, 0.3, stone, 0, 3.5, -9, g);
  // Tall windows, red and violet glass, light falling across the pews.
  const tints = ["#ff3b4f", "#8a6bff", "#ff3b4f", "#8a6bff"];
  tints.forEach((c, i) => {
    const z = -6 + i * 3.6;
    box(0.06, 3.2, 0.9, glow(c), 4.33, 3.6, z, g);
    const shaft = lightBeam({ from: [4.3, 4.2, z], to: [0.4, 0, z + 1.2], radiusFrom: 0.45, radiusTo: 1.1, color: c });
    shaft.material.uniforms.uIntensity.value = 0.3;
    g.add(shaft);
  });
  // Pews down both sides of the aisle; candles at the front.
  const pew = w.ink({ tint: "#6b4226", tone: 0.75, rim: 0.7 });
  for (let r = 0; r < 6; r++) {
    for (const side of [-1, 1]) {
      const z = -5 + r * 1.6;
      box(2.8, 0.08, 0.5, pew, side * 2.1, 0.48, z, g);
      box(2.8, 0.7, 0.06, pew, side * 2.1, 0.8, z + 0.25, g);
    }
  }
  const candles = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3 + (i % 3) * 0.1, 8), w.ink({ tint: PAPER, tone: 0.9, rim: 0.3 }));
    c.position.set(-1.2 + i * 0.4, 1.1, -7.6);
    g.add(c);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glow("#ffcf6b"));
    f.scale.y = 1.8;
    f.position.set(c.position.x, c.position.y + 0.22 + (i % 3) * 0.05, -7.6);
    g.add(f);
    candles.push(f);
  }
  box(3, 1, 1, stone, 0, 0.5, -7.6, g);
  return { group: g, candles, spots: { her: new THREE.Vector3(-1.6, 0.52, -1.8) } };
};

const buildWarehouse = (w) => {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), w.ink({ tint: "#55504a", tone: 0.3, rim: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const concrete = w.ink({ tint: "#6a645c", tone: 0.35, rim: 0.6 });
  for (let i = 0; i < 4; i++) for (const x of [-4, 4]) box(0.5, 6, 0.5, concrete, x, 3, -8 + i * 4.5, g);
  box(14, 6, 0.4, concrete, 0, 3, -10, g);
  for (let i = 0; i < 4; i++) {
    const z = -7 + i * 4;
    box(0.01, 1.6, 0.01, concrete, 0, 5.2, z, g);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow("#fff1c9"));
    bulb.position.set(0, 4.4, z);
    g.add(bulb);
    const cone = lightBeam({ from: [0, 4.35, z], to: [0, 0, z], radiusFrom: 0.1, radiusTo: 2.2, color: "#ffe2a8" });
    cone.material.uniforms.uIntensity.value = 0.18;
    g.add(cone);
  }
  return { group: g, spots: { him: new THREE.Vector3(0, 0, 2) } };
};

const BUILDERS = { street: buildStreet, cafe: buildCafe, school: buildSchool, pool: buildPool, festival: buildFestival, church: buildChurch, warehouse: buildWarehouse };

/** Build the named sets, 60 m apart on the lot. `show(id)` hides the rest. */
export const createSets = (w, ids) => {
  const sets = {};
  ids.forEach((id, i) => {
    const set = BUILDERS[id](w);
    set.origin = new THREE.Vector3(i * 60, 0, 0);
    set.group.position.copy(set.origin);
    w.scene.add(set.group);
    sets[id] = set;
  });
  let current = null;
  return {
    sets,
    show(id) {
      if (id === current) return sets[id];
      current = id;
      Object.entries(sets).forEach(([k, s]) => (s.group.visible = k === id));
      return sets[id];
    },
    /** A point in a set's local coordinates, in world space. */
    at(id, x, y, z) {
      return new THREE.Vector3(x, y, z).add(sets[id].origin);
    },
  };
};

/* --------------------------------------------------------------------------
 * The cast.
 * ------------------------------------------------------------------------ */

export const buildDaisy = (w) => {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.26, 6), w.ink({ tint: "#4f8a3a", tone: 0.6, rim: 0.4 }));
  stem.position.y = -0.13;
  g.add(stem);
  const petal = w.ink({ tint: "#ffffff", tone: 1.1, rim: 0.3 });
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), petal);
    p.scale.set(0.35, 0.12, 1);
    const a = (i / 12) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.032, 0, Math.sin(a) * 0.032);
    p.rotation.y = -a + Math.PI / 2;
    g.add(p);
  }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), w.ink({ tint: "#ffcf3a", tone: 1, rim: 0.3 }));
  eye.scale.y = 0.6;
  g.add(eye);
  g.rotation.x = Math.PI / 2.4;
  return g;
};

/**
 * The Bomb Devil's head: a long, ridged iron shell swept back like a grenade
 * on its side, a wide grin of teeth, a crown of spikes with the pin in it,
 * and a wrapped neck. Built at life size, rooted at the neck.
 */
const buildBombHead = (w) => {
  const g = new THREE.Group();
  const iron = w.ink({ tint: "#2b2d35", tone: 0.62, rim: 1.4 });
  const dark = w.ink({ tint: "#1a1b20", tone: 0.5, rim: 1.2 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.14, 28, 18), iron);
  shell.scale.set(0.95, 1.0, 1.55);
  shell.position.set(0, 0.2, -0.07);
  g.add(shell);
  outline(shell, w.line);
  // Ridges across the skull, front to back.
  for (let i = 0; i < 6; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.135 * (1 - Math.abs(i - 2.5) * 0.07), 0.011, 6, 24, Math.PI), dark);
    arc.position.set(0, 0.2, 0.06 - i * 0.055);
    arc.scale.y = 1.02;
    g.add(arc);
  }
  // The grin: a black slot, teeth top and bottom, wider than any mouth should be.
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.05), w.flat);
  slot.position.set(0, 0.12, 0.1);
  g.add(slot);
  const teeth = w.ink({ tint: PAPER, tone: 1.2, rim: 0.2 });
  for (let i = 0; i < 11; i++) {
    const a = -0.75 + (i / 10) * 1.5;
    for (const [y, flip] of [[0.143, Math.PI], [0.097, 0]]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.022, 0.012), teeth);
      t.position.set(Math.sin(a) * 0.1, y, 0.08 + Math.cos(a) * 0.04);
      t.rotation.set(flip ? 0 : 0, -a, 0);
      g.add(t);
    }
  }
  // Spikes at the back of the crown; the pin hangs among them.
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.12 + (i % 2) * 0.05, 6), dark);
    const a = -0.8 + (i / 5) * 1.6;
    spike.position.set(Math.sin(a) * 0.05, 0.32, -0.2 + Math.cos(a) * 0.02);
    spike.rotation.set(-0.5, 0, -a * 0.6);
    g.add(spike);
  }
  const pin = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 8, 24), w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 }));
  pin.position.set(0.05, 0.36, -0.2);
  pin.rotation.y = Math.PI / 2;
  g.add(pin);
  // The neck, wrapped.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.16, 14), dark);
  neck.position.y = 0.04;
  g.add(neck);
  for (let i = 0; i < 4; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.008, 6, 18), iron);
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.02 + i * 0.035;
    g.add(band);
  }
  return g;
};

/** The canister she carries at her side: a tall banded drum. */
const buildCanister = (w) => {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.95, 20), w.ink({ tint: "#55565c", tone: 0.7, rim: 1 }));
  g.add(drum);
  outline(drum, w.line);
  const band = w.ink({ tint: "#1d1e22", tone: 0.5, rim: 0.8 });
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.107, 0.012, 6, 24), band);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.44 + i * 0.125;
    g.add(ring);
  }
  return g;
};

/** What they wear, from the film's model sheets. */
export const OUTFITS = {
  // White shirt, sleeves rolled, black tie, brown belt, dark slacks, white-and-red sneakers.
  denji: { skin: "#f2cfb0", top: "#eef0ea", bottom: "#2c3436", shoes: "#ecebe6", trim: "#b5332a", hair: "#e3a849", sleeves: "rolled", tie: "#15161b", belt: "#6b3f22" },
  // A white blouse under a black pinafore, short skirt, black thigh-highs, loafers.
  reze: { skin: "#f3d9cc", top: "#1d1b22", collar: "#f1efe9", sleeve: "#f1efe9", bottom: "#1d1b22", shoes: "#4a2b1a", hair: "#2a2140", sleeves: "short", skirt: 0.11, stockings: "#17161b", stockingsTop: 0.4 },
  // The Bomb Devil: the same clothes, sleeveless, gloved to the shoulder.
  bomb: { skin: "#f3d9cc", top: "#1d1b22", collar: "#f1efe9", arms: "#18181d", bottom: "#1d1b22", shoes: "#4a2b1a", hair: "#2a2140", sleeves: "none", skirt: 0.11, stockings: "#17161b", stockingsTop: 0.4 },
  devil: { skin: "#8f8578", top: "#7d7368", bottom: "#4a443e", shoes: "#2a2622", hair: "#2a2622", sleeves: "long" },
};

/**
 * Denji and Reze (plus any `devils`), loaded once and moved between sets.
 * Resolves with the cast; scenes check `cast.ready` before posing anyone.
 */
export const createCast = (w, { devils = 0, chainsaw = true, bomb = false, daisy = false } = {}) => {
  const cast = { denji: null, reze: null, devils: [], daisy: null, bombHead: null, saw: null };
  const steel = w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 });
  const rail = w.ink({ tint: "#2b2b2b", tone: 1.1, rim: 0.6 });
  const bone = w.ink({ tone: 1.15, rim: 0.2 });

  if (daisy) {
    cast.daisy = buildDaisy(w);
    w.scene.add(cast.daisy);
  }
  if (bomb) {
    cast.bombHead = buildBombHead(w);
    cast.bombHead.visible = false;
    w.scene.add(cast.bombHead);
  }

  const loads = [
    createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.78, rim: 1.4 }, outfit: OUTFITS.denji, fist: 0.35 }),
    createModelFigure({ body: "SuperheroFemale", height: 1.62, hair: ["HairLong", "EyebrowsFemale"], line: w.line, ink: { tone: 0.8, rim: 1.4 }, outfit: OUTFITS.reze, fist: 0.3 }),
    bomb ? createModelFigure({ body: "SuperheroFemale", height: 1.62, hair: [], line: w.line, ink: { tone: 0.8, rim: 1.4 }, outfit: OUTFITS.bomb, fist: 0.2 }) : null,
    ...Array.from({ length: devils }, (_, i) =>
      createModelFigure({ height: 1.8 + (i % 3) * 0.15, horns: true, line: w.line, ink: { tone: 0.55, rim: 1.3 }, outfit: OUTFITS.devil }),
    ),
  ];

  cast.ready = Promise.all(loads).then(([denji, reze, bombFig, ...devilFigs]) => {
    cast.denji = denji;
    cast.reze = reze;
    cast.devils = devilFigs;
    [denji, reze, bombFig, ...devilFigs].filter(Boolean).forEach((f) => {
      w.scene.add(f.root);
      w.register(f.root);
    });

    if (bombFig) {
      // Her other body: posed to match hers bone for bone at the moment she turns.
      bombFig.root.visible = false;
      bombFig.bones.head.scale.setScalar(0.001);
      bombFig.apply({});
      bombFig.root.updateMatrixWorld(true);
      const canister = buildCanister(w);
      canister.position.copy(bombFig.bones.hips.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0.21, -0.3, 0.02));
      w.scene.add(canister);
      bombFig.bones.hips.attach(canister);
      const bonesOf = (f) => {
        let skinned = null;
        f.model.traverse((o) => !skinned && o.isSkinnedMesh && (skinned = o));
        return skinned.skeleton.bones;
      };
      const from = bonesOf(reze);
      const to = bonesOf(bombFig);
      const q = new THREE.Quaternion();
      /** Swap Reze for the Bomb Devil in her exact pose. `grow` scales the head in. */
      cast.transform = (grow = 1) => {
        reze.root.visible = false;
        bombFig.root.visible = true;
        bombFig.root.position.copy(reze.root.position);
        bombFig.root.quaternion.copy(reze.root.quaternion);
        from.forEach((b, i) => {
          to[i].quaternion.copy(b.quaternion);
          to[i].position.copy(b.position);
        });
        bombFig.bones.head.scale.setScalar(0.001);
        bombFig.root.updateMatrixWorld(true);
        cast.bombHead.visible = true;
        bombFig.bones.neck.getWorldPosition(cast.bombHead.position);
        bombFig.bones.neck.getWorldQuaternion(q);
        cast.bombHead.quaternion.copy(q);
        cast.bombHead.scale.setScalar(Math.max(0.01, grow));
      };
      cast.untransform = () => {
        reze.root.visible = true;
        bombFig.root.visible = false;
        cast.bombHead.visible = false;
      };
    }

    // Clothes that need a silhouette, not just paint: collars, his tie, his belt.
    const dress = (fig, { tie, belt, collar }) => {
      fig.apply({});
      fig.root.updateMatrixWorld(true);
      const neckAt = fig.bones.neck.getWorldPosition(new THREE.Vector3());
      const hipsAt = fig.bones.hips.getWorldPosition(new THREE.Vector3());
      const chestBone = fig.bones.chest ?? fig.bones.spine;
      const pieces = [];
      if (collar) {
        const white = w.ink({ tint: collar, tone: 1.05, rim: 0.6 });
        for (const side of [-1, 1]) {
          const flap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.012), white);
          flap.position.copy(neckAt).add(new THREE.Vector3(side * 0.04, -0.035, 0.075));
          flap.rotation.set(-0.35, side * 0.5, side * -0.6);
          outline(flap, w.line);
          pieces.push([flap, fig.bones.neck]);
        }
      }
      if (tie) {
        // Solid ink, not shaded cloth: a lit black tie went grey and vanished
        // into the white shirt behind it.
        const black = w.flat;
        const knot = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.03), black);
        knot.position.copy(neckAt).add(new THREE.Vector3(0, -0.05, 0.09));
        outline(knot, w.line);
        pieces.push([knot, fig.bones.neck]);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.016), black);
        blade.geometry.translate(0, -0.17, 0);
        blade.position.copy(neckAt).add(new THREE.Vector3(0, -0.07, 0.115));
        blade.rotation.x = -0.12;
        outline(blade, w.line);
        pieces.push([blade, chestBone]);
      }
      if (belt) {
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.022, 6, 32), w.ink({ tint: belt, tone: 0.75, rim: 0.8 }));
        strap.rotation.x = Math.PI / 2;
        strap.scale.set(1, 0.72, 1);
        strap.position.copy(hipsAt).add(new THREE.Vector3(0, 0.085, 0.005));
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.012), w.ink({ tint: "#c9c4b8", tone: 1.2, rim: 0.4 }));
        buckle.position.copy(hipsAt).add(new THREE.Vector3(0, 0.085, 0.11));
        pieces.push([strap, fig.bones.hips], [buckle, fig.bones.hips]);
      }
      pieces.forEach(([mesh, bone]) => {
        w.scene.add(mesh);
        bone.attach(mesh);
      });
    };
    dress(denji, { collar: "#eef0ea", tie: "#15161b", belt: "#6b3f22" });
    dress(reze, { collar: "#f1efe9" });

    // Her choker, and the pin hanging from it.
    reze.apply({});
    reze.root.updateMatrixWorld(true);
    const neck = reze.bones.neck;
    const neckAt = neck.getWorldPosition(new THREE.Vector3());
    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 28), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }));
    choker.rotation.x = Math.PI / 2;
    choker.position.copy(neckAt).add(new THREE.Vector3(0, 0.04, 0.005));
    w.scene.add(choker);
    neck.attach(choker);
    const pin = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 18), steel);
    pin.position.copy(neckAt).add(new THREE.Vector3(0, 0.0, 0.06));
    w.scene.add(pin);
    neck.attach(pin);
    cast.pin = pin;

    if (chainsaw) {
      const { head, blade } = createChainsawHead({ skin: w.ink({ tint: "#d65a24", tone: 0.92, rim: 1.2 }), steel, rail, ink: w.flat, bone, line: w.line, lineThin: w.line, scale: 1.05, bladeLength: 0.7 });
      // A blade out of each forearm, as in the film.
      const armBlades = ["r", "l"].map(() => createBlade({ length: 0.6, radius: 0.07, steel, rail, ink: w.flat, line: w.line, teeth: 22, thickness: 0.03 }));
      denji.apply({});
      denji.root.updateMatrixWorld(true);
      const dNeck = denji.model.getObjectByName("neck_01") ?? denji.bones.neck;
      head.position.copy(denji.bones.neck.getWorldPosition(new THREE.Vector3()));
      w.scene.add(head);
      dNeck.attach(head);
      const scale = head.scale.clone();
      armBlades.forEach((armBlade, i) => {
        const side = i ? "l" : "r";
        armBlade.group.position.copy(denji.model.getObjectByName(`hand_${side}`).getWorldPosition(new THREE.Vector3()));
        aim(armBlade.group, new THREE.Vector3(0, -1, 0.08), new THREE.Vector3(0, 0, 1));
        w.scene.add(armBlade.group);
        denji.bones[`${side}Elbow`].attach(armBlade.group);
      });
      // The starter cord in his chest: a T-grip on the sternum and the cord
      // behind it. Pulled, the grip rides his right hand out and the cord
      // stretches after it; let go, it snaps home.
      const chestBone = denji.bones.chest ?? denji.bones.spine;
      const anchor = new THREE.Object3D();
      anchor.position.copy(denji.bones.neck.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, -0.2, 0.13));
      w.scene.add(anchor);
      chestBone.attach(anchor);
      const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.1, 4, 12), rail);
      grip.geometry.rotateZ(Math.PI / 2);
      outline(grip, w.line);
      const cordGeo = new THREE.CylinderGeometry(0.011, 0.011, 1, 6);
      cordGeo.translate(0, 0.5, 0);
      // Dark rope: it runs across a white shirt.
      const cordLine = new THREE.Mesh(cordGeo, w.ink({ tint: "#3a3430", tone: 0.8, rim: 0.4 }));
      outline(cordLine, w.line);
      w.scene.add(grip, cordLine);
      const handR = denji.model.getObjectByName("hand_r");
      const from = new THREE.Vector3();
      const to = new THREE.Vector3();
      const run = new THREE.Vector3();
      /** `grab` 0 = the grip home on his chest, 1 = in his right hand, wherever it is. */
      cast.cord = {
        set(show, grab = 0) {
          grip.visible = cordLine.visible = show;
          if (!show) return;
          denji.root.updateMatrixWorld(true);
          anchor.getWorldPosition(from);
          handR.getWorldPosition(to);
          grip.position.copy(from).lerp(to, grab);
          grip.quaternion.copy(denji.root.quaternion);
          run.subVectors(grip.position, from);
          cordLine.visible = run.length() > 0.02;
          cordLine.position.copy(from);
          cordLine.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, run.clone().normalize());
          cordLine.scale.set(1, Math.max(0.001, run.length()), 1);
        },
      };
      cast.cord.set(false);

      /** 0 = Denji, 1 = the Chainsaw Man. */
      cast.saw = {
        set(k, time = 0) {
          denji.bones.head.scale.setScalar(k > 0.5 ? 0.001 : 1);
          head.visible = k > 0.01;
          head.scale.copy(scale).multiplyScalar(Math.max(0.001, k));
          blade.extend(k);
          blade.run(time * 9);
          armBlades.forEach((b, i) => {
            b.extend(k);
            b.run(time * (10 + i));
          });
        },
      };
      cast.saw.set(0);
    }
    w.sync();
    return cast;
  });
  return cast;
};

/* --------------------------------------------------------------------------
 * Particles the films share: fireworks, blasts, spray, splashes.
 * ------------------------------------------------------------------------ */

export const createFx = (w) => {
  const sky = createParticles({ count: 1200, blending: "add" });
  const hit = createParticles({ count: 700, blending: "add" });
  w.scene.add(sky.points, hit.points);
  const burst = (ps, at, n, colors, speed, life, size = 0.13, gravity = 1.2) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const v = speed * (0.6 + Math.random() * 0.4);
      ps.emit({
        position: [at.x, at.y, at.z],
        velocity: [Math.sin(b) * Math.cos(a) * v, Math.cos(b) * v, Math.sin(b) * Math.sin(a) * v],
        life: life * (0.7 + Math.random() * 0.5),
        size: size + Math.random() * size * 0.6,
        gravity,
        drag: 1.2,
        color: colors[i % colors.length],
        intensity: 2.2,
      });
    }
  };
  return {
    sky,
    hit,
    firework(at, warm) {
      burst(sky, at, 220, warm ? ["#ffb36b", "#ff7a3d", "#fff1c9"] : ["#ff6fb0", "#c79bff", "#fff1fb"], 6, 2.2);
    },
    blast(at) {
      burst(hit, at, 420, ["#ffb36b", "#ff6fb0", "#fff1c9", "#ff4b2b"], 9, 1.4);
    },
    blood(at, n = 160) {
      burst(hit, at, n, ["#c8102e", "#ff1d3d", "#5a0410"], 5, 0.9, 0.08, 6);
    },
    splash(at, n = 60) {
      burst(hit, at, n, ["#d8f6ff", "#8fe3ff", "#ffffff"], 2.6, 0.9, 0.025, 7);
    },
    step(dt) {
      sky.step(dt);
      hit.step(dt);
    },
    clear() {
      sky.step(10);
      hit.step(10);
    },
    resize(height, fov, pr) {
      [sky, hit].forEach((p) => p.resize(height, fov, pr));
    },
  };
};

/* --------------------------------------------------------------------------
 * Editing: the DOM layer over the canvas.
 * ------------------------------------------------------------------------ */

export const createCuts = (overlay) => {
  const el = (style) => {
    const d = document.createElement("div");
    d.setAttribute("aria-hidden", "true");
    Object.assign(d.style, { position: "absolute", pointerEvents: "none", ...style });
    overlay?.appendChild(d);
    return d;
  };
  const iris = el({ inset: "0", opacity: "0" });
  const flash = el({ inset: "0", background: "#fff6ea", opacity: "0" });
  const black = el({ inset: "0", background: INK, opacity: "0" });
  const barTop = el({ left: "0", right: "0", top: "0", height: "0", background: INK });
  const barBot = el({ left: "0", right: "0", bottom: "0", height: "0", background: INK });
  return {
    /**
     * `iris`: 0 = closed to a point, 1 = fully open (none drawn). `at` is the
     * iris centre in % of the frame; `ring` paints the edge in the accent.
     */
    update({ iris: r = 1, at = [50, 50], ring = "#c8102e", flash: f = 0, flashColor = "#fff6ea", black: b = 0, bars = 0 }) {
      if (r >= 0.999) iris.style.opacity = "0";
      else {
        const radius = Math.max(0, r) * 120;
        iris.style.opacity = "1";
        iris.style.background = `radial-gradient(circle at ${at[0]}% ${at[1]}%, transparent ${radius}vmax, ${ring} ${radius}vmax, ${ring} ${radius + 0.6}vmax, ${INK} ${radius + 0.6}vmax)`;
      }
      flash.style.opacity = String(f);
      flash.style.background = flashColor;
      black.style.opacity = String(b);
      barTop.style.height = `${bars * 12}%`;
      barBot.style.height = `${bars * 12}%`;
    },
    el,
    dispose() {
      [iris, flash, black, barTop, barBot].forEach((x) => x.remove());
    },
  };
};

/**
 * Sit a posed figure on a seat: moves the root so the hip joint lands just
 * above `surface` (a world point on the seat top). Call after `apply(pose)`.
 */
export const seat = (fig, surface, rise = 0.11) => {
  fig.root.updateMatrixWorld(true);
  const hips = fig.bones.hips.getWorldPosition(new THREE.Vector3());
  fig.root.position.add(surface.clone().add(new THREE.Vector3(0, rise, 0)).sub(hips));
  fig.root.updateMatrixWorld(true);
};

/** The shot playing at `c`, and how far into it we are. */
export const shotAt = (shots, c) => {
  for (let i = shots.length - 1; i >= 0; i--) {
    if (c >= shots[i].t) {
      const end = shots[i + 1]?.t ?? Infinity;
      return { shot: shots[i], index: i, s: c - shots[i].t, u: Math.min(1, (c - shots[i].t) / Math.max(0.001, end - shots[i].t)), len: end - shots[i].t };
    }
  }
  return { shot: shots[0], index: 0, s: 0, u: 0, len: 1 };
};

export { PAPER, INK };
