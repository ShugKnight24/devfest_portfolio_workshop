import { describe, it, expect } from "vitest";
import { VIEW_STOPS, VIEW_BEATS, CYCLE } from "./nextMountainScene";
import { devfestSlides } from "../../../data/slides/devfestSlides";

describe("the next mountain, walked by the clicker", () => {
  it("should stop at moments in film order, inside one loop", () => {
    VIEW_STOPS.forEach((t, i) => {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(CYCLE);
      if (i > 0) expect(t, `stop ${i}`).toBeGreaterThan(VIEW_STOPS[i - 1]);
    });
  });

  it("should give the slide one beat per stop after the first", () => {
    const slide = devfestSlides.find((s) => s.scene === "next-mountain");
    expect(slide.beats).toHaveLength(VIEW_BEATS);
    for (const beat of slide.beats) expect(beat.label, "the button names the next moment").toBeTruthy();
  });
});
