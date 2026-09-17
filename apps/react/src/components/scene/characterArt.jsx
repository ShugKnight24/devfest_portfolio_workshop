/**
 * Character figures and plushies — chibi takes on characters from the site's
 * themes (Chainsaw Man, Reacher, Dragon Ball). Every design is original and only
 * borrows each character's signature traits: hair shape and colour, horns,
 * costume colours, a chainsaw.
 *
 * Every component draws with its contact point at local (0, 0) and grows
 * upward; the scene places it with `translate(x y)`. Flat fills only — a base
 * tone, one shadow tone and at most one highlight per colour region — and no
 * ids, because several copies can share one SVG.
 *
 * The whole cast is built on two shared rigs, `ChibiFigure` (56 x 96) and
 * `PlushToy` (40 x 50), so heads, bodies, eyes and shading stay one family and
 * each character only supplies its hair, costume details and face.
 */

const INK = "#1B1B22";
const BLUSH = "#F472B6";

const SKIN = {
  fair: { base: "#EFC6A2", shadow: "#CB9871" },
  light: { base: "#E3B08A", shadow: "#BC845C" },
  medium: { base: "#C4835A", shadow: "#9B5C35" },
};

const BLADE = { base: "#C3CAD4", shadow: "#8C95A3", teeth: "#5F6773" };

const GroundShadow = ({ rx, ry = 3.5 }) => (
  <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#000000" opacity={0.3} />
);

