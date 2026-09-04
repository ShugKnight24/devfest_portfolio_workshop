import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.jsx";
import "./index.css";

/*
 * Vercel Analytics & Speed Insights
 * These help you monitor your app's performance and user interactions in real-time in the Vercel dashboard.
 * If you want to check if these are working, deploy your app to Vercel and visit the Vercel dashboard in the `Analytics` and `Speed Insights` tabs respectively.
 * If you're not using Vercel or don't want to include these, you can remove these imports
 * You can also remove these respective packages by running `npm uninstall @vercel/analytics @vercel/speed-insights` from your terminal or remove these lines from your package.json and run `npm install` again to clean up your dependencies.
 */
import { initTelemetry } from "@portfolio/telemetry";

if (import.meta.env.PROD) {
  import("@vercel/analytics")
    .then(({ inject }) => inject())
    .catch((err) => console.warn("Vercel Analytics blocked", err));

  import("@vercel/speed-insights")
    .then(({ injectSpeedInsights }) => injectSpeedInsights())
    .catch((err) => console.warn("Vercel Speed Insights blocked", err));
}

initTelemetry();

import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { AchievementProvider } from "./components/Achievements";
import { ChallengeProvider } from "./components/ChallengeMode";
import { QuizProvider } from "./components/QuizSystem";

/*
 * Main serves as the main entry point and container for all other components.
 * It targets the root div in our index.html file to render our React application within it.
 * We wrap our App component with ThemeProvider to provide theme context to the entire app. This allows us to manage light/dark mode and other theme-related features globally.
 * ToastProvider enables toast notifications throughout the app using the useToast() hook.
 * AchievementProvider adds gamification with achievements and progress tracking.
 * ChallengeProvider enables timed coding challenges with hints and point tracking.
 * QuizProvider enables interactive quizzes with progress tracking.
 * React.StrictMode is a wrapper that helps identify potential problems in our application during development. It activates additional checks and warnings for its descendants.
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AchievementProvider>
          <ChallengeProvider>
            <QuizProvider>
              <App />
            </QuizProvider>
          </ChallengeProvider>
        </AchievementProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
