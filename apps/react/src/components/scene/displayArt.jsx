/**
 * The screens on the desk, drawn like real hardware: a laptop with a hinge,
 * a keyboard deck in perspective and a trackpad; monitors with thin bezels on
 * a neck and foot; and for a dual setup, a second monitor turned in toward
 * the chair, drawn as a true trapezoid (its far edge shorter) rather than a
 * rotated rectangle.
 *
 * Screens show an editor and a browser preview of the site being built, as
 * UI shapes only (no words). Flat fills plus one sheen; the scene's ink
 * filter adds the outline.
 */

const SYNTAX = ["#C792EA", "#82AAFF", "#C3E88D", "#FFCB6B", "#F78C6C", "#89DDFF", "#EEFFFF"];

/** A code editor: title bar, file tree, gutter, code, minimap, status bar. */
export const EditorUI = ({ x, y, w, h, accent }) => {
  const title = Math.max(4, h * 0.08);
  const status = Math.max(2.5, h * 0.05);
  const side = w * 0.2;
  const gutter = w * 0.06;
  const bodyTop = y + title;
  const bodyH = h - title - status;
  const rows = Math.floor(bodyH / 5.2);
  const indents = [0, 1, 2, 2, 3, 3, 2, 1, 1, 2, 3, 2, 1, 0, 0, 1, 2, 2];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1E1F2B" />
      <rect x={x} y={y} width={w} height={title} fill="#161722" />
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => (
        <circle key={c} cx={x + 3 + i * 3.6} cy={y + title / 2} r={1.1} fill={c} />
      ))}
      <rect x={x + side + 2} y={y + 1} width={w * 0.16} height={title - 1} rx={1} fill="#1E1F2B" />
      <rect x={x} y={bodyTop} width={side} height={bodyH} fill="#191A25" />
      {Array.from({ length: Math.min(rows, 9) }, (_, i) => (
        <rect key={`f${i}`} x={x + 3 + (i % 3 === 0 ? 0 : 3)} y={bodyTop + 3 + i * 5.2} width={side * (i % 3 === 0 ? 0.55 : 0.45)} height={1.8} rx={0.9} fill={i === 3 ? accent : "#6B7089"} opacity={i === 3 ? 0.9 : 0.6} />
      ))}
      {Array.from({ length: rows }, (_, i) => {
        const cy = bodyTop + 3 + i * 5.2;
        const indent = indents[i % indents.length] * 4;
        const start = x + side + gutter + indent;
        const room = w - side - gutter - indent - w * 0.1;
        const parts = [0.22, 0.34, 0.18].map((f, k) => ({ f: f * (1 - ((i * 7 + k * 3) % 5) * 0.12), c: SYNTAX[(i + k * 2) % SYNTAX.length] }));
        let cursor = start;
        return (
          <g key={`r${i}`}>
            <rect x={x + side + 2} y={cy} width={gutter - 4} height={1.6} rx={0.8} fill="#4B4F66" />
            {i !== 4 &&
              parts.map(({ f, c }, k) => {
                const width = Math.max(2, room * f);
                const el = <rect key={k} x={cursor} y={cy} width={width} height={1.8} rx={0.9} fill={c} opacity={0.9} />;
                cursor += width + 2;
                return el;
              })}
          </g>
        );
      })}
      <rect className="scene-blink" x={x + side + gutter + 12} y={bodyTop + 3 + 4 * 5.2 - 1} width={1.2} height={4} fill="#FFCC00" />
      <rect x={x + w * 0.93} y={bodyTop + 2} width={w * 0.05} height={bodyH - 4} fill="#262838" />
      {Array.from({ length: Math.min(rows, 12) }, (_, i) => (
        <rect key={`m${i}`} x={x + w * 0.935} y={bodyTop + 3 + i * 3} width={w * (0.02 + ((i * 3) % 4) * 0.006)} height={1} fill="#6B7089" opacity={0.6} />
      ))}
      <rect x={x} y={y + h - status} width={w} height={status} style={{ fill: accent }} opacity={0.85} />
    </g>
  );
};

