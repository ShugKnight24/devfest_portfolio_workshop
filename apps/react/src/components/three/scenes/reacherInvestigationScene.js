import * as THREE from "three";
import { canvasTexture, clamp01, easeInOutCubic, easeOutBack, lerp, lightBeam, segment } from "../kit";
import { INK, PAPER, RED, inkMaterial, mangaBackdrop, outlineMaterial, syncInk, setInkStyle } from "../ink";
import { blendPose } from "../figure";
import { createModelFigure } from "../modelFigure";
import { createCaption, createSfx } from "../sfx";

/**
 * Read the Scene — Reacher at the table, in the rain, with a flashlight.
 *
 * Six exhibits lie in the dark. His beam finds them one at a time, and a red
 * ink circle draws itself around the one detail on each that everyone else
 * walked past. Each exhibit is a planted flaw from the "Read the diff"
 * exercise in disguise (the receipt from a store that does not exist is the
 * npm package that does not exist), so the scene teaches the habit without
 * giving the answers away. The reveal slide pairs them up.
 *
 *   0    – 1.2   the room in the dark
 *   1.2  – 12.0  six exhibits, ~1.8 s each: beam travels, circle draws, mark lands
 *   12.0 – 15.3  he connects them: red string from each detail to the case file
 *                (the agent's PR, "CI passing")
 *   15.6 – 20.0  the file is stamped TRUST, THEN VERIFY; the room goes dark again
 *
 * The talk's line in one image: the agent is good and getting better, and it
 * still ships six mistakes with total confidence. Trust it. Then verify it.
 *
 * Reduced motion holds the frame with all six found.
 */

const CYCLE = 20;
const START = 1.2;
const STEP = 1.8;
const STATIC_TIME = 18;
// After the search: thread each exhibit to the case file, then stamp it.
const CONNECT = 12;
const THREAD = 0.55;
const STAMP = CONNECT + 6 * THREAD + 0.3;

