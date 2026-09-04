import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CodeBlock } from "../components/CodeBlock";
import { CopyButton } from "../components/CopyButton";
import { Checkmark, Close, Info, Chart, Cloud, Database } from "../components/Icons";
import { EmojiIcon } from "@portfolio/icons/react";

const TIERS = [
  {
    id: "novice",
    name: "Novice / Non-Coder",
    badge: "Level 1 • Vibe-Coding",
    color: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    summary: "Conversational prompt-to-app workflow. Zero setup, instant feedback, and bespoke micro-tools built for yourself.",
    focus: ["Plain-English prompts", "Zero-install web editors", "Audience of One mindset", "Quick visual prototypes"],
    agentRole: "AI is your lead engineer who writes and runs code while you direct the vision."
  },
  {
    id: "student",
    name: "Student / Junior",
    badge: "Level 2 • Proof of Work",
    color: "from-cyan-400 to-blue-500",
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    summary: "AI pair-programming for accelerated learning. Build portfolio projects, understand React hooks, and ace technical interviews.",
    focus: ["Interactive learning loops", "Guided bug fixing", "Portfolio project velocity", "Explaining tricky concepts"],
    agentRole: "AI is a senior mentor sitting beside you, reviewing PRs and explaining trade-offs."
  },
  {
    id: "experienced",
    name: "Experienced Dev",
    badge: "Level 3 • Rapid Scaffolding",
    color: "from-purple-400 to-violet-500",
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    summary: "High-speed feature execution and Context Engineering. CRISP frameworks, refactoring legacy debt, and TDD verification gates.",
    focus: ["CRISP prompt framework", "Context Engineering", "Automated Vitest gates", "Multi-file component systems"],
    agentRole: "AI is a hyper-fast autonomous junior teammate that drafts features and writes unit tests."
  },
  {
    id: "architect",
    name: "Senior & Architect",
    badge: "Level 4 • Agentic Harnessing",
    color: "from-amber-400 to-orange-500",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    summary: "Multi-subagent orchestration (cavecrew), token economics (caveman/cove), repository rules engines (AGENTS.md), and sovereign telemetry.",
    focus: ["Subagent triage pipelines", "Context compression (caveman/cove)", "Repo rules (AGENTS.md)", "Telemetry bot isolation"],
    agentRole: "AI is an orchestrated fleet of specialized subagents (Investigator, Builder, Reviewer) gated by CI."
  }
];

