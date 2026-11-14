import * as THREE from "three";
import { canvasTexture, easeInOutCubic, easeOutCubic, lerp, segment, smoothstep } from "../kit";
import { RED } from "../ink";

/**
 * Reigandō — Musashi's last years, painted live behind "See the Way in all
 * things".
 *
 * 1643–45: Musashi withdrew to Reigandō, a cave on Mount Kinpō near Kumamoto,
 * and wrote The Book of Five Rings there. The last of the nine principles in
 * its Earth book is to see the Way in all things — and he was painter,
 * calligrapher and carver as well as swordsman. The whole scene is one sheet
 * of rice paper that paints itself:
 *
 *   0.3   Mount Kinpō: pale wash ridges, drying out into mist.
 *   1.3   The cave mouth: a rough rock arch, dark mouth edge, dry-brush texture,
 *         moss dots; two pines on the rock; the ground.
 *   3.1   Inside: the cave's shadow washed along the walls, leaving the
 *         lamp-lit middle paper. Old Musashi kneels in profile — long grey hair
 *         tied back, a plain dark kimono — at a low writing desk, a scroll on
 *         it, an oil lamp on its stand. The flame (the only colour but the
 *         seal) is lit.
 *   5.0   Camera pushes in. His brush moves and columns of characters appear
 *         on the scroll, right to left, stroke by stroke (abstract brush marks
 *         built from radical-like strokes, not real text).
 *   9.0   Camera eases back out as the things he made sketch themselves round
 *         him while he keeps writing: a bokken on the ground in front (9.3), his shrike
 *         on a withered branch (9.9), a carved Fudō on a plinth behind him
 *         (10.9), a brush stand on the desk's far corner (11.5).
 *  12.4   The red seal stamps the lower right corner. Hold.
 *  13.7   The ink sinks back into the paper; 15.0 blank paper; loop at 15.6.
 *
 * The figure is drawn, not rigged: lines and washes on the paper plane. A 3D
 * body under ink shading reads as a lit model in front of a painting; a
 * brush-drawn figure reads as part of the painting, which is the point of
 * the slide. Only his writing arm and brush are live — two-bone IK on stroke
 * ribbons, so the brush tip rides each character stroke as it is laid.
 *
 * The stroke shader is the one from shrikeInkScene (wet front, pooling,
 * kasure dry brush, capillary bleed, multiply onto paper, dissolve).
 *
 * Reduced motion holds the finished, sealed painting, framed wide.
 */

const CYCLE = 15.6;
const STATIC_TIME = 13.0;
const FADE = [13.7, 15.0];
const SEAL = { x: 0.78, y: -0.69, size: 0.1, hit: 12.4 };
const WRITE = [5.9, 11.6];
const FLAME_ON = 5.3;
const LAMP = { x: 0.36, y: -0.183 };
const SHOULDER = new THREE.Vector2(-0.245, -0.1);
const UPPER = 0.17;
const FORE = 0.175;
const REST_TIP = new THREE.Vector2(-0.04, -0.3);
const MIN_W = 0.0007;
const CAP = 5;
// The painting's bounds (paper units), framed whole on the wide beats.
const WIDE = { x0: -0.96, x1: 0.96, y0: -0.76, y1: 0.9 };
// The writing: his head, hand, scroll and lamp.
const CLOSE = { x0: -0.33, x1: 0.42, y0: -0.37, y1: 0.07 };

// ── The painting, stroke by stroke ──────────────────────────────────────────
// Paper space: x right, y up, origin at the centre. w: half-width keys along
// the stroke. tone: ink value. wet: capillary bleed. dry/dryStart: where the
// brush runs out into streaks. pool: ink pooled at the touch-down. side: one
// edge of the brush loaded darker (wash strokes; + darkens the stroke's left).

const at = (t0, dur, d) => ({ t0, t1: t0 + dur, ...d });
const dab = (t0, x, y, dx, dy, w, tone = 0.9) => at(t0, 0.08, { pts: [[x, y], [x + dx, y + dy]], w: [[0, w], [1, w * 0.4]], tone, wet: 0.4, dry: 0.5, dryStart: 0.3, pool: 0.6 });

const MOUNTAIN = [
  at(0.3, 0.9, { pts: [[-0.35, 0.62], [-0.1, 0.7], [0.12, 0.8], [0.25, 0.86], [0.4, 0.78], [0.6, 0.7], [0.92, 0.64]], w: [[0, 0.03], [0.4, 0.04], [1, 0.024]], tone: 0.3, wet: 1, dry: 0.55, dryStart: 0.55, pool: 0.2, side: 0.7, rim: 0.4 }),
  at(0.75, 0.35, { pts: [[-0.62, 0.66], [-0.47, 0.72], [-0.32, 0.69]], w: [[0, 0.016], [0.5, 0.02], [1, 0.01]], tone: 0.2, wet: 1, dry: 0.5, dryStart: 0.5, side: 0.7 }),
  at(1.0, 0.6, { pts: [[0.05, 0.62], [0.22, 0.69], [0.35, 0.665], [0.5, 0.6], [0.78, 0.56]], w: [[0, 0.02], [0.4, 0.026], [1, 0.014]], tone: 0.4, wet: 0.9, dry: 0.6, dryStart: 0.45, side: 0.7, rim: 0.5 }),
  // Trees on the far ridge, dots of ink.
  dab(1.55, 0.17, 0.795, 0.002, 0.026, 0.0035, 0.55),
  dab(1.62, 0.205, 0.81, 0.001, 0.03, 0.0035, 0.55),
  dab(1.69, 0.31, 0.82, -0.001, 0.026, 0.0032, 0.5),
];

// Washes taper at both ends so neighbouring strokes overlap without round blots.
const taper = (w) => {
  const keys = w.length === 2 ? [w[0], [0.5, (w[0][1] + w[1][1]) / 2], w[1]] : w;
  return keys.map(([s, v], i) => [s, i === 0 || i === keys.length - 1 ? v * 0.55 : v]);
};
const wash = (t0, dur, pts, w, tone, extra = {}) => at(t0, dur, { pts, w: taper(w), tone, wet: 0.9, dry: 0.4, dryStart: 0.55, pool: 0.05, side: -0.6, rim: 0.6, ...extra });

