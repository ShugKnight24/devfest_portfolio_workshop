import { describe, it, expect } from "vitest";
import {
  TIER,
  ALTITUDE,
  LAB_TRACK,
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
import { combinedSlides, combinedPresenterNotes } from "./combinedSlides";

const minutesFor = (runtime) =>
  selectSlides(combinedSlides, { runtime }).reduce((sum, s) => sum + slideBudget(s), 0) / 60;

const idsFor = (runtime, opts = {}) =>
  selectSlides(combinedSlides, { runtime, ...opts }).map((s) => s.id);

describe("elastic runtime selection", () => {
  it("should keep lightning to the argument: core and extended, never deep or labs", () => {
    const picked = selectSlides(combinedSlides, { runtime: "lightning" });
    expect(picked.every((s) => s.tier <= TIER.EXTENDED)).toBe(true);
    // The spine has to survive the shortest runtime intact.
    const ids = picked.map((s) => s.id);
    for (const id of ["title", "the-title", "bio", "umelo-bridge", "the-ask", "launch-build", "payoff", "audience-of-one", "the-way", "close"]) {
      expect(ids, `${id} missing from lightning`).toContain(id);
    }
  });

  it("should expand monotonically along the depth ladder", () => {
    // Keynote is not on this ladder: it is a concept-only cut, not a longer one.
    const ladder = ["lightning", "standard", "workshopShort", "workshopFull"];
    const selections = ladder.map((runtime) => idsFor(runtime));
    for (let i = 1; i < selections.length; i += 1) {
      expect(selections[i].length).toBeGreaterThan(selections[i - 1].length);
      expect(selections[i]).toEqual(expect.arrayContaining(selections[i - 1]));
    }
  });

  it("should run the keynote as a subset of the standard talk", () => {
    expect(idsFor("standard")).toEqual(expect.arrayContaining(idsFor("keynote")));
  });

  it("should never drop a core slide, except tactical ones at the concept-only keynote", () => {
    const core = combinedSlides.filter((s) => s.tier === TIER.CORE && !s.flex);
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = idsFor(runtime);
      const expected =
        runtime === "keynote" ? core.filter((s) => s.altitude === ALTITUDE.CONCEPT) : core;
      for (const { id } of expected) expect(ids, `${id} dropped at ${runtime}`).toContain(id);
    }
    // The only core beats the keynote gives up are the live build, and nothing else.
    const keynote = idsFor("keynote");
    const skipped = core.filter((s) => !keynote.includes(s.id)).map((s) => s.id);
    expect(skipped.sort()).toEqual(["launch-build", "payoff", "the-ask"]);
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
    const standard = idsFor("standard");
    expect(standard).toContain("pair-reacher-neagley");
    expect(standard).toContain("zero-bloat");
  });

  it("should honour slides dropped live", () => {
    expect(idsFor("keynote")).toContain("bio");
    expect(idsFor("keynote", { dropped: ["bio"] })).not.toContain("bio");
  });

  it("should fall back to the default runtime for an unknown id", () => {
    expect(getRuntime("nope").id).toBe(RUNTIMES.lightning.id);
  });
});

describe("altitude", () => {
  it("should tag every non-lab slide, because an untagged slide silently vanishes from the keynote", () => {
    const valid = Object.values(ALTITUDE);
    for (const slide of combinedSlides.filter((s) => s.tier !== TIER.LAB)) {
      expect(valid, `"${slide.id}" has no altitude`).toContain(slide.altitude);
    }
  });

  it("should put a track on every lab slide", () => {
    const valid = Object.values(LAB_TRACK);
    for (const slide of combinedSlides.filter((s) => s.tier === TIER.LAB)) {
      expect(valid, `"${slide.id}" has no labTrack`).toContain(slide.labTrack);
    }
  });

  it("should keep the how-to out of the keynote", () => {
    const keynote = idsFor("keynote");
    for (const id of ["the-ask", "launch-build", "payoff", "prompt-anatomy", "verification-gate", "context-hierarchy"]) {
      expect(keynote, `${id} leaked into the keynote`).not.toContain(id);
    }
  });

  it("should carry the characters as metaphor and the community act at the keynote", () => {
    const keynote = idsFor("keynote");
    expect(keynote.filter((id) => id.startsWith("pair-")).length).toBeGreaterThanOrEqual(3);
    for (const id of ["umelo-bridge", "crew-and-unit", "the-110th", "division-4", "audience-of-one", "build-on-it"]) {
      expect(keynote, `${id} missing from the keynote`).toContain(id);
    }
  });
});

