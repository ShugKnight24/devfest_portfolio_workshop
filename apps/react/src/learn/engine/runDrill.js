// Test runner shared by the browser worker and scripts/check-learn.mjs.
// Each test gets a fresh scope: user code + test body are compiled together as one async function,
// so top-level declarations in the user's code are visible to the test.
export async function runDrill(code, tests, perTestMs) {
  perTestMs = perTestMs || 2000;
  const logs = [];
  // console.log formatting close to Node's: strings print raw at the top level and quoted inside
  // arrays/objects, and undefined stays undefined (JSON.stringify would turn it into null)
  const inspect = (v, depth) => {
    if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
    if (v === undefined || v === null || typeof v !== 'object') {
      if (typeof v === 'function') return `[Function: ${v.name || '(anonymous)'}]`;
      if (typeof v === 'bigint') return v + 'n';
      return Object.is(v, -0) ? '-0' : String(v);
    }
    if (depth > 4) return Array.isArray(v) ? '[Array]' : '[Object]';
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof Map) return `Map(${v.size}) {${v.size ? ' ' + [...v].map(([k, x]) => `${inspect(k, depth + 1)} => ${inspect(x, depth + 1)}`).join(', ') + ' ' : ''}}`;
    if (v instanceof Set) return `Set(${v.size}) {${v.size ? ' ' + [...v].map((x) => inspect(x, depth + 1)).join(', ') + ' ' : ''}}`;
    if (v instanceof Promise) return 'Promise { <pending> }';
    if (Array.isArray(v)) return v.length ? `[ ${v.map((x) => inspect(x, depth + 1)).join(', ')} ]` : '[]';
    const keys = Object.keys(v);
    const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
    // class instances print with their class name, like Node: Point { x: 1, y: 2 }
    const cls = v.constructor && v.constructor !== Object && v.constructor.name ? v.constructor.name + ' ' : '';
    return cls + (keys.length ? `{ ${keys.map((k) => `${key(k)}: ${inspect(v[k], depth + 1)}`).join(', ')} }` : '{}');
  };
  const fmt = (v) => inspect(v, 0);
  const consoleShim = {
    log: (...a) => logs.push(a.map(fmt).join(' ')),
    error: (...a) => logs.push('[error] ' + a.map(fmt).join(' ')),
    warn: (...a) => logs.push('[warn] ' + a.map(fmt).join(' ')),
  };
  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
    if (a instanceof Map && b instanceof Map) return deepEqual([...a], [...b]);
    if (a instanceof Set && b instanceof Set) return deepEqual([...a], [...b]);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  const helpers = {
    assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); },
    eq(actual, expected, msg) {
      if (!deepEqual(actual, expected)) throw new Error((msg ? msg + ': ' : '') + 'expected ' + fmt(expected) + ', got ' + fmt(actual));
    },
    throws(fn, msg) {
      let threw = false;
      try { fn(); } catch (e) { threw = true; }
      if (!threw) throw new Error(msg || 'expected function to throw');
    },
    async rejects(p, msg) {
      let threw = false;
      try { await (typeof p === 'function' ? p() : p); } catch (e) { threw = true; }
      if (!threw) throw new Error(msg || 'expected promise to reject');
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    console: consoleShim,
  };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const names = Object.keys(helpers);
  const results = [];
  for (const t of tests) {
    const start = Date.now();
    try {
      const fn = new AsyncFunction(...names, code + '\n;\n' + t.code);
      let timer;
      await Promise.race([
        fn(...names.map((n) => helpers[n])),
        new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timed out after ' + perTestMs + 'ms')), perTestMs); }),
      ]);
      clearTimeout(timer);
      results.push({ name: t.name, pass: true, ms: Date.now() - start });
    } catch (e) {
      results.push({ name: t.name, pass: false, error: (e && e.message) || String(e), ms: Date.now() - start });
    }
  }
  return { results, logs };
}
