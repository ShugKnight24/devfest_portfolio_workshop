import * as THREE from "three";
import { attachSkinned, fitHeight, inkify, loadModel } from "./models";
import { createRig } from "./retarget";

/**
 * A modelled human with the capsule figure's API — `{ root, model,
 * apply(pose), bones }` — so scenes pose it with figure.js's library. The body
 * is Quaternius's Superhero base, male or female (`body`, CC0); hair and brows
 * are bound to its bones; `horns` turns it into a devil.
 *
 * Pass `ink` to draw it on the page, or a `material` to draw it as light (the
 * red pre-visualisation ghost, the white bystanders). `outfit` paints clothes
 * onto the bare base body (see paintOutfit).
 */

const url = (name) => `/models/quaternius/${name}.glb`;

/**
 * Clothes, painted as vertex colours by region of the T-posed bind shape: the
 * head stays skin, the torso takes the top (with an optional collar, tie and
 * belt), the arms the sleeves to `sleeves` (none, short, rolled, long) and
 * `arms` past them (skin, or gloves), the legs the bottom or a skirt over
 * skin and stockings, the feet shoes with an optional trim. Each figure gets
 * its own copy of the geometry — clones share it otherwise.
 */
const SLEEVE_END = { none: 0.12, short: 0.22, rolled: 0.29, long: 0.37 };
const paintOutfit = (model, o) => {
  const { sleeves = "short", skirt = 0, stockingsTop = 0 } = o;
  const color = (v, fallback) => new THREE.Color(v ?? fallback);
  const c = {
    skin: color(o.skin, "#e9c7a8"),
    top: color(o.top, "#f1ece2"),
    bottom: color(o.bottom, "#1d2230"),
    shoes: color(o.shoes, "#141414"),
    hair: color(o.hair, "#1b1b1b"),
  };
  c.sleeve = color(o.sleeve, o.top ?? "#f1ece2");
  c.arms = color(o.arms, o.skin ?? "#e9c7a8");
  c.collar = o.collar ? color(o.collar) : null;
  c.tie = o.tie ? color(o.tie) : null;
  c.belt = o.belt ? color(o.belt) : null;
  c.trim = o.trim ? color(o.trim) : null;
  c.stockings = o.stockings ? color(o.stockings) : null;

  const meshes = [];
  model.traverse((m) => m.isMesh && meshes.push(m));
  const body = meshes.reduce((a, b) => (b.geometry.attributes.position.count > a.geometry.attributes.position.count ? b : a));
  body.geometry.computeBoundingBox();
  const { min, max } = body.geometry.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  // Which way is front: the toes reach further forward from the ankle than the heel does back.
  const bp = body.geometry.attributes.position;
  let sole = 0;
  let ankle = 0;
  let ns = 0;
  let na = 0;
  for (let i = 0; i < bp.count; i++) {
    const ny = (bp.getY(i) - min.y) / H;
    if (ny < 0.015) (sole += bp.getZ(i)), ns++;
    else if (ny > 0.05 && ny < 0.07) (ankle += bp.getZ(i)), na++;
  }
  const front = Math.sign(sole / Math.max(1, ns) - ankle / Math.max(1, na)) || 1;
  const WAIST = 0.575;

  const radial = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const mesh of meshes) {
    mesh.geometry = mesh.geometry.clone();
    const pos = mesh.geometry.attributes.position;
    const nor = mesh.geometry.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      let col = c.hair;
      // Cloth hides the sculpt: under clothes, the normal leans toward a plain
      // cylinder round the torso, leg or arm, so pecs and abs stop shading through.
      let cloth = null;
      if (mesh === body) {
        const x = pos.getX(i) - cx;
        const y = pos.getY(i);
        const z = pos.getZ(i) - cz;
        const ny = (y - min.y) / H;
        const ax = Math.abs(x) / H;
        const facing = z * front > 0;
        const arm = ax > 0.12 && ny > 0.7;
        if (ny > 0.835 && !arm) col = c.skin; // head and neck
        else if (arm) {
          const sleeve = ax <= SLEEVE_END[sleeves];
          col = sleeve ? c.sleeve : c.arms;
          if (sleeve) cloth = radial.set(0, y - (min.y + 0.8 * H), z);
        } else if (ny > WAIST) {
          col = c.top;
          if (c.collar && ny > 0.74 && ax < 0.05 && facing) col = c.collar;
          if (c.tie && ny > 0.62 && ny < 0.82 && ax < 0.016 && facing) col = c.tie;
          if (c.belt && ny < WAIST + 0.022) col = c.belt;
          cloth = radial.set(x, 0, z);
        } else if (ny > WAIST - skirt) {
          col = c.bottom; // a skirt stops above the knee
          cloth = radial.set(x, 0, z);
        } else if (ny > 0.06) {
          if (skirt) col = c.stockings && ny < stockingsTop ? c.stockings : c.skin;
          else {
            col = c.bottom;
            cloth = radial.set(x - Math.sign(x) * 0.09 * H, 0, z);
          }
        } else col = c.trim && ny > 0.042 ? c.trim : c.shoes;
      }
      colors.set([col.r, col.g, col.b], i * 3);
      if (cloth && nor && cloth.lengthSq() > 1e-8) {
        n.fromBufferAttribute(nor, i).lerp(cloth.normalize(), 0.7).normalize();
        nor.setXYZ(i, n.x, n.y, n.z);
      }
    }
    mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
};

export const createModelFigure = async ({ body = "SuperheroMale", height = 1.85, ink = {}, line, material, hair = [], horns = false, fist = 1.3, outfit = null }) => {
  const [{ root: model }, ...parts] = await Promise.all([loadModel(url(body)), ...hair.map((h) => loadModel(url(h)))]);
  parts.forEach((p) => attachSkinned(model, p.root));
  if (outfit) {
    paintOutfit(model, outfit);
    ink = { ...ink, tint: "#ffffff", vertexColors: true };
  }
  let mat = material;
  if (material) {
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = material;
      o.frustumCulled = false;
    });
  } else {
    mat = inkify(model, { ink, line });
  }
  const rig = createRig(model, { fist });

  if (horns && rig.bones.head) {
    // Horns ride the head bone; attached at rest so they keep their shape.
    model.updateMatrixWorld(true);
    const top = rig.bones.head.getWorldPosition(new THREE.Vector3());
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.3, 10), mat);
      horn.position.copy(top).add(new THREE.Vector3(s * 0.09, 0.2, 0.02));
      horn.rotation.set(-0.25, 0, -s * 0.55);
      model.add(horn);
      rig.bones.head.attach(horn);
    }
  }

  fitHeight(model, height);
  const root = new THREE.Group();
  root.add(model);
  return { root, model, apply: rig.apply, bones: rig.bones };
};
