import { Link } from "react-router-dom";
import { EmojiIcon } from "../components/Icons/EmojiIcon";
import { InteractiveLearningScene } from "../components/InteractiveLearningScene";
import { useShell } from "../context/ShellContext";
import { getUpcomingEvents } from "../data/eventsData";

/**
 * Where a visitor should go first, by why they are here. Someone who just
 * walked out of the talk, someone following along at a laptop, and someone who
 * found the repo cold all want different first clicks. Each door also sets the
 * nav shell's mode, so the rest of the app narrows to match the intent.
 */
const doors = [
  {
    id: "watch",
    mode: "stage",
    to: "/slides",
    kicker: "I was in the room",
    title: "Replay the talk",
    desc: "The deck, the live-build beats, and every speaker note. Runs at 15, 30, or 60 minutes.",
  },
  {
    id: "build",
    mode: "workshop",
    to: "/guide",
    kicker: "I want to build",
    title: "Start the workshop",
    desc: "The guided path, in order, from setup to a deployed portfolio you own.",
  },
  {
    id: "explore",
    mode: "explore",
    to: "/operatives",
    kicker: "I'm just looking",
    title: "Poke at the sandbox",
    desc: "Agentic Studio, Operatives, and every experiment behind the talk.",
  },
];

export const LandingPage = () => {
  const { setMode } = useShell();
  const nextEvent = getUpcomingEvents()[0];
  const courses = [
    {
      id: "react",
      title: "React 19 Workshop",
      description: "Build a modular, state-driven portfolio using modern React, custom hooks, and Tailwind CSS v4.",
      difficulty: "Intermediate",
      duration: "60-90 mins",
      icon: "atom",
      link: "/builder",
      active: true,
      color: "from-cyan-400 to-blue-500 text-cyan-700 dark:text-cyan-400",
      features: ["Vite 7 + React 19", "Context Providers", "Component Variant Pattern", "Full Vitest Suite"]
    },
    {
      id: "vanilla",
      title: "Vanilla JS Workshop",
      description: "Understand the fundamentals of web development with zero-dependency HTML5, CSS3, and DOM manipulation.",
      difficulty: "Beginner",
      duration: "45-60 mins",
      icon: "lightning",
      link: "/guide", // links to the guide showing how to run it
      active: true,
      color: "from-amber-400 to-orange-500 text-amber-800 dark:text-amber-400",
      features: ["Zero Dependencies", "Semantic HTML5", "CSS Custom Properties", "Works Offline via file://"]
    },
    {
      id: "vue",
      title: "Vue 3 Workshop",
      description: "Master reactive single-file components and Pinia state management in a sleek Vue framework.",
      difficulty: "Intermediate",
      duration: "60 mins",
      icon: "palette",
      link: "/lessons?track=vue",
      active: true,
      color: "from-emerald-400 to-teal-500 text-emerald-700 dark:text-emerald-400",
      features: ["Vite + Vue 3", "Composition API", "Scoped Styling", "SFC Architecture"]
    },
    {
      id: "svelte",
      title: "SvelteKit Workshop",
      description: "Build a compile-time optimized, fast-loading portfolio with Svelte reactive declarations.",
      difficulty: "Advanced",
      duration: "45 mins",
      icon: "brick",
      link: "/lessons?track=svelte",
      active: true,
      color: "from-red-400 to-pink-500 text-red-700 dark:text-red-400",
      features: ["SvelteKit Routing", "Reactive Declarations", "Built-in Stores", "Optimal Bundle Size"]
    },
    {
      id: "agentic",
      title: "Agentic Dev & Personalized Software",
      description: "Master prompt-to-app speedruns, Context Engineering, and subagent orchestration tailored across 4 audience tiers.",
      difficulty: "4 Tiers (Novice to Architect)",
      duration: "60-90 mins",
      icon: "robot",
      link: "/agentic-studio",
      active: true,
      color: "from-purple-400 to-violet-500 text-purple-700 dark:text-purple-400",
      features: ["Audience of One Apps", "Context Engineering (AGENTS.md)", "Subagent Triage (cavecrew)", "Token Economics (caveman/cove)"]
    }
  ];

  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) py-24 px-4 overflow-hidden relative selection:bg-(--color-primary)/30 transition-colors duration-300">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-(--color-primary)/10 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full bg-(--color-accent)/10 blur-[120px] pointer-events-none animate-pulse duration-7000"></div>

      <div className="max-w-6xl mx-auto space-y-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary)/10 border border-(--color-primary)/25 text-(--color-primary) rounded-full text-xs font-semibold uppercase tracking-widest shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-primary) opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-primary)"></span>
            </span>
            {nextEvent ? `${nextEvent.shortTitle} — ${nextEvent.date}` : "Live"}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-(--color-text) dark:text-(--color-text-dark)">
            Coding at the <br />
            <span className="text-(--color-primary)">
              Speed of Thought
            </span>
          </h1>
          <p className="text-lg md:text-xl text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium">
            The syntax barrier is dead. This is the workshop for what comes after it:
            deduce the real problem, direct the machine, and audit what comes back.
            Build software for an Audience of One — starting with your own Tuesday.
          </p>
          {/* Keyboard hint only where there is a keyboard. */}
          <p className="hidden md:block text-xs font-mono uppercase tracking-widest text-(--color-muted-text) dark:text-(--color-muted-text-dark) pt-2">
            Press <kbd className="px-1.5 py-0.5 rounded-[2px] border border-(--color-border) dark:border-(--color-border-dark) font-sans">⌘K</kbd> anywhere to jump to anything
          </p>
        </div>

        {/* Three doors: pick by intent, and the shell narrows to match. */}
        <section aria-labelledby="orientation-heading" className="space-y-6">
          <h2 id="orientation-heading" className="sr-only">
            Choose where to start
          </h2>
          <ul className="grid gap-4 md:grid-cols-3 list-none m-0 p-0">
            {doors.map((door) => (
              <li key={door.id}>
                <Link
                  id={`door-${door.id}`}
                  to={door.to}
                  onClick={() => setMode(door.mode)}
                  className="group h-full flex flex-col gap-2 p-6 rounded-[2px] border-l-[3px] border-l-(--color-primary)
                    border border-(--color-border) dark:border-(--color-border-dark)
                    bg-(--color-surface)/70 dark:bg-(--color-surface-dark)/70 backdrop-blur-md
                    hover:border-(--color-primary) transition-colors no-underline"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--color-primary)">
                    {door.kicker}
                  </span>
                  <span className="text-xl font-black tracking-tight text-(--color-text) dark:text-(--color-text-dark)">
                    {door.title}
                  </span>
                  <span className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) leading-relaxed">
                    {door.desc}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Interactive Animated Learning Centerpiece */}
        <InteractiveLearningScene />

        {/* Quick Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-(--color-surface)/70 dark:bg-(--color-surface-dark)/70 border border-(--color-border) dark:border-(--color-border-dark) rounded-2xl backdrop-blur-md shadow-sm">
          <div className="text-center space-y-1">
            <h3 className="text-3xl font-black text-(--color-primary)">5</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Course Tracks</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-3xl font-black text-(--color-primary)">32</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Curated Themes</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-3xl font-black text-(--color-primary)">100%</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Open Source</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-3xl font-black text-(--color-primary)">Real-Time</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Telemetry Engine</p>
          </div>
        </div>

        {/* Courses Section */}
        <div id="courses" className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-(--color-text) dark:text-(--color-text-dark) tracking-tight">Available Workshop Tracks</h2>
            <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium">Choose a framework below to begin building your project portfolio.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map(course => (
              <div
                key={course.id}
                className={`bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) rounded-2xl p-8 flex flex-col justify-between transition-all group backdrop-blur-md hover:-translate-y-1 hover:shadow-xl hover:shadow-(--color-primary)/5 ${
                  !course.active ? "opacity-60 hover:translate-y-0" : ""
                }`}
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 rounded-xl bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) border border-(--color-border) dark:border-(--color-border-dark) text-xl font-bold flex items-center justify-center shadow-md">
                      <EmojiIcon name={course.icon} className="w-8 h-8 text-(--color-primary)" />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-full">
                        {course.difficulty}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-full">
                        {course.duration}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-(--color-text) dark:text-(--color-text-dark) group-hover:text-(--color-primary) transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) text-sm leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60">
                    <h4 className="text-xs font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-widest mb-3">Syllabus Details</h4>
                    <ul className="grid grid-cols-2 gap-2 text-xs text-(--color-text) dark:text-(--color-text-dark) font-medium">
                      {course.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-(--color-primary)">&bull;</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  {course.active ? (
                    course.id === "vanilla" ? (
                      <Link
                        to="/guide"
                        className="w-full block text-center py-3 bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) hover:border-(--color-primary) border border-(--color-border) dark:border-(--color-border-dark) text-(--color-text) dark:text-(--color-text-dark) rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm"
                      >
                        Learn Vanilla Setup &rarr;
                      </Link>
                    ) : (
                      <Link
                        to={course.link}
                        className="w-full block text-center py-3 bg-(--color-primary) hover:opacity-90 text-(--color-primary-text,white) rounded-xl font-bold text-sm tracking-wide shadow-md transition-all hover:scale-[1.01]"
                      >
                        Enter Workspace &rarr;
                      </Link>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) border border-(--color-border) dark:border-(--color-border-dark) text-(--color-muted-text) rounded-xl font-bold text-sm tracking-wide cursor-not-allowed opacity-60"
                    >
                      Track Locked
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-(--color-text) dark:text-(--color-text-dark) tracking-tight">Starter Specifications</h2>
            <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Review and select the track that best fits your experience level and goals.</p>
          </div>
          
          <div className="overflow-x-auto border border-(--color-border) dark:border-(--color-border-dark) rounded-2xl bg-(--color-surface)/70 dark:bg-(--color-surface-dark)/70 backdrop-blur-md shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--color-border) dark:border-(--color-border-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-bold uppercase tracking-wider text-xs bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark)">
                  <th className="p-5">Feature Matrix</th>
                  <th className="p-5 text-amber-800 dark:text-amber-400">Vanilla HTML/JS</th>
                  <th className="p-5 text-(--color-primary)">React 19</th>
                  <th className="p-5 text-emerald-800 dark:text-emerald-400">Vue 3 (STUB)</th>
                  <th className="p-5 text-red-700 dark:text-red-400">Svelte (STUB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)/60 dark:divide-(--color-border-dark)/60 text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium">
                <tr>
                  <td className="p-5 text-(--color-text) dark:text-(--color-text-dark) font-bold">External Dependencies</td>
                  <td className="p-5">Zero</td>
                  <td className="p-5">React, Tailwind, Router</td>
                  <td className="p-5">Vue, Pinia</td>
                  <td className="p-5">SvelteKit</td>
                </tr>
                <tr>
                  <td className="p-5 text-(--color-text) dark:text-(--color-text-dark) font-bold">Build Step Required</td>
                  <td className="p-5">No (open index.html)</td>
                  <td className="p-5">Yes (Vite build)</td>
                  <td className="p-5">Yes (Vite build)</td>
                  <td className="p-5">Yes (SvelteKit compiler)</td>
                </tr>
                <tr>
                  <td className="p-5 text-(--color-text) dark:text-(--color-text-dark) font-bold">State Engine</td>
                  <td className="p-5">Global Scope / localStorage</td>
                  <td className="p-5">React Context / Hooks</td>
                  <td className="p-5">Pinia Stores / Ref</td>
                  <td className="p-5">Svelte Stores</td>
                </tr>
                <tr>
                  <td className="p-5 text-(--color-text) dark:text-(--color-text-dark) font-bold">Routing Method</td>
                  <td className="p-5">Hash-based (#slides)</td>
                  <td className="p-5">React Router (SPA)</td>
                  <td className="p-5">Vue Router</td>
                  <td className="p-5">File-system Routing</td>
                </tr>
                <tr>
                  <td className="p-5 text-(--color-text) dark:text-(--color-text-dark) font-bold">Testing Setup</td>
                  <td className="p-5">Manual</td>
                  <td className="p-5">Vitest + React Testing Lib</td>
                  <td className="p-5">Vitest + Vue Test Utils</td>
                  <td className="p-5">Vitest + Svelte Testing Lib</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
