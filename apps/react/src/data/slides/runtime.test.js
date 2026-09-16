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
import { combinedSlides } from "./combinedSlides";

describe("elastic runtime selection", () => {
  it("should keep only core slides at lightning runtime", () => {
    const picked = selectSlides(combinedSlides, { runtime: "lightning" });
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
      (runtime) => selectSlides(combinedSlides, { runtime }).length
    );
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[0]).toBeLessThan(counts[counts.length - 1]);
  });

  it("should never drop a core slide at any runtime", () => {
    const coreIds = combinedSlides.filter((s) => s.tier === TIER.CORE && !s.flex).map((s) => s.id);
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = selectSlides(combinedSlides, { runtime }).map((s) => s.id);
      for (const id of coreIds) expect(ids, `${id} dropped at ${runtime}`).toContain(id);
    }
  });

  it("should pull a flex zone in on demand without changing the runtime", () => {
    const base = selectSlides(combinedSlides, { runtime: "lightning" });
    const opened = selectSlides(combinedSlides, {
      runtime: "lightning",
      openZones: ["while-it-builds"],
    });
    expect(opened.length).toBeGreaterThan(base.length);
    // Opening a zone adds only that zone's slides — the spine keeps its shape.
    const added = opened.filter((s) => !base.some((b) => b.id === s.id));
    expect(added.every((s) => s.zone === "while-it-builds")).toBe(true);
  });

  it("should keep deck order when a zone is pulled in", () => {
    const opened = selectSlides(combinedSlides, {
      runtime: "lightning",
      openZones: ["while-it-builds"],
    });
    const deckOrder = combinedSlides.map((s) => s.id);
    const positions = opened.map((s) => deckOrder.indexOf(s.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("should include flex slides automatically once the runtime is long enough", () => {
    const standard = selectSlides(combinedSlides, { runtime: "standard" }).map((s) => s.id);
    expect(standard).toContain("pair-reacher-neagley");
    expect(standard).toContain("zero-bloat");
  });

  it("should honour slides dropped live", () => {
    const ids = selectSlides(combinedSlides, {
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
    const zones = getFlexZones(combinedSlides);
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
  const selected = selectSlides(combinedSlides, { runtime: "lightning" });

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

  it("should land the lightning runtime UNDER 15 minutes, not merely near it", () => {
    // A 15-minute slot is 15 minutes of room time, and the live build is the
    // one beat that always overruns. The spine has to leave slack for it.
    const { totalSeconds } = pacingStatus(selected, 0, 0);
    expect(totalSeconds / 60).toBeLessThan(RUNTIMES.lightning.minutes);
  });

  it("should fill the longer runtimes close to their advertised length", () => {
    const minutesFor = (runtime) =>
      selectSlides(combinedSlides, { runtime }).reduce((sum, s) => sum + slideBudget(s), 0) / 60;

    // Standard sits around 30. Keynote has to genuinely fill an hour slot —
    // a "60 minute" deck that runs 31 minutes is the failure this tier exists
    // to prevent.
    expect(minutesFor("standard")).toBeGreaterThan(RUNTIMES.standard.minutes - 3);
    expect(minutesFor("standard")).toBeLessThan(RUNTIMES.standard.minutes + 3);
    expect(minutesFor("keynote")).toBeGreaterThan(55);
    expect(minutesFor("keynote")).toBeLessThanOrEqual(RUNTIMES.keynote.minutes);
  });
});

describe("character pairings", () => {
  it("should carry every pairing at extended tier, never in the spine", () => {
    const pairs = combinedSlides.filter((s) => s.id.startsWith("pair-"));
    expect(pairs).toHaveLength(6);
    for (const p of pairs) {
      expect(p.type, `${p.id} should be a comparison`).toBe("comparison");
      expect(p.tier, `${p.id} should be extended tier`).toBe(TIER.EXTENDED);
    }
    // None of them survive the lightning cut — the spine is the argument.
    const lightning = selectSlides(combinedSlides, { runtime: "lightning" }).map((s) => s.id);
    expect(lightning.some((id) => id.startsWith("pair-"))).toBe(false);
  });

  it("should stand the three strongest pairings up in the while-it-builds zone", () => {
    const zone = getFlexZones(combinedSlides).find((z) => z.id === "while-it-builds");
    const ids = zone.slides.map((s) => s.id);
    expect(ids).toContain("pair-reacher-neagley");
    expect(ids).toContain("pair-denji-aki");
    expect(ids).toContain("pair-power");
    // Enough material to cover a build that runs genuinely long.
    expect(zone.seconds / 60).toBeGreaterThan(9);
  });

  it("should open the flex zone from the launch beat that starts the build", () => {
    const launch = combinedSlides.find((s) => s.id === "launch-build");
    expect(launch.opensZone).toBe("while-it-builds");
    const zoneStart = combinedSlides.findIndex((s) => s.zone === "while-it-builds");
    expect(zoneStart).toBeGreaterThan(combinedSlides.indexOf(launch));
    expect(zoneStart).toBeLessThan(combinedSlides.findIndex((s) => s.id === "payoff"));
  });
});

describe("character roster material", () => {
  it("should land Chesterton's Fence inside the Deduce First beat at every runtime", () => {
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = selectSlides(combinedSlides, { runtime }).map((s) => s.id);
      const formula = ids.indexOf("reacher-formula");
      expect(ids[formula + 1], `fence moved at ${runtime}`).toBe("chestertons-fence");
    }
  });

  it("should hold the reserve roster back for a build that runs long", () => {
    const zone = getFlexZones(combinedSlides).find((z) => z.id === "while-it-builds");
    const reserves = zone.slides.find((s) => s.id === "roster-reserves");
    expect(reserves).toBeDefined();
    // Deepest thing in the zone: only reached when the build really drags.
    expect(reserves.tier).toBe(TIER.DEEP);
    expect(reserves.characters).toEqual(["franz", "pochita", "reze"]);
  });

  it("should not spend a character twice across pairings and rosters", async () => {
    const { getCharacter } = await import("./characters");
    const named = combinedSlides
      .filter((s) => s.type === "character-roster")
      .flatMap((s) => s.characters);
    expect(new Set(named).size, "a roster repeats a character").toBe(named.length);
    for (const id of named) expect(getCharacter(id)).toBeDefined();
  });

  it("should only reference characters that exist in the roster", async () => {
    const { getCharacter } = await import("./characters");
    const rosterSlides = combinedSlides.filter((s) => s.type === "character-roster");
    expect(rosterSlides.length).toBeGreaterThanOrEqual(2);
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

    expect(devfestDeckMeta.continuesFrom).toBe("combined");
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
