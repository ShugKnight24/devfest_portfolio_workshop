import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { outline } from "./ink";
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
 * onto the bare base body (see paintOutfit); `dress` adds the clothes that
 * need a silhouette as real geometry riding the bones (see addDress). Every
 * figure drawn in ink wears real shoes, styled by `outfit.footwear`.
 *
 * Hands rest softly curled (`relaxed`); `hands` names another resting pose
 * ("fist", "open", …) and the older `fist: n` still curls n radians per joint.
 * Beyond the capsule API the figure has `setHand`, `setHands`, `hold`,
 * `release` and `socket` (see Hands below) and `groundTo` / `seatOn`, which
 * plant the posed soles on a floor or the seat of the pants on a chair:
 *
 *   const fig = await createModelFigure({ height: 2.0, outfit, hands: "relaxed" });
 *   fig.hold(mug, { hand: "right", radius: 0.042 });
 *   // every frame:
 *   fig.apply(blendPose(A, B, t));
 *   fig.groundTo(0);
 */

const url = (name) => `/models/quaternius/${name}.glb`;

/**
 * Clothes, painted as vertex colours by region of the T-posed bind shape: the
 * head stays skin, the torso takes the top (with an optional collar, tie and
 * belt), the arms the sleeves to `sleeves` (none, short, rolled, long, or a
 * fraction of the height) and
 * `arms` past them (skin, or gloves), the legs the bottom or a skirt over
 * skin and stockings, the feet shoes with an optional trim. Each figure gets
 * its own copy of the geometry — clones share it otherwise.
 *
 * Optional details: `panel` (sneakers: a sole, the `trim` stripe at its edge,
 * a toe cap and side panels in this colour; `sole` its colour), `iris` (paints
 * the eyeballs white with an iris, `pupil` and a heavy upper lid; without it
 * they take the hair colour), `brows` (a darker, bolder, slanted brow),
 * `tired` (a faint shadow under the eyes), `neckband` (a tee's crew neck),
 * `waist` (where the top meets the bottom, as a fraction of the height:
 * 0.575 by default) and `drape` (cloth over the bust, hanging to the waist;
 * on by default for the female body).
 */
const SLEEVE_END = { none: 0.12, short: 0.22, rolled: 0.29, long: 0.37 };
/** Where a sleeve ends: a named length, or a fraction of the height. */
const sleeveEnd = (s = "short") => (typeof s === "number" ? s : SLEEVE_END[s]);
const TIRED = new THREE.Color(0.86, 0.8, 0.84);

/**
 * Cloth over the chest. Under a top the bust is a smaller, softer shape: the
 * fabric bridges the cleavage and falls from the bust instead of following
 * the crease under it. Works on a heightfield of the front of the torso
 * (bind space, `front` the sign of forward z) and moves only the front
 * surface, so the skin weights still fit. `k` keeps that much of the bust.
 */
const drapeChest = (geo, { min, H, cx, cz, front }, k, hem) => {
  const pos = geo.attributes.position;
  const C = 0.012 * H;
  const X0 = -0.12 * H;
  const Y0 = min.y + hem * H;
  const NX = Math.round((0.24 * H) / C) + 1;
  const NY = Math.round(((0.85 - hem) * H) / C) + 1;
  const F = Array.from({ length: NY }, () => new Float32Array(NX).fill(-Infinity));
  const cell = (x, y) => [Math.round((x - X0) / C), Math.round((y - Y0) / C)];
  for (let i = 0; i < pos.count; i++) {
    const zf = (pos.getZ(i) - cz) * front;
    if (zf <= 0) continue;
    const [ci, cj] = cell(pos.getX(i) - cx, pos.getY(i));
    if (ci >= 0 && ci < NX && cj >= 0 && cj < NY) F[cj][ci] = Math.max(F[cj][ci], zf);
  }
  // Holes in the sparse mesh: filled down each column.
  for (let i = 0; i < NX; i++) {
    let last = -1;
    for (let j = 0; j < NY; j++) {
      if (!Number.isFinite(F[j][i])) continue;
      if (last >= 0) for (let m = last + 1; m < j; m++) F[m][i] = F[last][i] + ((F[j][i] - F[last][i]) * (m - last)) / (j - last);
      last = j;
    }
  }
  const jLo = Math.round(((0.665 - hem) * H) / C);
  const jHi = Math.round(((0.815 - hem) * H) / C);
  const T = F.map((row) => Float32Array.from(row));
  for (let j = jLo + 1; j < jHi; j++) {
    const t = (j - jLo) / (jHi - jLo);
    for (let i = 0; i < NX; i++) {
      if (!Number.isFinite(F[j][i]) || !Number.isFinite(F[jLo][i]) || !Number.isFinite(F[jHi][i])) continue;
      const base = F[jLo][i] + (F[jHi][i] - F[jLo][i]) * t;
      T[j][i] = F[j][i] > base ? base + (F[j][i] - base) * k : F[j][i];
    }
    // Bridge the valley between the two: the cloth spans the cleavage.
    const L = new Float32Array(NX);
    const R = new Float32Array(NX);
    for (let i = 0; i < NX; i++) L[i] = Math.max(i ? L[i - 1] : -Infinity, T[j][i]);
    for (let i = NX - 1; i >= 0; i--) R[i] = Math.max(i < NX - 1 ? R[i + 1] : -Infinity, T[j][i]);
    for (let i = 0; i < NX; i++) if (Number.isFinite(T[j][i])) T[j][i] = Math.max(T[j][i], Math.min(L[i], R[i]));
  }
  // And hangs from the bust to the hem instead of tucking under it.
  for (let j = jHi - 1; j >= 0; j--) for (let i = 0; i < NX; i++) if (Number.isFinite(T[j][i]) && Number.isFinite(T[j + 1][i])) T[j][i] = Math.max(T[j][i], T[j + 1][i] - 0.2 * C);
  // The move, softened over its neighbours.
  const D = F.map((row, j) => row.map((f, i) => (Number.isFinite(f) && Number.isFinite(T[j][i]) ? T[j][i] - f : 0)));
  const S = D.map((row, j) =>
    row.map((_, i) => {
      let s = 0;
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (D[j + dj]?.[i + di] !== undefined) (s += D[j + dj][i + di]), n++;
      return s / n;
    }),
  );
  const sample = (G, x, y) => {
    const fx = Math.min(NX - 1.001, Math.max(0, (x - X0) / C));
    const fy = Math.min(NY - 1.001, Math.max(0, (y - Y0) / C));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const u = fx - i;
    const v = fy - j;
    const g = (a, b) => (Number.isFinite(G[b][a]) ? G[b][a] : 0);
    return (g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - v) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * v;
  };
  const smooth = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a))) ** 2 * (3 - 2 * Math.min(1, Math.max(0, (x - a) / (b - a))));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) - cx;
    const y = pos.getY(i);
    const zf = (pos.getZ(i) - cz) * front;
    if (zf <= 0 || Math.abs(x) > 0.12 * H || y < Y0 || y > Y0 + (NY - 1) * C) continue;
    // The front surface moves; the sides behind it less, the back not at all.
    const w = (1 - smooth(0, 0.03 * H, sample(F, x, y) - zf)) * (1 - smooth(0.085 * H, 0.115 * H, Math.abs(x)));
    pos.setZ(i, cz + (zf + sample(S, x, y) * w) * front);
  }
  pos.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
};

