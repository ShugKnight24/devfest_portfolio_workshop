# Interactive Portfolio Builder Workshop - Vanilla JS Starter

Welcome to the Portfolio Builder workshop! This is the **Vanilla HTML/CSS/JS** starter. It provides a zero-dependency, zero-build environment to build a beautiful, professional, and responsive portfolio website.

## Why Vanilla?

- **Zero configuration**: No Node.js, `npm`, or bundlers required.
- **Instant preview**: Open `index.html` directly in your browser and see changes instantly by refreshing the page.
- **Teaches core concepts**: Learn DOM manipulation, custom CSS variables, theme engines, and template literals—the building blocks that modern frameworks like React are built on!

## Getting Started

### Prerequisites

All you need is:
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A code editor (VS Code, Cursor, etc.)

### Launching the App

1. Clone or download this repository.
2. Navigate to the `vanilla_starter` folder.
3. **Double-click `index.html`** to open it in your browser. 
   - *Optionally*, if you prefer a live-reloading dev server, you can run a local server in the `vanilla_starter` directory:
     - VS Code: Install the **Live Server** extension.
     - Terminal: Run `npx serve` or `python -m http.server 8000`.

---

## Workshop Roadmap (REZE_BOMB System)

Open the starter dashboard in your browser and follow the interactive slide deck steps. Here is a summary of what you will do:

### 1. The Ballmer Remix: Customize Data
Open `data.js` and edit the `portfolioData` object with your own information, skills, and project list. 

### 2. App Assembly: Uncomment the Blocks
Open `index.html` and `app.js` side by side.
1. **Uncomment the root components** in `index.html` (e.g. `<!-- <div id="header-root"></div> -->`).
2. **Uncomment the render function calls** at the top of `app.js` (inside the `DOMContentLoaded` event handler).
3. Refresh your browser to see your elements render!

### 3. Deploy to Staging
When you are ready to deploy:
1. Create a new GitHub repository and push your folder.
2. Link the repository to [Vercel](https://vercel.com/) or GitHub Pages.
3. Make sure to set the **Root Directory** of your deployment to `vanilla_starter` in the hosting provider dashboard!
