import { useCallback, useEffect, useRef, useState } from "react";

/**
 * TrackPlayer — the one piece of music in the talk, and the switch that starts it.
 *
 * Two sources, because this deck lives in two places:
 *
 *   local    an audio file at `track.src`. What you present from. The file is
 *            gitignored, so it exists on the speaker's machine and nowhere else.
 *   youtube  the official video, embedded. What anyone who clones the repo or
 *            opens the deployed deck gets, since they have no file.
 *
 * Which one is decided before the click, not during it. On mount the file is
 * handed to a media element with `preload="metadata"`: if it decodes, that is
 * the source, and the same element is the one that plays. Asking the server
 * instead — a HEAD, a content-type — answers the wrong question and answers it
 * badly: a missing file under an SPA rewrite comes back as the index page with
 * status 200, and Vite's dev server labels a real audio file `text/html` on a
 * HEAD anyway. Only the decoder knows. Deciding inside the click would also
 * spend the user gesture browsers require to start sound, leaving the fallback
 * muted.
 *
 * The audio element lives in a ref on the page, not in an element in the slide
 * tree, so advancing off the title slide never unmounts it: start it once and it
 * plays under the whole talk. The YouTube iframe is rendered by the page for the
 * same reason.
 *
 * If neither source works the click still fires. Whatever hangs off "playing" —
 * the chainsaw bleeding — happens anyway, so a missing file costs the music,
 * never the move.
 */

const YT_ORIGIN = "https://www.youtube-nocookie.com";

const SOURCE = { local: "local", youtube: "youtube", silent: "silent" };

const fallbackFor = (track) => (track?.youtubeId ? SOURCE.youtube : SOURCE.silent);

/**
 * @param {{ title: string, artist?: string, src?: string, youtubeId?: string,
 *           loop?: boolean, volume?: number, start?: number }} [track]
 */
export const useStageTrack = (track) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState(() =>
    track?.src ? SOURCE.local : fallbackFor(track),
  );

  const src = track?.src;
  const youtubeId = track?.youtubeId;

  /* Leaving the deck stops the music. Nothing else does — not a slide change,
     not a runtime change, not opening a flex zone. */
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);

    if (!src || typeof Audio !== "function") {
      setSource(fallbackFor({ youtubeId }));
      return undefined;
    }

    setSource(SOURCE.local);

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;

    let cancelled = false;
    const decoded = () => {
      if (cancelled) return;
      audioRef.current = audio;
      setSource(SOURCE.local);
    };
    const failed = () => {
      if (cancelled) return;
      setSource(fallbackFor({ youtubeId }));
    };

    audio.addEventListener("loadedmetadata", decoded);
    audio.addEventListener("error", failed);
    audio.load?.();

    return () => {
      cancelled = true;
      audio.removeEventListener?.("loadedmetadata", decoded);
      audio.removeEventListener?.("error", failed);
    };
  }, [src, youtubeId]);

  const toggle = useCallback(() => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setPlaying(true);

    if (source !== SOURCE.local || !src || typeof Audio !== "function") return;

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(src);
      audioRef.current = audio;
    }
    audio.loop = track.loop ?? false;
    audio.volume = track.volume ?? 1;
    audio.onended = () => setPlaying(false);

    /* The probe said this was audio and the browser disagrees — a codec it will
       not take, or a file that vanished between the two. Hand off to the video
       if there is one; the click that got us here is recent enough to count as
       the gesture the iframe needs. */
    audio.play().catch(() => setSource(fallbackFor({ youtubeId })));
  }, [playing, source, src, youtubeId, track?.loop, track?.volume]);

  return { playing, source, toggle };
};

/**
 * The YouTube half, rendered by the page so it outlives the slide.
 *
 * Stopping unmounts the iframe rather than messaging it, because an unmounted
 * iframe is silent for certain and a postMessage that misses is a song you
 * cannot turn off in front of a room.
 */
export const TrackEmbed = ({ track, playing, source }) => {
  if (source !== SOURCE.youtube || !playing || !track?.youtubeId) return null;

  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    ...(track.start ? { start: String(track.start) } : {}),
  });

  return (
    <div
      className="print-hide fixed left-4 bottom-20 z-30 overflow-hidden"
      style={{
        width: "min(240px, 40vw)",
        aspectRatio: "16 / 9",
        borderRadius: "var(--stage-radius)",
        border: "var(--stage-hairline) solid var(--stage-border-strong)",
        backgroundColor: "#000",
      }}
    >
      <iframe
        title={`${track.title}${track.artist ? ` — ${track.artist}` : ""}`}
        src={`${YT_ORIGIN}/embed/${track.youtubeId}?${params}`}
        width="100%"
        height="100%"
        style={{ display: "block", border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
};

const STATUS = {
  [SOURCE.local]: "NOW PLAYING",
  [SOURCE.youtube]: "PLAYING VIA YOUTUBE",
  [SOURCE.silent]: "NO AUDIO — VISUAL ONLY",
};

export const TrackPlayer = ({ track, playing, source, onToggle, align = "center" }) => {
  if (!track?.title) return null;

  /* Paused, the line is a credit. Only while it is trying to play does how it
     is playing matter. */
  const status = playing ? STATUS[source] ?? STATUS[SOURCE.silent] : track.artist;

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
          style={{
            color:
              playing && source !== SOURCE.silent ? "var(--stage-accent)" : "var(--stage-text-dim)",
          }}
        >
          {status}
        </p>
      </div>
    </div>
  );
};

export default TrackPlayer;
