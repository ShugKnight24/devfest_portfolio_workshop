/**
 * Elastic Deck Runtime
 *
 * The old model was nine hand-maintained decks (nomad, ripcord, iron, combined,
 * lightning, workshop, lhm, devfest, pride). Every edit to the thesis had to be
 * made in five places, the "full" deck was too long to give, and the "condensed"
 * one had the spine cut out of it. Both failure modes came from the same cause:
 * length was baked into the content.
 *
 * Here length is a VIEW over one deck. Every slide declares a tier:
 *
 *   TIER.CORE     the argument does not survive without it. Always shown.
 *   TIER.EXTENDED the evidence and the frameworks. Shown at 30 min and up.
 *   TIER.DEEP     full case studies and process detail. Keynote and workshop.
 *   TIER.LAB      hands-on exercises. Workshop only.
 *
 * A runtime picks a max tier; the deck contracts or expands around a spine that
 * never changes.
 *
 * FLEX ZONES
 * ----------
 * A slide can also declare `flex: true`. Flex slides sit in a named zone the
 * speaker can open on demand mid-talk — the case that motivated this: you kick
 * off an agent build live on stage, and you need somewhere to stand for however
 * long it actually takes. Two minutes or eleven, you are covered, and you are
 * not visibly stalling. `selectSlides` can pull a zone in without changing the
 * runtime, so the rest of the deck keeps its shape.
 */

export const TIER = {
  CORE: 1,
  EXTENDED: 2,
  DEEP: 3,
  LAB: 4,
};

export const RUNTIMES = {
  lightning: {
    id: "lightning",
    label: "Lightning",
    minutes: 15,
    maxTier: TIER.CORE,
    blurb: "Spine only. The argument, the live build, the close.",
  },
  standard: {
    id: "standard",
    label: "Standard",
    minutes: 30,
    maxTier: TIER.EXTENDED,
    blurb: "Spine plus the three frameworks and the evidence.",
  },
  keynote: {
    id: "keynote",
    label: "Keynote",
    minutes: 60,
    maxTier: TIER.DEEP,
    blurb: "Everything except the hands-on labs.",
  },
  workshop: {
    id: "workshop",
    label: "Workshop",
    minutes: 240,
    maxTier: TIER.LAB,
    blurb: "Full curriculum including labs. Michigan DevFest shape.",
  },
};

export const DEFAULT_RUNTIME = "lightning";

export const getRuntime = (id) => RUNTIMES[id] ?? RUNTIMES[DEFAULT_RUNTIME];

/**
 * Select the slides to present.
 *
 * @param {Array}  slides            the deck's full slide list
 * @param {object} opts
 * @param {string} opts.runtime      RUNTIMES id
 * @param {string[]} opts.openZones  flex zone ids pulled in on top of the tier
 * @param {string[]} opts.dropped    slide ids the speaker killed live
 */
export const selectSlides = (slides, { runtime, openZones = [], dropped = [] } = {}) => {
  const { maxTier } = getRuntime(runtime);
  const open = new Set(openZones);
  const cut = new Set(dropped);

  return slides.filter((s) => {
    if (cut.has(s.id)) return false;
    // A flex slide can arrive two ways: its zone was pulled open live, or the
    // runtime is long enough that it would have been included anyway. So the
    // frameworks are standing material at 15 min and default material at 60.
    // A flex slide with no tier at all is purely opt-in.
    if (s.flex) return open.has(s.zone) || (s.tier ?? Infinity) <= maxTier;
    return (s.tier ?? TIER.CORE) <= maxTier;
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
