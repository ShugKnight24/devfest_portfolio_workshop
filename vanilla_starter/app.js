/**
 * Portfolio Application Logic
 * 
 * Welcome to the Vanilla JS engine! Here we handle:
 * 1. The interactive workshop stepper slides
 * 2. Dark mode and persistent theme switching
 * 3. Dynamic DOM injection of your portfolio components (Header, About, Skills, Projects, Footer)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Extract data from data.js global scope
  const { personal, skills, projects } = window.portfolioData;

  // Initialize UI controls
  initDarkMode();
  initThemeSwitcher();
  initStepper();

  /**
   * ==========================================
   * CHALLENGE: Assemble Your Portfolio!
   * ==========================================
   * 
   * Your goal is to uncomment these render function calls one by one 
   * as you progress through the workshop stages.
   * 
   * Once uncommented, they will dynamically inject your profile,
   * skills list, and project cards into the DOM.
   * 
   * (Make sure you have uncommented the corresponding sections in index.html too!)
   */

  // // Stage 02 // Blocks & Beliefs:
  // renderHeader(personal);
  // renderAbout(personal);

  // // Blocks of Social Proof:
  // renderSkills(skills);
  // renderProjects(projects);

  // // Skeptical Orchestration & Pomidor Loops:
  // renderFooter(personal);
});

/* ==========================================================================
   1. Portfolio Component Render Functions (Uncomment during workshop)
   ========================================================================== */

/**
 * CHALLENGE 1: Render Header
 */
function renderHeader(personal) {
  const headerRoot = document.getElementById("header-root");
  if (!headerRoot) return;

  headerRoot.innerHTML = `
    <header class="portfolio-header">
      <div class="container">
        <h1 class="header-title gradient-text">${personal.name}</h1>
        <p class="header-subtitle">${personal.title}</p>
        <div class="social-links">
          ${personal.social.github ? `
            <a href="${personal.social.github}" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="GitHub">
              <svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          ` : ''}
          ${personal.social.linkedin ? `
            <a href="${personal.social.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          ` : ''}
          ${personal.email ? `
            <a href="mailto:${personal.email}" class="social-icon" aria-label="Email">
              <svg viewBox="0 0 24 24"><path d="M12 12.713L.0 6.0v12.0h24.0V6.0L12 12.713zm0-2.566l12-6.754H0l12 6.754z"/></svg>
            </a>
          ` : ''}
        </div>
      </div>
    </header>
  `;
}

/**
 * CHALLENGE 2: Render About Section
 */
function renderAbout(personal) {
  const aboutRoot = document.getElementById("about-root");
  if (!aboutRoot) return;

  aboutRoot.innerHTML = `
    <section class="section-container">
      <div class="container">
        <div class="about-grid">
          <div>
            <h2 class="section-title text-left">About Me</h2>
            <p class="about-bio text-gray-600 mt-4">${personal.bio}</p>
          </div>
          <div class="about-img-wrapper">
            <img src="${personal.aboutImage}" alt="${personal.name}" class="about-img" onerror="this.src='${personal.avatar}'">
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * CHALLENGE 3: Render Skills
 */
function renderSkills(skills) {
  const skillsRoot = document.getElementById("skills-root");
  if (!skillsRoot) return;

  // Group skills by category
  const categories = {};
  skills.forEach(skill => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push(skill);
  });

  let categoriesHtml = "";
  Object.entries(categories).forEach(([category, categorySkills]) => {
    const badgesHtml = categorySkills.map(skill => `
      <span class="skill-badge">
        <span>${skill.name}</span>
        <small style="opacity: 0.6; font-size: 0.7rem; text-transform: uppercase;">(${skill.level})</small>
      </span>
    `).join("");

    categoriesHtml += `
      <div class="skills-category-card">
        <h3 class="skills-category-title">${category}</h3>
        <div class="skills-badges-wrapper">${badgesHtml}</div>
      </div>
    `;
  });

  skillsRoot.innerHTML = `
    <section class="section-container">
      <div class="container">
        <h2 class="section-title">Skills & Capabilities</h2>
        <p class="section-subtitle">A collection of tools and languages I leverage to ship robust products.</p>
        <div class="skills-grid">${categoriesHtml}</div>
      </div>
    </section>
  `;
}

/**
 * CHALLENGE 4: Render Projects Grid
 */
