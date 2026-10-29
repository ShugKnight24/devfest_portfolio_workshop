import * as THREE from "three";

/**
 * Ink — a manga-page renderer for real 3D.
 *
 * Fujimoto's pages are paper, black ink and screentone, so that is all the
 * shading model knows: lit surfaces stay paper, the turn into shadow is a
 * screen-space halftone (dots stay the same size on screen, like printed tone),
 * and the core shadow is solid ink. Red is the only colour, reserved for rim
 * light, blood and the background splash.
 *
 * Pair with `toneMapping: THREE.NoToneMapping` and `bloom: false` on the stage
 * so paper stays paper. Colours here are authored in sRGB and converted.
 */

export const PAPER = "#f1ece2";
export const INK = "#0d0c0c";
export const RED = "#c8102e";

// Object-space position and normal for plain, instanced and skinned meshes
// alike, so loaded rigged characters take the ink style unchanged.
const VERTEX_PARS = /* glsl */ `
  #include <common>
  #include <skinning_pars_vertex>
`;
const INSTANCED_POSITION = /* glsl */ `
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 local = vec4(transformed, 1.0);
  vec3 objNormal = objectNormal;
  #ifdef USE_INSTANCING
    local = instanceMatrix * local;
    objNormal = mat3(instanceMatrix) * objNormal;
  #endif
`;

/**
 * @param {object} o
 * @param {number} [o.tone=1]   1 = paper-white surface, lower pushes it into tone and ink
 * @param {string} [o.tint]     fill colour for lit areas (default paper; RED for blood)
 * @param {boolean} [o.flat]    solid ink, no shading (mouths, pupils, chain)
 * @param {number} [o.rim=1]    strength of the red rim light on silhouettes
 * @param {number} [o.spec=1]   hard paper highlight; 0 on soft forms where it reads as a spot
 * @param {boolean} [o.vertexColors] multiply the tint by the mesh's colours (painted outfits)
 */
