import { InstructionSteps } from "./Instructions/InstructionSteps";

export const StarterInstructions = () => (
  <div className="section-container">
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold gradient-text mb-4">
        Component Catalyst: Building a Dynamic React Portfolio!
      </h1>
      <InstructionSteps />
      <p className="text-xl text-gray-600 mb-8">
        Let's learn the basics of software development. We'll build some
        components and bring this portfolio to life!
      </p>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto text-left">
        <h2 className="text-2xl font-semibold mb-4">Quick Start Guide:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Connect to the WIFI - The password is Devfest2025!</li>
          <li>
            Look up Shugknight24 on GitHub or Google and find this repository.
            Clone this repo with{" "}
            <code className="bg-gray-100 p-1 rounded">
              git clone &lt;repo-url&gt;
            </code>
            .
          </li>
          <li>
            Clone this repo and get things started by installing the project
            dependencies with{" "}
            <code className="bg-gray-100 p-1 rounded">npm install</code>.
          </li>
          <li>
            Start by exploring the project structure and understanding the
            requirements.
          </li>
          <li>
            Check out the data in{" "}
            <code className="bg-gray-100 p-1 rounded">
              src/data/portfolioData.js
            </code>{" "}
            file
          </li>
          <li>
            Build the <code className="bg-gray-100 p-1 rounded">Header</code>{" "}
            component
          </li>
          <li>
            Create the <code className="bg-gray-100 p-1 rounded">About</code>{" "}
            section
          </li>
          <li>
            Add the <code className="bg-gray-100 p-1 rounded">Skills</code>{" "}
            section with badges
          </li>
          <li>
            Build <code className="bg-gray-100 p-1 rounded">ProjectCard</code>{" "}
            and map through projects
          </li>
          <li>
            Finish with the{" "}
            <code className="bg-gray-100 p-1 rounded">Footer</code>
          </li>
          <li>
            Style everything with{" "}
            <a
              href="https://tailwindcss.com/"
              className="text-sky-600 font-medium hover:underline hover:text-sky-900"
            >
              Tailwind CSS!
            </a>
          </li>
        </ol>
      </div>
    </div>
  </div>
);