/** A browser showing the site being built: toolbar, hero, three cards. */
export const BrowserUI = ({ x, y, w, h, accent }) => {
  const bar = Math.max(5, h * 0.11);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#F6F7FB" />
      <rect x={x} y={y} width={w} height={bar} fill="#DFE3EC" />
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => (
        <circle key={c} cx={x + 3 + i * 3.6} cy={y + bar / 2} r={1.1} fill={c} />
      ))}
      <rect x={x + 14} y={y + bar * 0.25} width={w * 0.6} height={bar * 0.5} rx={bar * 0.25} fill="#FFFFFF" />
      <rect x={x + 4} y={y + bar + 3} width={w * 0.14} height={2.4} rx={1.2} style={{ fill: accent }} />
      {[0.55, 0.68, 0.81].map((f) => (
        <rect key={f} x={x + w * f} y={y + bar + 3} width={w * 0.1} height={2} rx={1} fill="#9AA3B5" />
      ))}
      <rect x={x + 4} y={y + bar + 9} width={w - 8} height={h * 0.32} rx={2} style={{ fill: accent }} opacity={0.85} />
      <rect x={x + 9} y={y + bar + 14} width={w * 0.42} height={3} rx={1.5} fill="#FFFFFF" />
      <rect x={x + 9} y={y + bar + 20} width={w * 0.3} height={2} rx={1} fill="#FFFFFF" opacity={0.75} />
      <rect x={x + 9} y={y + bar + 25} width={w * 0.16} height={4.5} rx={2.2} fill="#FFFFFF" />
      {[0, 1, 2].map((i) => {
        const cw = (w - 8 - 8) / 3;
        const cx = x + 4 + i * (cw + 4);
        const cy = y + bar + 12 + h * 0.32;
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={cw} height={h - (cy - y) - 4} rx={2} fill="#FFFFFF" stroke="#E1E5EE" strokeWidth={0.8} />
            <rect x={cx + 3} y={cy + 3} width={cw * 0.4} height={cw * 0.25} rx={1} style={{ fill: accent }} opacity={0.35} />
            <rect x={cx + 3} y={cy + 4 + cw * 0.3} width={cw * 0.7} height={1.6} rx={0.8} fill="#9AA3B5" />
            <rect x={cx + 3} y={cy + 8 + cw * 0.3} width={cw * 0.5} height={1.6} rx={0.8} fill="#C3C9D6" />
          </g>
        );
      })}
    </g>
  );
};

/** Diagonal glass sheen over a screen. */
const Sheen = ({ x, y, w, h }) => <path d={`M${x + w * 0.55} ${y} L${x + w * 0.75} ${y} L${x + w * 0.45} ${y + h} L${x + w * 0.25} ${y + h} Z`} fill="#FFFFFF" opacity={0.05} />;

/** Space-grey laptop, lid up, keyboard deck in perspective. Centred on x = 400. */
const Laptop = ({ accent }) => {
  const deckKeys = [];
  for (let r = 0; r < 3; r += 1) {
    const t0 = r / 3.4;
    const yTop = 325.6 + r * 3.4;
    const left = 352 - 17 * t0 + 3;
    const right = 448 + 17 * t0 - 3;
    const n = 13;
    const kw = (right - left) / n;
    for (let i = 0; i < n; i += 1) deckKeys.push(<rect key={`${r}-${i}`} x={left + i * kw + 0.4} y={yTop} width={kw - 0.8} height={2.6} rx={0.5} fill="#24272E" />);
  }
  return (
    <g>
      <ellipse cx={400} cy={344} rx={78} ry={4.5} fill="#000000" opacity={0.3} />
      {/* lid */}
      <rect x={346} y={252} width={108} height={72} rx={6} fill="#454B56" />
      <rect x={349} y={255} width={102} height={66} rx={4} fill="#0D0F14" />
      <EditorUI x={352} y={258} w={96} h={58} accent={accent} />
      <Sheen x={352} y={258} w={96} h={58} />
      <circle cx={400} cy={256.6} r={0.9} fill="#2C313B" />
      {/* hinge */}
      <rect x={354} y={322} width={92} height={3} rx={1.5} fill="#2A2E36" />
      {/* deck */}
      <path d="M352 324 L448 324 L466 339 L334 339 Z" fill="#5D6470" />
      <path d="M352 324 L448 324 L449 325.5 L351 325.5 Z" fill="#7C8492" />
      {deckKeys}
      <path d="M384 336 L416 336 L417.5 339 L382.5 339 Z" fill="#6E7582" />
      <path d="M334 339 L466 339 L464 343 Q400 345.5 336 343 Z" fill="#3E444F" />
    </g>
  );
};

