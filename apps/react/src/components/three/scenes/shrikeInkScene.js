import * as THREE from "three";
import { canvasTexture, clamp01, easeInCubic, easeInOutCubic, easeOutCubic, lerp, segment, smoothstep } from "../kit";
import { RED } from "../ink";

/**
 * Musashi's brush, behind "Pick up a second Way": a rotation of four of his
 * own ink paintings, each brushed live on the same sheet of rice paper.
 *
 *   1. Shrike on a Withered Branch (Koboku Meikaku-zu): one long withered
 *      branch over a pale wash, a knot, two twigs, the caterpillar inching up
 *      it, and the shrike at the tip watching it.
 *   2. Cormorant (U-zu): the bird upright on a rock, a wet black body and wing,
 *      the S of the neck, the hooked beak, the rock in pale wash and dry brush.
 *   3. Hotei Watching a Cockfight (Hotei Tōkei-zu): round-bellied Hotei with
 *      his staff, looking down at two roosters squaring off at his feet.
 *   4. Wild Geese among Reeds (Rogan-zu, one panel of the screens): reeds
 *      leaning over the shore, a goose resting at the water's edge, another
 *      flying in above.
 *
 * Each painting runs on the same beat (7-8 s): the brush leaves the
 * ink stone, lays the strokes down, goes to rest; the soapstone seal stamps
 * the corner; a short hold; the ink sinks back into the paper while the brush
 * goes back to the stone and reloads, and the next painting starts on clean
 * paper. After the geese it loops to the shrike.
 *
 * Each stroke is a ribbon mesh whose shader is the ink: a round wet front that
 * follows the brush, a pool where the brush touched down, hair streaks that
 * break into dry brush (kasure) as the load runs out, and a grey capillary
 * bleed that keeps creeping along the paper fibres for a second after the
 * brush has passed. Strokes multiply onto the paper, so overlaps darken the
 * way layered ink does. Paper is unlit, so paper stays paper.
 *
 * Reduced motion holds the finished, sealed shrike with the brush at rest.
 */

const W = 1.5; // sheet, in world units (about 70 cm)
const H = 2.1;
const SURFACE = 0.0026; // paper top, world y
const MIN_W = 0.0009;
const CAP = 5;
const SEAL_SIZE = 0.13;

// Beat, per painting. Strokes are laid back to back; E is the end
// of the last one, and everything after it is timed from E.
// The ink stone, roughly, in paper space: the first stroke waits on the brush
// travelling over from it.
const STONE = [1.33, 0.84];
const TAIL = {
  rest: 0.55, // brush back at rest
  enter: 0.05, // seal stone comes in
  down: 0.45,
  hit: 0.62, // seal touches paper
  up: 0.74,
  away: 0.88,
  gone: 1.35,
  leave: 1.6, // brush leaves its rest for the ink stone
  fade: [1.5, 2.3], // the ink sinks back into the paper
  dip: [2.3, 2.7], // reload; the next painting starts as it lifts
};

/** Maps a drawing made around its own origin onto the sheet. */
const place = (ox, oy, s) => ({
  p: (pts) => pts.map(([x, y]) => [ox + x * s, oy + y * s]),
  w: (keys) => keys.map(([u, w]) => [u, w * s]),
});

/** Points along a circular arc (radians, counter-clockwise from +x). */
const arc = (cx, cy, r, a0, a1, n = 9) => Array.from({ length: n }, (_, i) => {
  const a = lerp(a0, a1, i / (n - 1));
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});

const dot = (x, y, r = 0.006, extra = {}) => ({ pts: [[x, y], [x + 0.002, y + 0.004]], w: [[0, r], [1, r * 0.9]], tone: 0.95, wet: 0.8, pool: 0.4, d: 0.07, ...extra });

/*
 * Strokes in paper space (x right, y up, origin at the sheet's centre).
 * w: half-width keys along the stroke. tone: ink value. wet: capillary bleed.
 * dry/dryStart: where the brush runs out into streaks. pool: ink pooled at the
 * touch-down. side: one edge of the brush loaded darker (wash strokes).
 * d: seconds on the paper (default from the stroke's length).
 */

// 1. Shrike on a Withered Branch. The shrike is drawn facing left around its
// feet and scaled up onto the branch tip.
const SH = place(0.03, 0.69, 1.875);
const SHRIKE = [
  // The branch: a pale wash laid top-down, then one long dark stroke up over
  // it, heavy at the base, bowing gently, thinning and breaking into dry brush.
  { pts: [[0.042, 0.06], [0.064, -0.25], [0.094, -0.6], [0.122, -0.95]], w: [[0, 0.012], [0.5, 0.026], [1, 0.032]], tone: 0.3, wet: 1, pool: 0.1, side: -0.5, rim: 0.6, d: 0.5 },
  { pts: [[0.14, -0.97], [0.112, -0.62], [0.08, -0.25], [0.052, 0.1], [0.03, 0.42], [0.022, 0.6], [0.035, 0.72]], w: [[0, 0.028], [0.05, 0.022], [0.3, 0.017], [0.6, 0.011], [0.85, 0.0075], [1, 0.003]], tone: 0.95, wet: 0.5, dry: 0.6, dryStart: 0.35, pool: 1, side: 0.35, d: 0.95 },
  // Two twigs, the caterpillar the shrike is watching, a moss dot, the knot.
  { pts: [[0.036, 0.33], [0.09, 0.4], [0.17, 0.46], [0.21, 0.474]], w: [[0, 0.0085], [0.3, 0.007], [1, 0.002]], tone: 0.9, wet: 0.35, dry: 0.75, dryStart: 0.3, pool: 0.6 },
  dot(0.01, 0.42, 0.0055),
  { pts: [[0.064, 0.13], [0.066, 0.166]], w: [[0, 0.005], [0.5, 0.0058], [1, 0.0042]], tone: 0.7, wet: 0.9, pool: 0.5, d: 0.1 },
  { pts: [[0.08, -0.25], [0.028, -0.18], [-0.045, -0.145]], w: [[0, 0.007], [1, 0.0017]], tone: 0.8, wet: 0.4, dry: 0.6, dryStart: 0.35, pool: 0.5 },
  { pts: [[0.098, -0.47], [0.122, -0.445], [0.15, -0.43]], w: [[0, 0.011], [1, 0.0035]], tone: 0.95, wet: 0.6, dry: 0.3, dryStart: 0.5, pool: 1.2 },
  dot(0.152, -0.72, 0.0065),
  // The shrike: a wet grey body, the head, a darker wing over it, the black
  // mask through the eye, the hooked beak, a long tail, feet on the branch.
  { pts: SH.p([[-0.015, 0.095], [0.005, 0.07], [0.025, 0.04], [0.035, 0.015]]), w: SH.w([[0, 0.022], [0.3, 0.033], [0.7, 0.029], [1, 0.012]]), tone: 0.42, wet: 0.9, dry: 0.1, dryStart: 0.7, pool: 0.3, side: 0.8, rim: 1, d: 0.3 },
  { pts: SH.p([[-0.031, 0.116], [-0.013, 0.12]]), w: SH.w([[0, 0.019], [1, 0.018]]), tone: 0.72, wet: 0.8, pool: 0.2, side: 0.6, rim: 0.8, d: 0.12 },
  { pts: SH.p([[-0.005, 0.105], [0.02, 0.08], [0.04, 0.05], [0.05, 0.03]]), w: SH.w([[0, 0.009], [0.4, 0.015], [1, 0.006]]), tone: 0.88, wet: 0.5, dry: 0.45, dryStart: 0.5, side: 0.5, d: 0.2 },
  { pts: SH.p([[-0.05, 0.118], [-0.03, 0.111], [-0.01, 0.116]]), w: SH.w([[0, 0.0055], [0.4, 0.0085], [1, 0.0045]]), tone: 1, wet: 0.35, pool: 0.9, d: 0.12 },
  { pts: SH.p([[-0.048, 0.118], [-0.062, 0.115], [-0.068, 0.109]]), w: SH.w([[0, 0.0034], [1, 0.0008]]), tone: 1, wet: 0.2, pool: 0.3, d: 0.07 },
  { pts: SH.p([[0.04, 0.035], [0.07, -0.01], [0.1, -0.07], [0.12, -0.112]]), w: SH.w([[0, 0.012], [0.3, 0.0105], [0.85, 0.007], [1, 0.0045]]), tone: 0.95, wet: 0.35, dry: 0.5, dryStart: 0.55, pool: 0.5, d: 0.22 },
  { pts: SH.p([[-0.005, 0.03], [-0.006, 0.0]]), w: SH.w([[0, 0.0024], [1, 0.0014]]), tone: 1, wet: 0.3, pool: 0.2, d: 0.07 },
  { pts: SH.p([[0.008, 0.028], [0.01, 0.0]]), w: SH.w([[0, 0.0024], [1, 0.0014]]), tone: 1, wet: 0.3, pool: 0.2, d: 0.07 },
];

