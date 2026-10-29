// The Python side of the test runner. py.worker.js and scripts/check-learn.mjs both run it,
// so lessons are validated with exactly the code the page uses.
export const PY_HARNESS = String.raw`
import ast, contextlib, inspect, io, sys, traceback

def _fmt_exc(e):
    # code runs inside a coroutine, which turns a StopIteration (e.g. next() with no default) into RuntimeError
    if isinstance(e, RuntimeError) and isinstance(e.__cause__, StopIteration):
        e = e.__cause__
    if isinstance(e, AssertionError) and str(e):
        return str(e)
    if isinstance(e, SyntaxError):
        return f"SyntaxError: {e.msg} (line {e.lineno})"
    line = next((f.lineno for f in reversed(traceback.extract_tb(e.__traceback__)) if f.filename == "<your code>"), None)
    return type(e).__name__ + (f": {e}" if str(e) else "") + (f" (line {line})" if line else "")

def eq(actual, expected, msg=None):
    # like ==, but True and 1 are not the same answer
    same = actual == expected and (isinstance(actual, bool) == isinstance(expected, bool))
    if not same:
        raise AssertionError((msg + ": " if msg else "") + f"expected {expected!r}, got {actual!r}")

class Client:
    """Test helper for FastAPI apps: r = await Client(app).get("/items"). Same methods as httpx."""
    def __init__(self, app, headers=None):
        self.app, self.headers = app, headers or {}
    async def request(self, method, url, **kwargs):
        import httpx
        transport = httpx.ASGITransport(app=self.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=self.headers) as c:
            return await c.request(method, url, **kwargs)
    async def get(self, url, **kw): return await self.request("GET", url, **kw)
    async def post(self, url, **kw): return await self.request("POST", url, **kw)
    async def put(self, url, **kw): return await self.request("PUT", url, **kw)
    async def patch(self, url, **kw): return await self.request("PATCH", url, **kw)
    async def delete(self, url, **kw): return await self.request("DELETE", url, **kw)

_FLAGS = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT

async def _exec(src, filename, ns):
    result = eval(compile(src, filename, "exec", flags=_FLAGS), ns)
    if inspect.iscoroutine(result):
        await result

async def run_tests(user_code, tests):
    out = io.StringIO()
    results = []
    for t in tests:
        ns = {"__name__": "__main__", "eq": eq, "Client": Client}
        try:
            with contextlib.redirect_stdout(out):
                await _exec(user_code, "<your code>", ns)
                if t["code"]:
                    await _exec(t["code"], "<test>", ns)
            results.append({"name": t["name"], "pass": True})
        except BaseException as e:
            results.append({"name": t["name"], "pass": False, "error": _fmt_exc(e)})
    text = out.getvalue()
    return {"results": results, "logs": text[:-1].split("\n") if text.endswith("\n") else ([text] if text else [])}

_ready = set()

async def ensure_packages(names, load_package):
    todo = [n for n in names if n not in _ready]
    if not todo:
        return
    await load_package(todo)
    _ready.update(todo)
    if "fastapi" in todo:
        # Browsers have no threads; FastAPI runs plain def routes on a thread pool, so run them inline.
        import anyio.to_thread
        async def _inline(func, *args, **kwargs):
            return func(*args)
        anyio.to_thread.run_sync = _inline
`;