const ARCH = [
  // The rock: broken washes of uneven width, the mouth side loaded dark.
  wash(1.3, 0.22, [[-0.7, -0.55], [-0.69, -0.35], [-0.675, -0.16]], [[0, 0.1], [0.5, 0.094], [1, 0.08]], 0.34),
  wash(1.5, 0.28, [[-0.665, -0.2], [-0.648, -0.02], [-0.605, 0.14], [-0.54, 0.26]], [[0, 0.084], [0.4, 0.078], [1, 0.058]], 0.3, { dry: 0.55 }),
  wash(1.75, 0.18, [[-0.57, 0.3], [-0.45, 0.365], [-0.31, 0.405]], [[0, 0.064], [1, 0.078]], 0.37),
  wash(1.92, 0.3, [[-0.29, 0.41], [-0.1, 0.44], [0.08, 0.43], [0.23, 0.385]], [[0, 0.07], [0.35, 0.088], [0.7, 0.075], [1, 0.052]], 0.27, { dry: 0.6 }),
  wash(2.2, 0.22, [[0.25, 0.365], [0.38, 0.29], [0.48, 0.18], [0.555, 0.05]], [[0, 0.056], [0.5, 0.068], [1, 0.074]], 0.34),
  wash(2.4, 0.26, [[0.565, 0.09], [0.605, -0.1], [0.645, -0.3], [0.7, -0.55]], [[0, 0.068], [0.5, 0.086], [1, 0.1]], 0.3),
  // The mouth's edge, heavy and dark, never quite even.
  at(1.55, 0.4, { pts: [[-0.36, 0.25], [-0.44, 0.2], [-0.49, 0.1], [-0.535, 0.0], [-0.55, -0.12], [-0.575, -0.3], [-0.58, -0.5]], w: [[0, 0.006], [0.3, 0.014], [0.6, 0.011], [1, 0.017]], tone: 0.95, wet: 0.5, dry: 0.55, dryStart: 0.6, pool: 1 }),
  at(1.98, 0.32, { pts: [[-0.38, 0.245], [-0.25, 0.29], [-0.12, 0.3], [-0.02, 0.325], [0.1, 0.31], [0.22, 0.265], [0.3, 0.22]], w: [[0, 0.012], [0.4, 0.015], [0.7, 0.009], [1, 0.006]], tone: 0.92, wet: 0.5, dry: 0.7, dryStart: 0.35, pool: 0.9 }),
  at(2.32, 0.4, { pts: [[0.27, 0.24], [0.38, 0.16], [0.45, 0.07], [0.5, -0.06], [0.53, -0.2], [0.555, -0.34], [0.585, -0.5]], w: [[0, 0.015], [0.3, 0.011], [0.6, 0.014], [1, 0.019]], tone: 0.95, wet: 0.5, dry: 0.5, dryStart: 0.5, pool: 1 }),
  // The outer face: craggy, dry, broken.
  at(2.55, 0.36, { pts: [[-0.82, -0.54], [-0.79, -0.38], [-0.8, -0.26], [-0.76, -0.12], [-0.77, 0.0], [-0.72, 0.12], [-0.7, 0.22], [-0.62, 0.3], [-0.6, 0.38], [-0.5, 0.43], [-0.38, 0.47]], w: [[0, 0.011], [0.5, 0.007], [1, 0.004]], tone: 0.82, wet: 0.3, dry: 0.75, dryStart: 0.15, pool: 0.6 }),
  at(2.8, 0.28, { pts: [[-0.3, 0.5], [-0.18, 0.49], [-0.06, 0.54], [0.06, 0.53], [0.18, 0.49], [0.28, 0.47], [0.38, 0.4], [0.46, 0.36]], w: [[0, 0.008], [0.5, 0.006], [1, 0.005]], tone: 0.75, wet: 0.3, dry: 0.85, dryStart: 0.15, pool: 0.5 }),
  at(3.0, 0.3, { pts: [[0.5, 0.33], [0.57, 0.24], [0.62, 0.16], [0.67, 0.08], [0.68, -0.04], [0.73, -0.16], [0.74, -0.3], [0.79, -0.42], [0.83, -0.54]], w: [[0, 0.007], [0.5, 0.009], [1, 0.012]], tone: 0.82, wet: 0.3, dry: 0.7, dryStart: 0.25, pool: 0.6 }),
  // Axe-cut texture strokes and cracks across the rock, then moss.
  ...[
    [-0.74, -0.44, 0.03, 0.07],
    [-0.71, -0.3, 0.04, -0.05],
    [-0.66, -0.12, 0.035, 0.06],
    [-0.68, 0.02, 0.05, -0.04],
    [-0.6, 0.18, 0.05, -0.03],
    [-0.47, 0.37, 0.05, -0.02],
    [-0.3, 0.45, 0.06, -0.025],
    [-0.08, 0.47, 0.05, -0.03],
    [0.12, 0.45, 0.05, -0.035],
    [0.33, 0.36, 0.03, -0.05],
    [0.52, 0.2, -0.02, -0.06],
    [0.6, 0.02, -0.01, -0.07],
    [0.66, -0.2, 0.02, -0.07],
    [0.65, -0.42, 0.04, 0.06],
  ].map(([x, y, dx, dy], i) => at(3.2 + i * 0.035, 0.07, { pts: [[x, y], [x + dx * 0.5 + dy * 0.1, y + dy * 0.5 - dx * 0.1], [x + dx, y + dy]], w: [[0, 0.006], [0.3, 0.007], [1, 0.002]], tone: 0.85, wet: 0.35, dry: 0.65, dryStart: 0.25, pool: 0.5 })),
  ...[
    [-0.775, 0.0],
    [-0.62, 0.32],
    [-0.47, 0.44],
    [-0.04, 0.535],
    [0.29, 0.47],
    [0.6, 0.2],
    [0.735, -0.18],
  ].map(([x, y], i) => dab(3.7 + i * 0.04, x, y, 0.003, 0.002, 0.0058, 0.95)),
];

const pine = (t0, trunk, clumps) => [
  at(t0, 0.35, { pts: trunk, w: [[0, 0.012], [0.6, 0.008], [1, 0.0035]], tone: 0.88, wet: 0.4, dry: 0.6, dryStart: 0.3, pool: 0.8, side: 0.4 }),
  ...clumps.flatMap(([x, y, len, bx, by], i) => {
    const t = t0 + 0.35 + i * 0.16;
    return [
      // The bough out to the clump, a pale wash for the mass, then needles fanned up.
      at(t, 0.06, { pts: [[bx, by], [lerp(bx, x, 0.5), lerp(by, y, 0.5) + 0.006], [x, y]], w: [[0, 0.0035], [1, 0.0015]], tone: 0.85, wet: 0.3, dry: 0.5, dryStart: 0.3 }),
      at(t + 0.04, 0.08, { pts: [[x - len / 2, y - 0.002], [x, y + 0.007], [x + len / 2, y]], w: [[0, 0.008], [0.5, 0.014], [1, 0.006]], tone: 0.36, wet: 1, dry: 0.3, dryStart: 0.6, side: 0.6, pool: 0.1 }),
      ...Array.from({ length: 7 }, (_, k) => {
        const u = k / 6 - 0.5;
        const nx = x + u * len * 0.92;
        const ny = y + 0.004 - Math.abs(u) * 0.01;
        const h = 0.018 + 0.006 * Math.sin(k * 2.3 + i);
        return at(t + 0.08 + k * 0.012, 0.03, { pts: [[nx, ny], [nx + u * 0.02, ny + h]], w: [[0, 0.0022], [1, 0.0007]], tone: 0.9, wet: 0.2, dry: 0.4, dryStart: 0.4 });
      }),
    ];
  }),
];

const PINES = [
  ...pine(
    2.6,
    [[0.46, 0.37], [0.5, 0.45], [0.57, 0.52], [0.62, 0.6], [0.7, 0.66], [0.79, 0.69]],
    [
      [0.57, 0.47, 0.1, 0.52, 0.45],
      [0.67, 0.56, 0.13, 0.6, 0.57],
      [0.76, 0.63, 0.12, 0.7, 0.66],
      [0.82, 0.715, 0.09, 0.78, 0.69],
    ],
  ),
  ...pine(
    3.1,
    [[-0.47, 0.42], [-0.505, 0.5], [-0.495, 0.6]],
    [
      [-0.535, 0.515, 0.08, -0.5, 0.49],
      [-0.47, 0.6, 0.07, -0.495, 0.585],
    ],
  ),
];

const GROUND = [
  at(3.1, 0.3, { pts: [[-0.56, -0.5], [-0.2, -0.497], [0.2, -0.502], [0.56, -0.497]], w: [[0, 0.0032], [1, 0.0024]], tone: 0.55, wet: 0.4, dry: 0.5, dryStart: 0.3 }),
  at(3.35, 0.15, { pts: [[-0.98, -0.565], [-0.88, -0.545], [-0.79, -0.535]], w: [[0, 0.006], [1, 0.003]], tone: 0.7, wet: 0.4, dry: 0.6, dryStart: 0.3 }),
  at(3.45, 0.15, { pts: [[0.8, -0.535], [0.9, -0.55], [1.0, -0.565]], w: [[0, 0.006], [1, 0.003]], tone: 0.7, wet: 0.4, dry: 0.6, dryStart: 0.3 }),
  dab(3.55, -0.9, -0.543, -0.004, 0.03, 0.003, 0.8),
  dab(3.6, -0.86, -0.538, 0.008, 0.024, 0.003, 0.8),
  dab(3.65, 0.86, -0.545, 0.004, 0.026, 0.003, 0.8),
  dab(3.7, 0.92, -0.552, -0.008, 0.024, 0.003, 0.8),
];

