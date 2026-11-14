// ARCHIVED: the "We had it good" backdrop, cut from the DevFest deck. To bring
// it back, move this file up to scenes/, set its imports back to "../", and
// register "assembly-line" in SceneStage.jsx.
//
// The slide it played behind, as it stood in devfestSlides.js:
//
//   {
//     id: "we-had-it-good",
//     backdrop: "assembly-line",
//     backdropAlt: "Film-style animation of a Detroit assembly line at night under sodium lights: bare car bodies roll in through a doorway and pass robot arms that weld them in small showers of sparks, hang doors and set windshields, and press on wheels, then come out of a paint booth red or blue and roll on through the far wall, while one worker in a brown jacket and cap watches a robot arm take over his welding station, pushes his safety glasses up, and walks off the line toward the open bay door and the morning outside.",
//     type: "statement",
//     altitude: ALTITUDE.CONCEPT,
//     tier: TIER.CORE,
//     budget: 55,
//     phase: "How you look at it",
//     center: true,
//     title: "We had it good.\nFor a long time.",
//     description:
//       "In May 2024 the median U.S. software developer earned about $133,000. The median across every job in the country was about $49,500. Add remote work, free lunch and recruiters in the inbox. Detroit has watched whole trades get re-tooled: robots on the line, typesetting gone digital. The people who came through first were the ones with the deepest fundamentals. What a lot of us feel right now, most workers have lived with all along.",
//     signature: "// The doom is a real view.\n// It is a view from the bottom of the valley.",
//   },
//
// // Presenter note:
//   "we-had-it-good":
//     "Say it with care: people in this room may have lost jobs. Read the two numbers, then pause. 'We were lucky for a long time.' Detroit line: this city has lived through re-tooling before, and the people with deep fundamentals came through first. Land the signature: the doom is real, and it is one view. Verify the BLS figures on bls.gov before the talk.",

import * as THREE from "three";
import { createInkWorld } from "../../rezeKit";
import { canvasTexture, createParticles, easeInOutCubic, easeOutCubic, hash, hdr, lerp, lightBeam, segment, smoothstep, softDot } from "../../kit";
import { createModelFigure } from "../../modelFigure";
import { createRobotArm } from "../../robotArm";
import { outline } from "../../ink";

/**
 * The Line — a Detroit assembly plant at night, behind "We had it good. For a
 * long time." Sodium light, haze, and one continuous line. Bare bodies roll in
 * through a doorway in the side wall by the bay door, swing onto the main line
 * and travel up the hall, gaining parts at every station:
 *
 *   weld     arms run seams on the bare shell, small showers of sparks
 *   glass    arms lift doors (with their side glass) off a fixture and hang
 *            them; a third sets the windshield
 *   wheels   arms take wheels from a rack and press them onto the hubs
 *   paint    the body goes into a booth in bare steel and comes out red (sedans)
 *            or blue (pickups), then rolls on through the back wall
 *
 * One man in a Detroit jacket stands at the weld station that was his. A new
 * arm wakes up there and takes his job; he pushes his safety glasses up and
 * walks the length of the floor, against the flow of the line, into the open
 * bay door where the morning is. Transition, not loss: the rim light cools as
 * he walks toward the door. Plain plant arms: FANUC yellow and KUKA orange,
 * grey bases, cable dress, an amber status lamp, nothing glowing.
 *
 *   0.0 – 4.0   wide, from behind the paint booth: painted bodies roll out
 *               toward us; the whole line works down to the bay door
 *   4.0         cut: close on him at his station, his arm parked and dark
 *   4.2 – 5.5   the arm powers up and unfolds; it welds where he stood
 *   6.0 – 7.0   he steps back from the line
 *   7.0 – 8.6   pushes his glasses up onto his forehead; looks down, then
 *               down the floor at the door
 *   9.4 – 10.2  he turns toward the light
 *   10.0 – 18.0 he walks the floor and out the door, into silhouette; a soft
 *               bloom breath covers the cut back to the top
 *
 * The line moves continuously: bodies sit PITCH apart and advance exactly two
 * pitches per loop, alternating sedan / pickup, so the line is identical at 0
 * and 18. Every arm's motion and every part on every body is a function of
 * where the bodies are, so it loops for free. No body ever leaves the floor in
 * view: they enter and leave through doorways in the walls.
 * Reduced motion holds 10.2: he has turned from the welding arm toward the
 * door, sparks falling behind him.
 */

const LOOP = 18;
const STATIC_TIME = 10.2;
const CUT = 4.0;

// The line: a leg in from the side wall, a quarter turn, then straight up the hall.
const PITCH = 7;
const N_CARS = 10;
const SPAN = PITCH * N_CARS;
const SPEED = (2 * PITCH) / LOOP;
const BELT = 0.55;
const X_START = -20;
const R_TURN = 3;
const Z_TURN = -20.5;
const Z_ENTRY = Z_TURN - R_TURN;
const L_LEG = -R_TURN - X_START;
const L_ARC = (R_TURN * Math.PI) / 2;
const S_STRAIGHT = L_LEG + L_ARC;

const DOOR_Z = -26;
const DOOR_X = 2.2;
const DOOR_W = 9;
const DOOR_H = 6.5;
const Z_BACK = 18;
const HALL_W = 18;
const HALL_H = 9.4;

// Stations, in the order a body meets them.
const HIS = -15.5;
const Z_GLASS = -10;
const Z_WHEELS = -5.2;
const BOOTH_Z0 = -2.6;
const BOOTH_Z1 = 4.0;
const BOOTH_MID = 0.7;

const NIGHT = { ground: "#140d09", lines: "#ffa258", accent: "#ff8a3a", rim: "#ff9e5c", shade: "#3d4a66" };
const SODIUM_KEY = new THREE.Color(1.25, 0.8, 0.45);
const RIM_WARM = new THREE.Color("#ff9e5c");
const RIM_COOL = new THREE.Color("#a9cbff");
const PAINT = { sedan: "#a3201c", pickup: "#1f4a8a" };

// A Detroit jacket: brown duck, corduroy collar, leather gloves, jeans, boots.
// Saturated on purpose: sodium light and the fog grey everything toward the air.
const WORKER = { skin: "#c99a78", top: "#a8601f", collar: "#4a2a12", sleeves: "long", arms: "#c9a060", bottom: "#24508f", shoes: "#3b2210", trim: "#1a0f08", hair: "#4a423a" };
const CAP = "#1d2f5c";

const UP = new THREE.Vector3(0, 1, 0);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mod = (a, n) => ((a % n) + n) % n;
const wrapPi = (a) => mod(a + Math.PI, Math.PI * 2) - Math.PI;
const yawOfVec = (x, z) => Math.atan2(x, z);

/** Centre and heading of a body `s` metres along the line. */
const pathAt = (s, out) => {
  if (s < L_LEG) {
    out.x = X_START + s;
    out.z = Z_ENTRY;
    out.yaw = 0;
  } else if (s < S_STRAIGHT) {
    const p = -Math.PI / 2 + (s - L_LEG) / R_TURN;
    out.x = -R_TURN + R_TURN * Math.cos(p);
    out.z = Z_TURN + R_TURN * Math.sin(p);
    out.yaw = Math.atan2(-Math.cos(p), -Math.sin(p));
  } else {
    out.x = 0;
    out.z = Z_TURN + (s - S_STRAIGHT);
    out.yaw = -Math.PI / 2;
  }
  return out;
};
/** Path distance at which a point on the straight reaches world z. */
const sAtZ = (z) => S_STRAIGHT + (z - Z_TURN);

/* --------------------------------------------------------------------------
 * Bodies: stamped steel with open door apertures, so the doors can be hung.
 * Built along local +x (front); local +z is world -x once on the line, so a
 * part for world side `s` (+1 = the walkway side) sits at local z = -s * ...
 * ------------------------------------------------------------------------ */

const extrude = (shape, depth, bevel = 0.015) =>
  new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 10 });

const rectPath = (P, x0, x1, y0, y1) => {
  const p = new P();
  p.moveTo(x0, y0);
  p.lineTo(x1, y0);
  p.lineTo(x1, y1);
  p.lineTo(x0, y1);
  p.closePath();
  return p;
};

const sideShape = (pts, arches, bottom, hole) => {
  // pts: the top line from rear to front, drawn back from the nose; a point
  // [x, y, cx, cy] is reached by a curve through (cx, cy) from the one after it.
  // Wheel arches are cut out of the rocker line; `hole` is the door aperture.
  const s = new THREE.Shape();
  const [first] = pts;
  s.moveTo(first[0], bottom + 0.12);
  s.lineTo(first[0] + 0.12, bottom);
  for (const [cx, r] of arches) {
    s.lineTo(cx - r, bottom);
    s.absarc(cx, bottom + 0.1, r, Math.PI, 0, true);
    s.lineTo(cx + r, bottom);
  }
  const last = pts[pts.length - 1];
  s.lineTo(last[0] - 0.1, bottom);
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    if (p.length === 4) s.quadraticCurveTo(p[2], p[3], p[0], p[1]);
    else s.lineTo(p[0], p[1]);
  }
  s.closePath();
  if (hole) s.holes.push(rectPath(THREE.Path, ...hole));
  return s;
};

const thinCurve = (a, ctrl, b, t = 0.05) => {
  const s = new THREE.Shape();
  s.moveTo(a[0], a[1]);
  s.quadraticCurveTo(ctrl[0], ctrl[1], b[0], b[1]);
  s.lineTo(b[0], b[1] - t);
  s.quadraticCurveTo(ctrl[0], ctrl[1] - t, a[0], a[1] - t);
  s.closePath();
  return s;
};

/** A flat convex polygon from 3D points (a fan), for glass. */
const polyGeo = (pts) => {
  const pos = [];
  for (let i = 1; i < pts.length - 1; i++) pos.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
};

