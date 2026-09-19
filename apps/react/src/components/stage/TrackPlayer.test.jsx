import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrackPlayer, useStageTrack } from "./TrackPlayer";

const TRACK = { title: "Power in the Blood", artist: "Polyphia", src: "/assets/audio/track.mp3" };

/* The hook and the control, wired the way the deck wires them. */
const Harness = ({ track = TRACK }) => {
  const { playing, silent, toggle } = useStageTrack(track);
  return (
    <>
      <TrackPlayer track={track} playing={playing} silent={silent} onToggle={toggle} />
      <span data-testid="state">{playing ? "playing" : "paused"}</span>
    </>
  );
};

describe("TrackPlayer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** A media element whose file never arrives: play() rejects and it stays paused. */
  const stubBrokenAudio = () => {
    const instance = {
      paused: true,
      loop: false,
      volume: 1,
      play: vi.fn(() => Promise.reject(new Error("404"))),
      pause: vi.fn(),
      addEventListener: vi.fn(),
    };
    /* A plain function, not an arrow: arrows are not constructable and `new
       Audio()` would throw before the component ever called play(). */
    vi.stubGlobal(
      "Audio",
      vi.fn(function FakeAudio() {
        return instance;
      }),
    );
    return instance;
  };

  it("names the track and credits the artist before anything plays", () => {
    render(<TrackPlayer track={TRACK} playing={false} silent={false} onToggle={() => {}} />);

    expect(screen.getByText("Power in the Blood")).toBeTruthy();
    expect(screen.getByText("Polyphia")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play Power in the Blood by Polyphia/ })).toBeTruthy();
  });

  it("starts the track on click", () => {
    const audio = stubBrokenAudio();
    render(<Harness />);

    fireEvent.click(screen.getByRole("button"));

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("state").textContent).toBe("playing");
  });

  it("still turns off when the file never loaded, because the control has to be trustworthy on stage", async () => {
    const audio = stubBrokenAudio();
    render(<Harness />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    await screen.findByText("NO AUDIO FILE — VISUAL ONLY");

    // The element is still `paused: true` — a toggle keyed off that would never stop.
    fireEvent.click(button);

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("state").textContent).toBe("paused");
    expect(screen.getByText("Polyphia")).toBeTruthy();
  });

  it("runs the visual with no src at all, so a forgotten file never costs the beat", () => {
    render(<Harness track={{ title: "Power in the Blood", artist: "Polyphia" }} />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByTestId("state").textContent).toBe("playing");
  });

  it("renders nothing without a track", () => {
    const { container } = render(<TrackPlayer playing={false} onToggle={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
