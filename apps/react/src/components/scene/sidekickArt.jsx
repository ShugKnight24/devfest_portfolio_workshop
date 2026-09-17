/**
 * Sidekicks — small companions from the site's anime themes, drawn as original
 * chibi designs that only borrow each character's signature traits.
 *
 * Every component draws with its contact point at local (0, 0) and grows
 * upward; the scene places it with `translate(x y)`. Flat fills only — a base
 * tone, one shadow tone and at most one highlight per colour region — and no
 * ids, because several copies can share one SVG.
 */

const INK = "#1B1B22";

const GroundShadow = ({ rx, ry = 3.5, cx = 0 }) => (
  <ellipse cx={cx} cy={0} rx={rx} ry={ry} fill="#000000" opacity={0.3} />
);

/* --------------------------------------------------------------------------
 * Pochita — a round orange puppy with a chainsaw blade for a nose-horn and a
 * starter pull-cord on its flank. The plush is the merch shape: one felt ball
 * with the blade softened into a stuffed fin, so the silhouette survives at
 * shelf size.
 * ------------------------------------------------------------------------ */
const POCHITA = { base: "#F28A2E", shadow: "#CF6716", highlight: "#FFB566" };
const BLADE = { base: "#C3CAD4", shadow: "#8C95A3", teeth: "#5F6773" };

const PochitaFigure = () => (
  <g>
    <GroundShadow rx={17} />
    {/* tail, a short upturned stub behind the left hip */}
    <path d="M-15 -12 C-20 -14, -22 -19, -20 -23 C-17 -21, -14 -18, -12 -15 Z" fill={POCHITA.shadow} />
    {/* back legs sit behind the body, front legs in front */}
    <rect x={-14} y={-9} width={7} height={9} rx={3.2} fill={POCHITA.shadow} />
    <rect x={7} y={-9} width={7} height={9} rx={3.2} fill={POCHITA.shadow} />
    {/* chainsaw blade rising out of the forehead, teeth on both edges */}
    <path d="M-3.5 -30 L-3.5 -41 Q0 -45 3.5 -41 L3.5 -30 Z" fill={BLADE.base} />
    <path d="M0 -30 L0 -44 Q2.5 -43.5 3.5 -41 L3.5 -30 Z" fill={BLADE.shadow} />
    {[-40, -36.5, -33].map((y) => (
      <g key={y}>
        <path d={`M-3.5 ${y} L-6 ${y + 1.2} L-3.5 ${y + 2.4} Z`} fill={BLADE.teeth} />
        <path d={`M3.5 ${y} L6 ${y + 1.2} L3.5 ${y + 2.4} Z`} fill={BLADE.teeth} />
      </g>
    ))}
    <path d="M-1.6 -31 L-1.6 -40.5" stroke={BLADE.teeth} strokeWidth={0.8} strokeDasharray="1.4 1.2" />
    {/* body and head are one round mass, like the character */}
    <ellipse cx={0} cy={-18} rx={17.5} ry={14} fill={POCHITA.base} />
    <path d="M17.5 -18 C17.5 -9, 10 -4, 0 -4 C8 -7, 13 -12, 14 -20 Z" fill={POCHITA.shadow} />
    <ellipse cx={-8} cy={-27} rx={6} ry={2.6} fill={POCHITA.highlight} opacity={0.8} />
    {/* front paws */}
    <rect x={-8} y={-8} width={6.5} height={8} rx={3} fill={POCHITA.base} />
    <rect x={1.5} y={-8} width={6.5} height={8} rx={3} fill={POCHITA.base} />
    {/* pull-cord: cord from the flank to a black T-handle */}
    <path d="M15 -17 Q19.5 -15, 18 -10" stroke="#E7E5E4" strokeWidth={1.2} fill="none" />
    <rect x={14.5} y={-10.5} width={7} height={3} rx={1.5} fill="#2F343E" />
    <rect x={14.5} y={-10.5} width={7} height={1.2} rx={0.6} fill="#5A6170" />
    {/* happy face: bead eyes, wide grin with a tongue */}
    <circle cx={-6} cy={-20} r={1.8} fill={INK} />
    <circle cx={6} cy={-20} r={1.8} fill={INK} />
    <circle cx={-5.4} cy={-20.6} r={0.6} fill="#FFFFFF" />
    <circle cx={6.6} cy={-20.6} r={0.6} fill="#FFFFFF" />
    <path d="M-6 -15 Q0 -8, 6 -15 Z" fill={INK} />
    <path d="M-2.5 -11.2 Q0 -13.6, 2.5 -11.2 Q0 -9.6, -2.5 -11.2 Z" fill="#F87171" />
    <path d="M-4.2 -15 L-3.4 -13.6 L-2.6 -15 Z M2.6 -15 L3.4 -13.6 L4.2 -15 Z" fill="#FFFFFF" />
  </g>
);

