import { describe, it, expect } from "vitest";
import { devfestSlides, devfestPresenterNotes } from "./devfestSlides";

describe("devfest notes", () => {
  // Thirty minutes has no labs; a reused note that still says "LAB" or talks
  // workshop timing would send the speaker into an exercise that is not there.
  it("speak in this talk's timing, not the workshop's", () => {
    for (const { id } of devfestSlides) {
      const note = devfestPresenterNotes[id];
      expect(note, id).not.toMatch(/^LAB\b/);
      expect(note, id).not.toMatch(/workshop/i);
    }
  });
});
