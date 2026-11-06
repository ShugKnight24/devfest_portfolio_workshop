/**
 * Office props for the desk scene. Each is drawn at the anchor listed for it
 * in `SCENE_PROPS` (src/config/avatar.js): the point where it meets its
 * surface. The scene translates it by the delta when it is moved.
 *
 * Same family as the avatar: flat fills, one shade on the right (light from
 * the upper left), one highlight, a few thin ink details. The scene's ink
 * filter draws the outer outline, so shapes here carry no outline of their own.
 */

const INK = "#221B26";
const D = 344; // desk top

const Shadow = ({ cx, y = D, rx, ry = 3.6, o = 0.3 }) => <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill="#000000" opacity={o} />;
const Detail = ({ d, w = 1.2, o = 0.55, c = INK }) => <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />;

/* ---------- existing props, redrawn ---------- */

/** Architect lamp: weighted base, two arms with springs, a cone shade. */
const Lamp = ({ accent, lit }) => (
  <g>
    {lit && <path d="M296 270 L262 344 L360 344 L326 270 Z" style={{ fill: accent }} opacity={0.12} />}
    <Shadow cx={276} rx={26} ry={4.5} o={0.35} />
    <path d="M256 344 Q256 334 276 333 Q296 334 296 344 Z" fill="#2E333D" />
    <path d="M284 334 Q296 336 296 344 L288 344 Z" fill="#000000" opacity={0.25} />
    <path d="M276 334 L266 282 L306 258" fill="none" stroke="#3B414C" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <Detail d="M272 330 L263 286 M269 286 L301 266" w={1.4} c="#8A93A3" o={0.8} />
    {[
      [276, 333],
      [266, 282],
      [306, 258],
    ].map(([cx, cy]) => (
      <circle key={cx} cx={cx} cy={cy} r={4.2} fill="#565E6C" />
    ))}
    <path d="M298 246 L316 246 L328 274 L292 274 Z" fill="#4A515E" />
    <path d="M310 246 L316 246 L328 274 L318 274 Z" fill="#000000" opacity={0.22} />
    <path d="M298 246 L304 246 L297 274 L292 274 Z" fill="#FFFFFF" opacity={0.12} />
    <ellipse cx={310} cy={274} rx={18} ry={4} style={{ fill: lit ? accent : "#1C2029" }} />
    {lit && <ellipse cx={310} cy={274} rx={9} ry={2} fill="#FFFFFF" opacity={0.7} />}
  </g>
);

/** A monstera in a glazed pot, leaves split the way the real ones are. */
const leaf = (x, y, r, a, flip = 1) => {
  const t = `translate(${x} ${y}) rotate(${a}) scale(${flip} 1)`;
  return (
    <g transform={t}>
      <path d={`M0 0 C${r * 0.9} ${-r * 0.2} ${r * 1.1} ${-r * 1.1} 0 ${-r * 1.3} C${-r * 1.1} ${-r * 1.1} ${-r * 0.9} ${-r * 0.2} 0 0 Z`} fill="#2E9E58" />
      <path d={`M0 0 C${r * 0.9} ${-r * 0.2} ${r * 1.1} ${-r * 1.1} 0 ${-r * 1.3} Z`} fill="#000000" opacity={0.15} />
      <Detail d={`M0 -2 L0 ${-r * 1.2}`} w={1} c="#1E6B3B" o={0.9} />
    </g>
  );
};
const Plant = () => (
  <g>
    <Shadow cx={135} rx={24} />
    <path d="M135 310 C134 296 128 286 120 280" fill="none" stroke="#1E6B3B" strokeWidth={2.4} strokeLinecap="round" />
    <path d="M135 310 C137 294 146 282 154 276" fill="none" stroke="#1E6B3B" strokeWidth={2.4} strokeLinecap="round" />
    <path d="M135 310 L135 270" fill="none" stroke="#1E6B3B" strokeWidth={2.4} strokeLinecap="round" />
    {leaf(120, 282, 17, -50)}
    {leaf(154, 278, 16, 48)}
    {leaf(135, 272, 18, 0)}
    {leaf(126, 300, 11, -78)}
    <path d="M115 310 L155 310 L150 344 L120 344 Z" fill="#E8DCCB" />
    <path d="M142 310 L155 310 L150 344 L140 344 Z" fill="#000000" opacity={0.12} />
    <rect x={113} y={305} width={44} height={8} rx={3} fill="#F2E8DA" />
    <path d="M117 324 L153 324 L152.4 329 L117.6 329 Z" fill="#D7684A" />
  </g>
);

