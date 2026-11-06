import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hdr } from "./kit";

/**
 * Agents for the home page factory: the people-shaped part of the crew.
 *
 * - `createSupervisor`: the chief. Dark two-piece suit, white shirt, narrow
 *   black tie, black sunglasses, a coiled earpiece. He stands on the mezzanine
 *   with his hands behind his back, watching whatever is being built, and now
 *   and then lifts a hand to the earpiece.
 * - `createAgentBot`: a service robot on an omni-wheel base, visor face, two
 *   arms. Couriers, technicians and the intake clerk are all this one body.
 *
 * Both are procedural, so they share the scene's PBR materials and lights
 * (and the crew paint the viewer picks). Origin at the feet, facing +z.
 */

const capsuleBetween = (a, b, r, material) => {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  m.castShadow = true;
  return m;
};

const v = (x, y, z) => new THREE.Vector3(x, y, z);

const gauss = (d, w) => Math.exp(-((d / w) ** 2));

/**
 * Shape a unit-sphere point into an adult male head, in unit space, then
 * scale and place it. Forward is +z, up +y. Each term is one landmark: the
 * jaw narrowing to the chin, the occiput behind, a flatter face, the brow
 * ridge, cheekbones, the eye sockets under the brow, and a squared chin.
 */
const sculptUnit = (p) => {
  let { x, y, z } = p;
  if (y < 0) {
    const t = Math.min(1, -y);
    // A square jaw: the face narrows only below the jaw angle.
    x *= 1 - 0.34 * Math.max(0, t - 0.45) ** 1.2;
    if (z < 0) z *= 1 - 0.5 * t;
  }
  if (z < 0 && y > -0.3) z *= 1.1;
  if (z > 0.45) z = 0.45 + (z - 0.45) * 0.7;
  const front = Math.max(0, z);
  z += 0.07 * gauss(y - 0.32, 0.1) * front * (1 - x * x);
  x += Math.sign(x) * 0.06 * gauss(y + 0.05, 0.16) * gauss(Math.abs(x) - 0.62, 0.2) * front;
  z -= 0.05 * gauss(y - 0.1, 0.1) * gauss(Math.abs(x) - 0.4, 0.17) * front;
  z += 0.06 * gauss(y + 0.88, 0.14) * front * gauss(x, 0.35);
  y -= 0.06 * gauss(y + 0.9, 0.2) * front;
  return p.set(x, y, z);
};
const sculptPoint = (unit, { center, size }) => sculptUnit(unit.normalize()).multiply(size).add(center);
const sculptHead = (geometry, spec, tilt = 0) => {
  const pos = geometry.attributes.position;
  const p = new THREE.Vector3();
  const rot = new THREE.Matrix4().makeRotationX(tilt);
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(rot);
    sculptPoint(p, spec);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geometry.computeVertexNormals();
  return geometry;
};

/** A limb that bends at one joint: upper and lower segments under two groups. */
const limb = (parent, at, upperLen, lowerLen, r, material, end) => {
  const top = new THREE.Group();
  top.position.copy(at);
  parent.add(top);
  top.add(capsuleBetween(v(0, 0, 0), v(0, -upperLen, 0), r, material));
  const mid = new THREE.Group();
  mid.position.y = -upperLen;
  top.add(mid);
  mid.add(capsuleBetween(v(0, 0, 0), v(0, -lowerLen, 0), r * 0.88, material));
  const tip = new THREE.Group();
  tip.position.y = -lowerLen;
  mid.add(tip);
  if (end) tip.add(end);
  return { top, mid, tip };
};