const paintOutfit = (model, o, { drape = false, shod = false } = {}) => {
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
  c.neckband = o.neckband ? color(o.neckband) : null;
  c.tie = o.tie ? color(o.tie) : null;
  c.belt = o.belt ? color(o.belt) : null;
  c.trim = o.trim ? color(o.trim) : null;
  c.stockings = o.stockings ? color(o.stockings) : null;
  c.panel = o.panel ? color(o.panel) : null;
  c.sole = color(o.sole, "#f3f0e8");
  c.toe = c.shoes.clone().lerp(new THREE.Color("#8a8a86"), 0.18);
  c.brows = o.brows ? color(o.brows) : c.hair;

  const meshes = [];
  model.traverse((m) => m.isMesh && meshes.push(m));
  const body = meshes.reduce((a, b) => (b.geometry.attributes.position.count > a.geometry.attributes.position.count ? b : a));
  body.geometry = body.geometry.clone();
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
  // `waist`: where the top gives way to the bottom (higher for high-waisted
  // shorts, lower for a tee worn out over jeans).
  const WAIST = o.waist ?? 0.575;
  if (drape) drapeChest(body.geometry, { min, H, cx, cz, front }, 0.45, Math.max(0.5, WAIST));
  // The neck, measured just above the shoulders: only inside it is the skin
  // band at the top of the torso bare. Outside it — the slope of the
  // shoulders, the top of the back — it is cloth.
  let nzMin = Infinity;
  let nzMax = -Infinity;
  const feet = { [-1]: new THREE.Box3(), [1]: new THREE.Box3() };
  const fp = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) {
    const ny = (bp.getY(i) - min.y) / H;
    if (ny > 0.855 && ny < 0.865 && Math.abs(bp.getX(i) - cx) / H < 0.02) {
      nzMin = Math.min(nzMin, bp.getZ(i));
      nzMax = Math.max(nzMax, bp.getZ(i));
    }
    if (ny < 0.06) feet[Math.sign(bp.getX(i) - cx) || 1].expandByPoint(fp.fromBufferAttribute(bp, i));
  }
  const neckZ = Number.isFinite(nzMin) ? (nzMin + nzMax) / 2 - cz : 0;
  const neckR = Number.isFinite(nzMin) ? ((nzMax - nzMin) / 2) * 1.2 : 0.04 * H;

  // Eyes: each eyeball white, a dark iris and pupil facing out, and a heavy
  // upper lid across the top — the sharp, half-lidded look reads at distance.
  const eyeBoxes = new Map();
  const ep = new THREE.Vector3();
  const eye = { white: new THREE.Color("#f4efe6"), iris: color(o.iris, "#3a2a22"), pupil: color(o.pupil, "#0e0a08"), lid: color(o.lid, "#24160f") };
  const eyeColor = (mesh, i) => {
    if (!eyeBoxes.has(mesh)) {
      const boxes = { [-1]: new THREE.Box3(), [1]: new THREE.Box3() };
      const ap = mesh.geometry.attributes.position;
      for (let k = 0; k < ap.count; k++) boxes[Math.sign(ap.getX(k)) || 1].expandByPoint(ep.fromBufferAttribute(ap, k));
      eyeBoxes.set(mesh, boxes);
    }
    const ap = mesh.geometry.attributes.position;
    ep.fromBufferAttribute(ap, i);
    const b = eyeBoxes.get(mesh)[Math.sign(ep.x) || 1];
    const r = Math.max(1e-5, (b.max.x - b.min.x) / 2);
    const dx = (ep.x - (b.min.x + b.max.x) / 2) / r;
    const dy = (ep.y - (b.min.y + b.max.y) / 2) / r;
    const out = ((ep.z - (b.min.z + b.max.z) / 2) * front) / r;
    if (out < 0.2) return eye.white;
    // The lid line sits lower toward the nose: a narrowed, slightly tired glare.
    const inner = -dx * Math.sign(ep.x);
    if (dy > 0.42 - 0.12 * inner) return eye.lid;
    const d = Math.hypot(dx, dy + 0.05);
    return d < 0.26 ? eye.pupil : d < 0.58 ? eye.iris : eye.white;
  };
  // Brows: a touch bolder and slanted down toward the nose.
  if (o.brows) {
    for (const mesh of meshes) {
      if (!/eyebrow/i.test(mesh.name)) continue;
      mesh.geometry = mesh.geometry.clone();
      const ap = mesh.geometry.attributes.position;
      const boxes = { [-1]: new THREE.Box3(), [1]: new THREE.Box3() };
      for (let k = 0; k < ap.count; k++) boxes[Math.sign(ap.getX(k)) || 1].expandByPoint(ep.fromBufferAttribute(ap, k));
      for (let k = 0; k < ap.count; k++) {
        ep.fromBufferAttribute(ap, k);
        const b = boxes[Math.sign(ep.x) || 1];
        const midY = (b.min.y + b.max.y) / 2;
        const t = (Math.abs(ep.x) - Math.min(Math.abs(b.min.x), Math.abs(b.max.x))) / Math.max(1e-6, b.max.x - b.min.x);
        const y = midY + (ep.y - midY) * 1.3 - 0.003 * (1 - Math.min(1, Math.max(0, t)));
        ap.setXYZ(k, ep.x, y, ep.z + 0.0015 * front);
      }
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
  }

  const radial = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const mesh of meshes) {
    if (mesh !== body && !(o.brows && /eyebrow/i.test(mesh.name))) mesh.geometry = mesh.geometry.clone();
    const pos = mesh.geometry.attributes.position;
    const nor = mesh.geometry.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    // 1 where the paint is skin (and hair, eyes, brows), 0 where it is cloth:
    // the ink shader keeps the set's rim light on skin but tints and dims it
    // on cloth (see clothShading), so dark trousers stay their own colour.
    const bare = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      let col = c.hair;
      // Cloth hides the sculpt: under clothes, the normal leans toward a plain
      // cylinder round the torso, leg or arm, so pecs and abs stop shading through.
      let cloth = null;
      let head = false;
      if (mesh === body) {
        const x = pos.getX(i) - cx;
        const y = pos.getY(i);
        const z = pos.getZ(i) - cz;
        const ny = (y - min.y) / H;
        const ax = Math.abs(x) / H;
        const facing = z * front > 0;
        const arm = ax > 0.12 && ny > 0.7;
        const neck = ny > 0.875 || Math.hypot(x, z - neckZ) < neckR;
        if (ny > 0.835 && !arm && neck) {
          col = c.skin; // head and neck
          head = true;
          if (o.tired && ny > 0.922 && ny < 0.93 && ax > 0.009 && ax < 0.03 && z * front > 0.075 * (H / 1.82)) col = c.skin.clone().multiply(TIRED);
        } else if (arm) {
          const sleeve = ax <= sleeveEnd(sleeves);
          col = sleeve ? c.sleeve : c.arms;
          if (sleeve) cloth = radial.set(0, y - (min.y + 0.8 * H), z);
        } else if (ny > WAIST) {
          col = c.top;
          // The top of the shoulder is the sleeve's cloth (a blouse under a pinafore).
          if (ny > 0.8 && ax > 0.065 && sleeves !== "none") col = c.sleeve;
          if (c.collar && ny > 0.74 && ax < 0.05 && facing) col = c.collar;
          // A tee's crew neck: a band of its own colour round the neckline.
          if (c.neckband && ny > 0.8 && Math.hypot(x, z - neckZ) < neckR * 1.55) col = c.neckband;
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
        } else if (shod) {
          // Under real shoes the foot takes the leg's colour, so none shows above the shoe.
          col = skirt ? (c.stockings ?? c.skin) : c.bottom;
        } else if (c.panel) {
          // Sneakers: sole, trim stripe at its edge, side panels, toe cap.
          const foot = feet[Math.sign(x) || 1];
          const hw = (foot.max.x - foot.min.x) / 2;
          const side = Math.abs(pos.getX(i) - (foot.min.x + foot.max.x) / 2) / Math.max(1e-6, hw);
          const toe = front > 0 ? foot.max.z - pos.getZ(i) : pos.getZ(i) - foot.min.z;
          if (ny < 0.011) col = c.sole;
          else if (ny < 0.018 && c.trim) col = c.trim;
          else if (toe < 0.035 * (H / 1.82)) col = c.toe;
          else if (side > 0.6 && toe > 0.07 * (H / 1.82)) col = c.panel;
          else col = c.shoes;
        } else col = c.trim && ny > 0.042 ? c.trim : c.shoes;
      } else if (/^eyes/i.test(mesh.name) && o.iris) col = eyeColor(mesh, i);
      else if (/eyebrow/i.test(mesh.name)) col = c.brows;
      colors.set([col.r, col.g, col.b], i * 3);
      bare[i] = mesh !== body || head || col.equals(c.skin) || (col === c.arms && o.arms == null) ? 1 : 0;
      if (cloth && nor && cloth.lengthSq() > 1e-8) {
        n.fromBufferAttribute(nor, i).lerp(cloth.normalize(), 0.7).normalize();
        nor.setXYZ(i, n.x, n.y, n.z);
      }
    }
    mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    mesh.geometry.setAttribute("aSkin", new THREE.BufferAttribute(bare, 1));
  }
};

/**
 * Painted cloth reads as cloth. The ink shader's rim light is added on top of
 * the surface colour, the same colour on skin and cloth alike, so wherever a
 * figure turns from the light a pair of near-black trousers fills with the
 * set's (often warm, skin-like) rim and blends into the arms and face. On
 * cloth the rim takes the fabric's own hue and scales with its value: a white
 * shirt still catches the edge light, dark trousers keep a dark, solid edge.
 * Cloth is matte too: the white highlight (strong on a figure given a glossy
 * `spec`) drops to a faint sheen, so it no longer streaks down the legs.
 * Skin (aSkin = 1) and every mesh without the mask behave as before.
 */
const clothShading = (mat) => {
  const vs = mat.vertexShader;
  const fs = mat.fragmentShader;
  const rims = [
    "col += uRimColor * fresF",
    "cel = mix(cel, uRimColor,",
    "col = mix(col, uRimColor, rim);",
    "col += vec3(1.0) * pow(max(dot(N, Hf), 0.0), 40.0)",
    "* lit * uSpec);",
    "* (1.0 - core) * uSpec;",
  ];
  const hooks = ["varying vec3 vPaint;", "vPaint = vec3(1.0);", "void main() {"];
  if (mat.userData.clothShading || !hooks.every((h) => vs.includes(h)) || !fs.includes("varying vec3 vPaint;") || !rims.every((r) => fs.includes(r))) return;
  mat.vertexShader = vs
    .replace("varying vec3 vPaint;", "varying vec3 vPaint;\n      attribute float aSkin;\n      varying float vSkin;")
    .replace("vPaint = vec3(1.0);", "vPaint = vec3(1.0);\n        vSkin = aSkin;");
  mat.fragmentShader = fs
    .replace(
      "varying vec3 vPaint;",
      `varying vec3 vPaint;
      varying float vSkin;
      vec3 clothRim(vec3 rc) {
        const vec3 Y = vec3(0.2126, 0.7152, 0.0722);
        vec3 hue = vPaint / max(max(vPaint.r, max(vPaint.g, vPaint.b)), 1e-3);
        vec3 cloth = mix(rc, hue * dot(rc, Y), 0.75) * (0.2 + 0.8 * sqrt(clamp(dot(vPaint, Y), 0.0, 1.0)));
        return mix(cloth, rc, clamp(vSkin, 0.0, 1.0));
      }
      // Cloth is matte: a faint sheen at most, so legs never streak with highlights.
      float clothSpec() { return mix(0.12, 1.0, clamp(vSkin, 0.0, 1.0)); }`,
    )
    .replace("col += uRimColor * fresF", "col += clothRim(uRimColor) * fresF")
    .replace("cel = mix(cel, uRimColor,", "cel = mix(cel, clothRim(uRimColor),")
    .replace("col = mix(col, uRimColor, rim);", "col = mix(col, clothRim(uRimColor), rim);")
    .replace("col += vec3(1.0) * pow(max(dot(N, Hf), 0.0), 40.0)", "col += vec3(clothSpec()) * pow(max(dot(N, Hf), 0.0), 40.0)")
    .replace("* lit * uSpec);", "* lit * uSpec * clothSpec());")
    .replace("* (1.0 - core) * uSpec;", "* (1.0 - core) * uSpec * clothSpec();");
  // Meshes without the mask (shoes, collars, cuffs added by addDress) are cloth.
  mat.defaultAttributeValues = { ...mat.defaultAttributeValues, aSkin: [0] };
  mat.userData.clothShading = true;
  mat.needsUpdate = true;
};

/* --------------------------------------------------------------------------
 * Clothes with a silhouette. Paint cannot give a collar an edge or a tie a
 * knot, so these are small meshes built in the body's bind space (measured off
 * its own surface) and bound to the bone that carries that part of the body —
 * through the skeleton's inverse bind matrices, so they sit exactly where the
 * skin does whatever the rig's rest pose has done to the arms.
 * ------------------------------------------------------------------------ */

const UP = new THREE.Vector3(0, 1, 0);

/** Colour a geometry: one colour, or one per vertex from `fn(x, y, z)`. */
const colorize = (geo, fn) => {
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const c = typeof fn === "function" ? fn(p.getX(i), p.getY(i), p.getZ(i)) : fn;
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
};

/**
 * A thin plate through rows of [left, right] points on its front face (a tie,
 * a collar point), `thick` deep toward the body. Shared vertices, so the ink
 * line stays closed round its edges.
 */
const ribbon = (rows, thick) => {
  const v = [];
  rows.forEach(([l, r]) => {
    v.push(l.x, l.y, l.z, r.x, r.y, r.z, l.x, l.y, l.z - thick, r.x, r.y, r.z - thick);
  });
  const P = (i) => new THREE.Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  const index = [];
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  /** A triangle, wound to face `out`. */
  const tri = (a, b, c, out) => {
    ab.subVectors(P(b), P(a));
    ac.subVectors(P(c), P(a));
    if (ab.cross(ac).dot(out) < 0) index.push(a, c, b);
    else index.push(a, b, c);
  };
  const quad = (a, b, c, d, out) => {
    tri(a, b, c, out);
    tri(a, c, d, out);
  };
  const front = new THREE.Vector3(0, 0, 1);
  const back = new THREE.Vector3(0, 0, -1);
  for (let i = 0; i < rows.length - 1; i++) {
    const [fl, fr, bl, br] = [0, 1, 2, 3].map((k) => i * 4 + k);
    const [fl2, fr2, bl2, br2] = [0, 1, 2, 3].map((k) => (i + 1) * 4 + k);
    const side = new THREE.Vector3().subVectors(rows[i][0], rows[i][1]).setZ(0);
    if (side.lengthSq() < 1e-10) side.subVectors(rows[i + 1][0], rows[i + 1][1]).setZ(0);
    side.normalize();
    quad(fl, fl2, fr2, fr, front);
    quad(bl, br, br2, bl2, back);
    quad(fl, bl, bl2, fl2, side);
    quad(fr, fr2, br2, br, side.clone().negate());
  }
  const last = (rows.length - 1) * 4;
  const topOut = new THREE.Vector3().subVectors(rows[0][0], rows[1][0]).normalize();
  quad(0, 1, 3, 2, topOut);
  quad(last, last + 1, last + 3, last + 2, topOut.clone().negate());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((v.length / 3) * 2).fill(0), 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
};

