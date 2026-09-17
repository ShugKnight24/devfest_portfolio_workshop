import { describe, it, expect } from "vitest";
import { getDeck, getAllDecks, getLiveDecks, getShelvedDecks, DEFAULT_DECK_ID } from "../data/slides";
import { speakingEvents } from "../data/eventsData";

describe("WorkshopSlides multi-deck registry", () => {
  it("should keep all nine decks reachable after the directory consolidation", () => {
    const all = getAllDecks();
    expect(all.length).toBe(9);
    const ids = all.map((d) => d.id);
    expect(ids).toContain("nomad");
    expect(ids).toContain("ripcord");
    expect(ids).toContain("iron");
    expect(ids).toContain("combined");
    // The original elastic spine is archived under its own id; the bare `lhm`
    // id is now an alias pointing at the deck that absorbed it.
    expect(ids).toContain("lhm-spine");
    expect(ids).not.toContain("lhm");
    expect(ids).toContain("lightning");
    expect(ids).toContain("workshop");
    expect(ids).toContain("devfest");
    expect(ids).toContain("pride");
  });

  it("should open on the combined trilogy deck by default", () => {
    expect(DEFAULT_DECK_ID).toBe("combined");
    expect(getDeck(undefined).meta.id).toBe("combined");
  });

  it("should surface only the two presentable decks as live, shelving the rest", () => {
    const live = getLiveDecks().map((d) => d.id).sort();
    expect(live).toEqual(["combined", "devfest"]);

    const shelved = getShelvedDecks().map((d) => d.id);
    expect(shelved).toHaveLength(7);
    // Every shelved deck must explain itself in the directory.
    for (const deck of getShelvedDecks()) {
      expect(deck.shelfReason).toBeTruthy();
    }
  });

  it("should load nomad deck (Variant 1) with Reacher deduction and comparison slides", () => {
    const nomad = getDeck("nomad");
    expect(nomad.meta.title).toContain("The 110th");
    expect(nomad.slides.length).toBe(5);

    const promptComp = nomad.slides.find((s) => s.id === "nomad-02");
    expect(promptComp.type).toBe("comparison");
    expect(promptComp.columns[0].tag).toContain("Civilian");
    expect(promptComp.columns[1].tag).toContain("Investigator");
  });

  it("should load ripcord deck (Variant 2) with Chainsaw Man velocity", () => {
    const ripcord = getDeck("ripcord");
    expect(ripcord.meta.title).toContain("Division 4");
    expect(ripcord.slides.length).toBe(6);

    const vibeSlide = ripcord.slides.find((s) => s.id === "ripcord-02");
    expect(vibeSlide.title).toContain("Momentum vs Contracts");
    expect(vibeSlide.columns[0].character).toContain("Denji");
  });

  it("should load iron deck (Variant 3) with progressive overload and strict form", () => {
    const iron = getDeck("iron");
    expect(iron.meta.title).toContain("The Iron");
    expect(iron.slides.length).toBe(5);

    const formSlide = iron.slides.find((s) => s.id === "iron-02");
    expect(formSlide.type).toBe("comparison");
    expect(formSlide.columns[0].tag).toContain("Ego Lifting");
    expect(formSlide.columns[1].tag).toContain("Isolation Sets");
  });

  it("should load the combined deck as the elastic keynote", () => {
    const combined = getDeck("combined");
    // Both halves of the title: pull the cord (Chainsaw Man), bring backup (Reacher).
    expect(combined.meta.title).toBe("Pull the Cord. Bring Backup.");
    expect(combined.meta.elastic).toBe(true);
    expect(combined.meta.defaultRuntime).toBe("lightning");

    const reacherSlide = combined.slides.find((s) => s.type === "reacher-intro");
    expect(reacherSlide).toBeDefined();
    expect(reacherSlide.traits.length).toBe(3);

    // The three live beats are the spine of the talk and must all be core tier.
    const liveBeats = combined.slides.filter((s) => s.type === "live-build");
    expect(liveBeats.map((s) => s.id)).toEqual(["the-ask", "launch-build", "payoff"]);
    for (const beat of liveBeats) expect(beat.tier).toBe(1);

    // Chesterton's Fence came across with the spine and stays core.
    const fence = combined.slides.find((s) => s.id === "chestertons-fence");
    expect(fence.tier).toBe(1);
  });

  it("should keep the character pairings that make the combined deck worth giving", () => {
    const combined = getDeck("combined");
    const pairs = combined.slides.filter((s) => s.id.startsWith("pair-")).map((s) => s.id);
    expect(pairs).toEqual([
      "pair-finlay-roscoe",
      "pair-reacher-neagley",
      "pair-denji-aki",
      "pair-power",
      "pair-odonnell-dixon",
      "pair-makima-kishibe",
    ]);
    // A pairing that does not state a rule is just a character tour.
    for (const slide of combined.slides.filter((s) => s.id.startsWith("pair-"))) {
      expect(slide.columns.length).toBe(2);
      expect(slide.description.length, `${slide.id} needs a lesson`).toBeGreaterThan(40);
    }
  });

  it("should fall back to the combined deck for unknown ids and keep legacy aliases working", () => {
    const fallback = getDeck("unknown-deck");
    expect(fallback.meta.id).toBe("combined");

    // `lhm` was the default before the spine was merged into `combined`, so
    // every printed link and QR code from before that has to land here.
    for (const alias of ["lhm", "unified", "keynote", "master", "reacher", "trilogy"]) {
      expect(getDeck(alias).meta.id, `alias "${alias}" drifted`).toBe("combined");
    }

    // The archived spine is still openable under its own id.
    expect(getDeck("lhm-spine").meta.title).toContain("The Reacher Protocol");

    const chainsaw = getDeck("chainsaw");
    expect(chainsaw.meta.id).toBe("ripcord");

    const lightningAlias = getDeck("lightning-talk");
    expect(lightningAlias.meta.id).toBe("lightning");

    const labsAlias = getDeck("labs");
    expect(labsAlias.meta.id).toBe("workshop");
  });

  it("should give every combined slide presenter notes, since the deck is given live", () => {
    const combined = getDeck("combined");
    for (const slide of combined.slides) {
      expect(combined.presenterNotes[slide.id], `missing notes for "${slide.id}"`).toBeTruthy();
    }
    // And no orphan notes for slides that were cut.
    const ids = new Set(combined.slides.map((s) => s.id));
    for (const noteId of Object.keys(combined.presenterNotes)) {
      expect(ids.has(noteId), `orphan note for "${noteId}"`).toBe(true);
    }
  });

  it("should keep the archived spine intact with its own presenter notes", () => {
    const spine = getDeck("lhm-spine");
    expect(spine.meta.shelf).toBe(true);
    for (const slide of spine.slides) {
      expect(spine.presenterNotes[slide.id], `missing notes for "${slide.id}"`).toBeTruthy();
    }
  });

  it("should load lightning strike deck (25 min) with sovereign agent arc", () => {
    const lightning = getDeck("lightning");
    expect(lightning.meta.title).toContain("Lightning Strike");
    expect(lightning.slides.length).toBe(6);
    const reacherSaidNothing = lightning.slides.find((s) => s.title.includes("Reacher Said Nothing"));
    expect(reacherSaidNothing).toBeDefined();
  });

  it("should load workshop deck with 4 interactive Audience of One stages", () => {
    const workshop = getDeck("workshop");
    expect(workshop.meta.title).toContain("Builder's Workshop Labs");
    expect(workshop.slides.length).toBe(4);
    const lab1 = workshop.slides.find((s) => s.type === "lab" && s.labNumber === "01");
    expect(lab1).toBeDefined();
    expect(lab1.title).toContain("Friction Audit");
  });

  it("should load devfest deck with hackathon velocity elements", () => {
    const devfest = getDeck("devfest");
    expect(devfest.meta.title).toContain("Hackathon Velocity");
    const launchSlide = devfest.slides.find((s) => s.type === "launch");
    expect(launchSlide).toBeDefined();
  });
});

