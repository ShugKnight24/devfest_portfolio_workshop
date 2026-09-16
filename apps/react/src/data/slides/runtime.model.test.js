import { describe, it, expect } from "vitest";
import {
  TIER,
  ALTITUDE,
  LAB_TRACK,
  RUNTIMES,
  RUNTIME_ORDER,
  DEFAULT_RUNTIME,
  getRuntime,
  includedAt,
  selectSlides,
} from "./runtime";
import * as RUNTIME_HELPERS from "./runtime";

/**
 * The runtime RULES, tested against synthetic slides.
 *
 * These deliberately do not import a real deck. Deck tests prove the talk hits
 * its timings; these prove the selection model is correct no matter what the
 * content says, so a content edit can never quietly change what a runtime means.
 */

const slide = (id, props = {}) => ({ id, ...props });

const FIXTURE = [
  slide("core-concept", { tier: TIER.CORE, altitude: ALTITUDE.CONCEPT }),
  slide("core-tactical", { tier: TIER.CORE, altitude: ALTITUDE.TACTICAL }),
  slide("core-untagged", { tier: TIER.CORE }),
  slide("ext-concept", { tier: TIER.EXTENDED, altitude: ALTITUDE.CONCEPT }),
  slide("ext-tactical", { tier: TIER.EXTENDED, altitude: ALTITUDE.TACTICAL }),
  slide("deep-concept", { tier: TIER.DEEP, altitude: ALTITUDE.CONCEPT }),
  slide("deep-tactical", { tier: TIER.DEEP, altitude: ALTITUDE.TACTICAL }),
  slide("lab-short", { tier: TIER.LAB, labTrack: LAB_TRACK.SHORT }),
  slide("lab-full", { tier: TIER.LAB, labTrack: LAB_TRACK.FULL }),
  slide("flex-ext-concept", { flex: true, zone: "z", tier: TIER.EXTENDED, altitude: ALTITUDE.CONCEPT }),
  slide("flex-ext-tactical", { flex: true, zone: "z", tier: TIER.EXTENDED, altitude: ALTITUDE.TACTICAL }),
  slide("flex-untiered", { flex: true, zone: "z" }),
];

const idsAt = (runtime, opts = {}) =>
  selectSlides(FIXTURE, { runtime, ...opts }).map((s) => s.id);

describe("runtime catalogue", () => {
  it("offers exactly the five runtimes, shortest to longest", () => {
    expect(RUNTIME_ORDER).toEqual(["lightning", "keynote", "standard", "workshopShort", "workshopFull"]);
    expect(Object.keys(RUNTIMES).sort()).toEqual([...RUNTIME_ORDER].sort());

    const minutes = RUNTIME_ORDER.map((id) => RUNTIMES[id].minutes);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });

  it("advertises the agreed lengths", () => {
    expect(RUNTIMES.lightning.minutes).toBe(30);
    expect(RUNTIMES.keynote.minutes).toBe(40);
    expect(RUNTIMES.standard.minutes).toBe(60);
    expect(RUNTIMES.workshopShort.minutes).toBe(90);
    expect(RUNTIMES.workshopFull.minutes).toBe(180);
  });

  it("defaults to lightning and maps unknown ids back to it", () => {
    expect(DEFAULT_RUNTIME).toBe("lightning");
    expect(getRuntime("nope").id).toBe("lightning");
    expect(getRuntime(undefined).id).toBe("lightning");
  });

  it("keeps the retired workshop id working", () => {
    expect(getRuntime("workshop").id).toBe("workshopFull");
  });
});

describe("tier", () => {
  it("runs lightning at core and extended depth, never deep", () => {
    const ids = idsAt("lightning");
    expect(ids).toEqual(expect.arrayContaining(["core-concept", "core-tactical", "ext-concept"]));
    expect(ids).not.toContain("deep-concept");
    expect(ids).not.toContain("deep-tactical");
  });

  it("runs standard down to deep regardless of altitude", () => {
    const ids = idsAt("standard");
    expect(ids).toEqual(
      expect.arrayContaining(["core-tactical", "ext-tactical", "deep-concept", "deep-tactical"])
    );
  });

  it("never runs a lab outside a workshop", () => {
    for (const rt of ["lightning", "keynote", "standard"]) {
      expect(idsAt(rt)).not.toContain("lab-short");
      expect(idsAt(rt)).not.toContain("lab-full");
    }
  });
});

