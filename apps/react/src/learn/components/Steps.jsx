import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadingNote, runCode, runTests } from "../engine/run";
import { mdInline } from "../engine/markdown";
import { CodeEditor, Output } from "./CodeEditor";
import { CodeBlock, Markdown, RunnableBlock } from "./Markdown";

// The four step kinds. Each gets the step `s`, its index `i`, the lesson state `st`,
// `update(fn)` to change that state, `markDone()`, the lesson's `lang` and `packages`,
// and `nextHref` for the "Next" link after a solved task.

export const STEP_KINDS = { read: "Read", predict: "Predict", task: "Try it", check: "Check yourself" };

export function ReadStep({ s, markDone, packages }) {
  useEffect(() => markDone(), [markDone]);
  return <Markdown src={s.md} packages={packages} />;
}

// Guess first, then run. Guessing wrong is the point: the explanation lands harder after a miss.
export function PredictStep({ s, i, st, update, markDone, lang, packages }) {
  const guess = st.guess[i] || "";
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(null);
  const [play, setPlay] = useState(false);
  const runnable = !!lang;

  const reveal = async () => {
    markDone();
    // nothing to run (git, design): show the expected output the lesson wrote down
    if (!runnable) return setResult({ results: [], logs: String(s.output || "").split("\n") });
    setPending(loadingNote(lang));
    const r = await runCode(lang, s.code, packages);
    setPending(null);
    setResult(r);
  };

  useEffect(() => {
    if (st.done[i]) reveal();
    // run once when revisiting a finished step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div>
      {s.md && <Markdown src={s.md} packages={packages} />}
      <CodeBlock code={s.code} lang={lang} />
      <label className="learn-label" htmlFor={`guess-${i}`}>
        What will it print? Write your guess first.
      </label>
      <textarea
        id={`guess-${i}`}
        className="learn-guess"
        rows={2}
        spellCheck={false}
        placeholder="My guess…"
        value={guess}
        onChange={(e) => update((x) => (x.guess[i] = e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && guess.trim()) {
            e.preventDefault();
            reveal();
          }
        }}
      />
      <div className="learn-row">
        <button type="button" className="learn-btn primary" disabled={!guess.trim()} onClick={reveal}>
          {runnable ? "Run it" : "Show the answer"}
        </button>
        <button type="button" className="learn-linkish" onClick={reveal}>
          No idea, just show me
        </button>
      </div>
      <Output result={result} pending={pending} />
      {result && (
        <>
          <div className="learn-row">
            <span>Did your guess match?</span>
            <button type="button" className={"learn-btn small" + (st.got[i] === true ? " on" : "")} onClick={() => update((x) => (x.got[i] = true))}>
              Yes
            </button>
            <button type="button" className={"learn-btn small" + (st.got[i] === false ? " on" : "")} onClick={() => update((x) => (x.got[i] = false))}>
              Not quite
            </button>
          </div>
          <Markdown src={s.explain} className="learn-explain" packages={packages} />
          {runnable &&
            (play ? (
              <RunnableBlock code={s.code} lang={lang} packages={packages} startEditing />
            ) : (
              <button type="button" className="learn-btn small" onClick={() => setPlay(true)}>
                Play with this code
              </button>
            ))}
        </>
      )}
    </div>
  );
}

// An editor, Run tests, one hint, then the full solution. Solving with no hint is what the summary counts.
export function TaskStep({ s, i, st, update, markDone, lang, packages, nextHref }) {
  const code = st.code[i] ?? s.starter;
  const level = st.hint[i] || 0;
  const [res, setRes] = useState(null);
  const [pending, setPending] = useState(null);

  const run = async () => {
    setPending(loadingNote(lang));
    const r = await runTests(lang, code, s.tests, packages);
    setPending(null);
    setRes(r);
    if (r.results.every((t) => t.pass)) {
      markDone();
      update((x) => (x.solved[i] = x.solved[i] == null ? level : Math.min(x.solved[i], level)));
    }
  };

  const passed = res ? res.results.filter((r) => r.pass).length : 0;
  const won = res && passed === res.results.length;

  return (
    <div>
      <Markdown src={s.md} packages={packages} />
      <CodeEditor value={code} onChange={(v) => update((x) => (x.code[i] = v))} onRun={run} minRows={6} />
      <div className="learn-row">
        <button type="button" className="learn-btn primary" onClick={run}>
          Run tests <kbd>⌘↵</kbd>
        </button>
        <button
          type="button"
          className="learn-btn"
          disabled={level >= 2}
          onClick={() => {
            if (level === 1 && !window.confirm("Show the solution? Try one more run first if you can.")) return;
            update((x) => (x.hint[i] = level + 1));
          }}
        >
          {level === 0 ? "Hint" : level === 1 ? "Show solution" : "Solution shown"}
        </button>
        <button
          type="button"
          className="learn-btn"
          onClick={() => {
            if (code !== s.starter && !window.confirm("Clear your code for this exercise?")) return;
            update((x) => {
              x.code[i] = s.starter;
              x.hint[i] = 0;
            });
            setRes(null);
          }}
        >
          Start over
        </button>
        <span className="learn-muted" aria-live="polite">
          {pending || (res ? `${passed} / ${res.results.length} passing` : "")}
        </span>
      </div>
      {res && (
        <div className="learn-results">
          {res.results.map((r, k) => (
            <div key={k} className={"learn-res " + (r.pass ? "pass" : "fail")}>
              {r.pass ? "✓" : "✗"} {r.name}
              {r.error && <small>{r.error}</small>}
            </div>
          ))}
          {res.logs.length > 0 && <div className="learn-output">{res.logs.join("\n")}</div>}
        </div>
      )}
      {level >= 1 && (
        <div className="learn-panel">
          <b>Hint.</b> <Markdown src={s.hint} packages={packages} />
        </div>
      )}
      {level >= 2 && (
        <div className="learn-panel">
          <b>Solution.</b> Read it, then press <b>Start over</b> and type it from memory.
          <CodeBlock code={s.solution} lang={lang} />
          {s.explain && <Markdown src={s.explain} packages={packages} />}
        </div>
      )}
      {won && (
        <div className="learn-panel won">
          <b>{level === 0 ? "✓ Solved with no hint." : level === 1 ? "✓ Solved with the hint." : "✓ Solved after seeing the solution."}</b>
          {level > 0 && " Press Start over and type it once more from memory before moving on."}{" "}
          {nextHref && (
            <Link className="learn-btn primary small" to={nextHref}>
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// Multiple choice. A wrong pick says why and lets you try again; only a first-try right answer counts as "knew it".
export function CheckStep({ s, i, st, update, markDone, packages }) {
  const mc = st.mc[i] || {};
  const orders = useMemo(() => s.items.map((it) => (it.choices ? shuffle(it.choices.map((_, x) => x)) : [])), [s]);
  const allRight = s.items.every((it, k) => !it.choices || mc[k]?.right);

  useEffect(() => {
    if (allRight) markDone();
  }, [allRight, markDone]);

  const pick = (k, x) =>
    update((st2) => {
      const m = (st2.mc[i] ||= {});
      const a = (m[k] ||= { wrong: [], right: false });
      if (x === s.items[k].answer) a.right = true;
      else if (!a.wrong.includes(x)) a.wrong.push(x);
    });

  const mcqs = s.items.map((it, k) => [it, k]).filter(([it]) => it.choices);
  const answered = mcqs.filter(([, k]) => mc[k]?.right).length;
  const first = mcqs.filter(([, k]) => mc[k]?.right && !mc[k].wrong.length).length;

  return (
    <div>
      {s.md && <Markdown src={s.md} packages={packages} />}
      {s.items.map((it, k) => {
        if (!it.choices)
          return (
            <details key={k} className="learn-reveal">
              <summary dangerouslySetInnerHTML={{ __html: mdInline(it.q) }} />
              <Markdown src={it.a} packages={packages} />
            </details>
          );
        const a = mc[k] || { wrong: [], right: false };
        const lastWrong = a.wrong[a.wrong.length - 1];
        return (
          <div key={k} className="learn-mcq">
            <div className="learn-mcq-q">
              <span className="num">{k + 1}</span>
              <Markdown src={it.q} packages={packages} />
            </div>
            <div className="learn-choices">
              {orders[k].map((x) => {
                const cls = a.right && x === it.answer ? "right" : a.wrong.includes(x) ? "wrong" : "";
                return (
                  <button
                    type="button"
                    key={x}
                    className={"learn-choice " + cls}
                    disabled={a.right || a.wrong.includes(x)}
                    onClick={() => pick(k, x)}
                    dangerouslySetInnerHTML={{ __html: mdInline(it.choices[x]) }}
                  />
                );
              })}
            </div>
            {a.wrong.length > 0 && !a.right && (
              <div className="learn-fb bad">
                Not quite. {it.why?.[lastWrong] && <span dangerouslySetInnerHTML={{ __html: mdInline(it.why[lastWrong]) }} />} Try again.
              </div>
            )}
            {a.right && (
              <div className="learn-fb good">
                <b>{a.wrong.length ? "Right, on a retry." : "Right."}</b> <span dangerouslySetInnerHTML={{ __html: mdInline(it.explain || "") }} />
              </div>
            )}
          </div>
        );
      })}
      {mcqs.length > 0 && (
        <p className="learn-muted">
          {answered === mcqs.length
            ? `${first} of ${mcqs.length} right on the first try.${first < mcqs.length ? " Reread the steps behind the ones you missed." : ""}`
            : `${answered} of ${mcqs.length} answered.`}
        </p>
      )}
    </div>
  );
}
