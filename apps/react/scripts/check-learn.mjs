// Validate every /learn lesson: shape, unique ids, links, markdown, and that the code actually runs.
//   - every runnable ~~~js / ~~~ts block and predict snippet runs without an error
//   - every task's solution passes all its tests, and its starter fails at least one
//   - every multiple-choice answer index points at a real choice
// Usage: node scripts/check-learn.mjs [--track js] [--lesson map] [--no-py]
// Python runs in Pyodide, a devDependency pinned to the version the browser worker loads
// (engine/py.worker.js). Lessons that list packages fetch those wheels on first run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "sucrase";
import { Worker } from "node:worker_threads";
import { mdBlocks } from "../src/learn/engine/markdown.js";
import { PY_HARNESS } from "../src/learn/engine/pyHarness.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/learn/content");
const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const onlyTrack = arg("--track");
const onlyLesson = arg("--lesson");

// content/index.js uses import.meta.glob (Vite only), so read the track list from its source text
const indexSrc = fs.readFileSync(path.join(root, "index.js"), "utf8");
const trackLang = Object.fromEntries([...indexSrc.matchAll(/id: "(\w+)",\s*title: "[^"]*",\s*lang: (null|"\w+")/g)].map((m) => [m[1], m[2] === "null" ? null : m[2].slice(1, -1)]));

let errors = 0;
let warnings = 0;
const fail = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };
const warn = (where, msg) => { warnings++; console.log(`  ! ${where}: ${msg}`); };
process.on("unhandledRejection", (e) => console.log(`  ! late unhandled rejection (${e?.message || e}), not a test result`));

const toJs = (code) => transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;

// Each JS run gets its own worker thread so a starter with an infinite loop can be killed, like in the browser.
const RUNNER = new URL("../src/learn/engine/runDrill.js", import.meta.url).href;
const WORKER_SRC = `
  const { parentPort, workerData } = require("node:worker_threads");
  import(workerData.runner).then(async ({ runDrill }) => parentPort.postMessage(await runDrill(workerData.code, workerData.tests, 4000)));
`;
function runJs(lang, code, tests) {
  let src = code;
  try {
    if (lang === "ts") {
      src = toJs(code);
      tests = tests.map((t) => ({ ...t, code: toJs(t.code) }));
    }
  } catch (e) {
    return Promise.resolve({ results: [{ name: "compile", pass: false, error: e.message }], logs: [] });
  }
  return new Promise((resolve) => {
    const w = new Worker(WORKER_SRC, { eval: true, workerData: { runner: RUNNER, code: src, tests } });
    const kill = setTimeout(() => {
      w.terminate();
      resolve({ results: [{ name: "Whole run", pass: false, error: "Stopped after 10s (infinite loop?)" }], logs: [] });
    }, 10000);
    w.once("message", (m) => { clearTimeout(kill); w.terminate(); resolve(m); });
    w.once("error", (e) => { clearTimeout(kill); resolve({ results: [{ name: "Syntax / load error", pass: false, error: e.message }], logs: [] }); });
  });
}

let py = null;
let pyMissing = process.argv.includes("--no-py");
async function runPy(code, tests, packages) {
  if (pyMissing) return null;
  if (!py) {
    try {
      const mod = await import("pyodide");
      const loadPyodide = mod.loadPyodide ?? mod.default?.loadPyodide;
      py = await loadPyodide();
      py.runPython(PY_HARNESS);
    } catch (e) {
      pyMissing = true;
      warn("python", `Pyodide failed to load, Python code not run. Run pnpm install. (${e.message.split("\n")[0]})`);
      return null;
    }
  }
  if (packages?.length) await py.globals.get("ensure_packages")(py.toPy(packages), (names) => py.loadPackage(names.toJs()));
  const res = await py.globals.get("run_tests")(code, py.toPy(tests));
  const out = res.toJs({ dict_converter: Object.fromEntries });
  res.destroy();
  return out;
}

const run = (lang, code, tests, packages) => (lang === "py" ? runPy(code, tests, packages) : runJs(lang, code, tests));
const RUNNABLE = new Set(["js", "ts", "py"]);
const STEP_TYPES = new Set(["read", "predict", "task", "check"]);

const tracks = fs.readdirSync(root).filter((d) => fs.statSync(path.join(root, d)).isDirectory());
const lessons = [];
for (const track of tracks) {
  if (!(track in trackLang)) { fail(track, "folder has no entry in TRACKS (content/index.js)"); continue; }
  for (const file of fs.readdirSync(path.join(root, track)).filter((f) => f.endsWith(".js")).sort()) {
    if (!/^\d\d-[a-z0-9-]+\.js$/.test(file)) fail(`${track}/${file}`, "file name should be NN-slug.js");
    try {
      const mod = await import(pathToFileURL(path.join(root, track, file)).href);
      lessons.push({ ...mod.default, track, file });
    } catch (e) {
      fail(`${track}/${file}`, `failed to load: ${e.message}`);
    }
  }
}

const keys = new Set();
for (const l of lessons) {
  const k = `${l.track}/${l.id}`;
  if (keys.has(k)) fail(k, "duplicate lesson id in track");
  keys.add(k);
}

for (const l of lessons) {
  if (onlyTrack && l.track !== onlyTrack) continue;
  if (onlyLesson && l.id !== onlyLesson) continue;
  const where = `${l.track}/${l.file}`;
  const lang = l.lang !== undefined ? l.lang : trackLang[l.track];
  for (const f of ["id", "title", "goal", "minutes", "steps"]) if (l[f] == null || l[f] === "") fail(where, `missing "${f}"`);
  if (!Array.isArray(l.steps) || !l.steps.length) continue;
  for (const b of l.builds || []) if (!keys.has(b)) fail(where, `builds on unknown lesson "${b}"`);

  const checkMd = async (src, label) => {
    let blocks;
    try { blocks = mdBlocks(src); } catch (e) { return fail(where, `${label} markdown error: ${e.message}`); }
    for (const b of blocks) {
      if (b.type !== "code" || !RUNNABLE.has(b.lang)) continue;
      const r = await run(b.lang, b.code, [{ name: "output", code: "" }], l.packages);
      if (r && !r.results[0].pass) fail(where, `${label}: ~~~${b.lang} block errors: ${r.results[0].error}\n      ${b.code.split("\n")[0]}`);
    }
  };

  for (const [i, s] of l.steps.entries()) {
    const at = `step ${i + 1} (${s.type})`;
    if (!STEP_TYPES.has(s.type)) { fail(where, `${at}: unknown type`); continue; }
    if (!s.title) fail(where, `${at}: missing title`);
    if (s.md) await checkMd(s.md, at);
    if (s.type === "read" && !s.md) fail(where, `${at}: missing md`);
    if (s.type === "predict") {
      if (!s.code || !s.explain) fail(where, `${at}: needs code + explain`);
      await checkMd(s.explain || "", `${at} explain`);
      if (!lang && !s.output) fail(where, `${at}: predict with nothing to run needs "output"`);
      if (lang && s.code) {
        const r = await run(lang, s.code, [{ name: "output", code: "" }], l.packages);
        if (r && s.throws && r.results[0].pass) fail(where, `${at}: marked throws but runs cleanly`);
        if (r && !r.results[0].pass && !s.throws) fail(where, `${at}: code errors (set throws: true if that's the point): ${r.results[0].error}`);
        if (r && !r.logs.length && r.results[0].pass) warn(where, `${at}: predict code prints nothing`);
        // a written-down expected output must match what the code really prints
        if (r && s.output != null && !s.throws && r.logs.join("\n").trim() !== String(s.output).trim())
          fail(where, `${at}: output says\n        ${String(s.output).trim().replace(/\n/g, "\n        ")}\n      but the code prints\n        ${r.logs.join("\n").trim().replace(/\n/g, "\n        ")}`);
      }
    }
    if (s.type === "task") {
      for (const f of ["md", "starter", "tests", "hint", "solution"]) if (s[f] == null) fail(where, `${at}: missing "${f}"`);
      if (!lang) { fail(where, `${at}: task in a track with nothing to run`); continue; }
      if (!Array.isArray(s.tests) || !s.tests.length) continue;
      await checkMd(s.hint || "", `${at} hint`);
      const good = await run(lang, s.solution, s.tests, l.packages);
      if (good) for (const r of good.results) if (!r.pass) fail(where, `${at}: solution fails "${r.name}": ${r.error}`);
      const bad = await run(lang, s.starter, s.tests, l.packages);
      if (bad && bad.results.every((r) => r.pass)) fail(where, `${at}: starter already passes every test`);
    }
    if (s.type === "check") {
      if (!Array.isArray(s.items) || !s.items.length) { fail(where, `${at}: needs items`); continue; }
      for (const [k, it] of s.items.entries()) {
        if (!it.q) fail(where, `${at} item ${k + 1}: missing q`);
        if (it.choices) {
          if (typeof it.answer !== "number" || it.answer < 0 || it.answer >= it.choices.length) fail(where, `${at} item ${k + 1}: answer index out of range`);
          if (!it.explain) fail(where, `${at} item ${k + 1}: missing explain`);
          if (new Set(it.choices).size !== it.choices.length) fail(where, `${at} item ${k + 1}: duplicate choices`);
        } else if (!it.a) fail(where, `${at} item ${k + 1}: needs choices+answer or a`);
      }
    }
  }
}

const counted = lessons.filter((l) => (!onlyTrack || l.track === onlyTrack) && (!onlyLesson || l.id === onlyLesson));
console.log(`\n${counted.length} lessons checked across ${new Set(counted.map((l) => l.track)).size} tracks: ${errors} errors, ${warnings} warnings.`);
process.exit(errors ? 1 : 0);
