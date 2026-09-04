import { nomadDeckMeta, nomadSlides, nomadPresenterNotes } from "./nomadSlides";
import { ripcordDeckMeta, ripcordSlides, ripcordPresenterNotes } from "./ripcordSlides";
import { ironDeckMeta, ironSlides, ironPresenterNotes } from "./ironSlides";
import { combinedDeckMeta, combinedSlides, combinedPresenterNotes } from "./combinedSlides";
import { lhmDeckMeta, lhmSlides, lhmPresenterNotes } from "./lhmSlides";
import { lightningDeckMeta, lightningSlides, lightningPresenterNotes } from "./lightningSlides";
import { workshopDeckMeta, workshopSlides, workshopPresenterNotes } from "./workshopSlides";
import { devfestDeckMeta, devfestSlides, devfestPresenterNotes } from "./devfestSlides";
import { prideDeckMeta, prideSlides, pridePresenterNotes } from "./prideSlides";

export const decks = {
  nomad: {
    meta: nomadDeckMeta,
    slides: nomadSlides,
    presenterNotes: nomadPresenterNotes,
  },
  ripcord: {
    meta: ripcordDeckMeta,
    slides: ripcordSlides,
    presenterNotes: ripcordPresenterNotes,
  },
  iron: {
    meta: ironDeckMeta,
    slides: ironSlides,
    presenterNotes: ironPresenterNotes,
  },
  combined: {
    meta: combinedDeckMeta,
    slides: combinedSlides,
    presenterNotes: combinedPresenterNotes,
  },
  lhm: {
    meta: lhmDeckMeta,
    slides: lhmSlides,
    presenterNotes: lhmPresenterNotes,
  },
  lightning: {
    meta: lightningDeckMeta,
    slides: lightningSlides,
    presenterNotes: lightningPresenterNotes,
  },
  workshop: {
    meta: workshopDeckMeta,
    slides: workshopSlides,
    presenterNotes: workshopPresenterNotes,
  },
  devfest: {
    meta: devfestDeckMeta,
    slides: devfestSlides,
    presenterNotes: devfestPresenterNotes,
  },
  pride: {
    meta: prideDeckMeta,
    slides: prideSlides,
    presenterNotes: pridePresenterNotes,
  },
};

export const DEFAULT_DECK_ID = "nomad";

export const getDeck = (deckId) => {
  if (deckId === "keynote" || deckId === "master") {
    return decks.combined;
  }
  if (deckId === "reacher") {
    return decks.nomad;
  }
  if (deckId === "chainsaw") {
    return decks.ripcord;
  }
  if (!deckId || !decks[deckId]) {
    return decks[DEFAULT_DECK_ID];
  }
  return decks[deckId];
};

export const getAllDecks = () =>
  Object.values(decks).map((d) => d.meta);
