import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTexture, createParticles, hash, lerp, lightBeam } from "./kit";
import { INK, PAPER, inkMaterial, mangaBackdrop, outlineMaterial, outline, syncInk } from "./ink";
import { createModelFigure } from "./modelFigure";
import { addBladeBlood, aim, bloodMaterial, createBlade, createHybridHead } from "./chainsawParts";

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
  // Her café's name on a signboard over the window: Crossroads.
  box(2.5, 0.52, 0.06, frame, 2.4, 3.5, -2.57, g);
  const name = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.46),
    new THREE.MeshBasicMaterial({
      transparent: true,
      toneMapped: false,
      map: canvasTexture(1024, 196, (ctx, cw, ch) => {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f6e3bd";
        ctx.font = "italic 700 128px Georgia, 'Times New Roman', serif";
        ctx.fillText("Crossroads", cw / 2, ch * 0.42);
        ctx.font = "600 36px Georgia, 'Times New Roman', serif";
        ctx.fillText("C  A  F  É", cw / 2, ch * 0.86);
      }),
    }),
  );
  name.position.set(2.4, 3.5, -2.535);
  g.add(name);
  g.add(name);
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
  // Each stem goes in through the mouth and stands in the water near the
  // bottom; the heads lean apart above it.
  const foot = new THREE.Vector3();
  for (const [tilt, roll, yaw] of [[-0.16, 0.2, 0.4], [0.2, -0.22, -0.6]]) {
    const own = buildDaisy(w);
    own.scale.setScalar(1.25);
    own.rotation.set(tilt, yaw, roll);
    own.updateMatrix();
    foot.set(0, -0.25, 0).applyMatrix4(own.matrix);
    // Set the foot back against the lean, so the stem crosses the mouth near its middle.
    const lean = foot.clone().negate().normalize();
    own.position.set(-0.45 - lean.x * 0.08, 1.14, -0.42 - lean.z * 0.08).sub(foot);
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

/** A daisy, its head at the origin and the stem hanging 0.26 below it. `petals` tints it (white by default). */
export const buildDaisy = (w, { petals = "#ffffff" } = {}) => {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.26, 6), w.ink({ tint: "#4f8a3a", tone: 0.6, rim: 0.4 }));
  stem.position.y = -0.13;
  g.add(stem);
  const petal = w.ink({ tint: petals, tone: 1.1, rim: 0.3 });
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

/** A lathe profile's radius at height `y` (points are [radius, height], rising). */
const profileAt = (prof, y) => {
  for (let i = 1; i < prof.length; i++) {
    if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / Math.max(1e-6, prof[i][1] - prof[i - 1][1]));
  }
  return prof[prof.length - 1][0];
};

/** A rope along `points` (Vector3s): a CatmullRom tube. */
const rope = (points, radius, closed = false, segments = points.length * 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), segments, radius, 5, closed);

/**
 * A three-strand braid along `points`. `out(p)` is the direction away from
 * the body at p (the braid lies flat against it); `r` is one strand's radius.
 */
const braid = (points, r, out, perMetre = 70) => {
  const curve = new THREE.CatmullRomCurve3(points);
  const len = curve.getLength();
  const n = Math.max(8, Math.ceil(len * 160));
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  return [0, 1, 2].map((k) => {
    const strand = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u);
      curve.getTangentAt(u, tangent);
      const o = out(p);
      side.crossVectors(tangent, o).normalize();
      const a = u * len * perMetre + (k * Math.PI * 2) / 3;
      strand.push(p.clone().addScaledVector(side, Math.cos(a) * r * 1.5).addScaledVector(o, Math.sin(a) * r * 0.8));
    }
    return rope(strand, r, false, n * 2);
  });
};

/**
 * The Bomb Devil's head, after the film: a smooth black casing like a warhead
 * on its side, nose forward and tail lifted, seams round the shell and a small
 * finned tail; a lipless skull grin of teeth across the bottom of the nose;
 * fuse cord wound up the neck. Built at life size, rooted at the neck, face +z.
 */