const starPath = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? r * 0.45 : r;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${points.join(" L")} Z`;
};

/* --------------------------------------------------------------------------
 * Figure rig. Head centre sits at (0, -66) with the face 34 wide, so hair has
 * ~14 units of headroom inside the 96 box for spikes, horns or a blade. Light
 * comes from the upper left: the viewer's-right arm, leg, ear and a crescent
 * of the face take the shadow tone. Hair is authored in these head
 * coordinates and reused by the plush through PLUSH_HEAD.
 * ------------------------------------------------------------------------ */
const HEAD_CY = -66;

const Eyes = ({ iris, y = -64, gap = 6.5 }) => (
  <g>
    {[-gap, gap].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={y} rx={2.6} ry={3.4} fill={INK} />
        <ellipse cx={x} cy={y + 1} rx={1.8} ry={2.1} fill={iris} />
        <circle cx={x - 0.8} cy={y - 1.3} r={0.9} fill="#FFFFFF" />
      </g>
    ))}
  </g>
);

const FigureHead = ({ skin, blush = true }) => (
  <g>
    <rect x={-3.5} y={-53} width={7} height={8} fill={skin.shadow} />
    <circle cx={-16.8} cy={-64} r={3.2} fill={skin.base} />
    <circle cx={16.8} cy={-64} r={3.2} fill={skin.shadow} />
    <ellipse cx={0} cy={HEAD_CY} rx={17} ry={15.5} fill={skin.base} />
    <path d="M9 -79.2 A17 15.5 0 0 1 9 -52.8 Q14.5 -66 9 -79.2 Z" fill={skin.shadow} />
    {blush && (
      <g>
        <ellipse cx={-11} cy={-58.5} rx={2.8} ry={1.5} fill={BLUSH} opacity={0.35} />
        <ellipse cx={11} cy={-58.5} rx={2.8} ry={1.5} fill={BLUSH} opacity={0.35} />
      </g>
    )}
  </g>
);

// One arm: shoulder to hand as a round-capped stroke. "short" sleeves draw the
// skin arm first and a sleeve capsule over its top half; "hip" bends the arm
// so the hand rests on the waist.
const FigureArm = ({ side, s, broad, skin, sleeve, arms, cuffs, hands, pose }) => {
  const tone = side < 0 ? "base" : "shadow";
  const width = 7 + broad / 3;
  const sx = side * (s - 1.5 - broad * 0.2);
  const sy = -43 + broad * 0.15;
  const handR = 3.6 + broad * 0.2;
  if (pose === "hip") {
    const ex = side * (s + 7.5);
    const hx = side * (s - 0.5);
    return (
      <g>
        <path
          d={`M${sx} ${sy} L${ex} -35 L${hx} -26.5`}
          stroke={sleeve[tone]}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx={hx} cy={-26} r={handR} fill={(hands || skin)[tone]} />
      </g>
    );
  }
  const hx = side * (s + 5.5);
  const hy = -25.5;
  const at = (t) => [sx + (hx - sx) * t, sy + (hy - sy) * t];
  const [mx, my] = at(0.42);
  const [c1x, c1y] = at(0.74);
  const [c2x, c2y] = at(0.92);
  return (
    <g>
      <line
        x1={sx}
        y1={sy}
        x2={hx}
        y2={hy}
        stroke={arms === "long" ? sleeve[tone] : skin[tone]}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {arms === "short" && (
        <line x1={sx} y1={sy} x2={mx} y2={my} stroke={sleeve[tone]} strokeWidth={width + 0.6} strokeLinecap="round" />
      )}
      {cuffs && (
        <line x1={c1x} y1={c1y} x2={c2x} y2={c2y} stroke={cuffs[tone]} strokeWidth={width + 1} strokeLinecap="butt" />
      )}
      <circle cx={hx} cy={-23.5} r={handR} fill={(hands || skin)[tone]} />
    </g>
  );
};

const FigureBody = ({
  skin,
  top,
  sleeve = top,
  arms = "long",
  pants,
  shoes,
  skirt,
  broad = 0,
  cuffs,
  hands,
  leftPose,
  chest,
}) => {
  const s = 13 + broad;
  const w = 12 + broad * 0.7;
  const leg = 6.5 + broad / 2;
  const lw = 7 + broad / 2;
  return (
    <g>
      <rect x={-leg - lw / 2} y={-25} width={lw} height={22} fill={pants.base} />
      <rect x={leg - lw / 2} y={-25} width={lw} height={22} fill={pants.shadow} />
      <rect x={-leg - 6} y={-5.5} width={12} height={5.5} rx={2.7} fill={shoes.base} />
      <rect x={leg - 6} y={-5.5} width={12} height={5.5} rx={2.7} fill={shoes.shadow} />
      {shoes.highlight && (
        <rect x={-leg - 4.5} y={-5} width={6} height={1.4} rx={0.7} fill={shoes.highlight} />
      )}
      {skirt ? (
        <g>
          <path d={`M${-w} -28 L${w} -28 L${w + 4} -15 L${-w - 4} -15 Z`} fill={skirt.base} />
          <path d={`M${w - 5} -28 L${w} -28 L${w + 4} -15 L${w - 3} -15 Z`} fill={skirt.shadow} />
        </g>
      ) : (
        <path d={`M${-w} -27 L${w} -27 L${w + 0.5} -17 L${-w - 0.5} -17 Z`} fill={pants.base} />
      )}
      <path d={`M${-s} -46 Q${-s - 2} -34 ${-w} -21 L${w} -21 Q${s + 2} -34 ${s} -46 Q0 -50 ${-s} -46 Z`} fill={top.base} />
      <path d={`M${s} -46 Q${s + 2} -34 ${w} -21 L${w - 5} -21 Q${s - 2} -34 ${s - 4} -47.6 Z`} fill={top.shadow} />
      {chest}
      <FigureArm side={-1} s={s} broad={broad} skin={skin} sleeve={sleeve} arms={arms} cuffs={cuffs} hands={hands} pose={leftPose} />
      <FigureArm side={1} s={s} broad={broad} skin={skin} sleeve={sleeve} arms={arms} cuffs={cuffs} hands={hands} />
    </g>
  );
};

const ChibiFigure = ({ skin, blush, scale, shadowRx = 17, behind, hairBack, body, face, hairFront, front }) => (
  <g>
    <GroundShadow rx={shadowRx} />
    <g transform={scale ? `scale(${scale})` : undefined}>
      {behind}
      {hairBack}
      {body}
      <FigureHead skin={skin} blush={blush} />
      {face}
      {hairFront}
      {front}
    </g>
  </g>
);

/* --------------------------------------------------------------------------
 * Plush rig. A squat stuffed toy: a wide face (26 x 21) over a 24-wide bean
 * body, stubby feet, mitten hands, button eyes, a dashed seam down the belly
 * and a white tag stitched to the viewer's-right hip. Hair and horns reuse the
 * figure's shapes squashed by PLUSH_HEAD, which maps the figure face ellipse
 * onto the plush one — so each toy keeps its character's silhouette.
 * ------------------------------------------------------------------------ */
const PLUSH_HEAD = "translate(0 -29.5) scale(0.765 0.68) translate(0 66)";

const ButtonEyes = ({ ring }) => (
  <g>
    {[-5, 5].map((x) => (
      <g key={x}>
        {ring && <circle cx={x} cy={-28.5} r={2.9} fill={ring} />}
        <circle cx={x} cy={-28.5} r={2} fill={INK} />
        <circle cx={x - 0.7} cy={-29.2} r={0.65} fill="#FFFFFF" />
      </g>
    ))}
  </g>
);

const StitchSmile = () => (
  <path d="M-2.2 -24 Q0 -22.2 2.2 -24" stroke={INK} strokeWidth={1.1} fill="none" strokeLinecap="round" />
);

const PlushToy = ({
  skin,
  fabric,
  feet,
  hands = skin,
  broad = 0,
  scale,
  seamX = 0,
  eyeRing,
  mouth = <StitchSmile />,
  brows,
  behind,
  hairBack,
  chest,
  hairFront,
  front,
}) => {
  const b = broad;
  return (
    <g>
      <GroundShadow rx={14 + b} ry={3} />
      <g transform={scale ? `scale(${scale})` : undefined}>
        {behind}
        {hairBack && <g transform={PLUSH_HEAD}>{hairBack}</g>}
        <ellipse cx={-6 - b / 2} cy={-3.2} rx={5.5} ry={3.4} fill={feet.base} />
        <ellipse cx={6 + b / 2} cy={-3.2} rx={5.5} ry={3.4} fill={feet.shadow} />
        <path
          d={`M${-11 - b} -21 Q${-15 - b} -10 ${-11.5 - b} -3.5 Q0 0 ${11.5 + b} -3.5 Q${15 + b} -10 ${11 + b} -21 Q0 -24 ${-11 - b} -21 Z`}
          fill={fabric.base}
        />
        <path
          d={`M${11 + b} -21 Q${15 + b} -10 ${11.5 + b} -3.5 Q${9 + b} -2.4 ${7 + b} -2 Q${10.5 + b} -10 ${7 + b} -22 Z`}
          fill={fabric.shadow}
        />
        {chest}
        <line x1={seamX} y1={-19} x2={seamX} y2={-4} stroke={fabric.light} strokeWidth={1} strokeDasharray="2 2" />
        <rect x={10.5 + b} y={-8.5} width={4} height={6} rx={0.6} fill="#F8FAFC" />
        <rect x={12.5 + b} y={-8.5} width={2} height={6} fill="#CBD5E1" />
        <ellipse cx={-13.5 - b} cy={-12} rx={3.8} ry={5} fill={hands.base} transform={`rotate(20 ${-13.5 - b} -12)`} />
        <ellipse cx={13.5 + b} cy={-12} rx={3.8} ry={5} fill={hands.shadow} transform={`rotate(-20 ${13.5 + b} -12)`} />
        <ellipse cx={0} cy={-29.5} rx={13} ry={10.5} fill={skin.base} />
        <path d="M7 -38.35 A13 10.5 0 0 1 7 -20.65 Q11.5 -29.5 7 -38.35 Z" fill={skin.shadow} />
        <ellipse cx={-8.5} cy={-24.8} rx={2} ry={1.1} fill={BLUSH} opacity={0.4} />
        <ellipse cx={8.5} cy={-24.8} rx={2} ry={1.1} fill={BLUSH} opacity={0.4} />
        <ButtonEyes ring={eyeRing} />
        {brows}
        {mouth}
        {hairFront && <g transform={PLUSH_HEAD}>{hairFront}</g>}
        {front}
      </g>
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Denji — devil form, reduced to what reads at 50px: a chainsaw blade rising
 * out of the forehead, a shark-tooth grin, white shirt with a loose black tie,
 * and the starter pull-cord hanging off his chest.
 * ------------------------------------------------------------------------ */
const DENJI = {
  hair: { base: "#E0B04A", shadow: "#B0802C" },
  shirt: { base: "#F1F5F9", shadow: "#C3CBD6", light: "#9AA5B4" },
  slacks: { base: "#3A4150", shadow: "#272C37" },
  shoes: { base: "#2A2F3A", shadow: "#1A1E26", highlight: "#4A5262" },
  saw: { base: "#F97316", shadow: "#C2410C" },
  tie: "#1F2430",
};

const DenjiHair = () => (
  <g>
    <path
      d="M-18.5 -60 Q-22 -80 -10 -86 Q0 -90 10 -86 Q22 -80 18.5 -60 L16 -67 L13 -63 L10 -71 L5 -66 L1 -73 L-4 -66 L-8 -72 L-12 -64 L-15 -68 Z"
      fill={DENJI.hair.base}
    />
    <path d="M10 -86 Q22 -80 18.5 -60 L16 -67 L13 -63 L10 -71 Q15 -78 10 -86 Z" fill={DENJI.hair.shadow} />
    {/* blade, oversized on purpose, with teeth on both edges */}
    <path d="M-4 -80 L-4 -92 Q-4 -96 0 -96 Q4 -96 4 -92 L4 -80 Z" fill={BLADE.base} />
    <path d="M0 -96 Q4 -96 4 -92 L4 -80 L0 -80 Z" fill={BLADE.shadow} />
    {[-92.5, -89, -85.5].map((y) => (
      <g key={y}>
        <path d={`M-4 ${y} L-6.8 ${y + 1.5} L-4 ${y + 3} Z`} fill={BLADE.teeth} />
        <path d={`M4 ${y} L6.8 ${y + 1.5} L4 ${y + 3} Z`} fill={BLADE.teeth} />
      </g>
    ))}
    <path d="M-1.8 -82 L-1.8 -93" stroke={BLADE.teeth} strokeWidth={0.8} strokeDasharray="1.4 1.2" />
    {/* engine housing on the forehead */}
    <rect x={-7} y={-84} width={14} height={9.5} rx={2.4} fill={DENJI.saw.base} />
    <path d="M1 -84 L4.6 -84 Q7 -84 7 -81.6 L7 -76.9 Q7 -74.5 4.6 -74.5 L1 -74.5 Z" fill={DENJI.saw.shadow} />
    <rect x={-4.8} y={-81.5} width={4} height={1.3} rx={0.6} fill="#FDBA74" />
  </g>
);

const SharkGrin = ({ y = -58.5, half = 8 }) => (
  <g>
    <path d={`M${-half} ${y} Q0 ${y + 8} ${half} ${y} Z`} fill={INK} />
    <path
      d={`M${-half + 0.8} ${y + 0.3} L${-half * 0.7} ${y + 2.3} L${-half * 0.5} ${y + 0.7} L${-half * 0.3} ${y + 2.9} L${-half * 0.1} ${y + 0.9} L${half * 0.1} ${y + 2.9} L${half * 0.3} ${y + 0.9} L${half * 0.5} ${y + 2.6} L${half * 0.7} ${y + 0.7} L${half - 0.8} ${y + 0.3} Z`}
      fill="#FFFFFF"
    />
  </g>
);

const DenjiFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={DENJI.shirt}
        pants={DENJI.slacks}
        shoes={DENJI.shoes}
        chest={
          <g>
            <path d="M-6 -47.5 L-0.5 -46 L-3.5 -42 Z" fill={DENJI.shirt.shadow} />
            <path d="M6 -47.5 L0.5 -46 L3.5 -42 Z" fill={DENJI.shirt.shadow} />
            <path d="M-2.2 -46.5 L1.6 -46.5 L0.8 -43.6 L-1.2 -43.6 Z" fill={DENJI.tie} />
            <path d="M-1.2 -43.6 L0.8 -43.6 L0.2 -32 L-2.4 -29.5 L-3.6 -32.5 Z" fill={DENJI.tie} />
            {/* pull-cord and T-handle */}
            <path d="M6 -39 Q8.5 -35 7 -30.5" stroke={BLADE.teeth} strokeWidth={1} fill="none" />
            <rect x={3.8} y={-31} width={6.5} height={2.6} rx={1.3} fill={DENJI.saw.base} />
          </g>
        }
      />
    }
    face={
      <g>
        <Eyes iris="#B8892F" />
        <path d="M-10 -69.5 L-3.5 -68" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M10 -69.5 L3.5 -68" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
        <SharkGrin />
      </g>
    }
    hairFront={<DenjiHair />}
    front={
      <g>
        {/* forearm blades, angled out past the hands */}
        <path d="M-17.5 -31 L-21.5 -32 L-26 -15.5 Q-25 -12.5 -22.5 -14 Z" fill={BLADE.base} />
        <path d="M17.5 -31 L21.5 -32 L26 -15.5 Q25 -12.5 22.5 -14 Z" fill={BLADE.shadow} />
        {[-29, -24.5, -20].map((y) => {
          const edge = 21.5 + (y + 32) * 0.27;
          return (
            <g key={y}>
              <path d={`M${-edge} ${y} L${-edge - 2.6} ${y + 0.9} L${-edge - 0.7} ${y + 2.6} Z`} fill={BLADE.teeth} />
              <path d={`M${edge} ${y} L${edge + 2.6} ${y + 0.9} L${edge + 0.7} ${y + 2.6} Z`} fill={BLADE.teeth} />
            </g>
          );
        })}
        <circle cx={-18.5} cy={-23.5} r={3.6} fill={SKIN.fair.base} />
        <circle cx={18.5} cy={-23.5} r={3.6} fill={SKIN.fair.shadow} />
      </g>
    }
  />
);

const DenjiPlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={DENJI.shirt}
    feet={DENJI.slacks}
    seamX={-6}
    mouth={<SharkGrin y={-24.5} half={4.2} />}
    chest={
      <g>
        <path d="M-1.4 -21.5 L1.4 -21.5 L0.8 -19.4 L-0.8 -19.4 Z" fill={DENJI.tie} />
        <path d="M-0.8 -19.4 L0.8 -19.4 L0.6 -11 L-1 -9.2 L-2 -11.4 Z" fill={DENJI.tie} />
        <path d="M5 -18 Q7 -15 6 -12" stroke={BLADE.teeth} strokeWidth={0.9} fill="none" />
        <rect x={3.4} y={-12.5} width={5.2} height={2.2} rx={1.1} fill={DENJI.saw.base} />
      </g>
    }
    hairFront={<DenjiHair />}
  />
);

/* --------------------------------------------------------------------------
 * Power — long pink-blonde hair falling in front of the shoulders, two red
 * horns, a fanged grin and amber eyes with cross pupils, in a blue-grey jacket
 * over a white shirt.
 * ------------------------------------------------------------------------ */
const POWER = {
  hair: { base: "#F3B0BE", shadow: "#CF7F93" },
  horn: { base: "#E0312F", shadow: "#A11D1D" },
  jacket: { base: "#5E7391", shadow: "#455772", light: "#8FA2BD" },
  shirt: "#F1F5F9",
  pants: { base: "#323A4A", shadow: "#222834" },
  shoes: { base: "#4A3426", shadow: "#33231A" },
};

const PowerHairBack = () => (
  <g>
    <path
      d="M-19 -72 Q-25 -52 -22 -34 Q-17 -32 -13 -36 L13 -36 Q17 -32 22 -34 Q25 -52 19 -72 Z"
      fill={POWER.hair.shadow}
    />
  </g>
);

const PowerHairFront = () => (
  <g>
    {/* horns first so the hair cap overlaps their roots */}
    <path d="M-12 -83 Q-15 -91 -12.5 -96 Q-7.5 -92 -6 -85 Z" fill={POWER.horn.base} />
    <path d="M12 -83 Q15 -91 12.5 -96 Q7.5 -92 6 -85 Z" fill={POWER.horn.shadow} />
    <path
      d="M-19.5 -58 Q-22 -86 0 -87 Q22 -86 19.5 -58 L17 -66 L14 -61 L11.5 -72 L6.5 -66 L2 -74 L-2 -67 L-7 -73 L-11 -65 L-14 -71 L-17 -62 Z"
      fill={POWER.hair.base}
    />
    <path d="M9 -86 Q22 -83 19.5 -58 L17 -66 L14 -61 L11.5 -72 Q14 -79 9 -86 Z" fill={POWER.hair.shadow} />
    {/* locks falling in front of the shoulders */}
    <path d="M-19.5 -66 Q-23 -50 -20 -36 L-15.5 -40 Q-15 -54 -14 -66 Z" fill={POWER.hair.base} />
    <path d="M19.5 -66 Q23 -50 20 -36 L15.5 -40 Q15 -54 14 -66 Z" fill={POWER.hair.shadow} />
  </g>
);

const CrossPupils = ({ y = -64, gap = 6.5, arm = 1.5, width = 0.9 }) => (
  <g>
    {[-gap, gap].map((x) => (
      <g key={x}>
        <path d={`M${x - arm} ${y + 1} L${x + arm} ${y + 1}`} stroke="#C2410C" strokeWidth={width} />
        <path d={`M${x} ${y - 0.5} L${x} ${y + 2.6}`} stroke="#C2410C" strokeWidth={width} />
      </g>
    ))}
  </g>
);

const PowerFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    hairBack={<PowerHairBack />}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={POWER.jacket}
        pants={POWER.pants}
        shoes={POWER.shoes}
        chest={
          <g>
            <path d="M-4.5 -47.5 L4.5 -47.5 L3 -21 L-3 -21 Z" fill={POWER.shirt} />
            <path d="M1.5 -47.5 L4.5 -47.5 L3 -21 L1 -21 Z" fill="#C3CBD6" />
          </g>
        }
      />
    }
    face={
      <g>
        <Eyes iris="#FACC15" />
        <CrossPupils />
        <path d="M-5.5 -58.5 Q0 -52 5.5 -58.5 Z" fill={INK} />
        <path d="M-4.8 -58.3 L4.8 -58.3 L3.6 -57 L2.6 -58 L-2.6 -58 L-3.6 -56.4 Z" fill="#FFFFFF" />
      </g>
    }
    hairFront={<PowerHairFront />}
  />
);

const PowerPlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={POWER.jacket}
    feet={POWER.pants}
    seamX={-6.5}
    eyeRing="#FACC15"
    mouth={
      <g>
        <path d="M-3 -24.6 Q0 -21 3 -24.6 Z" fill={INK} />
        <path d="M-2.5 -24.5 L-1.6 -23.2 L-0.8 -24.4 Z" fill="#FFFFFF" />
        <path d="M2.5 -24.5 L1.6 -23.2 L0.8 -24.4 Z" fill="#FFFFFF" />
      </g>
    }
    hairBack={<PowerHairBack />}
    chest={
      <g>
        <path d="M-3 -22 L3 -22 L2.2 -4 L-2.2 -4 Z" fill={POWER.shirt} />
        <path d="M1 -22 L3 -22 L2.2 -4 L0.8 -4 Z" fill="#C3CBD6" />
      </g>
    }
    hairFront={<PowerHairFront />}
  />
);

/* --------------------------------------------------------------------------
 * Reze — a short purple-black bob with a blunt fringe, green eyes, a black
 * choker with a grenade-pin ring hanging from it, a dark top and skirt, and
 * the small white flower she hands Denji.
 * ------------------------------------------------------------------------ */
const REZE = {
  hair: { base: "#3E3052", shadow: "#241B31", highlight: "#6D5A8C" },
  top: { base: "#3B3656", shadow: "#27233B", light: "#6C6690" },
  skirt: { base: "#2A2740", shadow: "#1B1929" },
  shoes: { base: "#2B2638", shadow: "#1C1826", highlight: "#4F4863" },
  choker: "#14121C",
  pin: "#D5DBE3",
};

const RezeHairBack = () => (
  <path d="M-20.5 -72 Q-23 -56 -19 -49 L19 -49 Q23 -56 20.5 -72 Z" fill={REZE.hair.shadow} />
);

const RezeHairFront = () => (
  <g>
    <path
      d="M-20.5 -50 Q-24 -86 0 -87 Q24 -86 20.5 -50 Q17 -52 15.5 -57 L15 -70 Q8 -71.5 0 -70.5 Q-8 -71.5 -15 -70 L-15.5 -57 Q-17 -52 -20.5 -50 Z"
      fill={REZE.hair.base}
    />
    <path d="M9 -86 Q24 -84 20.5 -50 Q17 -52 15.5 -57 L15 -70 Q13 -79 9 -86 Z" fill={REZE.hair.shadow} />
    <path d="M-13 -79 Q-5 -84.5 4 -84 Q-4 -81.5 -11 -76.5 Z" fill={REZE.hair.highlight} />
  </g>
);

const RezeFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    hairBack={<RezeHairBack />}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={REZE.top}
        pants={SKIN.fair}
        skirt={REZE.skirt}
        shoes={REZE.shoes}
        chest={<path d="M-6 -47.4 Q0 -43 6 -47.4 Q0 -45 -6 -47.4 Z" fill={REZE.top.light} />}
      />
    }
    face={
      <g>
        <Eyes iris="#22C55E" />
        <path d="M-2.5 -57.5 Q0 -55.5 2.5 -57.5" stroke={INK} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      </g>
    }
    hairFront={<RezeHairFront />}
    front={
      <g>
        <rect x={-3.8} y={-50} width={7.6} height={2.4} rx={0.8} fill={REZE.choker} />
        <circle cx={0.6} cy={-45.2} r={1.8} stroke={REZE.pin} strokeWidth={0.9} fill="none" />
        {/* flower held in the left hand */}
        <path d="M-18.5 -24 L-19 -31" stroke="#15803D" strokeWidth={1} />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle
            key={a}
            cx={-19 + 2 * Math.cos((a * Math.PI) / 180)}
            cy={-32.5 + 2 * Math.sin((a * Math.PI) / 180)}
            r={1.5}
            fill={a > 100 && a < 260 ? "#F8FAFC" : "#D5DBE3"}
          />
        ))}
        <circle cx={-19} cy={-32.5} r={1} fill="#FACC15" />
      </g>
    }
  />
);

const RezePlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={REZE.top}
    feet={REZE.skirt}
    seamX={-5}
    eyeRing="#22C55E"
    hairBack={<RezeHairBack />}
    hairFront={<RezeHairFront />}
    front={
      <g>
        <rect x={-3.5} y={-20.8} width={7} height={1.8} rx={0.6} fill={REZE.choker} />
        <circle cx={0.5} cy={-17.2} r={1.5} stroke={REZE.pin} strokeWidth={0.8} fill="none" />
      </g>
    }
  />
);

/* --------------------------------------------------------------------------
 * Bomb Devil — Reze with her head swapped for a round gunmetal bomb: plated
 * seams, rivets, a lit wick and a puff of smoke, over the same green eyes. The
 * head is dark, so it sits on a lighter rim ellipse and its seams carry a lit
 * edge — that is what keeps it off the night backdrop. The grenade-pin ring on
 * the choker is drawn big on purpose; she holds a little blast-flower where
 * Reze holds her white one.
 * ------------------------------------------------------------------------ */
const BOMB = {
  metal: { base: "#4B5466", shadow: "#323846", highlight: "#8E99AD" },
  dress: { base: "#312F3A", shadow: "#1F1E26", light: "#6E6C7E" },
  boots: { base: "#2B2931", shadow: "#1C1B21", highlight: "#55525F" },
  choker: "#101014",
  pin: { base: "#E2E8F0", shadow: "#9AA5B4" },
  wick: "#C19A66",
  spark: { base: "#FACC15", shadow: "#F97316" },
  smoke: { base: "#B4BDC9", shadow: "#8792A2" },
};

const burstPath = (cx, cy, r, points = 8) => {
  const out = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 ? r * 0.5 : r;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${out.join(" L")} Z`;
};