// The cave's dark, washed along the walls; the lamp-lit middle stays paper.
const SHADOW = [
  at(3.3, 0.6, { pts: [[-0.525, -0.48], [-0.515, -0.25], [-0.49, -0.06], [-0.44, 0.08], [-0.37, 0.17], [-0.24, 0.235], [-0.08, 0.255], [0.08, 0.26], [0.2, 0.22], [0.32, 0.14], [0.4, 0.04]], w: [[0, 0.05], [0.25, 0.034], [0.5, 0.058], [0.75, 0.05], [1, 0.032]], tone: 0.21, wet: 1, dry: 0.45, dryStart: 0.15, pool: 0.05, side: 0.75, rim: 0.3 }),
  at(3.85, 0.3, { pts: [[0.42, 0.06], [0.47, -0.12], [0.5, -0.3], [0.525, -0.48]], w: [[0, 0.032], [0.5, 0.044], [1, 0.03]], tone: 0.18, wet: 1, dry: 0.4, dryStart: 0.3, side: 0.75, rim: 0.3 }),
];

const FIGURE = [
  // Grey hair over the crown, tied at the nape, hanging long down his back.
  at(3.7, 0.18, { pts: [[-0.216, 0.03], [-0.236, 0.043], [-0.258, 0.037], [-0.272, 0.018], [-0.278, -0.006]], w: [[0, 0.009], [0.35, 0.017], [0.7, 0.018], [1, 0.014]], tone: 0.5, wet: 0.6, dry: 0.3, dryStart: 0.2, pool: 0.2, side: 0.5 }),
  at(3.85, 0.14, { pts: [[-0.218, 0.031], [-0.24, 0.042], [-0.262, 0.034], [-0.276, 0.01], [-0.275, -0.02], [-0.264, -0.042]], w: [[0, 0.0018], [0.5, 0.0026], [1, 0.0016]], tone: 0.8, wet: 0.2 }),
  at(4.0, 0.12, { pts: [[-0.218, 0.031], [-0.207, 0.014], [-0.204, 0.001], [-0.198, -0.012], [-0.203, -0.018], [-0.202, -0.03], [-0.208, -0.042], [-0.222, -0.052]], w: [[0, 0.0018], [0.5, 0.0022], [1, 0.0016]], tone: 0.8, wet: 0.2 }),
  at(4.13, 0.03, { pts: [[-0.213, -0.004], [-0.209, -0.005]], w: [[0, 0.0019], [1, 0.0017]], tone: 1, wet: 0.2, pool: 0.4 }),
  at(4.17, 0.04, { pts: [[-0.219, 0.007], [-0.207, 0.005]], w: [[0, 0.0016], [1, 0.0012]], tone: 0.45, wet: 0.2 }),
  at(4.22, 0.04, { pts: [[-0.251, -0.002], [-0.246, -0.012], [-0.249, -0.021]], w: [[0, 0.0015], [1, 0.0013]], tone: 0.5, wet: 0.2 }),
  // Tied at the nape; the tail falls long behind his back.
  at(4.27, 0.04, { pts: [[-0.284, -0.006], [-0.285, -0.018]], w: [[0, 0.0042], [1, 0.004]], tone: 1, wet: 0.3, pool: 0.5 }),
  at(4.32, 0.25, { pts: [[-0.286, -0.018], [-0.298, -0.05], [-0.312, -0.09], [-0.323, -0.13], [-0.33, -0.175]], w: [[0, 0.0075], [0.3, 0.0098], [1, 0.0028]], tone: 0.52, wet: 0.4, dry: 0.65, dryStart: 0.3, pool: 0.2 }),
  // The kimono: a dark wash for the body, another for the folded legs.
  at(4.4, 0.35, { pts: [[-0.255, -0.07], [-0.262, -0.15], [-0.268, -0.25], [-0.268, -0.35], [-0.262, -0.43]], w: [[0, 0.034], [0.4, 0.047], [1, 0.054]], tone: 0.72, wet: 0.6, dry: 0.2, dryStart: 0.7, pool: 0.3, side: 0.3 }),
  at(4.7, 0.25, { pts: [[-0.31, -0.445], [-0.22, -0.448], [-0.13, -0.452], [-0.065, -0.463]], w: [[0, 0.044], [0.6, 0.037], [1, 0.028]], tone: 0.74, wet: 0.6, dry: 0.3, dryStart: 0.7, pool: 0.3, side: 0.4 }),
  // Contours: his back, the crossed collar and chest, the obi, the lap, the floor.
  at(4.75, 0.25, { pts: [[-0.268, -0.05], [-0.29, -0.1], [-0.305, -0.18], [-0.318, -0.28], [-0.325, -0.38], [-0.322, -0.45], [-0.31, -0.49]], w: [[0, 0.004], [0.5, 0.0075], [1, 0.0055]], tone: 0.95, wet: 0.4, dry: 0.4, dryStart: 0.5, pool: 0.8 }),
  at(4.95, 0.2, { pts: [[-0.232, -0.062], [-0.215, -0.09], [-0.205, -0.14], [-0.2, -0.2], [-0.19, -0.27], [-0.17, -0.33]], w: [[0, 0.0045], [1, 0.006]], tone: 0.95, wet: 0.4, dry: 0.3, dryStart: 0.6, pool: 0.8 }),
  at(5.12, 0.08, { pts: [[-0.25, -0.06], [-0.228, -0.1], [-0.214, -0.15]], w: [[0, 0.0028], [1, 0.002]], tone: 0.9, wet: 0.3 }),
  at(5.2, 0.1, { pts: [[-0.318, -0.33], [-0.25, -0.336], [-0.19, -0.33]], w: [[0, 0.009], [1, 0.008]], tone: 1, wet: 0.4, pool: 0.6 }),
  at(5.3, 0.12, { pts: [[-0.19, -0.4], [-0.12, -0.41], [-0.065, -0.43], [-0.05, -0.47]], w: [[0, 0.004], [1, 0.0045]], tone: 0.92, wet: 0.3, pool: 0.6 }),
  at(5.42, 0.14, { pts: [[-0.32, -0.493], [-0.2, -0.497], [-0.08, -0.495], [-0.05, -0.48]], w: [[0, 0.005], [1, 0.004]], tone: 0.95, wet: 0.4, dry: 0.5, dryStart: 0.4, pool: 0.6 }),
];

const DESK = [
  at(4.6, 0.12, { pts: [[-0.165, -0.335], [0.0, -0.333], [0.2, -0.335]], w: [[0, 0.0045], [1, 0.004]], tone: 0.95, wet: 0.3, pool: 0.6 }),
  at(4.72, 0.1, { pts: [[-0.165, -0.3435], [0.2, -0.3435]], w: [[0, 0.007], [1, 0.006]], tone: 0.35, wet: 0.6 }),
  at(4.82, 0.1, { pts: [[-0.165, -0.352], [0.2, -0.352]], w: [[0, 0.003], [1, 0.0025]], tone: 0.85, wet: 0.3 }),
  at(4.92, 0.1, { pts: [[-0.125, -0.205], [0.24, -0.205]], w: [[0, 0.0028], [1, 0.0024]], tone: 0.75, wet: 0.3 }),
  at(5.02, 0.05, { pts: [[-0.165, -0.335], [-0.125, -0.205]], w: [[0, 0.0026], [1, 0.0024]], tone: 0.8, wet: 0.3 }),
  at(5.07, 0.05, { pts: [[0.2, -0.335], [0.24, -0.205]], w: [[0, 0.0026], [1, 0.0024]], tone: 0.8, wet: 0.3 }),
  at(5.12, 0.07, { pts: [[-0.155, -0.352], [-0.152, -0.495]], w: [[0, 0.005], [1, 0.0042]], tone: 0.9, wet: 0.3, pool: 0.5 }),
  at(5.19, 0.07, { pts: [[0.19, -0.352], [0.188, -0.495]], w: [[0, 0.005], [1, 0.0042]], tone: 0.9, wet: 0.3, pool: 0.5 }),
];