export const inkMaterial = ({ tone = 1, tint = PAPER, flat = false, rim = 1, spec = 1, cell = 6.5, light = [-0.55, 0.75, 0.45], vertexColors = false } = {}) =>
  new THREE.ShaderMaterial({
    vertexColors,
    uniforms: {
      uLightWorld: { value: new THREE.Vector3(...light).normalize() },
      uTint: { value: new THREE.Color(tint) },
      uPaper: { value: new THREE.Color(PAPER) },
      uInk: { value: new THREE.Color(INK) },
      uRimColor: { value: new THREE.Color(RED) },
      uTone: { value: tone },
      uFlat: { value: flat ? 1 : 0 },
      uRim: { value: rim },
      uSpec: { value: spec },
      uCell: { value: cell },
      uPixelRatio: { value: 1 },
      // 0 manga screentone, 1 anime cel shading, 2 film (see setInkStyle).
      uAnime: { value: 0 },
      uShade: { value: new THREE.Color("#9a93c4") },
      // Film only: distance fog toward the set's air.
      uFog: { value: new THREE.Color("#1a1d2a") },
      uFogRange: { value: new THREE.Vector2(9, 45) },
      // Film only: the key light's colour (the set's light, per beat).
      uKey: { value: new THREE.Color(1.1, 1.05, 0.97) },
    },
    vertexShader: /* glsl */ `
      ${VERTEX_PARS}
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vPaint;
      varying vec3 vWN;
      varying float vDepth;
      void main() {
        ${INSTANCED_POSITION}
        vec4 mv = modelViewMatrix * local;
        vPaint = vec3(1.0);
        #ifdef USE_COLOR
          vPaint = color;
        #endif
        vN = normalize(normalMatrix * objNormal);
        vWN = normalize(mat3(modelMatrix) * objNormal);
        vDepth = -mv.z;
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightWorld, uTint, uPaper, uInk, uRimColor;
      uniform float uTone, uFlat, uRim, uSpec, uCell, uPixelRatio, uAnime;
      uniform vec3 uShade, uFog, uKey;
      uniform vec2 uFogRange;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vPaint;
      varying vec3 vWN;
      varying float vDepth;

      // Anti-aliased step at 0: crisp ink edges at any zoom.
      float edge(float x) { float w = fwidth(x) * 0.75 + 1e-4; return smoothstep(-w, w, x); }

      void main() {
        if (uFlat > 0.5) { gl_FragColor = vec4(uInk, 1.0);
          #include <colorspace_fragment>
          return; }
        vec3 N = normalize(vN);
        if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(vV);
        vec3 L = normalize((viewMatrix * vec4(uLightWorld, 0.0)).xyz);
        float lum = (dot(N, L) * 0.5 + 0.5) * uTone;

        // Film: lit like a frame from the show rather than a page of it. Soft
        // wrapped key, sky and ground fill from the scene's shade colour, a
        // soft rim, a little sheen, and the far distance sinking into the air.
        if (uAnime > 1.5) {
          float ndl = dot(N, L);
          float wrapK = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
          float diff = wrapK * wrapK * (3.0 - 2.0 * wrapK);
          // Tone is the value: a dark ground stays dark, a white shirt stays white.
          vec3 albedo = uTint * vPaint * clamp(0.12 + uTone * 0.88, 0.06, 1.15);
          float sky = normalize(vWN).y * 0.5 + 0.5;
          vec3 fill = mix(uShade * 0.12, uShade * 0.38, sky);
          vec3 col = albedo * (fill + uKey * diff);
          vec3 Hf = normalize(L + V);
          col += vec3(1.0) * pow(max(dot(N, Hf), 0.0), 40.0) * (0.06 + 0.3 * uSpec) * diff;
          float fresF = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
          col += uRimColor * fresF * uRim * (0.25 + 0.45 * (1.0 - diff));
          col = mix(col, uFog, smoothstep(uFogRange.x, uFogRange.y, vDepth) * 0.6);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          return;
        }

        // Anime: flat colour, one hard shadow terminator tinted by the scene's
        // shade colour, a darker core where the form turns away, the rim light.
        // No dots. Tone sets how bright the surface paints, not where it inks.
        if (uAnime > 0.5) {
          float ndl = dot(N, L);
          float lit = edge(ndl + 0.08);
          float deep = 1.0 - edge(ndl + 0.62);
          vec3 base = uTint * vPaint * clamp(0.45 + uTone * 0.6, 0.35, 1.12);
          vec3 cel = mix(base * uShade, base, lit);
          cel *= mix(1.0, 0.7, deep);
          vec3 Ha = normalize(L + normalize(vV));
          cel = mix(cel, min(cel + 0.22, vec3(1.0)), edge(dot(N, Ha) - 0.975) * lit * uSpec);
          float fresA = 1.0 - clamp(dot(N, normalize(vV)), 0.0, 1.0);
          cel = mix(cel, uRimColor, edge(fresA - 0.7) * edge(0.25 - ndl) * uRim * 0.85);
          gl_FragColor = vec4(cel, 1.0);
          #include <colorspace_fragment>
          return;
        }

        // Screentone: 45-degree dot grid in screen space, dots grow into the shadow.
        vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / (uCell * uPixelRatio);
        float d = length(fract(q) - 0.5);
        float amount = clamp((0.74 - lum) / 0.42, 0.0, 1.0);
        float toneDot = 1.0 - edge(d - sqrt(amount) * 0.64);
        float core = 1.0 - edge(lum - 0.31);
        float ink = max(toneDot, core);

        // A hard paper highlight where the key hits square on.
        vec3 H = normalize(L + V);
        float spec = edge(dot(N, H) - 0.985) * (1.0 - core) * uSpec;

        // Red rim on the silhouette's shadow side: the menace light.
        float fres = 1.0 - clamp(dot(N, V), 0.0, 1.0);
        float rim = edge(fres - 0.72) * edge(0.2 - dot(N, L)) * uRim;

        vec3 col = mix(uTint * vPaint, uInk, ink);
        col = mix(col, uPaper, spec);
        col = mix(col, uRimColor, rim);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

/** Inverted-hull outline: a black shell pushed out along normals, back faces only. */
export const outlineMaterial = (width = 1) =>
  new THREE.ShaderMaterial({
    uniforms: { uWidth: { value: width }, uInk: { value: new THREE.Color(INK) } },
    vertexShader: /* glsl */ `
      ${VERTEX_PARS}
      uniform float uWidth;
      void main() {
        ${INSTANCED_POSITION}
        vec4 mv = modelViewMatrix * local;
        vec3 n = normalize(normalMatrix * objNormal);
        // Scale with depth so the line holds a steady width on screen.
        mv.xyz += n * uWidth * 0.0042 * max(1.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      void main() {
        gl_FragColor = vec4(uInk, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
  });

/** Give a mesh (or instanced mesh) its ink line. Returns the outline mesh. */
export const outline = (mesh, material) => {
  const shell = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, material, mesh.count) : new THREE.Mesh(mesh.geometry, material);
  if (mesh.isInstancedMesh) shell.instanceMatrix = mesh.instanceMatrix;
  shell.frustumCulled = false;
  shell.raycast = () => {};
  mesh.add(shell);
  return shell;
};

/**
 * Switch every ink material under `root` between manga screentone and anime
 * cel shading. `shade` multiplies the shadow side (a cool violet by default).
 */
export const setInkStyle = (root, { anime = true, film = false, shade, fog, key } = {}) => {
  root.traverse((obj) => {
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      const u = m?.uniforms;
      if (!u) continue;
      if (u.uFilm) u.uFilm.value = film ? 1 : 0;
      // Film keeps a fine line: the shows are drawn, just not printed.
      if (u.uWidth) {
        m.userData.baseWidth ??= u.uWidth.value;
        u.uWidth.value = m.userData.baseWidth * (film ? 0.45 : 1);
        u.uInk.value.set(film ? "#1b1414" : INK);
      }
      if (!u.uAnime) continue;
      u.uAnime.value = film ? 2 : anime ? 1 : 0;
      if (shade) u.uShade.value.set(shade);
      if (fog) u.uFog.value.set(fog);
      if (key) u.uKey.value.set(key);
    }
  });
};

/** Move the key light for every ink material under `root` (underlighting, flashes). */
export const setInkLight = (root, direction) => {
  root.traverse((obj) => {
    const u = obj.material?.uniforms;
    if (u?.uLightWorld) u.uLightWorld.value.copy(direction);
  });
};

/** Keep screentone dot size tied to device pixels, not CSS pixels. */
export const syncInk = (root, pixelRatio) => {
  root.traverse((obj) => {
    const u = obj.material?.uniforms;
    if (u?.uPixelRatio) u.uPixelRatio.value = pixelRatio;
  });
};

/**
 * The page behind the subject: paper grain, concentration lines converging on
 * `focus`, and a red ink splash. Lines re-seed a few times a second ("boil"),
 * the way hand-drawn lines never sit still between frames.
 */
export const mangaBackdrop = () => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPaper: { value: new THREE.Color(PAPER) },
      uInk: { value: new THREE.Color(INK) },
      uRed: { value: new THREE.Color(RED) },
      uFocus: { value: new THREE.Vector2(0.42, 0.52) },
      uAspect: { value: 1 },
      uSeed: { value: 0 },
      uIntensity: { value: 1 },
      uSplash: { value: 1 },
      uSpread: { value: 1 },
      uRain: { value: 0 },
      uDisc: { value: new THREE.Vector3(0.5, 0.55, 0.3) },
      uInvert: { value: 0 },
      // Film: a lit sky instead of a page — ground colour below, the light colour
      // glowing behind the subject, fine rain, no focus lines.
      uFilm: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper, uInk, uRed;
      uniform vec2 uFocus;
      uniform float uAspect, uSeed, uIntensity, uSplash, uSpread, uRain, uInvert, uFilm;
      uniform vec3 uDisc;
      varying vec2 vUv;

      float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
      float hash2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y);
      }
      float blob(vec2 p, vec2 c, float r, float seed) {
        vec2 d = p - c;
        float a = atan(d.y, d.x);
        float wobble = 0.0;
        for (int k = 1; k <= 5; k++) wobble += sin(a * float(k * 3) + seed * float(k)) * 0.09 / float(k);
        return smoothstep(r * (1.0 + wobble) + 0.004, r * (1.0 + wobble) - 0.004, length(d));
      }

      void main() {
        vec2 p = vUv; p.x *= uAspect;
        vec2 f = uFocus; f.x *= uAspect;
        vec2 d = p - f;
        float r = length(d);
        float a = atan(d.y, d.x) / 6.28318 + 0.5;

        // Concentration lines: thin wedges, each starting at its own radius.
        float n = 320.0;
        float idx = floor(a * n);
        float h = hash(idx + uSeed * 17.0);
        float h2 = hash(idx * 3.1 + uSeed * 5.0);
        float within = abs(fract(a * n) - 0.5);
        float start = 0.3 + h * 0.32;
        float width = (0.08 + 0.42 * h2) * smoothstep(start, start + 0.55, r) * step(0.28, h) * uIntensity;
        float aa = fwidth(a * n);
        float line = 1.0 - smoothstep(width - aa, width + aa, within);

        // Red ink: one heavy splash behind the subject, flecks thrown off it.
        // uSpread grows the splash and throws the flecks wider (the rev).
        float splash = blob(p, f + vec2(0.16, -0.04) * uSpread, 0.27 * uSpread, 2.0);
        splash = max(splash, blob(p, f + vec2(-0.22, 0.18) * uSpread, 0.12 * uSpread, 5.0));
        for (int i = 0; i < 14; i++) {
          float fi = float(i);
          vec2 c = f + vec2(hash(fi) - 0.35, hash(fi + 9.0) - 0.5) * vec2(1.1, 0.8) * uSpread;
          splash = max(splash, blob(p, c, 0.008 + hash(fi + 4.0) * 0.022, fi));
        }
        splash *= uSplash * step(0.33, noise(p * 40.0) + 0.3);

        // Rain mode (noir): slanted streaks of uneven length, a red disc in place
        // of the splash. Same paper, same boil.
        if (uRain > 0.5) {
          vec2 rp = vec2(p.x + p.y * 0.18, p.y);
          float col_ = floor(rp.x * 140.0);
          float rh = hash(col_ + uSeed * 3.0);
          float seg = fract(rp.y * (2.0 + rh * 3.0) + hash(col_ * 7.0) + uSeed * 0.37);
          float streak = step(0.72, rh) * step(seg, 0.35 + rh * 0.3);
          float sw = abs(fract(rp.x * 140.0) - 0.5);
          line = streak * (1.0 - smoothstep(0.06, 0.12, sw)) * uIntensity;
          vec2 dc = uDisc.xy; dc.x *= uAspect;
          splash = smoothstep(uDisc.z + 0.003, uDisc.z - 0.003, length(p - dc));
        }

        float grain = (noise(p * 900.0) - 0.5) * 0.05;
        if (uFilm > 0.5) {
          vec3 air = mix(uInk * 1.2, mix(uInk, uPaper, 0.2), smoothstep(0.0, 1.0, vUv.y));
          float glow = exp(-r * r * 5.0);
          air += uPaper * glow * 0.22 + uRed * exp(-r * r * 2.5) * 0.12 * (uSplash + uIntensity * 0.5);
          // Rain and focus lines survive as faint light, not ink.
          air += uPaper * line * (uRain > 0.5 ? 0.35 : 0.07);
          air *= 1.0 - smoothstep(0.55, 1.25, length(vUv - 0.5) * 1.6) * 0.55;
          gl_FragColor = vec4(air + grain * 0.3, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          return;
        }
        vec3 col = uPaper + grain;
        col = mix(col, uRed, splash);
        col = mix(col, uInk, line);
        // Inverted page: ink ground, paper lines (the devil's pages).
        if (uInvert > 0.5) col = mix(uInk + grain * 0.5, uPaper, line) * (1.0 - splash) + uRed * splash;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
};
