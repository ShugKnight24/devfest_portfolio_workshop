import { describe, it, expect } from "vitest";
import { speakingEvents, getEventById, getUpcomingEvents } from "./eventsData";

describe("speakingEvents data", () => {
  it("should contain the required conferences", () => {
    expect(speakingEvents.length).toBeGreaterThanOrEqual(3);
    const ids = speakingEvents.map((e) => e.id);
    expect(ids).toContain("lhm-2026");
    expect(ids).toContain("devfest-2026");
    expect(ids).toContain("pride-2026");
  });

  it("should have correct links and metadata for LHM Summit 2026", () => {
    const lhm = getEventById("lhm-2026");
    expect(lhm).toBeDefined();
    expect(lhm.date).toBe("September 19, 2026");
    expect(lhm.url).toContain("detroit-latin-heritage-month-innovation-summit");
    expect(lhm.slideDeckRoute).toBe("/slides/lhm");
    expect(lhm.status).toBe("upcoming");
  });

  it("should have correct links and metadata for Michigan DevFest 2026", () => {
    const devfest = getEventById("devfest-2026");
    expect(devfest).toBeDefined();
    expect(devfest.date).toBe("November 2026");
    expect(devfest.url).toContain("michigan-devfest-ai-hackathon-2026");
    expect(devfest.slideDeckRoute).toBe("/slides/devfest");
    expect(devfest.status).toBe("upcoming");
  });

  it("should filter upcoming events properly", () => {
    const upcoming = getUpcomingEvents();
    expect(upcoming.length).toBe(2);
    expect(upcoming.every((e) => e.status === "upcoming")).toBe(true);
  });
});
