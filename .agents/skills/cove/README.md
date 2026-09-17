# cove

Write terse idiomatic code. All logic stays, only boilerplate dies.

## What it does

Biases generated code toward the short idiomatic form in the language at hand:
comprehensions over accumulator loops, iterator chains over index loops, early
returns over deep nesting, `?`/`?.`/`??` over manual null ladders.

Also shapes short-form code artifacts: commit subjects, PR bodies (2-5 bullets),
README, CLI help, error strings, tests.

Languages: Rust, Python, C++, Java, JavaScript, HTML/CSS, Shell.

| Level | What change |
|-------|-------------|
| `lite` | Drop `mut`, redundant braces, verbose error handling. Keep readability. |
| `full` | Default. One-liners, chains, idiomatic short forms. |

## How to invoke

```
/cove              # full (default)
/cove lite         # lighter
stop cove          # back to normal
```

## The one rule that outranks the rest

Compression must never change behavior. If the terse form is not exactly
equivalent — different null semantics, different evaluation order, an extra
call, a dropped guard — keep the verbose form. Correct beats short.

Per-language rules are not portable. A Python idiom is not a Rust idiom.

## What it never touches

Prose written for a human reader: chat explanations, review comments, issue and
defect descriptions, design docs, migration notes. Those stay normal English.

## Caveat

cove is opinionated about terseness, which is not always the same as
readability. In a codebase with its own established style, the repo's
conventions win. Turn cove off when contributing to code you do not own.

## See also

- [`SKILL.md`](./SKILL.md): full per-language rules and examples
