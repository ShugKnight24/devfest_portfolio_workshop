import { describe, it, expect } from "vitest";
import { getDeck, getAllDecks } from "../data/slides";
import { speakingEvents } from "../data/eventsData";

describe("WorkshopSlides multi-deck registry", () => {
  it("should have all registered decks: nomad, ripcord, iron, combined, lhm, lightning, workshop, devfest, pride", () => {
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
    expect(combined.slides.length).toBe(12);
  });

  it("should fallback to nomad if invalid deck is requested and support aliases", () => {
    const fallback = getDeck("unknown-deck");
    expect(fallback.meta.id).toBe("nomad");

    const keynote = getDeck("keynote");
    expect(keynote.meta.id).toBe("combined");

    const master = getDeck("master");
    expect(master.meta.id).toBe("combined");

    const reacher = getDeck("reacher");
    expect(reacher.meta.id).toBe("nomad");

    const chainsaw = getDeck("chainsaw");
    expect(chainsaw.meta.id).toBe("ripcord");
  });

  it("should load lhm deck with legacy Reacher narrative elements", () => {
    const lhm = getDeck("lhm");
    expect(lhm.meta.title).toContain("The Reacher Protocol");
    expect(lhm.slides.length).toBeGreaterThanOrEqual(8);

    const reacherSlide = lhm.slides.find((s) => s.type === "reacher-intro");
    expect(reacherSlide).toBeDefined();
    expect(reacherSlide.traits.length).toBe(3);
  });

  it("should load lightning strike deck (15 min) with rapid-fire slides", () => {
    const lightning = getDeck("lightning");
    expect(lightning.meta.title).toContain("Lightning Strike");
    expect(lightning.slides.length).toBe(4);
    const reacherSaidNothing = lightning.slides.find((s) => s.title.includes("Reacher Said Nothing"));
    expect(reacherSaidNothing).toBeDefined();
  });

  it("should load workshop deck with 4 interactive labs", () => {
    const workshop = getDeck("workshop");
    expect(workshop.meta.title).toContain("Builder's Workshop Labs");
    expect(workshop.slides.length).toBe(4);
    const lab1 = workshop.slides.find((s) => s.type === "lab" && s.labNumber === "01");
    expect(lab1).toBeDefined();
    expect(lab1.title).toContain("Clone the Sandbox");
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
