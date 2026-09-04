import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const concepts = {
  props: {
    title: "Props (Properties)",
    explanation:
      "Props are how we pass data from parent to child components. Think of them like function arguments.",
    example: `<Header name="John" /> // 'name' is a prop`,
  },
  state: {
    title: "State",
    explanation:
      "State is data that can change over time. When state changes, React re-renders the component.",
    example: `const [count, setCount] = useState(0);`,
  },
  useEffect: {
    title: "useEffect Hook",
    explanation:
      "useEffect lets you perform side effects like fetching data, subscriptions, or DOM manipulation.",
    example: `useEffect(() => {\n  document.title = 'Hello';\n}, []);`,
  },
  map: {
    title: ".map() Method",
    explanation:
      "The map method transforms each item in an array into something else—like turning data into JSX elements.",
    example: `skills.map(skill => <Badge key={skill.id} {...skill} />)`,
  },
  destructuring: {
    title: "Destructuring",
    explanation:
      "Destructuring lets you unpack values from objects or arrays into distinct variables.",
    example: `const { name, title } = personal;`,
  },
  jsx: {
    title: "JSX",
    explanation:
      "JSX is a syntax extension that lets you write HTML-like code in JavaScript. It gets compiled to React.createElement() calls.",
    example: `const element = <h1>Hello, {name}!</h1>;`,
  },
  component: {
    title: "Component",
    explanation:
      "Components are reusable building blocks of React apps. They're functions that return JSX.",
    example: `function Card({ title }) {\n  return <div>{title}</div>;\n}`,
  },
  conditionalRendering: {
    title: "Conditional Rendering",
    explanation:
      "Show different UI based on conditions using ternary operators, && operator, or if statements.",
    example: `{isLoggedIn ? <Dashboard /> : <Login />}`,
  },
};

export const Tooltip = ({ concept, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const data = concepts[concept];

  // Update tooltip position when opened or on scroll/resize
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top - 9, // Position above the trigger
          left: rect.left + rect.width / 2, // Center horizontally
        });
      };

      updatePosition();

      // Keep position updated on scroll/resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  if (!data) return children;

  return (
    <>
      {/* Tooltip trigger */}
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="border-b-2 border-dashed border-(--color-primary) cursor-help text-(--color-primary) font-medium"
      >
        {children}
      </span>

      {/* Tooltip - rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed z-9999 w-80 pointer-events-none animate-fade-in"
            style={{
              top: coords.top,
              left: coords.left,
              transform: "translate(-50%, -100%)", // Center and position above
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 pointer-events-auto">
              <span className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {data.title}
                </span>
              </span>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-3">
                {data.explanation}
              </span>
              <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {data.example}
              </code>
            </div>

            {/* Arrow pointing down */}
            <div className="w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-45 mx-auto -mt-2" />
          </div>,
          document.body
        )}
    </>
  );
};
