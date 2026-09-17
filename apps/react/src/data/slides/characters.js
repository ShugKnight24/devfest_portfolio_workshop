/**
 * Character Roster — the side cast, each carrying one engineering lesson.
 *
 * The talk used to lean entirely on Reacher. That is one archetype doing the
 * work of a whole argument, and it left the Chainsaw Man half of the title
 * unpaid. This roster fixes both: two series, two crews, and every member
 * mapped to a concrete practice rather than a vibe. The 110th covers the
 * investigative half (scope, tooling, measurement, provenance, domain
 * knowledge, and — via Finlay — Chesterton's Fence). Division 4 covers the
 * velocity half (momentum, core primitives, confident wrongness, the price of
 * shortcuts, orchestration, and drilled fundamentals).
 *
 * Every entry is used somewhere: roster slides in `lhmSlides.js` render the
 * cards, and `finlay` anchors the Chesterton's Fence beat inside "Deduce First".
 *
 * IMAGES
 * ------
 * `image` is an intentionally empty slot. Drop your own LICENSED artwork at
 *
 *     public/assets/images/characters/<id>.jpg
 *
 * and set `image: "/assets/images/characters/<id>.jpg"` on that entry. The card
 * renderer prefers the image when it is non-empty and falls back to the abstract
 * emblem otherwise, so the deck is always presentable with nothing installed.
 * Nothing third-party is bundled here on purpose — supply art you have the
 * rights to. The emblems in src/components/Icons/CharacterEmblems.jsx are
 * original abstract sigils, not likenesses.
 */

export const characters = [
  // ── Reacher / the 110th MP Special Investigations Unit ──────────────────
  {
    id: "reacher",
    name: "Jack Reacher",
    series: "reacher",
    role: "The Drifter",
    trait: "Travels with a folding toothbrush and an expired passport.",
    lesson:
      "Carry no baggage into a problem. Minimal context and no inherited assumptions — the fewer things you have decided in advance, the faster the real cause surfaces.",
    emblem: "folding-toothbrush",
    image: "",
  },
  {
    id: "neagley",
    name: "Frances Neagley",
    series: "reacher",
    role: "Total Recall",
    trait: "Forgets nothing, misses nothing, hates being touched.",
    lesson:
      "Precision scoping. Hand the agent exact files and line numbers, never the whole repo. Context you did not need is context the model spends instead of thinking.",
    emblem: "tally-ledger",
    image: "",
  },
  {
    id: "odonnell",
    name: "David O'Donnell",
    series: "reacher",
    role: "The Ceramic Switchblade",
    trait: "Always has the small right tool.",
    lesson:
      "A sharp primitive beats a heavy framework. Reach for the twenty-line utility you fully understand before you install someone else's abstraction over it.",
    emblem: "ceramic-blade",
    image: "",
  },
  {
    id: "dixon",
    name: "Karla Dixon",
    series: "reacher",
    role: "Follow the Money",
    trait: "Forensic accountant. The numbers do not lie.",
    lesson:
      "Measure before you optimise. Profile, do not guess — the bottleneck is almost never where the confident engineer says it is.",
    emblem: "money-trace",
    image: "",
  },
  {
    id: "franz",
    name: "Calvin Franz",
    series: "reacher",
    role: "The One Who Dug",
    trait: "Died because he found the truth and trusted the wrong channel.",
    lesson:
      "Verify the chain of custody. An unaudited dependency is an unverified claim, and so is generated code you merged without reading the diff.",
    emblem: "broken-chain",
    image: "",
  },
  {
    id: "roscoe",
    name: "Roscoe Conklin",
    series: "reacher",
    role: "Local Knowledge",
    trait: "The cop who actually knows the town.",
    lesson:
      "Domain knowledge beats raw horsepower. Pair the agent with someone who knows the terrain, or it will solve the wrong problem beautifully.",
    emblem: "map-pin",
    image: "",
  },
  {
    id: "finlay",
    name: "Detective Finlay",
    series: "reacher",
    role: "By The Book",
    trait: "Harvard-educated, methodical, Reacher's procedural foil.",
    lesson:
      "Chesterton's Fence. Before you rip out the weird-looking code, find out why it is there. The strange line usually has an outage behind it.",
    emblem: "fence-gap",
    image: "",
  },

  // ── Chainsaw Man / Division 4 ───────────────────────────────────────────
  {
    id: "denji",
    name: "Denji",
    series: "chainsaw",
    role: "Pull The Ripcord",
    trait: "Simple goals, immediate action.",
    lesson:
      "Momentum beats deliberation. A running imperfect version teaches you more than another hour of planning, because now you are arguing with something real.",
    emblem: "ripcord",
    image: "",
  },
  {
    id: "pochita",
    name: "Pochita",
    series: "chainsaw",
    role: "The Engine",
    trait: "Small, humble, and the source of everything.",
    lesson:
      "Your core primitive. Guard the tiny dependable engine at the centre — the state machine, the parser, the one function everything else leans on.",
    emblem: "loop-cord",
    image: "",
  },
  {
    id: "power",
    name: "Power",
    series: "chainsaw",
    role: "Confident and Wrong",
    trait: "Brash, lies constantly, genuinely loyal.",
    lesson:
      "This is your agent on a bad day: fluent, certain, fabricating. Trust nothing it asserts without a check you ran yourself.",
    emblem: "crooked-halo",
    image: "",
  },
  {
    id: "aki",
    name: "Aki Hayakawa",
    series: "chainsaw",
    role: "The Contract Has A Price",
    trait: "Every devil contract costs him lifespan.",
    lesson:
      "Every shortcut is a contract. You will pay the interest later, on a schedule you do not choose — usually during an incident.",
    emblem: "signed-hourglass",
    image: "",
  },
  {
    id: "makima",
    name: "Makima",
    series: "chainsaw",
    role: "Control",
    trait: "Sees the whole board, directs everyone.",
    lesson:
      "Orchestration is the real skill now — and ceding judgement entirely is exactly how you lose. Direct the crew; do not become one of them.",
    emblem: "concentric-spiral",
    image: "",
  },
  {
    id: "reze",
    name: "Reze",
    series: "chainsaw",
    role: "Charm, Then Detonate",
    trait: "Explosive velocity.",
    lesson:
      "When the read is locked, move at full speed. Velocity is only safe after the analysis — detonating early is just damage.",
    emblem: "lit-fuse",
    image: "",
  },
  {
    id: "kishibe",
    name: "Kishibe",
    series: "chainsaw",
    role: "The Veteran",
    trait: "Brutal, pragmatic trainer who drills fundamentals.",
    lesson:
      "Fundamentals under pressure. Drill the investigate-deduce-verify loop until it is muscle memory, because under stage lights you only have reflexes.",
    emblem: "whetstone",
    image: "",
  },
];

/** Everyone from one series, in roster order. */
export const getBySeries = (series) => characters.filter((c) => c.series === series);

/** One character by id, or undefined. */
export const getCharacter = (id) => characters.find((c) => c.id === id);

/** Resolve a list of ids to entries, dropping any that do not exist. */
export const getCharacters = (ids = []) => ids.map(getCharacter).filter(Boolean);

export default characters;