// Per type: door aperture [x0, x1, y0, y1], side window (rear-bottom, front-
// bottom, front-top, rear-top), windshield (bottom edge, top edge), wheels.
const SPEC = {
  sedan: {
    W: 1.8,
    hole: [-0.9, 0.85, 0.4, 0.95],
    win: [
      [-1.18, 1.0],
      [0.88, 0.98],
      [0.45, 1.4],
      [-0.86, 1.4],
    ],
    winZ: [0.86, 0.72],
    shield: [
      [0.96, 0.98, 0.82],
      [0.42, 1.44, 0.68],
    ],
    axles: [1.42, -1.42],
    wheelY: 0.3,
    wheelR: 0.36,
  },
  pickup: {
    W: 1.96,
    hole: [-0.45, 1.15, 0.55, 1.2],
    win: [
      [-0.47, 1.32],
      [1.1, 1.31],
      [0.72, 1.84],
      [-0.47, 1.86],
    ],
    winZ: [0.94, 0.78],
    shield: [
      [1.18, 1.27, 0.9],
      [0.74, 1.87, 0.74],
    ],
    axles: [1.85, -1.75],
    wheelY: 0.38,
    wheelR: 0.43,
  },
};

const buildBody = (type, mats) => {
  const { steel, dark, line, glass, rubber, rim } = mats;
  const S = SPEC[type];
  const g = new THREE.Group();
  const add = (geo, mat = steel, pos = null, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    parent.add(m);
    outline(m, line);
    return m;
  };
  const box = (w, h, d, x, y, z, mat) => add(new THREE.BoxGeometry(w, h, d), mat, [x, y, z]);
  const strut = (a, b, w = 0.08, d = 0.08) => {
    const dir = b.clone().sub(a);
    const m = add(new THREE.BoxGeometry(w, dir.length(), d));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
  };
  const W = S.W;
  const sideZ = (ls) => (ls > 0 ? W / 2 - 0.06 : -W / 2);
  const sides = (shape) => {
    const geo = extrude(shape, 0.06);
    for (const ls of [-1, 1]) add(geo, steel, [0, 0, sideZ(ls)]);
  };
  const across = (shape, depth) => {
    const geo = extrude(shape, depth);
    geo.translate(0, 0, -depth / 2);
    add(geo);
  };

  if (type === "sedan") {
    // rear deck → trunk → beltline → cowl → hood → nose
    sides(
      sideShape(
        [
          [-2.36, 0.72],
          [-2.3, 0.95, -2.1, 0.99],
          [-1.6, 1.0],
          [-1.25, 1.02],
          [0.95, 1.0, 1.7, 0.98],
          [2.22, 0.86, 2.38, 0.8],
          [2.38, 0.5],
        ],
        [
          [-1.42, 0.44],
          [1.42, 0.44],
        ],
        0.2,
        S.hole,
      ),
    );
    across(thinCurve([0.95, 1.0], [1.7, 0.98], [2.22, 0.86]), W - 0.08);
    across(thinCurve([-2.32, 0.95], [-2.1, 0.99], [-1.25, 1.02]), W - 0.08);
    across(thinCurve([0.45, 1.47], [-0.2, 1.57], [-0.9, 1.44], 0.05), 1.42);
    box(0.12, 0.5, W - 0.06, 2.3, 0.55, 0);
    box(0.1, 0.55, W - 0.06, -2.32, 0.62, 0);
    box(4.3, 0.05, W - 0.08, 0, 0.27, 0, dark);
    box(0.05, 0.62, W - 0.08, 0.95, 0.66, 0, dark);
    box(0.05, 0.7, W - 0.08, -1.25, 0.65, 0, dark);
    for (const ls of [-1, 1]) {
      const z = ls * 0.84;
      const zr = ls * 0.7;
      strut(v3(0.98, 0.98, z), v3(0.43, 1.45, zr));
      strut(v3(-0.18, 0.98, z), v3(-0.22, 1.5, zr), 0.1);
      strut(v3(-1.28, 1.0, z), v3(-0.88, 1.42, zr), 0.12);
    }
  } else {
    sides(
      sideShape(
        [
          [-2.8, 1.28],
          [-0.55, 1.3],
          [1.2, 1.28],
          [2.6, 1.22, 2.8, 1.2],
          [2.8, 1.12],
          [2.82, 0.75],
        ],
        [
          [-1.75, 0.52],
          [1.85, 0.52],
        ],
        0.28,
        S.hole,
      ),
    );
    across(thinCurve([1.2, 1.28], [1.9, 1.27], [2.62, 1.22]), W - 0.08);
    across(thinCurve([0.78, 1.9], [0.1, 1.98], [-0.56, 1.92], 0.05), 1.52);
    box(0.12, 0.8, W - 0.06, 2.76, 0.75, 0);
    box(0.06, 1.0, W - 0.08, -0.56, 0.84, 0);
    box(0.06, 0.66, W - 0.08, -2.76, 0.95, 0);
    box(2.2, 0.05, W - 0.08, -1.68, 0.62, 0, dark);
    box(1.8, 0.05, W - 0.08, 0.33, 0.4, 0, dark);
    box(0.05, 0.8, W - 0.08, 1.2, 0.85, 0, dark);
    for (const ls of [-1, 1]) {
      const z = ls * 0.92;
      const zr = ls * 0.76;
      strut(v3(1.2, 1.27, z), v3(0.76, 1.88, zr));
      strut(v3(0.25, 1.28, z), v3(0.22, 1.92, zr), 0.1);
      strut(v3(-0.53, 1.29, z), v3(-0.53, 1.9, zr), 0.12);
    }
  }
  // The skid it rides on.
  for (const s of [-1, 1]) box(4.2, 0.1, 0.12, 0, -0.05, s * 0.52, dark);
  for (const x of [-1.6, 0, 1.6]) box(0.12, 0.08, 1.2, x, -0.05, 0, dark);

  /* Parts: each a group whose origin is the point an arm grips (on the face
   * the arm comes from), placed on the body at that point. `normal` is that
   * face's outward normal in body space. Hidden until the arm hangs them. */
  const parts = {};
  const part = (key, grip, normal, build) => {
    const p = new THREE.Group();
    p.name = `part:${key}`;
    p.position.copy(grip);
    const holder = new THREE.Group();
    holder.position.copy(grip).negate();
    p.add(holder);
    build(holder);
    p.userData = { key, grip: grip.clone(), normal: normal.clone().normalize() };
    p.visible = false;
    g.add(p);
    parts[key] = p;
  };
  const [x0, x1, y0, y1] = S.hole;
  for (const s of [-1, 1]) {
    const ls = -s;
    const key = s > 0 ? "doorP" : "doorN";
    part(key, v3((x0 + x1) / 2, (y0 + y1) / 2, ls * (W / 2)), v3(0, 0, ls), (h) => {
      // The door skin fills the aperture; its window rises above the beltline.
      add(extrude(rectPath(THREE.Shape, x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02), 0.06), steel, [0, 0, sideZ(ls)], h);
      if (type === "sedan") add(new THREE.BoxGeometry(0.03, y1 - y0 - 0.06, 0.03), dark, [-0.05, (y0 + y1) / 2, ls * (W / 2 + 0.012)], h);
      add(new THREE.BoxGeometry(0.16, 0.035, 0.03), dark, [x1 - 0.32, y1 - 0.12, ls * (W / 2 + 0.02)], h);
      const [zb, zt] = S.winZ;
      const yb = S.win[0][1];
      const yt = S.win[3][1];
      const pts = S.win.map(([x, y]) => [x, y, ls * lerp(zb, zt, (y - yb) / (yt - yb))]);
      const glassMesh = new THREE.Mesh(polyGeo(pts), glass);
      h.add(glassMesh);
    });
  }
  {
    const [[bx, by, bz], [tx, ty, tz]] = S.shield;
    const pts = [
      [bx, by, -bz],
      [bx, by, bz],
      [tx, ty, tz],
      [tx, ty, -tz],
    ];
    const n = v3(ty - by, bx - tx, 0).normalize(); // up and forward
    const c = v3((bx + tx) / 2, (by + ty) / 2, 0).addScaledVector(n, 0.01);
    part("shield", c, n, (h) => {
      const m = new THREE.Mesh(polyGeo(pts), glass);
      h.add(m);
      outline(m, line);
    });
  }
  const tyreGeo = new THREE.CylinderGeometry(S.wheelR, S.wheelR, 0.24, 28);
  tyreGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(S.wheelR * 0.6, S.wheelR * 0.6, 0.26, 18);
  rimGeo.rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(S.wheelR * 0.17, S.wheelR * 0.17, 0.29, 10);
  capGeo.rotateX(Math.PI / 2);
  S.axles.forEach((ax, i) => {
    for (const s of [-1, 1]) {
      const ls = -s;
      const centre = v3(ax, S.wheelY, ls * (W / 2 - 0.13));
      part(`wheel${i ? "R" : "F"}${s > 0 ? "P" : "N"}`, centre.clone().add(v3(0, 0, ls * 0.13)), v3(0, 0, ls), (h) => {
        add(tyreGeo, rubber, centre.toArray(), h);
        add(rimGeo, rim, centre.toArray(), h);
        add(capGeo, dark, centre.toArray(), h);
      });
    }
  });

  g.userData = { type, halfW: W / 2 };
  g.parts = parts; // not in userData: clone() would deep-copy it
  return g;
};

// Weld spots per body: [local x along the body, height above the skid, kind].
// All on metal: rockers, pillars, arch lips and roof rails, clear of the doors.
const SPOTS = {
  sedan: [
    [1.85, 0.7, "side"],
    [1.1, 0.82, "side"],
    [0.5, 0.3, "side"],
    [0.3, 1.5, "roof"],
    [0.92, 0.97, "side"],
    [-0.4, 0.3, "side"],
    [-0.3, 1.53, "roof"],
    [-1.12, 0.86, "side"],
    [-1.9, 0.76, "side"],
  ],
  pickup: [
    [2.25, 0.9, "side"],
    [1.3, 1.2, "side"],
    [0.6, 1.9, "roof"],
    [0.4, 0.42, "side"],
    [-0.52, 1.0, "side"],
    [0.0, 1.95, "roof"],
    [-1.0, 0.8, "side"],
    [-1.8, 1.2, "side"],
    [-2.4, 0.86, "side"],
  ],
};

/* --------------------------------------------------------------------------
 * Painted light: the morning beyond the door, and the floor decals that stand
 * in for light the ink shading cannot cast.
 * ------------------------------------------------------------------------ */

