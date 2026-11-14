import * as THREE from "three";
import { blendPose } from "../figure";
import { createParticles, easeInOutCubic, easeOutBack, hash, lerp, segment, softDot } from "../kit";
import { outline } from "../ink";
import { createCast, createCuts, createFx, createInkWorld } from "../rezeKit";

/**
 * Blast radius — the backdrop behind "Your agent is holding your keys".
 *
 * Night over a dense city. Reze stands on the edge of a tower roof with her
 * back to us, looking down at it. She pulls the pin at her choker and is the
 * Bomb Devil; the explosion rolls out over the blocks in three shockwaves,
 * each reaching further than the last. Every building a front passes flashes,
 * shakes and loses its lights; past the last ring the city never noticed.
 * Then the fires die down, the city settles dark, and the loop starts again.
 *
 *   0.0   fade in over her shoulder: the city lit, wind, she looks down
 *   2.3   her hand goes to her choker; 3.0 the pin comes out
 *   3.3   BOOM — she turns, the first ring (15 m), a fireball at her feet
 *   3.55  the camera cranes up and back off her shoulder
 *   4.9   second ring (28 m);  6.6  third ring (47 m)
 *         each front: a white-hot ground ring, a glass dome, a dust wall;
 *         it holds a second at its reach, then leaves an ember line
 *   9.4   the wide holds: three ember lines on the ground mark each reach,
 *         lit city outside them, dark and burning inside
 *  13.2   fade to black; 14.0 loop
 *
 * The rings are computed on the GPU: every building and the street grid know
 * the three front radii, so a flash costs nothing per block. The CPU only
 * shakes the instance matrices inside a front and emits dust and debris.
 * Reduced motion holds t = 8: the wide, the third ring halfway out.
 */

const LOOP = 14;
const ROOF = 24;
// Where she stands, and the street below her that the rings centre on.
const HER = new THREE.Vector3(0.6, ROOF, 3.9);
const C = new THREE.Vector2(0.6, 7);
const PULL = 3.0;
const HOLD = 1.0;
const BOOM = 3.3;

const RINGS = [
  { t: BOOM, dur: 1.8, R: 15, fire: [0.6, ROOF - 6, 14], fireR: 2.6, kick: 1 },
  { t: 4.9, dur: 2.2, R: 28, fire: [0.6, ROOF - 7, 10], fireR: 5, kick: 0.55 },
  { t: 6.6, dur: 2.8, R: 47, fire: [0.6, ROOF - 9, 10], fireR: 6.5, kick: 0.45 },
];

// The city at night: cold, low light; a blast drags it to fire.
const NIGHT = { ground: "#06070d", lines: "#6b7ba3", accent: "#ff4b2b", rim: "#8fa2d8", shade: "#4a5478" };
// Only the rim and accent turn to fire: the key, fill and sky stay night.
const BLAST = { ...NIGHT, accent: "#ff4b2b", rim: "#ff6a2a" };

/* ---------- poses ---------- */
const EDGE = (t) => ({ spine: [0.05 + Math.sin(t * 0.9) * 0.01, 0, 0], head: [0.32, 0.05, 0], lShoulder: [0.02, 0, 0.12], rShoulder: [0.02, 0, -0.12], lElbow: [-0.18, 0, 0], rElbow: [-0.18, 0, 0], lHip: [0, 0, 0.06], rHip: [0, 0, -0.06] });
const PIN = { spine: [-0.05, 0, 0], head: [-0.05, 0, 0], lShoulder: [0.1, 0, 0.3], lElbow: [-0.3, 0, 0], rShoulder: [-1.05, 0, -0.45], rElbow: [-2.35, 0.3, 0] };
const YANKED = { ...PIN, head: [-0.1, 0, 0], rShoulder: [-2.2, 0, -0.9], rElbow: [-0.2, 0, 0] };
const DEVIL = (t) => ({ spine: [-0.08, 0, 0], head: [0.08 + Math.sin(t * 2) * 0.03, 0, 0], lShoulder: [-0.2, 0, 0.8], lElbow: [-0.5, 0, 0], rShoulder: [-0.2, 0, -0.8], rElbow: [-0.5, 0, 0], lHip: [0, 0, 0.12], rHip: [0, 0, -0.12] });

/* ---------- the ring field, shared by every city shader ---------- */
const FIELD = /* glsl */ `
  uniform vec2 uC;
  uniform vec3 uR, uS, uW, uA;
  uniform float uTime, uHeat, uOut, uBlastY;
  uniform vec3 uAir, uKey, uShade, uMoon;
  uniform vec2 uFogRange;
  // A front: a hard leading edge and a long glowing tail behind it.
  float front(float d, float R, float W, float S) {
    if (S <= 0.0) return 0.0;
    float x = (d - R) / W;
    return S * exp(-x * x * (x > 0.0 ? 7.0 : 2.5));
  }
  float hot(float d) { return front(d, uR.x, uW.x, uS.x) + front(d, uR.y, uW.y, uS.y) + front(d, uR.z, uW.z, uS.z); }
  float inside(float d, float R) { return R > 0.5 ? smoothstep(R + 1.5, R - 2.5, d) : 0.0; }
  float passed(float d) { return max(inside(d, uR.x), max(inside(d, uR.y), inside(d, uR.z))); }
  float burn(float d) { return inside(d, uR.x) * uA.x + inside(d, uR.y) * uA.y + inside(d, uR.z) * uA.z; }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
  vec3 fogged(vec3 col, float depth) { return mix(col, uAir, smoothstep(uFogRange.x, uFogRange.y, depth) * 0.9); }
`;

