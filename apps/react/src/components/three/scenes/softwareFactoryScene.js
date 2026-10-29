import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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
 */

export const FACTORY_STATIONS = [
  { id: "problem", num: "01", name: "THE PROBLEM", x: -8.4 },
  { id: "spec", num: "02", name: "SPEC", x: -4.2 },
  { id: "build", num: "03", name: "BUILD", x: 0 },
  { id: "review", num: "04", name: "REVIEW", x: 4.2 },
  { id: "ship", num: "05", name: "SHIP", x: 8.4 },
];
const [PROBLEM_X, SPEC_X, BUILD_X, REVIEW_X, SHIP_X] = FACTORY_STATIONS.map((s) => s.x);

const PERIOD = 22;
const DEVICE_SCALE = 1.2;
const BELT_Y = 0.55;
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

const stamp = (text, color) =>
  canvasTexture(256, 256, (ctx, w, h) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "800 120px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 6);
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

export const createSoftwareFactoryScene = (stage, { overlay } = {}) => {
  const { scene, camera, renderer, pointer } = stage;
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2("#05070a", 0.03);
  scene.environmentIntensity = 0.3;

  // ── Light ────────────────────────────────────────────────────────────────
  const key = new THREE.DirectionalLight("#fff1e0", 2.6);
  key.position.set(6, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -15, right: 15, top: 8, bottom: -8, near: 1, far: 36 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  root.add(key);
  const rim = new THREE.DirectionalLight("#9fdcff", 0.6);
  rim.position.set(-6, 6, -10);
  root.add(rim);
  const pools = FACTORY_STATIONS.map((s, i) => {
    const light = new THREE.PointLight([RED, CYAN, AMBER, GREEN, CYAN][i], 0, 7, 1.6);
    light.position.set(s.x, 2.2, 1.4);
    root.add(light);
    return light;
  });

  // ── Floor, racks, line ───────────────────────────────────────────────────
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
      color: "#080a0e",
      roughness: 0.7,
      metalness: 0.25,
      roughnessMap: noiseTexture(256, 140, 70, [30, 30]),
      emissive: new THREE.Color("#0a3c48"),
      emissiveMap: floorGrid(),
      emissiveIntensity: 0.3,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const gunmetal = new THREE.MeshStandardMaterial({ color: "#1b2029", roughness: 0.38, metalness: 0.85 });
  const armBody = new THREE.MeshStandardMaterial({ color: "#e9ecef", roughness: 0.35, metalness: 0.15 });
  const armJoint = new THREE.MeshStandardMaterial({ color: "#3a414c", roughness: 0.3, metalness: 0.9 });
  const steel = new THREE.MeshStandardMaterial({ color: "#5d6673", roughness: 0.34, metalness: 1 });

  // Server racks behind the line, LEDs blinking: the compute the crew runs on.
  const RACKS = 12;
  const rackGeo = new RoundedBoxGeometry(1.1, 4.2, 1, 2, 0.04);
  const ledGeo = new THREE.PlaneGeometry(0.05, 0.025);
  const leds = [];
  for (let i = 0; i < RACKS; i++) {
    const rack = new THREE.Mesh(rackGeo, gunmetal);
    rack.position.set(-15 + i * 2.7, 2.1, -6.5 - (i % 2) * 0.6);
    rack.castShadow = true;
    root.add(rack);
    for (let r = 0; r < 14; r++) {
      const mat = new THREE.MeshBasicMaterial({ color: hdr(hash(i * 31 + r) > 0.8 ? AMBER : CYAN, 2) });
      const led = new THREE.Mesh(ledGeo, mat);
      led.position.set(rack.position.x - 0.35 + (r % 3) * 0.12, 0.6 + r * 0.25, rack.position.z + 0.51);
      root.add(led);
      leds.push({ mat, seed: i * 31 + r, base: mat.color.clone() });
    }
  }

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
  const dummy = new THREE.Object3D();

  // ── The crew ─────────────────────────────────────────────────────────────
  const armMats = { body: armBody, joint: armJoint, dark: gunmetal };
  const investigator = createRobotArm({ materials: armMats, color: CYAN, tool: "scanner", upper: 1.3, fore: 1.15 });
  investigator.root.position.set(SPEC_X - 0.2, 0, -2.0);
  const builders = [-1, 1].map((s) => {
    const arm = createRobotArm({ materials: armMats, color: AMBER, tool: "gripper", upper: 1.35, fore: 1.2 });
    arm.root.position.set(BUILD_X + s * 1.25, 0, -2.0);
    return arm;
  });
  const reviewer = createRobotArm({ materials: armMats, color: GREEN, tool: "stamp", upper: 1.3, fore: 1.15 });
  reviewer.root.position.set(REVIEW_X + 0.3, 0, -2.0);
  [investigator, ...builders, reviewer].forEach((a) => root.add(a.root));

  // Parts bins behind the builders.
  const bins = [-1, 1].map((s) => {
    const bin = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.5, 0.7, 2, 0.05), gunmetal);
    bin.position.set(BUILD_X + s * 2.4, 0.25, -1.4);
    bin.castShadow = true;
    root.add(bin);
    return bin.position.clone().add(new THREE.Vector3(0, 0.5, 0));
  });

  // Scan beam and review ring.
  const scanBeam = lightBeam({ from: [0, 0, 0], to: [0, 1, 0], radiusFrom: 0.04, radiusTo: 0.7, color: CYAN });
  root.add(scanBeam);
  const ship = lightBeam({ from: [SHIP_X, 0.5, 0], to: [SHIP_X, 20, 0], radiusFrom: 1.1, radiusTo: 1.4, color: "#7ffff0", bands: 26 });
  root.add(ship);
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
  const passStamp = new THREE.MeshBasicMaterial({ map: stamp("✓", GREEN), transparent: true, depthWrite: false, toneMapped: false });
  const failStamp = new THREE.MeshBasicMaterial({ map: stamp("✕", RED), transparent: true, depthWrite: false, toneMapped: false });
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
    const parts = device.slots.map((slot, i) => {
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(slot.size[0] * 0.96, slot.size[1] * 0.9, 0.04, 2, 0.012),
        new THREE.MeshStandardMaterial({ color: product.accent, roughness: 0.4, metalness: 0.2, emissive: new THREE.Color(product.accent), emissiveIntensity: 0.15, transparent: true }),
      );
      mesh.castShadow = true;
      group.add(mesh);
      return { mesh, slot, i };
    });
    const stampMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), passStamp);
    stampMesh.renderOrder = 15;
    group.add(stampMesh);
    return { product, group, sheet, device, parts, stampMesh, offset: k / PRODUCTS.length };
  });
  const partCount = (item) => item.parts.length;
  const partWindow = (item, i) => {
    const span = T.build[1] - T.build[0] - 0.05;
    const start = T.build[0] + 0.03 + (i / partCount(item)) * span;
    return [start, start + span / partCount(item)];
  };

  const sparks = createParticles({ count: 400, blending: "add" });
  root.add(sparks.points);

  // ── Camera ───────────────────────────────────────────────────────────────
  // Three-quarter view down the line: the problem recedes to the left, the ship
  // beam stands big in the right foreground. Reads left to right, like the talk.
  const rig = { distance: 15.5 };
  const lookAt = new THREE.Vector3(0.9, 1.6, 0);
  const viewDir = new THREE.Vector3(0.62, 0.34, 1).normalize();
  const unsubscribeResize = stage.onResize(({ height, aspect }) => {
    sparks.resize(height, camera.fov, renderer.getPixelRatio());
    rig.distance = aspect >= 1.7 ? 15.5 : THREE.MathUtils.clamp(15.5 * (1.7 / aspect) ** 0.85, 15.5, 32);
  });

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
  const lastU = new Array(items.length).fill(-1);
  const idle = (arm, t, phase) => {
    tmp.set(Math.sin(t * 0.6 + phase) * 0.5, 2.2 + Math.sin(t * 0.9 + phase) * 0.15, 0.4);
    return tmp.add(arm.root.position).setZ(-0.4);
  };

  const update = (time, dt) => {
    camera.position.copy(viewDir).multiplyScalar(rig.distance).add(lookAt);
    camera.position.x += Math.sin(time * 0.06) * 0.8 + pointer.x * 0.9;
    camera.position.y += pointer.y * 0.6;
    camera.lookAt(lookAt);

    flows.forEach((f) => (f.uniforms.uTime.value = time));
    ship.material.uniforms.uTime.value = time;
    for (let i = 0; i < ROLLERS; i++) {
      dummy.position.set(-11.6 + i * (23.2 / (ROLLERS - 1)), 0.47, 0);
      dummy.rotation.set(0, 0, -time * 2);
      dummy.updateMatrix();
      rollers.setMatrixAt(i, dummy.matrix);
    }
    rollers.instanceMatrix.needsUpdate = true;
    leds.forEach((l) => l.mat.color.copy(l.base).multiplyScalar(hash(l.seed + Math.floor(time * 4 + l.seed)) > 0.25 ? 1 : 0.15));

    const act = { problem: 0, spec: 0, build: 0, review: 0, charge: 0, beam: 0 };
    const status = { problem: "", spec: "", build: "", review: "", ship: "" };
    let investigatorTarget = null;
    const builderTargets = [null, null];
    let reviewerTarget = null;
    let reviewerApproach = 0.6;

    items.forEach((item, k) => {
      const u = (time / PERIOD + item.offset) % 1;
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
      const on = (a, b) => clamp01(Math.min((u - a) / 0.015, (b - u) / 0.015));
      const { product } = item;

      // PROBLEM: the sheet, rocking on the belt.
      const toBlue = segment(u, T.spec[0] + 0.02, T.spec[1] - 0.02);
      item.sheet.visible = toBlue < 1;
      item.sheet.material.opacity = 1 - toBlue;
      item.sheet.position.set(0, 0.6 + Math.sin(time * 2 + k) * 0.02, 0.1);
      item.sheet.rotation.set(-0.35, Math.sin(time * 0.7 + k) * 0.08, Math.sin(time * 1.3 + k) * 0.04);

      // SPEC: the device fades in as a blueprint where the sheet was.
      const dev = item.device;
      const appear = easeOutBack(segment(u, T.spec[0] + 0.04, T.spec[1]));
      dev.group.visible = appear > 0.001;
      dev.group.scale.setScalar(Math.max(0.001, appear) * DEVICE_SCALE);
      dev.group.position.set(0, 0, 0);
      dev.blueprint.material.opacity = 1;
      // BUILD: parts land, the finished UI fills in behind them.
      const built = segment(u, T.build[0] + 0.05, T.build[1]);
      dev.final.material.opacity = easeInOutCubic(Math.min(1, built * 1.15));
      let placing = 0;
      item.parts.forEach((part, i) => {
        const [a, b] = partWindow(item, i);
        const p = segment(u, a, b);
        const bin = bins[i % 2];
        part.mesh.visible = u >= a && u < T.launch[1];
        // Slot in world space (device is scaled and moves with the group).
        tmp.copy(part.slot.center).multiplyScalar(DEVICE_SCALE).add(item.group.position);
        if (p > 0 && p < 1) {
          const e = easeInOutCubic(p);
          part.mesh.position.set(lerp(bin.x, tmp.x, e), lerp(bin.y, tmp.y, e) + Math.sin(e * Math.PI) * 0.8, lerp(bin.z, tmp.z, e)).sub(item.group.position);
          part.mesh.rotation.set((1 - e) * 1.2, (1 - e) * 0.8, 0);
          part.mesh.scale.setScalar(DEVICE_SCALE);
          builderTargets[i % 2] = part.mesh.position.clone().add(item.group.position).add(new THREE.Vector3(0, 0.12, 0));
          placing += 1;
        } else if (p >= 1) {
          part.mesh.position.copy(part.slot.center).multiplyScalar(DEVICE_SCALE);
          part.mesh.scale.setScalar(DEVICE_SCALE);
          part.mesh.rotation.set(0, 0, 0);
          // Landing sparks, once.
          if (lastU[k] >= 0 && lastU[k] < b && u >= b && dt > 0) {
            for (let s = 0; s < 10; s++) {
              const ang = hash(i * 13 + s + k) * Math.PI * 2;
              sparks.emit({
                position: [tmp.x, tmp.y, tmp.z + 0.05],
                velocity: [Math.cos(ang) * 2, 1 + hash(s + i) * 2.5, Math.sin(ang) * 1.2 + 1],
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
        part.mesh.material.opacity = 1 - segment(u, b, b + 0.03) * 0.92;
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
      if (on(...T.build) > 0.5) status.build = `${product.name} · ${item.parts.filter((pt) => u >= partWindow(item, pt.i)[1]).length}/${partCount(item)}`;
      if (on(...T.review) > 0.5) status.review = segment(u, ...T.review) < 0.45 ? "1 failing ▸ fixing" : "all tests green";
      if (u >= T.charge[0]) status.ship = u >= T.launch[0] ? `live: ${product.outcome}` : "deploying";

      // SPEC: the scanner looks down on the sheet, its beam sweeping.
      if (u >= T.spec[0] && u < T.spec[1]) {
        const sweep = Math.sin(segment(u, ...T.spec) * Math.PI * 3) * 0.35;
        investigatorTarget = new THREE.Vector3(x + sweep, BELT_Y + 2.4, 0.2);
      }
      // REVIEW: the stamp comes down: red first, then green after the fix.
      const r = segment(u, ...T.review);
      item.stampMesh.visible = u >= T.review[0] + 0.02 && u < T.launch[1];
      item.stampMesh.material = r < 0.45 ? failStamp : passStamp;
      const press = r < 0.45 ? segment(r, 0.15, 0.3) : segment(r, 0.62, 0.78);
      item.stampMesh.position.set(dev.height * 0.25, dev.height * 0.95 + 0.25, 0.12);
      item.stampMesh.scale.setScalar(lerp(1.6, 1, easeOutBack(press)) * (press > 0 ? 1 : 0.001));
      if (u >= T.review[0] && u < T.review[1]) {
        const down = r < 0.45 ? Math.sin(segment(r, 0.05, 0.3) * Math.PI) : Math.sin(segment(r, 0.5, 0.78) * Math.PI);
        reviewerTarget = new THREE.Vector3(x + dev.height * 0.25, BELT_Y + dev.height * 0.95 + lerp(1.4, 0.45, down), 0.35);
        reviewerApproach = 0.2;
      }

      // Launch trail.
      if (u >= T.launch[0] && u < T.launch[1] - 0.02 && dt > 0) {
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

    // The crew moves: working when there is work, idling over the line when not.
    investigator.reachFor(investigatorTarget ?? idle(investigator, time, 0), 0.3);
    builders.forEach((b, i) => {
      b.reachFor(builderTargets[i] ?? idle(b, time, 1 + i * 2), 0.6);
      b.grip(builderTargets[i] ? 0.2 : 0.9);
    });
    reviewer.reachFor(reviewerTarget ?? idle(reviewer, time, 4), reviewerApproach);

    // Scan beam from the investigator's lens to the item.
    scanBeam.visible = Boolean(investigatorTarget);
    if (investigatorTarget) {
      investigator.root.updateMatrixWorld(true);
      investigator.tipWorld(tip);
      const target = tmp.set(investigatorTarget.x, BELT_Y + 0.6, 0.1);
      const len = tip.distanceTo(target);
      scanBeam.position.copy(tip);
      scanBeam.scale.set(1, len, 1);
      scanBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().sub(tip).normalize());
      scanBeam.material.uniforms.uIntensity.value = 0.9 * act.spec;
      scanBeam.material.uniforms.uTime.value = time;
    }

    pools[0].intensity = act.problem * 3;
    pools[1].intensity = act.spec * 5;
    pools[2].intensity = act.build * (4 + Math.random() * 3);
    pools[3].intensity = act.review * 5;
    pools[4].intensity = act.charge * 4 + act.beam * 18;
    shipRings.forEach(({ ring, mat }, i) => {
      ring.rotation.z = time * (0.4 + i * 0.3) * (1 + act.charge * 6) * (i % 2 ? -1 : 1);
      mat.color.copy(hdr(CYAN, 0.8 + act.charge * 4 + act.beam * 3));
    });
    ship.material.uniforms.uIntensity.value = act.beam * 1.5;
    ship.visible = act.beam > 0.001;
    sparks.step(dt);

    setStatus(anchors[0], status.problem || "inbox");
    setStatus(anchors[1], status.spec || "ready");
    setStatus(anchors[2], status.build || "standby");
    setStatus(anchors[3], status.review || "armed");
    setStatus(anchors[4], status.ship || "on deck");
    const hot = [act.problem, act.spec, act.build, act.review, Math.max(act.charge, act.beam)];
    anchors.forEach((a, i) => {
      if (!a.el) return;
      projected.copy(a.world).project(camera);
      a.el.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`;
      a.el.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
      a.el.toggleAttribute("data-hot", hot[i] > 0.5);
    });
  };

  return {
    update,
    dispose() {
      unsubscribeResize();
    },
  };
};
