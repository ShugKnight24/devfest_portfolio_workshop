import {
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  TOP_COLORS,
  findOption,
} from "../../config/avatar";

/**
 * The visitor's avatar, drawn as an ink-and-flat-colour chibi.
 *
 * Style rules, kept tight so every option looks like one family:
 * - big head (about a third of the seated figure), small body, short limbs
 * - one warm ink outline (`INK`) on every silhouette, thinner ink for details
 * - flat fills: a base, one shade on the side away from the light (upper
 *   left), one highlight; no gradients on the figure
 * - big, glossy eyes with two catchlights; a small hooked nose line
 *
 * Coordinates are the scene's: the head is centred on x = 400 with the chin
 * at y = 226, the desk top at y = 344. Several copies can share one document
 * (scene, Studio tiles, the download badge), so every id goes through `uid`.
 */

export const INK = "#221B26";
const W = 3;
const BLUSH = "#FF7AA8";
const MOUTH = "#6B1E2B";
const GOLD = { base: "#E9C46A", shadow: "#B8913A" };

const HEAD = "M342 164 C342 127 367 104 400 104 C433 104 458 127 458 164 C458 199 433 226 400 226 C367 226 342 199 342 164 Z";
const TORSO = "M400 234 C372 234 354 240 348 254 C342 268 340 300 340 352 L460 352 C460 300 458 268 452 254 C446 240 428 234 400 234 Z";
const EYE_Y = 170;
const EYE_DX = 22;

/** Everything the art needs, resolved from an avatar config once. */
export const resolveLook = (avatar, accent = "var(--color-primary, #00FFCC)") => ({
  ...avatar,
  accent,
  skin: findOption(SKIN_TONES, avatar.skinTone),
  hairTone: findOption(HAIR_COLORS, avatar.hairColor),
  top: findOption(TOP_COLORS, avatar.topColor),
  hatTone: findOption(TOP_COLORS, avatar.hatColor),
  iris: findOption(EYE_COLORS, avatar.eyeColor).base,
});

/* ---------- ink helpers ---------- */

const shapeEl = (s, props, key) => {
  if (s.c) return <circle key={key} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} {...props} />;
  if (s.e) return <ellipse key={key} cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} {...props} />;
  if (s.r) return <rect key={key} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4] ?? 0} {...props} />;
  return <path key={key} d={s.d} {...props} />;
};

/**
 * A silhouette made of several overlapping shapes, outlined once around the
 * whole: every shape is first drawn as a fat ink stroke, then every shape is
 * filled on top, so the joins between them vanish.
 */
const Blob = ({ shapes, fill, w = W, style }) => (
  <g>
    {shapes.map((s, i) => shapeEl(s, { fill: INK, stroke: INK, strokeWidth: w * 2, strokeLinejoin: "round" }, `o${i}`))}
    {shapes.map((s, i) => shapeEl(s, { fill, style }, `f${i}`))}
  </g>
);

// Fill goes through `style` too: a theme colour arrives as `var(--…)`, which
// presentation attributes cannot resolve.
const Inked = ({ d, fill, w = W, style, ...rest }) => (
  <path d={d} fill={fill} style={{ fill, ...style }} stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" {...rest} />
);

const Line = ({ d, w = 2.2, color = INK, opacity }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
);

const mirrorX = (x) => 800 - x;
const MIRROR = "translate(800 0) scale(-1 1)";

/* ---------- hair ---------- */

const ringOfCircles = (cx, cy, rx, ry, r, from, to, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return { c: [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r] };
  });

const CAP_SLICK = "M341 162 C338 118 366 97 400 97 C434 97 462 118 459 162 C451 138 430 122 400 120 C370 122 349 138 341 162 Z";
const CAP_FRINGE =
  "M341 162 C336 118 364 96 400 96 C436 96 464 118 459 162 C454 146 446 138 438 134 L432 142 L424 132 L414 140 L404 130 L394 140 L384 131 L374 141 L366 134 C354 140 346 150 341 162 Z";
const SHINE = "M366 118 Q382 106 402 105";

const loc = (x, top, len, wdt) => ({ r: [x - wdt / 2, top, wdt, len, wdt / 2] });

