import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { inkMaterial, outline } from "./ink";
import { clamp01, hash, lerp } from "./kit";

/**
 * Chainsaw parts shared by the Chainsaw Man scenes: a bar with a running
 * chain, blood on it, and the hybrid form's head (createHybridHead). Bar
 * materials come in from the caller so every part shades like its page.
 */

const stadium = (len, r) => {
  const shape = new THREE.Shape();
  shape.moveTo(0, -r);
  shape.lineTo(len, -r);
  shape.absarc(len, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(0, r);
  shape.absarc(0, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  return shape;
};

/**
 * A chainsaw bar along +x from the origin, chain spikes standing off its edge.
 * `extend(k)` grows it out of its root (0 = sheathed, 1 = full length), and
 * `run(offset)` laps the chain. `reach` is the group that scales with
 * `extend`: anything stuck to the bar (blood) goes in it.
 */
export const createBlade = ({ length = 1, radius = 0.12, steel, rail, ink, line, teeth = 26, thickness = 0.05 }) => {
  const group = new THREE.Group();
  const reach = new THREE.Group(); // scaled along x to extend
  group.add(reach);
  const bar = new THREE.Mesh(
    new THREE.ExtrudeGeometry(stadium(length, radius), {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: thickness * 0.2,
      bevelSize: thickness * 0.2,
      bevelSegments: 2,
      curveSegments: 20,
    }),
    steel,
  );
  bar.position.z = -thickness / 2;
  reach.add(bar);
  if (line) outline(bar, line);
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(stadium(length, radius), { depth: thickness * 0.8, bevelEnabled: false, curveSegments: 20 }), rail);
  back.scale.set(1.03, 1.16, 1);
  back.position.z = -thickness * 0.4;
  reach.add(back);

  const perim = 2 * length + 2 * Math.PI * radius;
  const onBar = (s) => {
    const d = ((s % perim) + perim) % perim;
    if (d < length) return [d, radius, 0];
    if (d < length + Math.PI * radius) {
      const a = (d - length) / radius;
      return [length + Math.sin(a) * radius, Math.cos(a) * radius, -a];
    }
    if (d < 2 * length + Math.PI * radius) return [length - (d - length - Math.PI * radius), -radius, Math.PI];
    const a = (d - 2 * length - Math.PI * radius) / radius;
    return [-Math.sin(a) * radius, -Math.cos(a) * radius, Math.PI - a];
  };
  const spike = new THREE.ConeGeometry(radius * 0.22, radius * 0.6, 4);
  spike.translate(0, radius * 0.34, 0);
  const chain = new THREE.InstancedMesh(spike, ink, teeth);
  reach.add(chain);
  const dummy = new THREE.Object3D();
  const run = (offset) => {
    for (let i = 0; i < teeth; i++) {
      const [x, y, a] = onBar(offset + (i / teeth) * perim);
      dummy.position.set(x, y, 0);
      dummy.rotation.set(0, 0, a);
      dummy.updateMatrix();
      chain.setMatrixAt(i, dummy.matrix);
    }
    chain.instanceMatrix.needsUpdate = true;
  };
  run(0);
  const extend = (k) => {
    reach.scale.set(Math.max(0.0001, k), Math.max(0.0001, lerp(0.4, 1, k)), 1);
    reach.visible = k > 0.001;
  };
  return { group, reach, run, extend, tip: () => new THREE.Vector3(length + radius, 0, 0).applyMatrix4(reach.matrixWorld) };
};

/** Aim a group's +x along `forward` with +y roughly along `up` (both in parent space). */
export const aim = (object, forward, up = new THREE.Vector3(0, 1, 0)) => {
  const x = forward.clone().normalize();
  const z = new THREE.Vector3().crossVectors(x, up).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};

/* --------------------------------------------------------------------------
 * The hybrid form's head, as MAPPA draws it: Denji's head gone, a chainsaw's
 * engine housing in its place. An angular orange casing with a hard brow,
 * glowing vent slits down its sides for eyes, a black wraparound handle over
 * the top and a rear handle looping down the back, a dark engine block behind,
 * the bar out of the top of the forehead, and under the brow a mouth of long
 * white fangs over a pointed orange jaw. Cords hang off the back of it down
 * over the neck and shoulders.
 * ------------------------------------------------------------------------ */

export const HYBRID_COLORS = {
  casing: "#e8681f",
  engine: "#24201e",
  steel: "#cdd0cb",
  rail: "#383838",
  chain: "#4a4a4a",
  fang: "#eee7d8",
  mouth: "#1c0c0c",
  tongue: "#b1475a",
  blood: "#7c0d12",
  cords: ["#4a1d1a", "#6b2f26", "#3a1714", "#5a2620"],
};

/** Paint a whole geometry one colour (for merged, vertex-coloured meshes). */
const paint = (geo, hex) => {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
};

const tube = (points, radius, segments = 24, radial = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), segments, radius, radial);