// The scroll, unrolled on the desk; drawn with the desk's slight perspective.
const SKEW = 0.31;
const SCROLL_Y = [-0.322, -0.218];
const sk = (x, y) => [x + (y - SCROLL_Y[0]) * SKEW, y];
const SCROLL = [
  at(5.3, 0.08, { pts: [sk(-0.12, SCROLL_Y[0]), sk(0.075, SCROLL_Y[0])], w: [[0, 0.0015], [1, 0.0013]], tone: 0.5, wet: 0.2 }),
  at(5.38, 0.08, { pts: [sk(-0.12, SCROLL_Y[1]), sk(0.075, SCROLL_Y[1])], w: [[0, 0.0015], [1, 0.0013]], tone: 0.5, wet: 0.2 }),
  at(5.46, 0.05, { pts: [sk(0.077, SCROLL_Y[0] - 0.003), sk(0.077, SCROLL_Y[1] + 0.003)], w: [[0, 0.0034], [1, 0.0034]], tone: 0.9, wet: 0.3 }),
  at(5.51, 0.06, { pts: [sk(-0.124, SCROLL_Y[0] - 0.004), sk(-0.124, SCROLL_Y[1] + 0.004)], w: [[0, 0.0075], [1, 0.0075]], tone: 0.4, wet: 0.5, side: 0.6 }),
  at(5.57, 0.05, { pts: [sk(-0.132, SCROLL_Y[0] - 0.004), sk(-0.132, SCROLL_Y[1] + 0.004)], w: [[0, 0.0018], [1, 0.0016]], tone: 0.9, wet: 0.2 }),
];

const LAMP_STROKES = [
  at(5.0, 0.12, { pts: [[0.36, -0.47], [0.36, -0.2]], w: [[0, 0.0035], [1, 0.003]], tone: 0.9, wet: 0.3, pool: 0.4 }),
  at(5.12, 0.06, { pts: [[0.334, -0.474], [0.386, -0.474]], w: [[0, 0.006], [1, 0.0055]], tone: 0.9, wet: 0.4, pool: 0.5 }),
  at(5.18, 0.06, { pts: [[0.341, -0.198], [0.36, -0.206], [0.379, -0.198]], w: [[0, 0.0035], [1, 0.003]], tone: 0.95, wet: 0.3, pool: 0.5 }),
];

// ── The writing ─────────────────────────────────────────────────────────────
// Glyphs are built from radical-like brush strokes in a unit box. They look
// like a hand writing; they are not meant to be read.
const H = (y, x0, x1) => ({ pts: [[x0, y], [(x0 + x1) / 2, y + 0.02], [x1, y + 0.035]], w: [[0, 1], [0.8, 0.85], [1, 1.1]] });
const V = (x, y0, y1) => ({ pts: [[x, y0], [x + 0.01, (y0 + y1) / 2], [x, y1]], w: [[0, 1.15], [0.85, 1], [1, 0.5]] });
const LF = (x0, y0, x1, y1) => ({ pts: [[x0, y0], [lerp(x0, x1, 0.4) + 0.02, lerp(y0, y1, 0.5)], [x1, y1]], w: [[0, 1], [1, 0.25]] });
const RF = (x0, y0, x1, y1) => ({ pts: [[x0, y0], [lerp(x0, x1, 0.55), lerp(y0, y1, 0.6) + 0.03], [x1, y1]], w: [[0, 0.5], [0.8, 1.3], [1, 0.6]] });
const DOT = (x, y) => ({ pts: [[x, y], [x + 0.05, y - 0.08]], w: [[0, 0.8], [1, 1.2]] });
const HOOK = (x0, x1, y0, y1) => ({ pts: [[x0, y0], [x1, y0 + 0.03], [x1 - 0.01, (y0 + y1) / 2], [x1 - 0.03, y1]], w: [[0, 1], [0.4, 1.1], [1, 0.4]] });
const GLYPHS = [
  [H(0.3, -0.34, 0.34), H(-0.02, -0.26, 0.26), V(0, 0.44, -0.38), H(-0.38, -0.44, 0.44)],
  [DOT(-0.04, 0.48), H(0.24, -0.4, 0.4), LF(0.12, 0.12, -0.42, -0.44), RF(-0.12, 0.08, 0.44, -0.42)],
  [V(-0.3, 0.38, -0.38), HOOK(-0.3, 0.3, 0.38, -0.38), H(0.0, -0.22, 0.22), H(-0.36, -0.28, 0.28)],
  [H(0.16, -0.42, 0.42), V(0, 0.46, -0.44), LF(-0.02, 0.1, -0.42, -0.34), RF(0.02, 0.1, 0.42, -0.34)],
  [LF(0.0, 0.46, -0.42, 0.06), V(-0.2, 0.18, -0.46), H(0.26, 0.0, 0.42), V(0.22, 0.34, -0.46)],
  [DOT(-0.34, 0.36), DOT(-0.38, 0.06), LF(-0.2, -0.12, -0.44, -0.42), H(0.22, -0.08, 0.44), V(0.18, 0.44, -0.46)],
  [H(0.38, -0.3, 0.3), LF(0.02, 0.38, -0.42, -0.44), H(-0.04, -0.14, 0.36), V(0.14, -0.02, -0.46)],
  [DOT(0.0, 0.48), H(0.28, -0.44, 0.44), V(-0.2, 0.14, -0.22), V(0.2, 0.14, -0.22), H(-0.34, -0.36, 0.36)],
];
const COLUMNS = [0.038, 0.006, -0.026, -0.058, -0.09];
const ROWS = [-0.233, -0.257, -0.281, -0.305];
const GLYPH = 0.019;
const INK_W = 0.0019;

const writing = () => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cells = [];
  COLUMNS.forEach((cx, c) => {
    // The first column is the title: three characters, then a space.
    const rows = c === 0 ? ROWS.slice(0, 3) : ROWS;
    rows.forEach((cy) => cells.push(sk(cx, cy)));
  });
  const per = (WRITE[1] - WRITE[0]) / cells.length;
  const strokes = [];
  cells.forEach(([cx, cy], i) => {
    const glyph = GLYPHS[Math.floor(next() * GLYPHS.length)];
    const size = GLYPH * (0.92 + next() * 0.16);
    const slot = (per * 0.86) / glyph.length;
    glyph.forEach((g, k) => {
      const t0 = WRITE[0] + i * per + k * slot;
      strokes.push({
        t0,
        t1: t0 + slot * 0.72,
        pts: g.pts.map(([x, y]) => [cx + (x + y * 0.06) * size, cy + y * size]),
        w: g.w.map(([s, m]) => [s, m * INK_W]),
        tone: 0.97,
        wet: 0.25,
        dry: 0.25,
        dryStart: 0.6,
        pool: 0.7,
      });
    });
  });
  return strokes;
};

// ── The Way in all things ──────────────────────────────────────────────────

// Drawn at a small reference size, then scaled about an anchor and moved, so
// each work reads at the wide framing and sits apart from the others.
const place = (strokes, [ox, oy], k, [nx, ny]) =>
  strokes.map((d) => ({
    ...d,
    pts: d.pts.map(([x, y]) => [nx + (x - ox) * k, ny + (y - oy) * k]),
    w: d.w.map(([s, v]) => [s, v * k]),
  }));

// On the ground in front of him.
const BOKKEN = place([
  at(9.3, 0.08, { pts: [[-0.33, -0.59], [-0.12, -0.578], [0.07, -0.566]], w: [[0, 0.006], [1, 0.005]], tone: 0.15, wet: 1 }),
  at(9.4, 0.32, { pts: [[-0.34, -0.578], [-0.2, -0.566], [-0.05, -0.556], [0.08, -0.552]], w: [[0, 0.0075], [0.25, 0.007], [0.3, 0.006], [0.9, 0.0052], [1, 0.0026]], tone: 0.9, wet: 0.35, dry: 0.45, dryStart: 0.5, pool: 0.9 }),
  at(9.78, 0.05, { pts: [[-0.256, -0.586], [-0.251, -0.556]], w: [[0, 0.0034], [1, 0.003]], tone: 1, wet: 0.3, pool: 0.4 }),
], [-0.13, -0.566], 1.6, [-0.17, -0.612]);

