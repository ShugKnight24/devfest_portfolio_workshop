import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { inkMaterial, outline } from "./ink";
import { hash } from "./kit";

/**
 * Props — small set dressing shared by several scenes, built to measure so
 * the parts that must fit together do (stems inside a vase's mouth).
 *
 * Every builder takes `ink` (a material factory, `(opts) => material`; pass a
 * film world's `w.ink` so the palette reaches it) and `line` (the outline
 * material, `w.line`), and returns a Group with its base at y = 0.
 */

const defaultInk = (o) => inkMaterial({ spec: 0, ...o });
const UP = new THREE.Vector3(0, 1, 0);

const PALETTE = {
  glass: "#cfe3ea",
  ceramic: "#e7e0d2",
  water: "#9cc7d6",
  stem: "#4f8a3a",
  petal: "#f6f3ea",
  centre: "#f2b92a",
};

/**
 * One daisy head in its own frame, facing +y: a domed yellow centre and a
 * ring of white petals, cupped a little. Returns { petals, centre } geometries.
 */
const daisyHead = (size, petalsN, seed) => {
  const petals = [];
  const cR = size * 0.32;
  const len = size * 0.68;
  for (let i = 0; i < petalsN; i++) {
    const g = new THREE.SphereGeometry(1, 8, 5);
    g.scale(len / 2, size * 0.035, size * 0.13 * (0.9 + 0.2 * hash(seed + i)));
    // Out from the centre, tipped up into a shallow cup.
    g.translate(cR * 0.8 + len / 2, 0, 0);
    g.rotateZ(0.16 + 0.1 * hash(seed * 3 + i));
    g.rotateY((i / petalsN) * Math.PI * 2 + 0.2 * hash(seed + i * 7));
    petals.push(g);
  }
  const centre = new THREE.SphereGeometry(cR, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  centre.scale(1, 0.55, 1);
  return { petals: mergeGeometries(petals), centre };
};

/** Move a head built facing +y to `pos`, facing `dir`. */
const place = (geo, pos, dir) => geo.applyMatrix4(new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromUnitVectors(UP, dir), new THREE.Vector3(1, 1, 1)));

/**
 * A daisy cut for holding: stem from the origin up +y, the head on top facing
 * up and a little forward (+z). Base at y = 0, so it stands in a hand with
 *   fig.hold(createDaisy(), { grip: "pinch", offset: new THREE.Vector3(0, 0.05, 0) })
 */
export const createDaisy = ({ stemLength = 0.24, size = 0.05, stemRadius = 0.0032, palette = {}, ink = defaultInk, line = null, seed = 1 } = {}) => {
  const p = { ...PALETTE, ...palette };
  const g = new THREE.Group();
  g.name = "daisy";
  const top = new THREE.Vector3(0.006, stemLength, 0.012);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.004, stemLength * 0.5, 0.002), top]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, stemRadius, 6, false), ink({ tint: p.stem, tone: 0.65, rim: 0.4 }));
  const dir = curve.getTangent(1).add(new THREE.Vector3(0, 0.3, 0.5)).normalize();
  const head = daisyHead(size, 16, seed);
  const petals = new THREE.Mesh(place(head.petals, top, dir), ink({ tint: p.petal, tone: 0.98, rim: 0.3 }));
  const centre = new THREE.Mesh(place(head.centre, top, dir), ink({ tint: p.centre, tone: 0.95, rim: 0.3 }));
  g.add(stem, petals, centre);
  if (line) [stem, petals, centre].forEach((m) => outline(m, line));
  return g;
};

/**
 * A bud vase of daisies. The vase is a lathed bottle (glass or ceramic) with a
 * real wall and a water line; its mouth is sized for the bunch, and every
 * stem rises from inside the body, passes through the mouth inside its rim,
 * and fans out above it — so no stem ever cuts through the glass.
 *
 *   const vase = createDaisyVase({ count: 3, vaseHeight: 0.16, ink: w.ink, line: w.line });
 *   vase.position.copy(counterTop);   // base at y = 0
 *   vase.userData.mouth               // { y, radius } in the vase's frame
 *
 * @param {object} o
 * @param {number} [o.count=3]          daisies
 * @param {number} [o.vaseHeight=0.16]  in scene units (≈ metres)
 * @param {"glass"|"ceramic"} [o.kind="glass"]
 * @param {number} [o.stemLength]       above the mouth (default 1.4 × vaseHeight)
 * @param {number} [o.fan=0.38]         how far the heads lean out (radians)
 * @param {number} [o.headSize]         petal-tip diameter (default 0.33 × vaseHeight)
 * @param {object} [o.palette]          { glass, ceramic, water, stem, petal, centre }
 * @param {Function} [o.ink]            material factory, `(opts) => material`
 * @param {THREE.Material} [o.line]     outline material
 * @param {number} [o.seed=1]           varies lengths and lean
 */
