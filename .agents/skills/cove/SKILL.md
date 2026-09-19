---
name: cove
description: >
  cove active. all logic stays, only boilerplate dies.
  Trigger: /cove or "use cove"
---

cove active. all logic stays, only boilerplate dies.

## Languages supported

- Rust
- Python
- C++
- Java
- JavaScript
- TypeScript / React
- HTML/CSS
- Shell (bash/zsh)

## Persistence

ACTIVE EVERY RESPONSE. Still active if unsure. Off: "stop cove" / "normal code".

Default: **full**. Switch: `/cove lite|full`.

## Rules

Drop:
- `let` when type inferred or obvious
- unnecessary `mut`
- redundant closures: `.map(|x| f(x))` → `.map(f)`; `|x| x` → `std::convert::identity`
- verbose error handling when `?` suffices
- `-> ()` when obvious

Use:
- idiomatic short forms

Pattern: `[what] [how].`

## Rust

Drop:
- struct names in struct init when Type already known
- braces around single-line arms
- repeated type name inside its own `impl`: use `Self`
- doc comments on obvious internals
- empty lines between trivial lines
- `Mutex<T>` when single-threaded: use `Rc<RefCell<T>>`

Use:
- turbofish where inference fails: `Vec::<T>::with_capacity(n)`, `"3".parse::<i32>()`
- iter chains: `.filter().map().collect()`
- let chains: `if let Some(x) = foo() && x > 0`
- underscores for unused vars: `fn f(_: i32) {}`
- compact match arms: `x if x < 0 => todo!()`
- `..Default::default()` shorthand
- `?` operator to propagate `Result`/`Option`
- `.unwrap_or_default()` / `.unwrap_or_else()` for fallback
- `.unwrap_or()` / `.map()` chains over nested if-lets
- `Option::ok_or()` / `.ok()` for Result conversion
- `join!` for parallel independent `await`s
- `select!` for race conditions

❌ verbose:
```rust
let mut result = Vec::new();
for item in items.iter() {
    if let Some(value) = item.get_value() {
        result.push(value);
    }
}
```

✅ full:
```rust
let result: Vec<_> = items.iter().filter_map(|i| i.get_value()).collect();
```

## Levels

| Level | What change |
|-------|------------|
| **lite** | Remove mut, braces, verbose error handling. Keep readability |
| **full** | One-liners, chains, turbofish, let chains. Professional terse |

## Examples

❌ verbose:
```rust
fn process_items(items: &[Item]) -> Result<Vec<ProcessedItem>, ProcessingError> {
    let mut results = Vec::new();
    for item in items.iter() {
        let processed = item.process()?;
        results.push(processed);
    }
    return Ok(results);
}
```

✅ full:
```rust
fn process_items(items: &[Item]) -> Result<Vec<ProcessedItem>, ProcessingError> {
    items.iter().map(|i| i.process()).collect()
}
```

## Python

Drop:
- `None` checks: `if x is None` → `if not x` ONLY when `0`, `""`, `[]`, `False` are impossible values of `x`
- redundant parentheses: `if (a and b):` → `if a and b:`
- explicit `list()` / `dict()` / `set()` when comprehension works
- `== True` / `== False`

Use:
- list/dict/set comprehensions: `[f(x) for x in items if x]`
- walrus operator: `[y for x in data if (y := f(x))]`
- ternary: `y = x if cond else z`
- f-strings over `.format()`
- generator expressions for side effects: `any(x > 0 for x in items)`
- dataclasses / attrs for structs
- match-case (Python 3.10+)

❌ verbose:
```python
def process_items(items):
    results = []
    for item in items:
        if item is not None:
            value = item.get_value()
            if value > 0:
                results.append(value)
    return results
```

✅ full:
```python
def process_items(items):
    return [v for i in items if i is not None and (v := i.get_value()) > 0]
```

## C++

Drop:
- `this->` (already in class) unless a parameter or local shadows the member
- `std::` when `using namespace std;` or type obvious
- redundant `()` around lambda return: `[]() { return x; }` → `[] { return x; }`
- empty destructors
- `private:` when class body is private by default (struct is public by default)
- redundant `{ }` around single statements

Use:
- `auto` for type inference
- range-based for: `for (auto& x : items)`
- lambdas: `[&](auto x) { return f(x); }`
- `std::erase` / `std::erase_if` (C++20)
- `[[nodiscard]]` / `[[maybe_unused]]`
- `std::optional` / `std::variant` over pointer + sentinel
- `constexpr` when known at compile time
- `std::views` / ranges (C++20): `items | std::views::filter(f) | std::views::transform(g)`
- `= default` / `= delete`
- trailing return type: `auto f() -> int`

