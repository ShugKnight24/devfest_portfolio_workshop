import * as THREE from "three";
import { lerp } from "./kit";
import { outline } from "./ink";

/**
 * Pochita, from his model sheet: a soft orange bean of a body that is mostly
 * head, darker underneath and on the haunches, four stubby legs with little
 * toes, big round white eyes with large black pupils, a small ω mouth that
 * opens on tiny fangs, the chainsaw bar straight out of his forehead (end-on
 * from the front it is a thin blade between the eyes), the black D-handle
 * arching over his head, the rear grip at his back, and a thin black tail with
 * a triangle tip.
 *
 * Pup space: nose to +z, feet on y = 0, about 1.7 tall to the top of the head
 * and 2.2 to the top of the handle. `size` scales all of it (metres, say).
 * `hurt` adds blood on his flank and chin.
 *
 * Returns { pup, body, bean, eyes, legs, mouth, cavity, tongue, upper, lower,
 * bead, tail, wounds, back, handle, saw, setMouth, setEyes }. `body` holds
 * everything (scale it to breathe, rotate it to tilt him); each of `eyes` is a
 * group with `lid`, `pupil` and `glint`; `setMouth(k)` opens the jaw 0..1,
 * `setEyes(k)` opens the eyes (0 shut to a line).
 */

export const POCHITA_ORANGE = "#e8722a";
export const POCHITA_SHADE = "#c4571c";

const BAR_LEN = 1.5;
const BAR_R = 0.25;
const PERIM = 2 * BAR_LEN + 2 * Math.PI * BAR_R;
const TEETH = 30;
const onBar = (s) => {
  const d = ((s % PERIM) + PERIM) % PERIM;
  if (d < BAR_LEN) return [d, BAR_R, 0];
  if (d < BAR_LEN + Math.PI * BAR_R) {
    const a = (d - BAR_LEN) / BAR_R;
    return [BAR_LEN + Math.sin(a) * BAR_R, Math.cos(a) * BAR_R, -a];
  }
  if (d < 2 * BAR_LEN + Math.PI * BAR_R) return [BAR_LEN - (d - BAR_LEN - Math.PI * BAR_R), -BAR_R, Math.PI];
  const a = (d - 2 * BAR_LEN - Math.PI * BAR_R) / BAR_R;
  return [-Math.sin(a) * BAR_R, -Math.cos(a) * BAR_R, Math.PI - a];
};
const barShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, -BAR_R);
  shape.lineTo(BAR_LEN, -BAR_R);
  shape.absarc(BAR_LEN, 0, BAR_R, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(0, BAR_R);
  shape.absarc(0, 0, BAR_R, Math.PI / 2, (Math.PI * 3) / 2, false);
  return shape;
};

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** A flat black strip along a curve: a tube widened across `wide` (x or z). */
const strap = (points, radius, wide, k = 1.7) => {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  const geo = new THREE.TubeGeometry(curve, 64, radius, 10);
  geo.scale(wide === "x" ? k : 1, 1, wide === "z" ? k : 1);
  return geo;
};