const BombHead = () => (
  <g>
    {/* smoke puffs trail off behind the wick */}
    <circle cx={-9} cy={-88.5} r={2.4} fill={BOMB.smoke.shadow} />
    <circle cx={-12.5} cy={-91.5} r={1.7} fill={BOMB.smoke.base} />
    <circle cx={-7} cy={-91} r={1.8} fill={BOMB.smoke.base} />
    <ellipse cx={0} cy={-68} rx={20.8} ry={17.5} fill={BOMB.metal.highlight} />
    <ellipse cx={0.7} cy={-67.5} rx={20} ry={16.9} fill={BOMB.metal.base} />
    <path d="M8 -83 A16.6 15.8 0 0 1 8 -53 Q14 -68 8 -83 Z" fill={BOMB.metal.shadow} />
    {/* plate seams, each with a lit lower edge */}
    <path d="M-18.6 -75 Q0 -69.5 18.8 -75" stroke={INK} strokeWidth={1.2} fill="none" />
    <path d="M-18.2 -73.8 Q0 -68.3 18.4 -73.8" stroke={BOMB.metal.highlight} strokeWidth={0.8} fill="none" />
    <path d="M-1 -84.8 Q-3.5 -79 -2.8 -72.5" stroke={INK} strokeWidth={1.2} fill="none" />
    <path d="M0.2 -84.6 Q-2.3 -79 -1.6 -72.4" stroke={BOMB.metal.highlight} strokeWidth={0.7} fill="none" />
    {[-14, -8, 8, 14].map((x) => (
      <circle key={x} cx={x} cy={-71.4 - Math.abs(x) * 0.05} r={0.85} fill={BOMB.metal.highlight} />
    ))}
    <path d="M-15 -79 Q-11 -83.5 -5 -84.5 Q-10 -81.5 -13 -77 Z" fill={BOMB.metal.highlight} />
    {/* fuse cap, wick and spark */}
    <rect x={-4} y={-88.5} width={8} height={4.5} rx={1.2} fill={BOMB.metal.base} />
    <rect x={0.5} y={-88.5} width={3.5} height={4.5} rx={1} fill={BOMB.metal.shadow} />
    <rect x={-3.2} y={-88} width={3} height={1} rx={0.5} fill={BOMB.metal.highlight} />
    <path d="M0 -88.5 Q-0.8 -91 2.4 -92.2" stroke={BOMB.wick} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    <path d={starPath(3.4, -93.1, 2.8)} fill={BOMB.spark.base} />
    <circle cx={3.4} cy={-92.8} r={0.9} fill={BOMB.spark.shadow} />
    <circle cx={8.2} cy={-90.5} r={0.7} fill={BOMB.spark.base} />
    <circle cx={7} cy={-95} r={0.55} fill={BOMB.spark.base} />
    {/* face: lit sockets so the eyes read on the dark metal */}
    {[-6.5, 6.5].map((x) => (
      <ellipse key={x} cx={x} cy={-64} rx={3.5} ry={4.3} fill={BOMB.metal.highlight} />
    ))}
    <Eyes iris="#22C55E" />
    <ellipse cx={-12} cy={-58.5} rx={2.8} ry={1.5} fill={BLUSH} opacity={0.5} />
    <ellipse cx={12} cy={-58.5} rx={2.8} ry={1.5} fill={BLUSH} opacity={0.5} />
    <path d="M-2.5 -57.5 Q0 -55.5 2.5 -57.5" stroke={BOMB.metal.highlight} strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </g>
);

const BombDevilFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    blush={false}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={BOMB.dress}
        arms="bare"
        pants={SKIN.fair}
        skirt={BOMB.dress}
        shoes={BOMB.boots}
        chest={
          <g>
            <path d="M-6.5 -47.4 Q0 -43 6.5 -47.4 Q0 -45 -6.5 -47.4 Z" fill={BOMB.dress.light} />
            <path d="M-12 -42 Q-12.5 -33 -10.5 -24" stroke={BOMB.dress.light} strokeWidth={1.2} fill="none" opacity={0.6} />
          </g>
        }
      />
    }
    hairFront={<BombHead />}
    front={
      <g>
        {/* boot shafts over the shins */}
        <rect x={-10} y={-12} width={7} height={8} fill={BOMB.boots.base} />
        <rect x={3} y={-12} width={7} height={8} fill={BOMB.boots.shadow} />
        <rect x={-10} y={-12} width={7} height={1.2} fill={BOMB.boots.highlight} />
        {/* choker with the grenade pin: split pin across the band, ring below */}
        <rect x={-4.5} y={-50.4} width={9} height={2.8} rx={0.9} fill={BOMB.choker} />
        <path d="M-1.5 -49 L3 -49" stroke={BOMB.pin.shadow} strokeWidth={0.9} strokeLinecap="round" />
        <circle cx={2.5} cy={-43.6} r={3} stroke={BOMB.pin.base} strokeWidth={1.3} fill="none" />
        <path d="M5.1 -45 A3 3 0 0 1 3.6 -40.8" stroke={BOMB.pin.shadow} strokeWidth={1.3} fill="none" />
        {/* blast-flower on a wick stem, held in the left hand */}
        <path d="M-18.5 -24 L-19 -30" stroke={BOMB.wick} strokeWidth={1} />
        <path d={burstPath(-19, -32.5, 3.8)} fill={BOMB.spark.shadow} />
        <circle cx={-19} cy={-32.5} r={1.4} fill={BOMB.spark.base} />
      </g>
    }
  />
);