❌ verbose:
```cpp
std::vector<int> process_items(const std::vector<Item>& items) {
    std::vector<int> results;
    for (auto it = items.begin(); it != items.end(); ++it) {
        if ((*it).is_valid()) {
            auto value = (*it).get_value();
            if (value > 0) {
                results.push_back(value);
            }
        }
    }
    return results;
}
```

✅ full:
```cpp
auto process_items(const std::vector<Item>& items) -> std::vector<int> {
    std::vector<int> results;
    for (const auto& item : items)
        if (item.is_valid() && item.get_value() > 0)
            results.push_back(item.get_value());
    return results;
}
```

## HTML/CSS

Drop:
- unnecessary `class=""` / `id=""` when obvious
- closing tags for void elements: `<br>` not `<br/>`
- `type="text/javascript"` in script tags
- `type="text/css"` in style tags
- redundant `div` wrappers

Use:
- semantic HTML: `<main>`, `<nav>`, `<article>`, `<section>`
- multi-tone sprite icons: fills on `<symbol>` children read custom properties (`style="fill: var(--mark-leaf, currentColor)"`). Properties inherit into the `<use>` shadow tree, so each surface colors one symbol differently
- CSS custom properties for theming
- shorthand properties: `margin: 10px 5px` over `margin-top: 10px; margin-right: 5px; ...`
- `clip-path` / `filter` over images for effects
- `aspect-ratio` over padding hacks
- `gap` for spacing in flex/grid
- `<dialog>` + `showModal()` for modals/lightboxes: native Esc, focus trap, `::backdrop`. No hand-rolled overlay + keydown ladder — but see the `margin: 0` trap below
- `inert` on closed off-canvas panels instead of `aria-hidden` + tabindex juggling
- `<img srcset sizes width height loading="lazy">` — dimensions stop CLS, `srcset` stops shipping 1600px photos to phones
- event delegation for repeated triggers: `document.addEventListener("click", e => e.target.closest("[data-x]") && open(...))`
- `IntersectionObserver` on a 1px sentinel for "nav scrolled" state, not a scroll listener

Never:
- a global `* { margin: 0 }` reset next to `<dialog>` + `showModal()`. The UA centres a modal with `margin: auto`; the reset zeroes it and the dialog parks at the top-left corner, looking like a broken layout rather than a CSS reset. Put `margin: auto` back on the dialog itself
- `backdrop-filter` / `filter` / `transform` on an ancestor of a `position: fixed` child. It becomes the containing block and the fixed panel collapses into the header. Put the blur on `::before`
- `display: none` toggles on things that should animate: use `opacity` + `visibility` with delayed `visibility` transition
- theme overrides on `:root` or `body.theme-x` when themes are keyed on `html[data-theme]`. `html[data-theme="light"]` is (0,1,1) and beats `:root` (0,1,0), so the override silently loses. Set palette and derived tokens on the same selector the theme switch writes
- alias tokens (`--bg: var(--paper)`) on a different element than the palette. `var()` resolves where declared, then children inherit the resolved value. Declare aliases on `html[data-theme]` next to the palette; a scoped override lower down (`[data-mode-panel] { --paper: … }`) does not re-resolve them
- `box-shadow` on off-canvas panels parked at `left: 100vw`. The shadow bleeds into view. Add `visibility: hidden` when closed, or apply the shadow only in the open state
- hard-coded chrome offsets (`top: 92px`) repeated across files. One `--nav-h` / `--toolbar-h` / `--chrome-h` token, overridden in the mobile media query
- a class that sets `display` on an element toggled with the `hidden` attribute. `.x { display: flex }` beats the UA `[hidden]` rule and the "hidden" control shows. Add `[hidden] { display: none !important }` once; elements that animate out opt back in with a more specific `.x[hidden]` rule
- flex sidebars without `flex: none`. A wide sibling shrinks a `width: 240px` sidebar to a sliver
- an IndexedDB `put` whose keyPath value can be null (a doc with no path/id). It throws `DataError`; guard before writing
- a service worker cache shared by data that must survive (saved texts) and data that churns (search shards). One capped cache evicts the other; give each its own name and cap
- modules that `document.body.appendChild` their UI in an app shell of fixed panels. The node lands below the viewport and scrolling a child `scrollIntoView` scrolls the whole document. Mount into the owning panel; `document.documentElement.scrollHeight > innerHeight` in an app shell means something escaped
- rename a class in a render function without renaming it in the stylesheet. Nothing throws: the element still renders, just unstyled, so a rewritten module degrades to raw HTML on the page background and reads as bad design rather than as a broken selector
- restyle a component that a global remediation block targets with `!important` (a "WCAG contrast fixes" section at the end of the file is the usual one) without reading that block first. It was written against the component's OLD fill — an active tab that used to be solid emerald gets `color: #022c22 !important`, and your new dark tab paints its label near-black
- a `speak()` / toast / tooltip helper whose `duration` timeout only removes a highlight or animation class. The element itself never hides; if it is `position: fixed` it then covers the same corner of every view for the rest of the session. The timeout must hide the element, not just un-decorate it
- template a field the data layer does not define (`region.minLevel` where the data says `levelReq`). It renders the string "undefined", and every comparison against it is `NaN`, so `floor <= state.floor + 1` is false for all floors and the feature is silently unreachable — not just mislabelled