/** Volume behind the skull. */
const hairBack = (style) => {
  switch (style) {
    case "coils":
      return [{ e: [400, 150, 72, 62] }, ...ringOfCircles(400, 150, 70, 60, 22, 160, 380, 13)];
    case "curls":
      return [{ e: [400, 152, 64, 54] }, { c: [338, 176, 16] }, { c: [462, 176, 16] }, { c: [342, 200, 13] }, { c: [458, 200, 13] }];
    case "locs":
      return [
        { e: [400, 146, 62, 50] },
        ...[330, 344, 358, 372].map((x, i) => loc(x, 140, 108 + (i % 2) * 16, 11)),
        ...[428, 442, 456, 470].map((x, i) => loc(x, 140, 108 + ((i + 1) % 2) * 16, 11)),
      ];
    case "braids":
      return [
        { e: [400, 146, 62, 50] },
        ...[332, 342, 352, 362, 372].map((x, i) => loc(x, 140, 140 + (i % 2) * 10, 10)),
        ...[428, 438, 448, 458, 468].map((x, i) => loc(x, 140, 140 + ((i + 1) % 2) * 10, 10)),
      ];
    case "long":
      return [{ d: "M338 160 C334 110 366 92 400 92 C434 92 466 110 462 160 L472 292 C452 302 348 302 328 292 Z" }];
    case "wavyBob":
      return [
        {
          d: "M336 160 C332 110 366 92 400 92 C434 92 468 110 464 160 C470 190 468 210 462 228 Q452 238 444 228 Q436 238 428 230 L372 230 Q364 238 356 228 Q348 238 338 228 C332 210 330 190 336 160 Z",
        },
      ];
    case "ponytail":
      return [{ d: "M436 110 C478 106 496 150 488 198 C482 232 468 254 456 262 C468 226 472 188 456 150 C450 136 444 124 436 110 Z" }];
    case "spaceBuns":
      return [{ c: [356, 104, 22] }, { c: [444, 104, 22] }];
    case "bun":
      return [{ c: [400, 90, 21] }];
    default:
      return [];
  }
};

/** Hairline and fringe in front of the skull. Returns shapes, plus extras drawn on top. */
const hairFront = (style) => {
  switch (style) {
    case "buzz":
      return { shapes: [{ d: "M343 160 C342 124 366 104 400 104 C434 104 458 124 457 160 C452 140 432 128 400 128 C368 128 348 140 343 160 Z" }], w: 2.4, texture: true };
    case "crop":
      return { shapes: [{ d: CAP_FRINGE }], shine: true };
    case "fade":
      return {
        shapes: [{ d: "M350 142 C346 102 372 84 400 84 C428 84 454 102 450 142 C440 130 420 126 400 126 C380 126 360 130 350 142 Z" }],
        shine: true,
        sides: true,
      };
    case "coils":
      return { shapes: [{ d: CAP_SLICK }, ...ringOfCircles(400, 146, 50, 24, 10, 190, 350, 9)] };
    case "curls":
      return { shapes: [{ d: CAP_SLICK }, ...ringOfCircles(400, 140, 50, 18, 11, 195, 345, 7)], curls: true };
    case "locs":
    case "braids":
      return { shapes: [{ d: CAP_SLICK }], part: true };
    case "bun":
    case "ponytail":
      return { shapes: [{ d: CAP_SLICK }], shine: true, tie: style };
    case "spaceBuns":
      return { shapes: [{ d: CAP_SLICK }], part: true, shine: true };
    case "long":
      return { shapes: [{ d: "M340 168 C334 116 366 94 404 94 C440 94 466 118 460 168 C452 140 430 124 404 122 C392 140 370 152 340 168 Z" }], shine: true };
    case "wavyBob":
      return { shapes: [{ d: "M339 166 C334 116 366 94 400 94 C436 94 466 116 461 166 C452 146 438 132 418 128 Q404 142 386 132 Q366 146 339 166 Z" }], shine: true };
    case "spiky":
      return {
        shapes: [
          {
            d: "M342 162 L334 122 L356 128 L350 96 L376 110 L382 80 L402 104 L420 78 L428 108 L452 92 L446 124 L468 118 L458 162 C452 146 440 136 428 132 L418 142 L408 132 L396 142 L386 132 L374 142 L366 134 C354 140 346 150 342 162 Z",
          },
        ],
      };
    default:
      return null;
  }
};

