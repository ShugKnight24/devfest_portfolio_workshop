import { describe, it, expect } from "vitest";
import { themes, defaultTheme, themeCategories } from "@portfolio/themes";
import {
  resolveThemeTokens,
  contrastRatio,
  CONTRAST_TARGETS,
  TOKEN_KEYS,
  mixColors,
} from "@portfolio/themes/tokens";

/**
 * The guard that keeps the palette honest.
 *
 * Before the contrast-aware resolver landed, 28 of 34 themes failed WCAG AA
 * somewhere — `monochrome`'s primary measured 1.03:1 against its own dark
 * surface, which is invisible, not merely tight. Most themes declare only 7 of
 * the 17 tokens, so the other ten are derived; these tests assert the derivation
 * produces readable results for EVERY theme, not just the ones anyone looked at.
 *
 * If you add a theme and this fails, fix the theme's colours. Do not lower a
 * target — the project requires full WCAG AA.
 */

const themeEntries = Object.entries(themes);

describe("theme token resolution", () => {
  it("should resolve every declared token for every theme", () => {
    for (const [name, theme] of themeEntries) {
      const tokens = resolveThemeTokens(theme);
      for (const key of TOKEN_KEYS) {
        expect(tokens[key], `${name}.${key} missing`).toBeTruthy();
        expect(tokens[key], `${name}.${key} is not a hex colour`).toMatch(
          /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/
        );
      }
    }
  });

  it("should pass every WCAG contrast target for every theme", () => {
    const failures = [];
    for (const [name, theme] of themeEntries) {
      const tokens = resolveThemeTokens(theme);
      for (const [a, b, min] of CONTRAST_TARGETS) {
        const ratio = contrastRatio(tokens[a], tokens[b]);
        if (ratio < min) {
          failures.push(`${name}: ${a}/${b} = ${ratio.toFixed(2)} (need ${min})`);
        }
      }
    }
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });

  it("should keep brand accents legible on both canvases", () => {
    const failures = [];
    for (const [name, theme] of themeEntries) {
      const t = resolveThemeTokens(theme);
      // Accent and secondary are used for badges and rules on dark surfaces.
      for (const key of ["accent", "secondary"]) {
        const ratio = contrastRatio(t[key], t.surfaceDark);
        if (ratio < 3) failures.push(`${name}: ${key}/surfaceDark = ${ratio.toFixed(2)} (need 3)`);
      }
    }
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });

  it("should keep light-mode brand text legible on its own chip tint", () => {
    // `text-(--color-primary)` very often sits on `bg-(--color-primary)/10` or
    // `/15`. The tint is darker than the plane under it, so a colour that only
    // clears the bare plane still fails on the chip.
    const failures = [];
    for (const [name, theme] of themeEntries) {
      const t = resolveThemeTokens(theme);
      for (const key of ["primaryOnLight", "secondaryOnLight", "accentOnLight"]) {
        for (const plane of ["surface", "background", "surfaceHover"]) {
          const ratio = contrastRatio(t[key], mixColors(t[key], 0.15, t[plane]));
          if (ratio < 4.5) failures.push(`${name}: ${key} on 15% tint over ${plane} = ${ratio.toFixed(2)}`);
        }
      }
    }
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });

  it("should give surfaces a visible step off their canvas", () => {
    // A card that renders identically to the page behind it is not a card.
    for (const [name, theme] of themeEntries) {
      const t = resolveThemeTokens(theme);
      expect(t.surfaceDark.toLowerCase(), `${name}: surfaceDark === dark`).not.toBe(
        t.dark.toLowerCase()
      );
      expect(t.surface.toLowerCase(), `${name}: surface === background`).not.toBe(
        t.background.toLowerCase()
      );
    }
  });

  it("should preserve an authored colour unless that colour fails its target", () => {
    // Readability outranks authorial intent, but only where they actually
    // conflict. `reacher` authored mutedTextDark at #64748b, which measures
    // 4.08:1 on its own dark surface — below AA — so the resolver corrects it.
    // Anything that already passes must come through untouched.
    const targetsFor = (key) => CONTRAST_TARGETS.filter(([a]) => a === key);

    for (const [name, theme] of themeEntries) {
      const t = resolveThemeTokens(theme);
      for (const [key, authored] of Object.entries(theme.colors)) {
        if (t[key] === undefined) continue;
        if (t[key].toLowerCase() === authored.toLowerCase()) continue;

        // It changed, so it must have been failing something.
        const targets = targetsFor(key);
        expect(
          targets.length,
          `${name}.${key} was changed but has no contrast target justifying it`
        ).toBeGreaterThan(0);

        const wasFailing = targets.some(([, against, min]) => {
          const bg = theme.colors[against] ?? t[against];
          return contrastRatio(authored, bg) < min;
        });
        expect(
          wasFailing,
          `${name}.${key} was changed from ${authored} to ${t[key]} but already passed`
        ).toBe(true);
      }
    }
  });
});