export const createSupervisor = () => {
  const suit = new THREE.MeshPhysicalMaterial({ color: "#16181c", roughness: 0.62, metalness: 0.05, sheen: 0.6, sheenColor: new THREE.Color("#3a3f48"), sheenRoughness: 0.5 });
  const shirt = new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.55, side: THREE.DoubleSide });
  const tie = new THREE.MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
  const skin = new THREE.MeshPhysicalMaterial({ color: "#c99d82", roughness: 0.52, sheen: 0.4, sheenColor: new THREE.Color("#ffd2bf"), sheenRoughness: 0.6 });
  const hair = new THREE.MeshStandardMaterial({ color: "#2a1d15", roughness: 0.62, metalness: 0.02 });
  const shoe = new THREE.MeshPhysicalMaterial({ color: "#0a0a0b", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const lens = new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.04, metalness: 0.9, clearcoat: 1 });
  const wire = new THREE.MeshStandardMaterial({ color: "#d8dde2", roughness: 0.3, transparent: true, opacity: 0.85 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Legs and shoes.
  for (const s of [-1, 1]) {
    body.add(capsuleBetween(v(s * 0.1, 0.92, 0), v(s * 0.105, 0.12, 0.0), 0.078, suit));
    const sh = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.08, 0.27, 3, 0.035), shoe);
    sh.position.set(s * 0.105, 0.04, 0.05);
    sh.castShadow = true;
    body.add(sh);
  }

  // Jacket: a lathed torso, flattened front to back, hem flaring a touch at the hips.
  const profile = [
    [0.0, 0.82],
    [0.19, 0.82],
    [0.185, 0.95],
    [0.172, 1.06],
    [0.2, 1.24],
    [0.225, 1.4],
    [0.2, 1.47],
    [0.09, 1.52],
    [0.0, 1.53],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const jacket = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), suit);
  jacket.scale.set(1.12, 1, 0.68);
  jacket.castShadow = true;
  body.add(jacket);
  // Shoulder pads: a suit's square line.
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), suit);
    pad.scale.set(1.2, 0.55, 0.95);
    pad.position.set(s * 0.2, 1.445, 0);
    body.add(pad);
  }
  // Shirt V, tie and lapels, each wrapped onto the jacket's front surface.
  const radiusAt = (y) => {
    for (let i = 1; i < profile.length; i++) {
      const a = profile[i - 1];
      const b = profile[i];
      if (y <= b.y) return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / Math.max(1e-6, b.y - a.y));
    }
    return 0;
  };
  // A band between two edges x = left(y) and x = right(y), tessellated so it
  // can follow the curved chest rather than cut through it.
  const front = (y0, y1, left, right, material, lift) => {
    const rows = 16;
    const cols = 6;
    const pos = [];
    const idx = [];
    for (let i = 0; i <= rows; i++) {
      const y = THREE.MathUtils.lerp(y0, y1, i / rows);
      const r = radiusAt(y);
      for (let j = 0; j <= cols; j++) {
        const x = THREE.MathUtils.lerp(left(y), right(y), j / cols);
        const across = THREE.MathUtils.clamp(x / (r * 1.12), -1, 1);
        pos.push(x, y, r * 0.68 * Math.sqrt(1 - across * across) + lift);
      }
    }
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        const a0 = i * (cols + 1) + j;
        const b0 = a0 + cols + 1;
        idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    body.add(m);
    return m;
  };
  const piecewise = (pts) => (y) => {
    for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) return THREE.MathUtils.lerp(pts[i - 1][1], pts[i][1], (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts[pts.length - 1][1];
  };
  const vEdge = (y) => (0.075 * (y - 1.2)) / 0.3;
  front(1.2, 1.5, (y) => -vEdge(y), vEdge, shirt, 0.003);
  const tieHalf = piecewise([
    [1.19, 0],
    [1.22, 0.026],
    [1.47, 0.018],
  ]);
  front(1.19, 1.47, (y) => -tieHalf(y), tieHalf, tie, 0.006);
  // Lapels: outside the V, out to the collar, notch and roll line.
  const lapelOuter = piecewise([
    [1.2, 0.036],
    [1.375, 0.15],
    [1.4, 0.115],
    [1.45, 0.14],
    [1.5, 0.075],
  ]);
  const lapelMat = new THREE.MeshStandardMaterial({ color: "#0f1114", roughness: 0.4, side: THREE.DoubleSide });
  front(1.2, 1.5, (y) => -lapelOuter(y), (y) => -vEdge(y), lapelMat, 0.005);
  front(1.2, 1.5, vEdge, lapelOuter, lapelMat, 0.005);
  // Collar points.
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.06, 20, 1, true), shirt);
  collar.position.y = 1.535;
  body.add(collar);

  // Head: one sculpted skull (see `sculptHead`), so cranium, brow, cheekbones,
  // jaw and chin are a single surface rather than stacked primitives.
  const head = new THREE.Group();
  head.position.y = 1.56;
  body.add(head);
  head.add(capsuleBetween(v(0, -0.03, -0.005), v(0, 0.1, -0.01), 0.05, skin));
  const HEAD = { center: v(0, 0.158, 0.008), size: v(0.083, 0.12, 0.1) };
  const skull = new THREE.Mesh(sculptHead(new THREE.SphereGeometry(1, 48, 40), HEAD), skin);
  skull.castShadow = true;
  head.add(skull);
  const at = (ux, uy, uz) => sculptPoint(v(ux, uy, uz), HEAD);
  // Nose: bridge, tip, and the two wings of the nostrils.
  const bridgeTop = at(0, 0.12, 1);
  const tipPoint = at(0, -0.26, 1).add(v(0, 0, 0.017));
  head.add(capsuleBetween(bridgeTop.clone().add(v(0, 0, -0.006)), tipPoint, 0.0075, skin));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 14, 10), skin);
  tip.position.copy(tipPoint).add(v(0, -0.004, -0.002));
  head.add(tip);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), skin);
    wing.position.copy(at(s * 0.14, -0.32, 1)).add(v(0, 0, 0.004));
    head.add(wing);
  }
  // Lips: a thin upper, a fuller lower, closed in a level line.
  const lip = new THREE.MeshStandardMaterial({ color: "#b4806c", roughness: 0.5 });
  const mouth = at(0, -0.6, 1);
  const upper = capsuleBetween(v(-0.017, 0, 0), v(0.017, 0, 0), 0.0034, lip);
  upper.position.copy(mouth).add(v(0, 0.003, -0.001));
  const lower = capsuleBetween(v(-0.014, 0, 0), v(0.014, 0, 0), 0.0042, lip);
  lower.position.copy(mouth).add(v(0, -0.005, -0.002));
  head.add(upper, lower);
  // Brows, set low and level over the glasses.
  for (const s of [-1, 1]) {
    const brow = capsuleBetween(v(-0.017, 0, 0), v(0.017, 0.002 * s, 0), 0.0045, hair);
    brow.position.copy(at(s * 0.4, 0.3, 1)).add(v(0, 0, 0.006));
    brow.rotation.y = s * 0.25;
    head.add(brow);
  }
  // Ears, flat against the skull, with a darker bowl.
  const earBowl = new THREE.MeshStandardMaterial({ color: "#a87e66", roughness: 0.6 });
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), skin);
    ear.scale.set(0.32, 1, 0.62);
    ear.position.copy(at(s * 1, 0.02, -0.12)).add(v(s * 0.004, 0, 0));
    ear.rotation.y = s * 0.2;
    head.add(ear);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), earBowl);
    bowl.scale.set(0.3, 1, 0.6);
    bowl.position.copy(ear.position).add(v(s * 0.007, 0, 0.002));
    head.add(bowl);
  }
  // Hair: short, combed back, cut close over the ears. Same sculpt, a hair's width out.
  const cap = new THREE.Mesh(sculptHead(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), { ...HEAD, size: HEAD.size.clone().multiplyScalar(1.04) }, -0.5), hair);
  head.add(cap);
  // Sunglasses: two black lenses on the brow line, a bridge, temples back to the ears.
  const eyes = at(0, 0.1, 1);
  const lensGeo = new RoundedBoxGeometry(0.05, 0.03, 0.008, 3, 0.009);
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(lensGeo, lens);
    l.position.copy(at(s * 0.42, 0.1, 1)).add(v(0, 0, 0.016));
    l.rotation.y = s * 0.18;
    head.add(l);
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.005, 0.1), lens);
    temple.position.set(s * 0.079, eyes.y + 0.004, eyes.z - 0.055);
    head.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.004, 0.004), lens);
  bridge.position.copy(eyes).add(v(0, 0.008, 0.02));
  head.add(bridge);
  // Earpiece: the bud in the right ear, the coil running down into the collar.
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), wire);
  bud.position.copy(at(-1, 0.0, -0.1)).add(v(-0.008, 0, 0.004));
  head.add(bud);
  const coilPts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    coilPts.push(v(bud.position.x + 0.004 + Math.cos(t * 40) * 0.005 + t * 0.025, bud.position.y - 0.01 - t * 0.16, bud.position.z - 0.015 + Math.sin(t * 40) * 0.005 - t * 0.02));
  }
  head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 120, 0.0025, 5), wire));

  // Arms: hands clasped behind the back by default.
  const hand = () => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), skin);
    h.scale.set(0.8, 1.15, 0.6);
    h.position.y = -0.04;
    return h;
  };
  const arms = [-1, 1].map((s) => {
    const a = limb(body, v(s * 0.24, 1.43, 0), 0.3, 0.28, 0.058, suit, hand());
    // White cuff at the wrist.
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.025, 14), shirt);
    cuff.position.y = 0.012;
    a.tip.add(cuff);
    return { ...a, s };
  });

  // Behind the back: upper arms swing back, forearms fold in across the spine.
  const rest = [0.38, 0.1, 0.25, 1.4];
  const pose = (side, [sx, sz, ex, ez]) => {
    const a = arms[side];
    a.top.rotation.set(sx, 0, a.s * sz);
    a.mid.rotation.set(ex, 0, -a.s * ez);
  };
  // Taking a call: two-bone IK puts two fingers on the earpiece wherever his
  // head is turned, elbow out to the side and a little forward.
  const DOWN_Y = v(0, -1, 0);
  const UPPER = 0.3;
  const FORE = 0.28;
  const ear = bud.position.clone().add(v(-0.028, -0.05, 0.03));
  const ik = { ear: v(0, 0, 0), to: v(0, 0, 0), pole: v(0, 0, 0), elbow: v(0, 0, 0), dir: v(0, 0, 0), q: new THREE.Quaternion(), restTop: new THREE.Quaternion(), restMid: new THREE.Quaternion() };
  const reachEar = (a, t) => {
    // The rest pose, as quaternions, to blend from.
    pose(arms.indexOf(a), rest);
    ik.restTop.copy(a.top.quaternion);
    ik.restMid.copy(a.mid.quaternion);
    head.updateMatrix();
    ik.ear.copy(ear).applyMatrix4(head.matrix);
    ik.to.subVectors(ik.ear, a.top.position);
    const d = THREE.MathUtils.clamp(ik.to.length(), 0.1, UPPER + FORE - 0.002);
    ik.to.normalize();
    const cosA = (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    ik.pole.set(a.s * 0.55, -1, 0.75);
    ik.pole.addScaledVector(ik.to, -ik.pole.dot(ik.to)).normalize();
    ik.elbow.copy(ik.to).multiplyScalar(cosA).addScaledVector(ik.pole, sinA);
    ik.q.setFromUnitVectors(DOWN_Y, ik.elbow);
    a.top.quaternion.copy(ik.restTop).slerp(ik.q, t);
    // Forearm: from the elbow to the ear, in the upper arm's frame.
    ik.dir.copy(ik.to).multiplyScalar(d).sub(ik.elbow.multiplyScalar(UPPER)).normalize();
    ik.dir.applyQuaternion(ik.q.invert());
    ik.q.setFromUnitVectors(DOWN_Y, ik.dir);
    a.mid.quaternion.copy(ik.restMid).slerp(ik.q, t);
  };
  /**
   * `look` is a world point to watch; `earpiece` 0..1 lifts his right hand
   * to the ear, and he dips his head toward it to listen.
   */
  const target = new THREE.Vector3();
  const headLocal = new THREE.Vector3();
  let pitch = 0;
  const update = (time, look, earpiece = 0) => {
    body.position.y = Math.sin(time * 1.3) * 0.003;
    if (look) {
      root.updateWorldMatrix(true, false);
      headLocal.copy(target.copy(look)).applyMatrix4(root.matrixWorld.clone().invert()).sub(head.position);
      head.rotation.y = THREE.MathUtils.clamp(Math.atan2(headLocal.x, headLocal.z), -0.6, 0.6);
      pitch = THREE.MathUtils.clamp(-Math.atan2(headLocal.y, Math.hypot(headLocal.x, headLocal.z)), -0.5, 0.4);
    }
    head.rotation.x = pitch + earpiece * 0.12;
    head.rotation.z = -earpiece * 0.1;
    pose(1, rest);
    // His right hand (-x) to the ear.
    if (earpiece > 0.001) reachEar(arms[0], earpiece);
    else pose(0, rest);
  };
  root.traverse((o) => o.isMesh && (o.castShadow = true));
  return { root, update, head };
};

