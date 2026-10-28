import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";

const SceneStage = lazy(() => import("../three/SceneStage"));

/**
 * SongSlide — one song, split down the middle: its official video on one
 * side, a short ink film of the same moment on the other.
 *
 * The pre-show is a run of these, one per song, in story order. The video is
 * mounted only while the slide is up, so leaving the slide stops the song and
 * arriving starts it (the clicker press is the user gesture autoplay needs).
 * With `advanceOnEnd`, the deck moves to the next song when this one finishes:
 * the YouTube player reports its state over postMessage once we say we are
 * listening, so no player API script is loaded.
 *
 * One video per embed, on purpose: chaining songs through YouTube's own
 * `playlist` parameter played the wrong songs under the wrong titles.
 *
 * Theater (V, or the button): the same two frames fill the screen, half and
 * half, video left and film right. The elements are restyled, not remounted,
 * so the song keeps playing straight through the switch. V or Esc leaves.
 *
 * Networks with YouTube's Restricted Mode on (schools, some venues) refuse
 * some music videos. When the player reports an error, the slide tries the
 * song's `fallbackIds` in turn, then shows a link instead; the film plays on.
 */

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const ENDED = 0;

const usePlayerEvents = (frameRef, active, { onEnd, onError, onTime }) => {
  useEffect(() => {
    if (!active) return undefined;
    const frame = frameRef.current;
    const listen = () => frame?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN);
    const onMessage = (event) => {
      if (event.origin !== YT_ORIGIN || event.source !== frame?.contentWindow) return;
      let data;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data?.event === "onError") onError?.(data.info);
      if (typeof data?.info?.currentTime === "number") onTime?.(data.info.currentTime);
      const state = data?.event === "onStateChange" ? data.info : data?.info?.playerState;
      if (state === ENDED) onEnd?.();
    };
    window.addEventListener("message", onMessage);
    frame?.addEventListener("load", listen);
    listen();
    return () => {
      window.removeEventListener("message", onMessage);
      frame?.removeEventListener("load", listen);
    };
  }, [frameRef, active, onEnd, onError, onTime]);
};

