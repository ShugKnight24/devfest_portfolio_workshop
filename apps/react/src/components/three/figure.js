import * as THREE from "three";
import { outline } from "./ink";

/**
 * Figure — a jointed human for ink scenes.
 *
 * Built from capsules, so it is drawn as a silhouette (low tone, red rim):
 * the ink style forgives the anatomy and keeps the read on pose and mass,
 * which is what a fight or a transformation is about.
 *
 * Faces +z. Left side is +x. A pose is `{ joint: [x, y, z] }` in radians;
 * missing joints rest at zero. Arms hang along -y, so:
 *   shoulder.x < 0 swings the arm forward, elbow.x < 0 folds the forearm up
 *   shoulder.z > 0 raises the LEFT arm sideways (negative for the right)
 *   hip.x < 0 lifts the leg forward, knee.x > 0 bends the shin back
 */

export const JOINTS = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "lShoulder",
  "lElbow",
  "rShoulder",
  "rElbow",
  "lHip",
  "lKnee",
  "rHip",
  "rKnee",
];

/**
 * @param {object} o
 * @param {THREE.Material} o.material   body material
 * @param {THREE.Material} [o.line]     outline material (inverted hull)
 * @param {number} [o.height=1]         uniform scale; 1 is about 1.85 units tall
 * @param {number} [o.bulk=1]           shoulder and chest breadth
 */
export const createFigure = ({ material, line, height = 1, bulk = 1 }) => {
  const root = new THREE.Group();
  root.scale.setScalar(height);
  const joints = {};
  const meshes = [];

  const part = (parent, geometry, position, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    if (line) outline(mesh, line);
    meshes.push(mesh);
    return mesh;
  };
  const joint = (name, parent, position) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(...position);
    parent.add(g);
    joints[name] = g;
    return g;
  };
  const limb = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);

  const hips = joint("hips", root, [0, 0.95, 0]);
  part(hips, new THREE.SphereGeometry(0.16, 24, 16), [0, 0, 0], [1.25 * bulk, 0.8, 0.85]);
  const spine = joint("spine", hips, [0, 0.06, 0]);
  part(spine, limb(0.13, 0.16), [0, 0.12, 0], [1.15 * bulk, 1, 0.8]);
  const chest = joint("chest", spine, [0, 0.27, 0]);
  part(chest, limb(0.16, 0.14), [0, 0.07, 0.01], [1.55 * bulk, 1, 0.82]);
  // Traps: the slope from neck to shoulder that makes a big man read big.
  part(chest, new THREE.SphereGeometry(0.1, 16, 12), [0, 0.2, -0.01], [2.2 * bulk, 0.7, 0.9]);
  const neck = joint("neck", chest, [0, 0.24, 0]);
  part(neck, limb(0.055, 0.06), [0, 0.04, 0]);
  const head = joint("head", neck, [0, 0.1, 0]);
  part(head, new THREE.SphereGeometry(0.115, 24, 18), [0, 0.06, 0.01], [0.88, 1.08, 1]);
  part(head, new THREE.BoxGeometry(0.13, 0.06, 0.1), [0, -0.02, 0.05]); // jaw

  for (const [side, s] of [
    ["l", 1],
    ["r", -1],
  ]) {
    const shoulder = joint(`${side}Shoulder`, chest, [s * 0.23 * bulk, 0.15, 0]);
    part(shoulder, new THREE.SphereGeometry(0.075, 16, 12), [0, 0, 0], [1.1, 1, 1]);
    part(shoulder, limb(0.065, 0.2), [0, -0.15, 0]);
    const elbow = joint(`${side}Elbow`, shoulder, [0, -0.3, 0]);
    part(elbow, limb(0.055, 0.18), [0, -0.13, 0]);
    part(elbow, new THREE.SphereGeometry(0.058, 14, 10), [0, -0.29, 0.01], [1, 1.1, 1.1]); // fist
    // A marker at the fist, named like a rig's hand bone, for props and cords.
    const hand = new THREE.Object3D();
    hand.name = `hand_${side}`;
    hand.position.set(0, -0.29, 0.01);
    elbow.add(hand);

    const hip = joint(`${side}Hip`, hips, [s * 0.1, -0.04, 0]);
    part(hip, limb(0.085, 0.3), [0, -0.22, 0]);
    const knee = joint(`${side}Knee`, hip, [0, -0.45, 0]);
    part(knee, limb(0.065, 0.3), [0, -0.2, 0]);
    part(knee, new THREE.BoxGeometry(0.1, 0.06, 0.24), [0, -0.42, 0.05]); // foot
  }

  const apply = (pose) => {
    for (const name of JOINTS) {
      const r = pose[name] ?? [0, 0, 0];
      joints[name].rotation.set(r[0], r[1], r[2]);
    }
    const lift = pose.lift ?? 0;
    joints.hips.position.y = 0.95 + lift;
  };

  return { root, joints, meshes, apply };
};

/** Linear blend between two poses (joint angles stay small, so Euler is fine). */
export const blendPose = (a, b, t) => {
  const out = {};
  for (const name of [...JOINTS, "lift"]) {
    const x = a[name] ?? (name === "lift" ? 0 : [0, 0, 0]);
    const y = b[name] ?? (name === "lift" ? 0 : [0, 0, 0]);
    out[name] = name === "lift" ? x + (y - x) * t : x.map((v, i) => v + (y[i] - v) * t);
  }
  return out;
};

/** A copy of a figure in a different material (ghosts, afterimages). */
export const ghostOf = (figure, material) => {
  const clone = figure.root.clone(true);
  const joints = {};
  clone.traverse((o) => {
    if (o.isMesh) {
      // Ghosts have no ink line: they are light, not matter.
      if (o.material?.side === THREE.BackSide) o.visible = false;
      else o.material = material;
    }
  });
  // Re-find joints by walking the same path as the original.
  const paths = new Map();
  for (const name of JOINTS) {
    const path = [];
    let node = figure.joints[name];
    while (node && node !== figure.root) {
      path.unshift(node.parent.children.indexOf(node));
      node = node.parent;
    }
    paths.set(name, path);
  }
  for (const [name, path] of paths) {
    let node = clone;
    for (const i of path) node = node.children[i];
    joints[name] = node;
  }
  const apply = (pose) => {
    for (const name of JOINTS) {
      const r = pose[name] ?? [0, 0, 0];
      joints[name].rotation.set(r[0], r[1], r[2]);
    }
    joints.hips.position.y = 0.95 + (pose.lift ?? 0);
  };
  return { root: clone, joints, apply };
};
