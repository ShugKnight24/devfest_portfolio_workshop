/**
 * Test Utilities
 *
 * Custom render function that wraps components with all necessary providers.
 * Use this instead of @testing-library/react's render for components that
 * need context (themes, challenges, routing, etc.)
 */

import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AchievementProvider } from "../components/Achievements";
import { ChallengeProvider } from "../components/ChallengeMode";

/**
 * Custom render with all providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional render options
 */
export function renderWithProviders(ui, options = {}) {
  const {
    withRouter = true,
    withTheme = true,
    withAchievements = true,
    withChallenges = true,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    let wrapped = children;

    if (withChallenges) {
      wrapped = <ChallengeProvider>{wrapped}</ChallengeProvider>;
    }
    if (withAchievements) {
      wrapped = <AchievementProvider>{wrapped}</AchievementProvider>;
    }
    if (withTheme) {
      wrapped = <ThemeProvider>{wrapped}</ThemeProvider>;
    }
    if (withRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
    }

    return wrapped;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with just Router (for simpler component tests)
 */
export function renderWithRouter(ui, options = {}) {
  return renderWithProviders(ui, {
    withRouter: true,
    withTheme: false,
    withAchievements: false,
    withChallenges: false,
    ...options,
  });
}

/**
 * Render with Theme only
 */
export function renderWithTheme(ui, options = {}) {
  return renderWithProviders(ui, {
    withRouter: false,
    withTheme: true,
    withAchievements: false,
    withChallenges: false,
    ...options,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
