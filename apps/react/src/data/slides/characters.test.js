import { describe, it, expect } from "vitest";
import { characters, getBySeries, getCharacter, getCharacters } from "./characters";
import { EMBLEMS } from "../../components/Icons/CharacterEmblems";

const REQUIRED = ["id", "name", "series", "role", "trait", "lesson", "emblem"];

describe("character roster", () => {
  it("should give every entry the full shape the card renderer reads", () => {
    for (const c of characters) {
      for (const field of REQUIRED) {
        expect(c[field], `"${c.id}" is missing ${field}`).toBeTruthy();
        expect(typeof c[field]).toBe("string");
      }
      // The image slot exists but ships empty — the owner drops in his own
      // licensed art at public/assets/images/characters/<id>.jpg.
      expect(c).toHaveProperty("image");
      expect(typeof c.image).toBe("string");
    }
  });

  it("should keep ids unique so slide keys and DOM ids never collide", () => {
    const ids = characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should be a genuinely combined roster, not a Reacher deck with a cameo", () => {
    const reacher = getBySeries("reacher");
    const chainsaw = getBySeries("chainsaw");
    expect(reacher.length).toBeGreaterThanOrEqual(6);
    expect(chainsaw.length).toBeGreaterThanOrEqual(6);
    expect(reacher.length + chainsaw.length).toBe(characters.length);
    expect(new Set(characters.map((c) => c.series))).toEqual(new Set(["reacher", "chainsaw"]));
  });

  it("should carry a lesson that is an actual engineering takeaway", () => {
    for (const c of characters) {
      expect(c.lesson.length, `"${c.id}" lesson is too thin`).toBeGreaterThan(40);
    }
  });

  it("should resolve every emblem id to a real emblem component", () => {
    for (const c of characters) {
      expect(EMBLEMS[c.emblem], `no emblem for "${c.emblem}" (${c.id})`).toBeTypeOf("function");
    }
  });

  it("should carry Finlay as the Chesterton's Fence anchor", () => {
    const finlay = getCharacter("finlay");
    expect(finlay).toBeDefined();
    expect(finlay.series).toBe("reacher");
    expect(finlay.emblem).toBe("fence-gap");
    expect(finlay.lesson).toContain("Chesterton");
  });

  it("should look up by id and resolve id lists, ignoring unknown ids", () => {
    expect(getCharacter("denji").name).toBe("Denji");
    expect(getCharacter("nobody")).toBeUndefined();
    expect(getCharacters(["denji", "nobody", "pochita"]).map((c) => c.id)).toEqual([
      "denji",
      "pochita",
    ]);
  });
});
