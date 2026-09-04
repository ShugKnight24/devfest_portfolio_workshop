# Multi-Deck Keynote Engine, Speaking Events Hub & 3-Track Onboarding Specification

**Date**: September 3, 2026  
**Target Conferences**:
1. **Detroit Latin Heritage Month (LHM) Innovation Summit** — September 19, 2026 (Google GDG Detroit)
2. **Michigan DevFest & AI Hackathon 2026** — November 2026 (Google GDG Detroit)
3. **Detroit Pride Summit 2026** — Archive Keynote

---

## 1. Executive Summary & Core Mission

This specification defines the evolution of the DevFest Portfolio Workshop from a single static portfolio builder into an **Agentic Software Creation Engine**.

### Core Shift: "Beyond the Portfolio"
Rather than merely styling a digital resume, attendees learn to build bespoke, sovereign software tools that solve their own acute personal and professional problems ("Audience of One"), and package those solutions so that other people and developers can use and build upon them ("Audience of Many").

### Narrative Fusion: The Reacher Protocol × Chainsaw Man
- **Jack Reacher (Sherlock Holmes Intellect + Strength of 3 Men)**:
  - *Deductive Intellect*: Noticing tiny details, investigating root causes, demanding proof over assumptions ("In an investigation, details matter"; "I don't mind the questions, I mind the lies").
  - *Overwhelming Focused Force*: 6'5", 250 lbs of focused leverage to demolish roadblocks without hesitation ("Hit first, hit hard").
  - *Zero Luggage / Zero Bloat*: Carrying only a folding toothbrush and an expired passport. In software: zero unnecessary npm bloat, clean modular architecture.
  - *"Reacher Said Nothing"*: The foundation of context economics (`caveman` mode). Cut pleasantries, filler, and repetitive chatter to keep agent context laser-focused.
- **Chainsaw Man / Reze**:
  - High-velocity explosive execution, breaking traditional development bottlenecks to code at the speed of thought.

---

## 2. Architecture & Data Model

### 2.1 Speaking Events Module (`apps/react/src/data/eventsData.js`)
Structured dataset driving the Events Showcase on the landing page, guide, and slide selectors:
- **LHM Summit 2026**:
  - `id`: `lhm-2026`
  - `title`: `Detroit Latin Heritage Month Innovation Summit`
  - `date`: `September 19, 2026`
  - `organization`: `Google GDG Detroit`
  - `url`: `https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/`
  - `slideRoute`: `/slides/lhm`
  - `theme`: `The Reacher Protocol: Critical Deduction & Overwhelming Force in Agentic Dev`
- **Michigan DevFest 2026**:
  - `id`: `devfest-2026`
  - `title`: `Michigan DevFest & AI Hackathon 2026`
  - `date`: `November 2026`
  - `organization`: `Google GDG Detroit`
  - `url`: `https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/`
  - `slideRoute`: `/slides/devfest`
  - `theme`: `Hackathon Velocity: From Audience of One to Sovereign Software`
- **Detroit Pride 2026**:
  - `id`: `pride-2026`
  - `title`: `Detroit Pride Summit 2026 (Archive)`
  - `date`: `June 2026`
  - `slideRoute`: `/slides/pride`
  - `theme`: `The REZE_BOMB System: Speed of Thought Portfolio`

### 2.2 Routing Strategy (`App.jsx`)
- `/slides`: Keynote presentation entry point, automatically rendering the active/upcoming deck (LHM Summit) with a top Deck Switcher.
- `/slides/:deckId`: Direct permalinks (`/slides/lhm`, `/slides/devfest`, `/slides/pride`).
- `/guide`: The revamped 3-track onboarding guide + Events Hub.

---

## 3. Keynote Presentation Engine (`WorkshopSlides.jsx`)

### 3.1 Multi-Deck Structure
- **LHM Keynote (`/slides/lhm`)**:
  - Slide 1: Title — *The Reacher Protocol: Critical Deduction & Overwhelming Force in Agentic Dev* (featuring Chainsaw Man velocity).
  - Slide 2: The Reacher Principle — *Deduction of Sherlock Holmes + Physical Force of 3 Men*.
  - Slide 3: Audience Pulse (Dual Mode) — Identifying who is here (students, pros, builders).
  - Slide 4: "Reacher Said Nothing" — Token Economics & Context Engineering Hierarchy.
  - Slide 5: "In an Investigation, Details Matter" — Prompting as Root-Cause Deduction.
  - Slide 6: "Travel Light" — Zero-bloat architecture (no 50-library dependency chains).
  - Slide 7: "Beyond the Portfolio" — Moving from passive resume sites to bespoke personal tools that solve your own pain points.
  - Slide 8: Real Shipping Proof — Case studies: J. Simmons Productions, Jacked Alien, Criminal Cookies.
  - Slide 9: "Hope for the Best, Plan for the Worst" — Automated Verification Gates (Vitest + Build checks).
  - Slide 10: The Challenge — Building a tool for an Audience of One and packaging it for an Audience of Many.