describe("SpeakingEventsHub integration", () => {
  it("should have valid links matching the user's conference details", () => {
    const lhm = speakingEvents.find((e) => e.id === "lhm-2026");
    expect(lhm.url).toBe(
      "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/"
    );

    const devfest = speakingEvents.find((e) => e.id === "devfest-2026");
    expect(devfest.url).toBe(
      "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/"
    );
  });
});

describe("stage beats", () => {
  const combined = getDeck("combined");
  const beatSlides = combined.slides.filter((s) => s.beats?.length);

  it("should only use beat kinds the stage knows how to draw", () => {
    for (const slide of beatSlides) {
      for (const beat of slide.beats) {
        expect(["ripcord", "thread"], `${slide.id}`).toContain(beat.kind);
        expect(["hero", "compact"], `${slide.id}`).toContain(beat.variant);
        expect(beat.label, `${slide.id} beat needs a call to action`).toBeTruthy();
        if (beat.kind === "thread") {
          const max = beat.variant === "hero" ? 5 : 4;
          expect(beat.items.length, `${slide.id}`).toBeGreaterThanOrEqual(2);
          expect(beat.items.length, `${slide.id}`).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it("should open on a pull per title line: the cord, then backup", () => {
    const title = combined.slides[0];
    expect(title.title.split("\n")).toEqual(["Pull the Cord.", "Bring Backup."]);
    expect(title.beats.map((b) => b.kind)).toEqual(["ripcord", "thread"]);
  });

  it("should keep beats rare: the moments that matter, all in the lightning cut", () => {
    expect(beatSlides.length).toBeLessThanOrEqual(8);
    for (const slide of beatSlides) {
      expect(slide.tier, `${slide.id} beat would vanish from the short talk`).toBeLessThanOrEqual(2);
      expect(combined.presenterNotes[slide.id], `${slide.id} note should cue its beat`).toMatch(/BEAT|click/i);
    }
  });
});