const POC_TEMPLATES = [
  {
    id: "conf-crm",
    title: "Conference Lead & Network Triage",
    category: "Conference & Networking",
    tier: ["novice", "student", "experienced", "architect"],
    description: "A fast, local-first CRM to scan badges, tag speaker notes, rate conversations, and export to markdown/JSON.",
    tech: "React 19 + Tailwind v4 + LocalStorage",
    scaffold: "npx create-vite conference-crm --template react && cd conference-crm && npm i lucide-react",
    spec: `## Goal
Build a private, lightning-fast Conference Networking App for an "Audience of One".

## Key Features
- Quick-add contact form: Name, Role, Company, LinkedIn/Twitter, Rating (1-5), and Audio/Text notes
- Auto-tagging: "Speaker", "Investor", "DevFest Detroit", "AI Founder"
- Quick Export: Download all leads as structured Markdown or CSV
- Offline First: All data stored in localStorage with zero cloud dependencies`,
    prompt: `Create a single-page React 19 app called "Conference Lead Triage" using Tailwind CSS.
Requirements:
1. Contact entry form with fast autofocus: Name, Organization, Handle, Key Discussion Points, Follow-up Priority (Urgent, Normal, Low).
2. Filterable grid of contact cards with search bar and tag filtering.
3. 1-click "Copy Follow-Up Email Draft" based on conversation notes.
4. "Export to Markdown" button that formats all contacts for Obsidian/Notion.
5. Dark mode first aesthetic with neon cyan and lime accents.`
  },
  {
    id: "fitness-state",
    title: "Jacked Alien: Workout State Machine",
    category: "Health & Fitness",
    tier: ["student", "experienced", "architect"],
    description: "A modular, distraction-free fitness state engine. Replaces bloated workout apps with finite set/rest timers and PR tracking.",
    tech: "React 19 + Custom Reducer / State Machine + Audio API",
    scaffold: "npx create-vite jacked-alien --template react && cd jacked-alien && npm i canvas-confetti",
    spec: `## Goal
Build a zero-latency lifting tracker that transitions between Workout States (Warmup -> Working Set -> Rest Timer -> Next Exercise).

## State Machine Architecture
- Idle -> ActiveSet -> RestTimer (Auto-beeps on zero) -> SetComplete -> ExerciseDone
- Dynamic 1RM calculations & progressive overload suggestions
- Zero ads, zero social feed, zero analytics tracking`,
    prompt: `Create a distraction-free Workout State Machine React component called "JackedAlienTracker".
Requirements:
1. Finite state machine handling: Setup -> Lifting -> Resting -> Completed.
2. Rest timer countdown with visual progress ring and Web Audio beep on completion.
3. Quick input for Weight (lbs/kg) and Reps, auto-incrementing previous personal bests.
4. LocalStorage persistence for workout history with JSON backup.
5. Minimalist terminal aesthetic: pitch black background with neon green status rings.`
  },
  {
    id: "invoice-calc",
    title: "Instant Freelance Invoice & Rate Calculator",
    category: "Business & Freelance",
    tier: ["novice", "student", "experienced"],
    description: "Calculate project margins, hourly vs value-based pricing, and generate clean PDF invoices without subscription SaaS.",
    tech: "React 19 + Tailwind v4 + Print Stylesheet",
    scaffold: "npx create-vite freelance-calc --template react && cd freelance-calc",
    spec: `## Goal
Calculate true hourly take-home after self-employment tax, expenses, and buffer hours.

## Features
- Interactive sliders: Target Annual Income, Billable Hours/Week, Tax Bracket
- 1-Click invoice generator that prints to clean A4/Letter PDF via CSS print media
- Zero monthly recurring cost`,
    prompt: `Build a React 19 tool called "Freelance Rate & Invoice Generator".
Requirements:
1. Target income calculator: takes desired net salary, estimated tax rate, software overhead, and computes required minimum billable hourly rate.
2. Line-item invoice builder: Add/remove deliverables with qty and unit price.
3. Print-optimized invoice view with @media print CSS that prints a clean, borderless client invoice.
4. Persistent client roster in localStorage.`
  },
  {
    id: "quote-card",
    title: "High-Frequency Social Quote Card Generator",
    category: "Creative & Content",
    tier: ["novice", "student"],
    description: "Transform raw keynote takeaways or book quotes into high-res 1080x1080 social graphics rendered directly via HTML5 Canvas.",
    tech: "HTML5 Canvas API + React 19",
    scaffold: "npx create-vite quote-cards --template react && cd quote-cards",
    spec: `## Goal
Generate bespoke social image cards for X / LinkedIn in seconds without Canva.

## Features
- Real-time Canvas preview with dynamic typography sizing
- 1-Click PNG download
- Preloaded typography presets (Editorial Serif, Brutalist Mono, Cyberpunk)`,
    prompt: `Build a React 19 "Quote Card Generator" using the HTML5 Canvas API.
Requirements:
1. Text input for Quote and Attribution author.
2. Real-time canvas drawing with auto-wrap text algorithm.
3. HTML5 Canvas rendering engine that generates 1080x1080 social quote cards with downloadable PNG button.
4. Color theme switcher for the social cards (Cyberpunk Dark, Clean Minimalist, Editorial Serif).`
  }
];

const SUBAGENT_SCENARIOS = {
  "auth-token": {
    name: "Auth Token Expiry Bug",
    badge: "Bugfix • Critical Path",
    file: "src/context/AuthContext.jsx",
    investigator: "AuthContext.jsx:42: Token expiry comparison uses `<` instead of `<=`, allowing stale sessions. Line 42 identified.",
    builder: "AuthContext.jsx:42-45 — edit comparison operator to `<=`. Clean diff: +1 line, -1 line. Cove zero-boilerplate pattern applied.",
    reviewer: "Diff audit: 0 regressions, 0 security vulnerabilities. Session invalidation contract verified against AuthSpec.md.",
    gate: "vitest: 54/54 tests passed across 5 test suites. (782ms) Gate verified."
  },
  "lcp-perf": {
    name: "Core Web Vitals: LCP Lag",
    badge: "Performance • CWV",
    file: "src/components/Header.jsx",
    investigator: "Header.jsx:18: Hero banner missing fetchpriority='high' and decoding='async'. LCP currently 2.8s on simulated 4G.",
    builder: "Header.jsx:18-24 — add fetchpriority='high', decoding='async', and webp srcset variants with layout container hints.",
    reviewer: "Lighthouse audit pass: LCP reduced from 2.8s to 0.7s (75% faster). CLS = 0.00. Performance budget cleared.",
    gate: "npm run build: 192 modules bundled cleanly in 1.06s. Zero bundle size regressions."
  },
  "sql-sanitize": {
    name: "Input Sanitization & Injection Guard",
    badge: "Security • OWASP Top 10",
    file: "src/utils/validators.js",
    investigator: "validators.js:14: Unescaped search filter param passed to in-memory query matcher. Vulnerable to injection vectors.",
    builder: "validators.js:14-19 — replace dynamic string concatenation with parameterized regex escaping and boundary checks.",
    reviewer: "Security review pass: OWASP Top 10 injection vector closed. Regex denial-of-service (ReDoS) safe.",
    gate: "vitest: 28 validator tests passed in 6ms. Production security gate clear."
  }
};

