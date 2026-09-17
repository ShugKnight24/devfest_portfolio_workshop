/**
 * Navigation Registry — one source of truth for every route in the app.
 *
 * The problem this solves: 22 routes behind 4 dropdowns meant the nav was a
 * filing cabinet. You cannot find a route on stage under pressure, and an
 * attendee cannot tell which of 22 links is the one they are supposed to open.
 *
 * The fix is context, not deletion. Every route declares which MODES it belongs
 * to. The nav renders only the current mode's routes; the command palette
 * (Cmd+K) always reaches all of them. Nothing is lost, most is just quiet.
 *
 *   stage    — what the speaker touches live, in front of a room. Kept tiny.
 *   workshop — the attendee's guided path, in the order they walk it.
 *   explore  — everything, for people poking around after the talk.
 */

export const MODES = {
  stage: {
    id: "stage",
    label: "Stage",
    kicker: "Presenting",
    description: "Live-talk surface. Only what you drive in front of a room.",
  },
  workshop: {
    id: "workshop",
    label: "Workshop",
    kicker: "Building",
    description: "The guided attendee path, in the order you walk it.",
  },
  explore: {
    id: "explore",
    label: "Explore",
    kicker: "Everything",
    description: "Full surface area. Every route, every sandbox.",
  },
};

export const DEFAULT_MODE = "workshop";

/**
 * Route registry.
 *
 * `modes`     — which shells surface this route in their visible nav.
 * `section`   — grouping label, used by the palette and the explore mode.
 * `step`      — position in the workshop spine. Only workshop routes carry it.
 * `keywords`  — extra search terms for the palette so "deck" finds /slides.
 * `primary`   — pinned into the mode's top-level bar rather than a group.
 */
export const routes = [
  // ---- Stage ----
  {
    to: "/slides",
    label: "Slides",
    desc: "The elastic deck. Lightning to keynote on one spine.",
    section: "Present",
    modes: ["stage", "workshop", "explore"],
    primary: ["stage", "workshop"],
    keywords: ["deck", "present", "talk", "keynote", "reacher", "lhm", "devfest"],
  },
  {
    to: "/builder",
    label: "Portfolio Builder",
    desc: "The live-build surface. This is the demo.",
    section: "Build",
    modes: ["stage", "workshop", "explore"],
    primary: ["stage"],
    step: 2,
    keywords: ["build", "editor", "live", "demo", "portfolio"],
  },
  {
    to: "/operatives",
    label: "Operatives",
    desc: "Audience-of-One agents. Bespoke personal tooling.",
    section: "Present",
    modes: ["stage", "explore"],
    primary: ["stage"],
    keywords: ["agent", "sandbox", "audience of one", "sovereign", "macro"],
  },
  {
    to: "/agentic-studio",
    label: "Agentic Studio",
    desc: "Prompt workspace. Four audience tiers, POC generator.",
    section: "Present",
    modes: ["stage", "explore"],
    primary: ["stage"],
    keywords: ["prompt", "studio", "ai", "agentic", "poc", "generator"],
  },
  {
    to: "/demo",
    label: "Demo",
    desc: "The pre-built example to walk through.",
    section: "Present",
    modes: ["stage", "explore"],
    keywords: ["example", "finished", "preview", "walkthrough"],
  },

  // ---- Workshop spine (ordered) ----
  {
    to: "/",
    label: "Home",
    desc: "Track selector and starting line.",
    section: "Reference",
    modes: ["stage", "workshop", "explore"],
    primary: ["stage", "workshop", "explore"],
    brand: true,
    step: 0,
    keywords: ["home", "start", "landing", "index"],
  },
  {
    to: "/guide",
    label: "Guide",
    desc: "Step-by-step setup. Start here if you are stuck.",
    section: "Learn",
    modes: ["workshop", "explore"],
    primary: ["workshop"],
    step: 1,
    keywords: ["setup", "install", "getting started", "instructions", "guide"],
  },
  {
    to: "/lessons",
    label: "Lessons",
    desc: "Five tracks: React, Vanilla, Vue, Svelte, Agentic.",
    section: "Learn",
    modes: ["workshop", "explore"],
    primary: ["workshop"],
    step: 3,
    keywords: ["learn", "track", "react", "vue", "svelte", "vanilla", "tutorial"],
  },
  {
    to: "/components",
    label: "Components",
    desc: "Variant library. Swap a section, see it live.",
    section: "Build",
    modes: ["workshop", "explore"],
    step: 4,
    keywords: ["variant", "library", "ui", "blocks", "sections"],
  },
  {
    to: "/challenges",
    label: "Challenges",
    desc: "Timed quests to lock the muscle memory in.",
    section: "Learn",
    modes: ["workshop", "explore"],
    step: 5,
    keywords: ["quest", "exercise", "practice", "timed"],
  },
  {
    to: "/whats-next",
    label: "What's Next",
    desc: "Ship it. Deploy, share, keep going.",
    section: "Progress",
    modes: ["workshop", "explore"],
    primary: ["workshop"],
    step: 6,
    keywords: ["deploy", "ship", "vercel", "next steps", "production"],
  },

  // ---- Reference ----
  {
    to: "/resources",
    label: "Resources",
    desc: "Curated tools, links, cheat sheets.",
    section: "Reference",
    modes: ["workshop", "explore"],
    keywords: ["links", "tools", "cheatsheet", "reading"],
  },
  {
    to: "/help",
    label: "Help & FAQ",
    desc: "Common breakages and their fixes.",
    section: "Reference",
    modes: ["workshop", "explore"],
    primary: ["workshop"],
    keywords: ["faq", "troubleshoot", "broken", "error", "stuck", "fix"],
  },
  {
    to: "/events",
    label: "Events",
    desc: "LHM Summit, Michigan DevFest, past talks.",
    section: "Present",
    modes: ["stage", "explore"],
    keywords: ["conference", "speaking", "talk", "devfest", "lhm", "summit"],
  },
  {
    to: "/showcase",
    label: "Showcase",
    desc: "Portfolios other people built here.",
    section: "Build",
    modes: ["explore"],
    keywords: ["gallery", "community", "inspiration", "examples"],
  },

  // ---- Progress ----
  {
    to: "/dashboard",
    label: "Dashboard",
    desc: "Your progress across the workshop.",
    section: "Progress",
    modes: ["workshop", "explore"],
    keywords: ["progress", "stats", "metrics", "tracker"],
  },
  {
    to: "/achievements",
    label: "Achievements",
    desc: "Badges earned along the way.",
    section: "Progress",
    modes: ["explore"],
    keywords: ["badge", "unlock", "reward", "trophy"],
  },
  {
    to: "/quiz",
    label: "Quiz",
    desc: "Check what actually stuck.",
    section: "Learn",
    modes: ["workshop", "explore"],
    keywords: ["test", "knowledge", "question", "check"],
  },
  {
    to: "/dashboard/telemetry",
    label: "Telemetry",
    desc: "Traffic and bot-isolation telemetry.",
    section: "Progress",
    modes: ["explore"],
    keywords: ["analytics", "traffic", "telemetry", "data"],
  },
];

