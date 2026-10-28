import { useState, useEffect, useCallback, useRef } from "react";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { SpeakerOff, SpeakerOn } from "./Icons";
import StudentBuildingScene from "./StudentBuildingScene";

/**
 * InteractiveLearningScene — your desk, on the same stage as the factory.
 *
 * The factory above shows the crew building other people's software; this is
 * where the visitor sits. The illustrated desk (avatar, Luna, companions, the
 * plushie shelf — all customisable) leads, and one control rail beside it
 * holds the rest: the mindset you are working in and the one action, ship a
 * commit.
 *
 * Everything is in the stage's art direction (dark panel, hairlines, mono
 * kickers) in both themes, so the home page reads as one designed object.
 * Sound is parametric Web Audio, off until asked for.
 */

const MODES = {
  flow: {
    id: "flow",
    name: "Flow",
    title: "Flow State",
    subtitle: "Chainsaw Man Momentum",
    accent: "#ff3d6e",
    accentRgb: "255 61 110",
    tagline: "Don't let perfection stall your momentum. Pull the cord and build live.",
    audioTone: 520,
  },
  focus: {
    id: "focus",
    name: "Focus",
    title: "Deductive Focus",
    subtitle: "The Reacher Protocol",
    accent: "#00e5ff",
    accentRgb: "0 229 255",
    tagline: "Cut the noise. Read the scene, isolate the root cause, then act.",
    audioTone: 440,
  },
  discipline: {
    id: "discipline",
    name: "Form",
    title: "Iron Discipline",
    subtitle: "Cognitive Hypertrophy",
    accent: "#ffb300",
    accentRgb: "255 179 0",
    tagline: "Every tricky bug conquered builds permanent mental muscle. Strict form wins.",
    audioTone: 330,
  },
};

// Celebration particles: SVG icon names plus literal code-syntax fragments
const PARTICLE_SYMBOLS = [
  { icon: "lightning" },
  { icon: "sparkles" },
  { text: "</>" },
  { text: "{}" },
  { text: "=>" },
  { icon: "trophy" },
  { icon: "lightbulb" },
  { icon: "brain" },
];

const DEV_TRUTHS = [
  "Learning is challenging, but building software that solves your real problems makes it addictive.",
  "The syntax barrier is dead. Your ideas, your taste, and your discipline are what matter now.",
  "Every master engineer was once a beginner who refused to quit when the console went red.",
  "You are only one small, focused project away from changing your entire career trajectory.",
  "Code at the speed of thought: eliminate noise, ride momentum, and keep your form flawless.",
];

const XP_PER_COMMIT = 15;
const MILESTONE = 60;

const readXp = () => {
  try {
    const saved = localStorage.getItem("devfest_learning_xp");
    return saved ? parseInt(saved, 10) : 150;
  } catch {
    return 150;
  }
};