const buildBombHead = (w) => {
  const g = new THREE.Group();
  const iron = w.ink({ tint: "#25262d", tone: 0.62, rim: 1.4 });
  const dark = w.ink({ tint: "#121317", tone: 0.5, rim: 1 });
  const fuse = w.ink({ tint: "#2b2622", tone: 0.62, rim: 0.9 });
  const teeth = w.ink({ tint: PAPER, tone: 1.2, rim: 0.2 });

  // The neck, the fuse wound up it in loose turns.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.15, 14), dark);
  neck.position.y = 0.05;
  g.add(neck);
  const coil = [];
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * Math.PI * 2 * 5.5;
    const r = 0.05 + 0.003 * Math.sin(a * 2.3);
    coil.push(new THREE.Vector3(Math.cos(a) * r, -0.012 + (i / 90) * 0.13, Math.sin(a) * r));
  }
  const wound = new THREE.Mesh(rope(coil, 0.0078, false, 300), fuse);
  g.add(wound);
  outline(wound, w.line);

  // The shell: a lathe from the nose (height 0) back to the tail.
  // Lying across her shoulders like the figure's: the nose turned to her right
  // and a little down, the finned tail back over her left shoulder and up.
  const skull = new THREE.Group();
  skull.position.set(0.03, 0.2, 0.02);
  skull.rotation.set(0.26, -0.55, 0, "YXZ");
  g.add(skull);
  const NOSE = 0.17;
  const WIDE = 0.94; // a touch narrower than tall
  const prof = [[0, 0], [0.05, 0.005], [0.085, 0.022], [0.106, 0.05], [0.118, 0.095], [0.12, 0.15], [0.11, 0.215], [0.09, 0.275], [0.064, 0.325], [0.042, 0.365], [0.03, 0.4], [0.024, 0.43], [0, 0.44]];
  const shellGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36);
  shellGeo.rotateX(-Math.PI / 2); // nose to tail runs toward -z
  shellGeo.scale(WIDE, 1, 1);
  shellGeo.translate(0, 0, NOSE);
  const shell = new THREE.Mesh(shellGeo, iron);
  skull.add(shell);
  outline(shell, w.line);
  // Seams round the shell.
  const seams = [0.075, 0.135, 0.2, 0.265, 0.325].map((y) => {
    const ring = new THREE.TorusGeometry(profileAt(prof, y) + 0.002, 0.0042, 6, 44);
    ring.scale(WIDE, 1, 1);
    return ring.translate(0, 0, NOSE - y);
  });
  skull.add(new THREE.Mesh(mergeGeometries(seams), dark));
  // The tail: three small swept fins round the tip.
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(0.06, 0);
  fin.lineTo(0.075, 0.05);
  fin.lineTo(0.022, 0.018);
  fin.lineTo(0, 0);
  const fins = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((roll) => {
    const f = new THREE.ExtrudeGeometry(fin, { depth: 0.007, bevelEnabled: false });
    f.translate(0, 0.018, -0.0035);
    f.rotateY(Math.PI / 2); // runs back along -z, stands up +y
    f.rotateZ(roll);
    return f.translate(0, 0, NOSE - 0.37);
  });
  const tail = new THREE.Mesh(mergeGeometries(fins), iron);
  skull.add(tail);
  outline(tail, w.line);

  // The grin, across the bottom of the nose: a dark slot, square skull teeth
  // above and below it, no lips. Each tooth sits on the shell's surface.
  const onShell = (a, y) => {
    const c = new THREE.Vector3(0, y, NOSE - 0.11);
    const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const p = new THREE.Vector3();
    for (let s = 0; s < 0.2; s += 0.002) {
      p.copy(c).addScaledVector(d, s);
      const depth = NOSE - p.z;
      if (depth < 0 || Math.hypot(p.x / WIDE, p.y) > profileAt(prof, depth)) return p;
    }
    return p;
  };
  // Big square teeth, a skull's, clenched in a grin.
  const MOUTH = -0.05;
  const slot = [];
  for (let i = 0; i <= 16; i++) slot.push(onShell(lerp(-1.15, 1.15, i / 16), MOUTH));
  skull.add(new THREE.Mesh(rope(slot, 0.02, false, 48), w.flat));
  const toothGeo = [];
  for (const [y, h] of [[MOUTH + 0.02, -1], [MOUTH - 0.02, 1]]) {
    for (let i = 0; i < 10; i++) {
      const a = lerp(-1.0, 1.0, (i + 0.5) / 10);
      const t = new THREE.BoxGeometry(0.017, 0.036, 0.012);
      t.translate(0, (h * 0.016) / 2, 0.003);
      t.rotateY(a);
      const p = onShell(a, y);
      toothGeo.push(t.translate(p.x, p.y, p.z));
    }
  }
  const grin = new THREE.Mesh(mergeGeometries(toothGeo), teeth);
  skull.add(grin);
  outline(grin, w.line);
  return g;
};

/**
 * The dynamite she wears down the front of her skirt: a long, flat-fronted
 * bundle of thin black sticks as wide as her hips, from the waist to the
 * ankles, bound by eight cord bands evenly down it, the bottom ends ragged.
 * Top centre at the origin, it hangs down -y, face +z. `DYNAMITE` holds a
 * stick's radius and the bundle's half width and half depth.
 */
