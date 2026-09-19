import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { RipcordStarter } from "./RipcordStarter";

describe("RipcordStarter", () => {
  it("pulls on click", () => {
    const onPull = vi.fn();
    render(<RipcordStarter onPull={onPull} />);

    fireEvent.click(screen.getByRole("button", { name: "PULL THE CORD" }));

    expect(onPull).toHaveBeenCalledTimes(1);
  });

  it("pulls on Enter and Space", () => {
    const onEnter = vi.fn();
    const { unmount } = render(<RipcordStarter onPull={onEnter} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onEnter).toHaveBeenCalledTimes(1);
    unmount();

    const onSpace = vi.fn();
    render(<RipcordStarter variant="compact" onPull={onSpace} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onSpace).toHaveBeenCalledTimes(1);
  });

  it("pulls on a drag of the handle past the threshold", () => {
    const onPull = vi.fn();
    render(<RipcordStarter onPull={onPull} />);
    const button = screen.getByRole("button");

    fireEvent.pointerDown(button, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(button, { clientX: 110, pointerId: 1 });
    expect(onPull).not.toHaveBeenCalled();
    fireEvent.pointerMove(button, { clientX: 400, pointerId: 1 });
    fireEvent.pointerUp(button, { clientX: 400, pointerId: 1 });
    fireEvent.click(button);

    expect(onPull).toHaveBeenCalledTimes(1);
  });

  it("does not pull again once fired", () => {
    const onPull = vi.fn();
    render(<RipcordStarter fired onPull={onPull} frame={1} />);
    const button = screen.getByRole("button", { name: "RUNNING" });

    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Enter" });

    expect(onPull).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  /* Drives rAF and the clock by hand, so "a second later" is a real assertion
     and not a sleep. */
  const manualFrames = () => {
    let now = 0;
    let queue = [];
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (cb) => queue.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    return {
      advance(ms) {
        now += ms;
        const due = queue;
        queue = [];
        act(() => due.forEach((cb) => cb(now)));
      },
      restore() {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
      },
    };
  };

  it("keeps the chain turning after the engine catches", () => {
    const clock = manualFrames();
    try {
      const { container } = render(<RipcordStarter fired />);
      const chain = () => container.querySelector("path[stroke-dasharray]").getAttribute("stroke-dashoffset");

      clock.advance(1800); // the pull lands; the beat clock is done at t = 1
      const landed = chain();

      clock.advance(120); // …and the saw is still running
      const idling = chain();
      expect(idling).not.toBe(landed);

      clock.advance(120);
      expect(chain()).not.toBe(idling);
    } finally {
      clock.restore();
    }
  });

  it("holds still under an explicit frame, so previews and PDF export never drift", () => {
    const first = render(<RipcordStarter fired frame={1} />);
    const markup = first.container.innerHTML;
    first.unmount();

    const second = render(<RipcordStarter fired frame={1} />);
    expect(second.container.innerHTML).toBe(markup);
  });

  it("renders the armed and finished frames for both variants", () => {
    for (const variant of ["hero", "compact"]) {
      const { container, unmount } = render(
        <RipcordStarter variant={variant} frame={0} label="KICK OFF THE BUILD" />,
      );
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.textContent).toContain("KICK OFF THE BUILD");
      unmount();

      const done = render(<RipcordStarter variant={variant} fired frame={1} firedLabel="BUILDING" />);
      expect(done.container.textContent).toContain("BUILDING");
      expect(done.container.textContent).toContain("VRRRMM");
      done.unmount();
    }
  });
});