const HairBack = ({ look }) => {
  const shapes = hairBack(look.hairStyle);
  if (!shapes.length) return null;
  const { base, shadow } = look.hairTone;
  return (
    <g>
      <Blob shapes={shapes} fill={shadow} />
      {(look.hairStyle === "locs" || look.hairStyle === "braids") && (
        <g opacity={0.5}>
          {shapes.slice(1).map((s, i) => {
            const [x, y, wdt, h] = s.r;
            const cx = x + wdt / 2;
            return Array.from({ length: Math.floor(h / 14) }, (_, k) => (
              <Line
                key={`${i}-${k}`}
                d={look.hairStyle === "braids" ? `M${cx - wdt / 2 + 1} ${y + 20 + k * 14} L${cx} ${y + 26 + k * 14} L${cx + wdt / 2 - 1} ${y + 20 + k * 14}` : `M${cx - wdt / 2 + 2} ${y + 24 + k * 14} L${cx + wdt / 2 - 2} ${y + 24 + k * 14}`}
                w={1.4}
                color={INK}
              />
            ));
          })}
          {look.hairStyle === "braids" &&
            shapes.slice(1).map((s, i) => <circle key={`bead-${i}`} cx={s.r[0] + s.r[2] / 2} cy={s.r[1] + s.r[3] - 2} r={3.6} style={{ fill: i % 2 ? GOLD.base : look.accent }} stroke={INK} strokeWidth={1.4} />)}
        </g>
      )}
      {look.hairStyle === "long" && <Line d="M352 200 L346 286 M448 200 L454 286" w={1.6} color={base} opacity={0.6} />}
    </g>
  );
};

const HairFront = ({ look, uid }) => {
  const spec = hairFront(look.hairStyle);
  const { base, shadow } = look.hairTone;
  if (look.hairStyle === "bald") return <Line d={SHINE} w={4} color="#FFFFFF" opacity={0.4} />;
  if (!spec) return null;
  return (
    <g>
      {spec.sides && (
        <g clipPath={`url(#${uid}-head)`}>
          {/* faded sides: a short shadow above each ear, following the skull */}
          <path d="M342 160 C342 144 346 132 354 124 C356 138 356 150 352 162 Z" fill={shadow} opacity={0.6} />
          <path d="M458 160 C458 144 454 132 446 124 C444 138 444 150 448 162 Z" fill={shadow} opacity={0.6} />
        </g>
      )}
      <Blob shapes={spec.shapes} fill={base} w={spec.w ?? W} />
      {/* shade on the side away from the light */}
      <g clipPath={`url(#${uid}-hair)`}>
        <ellipse cx={468} cy={150} rx={36} ry={70} fill={shadow} opacity={0.55} />
      </g>
      {spec.texture &&
        [
          [366, 118],
          [384, 110],
          [404, 108],
          [424, 112],
          [442, 122],
          [376, 124],
          [414, 120],
          [354, 134],
          [448, 138],
        ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.3} fill={shadow} />)}
      {spec.curls &&
        ringOfCircles(400, 140, 50, 18, 11, 195, 345, 7).map((s, i) => (
          <Line key={i} d={`M${s.c[0] - 4} ${s.c[1] + 2} q4 -7 7 0 q-1 4 -4 3`} w={1.4} color={shadow} />
        ))}
      {spec.part && <Line d="M400 99 L400 120" w={2} color={shadow} />}
      {spec.shine && <Line d={SHINE} w={4} color="#FFFFFF" opacity={0.32} />}
      {spec.tie === "bun" && <Inked d="M386 108 Q400 112 414 108 L413 114 Q400 118 387 114 Z" fill={look.accent} w={1.8} />}
      {spec.tie === "ponytail" && <circle cx={444} cy={114} r={5} style={{ fill: look.accent }} stroke={INK} strokeWidth={1.8} />}
    </g>
  );
};

/* ---------- face ---------- */

const Eye = ({ x, look, uid, delayClass = "" }) => {
  if (look.expression === "laugh") return <Line d={`M${x - 10} ${EYE_Y + 3} Q${x} ${EYE_Y - 9} ${x + 10} ${EYE_Y + 3}`} w={3.2} />;
  const wide = look.expression === "wow" ? 1.12 : 1;
  const ry = 11.5 * wide;
  const clip = `${uid}-eye${x}`;
  return (
    <g>
      <clipPath id={clip}>
        <ellipse cx={x} cy={EYE_Y} rx={10.5 * wide} ry={ry} />
      </clipPath>
      <ellipse cx={x} cy={EYE_Y} rx={10.5 * wide} ry={ry} fill="#FFFFFF" stroke={INK} strokeWidth={2.2} />
      <g clipPath={`url(#${clip})`}>
        <circle cx={x + 0.5} cy={EYE_Y + 1.5} r={7.4} fill={look.iris} />
        <circle cx={x + 0.5} cy={EYE_Y + 1.5} r={7.4} fill="none" stroke="#000000" strokeOpacity={0.35} strokeWidth={1.4} />
        <circle cx={x + 0.5} cy={EYE_Y + 1.5} r={3.6} fill={INK} />
        <circle cx={x - 2.6} cy={EYE_Y - 2.6} r={2.5} fill="#FFFFFF" />
        <circle cx={x + 3.4} cy={EYE_Y + 4.4} r={1.1} fill="#FFFFFF" />
        {/* upper lid shadow on the eyeball */}
        <ellipse cx={x} cy={EYE_Y - ry} rx={12} ry={4} fill="#000000" opacity={0.12} />
        {/* blink: a lid that drops now and then (see .scene-lid); scaled to nothing when exported */}
        <rect className={`scene-lid ${delayClass}`} x={x - 12} y={EYE_Y - ry} width={24} height={ry * 2} fill={look.skin.base} transform="scale(1 0)" />
      </g>
      <Line d={`M${x - 11} ${EYE_Y - 3} Q${x} ${EYE_Y - 16 * wide} ${x + 11} ${EYE_Y - 3}`} w={3.2} />
    </g>
  );
};

