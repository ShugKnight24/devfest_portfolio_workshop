import { describe, it, expect } from "vitest";
import { getDeck, getAllDecks, getLiveDecks, getShelvedDecks } from "../data/slides";
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
    expect(ids).toContain("lhm");
    expect(ids).toContain("lightning");
    expect(ids).toContain("workshop");
    expect(ids).toContain("devfest");
    expect(ids).toContain("pride");
  });

  it("should surface only the two presentable decks as live, shelving the rest", () => {
    const live = getLiveDecks().map((d) => d.id).sort();
    expect(live).toEqual(["devfest", "lhm"]);

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

  it("should load combined deck (Trilogy Keynote) weaving all three lenses", () => {
    const combined = getDeck("combined");
    expect(combined.meta.title).toContain("The Trilogy");
    expect(combined.slides.length).toBe(14);
    expect(combined.slides.some((s) => s.id === "combined-speed-frameworks")).toBe(true);
    expect(combined.slides.some((s) => s.id === "combined-stage-tactics")).toBe(true);
  });

  it("should fall back to the lhm keynote for unknown ids and keep legacy aliases working", () => {
    const fallback = getDeck("unknown-deck");
    expect(fallback.meta.id).toBe("lhm");

    // These four used to resolve to the retired `combined` deck. The elastic
    // lhm deck covers that runtime now, so old links land somewhere correct.
    for (const alias of ["unified", "keynote", "master", "reacher"]) {
      expect(getDeck(alias).meta.id).toBe("lhm");
    }

    const chainsaw = getDeck("chainsaw");
    expect(chainsaw.meta.id).toBe("ripcord");

    const lightningAlias = getDeck("lightning-talk");
    expect(lightningAlias.meta.id).toBe("lightning");

    const labsAlias = getDeck("labs");
    expect(labsAlias.meta.id).toBe("workshop");
  });

  it("should load the lhm deck as the elastic keynote spine", () => {
    const lhm = getDeck("lhm");
    expect(lhm.meta.title).toContain("The Reacher Protocol");
    expect(lhm.meta.elastic).toBe(true);
    expect(lhm.meta.defaultRuntime).toBe("lightning");

    const reacherSlide = lhm.slides.find((s) => s.type === "reacher-intro");
    expect(reacherSlide).toBeDefined();
    expect(reacherSlide.traits.length).toBe(3);

    // The three live beats are the spine of the talk and must all be core tier.
    const liveBeats = lhm.slides.filter((s) => s.type === "live-build");
    expect(liveBeats.map((s) => s.id)).toEqual(["the-ask", "launch-build", "payoff"]);
    for (const beat of liveBeats) expect(beat.tier).toBe(1);
  });

  it("should give every lhm slide presenter notes, since the deck is given live", () => {
    const lhm = getDeck("lhm");
    for (const slide of lhm.slides) {
      expect(lhm.presenterNotes[slide.id], `missing notes for "${slide.id}"`).toBeTruthy();
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