// 2. Cormorant: drawn around its feet on the rock, facing left.
const CO = place(0.0, -0.23, 1.1);
const CORMORANT = [
  // Body: a broad wet grey stroke, then the black wing laid wet over it.
  { pts: CO.p([[-0.04, 0.36], [-0.02, 0.24], [0.03, 0.12], [0.07, 0.03]]), w: CO.w([[0, 0.05], [0.35, 0.085], [0.75, 0.07], [1, 0.03]]), tone: 0.6, wet: 1, dry: 0.15, dryStart: 0.8, pool: 0.4, side: 0.7, rim: 1, d: 0.32 },
  { pts: CO.p([[0.0, 0.31], [0.045, 0.2], [0.08, 0.09], [0.12, -0.02]]), w: CO.w([[0, 0.03], [0.4, 0.05], [1, 0.012]]), tone: 1, wet: 0.7, dry: 0.45, dryStart: 0.55, pool: 0.8, side: 0.5, d: 0.28 },
  // The S of the neck, the head, the long hooked beak.
  { pts: CO.p([[-0.035, 0.35], [-0.06, 0.42], [-0.045, 0.49], [-0.06, 0.55], [-0.075, 0.58]]), w: CO.w([[0, 0.04], [0.5, 0.026], [1, 0.022]]), tone: 0.95, wet: 0.6, pool: 0.5, d: 0.24 },
  { pts: CO.p([[-0.06, 0.585], [-0.085, 0.597], [-0.115, 0.594]]), w: CO.w([[0, 0.03], [0.6, 0.028], [1, 0.016]]), tone: 1, wet: 0.5, pool: 0.6, d: 0.1 },
  { pts: CO.p([[-0.12, 0.594], [-0.165, 0.59], [-0.205, 0.585], [-0.215, 0.572]]), w: CO.w([[0, 0.0075], [0.8, 0.0032], [1, 0.0013]]), tone: 1, wet: 0.2, pool: 0.3, d: 0.12 },
  // The stiff tail propped on the rock, the legs, the webbed toes.
  { pts: CO.p([[0.07, 0.03], [0.1, -0.04], [0.135, -0.13]]), w: CO.w([[0, 0.02], [0.5, 0.016], [1, 0.004]]), tone: 1, wet: 0.4, dry: 0.6, dryStart: 0.4, pool: 0.5, d: 0.14 },
  { pts: CO.p([[0.035, 0.01], [0.03, -0.045]]), w: CO.w([[0, 0.0045], [1, 0.0028]]), tone: 1, wet: 0.3, pool: 0.3, d: 0.07 },
  { pts: CO.p([[0.0, 0.02], [-0.008, -0.04]]), w: CO.w([[0, 0.0045], [1, 0.0028]]), tone: 1, wet: 0.3, pool: 0.3, d: 0.07 },
  { pts: CO.p([[-0.045, -0.05], [0.0, -0.05], [0.05, -0.055]]), w: CO.w([[0, 0.004], [1, 0.002]]), tone: 1, wet: 0.3, pool: 0.3, d: 0.09 },
  // The rock: dry-brush contour, a pale wash under it, the far side, the foot, moss.
  { pts: CO.p([[-0.32, -0.17], [-0.24, -0.07], [-0.06, -0.045], [0.12, -0.06], [0.26, -0.11]]), w: CO.w([[0, 0.013], [0.5, 0.009], [1, 0.004]]), tone: 0.95, wet: 0.4, dry: 0.7, dryStart: 0.3, pool: 0.8, d: 0.3 },
  { pts: CO.p([[0.26, -0.11], [0.33, -0.2], [0.35, -0.29]]), w: CO.w([[0, 0.011], [1, 0.004]]), tone: 0.85, wet: 0.3, dry: 0.8, dryStart: 0.2, pool: 0.5, d: 0.13 },
  { pts: CO.p([[0.3, -0.17], [0.15, -0.11], [-0.08, -0.09], [-0.3, -0.12]]), w: CO.w([[0, 0.04], [0.5, 0.07], [1, 0.05]]), tone: 0.3, wet: 1, dry: 0.3, dryStart: 0.6, pool: 0.2, side: 0.6, rim: 0.6, d: 0.34 },
  { pts: CO.p([[-0.36, -0.27], [-0.1, -0.25], [0.2, -0.28]]), w: CO.w([[0, 0.008], [1, 0.003]]), tone: 0.5, wet: 0.5, dry: 0.8, dryStart: 0.2, pool: 0.3, d: 0.2 },
  dot(...CO.p([[-0.16, -0.06]])[0], 0.007),
  dot(...CO.p([[0.18, -0.075]])[0], 0.006),
];

