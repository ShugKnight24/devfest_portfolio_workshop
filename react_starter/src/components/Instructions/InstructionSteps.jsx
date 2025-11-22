import { useEffect, useState } from "react";

import VercelDeployment from "../../assets/instructions/vercel_root_directory.png";

export const InstructionSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Connect to WIFI",
      component: "Devfest2025",
      description: "Connect to the WIFI - The password is Devfest2025!",
    },
    {
      title: "Download the Repo",
      component: "git clone <repo-url>",
      description:
        "Clone the repository to your local machine - look up ShugKnight24 on GitHub. Find this repo, in the repo, click the green Code button, and copy the URL to clone. Then run git clone <repo-url> in your terminal.",
    },
    {
      title: "Setup",
      component: "npm install && npm run dev",
      description:
        "Install dependencies and start dev server - Run `npm install` and `npm run dev` in the project directory in your terminal.",
      note: "You may need to install Node.js if you haven't already. Node is a JavaScript runtime that allows us to run JavaScript outside the browser. It will give you access to npm (Node Package Manager) which we use to install project dependencies.",
      url: "https://nodejs.org/en/download/",
    },
    {
      title: "Explore Project Structure & Data",
      component: "react_starter/src/data/portfolioData.js",
      description:
        "Start by exploring the project structure and understanding the requirements. Familiarize yourself with our data, this will be your information! Open the `src/data/portfolioData.js` file to see the data you'll be using to populate your portfolio components. This will help you understand what information is available to us, how to access it, and drive how and what we build.",
    },
    {
      title: "App",
      component: "react_starter/src/App.jsx",
      description:
        "Understand the main app component - Open `src/App.jsx` to see how the app is structured. This is where you'll render your components and pass our data as props.",
    },
    {
      title: "Header",
      component: "react_starter/src/components/Header.jsx",
      description: "Display name, title, and social links",
    },
    {
      title: "About",
      component: "react_starter/src/components/About.jsx",
      description: "Show bio and avatar",
    },
    {
      title: "Skills",
      component: "react_starter/src/components/Skills.jsx",
      description: "Map through skills array",
    },
    {
      title: "Projects",
      component: "react_starter/src/components/Projects.jsx",
      description: "Display project cards",
    },
    {
      title: "Footer",
      component: "react_starter/src/components/Footer.jsx",
      description: "Add social links and copyright",
    },
    {
      title: "Style with Tailwind CSS",
      component: "Tailwind CSS",
      description:
        "Enhance the look and feel of your portfolio and make it your own!",
    },
    {
      title: "Deploy Your Portfolio",
      component: "Vercel / Netlify / GitHub Pages / etc.",
      description:
        "Deploy your completed portfolio online using platforms like Vercel, Netlify, GitHub Pages, or another service of your choice.",
      note: "When using Vercel, you can directly import your GitHub repository and it will handle the deployment for you automatically. Make sure you update the Root Directory to point to the 'react_starter' folder in the project settings.",
      img: VercelDeployment,
    },
    {
      title: "Share Your Work",
      component: "Social Media / Portfolio Sites",
      description:
        "Share your deployed portfolio on social media platforms and portfolio sites to showcase your work to potential employers and collaborators.",
    },
    {
      title: "Profit!",
      component: "resources directory",
      description:
        "I hope you've enjoyed this workshop. This is just the beginning. I wanted to inspire you and give you a taste of what's possible. Keep building and improving your portfolio! Add custom sections, improve styling, and make it your own! I will be adding some resources that can help you in a resources directory. Happy coding and all the best on your development journey!",
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
