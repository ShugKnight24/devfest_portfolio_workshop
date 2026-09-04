---
name: redesign
description: >
  Website redesign workflow. Uses site-audit data + Playwright MCP to plan and execute
  a website redesign from existing site to new barebones HTML/CSS. Extracts content,
  creates scaffolds, iterates with visual feedback. Trigger: /redesign <url>, 
  "redesign this site", "rebuild this website".
---

# Website Redesign Skill

You are guiding a website redesign project. This is a structured workflow that takes an existing website and produces a clean, modern, barebones HTML/CSS replacement.

## Prerequisites

- Playwright MCP must be configured (browser tools available)
- Run `/site-audit` first if you haven't already audited the target site

## Workflow

### Phase 1: Discovery

1. **Audit the existing site** (use site-audit skill if not already done)
2. **Extract ALL content** from the existing site:

```javascript
() => {
  const content = {};
  // Get all text nodes organized by section
  const sections = document.querySelectorAll(
    "header, nav, main, section, article, aside, footer",
  );
  sections.forEach((section, i) => {
    content[section.tagName.toLowerCase() + "_" + i] = {
      tag: section.tagName,
      id: section.id,
      classes: [...section.classList],
      text: section.innerText,
      html:
        section.innerHTML.length < 5000
          ? section.innerHTML
          : "(too large, extract separately)",
    };
  });
  // If no semantic sections, fall back to body
  if (!sections.length) {
    content.body = document.body.innerText;
  }
  return content;
};
```

3. **Inventory all media assets**:

```javascript
() => ({
  images: [...document.querySelectorAll("img")].map((i) => ({
    src: i.src,
    alt: i.alt,
    role: i.closest("header")
      ? "header"
      : i.closest("nav")
        ? "nav"
        : i.closest("footer")
          ? "footer"
          : "content",
  })),
  videos: [
    ...document.querySelectorAll(
      "video source, iframe[src*=youtube], iframe[src*=vimeo]",
    ),
  ].map((v) => v.src),
  icons: [...document.querySelectorAll("svg, [class*=icon], link[rel*=icon]")]
    .length,
});
```

4. **Map the user journey** - identify key pages and their purpose:
   - Homepage
   - About/Team
   - Services/Products
   - Contact
   - Blog/Content
   - Any other sections

### Phase 2: Design Direction

Discuss with the user:

1. **What's working?** What elements of the current site should be preserved?
2. **What's broken?** What needs to change?
3. **Target audience** - who visits this site?
4. **Goals** - what should visitors DO on the site?
5. **Style direction** - modern minimal, bold/expressive, corporate/professional?
6. **Technical constraints** - hosting, CMS, any requirements?

### Phase 3: Scaffold Generation

Build the new site incrementally. Start barebones:

1. **Create project structure**:

```
project-name/
  index.html
  styles.css
  /images/       (download key images from old site)
  /pages/        (additional pages)
```

2. **HTML first, no styling** - semantic, accessible markup with real content from the old site
3. **CSS second** - mobile-first, no frameworks unless user requests one
4. **Progressive enhancement** - JS only where truly needed

### Phase 4: Iterative Refinement

Use Playwright to verify the new site visually:

1. Open the local file in the browser: `browser_navigate` to `file:///path/to/index.html`
2. Take screenshots at multiple viewport sizes:
   - Mobile: resize to 375x812
   - Tablet: resize to 768x1024
   - Desktop: resize to 1280x720
   - Wide: resize to 1920x1080
3. Compare against the original site screenshots
4. Iterate on layout, typography, spacing based on visual feedback

### Phase 5: Quality Check

Before delivering:

1. Validate HTML structure (semantic elements, heading hierarchy)
2. Check accessibility (alt text, labels, contrast, keyboard nav)
3. Test all links work
4. Verify responsive behavior across breakpoints
5. Check page load performance (minimal assets, optimized images)
6. Compare content completeness against original site inventory

## Principles

- **Content first**: The content from the old site IS the design constraint. Don't lose anything.
- **Barebones by default**: Plain HTML + CSS. No build tools, no frameworks, no dependencies unless specifically needed.
- **Mobile first**: Start with mobile layout, enhance for larger screens.
- **Accessible**: Semantic HTML, proper heading hierarchy, alt text, sufficient contrast.
- **Progressive**: Works without JavaScript. JS enhances, doesn't gate.
- **Honest**: If the original design has genuine merit, say so. Don't redesign for the sake of it.

## Output

Save key decisions and content inventory to persistent memory so future sessions can reference them.
