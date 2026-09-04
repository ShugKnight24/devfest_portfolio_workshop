# DevFest Portfolio Workshop

## Stack

| Area | Stack |
|------|-------|
| React Starter | Vite 7.1 + React 19 + Tailwind CSS v4 + React Router DOM v7.9 |
| Vanilla Starter | HTML5 + CSS3 + Vanilla JavaScript (zero dependencies) |
| Testing | Vitest + @testing-library/react + happy-dom |
| Deployment | Vercel (SPA rewrite rules) |
| Analytics | Google Analytics + Vercel Analytics + Speed Insights |

## Commands

```bash
# React Starter
cd apps/react && npm run dev        # Dev server (port 3000)
cd apps/react && npm run build      # Production build
cd apps/react && npm run test       # Run tests (watch)
cd apps/react && npm run test:run   # Run tests (CI)
cd apps/react && npm run test:coverage  # Coverage report

# Vanilla Starter
# No build step — open apps/vanilla/index.html directly
```

## Verification

Every change must pass:
- `cd apps/react && npm run build` — clean production build
- `cd apps/react && npm run test:run` — all tests pass
- Vanilla starter loads in browser via file:// protocol

## Architecture

### React Starter
- **Provider tree**: ThemeProvider → ToastProvider → AchievementProvider → ChallengeProvider → QuizProvider → App
- **Routing**: React Router DOM with 15 routes (`/`, `/slides`, `/agentic-studio`, `/lessons`, `/builder`, `/showcase`, etc.)
- **Agentic Studio**: Interactive 4-tier audience workspace (Novice, Student, Pro Dev, Senior Architect) + Audience of One POC prompt generator
- **Component variant pattern**: Each section (Header, About, Skills, Projects, Footer) has a wrapper that selects from multiple visual variants
- **Data-driven**: Single `portfolioData.js` drives the entire UI
- **Theme engine**: 31 themes via CSS custom properties, persisted to localStorage
- **Icon system**: 57 SVG icons in `@portfolio/icons`, emoji→SVG mapping (57 entries)
- **Lesson tracks**: 5 tracks (React, Vanilla JS, Vue, Svelte, Agentic Dev) with interactive playgrounds
- **Config**: `layout.js` (variant selection), `themes.js` (color definitions)

### Vanilla Starter
- **Zero dependencies** — works by double-clicking index.html
- **In-page anchors** (#hero, #about, #skills, #projects, #contact)
- **Same data structure** as React version
- **Same 31 themes** via CSS custom properties
- **Same workshop content** — Parallel experience planned; currently a barebones starter with 5 themes

## Agentic Dev & Best Practices

### Context Engineering Hierarchy
1. **Level 1 (Persistent Rules)**: `.agents/AGENTS.md` / `CLAUDE.md` loaded on every turn
2. **Level 2 (Task Spec)**: `SPEC.md` for feature requirements and prop interfaces
3. **Level 3 (Filtered Source)**: Scoped ≤2-3 relevant files per iteration
4. **Level 4 (Automated Gates)**: Vitest + build verification outputs for self-correction

### Subagent Delegation (`cavecrew`)
- `cavecrew-investigator`: Locate symbols and line numbers without full file dumps
- `cavecrew-builder`: Surgical edits on ≤2 files
- `cavecrew-reviewer`: Audit diffs for regressions, security, and styling

### Token Economics (`caveman` + `cove`)
- Strip conversational filler, hedging, and unnecessary boilerplate
- Preserve full technical precision and error strings
- Extend context lifetime to 50+ turns without context rot

## Conventions

- Semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`)
- CSS custom properties for all theming
- No emojis in UI — use high-quality, relevant SVGs (`@portfolio/icons`)
- `const` by default, `let` only when reassign
- Arrow functions for component handlers
- Destructured props in React component signatures
- `?.` optional chaining, `??` nullish coalescing
- All interactive elements need unique IDs
- Preserve existing comments and docstrings

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Atomic commits, one logical change each
