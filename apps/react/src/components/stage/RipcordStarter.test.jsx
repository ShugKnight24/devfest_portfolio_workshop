import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