export const InteractiveLearningScene = () => {
  const [activeMode, setActiveMode] = useState("flow");
  const [xp, setXp] = useState(readXp);
  const [commits, setCommits] = useState(0);
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const audioCtxRef = useRef(null);

  const mode = MODES[activeMode];
  const toNext = MILESTONE - (xp % MILESTONE);
  const progress = (xp % MILESTONE) / MILESTONE;

  // Rotate the dev truths slowly; they are a footnote, not a feature.
  useEffect(() => {
    const timer = setInterval(() => setQuoteIndex((prev) => (prev + 1) % DEV_TRUTHS.length), 9000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio parametric synthesis (zero audio dependencies)
  const playBeep = useCallback(
    (freq = 440, type = "sine", duration = 0.08) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio autoplay policy fallback
      }
    },
    [soundEnabled],
  );

  const shipCommit = () => {
    const next = xp + XP_PER_COMMIT;
    setXp(next);
    try {
      localStorage.setItem("devfest_learning_xp", String(next));
    } catch {
      // Private mode: XP just will not persist.
    }
    setCommits((n) => n + 1);
    playBeep(mode.audioTone, "triangle", 0.12);

    const sym = PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)];
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingParticles((prev) => [...prev.slice(-5), { id, ...sym, x: 15 + Math.floor(Math.random() * 70) }]);
    setTimeout(() => setFloatingParticles((prev) => prev.filter((p) => p.id !== id)), 1400);

    // Crossing a milestone gets one line of acknowledgement, then gets out of the way.
    if (Math.floor(next / MILESTONE) > Math.floor(xp / MILESTONE)) {
      setNotice(`Milestone: ${next} XP`);
      playBeep(mode.audioTone * 1.5, "sine", 0.2);
      setTimeout(() => setNotice(""), 2600);
    }
  };

  return (
    <section
      aria-labelledby="desk-heading"
      className="stage relative w-full overflow-clip border"
      style={{
        // The mood re-tints the whole desk: borders, focus rings and the studio follow it.
        "--stage-accent": mode.accent,
        "--stage-accent-rgb": mode.accentRgb,
        borderColor: "var(--stage-border)",
        borderRadius: "var(--stage-radius-lg)",
        backgroundColor: "var(--stage-bg)",
        color: "var(--stage-text)",
      }}
    >
      {/* The mode's colour, as light from off-stage rather than a tinted box. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/3 h-72 w-[60%] rounded-full opacity-25 blur-3xl transition-colors duration-700"
        style={{ backgroundColor: mode.accent }}
      />

      {/* Header: what this is, and the one piece of state worth showing. */}
      <header className="relative flex flex-wrap items-end justify-between gap-4 border-b px-5 py-4 md:px-7" style={{ borderColor: "var(--stage-border)" }}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--stage-text-muted)" }}>
            <span style={{ color: "var(--stage-accent)" }}>//</span> Interactive Learning Scene
          </p>
          <h2 id="desk-heading" className="mt-1 text-xl font-black tracking-tight md:text-2xl">
            Your desk. <span style={{ color: mode.accent }}>{mode.title}.</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* The one action: a small pill, not a panel. Particles rise out of it. */}
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-full h-24 overflow-visible">
              {floatingParticles.map((p) => (
                <span
                  key={p.id}
                  className="absolute flex items-center gap-1 font-mono text-sm font-bold"
                  style={{ left: `${p.x}%`, bottom: 0, color: mode.accent, animation: "slide-up 1.2s ease-out forwards" }}
                >
                  {p.icon ? <EmojiIcon name={p.icon} className="h-4 w-4" /> : p.text} +{XP_PER_COMMIT}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={shipCommit}
              className="relative flex h-9 items-center gap-2.5 overflow-hidden rounded-full pl-3.5 pr-4 font-mono text-[11px] font-bold uppercase tracking-widest transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: mode.accent, color: "#05070a" }}
            >
              <EmojiIcon name="keyboard" className="h-4 w-4" />
              Ship a commit ({commits})
              <span className="font-black opacity-70">{xp} XP</span>
              {/* Progress to the next milestone, as the pill's own baseline. */}
              <span
                className="absolute inset-x-0 bottom-0 h-[3px]"
                style={{ backgroundColor: "rgb(0 0 0 / 0.2)" }}
                role="progressbar"
                aria-label="Progress to next milestone"
                aria-valuemin={0}
                aria-valuemax={MILESTONE}
                aria-valuenow={xp % MILESTONE}
              >
                <span className="block h-full transition-[width] duration-500" style={{ width: `${Math.max(4, progress * 100)}%`, backgroundColor: "rgb(0 0 0 / 0.55)" }} />
              </span>
            </button>
            <span className="sr-only" aria-live="polite">
              {notice || `${toNext} XP to next milestone`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playBeep(520, "sine", 0.1);
            }}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Sound on" : "Sound off"}
            className="grid h-9 w-9 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--stage-accent)"
            style={{
              borderColor: soundEnabled ? "var(--stage-border-strong)" : "var(--stage-border)",
              color: soundEnabled ? "var(--stage-text)" : "var(--stage-text-muted)",
            }}
          >
            {soundEnabled ? <SpeakerOn className="h-3.5 w-3.5" /> : <SpeakerOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/*
       * The scene and its Studio, side by side. The mood is the room's light:
       * chips under the scene relight the lamp, the screens and the whole desk.
       */}
      <StudentBuildingScene
        className="relative w-full"
        accent={mode.accent}
        footer={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
            <div role="radiogroup" aria-label="Mood lighting" className="flex gap-1.5">
              {Object.values(MODES).map((m) => {
                const on = m.id === activeMode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`${m.title}: ${m.subtitle}`}
                    onClick={() => {
                      setActiveMode(m.id);
                      playBeep(m.audioTone, "sine", 0.1);
                    }}
                    className="flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--stage-accent)"
                    style={{
                      borderColor: on ? m.accent : "var(--stage-border)",
                      backgroundColor: on ? `rgb(${m.accentRgb} / 0.14)` : "transparent",
                      color: on ? "var(--stage-text)" : "var(--stage-text-muted)",
                    }}
                  >
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.accent, boxShadow: on ? `0 0 10px ${m.accent}` : "none" }} />
                    {m.name}
                  </button>
                );
              })}
            </div>
            <p className="m-0 min-w-0 flex-1 truncate text-[12px]" style={{ color: "var(--stage-text-muted)" }}>
              <span className="font-bold" style={{ color: mode.accent }}>
                {mode.subtitle}
              </span>{" "}
              · {mode.tagline}
            </p>
          </div>
        }
      />

      <footer className="relative border-t px-5 py-3 text-center font-mono text-[11px] md:px-7" style={{ borderColor: "var(--stage-border)", color: "var(--stage-text-muted)" }}>
        <span style={{ color: "var(--stage-accent)" }}>dev truth //</span> {DEV_TRUTHS[quoteIndex]}
      </footer>
    </section>
  );
};

export default InteractiveLearningScene;