const BROWS = {
  smile: [0, 0],
  grin: [-2, 0],
  laugh: [-3, 0],
  smirk: [0, -4],
  focused: [4, 3],
  wow: [-7, -2],
};

const Brows = ({ look }) => {
  const [lift, tilt] = BROWS[look.expression] ?? BROWS.smile;
  const y = 147 + lift;
  const color = look.hairStyle === "bald" ? look.hairTone.base : look.hairTone.shadow;
  const thick = look.facialHair === "fullBeard" ? 5 : 4;
  return (
    <g>
      <Line d={`M${400 - 34} ${y + 3} Q${400 - 24} ${y - 4} ${400 - 12} ${y + tilt}`} w={thick} color={color} />
      <Line d={`M${400 + 12} ${y + (look.expression === "smirk" ? -tilt : tilt)} Q${400 + 24} ${y - 4} ${400 + 34} ${y + 3}`} w={thick} color={color} />
    </g>
  );
};

const Mouth = ({ look }) => {
  switch (look.expression) {
    case "grin":
    case "laugh": {
      const big = look.expression === "laugh" ? 4 : 0;
      return (
        <g>
          <Inked d={`M${382 - big} 200 Q400 ${222 + big * 2} ${418 + big} 200 Z`} fill={MOUTH} w={2.4} />
          <path d={`M${385 - big} 201 Q400 ${206} ${415 + big} 201 L${414 + big} 204 Q400 210 ${386 - big} 204 Z`} fill="#FFFFFF" />
          <ellipse cx={400} cy={212 + big} rx={7 + big / 2} ry={3.4} fill="#F27A8A" />
        </g>
      );
    }
    case "smirk":
      return <Line d="M387 206 Q402 210 415 199" w={2.8} />;
    case "focused":
      return <Line d="M390 206 Q400 204 410 206" w={2.8} />;
    case "wow":
      return <ellipse cx={400} cy={207} rx={5.5} ry={7} fill={MOUTH} stroke={INK} strokeWidth={2.2} />;
    default:
      return (
        <g>
          <Line d="M385 201 Q400 214 415 201" w={2.8} />
          <Line d="M383 199 Q385 203 387 202" w={2} />
        </g>
      );
  }
};

const FacialHair = ({ look }) => {
  const { base, shadow } = look.hairTone;
  const stache = <Inked d="M382 197 Q391 189 400 194 Q409 189 418 197 Q410 204 400 200 Q390 204 382 197 Z" fill={base} w={2} />;
  switch (look.facialHair) {
    case "stubble":
      return (
        <g>
          <path d="M350 186 C356 212 378 226 400 226 C422 226 444 212 450 186 C440 204 422 214 400 214 C378 214 360 204 350 186 Z" fill={base} opacity={0.28} />
          {Array.from({ length: 22 }, (_, i) => (
            <circle key={i} cx={360 + ((i * 37) % 80)} cy={204 + ((i * 13) % 16)} r={0.9} fill={shadow} opacity={0.7} />
          ))}
        </g>
      );
    case "moustache":
      return stache;
    case "goatee":
      return (
        <g>
          {stache}
          <Inked d="M390 214 Q400 211 410 214 L407 228 Q400 233 393 228 Z" fill={base} w={2} />
        </g>
      );
    case "fullBeard":
      return (
        <g>
          <Inked
            d="M344 172 C346 206 368 236 400 238 C432 236 454 206 456 172 C450 188 442 196 432 198 C426 214 414 222 400 222 C386 222 374 214 368 198 C358 196 350 188 344 172 Z"
            fill={base}
          />
          <path d="M432 198 C440 196 450 188 456 172 C454 206 432 236 400 238 C420 228 432 214 432 198 Z" fill={shadow} opacity={0.6} />
          {stache}
        </g>
      );
    default:
      return null;
  }
};

/* ---------- accessories ---------- */

