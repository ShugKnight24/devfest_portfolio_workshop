import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { TrackEmbed, TrackPlayer, useStageTrack } from "./TrackPlayer";

const TRACK = {
  title: "Power in the Blood",
  artist: "Polyphia",
  src: "/assets/audio/track.mp3",
  youtubeId: "fDltPLFdkYI",
};

/* The hook, the control and the embed, wired the way the deck wires them. */
const Harness = ({ track = TRACK }) => {
  const { playing, source, toggle } = useStageTrack(track);
  return (
    <>
      <TrackPlayer track={track} playing={playing} source={source} onToggle={toggle} />
      <TrackEmbed track={track} playing={playing} source={source} />
      <span data-testid="state">{playing ? `${source}:playing` : "paused"}</span>
    </>
  );
};

describe("TrackPlayer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Stands in for the media element, which is the only thing that can answer
   * whether a file decodes. `decodes` is the answer the probe gets.
   */
  const stubAudio = ({ decodes, playRejects = false } = {}) => {
    const made = [];
    vi.stubGlobal(
      "Audio",
      vi.fn(function FakeAudio() {
        const listeners = {};
        const instance = {
          paused: true,
          loop: false,
          volume: 1,
          preload: "",
          src: "",
          listeners,
          load: vi.fn(),
          play: vi.fn(() =>
            playRejects ? Promise.reject(new Error("no codec")) : Promise.resolve(),
          ),
          pause: vi.fn(),
          addEventListener: (name, fn) => {
            listeners[name] = fn;
          },
          removeEventListener: (name) => {
            delete listeners[name];
          },
        };
        made.push(instance);
        return instance;
      }),
    );

    return {
      made,
      settleProbe: async () => {
        await waitFor(() => expect(made[0]?.listeners.loadedmetadata).toBeTypeOf("function"));
        act(() => {
          made[0].listeners[decodes ? "loadedmetadata" : "error"]();
        });
      },
    };
  };

  it("names the track and credits the artist before anything plays", () => {
    render(<TrackPlayer track={TRACK} playing={false} source="local" onToggle={() => {}} />);

    expect(screen.getByText("Power in the Blood")).toBeTruthy();
    expect(screen.getByText("Polyphia")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play Power in the Blood by Polyphia/ })).toBeTruthy();
  });

  it("plays the local file when the file decodes", async () => {
    const audio = stubAudio({ decodes: true });
    render(<Harness />);
    await audio.settleProbe();

    fireEvent.click(screen.getByRole("button"));

    // The element built by the probe is the one that plays; nothing loads twice.
    expect(audio.made[0].play).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("state").textContent).toBe("local:playing");
    expect(screen.getByText("NOW PLAYING")).toBeTruthy();
  });

  it("falls back to the video when the file is not in the build", async () => {
    const audio = stubAudio({ decodes: false });
    const { container } = render(<Harness />);
    await audio.settleProbe();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByTestId("state").textContent).toBe("youtube:playing");
    const frame = container.querySelector("iframe");
    expect(frame.getAttribute("src")).toContain("/embed/fDltPLFdkYI");
    expect(frame.getAttribute("src")).toContain("autoplay=1");
    expect(screen.getByText("PLAYING VIA YOUTUBE")).toBeTruthy();
    expect(audio.made.every((a) => a.play.mock.calls.length === 0)).toBe(true);
  });

  it("hands off to the video when the file decodes but will not play", async () => {
    const audio = stubAudio({ decodes: true, playRejects: true });
    const { container } = render(<Harness />);
    await audio.settleProbe();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(container.querySelector("iframe")).not.toBeNull());
    expect(screen.getByTestId("state").textContent).toBe("youtube:playing");
  });

  it("takes the embed down on pause, because a song you cannot stop is worse than no song", async () => {
    const audio = stubAudio({ decodes: false });
    const { container } = render(<Harness />);
    await audio.settleProbe();
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(container.querySelector("iframe")).not.toBeNull();

    fireEvent.click(button);

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByTestId("state").textContent).toBe("paused");
    expect(screen.getByText("Polyphia")).toBeTruthy();
  });

  it("still turns off when nothing can play, because the control has to be trustworthy on stage", async () => {
    const audio = stubAudio({ decodes: true, playRejects: true });
    render(<Harness track={{ title: "Power in the Blood", artist: "Polyphia", src: "/gone.mp3" }} />);
    await audio.settleProbe();
    const button = screen.getByRole("button");

    fireEvent.click(button);
    await screen.findByText("NO AUDIO — VISUAL ONLY");

    // The element never left `paused: true` — a toggle keyed off that would never stop.
    fireEvent.click(button);

    expect(audio.made[0].pause).toHaveBeenCalled();
    expect(screen.getByTestId("state").textContent).toBe("paused");
  });

  it("runs the visual with no source at all, so a forgotten file never costs the beat", () => {
    render(<Harness track={{ title: "Power in the Blood", artist: "Polyphia" }} />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByTestId("state").textContent).toBe("silent:playing");
  });

  it("renders nothing without a track", () => {
    const { container } = render(<TrackPlayer playing={false} onToggle={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