// 3. Hotei Watching a Cockfight: Hotei above, leaning on his staff and looking
// down to the right, the two roosters at his feet.
const HOTEI = [
  // Head: a bald dome in one turn of the brush, the long earlobe, the eyes
  // looking down at the birds, the smile.
  { pts: arc(-0.1, 0.52, 0.08, -0.75, 3.75, 11), w: [[0, 0.0065], [0.5, 0.0078], [1, 0.004]], tone: 0.85, wet: 0.4, dry: 0.25, dryStart: 0.7, pool: 0.5, d: 0.26 },
  { pts: [[-0.168, 0.53], [-0.176, 0.5], [-0.166, 0.478]], w: [[0, 0.005], [1, 0.0035]], tone: 0.8, wet: 0.4, pool: 0.4, d: 0.08 },
  { pts: [[-0.108, 0.512], [-0.088, 0.506]], w: [[0, 0.0038], [1, 0.0026]], tone: 1, wet: 0.3, pool: 0.4, d: 0.07 },
  { pts: [[-0.062, 0.502], [-0.044, 0.496]], w: [[0, 0.0038], [1, 0.0026]], tone: 1, wet: 0.3, pool: 0.4, d: 0.07 },
  { pts: [[-0.092, 0.474], [-0.074, 0.465], [-0.056, 0.47]], w: [[0, 0.003], [1, 0.0022]], tone: 0.9, wet: 0.3, pool: 0.3, d: 0.07 },
  // The robe: its back in one firm line with pale shade inside it, the open
  // front falling to the bare round belly, the navel.
  { pts: [[-0.16, 0.45], [-0.235, 0.31], [-0.27, 0.08], [-0.255, -0.13]], w: [[0, 0.012], [0.4, 0.016], [1, 0.007]], tone: 0.85, wet: 0.4, dry: 0.5, dryStart: 0.5, pool: 0.8, d: 0.26 },
  { pts: [[-0.17, 0.38], [-0.21, 0.24], [-0.22, 0.05], [-0.2, -0.1]], w: [[0, 0.025], [0.5, 0.045], [1, 0.03]], tone: 0.28, wet: 1, dry: 0.3, dryStart: 0.6, pool: 0.2, side: -0.7, rim: 0.5, d: 0.28 },
  { pts: [[-0.06, 0.44], [-0.04, 0.34], [0.04, 0.29], [0.12, 0.22], [0.155, 0.12], [0.13, 0.01], [0.04, -0.06]], w: [[0, 0.008], [0.5, 0.01], [1, 0.004]], tone: 0.75, wet: 0.4, dry: 0.3, dryStart: 0.7, pool: 0.5, d: 0.3 },
  dot(0.075, 0.12, 0.005, { tone: 0.8 }),
  // The sleeve reaching across to the staff, the hand on it, the staff
  // planted, the hem, the feet.
  { pts: [[-0.13, 0.37], [-0.22, 0.31], [-0.31, 0.25]], w: [[0, 0.022], [0.6, 0.028], [1, 0.016]], tone: 0.5, wet: 0.9, dry: 0.3, dryStart: 0.6, pool: 0.4, side: 0.6, rim: 0.8, d: 0.16 },
  { pts: [[-0.33, 0.66], [-0.345, 0.3], [-0.36, -0.05], [-0.375, -0.22]], w: [[0, 0.0075], [0.6, 0.0065], [1, 0.004]], tone: 1, wet: 0.3, dry: 0.55, dryStart: 0.4, pool: 1, d: 0.32 },
  { pts: [[-0.325, 0.27], [-0.335, 0.24]], w: [[0, 0.013], [1, 0.011]], tone: 0.75, wet: 0.5, pool: 0.4, d: 0.07 },
  { pts: [[-0.255, -0.13], [-0.1, -0.1], [0.04, -0.07]], w: [[0, 0.01], [1, 0.006]], tone: 0.8, wet: 0.4, dry: 0.5, dryStart: 0.5, pool: 0.5, d: 0.14 },
  { pts: [[-0.17, -0.15], [-0.115, -0.17]], w: [[0, 0.009], [1, 0.006]], tone: 0.9, wet: 0.4, pool: 0.6, d: 0.07 },
  { pts: [[-0.03, -0.12], [0.03, -0.14]], w: [[0, 0.009], [1, 0.006]], tone: 0.9, wet: 0.4, pool: 0.6, d: 0.07 },
  // The left rooster, dark, crouched with its hackles up, facing right.
  { pts: [[-0.34, -0.6], [-0.26, -0.64], [-0.17, -0.63], [-0.11, -0.585]], w: [[0, 0.03], [0.45, 0.05], [1, 0.025]], tone: 0.85, wet: 1, dry: 0.2, dryStart: 0.7, pool: 0.4, side: 0.6, rim: 0.8, d: 0.2 },
  { pts: [[-0.12, -0.59], [-0.085, -0.545], [-0.06, -0.53]], w: [[0, 0.024], [0.6, 0.016], [1, 0.012]], tone: 1, wet: 0.6, pool: 0.6, d: 0.1 },
  { pts: [[-0.085, -0.513], [-0.064, -0.506]], w: [[0, 0.0075], [1, 0.006]], tone: 0.9, wet: 0.5, pool: 0.4, d: 0.07 },
  { pts: [[-0.055, -0.532], [-0.03, -0.54]], w: [[0, 0.0045], [1, 0.0012]], tone: 1, wet: 0.2, pool: 0.3, d: 0.07 },
  { pts: [[-0.33, -0.59], [-0.38, -0.5], [-0.44, -0.47], [-0.47, -0.52]], w: [[0, 0.014], [0.5, 0.01], [1, 0.003]], tone: 1, wet: 0.4, dry: 0.6, dryStart: 0.4, pool: 0.5, d: 0.15 },
  { pts: [[-0.22, -0.665], [-0.2, -0.72], [-0.18, -0.75]], w: [[0, 0.0045], [1, 0.003]], tone: 1, wet: 0.3, pool: 0.3, d: 0.08 },
  { pts: [[-0.17, -0.66], [-0.14, -0.71], [-0.12, -0.74]], w: [[0, 0.0045], [1, 0.003]], tone: 1, wet: 0.3, pool: 0.3, d: 0.08 },
  // The right rooster, paler, leaping at it with its wing up and feet forward.
  { pts: [[0.3, -0.53], [0.23, -0.57], [0.15, -0.57], [0.1, -0.54]], w: [[0, 0.03], [0.45, 0.05], [1, 0.025]], tone: 0.6, wet: 1, dry: 0.2, dryStart: 0.7, pool: 0.4, side: -0.6, rim: 1, d: 0.2 },
  { pts: [[0.11, -0.545], [0.075, -0.5], [0.05, -0.49]], w: [[0, 0.024], [0.6, 0.016], [1, 0.012]], tone: 1, wet: 0.6, pool: 0.6, d: 0.1 },
  { pts: [[0.075, -0.473], [0.054, -0.466]], w: [[0, 0.0075], [1, 0.006]], tone: 0.9, wet: 0.5, pool: 0.4, d: 0.07 },
  { pts: [[0.045, -0.492], [0.02, -0.5]], w: [[0, 0.0045], [1, 0.0012]], tone: 1, wet: 0.2, pool: 0.3, d: 0.07 },
  { pts: [[0.22, -0.52], [0.25, -0.43], [0.3, -0.36], [0.34, -0.34]], w: [[0, 0.022], [0.5, 0.016], [1, 0.003]], tone: 0.95, wet: 0.5, dry: 0.6, dryStart: 0.4, pool: 0.6, d: 0.15 },
  { pts: [[0.3, -0.53], [0.38, -0.47], [0.43, -0.5], [0.44, -0.57]], w: [[0, 0.013], [0.5, 0.009], [1, 0.003]], tone: 1, wet: 0.4, dry: 0.6, dryStart: 0.4, pool: 0.5, d: 0.15 },
  { pts: [[0.17, -0.6], [0.13, -0.66], [0.1, -0.68]], w: [[0, 0.0045], [1, 0.003]], tone: 1, wet: 0.3, pool: 0.3, d: 0.08 },
  { pts: [[0.22, -0.595], [0.22, -0.66], [0.24, -0.7]], w: [[0, 0.0045], [1, 0.003]], tone: 1, wet: 0.3, pool: 0.3, d: 0.08 },
];