const DYNAMITE = { stick: 0.0105, w: 0.13, d: 0.016 };
const buildDynamite = (w, length) => {
  const { stick, w: W, d: D } = DYNAMITE;
  const g = new THREE.Group();
  const sticks = [];
  let n = 0;
  // Two staggered rows: the front one flat, the back one showing in the gaps.
  for (const [z, shift] of [[D * 0.55, 0], [-D * 0.55, stick]]) {
    for (let x = -W + shift; x <= W + 1e-6; x += stick * 2.05) {
      // Ragged ends: no two sticks quite the same length, the bottom most of all.
      const top = hash(n * 3 + 1) * 0.015;
      const len = length - top - hash(n * 3 + 2) * 0.06;
      const s = new THREE.CylinderGeometry(stick, stick * 0.96, len, 8);
      sticks.push(s.translate(x, -top - len / 2, z));
      n++;
    }
  }
  const bundle = new THREE.Mesh(mergeGeometries(sticks), w.ink({ tint: "#26262c", tone: 0.72, rim: 1.1 }));
  g.add(bundle);
  outline(bundle, w.line);
  // The bands: flat across the front and back, rounded at the sides.
  const straps = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const y = -lerp(0.05, length - 0.1, i / (N - 1));
    const loop = [];
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      const sx = Math.sin(a);
      const cz = Math.cos(a);
      loop.push(new THREE.Vector3(Math.sign(sx) * Math.abs(sx) ** 0.2 * (W + stick + 0.003), y, Math.sign(cz) * Math.abs(cz) ** 0.6 * (D + stick + 0.003)));
    }
    straps.push(rope(loop, 0.0055, true, 96));
  }
  const strapMesh = new THREE.Mesh(mergeGeometries(straps), w.ink({ tint: "#0e0e11", tone: 0.5, rim: 0.9 }));
  g.add(strapMesh);
  outline(strapMesh, w.line);
  return g;
};

/**
 * What the Bomb Devil wears over Reze's clothes, fitted to `fig` at rest: the
 * white collar and black ribbon, a halter of braided fuse cord over them, and
 * gloves of knotted cord to the shoulder with frayed ends, all on her bones;
 * and the dynamite column, in the scene. Returns `{ dynamite, hang }`: call
 * `hang()` once she is posed. The column hangs plumb from her waist over her
 * right leg, and swings forward over the knee when that thigh comes up.
 */
