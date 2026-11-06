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
 * "stamp" (for the reviewer), "vacuum" (a suction plate: how real cells pick
 * flat panels). `role` colour lights the joint rings and tool.
 *
 * Two ways to pose it. `reachFor` is the original planar solve: quick, and
 * close enough when the tool only has to be near something. `aim` is the full
 * six-axis solve (base yaw, shoulder, elbow, wrist roll, wrist pitch, tool
 * roll): the tool's contact point lands exactly on the target, pointing along
 * a given direction. Use it whenever the tool touches something.
 *
 * `detail` adds the hardware a real arm carries (axis motors, dressed cable
 * runs, base bolts, a status lamp). It is opt-in so scenes that restyle the
 * kit's meshes by shape keep seeing the meshes they expect.
 */

const UP = new THREE.Vector3(0, 1, 0);

export const createRobotArm = ({ materials, color, tool = "gripper", upper = 1.35, fore = 1.25, toolLength = 0.35, stampSize = 0.22, detail = false }) => {
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
  // Roll about the forearm first, then pitch: a spherical wrist.
  wrist.rotation.order = "YXZ";
  wrist.position.y = fore;
  elbow.add(wrist);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20), joint);
  wrist.add(flange);

  // Tool, pointing along the wrist's +y.
  const toolGroup = new THREE.Group();
  wrist.add(toolGroup);
  let tipLocal = toolLength * 0.9;
  let vacuumLamp = null;
  if (tool === "scanner") {
    tipLocal = toolLength * 0.81;
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, toolLength * 0.8, 24), dark);
    housing.position.y = toolLength * 0.4;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), glow);
    lens.position.y = toolLength * 0.81;
    lens.rotation.x = -Math.PI / 2;
    toolGroup.add(housing, lens);
  } else if (tool === "stamp") {
    tipLocal = toolLength * 0.91 + 0.002;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, toolLength * 0.5, 16), dark);
    neck.position.y = toolLength * 0.25;
    const head = new THREE.Mesh(new RoundedBoxGeometry(stampSize + 0.04, toolLength * 0.4, stampSize + 0.04, 2, 0.04), body);
    head.position.y = toolLength * 0.7;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(stampSize, stampSize), glow);
    face.position.y = toolLength * 0.91;
    face.rotation.x = -Math.PI / 2;
    toolGroup.add(neck, head, face);
  } else if (tool === "vacuum") {
    // Adapter, manifold plate, four bellows cups. The cup lips are the contact plane.
    const adapter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 20), dark);
    adapter.position.y = 0.05;
    vacuumLamp = new THREE.MeshBasicMaterial({ color: hdr(color, 0.4) });
    const lamp = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.012, 8, 32), vacuumLamp);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.y = 0.075;
    const plate = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.035, 0.24, 2, 0.012), body);
    plate.position.y = 0.118;
    toolGroup.add(adapter, lamp, plate);
    const cupGeo = new THREE.CylinderGeometry(0.042, 0.03, 0.05, 18, 1, true);
    const stemGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10);
    for (const [cx, cz] of [
      [-0.12, -0.075],
      [0.12, -0.075],
      [-0.12, 0.075],
      [0.12, 0.075],
    ]) {
      const stem = new THREE.Mesh(stemGeo, joint);
      stem.position.set(cx, 0.15, cz);
      const cup = new THREE.Mesh(cupGeo, dark);
      cup.position.set(cx, 0.185, cz);
      toolGroup.add(stem, cup);
    }
    tipLocal = 0.21;
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

  if (detail) {
    const cable = materials.cable ?? dark;
    const bolt = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const b = new THREE.Mesh(bolt, joint);
      b.position.set(Math.cos(a) * 0.42, 0.225, Math.sin(a) * 0.42);
      root.add(b);
    }
    // Axis motors: J1 on the turret's back, J2 and J3 opposite the glowing caps.
    const motor = (parent, r, len, x) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 20), dark);
      m.rotation.z = Math.PI / 2;
      m.position.x = x;
      m.castShadow = true;
      parent.add(m);
      const end = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.012, 20), joint);
      end.rotation.z = Math.PI / 2;
      end.position.x = x + Math.sign(x) * (len / 2 + 0.006);
      parent.add(end);
    };
    const j1 = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.26, 0.16, 2, 0.03), dark);
    j1.position.set(0, 0.24, -0.33);
    j1.castShadow = true;
    turret.add(j1);
    motor(shoulder, 0.11, 0.16, -0.26);
    motor(elbow, 0.08, 0.12, -0.24);
    // Cable runs, clamped to the side of each link.
    const run = (parent, len, x, z) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len * 0.86, 10), cable);
      c.position.set(x, len / 2, z);
      parent.add(c);
      const clampGeo = new THREE.TorusGeometry(0.036, 0.008, 6, 16);
      for (const f of [0.22, 0.5, 0.78]) {
        const k = new THREE.Mesh(clampGeo, joint);
        k.rotation.x = Math.PI / 2;
        k.position.set(x, len * f, z);
        parent.add(k);
      }
    };
    run(shoulder, upper, -0.15, -0.06);
    run(elbow, fore, -0.12, -0.05);
    const lampMat = new THREE.MeshBasicMaterial({ color: hdr(color, 2.2) });
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 14), lampMat);
    lamp.position.set(0.16, 0.46, -0.16);
    turret.add(lamp);
  }

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
    wrist.rotation.set(approach * 0.4, 0, 0);
    toolGroup.rotation.y = 0;
  };

  const dirLocal = new THREE.Vector3();
  const wristLocal = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const axisX = new THREE.Vector3();
  const axisZ = new THREE.Vector3();
  const upLocal = new THREE.Vector3();
  const tipCheck = new THREE.Vector3();

  /**
   * Six-axis pose: the tool's contact point lands on `target` (world), the
   * tool points along `dir` (world, unit), and, when given, the tool rolls so
   * a part held on it keeps `up` (world) as its up. Returns the miss in world
   * units: 0 unless the target is out of reach.
   */
  const aim = (target, dir, up = null) => {
    root.updateWorldMatrix(true, false);
    rootInv.copy(root.matrixWorld).invert();
    local.copy(target).applyMatrix4(rootInv);
    dirLocal.copy(dir).transformDirection(rootInv);
    // Wrist centre sits one tool length back from the contact point.
    wristLocal.copy(local).addScaledVector(dirLocal, -tipLocal);
    turret.rotation.y = Math.atan2(wristLocal.x, wristLocal.z);
    const d = Math.hypot(wristLocal.x, wristLocal.z);
    const h = wristLocal.y - (0.22 + shoulderY);
    const D = THREE.MathUtils.clamp(Math.hypot(d, h), 0.3, upper + fore - 0.001);
    const a1 = Math.atan2(h, d) + Math.acos(THREE.MathUtils.clamp((upper * upper + D * D - fore * fore) / (2 * upper * D), -1, 1));
    const a2 = Math.acos(THREE.MathUtils.clamp((upper * upper + fore * fore - D * D) / (2 * upper * fore), -1, 1));
    shoulder.rotation.x = Math.PI / 2 - a1;
    elbow.rotation.x = Math.PI - a2;
    // Express the tool direction in the forearm's frame, then roll and pitch to it.
    wrist.rotation.set(0, 0, 0);
    toolGroup.rotation.y = 0;
    elbow.getWorldQuaternion(tmpQ).invert();
    const d2 = dirLocal.copy(dir).applyQuaternion(tmpQ).normalize();
    wrist.rotation.set(Math.acos(THREE.MathUtils.clamp(d2.y, -1, 1)), Math.atan2(d2.x, d2.z), 0);
    if (up) {
      // Tool roll: a held part's up is the tool's -z.
      toolGroup.updateWorldMatrix(true, false);
      axisX.setFromMatrixColumn(toolGroup.matrixWorld, 0).normalize();
      axisZ.setFromMatrixColumn(toolGroup.matrixWorld, 2).normalize();
      upLocal.copy(up).addScaledVector(dir, -up.dot(dir)).normalize();
      toolGroup.rotation.y = Math.atan2(-upLocal.dot(axisX), -upLocal.dot(axisZ));
    }
    toolGroup.updateWorldMatrix(true, false);
    return tipCheck.set(0, tipLocal, 0).applyMatrix4(toolGroup.matrixWorld).distanceTo(target);
  };

  /** Open (1) or close (0) the gripper fingers; on a vacuum tool, 0 pulls suction. */
  const grip = (open) => {
    if (vacuumLamp) vacuumLamp.color.copy(hdr(color, open > 0.5 ? 0.4 : 3.2));
    toolGroup.children.forEach((c) => {
      if (c.userData.side) c.position.x = c.userData.side * (0.05 + open * 0.06);
    });
  };

  const tipWorld = (out = new THREE.Vector3()) => out.set(0, toolLength * 0.9, 0).applyMatrix4(toolGroup.matrixWorld);

  /** World point the tool touches with (cup lips, lens, stamp face). */
  const contactWorld = (out = new THREE.Vector3()) => out.set(0, tipLocal, 0).applyMatrix4(toolGroup.matrixWorld);

  return { root, reachFor, aim, grip, tipWorld, contactWorld, glow, tool: toolGroup, up: UP };
};