- **DevFest Keynote (`/slides/devfest`)**:
  - Focuses on hackathon velocity, subagent orchestration (`cavecrew` investigator, builder, reviewer), state machines, and real-time deployment.
- **Pride Archive Keynote (`/slides/pride`)**:
  - Preserved original deck with Steve Ballmer opener, component assembly, and the Skeptic Protocol.

### 3.2 Interaction & Movement Fixes
- **Removal of View Transition Freezes**: Replace unstable `document.startViewTransition` with rock-solid, fluid CSS transitions that never block or drop slide state.
- **Dual Mode Polling**:
  - **Presenter View**: Static prompt cards with highlighted discussion points and show-of-hands cues. Zero fake click counters; zero timer auto-advancing.
  - **Interactive View**: Self-paced attendees can tap options to toggle personalized tips and learning tracks without the slide auto-skipping.
- **Presentation Controls**:
  - Keyboard: `ArrowLeft`/`ArrowRight`, `Space`, `F` (fullscreen), `N` (presenter notes with Reacher quotes & timing cues), `T` (timer pause), `R` (timer reset), `Home`/`End` (jump to start/finish).
  - Touch/Swipe: Reliable directional touch detection.
  - Top Deck Switcher: Dropdown/pill menu allowing instant switching between LHM, DevFest, and Pride decks.
  - Reacher Easter Egg: A clean status bar indicator showing Reacher's internal clock precision down to the second.

---

## 4. Speaking Events Hub & 3-Track Onboarding Experience (`/guide`)

### 4.1 Speaking Events Hub Component
Integrated at the top of `/guide` and accessible via navigation:
- Visual event cards for **LHM Summit 2026** and **Michigan DevFest 2026**.
- Verified badge, organization logo/link, date, session title, and direct CTA buttons:
  - `View Official GDG Event` (external link).
  - `Launch Keynote Slides` (internal route `/slides/:deckId`).

### 4.2 Three-Track Onboarding Architecture
1. **Track 1: Students & Aspiring Developers ("The Quick-Start Engine")**
   - Step-by-step visual onboarding (Node/git verification, cloning, npm install).
   - Visual component anatomy diagram: HTML Skeleton → Tailwind Styles → React State Logic.
   - Immediate milestone: Update `portfolioData.js` and see instantaneous live reload.
2. **Track 2: Professional Devs & Architects ("The Reacher Audit Track")**
   - Sherlock Holmes-level root cause deduction: auditing the compiler, preventing hallucinated mutations.
   - Context Engineering Hierarchy: Level 1 (Persistent `AGENTS.md`) → Level 2 (Task `SPEC.md`) → Level 3 (Scoped Files) → Level 4 (Automated Gates).
   - Subagent pipelines (`cavecrew` investigator, builder, reviewer).
3. **Track 3: Beyond the Portfolio ("The Bespoke Software Maker")**
   - The philosophy of the "Audience of One": building sovereign tools to eliminate personal frictions.
   - Real-world production examples:
     - *J. Simmons Productions*: Dynamic media delivery modules.
     - *Jacked Alien*: Zero-bloat fitness state machines.
     - *Criminal Cookies*: Localized high-frequency checkout engine.
   - Roadmap for packaging, documenting, and open-sourcing bespoke tools so others can build upon them.

---

## 5. Verification & Acceptance Criteria

1. **Test Coverage**:
   - `npm --prefix apps/react run test:run`: All 45+ unit tests pass without regressions.
2. **Production Build**:
   - `npm --prefix apps/react run build`: Clean production bundle with zero syntax errors.
3. **Slide Navigation**:
   - Seamless slide navigation forward and backward across all 3 decks (`/slides`, `/slides/lhm`, `/slides/devfest`, `/slides/pride`).
   - Zero freezes or auto-advancing interruptions on poll slides.
4. **Interactive Controls**:
   - Deck switcher allows instant navigation between keynotes.
   - Presenter mode and Interactive mode switch seamlessly.
   - Fullscreen and presenter notes toggle cleanly.
5. **Onboarding & Events**:
   - `/guide` displays official GDG Detroit event links with accurate metadata and dates.
   - Persona tabs toggle smoothly between Students, Professionals, and Makers.
