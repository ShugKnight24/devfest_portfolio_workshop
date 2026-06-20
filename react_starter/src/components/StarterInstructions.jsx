import { InstructionSteps } from "./Instructions/InstructionSteps";

export const StarterInstructions = () => (
  <div className="section-container">
    <div className="text-center py-10">
      <h1 className="text-5xl font-bold gradient-text mb-4">
        Coding at the Speed of Thought: The REZE_BOMB System!
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Welcome to Detroit Pride 2026. Syntax deviation is here. Semicolon purgatory is over.
        Let's assemble sovereign blocks, isolate traffic curves, and apply the Skeptic Protocol!
      </p>
      
      <InstructionSteps />
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto text-left mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">REZE_BOMB Lunch Session Roadmap (60 - 90 Minutes):</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Stage 01 // Syntax Deviation:</strong> Connect to WIFI (<code className="bg-gray-100 p-1 rounded font-mono">Devfest2025</code>) & discuss physical mechanics vs raw architecture.</li>
          <li>
            <strong>Get the Sandbox Core:</strong> Clone repository:
            <code className="bg-gray-100 p-1 rounded ml-1 font-mono">git clone &lt;repo-url&gt;</code>.
          </li>
          <li>
            <strong>Ignite the Engine:</strong> Install dependencies and run development server:
            <code className="bg-gray-100 p-1 rounded ml-1 font-mono">npm install && npm run dev</code>.
          </li>
          <li>
            <strong>The Ballmer Remix:</strong> Update your profile data in
            <code className="bg-gray-100 p-1 rounded ml-1 font-mono">src/data/portfolioData.js</code>.
          </li>
          <li>
            <strong>Stage 02 // Blocks & Beliefs:</strong> Uncomment and customize components in
            <code className="bg-gray-100 p-1 rounded ml-1 font-mono">src/App.jsx</code> (Header, About, Skills, Projects, Footer).
          </li>
          <li>
            <strong>Stage 03 // Telemetry Paralysis:</strong> Setup DataMoon click trackers to capture agentic traffic curve divergence.
          </li>
          <li>
            <strong>Skeptical Protocol Deployment:</strong> Deploy live on 
            <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-medium hover:underline ml-1">Vercel</a>. Always audit the compiler!
          </li>
        </ol>
      </div>
    </div>
  </div>
);
