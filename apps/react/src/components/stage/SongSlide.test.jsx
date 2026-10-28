import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SongSlide } from "./SongSlide";

vi.mock("../three/SceneStage", () => ({ default: () => null }));

const slide = {
  id: "song-iris-out",
  scene: "iris-out",
  kicker: "Before we start",
  moment: "The movie's theme",
  advanceOnEnd: true,
  song: { title: "IRIS OUT", artist: "Kenshi Yonezu", youtubeId: "LmZD-TU96q4", fallbackIds: ["cbuj8JEnXAc"] },
};

/** What the YouTube player posts back to the page. */
const fromPlayer = (data) =>
  act(() => {
    const frame = document.querySelector("iframe");
    window.dispatchEvent(new MessageEvent("message", { origin: "https://www.youtube-nocookie.com", source: frame.contentWindow, data: JSON.stringify(data) }));
  });

describe("SongSlide", () => {
  it("embeds exactly one video, and only while the slide is up", () => {
    const { rerender } = render(<SongSlide slide={slide} isActive={false} />);
    expect(document.querySelector("iframe")).toBe(null);
    rerender(<SongSlide slide={slide} isActive />);
    const src = document.querySelector("iframe").src;
    expect(src).toContain("/embed/LmZD-TU96q4?");
    expect(src).not.toContain("playlist=");
    expect(screen.getByRole("heading", { name: "IRIS OUT" })).toBeDefined();
  });

  it("falls back to the next upload, then to a link, when the network refuses the video", async () => {
    render(<SongSlide slide={slide} isActive />);
    await fromPlayer({ event: "onError", info: 150 });
    expect(document.querySelector("iframe").src).toContain("/embed/cbuj8JEnXAc?");
    await fromPlayer({ event: "onError", info: 150 });
    expect(document.querySelector("iframe")).toBe(null);
    expect(screen.getByRole("link", { name: "Play IRIS OUT on YouTube" }).getAttribute("href")).toBe("https://www.youtube.com/watch?v=LmZD-TU96q4");
  });

  it("goes half and half in theater without reloading the video", () => {
    render(<SongSlide slide={slide} isActive />);
    const frame = document.querySelector("iframe");
    fireEvent.keyDown(window, { key: "v" });
    const theater = screen.getByRole("dialog", { name: "IRIS OUT, video and film side by side" });
    expect(theater.className).toContain("grid-cols-2");
    expect(document.querySelector("iframe")).toBe(frame);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBe(null);
  });

  it("moves to the next song when this one ends", async () => {
    const onAdvance = vi.fn();
    render(<SongSlide slide={slide} isActive onAdvance={onAdvance} />);
    await fromPlayer({ event: "onStateChange", info: 0 });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
