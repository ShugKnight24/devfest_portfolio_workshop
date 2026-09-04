import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Playground } from "../components/Playground";
import { Tooltip } from "../components/Tooltip";
import { ProgressTracker } from "../components/ProgressTracker";

// ─── Track definitions ───────────────────────────────────────────────
const TRACKS = {
  react: {
    id: "react",
    name: "React 19",
    icon: "⚛️",
    color: "text-cyan-400",
    description: "Modern React with hooks, context, and Tailwind CSS",
  },
  vanilla: {
    id: "vanilla",
    name: "Vanilla JS",
    icon: "⚡",
    color: "text-amber-400",
    description: "Zero-dependency HTML5, CSS3, and DOM manipulation",
  },
  vue: {
    id: "vue",
    name: "Vue 3",
    icon: "🎨",
    color: "text-emerald-400",
    description: "Composition API, SFCs, and reactive state with Vue 3",
  },
  svelte: {
    id: "svelte",
    name: "SvelteKit",
    icon: "🧱",
    color: "text-red-400",
    description: "Compile-time optimized components and reactive declarations",
  },
  agentic: {
    id: "agentic",
    name: "Agentic Dev",
    icon: "🤖",
    color: "text-purple-400",
    description: "AI-assisted development with Gemini, Claude, Copilot, Cursor & more",
  },
};

// ─── React Lessons ───────────────────────────────────────────────────
const reactLessons = [
  {
    id: "intro",
    title: "Intro to React",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Welcome to React!</h2>
        <p>
          React is a JavaScript library for building user interfaces. It lets
          you create reusable <Tooltip concept="component">components</Tooltip>{" "}
          that manage their own state.
        </p>
        <h3>Key Concepts We'll Cover:</h3>
        <ul>
          <li>
            <Tooltip concept="jsx">JSX</Tooltip> - Writing HTML-like syntax in
            JavaScript
          </li>
          <li>
            <Tooltip concept="props">Props</Tooltip> - Passing data to
            components
          </li>
          <li>
            <Tooltip concept="state">State</Tooltip> - Managing changing data
          </li>
          <li>
            <Tooltip concept="map">.map()</Tooltip> - Rendering lists
            dynamically
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "project-structure",
    title: "Project Structure",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Understanding the Project</h2>
        <p>
          Before writing code, let's understand how a React project is
          organized.
        </p>
        <h3>Key Files & Folders:</h3>
        <ul>
          <li>
            <code>src/</code> - All your source code lives here
          </li>
          <li>
            <code>src/App.jsx</code> - The root{" "}
            <Tooltip concept="component">component</Tooltip>
          </li>
          <li>
            <code>src/components/</code> - Reusable UI pieces
          </li>
          <li>
            <code>src/data/portfolioData.js</code> - Your portfolio content
          </li>
        </ul>
        <h3>The Data Flow</h3>
        <p>
          In React, data flows in one direction: from parent to child via{" "}
          <Tooltip concept="props">props</Tooltip>. Think of it like a waterfall
          - water only flows down, never up!
        </p>
      </div>
    ),
  },
  {
    id: "jsx-basics",
    title: "JSX Basics",
    playground: {
      title: "Try JSX Expressions",
      description: "Modify the code to see how JSX expressions work",
      concept: "JSX Expressions",
      initialCode: `"Hello, " + "World!"`,
      hints: [
        "Try using template literals: `Hello, ${name}`",
        "Try a math expression: 2 + 2",
        "Try an array method: [1,2,3].join('-')",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Understanding JSX</h2>
        <p>
          <Tooltip concept="jsx">JSX</Tooltip> looks like HTML but it's actually
          JavaScript. You can embed any JavaScript expression inside curly
          braces.
        </p>
        <h3>Key Rules:</h3>
        <ul>
          <li>
            Use <code>className</code> instead of <code>class</code>
          </li>
          <li>
            All tags must be closed (including self-closing like{" "}
            <code>&lt;img /&gt;</code>)
          </li>
          <li>
            Wrap expressions in curly braces: <code>{"{variable}"}</code>
          </li>
          <li>
            Return a single parent element (use fragments{" "}
            <code>&lt;&gt;...&lt;/&gt;</code> if needed)
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "props",
    title: "Props & Data Flow",
    playground: {
      title: "Destructuring Practice",
      description: "Practice extracting values from objects",
      concept: "Destructuring",
      initialCode: `
        const person = { name: "Alex", role: "Developer" };
        const { name, role } = person;
        name + " is a " + role
      `,
      hints: [
        "Try adding more properties to the person object",
        "Try nested destructuring: { social: { github } }",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Understanding Props</h2>
        <p>
          <Tooltip concept="props">Props</Tooltip> are how we pass data from
          parent components to child components. Data flows DOWN like a
          waterfall.
        </p>
        <p>
          We use <Tooltip concept="destructuring">destructuring</Tooltip> to
          extract the props we need inside our components.
        </p>
        <h3>Example:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`
            // Parent passes data
            <Header name="Alex" title="Developer" />

            // Child receives via props
            function Header({ name, title }) {
              return <h1>{name} - {title}</h1>;
            }
          `}
        </pre>
      </div>
    ),
  },
  {
    id: "mapping",
    title: "Rendering Lists",
    playground: {
      title: "Array Mapping",
      description: "Transform an array of skills into a formatted list",
      concept: ".map()",
      initialCode: `
        const skills = ["React", "JavaScript", "CSS"];
        skills.map(skill => "⭐ " + skill).join(", ")
      `,
      hints: [
        "Try adding an index: skills.map((skill, i) => ...)",
        "Try filtering first: skills.filter(s => s.length > 4).map(...)",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>The .map() Method</h2>
        <p>
          The <Tooltip concept="map">.map()</Tooltip> method is how we transform
          arrays of data into arrays of React elements.
        </p>
        <h3>Why .map()?</h3>
        <p>
          Instead of writing repetitive code for each item, we write the pattern
          once and let <code>.map()</code> apply it to every item in our array.
        </p>
        <h3>Important: The Key Prop</h3>
        <p>
          When rendering lists in React, always include a unique{" "}
          <code>key</code> prop to help React track which items changed.
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`
            skills.map(skill => (
              <Badge key={skill.id} name={skill.name} />
            ))
          `}
        </pre>
      </div>
    ),
  },
  {
    id: "state",
    title: "State & Interactivity",
    playground: {
      title: "State Simulation",
      description: "Understand how state values work",
      concept: "State",
      initialCode: `
        // Simulating state behavior
        let count = 0;
        count = count + 1;
        count = count + 1;
        "Count is: " + count
      `,
      hints: [
        "In real React, we use useState() hook",
        "State changes trigger re-renders",
        "Try: let items = []; items.push('a'); items.push('b'); items.join(', ')",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Managing State</h2>
        <p>
          <Tooltip concept="state">State</Tooltip> is data that can change over
          time. When state changes, React automatically re-renders the
          component.
        </p>
        <h3>The useState Hook</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`
            const [count, setCount] = useState(0);

            // count = current value
            // setCount = function to update it
            // 0 = initial value
          `}
        </pre>
        <h3>Rules of State:</h3>
        <ul>
          <li>Never modify state directly (use the setter function)</li>
          <li>State updates may be asynchronous</li>
          <li>State is local to each component instance</li>
        </ul>
      </div>
    ),
  },
  {
    id: "conditional",
    title: "Conditional Rendering",
    playground: {
      title: "Conditional Logic",
      description: "Practice different conditional patterns",
      concept: "Conditionals",
      initialCode: `
        const isLoggedIn = true;
        const userName = "Alex";

        isLoggedIn ? "Welcome, " + userName + "!" : "Please log in"`,
      hints: [
        "Try changing isLoggedIn to false",
        "Try: isLoggedIn && 'Welcome!'",
        "Try nested ternary (not recommended but possible)",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Conditional Rendering</h2>
        <p>
          <Tooltip concept="conditionalRendering">
            Conditional rendering
          </Tooltip>{" "}
          lets you show different UI based on conditions.
        </p>
        <h3>Three Common Patterns:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`
            // 1. Ternary Operator
            {isLoggedIn ? <Dashboard /> : <Login />}

            // 2. Logical AND (&&)
            {hasNotifications && <Badge count={3} />}

            // 3. Early Return
            if (!data) return <Loading />;
            return <Content data={data} />;
          `}
        </pre>
      </div>
    ),
  },
  {
    id: "styling",
    title: "Styling with Tailwind",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Tailwind CSS</h2>
        <p>
          Tailwind is a utility-first CSS framework. Instead of writing custom
          CSS, you apply pre-built classes directly in your JSX.
        </p>
        <h3>Common Utilities:</h3>
        <ul>
          <li>
            <code>flex</code>, <code>grid</code> - Layout
          </li>
          <li>
            <code>p-4</code>, <code>m-2</code> - Padding & Margin
          </li>
          <li>
            <code>text-lg</code>, <code>font-bold</code> - Typography
          </li>
          <li>
            <code>bg-blue-500</code>, <code>text-white</code> - Colors
          </li>
          <li>
            <code>rounded-lg</code>, <code>shadow-md</code> - Effects
          </li>
          <li>
            <code>hover:</code>, <code>dark:</code> - States & Variants
          </li>
        </ul>
        <h3>Example:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`
            <button
              className="px-4 py-2 bg-blue-600
              text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Click Me
            </button>
          `}
        </pre>
      </div>
    ),
  },
  {
    id: "testing",
    title: "Testing & TDD",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Test-Driven Development</h2>
        <p>
          Writing tests ensures your code works as expected and catches bugs before
          your users do. This project uses <Tooltip concept="vitest">Vitest</Tooltip>{" "}
          — a fast, Vite-native test runner.
        </p>
        <h3>Why Test?</h3>
        <ul>
          <li><strong>Confidence</strong> — refactor without fear of breaking things</li>
          <li><strong>Documentation</strong> — tests describe what your code should do</li>
          <li><strong>Speed</strong> — catch bugs in seconds, not after deployment</li>
        </ul>
        <h3>The TDD Cycle (Red → Green → Refactor):</h3>
        <ol>
          <li><strong>Red</strong> — Write a failing test first</li>
          <li><strong>Green</strong> — Write the minimum code to make it pass</li>
          <li><strong>Refactor</strong> — Clean up while keeping tests green</li>
        </ol>
        <h3>Writing Your First Test:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// validators.test.js
import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validators';

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });
});`}
        </pre>
        <h3>Running Tests:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`npm run test        # Watch mode