describe("runtime timings", () => {
  const within = (runtime, target, tolerance) => {
    const minutes = minutesFor(runtime);
    expect(minutes, `${runtime} runs ${minutes.toFixed(1)} min`).toBeGreaterThanOrEqual(target - tolerance);
    expect(minutes, `${runtime} runs ${minutes.toFixed(1)} min`).toBeLessThanOrEqual(target + tolerance);
  };

  it("should match every runtime's advertised length to the target it is tested against", () => {
    expect(RUNTIMES.lightning.minutes).toBe(30);
    expect(RUNTIMES.keynote.minutes).toBe(40);
    expect(RUNTIMES.standard.minutes).toBe(60);
    expect(RUNTIMES.workshopShort.minutes).toBe(90);
    expect(RUNTIMES.workshopFull.minutes).toBe(180);
  });

  it("should land lightning within 3 minutes of 30", () => {
    within("lightning", RUNTIMES.lightning.minutes, 3);
  });

  it("should land the keynote within 5 minutes of 40, on fewer slides than standard", () => {
    within("keynote", RUNTIMES.keynote.minutes, 5);
    expect(idsFor("keynote").length).toBeLessThan(idsFor("standard").length);
  });

  it("should land standard within 4 minutes of 60", () => {
    within("standard", RUNTIMES.standard.minutes, 4);
  });

  it("should land the 90-minute workshop within 8 minutes of 90", () => {
    within("workshopShort", RUNTIMES.workshopShort.minutes, 8);
  });

  it("should land the 3-hour workshop within 15 minutes of 180", () => {
    within("workshopFull", RUNTIMES.workshopFull.minutes, 15);
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

  it("should report the same total the timing tests measure", () => {
    const { totalSeconds } = pacingStatus(selected, 0, 0);
    expect(totalSeconds / 60).toBe(minutesFor("lightning"));
  });
});

describe("character pairings", () => {
  it("should carry every pairing at extended tier, never in the core spine", () => {
    const pairs = combinedSlides.filter((s) => s.id.startsWith("pair-"));
    expect(pairs).toHaveLength(6);
    for (const p of pairs) {
      expect(p.type, `${p.id} should be a comparison`).toBe("comparison");
      expect(p.tier, `${p.id} should be extended tier`).toBe(TIER.EXTENDED);
    }
    // Lightning carries them as evidence; the standard talk carries all of them.
    const standard = idsFor("standard");
    for (const p of pairs) expect(standard).toContain(p.id);
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

describe("community throughline", () => {
  it("should open on the title, its explanation, the source material and the speaker, then the Umelo bridge, at every runtime", () => {
    const bridge = combinedSlides.find((s) => s.id === "umelo-bridge");
    expect(bridge.tier).toBe(TIER.CORE);
    expect(bridge.altitude).toBe(ALTITUDE.CONCEPT);
    expect(`${bridge.phase} ${bridge.description}`).toContain("Umelo Onyejiaka");
    for (const runtime of Object.keys(RUNTIMES)) {
      expect(idsFor(runtime).slice(0, 5), `opening moved at ${runtime}`).toEqual([
        "title",
        "the-title",
        "why-these-two",
        "bio",
        "umelo-bridge",
      ]);
    }
  });

  it("should tell the speaker to name Umelo in the bridge note", () => {
    expect(combinedPresenterNotes["umelo-bridge"]).toContain("Umelo Onyejiaka");
  });

  it("should make Audience of One to Audience of Many the community move", () => {
    const aoo = combinedSlides.find((s) => s.id === "audience-of-one");
    expect(aoo.tier).toBe(TIER.CORE);
    expect(aoo.title).toContain("Audience of Many");
    // The how-to for "build something others can build on" follows it at every talk length.
    for (const runtime of ["lightning", "keynote", "standard"]) {
      const ids = idsFor(runtime);
      expect(ids.indexOf("build-on-it"), runtime).toBeGreaterThan(ids.indexOf("audience-of-one"));
    }
  });

  it("should reach the lightning talk, not only the long cuts", () => {
    const lightning = idsFor("lightning");
    for (const id of ["umelo-bridge", "crew-and-unit", "audience-of-one", "build-on-it", "close"]) {
      expect(lightning, `${id} missing from lightning`).toContain(id);
    }
  });
});

describe("labs", () => {
  const labs = combinedSlides.filter((s) => s.tier === TIER.LAB);

  it("should run two short-track labs, and nothing else, in the 90-minute workshop", () => {
    const short = labs.filter((s) => s.labTrack === LAB_TRACK.SHORT);
    expect(short).toHaveLength(2);
    const picked = selectSlides(combinedSlides, { runtime: "workshopShort" }).filter((s) => s.tier === TIER.LAB);
    expect(picked.map((s) => s.id)).toEqual(short.map((s) => s.id));
  });

  it("should give the 3-hour workshop every lab, a break, and show and tell", () => {
    const full = idsFor("workshopFull");
    for (const lab of labs) expect(full).toContain(lab.id);
    expect(labs.filter((s) => s.labTrack === LAB_TRACK.FULL).length).toBeGreaterThanOrEqual(4);
    expect(full).toContain("break");
    expect(full).toContain("lab-show-and-tell");
    expect(idsFor("workshopShort")).not.toContain("break");
  });

  it("should budget every lab explicitly, since the default is a guess", () => {
    for (const lab of labs) expect(lab.budget, `${lab.id} has no budget`).toBeGreaterThan(0);
  });

  it("should never run a lab outside a workshop", () => {
    for (const runtime of ["lightning", "keynote", "standard"]) {
      expect(selectSlides(combinedSlides, { runtime }).some((s) => s.tier === TIER.LAB)).toBe(false);
    }
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
  it("opens as a workshop and runs its talk and labs at the right runtimes", async () => {
    const { devfestSlides, devfestDeckMeta, devfestPresenterNotes } = await import("./devfestSlides");

    expect(devfestDeckMeta.continuesFrom).toBe("combined");
    expect(devfestDeckMeta.defaultRuntime).toBe("workshopFull");

    const talk = selectSlides(devfestSlides, { runtime: "standard" });
    const shortDay = selectSlides(devfestSlides, { runtime: "workshopShort" });
    const fullDay = selectSlides(devfestSlides, { runtime: "workshopFull" });

    // Assert there IS a talk before asserting it has no labs. The old version of
    // this test checked "no labs" on its own, which an EMPTY selection satisfies —
    // so it kept passing while the deck opened on zero slides.
    expect(talk.length).toBeGreaterThan(0);
    expect(talk.some((s) => s.type === "lab")).toBe(false);

    expect(shortDay.filter((s) => s.type === "lab")).toHaveLength(2);
    expect(fullDay.filter((s) => s.type === "lab")).toHaveLength(4);

    for (const slide of devfestSlides) {
      expect(devfestPresenterNotes[slide.id], `missing notes for "${slide.id}"`).toBeTruthy();
    }
  });

  it("budgets the labs as the bulk of the full workshop", async () => {
    const { devfestSlides } = await import("./devfestSlides");
    const fullDay = selectSlides(devfestSlides, { runtime: "workshopFull" });
    const labs = fullDay.filter((s) => s.type === "lab");
    expect(labs.length).toBeGreaterThan(0);
    const labMinutes = labs.reduce((sum, s) => sum + slideBudget(s), 0) / 60;
    expect(labMinutes).toBeGreaterThan(80);
  });
});

describe("every live deck", () => {
  // The guard that would have caught the empty devfest deck. A runtime change
  // is a cross-deck change: tightening what a runtime selects can silently empty
  // a deck nobody was looking at. So check every live deck, at every runtime.
  it("opens on real content at its default runtime", async () => {
    const { getLiveDecks, getDeck } = await import("./index");
    for (const { id } of getLiveDecks()) {
      const deck = getDeck(id);
      const runtime = deck.meta.defaultRuntime ?? "lightning";
      const opened = selectSlides(deck.slides, { runtime });
      expect(opened.length, `${id} opens on ZERO slides at its default "${runtime}"`).toBeGreaterThan(0);
    }
  });

  it("presents something at every runtime", async () => {
    const { getLiveDecks, getDeck } = await import("./index");
    const { RUNTIME_ORDER } = await import("./runtime");
    for (const { id } of getLiveDecks()) {
      const deck = getDeck(id);
      for (const runtime of RUNTIME_ORDER) {
        const selected = selectSlides(deck.slides, { runtime });
        expect(selected.length, `${id} is empty at "${runtime}"`).toBeGreaterThan(0);
      }
    }
  });

  it("tags every non-lab slide with an altitude and every lab with a track", async () => {
    // Untagged slides silently drop out of the concept-only keynote, and
    // untracked labs silently drop out of the 90-minute workshop.
    const { getLiveDecks, getDeck } = await import("./index");
    for (const { id } of getLiveDecks()) {
      for (const slide of getDeck(id).slides) {
        if (slide.tier === TIER.LAB) {
          expect(slide.labTrack, `${id}/${slide.id} lab has no labTrack`).toBeTruthy();
        } else {
          expect(slide.altitude, `${id}/${slide.id} has no altitude`).toBeTruthy();
        }
      }
    }
  });
});

describe("the Musashi thread", () => {
  // The hook only works because the close repeats it. If the two ever drift
  // apart, the talk opens on a promise it never keeps.
  it("should plant the quote in the opening and pay it off at the close, at every runtime", () => {
    const hook = combinedSlides.find((s) => s.id === "why-these-two");
    const close = combinedSlides.find((s) => s.id === "the-way");
    expect(hook.tier).toBe(TIER.CORE);
    expect(hook.altitude).toBe(ALTITUDE.CONCEPT);
    expect(hook.quotes.map((q) => q.text), "the callback is a different quote").toContain(close.quote);
    for (const runtime of Object.keys(RUNTIMES)) {
      const ids = idsFor(runtime);
      expect(ids, `hook missing at ${runtime}`).toContain("why-these-two");
      expect(ids.indexOf("why-these-two"), runtime).toBeLessThan(ids.indexOf("the-way"));
    }
  });

  it("should put all four covers on screen, captioned and described", () => {
    const hook = combinedSlides.find((s) => s.id === "why-these-two");
    expect(hook.sources).toHaveLength(4);
    for (const src of hook.sources) {
      expect(src.alt, `${src.label} has no alt text`).toBeTruthy();
      expect(src.lesson, `${src.label} has no lesson`).toBeTruthy();
    }
  });
});

describe("stage images", () => {
  // A slide pointing at a file that is not there fails quietly in a browser and
  // loudly on a projector. Every path a live deck ships has to exist on disk.
  it("should ship every image a live deck points at", async () => {
    const { existsSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const { getLiveDecks, getDeck } = await import("./index");

    const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../../../public");
    const referenced = [];
    for (const { id } of getLiveDecks()) {
      for (const slide of getDeck(id).slides) {
        const paths = [slide.image, ...(slide.sources ?? []).map((s) => s.image)];
        for (const path of paths) if (path) referenced.push([`${id}/${slide.id}`, path]);
      }
    }

    expect(referenced.length).toBeGreaterThan(0);
    for (const [where, path] of referenced) {
      expect(existsSync(join(publicDir, path)), `${where} points at missing ${path}`).toBe(true);
    }
  });
});
