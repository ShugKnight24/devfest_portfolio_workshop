import * as THREE from "three";
import { outline } from "./ink";
import { hash, lerp } from "./kit";

/**
 * Chainsaw parts shared by the Chainsaw Man scenes: a bar with a running
 * chain, and the Chainsaw Man head (blade out of the forehead, a jaw of fangs
 * across the face, two small eyes). Ink materials come in from the scene so
 * every part shades like the page it sits on.
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
 * `run(offset)` laps the chain.
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
  return { group, run, extend, tip: () => new THREE.Vector3(length + radius, 0, 0).applyMatrix4(reach.matrixWorld) };
};

/** Aim a group's +x along `forward` with +y roughly along `up` (both in parent space). */
export const aim = (object, forward, up = new THREE.Vector3(0, 1, 0)) => {
  const x = forward.clone().normalize();
  const z = new THREE.Vector3().crossVectors(x, up).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};

const fang = (() => {
  let g;
  return () => {
    if (g) return g;
    g = new THREE.ConeGeometry(1, 1, 4, 2);
    g.rotateY(Math.PI / 4);
    return g;
  };
})();

/**
 * The Chainsaw Man head, origin at the neck, face toward +z. Returns the
 * group and its forehead blade so the scene can run and extend it.
 */
export const createChainsawHead = ({ skin, steel, rail, ink, bone, line, lineThin, scale = 1, bladeLength = 0.75 }) => {
  const head = new THREE.Group();
  head.scale.setScalar(scale);
  const add = (geometry, material, position, s = [1, 1, 1], lineMat = line) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...position);
    m.scale.set(...s);
    head.add(m);
    if (lineMat) outline(m, lineMat);
    return m;
  };
  // Skull: a squared dome, the engine housing he wears for a face.
  add(new THREE.SphereGeometry(0.15, 32, 24), skin, [0, 0.13, 0], [1.05, 1.1, 1.1]);
  add(new THREE.BoxGeometry(0.24, 0.12, 0.24), skin, [0, 0.06, 0.01]);
  // The mouth: a wide slot of ink, fangs top and bottom across the whole face.
  add(new THREE.BoxGeometry(0.25, 0.07, 0.04), ink, [0, 0.07, 0.115], [1, 1, 1], null);
  for (let i = 0; i < 9; i++) {
    const u = (i + 0.5) / 9;
    const x = lerp(-0.11, 0.11, u);
    const size = 0.035 + hash(i + 3) * 0.015;
    const upper = add(fang(), bone, [x, 0.1, 0.13], [size * 0.35, size, size * 0.35], lineThin);
    upper.rotation.x = Math.PI;
    if (i < 8) add(fang(), bone, [x + 0.012, 0.04, 0.13], [size * 0.3, size * 0.9, size * 0.3], lineThin);
  }
  // Eyes: two small holes, far apart, set high.
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.022, 12, 8), ink, [s * 0.075, 0.19, 0.145], [1.2, 0.8, 0.5], null);
  // The blade, out of the forehead, forward and up.
  const blade = createBlade({ length: bladeLength, radius: 0.085, steel, rail, ink, line: lineThin, teeth: 26, thickness: 0.035 });
  blade.group.position.set(0, 0.24, 0.07);
  aim(blade.group, new THREE.Vector3(0, 0.28, 0.96), new THREE.Vector3(0, 0.96, -0.28));
  head.add(blade.group);
  return { head, blade };
};