Verify:
- a static dev server should send `Cache-Control: no-store` (subclass `SimpleHTTPRequestHandler.end_headers`). Plain `python3 -m http.server` sends no cache headers, so the browser keeps stale CSS after edits. Check a computed value (`getComputedStyle(el).backgroundColor`) before trusting a screenshot; refetch with `fetch(url, {cache: "reload"})` then reload
- find undefined tokens before restyling: list every `var(--x` used, subtract every `--x:` declared. Undefined tokens fall back to per-file hex and are the usual cause of a "broken" theme
- find orphaned classes before restyling, the same way: list every class the JS emits (`grep -ohE 'class="[^"$]*"' src/**/*.js`), subtract every `.x` the stylesheet declares. What is left is markup that was renamed without the CSS. A module whose class list is mostly orphans is not designed badly, it is unstyled
- after any change to a data shape, walk the rendered DOM for `undefined`, `NaN` and `[object Object]` in text nodes, across every view and sub-tab. A `TreeWalker` over `document.body` in a headless browser finds in one pass what reading templates misses, and catches the field renames that a type-free codebase will not

❌ verbose:
```html
<div class="container">
  <div class="row">
    <div class="col-12 col-md-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Title</h3>
        </div>
        <div class="card-body">
          <p class="card-text">Content goes here</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

✅ cove:
```html
<section class="card">
  <h3>Title</h3>
  <p>Content goes here</p>
</section>
```

❌ verbose:
```css
.element {
  margin-top: 10px;
  margin-right: 0px;
  margin-bottom: 10px;
  margin-left: 0px;
  padding-top: 5px;
  padding-right: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
}
```

✅ cove:
```css
.element {
  margin: 10px 0;
  padding: 5px 10px;
}
```

## CSS Modules

A component stylesheet, not a utility soup. Same compression rules, plus:

Drop:
- `style={{}}` for anything static. Inline styles beat the module, do not theme, and cannot be overridden in a media query. Keep inline style ONLY for a genuinely dynamic value (a swatch colour, a computed dimension) — and pass it as a custom property (`style={{ '--swatch': hex }}`) so the rule that consumes it stays in the stylesheet
- raw hex in a themed codebase. `#0f172a` is a decision copied into 40 files; `var(--color-text-primary)` is one decision. Raw hex in JS is different — swatch tables and canvas fill strings are data, not theme
- BEM-ish prefixes on module classes. The module already scopes them: `.cardTitle` not `.studioCard__title`
- a wrapper `div` that exists only to hold one class. Put the class on the element that is already there

Use:
- one module per component, imported as `styles`
- `composes:` for shared local rules instead of copying a block between modules
- a `--component-x` custom property where a parent needs to vary a child's layout (`grid-template-columns: repeat(var(--grid-cols, 3), 1fr)`)
- `:focus-visible`, never `:focus`, for rings — `:focus` rings on mouse click read as a bug and get deleted, taking keyboard users with them
- `@media (prefers-reduced-motion: reduce)` next to every transition/transform block you write, in the same file

Never:
- copy a block between two component modules "for now". Two studios that each grew their own swatch row is how selection state ends up conveyed by CSS class alone, with no `aria-checked` in either
- convey state by colour or opacity alone (`.itemHidden { opacity: .45 }` with an unchanged icon). The class is invisible to assistive tech and to anyone not comparing two rows side by side
- ship `opacity: 0.3` disabled states. They fail contrast; use a token colour

## Accessible controls (JS/React)

A role is a contract. Claiming one and not honouring it is worse than a bare
`div`, because assistive tech now promises the user behaviour that is absent.

