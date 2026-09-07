import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";

const ThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Synthetic Crash Test for Reacher Protocol");
  }
  return <div>Component is Healthy</div>;
};

describe("ErrorBoundary — Reacher Fault Isolation", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress console.error during expected throw tests
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>All Systems Nominal</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("All Systems Nominal")).toBeDefined();
  });

  it("catches runtime errors and renders SYSTEM OFFLINE fallback UI", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("SYSTEM OFFLINE: CHECK YOUR CODE")).toBeDefined();
    expect(
      screen.getByText(/Synthetic Crash Test for Reacher Protocol/)
    ).toBeDefined();
    expect(screen.getByText("Copy Reacher Debug Prompt")).toBeDefined();
    expect(screen.getByText("Reboot Component")).toBeDefined();
  });

  it("supports inline mode for isolated section failures", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary inline={true}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>
    );

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("rounded-2xl");
  });

  it("handles reboot/reset click", () => {
    const onReset = vi.fn();
    render(
      <MemoryRouter>
        <ErrorBoundary onReset={onReset}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>
    );

    const rebootBtn = screen.getByText("Reboot Component");
    fireEvent.click(rebootBtn);
    expect(onReset).toHaveBeenCalled();
  });
});