/**
 * Group any route list by `section`, in the order the sections first appear.
 *
 * One helper, three callers: the app menu overlay, the palette's result list,
 * and the legacy per-mode grouping below. Grouping logic living in three places
 * was how the sections drifted apart in the first place.
 */
export const groupBySection = (list) => {
  const order = [];
  const bySection = new Map();
  for (const route of list) {
    if (!bySection.has(route.section)) {
      bySection.set(route.section, []);
      order.push(route.section);
    }
    bySection.get(route.section).push(route);
  }
  return order.map((section) => ({ section, items: bySection.get(section) }));
};

/**
 * Every route, grouped by section.
 *
 * The app's own menu overlay renders this — all of it, always. The overlay is
 * the one place where "everything the app can do" is the answer, so it does not
 * filter by mode: a menu button that yields different contents depending on
 * hidden state is the inconsistency this nav was rebuilt to remove.
 */
export const groupedRoutes = () => groupBySection(routes);

/**
 * Section order for the top bar. The bar shows these headings, each revealing
 * its routes, so structure is visible instead of hidden behind one menu button.
 */
export const SECTION_ORDER = ["Present", "Build", "Learn", "Reference", "Progress"];

/** Sections in bar order, excluding the brand route. */
export const barSections = () => {
  const bySection = new Map();
  for (const route of routes) {
    if (route.brand) continue;
    if (!bySection.has(route.section)) bySection.set(route.section, []);
    bySection.get(route.section).push(route);
  }
  return SECTION_ORDER.filter((name) => bySection.has(name)).map((name) => ({
    section: name,
    items: bySection.get(name),
  }));
};

export const brandRoute = () => routes.find((r) => r.brand) ?? routes[0];

/** Routes whose visible nav entry belongs to `mode`. */
export const routesForMode = (mode) =>
  routes.filter((r) => r.modes.includes(mode));

/** Top-level bar entries for `mode`, in registry order. */
export const primaryRoutesForMode = (mode) =>
  routes.filter((r) => r.primary?.includes(mode));

/** Non-primary entries for `mode`, grouped by section, for the overflow menu. */
export const groupedRoutesForMode = (mode) =>
  groupBySection(routesForMode(mode).filter((r) => !r.primary?.includes(mode)));

/** The ordered workshop spine, for Next/Back stepping. */
export const workshopSpine = routes
  .filter((r) => typeof r.step === "number")
  .sort((a, b) => a.step - b.step);

/** Neighbours in the spine, or nulls when the route is not on it. */
export const spineNeighbors = (pathname) => {
  const i = workshopSpine.findIndex((r) => r.to === pathname);
  if (i === -1) return { prev: null, next: null, index: -1, total: workshopSpine.length };
  return {
    prev: i > 0 ? workshopSpine[i - 1] : null,
    next: i < workshopSpine.length - 1 ? workshopSpine[i + 1] : null,
    index: i,
    total: workshopSpine.length,
  };
};

/**
 * Palette search. Scores label > keyword > description so typing "dep" ranks
 * "What's Next" (keyword: deploy) above a description that merely says "deploy".
 */
export const searchRoutes = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return routes;
  const scored = [];
  for (const r of routes) {
    const label = r.label.toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (r.keywords?.some((k) => k.startsWith(q))) score = 45;
    else if (r.keywords?.some((k) => k.includes(q))) score = 30;
    else if (r.desc.toLowerCase().includes(q)) score = 15;
    else if (r.to.toLowerCase().includes(q)) score = 10;
    if (score > 0) scored.push({ route: r, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.route);
};