describe("default theme", () => {
  it("should default to the Pull the Cord talk palette", () => {
    expect(defaultTheme).toBe("pullTheCord");
    expect(themes[defaultTheme]).toBeDefined();
  });

  it("should list the default first, both in the themes and the keynote category", () => {
    expect(Object.keys(themes)[0]).toBe(defaultTheme);
    expect(themeCategories.tactical.themes[0]).toBe(defaultTheme);
  });

  it("should carry both series in its palette", () => {
    const { colors, name } = themes.pullTheCord;
    // Pochita orange for the pull, Reacher denim for the backup, blood red after.
    expect(colors.primary.toLowerCase()).toBe("#ff7a1a");
    expect(colors.secondary.toLowerCase()).toBe("#86a8cc");
    expect(colors.accent.toLowerCase()).toBe("#f03a3a");
    expect(name).toBe("Pull the Cord");
  });

  it("should not be a recolour of Reacher x Chainsaw", () => {
    const a = themes.pullTheCord.colors;
    const b = themes.reacherChainsaw.colors;
    for (const key of ["primary", "secondary", "accent", "background", "dark"]) {
      expect(a[key].toLowerCase(), `${key} matches reacherChainsaw`).not.toBe(b[key].toLowerCase());
    }
  });
});

// Both hand-tuned palettes ship: the talk default and the former house palette.
describe.each(["pullTheCord", "reacherChainsaw"])("signature theme %s", (id) => {
  it("should author all 17 tokens by hand", () => {
    const authored = Object.keys(themes[id].colors);
    expect(authored).toHaveLength(17);
  });

  it("should need no auto-correction — the palette is hand-tuned", () => {
    const theme = themes[id];
    const t = resolveThemeTokens(theme);
    for (const [key, authored] of Object.entries(theme.colors)) {
      expect(t[key].toLowerCase(), `${key} was corrected`).toBe(authored.toLowerCase());
    }
  });

  it("should be reachable from the theme switcher", () => {
    const listed = Object.values(themeCategories).some((cat) => cat.themes.includes(id));
    expect(listed, `${id} is not in any switcher category`).toBe(true);
  });
});

describe("reacherChainsaw palette", () => {
  it("should carry both series in its palette", () => {
    const { colors } = themes.reacherChainsaw;
    // Cyan for Reacher's deduction, crimson for Chainsaw Man's force.
    expect(colors.primary.toLowerCase()).toBe("#00f0c0");
    expect(colors.accent.toLowerCase()).toBe("#ff1744");
    expect(themes.reacherChainsaw.name).toContain("Chainsaw");
  });
});

describe("theme switcher integrity", () => {
  it("should only list themes that actually exist", () => {
    for (const [catId, cat] of Object.entries(themeCategories)) {
      for (const id of cat.themes) {
        expect(themes[id], `category "${catId}" lists unknown theme "${id}"`).toBeDefined();
      }
    }
  });
});