const FELT_SEAM = "#FFC98F";

const PochitaPlush = () => (
  <g>
    <GroundShadow rx={16} />
    {/* stuffed blade fin, teeth rounded off into felt bumps */}
    <path d="M-4.5 -36 L-4.5 -46 Q0 -51, 4.5 -46 L4.5 -36 Z" fill={BLADE.base} />
    <path d="M0 -36 L0 -49.5 Q3.5 -48.5, 4.5 -46 L4.5 -36 Z" fill={BLADE.shadow} />
    {[-46, -42, -38].map((y) => (
      <g key={y}>
        <path d={`M-4.5 ${y - 1.4} Q-7.6 ${y}, -4.5 ${y + 1.8} Z`} fill={BLADE.teeth} />
        <path d={`M4.5 ${y - 1.4} Q7.6 ${y}, 4.5 ${y + 1.8} Z`} fill={BLADE.teeth} />
      </g>
    ))}
    {/* stubby legs */}
    <ellipse cx={-8} cy={-3.5} rx={5} ry={3.5} fill={POCHITA.shadow} />
    <ellipse cx={8} cy={-3.5} rx={5} ry={3.5} fill={POCHITA.shadow} />
    {/* the felt ball */}
    <ellipse cx={0} cy={-21} rx={18} ry={17} fill={POCHITA.base} />
    <path d="M18 -21 C18 -11, 10 -4, 0 -4 C9 -8, 14 -14, 15 -23 Z" fill={POCHITA.shadow} />
    <ellipse cx={-8} cy={-31} rx={5.5} ry={2.4} fill={POCHITA.highlight} opacity={0.8} />
    {/* stitched seam down the middle of the head and belly */}
    <path d="M0 -37 L0 -24" stroke={FELT_SEAM} strokeWidth={1} strokeDasharray="2 2" />
    <path d="M0 -12 L0 -5" stroke={FELT_SEAM} strokeWidth={1} strokeDasharray="2 2" />
    {/* mitten paws */}
    <ellipse cx={-11} cy={-11} rx={4} ry={3.2} fill={POCHITA.highlight} />
    <ellipse cx={11} cy={-11} rx={4} ry={3.2} fill={POCHITA.highlight} />
    {/* button eyes and an embroidered smile */}
    <circle cx={-6} cy={-25} r={2.3} fill={INK} />
    <circle cx={6} cy={-25} r={2.3} fill={INK} />
    <circle cx={-6.7} cy={-25.7} r={0.7} fill="#FFFFFF" />
    <circle cx={5.3} cy={-25.7} r={0.7} fill="#FFFFFF" />
    <path d="M-5 -19 Q0 -14, 5 -19" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    {/* pull-cord: a soft cord loop to a stuffed T-handle on the flank */}
    <path d="M16 -20 Q19.5 -17, 17.5 -13" stroke="#E7E5E4" strokeWidth={1.2} fill="none" />
    <rect x={13.5} y={-13.5} width={6.5} height={3} rx={1.5} fill="#2F343E" />
    <rect x={13.5} y={-13.5} width={6.5} height={1.1} rx={0.55} fill="#5A6170" />
    {/* fabric tag on the other hip */}
    <rect x={-19} y={-12} width={4} height={6} rx={0.6} fill="#F8FAFC" />
    <rect x={-16.4} y={-12} width={1.4} height={6} fill="#CBD5E1" />
  </g>
);

const Pochita = ({ mode = "figure" }) => (mode === "plush" ? <PochitaPlush /> : <PochitaFigure />);

/* --------------------------------------------------------------------------
 * Meowy — a plain house cat, and that plainness is the point: white coat,
 * two soft grey patches, a red collar with a bell. The shadow side is a cool
 * grey so the white still has an edge against the day backdrop.
 * ------------------------------------------------------------------------ */