- `role="radiogroup"` + `role="radio"` obliges `aria-checked` on every option, **roving `tabIndex`** (0 on the active one, -1 on the rest — one tab stop for the group, not twelve), and arrow-key movement that moves focus with selection. Write the key handler in the same commit as the role
- `role="tab"` obliges `aria-selected`, `aria-controls`, and a `role="tabpanel"` that exists. A row of buttons that merely looks like tabs should stay buttons
- `title` is not an accessible name. Icon-only and glyph-only buttons (`✕`, `▲`, an eye toggle) need `aria-label`
- selection conveyed by CSS class needs `aria-pressed` or `aria-current` alongside it
- a `<label>` with no `htmlFor` next to an input with no `id` is decoration. Pair them, or use `useId()`
- `<canvas>` is opaque: give it a role, an `aria-label` describing the current state, a `tabIndex`, and a keyboard path to whatever the pointer can do. Drag-only editing has no keyboard equivalent by default
- announce state the user cannot see happen (item added, export finished, design saved) in a `role="status"` live region
- do not make thousands of nodes focusable to fix one click handler — give each row one real control instead

## Java

Drop:
- `this.field` (already in class) unless a parameter shadows it (constructors, setters)
- block lambdas with one return: `x -> { return x; }` → `x -> x`
- empty constructor / initializer blocks `{}`
- `public` on interface methods (implicit)
- explicit type args on the right of `new`: `new ArrayList<Integer>()` -> `new ArrayList<>()`
- redundant braces around single statements

Use:
- `var` for type inference (Java 10+)
- enhanced for: `for (Item item : items)`
- lambdas: `(x, y) -> x + y`
- `List.of()` / `Map.of()` / `Set.of()` (immutable collections, Java 9+)
- `Stream.ofNullable()` / `Optional.stream()` (Java 9+)
- records (Java 16+): `record Point(int x, int y) {}`
- sealed classes (Java 17+)
- pattern matching for switch (Java 21+)
- `Objects.requireNonNullElse()`
- `String.join()` over manual concatenation

❌ verbose:
```java
public List<Integer> processItems(List<Item> items) {
    List<Integer> results = new ArrayList<Integer>();
    for (Item item : items) {
        if (item != null) {
            int value = item.getValue();
            if (value > 0) {
                results.add(value);
            }
        }
    }
    return results;
}
```

✅ full:
```java
List<Integer> processItems(List<Item> items) {
    var results = new ArrayList<Integer>();  // var needs the type here
    for (Item item : items)
        if (item != null && item.getValue() > 0)
            results.add(item.getValue());
    return results;
}
```

## Practices

### Console / Logging

Short output. All logic, no ceremony.

Drop:
- `System.out.println("value = " + x)` → `println!("{x}")` / `print("{x}")` / `console.log(x)`
- `console.log("debug", x, y)` → `console.log({x, y})` or `dbg!(x)`
- verbose format strings when interpolation works
- log level labels when context clear
- `print()` newline when `println()` cleaner
- unnecessary `str()` / `to_string()` in f-strings

Use:
- template literals / f-strings / format
- structured logging: `console.log({user, action, count})`
- `dbg!()` in Rust
- `print!()` without newline for progress bars
- short aliases: `l = console.log` (JS), `log = println` (Rust)
- `clog` / `eprintln` for errors
- terse timestamps: `HH:MM:SS`

❌ verbose:
```js
console.log("Processing item:", item.name, "with value:", item.value);
console.log("Result count:", results.length);
```

✅ full:
```js
console.log({item: item.name, value: item.value});
console.log({count: results.length});
```

❌ verbose:
```python
print("The result is:", str(result))
print(f"Processing item {item.name} with value {item.value}")
```

✅ full:
```python
print(f"{result}")
print(f"{item.name}: {item.value}")
```

### Shell (bash/zsh)

Drop:
- `then`/`fi` when single-line `&&`/`||` works
- `function` keyword (bash)
- `#!/bin/bash` in a sourced file or function library (a standalone executable script keeps it)
- `exit 0` at end of script
- verbose `if [ $x -eq 0 ]; then ... fi`

Use:
- `$()` for command substitution, never backticks (they do not nest and mangle escapes)
- ALWAYS quote expansions: `"$var"`, `"$@"`, `"${arr[@]}"` — unquoted splits on whitespace and globs
- `[[ ]]` over `[ ]` (bash)
- `&&` / `||` for simple conditionals
- `local` for variables in functions
- `set -e` / `set -u` for safety
- herestrings: `grep pattern <<< "$var"`
- process substitution: `diff <(cmd1) <(cmd2)`
- short flags: `-r` over `--recursive`
- `_` for unused: `cmd _ arg2`

❌ verbose:
```bash
#!/bin/bash
function process_files() {
    local files=$(ls *.txt)
    for file in $files; do
        if [ -f "$file" ]; then
            echo "Processing $file"
            cat "$file" | grep "TODO"
        fi
    done
}
```

