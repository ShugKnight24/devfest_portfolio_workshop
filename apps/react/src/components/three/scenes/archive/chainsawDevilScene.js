// ARCHIVED: the "Alone, it is a chainsaw" scene, cut from the DevFest deck.
// To bring it back, move this file up to scenes/, set its imports back to
// "../", register "chainsaw-devil" in SceneStage.jsx (FILM, fov 40), and put
// the slide below back after "hands-up-act-3".
//
// The slide, as it stood in devfestSlides.js:
//
//     {
//       id: "devil-scene",
//       altitude: ALTITUDE.CONCEPT,
//       type: "scene",
//       tier: TIER.CORE,
//       budget: 30,
//       scene: "chainsaw-devil",
//       phase: "Finale",
//       title: "Alone, it is a chainsaw.\nWith a crew, it is a devil.",
//       fireLabel: "Wake it",
//       firedLabel: "Awake",
//       beats: [{ kind: "scene" }],
//       alt: "Film-style animation on a black page: a giant black chainsaw devil, plated like armour, with a chainsaw bar for a head and spiked blades for forearms, crouches over three small devils with black cords trailing from him; on the beat he rises to full height, the saws rev, the cords whip out and he roars VRRRRRRMMM.",
//     },
//
// // Presenter note:
//     "devil-scene":
//       "Click once and let him roar. Then quietly: 'Alone, it is a chainsaw. With a crew behind it, it is this.' Do not explain the metaphor.",

import * as THREE from "three";
import { OUTFITS } from "../../rezeKit";
import { clamp01, easeInOutCubic, easeOutBack, easeOutCubic, hash, lerp, segment } from "../../kit";
import { PAPER, inkMaterial, mangaBackdrop, outline, outlineMaterial, syncInk, setInkStyle } from "../../ink";
import { createModelFigure } from "../../modelFigure";
import { aim, createBlade } from "../../chainsawParts";
import { createSfx } from "../../sfx";

/**
 * The Chainsaw Devil, true form — the finale. Pochita as the Hero of Hell, the
 * way the manga draws him in the Control Devil fight: a gaunt black giant,
 * every inch of him plated in overlapping carapace, a chainsaw engine for a
 * head with its bar jutting up and a curtain of long thin teeth hanging under
 * it, forearms that end in spiked bars longer than his arms, spines on his
 * shoulders and back, and black guts that flail out of him through the frame.
 * Three lesser devils crouch in front of him for scale. The camera sits on the
 * ground looking up.
 *
 *   armed   crouched over the three of them: he breathes, the cords sway,
 *           the chains tick over, his head turns
 *   fired   (3.2 s, then holds)
 *     0.00–0.38  he rises and straightens to full height; the camera tilts up
 *     0.18–0.50  the saws rev (VRRN VRRN): chains run up to speed, arms shake
 *     0.32–0.78  the cords whip out across the frame, then stay agitated
 *     0.55–0.75  the roar: chest thrown open, head back, arms flung wide,
 *                VRRRRRRMMM!!!, the ground and camera shake
 */

const DURATION = 3.2;
const TAU = Math.PI * 2;

// Poses: Euler [x, y, z] per joint. Spine joints grow up (+x leans forward);
// limbs hang down (-x swings forward). Right side mirrors the left.
const side = (pose) => {
  const out = { ...pose };
  for (const [l, r] of [
    ["lSh", "rSh"],
    ["lEl", "rEl"],
    ["lWr", "rWr"],
    ["lHip", "rHip"],
    ["lKnee", "rKnee"],
    ["lAnk", "rAnk"],
  ]) {
    const [x, y, z] = pose[l];
    out[r] = pose[r] ?? [x, -y, -z];
  }
  return out;
};
const CROUCH = side({
  pelvis: [0.4, 0, 0],
  waist: [0.36, 0, 0],
  chest: [0.32, 0, 0],
  neck: [0.25, 0, 0],
  head: [-0.75, 0, 0],
  lSh: [-1.3, 0, 0.3],
  lEl: [-0.75, 0, 0],
  lWr: [0.25, 0, 0],
  lHip: [-1.45, 0, 0.2],
  lKnee: [2.0, 0, 0],
  lAnk: [-0.95, 0, 0],
  curl: 1,
});
const RISEN = side({
  pelvis: [0.1, 0, 0],
  waist: [0.12, 0, 0],
  chest: [0.16, 0, 0],
  neck: [0.3, 0, 0],
  head: [-0.42, 0, 0],
  lSh: [-0.5, 0, 0.32],
  lEl: [-0.55, 0, 0],
  lWr: [0.15, 0, 0],
  lHip: [-0.4, 0, 0.13],
  lKnee: [0.62, 0, 0],
  lAnk: [-0.32, 0, 0],
  curl: 0.9,
});
const ROAR = side({
  pelvis: [0.04, 0, 0],
  waist: [-0.05, 0, 0],
  chest: [-0.12, 0, 0],
  neck: [-0.05, 0, 0],
  head: [-0.5, 0, 0],
  lSh: [0.05, 0, 0.78],
  lEl: [-0.25, 0, 0],
  lWr: [0.1, 0, 0],
  lHip: [-0.3, 0, 0.22],
  lKnee: [0.5, 0, 0],
  lAnk: [-0.24, 0, 0],
  curl: 0.35,
});
const mix = (a, b, t) => {
  const out = {};
  for (const k of Object.keys(a)) out[k] = Array.isArray(a[k]) ? a[k].map((v, i) => v + (b[k][i] - v) * t) : a[k] + (b[k] - a[k]) * t;
  return out;
};

