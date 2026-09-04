import { describe, it, expect } from "vitest";
import { getDeck, getAllDecks } from "../data/slides";
import { speakingEvents } from "../data/eventsData";

describe("WorkshopSlides multi-deck registry", () => {
  it("should have all registered decks: lhm, lightning, workshop, devfest, pride", () => {
    const all = getAllDecks();
    expect(all.length).toBe(5);
    const ids = all.map((d) => d.id);
    expect(ids).toContain("lhm");
    expect(ids).toContain("lightning");
    expect(ids).toContain("workshop");
    expect(ids).toContain("devfest");
    expect(ids).toContain("pride");
  });

  it("should load lhm deck by default with Reacher narrative elements", () => {
    const lhm = getDeck("lhm");
    expect(lhm.meta.title).toContain("The Reacher Protocol");
    expect(lhm.slides.length).toBeGreaterThanOrEqual(8);

    // Verify Reacher traits & quote elements exist
    const reacherSlide = lhm.slides.find((s) => s.type === "reacher-intro");
    expect(reacherSlide).toBeDefined();
    expect(reacherSlide.traits.length).toBe(3);

    // Verify Beyond the Portfolio paradigm shift exists
    const paradigmSlide = lhm.slides.find((s) => s.type === "paradigm");
    expect(paradigmSlide).toBeDefined();
    expect(paradigmSlide.title).toContain("Beyond the Portfolio");

    // Verify Zero Bloat & System Warning slides
    const zeroBloatSlide = lhm.slides.find((s) => s.type === "zero-bloat");
    expect(zeroBloatSlide).toBeDefined();

    const warningSlide = lhm.slides.find((s) => s.type === "system-warning");
    expect(warningSlide).toBeDefined();
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

  it("should fallback to lhm if invalid deck is requested or alias is used", () => {
    const fallback = getDeck("unknown-deck");
    expect(fallback.meta.id).toBe("lhm");

    const keynote = getDeck("keynote");
    expect(keynote.meta.id).toBe("lhm");
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