✅ full:
```bash
#!/usr/bin/env bash
set -euo pipefail
process_files() {
    for f in ./*.txt; do
        [[ -f $f ]] && grep "TODO" "$f"
    done
}
```

## JavaScript

Drop:
- `function` keyword when arrow functions cleaner (keep it when `this`, `arguments`, hoisting or `new` is used)
- block body with a single `return`: `x => { return x * 2 }` → `x => x * 2`
- redundant `=== true` / `=== false`
- `new Array()` / `new Object()` → `[]` / `{}`
- verbose `if (x !== null && x !== undefined)` → `if (x != null)`

Use:
- arrow functions: `x => x * 2`
- destructuring: `const { name, age } = user`
- spread/rest: `...args`, `{ ...obj }`
- template literals: `` `hello ${name}` ``
- optional chaining: `obj?.foo?.bar`
- nullish coalescing: `x ?? default`
- array methods: `.filter().map().find()`
- async/await over Promise chains
- `for...of` over `for (let i = 0; ...)` when index not needed
- `const` by default, `let` only when reassign

❌ verbose:
```js
function processItems(items) {
    var results = new Array();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item !== null && item !== undefined) {
            var value = item.value;
            if (value > 0) {
                results.push(value);
            }
        }
    }
    return results;
}
```

✅ cove:
```js
const processItems = items =>
    items?.filter(i => i?.value > 0).map(i => i.value) ?? []
```

❌ verbose:
```js
const getFullName = (user) => {
    if (user.firstName !== null && user.firstName !== undefined) {
        return user.firstName + ' ' + user.lastName;
    } else {
        return 'Unknown';
    }
}
```

✅ cove:
```js
const getFullName = ({ firstName, lastName }) =>
    firstName != null ? `${firstName} ${lastName}` : 'Unknown'
```

## TypeScript / React

Drop:
- `React.FC<Props>` — annotate props directly, infers children-free by default
- `interface Props` when used once and inline type is short
- explicit return types on components and simple hooks (inferred)
- `as` casts that a type guard or generic would do honestly
- `useState` type param when the initial value infers it
- `useEffect` used to derive state from props — compute during render instead
- `useCallback`/`useMemo` on values that are cheap and not dependencies of anything memoized
- redundant fragments: `<><Foo /></>` when a single child
- `index` keys when a stable id exists

Use:
- `type` for unions/props, `interface` only when declaration merging is needed
- discriminated unions over optional-field soup
- `satisfies` to keep literal inference while checking shape
- derived state computed in render, not mirrored in `useState`
- `useReducer` when 3+ state fields change together
- lazy `useState(() => expensive())` for costly initial values
- `Readonly<T>` / `as const` for static config tables
- functional updates: `setX(prev => ...)` inside callbacks and effects
- one effect per concern, each with its own cleanup
- server components by default in Next.js App Router; `"use client"` only at the leaf that needs it

❌ verbose:
```tsx
interface CounterProps { start: number; label: string }

export const Counter: React.FC<CounterProps> = ({ start, label }) => {
  const [count, setCount] = useState<number>(start)
  const [doubled, setDoubled] = useState<number>(start * 2)

  useEffect(() => {
    setDoubled(count * 2)
  }, [count])

  const handleClick = useCallback(() => {
    setCount(count + 1)
  }, [count])

  return (
    <>
      <button onClick={handleClick}>{label}: {count} ({doubled})</button>
    </>
  )
}
```

✅ cove:
```tsx
export const Counter = ({ start, label }: { start: number; label: string }) => {
  const [count, setCount] = useState(start)
  const doubled = count * 2

  return <button onClick={() => setCount(c => c + 1)}>{label}: {count} ({doubled})</button>
}
```

❌ verbose:
```tsx
type State = { status: string; data?: Data; error?: string }

if (state.status === 'success') {
  render((state.data as Data).items)
}
```

✅ cove:
```tsx
type State =
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: string }

if (state.status === 'success') render(state.data.items)
```

Never:
- call `setState` in an effect body. `eslint-plugin-react-hooks` v6, which ships
  in Next 16's default config, fails it as `react-hooks/set-state-in-effect`, and
  no dependency tweak clears it. State that lives outside React — a URL
  parameter, `localStorage`, a media query, a clock — belongs in
  `useSyncExternalStore`, whose server snapshot also fixes the hydration
  mismatch the effect was working around. A `setState` inside a `setTimeout` or
  event callback that the effect *registers* is fine; only the synchronous body
  is rejected
- put `role="slider"` / `role="tab"` / `role="button"` on a `div` without the
  `tabIndex` and the key handler that role promises. The role is a contract: a
  slider arrows cannot move is worse than an unlabelled `div`
