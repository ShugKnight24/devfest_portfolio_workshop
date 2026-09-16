import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StageSidebar } from "./StageSidebar";
import { RUNTIME_ORDER, RUNTIMES, TIER, selectSlides } from "../data/slides/runtime";

/**
 * The presenter sidebar holds every decision that used to crowd the top of the
 * slide: runtime, flex zones and deck. It is driven live, under stage lights,
 * so these tests pin the behaviour a speaker leans on.
 */

const SLIDES = [
  { id: "a", tier: TIER.CORE, altitude: "concept", budget: 60 },
  { id: "b", tier: TIER.EXTENDED, altitude: "tactical", budget: 60 },
  { id: "c", tier: TIER.DEEP, altitude: "concept", budget: 60 },
  { id: "z1", flex: true, zone: "while-it-builds", tier: TIER.EXTENDED, altitude: "concept", budget: 60 },
];

const ZONES = [{ id: "while-it-builds", label: "While It Builds", slides: [SLIDES[3]], seconds: 60 }];

const setup = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    deckTitle: "The Reacher Protocol",
    allSlides: SLIDES,
    runtimeId: "lightning",
    onRuntimeChange: vi.fn(),
    flexZones: ZONES,
    openZones: [],
    onToggleZone: vi.fn(),
    liveDecks: [
      { id: "combined", title: "Combined", subtitle: "The talk", slideCount: 4 },
      { id: "devfest", title: "DevFest", subtitle: "The workshop", slideCount: 9 },
    ],
    shelvedDecks: [{ id: "pride", title: "Pride", slideCount: 5, shelfReason: "Archive." }],
    activeDeckId: "combined",
    onSelectDeck: vi.fn(),
    ...overrides,
  };
  render(<StageSidebar {...props} />);
  return props;
};

describe("StageSidebar", () => {
  it("is a labelled dialog when open", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: /deck & runtime/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("is inert and unreachable when closed", () => {
    setup({ isOpen: false });
    const panel = document.getElementById("stage-sidebar");
    expect(panel).toHaveAttribute("inert");
  });

  it("offers every runtime, in order, with the one in use checked", () => {
    setup({ runtimeId: "standard" });
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.value)).toEqual(RUNTIME_ORDER);
    expect(screen.getByRole("radio", { name: /Standard/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Lightning/ })).not.toBeChecked();
  });

  it("shows what each runtime will actually present for this deck", () => {
    setup();
    for (const id of RUNTIME_ORDER) {
      const expected = selectSlides(SLIDES, { runtime: id }).length;
      const label = screen.getByRole("radio", { name: new RegExp(RUNTIMES[id].label) }).closest("label");
      expect(within(label).getByText(new RegExp(`${expected} slides`))).toBeInTheDocument();
    }
  });

  it("changes runtime when one is chosen", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("radio", { name: /Keynote/ }));
    expect(props.onRuntimeChange).toHaveBeenCalledWith("keynote");
  });

  it("toggles a flex zone and reports its state", () => {
    const props = setup({ openZones: ["while-it-builds"] });
    const zone = screen.getByRole("button", { name: /While It Builds/ });
    expect(zone).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(zone);
    expect(props.onToggleZone).toHaveBeenCalledWith("while-it-builds");
  });

  it("marks the current deck and switches to another", () => {
    const props = setup();
    expect(screen.getByRole("button", { name: /^Combined/ })).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: /^DevFest/ }));
    expect(props.onSelectDeck).toHaveBeenCalledWith("devfest");
  });

  it("keeps shelved decks reachable but tucked away", () => {
    setup();
    expect(screen.getByText(/Shelf/)).toBeInTheDocument();
    expect(screen.getByText("Archive.")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const props = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalled();
  });

  it("closes from its own close button", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /close presenter sidebar/i }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
