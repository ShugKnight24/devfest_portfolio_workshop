import "./App.css";
import portfolioData from "./data/portfolioData";

import { StarterInstructions } from "./components/StarterInstructions";

// These are the building blocks of your portfolio!
import { Header } from "./components/Header";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Footer } from "./components/Footer";

/**
 * The Component Tree & Props
 *
 * App.jsx is the "root" or "parent" component of your application.
 * It holds the data (portfolioData) and passes it down to "child" components
 * (Header, About, etc.) via "props".
 *
 * Think of it like a waterfall: Data flows DOWN from parent to child.
 * In React, this is a one-way flow, but we can use some nifty techniques
 * like "lifting state up" and "callback" functions to send data back up if needed.
 */

function App() {
  // This is our main app component!
  // Data prep
  // We destructure (unpack) our data here so we can pass specific pieces to specific components.
  const { personal, skills, projects } = portfolioData;
  const { aboutImage, avatar, bio, name, social } = personal; // further destructure personal data

  return (
    <div className="min-h-screen bg-linear-to-br from-(--color-background) to-gray-100 dark:from-(--color-dark) dark:to-gray-800 transition-colors duration-300">
      {/*
        CHALLENGE: Assemble Your Portfolio!

        Your goal is to replace the <StarterInstructions /> with your own components by the end of this workshop. Once completed, your portfolio should render your personal information, skills, and projects dynamically based on the data provided in `portfolioData.js`. 

        Follow these steps: 
        1. Uncomment the components one by one (Header, About, etc.).
        2. Notice how we pass data to them using props (e.g., personal={personal}). We may have to update these props based on what each component needs as we build them out.
        3. Check your browser to see your portfolio come to life!
        4. Comment out <StarterInstructions /> below once you have your portfolio rendering correctly.
        5. Deploy your portfolio and share it with the world!
        6. Profit???
      */}
      {/* <StarterInstructions /> */}

      <Header personal={personal} />
      <About avatar={avatar} aboutImage={aboutImage} bio={bio} />
      <Skills skills={skills} />
      <Projects projects={projects} />
      <Footer social={social} name={name} />
    </div>
  );
}

export default App;