// 4. Wild Geese among Reeds: reeds rising from the lower left, a goose resting
// on the shore, one flying in above.
const LEAF = [[0, 0.004], [0.3, 0.014], [1, 0.0015]];
const ROGAN = [
  // Reeds: two stems, the long blades arching off them, a seed plume.
  { pts: [[-0.32, -0.78], [-0.3, -0.4], [-0.26, 0.0], [-0.2, 0.38]], w: [[0, 0.009], [0.6, 0.007], [1, 0.0025]], tone: 0.85, wet: 0.3, dry: 0.5, dryStart: 0.5, pool: 0.6, d: 0.36 },
  { pts: [[-0.2, 0.38], [-0.17, 0.44], [-0.13, 0.46], [-0.1, 0.43]], w: [[0, 0.006], [0.3, 0.012], [1, 0.003]], tone: 0.6, wet: 0.5, dry: 0.85, dryStart: 0.1, pool: 0.3, d: 0.12 },
  { pts: [[-0.235, 0.18], [-0.13, 0.32], [-0.05, 0.36], [0.0, 0.33]], w: LEAF, tone: 0.85, wet: 0.3, dry: 0.4, dryStart: 0.6, pool: 0.3, d: 0.18 },
  { pts: [[-0.26, 0.0], [-0.36, 0.18], [-0.42, 0.34], [-0.43, 0.42]], w: LEAF, tone: 0.75, wet: 0.3, dry: 0.4, dryStart: 0.6, pool: 0.3, d: 0.18 },
  { pts: [[-0.3, -0.32], [-0.18, -0.18], [-0.06, -0.12], [0.03, -0.16]], w: LEAF, tone: 0.9, wet: 0.3, dry: 0.4, dryStart: 0.6, pool: 0.3, d: 0.18 },
  { pts: [[-0.36, -0.78], [-0.37, -0.45], [-0.4, -0.15], [-0.44, 0.12]], w: [[0, 0.008], [0.6, 0.006], [1, 0.0022]], tone: 0.55, wet: 0.4, dry: 0.5, dryStart: 0.5, pool: 0.4, d: 0.28 },
  { pts: [[-0.37, -0.5], [-0.48, -0.38], [-0.56, -0.32], [-0.6, -0.35]], w: LEAF, tone: 0.55, wet: 0.4, dry: 0.4, dryStart: 0.6, pool: 0.3, d: 0.16 },
  { pts: [[-0.34, -0.7], [-0.24, -0.62], [-0.18, -0.63]], w: LEAF, tone: 0.9, wet: 0.3, dry: 0.3, dryStart: 0.6, pool: 0.3, d: 0.12 },
  // The resting goose: grey body, dark folded wing, the neck, head and beak, tail.
  { pts: [[0.0, -0.6], [0.08, -0.63], [0.2, -0.635], [0.3, -0.6]], w: [[0, 0.03], [0.6, 0.055], [1, 0.025]], tone: 0.5, wet: 1, pool: 0.3, side: 0.7, rim: 1, d: 0.26 },
  { pts: [[0.09, -0.605], [0.18, -0.6], [0.27, -0.585]], w: [[0, 0.012], [0.5, 0.03], [1, 0.012]], tone: 0.95, wet: 0.6, dry: 0.4, dryStart: 0.6, pool: 0.5, side: 0.5, d: 0.16 },
  { pts: [[0.29, -0.6], [0.34, -0.575]], w: [[0, 0.012], [1, 0.003]], tone: 1, wet: 0.4, pool: 0.4, d: 0.08 },
  { pts: [[0.005, -0.6], [-0.025, -0.54], [-0.015, -0.47], [-0.03, -0.43]], w: [[0, 0.02], [1, 0.012]], tone: 0.95, wet: 0.5, pool: 0.5, d: 0.14 },
  { pts: [[-0.025, -0.43], [-0.055, -0.425]], w: [[0, 0.016], [1, 0.012]], tone: 1, wet: 0.5, pool: 0.5, d: 0.07 },
  { pts: [[-0.06, -0.428], [-0.1, -0.44]], w: [[0, 0.006], [1, 0.0015]], tone: 1, wet: 0.2, pool: 0.3, d: 0.07 },
  // The shore under it: a pale dry wash and one thin line.
  { pts: [[0.45, -0.73], [0.15, -0.7], [-0.2, -0.68], [-0.55, -0.7]], w: [[0, 0.012], [0.5, 0.03], [1, 0.02]], tone: 0.25, wet: 1, dry: 0.5, dryStart: 0.5, pool: 0.2, side: -0.5, rim: 0.4, d: 0.34 },
  { pts: [[-0.1, -0.78], [0.25, -0.79]], w: [[0, 0.004], [1, 0.002]], tone: 0.4, wet: 0.4, dry: 0.7, dryStart: 0.2, pool: 0.2, d: 0.14 },
  // The flying goose, wings spread, heading left.
  { pts: [[0.36, 0.44], [0.28, 0.47], [0.21, 0.49]], w: [[0, 0.012], [0.5, 0.026], [1, 0.015]], tone: 0.6, wet: 0.9, pool: 0.3, side: 0.6, rim: 0.8, d: 0.14 },
  { pts: [[0.29, 0.49], [0.27, 0.6], [0.22, 0.7], [0.17, 0.75]], w: [[0, 0.028], [0.5, 0.02], [1, 0.004]], tone: 0.9, wet: 0.5, dry: 0.6, dryStart: 0.4, pool: 0.5, d: 0.18 },
  { pts: [[0.3, 0.455], [0.34, 0.37], [0.38, 0.33]], w: [[0, 0.02], [1, 0.003]], tone: 0.6, wet: 0.5, dry: 0.6, dryStart: 0.3, pool: 0.4, d: 0.12 },
  { pts: [[0.21, 0.49], [0.14, 0.52], [0.1, 0.53]], w: [[0, 0.012], [0.8, 0.009], [1, 0.011]], tone: 1, wet: 0.5, pool: 0.5, d: 0.1 },
  { pts: [[0.095, 0.532], [0.065, 0.535]], w: [[0, 0.004], [1, 0.001]], tone: 1, wet: 0.2, pool: 0.3, d: 0.07 },
];

const polyLen = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** Lays each painting's strokes back to back, the brush travelling between them, and times the tail. */
const schedule = (paintings) => {
  let start = 0;
  return paintings.map((pt) => {
    const pace = pt.pace ?? 1; // busier paintings are brushed a little quicker
    let t = 0.25 + Math.hypot(pt.strokes[0].pts[0][0] - STONE[0], pt.strokes[0].pts[0][1] - STONE[1]) * 0.24;
    let prev = null;
    const strokes = pt.strokes.map((d) => {
      if (prev) t += (0.04 + Math.hypot(d.pts[0][0] - prev[0], d.pts[0][1] - prev[1]) * 0.22) * pace;
      const dur = (d.d ?? Math.min(1.1, Math.max(0.07, 0.05 + polyLen(d.pts) * 0.4))) * pace;
      const s = { ...d, t0: t, t1: t + dur };
      t += dur;
      prev = d.pts[d.pts.length - 1];
      return s;
    });
    const E = t;
    const seal = { x: pt.seal[0], y: pt.seal[1] };
    for (const k of ["enter", "down", "hit", "up", "away", "gone"]) seal[k] = E + TAIL[k];
    const out = {
      ...pt,
      strokes,
      start,
      end: E,
      rest: E + TAIL.rest,
      leave: E + TAIL.leave,
      fade: TAIL.fade.map((x) => E + x),
      dip: TAIL.dip.map((x) => E + x),
      seal,
      dur: E + TAIL.dip[1],
    };
    start += out.dur;
    return out;
  });
};