const MEOWY = {
  base: "#F7F7F4",
  shadow: "#CDD2DA",
  patch: "#A3A9B4",
  patchShadow: "#858C98",
  ear: "#F4A7B9",
};

const Meowy = () => (
  <g>
    <GroundShadow rx={17} />
    {/* tail curls round the front paws; grey tip */}
    <path
      d="M10 -4 C18 -4, 22 -8, 20 -15 C19 -18, 16 -18, 16 -15 C17 -10, 14 -8, 8 -8 Z"
      fill={MEOWY.shadow}
    />
    <path d="M20 -15 C19 -18, 16 -18, 16 -15 L17.8 -13.2 L20.3 -12.8 Z" fill={MEOWY.patch} />
    {/* sitting body, pear shaped */}
    <path d="M-12 0 C-17 0, -17 -12, -12 -22 C-9 -28, 9 -28, 12 -22 C17 -12, 17 0, 12 0 Z" fill={MEOWY.base} />
    <path d="M12 0 C17 0, 17 -12, 12 -22 C11 -24, 9 -25, 8 -25 C12 -16, 12 -6, 7 0 Z" fill={MEOWY.shadow} />
    {/* patch on the right flank */}
    <path d="M6 -18 C10 -20, 14 -16, 14 -11 C12 -9, 8 -10, 6 -13 Z" fill={MEOWY.patch} />
    {/* front paws */}
    <ellipse cx={-5} cy={-2.2} rx={4} ry={2.6} fill={MEOWY.base} />
    <ellipse cx={5} cy={-2.2} rx={4} ry={2.6} fill={MEOWY.base} />
    <path d="M-5 -1 L-5 -3 M5 -1 L5 -3" stroke={MEOWY.shadow} strokeWidth={1} />
    {/* ears */}
    <path d="M-12 -39 L-12 -50 L-3 -44 Z" fill={MEOWY.patch} />
    <path d="M-10.5 -41 L-10.5 -46.5 L-6 -43.5 Z" fill={MEOWY.ear} />
    <path d="M12 -39 L12 -50 L3 -44 Z" fill={MEOWY.base} />
    <path d="M10.5 -41 L10.5 -46.5 L6 -43.5 Z" fill={MEOWY.ear} />
    {/* head */}
    <ellipse cx={0} cy={-35} rx={13.5} ry={11.5} fill={MEOWY.base} />
    <path d="M13.5 -35 C13.5 -28, 8 -23.5, 0 -23.5 C7 -26, 10.5 -30, 10.5 -37 Z" fill={MEOWY.shadow} />
    {/* grey patch over the left eye and ear */}
    <path d="M-13.2 -37 C-13 -43, -8 -46.5, -3 -46 C-2 -41, -4 -36, -9 -33 C-11 -33, -13 -34, -13.2 -37 Z" fill={MEOWY.patch} />
    {/* red collar and bell */}
    <path d="M-10 -25 Q0 -20, 10 -25 L10 -22.5 Q0 -17.5, -10 -22.5 Z" fill="#DC2626" />
    <circle cx={0} cy={-19.2} r={2} fill="#FBBF24" />
    <path d="M-1 -18.6 L1 -18.6" stroke="#B45309" strokeWidth={0.8} />
    {/* face */}
    <ellipse cx={-5} cy={-36} rx={1.7} ry={2.2} fill={INK} />
    <ellipse cx={5} cy={-36} rx={1.7} ry={2.2} fill={INK} />
    <circle cx={-4.4} cy={-36.8} r={0.6} fill="#FFFFFF" />
    <circle cx={5.6} cy={-36.8} r={0.6} fill="#FFFFFF" />
    <path d="M-1.2 -32.5 L1.2 -32.5 L0 -31.2 Z" fill="#F08BA2" />
    <path d="M0 -31.2 Q-1.5 -29, -3 -30 M0 -31.2 Q1.5 -29, 3 -30" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
    <path d="M-8 -31 L-12.5 -32 M-8 -30 L-12.5 -29.5 M8 -31 L12.5 -32 M8 -30 L12.5 -29.5" stroke={MEOWY.patchShadow} strokeWidth={0.6} />
  </g>
);

