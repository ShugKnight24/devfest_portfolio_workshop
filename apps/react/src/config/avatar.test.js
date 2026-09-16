/**
 * Avatar config tests
 *
 * `normalizeAvatar` is the only thing standing between a stale/corrupt
 * localStorage blob and a broken landing page, so it is tested hard.
 */

import { describe, it, expect } from "vitest";
import {
  AVATAR_CHOICES,
  AVATAR_TOGGLES,
  DEFAULT_AVATAR,
  SKIN_TONES,
  HAIR_STYLES,
  describeAvatar,
  findOption,
  normalizeAvatar,
  randomAvatar,
} from "./avatar";

const CHOICE_KEYS = AVATAR_CHOICES.map((choice) => choice.id);
const TOGGLE_KEYS = AVATAR_TOGGLES.map((toggle) => toggle.id);
const ALL_KEYS = [...CHOICE_KEYS, ...TOGGLE_KEYS];

const expectComplete = (avatar) => {
  expect(Object.keys(avatar).sort()).toEqual([...ALL_KEYS].sort());
  AVATAR_CHOICES.forEach(({ id, options }) => {
    expect(options.some((option) => option.id === avatar[id])).toBe(true);
  });
  TOGGLE_KEYS.forEach((key) => {
    expect(typeof avatar[key]).toBe("boolean");
  });
};

describe("normalizeAvatar", () => {
  it("passes a fully valid config through unchanged", () => {
    const valid = {
      skinTone: "espresso",
      hairStyle: "locs",
      hairColor: "auburn",
      facialHair: "goatee",
      topColor: "rust",
      glasses: false,
      headphones: false,
      display: "dual",
      deskSurface: "concrete",
      chairColor: "crimson",
      backdrop: "day",
      companion: "luna",
      companionPose: "curled",
      mug: false,
      plant: false,
      books: true,
      lamp: false,
      mechKeyboard: true,
      phone: true,
    };

    expect(normalizeAvatar(valid)).toEqual(valid);
  });

  it("fills the gaps in a partial config from the defaults", () => {
    const result = normalizeAvatar({ skinTone: "deep", display: "monitor" });

    expect(result.skinTone).toBe("deep");
    expect(result.display).toBe("monitor");
    expect(result.hairStyle).toBe(DEFAULT_AVATAR.hairStyle);
    expect(result.chairColor).toBe(DEFAULT_AVATAR.chairColor);
    expect(result.mug).toBe(DEFAULT_AVATAR.mug);
    expectComplete(result);
  });

  it("repairs unknown option ids back to the default for that axis", () => {
    const result = normalizeAvatar({
      skinTone: "chartreuse",
      hairStyle: "mullet-from-2009",
      display: "holodeck",
      backdrop: 42,
      chairColor: null,
    });

    expect(result.skinTone).toBe(DEFAULT_AVATAR.skinTone);
    expect(result.hairStyle).toBe(DEFAULT_AVATAR.hairStyle);
    expect(result.display).toBe(DEFAULT_AVATAR.display);
    expect(result.backdrop).toBe(DEFAULT_AVATAR.backdrop);
    expect(result.chairColor).toBe(DEFAULT_AVATAR.chairColor);
    expectComplete(result);
  });

  it("keeps known values while discarding unknown ones in the same object", () => {
    const result = normalizeAvatar({ skinTone: "porcelain", hairColor: "neon-plaid" });

    expect(result.skinTone).toBe("porcelain");
    expect(result.hairColor).toBe(DEFAULT_AVATAR.hairColor);
  });

  it("coerces non-boolean toggle values to the default rather than trusting them", () => {
    const result = normalizeAvatar({
      glasses: "yes",
      headphones: 1,
      mug: null,
      plant: undefined,
      books: "true",
    });

    TOGGLE_KEYS.forEach((key) => {
      expect(result[key]).toBe(DEFAULT_AVATAR[key]);
    });
  });

  it("accepts explicit false for toggles", () => {
    const result = normalizeAvatar({ glasses: false, lamp: false });

    expect(result.glasses).toBe(false);
    expect(result.lamp).toBe(false);
  });

  it("returns the defaults for empty input", () => {
    expect(normalizeAvatar({})).toEqual({ ...DEFAULT_AVATAR });
  });

  it("returns the defaults for null, undefined and non-objects", () => {
    [null, undefined, "", 0, false, "laptop", 12, [], [1, 2, 3], NaN].forEach((input) => {
      const result = normalizeAvatar(input);
      expect(result).toEqual({ ...DEFAULT_AVATAR });
      expectComplete(result);
    });
  });

  it("drops keys it does not recognise", () => {
    const result = normalizeAvatar({ skinTone: "tan", jetpack: true, legacyHair: "spiky" });

    expect(result).not.toHaveProperty("jetpack");
    expect(result).not.toHaveProperty("legacyHair");
    expectComplete(result);
  });

  it("does not mutate its input or the frozen defaults", () => {
    const input = { skinTone: "fair" };
    const result = normalizeAvatar(input);

    result.skinTone = "espresso";

    expect(input).toEqual({ skinTone: "fair" });
    // Assert the frozen defaults were not mutated, without pinning the value:
    // DEFAULT_AVATAR is the owner's likeness and is expected to be retuned.
    expect(DEFAULT_AVATAR.skinTone).not.toBe("espresso");
    expect(Object.isFrozen(DEFAULT_AVATAR)).toBe(true);
  });

  it("is idempotent", () => {
    const once = normalizeAvatar({ hairStyle: "braids", books: true, display: "nope" });
    expect(normalizeAvatar(once)).toEqual(once);
  });
});

describe("randomAvatar", () => {
  it("always produces a config that survives normalization untouched", () => {
    for (let i = 0; i < 40; i += 1) {
      const random = randomAvatar();
      expectComplete(random);
      expect(normalizeAvatar(random)).toEqual(random);
    }
  });
});

describe("findOption", () => {
  it("resolves a known id", () => {
    expect(findOption(SKIN_TONES, "deep").label).toBe("Deep");
  });

  it("falls back to the first option for an unknown id", () => {
    expect(findOption(HAIR_STYLES, "not-a-style")).toBe(HAIR_STYLES[0]);
  });
});

describe("describeAvatar", () => {
  it("describes the current customization in plain language", () => {
    const description = describeAvatar({
      skinTone: "deep",
      hairStyle: "locs",
      hairColor: "jet",
      glasses: true,
      headphones: false,
      display: "dual",
      mug: true,
      plant: false,
      books: false,
      lamp: false,
      mechKeyboard: false,
      phone: false,
    });

    expect(description).toMatch(/deep skin/i);
    expect(description).toMatch(/jet black locs/i);
    expect(description).toMatch(/glasses/i);
    expect(description).not.toMatch(/headphones/i);
    expect(description).toMatch(/dual monitors/i);
    expect(description).toMatch(/coffee mug/i);
  });

  it("says the head is shaved instead of naming a hair colour", () => {
    const description = describeAvatar({ hairStyle: "bald", hairColor: "ginger" });

    expect(description).toMatch(/shaved head/i);
    expect(description).not.toMatch(/ginger/i);
  });

  it("reports an empty desk when every prop is off", () => {
    const off = Object.fromEntries(TOGGLE_KEYS.map((key) => [key, false]));
    expect(describeAvatar(off)).toMatch(/desk is clear/i);
  });

  it("produces a usable label for garbage input", () => {
    expect(describeAvatar(undefined)).toEqual(describeAvatar(DEFAULT_AVATAR));
    expect(describeAvatar("not-an-avatar")).toEqual(describeAvatar({}));
  });
});
