import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Close, Checkmark } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { useAchievements } from "./Achievements";
import { validateCode } from "../utils/validators";

/**
 * Challenge Mode System
 *
 * Provides timed coding challenges with hints and difficulty levels.
 * Students can practice React concepts in a fun, gamified way.
 */

// Challenge definitions
const CHALLENGES = [
  {
    id: "hello-world",
    title: "Hello World",
    difficulty: "beginner",
    timeLimit: 60, // seconds
    points: 10,
    description:
      "Create your first React component that displays 'Hello, World!'",
    instructions: [
      "Create a functional component called Greeting",
      "Return a <h1> element with the text 'Hello, World!'",
      "Export the component as default",
    ],
    starterCode: `// Create your Greeting component below
function Greeting() {
  // Your code here
}

export default Greeting;`,
    solution: `function Greeting() {
  return <h1>Hello, World!</h1>;
}

export default Greeting;`,
    hints: [
      "React components are just JavaScript functions that return JSX",
      "JSX looks like HTML but is actually JavaScript",
      "Use the return keyword to return your JSX",
    ],
    testDescription: "Component renders 'Hello, World!' in an h1 tag",
  },
  {
    id: "props-basics",
    title: "Props 101",
    difficulty: "beginner",
    timeLimit: 90,
    points: 15,
    description: "Create a component that accepts and displays a name prop",
    instructions: [
      "Create a component called Welcome",
      "Accept a 'name' prop",
      "Display 'Welcome, {name}!' where {name} is the prop value",
    ],
    starterCode: `// Create a Welcome component that accepts a name prop
function Welcome(props) {
  // Your code here
}

export default Welcome;`,
    solution: `function Welcome({ name }) {
  return <h1>Welcome, {name}!</h1>;
}

export default Welcome;`,
    hints: [
      "Props are passed to components as an object",
      "You can destructure props in the function parameter",
      "Use curly braces {} to embed JavaScript expressions in JSX",
    ],
    testDescription: "Component displays the name prop correctly",
  },
  {
    id: "state-counter",
    title: "Counter Challenge",
    difficulty: "intermediate",
    timeLimit: 120,
    points: 25,
    description: "Build a counter with increment and decrement buttons",
    instructions: [
      "Create a Counter component",
      "Use useState to track the count (start at 0)",
      "Add an increment button (+) that adds 1",
      "Add a decrement button (-) that subtracts 1",
      "Display the current count",
    ],
    starterCode: `import { useState } from 'react';

function Counter() {
  // Add your state here
  
  return (
    <div>
      {/* Add your JSX here */}
    </div>
  );
}

export default Counter;`,
    solution: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

export default Counter;`,
    hints: [
      "useState returns an array: [currentValue, setterFunction]",
      "Call the setter function to update state",
      "Use onClick to handle button clicks",
    ],
    testDescription: "Counter increments and decrements correctly",
  },
  {
    id: "list-rendering",
    title: "List Master",
    difficulty: "intermediate",
    timeLimit: 150,
    points: 30,
    description: "Render a list of items from an array",
    instructions: [
      "Create a TodoList component",
      "Accept a 'todos' prop (array of strings)",
      "Render each todo as an <li> element",
      "Use the map() function to iterate",
      "Don't forget to add a key prop!",
    ],
    starterCode: `function TodoList({ todos }) {
  // Your code here
}

export default TodoList;

// Example usage:
// <TodoList todos={['Learn React', 'Build projects', 'Get hired']} />`,
    solution: `function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo}</li>
      ))}
    </ul>
  );
}

export default TodoList;`,
    hints: [
      "Use the .map() array method to transform data into JSX",
      "Each item in a list needs a unique 'key' prop",
      "Wrap the map() call in curly braces {}",
    ],
    testDescription: "All todos render with proper keys",
  },
  {
    id: "conditional-render",
    title: "Show & Hide",
    difficulty: "intermediate",
    timeLimit: 120,
    points: 25,
    description: "Toggle content visibility with conditional rendering",
    instructions: [
      "Create a Toggle component",
      "Add a button that says 'Show' or 'Hide'",
      "When shown, display a message 'Hello! 👋'",
      "When hidden, don't render the message",
    ],
    starterCode: `import { useState } from 'react';

function Toggle() {
  // Add state to track visibility
  
  return (
    <div>
      {/* Add button and conditional content */}
    </div>
  );
}

export default Toggle;`,
    solution: `import { useState } from 'react';

function Toggle() {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Hide' : 'Show'}
      </button>
      {isVisible && <p>Hello! 👋</p>}
    </div>
  );
}

export default Toggle;`,
    hints: [
      "Use a boolean state to track visibility",
      "The && operator is great for conditional rendering",
      "Use the ! operator to toggle boolean values",
    ],
    testDescription: "Content toggles on button click",
  },
  {
    id: "useeffect-basic",
    title: "Effect Hook",
    difficulty: "advanced",
    timeLimit: 180,
    points: 40,
    description: "Use useEffect to update the document title",
    instructions: [
      "Create a PageTitle component",
      "Accept a 'title' prop",
      "Use useEffect to update document.title",
      "The title should update when the prop changes",
    ],
    starterCode: `import { useEffect } from 'react';

function PageTitle({ title }) {
  // Use useEffect to update document.title
  
  return <h1>{title}</h1>;
}

export default PageTitle;`,
    solution: `import { useEffect } from 'react';

function PageTitle({ title }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  
  return <h1>{title}</h1>;
}

export default PageTitle;`,
    hints: [
      "useEffect takes a function as its first argument",
      "The second argument is the dependency array",
      "Include 'title' in dependencies to run when it changes",
    ],
    testDescription: "Document title updates with prop changes",
  },
];

