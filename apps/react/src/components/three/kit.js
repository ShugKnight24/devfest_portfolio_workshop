import * as THREE from "three";

/**
 * Kit — the small pieces every scene reaches for: easing that matches the 2D
 * beats, canvas-drawn textures (no image requests, nothing to 404 on stage),
 * a light-beam shader, and one GPU particle pool for sparks, smoke and blood.
 */

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** Progress of `u` through the window [a, b], clamped. */
export const segment = (u, a, b) => clamp01((u - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
/** Damped bounce for a landing: 1 at t=0, settles to 0. */
export const settle = (t, bounces = 3) => Math.exp(-5 * t) * Math.cos(t * Math.PI * bounces);

/** Deterministic hash in [0, 1) so particle spray is the same every run. */
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** A colour pushed past 1 so bloom picks it up. Use with MeshBasicMaterial. */
export const hdr = (hex, intensity = 1) => new THREE.Color(hex).multiplyScalar(intensity);

export const canvasTexture = (width, height, draw, { color = true, repeat } = {}) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
};

/** Soft round sprite for particles. */
export const softDot = () =>
  canvasTexture(
    64,
    64,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { color: false },
  );

/** Grain for roughness maps: breaks up the plastic look of flat PBR. */
export const noiseTexture = (size = 256, base = 150, spread = 60, repeat = [4, 4]) =>
  canvasTexture(
    size,
    size,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const v = base + (hash(i * 0.37) - 0.5) * spread;
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    { color: false, repeat },
  );

/**
 * Additive light shaft between two points. Bright at the silhouette, fading
 * along its length, with optional travelling bands. Returns the mesh; drive
 * `mesh.material.uniforms.uIntensity` and `uTime`.
 */
export const lightBeam = ({ from, to, radiusFrom = 0.05, radiusTo = 0.6, color = "#00ffcc", bands = 0 }) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const length = a.distanceTo(b);
  const geometry = new THREE.CylinderGeometry(radiusTo, radiusFrom, length, 32, 1, true);
  geometry.translate(0, length / 2, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
      uBands: { value: bands },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      uniform float uBands;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        // Clamp every pow() base: interpolated normals overshoot 1, pow() of a
        // negative is NaN, and bloom smears one NaN pixel across the frame.
        float facing = clamp(abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0);
        float rim = pow(1.0 - facing, 1.6) * 0.85 + 0.15;
        float along = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.3) * smoothstep(0.0, 0.06, vUv.y);
        float band = uBands > 0.0 ? 0.65 + 0.35 * sin(vUv.y * uBands - uTime * 9.0) : 1.0;
        vec3 c = uColor * rim * along * band * uIntensity;
        gl_FragColor = vec4(max(c, 0.0), 1.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  mesh.renderOrder = 10;
  return mesh;
};

/** Scrolling dashes along a strip's U axis: data on the move. */
export const flowMaterial = ({ color = "#00ffcc", count = 30, speed = 0.6, base = 0.18, peak = 3 }) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uCount: { value: count },
      uSpeed: { value: speed },
      uBase: { value: base },
      uPeak: { value: peak },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime, uCount, uSpeed, uBase, uPeak;
      varying vec2 vUv;
      void main() {
        float d = fract(vUv.x * uCount - uTime * uSpeed);
        float dash = smoothstep(0.0, 0.08, d) * smoothstep(0.45, 0.2, d);
        gl_FragColor = vec4(uColor * (uBase + dash * uPeak), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

/**
 * One GPU particle pool. CPU integrates (a few hundred points is nothing),
 * the shader draws soft sprites with per-particle size, colour and alpha.
 * `blending: "add"` for sparks and glow, `"normal"` for smoke.
 */
export const createParticles = ({ count = 400, blending = "add", texture = softDot() } = {}) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const state = Array.from({ length: count }, () => ({
    life: 0,
    max: 1,
    vx: 0,
    vy: 0,
    vz: 0,
    size: 0.1,
    grow: 0,
    gravity: 0,
    drag: 0,
    alpha: 1,
  }));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uScale: { value: 600 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
      uniform float uScale;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
        vColor = aColor; vAlpha = aAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: blending === "add" ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 20;
  let cursor = 0;
  const tmpColor = new THREE.Color();

  return {
    points,
    /** Keep sprite size in world units as the canvas resizes. */
    resize(heightPx, fovDeg, pixelRatio = 1) {
      material.uniforms.uScale.value = (heightPx * pixelRatio) / (2 * Math.tan((fovDeg * Math.PI) / 360));
    },
    emit({ position, velocity = [0, 0, 0], life = 1, size = 0.1, grow = 0, gravity = 0, drag = 0, color = "#ffffff", intensity = 1, alpha = 1 }) {
      const i = cursor;
      cursor = (cursor + 1) % count;
      const s = state[i];
      s.life = life;
      s.max = life;
      [s.vx, s.vy, s.vz] = velocity;
      s.size = size;
      s.grow = grow;
      s.gravity = gravity;
      s.drag = drag;
      s.alpha = alpha;
      positions.set(position, i * 3);
      tmpColor.set(color).multiplyScalar(intensity);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    },
    step(dt) {
      for (let i = 0; i < count; i++) {
        const s = state[i];
        if (s.life <= 0) {
          alphas[i] = 0;
          continue;
        }
        s.life -= dt;
        const k = Math.max(0, 1 - s.drag * dt);
        s.vx *= k;
        s.vy = s.vy * k - s.gravity * dt;
        s.vz *= k;
        positions[i * 3] += s.vx * dt;
        positions[i * 3 + 1] += s.vy * dt;
        positions[i * 3 + 2] += s.vz * dt;
        const p = 1 - Math.max(0, s.life) / s.max;
        sizes[i] = s.size * (1 + s.grow * p);
        // Quick in, long out: reads as heat or vapour rather than a pop.
        alphas[i] = s.alpha * Math.min(1, p * 8) * (1 - p) ** 1.4;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aColor.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
    },
  };
};
