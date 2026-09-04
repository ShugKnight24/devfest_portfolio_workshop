import { useState } from "react";
import portfolioData from "../data/portfolioData";

// Components
import { Header } from "../components/Header";
import { About } from "../components/About";
import { Skills } from "../components/Skills";
import { Projects } from "../components/Projects";
import { Footer } from "../components/Footer";

import { StarterInstructions } from "../components/StarterInstructions";
import { PortfolioExportImport } from "../components/PortfolioExportImport";
import { useToast } from "../components/Toast";

export const PortfolioBuilder = () => {
  /**
   * This PortfolioBuilder component holds our data (portfoioData) and passes it down to "child" components
   * (Header, About, Skills, Projects, Footer, etc.) via "props".
   * In React, this is a one-way flow. Think of it like a waterfall: Data flows DOWN from parent to child.
   * Ther water only flows one way, it doesn't flow back up!
   * The water at the top of the waterfall (App.jsx) is the source of truth for all data.
   * we can use some techniques
   * like "lifting state up" and "callback" functions to send data back up when needed.
   */
  /*
   * Data preparation
   * We destructure (unpack) our data below so we can pass specific pieces of data to components that are expecting them.
   * For example, the Header component needs personal data (name, title, etc.), so we pass personal={personal} to it or we can specify the Header to look more granularly for specific properities
   * This is not required, you can pass the entire portfolioData object to the components and traverse the data structure to access the date you want to display
   * This is all based on preference
   */
  const { personal, skills, projects } = portfolioData;
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentData, setCurrentData] = useState(portfolioData);
  const { addToast } = useToast();

  // Handle importing portfolio data
  const handleImport = (importedData) => {
    setCurrentData(importedData);
    addToast("Portfolio data imported! Refresh to see changes.", "success");
  };

  // Use currentData for rendering (allows imported data to be previewed)
  const displayData = currentData;

  {
    /*
        CHALLENGE: Assemble Your Portfolio!

        Your goal is to replace the <StarterInstructions /> with your own components by the end of this workshop. Once completed, your portfolio should render your personal information, skills, and projects dynamically based on the data you've provided in `portfolioData.js`. 

        Follow these steps:
        1. Work through the components one by one (Header, About, etc.).
        2. Notice how we pass data to them using props (e.g., personal={personal}). We may have to update these props based on what each component needs as we build them out. This is the data we'll have access to inside those components.
        3. Check your browser to see your portfolio come to life!
        4. Comment out <StarterInstructions /> below once you have your portfolio rendering correctly.
        5. Deploy your portfolio and share it with the world!
        6. Profit???
      */
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-24">
      {/*
       * I thought it would be easier to have the instructions available while building and add a toggle button to hide them as needed
       * If you prefer, you can remove the instructions and button and the related state management altogether as there is a dedicated route for the guide
       */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <PortfolioExportImport
          portfolioData={displayData}
          onImport={handleImport}
          className="shadow-lg"
        />
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all font-medium text-sm"
        >
          {showInstructions ? "Hide Instructions" : "Show Instructions"}
        </button>
      </div>
      {showInstructions && <StarterInstructions />}
      <Header personal={displayData.personal} />
      <About
        avatar={displayData.personal.avatar}
        bio={displayData.personal.bio}
      />
      <Skills skills={displayData.skills} />
      <Projects projects={displayData.projects} />
      <Footer
        social={displayData.personal.social}
        name={displayData.personal.name}
      />
    </div>
  );
};
