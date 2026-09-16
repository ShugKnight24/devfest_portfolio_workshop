import { describe, it, expect } from "vitest";
import {
  TIER,
  RUNTIMES,
  getRuntime,
  selectSlides,
  getFlexZones,
  slideBudget,
  pacingMarks,
  pacingStatus,
  formatClock,
  formatDrift,
} from "./runtime";
import { lhmSlides } from "./lhmSlides";

describe("elastic runtime selection", () => {
  it("should keep only core slides at lightning runtime", () => {
    const picked = selectSlides(lhmSlides, { runtime: "lightning" });
    expect(picked.every((s) => s.tier === TIER.CORE && !s.flex)).toBe(true);
    // The spine has to survive the shortest runtime intact.
    const ids = picked.map((s) => s.id);
    expect(ids).toContain("title");
    expect(ids).toContain("the-ask");
    expect(ids).toContain("launch-build");
    expect(ids).toContain("payoff");
    expect(ids).toContain("close");
  });

  it("should expand monotonically as the runtime grows", () => {
    const counts = ["lightning", "standard", "keynote", "workshop"].map(
      (runtime) => selectSlides(lhmSlides, { runtime }).length
    );
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[0]).toBeLessThan(counts[counts.length - 1]);
  });

  it("should never drop a core slide at any runtime", () => {
    const coreIds = lhmSlides.filter((s) => s.tier === TIER.CORE && !s.flex).map((s) => s.id);
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = selectSlides(lhmSlides, { runtime }).map((s) => s.id);
      for (const id of coreIds) expect(ids, `${id} dropped at ${runtime}`).toContain(id);
    }
  });

  it("should pull a flex zone in on demand without changing the runtime", () => {
    const base = selectSlides(lhmSlides, { runtime: "lightning" });
    const opened = selectSlides(lhmSlides, {
      runtime: "lightning",
      openZones: ["while-it-builds"],
    });
    expect(opened.length).toBeGreaterThan(base.length);
    // Opening a zone adds only that zone's slides — the spine keeps its shape.
    const added = opened.filter((s) => !base.some((b) => b.id === s.id));
    expect(added.every((s) => s.zone === "while-it-builds")).toBe(true);
  });

  it("should keep deck order when a zone is pulled in", () => {
    const opened = selectSlides(lhmSlides, {
      runtime: "lightning",
      openZones: ["while-it-builds"],
    });
    const deckOrder = lhmSlides.map((s) => s.id);
    const positions = opened.map((s) => deckOrder.indexOf(s.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("should include flex slides automatically once the runtime is long enough", () => {
    const standard = selectSlides(lhmSlides, { runtime: "standard" }).map((s) => s.id);
    expect(standard).toContain("framework-reacher");
    expect(standard).toContain("zero-bloat");
  });

  it("should honour slides dropped live", () => {
    const ids = selectSlides(lhmSlides, {
      runtime: "keynote",
      dropped: ["bio"],
    }).map((s) => s.id);
    expect(ids).not.toContain("bio");
  });

  it("should fall back to the default runtime for an unknown id", () => {
    expect(getRuntime("nope").id).toBe(RUNTIMES.lightning.id);
  });
});

describe("flex zones", () => {
  it("should report the while-it-builds zone with its slides and total budget", () => {
    const zones = getFlexZones(lhmSlides);
    const zone = zones.find((z) => z.id === "while-it-builds");
    expect(zone).toBeDefined();
    expect(zone.label).toBe("While It Builds");
    expect(zone.slides.length).toBeGreaterThanOrEqual(3);
    // The point of the zone is having real minutes of material to stand on.
    expect(zone.seconds).toBeGreaterThan(120);
    expect(zone.seconds).toBe(zone.slides.reduce((sum, s) => sum + slideBudget(s), 0));
  });
});

describe("pacing", () => {
  const selected = selectSlides(lhmSlides, { runtime: "lightning" });

  it("should produce strictly increasing cumulative marks", () => {
    const marks = pacingMarks(selected);
    expect(marks).toHaveLength(selected.length);
    for (let i = 1; i < marks.length; i += 1) {
      expect(marks[i].endsAt).toBeGreaterThan(marks[i - 1].endsAt);
    }
  });

  it("should report on-plan at the very start", () => {
    expect(pacingStatus(selected, 0, 0).status).toBe("on");
  });

  it("should report running long with positive drift", () => {
    const { status, driftSeconds } = pacingStatus(selected, 1, 600);
    expect(status).toBe("behind");
    expect(driftSeconds).toBeGreaterThan(0);
  });

  it("should report running short with negative drift", () => {
    const { status, driftSeconds } = pacingStatus(selected, 4, 5);
    expect(status).toBe("ahead");
    expect(driftSeconds).toBeLessThan(0);
  });

  it("should keep the lightning runtime near its 15 minute budget", () => {
    const { totalSeconds } = pacingStatus(selected, 0, 0);
    const minutes = totalSeconds / 60;
    expect(minutes).toBeGreaterThan(10);
    expect(minutes).toBeLessThanOrEqual(RUNTIMES.lightning.minutes + 2);
  });
});

describe("character roster material", () => {
  it("should land Chesterton's Fence inside the Deduce First beat at every runtime", () => {
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = selectSlides(lhmSlides, { runtime }).map((s) => s.id);
      const formula = ids.indexOf("reacher-formula");
      expect(ids[formula + 1], `fence moved at ${runtime}`).toBe("chestertons-fence");
    }
  });

  it("should keep both crew rosters as standing material in the flex zone", () => {
    const zone = getFlexZones(lhmSlides).find((z) => z.id === "while-it-builds");
    const ids = zone.slides.map((s) => s.id);
    expect(ids).toContain("roster-110th");
    expect(ids).toContain("roster-division-4");
    // Two extra rosters mean the zone can cover a genuinely slow build.
    expect(zone.seconds / 60).toBeGreaterThan(9);
  });

  it("should only reference characters that exist in the roster", async () => {
    const { getCharacter } = await import("./characters");
    const rosterSlides = lhmSlides.filter((s) => s.type === "character-roster");
    expect(rosterSlides.length).toBeGreaterThanOrEqual(3);
    for (const slide of rosterSlides) {
      expect(slide.characters.length, `${slide.id} is overloaded`).toBeLessThanOrEqual(6);
      for (const id of slide.characters) {
        expect(getCharacter(id), `${slide.id} references unknown "${id}"`).toBeDefined();
      }
    }
  });
});

describe("clock formatting", () => {
  it("should format seconds as m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(600)).toBe("10:00");
  });

  it("should clamp negative input rather than printing a negative clock", () => {
    expect(formatClock(-30)).toBe("0:00");
  });

  it("should sign drift in both directions", () => {
    expect(formatDrift(80)).toBe("+1:20");
    expect(formatDrift(-45)).toBe("-0:45");
    expect(formatDrift(0)).toBe("+0:00");
  });
});

