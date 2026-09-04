import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { trackEvent } from "@portfolio/telemetry";

// Pages
import { Demo } from "./pages/Demo";
import { Lessons } from "./pages/Lessons";
import { NotFound } from "./pages/NotFound";
import { Showcase } from "./pages/Showcase";
import { WhatsNext } from "./pages/WhatsNext";
import { TroubleshootingPage } from "./pages/TroubleshootingPage";
import AchievementsPage from "./pages/AchievementsPage";
import ChallengesPage from "./pages/ChallengesPage";
import ProgressDashboard from "./pages/ProgressDashboard";
import QuizPage from "./pages/QuizPage";
import ComponentPreviewPage from "./pages/ComponentPreviewPage";
import { WorkshopSlides } from "./pages/WorkshopSlides";
import { TelemetryDashboard } from "./pages/TelemetryDashboard";
import { LandingPage } from "./pages/LandingPage";
import { Resources } from "./pages/Resources";
import { AgenticStudio } from "./pages/AgenticStudio";
import { SpeakingEventsHub } from "./components/SpeakingEventsHub";

// Components
import { Navigation } from "./components/Navigation";
import { PortfolioBuilder } from "./pages/PortfolioBuilder";
import { ScrollProgress } from "./components/ScrollProgress";
import { ScrollToTop } from "./components/ScrollToTop";
import { StarterInstructions } from "./components/StarterInstructions";
import { KonamiEasterEgg } from "./components/KonamiEasterEgg";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { SkeletonStyles } from "./components/Skeleton";
import {
  AchievementNotification,
  useAchievements,
} from "./components/Achievements";

// Context
import { useTheme } from "./context/ThemeContext";

import "./App.css";

const TelemetryTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackEvent("page_view", { route: location.pathname });
  }, [location.pathname]);
  return null;
};

/**
 * The Component Tree & Props
 *
 * App.jsx is the "root" or "parent" component of our application.
 *
 * It contains other components like Navigation, PortfolioBuilder, Showcase, etc.
 *
 * What is JSX?
 *
 * JSX stands for JavaScript XML. It is a syntax extension for JavaScript that looks similar to HTML.
 * It allows us to write HTML-like code within our JavaScript files.
 * Under the hood, JSX is transformed into regular JavaScript function calls (React.createElement).
 * This makes it easier to visualize the structure of our UI components.
 * It allows us to create reusable components that encapsulate both structure and behavior.
 *
 * Key JSX Features:
 * 1. Embedding Expressions: We can embed JavaScript expressions within JSX using curly braces {}.
 *    This allows us to dynamically render data and evaluate expressions.
 * 2. Component Composition: JSX allows us to compose components together, nesting them to create complex UIs.
 * 3. Props: We can pass data to components via "props" (properties) using JSX attributes.
 * 4. Conditional Rendering: We can use JavaScript logic (like ternary operators) within JSX to conditionally render elements.
 * 5. Styling: We can apply styles directly using the style attribute or by using className instead of the `class` attribute
 *  for CSS classes.
 */

export const App = () => {
  // Use state is a React hook that allows us to add state to functional components
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { toggleDarkMode } = useTheme();
  const { trackAction } = useAchievements();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // ? or Cmd+K / Ctrl+K for shortcuts modal
      if (e.key === "?" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        setShowShortcutsModal(true);
        trackAction("keyboard_shortcut");
      }

      // D for dark mode toggle
      if (e.key === "d" || e.key === "D") {
        toggleDarkMode();
        trackAction("dark_mode_toggle");
        trackAction("keyboard_shortcut");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleDarkMode, trackAction]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /*
   * This is our app component, we setup our routes here
   * We use the React-Router-DOM library to handle routing
   * Routes allow us to create multiple "pages" in our React app
   * Each Route corresponds to a different URL path and renders a specific component
   * Feel free to add, remove, or modify routes as needed for your portfolio
   * We also include a catch all route for 404 Not Found pages if needed
   */
  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) transition-colors duration-300">
      <ScrollProgress />
      <KonamiEasterEgg />
      <SkeletonStyles />
      <AchievementNotification />
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      {/*
       * These are different routes (URL locations) that will exists on our portfolio
       * This is not required, but will explain how we create different pages in a React app
       */}
      <BrowserRouter>
        <TelemetryTracker />
        <div className="font-sans antialiased text-(--color-text) dark:text-(--color-text-dark)">
          {/* Global Navigation for the Workshop */}
          <Navigation />

          <Routes>
            {/* Landing Page & Course Selector */}
            <Route path="/" element={<LandingPage />} />
            {/* The Portfolio Building Workspace */}
            <Route path="/builder" element={<PortfolioBuilder />} />
            {/* A Demo of the "Final Product" */}
            <Route path="/demo" element={<Demo />} />
            {/* A dedicated instructions page */}
            <Route path="/guide" element={<StarterInstructions />} />
            {/* A dedicated lessons section */}
            <Route path="/lessons" element={<Lessons />} />
            {/* Deep link -> Go directly to a specific lesson */}
            <Route path="/lessons/:lessonId" element={<Lessons />} />
            {/* A Showcase of different portfolio styles - Compare how different components would look */}
            <Route path="/showcase" element={<Showcase />} />
            {/* What's Next - Learning resources and next steps */}
            <Route path="/whats-next" element={<WhatsNext />} />
            {/* Troubleshooting - Help for common issues */}
            <Route path="/help" element={<TroubleshootingPage />} />
            {/* Resources - Curated developer resources */}
            <Route path="/resources" element={<Resources />} />
            {/* Achievements - Track progress and unlock rewards */}
            <Route path="/achievements" element={<AchievementsPage />} />
            {/* Challenges - Timed coding challenges */}
            <Route path="/challenges" element={<ChallengesPage />} />
            {/* Progress Dashboard - Track overall progress */}
            <Route path="/dashboard" element={<ProgressDashboard />} />
            {/* Telemetry Dashboard */}
            <Route path="/dashboard/telemetry" element={<TelemetryDashboard />} />
            {/* Quiz - Interactive knowledge quizzes */}
            <Route path="/quiz" element={<QuizPage />} />
            {/* Component Preview - Interactive component playground */}
            <Route path="/components" element={<ComponentPreviewPage />} />
            {/* Workshop Slides - Interactive cinematic presentation */}
            <Route path="/slides" element={<WorkshopSlides />} />
            <Route path="/slides/:deckId" element={<WorkshopSlides />} />
            {/* Speaking Events & Conference Hub */}
            <Route path="/events" element={<SpeakingEventsHub />} />
            {/* Agentic Studio & Audience of One Software */}
            <Route path="/agentic-studio" element={<AgenticStudio />} />
            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
      <ScrollToTop isVisible={showScrollToTop} onClick={scrollToTop} />
    </div>
  );
};
