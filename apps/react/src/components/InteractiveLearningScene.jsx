import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { SpeakerOff, SpeakerOn } from "./Icons";
import StudentBuildingScene from "./StudentBuildingScene";

/**
 * InteractiveLearningScene — Engaging Gamified Stage for Learning
 *
 * Hooks, retains, and inspires attendees by turning learning into
 * an interactive, tactile experience. Connects foundational skill building
 * to their real-world dreams with Web Audio feedback, XP progression,
 * and mindset power-up modes (Flow, Focus, Discipline).
 */

const MODES = {
  flow: {
    id: "flow",
    name: "Flow State",
    subtitle: "Chainsaw Man Momentum",
    color: "from-pink-500 to-cyan-400",
    accent: "#ff0055",
    glow: "rgba(255, 0, 85, 0.25)",
    tagIcon: "lightning",
    tag: "Speed via Momentum",
    tagline: "Don't let perfection stall your momentum. Pull the ripcord and build live.",
    audioTone: 520,
  },
  focus: {
    id: "focus",
    name: "Deductive Focus",
    subtitle: "The Reacher Protocol",
    color: "from-cyan-400 to-blue-500",
    accent: "#00e5ff",
    glow: "rgba(0, 229, 255, 0.25)",
    tagIcon: "search",
    tag: "Speed via Deduction",
    tagline: "Cut the civilian noise. Isolate root causes and master the fundamental core.",
    audioTone: 440,
  },
  discipline: {
    id: "discipline",
    name: "Iron Discipline",
    subtitle: "Cognitive Hypertrophy",
    color: "from-amber-400 to-red-500",
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.25)",
    tagIcon: "dumbbell",
    tag: "Speed via Form",
    tagline: "Every tricky bug conquered builds permanent mental muscle. Strict form wins.",
    audioTone: 330,
  },
};

const DREAMS = [
  {
    id: "startup",
    title: "Launch My Startup / Product",
    desc: "Move from idea to live deployment in hours, not months.",
    recommended: "React 19 + Agentic Studio",
    link: "/agentic-studio",
    icon: "rocket",
  },
  {
    id: "career",
    title: "Land My Dream Tech Role",
    desc: "Build a distinctive, production-grade portfolio that outshines generic resumes.",
    recommended: "React 19 Workshop",
    link: "/builder",
    icon: "trophy",
  },
  {
    id: "bespoke",
    title: "Build for an Audience of One",
    desc: "Create bespoke sovereign micro-tools tailored specifically to your daily life.",
    recommended: "Agentic Dev & Labs",
    link: "/lessons?track=agentic",
    icon: "target",
  },
  {
    id: "foundations",
    title: "Master Core Web Fundamentals",
    desc: "Zero-dependency HTML5, CSS3, and DOM architecture that never goes out of style.",
    recommended: "Vanilla JS Workshop",
    link: "/guide",
    icon: "sparkles",
  },
];

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