const VERIFICATION_SCENARIOS = {
  "all-pass": {
    name: "Clean Conventional PR",
    description: "Scoped atomic diff strictly adhering to AGENTS.md rules, with passing unit tests and clean imports.",
    lint: { pass: true, msg: "0 errors, 0 warnings (ESLint + TypeScript strict)" },
    vitest: { pass: true, msg: "54 passed in 948ms across 5 test suites" },
    build: { pass: true, msg: "Vite build: 192 modules bundled cleanly in 1.06s" },
    deploy: { pass: true, msg: "Edge deployment live at preview.vercel.app" }
  },
  "fail-lint": {
    name: "Linter & Type Regression",
    description: "Agent declared an unused import and violated prop types contract.",
    lint: { pass: false, msg: "ESLint: 'IconProps' is defined but never used (no-unused-vars) at line 14:8" },
    vitest: { pass: false, msg: "Skipped due to Lint Gate failure" },
    build: { pass: false, msg: "Skipped" },
    deploy: { pass: false, msg: "Blocked by Automated Quality Gate" }
  },
  "fail-test": {
    name: "Failing Unit Test Assertion",
    description: "Agent mutated state directly instead of returning an immutable copy.",
    lint: { pass: true, msg: "0 errors, 0 warnings" },
    vitest: { pass: false, msg: "AssertionError: expected 'active' to equal 'completed' at line 32:7" },
    build: { pass: false, msg: "Skipped due to test failure" },
    deploy: { pass: false, msg: "Blocked by Vitest Gate" }
  },
  "fail-build": {
    name: "Hallucinated Missing Dependency",
    description: "Agent imported a non-existent package '@portfolio/magic-db' without installing it.",
    lint: { pass: true, msg: "0 errors, 0 warnings" },
    vitest: { pass: true, msg: "Tests passed (mocked environment)" },
    build: { pass: false, msg: "RollupError: Could not resolve '@portfolio/magic-db' from src/db.js" },
    deploy: { pass: false, msg: "Blocked by Vite Production Gate" }
  }
};