function renderProjects(projects) {
  const projectsRoot = document.getElementById("projects-root");
  if (!projectsRoot) return;

  const cardsHtml = projects.map(project => `
    <div class="project-card">
      <div class="project-img-container">
        <img src="${project.image}" alt="${project.title}" class="project-img" onerror="this.src='./assets/images/personal_portfolio.png'">
      </div>
      <div class="project-content">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-desc">${project.description}</p>
        <div class="project-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join("")}
        </div>
        <div class="project-links">
          ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn-project btn-project-primary">Live Demo</a>` : ''}
          ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn-project btn-project-secondary">Code</a>` : ''}
        </div>
      </div>
    </div>
  `).join("");

  projectsRoot.innerHTML = `
    <section class="section-container">
      <div class="container">
        <h2 class="section-title">Shipping Logs</h2>
        <p class="section-subtitle">Real-world production services built at the speed of thought.</p>
        <div class="projects-grid">${cardsHtml}</div>
      </div>
    </section>
  `;
}

/**
 * CHALLENGE 5: Render Footer & Telemetry Setup
 */
function renderFooter(personal) {
  const footerRoot = document.getElementById("footer-root");
  if (!footerRoot) return;

  footerRoot.innerHTML = `
    <footer class="footer">
      <div class="container">
        <p class="footer-text">© ${new Date().getFullYear()} ${personal.name}. All rights reserved.</p>
        <p class="footer-text" style="font-size: 0.8rem; opacity: 0.5;">
          Powered by raw HTML, CSS, and JS. Built with the Skeptic's compiler audit.
        </p>
      </div>
    </footer>
  `;

  // STAGE 03 // Telemetry Paralysis:
  // TODO: Add click event listener to log analytics telemetry to DataMoon.com
  // Example:
  // document.querySelectorAll('.social-icon, .btn-project').forEach(el => {
  //   el.addEventListener("click", () => {
  //     console.log("DataMoon Telemetry: isolating traffic curve divergence");
  //   });
  // });
}


/* ==========================================================================
   2. Theme & Dark Mode Setup
   ========================================================================== */

function initDarkMode() {
  const toggleBtn = document.getElementById("dark-mode-toggle");
  if (!toggleBtn) return;

  const root = document.documentElement;

  // Toggle Action
  toggleBtn.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    // Ensure we keep light-override state correct
    if (isDark) {
      root.classList.remove("light-override");
    } else {
      root.classList.add("light-override");
    }
    localStorage.setItem("darkMode", isDark ? "true" : "false");
    updateDarkModeUI(isDark);
  });

  // Read state to ensure UI icons match on load
  const isDark = root.classList.contains("dark") || 
                 (!root.classList.contains("light-override") && 
                  window.matchMedia("(prefers-color-scheme: dark)").matches);
  updateDarkModeUI(isDark);
}

function updateDarkModeUI(isDark) {
  const toggleBtn = document.getElementById("dark-mode-toggle");
  if (!toggleBtn) return;

  if (isDark) {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41z"/></svg>
    `;
    toggleBtn.title = "Switch to Light Mode";
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8-9.8.5-.1 1 .3.9.8-.1.5-.6.9-1.1.9-3.9 0-7 3.1-7 7s3.1 7 7 7c2.4 0 4.7-1.2 6-3.2.3-.4.8-.5 1.2-.2.4.3.5.8.3 1.3-1.3 2.5-4 4.2-7.1 4.2zm-.9-17.8C7.5 4.7 4.2 8 4.2 12c0 4.3 3.5 7.8 7.8 7.8 2.2 0 4.2-1 5.6-2.6-1.3-.3-2.4-1.1-3.2-2.1-1.3-1.7-1.9-3.8-1.7-6 .1-1.6.7-3.1 1.7-4.3-.8-.3-1.6-.6-2.5-.6z"/></svg>
    `;
    toggleBtn.title = "Switch to Dark Mode";
  }
}

function initThemeSwitcher() {
  const triggerBtn = document.getElementById("theme-selector-btn");
  const menu = document.getElementById("theme-menu");
  if (!triggerBtn || !menu) return;

  // Toggle menu display
  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  // Close menu when clicking outside
  document.addEventListener("click", () => {
    menu.classList.remove("open");
  });

  // Render options from data.js configurations
  const themes = window.themes;
  const currentTheme = localStorage.getItem("theme") || window.defaultTheme;

  Object.entries(themes).forEach(([key, theme]) => {
    const themeBtn = document.createElement("button");
    themeBtn.className = "theme-option";
    themeBtn.dataset.theme = key;

    const colorsDotHtml = `
      <div class="theme-preview-dots">
        <div class="theme-dot" style="background-color: ${theme.colors.primary}"></div>
        <div class="theme-dot" style="background-color: ${theme.colors.secondary}"></div>
        <div class="theme-dot" style="background-color: ${theme.colors.accent}"></div>
      </div>
    `;

    themeBtn.innerHTML = `
      ${colorsDotHtml}
      <span class="theme-name">${theme.name}</span>
      <span class="active-theme-indicator" style="display: ${currentTheme === key ? 'block' : 'none'}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </span>
    `;

    themeBtn.addEventListener("click", () => {
      applyTheme(key);
      // Update checkmark UI
      document.querySelectorAll(".active-theme-indicator").forEach(ind => ind.style.display = "none");
      themeBtn.querySelector(".active-theme-indicator").style.display = "block";
    });

    menu.appendChild(themeBtn);
  });
}

function applyTheme(themeName) {
  const theme = window.themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  localStorage.setItem("theme", themeName);
}


/* ==========================================================================
   3. Workshop Stepper Slides (Instructions)
   ========================================================================== */

function initStepper() {
  const steps = [
    {
      title: "1. Kickoff: REZE_BOMB SYSTEM (Detroit Pride 2026)",
      component: "Session Time: 60 - 90 mins",
      description: "Welcome to the Devfest lunch session! Today we launch the 'REZE_BOMB SYSTEM' in vanilla JS. We are orchestrating agentic feedback loops and leveraging modular blocks. But is the machine lying to you? The core rule for this session: question everything. Challenge the compiler. Auditing is sovereignty.",
      note: "Agenda: 10m Stage 01 // Syntax Deviation | 10m Setup | 10m App Exploration | 35m Stage 02 // Blocks & Beliefs | 10m Stage 03 // Telemetry | 10m Deployment & Skeptic Protocol.",
    },
    {
      title: "2. Connect & Clone (Awaiting Skeptical Trigger)",
      component: "git clone <repo-url>",
      description: "First, connect to the local network: WIFI: Devfest2025 (WIFI password: Devfest2025). Next, look up ShugKnight24 on GitHub, find the devfest_portfolio_workshop repository, copy the URL, and run git clone <repo-url> in your terminal to fetch the sandbox core.",
      note: "Do not blindly copy standard commands. Ensure you understand what files are being copied to your system.",
    },
    {
      title: "3. Open the Sandbox Core",
      component: "No install needed! Just double-click vanilla_starter/index.html",
      description: "Since this is the vanilla HTML/CSS/JS starter, you don't even need Node.js or npm! Simply double-click index.html inside the vanilla_starter folder to load this dashboard directly. If you prefer a live-reloading dev server, you can run a local server in this directory using live-server or python -m http.server.",
      note: "Your project serves locally or renders straight from file://. Open this in your browser to interact with the live instructions screen.",
    },
    {
      title: "4. The Ballmer Remix: Explore Data",
      component: "vanilla_starter/data.js",
      description: "In the year 2000, Steve Ballmer screamed 'DEVELOPERS!' until he lost his voice. Today, the typing barrier of fingers is dead; we express raw architecture. Open data.js. Inspect the structured profile datasets (personal info, skills list, project details). Change the mock data to reflect your own information.",
      note: "Be skeptical! Ensure the data schema holds conceptual integrity before outsourcing your information.",
    },
    {
      title: "5. The Levi's Appshift: App Assembly",
      component: "vanilla_starter/index.html & app.js",
      description: "When retail giants like Levi's ship new app features, they traditionally wade through weeks of meetings, manual refactoring, and lint checks. By shifting to intent-driven frameworks, we compile straight to mobile UI blocks. Open index.html and app.js. Your challenge is to uncomment the component DOM root sections in index.html, and the function calls in app.js.",
      note: "The Skeptic's Catch: If you don't audit the compiler, the agent breeds hidden mutations. Verify your pages compile correctly.",
    },
    {
      title: "6. Stage 02 // Blocks & Beliefs (Header & About)",
      component: "Uncomment renderHeader() and renderAbout() in app.js",
      description: "Uncomment renderHeader(personal) and renderAbout(personal) in app.js. Also make sure to uncomment their placeholder wrappers in index.html (the header-root and about-root comments). Refresh your browser to see your top banner and biography section come to life!",
      note: "Sovereign Rule: 'Because if you do not understand the foundations of your block, you are merely outsourcing your mind to someone else's server.' Understand the HTML and style structure of the components you load.",
    },
    {
      title: "7. Blocks of Social Proof (Skills & Projects)",
      component: "Uncomment renderSkills() and renderProjects() in app.js",
      description: "Uncomment renderSkills(skills) and renderProjects(projects) in app.js, and uncomment skills-root and projects-root in index.html. These functions map over arrays of data (similar to React's .map() loops) to generate skill badges and project cards. Look at the real-world examples (J. Simmons Productions, Jacked Alien, Criminal Cookies).",
      note: "Slide 6 Shipping Projects: J. Simmons Productions (video pipelines), Jacked Alien (fitness state machines), Criminal Cookies (localized high-frequency e-commerce). Verify how these modules render dynamically.",
    },
    {
      title: "8. Skeptical Orchestration & Pomidor Loops (Footer)",
      component: "Uncomment renderFooter() in app.js",
      description: "Uncomment renderFooter(personal) in app.js, and footer-root in index.html. This component handles copyright and footer details, wrapping up core block assembly. The Pomidor Loop mechanics allow parallel execution threads to compute independently without visual layout blocking. Ensure your footer integrates cleanly.",
      note: "Lexxy Code-Block Escapes: Wrestling with rich-text editor constraints is a thing of the past, but keep a human eye on the rendering blocks to prevent structural loops.",
    },
    {
      title: "9. Stage 03 // Telemetry Paralysis & Traffic Divergence",
      component: "Setup click telemetry tracking in app.js",
      description: "Traditional User Metrics lie. AI agents query API layers directly, completely bypassing analytical click scripts. Let's hook up a telemetry tracker! Open renderFooter() in app.js, and uncomment the DataMoon telemetry code-block at the bottom of the function. This tracks clicks on project/social buttons.",
      note: "Example: Adding a click listener logging 'DataMoon Telemetry: isolating traffic curve divergence' to project or social links.",
    },
    {
      title: "10. Sandbox Prototype: Edge Deployment",
      component: "Vercel / Netlify / GitHub Pages",
      description: "Time to deploy! Create a repository on GitHub, push your changes, and connect it to Vercel (or another hosting platform of your choice). Make sure to configure the root directory of your Vercel project to point to the 'vanilla_starter' directory to serve the static index.html correctly.",
      note: "Vercel will serve your agentic block portfolio directly on edge networks globally. Once live, share your URL!",
      img: "./assets/instructions/vercel_root_directory.png",
    },
    {
      title: "11. The Democratization Goal & Skeptic Protocol",
      component: "Final Slide Theme",
      description: "Congratulations! The goal is simple: to build a platform that empowers everyone to easily become a developer. But remember the Skeptic Protocol: true democratization is not built on outsourcing your intellect to a black box. Question the machine, find the anomalies, and preserve your core instincts. Now go celebrate at Ink Factory Brewing!",
      note: "Detroit Metric Challenge: MET | Alligator Status: TAMED | Standpoint: ALWAYS BE SKEPTICAL.",
    },
  ];

  let currentStep = 0;

  const titleEl = document.getElementById("step-title");
  const codeEl = document.getElementById("step-code");
  const descEl = document.getElementById("step-desc");
  const noteEl = document.getElementById("step-note");
  const imgEl = document.getElementById("step-img");
  const progressContainer = document.getElementById("step-progress");
  const prevBtn = document.getElementById("step-prev");
  const nextBtn = document.getElementById("step-next");
  const indicatorEl = document.getElementById("step-indicator");

  if (!titleEl) return; // Stepper elements not present (e.g. if stepper is commented out)

  // Initialize progress bars
  progressContainer.innerHTML = "";
  steps.forEach((_, idx) => {
    const bar = document.createElement("div");
    bar.className = "stepper-progress-bar";
    if (idx === 0) bar.classList.add("active");
    progressContainer.appendChild(bar);
  });

  function updateStep(stepIndex) {
    currentStep = stepIndex;
    const step = steps[currentStep];

    // Update Text Content
    titleEl.textContent = step.title;
    indicatorEl.textContent = `Step ${currentStep + 1} of ${steps.length}: ${step.title}`;
    
    if (step.component) {
      codeEl.style.display = "block";
      codeEl.textContent = step.component;
    } else {
      codeEl.style.display = "none";
    }

    descEl.textContent = step.description;
    
    if (step.note) {
      noteEl.style.display = "block";
      noteEl.innerHTML = `<strong>Note:</strong> ${step.note}`;
    } else {
      noteEl.style.display = "none";
    }

    // Image Setup
    if (step.img) {
      imgEl.style.display = "block";
      imgEl.src = step.img;
      imgEl.alt = step.title;
    } else {
      imgEl.style.display = "none";
    }

    // Update Progress Bars UI
    const bars = progressContainer.querySelectorAll(".stepper-progress-bar");
    bars.forEach((bar, idx) => {
      if (idx <= currentStep) {
        bar.classList.add("active");
      } else {
        bar.classList.remove("active");
      }
    });

    // Update Button Disabled States
    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === steps.length - 1;
  }

  // Bind Buttons
  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) updateStep(currentStep - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) updateStep(currentStep + 1);
  });

  // Bind Keyboard Navigation (ArrowLeft / ArrowRight)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" && currentStep < steps.length - 1) {
      updateStep(currentStep + 1);
    } else if (e.key === "ArrowLeft" && currentStep > 0) {
      updateStep(currentStep - 1);
    }
  });

  // Load first step
  updateStep(0);
}