/* --------------------------------------------------------------------------
 * Nimbus — a golden cloud that hovers: its underside stops 10 above the
 * ground shadow, which is smaller and fainter than a resting object's would
 * be. A swept wisp trails off to the left so it reads as moving.
 * ------------------------------------------------------------------------ */
const NIMBUS = { base: "#FACC15", shadow: "#DDA20A", highlight: "#FEF08A" };

const Nimbus = () => (
  <g>
    <ellipse cx={3} cy={0} rx={16} ry={2.6} fill="#000000" opacity={0.2} />
    {/* trailing wisp */}
    <path
      d="M-10 -16 C-18 -14, -24 -16, -29 -22 C-25 -20, -20 -21, -17 -23 C-22 -24, -26 -28, -26 -32 C-20 -26, -14 -25, -8 -26 Z"
      fill={NIMBUS.shadow}
    />
    {/* puffs, back row first */}
    <circle cx={-2} cy={-26} r={9} fill={NIMBUS.base} />
    <circle cx={10} cy={-30} r={10} fill={NIMBUS.base} />
    <circle cx={21} cy={-24} r={8} fill={NIMBUS.base} />
    <path d="M-12 -18 C-12 -12, -6 -10, 0 -10 L20 -10 C27 -10, 30 -14, 29 -19 C27 -23, 22 -24, 18 -22 L-6 -22 C-10 -22, -12 -21, -12 -18 Z" fill={NIMBUS.base} />
    {/* underside shadow band */}
    <path d="M-12 -17 C-11 -12, -6 -10, 0 -10 L20 -10 C26 -10, 29 -13, 29 -17 C26 -14, 22 -14, 18 -15 C14 -12, 6 -12, 2 -15 C-3 -12, -9 -13, -12 -17 Z" fill={NIMBUS.shadow} />
    <path d="M22 -19 C25 -19, 25 -23, 22 -23 C20 -23, 19.5 -21, 21 -20.5" stroke={NIMBUS.shadow} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    <path d="M4 -21 C7 -21, 7 -25, 4 -25 C2 -25, 1.5 -23, 3 -22.5" stroke={NIMBUS.shadow} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    {/* top-lit puffs */}
    <ellipse cx={8} cy={-35} rx={5} ry={2.6} fill={NIMBUS.highlight} />
    <ellipse cx={-4} cy={-30} rx={3.5} ry={2} fill={NIMBUS.highlight} />
    <ellipse cx={20} cy={-28} rx={3} ry={1.8} fill={NIMBUS.highlight} />
  </g>
);

/* --------------------------------------------------------------------------
 * Divine Dog — a lean sitting wolf-dog: tall pointed ears, long muzzle seen
 * from the front, a forehead mark. The black coat carries a slate rim along
 * the outer edges and gold eyes so the silhouette holds on the night backdrop.
 * ------------------------------------------------------------------------ */
const DIVINE_DOG = {
  white: {
    base: "#F1F3F6",
    shadow: "#B9C1CD",
    rim: "#FFFFFF",
    muzzle: "#FFFFFF",
    ear: "#C9A3AE",
    mark: "#2E3340",
    eye: INK,
    nose: INK,
  },
  black: {
    base: "#343A4A",
    shadow: "#1E212B",
    rim: "#8791A8",
    muzzle: "#3A4050",
    ear: "#4A3942",
    mark: "#E5E9F0",
    eye: "#FBBF24",
    nose: "#0E0F14",
  },
};