/** The exhibits, laid out on the table, with where the telling detail sits on each card (uv). */
export const EXHIBITS = [
  {
    letter: "A",
    caption: "Receipt, Store #404",
    detail: [0.5, 0.42],
    draw(ctx, w, h) {
      ctx.strokeRect(w * 0.28, h * 0.2, w * 0.44, h * 0.48);
      ctx.font = `700 ${h * 0.045}px ui-monospace, Menlo, monospace`;
      ["STORE #404", "------------", "COFFEE   4.25", "BAGEL    3.10", "TOTAL    7.35"].forEach((l, i) => ctx.fillText(l, w * 0.31, h * (0.29 + i * 0.075)));
    },
  },
  {
    letter: "B",
    caption: "His watch. Two hours off.",
    detail: [0.5, 0.44],
    draw(ctx, w, h) {
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.44, w * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 7;
      [
        [-1.9, 0.1],
        [0.4, 0.16],
      ].forEach(([a, r]) => {
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.44);
        ctx.lineTo(w / 2 + Math.sin(a) * w * r, h * 0.44 - Math.cos(a) * w * r);
        ctx.stroke();
      });
      ctx.fillRect(w * 0.44, h * 0.18, w * 0.12, h * 0.06);
      ctx.fillRect(w * 0.44, h * 0.64, w * 0.12, h * 0.06);
    },
  },
  {
    letter: "C",
    caption: "Guest list. Starts at #2.",
    detail: [0.38, 0.27],
    draw(ctx, w, h) {
      ctx.font = `600 ${h * 0.05}px ui-monospace, Menlo, monospace`;
      ["  2. O'Donnell", "  3. Dixon", "  4. Neagley", "  5. Reacher"].forEach((l, i) => ctx.fillText(l, w * 0.18, h * (0.28 + i * 0.09)));
    },
  },
  {
    letter: "D",
    caption: "Alibi. Nobody called.",
    detail: [0.5, 0.36],
    draw(ctx, w, h) {
      ctx.font = `700 ${h * 0.055}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.fillText('"I WAS HOME."', w / 2, h * 0.34);
      ctx.font = `500 ${h * 0.04}px ui-monospace, Menlo, monospace`;
      ctx.fillText("verified: ____", w / 2, h * 0.47);
      ctx.textAlign = "left";
    },
  },
  {
    letter: "E",
    caption: "Key, left in the door.",
    detail: [0.56, 0.44],
    draw(ctx, w, h) {
      ctx.strokeRect(w * 0.26, h * 0.16, w * 0.48, h * 0.56);
      ctx.beginPath();
      ctx.arc(w * 0.62, h * 0.44, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.44);
      ctx.lineTo(w * 0.46, h * 0.44);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.42, h * 0.44, w * 0.05, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  {
    letter: "F",
    caption: '"Nothing was disturbed."',
    detail: [0.5, 0.5],
    draw(ctx, w, h) {
      ctx.strokeRect(w * 0.22, h * 0.3, w * 0.56, h * 0.36);
      ctx.strokeRect(w * 0.42, h * 0.44, w * 0.16, h * 0.06);
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.4 + i * 0.05), h * 0.42);
        ctx.lineTo(w * (0.43 + i * 0.05), h * 0.56);
        ctx.stroke();
      }
    },
  },
];

const cardTexture = (exhibit) =>
  canvasTexture(512, 640, (ctx, w, h) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.font = `800 ${h * 0.06}px "Space Grotesk", "Arial Black", sans-serif`;
    ctx.fillText(`EXHIBIT ${exhibit.letter}`, 36, 70);
    ctx.lineWidth = 6;
    exhibit.draw(ctx, w, h);
    ctx.fillStyle = INK;
    ctx.font = `700 ${h * 0.045}px "Space Grotesk", "Arial Black", sans-serif`;
    ctx.fillText(exhibit.caption, 36, h - 48);
  });

/** A red ink circle that draws itself on as `uProgress` goes 0 → 1. */
const circleMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uColor: { value: new THREE.Color(RED) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uProgress;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float a = atan(p.y, p.x);
        float t = fract((a + 3.14159 * 0.75) / 6.28318);
        // Hand-drawn: the radius wanders and the stroke overshoots its start.
        float r = 0.36 + 0.025 * sin(a * 3.0) + 0.02 * t;
        float band = 1.0 - smoothstep(0.018, 0.032, abs(length(p) - r));
        if (band < 0.01 || t > uProgress * 1.08) discard;
        gl_FragColor = vec4(uColor, band);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

const caseFileTexture = () =>
  canvasTexture(640, 440, (ctx, w, h) => {
    ctx.fillStyle = "#e9dcc0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = INK;
    ctx.font = `800 ${h * 0.09}px "Space Grotesk", "Arial Black", sans-serif`;
    ctx.fillText("CASE FILE: THE PR", 34, 80);
    ctx.font = `600 ${h * 0.065}px ui-monospace, Menlo, monospace`;
    ["feat: weekly spending", "summary from bank CSV", "", "\u2713 CI passing", "\u2713 handles all errors"].forEach((l, i) => ctx.fillText(l, 34, 150 + i * 48));
  });

const stampTexture = () =>
  canvasTexture(
    640,
    260,
    (ctx, w, h) => {
      ctx.strokeStyle = RED;
      ctx.fillStyle = RED;
      ctx.lineWidth = 16;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.font = `900 ${h * 0.3}px "Space Grotesk", "Arial Black", Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("TRUST, THEN", w / 2, h * 0.47);
      ctx.fillText("VERIFY", w / 2, h * 0.8);
    },
    { color: true },
  );

const LEAN = {
  spine: [0.42, 0, 0],
  chest: [0.12, 0, 0],
  neck: [0.2, 0, 0],
  head: [0.35, 0, 0],
  lShoulder: [-0.75, 0, 0.25],
  lElbow: [-0.35, 0, 0],
  rShoulder: [-1.25, 0, -0.1],
  rElbow: [-0.35, 0, 0],
  lHip: [-0.1, 0, 0.08],
  lKnee: [0.18, 0, 0],
  rHip: [0.05, 0, -0.08],
  rKnee: [0.12, 0, 0],
};