const dressBombDevil = (w, fig) => {
  const cordMat = w.ink({ tint: "#1d1b21", tone: 0.66, rim: 1.1 });
  const at = (o) => o.getWorldPosition(new THREE.Vector3());
  const pin = (geos, bone, material = cordMat) => {
    const mesh = new THREE.Mesh(mergeGeometries(geos), material);
    mesh.userData.devilWear = true;
    outline(mesh, w.line);
    w.scene.add(mesh);
    bone.attach(mesh);
    return mesh;
  };

  // The body's surface at rest, in world space.
  let body = null;
  fig.model.traverse((o) => o.isSkinnedMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = o));
  const pts = [];
  for (let i = 0; i < body.geometry.attributes.position.count; i++) pts.push(body.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(body.matrixWorld));
  /** The front (dir 1) or back (dir -1) of the body at (x, y), or null off it. */
  const surface = (x, y, dir = 1, r = 0.012) => {
    let z = null;
    for (const p of pts) if (Math.abs(p.x - x) < r && Math.abs(p.y - y) < r && (z === null || (p.z - z) * dir > 0)) z = p.z;
    return z;
  };
  const neckAt = at(fig.bones.neck);
  const hipsAt = at(fig.bones.hips);
  const chest = fig.bones.chest ?? fig.bones.spine;
  const midZ = (y) => ((surface(0, y, 1) ?? 0.1) + (surface(0, y, -1) ?? -0.1)) / 2;
  /** Half the torso's width at y, across its front. */
  const halfWidth = (y) => {
    const mz = midZ(y);
    let x = 0;
    while (x < 0.25 && (surface(x + 0.006, y, 1) ?? -Infinity) > mz && (surface(-x - 0.006, y, 1) ?? -Infinity) > mz) x += 0.006;
    return x;
  };

  // The white collar and the black ribbon under it.
  const white = w.ink({ tint: "#f1efe9", tone: 1.05, rim: 0.6 });
  const neckFront = surface(0, neckAt.y - 0.04, 1) ?? neckAt.z + 0.06;
  const collar = [-1, 1].map((s) => {
    const flap = new THREE.BoxGeometry(0.07, 0.048, 0.01);
    flap.rotateZ(s * -0.6);
    flap.rotateY(s * 0.5);
    flap.rotateX(-0.35);
    return flap.translate(neckAt.x + s * 0.038, neckAt.y - 0.035, neckFront + 0.012);
  });
  pin(collar, fig.bones.neck, white);
  const bow = [];
  for (const s of [-1, 1]) {
    const loop = new THREE.TorusGeometry(0.012, 0.0035, 5, 14);
    loop.scale(1.3, 0.8, 0.6);
    bow.push(loop.translate(neckAt.x + s * 0.015, neckAt.y - 0.058, neckFront + 0.02));
    bow.push(rope([new THREE.Vector3(neckAt.x, neckAt.y - 0.06, neckFront + 0.02), new THREE.Vector3(neckAt.x + s * 0.008, neckAt.y - 0.1, neckFront + 0.024), new THREE.Vector3(neckAt.x + s * 0.016, neckAt.y - 0.14, neckFront + 0.022)], 0.0032));
  }
  pin(bow, fig.bones.neck, w.flat);

  // The halter: rows of braided cord across her front from the waist to the
  // bust, straps from the bust round the back of the neck. The top rows ride
  // the chest, the lower ones the spine, so a bend creases it at the middle.
  const top = neckAt.y - 0.13;
  const bottom = hipsAt.y + 0.09;
  const mid = (top + bottom) / 2;
  const rows = { upper: [], lower: [] };
  const flat = () => new THREE.Vector3(0, 0, 1);
  for (let y = bottom, i = 0; y <= top; y += 0.019, i++) {
    const hw = halfWidth(y) * 0.92;
    const path = [];
    for (let k = 0; k <= 12; k++) {
      const x = lerp(-hw, hw, k / 12);
      const z = surface(x, y, 1, 0.015);
      if (z !== null) path.push(new THREE.Vector3(x, y + 0.004 * Math.sin(k * 1.7 + i * 2.3), z + 0.008));
    }
    if (path.length > 3) rows[y > mid ? "upper" : "lower"].push(...braid(path, 0.0042, flat));
  }
  const hwTop = halfWidth(top) * 0.92;
  const neckAxis = new THREE.Vector3(neckAt.x, 0, neckAt.z);
  const away = (p) => new THREE.Vector3(p.x, 0, p.z).sub(neckAxis).normalize();
  for (const s of [-1, 1]) {
    const y1 = neckAt.y - 0.065;
    const strap = [
      new THREE.Vector3(s * hwTop * 0.75, top, (surface(s * hwTop * 0.75, top, 1, 0.015) ?? neckFront) + 0.008),
      new THREE.Vector3(s * 0.055, y1, (surface(s * 0.055, y1, 1, 0.015) ?? neckFront) + 0.01),
      new THREE.Vector3(neckAt.x + s * 0.062, neckAt.y - 0.03, neckAt.z + 0.01),
      new THREE.Vector3(neckAt.x + s * 0.035, neckAt.y - 0.035, neckAt.z - 0.058),
      new THREE.Vector3(neckAt.x, neckAt.y - 0.04, neckAt.z - 0.064),
    ];
    rows.upper.push(...braid(strap, 0.0042, away));
  }
  pin(rows.upper, chest);
  if (rows.lower.length) pin(rows.lower, fig.bones.spine);

  // The skirt: short, black, a little flared, with soft folds at the hem. Four
  // panels, each hung from the hip joint on its side, so a raised thigh lifts
  // the front of the skirt (or a kick back the back of it) instead of going
  // through the cloth.
  const span = (y) => {
    const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
    for (const p of pts) {
      if (Math.abs(p.y - y) > 0.012 || Math.abs(p.x - hipsAt.x) > 0.22) continue;
      b.x0 = Math.min(b.x0, p.x);
      b.x1 = Math.max(b.x1, p.x);
      b.z0 = Math.min(b.z0, p.z);
      b.z1 = Math.max(b.z1, p.z);
    }
    return { cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, rx: (b.x1 - b.x0) / 2, rz: (b.z1 - b.z0) / 2 };
  };
  const skirtTop = hipsAt.y + 0.075;
  const skirtLen = 0.2;
  const waist = span(skirtTop);
  const hem = span(skirtTop - skirtLen);
  const skirtMat = w.ink({ tint: "#1a191f", tone: 0.7, rim: 1.2 });
  skirtMat.side = THREE.DoubleSide;
  const thighs = ["l", "r"].map((sd) => ({ hip: fig.bones[`${sd}Hip`], knee: fig.bones[`${sd}Knee`] }));
  const hipsQ = fig.bones.hips.getWorldQuaternion(new THREE.Quaternion()).invert();
  const toHips = (v) => v.clone().applyQuaternion(hipsQ);
  const fwdL = toHips(new THREE.Vector3(0, 0, 1));
  const upL = toHips(new THREE.Vector3(0, 1, 0));
  const sideL = toHips(new THREE.Vector3(1, 0, 0));
  /** How far forward a thigh swings, in the hips' frame (radians, 0 hanging). */
  const thighAngle = ({ hip, knee }) => {
    const d = toHips(knee.getWorldPosition(new THREE.Vector3()).sub(hip.getWorldPosition(new THREE.Vector3())));
    return Math.atan2(d.dot(fwdL), -d.dot(upL));
  };
  const skirt = [];
  for (const [t0, front] of [[0, 1], [Math.PI / 2, 0], [Math.PI, 0], [Math.PI * 1.5, 1]]) {
    const geo = new THREE.CylinderGeometry(1, 1, skirtLen, 14, 4, true, t0 - 0.06, Math.PI / 2 + 0.12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const a = Math.atan2(pos.getX(i), pos.getZ(i));
      const t = 0.5 - pos.getY(i) / skirtLen; // 0 at the waist, 1 at the hem
      const fold = 1 + 0.05 * t * Math.sin(a * 9);
      const rx = (lerp(waist.rx, hem.rx, t) + 0.012 + 0.03 * t) * fold;
      const rz = (lerp(waist.rz, hem.rz, t) + 0.012 + 0.03 * t) * fold;
      pos.setXYZ(i, lerp(waist.cx, hem.cx, t) + Math.sin(a) * rx, skirtTop - t * skirtLen, lerp(waist.cz, hem.cz, t) + Math.cos(a) * rz);
    }
    geo.computeVertexNormals();
    // The panel's side: + x is her left.
    const thigh = thighs.reduce((best, th) => (Math.sign(at(th.hip).x - hipsAt.x) === Math.sign(Math.sin(t0 + Math.PI / 4)) ? th : best), thighs[0]);
    const pivot = new THREE.Object3D();
    pivot.position.copy(at(thigh.hip));
    const mesh = new THREE.Mesh(geo.translate(-pivot.position.x, -pivot.position.y, -pivot.position.z), skirtMat);
    mesh.userData.devilWear = true;
    outline(mesh, w.line);
    pivot.add(mesh);
    w.scene.add(pivot);
    fig.bones.hips.attach(pivot);
    skirt.push({ pivot, q0: pivot.quaternion.clone(), thigh, front, rest: thighAngle(thigh) });
  }
  const swingQ = new THREE.Quaternion();
  const liftSkirt = () =>
    skirt.forEach(({ pivot, q0, thigh, front, rest }) => {
      const a = thighAngle(thigh) - rest;
      const k = front ? Math.min(1.3, Math.max(0, a) * 0.85) : Math.max(-1.0, Math.min(0, a) * 0.85);
      pivot.quaternion.copy(swingQ.setFromAxisAngle(sideL, -k)).multiply(q0);
    });

  // The gloves: knotted rings of cord down each arm, sized to it, frayed
  // ends sticking out of the top and the cuff.
  const ringAt = (P, d, seed) => {
    const radii = [];
    const q = new THREE.Vector3();
    for (const p of pts) {
      q.subVectors(p, P);
      const along = q.dot(d);
      if (Math.abs(along) > 0.012) continue;
      const rho = q.addScaledVector(d, -along).length();
      if (rho < 0.075) radii.push(rho);
    }
    radii.sort((a, b) => a - b);
    const r = THREE.MathUtils.clamp(radii[Math.floor(radii.length / 2)] ?? 0.035, 0.022, 0.055) + 0.005;
    const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    const loop = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const rk = r * (1 + 0.1 * (hash(seed * 31 + k) - 0.5));
      loop.push(new THREE.Vector3(Math.cos(a) * rk, (hash(seed * 17 + k) - 0.5) * 0.008, Math.sin(a) * rk).applyQuaternion(turn).add(P));
    }
    const geos = [rope(loop, 0.0058, true, 42)];
    // A knot or two on every ring.
    for (let k = 0; k < 2; k++) {
      const a = hash(seed * 7 + k) * Math.PI * 2;
      const knot = new THREE.SphereGeometry(0.0095, 6, 4);
      knot.scale(1.3, 0.9, 1);
      knot.applyQuaternion(turn);
      geos.push(knot.translate(...new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(turn).add(P).toArray()));
    }
    return { geos, r, turn };
  };
  const frays = (P, d, r, turn, seed, count, reach) =>
    Array.from({ length: count }, (_, k) => {
      const a = hash(seed + k * 5) * Math.PI * 2;
      const base = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(turn).add(P);
      const spread = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(turn);
      const len = reach * (0.5 + hash(seed + k * 5 + 1) * 0.8);
      const dir = d.clone().multiplyScalar(0.8).addScaledVector(spread, 0.7).normalize();
      const bend = spread.clone().multiplyScalar(len * 0.25);
      return rope([base, base.clone().addScaledVector(dir, len * 0.5).add(bend), base.clone().addScaledVector(dir, len).add(bend.multiplyScalar(2.2))], 0.0042, false, 12);
    });
  ["l", "r"].forEach((side, si) => {
    const shoulder = fig.bones[`${side}Shoulder`];
    const elbow = fig.bones[`${side}Elbow`];
    const hand = fig.model.getObjectByName(`hand_${side}`);
    const S = at(shoulder);
    const E = at(elbow);
    const H = hand ? at(hand) : E.clone().lerp(S, -1);
    for (const [from, to, bone, t0, t1, part] of [
      [S, E, shoulder, 0.42, 1, 0], // opera length: the shoulders bare
      [E, H, elbow, 0.04, 0.96, 1],
    ]) {
      const d = to.clone().sub(from).normalize();
      const len = from.distanceTo(to);
      const geos = [];
      const n = Math.max(3, Math.round(((t1 - t0) * len) / 0.021));
      let first = null;
      let last = null;
      for (let i = 0; i <= n; i++) {
        const P = from.clone().lerp(to, lerp(t0, t1, i / n));
        const ring = ringAt(P, d, si * 100 + part * 50 + i);
        geos.push(...ring.geos);
        if (i === 0) first = { P, ...ring };
        last = { P, ...ring };
      }
      // Frayed: out of the top of the glove, and loose at the cuff.
      if (part === 0) geos.push(...frays(first.P, d.clone().negate(), first.r, first.turn, si * 13 + 3, 6, 0.08));
      else geos.push(...frays(last.P, d, last.r, last.turn, si * 13 + 7, 3, 0.05));
      pin(geos, bone);
    }
  });

  // The dynamite: hung from a point on the front of her waist over her right
  // leg, clear of her thigh all the way down.
  const thighR = fig.model.getObjectByName("thigh_r");
  const side = Math.sign((thighR ? at(thighR).x : -1) - hipsAt.x) || -1;
  const footR = fig.model.getObjectByName("foot_r");
  const cx = side * 0.03;
  const waistY = hipsAt.y + 0.06;
  let clear = -Infinity;
  for (let y = (footR ? at(footR).y : 0.1) + 0.05; y <= waistY; y += 0.02) {
    for (let x = cx - DYNAMITE.w; x <= cx + DYNAMITE.w; x += 0.02) clear = Math.max(clear, surface(x, y, 1, 0.012) ?? -Infinity);
  }
  if (!Number.isFinite(clear)) clear = hipsAt.z + 0.12;
  const hinge = new THREE.Object3D();
  hinge.position.set(cx, waistY, Math.max(clear, hem.cz + hem.rz + 0.04) + DYNAMITE.d + DYNAMITE.stick + 0.008);
  w.scene.add(hinge);
  fig.bones.hips.attach(hinge);
  const length = waistY - ((footR ? at(footR).y : 0.1) + 0.06);
  const dynamite = buildDynamite(w, length);
  dynamite.children.forEach((o) => (o.userData.devilWear = true));
  dynamite.visible = false;
  w.scene.add(dynamite);

  // How far the front of each knee stands ahead of the hang line, at rest: the
  // column is as wide as her hips, so either knee can push it.
  const kneesOf = [["calf_r", "rKnee", side], ["calf_l", "lKnee", -side]].map(([name, bone, sd]) => ({ o: fig.model.getObjectByName(name) ?? fig.bones[bone], sd })).filter((k) => k.o);
  const yaw = new THREE.Quaternion();
  const fwd = new THREE.Vector3();
  const v = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const swing = new THREE.Quaternion();
  const tip = new THREE.Quaternion();
  const LEAN = 0.05; // at rest the foot of it tucks in toward her shins
  const tiltOf = (knee) => {
    knee.getWorldPosition(v).addScaledVector(fwd, 0.06 + DYNAMITE.d + DYNAMITE.stick).sub(dynamite.position);
    return Math.atan2(v.dot(fwd), Math.max(0.02, -v.y));
  };
  hinge.getWorldPosition(dynamite.position);
  fwd.set(0, 0, 1);
  kneesOf.forEach((k) => (k.rest = tiltOf(k.o)));
  const hang = () => {
    dynamite.visible = true;
    fig.root.updateMatrixWorld(true);
    liftSkirt();
    hinge.getWorldPosition(dynamite.position);
    fig.root.getWorldQuaternion(yaw);
    fwd.set(0, 0, 1).applyQuaternion(yaw);
    // A raised thigh pushes it forward only so far, then out to the side:
    // pushed level, a column of sticks off her lap reads as a gun.
    let lift = 0;
    let to = side;
    for (const k of kneesOf) {
      const l = tiltOf(k.o) - k.rest;
      if (l > lift) [lift, to] = [l, k.sd];
    }
    swing.setFromAxisAngle(Z, to * Math.min(0.35, lift * 0.4));
    dynamite.quaternion.copy(yaw).multiply(swing).multiply(tip.setFromAxisAngle(X, LEAN - Math.min(0.55, lift)));
  };
  return { dynamite, hang };
};

