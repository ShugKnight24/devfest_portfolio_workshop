import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { prefersReducedMotion } from "../stage/beatClock";

/**
 * Stage runtime — the one WebGL harness every 3D scene in the app runs inside.
 *
 * A scene module never touches the renderer, the resize logic or the frame
 * loop. It receives a `stage` and returns `{ update, setProps, dispose }`:
 *
 *   update(time, dt)  draw the frame for `time` seconds since mount
 *   setProps(props)   React props changed (fired, bleeding, ...)
 *   dispose()         free anything the scene graph traversal will not find
 *
 * That keeps the same rules as the 2D beats: a frame is a function of time
 * plus props, so reduced motion is not a second code path. It renders one
 * frame at `staticTime` and stops.
 *
 * The harness owns the expensive, easy-to-get-wrong parts once:
 * - MSAA on a half-float target, so bloom reads HDR emissives without banding
 * - a PMREM room environment, so metal has something to reflect
 * - the loop pauses offscreen and in hidden tabs; a deck mounts many of these
 * - dispose walks the graph and force-releases the context, because browsers
 *   cap live WebGL contexts at ~16 and a talk flips through more than that
 */

export const hasWebGL = () => {
  try {
    if (typeof document === "undefined" || typeof window === "undefined") return false;
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const disposeMaterial = (material) => {
  for (const value of Object.values(material)) {
    if (value && value.isTexture) value.dispose();
  }
  material.dispose();
};

export const disposeGraph = (root) => {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach(disposeMaterial);
    else if (obj.material) disposeMaterial(obj.material);
  });
};

/**
 * @param {HTMLElement} container  sized by CSS; the canvas fills it
 * @param {object}      options
 * @param {number}      [options.fov=35]
 * @param {number}      [options.exposure=1]
 * @param {string}      [options.background="#05070a"]
 * @param {number}      [options.envIntensity=1]
 * @param {{strength:number, radius:number, threshold:number}} [options.bloom]
 * @param {number}      [options.staticTime=8]  the frame reduced motion holds
 * @param {Function}    [options.onContextLost]
 */
export const createStage = (container, options = {}) => {
  const {
    fov = 35,
    exposure = 1,
    background = "#05070a",
    envIntensity = 1,
    bloom = { strength: 0.65, radius: 0.45, threshold: 0.82 },
    toneMapping = THREE.ACESFilmicToneMapping,
    antialias = true,
    staticTime = 8,
    maxPixelRatio = 2,
    onContextLost,
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  room.traverse((obj) => obj.geometry?.dispose());
  scene.environment = envTarget.texture;
  scene.environmentIntensity = envIntensity;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: antialias ? 4 : 0 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  // `bloom: false` for flat styles (ink, print) where glow would read as a mistake.
  const bloomPass = bloom ? new UnrealBloomPass(new THREE.Vector2(1, 1), bloom.strength, bloom.radius, bloom.threshold) : null;
  if (bloomPass) composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const size = { width: 1, height: 1, aspect: 1 };
  const resizeListeners = new Set();
  // Pointer in [-1, 1], eased toward the cursor so parallax never snaps.
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, inside: false };

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width === size.width && height === size.height) return;
    size.width = width;
    size.height = height;
    size.aspect = width / height;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = size.aspect;
    camera.updateProjectionMatrix();
    resizeListeners.forEach((fn) => fn(size));
    if (staticMode && update) renderFrame(staticTime, 0);
  };

  const onPointerMove = (event) => {
    const rect = container.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.targetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.inside = true;
  };
  const onPointerLeave = () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
    pointer.inside = false;
  };
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerleave", onPointerLeave);

  let update = null;
  // A scene may draw itself (two cameras, scissored halves); otherwise the composer does.
  let draw = null;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let onscreen = true;
  let disposed = false;
  let paused = false;
  const staticMode = prefersReducedMotion();

  const renderFrame = (time, dt) => {
    pointer.x += (pointer.targetX - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.targetY - pointer.y) * Math.min(1, dt * 4);
    update?.(time, dt);
    if (draw) draw(dt);
    else composer.render(dt);
  };

  const tick = (now) => {
    raf = 0;
    if (disposed || paused || !onscreen || document.hidden) return;
    // Clamp dt: a tab coming back from the background must not fast-forward.
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    elapsed += dt;
    renderFrame(elapsed, dt);
    raf = window.requestAnimationFrame(tick);
  };

  const wake = () => {
    if (staticMode || disposed || paused || raf || !update) return;
    last = 0;
    raf = window.requestAnimationFrame(tick);
  };

  const intersection =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          onscreen = entry.isIntersecting;
          if (onscreen) wake();
        })
      : null;
  intersection?.observe(container);

  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(container);

  const onLost = (event) => {
    event.preventDefault();
    window.cancelAnimationFrame(raf);
    raf = 0;
    onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();

  return {
    THREE,
    renderer,
    scene,
    camera,
    composer,
    bloomPass,
    size,
    pointer,
    staticMode,
    onResize(fn) {
      resizeListeners.add(fn);
      fn(size);
      return () => resizeListeners.delete(fn);
    },
    /**
     * Start drawing. In reduced motion this renders one held frame. `render`
     * replaces the composer for scenes that draw themselves (split screens).
     */
    start(fn, render = null) {
      update = fn;
      draw = render;
      if (staticMode) renderFrame(staticTime, 0);
      else wake();
    },
    /** Stop or resume the frame loop (stills, a presenter's freeze-frame). */
    setPaused(next) {
      paused = Boolean(next);
      if (!paused) wake();
    },
    /** Draw the frame at `time` seconds now, outside the loop (stills, debugging). */
    renderAt(time, dt = 1 / 60) {
      if (update) renderFrame(time, dt);
    },
    /** Re-render the held frame after props change under reduced motion. */
    invalidate() {
      if (staticMode && update) renderFrame(staticTime, 0);
    },
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(raf);
      intersection?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      disposeGraph(scene);
      envTarget.dispose();
      pmrem.dispose();
      composer.dispose?.();
      target.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
};
