/**
 * Variant 3: THE IRON PROTOCOL (The Bodybuilding Lens)
 *
 * Metaphor: You don't walk into the gym and squat 500lbs. You build
 * the mind-muscle connection. AI is the barbell. It provides massive leverage,
 * but you have to lift it, maintain form, and actively tear code down to build it stronger:
 * - Progressive Overload: AI is steroids for developers—without discipline, you get crushed.
 * - Form Check: Ego lifting (asking for an entire SaaS at once) vs. Isolation Sets (one rep at a time).
 * - Hypertrophy: Tear down code fibers; let AI prototype, break it, and refactor stronger.
 * - Never Skip Leg Day: Automated testing is non-negotiable.
 * - The True Scale: Dirty bulk (monorepo bloat) vs. sovereign forensic auditing.
 *
 * 60-Minute Masterclass Flow:
 * - The Warmup (Progressive Overload)
 * - Form Check (Ego Lifting vs. Isolation Sets)
 * - Hypertrophy (Tear it Down / Never Skip Leg Day)
 * - The Mirror vs The Scale (The Dirty Bulk vs. The True Scale)
 * - The Platform (Your Set. Your Rules.)
 */

export const ironDeckMeta = {
  id: "iron",
  title: "The Iron Protocol // Bodybuilding Lens",
  subtitle: "Progressive Overload, Form Check & Cognitive Hypertrophy",
  conference: "60-Min Masterclass",
  organization: "Google GDG & Tech Keynote",
  date: "2026",
  duration: "60 min",
  accent: "#d32f2f",
  accentAlt: "#ffb300",
  variant: "iron",
};

export const ironPresenterNotes = {
  0: "NOTES: Welcome them to the gym. Code is a commodity. AI is steroids for developers—it gives leverage, but without discipline, you get crushed. [Press N to toggle notes]",
  1: "NOTES: 'Ego Lifting' with AI always fails. Show them how to isolate the component. Do one rep (schema), verify it, then do the next rep (routes). Maintain the Mind-Muscle connection with your architecture.",
  2: "NOTES: Hypertrophy. Don't be afraid to delete the code the AI gives you. If it wrote it in 10 seconds, you can afford to throw it away and demand a stronger architectural foundation.",
  3: "NOTES: If you are doing the reps, you need a scale that doesn't lie. Agentic bots ruin telemetry. Sovereign forensic auditing isolates true human traffic.",
  4: "NOTES: The Fire. The gym is open. The tools are free. Challenge them to go lift the weight and build their dreams.",
};

export const ironSlides = [
  {
    id: "iron-01",
    type: "statement",
    phase: "The Warmup",
    title: "Progressive\nOverload.",
    description:
      "In the age of AI, the machine does the heavy lifting, but YOU are the spotter. Code is irrelevant now. The bottleneck is your discipline, your curation, and your form.",
    notes: ironPresenterNotes[0],
  },
  {
    id: "iron-02",
    type: "comparison",
    phase: "Form Check",
    title: "Form Check",
    description:
      "Isolate the movement. Don't let AI ego-lifting crush your architecture.",
    columns: [
      {
        tag: "Bad Form: Ego Lifting",
        type: "bad",
        content:
          '"Build me a full SaaS platform like Uber. Write the backend, frontend, and DB all at once."',
        result: "-> Result: You get crushed by code you can't debug.",
      },
      {
        tag: "Good Form: Isolation Sets",
        type: "good",
        content:
          '"Step 1: Design the DB schema for auth. Wait for approval.\nStep 2: Write the API route. Spot me on the form."',
        result: "-> Result: Flawless execution. Sovereign control over every invariant.",
      },
    ],
    notes: ironPresenterNotes[1],
  },
  {
    id: "iron-03",
    type: "statement",
    phase: "Hypertrophy",
    title: "Tear it\nDown.",
    description:
      "Muscle grows by tearing fibers. Codebases evolve the same way. You build great apps by letting AI write the prototype, actively breaking it, and forcing it to refactor stronger. Never skip leg day (Automated Testing).",
    notes: ironPresenterNotes[2],
  },
  {
    id: "iron-04",
    type: "comparison",
    phase: "The Mirror vs The Scale",
    title: "The Mirror vs The Scale",
    description:
      "Mirrors lie. Generative AI inflates metrics. You need a scale that doesn't compromise.",
    columns: [
      {
        tag: "The Dirty Bulk",
        type: "bad",
        content:
          "Generating massive monorepos. Bloated metrics from bot traffic. Looking massive on paper, but zero actual strength.",
        result: "-> Result: Fragile bundle bloat that collapses under true strain.",
      },
      {
        tag: "The True Scale",
        type: "good",
        content:
          "Generative AI inflates vanity metrics. Sovereign forensic auditing is the scale that proves your actual proof of work. Question everything.",
        result: "-> Result: Cold, unyielding truth of sovereign performance.",
      },
    ],
    notes: ironPresenterNotes[3],
  },
  {
    id: "iron-05",
    type: "statement",
    phase: "The Platform",
    title: "Your Set.\nYour Rules.",
    description:
      "The weights are free. Don't wait for a legacy tech company to hand you a routine. Pursue your dreams with the absolute fire and discipline they deserve.",
    signature:
      "github.com/shugknight24\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: ironPresenterNotes[4],
    center: true,
  },
];