describe("devfest workshop spine", () => {
  it("should run as a talk at keynote runtime and a full day at workshop runtime", async () => {
    const { devfestSlides, devfestDeckMeta, devfestPresenterNotes } = await import("./devfestSlides");

    expect(devfestDeckMeta.continuesFrom).toBe("lhm");
    expect(devfestDeckMeta.defaultRuntime).toBe("keynote");

    const talk = selectSlides(devfestSlides, { runtime: "keynote" });
    const fullDay = selectSlides(devfestSlides, { runtime: "workshop" });

    // The talk portion must carry no labs; the full day must carry all four.
    expect(talk.some((s) => s.type === "lab")).toBe(false);
    expect(fullDay.filter((s) => s.type === "lab")).toHaveLength(4);

    // Every slide needs notes: this deck is delivered in front of a room too.
    for (const slide of devfestSlides) {
      expect(devfestPresenterNotes[slide.id], `missing notes for "${slide.id}"`).toBeTruthy();
    }
  });

  it("should budget the labs as the bulk of the workshop day", async () => {
    const { devfestSlides } = await import("./devfestSlides");
    const fullDay = selectSlides(devfestSlides, { runtime: "workshop" });
    const labSeconds = fullDay
      .filter((s) => s.type === "lab")
      .reduce((sum, s) => sum + slideBudget(s), 0);
    expect(labSeconds / 60).toBeGreaterThan(80);
  });
});