const BombDevilPlush = () => (
  <PlushToy
    skin={BOMB.metal}
    hands={SKIN.fair}
    fabric={BOMB.dress}
    feet={BOMB.boots}
    seamX={-5}
    eyeRing="#22C55E"
    mouth={<path d="M-2.2 -24 Q0 -22.2 2.2 -24" stroke={BOMB.metal.highlight} strokeWidth={1.1} fill="none" strokeLinecap="round" />}
    behind={<ellipse cx={-0.5} cy={-30} rx={13.7} ry={11.2} fill={BOMB.metal.highlight} />}
    front={
      <g>
        {/* base-tone rim on the shadow side, dashed felt seam, felt fuse, spark and puff */}
        <path d="M9.2 -37.1 A13 10.5 0 0 1 9.2 -21.9" stroke={BOMB.metal.base} strokeWidth={1} fill="none" />
        <circle cx={-5.5} cy={-42.6} r={1.7} fill={BOMB.smoke.shadow} />
        <circle cx={-8} cy={-44.8} r={1.2} fill={BOMB.smoke.base} />
        <path d="M-11.8 -34.5 Q0 -31 11.8 -34.5" stroke={BOMB.metal.highlight} strokeWidth={1} strokeDasharray="2 2" fill="none" />
        <rect x={-2.8} y={-42.8} width={5.6} height={3.6} rx={1} fill={BOMB.metal.base} />
        <path d="M0 -42.8 Q-0.5 -45 1.8 -46" stroke={BOMB.wick} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <path d={starPath(2.8, -46.6, 2.4)} fill={BOMB.spark.base} />
        {/* ribbon choker with the pin ring */}
        <path d="M-3.6 -20.4 L-6.6 -17.2 L-4.6 -16.6 L-2.6 -19.6 Z" fill={BOMB.dress.light} />
        <rect x={-4.5} y={-21.2} width={9} height={2.2} rx={0.7} fill={BOMB.choker} />
        <rect x={-4} y={-21.2} width={8} height={0.7} rx={0.35} fill={BOMB.dress.light} />
        <circle cx={1} cy={-16.4} r={2.2} stroke={BOMB.pin.base} strokeWidth={1} fill="none" />
      </g>
    }
  />
);

/* --------------------------------------------------------------------------
 * Reacher — the biggest figure in the set: the shared rig scaled up with a
 * broader chest and fists. Sandy crop, flat brows, a straight-line mouth, dark
 * grey tee and jeans. The plush is the same bean body, just wider.
 * ------------------------------------------------------------------------ */
const REACHER = {
  hair: { base: "#B48A5A", shadow: "#8A6540" },
  brow: "#6E4F30",
  tee: { base: "#4A5260", shadow: "#353B47", light: "#727B8B" },
  jeans: { base: "#3D5F8F", shadow: "#2B466B" },
  boots: { base: "#6B4A2E", shadow: "#4A3220", highlight: "#8C6A48" },
};

const ReacherHair = () => (
  <g>
    <path
      d="M-17.8 -62 Q-19.5 -86 0 -86.5 Q19.5 -86 17.8 -62 Q16.5 -72 11 -75.5 Q3 -73 -4 -76.5 Q-13 -75.5 -17.8 -62 Z"
      fill={REACHER.hair.base}
    />
    <path d="M8 -85.5 Q19.5 -83 17.8 -62 Q16.5 -72 11 -75.5 Q12 -80 8 -85.5 Z" fill={REACHER.hair.shadow} />
  </g>
);