/** A flat, ragged splat in the xy plane, facing +z, about unit radius. */
const splatGeometry = (seed, points = 12) => {
  const shape = new THREE.Shape();
  for (let i = 0; i <= points; i++) {
    const a = ((i % points) / points) * Math.PI * 2;
    const r = 0.75 + hash(seed * 13 + (i % points)) * 0.4 + (hash(seed * 7 + (i % points)) > 0.82 ? 0.35 : 0);
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ShapeGeometry(shape);
};

/** A blood material that sits on a surface without fighting it. */
export const bloodMaterial = (hex = HYBRID_COLORS.blood) => {
  const m = inkMaterial({ tint: hex, tone: 0.75, rim: 0.15, spec: 0.6 });
  m.polygonOffset = true;
  m.polygonOffsetFactor = -2;
  m.polygonOffsetUnits = -2;
  return m;
};

/**
 * Blood smeared on both faces of a createBlade bar. Pass the bar's own
 * `length`, `radius` and `thickness`. Returns `set(k)`: 0 clean, 1 soaked;
 * splats come in one by one as k rises, and ride `extend` with the bar.
 */
export const addBladeBlood = (blade, { length, radius, thickness, material, seed = 1, count = 6 }) => {
  const splats = [];
  const face = 0.7 * thickness + 0.0012;
  for (let i = 0; i < count; i++) {
    for (const s of [-1, 1]) {
      const k = seed * 17 + i * 5 + (s > 0 ? 0 : 3);
      const mesh = new THREE.Mesh(splatGeometry(k), material);
      const u = lerp(0.14, 0.88, (i + hash(k)) / count);
      const y = (hash(k + 1) - 0.5) * radius * 0.7;
      const w = radius * (0.35 + 0.5 * hash(k + 2));
      const h = Math.min(w * 0.8, radius * 0.92 - Math.abs(y));
      mesh.position.set(u * length, y, s * face);
      if (s < 0) mesh.rotation.y = Math.PI;
      mesh.rotation.z = (hash(k + 3) - 0.5) * 0.4;
      blade.reach.add(mesh);
      splats.push({ mesh, th: hash(k + 4) * 0.75, size: new THREE.Vector3(w * (1.4 + 2.2 * hash(k + 5)), h, 1) });
    }
  }
  const set = (k) => {
    for (const { mesh, th, size } of splats) {
      const g = clamp01((k - th) / 0.25);
      mesh.visible = g > 0;
      mesh.scale.set(Math.max(1e-4, size.x * g), Math.max(1e-4, size.y * Math.sqrt(g)), 1);
    }
  };
  set(0);
  return set;
};

/**
 * The Chainsaw Man's head. Origin at the head bone (the base of the skull),
 * face toward +z, sized for the 1.82 m Denji at `scale` 1. The casing's top
 * sits 0.27 above the origin, the jaw's point 0.12 below it.
 *
 * Returns `{ head, blade, jaw, tongue, materials, setMouth(k), setVents(k),
 * dispose }`: `blade` is a createBlade bar (run / extend it), `setMouth` opens
 * the jaw (0 shut on the fangs, 1 wide: tilt the head back for a full roar,
 * or the jaw meets his chest), `setVents` lights the slits (0 a dull
 * ember, 1 running hot — they stay small, under the bloom threshold at idle).
 * Pass `materials` to override any of the ink materials by name.
 */
export const createHybridHead = ({ scale = 1, bladeLength = 0.65, line = null, lineThin = line, tongue = false, materials = {} } = {}) => {
  const C = HYBRID_COLORS;
  const m = {
    casing: inkMaterial({ tint: C.casing, tone: 0.95, rim: 0.45, spec: 0.35 }),
    engine: inkMaterial({ tint: C.engine, tone: 0.9, rim: 0.6, spec: 0.5 }),
    steel: inkMaterial({ tint: C.steel, tone: 0.9, rim: 0.3 }),
    rail: inkMaterial({ tint: C.rail, tone: 0.9, rim: 0.4 }),
    chain: inkMaterial({ tint: C.chain, tone: 0.9, rim: 0.3 }),
    fang: inkMaterial({ tint: C.fang, tone: 0.86, rim: 0.15, spec: 0.2 }),
    mouth: inkMaterial({ tint: C.mouth, tone: 0.4, rim: 0, spec: 0 }),
    tongue: inkMaterial({ tint: C.tongue, tone: 0.85, rim: 0.2, spec: 0.8 }),
    cords: inkMaterial({ tint: "#ffffff", tone: 0.8, rim: 0.5, spec: 0.35, vertexColors: true }),
    ...materials,
  };
  const vent = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.32, 0.05) });
  const owned = [...Object.entries(m).filter(([k]) => !(k in materials)).map(([, v]) => v), vent];

  const head = new THREE.Group();
  head.name = "chainsawManHead";
  head.scale.setScalar(scale);
  const add = (parent, geometry, material, position = [0, 0, 0], lineMat = line) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    parent.add(mesh);
    if (lineMat) outline(mesh, lineMat);
    return mesh;
  };

  // The casing: a side profile (z forward, y up) extruded across the head,
  // its edges bevelled. Flat sides, a squared front, a hard brow along the bottom.
  const profile = new THREE.Shape();
  profile.moveTo(-0.085, 0.112);
  profile.lineTo(0.12, 0.1);
  profile.lineTo(0.145, 0.1);
  profile.lineTo(0.152, 0.155);
  profile.quadraticCurveTo(0.156, 0.245, 0.08, 0.252);
  profile.lineTo(-0.055, 0.248);
  profile.quadraticCurveTo(-0.095, 0.245, -0.097, 0.2);
  profile.lineTo(-0.085, 0.112);
  const casingGeo = new THREE.ExtrudeGeometry(profile, { depth: 0.19, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.014, bevelSegments: 3, curveSegments: 14 });
  casingGeo.rotateY(-Math.PI / 2);
  casingGeo.translate(0.095, 0, 0);
  add(head, casingGeo, m.casing);
  // The brow: a lip proud of the casing's lower front edge.
  const brow = add(head, new THREE.BoxGeometry(0.228, 0.022, 0.05), m.casing, [0, 0.094, 0.146]);
  brow.rotation.x = 0.15;

  // Vent slits down each side near the front: three arcs, the eyes.
  const vents = [];
  for (const s of [-1, 1]) {
    for (const r of [0.044, 0.064, 0.084]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = THREE.MathUtils.degToRad(lerp(96, 172, i / 12));
        pts.push([s * 0.107, 0.096 + Math.sin(a) * r, 0.15 + Math.cos(a) * r]);
      }
      vents.push(tube(pts, 0.0072, 16, 6));
    }
  }
  add(head, mergeGeometries(vents), vent, [0, 0, 0], lineThin);

  // The engine behind the casing: a black block, a flywheel cover each side,
  // a plug on top.
  add(head, new THREE.BoxGeometry(0.175, 0.16, 0.15), m.engine, [0, 0.165, -0.15]);
  add(head, new THREE.BoxGeometry(0.13, 0.05, 0.09), m.engine, [0, 0.075, -0.165]);
  for (const s of [-1, 1]) {
    const cover = new THREE.CylinderGeometry(0.068, 0.068, 0.03, 28);
    cover.rotateZ(Math.PI / 2);
    add(head, cover, m.engine, [s * 0.098, 0.15, -0.155]);
    const rib = new THREE.TorusGeometry(0.046, 0.006, 6, 28);
    rib.rotateY(Math.PI / 2);
    add(head, rib, m.engine, [s * 0.114, 0.15, -0.155], lineThin);
    const hub = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 14);
    hub.rotateZ(Math.PI / 2);
    add(head, hub, m.rail, [s * 0.118, 0.15, -0.155], lineThin);
  }
  add(head, new THREE.CylinderGeometry(0.014, 0.014, 0.04, 10), m.rail, [0.045, 0.255, -0.18], lineThin);

  // Handles: the wraparound over the top, the rear loop down the back.
  add(head, tube([[-0.122, 0.13, -0.035], [-0.13, 0.25, -0.035], [-0.122, 0.322, -0.035], [-0.08, 0.338, -0.035], [0, 0.342, -0.035], [0.08, 0.338, -0.035], [0.122, 0.322, -0.035], [0.13, 0.25, -0.035], [0.122, 0.13, -0.035]], 0.013, 56, 8), m.engine);
  add(head, tube([[0, 0.342, -0.035], [0, 0.372, -0.1], [0, 0.352, -0.19], [0, 0.29, -0.245], [0, 0.2, -0.245], [0, 0.15, -0.222]], 0.015, 40, 8), m.engine);

  // The mouth: a dark cavity under the brow, a row of long fangs hanging off it.
  const cavity = new THREE.SphereGeometry(1, 20, 14);
  cavity.scale(0.086, 0.08, 0.105);
  add(head, cavity, m.mouth, [0, 0.04, 0.03], null);
  const fangGeo = (r, len, tip) => {
    const g = new THREE.ConeGeometry(r, len, 5, 1);
    g.translate(0, len / 2, 0); // base at the origin, point up +y
    if (tip < 0) g.rotateX(Math.PI);
    return g;
  };
  const upper = [];
  const NU = 21;
  for (let i = 0; i < NU; i++) {
    const phi = THREE.MathUtils.degToRad(lerp(-105, 105, (i + 0.5) / NU));
    const front = Math.cos(phi);
    const len = (0.07 + 0.04 * hash(i + 11)) * (0.7 + 0.4 * front);
    const g = fangGeo(0.0085 + 0.0035 * hash(i + 5), len, -1);
    g.rotateX(-0.14 + (hash(i + 2) - 0.5) * 0.2); // points lean out, irregular
    g.rotateZ((hash(i + 8) - 0.5) * 0.22);
    g.rotateY(phi);
    g.translate(0.088 * Math.sin(phi), 0.093, 0.03 + 0.112 * front);
    upper.push(g);
  }
  add(head, mergeGeometries(upper), m.fang, [0, 0, 0], lineThin);

  // The jaw, hinged behind the mouth: lower fangs on an orange rim, the
  // floor of the mouth, and the pointed chin plate jutting forward.
  const P = new THREE.Vector3(0, 0.05, -0.05);
  const jaw = new THREE.Group();
  jaw.position.copy(P);
  head.add(jaw);
  const atHinge = (g) => g.translate(-P.x, -P.y, -P.z);
  const lower = [];
  const NL = 19;
  for (let i = 0; i < NL; i++) {
    const phi = THREE.MathUtils.degToRad(lerp(-100, 100, (i + 0.5) / NL));
    const front = Math.cos(phi);
    const len = (0.06 + 0.035 * hash(i + 41)) * (0.75 + 0.35 * front);
    const g = fangGeo(0.008 + 0.0035 * hash(i + 37), len, 1);
    g.rotateX(0.12 + (hash(i + 33) - 0.5) * 0.2);
    g.rotateZ((hash(i + 29) - 0.5) * 0.22);
    g.rotateY(phi);
    g.translate(0.08 * Math.sin(phi), -0.024, 0.025 + 0.1 * front);
    lower.push(g);
  }
  add(jaw, atHinge(mergeGeometries(lower)), m.fang, [0, 0, 0], lineThin);
  const rim = [];
  for (let i = 0; i <= 16; i++) {
    const phi = THREE.MathUtils.degToRad(lerp(-108, 108, i / 16));
    rim.push([0.09 * Math.sin(phi), -0.032, 0.022 + 0.108 * Math.cos(phi)]);
  }
  add(jaw, atHinge(tube(rim, 0.013, 32, 6)), m.casing);
  add(jaw, atHinge(new THREE.BoxGeometry(0.17, 0.014, 0.15).translate(0, -0.037, 0.045)), m.mouth, [0, 0, 0], null);
  const chin = new THREE.Shape();
  chin.moveTo(-0.094, 0);
  chin.lineTo(0.094, 0);
  chin.lineTo(0.08, -0.034);
  chin.lineTo(0, -0.11);
  chin.lineTo(-0.08, -0.034);
  chin.lineTo(-0.094, 0);
  const chinGeo = new THREE.ExtrudeGeometry(chin, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 2 });
  chinGeo.rotateX(-0.38); // the point juts forward, a beak
  chinGeo.translate(0, -0.03, 0.112);
  add(jaw, atHinge(chinGeo), m.casing);
  const tongueMesh = add(
    jaw,
    atHinge(tube([[0.0, -0.02, 0.03], [0.02, -0.016, 0.12], [0.045, -0.052, 0.168], [0.056, -0.11, 0.165], [0.05, -0.155, 0.145]], 0.017, 28, 8)),
    m.tongue,
    [0, 0, 0],
    lineThin,
  );
  tongueMesh.visible = tongue;

  // Cords: a mane of dark red tubes off the back and underside of the head,
  // hanging down the neck and over the shoulders; a few under the jaw.
  const strands = [];
  const NB = 30;
  for (let i = 0; i < NB; i++) {
    const az = THREE.MathUtils.degToRad(lerp(72, 288, (i + hash(i + 71)) / NB));
    const sx = Math.sin(az);
    const back = -Math.cos(az); // 1 straight behind
    const base = [0.085 * sx, 0.03 + 0.09 * hash(i + 3), -0.075 + 0.085 * Math.cos(az)];
    const len = lerp(0.13, 0.32, back * 0.5 + 0.5) * (0.85 + 0.3 * hash(i + 17));
    const pts = [
      base,
      [base[0] + 0.025 * sx, base[1] - 0.05, base[2] - 0.02],
      [base[0] * 1.45, base[1] - len * 0.6, base[2] - 0.02 - 0.015 * back],
      [base[0] * 1.6 + (hash(i + 23) - 0.5) * 0.02, base[1] - len, base[2] - 0.02 - 0.02 * back],
    ];
    strands.push(paint(tube(pts, 0.0085 + 0.0045 * hash(i + 9), 14, 5), C.cords[i % C.cords.length]));
  }
  for (let i = 0; i < 7; i++) {
    const az = THREE.MathUtils.degToRad(lerp(-38, 38, i / 6));
    const base = [0.05 * Math.sin(az), -0.004, 0.005 + 0.035 * Math.cos(az)];
    const pts = [base, [base[0] * 1.2, -0.05, 0.05], [base[0] * 1.4 + (hash(i + 91) - 0.5) * 0.02, -0.1 - 0.02 * hash(i + 93), 0.062]];
    strands.push(paint(tube(pts, 0.009 + 0.003 * hash(i + 97), 10, 5), C.cords[(i + 1) % C.cords.length]));
  }
  add(head, mergeGeometries(strands), m.cords, [0, 0, 0], lineThin);

  // The bar, out of the top of the forehead, forward and a little up. Most of
  // it clears the casing: about one and a half heads of steel in front of him.
  const blade = createBlade({ length: bladeLength, radius: 0.072, steel: m.steel, rail: m.rail, ink: m.chain, line: lineThin, teeth: 30, thickness: 0.03 });
  blade.group.position.set(0, 0.21, -0.03);
  aim(blade.group, new THREE.Vector3(0, 0.33, 0.944), new THREE.Vector3(0, 0.944, -0.33));
  head.add(blade.group);

  const ember = new THREE.Color(0.62, 0.32, 0.05);
  const hot = new THREE.Color(1.12, 0.76, 0.26);
  const setVents = (k) => vent.color.copy(ember).lerp(hot, clamp01(k));
  const setMouth = (k) => {
    jaw.rotation.x = lerp(0.03, 0.45, clamp01(k));
  };
  setMouth(0);

  const dispose = () => {
    head.traverse((o) => o.geometry?.dispose());
    owned.forEach((mat) => mat.dispose());
  };
  return { head, blade, jaw, tongue: tongueMesh, materials: m, setMouth, setVents, dispose };
};
