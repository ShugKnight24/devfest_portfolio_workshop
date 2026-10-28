import * as THREE from "three";
import { createParticles, easeInOutCubic, easeOutBack, easeOutCubic, lerp, lightBeam, segment } from "../kit";
import { INK, PAPER, outline } from "../ink";
import { createSfx } from "../sfx";
import { buildDaisy, createInkWorld } from "../rezeKit";

/**
 * City mouse, or country mouse? — the question from the film, as the last page.
 *
 * Two panels, one gutter. Left, the country: Reze as a mouse in a golden
 * meadow by a cottage, a daisy at her nose, fireflies coming out. Right, the
 * city: Denji as a mouse at a café table under the neon, a slice of toast
 * and jam in both paws, the skyline lit behind him. Each in the life they
 * wanted — and the fable plays out as a 24-second gag, both sides at once:
 *
 *   0  – 6   living: she smells her daisy; he eats
 *   6  – 10  the city: eyes open in the alley. He jumps, ducks under his toast,
 *            and a cat's paw swipes the other slice off his plate
 *            the country: a butterfly lands on her nose
 *   9        ACHOO. That is the most dangerous thing that happens to her.
 *   10 – 16  he shrugs and eats anyway; she giggles in the flowers
 *   16 – 21  they turn to each other across the gutter: daisy up, toast up
 */

const CYCLE = 24;

const COUNTRY = { ground: "#e8b778", lines: "#fff1d6", accent: "#ff9f6b", rim: "#fff1d6", shade: "#c9a07e" };
const CITY = { ground: "#17122b", lines: "#ff7ad9", accent: "#3fe0ff", rim: "#ff7ad9", shade: "#7a5fa8" };
const CITY_X = 60;

/**
 * A storybook mouse standing on its hind legs, dressed as one of them.
 * Returns the parts that move: head, ears, tail and both arms.
 */
