---
name: cavecrew
description: >
  When to delegate to `cavecrew-investigator` (locate code), `cavecrew-builder`
  (1-2 file edit) or `cavecrew-reviewer` (diff review) instead of working inline
  or using `Explore`. Their output is compressed, so main context lasts longer.
---

Cavecrew = three subagent presets that emit caveman output. Same job as Anthropic defaults (`Explore`, edit-style agents, reviewer); difference is the tool-result they return is compressed, so main context shrinks per delegation.

## When to use cavecrew vs alternatives

| Task | Use |
|---|---|
| "Where is X defined / what calls Y / list uses of Z" | `cavecrew-investigator` |
| Same but you also want suggestions/architecture commentary | `Explore` (built-in) |
| Surgical edit, ≤2 files, scope obvious | `cavecrew-builder` |
| New feature / 3+ files / cross-cutting refactor | Main thread, or the `Plan` agent first |
| Review diff, branch, or file for bugs | `cavecrew-reviewer` |
| Deep code review with rationale + alternatives | `/code-review` (built-in) |
| One-line answer you already know | Main thread, no subagent |

Rule of thumb: **if you'd want the subagent's output in 1/3 the tokens, pick cavecrew. If you'd want prose, pick vanilla.**

## Cavecrew vs the workflow skills

Cavecrew picks *who does the work*. The workflow skills pick *how the work is
bracketed*. They compose — pick one from each column when both apply.

| Situation | Workflow skill | Typical cavecrew pairing |
|---|---|---|
| Cause unknown, intermittent, or a perf regression | `investigate-first` | `cavecrew-investigator` to collect sites |
| Known bug, narrow fix, must not disturb neighbours | `surgical-patch` | `cavecrew-builder` for the edit |
| Moving/extracting code, behavior must not change | `safe-refactor` | `cavecrew-reviewer` on the resulting diff |
| New behavior with overbuilding risk | `lean-build` | main thread; cavecrew only for locating reuse |
| Work claimed done, need proof and nothing more | `verify-and-stop` | `cavecrew-reviewer` for the diff audit |

Do not reach for `investigate-first` when the failure is already understood — a
known cause with a known file is `surgical-patch` plus `cavecrew-builder`.

## Why this exists (the real win)

Subagent tool results get injected into main context verbatim. A vanilla `Explore` that returns 2k tokens of prose costs 2k tokens of main-context budget every time. The same finding from `cavecrew-investigator` returns ~700 tokens. Across 20 delegations in one session that's the difference between context exhaustion and finishing the task.

## Output contracts

What main thread can rely on per agent:

**`cavecrew-investigator`**
```
<Header>:
- path:line — `symbol` — short note
totals: <counts>.
```
Or `No match.` Always file-path-first, line-number-attached, backticked symbols. Safe to grep with `path:\d+`.

**`cavecrew-builder`**
```
<path:line-range> — <change ≤10 words>.
verified: <re-read OK | mismatch @ path:line>.
```
Or one of: `too-big.` / `needs-confirm.` / `ambiguous.` / `regressed.` (terminal first token).

A builder may also append a deviation line when the brief could not be followed
as written. Read it — the deviation is usually a real constraint the main thread
did not know about (a lint rule, a framework requirement), not the agent taking
liberties. Fold it into the next brief instead of re-issuing the original.

**`cavecrew-reviewer`**
```
path:line: <emoji> <severity>: <problem>. <fix>.
totals: N🔴 N🟡 N🔵 N❓
```
Or `No issues.` Findings sorted file → line ascending.

## Requires