/** What they wear, from the film's model sheets. */
export const OUTFITS = {
  // White shirt, sleeves rolled, black tie, brown belt, dark slacks, white-and-red sneakers.
  // His face: dark irises under a heavy lid, bold brows a shade under his
  // blond, a little tired under the eyes. His sneakers: white high-tops with
  // maroon side panels and heel, and the red stripe round the sole.
  denji: {
    skin: "#f2cfb0", top: "#eef0ea", bottom: "#28322f", shoes: "#ecebe6", trim: "#b5332a", panel: "#9a3a2c", sole: "#f4f1ea",
    hair: "#e3a849", sleeves: "rolled", tie: "#15161b", belt: "#6b3f22",
    iris: "#4b2c1c", pupil: "#0f0907", brows: "#8a5a22", tired: true,
  },
  // Her date look, the arc's standard until she turns: a white sleeveless
  // collared blouse with a thin black ribbon, tucked into black high-waisted
  // shorts to mid-thigh, black thigh-highs, brown penny loafers. Navy-purple
  // hair, green eyes.
  reze: {
    skin: "#f3d9cc", top: "#f1efe9", bottom: "#1d1b22", shoes: "#4a2b1a", footwear: "loafers", hair: "#2a2140",
    sleeves: "none", waist: 0.6, skirt: 0.195, stockings: "#17161b", stockingsTop: 0.345, bow: "#121116",
    iris: "#3f9a68", pupil: "#0b1a12", lid: "#1d1626",
  },
  // First Glance: a white raglan tee with black sleeves and the square print,
  // worn out over skinny jeans, black-and-white canvas low-tops, a brown
  // leather school bag on both shoulders.
  rezeCasual: {
    skin: "#f3d9cc", top: "#f1efe9", sleeve: "#1d1b22", bottom: "#5677ab", shoes: "#2b2d33", footwear: "sneakers", sole: "#f1efe9", hair: "#2a2140",
    sleeves: "long", waist: 0.53, neckband: "#1d1b22", print: "#1d1b22", printArt: "#e8b25c", backpack: "#8a4a26",
    iris: "#3f9a68", pupil: "#0b1a12", lid: "#1d1626",
  },
  // The Bomb Devil: the same clothes, sleeveless, shoulders bare, opera gloves
  // from halfway down the upper arm (`sleeves` as a fraction: skin to there); the loafers.
  bomb: { skin: "#f3d9cc", top: "#1d1b22", collar: "#f1efe9", sleeve: "#f3d9cc", arms: "#18181d", bottom: "#1d1b22", shoes: "#4a2b1a", footwear: "loafers", hair: "#2a2140", sleeves: 0.17, skirt: 0.11, stockings: "#17161b", stockingsTop: 0.4 },
  devil: { skin: "#8f8578", top: "#7d7368", bottom: "#4a443e", shoes: "#2a2622", hair: "#2a2622", sleeves: "long" },
};