// The shrike from his Koboku Meigeki-zu, small, on a branch out of the rock;
// mirrored so it faces into the cave and its tail hangs clear of the branch.
const SX = -0.822;
const SY = 0.43;
const SS = 0.72;
const shrike = (pts) => pts.map(([x, y]) => [SX - x * SS, SY + y * SS]);
const sw = (keys) => keys.map(([s, w]) => [s, w * SS]);
const SHRIKE = [
  at(9.9, 0.3, { pts: [[-0.655, 0.2], [-0.72, 0.3], [-0.79, 0.39], [-0.85, 0.47], [-0.875, 0.525]], w: [[0, 0.011], [0.5, 0.007], [1, 0.002]], tone: 0.95, wet: 0.45, dry: 0.6, dryStart: 0.35, pool: 0.8 }),
  at(10.22, 0.1, { pts: [[-0.75, 0.345], [-0.7, 0.4], [-0.685, 0.44]], w: [[0, 0.004], [1, 0.0012]], tone: 0.9, wet: 0.3, dry: 0.6, dryStart: 0.3 }),
  at(10.35, 0.16, { pts: shrike([[-0.015, 0.095], [0.005, 0.07], [0.025, 0.04], [0.035, 0.015]]), w: sw([[0, 0.022], [0.3, 0.033], [0.7, 0.029], [1, 0.012]]), tone: 0.42, wet: 0.9, dry: 0.1, dryStart: 0.7, pool: 0.3, side: -0.8, rim: 1 }),
  at(10.52, 0.06, { pts: shrike([[-0.031, 0.116], [-0.013, 0.12]]), w: sw([[0, 0.019], [1, 0.018]]), tone: 0.72, wet: 0.8, pool: 0.2, side: -0.6, rim: 0.8 }),
  at(10.59, 0.1, { pts: shrike([[-0.005, 0.105], [0.02, 0.08], [0.04, 0.05], [0.05, 0.03]]), w: sw([[0, 0.009], [0.4, 0.015], [1, 0.006]]), tone: 0.88, wet: 0.5, dry: 0.45, dryStart: 0.5, side: -0.5 }),
  at(10.7, 0.05, { pts: shrike([[-0.05, 0.118], [-0.03, 0.111], [-0.01, 0.116]]), w: sw([[0, 0.0055], [0.4, 0.0085], [1, 0.0045]]), tone: 1, wet: 0.35, pool: 0.9 }),
  at(10.76, 0.03, { pts: shrike([[-0.048, 0.118], [-0.062, 0.115], [-0.068, 0.109]]), w: sw([[0, 0.0034], [1, 0.0008]]), tone: 1, wet: 0.2, pool: 0.3 }),
  at(10.8, 0.1, { pts: shrike([[0.04, 0.035], [0.07, -0.01], [0.1, -0.07], [0.12, -0.112]]), w: sw([[0, 0.012], [0.3, 0.0105], [0.85, 0.007], [1, 0.0045]]), tone: 0.95, wet: 0.35, dry: 0.5, dryStart: 0.55, pool: 0.5 }),
  at(10.91, 0.03, { pts: shrike([[-0.005, 0.03], [-0.006, 0.0]]), w: sw([[0, 0.0024], [1, 0.0014]]), tone: 1, wet: 0.3, pool: 0.2 }),
  at(10.95, 0.03, { pts: shrike([[0.008, 0.028], [0.01, 0.0]]), w: sw([[0, 0.0024], [1, 0.0014]]), tone: 1, wet: 0.3, pool: 0.2 }),
];

// A carved Fudō Myōō on a plinth, behind him by the left wall: robed body,
// head, sword, flame halo.
const CARVING = place([
  at(11.0, 0.06, { pts: [[0.452, -0.489], [0.508, -0.489]], w: [[0, 0.0075], [1, 0.007]], tone: 0.85, wet: 0.4, pool: 0.5 }),
  at(11.06, 0.04, { pts: [[0.454, -0.477], [0.506, -0.477]], w: [[0, 0.0018], [1, 0.0016]], tone: 0.8, wet: 0.2 }),
  at(11.1, 0.1, { pts: [[0.48, -0.395], [0.476, -0.43], [0.475, -0.472]], w: [[0, 0.009], [0.5, 0.013], [1, 0.016]], tone: 0.45, wet: 0.4, side: 0.5, pool: 0.3 }),
  at(11.2, 0.06, { pts: [[0.472, -0.39], [0.465, -0.43], [0.46, -0.472]], w: [[0, 0.0022], [1, 0.002]], tone: 0.9, wet: 0.2 }),
  at(11.26, 0.06, { pts: [[0.488, -0.39], [0.493, -0.43], [0.495, -0.472]], w: [[0, 0.0022], [1, 0.002]], tone: 0.9, wet: 0.2 }),
  at(11.32, 0.04, { pts: [[0.48, -0.371], [0.481, -0.384]], w: [[0, 0.006], [1, 0.0065]], tone: 0.5, wet: 0.4, pool: 0.3 }),
  at(11.36, 0.04, { pts: [[0.485, -0.405], [0.485, -0.46]], w: [[0, 0.0015], [1, 0.0012]], tone: 1, wet: 0.2 }),
  at(11.4, 0.08, { pts: [[0.466, -0.402], [0.461, -0.372], [0.474, -0.354], [0.49, -0.358], [0.499, -0.386]], w: [[0, 0.0025], [0.5, 0.0035], [1, 0.002]], tone: 0.3, wet: 0.5, dry: 0.5, dryStart: 0.3 }),
], [0.48, -0.489], 1.8, [-0.46, -0.484]);

// On the desk's far corner.
const BRUSH_STAND = place([
  at(11.5, 0.05, { pts: [[0.155, -0.222], [0.236, -0.222]], w: [[0, 0.004], [1, 0.0036]], tone: 0.9, wet: 0.3, pool: 0.5 }),
  at(11.55, 0.05, { pts: [[0.162, -0.222], [0.162, -0.135]], w: [[0, 0.0025], [1, 0.0022]], tone: 0.85, wet: 0.2 }),
  at(11.6, 0.05, { pts: [[0.229, -0.222], [0.229, -0.135]], w: [[0, 0.0025], [1, 0.0022]], tone: 0.85, wet: 0.2 }),
  at(11.65, 0.05, { pts: [[0.152, -0.135], [0.239, -0.137]], w: [[0, 0.0035], [1, 0.003]], tone: 0.95, wet: 0.3, pool: 0.5 }),
  ...[0.178, 0.195, 0.212].flatMap((x, i) => [
    at(11.72 + i * 0.08, 0.04, { pts: [[x, -0.139], [x, -0.18]], w: [[0, 0.0017], [1, 0.0016]], tone: 0.7, wet: 0.2 }),
    at(11.76 + i * 0.08, 0.03, { pts: [[x, -0.18], [x, -0.198]], w: [[0, 0.003], [1, 0.0007]], tone: 1, wet: 0.3 }),
  ]),
], [0.195, -0.222], 1.6, [0.18, -0.222]);

const STATIC_STROKES = [...MOUNTAIN, ...ARCH, ...PINES, ...GROUND, ...SHADOW, ...FIGURE, ...DESK, ...SCROLL, ...LAMP_STROKES, ...BOKKEN, ...SHRIKE, ...CARVING, ...BRUSH_STAND];

