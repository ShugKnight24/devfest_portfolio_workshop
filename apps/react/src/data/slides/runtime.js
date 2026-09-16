/**
 * Elastic Deck Runtime
 *
 * Length is a VIEW over one deck, never a second deck. Nine hand-maintained
 * decks meant every edit to the thesis landed in five places, the "full" deck
 * was too long to give and the "condensed" one had the spine cut out of it.
 * Both failures came from baking length into the content.
 *
 * A runtime is now described along THREE independent axes, because a single
 * "how long" number could not express what the talk actually needs:
 *
 *   TIER      depth. Every slide declares one.
 *               CORE      the argument does not survive without it
 *               EXTENDED  evidence, pairings, the community thread
 *               DEEP      full case studies, process, craft detail
 *               LAB       hands-on exercises, workshops only
 *
 *   ALTITUDE  concept vs tactical. A high-level keynote is NOT the longest cut:
 *             it keeps the ideas and drops the how-to. So it cannot be a max
 *             tier. It is a filter, and it is OPT-IN — a runtime that asks for
 *             an altitude includes only slides that explicitly declare it, so
 *             a new untagged slide can never leak tactics into the keynote.
 *
 *   LAB TRACK which labs a workshop runs. The 90-minute workshop runs the
 *             `short` track; the 3-hour workshop runs every lab.
 *
 * FLEX ZONES
 * ----------
 * A slide can declare `flex: true` and a `zone`. Flex slides are standing
 * material the speaker pulls in mid-talk — built for the live build, where an
 * agent takes however long it takes and you need somewhere to stand. A zone
 * can be opened without changing the runtime, so the deck keeps its shape.
 */

export const TIER = {
  CORE: 1,
  EXTENDED: 2,
  DEEP: 3,
  LAB: 4,
};

export const ALTITUDE = {
  CONCEPT: "concept",
  TACTICAL: "tactical",
};

export const LAB_TRACK = {
  SHORT: "short",
  FULL: "full",
};

export const RUNTIMES = {
  lightning: {
    id: "lightning",
    label: "Lightning",
    minutes: 30,
    maxTier: TIER.EXTENDED,
    blurb: "The argument, the community bridge, the live build, the close.",
  },
  keynote: {
    id: "keynote",
    label: "Keynote",
    minutes: 40,
    maxTier: TIER.DEEP,
    altitude: ALTITUDE.CONCEPT,
    blurb: "Ideas only. Frameworks, characters as metaphor, community, the shift.",
  },
  standard: {
    id: "standard",
    label: "Standard",
    minutes: 60,
    maxTier: TIER.DEEP,
    blurb: "The full talk: ideas, evidence, craft and the live build.",
  },
  workshopShort: {
    id: "workshopShort",
    label: "Workshop Short",
    minutes: 90,
    maxTier: TIER.LAB,
    labTrack: LAB_TRACK.SHORT,
    blurb: "The talk plus two hands-on labs.",
  },
  workshopFull: {
    id: "workshopFull",
    label: "Workshop Full",
    minutes: 180,
    maxTier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    blurb: "Every lab, a break, and time for show and tell.",
  },
};

/** Display and hotkey order: shortest to longest. */
export const RUNTIME_ORDER = ["lightning", "keynote", "standard", "workshopShort", "workshopFull"];

export const DEFAULT_RUNTIME = "lightning";

