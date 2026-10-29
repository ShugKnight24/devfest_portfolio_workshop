import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiffHuntSlide } from "./DiffHunt";
import { devfestSlides } from "../../data/slides/devfestSlides";
import { EXHIBITS } from "../three/scenes/reacherInvestigationScene";

const slide = devfestSlides.find((s) => s.id === "read-the-diff");

describe("Read the diff", () => {
  it("points every flaw at a line that exists", () => {
    const keys = new Set(slide.files.flatMap((f) => f.lines.map((_, i) => `${f.path}:${i + 1}`)));
    for (const flaw of slide.flaws) {
      for (const line of flaw.lines) expect(keys.has(line), `${flaw.exhibit} → ${line}`).toBe(true);
    }
  });

  it("pairs each flaw with the scene's exhibit of the same letter, in order", () => {
    expect(slide.flaws.map((f) => f.exhibit)).toEqual(EXHIBITS.map((e) => e.letter));
    expect(slide.beats).toHaveLength(slide.flaws.length);
  });

  it("shows the brief before any reveal, then one finding per beat", () => {
    const { rerender } = render(<DiffHuntSlide slide={slide} isActive beatStep={0} />);
    expect(screen.getByText(slide.brief[0])).toBeInTheDocument();
    expect(screen.queryByText(slide.flaws[0].title)).not.toBeInTheDocument();

    rerender(<DiffHuntSlide slide={slide} isActive beatStep={2} />);
    expect(screen.getByText(slide.flaws[1].title)).toBeInTheDocument();
    expect(screen.getByText(slide.flaws[0].title)).toBeInTheDocument();
    expect(screen.queryByText(slide.verdict)).not.toBeInTheDocument();

    rerender(<DiffHuntSlide slide={slide} isActive beatStep={slide.flaws.length} />);
    expect(screen.getByText(slide.verdict)).toBeInTheDocument();
  });

  it("reveals the next flaw from its button", () => {
    const onBeat = vi.fn();
    render(<DiffHuntSlide slide={slide} isActive beatStep={3} onBeat={onBeat} />);
    fireEvent.click(screen.getByRole("button", { name: "Reveal 4 of 6" }));
    expect(onBeat).toHaveBeenCalledWith(3);
  });

  it("gives every flaw a real incident from a big codebase", () => {
    for (const flaw of slide.flaws) {
      expect(flaw.wild?.name, flaw.exhibit).toBeTruthy();
      expect(flaw.wild?.what, flaw.exhibit).toBeTruthy();
    }
  });

  it("brings an earlier finding back up when it is clicked, and steps back from its button", () => {
    const onBack = vi.fn();
    render(<DiffHuntSlide slide={slide} isActive beatStep={4} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(slide.flaws[0].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }));
    expect(screen.getByText(slide.flaws[0].why)).toBeInTheDocument();
    expect(screen.getByText(slide.flaws[0].wild.name)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
