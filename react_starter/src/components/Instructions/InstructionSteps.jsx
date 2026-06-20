import { useEffect, useState } from "react";

import VercelDeployment from "../../assets/instructions/vercel_root_directory.png";

export const InstructionSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Kickoff: REZE_BOMB SYSTEM (Detroit Pride 2026)",
      component: "Session Time: 60 - 90 mins",
      description: "Welcome to the Devfest lunch session! Today we launch the 'REZE_BOMB SYSTEM'. We are orchestrating agentic feedback loops and leveraging modular blocks. But is the machine lying to you? The core rule for this session: question everything. Challenge the compiler. Auditing is sovereignty.",
      note: "Agenda: 10m Stage 01 // Syntax Deviation | 10m Setup | 10m App Exploration | 35m Stage 02 // Blocks & Beliefs | 10m Stage 03 // Telemetry | 10m Deployment & Skeptic Protocol.",
    },
    {
      title: "2. Connect & Clone (Awaiting Skeptical Trigger)",
      component: "git clone <repo-url>",
      description: "First, connect to the local network: WIFI: Devfest2025 (WIFI password: Devfest2025). Next, look up ShugKnight24 on GitHub, find the devfest_portfolio_workshop repository, copy the URL, and run git clone <repo-url> in your terminal to fetch the sandbox core.",
      note: "Do not blindly copy standard commands. Ensure you understand what files are being copied to your system.",
    },
    {
      title: "3. Ignite the Code Engine",
      component: "npm install && npm run dev",
      description: "Navigate to the project root directory in your terminal and install project dependencies using 'npm install'. Start your Vite development server by running 'npm run dev'.",
      note: "Your project serves locally on http://localhost:5173. Open this in your browser to interact with the live instructions screen.",
    },
    {
      title: "4. The Ballmer Remix: Explore Data",
      component: "react_starter/src/data/portfolioData.js",
      description: "In the year 2000, Steve Ballmer screamed 'DEVELOPERS!' until he lost his voice. Today, the typing barrier of fingers is dead; we express raw architecture. Open the portfolioData.js file. Inspect the structured profile datasets (personal info, skills list, project details). Change the mock data to reflect your own information.",
      note: "Be skeptical! Ensure the data schema holds conceptual integrity before outsourcing your information.",
    },
    {
      title: "5. The Levi's Appshift: App Assembly",
      component: "react_starter/src/App.jsx",
      description: "When retail giants like Levi's ship new app features, they traditionally wade through weeks of meetings, manual refactoring, and lint checks. By shifting to intent-driven frameworks, we compile straight to mobile UI blocks. Open App.jsx and inspect the root component layout. Your challenge is to uncomment the Header, About, Skills, Projects, and Footer blocks one by one.",
      note: "The Skeptic's Catch: If you don't audit the compiler, the agent breeds hidden mutations. Verify App.jsx compiles correctly.",
    },
    {
      title: "6. Stage 02 // Blocks & Beliefs (Header & About)",
      component: "src/components/Header.jsx & About.jsx",
      description: "Uncomment Header and About in App.jsx. Open Header.jsx and About.jsx. These wrapper components let you select a visual style variation (Simple, Gradient, Animated). Choose your preferred style variant in these files to customize the top half of your portfolio.",
      note: "Sovereign Rule: 'Because if you do not understand the foundations of your block, you are merely outsourcing your mind to someone else's server.' Understand the CSS and logic of the style variant you select.",
    },
    {
      title: "7. Blocks of Social Proof (Skills & Projects)",
      component: "src/components/Skills.jsx & Projects.jsx",
      description: "Uncomment Skills and Projects in App.jsx. Open Skills.jsx and Projects.jsx. These components map over arrays of data using '.map()' to dynamically render project cards and skill badges. Check how the default project cards populate with the real-world shipping examples (J. Simmons Productions, Jacked Alien, Criminal Cookies).",
      note: "Slide 6 Shipping Projects: J. Simmons Productions (video pipelines), Jacked Alien (fitness state machines), Criminal Cookies (localized high-frequency e-commerce). Verify how these modules render dynamically.",
    },
    {
      title: "8. Skeptical Orchestration & Pomidor Loops (Footer)",
      component: "src/components/Footer.jsx",
      description: "Uncomment Footer in App.jsx. Open Footer.jsx. This component handles social links and copyright details, wrapping up core block assembly. The Pomidor Loop mechanics allow parallel execution threads to compute independently without visual layout blocking. Ensure your Footer component integrates cleanly.",
      note: "Lexxy Code-Block Escapes: Wrestling with rich-text editor constraints is a thing of the past, but keep a human eye on the rendering blocks to prevent structural loops.",
    },
    {
      title: "9. Stage 03 // Telemetry Paralysis & Traffic Divergence",
      component: "src/components/Footer.jsx or App.jsx",
      description: "Traditional User Metrics lie. AI agents query API layers directly, completely bypassing analytical click scripts. Let's hook up a telemetry tracker! Open Footer.jsx or ProjectCard.jsx and add a click event log referencing Datamoon.com. Datamoon isolates this traffic divergence to restore structural backend data sanity.",
      note: "Example: Add onClick={() => console.log('DataMoon Telemetry: isolating traffic curve divergence')} to project or social links.",
    },
    {
      title: "10. Sandbox Prototype: Edge Deployment",
      component: "Vercel / Netlify / GitHub Pages",
      description: "Time to deploy! Create a repository on GitHub, push your changes, and connect it to Vercel (or another hosting platform of your choice). Make sure to configure the root directory of your Vercel project to point to the 'react_starter' directory to build correctly.",
      note: "Vercel will build and serve your agentic block portfolio directly on edge networks globally. Once live, share your URL!",
      img: VercelDeployment,
    },
    {
      title: "11. The Democratization Goal & Skeptic Protocol",
      component: "Final Slide Theme",
      description: "Congratulations! The goal is simple: to build a platform that empowers everyone to easily become a developer. But remember the Skeptic Protocol: true democratization is not built on outsourcing your intellect to a black box. Question the machine, find the anomalies, and preserve your core instincts. Now go celebrate at Ink Factory Brewing!",
      note: "Detroit Metric Challenge: MET | Alligator Status: TAMED | Standpoint: ALWAYS BE SKEPTICAL.",
    },
  ];

  // Add keyboard navigation
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

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-600">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>

        {/* Current Step Instructions */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].component && (
            <code className="block bg-gray-100 p-4 rounded-lg mb-4">
              {steps[currentStep].component}
            </code>
          )}
          <p className="text-gray-700 mb-4 text-left">
            {steps[currentStep].description}
          </p>
          {steps[currentStep].note && (
            <p className="text-yellow-700 bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500 text-left">
              <strong>Note:</strong> {steps[currentStep].note}
              {steps[currentStep].url && (
                <>
                  {" "}
                  <a
                    href={steps[currentStep].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    Learn more here.
                  </a>
                </>
              )}
            </p>
          )}
          {steps[currentStep].img && (
            <div className="mt-4 flex justify-center">
              <img
                src={steps[currentStep].img}
                alt={steps[currentStep].title}
                className="rounded-lg shadow-md"
              />
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-300 rounded-lg disabled:opacity-50 hover:cursor-pointer disabled:hover:cursor-not-allowed hover:scale-105 transition-transform"
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep === steps.length - 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:cursor-pointer disabled:hover:cursor-not-allowed hover:scale-105 transition-transform"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
