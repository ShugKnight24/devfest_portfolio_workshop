import * as THREE from "three";
import { DRESS, OUTFITS } from "./rezeKit";
import { createModelFigure } from "./modelFigure";
import { inkMaterial, outline, outlineMaterial } from "./ink";
import { clamp01 } from "./kit";
import { addBladeBlood, aim, bloodMaterial, createBlade, createHybridHead } from "./chainsawParts";

/**
 * The Chainsaw Man — Denji in his hybrid form, as the MAPPA anime draws it.
 *
 * Denji's own figure (the Quaternius body in his devil-hunter clothes: white
 * shirt with the sleeves rolled, loose black tie, dark slacks, high-tops) with
 * his head swapped for the chainsaw head (chainsawParts' createHybridHead), a
 * bar bursting out of the back of each forearm and past the fist, and the
 * starter cord's T-grip in the middle of his chest.
 *
 * `await createChainsawMan(opts)` resolves with:
 *   root, figure, bones, hands { l, r }   add `root` to the scene; pose with
 *   apply(pose)                            figure.js poses (keeps the head synced)
 *   update(time, dt)                       every frame, after apply: runs the
 *                                          chains, jitter, vents, the cord
 *   setForm(k, headBlade = k)              0 plain Denji, 1 the Chainsaw Man
 *   setRev(k)                              chains run, vents brighten, jitter
 *   setBlades(k, right = k)                arm bars out of the forearms
 *   setMouth(k)                            jaw shut on the fangs .. wide
 *   setBlood(k)                            shirt and bars bloodied, 0 .. 1
 *   setCord(k, target?)                    the grip: 0 home on his chest, 1 at
 *                                          `target` (a world point, his fist)
 *   cordAnchor(out?)                       where the cord enters his chest (world)
 *   fistPoint(side = "r", out?)            the middle of a closed fist (world):
 *                                          where a held grip or handle goes
 *   head, headBlade, armBlades [l, r], grip, dispose()
 */

const CORD_DARK = "#2a2522";

/** The largest skinned mesh: the body. */
const findBody = (model) => {
  let body = null;
  model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  return body;
};

/**
 * Blood soaked into the painted clothes: per vertex, the `blood` level at
 * which a stain reaches it. Stains are ragged blobs on the shirt front, collar,
 * shoulder, back, both forearms (where the bars tear out) and a spot on the
 * slacks, each coming in at its own level and spreading as the level rises.
 */
const stainMap = (body) => {
  const geo = body.geometry;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const pos = geo.attributes.position;
  // The forearms, measured: the centre of each arm just past the rolled sleeve.
  const fore = { [-1]: new THREE.Vector3(), [1]: new THREE.Vector3() };
  const n = { [-1]: 0, [1]: 0 };
  for (let i = 0; i < pos.count; i++) {
    const ax = (pos.getX(i) - cx) / H;
    if (Math.abs(ax) > 0.31 && Math.abs(ax) < 0.33 && (pos.getY(i) - min.y) / H > 0.7) {
      const s = Math.sign(ax);
      fore[s].add(new THREE.Vector3((pos.getX(i) - cx) / H, (pos.getY(i) - min.y) / H, (pos.getZ(i) - cz) / H));
      n[s]++;
    }
  }
  // [x, height, z (front +), radius, level it starts at], in body heights.
  const blobs = [
    [-0.04, 0.75, 0.07, 0.04, 0.0],
    [0.05, 0.69, 0.08, 0.034, 0.15],
    [0.01, 0.62, 0.085, 0.03, 0.4],
    [-0.065, 0.66, 0.065, 0.022, 0.55],
    [0.03, 0.815, 0.06, 0.028, 0.25],
    [-0.15, 0.805, 0.02, 0.03, 0.35],
    [0.165, 0.8, -0.01, 0.026, 0.6],
    [0.02, 0.72, -0.08, 0.045, 0.3],
    [0.07, 0.48, 0.07, 0.022, 0.65],
  ];
  for (const s of [-1, 1]) if (n[s]) blobs.push([...fore[s].divideScalar(n[s]).toArray(), 0.034, 0.05]);
  const need = new Float32Array(pos.count).fill(Infinity);
  for (let i = 0; i < pos.count; i++) {
    const x = (pos.getX(i) - cx) / H;
    const y = (pos.getY(i) - min.y) / H;
    const z = (pos.getZ(i) - cz) / H;
    if (y > 0.84 && Math.abs(x) < 0.12) continue; // the head and neck stay clean
    // Ragged edges: the distance wobbles with a little fixed noise.
    const wobble = 1 + 0.32 * Math.sin(x * 211 + 1.3) * Math.sin(y * 187 + 2.1) * Math.sin(z * 233 + 0.7);
    for (const [bx, by, bz, r, th] of blobs) {
      // Below its centre a stain runs: drips reach further down than up.
      const dy = y < by ? (y - by) * 0.6 : y - by;
      const q = (Math.hypot(x - bx, dy, z - bz) * wobble) / r;
      if (q < 1) need[i] = Math.min(need[i], th + q * q * (1 - th));
    }
  }
  return need;
};

