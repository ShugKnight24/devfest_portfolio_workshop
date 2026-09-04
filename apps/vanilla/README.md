# Vanilla Portfolio Starter

A clean, personal portfolio website built with **HTML, CSS, and JavaScript** — nothing else.

## Getting Started

1. Open `index.html` in your browser — that's it!

No `npm install`, no build step, no server required. It works offline via `file://` protocol.

> **Tip:** For auto-reloading during development, try the VS Code "Live Server" extension or run `python -m http.server` in this directory.

## What to Customize

| File | What's Inside |
|------|---------------|
| `data.js` | Your name, bio, skills, and projects — edit this first! |
| `style.css` | Colors, layout, and design — make it yours |
| `app.js` | Interactive behavior — theme switching, dark mode, rendering |
| `index.html` | Page structure — add or remove sections here |

## Features

- **5 color themes** — Light, Dark, Ocean, Forest, Sunset
- **Dark mode** — toggle with 🌙 button, saved to localStorage
- **Responsive** — looks great on phones, tablets, and desktops
- **Zero dependencies** — no frameworks, no build tools, no CDN
- **Works offline** — double-click `index.html` and go

## How It Works

1. `data.js` defines your portfolio content as a JavaScript object
2. `app.js` reads that data and injects HTML into the page
3. `style.css` makes it look good with CSS custom properties for theming

That's the entire architecture. Simple enough to understand, flexible enough to make it your own.

## Deploy

When you're ready to share your portfolio with the world:

1. Push this folder to a GitHub repository
2. Connect it to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or enable **GitHub Pages**
3. Set the root directory to this folder — done!