npm run test:run    # Single run (CI)
npm run test:coverage  # With coverage report`}
        </pre>
        <h3>Testing React Components:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`import { render, screen } from '@testing-library/react';
import { SkillBadge } from './SkillBadge';

it('renders skill name', () => {
  render(<SkillBadge name="React" level="advanced" />);
  expect(screen.getByText('React')).toBeInTheDocument();
});`}
        </pre>
      </div>
    ),
    playground: {
      title: "Write a Test",
      starterCode: `// Write a test for this function:
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Your test:
const result = capitalize('hello');
console.log('Test:', result === 'Hello' ? '✅ PASS' : '❌ FAIL');

const result2 = capitalize('world');
console.log('Test 2:', result2 === 'World' ? '✅ PASS' : '❌ FAIL');`,
      hints: ["Think about edge cases: empty strings, already capitalized, numbers"],
    },
  },
  {
    id: "git-github",
    title: "Git & GitHub",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Version Control with Git</h2>
        <p>
          Git tracks every change you make to your code, so you can undo mistakes,
          collaborate with others, and deploy with confidence. GitHub hosts your
          Git repositories in the cloud.
        </p>
        <h3>Essential Commands:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`# Check what's changed
git status

# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add skills section to portfolio"

# Push to GitHub
git push origin main`}
        </pre>
        <h3>Commit Message Convention:</h3>
        <ul>
          <li><code>feat:</code> — New feature</li>
          <li><code>fix:</code> — Bug fix</li>
          <li><code>refactor:</code> — Code restructuring</li>
          <li><code>docs:</code> — Documentation changes</li>
          <li><code>chore:</code> — Build/tooling changes</li>
        </ul>
        <h3>GitHub Flow:</h3>
        <ol>
          <li>Create a repository on GitHub</li>
          <li>Clone it: <code>git clone https://github.com/you/repo.git</code></li>
          <li>Make changes, commit, push</li>
          <li>Create Pull Requests for team review</li>
        </ol>
        <h3>Quick Setup for Your Portfolio:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`# Initialize git in your project
git init

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git

# Push your code
git add .
git commit -m "feat: initial portfolio setup"
git push -u origin main`}
        </pre>
      </div>
    ),
  },
  {
    id: "ai-assisted",
    title: "AI-Assisted React Dev",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building with AI</h2>
        <p>
          AI coding assistants are the most powerful tools available to modern
          developers. Learning to use them effectively will multiply your
          productivity dramatically.
        </p>
        <h3>Top AI Tools for React Development:</h3>
        <ul>
          <li><strong>Gemini Code Assist</strong> — Google's AI, deep integration with VS Code and Android Studio</li>
          <li><strong>GitHub Copilot</strong> — Inline code suggestions as you type</li>
          <li><strong>Cursor</strong> — AI-first code editor with full codebase understanding</li>
          <li><strong>Claude</strong> — Anthropic's AI, excellent at reasoning about complex code</li>
          <li><strong>OpenCode</strong> — Open-source AI coding CLI</li>
          <li><strong>Antigravity</strong> — Google DeepMind's agentic AI assistant</li>
        </ul>
        <h3>Effective Prompting for React:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// ❌ Vague prompt:
"Make a component"

// ✅ Specific prompt:
"Create a React component called SkillCard that:
- Accepts props: name (string), level (string), icon (string)
- Renders a card with a colored border based on level
- Uses Tailwind CSS for styling
- Includes a hover animation
- Is accessible with proper ARIA labels"`}
        </pre>
        <h3>The AI Development Loop:</h3>
        <ol>
          <li><strong>Describe</strong> — Tell the AI exactly what you want</li>
          <li><strong>Generate</strong> — Let the AI write the initial code</li>
          <li><strong>Review</strong> — Read and understand every line</li>
          <li><strong>Iterate</strong> — Refine with follow-up prompts</li>
          <li><strong>Test</strong> — Verify the code works correctly</li>
        </ol>
        <h3>Best Practices:</h3>
        <ul>
          <li>Always <strong>review AI-generated code</strong> before committing</li>
          <li>Use AI to <strong>explain code</strong> you don't understand</li>
          <li>Ask AI to <strong>write tests</strong> for your components</li>
          <li>Use AI for <strong>debugging</strong> — paste error messages and ask for help</li>
          <li>Never use AI for <strong>security-critical code</strong> (auth, encryption) without expert review</li>
        </ul>
        <h3>Try It Now:</h3>
        <p>
          Open your AI tool of choice and try this prompt:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Look at my portfolioData.js file. Create a new
React component that renders my projects as a
responsive grid of cards. Each card should show
the project title, description, tags as badges,
and links to GitHub and live demo. Use Tailwind
CSS and make it accessible."`}
        </pre>
      </div>
    ),
    playground: {
      title: "Prompt Engineering Practice",
      starterCode: `// Write a prompt that would generate a ContactForm component.
// Include: what props it takes, what it looks like, how it behaves.
// Then evaluate your prompt — is it specific enough?

const myPrompt = \`
Create a React ContactForm component that...
[YOUR PROMPT HERE]
\`;

// Checklist for good prompts:
const checklist = {
  specifiesProps: false,      // Does it say what props/data it needs?
  specifiesStyling: false,    // Does it mention Tailwind/CSS approach?
  specifiesBehavior: false,   // Does it describe what happens on submit?
  specifiesA11y: false,       // Does it mention accessibility?
  specifiesValidation: false, // Does it mention form validation?
};

console.log("Review your prompt against the checklist!");
console.log(checklist);`,
      hints: [
        "Include: props (onSubmit callback, fields array), styling (Tailwind classes), validation (required fields, email format), accessibility (labels, error messages), and behavior (loading state, success feedback)."
      ],
    },
  },
  {
    id: "deployment",
    title: "Deployment",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Going Live!</h2>
        <p>
          Once your portfolio is ready, it's time to share it with the world.
        </p>
        <h3>Deployment Options:</h3>
        <ul>
          <li>
            <strong>Vercel</strong> - Best for React/Next.js (free tier)
          </li>
          <li>
            <strong>Netlify</strong> - Great alternative (free tier)
          </li>
          <li>
            <strong>GitHub Pages</strong> - Free for static sites
          </li>
        </ul>
        <h3>Steps for Vercel:</h3>
        <ol>
          <li>Push your code to GitHub</li>
          <li>Go to vercel.com and sign in with GitHub</li>
          <li>Import your repository</li>
          <li>
            Set the Root Directory to <code>react_starter</code>
          </li>
          <li>Click Deploy!</li>
        </ol>
        <p>
          Your portfolio will be live at <code>your-project.vercel.app</code> in
          minutes!
        </p>
      </div>
    ),
  },
];