const HATS = {
  beanie: (c) => (
    <g>
      <circle cx={400} cy={80} r={11} style={{ fill: c }} stroke={INK} strokeWidth={W} />
      <Inked d="M336 154 C334 104 366 84 400 84 C434 84 466 104 464 154 Z" fill={c} />
      <path d="M440 92 C458 106 466 128 464 154 L446 154 C448 132 446 112 440 92 Z" fill="#000000" opacity={0.16} />
      <Inked d="M334 146 C360 138 440 138 466 146 L466 164 C440 156 360 156 334 164 Z" fill={c} />
      <path d="M334 146 C360 138 440 138 466 146 L466 164 C440 156 360 156 334 164 Z" fill="#000000" opacity={0.18} />
      {[352, 368, 384, 400, 416, 432, 448].map((x) => (
        <Line key={x} d={`M${x} 144 L${x} 158`} w={1.4} opacity={0.4} />
      ))}
    </g>
  ),
  cap: (c) => (
    <g>
      <Inked d="M342 150 C340 106 368 88 400 88 C432 88 460 106 458 150 Z" fill={c} />
      <path d="M436 94 C454 106 460 126 458 150 L442 150 C444 128 442 110 436 94 Z" fill="#000000" opacity={0.16} />
      <Line d="M400 88 L400 140" w={1.6} opacity={0.4} />
      <circle cx={400} cy={89} r={4} style={{ fill: c }} stroke={INK} strokeWidth={1.8} />
      <Inked d="M334 152 Q400 132 466 152 Q474 162 464 168 Q400 150 336 168 Q326 162 334 152 Z" fill={c} />
      <path d="M336 168 Q400 150 464 168 Q466 164 466 160 Q400 144 334 160 Z" fill="#000000" opacity={0.22} />
    </g>
  ),
  backwardsCap: (c) => (
    <g>
      <Inked d="M342 152 C340 106 368 86 400 86 C432 86 460 106 458 152 Q400 140 342 152 Z" fill={c} />
      <path d="M436 92 C454 106 460 128 458 152 L442 148 C444 126 442 108 436 92 Z" fill="#000000" opacity={0.16} />
      <Inked d="M380 148 Q400 128 420 148 Z" fill="#000000" fillOpacity={0.3} w={2} />
      <Line d="M378 146 L422 146" w={2.4} />
      <circle cx={400} cy={87} r={4} style={{ fill: c }} stroke={INK} strokeWidth={1.8} />
    </g>
  ),
  bucket: (c) => (
    <g>
      <Inked d="M350 144 C350 104 372 88 400 88 C428 88 450 104 450 144 Z" fill={c} />
      <path d="M432 94 C446 106 450 124 450 144 L436 144 C438 124 436 108 432 94 Z" fill="#000000" opacity={0.16} />
      <Inked d="M324 150 Q400 128 476 150 Q484 162 472 166 Q400 148 328 166 Q316 162 324 150 Z" fill={c} />
      <Line d="M352 134 Q400 124 448 134" w={1.6} opacity={0.45} />
    </g>
  ),
  headband: (c) => (
    <g>
      <Inked d="M341 140 Q400 122 459 140 L460 154 Q400 136 340 154 Z" fill={c} />
      <Line d="M346 146 Q400 130 454 146" w={1.2} color="#FFFFFF" opacity={0.5} />
    </g>
  ),
};

const lensAt = (x, style) => {
  const s = x < 400 ? -1 : 1;
  switch (style) {
    case "square":
      return { r: [x - 16, EYE_Y - 12, 32, 24, 6] };
    case "catEye":
      return { d: `M${x - 16 * s} ${EYE_Y - 4} Q${x} ${EYE_Y - 12} ${x + 16 * s} ${EYE_Y - 12} L${x + 19 * s} ${EYE_Y - 17} Q${x + 18 * s} ${EYE_Y + 6} ${x + 2 * s} ${EYE_Y + 11} Q${x - 14 * s} ${EYE_Y + 12} ${x - 16 * s} ${EYE_Y - 4} Z` };
    case "aviator":
      return { d: `M${x - 15} ${EYE_Y - 10} L${x + 15} ${EYE_Y - 10} Q${x + 18 * s} ${EYE_Y + 6} ${x + 5 * s} ${EYE_Y + 13} Q${x - 8 * s} ${EYE_Y + 15} ${x - 14 * s} ${EYE_Y + 3} Q${x - 17 * s} ${EYE_Y - 4} ${x - 15} ${EYE_Y - 10} Z` };
    case "shades":
      return { r: [x - 17, EYE_Y - 11, 34, 22, 9] };
    default:
      return { c: [x, EYE_Y, 15.5] };
  }
};