/** A cone from the origin along +y, flattened into a wedge (a clump of hair). */
const wedge = (radius, length, flat, twist, root, tip) => {
  const geo = new THREE.ConeGeometry(radius, length, 5, 2);
  geo.translate(0, length / 2, 0);
  geo.scale(1, 1, flat);
  geo.rotateY(twist);
  const c = new THREE.Color();
  return colorize(geo, (x, y) => c.copy(root).lerp(tip, Math.min(1, Math.max(0, y / length))));
};

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Shoes the colour of the skin are bare feet (Makima's twist, Musashi on the sand). */
const barefoot = (o) => {
  if (!o.shoes || !o.skin) return false;
  const a = {};
  const b = {};
  new THREE.Color(o.shoes).getHSL(a, THREE.SRGBColorSpace);
  new THREE.Color(o.skin).getHSL(b, THREE.SRGBColorSpace);
  const dh = Math.abs(a.h - b.h);
  return a.s > 0.12 && Math.min(dh, 1 - dh) < 12 / 360 && a.l > 0.75 * b.l;
};
/** The shoes an outfit wears (see addDress). */
const footwearOf = (o, d) => (d.shoes === false || o.footwear === "none" || barefoot(o) ? "none" : (o.footwear ?? (d.sneakers || o.panel ? "hightops" : "shoe")));

/**
 * `d` picks the pieces: `collar` (a band round the neck and two pointed
 * flaps), `tie` (knot and blade, hanging straight off the chest), `bow` (a
 * thin ribbon tied at the collar, in `o.bow`), `print` (a square chest print in `o.print` with a yellow creature),
 * `placket` (the button strip), `belt`, `cuffs` (the roll of a rolled
 * sleeve), `shorts` (a flared hem round each thigh where the bottom ends),
 * `backpack` (a leather school bag on both shoulders, in `o.backpack`),
 * `spikes` (Denji's hair: a soft, messy mop of locks off the head bone), and `bun`, `ponytail` and
 * `fringe` ("left" or "right": a side-swept fringe over that eye).
 *
 * Every figure gets shoes, styled by `o.footwear`: "shoe" (plain, the
 * default), "loafers", "sneakers" (canvas low-tops), "hightops" (sole with
 * the trim stripe, toe cap, side panels in `panel`, a padded collar: the
 * default when the outfit has a `panel` or `d.sneakers` is set), "boots" or
 * "none". Shoes the colour of the skin are bare feet; `d.shoes: false` drops
 * them. Colours come from the outfit. Built for a body that faces +z.
 */
const addDress = (model, rig, mat, line, o, d) => {
  let body = null;
  model.traverse((m) => m.isSkinnedMesh && (!body || m.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = m));
  if (!body) return;
  const geo = body.geometry;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const S = H / 1.82; // the measurements below are tuned on the 1.82-unit male body
  const cx = (min.x + max.x) / 2;
  const cz = (min.z + max.z) / 2;
  const bp = geo.attributes.position;
  const color = (v, fallback) => new THREE.Color(v ?? fallback);
  const top = color(o.top, "#f1ece2");
  const sleeve = color(o.sleeve, o.top ?? "#f1ece2");
  const shoes = color(o.shoes, "#141414");
  const panel = color(o.panel, o.shoes ?? "#141414");
  const trim = o.trim ? color(o.trim) : null;
  const solec = color(o.sole, "#f3f0e8");
  const hairc = color(o.hair, "#1b1b1b");
  const tiec = color(o.tie, "#15161b");
  const beltc = color(o.belt, "#3a2618");
  const seam = top.clone().lerp(new THREE.Color("#7d8794"), 0.16);
  const button = top.clone().lerp(new THREE.Color("#5b636c"), 0.45);
  const metal = new THREE.Color("#c9c4b8");

  /** Bounds of the body's vertices that pass `test(x, y, z)`. */
  const slab = (test) => {
    const b = new THREE.Box3();
    const p = new THREE.Vector3();
    for (let i = 0; i < bp.count; i++) {
      p.fromBufferAttribute(bp, i);
      if (test(p.x, p.y, p.z)) b.expandByPoint(p);
    }
    return b.isEmpty() ? null : b;
  };
  /** The cross-section of one leg (`s` the side) at height y, widening the band on a sparse mesh. */
  const legAt = (y, s, inner = 0.004 * S) => {
    for (let r = 0.01 * S; r < 0.08 * S; r *= 1.6) {
      const b = slab((x, yy) => Math.abs(yy - y) < r && (x - cx) * s > inner);
      if (b) return b;
    }
    return null;
  };
  /** The front of the body at (x, y): its furthest-forward vertex nearby. */
  const frontAt = (x, y, r = 0.014 * S) => {
    for (let k = 0; k < 5; k++, r *= 1.6) {
      let z = -Infinity;
      for (let i = 0; i < bp.count; i++) {
        if (Math.abs(bp.getX(i) - x) < r && Math.abs(bp.getY(i) - y) < r && bp.getZ(i) > cz) z = Math.max(z, bp.getZ(i));
      }
      if (Number.isFinite(z)) return z;
    }
    return max.z;
  };
  const bone = (...names) => names.map((n) => (typeof n === "string" ? model.getObjectByName(n) : n)).find(Boolean);
  const bindPos = (b) => {
    const i = body.skeleton.bones.indexOf(b);
    return i < 0 ? null : new THREE.Vector3().setFromMatrixPosition(body.skeleton.boneInverses[i].clone().invert());
  };
  const pieces = [];
  /** Merge bind-space geometries into one mesh riding `b`. */
  const pin = (geos, b) => {
    let list = geos.filter(Boolean);
    if (list.some((g) => !g.index)) list = list.map((g) => (g.index ? g.toNonIndexed() : g));
    const i = b ? body.skeleton.bones.indexOf(b) : -1;
    if (!list.length || i < 0) return null;
    const mesh = new THREE.Mesh(list.length > 1 ? mergeGeometries(list) : list[0], mat);
    new THREE.Matrix4().multiplyMatrices(body.skeleton.boneInverses[i], body.bindMatrix).decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.frustumCulled = false;
    b.add(mesh);
    if (line) outline(mesh, line);
    pieces.push(mesh);
    return mesh;
  };
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const neckBone = bone("neck_01", rig.bones.neck);
  const upperChest = bone("spine_03", rig.bones.chest, rig.bones.spine);
  const lowerSpine = bone(rig.bones.spine, rig.bones.hips);
  const y0 = (neckBone && bindPos(neckBone)?.y) ?? min.y + 0.835 * H;
  const WAIST = 0.575;
  const beltTop = min.y + (WAIST + 0.022) * H;

  // Neck: centre and half-depth just above the shoulders.
  const neck = slab((x, y) => Math.abs(x - cx) < 0.036 * S && Math.abs(y - (min.y + 0.86 * H)) < 0.009 * H);
  const neckZ = neck ? (neck.min.z + neck.max.z) / 2 : cz;
  const neckR = neck ? (neck.max.z - neck.min.z) / 2 : 0.065 * S;

  const chest = [];
  const belly = [];
  let knotFront = frontAt(cx, y0 - 0.03 * S) + 0.016 * S;

  if (d.collar) {
    // The band, flaring at its foot and dipping at the front.
    const R = neckR + 0.009 * S;
    const h = 0.042 * S;
    const t = 0.004 * S;
    const band = new THREE.LatheGeometry([v3(R + 0.006 * S, -h / 2, 0), v3(R + 0.006 * S + t, -h / 2, 0), v3(R + t, h / 2, 0), v3(R, h / 2, 0), v3(R + 0.006 * S, -h / 2, 0)].map((p) => new THREE.Vector2(p.x, p.y)), 32);
    band.rotateX(0.32);
    band.translate(cx, y0 + 0.012 * S, neckZ);
    chest.push(colorize(band, top));
    knotFront = Math.max(knotFront, neckZ + R + 0.012 * S);
    // The points: from the foot of the band down onto the chest, apart at the tips.
    for (const s of [-1, 1]) {
      const at = (x, y) => v3(cx + s * x * S, y0 + y * S, 0);
      const A = at(0.009, -0.03);
      const B = at(0.064, -0.012);
      const C = at(0.05, -0.088);
      const rows = [
        [A, B],
        [A.clone().lerp(C, 0.5), B.clone().lerp(C, 0.5)],
        [C, C.clone()],
      ].map((row) => row.map((p) => p.setZ(frontAt(p.x, p.y) + 0.008 * S)));
      chest.push(colorize(ribbon(rows, 0.006 * S), top));
    }
  }

  if (d.placket) {
    // The button strip, in two lengths: the chest's, and the belly's.
    const split = (bindPos(rig.bones.chest ?? upperChest)?.y ?? min.y + 0.65 * H) + 0.06 * S;
    const strip = (from, to) => {
      const rows = [];
      for (let k = 0; k <= 10; k++) {
        const y = from + ((to - from) * k) / 10;
        const z = frontAt(cx, y, 0.02 * S) + 0.003 * S;
        rows.push([v3(cx - 0.01 * S, y, z), v3(cx + 0.01 * S, y, z)]);
      }
      return colorize(ribbon(rows, 0.004 * S), seam);
    };
    chest.push(strip(y0 - 0.06 * S, split));
    belly.push(strip(split, beltTop + 0.004 * S));
    for (let y = y0 - 0.1 * S; y > beltTop + 0.02 * S; y -= 0.075 * S) {
      const b = new THREE.SphereGeometry(0.0058 * S, 10, 6);
      b.scale(1, 1, 0.45);
      b.translate(cx, y, frontAt(cx, y, 0.02 * S) + 0.0045 * S);
      (y > split ? chest : belly).push(colorize(b, button));
    }
  }

  if (d.tie) {
    // The knot at the collar, then the blade: narrow under the knot, widening,
    // pointed; it follows the chest down to the top of the pecs and hangs
    // straight from there.
    const kz = (y) => Math.max(frontAt(cx, y) + 0.016 * S, knotFront);
    const knot = ribbon(
      [
        [v3(cx - 0.017 * S, y0 - 0.016 * S, kz(y0 - 0.016 * S)), v3(cx + 0.017 * S, y0 - 0.016 * S, kz(y0 - 0.016 * S))],
        [v3(cx - 0.0105 * S, y0 - 0.05 * S, kz(y0 - 0.05 * S) + 0.002 * S), v3(cx + 0.0105 * S, y0 - 0.05 * S, kz(y0 - 0.05 * S) + 0.002 * S)],
      ],
      0.016 * S,
    );
    chest.push(colorize(knot, tiec));
    const yTop = y0 - 0.045 * S;
    const yTip = min.y + 0.645 * H;
    const rows = [];
    let z = knotFront - 0.008 * S;
    const N = 18;
    for (let k = 0; k <= N; k++) {
      const y = yTop + ((yTip + 0.03 * S - yTop) * k) / N;
      z = Math.max(z, frontAt(cx, y, 0.02 * S) + 0.01 * S);
      const w = (0.0105 + (0.0215 - 0.0105) * (k / N)) * S;
      rows.push([v3(cx - w, y, z), v3(cx + w, y, z)]);
    }
    rows.push([v3(cx, yTip, z), v3(cx, yTip, z)]);
    chest.push(colorize(ribbon(rows, 0.005 * S), tiec));
  }

  pin(chest, upperChest);
  pin(belly, lowerSpine);

  if (d.belt) {
    const yB = min.y + (WAIST + 0.011) * H;
    const waist = slab((x, y) => Math.abs(y - yB) < 0.012 * S && Math.abs(x - cx) < 0.25 * S);
    if (waist) {
      const a = (waist.max.x - waist.min.x) / 2 + 0.005 * S;
      const b = (waist.max.z - waist.min.z) / 2 + 0.005 * S;
      const zc = (waist.min.z + waist.max.z) / 2;
      const strap = new THREE.TorusGeometry(1, 0.06, 6, 56);
      strap.rotateX(Math.PI / 2);
      strap.scale(a, (0.0175 * S) / 0.06, b);
      strap.translate(cx, yB, zc);
      const buckle = new THREE.BoxGeometry(0.046 * S, 0.034 * S, 0.01 * S);
      buckle.translate(cx, yB, waist.max.z + 0.011 * S);
      pin([colorize(strap, beltc), colorize(buckle, metal)], bone(rig.bones.hips));
    }
  }

  if (d.cuffs) {
    const end = sleeveEnd(o.sleeves) * H;
    for (const s of [1, -1]) {
      const xe = cx + s * end;
      const arm = slab((x, y) => Math.abs(x - xe) < 0.008 * S && y > min.y + 0.7 * H);
      if (!arm) continue;
      const roll = new THREE.TorusGeometry(1, 0.16, 8, 28);
      roll.rotateY(Math.PI / 2);
      roll.scale((0.017 * S) / 0.16, (arm.max.y - arm.min.y) / 2 + 0.004 * S, (arm.max.z - arm.min.z) / 2 + 0.004 * S);
      roll.translate(xe - s * 0.012 * S, (arm.min.y + arm.max.y) / 2, (arm.min.z + arm.max.z) / 2);
      pin([colorize(roll, sleeve.clone().multiplyScalar(0.97))], bone(s > 0 ? rig.bones.lElbow : rig.bones.rElbow));
    }
  }

  const footwear = footwearOf(o, d);
  if (footwear !== "none") {
    // One last for every style: a rounded upper over the foot on a sole that is
    // flat underneath at the base foot's own sole, so grounding does not move.
    const rubber = footwear === "sneakers" || footwear === "hightops";
    // The toe cap a shade off the upper. Colours mix in linear light, so even a
    // small step toward grey lifts dark leather a long way: more than this and
    // a lit toe reads as a bare foot.
    const toe = shoes.clone().lerp(new THREE.Color("#8a8a86"), 0.05);
    const tongue = shoes.clone().lerp(new THREE.Color("#7f8a96"), 0.16);
    const strap = shoes.clone().multiplyScalar(0.72);
    // Rubber soles are off-white unless the outfit says; leather a shade under the upper.
    const soleC = o.sole || rubber ? solec : shoes.clone().multiplyScalar(0.55);
    const lace = color(o.laces, "#f3f0e8");
    // [half-height of the sole, sole's rise, upper's margin round the foot, upper's flattening, shaft height]
    const LAST = {
      shoe: [0.012, 0.012, 0.006, 0.6, 0],
      loafers: [0.009, 0.009, 0.004, 0.56, 0],
      sneakers: [0.022, 0.016, 0.01, 0.7, 0.05],
      hightops: [0.03, 0.018, 0.01, 0.7, 0.125],
      boots: [0.018, 0.016, 0.013, 0.72, 0.16],
    }[footwear] ?? [0.012, 0.012, 0.006, 0.6, 0];
    const [soleH, soleRise, margin, flat, hs] = LAST.map((v, i) => (i === 3 ? v : v * S));
    for (const s of [1, -1]) {
      const foot = slab((x, y) => y < min.y + 0.06 * H && (x - cx) * s > 0);
      const leg = legAt(min.y + 0.15 * S, s, 0.01 * S);
      if (!foot || !leg) continue;
      const fx = (foot.min.x + foot.max.x) / 2;
      const hw = (foot.max.x - foot.min.x) / 2;
      const z0 = foot.min.z - 0.012 * S;
      const z1 = foot.max.z + 0.02 * S;
      const zc = (z0 + z1) / 2;
      const hl = (z1 - z0) / 2;
      const yu = min.y + soleRise + 0.036 * S;
      const parts = [];
      // The upper.
      const r = hw + margin;
      const upper = new THREE.CapsuleGeometry(r, Math.max(0.001, z1 - z0 - 2 * r), 8, 24, 6);
      upper.rotateX(Math.PI / 2);
      upper.scale(1, flat, 1);
      if (!rubber && footwear !== "boots") {
        // A dress shoe's last: low over the toes, rising to the instep, a touch narrower at the tip.
        const up = upper.attributes.position;
        for (let i = 0; i < up.count; i++) {
          const t = Math.min(1, Math.max(0, (up.getZ(i) + hl) / (2 * hl))); // 0 heel, 1 toe
          const k = 1 - 0.32 * t * t;
          up.setXYZ(i, up.getX(i) * (1 - 0.12 * t * t), up.getY(i) > 0 ? up.getY(i) * k : up.getY(i), up.getZ(i));
        }
      }
      colorize(upper, (x, y, z) => {
        const fromToe = hl - z;
        if (footwear === "hightops") {
          if (fromToe < 0.04 * S) return toe;
          if (Math.abs(x) > 0.55 * r && fromToe > 0.075 * S && y > -0.03 * S) return panel;
          if (Math.abs(x) < 0.4 * r && y > 0.02 * S && fromToe > 0.06 * S && fromToe < 0.15 * S) return tongue;
          return shoes;
        }
        // Canvas low-tops: the rubber toe cap and foxing band, canvas above.
        if (footwear === "sneakers") return (fromToe < 0.035 * S && y < 0.012 * S) || y < -0.012 * S ? soleC : shoes;
        return fromToe < 0.035 * S ? toe : shoes;
      });
      upper.translate(fx, yu, zc);
      parts.push(upper);
      // The sole, proud of the upper all round (the trim stripe along a rubber one's edge).
      const r2 = hw + margin + 0.006 * S;
      const sole = new THREE.CapsuleGeometry(r2, Math.max(0.001, z1 - z0 + 0.012 * S - 2 * r2), 6, 24, 6);
      sole.rotateX(Math.PI / 2);
      sole.scale(1, soleH / r2, 1);
      // Flat underneath: a rounded sole lets the base foot's toes through.
      const sp = sole.attributes.position;
      for (let i = 0; i < sp.count; i++) sp.setY(i, Math.max(sp.getY(i), -soleRise));
      colorize(sole, (x, y) => (trim && rubber && y > 0.005 * S && y < 0.016 * S ? trim : soleC));
      sole.translate(fx, min.y + soleRise, zc);
      parts.push(sole);
      if (footwear === "loafers" || footwear === "boots") {
        // A low heel block under the back of the foot.
        const heel = new THREE.BoxGeometry(1.5 * hw, 0.02 * S, 0.065 * S);
        heel.translate(fx, min.y + 0.01 * S, z0 + 0.045 * S);
        parts.push(colorize(heel, soleC.clone().multiplyScalar(0.8)));
      }
      if (footwear === "loafers") {
        // The saddle across the instep, and the slot in it.
        const kz = 1 - 0.32 * 0.625 ** 2; // the last's height where the saddle sits
        const saddle = new THREE.TorusGeometry(r * 0.97, 0.0055 * S, 6, 20, Math.PI);
        saddle.scale(1, flat * kz, 1.6);
        saddle.translate(fx, yu + 0.001 * S, zc + 0.25 * hl);
        parts.push(colorize(saddle, strap));
        const slot = new THREE.BoxGeometry(0.03 * S, 0.004 * S, 0.012 * S);
        slot.translate(fx, yu + flat * kz * r + 0.003 * S, zc + 0.25 * hl);
        parts.push(colorize(slot, strap.clone().multiplyScalar(0.6)));
      }
      if (footwear === "sneakers") {
        // Laces across the instep.
        for (let k = 0; k < 4; k++) {
          const bar = new THREE.BoxGeometry(0.9 * r, 0.005 * S, 0.008 * S);
          bar.translate(fx, yu + flat * r - 0.001 * S, zc + hl * 0.05 - k * 0.024 * S);
          parts.push(colorize(bar, lace));
        }
      }
      if (hs > 0) {
        // The collar round the ankle: a short one for low-tops, the high top
        // (panelled on its sides and heel) or a boot's shaft; a padded rim.
        const lx = (leg.min.x + leg.max.x) / 2;
        const lz = (leg.min.z + leg.max.z) / 2;
        const rs = Math.max(leg.max.x - leg.min.x, leg.max.z - leg.min.z) / 2 + 0.013 * S;
        const y1 = min.y + 0.04 * S;
        const shaft = new THREE.CylinderGeometry(rs * 0.96, rs, hs, 24, 3);
        colorize(shaft, (x, y, z) => (footwear === "hightops" && ((Math.abs(x) > 0.5 * rs && y < 0) || (z < -0.75 * rs && y > -hs * 0.1)) ? panel : shoes));
        shaft.translate(lx, y1 + hs / 2, lz);
        const rim = new THREE.TorusGeometry(rs * 0.97, 0.011 * S, 8, 28);
        rim.rotateX(Math.PI / 2);
        rim.translate(lx, y1 + hs, lz);
        colorize(rim, footwear === "boots" && trim ? trim : shoes);
        parts.push(shaft, rim);
      }
      pin(parts, bone(s > 0 ? "foot_l" : "foot_r", s > 0 ? rig.bones.lKnee : rig.bones.rKnee));
    }
  }

  /** The hair cap's centre and half-size, the top of the eyes, and the hair's root and tip shades. */
  const hairCap = () => {
    let hairMesh = null;
    let eyes = null;
    model.traverse((m) => {
      if (m.isMesh && /^hair/i.test(m.name)) hairMesh = m;
      if (m.isMesh && /^eyes/i.test(m.name)) eyes = m;
    });
    const headAt = bindPos(rig.bones.head) ?? v3(cx, min.y + 0.88 * H, cz);
    let c0 = headAt.clone().add(v3(0, 0.15 * S, -0.015 * S));
    let ax = v3(0.088, 0.09, 0.094).multiplyScalar(S);
    if (hairMesh) {
      hairMesh.geometry.computeBoundingBox();
      const hb = hairMesh.geometry.boundingBox;
      c0 = hb.getCenter(new THREE.Vector3());
      ax = hb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    }
    let eyeTop = c0.y - 0.035 * S;
    if (eyes) {
      eyes.geometry.computeBoundingBox();
      eyeTop = eyes.geometry.boundingBox.max.y;
    }
    const root = hairc.clone().multiplyScalar(0.7);
    const tip = hairc.clone().lerp(new THREE.Color("#fff4d6"), 0.18);
    return { c0, ax, eyeTop, root, tip };
  };

  if (d.spikes) {
    // Denji's hair, from the film's model sheet: a full, rounded mop. Thick
    // pointed clumps fan out from the crown and follow the head down: over
    // the brow in a messy, overlapping fringe (no parting), past the eyes at
    // the temples, over the ears to the jaw at the sides, to the nape at the
    // back, flicking out a little at the ends. Two tufts stand up off the top.
    const { c0, ax, eyeTop, root, tip } = hairCap();
    const deg = Math.PI / 180;
    const under = root.clone().multiplyScalar(0.8);
    const K = 1.14; // how far the mop stands off the scalp
    const hy = ax.y * K;
    const locks = [];
    // The model's own hair cap would show as a band across the brow under the
    // fringe: the clumps replace it.
    model.traverse((m) => {
      if (m.isMesh && /^hair/i.test(m.name)) m.visible = false;
    });
    // Under everything, a dark shell, so a gap between clumps reads as hair in
    // shadow, never as scalp.
    const shell = new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    shell.scale(ax.x * 1.09, ax.y * 1.09, ax.z * 1.09);
    shell.translate(c0.x, c0.y, c0.z);
    locks.push(colorize(shell, under));

    /** A point on the mop's surface: round over the crown, hanging straight below it, on the forehead at the front. */
    const surface = (az, y) => {
      const v = (y - c0.y) / hy;
      const rho = v > 0 ? Math.sqrt(Math.max(0, 1 - v * v)) : 1 + 0.12 * Math.min(1.4, -v);
      const x = c0.x + Math.sin(az) * ax.x * K * rho;
      let z = c0.z + Math.cos(az) * ax.z * K * rho;
      const front = Math.max(0, Math.cos(az)) ** 2;
      const down = Math.min(1, Math.max(0, (c0.y + 0.25 * hy - y) / (c0.y + 0.25 * hy - eyeTop)));
      if (front * down > 0) z += (frontAt(x, y, 0.012 * S) + 0.01 * S - z) * front * down;
      return v3(x, y, z);
    };

    /**
     * One clump from the crown to `yEnd` at azimuth `az` (0 is the front,
     * toward +x is positive), turning by `curl` on the way down. `width` at
     * its fullest, `flick` out at the tip, `layer` lifts it over the ones below.
     */
    const clump = (az, curl, yEnd, width, flick, layer, seed) => {
      const N = 16;
      const SIDES = 6;
      const yTop = c0.y + hy * 0.99;
      const pts = [];
      for (let k = 0; k <= N; k++) {
        const u = k / N;
        // Spend samples over the crown, where the surface turns fastest.
        const y = yTop + (yEnd - yTop) * (1 - Math.cos((u * Math.PI) / 2)) ** 0.8;
        pts.push(surface(az + curl * u, y));
      }
      const pos = [];
      const col = [];
      const uv = [];
      const c = new THREE.Color();
      const t = new THREE.Vector3();
      const n = new THREE.Vector3();
      const b = new THREE.Vector3();
      pts.forEach((p, k) => {
        const u = k / N;
        t.subVectors(pts[Math.min(N, k + 1)], pts[Math.max(0, k - 1)]).normalize();
        n.set(p.x - c0.x, Math.max(0, p.y - c0.y) * 0.8, p.z - c0.z).normalize();
        b.crossVectors(t, n).normalize();
        n.crossVectors(b, t).normalize();
        const w = 1.6 * width * S * (0.62 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 1.25))) * (1 - u) ** 0.65;
        const th = w * 0.34 + 0.0015 * S;
        const lift = (0.004 + layer * 0.0028) * S + flick * S * Math.max(0, u - 0.55) ** 2 / 0.2;
        c.copy(under).lerp(tip, Math.min(1, u * 1.15 + 0.05 * hash(seed)));
        for (let j = 0; j < SIDES; j++) {
          const a = (j / SIDES) * Math.PI * 2;
          const sa = Math.sin(a);
          const ox = Math.cos(a) * w;
          const oy = Math.sign(sa) * Math.abs(sa) ** 0.7 * th * 0.5 + th * 0.5 + lift;
          pos.push(p.x + b.x * ox + n.x * oy, p.y + b.y * ox + n.y * oy, p.z + b.z * ox + n.z * oy);
          col.push(c.r, c.g, c.b);
          uv.push(j / SIDES, u);
        }
      });
      const index = [];
      for (let k = 0; k < N; k++) {
        for (let j = 0; j < SIDES; j++) {
          const a = k * SIDES + j;
          const b2 = k * SIDES + ((j + 1) % SIDES);
          index.push(a, a + SIDES, b2, b2, a + SIDES, b2 + SIDES);
        }
      }
      // Close the root.
      for (let j = 1; j < SIDES - 1; j++) index.push(0, j, j + 1);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(index);
      g.computeVertexNormals();
      return g;
    };

    const jaw = c0.y - 0.95 * hy;
    // The inner layer: short, full clumps all the way round, for volume.
    for (let k = 0; k < 14; k++) {
      const az = (k * 360) / 14 + 8;
      if (Math.cos(az * deg) > 0.75) continue;
      locks.push(clump(az * deg, 0, c0.y - 0.35 * hy, 0.06, 0, 0, k));
    }
    // The outer layer over the sides and back: long, ending in flicks. Over
    // the ears to the jaw, to the nape behind.
    for (let k = 0; k < 15; k++) {
      const az = 48 + (k * 264) / 14 + (hash(k + 3) - 0.5) * 8;
      const side = Math.abs(Math.sin(az * deg));
      const yEnd = jaw + (0.05 + 0.25 * (1 - side) + 0.18 * hash(k + 7)) * hy;
      locks.push(clump(az * deg, (hash(k + 17) - 0.5) * 0.25, yEnd, 0.05, 0.014, 1 + (k % 2), k + 20));
    }
    // The temples: longer locks past the eyes, framing the face, turning in.
    for (const [az, curl, drop, w] of [[42, -6, 0.05, 0.044], [56, -4, 0.075, 0.046], [-44, 6, 0.06, 0.044], [-58, 4, 0.08, 0.046]]) {
      locks.push(clump(az * deg, curl * deg, eyeTop - drop * S, w, 0.006, 3, az));
    }
    // The fringe: a messy curtain of pointed clumps from the crown over the
    // brow, uneven, crossing each other, the long one falling between the eyes.
    // [azimuth, curl, tip height against the top of the eyes, width]
    [
      [-31, 5, 0.004, 0.04],
      [-22, -6, -0.016, 0.042],
      [-13, 7, -0.004, 0.04],
      [-5, -4, -0.03, 0.044],
      [4, 6, -0.012, 0.042],
      [12, -7, 0.002, 0.04],
      [21, 5, -0.02, 0.042],
      [30, -5, 0.006, 0.04],
      [-1, 9, 0.012, 0.036],
    ].forEach(([az, curl, dy, w], i) => {
      locks.push(clump(az * deg, curl * deg, eyeTop + dy * S, w, 0.002, 4 + (i % 3), i + 50));
    });
    // Two tufts standing up off the crown, as in the drawings.
    for (const [az, k] of [[150, 0], [-120, 1]]) {
      locks.push(clump(az * deg, 0.2, c0.y + 0.62 * hy, 0.03, 0.05, 6, k + 80));
    }
    pin(locks, bone(rig.bones.head));
  }

  if (d.bow) {
    // A thin ribbon tied under the collar: the knot, two small loops and two
    // long tails lying on the blouse.
    const bowc = color(o.bow, "#121116");
    const ky = y0 - 0.026 * S;
    const kz = knotFront;
    const knot = new THREE.BoxGeometry(0.012 * S, 0.011 * S, 0.008 * S);
    knot.translate(cx, ky, kz);
    const bow = [colorize(knot, bowc)];
    for (const s of [-1, 1]) {
      const loop = new THREE.TorusGeometry(0.011 * S, 0.003 * S, 5, 14);
      loop.scale(1.35, 0.7, 0.5);
      loop.rotateZ(s * 0.3);
      loop.translate(cx + s * 0.018 * S, ky + 0.002 * S, kz - 0.002 * S);
      bow.push(colorize(loop, bowc));
      const rows = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const y = ky - 0.004 * S - t * 0.115 * S;
        const x = cx + s * (0.004 + t * 0.02) * S;
        const z = Math.max(frontAt(x, y, 0.016 * S) + 0.005 * S, kz - 0.004 * S - t * 0.05 * S);
        rows.push([v3(x - 0.0035 * S, y, z), v3(x + 0.0035 * S, y, z)]);
      }
      bow.push(colorize(ribbon(rows, 0.0025 * S), bowc));
    }
    pin(bow, upperChest);
  }

  if (d.print) {
    // A square print on the chest, and the round yellow creature on it.
    const yc = min.y + 0.728 * H;
    const half = 0.056 * S;
    const zAt = (y, w) => Math.max(frontAt(cx - w, y), frontAt(cx, y), frontAt(cx + w, y));
    const square = [];
    for (let k = 0; k <= 6; k++) {
      const y = yc + half - (2 * half * k) / 6;
      const z = zAt(y, half) + 0.004 * S;
      square.push([v3(cx - half, y, z), v3(cx + half, y, z)]);
    }
    const zp = Math.max(...square.map(([l]) => l.z));
    const art = [colorize(ribbon(square, 0.003 * S), color(o.print, "#17161b"))];
    const rr = 0.03 * S;
    const yb = yc - 0.008 * S;
    const blob = [];
    for (let k = 0; k <= 14; k++) {
      const y = yb + rr + 0.014 * S - (k / 14) * (2 * rr + 0.014 * S);
      const body = Math.sqrt(Math.max(0, rr * rr - (y - yb) ** 2));
      const knob = Math.sqrt(Math.max(0, (0.009 * S) ** 2 - (y - (yb + rr + 0.004 * S)) ** 2));
      const hw = Math.max(body, knob);
      blob.push([v3(cx - hw, y, zp + 0.002 * S), v3(cx + hw, y, zp + 0.002 * S)]);
    }
    art.push(colorize(ribbon(blob, 0.002 * S), color(o.printArt, "#e8b25c")));
    for (const s of [-1, 1]) {
      const dot = new THREE.SphereGeometry(0.0042 * S, 8, 6);
      dot.scale(1, 1.3, 0.4);
      dot.translate(cx + s * 0.011 * S, yb + 0.006 * S, zp + 0.003 * S);
      art.push(colorize(dot, color(o.print, "#17161b")));
    }
    pin(art, upperChest);
  }

  if (d.backpack) {
    // A leather school bag worn on both shoulders: the case low on the back,
    // its flap and clasp, and a strap looped over each shoulder.
    const leather = color(o.backpack, "#8a4a26");
    const yBag = min.y + 0.645 * H;
    const back = slab((x, y) => Math.abs(x - cx) < 0.1 * S && Math.abs(y - yBag) < 0.06 * S);
    if (back) {
      const [bw, bh, bd] = [0.22 * S, 0.26 * S, 0.075 * S];
      const zb = back.min.z - 0.008 * S - bd / 2;
      const kit = [];
      const bag = new RoundedBoxGeometry(bw, bh, bd, 2, 0.018 * S);
      bag.translate(cx, yBag, zb);
      kit.push(colorize(bag, leather));
      const flap = new RoundedBoxGeometry(bw + 0.006 * S, 0.62 * bh, 0.012 * S, 2, 0.005 * S);
      flap.translate(cx, yBag + 0.19 * bh, zb - bd / 2 - 0.004 * S);
      kit.push(colorize(flap, leather.clone().multiplyScalar(0.84)));
      const clasp = new THREE.BoxGeometry(0.03 * S, 0.026 * S, 0.008 * S);
      clasp.translate(cx, yBag - 0.12 * bh, zb - bd / 2 - 0.011 * S);
      kit.push(colorize(clasp, metal));
      for (const s of [-1, 1]) {
        const xs = cx + s * 0.095 * S;
        const sh = slab((x, y) => Math.abs(x - xs) < 0.012 * S && y > min.y + 0.775 * H && y < min.y + 0.87 * H);
        if (!sh) continue;
        const ry = 0.075 * S;
        const loop = new THREE.TorusGeometry(1, 0.08, 4, 40);
        loop.rotateY(Math.PI / 2);
        loop.scale(0.013 * S / 0.08, ry, (sh.max.z - sh.min.z) / 2 + 0.012 * S);
        loop.translate(xs, sh.max.y - ry - 0.004 * S, (sh.min.z + sh.max.z) / 2);
        // On the collarbone, so the strap rides the shoulder as the arm comes down.
        pin([colorize(loop, leather.clone().multiplyScalar(0.92))], bone(s > 0 ? "clavicle_l" : "clavicle_r", upperChest));
      }
      pin(kit, upperChest);
    }
  }

  if (d.shorts) {
    // The hem of wide shorts (or a short skirt's edge): a flared cuff round
    // each thigh at the painted hem, so the leg of the shorts stands off the skin.
    const yh = min.y + ((o.waist ?? 0.575) - (o.skirt ?? 0.17)) * H;
    for (const s of [1, -1]) {
      const leg = legAt(yh, s);
      if (!leg) continue;
      const r = Math.max(leg.max.x - leg.min.x, leg.max.z - leg.min.z) / 2;
      const h = 0.075 * S;
      const cuff = new THREE.CylinderGeometry(r + 0.004 * S, r + 0.017 * S, h, 28, 1, true);
      cuff.translate((leg.min.x + leg.max.x) / 2, yh + h / 2 - 0.004 * S, (leg.min.z + leg.max.z) / 2);
      pin([colorize(cuff, color(o.bottom, "#1d2230"))], bone(s > 0 ? rig.bones.lHip : rig.bones.rHip));
    }
  }

  if (d.bun || d.ponytail || d.fringe) {
    // Gathered hair: a low bun or a low ponytail at the nape, and a side-swept
    // fringe falling over one eye (`fringe`: "left" or "right", hers).
    const { c0, ax, eyeTop, root, tip } = hairCap();
    const q = new THREE.Quaternion();
    const nape = v3(cx, c0.y - 0.62 * ax.y, c0.z - 0.86 * ax.z);
    const locks = [];
    if (d.bun) {
      const bun = new THREE.SphereGeometry(0.042 * S, 14, 10);
      bun.scale(1.15, 0.85, 0.8);
      bun.translate(nape.x, nape.y + 0.01 * S, nape.z - 0.022 * S);
      locks.push(colorize(bun, (x, y) => root.clone().lerp(tip, Math.min(1, Math.max(0, (y - nape.y) / (0.08 * S) + 0.5)))));
    }
    if (d.ponytail) {
      // The tie, then the tail: three tapering locks hanging down the back.
      const tie = new THREE.TorusGeometry(0.016 * S, 0.006 * S, 6, 16);
      tie.translate(nape.x, nape.y, nape.z - 0.012 * S);
      locks.push(colorize(tie, root.clone().multiplyScalar(0.5)));
      [[0, 0.17, 0.028], [-0.012, 0.13, 0.02], [0.012, 0.14, 0.02]].forEach(([dx, len, rad], i) => {
        const g = wedge(rad * S, len * S, 0.7, hash(i + 11) * Math.PI, root, tip);
        g.applyQuaternion(q.setFromUnitVectors(UP, v3(dx * 4, -1, -0.14).normalize()));
        g.translate(nape.x + dx * S, nape.y + 0.004 * S, nape.z - 0.018 * S);
        locks.push(g);
      });
    }
    if (d.fringe) {
      // From a parting on the other side, flat locks sweeping down across the eye.
      const s = d.fringe === "left" ? 1 : -1;
      [[0.03, 0.0], [0.012, -0.012], [-0.006, -0.022], [-0.024, -0.03]].forEach(([x0, dy], i) => {
        const yf = eyeTop + 0.085 * S;
        const yt = eyeTop + (dy - 0.012) * S;
        const xa = cx - s * x0 * S;
        const xb = cx + s * (0.03 + 0.012 * i) * S;
        const from = v3(xa, yf, frontAt(xa, yf, 0.02 * S) + 0.012 * S);
        const to = v3(xb, yt, frontAt(xb, yt, 0.02 * S) + 0.018 * S);
        const run = to.clone().sub(from);
        const g = wedge(0.03 * S, run.length(), 0.4, 0, root, tip);
        g.applyQuaternion(q.setFromUnitVectors(UP, run.normalize()));
        g.translate(from.x, from.y, from.z);
        locks.push(g);
      });
    }
    pin(locks, bone(rig.bones.head));
  }
  return pieces;
};