// ─── Vanilla JS Lessons ──────────────────────────────────────────────
const vanillaLessons = [
  {
    id: "intro",
    title: "Intro to HTML, CSS & JS",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Welcome to Web Fundamentals!</h2>
        <p>
          Every website is built with three core technologies: <strong>HTML</strong> for structure,
          <strong> CSS</strong> for styling, and <strong>JavaScript</strong> for interactivity.
        </p>
        <h3>What Makes This Track Special:</h3>
        <ul>
          <li><strong>Zero dependencies</strong> — no npm, no build tools, no framework</li>
          <li><strong>File protocol</strong> — double-click <code>index.html</code> and it works</li>
          <li><strong>Pure fundamentals</strong> — everything you learn here transfers to any framework</li>
        </ul>
        <h3>The Web Trinity:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`HTML  → Structure  (what things ARE)
CSS   → Style      (how things LOOK)
JS    → Behavior   (how things ACT)`}
        </pre>
      </div>
    ),
  },
  {
    id: "html-structure",
    title: "HTML Structure",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Semantic HTML</h2>
        <p>Semantic elements describe their meaning to both the browser and the developer.</p>
        <h3>Key Semantic Elements:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<header>  → Page/section header
<nav>     → Navigation links
<main>    → Primary content (one per page)
<section> → Thematic grouping
<article> → Self-contained content
<footer>  → Page/section footer`}
        </pre>
        <h3>Portfolio Structure:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<body>
  <nav id="navbar">...</nav>
  <main>
    <section id="hero">...</section>
    <section id="about">...</section>
    <section id="skills">...</section>
    <section id="projects">...</section>
  </main>
  <footer>...</footer>
</body>`}
        </pre>
      </div>
    ),
  },
  {
    id: "data-variables",
    title: "Data & Variables",
    playground: {
      title: "Variable Practice",
      description: "Experiment with const, let, and data types",
      concept: "Variables",
      initialCode: `const name = "Alex";\nconst skills = ["HTML", "CSS", "JS"];\nskills.length + " skills for " + name`,
      hints: [
        "Try template literals: `${name} has ${skills.length} skills`",
        "Try an object: const person = { name, skills }",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>JavaScript Data</h2>
        <p>We store portfolio data in a plain JavaScript object — no database needed.</p>
        <h3>Declaring Variables:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// const = won't reassign (default choice)
const name = "Alex";
const skills = ["HTML", "CSS", "JS"];

// let = will reassign
let currentTheme = "default";
currentTheme = "dark"; // OK`}
        </pre>
        <h3>Portfolio Data Pattern:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`const portfolioData = {
  name: "Your Name",
  title: "Web Developer",
  skills: ["HTML", "CSS", "JavaScript"],
  projects: [
    { name: "Portfolio", tech: "HTML/CSS" }
  ]
};`}
        </pre>
      </div>
    ),
  },
  {
    id: "dom-components",
    title: "DOM Components",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building with the DOM</h2>
        <p>The DOM (Document Object Model) is how JavaScript sees and manipulates HTML.</p>
        <h3>Creating Elements:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// Select a container
const container = document.getElementById("skills");

// Create elements dynamically
const renderSkills = (skills) => {
  container.innerHTML = skills
    .map(skill => \`<span class="badge">\${skill}</span>\`)
    .join("");
};`}
        </pre>
        <h3>Template Literals as Components:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`const ProjectCard = ({ name, tech, url }) => \`
  <article class="card">
    <h3>\${name}</h3>
    <p>\${tech}</p>
    <a href="\${url}">View Project</a>
  </article>
\`;`}
        </pre>
      </div>
    ),
  },
  {
    id: "css-custom-properties",
    title: "CSS Custom Properties",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Theming with CSS Variables</h2>
        <p>CSS custom properties let you define reusable values and change them at runtime with JavaScript.</p>
        <h3>Defining Variables:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`:root {
  --color-primary: #3B82F6;
  --color-background: #F9FAFB;
  --color-text: #1F2937;
}

.card {
  background: var(--color-background);
  color: var(--color-text);
  border: 2px solid var(--color-primary);
}`}
        </pre>
        <h3>Changing Themes with JS:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(\`--color-\${key}\`, value);
  });
};`}
        </pre>
      </div>
    ),
  },
  {
    id: "event-listeners",
    title: "Event Listeners",
    playground: {
      title: "Event Types",
      description: "Explore different event patterns",
      concept: "Events",
      initialCode: `const events = ["click", "submit", "keydown", "scroll"];\nevents.map(e => "on" + e[0].toUpperCase() + e.slice(1)).join(", ")`,
      hints: [
        "Try: events.filter(e => e.startsWith('k'))",
        "Events bubble up the DOM tree by default",
      ],
    },
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Handling User Interactions</h2>
        <p>Event listeners let your page respond to user actions like clicks, typing, and scrolling.</p>
        <h3>Adding Listeners:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// Click handler
document.getElementById("theme-btn")
  .addEventListener("click", () => {
    toggleDarkMode();
  });

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextSlide();
  if (e.key === "ArrowLeft") prevSlide();
});`}
        </pre>
      </div>
    ),
  },
  {
    id: "responsive-design",
    title: "Responsive Design",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building for Every Screen</h2>
        <p>
          Responsive design ensures your portfolio looks great on phones, tablets,
          and desktops. The key tools: Flexbox, CSS Grid, and media queries.
        </p>
        <h3>Mobile-First Approach:</h3>
        <p>
          Write styles for mobile first, then add complexity for larger screens
          using <code>min-width</code> media queries.
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`/* Base styles (mobile) */
.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}`}
        </pre>
        <h3>Flexbox for Layout:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`/* Center content vertically and horizontally */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

/* Responsive nav */
.nav-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}`}
        </pre>
        <h3>Key Tips:</h3>
        <ul>
          <li>Always set <code>{'<meta name="viewport" content="width=device-width, initial-scale=1">'}</code></li>
          <li>Use <code>rem</code> and <code>%</code> instead of <code>px</code> for fluid sizing</li>
          <li>Test on real devices, not just browser resize</li>
        </ul>
      </div>
    ),
    playground: {
      title: "Responsive Breakpoints",
      starterCode: `// Simulate responsive breakpoints
const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

const screenWidth = 900; // Try changing this!

const currentBreakpoint = Object.entries(breakpoints)
  .reverse()
  .find(([, minWidth]) => screenWidth >= minWidth);

console.log(\`Screen: \${screenWidth}px\`);
console.log(\`Breakpoint: \${currentBreakpoint[0]}\`);
console.log(\`Columns: \${
  screenWidth >= 1024 ? 3 : screenWidth >= 768 ? 2 : 1
}\`);`,
      hints: ["Try setting screenWidth to 500, 768, 1024, and 1440 to see how breakpoints change the layout."],
    },
  },
  {
    id: "accessibility",
    title: "Accessibility Basics",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building for Everyone</h2>
        <p>
          Accessibility (a11y) ensures your portfolio is usable by people with
          disabilities — vision, motor, hearing, or cognitive. It's not optional;
          it's fundamental to good web development.
        </p>
        <h3>Semantic HTML (The Foundation):</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- ❌ Div soup (bad) -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- ✅ Semantic HTML (good) -->
<header>
  <nav aria-label="Main navigation">
    <a href="#about">About</a>
    <a href="#skills">Skills</a>
  </nav>
</header>`}
        </pre>
        <h3>ARIA Labels:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- Links that open externally -->
<a href="https://github.com/you"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="View my GitHub profile (opens in new tab)">
  GitHub
</a>

<!-- Buttons need labels -->
<button aria-label="Toggle dark mode">🌙</button>

<!-- Images need alt text -->
<img src="photo.jpg" alt="Profile photo of Jane, smiling">`}
        </pre>
        <h3>Keyboard Navigation:</h3>
        <ul>
          <li>All interactive elements must be reachable via <kbd>Tab</kbd></li>
          <li>Buttons/links must be activatable via <kbd>Enter</kbd></li>
          <li>Provide visible focus indicators (<code>:focus-visible</code>)</li>
          <li>Never remove <code>outline</code> without replacement</li>
        </ul>
        <h3>Quick Wins:</h3>
        <ul>
          <li>Use <code>{"<button>"}</code> for actions, <code>{"<a>"}</code> for navigation</li>
          <li>Ensure sufficient color contrast (4.5:1 ratio minimum)</li>
          <li>Add <code>alt</code> to every <code>{"<img>"}</code></li>
          <li>Use <code>aria-label</code> on icon-only buttons</li>
        </ul>
      </div>
    ),
  },
  {
    id: "ai-assisted",
    title: "AI + Vanilla JS",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>AI-Assisted Vanilla Development</h2>
        <p>
          AI tools are incredibly powerful for vanilla JS development — they can
          generate DOM manipulation code, CSS layouts, and accessible HTML
          structures from plain descriptions.
        </p>
        <h3>AI Tools for Vanilla Development:</h3>
        <ul>
          <li><strong>Gemini</strong> — Great at CSS and responsive layouts</li>
          <li><strong>Copilot</strong> — Excellent inline DOM manipulation suggestions</li>
          <li><strong>Cursor</strong> — Full file editing for CSS + JS together</li>
          <li><strong>Claude</strong> — Deep understanding of browser APIs</li>
          <li><strong>Antigravity</strong> — Agentic workflow for full-page builds</li>
        </ul>
        <h3>Example Prompt for Vanilla JS:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Write a vanilla JS function that:
- Takes an array of skill objects ({name, level, category})
- Generates HTML with template literals
- Creates badge elements with color based on level
- Renders into an element with id 'skills-container'
- Uses CSS custom properties for colors
- Is accessible (aria-labels on interactive elements)
- No frameworks, no build tools, just vanilla JS"`}
        </pre>
        <h3>Tips for AI + Vanilla:</h3>
        <ul>
          <li>Always specify "no frameworks, no build tools"</li>
          <li>Ask for CSS custom properties instead of Tailwind</li>
          <li>Request <code>const</code>/<code>let</code> and arrow functions</li>
          <li>Ask AI to explain browser APIs you haven't seen before</li>
        </ul>
      </div>
    ),
    playground: {
      title: "AI-Generated DOM Code",
      starterCode: `// Challenge: Use AI thinking to write a function
// that renders project cards from data.

const projects = [
  { title: "Portfolio", tags: ["HTML", "CSS", "JS"] },
  { title: "Weather App", tags: ["API", "JS"] },
];

function renderProjects(projects) {
  return projects.map(p => \`
    <div class="project-card">
      <h3>\${p.title}</h3>
      <div class="tags">
        \${p.tags.map(t => \`<span class="tag">\${t}</span>\`).join('')}
      </div>
    </div>
  \`).join('');
}

console.log(renderProjects(projects));
console.log("\\nThis is what AI generates from a good prompt!");`,
      hints: ["This is the kind of code AI generates from a specific prompt. Notice: template literals, .map(), .join(''), semantic class names. You could ask AI to add: click handlers, animation classes, link buttons."],
    },
  },
  {
    id: "deployment",
    title: "Deployment",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Ship It!</h2>
        <p>Vanilla sites are the easiest to deploy — no build step needed.</p>
        <h3>Options:</h3>
        <ul>
          <li><strong>GitHub Pages</strong> — push to a repo, enable Pages in Settings, done</li>
          <li><strong>Netlify Drop</strong> — drag your folder onto netlify.com</li>
          <li><strong>Vercel</strong> — connect repo, set root directory to <code>apps/vanilla</code></li>
        </ul>
        <h3>GitHub Pages Steps:</h3>
        <ol>
          <li>Push code to GitHub</li>
          <li>Go to Settings → Pages</li>
          <li>Select branch and folder</li>
          <li>Your site is live at <code>username.github.io/repo-name</code></li>
        </ol>
      </div>
    ),
  },
];