const PAINTINGS = schedule([
  { name: "shrike", strokes: SHRIKE, pace: 0.96, seal: [-0.52, -0.86] },
  { name: "cormorant", strokes: CORMORANT, seal: [-0.5, -0.88] },
  { name: "hotei", strokes: HOTEI, pace: 0.76, seal: [0.52, -0.9] },
  { name: "geese", strokes: ROGAN, pace: 0.8, seal: [0.52, -0.9] },
]);
const LOOP = PAINTINGS.reduce((s, p) => s + p.dur, 0);
// The finished shrike, sealed, the seal stone gone, before the ink sinks.
const STATIC_T = PAINTINGS[0].end + 1.42;


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
  // Paper fibres: two crossing sets of long, thin cells, plus pulp.
  float fibre(vec2 p) {
    float f1 = vnoise((mat2(0.8, -0.6, 0.6, 0.8) * p) * vec2(240.0, 30.0));
    float f2 = vnoise((mat2(0.28, 0.96, -0.96, 0.28) * p) * vec2(220.0, 28.0));
    return max(f1, f2) * 0.7 + vnoise(p * 90.0) * 0.3;
  }
  // The painting sinking back into the paper: fibrous patches let go first.
  float dissolve(vec2 p, float fade) {
    float k = 1.0 - fade;
    return smoothstep(k * 1.25 - 0.25, k * 1.25 - 0.05, fbm4(p * 7.0 + 3.1) * 1.06) * (0.55 + 0.45 * fade);
  }
