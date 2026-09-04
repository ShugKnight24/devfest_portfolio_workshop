import { lhmDeckMeta, lhmSlides, lhmPresenterNotes } from "./lhmSlides";
import { lightningDeckMeta, lightningSlides, lightningPresenterNotes } from "./lightningSlides";
import { workshopDeckMeta, workshopSlides, workshopPresenterNotes } from "./workshopSlides";
import { devfestDeckMeta, devfestSlides, devfestPresenterNotes } from "./devfestSlides";
import { prideDeckMeta, prideSlides, pridePresenterNotes } from "./prideSlides";

export const decks = {
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

export const DEFAULT_DECK_ID = "lhm";

export const getDeck = (deckId) => {
  if (deckId === "keynote" || deckId === "master") {
    return decks.lhm;
  }
  if (!deckId || !decks[deckId]) {
    return decks[DEFAULT_DECK_ID];
  }
  return decks[deckId];
};

export const getAllDecks = () =>
  Object.values(decks).map((d) => d.meta);
