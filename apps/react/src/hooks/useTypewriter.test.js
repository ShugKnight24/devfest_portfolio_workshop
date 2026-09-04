/**
 * useTypewriter Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./useTypewriter";

describe("useTypewriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with empty text", () => {
    const { result } = renderHook(() =>
      useTypewriter({ words: ["Hello"], typingSpeed: 100 })
    );
    expect(result.current).toBe("");
  });

  it("should type out characters over time", () => {
    const { result } = renderHook(() =>
      useTypewriter({ words: ["Hi"], typingSpeed: 100 })
    );

    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("H");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("Hi");
  });

  it("should respect custom typing speed", () => {
    const { result } = renderHook(() =>
      useTypewriter({ words: ["AB"], typingSpeed: 50 })
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("A");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("AB");
  });

  it("should start deleting after completing a word when loop is true", () => {
    const { result } = renderHook(() =>
      useTypewriter({
        words: ["Hi"],
        typingSpeed: 100,
        deletingSpeed: 50,
        loop: true,
      })
    );

    // Type "Hi"
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("Hi");

    // Wait for pause (1500ms)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Start deleting
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("H");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("");
  });

  it("should NOT start deleting when loop is false and on last word", () => {
    const { result } = renderHook(() =>
      useTypewriter({
        words: ["Test"],
        typingSpeed: 100,
        loop: false,
      })
    );

    // Type "Test"
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe("Test");

    // Wait much longer than the pause
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should still be "Test" (not deleted)
    expect(result.current).toBe("Test");
  });

  it("should cycle through multiple words when loop is true", () => {
    const { result } = renderHook(() =>
      useTypewriter({
        words: ["A", "B"],
        typingSpeed: 100,
        deletingSpeed: 100,
        loop: true,
      })
    );

    // Type "A"
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("A");

    // Wait for pause + delete + type "B"
    act(() => {
      vi.advanceTimersByTime(1500); // pause
    });
    act(() => {
      vi.advanceTimersByTime(100); // delete "A"
    });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(100); // type "B"
    });
    expect(result.current).toBe("B");
  });
});