/**
 * A service robot, about 1.3 tall. `paint` is the shell (share the crew's to
 * follow the viewer's paint pick); `color` lights the visor, chest and wheel ring.
 */
export const createAgentBot = ({ paint, trim, dark, color = "#00e5ff", carry = false }) => {
  const glow = new THREE.MeshBasicMaterial({ color: hdr(color, 2.4) });
  const visorGlass = new THREE.MeshPhysicalMaterial({ color: "#07090c", roughness: 0.08, metalness: 0.6, clearcoat: 1 });
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.2, 28), dark);
  skirt.position.y = 0.12;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 8, 40), glow);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  root.add(skirt, ring);
  const wheels = [0, 1, 2].map((i) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14), trim);
    const a = (i / 3) * Math.PI * 2;
    w.rotation.z = Math.PI / 2;
    w.rotation.y = a;
    w.position.set(Math.sin(a) * 0.17, 0.05, Math.cos(a) * 0.17);
    root.add(w);
    return w;
  });

  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 16), trim);
  spine.position.y = 0.32;
  body.add(spine);
  const torso = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.44, 0.28, 4, 0.1), paint);
  torso.position.y = 0.64;
  body.add(torso);
  const chest = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.05, 0.02, 2, 0.01), glow);
  chest.position.set(0, 0.72, 0.142);
  body.add(chest);
  const vent = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.12, 0.02, 2, 0.01), dark);
  vent.position.set(0, 0.56, 0.138);
  body.add(vent);

  const head = new THREE.Group();
  head.position.y = 0.9;
  body.add(head);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12), trim);
  neck.position.y = 0.03;
  head.add(neck);
  const skull = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.24, 0.26, 4, 0.09), paint);
  skull.position.y = 0.18;
  head.add(skull);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(0.27, 0.12, 0.04, 3, 0.04), visorGlass);
  visor.position.set(0, 0.19, 0.12);
  head.add(visor);
  const eyes = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), glow);
    e.position.set(s * 0.06, 0.195, 0.142);
    head.add(e);
    return e;
  });
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), trim);
  antenna.position.set(0.09, 0.36, -0.03);
  const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), glow);
  tipBall.position.set(0.09, 0.425, -0.03);
  head.add(antenna, tipBall);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 18), trim);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(s * 0.165, 0.18, 0);
    head.add(ear);
  }

  const clamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), trim);
  const arms = [-1, 1].map((s) => {
    const a = limb(body, v(s * 0.25, 0.8, 0), 0.2, 0.2, 0.038, trim, clamp.clone());
    return { ...a, s };
  });
  const shoulderCaps = [-1, 1].map((s) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), paint);
    c.position.set(s * 0.24, 0.8, 0);
    body.add(c);
    return c;
  });

  let crate = null;
  if (carry) {
    crate = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.22, 0.3, 2, 0.02), new THREE.MeshStandardMaterial({ color: "#23476e", roughness: 0.55 }));
    crate.position.set(0, 0.55, 0.33);
    crate.castShadow = true;
    body.add(crate);
  }

  /**
   * `speed` (units/s) rolls the wheels and leans the body; `armsUp` 0..1
   * raises both forearms forward (carrying, presenting); `scan` 0..1 pulses
   * the eyes.
   */
  const update = (time, { speed = 0, armsUp = carry ? 1 : 0, scan = 0, lookYaw = 0, lookPitch = 0 } = {}) => {
    wheels.forEach((w) => (w.rotation.x = time * speed * 8));
    body.rotation.x = THREE.MathUtils.clamp(speed * 0.06, -0.12, 0.12);
    body.position.y = Math.abs(Math.sin(time * 6)) * 0.008 * Math.min(1, Math.abs(speed));
    arms.forEach((a) => {
      a.top.rotation.set(-0.15 - armsUp * 0.7, 0, a.s * 0.12);
      a.mid.rotation.set(-0.25 - armsUp * 0.85, 0, 0);
    });
    head.rotation.set(lookPitch, lookYaw, 0);
    const pulse = 1 + scan * (0.5 + 0.5 * Math.sin(time * 14));
    eyes.forEach((e) => e.scale.setScalar(pulse));
  };

  root.traverse((o) => o.isMesh && (o.castShadow = true));
  void shoulderCaps;
  return { root, update, head, glow, crate };
};
