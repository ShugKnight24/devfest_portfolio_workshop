/**
 * Shared pieces for the companions, so pets, sidekicks and characters draw
 * their eyes the way the avatar does: a big dark eye, a coloured iris when
 * there is one, two catchlights, and a lash line on top.
 */

export const INK = "#221B26";

/**
 * `r` is the eye's half-width; it is a touch taller than wide. `slit` gives a
 * cat's vertical pupil. `lash` false for animals whose lid should stay soft.
 */
export const GlossyEye = ({ cx, cy, r, iris = null, slit = false, lash = true, look = 0 }) => {
  const ry = r * 1.15;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill={INK} />
      {iris && <ellipse cx={cx + look} cy={cy + r * 0.12} rx={r * 0.78} ry={ry * 0.78} fill={iris} />}
      {iris && (slit ? <ellipse cx={cx + look} cy={cy + r * 0.1} rx={r * 0.18} ry={ry * 0.66} fill={INK} /> : <circle cx={cx + look} cy={cy + r * 0.15} r={r * 0.42} fill={INK} />)}
      <circle cx={cx - r * 0.32} cy={cy - r * 0.4} r={r * 0.36} fill="#FFFFFF" />
      <circle cx={cx + r * 0.36} cy={cy + r * 0.42} r={r * 0.15} fill="#FFFFFF" opacity={0.85} />
      {lash && <path d={`M${cx - r * 1.05} ${cy - r * 0.3} Q${cx} ${cy - ry * 1.45} ${cx + r * 1.05} ${cy - r * 0.3}`} fill="none" stroke={INK} strokeWidth={r * 0.32} strokeLinecap="round" />}
    </g>
  );
};

/** Two soft blush marks under the eyes. */
export const Cheeks = ({ x, y, rx = 2.4, ry = 1.3 }) => (
  <g>
    <ellipse cx={-x} cy={y} rx={rx} ry={ry} fill="#FF7AA8" opacity={0.45} />
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#FF7AA8" opacity={0.45} />
  </g>
);
