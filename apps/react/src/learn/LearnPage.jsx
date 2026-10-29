import { useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LESSONS, STAGES, TRACKS, findByKey, findLesson, lessonKey, lessonLang, trackById } from "./content";
import { lessonPercent, resetLesson, useLesson, useProgress } from "./progress";
import { warmPython } from "./engine/run";
import { STEP_KINDS, CheckStep, PredictStep, ReadStep, TaskStep } from "./components/Steps";
import "./learn.css";

/*
 * /learn — the fundamentals, connected.
 *
 *   /learn                         the map: every track, grouped into stages, in the order they build
 *   /learn/:track                  one track's lessons
 *   /learn/:track/:lesson/:step?   one lesson, one step at a time
 *
 * Content lives in src/learn/content/<track>/NN-slug.js (see content/index.js for the shapes).
 */

export function LearnPage() {
  const { track, lesson, step } = useParams();
  if (track && lesson) return <LessonView trackId={track} lessonId={lesson} stepArg={step} />;
  if (track) return <TrackView trackId={track} />;
  return <LearnHome />;
}

const href = (l, step) => `/learn/${l.track}/${l.id}${step != null ? `/${step}` : ""}`;

// Per-track accent and monogram. The accent only tints badges, bars and borders; text stays on theme tokens.
const LOOK = {
  js: { mono: "JS", accent: "#d97706" },
  ts: { mono: "TS", accent: "#2563eb" },
  node: { mono: "NODE", accent: "#16a34a" },
  dsa: { mono: "DSA", accent: "#7c3aed" },
  challenges: { mono: "{ }", accent: "#dc2626" },
  design: { mono: "SYS", accent: "#0d9488" },
  git: { mono: "GIT", accent: "#ea580c" },
  python: { mono: "PY", accent: "#0284c7" },
};
const look = (id) => LOOK[id] || { mono: id.slice(0, 3).toUpperCase(), accent: "var(--color-primary)" };
const accent = (id) => ({ "--accent": look(id).accent });

const STAGE_NOTES = {
  Foundations: "Start here. Every later track uses this language.",
  "Full-stack JavaScript": "Add types, then run the same JavaScript on a server.",
  "Problem solving": "The patterns behind interview questions, then problems that mix them.",
  "Building systems": "How real services fit together, and how a team ships changes to them.",
  "Second language": "Everything again in Python, mapped onto what you already know.",
};

const KIND_NOTES = {
  read: "A short explanation with code you can run and edit.",
  predict: "Guess what the code prints, then run it and compare.",
  task: "Write a few lines until the tests pass. Hints if you need them.",
  check: "A few questions to see what stuck before moving on.",
};

const hours = (minutes) => Math.round(minutes / 6) / 10;
const trackMinutes = (t) => LESSONS[t.id].reduce((n, l) => n + (l.minutes || 0), 0);
const Sep = () => <span className="sep" aria-hidden="true">/</span>;

function Shell({ children, crumbs }) {
  return (
    <div className="learn">
      {crumbs && <nav className="learn-crumbs" aria-label="Breadcrumb">{crumbs}</nav>}
      {children}
    </div>
  );
}

function trackPercent(all, t) {
  const list = LESSONS[t.id];
  if (!list.length) return 0;
  return Math.round(list.reduce((n, l) => n + lessonPercent(all, lessonKey(l), l.steps.length), 0) / list.length);
}

// Resume where you left off: the most recently touched lesson that isn't finished.
function nextUp(all) {
  for (const t of TRACKS) for (const l of LESSONS[t.id]) if (lessonPercent(all, lessonKey(l), l.steps.length) < 100) return l;
  return null;
}

