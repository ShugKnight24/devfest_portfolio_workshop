import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InkEnso } from "./InkEnso";

describe("InkEnso", () => {
  it("calls onPull on click, Enter and Space", () => {
    const onPull = vi.fn();
    render(<InkEnso onPull={onPull} frame={0} />);
    const tag = screen.getByRole("button", { name: /FIND YOUR WAY/ });

    fireEvent.click(tag);
    fireEvent.keyDown(tag, { key: "Enter" });
    fireEvent.keyDown(tag, { key: " " });

    expect(onPull).toHaveBeenCalledTimes(3);
  });

  it("does not pull again once fired", () => {
    const onPull = vi.fn();
    render(<InkEnso fired onPull={onPull} frame={1} />);

    fireEvent.click(screen.getByRole("button", { name: /pulled/ }));

    expect(onPull).not.toHaveBeenCalled();
  });

  it("shows the seal only once the stroke is done", () => {
    const { container, rerender } = render(<InkEnso fired frame={0.5} />);
    expect(container.textContent).not.toContain("道 ✓");
    rerender(<InkEnso fired frame={1} />);
    expect(container.textContent).toContain("道 ✓");
  });
});