/** One monitor, flat to the viewer. */
const Monitor = ({ x, y, w, h, accent, content = "editor" }) => {
  const cx = x + w / 2;
  const Screen = content === "browser" ? BrowserUI : EditorUI;
  return (
    <g>
      <ellipse cx={cx} cy={344} rx={w * 0.32} ry={4} fill="#000000" opacity={0.3} />
      {/* neck and foot */}
      <rect x={cx - 6} y={y + h - 2} width={12} height={344 - (y + h) - 4} rx={2} fill="#2D323B" />
      <rect x={cx - 6} y={y + h - 2} width={3} height={344 - (y + h) - 4} fill="#FFFFFF" opacity={0.08} />
      <path d={`M${cx - 26} ${340} L${cx + 26} ${340} L${cx + 31} ${344} L${cx - 31} ${344} Z`} fill="#2D323B" />
      <path d={`M${cx - 26} ${340} L${cx + 26} ${340} L${cx + 27} ${341.2} L${cx - 27} ${341.2} Z`} fill="#4A515D" />
      {/* panel: hairline bezel, a slightly deeper chin */}
      <rect x={x} y={y} width={w} height={h} rx={3.5} fill="#16181D" />
      <Screen x={x + 2.5} y={y + 2.5} w={w - 5} h={h - 7} accent={accent} />
      <Sheen x={x + 2.5} y={y + 2.5} w={w - 5} h={h - 7} />
      <rect x={x + w / 2 - 3} y={y + h - 3.2} width={6} height={1.2} rx={0.6} fill="#3A3F49" />
    </g>
  );
};

/**
 * The second monitor in a dual setup, turned in toward the chair. Its near
 * (left) edge is full height and the far edge is shorter: perspective, drawn
 * as a trapezoid, with the screen clipped to the same shape.
 */
const SideMonitor = ({ uid, accent }) => {
  const [x0, x1] = [474, 590];
  const near = [248, 322];
  const far = [255, 314];
  const frame = `M${x0} ${near[0]} L${x1} ${far[0]} L${x1} ${far[1]} L${x0} ${near[1]} Z`;
  const inset = `M${x0 + 2.5} ${near[0] + 2.5} L${x1 - 2.5} ${far[0] + 2.3} L${x1 - 2.5} ${far[1] - 4.5} L${x0 + 2.5} ${near[1] - 5} Z`;
  const cx = (x0 + x1) / 2 + 4;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-side`}>
          <path d={inset} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={344} rx={36} ry={3.6} fill="#000000" opacity={0.3} />
      <rect x={cx - 5} y={318} width={10} height={22} rx={2} fill="#2D323B" />
      <path d={`M${cx - 22} 340 L${cx + 22} 340 L${cx + 26} 344 L${cx - 26} 344 Z`} fill="#2D323B" />
      {/* the panel's back edge shows on the far side */}
      <path d={`M${x1} ${far[0]} L${x1 + 4} ${far[0] + 2} L${x1 + 4} ${far[1] - 1} L${x1} ${far[1]} Z`} fill="#0C0D10" />
      <path d={frame} fill="#16181D" />
      <g clipPath={`url(#${uid}-side)`}>
        <BrowserUI x={x0 + 2} y={near[0] + 2} w={x1 - x0 - 4} h={near[1] - near[0] - 6} accent={accent} />
        {/* the turned-away side is a touch darker */}
        <path d={`M${(x0 + x1) / 2} 240 L${x1} 240 L${x1} 330 L${(x0 + x1) / 2} 330 Z`} fill="#000000" opacity={0.08} />
      </g>
    </g>
  );
};

/** All screens for a display setup. `main` is drawn centred on the chair. */
export const Displays = ({ display, accent, uid }) => {
  if (display === "laptop") return <Laptop accent={accent} />;
  return (
    <g>
      {display === "dual" && <SideMonitor uid={uid} accent={accent} />}
      <Monitor x={336} y={250} w={128} h={72} accent={accent} />
    </g>
  );
};