// The writing arm, in its own frames: each part is drawn along +x from its joint.
const ARM = {
  upper: [
    at(4.55, 0.12, { pts: [[0, 0], [UPPER * 0.5, -0.003], [UPPER, 0]], w: [[0, 0.024], [1, 0.019]], tone: 0.68, wet: 0.5, pool: 0.2 }),
    at(4.67, 0.08, { pts: [[0, -0.022], [UPPER * 0.5, -0.022], [UPPER, -0.017]], w: [[0, 0.0035], [1, 0.003]], tone: 0.95, wet: 0.3 }),
  ],
  fore: [
    at(4.75, 0.1, { pts: [[0, 0], [FORE * 0.5, 0.002], [FORE, 0]], w: [[0, 0.02], [1, 0.016]], tone: 0.68, wet: 0.5, pool: 0.2 }),
    at(4.85, 0.08, { pts: [[0, -0.019], [FORE * 0.5, -0.017], [FORE - 0.004, -0.015]], w: [[0, 0.003], [1, 0.0028]], tone: 0.95, wet: 0.3 }),
  ],
  // The sleeve hangs from the elbow, whatever the arm does.
  drape: [at(4.9, 0.1, { pts: [[0.0, -0.01], [-0.012, -0.045], [0.02, -0.068]], w: [[0, 0.02], [0.6, 0.016], [1, 0.008]], tone: 0.62, wet: 0.6, side: -0.4 })],
  hand: [
    at(5.0, 0.05, { pts: [[0.002, 0.04], [0.008, 0.056]], w: [[0, 0.0065], [1, 0.007]], tone: 0.28, wet: 0.5 }),
    at(5.05, 0.04, { pts: [[-0.003, 0.04], [0.0, 0.051], [0.006, 0.06]], w: [[0, 0.0014], [1, 0.0013]], tone: 0.75, wet: 0.2 }),
    at(5.09, 0.04, { pts: [[0.0015, 0.016], [0.01, 0.074]], w: [[0, 0.0018], [1, 0.0016]], tone: 0.88, wet: 0.2 }),
    at(5.13, 0.03, { pts: [[0, 0], [0.0015, 0.017]], w: [[0, 0.0006], [1, 0.0028]], tone: 1, wet: 0.3 }),
  ],
};
const WRIST = new THREE.Vector2(0.007, 0.054); // from the brush tip

const profile = (keys, s) => {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [s1, w1] = keys[i];
    if (s <= s1) {
      const [s0, w0] = keys[i - 1];
      return lerp(w0, w1, smoothstep((s - s0) / (s1 - s0 || 1)));
    }
  }
  return keys[keys.length - 1][1];
};

// Confident: the brush is already moving when it lands and still moving when it lifts.
const strokeEase = (x) => 0.3 * x + 0.7 * smoothstep(x);

const rng = (seed) => {
  let s = seed % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const NOISE = /* glsl */ `
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm4(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7; a *= 0.5; }
    return s;
  }
  float fbm2(vec2 p) { return 0.62 * vnoise(p) + 0.38 * vnoise(p * 2.1 + 5.3); }
  float fibre(vec2 p) {
    float f1 = vnoise((mat2(0.8, -0.6, 0.6, 0.8) * p) * vec2(240.0, 30.0));
    float f2 = vnoise((mat2(0.28, 0.96, -0.96, 0.28) * p) * vec2(220.0, 28.0));
    return max(f1, f2) * 0.7 + vnoise(p * 90.0) * 0.3;
  }
  float dissolve(vec2 p, float fade) {
    float k = 1.0 - fade;
    return smoothstep(k * 1.25 - 0.25, k * 1.25 - 0.05, fbm4(p * 7.0 + 3.1) * 1.06) * (0.55 + 0.45 * fade);
  }
`;

// Multiply onto what is below: ink only ever darkens paper.
const MULTIPLY = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.ZeroFactor,
  blendDst: THREE.SrcColorFactor,
};

const strokeMaterial = (d, L, seed) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uL: { value: L },
      uProgress: { value: 0 },
      uFrontW: { value: d.w[0][1] },
      uTone: { value: d.tone ?? 0.92 },
      uWet: { value: d.wet ?? 0.5 },
      uDry: { value: d.dry ?? 0 },
      uDryStart: { value: d.dryStart ?? 0.6 },
      uPool: { value: d.pool ?? 0.6 },
      uSide: { value: d.side ?? 0 },
      uRim: { value: d.rim ?? 0 },
      uAge: { value: 0 },
      uDur: { value: d.t1 - d.t0 },
      uFade: { value: 1 },
      uSeed: { value: seed },
      uInk: { value: new THREE.Vector3(0.075, 0.065, 0.06) },
    },
    vertexShader: /* glsl */ `
      attribute float aS;
      attribute float aAcross;
      attribute float aW;
      varying float vS;
      varying float vAcross;
      varying float vW;
      varying vec2 vP;
      void main() {
        vS = aS; vAcross = aAcross; vW = aW; vP = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uL, uProgress, uFrontW, uTone, uWet, uDry, uDryStart, uPool, uSide, uRim, uAge, uDur, uFade, uSeed;
      uniform vec3 uInk;
      varying float vS;
      varying float vAcross;
      varying float vW;
      varying vec2 vP;
      ${NOISE}
      void main() {
        if (uProgress <= 0.0) discard;
        float capD = max(0.0, -vS) + max(0.0, vS - uL);
        float r = length(vec2(vAcross, capD / vW));

        float front = uProgress * uL;
        float behind = smoothstep(-0.0015, 0.0015, front - vS);
        float tipD = length(vec2((vS - front) / max(uFrontW, 1e-4), vAcross));
        float reveal = max(behind, 1.0 - smoothstep(0.8, 1.0, tipD));
        if (reveal <= 0.001) discard;

        vec2 p = vP + uSeed;
        float fib = fibre(p);
        float along = clamp(vS / uL, 0.0, 1.0);
        float age = uAge - along * uDur;
        float spread = smoothstep(0.0, 1.5, age);
        float fresh = 1.0 - smoothstep(0.0, 2.5, age);
        float pool = uPool * exp(-max(vS, 0.0) / (vW * 5.0 + 0.004));

        float aa = fwidth(r) * 1.2 + 0.02;
        float e = 1.0 + (fbm4(p * 70.0) - 0.47) * 0.42 + (fib - 0.5) * 0.14 + pool * 0.18;
        float core = 1.0 - smoothstep(e - 0.1 - aa, e + aa, r);

        float hairs = fbm2(vec2(vAcross * vW * 110.0, vS * 2.5 + uSeed * 3.0));
        float dry = uDry * smoothstep(uDryStart, 1.0, along) + uDry * 0.3 * smoothstep(0.5, 1.0, abs(vAcross));
        float keep = smoothstep(dry * 1.05 - 0.16, dry * 1.05 + 0.03, hairs + (fib - 0.5) * 0.12);

        float g = 0.5 + 0.5 * clamp(vAcross * sign(uSide), -1.0, 1.0);
        float dens = uTone * (1.0 - along * 0.2) + pool * 0.3;
        dens *= mix(1.0, 0.4 + 0.85 * g, abs(uSide));
        dens += uRim * 0.2 * smoothstep(0.5, 0.95, r / e);
        dens *= (0.88 + 0.24 * hairs) * (0.9 + 0.2 * fib) * (1.0 + 0.08 * fresh * uWet);

        float hw = uWet * spread * (0.0035 + 0.35 * vW) * (0.3 + 1.4 * fib) * (1.0 + pool);
        float beyond = max(0.0, r - e) * vW;
        float halo = pow(1.0 - smoothstep(0.0, hw + 1e-5, beyond), 1.6) * smoothstep(e - 0.15, e, r);
        float haloAmt = uTone * 0.32 * (1.0 - dry * 0.8);

        float cov = max(core * keep * dens, halo * haloAmt) * reveal;
        cov = clamp(cov * dissolve(vP, uFade), 0.0, 1.0);
        gl_FragColor = vec4(pow(mix(vec3(1.0), uInk, cov), vec3(2.2)), 1.0);
      }
    `,
    side: THREE.DoubleSide,
    ...MULTIPLY,
  });