/** Three hardbacks, page edges showing, a ribbon bookmark. */
const Books = () => (
  <g>
    <Shadow cx={205} rx={38} />
    {[
      [171, 330, 68, 14, "#C2453A"],
      [175, 318, 60, 12, "#2F5FA8"],
      [179, 307, 54, 11, "#2F8A5F"],
    ].map(([x, y, w, h, c]) => (
      <g key={y}>
        <rect x={x} y={y} width={w} height={h} rx={2} fill={c} />
        <rect x={x + 4} y={y + 2.5} width={w - 8} height={h - 5} fill="#F4EBDD" />
        <Detail d={`M${x + 6} ${y + h / 2} L${x + w - 6} ${y + h / 2}`} w={0.8} c="#C9B99E" o={0.9} />
        <rect x={x + w - 12} y={y} width={12} height={h} rx={2} fill="#000000" opacity={0.15} />
        <rect x={x} y={y} width={w} height={1.8} rx={0.9} fill="#FFFFFF" opacity={0.25} />
      </g>
    ))}
    <path d="M214 307 L214 300 L218 303 L222 300 L222 307 Z" fill="#E8B23A" />
  </g>
);

/** A ceramic mug in the accent colour, coffee inside, steam rising. */
const Mug = ({ accent }) => (
  <g>
    <Shadow cx={495} rx={21} />
    <path d="M511 320 C524 319 526 338 510 338" fill="none" stroke="#F1F2F4" strokeWidth={5} strokeLinecap="round" />
    <path d="M479 314 L511 314 L509 341 Q495 345 481 341 Z" fill="#F1F2F4" />
    <path d="M500 314 L511 314 L509 341 Q503 343 499 343 Z" fill="#000000" opacity={0.1} />
    <path d="M480 322 L510 322 L509.5 330 L480.5 330 Z" style={{ fill: accent }} />
    <ellipse cx={495} cy={314} rx={16} ry={3.6} fill="#5A3A22" />
    <ellipse cx={491} cy={313.4} rx={6} ry={1.3} fill="#8A5E3B" />
    {["scene-steam1", "scene-steam2", "scene-steam3"].map((c, i) => (
      <path key={c} className={c} d={`M${487 + i * 8} 309 Q${490 + i * 8 - (i === 1 ? 6 : 0)} 301 ${487 + i * 8} 293`} stroke="#E2E8F0" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.5} />
    ))}
  </g>
);

/** A phone propped on a little stand, home screen of app tiles. */
const Phone = ({ accent }) => (
  <g>
    <Shadow cx={542} rx={18} />
    <path d="M530 344 L536 330 L548 330 L554 344 Z" fill="#3A404C" />
    <g transform="rotate(-10 542 326)">
      <rect x={527} y={302} width={30} height={46} rx={5} fill="#15181E" />
      <rect x={529} y={304} width={26} height={42} rx={3.5} fill="#1F2A44" />
      <rect x={529} y={304} width={26} height={20} rx={3.5} style={{ fill: accent }} opacity={0.35} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={531.5 + (i % 4) * 6} y={308 + Math.floor(i / 4) * 7} width={4} height={4} rx={1.2} fill={["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF"][(i * 3) % 4]} />
      ))}
      <rect x={538} y={305} width={8} height={1.6} rx={0.8} fill="#0B0D12" />
      <rect x={531} y={340} width={22} height={4} rx={2} fill="#FFFFFF" opacity={0.18} />
    </g>
  </g>
);

