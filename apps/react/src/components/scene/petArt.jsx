/* --------------------------------------------------------------------------
 * Pet art for the scene
 *
 * Every pet draws with its contact point at local (0, 0) and extends upward,
 * so the scene only has to translate it. Colours follow the avatar swatch
 * convention: a base tone, one shadow tone, and at most one highlight. There
 * are no gradients or ids, because several pets can render in one SVG.
 * ------------------------------------------------------------------------ */

const INK = "#1B1B22";

const GroundShadow = ({ rx }) => <ellipse cx={0} cy={0} rx={rx} ry={4} fill="#000000" opacity={0.3} />;

/** Draws `children` once as authored and once mirrored across x = 0. */
const Pair = ({ children }) => (
  <g>
    {children}
    <g transform="scale(-1 1)">{children}</g>
  </g>
);

/* --------------------------------------------------------------------------
 * Dogs
 *
 * One seated body (target box 76 x 100) shared by every coat, so the presets
 * stay the same size and pose and differ only where real breeds differ: ears,
 * tail, coat colours and face markings. The body is turned slightly, putting
 * the near haunch and the tail on the viewer's left, and the head is tilted a
 * few degrees, which is most of what makes the pose read as sweet.
 *
 * Luna is the reason this component exists, so her face is its own branch
 * rather than a recolour. What makes her HER and not a generic fawn dog, taken
 * from her photos:
 *   - big ears set wide on a flat skull, held out sideways with the tips
 *     folding over and darker than the rest of the ear;
 *   - dark "mascara" around both eyes that runs up into worried brows, over
 *     a crease down the middle of her forehead;
 *   - droopy eyes with a sliver of pink lower lid;
 *   - a greying muzzle inside a darker mask, with a pale pink crescent on the
 *     bridge right above a big black nose;
 *   - a cream bib and cream front legs, and a tail that curls up.
 * ------------------------------------------------------------------------ */

const DOG_COATS = {
  luna: {
    coat: ["#C8955C", "#A2703F", "#DEB27C"],
    chest: ["#F1E2C9", "#D2BD9D"],
    ear: "folded",
    earInner: "#C98F82",
    eye: "#8A5424",
    tail: "curl",
    face: "luna",
  },
  golden: {
    coat: ["#DDA24E", "#B27A2C", "#EFC27A"],
    chest: ["#EFC888", "#CFA262"],
    ear: "floppy",
    eye: "#4A2A12",
    tail: "plume",
    face: "plain",
  },
  husky: {
    coat: ["#7D8696", "#5A6170", "#9AA3B2"],
    chest: ["#F2F4F7", "#C6CCD6"],
    ear: "pointy",
    earInner: "#E9D3D6",
    eye: "#5FB0E6",
    tail: "fluffy",
    face: "husky",
  },
  blackLab: {
    coat: ["#393942", "#212128", "#6E6E7C"],
    chest: ["#44444E", "#27272E"],
    ear: "drop",
    eye: "#8A5424",
    tail: "otter",
    face: "plain",
  },
  beagle: {
    coat: ["#C47F3E", "#9A5D26", "#DDA062"],
    chest: ["#F3EEE6", "#CFC6B9"],
    saddle: ["#2F2A27", "#1C1917", "#57504A"],
    ear: "long",
    eye: "#4A2A12",
    tail: "flag",
    face: "beagle",
  },
};