function LearnHome() {
  const all = useProgress();
  const resume = nextUp(all);
  const lessonCount = TRACKS.reduce((n, t) => n + LESSONS[t.id].length, 0);
  const totalMinutes = TRACKS.reduce((n, t) => n + trackMinutes(t), 0);
  const started = Object.keys(all.lessons).length > 0;
  return (
    <Shell>
      <header className="learn-hero">
        <p className="learn-kicker">Learn</p>
        <h1>The fundamentals, connected.</h1>
        <p className="learn-lede">
          Short lessons you run in the browser. Read a little, guess what code prints, write a few lines, check yourself. Each track builds on the one before
          it, and every lesson links back to the ideas it reuses.
        </p>
        <div className="learn-actions">
          {resume && (
            <Link className="learn-btn primary big" to={href(resume)}>
              {started ? "Continue" : "Start"}: {resume.title} →
            </Link>
          )}
          <span className="learn-muted">Progress saves in this browser. No account needed.</span>
        </div>
        <dl className="learn-facts">
          <div>
            <dt>Lessons</dt>
            <dd>{lessonCount}</dd>
          </div>
          <div>
            <dt>Tracks</dt>
            <dd>{TRACKS.length}</dd>
          </div>
          <div>
            <dt>Hours of practice</dt>
            <dd>{Math.round(totalMinutes / 60)}</dd>
          </div>
          <div>
            <dt>Languages that run here</dt>
            <dd>JS · TS · Py</dd>
          </div>
        </dl>
        <ol className="learn-kinds" aria-label="What a lesson is made of">
          {Object.entries(STEP_KINDS).map(([k, label]) => (
            <li key={k}>
              <span className={`learn-tag k-${k}`}>{label}</span>
              {KIND_NOTES[k]}
            </li>
          ))}
        </ol>
      </header>
      <ol className="learn-stages">
        {STAGES.map((stage, n) => {
          const tracks = TRACKS.filter((t) => t.stage === stage);
          const stageDone = tracks.every((t) => trackPercent(all, t) === 100);
          return (
            <li key={stage} className={"learn-stage" + (stageDone ? " done" : "")}>
              <span className="learn-stage-num">{stageDone ? "✓" : n + 1}</span>
              <section>
                <h2>{stage}</h2>
                {STAGE_NOTES[stage] && <p className="learn-stage-note">{STAGE_NOTES[stage]}</p>}
                <div className="learn-grid">
                  {tracks.map((t) => {
                    const pct = trackPercent(all, t);
                    const count = LESSONS[t.id].length;
                    return (
                      <Link key={t.id} to={`/learn/${t.id}`} className="learn-card" style={accent(t.id)}>
                        <div className="learn-card-top">
                          <span className="learn-mono" aria-hidden="true">
                            {look(t.id).mono}
                          </span>
                          <span className="learn-card-meta">
                            {count ? `${count} lessons · ${hours(trackMinutes(t))} h` : "coming soon"}
                          </span>
                        </div>
                        <h3>{t.title}</h3>
                        <p>{t.blurb}</p>
                        {t.needs && <p className="learn-needs">Builds on {t.needs.map((id) => trackById(id).title).join(", ")}</p>}
                        <div className="learn-card-foot">
                          <div className="learn-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${t.title} progress`}>
                            <span style={{ width: pct + "%" }} />
                          </div>
                          <span className="learn-card-pct">{pct === 100 ? "Done" : pct ? `${pct}%` : "Not started"}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}

function TrackView({ trackId }) {
  const t = trackById(trackId);
  const all = useProgress();
  if (!t) return <NotFoundLearn />;
  const list = LESSONS[t.id];
  const pct = trackPercent(all, t);
  const resume = list.find((l) => lessonPercent(all, lessonKey(l), l.steps.length) < 100);
  return (
    <Shell crumbs={<Link to="/learn">Learn</Link>}>
      <div style={accent(t.id)}>
        <header className="learn-track-head">
          <span className="learn-mono lg" aria-hidden="true">
            {look(t.id).mono}
          </span>
          <div>
            <p className="learn-kicker">{t.stage}</p>
            <h1>{t.title}</h1>
            <p className="learn-lede">{t.blurb}</p>
          </div>
        </header>
        {list.length ? (
          <>
            <ul className="learn-chips">
              <li className="learn-chip">
                <b>{list.length}</b> lessons
              </li>
              <li className="learn-chip">
                about <b>{hours(trackMinutes(t))}</b> hours
              </li>
              <li className="learn-chip">
                <b>{pct}%</b> done
              </li>
              {t.needs && (
                <li className="learn-chip">
                  Builds on{" "}
                  {t.needs.map((id, k) => (
                    <span key={id}>
                      {k > 0 && ", "}
                      <Link to={`/learn/${id}`}>{trackById(id).title}</Link>
                    </span>
                  ))}
                </li>
              )}
            </ul>
            {resume && (
              <Link className="learn-btn primary big" to={href(resume)}>
                {pct ? "Continue" : "Start"} with lesson {list.indexOf(resume) + 1}: {resume.title} →
              </Link>
            )}
            <ol className="learn-path">
              {list.map((l, k) => {
                const p = lessonPercent(all, lessonKey(l), l.steps.length);
                return (
                  <li key={l.id} className={p === 100 ? "done" : p ? "started" : ""}>
                    <Link to={href(l)}>
                      <span className="learn-path-num">{p === 100 ? "✓" : k + 1}</span>
                      <span>
                        <b>{l.title}</b>
                        <small>{l.goal}</small>
                      </span>
                      <span className="learn-path-side">
                        <span>{l.minutes} min</span>
                        {p > 0 && p < 100 && <span className="now">{p}% in</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p>Lessons for this track are on the way.</p>
        )}
      </div>
    </Shell>
  );
}

function LessonView({ trackId, lessonId, stepArg }) {
  const l = findLesson(trackId, lessonId);
  const key = l ? lessonKey(l) : "missing";
  const [st, update] = useLesson(key);
  const navigate = useNavigate();
  const lang = l ? lessonLang(l) : null;

  useEffect(() => {
    if (lang === "py") warmPython();
  }, [lang]);

  const list = l ? LESSONS[l.track] : [];
  const n = list.indexOf(l);
  const done = stepArg === "done";
  const i = l ? (stepArg && !done ? Math.max(0, Math.min(l.steps.length - 1, Number(stepArg) - 1 || 0)) : Math.min(st.step || 0, l.steps.length - 1)) : 0;
  const last = l && i === l.steps.length - 1;
  const nextHref = l ? (last ? href(l, "done") : href(l, i + 2)) : null;

  useEffect(() => {
    if (l && !done && st.step !== i) update((x) => (x.step = i));
  }, [l, done, i, st.step, update]);

  useEffect(() => {
    if (!l || done) return;
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") navigate(nextHref);
      if (e.key === "ArrowLeft" && i) navigate(href(l, i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [l, done, i, nextHref, navigate]);

  const markDone = useCallback(() => update((x) => (x.done[i] = true)), [update, i]);
  // markDone fires from effects; skip the write when the step is already done
  const markOnce = useCallback(() => {
    if (!st.done[i]) markDone();
  }, [st.done, i, markDone]);

  if (!l) return <NotFoundLearn />;
  const t = trackById(l.track);
  const crumbs = (
    <>
      <Link to="/learn">Learn</Link>
      <Sep />
      <Link to={`/learn/${t.id}`}>{t.title}</Link>
      <Sep />
      <span>
        Lesson {n + 1} of {list.length}
      </span>
    </>
  );
  if (done) return <LessonDone l={l} st={st} list={list} crumbs={crumbs} />;

  const s = l.steps[i];
  const ctx = { s, i, st, update, markDone: markOnce, lang, packages: l.packages || [], nextHref };
  const builds = (l.builds || []).map(findByKey).filter(Boolean);

  const next = last ? null : l.steps[i + 1];
  const kinds = [...new Set(l.steps.map((x) => x.type))];

  return (
    <Shell crumbs={crumbs}>
      <div style={accent(l.track)}>
        <header className="learn-lesson-head">
          <h1>{l.title}</h1>
          {i === 0 && l.goal && <p className="learn-lede">{l.goal}</p>}
          {i === 0 && builds.length > 0 && (
            <p className="learn-needs">
              Builds on:{" "}
              {builds.map((b, k) => (
                <span key={lessonKey(b)}>
                  {k > 0 && " · "}
                  <Link to={href(b)}>
                    {trackById(b.track).title}: {b.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <nav className="learn-steps" aria-label="Steps">
            {l.steps.map((x, k) => (
              <Link
                key={k}
                to={href(l, k + 1)}
                className={`learn-seg k-${x.type}${st.done[k] ? " done" : ""}${k === i ? " on" : ""}`}
                title={`${k + 1}. ${STEP_KINDS[x.type]}: ${x.title}`}
                aria-label={`Step ${k + 1}: ${x.title}`}
                aria-current={k === i ? "step" : undefined}
              />
            ))}
          </nav>
          <div className="learn-steps-legend">
            <span>
              Step {i + 1} of {l.steps.length} · about {l.minutes} min
            </span>
            <span className="keys" aria-hidden="true">
              {kinds.map((k) => (
                <span key={k} className={`k-${k}`}>
                  {STEP_KINDS[k]}
                </span>
              ))}
            </span>
          </div>
        </header>
        <section className="learn-step" key={key + i}>
          <div className="learn-step-kind">
            <span className={`learn-tag k-${s.type}`}>{STEP_KINDS[s.type]}</span>
          </div>
          <h2>{s.title}</h2>
          {s.type === "read" && <ReadStep {...ctx} />}
          {s.type === "predict" && <PredictStep {...ctx} />}
          {s.type === "task" && <TaskStep {...ctx} />}
          {s.type === "check" && <CheckStep {...ctx} />}
        </section>
        <div className="learn-nav">
          {i ? (
            <Link className="learn-btn" to={href(l, i)}>
              ← Back
            </Link>
          ) : (
            <span />
          )}
          <div className="learn-nav-next">
            <small>{next ? `Up next: ${STEP_KINDS[next.type]}, ${next.title}` : "Last step. See how it went."}</small>
            <Link className="learn-btn primary" to={nextHref}>
              {last ? "Finish lesson" : "Next →"}
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function LessonDone({ l, st, list, crumbs }) {
  const navigate = useNavigate();
  const idx = (type) => l.steps.map((s, i) => [s, i]).filter(([s]) => s.type === type);
  const tasks = idx("task");
  const preds = idx("predict");
  const mcqs = l.steps.flatMap((s, i) => (s.type === "check" ? s.items.map((it, k) => [it, i, k]).filter(([it]) => it.choices) : []));
  const missing = l.steps.map((s, i) => [s, i]).filter(([, i]) => !st.done[i]);
  const next = list[list.indexOf(l) + 1];
  const t = trackById(l.track);
  const nextTracks = TRACKS.filter((x) => x.needs?.includes(t.id));
  return (
    <Shell crumbs={crumbs}>
      <div style={accent(l.track)}>
        <h1>
          {missing.length ? "Almost there" : "Lesson complete"}: {l.title}
        </h1>
        {missing.length > 0 && (
          <p className="learn-lede">
            These steps aren't done yet:{" "}
            {missing.map(([s, i], k) => (
              <span key={i}>
                {k > 0 && ", "}
                <Link to={href(l, i + 1)}>
                  {i + 1}. {s.title}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
        <div className="learn-stats">
          {tasks.length > 0 && (
            <div className="learn-stat">
              <b>
                {tasks.filter(([, i]) => st.solved[i] === 0).length}/{tasks.length}
              </b>
              <span>exercises with no hint</span>
            </div>
          )}
          {preds.length > 0 && (
            <div className="learn-stat">
              <b>
                {preds.filter(([, i]) => st.got[i]).length}/{preds.length}
              </b>
              <span>predictions right</span>
            </div>
          )}
          {mcqs.length > 0 && (
            <div className="learn-stat">
              <b>
                {mcqs.filter(([, i, k]) => st.mc[i]?.[k]?.right && !st.mc[i][k].wrong.length).length}/{mcqs.length}
              </b>
              <span>questions right first try</span>
            </div>
          )}
        </div>
        <div className="learn-panel">
          <b>Make it stick.</b> Tomorrow, come back and press <b>Redo from blank</b>, then do every exercise again without hints. That second pass is what moves
          it into memory.
        </div>
        <div className="learn-row">
          {next ? (
            <Link className="learn-btn primary" to={href(next)}>
              Next lesson: {next.title} →
            </Link>
          ) : (
            <span>
              Track complete.{" "}
              {nextTracks.length > 0 && (
                <>
                  Next:{" "}
                  {nextTracks.map((x, k) => (
                    <span key={x.id}>
                      {k > 0 && " or "}
                      <Link to={`/learn/${x.id}`}>{x.title}</Link>
                    </span>
                  ))}
                </>
              )}
            </span>
          )}
          <button
            type="button"
            className="learn-btn"
            onClick={() => {
              if (!window.confirm("Clear your answers and code for this lesson?")) return;
              resetLesson(lessonKey(l));
              navigate(href(l, 1));
            }}
          >
            Redo from blank
          </button>
        </div>
      </div>
    </Shell>
  );
}

function NotFoundLearn() {
  return (
    <Shell crumbs={<Link to="/learn">Learn</Link>}>
      <h1>That lesson isn't here</h1>
      <p>
        It may have moved. <Link to="/learn">Back to the map</Link>.
      </p>
    </Shell>
  );
}

export default LearnPage;