// Challenge Context
const ChallengeContext = createContext(null);

export const ChallengeProvider = ({ children }) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState(() => {
    const saved = localStorage.getItem("completedChallenges");
    return saved ? JSON.parse(saved) : [];
  });
  const [challengeStats, setChallengeStats] = useState(() => {
    const saved = localStorage.getItem("challengeStats");
    return saved
      ? JSON.parse(saved)
      : { totalPoints: 0, totalTime: 0, attempts: 0 };
  });

  useEffect(() => {
    localStorage.setItem(
      "completedChallenges",
      JSON.stringify(completedChallenges),
    );
  }, [completedChallenges]);

  useEffect(() => {
    localStorage.setItem("challengeStats", JSON.stringify(challengeStats));
  }, [challengeStats]);

  const startChallenge = (challengeId) => {
    const challenge = CHALLENGES.find((c) => c.id === challengeId);
    if (challenge) {
      setCurrentChallenge({
        ...challenge,
        startTime: Date.now(),
        hintsUsed: 0,
        code: challenge.starterCode,
      });
    }
  };

  const completeChallenge = (timeTaken, hintsUsed) => {
    if (!currentChallenge) return;

    // Calculate points (bonus for time and hint usage)
    let points = currentChallenge.points;
    if (timeTaken < currentChallenge.timeLimit / 2) {
      points += Math.floor(currentChallenge.points * 0.5); // 50% bonus for speed
    }
    points -= hintsUsed * 5; // Penalty for hints
    points = Math.max(points, Math.floor(currentChallenge.points * 0.5)); // Minimum 50%

    setCompletedChallenges((prev) => [
      ...prev.filter((c) => c.id !== currentChallenge.id),
      {
        id: currentChallenge.id,
        completedAt: Date.now(),
        timeTaken,
        hintsUsed,
        points,
      },
    ]);

    setChallengeStats((prev) => ({
      totalPoints: prev.totalPoints + points,
      totalTime: prev.totalTime + timeTaken,
      attempts: prev.attempts + 1,
    }));

    setCurrentChallenge(null);
    return points;
  };

  const abandonChallenge = () => {
    setCurrentChallenge(null);
  };

  return (
    <ChallengeContext.Provider
      value={{
        challenges: CHALLENGES,
        currentChallenge,
        completedChallenges,
        challengeStats,
        startChallenge,
        completeChallenge,
        abandonChallenge,
        setCurrentChallenge,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenges = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error("useChallenges must be used within ChallengeProvider");
  }
  return context;
};

// Difficulty badge colors
const difficultyColors = {
  beginner:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Challenge Card Component
export const ChallengeCard = ({ challenge, onStart }) => {
  const { completedChallenges } = useChallenges();
  const isCompleted = completedChallenges.some((c) => c.id === challenge.id);
  const completionData = completedChallenges.find((c) => c.id === challenge.id);

  return (
    <div
      className={`p-6 rounded-xl border-2 transition-all ${
        isCompleted
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {challenge.title}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              difficultyColors[challenge.difficulty]
            }`}
          >
            {challenge.difficulty}
          </span>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Checkmark className="w-5 h-5" />
            <span className="text-sm font-medium">
              +{completionData?.points}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {challenge.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            <EmojiIcon emoji="⏱️" className="w-4 h-4 inline" />{" "}
            {challenge.timeLimit}s
          </span>
          <span>
            <EmojiIcon emoji="⭐" className="w-4 h-4 inline" />{" "}
            {challenge.points} pts
          </span>
        </div>
        <button
          onClick={() => onStart(challenge.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isCompleted
              ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isCompleted ? "Retry" : "Start"}
        </button>
      </div>
    </div>
  );
};

// Challenge Modal - Active challenge interface
export const ChallengeModal = ({ isOpen, onClose }) => {
  const {
    currentChallenge,
    setCurrentChallenge,
    completeChallenge,
    abandonChallenge,
  } = useChallenges();
  const { trackAction } = useAchievements();

  const [timeLeft, setTimeLeft] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!currentChallenge || completed) return;

    setTimeLeft(currentChallenge.timeLimit);
    setTestResults(null); // Reset test results on new challenge

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentChallenge, completed]);

  // Handle time running out
  useEffect(() => {
    if (timeLeft === 0 && currentChallenge && !completed) {
      // Time's up! Still let them see solution
    }
  }, [timeLeft, currentChallenge, completed]);

  const runTests = () => {
    setIsRunningTests(true);
    // Small delay to show loading state
    setTimeout(() => {
      const results = validateCode(currentChallenge.code, currentChallenge);
      setTestResults(results);
      setIsRunningTests(false);
    }, 500);
  };

  const handleComplete = () => {
    // First run tests if not already run
    if (!testResults) {
      const results = validateCode(currentChallenge.code, currentChallenge);
      setTestResults(results);
      if (!results.valid) {
        return; // Don't complete if tests fail
      }
    } else if (!testResults.valid) {
      return; // Don't complete if tests failed
    }

    const timeTaken = currentChallenge.timeLimit - timeLeft;
    const points = completeChallenge(timeTaken, currentHintIndex);
    setEarnedPoints(points);
    setCompleted(true);
    trackAction("playground_run"); // Track as code activity
  };

  const handleClose = () => {
    if (!completed && currentChallenge) {
      abandonChallenge();
    }
    setCompleted(false);
    setShowHint(false);
    setCurrentHintIndex(0);
    setShowSolution(false);
    setEarnedPoints(0);
    setTestResults(null);
    onClose();
  };

  const useHint = () => {
    if (currentHintIndex < currentChallenge.hints.length) {
      setShowHint(true);
      setCurrentHintIndex((prev) => prev + 1);
      setCurrentChallenge((prev) => ({
        ...prev,
        hintsUsed: (prev.hintsUsed || 0) + 1,
      }));
    }
  };

  if (!isOpen || !currentChallenge) return null;

  const progress = (timeLeft / currentChallenge.timeLimit) * 100;
  const isTimeUp = timeLeft === 0;
  const canComplete = testResults?.valid === true;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {currentChallenge.title}
            </h2>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                difficultyColors[currentChallenge.difficulty]
              }`}
            >
              {currentChallenge.difficulty}
            </span>
          </div>

          {/* Timer */}
          {!completed && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p
                  className={`text-2xl font-mono font-bold ${
                    isTimeUp
                      ? "text-red-500"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </p>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      progress > 50
                        ? "bg-green-500"
                        : progress > 25
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                aria-label="Close challenge"
              >
                <Close className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {completed ? (
            // Completion Screen
            <div className="text-center py-12">
              <div className="text-(--color-text-primary) mb-4 flex justify-center">
                <EmojiIcon emoji="🎉" className="w-14 h-14" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Challenge Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You earned{" "}
                <span className="text-yellow-500 font-bold">
                  {earnedPoints} points
                </span>
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Instructions */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Instructions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {currentChallenge.description}
                  </p>
                  <ul className="space-y-2">
                    {currentChallenge.instructions.map((instruction, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-blue-500 font-bold">
                          {i + 1}.
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hints */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-300 inline-flex items-center gap-1.5">
                      <EmojiIcon emoji="💡" className="w-5 h-5" /> Need a hint?
                    </h4>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      -5 pts per hint
                    </span>
                  </div>
                  {showHint && currentHintIndex > 0 && (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      {currentChallenge.hints[currentHintIndex - 1]}
                    </p>
                  )}
                  <button
                    onClick={useHint}
                    disabled={currentHintIndex >= currentChallenge.hints.length}
                    className="text-sm px-3 py-1 bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentHintIndex >= currentChallenge.hints.length
                      ? "No more hints"
                      : `Get Hint (${currentHintIndex}/${currentChallenge.hints.length})`}
                  </button>
                </div>
              </div>

              {/* Code Editor Area */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Your Code
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <textarea
                      value={currentChallenge.code}
                      onChange={(e) => {
                        setCurrentChallenge((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }));
                        // Reset test results when code changes
                        if (testResults) setTestResults(null);
                      }}
                      className="w-full h-64 bg-transparent text-gray-100 resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Test Results */}
                {testResults && (
                  <div
                    className={`p-4 rounded-lg ${
                      testResults.valid
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {testResults.valid ? (
                        <>
                          <Checkmark className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h4 className="font-medium text-green-700 dark:text-green-300">
                            All Tests Passed!
                          </h4>
                        </>
                      ) : (
                        <>
                          <Close className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <h4 className="font-medium text-red-700 dark:text-red-300">
                            Tests Failed ({testResults.errors?.length || 0}{" "}
                            issues)
                          </h4>
                        </>
                      )}
                    </div>
                    {testResults.errors && testResults.errors.length > 0 && (
                      <ul className="space-y-1 ml-7">
                        {testResults.errors.map((error, i) => (
                          <li
                            key={i}
                            className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"
                          >
                            <span className="text-red-400">•</span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    )}
                    {testResults.valid && (
                      <p className="text-sm text-green-600 dark:text-green-400 ml-7">
                        Great job! Click "Complete Challenge" to finish.
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={runTests}
                    disabled={isRunningTests}
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    {isRunningTests ? (
                      <>
                        <span className="animate-spin">
                          <EmojiIcon emoji="⚙️" className="w-5 h-5" />
                        </span>
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <EmojiIcon emoji="▶️" className="w-5 h-5" /> Run Tests
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!canComplete}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      canComplete
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                    title={!canComplete ? "Run tests and pass them first!" : ""}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5 w-full">
                      <Checkmark className="w-4 h-4 inline shrink-0" /> Complete Challenge
                    </span>
                  </button>
                </div>

                {/* Help text */}
                {!testResults && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center inline-flex items-center justify-center gap-1.5 w-full">
                    <EmojiIcon emoji="💡" className="w-4 h-4" /> Click "Run
                    Tests" to check if your code is correct
                  </p>
                )}

                {/* Show Solution Button */}
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                >
                  {showSolution ? "Hide" : "Show"} Solution
                </button>

                {/* Solution */}
                {showSolution && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Solution
                    </h4>
                    <pre className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 p-3 rounded overflow-x-auto">
                      {currentChallenge.solution}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Challenge List Page Component
export const ChallengeModePanel = () => {
  const { challenges, challengeStats, startChallenge, currentChallenge } =
    useChallenges();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartChallenge = (challengeId) => {
    startChallenge(challengeId);
    setIsModalOpen(true);
  };

  const groupedChallenges = {
    beginner: challenges.filter((c) => c.difficulty === "beginner"),
    intermediate: challenges.filter((c) => c.difficulty === "intermediate"),
    advanced: challenges.filter((c) => c.difficulty === "advanced"),
  };

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow text-center">
          <p className="text-2xl font-bold text-yellow-500">
            {challengeStats.totalPoints}
          </p>
          <p className="text-sm text-gray-500">Total Points</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow text-center">
          <p className="text-2xl font-bold text-blue-500">
            {challengeStats.attempts}
          </p>
          <p className="text-sm text-gray-500">Challenges Done</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow text-center">
          <p className="text-2xl font-bold text-green-500">
            {challengeStats.totalTime > 0
              ? `${Math.floor(challengeStats.totalTime / 60)}m`
              : "0m"}
          </p>
          <p className="text-sm text-gray-500">Time Spent</p>
        </div>
      </div>

      {/* Challenge Lists by Difficulty */}
      {Object.entries(groupedChallenges).map(([difficulty, challengeList]) => (
        <div key={difficulty}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 capitalize flex items-center gap-2">
            {difficulty === "beginner" && (
              <EmojiIcon emoji="🌱" className="w-5 h-5" />
            )}
            {difficulty === "intermediate" && (
              <EmojiIcon emoji="🌿" className="w-5 h-5" />
            )}
            {difficulty === "advanced" && (
              <EmojiIcon emoji="🌳" className="w-5 h-5" />
            )}
            {difficulty}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {challengeList.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onStart={handleStartChallenge}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ChallengeProvider;