const StraightFace = ({ y = 0 }) => (
  <g transform={y ? `translate(0 ${y})` : undefined}>
    <path d="M-10 -69.5 L-3.5 -69" stroke={REACHER.brow} strokeWidth={2} strokeLinecap="round" />
    <path d="M10 -69.5 L3.5 -69" stroke={REACHER.brow} strokeWidth={2} strokeLinecap="round" />
    <path d="M-3.5 -57 L3.5 -57" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
  </g>
);

const ReacherFigure = () => (
  <ChibiFigure
    skin={SKIN.light}
    blush={false}
    scale={1.14}
    shadowRx={21}
    body={
      <FigureBody
        skin={SKIN.light}
        top={REACHER.tee}
        arms="short"
        broad={4}
        pants={REACHER.jeans}
        shoes={REACHER.boots}
        chest={<path d="M-5.5 -48 Q0 -43.5 5.5 -48 Q0 -45.5 -5.5 -48 Z" fill={REACHER.tee.shadow} />}
      />
    }
    face={
      <g>
        <Eyes iris="#5B7A99" />
        <StraightFace />
      </g>
    }
    hairFront={<ReacherHair />}
  />
);

const ReacherPlush = () => (
  <PlushToy
    skin={SKIN.light}
    fabric={REACHER.tee}
    feet={REACHER.jeans}
    broad={2.5}
    seamX={-5}
    brows={
      <g>
        <path d="M-7.5 -32.6 L-2.8 -32.3" stroke={REACHER.brow} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M7.5 -32.6 L2.8 -32.3" stroke={REACHER.brow} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    }
    mouth={<path d="M-2.2 -23.8 L2.2 -23.8" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />}
    hairFront={<ReacherHair />}
  />
);

/* --------------------------------------------------------------------------
 * Neagley — dark hair slicked back into a ponytail, a raised brow and a
 * one-sided smirk, black leather jacket with lit lapels (so it still reads on
 * the night backdrop) and one hand on her hip.
 * ------------------------------------------------------------------------ */
const NEAGLEY = {
  hair: { base: "#2F221C", shadow: "#17100C", highlight: "#5A463C" },
  jacket: { base: "#30303A", shadow: "#1C1C23", light: "#6A6A7A" },
  tee: "#A7AEB9",
  jeans: { base: "#2F3B52", shadow: "#212A3B" },
  boots: { base: "#1F1F26", shadow: "#131318", highlight: "#454552" },
};

const NeagleyHairBack = () => (
  <path d="M13 -80 Q27 -76 24.5 -62 Q23 -53 26 -45 Q17 -47 16.5 -58 Q16 -67 11 -73 Z" fill={NEAGLEY.hair.shadow} />
);

const NeagleyHairFront = () => (
  <g>
    <path
      d="M-18 -61 Q-20 -86.5 0 -86.5 Q20 -86.5 18 -61 Q17 -72 12 -77 Q2 -80 -6 -77.5 Q-15 -74 -18 -61 Z"
      fill={NEAGLEY.hair.base}
    />
    <path d="M8 -86 Q20 -84 18 -61 Q17 -72 12 -77 Q12 -82 8 -86 Z" fill={NEAGLEY.hair.shadow} />
    <path d="M-14 -76 Q-8 -84 3 -84.5 Q-6 -81.5 -12 -73 Z" fill={NEAGLEY.hair.highlight} />
  </g>
);

const NeagleyFigure = () => (
  <ChibiFigure
    skin={SKIN.medium}
    hairBack={<NeagleyHairBack />}
    body={
      <FigureBody
        skin={SKIN.medium}
        top={NEAGLEY.jacket}
        pants={NEAGLEY.jeans}
        shoes={NEAGLEY.boots}
        leftPose="hip"
        chest={
          <g>
            <path d="M-4 -47.5 L4 -47.5 L1.5 -30 L-1.5 -30 Z" fill={NEAGLEY.tee} />
            <path d="M-8 -47 L-3.5 -47.5 L-1.2 -31 L-6 -38 Z" fill={NEAGLEY.jacket.light} />
            <path d="M8 -47 L3.5 -47.5 L1.2 -31 L6 -38 Z" fill={NEAGLEY.jacket.base} />
            <path d="M-11 -42 Q-11.5 -33 -9.5 -25" stroke={NEAGLEY.jacket.light} strokeWidth={1.2} fill="none" opacity={0.6} />
          </g>
        }
      />
    }
    face={
      <g>
        <Eyes iris="#5A3A22" />
        <path d="M-10 -71 Q-6.5 -73 -3.5 -70.5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <path d="M10 -69.5 L3.5 -69" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
        <path d="M-3 -57.2 Q1 -55.6 4.5 -59" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </g>
    }
    hairFront={<NeagleyHairFront />}
  />
);

const NeagleyPlush = () => (
  <PlushToy
    skin={SKIN.medium}
    fabric={NEAGLEY.jacket}
    feet={NEAGLEY.jeans}
    seamX={-6}
    brows={
      <g>
        <path d="M-7.5 -33.4 Q-5 -35 -2.8 -33" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
        <path d="M7.5 -32.6 L2.8 -32.3" stroke={INK} strokeWidth={1} strokeLinecap="round" />
      </g>
    }
    mouth={<path d="M-2 -23.8 Q0.8 -22.6 3 -25" stroke={INK} strokeWidth={1.1} fill="none" strokeLinecap="round" />}
    hairBack={<NeagleyHairBack />}
    chest={
      <g>
        <path d="M-2.8 -22 L2.8 -22 L1 -12 L-1 -12 Z" fill={NEAGLEY.tee} />
        <path d="M-6 -21.5 L-2.5 -22 L-0.8 -12.5 L-4.5 -16 Z" fill={NEAGLEY.jacket.light} />
      </g>
    }
    hairFront={<NeagleyHairFront />}
  />
);

/* --------------------------------------------------------------------------
 * Roscoe — dark curls built from overlapping circles down to the shoulders,
 * a khaki police shirt with epaulettes, a gold star badge and a duty belt.
 * ------------------------------------------------------------------------ */
const ROSCOE = {
  hair: { base: "#3E2618", shadow: "#24150C", highlight: "#654130" },
  shirt: { base: "#CDB27A", shadow: "#A38A52", light: "#E6D3A6" },
  pants: { base: "#4F4636", shadow: "#383226" },
  shoes: { base: "#1F2129", shadow: "#14151B", highlight: "#434654" },
  badge: { base: "#FACC15", shadow: "#CA8A04" },
  belt: "#1F2430",
};

const RoscoeHairBack = () => (
  <g fill={ROSCOE.hair.shadow}>
    <ellipse cx={0} cy={-68} rx={21} ry={19} />
    <circle cx={-18} cy={-57} r={6} />
    <circle cx={-18.5} cy={-49} r={5} />
    <circle cx={18} cy={-57} r={6} />
    <circle cx={18.5} cy={-49} r={5} />
  </g>
);

const RoscoeHairFront = () => (
  <g>
    <g fill={ROSCOE.hair.base}>
      <ellipse cx={0} cy={-79} rx={17} ry={8} />
      <circle cx={-17} cy={-71} r={4.8} />
      <circle cx={-12} cy={-76} r={5} />
      <circle cx={-5} cy={-78.5} r={5} />
      <circle cx={2.5} cy={-78.5} r={5} />
      <circle cx={-19.5} cy={-63} r={4.2} />
      <circle cx={-20} cy={-55} r={3.8} />
    </g>
    <g fill={ROSCOE.hair.shadow}>
      <circle cx={9.5} cy={-77} r={5} />
      <circle cx={16} cy={-71} r={4.8} />
      <circle cx={19.5} cy={-63} r={4.2} />
      <circle cx={20} cy={-55} r={3.8} />
    </g>
    <circle cx={-10} cy={-83} r={2.6} fill={ROSCOE.hair.highlight} />
    <circle cx={-3} cy={-85} r={2.2} fill={ROSCOE.hair.highlight} />
  </g>
);

const RoscoeFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    hairBack={<RoscoeHairBack />}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={ROSCOE.shirt}
        pants={ROSCOE.pants}
        shoes={ROSCOE.shoes}
        chest={
          <g>
            <path d="M-5 -48 L0 -42 L5 -48 Z" fill={ROSCOE.shirt.shadow} />
            <rect x={-13} y={-47} width={6} height={2.4} rx={1} fill={ROSCOE.shirt.shadow} />
            <rect x={7} y={-47} width={6} height={2.4} rx={1} fill={ROSCOE.shirt.shadow} />
            <path d="M3.5 -38 L9 -38" stroke={ROSCOE.shirt.shadow} strokeWidth={1.2} />
            <path d={starPath(-6.5, -37.5, 3.4)} fill={ROSCOE.badge.base} />
            <path d="M-6.5 -40.9 L-5.5 -38.4 L-3.3 -38.5 L-5.9 -36.8 L-4.9 -34.7 L-6.5 -36 Z" fill={ROSCOE.badge.shadow} />
            <rect x={-12.3} y={-24.5} width={24.6} height={3.5} fill={ROSCOE.belt} />
            <rect x={-1.8} y={-24.5} width={3.6} height={3.5} rx={0.6} fill="#CBD5E1" />
          </g>
        }
      />
    }
    face={
      <g>
        <Eyes iris="#6B4A2E" />
        <path d="M-2.8 -57.8 Q0 -55 2.8 -57.8" stroke={INK} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      </g>
    }
    hairFront={<RoscoeHairFront />}
  />
);

const RoscoePlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={ROSCOE.shirt}
    feet={ROSCOE.pants}
    seamX={5}
    hairBack={<RoscoeHairBack />}
    chest={
      <g>
        <path d="M-3.5 -22 L0 -18 L3.5 -22 Z" fill={ROSCOE.shirt.shadow} />
        <path d={starPath(-5, -14, 3)} fill={ROSCOE.badge.base} />
        <rect x={-13.5} y={-7.5} width={27} height={2.6} fill={ROSCOE.belt} />
      </g>
    }
    hairFront={<RoscoeHairFront />}
  />
);

/* --------------------------------------------------------------------------
 * Goku and Kid Goku — a crown of black spikes (lit with a blue-grey highlight
 * so it survives the night backdrop), orange gi with a blue undershirt, blue
 * wristbands, sash and boots. Kid Goku is the same build at 80% with his
 * monkey tail and the red Power Pole slung across his back.
 * ------------------------------------------------------------------------ */
const SPIKY_HAIR = { base: "#262633", shadow: "#14141C", highlight: "#4A516B" };

const GOKU = {
  gi: { base: "#F7801E", shadow: "#C85A0C", light: "#FFB066" },
  under: { base: "#2350C8", shadow: "#173A96" },
  boots: { base: "#2350C8", shadow: "#173A96", highlight: "#5C83E6" },
  tail: "#8A5A2E",
  pole: { base: "#D42A2A", cap: "#F2B705" },
};

const GokuHair = () => (
  <g>
    <path
      d="M-17 -60 L-26 -65 L-20 -72 L-26 -80 L-17.5 -81 L-20.5 -92 L-10 -85.5 L-5.5 -96 L1 -86.5 L9 -95 L11.5 -84.5 L22 -89 L18.5 -78 L26 -73.5 L18.5 -69.5 L17 -60 L12.5 -73 L8 -66.5 L5 -74.5 L1 -65 L-3 -73.5 L-8 -66 L-10.5 -74 L-15 -67 Z"
      fill={SPIKY_HAIR.base}
    />
    <path
      d="M9 -95 L11.5 -84.5 L22 -89 L18.5 -78 L26 -73.5 L18.5 -69.5 L17 -60 L12.5 -73 L8 -80 Z"
      fill={SPIKY_HAIR.shadow}
    />
    <path d="M-17.5 -81 L-20.5 -92 L-10 -85.5 L-5.5 -96 L-3 -88 L-12 -82 Z" fill={SPIKY_HAIR.highlight} />
  </g>
);

const GokuSmile = () => (
  <g>
    <path d="M-4.5 -58.5 Q0 -52 4.5 -58.5 Z" fill={INK} />
    <path d="M-2.2 -55.2 Q0 -57 2.2 -55.2 Q0 -54.2 -2.2 -55.2 Z" fill="#F87171" />
  </g>
);

const GokuBody = () => (
  <FigureBody
    skin={SKIN.fair}
    top={GOKU.gi}
    sleeve={GOKU.under}
    arms="short"
    cuffs={GOKU.under}
    pants={GOKU.gi}
    shoes={GOKU.boots}
    chest={
      <g>
        <path d="M-6 -47.5 L6 -47.5 L0 -37.5 Z" fill={GOKU.under.base} />
        <circle cx={-8} cy={-40} r={2.5} fill="#F8FAFC" />
        <path d="M-8.8 -40.8 L-7.2 -40.8 M-8 -41.6 L-8 -38.9" stroke={INK} strokeWidth={0.6} />
        <rect x={-12.5} y={-25} width={25} height={3.8} fill={GOKU.under.base} />
        <path d="M-6 -21.5 L-8.5 -14 L-5 -14.5 Z" fill={GOKU.under.shadow} />
      </g>
    }
  />
);

const GokuFace = () => (
  <g>
    <Eyes iris="#3B3B4A" />
    <path d="M-9.5 -70 L-4 -69.3" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
    <path d="M9.5 -70 L4 -69.3" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
    <GokuSmile />
  </g>
);

const GokuFigure = () => (
  <ChibiFigure skin={SKIN.fair} body={<GokuBody />} face={<GokuFace />} hairFront={<GokuHair />} />
);

const GokuPlushChest = () => (
  <g>
    <path d="M-4 -22 L4 -22 L0 -15 Z" fill={GOKU.under.base} />
    <circle cx={-6} cy={-16} r={2} fill="#F8FAFC" />
    <rect x={-13.5} y={-8} width={27} height={2.8} fill={GOKU.under.base} />
  </g>
);

const GokuPlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={GOKU.gi}
    feet={GOKU.boots}
    seamX={5}
    mouth={<path d="M-2.4 -24.4 Q0 -20.8 2.4 -24.4 Z" fill={INK} />}
    chest={<GokuPlushChest />}
    hairFront={<GokuHair />}
  />
);

const PowerPole = () => (
  <g>
    <path d="M-21 -14 L21 -60" stroke={GOKU.pole.base} strokeWidth={3.6} />
    <path d="M-21 -14 L-18.6 -16.6" stroke={GOKU.pole.cap} strokeWidth={3.8} />
    <path d="M21 -60 L18.6 -57.4" stroke={GOKU.pole.cap} strokeWidth={3.8} />
  </g>
);

const MonkeyTail = () => (
  <path
    d="M7 -22 Q25 -18 24 -32 Q23 -41 16 -38"
    stroke={GOKU.tail}
    strokeWidth={3.4}
    fill="none"
    strokeLinecap="round"
  />
);

const YoungGokuFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    scale={0.8}
    shadowRx={14}
    behind={
      <g>
        <PowerPole />
        <MonkeyTail />
      </g>
    }
    body={<GokuBody />}
    face={<GokuFace />}
    hairFront={<GokuHair />}
  />
);

const YoungGokuPlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={GOKU.gi}
    feet={GOKU.boots}
    scale={0.86}
    seamX={5}
    mouth={<path d="M-2.4 -24.4 Q0 -20.8 2.4 -24.4 Z" fill={INK} />}
    behind={
      <g>
        <path d="M-18 -4 L19 -29" stroke={GOKU.pole.base} strokeWidth={3} />
        <path d="M-18 -4 L-15.7 -5.6" stroke={GOKU.pole.cap} strokeWidth={3.2} />
        <path d="M19 -29 L16.7 -27.4" stroke={GOKU.pole.cap} strokeWidth={3.2} />
        <path d="M8 -6 Q20 -4 19 -14 Q18 -20 13.5 -18" stroke={GOKU.tail} strokeWidth={2.8} fill="none" strokeLinecap="round" />
      </g>
    }
    chest={<GokuPlushChest />}
    hairFront={<GokuHair />}
  />
);

/* --------------------------------------------------------------------------
 * Vegeta — the tall upswept flame of hair with a sharp widow's peak, a scowl
 * made by clipping the tops of the eyes under angled brows, blue bodysuit,
 * white chest armour with yellow shoulder pads, white gloves and boots.
 * ------------------------------------------------------------------------ */
const VEGETA = {
  suit: { base: "#2B4DB0", shadow: "#1D3680", light: "#5B7BD6" },
  armour: { base: "#F1F5F9", shadow: "#C3CBD6" },
  pads: { base: "#FACC15", shadow: "#CA8A04" },
  white: { base: "#F4F6FA", shadow: "#C5CDD8" },
};

const VegetaHair = () => (
  <g>
    <path
      d="M-17.5 -62 Q-22 -74 -20 -84 L-15.5 -80 L-17 -92 L-10.5 -85.5 L-8 -96 L-2.5 -88 L2 -96 L5 -87.5 L10.5 -95 L11.5 -84.5 L17.5 -90 L16.5 -80 L20 -84 Q22 -74 17.5 -62 Q15 -73 8 -77 L0 -69 L-8 -77 Q-15 -73 -17.5 -62 Z"
      fill={SPIKY_HAIR.base}
    />
    <path
      d="M5 -87.5 L10.5 -95 L11.5 -84.5 L17.5 -90 L16.5 -80 L20 -84 Q22 -74 17.5 -62 Q15 -73 8 -77 Q9 -83 5 -87.5 Z"
      fill={SPIKY_HAIR.shadow}
    />
    <path d="M-15.5 -80 L-17 -92 L-10.5 -85.5 L-8 -96 L-5 -87 L-12 -79 Z" fill={SPIKY_HAIR.highlight} />
  </g>
);

const VegetaFigure = () => (
  <ChibiFigure
    skin={SKIN.fair}
    blush={false}
    body={
      <FigureBody
        skin={SKIN.fair}
        top={VEGETA.suit}
        hands={VEGETA.white}
        pants={VEGETA.suit}
        shoes={VEGETA.white}
        chest={
          <g>
            <path d="M-13.8 -46 Q-15 -38 -12.8 -31 L12.8 -31 Q15 -38 13.8 -46 Q0 -49.5 -13.8 -46 Z" fill={VEGETA.armour.base} />
            <path d="M13.8 -46 Q15 -38 12.8 -31 L8 -31 Q10.5 -38 9.5 -47.6 Z" fill={VEGETA.armour.shadow} />
          </g>
        }
      />
    }
    face={
      <g>
        <Eyes iris="#3B3B4A" />
        <path d="M-10.5 -68.5 L-2.5 -65.6 L-2.5 -71 L-10.5 -71 Z" fill={SKIN.fair.base} />
        <path d="M10.5 -68.5 L2.5 -65.6 L2.5 -71 L10.5 -71 Z" fill={SKIN.fair.base} />
        <path d="M-10.5 -68.8 L-2.5 -65.8" stroke={INK} strokeWidth={1.7} strokeLinecap="round" />
        <path d="M10.5 -68.8 L2.5 -65.8" stroke={INK} strokeWidth={1.7} strokeLinecap="round" />
        <path d="M-3 -56.5 Q0 -58.8 3 -56.5" stroke={INK} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </g>
    }
    hairFront={<VegetaHair />}
    front={
      <g>
        <ellipse cx={-13} cy={-45} rx={5.4} ry={3.6} fill={VEGETA.pads.base} transform="rotate(-18 -13 -45)" />
        <ellipse cx={13} cy={-45} rx={5.4} ry={3.6} fill={VEGETA.pads.shadow} transform="rotate(18 13 -45)" />
        <rect x={-12.5} y={-4.2} width={11} height={1.8} rx={0.9} fill={VEGETA.pads.base} />
        <rect x={1.5} y={-4.2} width={11} height={1.8} rx={0.9} fill={VEGETA.pads.shadow} />
      </g>
    }
  />
);

const VegetaPlush = () => (
  <PlushToy
    skin={SKIN.fair}
    fabric={VEGETA.suit}
    feet={VEGETA.white}
    hands={VEGETA.white}
    seamX={-5}
    brows={
      <g>
        <path d="M-8 -32.5 L-2.2 -30.4" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
        <path d="M8 -32.5 L2.2 -30.4" stroke={INK} strokeWidth={1.3} strokeLinecap="round" />
      </g>
    }
    mouth={<path d="M-2 -23.4 Q0 -24.9 2 -23.4" stroke={INK} strokeWidth={1.1} fill="none" strokeLinecap="round" />}
    hairFront={<VegetaHair />}
    front={
      <g>
        {/* armour sits over the belly seam so the stitches only show on the suit */}
        <path d="M-11.5 -21 Q-12.8 -16 -11.8 -12 L11.8 -12 Q12.8 -16 11.5 -21 Q0 -23.6 -11.5 -21 Z" fill={VEGETA.armour.base} />
        <path d="M11.5 -21 Q12.8 -16 11.8 -12 L8 -12 Q9 -16 8 -22.3 Z" fill={VEGETA.armour.shadow} />
        <ellipse cx={-10.5} cy={-20.5} rx={4.2} ry={2.8} fill={VEGETA.pads.base} transform="rotate(-18 -10.5 -20.5)" />
        <ellipse cx={10.5} cy={-20.5} rx={4.2} ry={2.8} fill={VEGETA.pads.shadow} transform="rotate(18 10.5 -20.5)" />
      </g>
    }
  />
);

/* --------------------------------------------------------------------------
 * Registry — one component per character; `mode` swaps figure for plush.
 * ------------------------------------------------------------------------ */
const withModes = (Figure, Plush) => {
  const Character = ({ mode = "figure" }) => (mode === "plush" ? <Plush /> : <Figure />);
  return Character;
};

export const CHARACTER_ART = {
  denji: withModes(DenjiFigure, DenjiPlush),
  power: withModes(PowerFigure, PowerPlush),
  reze: withModes(RezeFigure, RezePlush),
  bombDevil: withModes(BombDevilFigure, BombDevilPlush),
  reacher: withModes(ReacherFigure, ReacherPlush),
  neagley: withModes(NeagleyFigure, NeagleyPlush),
  roscoe: withModes(RoscoeFigure, RoscoePlush),
  goku: withModes(GokuFigure, GokuPlush),
  youngGoku: withModes(YoungGokuFigure, YoungGokuPlush),
  vegeta: withModes(VegetaFigure, VegetaPlush),
};
