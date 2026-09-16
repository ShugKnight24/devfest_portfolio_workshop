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
 *   combined — THE talk. "The Trilogy Ensemble". Elastic: 15 / 30 / 60 min off
 *              one spine (see runtime.js), built around the character pairings.
 *   devfest  — the Michigan DevFest workshop, which builds on that spine.
 *
 * WHY `combined` AND NOT `lhm`
 * ---------------------------
 * The pairing structure — two habits held against each other until the rule
 * between them is obvious — is the thing that actually teaches, and it only
 * ever existed in `combined`. That deck was shelved for lacking the elastic
 * spine (tiers, the flex zone, the live-build beats, Chesterton's Fence), which
 * was a reason to merge the spine into it, not to retire it. It now carries
 * both, so `lhm` has nothing left that `combined` does not have.
 *
 * `lhm` is therefore an ALIAS onto `combined`: every old link, QR code and
 * bookmark lands on the deck that superseded it. The original spine is kept
 * verbatim under `lhm-spine` so the directory can still open it.
 *
 * Everything else is still here and still reachable — the framework decks hold
 * good material and `pride` is a real archive — but they are marked `shelf` so
 * the directory groups them below the fold instead of making you choose from
 * nine equal-looking options with the lights in your eyes.
 */

const shelve = (meta, reason) => ({ ...meta, shelf: true, shelfReason: reason });

export const decks = {
  // ── Live decks ──────────────────────────────────────────────────────────
  combined: {
    meta: combinedDeckMeta,
    slides: combinedSlides,
    presenterNotes: combinedPresenterNotes,
  },
  devfest: {
    meta: devfestDeckMeta,
    slides: devfestSlides,
    presenterNotes: devfestPresenterNotes,
  },

  // ── Shelved: source material, folded into the combined tiers ────────────
  "lhm-spine": {
    meta: shelve(
      lhmDeckMeta,
      "The original elastic spine. Merged into the combined deck, which adds the character pairings."
    ),
    slides: lhmSlides,
    presenterNotes: lhmPresenterNotes,
  },
  lightning: {
    meta: shelve(lightningDeckMeta, "Superseded by the combined deck at lightning runtime."),
    slides: lightningSlides,
    presenterNotes: lightningPresenterNotes,
  },
  nomad: {
    meta: shelve(nomadDeckMeta, "Framework 01 — now the Reacher half of the pairings in combined."),
    slides: nomadSlides,
    presenterNotes: nomadPresenterNotes,
  },
  ripcord: {
    meta: shelve(ripcordDeckMeta, "Framework 02 — now the Division 4 half of the pairings in combined."),
    slides: ripcordSlides,
    presenterNotes: ripcordPresenterNotes,
  },
  iron: {
    meta: shelve(ironDeckMeta, "Framework 03 — now the form-check material in combined."),
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

export const DEFAULT_DECK_ID = "combined";

/** Legacy and convenience ids kept working so old links and muscle memory do not break. */
const ALIASES = {
  // `lhm` was the default until the spine was merged into `combined`. Every
  // printed link and QR code from before that still resolves here.
  lhm: "combined",
  unified: "combined",
  keynote: "combined",
  master: "combined",
  reacher: "combined",
  trilogy: "combined",
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