export const AgenticStudio = () => {
  const [selectedTier, setSelectedTier] = useState("novice");
  const [selectedPoc, setSelectedPoc] = useState(POC_TEMPLATES[0]);
  const [simStep, setSimStep] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [simScenario, setSimScenario] = useState("auth-token");
  const [activeTab, setActiveTab] = useState("poc-studio");

  // Custom Audience of One Generator State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("Coffee Roaster Brew Log");
  const [customProblem, setCustomProblem] = useState("Commercial coffee apps require accounts and ads; I need a 1-click pour timer with grind size and ratio tracking.");
  const [customStack, setCustomStack] = useState("React 19 + Tailwind v4 + LocalStorage");
  const [customFeatures, setCustomFeatures] = useState("Pour timer with audio beeps, grind size rating, bean origin tags, Markdown export");

  // Verification Gate Playground State
  const [gateScenario, setGateScenario] = useState("all-pass");
  const [gateStep, setGateStep] = useState(0);
  const [isGateRunning, setIsGateRunning] = useState(false);

  const currentTier = useMemo(() => {
    return TIERS.find(t => t.id === selectedTier) || TIERS[0];
  }, [selectedTier]);

  const filteredPocs = useMemo(() => {
    return POC_TEMPLATES.filter(p => p.tier.includes(selectedTier));
  }, [selectedTier]);

  const currentScenario = SUBAGENT_SCENARIOS[simScenario] || SUBAGENT_SCENARIOS["auth-token"];
  const currentGate = VERIFICATION_SCENARIOS[gateScenario] || VERIFICATION_SCENARIOS["all-pass"];

  const runSubagentSim = () => {
    setIsSimRunning(true);
    setSimStep(1);
    setTimeout(() => setSimStep(2), 1000);
    setTimeout(() => setSimStep(3), 2000);
    setTimeout(() => {
      setSimStep(4);
      setIsSimRunning(false);
    }, 3000);
  };

  const runVerificationGates = () => {
    setIsGateRunning(true);
    setGateStep(1);
    setTimeout(() => {
      if (!currentGate.lint.pass) {
        setIsGateRunning(false);
        return;
      }
      setGateStep(2);
      setTimeout(() => {
        if (!currentGate.vitest.pass) {
          setIsGateRunning(false);
          return;
        }
        setGateStep(3);
        setTimeout(() => {
          if (!currentGate.build.pass) {
            setIsGateRunning(false);
            return;
          }
          setGateStep(4);
          setIsGateRunning(false);
        }, 900);
      }, 900);
    }, 800);
  };

  // Dynamically computed custom POC prompt & spec
  const customSlug = customTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-tool";
  const customScaffold = `npx create-vite ${customSlug} --template react && cd ${customSlug} && npm i lucide-react`;
  const customPrompt = `Create a single-page React 19 application called "${customTitle}" for an "Audience of One".
Problem: ${customProblem}
Tech Stack: ${customStack}
Core Requirements:
1. ${customFeatures.split(",").map((f, i) => `${f.trim()}`).join("\n2. ")}
3. 100% offline-first: persist all state directly to localStorage with zero cloud requirements.
4. Clean dark-mode UI with high contrast and zero marketing bloat.
5. 1-click JSON and Markdown export for local backups.`;

  const customSpec = `## Goal
Build "${customTitle}" — a sovereign, zero-bloat personal utility solving:
"${customProblem}"

## Architecture Specification
- Stack: ${customStack}
- Persistence: LocalStorage with schema versioning and JSON import/export
- Features:
${customFeatures.split(",").map(f => `  - ${f.trim()}`).join("\n")}
- Verification: 100% test coverage for state transitions and zero SaaS tax.`;

  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) py-16 px-4 md:px-8 selection:bg-purple-500/30 transition-colors duration-300">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-mono uppercase tracking-wider">
            <EmojiIcon name="lightning" className="w-3.5 h-3.5 text-amber-300 inline" /> Speed of Thought • Agentic Workshop Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-(--color-text) dark:text-(--color-text-dark)">
            Agentic Dev &amp; <br />
            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
              Audience of One Software
            </span>
          </h1>
          <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) text-base md:text-lg">
            Stop searching for generic SaaS. Learn how to prompt, orchestrate, and deploy bespoke personal software in 15 minutes using production agentic workflows.
          </p>
        </div>

        {/* 4-Tier Audience Selector */}
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Select Your Background &amp; Experience Level
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((t) => {
              const isActive = t.id === selectedTier;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTier(t.id);
                    if (!POC_TEMPLATES.find(p => p.id === selectedPoc.id)?.tier.includes(t.id)) {
                      setSelectedPoc(POC_TEMPLATES.filter(p => p.tier.includes(t.id))[0] || POC_TEMPLATES[0]);
                    }
                  }}
                  className={`p-5 rounded-2xl text-left transition-all duration-300 border backdrop-blur-md relative overflow-hidden group cursor-pointer ${
                    isActive
                      ? `${t.border} ${t.bg} shadow-lg scale-[1.02]`
                      : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.color}`} />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono font-bold ${isActive ? t.text : "text-(--color-muted-text) dark:text-(--color-muted-text-dark)"}`}>
                      {t.badge}
                    </span>
                    {isActive && <EmojiIcon name="sparkles" className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                  </div>
                  <h3 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2">{t.name}</h3>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) line-clamp-2 leading-relaxed">
                    {t.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tier Overview Banner */}
        <div className={`p-6 rounded-2xl border ${currentTier.border} ${currentTier.bg} backdrop-blur-md flex flex-col md:flex-row gap-6 items-start md:items-center justify-between`}>
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold font-mono ${currentTier.text}`}>
                {currentTier.name} Strategy
              </span>
            </div>
            <p className="text-sm text-(--color-text) dark:text-(--color-text-dark) leading-relaxed">
              <strong>Mental Model:</strong> {currentTier.agentRole}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {currentTier.focus.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-(--color-surface) dark:bg-(--color-surface-dark)/80 border border-(--color-border) dark:border-(--color-border-dark) text-xs font-medium text-(--color-text) dark:text-(--color-text-dark) inline-flex items-center gap-1.5"
                >
                  <Checkmark className="w-3 h-3 text-emerald-400 shrink-0" /> {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/lessons?track=agentic"
              className="px-5 py-2.5 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) text-(--color-text) dark:text-(--color-text-dark) text-xs font-bold font-mono transition-all text-center border border-(--color-border) dark:border-(--color-border-dark) flex items-center justify-center gap-2"
            >
              <EmojiIcon name="book" className="w-4 h-4 text-cyan-400 shrink-0" /> View Agentic Lessons
            </Link>
            <Link
              to="/slides"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono transition-all text-center shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <EmojiIcon name="mic" className="w-4 h-4 text-amber-300 shrink-0" /> Present Slide Decks
            </Link>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex border-b border-(--color-border) dark:border-(--color-border-dark) gap-4 md:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("poc-studio")}
            className={`pb-4 text-sm font-bold font-mono tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "poc-studio"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            <EmojiIcon name="target" className="w-4 h-4 text-purple-400" /> 1. Audience of One: POC Studio
          </button>
          <button
            onClick={() => setActiveTab("best-practices")}
            className={`pb-4 text-sm font-bold font-mono tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "best-practices"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            <EmojiIcon name="robot" className="w-4 h-4 text-cyan-400" /> 2. Subagent Triage Simulator
          </button>
          <button
            onClick={() => setActiveTab("context-hierarchy")}
            className={`pb-4 text-sm font-bold font-mono tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "context-hierarchy"
                ? "border-lime-500 text-lime-400"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            <EmojiIcon name="scroll" className="w-4 h-4 text-lime-400" /> 3. Context Engineering &amp; Rules
          </button>
          <button
            onClick={() => setActiveTab("verification-playground")}
            className={`pb-4 text-sm font-bold font-mono tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "verification-playground"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
            }`}
          >
            <EmojiIcon name="check" className="w-4 h-4 text-emerald-400" /> 4. Automated Gates Playground
          </button>
        </div>

        {/* TAB 1: POC STUDIO */}
        {activeTab === "poc-studio" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* POC List Sidebar & Custom Toggle */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-widest text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                  {isCustomMode ? "Bespoke Generator" : `Curated Personal Tools (${filteredPocs.length})`}
                </h3>
                <button
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isCustomMode
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-(--color-surface) dark:bg-(--color-surface-dark) border-(--color-border) dark:border-(--color-border-dark) text-purple-400 hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                  }`}
                >
                  {isCustomMode ? "← View Curated" : "+ Build Custom"}
                </button>
              </div>

              {!isCustomMode ? (
                <div className="space-y-3">
                  {filteredPocs.map((poc) => {
                    const isSelected = poc.id === selectedPoc.id;
                    return (
                      <div
                        key={poc.id}
                        onClick={() => setSelectedPoc(poc)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-500/10"
                            : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark)"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-purple-400 font-mono font-semibold">{poc.category}</span>
                          <span className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-mono">{poc.tech.split(" ")[0]}</span>
                        </div>
                        <h4 className="text-base font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">{poc.title}</h4>
                        <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) line-clamp-2 leading-relaxed">
                          {poc.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Custom Builder Form */
                <div className="p-5 rounded-2xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-purple-800/40 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider">Tool Name</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Coffee Roaster Brew Log"
                      className="w-full px-3 py-2 rounded-lg bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-(--color-text) dark:text-(--color-text-dark) text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider">Your Specific Problem</label>
                    <textarea
                      rows={3}
                      value={customProblem}
                      onChange={(e) => setCustomProblem(e.target.value)}
                      placeholder="What frustrates you about existing commercial software?"
                      className="w-full px-3 py-2 rounded-lg bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-(--color-text) dark:text-(--color-text-dark) text-xs font-sans focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider">Tech Preferences</label>
                    <input
                      type="text"
                      value={customStack}
                      onChange={(e) => setCustomStack(e.target.value)}
                      placeholder="e.g. React 19 + Tailwind + LocalStorage"
                      className="w-full px-3 py-2 rounded-lg bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-(--color-text) dark:text-(--color-text-dark) text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark) uppercase tracking-wider">Features (comma separated)</label>
                    <input
                      type="text"
                      value={customFeatures}
                      onChange={(e) => setCustomFeatures(e.target.value)}
                      placeholder="Timer, tags, local export"
                      className="w-full px-3 py-2 rounded-lg bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-(--color-text) dark:text-(--color-text-dark) text-xs font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Pro Tip Box */}
              <div className="p-4 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark)/80 border border-(--color-border) dark:border-(--color-border-dark) text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                  <Info /> "Audience of One" Principle
                </div>
                <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) leading-relaxed">
                  When you build for yourself, you don't need multi-tenant databases, Stripe subscriptions, or bloated admin dashboards. A single React component with <code className="text-purple-400">localStorage</code> solves 95% of personal workflows in 15 minutes.
                </p>
              </div>
            </div>

            {/* POC Generator Canvas */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-2xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-(--color-border) dark:border-(--color-border-dark)">
                  <div>
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                      {isCustomMode ? "Bespoke Audience of One Tool" : selectedPoc.category}
                    </span>
                    <h3 className="text-2xl font-black text-(--color-text) dark:text-(--color-text-dark)">
                      {isCustomMode ? customTitle : selectedPoc.title}
                    </h3>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs font-mono">
                    Stack: {isCustomMode ? customStack : selectedPoc.tech}
                  </div>
                </div>

                {/* Scaffolding Command */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    <span>1. Terminal Scaffolding Command</span>
                    <CopyButton text={isCustomMode ? customScaffold : selectedPoc.scaffold} size="xs" />
                  </div>
                  <div className="p-3 rounded-lg bg-(--color-background) dark:bg-(--color-dark)/90 font-mono text-xs text-cyan-300 border border-(--color-border) dark:border-(--color-border-dark) overflow-x-auto">
                    $ {isCustomMode ? customScaffold : selectedPoc.scaffold}
                  </div>
                </div>

                {/* Natural Language CRISP Prompt */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    <span>2. Copyable Agent Prompt (CRISP Format)</span>
                    <CopyButton text={isCustomMode ? customPrompt : selectedPoc.prompt} size="xs" />
                  </div>
                  <CodeBlock
                    code={isCustomMode ? customPrompt : selectedPoc.prompt}
                    language="markdown"
                    title="Copy & Paste to Antigravity / Gemini / Claude"
                  />
                </div>

                {/* Architecture Spec */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    <span>3. Technical Spec Document</span>
                    <CopyButton text={isCustomMode ? customSpec : selectedPoc.spec} size="xs" />
                  </div>
                  <CodeBlock
                    code={isCustomMode ? customSpec : selectedPoc.spec}
                    language="markdown"
                    title="SPEC.md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBAGENT TRIAGE & TOKEN ECONOMICS */}
        {activeTab === "best-practices" && (
          <div className="space-y-8">
            {/* Subagent Orchestration Simulator */}
            <div className="p-8 rounded-2xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
                    <EmojiIcon name="lightning" className="w-5 h-5 text-amber-300 shrink-0" /> Subagent Pipeline: <code className="text-cyan-400 text-xl font-mono">cavecrew</code> Pattern
                  </h3>
                  <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    Instead of running 1 monolithic chat, orchestrate specialized subagents that emit compressed findings.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={simScenario}
                    onChange={(e) => {
                      setSimScenario(e.target.value);
                      setSimStep(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-xs font-mono text-cyan-300 focus:outline-none"
                  >
                    <option value="auth-token">Auth Token Expiry Bug</option>
                    <option value="lcp-perf">Core Web Vitals LCP Lag</option>
                    <option value="sql-sanitize">Input Sanitization Guard</option>
                  </select>
                  <button
                    onClick={runSubagentSim}
                    disabled={isSimRunning}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {!isSimRunning && <EmojiIcon name="play" className="w-3.5 h-3.5 fill-current" />}
                      {isSimRunning ? "Orchestrating Subagents..." : "Simulate Pipeline"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Scenario Badge */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                  Target: {currentScenario.file}
                </span>
                <span className="text-(--color-muted-text) dark:text-(--color-muted-text-dark)">{currentScenario.badge}</span>
              </div>

              {/* Interactive Pipeline Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {/* Step 1: Investigator */}
                <div className={`p-4 rounded-xl border transition-all ${
                  simStep >= 1
                    ? "bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/20"
                    : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">[01] INVESTIGATOR</span>
                    {simStep >= 1 && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />}
                  </div>
                  <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Locate &amp; Scrape</h4>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-3">Finds exact symbol locations without loading full files into context.</p>
                  <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/80 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[50px]">
                    {simStep >= 1 ? currentScenario.investigator : "Waiting for trigger..."}
                  </div>
                </div>

                {/* Step 2: Builder */}
                <div className={`p-4 rounded-xl border transition-all ${
                  simStep >= 2
                    ? "bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20"
                    : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-purple-400">[02] BUILDER</span>
                    {simStep >= 2 && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />}
                  </div>
                  <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Surgical Edit</h4>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-3">Executes ≤2 file diffs using zero-boilerplate cove patterns.</p>
                  <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/80 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[50px]">
                    {simStep >= 2 ? currentScenario.builder : "Waiting..."}
                  </div>
                </div>

                {/* Step 3: Reviewer */}
                <div className={`p-4 rounded-xl border transition-all ${
                  simStep >= 3
                    ? "bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400">[03] REVIEWER</span>
                    {simStep >= 3 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />}
                  </div>
                  <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Audit Diff</h4>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-3">Scans diff for security, unintended regressions, and lint issues.</p>
                  <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/80 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[50px]">
                    {simStep >= 3 ? currentScenario.reviewer : "Waiting..."}
                  </div>
                </div>

                {/* Step 4: Verification Gate */}
                <div className={`p-4 rounded-xl border transition-all ${
                  simStep >= 4
                    ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">[04] VITEST GATE</span>
                    {simStep >= 4 && <Checkmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">CI &amp; Build Pass</h4>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-3">Automated harness verifies production bundle and passes all tests.</p>
                  <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/80 text-[11px] font-mono text-emerald-400 border border-(--color-border) dark:border-(--color-border-dark) min-h-[50px]">
                    {simStep >= 4 ? currentScenario.gate : "Waiting..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Token Economics & Compression Demo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Uncompressed Verbose */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-mono font-bold text-red-400 flex items-center gap-1.5">
                    <EmojiIcon name="cross" className="w-4 h-4 text-red-400" /> Verbose Agent Loop (Context Rot)
                  </h4>
                  <span className="px-2.5 py-1 rounded bg-red-900/40 text-red-300 text-xs font-mono font-bold">
                    ~2,400 tokens / turn
                  </span>
                </div>
                <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                  Uncontrolled pleasantries, repetitive apologies, large raw logs, and boilerplate code quickly exhaust context limits.
                </p>
                <div className="p-4 rounded-xl bg-(--color-background) dark:bg-(--color-dark)/80 font-mono text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) space-y-2 border border-(--color-border) dark:border-(--color-border-dark) max-h-56 overflow-y-auto">
                  <div className="text-gray-500">// Turn 12 response:</div>
                  <div className="text-red-300">
                    "Certainly! I'd be more than happy to assist you with refactoring your authentication context. As you know, React 19 provides multiple hooks that we can leverage..."
                  </div>
                  <div className="text-gray-500">[Dumps 250 lines of unmodified code...]</div>
                  <div className="text-red-400">Result: Context window exhausted by Turn 15. Agent begins hallucinating.</div>
                </div>
              </div>

              {/* Compressed Caveman / Cove */}
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <EmojiIcon name="check" className="w-4 h-4 text-emerald-400" /> Caveman + Cove Loop (Sharp Context)
                  </h4>
                  <span className="px-2.5 py-1 rounded bg-emerald-900/40 text-emerald-300 text-xs font-mono font-bold">
                    ~420 tokens / turn (82% savings)
                  </span>
                </div>
                <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                  All technical substance stays. Boilerplate, hedging, and filler die. Sessions stay sharp for 50+ iterations.
                </p>
                <div className="p-4 rounded-xl bg-(--color-background) dark:bg-(--color-dark)/80 font-mono text-xs text-(--color-text) dark:text-(--color-text-dark) space-y-2 border border-(--color-border) dark:border-(--color-border-dark) max-h-56 overflow-y-auto">
                  <div className="text-gray-500">// Turn 12 response:</div>
                  <div className="text-emerald-300">
                    AuthContext.jsx:42 — null token check use `?.` not `&&`.
                  </div>
                  <div className="text-cyan-300 font-mono">
                    verified: vitest 54 passed (0 regressions).
                  </div>
                  <div className="text-emerald-400">Result: 50+ turns without context degradation. High precision.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTEXT HIERARCHY & RULES */}
        {activeTab === "context-hierarchy" && (
          <div className="p-8 rounded-2xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
                <EmojiIcon name="scroll" className="w-5 h-5 text-indigo-400 shrink-0" /> The Context Hierarchy: Engineering What Agents See
              </h3>
              <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">
                Context is the biggest lever for AI quality. Too little = hallucinations; too much = lost focus.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark)/50 border border-(--color-border) dark:border-(--color-border-dark) flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono text-xs font-bold">LEVEL 1</span>
                    <h4 className="font-bold text-(--color-text) dark:text-(--color-text-dark) text-base">Persistent Rules File (AGENTS.md / CLAUDE.md)</h4>
                  </div>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    Always loaded on every turn. Contains project stack, build commands, testing gates, and hard constraints.
                  </p>
                </div>
                <CopyButton text={`# Project Conventions\n- Stack: Vite + React 19 + Tailwind v4\n- Verify: npm run test:run && npm run build\n- Pattern: Component variant wrappers`} size="sm" />
              </div>

              <div className="p-4 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark)/50 border border-(--color-border) dark:border-(--color-border-dark) flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-mono text-xs font-bold">LEVEL 2</span>
                    <h4 className="font-bold text-(--color-text) dark:text-(--color-text-dark) text-base">Spec &amp; Architecture Document (SPEC.md)</h4>
                  </div>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    Loaded per feature. Defines user stories, prop interfaces, state transitions, and acceptance criteria.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">Per-Task Scope</span>
              </div>

              <div className="p-4 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark)/50 border border-(--color-border) dark:border-(--color-border-dark) flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono text-xs font-bold">LEVEL 3</span>
                    <h4 className="font-bold text-(--color-text) dark:text-(--color-text-dark) text-base">Scoped Source Files</h4>
                  </div>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    Only include the 1-3 files being actively edited. Never dump the entire codebase into transient prompt context.
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400">Minimal Diff</span>
              </div>

              <div className="p-4 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark)/50 border border-(--color-border) dark:border-(--color-border-dark) flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono text-xs font-bold">LEVEL 4</span>
                    <h4 className="font-bold text-(--color-text) dark:text-(--color-text-dark) text-base">Automated Error Output &amp; Test Results</h4>
                  </div>
                  <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                    Vitest failure snippets passed back to agent for closed-loop self-correction.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400">Zero-Human Gate</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUTOMATED VERIFICATION PLAYGROUND (NEW) */}
        {activeTab === "verification-playground" && (
          <div className="p-8 rounded-2xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
                  <EmojiIcon name="check" className="w-5 h-5 text-emerald-400 shrink-0" /> Automated Gates &amp; CI Verification Playground
                </h3>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                  Simulate how automated test suites protect your repository from agentic hallucinations, syntax errors, and regressions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={gateScenario}
                  onChange={(e) => {
                    setGateScenario(e.target.value);
                    setGateStep(0);
                  }}
                  className="px-3 py-2 rounded-xl bg-(--color-background) dark:bg-(--color-dark)/90 border border-(--color-border) dark:border-(--color-border-dark) text-xs font-mono text-emerald-300 focus:outline-none"
                >
                  <option value="all-pass">Clean Conventional PR (Pass)</option>
                  <option value="fail-lint">Linter &amp; Type Regression (Fail)</option>
                  <option value="fail-test">Failing Vitest Assertion (Fail)</option>
                  <option value="fail-build">Hallucinated Dependency (Fail)</option>
                </select>
                <button
                  onClick={runVerificationGates}
                  disabled={isGateRunning}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold font-mono text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {isGateRunning ? "Running Pipeline..." : "Execute Gates"}
                </button>
              </div>
            </div>

            {/* Scenario Description */}
            <div className="p-4 rounded-xl bg-(--color-background) dark:bg-(--color-dark)/80 border border-(--color-border) dark:border-(--color-border-dark) text-xs space-y-1">
              <span className="font-mono text-emerald-400 font-bold uppercase">{currentGate.name}</span>
              <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark)">{currentGate.description}</p>
            </div>

            {/* 4 Pipeline Gates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gate 1: Lint */}
              <div className={`p-4 rounded-xl border transition-all ${
                gateStep >= 1
                  ? currentGate.lint.pass
                    ? "bg-emerald-950/30 border-emerald-500/80"
                    : "bg-red-950/30 border-red-500/80"
                  : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">GATE 1: LINTER</span>
                  {gateStep >= 1 && (
                    currentGate.lint.pass
                      ? <Checkmark className="w-3.5 h-3.5 text-emerald-400" />
                      : <Close className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Syntax &amp; Types</h4>
                <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/90 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[48px]">
                  {gateStep >= 1 ? currentGate.lint.msg : "Waiting for trigger..."}
                </div>
              </div>

              {/* Gate 2: Vitest */}
              <div className={`p-4 rounded-xl border transition-all ${
                gateStep >= 2
                  ? currentGate.vitest.pass
                    ? "bg-emerald-950/30 border-emerald-500/80"
                    : "bg-red-950/30 border-red-500/80"
                  : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">GATE 2: VITEST</span>
                  {gateStep >= 2 && (
                    currentGate.vitest.pass
                      ? <Checkmark className="w-3.5 h-3.5 text-emerald-400" />
                      : <Close className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Unit &amp; Specs</h4>
                <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/90 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[48px]">
                  {gateStep >= 2 ? currentGate.vitest.msg : "Waiting..."}
                </div>
              </div>

              {/* Gate 3: Vite Build */}
              <div className={`p-4 rounded-xl border transition-all ${
                gateStep >= 3
                  ? currentGate.build.pass
                    ? "bg-emerald-950/30 border-emerald-500/80"
                    : "bg-red-950/30 border-red-500/80"
                  : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">GATE 3: BUILD</span>
                  {gateStep >= 3 && (
                    currentGate.build.pass
                      ? <Checkmark className="w-3.5 h-3.5 text-emerald-400" />
                      : <Close className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Rollup Bundle</h4>
                <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/90 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[48px]">
                  {gateStep >= 3 ? currentGate.build.msg : "Waiting..."}
                </div>
              </div>

              {/* Gate 4: Edge Deploy */}
              <div className={`p-4 rounded-xl border transition-all ${
                gateStep >= 4
                  ? currentGate.deploy.includes("live")
                    ? "bg-emerald-950/30 border-emerald-500/80"
                    : "bg-red-950/30 border-red-500/80"
                  : "bg-(--color-surface) dark:bg-(--color-surface-dark)/60 border-(--color-border) dark:border-(--color-border-dark) opacity-60"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">GATE 4: DEPLOY</span>
                  {gateStep >= 4 && (
                    currentGate.deploy.includes("live")
                      ? <Checkmark className="w-3.5 h-3.5 text-emerald-400" />
                      : <Close className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-(--color-text) dark:text-(--color-text-dark) mb-1">Edge Release</h4>
                <div className="p-2 rounded bg-(--color-background) dark:bg-(--color-dark)/90 text-[11px] font-mono text-(--color-text) dark:text-(--color-text-dark) border border-(--color-border) dark:border-(--color-border-dark) min-h-[48px]">
                  {gateStep >= 4 ? currentGate.deploy : "Waiting..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA Banner */}
        <div className="p-8 rounded-3xl bg-(--color-surface) dark:bg-(--color-surface-dark)/90 border border-purple-500/30 text-center space-y-4">
          <h3 className="text-2xl md:text-3xl font-black text-(--color-text) dark:text-(--color-text-dark)">
            Ready to Build Your First "Audience of One" Tool?
          </h3>
          <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) max-w-xl mx-auto">
            Choose a template above or craft a custom spec, copy the CRISP prompt into Antigravity or Gemini, and deploy live in 15 minutes.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/builder"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <EmojiIcon name="rocket" className="w-4 h-4" /> Open Portfolio Builder
            </Link>
            <Link
              to="/showcase"
              className="px-6 py-3 rounded-xl bg-(--color-surface) dark:bg-(--color-surface-dark) hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) text-(--color-text) dark:text-(--color-text-dark) font-bold text-xs font-mono transition-all border border-(--color-border) dark:border-(--color-border-dark) flex items-center gap-2"
            >
              <EmojiIcon name="star" className="w-4 h-4 text-amber-300" /> Explore Live Showcase
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticStudio;