// ─── Vue 3 Lessons ───────────────────────────────────────────────────
const vueLessons = [
  {
    id: "intro",
    title: "Intro to Vue 3",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Welcome to Vue 3!</h2>
        <p>
          Vue is a progressive JavaScript framework for building user interfaces.
          It's designed to be incrementally adoptable — start simple and scale up.
        </p>
        <h3>Why Vue?</h3>
        <ul>
          <li><strong>Approachable</strong> — familiar HTML template syntax</li>
          <li><strong>Performant</strong> — reactive system with minimal overhead</li>
          <li><strong>Versatile</strong> — scales from a library to a full framework</li>
        </ul>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Composition API</strong> — modern, flexible way to organize component logic</li>
          <li><strong>Single-File Components (SFC)</strong> — template + script + style in one <code>.vue</code> file</li>
          <li><strong>Reactivity</strong> — <code>ref()</code> and <code>reactive()</code> automatically track dependencies</li>
          <li><strong>Directives</strong> — <code>v-if</code>, <code>v-for</code>, <code>v-bind</code> for declarative rendering</li>
        </ul>
      </div>
    ),
  },
  {
    id: "project-structure",
    title: "Project Structure",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Vue Project Layout</h2>
        <p>A Vue 3 project (scaffolded with Vite) follows a clean, predictable structure.</p>
        <h3>Directory Tree:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`my-portfolio/
├── index.html          # Entry HTML
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # App bootstrap
│   ├── App.vue         # Root component
│   ├── components/     # Reusable pieces
│   │   ├── Header.vue
│   │   ├── Skills.vue
│   │   └── Projects.vue
│   ├── views/          # Page-level components
│   ├── router/         # Vue Router config
│   ├── stores/         # Pinia state stores
│   └── assets/         # Static assets`}
        </pre>
        <h3>Bootstrap Flow:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')`}
        </pre>
      </div>
    ),
  },
  {
    id: "sfc-basics",
    title: "Single-File Components",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>The .vue File</h2>
        <p>
          Vue's SFC format puts template, logic, and styling in a single file.
          Each section has a clear purpose.
        </p>
        <h3>Anatomy of a Component:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<template>
  <section class="about">
    <h2>{{ name }}</h2>
    <p>{{ bio }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('Alex')
const bio = ref('Web developer and lifelong learner.')
</script>

<style scoped>
.about {
  padding: 2rem;
  text-align: center;
}
</style>`}
        </pre>
        <h3>Key Points:</h3>
        <ul>
          <li><code>&lt;script setup&gt;</code> — Composition API sugar, no boilerplate</li>
          <li><code>&lt;style scoped&gt;</code> — CSS that only applies to this component</li>
          <li><code>{"{{ }}"}</code> — Mustache syntax for text interpolation</li>
        </ul>
      </div>
    ),
  },
  {
    id: "props-emit",
    title: "Props & Emit",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Component Communication</h2>
        <p>Data flows down via <strong>props</strong> and events flow up via <strong>emit</strong>.</p>
        <h3>Defining Props:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- SkillBadge.vue -->
<script setup>
defineProps({
  name: String,
  level: { type: Number, default: 50 }
})
</script>

<template>
  <span class="badge">{{ name }} ({{ level }}%)</span>
</template>`}
        </pre>
        <h3>Emitting Events:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- ThemePicker.vue -->
<script setup>
const emit = defineEmits(['change'])

const selectTheme = (theme) => {
  emit('change', theme)
}
</script>

<!-- Parent usage -->
<ThemePicker @change="applyTheme" />`}
        </pre>
      </div>
    ),
  },
  {
    id: "lists",
    title: "Rendering Lists",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>v-for Directive</h2>
        <p>Vue uses the <code>v-for</code> directive to render lists of items from arrays or objects.</p>
        <h3>Array Iteration:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<script setup>
import { ref } from 'vue'

const skills = ref([
  { id: 1, name: 'Vue', level: 90 },
  { id: 2, name: 'JavaScript', level: 85 },
  { id: 3, name: 'CSS', level: 80 },
])
</script>

<template>
  <ul>
    <li v-for="skill in skills" :key="skill.id">
      {{ skill.name }} — {{ skill.level }}%
    </li>
  </ul>
</template>`}
        </pre>
        <h3>Important:</h3>
        <ul>
          <li>Always use <code>:key</code> with a unique identifier</li>
          <li><code>v-for</code> can iterate over arrays, objects, numbers, and strings</li>
          <li>Access the index with <code>v-for="(item, index) in list"</code></li>
        </ul>
      </div>
    ),
  },
  {
    id: "composition-api",
    title: "Composition API",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Reactive State Management</h2>
        <p>
          The Composition API gives you fine-grained control over reactivity
          using <code>ref()</code>, <code>reactive()</code>, <code>computed()</code>, and <code>watch()</code>.
        </p>
        <h3>Core Primitives:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`import { ref, computed, watch, onMounted } from 'vue'

// ref — single reactive value
const count = ref(0)

// reactive — reactive object
const portfolio = reactive({
  name: 'Alex',
  skills: ['Vue', 'JS']
})

// computed — derived value (auto-updates)
const skillCount = computed(() => portfolio.skills.length)

// watch — side effects on change
watch(count, (newVal, oldVal) => {
  console.log(\`Count: \${oldVal} → \${newVal}\`)
})

// lifecycle
onMounted(() => {
  console.log('Component is ready!')
})`}
        </pre>
      </div>
    ),
  },
  {
    id: "conditional-rendering",
    title: "Conditional Rendering",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>v-if, v-else, v-show</h2>
        <p>Vue provides directives for conditionally rendering elements in the template.</p>
        <h3>v-if vs v-show:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- v-if: adds/removes from DOM -->
<div v-if="isLoading">Loading...</div>
<div v-else-if="error">{{ error }}</div>
<div v-else>
  <ProjectList :projects="projects" />
</div>

<!-- v-show: toggles CSS display -->
<!-- Better for frequent toggles -->
<div v-show="showFilters">
  <FilterPanel />
</div>`}
        </pre>
        <h3>When to Use Which:</h3>
        <ul>
          <li><code>v-if</code> — when the condition rarely changes (cheaper toggle cost, higher initial cost)</li>
          <li><code>v-show</code> — when toggling frequently (always rendered, just hidden via CSS)</li>
          <li><code>v-if</code> with <code>v-else</code> — for mutually exclusive views</li>
        </ul>
      </div>
    ),
  },
  {
    id: "scoped-styling",
    title: "Scoped Styling",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>CSS in Vue Components</h2>
        <p>
          Vue's <code>scoped</code> attribute ensures your CSS only applies to the current component.
          No class name collisions, ever.
        </p>
        <h3>Scoped Styles:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<style scoped>
.card {
  background: var(--color-background);
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}
</style>`}
        </pre>
        <h3>Using CSS Custom Properties for Theming:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<style scoped>
.header {
  background: var(--color-primary);
  color: var(--color-textDark);
}

