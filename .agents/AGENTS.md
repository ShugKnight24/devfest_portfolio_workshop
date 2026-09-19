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
- **Routing**: React Router DOM. Every route is declared ONCE in `src/config/navigation.js` — never hardcode a nav list in a component.
- **Navigation shell**: mode-based. `stage` / `workshop` / `explore` (see `MODES`). The bar renders only `primaryRoutesForMode(mode)` plus one "More" group; `Cmd+K` (`CommandPalette.jsx`) reaches everything. Mode lives in `ShellContext` and persists to `localStorage.shell_mode`.
- **Agentic Studio**: Interactive 4-tier audience workspace (Novice, Student, Pro Dev, Senior Architect) + Audience of One POC prompt generator
- **Component variant pattern**: Each section (Header, About, Skills, Projects, Footer) has a wrapper that selects from multiple visual variants
- **Data-driven**: Single `portfolioData.js` drives the entire UI
- **Theme engine**: 31 themes via CSS custom properties, persisted to localStorage
- **Icon system**: 57 SVG icons in `@portfolio/icons`, emoji→SVG mapping (57 entries)
- **Lesson tracks**: 5 tracks (React, Vanilla JS, Vue, Svelte, Agentic Dev) with interactive playgrounds
- **Config**: `layout.js` (variant selection), `themes.js` (color definitions), `navigation.js` (route registry + modes)

### Elastic Slide Decks — read before touching any deck

Length is a VIEW over one deck, never a separate deck. `src/data/slides/runtime.js` owns this.

- Every slide declares a `tier`: `CORE` (1) → `EXTENDED` (2) → `DEEP` (3) → `LAB` (4).
- A `runtime` picks a max tier: `lightning` 30m / `keynote` 40m / `standard` 60m / `workshopShort` 90m
  / `workshopFull` 3h. `keynote` is not the longest cut — it is concept-only, filtered by `altitude`.
- `selectSlides(slides, { runtime, openZones, dropped })` returns what actually presents.
- **Flex zones**: a slide with `flex: true` + `zone` sits in a named zone the speaker opens mid-talk
  (`Z` on stage). Built for the live-build beat, where you need standing room for an unknown number
  of minutes while an agent works. A flex slide with a `tier` also auto-includes at that runtime.
- `budget` (seconds) drives the presenter HUD's pacing drift. Set it when a slide's length is atypical.

Two decks are live: `combined` (the talk you give — "Pull the Cord. Bring Backup.") and `devfest`
(the workshop). `lhm-spine` is the original spine, now shelved and folded into `combined`.
The other seven are `shelf: true` source material — reachable, grouped below the fold, each with a
`shelfReason`. Use `getLiveDecks()` / `getShelvedDecks()`.

**Adding a slide**: give it an `id`, a `type` registered in `SlideComponents`, a `tier`, an `altitude`
(or a `labTrack` for labs), and an entry in that deck's `presenterNotes`. Tests assert all of those —
decks get given live, and an untagged slide silently vanishes from the keynote. Adding a slide also
moves every runtime's clock: `runtime.test.js` holds each one to its advertised length, so budget the
new slide against the headroom rather than assuming there is some.

**Slide imagery**: files live in `apps/react/public/assets/images/`, referenced as
`/assets/images/<file>`. Convert phone photos out of HEIC first — Chrome will not render it. A test
walks every live deck and fails on a path that is not on disk, because a dead image only shows up on
the projector.

### Stage design tokens

`src/styles/stage.css` is the single source for presentation visuals. The slide root carries
`class="stage"` + `data-stage-mode="protocol|reze"`, so the **Reze Override is one attribute flip**,
not a per-element ternary. Never reintroduce hardcoded hex in a slide renderer — use
`--stage-accent`, `--stage-accent-alt`, `--stage-surface`, `--stage-text-muted`, the `--stage-fs-*`
projector type ramp, and the `.stage-*` component classes.

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

### Skills

Vendored under `.agents/skills/` (synced from `~/.agents/skills`). Beyond the caveman/cove/cavecrew
family: `design-system`, `tailwind-design-system`, `frontend-design`, `ui-styling`, `brand`,
`creating-svg-illustrations`, `improve-animations`, `accessibility`, `best-practices`, `performance`,
`core-web-vitals`, `seo`, `slides`, `requesting-code-review`, `code-review`, `vitest`.

This repo is a talk before it is an app, so the speaking skills are vendored too: `tech-talk-outline`
(turn an accepted abstract into a rehearsable outline), `public-speaking` (delivery, storytelling,
stage presence), `conference-cfp-submission` (the next CFP), and `copywriting` (slide and page copy
that has to persuade in one read).

Workflow skills pair with a cavecrew agent (see the table in `.agents/skills/cavecrew/SKILL.md`):
`investigate-first` (cause unknown), `surgical-patch` (known bug, narrow fix), `safe-refactor`
(move code, behavior fixed), `lean-build` (new behavior, overbuilding risk), `verify-and-stop`
(claimed done, need proof).

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