const DivineDog = ({ variant = "white" }) => {
  const c = DIVINE_DOG[variant] || DIVINE_DOG.white;
  return (
    <g>
      <GroundShadow rx={24} ry={4} />
      {/* bushy tail laid along the ground to the right */}
      <path d="M12 -6 C20 -6, 26 -8, 27 -16 C28 -20, 25 -22, 24 -18 C22 -12, 18 -11, 12 -12 Z" fill={c.shadow} />
      <path d="M24 -18 C25 -22, 28 -20, 27 -16 L26.4 -14 Z" fill={c.rim} opacity={0.6} />
      {/* haunches: one thigh each side, back paws poking out beside the front ones */}
      <ellipse cx={-17.5} cy={-2} rx={4} ry={2} fill={c.base} />
      <ellipse cx={17.5} cy={-2} rx={4} ry={2} fill={c.shadow} />
      <ellipse cx={-10.5} cy={-11} rx={9.5} ry={11} fill={c.base} />
      <path d="M-3 -1 C-6 -6, -8 -14, -6 -20 C-4 -12, -2 -6, 0 -3 Z" fill={c.shadow} opacity={0.5} />
      <ellipse cx={10.5} cy={-11} rx={9.5} ry={11} fill={c.shadow} />
      <path d="M-20 -11 C-20 -18, -16 -22, -11 -22 C-15 -19, -17.6 -15, -17.6 -9 C-17.6 -5, -16 -2, -14 -1 C-17.6 -2, -20 -6, -20 -11 Z" fill={c.rim} opacity={0.7} />
      {/* lean chest rising to the neck */}
      <path d="M-13 -8 C-13 -26, -10 -40, -6.5 -50 L6.5 -50 C10 -40, 13 -26, 13 -8 Z" fill={c.base} />
      <path d="M13 -8 C13 -26, 10 -40, 6.5 -50 L4 -50 C7.4 -40, 10 -26, 10 -8 Z" fill={c.shadow} opacity={0.8} />
      <path d="M-13 -8 C-13 -26, -10 -40, -6.5 -50 L-5.2 -50 C-8.6 -40, -11.6 -26, -11.6 -8 Z" fill={c.rim} opacity={0.7} />
      {/* chest ruff */}
      <path d="M-6 -44 L6 -44 L3 -35 L1.5 -38 L0 -33 L-1.5 -38 L-3 -35 Z" fill={c.muzzle} />
      {/* shade between the front legs, then the slim legs and paws */}
      <path d="M-2.6 -1 L-1 -20 L1 -20 L2.6 -1 Z" fill={c.shadow} />
      <rect x={-7.5} y={-32} width={4.5} height={31} rx={2.2} fill={c.base} />
      <rect x={3} y={-32} width={4.5} height={31} rx={2.2} fill={c.base} />
      <rect x={5.6} y={-32} width={1.9} height={31} rx={0.9} fill={c.shadow} opacity={0.7} />
      <rect x={-7.5} y={-30} width={1.2} height={28} rx={0.6} fill={c.rim} opacity={0.7} />
      <ellipse cx={-5.6} cy={-1.8} rx={3.6} ry={2} fill={c.base} />
      <ellipse cx={5.6} cy={-1.8} rx={3.6} ry={2} fill={c.base} />
      <path d="M-5.6 -1 L-5.6 -2.8 M5.6 -1 L5.6 -2.8" stroke={c.shadow} strokeWidth={0.9} />
      {/* ears */}
      <path d="M-11 -58 L-12 -70 L-2.5 -62 Z" fill={c.base} />
      <path d="M-9.8 -60 L-10.4 -66.5 L-5 -62 Z" fill={c.ear} />
      <path d="M11 -58 L12 -70 L2.5 -62 Z" fill={c.base} />
      <path d="M9.8 -60 L10.4 -66.5 L5 -62 Z" fill={c.ear} />
      <path d="M-11 -58 L-12 -70 L-11 -69 L-10 -58.5 Z" fill={c.rim} opacity={0.8} />
      {/* skull, cheeks narrowing into the muzzle */}
      <path d="M-11.5 -57 C-11.5 -64, -6 -66, 0 -66 C6 -66, 11.5 -64, 11.5 -57 C11.5 -52, 8 -48, 5 -45 L-5 -45 C-8 -48, -11.5 -52, -11.5 -57 Z" fill={c.base} />
      <path d="M11.5 -57 C11.5 -52, 8 -48, 5 -45 L2 -45 C6 -49, 9 -53, 9 -58 C9 -61, 8 -63, 6 -65 C9 -64, 11.5 -62, 11.5 -57 Z" fill={c.shadow} opacity={0.7} />
      <path d="M-11.5 -57 C-11.5 -62, -9 -64.5, -6 -65.5 C-8.5 -63, -10 -60, -10 -57 C-10 -53, -8 -50, -6 -47 C-9 -49.5, -11.5 -53, -11.5 -57 Z" fill={c.rim} opacity={0.6} />
      <path d="M-5 -53 C-5 -49, -4 -44, 0 -43 C4 -44, 5 -49, 5 -53 C3 -54.5, -3 -54.5, -5 -53 Z" fill={c.muzzle} />
      {/* forehead mark */}
      <path d="M0 -64.5 L1.6 -61 L0 -58.5 L-1.6 -61 Z" fill={c.mark} />
      <path d="M-4 -62.5 L-2.4 -61 M4 -62.5 L2.4 -61" stroke={c.mark} strokeWidth={1.1} strokeLinecap="round" />
      {/* face */}
      <path d="M-7.5 -56.5 Q-5 -58.6, -2.8 -56.4 Q-5 -55, -7.5 -56.5 Z" fill={c.eye} />
      <path d="M7.5 -56.5 Q5 -58.6, 2.8 -56.4 Q5 -55, 7.5 -56.5 Z" fill={c.eye} />
      {variant === "black" && (
        <path d="M-5.6 -56.4 L-4.8 -56.4 M4.8 -56.4 L5.6 -56.4" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      )}
      <ellipse cx={0} cy={-49} rx={2.2} ry={1.5} fill={c.nose} />
      <path d="M0 -47.5 L0 -45.5 M0 -45.5 Q-1.8 -44, -3 -45.2 M0 -45.5 Q1.8 -44, 3 -45.2" stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Igris — a chibi shadow knight standing guard over a planted sword. The
 * armour is near-black, so every plate gets a lighter top edge; the violet eye
 * slits and red plume are the two accents that should read first.
 * ------------------------------------------------------------------------ */
const ARMOUR = { base: "#2C3040", shadow: "#1A1C26", edge: "#6A7390" };
const PLUME = { base: "#DC2626", shadow: "#991B1B", highlight: "#F87171" };

const Igris = () => (
  <g>
    <GroundShadow rx={20} ry={4} />
    {/* cape behind the body */}
    <path d="M-12 -42 C-18 -30, -20 -14, -18 -3 L18 -3 C20 -14, 18 -30, 12 -42 Z" fill="#231C33" />
    <path d="M12 -42 C18 -30, 20 -14, 18 -3 L14 -3 C15 -16, 14 -30, 9 -42 Z" fill="#171222" />
    <path d="M-12 -42 C-18 -30, -20 -14, -18 -3 L-16.6 -3 C-18.4 -14, -16.6 -30, -10.8 -42 Z" fill="#4A3D66" />
    {/* legs and sabatons */}
    <rect x={-9} y={-16} width={6.5} height={14} rx={2} fill={ARMOUR.base} />
    <rect x={2.5} y={-16} width={6.5} height={14} rx={2} fill={ARMOUR.shadow} />
    <path d="M-11 0 L-11 -3 Q-11 -5, -8 -5 L-2 -5 L-2 0 Z" fill={ARMOUR.base} />
    <path d="M11 0 L11 -3 Q11 -5, 8 -5 L2 -5 L2 0 Z" fill={ARMOUR.base} />
    <path d="M-11 -3 Q-11 -5, -8 -5 L-2 -5 L-2 -4 L-8 -4 Q-10.2 -4, -11 -3 Z" fill={ARMOUR.edge} />
    <path d="M11 -3 Q11 -5, 8 -5 L2 -5 L2 -4 L8 -4 Q10.2 -4, 11 -3 Z" fill={ARMOUR.edge} />
    <rect x={-9} y={-11} width={6.5} height={1.2} fill={ARMOUR.edge} />
    <rect x={2.5} y={-11} width={6.5} height={1.2} fill={ARMOUR.edge} />
    {/* breastplate and skirt */}
    <path d="M-11 -40 L11 -40 L10 -22 L12 -15 L-12 -15 L-10 -22 Z" fill={ARMOUR.base} />
    <path d="M11 -40 L10 -22 L12 -15 L4 -15 L4 -40 Z" fill={ARMOUR.shadow} />
    <path d="M-11 -40 L11 -40 L10.8 -38.6 L-10.8 -38.6 Z" fill={ARMOUR.edge} />
    <path d="M-10 -22 L10 -22 L10.3 -20.8 L-10.3 -20.8 Z" fill={ARMOUR.edge} />
    <path d="M0 -38 L0 -23" stroke={ARMOUR.edge} strokeWidth={0.8} opacity={0.6} />
    {/* pauldrons */}
    <path d="M-10 -41 C-16 -42, -19 -38, -19 -32 L-11 -32 Z" fill={ARMOUR.base} />
    <path d="M10 -41 C16 -42, 19 -38, 19 -32 L11 -32 Z" fill={ARMOUR.base} />
    <path d="M-10 -41 C-16 -42, -19 -38, -19 -32 L-17.6 -32 C-17.4 -37, -15 -40, -10 -39.6 Z" fill={ARMOUR.edge} />
    <path d="M10 -41 C16 -42, 19 -38, 19 -32 L17.6 -32 C17.4 -37, 15 -40, 10 -39.6 Z" fill={ARMOUR.edge} />
    {/* sword planted point-down in front */}
    <path d="M-2 -28 L2 -28 L2 -4 L0 -0.5 L-2 -4 Z" fill="#CBD5E1" />
    <path d="M0 -28 L2 -28 L2 -4 L0 -0.5 Z" fill="#8E9AAE" />
    <rect x={-8} y={-30} width={16} height={2.6} rx={1.2} fill={ARMOUR.shadow} />
    <rect x={-8} y={-30} width={16} height={1} rx={0.5} fill={ARMOUR.edge} />
    <rect x={-1} y={-35} width={2} height={5} fill="#3F2A2A" />
    {/* gauntlets resting on the pommel */}
    <ellipse cx={-3.2} cy={-35} rx={3.6} ry={3} fill={ARMOUR.base} />
    <ellipse cx={3.2} cy={-35} rx={3.6} ry={3} fill={ARMOUR.base} />
    <path d="M-6.6 -36 Q-3.2 -38.8, 0 -36.6 M0.2 -36.6 Q3.2 -38.8, 6.6 -36" stroke={ARMOUR.edge} strokeWidth={1} fill="none" />
    {/* plume rising off the crest and streaming back like a horsetail */}
    <path d="M-3 -66 C-4 -74, 3 -80, 11 -79 C18 -78, 23 -71, 23 -52 C20.6 -59, 17 -66, 10 -69 C6 -70.4, 4 -68, 4 -65 Z" fill={PLUME.base} />
    <path d="M23 -52 C20.6 -59, 17 -66, 10 -69 C15 -71.6, 21 -67, 23 -52 Z" fill={PLUME.shadow} />
    <path d="M-1.6 -67 C-1.8 -73, 3 -77.6, 9.6 -77.8 C4.6 -75.4, 2 -71.6, 1.4 -66.4 Z" fill={PLUME.highlight} />
    {/* great helm */}
    <path d="M-13 -52 C-13 -62, -8 -67, 0 -67 C8 -67, 13 -62, 13 -52 L12 -42 C8 -39, -8 -39, -12 -42 Z" fill={ARMOUR.base} />
    <path d="M13 -52 L12 -42 C10 -40.5, 7 -39.6, 4 -39.3 C8 -43, 10 -48, 10 -53 C10 -59, 8 -64, 4 -66.6 C9.5 -65.5, 13 -60, 13 -52 Z" fill={ARMOUR.shadow} />
    <path d="M-13 -52 C-13 -62, -8 -67, 0 -67 L0 -65.6 C-7 -65.6, -11.6 -61, -11.6 -52 Z" fill={ARMOUR.edge} />
    <path d="M0 -66 L0 -40" stroke={ARMOUR.edge} strokeWidth={0.9} opacity={0.5} />
    {/* visor slot with glowing eyes */}
    <path d="M-10 -54 L10 -54 L9 -49 L-9 -49 Z" fill="#0E0F16" />
    <path d="M-8 -52.5 L-2.5 -51.4 L-8 -50.5 Z" fill="#A855F7" />
    <path d="M8 -52.5 L2.5 -51.4 L8 -50.5 Z" fill="#A855F7" />
    <path d="M-7 -51.9 L-3.5 -51.4 L-7 -51 Z" fill="#F0ABFC" />
    <path d="M7 -51.9 L3.5 -51.4 L7 -51 Z" fill="#F0ABFC" />
    <path d="M-7 -46 L-3 -46 M3 -46 L7 -46 M-7 -44 L-3 -44 M3 -44 L7 -44" stroke={ARMOUR.edge} strokeWidth={0.8} opacity={0.7} />
  </g>
);

export const SIDEKICK_ART = {
  pochita: Pochita,
  meowy: Meowy,
  nimbus: Nimbus,
  divineDog: DivineDog,
  igris: Igris,
};

export const SIDEKICK_VARIANTS = {
  divineDog: [
    { id: "white", label: "White" },
    { id: "black", label: "Black" },
  ],
};
