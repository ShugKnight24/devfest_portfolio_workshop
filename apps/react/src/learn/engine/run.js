// One entry point for running learner code: runCode() for "show me the output",
// runTests() for graded tasks. JS/TS get a fresh worker per run (cheap, and a stuck loop
// is killed with it). Python keeps one warm worker because Pyodide takes seconds to boot.

const JS_LIMIT_MS = 10000;

function runJs(code, tests, ts) {
  return new Promise((resolve) => {
    const w = new Worker(new URL("./js.worker.js", import.meta.url), { type: "module" });
    const kill = setTimeout(() => {
      w.terminate();
      resolve({ results: [{ name: "Whole run", pass: false, error: "Stopped after 10s. Infinite loop or a promise that never settles?" }], logs: [] });
    }, JS_LIMIT_MS);
    w.onmessage = (e) => { clearTimeout(kill); w.terminate(); resolve(e.data); };
    w.onerror = (e) => {
      e.preventDefault();
      clearTimeout(kill);
      w.terminate();
      resolve({ results: [{ name: "Syntax / load error", pass: false, error: e.message }], logs: [] });
    };
    w.postMessage({ code, tests, ts });
  });
}

let pyw = null;
let pyBooted = false;
let pySeq = 0;
const pyWaiting = new Map();

function pyWorker() {
  if (pyw) return pyw;
  pyw = new Worker(new URL("./py.worker.js", import.meta.url), { type: "module" });
  pyw.onmessage = (e) => {
    pyBooted = true;
    const cb = pyWaiting.get(e.data.id);
    if (cb) { pyWaiting.delete(e.data.id); cb(e.data); }
  };
  pyw.onerror = (e) => {
    e.preventDefault();
    for (const cb of pyWaiting.values()) cb({ results: [{ name: "Python", pass: false, error: "Python failed to load. Check your connection and reload the page." }], logs: [] });
    pyWaiting.clear();
    pyw = null;
    pyBooted = false;
  };
  return pyw;
}

// Start Pyodide downloading before the learner presses Run.
export const warmPython = () => { pyWorker(); };

function runPython(code, tests, packages = []) {
  return new Promise((resolve) => {
    const id = ++pySeq;
    const w = pyWorker();
    const limit = pyBooted ? 15000 : 90000;
    const kill = setTimeout(() => {
      pyWaiting.delete(id);
      w.terminate();
      pyw = null;
      pyBooted = false;
      resolve({ results: [{ name: "Whole run", pass: false, error: `Stopped after ${limit / 1000}s. An infinite loop? Python restarts on your next run.` }], logs: [] });
    }, limit);
    pyWaiting.set(id, (d) => { clearTimeout(kill); resolve(d); });
    w.postMessage({ id, code, tests, packages });
  });
}

export const RUNNABLE = new Set(["js", "ts", "py"]);

export const loadingNote = (lang) => (lang === "py" && !pyBooted ? "Starting Python (the first run downloads about 10 MB)…" : "Running…");

export function runTests(lang, code, tests, packages) {
  if (lang === "py") return runPython(code, tests, packages);
  return runJs(code, tests, lang === "ts");
}

export const runCode = (lang, code, packages) => runTests(lang, code, [{ name: "output", code: "" }], packages);