- make thousands of nodes focusable to "fix" a click handler. Per-word seeking
  on a 2,000-cue transcript stays a mouse affordance; give each row one real
  control — its timestamp — instead of 2,000 tab stops
- derive an id from `Date.now()` alone. Two records created in the same
  millisecond collide, and colliding ids silently share one row of state. Same
  for a human-readable timestamp used as a delete key: `"14:32"` is not unique
- leave a `setTimeout` un-refed when a second call can land inside its window.
  The first timer clears the second one's state early, and a pending timer
  outlives the component. One ref, cleared on each call and on unmount

Never drop: `"use client"`, `key` props, effect cleanup functions, dependency array entries that are actually read. Each changes behavior, not verbosity.

## Modules / code splitting (JS)

Drop:
- god files: one module owning input, simulation, rendering and UI. Split by responsibility, not by size alone
- `export` on symbols no other module imports
- import cycles (`a` imports `b` imports `a`) — move the shared piece into a third module
- side effects at import time (DOM queries, listeners, timers) — export an `init()` and call it once from the entry point
- duplicated lookup tables and constants across files — one source, imported
- dead branches behind flags that never change

Use:
- one default direction for imports: entry, then orchestration, then systems, then data/utils. Utils never import systems
- pure functions for game rules (damage, scoring, spawn picks) so unit tests need no DOM or canvas
- dynamic `import()` for rarely-entered modes (editor, builder, cutscenes) so the boot bundle stays small
- a `dispose()` that removes every listener, timer and rAF the module added
- a named constant in the owning module over the same literal in 3+ places

Behavior-preserving split order: move code verbatim, re-export from the old path, run tests, then update importers and delete the re-export.

## WebGL / Three.js / Canvas / Web Audio

Drop:
- Redundant material/geometry allocations in render loops
- Manual event listener sprawl without cleanup
- Complex audio sample loading when parametric synthesis works
- Uncapped animation frames without delta-time clamping

Use:
- Procedural geometry & materials reused across instances
- Particle pooling (`reset()` over `new`)
- Web Audio API parametric nodes (Oscillators, BiquadFilter, Gain, Noise buffers)
- RequestAnimationFrame with delta-time easing
- `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` around `texImage2D(..., canvasOrImage)` when the shader samples with `gl_FragCoord` / bottom-up UVs, then reset it. DOM sources upload top row first; skipping this mirrors the whole frame vertically
- test GPU paths with GPU flags (`--use-gl=angle --enable-gpu`). Default headless Chromium has no WebGL, so a GL-only bug never shows in screenshots

❌ verbose:
```js
function renderLoop() {
  const geom = new THREE.SphereGeometry(1, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);
  renderer.render(scene, camera);
}
```

✅ cove:
```js
// Pre-allocate once
const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
scene.add(sphereMesh);
const animate = () => { requestAnimationFrame(animate); sphereMesh.rotation.y += 0.01; renderer.render(scene, camera); };
```

## Game loop / Canvas 2D

Per-frame code is the hot path. Terseness here must never cost frame time.

Drop:
- allocation inside the frame: `{x,y}`, array literals, `.map`/`.filter` chains in update/render
- `ctx.save()`/`ctx.restore()` pairs used only to change one property — set and reset it
- `shadowBlur` for glow — it is a per-pixel blur and murders fill rate. Layer translucent fills instead
- string building per frame (`` `${hp}/${max}` ``) when the value did not change — cache it
- `Math.hypot` in inner loops — compare squared distances
- re-reading `canvas.width` / `getBoundingClientRect()` every frame — it forces layout

Use:
- object pools with `reset()` over `new` for particles, projectiles, damage numbers
- typed arrays (`Float32Array`) for large homogeneous per-entity data
- offscreen canvas for anything static: vignette, noise, textures, gradients — draw once, blit after
- `dt` clamped (`Math.min(dt, 1/30)`) so an alt-tab stall cannot tunnel entities through walls
- integer-snapped destination coords for blits; subpixel blits are a silent slow path
- one batched pass per material/state instead of interleaving `fillStyle` changes
- accumulate fixed-step physics, interpolate render — never scale physics by a variable `dt`
- gate a frame cap on a running deadline with half a display period of slack, never on
  `now - lastRender >= 1000 / cap`. vsync timestamps land a fraction of a millisecond
  early, so the bare comparison drops every other frame: a 60 fps cap renders at 30 on a
  60 Hz panel and at 43 on a 120 Hz one. After a stall, set the deadline forward from
  `now` instead of burst-rendering the deadlines already past
- an FPS-driven quality governor must target the *active* cap, not a constant. A fixed
  55 fps target plus a deliberate 30 fps cap reads as a slow machine, and the render
  scale spirals to the floor the moment the player enables battery saver