/* --------------------------------------------------------------------------
 * Hands.
 *
 *   fig.setHand("right", "fist");             // a named pose, full weight
 *   fig.setHand("left", "point", 0.6);        // 60% of the way from the resting hand
 *   fig.setHands("open");                     // both
 *   fig.setHand("right", "grip", 1, { radius: 0.04 });   // wrapped round a 4 cm cylinder
 *   fig.hold(mug, { hand: "right", grip: "grip", radius: 0.042 });
 *   fig.hold(brush, { hand: "right", grip: "pinch" });
 *   fig.release("right", { to: table });      // keeps its world transform
 *
 * Poses: `relaxed` (the resting hand: softly curled), `open`, `fist`, `point`,
 * `pinch` (thumb pad to index pad) and `grip` (fingers and thumb wrapped round
 * a cylinder of `radius`, in figure units ≈ metres). Fist, grip and pinch are
 * solved against the hand's own measured shape — palm thickness, finger
 * thickness, bone lengths — so fingers stop at the palm or the object instead
 * of passing through it.
 *
 * Held objects follow a convention: the object's ORIGIN is the point that sits
 * in the hand, its +Y runs through the fist and out past the thumb and index
 * finger (a mug's up, a hilt toward the blade, a hammer haft toward the head),
 * and its +Z points along the fingers. `offset` (in the object's own units)
 * says which point of the object to grip; `rotation` (Euler or Quaternion)
 * turns it in the hand after that.
 *
 * Everything is measured in the hand bone's frame from the rig's bind pose,
 * so it works for the male and female bodies and any height.
 * ------------------------------------------------------------------------ */

