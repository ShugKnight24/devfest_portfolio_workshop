import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mdBlocks, md } from "./engine/markdown";
import { runDrill } from "./engine/runDrill";
import { LESSONS, TRACKS, findByKey, lessonLang } from "./content";
import { LearnPage } from "./LearnPage";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:track" element={<LearnPage />} />
        <Route path="/learn/:track/:lesson" element={<LearnPage />} />
        <Route path="/learn/:track/:lesson/:step" element={<LearnPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("markdown", () => {
  it("splits fenced code out of the html so it can be runnable", () => {
    const blocks = mdBlocks("Intro **bold**\n\n~~~js\nconsole.log(1)\n~~~\n\nAfter");
    expect(blocks.map((b) => b.type)).toEqual(["html", "code", "html"]);
    expect(blocks[1]).toEqual({ type: "code", lang: "js", code: "console.log(1)" });
    expect(blocks[0].html).toBe("<p>Intro <strong>bold</strong></p>");
  });

  it("escapes html inside text and code", () => {
    expect(md("a <b> `<i>`")).toBe("<p>a &lt;b&gt; <code>&lt;i&gt;</code></p>");
  });

  it("only links http(s) and in-app paths", () => {
    expect(md("[x](javascript:alert(1))")).not.toContain("<a");
    expect(md("[x](/learn/js)")).toContain('<a href="/learn/js">');
  });
});

describe("runDrill", () => {
  it("passes and fails tests and captures console output", async () => {
    const { results, logs } = await runDrill("const add = (a, b) => a + b; console.log(add(1, 2));", [
      { name: "adds", code: "eq(add(2, 2), 4)" },
      { name: "wrong", code: "eq(add(2, 2), 5)" },
    ]);
    expect(results.map((r) => r.pass)).toEqual([true, false]);
    expect(results[1].error).toBe("expected 5, got 4");
    expect(logs).toEqual(["3", "3"]);
  });
});

describe("content", () => {
  it("has lessons for the foundation tracks with unique ids", () => {
    for (const t of TRACKS) {
      const ids = LESSONS[t.id].map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(LESSONS.js.length).toBeGreaterThan(0);
    expect(LESSONS.python.length).toBeGreaterThan(0);
  });

  it("resolves builds links and lesson languages", () => {
    const python = LESSONS.python[0];
    expect(lessonLang(python)).toBe("py");
    for (const t of TRACKS) for (const l of LESSONS[t.id]) for (const b of l.builds || []) expect(findByKey(b), `${l.track}/${l.id} → ${b}`).toBeTruthy();
  });
});

describe("LearnPage", () => {
  beforeEach(() => localStorage.clear());

  it("shows every track on the map", () => {
    renderAt("/learn");
    for (const t of TRACKS) expect(screen.getByRole("heading", { name: t.title })).toBeInTheDocument();
  });

  it("lists a track's lessons", () => {
    renderAt("/learn/js");
    expect(screen.getByRole("heading", { level: 1, name: "JavaScript foundations" })).toBeInTheDocument();
    expect(screen.getByText(LESSONS.js[0].title)).toBeInTheDocument();
  });

  it("opens a lesson at the requested step with step pills", () => {
    const l = LESSONS.js[0];
    renderAt(`/learn/js/${l.id}/2`);
    expect(screen.getByRole("heading", { level: 1, name: l.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: l.steps[1].title })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Step \d+:/ })).toHaveLength(l.steps.length);
  });

  it("says so when a lesson doesn't exist", () => {
    renderAt("/learn/js/nope");
    expect(screen.getByRole("heading", { name: "That lesson isn't here" })).toBeInTheDocument();
  });
});
