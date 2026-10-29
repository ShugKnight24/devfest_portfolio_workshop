// Python runs here, off the page, so a slow or stuck program can't freeze the UI.
// Pyodide loads once (about 10 MB the first time, then cached by the browser) and stays warm between runs.
import { PY_HARNESS } from "./pyHarness.js";

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

let ready = null;
function boot() {
  ready ||= (async () => {
    const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE);
    const py = await loadPyodide();
    py.runPython(PY_HARNESS);
    return py;
  })();
  return ready;
}

self.onmessage = async (e) => {
  const { id, code, tests, packages } = e.data;
  try {
    const py = await boot();
    if (packages && packages.length) await py.globals.get("ensure_packages")(py.toPy(packages), (names) => py.loadPackage(names.toJs()));
    const res = await py.globals.get("run_tests")(code, py.toPy(tests));
    postMessage({ id, ...res.toJs({ dict_converter: Object.fromEntries }) });
    res.destroy();
  } catch (err) {
    postMessage({ id, results: [{ name: "Python", pass: false, error: String(err && err.message ? err.message : err).split("\n").slice(-3).join("\n") }], logs: [] });
  }
};
