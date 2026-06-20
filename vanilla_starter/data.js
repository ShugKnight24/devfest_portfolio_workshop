/**
 * Portfolio Data Configuration
 * 
 * This is the heart of your portfolio! All your personal information,
 * projects, and skills are stored here as JavaScript data.
 * 
 * Simply edit this file to update your portfolio website instantly.
 */

window.portfolioData = {
  // Personal Information
  personal: {
    name: "Shugmi Shumunov",
    title: "Full Stack Developer - Love JavaScript",
    avatar: "./assets/images/shug_headshot.jpg", // Path to your avatar image
    aboutImage: "./assets/images/shug_animated.jpg", // Path to an about section image
    bio: "I'm a passionate developer who loves building beautiful, functional web applications. I specialize in modern JavaScript frameworks and creating seamless user experiences.",
    email: "sshumunov@gmail.com",
    portfolio: "https://shugknight24.github.io",
    // Social links
    social: {
      github: "https://github.com/shugknight24",
      linkedin: "https://www.linkedin.com/in/shugmishumunov/",
      twitter: null,
    },
  },

  // Skills - Add or remove as needed!
  skills: [
    { name: "React", level: "advanced", category: "frontend" },
    { name: "JavaScript", level: "advanced", category: "language" },
    { name: "TypeScript", level: "advanced", category: "language" },
    { name: "Vue.js", level: "intermediate", category: "language" },
    { name: "Svelte", level: "beginner", category: "language" },
    { name: "Angular", level: "beginner", category: "language" },
    { name: "PHP", level: "intermediate", category: "language" },
    { name: "Python", level: "intermediate", category: "language" },
    { name: "Tailwind CSS", level: "intermediate", category: "frontend" },
    { name: "Node.js", level: "intermediate", category: "backend" },
    { name: "Express.js", level: "intermediate", category: "backend" },
    { name: "Git", level: "intermediate", category: "tools" },
    { name: "REST APIs", level: "intermediate", category: "backend" },
  ],

  // Projects - Each project becomes a card!
  projects: [
    {
      id: 1,
      title: "J. Simmons Productions",
      description:
        "Building high-speed media distribution pipelines. We deploy robust backend hooks so video channels scale on lightweight, dynamic modules.",
      image: "./assets/images/devfest_site.png",
      tags: ["React", "Dynamic Modules", "Backend Hooks"],
      githubUrl: null,
      liveUrl: "https://jsimmonsproductions.com",
      featured: true,
    },
    {
      id: 2,
      title: "Jacked Alien",
      description:
        "Fitness automation scaled through modular state machines. Reusable training modules replace complex customized code, driving rapid progress tracking.",
      image: "./assets/images/personal_portfolio.png",
      tags: ["State Machines", "React", "Modular Architecture"],
      githubUrl: "https://github.com/shugknight24/jacked-alien",
      liveUrl: null,
      featured: true,
    },
    {
      id: 3,
      title: "Criminal Cookies",
      description:
        "Guerilla-style e-commerce at scale. A high-frequency localized checkout engine engineered to bypass bloated legacy commercial systems entirely.",
      image: "./assets/images/shum_sol.png",
      tags: ["E-commerce", "High Frequency Checkout", "Vite"],
      githubUrl: "https://github.com/shugknight24/criminal-cookies",
      liveUrl: null,
      featured: true,
    },
    {
      id: 4,
      title: "Shumunov Solutions",
      description:
        "A business website for Shumunov Solutions, offering custom web development, backend integrations, and technical consulting.",
      image: "./assets/images/shum_sol.png",
      tags: ["React", "Tailwind CSS", "Consulting"],
      githubUrl: null,
      liveUrl: "http://shumunovsolutions.com",
      featured: true,
    },
  ],
};

/**
 * Themes Configuration
 * 
 * Supports the same premium themes as the React workshop!
 * Switching a theme will apply these colors dynamically as CSS variables.
 */
window.themes = {
  devilHeart: {
    name: "Devil Heart",
    colors: {
      primary: "#E65100", // Deep Orange
      secondary: "#37474F", // Blue Grey
      accent: "#FFD600", // Vivid Yellow
      background: "#FFF3E0", // Very Light Orange
      dark: "#121212", // Near Black
      text: "#263238", // Dark Blue Grey
      textDark: "#FFE0B2", // Light Orange
    },
  },
  crimsonSteel: {
    name: "Crimson Steel",
    colors: {
      primary: "#D32F2F", // Red
      secondary: "#546E7A", // Slate Grey
      accent: "#263238", // Dark Slate
      background: "#FAFAFA", // Off White
      dark: "#212121", // Dark Grey
      text: "#212121", // Black
      textDark: "#CFD8DC", // Light Grey
    },
  },
  goldenCity: {
    name: "Golden City",
    colors: {
      primary: "#F9A825", // Dark Yellow
      secondary: "#00695C", // Teal
      accent: "#C62828", // Red
      background: "#FFFDE7", // Light Yellow
      dark: "#263238", // Dark Slate
      text: "#3E2723", // Dark Brown
      textDark: "#FFF59D", // Light Yellow
    },
  },
  bombFlower: {
    name: "Bomb Flower",
    colors: {
      primary: "#7B1FA2", // Purple
      secondary: "#2E7D32", // Green
      accent: "#EC407A", // Pink
      background: "#F3E5F5", // Light Purple
      dark: "#1A1A2E", // Deep Purple Black
      text: "#212121", // Black
      textDark: "#E1BEE7", // Light Purple
    },
  },
  martialSpirit: {
    name: "Martial Spirit",
    colors: {
      primary: "#EF6C00", // Orange
      secondary: "#1565C0", // Blue
      accent: "#FFD600", // Gold
      background: "#FFF8E1", // Amber 50
      dark: "#0D47A1", // Deep Blue
      text: "#212121", // Black
      textDark: "#FFECB3", // Light Amber
    },
  },
  royalPride: {
    name: "Royal Pride",
    colors: {
      primary: "#2962FF", // Royal Blue
      secondary: "#FFD600", // Gold
      accent: "#C2185B", // Pink
      background: "#E3F2FD", // Light Blue
      dark: "#000051", // Navy
      text: "#0D47A1", // Dark Blue
      textDark: "#BBDEFB", // Light Blue
    },
  },
  neonNight: {
    name: "Neon Night",
    colors: {
      primary: "#00E5FF", // Cyan
      secondary: "#D500F9", // Magenta
      accent: "#FFEA00", // Yellow
      background: "#F5F5F5", // Light Grey
      dark: "#0A0A0A", // Black
      text: "#212121", // Black
      textDark: "#E0F7FA", // Light Cyan
    },
  },
  forestZen: {
    name: "Forest Zen",
    colors: {
      primary: "#2E7D32", // Green
      secondary: "#5D4037", // Brown
      accent: "#8BC34A", // Light Green
      background: "#F1F8E9", // Light Green
      dark: "#1B5E20", // Dark Green
      text: "#1B5E20", // Dark Green
      textDark: "#DCEDC8", // Light Green
    },
  },
  default: {
    name: "Modern Minimal",
    colors: {
      primary: "#3B82F6", // Blue 500
      secondary: "#8B5CF6", // Violet 500
      accent: "#EC4899", // Pink 500
      background: "#F9FAFB", // Gray 50
      dark: "#111827", // Gray 900
      text: "#1F2937", // Gray 800
      textDark: "#F3F4F6", // Gray 100
    },
  },
};

window.defaultTheme = "default";
