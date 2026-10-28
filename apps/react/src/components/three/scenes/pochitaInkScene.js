import * as THREE from "three";
import { canvasTexture, clamp01, createParticles, easeOutBack, easeOutCubic, hash, lerp, segment } from "../kit";
import { INK, RED, inkMaterial, mangaBackdrop, outline, outlineMaterial, setInkLight, syncInk, setInkStyle } from "../ink";
import { createSfx } from "../sfx";

/**
 * Pochita, cold open — the real character, drawn like a colour manga page.
 *
 * Built to his model sheet: egg body low at the haunches, blade straight out
 * of the forehead, two-lobed muzzle, big round side eyes, the black D-handle
 * over his head and the starter grip for a tail. The menace is in the
 * staging — low angle, open fanged mouth, blood on the chain, the page
 * flooding with focus lines — not in redrawing his face.
 *
 *   armed   a low growl: he trembles, the chain creeps, the lines boil
 *   fired   the pull: a hand yanks the starter grip of his tail out on its
 *           cord and lets it snap home — then the rev: chain races, the bar
 *           runs with blood, the frame shakes, the page floods red
 *
 * DevFest fires it from the song (Power in the Blood), so the pull is the
 * first thing the music does.
 */

const PULL = 0.9;
const REV = 1.4;
const BAR_LEN = 1.5;
const BAR_R = 0.25;
const PERIM = 2 * BAR_LEN + 2 * Math.PI * BAR_R;
const TEETH = 30;
const ORANGE = "#e8722a";
const ORANGE_DARK = "#c95c1f";

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

/** A jagged fang: a four-sided cone, slightly hooked. */
const fangGeometry = () => {
  const g = new THREE.ConeGeometry(1, 1, 4, 3);
  g.rotateY(Math.PI / 4);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) + (0.5 - y) ** 2 * 0.25);
  }
  g.computeVertexNormals();
  return g;
};

