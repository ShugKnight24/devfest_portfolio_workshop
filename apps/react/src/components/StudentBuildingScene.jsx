import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  CHAIR_COLORS,
  DEFAULT_AVATAR,
  DESK_SURFACES,
  DESK_TOP,
  DISPLAY_DEPTH,
  HAIR_COLORS,
  PROP_FOR_TOGGLE,
  SKIN_TONES,
  TOP_COLORS,
  clampPropPosition,
  describeAvatar,
  findOption,
  findFreeSlot,
  findProp,
  isPropEnabled,
  loadAvatar,
  normalizeAvatar,
  propBounds,
  propCollides,
  propFootprint,
  propsByDepth,
  randomAvatar,
  readPosition,
  saveAvatar,
} from "../config/avatar";
import { SceneCustomizer } from "./SceneCustomizer";

/**
 * Animated SVG Scene: a developer building their website.
 *
 * The figure is drawn with real seated proportions — a 7.5-head standing adult
 * cropped at the desk, so roughly 3.2 heads of visible height — and lit by the
 * display in front of it. The screen is the key light: it rakes up under the
 * jaw and across the chest, while the outer edges of the head and torso fall
 * into shadow. That single decision does most of the work of making a flat
 * vector read as a person.
 *
 * Everything the scene draws comes from a single `avatar` config object
 * (see `src/config/avatar.js`), so new options are a data change.
 */

/* --------------------------------------------------------------------------
 * Geometry — the whole figure is built off these, centred on x = 400.
 * ------------------------------------------------------------------------ */
const CENTER = 400;
/** Monitors emit a cool blue-white, not the brand hue. */
const SCREEN_LIGHT = "#BFE6FF";
const HEAD_PATH =
  "M373 168 C373 145, 384 133, 400 133 C416 133, 427 145, 427 168 " +
  "C427 181, 424 191, 416 197 C410 202, 405 204, 400 204 " +
  "C395 204, 390 202, 384 197 C376 191, 373 181, 373 168 Z";
const TORSO_PATH =
  "M400 216 C382 216, 368 222, 356 231 C346 238, 340 252, 337 272 " +
  "C334 296, 333 322, 333 348 L467 348 C467 322, 466 296, 463 272 " +
  "C460 252, 454 238, 444 231 C432 222, 418 216, 400 216 Z";
const NECK_PATH =
  "M386 188 C386 203, 385 212, 381 220 C390 227, 410 227, 419 220 " +
  "C415 212, 414 203, 414 188 Z";

const EYE_Y = 170;
const EYE_DX = 12;

const mirror = "translate(800, 0) scale(-1, 1)";

/* --------------------------------------------------------------------------
 * Hair — split into a layer behind the skull and a layer in front of it, so
 * volume (afros, locs, long hair) sits behind the face while the hairline and
 * fringe sit on top of it.
 * ------------------------------------------------------------------------ */
