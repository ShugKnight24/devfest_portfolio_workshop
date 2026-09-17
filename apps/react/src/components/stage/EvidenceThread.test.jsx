import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvidenceThread } from "./EvidenceThread";

describe("EvidenceThread", () => {
  it("calls onPull when the tag is clicked", () => {
    const onPull = vi.fn();
    render(<EvidenceThread onPull={onPull} frame={0} />);

    fireEvent.click(screen.getByRole("button", { name: /BRING BACKUP/ }));

    expect(onPull).toHaveBeenCalledTimes(1);
  });

  it("calls onPull on Enter and Space", () => {
    const onPull = vi.fn();
    render(<EvidenceThread onPull={onPull} frame={0} />);
    const tag = screen.getByRole("button", { name: /BRING BACKUP/ });

    fireEvent.keyDown(tag, { key: "Enter" });
    fireEvent.keyDown(tag, { key: " " });

    expect(onPull).toHaveBeenCalledTimes(2);
  });

  it("fires once when the tag is dragged down past the threshold", () => {
    const onPull = vi.fn();
    render(<EvidenceThread onPull={onPull} frame={0} />);
    const tag = screen.getByRole("button", { name: /BRING BACKUP/ });

    fireEvent.pointerDown(tag, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(tag, { clientY: 110, pointerId: 1 });
    expect(onPull).not.toHaveBeenCalled();
    fireEvent.pointerMove(tag, { clientY: 140, pointerId: 1 });
    fireEvent.pointerUp(tag, { clientY: 140, pointerId: 1 });
    fireEvent.click(tag);

    expect(onPull).toHaveBeenCalledTimes(1);
  });

  it("is inert once fired", () => {
    const onPull = vi.fn();
    render(<EvidenceThread onPull={onPull} fired frame={1} />);
    const tag = screen.getByRole("button", { name: /BRING BACKUP/ });

    fireEvent.click(tag);
    fireEvent.keyDown(tag, { key: "Enter" });

    expect(onPull).not.toHaveBeenCalled();
    expect(tag.getAttribute("aria-disabled")).toBe("true");
  });

  it.each(["hero", "compact"])("renders the %s variant armed and finished", (variant) => {
    const items = [
      { label: "BLAME LINE", sub: "who, when" },
      { label: "A LABEL FAR TOO LONG FOR ANY CARD", sub: "the why" },
    ];
    const { container, unmount } = render(<EvidenceThread variant={variant} frame={0} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("NEAGLEY");
    expect(container.textContent).not.toContain("BACKUP ARRIVED");
    unmount();

    const done = render(<EvidenceThread variant={variant} fired frame={1} items={items} stamp="CASE CLOSED" />);
    expect(done.container.textContent).toContain("CASE CLOSED");
    expect(done.container.textContent).toContain("BLAME LINE");
    expect(done.container.textContent).toContain("…");
  });
});