`;

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
      // Sumi, a warm black; mixed in sRGB so wash greys read as greys.
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
        // Distance from the stroke's spine in brush half-widths; round caps at both ends.
        float capD = max(0.0, -vS) + max(0.0, vS - uL);
        float r = length(vec2(vAcross, capD / vW));

        // Reveal: everything behind the brush, plus the round tip at the front.
        float front = uProgress * uL;
        float behind = smoothstep(-0.0015, 0.0015, front - vS);
        float tipD = length(vec2((vS - front) / max(uFrontW, 1e-4), vAcross));
        float reveal = max(behind, 1.0 - smoothstep(0.8, 1.0, tipD));
        if (reveal <= 0.001) discard;

        vec2 p = vP + uSeed;
        float fib = fibre(p);
        float along = clamp(vS / uL, 0.0, 1.0);
        float age = uAge - along * uDur;            // seconds since the brush passed here
        float spread = smoothstep(0.0, 1.5, age);   // the bleed creeps out after it
        float fresh = 1.0 - smoothstep(0.0, 2.5, age);
        float pool = uPool * exp(-max(vS, 0.0) / (vW * 5.0 + 0.004));

        // A ragged edge where the paper takes the ink unevenly.
        float aa = fwidth(r) * 1.2 + 0.02;
        float e = 1.0 + (fbm4(p * 70.0) - 0.47) * 0.42 + (fib - 0.5) * 0.14 + pool * 0.18;
        float core = 1.0 - smoothstep(e - 0.1 - aa, e + aa, r);

        // Hair streaks; as the load runs out they open into dry brush.
        float hairs = fbm2(vec2(vAcross * vW * 110.0, vS * 2.5 + uSeed * 3.0));
        float dry = uDry * smoothstep(uDryStart, 1.0, along) + uDry * 0.3 * smoothstep(0.5, 1.0, abs(vAcross));
        float keep = smoothstep(dry * 1.05 - 0.16, dry * 1.05 + 0.03, hairs + (fib - 0.5) * 0.12);

        // Value: pooled at the start, thinning along, one side loaded darker,
        // a darker rim where a wash dries, wet ink a touch deeper.
        float g = 0.5 + 0.5 * clamp(vAcross * sign(uSide), -1.0, 1.0);
        float dens = uTone * (1.0 - along * 0.2) + pool * 0.3;
        dens *= mix(1.0, 0.4 + 0.85 * g, abs(uSide));
        dens += uRim * 0.2 * smoothstep(0.5, 0.95, r / e);
        dens *= (0.88 + 0.24 * hairs) * (0.9 + 0.2 * fib) * (1.0 + 0.08 * fresh * uWet);

        // Capillary bleed: a grey fringe that follows the fibres out.
        float hw = uWet * spread * (0.0035 + 0.35 * vW) * (0.3 + 1.4 * fib) * (1.0 + pool);
        float beyond = max(0.0, r - e) * vW;
        float halo = pow(1.0 - smoothstep(0.0, hw + 1e-5, beyond), 1.6) * smoothstep(e - 0.15, e, r);
        float haloAmt = uTone * 0.32 * (1.0 - dry * 0.8);

        float cov = max(core * keep * dens, halo * haloAmt) * reveal;
        cov = clamp(cov * dissolve(vP, uFade), 0.0, 1.0);
        gl_FragColor = vec4(pow(mix(vec3(1.0), uInk, cov), vec3(2.2)), 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    // Multiply onto what is below: ink only ever darkens paper.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
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

// ── Textures: all drawn, nothing to fetch ──────────────────────────────────

/** Rice paper: deckled edge, pulp clouds, fibres, a few bark specks, the light falling across it. */
const paperTexture = () =>
  canvasTexture(1024, 1434, (ctx, w, h) => {
    const r = rng(1117);
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    const inset = 7;
    const edge = (x0, y0, x1, y1, nx, ny, first) => {
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 7);
      for (let i = first ? 0 : 1; i <= steps; i++) {
        const k = i / steps;
        const j = inset + (r() - 0.5) * 5 + Math.sin(k * 40 + x0) * 1.2;
        const x = lerp(x0, x1, k) + nx * j;
        const y = lerp(y0, y1, k) + ny * j;
        if (first && i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };
    edge(0, 0, w, 0, 0, 1, true);
    edge(w, 0, w, h, -1, 0);
    edge(w, h, 0, h, 0, -1);
    edge(0, h, 0, 0, 1, 0);
    ctx.closePath();
    ctx.fillStyle = "#efe6d1";
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 80; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 60 + r() * 220;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, r() < 0.5 ? "rgba(255,252,242,0.07)" : "rgba(196,176,136,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 3400; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI * 2;
      const len = 8 + r() * 56;
      const bend = (r() - 0.5) * len * 0.6;
      const light = r() < 0.55;
      ctx.strokeStyle = light ? `rgba(255,251,240,${0.12 + r() * 0.22})` : `rgba(170,150,112,${0.06 + r() * 0.12})`;
      ctx.lineWidth = 0.5 + r() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(92,72,48,${0.15 + r() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 0.6 + r() * 1.6, 0.4 + r() * 0.8, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // The key light comes from the upper left; the far corner falls off a little.
    const light = ctx.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, "rgba(255,253,246,0.10)");
    light.addColorStop(0.55, "rgba(0,0,0,0)");
    light.addColorStop(1, "rgba(90,70,40,0.08)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });

/** Tileable value noise on an integer lattice that wraps at (px, py). */
const hashI = (x, y) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const pnoise = (x, y, px, py) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % px) + px) % px;
  const y0 = ((iy % py) + py) % py;
  const x1 = (x0 + 1) % px;
  const y1 = (y0 + 1) % py;
  return lerp(lerp(hashI(x0, y0), hashI(x1, y0), ux), lerp(hashI(x0, y1), hashI(x1, y1), ux), uy);
};

/** Dark walnut: long irregular grain, warped by slow figure, low contrast. */
const woodTexture = () =>
  canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const r = rng(4242);
      for (let y = 0; y < h; y++) {
        const v = y / h;
        for (let x = 0; x < w; x++) {
          const u = x / w;
          const warp = pnoise(u * 3, v * 3, 3, 3) * 2 + pnoise(u * 7, v * 7, 7, 7) * 0.7;
          const grain = pnoise(u * 4 + pnoise(u * 2, v * 40, 2, 40) * 0.6, v * 90 + warp * 3, 4, 90);
          const fine = pnoise(u * 24, v * 300 + warp * 6, 24, 300);
          const val = 0.5 + (grain - 0.5) * 0.5 + (fine - 0.5) * 0.22 + (warp - 1.35) * 0.06 + (r() - 0.5) * 0.06;
          const i = (y * w + x) * 4;
          img.data[i] = 20 + val * 30;
          img.data[i + 1] = 13 + val * 21;
          img.data[i + 2] = 9 + val * 14;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat: [2, 2] },
  );

/** Bamboo: tan with long fibres, two nodes. */
const bambooTexture = () =>
  canvasTexture(128, 1024, (ctx, w, h) => {
    const r = rng(733);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c7a76a");
    g.addColorStop(1, "#b08c52");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = r() < 0.5 ? `rgba(255,236,190,${0.05 + r() * 0.1})` : `rgba(110,80,40,${0.05 + r() * 0.1})`;
      ctx.fillRect(r() * w, 0, 0.6 + r() * 1.5, h);
    }
    for (const v of [0.24, 0.71]) {
      const y = (1 - v) * h;
      ctx.fillStyle = "rgba(92,62,28,0.55)";
      ctx.fillRect(0, y - 3, w, 6);
      ctx.fillStyle = "rgba(255,238,200,0.35)";
      ctx.fillRect(0, y + 3, w, 3);
      const shade = ctx.createLinearGradient(0, y - 40, 0, y);
      shade.addColorStop(0, "rgba(90,60,25,0)");
      shade.addColorStop(1, "rgba(90,60,25,0.25)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, y - 40, w, 40);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(80,52,24,${0.2 + r() * 0.3})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 5);
    }
  });

/** Brush hair: the wet black tip, drying up into pale goat hair at the root. */
const hairTexture = () =>
  canvasTexture(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0); // v = 0 (tip) is the canvas bottom
    g.addColorStop(0, "#0b0908");
    g.addColorStop(0.5, "#15110e");
    g.addColorStop(0.72, "#5a4a3a");
    g.addColorStop(0.88, "#c9b996");
    g.addColorStop(1, "#ddd0b2");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

/** The seal: vermilion paste, an abstract mark cut in negative, paste missing in specks. */
const sealTexture = () =>
  canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(9001);
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
    // An inner border, broken twice, like a worn stone.
    path([[34, 112], [34, 34], [150, 34]]);
    path([[178, 34], [222, 34], [222, 222], [120, 222]]);
    path([[92, 222], [34, 222], [34, 140]]);
    ctx.lineWidth = 13;
    // Abstract mark: a squared meander and a hook. Not a character.
    path([[62, 66], [112, 66], [112, 118], [72, 118], [72, 190], [118, 190]]);
    path([[142, 70], [196, 70], [196, 138], [150, 138], [150, 196]]);
    ctx.fillStyle = "#000";
    ctx.fillRect(176, 170, 22, 22);
    // Where the paste did not take.
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

/** Soft contact shadow under the sheet, so it sits on the table. */
const sheetShadowTexture = (padW, padH) =>
  canvasTexture(256, Math.round((256 * padH) / padW), (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const hx = (w * (W / padW)) / 2;
    const hy = (h * (H / padH)) / 2;
    const blur = w * 0.05;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - w / 2) - hx;
        const dy = Math.abs(y - h / 2) - hy;
        const sdf = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
        const a = 1 - clamp01((sdf + blur * 0.3) / (blur * 1.3));
        const i = (y * w + x) * 4;
        img.data[i + 3] = a * a * 150;
      }
    }
    ctx.putImageData(img, 0, 0);
  });

// ── Scene ──────────────────────────────────────────────────────────────────

export const createShrikeInkScene = (stage, { props, overlay } = {}) => {
  const { scene, camera, pointer, staticMode } = stage;
  scene.background = new THREE.Color("#0a0807");
  scene.fog = new THREE.Fog("#0a0807", 4.4, 8.8);
  scene.environmentIntensity = 0.4;

  const textures = [];
  const keep = (t) => (textures.push(t), t);

  // Light: a warm key from the upper left, so shadows fall toward the viewer's right.
  const key = new THREE.DirectionalLight("#fff0da", 3.0);
  key.position.set(-2.2, 4.0, -1.2);
  key.target.position.set(0.2, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2.3, right: 2.3, top: 2.3, bottom: -2.3, near: 0.5, far: 10 });
  key.shadow.radius = 7;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight("#efe2cf", "#24180f", 0.6));

  // The table, its edge running down the left of the frame into the dark.
  const woodTex = keep(woodTexture());
  const table = new THREE.Group();
  table.rotation.y = 0.1;
  scene.add(table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 7), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6, metalness: 0 }));
  top.position.set(-1.62 + 3.5, -0.06, 0);
  top.receiveShadow = true;
  table.add(top);

  // The sheet.
  const sheet = new THREE.Group();
  sheet.rotation.y = -0.06;
  scene.add(sheet);
  const page = new THREE.Group();
  page.rotation.x = -Math.PI / 2;
  page.position.y = SURFACE;
  sheet.add(page);

  const padW = W + 0.26;
  const padH = H + 0.26;
  const shadowTex = keep(sheetShadowTexture(padW, padH));
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(padW, padH), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: "#000000", fog: false }));
  contact.position.set(0.018, -0.022, -SURFACE + 0.0008);
  page.add(contact);

  const paperTex = keep(paperTexture());
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: paperTex, alphaTest: 0.5, alphaToCoverage: true, fog: false }));
  page.add(paper);

  // The ink: one group per painting, only the current one drawn.
  let seed = 0;
  const paintings = PAINTINGS.map((pt) => {
    const group = new THREE.Group();
    group.visible = false;
    page.add(group);
    const strokes = pt.strokes.map((d, i) => {
      const { geometry, curve, L } = buildRibbon(d);
      const material = strokeMaterial(d, L, seed++ * 3.17 + 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.0006;
      mesh.renderOrder = 10 + i;
      mesh.frustumCulled = false;
      group.add(mesh);
      return { ...d, curve, L, material };
    });
    return { ...pt, group, strokes };
  });

  // The seal.
  const sealTex = keep(sealTexture());
  const sealMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: sealTex }, uAmount: { value: 0 }, uFade: { value: 1 }, uOrigin: { value: new THREE.Vector2() } },
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
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,
  });
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(SEAL_SIZE, SEAL_SIZE), sealMat);
  seal.position.z = 0.0008;
  seal.rotation.z = 0.025;
  seal.renderOrder = 40;
  page.add(seal);

  // The brush's shadow falls over paper and wet ink alike.
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.02, H - 0.02), new THREE.ShadowMaterial({ color: "#2e2014", opacity: 0.34, depthWrite: false, fog: false }));
  catcher.position.z = 0.0012;
  catcher.receiveShadow = true;
  catcher.renderOrder = 60;
  page.add(catcher);

  // The ink stone, top right: a matte grinding slope, a glossy well, the stick.
  const suzuri = new THREE.Group();
  suzuri.position.set(1.3, 0, -0.62);
  suzuri.rotation.y = 0.12;
  scene.add(suzuri);
  const slate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.6), new THREE.MeshStandardMaterial({ color: "#1c1a19", roughness: 0.6 }));
  slate.position.y = 0.03;
  const oka = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.36), new THREE.MeshStandardMaterial({ color: "#2b2927", roughness: 0.32 }));
  oka.rotation.x = -Math.PI / 2;
  oka.position.set(0, 0.0605, 0.08);
  const well = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.15), new THREE.MeshStandardMaterial({ color: "#030303", roughness: 0.06 }));
  well.rotation.x = -Math.PI / 2;
  well.position.set(0, 0.0607, -0.2);
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.028, 0.22), new THREE.MeshStandardMaterial({ color: "#131110", roughness: 0.42 }));
  stick.position.set(0.02, 0.075, 0.1);
  stick.rotation.y = 0.5;
  for (const m of [slate, stick]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  oka.receiveShadow = true;
  suzuri.add(slate, oka, well, stick);

  // The brush: origin at the hair root, hair hanging below, handle above.
  const HAIR = 0.13;
  const brush = new THREE.Group();
  scene.add(brush);
  const hairPivot = new THREE.Group();
  brush.add(hairPivot);
  const hairTex = keep(hairTexture());
  const hairProfile = [
    [0, -HAIR],
    [0.0035, -0.123],
    [0.0095, -0.106],
    [0.0165, -0.082],
    [0.0215, -0.056],
    [0.024, -0.03],
    [0.0232, -0.01],
    [0.0205, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const hair = new THREE.Mesh(new THREE.LatheGeometry(hairProfile, 28), new THREE.MeshStandardMaterial({ map: hairTex, roughness: 0.36 }));
  hairPivot.add(hair);
  const lacquer = new THREE.MeshStandardMaterial({ color: "#16100c", roughness: 0.22 });
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0198, 0.0215, 0.045, 28), lacquer);
  ferrule.position.y = 0.0225;
  const bambooTex = keep(bambooTexture());
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.0168, 0.0176, 0.74, 28), new THREE.MeshStandardMaterial({ map: bambooTex, roughness: 0.42 }));
  handle.position.y = 0.045 + 0.37;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0172, 0.028, 28), lacquer);
  cap.position.y = 0.045 + 0.74 + 0.014;
  brush.add(ferrule, handle, cap);
  brush.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  // The seal stone.
  const stamp = new THREE.Group();
  scene.add(stamp);
  const soapstone = new THREE.MeshStandardMaterial({ color: "#cdb98f", roughness: 0.48 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(SEAL_SIZE, 0.2, SEAL_SIZE), soapstone);
  block.position.y = 0.1;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), soapstone);
  knob.scale.set(0.045, 0.03, 0.045);
  knob.position.y = 0.2;
  block.castShadow = knob.castShadow = true;
  stamp.add(block, knob);

  scene.updateMatrixWorld(true);

  // ── Choreography ─────────────────────────────────────────────────────────

  const v = new THREE.Vector3();
  const toWorld = (x, y, out = new THREE.Vector3()) => page.localToWorld(out.set(x, y, 0.0006));
  const POOL = suzuri.localToWorld(new THREE.Vector3(0, 0.061, -0.2));
  const REST_TIP = new THREE.Vector3(0.95, 0.032, -0.1);
  const UP = new THREE.Vector3(0, 1, 0);
  const qRest = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(0.15, 0, 1).normalize());

  // Per painting: the strokes, the brush going to rest while the seal goes
  // down, then back to the stone to reload. It starts each painting at the stone.
  for (const pt of paintings) {
    pt.events = [
      ...pt.strokes.map((s) => {
        const a = s.curve.getPointAt(0);
        const b = s.curve.getPointAt(1);
        return { t0: s.t0, t1: s.t1, stroke: s, start: toWorld(a.x, a.y), end: toWorld(b.x, b.y) };
      }),
      { t0: pt.rest, t1: pt.leave, rest: true, start: REST_TIP, end: REST_TIP },
      { t0: pt.dip[0], t1: pt.dip[1], dip: true, start: POOL, end: POOL },
    ];
  }

  const pose = { tip: new THREE.Vector3(), rest: 0, squash: 0, twist: 0 };
  const travel = (out, from, to, s, mode) => {
    const e = easeInOutCubic(s);
    out.tip.lerpVectors(from, to, e);
    const h = mode ? 0.3 : 0.05 + 0.2 * Math.min(1, from.distanceTo(to));
    out.tip.y += Math.sin(Math.PI * e) * h;
    out.rest = mode === "from" ? 1 - smoothstep(segment(s, 0, 0.55)) : mode === "to" ? smoothstep(segment(s, 0.45, 1)) : 0;
  };
  const brushAt = (pt, t, out) => {
    out.rest = 0;
    out.squash = 0;
    out.twist = 0;
    const { events } = pt;
    if (t <= events[0].t0) {
      travel(out, POOL, events[0].start, segment(t, 0, events[0].t0));
      return out;
    }
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (t < ev.t0) {
        const prev = events[i - 1];
        travel(out, prev.end, ev.start, segment(t, prev.t1, ev.t0), ev.rest ? "to" : prev.rest ? "from" : undefined);
        return out;
      }
      if (t <= ev.t1) {
        const s = segment(t, ev.t0, ev.t1);
        if (ev.rest) {
          out.tip.copy(REST_TIP);
          out.rest = 1;
        } else if (ev.dip) {
          out.tip.copy(POOL);
          out.tip.x += Math.sin(s * Math.PI * 2) * 0.02;
          out.tip.z += (1 - Math.cos(s * Math.PI * 2)) * 0.012;
          out.tip.y -= Math.sin(Math.PI * s) * 0.012;
          out.squash = 0.35 * Math.sin(Math.PI * s);
          out.twist = Math.sin(Math.PI * s) * 0.8; // a roll in the well, back where it started
        } else {
          const st = ev.stroke;
          const p = strokeEase(s);
          const pc = st.curve.getPointAt(p);
          toWorld(pc.x, pc.y, out.tip);
          const w = profile(st.w, p);
          const env = Math.min(1, s / 0.05, (1 - s) / 0.06);
          out.squash = (0.06 + clamp01(w / 0.045) * 0.42) * Math.max(0, env);
        }
        return out;
      }
    }
    out.tip.copy(POOL);
    return out;
  };

  const prevPose = { tip: new THREE.Vector3(), rest: 0, squash: 0, twist: 0 };
  const axis = new THREE.Vector3();
  const qHeld = new THREE.Quaternion();
  const qTwist = new THREE.Quaternion();
  const placeBrush = (pt, t) => {
    brushAt(pt, t, pose);
    brushAt(pt, Math.max(0, t - 1 / 30), prevPose);
    // The handle leads the tip a little in the direction it travels.
    const vx = (pose.tip.x - prevPose.tip.x) * 30;
    const vz = (pose.tip.z - prevPose.tip.z) * 30;
    const speed = Math.hypot(vx, vz);
    const lean = speed > 1e-4 ? Math.min(0.32, speed * 0.22) / speed : 0;
    axis.set(0.35 + vx * lean, 1, -0.1 + vz * lean).normalize();
    qHeld.setFromUnitVectors(UP, axis);
    brush.quaternion.slerpQuaternions(qHeld, qRest, pose.rest);
    brush.quaternion.multiply(qTwist.setFromAxisAngle(UP, pose.twist));
    const sq = pose.squash;
    hairPivot.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    v.copy(UP).applyQuaternion(brush.quaternion);
    brush.position.copy(pose.tip).addScaledVector(v, HAIR * (1 - sq));
  };

  const OFF = new THREE.Vector3(2.4, 0.9, 0.5);
  for (const pt of paintings) {
    const at = toWorld(pt.seal.x, pt.seal.y);
    pt.stampAt = { at, above: at.clone().add(new THREE.Vector3(0, 0.32, 0)), lifted: at.clone().add(new THREE.Vector3(0.05, 0.26, 0.04)) };
  }
  const placeStamp = (pt, t) => {
    const S = pt.seal;
    const { at, above, lifted } = pt.stampAt;
    stamp.visible = t > S.enter && t < S.gone;
    if (!stamp.visible) return;
    let wobble = 0;
    if (t < S.down) {
      const e = easeInOutCubic(segment(t, S.enter, S.down));
      stamp.position.lerpVectors(OFF, above, e);
      stamp.position.y += Math.sin(Math.PI * e) * 0.12;
      wobble = (1 - e) * 0.4;
    } else if (t < S.hit) {
      stamp.position.lerpVectors(above, at, easeInCubic(segment(t, S.down, S.hit)));
    } else if (t < S.up) {
      stamp.position.copy(at);
      stamp.position.y -= 0.0015 * Math.sin(Math.PI * segment(t, S.hit, S.up));
    } else if (t < S.away) {
      stamp.position.lerpVectors(at, lifted, easeOutCubic(segment(t, S.up, S.away)));
    } else {
      const e = easeInOutCubic(segment(t, S.away, S.gone));
      stamp.position.lerpVectors(lifted, OFF, e);
      wobble = -e * 0.4;
    }
    stamp.position.y = Math.max(stamp.position.y, SURFACE - 0.0015);
    stamp.rotation.set(wobble * 0.3, sheet.rotation.y - 0.025 + wobble, wobble * 0.2);
  };

  const target = new THREE.Vector3();
  const ELEV = 1.12; // high enough that the sheet reads top to bottom
  const AZ = 0.1;
  const corners = [
    [-W / 2, -H / 2],
    [W / 2, -H / 2],
    [W / 2, H / 2],
    [-W / 2, H / 2],
  ].map(([x, y]) => toWorld(x, y));
  const aim = (tx, tz, dist, elev, az) => {
    target.set(tx, 0, tz);
    camera.position.set(tx + dist * Math.cos(elev) * Math.sin(az), dist * Math.sin(elev), tz + dist * Math.cos(elev) * Math.cos(az));
    camera.lookAt(target);
    camera.updateMatrixWorld();
  };
  // Solve once per aspect: the distance and aim that hold the whole sheet,
  // shrike at the top to seal at the bottom, inside a 6% margin (plus drift room).
  const fit = { aspect: 0, dist: 3, tx: 0, tz: 0 };
  const extent = () => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of corners) {
      v.copy(c).project(camera);
      x0 = Math.min(x0, v.x);
      x1 = Math.max(x1, v.x);
      y0 = Math.min(y0, v.y);
      y1 = Math.max(y1, v.y);
    }
    return { x0, x1, y0, y1 };
  };
  const solveFit = (aspect) => {
    const prevAspect = camera.aspect;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // On wide screens the sheet sits right of centre: the words get the left.
    const wide = aspect > 1.3;
    let tx = 0;
    let tz = 0;
    let dist = 3;
    for (let pass = 0; pass < 4; pass++) {
      let lo = 1.5;
      let hi = 12;
      for (let i = 0; i < 22; i++) {
        dist = (lo + hi) / 2;
        aim(tx, tz, dist, ELEV, AZ);
        const e = extent();
        const ok = e.y1 <= 0.86 && e.y0 >= -0.86 && e.x1 - e.x0 <= (wide ? 1.2 : 1.76);
        if (ok) hi = dist;
        else lo = dist;
      }
      dist = hi;
      aim(tx, tz, dist, ELEV, AZ);
      const e = extent();
      // Re-centre: shift the aim by the screen offset, converted to table units.
      const half = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      tz -= ((e.y0 + e.y1) / 2) * (half / Math.sin(ELEV));
      const goalX = wide ? 0.28 : 0;
      tx += ((e.x0 + e.x1) / 2 - goalX) * half * aspect;
    }
    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    Object.assign(fit, { aspect, dist, tx, tz });
  };
  const placeCamera = (pt, t, time) => {
    // A gentle push in as each painting comes together, easing back out as it sinks away.
    const push = easeInOutCubic(segment(t, 0.3, pt.rest)) * (1 - easeInOutCubic(segment(t, pt.fade[0], pt.dur)));
    const aspect = stage.size.aspect || 1.78;
    if (Math.abs(aspect - fit.aspect) > 1e-3) solveFit(aspect);
    const dist = fit.dist * lerp(1.05, 1.0, push);
    const elev = ELEV + 0.012 * Math.sin(time * 0.23) + pointer.y * 0.015;
    const az = AZ + 0.03 * Math.sin(time * 0.17) + pointer.x * 0.03;
    aim(fit.tx + pointer.x * 0.02, fit.tz, dist, elev, az);
  };

  let current = null;
  const update = (time) => {
    const g = staticMode ? STATIC_T : time % LOOP;
    let pt = paintings[paintings.length - 1];
    for (const p of paintings) {
      if (g < p.start + p.dur) {
        pt = p;
        break;
      }
    }
    const t = g - pt.start;
    if (pt !== current) {
      if (current) current.group.visible = false;
      pt.group.visible = true;
      current = pt;
      seal.position.x = pt.seal.x;
      seal.position.y = pt.seal.y;
      sealMat.uniforms.uOrigin.value.set(pt.seal.x, pt.seal.y);
    }
    const fade = 1 - smoothstep(segment(t, pt.fade[0], pt.fade[1]));
    for (const s of pt.strokes) {
      const u = s.material.uniforms;
      const p = strokeEase(segment(t, s.t0, s.t1));
      u.uProgress.value = t >= s.t0 ? Math.max(p, 1e-4) : 0;
      u.uFrontW.value = Math.max(MIN_W, profile(s.w, p));
      u.uAge.value = t - s.t0;
      u.uFade.value = fade;
    }
    sealMat.uniforms.uAmount.value = segment(t, pt.seal.hit, pt.seal.hit + 0.08);
    sealMat.uniforms.uFade.value = fade;
    placeBrush(pt, t);
    placeStamp(pt, t);
    placeCamera(pt, t, staticMode ? STATIC_T : time);
  };

  return {
    update,
    setProps() {},
    dispose() {
      for (const t of textures) {
        t.dispose();
        if (t.image) t.image.width = t.image.height = 0;
      }
      scene.fog = null;
    },
  };
};