export const createDaisyVase = ({ count = 3, vaseHeight = 0.16, kind = "glass", stemLength, fan = 0.38, headSize, palette = {}, ink = defaultInk, line = null, seed = 1 } = {}) => {
  const p = { ...PALETTE, ...palette };
  const h = vaseHeight;
  const g = new THREE.Group();
  g.name = "daisyVase";
  const stemR = Math.max(0.0022, 0.02 * h);
  const size = headSize ?? 0.33 * h;
  const above = stemLength ?? 1.4 * h;

  // The mouth: wide enough for the bunch to pass with room round each stem.
  const wall = Math.max(0.0025, 0.035 * h);
  const R = 0.3 * h; // the belly
  const packed = stemR * (1.3 + 1.5 * Math.sqrt(count));
  const mouthR = Math.min(0.85 * R, Math.max(0.42 * R, packed + wall + 0.15 * stemR));
  const inner = mouthR - wall;

  // Outside up from the base, over the lip, inside back down to the floor.
  const profile = [
    [0, 0],
    [0.78 * R, 0],
    [0.86 * R, 0.02 * h],
    [R, 0.3 * h],
    [0.92 * R, 0.52 * h],
    [Math.max(mouthR * 1.02, 0.62 * R), 0.68 * h],
    [mouthR, 0.86 * h],
    [mouthR * 1.12, h],
    [mouthR * 1.12 - wall, h],
    [inner, 0.86 * h],
    [Math.max(mouthR * 1.02, 0.62 * R) - wall, 0.68 * h],
    [0.92 * R - wall, 0.52 * h],
    [R - wall, 0.3 * h],
    [0.86 * R - wall, 0.03 * h + wall],
    [0, wall],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const vaseGeo = new THREE.LatheGeometry(profile, 36);
  vaseGeo.computeVertexNormals();
  const vase = new THREE.Mesh(vaseGeo, ink(kind === "glass" ? { tint: p.glass, tone: 0.95, rim: 0.9 } : { tint: p.ceramic, tone: 0.9, rim: 0.5 }));
  vase.material.side = THREE.DoubleSide;
  g.add(vase);
  if (line) outline(vase, line);

  // Water, just inside the neck.
  const waterY = 0.8 * h;
  const water = new THREE.Mesh(new THREE.CircleGeometry(inner + 0.004 * h, 28), ink({ tint: p.water, tone: 0.85, rim: 0.2 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterY;
  g.add(water);

  // Stems: a sunflower spread inside the mouth, each leaning out the way it sits.
  const mouthY = 0.86 * h; // the narrowest point of the neck
  const room = inner - stemR * 1.15;
  const stems = [];
  const petals = [];
  const centres = [];
  const heads = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : Math.sqrt((i + 0.5) / count);
    const az = i * golden + seed * 1.7;
    const rr = room * t;
    const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const pm = out.clone().multiplyScalar(rr).setY(mouthY);
    // From low in the body, straight up to the mouth: the stem stays inside the neck.
    const p0 = out.clone().multiplyScalar(rr * 0.5).setY(wall + 0.12 * h);
    const lean = (count === 1 ? 0.08 : fan * (0.35 + 0.65 * t)) + 0.08 * (hash(seed * 13 + i) - 0.5);
    const len = above * (0.82 + 0.18 * hash(seed * 7 + i));
    const dir = out.clone().multiplyScalar(Math.sin(lean)).setY(Math.cos(lean));
    const top = pm.clone().addScaledVector(dir, len);
    // Bend gently: the lean grows with height.
    const midA = pm.clone().addScaledVector(UP, len * 0.35).addScaledVector(out, Math.sin(lean) * len * 0.15);
    const curve = new THREE.CatmullRomCurve3([p0, pm.clone().addScaledVector(UP, -0.1 * h), pm, midA, top], false, "centripetal");
    stems.push(new THREE.TubeGeometry(curve, 28, stemR, 6, false));
    // Faces up, tipped only part of the way along the stem's lean: tipped all
    // the way out, an outer head stands on its edge and reads as lying sideways.
    const face = curve.getTangent(1).addScaledVector(UP, 1.1).normalize();
    const head = daisyHead(size * (0.9 + 0.2 * hash(seed + i * 5)), 16, seed * 31 + i);
    petals.push(place(head.petals, top, face));
    centres.push(place(head.centre, top, face));
    heads.push(top);
  }
  const stemMesh = new THREE.Mesh(mergeGeometries(stems), ink({ tint: p.stem, tone: 0.65, rim: 0.4 }));
  const petalMesh = new THREE.Mesh(mergeGeometries(petals), ink({ tint: p.petal, tone: 0.98, rim: 0.3 }));
  const centreMesh = new THREE.Mesh(mergeGeometries(centres), ink({ tint: p.centre, tone: 0.95, rim: 0.3 }));
  g.add(stemMesh, petalMesh, centreMesh);
  if (line) [stemMesh, petalMesh, centreMesh].forEach((m) => outline(m, line));

  g.userData.mouth = { y: mouthY, radius: mouthR, inner };
  g.userData.heads = heads;
  return g;
};
