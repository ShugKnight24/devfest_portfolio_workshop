import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InteractiveLearningScene } from "./InteractiveLearningScene";

const renderScene = () =>
  render(
    <MemoryRouter>
      <InteractiveLearningScene />
    </MemoryRouter>,
  );

describe("InteractiveLearningScene Component", () => {
  beforeEach(() => localStorage.removeItem("devfest_learning_xp"));

  it("renders the desk with its mode, its one action and XP progress", () => {
    renderScene();

    expect(screen.getByRole("heading", { name: /Your desk\. Flow State\./ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Ship a commit/ })).toBeDefined();
    expect(screen.getByRole("progressbar", { name: "Progress to next milestone" })).toBeDefined();
  });

  it("switches mindset modes from the segmented control", () => {
    renderScene();

    fireEvent.click(screen.getByRole("radio", { name: /Deductive Focus/ }));
    expect(screen.getByText("The Reacher Protocol")).toBeDefined();
    expect(screen.getByRole("radio", { name: /Deductive Focus/ }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: /Iron Discipline/ }));
    expect(screen.getByText("Cognitive Hypertrophy")).toBeDefined();
  });

  it("earns XP for each commit shipped", () => {
    renderScene();

    fireEvent.click(screen.getByRole("button", { name: /Ship a commit/ }));
    expect(screen.getByRole("button", { name: /Ship a commit \(1\)/ })).toBeDefined();
    expect(screen.getByText("165 XP")).toBeDefined();
    expect(localStorage.getItem("devfest_learning_xp")).toBe("165");
  });
});
