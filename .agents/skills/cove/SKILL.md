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
- HTML/CSS
- Shell (bash/zsh)

## Persistence

ACTIVE EVERY RESPONSE. Still active if unsure. Off: "stop cove" / "normal code".

Default: **full**. Switch: `/cove lite|full`.

## Rules

Drop:
- `let` when type inferred or obvious
- unnecessary `mut`
- redundant closures: `|x| x` → `.identity()`
- verbose error handling when `?` suffices
- `-> ()` when obvious

Use:
- idiomatic short forms

Pattern: `[what] [how].`

## Rust

Drop:
- struct names in struct init when Type already known
- braces around single-line arms
- unnecessary `self` in impl blocks
- doc comments on obvious internals
- empty lines between trivial lines
- `Mutex<T>` when single-threaded: use `Rc<RefCell<T>>`

Use:
- turbofish: `Vec::with_capacity::<T>(n)`
- iter chains: `.filter().map().collect()`
- let chains: `if let Some(x) = foo() && x > 0`
- underscores for unused vars: `fn f(_: i32) {}`
- compact match arms: `x if x < 0 => todo!()`
- `..Default::default()` shorthand
- `?.` operator
- `??` for Option/Result fallback
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
- `self` in method bodies (already in class)
- `return` when last expression
- `None` checks: `if x is None` → `if not x` (only when x not falsy primitive)
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
    return [i.get_value() for i in items if i and i.get_value() > 0]
```

## C++

Drop:
- `this->` (already in class)
- `return` when last expression
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
- CSS custom properties for theming
- shorthand properties: `margin: 10px 5px` over `margin-top: 10px; margin-right: 5px; ...`
- `clip-path` / `filter` over images for effects
- `aspect-ratio` over padding hacks
- `gap` for spacing in flex/grid

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

## Java

Drop:
- `this.field` (already in class)
- `return` when last expression
- redundant `()` around lambdas: `x -> { return x; }` → `x -> x`
- empty constructor / initializer blocks `{}`
- `public` on interface methods (implicit)
- `@Override` when method clearly overrides (Lombok, etc.)
- explicit diamond `<>` when type inferred
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
    var results = new ArrayList<Integer>();
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
- `$(...)` when backticks work: `` `command` `` → `$(command)`
- `echo "$VAR"` → `echo $VAR` (unless needed)
- `then`/`fi` when single-line `&&`/`||` works
- `function` keyword (bash)
- `#!/bin/bash` when shebang not needed
- `exit 0` at end of script
- verbose `if [ $x -eq 0 ]; then ... fi`

Use:
- `$()` for command substitution
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
process_files() {
    for f in *.txt; do
        [[ -f $f ]] && grep "TODO" < "$f"
    done
}
```

## JavaScript

Drop:
- `function` keyword when arrow functions cleaner
- `return` when last expression
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
    firstName ? `${firstName} ${lastName}` : 'Unknown'
```

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

Code/commits/PRs: write normal. "stop cove" or "normal code": revert.
