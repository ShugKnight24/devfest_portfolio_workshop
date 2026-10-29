import * as THREE from "three";
import { JOINTS } from "./figure";
import { findBone } from "./models";

/**
 * Retarget — drive a real humanoid rig with the pose library in figure.js.
 *
 * Poses are authored for an idealised figure: faces +z, arms hanging, every
 * joint's rest frame aligned with the model. Real rigs differ (bone axes run
 * along the bone, arms rest in a T or A), so each pose rotation is applied in
 * MODEL space about the bone's pivot:
 *
 *   local = restLocal · (W⁻¹ · delta · W)      W = bone's rest rotation in model space
 *
 * which makes a child inherit its parent's delta exactly as the capsule figure
 * does. Arms are first swung from the rig's rest down to hanging, and THAT
 * becomes the rest pose; measured before the swing, the forearms' frames stay
 * in the T, where an elbow bend about the model's x axis does nothing.
 */

const NAMES = {
  hips: ["Hips", "hips", "pelvis", "Pelvis", "mixamorigHips"],
  spine: ["Spine", "spine", "spine_01", "Spine1", "Abdomen", "mixamorigSpine"],
  chest: ["Chest", "chest", "spine_02", "Spine2", "UpperChest", "Torso", "mixamorigSpine2"],
  neck: ["Neck", "neck", "neck_01", "mixamorigNeck"],
  head: ["Head", "head", "mixamorigHead"],
  lShoulder: ["UpperArm.L", "upperarm_l", "LeftUpperArm", "LeftArm", "mixamorigLeftArm"],
  lElbow: ["LowerArm.L", "lowerarm_l", "LeftLowerArm", "LeftForeArm", "mixamorigLeftForeArm"],
  rShoulder: ["UpperArm.R", "upperarm_r", "RightUpperArm", "RightArm", "mixamorigRightArm"],
  rElbow: ["LowerArm.R", "lowerarm_r", "RightLowerArm", "RightForeArm", "mixamorigRightForeArm"],
  lHip: ["UpperLeg.L", "thigh_l", "LeftUpperLeg", "LeftUpLeg", "mixamorigLeftUpLeg"],
  lKnee: ["LowerLeg.L", "calf_l", "LeftLowerLeg", "LeftLeg", "mixamorigLeftLeg"],
  rHip: ["UpperLeg.R", "thigh_r", "RightUpperLeg", "RightUpLeg", "mixamorigRightUpLeg"],
  rKnee: ["LowerLeg.R", "calf_r", "RightLowerLeg", "RightLeg", "mixamorigRightLeg"],
};
const CHILD = { lShoulder: "lElbow", rShoulder: "rElbow" };

/**
 * @param {THREE.Object3D} root   the model, before it is scaled or placed
 * @param {object} [o]
 * @param {number} [o.fist=0]     curl the fingers into fists (radians per joint)
 */
export const createRig = (root, { fist = 0 } = {}) => {
  root.updateMatrixWorld(true);
  const bones = {};
  for (const name of JOINTS) {
    const bone = findBone(root, ...NAMES[name]);
    if (bone) bones[name] = bone;
  }

  for (const [arm, child] of Object.entries(CHILD)) {
    if (!bones[arm] || !bones[child]) continue;
    const a = bones[arm].getWorldPosition(new THREE.Vector3());
    const b = bones[child].getWorldPosition(new THREE.Vector3());
    const swing = new THREE.Quaternion().setFromUnitVectors(b.sub(a).normalize(), new THREE.Vector3(0, -1, 0));
    const world = bones[arm].getWorldQuaternion(new THREE.Quaternion());
    bones[arm].quaternion.multiply(world.clone().invert().multiply(swing).multiply(world));
    root.updateMatrixWorld(true);
  }

  const rest = {};
  for (const [name, bone] of Object.entries(bones)) {
    rest[name] = { local: bone.quaternion.clone(), world: bone.getWorldQuaternion(new THREE.Quaternion()), y: bone.position.y };
  }

  // Fists: every finger joint curled about its local z. A fight needs closed hands.
  if (fist) {
    root.traverse((o) => {
      if (!o.isBone || !/^(index|middle|ring|pinky)_0[123]_[lr]$/i.test(o.name)) return;
      const side = /_r$/i.test(o.name) ? -1 : 1;
      o.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), fist * side));
    });
  }

  const euler = new THREE.Euler();
  const delta = new THREE.Quaternion();
  const conj = new THREE.Quaternion();
  const apply = (pose) => {
    for (const [name, bone] of Object.entries(bones)) {
      const r = pose[name] ?? [0, 0, 0];
      delta.setFromEuler(euler.set(r[0], r[1], r[2]));
      const { local, world } = rest[name];
      conj.copy(world).invert().multiply(delta).multiply(world);
      bone.quaternion.copy(local).multiply(conj);
    }
    // `lift` is in figure units (hips at 0.95 of 1.85); scale it to this rig.
    if (bones.hips) bones.hips.position.y = rest.hips.y * (1 + (pose.lift ?? 0) / 0.95);
  };

  return { bones, apply };
};