export const buildPochita = (w, { size = 1, hurt = false, blood = "#8e0d14" } = {}) => {
  const fur = w.ink({ tint: POCHITA_ORANGE, tone: 0.97, rim: 0.5 });
  const furShade = w.ink({ tint: POCHITA_SHADE, tone: 0.9, rim: 0.4 });
  const steel = w.ink({ tint: "#c9cbcf", tone: 1.0, rim: 0.4, spec: 0.8 });
  const rubber = w.ink({ tint: "#232022", tone: 0.6, rim: 0.5 });
  const white = w.ink({ tint: "#f4f0e8", tone: 1.0, rim: 0.2 });
  const tongueMat = w.ink({ tint: "#d9505a", tone: 0.85, rim: 0.2 });
  const bloodMat = w.ink({ tint: blood, tone: 0.8, rim: 0.3, spec: 0.6 });
  const add = (parent, geometry, material, line = true) => {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };

  const pup = new THREE.Group();
  const sizer = new THREE.Group();
  sizer.scale.setScalar(size);
  pup.add(sizer);
  const body = new THREE.Group();
  sizer.add(body);

  // The bean: round, a little fuller low down, the head end (+z) domed.
  const beanGeo = new THREE.SphereGeometry(1, 48, 36);
  const p = beanGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    x *= 0.8 * (1 + 0.16 * Math.max(0, -y));
    y *= 0.88;
    if (y > 0) y *= 1 - Math.max(0, -z) * 0.3;
    if (y > 0) y *= 1 + Math.max(0, z) * 0.08;
    if (y < -0.55) y = -0.55 - (y + 0.55) * 0.45;
    z *= 1.02;
    p.setXYZ(i, x, y, z);
  }
  beanGeo.computeVertexNormals();
  const bean = add(body, beanGeo, fur);
  bean.position.y = 0.8;
  // Darker underneath: a flat belly patch the bean sits in.
  const belly = add(body, new THREE.SphereGeometry(1, 32, 16), furShade, false);
  belly.scale.set(0.74, 0.2, 0.86);
  belly.position.set(0, 0.36, 0);

  // Stubby legs, each with a round paw and three toes.
  const paw = (parent, mat) => {
    const g = new THREE.Group();
    parent.add(g);
    const pad = add(g, new THREE.SphereGeometry(1, 20, 12), mat);
    pad.scale.set(0.18, 0.08, 0.22);
    for (const tx of [-0.09, 0, 0.09]) {
      const toe = add(g, new THREE.SphereGeometry(0.055, 12, 8), mat);
      toe.scale.set(1, 0.8, 1);
      toe.position.set(tx, 0.005, 0.18);
    }
    return g;
  };
  const legs = [];
  [-1, 1].forEach((side) => {
    const front = new THREE.Group();
    front.position.set(side * 0.38, 0.32, 0.5);
    body.add(front);
    const leg = add(front, new THREE.CapsuleGeometry(0.17, 0.1, 6, 14), fur);
    leg.position.y = -0.12;
    paw(front, fur).position.set(0, -0.25, 0.05);
    const haunch = add(body, new THREE.SphereGeometry(1, 28, 20), furShade);
    haunch.scale.set(0.27, 0.36, 0.4);
    haunch.position.set(side * 0.6, 0.38, -0.4);
    const hind = new THREE.Group();
    hind.position.set(side * 0.6, 0.2, -0.3);
    body.add(hind);
    paw(hind, furShade).position.set(0, -0.12, 0.04);
    legs.push(front, hind);
  });

  // Eyes: big and round, set on the front of the face either side of the bar,
  // white with a large black pupil and a catchlight. They shut to a line.
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.42, 1.02, 0.83);
    eye.quaternion.setFromUnitVectors(v3(0, 0, 1), v3(side * 0.6, 0.25, 0.76).normalize());
    body.add(eye);
    const lid = new THREE.Group();
    eye.add(lid);
    const ring = add(lid, new THREE.SphereGeometry(0.27, 32, 20), white);
    ring.scale.set(1, 1, 0.36);
    const pupil = add(lid, new THREE.SphereGeometry(0.19, 28, 18), w.flat, false);
    pupil.scale.set(1, 1, 0.45);
    pupil.position.set(-side * 0.02, -0.01, 0.06);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff6ea").multiplyScalar(0.85) }));
    glint.position.set(0.06, 0.07, 0.15);
    lid.add(glint);
    Object.assign(eye, { lid, pupil, glint });
    return eye;
  });

  // The muzzle: two round lobes (the ω), and the mouth under them.
  [-1, 1].forEach((side) => {
    const lobe = add(body, new THREE.SphereGeometry(0.17, 24, 16), fur);
    lobe.scale.set(1, 0.8, 0.85);
    lobe.position.set(side * 0.13, 0.8, 0.98);
  });
  const mouth = new THREE.Group();
  mouth.position.set(0, 0.64, 0.99);
  mouth.rotation.x = -0.25;
  body.add(mouth);
  const cavity = add(mouth, new THREE.SphereGeometry(1, 24, 12), w.flat, false);
  const tongue = add(mouth, new THREE.SphereGeometry(1, 16, 10), tongueMat, false);
  tongue.scale.set(0.09, 0.03, 0.05);
  const toothGeo = new THREE.ConeGeometry(0.024, 0.075, 4);
  const upper = [];
  const lower = [];
  for (let i = 0; i < 5; i++) {
    const t = add(mouth, toothGeo, white, false);
    t.rotation.x = Math.PI;
    t.userData.x = -0.1 + i * 0.05;
    upper.push(t);
  }
  for (let i = 0; i < 4; i++) {
    const t = add(mouth, toothGeo, white, false);
    t.userData.x = -0.075 + i * 0.05;
    lower.push(t);
  }
  const bead = add(mouth, new THREE.SphereGeometry(0.035, 12, 8), bloodMat, false);
  bead.visible = false;
  const setMouth = (k) => {
    const h = lerp(0.015, 0.12, k);
    cavity.scale.set(0.16, h, 0.08);
    tongue.visible = k > 0.25;
    tongue.position.set(0, -h * 0.55, 0.02);
    upper.forEach((t) => {
      t.position.set(t.userData.x, h * 0.75, 0.05);
      t.visible = k > 0.05;
    });
    lower.forEach((t) => {
      t.position.set(t.userData.x, -h * 0.75, 0.05);
      t.visible = k > 0.15;
    });
    bead.position.set(0, -h * 0.3, 0.03);
  };
  const setEyes = (k) => {
    eyes.forEach(({ lid, glint }) => {
      lid.scale.set(1, Math.max(0.08, k), 1);
      glint.visible = k > 0.5;
    });
  };

  // The bar: out of the forehead, forward and a little up.
  const saw = new THREE.Group();
  saw.position.set(0, 1.18, 0.8);
  const fwd = v3(0, 0.4, 0.92).normalize();
  const up = v3(0, 0.92, -0.4).normalize();
  saw.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, up, new THREE.Vector3().crossVectors(fwd, up)));
  body.add(saw);
  const bar = add(saw, new THREE.ExtrudeGeometry(barShape(), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 20 }), steel);
  bar.position.z = -0.035;
  const rail = add(saw, new THREE.ExtrudeGeometry(barShape(), { depth: 0.06, bevelEnabled: false, curveSegments: 20 }), rubber, false);
  rail.scale.set(1.03, 1.14, 1);
  rail.position.z = -0.03;
  const spikeGeo = new THREE.ConeGeometry(0.045, 0.13, 4);
  spikeGeo.translate(0, 0.075, 0);
  const teeth = new THREE.InstancedMesh(spikeGeo, rubber, TEETH);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < TEETH; i++) {
    const [x, y, a] = onBar((i / TEETH) * PERIM);
    dummy.position.set(x, y, 0);
    dummy.rotation.set(0, 0, a);
    dummy.updateMatrix();
    teeth.setMatrixAt(i, dummy.matrix);
  }
  saw.add(teeth);

  // The D-handle: a flat black hoop across his head, both feet sunk in the
  // top of the bean, square-shouldered at the top.
  const handle = add(
    body,
    strap(
      [v3(-0.56, 1.25, 0), v3(-0.62, 1.7, 0), v3(-0.6, 2.06, 0), v3(-0.44, 2.18, 0), v3(0, 2.2, 0), v3(0.44, 2.18, 0), v3(0.6, 2.06, 0), v3(0.62, 1.7, 0), v3(0.56, 1.25, 0)],
      0.085,
      "z",
      1.9,
    ),
    rubber,
  );
  handle.position.z = -0.12;

  // The rear grip: a black loop standing off his back.
  add(
    body,
    strap([v3(0, 1.28, -0.72), v3(0, 1.36, -1.08), v3(0, 1.18, -1.28), v3(0, 0.78, -1.3), v3(0, 0.52, -1.12), v3(0, 0.5, -0.86)], 0.075, "x", 1.8),
    rubber,
  );

  // The tail: a thin black line up off his rump to a triangle tip, on a pivot so it can wag.
  const tail = new THREE.Group();
  tail.position.set(0, 1.42, -0.62);
  body.add(tail);
  const cord = new THREE.CatmullRomCurve3([v3(0, 0, 0), v3(0, 0.22, -0.2), v3(0, 0.46, -0.22), v3(0, 0.62, -0.12)]);
  add(tail, new THREE.TubeGeometry(cord, 20, 0.035, 8), rubber);
  const tri = add(tail, new THREE.TorusGeometry(0.11, 0.035, 6, 3), rubber);
  tri.rotation.set(0, Math.PI / 2, Math.PI / 2);
  tri.position.set(0, 0.74, -0.08);

  // Where a hand pets him: the top of his back, behind the handle.
  const back = new THREE.Object3D();
  back.position.set(0, 1.6, -0.45);
  body.add(back);

  const wounds = hurt
    ? [
        [0.62, 0.95, -0.1, 0.22],
        [0.5, 0.55, 0.45, 0.14],
        [-0.4, 1.35, -0.3, 0.16],
      ].map(([x, y, z, r]) => {
        const m = add(body, new THREE.SphereGeometry(1, 14, 10), bloodMat, false);
        m.position.set(x, y, z);
        m.lookAt(m.position.clone().multiplyScalar(2).setY(m.position.y * 2 - 0.8));
        m.scale.set(r, r * 0.8, 0.04);
        return m;
      })
    : [];

  setMouth(0);
  setEyes(1);
  return { pup, body, bean, eyes, legs, mouth, cavity, tongue, upper, lower, bead, tail, wounds, back, handle, saw, setMouth, setEyes };
};
