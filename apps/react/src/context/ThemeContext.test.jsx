/**
 * ThemeContext Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

// Test component that uses the theme context
const TestConsumer = () => {
  const { currentTheme, changeTheme, isDark, toggleDarkMode, theme } =
    useTheme();

  return (
    <div>
      <span data-testid="current-theme">{currentTheme}</span>
      <span data-testid="is-dark">{isDark.toString()}</span>
      <span data-testid="primary-color">
        {theme?.colors?.primary || "none"}
      </span>
      <button onClick={() => changeTheme("oceanBreeze")}>Set Ocean</button>
      <button onClick={() => changeTheme("sunsetGlow")}>Set Sunset</button>
      <button onClick={toggleDarkMode}>Toggle Dark</button>
    </div>
  );
};

describe("ThemeContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove("dark");
  });

  it("provides default theme value", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Should have a default theme
    expect(screen.getByTestId("current-theme")).toHaveTextContent(
      /default|ocean|sunset/
    );
  });

  it("allows changing theme", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText("Set Ocean"));
    expect(screen.getByTestId("current-theme")).toHaveTextContent("oceanBreeze");
  });

  it("persists theme to localStorage", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText("Set Sunset"));

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "sunsetGlow");
  });

  it("allows toggling dark mode", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const initialDark = screen.getByTestId("is-dark").textContent;
    fireEvent.click(screen.getByText("Toggle Dark"));

    expect(screen.getByTestId("is-dark").textContent).not.toBe(initialDark);
  });

  it("persists dark mode to localStorage", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText("Toggle Dark"));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "darkMode",
      expect.any(String)
    );
  });

  it("adds dark class to document when dark mode is enabled", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Toggle to dark if not already dark
    if (!document.documentElement.classList.contains("dark")) {
      fireEvent.click(screen.getByText("Toggle Dark"));
    }

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document when dark mode is disabled", () => {
    // Start with dark mode
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // If dark mode is on, toggle it off
    if (screen.getByTestId("is-dark").textContent === "true") {
      fireEvent.click(screen.getByText("Toggle Dark"));
    }

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws error when useTheme is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });

  it("loads theme from localStorage on mount", () => {
    localStorage.getItem.mockReturnValue("oceanBreeze");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(localStorage.getItem).toHaveBeenCalledWith("theme");
  });

  it("loads dark mode preference from localStorage on mount", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === "darkMode") return "true";
      return null;
    });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(localStorage.getItem).toHaveBeenCalledWith("darkMode");
  });

  it("provides theme colors", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Theme should have a primary color
    const primaryColor = screen.getByTestId("primary-color").textContent;
    expect(primaryColor).not.toBe("none");
  });
});
