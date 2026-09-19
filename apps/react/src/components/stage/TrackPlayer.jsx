import { useCallback, useEffect, useRef, useState } from "react";

/**
 * TrackPlayer — the one piece of music in the talk, and the switch that starts it.
 *
 * The audio lives in a ref on the page, not in an element in the slide tree, so
 * advancing off the title slide never unmounts it: you start the track once and
 * it plays under the whole talk. `useStageTrack` owns that ref; `TrackPlayer` is
 * only the control.
 *
 * The file is yours to supply — drop it at the `src` the deck declares. When it
 * is missing, or the browser refuses to decode it, the control says so and the
 * click still fires: the beat that hangs off "playing" (the chainsaw bleeding)
 * happens either way, so a missing file costs you the music, never the move.
 */

/**
 * @param {{ title: string, artist?: string, src?: string, loop?: boolean, volume?: number }} [track]
 */
export const useStageTrack = (track) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [silent, setSilent] = useState(false);

  /* Leaving the deck stops the music. Nothing else does — not a slide change,
     not a runtime change, not opening a flex zone. */
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const src = track?.src;

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setSilent(false);
  }, [src]);

  const toggle = useCallback(() => {
    if (!src || typeof Audio !== "function") {
      setSilent(true);
      setPlaying((prev) => !prev);
      return;
    }

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(src);
      audio.loop = track.loop ?? false;
      audio.volume = track.volume ?? 1;
      audio.addEventListener("ended", () => setPlaying(false));
      audioRef.current = audio;
    }

    /* Drive off our own state, not `audio.paused`: an element whose file is
       missing can sit in either state, and a control that will not turn off is
       worse on stage than one that plays nothing. */
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    setPlaying(true);
    /* A rejected play() is a missing file or a codec the browser will not
       take. Say so, and leave the visual running. */
    audio.play().then(
      () => setSilent(false),
      () => setSilent(true),
    );
  }, [src, playing, track?.loop, track?.volume]);

  return { playing, silent, toggle };
};

export const TrackPlayer = ({ track, playing, silent, onToggle, align = "center" }) => {
  if (!track?.title) return null;

  /* The missing-file note is only true while it is trying to play; paused, the
     line goes back to being a credit. */
  const status = !playing ? track.artist : silent ? "NO AUDIO FILE — VISUAL ONLY" : "NOW PLAYING";

  return (
    <div
      className={`print-hide flex items-center gap-3 ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={playing}
        aria-label={`${playing ? "Pause" : "Play"} ${track.title}${track.artist ? ` by ${track.artist}` : ""}`}
        className="shrink-0 flex items-center justify-center transition-all cursor-pointer"
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "var(--stage-radius)",
          border: "var(--stage-hairline) solid var(--stage-border-strong)",
          backgroundColor: playing ? "var(--stage-accent)" : "var(--stage-surface)",
          color: playing ? "var(--stage-on-accent)" : "var(--stage-accent)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          {playing ? (
            <>
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </>
          ) : (
            <path d="M4 2.5 L13 8 L4 13.5 Z" />
          )}
        </svg>
      </button>

      <div className={align === "center" ? "text-left" : undefined}>
        <p
          className="font-mono font-black uppercase tracking-tight m-0 leading-none"
          style={{ fontSize: "calc(var(--stage-fs-body) * 0.95)", color: "var(--stage-text)" }}
        >
          {track.title}
        </p>
        <p
          className="font-mono uppercase tracking-wider m-0 mt-1 leading-none text-[10px]"
          style={{ color: playing && !silent ? "var(--stage-accent)" : "var(--stage-text-dim)" }}
        >
          {status}
        </p>
      </div>
    </div>
  );
};

export default TrackPlayer;