const Eyewear = ({ look }) => {
  const style = look.eyewear;
  const frame = style === "aviator" ? GOLD.shadow : INK;
  const lensFill = style === "shades" ? "#15131A" : style === "aviator" ? "#3B2A1A" : "#FFFFFF";
  const lensOpacity = style === "shades" ? 0.95 : style === "aviator" ? 0.45 : 0.14;
  const xs = [400 - EYE_DX, 400 + EYE_DX];
  return (
    <g>
      <Line d={`M${400 - EYE_DX - 16} ${EYE_Y - 4} L342 ${EYE_Y - 2} M${400 + EYE_DX + 16} ${EYE_Y - 4} L458 ${EYE_Y - 2}`} w={2.4} color={frame} />
      {xs.map((x) => shapeEl(lensAt(x, style), { fill: lensFill, fillOpacity: lensOpacity, stroke: frame, strokeWidth: style === "aviator" ? 2.2 : 3.2 }, `l${x}`))}
      {style === "aviator" && <Line d={`M393 ${EYE_Y - 9} L407 ${EYE_Y - 9}`} w={2} color={frame} />}
      <Line d={`M${style === "shades" ? 383 : 385} ${EYE_Y - 2} Q400 ${EYE_Y - 8} ${style === "shades" ? 417 : 415} ${EYE_Y - 2}`} w={2.6} color={frame} />
      {style === "shades" && xs.map((x) => <Line key={x} d={`M${x - 10} ${EYE_Y - 4} L${x - 4} ${EYE_Y - 8}`} w={2.4} color="#FFFFFF" opacity={0.55} />)}
    </g>
  );
};

const Headphones = ({ look }) => (
  <g>
    <path d="M336 174 C326 92 474 92 464 174" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <path d="M336 174 C326 92 474 92 464 174" fill="none" stroke="#2A2E37" strokeWidth={6.5} strokeLinecap="round" />
    <path d="M352 112 C380 96 420 96 448 112" fill="none" style={{ stroke: look.accent }} strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
    {[324, 452].map((x) => (
      <g key={x}>
        <rect x={x} y={150} width={24} height={46} rx={10} fill="#2A2E37" stroke={INK} strokeWidth={W} />
        <rect x={x + (x < 400 ? 3 : 15)} y={158} width={6} height={30} rx={3} style={{ fill: look.accent }} opacity={0.85} />
      </g>
    ))}
  </g>
);

const Earrings = ({ look }) => {
  if (look.earrings === "none" || look.headphones) return null;
  return (
    <g>
      {[340, 460].map((x) =>
        look.earrings === "hoops" ? (
          <circle key={x} cx={x} cy={193} r={7} fill="none" stroke={INK} strokeWidth={4.4} />
        ) : (
          <circle key={x} cx={x} cy={186} r={3.6} fill={GOLD.base} stroke={INK} strokeWidth={1.6} />
        ),
      )}
      {look.earrings === "hoops" && [340, 460].map((x) => <circle key={`g${x}`} cx={x} cy={193} r={7} fill="none" stroke={GOLD.base} strokeWidth={2} />)}
    </g>
  );
};

/* ---------- body ---------- */

const Outfit = ({ look, uid }) => {
  const c = look.top.base;
  const shade = (
    <g clipPath={`url(#${uid}-torso)`}>
      <ellipse cx={474} cy={300} rx={40} ry={90} fill="#000000" opacity={0.2} />
      <path d="M356 252 Q370 244 384 242" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.25} />
    </g>
  );
  switch (look.outfit) {
    case "hoodie":
      return (
        <g>
          <Inked d={TORSO} fill={c} style={{ fill: c }} />
          {shade}
          <Inked d="M372 236 C374 262 426 262 428 236 C420 252 380 252 372 236 Z" fill={c} style={{ fill: c }} w={2.4} />
          <path d="M372 236 C374 262 426 262 428 236 C420 252 380 252 372 236 Z" fill="#000000" opacity={0.2} />
          <Line d="M391 254 L389 284 M409 254 L411 284" w={2} />
          <Line d="M389 284 L389 288 M411 284 L411 288" w={3.6} color="#E8E8E8" />
        </g>
      );
    case "collared":
      return (
        <g>
          <Inked d={TORSO} fill={c} style={{ fill: c }} />
          {shade}
          <Line d="M400 252 L400 350" w={1.6} opacity={0.5} />
          {[266, 290, 314].map((y) => (
            <circle key={y} cx={404} cy={y} r={2} fill="#FFFFFF" stroke={INK} strokeWidth={1} />
          ))}
          <Inked d="M386 236 L400 252 L390 262 L376 242 Z" fill="#FFFFFF" w={2.2} />
          <Inked d="M414 236 L400 252 L410 262 L424 242 Z" fill="#FFFFFF" w={2.2} />
        </g>
      );
    case "blazer":
      return (
        <g>
          <Inked d={TORSO} fill={c} style={{ fill: c }} />
          {shade}
          <Inked d="M384 236 L400 288 L416 236 Z" fill="#F4F4F2" w={2.2} />
          <Inked d="M384 236 L400 288 L380 300 L366 250 Z" fill={c} style={{ fill: c }} w={2.4} />
          <Inked d="M416 236 L400 288 L420 300 L434 250 Z" fill={c} style={{ fill: c }} w={2.4} />
          <path d="M416 236 L400 288 L420 300 L434 250 Z" fill="#000000" opacity={0.18} />
          <Line d="M444 278 L456 278" w={2} opacity={0.5} />
        </g>
      );
    case "turtleneck":
      return (
        <g>
          <Inked d={TORSO} fill={c} style={{ fill: c }} />
          {shade}
          <Inked d="M382 220 L418 220 L420 244 Q400 250 380 244 Z" fill={c} style={{ fill: c }} w={2.4} />
          {[388, 396, 404, 412].map((x) => (
            <Line key={x} d={`M${x} 224 L${x} 244`} w={1.2} opacity={0.35} />
          ))}
        </g>
      );
    default:
      return (
        <g>
          <Inked d={TORSO} fill={c} style={{ fill: c }} />
          {shade}
          <path d="M382 236 Q400 254 418 236" fill="none" stroke={INK} strokeWidth={W} strokeLinecap="round" />
          <path d="M385 238 Q400 250 415 238" fill="none" stroke="#000000" strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
  }
};

