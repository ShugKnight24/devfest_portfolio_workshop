import { useState } from "react";
import { ChevronDown, ChevronUp } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";

/**
 * Troubleshooting Component
 *
 * A collapsible FAQ-style component for common issues and solutions.
 * Great for helping students debug problems during the workshop.
 */

const troubleshootingData = [
  {
    category: "Setup Issues",
    items: [
      {
        question: "npm install is failing or taking forever",
        answer: `This is usually caused by network issues or corrupted cache. Try these steps:

1. **Clear npm cache**: \`npm cache clean --force\`
2. **Delete node_modules**: \`rm -rf node_modules\` (or delete the folder manually)
3. **Delete package-lock.json**: \`rm package-lock.json\`
4. **Try again**: \`npm install\`

If you're on a slow connection, try:
\`npm install --prefer-offline\`

Still stuck? Try using yarn instead:
\`npm install -g yarn && yarn install\``,
      },
      {
        question: "The development server won't start",
        answer: `Check these common causes:

1. **Port already in use**: Another app might be using port 3000
   - Kill it: \`npx kill-port 3000\`
   - Or use a different port: \`npm run dev -- --port 3001\`

2. **Node version issues**: Make sure you're using Node 18+
   - Check version: \`node --version\`
   - Update if needed: Use nvm or download from nodejs.org

3. **Dependencies not installed**: Run \`npm install\` first

4. **Corrupted cache**: Delete \`.vite\` folder and try again`,
      },
      {
        question: "My changes aren't showing up in the browser",
        answer: `Hot Module Replacement (HMR) should auto-refresh, but if it's not working:

1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear browser cache**: DevTools → Network tab → Disable cache
3. **Check file saved**: Make sure the file is actually saved (Cmd+S)
4. **Check for errors**: Look in the terminal and browser console
5. **Restart the server**: Ctrl+C to stop, then \`npm run dev\` again`,
      },
    ],
  },
  {
    category: "React Errors",
    items: [
      {
        question: '"Cannot read properties of undefined"',
        answer: `This usually means you're trying to access a property on something that doesn't exist yet.

**Common causes:**

1. **Data not loaded yet**: Use optional chaining
   \`\`\`jsx
   // Instead of: data.name
   // Use: data?.name
   \`\`\`

2. **Props not passed**: Make sure parent is passing the prop
   \`\`\`jsx
   <Header personal={personal} /> // personal must be defined
   \`\`\`

3. **Typo in property name**: Double-check spelling
   \`\`\`jsx
   // portfolioData.persnal ❌
   // portfolioData.personal ✅
   \`\`\``,
      },
      {
        question: "\"Each child in a list should have a unique 'key' prop\"",
        answer: `When rendering lists with .map(), each item needs a unique key prop:

**Wrong:**
\`\`\`jsx
{skills.map(skill => (
  <SkillBadge name={skill.name} />
))}
\`\`\`

**Correct:**
\`\`\`jsx
{skills.map(skill => (
  <SkillBadge key={skill.id} name={skill.name} />
))}
\`\`\`

**Tips:**
- Use a unique ID from your data (best)
- Use the array index as a last resort: \`key={index}\`
- Never use random values like \`key={Math.random()}\``,
      },
      {
        question: '"Module not found" or import errors',
        answer: `Check these common causes:

1. **Wrong path**: Paths are case-sensitive!
   \`\`\`jsx
   // Wrong
   import { Header } from './components/header'
   
   // Correct
   import { Header } from './components/Header'
   \`\`\`

2. **Missing file extension** (sometimes needed):
   \`\`\`jsx
   import data from './data/portfolioData.js'
   \`\`\`

3. **Component not exported**:
   \`\`\`jsx
   // In Header.jsx, make sure you have:
   export const Header = () => { ... }
   // or
   export default Header
   \`\`\`

4. **Wrong import syntax**:
   \`\`\`jsx
   // Named export
   import { Header } from './Header'
   
   // Default export
   import Header from './Header'
   \`\`\``,
      },
      {
        question: '"JSX expressions must have one parent element"',
        answer: `JSX can only return ONE element. Wrap multiple elements in a parent:

**Wrong:**
\`\`\`jsx
return (
  <h1>Title</h1>
  <p>Description</p>
)
\`\`\`

**Correct (using div):**
\`\`\`jsx
return (
  <div>
    <h1>Title</h1>
    <p>Description</p>
  </div>
)
\`\`\`

**Correct (using Fragment - no extra DOM element):**
\`\`\`jsx
return (
  <>
    <h1>Title</h1>
    <p>Description</p>
  </>
)
\`\`\``,
      },
    ],
  },
  {
    category: "Styling Issues",
    items: [
      {
        question: "Tailwind classes aren't working",
        answer: `Common causes and fixes:

1. **Typo in class name**: Use Tailwind IntelliSense VS Code extension
   \`\`\`jsx
   // Wrong: bg-primary-500
   // Correct: bg-blue-500
   \`\`\`

2. **Class not included in build**: Some dynamic classes need safelist
   \`\`\`jsx
   // This won't work:
   <div className={\`bg-\${color}-500\`} />
   
   // Do this instead:
   const colorClasses = {
     red: 'bg-red-500',
     blue: 'bg-blue-500',
   }
   <div className={colorClasses[color]} />
   \`\`\`

3. **CSS specificity conflict**: Check for conflicting styles in App.css

4. **Dark mode not working**: Make sure you have \`dark:\` prefix
   \`\`\`jsx
   <div className="bg-white dark:bg-gray-800" />
   \`\`\``,
      },
      {
        question: "Layout is broken or elements are in wrong position",
        answer: `Debugging layout issues:

1. **Add border to see element boundaries**:
   \`\`\`jsx
   <div className="border-2 border-red-500">
     Content here
   </div>
   \`\`\`

2. **Check flex/grid properties**:
   \`\`\`jsx
   // Common flex patterns
   <div className="flex items-center justify-between">
   <div className="flex flex-col gap-4">
   
   // Common grid patterns
   <div className="grid grid-cols-3 gap-6">
   \`\`\`

3. **Use browser DevTools**:
   - Right-click → Inspect
   - Hover over elements to see their boxes
   - Check the Computed styles tab`,
      },
    ],
  },
  {
    category: "Deployment Issues",
    items: [
      {
        question: "Vercel deployment is failing",
        answer: `Check these common issues:

1. **Build errors**: Check the Vercel deployment logs
   - Click on the failed deployment
   - Look for error messages in the build output

2. **Wrong root directory**: Set it to \`apps/react\` in Vercel settings

3. **Environment variables**: Add them in Vercel dashboard
   - Settings → Environment Variables

4. **Node version**: Vercel uses Node 18 by default
   - Add \`"engines": { "node": "18.x" }\` to package.json if needed

5. **Case sensitivity**: File paths work differently on Linux (Vercel) vs Mac/Windows
   - \`Header.jsx\` ≠ \`header.jsx\` on Vercel`,
      },
      {
        question: "Site works locally but not on Vercel",
        answer: `Common differences between local and production:

1. **API calls**: Make sure URLs are correct for production
   - Use environment variables for API endpoints

2. **Missing dependencies**: Check if all deps are in package.json
   - Not in devDependencies if needed at runtime

3. **Browser APIs**: Some APIs work differently or not at all
   - localStorage, window, etc. - check for SSR compatibility

4. **Test production build locally**:
   \`\`\`bash
   npm run build
   npm run preview
   \`\`\``,
      },
    ],
  },
  {
    category: "Git Issues",
    items: [
      {
        question: '"Permission denied" when pushing to GitHub',
        answer: `Authentication setup needed:

1. **Set up SSH key** (recommended):
   \`\`\`bash
   ssh-keygen -t ed25519 -C "your@email.com"
   # Press enter for defaults
   cat ~/.ssh/id_ed25519.pub
   # Copy output and add to GitHub Settings → SSH Keys
   \`\`\`

2. **Or use HTTPS with token**:
   - GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate new token (classic)
   - Use token as password when pushing`,
      },
      {
        question: '"Your local changes would be overwritten"',
        answer: `Save your work before pulling:

**Option 1: Stash (save for later)**
\`\`\`bash
git stash
git pull
git stash pop
\`\`\`

**Option 2: Commit first**
\`\`\`bash
git add .
git commit -m "WIP: saving my changes"
git pull
\`\`\`

**Option 3: Discard local changes** (careful!)
\`\`\`bash
git checkout -- .
git pull
\`\`\``,
      },
    ],
  },
];

const TroubleshootingItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
          {item.question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono bg-transparent p-0 m-0">
              {item.answer}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const TroubleshootingCategory = ({ category, items }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-(--color-primary) transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
        {category}
        <span className="text-sm font-normal text-gray-500">
          ({items.length})
        </span>
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <TroubleshootingItem key={index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

// Missing icon import fix
const ChevronRight = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const Troubleshooting = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items based on search
  const filteredData = troubleshootingData
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for issues..."
            aria-label="Search troubleshooting issues"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-(--color-primary) focus:border-transparent outline-none transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 mb-8">
        {troubleshootingData.map((category) => (
          <a
            key={category.category}
            href={`#${category.category.toLowerCase().replace(/\s+/g, "-")}`}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-(--color-primary) hover:text-white transition-colors"
          >
            {category.category}
          </a>
        ))}
      </div>

      {/* Categories */}
      {filteredData.length > 0 ? (
        filteredData.map((category) => (
          <TroubleshootingCategory
            key={category.category}
            category={category.category}
            items={category.items}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No results found for "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-(--color-primary) hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Still stuck? */}
      <div className="mt-12 p-6 bg-linear-to-r from-(--color-primary)/10 to-(--color-secondary)/10 rounded-xl text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 inline-flex items-center gap-1.5">
          Still Stuck? <EmojiIcon emoji="🤔" className="w-5 h-5" />
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Don't worry! Debugging is a normal part of development.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://stackoverflow.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Search Stack Overflow
          </a>
          <a
            href="https://discord.gg/reactiflux"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
          >
            Ask on Discord
          </a>
        </div>
      </div>
    </div>
  );
};

export default Troubleshooting;
