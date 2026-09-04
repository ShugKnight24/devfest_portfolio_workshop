import { useEffect, useState } from "react";
import VercelDeployment from "../../assets/instructions/vercel_root_directory.png";
import { EmojiIcon } from "@portfolio/icons/react";
import { Checkmark } from "../Icons";
import { Link } from "react-router-dom";

export const InstructionSteps = () => {
  const [activeTrack, setActiveTrack] = useState("students");
  const [currentStep, setCurrentStep] = useState(0);

  const tracks = {
    students: {
      name: "Students & Aspiring Devs",
      badge: "Quick-Start Track",
      icon: "gradCap",
      description:
        "Zero-to-one velocity: understand component anatomy, personalize your data, and deploy your live portfolio in 15 minutes.",
      steps: [
        {
          title: "1. Clone the Sovereign Sandbox Core",
          component: "git clone https://github.com/ShugKnight24/devfest_portfolio_workshop",
          description:
            "First, make sure Node.js (v18+) is installed. Open your terminal, navigate to your desired directory, and clone the workshop repository. This gives you both the React 19 + Tailwind v4 starter and the zero-dependency Vanilla starter.",
          note: "Inspect what you download! A great developer always knows what runs on their machine.",
        },
        {
          title: "2. Ignite the Code Engine",
          component: "cd devfest_portfolio_workshop/apps/react && npm install && npm run dev",
          description:
            "Install project dependencies using 'npm install' and launch the Vite development server with 'npm run dev'. Your site will spin up at http://localhost:3000 with sub-second hot module reloading.",
          note: "If port 3000 is occupied, Vite will automatically select the next available port.",
        },
        {
          title: "3. Component Anatomy: Skeleton, Clothing, Brain",
          component: "HTML (Skeleton) + Tailwind (Clothing) + React (Brain)",
          description:
            "Mental model for modern web apps: HTML defines the DOM nodes (<header>, <section>); Tailwind CSS applies utility classes (bg-gray-900, text-blue-400); React manages the state (useState) and dynamic data mapping (.map()).",
          note: "Open src/components/About/AboutSkills.jsx to see this triad in action.",
        },
        {
          title: "4. The Fast Personalization: Edit portfolioData.js",
          component: "src/data/portfolioData.js",
          description:
            "Open src/data/portfolioData.js in your editor. This is the single source of truth for the entire application. Change the name, bio, skills, and projects to reflect your authentic story. Watch the browser update instantaneously without a full reload.",
          note: "Tip: Add your GitHub and LinkedIn profile links in the personal.social object.",
        },
        {
          title: "5. Assemble Your Blocks in App.jsx",
          component: "src/App.jsx",
          description:
            "Inspect App.jsx. Notice how each section (Header, About, Skills, Projects, Footer) is a sovereign component. You can swap visual style variants in the respective component folders to choose between Minimal, Glassmorphism, and Animated designs.",
          note: "Try changing the theme in the top-right switcher to see all 31 built-in palette themes.",
        },
        {
          title: "6. Zero-Config Live Vercel Edge Deployment",
          component: "Vercel CLI or vercel.com",
          description:
            "Push your repository to GitHub and import it on Vercel. Crucial setting: configure the Root Directory in Vercel to point to 'apps/react' (or root if using monorepo). Vercel will automatically build and serve your site on global edge networks.",
          img: VercelDeployment,
          note: "Once live, share your URL on LinkedIn or with conference attendees!",
        },
      ],
    },
    pros: {
      name: "Professional Devs & Architects",
      badge: "The Reacher Audit Track",
      icon: "shield",
      description:
        "The Jack Reacher methodology: Sherlock Holmes root-cause deduction, strict context engineering, subagent pipelines, and zero-human automated testing gates.",
      steps: [
        {
          title: "1. Sherlockian Deduction: 'In an Investigation, Details Matter'",
          component: "Root Cause over Magic Prompts",
          description:
            "Reacher walks into a room, notices the angle of the door, the mud on a boot, and deduces the truth. In software: never accept unearned wisdom. When an agent hallucinates, do not blindly reprompt—isolate the stack trace, locate the exact symbol, and feed typed constraints.",
          note: "'I don't mind the questions, I mind the lies.' Audit the compiler every single turn.",
        },
        {
          title: "2. The 4-Level Context Engineering Hierarchy",
          component: "AGENTS.md → SPEC.md → Scoped Files → Automated Gate",
          description:
            "Context rot occurs when bloated conversational pleasantries and full files flood LLM context. Enforce strict hierarchy: Level 1 (Persistent rules AGENTS.md loaded every turn), Level 2 (Per-task SPEC.md contracts), Level 3 (Scoped ≤2 files), Level 4 (Vitest CI failure snippets).",
          note: "'Reacher said nothing.' Cut conversational filler. Precision and silence extend context life to 50+ turns.",
        },
        {
          title: "3. Subagent Delegation: The cavecrew Pattern",
          component: "Investigator → Builder → Reviewer",
          description:
            "Instead of 1 monolithic prompt, orchestrate 3 specialized subagents: (1) cavecrew-investigator: locates symbols and line numbers without dumping files; (2) cavecrew-builder: applies surgical ≤2 file edits; (3) cavecrew-reviewer: audits the diff for regressions, security, and styling.",
          note: "Explore the live subagent pipeline simulation in /agentic-studio.",
        },
        {
          title: "4. The Folding Toothbrush Doctrine: Zero Bloat",
          component: "Sovereign Dependencies",
          description:
            "Reacher carries no luggage—just an expired passport and a folding toothbrush. In code: reject 80-package dependency sprawl for simple utilities. This workshop's icon package (@portfolio/icons) and vanilla starter operate with zero external runtime bloat.",
          note: "'Travel light.' Keep bundles small and execution instantaneous.",
        },
        {
          title: "5. Zero-Human Verification Gates",
          component: "npm run test:run && npm run build",
          description:
            "Hope for the best, plan for the worst. Before any agentic code touches production, run automated verification: Vitest asserts behavioral invariants in <1 second; Vite ensures production bundle integrity.",
          note: "Run 'npm run test:run' right now in your terminal to see all tests pass in ~700ms.",
        },
      ],
    },
    makers: {
      name: "Beyond the Portfolio",
      badge: "Bespoke Software Makers",
      icon: "tools",
      description:
        "Moving past resume sites to building bespoke tools for an Audience of One that solve visceral personal frictions and scale to others.",
      steps: [
        {
          title: "1. The Audience of One Doctrine",
          component: "Solve Your Own Acute Friction",
          description:
            "The best software is born when you build a tool to solve an acute, visceral pain point in your own daily life. It doesn't need to be a venture-backed SaaS. A bespoke workout logger, an automated media pipeline, or a localized checkout engine that runs 100x faster than legacy tools.",
          note: "A bespoke running application is 100x more impressive to employers than a generic template.",
        },
        {
          title: "2. Case Study: J. Simmons Productions",
          component: "Dynamic Media Distribution Pipeline",
          description:
            "Friction: Video creators spending hours on manual video distribution and clunky cloud uploads. Solution: High-speed dynamic modules processing backend distribution hooks asynchronously.",
          note: "Result: Video channels scale instantly with zero infrastructure maintenance.",
        },
        {
          title: "3. Case Study: Jacked Alien",
          component: "Fitness State Machine Engine",
          description:
            "Friction: Commercial fitness apps bogged down in subscription paywalls and bloated forms. Solution: Modular finite state machine governing real-time progressive overload with zero external dependencies.",
          note: "Runs 100% offline in browser localStorage. Fast, private, unbreakable.",
        },
        {
          title: "4. Case Study: Criminal Cookies",
          component: "Localized High-Frequency E-Commerce",
          description:
            "Friction: Traditional Shopify storefronts loading 40+ analytical tracking scripts that destroy mobile checkout conversion. Solution: Vite + micro-component engine compiling straight to high-frequency mobile checkout.",
          note: "Sub-second transactions that bypass legacy commercial bloat entirely.",
        },
        {
          title: "5. Packaging for an Audience of Many",
          component: "Open Source & Scalable Architecture",
          description:
            "Once your personal tool works for you, package its core modules into an open-source library or starter template. Provide clear README documentation, typed contracts, and an instant-deploy button on GitHub so other makers can build upon your foundation.",
          note: "Check /agentic-studio for the Audience of One prompt generator to blueprint your idea.",
        },
      ],
    },
  };

  const currentTrackData = tracks[activeTrack];
  const steps = currentTrackData.steps;

  // Keyboard navigation within active track
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
      } else if (event.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length]);

  const handleTrackChange = (trackKey) => {
    setActiveTrack(trackKey);
    setCurrentStep(0);
  };

  return (
    <div className="w-full my-8">
      {/* Persona Track Selector Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-8">
        {Object.entries(tracks).map(([key, data]) => {
          const isActive = activeTrack === key;
          return (
            <button
              key={key}
              onClick={() => handleTrackChange(key)}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 border cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 scale-105"
                  : "bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white"
              }`}
            >
              <EmojiIcon name={data.icon} className="w-4 h-4 shrink-0" />
              <span>{data.name}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isActive ? "bg-blue-800/80 text-blue-200" : "bg-gray-800 text-gray-400"
                }`}
              >
                {data.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Track Header Card */}
        <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 mb-6 text-center text-xs text-gray-300">
          <strong className="text-blue-400 font-mono">{currentTrackData.name}:</strong>{" "}
          {currentTrackData.description}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between gap-1 mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`flex-1 h-2 rounded-full cursor-pointer transition-all ${
                  index <= currentStep
                    ? "bg-blue-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title={`Step ${index + 1}: ${step.title}`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center text-xs font-mono text-gray-400">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-gray-500">← → arrow keys navigate</span>
          </div>
        </div>

        {/* Current Step Content Box */}
        <div className="bg-gray-900/90 border border-gray-800 p-8 rounded-3xl shadow-2xl text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-blue-400 px-3 py-1 rounded bg-blue-950/60 border border-blue-800">
              STAGE 0{currentStep + 1}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {currentTrackData.name}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {steps[currentStep].title}
          </h2>

          {steps[currentStep].component && (
            <div className="bg-black/80 border border-gray-800 p-3 rounded-xl mb-4 font-mono text-xs text-emerald-400 overflow-x-auto flex items-center justify-between gap-2">
              <code>{steps[currentStep].component}</code>
            </div>
          )}

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
            {steps[currentStep].description}
          </p>

          {steps[currentStep].note && (
            <div className="p-4 rounded-xl bg-amber-950/20 border-l-4 border-amber-500 text-xs text-amber-200/90 mb-6 leading-relaxed">
              <strong className="text-amber-400 font-mono uppercase tracking-wider block mb-1">
                The Sovereign Rule / Tip:
              </strong>
              {steps[currentStep].note}
            </div>
          )}

          {steps[currentStep].img && (
            <div className="my-6 p-2 rounded-2xl bg-black/60 border border-gray-800 flex justify-center">
              <img
                src={steps[currentStep].img}
                alt={steps[currentStep].title}
                className="rounded-xl shadow-lg max-h-80 object-contain"
              />
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-800 mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition-all cursor-pointer"
            >
              ← Previous Step
            </button>

            <span className="text-xs font-mono text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>

            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep === steps.length - 1}
              className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Quick Route Links to Slides & Studio */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs font-mono">
          <Link
            to="/slides/lhm"
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-blue-400 hover:border-blue-500 transition-colors flex items-center gap-2"
          >
            <EmojiIcon name="presentation" className="w-3.5 h-3.5" />
            Launch LHM Keynote Slides (Sept 19)
          </Link>
          <Link
            to="/slides/devfest"
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-emerald-400 hover:border-emerald-500 transition-colors flex items-center gap-2"
          >
            <EmojiIcon name="rocket" className="w-3.5 h-3.5" />
            Launch DevFest AI Hackathon Slides (Nov 2026)
          </Link>
          <Link
            to="/agentic-studio"
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-purple-400 hover:border-purple-500 transition-colors flex items-center gap-2"
          >
            <EmojiIcon name="sparkles" className="w-3.5 h-3.5" />
            Audience of One Studio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InstructionSteps;
