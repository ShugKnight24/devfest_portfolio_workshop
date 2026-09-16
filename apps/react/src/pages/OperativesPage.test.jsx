import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperativesPage } from "./OperativesPage";
import portfolioData from "../data/portfolioData";

describe("OperativesPage & Audience of One Operatives", () => {
  it("should verify portfolioData contains isolated operatives schema", () => {
    expect(portfolioData.operatives).toBeDefined();
    expect(Array.isArray(portfolioData.operatives)).toBe(true);
    expect(portfolioData.operatives.length).toBeGreaterThanOrEqual(5);

    const ids = portfolioData.operatives.map((o) => o.id);
    expect(ids).toContain("bank-csv-parser");
    expect(ids).toContain("school-email-scraper");
    expect(ids).toContain("meal-prep-compiler");
    expect(ids).toContain("pomidor-micro-loop");
    expect(ids).toContain("criminal-cookies-cart");
  });

  it("should render OperativesPage with pre-built operatives and cyber-brutalist badge", () => {
    render(
      <MemoryRouter>
        <OperativesPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/THE REACHER PROTOCOL \/\/ AUDIENCE OF ONE/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Sovereign Operatives/i })).toBeInTheDocument();
  });

  it("should execute Bank CSV Parser deduction correctly", () => {
    render(
      <MemoryRouter>
        <OperativesPage />
      </MemoryRouter>
    );

    const parseBtn = screen.getByRole("button", {
      name: /Execute Ledger Deduction/i,
    });
    fireEvent.click(parseBtn);

    expect(screen.getByText(/\/\/ Deductive Expense Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Burn:/i)).toBeInTheDocument();
  });

  it("should switch to Custom Blueprint Builder tab and audit bloat keywords", () => {
    render(
      <MemoryRouter>
        <OperativesPage />
      </MemoryRouter>
    );

    const sandboxTab = screen.getByRole("button", {
      name: /2\. Custom Blueprint Builder/i,
    });
    fireEvent.click(sandboxTab);

    expect(screen.getByText(/Audience of One Blueprint Architect/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-Bloat Verified/i)).toBeInTheDocument();

    // Inject bloat keyword into prompt
    const promptInput = screen.getByLabelText(/Constraint-Driven Master Prompt:/i);
    fireEvent.change(promptInput, {
      target: { value: "Please npm install axios and moment for this tool" },
    });

    expect(screen.getByText(/Faustian Dep Detected: axios, moment/i)).toBeInTheDocument();
  });
});