export const SongSlide = ({ slide, isActive, onAdvance }) => {
  const frameRef = useRef(null);
  const { song } = slide;
  const sources = [song.youtubeId, ...(song.fallbackIds ?? [])].filter(Boolean);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setAttempt(0), [slide.id]);
  const videoId = sources[attempt];
  // The song's own clock, for films cut to the music (IRIS OUT).
  const [clock, setClock] = useState(undefined);
  const onTime = useCallback((t) => setClock(t), []);
  const onError = useCallback(() => setAttempt((a) => a + 1), []);
  usePlayerEvents(frameRef, isActive, {
    onEnd: slide.advanceOnEnd ? onAdvance : null,
    onError,
    onTime: slide.syncToSong ? onTime : null,
  });
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1", enablejsapi: "1" });
  // The player's own subtitles, in English when the upload has them.
  if (song.captions) {
    params.set("cc_load_policy", "1");
    params.set("cc_lang_pref", "en");
    params.set("hl", "en");
  }
  if (typeof window !== "undefined") params.set("origin", window.location.origin);

  const [theater, setTheater] = useState(false);
  const theaterRef = useRef(null);
  useEffect(() => {
    if (!isActive) setTheater(false);
  }, [isActive]);
  useEffect(() => {
    if (!isActive) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "v" || e.key === "V") setTheater((on) => !on);
      else if (e.key === "Escape") setTheater(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive]);
  // Theater is real fullscreen on this element: the deck's slide wrapper is
  // transformed, which pins a merely `fixed` child to the slide's box. It also
  // works from inside the deck's own fullscreen; leaving returns to it.
  useEffect(() => {
    const el = theaterRef.current;
    if (theater && el && document.fullscreenElement !== el) el.requestFullscreen?.().catch(() => {});
    if (!theater && document.fullscreenElement === el) document.exitFullscreen?.().catch(() => {});
  }, [theater]);
  // Without fullscreen (some browsers, embedded panes), the overlay still has
  // to clear the deck's header and footer: the slide's <main> is its own layer
  // below them, so lift it while theater is up.
  useEffect(() => {
    const main = theaterRef.current?.closest("main");
    if (!theater || !main) return undefined;
    const before = main.style.zIndex;
    main.style.zIndex = "1000";
    return () => {
      main.style.zIndex = before;
    };
  }, [theater]);
  useEffect(() => {
    const onChange = () => {
      if (theater && document.fullscreenElement !== theaterRef.current) setTheater(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [theater]);

  const frame = theater
    ? { height: "100%", backgroundColor: "#000", border: 0 }
    : { aspectRatio: "16 / 9", borderColor: "var(--stage-border)", borderRadius: "var(--stage-radius)", backgroundColor: "#000" };

  return (
    <div className={`w-full transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="stage-kicker m-0">{slide.kicker}</p>
        <p className="m-0 flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--stage-text-muted)" }}>
          {slide.moment}
          <button
            type="button"
            onClick={() => setTheater(true)}
            className="stage-kicker border px-3 py-1.5"
            style={{ borderColor: "var(--stage-accent)", color: "var(--stage-accent)", borderRadius: "var(--stage-radius)" }}
          >
            Theater (V)
          </button>
        </p>
      </header>

      <div
        ref={theaterRef}
        className={theater ? "fixed inset-0 z-[1000] grid grid-cols-2 bg-black" : "grid w-full grid-cols-1 items-center gap-4 md:grid-cols-2"}
        role={theater ? "dialog" : undefined}
        aria-label={theater ? `${song.title}, video and film side by side` : undefined}
      >
        {/* The song */}
        <figure className="relative m-0 w-full overflow-hidden border" style={frame}>
          {isActive && videoId ? (
            <iframe
              ref={frameRef}
              key={videoId}
              title={`${song.title} by ${song.artist}`}
              src={`${YT_ORIGIN}/embed/${videoId}?${params}`}
              width="100%"
              height="100%"
              style={{ display: "block", border: 0, position: "absolute", inset: 0 }}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--stage-text-muted)" }}>
                {sources.length && attempt >= sources.length ? "This network won't play the video here" : song.title}
              </span>
              {sources.length > 0 && attempt >= sources.length && (
                <a
                  href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="stage-kicker border px-4 py-2"
                  style={{ borderColor: "var(--stage-accent)", color: "var(--stage-accent)", borderRadius: "var(--stage-radius)" }}
                >
                  Play {song.title} on YouTube
                </a>
              )}
            </div>
          )}
        </figure>

        {/* The story, in ink */}
        <figure className="relative m-0 w-full overflow-hidden border" style={{ ...frame, backgroundColor: "#0b1030" }}>
          <Suspense fallback={null}>
            <div className="absolute inset-0">{isActive && <SceneStage scene={slide.scene} clock={clock} label={slide.alt} className="h-full w-full" />}</div>
          </Suspense>
        </figure>
        {theater && (
          <button
            type="button"
            onClick={() => setTheater(false)}
            className="absolute right-3 top-3 z-10 font-mono text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100"
            style={{ color: "#fff" }}
          >
            V or Esc to exit
          </button>
        )}
      </div>

      <footer className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="m-0 font-black uppercase tracking-tight" style={{ fontSize: "clamp(1.6rem, 3.2vw, 3rem)", lineHeight: 1, color: "var(--stage-text)" }}>
          {song.title}
        </h2>
        <span className="font-mono text-sm uppercase tracking-widest" style={{ color: "var(--stage-accent)" }}>
          {song.artist}
        </span>
        {song.from && (
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--stage-text-muted)" }}>
            {song.from}
          </span>
        )}
      </footer>
    </div>
  );
};

export default SongSlide;