const morningSky = () =>
  canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#9fbbe6");
    g.addColorStop(0.45, "#d6e4fb");
    g.addColorStop(0.64, "#fff0da");
    g.addColorStop(0.68, "#f4ead9");
    g.addColorStop(1, "#d9dbd8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // The skyline across the river, in haze: towers low on the horizon.
    const horizon = h * 0.665;
    ctx.fillStyle = "rgba(150,170,200,0.45)";
    const towers = [
      [0.18, 0.02, 0.05],
      [0.24, 0.03, 0.035],
      [0.31, 0.018, 0.06],
      [0.44, 0.022, 0.07],
      [0.5, 0.03, 0.1],
      [0.555, 0.022, 0.07],
      [0.62, 0.02, 0.045],
      [0.7, 0.03, 0.03],
      [0.77, 0.02, 0.05],
    ];
    for (const [x, tw, th] of towers) ctx.fillRect((x - tw / 2) * w, horizon - th * h, tw * w, th * h + 2);
    // A round centre tower over the rest.
    ctx.beginPath();
    ctx.ellipse(0.5 * w, horizon - 0.1 * h, 0.018 * w, 0.006 * h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(0.47 * w, horizon - 0.02 * h, 0.06 * w, 0.02 * h);
  });

const groundOut = () =>
  canvasTexture(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#e6e8e6");
    g.addColorStop(1, "#b9bfc4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

const doorSpill = () =>
  canvasTexture(
    128,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Soft sides.
      ctx.globalCompositeOperation = "destination-in";
      const sideFade = ctx.createLinearGradient(0, 0, w, 0);
      sideFade.addColorStop(0, "rgba(0,0,0,0)");
      sideFade.addColorStop(0.18, "rgba(0,0,0,1)");
      sideFade.addColorStop(0.82, "rgba(0,0,0,1)");
      sideFade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sideFade;
      ctx.fillRect(0, 0, w, h);
    },
    { color: false },
  );

const shadowTex = () =>
  canvasTexture(
    64,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "rgba(0,0,0,0.9)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h);
      ctx.lineTo(w * 0.7, h);
      ctx.lineTo(w * 0.95, 0);
      ctx.lineTo(w * 0.05, 0);
      ctx.closePath();
      ctx.fill();
    },
    { color: false },
  );

