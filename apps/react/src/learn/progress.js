import { useCallback, useSyncExternalStore } from "react";

// Learner progress for /learn, one object per lesson keyed "track/lesson".
// Per-step maps are keyed by step index: done, code (task editor), hint (0 none, 1 hint, 2 solution),
// solved (hint level when first solved), guess / got (predict steps), mc (check steps).
const KEY = "learn-progress-v1";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { lessons: {} };
  } catch {
    return { lessons: {} };
  }
};

let store = read();
const listeners = new Set();

function commit() {
  store = { ...store };
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or blocked: progress just lives for this tab
  }
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const emptyLesson = () => ({ step: 0, done: {}, code: {}, hint: {}, solved: {}, guess: {}, got: {}, mc: {} });

export const lessonState = (key) => store.lessons[key] || emptyLesson();

export function updateLesson(key, fn) {
  const next = structuredClone(lessonState(key));
  fn(next);
  store.lessons = { ...store.lessons, [key]: next };
  commit();
}

export function resetLesson(key) {
  const { [key]: _, ...rest } = store.lessons;
  store.lessons = rest;
  commit();
}

export function useProgress() {
  return useSyncExternalStore(subscribe, () => store, () => store);
}

export function useLesson(key) {
  const all = useProgress();
  const st = all.lessons[key] || emptyLesson();
  const update = useCallback((fn) => updateLesson(key, fn), [key]);
  return [st, update];
}

// How far through a lesson: share of steps marked done.
export const lessonPercent = (all, key, stepCount) => {
  const done = Object.values(all.lessons[key]?.done || {}).filter(Boolean).length;
  return stepCount ? Math.round((Math.min(done, stepCount) / stepCount) * 100) : 0;
};