/* Deep selector — style child components */
:deep(.badge) {
  border-color: var(--color-accent);
}
</style>`}
        </pre>
      </div>
    ),
  },
  {
    id: "ai-assisted",
    title: "AI-Assisted Vue Dev",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building Vue Apps with AI</h2>
        <p>
          AI tools accelerate Vue development by generating components,
          composables, and store logic from natural language descriptions.
        </p>
        <h3>AI Tools for Vue:</h3>
        <ul>
          <li><strong>Gemini</strong> — Excellent at generating Vue 3 Composition API code</li>
          <li><strong>Copilot</strong> — Great for inline SFC completion</li>
          <li><strong>Cursor</strong> — Multi-file refactoring across .vue files</li>
          <li><strong>Claude</strong> — Deep reasoning about reactive patterns</li>
          <li><strong>Antigravity</strong> — Full agentic workflow for Vue apps</li>
        </ul>
        <h3>Example Vue Prompt:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Create a Vue 3 SFC called SkillBadge.vue:
- Uses <script setup> with defineProps
- Props: name (string), level (string), category (string)
- Template: rounded badge with colored background
- Style: scoped CSS with custom properties
- Level determines badge color: beginner=green,
  intermediate=blue, advanced=purple"`}
        </pre>
        <h3>AI for Composition API Patterns:</h3>
        <p>
          Ask AI to generate composables (reusable logic), convert Options API
          code to Composition API, or create Pinia stores — it handles Vue
          reactive patterns naturally.
        </p>
      </div>
    ),
    playground: {
      title: "Vue Prompt Engineering",
      starterCode: `// Write a prompt to generate a Vue 3 composable
// that manages a theme system.

const prompt = \`
Create a Vue 3 composable called useTheme that:
- [TODO: What state should it track?]
- [TODO: What methods should it expose?]
- [TODO: How should it persist preferences?]
- [TODO: What should it return?]
\`;

console.log("Your prompt:");
console.log(prompt);

// Evaluate:
console.log("\\nDoes your prompt specify:");
console.log("- Return type (ref, reactive, computed)?");
console.log("- Side effects (localStorage, watch)?");
console.log("- TypeScript types?");`,
      hints: ["Include: ref for currentTheme, computed for isDark, function setTheme() that updates CSS vars and persists to localStorage, watch to sync with system preference. Return { currentTheme, isDark, setTheme, themes }."],
    },
  },
  {
    id: "deployment",
    title: "Deployment",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Deploy Your Vue Portfolio</h2>
        <p>Vue + Vite produces a static build — deploy anywhere that serves HTML.</p>
        <h3>Build & Preview:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`# Build for production
npm run build

# Preview the build locally
npm run preview`}
        </pre>
        <h3>Deploy to Vercel:</h3>
        <ol>
          <li>Push code to GitHub</li>
          <li>Connect repo on vercel.com</li>
          <li>Framework preset: <strong>Vue.js</strong> (auto-detected)</li>
          <li>Root directory: <code>apps/vue</code></li>
          <li>Deploy — live in under a minute</li>
        </ol>
        <h3>Vue Router History Mode:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// vercel.json — SPA rewrite rule
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}`}
        </pre>
      </div>
    ),
  },
];

// ─── SvelteKit Lessons ───────────────────────────────────────────────
const svelteLessons = [
  {
    id: "intro",
    title: "Intro to Svelte",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Welcome to Svelte!</h2>
        <p>
          Svelte is a compiler that turns your declarative components into efficient
          JavaScript that surgically updates the DOM. No virtual DOM, no runtime overhead.
        </p>
        <h3>Why Svelte?</h3>
        <ul>
          <li><strong>No virtual DOM</strong> — compiles to vanilla JS at build time</li>
          <li><strong>Less boilerplate</strong> — reactive by default, no <code>useState</code> or <code>ref()</code></li>
          <li><strong>Tiny bundles</strong> — ships less JavaScript to the browser</li>
          <li><strong>Built-in animations</strong> — transitions and motion are first-class</li>
        </ul>
        <h3>Svelte vs SvelteKit:</h3>
        <ul>
          <li><strong>Svelte</strong> — the component framework (like React or Vue)</li>
          <li><strong>SvelteKit</strong> — the app framework (like Next.js or Nuxt) — includes routing, SSR, and more</li>
        </ul>
      </div>
    ),
  },
  {
    id: "project-structure",
    title: "Project Structure",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>SvelteKit Project Layout</h2>
        <p>SvelteKit uses file-system routing — your folder structure IS your route structure.</p>
        <h3>Directory Tree:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`my-portfolio/
├── svelte.config.js    # SvelteKit configuration
├── vite.config.js      # Vite configuration
├── src/
│   ├── app.html        # HTML shell
│   ├── app.css         # Global styles
│   ├── lib/            # Shared utilities
│   │   ├── components/ # Reusable components
│   │   └── data.js     # Portfolio data
│   └── routes/         # File-system router
│       ├── +layout.svelte  # Shared layout
│       ├── +page.svelte    # Home page (/)
│       ├── about/
│       │   └── +page.svelte # /about
│       └── projects/
│           └── +page.svelte # /projects`}
        </pre>
        <h3>Key Convention:</h3>
        <ul>
          <li><code>+page.svelte</code> — a routable page</li>
          <li><code>+layout.svelte</code> — wraps all child pages (nav, footer)</li>
          <li><code>$lib/</code> — alias for <code>src/lib/</code>, importable anywhere</li>
        </ul>
      </div>
    ),
  },
  {
    id: "components",
    title: "Svelte Components",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>The .svelte File</h2>
        <p>Like Vue SFCs, Svelte components combine markup, logic, and styles in one file — but with even less ceremony.</p>
        <h3>Basic Component:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- Header.svelte -->
<script>
  let name = 'Alex';
  let title = 'Web Developer';
</script>

<header>
  <h1>{name}</h1>
  <p>{title}</p>
</header>

<style>
  header {
    text-align: center;
    padding: 2rem;
  }
  h1 {
    color: var(--color-primary);
  }
</style>`}
        </pre>
        <h3>Key Differences from React/Vue:</h3>
        <ul>
          <li>No <code>return</code> statement — markup is top-level</li>
          <li>Variables are reactive by default — just assign with <code>=</code></li>
          <li>Curly braces <code>{"{}"}</code> for expressions (like JSX, not mustache)</li>
          <li>Styles are auto-scoped (no <code>scoped</code> attribute needed)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "props-events",
    title: "Props & Events",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Data In, Events Out</h2>
        <p>Svelte uses <code>export let</code> for props and <code>createEventDispatcher</code> or callback props for events.</p>
        <h3>Props:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- SkillBadge.svelte -->
<script>
  export let name;
  export let level = 50; // default value
</script>

<span class="badge">
  {name} — {level}%
</span>

<!-- Usage -->
<SkillBadge name="Svelte" level={90} />`}
        </pre>
        <h3>Events:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- ThemePicker.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  const select = (theme) => dispatch('change', theme);
</script>

<!-- Or use callback props (simpler) -->
<script>
  export let onChange;
</script>
<button on:click={() => onChange('dark')}>Dark</button>`}
        </pre>
      </div>
    ),
  },
  {
    id: "each-blocks",
    title: "Each Blocks",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Rendering Lists</h2>
        <p>Svelte uses <code>{"{#each}"}</code> blocks to iterate over arrays — no method call needed.</p>
        <h3>Basic Each:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<script>
  const skills = [
    { id: 1, name: 'Svelte', level: 90 },
    { id: 2, name: 'JavaScript', level: 85 },
    { id: 3, name: 'CSS', level: 80 },
  ];
</script>

{#each skills as skill (skill.id)}
  <div class="skill-card">
    <h3>{skill.name}</h3>
    <progress value={skill.level} max="100" />
  </div>
{:else}
  <p>No skills added yet.</p>
{/each}`}
        </pre>
        <h3>Key Points:</h3>
        <ul>
          <li><code>(skill.id)</code> — the keyed identifier (like React's <code>key</code>)</li>
          <li><code>{"{:else}"}</code> — renders when the array is empty</li>
          <li>Destructuring works: <code>{"{#each skills as { name, level }}"}</code></li>
        </ul>
      </div>
    ),
  },
  {
    id: "reactivity",
    title: "Reactive Declarations",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Svelte's Superpower</h2>
        <p>
          In Svelte, reactivity is baked into the language. Assignments trigger updates.
          Derived values use the <code>$:</code> label.
        </p>
        <h3>Reactive Assignments:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<script>
  let count = 0;

  // This re-runs whenever count changes
  $: doubled = count * 2;

  // Reactive statement (like useEffect)
  $: console.log('Count is now', count);

  // Reactive block
  $: {
    if (count > 10) {
      alert('Big number!');
      count = 0;
    }
  }
</script>

<button on:click={() => count++}>
  {count} × 2 = {doubled}
</button>`}
        </pre>
        <h3>Stores (Global State):</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// stores/theme.js
import { writable } from 'svelte/store';

export const currentTheme = writable('default');

// In any component — $ prefix auto-subscribes
<script>
  import { currentTheme } from '$lib/stores/theme';
</script>

<p>Current: {$currentTheme}</p>`}
        </pre>
      </div>
    ),
  },
  {
    id: "conditional-rendering",
    title: "Conditional Rendering",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>If/Else Blocks</h2>
        <p>Svelte uses <code>{"{#if}"}</code> blocks for conditional rendering — clean, readable, no JSX ternaries.</p>
        <h3>Syntax:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`{#if isLoading}
  <Spinner />
{:else if error}
  <ErrorMessage message={error} />
{:else}
  <ProjectList projects={projects} />
{/if}

<!-- Simpler conditional -->
{#if showBio}
  <p>{bio}</p>
{/if}`}
        </pre>
        <h3>Comparison with Other Frameworks:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// React — ternary in JSX
{isLoading ? <Spinner /> : <Content />}

// Vue — v-if directive
<Spinner v-if="isLoading" />
<Content v-else />

// Svelte — block syntax
{#if isLoading}
  <Spinner />
{:else}
  <Content />
{/if}`}
        </pre>
      </div>
    ),
  },
  {
    id: "styling",
    title: "Styling in Svelte",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Component Styles</h2>
        <p>
          Svelte styles are scoped by default. Unused CSS is automatically removed at compile time.
        </p>
        <h3>Scoped Styles:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<style>
  /* Only applies to THIS component */
  .card {
    background: var(--color-background);
    border-radius: 12px;
    padding: 1.5rem;
  }

  /* Dynamic classes */
  .active {
    border-color: var(--color-primary);
  }
</style>

<!-- Conditional classes -->
<div class="card" class:active={isSelected}>
  ...
</div>`}
        </pre>
        <h3>CSS Variables for Theming:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<!-- Pass CSS vars as component props -->
<div style="--color: {theme.primary}">
  <slot />
</div>

<style>
  div {
    color: var(--color);
  }
</style>`}
        </pre>
        <h3>Built-in Transitions:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`<script>
  import { fade, slide } from 'svelte/transition';
</script>