// Stencilled booth sign, plain English.
const boothSign = () =>
  canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#d8cfae";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2a2622";
    ctx.font = `700 ${h * 0.62}px "Space Grotesk", "Inter", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAINT 2", w / 2, h * 0.54);
  });

/* --------------------------------------------------------------------------
 * The man. Poses use figure.js's joint convention (see retarget.js).
 * ------------------------------------------------------------------------ */

const STAND = { spine: [0.03, 0, 0], lShoulder: [0.02, 0, 0.08], rShoulder: [0.02, 0, -0.08], lElbow: [-0.15, 0, 0], rElbow: [-0.15, 0, 0] };
const WALK = (p) => {
  const s = Math.sin(p);
  return {
    spine: [0.06, 0, 0],
    lShoulder: [-0.3 * s, 0, 0.08],
    lElbow: [-0.35, 0, 0],
    rShoulder: [0.3 * s, 0, -0.08],
    rElbow: [-0.35, 0, 0],
    lHip: [0.45 * s - 0.05, 0, 0.03],
    lKnee: [Math.max(0, -s) * 0.6 + 0.05, 0, 0],
    rHip: [-0.45 * s - 0.05, 0, -0.03],
    rKnee: [Math.max(0, s) * 0.6 + 0.05, 0, 0],
  };
};
// Right hand up to the brow, to push the safety glasses up.
const BROW = { rShoulder: [-1.4, 0, -0.32], rElbow: [-2.4, 0.25, 0] };

const mixPose = (a, b, t) => {
  if (t <= 0) return a;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const x = a[k] ?? [0, 0, 0];
    out[k] = x.map((v, i) => v + (b[k][i] - v) * t);
  }
  return out;
};

const P0 = v3(3.3, 0, -15.0);
const P1 = v3(3.75, 0, -15.25);
const P_END = v3(DOOR_X + 0.5, 0, -27.0);
const WALK_START = 10;

/** Where he stands at loop time c. */
const workerAt = (c, out) => {
  if (c < 6) return out.copy(P0);
  if (c < WALK_START) return out.lerpVectors(P0, P1, easeInOutCubic(segment(c, 6, 7)));
  // Ease into the walk over the first 0.8 s, then a steady pace.
  const u = segment(c, WALK_START, LOOP);
  const a = 0.1;
  const g = u < a ? (u * u) / (2 * a) / (1 - a / 2) : (u - a / 2) / (1 - a / 2);
  out.set(lerp(P1.x, P_END.x, smoothstep(u)), 0, lerp(P1.z, P_END.z, g));
  return out;
};

/**
 * The outfit painter leaves the band over the shoulders as skin (it is above
 * its neck line) and can drop the sleeves. Repaint the upper body here: head
 * and neck stay skin, the hands are gloves, everything else above the belt is
 * the jacket, collar included, front and back.
 */
const repaintJacket = (model) => {
  let body = null;
  model.traverse((o) => o.isMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = o));
  const geo = body?.geometry;
  const col = geo?.attributes.color;
  if (!col) return;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const H = max.y - min.y;
  const cx = (min.x + max.x) / 2;
  const pos = geo.attributes.position;
  const jacket = new THREE.Color(WORKER.top);
  const collar = new THREE.Color(WORKER.collar);
  const skin = new THREE.Color(WORKER.skin);
  const gloves = new THREE.Color(WORKER.arms);
  for (let i = 0; i < pos.count; i++) {
    const ny = (pos.getY(i) - min.y) / H;
    if (ny < 0.57) continue;
    const ax = Math.abs(pos.getX(i) - cx) / H;
    let c = jacket;
    if (ax > 0.36 && ny > 0.7) c = gloves;
    else if ((ny > 0.862 && ax < 0.058) || (ny > 0.835 && ax < 0.034)) c = skin;
    else if (ny > 0.815 && ax < 0.07) c = collar;
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
};

export const createAssemblyLineScene = (stage) => {
  const { camera, pointer, staticMode, renderer } = stage;
  const w = createInkWorld(stage);
  const { scene } = w;
  const baseExposure = renderer.toneMappingExposure;
  const baseBloom = stage.bloomPass?.strength ?? 0;
  const BASE_FOV = camera.fov;
  const textures = [];
  const tex = (t) => (textures.push(t), t);

  // Materials: the ink film shading, lit by one sodium key from overhead.
  const steel = w.ink({ tint: "#c9cdd2", tone: 0.92, rim: 0.9, spec: 1 });
  const bodyDark = w.ink({ tint: "#6d7379", tone: 0.55, rim: 0.4 });
  const ironDark = w.ink({ tint: "#3a3d42", tone: 0.45, rim: 0.5 });
  const iron = w.ink({ tint: "#5b6068", tone: 0.6, rim: 0.6, spec: 0.5 });
  const wall = w.ink({ tint: "#3b3530", tone: 0.32, rim: 0.2 });
  const floorMat = w.ink({ tint: "#5a524a", tone: 0.42, rim: 0.1 });
  const safety = w.ink({ tint: "#e2a92a", tone: 0.85, rim: 0.6 });
  const armPaint = [w.ink({ tint: "#e8b12a", tone: 0.95, rim: 0.7, spec: 0.6 }), w.ink({ tint: "#e2661c", tone: 0.92, rim: 0.7, spec: 0.6 })];
  const armJoint = w.ink({ tint: "#4a4e55", tone: 0.6, rim: 0.5, spec: 0.8 });
  const cableMat = w.ink({ tint: "#1d1e21", tone: 0.4, rim: 0.4, spec: 0.4 });
  const crate = w.ink({ tint: "#6b5a44", tone: 0.5, rim: 0.3 });
  const lens = w.ink({ tint: "#2a3640", tone: 0.7, rim: 1.2, spec: 1 });
  const glass = w.ink({ tint: "#2e3d4a", tone: 0.75, rim: 1.1, spec: 1 });
  glass.side = THREE.DoubleSide;
  const rubber = w.ink({ tint: "#1c1c1f", tone: 0.42, rim: 0.35, spec: 0.3 });
  const rimMat = w.ink({ tint: "#a2a8ae", tone: 0.85, rim: 0.8, spec: 0.9 });
  const boothMat = w.ink({ tint: "#a29d90", tone: 0.68, rim: 0.3 });
  const flapMat = w.ink({ tint: "#2b2e31", tone: 0.5, rim: 0.35, spec: 0.4 });
  flapMat.side = THREE.DoubleSide;
  const paintMats = {
    sedan: w.ink({ tint: PAINT.sedan, tone: 0.95, rim: 0.9, spec: 1 }),
    pickup: w.ink({ tint: PAINT.pickup, tone: 0.95, rim: 0.9, spec: 1 }),
  };
  const tunnelMat = new THREE.MeshBasicMaterial({ color: "#0a0807", side: THREE.BackSide });
  const glowMat = (hex, k, extra = {}) => new THREE.MeshBasicMaterial({ color: hdr(hex, k), ...extra });
  const add = (mesh, line = true) => {
    scene.add(mesh);
    if (line) outline(mesh, w.line);
    return mesh;
  };
  const box = (wd, h, d, x, y, z, mat, line = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(wd, h, d), mat);
    m.position.set(x, y, z);
    return add(m, line);
  };

  /* ---- The hall ------------------------------------------------------- */
  const hallLen = Z_BACK - DOOR_Z;
  const hallMid = (Z_BACK + DOOR_Z) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, hallLen), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, hallMid);
  scene.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, hallLen), wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HALL_H, hallMid);
  scene.add(ceiling);
  /** A piece of side wall from z0 to z1, y0 to y1, facing into the hall. */
  const sideWall = (s, z0, z1, y0 = 0, y1 = HALL_H) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), wall);
    p.rotation.y = -s * (Math.PI / 2);
    p.position.set((s * HALL_W) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    scene.add(p);
  };
  sideWall(1, DOOR_Z, Z_BACK);
  // The left wall has the doorway the bodies come in through.
  const PORT_H = 3.6;
  const PORT_HALF = 1.8;
  sideWall(-1, DOOR_Z, Z_ENTRY - PORT_HALF);
  sideWall(-1, Z_ENTRY + PORT_HALF, Z_BACK);
  sideWall(-1, Z_ENTRY - PORT_HALF, Z_ENTRY + PORT_HALF, PORT_H, HALL_H);
  // The back wall, with the doorway they leave through.
  const backSide = (HALL_W / 2 - PORT_HALF - 0.1) / 2;
  for (const s of [-1, 1]) box(backSide * 2, HALL_H, 0.3, s * (HALL_W / 2 - backSide), HALL_H / 2, Z_BACK, wall, false);
  box(2 * PORT_HALF + 0.2, HALL_H - PORT_H, 0.3, 0, PORT_H + (HALL_H - PORT_H) / 2, Z_BACK, wall, false);
  // Dark tunnels beyond both doorways: the line goes on, out of sight.
  const tunnel = (cx, cz, sx, sz) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(sx, PORT_H, sz), tunnelMat);
    t.position.set(cx, PORT_H / 2, cz);
    scene.add(t);
  };
  tunnel(-HALL_W / 2 - 7.5 + 0.05, Z_ENTRY, 15, 2 * PORT_HALF);
  tunnel(0, Z_BACK + 7, 2 * PORT_HALF + 0.2, 14);
  // Hazard frames round the doorways, an amber beacon over each.
  const beaconMat = glowMat("#ffa21a", 1.6);
  for (const s of [-1, 1]) box(0.25, PORT_H, 0.22, -HALL_W / 2 + 0.12, PORT_H / 2, Z_ENTRY + s * (PORT_HALF + 0.1), safety);
  box(0.25, 0.22, 2 * PORT_HALF + 0.4, -HALL_W / 2 + 0.12, PORT_H + 0.11, Z_ENTRY, safety);
  box(0.12, 0.14, 0.12, -HALL_W / 2 + 0.2, PORT_H + 0.32, Z_ENTRY, beaconMat, false);
  for (const s of [-1, 1]) box(0.22, PORT_H, 0.25, s * (PORT_HALF + 0.1), PORT_H / 2, Z_BACK - 0.12, safety);
  box(2 * PORT_HALF + 0.4, 0.22, 0.25, 0, PORT_H + 0.11, Z_BACK - 0.12, safety);

  // The end wall, with the bay door open in it.
  const doorL = DOOR_X - DOOR_W / 2;
  const doorR = DOOR_X + DOOR_W / 2;
  box(doorL + HALL_W / 2, HALL_H, 0.4, (-HALL_W / 2 + doorL) / 2, HALL_H / 2, DOOR_Z, wall);
  box(HALL_W / 2 - doorR, HALL_H, 0.4, (HALL_W / 2 + doorR) / 2, HALL_H / 2, DOOR_Z, wall);
  box(DOOR_W, HALL_H - DOOR_H, 0.4, DOOR_X, DOOR_H + (HALL_H - DOOR_H) / 2, DOOR_Z, wall);
  // Rolled-up door drum and hazard-yellow jambs.
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, DOOR_W + 0.4, 24), iron);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(DOOR_X, DOOR_H + 0.45, DOOR_Z + 0.5);
  add(drum);
  for (const s of [-1, 1]) box(0.22, DOOR_H, 0.3, DOOR_X + s * (DOOR_W / 2 - 0.11), DOOR_H / 2, DOOR_Z + 0.25, safety);

  // Columns, trusses, cable trays. No column where the line comes in.
  for (let z = 12; z > DOOR_Z; z -= 6) {
    for (const s of [-1, 1]) {
      if (s < 0 && Math.abs(z - Z_ENTRY) < 2.5) continue;
      box(0.36, HALL_H, 0.36, s * 7.6, HALL_H / 2, z, ironDark);
      box(0.4, 1.3, 0.4, s * 7.6, 0.65, z, safety);
    }
    box(HALL_W, 0.45, 0.22, 0, HALL_H - 0.8, z, ironDark);
  }
  for (const x of [-4.8, 4.8]) box(0.5, 0.12, hallLen - 1, x, 6.6, hallMid, ironDark);

  // Parts racks along the far wall.
  for (let z = 10; z > -20; z -= 4.2) {
    for (const dz of [-1.6, 1.6]) box(0.1, 4.2, 0.1, -6.5, 2.1, z + dz, safety, false);
    for (const y of [0.4, 1.8, 3.2]) {
      box(1.2, 0.08, 3.3, -6.5, y, z, ironDark, false);
      for (let k = 0; k < 3; k++) {
        if (hash(z * 3.1 + y * 7 + k) < 0.3) continue;
        const h = 0.5 + hash(z + y + k * 1.7) * 0.6;
        box(1.0, h, 0.9, -6.5, y + 0.04 + h / 2, z - 1.05 + k * 1.05, crate);
      }
    }
  }

  // Floor: walkway lines.
  const lineMat = glowMat("#c99a2a", 0.55);
  for (const x of [5.3, -2.85]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.1, hallLen - 2), lineMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.02, hallMid + 1);
    scene.add(strip);
  }

  // Walkway guardrail past the booth; the stations are open floor.
  const RAIL_Z = [8, -1.2];
  const railLen = RAIL_Z[0] - RAIL_Z[1];
  box(0.06, 0.06, railLen, 2.95, 1.05, (RAIL_Z[0] + RAIL_Z[1]) / 2, safety, false);
  box(0.06, 0.06, railLen, 2.95, 0.55, (RAIL_Z[0] + RAIL_Z[1]) / 2, safety, false);
  for (let z = RAIL_Z[0]; z >= RAIL_Z[1] - 0.01; z -= railLen / 4) box(0.07, 1.08, 0.07, 2.95, 0.54, z, safety, false);

  /* ---- The conveyor: rails and rollers along the whole path ---------- */
  const at = { x: 0, z: 0, yaw: 0 };
  const dummy = new THREE.Object3D();
  const railGeo = new THREE.BoxGeometry(0.52, 0.34, 0.2);
  const railStep = 0.5;
  const railCount = Math.floor((SPAN - 1) / railStep) * 2;
  const rails = new THREE.InstancedMesh(railGeo, ironDark, railCount);
  let ri = 0;
  for (let s = 0.5; ri < railCount; s += railStep) {
    pathAt(s, at);
    for (const side of [-1, 1]) {
      dummy.position.set(at.x, BELT - 0.27, at.z);
      dummy.rotation.set(0, at.yaw, 0);
      dummy.translateZ(side * 0.62);
      dummy.updateMatrix();
      rails.setMatrixAt(ri++, dummy.matrix);
    }
  }
  add(rails);
  const rollerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.14, 10);
  rollerGeo.rotateX(Math.PI / 2);
  const rollerCount = Math.floor((SPAN - 1) / 0.6);
  const rollers = new THREE.InstancedMesh(rollerGeo, iron, rollerCount);
  for (let i = 0; i < rollerCount; i++) {
    pathAt(0.5 + i * 0.6, at);
    dummy.position.set(at.x, BELT - 0.1, at.z);
    dummy.rotation.set(0, at.yaw, 0);
    dummy.updateMatrix();
    rollers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(rollers);

  /* ---- Bodies on the line -------------------------------------------- */
  const bodyMats = { steel, dark: bodyDark, line: w.line, glass, rubber, rim: rimMat };
  const templates = { sedan: buildBody("sedan", bodyMats), pickup: buildBody("pickup", bodyMats) };
  const cars = Array.from({ length: N_CARS }, (_, i) => {
    const type = i % 2 ? "pickup" : "sedan";
    const g = templates[type].clone();
    scene.add(g);
    const parts = {};
    g.traverse((o) => o.name.startsWith("part:") && (parts[o.name.slice(5)] = o));
    const skin = [];
    g.traverse((o) => o.isMesh && o.material === steel && skin.push(o));
    return { g, type, i, parts, skin, painted: false, s: 0, z: 0, halfW: templates[type].userData.halfW };
  });
  const sOf = (i, c) => mod(i * PITCH + SPEED * c, SPAN);
  const S_PAINT = sAtZ(BOOTH_MID);

  /* ---- Robot arms ----------------------------------------------------- */
  const amber = new THREE.Color("#ffa21a");
  const cableGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const lampGeo = new THREE.SphereGeometry(0.045, 10, 8);
  let armCount = 0;
  const makeArm = (x, z, tool) => {
    const i = armCount++;
    const arm = createRobotArm({ materials: { body: armPaint[i % 2], joint: armJoint, dark: ironDark }, color: "#000000", tool, toolLength: tool === "scanner" ? 0.42 : 0.35 });
    // No glowing rings on a plant arm: the kit's rings and lens become grey
    // trim, each link gets a dressed cable bundle, the turret an amber lamp.
    const parts = [];
    arm.root.traverse((o) => o.isMesh && parts.push(o));
    let turret = null;
    for (const o of parts) {
      if (o.material === arm.glow) o.material = armJoint;
      const h = o.geometry.parameters?.height;
      if (o.geometry.parameters?.radiusTop === 0.3) turret = o;
      if (h > 1 && o.geometry.parameters?.width < 0.3) {
        const bundle = new THREE.Mesh(cableGeo, cableMat);
        bundle.scale.set(1, h * 0.92, 1);
        bundle.position.set(o.position.x + 0.15, o.position.y, o.position.z - 0.06);
        o.parent.add(bundle);
      }
    }
    const status = new THREE.MeshBasicMaterial({ color: amber.clone().multiplyScalar(2.2) });
    if (turret) {
      const lamp = new THREE.Mesh(lampGeo, status);
      lamp.position.set(0, 0.26, -0.2);
      turret.add(lamp);
    }
    const base = v3(x, 0, z);
    box(0.95, 0.5, 0.95, x, 0.25, z, ironDark);
    arm.root.position.set(x, 0.5, z);
    arm.root.scale.setScalar(1.1);
    parts.forEach((o) => outline(o, w.line));
    scene.add(arm.root);
    arm.grip(1);
    return { arm, base, status, tip: new THREE.Vector3(), side: Math.sign(x) };
  };
  const andon = (x, z) => {
    box(0.05, 2.2, 0.05, x, 1.1, z, ironDark, false);
    box(0.12, 0.1, 0.12, x, 2.25, z, glowMat("#3dff7a", 2.4), false);
    box(0.12, 0.1, 0.12, x, 2.36, z, glowMat("#5a3a10", 1), false);
  };

  const aim = new THREE.Vector3();
  /** Land the tool tip on `target`: the IK lands the wrist, so correct by the miss. */
  const solve = (a, target, approach) => {
    aim.copy(target);
    for (let k = 0; k < 3; k++) {
      a.arm.reachFor(aim, approach);
      a.arm.root.updateMatrixWorld(true);
      a.arm.tipWorld(a.tip);
      if (k < 2) aim.add(target).sub(a.tip);
    }
  };

  /* Weld station: his arm on the walkway side, two across the line. */
  const welders = [
    { x: 2.2, z: HIS + 0.5, his: true, offset: 0 },
    { x: -2.2, z: HIS - 0.9, offset: 2 },
    { x: -2.2, z: HIS + 1.3, offset: 5 },
  ].map((cfg) => {
    const a = makeArm(cfg.x, cfg.z, "scanner");
    return {
      ...a,
      ...cfg,
      home: v3(cfg.x - a.side * 0.75, 2.9, cfg.z),
      parked: v3(cfg.x - a.side * 0.55, 1.75, cfg.z),
      welding: false,
      debt: 0,
    };
  });
  andon(-2.95, HIS + 2.4);

  /* Gripper stations: each arm hangs one part per body at `zPress`. Parts
   * wait on a fixture on the far side of the arm from the line; the next one
   * is lowered onto the fixture from a parts hopper overhead. */
  const STAND_Y = 0.72;
  const HOPPER_Y = 2.85;
  const qCar = new THREE.Quaternion().setFromAxisAngle(UP, -Math.PI / 2);
  const bbox = new THREE.Box3();
  // pz: which side of the arm (along the line) its fixture stands.
  const GRIP_CFG = [
    { x: 2.4, z: Z_GLASS + 0.6, pz: -1, tasks: [{ key: "doorP", zPress: Z_GLASS + 0.5 }] },
    { x: -2.4, z: Z_GLASS + 0.6, pz: 1, tasks: [{ key: "doorN", zPress: Z_GLASS + 0.5 }] },
    { x: -2.4, z: Z_GLASS - 2.0, pz: 1, tasks: [{ key: "shield", zPress: Z_GLASS - 1.8 }] },
    // Wheels: one arm per axle each side, so neither has to hurry.
    { x: 2.4, z: Z_WHEELS - 1.3, pz: -1, tasks: [{ key: "wheelFP", zPress: Z_WHEELS - 1.1 }] },
    { x: -2.4, z: Z_WHEELS - 1.3, pz: 1, tasks: [{ key: "wheelFN", zPress: Z_WHEELS - 1.1 }] },
    { x: 2.4, z: Z_WHEELS + 1.3, pz: -1, tasks: [{ key: "wheelRP", zPress: Z_WHEELS + 1.5 }] },
    { x: -2.4, z: Z_WHEELS + 1.3, pz: 1, tasks: [{ key: "wheelRN", zPress: Z_WHEELS + 1.5 }] },
  ];
  const T_PICK = -2.6;
  const T_LIFT = -2.1;
  const T_APPROACH = -0.55;
  const T_HUNG = 0.6;
  const T_BACK = 0.9;
  const T_HOME = 2.2;
  const T_REFILL = [0.7, 1.9];
  const grippers = GRIP_CFG.map((cfg) => {
    const a = makeArm(cfg.x, cfg.z, "gripper");
    const pick = v3(cfg.x + a.side * 0.6, 0, cfg.z + cfg.pz * 1.4);
    const toBase = yawOfVec(cfg.x - pick.x, cfg.z - pick.z);
    const baseDir = v3(cfg.x - pick.x, 0, cfg.z - pick.z).normalize();
    const key0 = cfg.tasks[0].key;
    // One held copy of the part per body type, oriented to face the arm.
    const held = {};
    const pickQ = {};
    const pickGrip = {};
    const drop = {};
    const union = new THREE.Box3();
    for (const type of ["sedan", "pickup"]) {
      held[type] = {};
      for (const { key } of cfg.tasks) {
        if (held[type][key]) continue;
        const src = templates[type].parts[key];
        const p = src.clone();
        p.visible = false;
        scene.add(p);
        held[type][key] = p;
      }
      const src = templates[type].parts[key0];
      const n = src.userData.normal.clone().applyQuaternion(qCar);
      const alpha = toBase - yawOfVec(n.x, n.z);
      pickQ[type] = new THREE.Quaternion().setFromAxisAngle(UP, alpha).multiply(qCar);
      const p = held[type][key0];
      p.position.set(0, 0, 0);
      p.quaternion.copy(pickQ[type]);
      p.visible = true;
      p.updateMatrixWorld(true);
      bbox.setFromObject(p);
      p.visible = false;
      pickGrip[type] = pick.clone().setY(STAND_Y - bbox.min.y);
      bbox.translate(pickGrip[type]);
      drop[type] = HOPPER_Y + 0.05 - bbox.min.y;
      union.union(bbox);
    }
    // The fixture under the part, and the hopper over it on one post.
    const c = union.getCenter(new THREE.Vector3());
    const sz = union.getSize(new THREE.Vector3());
    box(Math.max(0.2, sz.x * 0.7), STAND_Y, Math.max(0.2, sz.z * 0.5), c.x, STAND_Y / 2, c.z, ironDark);
    const hopH = Math.max(1.4, sz.y + 0.25);
    box(sz.x + 0.24, hopH, sz.z + 0.24, c.x, HOPPER_Y + hopH / 2, c.z, iron);
    box(sz.x + 0.3, 0.08, sz.z + 0.3, c.x, HOPPER_Y + 0.04, c.z, safety, false);
    const postX = c.x + a.side * (sz.x / 2 + 0.2);
    box(0.12, HOPPER_Y + hopH, 0.12, postX, (HOPPER_Y + hopH) / 2, c.z, ironDark, false);

    // When does this arm hang each part? One event per body per task.
    const base = [];
    for (let i = 0; i < N_CARS; i++) {
      const type = i % 2 ? "pickup" : "sedan";
      for (const task of cfg.tasks) {
        const lx = templates[type].parts[task.key].userData.grip.x;
        const t = mod(sAtZ(task.zPress) - lx - i * PITCH, SPAN) / SPEED;
        if (t < LOOP) base.push({ t, i, type, key: task.key });
      }
    }
    // A loop earlier or later, the same moment belongs to the body two places along.
    const events = [
      ...base.map((e) => ({ ...e, t: e.t - LOOP, i: mod(e.i + 2, N_CARS) })),
      ...base,
      ...base.map((e) => ({ ...e, t: e.t + LOOP, i: mod(e.i - 2, N_CARS) })),
    ].sort((p, q) => p.t - q.t);
    // The short way round from fixture to body, every time.
    const pref = Math.sign(wrapPi(yawOfVec(-a.side, 0) - yawOfVec(-baseDir.x, -baseDir.z))) * (Math.PI / 2);
    return { ...a, ...cfg, pick, baseDir, toBase, held, pickQ, pickGrip, drop, events, pref, shown: null };
  });
  andon(2.95, Z_GLASS + 2.4);
  andon(-2.95, Z_WHEELS);

  /** Whether a body already carries a part (it passed the arm that hangs it). */
  const hungAt = {};
  for (const gr of grippers) for (const t of gr.tasks) hungAt[t.key] = sAtZ(t.zPress) + T_HUNG * SPEED;

  const placeCars = (c) => {
    for (const car of cars) {
      const s = sOf(car.i, c);
      pathAt(s, at);
      car.s = s;
      car.z = at.z;
      car.g.position.set(at.x, BELT + 0.05, at.z);
      car.g.rotation.y = at.yaw;
      // Out of sight beyond the walls: skip drawing it.
      car.g.visible = at.x > -HALL_W / 2 - 3.2 && at.z < Z_BACK + 3.2;
      for (const [key, p] of Object.entries(car.parts)) p.visible = s + p.userData.grip.x >= hungAt[key];
      const painted = s >= S_PAINT;
      if (painted !== car.painted) {
        car.painted = painted;
        const m = painted ? paintMats[car.type] : steel;
        car.skin.forEach((o) => (o.material = m));
      }
      car.g.updateMatrixWorld(true);
    }
  };

  const mountPos = new THREE.Vector3();
  const mountQ = new THREE.Quaternion();
  const mountN = new THREE.Vector3();
  const approachPos = new THREE.Vector3();
  const hover = new THREE.Vector3();
  const target = new THREE.Vector3();
  const tA = new THREE.Vector3();
  const tB = new THREE.Vector3();

  /** Swing from A to B around the arm's base (never through it), with a lift.
   * Returns how far the turret has turned since A. */
  const swing = (a, A, B, k, lift, out, pref) => {
    const yA = yawOfVec(A.x - a.base.x, A.z - a.base.z);
    const yB = yawOfVec(B.x - a.base.x, B.z - a.base.z);
    // Pick and body are about half a turn apart: always go round the same way
    // (`pref`), so the swing cannot flip sides as the body moves.
    const d = wrapPi(yB - yA - pref) + pref;
    const rA = Math.hypot(A.x - a.base.x, A.z - a.base.z);
    const rB = Math.hypot(B.x - a.base.x, B.z - a.base.z);
    const y = yA + d * k;
    const r = lerp(rA, rB, k);
    out.set(a.base.x + Math.sin(y) * r, lerp(A.y, B.y, k) + Math.sin(k * Math.PI) * lift, a.base.z + Math.cos(y) * r);
    return y - yA;
  };

  const poseGripper = (a, c) => {
    let next = null;
    let prev = null;
    for (const e of a.events) {
      if (e.t > c) {
        next = e;
        break;
      }
      prev = e;
    }
    let ev = null;
    let tau = 0;
    if (next && c - next.t >= T_PICK) [ev, tau] = [next, c - next.t];
    else if (prev && c - prev.t <= T_HOME) [ev, tau] = [prev, c - prev.t];
    const waiting = next ?? prev;
    // The part this arm is holding or waiting on, and where it is.
    const partType = ev && tau < T_HUNG ? ev.type : waiting.type;
    const partKey = ev && tau < T_HUNG ? ev.key : waiting.key;
    const part = a.held[partType][partKey];
    if (a.shown && a.shown !== part) a.shown.visible = false;
    a.shown = part;
    const grip = a.pickGrip[partType];
    hover.copy(grip).addScaledVector(a.baseDir, 0.35);
    hover.y += 0.3;
    let open = 1;
    let partAt = "pick";
    let partYaw = 0;
    if (!ev) {
      target.copy(hover);
    } else {
      const car = cars[ev.i];
      const cp = car.parts[ev.key];
      cp.getWorldPosition(mountPos);
      cp.getWorldQuaternion(mountQ);
      mountN.copy(cp.userData.normal).applyQuaternion(car.g.quaternion);
      approachPos.copy(mountPos).addScaledVector(mountN, 0.4);
      const g0 = a.pickGrip[ev.type];
      if (tau < T_LIFT) {
        target.lerpVectors(hover, g0, easeInOutCubic(segment(tau, T_PICK, T_PICK + 0.4)));
        open = 1 - segment(tau, T_LIFT - 0.15, T_LIFT - 0.02);
      } else if (tau < T_APPROACH) {
        partYaw = swing(a, g0, approachPos, smoothstep(segment(tau, T_LIFT, T_APPROACH)), 0.45, target, a.pref);
        open = 0;
        partAt = "tip";
      } else if (tau < 0) {
        partYaw = swing(a, g0, approachPos, 1, 0, tA, a.pref);
        target.lerpVectors(tA, mountPos, easeInOutCubic(segment(tau, T_APPROACH, 0)));
        open = 0;
        partAt = "settle";
      } else if (tau < T_HUNG) {
        // Pressed home: a short push as it seats, tracking the moving body.
        target.copy(mountPos).addScaledVector(mountN, -0.015 * Math.sin(segment(tau, 0, T_HUNG) * Math.PI));
        open = 0;
        partAt = "mount";
      } else if (tau < T_BACK) {
        target.lerpVectors(mountPos, approachPos, easeInOutCubic(segment(tau, T_HUNG, T_BACK)));
        open = segment(tau, T_HUNG, T_HUNG + 0.15);
        partAt = tau < T_REFILL[0] ? "none" : "refill";
      } else {
        swing(a, approachPos, hover, smoothstep(segment(tau, T_BACK, T_HOME)), 0.35, target, -a.pref);
        partAt = tau < T_REFILL[1] ? "refill" : "pick";
      }
      if (tau >= T_HUNG && partAt !== "none") partAt = tau < T_REFILL[1] ? "refill" : "pick";
    }
    solve(a, target, 0.5);
    a.arm.grip(open);

    part.visible = partAt !== "none";
    if (partAt === "pick" || partAt === "refill") {
      part.position.copy(grip);
      part.quaternion.copy(a.pickQ[partType]);
      if (partAt === "refill") part.position.y += a.drop[partType] * (1 - easeOutCubic(segment(c - prev.t, T_REFILL[0], T_REFILL[1])));
    } else {
      // Carried with the turret, then settled square onto the body.
      const settle = partAt === "mount" ? 1 : partAt === "settle" ? easeInOutCubic(segment(tau, T_APPROACH, 0)) : 0;
      part.position.lerpVectors(a.tip, mountPos, partAt === "mount" ? 1 : smoothstep(segment(tau, -0.35, 0)));
      part.quaternion.setFromAxisAngle(UP, partYaw).multiply(a.pickQ[ev.type]);
      if (settle > 0) part.quaternion.slerp(mountQ, settle);
    }
  };

  /* ---- Welding along the moving body --------------------------------- */
  const SPOT_T = 1.2;
  const WIN = 3.3;
  const spotLocal = new THREE.Vector3();
  const spotWorld = (car, spot, side, out) => {
    const [lx, ly, kind] = spot;
    spotLocal.set(lx, ly + (kind === "roof" ? 0.05 : 0), -side * (kind === "roof" ? 0.66 : car.halfW + 0.04));
    return car.g.localToWorld(out.copy(spotLocal));
  };
  /** The spot an arm works on step n of a body's pass (chosen where the body was then). */
  const spotFor = (a, car, n, tau) => {
    const carZThen = car.z - (tau - n * SPOT_T) * SPEED;
    const list = SPOTS[car.type].filter((sp) => Math.abs(carZThen + sp[0] - a.z) < 1.7);
    return list.length ? list[(n + a.offset) % list.length] : null;
  };

  const poseWelder = (a, c) => {
    a.welding = false;
    let level = 1;
    target.copy(a.home);
    const car = cars.find((k) => k.s >= S_STRAIGHT && Math.abs(k.z - a.z) < WIN);
    if (car) {
      const tau = (car.z - (a.z - WIN)) / SPEED;
      const span = (2 * WIN) / SPEED;
      const n = Math.floor(tau / SPOT_T);
      const f = tau / SPOT_T - n;
      const cur = spotFor(a, car, n, tau);
      if (cur) {
        spotWorld(car, cur, a.side, tA);
        const prevSpot = n > 0 ? spotFor(a, car, n - 1, tau) : null;
        if (prevSpot) spotWorld(car, prevSpot, a.side, tB);
        else tB.copy(a.home);
        if (f < 0.3) {
          const k = easeInOutCubic(f / 0.3);
          target.lerpVectors(tB, tA, k);
          target.y += Math.sin(k * Math.PI) * 0.3;
          target.x += a.side * Math.sin(k * Math.PI) * 0.25;
        } else {
          // Run the seam a hand's width along the body.
          target.copy(tA);
          target.z += (segment(f, 0.3, 0.95) - 0.5) * 0.16;
          a.welding = f > 0.34 && f < 0.94;
        }
        // Ease out of and back to home at the edges of the pass.
        const edge = Math.min(segment(tau, 0, 0.35), 1 - segment(tau, span - 0.45, span - 0.05));
        target.lerpVectors(a.home, target, easeInOutCubic(edge));
        if (edge < 0.98) a.welding = false;
      }
    }
    if (a.his) {
      // Parked and dark until 4.2; powers up and unfolds; parks again at the
      // very end of the loop, so 18 matches 0.
      const wake = easeInOutCubic(segment(c, 4.4, 5.5));
      const sleep = easeInOutCubic(segment(c, 17.45, 17.9));
      const up = wake * (1 - sleep);
      target.lerpVectors(a.parked, target, up);
      if (up < 0.98) a.welding = false;
      // A power-on flicker, then steady.
      const flick = c > 4.2 && c < 4.9 ? (hash(Math.floor(c * 24)) > 0.45 ? 1 : 0.15) : 1;
      level = segment(c, 4.2, 4.9) * flick * (1 - sleep);
      if (c >= 4.9 && c < 17.45) level = 1;
    }
    solve(a, target, 0.7);
    a.status.color.copy(amber).multiplyScalar(0.15 + 2.1 * level);
  };

  /* ---- The paint booth ------------------------------------------------ */
  const BW = 4.2;
  const BH = 3.5;
  const OPEN_W = 2.7;
  const OPEN_H = 2.95;
  const bLen = BOOTH_Z1 - BOOTH_Z0;
  const bMid = (BOOTH_Z0 + BOOTH_Z1) / 2;
  for (const s of [-1, 1]) box(0.12, BH, bLen, (s * BW) / 2, BH / 2, bMid, boothMat);
  box(BW + 0.12, 0.14, bLen + 0.12, 0, BH + 0.07, bMid, boothMat);
  const flaps = [];
  for (const fz of [BOOTH_Z0, BOOTH_Z1]) {
    const jw = (BW - OPEN_W) / 2;
    for (const s of [-1, 1]) box(jw, BH, 0.12, s * (OPEN_W / 2 + jw / 2), BH / 2, fz, boothMat);
    box(OPEN_W, BH - OPEN_H, 0.12, 0, OPEN_H + (BH - OPEN_H) / 2, fz, boothMat);
    // Rubber strip curtains across the opening, pushed aside by each body.
    const n = 9;
    const fw = OPEN_W / n;
    const flapGeo = new THREE.PlaneGeometry(fw - 0.02, OPEN_H - 0.08);
    flapGeo.translate(0, -(OPEN_H - 0.08) / 2, 0);
    for (let k = 0; k < n; k++) {
      const pivot = new THREE.Group();
      pivot.position.set(-OPEN_W / 2 + fw * (k + 0.5), OPEN_H, fz + (fz > bMid ? 0.08 : -0.08));
      const m = new THREE.Mesh(flapGeo, flapMat);
      pivot.add(m);
      outline(m, w.line);
      scene.add(pivot);
      flaps.push({ pivot, fz, x: pivot.position.x, k });
    }
  }
  // Exhaust stacks, a lit inspection window strip, the sign.
  for (const z of [bMid - 1.6, bMid + 1.6]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16), iron);
    stack.position.set(-0.8, BH + 1.1, z);
    add(stack);
  }
  const boothLight = glowMat("#fff0d6", 0.8);
  for (const z of [bMid - 2.0, bMid, bMid + 2.0]) {
    box(0.04, 0.42, 1.3, BW / 2 + 0.07, 2.35, z, boothLight, false);
    box(0.06, 0.52, 1.4, BW / 2 + 0.05, 2.35, z, ironDark, false);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tex(boothSign()), color: new THREE.Color(0.75, 0.62, 0.45) }));
  sign.rotation.y = Math.PI / 2;
  sign.position.set(BW / 2 + 0.07, 1.45, bMid);
  scene.add(sign);
  const poseFlaps = () => {
    for (const f of flaps) {
      let ang = 0;
      for (const car of cars) {
        if (car.s < S_STRAIGHT) continue;
        const half = car.type === "pickup" ? 2.85 : 2.4;
        const inFace = segment(f.fz, car.z - half - 0.4, car.z - half + 0.2) * (1 - segment(f.fz, car.z + half - 0.2, car.z + half + 0.4));
        if (inFace <= 0) continue;
        const reach = 1 - segment(Math.abs(f.x), car.halfW - 0.1, car.halfW + 0.3);
        ang = Math.max(ang, inFace * (0.25 + 0.75 * reach));
      }
      f.pivot.rotation.x = -ang * 0.85 + Math.sin(f.k * 1.7 + f.fz) * 0.01;
    }
  };

  /* ---- Sparks, haze, motes ------------------------------------------- */
  const sparks = createParticles({ count: 3600, blending: "add" });
  const haze = createParticles({ count: 150, blending: "normal" });
  const motes = createParticles({ count: 160, blending: "add" });
  [sparks, haze, motes].forEach((p) => scene.add(p.points));
  let seed = 0;
  const emitWeld = (a, dt) => {
    a.debt += dt * 90;
    while (a.debt >= 1) {
      a.debt -= 1;
      seed += 1;
      const th = hash(seed) * Math.PI * 2;
      const up = hash(seed * 1.7) * 0.9 + 0.1;
      const sp = 2.5 + hash(seed * 2.3) * 4;
      const hot = hash(seed * 4.1) > 0.6;
      const vel = [Math.cos(th) * sp * 0.75 + a.side * 0.8, up * sp, Math.sin(th) * sp * 0.75];
      const life = 0.3 + hash(seed * 3.3) * 0.45;
      // A streak: four beads flying together, strung back along the throw,
      // the head white-hot and the tail cooling to orange.
      for (let k = 0; k < 4; k++) {
        const back = k * 0.011;
        sparks.emit({
          position: [a.tip.x - vel[0] * back, a.tip.y - vel[1] * back, a.tip.z - vel[2] * back],
          velocity: vel,
          life,
          size: 0.026 - k * 0.004,
          gravity: 9.8,
          drag: 0.5,
          color: k === 0 && hot ? "#fff6e4" : k < 2 ? "#ffc266" : "#ff8a2a",
          intensity: 8 - k * 1.6,
        });
      }
    }
    // The arc: a tight flash at the tip and a warm glow round it, flickering.
    const flick = 0.7 + hash(seed * 0.37) * 0.6;
    sparks.emit({ position: [a.tip.x, a.tip.y, a.tip.z], life: 0.05, size: 0.1 * flick, color: "#ffffff", intensity: 9, alpha: 1 });
    sparks.emit({ position: [a.tip.x, a.tip.y, a.tip.z], life: 0.07, size: 0.45 * flick, color: "#ffb35c", intensity: 1.8, alpha: 0.4 });
  };
  const puffHaze = () => {
    seed += 1;
    const doorSide = hash(seed * 9.1) < 0.3;
    const z = doorSide ? -26 + hash(seed * 3.1) * 10 : 14 - hash(seed * 3.1) * 38;
    haze.emit({
      position: [(hash(seed) - 0.5) * 15, 0.8 + hash(seed * 7.7) * 5, z],
      velocity: [0.12, 0.03, 0.05],
      life: 14,
      size: 4 + hash(seed * 1.3) * 5,
      color: doorSide ? "#7d8ca3" : "#5a3f2c",
      alpha: doorSide ? 0.03 : 0.05,
    });
  };
  const emitMote = () => {
    seed += 1;
    motes.emit({
      position: [DOOR_X + (hash(seed) - 0.5) * 8, 0.3 + hash(seed * 2.9) * 5.5, -25.5 + hash(seed * 5.3) * 9],
      velocity: [(hash(seed * 1.9) - 0.5) * 0.1, 0.04, 0.12],
      life: 8,
      size: 0.025 + hash(seed * 6.1) * 0.03,
      color: "#dfe9ff",
      intensity: 1.6,
      alpha: 0.8,
    });
  };
  for (let i = 0; i < 150; i++) {
    puffHaze();
    haze.step(14 / 150);
  }
  for (let i = 0; i < 160; i++) {
    emitMote();
    motes.step(8 / 160);
  }
  let hazeDebt = 0;
  let moteDebt = 0;
  const effects = (c, dt) => {
    placeCars(c);
    for (const a of welders) poseWelder(a, c);
    for (const a of grippers) poseGripper(a, c);
    poseFlaps();
    for (const a of welders) if (a.welding) emitWeld(a, dt);
    sparks.step(dt);
    hazeDebt += dt * (150 / 14);
    while (hazeDebt >= 1) (hazeDebt -= 1), puffHaze();
    haze.step(dt);
    moteDebt += dt * 20;
    while (moteDebt >= 1) (moteDebt -= 1), emitMote();
    motes.step(dt);
  };

  /* ---- Sodium high-bays ---------------------------------------------- */
  const lampGlow = glowMat("#ffa040", 5);
  const fixtureGeo = new THREE.CylinderGeometry(0.32, 0.45, 0.35, 16, 1, true);
  const lensGeo = new THREE.CircleGeometry(0.4, 16);
  lensGeo.rotateX(Math.PI / 2);
  const poolMat = new THREE.MeshBasicMaterial({ map: tex(softDot()), color: hdr("#ff9a3c", 0.55), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const poolGeo = new THREE.PlaneGeometry(6, 6);
  poolGeo.rotateX(-Math.PI / 2);
  for (let z = 15; z > DOOR_Z + 2; z -= 6) {
    for (const x of [-3.6, 3.6]) {
      const f = new THREE.Mesh(fixtureGeo, ironDark);
      f.position.set(x, 7.9, z);
      add(f, false);
      const l = new THREE.Mesh(lensGeo, lampGlow);
      l.position.set(x, 7.73, z);
      scene.add(l);
      box(0.03, HALL_H - 0.8 - 8.05, 0.03, x, (HALL_H - 0.8 + 8.05) / 2, z, ironDark, false);
      const beam = lightBeam({ from: [x, 7.7, z], to: [x * 0.8, 0, z], radiusFrom: 0.3, radiusTo: 2.8, color: "#ff9a3c" });
      beam.material.uniforms.uIntensity.value = 0.035;
      scene.add(beam);
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(x * 0.8, 0.03, z);
      scene.add(pool);
    }
  }

  /* ---- The morning outside ------------------------------------------- */
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(140, 50), new THREE.MeshBasicMaterial({ map: tex(morningSky()), color: new THREE.Color(0.9, 0.9, 0.92) }));
  sky.position.set(DOOR_X, 10, -70);
  scene.add(sky);
  const outGround = new THREE.Mesh(new THREE.PlaneGeometry(140, 44), new THREE.MeshBasicMaterial({ map: tex(groundOut()), color: new THREE.Color(0.6, 0.62, 0.66) }));
  outGround.rotation.x = -Math.PI / 2;
  outGround.position.set(DOOR_X, 0, DOOR_Z - 22.2);
  scene.add(outGround);
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W + 1.5, 13),
    new THREE.MeshBasicMaterial({ map: tex(doorSpill()), color: hdr("#bcd2ff", 0.35), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(DOOR_X, 0.035, DOOR_Z + 6.5);
  scene.add(spill);
  [-2.6, 0, 2.6].forEach((x) => {
    const b = lightBeam({ from: [DOOR_X + x, DOOR_H - 0.6, DOOR_Z - 1], to: [DOOR_X + x * 0.7, 0, DOOR_Z + 12], radiusFrom: 1.5, radiusTo: 3.2, color: "#cfe0ff" });
    b.material.uniforms.uIntensity.value = 0.05;
    scene.add(b);
  });

  // His old hand gun on its balancer, still swinging a little at the station.
  const gun = new THREE.Group();
  gun.position.set(2.9, 5.2, -14.0);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.0, 6), ironDark);
  cable.position.y = -1.5;
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 20, Math.PI * 1.3), iron);
  yoke.position.y = -3.25;
  yoke.rotation.set(0, Math.PI / 2, 0.6);
  const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.36), ironDark);
  gunGrip.position.set(0, -3.05, 0.1);
  gun.add(cable, yoke, gunGrip);
  [yoke, gunGrip].forEach((m) => outline(m, w.line));
  scene.add(gun);
  box(0.12, 0.12, 6, 2.9, 5.25, -15, ironDark, false);

  // The long shadow he throws toward us as he walks into the light.
  const shadowGeo = new THREE.PlaneGeometry(0.75, 1);
  shadowGeo.translate(0, 0.5, 0);
  shadowGeo.rotateX(-Math.PI / 2);
  shadowGeo.rotateY(Math.PI);
  const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: tex(shadowTex()), color: "#000000", transparent: true, depthWrite: false, opacity: 0 }));
  shadow.renderOrder = 5;
  scene.add(shadow);

  /* ---- The worker ----------------------------------------------------- */
  let worker = null;
  let glasses = null;
  let disposed = false;
  const glassesAt = { eyes: new THREE.Vector3(), brow: new THREE.Vector3() };
  const ready = createModelFigure({
    height: 1.79,
    hair: ["HairBuzzed", "HairBeard", "EyebrowsRegular"],
    line: w.line,
    ink: { tone: 0.95, rim: 0.6 },
    outfit: WORKER,
    fist: 0.62, // a relaxed curl in the gloves, not flat paddles
  }).then((fig) => {
    if (disposed) return;
    worker = fig;
    repaintJacket(fig.model);
    scene.add(fig.root);
    // Measure at rest, where the skinned body matches its bind shape.
    fig.apply({});
    fig.root.updateMatrixWorld(true);
    // Feet: the bones that touch the floor, and how high each sits at rest.
    const fp = new THREE.Vector3();
    fig.feet = ["ball_l", "ball_r", "foot_l", "foot_r"]
      .map((n) => fig.model.getObjectByName(n))
      .filter(Boolean)
      .map((b) => ({ b, r: b.getWorldPosition(fp).y }));
    // Safety glasses on the head bone: find the bridge of the nose on the
    // body mesh at eye height, so they sit on the face whatever the rig.
    const head = fig.bones.head;
    if (head) {
      let body = null;
      fig.model.traverse((o) => o.isMesh && (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) && (body = o));
      const pos = body.geometry.attributes.position;
      const p = new THREE.Vector3();
      let top = -Infinity;
      for (let i = 0; i < pos.count; i++) top = Math.max(top, p.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld).y);
      const eyeY = top - 0.125;
      let front = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld);
        if (Math.abs(p.y - eyeY) < 0.02 && Math.abs(p.x) < 0.04) front = Math.max(front, p.z);
      }
      if (Number.isFinite(front)) {
        glasses = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.036, 0.018), lens);
        outline(glasses, w.line);
        glasses.position.set(0, eyeY, front + 0.004);
        fig.root.add(glasses);
        head.attach(glasses);
        glassesAt.eyes.copy(glasses.position);
        glassesAt.brow.copy(head.worldToLocal(v3(0, eyeY + 0.045, front - 0.012)));
      }
      // A ball cap, sized off the skull just above the brow.
      const capY = top - 0.065;
      let zMin = Infinity;
      let zMax = -Infinity;
      let xMax = 0;
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld);
        if (Math.abs(p.y - capY) > 0.015) continue;
        zMin = Math.min(zMin, p.z);
        zMax = Math.max(zMax, p.z);
        xMax = Math.max(xMax, Math.abs(p.x));
      }
      if (Number.isFinite(zMin) && zMax - zMin > 0.05) {
        const capMat = w.ink({ tint: CAP, tone: 0.9, rim: 0.6 });
        const r = (zMax - zMin) / 2 + 0.014;
        const cz = (zMin + zMax) / 2;
        const cap = new THREE.Group();
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
        dome.scale.set((xMax + 0.014) / r, 0.95, 1);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), capMat);
        brim.scale.set((xMax + 0.01) / r, 1, 0.8);
        brim.position.set(0, 0.004, r * 0.55);
        brim.rotation.x = 0.12;
        cap.add(dome, brim);
        [dome, brim].forEach((m) => outline(m, w.line));
        cap.position.set(0, capY - 0.012, cz);
        fig.root.add(cap);
        head.attach(cap);
      }
    }
    w.register(fig.root);
    grade();
  });

  const grade = () => {
    w.palette(NIGHT);
    w.light(0.3, 1, 0.45);
    w.inks.forEach((m) => m.uniforms.uFogRange.value.set(12, 75));
    w.sync();
  };
  grade();

  const unsubscribeResize = stage.onResize(() => {
    const aspect = stage.size.aspect;
    w.bu.uAspect.value = aspect;
    // Near-square frames widen the lens a little rather than lose the line.
    camera.fov = BASE_FOV * Math.max(1, (1.6 / aspect) ** 0.45);
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    [sparks, haze, motes].forEach((p) => p.resize(stage.size.height, camera.fov, pr));
    w.sync();
  });

  /* ---- Camera --------------------------------------------------------- */
  // Shot A (0 – 4): wide and high from behind the paint booth, the whole line
  // working down to the bay door. Shot B (4 – 18): close on him at his station,
  // then a slow creep after him to the door.
  const SHOT_A = { from: v3(6.2, 4.2, 17.2), to: v3(6.0, 4.0, 15.8), lookFrom: v3(-0.4, 1.2, -6), lookTo: v3(-0.2, 1.25, -7) };
  const CAM_KEYS = [CUT, 7, WALK_START, LOOP];
  const camPath = new THREE.CatmullRomCurve3([v3(6.3, 1.75, -8.4), v3(6.15, 1.75, -8.8), v3(5.9, 1.85, -10.0), v3(4.9, 2.0, -9.6)]);
  const lookPath = new THREE.CatmullRomCurve3([v3(2.1, 1.35, -15.4), v3(2.2, 1.35, -15.6), v3(2.1, 1.5, -19), v3(DOOR_X, 2.1, -28)]);
  const camParam = (c) => {
    let i = 0;
    while (i < CAM_KEYS.length - 2 && c >= CAM_KEYS[i + 1]) i++;
    const k = segment(c, CAM_KEYS[i], CAM_KEYS[i + 1]);
    // Ease out of the first key only; the rest flow through.
    return (i + (i === 0 ? lerp(k, 1 - (1 - k) ** 2, 0.5) : k)) / (CAM_KEYS.length - 1);
  };
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const shotAt = (c) => {
    if (c < CUT) {
      const k = segment(c, 0, CUT);
      camPos.lerpVectors(SHOT_A.from, SHOT_A.to, k);
      camLook.lerpVectors(SHOT_A.lookFrom, SHOT_A.lookTo, k);
    } else {
      const s = camParam(c);
      camPath.getPoint(s, camPos);
      lookPath.getPoint(s, camLook);
    }
  };

  const wp = new THREE.Vector3();
  const wq = new THREE.Vector3();
  const look = new THREE.Vector3();
  const rim = new THREE.Color();
  const DOOR_LOOK = v3(DOOR_X - 1.2, 2.2, DOOR_Z - 2);
  const footP = new THREE.Vector3();
  let prewarmed = false;

  const headingAt = (c) => {
    if (c < 9.4) return -Math.PI / 2;
    workerAt(Math.max(WALK_START, c), wp);
    workerAt(Math.max(WALK_START, c) + 0.05, wq);
    let h = Math.atan2(wq.x - wp.x, wq.z - wp.z);
    if (h > 0) h -= Math.PI * 2;
    if (c < 10.2) return lerp(-Math.PI / 2, h, easeInOutCubic(segment(c, 9.4, 10.2)));
    return h;
  };

  const lookAngles = (from, yaw, point) => {
    const dx = point.x - from.x;
    const dz = point.z - from.z;
    const lx = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
    const lz = Math.sin(yaw) * dx + Math.cos(yaw) * dz;
    const h = Math.atan2(lx, lz);
    const p = -Math.atan2(point.y - 1.66, Math.hypot(lx, lz));
    return [THREE.MathUtils.clamp(h, -1.1, 1.1), THREE.MathUtils.clamp(p, -0.4, 0.5)];
  };

  const hisArm = welders.find((a) => a.his);
  const poseWorker = (c, time) => {
    workerAt(c, wp);
    const yaw = headingAt(c);
    worker.root.position.copy(wp);
    worker.root.rotation.y = yaw;
    worker.root.visible = c < LOOP - 0.05;

    // Where he is looking, blended across the beats: the body coming up to
    // his station, the arm that wakes, the floor, the door.
    const incoming = cars.find((car) => car.s >= S_STRAIGHT - 2 && car.z < HIS + 1 && car.z > HIS - 6);
    look.set(0, 1.3, incoming ? incoming.z : HIS);
    let [hy, hp] = lookAngles(wp, yaw, look);
    const tip = lookAngles(wp, yaw, hisArm.tip);
    const toArm = segment(c, 4.0, 4.8);
    hy = lerp(hy, tip[0], toArm);
    hp = lerp(hp, tip[1], toArm);
    const down = segment(c, 8.1, 8.6) * (1 - segment(c, 8.8, 9.2));
    hp = lerp(hp, 0.38, down);
    const door = lookAngles(wp, yaw, DOOR_LOOK);
    const toDoor = segment(c, 8.8, 9.4);
    hy = lerp(hy, door[0], toDoor);
    hp = lerp(hp, door[1], toDoor);
    // Walking: eyes front, chin up a touch as the light reaches him.
    const front = segment(c, 9.8, 10.4);
    hy = lerp(hy, 0, front);
    hp = lerp(hp, -0.04 - 0.08 * segment(c, 14, 17), front);

    const breathe = Math.sin(time * 1.6) * 0.015;
    let pose = { ...STAND, spine: [0.03 + breathe + 0.06 * segment(c, 6.6, 7.4) * (1 - segment(c, 8.8, 9.4)), 0, 0] };
    // The step back from the line.
    const back = Math.sin(segment(c, 6, 7) * Math.PI);
    if (back > 0) pose = mixPose(pose, WALK(segment(c, 6, 7) * Math.PI * 2), back * 0.55);
    // Glasses up onto his forehead: shift's over.
    const brow = segment(c, 7.0, 7.5) * (1 - segment(c, 8.0, 8.6));
    pose = mixPose(pose, BROW, easeInOutCubic(brow));
    // Turn and walk.
    const stride = c >= 9.4 ? Math.min(1, segment(c, 9.4, 9.9) * 0.6 + segment(c, 10.0, 10.8) * 0.4) : 0;
    if (stride > 0) pose = mixPose(pose, WALK((c - 9.4) * 5.8), stride);
    pose.neck = [hp * 0.35, hy * 0.4, 0];
    pose.head = [hp * 0.65, hy * 0.6, 0];
    worker.apply(pose);
    // Plant him: the lowest foot bone rests on the floor, whatever the pose.
    if (worker.feet?.length) {
      worker.root.updateMatrixWorld(true);
      let low = Infinity;
      for (const { b, r } of worker.feet) low = Math.min(low, b.getWorldPosition(footP).y - r);
      worker.root.position.y -= low;
    }

    if (glasses) glasses.position.lerpVectors(glassesAt.eyes, glassesAt.brow, easeInOutCubic(segment(c, 7.35, 7.75)));

    // The long shadow toward camera, from the door light.
    const lit = segment(-wp.z, 13, 22) * (1 - segment(-wp.z, 25.8, 26.6));
    shadow.position.set(wp.x, 0.04, wp.z);
    shadow.rotation.y = Math.atan2(wp.x - DOOR_X, wp.z - DOOR_Z);
    shadow.scale.set(1, 1, 1.5 + lit * 5.5);
    shadow.material.opacity = 0.65 * lit;
  };

  const update = (time, dt) => {
    const c = staticMode ? STATIC_TIME : mod(time, LOOP);
    if (!prewarmed) {
      prewarmed = true;
      // Sparks have history: run the last second and a half before the first frame.
      for (let k = 90; k >= 1; k--) effects(mod(c - k / 60, LOOP), 1 / 60);
    }
    effects(c, dt);

    if (worker) poseWorker(c, time);
    gun.rotation.z = Math.sin(time * 0.9) * 0.025;
    gun.rotation.x = Math.sin(time * 0.7 + 1) * 0.02;

    // The shot, with a breath of handheld and the pointer's parallax.
    shotAt(c);
    camPos.x += Math.sin(time * 0.37) * 0.04 + pointer.x * 0.35;
    camPos.y += Math.sin(time * 0.53) * 0.03 + pointer.y * 0.2;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // The grade: sodium key all the way; the rim light cools as he walks to
    // the door.
    rim.copy(RIM_WARM).lerp(RIM_COOL, smoothstep(segment(c, 8.5, 17)));
    for (const m of w.inks) {
      m.uniforms.uRimColor.value.copy(rim);
      m.uniforms.uKey.value.copy(SODIUM_KEY);
    }
    // No exposure ramp: he goes into silhouette. A short bloom breath at the
    // seam softens the cut back to the top of the line.
    const swell = staticMode ? 0 : Math.max(smoothstep(segment(c, LOOP - 0.6, LOOP)), 1 - smoothstep(segment(c, 0, 0.6)));
    if (stage.bloomPass) stage.bloomPass.strength = baseBloom + 0.3 * swell;
  };

  return {
    ready,
    update,
    setProps() {},
    dispose() {
      disposed = true;
      unsubscribeResize();
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = baseExposure;
      if (stage.bloomPass) stage.bloomPass.strength = baseBloom;
      [sparks, haze, motes].forEach((p) => p.points.material.uniforms.uMap.value.dispose());
      textures.forEach((t) => t.dispose());
      // Templates were cloned, never added: free their geometry here.
      Object.values(templates).forEach((t) => t.traverse((o) => o.geometry?.dispose()));
    },
  };
};
