// DSA course · lesson 9. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
const BUILD = `function buildGraph(edges) {
  const graph = new Map();
  for (const [a, b] of edges) {
    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);
    graph.get(a).push(b);
    graph.get(b).push(a);
  }
  return graph;
}`;

// a - b
// |   |
// c - d - e      f - g
const EDGES = `const edges = [["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"], ["d", "e"], ["f", "g"]];`;

export default {
  id: 'graphs',
  builds: ['dsa/trees', 'dsa/hash-maps-and-sets', 'dsa/stacks-and-queues'],
  title: 'Graphs: adjacency lists, BFS and DFS',
  goal: 'Turn an edge list into an adjacency list, walk it with DFS and BFS using a visited Set, find shortest paths and count connected components.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A graph is a tree that lost its rules',
      md: `
In the trees lesson every node had one parent and there were no loops. A **graph** drops those rules: any node can connect to any other, and paths can loop back.

- **Nodes** (or vertices): the things. People, cities, packages.
- **Edges**: the connections. Friendships, roads, "needs".
- **Undirected**: the edge goes both ways (a friendship). **Directed**: one way (a follow, or "app needs react").

Problems usually hand you an **edge list**:

~~~
const edges = [["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"], ["d", "e"], ["f", "g"]];

    a - b
    |   |
    c - d - e        f - g
~~~

**The brute force:** to find a's neighbors, scan every edge looking for "a". That's O(E) per question, and a walk asks it for every node.

**The pattern:** build an **adjacency list** once: a \`Map\` from each node to an array of its neighbors. Then "who is next to a?" is one \`get\`, like the hash map lookups in lesson 3.

~~~
a → [b, c]
b → [a, d]
c → [a, d]
d → [b, c, e]
...
~~~
`,
    },
    {
      type: 'read',
      title: 'Building the adjacency list',
      md: `
For an undirected edge \`[a, b]\`, add **b to a's list and a to b's list**. Make an empty list the first time you see a node.

~~~js
${BUILD}

const graph = buildGraph([["a", "b"], ["a", "c"], ["b", "d"]]);
console.log(graph);
console.log(graph.get("a"));
~~~

This is **O(V + E)**: one pass over the edges, and each node gets one list. You'll reuse \`buildGraph\` for the rest of the lesson.
`,
    },
    {
      type: 'task',
      title: 'buildDirected',
      md: `
Make one change: a **directed** graph, where \`["a", "b"]\` means "a points to b" only.

\`buildDirected([["a", "b"], ["b", "c"]])\` returns a Map where:

~~~
a → ["b"]
b → ["c"]
c → []        (c still gets an entry, with no neighbors)
~~~

Start from \`buildGraph\` above and remove one line.
`,
      starter: `function buildDirected(edges) {
  const graph = new Map();
  for (const [a, b] of edges) {
    // your code here
  }
  return graph;
}
`,
      tests: [
        { name: 'a points to b, but b does not point back to a', code: `const g = buildDirected([["a", "b"], ["b", "c"]]);\neq(g.get("a"), ["b"]);\neq(g.get("b"), ["c"]);` },
        { name: 'a node with no outgoing edges gets an empty list', code: `const g = buildDirected([["a", "b"]]);\neq(g.get("b"), []);` },
        { name: 'an empty edge list gives an empty Map', code: `eq(buildDirected([]).size, 0);` },
      ],
      hint: 'Keep both `if (!graph.has(...)) graph.set(..., [])` lines, so every node gets a list. Keep only `graph.get(a).push(b)`.',
      solution: `function buildDirected(edges) {
  const graph = new Map();
  for (const [a, b] of edges) {
    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);
    graph.get(a).push(b);
  }
  return graph;
}
`,
    },
    {
      type: 'read',
      title: 'DFS on a graph needs a visited Set',
      md: `
DFS on a graph is the tree DFS with **one addition**: a \`Set\` of nodes you've already visited.

Trees can't loop, so you never needed it. In a graph, a → b → d → c → a is a circle, and without the Set you'd walk it forever.

~~~js
${BUILD}

${EDGES}
const graph = buildGraph(edges);

function dfs(node, visited, order) {
  if (visited.has(node)) return;       // been here: stop
  visited.add(node);                   // mark BEFORE going further
  order.push(node);
  for (const next of graph.get(node)) dfs(next, visited, order);
}

const order = [];
dfs("a", new Set(), order);
console.log(order);
~~~

Notice what **isn't** printed: \`f\` and \`g\`. They're not connected to \`a\`, so no walk from \`a\` reaches them. Keep that in mind; it's the trick behind counting components later.

Each node is visited once and each edge looked at a constant number of times, so DFS is **O(V + E)**.
`,
    },
    {
      type: 'predict',
      title: 'Forget the visited Set',
      md: 'Same graph shape, but the visited check is gone. What happens?',
      code: `const graph = new Map([
  ["a", ["b"]],
  ["b", ["a"]],
]);

let steps = 0;
function dfs(node) {
  steps++;
  for (const next of graph.get(node)) dfs(next);
}

dfs("a");
console.log(steps);`,
      throws: true,
      output: `RangeError: Maximum call stack size exceeded`,
      explain: `
\`a\` visits \`b\`, which visits \`a\`, which visits \`b\`... forever. Each call waits on the next, the call stack fills up, and JavaScript throws a **RangeError**. The \`console.log\` never runs.

Two nodes and one edge are enough to break it. On a graph, always carry a \`visited\` Set.
`,
    },
    {
      type: 'task',
      title: 'canReach',
      md: `
\`canReach(graph, start, goal)\` returns \`true\` if there's any path from \`start\` to \`goal\`, and \`false\` otherwise. \`graph\` is a Map built by \`buildGraph\`.

~~~
canReach(graph, "a", "e")   → true
canReach(graph, "a", "g")   → false   (g is in a different piece)
~~~

Use DFS with a visited Set. Return \`true\` as soon as you reach \`goal\`.
`,
      starter: `function canReach(graph, start, goal) {
  const visited = new Set();
  function dfs(node) {
    // your code here
  }
  return dfs(start);
}
`,
      tests: [
        { name: 'a can reach e', code: `${BUILD}\n${EDGES}\neq(canReach(buildGraph(edges), "a", "e"), true);` },
        { name: 'a cannot reach g', code: `${BUILD}\n${EDGES}\neq(canReach(buildGraph(edges), "a", "g"), false);` },
        { name: 'a node can reach itself', code: `${BUILD}\n${EDGES}\neq(canReach(buildGraph(edges), "f", "f"), true);` },
      ],
      hint: 'In `dfs`: if `node === goal` return true; if visited, return false; add it; then for each neighbor, `if (dfs(next)) return true;`. After the loop, return false.',
      solution: `function canReach(graph, start, goal) {
  const visited = new Set();
  function dfs(node) {
    if (node === goal) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    for (const next of graph.get(node)) {
      if (dfs(next)) return true;
    }
    return false;
  }
  return dfs(start);
}
`,
      explain: 'The `if (dfs(next)) return true` line passes a "found it" back up through every call. Writing just `dfs(next)` throws that answer away, which is the most common bug here.',
    },
    {
      type: 'read',
      title: 'BFS finds the shortest path',
      md: `
DFS answers "can I get there?". It does **not** find the shortest way: it might wander a long route first.

**BFS** does, in a graph where every edge costs the same. It's the level-by-level walk from the trees lesson: first everything 1 step away, then everything 2 steps away, and so on. The first time BFS reaches a node is therefore by the fewest edges.

Keep a \`dist\` Map. It doubles as the visited set: a node is visited once it has a distance.

~~~js
${BUILD}

${EDGES}
const graph = buildGraph(edges);

function distancesFrom(start) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift();
    for (const next of graph.get(node)) {
      if (dist.has(next)) continue;          // already reached, by a path at least as short
      dist.set(next, dist.get(node) + 1);    // one more step than the node we came from
      queue.push(next);
    }
  }
  return dist;
}

console.log(distancesFrom("a"));
~~~

Also **O(V + E)**. If edges have different costs (road lengths), BFS isn't enough; that needs Dijkstra's algorithm, which swaps the queue for the heap from lesson 11.
`,
    },
    {
      type: 'predict',
      title: 'Distances on a ring',
      md: 'Five nodes in a circle. How far is each one from 1?',
      code: `const graph = new Map([
  [1, [2, 5]],
  [2, [1, 3]],
  [3, [2, 4]],
  [4, [3, 5]],
  [5, [4, 1]],
]);

const dist = new Map([[1, 0]]);
const queue = [1];
while (queue.length > 0) {
  const node = queue.shift();
  for (const next of graph.get(node)) {
    if (dist.has(next)) continue;
    dist.set(next, dist.get(node) + 1);
    queue.push(next);
  }
}
console.log(dist.get(3), dist.get(4));`,
      output: `2 2`,
      explain: `
Going round one way, 1 → 2 → 3 is 2 steps. Going the other way, 1 → 5 → 4 is 2 steps. BFS explores both directions at once, so it finds both short routes.

If you said \`2 3\`, you walked only clockwise. That's what DFS would do: follow one direction to the end.
`,
    },
    {
      type: 'task',
      title: 'shortestPath',
      md: `
\`shortestPath(graph, start, goal)\` returns the **number of edges** on the shortest path, or \`-1\` if \`goal\` can't be reached.

~~~
shortestPath(graph, "a", "e")   → 3     (a - b - d - e)
shortestPath(graph, "a", "a")   → 0
shortestPath(graph, "a", "g")   → -1
~~~

It's \`distancesFrom\` from the read step. You can build the whole \`dist\` Map and then look up \`goal\`, or return early when you reach it.
`,
      starter: `function shortestPath(graph, start, goal) {
  // your code here
}
`,
      tests: [
        { name: 'a to e is 3 edges', code: `${BUILD}\n${EDGES}\neq(shortestPath(buildGraph(edges), "a", "e"), 3);` },
        { name: 'a to a is 0', code: `${BUILD}\n${EDGES}\neq(shortestPath(buildGraph(edges), "a", "a"), 0);` },
        { name: 'an unreachable goal gives -1', code: `${BUILD}\n${EDGES}\neq(shortestPath(buildGraph(edges), "a", "g"), -1);` },
      ],
      hint: 'Copy the BFS from `distancesFrom`. After the loop, `return dist.has(goal) ? dist.get(goal) : -1;`',
      solution: `function shortestPath(graph, start, goal) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift();
    for (const next of graph.get(node)) {
      if (dist.has(next)) continue;
      dist.set(next, dist.get(node) + 1);
      queue.push(next);
    }
  }
  return dist.has(goal) ? dist.get(goal) : -1;
}
`,
    },
    {
      type: 'read',
      title: 'Counting connected components',
      md: `
A **connected component** is a piece of the graph where everything can reach everything else. The example graph has two: \`{a, b, c, d, e}\` and \`{f, g}\`.

Remember that DFS from \`a\` never reached \`f\`? Turn that into a counter:

1. Keep **one** visited Set for the whole run.
2. Loop over **every** node.
3. If a node isn't visited yet, it's the start of a new piece: add 1, then DFS from it to mark its whole piece as visited.

~~~
node a: not visited → count 1, DFS marks a b c d e
node b, c, d, e: already visited, skip
node f: not visited → count 2, DFS marks f g
node g: skip
~~~

Each node is still visited once overall, so it's **O(V + E)**. The same loop answers "number of islands", "number of friend groups" and "how many separate networks".

Watch for nodes with **no edges at all**. They don't appear in an edge list, so the problem has to give you the node list separately. Each one is a component on its own.
`,
    },
    {
      type: 'task',
      title: 'countComponents',
      md: `
\`countComponents(nodes, edges)\` returns how many connected components there are. \`nodes\` lists every node, including ones with no edges.

~~~
countComponents(["a","b","c","d","e","f","g"], edges)        → 2
countComponents(["a","b","c","d","e","f","g","h"], edges)    → 3   (h is alone)
~~~

The starter builds the graph for you, and gives nodes without edges an empty neighbor list. Write the loop from the last step and a small DFS.
`,
      starter: `${BUILD}

function countComponents(nodes, edges) {
  const graph = buildGraph(edges);
  for (const node of nodes) if (!graph.has(node)) graph.set(node, []);

  const visited = new Set();
  let count = 0;
  // your code here
  return count;
}
`,
      tests: [
        { name: 'the example graph has 2 components', code: `${EDGES}\neq(countComponents(["a", "b", "c", "d", "e", "f", "g"], edges), 2);` },
        { name: 'a node with no edges is its own component', code: `${EDGES}\neq(countComponents(["a", "b", "c", "d", "e", "f", "g", "h"], edges), 3);` },
        { name: 'three nodes and no edges give 3', code: `eq(countComponents(["x", "y", "z"], []), 3);` },
      ],
      hint: 'Write `function dfs(node) { if (visited.has(node)) return; visited.add(node); for (const next of graph.get(node)) dfs(next); }`. Then `for (const node of nodes) { if (!visited.has(node)) { count++; dfs(node); } }`.',
      solution: `${BUILD}

function countComponents(nodes, edges) {
  const graph = buildGraph(edges);
  for (const node of nodes) if (!graph.has(node)) graph.set(node, []);

  const visited = new Set();
  let count = 0;
  function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    for (const next of graph.get(node)) dfs(next);
  }
  for (const node of nodes) {
    if (!visited.has(node)) {
      count++;     // a node nobody reached yet starts a new piece
      dfs(node);   // mark the whole piece
    }
  }
  return count;
}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Why does graph DFS need a visited Set when tree DFS didn\'t?',
          choices: ['Graphs can have cycles, so you\'d loop forever', 'Sets are faster than arrays', 'Graphs have more nodes than trees'],
          answer: 0,
          explain: 'Trees never loop back. In a graph a → b → a is possible, and without the Set the recursion never stops.',
          why: { 1: 'Speed isn\'t the point: without it the walk doesn\'t end at all.', 2: 'Size has nothing to do with it. Two nodes are enough to loop.' },
        },
        {
          q: 'You need the **fewest** flights between two airports, every flight counting the same. Which walk?',
          choices: ['BFS', 'DFS', 'Either one; they find the same path'],
          answer: 0,
          explain: 'BFS reaches every node by the fewest edges first. DFS follows one route to the end and may find a long one.',
          why: { 1: 'DFS finds **a** path, not the shortest one.', 2: 'They visit the same nodes, but in a different order, and only BFS\'s order guarantees the shortest path.' },
        },
        {
          q: 'What is the time cost of BFS or DFS on a graph with V nodes and E edges?',
          choices: ['O(V + E)', 'O(V × E)', 'O(V²) always'],
          answer: 0,
          explain: 'Each node is visited once and each neighbor list is read once.',
          why: { 1: 'You never re-read every edge for every node.', 2: 'O(V²) is what an adjacency **matrix** costs. With lists, a sparse graph is much cheaper.' },
        },
        {
          q: 'In `countComponents`, what is the most common bug?',
          choices: ['Creating a new visited Set inside the loop', 'Using a Map for the graph', 'Looping over nodes instead of edges'],
          answer: 0,
          explain: 'One Set for the whole run is what stops you counting a piece twice. A fresh Set per node makes every node look like a new component.',
          why: { 1: 'A Map is the right tool for the adjacency list.', 2: 'Looping over nodes is correct: it\'s how you find isolated ones.' },
        },
      ],
    },
  ],
};