{#if visible}
  <div transition:fade={{ duration: 300 }}>
    Hello!
  </div>
{/if}`}
        </pre>
      </div>
    ),
  },
  {
    id: "ai-assisted",
    title: "AI-Assisted Svelte Dev",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Building Svelte Apps with AI</h2>
        <p>
          Svelte's unique syntax (reactive declarations, each blocks, transitions)
          is well-understood by modern AI tools, making them excellent companions
          for Svelte development.
        </p>
        <h3>AI Tools for Svelte:</h3>
        <ul>
          <li><strong>Gemini</strong> — Generates clean .svelte components with transitions</li>
          <li><strong>Copilot</strong> — Predicts reactive declarations and store patterns</li>
          <li><strong>Cursor</strong> — Multi-file SvelteKit refactoring</li>
          <li><strong>Claude</strong> — Excellent at Svelte 5 runes and store logic</li>
          <li><strong>Antigravity</strong> — Full agentic workflow for SvelteKit apps</li>
        </ul>
        <h3>Example Svelte Prompt:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Create a Svelte component called ProjectCard.svelte:
- Props: title, description, tags (array), githubUrl, liveUrl
- Use {#each} to render tags as badges
- Add hover transition: scale(1.02) with Svelte transition
- Style: scoped, CSS custom properties for theming
- Include a slot for custom footer content"`}
        </pre>
        <h3>AI for Svelte 5 Runes:</h3>
        <p>
          Ask AI to help migrate from Svelte 4 reactive declarations (<code>$:</code>)
          to Svelte 5 runes (<code>$state</code>, <code>$derived</code>, <code>$effect</code>).
          AI handles this migration pattern very well.
        </p>
      </div>
    ),
    playground: {
      title: "Svelte Component from Prompt",
      starterCode: `// Practice: Write a prompt for an AI to generate
// a Svelte theme toggle component.

const sveltePrompt = \`
Create a Svelte 5 component called ThemeToggle.svelte:
- Uses \$state rune for current theme
- [TODO: What UI should it render?]
- [TODO: How to persist preference?]
- [TODO: What transitions to use?]
- [TODO: Accessibility requirements?]
\`;

console.log("Your Svelte prompt:");
console.log(sveltePrompt);
console.log("\\nTip: Mention Svelte-specific features!");
console.log("- $state, $derived, $effect (runes)");
console.log("- transition:fade, transition:slide");
console.log("- class: directive for conditional classes");`,
      hints: ["Include: sun/moon icon toggle, \$effect to persist to localStorage and update document class, transition:fade on icon swap, aria-label for screen readers, prefers-color-scheme media query respect."],
    },
  },
  {
    id: "deployment",
    title: "Deployment",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Deploy Your SvelteKit Portfolio</h2>
        <p>SvelteKit supports multiple adapters — choose based on your hosting target.</p>
        <h3>Static Adapter (GitHub Pages / Netlify / Vercel):</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`# Install static adapter
npm install -D @sveltejs/adapter-static

// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html' // SPA mode
    })
  }
};`}
        </pre>
        <h3>Vercel Adapter (recommended):</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`npm install -D @sveltejs/adapter-vercel

// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: { adapter: adapter() }
};`}
        </pre>
        <h3>Build & Deploy:</h3>
        <ol>
          <li><code>npm run build</code> — generates optimized output</li>
          <li>Push to GitHub, connect on Vercel</li>
          <li>Framework: <strong>SvelteKit</strong> (auto-detected)</li>
          <li>Live in seconds</li>
        </ol>
      </div>
    ),
  },
];