const fieldUniforms = () => ({
  uC: { value: C.clone() },
  uR: { value: new THREE.Vector3() },
  uS: { value: new THREE.Vector3() },
  uW: { value: new THREE.Vector3(3, 3, 3) },
  uA: { value: new THREE.Vector3() },
  uTime: { value: 0 },
  uHeat: { value: 0 },
  uOut: { value: 0 },
  uBlastY: { value: ROOF * 0.6 },
  uAir: { value: new THREE.Color(NIGHT.ground) },
  uKey: { value: new THREE.Color("#b8c2dc") },
  uShade: { value: new THREE.Color(NIGHT.shade) },
  uMoon: { value: new THREE.Vector3(-0.35, 0.6, 0.7).normalize() },
  uFogRange: { value: new THREE.Vector2(70, 270) },
});

/** Towers: concrete in moonlight, a grid of windows, the blast written on them. */
const buildingMaterial = (uniforms) =>
  new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec4 aInst;
      varying vec3 vW;
      varying vec3 vN;
      varying vec4 vI;
      varying float vDepth;
      void main() {
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vI = aInst;
        vec4 mv = viewMatrix * w;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${FIELD}
      varying vec3 vW;
      varying vec3 vN;
      varying vec4 vI;
      varying float vDepth;
      float box(vec2 f, vec2 aa, vec2 lo, vec2 hi) {
        vec2 a = smoothstep(lo - aa, lo + aa, f) * (1.0 - smoothstep(hi - aa, hi + aa, f));
        return a.x * a.y;
      }
      void main() {
        vec3 N = normalize(vN);
        float seed = vI.z;
        float d = length(vI.xy - uC);
        vec3 alb = mix(vec3(0.055, 0.058, 0.075), vec3(0.12, 0.115, 0.13), seed);
        float diff = clamp((dot(N, uMoon) + 0.35) / 1.35, 0.0, 1.0);
        float sky = N.y * 0.5 + 0.5;
        vec3 col = alb * (mix(uShade * 0.18, uShade * 0.5, sky) + uKey * diff * 0.55);
        if (N.y > 0.5) col *= 1.3;

        // Windows: 1.9 m bays, 3.1 m floors, none on the ground floor.
        float side = 1.0 - step(0.5, abs(N.y));
        vec2 fc = abs(N.x) > 0.5 ? vec2(vW.z, vW.y - 1.0) : vec2(vW.x, vW.y - 1.0);
        vec2 cell = fc / vec2(1.9, 3.1);
        vec2 id = floor(cell);
        float win = box(fract(cell), fwidth(cell) * 0.75 + 1e-4, vec2(0.22, 0.3), vec2(0.78, 0.78)) * side * step(1.0, id.y) * step(vW.y, vI.w - 0.9);
        float r = h21(id + seed * 91.7 + N.xz * 13.0);
        float r2 = h21(id * 1.7 + seed * 33.1);
        float gone = passed(d) * uOut;
        float lit = step(r, 0.26) * (1.0 - gone);
        vec3 lamp = mix(vec3(1.25, 0.82, 0.45), vec3(0.75, 0.85, 1.1), step(0.8, r2));
        col = mix(col, vec3(0.012, 0.014, 0.02), win * 0.7);
        col += win * lit * lamp * (0.55 + 0.45 * r2);

        // The fronts: faces turned to the blast go white-hot, glass blows out.
        vec3 toBlast = normalize(vec3(uC.x, uBlastY, uC.y) - vW);
        float facing = clamp(dot(N, toBlast), 0.0, 1.0);
        float h = hot(d);
        col += h * vec3(3.2, 1.05, 0.28) * (0.1 + 0.9 * facing);
        col += h * win * vec3(3.6, 1.5, 0.45);

        // Behind the fronts: windows on fire, the street's glow on the walls.
        float fire = step(r2, 0.32) * burn(d) * (0.75 + 0.25 * sin(uTime * 13.0 + seed * 40.0 + id.x));
        col += win * fire * vec3(2.2, 0.7, 0.18);
        col += alb * uHeat * vec3(3.0, 0.9, 0.25) * facing * exp(-d / 20.0);
        gl_FragColor = vec4(fogged(col, vDepth), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

/** Asphalt and the street grid; the rings ride along it. */
const groundMaterial = (uniforms) =>
  new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vW;
      varying float vDepth;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${FIELD}
      varying vec3 vW;
      varying float vDepth;
      void main() {
        vec2 p = vW.xz;
        float d = length(p - uC);
        // Blocks every 14 m; the streets run on the odd sevens.
        vec2 m = mod(p + 7.0, 14.0);
        vec2 e = min(m, 14.0 - m);
        float aa = fwidth(p.x) + 1e-3;
        float street = 1.0 - smoothstep(1.7 - aa, 1.7 + aa, min(e.x, e.y));
        vec3 col = mix(vec3(0.03, 0.032, 0.042), vec3(0.055, 0.056, 0.066), street);
        col *= uShade * 0.35 + uKey * 0.3;
        // Street lamps: a pool at each crossing, a dot halfway down each block.
        float cross_ = exp(-dot(e, e) / 4.5);
        float lamps = cross_ * 0.55 + (exp(-dot(vec2(e.x, abs(m.y - 7.0)), vec2(e.x, abs(m.y - 7.0))) / 0.8) + exp(-dot(vec2(e.y, abs(m.x - 7.0)), vec2(e.y, abs(m.x - 7.0))) / 0.8)) * 0.4;
        lamps *= 1.0 - passed(d) * uOut;
        col += vec3(1.0, 0.62, 0.3) * lamps * 0.9 * (0.6 + 0.4 * street);
        // The rings: the front, the scorch inside it, an ember line at each reach.
        col += hot(d) * vec3(3.2, 1.0, 0.25) * (0.4 + 0.6 * street);
        col += burn(d) * vec3(0.32, 0.06, 0.02);
        float lines = 0.0;
        vec3 off = (vec3(d) - uR) / vec3(0.9, 1.1, 1.3);
        lines = dot(exp(-off * off), uA);
        col += lines * vec3(2.6, 0.65, 0.18);
        col += uHeat * vec3(0.35, 0.08, 0.02) * exp(-d / 18.0);
        gl_FragColor = vec4(fogged(col, vDepth), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

/** A shock wall: an open cylinder of light, brightest at the ground. */
const wallMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uS: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uS, uTime;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float y = vUv.y;
        float streak = 0.7 + 0.3 * sin(vUv.x * 160.0 + uTime * 2.0) * sin(vUv.x * 37.0 - uTime);
        float a = uS * (pow(1.0 - y, 3.0) * 0.9 + exp(-y * 40.0) * 0.8) * streak;
        float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        a *= 0.3 + edge * 1.4;
        // Dust thrown up by the front, lit from inside by the fire behind it.
        vec3 col = mix(vec3(0.42, 0.2, 0.09), vec3(0.9, 0.45, 0.18), exp(-y * 6.0));
        gl_FragColor = vec4(col * 1.2, clamp(a, 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

/** The front on the ground: a hot band with a white leading edge, emissive for the bloom. */
const annulusMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uC: { value: C.clone() }, uR: { value: 0 }, uW: { value: 3 }, uS: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vP = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uC;
      uniform float uR, uW, uS;
      varying vec2 vP;
      void main() {
        float d = length(vP - uC);
        float x = (d - uR) / uW;
        float body = exp(-x * x * (x > 0.0 ? 12.0 : 1.4));
        float e = (d - uR) / 0.45;
        float lead = exp(-e * e);
        // Orange body, a thin hot core at the very front.
        vec3 col = vec3(1.0, 0.32, 0.06) * body * 1.8 + vec3(1.0, 0.72, 0.4) * lead * 3.0;
        gl_FragColor = vec4(col * uS, 1.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** The shock dome: nearly clear glass, its rim bright where it bends the light. */
const domeMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uS: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying float vY;
      void main() {
        vY = position.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uS, uTime;
      varying vec3 vN;
      varying vec3 vV;
      varying float vY;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float shimmer = 0.85 + 0.15 * sin(vY * 40.0 - uTime * 9.0);
        float a = uS * (0.012 + pow(f, 6.0) * 0.6 + exp(-vY * 18.0) * 0.15) * shimmer;
        vec3 col = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.75, 0.5), f * f);
        gl_FragColor = vec4(col * 1.4, clamp(a, 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** The fireball: a billowing hot shell, white at the core. */
const fireMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec3 p = position;
        float n = sin(p.x * 7.0 + uTime * 3.0) * sin(p.y * 6.0 - uTime * 2.0) * sin(p.z * 8.0 + uTime * 2.5);
        p += normal * n * 0.09;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uI;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float c = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        vec3 col = mix(vec3(0.9, 0.16, 0.03), vec3(1.0, 0.55, 0.18), c * c) * (0.8 + 1.6 * c * c * c);
        gl_FragColor = vec4(col, clamp(uI * (0.1 + 0.6 * c), 0.0, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

/** One block's lots: [x, z, width, depth, height]. Taller downtown, low outskirts. */
const layoutCity = () => {
  const lots = [[0, 0, 9, 9, ROOF]];
  let n = 0;
  for (let i = -14; i <= 14; i++) {
    for (let j = -14; j <= 14; j++) {
      if (i === 0 && j === 0) continue;
      const bx = i * 14;
      const bz = j * 14;
      const dist = Math.hypot(bx - C.x, bz - C.y);
      if (dist > 200) continue;
      n += 1;
      const r = hash(n * 1.37);
      const split = r < 0.35 ? [[0, 0, 10.4, 10.4]] : r < 0.6 ? [[-2.65, 0, 5.0, 10.4], [2.65, 0, 5.0, 10.4]] : [[-2.65, -2.65, 5.0, 5.0], [2.65, -2.65, 5.0, 5.0], [-2.65, 2.65, 5.0, 5.0], [2.65, 2.65, 5.0, 5.0]];
      split.forEach(([dx, dz, w, d], k) => {
        const s = hash(n * 7.1 + k * 3.3);
        const fall = 1 - THREE.MathUtils.smoothstep(dist, 14, 120);
        let h = lerp(5, 25, fall) * (0.5 + 0.9 * s);
        // A few towers out in the middle distance: the rings light them up.
        const behind = bz + dz < C.y - 8;
        if (hash(n * 3.9 + k) > 0.94 && dist > 26 && dist < 80 && !behind) h = 32 + s * 14;
        // The wide looks in from this side: keep it low so the ground reads.
        if (behind) h *= 0.6;
        // Nothing near her stands higher than her roof.
        if (dist < 26) h = Math.min(h, ROOF - 3);
        const inset = 0.4 + hash(n + k * 9.7) * 0.5;
        lots.push([bx + dx, bz + dz, w - inset, d - inset, Math.max(3.5, h)]);
      });
    }
  }
  return lots;
};

export const createBombBlastScene = (stage, { overlay } = {}) => {
  const { camera, renderer, pointer, staticMode } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const cast = createCast(w, { chainsaw: false, bomb: true });
  const fx = createFx(w);
  const cuts = createCuts(overlay);
  let disposed = false;
  // The wide looks across two hundred metres of city; the harness stops at 200.
  camera.far = 700;
  camera.updateProjectionMatrix();

  /* ---------- the city ---------- */
  const uniforms = fieldUniforms();
  const lots = layoutCity();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const inst = new Float32Array(lots.length * 4);
  lots.forEach(([x, z, , , h], i) => inst.set([x, z, hash(i * 2.31 + 0.5), h], i * 4));
  boxGeo.setAttribute("aInst", new THREE.InstancedBufferAttribute(inst, 4));
  const city = new THREE.InstancedMesh(boxGeo, buildingMaterial(uniforms), lots.length);
  city.frustumCulled = false;
  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const e4 = new THREE.Euler();
  const v4 = new THREE.Vector3();
  const s4 = new THREE.Vector3();
  const place = (i, ox = 0, oz = 0, tx = 0, tz = 0) => {
    const [x, z, bw, bd, h] = lots[i];
    q4.setFromEuler(e4.set(tx, 0, tz));
    m4.compose(v4.set(x + ox, 0, z + oz), q4, s4.set(bw, h, bd));
    city.setMatrixAt(i, m4);
  };
  lots.forEach((_, i) => place(i));
  city.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  outline(city, w.line);
  scene.add(city);
  const shaken = new Uint8Array(lots.length);
  const lotDist = lots.map(([x, z]) => Math.hypot(x - C.x, z - C.y));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(640, 640), groundMaterial(uniforms));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  /* ---------- her roof ---------- */
  const roof = new THREE.Group();
  roof.position.y = ROOF;
  scene.add(roof);
  const concrete = w.ink({ tint: "#6a6670", tone: 0.42, rim: 0.7 });
  const metal = w.ink({ tint: "#5c6270", tone: 0.55, rim: 1.1 });
  const prop = (geo, mat, x, y, z, line = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (line) outline(m, w.line);
    roof.add(m);
    return m;
  };
  for (const [x, z, bw, bd] of [[0, 4.35, 9, 0.3], [0, -4.35, 9, 0.3], [4.35, 0, 0.3, 9], [-4.35, 0, 0.3, 9]]) prop(new THREE.BoxGeometry(bw, 0.55, bd), concrete, x, 0.27, z);
  prop(new THREE.BoxGeometry(2.2, 2.3, 2.0), concrete, -2.4, 1.15, -2.2);
  prop(new THREE.BoxGeometry(1.2, 0.8, 0.9), metal, 2.4, 0.4, 0.2);
  prop(new THREE.BoxGeometry(1.2, 0.8, 0.9), metal, 2.4, 0.4, -1.1);
  const tank = prop(new THREE.CylinderGeometry(0.9, 0.9, 1.5, 18), metal, 2.2, 2.4, -3.0);
  tank.rotation.y = 0.3;
  for (const [x, z] of [[1.6, -3.5], [2.8, -3.5], [1.6, -2.5], [2.8, -2.5]]) prop(new THREE.BoxGeometry(0.1, 1.65, 0.1), metal, x, 0.82, z, false);
  prop(new THREE.CylinderGeometry(0.04, 0.06, 6, 6), metal, -3.6, 3, -3.6, false);
  // The aircraft light on the mast: the only red in the dark before.
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff2a2a").multiplyScalar(3) }));
  beacon.position.set(-3.6, 6.05, -3.6);
  roof.add(beacon);

  /* ---------- the blast ---------- */
  const walls = RINGS.map(() => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 128, 1, true);
    geo.translate(0, 0.5, 0);
    const m = new THREE.Mesh(geo, wallMaterial());
    m.position.set(C.x, 0, C.y);
    m.frustumCulled = false;
    m.renderOrder = 10;
    m.visible = false;
    scene.add(m);
    return m;
  });
  const annuli = RINGS.map(() => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 160), annulusMaterial());
    m.rotation.x = -Math.PI / 2;
    m.position.set(C.x, 0.35, C.y);
    m.frustumCulled = false;
    m.renderOrder = 13;
    m.visible = false;
    scene.add(m);
    return m;
  });
  const domeGeo = new THREE.SphereGeometry(1, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const domes = RINGS.map(() => {
    const m = new THREE.Mesh(domeGeo, domeMaterial());
    m.position.set(C.x, 0, C.y);
    m.frustumCulled = false;
    m.renderOrder = 9;
    m.visible = false;
    scene.add(m);
    return m;
  });
  const fireGeo = new THREE.SphereGeometry(1, 40, 28);
  const fires = RINGS.map((ring) => {
    const m = new THREE.Mesh(fireGeo, fireMaterial());
    m.position.set(...ring.fire);
    m.renderOrder = 11;
    m.visible = false;
    scene.add(m);
    return m;
  });
  // The pin in her hand once it is out, and the fuse spark at her choker.
  const pin = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 6, 18), w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 }));
  pin.visible = false;
  scene.add(pin);
  const fuseTip = new THREE.Object3D();
  const sparkMap = softDot();
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkMap, color: new THREE.Color("#ffb36b").multiplyScalar(4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  spark.visible = false;
  spark.renderOrder = 12;
  scene.add(spark);

  const dust = createParticles({ count: 1400, blending: "normal" });
  const debris = createParticles({ count: 900, blending: "add" });
  const smoke = createParticles({ count: 700, blending: "normal" });
  scene.add(dust.points, debris.points, smoke.points);
  const pools = [dust, debris, smoke];

  const unsubscribeResize = stage.onResize(({ aspect, height }) => {
    w.bu.uAspect.value = aspect;
    const pr = renderer.getPixelRatio();
    pools.forEach((p) => p.resize(height, camera.fov, pr));
    fx.resize(height, camera.fov, pr);
    w.sync();
  });

  /* ---------- timing ---------- */
  const ringState = (ring, t) => {
    const end = ring.t + ring.dur;
    const u = segment(t, ring.t, end);
    const R = t < ring.t ? 0 : ring.R * (1 - (1 - u) ** 2);
    // Out at full strength, then it holds at its reach for a second.
    const S = t < ring.t ? 0 : t < end ? lerp(1.2, 0.8, u) : 0.8 * (1 - segment(t, end + HOLD * 0.45, end + HOLD));
    // The ember line where it stopped, dying out by the end of the loop.
    const A = t < ring.t ? 0 : segment(t, end + HOLD * 0.4, end + HOLD + 0.3) * (1 - segment(t, 11.2, 13.4)) * 0.9;
    return { u, R, S, A, W: 1.4 + R * 0.04, age: t - ring.t, moving: t >= ring.t && t < end };
  };
  const heatAt = (t) => RINGS.reduce((h, r) => (t >= r.t ? h + Math.exp(-(t - r.t) * 1.4) * r.kick : h), 0) + (t > BOOM ? 0.25 * (1 - segment(t, 9, 13)) : 0);
  const shakeAt = (t) => RINGS.reduce((h, r) => (t >= r.t ? h + Math.exp(-(t - r.t) * 4) * r.kick : h), 0);

  /* ---------- particles: emitted per window of time, so a held frame can pre-roll ---------- */
  const rand = Math.random;
  const emitWindow = (t0, t1) => {
    const dt = t1 - t0;
    RINGS.forEach((ring, i) => {
      if (i > 0 && t0 < ring.t && t1 >= ring.t) fx.blast(new THREE.Vector3(...ring.fire));
      const st = ringState(ring, t1);
      if (!st.moving) return;
      const nDust = Math.floor(dt * 260 * st.S + rand());
      for (let k = 0; k < nDust; k++) {
        const a = rand() * Math.PI * 2;
        const r = st.R - rand() * 2;
        dust.emit({
          position: [C.x + Math.cos(a) * r, rand() * 3, C.y + Math.sin(a) * r],
          velocity: [Math.cos(a) * (5 + rand() * 4), 3 + rand() * 5, Math.sin(a) * (5 + rand() * 4)],
          life: 1.6 + rand() * 1.2,
          size: 2.6 + rand() * 2.4 + i,
          grow: 2.4,
          drag: 1.2,
          color: rand() < 0.6 ? "#4a3e3a" : "#2c2629",
          alpha: 0.42,
        });
      }
      const nDebris = Math.floor(dt * 300 * st.S + rand());
      for (let k = 0; k < nDebris; k++) {
        const a = rand() * Math.PI * 2;
        const v = 6 + rand() * 9;
        debris.emit({
          position: [C.x + Math.cos(a) * st.R, 1 + rand() * 16, C.y + Math.sin(a) * st.R],
          velocity: [Math.cos(a) * v, 4 + rand() * 8, Math.sin(a) * v],
          life: 0.9 + rand() * 0.9,
          size: 0.35 + rand() * 0.4,
          gravity: 14,
          drag: 0.6,
          color: rand() < 0.4 ? "#fff1c9" : rand() < 0.7 ? "#ffb36b" : "#ff4b2b",
          intensity: 2.6,
        });
      }
    });
    // Three tall columns over the worst of it: they rise into the sky in the wide.
    if (t1 > BOOM + 0.4 && t1 < 12.6) {
      for (const [cx, cz, rate] of [[C.x, C.y + 2, 9], [C.x - 16, C.y + 14, 5], [C.x + 13, C.y - 6, 5]]) {
        const nCol = Math.floor(dt * rate + rand());
        for (let k = 0; k < nCol; k++) {
          smoke.emit({
            position: [cx + (rand() - 0.5) * 4, 6 + rand() * 6, cz + (rand() - 0.5) * 4],
            velocity: [1.2 + rand(), 7 + rand() * 4, 0.6],
            life: 7 + rand() * 2,
            size: 7 + rand() * 4,
            grow: 2.6,
            drag: 0.08,
            color: rand() < 0.5 ? "#1c1b20" : "#2a282d",
            alpha: 0.5,
          });
        }
      }
    }
    // Smoke from the burning blocks inside the radius.
    if (t1 > BOOM + 0.6 && t1 < 12.2) {
      const reach = Math.max(4, ringState(RINGS[2], t1).R, ringState(RINGS[1], t1).R);
      const nSmoke = Math.floor(dt * 34 + rand());
      for (let k = 0; k < nSmoke; k++) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * reach * 0.8;
        smoke.emit({
          position: [C.x + Math.cos(a) * r, 4 + rand() * 10, C.y + Math.sin(a) * r],
          velocity: [0.8, 2.2 + rand() * 2, 0.3],
          life: 4 + rand() * 2,
          size: 6 + rand() * 5,
          grow: 1.8,
          color: rand() < 0.5 ? "#1e1d22" : "#2b2a2e",
          alpha: 0.42,
        });
      }
    }
  };
  const stepPools = (dt) => {
    pools.forEach((p) => p.step(dt));
    fx.step(dt);
  };
  const clearPools = () => {
    pools.forEach((p) => p.step(100));
    fx.clear();
  };

  /* ---------- camera ---------- */
  const A0 = { p: new THREE.Vector3(1.15, ROOF + 1.8, 1.0), l: new THREE.Vector3(-1.5, ROOF - 6, 40) };
  const A1 = { p: new THREE.Vector3(1.0, ROOF + 3.2, 1.2), l: new THREE.Vector3(-0.4, 2, 30) };
  const T = new THREE.Vector3(0.6, 0, 10);
  const L = new THREE.Vector3(0.6, 6, 10);
  const wideAt = (t, out) => {
    const drift = Math.max(0, t - 8.9);
    const dist = 120 + drift * 1.4;
    const el = 0.42;
    const az = -0.32 + drift * 0.018;
    return out.set(T.x + Math.cos(el) * Math.sin(az) * dist, Math.sin(el) * dist, T.z - Math.cos(el) * Math.cos(az) * dist);
  };
  let wideK = 0;
  const camP = new THREE.Vector3();
  const camL = new THREE.Vector3();
  const wideP = new THREE.Vector3();
  const pushP = new THREE.Vector3();
  const pushL = new THREE.Vector3();
  const placeCamera = (t, time) => {
    const push = easeInOutCubic(segment(t, 0, BOOM));
    pushP.lerpVectors(A0.p, A1.p, push);
    pushL.lerpVectors(A0.l, A1.l, push);
    const k = staticMode ? 1 : easeInOutCubic(segment(t, 3.55, 8.9));
    wideAt(t, wideP);
    camP.lerpVectors(pushP, wideP, k);
    camL.lerpVectors(pushL, L, k);
    wideK = k;
    const shake = shakeAt(t) * lerp(0.12, 0.9, k);
    camP.x += Math.sin(time * 47) * shake + pointer.x * lerp(0.15, 2.5, k);
    camP.y += Math.sin(time * 53 + 1) * shake * 0.7 + pointer.y * lerp(0.08, 1.5, k);
    camP.z += Math.sin(time * 41 + 2) * shake * 0.5;
    camera.position.copy(camP);
    camera.lookAt(camL);
    camera.updateMatrixWorld();
  };

  /* ---------- light ---------- */
  const pal = { ground: new THREE.Color(), lines: new THREE.Color(), accent: new THREE.Color(), rim: new THREE.Color(), shade: new THREE.Color() };
  const night = Object.fromEntries(Object.entries(NIGHT).map(([k, v]) => [k, new THREE.Color(v)]));
  const blast = Object.fromEntries(Object.entries(BLAST).map(([k, v]) => [k, new THREE.Color(v)]));
  const white = new THREE.Color("#ffffff");
  const lightDir = new THREE.Vector3();
  let shownHeat = -1;
  const setLight = (heat) => {
    const q = Math.round(Math.min(1, heat) * 24) / 24;
    if (q === shownHeat) return;
    shownHeat = q;
    for (const k of Object.keys(pal)) pal[k].copy(night[k]).lerp(blast[k], q);
    w.palette(pal);
    // Moonlight from over the city, all loop long: the blast lights only what it hits.
    lightDir.set(-0.35, 0.6, 0.7).normalize();
    w.light(lightDir.x, lightDir.y, lightDir.z);
    uniforms.uMoon.value.copy(lightDir);
    uniforms.uAir.value.copy(pal.ground).lerp(pal.lines, 0.12);
    uniforms.uKey.value.copy(white).lerp(pal.lines, 0.45).multiplyScalar(1.08);
    uniforms.uShade.value.copy(pal.shade);
  };
  w.page({ mode: "still" });
  setLight(0);

  const ready = cast.ready.then(() => {
    if (disposed) return;
    cast.denji.root.visible = false;
    // Her clothes stay black: the film rim is a broad fresnel, and at full
    // strength it washed her dress, gloves and stockings into a skin tone.
    // Turned down, only the silhouette edge catches the fire. Her cord and
    // dynamite too.
    scene.traverse((o) => {
      if (!o.isSkinnedMesh && !o.userData.devilWear) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m?.uniforms?.uRim) m.uniforms.uRim.value = 0.28;
        if (m?.uniforms?.uSpec) m.uniforms.uSpec.value = 0;
      }
    });
    // Her choker and the pin on it, on the devil's neck too, with the fuse lit.
    const head = cast.bombHead;
    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.009, 8, 28), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }));
    choker.rotation.x = Math.PI / 2;
    choker.position.y = -0.005;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24), w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.6 }));
    ring.position.set(0.05, -0.04, 0.04);
    ring.rotation.y = 0.9;
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6), w.ink({ tint: "#3a3430", tone: 0.8, rim: 0.4 }));
    fuse.position.set(0.06, -0.09, 0.05);
    fuse.rotation.z = 0.3;
    head.add(choker, ring, fuse);
    outline(choker, w.line);
    outline(ring, w.line);
    fuseTip.position.set(0.07, -0.125, 0.05);
    head.add(fuseTip);
    w.inks.forEach((m) => m.uniforms.uFogRange.value.set(60, 300));
    shownHeat = -1;
    if (staticMode) stage.invalidate();
  });

  const hand = new THREE.Vector3();
  const crown = new THREE.Vector3();
  const focus = new THREE.Vector3();
  let handBone = null;
  let prevT = -1;

  const update = (time, dt) => {
    const t = ((time % LOOP) + LOOP) % LOOP;
    const held = staticMode || dt === 0;

    // The rings, for every shader at once.
    const states = RINGS.map((r) => ringState(r, t));
    uniforms.uR.value.set(states[0].R, states[1].R, states[2].R);
    uniforms.uS.value.set(states[0].S, states[1].S, states[2].S);
    uniforms.uW.value.set(states[0].W, states[1].W, states[2].W);
    uniforms.uA.value.set(states[0].A, states[1].A, states[2].A);
    const heat = heatAt(t);
    uniforms.uHeat.value = Math.min(1.2, heat);
    uniforms.uOut.value = t > BOOM ? 1 : 0;
    uniforms.uTime.value = time;
    setLight(heat * 0.85);

    walls.forEach((m, i) => {
      const st = states[i];
      m.visible = st.S > 0.01;
      if (!m.visible) return;
      m.scale.set(st.R, 5 + st.R * 0.22, st.R);
      m.material.uniforms.uS.value = st.S * 0.35;
      m.material.uniforms.uTime.value = time;
    });
    states.forEach((st, i) => {
      const ann = annuli[i];
      const dome = domes[i];
      ann.visible = dome.visible = st.S > 0.01 && st.R > 0.5;
      if (!ann.visible) return;
      ann.scale.setScalar(st.R + st.W * 2.5 + 2);
      const au = ann.material.uniforms;
      au.uR.value = st.R;
      au.uW.value = st.W;
      au.uS.value = st.S;
      dome.scale.set(st.R, st.R * 0.5, st.R);
      dome.material.uniforms.uS.value = st.S * 0.8;
      dome.material.uniforms.uTime.value = time;
    });
    fires.forEach((m, i) => {
      const age = states[i].age;
      const life = 0.9;
      m.visible = age >= 0 && age < life;
      if (!m.visible) return;
      m.scale.setScalar(RINGS[i].fireR * (0.25 + 0.75 * (1 - (1 - segment(age, 0, 0.7)) ** 3)));
      m.material.uniforms.uI.value = (1 - segment(age, 0.15, life)) ** 1.5 * 1.1;
      m.material.uniforms.uTime.value = time;
    });

    // Shake what the fronts are passing; settle what they have left.
    let moved = false;
    for (let i = 0; i < lots.length; i++) {
      const d = lotDist[i];
      let amp = 0;
      for (let r = 0; r < 3; r++) {
        const st = states[r];
        if (!st.moving) continue;
        const x = (d - st.R) / st.W;
        amp += st.S * Math.exp(-x * x * (x > 0 ? 7 : 1));
      }
      if (amp > 0.02) {
        const j = Math.sin(time * 60 + i * 1.7) * amp;
        const ax = (lots[i][0] - C.x) / Math.max(1, d);
        const az = (lots[i][1] - C.y) / Math.max(1, d);
        place(i, j * 0.35 * ax, j * 0.35 * az, az * amp * 0.035, -ax * amp * 0.035);
        shaken[i] = 1;
        moved = true;
      } else if (shaken[i]) {
        place(i);
        shaken[i] = 0;
        moved = true;
      }
    }
    if (moved) city.instanceMatrix.needsUpdate = true;
    beacon.visible = Math.sin(time * 3.4) > 0.35 && t < BOOM;

    // Her: the edge, the pin, the turn.
    if (cast.reze) {
      const { reze } = cast;
      reze.root.position.copy(HER);
      reze.root.rotation.set(0, 0, 0);
      let pose;
      if (t < 2.3) pose = EDGE(time);
      else if (t < PULL) pose = blendPose(EDGE(time), PIN, easeInOutCubic(segment(t, 2.3, 2.9)));
      else if (t < BOOM + 0.3) pose = blendPose(PIN, YANKED, easeOutBack(segment(t, PULL, PULL + 0.22)));
      else pose = blendPose(YANKED, DEVIL(time), easeInOutCubic(segment(t, BOOM + 0.3, BOOM + 1.3)));
      reze.apply(pose);
      reze.root.updateMatrixWorld(true);
      handBone ??= reze.model.getObjectByName("hand_r") ?? reze.bones.rElbow;
      const devil = t >= BOOM;
      if (devil) cast.transform(lerp(0.2, 1, easeOutBack(segment(t, BOOM, BOOM + 0.45))));
      else cast.untransform();
      cast.pin.visible = t < PULL + 0.05;
      pin.visible = t >= PULL + 0.05 && t < BOOM + 1.2;
      if (pin.visible) {
        handBone.getWorldPosition(hand);
        pin.position.copy(hand);
        pin.rotation.set(time * 2, time * 3, 0);
      }
      spark.visible = devil && !!cast.bombHead;
      if (spark.visible) {
        cast.bombHead.updateMatrixWorld(true);
        fuseTip.getWorldPosition(crown);
        spark.position.copy(crown);
        const far = camera.position.distanceTo(crown);
        spark.scale.setScalar(Math.max(0.25, far * 0.014) * (0.8 + Math.sin(time * 31) * 0.2));
      }
    }

    placeCamera(t, time);
    // From up high the ground ring draws over the blocks, so the radius always
    // reads; over her shoulder it stays behind her.
    annuli.forEach((m) => (m.material.depthTest = wideK < 0.35));

    // The sky glows over the blast.
    focus.set(C.x, ROOF * 0.5, C.y + 4).project(camera);
    w.bu.uFocus.value.set(THREE.MathUtils.clamp(focus.x * 0.5 + 0.5, -0.5, 1.5), THREE.MathUtils.clamp(focus.y * 0.5 + 0.5, -0.5, 1.5));
    w.bu.uSplash.value = Math.min(0.7, heat * 0.5);

    // Particles: a held frame pre-rolls the last couple of seconds; a loop wraps clean.
    if (held) {
      clearPools();
      const from = Math.max(0, t - 4.5);
      for (let s = from; s < t; s += 1 / 30) {
        emitWindow(s, Math.min(t, s + 1 / 30));
        stepPools(1 / 30);
      }
    } else {
      if (t < prevT) clearPools();
      emitWindow(prevT < 0 || t < prevT ? t : prevT, t);
      stepPools(dt);
    }
    prevT = t;

    // The cut: in from black, the flash on each blast, out to black.
    // A blink, not a whiteout: a quarter second of dark orange.
    const flash = RINGS.reduce((f, r, i) => (t >= r.t && t < r.t + 0.25 ? f + Math.exp(-(t - r.t) * 16) * (i ? 0.1 : 0.32) : f), 0);
    cuts.update({ flash: held ? 0 : Math.min(0.35, flash), flashColor: "#c2410c", black: held ? 0 : Math.max(1 - segment(t, 0, 0.6), segment(t, 13.2, 14)) });
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      cuts.dispose();
      sparkMap.dispose();
      // The pools' sprite textures live in uniforms, out of the graph walk's reach.
      pools.forEach((p) => p.points.material.uniforms.uMap.value.dispose());
    },
  };
};