const FINGERS = ["index", "middle", "ring", "pinky"];
const SPREAD = { index: 1, middle: 0, ring: -0.6, pinky: -1.3 };
const CURL_MAX = [1.55, 1.75, 1.15];
const SIDES = { l: "l", left: "l", r: "r", right: "r" };

/** The fixed poses. `thumb` is [toward palm, across palm, flex, tip flex]. */
export const HAND_POSES = {
  open: { index: [0.04, 0.06, 0.03], middle: [0.04, 0.06, 0.03], ring: [0.05, 0.06, 0.03], pinky: [0.06, 0.07, 0.04], thumb: [-0.05, -0.15, 0.05, 0.05], spread: 0.1 },
  relaxed: { index: [0.3, 0.42, 0.22], middle: [0.38, 0.5, 0.26], ring: [0.46, 0.56, 0.3], pinky: [0.54, 0.62, 0.32], thumb: [0.22, 0.18, 0.2, 0.18], spread: 0.02 },
};

/** A linear blend of two hand poses. */
export const blendHand = (a, b, t) => {
  const out = { spread: (a.spread ?? 0) + ((b.spread ?? 0) - (a.spread ?? 0)) * t };
  for (const k of [...FINGERS, "thumb"]) {
    const x = a[k] ?? [0, 0, 0, 0];
    const y = b[k] ?? [0, 0, 0, 0];
    out[k] = x.map((v, i) => v + ((y[i] ?? 0) - v) * t);
  }
  return out;
};