const DogTail = ({ kind, coat, chest, saddle }) => {
  if (kind === "curl") {
    return (
      <g>
        <path d="M-20 -10 C-32 -12 -36 -26 -33 -35 C-31 -41 -25 -42 -24 -37" stroke={coat[0]} strokeWidth={5.5} strokeLinecap="round" fill="none" />
        <path d="M-31 -39.5 C-28 -41.5 -25 -41 -24 -37" stroke={chest[0]} strokeWidth={4} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (kind === "plume") {
    return (
      <g>
        <path d="M-18 -9 C-29 -10 -37 -22 -37 -38 C-35 -35 -35.5 -33 -33 -31 C-35 -27 -33 -25 -31 -23 C-32 -19 -29 -17 -26 -15 C-26 -12 -22 -11 -18 -11 Z" fill={chest[0]} />
        <path d="M-16 -10 C-26 -12 -33 -22 -34 -40 C-34 -44 -31 -45 -30 -42 C-28 -30 -24 -22 -16 -18 Z" fill={coat[0]} />
      </g>
    );
  }
  if (kind === "fluffy") {
    return (
      <g>
        <path d="M-18 -8 C-33 -10 -38 -28 -31 -39 C-26 -46 -17 -43 -18 -37 C-25 -34 -27 -24 -18 -18 Z" fill={coat[0]} />
        <path d="M-31 -39 C-26 -46 -17 -43 -18 -37 C-22 -37 -26 -37 -28 -35 Z" fill={chest[0]} />
      </g>
    );
  }
  if (kind === "otter") {
    return <path d="M-16 -6 C-26 -8 -34 -17 -37 -28 C-32 -23 -26 -18 -16 -15 Z" fill={coat[0]} />;
  }
  return (
    <g>
      <path d="M-20 -10 C-27 -15 -30 -26 -29 -39" stroke={saddle[0]} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M-29.4 -33 L-29 -39" stroke={chest[0]} strokeWidth={5} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** Ears drawn BEHIND the head: the ones that stand up or out. Head-local, left side. */
const DogEarBehind = ({ kind, coat, inner }) => {
  if (kind === "folded") {
    return (
      <g>
        <path d="M-9 -16.5 C-15 -21.5 -24 -22 -30 -18 C-34 -15 -34.5 -9 -32.5 -3.5 C-30.5 -7.5 -27.5 -10 -24 -10 C-20.5 -10 -17.5 -8.5 -15 -6.5 Z" fill={coat[0]} />
        <path d="M-12 -14.5 C-17 -17.8 -23 -18 -27 -15.2 C-23.5 -13.2 -19.5 -11.5 -15.8 -9 Z" fill={inner} />
        {/* the tip folds over and is darker than the rest of the ear */}
        <path d="M-28 -19.2 C-32 -17.5 -35 -11.5 -32.5 -3.5 C-31.5 -7.5 -29.5 -10.5 -26.8 -11.4 C-26.8 -14 -27.2 -16.8 -28 -19.2 Z" fill={coat[1]} />
      </g>
    );
  }
  if (kind === "pointy") {
    return (
      <g>
        <path d="M-3 -17 C-6 -21.5 -11 -26 -14.5 -27.6 C-17.5 -22.5 -18.5 -15.5 -16 -8 Z" fill={coat[1]} />
        <path d="M-6.5 -16 C-9 -19.5 -12 -22.8 -14 -24 C-15.5 -20 -16 -15.5 -14.5 -11 Z" fill={inner} />
      </g>
    );
  }
  return null;
};

/** Ears drawn OVER the head: the ones that hang. Head-local, left side. */
const DogEarFront = ({ kind, coat, saddle }) => {
  if (kind === "floppy") {
    return <path d="M-8 -18 C-18 -21 -24 -13 -24 -3 C-24 6 -21 11 -17 10 C-13 9 -13 1 -13 -7 C-13 -12 -11 -15 -8 -18 Z" fill={coat[1]} />;
  }
  if (kind === "drop") {
    return (
      <g>
        <path d="M-8 -18 C-16 -21 -22 -17 -23 -9 C-23 -3 -20 2 -16 3 C-14 -3 -13 -9 -12 -13 Z" fill={coat[1]} />
        <path d="M-21 -15 C-23 -11 -23 -6 -21 -2" stroke={coat[2]} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.8} />
      </g>
    );
  }
  if (kind === "long") {
    return (
      <g>
        <path d="M-8 -16 C-19 -18 -24 -9 -24 3 C-24 13 -21 19 -16 18 C-12 17 -12 8 -13 -2 C-13 -9 -11 -13 -8 -16 Z" fill={coat[1]} />
        <path d="M-22 -8 C-23.5 -2 -23.5 6 -21.5 13" stroke={saddle ? saddle[0] : coat[1]} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
      </g>
    );
  }
  return null;
};

const HEAD = "M0 -19.5 C11 -19.5 18 -15.5 18 -6 C18 1 15.5 6 11 10 C10 17 7 22 0 22 C-7 22 -10 17 -11 10 C-15.5 6 -18 1 -18 -6 C-18 -15.5 -11 -19.5 0 -19.5 Z";
const HEAD_SHADE = "M-18 -6 C-18 1 -15.5 6 -11 10 C-10 17 -7 22 0 22 C-5 20 -7.5 15 -8 10 C-12 6 -14 1 -14 -6 C-14.5 -12 -11.5 -17 -6 -19.3 C-12.5 -18.5 -18 -14.5 -18 -6 Z";
const HEAD_LIGHT = "M6 -19 C13 -17.8 18 -13.5 18 -6 C18 1 15.5 6 11 10 C12.8 5.5 15.3 1 15.4 -5 C14.7 -11 11.5 -16 6 -19 Z";
const MUZZLE = "M-9 3 C-11 8 -10.5 15 -7 19.5 C-4 22.5 4 22.5 7 19.5 C10.5 15 11 8 9 3 C5 1.5 -5 1.5 -9 3 Z";

const DogEye = ({ iris, lidColor }) => (
  <g>
    <circle cx={-7} cy={-0.8} r={3} fill={iris} />
    <circle cx={-7} cy={-0.6} r={1.9} fill={INK} />
    <circle cx={-6} cy={-1.7} r={0.85} fill="#FFFFFF" />
    <circle cx={-7.9} cy={0.5} r={0.4} fill="#FFFFFF" opacity={0.8} />
    {/* a soft upper lid: gentle rather than startled */}
    <path d="M-10.4 -1.8 Q-7 -4.9 -3.6 -2 L-3.6 -4.4 L-10.4 -4.4 Z" fill={lidColor} />
    <path d="M-10.2 -1.9 Q-7 -4.6 -3.8 -2.1" stroke={INK} strokeWidth={1.2} strokeLinecap="round" fill="none" />
  </g>
);

const DogNose = () => (
  <g>
    <path d="M-5.5 10.5 C-5.5 8.6 5.5 8.6 5.5 10.5 C5.5 13.3 2.6 15.3 0 15.3 C-2.6 15.3 -5.5 13.3 -5.5 10.5 Z" fill={INK} />
    <ellipse cx={-1.9} cy={10.4} rx={1.7} ry={0.8} fill="#5A5A66" />
    {/* a little tongue out: the difference between a sweet dog and a solemn one */}
    <path d="M-1.9 18.4 C-2 21.4 2 21.4 1.9 18.4 C1 19 -1 19 -1.9 18.4 Z" fill="#E7798A" />
    <path d="M0 15.3 L0 17.2 M-4 17.6 Q-2 20.2 0 17.2 Q2 20.2 4 17.6" stroke={INK} strokeWidth={1.2} strokeLinecap="round" fill="none" />
  </g>
);

/** Her mascara: around the eye and rising into a short worried brow. Left side, head-local. */
const LUNA_MASCARA = "M-11.6 0 C-12 -4 -9 -6 -6 -5.8 C-5 -7.2 -4 -8.2 -3 -8.8 C-2.7 -7 -2.8 -5 -3.2 -3.4 C-2.9 0.5 -4.4 3.4 -7.2 3.9 C-10 4 -11.5 2.3 -11.6 0 Z";

/** Her greying muzzle, shared by the dog and the plush so the two keep the same face. Head-local. */
const LunaMuzzle = () => (
  <g transform="scale(1.08 1)">
    {/* greying muzzle, the fawn bridge dipping into it, darker mask down its sides */}
    <path d="M-9 3.5 C-6.5 2.5 -3.5 4 -2.2 7 L2.2 7 C3.5 4 6.5 2.5 9 3.5 C11 8.5 10.5 15 7 19.5 C4 22.5 -4 22.5 -7 19.5 C-10.5 15 -11 8.5 -9 3.5 Z" fill="#C2BAAF" />
    <Pair>
      <path d="M-9 3.5 C-11 8.5 -10.5 15 -7 19.5 C-5.5 21 -3.8 21.9 -2 22.3 C-5 20 -7.4 16 -7.9 11.5 C-8.2 8.5 -7.6 5.5 -6 3.4 C-7 3.1 -8 3.2 -9 3.5 Z" fill="#7C6A5B" />
    </Pair>
    <path d="M-4 18.8 C-2.5 20.6 2.5 20.6 4 18.8 C3 21.6 -3 21.6 -4 18.8 Z" fill="#958C80" />
    <path d="M-3.4 8 Q0 6 3.4 8" stroke="#E9B3A5" strokeWidth={1.5} strokeLinecap="round" fill="none" />
    <DogNose />
  </g>
);

const DogFace = ({ look }) => {
  const { coat, chest, face, eye } = look;
  const nose = <DogNose />;

  if (face === "luna") {
    return (
      <g>
        {/* pale brows over the dark mascara, which rises into short worried brows */}
        <ellipse cx={-7.8} cy={-7.8} rx={4.4} ry={2.6} fill={coat[2]} />
        <ellipse cx={7.8} cy={-7.8} rx={4.4} ry={2.6} fill={coat[2]} />
        <path d="M0 -18.5 L0 -13" stroke={coat[1]} strokeWidth={1.3} strokeLinecap="round" />
        <Pair>
          <path d={LUNA_MASCARA} fill="#54402F" />
          <DogEye iris={eye} lidColor="#54402F" />
          <path d="M-9.2 2.5 Q-7 3.7 -4.9 2.6" stroke="#D98A92" strokeWidth={0.9} strokeLinecap="round" fill="none" opacity={0.6} />
        </Pair>
        <LunaMuzzle />
      </g>
    );
  }

  if (face === "husky") {
    return (
      <g>
        <path d="M-17 -2 C-15 -6 -11 -6.5 -8 -5 C-5 -3.5 -2.5 -7 0 -11 C2.5 -7 5 -3.5 8 -5 C11 -6.5 15 -6 17 -2 C17 3 15 7 11 10 C10 17 7 22 0 22 C-7 22 -10 17 -11 10 C-15 7 -17 3 -17 -2 Z" fill={chest[0]} />
        <path d="M-17 -2 C-17 3 -15 7 -11 10 C-10 17 -7 22 0 22 C-5 20 -7.5 15 -8 10 C-12 7 -14 3 -14.5 -4 C-15.8 -4 -16.5 -3 -17 -2 Z" fill={chest[1]} />
        <ellipse cx={-7.5} cy={-8.5} rx={2.4} ry={1.5} fill={chest[0]} />
        <ellipse cx={7.5} cy={-8.5} rx={2.4} ry={1.5} fill={chest[0]} />
        <Pair>
          <DogEye iris={eye} lidColor={chest[0]} />
        </Pair>
        {nose}
      </g>
    );
  }

  if (face === "beagle") {
    return (
      <g>
        <path d="M-1.8 -19 C-1.2 -11 -2 -4 -4 2 C-7.5 4 -10 9 -8.5 14 C-7 20 -4 22 0 22 C4 22 7 20 8.5 14 C10 9 7.5 4 4 2 C2 -4 1.2 -11 1.8 -19 Z" fill={chest[0]} />
        <path d="M-4 2 C-7.5 4 -10 9 -8.5 14 C-7 20 -4 22 0 22 C-3.5 19 -5.5 14 -5 8 C-4.8 5 -4.2 3.5 -4 2 Z" fill={chest[1]} />
        <Pair>
          <DogEye iris={eye} lidColor={coat[0]} />
        </Pair>
        {nose}
      </g>
    );
  }

  return (
    <g>
      <path d={MUZZLE} fill={coat[2]} opacity={look.ear === "drop" ? 0.45 : 1} />
      <Pair>
        <DogEye iris={eye} lidColor={coat[0]} />
      </Pair>
      {nose}
    </g>
  );
};

const Dog = ({ variant }) => {
  const look = DOG_COATS[variant] || DOG_COATS.luna;
  const { coat, chest, saddle } = look;
  const haunch = saddle || coat;
  return (
    <g>
      <GroundShadow rx={32} />
      <DogTail kind={look.tail} coat={coat} chest={chest} saddle={saddle} />
      {/* far haunch, just peeking past the chest on the right */}
      <path d="M14 -2 C20 -5 24 -13 22 -22 C20 -28 16 -28 14 -24 Z" fill={haunch[0]} />
      {/* torso */}
      <path d="M-12 -56 C-18 -46 -21 -32 -20 -18 C-19 -7 -14 -1 -7 0 L9 0 C16 -1 20 -7 20 -18 C20 -32 17 -46 12 -56 Z" fill={coat[0]} />
      <path d="M12 -56 C17 -46 20 -32 20 -18 C20 -12 18.5 -7 16 -4 C17 -16 16 -34 10 -52 Z" fill={coat[2]} opacity={0.8} />
      {saddle && <path d="M-15 -48 C-20 -38 -21 -26 -19 -16 L-12 -22 C-12 -32 -12 -42 -9 -52 Z" fill={saddle[0]} />}
      {/* near haunch and back paw */}
      <path d="M-4 -1 C-6 -16 -12 -31 -21 -31 C-30 -31 -33 -19 -32 -11 C-31 -4 -26 -1 -19 0 Z" fill={haunch[0]} />
      <path d="M-32 -11 C-31 -4 -26 -1 -19 0 L-10 0 C-19 -3 -26 -9 -27 -20 C-27.5 -25 -26 -28.5 -24 -30.5 C-30 -29.5 -32.8 -19 -32 -11 Z" fill={haunch[1]} />
      {saddle && <path d="M-23 -30 C-18 -30 -13 -26 -10 -19" stroke={saddle[2]} strokeWidth={1.4} strokeLinecap="round" fill="none" />}
      <ellipse cx={-23} cy={-2.6} rx={7} ry={3} fill={chest[0]} />
      {/* bib and front legs */}
      <path d="M-8 -54 C-4 -50 4 -50 8 -54 C12 -44 13 -34 11 -24 L11 -2 L-11 -2 L-11 -24 C-13 -34 -12 -44 -8 -54 Z" fill={chest[0]} />
      <path d="M-11 -24 C-13 -34 -12 -44 -8 -54 C-7 -46 -7 -36 -7.5 -26 L-7.5 -2 L-11 -2 Z" fill={chest[1]} />
      <path d="M0 -30 L0 -3" stroke={chest[1]} strokeWidth={1.6} strokeLinecap="round" />
      <ellipse cx={-5.8} cy={-2.8} rx={5.8} ry={3} fill={chest[0]} />
      <ellipse cx={5.8} cy={-2.8} rx={5.8} ry={3} fill={chest[0]} />
      <path d="M-7.5 -3.5 L-7.5 -1.5 M-4 -3.5 L-4 -1.5 M4 -3.5 L4 -1.5 M7.5 -3.5 L7.5 -1.5" stroke={chest[1]} strokeWidth={1} strokeLinecap="round" />
      {/* head, tilted a little */}
      <g transform="translate(0 -69) rotate(-5) scale(1.07)">
        <Pair>
          <DogEarBehind kind={look.ear} coat={coat} inner={look.earInner} />
        </Pair>
        <path d={HEAD} fill={coat[0]} />
        <path d={HEAD_SHADE} fill={coat[1]} />
        <path d={HEAD_LIGHT} fill={coat[2]} opacity={0.8} />
        <DogFace look={look} />
        <Pair>
          <DogEarFront kind={look.ear} coat={coat} saddle={saddle} />
        </Pair>
      </g>
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Cats
 *
 * One seated body (46 x 58) with the tail wrapped round the front paws. Coats
 * are patterns on top of it: tabby stripes and forehead "M", calico patches,
 * the tuxedo's white bib, blaze and socks. The black cat keeps a lighter rim
 * down its lit side so it survives the night backdrop, and its face lines are
 * a mid grey because ink would vanish into the fur.
 * ------------------------------------------------------------------------ */

const CAT_COATS = {
  tabby: {
    coat: ["#9C8570", "#76604D", "#B9A38D"],
    chest: ["#E8DAC6", "#C9B8A2"],
    stripe: "#5B4636",
    eye: "#9BC53D",
    nose: "#D98A8A",
    pattern: "tabby",
  },
  black: {
    coat: ["#302F37", "#1D1C22", "#5E5C69"],
    chest: ["#302F37", "#1D1C22"],
    eye: "#EBC43F",
    nose: "#6A6270",
    line: "#8C8998",
    pattern: "plain",
  },
  orange: {
    coat: ["#E3913F", "#BB6A28", "#F2B36F"],
    chest: ["#F7E3C4", "#DCC29C"],
    stripe: "#BF6326",
    eye: "#8CBF3F",
    nose: "#D97F82",
    pattern: "tabby",
  },
  calico: {
    coat: ["#F3EEE7", "#D3C9BC", "#FFFFFF"],
    chest: ["#F3EEE7", "#D3C9BC"],
    patches: ["#E0873A", "#35333B"],
    eye: "#E3B23C",
    nose: "#E08E98",
    pattern: "calico",
  },
  tuxedo: {
    coat: ["#302F37", "#1D1C22", "#5E5C69"],
    chest: ["#F3F1EE", "#CFCAC2"],
    eye: "#7DC45A",
    nose: "#E08E98",
    pattern: "tuxedo",
  },
};

const Cat = ({ variant }) => {
  const look = CAT_COATS[variant] || CAT_COATS.tabby;
  const { coat, chest, stripe, patches, pattern } = look;
  const line = look.line || INK;
  const muzzle = pattern === "calico" ? coat : chest;
  const tailColor = pattern === "calico" ? patches[0] : coat[0];
  return (
    <g>
      <GroundShadow rx={19} />
      {/* body, near haunch, and the lit rim */}
      <path d="M-8 -30 C-15 -24 -17 -12 -16 -5 C-15.5 -1 -12 0 -8 0 L8 0 C12 0 15.5 -1 16 -5 C17 -12 15 -24 8 -30 Z" fill={coat[0]} />
      <path d="M-8 -30 C-15 -24 -17 -12 -16 -5 C-15.5 -1 -12 0 -8 0 L-5 0 C-11 -6 -12.5 -18 -6 -30 Z" fill={coat[1]} />
      <path d="M8 -30 C15 -24 17 -12 16 -5 C15.8 -3 15 -1.8 14 -1.2 C14.5 -10 13.5 -21 8 -30 Z" fill={coat[2]} opacity={0.8} />
      {pattern === "calico" && (
        <g>
          <path d="M-15.8 -8 C-16.5 -16 -14 -24 -8 -29 C-5 -24 -6 -16 -9 -11 C-11 -8 -13.5 -7 -15.8 -8 Z" fill={patches[0]} />
          <path d="M9 -28 C14 -23 16.5 -16 16 -10 C12 -11 9.5 -15 9 -20 Z" fill={patches[1]} />
        </g>
      )}
      {pattern === "tabby" && (
        <g stroke={stripe} strokeWidth={1.6} strokeLinecap="round" fill="none">
          <path d="M-15.5 -18 Q-12.5 -17 -11 -19.5" />
          <path d="M-16 -12 Q-13 -11 -11.5 -13.5" />
          <path d="M15.5 -18 Q12.5 -17 11 -19.5" />
          <path d="M16 -12 Q13 -11 11.5 -13.5" />
        </g>
      )}
      {(pattern === "tabby" || pattern === "tuxedo") && (
        <path d="M-5 -29 C-7 -20 -6.5 -10 -4.5 -3 L4.5 -3 C6.5 -10 7 -20 5 -29 C2 -27 -2 -27 -5 -29 Z" fill={chest[0]} />
      )}
      <path d="M0 -17 L0 -3.5" stroke={pattern === "plain" ? coat[1] : chest[1]} strokeWidth={1.2} strokeLinecap="round" />
      <ellipse cx={-4.4} cy={-2.2} rx={4} ry={2.4} fill={pattern === "plain" ? coat[0] : chest[0]} />
      <ellipse cx={4.4} cy={-2.2} rx={4} ry={2.4} fill={pattern === "plain" ? coat[0] : chest[0]} />
      {/* tail wraps round the front paws and curls up at the tip */}
      <path d="M-12 -1.8 C0 -0.5 16 -1 19 -7 C20.8 -11 19.5 -15.5 16.5 -16.5" stroke={tailColor} strokeWidth={4.4} strokeLinecap="round" fill="none" />
      {pattern === "tabby" && (
        <path d="M8 -2 L8.5 -0.2 M13 -2.8 L14 -1.2 M17.2 -6.5 L19.2 -5.8 M18.3 -12 L20.4 -12.4" stroke={stripe} strokeWidth={1.4} strokeLinecap="round" />
      )}
      {pattern === "tuxedo" && <path d="M17.8 -15 C19.6 -15.5 20.6 -14 20.4 -12.4 L18.4 -12.6 Z" fill={chest[0]} />}
      {/* head, tilted a little */}
      <g transform="translate(0 -37.5) rotate(-5)">
        <Pair>
          <path d="M-13.5 -3.5 C-14 -9.5 -13.5 -14.5 -11.5 -19 C-8.5 -16.5 -6 -13.5 -4 -10 Z" fill={coat[0]} />
          <path d="M-11.8 -6.5 C-12 -10.5 -11.6 -13.5 -10.8 -15.5 C-9 -14 -7.8 -12.5 -6.7 -10 Z" fill={look.nose} opacity={0.7} />
        </Pair>
        <path d="M0 -12 C8 -12 13 -8 14 -2 C15 3 13 8 8 10 C4 11.5 -4 11.5 -8 10 C-13 8 -15 3 -14 -2 C-13 -8 -8 -12 0 -12 Z" fill={coat[0]} />
        <path d="M-14 -2 C-15 3 -13 8 -8 10 C-6 10.7 -4 11.1 -2 11.3 C-7 9 -11 4 -11 -3 C-11 -7 -9.5 -10 -6.5 -11.6 C-10.5 -10.5 -13.3 -7 -14 -2 Z" fill={coat[1]} />
        {pattern === "calico" && (
          <g>
            <path d="M-14 -2 C-13 -8 -8 -12 0 -12 C0 -7 -2 -3 -6 -2 C-9 -1 -12 -1 -14 -2 Z" fill={patches[0]} />
            <path d="M-13.5 -3.5 C-14 -9.5 -13.5 -14.5 -11.5 -19 C-8.5 -16.5 -6 -13.5 -4 -10 Z" fill={patches[0]} />
            <path d="M3 -11.8 C8 -11.5 12.5 -8.5 13.8 -3.5 C11 -2 7 -3 4.5 -6 C3 -8 2.6 -10 3 -11.8 Z" fill={patches[1]} />
          </g>
        )}
        {pattern === "tabby" && (
          <g stroke={stripe} strokeWidth={1.3} strokeLinecap="round" fill="none">
            <path d="M-4 -10.5 L-2 -6.5 L0 -9.5 L2 -6.5 L4 -10.5" />
            <path d="M-14.2 0 L-10.5 0.8 M-13.8 3.5 L-10.5 3.6 M14.2 0 L10.5 0.8 M13.8 3.5 L10.5 3.6" />
          </g>
        )}
        {pattern === "tuxedo" && <path d="M0 -3 C-2 1 -6 3 -6.5 6.5 C-6 10 -3 11.3 0 11.3 C3 11.3 6 10 6.5 6.5 C6 3 2 1 0 -3 Z" fill={chest[0]} />}
        <ellipse cx={-2.4} cy={6.2} rx={3.2} ry={2.6} fill={muzzle[0]} />
        <ellipse cx={2.4} cy={6.2} rx={3.2} ry={2.6} fill={muzzle[0]} />
        <Pair>
          <ellipse cx={-5.5} cy={0} rx={2.6} ry={3} fill={look.eye} />
          <ellipse cx={-5.5} cy={0.2} rx={0.9} ry={2.3} fill={INK} />
          <circle cx={-4.7} cy={-1.2} r={0.75} fill="#FFFFFF" />
          <path d="M-8.5 5.6 L-17 4 M-8.5 7 L-17 7.6" stroke={pattern === "plain" || pattern === "tuxedo" ? "#B8B5C2" : "#FFFFFF"} strokeWidth={0.6} strokeLinecap="round" opacity={0.7} />
        </Pair>
        <path d="M-1.7 3.8 L1.7 3.8 L0 5.6 Z" fill={look.nose} />
        <path d="M0 5.6 L0 6.6 M-2.6 6.8 Q-1.3 8 0 6.6 Q1.3 8 2.6 6.8" stroke={line} strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Birds
 *
 * A perched bird (28 x 40) with its toes at the anchor, so it can sit on the
 * edge of the desk or a shelf. It faces the viewer's right in 3/4, which is
 * what lets the beak shape carry the species: the macaw's big pale hook, the
 * cockatiel's crest and orange cheek, the budgie's yellow face and barred nape.
 * The tail angles back to the perch line instead of hanging below it, so the
 * bird never draws under its anchor.
 * ------------------------------------------------------------------------ */

const BIRD_LOOKS = {
  parrot: {
    body: ["#D93A2F", "#A8261E", "#EE6A55"],
    wing: ["#F2C230", "#2F6FD6"],
    tail: "#2F6FD6",
    face: "#F3EDE6",
    beak: ["#EFE6D6", "#2C2A30"],
  },
  cockatiel: {
    body: ["#A3A7AF", "#7B7F89", "#C3C6CD"],
    wing: ["#F1F1EF", "#7B7F89"],
    tail: "#6F737D",
    face: "#F4D35E",
    cheek: "#F08A3C",
    beak: ["#B7ADA6", "#8E847D"],
  },
  budgie: {
    body: ["#6CC04A", "#4E9A35", "#95D873"],
    wing: ["#F2E27A", "#2E2D33"],
    tail: "#2D5FA8",
    head: "#F5E050",
    cere: "#4E7BD8",
    beak: ["#E6C28A", "#B99462"],
  },
};

const BIRD_VARIANT_IDS = ["parrot", "cockatiel", "budgie"];

const Bird = ({ variant }) => {
  const kind = BIRD_LOOKS[variant] ? variant : BIRD_VARIANT_IDS[0];
  const look = BIRD_LOOKS[kind];
  const { body, wing } = look;
  const head = look.head || body[0];
  return (
    <g>
      <GroundShadow rx={9} />
      {/* tail, back to the perch line */}
      <path d="M-3 -9 C-7 -5 -10.5 -2 -13 -0.5 L-7 -0.5 C-4 -2.5 -1 -5 1 -7 Z" fill={look.tail} />
      {kind === "parrot" && <path d="M-3 -9 C-6 -6 -8 -4 -10 -2.5 L-8 -2 C-5.5 -4 -3 -6 -1 -8 Z" fill={body[1]} />}
      {kind === "cockatiel" && (
        <path d="M-1.5 -33 C-3 -36 -3.5 -38.5 -2.5 -40 C0 -38.5 1.5 -36.5 2 -34 C2.5 -36.5 4 -38 6 -38.5 C5.5 -35.5 4.5 -33 3 -31.5 Z" fill={look.face} />
      )}
      {/* body */}
      <path d="M-1 -25 C5 -25 8.5 -19 8.5 -12.5 C8.5 -6 5 -2.5 0 -2.5 C-5.5 -2.5 -8 -7 -8 -13 C-8 -19.5 -6 -25 -1 -25 Z" fill={body[0]} />
      <path d="M5 -22 C7.5 -19 8.5 -16 8.5 -12.5 C8.5 -8 7 -5 4.5 -3.5 C6 -9 6.5 -16 5 -22 Z" fill={body[2]} opacity={0.8} />
      {kind === "budgie" && (
        <path d="M2 -20 C5.5 -19.5 7.5 -16.5 7.5 -13 C4.5 -14 2.5 -16.5 2 -20 Z" fill={head} />
      )}
      {/* wing */}
      <path d="M-7 -21 C-2 -22 3 -16 2.5 -9 C2 -5 -1.5 -3 -6.5 -3.5 C-8.8 -9 -9 -16 -7 -21 Z" fill={body[1]} />
      {kind === "parrot" && (
        <g>
          <path d="M-7.5 -19.5 C-3 -20 1 -16.5 2.2 -12.5 C-1 -12 -5 -13 -8.3 -15 Z" fill={wing[0]} />
          <path d="M-8.4 -10 C-4 -10 0 -8.5 2 -6.5 C0.5 -4 -2.5 -3.2 -6.5 -3.5 C-7.6 -5.5 -8.2 -7.5 -8.4 -10 Z" fill={wing[1]} />
        </g>
      )}
      {kind === "cockatiel" && <path d="M-7.5 -18 C-4 -18.5 0 -16 1.5 -13 C-1.5 -12.5 -5 -13 -8.2 -14 Z" fill={wing[0]} />}
      {kind === "budgie" && (
        <g stroke={wing[1]} strokeWidth={1} strokeLinecap="round" fill="none">
          <path d="M-7 -18 Q-4 -16.5 -1 -17.5" />
          <path d="M-7.6 -14.5 Q-4 -13 0 -14" />
          <path d="M-7.6 -11 Q-4 -9.5 1 -10.5" />
          <path d="M-7 -7.5 Q-4 -6 1 -7" />
        </g>
      )}
      {/* head */}
      <circle cx={1.5} cy={-28.5} r={7.2} fill={head} />
      {kind === "parrot" && <path d="M-5.6 -27 C-5.5 -32 -2 -35.7 1.5 -35.7 C-1 -33.5 -2.5 -30 -2 -25 Z" fill={body[1]} />}
      {kind === "budgie" && (
        <g stroke={wing[1]} strokeWidth={0.9} strokeLinecap="round" fill="none">
          <path d="M-4.5 -32 Q-2.5 -31 -1 -33" />
          <path d="M-5.5 -29 Q-3.5 -28 -2 -30" />
          <path d="M-5.3 -26 Q-3.5 -25 -2 -27" />
          <path d="M-1.8 -34.5 Q0 -34 1.5 -35.5" />
        </g>
      )}
      {kind === "cockatiel" && (
        <g>
          <path d="M0.5 -35.4 C5.5 -36 9 -32.5 8.8 -28 C8.6 -24 6 -21.4 2.5 -21.4 C0 -24 -1 -31 0.5 -35.4 Z" fill={look.face} />
          <circle cx={5.2} cy={-25.6} r={2.4} fill={look.cheek} />
        </g>
      )}
      {kind === "parrot" && <ellipse cx={4.6} cy={-28.2} rx={3.6} ry={3.4} fill={look.face} />}
      {kind === "budgie" && (
        <g>
          <circle cx={4} cy={-22.2} r={0.8} fill={wing[1]} />
          <circle cx={6.4} cy={-22.6} r={0.8} fill={wing[1]} />
          <circle cx={7.8} cy={-24.6} r={1.1} fill="#5A5DC8" />
        </g>
      )}
      <circle cx={3.8} cy={-29.8} r={1.6} fill={INK} />
      <circle cx={4.3} cy={-30.4} r={0.55} fill="#FFFFFF" />
      {/* beak */}
      {kind === "parrot" ? (
        <g>
          <path d="M7.2 -24.6 C9 -24.6 10 -23.2 9.4 -21.5 C8.2 -22 7 -22.5 6 -23.5 Z" fill={look.beak[1]} />
          <path d="M6.5 -30.5 C10.5 -31 13 -28 12.5 -23.5 C12.3 -22 11.6 -21.2 11 -21.5 C11 -24 9.5 -25.5 6.5 -25 Z" fill={look.beak[0]} />
        </g>
      ) : (
        <g>
          {look.cere && <path d="M7.4 -29.2 C8.8 -29.5 9.8 -28.6 9.8 -27.6 L7.6 -27.4 Z" fill={look.cere} />}
          <path d="M7.4 -27.6 C9.8 -27.8 11 -26.2 10.4 -24 C9.4 -24.2 8.2 -24.6 7.2 -25 Z" fill={look.beak[0]} />
          <path d="M7.2 -25 C8.2 -24.6 9.4 -24.2 10.4 -24 C9.6 -23 8.2 -22.8 7.2 -23.4 Z" fill={look.beak[1]} />
        </g>
      )}
      {/* toes gripping the edge */}
      <path d="M-3.4 -2.5 L-3.4 -0.8 M-1 -2.5 L-1 -0.8 M1.6 -2.5 L1.6 -0.8 M4 -2.5 L4 -0.8" stroke="#8A8F98" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Bunny, hamster, turtle
 *
 * Small pets with one silhouette each. The white coats are never pure white
 * alone: each has a cool mid-tone shadow side so they still separate from the
 * pale day backdrop.
 * ------------------------------------------------------------------------ */

const BUNNY_COATS = {
  white: { coat: ["#F4F1EC", "#CFC8BE"], belly: ["#FFFFFF", "#E3DDD4"], inner: "#F2A7B5", eye: "#8E3040" },
  brown: { coat: ["#9C7150", "#76523A"], belly: ["#E6D3BD", "#C7B299"], inner: "#D9A5A0", eye: INK },
};

const Bunny = ({ variant }) => {
  const { coat, belly, inner, eye } = BUNNY_COATS[variant] || BUNNY_COATS.white;
  return (
    <g>
      <GroundShadow rx={17} />
      <circle cx={-14.5} cy={-7} r={3.8} fill={belly[0]} />
      <path d="M0 -24 C10 -24 16 -16 16 -8 C16 -3 12 0 6 0 L-6 0 C-12 0 -16 -3 -16 -8 C-16 -16 -10 -24 0 -24 Z" fill={coat[0]} />
      <path d="M-16 -8 C-16 -3 -12 0 -6 0 L-3 0 C-10 -3 -13 -9 -12 -16 C-11.5 -19 -10 -21.5 -8 -22.5 C-13 -20.5 -16 -14.5 -16 -8 Z" fill={coat[1]} />
      <ellipse cx={0} cy={-9.5} rx={7} ry={8} fill={belly[0]} />
      <ellipse cx={-11} cy={-2.2} rx={6.5} ry={2.6} fill={coat[1]} />
      <ellipse cx={11} cy={-2.2} rx={6.5} ry={2.6} fill={coat[1]} />
      <ellipse cx={-3.6} cy={-2.2} rx={3} ry={2.1} fill={belly[1]} />
      <ellipse cx={3.6} cy={-2.2} rx={3} ry={2.1} fill={belly[1]} />
      {/* ears, splayed a little */}
      <path d="M-3.5 -29 C-7.5 -33 -10 -40 -8.8 -44.5 C-7.8 -46.4 -4.8 -46 -3.4 -43 C-1.8 -39 -1.4 -34 -1 -29.5 Z" fill={coat[0]} />
      <path d="M-3.8 -31 C-6.5 -34.5 -8 -39.5 -7.4 -42.8 C-6 -42.5 -4.6 -40 -3.8 -37 C-3.2 -35 -3 -33 -3 -31.2 Z" fill={inner} />
      <path d="M3.5 -29 C7.5 -33 10 -40 8.8 -44.5 C7.8 -46.4 4.8 -46 3.4 -43 C1.8 -39 1.4 -34 1 -29.5 Z" fill={coat[0]} />
      <path d="M3.8 -31 C6.5 -34.5 8 -39.5 7.4 -42.8 C6 -42.5 4.6 -40 3.8 -37 C3.2 -35 3 -33 3 -31.2 Z" fill={inner} />
      {/* head */}
      <ellipse cx={0} cy={-24} rx={10.5} ry={8.5} fill={coat[0]} />
      <path d="M-10.5 -24 C-10.5 -19 -6 -15.5 0 -15.5 C-4.5 -17 -7.5 -20.5 -7.5 -25 C-7.5 -28.5 -6 -31 -3.5 -32.2 C-7.5 -31.5 -10.5 -28.5 -10.5 -24 Z" fill={coat[1]} />
      <ellipse cx={-2.3} cy={-19.6} rx={2.8} ry={2.2} fill={belly[0]} />
      <ellipse cx={2.3} cy={-19.6} rx={2.8} ry={2.2} fill={belly[0]} />
      <circle cx={-4.6} cy={-25} r={1.9} fill={eye} />
      <circle cx={4.6} cy={-25} r={1.9} fill={eye} />
      <circle cx={-4} cy={-25.7} r={0.65} fill="#FFFFFF" />
      <circle cx={5.2} cy={-25.7} r={0.65} fill="#FFFFFF" />
      <path d="M-1.3 -22 L1.3 -22 L0 -20.8 Z" fill="#E48A9A" />
      <path d="M0 -20.8 L0 -19.8 M-1.8 -19 Q-0.9 -18.4 0 -19.8 Q0.9 -18.4 1.8 -19" stroke={INK} strokeWidth={1} strokeLinecap="round" fill="none" />
    </g>
  );
};

const HAMSTER_COATS = {
  golden: { coat: ["#DE9F55", "#B57735"], belly: ["#F8EEE2", "#D9CBBA"] },
  white: { coat: ["#F4F0EA", "#CFC6BB"], belly: ["#FFFFFF", "#E0D9CF"] },
};

const Hamster = ({ variant }) => {
  const { coat, belly } = HAMSTER_COATS[variant] || HAMSTER_COATS.golden;
  return (
    <g>
      <ellipse cx={0} cy={0} rx={11} ry={3} fill="#000000" opacity={0.3} />
      <Pair>
        <circle cx={-7} cy={-16} r={2.8} fill={coat[1]} />
        <circle cx={-7} cy={-16} r={1.5} fill="#E9A3AE" />
      </Pair>
      <ellipse cx={0} cy={-9} rx={12.5} ry={9} fill={coat[0]} />
      <path d="M-12.5 -9 C-12.5 -4 -7 0 0 0 C-6 -2 -9.5 -6 -9.5 -10.5 C-9.5 -14 -8 -16.5 -5.5 -17.5 C-9.5 -16.5 -12.5 -13 -12.5 -9 Z" fill={coat[1]} />
      <ellipse cx={0} cy={-5} rx={7.5} ry={5} fill={belly[0]} />
      <ellipse cx={-6.8} cy={-7.8} rx={3.4} ry={2.6} fill={belly[0]} />
      <ellipse cx={6.8} cy={-7.8} rx={3.4} ry={2.6} fill={belly[0]} />
      <circle cx={-4.2} cy={-11.5} r={1.35} fill={INK} />
      <circle cx={4.2} cy={-11.5} r={1.35} fill={INK} />
      <circle cx={-3.8} cy={-12} r={0.45} fill="#FFFFFF" />
      <circle cx={4.6} cy={-12} r={0.45} fill="#FFFFFF" />
      <circle cx={0} cy={-9.4} r={0.9} fill="#E48A9A" />
      <path d="M0 -8.5 L0 -7.6 M-1.4 -7.1 Q-0.7 -6.5 0 -7.6 Q0.7 -6.5 1.4 -7.1" stroke={INK} strokeWidth={0.8} strokeLinecap="round" fill="none" />
      {/* tiny front paws tucked together on the belly */}
      <ellipse cx={-2} cy={-4.6} rx={1.3} ry={1.1} fill="#EDA7B2" />
      <ellipse cx={2} cy={-4.6} rx={1.3} ry={1.1} fill="#EDA7B2" />
      <ellipse cx={-5} cy={-0.9} rx={2.2} ry={1} fill="#EDA7B2" />
      <ellipse cx={5} cy={-0.9} rx={2.2} ry={1} fill="#EDA7B2" />
    </g>
  );
};

const TURTLE_COATS = {
  green: {
    shell: ["#4E8A3E", "#36692B", "#72AD5C"],
    rim: ["#C8B45A", "#9E8B3C"],
    skin: ["#9BBF5A", "#7A9B43"],
  },
};

const Turtle = ({ variant }) => {
  const { shell, rim, skin } = TURTLE_COATS[variant] || TURTLE_COATS.green;
  return (
    <g>
      <GroundShadow rx={20} />
      <path d="M-16 -5 L-22 -3 L-16 -1.5 Z" fill={skin[1]} />
      <ellipse cx={-11} cy={-2.6} rx={4} ry={2.8} fill={skin[1]} />
      <ellipse cx={11} cy={-2.6} rx={4} ry={2.8} fill={skin[1]} />
      {/* neck and head, facing the viewer's right */}
      <path d="M11 -7 C13 -11 15 -13.5 17 -14.5 L20 -9 C17 -7.5 15 -5 14 -3.5 Z" fill={skin[0]} />
      <circle cx={17.8} cy={-12} r={4.9} fill={skin[0]} />
      <path d="M13 -12.5 C13 -9.5 15 -7.2 18 -7.1 C16 -8.5 15 -10.5 15.4 -13 Z" fill={skin[1]} />
      <circle cx={19.2} cy={-13.3} r={1.25} fill={INK} />
      <circle cx={19.6} cy={-13.8} r={0.45} fill="#FFFFFF" />
      <path d="M18.8 -10 Q20.6 -9 22 -10.2" stroke={INK} strokeWidth={1} strokeLinecap="round" fill="none" />
      <ellipse cx={-5} cy={-1.8} rx={3.6} ry={2.4} fill={skin[0]} />
      <ellipse cx={5.5} cy={-1.8} rx={3.6} ry={2.4} fill={skin[0]} />
      {/* shell */}
      <path d="M-18.5 -4 C-18.5 -2.6 -17 -2 -15 -2 L15 -2 C17 -2 18.5 -2.6 18.5 -4 L18 -6.5 L-18 -6.5 Z" fill={rim[1]} />
      <path d="M-18 -6 C-18 -17 -9 -23.5 0 -23.5 C9 -23.5 18 -17 18 -6 Z" fill={shell[0]} />
      <path d="M-18 -6 C-18 -14 -13 -20 -6.5 -22.6 C-11 -18 -13 -12 -13 -6 Z" fill={shell[1]} />
      <path d="M-18 -6 L18 -6 L17.6 -8.8 L-17.6 -8.8 Z" fill={rim[0]} />
      <path d="M-11 -6 L-11 -8.8 M-4 -6 L-4 -8.8 M4 -6 L4 -8.8 M11 -6 L11 -8.8" stroke={rim[1]} strokeWidth={1} />
      <path d="M-5 -19.5 L5 -19.5 L7.5 -14.5 L5 -10.5 L-5 -10.5 L-7.5 -14.5 Z" fill={shell[1]} />
      <path d="M-4 -18.5 L4 -18.5 L6.2 -14.5 L4 -11.5 L-4 -11.5 L-6.2 -14.5 Z" fill={shell[0]} />
      <path d="M9 -10.5 L14 -10.5 C15.5 -13 15.2 -16 13.5 -18 L10 -18.5 L8.5 -14.5 Z" fill={shell[1]} opacity={0.6} />
      <path d="M2 -22.6 C8 -22 13 -19 15.5 -15" stroke={shell[2]} strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Luna plush
 *
 * Luna as a stuffed toy (40 x 50) for the bookcase. The plush language is
 * shared with the other toys: big head, mitten paws, stubby feet, a stitched
 * seam and a fabric tag. The seam runs down her forehead where her real crease
 * was, and everything that makes her recognisable survives in felt: sideways
 * ears with darker folded tips, mascara patches, the grey muzzle and its pink
 * crescent, the cream bib, and a curled tail.
 * ------------------------------------------------------------------------ */

const LUNA = DOG_COATS.luna;

const LunaPlush = () => {
  const { coat, chest } = LUNA;
  return (
    <g>
      <GroundShadow rx={16} />
      {/* tail stub, curled */}
      <path d="M-11 -6 C-16 -7 -18 -12 -16.5 -15.5 C-15.5 -17.5 -13.2 -17.6 -12.8 -16" stroke={coat[0]} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      {/* body */}
      <path d="M0 -27 C9 -27 13 -19 13 -11 C13 -5 9.5 -2 4 -2 L-4 -2 C-9.5 -2 -13 -5 -13 -11 C-13 -19 -9 -27 0 -27 Z" fill={coat[0]} />
      <path d="M-13 -11 C-13 -5 -9.5 -2 -4 -2 L-2 -2 C-7.5 -4 -10 -9 -9.8 -15 C-9.6 -20 -8 -24 -5 -26.2 C-10 -24.5 -13 -18 -13 -11 Z" fill={coat[1]} />
      <path d="M0 -24 C4.5 -24 7 -19 7 -13 C7 -8 4 -4 0 -4 C-4 -4 -7 -8 -7 -13 C-7 -19 -4.5 -24 0 -24 Z" fill={chest[0]} />
      <path d="M0 -23 L0 -5" stroke="#FFF8EC" strokeWidth={0.9} strokeDasharray="2 2" />
      {/* fabric tag */}
      <rect x={12.2} y={-12} width={4} height={6} rx={0.6} fill="#F7F7F4" />
      <rect x={12.2} y={-12} width={1.3} height={6} fill="#C9CCD2" />
      {/* mitten paws and stubby feet */}
      <ellipse cx={-9.5} cy={-13} rx={3.8} ry={5} fill={coat[0]} transform="rotate(18 -9.5 -13)" />
      <ellipse cx={9.5} cy={-13} rx={3.8} ry={5} fill={coat[0]} transform="rotate(-18 9.5 -13)" />
      <ellipse cx={-8.4} cy={-9.4} rx={3.2} ry={2.6} fill={chest[0]} />
      <ellipse cx={8.4} cy={-9.4} rx={3.2} ry={2.6} fill={chest[0]} />
      <ellipse cx={-6} cy={-3} rx={5} ry={3} fill={chest[0]} />
      <ellipse cx={6} cy={-3} rx={5} ry={3} fill={chest[0]} />
      <path d="M-10 -2.6 C-8.5 -1.2 -3.5 -1.2 -2 -2.6" stroke={chest[1]} strokeWidth={0.9} strokeLinecap="round" fill="none" />
      <path d="M2 -2.6 C3.5 -1.2 8.5 -1.2 10 -2.6" stroke={chest[1]} strokeWidth={0.9} strokeLinecap="round" fill="none" />
      {/* ears out sideways with folded, darker tips */}
      <Pair>
        <path d="M-8 -44.5 C-12 -49.5 -17.5 -49.5 -19.6 -45.8 C-20.1 -43.5 -19.6 -40 -18.2 -37.2 C-17.6 -40 -15.6 -41.4 -13 -41.4 C-11.5 -41.4 -10 -40.6 -9 -39.8 Z" fill={coat[0]} />
        <path d="M-10.5 -43.6 C-13 -46 -16 -46.4 -17.6 -44.8 C-15.6 -43.6 -13.4 -42.6 -11.4 -41.2 Z" fill={LUNA.earInner} />
        <path d="M-17.8 -47.6 C-19.4 -46.4 -20.3 -42 -18.2 -37.2 C-18 -39.6 -17 -41.2 -15.6 -41.6 C-16 -43.6 -16.6 -45.8 -17.8 -47.6 Z" fill={coat[1]} />
      </Pair>
      {/* head */}
      <path d="M0 -49 C9 -49 13.5 -44.5 13.5 -37.5 C13.5 -29.5 8 -24.5 0 -24.5 C-8 -24.5 -13.5 -29.5 -13.5 -37.5 C-13.5 -44.5 -9 -49 0 -49 Z" fill={coat[0]} />
      <path d="M-13.5 -37.5 C-13.5 -29.5 -8 -24.5 0 -24.5 C-5.5 -26.5 -10 -31 -10 -37.5 C-10 -42.5 -8 -46.5 -4.5 -48.4 C-10 -47.4 -13.5 -43.5 -13.5 -37.5 Z" fill={coat[1]} />
      <path d="M0 -48.4 L0 -44" stroke="#E9C79A" strokeWidth={0.9} strokeDasharray="2 2" />
      {/* her face at plush scale: felt mascara, button eyes, the same muzzle */}
      <g transform="translate(0 -38.6) scale(0.62)">
        <Pair>
          <ellipse cx={-8} cy={-7.6} rx={4.4} ry={2.4} fill={coat[2]} />
          <path d={LUNA_MASCARA} fill="#54402F" />
          <circle cx={-7} cy={-0.6} r={2.9} fill={INK} />
          <circle cx={-6} cy={-1.6} r={0.9} fill="#FFFFFF" />
        </Pair>
        <LunaMuzzle />
      </g>
    </g>
  );
};

export const PET_ART = { dog: Dog, cat: Cat, bird: Bird, bunny: Bunny, hamster: Hamster, turtle: Turtle };

export const PET_VARIANTS = {
  dog: [
    { id: "luna", label: "Luna" },
    { id: "golden", label: "Golden" },
    { id: "husky", label: "Husky" },
    { id: "blackLab", label: "Black lab" },
    { id: "beagle", label: "Beagle" },
  ],
  cat: [
    { id: "tabby", label: "Tabby" },
    { id: "black", label: "Black" },
    { id: "orange", label: "Orange" },
    { id: "calico", label: "Calico" },
    { id: "tuxedo", label: "Tuxedo" },
  ],
  bird: [
    { id: "parrot", label: "Parrot" },
    { id: "cockatiel", label: "Cockatiel" },
    { id: "budgie", label: "Budgie" },
  ],
  bunny: [
    { id: "white", label: "White" },
    { id: "brown", label: "Brown" },
  ],
  hamster: [
    { id: "golden", label: "Golden" },
    { id: "white", label: "White" },
  ],
  turtle: [{ id: "green", label: "Green" }],
};

export { LunaPlush };