const buildMouse = (w, { fur, clothes, collar, tie, belt, choker, hair }) => {
  const g = new THREE.Group();
  const furMat = w.ink({ tint: fur, tone: 0.95, rim: 1.2 });
  const pink = w.ink({ tint: "#f2a7b4", tone: 1, rim: 0.4 });
  const cloth = w.ink({ tint: clothes, tone: 0.9, rim: 1 });
  const add = (geo, mat, pos, scale = [1, 1, 1], parent = g, line = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    parent.add(m);
    if (line) outline(m, w.line);
    return m;
  };

  // Body in its clothes; feet and a fur neck.
  add(new THREE.SphereGeometry(0.5, 28, 20), cloth, [0, 0.62, 0], [0.78, 1, 0.72]);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.13, 14, 10), furMat, [s * 0.18, 0.08, 0.12], [0.9, 0.55, 1.5]);
  if (collar) for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.16, 0.07, 0.03), w.ink({ tint: collar, tone: 1.1, rim: 0.5 }), [s * 0.08, 1.02, 0.28], [1, 1, 1]).rotation.set(-0.3, s * 0.4, s * -0.5);
  if (tie) add(new THREE.BoxGeometry(0.08, 0.42, 0.02), w.ink({ tint: tie, tone: 0.5, rim: 0.8 }), [0, 0.78, 0.36]).rotation.x = -0.18;
  if (belt) add(new THREE.TorusGeometry(0.39, 0.035, 6, 32), w.ink({ tint: belt, tone: 0.8, rim: 0.6 }), [0, 0.42, 0], [1, 0.92, 0.95], g, false).rotation.x = Math.PI / 2;

  // Head, snout, nose, eyes, whiskers.
  const head = new THREE.Group();
  head.position.set(0, 1.2, 0.02);
  g.add(head);
  add(new THREE.SphereGeometry(0.36, 28, 20), furMat, [0, 0, 0], [1, 0.95, 1.02], head);
  add(new THREE.SphereGeometry(0.17, 18, 12), furMat, [0, -0.08, 0.3], [1, 0.82, 1.25], head);
  add(new THREE.SphereGeometry(0.05, 12, 8), pink, [0, -0.06, 0.5], [1, 1, 1], head, false);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.055, 12, 8), w.flat, [s * 0.14, 0.06, 0.29], [1, 1.2, 0.6], head, false);
    add(new THREE.SphereGeometry(0.016, 8, 6), w.ink({ tint: PAPER, tone: 1.4, rim: 0 }), [s * 0.14 + 0.015, 0.085, 0.32], [1, 1, 1], head, false);
    for (let k = 0; k < 3; k++) {
      const wh = add(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 4), w.flat, [s * 0.2, -0.08 + k * 0.03, 0.4], [1, 1, 1], head, false);
      wh.rotation.z = s * (Math.PI / 2 - 0.15 + k * 0.15);
    }
  }
  // Big round ears.
  const ears = [-1, 1].map((s) => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.27, 0.3, -0.04);
    head.add(ear);
    add(new THREE.SphereGeometry(0.22, 20, 14), furMat, [0, 0.08, 0], [1, 1, 0.28], ear);
    add(new THREE.SphereGeometry(0.15, 16, 10), pink, [0, 0.08, 0.04], [1, 1, 0.2], ear, false);
    return ear;
  });

  // Hair, in their styles.
  if (hair === "spikes") {
    const blond = w.ink({ tint: "#e3a849", tone: 1, rim: 0.8 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 2.2;
      const spike = add(new THREE.ConeGeometry(0.09, 0.3, 6), blond, [Math.sin(a) * 0.2, 0.32 - Math.abs(a) * 0.06, 0.06 + Math.cos(a) * 0.12], [1, 1, 1], head);
      spike.rotation.set(0.7, 0, -a * 0.55);
    }
  } else if (hair === "bob") {
    const violet = w.ink({ tint: "#2a2140", tone: 0.8, rim: 1.2 });
    // A cap over the crown and down the back and sides, open at the face.
    // (phi = π/2 faces +z, so the gap is centred there.)
    // Open shells take no outline: its inside would show through the gap as stripes.
    violet.side = THREE.DoubleSide;
    add(new THREE.SphereGeometry(0.385, 28, 18, Math.PI * 0.72, Math.PI * 1.56, 0, Math.PI * 0.6), violet, [0, 0.03, -0.03], [1.03, 1, 1.03], head, false);
    // A fringe: one curved slab over the forehead, stopping above the eyes.
    add(new THREE.SphereGeometry(0.415, 28, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.1, Math.PI * 0.24), violet, [0, 0.03, 0], [1, 1, 1.02], head, false);
  }
  if (choker) {
    add(new THREE.TorusGeometry(0.17, 0.025, 8, 28), w.ink({ tint: "#141414", tone: 0.6, rim: 1 }), [0, 1.0, 0.02], [1, 1, 1], g, false).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.035, 0.009, 6, 16), w.ink({ tint: "#e6e6e1", tone: 1.3, rim: 0.4 }), [0, 0.95, 0.19], [1, 1, 1], g, false);
  }

  // Arms (pivot at the shoulder) and the tail.
  const arms = [-1, 1].map((s) => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 0.88, 0.08);
    g.add(arm);
    add(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), cloth, [0, -0.15, 0], [1, 1, 1], arm);
    add(new THREE.SphereGeometry(0.065, 10, 8), furMat, [0, -0.33, 0], [1, 1, 1], arm);
    return arm;
  });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.25, -0.32),
    new THREE.Vector3(0, 0.12, -0.6),
    new THREE.Vector3(0.15, 0.1, -0.9),
    new THREE.Vector3(0.35, 0.3, -1.1),
    new THREE.Vector3(0.3, 0.5, -1.25),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.028, 8), pink);
  g.add(tail);
  outline(tail, w.line);
  return { group: g, head, ears, arms, tail };
};

const box = (w, size, pos, tint, tone = 0.8, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), w.ink({ tint, tone, rim: 0.6 }));
  m.position.set(...pos);
  parent.add(m);
  return m;
};
const glow = (color) => new THREE.MeshBasicMaterial({ color });