/** The old `fist: n` option: n radians of curl, now about the right axis. */
const curlPose = (n) => {
  const f = (k) => [0.8 * n * k, 0.95 * n * k, 0.55 * n * k];
  return { index: f(0.9), middle: f(1), ring: f(1.05), pinky: f(1.1), thumb: [0.25 * n, 0.25 * n, 0.3 * n, 0.25 * n], spread: 0 };
};

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

/** Bind-pose vertices of `body`, each in the local frame of its dominant bone. */
const boneLocalVertices = (body) => {
  const pos = body.geometry.attributes.position;
  const si = body.geometry.attributes.skinIndex;
  const sw = body.geometry.attributes.skinWeight;
  const { bones, boneInverses } = body.skeleton;
  const out = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < pos.count; i++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k;
    const b = si.getComponent(i, best);
    const world = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(body.bindMatrix);
    out.push({ bone: bones[b], inv: boneInverses[b], world, local: world.clone().applyMatrix4(m.copy(boneInverses[b])) });
  }
  return out;
};

/**
 * Measure one hand in its own bone frame: the finger chains, the palm's axes
 * (u along the fingers, n out of the palm, w toward the thumb), the palm and
 * finger thickness. Called before the rig touches the arms.
 */
const measureHand = (model, verts, s) => {
  const hand = model.getObjectByName(`hand_${s}`);
  if (!hand) return null;
  model.updateMatrixWorld(true);
  const inv = hand.matrixWorld.clone().invert();
  const handQ = hand.getWorldQuaternion(new THREE.Quaternion()).invert();
  const at = (o) => o.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
  const chain = (name) => {
    const bones = [1, 2, 3].map((k) => model.getObjectByName(`${name}_0${k}_${s}`));
    if (bones.some((b) => !b)) return null;
    const leaf = model.getObjectByName(`${name}_04_leaf_${s}`);
    const pts = bones.map(at);
    pts.push(leaf ? at(leaf) : pts[2].clone().add(pts[2].clone().sub(pts[1])));
    // Each bone's rest rotation relative to the hand, to carry hand-frame axes into it.
    const rel = bones.map((b) => handQ.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion())));
    return { bones, rest: bones.map((b) => b.quaternion.clone()), pts, rel };
  };
  const fingers = Object.fromEntries(FINGERS.map((f) => [f, chain(f)]));
  const thumb = chain("thumb");
  if (FINGERS.some((f) => !fingers[f]) || !thumb) return null;

  const u = fingers.middle.pts[3].clone().sub(fingers.middle.pts[0]).normalize();
  const w = fingers.index.pts[0].clone().sub(fingers.pinky.pts[0]);
  w.addScaledVector(u, -w.dot(u)).normalize();
  const n = new THREE.Vector3().crossVectors(u, w);
  if (n.dot(thumb.pts[3]) < 0) n.negate(); // the thumb hangs on the palm side
  const curl = new THREE.Vector3().crossVectors(u, n).normalize(); // turns u toward n
  const spread = new THREE.Vector3().crossVectors(u, w).normalize(); // turns u toward w
  const td = thumb.pts[1].clone().sub(thumb.pts[0]).normalize();
  const tA = new THREE.Vector3().crossVectors(td, n).normalize(); // thumb toward the palm
  const tB = new THREE.Vector3().crossVectors(td, w.clone().negate()).normalize(); // thumb across it

  // Palm and finger thickness, from the skin round the bones.
  const handVerts = verts.filter((v) => v.bone === hand).map((v) => v.local);
  const mcpU = FINGERS.reduce((a, f) => a + fingers[f].pts[0].dot(u), 0) / 4;
  const wMid = FINGERS.reduce((a, f) => a + fingers[f].pts[0].dot(w), 0) / 4;
  const span = Math.abs(fingers.index.pts[0].dot(w) - fingers.pinky.pts[0].dot(w));
  let palmPad = 0;
  for (const p of handVerts) {
    const pu = p.dot(u);
    if (pu > 0.35 * mcpU && pu < 0.95 * mcpU && Math.abs(p.dot(w) - wMid) < 0.35 * span) palmPad = Math.max(palmPad, p.dot(n));
  }
  const mid = fingers.middle;
  let fingerPad = 0;
  for (const v of verts) {
    if (v.bone !== mid.bones[1]) continue;
    const p = v.world.clone().applyMatrix4(inv);
    fingerPad = Math.max(fingerPad, p.sub(mid.pts[1]).dot(n));
  }
  const len = mid.pts[0].distanceTo(mid.pts[3]);
  if (!palmPad) palmPad = 0.3 * len;
  if (!fingerPad) fingerPad = 0.12 * len;

  // Axes carried into each bone's own frame.
  const local = (axis, rel) => axis.clone().applyQuaternion(rel.clone().invert());
  for (const f of FINGERS) {
    const c = fingers[f];
    c.curl = c.rel.map((r) => local(curl, r));
    c.spread = local(spread, c.rel[0]);
  }
  thumb.a = local(tA, thumb.rel[0]);
  thumb.b = thumb.rel.map((r) => local(tB, r));

  return { side: s, bone: hand, u, n, w, curl, spread, tA, tB, fingers, thumb, palmPad, fingerPad, mcpU, wMid, span, len, cache: new Map(), holder: null, held: null };
};

