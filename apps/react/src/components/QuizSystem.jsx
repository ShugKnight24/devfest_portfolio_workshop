import {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { Close, Checkmark } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { useAchievements } from "./Achievements";

/**
 * Interactive Quiz System
 *
 * Features:
 * - Multiple choice questions
 * - Code completion challenges
 * - Fix-the-bug exercises
 * - Instant feedback with explanations
 * - Progress tracking
 */

// Quiz questions database
const QUIZ_QUESTIONS = {
  jsx: [
    {
      id: "jsx-1",
      type: "multiple-choice",
      question: "What does JSX stand for?",
      options: [
        "JavaScript XML",
        "Java Syntax Extension",
        "JSON XML",
        "JavaScript XHR",
      ],
      correct: 0,
      explanation:
        "JSX stands for JavaScript XML. It allows you to write HTML-like syntax in your JavaScript code, which React then transforms into regular JavaScript.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "jsx-2",
      type: "multiple-choice",
      question: "How do you embed a JavaScript expression in JSX?",
      options: [
        'Using double quotes: "expression"',
        "Using curly braces: {expression}",
        "Using parentheses: (expression)",
        "Using square brackets: [expression]",
      ],
      correct: 1,
      explanation:
        "In JSX, you use curly braces {} to embed JavaScript expressions. This allows you to include variables, function calls, and any valid JavaScript expression within your JSX.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "jsx-3",
      type: "code-output",
      question: "What will this JSX render?",
      code: `const name = "React";
return <h1>Hello, {name}!</h1>;`,
      options: ["Hello, {name}!", "Hello, React!", "Hello, name!", "An error"],
      correct: 1,
      explanation:
        "The curly braces tell React to evaluate the JavaScript expression inside. Since `name` equals 'React', it renders 'Hello, React!'.",
      difficulty: "beginner",
      points: 10,
    },
  ],
  components: [
    {
      id: "comp-1",
      type: "multiple-choice",
      question: "What is a React component?",
      options: [
        "A CSS stylesheet",
        "A reusable piece of UI",
        "A JavaScript variable",
        "An HTML file",
      ],
      correct: 1,
      explanation:
        "A React component is a reusable piece of UI that can accept inputs (props) and return JSX describing what should appear on screen.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "comp-2",
      type: "multiple-choice",
      question: "How should you name a React component?",
      options: [
        "camelCase (myComponent)",
        "snake_case (my_component)",
        "PascalCase (MyComponent)",
        "lowercase (mycomponent)",
      ],
      correct: 2,
      explanation:
        "React components must start with a capital letter (PascalCase). This is how React distinguishes between HTML elements (lowercase) and custom components.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "comp-3",
      type: "fix-the-bug",
      question: "Fix the bug in this component:",
      code: `function greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}`,
      bugDescription: "The component won't render properly",
      options: [
        "Change 'props' to 'attributes'",
        "Capitalize the function name to 'Greeting'",
        "Remove the curly braces",
        "Add 'export default'",
      ],
      correct: 1,
      explanation:
        "React components must start with a capital letter. 'greeting' should be 'Greeting' for React to recognize it as a component.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  props: [
    {
      id: "props-1",
      type: "multiple-choice",
      question: "What are props in React?",
      options: [
        "Internal component state",
        "Data passed from parent to child",
        "CSS properties",
        "Browser properties",
      ],
      correct: 1,
      explanation:
        "Props (short for properties) are how data flows from parent components to child components in React. They are read-only and cannot be modified by the child.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "props-2",
      type: "code-output",
      question: "What does this component render?",
      code: `function Welcome({ name, age }) {
  return <p>{name} is {age} years old</p>;
}

<Welcome name="Alex" age={25} />`,
      options: [
        "Alex is 25 years old",
        "{name} is {age} years old",
        "undefined is undefined years old",
        "An error",
      ],
      correct: 0,
      explanation:
        "The component destructures `name` and `age` from props. When called with name='Alex' and age={25}, it renders 'Alex is 25 years old'.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  state: [
    {
      id: "state-1",
      type: "multiple-choice",
      question: "What hook is used to add state to a functional component?",
      options: ["useEffect", "useContext", "useState", "useReducer"],
      correct: 2,
      explanation:
        "useState is the primary hook for adding state to functional components. It returns an array with the current state value and a function to update it.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "state-2",
      type: "code-output",
      question: "What's the initial value of `count`?",
      code: `const [count, setCount] = useState(0);`,
      options: ["undefined", "null", "0", "[]"],
      correct: 2,
      explanation:
        "useState takes an initial value as its argument. Here, count is initialized to 0.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "state-3",
      type: "fix-the-bug",
      question: "Fix the state update bug:",
      code: `function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    count = count + 1;
  };
  
  return <button onClick={increment}>{count}</button>;
}`,
      bugDescription: "The counter doesn't update when clicked",
      options: [
        "Use count++ instead",
        "Use setCount(count + 1) instead",
        "Add 'let' before count",
        "Remove useState",
      ],
      correct: 1,
      explanation:
        "State should never be mutated directly. Use the setter function setCount(count + 1) to properly update state and trigger a re-render.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  events: [
    {
      id: "events-1",
      type: "multiple-choice",
      question: "How do you handle a click event in React?",
      options: [
        "onclick='handleClick()'",
        "onClick={handleClick}",
        "on-click={handleClick}",
        "click={handleClick}",
      ],
      correct: 1,
      explanation:
        "React uses camelCase for event handlers (onClick, not onclick). You pass the function reference without parentheses, or React would call it immediately.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "events-2",
      type: "code-output",
      question: "What happens when the button is clicked?",
      code: `<button onClick={console.log("clicked")}>
  Click me
</button>`,
      options: [
        "'clicked' logs when clicked",
        "'clicked' logs immediately on render",
        "Nothing happens",
        "An error occurs",
      ],
      correct: 1,
      explanation:
        "Because of the parentheses, console.log('clicked') is called immediately when the component renders, not when clicked. Should be: onClick={() => console.log('clicked')}",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  lists: [
    {
      id: "lists-1",
      type: "multiple-choice",
      question: "What method is commonly used to render lists in React?",
      options: ["forEach()", "filter()", "map()", "reduce()"],
      correct: 2,
      explanation:
        "The map() method is used to transform an array of data into an array of JSX elements. forEach() doesn't return anything, which is why map() is preferred.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "lists-2",
      type: "multiple-choice",
      question: "Why do list items need a 'key' prop?",
      options: [
        "To style the elements",
        "To help React identify which items changed",
        "To make items clickable",
        "Keys are optional",
      ],
      correct: 1,
      explanation:
        "Keys help React identify which items have changed, been added, or removed. This enables efficient re-rendering and maintains component state correctly.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  vue: [
    {
      id: "vue-1",
      type: "multiple-choice",
      question: "What does `ref()` do in Vue 3's Composition API?",
      options: [
        "Creates a reactive reference to a value",
        "References a DOM element",
        "Imports another component",
        "Creates a new Vue instance",
      ],
      correct: 0,
      explanation:
        "ref() creates a reactive reference to a value. When the value changes, Vue automatically updates any part of the UI that depends on it. Access the value with .value in script, but use it directly in templates.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "vue-2",
      type: "multiple-choice",
      question: "What is the purpose of `<style scoped>` in a Vue SFC?",
      options: [
        "It minifies the CSS",
        "Limits CSS to the current component only",
        "Enables CSS modules",
        "It adds vendor prefixes automatically",
      ],
      correct: 1,
      explanation:
        "The scoped attribute limits CSS rules to the current component only by adding a unique data attribute. This prevents style leaking between components.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "vue-3",
      type: "multiple-choice",
      question: "Which directive renders a list in Vue?",
      options: ["v-repeat", "v-list", "v-for", "v-each"],
      correct: 2,
      explanation:
        "v-for is the Vue directive for rendering lists. Usage: v-for=\"item in items\" with a :key binding for efficient DOM updates.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "vue-4",
      type: "multiple-choice",
      question: "What's the difference between `v-if` and `v-show`?",
      options: [
        "v-if is faster, v-show is slower",
        "v-if adds/removes from DOM, v-show toggles CSS display",
        "They are identical",
        "v-show only works on components, v-if works on elements",
      ],
      correct: 1,
      explanation:
        "v-if conditionally adds or removes elements from the DOM entirely, while v-show always keeps the element in the DOM and toggles its CSS display property. Use v-show for frequent toggles, v-if for rare changes.",
      difficulty: "intermediate",
      points: 15,
    },
    {
      id: "vue-5",
      type: "multiple-choice",
      question: "How do you define props in `<script setup>`?",
      options: [
        "export default { props: [] }",
        "this.props = {}",
        "defineProps()",
        "const props = new Props()",
      ],
      correct: 2,
      explanation:
        "In Vue 3's <script setup>, defineProps() is a compiler macro that declares props. It doesn't need to be imported and supports both runtime and type-based declarations.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  svelte: [
    {
      id: "svelte-1",
      type: "multiple-choice",
      question: "What makes Svelte different from React and Vue?",
      options: [
        "It uses a virtual DOM for faster rendering",
        "It's a compiler — no virtual DOM, compiles to vanilla JS",
        "It only works server-side",
        "It requires TypeScript",
      ],
      correct: 1,
      explanation:
        "Svelte is a compiler that converts your declarative components into efficient vanilla JavaScript at build time. Unlike React and Vue, it doesn't ship a runtime virtual DOM — resulting in smaller bundles and faster updates.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "svelte-2",
      type: "multiple-choice",
      question: "What does the `$:` label do in Svelte?",
      options: [
        "Declares a constant",
        "Creates a reactive declaration that re-runs when dependencies change",
        "Defines a CSS variable",
        "Marks code as server-only",
      ],
      correct: 1,
      explanation:
        "The $: label creates a reactive declaration in Svelte. Any statement prefixed with $: will automatically re-run whenever the values it depends on change, similar to computed properties in Vue.",
      difficulty: "intermediate",
      points: 15,
    },
    {
      id: "svelte-3",
      type: "multiple-choice",
      question: "How do you declare a prop in Svelte?",
      options: [
        "const { prop } = defineProps()",
        "@Input() propName",
        "export let propName",
        "this.props.propName",
      ],
      correct: 2,
      explanation:
        "In Svelte, you declare a prop by exporting a variable with 'export let propName'. The parent component can then pass data into it as an attribute.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "svelte-4",
      type: "multiple-choice",
      question: "What syntax renders a list in Svelte?",
      options: [
        "items.map(item => ...)",
        "v-for=\"item in items\"",
        "{#each array as item}",
        "*ngFor=\"let item of items\"",
      ],
      correct: 2,
      explanation:
        "{#each array as item} is Svelte's block syntax for iterating over arrays. It supports keyed each blocks with (item.id) for efficient updates.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "svelte-5",
      type: "multiple-choice",
      question: "How are styles scoped in Svelte?",
      options: [
        "You must use CSS modules",
        "You need to add a 'scoped' attribute",
        "Automatically — all <style> blocks are scoped by default",
        "Styles are always global",
      ],
      correct: 2,
      explanation:
        "In Svelte, all styles within a component's <style> block are automatically scoped to that component. Svelte adds unique class names at compile time, so no extra configuration is needed.",
      difficulty: "beginner",
      points: 10,
    },
  ],
  ai: [
    {
      id: "ai-1",
      type: "multiple-choice",
      question: "What is 'agentic development'?",
      options: [
        "Writing code without version control",
        "Using AI agents that can autonomously use tools, browse, write code, and iterate",
        "Developing mobile apps for secret agents",
        "A waterfall development methodology",
      ],
      correct: 1,
      explanation:
        "Agentic development refers to using AI agents that can autonomously plan, write code, use tools (like terminals and browsers), and iterate on solutions — acting as an intelligent coding partner.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "ai-2",
      type: "multiple-choice",
      question:
        "What is prompt engineering in the context of coding?",
      options: [
        "Building AI hardware",
        "Writing clear, specific instructions for AI to generate the code you want",
        "Designing command-line prompts",
        "Engineering terminal applications",
      ],
      correct: 1,
      explanation:
        "Prompt engineering is the practice of writing clear, specific instructions that guide AI models to generate accurate, relevant code. Better prompts lead to better outputs — context, examples, and constraints all help.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "ai-3",
      type: "multiple-choice",
      question:
        "Which is the BEST practice when using AI for code generation?",
      options: [
        "Blindly copy-paste all AI output",
        "Never use AI — always write from scratch",
        "Review and understand all AI-generated code before committing",
        "Only use AI for comments and documentation",
      ],
      correct: 2,
      explanation:
        "Always review and understand AI-generated code before committing. AI can produce incorrect, insecure, or sub-optimal code. Treat it as a draft from a colleague that needs your code review.",
      difficulty: "intermediate",
      points: 15,
    },
    {
      id: "ai-4",
      type: "multiple-choice",
      question: "What is MCP (Model Context Protocol)?",
      options: [
        "A CSS preprocessor",
        "A protocol that lets AI models connect to external tools and data sources",
        "A JavaScript testing framework",
        "A version control system",
      ],
      correct: 1,
      explanation:
        "MCP (Model Context Protocol) is an open protocol that standardizes how AI models connect to external tools, APIs, and data sources. It enables AI agents to interact with databases, file systems, browsers, and more.",
      difficulty: "intermediate",
      points: 15,
    },
    {
      id: "ai-5",
      type: "multiple-choice",
      question: "When should you NOT rely on AI-generated code?",
      options: [
        "When writing unit tests",
        "When prototyping UI layouts",
        "When dealing with security-critical logic, auth, or encryption",
        "When generating boilerplate code",
      ],
      correct: 2,
      explanation:
        "Security-critical code (authentication, encryption, authorization) should always be written and reviewed by experienced developers. AI may introduce subtle vulnerabilities that are hard to spot but easy to exploit.",
      difficulty: "intermediate",
      points: 15,
    },
  ],
  "web-fundamentals": [
    {
      id: "webfund-1",
      type: "multiple-choice",
      question: "What does semantic HTML mean?",
      options: [
        "HTML that uses only div and span elements",
        "Using HTML elements that describe their meaning, like <nav>, <article>, <section>",
        "HTML with inline styles",
        "HTML that passes W3C validation",
      ],
      correct: 1,
      explanation:
        "Semantic HTML means using elements that convey meaning about their content — <nav> for navigation, <article> for self-contained content, <section> for thematic groupings — improving accessibility, SEO, and code readability.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "webfund-2",
      type: "multiple-choice",
      question:
        "What is the purpose of CSS custom properties (variables)?",
      options: [
        "They only work in Sass/LESS",
        "They replace JavaScript variables",
        "Reusable values that can be changed at runtime with JavaScript",
        "They improve page load speed",
      ],
      correct: 2,
      explanation:
        "CSS custom properties (--my-color: #333) are reusable values defined in CSS that can be read and changed at runtime via JavaScript. They enable dynamic theming, reduce repetition, and cascade through the DOM.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "webfund-3",
      type: "multiple-choice",
      question: "What does 'mobile-first' responsive design mean?",
      options: [
        "Only designing for mobile devices",
        "Using max-width media queries for smaller screens",
        "Writing base styles for mobile, then using min-width media queries for larger screens",
        "Making desktop sites shrink to fit mobile",
      ],
      correct: 2,
      explanation:
        "Mobile-first means writing your base CSS for the smallest screens, then progressively enhancing the layout for larger screens using min-width media queries. This ensures mobile users get a fast, optimized experience.",
      difficulty: "intermediate",
      points: 15,
    },
    {
      id: "webfund-4",
      type: "multiple-choice",
      question:
        "What is the purpose of the `alt` attribute on images?",
      options: [
        "It sets the image title on hover",
        "It makes images load faster",
        "Provides alternative text for screen readers and when images fail to load",
        "It's required for the image to display",
      ],
      correct: 2,
      explanation:
        "The alt attribute provides alternative text that screen readers announce to visually impaired users and that displays when images fail to load. It's essential for web accessibility and SEO.",
      difficulty: "beginner",
      points: 10,
    },
    {
      id: "webfund-5",
      type: "multiple-choice",
      question: "What does `const` vs `let` mean in JavaScript?",
      options: [
        "const is for strings, let is for numbers",
        "const is block-scoped, let is function-scoped",
        "const can't be reassigned, let can — both are block-scoped",
        "They are interchangeable",
      ],
      correct: 2,
      explanation:
        "Both const and let are block-scoped, but const prevents reassignment of the variable binding while let allows it. Note: const objects and arrays can still have their contents mutated.",
      difficulty: "beginner",
      points: 10,
    },
  ],
};

// Topic display metadata for UI labels and icons
const TOPIC_META = {
  jsx: { label: "JSX", icon: "atom", description: "JavaScript XML syntax" },
  components: { label: "Components", icon: "puzzle", description: "Reusable UI building blocks" },
  props: { label: "Props", icon: "box", description: "Passing data between components" },
  state: { label: "State", icon: "cycle", description: "Managing component data" },
  events: { label: "Events", icon: "mouse", description: "Handling user interactions" },
  lists: { label: "Lists & Keys", icon: "clipboard", description: "Rendering dynamic lists" },
  vue: { label: "Vue", icon: "heartGreen", description: "The progressive JavaScript framework" },
  svelte: { label: "Svelte", icon: "fire", description: "Cybernetically enhanced web apps" },
  ai: { label: "AI / Agentic", icon: "robot", description: "AI-assisted development" },
  "web-fundamentals": { label: "Web Fundamentals", icon: "globe", description: "HTML, CSS & JS essentials" },
};

// Quiz Context
const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  const [quizHistory, setQuizHistory] = useState(() => {
    const saved = localStorage.getItem("quizHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [quizStats, setQuizStats] = useState(() => {
    const saved = localStorage.getItem("quizStats");
    return saved
      ? JSON.parse(saved)
      : {
          totalQuestions: 0,
          correctAnswers: 0,
          pointsEarned: 0,
          topicsCompleted: [],
        };
  });

  useEffect(() => {
    localStorage.setItem("quizHistory", JSON.stringify(quizHistory));
  }, [quizHistory]);

  useEffect(() => {
    localStorage.setItem("quizStats", JSON.stringify(quizStats));
  }, [quizStats]);

  const recordAnswer = (questionId, isCorrect, points) => {
    setQuizHistory((prev) => [
      ...prev.filter((h) => h.questionId !== questionId),
      { questionId, isCorrect, answeredAt: Date.now() },
    ]);

    setQuizStats((prev) => ({
      ...prev,
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      pointsEarned: prev.pointsEarned + (isCorrect ? points : 0),
    }));
  };

  const getAccuracy = () => {
    if (quizStats.totalQuestions === 0) return 0;
    return Math.round(
      (quizStats.correctAnswers / quizStats.totalQuestions) * 100,
    );
  };

  return (
    <QuizContext.Provider
      value={{
        questions: QUIZ_QUESTIONS,
        quizHistory,
        quizStats,
        recordAnswer,
        getAccuracy,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within QuizProvider");
  }
  return context;
};

// Question type components
const MultipleChoiceQuestion = ({
  question,
  onAnswer,
  answered,
  selectedAnswer,
}) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrect = index === question.correct;
        const showResult = answered;

        return (
          <button
            key={index}
            onClick={() => !answered && onAnswer(index)}
            disabled={answered}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              showResult
                ? isCorrect
                  ? "border-emerald-500 bg-emerald-500/10 text-(--color-text) dark:text-(--color-text-dark)"
                  : isSelected
                    ? "border-rose-500 bg-rose-500/10 text-(--color-text) dark:text-(--color-text-dark)"
                    : "border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-text) dark:text-(--color-text-dark)"
                : isSelected
                  ? "border-(--color-primary) bg-(--color-primary)/10 text-(--color-text) dark:text-(--color-text-dark)"
                  : "border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface) dark:bg-(--color-surface-dark) hover:border-(--color-primary) text-(--color-text) dark:text-(--color-text-dark)"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  showResult
                    ? isCorrect
                      ? "bg-emerald-500 text-white"
                      : isSelected
                        ? "bg-rose-500 text-white"
                        : "bg-(--color-border)/50 dark:bg-(--color-border-dark)/50 text-(--color-text) dark:text-(--color-text-dark)"
                    : isSelected
                      ? "bg-(--color-primary) text-(--color-primary-text)"
                      : "bg-(--color-border)/50 dark:bg-(--color-border-dark)/50 text-(--color-text) dark:text-(--color-text-dark)"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </div>
              <span className="text-(--color-text) dark:text-(--color-text-dark)">{option}</span>
              {showResult && isCorrect && (
                <Checkmark className="w-5 h-5 text-emerald-500 ml-auto" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Code block display
const CodeBlock = ({ code }) => (
  <pre className="bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4 border border-gray-800">
    <code>{code}</code>
  </pre>
);

// Single Question Component
export const QuizQuestion = ({ question, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const { recordAnswer } = useQuiz();
  const { trackAction } = useAchievements();

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setAnswered(true);
    setShowExplanation(true);

    const isCorrect = answerIndex === question.correct;
    recordAnswer(question.id, isCorrect, question.points);

    if (isCorrect) {
      trackAction("lesson_complete", { lessonId: question.id });
    }
  };

  const isCorrect = selectedAnswer === question.correct;

  return (
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            question.difficulty === "beginner"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : question.difficulty === "intermediate"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          }`}
        >
          {question.difficulty}
        </span>
        <span className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">{question.points} pts</span>
      </div>

      {/* Question */}
      <h3 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
        {question.question}
      </h3>

      {/* Bug description for fix-the-bug type */}
      {question.bugDescription && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <p className="text-sm text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5">
            <EmojiIcon name="bug" className="w-4 h-4 text-rose-500" /> Bug:{" "}
            {question.bugDescription}
          </p>
        </div>
      )}

      {/* Code block if present */}
      {question.code && <CodeBlock code={question.code} />}

      {/* Options */}
      <MultipleChoiceQuestion
        question={question}
        onAnswer={handleAnswer}
        answered={answered}
        selectedAnswer={selectedAnswer}
      />

      {/* Explanation */}
      {showExplanation && (
        <div
          className={`mt-6 p-4 rounded-lg border ${
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30 text-(--color-text) dark:text-(--color-text-dark)"
              : "bg-rose-500/10 border-rose-500/30 text-(--color-text) dark:text-(--color-text-dark)"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">
              {isCorrect ? (
                <EmojiIcon name="check" className="w-5 h-5 text-emerald-500" />
              ) : (
                <EmojiIcon name="cross" className="w-5 h-5 text-rose-500" />
              )}
            </span>
            <span
              className={`font-bold ${
                isCorrect
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </span>
            {isCorrect && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-auto font-medium">
                +{question.points} pts
              </span>
            )}
          </div>
          <p className="text-sm text-(--color-text) dark:text-(--color-text-dark)">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Continue button */}
      {answered && onComplete && (
        <button
          onClick={onComplete}
          className="mt-6 w-full py-3 bg-(--color-primary) text-(--color-primary-text) hover:opacity-90 rounded-lg font-medium transition-colors cursor-pointer"
        >
          Continue →
        </button>
      )}
    </div>
  );
};

// Quiz Modal for taking a full quiz
export const QuizModal = ({ isOpen, onClose, topic }) => {
  const { questions } = useQuiz();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const topicQuestions = questions[topic] || [];
  const currentQuestion = topicQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < topicQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setCompleted(false);
    setScore(0);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface) dark:bg-(--color-surface-dark)">
          <div>
            <h2 className="text-xl font-bold text-(--color-text) dark:text-(--color-text-dark) inline-flex items-center gap-2">
              {TOPIC_META[topic]?.icon && (
                <EmojiIcon name={TOPIC_META[topic].icon} className="w-5 h-5 text-(--color-primary)" />
              )}
              <span>{TOPIC_META[topic]?.label ?? topic} Quiz</span>
            </h2>
            <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
              Question {currentIndex + 1} of {topicQuestions.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--color-border)/20 dark:hover:bg-(--color-border-dark)/30 rounded-lg transition-colors cursor-pointer text-(--color-muted-text) dark:text-(--color-muted-text-dark)"
            aria-label="Close quiz"
          >
            <Close className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-(--color-border)/30 dark:bg-(--color-border-dark)/50">
          <div
            className="h-full bg-(--color-primary) transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / topicQuestions.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {completed ? (
            <div className="text-center py-12">
              <div className="text-amber-500 mb-4 flex justify-center">
                <EmojiIcon name="party" className="w-14 h-14" />
              </div>
              <h3 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2">
                Quiz Complete!
              </h3>
              <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-6">
                Great job finishing the {topic} quiz!
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-(--color-primary) text-(--color-primary-text) hover:opacity-90 rounded-lg font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : currentQuestion ? (
            <QuizQuestion question={currentQuestion} onComplete={handleNext} />
          ) : (
            <p className="text-center text-(--color-muted-text) dark:text-(--color-muted-text-dark)">No questions available</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Quiz topic card
export const QuizTopicCard = ({ topic, questions, onStart }) => {
  const { quizHistory } = useQuiz();
  const answeredCount = questions.filter((q) =>
    quizHistory.some((h) => h.questionId === q.id),
  ).length;
  const correctCount = questions.filter((q) =>
    quizHistory.some((h) => h.questionId === q.id && h.isCorrect),
  ).length;

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-2 inline-flex items-center gap-2">
        {TOPIC_META[topic]?.icon && (
          <EmojiIcon name={TOPIC_META[topic].icon} className="w-5 h-5 text-(--color-primary)" />
        )}
        <span>{TOPIC_META[topic]?.label ?? topic}</span>
      </h3>
      <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-1">
        {TOPIC_META[topic]?.description}
      </p>
      <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-4">
        {questions.length} questions • {totalPoints} points
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mb-1">
          <span>
            {answeredCount}/{questions.length} answered
          </span>
          <span>{correctCount} correct</span>
        </div>
        <div className="h-2 bg-(--color-border)/30 dark:bg-(--color-border-dark)/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(correctCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => onStart(topic)}
        className="w-full py-2 bg-(--color-primary) text-(--color-primary-text) hover:opacity-90 rounded-lg font-medium transition-colors cursor-pointer"
      >
        {answeredCount > 0 ? "Continue Quiz" : "Start Quiz"}
      </button>
    </div>
  );
};

// Main Quiz Panel
export const QuizPanel = () => {
  const { questions, quizStats, getAccuracy } = useQuiz();
  const [activeQuiz, setActiveQuiz] = useState(null);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-(--color-primary)">
            {quizStats.totalQuestions}
          </p>
          <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Questions Answered</p>
        </div>
        <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{getAccuracy()}%</p>
          <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Accuracy</p>
        </div>
        <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">
            {quizStats.pointsEarned}
          </p>
          <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Points Earned</p>
        </div>
      </div>

      {/* Quiz Topics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(questions).map(([topic, topicQuestions]) => (
          <QuizTopicCard
            key={topic}
            topic={topic}
            questions={topicQuestions}
            onStart={setActiveQuiz}
          />
        ))}
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={!!activeQuiz}
        onClose={() => setActiveQuiz(null)}
        topic={activeQuiz}
      />
    </div>
  );
};

export default QuizProvider;