/** Keyboard in perspective. Mechanical: tall caps, accent keys, underglow. */
const Keyboard = ({ mech, accent }) => {
  const rows = mech ? 4 : 3;
  const top = mech ? 322 : 327;
  const keys = [];
  for (let r = 0; r < rows; r += 1) {
    const f = r / rows;
    const y = top + 3 + r * (mech ? 4.6 : 4);
    const left = 344 - 6 * f;
    const right = 456 + 6 * f;
    const n = 14;
    const kw = (right - left) / n;
    for (let i = 0; i < n; i += 1) {
      const special = mech && ((r === 0 && i === 0) || (r === 2 && i === n - 1) || (r === 3 && i > 4 && i < 9));
      if (r === rows - 1 && i > 4 && i < 9) {
        if (i === 5) keys.push(<rect key={`${r}-sp`} x={left + 5 * kw + 0.5} y={y} width={kw * 4 - 1} height={mech ? 3.6 : 2.8} rx={1} fill={mech ? "#3B414D" : "#2B2F37"} />);
        continue;
      }
      keys.push(
        <g key={`${r}-${i}`}>
          <rect x={left + i * kw + 0.5} y={y} width={kw - 1} height={mech ? 3.6 : 2.8} rx={1} style={{ fill: special ? accent : mech ? "#E9E6DF" : "#2B2F37" }} />
          {mech && <rect x={left + i * kw + 0.5} y={y + 2.6} width={kw - 1} height={1} fill="#000000" opacity={0.2} />}
        </g>,
      );
    }
  }
  return (
    <g>
      <Shadow cx={400} rx={66} ry={4.5} />
      {mech && <ellipse cx={400} cy={344} rx={64} ry={3} style={{ fill: accent }} opacity={0.35} />}
      <path d={`M342 ${top} L458 ${top} L466 ${D - 1} L334 ${D - 1} Z`} fill={mech ? "#2A2E36" : "#B9BFC9"} />
      <path d={`M342 ${top} L458 ${top} L458.6 ${top + 1.6} L341.4 ${top + 1.6} Z`} fill="#FFFFFF" opacity={0.2} />
      {keys}
    </g>
  );
};

/* ---------- new desk props ---------- */

/** Mouse on a mousepad. */
const Mouse = ({ accent }) => (
  <g>
    <path d="M538 344 L590 344 L586 338 L542 338 Z" fill="#2E333D" />
    <path d="M538 344 L590 344 L589.4 343 L538.6 343 Z" style={{ fill: accent }} opacity={0.7} />
    <path d="M556 339 C556 330 572 330 572 339 Z" fill="#E8EAEE" />
    <path d="M565 331 C570 332 572 335 572 339 L564 339 Z" fill="#000000" opacity={0.12} />
    <Detail d="M564 331 L564 335" w={1} />
  </g>
);

/** An open notebook with a pen across it. */
const Notebook = () => (
  <g>
    <Shadow cx={610} rx={34} ry={2.6} />
    <path d="M582 343 L640 343 L634 335 L588 335 Z" fill="#F7F3EA" />
    <path d="M611 335 L611 343" stroke="#C9B99E" strokeWidth={1} />
    <path d="M582 343 L640 343 L640 344.5 L582 344.5 Z" fill="#2F5FA8" />
    {[337.5, 340].map((y) => (
      <Detail key={y} d={`M${592 - (y - 335)} ${y} L${607} ${y} M${615} ${y} L${630 + (y - 335)} ${y}`} w={0.7} c="#8FA8C8" o={0.9} />
    ))}
    <path d="M596 341 L628 334" stroke="#2B2F37" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M626 334.4 L630 333.6" stroke="#E8B23A" strokeWidth={2.2} strokeLinecap="round" />
  </g>
);