const CARD_W = 0.62;
const CARD_H = 0.78;
const TABLE_Y = 0.82;
const SLOTS = [
  [-1.15, -0.25, 0.14],
  [-0.38, 0.05, -0.08],
  [0.42, -0.2, 0.1],
  [1.18, 0.1, -0.12],
  [-0.75, 0.75, 0.06],
  [0.6, 0.75, -0.1],
];

export const createReacherInvestigationScene = (stage, { overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  const backdrop = mangaBackdrop();
  backdrop.material.uniforms.uRain.value = 1;
  backdrop.material.uniforms.uInvert.value = 1;
  backdrop.material.uniforms.uDisc.value.set(0.84, 0.82, 0.07);
  scene.add(backdrop);

  const line = outlineMaterial(1.1);

  // The table: a slab of ink catching the beam at its edge.
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.0), inkMaterial({ tone: 0.24, rim: 0.8, spec: 0 }));
  table.position.set(0, TABLE_Y - 0.04, 0.25);
  scene.add(table);

  const cards = EXHIBITS.map((exhibit, i) => {
    const [x, z, rot] = SLOTS[i];
    const mat = new THREE.MeshBasicMaterial({ map: cardTexture(exhibit), color: new THREE.Color(0.2, 0.2, 0.2) });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), mat);
    card.rotation.set(-Math.PI / 2, 0, rot);
    card.position.set(x, TABLE_Y + 0.002 + i * 0.0005, z);
    scene.add(card);
    const circle = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W * 0.62, CARD_W * 0.62), circleMaterial());
    circle.position.set((exhibit.detail[0] - 0.5) * CARD_W, (0.5 - exhibit.detail[1]) * CARD_H, 0.003);
    circle.renderOrder = 5;
    card.add(circle);
    return { exhibit, card, mat, circle };
  });

  // The case file: the agent's PR, lying in the middle of the evidence.
  const CASE = new THREE.Vector3(-0.08, TABLE_Y + 0.004, 1.0);
  const caseCard = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), new THREE.MeshBasicMaterial({ map: caseFileTexture(), color: new THREE.Color(0.25, 0.25, 0.25) }));
  caseCard.rotation.set(-Math.PI / 2, 0, 0.04);
  caseCard.position.copy(CASE);
  scene.add(caseCard);
  const stamp = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.32),
    new THREE.MeshBasicMaterial({ map: stampTexture(), transparent: true, opacity: 0.92, depthWrite: false }),
  );
  stamp.rotation.set(-Math.PI / 2, 0, 0.22);
  stamp.position.copy(CASE).add(new THREE.Vector3(0.04, 0.006, 0.02));
  stamp.renderOrder = 8;
  scene.add(stamp);

  // Red string, exhibit to case file, drawn on one thread at a time; a pin at each end.
  const stringMat = new THREE.MeshBasicMaterial({ color: RED });
  const pinGeo = new THREE.SphereGeometry(0.025, 12, 8);
  const threads = cards.map(() => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), stringMat);
    const pin = new THREE.Mesh(pinGeo, stringMat);
    scene.add(mesh, pin);
    return { mesh, pin, built: false };
  });
  const casePin = new THREE.Mesh(pinGeo, stringMat);
  casePin.position.copy(CASE).add(new THREE.Vector3(0, 0.02, -0.12));
  scene.add(casePin);
  const buildThread = (thread, from) => {
    const to = casePin.position;
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 0.07;
    thread.mesh.geometry.dispose();
    thread.mesh.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone()), 48, 0.008, 6);
    thread.pin.position.copy(from);
    thread.built = true;
  };

  // Reacher (modelled, CC0), leaning over the far edge, flashlight in hand.
  let reacher = null;
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.22, 12), inkMaterial({ flat: true }));
  const ready = createModelFigure({ height: 2.0, hair: ["HairBuzzed", "EyebrowsRegular"], line, ink: { tone: 0.92, rim: 0.55 }, outfit: { skin: "#d2a07c", top: "#4a3f33", bottom: "#2c3a52", shoes: "#2a1d16", hair: "#5a3d24", sleeves: "long" } }).then((figure) => {
    reacher = figure;
    reacher.root.position.set(0, 0, -1.25);
    scene.add(reacher.root);
    reacher.apply(LEAN);
    reacher.root.updateMatrixWorld(true);
    // Bind the torch at rest, pointing down the forearm, so it follows the hand.
    const hand = reacher.model.getObjectByName("hand_r");
    torch.position.copy(hand.getWorldPosition(new THREE.Vector3()));
    torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -0.6, 0.8).normalize());
    scene.add(torch);
    hand.attach(torch);
    syncInk(scene, renderer.getPixelRatio());
  });
  const beam = lightBeam({ from: [0, 0, 0], to: [0, 1, 0], radiusFrom: 0.04, radiusTo: 0.42, color: "#fff4d6" });
  scene.add(beam);
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 40),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff4d6"), transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  pool.rotation.x = -Math.PI / 2;
  scene.add(pool);

  const marks = EXHIBITS.map((e) => createSfx(overlay, { text: e.letter, crescendo: 0, color: PAPER }));
  const caption = createCaption(overlay, { x: 4, y: 7 });

  const camRig = { distance: 6.1 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    // Wide frames (the deck's 16:9 panel) can come in close; narrow ones pull back.
    camRig.distance = aspect >= 1.6 ? 4.7 : 6.1 * (1.3 / Math.min(aspect, 1.3)) ** 0.8;
  });
  const lookAt = new THREE.Vector3(0, 1.25, -0.1);
  const viewDir = new THREE.Vector3(0.12, 0.55, 1).normalize();
  const tmp = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const target = new THREE.Vector3();
  const toScreen = (v) => {
    tmp.copy(v).project(camera);
    return [(tmp.x * 0.5 + 0.5) * 100, (-tmp.y * 0.5 + 0.5) * 100];
  };
  const detailWorld = (c, out) => c.circle.getWorldPosition(out);

  const update = (time) => {
    const c = staticMode ? STATIC_TIME : time % CYCLE;
    const fade = staticMode ? 1 : Math.min(segment(c, 0, 0.8), 1 - segment(c, CYCLE - 0.8, CYCLE));

    camera.position.copy(viewDir).multiplyScalar(camRig.distance).add(lookAt);
    camera.position.x += Math.sin(time * 0.1) * 0.25 + pointer.x * 0.25;
    camera.position.y += pointer.y * 0.15;
    camera.lookAt(lookAt);
    if (!reacher) return; // body still loading

    // Which exhibit the beam is on, and how far along its circle is.
    const s = (c - START) / STEP;
    const k = Math.max(0, Math.min(EXHIBITS.length - 1, Math.floor(s)));
    const local = s - Math.floor(s);
    const searching = c >= START && s < EXHIBITS.length;

    // Head and torch follow the beam; a slow breath under it.
    const pose = blendPose(LEAN, LEAN, 0);
    pose.spine = [LEAN.spine[0] + Math.sin(time * 1.1) * 0.015, (SLOTS[k][0] / 1.2) * -0.2, 0];
    pose.head = [LEAN.head[0], (SLOTS[k][0] / 1.2) * -0.35, 0];
    pose.rShoulder = [LEAN.rShoulder[0] + SLOTS[k][1] * 0.25, 0, LEAN.rShoulder[2] - SLOTS[k][0] * 0.32];
    reacher.apply(pose);
    reacher.root.updateMatrixWorld(true);

    // Beam: eases from the last exhibit to this one, then holds while the circle draws.
    const prev = cards[Math.max(0, k - 1)];
    const here = cards[k];
    const travel = k === 0 && s < 1 ? 1 : easeInOutCubic(segment(local, 0, 0.3));
    const from = detailWorld(prev, new THREE.Vector3());
    detailWorld(here, target);
    target.lerpVectors(from, target, searching ? travel : 1);
    if (!searching && c >= START) target.set(0, TABLE_Y, 0.25); // wide, over everything found
    torch.getWorldPosition(tip);
    const len = tip.distanceTo(target);
    beam.position.copy(tip);
    beam.scale.set(searching ? 1 : 2.4, len, searching ? 1 : 2.4);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().sub(tip).normalize());
    beam.material.uniforms.uIntensity.value = 0.6 * fade * (c < START ? segment(c, 0.4, START) : 1);
    pool.position.set(target.x, TABLE_Y + 0.004, target.z);
    pool.scale.setScalar(searching ? 1 : 3.2);
    pool.material.opacity = 0.2 * fade;

    cards.forEach((card, i) => {
      const found = c >= START + (i + 0.35) * STEP;
      const draw = clamp01((c - (START + (i + 0.3) * STEP)) / (STEP * 0.4));
      card.circle.material.uniforms.uProgress.value = draw;
      card.circle.visible = draw > 0 && fade > 0.05;
      const near = Math.max(0, 1 - card.card.position.distanceTo(pool.position) / (searching ? 0.55 : 2.4));
      const lit = (found ? 0.62 : 0.18) + near * 0.5;
      card.mat.color.setScalar(lerp(0.12, Math.min(1, lit), fade));

      const [x, y] = toScreen(detailWorld(card, tmp.clone()).add(new THREE.Vector3(0.22, 0.05, -0.2)));
      const pop = segment(c, START + (i + 0.55) * STEP, START + (i + 0.75) * STEP);
      marks[i].update({ x, y, size: 7, rotate: -8, opacity: pop * fade, scale: lerp(1.8, 1, easeOutBack(pop)), boil: Math.floor(time * 6), jitter: 0.03 });
    });

    // Connect the dots: each thread draws from its exhibit to the case file.
    threads.forEach((thread, i) => {
      const start = CONNECT + i * THREAD;
      const draw = clamp01((c - start) / THREAD);
      if (draw > 0 && !thread.built) buildThread(thread, detailWorld(cards[i], new THREE.Vector3()).add(new THREE.Vector3(0, 0.01, 0)));
      thread.mesh.visible = draw > 0 && fade > 0.05;
      thread.pin.visible = thread.mesh.visible;
      if (thread.built) thread.mesh.geometry.setDrawRange(0, Math.floor(thread.mesh.geometry.index.count * easeInOutCubic(draw)));
    });
    casePin.visible = c >= CONNECT && fade > 0.05;
    const caseLit = c >= CONNECT ? 0.35 + 0.6 * segment(c, CONNECT, CONNECT + 0.6) : 0.22;
    caseCard.material.color.setScalar(lerp(0.12, caseLit, fade));
    const slam = segment(c, STAMP, STAMP + 0.25);
    stamp.visible = slam > 0 && fade > 0.05;
    stamp.scale.setScalar(lerp(1.9, 1, easeOutBack(slam)));
    stamp.material.opacity = 0.92 * fade;

    backdrop.material.uniforms.uSeed.value = Math.floor(time * 10);
    backdrop.material.uniforms.uIntensity.value = 0.55;

    const found = Math.max(0, Math.min(EXHIBITS.length, Math.floor((c - START) / STEP + 0.65)));
    caption.update({
      text:
        c < START
          ? "Everyone walked through this room."
          : searching
            ? `He reads it. ${found} of ${EXHIBITS.length}.`
            : c < STAMP
              ? "He connects them."
              : "Trust it. Then verify it.",
      size: 2.3,
      opacity: fade,
    });
  };

  // The show's look: a lit, rainy night rather than a printed page.
  const film = () => setInkStyle(scene, { film: true, shade: "#5c6a86", fog: "#141820" });
  film();
  ready.then(film);

  return {
    ready,
    update,
    dispose() {
      unsubscribeResize();
      [...marks, caption].forEach((x) => x.dispose());
    },
  };
};