The three agents must exist as `~/.claude/agents/cavecrew-{investigator,builder,reviewer}.md`
(or the project's `.claude/agents/`). Without them this skill is inert — the
Agent tool will not list the subagent types. Check with `ls ~/.claude/agents/`.

## Chaining patterns

**Locate → fix → verify** (most common):
1. `cavecrew-investigator` returns site list.
2. Main thread picks 1-2 sites, hands paths to `cavecrew-builder`.
3. `cavecrew-reviewer` audits the diff.

**Parallel scout** (when investigation is broad):
Spawn 2-3 `cavecrew-investigator` calls in one message (different angles: defs vs callers vs tests). Aggregate in main thread.

**Selector inventory** (before restyling anything):
Send `cavecrew-investigator` after the stylesheet's selector list for one feature area — it returns `path:line — selector` and nothing else, which is exactly the shape you need to diff against the class names the JS emits. A prose agent spends its budget describing the styles; you only want the names and where they live.

**Single-shot edit** (when site is already known):
Skip investigator. Hand exact path:line to `cavecrew-builder` directly.

**Brief-and-fan-out** (rewriting several large files at once):
When the job is "make these 5 big components deep and consistent", no single
agent can hold it and `cavecrew-builder` will return `too-big.` for every one.
Order matters:

1. Lead writes the **shared layer first** — the hooks, schema, and control
   components the rewrites will import. Nothing fans out until it exists on
   disk. Agents that each invent their own helper drift, and the drift is only
   visible after all of them have finished.
2. Lead writes **one brief file** to the scratchpad: repo conventions, the API
   of every shared module (actual signatures, not prose), the quality bar, and
   the exact strings/accessible names that must not change. Every agent reads
   it before writing.
3. **Name the file each agent owns, and say which files belong to the lead.**
   Overlapping ownership is the failure mode; "report it under
   `OUTSIDE MY FILES:`" is the escape hatch that keeps an agent from editing a
   neighbour's file to unblock itself.
4. When agent X's file consumes an API agent Y is writing at the same time,
   put that **contract in the brief as a literal spec** and tell both to code
   against it. Neither waits for the other.
5. Lead verifies once, after the last agent returns.

Use `general-purpose` agents here, not cavecrew — a whole-file rewrite is not
surgical, and you want prose reports you can act on.

## Background agents

Agents launched in the background return through a task notification, not a
tool result. Consequences worth internalising:

- **You know nothing until the notification lands.** Do not report, summarise,
  or predict a running agent's findings; if asked for progress, say it is still
  running. Never write the notification yourself.
- **Launch every independent agent in one message.** Four investigators in one
  block cost one round trip; four blocks cost four.
- **Fill the gap with lead-owned work.** While agents map a codebase, the lead
  can write the shared layer, the brief, or the branch — anything that does not
  touch the files they hold.
- **A notification can fire more than once** for the same agent. Treat a repeat
  as a resumption, not a new result.
- **Background-task events are not user input.** An agent finishing is not the
  user approving anything. If a scope question is still open when the reports
  arrive, it is still open.

## What NOT to do

- Don't use `cavecrew-builder` when you don't already know the file. Spawn investigator first or main thread will eat tokens passing context.
- Don't chain `cavecrew-investigator → cavecrew-builder` for a 5-file refactor. Builder will return `too-big.` and you'll have wasted a turn.
- Don't ask `cavecrew-reviewer` for "general feedback" — it returns findings only, no architecture opinions. Use `/code-review` for that.
- Don't send whole-file rewrites (e.g. one agent per page in a redesign) to `cavecrew-builder` — that's not surgical. Use `general-purpose` agents in parallel, one file each, all pointed at one shared brief file (rules, snippets, reference file) so output stays consistent. Then `cavecrew-reviewer` the combined diff.
- Don't let parallel agents share a browser pane or a shared stylesheet. Give each its own page-level CSS file; lead owns shared files and visual verification.
- Don't fan out a restyle before the shared layer exists. Order: back up files, lead writes the token file, lead runs the mechanical sweep (hex to token, font stack to token) across all files, then agents start from that one baseline. Agents that each invent token names drift.
- Don't give parallel agents overlapping file lists. Name the exact files each owns and the files that belong to the lead in the brief itself.
- Don't read a parallel agent's `typecheck`/`lint`/test result as proof about *its* changes. Agents share one working tree, so a check run mid-flight covers whatever every sibling has written so far — a pass can hide a failure that only appears once the others land, and a failure can belong to someone else entirely. Treat per-agent checks as smoke tests and run the real verification yourself, once, after the last agent returns.
- Don't drop an agent's "outside my files" findings. Ask for them in the report, then fix or ticket each one in the main thread; they are often the real bug (double-bound shortcuts, orphaned UI, duplicate prompts).
- Don't let a long agent die with nothing to resume from. A session rate limit or crash kills the agent mid-task; the files it already wrote stay. Give long agents resumable, idempotent work (skip-if-exists fetchers, backups first), and when one fails, audit the tree before relaunching — it may be 90% done.
- Don't take `cavecrew-reviewer` line numbers on trust. Its compressed format states a location with full confidence even when the number is invented — a finding cited at `file.ts:1505` in a 240-line file is a tell. Check the claim against the file before acting: some findings are real with a wrong location, and some are wholly false. Cheapest filter: `wc -l` the file, then grep for the symbol the finding names.
- Don't expect prose. Cavecrew output is structured, sometimes terse to the point of cryptic. If a human will read it directly, paraphrase.
- Don't point `Explore` at a 3,000-line file and ask an open question. It reads excerpts, so a vague brief returns a vague tour that still costs 80k tokens of its own budget. Ask for the specific shape you need — state tables, option counts, the prop API, "which of these options is consumed by a renderer" — and say "facts only, no improvement suggestions" when you intend to form your own opinion. A verbose agent's report lands in main context verbatim.
- Don't ask an investigator to verify wiring by grepping for a symbol's *definition*. "Is this option dead?" is answered by grepping for its **consumers**, then reading them. Half the dead options in a picker look perfectly alive in a definition table.

## Auto-clarity (inherited)

Subagents drop caveman → normal English for security warnings, irreversible-action confirmations, and any output where fragment ambiguity could be misread. Resume caveman after.