export const createPochitaInkScene = (stage, { props = {}, overlay } = {}) => {
  const { scene, camera, renderer, pointer, staticMode } = stage;
  scene.background = null;
  scene.environment = null;

  let fired = Boolean(props.fired);
  let firedAt = null;
  let chain = 0;

  const backdrop = mangaBackdrop();
  scene.add(backdrop);

  const line = outlineMaterial(1.3);
  const lineThin = outlineMaterial(0.75);
  // Pochita is orange; that is the character, so he keeps it. Shading is
  // still ink and screentone, like a colour page in the manga.
  const fur = inkMaterial({ tint: ORANGE, tone: 1.02, spec: 0 });
  const furShade = inkMaterial({ tint: ORANGE_DARK, tone: 0.96, spec: 0 });
  const steel = inkMaterial({ tint: "#e4e4df", tone: 1.32, rim: 0.4 });
  const rubber = inkMaterial({ tint: "#2b2b2b", tone: 1.1, rim: 0.8 });
  const ink = inkMaterial({ flat: true });
  const paper = inkMaterial({ tone: 1.25, rim: 0 });
  const bone = inkMaterial({ tone: 1.12, rim: 0.3 });
  const blood = inkMaterial({ tint: RED, tone: 1.15, rim: 0 });
  const skin = inkMaterial({ tint: "#f2c9a6", tone: 1.05, spec: 0 });
  const shirt = inkMaterial({ tint: "#f4f1ea", tone: 1.1, spec: 0 });
  // The bar's steel, and the colour it ends at once the chain has been through blood.
  const STEEL = new THREE.Color("#e4e4df");
  const GORE = new THREE.Color("#a3132a");

  const add = (parent, geometry, material, { lineMat = line } = {}) => {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    if (lineMat) outline(mesh, lineMat);
    return mesh;
  };

  // ── Rig ──────────────────────────────────────────────────────────────────
  // Pup space: +z is where his nose points, feet on y = 0.
  const rig = new THREE.Group(); // shake
  scene.add(rig);
  const pup = new THREE.Group(); // pose
  pup.rotation.set(0, -0.62, 0);
  rig.add(pup);

  // Body: an egg, wide and low at the haunches, the back sloping to the tail,
  // the head end full and high — his whole silhouette in one surface.
  const bodyGeo = new THREE.SphereGeometry(1, 128, 96);
  const p = bodyGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    x *= 0.8 * (1 + 0.16 * Math.max(0, -y)); // haunches
    y *= 0.86;
    if (y > 0) y *= 1 - Math.max(0, -z) * 0.32; // back slopes down to the tail
    if (y > 0) y *= 1 + Math.max(0, z) * 0.08; // crown sits forward
    if (y < -0.55) y = -0.55 - (y + 0.55) * 0.45; // flatter belly
    z *= 1.02;
    p.setXYZ(i, x, y, z);
  }
  bodyGeo.computeVertexNormals();
  const body = add(pup, bodyGeo, fur);
  body.position.y = 0.8;

  // Legs: stubby front legs, hind legs with thick haunches, toe lines inked.
  const paw = (x, z) => {
    const foot = add(pup, new THREE.SphereGeometry(1, 32, 16), fur);
    foot.scale.set(0.17, 0.08, 0.21);
    foot.position.set(x, 0.07, z + 0.05);
    for (const t of [-0.05, 0.05]) {
      const toe = add(pup, new THREE.BoxGeometry(0.008, 0.06, 0.05), ink, { lineMat: null });
      toe.position.set(x + t, 0.07, z + 0.22);
    }
  };
  [-1, 1].forEach((side) => {
    const front = add(pup, new THREE.CapsuleGeometry(0.17, 0.1, 8, 20), fur);
    front.position.set(side * 0.38, 0.2, 0.48);
    paw(side * 0.38, 0.48);
    const haunch = add(pup, new THREE.SphereGeometry(1, 48, 32), furShade);
    haunch.scale.set(0.26, 0.36, 0.38);
    haunch.position.set(side * 0.6, 0.38, -0.4);
    const hind = add(pup, new THREE.CapsuleGeometry(0.16, 0.08, 8, 20), furShade);
    hind.position.set(side * 0.58, 0.19, -0.34);
    paw(side * 0.58, -0.34);
  });

  // Eyes: big, round, on the sides of the head — white ring, black pupil.
  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    // Sat on the body surface, facing out to the side and a little forward.
    const facing = new THREE.Vector3(side * 0.74, 0.22, 0.64).normalize();
    eye.position.set(side * 0.6, 1.0, 0.66);
    eye.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing);
    pup.add(eye);
    const white = add(eye, new THREE.SphereGeometry(0.22, 40, 24), paper, { lineMat: lineThin });
    white.scale.set(1, 1, 0.4);
    const pupil = add(eye, new THREE.SphereGeometry(0.165, 40, 24), ink, { lineMat: null });
    // Proud of the white so it still reads at a grazing angle.
    pupil.scale.set(1, 1, 0.5);
    pupil.position.set(0, 0, 0.1);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), blood);
    glint.position.set(0.06, 0.06, 0.1);
    eye.add(glint);
  });

  // Muzzle: two lobes under the blade root, the mouth hung beneath them.
  [-1, 1].forEach((side) => {
    const lobe = add(pup, new THREE.SphereGeometry(0.19, 40, 24), fur);
    lobe.scale.set(1, 0.85, 0.9);
    lobe.position.set(side * 0.14, 0.86, 0.95);
  });

  // Mouth: open, fanged, wet. The menace comes from here, not from a new face.
  const mouth = new THREE.Group();
  mouth.position.set(0, 0.68, 0.94);
  mouth.rotation.x = -0.25;
  mouth.scale.setScalar(1.45);
  pup.add(mouth);
  const cavity = add(mouth, new THREE.SphereGeometry(1, 40, 20), ink, { lineMat: null });
  cavity.scale.set(0.24, 0.14, 0.1);
  const tongue = add(mouth, new THREE.SphereGeometry(1, 32, 16), blood, { lineMat: lineThin });
  tongue.scale.set(0.12, 0.045, 0.08);
  tongue.position.set(0.02, -0.08, 0.02);
  const fang = fangGeometry();
  const placeFangs = (count, upper) => {
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const a = lerp(-1.2, 1.2, u);
      const size = (upper ? 0.075 : 0.055) * (0.75 + hash(i + (upper ? 1 : 40)) * 0.5) * (1.15 - Math.abs(u - 0.5) * 0.5);
      const tooth = add(mouth, fang, bone, { lineMat: lineThin });
      tooth.scale.set(size * 0.42, size * 1.7, size * 0.42);
      const x = Math.sin(a) * 0.22;
      const y = (upper ? 0.1 : -0.1) * Math.cos(a * 0.8);
      tooth.position.set(x, y + (upper ? -size * 0.6 : size * 0.6), 0.05 + Math.cos(a) * 0.05);
      tooth.rotation.set(upper ? Math.PI : 0, 0, (upper ? 1 : -1) * a * 0.2);
      if (upper && hash(i + 7) > 0.5) {
        const drip = add(mouth, new THREE.CapsuleGeometry(0.009, 0.05 + hash(i) * 0.07, 4, 8), blood, { lineMat: lineThin });
        drip.position.set(x, y - size * 1.5 - 0.04, 0.07 + Math.cos(a) * 0.05);
      }
    }
  };
  placeFangs(7, true);
  placeFangs(6, false);

  // The blade: straight out of the centre of the forehead, forward and up.
  const saw = new THREE.Group();
  saw.position.set(0, 1.12, 0.84);
  const forward = new THREE.Vector3(0, 0.42, 0.91).normalize();
  const up = new THREE.Vector3(0, 0.91, -0.42).normalize();
  saw.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward, up, new THREE.Vector3().crossVectors(forward, up)));
  pup.add(saw);
  const bar = add(
    saw,
    new THREE.ExtrudeGeometry(barShape(), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 24 }),
    steel,
  );
  bar.position.z = -0.035;
  // The chain: a dark rail round the bar's edge, spikes standing off it.
  const rail = add(
    saw,
    new THREE.ExtrudeGeometry(barShape(), { depth: 0.06, bevelEnabled: false, curveSegments: 24 }),
    rubber,
    { lineMat: null },
  );
  // Thinner than the bar, larger in outline: only its edge shows.
  rail.scale.set(1.03, 1.14, 1);
  rail.position.z = -0.03;
  const spikeGeo = new THREE.ConeGeometry(0.045, 0.13, 4);
  spikeGeo.translate(0, 0.075, 0);
  const teeth = new THREE.InstancedMesh(spikeGeo, ink, TEETH);
  saw.add(teeth);
  const dummy = new THREE.Object3D();
  const placeChain = (offset) => {
    for (let i = 0; i < TEETH; i++) {
      const [x, y, a] = onBar(offset + (i / TEETH) * PERIM);
      dummy.position.set(x, y, 0);
      dummy.rotation.set(0, 0, a);
      dummy.updateMatrix();
      teeth.setMatrixAt(i, dummy.matrix);
    }
    teeth.instanceMatrix.needsUpdate = true;
  };

  // Top handle: the black D-loop arching front to back over his head.
  const loop = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 1.48, 0.2),
      new THREE.Vector3(0, 2.0, 0.14),
      new THREE.Vector3(0, 2.1, -0.2),
      new THREE.Vector3(0, 2.0, -0.7),
      new THREE.Vector3(0, 1.5, -0.8),
      new THREE.Vector3(0, 1.18, -0.68),
    ],
    false,
    "catmullrom",
    0.2,
  );
  add(pup, new THREE.TubeGeometry(loop, 80, 0.1, 16), rubber);

  // Tail: the starter grip, a black bar sticking out behind.
  const tail = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.46, -0.9), new THREE.Vector3(0, 0.36, -1.12), new THREE.Vector3(0, 0.32, -1.28)]);
  add(pup, new THREE.TubeGeometry(tail, 24, 0.035, 8), rubber, { lineMat: lineThin });
  const GRIP_REST = new THREE.Vector3(0, 0.32, -1.32);
  const CORD_ROOT = new THREE.Vector3(0, 0.32, -1.24);
  // Out and up, toward the right of frame (he is turned three-quarters, so
  // straight back would hide the whole pull behind him).
  const PULL_DIR = new THREE.Vector3(1.1, 0.55, -0.2).normalize();
  const grip = add(pup, new THREE.CapsuleGeometry(0.075, 0.42, 6, 16), rubber);
  grip.rotation.z = Math.PI / 2;
  grip.position.copy(GRIP_REST);
  // The starter cord: one unit long, stretched between the tail and the grip.
  const cordGeo = new THREE.CylinderGeometry(0.016, 0.016, 1, 8);
  cordGeo.translate(0, 0.5, 0);
  const cord = add(pup, cordGeo, paper, { lineMat: lineThin });
  cord.visible = false;
  // Denji's hand: a fist in a rolled white sleeve, in from off-frame behind him.
  const hand = new THREE.Group();
  pup.add(hand);
  const forearm = add(hand, new THREE.CapsuleGeometry(0.075, 0.5, 6, 16), skin);
  forearm.rotation.x = Math.PI / 2;
  forearm.position.z = -0.32;
  const sleeve = add(hand, new THREE.CylinderGeometry(0.11, 0.1, 0.26, 18), shirt);
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.z = -0.62;
  const fist = add(hand, new THREE.SphereGeometry(0.12, 24, 16), skin);
  fist.scale.set(1, 0.85, 1.1);
  hand.scale.setScalar(1.5);
  hand.visible = false;
  const yank = new THREE.Vector3();
  const offstage = new THREE.Vector3(3.2, 1.9, -1.4);

  // Ground: an ink pool, the only floor the page needs.
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), ink);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(0.9, 1.15, 1);
  pool.position.set(0, 0.002, -0.15);
  pup.add(pool);

  // Thrown off the blade on the rev: blood, and black ink flecks.
  // A hard-edged drop: ink does not blur.
  const drop = canvasTexture(
    64,
    64,
    (ctx, w) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    },
    { color: false },
  );
  const spray = createParticles({ count: 320, blending: "normal", texture: drop });
  const flecks = createParticles({ count: 220, blending: "normal", texture: drop });
  scene.add(spray.points, flecks.points);

  // Lettering: a low growl while armed, the rev slammed across the page.
  const growl = createSfx(overlay, { text: "GRRRR…", crescendo: 0.3, weight: 900 });
  const vroom = createSfx(overlay, { text: "VRRRRMMM!!", crescendo: 0.9 });

  const camRig = { distance: 4.7 };
  const unsubscribeResize = stage.onResize(({ aspect }) => {
    backdrop.material.uniforms.uAspect.value = aspect;
    syncInk(scene, renderer.getPixelRatio());
    [spray, flecks].forEach((ps) => ps.resize(stage.size.height, camera.fov, renderer.getPixelRatio()));
    camRig.distance = aspect < 1 ? 4.7 / aspect ** 0.6 : 4.7;
  });
  const lookAt = new THREE.Vector3(-0.3, 1.0, 0);
  const viewDir = new THREE.Vector3(0.2, -0.06, 1).normalize();
  const focus = new THREE.Vector3();

  const nose = new THREE.Vector3();
  // Every shaded material on him, with its resting tone, so the rev can sink
  // the whole figure into shadow and the idle can bring it back.
  const baseTones = new Map();
  pup.traverse((o) => {
    const u = o.material?.uniforms;
    if (u?.uTone && !u.uFlat.value) baseTones.set(u, u.uTone.value);
  });
  const KEY_TOP = new THREE.Vector3(-0.55, 0.75, 0.45).normalize();
  const KEY_UNDER = new THREE.Vector3(-0.15, -0.75, 0.65).normalize();
  const keyLight = new THREE.Vector3();
  const mouthAt = new THREE.Vector3();
  const lunge = new THREE.Vector3();
  let throwClock = 0;

  const update = (time, dt) => {
    if (fired && firedAt === null) firedAt = staticMode ? time - PULL - REV : time;
    if (!fired) firedAt = null;
    const since = firedAt === null ? -1 : time - firedAt;
    const t = since < PULL ? 0 : clamp01((since - PULL) / REV);
    const revving = since >= PULL;

    // The pull, before the rev:
    //   0    -> 0.3  the hand comes in and takes the grip
    //   0.3  -> 0.55 yank: grip and cord fly out, he jolts
    //   0.55 -> 0.75 let go: the cord snaps home, the hand leaves
    const p = since < 0 ? -1 : Math.min(since, PULL) / PULL;
    const reach = p < 0 ? 0 : easeOutCubic(segment(p, 0, 0.3));
    const out = p < 0 ? 0 : easeOutCubic(segment(p, 0.3, 0.55)) * (1 - easeOutCubic(segment(p, 0.55, 0.72)));
    grip.position.copy(GRIP_REST).addScaledVector(PULL_DIR, out * 1.35);
    yank.subVectors(grip.position, CORD_ROOT);
    cord.visible = yank.length() > 0.1;
    if (cord.visible) {
      cord.position.copy(CORD_ROOT);
      cord.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, yank.clone().normalize());
      cord.scale.set(1, yank.length(), 1);
    }
    const holding = p >= 0 && p < 0.6;
    const leaving = p >= 0.6 ? easeOutCubic(segment(p, 0.6, 1)) : 0;
    hand.visible = p >= 0 && leaving < 1;
    if (hand.visible) {
      hand.position.copy(offstage).lerp(grip.position, holding ? reach : 1 - leaving);
      hand.lookAt(pup.localToWorld(CORD_ROOT.clone()));
    }

    // The rev, beat by beat:
    //   0    -> 0.15 wind-up: he squats back on his haunches
    //   0.15 -> 0.35 lunge: he throws himself at the lens, blade first
    //   0.35 -> 1    hold: full rev, frame bucking, page flooding
    const windup = Math.sin(segment(t, 0, 0.15) * Math.PI) * (1 - segment(t, 0.15, 0.2));
    const strike = easeOutBack(segment(t, 0.15, 0.35));
    pup.scale.set(1 + windup * 0.06, 1 - windup * 0.1 + strike * 0.04, 1 - windup * 0.08 + strike * 0.06);
    lunge.set(0, 0, 1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, pup.rotation.y).multiplyScalar(strike * 0.18 - windup * 0.12);
    pup.position.set(lunge.x, strike * 0.05, lunge.z);
    pup.rotation.x = -windup * 0.08 + strike * 0.06 - out * 0.05;

    // Camera: low hero angle; on the rev it punches in and rolls to a dutch tilt.
    const punch = Math.sin(time * 0.25) * 0.08 + strike * 0.28;
    camera.position.copy(viewDir).multiplyScalar(camRig.distance - punch).add(lookAt);
    camera.position.x += pointer.x * 0.25;
    camera.position.y += pointer.y * 0.15;
    camera.up.set(0, 1, 0).applyAxisAngle(viewDir, strike * -0.12);
    camera.lookAt(lookAt);

    // Growl: a tremble that never settles. Rev: the whole frame bucks.
    const amp = revving ? lerp(0.07, 0.03, segment(t, 0.35, 1)) * Math.min(1, strike + 0.3) : 0.008;
    const shake = staticMode ? 0 : amp;
    rig.position.set(Math.sin(time * 83) * shake, Math.sin(time * 71 + 1) * shake * 0.7, Math.sin(time * 59) * shake * 0.5);

    // Face: his own face, never redrawn. The menace is light: on the strike the
    // key drops under his jaw, so his brow and eyes fall into ink and tone.
    mouth.scale.set(1.45, 1.45 * (1 + (revving ? Math.sin(time * 30) * 0.03 : Math.sin(time * 9) * 0.03)), 1.45);
    keyLight.copy(KEY_TOP).lerp(KEY_UNDER, easeOutCubic(segment(t, 0.12, 0.3))).normalize();
    setInkLight(pup, keyLight);
    const dusk = lerp(1, 0.74, easeOutCubic(segment(t, 0.12, 0.3)));
    baseTones.forEach((tone, u) => (u.uTone.value = tone * dusk));

    // The chain goes through blood and comes out red: the bar is soaked by the hold.
    steel.uniforms.uTint.value.copy(STEEL).lerp(GORE, revving ? easeOutCubic(segment(t, 0.2, 0.75)) : 0);
    chain += (revving ? lerp(1.2, 14, segment(t, 0.15, 0.5)) : 0.25) * dt;
    placeChain(chain);

    // The page: lines boil at 8 frames a second, thicker and faster on the rev.
    const boil = Math.floor(time * (revving ? 12 : 8));
    backdrop.material.uniforms.uSeed.value = boil;
    backdrop.material.uniforms.uIntensity.value = 1 + strike * 0.6;
    backdrop.material.uniforms.uSplash.value = 1;
    backdrop.material.uniforms.uSpread.value = 1 + easeOutCubic(segment(t, 0.2, 0.7)) * 0.55;
    focus.set(0, 1.3, 1.2).applyMatrix4(pup.matrixWorld).project(camera);
    backdrop.material.uniforms.uFocus.value.set(focus.x * 0.5 + 0.5, focus.y * 0.5 + 0.5);

    // Spray off the turning chain once he strikes.
    saw.updateWorldMatrix(true, false);
    if (revving && strike > 0.5 && dt > 0) {
      throwClock += dt;
      while (throwClock > 0.012) {
        throwClock -= 0.012;
        const along = Math.random();
        nose.set(lerp(0.3, BAR_LEN + BAR_R, along), BAR_R * (Math.random() < 0.5 ? 1 : -1), 0).applyMatrix4(saw.matrixWorld);
        const wet = Math.random() < 0.7;
        (wet ? spray : flecks).emit({
          position: [nose.x, nose.y, nose.z],
          velocity: [(Math.random() - 0.6) * 4, 1 + Math.random() * 3.5, (Math.random() - 0.3) * 3],
          life: 0.7 + Math.random() * 0.5,
          size: wet ? 0.06 + Math.random() * 0.09 : 0.025 + Math.random() * 0.03,
          gravity: 9.8,
          drag: 0.6,
          color: wet ? RED : INK,
          alpha: 1,
        });
      }
    }
    // And it drips: off the underside of the bar, the whole time it runs.
    if (revving && t > 0.3 && dt > 0 && Math.random() < dt * 22) {
      nose.set(lerp(0.2, BAR_LEN, Math.random()), -BAR_R, 0).applyMatrix4(saw.matrixWorld);
      spray.emit({ position: [nose.x, nose.y, nose.z], velocity: [0, -0.3, 0], life: 0.9, size: 0.05 + Math.random() * 0.05, gravity: 9.8, drag: 0.2, color: RED, alpha: 1 });
    }
    spray.step(dt);
    flecks.step(dt);

    // Lettering. Screen positions follow the action, so it stays composed at any size.
    mouthAt.set(0, 0, 0).applyMatrix4(mouth.matrixWorld).project(camera);
    const mx = (mouthAt.x * 0.5 + 0.5) * 100;
    const my = (-mouthAt.y * 0.5 + 0.5) * 100;
    const jolt = revving && !staticMode ? [Math.sin(time * 97) * 6 * strike, Math.sin(time * 89) * 5 * strike] : [0, 0];
    growl.update({
      x: mx - 4,
      y: my + 15,
      size: 5.5,
      rotate: -8,
      opacity: revving ? 1 - segment(t, 0.05, 0.18) : 0.85 + Math.sin(time * 3) * 0.15,
      scale: 1 + Math.sin(time * 9) * 0.02,
      boil: Math.floor(time * 6),
      jitter: 0.05,
    });
    const slam = segment(t, 0.18, 0.4);
    vroom.update({
      x: 74,
      y: 13,
      size: 9.5,
      rotate: -9,
      opacity: revving ? Math.min(1, slam * 4) : 0,
      scale: revving ? lerp(2.3, 1, easeOutBack(slam)) : 1,
      boil,
      jitter: 0.06 + strike * 0.04,
      shake: jolt,
    });
  };

  placeChain(0);

  // The film's look: anime cel shading instead of screentone.
  setInkStyle(scene, { shade: "#9a5a72" });

  return {
    update,
    setProps(next) {
      fired = Boolean(next.fired);
    },
    dispose() {
      unsubscribeResize();
      growl.dispose();
      vroom.dispose();
    },
  };
};
