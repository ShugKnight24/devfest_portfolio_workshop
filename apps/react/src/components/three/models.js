import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { inkMaterial, outline } from "./ink";

/**
 * Models — rigged glTF characters, drawn in ink.
 *
 * `loadModel` fetches once per URL and hands back an independent clone (its
 * own skeleton), so one file can be three thugs. `inkify` swaps every material
 * for an ink material, so a model keeps its form while shading like the page.
 *
 * All models live in /public/models and are CC0 (see the LICENSE there).
 */

const cache = new Map();
const loader = new GLTFLoader();

export const loadModel = async (url) => {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
  const gltf = await cache.get(url);
  return { root: cloneSkinned(gltf.scene), animations: gltf.animations };
};

/** An inverted-hull ink line that follows a skinned mesh's bones. */
const skinnedOutline = (mesh, material) => {
  const shell = new THREE.SkinnedMesh(mesh.geometry, material);
  shell.bind(mesh.skeleton, mesh.bindMatrix);
  shell.frustumCulled = false;
  shell.raycast = () => {};
  mesh.add(shell);
  return shell;
};

/**
 * Replace every material with ink. `ink` is inkMaterial's options plus an
 * optional `rimColor`; `line` adds the outline (skinned meshes get a skinned one).
 */
export const inkify = (root, { ink = {}, line } = {}) => {
  const { rimColor, ...options } = ink;
  const material = inkMaterial({ spec: 0, ...options });
  if (rimColor) material.uniforms.uRimColor.value.set(rimColor);
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = material;
    obj.frustumCulled = false;
  });
  if (line) {
    const meshes = [];
    root.traverse((obj) => obj.isMesh && meshes.push(obj));
    meshes.forEach((mesh) => (mesh.isSkinnedMesh ? skinnedOutline(mesh, line) : outline(mesh, line)));
  }
  return material;
};

/** Find a bone (or any node) by exact name, then by a loose match. */
export const findBone = (root, ...names) => {
  for (const name of names) {
    const exact = root.getObjectByName(name);
    if (exact) return exact;
  }
  const wanted = names.map((n) => n.toLowerCase().replace(/[^a-z]/g, ""));
  let found = null;
  root.traverse((o) => {
    if (found || !o.isBone) return;
    if (wanted.includes(o.name.toLowerCase().replace(/[^a-z]/g, ""))) found = o;
  });
  return found;
};

/** Scale a model so its bounding box is `height` tall, feet on y = 0. */
export const fitHeight = (root, height) => {
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root, true).getSize(new THREE.Vector3());
  root.scale.multiplyScalar(height / Math.max(1e-6, size.y));
  root.updateMatrixWorld(true);
  root.position.y -= new THREE.Box3().setFromObject(root, true).min.y;
};

/**
 * Bind a separately exported, separately rigged part (hair, brows) onto a
 * body's skeleton by bone name, so it follows every pose the body takes.
 */
export const attachSkinned = (body, part) => {
  const meshes = [];
  part.traverse((o) => o.isSkinnedMesh && meshes.push(o));
  for (const mesh of meshes) {
    const bones = mesh.skeleton.bones.map((b) => body.getObjectByName(b.name) ?? b);
    const skeleton = new THREE.Skeleton(bones, mesh.skeleton.boneInverses);
    mesh.removeFromParent();
    body.add(mesh);
    mesh.bind(skeleton, mesh.bindMatrix);
  }
};
