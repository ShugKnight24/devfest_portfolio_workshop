---
name: site-audit
description: >
  Comprehensive website audit using Playwright MCP. Crawls a site to inventory pages, 
  check broken links, evaluate accessibility, extract design tokens (colors, typography, 
  spacing), and generate a structured report. Trigger: /site-audit <url>, "audit this site",
  "analyze this website".
---

# Website Audit Skill

You are performing a comprehensive website audit. Use the Playwright MCP browser tools to navigate, inspect, and evaluate the target site.

## Workflow

### Step 1: Initial Reconnaissance

1. Navigate to the target URL with `browser_navigate`
2. Take a screenshot of the homepage with `browser_take_screenshot`
3. Get the accessibility snapshot with `browser_snapshot`
4. Extract the page title, meta description, and key metadata using `browser_evaluate`:

```javascript
() => ({
  title: document.title,
  meta: Object.fromEntries(
    [...document.querySelectorAll("meta[name], meta[property]")].map((m) => [
      m.getAttribute("name") || m.getAttribute("property"),
      m.getAttribute("content"),
    ]),
  ),
  lang: document.documentElement.lang,
  charset: document.characterSet,
});
```

### Step 2: Site Structure & Navigation

1. Extract all internal links and build a sitemap:

```javascript
() =>
  [
    ...new Set(
      [...document.querySelectorAll("a[href]")]
        .map((a) => a.href)
        .filter((h) => h.startsWith(location.origin)),
    ),
  ].sort();
```

2. Visit each page (up to 20 pages max to stay reasonable)
3. For each page: take a screenshot, get snapshot, note the page title
4. Build a site structure tree

### Step 3: Design Token Extraction

Extract colors, fonts, and spacing from the site:

```javascript
() => {
  const styles = new Set();
  const colors = new Set();
  const fonts = new Set();
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.style) {
          if (rule.style.color) colors.add(rule.style.color);
          if (rule.style.backgroundColor)
            colors.add(rule.style.backgroundColor);
          if (rule.style.fontFamily) fonts.add(rule.style.fontFamily);
        }
      }
    } catch (e) {} // cross-origin sheets
  }
  // Also get computed styles from key elements
  const els = document.querySelectorAll(
    "h1,h2,h3,p,a,button,nav,header,footer",
  );
  els.forEach((el) => {
    const cs = getComputedStyle(el);
    colors.add(cs.color);
    colors.add(cs.backgroundColor);
    fonts.add(cs.fontFamily);
  });
  return {
    colors: [...colors].filter(Boolean),
    fonts: [...fonts].filter(Boolean),
  };
};
```

### Step 4: Image Inventory

```javascript
() =>
  [...document.querySelectorAll("img")].map((img) => ({
    src: img.src,
    alt: img.alt || "(MISSING ALT)",
    width: img.naturalWidth,
    height: img.naturalHeight,
    loading: img.loading,
    visible: img.offsetParent !== null,
  }));
```

### Step 5: Accessibility Check

Evaluate common accessibility issues:

```javascript
() => {
  const issues = [];
  // Images without alt
  document
    .querySelectorAll("img:not([alt])")
    .forEach((img) => issues.push({ type: "missing-alt", element: img.src }));
  // Links without text
  document.querySelectorAll("a").forEach((a) => {
    if (!a.textContent.trim() && !a.querySelector("img[alt]"))
      issues.push({ type: "empty-link", href: a.href });
  });
  // Missing form labels
  document
    .querySelectorAll("input:not([type=hidden]):not([type=submit])")
    .forEach((input) => {
      if (!input.labels?.length && !input.getAttribute("aria-label"))
        issues.push({
          type: "unlabeled-input",
          name: input.name || input.type,
        });
    });
  // Heading hierarchy
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
    (h) => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim().slice(0, 50),
    }),
  );
  // Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1)
      issues.push({
        type: "skipped-heading",
        from: headings[i - 1].level,
        to: headings[i].level,
      });
  }
  // Color contrast (basic check)
  const lowContrast = [];
  document.querySelectorAll("p, a, span, li, button").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.color === cs.backgroundColor)
      lowContrast.push(el.textContent.trim().slice(0, 30));
  });
  if (lowContrast.length)
    issues.push({ type: "same-color-text-bg", elements: lowContrast });

  return {
    issues,
    headings,
    totalLinks: document.querySelectorAll("a").length,
    totalImages: document.querySelectorAll("img").length,
  };
};
```

### Step 6: Performance & Technical

Check for common performance and technical issues:

```javascript
() => ({
  scripts: [...document.querySelectorAll("script[src]")].map((s) => s.src),
  stylesheets: [...document.querySelectorAll("link[rel=stylesheet]")].map(
    (l) => l.href,
  ),
  viewport: document.querySelector("meta[name=viewport]")?.content,
  responsive: !!document.querySelector("meta[name=viewport]"),
  favicon: !!document.querySelector("link[rel*=icon]"),
  canonical: document.querySelector("link[rel=canonical]")?.href,
  robots: document.querySelector("meta[name=robots]")?.content,
  openGraph: !!document.querySelector('meta[property^="og:"]'),
  structuredData: [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ].length,
});
```

### Step 7: Report

Generate a structured report with these sections:

1. **Site Overview**: URL, title, description, language, page count
2. **Site Structure**: Page hierarchy / sitemap
3. **Visual Design**: Color palette (hex values), typography (font families, sizes), key screenshots
4. **Content Inventory**: Pages with titles, word counts, image counts
5. **Image Inventory**: All images with alt text status, dimensions
6. **Accessibility Issues**: Categorized by severity
7. **Technical Health**: Scripts, stylesheets, meta tags, SEO basics
8. **Recommendations**: Prioritized list of improvements

## Rules

- Always start with a screenshot so the user can see what you see
- Be thorough but don't visit more than 20 pages (suggest full crawl if larger)
- Report specific, actionable issues - not vague suggestions
- Include raw data (hex colors, font names, URLs) that can be used directly in redesign work
- Save the audit findings to persistent memory for reference in future sessions