export const createMiceScene = (stage, { overlay } = {}) => {
  const { camera: camL, renderer, staticMode } = stage;
  const camR = new THREE.PerspectiveCamera(camL.fov, 1, 0.1, 200);
  const w = createInkWorld(stage);
  w.page({ mode: "still" });

  // ── The country ──
  const country = new THREE.Group();
  w.scene.add(country);
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), w.ink({ tint: "#8dbd5f", tone: 0.95, rim: 0.3 }));
  meadow.rotation.x = -Math.PI / 2;
  country.add(meadow);
  for (const [x, z, r] of [[-6, -9, 4.5], [3, -11, 5.5], [9, -8, 3.5]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), w.ink({ tint: "#6fa24c", tone: 0.85, rim: 0.4 }));
    hill.position.set(x, -0.2, z);
    hill.scale.y = 0.45;
    country.add(hill);
  }
  // The cottage, its window lit.
  const cottage = new THREE.Group();
  cottage.position.set(-2.6, 0, -3.4);
  country.add(cottage);
  box(w, [2, 1.5, 1.6], [0, 0.75, 0], "#f3e3c3", 0.95, cottage);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1, 4), w.ink({ tint: "#b5523b", tone: 0.85, rim: 0.6 }));
  roof.position.y = 2;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.85;
  cottage.add(roof);
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glow("#ffd27a"));
  lit.position.set(0.45, 0.85, 0.81);
  cottage.add(lit);
  box(w, [0.4, 0.8, 0.04], [-0.4, 0.4, 0.81], "#7a4a2a", 0.8, cottage);
  for (let i = 0; i < 8; i++) box(w, [0.06, 0.55, 0.06], [-4.2 + i * 0.55, 0.27, -1.6], "#c9a36f", 0.9, country);
  box(w, [4.2, 0.05, 0.04], [-2.3, 0.42, -1.6], "#c9a36f", 0.9, country);
  // A field of daisies, and the one at her nose.
  const daisies = [];
  for (let i = 0; i < 46; i++) {
    const d = buildDaisy(w);
    const a = i * 2.39;
    const r = 0.8 + Math.sqrt(i) * 0.55;
    d.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r * 0.7 - 0.3);
    d.rotation.set(-0.3 + Math.sin(i) * 0.2, i, 0);
    d.scale.setScalar(1.6 + (i % 3) * 0.3);
    country.add(d);
    daisies.push(d);
  }
  const reze = buildMouse(w, { fur: "#c9c2bd", clothes: "#1d1b22", collar: "#f1efe9", choker: true, hair: "bob" });
  reze.group.position.set(0, 0, 0.6);
  reze.group.rotation.y = 0.55;
  country.add(reze.group);
  const herDaisy = buildDaisy(w);
  herDaisy.scale.setScalar(2);
  reze.arms[1].add(herDaisy);
  herDaisy.position.set(0, -0.36, 0.06);
  const fireflies = createParticles({ count: 160, blending: "add" });
  w.scene.add(fireflies.points);

  // ── The city ──
  const city = new THREE.Group();
  city.position.x = CITY_X;
  w.scene.add(city);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), w.ink({ tint: "#3a3550", tone: 0.6, rim: 0.3 }));
  street.rotation.x = -Math.PI / 2;
  city.add(street);
  const windows = [];
  for (let i = 0; i < 12; i++) {
    const h = 3 + ((i * 7) % 5) * 1.3;
    const bw = 1.3 + (i % 3) * 0.4;
    const x = -8 + i * 1.45;
    const z = -7 - (i % 2) * 1.6;
    box(w, [bw, h, 1.2], [x, h / 2, z], i % 2 ? "#2b2645" : "#342e55", 0.55, city);
    for (let r = 0; r < Math.floor(h / 0.55) - 1; r++) {
      for (let k = 0; k < 2; k++) {
        if ((i * 13 + r * 7 + k * 3) % 4 === 0) continue;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.26), glow((i + r + k) % 5 ? "#ffd27a" : "#9ff0ff"));
        win.position.set(x - 0.25 + k * 0.5, 0.6 + r * 0.55, z + 0.61);
        city.add(win);
        windows.push(win);
      }
    }
  }
  // Neon over the café.
  const neon = [
    ["#ff4fd8", [-1.6, 2.6, -2.2], [1.8, 0.28]],
    ["#3fe0ff", [1.4, 2.2, -2.2], [1.2, 0.22]],
  ].map(([c, p, [nw, nh]]) => {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(nw, nh), glow(c));
    sign.position.set(...p);
    city.add(sign);
    const spill = lightBeam({ from: [p[0], p[1], p[2] + 0.1], to: [p[0] * 0.5, 0, 0.6], radiusFrom: 0.4, radiusTo: 1.6, color: c });
    spill.material.uniforms.uIntensity.value = 0.22;
    city.add(spill);
    return sign;
  });
  box(w, [4.6, 2.6, 0.2], [0, 1.3, -2.4], "#3c2f4f", 0.7, city);
  // His table, his plate, his toast and jam.
  const table = new THREE.Group();
  table.position.set(0.55, 0, 0.6);
  city.add(table);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28), w.ink({ tint: "#f1efe9", tone: 1, rim: 0.6 }));
  top.position.y = 0.72;
  table.add(top);
  outline(top, w.line);
  box(w, [0.06, 0.7, 0.06], [0, 0.35, 0], "#22222a", 0.6, table);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.03, 24), w.ink({ tint: "#ffffff", tone: 1.1, rim: 0.4 }));
  plate.position.set(-0.1, 0.76, 0.05);
  table.add(plate);
  // Two slices on the plate; the top one is the cat's.
  const slices = [0, 1].map((i) => {
    const slice = new THREE.Group();
    slice.position.set(-0.12 + i * 0.08, 0.79 + i * 0.04, 0.05 - i * 0.03);
    slice.rotation.y = i * 0.6;
    table.add(slice);
    box(w, [0.2, 0.04, 0.2], [0, 0, 0], "#e0a052", 1, slice);
    box(w, [0.17, 0.012, 0.17], [0, 0.025, 0], "#c8102e", 0.9, slice);
    return slice;
  });
  const sliceHome = { position: slices[1].position.clone(), rotation: slices[1].rotation.y };

  // The cat: eyes in the alley behind him, then one big paw.
  const eyes = new THREE.Group();
  eyes.position.set(2.3, 1.55, -4.2);
  city.add(eyes);
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), glow("#ffe14d"));
    eye.position.x = side * 0.36;
    eye.scale.y = 0.75;
    eyes.add(eye);
    const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.36), glow("#0d0c0c"));
    slit.position.set(side * 0.36, 0, 0.01);
    eyes.add(slit);
  });
  const paw = new THREE.Group();
  city.add(paw);
  const tabby = w.ink({ tint: "#e39a4f", tone: 0.95, rim: 1 });
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 2.4, 6, 16), tabby);
  forearm.position.set(0.9, 0.95, -0.45);
  // Up and out of frame to the right, from the pad.
  forearm.rotation.z = -Math.PI / 2.8;
  outline(forearm, w.line);
  paw.add(forearm);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), tabby);
  pad.scale.set(1, 0.6, 1);
  outline(pad, w.line);
  paw.add(pad);
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * 0.42;
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), tabby);
    toe.position.set(-Math.cos(a) * 0.26, -0.04, Math.sin(a) * 0.24);
    outline(toe, w.line);
    paw.add(toe);
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), w.ink({ tint: "#ffffff", tone: 1.2, rim: 0.3 }));
    claw.position.set(-Math.cos(a) * 0.36, -0.06, Math.sin(a) * 0.32);
    claw.rotation.z = Math.PI / 2;
    paw.add(claw);
  }
  const pawFrom = new THREE.Vector3(3.6, 3.4, -0.2);
  const pawTo = new THREE.Vector3(0.65, 1.0, 0.62);

  // The country's only danger: a butterfly.
  const butterfly = new THREE.Group();
  country.add(butterfly);
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), w.ink({ tint: "#ffb347", tone: 1.05, rim: 0.4 }));
    wing.material.side = THREE.DoubleSide;
    wing.geometry.translate(side * 0.09, 0, 0);
    butterfly.add(wing);
    return wing;
  });
  const denji = buildMouse(w, { fur: "#b9a38c", clothes: "#eef0ea", tie: "#15161b", belt: "#6b3f22", hair: "spikes" });
  denji.group.position.set(-0.2, 0, 0.9);
  denji.group.rotation.y = 0.5;
  city.add(denji.group);
  const toast = new THREE.Group();
  box(w, [0.18, 0.035, 0.16], [0, 0, 0], "#e0a052", 1, toast);
  box(w, [0.15, 0.012, 0.13], [0, 0.022, 0], "#c8102e", 0.9, toast);
  denji.arms[0].add(toast);
  toast.position.set(0.05, -0.36, 0.08);

  w.sync();

  // ── Labels ──
  const el = (style, html) => {
    const d = document.createElement("div");
    d.setAttribute("aria-hidden", "true");
    Object.assign(d.style, { position: "absolute", pointerEvents: "none", ...style });
    d.innerHTML = html;
    overlay?.appendChild(d);
    return d;
  };
  const label = (side, kicker, name, line) =>
    el(
      {
        top: "5%",
        [side]: "3%",
        textAlign: side,
        fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
        color: INK,
      },
      `<div style="display:inline-block;background:${PAPER};border:0.16em solid ${INK};box-shadow:0.25em 0.25em 0 ${INK};padding:0.45em 0.8em;font-size:clamp(0.7rem,1.6vw,1.4rem);font-weight:900;letter-spacing:0.08em;text-transform:uppercase">${kicker}<div style="font-size:0.62em;letter-spacing:0.18em;margin-top:0.3em">${name} · ${line}</div></div>`,
    );
  const labels = [label("left", "Country mouse", "Reze", "little, but safe"), label("right", "City mouse", "Denji", "everything, and the cat")];
  const bang = createSfx(overlay, { text: "!!", crescendo: 0.3 });
  const achoo = createSfx(overlay, { text: "ACHOO!", crescendo: 0.4 });
  const nom = createSfx(overlay, { text: "nom", crescendo: 0, italic: true });
  const gutter = el({ top: "0", bottom: "0", left: "50%", width: "10px", marginLeft: "-5px", background: PAPER, borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}` }, "");

  const animate = (m, t, phase) => {
    m.tail.rotation.y = Math.sin(t * 1.6 + phase) * 0.25;
    m.ears.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * (0.05 + Math.max(0, Math.sin(t * 3.1 + phase * 2 + i)) * 0.12)));
    m.group.position.y = Math.abs(Math.sin(t * 1.2 + phase)) * 0.015;
  };

  const update = (time, dt) => {
    const t = staticMode ? 4 : time;
    const c = staticMode ? 8.1 : t % CYCLE;
    const cheers = easeInOutCubic(segment(c, 16, 17)) * (1 - easeInOutCubic(segment(c, 20.5, 21.5)));

    // ── Reze: the daisy, the butterfly, the sneeze, the giggle ──
    const sniff = (Math.sin(t * 0.8) + 1) / 2;
    const sneeze = c > 8.8 && c < 9.6 ? Math.sin(segment(c, 8.8, 9.6) * Math.PI) : 0;
    const windUp = c > 8.4 && c < 9.0 ? segment(c, 8.4, 9.0) : 0;
    reze.arms[1].rotation.set(lerp(lerp(-1.2, -2.1, sniff), -2.7, cheers), 0, -0.25);
    reze.arms[0].rotation.set(-0.25, 0, 0.15 + (c > 10 && c < 15 ? Math.abs(Math.sin(t * 9)) * 0.2 : 0));
    reze.head.rotation.set(lerp(0.05, -0.12, sniff) - windUp * 0.35 + sneeze * 0.6, 0.1 + cheers * 0.9, 0.1 * Math.sin(t * 0.6) + (c > 10 && c < 15 ? Math.sin(t * 14) * 0.06 : 0));
    reze.ears.forEach((e) => e.scale.setScalar(1 + sneeze * 0.35));
    animate(reze, t, 0);
    reze.group.position.y += sneeze * 0.08;

    // The butterfly: drifts in, lands on her nose, and is blown away.
    const nose = new THREE.Vector3(0, -0.06, 0.55).applyMatrix4(reze.head.matrixWorld);
    country.worldToLocal(nose);
    butterfly.visible = c > 5.5 && c < 11;
    if (butterfly.visible) {
      const inK = easeInOutCubic(segment(c, 5.5, 8.3));
      const away = easeOutCubic(segment(c, 9.0, 11));
      const drift = new THREE.Vector3(1.6 + Math.sin(c * 2) * 0.3, 1.6 + Math.sin(c * 3) * 0.2, 0.8);
      butterfly.position.copy(drift).lerp(nose, inK).add(new THREE.Vector3(away * 2.2, away * 1.4, away * 0.6));
      const flap = c > 8.3 && c < 8.95 ? 0.3 : Math.sin(t * 28) * 0.9;
      wings[0].rotation.y = flap;
      wings[1].rotation.y = -flap;
      butterfly.rotation.set(0.4, 0.6, 0);
    }

    // ── Denji: the eyes, the jump, the duck, the paw, the shrug ──
    const look = easeOutCubic(segment(c, 6.2, 6.6)) * (1 - easeInOutCubic(segment(c, 9.6, 10.3)));
    const jump = c > 6.6 && c < 7.1 ? Math.sin(segment(c, 6.6, 7.1) * Math.PI) : 0;
    const duck = easeOutCubic(segment(c, 7.0, 7.3)) * (1 - easeOutBack(segment(c, 9.4, 9.9)));
    const shrug = c > 10 && c < 11.4 ? Math.sin(segment(c, 10, 11.4) * Math.PI) : 0;
    const eating = c < 6.2 || (c > 11.4 && c < 16) || c > 21.5;
    const bite = eating ? Math.max(0, Math.sin(t * (c > 11.4 && c < 16 ? 4.2 : 2.6))) : 0;
    denji.arms[0].rotation.set(duck > 0.1 ? lerp(-1.3, -3.0, duck) : lerp(lerp(-1.3, -2.0, bite), -2.8, cheers), 0, 0.3 + shrug * 0.7);
    denji.arms[1].rotation.set(duck > 0.1 ? lerp(-0.9, -2.8, duck) : -0.9, 0, -0.35 - shrug * 0.7);
    denji.head.rotation.set(lerp(-0.05, 0.18, bite) + duck * 0.4, 0.25 + look * 0.9 * (1 - duck) - cheers * 1.2, 0);
    animate(denji, t, 1.7);
    denji.group.position.y += jump * 0.18 - duck * 0.18;
    denji.group.scale.set(1 + jump * 0.06, 1 + jump * 0.06 - duck * 0.25, 1 + jump * 0.06);
    denji.ears.forEach((e) => e.scale.setScalar(1 + look * 0.3 + jump * 0.3));

    // The cat: the eyes open, the paw comes down, and leaves with the toast.
    const open = easeOutCubic(segment(c, 5.8, 6.3)) * (1 - easeInOutCubic(segment(c, 10.6, 11)));
    eyes.scale.set(1, Math.max(0.02, open), 1);
    const reach = easeInOutCubic(segment(c, 7.5, 8.1)) * (1 - easeInOutCubic(segment(c, 8.7, 9.6)));
    paw.visible = reach > 0.01;
    pad.position.lerpVectors(pawFrom, pawTo, reach);
    paw.children.forEach((part) => part !== pad && part !== forearm && part.position.copy(part.userData.rest ??= part.position.clone()).add(pad.position));
    forearm.position.copy(pad.position).add(new THREE.Vector3(1.05, 0.5, -0.1));
    const stolen = c > 8.1 && c < CYCLE - 0.5;
    if (stolen && c < 9.6) {
      slices[1].position.copy(pad.position).sub(table.position).add(new THREE.Vector3(0, -0.12, 0));
    } else if (stolen) {
      slices[1].visible = false;
    }
    if (!stolen) {
      slices[1].visible = true;
      slices[1].position.copy(sliceHome.position);
      slices[1].rotation.y = sliceHome.rotation;
    }

    // Lettering, in each panel's own half of the frame.
    const pop = (from, to) => (c > from && c < to ? Math.min(1, (c - from) * 6) : 0);
    bang.update({ x: 66, y: 22, size: 9, rotate: -10, opacity: pop(6.6, 7.6), scale: lerp(1.8, 1, easeOutBack(segment(c, 6.6, 6.9))), boil: Math.floor(t * 10), jitter: 0.08 });
    achoo.update({ x: 22, y: 26, size: 7, rotate: 8, opacity: pop(9.0, 10.2), scale: lerp(1.8, 1, easeOutBack(segment(c, 9.0, 9.3))), boil: Math.floor(t * 10), jitter: 0.06 });
    nom.update({ x: 80, y: 58, size: 4.5, rotate: -6, opacity: c > 11.6 && c < 15.5 ? 0.5 + bite * 0.5 : 0, scale: 1 + bite * 0.15, boil: Math.floor(t * 8), jitter: 0.04 });

    daisies.forEach((d, i) => (d.rotation.z = Math.sin(t * 0.9 + i) * 0.08));
    neon.forEach((n, i) => (n.visible = Math.sin(t * (7 + i * 3)) > -0.92 || i === 1));
    // Fireflies over the meadow.
    if (dt > 0 && Math.random() < dt * 10) {
      fireflies.emit({
        position: [(Math.random() - 0.5) * 6, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 3 - 1],
        velocity: [(Math.random() - 0.5) * 0.2, 0.08, (Math.random() - 0.5) * 0.2],
        life: 3 + Math.random() * 2,
        size: 0.05,
        gravity: 0,
        drag: 0,
        color: "#ffe680",
        intensity: 2,
      });
    }
    fireflies.step(dt);
    // Slow pushes in, opposite ways.
    const k = (Math.sin(t * 0.15) + 1) / 2;
    camL.position.set(lerp(1.5, 1.2, k), 1.45, lerp(4.6, 4.2, k));
    camL.lookAt(-0.2, 1.0, 0.4);
    camR.position.set(CITY_X + lerp(-1.6, -1.3, k), 1.5, lerp(4.4, 4.0, k));
    camR.lookAt(CITY_X + 0.2, 1.05, 0.6);
  };

  const render = () => {
    const { width: W, height: H } = stage.size;
    const half = Math.round(W / 2);
    renderer.setScissorTest(true);
    [
      [camL, COUNTRY, 0, half, 1, 0.75, 0.45],
      [camR, CITY, half, W - half, -0.4, 0.6, 0.7],
    ].forEach(([cam, pal, x, pw, lx, ly, lz]) => {
      w.palette(pal);
      w.light(lx, ly, lz);
      fireflies.points.visible = cam === camL;
      cam.aspect = pw / H;
      cam.updateProjectionMatrix();
      w.bu.uAspect.value = pw / H;
      renderer.setViewport(x, 0, pw, H);
      renderer.setScissor(x, 0, pw, H);
      renderer.render(w.scene, cam);
    });
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
  };

  const unsubscribeResize = stage.onResize(({ height }) => {
    w.sync();
    fireflies.resize(height, camL.fov, renderer.getPixelRatio());
  });

  return {
    update,
    render,
    dispose() {
      unsubscribeResize();
      [...labels, gutter].forEach((x) => x.remove());
      [bang, achoo, nom].forEach((x) => x.dispose());
    },
  };
};
