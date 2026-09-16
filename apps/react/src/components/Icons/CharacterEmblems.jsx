/**
 * Character Emblems — heraldry for the roster slides.
 *
 * These are SIGILS, not portraits. Nothing here depicts a character, a face, or
 * any copyrighted design: each emblem is an original abstract mark standing in
 * for the one idea that character carries on stage (a folding toothbrush for
 * "no baggage", a fence with a missing plank for Chesterton's Fence, a lit fuse
 * for "velocity after the read"). If the owner later drops in licensed artwork,
 * the card renderer prefers the image and these fall back out of the way.
 *
 * House rules, matching src/components/Icons/Warning.jsx:
 *   - 24x24 viewBox, stroke-only, `currentColor`, strokeWidth 2
 *   - decorative, so every emblem is aria-hidden; the card supplies the name
 */

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

/* ── Reacher / the 110th ─────────────────────────────────────────────────── */

/** Folding toothbrush — travel light, carry no baggage into a problem. */
export const FoldingToothbrush = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M3 18l5.5-2.6" />
    <circle cx="10.4" cy="14.6" r="1.6" />
    <path d="M12.3 13.4L19.5 10" />
    <path d="M13.6 10.6l-.9-2M16.2 9.4l-.9-2M18.8 8.2l-.9-2" />
  </svg>
);

/** Ledger with a perfect five-bar tally — forgets nothing, misses nothing. */
export const TallyLedger = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M8 8v8M10.5 8v8M13 8v8M15.5 8v8" />
    <path d="M7 16.5L16.5 7.5" />
  </svg>
);

/** Ceramic switchblade — the small right tool, always on you. */
export const CeramicBlade = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <rect x="2.5" y="13" width="6.5" height="4.5" rx="1" />
    <path d="M9 14.2L19 8l1.6 2.6-8.4 5.1z" />
    <path d="M10.6 12.9l7.8-3.2" />
  </svg>
);

/** Money trace — follow the numbers, measure before you optimise. */
export const MoneyTrace = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M4 3v17h16" />
    <path d="M6.5 16l4-5.5 3 3L18 7" />
    <circle cx="18.2" cy="6.8" r="1.5" />
  </svg>
);

/** Broken chain link — an unaudited dependency is an unverified claim. */
export const BrokenChain = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M9.5 15.5l-2 2a3.2 3.2 0 01-4.5-4.5l2-2" />
    <path d="M14.5 8.5l2-2a3.2 3.2 0 014.5 4.5l-2 2" />
    <path d="M9.6 10.4L8.2 9M14.4 13.6l1.4 1.4" />
  </svg>
);

/** Town map pin — local knowledge beats raw horsepower. */
export const MapPin = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M3 16.5h5M16 8h5" />
    <path d="M12 17.5s3.3-3.6 3.3-6.2a3.3 3.3 0 10-6.6 0c0 2.6 3.3 6.2 3.3 6.2z" />
  </svg>
);

/** Fence with one plank missing — Chesterton's Fence. Find out why first. */
export const FenceGap = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M2.5 9.5h19M2.5 15.5h19" />
    <path d="M6 5v15M10 5v15M18 5v15" />
    <path d="M14 5v15" strokeDasharray="2 3" />
  </svg>
);

/* ── Chainsaw Man / Division 4 ───────────────────────────────────────────── */

/** Ripcord handle — pull it and figure it out on the way down. */
export const Ripcord = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <rect x="6.5" y="3" width="11" height="4.5" rx="2.25" />
    <path d="M12 7.5v2c0 2-2.6 2-2.6 4s2.6 2 2.6 4v3.5" />
  </svg>
);

/** Looping cord — the small dependable engine at the centre. */
export const LoopCord = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M12 16.5c-3.9 0-6.8-2.4-6.8-5.8S8.1 4.9 12 4.9s6.8 2.4 6.8 5.8-2.9 5.8-6.8 5.8z" />
    <circle cx="12" cy="10.7" r="2.1" />
    <path d="M12 16.5V21" />
  </svg>
);

/** Crooked halo, unmoored — fluent, certain, and not attached to anything. */
export const CrookedHalo = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <ellipse cx="12" cy="8.5" rx="8" ry="3.2" transform="rotate(-13 12 8.5)" />
    <path d="M12 13.5v2.5M12 18.5v2.5" />
  </svg>
);

/** Hourglass over a signature — every shortcut is a contract with a price. */
export const SignedHourglass = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M7 2.5h10M7 16.5h10" />
    <path d="M7 2.5v2.6c0 2 3 3.1 3 4.6s-3 2.6-3 4.6v2.2" />
    <path d="M17 2.5v2.6c0 2-3 3.1-3 4.6s3 2.6 3 4.6v2.2" />
    <path d="M3.5 20.5c1.4-2 2.8-2 3.8 0s2.4 2 3.8 0 3.2-1.4 3.8.6" />
  </svg>
);

/** Concentric rings — sees the whole board, directs everyone on it. */
export const ConcentricSpiral = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="9.2" />
    <circle cx="12" cy="12" r="5.6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Lit fuse — full speed, but only once the read is locked. */
export const LitFuse = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <path d="M2.5 20.5c3.4 0 4.6-2.4 7-4.6 1.6-1.5 3.1-3 4.4-4.6" />
    <circle cx="15.6" cy="9.6" r="1.8" />
    <path d="M17.5 7.5l2-3M18.4 10.2l3.1-.7M17 12.2l2.3 1.9" />
  </svg>
);

/** Whetstone — drill the fundamentals until the loop is muscle memory. */
export const Whetstone = ({ className = "w-6 h-6" }) => (
  <svg className={className} {...base}>
    <rect x="2.5" y="15" width="19" height="5" rx="1" />
    <path d="M6.5 12.8L18 7l1.6 2.6-11.5 5.4z" />
    <path d="M4.5 9.5l2.2-1.1M3.5 12.6l2.4-.4" />
  </svg>
);

/**
 * Emblem id → component. `characters.js` stores only the id, so the roster data
 * stays serialisable and the test can assert every id resolves to a real mark.
 */
export const EMBLEMS = {
  "folding-toothbrush": FoldingToothbrush,
  "tally-ledger": TallyLedger,
  "ceramic-blade": CeramicBlade,
  "money-trace": MoneyTrace,
  "broken-chain": BrokenChain,
  "map-pin": MapPin,
  "fence-gap": FenceGap,
  ripcord: Ripcord,
  "loop-cord": LoopCord,
  "crooked-halo": CrookedHalo,
  "signed-hourglass": SignedHourglass,
  "concentric-spiral": ConcentricSpiral,
  "lit-fuse": LitFuse,
  whetstone: Whetstone,
};

export const getEmblem = (id) => EMBLEMS[id];

export default EMBLEMS;
