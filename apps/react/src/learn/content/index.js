// The /learn curriculum. Each track is a folder of lesson files named NN-slug.js, loaded in filename order.
//
// Lesson shape (default export):
//   { id, title, goal, minutes, lang?, packages?, builds?: ["track/lesson", ...], steps: [...] }
//   lang defaults to the track's lang: "js" | "ts" | "py" | null (null = nothing to run, e.g. git, design)
//   builds lists earlier lessons this one leans on; the lesson page links back to them.
//
// Step shapes:
//   { type: "read", title, md }                      ~~~js / ~~~ts / ~~~py blocks get Run and Edit buttons
//   { type: "predict", title, md?, code, explain }   guess the output, then run it
//   { type: "task", title, md, starter, tests: [{ name, code }], hint, solution, explain? }
//   { type: "check", title, md?, items: [{ q, choices, answer, explain, why?: { [choiceIndex]: md } }
//                                     | { q, a }] }  (q + a with no choices = a reveal card)
//
// Tests run with the learner's code in scope plus helpers: eq(actual, expected), assert(cond, msg),
// throws(fn), rejects(promiseOrFn), sleep(ms), console. Python tests get eq() and Client (FastAPI).

export const TRACKS = [
  {
    id: "js",
    title: "JavaScript foundations",
    lang: "js",
    stage: "Foundations",
    blurb: "Values, functions, arrays, objects, then map, filter and reduce. Everything else on this page builds on it.",
  },
  {
    id: "ts",
    title: "TypeScript",
    lang: "ts",
    stage: "Full-stack JavaScript",
    needs: ["js"],
    blurb: "The same JavaScript with types: annotations, unions and narrowing, generics, and typing real data.",
  },
  {
    id: "node",
    title: "Node.js and APIs",
    lang: "js",
    stage: "Full-stack JavaScript",
    needs: ["js", "ts"],
    blurb: "JavaScript on the server: modules, the event loop, async I/O, HTTP handlers, middleware and REST.",
  },
  {
    id: "dsa",
    title: "Data structures and algorithms",
    lang: "js",
    stage: "Problem solving",
    needs: ["js"],
    blurb: "Big-O, hash maps and sets, stacks and queues, recursion, trees, graphs, binary search, sorting, dynamic programming.",
  },
  {
    id: "challenges",
    title: "Challenge problems",
    lang: "js",
    stage: "Problem solving",
    needs: ["dsa"],
    blurb: "Interview-shaped problems that combine what came before, each with a plan, a hint and a full walkthrough.",
  },
  {
    id: "design",
    title: "System design",
    lang: null,
    stage: "Building systems",
    needs: ["node"],
    blurb: "From one server to many: caching, queues, databases, and a calm five-step script for design interviews.",
  },
  {
    id: "git",
    title: "Git and collaboration",
    lang: null,
    stage: "Building systems",
    blurb: "Commits, branches, merging and rebasing, resolving conflicts, pull requests, and undoing mistakes safely.",
  },
  {
    id: "python",
    title: "Python",
    lang: "py",
    stage: "Second language",
    needs: ["js"],
    blurb: "The JavaScript foundations again in Python, side by side, so the second language costs half the effort.",
  },
];

export const STAGES = ["Foundations", "Full-stack JavaScript", "Problem solving", "Building systems", "Second language"];

const modules = import.meta.glob("./*/*.js", { eager: true });

export const LESSONS = {};
for (const t of TRACKS) LESSONS[t.id] = [];
for (const [path, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  const [, track] = path.split("/");
  if (!LESSONS[track]) continue;
  LESSONS[track].push({ ...mod.default, track });
}

export const trackById = (id) => TRACKS.find((t) => t.id === id);
export const lessonKey = (l) => `${l.track}/${l.id}`;
export const lessonLang = (l) => (l.lang !== undefined ? l.lang : trackById(l.track)?.lang ?? null);
export const findLesson = (track, id) => (LESSONS[track] || []).find((l) => l.id === id);
export const findByKey = (key) => {
  const [track, id] = key.split("/");
  return findLesson(track, id);
};