/**
 * The clothes that need a silhouette, built as geometry on the bones
 * (createModelFigure's `dress`): Denji's collar points, his tie hanging off the
 * knot, the button placket, belt, rolled cuffs, high-tops and spiky hair.
 * Reze's date look: the blouse's collar, ribbon and placket, the hem of the
 * shorts, a low bun and the fringe over her right eye. Her casual look: the
 * tee's print, the school bag, a low ponytail and the fringe.
 */
export const DRESS = {
  denji: { collar: true, tie: true, placket: true, belt: true, cuffs: true, sneakers: true, spikes: true },
  reze: { collar: true, bow: true, placket: true, shorts: true, bun: true, fringe: "right" },
  rezeCasual: { print: true, backpack: true, ponytail: true, fringe: "right" },
};

/**
 * Denji and Reze (plus any `devils`), loaded once and moved between sets.
 * Resolves with the cast; scenes check `cast.ready` before posing anyone.
 * `rezeLook` dresses her: "date" (the default) or "casual" (First Glance).
 */
export const createCast = (w, { devils = 0, chainsaw = true, bomb = false, daisy = false, rezeLook = "date" } = {}) => {
  const cast = { denji: null, reze: null, devils: [], daisy: null, bombHead: null, saw: null };
  const steel = w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 });
  const rail = w.ink({ tint: "#2b2b2b", tone: 1.1, rim: 0.6 });

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
    createModelFigure({ height: 1.72, hair: ["HairSimpleParted", "EyebrowsRegular"], line: w.line, ink: { tone: 0.78, rim: 1.4 }, outfit: OUTFITS.denji, dress: DRESS.denji, fist: 0.35 }),
    createModelFigure({
      body: "SuperheroFemale", height: 1.62, hair: ["HairLong", "EyebrowsFemale"], line: w.line, ink: { tone: 0.8, rim: 1.4 },
      outfit: rezeLook === "casual" ? OUTFITS.rezeCasual : OUTFITS.reze, dress: rezeLook === "casual" ? DRESS.rezeCasual : DRESS.reze, fist: 0.3,
    }),
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
      const wear = dressBombDevil(w, bombFig);
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
        wear.hang();
      };
      cast.untransform = () => {
        reze.root.visible = true;
        bombFig.root.visible = false;
        cast.bombHead.visible = false;
        wear.dynamite.visible = false;
      };
    }

    // Her choker, and the pin hanging from it.
    reze.apply({});
    reze.root.updateMatrixWorld(true);
    const neck = reze.bones.neck;
    const neckAt = neck.getWorldPosition(new THREE.Vector3());
    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0065, 8, 32), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }));
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
      // The hybrid's head (chainsawParts), on a pivot that copies the head
      // bone's turn but not its scale, so his own head can shrink away under it.
      const S = 1.72 / 1.82;
      const hybrid = createHybridHead({ scale: S, bladeLength: 0.62, line: w.line, lineThin: w.line });
      const { head, blade } = hybrid;
      hybrid.setMouth(0.15);
      denji.apply({});
      denji.root.updateMatrixWorld(true);
      const headBone = denji.bones.head;
      const headRest = headBone.scale.clone();
      const pivot = new THREE.Object3D();
      pivot.scale.copy(headRest);
      // It follows the bone on every matrix update, whatever posed it.
      pivot.updateMatrixWorld = function (force) {
        this.position.copy(headBone.position);
        this.quaternion.copy(headBone.quaternion);
        THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
      };
      pivot.position.copy(headBone.position);
      pivot.quaternion.copy(headBone.quaternion);
      headBone.parent.add(pivot);
      head.position.copy(headBone.getWorldPosition(new THREE.Vector3()));
      pivot.attach(head);
      const scale = head.scale.clone();
      // A bar out of the back of each forearm, past the fist, bloodied.
      const m = hybrid.materials;
      const gore = bloodMaterial();
      const arm = { length: 0.6 * S, radius: 0.066 * S, thickness: 0.028 * S };
      const armBlades = [
        ["l", 1],
        ["r", -1],
      ].map(([side, s], i) => {
        const elbow = denji.bones[`${side}Elbow`];
        const e = elbow.getWorldPosition(new THREE.Vector3());
        const h = denji.model.getObjectByName(`hand_${side}`).getWorldPosition(new THREE.Vector3());
        const armBlade = createBlade({ ...arm, steel: m.steel, rail: m.rail, ink: m.chain, line: w.line, teeth: 26 });
        armBlade.group.position.copy(e).lerp(h, 0.3).add(new THREE.Vector3(s * 0.047 * S, 0, 0));
        aim(armBlade.group, h.clone().sub(e).normalize(), new THREE.Vector3(0, 0, 1));
        w.scene.add(armBlade.group);
        elbow.attach(armBlade.group);
        addBladeBlood(armBlade, { ...arm, material: gore, seed: 5 + i * 4 })(0.35);
        w.register(armBlade.group);
        return armBlade;
      });
      addBladeBlood(blade, { length: 0.62, radius: 0.072, thickness: 0.03, material: gore, seed: 3, count: 7 })(0.35);
      w.register(head);
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
          headBone.scale.copy(headRest).multiplyScalar(k > 0.5 ? 0.001 : 1);
          head.visible = k > 0.01;
          head.scale.copy(scale).multiplyScalar(Math.max(0.001, k));
          blade.extend(k);
          blade.run(time * 9);
          hybrid.setVents(k * (0.85 + 0.15 * Math.sin(time * 41)));
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