const Sleeve = ({ d, look }) => (
  <g>
    <path d={d} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={look.top.base} style={{ stroke: look.top.base }} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#000000" strokeOpacity={0.12} strokeWidth={8} strokeLinecap="round" transform="translate(4 2)" />
  </g>
);

/** Shared clip paths: one set per copy. */
const Defs = ({ uid, look }) => {
  const hair = hairFront(look.hairStyle);
  return (
    <defs>
      <clipPath id={`${uid}-head`}>
        <path d={HEAD} />
      </clipPath>
      <clipPath id={`${uid}-torso`}>
        <path d={TORSO} />
      </clipPath>
      <clipPath id={`${uid}-hair`}>{hair ? hair.shapes.map((s, i) => shapeEl(s, {}, i)) : <rect width={0} height={0} />}</clipPath>
    </defs>
  );
};

/* ---------- assembled ---------- */

/** Behind the chair line: hair volume. */
export const AvatarBack = ({ look }) => <HairBack look={look} />;

/** Neck, torso and (optionally) the arms down to the keyboard. */
export const AvatarBody = ({ look, uid, arms = true }) => (
  <g>
    <Inked d="M388 214 L412 214 L413 240 Q400 246 387 240 Z" fill={look.skin.shadow} w={2.4} />
    <Outfit look={look} uid={uid} />
    {arms && (
      <g>
        <Sleeve d="M356 258 C340 276 334 300 338 318 C342 330 352 334 362 334" look={look} />
        <Sleeve d={`M${mirrorX(356)} 258 C${mirrorX(340)} 276 ${mirrorX(334)} 300 ${mirrorX(338)} 318 C${mirrorX(342)} 330 ${mirrorX(352)} 334 ${mirrorX(362)} 334`} look={look} />
      </g>
    )}
  </g>
);

/** The whole head: ears, face, hair, hat and everything worn on it. */
export const AvatarHead = ({ look, uid }) => {
  const { skin } = look;
  const hat = look.hat !== "none" ? HATS[look.hat] : null;
  return (
    <g>
      {/* ears */}
      {[342, 458].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={174} rx={10} ry={14} fill={x > 400 ? skin.shadow : skin.base} stroke={INK} strokeWidth={W} />
          <Line d={x < 400 ? "M346 168 Q338 174 345 182" : "M454 168 Q462 174 455 182"} w={1.8} color={INK} opacity={0.5} />
        </g>
      ))}
      <Inked d={HEAD} fill={skin.base} />
      <g clipPath={`url(#${uid}-head)`}>
        <ellipse cx={470} cy={176} rx={38} ry={80} fill={skin.shadow} opacity={0.75} />
        <ellipse cx={372} cy={128} rx={16} ry={9} fill={skin.highlight ?? "#FFFFFF"} opacity={0.6} transform="rotate(-24 372 128)" />
        <path d="M352 196 C366 222 388 226 400 226 C380 216 364 206 352 196 Z" fill={skin.shadow} opacity={0.25} />
      </g>
      {look.blush && (
        <g>
          <ellipse cx={366} cy={194} rx={11} ry={6} fill={BLUSH} opacity={0.42} />
          <ellipse cx={434} cy={194} rx={11} ry={6} fill={BLUSH} opacity={0.42} />
        </g>
      )}
      {look.freckles &&
        [
          [362, 188],
          [370, 192],
          [366, 197],
          [376, 187],
          [438, 188],
          [430, 192],
          [434, 197],
          [424, 187],
          [394, 184],
          [406, 184],
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill={skin.shadow} />)}
      <FacialHair look={look} />
      <Eye x={400 - EYE_DX} look={look} uid={uid} />
      <Eye x={400 + EYE_DX} look={look} uid={uid} delayClass="scene-lid-b" />
      <Brows look={look} />
      {/* nose: a small hook, lit on its left */}
      <Line d="M402 180 Q409 190 401 194" w={2.2} opacity={0.75} />
      <Mouth look={look} />
      <HairFront look={look} uid={uid} />
      {/* hats sit on the crown, above the brows */}
      {hat && <g transform="translate(0 -10)">{hat(look.hatTone.base)}</g>}
      {look.glasses && <Eyewear look={look} />}
      {look.headphones && <Headphones look={look} />}
      <Earrings look={look} />
    </g>
  );
};

