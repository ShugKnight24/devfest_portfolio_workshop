import { useCallback, useId, useMemo, useState } from "react";
import {
  CHAIR_COLORS,
  DEFAULT_AVATAR,
  DESK_SURFACES,
  HAIR_COLORS,
  SKIN_TONES,
  TOP_COLORS,
  describeAvatar,
  findOption,
  loadAvatar,
  normalizeAvatar,
  randomAvatar,
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
const DESK_TOP = 344;
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
 * Drawn from photographs rather than from a generic dog: a big lean fawn mix
 * with a cream chest, throat and legs, a grey muzzle with a black nose, large
 * soft ears that fold over, and the dark "mascara" markings ringing her eyes
 * that were the first thing anyone noticed about her.
 *
 * She sits at the left of the desk so she never collides with the figure, the
 * chair or the props, and her contact shadow uses the same treatment as every
 * other object on the floor so she reads as part of the scene.
 * ------------------------------------------------------------------------ */
const LUNA = {
  tan: "#C9A06A",
  tanShadow: "#A87F4B",
  tanLight: "#DDBE8C",
  cream: "#F0E6D2",
  creamShadow: "#D6C7AC",
  muzzle: "#8C837B",
  muzzleDark: "#6E655E",
  nose: "#2B2522",
  earInner: "#CFA098",
  eye: "#A96F33",
  mask: "#3E3228",
  whisker: "#EDE5D6",
};

/**
 * Her eyes: wide-set, soft and almond, ringed by the smudged dark markings that
 * were the first thing anyone noticed. Deliberately NOT symmetric circles — a
 * matched pair of rings reads as a raccoon, not as her.
 */
const LunaEyes = () => (
  <g>
    {[-12.5, 12.5].map((dx) => (
      <g key={dx} transform={`translate(${dx}, 0)`}>
        {/* smudge: heavier above and toward the outside of the face */}
        <ellipse cx={176} cy={336} rx={11} ry={8.5} fill={LUNA.mask} opacity={0.5}
          transform={`rotate(${dx < 0 ? -14 : 14} 176 336)`} />
        <ellipse cx={176 + (dx < 0 ? -2 : 2)} cy={332} rx={8} ry={5} fill={LUNA.mask} opacity={0.34} />
        {/* almond eye */}
        <path d="M169.5 337 C171.5 332.5 180.5 332.5 182.5 337 C180.5 341 171.5 341 169.5 337 Z"
          fill="#F3EAD9" opacity={0.9} />
        <circle cx={176} cy={337} r={3.5} fill={LUNA.eye} />
        <circle cx={176} cy={337} r={1.9} fill="#1E1815" />
        <circle cx={177.2} cy={335.7} r={1} fill="#FFFFFF" opacity={0.95} />
        {/* the pink lower lid she always showed */}
        <path d="M170.5 339.5 C173 341.8 179 341.8 181.5 339.5" stroke="#C98D86" strokeWidth={1.1}
          fill="none" strokeLinecap="round" opacity={0.75} />
        <path d="M169.5 336 C171.5 332 180.5 332 182.5 336" stroke={LUNA.mask} strokeWidth={1.2}
          fill="none" strokeLinecap="round" opacity={0.8} />
      </g>
    ))}
    {/* the furrow between the brows that gave her that earnest, worried look */}
    <path d="M176 328 L176 320" stroke={LUNA.tanShadow} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
  </g>
);

/**
 * One ear. Hers were big — set wide and high, folding over near the base and
 * hanging well below the jaw, with the pink inner ear showing on the fold.
 */
const LunaEar = ({ flip }) => (
  <g transform={flip ? "translate(352, 0) scale(-1, 1)" : undefined}>
    <path
      d="M157 320 C141 310 124 320 121 338 C118 356 129 371 143 374 C153 376 159 368 159 352 C159 336 163 326 157 320 Z"
      fill={LUNA.tan}
      stroke={LUNA.tanShadow}
      strokeWidth={1.1}
    />
    {/* inner ear, only visible on the folded-back part */}
    <path
      d="M153 328 C142 322 131 330 128 344 C125 358 134 367 143 369 C149 370 152 363 152 350 C152 337 155 331 153 328 Z"
      fill={LUNA.earInner}
      opacity={0.5}
    />
    {/* the fold crease near the base */}
    <path d="M154 323 C144 326 135 334 131 345" stroke={LUNA.tanShadow} strokeWidth={1.1}
      fill="none" opacity={0.85} strokeLinecap="round" />
  </g>
);

const LunaSitting = ({ accent }) => (
  <g>
    {/* ---- hindquarters, behind everything ---- */}
    <ellipse cx={216} cy={438} rx={32} ry={38} fill={LUNA.tanShadow} />
    <ellipse cx={212} cy={436} rx={29} ry={35} fill={LUNA.tan} />

    {/* long thin tail, off the rump and curling up */}
    <path d="M238 456 C264 452 280 432 280 408" stroke={LUNA.tanShadow} strokeWidth={9}
      strokeLinecap="round" fill="none" />
    <path d="M238 456 C264 452 280 432 280 408" stroke={LUNA.tan} strokeWidth={6.5}
      strokeLinecap="round" fill="none" />

    {/* ---- neck: tan at the nape, cream down the throat ---- */}
    <path d="M163 352 C163 340 189 340 189 352 L192 402 L160 402 Z" fill={LUNA.tan} />
    <path d="M168 360 C168 352 184 352 184 360 L188 402 L164 402 Z" fill={LUNA.cream} />

    {/* ---- torso: lean, tan back rolling into a broad cream chest ---- */}
    <path d="M148 410 C148 384 162 396 176 396 C196 396 210 410 212 436 C214 458 204 468 196 470 L158 470 C148 460 148 430 148 410 Z"
      fill={LUNA.tan} />
    <path d="M153 410 C153 390 166 400 178 400 C192 400 199 414 200 436 C201 456 193 466 186 468 L162 468 C153 458 153 430 153 410 Z"
      fill={LUNA.cream} />
    {/* a little shadow where the foreleg meets the chest */}
    <path d="M176 402 C174 422 174 446 176 466" stroke={LUNA.creamShadow} strokeWidth={2}
      fill="none" opacity={0.6} />

    {/* ---- front legs: long and straight, the way she sat ---- */}
    {[
      { x: 162, shade: LUNA.creamShadow },
      { x: 188, shade: LUNA.cream },
    ].map(({ x, shade }) => (
      <g key={x}>
        <rect x={x} y={430} width={13} height={44} rx={6.5} fill={shade} />
        <ellipse cx={x + 6.5} cy={474} rx={9.5} ry={5} fill={LUNA.cream} />
        <path d={`M${x + 2.5} 475 L${x + 2.5} 471 M${x + 6.5} 476 L${x + 6.5} 471 M${x + 10.5} 475 L${x + 10.5} 471`}
          stroke={LUNA.creamShadow} strokeWidth={1} strokeLinecap="round" />
      </g>
    ))}

    {/* ---- collar, on the NECK, well clear of the muzzle ---- */}
    <path d="M161 392 C168 400 184 400 191 392 L192 400 C184 408 168 408 160 400 Z"
      fill={accent} opacity={0.9} />
    <circle cx={176} cy={406} r={4} fill={accent} />
    <circle cx={176} cy={406} r={4} fill="#000000" opacity={0.18} />

    {/* ---- ears sit behind the skull ---- */}
    <LunaEar />
    <LunaEar flip />

    {/* ---- skull ---- */}
    <ellipse cx={176} cy={332} rx={25} ry={23} fill={LUNA.tan} />
    <ellipse cx={176} cy={325} rx={20} ry={14} fill={LUNA.tanLight} opacity={0.4} />

    {/* ---- long tapered grey muzzle, nose at the tip ---- */}
    <path d="M165 344 C165 337 187 337 187 344 C188 353 186 363 183 369 C181 373 171 373 169 369 C166 363 164 353 165 344 Z"
      fill={LUNA.muzzle} />
    {/* tan fading down the bridge */}
    <path d="M168 344 C169 340 183 340 184 344 C184 350 183 356 182 360 L170 360 C169 356 168 350 168 344 Z"
      fill={LUNA.tan} opacity={0.4} />
    {/* the pale patch on the bridge just above the nose */}
    <ellipse cx={176} cy={362} rx={4.2} ry={2.4} fill={LUNA.earInner} opacity={0.45} />
    <ellipse cx={176} cy={368} rx={7.6} ry={5.4} fill={LUNA.nose} />
    <ellipse cx={173.6} cy={366.6} rx={2} ry={1.3} fill="#FFFFFF" opacity={0.3} />
    {/* mouth + jowls */}
    <path d="M176 385.5 L176 388 M176 388 C172 391 167.5 390 165.5 386.5 M176 388 C180 391 184.5 390 186.5 386.5"
      stroke={LUNA.muzzleDark} strokeWidth={1.3} fill="none" strokeLinecap="round" />
    {[-1, 1].map((side) => (
      <g key={side} opacity={0.3}>
        <path d={`M${176 + side * 6} 364 L${176 + side * 14} 361`} stroke={LUNA.whisker} strokeWidth={0.7} strokeLinecap="round" />
        <path d={`M${176 + side * 6} 367 L${176 + side * 15} 367`} stroke={LUNA.whisker} strokeWidth={0.7} strokeLinecap="round" />
      </g>
    ))}

    <LunaEyes />
  </g>
);

const LunaCurled = ({ accent }) => (
  <g>
    {/* a nose-to-tail curl, the way she slept under the desk */}
    <ellipse cx={186} cy={452} rx={58} ry={28} fill={LUNA.tanShadow} />
    <ellipse cx={186} cy={449} rx={55} ry={25} fill={LUNA.tan} />
    <ellipse cx={186} cy={456} rx={44} ry={16} fill={LUNA.cream} opacity={0.75} />
    <path
      d="M236 444 C252 436 254 424 246 418"
      stroke={LUNA.tan}
      strokeWidth={9}
      strokeLinecap="round"
      fill="none"
    />
    {/* head laid on her own flank */}
    <ellipse cx={142} cy={444} rx={23} ry={20} fill={LUNA.tan} />
    <path d="M124 448 C120 442 122 434 128 432 C134 430 136 438 135 446 C134 452 128 454 124 448 Z" fill={LUNA.tan} stroke={LUNA.tanShadow} strokeWidth={1} />
    <path d="M127 446 C124 441 125 436 129 435 C133 434 133 440 132 445 C131 449 129 450 127 446 Z" fill={LUNA.earInner} opacity={0.5} />
    <path d="M134 452 C134 446 152 446 152 452 C153 460 149 466 143 466 C137 466 133 460 134 452 Z" fill={LUNA.muzzle} />
    <ellipse cx={143} cy={464} rx={6} ry={4.4} fill={LUNA.nose} />
    {/* eyes closed — two soft arcs */}
    {[-9, 5].map((dx) => (
      <path key={dx} d={`M${142 + dx} 442 C${144 + dx} 439 ${148 + dx} 439 ${150 + dx} 442`}
        stroke={LUNA.mask} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    ))}
    <ellipse cx={136} cy={441} rx={8} ry={6} fill={LUNA.mask} opacity={0.3} />
    <ellipse cx={152} cy={441} rx={8} ry={6} fill={LUNA.mask} opacity={0.3} />
    <circle cx={150} cy={458} r={3} fill={accent} opacity={0.85} />
  </g>
);

/**
 * Placement.
 *
 * Sitting, Luna is drawn ~165px wide with her head at y=305 — above the desk
 * top (y=344) and straight over the plant (x=114) and books (x=172). So the
 * sitting pose is scaled and moved to the clear floor right of the desk leg,
 * where her head sits just below the desk line and clears every prop.
 *
 * Curled needs no transform: it already lives at y=418-480, entirely under the
 * desk edge. That is why it is the default — a dog asleep under the desk is
 * both the truer picture and the one that never occludes anything.
 */
const SITTING_PLACEMENT = "translate(570, 131) scale(0.72)";

const Luna = ({ pose, accent }) => (
  <g transform={pose === "curled" ? undefined : SITTING_PLACEMENT}>
    {/* contact shadow, matching every other object on this floor */}
    <ellipse
      cx={pose === "curled" ? 186 : 182}
      cy={pose === "curled" ? 476 : 477}
      rx={pose === "curled" ? 62 : 54}
      ry={8}
      fill="#000000"
      opacity={0.32}
    />
    {pose === "curled" ? <LunaCurled accent={accent} /> : <LunaSitting accent={accent} />}
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

  const avatar = useMemo(
    () => normalizeAvatar(avatarProp ?? storedAvatar),
    [avatarProp, storedAvatar],
  );

  const commit = useCallback((next) => {
    const normalized = normalizeAvatar(next);
    setStoredAvatar(normalized);
    saveAvatar(normalized);
  }, []);

  const handleChange = useCallback(
    (key, value) => commit({ ...avatar, [key]: value }),
    [avatar, commit],
  );
  const handleRandomize = useCallback(() => commit(randomAvatar()), [commit]);
  const handleReset = useCallback(() => commit(DEFAULT_AVATAR), [commit]);

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

  const hasSeparateKeyboard = avatar.mechKeyboard || avatar.display !== "laptop";

  return (
    <div className={`relative ${className}`}>
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

      <svg
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

        {/* ---------- DESK ---------- */}
        <g filter={`url(#${gid("soft")})`}>
          <rect x={96} y={DESK_TOP} width={620} height={22} rx={3} fill={`url(#${gid("desk")})`} />
          <rect x={96} y={DESK_TOP} width={620} height={3} rx={1.5} fill={desk.highlight} opacity={0.75} />
          <rect x={126} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
          <rect x={672} y={366} width={14} height={98} rx={4} fill={desk.shadow} />
          <rect x={126} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
          <rect x={672} y={366} width={4} height={98} rx={2} fill={desk.highlight} opacity={0.3} />
        </g>

        {/* Luna, on the floor in front of the desk so the legs never clip her. */}
        {avatar.companion === "luna" && (
          <Luna pose={avatar.companionPose} accent={accent} />
        )}

        {/* ---------- DESK PROPS (behind the display plane) ---------- */}
        {avatar.plant && <Plant />}
        {avatar.books && <Books />}
        {avatar.lamp && <Lamp accent={isNight ? "#FDE68A" : "#FFFFFF"} lit={isNight} />}

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

        {/* ---------- DESK PROPS (in front of the display plane) ---------- */}
        {avatar.mug && <Mug accent={accent} />}
        {avatar.phone && <Phone accent={accent} />}

        {/* ---------- KEYBOARD + HANDS ---------- */}
        {hasSeparateKeyboard && <Keyboard mech={avatar.mechKeyboard} accent={accent} />}
        <Hand skin={skin} />
        <Hand skin={skin} flip />
      </svg>

      {customizable && !avatarProp && (
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
  );
};

export default StudentBuildingScene;
