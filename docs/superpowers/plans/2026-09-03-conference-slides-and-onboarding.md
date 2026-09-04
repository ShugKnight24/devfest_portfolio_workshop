# Multi-Deck Conference Slides & 3-Track Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the workshop application into a multi-deck conference presentation engine (Detroit LHM Summit Sept 19 & Michigan DevFest Nov 2026), incorporating Jack Reacher's critical deduction and overwhelming force narrative, fixing slide polling and movement, and deploying a 3-track onboarding guide with an Events Showcase.

**Architecture:** A centralized event data store (`eventsData.js`) and modular slide datasets (`lhmSlides.js`, `devfestSlides.js`, `prideSlides.js`) loaded dynamically by a unified presentation engine (`WorkshopSlides.jsx`) via React Router (`/slides/:deckId`). Slide polling is redesigned with a Dual-Mode (Presenter vs Interactive) model. The onboarding experience (`/guide`) integrates persona-targeted tracks (Students, Professionals, Makers) and an Events Showcase.

**Tech Stack:** React 19, React Router DOM v7, Tailwind CSS v4, Vitest, `@portfolio/icons`.

**Spec:** [`docs/superpowers/specs/2026-09-03-conference-slides-and-onboarding-design.md`](file:///Users/shugmishumunov/Desktop/devfest_portfolio_workshop/docs/superpowers/specs/2026-09-03-conference-slides-and-onboarding-design.md)

## Global Constraints
- Zero raw text emojis in UI — all icons must use `@portfolio/icons/react` or clean SVGs.
- Keyboard navigation (Arrow keys, Space, F, N, T, R, Home, End) must operate reliably without slide freezing.
- Slide polling must never auto-advance or freeze presentation flow.
- All tests must pass: `npm --prefix apps/react run test:run`.
- Production build must succeed: `npm --prefix apps/react run build`.

---

### Task 1: Speaking Events Data Model & Routing

**Files:**
- Create: `apps/react/src/data/eventsData.js`
- Create: `apps/react/src/data/eventsData.test.js`
- Modify: `apps/react/src/App.jsx:180-195`

**Interfaces:**
- Produces: `speakingEvents` array with `id`, `title`, `shortTitle`, `organization`, `date`, `badge`, `status`, `url`, `slideDeckRoute`, `topic`, `abstract`, `highlights`.
- Consumes: React Router DOM `Route`.

- [ ] **Step 1: Write test for `eventsData.js`**
- [ ] **Step 2: Implement `eventsData.js`**
- [ ] **Step 3: Update `App.jsx` with `/slides/:deckId` route**
- [ ] **Step 4: Run Vitest to verify**

---

### Task 2: Speaking Events Hub Component

**Files:**
- Create: `apps/react/src/components/SpeakingEventsHub.jsx`

**Interfaces:**
- Consumes: `speakingEvents` from `src/data/eventsData.js`.
- Produces: `<SpeakingEventsHub />` component featuring LHM Summit 2026, Michigan DevFest 2026, and Detroit Pride 2026 archive cards with official GDG Detroit links and slide launch buttons.

- [ ] **Step 1: Implement `SpeakingEventsHub.jsx` with responsive grid, verified badges, and action buttons**
- [ ] **Step 2: Add accessible labels and high-contrast styling**

---

### Task 3: Multi-Deck Slide Content (Reacher Narrative & DevFest)

**Files:**
- Create: `apps/react/src/data/slides/lhmSlides.js`
- Create: `apps/react/src/data/slides/devfestSlides.js`
- Create: `apps/react/src/data/slides/prideSlides.js`
- Create: `apps/react/src/data/slides/index.js`

**Interfaces:**
- Produces: `decks` registry mapping `lhm`, `devfest`, `pride` to slide datasets and metadata.
- Narrative elements: Reacher Sherlock Holmes deduction + strength of 3 men, "Reacher said nothing" context economics, folding toothbrush zero-bloat, Chainsaw Man / Reze explosive velocity, Beyond the Portfolio: Audience of One to Many.

- [ ] **Step 1: Create `lhmSlides.js` with Reacher × Chainsaw Man keynote slides**
- [ ] **Step 2: Create `devfestSlides.js` with AI Hackathon velocity & subagents**
- [ ] **Step 3: Create `prideSlides.js` with preserved classic talk**
- [ ] **Step 4: Create `index.js` barrel export and deck helper functions**

---

### Task 4: WorkshopSlides Engine & Interaction Overhaul

**Files:**
- Modify: `apps/react/src/pages/WorkshopSlides.jsx`

**Interfaces:**
- Consumes: `useParams()` from `react-router-dom`, `decks` registry from `src/data/slides/index.js`.
- Produces: Multi-deck presentation view with top deck switcher pill, Dual-Mode polling (Presenter prompt cards vs Interactive tips), smooth slide transitions without `startViewTransition` locks, Reacher easter egg clock, and presenter notes.

- [ ] **Step 1: Wire route parameter `deckId` and fallback to `lhm`**
- [ ] **Step 2: Add Top Deck Switcher dropdown in presentation header**
- [ ] **Step 3: Redesign `PollSlide` with Dual-Mode (Presenter discussion cards vs Interactive self-paced feedback)**
- [ ] **Step 4: Fix slide transitions and remove buggy `startViewTransition` locking**
- [ ] **Step 5: Add Reacher precision internal clock & presenter notes**

---

### Task 5: Three-Track Onboarding Experience (`/guide`)

**Files:**
- Modify: `apps/react/src/components/StarterInstructions.jsx`
- Modify: `apps/react/src/components/Instructions/InstructionSteps.jsx`

**Interfaces:**
- Consumes: `<SpeakingEventsHub />`, `speakingEvents`.
- Produces: Modern 3-track onboarding hub (Track 1: Students & Beginners; Track 2: Professional Devs & Architects; Track 3: Beyond the Portfolio Makers) with visual diagrams, code blocks, and real-world case studies.

- [ ] **Step 1: Embed `<SpeakingEventsHub />` at the top of `StarterInstructions.jsx`**
- [ ] **Step 2: Build track switcher tabs in `InstructionSteps.jsx`**
- [ ] **Step 3: Populate Student Track with visual component anatomy and quick-wins**
- [ ] **Step 4: Populate Professional Track with Reacher root-cause audit, context hierarchy, and subagent pipelines**
- [ ] **Step 5: Populate Maker Track with Audience of One to Many case studies (J. Simmons, Jacked Alien, Criminal Cookies)**

---

### Task 6: Verification, Build & Testing

- [ ] **Step 1: Run full test suite: `npm --prefix apps/react run test:run`**
- [ ] **Step 2: Run production build: `npm --prefix apps/react run build`**
- [ ] **Step 3: Test `/slides/lhm`, `/slides/devfest`, `/slides/pride`, and `/guide` routes on dev server**
