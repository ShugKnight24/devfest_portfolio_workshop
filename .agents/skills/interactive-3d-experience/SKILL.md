---
name: interactive-3d-experience
description: >
  Best practices for building high-performance 3D WebGL scenes, procedural Three.js models,
  volumetric particle simulations (smoke, vapor, embers, water bubbles), and Web Audio API acoustic synthesis.
  Trigger: "3d scene", "interactive 3d", "webgl", "threejs", "smoke simulation", "particle physics",
  "synthesize audio", "web audio".
---

# Interactive 3D & Sensory Web Experience

Guidelines for building 60fps responsive 3D WebGL scenes, procedural Three.js assets, particle simulations, and Web Audio sound effects.

## 1. Procedural 3D Asset Architecture

- **Zero External Assets Guarantee**: Build 3D objects with procedural Three.js primitives (`CylinderGeometry`, `LatheGeometry`, `SphereGeometry`, `TorusGeometry`, `ExtrudeGeometry`) to ensure zero HTTP network latency, instant rendering, and no missing GLTF/asset 404 errors.
- **Hierarchical Grouping**: Group components hierarchically (e.g. `hookahGroup > [baseGroup, stemGroup, bowlGroup, hoseGroup, coalsGroup]`) so parts can be animated and swapped independently.
- **PBR & Glass Refraction**: Use `MeshPhysicalMaterial` or `MeshStandardMaterial` with `roughness`, `metalness`, `transmission`, `ior: 1.5`, and `clearcoat: 1.0` for realistic crystal glass, anodized metals, and juicy fruit rind textures.

## 2. Dynamic Particle Physics

- **Particle Pooling**: Pre-allocate particle buffers (`Float32Array` for positions, velocities, opacities, sizes, and colors) rather than instantiating new objects each frame.
- **Volumetric Smoke**: Render smoke with soft radial gradients, turbulence noise (`Math.sin()`, Perlin / Simplex approximation), buoyancy velocity, and opacity dissipation curves.
- **Fluid Bubbling**: Simulate water bubbling with ascending oscillating spheres, variable burst timers, and surface meniscus ripples.
- **Glowing Embers**: Emissive materials with dynamic brightness scaling (`emissiveIntensity` pulsed with sine waves and inhale intensity).

## 3. Parametric Web Audio Synthesizer

- **Offline Synthesis**: Generate all sound effects parametrically using the Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `GainNode`, `AudioBufferSourceNode` with custom noise buffers).
- **Bubbling Sound**: Low-pass filtered noise + rapidly randomized bandpass sine bursts (frequency modulated between 80Hz - 420Hz).
- **Inhale / Draw**: Air draft white noise with high-shelf cutoff and exponential gain ramp.
- **Torch / Lighter**: Spark click (5ms impulse burst) followed by broadband pink noise resonant sizzle.
- **Exhale Whoosh**: Smooth multi-pole lowpass swept air release.

## 4. Performance Guardrails

- Clamp `requestAnimationFrame` render loops with delta-time.
- Pause rendering or throttle to 10 FPS when canvas is off-screen using `IntersectionObserver`.
- Support responsive viewport resizing with `camera.aspect = width / height` and `camera.updateProjectionMatrix()`.
- Clean up WebGL contexts, geometries, and textures upon component unmount.