/** Forward kinematics in the hand frame: the posed joints of one chain. */
const fingerFK = (H, f, angles, spread = 0) => {
  const c = H.fingers[f];
  const q = new THREE.Quaternion().setFromAxisAngle(H.spread, spread * SPREAD[f]);
  const out = [c.pts[0].clone()];
  for (let k = 0; k < 3; k++) {
    q.multiply(_q.setFromAxisAngle(H.curl, angles[k]));
    out.push(out[k].clone().add(c.pts[k + 1].clone().sub(c.pts[k]).applyQuaternion(q)));
  }
  return out;
};
const thumbFK = (H, [a, b, c2, c3]) => {
  const t = H.thumb;
  const q = new THREE.Quaternion().setFromAxisAngle(H.tA, a).multiply(_q.setFromAxisAngle(H.tB, b));
  const out = [t.pts[0].clone()];
  [0, c2, c3].forEach((ang, k) => {
    if (k) q.multiply(_q.setFromAxisAngle(H.tB, ang));
    out.push(out[k].clone().add(t.pts[k + 1].clone().sub(t.pts[k]).applyQuaternion(q)));
  });
  return out;
};

/**
 * What a finger must not pass through: the palm, and (for a grip) the held
 * cylinder, its axis along w through `C`. Negative inside.
 */
const obstacle = (H, C, rho) => (p) => {
  let d = Infinity;
  const pu = p.dot(H.u);
  if (pu > -0.1 * H.mcpU && pu < 0.88 * H.mcpU) d = p.dot(H.n) - (H.palmPad + H.fingerPad);
  if (C) {
    const du = pu - C.dot(H.u);
    const dn = p.dot(H.n) - C.dot(H.n);
    d = Math.min(d, Math.hypot(du, dn) - rho);
  }
  return d;
};

/** Curl each joint in turn until its bone meets `sdf` (or reaches its limit). */
const wrap = (H, f, sdf, max = CURL_MAX) => {
  const ang = [0, 0, 0];
  const touches = (k) => {
    const pts = fingerFK(H, f, ang);
    for (let t = k ? 0.2 : 0.35; t <= 1.0001; t += 0.2) if (sdf(_v.lerpVectors(pts[k], pts[k + 1], t)) < 0) return true;
    return false;
  };
  for (let k = 0; k < 3; k++) {
    ang[k] = 0;
    // Already in it with this joint straight: the joint before closed too far. Open it.
    while (k && ang[k - 1] > 0 && touches(k)) ang[k - 1] = Math.max(0, ang[k - 1] - 0.025);
    for (let phi = 0.025; phi <= max[k] + 1e-6; phi += 0.025) {
      ang[k] = phi;
      if (touches(k)) {
        ang[k] = phi - 0.025;
        break;
      }
    }
  }
  return ang;
};

/** Thumb angles bringing its tip to `target` without entering `sdf`. */
const reachThumb = (H, target, sdf) => {
  const cost = (p) => {
    const pts = thumbFK(H, p);
    let c = pts[3].distanceToSquared(target);
    if (sdf) {
      for (let k = 1; k < 3; k++) {
        for (let t = 0.25; t <= 1.0001; t += 0.25) {
          const d = sdf(_v.lerpVectors(pts[k], pts[k + 1], t));
          if (d < 0) c += 400 * d * d;
        }
      }
    }
    return c;
  };
  let best = [0, 0, 0, 0];
  let bestC = Infinity;
  for (let a = -0.8; a <= 1.6; a += 0.12)
    for (let b = -0.8; b <= 1.8; b += 0.12)
      for (let c = -0.2; c <= 1.5; c += 0.1) {
        const p = [a, b, c, c * 0.85];
        const v = cost(p);
        if (v < bestC) (bestC = v), (best = p);
      }
  // Refine.
  for (let step = 0.05; step > 0.005; step /= 2) {
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < 4; i++)
        for (const s of [-1, 1]) {
          const p = best.slice();
          p[i] += s * step;
          const v = cost(p);
          if (v < bestC) (bestC = v), (best = p), (moved = true);
        }
    }
  }
  return best;
};

/** Pad normal of a posed segment: the side that faces the palm. */
const padNormal = (H, a, b) => new THREE.Vector3().crossVectors(H.curl, b.clone().sub(a)).normalize();

/** Solved poses, cached per hand. `r` is in hand-frame units. */
const solvePose = (H, name, r = 0) => {
  const key = name === "grip" ? `grip:${r.toFixed(4)}` : name;
  if (H.cache.has(key)) return H.cache.get(key);
  let pose;
  if (name === "fist" || name === "point") {
    const sdf = obstacle(H, null, 0);
    pose = { spread: -0.04 };
    // The middle joints stop short of their limit so the fingertips can tuck in.
    for (const f of FINGERS) pose[f] = wrap(H, f, sdf, [1.5, 1.4, 1.2]);
    if (name === "point") pose.index = [0.04, 0.05, 0.03];
    // Thumb across the middle phalanges of the index and middle fingers.
    const fi = fingerFK(H, name === "point" ? "middle" : "index", pose[name === "point" ? "middle" : "index"], pose.spread);
    const fm = fingerFK(H, name === "point" ? "ring" : "middle", pose[name === "point" ? "ring" : "middle"], pose.spread);
    const midI = fi[1].clone().lerp(fi[2], 0.5);
    const midM = fm[1].clone().lerp(fm[2], 0.5);
    const target = midI.lerp(midM, 0.3).addScaledVector(padNormal(H, fi[1], fi[2]), -2 * H.fingerPad);
    pose.thumb = reachThumb(H, target, null);
  } else if (name === "pinch") {
    pose = { index: [0.62, 0.78, 0.36], middle: [0.8, 0.92, 0.46], ring: [1.0, 1.05, 0.5], pinky: [1.1, 1.1, 0.52], spread: 0 };
    // If the thumb cannot reach the index pad, bring the index down to meet it.
    for (let tries = 0; tries < 5; tries++) {
      const fi = fingerFK(H, "index", pose.index);
      const pad = padNormal(H, fi[2], fi[3]);
      const target = fi[3].clone().addScaledVector(pad, 2 * H.fingerPad).addScaledVector(fi[3].clone().sub(fi[2]).normalize(), -0.25 * H.fingerPad);
      pose.thumb = reachThumb(H, target, null);
      pose.socket = fi[3].clone().addScaledVector(pad, H.fingerPad).lerp(thumbFK(H, pose.thumb)[3], 0.5 - H.fingerPad / Math.max(1e-6, 2 * fi[3].distanceTo(thumbFK(H, pose.thumb)[3])));
      if (thumbFK(H, pose.thumb)[3].distanceTo(target) < 0.5 * H.fingerPad) break;
      pose.index = pose.index.map((x, i) => x + [0.12, 0.1, 0.05][i]);
    }
  } else if (name === "grip") {
    const C = H.u.clone().multiplyScalar(H.mcpU - 0.25 * r - 0.2 * H.fingerPad).addScaledVector(H.n, H.palmPad + r).addScaledVector(H.w, H.wMid + 0.1 * H.span);
    const rho = r + H.fingerPad;
    const sdf = obstacle(H, C, rho);
    pose = { spread: -0.02 };
    for (const f of FINGERS) pose[f] = wrap(H, f, sdf);
    // The thumb round the far side, toward the index fingertip.
    const dir = H.n.clone().multiplyScalar(0.8).addScaledVector(H.u, 0.35).normalize();
    const target = C.clone().addScaledVector(dir, rho).addScaledVector(H.w, H.fingers.index.pts[0].dot(H.w) - C.dot(H.w));
    pose.thumb = reachThumb(H, target, sdf);
    pose.socket = C;
  } else pose = HAND_POSES[name] ?? HAND_POSES.relaxed;
  H.cache.set(key, pose);
  return pose;
};

/** Set the finger bones of one hand to `pose`. */
const poseHand = (H, pose) => {
  const spread = pose.spread ?? 0;
  for (const f of FINGERS) {
    const c = H.fingers[f];
    const a = pose[f] ?? [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const b = c.bones[k].quaternion.copy(c.rest[k]);
      if (k === 0) b.multiply(_q.setFromAxisAngle(c.spread, spread * SPREAD[f]));
      b.multiply(_q.setFromAxisAngle(c.curl[k], a[k] ?? 0));
    }
  }
  const t = H.thumb;
  const [a, b, c2, c3] = pose.thumb ?? [0, 0, 0, 0];
  t.bones[0].quaternion.copy(t.rest[0]).multiply(_q.setFromAxisAngle(t.a, a)).multiply(_q2.setFromAxisAngle(t.b[0], b));
  t.bones[1].quaternion.copy(t.rest[1]).multiply(_q.setFromAxisAngle(t.b[1], c2));
  t.bones[2].quaternion.copy(t.rest[2]).multiply(_q.setFromAxisAngle(t.b[2], c3));
};

