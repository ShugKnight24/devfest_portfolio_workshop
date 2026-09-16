# caveman

Talk like smart caveman. Same brain, fewer tokens.

## What it does

Compress model responses to caveman-style prose by dropping articles, filler,
pleasantries, and hedging. Instruction preserves technical detail, code blocks,
error strings, and symbols. Result depends on model and workload; no aggregate
reduction or quality-equivalence claim is published, and mode persists until
changed or stopped.

Six intensity levels:

| Level | What change |
|-------|-------------|
| `lite` | Drop filler/hedging. Sentences stay full. Professional but tight. |
| `full` | Default. Drop articles, fragments OK, short synonyms. |
| `ultra` | Bare fragments, one fact stated once. Standard acronyms only (DB, API) — no invented abbreviations, no arrows. |
| `wenyan-lite` | Classical Chinese register, light compression. |
| `wenyan-full` | Maximum 文言文 compression. |
| `wenyan-ultra` | Extreme classical compression. |

Auto-clarity rule: caveman drops to normal prose for security warnings, irreversible-action confirmations, multi-step sequences where fragment ambiguity risks misread, and when user repeats a question. Resumes after the clear part.

## How to invoke

```
/caveman              # full mode (default)
/caveman off          # same as "stop caveman"
/caveman lite         # lighter compression
/caveman ultra        # extreme compression
/caveman wenyan-full  # classical Chinese (also wenyan-lite, wenyan-ultra)
stop caveman          # back to normal prose
```

## Example output

Question: "Why does my React component re-render?"

Normal prose:
> Your component re-renders because you create a new object reference each render. Wrapping it in `useMemo` will fix the issue.

Caveman (full):
> New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`.

Caveman (ultra):
> Inline obj prop, new ref, re-render. `useMemo`.

## What it never touches

Caveman is a chat style. It does not reach anything another human reads on its
own: commit messages, PR/MR bodies, issues, defect reports, docs, code
comments, or messages to third parties are written in normal prose. Code blocks,
error strings, API names and CLI commands are always verbatim.

It also drops to normal prose automatically for security warnings, irreversible
actions, and any place compression would be ambiguous.

## See also

- [`SKILL.md`](./SKILL.md): full LLM-facing instructions
- [Caveman README](../../README.md): repo overview, install, benchmarks