// ─── Agentic Development Lessons ─────────────────────────────────────
const agenticLessons = [
  {
    id: "intro-ai-dev",
    title: "Intro to AI Development",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Welcome to the Age of AI-Assisted Development</h2>
        <p>
          Software development has fundamentally changed. AI coding assistants can
          generate code, debug issues, explain complex systems, and even architect
          entire applications. Learning to work <em>with</em> AI effectively is
          now a core developer skill.
        </p>
        <h3>What is Agentic Development?</h3>
        <p>
          <strong>Agentic development</strong> means using AI agents that can
          autonomously perform tasks: reading your codebase, running commands,
          editing files, browsing documentation, and iterating on solutions —
          all guided by your natural language instructions.
        </p>
        <h3>The AI Tool Landscape:</h3>
        <ul>
          <li><strong>Gemini Code Assist</strong> — Google's AI, integrated into VS Code and Cloud</li>
          <li><strong>GitHub Copilot</strong> — Inline suggestions as you type</li>
          <li><strong>Cursor</strong> — AI-first code editor with full codebase awareness</li>
          <li><strong>Claude</strong> — Anthropic's AI, strong at reasoning and long context</li>
          <li><strong>OpenCode</strong> — Open-source AI CLI for the terminal</li>
          <li><strong>Antigravity</strong> — Google DeepMind's agentic AI coding assistant</li>
        </ul>
        <h3>AI is a Tool, Not a Replacement</h3>
        <p>
          AI makes you faster, but you still need to <strong>understand the code</strong>.
          Think of AI as a brilliant junior developer — incredibly productive, but
          needs your guidance and review.
        </p>
      </div>
    ),
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Writing Effective Prompts</h2>
        <p>
          The quality of AI output depends entirely on the quality of your prompt.
          Prompt engineering is the skill of giving AI clear, specific instructions
          that produce the code you actually want.
        </p>
        <h3>The CRISP Framework:</h3>
        <ul>
          <li><strong>C</strong>ontext — What's the project, language, framework?</li>
          <li><strong>R</strong>equirements — What exactly should it do?</li>
          <li><strong>I</strong>nput/Output — What data goes in and comes out?</li>
          <li><strong>S</strong>tyle — What patterns, conventions, or libraries to use?</li>
          <li><strong>P</strong>erformance — Any constraints (accessibility, speed, size)?</li>
        </ul>
        <h3>Bad vs Good Prompts:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`❌ "Make a card component"

✅ "Create a React component called ProjectCard that:
- Accepts props: title (string), description (string),
  tags (string[]), githubUrl (string), liveUrl (string)
- Renders as a rounded card with shadow
- Uses Tailwind CSS (v4 syntax)
- Tags shown as colored badges
- Links open in new tabs with rel=noopener
- Has hover scale effect
- Works in dark mode (dark: variants)
- Includes aria-label on links for accessibility"`}
        </pre>
        <h3>Advanced Techniques:</h3>
        <ul>
          <li><strong>Few-shot examples</strong> — Show AI an example of what you want</li>
          <li><strong>Constraints</strong> — Tell it what NOT to do</li>
          <li><strong>Step-by-step</strong> — Break complex tasks into stages</li>
          <li><strong>Reference files</strong> — Point AI to existing code to match patterns</li>
        </ul>
      </div>
    ),
    playground: {
      title: "Prompt Crafting Exercise",
      starterCode: `// EXERCISE: Write a CRISP prompt for an AI to generate
// a responsive navigation bar component.
//
// Fill in each section:

const myPrompt = {
  context: "React 19 app with Tailwind CSS v4",
  requirements: "TODO: What should the nav do?",
  inputOutput: "TODO: What props does it take?",
  style: "TODO: What design patterns to follow?",
  performance: "TODO: Any a11y or perf constraints?",
};

// Assemble your prompt:
const fullPrompt = Object.entries(myPrompt)
  .map(([key, val]) => \`\${key}: \${val}\`)
  .join('\\n');

console.log("Your CRISP Prompt:\\n");
console.log(fullPrompt);`,
      hints: ["Requirements: hamburger on mobile, sticky header, active link highlighting. Props: links array, logo, onMenuClick. Style: glass morphism, smooth transitions. Performance: keyboard navigable, aria-expanded on menu."],
    },
  },
  {
    id: "ai-tools-deep-dive",
    title: "AI Tools Deep Dive",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Choosing the Right AI Tool</h2>
        <p>
          Each AI tool has different strengths. Understanding when to use each one
          will make you more effective.
        </p>
        <h3>Gemini Code Assist</h3>
        <p>
          Google's AI coding assistant. Excels at understanding Google Cloud, Android,
          and full-stack web development. Available in VS Code, JetBrains, and Cloud Shell.
        </p>
        <h3>GitHub Copilot</h3>
        <p>
          The original AI coding assistant. Best for inline autocomplete — it predicts
          the next line as you type. Great for boilerplate and repetitive patterns.
        </p>
        <h3>Cursor</h3>
        <p>
          An AI-first code editor (VS Code fork) that understands your entire codebase.
          Best for large refactors and multi-file changes. Its Cmd+K (edit) and
          Composer (multi-file) features are industry-leading.
        </p>
        <h3>Claude (Anthropic)</h3>
        <p>
          Excels at long, complex reasoning. Best for: explaining legacy code,
          debugging tricky issues, architectural decisions, and code review.
          Handles very long files well.
        </p>
        <h3>OpenCode</h3>
        <p>
          Open-source AI coding CLI. Runs in your terminal, supports multiple AI
          models. Great for developers who prefer terminal workflows.
        </p>
        <h3>Antigravity</h3>
        <p>
          Google DeepMind's agentic AI. Can read your codebase, run commands, edit
          files, search the web, and iterate on complex tasks autonomously. 
          Designed for multi-step development workflows.
        </p>
        <h3>Quick Comparison:</h3>
        <table>
          <thead>
            <tr><th>Tool</th><th>Best For</th><th>Style</th></tr>
          </thead>
          <tbody>
            <tr><td>Gemini</td><td>Google ecosystem, full-stack</td><td>Chat + inline</td></tr>
            <tr><td>Copilot</td><td>Autocomplete, boilerplate</td><td>Inline suggestions</td></tr>
            <tr><td>Cursor</td><td>Multi-file refactors</td><td>Editor-integrated</td></tr>
            <tr><td>Claude</td><td>Complex reasoning, review</td><td>Chat + agentic</td></tr>
            <tr><td>OpenCode</td><td>Terminal workflows</td><td>CLI</td></tr>
            <tr><td>Antigravity</td><td>Agentic multi-step tasks</td><td>Autonomous agent</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "agentic-workflows",
    title: "Agentic Workflows",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>How AI Agents Work</h2>
        <p>
          Unlike simple chat-based AI, <strong>agentic AI</strong> can take actions:
          read files, run commands, edit code, search the web, and iterate until a
          task is complete. This is a paradigm shift in how software is built.
        </p>
        <h3>The Agent Loop:</h3>
        <ol>
          <li><strong>Observe</strong> — Agent reads your codebase, understands context</li>
          <li><strong>Plan</strong> — Agent creates a strategy to accomplish your goal</li>
          <li><strong>Act</strong> — Agent edits files, runs commands, creates tests</li>
          <li><strong>Verify</strong> — Agent runs tests, checks build, validates output</li>
          <li><strong>Iterate</strong> — If something fails, agent adjusts and retries</li>
        </ol>
        <h3>Example Agentic Task:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`You: "Add dark mode support to the entire app.
Use CSS custom properties. Persist the preference
to localStorage. Include a toggle button in the nav."

Agent:
1. Reads your CSS files and components
2. Creates CSS custom properties for colors
3. Adds a ThemeProvider context
4. Creates a DarkModeToggle component
5. Updates all hardcoded colors to use variables
6. Tests the build
7. Reports what it changed`}
        </pre>
        <h3>When to Use Agentic AI:</h3>
        <ul>
          <li><strong>Multi-file changes</strong> — refactoring, feature additions</li>
          <li><strong>Boilerplate generation</strong> — CRUD operations, API routes</li>
          <li><strong>Bug investigation</strong> — "why does X happen when I click Y?"</li>
          <li><strong>Code migration</strong> — updating dependencies, framework versions</li>
        </ul>
        <h3>When NOT to Use:</h3>
        <ul>
          <li>Security-critical code without expert review</li>
          <li>Performance-critical hot paths (benchmark yourself)</li>
          <li>When you don't understand what the code does</li>
        </ul>
      </div>
    ),
  },
  {
    id: "mcp-protocol",
    title: "MCP & Tool Use",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Model Context Protocol (MCP)</h2>
        <p>
          MCP is an open protocol that lets AI models connect to external tools and
          data sources. Think of it as "USB for AI" — a standard way for AI to
          interact with databases, APIs, file systems, and development tools.
        </p>
        <h3>How MCP Works:</h3>
        <ol>
          <li><strong>Client</strong> (your AI tool) connects to MCP servers</li>
          <li><strong>Server</strong> exposes tools (functions the AI can call)</li>
          <li><strong>AI</strong> decides which tools to use based on your request</li>
          <li><strong>Results</strong> flow back to the AI to continue reasoning</li>
        </ol>
        <h3>Common MCP Servers:</h3>
        <ul>
          <li><strong>Filesystem</strong> — Read/write files in your project</li>
          <li><strong>Git</strong> — Check status, create commits, view diffs</li>
          <li><strong>Browser</strong> — Navigate pages, take screenshots, debug</li>
          <li><strong>Database</strong> — Query databases, inspect schemas</li>
          <li><strong>Search</strong> — Search the web for documentation</li>
        </ul>
        <h3>Why MCP Matters:</h3>
        <p>
          Without MCP, AI can only work with what's in your conversation. With MCP,
          AI can access your actual codebase, run your tests, check your deployment,
          and use any tool you configure — making it truly useful for real development.
        </p>
      </div>
    ),
  },
  {
    id: "ai-debugging",
    title: "AI-Powered Debugging",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Debugging with AI</h2>
        <p>
          AI excels at debugging because it can analyze error messages, trace code
          paths, and suggest fixes faster than manual searching. This is often
          the first "aha moment" for developers using AI tools.
        </p>
        <h3>Effective Bug Report Prompt:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"I'm getting this error:

TypeError: Cannot read properties of undefined
  (reading 'map')
  at ProjectList (ProjectList.jsx:12)

Here's my component: [paste code]
Here's the data I'm passing: [paste data]

What's causing this and how do I fix it?"`}
        </pre>
        <h3>Debugging Strategies with AI:</h3>
        <ul>
          <li><strong>Paste the full error</strong> — including stack trace</li>
          <li><strong>Include relevant code</strong> — the component and its parent</li>
          <li><strong>Describe expected vs actual</strong> — what should happen vs what does</li>
          <li><strong>Ask for explanation</strong> — not just the fix, but WHY it broke</li>
        </ul>
        <h3>AI for Console Errors:</h3>
        <p>
          Copy-paste any console error directly to your AI tool. Modern AI understands
          React error boundaries, webpack build errors, TypeScript type errors,
          and CSS layout issues. Always ask it to explain the root cause.
        </p>
      </div>
    ),
    playground: {
      title: "Debug with AI Thinking",
      starterCode: `// This code has a bug. Can you find it?
// Think like an AI debugger — trace the data flow.

const projects = [
  { id: 1, title: "Portfolio", tags: ["React"] },
  { id: 2, title: "Blog" },  // 🐛 Bug: missing 'tags'
  { id: 3, title: "Chat App", tags: ["Node", "Socket.io"] },
];

// This will crash on project #2
function renderTags(project) {
  return project.tags.map(tag => \`<span>\${tag}</span>\`).join('');
}

// Fix: Add optional chaining or default
function renderTagsSafe(project) {
  return (project.tags ?? []).map(tag => \`<span>\${tag}</span>\`).join('');
}

projects.forEach(p => {
  try {
    console.log(p.title + ': ' + renderTags(p));
  } catch (e) {
    console.log(p.title + ': ❌ ' + e.message);
    console.log('  Fixed: ' + renderTagsSafe(p));
  }
});`,
      hints: ["The bug is that project #2 doesn't have a 'tags' property. Use optional chaining (?.) or nullish coalescing (??) to handle missing data gracefully."],
    },
  },
  {
    id: "ai-code-review",
    title: "AI Code Review",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Using AI for Code Review</h2>
        <p>
          AI can review your code for bugs, performance issues, accessibility
          problems, and style inconsistencies — like having a senior developer
          available 24/7.
        </p>
        <h3>Code Review Prompt Template:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Review this React component for:
1. Bugs or logic errors
2. Performance issues (unnecessary re-renders)
3. Accessibility (ARIA, semantic HTML, keyboard nav)
4. Security concerns (XSS, injection)
5. Code style and best practices

[paste your code]"`}
        </pre>
        <h3>What AI Catches:</h3>
        <ul>
          <li>Missing dependency arrays in <code>useEffect</code></li>
          <li>Unescaped user input (XSS vulnerability)</li>
          <li>Missing <code>key</code> props in lists</li>
          <li>Inaccessible interactive elements (missing labels, roles)</li>
          <li>Memory leaks (uncleared timers, event listeners)</li>
          <li>Inconsistent error handling</li>
        </ul>
        <h3>Review Your AI's Output Too:</h3>
        <p>
          AI isn't perfect. Always verify suggestions make sense in your specific
          context. Sometimes AI suggests overly complex solutions for simple problems.
        </p>
      </div>
    ),
  },
  {
    id: "ai-testing",
    title: "AI-Generated Tests",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Writing Tests with AI</h2>
        <p>
          Writing tests is one of AI's strongest use cases. It can analyze your
          component's API and generate comprehensive test suites covering edge
          cases you might miss.
        </p>
        <h3>The Perfect Testing Prompt:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"Write Vitest tests for this React component using
@testing-library/react. Cover:
- Rendering with required props
- Rendering with optional props omitted
- User interactions (clicks, typing)
- Edge cases (empty data, null values)
- Accessibility (roles, labels)

Use describe/it blocks. Use screen queries.
[paste component code]"`}
        </pre>
        <h3>AI Test Generation Workflow:</h3>
        <ol>
          <li>Write your component first</li>
          <li>Ask AI to generate tests</li>
          <li>Run the tests — they should pass</li>
          <li>Break something intentionally — tests should fail</li>
          <li>Fix it — tests should pass again</li>
        </ol>
        <h3>Spec-Driven Development with AI:</h3>
        <p>
          A powerful pattern: write your tests <em>first</em> (describing behavior),
          then ask AI to implement the component that makes the tests pass.
          This is TDD + AI at its best.
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`// Step 1: YOU write the spec
"Here are my tests for a ThemeToggle component:
[paste tests]

Write a React component that makes all these tests pass.
Use Tailwind CSS. It should toggle between light/dark mode
and persist the preference to localStorage."`}
        </pre>
      </div>
    ),
  },
  {
    id: "ai-project-planning",
    title: "AI Project Planning",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Planning Projects with AI</h2>
        <p>
          Before writing code, AI can help you plan your project architecture,
          define your component tree, design your data model, and create a
          step-by-step implementation plan.
        </p>
        <h3>Project Planning Prompt:</h3>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm">
          {`"I want to build a portfolio website with React 19
and Tailwind CSS v4. It should have:
- A responsive header with navigation
- An about section with bio and photo
- A skills section with interactive badges
- A projects grid with filtering by tag
- A contact form with validation
- Dark mode support
- Deployed on Vercel

Create an implementation plan with:
1. Component tree diagram
2. Data model (TypeScript interfaces)
3. File structure
4. Implementation order (dependencies first)
5. Estimated time per component"`}
        </pre>
        <h3>Breaking Down Large Tasks:</h3>
        <ul>
          <li>Ask AI to decompose features into small, testable chunks</li>
          <li>Each chunk should be implementable in 15-30 minutes</li>
          <li>Define clear done criteria for each chunk</li>
          <li>Build vertically — one complete feature at a time, not all UI first</li>
        </ul>
        <h3>Architecture Decisions:</h3>
        <p>
          AI can help you evaluate trade-offs: "Should I use Context or Zustand
          for state management? My app has 5 pages and 3 shared state values."
          This is where AI's broad knowledge of patterns shines.
        </p>
      </div>
    ),
  },
  {
    id: "personalized-software",
    title: "The Audience of One: Bespoke Software",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Software Built for You, by You</h2>
        <p>
          In the AI era, the old paradigm of searching for a one-size-fits-all SaaS product is crumbling.
          Instead of settling for bloated subscription apps with 90% features you never touch, you can prompt
          and deploy an <strong>Audience of One</strong> tool in 15 minutes.
        </p>
        <h3>The 15-Minute POC Speedrun:</h3>
        <ol>
          <li><strong>Identify the exact friction point:</strong> Don't build a generic CRM; build a conference networking badge scanner with 1-click email drafts.</li>
          <li><strong>Choose zero-friction storage:</strong> Use browser <code>localStorage</code> or simple JSON exports. Skip complex databases for personal utilities.</li>
          <li><strong>Scaffold in one command:</strong> <code>npx create-vite my-tool --template react</code></li>
          <li><strong>Prompt the agent:</strong> Feed a concise CRISP prompt with your exact design requirements.</li>
          <li><strong>Deploy instantly:</strong> Ship live with <code>vercel --prod</code> or GitHub Pages.</li>
        </ol>
        <h3>Real-World Case Studies:</h3>
        <ul>
          <li><strong>Jacked Alien:</strong> A finite state machine workout tracker with audio beeps and zero ads.</li>
          <li><strong>Criminal Cookies:</strong> A guerilla high-frequency checkout engine bypassing legacy ecommerce bloat.</li>
          <li><strong>J. Simmons Productions:</strong> Automated distribution hooks turning transcripts into social assets.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "context-engineering-rules",
    title: "Context Engineering & Rules Files",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Context is the Biggest Lever for AI Quality</h2>
        <p>
          Prompting isn't just about what you say in the moment — it's about engineering the <strong>context hierarchy</strong>.
          Too little context causes hallucinations; too much context causes context rot and loss of focus.
        </p>
        <h3>The 4-Layer Context Hierarchy:</h3>
        <ul>
          <li><strong>Level 1: Persistent Rules (AGENTS.md / CLAUDE.md)</strong> — Repository conventions, build commands, and verification gates that stay active on every turn.</li>
          <li><strong>Level 2: Task Spec (SPEC.md)</strong> — Scoped requirements and component tree plans for the current feature.</li>
          <li><strong>Level 3: Filtered Source Files</strong> — Pass only the 1-3 files actively being edited. Never dump the whole codebase into chat.</li>
          <li><strong>Level 4: Automated Test Output</strong> — Vitest error snippets passed back so the agent self-corrects.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "subagent-token-economics",
    title: "Subagents & Token Economics",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Orchestrating Subagents at Scale (cavecrew & caveman)</h2>
        <p>
          Running a single monolithic chat for complex features quickly exhausts context windows.
          The production pattern is <strong>subagent delegation</strong> paired with <strong>token compression</strong>.
        </p>
        <h3>The Subagent Triage Pipeline (cavecrew):</h3>
        <ul>
          <li><strong>Investigator / Scout:</strong> Scans code to locate exact line numbers and symbol references without loading full files into context.</li>
          <li><strong>Builder:</strong> Executes surgical diffs on ≤2 files at a time.</li>
          <li><strong>Reviewer:</strong> Audits the diff for unintended regressions and security vulnerabilities.</li>
          <li><strong>Verification Gate:</strong> Automated CI test harness (Vitest) guarantees zero broken builds.</li>
        </ul>
        <h3>Token Hygiene (Caveman & Cove):</h3>
        <p>
          By dropping polite filler, conversational fluff, and unnecessary boilerplate, compressed agent loops preserve up to <strong>80% of context budget</strong>, allowing sessions to stay razor-sharp for 50+ iterations.
        </p>
      </div>
    ),
  },
  {
    id: "ethics-best-practices",
    title: "Ethics & Best Practices",
    content: (
      <div className="prose dark:prose-invert max-w-none">
        <h2>Responsible AI-Assisted Development</h2>
        <p>
          With great power comes great responsibility. Using AI effectively
          also means using it responsibly and understanding its limitations.
        </p>
        <h3>The Golden Rules:</h3>
        <ol>
          <li><strong>Understand what you ship</strong> — Never commit code you can't explain</li>
          <li><strong>Verify AI output</strong> — AI can be confidently wrong</li>
          <li><strong>Credit and licensing</strong> — Know the license of training data</li>
          <li><strong>Security first</strong> — Never trust AI with auth, encryption, or secrets</li>
          <li><strong>Keep learning</strong> — AI should accelerate learning, not replace it</li>
        </ol>
        <h3>AI Limitations to Know:</h3>
        <ul>
          <li><strong>Hallucinations</strong> — AI can invent APIs that don't exist</li>
          <li><strong>Outdated knowledge</strong> — Training data has a cutoff date</li>
          <li><strong>Context limits</strong> — Very large codebases may not fit in context</li>
          <li><strong>Bias</strong> — AI may suggest patterns from its training data, not your style</li>
        </ul>
        <h3>The Developer's Responsibility:</h3>
        <p>
          You are always responsible for the code you ship. AI is a tool in your
          hands. Use it to learn faster, build better, and ship with confidence —
          but always stay in the driver's seat.
        </p>
        <h3>Continue Your Journey:</h3>
        <ul>
          <li>Explore the <strong>Resources</strong> page for AI tool links</li>
          <li>Try different AI tools to find your preferred workflow</li>
          <li>Practice prompt engineering daily — it's a muscle</li>
          <li>Share what you learn with your community</li>
          <li>Build something amazing and deploy it!</li>
        </ul>
      </div>
    ),
  },
];