export const InteractiveLearningScene = () => {
  const [activeMode, setActiveMode] = useState("flow");
  const [selectedDream, setSelectedDream] = useState("startup");
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("devfest_learning_xp");
    return saved ? parseInt(saved, 10) : 150;
  });
  const [streak] = useState(3);
  const [burstCount, setBurstCount] = useState(0);
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [bannerNotice, setBannerNotice] = useState(null);
  const audioCtxRef = useRef(null);

  const currentMode = MODES[activeMode];
  const currentDream = DREAMS.find((d) => d.id === selectedDream) || DREAMS[0];

  // Rotate motivational quotes smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % DEV_TRUTHS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio parametric synthesis (zero audio dependencies)
  const playBeep = useCallback((freq = 440, type = "sine", duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
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
  }, [soundEnabled]);

  // Click-to-build gamification action
  const handleCodeClick = () => {
    const newXp = xp + 15;
    setXp(newXp);
    localStorage.setItem("devfest_learning_xp", newXp.toString());
    setBurstCount((prev) => prev + 1);

    // Audio feedback
    playBeep(currentMode.audioTone, "triangle", 0.12);

    // Spawn floating celebration symbol
    const sym =
      PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)];
    const particleId = Date.now() + Math.random();
    const newParticle = {
      id: particleId,
      ...sym,
      x: Math.floor(Math.random() * 60) + 20, // percentage
    };
    setFloatingParticles((prev) => [...prev.slice(-6), newParticle]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== particleId));
    }, 1400);

    // Trigger milestone announcements
    if (newXp % 60 === 0) {
      setBannerNotice(`Milestone Reached! ${newXp} XP • Coding Momentum Active!`);
      playBeep(currentMode.audioTone * 1.5, "sine", 0.2);
      setTimeout(() => setBannerNotice(null), 3000);
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden border border-(--color-border) dark:border-(--color-border-dark) bg-gradient-to-b from-(--color-surface)/90 to-(--color-surface-dark)/90 backdrop-blur-xl shadow-2xl transition-all duration-500">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-700 blur-3xl"
        style={{ backgroundColor: currentMode.glow }}
      />

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {floatingParticles.map((p) => (
          <div
            key={p.id}
            className="absolute flex items-center gap-1.5 text-lg font-mono font-bold animate-bounce transition-all duration-1000"
            style={{
              left: `${p.x}%`,
              bottom: "35%",
              animation: "slide-up 1.2s ease-out forwards",
              color: currentMode.accent,
              textShadow: `0 0 10px ${currentMode.accent}`,
            }}
          >
            {p.icon ? (
              <EmojiIcon name={p.icon} className="w-5 h-5 shrink-0" />
            ) : (
              <span>{p.text}</span>
            )}
            <span>+15 XP</span>
          </div>
        ))}
      </div>

      {/* Top Header Bar: Stats, Sound Toggle & Mindset Mode */}
      <div className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-4 border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: currentMode.accent }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: currentMode.accent }}
            />
          </span>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Interactive Learning Scene
            </span>
            <div className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
              <span>{currentMode.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-gray-300">
                {currentMode.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Live Badges: XP, Streak, Audio */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono flex items-center gap-1.5 text-amber-400 shadow-inner">
            <EmojiIcon name="fire" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{streak} Day Streak</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono flex items-center gap-1.5 text-cyan-400 shadow-inner">
            <EmojiIcon name="sparkles" className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold">{xp} XP</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playBeep(520, "sine", 0.1);
            }}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-(--color-primary) ${
              soundEnabled
                ? "bg-purple-600/30 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-black/40 border-gray-800 text-gray-400 hover:text-white"
            }`}
            title={soundEnabled ? "Audio Effects Active" : "Enable Sound FX"}
            aria-label={soundEnabled ? "Sound enabled" : "Sound disabled"}
          >
            {soundEnabled ? (
              <SpeakerOn className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <SpeakerOff className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{soundEnabled ? "Sound: On" : "Sound: Off"}</span>
          </button>
        </div>
      </div>

      {/* Milestone Alert Banner */}
      {bannerNotice && (
        <div className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-mono font-bold text-center py-2 px-4 animate-fade-in relative z-20 flex items-center justify-center gap-2">
          <EmojiIcon name="sparkles" className="w-4 h-4 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Main Grid: Visual Animated Scene (Centerpiece) + Mindset Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 items-center relative z-10">
        {/* Left / Center: The Animated Student Building Scene */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-black/50 border border-gray-800 p-2 md:p-4 shadow-inner group">
          {/* Quick Tag Overlay */}
          <div className="absolute top-4 left-4 z-20">
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border backdrop-blur-md"
              style={{
                backgroundColor: `${currentMode.accent}18`,
                borderColor: currentMode.accent,
                color: currentMode.accent,
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <EmojiIcon name={currentMode.tagIcon} className="w-3.5 h-3.5 shrink-0" />
                {currentMode.tag}
              </span>
            </span>
          </div>

          {/* SVG Animated Component */}
          <div className="transform transition-transform duration-500 group-hover:scale-[1.01]">
            <StudentBuildingScene className="w-full h-auto drop-shadow-2xl" />
          </div>

          {/* Interactive Click-to-Hack Button directly on the scene */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              type="button"
              onClick={handleCodeClick}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                backgroundColor: currentMode.accent,
                color: "#020304",
                boxShadow: `0 0 20px ${currentMode.glow}`,
              }}
            >
              <EmojiIcon name="keyboard" className="w-4 h-4" />
              <span>Tap to Hack Code ({burstCount})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Mindset Power-Up Modes */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-1">
              Choose Your Learning Mindset
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Toggle mental models to adapt your flow state:
            </p>
          </div>

          <div className="space-y-3">
            {Object.values(MODES).map((mode) => {
              const isActive = mode.id === activeMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(mode.id);
                    playBeep(mode.audioTone, "sine", 0.1);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) ${
                    isActive
                      ? "bg-black/80 shadow-lg scale-[1.02]"
                      : "bg-white/5 dark:bg-black/30 border-gray-800 hover:border-gray-700 opacity-75 hover:opacity-100"
                  }`}
                  style={{
                    borderColor: isActive ? mode.accent : undefined,
                    boxShadow: isActive ? `0 0 20px ${mode.glow}` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ color: isActive ? mode.accent : "#94a3b8" }}
                    >
                      {mode.name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        Active Mode
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-(--color-text) dark:text-(--color-text-dark)">
                    {mode.subtitle}
                  </div>
                  <p className="text-[11px] text-(--color-muted-text) dark:text-(--color-muted-text-dark) leading-relaxed">
                    {mode.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dream Milestone Selector: "What is your dream?" */}
      <div className="px-6 md:px-8 py-6 bg-black/40 border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
              <EmojiIcon name="trophy" className="w-4 h-4 text-amber-400" />
              <span>Connect Today's Learning to Your Dream</span>
            </h4>
            <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Learning is not always easy—clarifying your ultimate dream makes the discipline worthwhile.
            </p>
          </div>

          <Link
            to={currentDream.link}
            className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all text-center flex items-center justify-center gap-2 shrink-0 hover:scale-105"
          >
            <span>Start {currentDream.recommended}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* 4 Dream Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {DREAMS.map((d) => {
            const isSelected = d.id === selectedDream;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDream(d.id);
                  playBeep(480, "triangle", 0.08);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) ${
                  isSelected
                    ? "bg-purple-950/40 border-purple-500 shadow-md scale-[1.02]"
                    : "bg-black/20 border-gray-800/80 hover:border-gray-700 text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <EmojiIcon name={d.icon} className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-xs font-bold text-(--color-text) dark:text-(--color-text-dark)">
                    {d.title}
                  </span>
                </div>
                <p className="text-[11px] text-(--color-muted-text) dark:text-(--color-muted-text-dark) line-clamp-2 leading-relaxed">
                  {d.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Motivational Dev Truth Rotating Bar */}
      <div className="px-6 md:px-8 py-3.5 bg-black/60 border-t border-gray-900 text-center text-xs text-gray-400 font-sans italic flex items-center justify-center gap-2">
        <span className="text-purple-400 font-bold not-italic font-mono text-[11px]">
          [DEV TRUTH]
        </span>
        <span className="transition-opacity duration-500">
          "{DEV_TRUTHS[quoteIndex]}"
        </span>
      </div>
    </div>
  );
};

export default InteractiveLearningScene;
