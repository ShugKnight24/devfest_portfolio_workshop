/**
 * Command Palette & App Bar Tests
 *
 * The speaker drives this live, so the contract under test is the one they will
 * actually lean on: Cmd+K anywhere, arrows, Enter, Escape, and an app bar that
 * is the same three controls on every single route — including /slides.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { ShellProvider } from "../context/ShellContext";
import { CommandPalette } from "./CommandPalette";
import { Navigation } from "./Navigation";
import { routes } from "../config/navigation.js";

const Shell = ({ initialPath = "/" }) => (
  <ThemeProvider>
    <ShellProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Navigation />
        <CommandPalette />
      </MemoryRouter>
    </ShellProvider>
  </ThemeProvider>
);

const openPalette = () =>
  fireEvent.keyDown(window, { key: "k", metaKey: true });

describe("CommandPalette", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is closed until Cmd+K", () => {
    render(<Shell />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openPalette();
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });

  it("wires the combobox to the active option", () => {
    render(<Shell />);
    openPalette();

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", "command-palette-listbox");

    const options = screen.getAllByRole("option");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("filters results by query", () => {
    render(<Shell />);
    openPalette();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "telemetry" } });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Telemetry");
  });

  it("moves the active row with the arrow keys", () => {
    render(<Shell />);
    openPalette();

    const input = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1].id);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0].id);
  });

  it("navigates on Enter, then closes and clears", () => {
    render(<Shell />);
    openPalette();

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "telemetry" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openPalette();
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("closes on Escape", () => {
    render(<Shell />);
    openPalette();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // Mode left the visible chrome; the palette is now the only place it is set,
  // so persistence is tested here rather than against the bar.
  it("switches mode from inside the palette and persists it", () => {
    render(<Shell />);
    openPalette();

    const dialog = screen.getByRole("dialog", { name: /command palette/i });
    fireEvent.click(within(dialog).getByRole("button", { name: "Stage" }));
    expect(within(dialog).getByRole("button", { name: "Stage" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(localStorage.getItem("shell_mode")).toBe("stage");
  });
});

const getBar = () => screen.getByRole("navigation", { name: "Primary" });

/** Every control the bar is allowed to contain, on any route, at any width. */
const BAR_CONTROLS = ["Home", "Search", "Menu"];

describe("app bar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is the same three controls, and nothing else", () => {
    render(<Shell />);
    const bar = getBar();

    for (const name of BAR_CONTROLS) {
      expect(
        within(bar).getByRole(name === "Home" ? "link" : "button", { name })
      ).toBeInTheDocument();
    }

    // The bar holds exactly one link and two buttons. This is the invariant
    // that keeps it from growing: routes live in the overlay, never here.
    expect(within(bar).getAllByRole("link")).toHaveLength(1);
    expect(within(bar).getAllByRole("button")).toHaveLength(2);
    expect(within(bar).queryByRole("link", { name: "Components" })).not.toBeInTheDocument();
  });

  it("renders the identical bar on every route, /slides included", () => {
    for (const path of ["/", "/resources", "/dashboard/telemetry", "/slides"]) {
      const { unmount } = render(<Shell initialPath={path} />);
      const bar = getBar();
      for (const name of BAR_CONTROLS) {
        expect(
          within(bar).getByRole(name === "Home" ? "link" : "button", { name })
        ).toBeInTheDocument();
      }
      expect(within(bar).getAllByRole("link")).toHaveLength(1);
      expect(within(bar).getAllByRole("button")).toHaveLength(2);
      unmount();
    }
  });

  it("opens the menu overlay with every route in it", () => {
    render(<Shell />);
    const menuButton = within(getBar()).getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "app-menu");

    fireEvent.click(menuButton);

    const dialog = screen.getByRole("dialog", { name: /all pages/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    // Match on href, not label: two routes may share a word, and what matters
    // is that no route in the registry is unreachable from the overlay.
    const hrefs = within(dialog)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    for (const route of routes) {
      expect(hrefs).toContain(route.to);
    }
  });

  it("closes the overlay on Escape and restores focus to the menu button", () => {
    render(<Shell />);
    const menuButton = within(getBar()).getByRole("button", { name: "Menu" });
    fireEvent.click(menuButton);
    expect(screen.getByRole("dialog", { name: /all pages/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: /all pages/i })).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(menuButton);
  });

  it("marks the active route with aria-current inside the overlay", () => {
    render(<Shell initialPath="/guide" />);
    fireEvent.click(within(getBar()).getByRole("button", { name: "Menu" }));

    const dialog = screen.getByRole("dialog", { name: /all pages/i });
    expect(within(dialog).getByRole("link", { name: /^Guide/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("marks Home in the bar with aria-current on the home route", () => {
    render(<Shell initialPath="/" />);
    expect(within(getBar()).getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("reaches the command palette from the bar", () => {
    render(<Shell />);
    fireEvent.click(within(getBar()).getByRole("button", { name: "Search" }));
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });
});

describe("workshop spine stepper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("appears on a spine route, outside the top bar", () => {
    render(<Shell initialPath="/guide" />);
    const stepper = screen.getByRole("navigation", { name: "Workshop steps" });
    expect(within(stepper).getByText(/step 2 of/i)).toBeInTheDocument();
    // The top chrome is invariant: the stepper is never inside it.
    expect(within(getBar()).queryByText(/step \d+ of/i)).not.toBeInTheDocument();
  });

  it("does not render off the spine", () => {
    render(<Shell initialPath="/resources" />);
    expect(
      screen.queryByRole("navigation", { name: "Workshop steps" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/step \d+ of/i)).not.toBeInTheDocument();
  });
});

describe("presenting variant", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-hides on /slides after the pointer goes still", async () => {
    render(<Shell initialPath="/slides" />);
    const bar = getBar();
    expect(bar).not.toHaveAttribute("inert");

    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(bar).toHaveAttribute("inert");

    await act(async () => {
      fireEvent.mouseMove(window);
    });
    expect(bar).not.toHaveAttribute("inert");
  });

  it("never hides while it holds focus", async () => {
    render(<Shell initialPath="/slides" />);
    const bar = getBar();
    within(bar).getByRole("button", { name: "Menu" }).focus();

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(bar).not.toHaveAttribute("inert");
  });

  it("stays put on a normal route", async () => {
    render(<Shell initialPath="/resources" />);
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(getBar()).not.toHaveAttribute("inert");
  });
});