// ─── Track → Lessons map ─────────────────────────────────────────────
const TRACK_LESSONS = {
  react: reactLessons,
  vanilla: vanillaLessons,
  vue: vueLessons,
  svelte: svelteLessons,
  agentic: agenticLessons,
};

// ─── Track Selector Component ────────────────────────────────────────
const TrackSelector = ({ activeTrack, onTrackChange }) => (
  <div className="flex flex-wrap gap-2 mb-6">
    {Object.values(TRACKS).map((track) => (
      <button
        key={track.id}
        onClick={() => onTrackChange(track.id)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
          activeTrack === track.id
            ? "bg-(--color-primary) text-white shadow-md"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <span>{track.icon}</span>
        <span>{track.name}</span>
      </button>
    ))}
  </div>
);

// ─── Main Lessons Component ──────────────────────────────────────────
export const Lessons = () => {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Track selection — from URL param, localStorage, or default
  const [activeTrack, setActiveTrack] = useState(() => {
    const urlTrack = searchParams.get("track");
    if (urlTrack && TRACK_LESSONS[urlTrack]) return urlTrack;
    const saved = localStorage.getItem("workshop-track");
    return saved && TRACK_LESSONS[saved] ? saved : "react";
  });

  const lessons = TRACK_LESSONS[activeTrack];
  const track = TRACKS[activeTrack];

  const [activeLesson, setActiveLesson] = useState(() => {
    if (lessonId) {
      const idx = lessons.findIndex((l) => l.id === lessonId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const currentLesson = lessons[activeLesson];

  // Persist track selection
  const handleTrackChange = (trackId) => {
    setActiveTrack(trackId);
    setActiveLesson(0);
    localStorage.setItem("workshop-track", trackId);
    navigate(`/lessons?track=${trackId}`, { replace: true });
  };

  // Reset lesson index when track changes and lessons array changes
  useEffect(() => {
    if (activeLesson >= lessons.length) {
      setActiveLesson(0);
    }
  }, [activeTrack, lessons.length, activeLesson]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't navigate if user is typing in an input/textarea
      if (
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "INPUT"
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveLesson((prev) => Math.min(lessons.length - 1, prev + 1));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveLesson((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lessons.length]);

  return (
    <div className="section-container py-24">
      {/* Track Selector */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Track
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {track.description}
        </p>
        <TrackSelector activeTrack={activeTrack} onTrackChange={handleTrackChange} />
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Lesson Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>{track.icon}</span>
                  <span>{track.name}</span>
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activeLesson + 1}/{lessons.length}
                </span>
              </div>
              <nav className="space-y-1">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm ${
                      activeLesson === index
                        ? "bg-(--color-primary) text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        activeLesson === index
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium truncate">{lesson.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Keyboard Hint */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                ←
              </kbd>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                →
              </kbd>
              <span>to navigate</span>
            </div>

            {/* Progress Tracker */}
            <ProgressTracker />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-full bg-(--color-primary)/10 text-(--color-primary) flex items-center justify-center font-bold">
                {activeLesson + 1}
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${track.color} mb-1`}>
                  {track.name} Track
                </p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {currentLesson.title}
                </h1>
              </div>
            </div>

            {currentLesson.content}

            {/* Playground - keyed by lesson ID to force remount/reset */}
            {currentLesson.playground && (
              <div className="mt-8">
                <Playground
                  key={`${activeTrack}-${currentLesson.id}`}
                  {...currentLesson.playground}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                disabled={activeLesson === 0}
                className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors hover:cursor-pointer disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setActiveLesson(
                    Math.min(lessons.length - 1, activeLesson + 1)
                  )
                }
                disabled={activeLesson === lessons.length - 1}
                className="px-6 py-3 rounded-lg bg-(--color-primary) text-white disabled:opacity-50 hover:opacity-90 transition-opacity hover:cursor-pointer disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
