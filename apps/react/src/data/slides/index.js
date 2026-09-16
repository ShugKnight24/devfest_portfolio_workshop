import { nomadDeckMeta, nomadSlides, nomadPresenterNotes } from "./nomadSlides";
import { ripcordDeckMeta, ripcordSlides, ripcordPresenterNotes } from "./ripcordSlides";
import { ironDeckMeta, ironSlides, ironPresenterNotes } from "./ironSlides";
import { combinedDeckMeta, combinedSlides, combinedPresenterNotes } from "./combinedSlides";
import { lhmDeckMeta, lhmSlides, lhmPresenterNotes } from "./lhmSlides";
import { lightningDeckMeta, lightningSlides, lightningPresenterNotes } from "./lightningSlides";
import { workshopDeckMeta, workshopSlides, workshopPresenterNotes } from "./workshopSlides";
import { devfestDeckMeta, devfestSlides, devfestPresenterNotes } from "./devfestSlides";
import { prideDeckMeta, prideSlides, pridePresenterNotes } from "./prideSlides";

/**
 * Deck registry.
 *
 * There used to be nine co-equal decks in this menu, which meant that finding
 * the right one on stage was a reading exercise. There are now two decks you
 * would actually stand up and give:
 *
 *   lhm      — THE talk. Elastic: 15 / 30 / 60 min off one spine (see runtime.js).
 *   devfest  — the Michigan DevFest workshop, which builds on that spine.
 *
 * Everything else is still here and still reachable — the framework decks hold
 * good material and `pride` is a real archive — but they are marked `shelf` so
 * the directory groups them below the fold instead of making you choose from
 * nine equal-looking options with the lights in your eyes.
 */

const shelve = (meta, reason) => ({ ...meta, shelf: true, shelfReason: reason });

export const decks = {
  // ── Live decks ──────────────────────────────────────────────────────────
  lhm: {
    meta: lhmDeckMeta,
    slides: lhmSlides,
    presenterNotes: lhmPresenterNotes,
  },
  devfest: {
    meta: devfestDeckMeta,
    slides: devfestSlides,
    presenterNotes: devfestPresenterNotes,
  },

  // ── Shelved: source material, folded into the lhm tiers ─────────────────
  combined: {
    meta: shelve(combinedDeckMeta, "Superseded by the elastic lhm deck at keynote runtime."),
    slides: combinedSlides,
    presenterNotes: combinedPresenterNotes,
  },
  lightning: {
    meta: shelve(lightningDeckMeta, "Superseded by the elastic lhm deck at lightning runtime."),
    slides: lightningSlides,
    presenterNotes: lightningPresenterNotes,
  },
  nomad: {
    meta: shelve(nomadDeckMeta, "Framework 01 — now a flex-zone slide in lhm."),
    slides: nomadSlides,
    presenterNotes: nomadPresenterNotes,
  },
  ripcord: {
    meta: shelve(ripcordDeckMeta, "Framework 02 — now a flex-zone slide in lhm."),
    slides: ripcordSlides,
    presenterNotes: ripcordPresenterNotes,
  },
  iron: {
    meta: shelve(ironDeckMeta, "Framework 03 — now a flex-zone slide in lhm."),
    slides: ironSlides,
    presenterNotes: ironPresenterNotes,
  },
  workshop: {
    meta: shelve(workshopDeckMeta, "Lab material — folded into the devfest workshop deck."),
    slides: workshopSlides,
    presenterNotes: workshopPresenterNotes,
  },

  // ── Archive ─────────────────────────────────────────────────────────────
  pride: {
    meta: shelve(prideDeckMeta, "Delivered June 2026. Kept as an archive."),
    slides: prideSlides,
    presenterNotes: pridePresenterNotes,
  },
};

export const DEFAULT_DECK_ID = "lhm";

/** Legacy and convenience ids kept working so old links and muscle memory do not break. */
const ALIASES = {
  unified: "lhm",
  keynote: "lhm",
  master: "lhm",
  reacher: "lhm",
  "lightning-talk": "lightning",
  chainsaw: "ripcord",
  labs: "workshop",
};

export const getDeck = (deckId) => {
  const resolved = ALIASES[deckId] ?? deckId;
  return decks[resolved] ?? decks[DEFAULT_DECK_ID];
};

export const getAllDecks = () =>
  Object.values(decks).map((d) => ({
    ...d.meta,
    slideCount: d.slides ? d.slides.length : 0,
  }));

/** The two decks you would actually present, in the order they happen. */
export const getLiveDecks = () => getAllDecks().filter((d) => !d.shelf);

/** Source material and archives, grouped below the fold in the directory. */
export const getShelvedDecks = () => getAllDecks().filter((d) => d.shelf);