- count hit-stop, i-frames and freeze windows in milliseconds, not frames. Frame counts
  are 2.4x shorter on a 144 Hz panel than on 60 Hz, and twice as long under a 30 fps cap
- a loop's `catch` must keep calling `requestAnimationFrame`. Returning without
  rescheduling ends the session permanently — a frozen canvas, often still holding
  pointer lock. Throttle the logging, then recover the app to a screen that can draw
- vector art: rasterize SVG once per size bucket (`data:image/svg+xml` → `Image`, `img.decode()`), blit per frame. Split parts that move into separate layers and animate them with canvas transforms/alpha. Never rebuild SVG markup per frame
- one horizon offset (crouch, slide, camera punch) for walls, floor and sprites alike, or props float off the floor

❌ verbose and slow:
```js
update(dt) {
  this.particles = this.particles
    .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt }))
    .filter(p => p.life > 0);
}
render(ctx) {
  for (const p of this.particles) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
    ctx.restore();
  }
}
```

✅ cove:
```js
update(dt) {
  for (let i = this.count - 1; i >= 0; i--) {
    const p = this.pool[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if ((p.life -= dt) <= 0) this.release(i);   // swap-pop, no realloc
  }
}
render(ctx) {
  for (let i = 0; i < this.count; i++) {
    const p = this.pool[i];
    ctx.fillStyle = p.glow;                      // pre-baked rgba, wider + fainter
    ctx.fillRect(p.x - 2, p.y - 2, 6, 6);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  }
}
```

Never let compression change frame behavior. A chain that reads better but allocates per
particle per frame is the wrong trade in a render loop — and only in a render loop.

## Contextual Formatting 

Auto-applies in most contextual technical situations.

Examples:
- bug / error / crash / fail → drill why
- "why" questions → drill why
- debug / root cause / stack trace → drill why
- vague "something wrong" → drill why

**Borderline:** when uncertain, always drill.

### Pattern

Ask "why" 5 times until root cause / logically sound answer.

```
why: users got charged twice
  why: payment processor called twice
    why: retry logic resends same request
      why: timeout set too long
        why: no circuit breaker
answer: no timeout protection
```

### Improvement Ideas 

After every 5 whys, generate improvements:

```
root: no circuit breaker
  idea 1: add idempotency key to payments [quick]
  idea 2: add request deduplication [quick]
  idea 3: add circuit breaker pattern [refactor]
  idea 4: move to async job queue [defer]
  idea 5: rewrite payment processor [never]
```

### Prioritization

Prioritize by time vs impact.

- **quick**: <1hr, high impact → do first
- **refactor**: >1hr, high impact → schedule
- **defer**: >1hr, low impact → backlog
- **never**: >1hr, no impact → skip

## PR / Body Text 

Auto-applies when writing about code changes.

Examples:
- PR description / review → bullet-only
- pull request / commit message → bullet-only

Bullet-only. No essays. 2-5 bullets max.

❌ verbose:
```
I have implemented a new feature that allows users to search for products by their name. This is a very useful feature that was requested by the customer. It uses a database index to make the search fast. Please review.
```

✅ cove:
```
feat: add product search by name
- uses db index for performance
- addresses customer request
[TITE-123]
```

## Tests 

Auto-applies when writing about or showing tests.

Examples:
- test / assertion / spec → minimal assertions
- test code shown → one concept per test

Minimal assertions. One concept per test.

❌ verbose:
```python
def test_when_user_clicks_search_button_and_database_contains_matching_products_then_display_results_in_ui():
    db = setup_test_database()
    db.insert(Product(name="Widget A", price=100))
    db.insert(Product(name="Widget B", price=200))
    result = click_search_button("Widget")
    assertEqual(len(result), 2)
    assertEqual(result[0].name, "Widget A")
    assertEqual(result[1].name, "Widget_B")
```

✅ cove:
```python
def test_search_returns_matching_products():
    db.insert(Product(name="Widget A", price=100))
    result = search("Widget")
    assert len(result) == 1
    assert result[0].name == "Widget A"
```

## Error Messages 

Auto-applies when showing or describing errors.

Examples:
- stack trace / error output → short, actionable
- exception / panic / failed → short, actionable

Short. Actionable. No stack trace novels.

❌ verbose:
```
We apologize for the inconvenience. An unexpected error occurred while attempting to save your document. This may have been caused by a temporary network issue or a problem with the storage subsystem. Please try saving again, and if the problem persists, contact support with error code 0x80070005.
```

✅ cove:
```
Save failed: disk full. Free 500MB to continue. [ERR_DISK_FULL]
```