/** A ribbon along the stroke, wide enough for the bleed, with round end caps. */
const buildRibbon = (d) => {
  const curve = new THREE.CatmullRomCurve3(
    d.pts.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    "centripetal",
  );
  const L = curve.getLength();
  const wet = d.wet ?? 0.5;
  const pool = d.pool ?? 0.6;
  const margin = (w) => w * 0.55 + wet * (0.0035 + 0.35 * w) * 1.7 * (1 + pool) + 0.0025;
  const rows = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const push = (x, y, tx, ty, s, w) => rows.push([x, y, tx, ty, s, w, w + margin(w)]);
  const n = Math.max(12, Math.ceil(L / 0.0025));

  curve.getPointAt(0, P);
  curve.getTangentAt(0, T);
  const w0 = Math.max(MIN_W, profile(d.w, 0));
  const o0 = w0 + margin(w0);
  for (let k = CAP; k >= 1; k--) {
    const dist = (o0 * k) / CAP;
    push(P.x - T.x * dist, P.y - T.y * dist, T.x, T.y, -dist, w0);
  }
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    push(P.x, P.y, T.x, T.y, u * L, Math.max(MIN_W, profile(d.w, u)));
  }
  curve.getPointAt(1, P);
  curve.getTangentAt(1, T);
  const w1 = Math.max(MIN_W, profile(d.w, 1));
  const o1 = w1 + margin(w1);
  for (let k = 1; k <= CAP; k++) {
    const dist = (o1 * k) / CAP;
    push(P.x + T.x * dist, P.y + T.y * dist, T.x, T.y, L + dist, w1);
  }

  const count = rows.length * 2;
  const position = new Float32Array(count * 3);
  const aS = new Float32Array(count);
  const aAcross = new Float32Array(count);
  const aW = new Float32Array(count);
  rows.forEach(([x, y, tx, ty, s, w, o], i) => {
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1;
      const v = i * 2 + side;
      position[v * 3] = x - ty * o * sign;
      position[v * 3 + 1] = y + tx * o * sign;
      position[v * 3 + 2] = 0;
      aS[v] = s;
      aAcross[v] = (sign * o) / w;
      aW[v] = w;
    }
  });
  const index = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const a = i * 2;
    index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
  geometry.setAttribute("aAcross", new THREE.BufferAttribute(aAcross, 1));
  geometry.setAttribute("aW", new THREE.BufferAttribute(aW, 1));
  geometry.setIndex(index);
  return { geometry, curve, L };
};

