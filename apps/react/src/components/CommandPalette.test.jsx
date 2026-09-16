/**
 * Command Palette & App Bar Tests
 *
 * The speaker drives this live, so the contract under test is the one they will
 * actually lean on: Cmd+K anywhere, arrows, Enter, Escape, and an app bar that
 * shows the same five section headings on every single route — including
 * /slides — so the app's structure is readable without opening anything.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { ShellProvider } from "../context/ShellContext";
import { CommandPalette } from "./CommandPalette";
import { Navigation } from "./Navigation";
import { routes, barSections } from "../config/navigation.js";

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

  it("shows every section heading, and no route links, in the bar", () => {
    render(<Shell />);
    const bar = getBar();

    // The structure is visible: one heading per section, always.
    for (const { section } of barSections()) {
      expect(within(bar).getByRole("button", { name: new RegExp(`^${section}`) })).toBeInTheDocument();
    }

    // Routes live in the dropdowns, never in the bar itself. That is the
    // invariant that stops the bar growing with the route list.
    expect(within(bar).queryByRole("link", { name: /Components/ })).not.toBeInTheDocument();
    expect(within(bar).queryByRole("link", { name: /Portfolio Builder/ })).not.toBeInTheDocument();
    // Home is the only link in the bar.
    expect(within(bar).getAllByRole("link")).toHaveLength(1);
  });

  it("renders the identical section set on every route, /slides included", () => {
    const expected = barSections().map((s) => s.section);
    for (const path of ["/", "/resources", "/dashboard/telemetry", "/slides"]) {
      const { unmount } = render(<Shell initialPath={path} />);
      const bar = getBar();
      for (const section of expected) {
        expect(
          within(bar).getByRole("button", { name: new RegExp(`^${section}`) }),
          `${section} missing on ${path}`
        ).toBeInTheDocument();
      }
      unmount();
    }
  });

  it("reveals a section's routes on click, and only that section's", () => {
    render(<Shell />);
    const bar = getBar();
    const [first, second] = barSections();

    fireEvent.click(within(bar).getByRole("button", { name: new RegExp(`^${first.section}`) }));

    for (const route of first.items) {
      expect(screen.getByRole("link", { name: new RegExp(route.label, "i") })).toBeInTheDocument();
    }
    // A different section's routes stay closed.
    const other = second.items[0];
    expect(screen.queryByRole("link", { name: new RegExp(`^${other.label}$`, "i") })).not.toBeInTheDocument();
  });

  it("keeps every route reachable across the sections", () => {
    render(<Shell />);
    const bar = getBar();
    const seen = new Set();

    for (const { section, items } of barSections()) {
      fireEvent.click(within(bar).getByRole("button", { name: new RegExp(`^${section}`) }));
      for (const route of items) seen.add(route.to);
    }
    // Every non-brand route lives under exactly one visible heading.
    for (const route of routes.filter((r) => !r.brand)) {
      expect(seen.has(route.to), `${route.to} is not under any section`).toBe(true);
    }
  });

  it("closes an open section on Escape and restores focus to its heading", () => {
    render(<Shell />);
    const bar = getBar();
    const { section, items } = barSections()[0];
    const heading = within(bar).getByRole("button", { name: new RegExp(`^${section}`) });

    fireEvent.click(heading);
    expect(heading).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(heading).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(heading);
    expect(screen.queryByRole("link", { name: new RegExp(`^${items[0].label}$`, "i") })).not.toBeInTheDocument();
  });

  it("marks the active route with aria-current inside its section", () => {
    const target = barSections()[0].items[0];
    render(<Shell initialPath={target.to} />);
    const bar = getBar();

    fireEvent.click(
      within(bar).getByRole("button", { name: new RegExp(`^${barSections()[0].section}`) })
    );
    const link = screen.getByRole("link", { name: new RegExp(target.label, "i") });
    expect(link).toHaveAttribute("aria-current", "page");
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
    within(bar).getByRole("button", { name: /Search/ }).focus();

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