describe("altitude", () => {
  it("runs the keynote on concept slides only", () => {
    const ids = idsAt("keynote");
    expect(ids).toEqual(expect.arrayContaining(["core-concept", "ext-concept", "deep-concept"]));
    expect(ids).not.toContain("core-tactical");
    expect(ids).not.toContain("deep-tactical");
  });

  it("is opt-in, so an untagged slide can never leak into the keynote", () => {
    expect(idsAt("keynote")).not.toContain("core-untagged");
    // ...while every other runtime still carries it.
    expect(idsAt("lightning")).toContain("core-untagged");
    expect(idsAt("standard")).toContain("core-untagged");
  });

  it("is not simply the longest cut: keynote carries fewer slides than standard", () => {
    expect(idsAt("keynote").length).toBeLessThan(idsAt("standard").length);
  });

  it("does not auto-include a tactical flex slide at the keynote", () => {
    const ids = idsAt("keynote");
    expect(ids).toContain("flex-ext-concept");
    expect(ids).not.toContain("flex-ext-tactical");
  });

  it("still lets the speaker pull a tactical flex slide in by hand", () => {
    expect(idsAt("keynote", { openZones: ["z"] })).toContain("flex-ext-tactical");
  });
});

describe("lab track", () => {
  it("runs only short-track labs in the 90-minute workshop", () => {
    const ids = idsAt("workshopShort");
    expect(ids).toContain("lab-short");
    expect(ids).not.toContain("lab-full");
  });

  it("runs every lab in the 3-hour workshop", () => {
    const ids = idsAt("workshopFull");
    expect(ids).toContain("lab-short");
    expect(ids).toContain("lab-full");
  });

  it("gives both workshops the whole talk around the labs", () => {
    const talk = idsAt("standard");
    for (const rt of ["workshopShort", "workshopFull"]) {
      expect(idsAt(rt)).toEqual(expect.arrayContaining(talk));
    }
  });
});

describe("flex zones", () => {
  it("keeps an untiered flex slide out until its zone is opened", () => {
    for (const rt of RUNTIME_ORDER) {
      expect(idsAt(rt)).not.toContain("flex-untiered");
      expect(idsAt(rt, { openZones: ["z"] })).toContain("flex-untiered");
    }
  });

  it("honours a slide the speaker dropped live, even inside an open zone", () => {
    const ids = idsAt("standard", { openZones: ["z"], dropped: ["flex-ext-concept", "core-concept"] });
    expect(ids).not.toContain("flex-ext-concept");
    expect(ids).not.toContain("core-concept");
  });

  it("preserves deck order", () => {
    const order = FIXTURE.map((s) => s.id);
    for (const rt of RUNTIME_ORDER) {
      const positions = idsAt(rt, { openZones: ["z"] }).map((id) => order.indexOf(id));
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }
  });
});

describe("includedAt", () => {
  it("agrees with selectSlides for every non-flex slide at every runtime", () => {
    for (const rt of RUNTIME_ORDER) {
      const selected = new Set(idsAt(rt));
      for (const s of FIXTURE.filter((x) => !x.flex)) {
        expect(includedAt(s, rt), `${s.id} @ ${rt}`).toBe(selected.has(s.id));
      }
    }
  });

  it("accepts a runtime object as well as an id", () => {
    expect(includedAt(FIXTURE[0], RUNTIMES.keynote)).toBe(true);
    expect(includedAt(FIXTURE[1], RUNTIMES.keynote)).toBe(false);
  });
});

describe("formatRuntimeLength", () => {
  it("renders minutes under two hours and hours above", () => {
    const { formatRuntimeLength } = RUNTIME_HELPERS;
    expect(formatRuntimeLength(30)).toBe("30m");
    expect(formatRuntimeLength(90)).toBe("90m");
    expect(formatRuntimeLength(180)).toBe("3h");
    expect(formatRuntimeLength(150)).toBe("2h 30m");
  });

  it("never repeats a length inside a runtime label", () => {
    for (const id of RUNTIME_ORDER) {
      expect(RUNTIMES[id].label, id).not.toMatch(/\d/);
    }
  });
});
