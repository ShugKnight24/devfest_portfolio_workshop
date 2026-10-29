// Runs learner JavaScript / TypeScript off the page, so an infinite loop can't freeze the UI.
// TypeScript is transpiled with sucrase: types are stripped, not checked. Lessons teach type
// errors with predict/check steps instead of relying on the compiler here.
import { transform } from "sucrase";
import { runDrill } from "./runDrill.js";

const toJs = (code) => transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;

self.onmessage = async (e) => {
  const { code, tests, ts } = e.data;
  let src = code;
  if (ts) {
    try {
      src = toJs(code);
    } catch (err) {
      postMessage({ results: [{ name: "TypeScript syntax", pass: false, error: err.message }], logs: [] });
      return;
    }
  }
  postMessage(await runDrill(src, ts ? tests.map((t) => ({ ...t, code: toJs(t.code) })) : tests, 2000));
};
