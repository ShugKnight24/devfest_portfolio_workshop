import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StudentBuildingScene } from "./StudentBuildingScene";
import { clearStoredAvatar, loadAvatar } from "../config/avatar";
import { BOOKCASE, COMPANION_KINDS, PLUSH_KINDS } from "../config/sceneItems";

const openPanel = () => fireEvent.click(screen.getByRole("button", { name: "Customize scene" }));

describe("StudentBuildingScene companions and plushies", () => {
  afterEach(() => {
    clearStoredAvatar();
  });

  it("opens with Luna on the floor and plushies on the bookcase", () => {
    render(<StudentBuildingScene />);

    expect(screen.getByRole("button", { name: /^Luna, movable/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Pochita plushie, movable/ })).toBeDefined();
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Luna, a fawn dog");
  });

  it("draws every companion kind and every plushie without crashing", () => {
    const companions = COMPANION_KINDS.slice(0, 8).map((kind, i) => ({ id: `c${i}`, kind: kind.id }));
    const rest = COMPANION_KINDS.slice(8).map((kind, i) => ({ id: `d${i}`, kind: kind.id }));

    const { unmount } = render(
      <StudentBuildingScene
        avatar={{ companions, plushies: PLUSH_KINDS.map((kind) => ({ kind: kind.id })) }}
      />,
    );
    unmount();
    render(<StudentBuildingScene avatar={{ companions: rest }} />);

    expect(screen.getByRole("img")).toBeDefined();
  });

  it("adds, re-coats and removes a companion from the panel", () => {
    render(<StudentBuildingScene />);
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Add Cat" }));
    expect(screen.getByRole("button", { name: /^Tabby cat, movable/ })).toBeDefined();

    fireEvent.click(screen.getAllByLabelText("Orange").find((input) => input.name.includes("cat-1")));
    expect(screen.getByRole("button", { name: /^Orange cat, movable/ })).toBeDefined();
    expect(loadAvatar().companions.find((c) => c.kind === "cat").variant).toBe("orange");

    fireEvent.click(screen.getByRole("button", { name: "Remove Orange cat" }));
    expect(screen.queryByRole("button", { name: /^Orange cat, movable/ })).toBe(null);
  });

  it("shelves and unshelves a plushie, and disables them with the bookcase off", () => {
    render(<StudentBuildingScene />);
    openPanel();

    const power = screen.getByRole("button", { name: "Power plushie" });
    expect(power.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(power);
    expect(power.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^Power plushie, movable/ })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Bookcase" }));
    expect(screen.queryByRole("button", { name: /plushie, movable/ })).toBe(null);
    expect(power.closest("fieldset").disabled).toBe(true);
  });

  it("moves a plushie down a shelf with the arrow key", () => {
    render(<StudentBuildingScene />);
    const pochita = screen.getByRole("button", { name: /^Pochita plushie, movable/ });

    fireEvent.keyDown(pochita, { key: "ArrowDown" });

    const moved = loadAvatar().plushies.find((plush) => plush.kind === "pochita");
    expect(moved.y).toBe(BOOKCASE.boards[1]);
  });

  it("lists companions with a count in the panel", () => {
    render(<StudentBuildingScene />);
    openPanel();
    const panel = screen.getByRole("group", { name: "Make it your desk" });
    expect(within(panel).getByText("1 / 8")).toBeDefined();
  });
});

describe("StudentBuildingScene customizer layout", () => {
  afterEach(() => {
    clearStoredAvatar();
  });

  it("keeps the hidden radios positioned inside the scrolling panel", () => {
    // jsdom has no layout, so this guards the contract rather than the scroll:
    // sr-only radios need a positioned ancestor inside the panel, or focusing
    // one scrolls the scene card out of view (see SceneCustomizer).
    render(<StudentBuildingScene />);
    openPanel();
    const panel = screen.getByRole("group", { name: "Make it your desk" });
    expect(panel.className.split(/\s+/)).toContain("relative");
    const radio = within(panel).getAllByRole("radio")[0];
    expect(radio.closest('[role="group"]')).toBe(panel);
  });
});
