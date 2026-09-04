/**
 * Portfolio App
 *
 * This file wires up all the interactive behavior:
 *   1. Render portfolio data into the DOM (skills badges, project cards)
 *   2. Theme switcher (5 presets, persisted to localStorage)
 *   3. Dark mode toggle (persisted to localStorage)
 *   4. Smooth scroll navigation
 *   5. Mobile hamburger menu
 *
 * Everything uses vanilla JS — no frameworks, no build tools.
 * Read the comments to understand how each piece works!
 */

document.addEventListener('DOMContentLoaded', () => {
  // Grab references to our data from data.js
  const { personal, skills, projects } = portfolioData;

  // --- Render all sections ---
  renderHero(personal);
  renderAbout(personal);
  renderSkills(skills);
  renderProjects(projects);
  renderContact(personal);
  renderFooter(personal);

  // --- Initialize interactive features ---
  initThemeSwitcher();
  initDarkMode();
  initSmoothScroll();
  initMobileMenu();
});


/* =============================================================
   1. RENDER FUNCTIONS
   These take data and inject HTML into the page using
   template literals and innerHTML.
   ============================================================= */

/**
 * Render the hero section with the user's name, title, and bio.
 */
const renderHero = (personal) => {
  document.getElementById('hero-title').textContent = personal.name;
  document.getElementById('hero-subtitle').textContent = personal.title;
  document.getElementById('hero-bio').textContent = personal.bio;

  // Update the nav brand to match the user's name
  document.getElementById('nav-brand').textContent = personal.name;
};

/**
 * Render the about section with the user's bio.
 */
const renderAbout = (personal) => {
  document.getElementById('about-text').textContent = personal.bio;
};

/**
 * Render skill badges from the skills array.
 * Each skill becomes a small pill/badge element.
 */
const renderSkills = (skills) => {
  const grid = document.getElementById('skills-grid');

  grid.innerHTML = skills.map(skill => `
    <span class="skill-badge">
      ${skill.name}
      <span class="skill-level">${skill.level}</span>
    </span>
  `).join('');
};

/**
 * Render project cards in a CSS Grid layout.
 * Each project gets a card with title, description, tags, and links.
 */
const renderProjects = (projects) => {
  const grid = document.getElementById('projects-grid');

  grid.innerHTML = projects.map(project => `
    <article class="project-card">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="project-tags">
        ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
      <div class="project-links">
        ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer">Live Demo ↗</a>` : ''}
        ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">Source Code ↗</a>` : ''}
      </div>
    </article>
  `).join('');
};

/**
 * Render contact links (email + social).
 */
const renderContact = (personal) => {
  const container = document.getElementById('contact-links');
  let html = '';

  if (personal.email) {
    html += `<a href="mailto:${personal.email}" class="btn btn-primary">Email Me</a>`;
  }
  if (personal.social.github) {
    html += `<a href="${personal.social.github}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">GitHub</a>`;
  }
  if (personal.social.linkedin) {
    html += `<a href="${personal.social.linkedin}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">LinkedIn</a>`;
  }
  if (personal.social.twitter) {
    html += `<a href="${personal.social.twitter}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Twitter</a>`;
  }

  container.innerHTML = html;
};

/**
 * Render the footer with the user's name and the current year.
 */
const renderFooter = (personal) => {
  const year = new Date().getFullYear();
  document.getElementById('footer-text').innerHTML =
    `&copy; ${year} ${personal.name}. Built with HTML, CSS &amp; JS.`;
};


/* =============================================================
   2. THEME SWITCHER
   Applies CSS custom properties from the themes object
   and persists the choice to localStorage.
   ============================================================= */

const initThemeSwitcher = () => {
  const btn = document.getElementById('theme-switcher-btn');
  const menu = document.getElementById('theme-menu');

  // Build a button for each theme
  Object.entries(themes).forEach(([key, theme]) => {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.innerHTML = `<span class="theme-dot" style="background:${theme.primary}"></span> ${theme.name}`;

    themeBtn.addEventListener('click', () => {
      applyTheme(key);
      // Highlight the active theme
      menu.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      themeBtn.classList.add('active');
      menu.classList.remove('open');
    });

    menu.appendChild(themeBtn);
  });

  // Toggle the dropdown open/closed
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  // Close the dropdown when clicking anywhere else
  document.addEventListener('click', () => menu.classList.remove('open'));

  // Restore saved theme on page load (default to reacher)
  const saved = localStorage.getItem('theme');
  if (saved && themes[saved]) {
    applyTheme(saved);
  } else if (themes.reacher) {
    applyTheme('reacher');
  }
};

/**
 * Apply a theme by setting CSS custom properties on <html>.
 */
const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-text', theme.primaryText || '#FFFFFF');
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-border', theme.border || '#E5E7EB');
  root.style.setProperty('--color-muted-text', theme.mutedText || '#94A3B8');
  root.style.setProperty('--color-accent', theme.accent);
  root.setAttribute('data-theme', themeName);

  // Persist the choice so it survives page reloads
  localStorage.setItem('theme', themeName);
};


/* =============================================================
   3. DARK MODE TOGGLE
   Uses the data-theme attribute on <html> and persists
   the user's preference to localStorage.
   ============================================================= */

const initDarkMode = () => {
  const toggle = document.getElementById('dark-mode-toggle');
  const saved = localStorage.getItem('darkMode');
  const SUN_SVG = `<svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" fill-opacity="0.2" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>`;
  const MOON_SVG = `<svg class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fill-opacity="0.2" /></svg>`;

  // On load: apply saved preference, or check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'true' || (saved === null && prefersDark);

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggle.innerHTML = SUN_SVG;
    toggle.title = 'Switch to light mode';
  }

  // Toggle on click
  toggle.addEventListener('click', () => {
    const currentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (currentlyDark) {
      // Switch to light — remove data-theme so :root defaults apply
      document.documentElement.removeAttribute('data-theme');
      toggle.innerHTML = MOON_SVG;
      toggle.title = 'Switch to dark mode';
      localStorage.setItem('darkMode', 'false');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.innerHTML = SUN_SVG;
      toggle.title = 'Switch to light mode';
      localStorage.setItem('darkMode', 'true');
    }
  });
};


/* =============================================================
   4. SMOOTH SCROLL NAVIGATION
   Intercepts clicks on nav links and scrolls smoothly
   to the target section, accounting for the fixed navbar.
   ============================================================= */

const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        e.preventDefault();
        const navbarHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = target.offsetTop - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
};


/* =============================================================
   5. MOBILE HAMBURGER MENU
   Toggles the nav links visibility on small screens.
   Closes the menu when a link is clicked.
   ============================================================= */

const initMobileMenu = () => {
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close the menu when a nav link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
};