/** The seal: vermilion paste, an abstract mark cut in negative, paste missing in specks. */
const sealTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(6113);
    const m = 12;
    ctx.beginPath();
    const corners = [
      [m, m],
      [w - m, m],
      [w - m, h - m],
      [m, h - m],
    ];
    corners.forEach(([x0, y0], c) => {
      const [x1, y1] = corners[(c + 1) % 4];
      for (let i = 0; i < 12; i++) {
        const k = i / 12;
        const x = lerp(x0, x1, k) + (r() - 0.5) * 3.5;
        const y = lerp(y0, y1, k) + (r() - 0.5) * 3.5;
        if (c === 0 && i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = RED;
    ctx.fill();

    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.lineWidth = 9;
    const path = (pts) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    // A worn inner border.
    path([[34, 120], [34, 34], [140, 34]]);
    path([[170, 34], [222, 34], [222, 222], [130, 222]]);
    path([[100, 222], [34, 222], [34, 150]]);
    ctx.lineWidth = 13;
    // Abstract mark: two stacked meanders and a bar. Not a character.
    path([[64, 64], [118, 64], [118, 104], [64, 104], [64, 146], [118, 146]]);
    path([[146, 64], [194, 64], [194, 190]]);
    path([[146, 104], [170, 104], [170, 192]]);
    path([[64, 180], [124, 180]]);
    ctx.fillStyle = "#000";
    for (let i = 0; i < 320; i++) {
      ctx.globalAlpha = 0.15 + r() * 0.65;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 0.5 + r() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) {
      const x = r() * w;
      const y = r() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + r() * 50);
      g.addColorStop(0, "rgba(0,0,0,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
  });

// ── Scene ──────────────────────────────────────────────────────────────────

export const createReigandoInkScene = (stage) => {
  const { scene, camera, pointer, staticMode } = stage;
  scene.background = new THREE.Color("#efe6d1");
  scene.environment = null;
  scene.fog = null;

  const textures = [];
  const keep = (t) => (textures.push(t), t);

  const page = new THREE.Group();
  scene.add(page);

  // Rice paper, procedural so it holds up when the camera pushes in: pulp
  // clouds, fibres, bark specks, light from the upper left, a soft falloff.
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 7),
    new THREE.ShaderMaterial({
      uniforms: { uPaper: { value: new THREE.Color("#efe6d1") } },
      vertexShader: /* glsl */ `
        varying vec2 vP;
        void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uPaper;
        varying vec2 vP;
        ${NOISE}
        void main() {
          vec2 p = vP;
          float pulp = fbm4(p * 3.0 + 1.7);
          float fib = fibre(p * 0.5);
          float speck = step(0.9993, hash12(floor(p * 260.0)));
          float shade = 0.955 + 0.06 * pulp + 0.035 * (fib - 0.5);
          shade += 0.018 * (p.y - p.x) * 0.5;
          shade *= 1.0 - 0.1 * smoothstep(1.1, 2.6, length(p - vec2(0.0, 0.07)));
          vec3 col = uPaper * shade;
          col = mix(col, col * vec3(0.55, 0.47, 0.38), speck * 0.6);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
    }),
  );
  paper.renderOrder = 0;
  page.add(paper);

  // The ink.
  let order = 10;
  const makeStroke = (d, parent, i) => {
    const { geometry, curve, L } = buildRibbon(d);
    const material = strokeMaterial(d, L, i * 3.17 + 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.0006;
    mesh.renderOrder = order++;
    mesh.frustumCulled = false;
    parent.add(mesh);
    return { ...d, curve, L, material };
  };
  const strokes = STATIC_STROKES.map((d, i) => makeStroke(d, page, i));
  const glyphStrokes = writing().map((d, i) => makeStroke(d, page, 300 + i));
  strokes.push(...glyphStrokes);

  // His writing arm: shoulder → elbow → wrist, the hand and brush at the tip.
  const joint = () => {
    const g = new THREE.Group();
    page.add(g);
    return g;
  };
  const upperArm = joint();
  const foreArm = joint();
  const drape = joint();
  const hand = joint();
  let a = 500;
  for (const [g, list] of [
    [upperArm, ARM.upper],
    [foreArm, ARM.fore],
    [drape, ARM.drape],
    [hand, ARM.hand],
  ]) {
    for (const d of list) strokes.push(makeStroke(d, g, a++));
  }

  // The lamp: one small amber flame, and the warmth it puts on the paper.
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.ShaderMaterial({
      uniforms: { uAmount: { value: 0 }, uWarm: { value: new THREE.Vector3(1.0, 0.86, 0.66) } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uAmount;
        uniform vec3 uWarm;
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float k = pow(1.0 - smoothstep(0.0, 1.0, r), 2.0) * uAmount;
          gl_FragColor = vec4(pow(mix(vec3(1.0), uWarm, k), vec3(2.2)), 1.0);
        }
      `,
      ...MULTIPLY,
    }),
  );
  halo.position.set(LAMP.x, LAMP.y + 0.02, 0.0009);
  halo.renderOrder = 900;
  page.add(halo);

  const flame = new THREE.Group();
  flame.position.set(LAMP.x, LAMP.y, 0.0012);
  page.add(flame);
  const flameMat = new THREE.MeshBasicMaterial({ color: "#e0953a", transparent: true, depthWrite: false, fog: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: "#f2c46e", transparent: true, depthWrite: false, fog: false });
  const outer = new THREE.Mesh(new THREE.CircleGeometry(1, 24), flameMat);
  outer.scale.set(0.0055, 0.011, 1);
  outer.position.y = 0.004;
  const core = new THREE.Mesh(new THREE.CircleGeometry(1, 20), coreMat);
  core.scale.set(0.0026, 0.0055, 1);
  core.position.set(0, 0.0015, 0.0001);
  outer.renderOrder = 950;
  core.renderOrder = 951;
  flame.add(outer, core);

  // The seal.
  const sealTex = keep(sealTexture());
  const sealMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: sealTex }, uAmount: { value: 0 }, uFade: { value: 1 }, uOrigin: { value: new THREE.Vector2(SEAL.x, SEAL.y) } },
    vertexShader: /* glsl */ `
      uniform vec2 uOrigin;
      varying vec2 vUv;
      varying vec2 vP;
      void main() { vUv = uv; vP = position.xy + uOrigin; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uAmount, uFade;
      varying vec2 vUv;
      varying vec2 vP;
      ${NOISE}
      void main() {
        vec4 s = texture2D(uMap, vUv);
        float cov = s.a * uAmount * dissolve(vP, uFade);
        gl_FragColor = vec4(mix(vec3(1.0), s.rgb, cov), 1.0);
      }
    `,
    ...MULTIPLY,
  });
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(SEAL.size, SEAL.size), sealMat);
  seal.position.set(SEAL.x, SEAL.y, 0.0008);
  seal.rotation.z = -0.03;
  seal.renderOrder = 800;
  page.add(seal);

  // ── Choreography ─────────────────────────────────────────────────────────

  // The brush tip rides each glyph stroke; between strokes it lifts and travels.
  const events = glyphStrokes.slice().sort((p, q) => p.t0 - q.t0);
  const v3 = new THREE.Vector3();
  const tip = new THREE.Vector2();
  const from = new THREE.Vector2();
  const to = new THREE.Vector2();
  const endOf = (ev, out) => (ev.curve.getPointAt(1, v3), out.set(v3.x, v3.y));
  const startOf = (ev, out) => (ev.curve.getPointAt(0, v3), out.set(v3.x, v3.y));
  const travel = (out, a0, b0, s, lift) => {
    const e = easeInOutCubic(s);
    out.lerpVectors(a0, b0, e);
    out.y += Math.sin(Math.PI * e) * lift;
  };
  const tipAt = (t, out) => {
    const first = events[0];
    const last = events[events.length - 1];
    if (t <= first.t0) {
      startOf(first, to);
      return travel(out, REST_TIP, to, segment(t, first.t0 - 0.5, first.t0), 0.02);
    }
    if (t >= last.t1) {
      endOf(last, from);
      return travel(out, from, REST_TIP, segment(t, last.t1 + 0.1, last.t1 + 0.8), 0.02);
    }
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (t < ev.t0) {
        endOf(events[i - 1], from);
        startOf(ev, to);
        return travel(out, from, to, segment(t, events[i - 1].t1, ev.t0), 0.004);
      }
      if (t <= ev.t1) {
        ev.curve.getPointAt(strokeEase(segment(t, ev.t0, ev.t1)), v3);
        return out.set(v3.x, v3.y);
      }
    }
    return out;
  };

  // Two-bone IK: the elbow drops below the shoulder–wrist line.
  const wrist = new THREE.Vector2();
  const elbow = new THREE.Vector2();
  const placeArm = (t) => {
    tipAt(t, tip);
    wrist.copy(tip).add(WRIST);
    const dx = wrist.x - SHOULDER.x;
    const dy = wrist.y - SHOULDER.y;
    const d = THREE.MathUtils.clamp(Math.hypot(dx, dy), Math.abs(UPPER - FORE) + 1e-3, UPPER + FORE - 1e-4);
    const theta = Math.atan2(dy, dx);
    const alpha = Math.acos(THREE.MathUtils.clamp((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d), -1, 1));
    const shoulderAngle = theta - alpha;
    elbow.set(SHOULDER.x + Math.cos(shoulderAngle) * UPPER, SHOULDER.y + Math.sin(shoulderAngle) * UPPER);
    upperArm.position.set(SHOULDER.x, SHOULDER.y, 0);
    upperArm.rotation.z = shoulderAngle;
    // The forearm reaches for the wrist (if out of reach, the brush still lands).
    foreArm.position.set(elbow.x, elbow.y, 0);
    foreArm.rotation.z = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
    drape.position.set(elbow.x, elbow.y, 0);
    hand.position.set(tip.x, tip.y, 0);
  };

  // Camera: frontal on the sheet, solved per aspect to frame a box.
  const fov = () => THREE.MathUtils.degToRad(camera.fov);
  const distFor = (box, aspect) => {
    const hh = (box.y1 - box.y0) / 2 / 0.9;
    const hw = (box.x1 - box.x0) / 2 / (0.92 * aspect);
    return Math.max(hh, hw) / Math.tan(fov() / 2);
  };
  const target = new THREE.Vector3();
  const placeCamera = (t, time) => {
    const aspect = stage.size.aspect || 1.1;
    const wideD = distFor(WIDE, aspect);
    // Never push in further than twice the wide framing.
    const closeD = Math.max(distFor(CLOSE, aspect), wideD * 0.48);
    const k = easeInOutCubic(segment(t, 5.0, 6.6)) * (1 - easeInOutCubic(segment(t, 9.0, 10.6)));
    const settle = 1.05 - 0.05 * easeOutCubic(segment(t, 0, 5));
    const dist = lerp(wideD * settle, closeD, k);
    const cx = lerp((WIDE.x0 + WIDE.x1) / 2, (CLOSE.x0 + CLOSE.x1) / 2, k);
    const cy = lerp((WIDE.y0 + WIDE.y1) / 2, (CLOSE.y0 + CLOSE.y1) / 2, k);
    const drift = staticMode ? 0 : 1;
    const dx = drift * (0.006 * Math.sin(time * 0.21) + pointer.x * 0.012) * dist;
    const dy = drift * (0.004 * Math.sin(time * 0.17 + 1.3) + pointer.y * 0.008) * dist;
    target.set(cx + dx * 0.4, cy + dy * 0.4, 0);
    camera.position.set(cx + dx, cy + dy, dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  };

  const update = (time) => {
    const t = staticMode ? STATIC_TIME : time % CYCLE;
    const fade = 1 - smoothstep(segment(t, FADE[0], FADE[1]));
    for (const s of strokes) {
      const u = s.material.uniforms;
      const p = strokeEase(segment(t, s.t0, s.t1));
      u.uProgress.value = t >= s.t0 ? Math.max(p, 1e-4) : 0;
      u.uFrontW.value = Math.max(MIN_W, profile(s.w, p));
      u.uAge.value = t - s.t0;
      u.uFade.value = fade;
    }
    // The seal: pressed down in a beat, a hair larger as it lands.
    const press = segment(t, SEAL.hit, SEAL.hit + 0.1);
    sealMat.uniforms.uAmount.value = press;
    sealMat.uniforms.uFade.value = fade;
    seal.scale.setScalar(1 + 0.05 * (1 - easeOutCubic(segment(t, SEAL.hit, SEAL.hit + 0.35))));

    // The flame, lit once the lamp is drawn, flickering, gone with the ink.
    const lit = smoothstep(segment(t, FLAME_ON, FLAME_ON + 0.4)) * (1 - smoothstep(segment(t, FADE[0], FADE[0] + 0.8)));
    const tt = staticMode ? 0 : time;
    const flick = 1 + 0.08 * Math.sin(tt * 13.1) + 0.05 * Math.sin(tt * 7.3 + 1.1) + 0.04 * Math.sin(tt * 23.7);
    flame.visible = lit > 0.001;
    flame.scale.set(lit * (1 + (flick - 1) * 0.5), lit * flick, 1);
    flame.rotation.z = staticMode ? 0 : 0.06 * Math.sin(tt * 3.1) + 0.03 * Math.sin(tt * 8.9);
    flameMat.opacity = coreMat.opacity = Math.min(1, lit * 1.2);
    halo.material.uniforms.uAmount.value = 0.4 * lit * (0.9 + 0.1 * flick);

    placeArm(t);
    placeCamera(t, staticMode ? STATIC_TIME : time);
  };

  return {
    update,
    setProps() {},
    dispose() {
      for (const tex of textures) {
        tex.dispose();
        if (tex.image) tex.image.width = tex.image.height = 0;
      }
    },
  };
};