/** Hands on the keyboard: drawn last, over the desk and the keys. */
export const AvatarHands = ({ look }) => (
  <g>
    {[362, mirrorX(362)].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={335} rx={12} ry={8.5} fill={x > 400 ? look.skin.shadow : look.skin.base} stroke={INK} strokeWidth={2.6} />
        <Line d={`M${x + (x < 400 ? 6 : -6)} 331 q${x < 400 ? 5 : -5} 1 ${x < 400 ? 6 : -6} 5`} w={1.8} opacity={0.7} />
      </g>
    ))}
  </g>
);

const TROUSER = { base: "#2B3242", shadow: "#1B2030", light: "#3B4660" };
const SHOE = { base: "#15171C", sole: "#2A2D34" };

/** One standing leg, hip to shoe, for the left side; the right is its mirror. */
const StandingLeg = ({ flip }) => (
  <g transform={flip ? MIRROR : undefined}>
    <path d="M362 340 L398 340 L395 450 L367 450 Z" fill={TROUSER.base} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M391 344 L397 344 L394 450 L389 450 Z" fill={TROUSER.shadow} opacity={0.8} />
    <path d="M380 362 L381 446" stroke={TROUSER.shadow} strokeWidth={1.5} opacity={0.6} />
    <ellipse cx={379} cy={396} rx={10} ry={5} fill={TROUSER.light} opacity={0.4} />
    <path
      d="M358 456 C358 450 364 447 370 447 L388 447 C396 447 402 451 402 459 L402 466 C402 470 399 472 395 472 L362 472 C358 472 355 469 355 465 Z"
      fill={SHOE.base}
      stroke={INK}
      strokeWidth={2.6}
    />
    <rect x={356} y={467} width={46} height={5} rx={2.5} fill={SHOE.sole} />
    <ellipse cx={378} cy={455} rx={11} ry={3} fill="#FFFFFF" opacity={0.12} />
  </g>
);

/** An arm hanging at the side, the hand relaxed by the hip. */
const HangingArm = ({ look, flip }) => (
  <g transform={flip ? MIRROR : undefined}>
    <Sleeve d="M356 254 C338 268 326 296 326 330" look={look} />
    <ellipse cx={327} cy={344} rx={10.5} ry={12.5} fill={flip ? look.skin.shadow : look.skin.base} stroke={INK} strokeWidth={2.6} />
    <Line d="M322 348 q3 4 8 3" w={1.6} opacity={0.6} />
  </g>
);

/**
 * The whole figure on its feet, in the rig's own coordinates (feet on y 472).
 * The scene places it in front of the desk; arms hang, since there is no
 * keyboard to reach.
 */
export const AvatarStanding = ({ look, uid }) => (
  <g>
    <ellipse cx={400} cy={472} rx={62} ry={6} fill="#000000" opacity={0.3} />
    <StandingLeg />
    <StandingLeg flip />
    <AvatarBack look={look} />
    <HangingArm look={look} />
    <HangingArm look={look} flip />
    <AvatarBody look={look} uid={uid} arms={false} />
    <AvatarHead look={look} uid={uid} />
  </g>
);

/**
 * The full figure for anywhere outside the scene: Studio tiles and the
 * download badge. `arms` off by default, since there is no keyboard.
 */
export const AvatarBust = ({ look, uid, arms = false }) => (
  <g>
    <Defs uid={uid} look={look} />
    <AvatarBack look={look} />
    <AvatarBody look={look} uid={uid} arms={arms} />
    <AvatarHead look={look} uid={uid} />
  </g>
);

export const AvatarDefs = Defs;
export { MIRROR };