/** Sticky-note pads, stacked. */
const Stickies = () => (
  <g>
    <Shadow cx={640} rx={15} ry={2.4} />
    <path d="M628 344 L652 344 L650 337 L630 337 Z" fill="#FFD93D" />
    <path d="M630 337 L650 337 L648.6 332 L631.4 332 Z" fill="#FF8FB1" transform="rotate(-6 640 334)" />
    <path d="M628 344 L652 344 L652 342.6 L628 342.6 Z" fill="#000000" opacity={0.12} />
  </g>
);

/** The rubber duck: every debugger's best listener. */
const Duck = () => (
  <g>
    <Shadow cx={660} rx={14} ry={2.6} />
    <path d="M647 344 C645 332 652 326 662 328 C672 329 676 336 672 344 Z" fill="#FFD23F" />
    <path d="M666 329 C673 331 676 337 672 344 L664 344 Z" fill="#E8A91F" opacity={0.7} />
    <circle cx={655} cy={323} r={7.5} fill="#FFD23F" />
    <path d="M647.5 322 L642 324 L647.5 326 Z" fill="#FF8A2B" />
    <circle cx={653} cy={321} r={1.4} fill={INK} />
    <circle cx={652.6} cy={320.6} r={0.45} fill="#FFFFFF" />
    <path d="M655 337 C660 333 666 334 668 338" fill="none" stroke="#E8A91F" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

/** A steel water bottle. */
const Bottle = ({ accent }) => (
  <g>
    <Shadow cx={240} rx={11} ry={2.6} />
    <rect x={231} y={300} width={18} height={44} rx={6} style={{ fill: accent }} />
    <rect x={243} y={300} width={6} height={44} rx={3} fill="#000000" opacity={0.18} />
    <rect x={233} y={304} width={3} height={34} rx={1.5} fill="#FFFFFF" opacity={0.35} />
    <rect x={233} y={292} width={14} height={9} rx={2.5} fill="#2E333D" />
    <rect x={235} y={288} width={10} height={5} rx={2} fill="#3B414C" />
  </g>
);

/** A small cactus in a terracotta pot. */
const Succulent = () => (
  <g>
    <Shadow cx={170} rx={14} ry={2.6} />
    <path d="M170 328 C162 328 162 304 170 302 C178 304 178 328 170 328 Z" fill="#4FA36B" />
    <path d="M163 318 C156 318 156 308 160 307 C163 307 163 314 165 316 Z" fill="#4FA36B" />
    <path d="M177 314 C183 314 184 305 180 304 C177 304 177 310 175 312 Z" fill="#4FA36B" />
    <path d="M172 303 C176 306 177 322 172 328 L170 328 Z" fill="#000000" opacity={0.13} />
    <Detail d="M170 306 L170 326" w={0.9} c="#2E7A4A" o={0.9} />
    <circle cx={170} cy={301} r={2.4} fill="#FF7AA8" />
    <path d="M158 328 L182 328 L179 344 L161 344 Z" fill="#C8693F" />
    <rect x={157} y={325} width={26} height={5} rx={2} fill="#D97D4F" />
  </g>
);

/** A bookshelf speaker with two drivers. */
const Speaker = () => (
  <g>
    <Shadow cx={300} rx={16} ry={3} />
    <rect x={287} y={296} width={26} height={48} rx={3} fill="#2E333D" />
    <rect x={306} y={296} width={7} height={48} rx={2} fill="#000000" opacity={0.25} />
    <circle cx={299} cy={306} r={4.2} fill="#16181D" />
    <circle cx={299} cy={306} r={1.6} fill="#8A93A3" />
    <circle cx={299} cy={326} r={8} fill="#16181D" />
    <circle cx={299} cy={326} r={3.4} fill="#4A515E" />
    <circle cx={297.6} cy={324.6} r={1.2} fill="#FFFFFF" opacity={0.4} />
  </g>
);

/* ---------- floor props ---------- */

/** A mesh waste bin with a crumpled draft in it. */
const Bin = () => (
  <g>
    <Shadow cx={720} y={480} rx={22} ry={3.6} />
    <circle cx={714} cy={438} r={6} fill="#F4EBDD" />
    <path d="M700 438 L740 438 L735 480 L705 480 Z" fill="#4A515E" />
    <path d="M726 438 L740 438 L735 480 L727 480 Z" fill="#000000" opacity={0.2} />
    {[706, 713, 720, 727, 734].map((x, i) => (
      <Detail key={x} d={`M${x} 442 L${x - (x - 720) * 0.12} 476`} w={1} c="#2E333D" o={0.8} />
    ))}
    <rect x={698} y={435} width={44} height={5} rx={2.5} fill="#5D6470" />
  </g>
);

/** A tall potted fiddle-leaf fig, standing on the floor. */
const FloorPlant = () => (
  <g>
    <Shadow cx={60} y={488} rx={30} ry={4.5} />
    <path d="M60 452 C58 420 60 380 62 340" fill="none" stroke="#6B4A2E" strokeWidth={4} strokeLinecap="round" />
    {[
      [62, 344, 20, -10],
      [52, 364, 18, -55],
      [70, 372, 18, 50],
      [54, 396, 17, -60],
      [68, 404, 17, 55],
      [58, 424, 15, -50],
      [66, 430, 14, 45],
    ].map(([x, y, r, a], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
        <path d={`M0 0 C${r * 0.9} ${-r * 0.3} ${r * 0.9} ${-r * 1.3} 0 ${-r * 1.5} C${-r * 0.9} ${-r * 1.3} ${-r * 0.9} ${-r * 0.3} 0 0 Z`} fill={i % 2 ? "#3D8F57" : "#2E7A4A"} />
        <Detail d={`M0 -1 L0 ${-r * 1.3}`} w={0.9} c="#1E5B35" o={0.8} />
      </g>
    ))}
    <path d="M38 452 L82 452 L76 488 L44 488 Z" fill="#E8E4DC" />
    <path d="M66 452 L82 452 L76 488 L66 488 Z" fill="#000000" opacity={0.12} />
    <rect x={36} y={447} width={48} height={8} rx={3} fill="#F2EFE8" />
  </g>
);

/** A backpack slumped against the desk leg. */
const Backpack = ({ accent }) => (
  <g>
    <Shadow cx={600} y={486} rx={28} ry={4} />
    <path d="M578 486 C574 456 580 440 600 438 C620 440 626 456 622 486 Z" style={{ fill: accent }} />
    <path d="M608 439 C620 442 626 456 622 486 L610 486 Z" fill="#000000" opacity={0.18} />
    <path d="M588 444 C588 432 612 432 612 444" fill="none" stroke="#2E333D" strokeWidth={3} strokeLinecap="round" />
    <path d="M584 462 L616 462 L614 482 L586 482 Z" fill="#000000" opacity={0.15} />
    <Detail d="M584 462 L616 462" w={1.4} />
    <rect x={597} y={460} width={6} height={4} rx={1} fill="#D8DDE5" />
  </g>
);

/** Art per prop id, given the scene's mood. */
export const propArt = ({ accent, lit, mech }) => ({
  lamp: <Lamp accent={accent} lit={lit} />,
  plant: <Plant />,
  books: <Books />,
  keyboard: <Keyboard mech={mech} accent={accent} />,
  phone: <Phone accent={accent} />,
  mug: <Mug accent={accent} />,
  mouse: <Mouse accent={accent} />,
  notebook: <Notebook />,
  stickies: <Stickies />,
  duck: <Duck />,
  bottle: <Bottle accent={accent} />,
  succulent: <Succulent />,
  speaker: <Speaker />,
  bin: <Bin />,
  floorPlant: <FloorPlant />,
  backpack: <Backpack accent={accent} />,
});

export { Keyboard as KeyboardArt };
