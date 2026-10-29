import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hdr } from "./kit";

/**
 * An industrial robot arm: base, yawing turret, two links, and a tool, posed
 * by two-link inverse kinematics so the tool tip lands on a world point.
 * Industrial arms are hard-surface by nature, so procedural geometry is the
 * right fidelity here — no character modelling required.
 *
 * Tools: "scanner" (lens, for the investigator), "gripper" (for the builder),
 * "stamp" (for the reviewer). `role` colour lights the joint rings and tool.
 */

const UP = new THREE.Vector3(0, 1, 0);

export const createRobotArm = ({ materials, color, tool = "gripper", upper = 1.35, fore = 1.25, toolLength = 0.35 }) => {
  const { body, joint, dark } = materials;
  const glow = new THREE.MeshBasicMaterial({ color: hdr(color, 3) });
  const root = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.22, 32), dark);
  base.position.y = 0.11;
  base.castShadow = true;
  root.add(base);

  const turret = new THREE.Group();
  turret.position.y = 0.22;
  root.add(turret);
  const turretBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.42, 32), body);
  turretBody.position.y = 0.21;
  turretBody.castShadow = true;
  turret.add(turretBody);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.018, 8, 48), glow);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  turret.add(ring);

  const shoulderY = 0.55;
  const shoulder = new THREE.Group();
  shoulder.position.y = shoulderY;
  turret.add(shoulder);
  const hub = (parent, r) => {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.36, 24), joint);
    h.rotation.z = Math.PI / 2;
    h.castShadow = true;
    parent.add(h);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.014, 8, 32), glow);
    cap.rotation.y = Math.PI / 2;
    cap.position.x = 0.185;
    parent.add(cap);
  };
  hub(shoulder, 0.17);
  const upperLink = new THREE.Mesh(new RoundedBoxGeometry(0.22, upper, 0.26, 3, 0.06), body);
  upperLink.position.y = upper / 2;
  upperLink.castShadow = true;
  shoulder.add(upperLink);

  const elbow = new THREE.Group();
  elbow.position.y = upper;
  shoulder.add(elbow);
  hub(elbow, 0.13);
  const foreLink = new THREE.Mesh(new RoundedBoxGeometry(0.17, fore, 0.2, 3, 0.05), body);
  foreLink.position.y = fore / 2;
  foreLink.castShadow = true;
  elbow.add(foreLink);

  const wrist = new THREE.Group();
  wrist.position.y = fore;
  elbow.add(wrist);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20), joint);
  wrist.add(flange);

  // Tool, pointing along the wrist's +y.
  const toolGroup = new THREE.Group();
  wrist.add(toolGroup);
  if (tool === "scanner") {
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, toolLength * 0.8, 24), dark);
    housing.position.y = toolLength * 0.4;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), glow);
    lens.position.y = toolLength * 0.81;
    lens.rotation.x = -Math.PI / 2;
    toolGroup.add(housing, lens);
  } else if (tool === "stamp") {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, toolLength * 0.5, 16), dark);
    neck.position.y = toolLength * 0.25;
    const head = new THREE.Mesh(new RoundedBoxGeometry(0.26, toolLength * 0.4, 0.26, 2, 0.04), body);
    head.position.y = toolLength * 0.7;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), glow);
    face.position.y = toolLength * 0.91;
    face.rotation.x = -Math.PI / 2;
    toolGroup.add(neck, head, face);
  } else {
    const palm = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.1, 0.12, 2, 0.03), dark);
    palm.position.y = 0.08;
    toolGroup.add(palm);
    for (const s of [-1, 1]) {
      const finger = new THREE.Mesh(new RoundedBoxGeometry(0.04, toolLength * 0.75, 0.08, 2, 0.015), body);
      finger.position.set(s * 0.09, 0.08 + toolLength * 0.38, 0);
      finger.userData.side = s;
      toolGroup.add(finger);
    }
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), glow);
    tip.position.y = toolLength * 0.9;
    toolGroup.add(tip);
  }
  toolGroup.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  const reach = fore + toolLength;
  const local = new THREE.Vector3();
  const rootInv = new THREE.Matrix4();

  /**
   * Put the tool tip on `target` (world space). `approach` tilts the tool:
   * 0 keeps it in line with the forearm, 1 points it straight down.
   */
  const reachFor = (target, approach = 0.6) => {
    root.updateWorldMatrix(true, false);
    rootInv.copy(root.matrixWorld).invert();
    local.copy(target).applyMatrix4(rootInv);
    turret.rotation.y = Math.atan2(local.x, local.z);
    const d = Math.hypot(local.x, local.z);
    const h = local.y - (0.22 + shoulderY);
    const D = THREE.MathUtils.clamp(Math.hypot(d, h), 0.3, upper + reach - 0.01);
    const a1 = Math.atan2(h, d) + Math.acos(THREE.MathUtils.clamp((upper * upper + D * D - reach * reach) / (2 * upper * D), -1, 1));
    const a2 = Math.acos(THREE.MathUtils.clamp((upper * upper + reach * reach - D * D) / (2 * upper * reach), -1, 1));
    shoulder.rotation.x = Math.PI / 2 - a1;
    elbow.rotation.x = Math.PI - a2;
    wrist.rotation.x = approach * 0.4;
  };

  /** Open (1) or close (0) the gripper fingers. */
  const grip = (open) => {
    toolGroup.children.forEach((c) => {
      if (c.userData.side) c.position.x = c.userData.side * (0.05 + open * 0.06);
    });
  };

  const tipWorld = (out = new THREE.Vector3()) => out.set(0, toolLength * 0.9, 0).applyMatrix4(toolGroup.matrixWorld);

  return { root, reachFor, grip, tipWorld, glow, up: UP };
};