/** Human length for a runtime: 30m, 90m, 3h, 2h 30m. */
export const formatRuntimeLength = (minutes) => {
  if (minutes < 120) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** Old ids kept working so saved state and old links do not break. */
const RUNTIME_ALIASES = { workshop: "workshopFull" };

export const getRuntime = (id) =>
  RUNTIMES[RUNTIME_ALIASES[id] ?? id] ?? RUNTIMES[DEFAULT_RUNTIME];

/**
 * Does `slide` belong in `runtime` on its own merits (ignoring flex zones and
 * live drops)? Exported so tests and the presenter UI can ask the same
 * question the selector does, instead of re-deriving the rules.
 */
export const includedAt = (slide, runtime) => {
  const rt = typeof runtime === "string" ? getRuntime(runtime) : runtime;
  if ((slide.tier ?? TIER.CORE) > rt.maxTier) return false;
  // Altitude is opt-in: an altitude runtime takes only slides that declare it.
  if (rt.altitude && slide.altitude !== rt.altitude) return false;
  // Labs follow their track. The short workshop runs only short-track labs.
  if (slide.tier === TIER.LAB && rt.labTrack === LAB_TRACK.SHORT) {
    return slide.labTrack === LAB_TRACK.SHORT;
  }
  return true;
};

/**
 * Select the slides to present.
 *
 * @param {Array}  slides            the deck's full slide list
 * @param {object} opts
 * @param {string} opts.runtime      RUNTIMES id
 * @param {string[]} opts.openZones  flex zone ids pulled in on top of the runtime
 * @param {string[]} opts.dropped    slide ids the speaker killed live
 */
export const selectSlides = (slides, { runtime, openZones = [], dropped = [] } = {}) => {
  const rt = getRuntime(runtime);
  const open = new Set(openZones);
  const cut = new Set(dropped);

  return slides.filter((s) => {
    if (cut.has(s.id)) return false;
    // A flex slide arrives if its zone was opened live, or if the runtime would
    // have included it anyway. A flex slide with no tier is purely opt-in.
    if (s.flex) return open.has(s.zone) || (s.tier !== undefined && includedAt(s, rt));
    return includedAt(s, rt);
  });
};

/** Flex zones present in a deck, with their slide counts and budgets. */
export const getFlexZones = (slides) => {
  const zones = new Map();
  for (const s of slides) {
    if (!s.flex || !s.zone) continue;
    if (!zones.has(s.zone)) {
      zones.set(s.zone, {
        id: s.zone,
        label: s.zoneLabel ?? s.zone,
        slides: [],
        seconds: 0,
      });
    }
    const z = zones.get(s.zone);
    z.slides.push(s);
    z.seconds += s.budget ?? DEFAULT_BUDGET[s.tier ?? TIER.CORE] ?? 60;
  }
  return [...zones.values()];
};

/** Fallback seconds-per-slide when a slide does not set its own budget. */
const DEFAULT_BUDGET = {
  [TIER.CORE]: 75,
  [TIER.EXTENDED]: 60,
  [TIER.DEEP]: 60,
  [TIER.LAB]: 300,
};

export const slideBudget = (slide) =>
  slide.budget ?? DEFAULT_BUDGET[slide.tier ?? TIER.CORE] ?? 60;

/**
 * Cumulative pacing marks: the elapsed second by which each slide SHOULD be
 * finished, given the selected slides. The presenter HUD compares this against
 * the real clock so drift is visible before it becomes a problem.
 */
export const pacingMarks = (selected) => {
  let acc = 0;
  return selected.map((s) => {
    acc += slideBudget(s);
    return { id: s.id, endsAt: acc };
  });
};

/**
 * Where the speaker stands relative to plan.
 *
 * @returns {{driftSeconds:number, status:"ahead"|"on"|"behind", plannedSeconds:number, totalSeconds:number}}
 *   driftSeconds is positive when running LONG.
 */
export const pacingStatus = (selected, currentIndex, elapsedSeconds) => {
  const marks = pacingMarks(selected);
  const totalSeconds = marks.length ? marks[marks.length - 1].endsAt : 0;
  // Planned position = the time you should be at, entering the current slide.
  const plannedSeconds = currentIndex > 0 ? marks[currentIndex - 1].endsAt : 0;
  const driftSeconds = Math.round(elapsedSeconds - plannedSeconds);
  const tolerance = 45;
  const status = driftSeconds > tolerance ? "behind" : driftSeconds < -tolerance ? "ahead" : "on";
  return { driftSeconds, status, plannedSeconds, totalSeconds };
};

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

/** Signed drift for display: "+1:20" running long, "-0:45" running short. */
export const formatDrift = (driftSeconds) => {
  const sign = driftSeconds >= 0 ? "+" : "-";
  return `${sign}${formatClock(Math.abs(driftSeconds))}`;
};