const HairBack = ({ style, base, shadow }) => {
  switch (style) {
    case "coils":
      return (
        <g fill={shadow}>
          <ellipse cx={CENTER} cy={150} rx={40} ry={34} />
          {[
            [366, 128, 11],
            [386, 118, 12],
            [412, 119, 12],
            [432, 130, 11],
            [440, 152, 10],
            [360, 152, 10],
            [364, 174, 9],
            [436, 174, 9],
          ].map(([cx, cy, r], i) => (
            <circle key={`coil-${i}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case "curls":
      return (
        <g fill={shadow}>
          <ellipse cx={CENTER} cy={154} rx={35} ry={28} />
          {[
            [362, 160, 11],
            [438, 160, 11],
            [368, 136, 11],
            [432, 136, 11],
            [400, 124, 12],
          ].map(([cx, cy, r], i) => (
            <circle key={`curl-${i}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case "locs":
      return (
        <g>
          <ellipse cx={CENTER} cy={152} rx={32} ry={26} fill={shadow} />
          {[368, 376, 424, 432].map((x, i) => (
            <g key={`loc-${i}`}>
              <rect
                x={x - 4}
                y={152}
                width={8}
                height={i < 2 ? 82 : 74}
                rx={4}
                fill={shadow}
              />
              <rect
                x={x - 4}
                y={152}
                width={3}
                height={i < 2 ? 82 : 74}
                rx={1.5}
                fill={base}
                opacity={0.55}
              />
            </g>
          ))}
          <rect x={356} y={158} width={7} height={58} rx={3.5} fill={shadow} />
          <rect x={437} y={158} width={7} height={58} rx={3.5} fill={shadow} />
        </g>
      );
    case "braids":
      return (
        <g>
          <ellipse cx={CENTER} cy={150} rx={33} ry={26} fill={shadow} />
          {[360, 370, 430, 440].map((x, i) => (
            <g key={`braid-${i}`}>
              <rect x={x - 3} y={154} width={6} height={72} rx={3} fill={shadow} />
              {[0, 1, 2, 3, 4].map((k) => (
                <circle
                  key={`bead-${i}-${k}`}
                  cx={x}
                  cy={168 + k * 14}
                  r={4}
                  fill={base}
                  opacity={0.75}
                />
              ))}
            </g>
          ))}
        </g>
      );
    case "long":
      return (
        <g fill={shadow}>
          <path d="M366 150 C352 168, 348 214, 352 268 C356 288, 364 296, 372 292 C364 250, 364 196, 372 166 Z" />
          <path d="M434 150 C448 168, 452 214, 448 268 C444 288, 436 296, 428 292 C436 250, 436 196, 428 166 Z" />
          <ellipse cx={CENTER} cy={154} rx={33} ry={27} />
        </g>
      );
    case "wavyBob":
      return (
        <g fill={shadow}>
          <path d="M368 148 C354 166, 352 196, 360 218 C368 224, 376 220, 376 212 C368 192, 368 168, 376 154 Z" />
          <path d="M432 148 C446 166, 448 196, 440 218 C432 224, 424 220, 424 212 C432 192, 432 168, 424 154 Z" />
          <ellipse cx={CENTER} cy={152} rx={33} ry={26} />
        </g>
      );
    case "bun":
      return (
        <g fill={shadow}>
          <circle cx={CENTER} cy={124} r={14} />
          <circle cx={CENTER} cy={124} r={9} fill={base} opacity={0.5} />
          <ellipse cx={CENTER} cy={152} rx={30} ry={24} />
        </g>
      );
    case "crop":
      return <ellipse cx={CENTER} cy={154} rx={30} ry={24} fill={shadow} />;
    case "buzz":
      return <ellipse cx={CENTER} cy={156} rx={28} ry={22} fill={shadow} />;
    default:
      return null;
  }
};

const HairFront = ({ style, base, shadow }) => {
  switch (style) {
    case "bald":
      return null;
    case "buzz":
      return (
        <g>
          <path
            d="M372 166 C372 143, 383 132, 400 132 C417 132, 428 143, 428 166
               C428 154, 420 147, 400 147 C380 147, 372 154, 372 166 Z"
            fill={base}
          />
          <path
            d="M372 166 C372 143, 383 132, 400 132 C417 132, 428 143, 428 166"
            fill="none"
            stroke={shadow}
            strokeWidth={1.4}
            opacity={0.6}
          />
        </g>
      );
    case "crop":
      return (
        <g>
          <path
            d="M371 170 C370 142, 383 130, 400 130 C418 130, 430 142, 429 170
               C429 155, 424 149, 414 149 C401 149, 391 155, 380 152
               C375 151, 372 159, 371 170 Z"
            fill={base}
          />
          <path
            d="M400 131 C412 133, 421 141, 424 152"
            fill="none"
            stroke={shadow}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        </g>
      );
    case "coils":
      return (
        <g>
          <path
            d="M371 164 C370 141, 383 129, 400 129 C418 129, 430 141, 429 164
               C427 152, 418 145, 400 145 C382 145, 373 152, 371 164 Z"
            fill={base}
          />
          {[
            [378, 142, 7],
            [391, 135, 8],
            [409, 135, 8],
            [422, 142, 7],
            [372, 156, 6],
            [428, 156, 6],
          ].map(([cx, cy, r], i) => (
            <circle key={`coilf-${i}`} cx={cx} cy={cy} r={r} fill={base} />
          ))}
        </g>
      );
    case "curls":
      return (
        <g fill={base}>
          <path d="M372 162 C371 140, 384 128, 400 128 C417 128, 430 140, 428 162 C425 150, 416 144, 400 144 C384 144, 375 150, 372 162 Z" />
          {[
            [380, 138, 7],
            [396, 130, 8],
            [414, 132, 7],
            [425, 145, 6],
            [374, 150, 6],
          ].map(([cx, cy, r], i) => (
            <circle key={`curlf-${i}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case "locs":
      return (
        <g>
          <path
            d="M371 162 C370 139, 383 128, 400 128 C418 128, 430 139, 429 162
               C426 149, 417 143, 400 143 C383 143, 374 149, 371 162 Z"
            fill={base}
          />
          {[381, 391, 401, 411, 421].map((x, i) => (
            <rect key={`locf-${i}`} x={x - 3} y={128} width={6} height={24} rx={3} fill={base} />
          ))}
        </g>
      );
    case "braids":
      return (
        <g>
          <path
            d="M371 162 C370 139, 383 128, 400 128 C418 128, 430 139, 429 162
               C426 149, 417 143, 400 143 C383 143, 374 149, 371 162 Z"
            fill={base}
          />
          {[378, 388, 400, 412, 422].map((x, i) => (
            <line
              key={`braidf-${i}`}
              x1={x}
              y1={130}
              x2={400 + (x - 400) * 1.35}
              y2={152}
              stroke={shadow}
              strokeWidth={1.6}
              opacity={0.75}
            />
          ))}
        </g>
      );
    case "bun":
      return (
        <g>
          <path
            d="M371 164 C370 140, 383 129, 400 129 C418 129, 430 140, 429 164
               C427 150, 418 144, 400 144 C382 144, 373 150, 371 164 Z"
            fill={base}
          />
          <path
            d="M376 150 C384 138, 416 138, 424 150"
            fill="none"
            stroke={shadow}
            strokeWidth={1.6}
            opacity={0.6}
          />
        </g>
      );
    case "long":
    case "wavyBob":
      return (
        <g>
          <path
            d="M371 166 C370 140, 383 128, 400 128 C418 128, 430 140, 429 166
               C428 150, 420 143, 404 143 C392 143, 382 150, 378 160
               C376 165, 373 164, 371 166 Z"
            fill={base}
          />
          <path
            d="M404 144 C414 146, 422 153, 426 164"
            fill="none"
            stroke={shadow}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.6}
          />
        </g>
      );
    default:
      return null;
  }
};

/* --------------------------------------------------------------------------
 * Face
 * ------------------------------------------------------------------------ */
const Eye = ({ side, clipId, skin, lidDelayClass }) => {
  const cx = CENTER + side * EYE_DX;
  return (
    <g>
      <clipPath id={clipId}>
        <path
          d={`M${cx - 6.5} ${EYE_Y} Q${cx} ${EYE_Y - 6} ${cx + 6.5} ${EYE_Y} Q${cx} ${EYE_Y + 5.5} ${cx - 6.5} ${EYE_Y} Z`}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={cx - 8} y={EYE_Y - 8} width={16} height={16} fill="#F2EDE6" />
        {/* iris */}
        <circle cx={cx + side * 0.6} cy={EYE_Y} r={3.6} fill="#5B4636" />
        <circle cx={cx + side * 0.6} cy={EYE_Y} r={3.6} fill="#1B2A33" opacity={0.45} />
        {/* pupil */}
        <circle cx={cx + side * 0.6} cy={EYE_Y} r={1.7} fill="#0B0F12" />
        {/* specular catchlight from the screen */}
        <circle cx={cx + side * 0.6 - 1.3} cy={EYE_Y - 1.4} r={1.1} fill="#FFFFFF" opacity={0.95} />
        <circle cx={cx + side * 0.6 + 1.6} cy={EYE_Y + 1.5} r={0.6} fill="#FFFFFF" opacity={0.5} />
        {/* upper lid shadow */}
        <rect x={cx - 8} y={EYE_Y - 8} width={16} height={4.5} fill="#000000" opacity={0.22} />
        {/* the lid that actually closes */}
        <rect
          className={`scene-lid ${lidDelayClass}`}
          x={cx - 8}
          y={EYE_Y - 6.5}
          width={16}
          height={13}
          fill={skin.base}
        />
      </g>
      {/* lash line */}
      <path
        d={`M${cx - 6.5} ${EYE_Y} Q${cx} ${EYE_Y - 6} ${cx + 6.5} ${EYE_Y}`}
        fill="none"
        stroke="#2A1D14"
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.8}
      />
    </g>
  );
};

const FacialHair = ({ style, base, shadow }) => {
  if (style === "none") return null;
  if (style === "stubble") {
    return (
      <path
        d="M378 180 C379 192, 386 202, 400 204 C414 202, 421 192, 422 180
           C420 194, 412 199, 400 199 C388 199, 380 194, 378 180 Z"
        fill={shadow}
        opacity={0.35}
      />
    );
  }
  if (style === "moustache") {
    return (
      <path
        d="M390 188 Q400 184 410 188 Q400 193 390 188 Z"
        fill={base}
      />
    );
  }
  if (style === "goatee") {
    return (
      <g fill={base}>
        <path d="M390 188 Q400 184 410 188 Q400 193 390 188 Z" />
        <path d="M393 196 Q400 194 407 196 Q407 203 400 205 Q393 203 393 196 Z" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M376 172 C377 190, 385 203, 400 205 C415 203, 423 190, 424 172
           C424 186, 416 194, 400 194 C384 194, 376 186, 376 172 Z"
        fill={base}
      />
      <path d="M389 187 Q400 182 411 187 Q400 192 389 187 Z" fill={base} />
      <path
        d="M380 178 C382 192, 389 200, 400 202"
        fill="none"
        stroke={shadow}
        strokeWidth={1.2}
        opacity={0.55}
      />
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Hands — palm plus five separable digits, drawn once and mirrored.
 * ------------------------------------------------------------------------ */
const Hand = ({ skin, flip }) => (
  <g transform={flip ? mirror : undefined}>
    {/* contact shadow where the hand meets the deck */}
    <ellipse cx={362} cy={341} rx={20} ry={3.6} fill="#000000" opacity={0.28} />
    {/* back of hand */}
    <path
      d="M343 327 C348 320, 358 319, 366 321 C374 323, 378 327, 377 331
         C376 337, 367 340, 357 340 C349 340, 343 335, 343 327 Z"
      fill={skin.base}
    />
    <path
      d="M343 327 C348 320, 358 319, 366 321 C374 323, 378 327, 377 331"
      fill="none"
      stroke={skin.highlight}
      strokeWidth={1.2}
      opacity={0.7}
    />
    {/* fingers */}
    {[
      [366, 322, 379, 324],
      [368, 326, 382, 328],
      [367, 330, 380, 333],
      [364, 334, 375, 337],
    ].map(([x1, y1, x2, y2], i) => (
      <g key={`finger-${i}`}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={skin.base}
          strokeWidth={5.2}
          strokeLinecap="round"
        />
        <line
          x1={x1}
          y1={y1 - 1.4}
          x2={x2}
          y2={y2 - 1.4}
          stroke={skin.highlight}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.55}
        />
      </g>
    ))}
    {/* thumb */}
    <line
      x1={349}
      y1={333}
      x2={353}
      y2={342}
      stroke={skin.base}
      strokeWidth={6}
      strokeLinecap="round"
    />
    <line
      x1={349}
      y1={333}
      x2={353}
      y2={342}
      stroke={skin.shadow}
      strokeWidth={1.1}
      strokeLinecap="round"
      opacity={0.45}
    />
    {/* knuckle shading */}
    <path
      d="M360 322 C366 322, 372 324, 376 328"
      fill="none"
      stroke={skin.shadow}
      strokeWidth={1.1}
      opacity={0.5}
    />
  </g>
);

/* --------------------------------------------------------------------------
 * Arms — upper arm and forearm are separate tapered shapes with a real elbow.
 * ------------------------------------------------------------------------ */
const Arm = ({ skin, topColor, flip }) => (
  <g transform={flip ? mirror : undefined}>
    {/* upper arm */}
    <path d="M332.4 240.2 L305.5 301.8 L322.5 310.2 L355.6 251.8 Z" fill={skin.base} />
    <circle cx={314} cy={306} r={9.5} fill={skin.base} />
    <circle cx={344} cy={246} r={13} fill={skin.base} />
    {/* forearm */}
    <path d="M308.3 313.6 L341.8 335.6 L350.2 324.4 L319.7 298.4 Z" fill={skin.base} />
    <circle cx={346} cy={330} r={7} fill={skin.base} />
    {/* underside shadow along the whole limb */}
    <path
      d="M305.5 301.8 L322.5 310.2 L350.2 324.4"
      fill="none"
      stroke={skin.shadow}
      strokeWidth={2.4}
      strokeLinecap="round"
      opacity={0.5}
    />
    {/* light catching the top of the forearm, facing the screen */}
    <path
      d="M319.7 300 L348 322"
      fill="none"
      stroke={skin.highlight}
      strokeWidth={2}
      strokeLinecap="round"
      opacity={0.55}
    />
    {/* elbow crease */}
    <path
      d="M309 306 Q314 312 320 309"
      fill="none"
      stroke={skin.shadow}
      strokeWidth={1.2}
      opacity={0.55}
    />
    {/* short sleeve */}
    <path
      d="M331 239.5 L317.6 273.1 Q328 285 338.2 283.3 L357 252.5 Z"
      fill={topColor}
    />
    <path
      d="M317.6 273.1 Q328 285 338.2 283.3"
      fill="none"
      stroke="#000000"
      strokeWidth={2.4}
      opacity={0.22}
    />
    <path
      d="M333 244 L321 272"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      opacity={0.12}
    />
  </g>
);

/**
 * A seated leg, seen from the front.
 *
 * The figure used to stop at the desk edge, so nothing of a person existed below
 * the desktop: the scene read as a torso floating over an empty floor. From the
 * front, a seated person's thighs run toward the viewer and are hidden by the
 * desk's apron; what shows below it is the shin, dropping to a shoe on the
 * floor. The knee is drawn slightly above the apron's lower edge so the apron
 * overlaps it, which is what makes the leg read as continuing up to the seat.
 *
 * Drawn for the viewer's left and mirrored for the right, like Arm, so the pair
 * is symmetric by construction rather than by hand.
 */
const TROUSER = { base: "#2B3242", shadow: "#1B2030", light: "#3B4660" };
const SHOE = { base: "#15171C", sole: "#2A2D34" };

const Leg = ({ flip }) => (
  <g transform={flip ? mirror : undefined}>
    {/* shin, tapering from knee to ankle */}
    <path d="M355 360 L393 360 L388 452 L360 452 Z" fill={TROUSER.base} />
    {/* inner edge falls away from the screen light */}
    <path d="M387 360 L393 360 L388 452 L383 452 Z" fill={TROUSER.shadow} opacity={0.85} />
    {/* knee catching the light spilling under the desk */}
    <ellipse cx={373} cy={368} rx={13} ry={6} fill={TROUSER.light} opacity={0.55} />
    {/* trouser crease */}
    <path d="M373 374 L374 450" stroke={TROUSER.shadow} strokeWidth={1.5} opacity={0.6} />
    {/* hem break over the shoe */}
    <path d="M359 448 C366 452 382 452 389 448" stroke={TROUSER.shadow} strokeWidth={2} fill="none" opacity={0.8} />
    {/* contact shadow under the shoe */}
    <ellipse cx={374} cy={473} rx={27} ry={4} fill="#000000" opacity={0.35} />
    {/* shoe, toe toward the viewer */}
    <path
      d="M352 453 C352 447 358 444 364 444 L384 444 C392 444 398 448 398 456 L398 466 C398 470 395 472 391 472 L357 472 C353 472 350 469 350 465 Z"
      fill={SHOE.base}
    />
    <rect x={350} y={467} width={48} height={5} rx={2.5} fill={SHOE.sole} />
    <ellipse cx={372} cy={452} rx={12} ry={3.5} fill="#FFFFFF" opacity={0.1} />
  </g>
);

/** The chair's gas lift and star base, visible under the desk between the legs. */
const ChairBase = ({ color }) => (
  <g>
    <rect x={395} y={362} width={10} height={80} rx={3} fill={color} />
    <path
      d="M400 440 L340 456 M400 440 L368 462 M400 440 L432 462 M400 440 L460 456"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
    />
    {[
      [340, 459],
      [368, 465],
      [432, 465],
      [460, 459],
    ].map(([cx, cy]) => (
      <circle key={cx} cx={cx} cy={cy} r={4.5} fill="#0B0D12" />
    ))}
  </g>
);

/* --------------------------------------------------------------------------
 * Displays
 * ------------------------------------------------------------------------ */
const CodeLines = ({ x, y, width, scale = 1 }) => {
  const rows = [
    [[0, 22, "#C084FC"], [26, 40, "#67E8F9"], [70, 16, "#C084FC"], [90, 44, "#86EFAC"]],
    [[0, 18, "#C084FC"], [22, 34, "#FCD34D"], [60, 8, "#94A3B8"], [72, 12, "#FCD34D"]],
    [[8, 22, "#C084FC"], [34, 8, "#94A3B8"]],
    [[16, 8, "#94A3B8"], [28, 14, "#F472B6"], [46, 28, "#67E8F9"]],
    [[24, 8, "#94A3B8"], [36, 10, "#F472B6"], [50, 44, "#E2E8F0"]],
    [[24, 8, "#94A3B8"], [36, 24, "#67E8F9"], [64, 30, "#E2E8F0"]],
    [[16, 8, "#94A3B8"], [28, 14, "#F472B6"]],
    [[8, 8, "#94A3B8"]],
  ];

  return (
    <g>
      {rows.map((row, r) =>
        row.map(([dx, w, color], i) => (
          <rect
            key={`code-${r}-${i}`}
            x={x + dx * scale}
            y={y + r * 9 * scale}
            width={Math.min(w, width / scale - dx) * scale}
            height={3 * scale}
            rx={1.5}
            fill={color}
            opacity={0.85}
          />
        )),
      )}
      <rect
        className="scene-blink"
        x={x + 14 * scale}
        y={y + 7 * 9 * scale - 1}
        width={2}
        height={6 * scale}
        rx={1}
        fill="#7DD3FC"
      />
    </g>
  );
};

const ScreenPanel = ({ x, y, width, height, screenGradId, glowGradId, children }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={width + 12} height={height + 14} rx={6} fill="#1A1D24" />
    <rect x={x - 6} y={y - 6} width={width + 12} height={2} rx={1} fill="#2E333D" />
    <rect x={x} y={y} width={width} height={height} rx={3} fill={`url(#${screenGradId})`} />
    <rect x={x} y={y} width={width} height={height} rx={3} fill={`url(#${glowGradId})`} />
    <circle cx={x + 10} cy={y + 8} r={2.4} fill="#EF4444" opacity={0.85} />
    <circle cx={x + 18} cy={y + 8} r={2.4} fill="#EAB308" opacity={0.85} />
    <circle cx={x + 26} cy={y + 8} r={2.4} fill="#22C55E" opacity={0.85} />
    {children}
  </g>
);

/* --------------------------------------------------------------------------
 * Movable props
 *
 * Each prop's art is still drawn at the coordinates it was authored at; the
 * wrapper translates it by the delta between that anchor and the position held
 * in the avatar config. Pointer drags and arrow-key nudges both write to the
 * same place, so the two input methods can never disagree.
 * ------------------------------------------------------------------------ */
const NUDGE = 4;
const NUDGE_FAST = 16;
const RING_PAD = 5;
const ARROW_DELTAS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** A focus/drag ring that survives both backdrops: dark halo, accent core. */
const PropRing = ({ box, invalid }) => (
  <g pointerEvents="none">
    <rect
      x={box.x - RING_PAD}
      y={box.y - RING_PAD}
      width={box.w + RING_PAD * 2}
      height={box.h + RING_PAD * 2}
      rx={7}
      fill={invalid ? "#F97316" : "#FFFFFF"}
      fillOpacity={invalid ? 0.16 : 0.07}
      stroke="#05070B"
      strokeOpacity={0.55}
      strokeWidth={5}
    />
    <rect
      x={box.x - RING_PAD}
      y={box.y - RING_PAD}
      width={box.w + RING_PAD * 2}
      height={box.h + RING_PAD * 2}
      rx={7}
      fill="none"
      stroke={invalid ? "#FDBA74" : "var(--color-primary, #00FFCC)"}
      strokeWidth={2}
      strokeDasharray={invalid ? "6 4" : "5 4"}
    />
  </g>
);

const MovableProp = ({
  prop,
  position,
  interactive = true,
  active,
  invalid,
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  onFocus,
  onBlur,
  children,
}) => {
  // The art was authored at the prop's default anchor, so only the delta moves.
  const dx = Math.round((position.x - prop.x) * 100) / 100;
  const dy = Math.round((position.y - prop.y) * 100) / 100;
  const box = propFootprint(prop, { x: prop.x, y: prop.y });
  const transform = dx || dy ? `translate(${dx} ${dy})` : undefined;

  if (!interactive) {
    return <g transform={transform}>{children}</g>;
  }

  return (
    <g
      className="scene-prop"
      transform={transform}
      tabIndex={0}
      role="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        cursor: active === "drag" ? "grabbing" : "grab",
        touchAction: "none",
        outline: "none",
      }}
    >
      {/* Generous hit area — a lamp arm is 5px wide and impossible to grab. */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="transparent" />
      {children}
      {active && <PropRing box={box} invalid={invalid} />}
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Desk props
 * ------------------------------------------------------------------------ */
const Plant = () => (
  <g>
    <path d="M118 312 L152 312 L148 344 L122 344 Z" fill="#B4531F" />
    <rect x={114} y={306} width={42} height={9} rx={3} fill="#D2691E" />
    <path d="M135 308 C135 288, 128 274, 118 264" stroke="#15803D" strokeWidth={2.4} fill="none" />
    <path d="M118 264 C108 258, 102 266, 108 272 C114 276, 118 270, 118 264 Z" fill="#22C55E" />
    <path d="M135 308 C138 290, 146 278, 156 270" stroke="#15803D" strokeWidth={2.4} fill="none" />
    <path d="M156 270 C166 264, 172 272, 164 278 C158 281, 155 275, 156 270 Z" fill="#4ADE80" />
    <path d="M135 308 C135 292, 134 278, 134 266" stroke="#15803D" strokeWidth={2.4} fill="none" />
    <path d="M134 266 C128 254, 140 250, 143 260 C144 268, 138 270, 134 266 Z" fill="#16A34A" />
    <ellipse cx={135} cy={344} rx={24} ry={4} fill="#000000" opacity={0.3} />
  </g>
);

const Books = () => (
  <g>
    <ellipse cx={205} cy={344} rx={36} ry={4} fill="#000000" opacity={0.3} />
    <rect x={172} y={332} width={66} height={12} rx={2} fill="#B91C1C" />
    <rect x={172} y={332} width={66} height={3} rx={1.5} fill="#EF4444" opacity={0.6} />
    <rect x={176} y={322} width={58} height={10} rx={2} fill="#1D4ED8" />
    <rect x={176} y={322} width={58} height={2.5} rx={1.2} fill="#60A5FA" opacity={0.6} />
    <rect x={180} y={312} width={50} height={10} rx={2} fill="#047857" />
    <rect x={180} y={312} width={50} height={2.5} rx={1.2} fill="#34D399" opacity={0.6} />
    <rect x={172} y={338} width={66} height={1.5} fill="#000000" opacity={0.25} />
  </g>
);

const Lamp = ({ accent, lit }) => (
  <g>
    <ellipse cx={276} cy={344} rx={24} ry={4.5} fill="#000000" opacity={0.35} />
    <ellipse cx={276} cy={340} rx={21} ry={6} fill="#2B303A" />
    <ellipse cx={276} cy={337} rx={21} ry={5} fill="#3A404C" />
    {/* lower + upper arm with a visible joint, like an architect lamp */}
    <line x1={276} y1={336} x2={266} y2={280} stroke="#3A404C" strokeWidth={5} strokeLinecap="round" />
    <line x1={266} y1={280} x2={306} y2={256} stroke="#3A404C" strokeWidth={5} strokeLinecap="round" />
    <circle cx={266} cy={280} r={4} fill="#4A515F" />
    {/* shade, mouth pointing down at the desk */}
    <path d="M300 248 L316 248 L324 272 L296 272 Z" fill="#454C5A" />
    <path d="M300 248 L308 248 L302 272 L296 272 Z" fill="#FFFFFF" opacity={0.08} />
    <ellipse cx={310} cy={272} rx={14} ry={3.5} fill={lit ? accent : "#1C2029"} opacity={lit ? 0.9 : 1} />
    {lit && <path d="M296 272 L268 344 L352 344 L324 272 Z" fill={accent} opacity={0.1} />}
  </g>
);

const Mug = ({ accent }) => (
  <g>
    <ellipse cx={495} cy={344} rx={20} ry={3.6} fill="#000000" opacity={0.3} />
    <path d="M512 320 C522 320, 524 326, 524 330 C524 334, 522 340, 512 340" stroke="#E2E8F0" strokeWidth={4} fill="none" />
    <path d="M478 314 L512 314 L509 342 Q495 346 481 342 Z" fill="#E8EAEE" />
    <path d="M478 314 L512 314 L511 320 L479 320 Z" fill={accent} opacity={0.85} />
    <ellipse cx={495} cy={314} rx={17} ry={4} fill="#3F2A1B" />
    <ellipse cx={495} cy={314} rx={17} ry={4} fill="#000000" opacity={0.3} />
    <path
      className="scene-steam1"
      d="M487 310 Q490 302 487 294"
      stroke="#CBD5E1"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      opacity={0.45}
    />
    <path
      className="scene-steam2"
      d="M495 308 Q492 300 495 292"
      stroke="#CBD5E1"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      opacity={0.45}
    />
    <path
      className="scene-steam3"
      d="M503 310 Q506 302 503 294"
      stroke="#CBD5E1"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      opacity={0.45}
    />
  </g>
);

const Phone = ({ accent }) => (
  <g>
    <ellipse cx={542} cy={344} rx={18} ry={3.4} fill="#000000" opacity={0.3} />
    <path d="M534 344 L534 330 L550 326 L550 341 Z" fill="#2A2F38" />
    <rect x={526} y={306} width={30} height={38} rx={4} fill="#14181F" transform="rotate(-8 541 325)" />
    <rect x={529} y={309} width={24} height={30} rx={2} fill={accent} opacity={0.35} transform="rotate(-8 541 324)" />
    <rect x={532} y={313} width={14} height={2} rx={1} fill={accent} opacity={0.9} transform="rotate(-8 541 324)" />
    <rect x={532} y={318} width={18} height={2} rx={1} fill="#94A3B8" opacity={0.7} transform="rotate(-8 541 324)" />
    <rect x={532} y={323} width={10} height={2} rx={1} fill="#94A3B8" opacity={0.5} transform="rotate(-8 541 324)" />
  </g>
);

const Keyboard = ({ mech, accent }) => {
  const y = mech ? 322 : 326;
  const height = mech ? 22 : 18;
  return (
    <g>
      <ellipse cx={CENTER} cy={DESK_TOP} rx={64} ry={4.5} fill="#000000" opacity={0.3} />
      <rect x={340} y={y} width={120} height={height} rx={mech ? 4 : 3} fill={mech ? "#23272F" : "#3A3F49"} />
      <rect x={340} y={y} width={120} height={2.5} rx={1.2} fill={mech ? "#3B424E" : "#525967"} />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 12 }, (_, i) => (
          <rect
            key={`kb-${row}-${i}`}
            x={344 + i * 9.6}
            y={y + 4 + row * (mech ? 5.6 : 4.4)}
            width={7.6}
            height={mech ? 4.4 : 3.2}
            rx={1}
            fill={mech && (row + i) % 7 === 0 ? accent : mech ? "#454C59" : "#525967"}
            opacity={mech && (row + i) % 7 === 0 ? 0.9 : 1}
          />
        )),
      )}
      {mech && (
        <rect x={340} y={y + height - 2} width={120} height={2} rx={1} fill={accent} opacity={0.5} />
      )}
    </g>
  );
};

/* --------------------------------------------------------------------------
 * Luna
 *
 * Traced from a photograph of her, not drawn from memory. Two hand-drawn
 * attempts both missed: one read as a generic beagle, the other as a Borzoi.
 *
 * The trace is generated, not hand-tuned, so it can be regenerated:
 *   1. GrabCut separates her from the floor. The dark tile leaked into the
 *      mask, so a brightness floor (her coat reads ~139, the tile ~41) removes
 *      it; enclosed dark regions (nose, eye markings) are restored by filling
 *      holes, because they sit INSIDE her silhouette and the floor does not.
 *   2. The photo is dim, so lightness is stretched over her own range and warmth
 *      restored before k-means picks the palette. Unchecked, the lightest colour
 *      came out a muddy #a08a7d instead of her cream chest.
 *   3. Side lighting had put half her face in shadow, which clustering read as
 *      dark fur. Lightness is divided by a heavy blur of itself to cancel the
 *      slow lighting gradient — on her HEAD only, because down the body it also
 *      flattened her cream chest, and that contrast is real.
 *   4. Each of five colour bands becomes nested contours, smoothed (Chaikin)
 *      and emitted as Bezier curves, so she matches the flat vector scene
 *      instead of reading as a posterised photo cutout.
 *
 * There is one pose, because there is one photo of her sitting. A second,
 * hand-drawn "curled" pose used a different footprint from the one the drag
 * system reserves for her, so toggling between them corrupted placement.
 * ------------------------------------------------------------------------ */
const LUNA_LAYERS = [
  ["#e8c5ae", "M419 173C412 172 403 172 395 171C388 171 381 171 374 172C367 172 360 173 354 173C347 172 342 171 336 170C330 169 325 166 319 165C313 163 306 162 298 160C290 159 282 158 274 158C266 158 258 159 250 161C242 162 233 165 227 167C220 170 215 172 209 174C204 176 201 178 194 179C188 180 180 181 172 181C164 181 154 180 147 181C140 182 134 184 129 187C124 190 121 194 119 197C116 200 115 203 114 206C114 209 115 212 114 215C113 218 112 221 110 224C109 227 106 230 105 232C104 235 104 238 104 240C104 243 104 245 106 248C107 250 109 254 112 256C114 260 118 263 122 266C126 268 132 270 137 272C142 274 149 275 154 278C158 281 162 285 164 290C167 295 168 302 169 306C170 311 170 314 170 316C170 319 170 320 168 323C166 326 164 328 161 332C158 335 153 338 150 342C146 346 143 350 140 354C137 359 134 364 130 371C127 378 123 387 120 396C116 406 112 418 111 427C109 437 109 445 110 452C110 459 113 465 114 471C115 477 115 482 115 486C115 491 115 495 115 500C115 504 116 510 117 516C117 522 119 528 119 536C120 544 119 554 118 564C118 573 116 586 116 594C116 602 116 608 117 614C118 620 120 622 120 627C121 632 121 637 122 644C122 651 121 657 124 668C126 679 131 695 136 710C142 725 150 747 157 758C163 770 170 776 176 779C181 782 188 779 192 778C196 777 198 775 200 773C202 770 202 767 203 763C203 760 203 756 203 752C202 747 202 742 200 738C198 734 194 729 190 725C187 721 181 718 178 714C174 710 171 707 169 704C167 700 165 697 164 693C163 689 162 685 162 681C162 677 163 673 164 669C164 666 165 663 167 661C169 658 171 657 177 655C183 653 193 651 203 649C213 647 229 644 238 643C246 642 251 642 255 643C258 643 257 645 258 647C259 650 260 653 261 657C262 661 263 665 265 670C268 675 271 681 274 686C277 692 282 698 286 702C289 706 292 709 295 710C298 712 301 711 304 711C307 711 310 710 314 709C316 707 320 706 322 704C324 702 326 700 326 698C327 696 327 693 326 690C326 688 326 684 324 681C323 678 322 674 320 671C318 668 314 665 311 662C307 659 302 657 299 654C296 652 294 650 293 648C291 645 291 644 290 642C290 640 290 639 291 637C292 635 293 634 298 630C302 626 310 621 319 614C327 608 340 600 348 592C357 585 364 577 370 569C376 561 381 553 385 544C389 535 392 526 394 515C396 505 397 494 398 483C398 472 398 460 398 449C397 437 396 424 394 415C393 406 390 400 388 395C386 390 383 387 382 384C380 380 379 376 378 372C377 367 377 363 378 356C378 349 380 340 382 330C384 320 387 306 390 298C392 289 396 283 399 277C402 272 406 270 410 266C414 263 418 260 422 257C426 254 430 251 434 248C437 245 440 241 441 238C443 234 444 230 445 227C446 224 445 220 445 217C444 214 443 211 442 208C442 204 442 201 442 197C443 193 444 189 444 186C444 183 443 181 442 179C441 178 439 177 436 176C432 175 426 174 419 173Z"],
  ["#bf9875", "M419 173C412 172 403 172 395 171C388 171 381 171 374 172C367 172 360 173 354 173C347 172 342 171 336 170C330 169 325 166 319 165C313 163 306 162 298 160C290 159 282 158 274 158C266 158 258 159 250 161C242 162 233 165 227 167C220 170 215 172 209 174C204 176 201 178 194 179C188 180 180 181 172 181C164 181 154 180 147 181C140 182 134 184 129 187C124 190 121 194 119 197C116 200 115 203 114 206C114 209 115 212 114 215C113 218 112 221 110 224C109 227 106 230 105 232C104 235 104 238 104 240C104 243 104 245 106 248C107 250 109 254 112 256C114 260 118 263 122 266C126 268 132 270 137 272C142 274 149 275 154 278C158 281 162 285 164 290C167 295 168 302 169 306C170 311 170 314 170 316C170 319 170 320 168 323C166 326 164 328 161 332C158 335 153 338 150 342C146 346 143 350 140 354C137 359 134 364 130 371C127 378 123 387 120 396C116 406 112 418 111 427C109 437 109 445 110 452C110 459 113 465 114 471C115 477 115 482 115 486C115 491 115 495 115 500C115 504 116 510 117 516C117 522 119 528 119 536C120 544 119 554 118 564C118 573 116 586 116 594C116 602 116 608 117 614C118 620 120 622 120 627C121 632 121 637 122 644C122 651 121 657 124 668C126 679 131 695 136 710C142 725 150 747 157 758C163 770 170 776 176 779C181 782 188 779 192 778C196 777 198 775 200 773C202 770 202 767 203 763C203 760 203 756 203 752C202 747 202 742 200 738C198 734 194 729 190 725C187 721 181 718 178 714C174 710 171 707 169 704C167 700 165 697 164 693C163 690 162 686 162 683C162 679 162 675 162 672C163 669 163 667 165 664C167 662 168 660 173 657C179 655 189 652 199 650C209 647 225 644 234 643C243 641 248 641 252 642C256 643 256 645 257 647C258 649 259 651 260 654C261 658 261 661 263 666C265 671 268 677 272 683C276 689 281 697 285 701C289 706 292 708 295 710C298 712 301 711 304 711C307 711 309 711 312 710C315 709 317 708 319 707C321 705 323 703 324 700C325 698 326 694 326 691C326 688 325 684 324 681C323 678 322 674 319 671C317 667 313 663 309 660C305 656 299 652 296 649C293 646 291 644 290 642C290 640 291 638 292 636C293 634 296 632 298 630C300 628 304 625 305 623C307 621 308 619 308 617C308 616 307 614 306 613C305 612 304 611 302 610C299 610 298 610 294 610C290 610 284 611 278 612C271 612 263 614 256 614C249 615 242 615 235 614C228 614 222 613 217 612C212 611 208 610 206 609C203 607 202 606 200 604C199 602 198 599 198 597C198 595 198 592 199 589C200 587 202 585 205 582C207 580 211 578 213 577C215 575 216 573 217 571C217 568 217 567 214 562C212 558 205 550 199 543C192 535 182 524 176 517C170 510 167 505 164 502C161 498 161 497 160 495C160 492 159 490 159 488C158 486 158 484 159 482C160 480 161 479 163 478C166 477 168 476 174 477C181 478 191 481 202 483C212 485 228 490 238 491C248 492 255 490 261 488C267 487 270 482 274 480C278 477 281 476 284 475C287 474 289 474 292 474C294 474 296 475 298 476C300 477 301 478 303 480C305 483 308 486 310 490C312 493 315 498 318 501C320 504 323 506 325 507C327 508 329 508 331 508C333 508 334 507 336 506C337 505 338 504 339 502C340 500 340 497 341 494C342 491 342 487 343 483C345 480 347 476 349 472C351 468 354 464 357 461C359 459 361 457 363 456C365 455 367 456 369 456C371 457 374 458 376 460C378 461 381 464 384 465C386 466 388 466 390 466C392 465 393 465 394 461C395 457 395 449 395 441C395 433 395 421 393 413C392 405 390 400 388 395C386 390 383 387 382 384C380 380 379 376 378 372C377 367 377 363 378 356C378 349 380 340 382 330C384 320 387 306 390 298C392 289 396 283 399 277C402 272 406 270 410 266C414 263 418 260 422 257C426 254 430 251 434 248C437 245 440 241 441 238C443 234 444 230 445 227C446 224 445 220 445 217C444 214 443 211 442 208C442 204 442 201 442 197C443 193 444 189 444 186C444 183 443 181 442 179C441 178 439 177 436 176C432 175 426 174 419 173Z"],
  ["#966d48", "M322 690C320 690 318 689 316 689C313 690 310 691 306 692C303 694 299 696 296 697C294 699 292 701 291 702C290 703 291 705 291 706C291 707 291 708 292 708C293 709 294 710 296 710C298 710 301 711 304 711C306 711 310 710 313 710C316 709 318 708 320 707C322 706 323 705 324 704C325 702 326 700 326 699C326 697 326 695 325 694C325 692 324 691 322 690ZM277 626C275 626 272 626 269 626C267 627 265 628 263 629C261 630 259 632 259 635C258 638 259 643 260 648C261 652 263 660 265 663C266 667 268 669 269 670C270 670 272 669 273 668C275 667 278 665 280 662C282 660 285 656 286 653C288 650 288 647 289 644C289 641 288 638 288 635C288 633 287 631 286 630C285 628 284 628 283 627C281 626 279 626 277 626ZM419 173C412 172 403 172 396 171C390 171 384 171 380 171C376 171 372 172 369 173C366 174 365 175 364 177C362 178 362 180 362 183C362 185 363 188 364 192C365 195 366 199 368 203C370 207 372 211 374 215C377 219 380 224 382 227C384 231 385 234 386 236C387 239 387 241 387 243C386 245 385 246 384 248C382 249 380 250 376 250C372 249 368 247 362 245C357 243 350 238 346 237C340 235 336 234 332 234C329 234 326 234 323 237C319 239 316 243 313 247C310 251 306 258 304 263C302 268 300 273 299 278C298 283 298 288 296 291C295 295 294 297 293 299C292 301 290 302 289 303C287 304 286 305 284 305C283 305 281 304 279 303C277 302 276 300 274 297C272 294 270 290 267 287C264 284 262 281 258 278C256 275 252 272 249 269C246 266 244 262 242 258C240 254 238 250 236 247C234 243 232 240 229 238C227 235 224 233 223 231C221 229 220 227 220 225C220 223 220 222 221 220C222 218 223 216 225 214C227 213 229 210 232 209C234 208 237 207 239 206C242 206 245 206 248 206C251 207 254 208 257 210C260 212 264 215 266 217C269 218 272 220 274 220C277 221 279 221 282 220C284 219 288 217 291 214C294 212 298 208 302 205C306 202 311 199 315 197C320 194 325 192 329 190C332 188 334 187 336 185C337 183 338 182 338 181C338 179 338 178 337 176C336 174 336 172 331 170C326 168 318 166 309 164C300 162 287 160 277 159C267 159 258 160 250 161C241 162 233 165 227 168C220 170 214 173 210 175C205 177 201 180 198 182C194 183 191 183 187 183C184 183 181 182 177 181C173 180 167 180 162 180C156 180 149 179 144 180C138 182 133 184 129 187C125 190 121 194 119 197C116 200 115 203 114 206C114 209 115 212 114 215C113 218 112 221 110 224C109 227 106 230 105 232C104 235 103 237 103 240C103 242 104 244 106 246C108 249 112 253 116 257C120 260 126 265 131 268C136 271 140 273 144 274C149 276 153 276 156 278C159 281 162 286 164 290C166 295 168 302 169 306C170 311 170 314 170 316C170 319 170 320 168 323C166 326 164 328 161 332C158 335 153 338 150 342C146 346 143 350 140 354C137 359 134 364 130 371C127 378 123 387 120 396C116 406 112 418 111 427C109 437 109 445 110 452C110 459 113 465 114 471C115 477 115 482 115 486C115 491 115 495 115 500C115 504 116 510 117 516C117 522 119 528 119 536C120 544 119 554 118 564C118 573 116 586 116 594C116 602 116 608 117 614C118 620 120 622 120 627C121 632 121 637 122 644C122 651 121 657 124 668C126 679 131 695 136 710C142 725 150 747 157 758C163 770 170 776 176 779C181 782 188 779 192 778C196 777 198 775 200 773C202 770 202 767 203 763C203 760 203 756 203 752C202 747 202 742 200 738C199 734 196 731 194 728C191 725 187 723 184 720C180 718 177 714 175 711C172 707 169 703 167 699C165 695 164 690 164 685C163 680 163 674 164 670C164 666 165 663 167 661C169 658 171 657 174 656C178 654 183 653 188 652C193 651 200 650 204 649C208 647 211 646 213 645C214 643 214 642 214 640C213 638 211 636 209 634C206 632 202 630 200 628C197 626 194 623 192 620C189 617 187 614 184 608C182 603 179 595 176 587C174 580 170 569 168 561C166 553 164 547 163 540C161 534 161 529 159 523C157 517 154 511 151 505C148 499 143 492 140 486C137 480 135 474 132 468C130 463 128 457 127 452C126 447 125 442 125 438C124 433 124 429 125 426C126 422 127 419 128 417C130 414 132 412 134 411C136 409 139 408 140 408C142 407 144 407 146 408C148 408 149 408 150 409C151 410 152 411 153 413C154 415 154 418 155 421C156 424 156 428 157 431C158 434 159 437 160 440C161 443 163 445 166 448C168 451 172 454 177 457C182 460 188 464 194 466C201 469 209 471 218 473C226 475 236 477 244 477C252 478 259 478 266 477C272 476 278 474 284 474C290 473 297 473 303 473C309 473 316 474 321 474C325 474 328 474 330 472C332 470 332 469 332 463C332 456 331 446 330 435C328 425 326 408 323 399C320 390 318 385 314 381C311 378 307 379 302 379C297 378 290 379 284 379C277 380 268 381 263 381C258 382 254 381 252 380C250 380 249 378 249 377C248 376 247 374 247 373C247 372 248 370 249 368C250 366 252 363 254 360C257 357 260 353 264 350C267 347 271 343 276 341C280 338 285 335 288 333C292 331 294 330 296 330C299 329 299 329 302 330C304 331 306 332 310 334C312 336 316 339 320 343C323 346 327 351 331 356C334 361 338 368 341 371C344 375 347 377 349 378C351 378 353 377 354 376C356 375 358 374 359 372C360 370 361 367 361 364C361 361 360 357 360 352C359 348 357 343 356 338C355 334 355 329 356 324C356 320 358 315 359 312C360 308 361 306 362 304C364 302 365 301 367 300C369 300 372 299 374 299C376 299 379 299 382 298C384 297 386 295 388 292C390 289 392 286 396 281C400 277 406 271 412 266C418 260 427 253 432 248C437 242 440 237 443 233C445 228 445 224 445 221C446 218 445 215 445 213C444 210 443 209 442 207C442 204 442 200 442 197C443 194 444 189 444 186C444 183 443 181 442 179C441 178 439 177 436 176C432 175 426 174 419 173Z"],
  ["#68492e", "M199 757C198 756 196 756 194 755C192 755 190 756 188 756C186 757 184 758 181 759C179 760 176 760 174 760C172 760 169 760 167 760C165 761 163 761 162 762C161 763 160 764 160 766C160 767 160 769 160 771C161 773 161 775 164 777C166 778 171 779 176 779C180 779 188 779 192 778C196 776 198 774 200 772C202 769 202 765 201 762C201 760 200 758 199 757ZM118 491C117 492 116 494 116 498C115 501 116 506 117 513C117 519 119 527 119 535C120 544 119 554 118 564C118 574 116 586 116 594C116 602 116 608 117 614C118 620 120 622 120 627C121 632 121 638 122 644C122 650 121 657 122 664C123 672 125 679 127 687C128 694 132 702 134 708C136 713 137 717 139 719C140 722 141 722 142 724C144 725 145 726 147 726C148 727 150 727 152 727C154 726 157 725 159 723C162 721 165 719 166 715C168 711 167 705 167 700C166 694 164 686 164 680C163 674 165 668 166 664C167 658 170 654 170 650C170 646 169 643 167 639C165 636 160 633 158 630C156 627 154 624 152 621C150 618 149 615 149 611C149 607 150 602 151 596C152 590 154 584 154 576C155 568 154 559 152 550C151 541 148 530 146 522C144 514 142 508 140 504C138 499 135 496 133 494C131 492 129 490 127 489C125 488 123 488 122 488C120 488 119 489 118 491ZM148 348C148 350 147 352 149 355C151 358 156 361 160 365C164 369 171 373 174 379C177 384 178 392 179 400C179 407 177 417 177 423C177 430 177 434 179 438C180 441 182 443 185 445C188 448 192 450 197 453C201 456 207 458 213 461C219 463 226 466 234 468C242 470 250 472 258 473C266 474 275 474 283 474C291 474 299 473 305 472C311 471 315 471 318 469C322 468 322 467 324 463C325 459 326 452 327 444C328 436 328 425 328 418C328 411 327 405 325 400C324 395 322 392 319 389C316 386 312 384 307 382C302 381 296 380 290 380C284 381 276 383 269 385C262 387 253 392 248 393C242 394 239 394 237 392C235 391 236 388 236 386C236 383 237 379 238 375C240 371 242 366 244 362C245 359 245 356 245 353C244 351 244 349 242 348C239 348 235 348 231 350C227 351 220 354 215 354C210 356 206 356 201 356C197 355 193 354 189 352C185 351 182 348 179 345C176 342 173 337 170 335C168 333 166 332 164 332C162 332 160 333 158 334C157 335 155 336 154 337C152 339 151 340 150 342C149 344 148 346 148 348ZM247 276C244 271 240 263 237 258C234 254 232 251 230 249C229 247 228 248 227 247C225 247 224 247 222 247C220 248 218 248 214 250C210 253 203 257 197 261C190 266 180 272 175 276C170 281 168 284 166 286C164 289 166 290 166 292C167 293 167 295 168 296C169 298 170 299 172 300C175 301 178 301 182 301C186 301 190 300 195 301C200 301 206 303 211 305C216 307 222 310 227 312C231 313 235 314 238 314C241 314 243 313 245 312C247 311 248 310 250 308C252 307 253 305 254 303C254 302 255 300 255 298C256 296 256 294 254 291C253 287 250 281 247 276ZM332 244C329 244 327 245 325 247C322 250 320 254 318 258C316 262 313 269 312 273C310 278 310 281 310 285C310 288 310 291 311 293C312 296 314 298 316 300C317 302 320 304 322 305C325 306 328 306 331 306C335 305 339 304 343 301C346 299 351 295 355 292C359 288 364 282 367 279C370 275 371 273 372 271C372 268 371 268 371 266C370 265 369 263 368 262C367 261 365 259 363 258C360 256 357 254 353 251C350 249 345 246 341 245C337 244 334 243 332 244ZM116 207C116 210 117 213 119 216C121 220 124 223 128 227C132 230 137 234 141 236C145 239 148 240 151 240C154 240 157 239 160 238C162 237 165 235 167 233C169 231 171 229 173 227C174 225 175 223 175 221C176 219 176 217 175 216C175 214 174 212 173 211C172 210 170 208 168 208C165 207 161 206 157 206C153 206 147 206 143 205C138 205 135 203 132 202C129 201 127 199 124 198C122 198 120 197 119 198C118 198 116 200 116 201C115 203 115 205 116 207ZM436 176C434 175 431 174 429 174C426 174 424 174 421 174C418 175 416 175 412 177C409 178 404 181 400 184C396 187 390 191 387 194C384 197 382 200 381 203C381 205 382 208 383 211C385 214 388 217 391 220C395 223 400 228 404 229C409 231 414 231 419 230C423 229 429 226 432 225C436 223 438 222 440 221C441 220 442 219 442 217C442 215 442 213 442 210C442 208 442 204 442 202C442 199 442 197 442 196C443 194 444 193 444 191C444 189 444 187 444 185C443 183 442 181 441 179C440 178 438 176 436 176ZM229 173C228 175 230 176 232 178C234 179 237 180 240 181C244 182 249 183 252 185C256 186 259 189 262 191C265 193 268 196 270 197C272 199 274 200 276 200C277 200 278 200 280 198C282 196 284 192 286 188C289 183 292 177 293 173C295 169 295 166 294 164C294 162 292 162 290 161C288 160 285 159 282 158C278 158 274 157 270 158C265 158 259 160 253 161C247 163 240 166 236 168C232 170 230 172 229 173Z"],
  ["#291d16", "M291 381C288 381 286 382 282 383C279 384 275 387 271 389C267 392 262 396 259 398C256 401 254 403 252 405C251 408 251 409 251 413C252 417 253 423 254 429C256 435 258 444 260 450C262 455 264 459 267 463C270 466 272 468 275 469C278 471 281 471 284 472C288 472 291 471 294 471C297 470 300 469 303 468C306 467 308 466 310 465C312 464 314 462 316 461C317 459 318 458 319 455C320 452 322 448 323 444C324 439 326 434 326 429C327 424 327 419 326 414C326 409 325 404 323 400C321 396 318 392 314 390C310 387 305 385 301 384C297 382 294 382 291 381ZM204 381C203 382 202 383 201 385C200 386 200 389 200 391C199 393 199 396 200 399C200 402 201 406 202 409C203 412 204 417 205 419C207 422 208 423 210 424C211 425 213 425 215 425C216 424 218 423 219 421C220 419 222 417 223 414C224 411 224 408 225 404C225 400 225 396 225 393C225 390 225 388 224 386C223 384 222 383 220 382C219 381 217 380 215 380C213 379 211 379 209 380C207 380 206 380 204 381ZM198 275C197 277 197 279 198 281C199 283 201 286 204 288C206 290 210 293 213 295C216 297 219 299 222 300C225 300 228 301 230 301C233 301 235 300 236 299C238 298 239 297 240 295C241 294 242 292 242 290C242 288 241 285 240 282C239 279 238 276 236 273C234 270 231 265 229 263C227 261 225 259 223 259C221 258 220 258 218 259C216 260 213 261 210 263C207 265 204 267 202 269C200 271 198 273 198 275ZM330 257C328 258 327 260 325 262C324 265 323 268 322 271C321 274 320 278 320 281C320 283 320 285 321 287C322 289 322 290 324 291C325 292 327 293 329 293C331 294 334 294 336 294C339 293 342 292 344 290C347 288 350 286 352 283C354 281 356 278 357 276C358 274 358 271 358 268C358 266 357 264 356 262C354 260 352 259 349 258C347 256 345 256 342 255C340 254 337 254 335 254C333 254 331 255 330 257Z"],
];

/** Her feet in trace space, and the scale that fits her into her floor slot. */
const LUNA_FEET = { x: 274.5, y: 782 };
const LUNA_SCALE = 0.2016;

/**
 * Authored at the companion's default anchor (186, 480), as every movable prop
 * is — MovableProp only translates by the distance she has been dragged.
 */
const Luna = () => (
  <g>
    <ellipse cx={186} cy={479} rx={38} ry={6} fill="#000000" opacity={0.32} />
    <g transform={`translate(186 480) scale(${LUNA_SCALE}) translate(${-LUNA_FEET.x} ${-LUNA_FEET.y})`}>
      {/* Her tail, which is too thin and too shadowed to survive segmentation. */}
      <path
        d="M140 610 C96 596 58 556 44 500"
        fill="none"
        stroke="#bf9060"
        strokeWidth={24}
        strokeLinecap="round"
      />
      <path d="M58 530 C50 514 46 506 44 500" fill="none" stroke="#f0d0ba" strokeWidth={24} strokeLinecap="round" />
      {LUNA_LAYERS.map(([fill, d], i) => (
        <path key={i} fill={fill} fillRule="evenodd" d={d} />
      ))}
    </g>
  </g>
);

/* --------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------ */
export const StudentBuildingScene = ({
  className = "",
  avatar: avatarProp,
  customizable = true,
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const gid = useCallback((name) => `${uid}-${name}`, [uid]);

  const [storedAvatar, setStoredAvatar] = useState(() =>
    avatarProp ? normalizeAvatar(avatarProp) : loadAvatar(),
  );
  const [panelOpen, setPanelOpen] = useState(false);
  /** Live drag state. `null` whenever nothing is being dragged. */
  const [drag, setDrag] = useState(null);
  const [focusedProp, setFocusedProp] = useState(null);
  /** Spoken, not drawn: every move and every addition is announced. */
  const [status, setStatus] = useState("");
  const svgRef = useRef(null);

  const avatar = useMemo(
    () => normalizeAvatar(avatarProp ?? storedAvatar),
    [avatarProp, storedAvatar],
  );

  const commit = useCallback((next) => {
    const normalized = normalizeAvatar(next);
    setStoredAvatar(normalized);
    saveAvatar(normalized);
    return normalized;
  }, []);

  /**
   * Turning a prop on puts it in the first free slot rather than on a fixed
   * literal that something else may already occupy.
   */
  const handleChange = useCallback(
    (key, value) => {
      const next = { ...avatar, [key]: value };
      const propId = PROP_FOR_TOGGLE[key];

      if (propId && !isPropEnabled(avatar, propId) && isPropEnabled(next, propId)) {
        const slot = findFreeSlot(next, propId);
        next.positions = { ...avatar.positions, [propId]: slot };
        const prop = findProp(propId);
        const moved = Math.round(slot.x) !== Math.round(readPosition(avatar, propId).x);
        setStatus(
          `${prop.label} added${moved ? " in the nearest free space" : ""}. ` +
            "Drag it, or focus it and use the arrow keys, to move it.",
        );
      } else if (propId && isPropEnabled(avatar, propId) && !isPropEnabled(next, propId)) {
        setStatus(`${findProp(propId).label} removed.`);
      }

      commit(next);
    },
    [avatar, commit],
  );

  const handleRandomize = useCallback(() => {
    commit(randomAvatar());
    setStatus("Scene randomized. Every prop was laid out in free space.");
  }, [commit]);

  const handleReset = useCallback(() => {
    commit(DEFAULT_AVATAR);
    setStatus("Scene reset to its starting layout.");
  }, [commit]);

  /* ---------------- moving props ---------------- */

  /**
   * Client pixels to SVG user units. The viewBox is 800x500 but the element is
   * fluid, so the two are never 1:1 — the screen CTM is the only honest way to
   * convert, and it also handles page zoom and any ancestor transform.
   */
  const toSvgPoint = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg || typeof svg.getScreenCTM !== "function") return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const positionOf = useCallback(
    (id) => (drag && drag.id === id ? { x: drag.x, y: drag.y } : readPosition(avatar, id)),
    [avatar, drag],
  );

  const movePropTo = useCallback(
    (id, next) => {
      // Whole units: the CTM inverse leaves float noise that nobody can see
      // but everybody would read in the stored config.
      const clamped = clampPropPosition(id, {
        x: Math.round(next.x),
        y: Math.round(next.y),
      });
      commit({ ...avatar, positions: { ...avatar.positions, [id]: clamped } });
      const prop = findProp(id);
      const overlapping = propCollides(avatar, id, clamped);
      setStatus(
        `${prop.label} moved to x ${Math.round(clamped.x)}, y ${Math.round(clamped.y)}` +
          `${overlapping ? ", overlapping another item" : ""}.`,
      );
      return clamped;
    },
    [avatar, commit],
  );

  const handlePropPointerDown = useCallback(
    (id) => (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = toSvgPoint(event);
      if (!point) return;
      event.preventDefault();
      const target = event.currentTarget;
      try {
        // Throws for a pointer id the UA no longer considers active.
        target.setPointerCapture?.(event.pointerId);
      } catch {
        // Capture is an optimisation; the move handler works without it.
      }
      // preventScroll: focusing must not yank the page mid-drag.
      if (typeof target.focus === "function") target.focus({ preventScroll: true });
      const start = readPosition(avatar, id);
      setDrag({
        id,
        pointerId: event.pointerId,
        grabX: point.x - start.x,
        grabY: point.y - start.y,
        x: start.x,
        y: start.y,
        invalid: false,
      });
    },
    [avatar, toSvgPoint],
  );

  const handlePropPointerMove = useCallback(
    (id) => (event) => {
      if (!drag || drag.id !== id) return;
      const point = toSvgPoint(event);
      if (!point) return;
      const next = clampPropPosition(id, {
        x: point.x - drag.grabX,
        y: point.y - drag.grabY,
      });
      setDrag((prev) =>
        prev && prev.id === id
          ? { ...prev, ...next, invalid: propCollides(avatar, id, next) }
          : prev,
      );
    },
    [avatar, drag, toSvgPoint],
  );

  const handlePropPointerUp = useCallback(
    (id) => (event) => {
      if (!drag || drag.id !== id) return;
      const target = event.currentTarget;
      try {
        if (target.hasPointerCapture?.(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Already released, or never captured.
      }
      movePropTo(id, { x: drag.x, y: drag.y });
      setDrag(null);
    },
    [drag, movePropTo],
  );

  /** Drag is a mouse affordance; the arrow keys are the real contract. */
  const handlePropKeyDown = useCallback(
    (id) => (event) => {
      const delta = ARROW_DELTAS[event.key];
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      const step = event.shiftKey ? NUDGE_FAST : NUDGE;
      const from = readPosition(avatar, id);
      movePropTo(id, { x: from.x + delta[0] * step, y: from.y + delta[1] * step });
    },
    [avatar, movePropTo],
  );

  const skin = findOption(SKIN_TONES, avatar.skinTone);
  const hair = findOption(HAIR_COLORS, avatar.hairColor);
  const top = findOption(TOP_COLORS, avatar.topColor);
  const desk = findOption(DESK_SURFACES, avatar.deskSurface);
  const chair = findOption(CHAIR_COLORS, avatar.chairColor);

  const accent = "var(--color-primary, #00FFCC)";
  const isNight = avatar.backdrop === "night";
  /** The accent is legible on the dark backdrop; daylight needs real ink. */
  const motifInk = isNight ? accent : "#0E7490";
  const label = describeAvatar(avatar);

  /** A scene driven by a fixed `avatar` prop is a picture, not a workspace. */
  const interactive = customizable && !avatarProp;

  /* The art for each prop, drawn at its authored anchor. */
  const propArt = {
    lamp: <Lamp accent={isNight ? "#FDE68A" : "#FFFFFF"} lit={isNight} />,
    plant: <Plant />,
    books: <Books />,
    companion: <Luna />,
    keyboard: <Keyboard mech={avatar.mechKeyboard} accent={accent} />,
    phone: <Phone accent={accent} />,
    mug: <Mug accent={accent} />,
  };

  /**
   * Paint order: back to front, by the depth declared in the config — a lamp
   * belongs behind the books whatever the two are dragged to.
   *
   * Deliberately NOT re-sorted by the live y of each anchor: that reorders the
   * DOM mid-nudge, and moving a focused <g> blurs it, which would break the
   * arrow keys for exactly the people who depend on them.
   */
  const visibleProps = propsByDepth().filter((prop) => isPropEnabled(avatar, prop.id));

  const renderProp = (prop) => {
    const position = positionOf(prop.id);
    const dragging = drag?.id === prop.id;
    const bounds = propBounds(prop);

    return (
      <MovableProp
        key={prop.id}
        prop={prop}
        position={position}
        interactive={interactive}
        active={dragging ? "drag" : focusedProp === prop.id ? "focus" : null}
        invalid={dragging ? drag.invalid : false}
        label={
          `${prop.label}, movable. Position ${Math.round(position.x)}, ${Math.round(position.y)} ` +
          `of ${Math.round(bounds.minX)} to ${Math.round(bounds.maxX)} across. ` +
          "Arrow keys move it, shift and arrow moves further."
        }
        onPointerDown={handlePropPointerDown(prop.id)}
        onPointerMove={handlePropPointerMove(prop.id)}
        onPointerUp={handlePropPointerUp(prop.id)}
        onKeyDown={handlePropKeyDown(prop.id)}
        onFocus={() => {
          setFocusedProp(prop.id);
          setStatus(`${prop.label} selected. Use the arrow keys to move it.`);
        }}
        onBlur={() => setFocusedProp((current) => (current === prop.id ? null : current))}
      >
        {propArt[prop.id]}
      </MovableProp>
    );
  };

  const propsBehindDisplay = visibleProps.filter((prop) => prop.depth < DISPLAY_DEPTH);
  const propsInFrontOfDisplay = visibleProps.filter((prop) => prop.depth >= DISPLAY_DEPTH);

  return (
    <div className={`@container ${className}`}>
      <style>{`
        @keyframes scene-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes scene-float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes scene-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scene-steam { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 100% { transform: translateY(-14px) scale(1.4); opacity: 0; } }
        @keyframes scene-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.6; } }
        @keyframes scene-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scene-lid { 0%, 90%, 100% { transform: scaleY(0); } 94%, 96% { transform: scaleY(1); } }

        .scene-lid { transform-box: fill-box; transform-origin: center top; transform: scaleY(0); }

        @media (prefers-reduced-motion: no-preference) {
          .scene-float { animation: scene-float 3s ease-in-out infinite; }
          .scene-float-delay { animation: scene-float 3.6s ease-in-out infinite 0.5s; }
          .scene-float-slow { animation: scene-float-slow 4.2s ease-in-out infinite 1s; }
          .scene-steam1 { animation: scene-steam 2.4s ease-out infinite; }
          .scene-steam2 { animation: scene-steam 2.4s ease-out infinite 0.8s; }
          .scene-steam3 { animation: scene-steam 2.4s ease-out infinite 1.6s; }
          .scene-blink { animation: scene-blink 1.1s step-end infinite; }
          .scene-glow { animation: scene-pulse 2.4s ease-in-out infinite; }
          .scene-spin { animation: scene-spin 9s linear infinite; transform-origin: center; }
          .scene-lid { animation: scene-lid 5.4s ease-in-out infinite; }
          .scene-lid-b { animation-delay: 0.04s; }
        }
      `}</style>

      {/*
       * Scene and panel share a row once the container is wide enough and
       * stack — panel underneath — when it is not. The panel is a sibling of
       * the illustration, never an overlay on it.
       */}
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-start">
        <div className="relative min-w-0 flex-1">
          <svg
            ref={svgRef}
            viewBox="0 0 800 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            role="img"
            aria-label={label}
          >
            <defs>
              <linearGradient id={gid("bg")} x1="0" y1="0" x2="800" y2="500" gradientUnits="userSpaceOnUse">
                {isNight ? (
                  <>
                    <stop offset="0%" stopColor="#0B1020" />
                    <stop offset="55%" stopColor="#0A0D14" />
                    <stop offset="100%" stopColor="#12101E" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#CFE3F2" />
                    <stop offset="55%" stopColor="#E9EEF3" />
                    <stop offset="100%" stopColor="#F3E7DA" />
                  </>
                )}
              </linearGradient>

              <radialGradient id={gid("ambient")} cx="0.5" cy="0.62" r="0.55">
                <stop offset="0%" stopColor={accent} stopOpacity={isNight ? 0.22 : 0.12} />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>

              {/* Skin: base with a soft falloff to shadow at the silhouette edge. */}
              <radialGradient id={gid("skin")} cx="0.44" cy="0.42" r="0.68">
                <stop offset="0%" stopColor={skin.highlight} />
                <stop offset="45%" stopColor={skin.base} />
                <stop offset="100%" stopColor={skin.shadow} />
              </radialGradient>

              {/* The display is the key light: it rakes UP from below the chin.
                  Screen light is blue-white, not the accent hue — a saturated wash
                  reads as illness, a cool desaturated one reads as a monitor. */}
              <linearGradient id={gid("keyLight")} x1="0" y1="208" x2="0" y2="158" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={SCREEN_LIGHT} stopOpacity="0.34" />
                <stop offset="35%" stopColor={SCREEN_LIGHT} stopOpacity="0.1" />
                <stop offset="100%" stopColor={SCREEN_LIGHT} stopOpacity="0" />
              </linearGradient>

              <radialGradient id={gid("chestLight")} cx="0.5" cy="0.18" r="0.6">
                <stop offset="0%" stopColor={SCREEN_LIGHT} stopOpacity="0.22" />
                <stop offset="100%" stopColor={SCREEN_LIGHT} stopOpacity="0" />
              </radialGradient>

              {/* neck: deep in the chin's occlusion at the top, lit at the base */}
              <linearGradient id={gid("neck")} x1="0" y1="188" x2="0" y2="228" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#000000" stopOpacity="0.16" />
                <stop offset="100%" stopColor={SCREEN_LIGHT} stopOpacity="0.14" />
              </linearGradient>

              <radialGradient id={gid("chinShadow")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* separates the figure from the backdrop: a lift at night, a
                  soft cast shadow in daylight */}
              <radialGradient id={gid("figureHalo")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={isNight ? accent : "#0F172A"} stopOpacity={isNight ? 0.16 : 0.08} />
                <stop offset="100%" stopColor={isNight ? accent : "#0F172A"} stopOpacity="0" />
              </radialGradient>

              {/* Far side of the figure falls away from the key light. */}
              <linearGradient id={gid("farSide")} x1="373" y1="0" x2="427" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
                <stop offset="55%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id={gid("torsoForm")} x1="333" y1="0" x2="467" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
                <stop offset="18%" stopColor="#000000" stopOpacity="0.04" />
                <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
              </linearGradient>

              <linearGradient id={gid("desk")} x1="0" y1="344" x2="0" y2="366" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={desk.base} />
                <stop offset="100%" stopColor={desk.shadow} />
              </linearGradient>

              <linearGradient id={gid("chair")} x1="0" y1="220" x2="0" y2="348" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={chair.base} />
                <stop offset="100%" stopColor={chair.shadow} />
              </linearGradient>

              <linearGradient id={gid("screen")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#141A2E" />
                <stop offset="100%" stopColor="#1F1B44" />
              </linearGradient>

              <linearGradient id={gid("screenGlow")} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
              </linearGradient>

              <radialGradient id={gid("spill")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>

              <clipPath id={gid("headClip")}>
                <path d={HEAD_PATH} />
              </clipPath>
              <clipPath id={gid("torsoClip")}>
                <path d={TORSO_PATH} />
              </clipPath>

              <filter id={gid("soft")} x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.35" />
              </filter>
            </defs>

            <rect width="800" height="500" rx="16" fill={`url(#${gid("bg")})`} />
            <rect width="800" height="500" rx="16" fill={`url(#${gid("ambient")})`} />

            {/* ---------- BACKDROP: sun or moon + stars ---------- */}
            <g className="scene-float-slow">
              <circle cx={664} cy={90} r={40} fill={isNight ? "#CBD5E1" : "#FBBF24"} opacity={0.1} />
              <circle cx={664} cy={90} r={24} fill={isNight ? "#E2E8F0" : "#FCD34D"} opacity={isNight ? 0.85 : 0.95} />
              {isNight && <circle cx={654} cy={83} r={22} fill="#0A0D14" opacity="0.9" />}
            </g>
            {isNight &&
              [
                [92, 64],
                [180, 108],
                [268, 56],
                [556, 72],
                [730, 168],
                [620, 46],
                [120, 148],
              ].map(([cx, cy], i) => (
                <circle key={`star-${i}`} cx={cx} cy={cy} r={i % 2 ? 1.4 : 2} fill="#E2E8F0" opacity={0.55} />
              ))}
            {!isNight &&
              [
                [140, 96, 26],
                [236, 74, 18],
                [548, 118, 22],
              ].map(([cx, cy, r], i) => (
                <g key={`cloud-${i}`} opacity={0.5}>
                  <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.5} fill="#FFFFFF" />
                  <ellipse cx={cx + r * 0.6} cy={cy + 3} rx={r * 0.7} ry={r * 0.4} fill="#FFFFFF" />
                </g>
              ))}

            {/* ---------- FLOATING CODE MOTIFS (background layer) ---------- */}
            <g opacity={isNight ? 0.85 : 0.9}>
              <g className="scene-float" style={{ transformOrigin: "138px 116px" }}>
                <g className="scene-spin" style={{ transformOrigin: "138px 116px" }}>
                  {[0, 60, 120].map((deg) => (
                    <ellipse
                      key={`atom-${deg}`}
                      cx={138}
                      cy={116}
                      rx={22}
                      ry={8}
                      fill="none"
                      stroke={isNight ? "#61DAFB" : "#0E7490"}
                      strokeWidth={1.5}
                      opacity={0.6}
                      transform={`rotate(${deg} 138 116)`}
                    />
                  ))}
                </g>
                <circle cx={138} cy={116} r={3} fill={isNight ? "#61DAFB" : "#0E7490"} />
              </g>

              <g className="scene-float-delay">
                <text x={690} y={226} fontSize={28} fill={motifInk} opacity={0.5} fontFamily="monospace" fontWeight="bold">
                  {"{ }"}
                </text>
              </g>
              <g className="scene-float-slow">
                <text x={78} y={236} fontSize={22} fill={motifInk} opacity={0.45} fontFamily="monospace" fontWeight="bold">
                  {"</>"}
                </text>
              </g>
              <g className="scene-float">
                <path d="M234 168 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#FBBF24" opacity={0.5} />
              </g>
              <g className="scene-float-delay">
                <path d="M614 292 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" fill="#818CF8" opacity={0.45} />
              </g>
              <g className="scene-float-slow" style={{ transformOrigin: "724px 112px" }}>
                <circle cx={724} cy={112} r={12} fill="#FBBF24" opacity={0.2} className="scene-glow" />
                <path
                  d="M719 108 Q719 100 724 98 Q729 100 729 108 Q729 111 727 112 L721 112 Q719 111 719 108Z"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth={1.5}
                  opacity={0.75}
                />
                <rect x={721} y={112} width={6} height={3} rx={1} fill="#FBBF24" opacity={0.75} />
              </g>
            </g>

            {/* separates the figure from the backdrop */}
            <ellipse cx={CENTER} cy={268} rx={190} ry={150} fill={`url(#${gid("figureHalo")})`} />

            {/* ---------- CHAIR ---------- */}
            <g>
              <path
                d="M308 246 C308 226, 320 216, 340 216 L460 216 C480 216, 492 226, 492 246 L492 330
                   C492 342, 484 348, 470 348 L330 348 C316 348, 308 342, 308 330 Z"
                fill={`url(#${gid("chair")})`}
              />
              {/* lumbar seam + edge light so the chair reads behind the figure */}
              <path
                d="M316 248 C316 234, 326 226, 342 226 L458 226 C474 226, 484 234, 484 248"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2}
                opacity={0.1}
              />
              <path
                d="M308 246 C308 226, 320 216, 340 216 L460 216 C480 216, 492 226, 492 246"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={2}
                opacity={0.14}
              />
              {/* armrests */}
              <rect x={286} y={306} width={34} height={12} rx={6} fill={chair.shadow} />
              <rect x={480} y={306} width={34} height={12} rx={6} fill={chair.shadow} />
            </g>

            {/* ---------- FIGURE ---------- */}
            {/* hair volume that sits behind the skull */}
            <HairBack style={avatar.hairStyle} base={hair.base} shadow={hair.shadow} />

            {/* torso */}
            <g>
              <path d={TORSO_PATH} fill={top.base} />
              <g clipPath={`url(#${gid("torsoClip")})`}>
                <rect x={320} y={210} width={160} height={150} fill={`url(#${gid("torsoForm")})`} />
                <rect x={320} y={210} width={160} height={150} fill={`url(#${gid("chestLight")})`} />
                {/* collar + placket, so the top reads as a garment */}
                <path
                  d="M378 218 C386 234, 414 234, 422 218 L432 224 C424 246, 376 246, 368 224 Z"
                  fill="#000000"
                  opacity={0.22}
                />
                <rect x={398} y={240} width={3} height={108} fill="#000000" opacity={0.16} />
                {/* trapezius line into the shoulders */}
                <path
                  d="M368 226 C380 238, 420 238, 432 226"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  opacity={0.12}
                />
              </g>
              {/* rim light along the shoulder line, facing the screen */}
              <path
                d="M356 231 C346 238, 340 252, 337 272"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={2.2}
                opacity={0.28}
                strokeLinecap="round"
              />
              <path
                d="M444 231 C454 238, 460 252, 463 272"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={2.2}
                opacity={0.28}
                strokeLinecap="round"
              />
            </g>

            {/* arms */}
            <Arm skin={skin} topColor={top.base} />
            <Arm skin={skin} topColor={top.base} flip />

            {/* neck + the occlusion shadow the chin casts on it */}
            <g>
              <path d={NECK_PATH} fill={skin.base} />
              <path d={NECK_PATH} fill={`url(#${gid("neck")})`} />
              <ellipse cx={CENTER} cy={196} rx={22} ry={12} fill={`url(#${gid("chinShadow")})`} />
              {/* sternocleidomastoid, so the neck has structure */}
              <path
                d="M390 196 C389 206, 386 214, 383 220"
                fill="none"
                stroke="#000000"
                strokeWidth={1.4}
                opacity={0.18}
                strokeLinecap="round"
              />
              <path
                d="M410 196 C411 206, 414 214, 417 220"
                fill="none"
                stroke="#000000"
                strokeWidth={1.4}
                opacity={0.18}
                strokeLinecap="round"
              />
              <path
                d="M388 215 C394 222, 406 222, 412 215"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={2}
                opacity={0.22}
                strokeLinecap="round"
              />
            </g>

            {/* head */}
            <g>
              <ellipse cx={371} cy={174} rx={5.5} ry={9} fill={skin.base} />
              <ellipse cx={429} cy={174} rx={5.5} ry={9} fill={skin.base} />
              <ellipse cx={371} cy={175} rx={2.6} ry={4.4} fill={skin.shadow} opacity={0.6} />
              <ellipse cx={429} cy={175} rx={2.6} ry={4.4} fill={skin.shadow} opacity={0.6} />

              <path d={HEAD_PATH} fill={`url(#${gid("skin")})`} />

              <g clipPath={`url(#${gid("headClip")})`}>
                {/* far side falls into shadow */}
                <rect x={370} y={128} width={60} height={80} fill={`url(#${gid("farSide")})`} />
                {/* screen light raking up from under the jaw */}
                <rect x={370} y={128} width={60} height={80} fill={`url(#${gid("keyLight")})`} />
                {/* cheekbone + temple shading */}
                <ellipse cx={382} cy={182} rx={9} ry={7} fill={skin.shadow} opacity={0.25} />
                <ellipse cx={418} cy={182} rx={9} ry={7} fill={skin.shadow} opacity={0.25} />
                {/* brow ridge shadow */}
                <path
                  d="M378 162 C386 156, 414 156, 422 162 L422 168 L378 168 Z"
                  fill={skin.shadow}
                  opacity={0.22}
                />
              </g>

              {/* brow */}
              <path
                d="M381 162 Q388 157 396 160"
                fill="none"
                stroke={hair.shadow}
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.9}
              />
              <path
                d="M404 160 Q412 157 419 162"
                fill="none"
                stroke={hair.shadow}
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.9}
              />

              <Eye side={-1} clipId={gid("eyeL")} skin={skin} lidDelayClass="" />
              <Eye side={1} clipId={gid("eyeR")} skin={skin} lidDelayClass="scene-lid-b" />

              {/* nose bridge, tip and nostril */}
              <path
                d="M399 166 C398 173, 397 179, 396 183"
                fill="none"
                stroke={skin.shadow}
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0.55}
              />
              <path
                d="M395 184 Q400 188 405 184"
                fill="none"
                stroke={skin.shadow}
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={0.75}
              />
              <path
                d="M401 167 C403 174, 404 180, 405 183"
                fill="none"
                stroke={skin.highlight}
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0.5}
              />

              {/* mouth — restrained, slightly amused */}
              <path
                d="M390 191 Q395 190 400 191 Q405 190 410 191 Q405 197 400 197 Q395 197 390 191 Z"
                fill="#7A4338"
                opacity={0.55}
              />
              <path
                d="M390 191 Q400 194 410 191"
                fill="none"
                stroke="#5E3129"
                strokeWidth={1.7}
                strokeLinecap="round"
                opacity={0.9}
              />
              <path
                d="M395 195 Q400 196 405 195"
                fill="none"
                stroke={skin.highlight}
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.5}
              />
              {/* shadow under the lower lip, then the lit chin */}
              <path
                d="M394 199 Q400 201 406 199"
                fill="none"
                stroke={skin.shadow}
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={0.4}
              />
              <path
                d="M393 202 Q400 205 407 202"
                fill="none"
                stroke={SCREEN_LIGHT}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={0.3}
              />

              <FacialHair style={avatar.facialHair} base={hair.base} shadow={hair.shadow} />

              <HairFront style={avatar.hairStyle} base={hair.base} shadow={hair.shadow} />

              {avatar.glasses && (
                <g>
                  <rect x={376} y={161} width={23} height={18} rx={6} fill={accent} opacity={0.08} />
                  <rect x={401} y={161} width={23} height={18} rx={6} fill={accent} opacity={0.08} />
                  <rect
                    x={376}
                    y={161}
                    width={23}
                    height={18}
                    rx={6}
                    fill="none"
                    stroke="#1F2933"
                    strokeWidth={2}
                  />
                  <rect
                    x={401}
                    y={161}
                    width={23}
                    height={18}
                    rx={6}
                    fill="none"
                    stroke="#1F2933"
                    strokeWidth={2}
                  />
                  <path d="M399 168 L401 168" stroke="#1F2933" strokeWidth={2} strokeLinecap="round" />
                  <path d="M376 167 L370 170" stroke="#1F2933" strokeWidth={2} strokeLinecap="round" />
                  <path d="M424 167 L430 170" stroke="#1F2933" strokeWidth={2} strokeLinecap="round" />
                  {/* screen reflected in the lenses */}
                  <path d="M380 176 L392 163" stroke="#FFFFFF" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
                  <path d="M405 176 L417 163" stroke="#FFFFFF" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
                </g>
              )}

              {avatar.headphones && (
                <g>
                  <path
                    d="M364 168 C362 126, 438 126, 436 168"
                    fill="none"
                    stroke="#22262E"
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                  <path
                    d="M366 158 C366 132, 434 132, 434 158"
                    fill="none"
                    stroke="#3C424E"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                  <rect x={356} y={160} width={15} height={28} rx={7} fill="#22262E" />
                  <rect x={429} y={160} width={15} height={28} rx={7} fill="#22262E" />
                  <rect x={359} y={164} width={9} height={20} rx={4.5} fill="#3C424E" />
                  <rect x={432} y={164} width={9} height={20} rx={4.5} fill="#3C424E" />
                  <rect x={357} y={184} width={13} height={2.5} rx={1.2} fill={accent} opacity={0.8} />
                  <rect x={430} y={184} width={13} height={2.5} rx={1.2} fill={accent} opacity={0.8} />
                </g>
              )}
            </g>

            {/* ---------- LEGS ----------
                Drawn before the desk so its apron overlaps the knees, which is
                what makes the legs read as running up to the seat. The chair
                base goes first so the shins stand in front of it. */}
            <ChairBase color={chair.shadow} />
            <Leg />
            <Leg flip />

            {/* ---------- DESK ---------- */}
            <g filter={`url(#${gid("soft")})`}>
              <rect x={96} y={DESK_TOP} width={620} height={22} rx={3} fill={`url(#${gid("desk")})`} />
              <rect x={96} y={DESK_TOP} width={620} height={3} rx={1.5} fill={desk.highlight} opacity={0.75} />
              <rect x={126} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
              <rect x={672} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
              <rect x={126} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
              <rect x={672} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
            </g>

            {/* ---------- MOVABLE PROPS (behind the display plane) ----------
                Lamp, plant, books and Luna: everything the screen should occlude. */}
            {propsBehindDisplay.map(renderProp)}

            {/* ---------- DISPLAY(S) ---------- */}
            {avatar.display === "dual" && (
              <g transform="rotate(-7 636 280)">
                <ScreenPanel
                  x={566}
                  y={244}
                  width={140}
                  height={72}
                  screenGradId={gid("screen")}
                  glowGradId={gid("screenGlow")}
                >
                  <CodeLines x={578} y={258} width={124} scale={0.82} />
                </ScreenPanel>
                <rect x={628} y={322} width={16} height={18} rx={3} fill="#2A2E37" />
                <rect x={610} y={338} width={52} height={7} rx={3.5} fill="#22262E" />
              </g>
            )}

            {avatar.display === "laptop" ? (
              <g>
                <ScreenPanel
                  x={348}
                  y={248}
                  width={104}
                  height={74}
                  screenGradId={gid("screen")}
                  glowGradId={gid("screenGlow")}
                >
                  <CodeLines x={358} y={262} width={92} scale={0.78} />
                </ScreenPanel>
                <circle cx={400} cy={245} r={1.6} fill="#3C424E" />
                {/* base */}
                <path d="M334 328 L466 328 L472 340 Q400 346 328 340 Z" fill="#2A2E37" />
                <path d="M334 328 L466 328 L466 331 L334 331 Z" fill="#3C424E" />
                <rect x={378} y={333} width={44} height={4} rx={2} fill="#3C424E" opacity={0.7} />
              </g>
            ) : (
              <g>
                <ScreenPanel
                  x={336}
                  y={238}
                  width={128}
                  height={80}
                  screenGradId={gid("screen")}
                  glowGradId={gid("screenGlow")}
                >
                  <CodeLines x={348} y={252} width={112} scale={0.82} />
                </ScreenPanel>
                <rect x={392} y={324} width={16} height={16} rx={3} fill="#2A2E37" />
                <rect x={368} y={338} width={64} height={7} rx={3.5} fill="#22262E" />
              </g>
            )}

            {/* light spilling from the display onto the desk */}
            <ellipse cx={CENTER} cy={340} rx={130} ry={26} fill={`url(#${gid("spill")})`} />

            {/* ---------- MOVABLE PROPS (in front of the display plane) ----------
                Keyboard, phone and mug: the things that live between you and the
                screen. The hands stay on top of all of them. */}
            {propsInFrontOfDisplay.map(renderProp)}

            {/* ---------- HANDS ---------- */}
            <Hand skin={skin} />
            <Hand skin={skin} flip />
          </svg>
        </div>

        {interactive && (
          <SceneCustomizer
            avatar={avatar}
            open={panelOpen}
            onToggle={() => setPanelOpen((prev) => !prev)}
            onChange={handleChange}
            onRandomize={handleRandomize}
            onReset={handleReset}
            description={label}
          />
        )}
      </div>

      {/* Moves and additions are not visible to everyone — say them out loud. */}
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
};

export default StudentBuildingScene;
