import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InteractiveLearningScene } from "./InteractiveLearningScene";

describe("InteractiveLearningScene Component", () => {
  it("renders the interactive learning scene with stats and default mode", () => {
    render(
      <MemoryRouter>
        <InteractiveLearningScene />
      </MemoryRouter>
    );

    expect(screen.getByText("Interactive Learning Scene")).toBeDefined();
    expect(screen.getAllByText("Flow State").length).toBeGreaterThan(0);
    expect(screen.getByText(/Streak/)).toBeDefined();
    expect(screen.getByText(/Tap to Hack Code/)).toBeDefined();
  });

  it("switches mindset modes when mode buttons are clicked", () => {
    render(
      <MemoryRouter>
        <InteractiveLearningScene />
      </MemoryRouter>
    );

    const focusBtn = screen.getByRole("button", { name: /Deductive Focus/ });
    fireEvent.click(focusBtn);
    expect(screen.getAllByText("The Reacher Protocol").length).toBeGreaterThan(0);

    const disciplineBtn = screen.getByRole("button", { name: /Iron Discipline/ });
    fireEvent.click(disciplineBtn);
    expect(screen.getAllByText("Cognitive Hypertrophy").length).toBeGreaterThan(0);
  });

  it("increments XP when tap to hack code is clicked", () => {
    render(
      <MemoryRouter>
        <InteractiveLearningScene />
      </MemoryRouter>
    );

    const hackBtn = screen.getByText(/Tap to Hack Code/);
    fireEvent.click(hackBtn);
    expect(screen.getByText(/Tap to Hack Code \(1\)/)).toBeDefined();
  });

  it("updates recommended path when dream goal is selected", () => {
    render(
      <MemoryRouter>
        <InteractiveLearningScene />
      </MemoryRouter>
    );

    const careerGoalBtn = screen.getByText("Land My Dream Tech Role");
    fireEvent.click(careerGoalBtn);
    expect(screen.getByText(/Start React 19 Workshop/)).toBeDefined();
  });
});