// Lesser devils at his feet: hunched, claws out, heads craned up at him.
const ONLOOKER = {
  spine: [0.35, 0, 0],
  chest: [0.1, 0, 0],
  neck: [-0.35, 0, 0],
  head: [-0.45, 0, 0],
  lShoulder: [-0.7, 0, 0.55],
  lElbow: [-0.9, 0, 0],
  rShoulder: [-0.7, 0, -0.55],
  rElbow: [-0.9, 0, 0],
  lHip: [-0.4, 0, 0.25],
  lKnee: [0.75, 0, 0],
  rHip: [-0.35, 0, -0.25],
  rKnee: [0.7, 0, 0],
  lift: -0.14,
};

// Black guts out of his back and waist: [anchor, base direction, length, radius].
const CORDS = [
  ["back", [-1, 0.9, -0.5], 6.0, 0.17],
  ["back", [1, 1.0, -0.45], 6.5, 0.18],
  ["backHigh", [-0.35, 1.2, -0.6], 5.0, 0.14],
  ["backHigh", [0.55, 1.1, -0.8], 5.5, 0.15],
  ["hipL", [-0.9, -0.75, 0.6], 6.0, 0.16],
  ["hipR", [1.0, -0.7, 0.5], 6.5, 0.17],
  ["hipL", [-0.8, -0.1, -1], 5.0, 0.13],
  ["hipR", [0.9, 0.15, -1], 5.0, 0.13],
  ["chestL", [-1.2, 0.35, 0.15], 5.5, 0.12],
  ["chestR", [1.2, 0.5, -0.1], 4.5, 0.11],
];