/**
 * Where the soles and the seat are, as points in their bones' frames: the
 * bottom of each foot (heel to toe tip), and the backs of the thighs and the
 * buttocks. Posed each frame through the bones, they say exactly how far the
 * figure is off the floor or the chair.
 */
const measureContacts = (model, verts) => {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const v of verts) (minY = Math.min(minY, v.world.y)), (maxY = Math.max(maxY, v.world.y));
  const H = maxY - minY;
  const footBones = new Set(["foot_l", "foot_r", "ball_l", "ball_r", "ball_leaf_l", "ball_leaf_r", "calf_l", "calf_r"].map((n) => model.getObjectByName(n)).filter(Boolean));
  const sole = [];
  for (const side of [-1, 1]) {
    // The bottom layer of this foot, then a spread of points along it.
    const bottom = verts.filter((v) => v.world.y < minY + 0.008 * H && Math.sign(v.world.x) === side && footBones.has(v.bone));
    if (!bottom.length) continue;
    // Each point dropped onto the floor plane first, so at rest they all read exactly 0.
    const onFloor = (v) => ({ bone: v.bone, local: new THREE.Vector3(v.world.x, minY, v.world.z).applyMatrix4(v.inv) });
    bottom.sort((a, b) => a.world.z - b.world.z);
    for (const t of [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1]) sole.push(onFloor(bottom[Math.round(t * (bottom.length - 1))]));
    // The inner and outer edges at the ball.
    const ball = bottom.filter((v) => v.world.z > bottom[Math.round(0.6 * (bottom.length - 1))].world.z);
    if (ball.length) {
      ball.sort((a, b) => a.world.x - b.world.x);
      sole.push(onFloor(ball[0]), onFloor(ball[ball.length - 1]));
    }
  }
  const seat = [];
  const hips = ["thigh_l", "thigh_r"].map((n) => model.getObjectByName(n));
  const knees = ["calf_l", "calf_r"].map((n) => model.getObjectByName(n));
  const pelvis = model.getObjectByName("pelvis");
  const allowed = new Set([...hips, pelvis].filter(Boolean));
  hips.forEach((hip, i) => {
    if (!hip || !knees[i]) return;
    const a = hip.getWorldPosition(new THREE.Vector3());
    const b = knees[i].getWorldPosition(new THREE.Vector3());
    const L = a.distanceTo(b);
    const dir = b.clone().sub(a).normalize();
    for (const t of [-0.05, 0.08, 0.25, 0.45, 0.65]) {
      let best = null;
      for (const v of verts) {
        if (!allowed.has(v.bone)) continue;
        const rel = v.world.clone().sub(a);
        const along = rel.dot(dir) / L;
        if (Math.abs(along - t) > 0.06 || Math.sign(v.world.x || 1) !== Math.sign(a.x || 1)) continue;
        if (!best || v.world.z < best.world.z) best = v; // the back of the thigh (the body faces +z)
      }
      if (best) seat.push({ bone: best.bone, local: best.local.clone() });
    }
  });
  return { sole, seat };
};

export const createModelFigure = async ({ body = "SuperheroMale", height = 1.85, ink = {}, line, material, hair = [], horns = false, fist, hands, outfit = null, dress = null }) => {
  const [{ root: model }, ...parts] = await Promise.all([loadModel(url(body)), ...hair.map((h) => loadModel(url(h)))]);
  parts.forEach((p) => attachSkinned(model, p.root));
  if (outfit) {
    // Under a top, the female base's bust is draped as cloth (see drapeChest).
    paintOutfit(model, outfit, { drape: outfit.drape ?? body === "SuperheroFemale", shod: footwearOf(outfit, dress ?? {}) !== "none" });
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
    if (outfit) clothShading(mat);
  }
  // Measure the hands and the soles at bind pose, before the rig swings the arms.
  let skinned = null;
  model.traverse((m) => m.isSkinnedMesh && (!skinned || m.geometry.attributes.position.count > skinned.geometry.attributes.position.count) && (skinned = m));
  model.updateMatrixWorld(true);
  const verts = skinned?.geometry.attributes.skinIndex ? boneLocalVertices(skinned) : [];
  const handData = { l: verts.length ? measureHand(model, verts, "l") : null, r: verts.length ? measureHand(model, verts, "r") : null };
  const contacts = verts.length ? measureContacts(model, verts) : { sole: [], seat: [] };
  const rig = createRig(model, { fist: 0 });
  // The resting hand: `hands` if given, else the old `fist` curl, else relaxed.
  const restPose = hands && typeof hands === "object" ? hands : hands == null && fist != null ? curlPose(fist) : null;
  for (const H of Object.values(handData)) {
    if (!H) continue;
    H.base = restPose ?? solvePose(H, typeof hands === "string" ? hands : "relaxed");
    H.current = H.base;
    poseHand(H, H.base);
  }

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
  // After the fit, so his hair does not shrink him to keep the same height.
  // Every figure drawn in ink gets shoes; a figure drawn as light stays a silhouette.
  if (outfit || !material) addDress(model, rig, mat, line, outfit ?? {}, dress ?? {});
  const root = new THREE.Group();
  root.add(model);

  const sidesOf = (hand) => (hand === "both" ? ["l", "r"] : [SIDES[hand] ?? "r"]);
  /** Scale from this figure's root units to the hand bone's frame. */
  const toHand = (H) => {
    root.updateMatrixWorld(true);
    return root.getWorldScale(_v).x / H.bone.getWorldScale(new THREE.Vector3()).x;
  };
  /** A pose by name (solved for this hand) or a pose object. */
  const resolve = (H, pose, radius) => (typeof pose === "string" ? solvePose(H, pose, pose === "grip" ? radius * toHand(H) : 0) : pose);

  /**
   * Pose a hand: `pose` is a name from HAND_POSES (or fist, point, pinch,
   * grip) or a pose object; `weight` blends from the resting hand toward it.
   *   fig.setHand("right", "grip", 1, { radius: 0.03 })
   */
  const setHand = (hand, pose, weight = 1, { radius = 0.016 } = {}) => {
    for (const s of sidesOf(hand)) {
      const H = handData[s];
      if (!H) continue;
      const target = resolve(H, pose, radius);
      H.current = weight >= 1 ? target : blendHand(H.base, target, Math.max(0, weight));
      poseHand(H, H.current);
    }
  };
  const setHands = (pose, weight = 1, o) => setHand("both", pose, weight, o);

  /**
   * The point in the hand where a held object sits, as an Object3D riding the
   * hand bone (scaled back to root units). Its axes: +Y out past the thumb, +Z
   * along the fingers. Made on first use; `hold` puts it in the grip.
   */
  const socket = (hand = "right") => {
    const H = handData[sidesOf(hand)[0]];
    if (!H) return null;
    if (!H.holder) {
      H.holder = new THREE.Object3D();
      H.holder.name = `hold_${H.side}`;
      H.bone.add(H.holder);
      const z = H.u.clone();
      const y = H.w.clone();
      const x = new THREE.Vector3().crossVectors(y, z);
      H.holder.quaternion.setFromRotationMatrix(_m.makeBasis(x, y, z));
      H.holder.position.copy(solvePose(H, "grip", 0.016 * toHand(H)).socket);
    }
    H.holder.scale.setScalar(toHand(H));
    return H.holder;
  };

  /**
   * Put `object` in a hand, inside the curled grip, and close the hand on it.
   *   grip: "grip" (wrap a cylinder of `radius`), "pinch", or "fist"
   *   offset: the point of the object to hold, in its own units
   *   rotation: an Euler or Quaternion applied in the hand after the convention
   *   weight: how far the fingers close (1 = touching)
   * Returns the object. Re-holding swaps out whatever was there.
   */
  const hold = (object, { hand = "right", grip = "grip", radius = 0.016, offset = null, rotation = null, weight = 1 } = {}) => {
    const s = sidesOf(hand)[0];
    const H = handData[s];
    if (!H) return object;
    if (H.held && H.held !== object) release(s);
    const holder = socket(s);
    const pose = solvePose(H, grip, grip === "grip" ? radius * toHand(H) : 0);
    if (pose.socket) holder.position.copy(pose.socket);
    else {
      // A fist: the middle of the curled fingers.
      const f = fingerFK(H, "middle", pose.middle, pose.spread);
      holder.position.copy(f[1]).lerp(f[2], 0.5).lerp(H.fingers.middle.pts[0], 0.35);
    }
    setHand(s, pose, weight);
    if (rotation) object.quaternion.copy(rotation.isQuaternion ? rotation : _q.setFromEuler(rotation));
    else object.quaternion.identity();
    object.position.set(0, 0, 0);
    if (offset) object.position.copy(offset).applyQuaternion(object.quaternion).negate();
    holder.add(object);
    H.held = object;
    return object;
  };

  /**
   * Let go. With `to`, the object is re-parented there keeping its world
   * transform (dropped on the table where it was); otherwise it is detached.
   * The hand goes back to rest unless `keepPose`.
   */
  const release = (hand = "right", { to = null, keepPose = false } = {}) => {
    const H = handData[sidesOf(hand)[0]];
    if (!H?.held) return null;
    const object = H.held;
    H.held = null;
    if (to) {
      to.updateMatrixWorld(true);
      to.attach(object);
    } else object.removeFromParent();
    if (!keepPose) setHand(H.side, H.base);
    return object;
  };

  /** The lowest of `points` in the root's parent space, after posing. */
  const lowest = (points) => {
    root.updateMatrixWorld(true);
    const toParent = root.parent ? _m.copy(root.parent.matrixWorld).invert() : _m.identity();
    let y = Infinity;
    for (const p of points) y = Math.min(y, _v.copy(p.local).applyMatrix4(p.bone.matrixWorld).applyMatrix4(toParent).y);
    return y;
  };
  const settleOn = (points, y, update) => {
    if (!points.length) return 0;
    const dy = y - lowest(points);
    root.position.y += dy;
    if (update) root.updateMatrixWorld(true);
    return dy;
  };
  /**
   * After apply(pose): move the root up or down so the lowest point of either
   * sole (heel, ball or toe tip) sits exactly at height `y` in the root's
   * parent space. Cheap enough for every frame. Returns the shift.
   *   fig.apply(walkPose(t)); fig.groundTo(0);
   */
  const groundTo = (y = 0, { update = true } = {}) => settleOn(contacts.sole, y, update);
  /**
   * The seated version: the backs of the thighs and the buttocks rest at `y`
   * (the top of the seat). Call after a seated pose.
   *   fig.apply(SIT); fig.seatOn(0.46);
   */
  const seatOn = (y, { update = true } = {}) => settleOn(contacts.seat, y, update);

  return { root, model, apply: rig.apply, bones: rig.bones, setHand, setHands, hold, release, socket, groundTo, seatOn, handRig: handData };
};