export const createChainsawMan = async ({
  height = 1.82,
  line = null,
  lineThin = null,
  ink = { tone: 0.78, rim: 1.4 },
  fist = 0.6,
  outfit = OUTFITS.denji,
  dress = DRESS.denji,
  headScale = 1,
  bladeLength = 0.65,
  armBladeLength = 0.62,
  tongue = false,
  cord = true,
  form = 1,
  blades = 1,
  rev = 0,
  mouth = 0.15,
  blood = 0,
} = {}) => {
  const shared = new Set([line, lineThin].filter(Boolean));
  line ??= outlineMaterial(1.1);
  lineThin ??= outlineMaterial(0.7);
  const S = height / 1.82;

  const figure = await createModelFigure({ height, hair: ["HairSimpleParted", "EyebrowsRegular"], line, ink, outfit, dress, fist });
  const { root, model, bones } = figure;
  figure.apply({});
  root.updateMatrixWorld(true);
  const at = (o) => o.getWorldPosition(new THREE.Vector3());

  // The head rides a pivot that copies the head bone's turn but not its
  // scale, so the human head can collapse to nothing under it.
  const headBone = bones.head;
  const headRest = headBone.scale.clone();
  const pivot = new THREE.Object3D();
  pivot.position.copy(headBone.position);
  pivot.quaternion.copy(headBone.quaternion);
  pivot.scale.copy(headRest);
  headBone.parent.add(pivot);
  const hybrid = createHybridHead({ scale: headScale * S, bladeLength, line, lineThin, tongue });
  hybrid.head.position.copy(at(headBone));
  pivot.attach(hybrid.head);
  const headBase = { position: hybrid.head.position.clone(), scale: hybrid.head.scale.clone() };
  const syncHead = () => {
    pivot.position.copy(headBone.position);
    pivot.quaternion.copy(headBone.quaternion);
  };

  // The arm bars: out of the back of each forearm, flat to it, past the fist.
  const m = hybrid.materials;
  const bloodMat = bloodMaterial();
  const wound = inkMaterial({ tint: "#5e0a0e", tone: 0.7, rim: 0.2, spec: 0.5 });
  const hands = { l: model.getObjectByName("hand_l"), r: model.getObjectByName("hand_r") };
  const arm = { length: armBladeLength * S, radius: 0.066 * S, thickness: 0.028 * S };
  const armBlades = [];
  const armBlood = [];
  const wounds = [];
  [
    ["l", 1],
    ["r", -1],
  ].forEach(([side, s], i) => {
    const elbow = bones[`${side}Elbow`];
    const e = at(elbow);
    const h = at(hands[side]);
    const dir = h.clone().sub(e).normalize();
    const blade = createBlade({ ...arm, steel: m.steel, rail: m.rail, ink: m.chain, line: lineThin, teeth: 26 });
    blade.group.position.copy(e).lerp(h, 0.3).add(new THREE.Vector3(s * 0.047 * S, 0, 0));
    aim(blade.group, dir, new THREE.Vector3(0, 0, 1));
    elbow.attach(blade.group);
    armBlades.push(blade);
    armBlood.push(addBladeBlood(blade, { ...arm, material: bloodMat, seed: 5 + i * 4, count: 6 }));
    // Torn flesh where the bar comes out.
    const tear = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), wound);
    tear.scale.set(0.016 * S, 0.032 * S, 0.04 * S);
    tear.position.copy(e).lerp(h, 0.27).add(new THREE.Vector3(s * 0.03 * S, 0, 0));
    outline(tear, lineThin);
    elbow.attach(tear);
    wounds.push({ mesh: tear, scale: tear.scale.clone() });
  });
  const headBlood = addBladeBlood(hybrid.blade, { length: bladeLength, radius: 0.072, thickness: 0.03, material: bloodMat, seed: 3, count: 7 });

  // The starter cord: a T-grip on his sternum, the cord running into his chest.
  const body = findBody(model);
  const chestBone = model.getObjectByName("spine_03") ?? bones.chest ?? bones.spine;
  const ay = at(bones.neck).y - 0.22 * S;
  let front = -Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i < body.geometry.attributes.position.count; i++) {
    body.getVertexPosition(i, p).applyMatrix4(body.matrixWorld);
    if (Math.abs(p.x) < 0.025 * S && Math.abs(p.y - ay) < 0.025 * S) front = Math.max(front, p.z);
  }
  if (!Number.isFinite(front)) front = 0.12 * S;
  front += 0.016 * S; // the tie over the shirt
  const anchor = new THREE.Object3D();
  anchor.position.set(0, ay, front - 0.006 * S);
  chestBone.attach(anchor);
  const home = new THREE.Object3D();
  home.position.set(0, ay, front + 0.03 * S);
  chestBone.attach(home);
  const chestRest = chestBone.getWorldQuaternion(new THREE.Quaternion()).invert();
  const gripMat = inkMaterial({ tint: CORD_DARK, tone: 0.85, rim: 0.5, spec: 0.6 });
  const ropeMat = inkMaterial({ tint: "#3a3430", tone: 0.8, rim: 0.4 });
  const grip = new THREE.Group();
  const handleGeo = new THREE.CapsuleGeometry(0.016 * S, 0.085 * S, 4, 10);
  handleGeo.rotateZ(Math.PI / 2);
  const ferruleGeo = new THREE.CylinderGeometry(0.01 * S, 0.012 * S, 0.026 * S, 10);
  ferruleGeo.rotateX(Math.PI / 2);
  ferruleGeo.translate(0, 0, -0.02 * S);
  for (const g of [handleGeo, ferruleGeo]) {
    const mesh = new THREE.Mesh(g, gripMat);
    outline(mesh, lineThin);
    grip.add(mesh);
  }
  const ropeGeo = new THREE.CylinderGeometry(0.0085 * S, 0.0085 * S, 1, 6);
  ropeGeo.translate(0, 0.5, 0);
  const rope = new THREE.Mesh(ropeGeo, ropeMat);
  outline(rope, lineThin);
  const cordGroup = new THREE.Group();
  cordGroup.add(grip, rope);
  cordGroup.visible = cord;
  root.add(cordGroup);
  const cordState = { k: 0, target: new THREE.Vector3() };
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const UP = new THREE.Vector3(0, 1, 0);
  const updateCord = () => {
    if (!cordGroup.visible) return;
    root.updateMatrixWorld(true);
    home.getWorldPosition(v1).lerp(cordState.target, cordState.k);
    grip.position.copy(root.worldToLocal(v1));
    q1.copy(root.getWorldQuaternion(q2)).invert();
    grip.quaternion.copy(q1).multiply(chestBone.getWorldQuaternion(q2)).multiply(chestRest);
    root.worldToLocal(anchor.getWorldPosition(v2));
    v1.subVectors(grip.position, v2);
    const len = v1.length();
    rope.position.copy(v2);
    rope.quaternion.setFromUnitVectors(UP, len > 1e-5 ? v1.divideScalar(len) : UP);
    rope.scale.set(1, Math.max(0.001, len), 1);
  };

  // Blood in the shirt: stain levels per vertex, mixed into the paint on demand.
  const colors = body.geometry.attributes.color;
  const paint = colors ? colors.array.slice() : null;
  const need = colors ? stainMap(body) : null;
  const red = new THREE.Color("#7a0c10");
  let bloodShown = -1;
  const paintBlood = (k) => {
    if (!colors) return;
    const q = Math.round(k * 50) / 50;
    if (q === bloodShown) return;
    bloodShown = q;
    for (let i = 0; i < need.length; i++) {
      const w = need[i] === Infinity ? 0 : clamp01((q - need[i]) / 0.06);
      const j = i * 3;
      colors.array[j] = paint[j] + (red.r - paint[j]) * w;
      colors.array[j + 1] = paint[j + 1] + (red.g - paint[j + 1]) * w;
      colors.array[j + 2] = paint[j + 2] + (red.b - paint[j + 2]) * w;
    }
    colors.needsUpdate = true;
  };

  const state = { rev, blades: [blades, blades], blood, chain: 0 };
  const armBase = armBlades.map((b) => b.group.position.clone());

  const setForm = (k, headBladeK = k) => {
    headBone.scale.copy(headRest).multiplyScalar(k > 0.5 ? 0.001 : 1);
    hybrid.head.visible = k > 0.01;
    hybrid.head.scale.copy(headBase.scale).multiplyScalar(Math.max(0.001, k));
    hybrid.blade.extend(clamp01(headBladeK));
  };
  const setBlades = (l, r = l) => {
    state.blades = [clamp01(l), clamp01(r)];
    armBlades.forEach((b, i) => b.extend(state.blades[i]));
    wounds.forEach(({ mesh, scale }, i) => {
      const k = Math.min(1, state.blades[i] * 3);
      mesh.visible = k > 0.01;
      mesh.scale.copy(scale).multiplyScalar(Math.max(0.001, k * (0.8 + 0.4 * state.blood)));
    });
  };
  const setBlood = (k) => {
    state.blood = clamp01(k);
    headBlood(state.blood);
    armBlood.forEach((set) => set(state.blood));
    paintBlood(state.blood);
    setBlades(...state.blades);
  };
  const setMouth = (k) => hybrid.setMouth(k);
  const setRev = (k) => {
    state.rev = clamp01(k);
    hybrid.setVents(state.rev);
  };
  const setCord = (k, target) => {
    cordState.k = clamp01(k);
    if (target) cordState.target.copy(target);
    updateCord();
  };
  const fistPoint = (side = "r", out = new THREE.Vector3()) => {
    const hand = hands[side].getWorldPosition(out);
    const wrist = v2.copy(hand).sub(bones[`${side}Elbow`].getWorldPosition(v1)).normalize();
    return hand.addScaledVector(wrist, 0.07 * S);
  };
  const apply = (pose) => {
    figure.apply(pose);
    syncHead();
  };

  const update = (time, dt = 0) => {
    syncHead();
    const r = state.rev;
    state.chain += r * 7 * Math.max(0, dt);
    hybrid.blade.run(state.chain);
    armBlades.forEach((b, i) => b.run(state.chain * 1.1 + i * 0.37));
    // The engine shakes everything bolted to it, and the slits flicker with it.
    const j = r * 0.003;
    const jx = Math.sin(time * 97.3);
    const jy = Math.sin(time * 83.1 + 1);
    const jz = Math.sin(time * 71.7 + 2);
    hybrid.head.position.set(jx, jy, jz).multiplyScalar((j * headBase.scale.x) / (headScale * S)).add(headBase.position);
    armBlades.forEach((b, i) => b.group.position.set(jy, jz, jx).multiplyScalar(j * 0.7 * b.group.scale.x * (i ? -1 : 1)).add(armBase[i]));
    hybrid.setVents(r * (0.88 + 0.12 * Math.sin(time * 41)));
    updateCord();
  };

  setForm(form);
  setBlades(blades);
  setMouth(mouth);
  setRev(rev);
  setBlood(blood);
  updateCord();

  const dispose = () => {
    const geos = new Set();
    const mats = new Set();
    root.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((mat) => mat && !shared.has(mat) && mats.add(mat));
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((mat) => mat.dispose());
  };

  return {
    root,
    figure,
    bones,
    hands,
    head: hybrid.head,
    jaw: hybrid.jaw,
    headBlade: hybrid.blade,
    armBlades,
    grip,
    apply,
    update,
    setForm,
    setRev,
    setBlades,
    setMouth,
    setBlood,
    setCord,
    cordAnchor: (out = new THREE.Vector3()) => anchor.getWorldPosition(out),
    fistPoint,
    dispose,
  };
};