## CLI Help

Examples over explanation. Compressed.

Drop:
- "This command does..." → just show usage
- paragraphs of description
- "Usage:" label (obvious from structure)
- `[options]` when none exist
- "Run X to get started" when X is `x --help`

Use:
- `x -h` / `x --help` / `x help`
- one-liner: `x [subcommand] <arg> [-f flag]`
- common flags first: `-h`, `-v`, `-f`
- exit codes: `0` success, `1` error
- `--version` support

❌ verbose:
```
Usage: myapp [command]

This is the main CLI entry point for myapp. You can use this tool to manage various aspects of your project including building, testing, and deploying your application.

Commands:
  build   Build the project from source
  test    Run the test suite
  deploy  Deploy the application to production

Options:
  -h, --help    Show this help message
  -v, --verbose Enable verbose output

For more information, visit https://docs.example.com
```

✅ full:
```
x build|test|deploy [-h] [-v]

build     compile sources
test      run suite  
deploy    push to prod

-h  help -v  verbose
```

## README

Terse install/usage. No marketing.

Drop:
- badges (unless CI status)
- "Modern", "Fast", "Production-ready" (show, don't say)
- big logos / banners
- contribution guidelines (link to CONTRIBUTING.md)
- lengthy "Features" list
- screenshots (maintain them? no)

Use:
- 3 sections: Install, Usage, API
- code blocks for commands
- badge only for CI/publish status
- TOC if > 3 sections
- "See full docs at..." link

❌ verbose:
```
# 🚀 SuperApp 

[![Build](https://img.shields.io/badge/build-passing-green)]()

The **most modern** and **fastest** application framework for building scalable microservices in the cloud.

## Features

- ⚡ Lightning fast
- 🔒 Secure by default
- 📦 Zero config
- 🌐 Multi-cloud
- 🧪 Fully tested
- 📚 Excellent documentation

## Getting Started

To get started with SuperApp, you'll need to have Node.js installed
on your machine. First, run the following command to install SuperApp
as a global dependency...

[continues for 500 more words]
```

✅ full:
```
# SuperApp

Build and deploy microservices.

## Install
`npm i -g superapp`

## Usage
`superapp build`  compile  
`superapp deploy` push to prod

## API
`new App(opts)` create app  
`app.listen(port)` start server

docs: https://docs.example.com
```

## Behavior

Cross-cutting code practices for supported languages.

Drop:
- null checks when Option/Optional/Nullable type system handles it
- explicit `new` / `new()` when `.create()` or type inference works
- getters that just return field: use field directly
- setters that just set field: use field assignment
- flag arguments: split into separate functions
- over-abstracted interfaces with single implementation
- premature optimization comments

Use:
- `?.` / optional chaining over nested null checks
- Result/Option/Either over exceptions for expected failures
- early returns over deep nesting
- dependency injection over singletons/global state
- immutable data structures when possible
- pure functions where side effects aren't needed
- constructor validation over setter validation
- fail fast: validate inputs at boundary
- structured concurrency: don't leak tasks/timers

Naming:
- `is_` / `has_` / `can_` for booleans
- verbs for functions: `compute_`, `fetch_`, `apply_`
- nouns for types: `User`, `Config`, `Event`
- `_async` suffix only when sync version exists
- `handle_` prefix for event/callback handlers

Async:
- parallel `await` when ops independent (Rust: `join!(a, b)`)
- `join!` over sequential `await` when results independent
- cancellation: `AbortController`/`CancellationToken` (JS/.NET), `CancellationToken` (Rust)
- avoid blocking in async code

Security:
- validate at trust boundaries
- sanitize inputs to prevent injection
- never log secrets / keys / tokens
- use constant-time comparison for secrets
- prefer allowlist over denylist

Performance:
- clone only when necessary (use `&` / borrowing)
- iterators over index loops when index not needed
- short-circuit: `&&` / `||` over `if` chains

Null/Optional:
- `??` / `unwrap_or` / `get_or_insert_with` over `if let Some`
- `.map().unwrap_or()` chains over nested if-lets

## Boundaries

cove shapes **code you write** and the artifacts listed above (PR bodies, commit
subjects, READMEs, CLI help, error strings, tests). It never compresses prose
addressed to a human reader: chat explanations, review comments aimed at a
teammate, issue/defect descriptions, design docs, migration notes.

Never let compression change behavior. If the terse form is not exactly
equivalent — different null semantics, different evaluation order, an extra
call, a dropped guard — keep the verbose form. Correct beats short, always.

Never apply a language rule outside its language. The per-language sections
are not interchangeable.

"stop cove" or "normal code": revert.