export const createChainsawDevilScene = (stage, { props = {}, overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  let fired = Boolean(props.fired);
  let firedAt = null;
  let chain = 0;

  const backdrop = mangaBackdrop();
  backdrop.material.uniforms.uInvert.value = 1;
  scene.add(backdrop);

  const line = outlineMaterial(1.1);
  const lineThin = outlineMaterial(0.7);
  // Ink-black carapace cut out by hard paper highlights and a paper rim; the
  // flesh between the plates is dark blood.
  // Film shading takes value from tint x tone, so the blacks are tinted black:
  // the plates read as ink and only the rim and the hard highlight are white.
  const hide = inkMaterial({ tint: "#141418", tone: 0.3, rim: 1.1, spec: 0.7 });
  hide.uniforms.uRimColor.value.set(PAPER);
  const flesh = inkMaterial({ tint: "#4a0a10", tone: 0.25, rim: 0.3, spec: 0 });
  const steel = inkMaterial({ tint: "#85888e", tone: 0.55, rim: 0.3, spec: 0.6 });
  const rail = inkMaterial({ tint: "#1c1c20", tone: 0.6, rim: 0.5 });
  const ink = inkMaterial({ flat: true });
  const bone = inkMaterial({ tint: "#d8d0bc", tone: 0.7, rim: 0, spec: 0.5 });
  const blood = inkMaterial({ tint: "#8e0b1f", tone: 0.5, rim: 0, spec: 0.6 });
  const cordMat = inkMaterial({ tint: "#121215", tone: 0.3, rim: 1.0, spec: 0.7 });
  cordMat.uniforms.uRimColor.value.set(PAPER);
  const ground = inkMaterial({ tint: "#4a4850", tone: 0.35, rim: 0, spec: 0 });
  const rock = inkMaterial({ tint: "#55535c", tone: 0.45, rim: 0.5, spec: 0.3 });
  rock.uniforms.uRimColor.value.set(PAPER);

  const geometries = [];
  const keep = (g) => (geometries.push(g), g);
  const plateGeo = keep(new THREE.SphereGeometry(1, 10, 7));
  plateGeo.scale(1, 1, 0.4);
  const spikeGeo = keep(new THREE.ConeGeometry(1, 1, 6));
  spikeGeo.translate(0, 0.5, 0);
  const ballGeo = keep(new THREE.SphereGeometry(1, 16, 12));

  const mesh = (parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], lineMat = lineThin) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...position);
    m.scale.set(...scale);
    parent.add(m);
    if (lineMat) outline(m, lineMat);
    return m;
  };
  const joint = (parent, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  /**
   * A plated segment: a tapered core of dark flesh along local y (down when
   * dir is -1, up when +1), shingled with staggered carapace plates whose
   * lower edges lift like scales. `profile(u)` gives the [x, z] radii.
   */
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const TILT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.22);
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();
  const BX = new THREE.Vector3();
  const BY = new THREE.Vector3();
  const BZ = new THREE.Vector3();
  const plated = (parent, { length, dir = -1, profile, rings, around, seed = 0, size = 0.64, cover = [0.04, 0.96] }) => {
    const core = keep(new THREE.CylinderGeometry(1, 1, 1, 18, 14, true));
    const p = core.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const u = dir < 0 ? 0.5 - y : 0.5 + y;
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const [rx, rz] = profile(u);
      p.setXYZ(i, Math.cos(a) * rx * 0.92, dir * u * length, Math.sin(a) * rz * 0.92);
    }
    core.computeVertexNormals();
    mesh(parent, core, flesh);

    const plates = new THREE.InstancedMesh(plateGeo, hide, rings * around);
    plates.frustumCulled = false;
    const span = (length * (cover[1] - cover[0])) / rings;
    let k = 0;
    for (let i = 0; i < rings; i++) {
      const u = lerp(cover[0], cover[1], (i + 0.5) / rings);
      const [rx, rz] = profile(u);
      for (let j = 0; j < around; j++) {
        const h1 = hash(seed + k * 7.13);
        const h2 = hash(seed + k * 3.71 + 11);
        const a = ((j + (i % 2) * 0.5 + (h1 - 0.5) * 0.35) / around) * TAU;
        const c = Math.cos(a);
        const s = Math.sin(a);
        BZ.set(c / rx, 0, s / rz).normalize();
        BY.set(0, 1, 0);
        BX.crossVectors(BY, BZ).normalize();
        Q.setFromRotationMatrix(M.makeBasis(BX, BY, BZ)).multiply(TILT);
        const w = ((TAU * (rx + rz) * 0.5) / around) * size * (0.85 + h2 * 0.35);
        const h = span * size * (0.95 + h1 * 0.35);
        S.set(w, h, Math.min(w, h) * 0.6 + 0.02);
        P.set(c * rx, dir * u * length, s * rz);
        plates.setMatrixAt(k++, M.compose(P, Q, S));
      }
    }
    parent.add(plates);
    outline(plates, lineThin);
    return plates;
  };

  /** Spines as one instanced mesh: [position, direction, length, radius] in the parent's frame. */
  const UP = new THREE.Vector3(0, 1, 0);
  const spines = (parent, list) => {
    const inst = new THREE.InstancedMesh(spikeGeo, hide, list.length);
    inst.frustumCulled = false;
    list.forEach(([pos, d, len, r], i) => {
      Q.setFromUnitVectors(UP, BZ.set(...d).normalize());
      inst.setMatrixAt(i, M.compose(P.set(...pos), Q, S.set(r, len, r)));
    });
    parent.add(inst);
    outline(inst, lineThin);
    return inst;
  };

  // ── The body. Ground is solved every frame from the soles. ──────────────
  const body = new THREE.Group();
  scene.add(body);
  const J = {};
  J.pelvis = joint(body, 0, 3.4, 0);
  plated(J.pelvis, { length: 0.55, dir: -1, profile: (u) => [0.42 - 0.1 * u * u, 0.3 - 0.06 * u], rings: 2, around: 9, seed: 1 });
  J.waist = joint(J.pelvis, 0, 0.0, 0);
  // A small waist under a huge ribcage.
  plated(J.waist, {
    length: 0.8,
    dir: 1,
    profile: (u) => [0.36 - 0.12 * Math.sin(Math.PI * u) + 0.06 * u, 0.27 - 0.06 * Math.sin(Math.PI * u) + 0.04 * u],
    rings: 3,
    around: 9,
    seed: 2,
  });
  J.chest = joint(J.waist, 0, 0.78, 0);
  plated(J.chest, {
    length: 1.5,
    dir: 1,
    profile: (u) => [0.42 + 0.58 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.5) - 0.35 * Math.max(0, u - 0.86) * 4, 0.34 + 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.1))],
    rings: 7,
    around: 12,
    seed: 3,
    size: 0.68,
  });
  // Shoulder plates and spines; a ridge of spines down the hunched back.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) mesh(J.chest, plateGeo, hide, [s * (0.72 + i * 0.12), 1.42 - i * 0.12, -0.02 - i * 0.03], [0.32 - i * 0.04, 0.22, 0.36 - i * 0.04]).rotation.set(-0.3, 0, s * (0.5 + i * 0.25));
  }
  spines(J.chest, [
    [[0.62, 1.48, -0.12], [0.35, 1, -0.45], 0.62, 0.075],
    [[0.86, 1.42, -0.1], [0.65, 0.9, -0.35], 0.5, 0.065],
    [[1.02, 1.28, -0.08], [0.9, 0.6, -0.25], 0.36, 0.05],
    [[-0.62, 1.48, -0.12], [-0.35, 1, -0.45], 0.58, 0.075],
    [[-0.86, 1.42, -0.1], [-0.65, 0.9, -0.35], 0.52, 0.065],
    [[-1.02, 1.28, -0.08], [-0.9, 0.6, -0.25], 0.34, 0.05],
    [[0.0, 1.3, -0.42], [0, 0.6, -1], 0.42, 0.06],
    [[0.0, 1.0, -0.47], [0, 0.4, -1], 0.36, 0.055],
    [[0.0, 0.7, -0.46], [0, 0.3, -1], 0.3, 0.05],
    [[0.0, 0.4, -0.42], [0, 0.2, -1], 0.24, 0.045],
    [[0.22, 1.15, -0.44], [0.3, 0.5, -1], 0.26, 0.04],
    [[-0.22, 1.15, -0.44], [-0.3, 0.5, -1], 0.26, 0.04],
  ]);
  J.neck = joint(J.chest, 0, 1.42, 0.1);
  plated(J.neck, { length: 0.5, dir: 1, profile: (u) => [0.19 - 0.03 * u, 0.18 - 0.02 * u], rings: 3, around: 7, seed: 4 });
  J.head = joint(J.neck, 0, 0.5, 0.04);
  J.head.scale.setScalar(1.2);

  // Anchors the cords grow from.
  const anchors = {
    back: joint(J.chest, 0, 0.75, -0.38),
    backHigh: joint(J.chest, 0, 1.2, -0.34),
    hipL: joint(J.waist, 0.3, 0.12, -0.05),
    hipR: joint(J.waist, -0.3, 0.12, -0.05),
    chestL: joint(J.chest, 0.6, 0.5, -0.2),
    chestR: joint(J.chest, -0.6, 0.45, -0.2),
    gutTop: joint(J.chest, 0.28, 1.32, 0.3),
    gutLow: joint(J.waist, -0.06, 0.25, 0.28),
    pull: joint(J.chest, -0.12, 0.42, 0.45),
  };

  // ── The head: an engine block with a bar for a crest and a curtain of teeth.
  const H = J.head;
  mesh(H, ballGeo, hide, [0, 0.3, 0.02], [0.33, 0.32, 0.4], line);
  mesh(H, keep(new THREE.BoxGeometry(1, 1, 1)), hide, [0, 0.24, 0.12], [0.6, 0.36, 0.56], line);
  mesh(H, keep(new THREE.BoxGeometry(1, 1, 1)), rail, [0, 0.42, -0.02], [0.44, 0.14, 0.5]);
  // Starter housing on one side, clutch cover at the bar's root on the other.
  mesh(H, keep(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20)), hide, [-0.33, 0.26, 0.04], [1, 1, 1]).rotation.z = Math.PI / 2;
  mesh(H, keep(new THREE.BoxGeometry(1, 1, 1)), hide, [0.18, 0.5, 0.05], [0.3, 0.2, 0.36]);
  // The mouth: an ink slot along the front, long thin teeth hanging from it.
  mesh(H, keep(new THREE.BoxGeometry(1, 1, 1)), ink, [0, 0.08, 0.38], [0.54, 0.1, 0.06], null);
  const toothGeo = keep(new THREE.ConeGeometry(1, 1, 4));
  toothGeo.rotateX(Math.PI);
  toothGeo.translate(0, -0.5, 0);
  for (let i = 0; i < 15; i++) {
    const u = (i + 0.5) / 15;
    const x = lerp(-0.27, 0.27, u);
    const len = 0.32 + Math.sin(Math.PI * u) * 0.32 + hash(i + 40) * 0.12;
    const tooth = mesh(H, toothGeo, bone, [x, 0.1, 0.4 - (x * x) * 0.6], [0.022, len, 0.022]);
    tooth.rotation.set(0.12, 0, -x * 0.25);
  }
  // Cords hang through the teeth like hair.
  const strandGeo = keep(new THREE.CylinderGeometry(0.018, 0.01, 1, 5));
  strandGeo.translate(0, -0.5, 0);
  const strands = Array.from({ length: 8 }, (_, i) => {
    const x = lerp(-0.3, 0.3, (i + 0.5) / 8) + (hash(i + 70) - 0.5) * 0.04;
    const pivot = joint(H, x, 0.12, 0.36 - x * x * 0.6);
    mesh(pivot, strandGeo, cordMat, [0, 0, 0], [1, 0.75 + hash(i + 80) * 0.5, 1], null);
    return { pivot, phase: hash(i + 90) * 6 };
  });
  // The guide bar: out of the top of the engine, up and to one side, flat to us.
  const crest = createBlade({ length: 2.5, radius: 0.24, steel, rail, ink, line: lineThin, teeth: 46, thickness: 0.09 });
  crest.group.position.set(0.16, 0.52, 0.08);
  aim(crest.group, new THREE.Vector3(0.42, 0.88, 0.22), new THREE.Vector3(-0.9, 0.43, 0));
  H.add(crest.group);
  // A horn on the other side, swept up and out.
  mesh(H, spikeGeo, hide, [-0.22, 0.5, 0.02], [0.08, 0.62, 0.08]).rotation.set(-0.15, 0, 0.75);

  // ── Arms: long, with huge forearms that ARE the saws. ──────────────────
  const clawGeo = keep(new THREE.ConeGeometry(1, 1, 5));
  clawGeo.rotateX(Math.PI);
  clawGeo.translate(0, -0.5, 0);
  const fingerGeo = keep(new THREE.CylinderGeometry(0.04, 0.034, 1, 6));
  fingerGeo.translate(0, -0.5, 0);
  const fingers = [];
  const arms = [1, -1].map((s) => {
    const name = s > 0 ? "l" : "r";
    const sh = (J[`${name}Sh`] = joint(J.chest, s * 1.06, 1.2, -0.02));
    mesh(sh, ballGeo, hide, [0, 0, 0], [0.3, 0.3, 0.3]);
    plated(sh, { length: 1.55, profile: (u) => [0.27 - 0.08 * u, 0.25 - 0.07 * u], rings: 5, around: 7, seed: 10 + s });
    const el = (J[`${name}El`] = joint(sh, 0, -1.55, 0));
    mesh(el, ballGeo, flesh, [0, 0, 0], [0.2, 0.2, 0.2]);
    plated(el, {
      length: 1.6,
      profile: (u) => {
        const r = 0.2 + 0.25 * Math.sin(Math.PI * u ** 0.7);
        return [r, r * 0.88];
      },
      rings: 6,
      around: 8,
      seed: 20 + s,
    });
    spines(el, [
      [[s * 0.3, -0.35, -0.1], [s * 0.6, 0.5, -0.6], 0.3, 0.05],
      [[s * 0.36, -0.7, -0.12], [s * 0.6, 0.45, -0.6], 0.26, 0.045],
      [[s * 0.3, -1.05, -0.1], [s * 0.6, 0.4, -0.6], 0.2, 0.04],
    ]);
    // The bar grows out of the outside of the forearm and runs on past the
    // hand: longer than the arm, spiked all round.
    const saw = createBlade({ length: 3.3, radius: 0.28, steel, rail, ink, line: lineThin, teeth: 54, thickness: 0.09 });
    saw.group.position.set(s * 0.42, -0.42, 0.04);
    aim(saw.group, new THREE.Vector3(s * 0.06, -1, 0.1), new THREE.Vector3(s, 0, 0));
    el.add(saw.group);
    for (let i = 0; i < 9; i++) {
      const x = 0.6 + hash(i * 3 + s * 17) * 2.5;
      const y = (hash(i * 5 + s * 13) - 0.5) * 0.36;
      const r = 0.03 + hash(i * 7 + s) * 0.05;
      mesh(saw.group, ballGeo, blood, [x, y, (i % 2 ? 1 : -1) * 0.055], [r * 1.6, r, 0.012], null);
    }
    // Clawed hand on the inside of the bar.
    const wr = (J[`${name}Wr`] = joint(el, -s * 0.04, -1.6, 0.02));
    mesh(wr, ballGeo, hide, [0, -0.14, 0.02], [0.15, 0.19, 0.09]);
    for (let f = 0; f < 4; f++) {
      const knuckle = joint(wr, -s * lerp(-0.1, 0.1, f / 3), -0.28, 0.05);
      const len = 0.2 + (f === 1 || f === 2 ? 0.05 : 0);
      mesh(knuckle, fingerGeo, hide, [0, 0, 0], [1, len, 1]);
      const tip = joint(knuckle, 0, -len, 0);
      mesh(tip, clawGeo, bone, [0, 0, 0], [0.034, 0.2, 0.034]);
      fingers.push({ knuckle, tip, thumb: false });
    }
    const thumb = joint(wr, s * 0.12, -0.12, 0.08);
    thumb.rotation.z = s * 0.5;
    mesh(thumb, fingerGeo, hide, [0, 0, 0], [1, 0.16, 1]);
    const thumbTip = joint(thumb, 0, -0.16, 0);
    mesh(thumbTip, clawGeo, bone, [0, 0, 0], [0.03, 0.16, 0.03]);
    fingers.push({ knuckle: thumb, tip: thumbTip, thumb: true });
    return saw;
  });
  const blades = [crest, ...arms];

  // ── Legs: long, plated, clawed feet. ─────────────────────────────────────
  const soles = [];
  for (const s of [1, -1]) {
    const name = s > 0 ? "l" : "r";
    const hip = (J[`${name}Hip`] = joint(J.pelvis, s * 0.3, -0.25, 0));
    mesh(hip, ballGeo, flesh, [0, 0, 0], [0.28, 0.28, 0.28]);
    plated(hip, { length: 1.6, profile: (u) => [0.36 - 0.14 * u, 0.36 - 0.13 * u], rings: 6, around: 8, seed: 30 + s });
    const knee = (J[`${name}Knee`] = joint(hip, 0, -1.6, 0));
    mesh(knee, ballGeo, hide, [0, 0, 0.04], [0.21, 0.21, 0.23]);
    plated(knee, { length: 1.65, profile: (u) => [0.2 + 0.07 * Math.sin(Math.PI * u ** 0.6) - 0.08 * u, 0.21 + 0.06 * Math.sin(Math.PI * u ** 0.6) - 0.08 * u], rings: 6, around: 7, seed: 40 + s });
    const ankle = (J[`${name}Ank`] = joint(knee, 0, -1.65, 0));
    mesh(ankle, ballGeo, hide, [0, -0.04, 0], [0.15, 0.15, 0.15]);
    const footRoot = joint(ankle, 0, -0.12, -0.12);
    footRoot.rotation.x = -Math.PI / 2;
    plated(footRoot, { length: 0.85, profile: (u) => [0.17 - 0.04 * u, 0.11 - 0.03 * u], rings: 3, around: 6, seed: 50 + s, cover: [0.08, 0.92] });
    for (let c = -1; c <= 1; c++) {
      const claw = mesh(ankle, clawGeo, bone, [c * 0.09, -0.15, 0.72], [0.035, 0.24, 0.035]);
      claw.rotation.set(-1.75, c * 0.25, 0);
    }
    soles.push(joint(ankle, 0, -0.34, -0.12), joint(ankle, 0, -0.34, 0.72));
  }

  // ── Cords: tubes rebuilt in place every frame, guts and the pull cord. ──
  const makeCord = ({ segs = 40, radial = 8, radius, bumps = 0.15, taper = 0.75, material = cordMat }) => {
    const geo = keep(new THREE.BufferGeometry());
    const n = (segs + 1) * radial;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    const index = [];
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * radial + j;
        const b = i * radial + ((j + 1) % radial);
        index.push(a, b, a + radial, b, b + radial, a + radial);
      }
    }
    geo.setIndex(index);
    const m = new THREE.Mesh(geo, material);
    m.frustumCulled = false;
    scene.add(m);
    outline(m, lineThin);
    const pts = Array.from({ length: segs + 1 }, () => new THREE.Vector3());
    const T = new THREE.Vector3();
    const N = new THREE.Vector3(1, 0, 0);
    const B = new THREE.Vector3();
    const set = (f) => {
      for (let i = 0; i <= segs; i++) f(i / segs, pts[i]);
      N.set(0, 0, 1);
      for (let i = 0; i <= segs; i++) {
        T.subVectors(pts[Math.min(segs, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        N.addScaledVector(T, -N.dot(T));
        if (N.lengthSq() < 1e-6) N.set(T.y, -T.x, 0);
        N.normalize();
        B.crossVectors(T, N);
        const u = i / segs;
        const r = radius * (1 - taper * u) * (1 - bumps + bumps * Math.abs(Math.sin(u * 46)));
        for (let j = 0; j < radial; j++) {
          const a = (j / radial) * TAU;
          const c = Math.cos(a);
          const s = Math.sin(a);
          const nx = N.x * c + B.x * s;
          const ny = N.y * c + B.y * s;
          const nz = N.z * c + B.z * s;
          const k = (i * radial + j) * 3;
          nor[k] = nx;
          nor[k + 1] = ny;
          nor[k + 2] = nz;
          pos[k] = pts[i].x + nx * r;
          pos[k + 1] = pts[i].y + ny * r;
          pos[k + 2] = pts[i].z + nz * r;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
    };
    return { set, mesh: m };
  };
  const cords = CORDS.map(([at, d, len, radius], i) => ({
    at,
    dir: new THREE.Vector3(...d).normalize(),
    len,
    radius,
    phase: hash(i + 5) * 6,
    freq: 0.8 + hash(i + 9) * 0.6,
    tube: makeCord({ radius: radius * 1.5, taper: 0.6, bumps: 0.22 }),
  }));
  const gut = makeCord({ segs: 26, radius: 0.12, taper: 0.1, bumps: 0.2 });
  const pullCord = makeCord({ segs: 12, radial: 5, radius: 0.022, taper: 0, bumps: 0, material: rail });
  const handle = mesh(scene, keep(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8)), hide, [0, 0, 0], [1, 1, 1]);
  handle.rotation.z = Math.PI / 2;

  // ── Ground: black earth, rubble, blood. ───────────────────────────────────
  const floor = new THREE.Mesh(keep(new THREE.CircleGeometry(34, 48)), ground);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const rubble = new THREE.InstancedMesh(keep(new THREE.DodecahedronGeometry(1, 0)), rock, 46);
  rubble.frustumCulled = false;
  for (let i = 0; i < 46; i++) {
    const a = hash(i + 200) * TAU;
    // Behind and beside him only: nothing big between him and the lens.
    const r = 1.6 + hash(i + 300) ** 0.7 * 9;
    const z = Math.sin(a) * r * 0.8;
    const x = Math.cos(a) * r;
    const s = 0.06 + hash(i + 400) ** 2 * 0.4;
    Q.setFromEuler(new THREE.Euler(hash(i + 500) * 3, hash(i + 600) * 3, 0));
    const near = z > 1.2 && Math.abs(x) < 3.5;
    const k = near ? 0.3 : 1;
    rubble.setMatrixAt(i, M.compose(P.set(x, s * k * 0.35, z), Q, S.set(s * k, s * k * 0.7, s * k)));
  }
  scene.add(rubble);
  outline(rubble, lineThin);
  for (let i = 0; i < 6; i++) {
    const pool = new THREE.Mesh(keep(new THREE.CircleGeometry(1, 20)), blood);
    pool.rotation.x = -Math.PI / 2;
    const r = 0.2 + hash(i + 700) * 0.5;
    pool.scale.set(r * 1.5, r, 1);
    pool.position.set((hash(i + 800) - 0.5) * 4.5, 0.012 + i * 0.002, 0.6 + hash(i + 900) * 1.6);
    scene.add(pool);
  }

  // Three lesser devils, small, in the foreground: horned, hunched.
  const SPOTS = [
    [-1.4, 2.4],
    [-1.0, 2.7],
    [1.35, 2.5],
  ];
  const ready = Promise.all(
    SPOTS.map((_, i) => createModelFigure({ height: 1.5 + i * 0.08, horns: true, line, ink: { tone: 0.5, rim: 1.2, rimColor: PAPER }, outfit: OUTFITS.devil })),
  ).then((crowd) => {
    crowd.forEach((f, i) => {
      const [x, z] = SPOTS[i];
      f.root.position.set(x, 0, z);
      f.root.rotation.y = Math.PI + (x < 0 ? -0.2 : 0.25);
      f.apply(ONLOOKER);
      scene.add(f.root);
    });
    syncInk(scene, renderer.getPixelRatio());
    setInkStyle(scene, { film: true, shade: "#7a6a8a" });
  });

  const roar = createSfx(overlay, { text: "VRRRRRRMMM!!!", crescendo: 1.1 });
  const revSfx = createSfx(overlay, { text: "VRRN VRRN", crescendo: 0.5 });
  const hum = createSfx(overlay, { text: "vrrr…", crescendo: 0.2, color: PAPER });

  const camRig = { distance: 11.5 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    camRig.distance = aspect < 1.2 ? 11.5 / (aspect / 1.2) ** 0.8 : 11.5;
  });
  const lookAt = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const a0 = new THREE.Vector3();
  const a1 = new THREE.Vector3();
  const side0 = new THREE.Vector3();
  const side1 = new THREE.Vector3();
  const toScreen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (-tmp.y * 0.5 + 0.5) * 100];
  };

  const applyPose = (pose) => {
    for (const [name, g] of Object.entries(J)) {
      const r = pose[name];
      if (r) g.rotation.set(r[0], r[1], r[2]);
    }
    fingers.forEach(({ knuckle, tip, thumb }) => {
      if (thumb) {
        knuckle.rotation.x = -0.6 * pose.curl;
        tip.rotation.x = -0.5 * pose.curl;
      } else {
        knuckle.rotation.x = -0.5 - 0.6 * pose.curl;
        tip.rotation.x = -0.4 - 0.7 * pose.curl;
      }
    });
  };

  // Plant the feet: put the lowest sole on the ground and keep them centred.
  const plant = () => {
    body.position.set(0, 0, 0);
    body.updateMatrixWorld(true);
    let low = Infinity;
    a0.set(0, 0, 0);
    for (const s of soles) {
      s.getWorldPosition(tmp);
      low = Math.min(low, tmp.y);
      a0.add(tmp);
    }
    a0.multiplyScalar(1 / soles.length);
    body.position.set(-a0.x, -low, -a0.z * 0.6);
    body.updateMatrixWorld(true);
  };

  const update = (time, dt) => {
    if (fired && firedAt === null) firedAt = staticMode ? time - DURATION : time;
    if (!fired) firedAt = null;
    const go = firedAt !== null;
    const t = go ? clamp01((time - firedAt) / DURATION) : 0;
    const rise = easeInOutCubic(segment(t, 0, 0.38));
    const rev = go ? segment(t, 0.18, 0.5) : 0;
    const whip = go ? Math.max(Math.sin(Math.PI * segment(t, 0.32, 0.78)), 0.35 * segment(t, 0.6, 0.8)) : 0;
    const slam = segment(t, 0.55, 0.75);
    const roarK = go ? easeOutBack(slam) : 0;
    const shake = go && !staticMode ? (1 - segment(t, 0.7, 1)) * segment(t, 0.55, 0.62) : 0;

    // The body.
    const pose = mix(mix(CROUCH, RISEN, rise), ROAR, roarK);
    const breathe = Math.sin(time * 1.1);
    pose.chest = [pose.chest[0] + breathe * 0.035, pose.chest[1] + Math.sin(time * 0.37) * 0.05, pose.chest[2]];
    pose.head = [pose.head[0] + breathe * 0.04, pose.head[1] + Math.sin(time * 0.29) * 0.22 * (1 - slam) + Math.sin(time * 31) * 0.05 * shake, pose.head[2]];
    const buzz = Math.sin(time * 57) * 0.012 * (rev + shake) * (staticMode ? 0 : 1);
    for (const n of ["lEl", "rEl"]) pose[n] = [pose[n][0] + buzz, pose[n][1], pose[n][2]];
    pose.lSh = [pose.lSh[0] + Math.sin(time * 0.8) * 0.04, pose.lSh[1], pose.lSh[2]];
    pose.rSh = [pose.rSh[0] + Math.sin(time * 0.8 + 1.3) * 0.04, pose.rSh[1], pose.rSh[2]];
    applyPose(pose);
    plant();
    if (shake) body.position.x += Math.sin(time * 70) * 0.03 * shake;

    chain += (go ? lerp(0.6, 14, rev) : 0.6) * dt;
    blades.forEach((b, i) => {
      b.extend(1);
      b.run(chain * (1 + i * 0.07));
    });
    strands.forEach(({ pivot, phase }) => {
      pivot.rotation.set(Math.sin(time * 1.4 + phase) * 0.12 + 0.1, 0, Math.sin(time * 1.1 + phase * 2) * 0.1 + Math.sin(time * 40) * 0.04 * shake);
    });

    // The guts: out of his back and waist, swaying; on the whip they lash out
    // wide and fast and lift into the frame.
    const amp = lerp(0.35, 1.2, whip);
    const speed = lerp(1.0, 4.5, whip);
    cords.forEach((c) => {
      anchors[c.at].getWorldPosition(a1);
      side0.crossVectors(c.dir, UP);
      if (side0.lengthSq() < 1e-4) side0.set(1, 0, 0);
      side0.normalize();
      side1.crossVectors(c.dir, side0).normalize();
      const len = c.len * (1 + 0.18 * whip);
      const lift = 0.8 * whip;
      c.tube.set((u, out) => {
        const w = time * speed * c.freq + c.phase;
        out.copy(a1).addScaledVector(c.dir, u * len);
        out.y += (lift - 1.1) * u * u * (c.dir.y < 0 ? 1.2 : 0.6) * len * 0.3;
        out.addScaledVector(side0, Math.sin(u * 7 - w) * amp * u ** 1.2);
        out.addScaledVector(side1, Math.cos(u * 5.3 - w * 0.8) * amp * 0.6 * u ** 1.2);
        out.y = Math.max(out.y, c.radius * 1.5 * (1 - 0.6 * u) + 0.02);
      });
    });
    // The fat gut from his collar down across his chest into his belly.
    anchors.gutTop.getWorldPosition(a0);
    anchors.gutLow.getWorldPosition(a1);
    gut.set((u, out) => {
      out.lerpVectors(a0, a1, u);
      out.z += Math.sin(Math.PI * u) * 0.32;
      out.x += Math.sin(Math.PI * u) * 0.12 + Math.sin(time * 1.3 + u * 4) * 0.02;
    });
    // The pull cord, hanging off his chest with its handle.
    anchors.pull.getWorldPosition(a0);
    const swing = Math.sin(time * 1.6) * 0.12 + whip * Math.sin(time * 9) * 0.25;
    pullCord.set((u, out) => {
      out.set(a0.x + Math.sin(swing) * u * 0.9, a0.y - Math.cos(swing) * u * 0.9, a0.z + 0.08 * u + Math.sin(u * Math.PI) * 0.05);
    });
    handle.position.set(a0.x + Math.sin(swing) * 0.92, a0.y - Math.cos(swing) * 0.92, a0.z + 0.08);

    // The page: the film's dark air, a red glow opening behind his head.
    const u = backdrop.material.uniforms;
    u.uSeed.value = Math.floor(time * (go ? 12 : 6));
    u.uIntensity.value = go ? lerp(0.8, 1.6, slam) : 0.75;
    u.uSplash.value = 1;
    u.uSpread.value = lerp(0.65, 1.25, easeOutCubic(segment(t, 0.4, 0.8)));

    // Camera: on the ground looking up. As he rises it tilts up with him and
    // creeps in; the roar shakes it.
    const orbit = 0.2 + Math.sin(time * 0.1) * 0.05 + pointer.x * 0.08;
    const dist = camRig.distance * lerp(1, 0.94, rise) * (1 + Math.sin(time * 0.13) * 0.015);
    lookAt.set(0, lerp(2.5, 3.7, rise) + roarK * 0.2, 0);
    camera.position.set(Math.sin(orbit) * dist, 0.5 + pointer.y * 0.12, Math.cos(orbit) * dist);
    if (shake) {
      camera.position.x += Math.sin(time * 61) * 0.06 * shake;
      camera.position.y += Math.sin(time * 73) * 0.05 * shake;
    }
    camera.lookAt(lookAt);
    camera.updateMatrixWorld();

    const headPt = J.head.getWorldPosition(a0);
    const [hx, hy] = toScreen(headPt);
    u.uFocus.value.set(hx / 100, 1 - hy / 100);

    hum.update({ x: hx + 12, y: hy + 16, size: 5, rotate: -6, opacity: go ? 1 - segment(t, 0, 0.1) : 0.7, boil: Math.floor(time * 5), jitter: 0.04 });
    const [bx, by] = toScreen(arms[1].group.getWorldPosition(a1));
    const revK = go ? Math.sin(Math.PI * segment(t, 0.2, 0.58)) : 0;
    revSfx.update({ x: bx - 6, y: by + 6, size: 5.5, rotate: 8, opacity: revK, scale: lerp(1.4, 1, revK), boil: Math.floor(time * 10), jitter: 0.08 });
    roar.update({
      x: 50,
      y: 9,
      size: 8,
      rotate: -4,
      opacity: go ? Math.min(1, slam * 4) : 0,
      scale: lerp(2.4, 1, easeOutBack(slam)),
      boil: Math.floor(time * 12),
      jitter: 0.1,
      shake: go && !staticMode ? [Math.sin(time * 97) * 7, Math.sin(time * 89) * 6] : [0, 0],
    });
  };

  // The show's look: lit like a frame of it, not printed like a page.
  setInkStyle(scene, { film: true, shade: "#7a6a8a" });

  return {
    ready,
    update,
    setProps(next) {
      fired = Boolean(next.fired);
    },
    dispose() {
      unsubscribeResize();
      geometries.forEach((g) => g.dispose());
      [roar, revSfx, hum].forEach((s) => s.dispose());
    },
  };
};
