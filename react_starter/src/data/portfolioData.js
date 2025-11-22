/**
 * Portfolio Data Configuration
 *
 * This is the heart of your portfolio! All your personal information,
 * projects, and skills are stored here as JavaScript data.
 *
 * By changing data here, your entire portfolio updates automatically! Try it out while the development server is running.
 */

// TODO: Add a image for the personal section and project placeholders
export const portfolioData = {
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
    // TODO: Feel free to add more social links if needed
    // Create components similar to those in `src/components/Icons/` & update how they're used in place like `Footer.jsx`, `Header.jsx`, and other places you want to display your social icons
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
      title: "MiDevFest Website",
      description:
        "The official website for MiDevFest 2025, built with React and Tailwind CSS. Features event details, speaker bios, and previous events.",
      image: "./assets/images/devfest_site.png",
      tags: ["React", "TailwindCSS"],
      githubUrl: "https://github.com/GDG-Detroit/devfest-website",
      liveUrl: "https://midevfest.com",
      featured: true,
    },
    {
      id: 2,
      title: "My Portfolio Site",
      description:
        "My personal portfolio website showcasing my projects, skills, and experience.",
      image: "./assets/images/personal_portfolio.png",
      tags: ["React", "SCSS"],
      githubUrl: "https://github.com/ShugKnight24/react_portfolio",
      liveUrl: "https://shugknight24.github.io",
      featured: true,
    },
    {
      id: 3,
      title: "Shumunov Solutions",
      description:
        "A business website for Shumunov Solutions, a company offering web development and consulting services.",
      image: "./assets/images/shum_sol.png",
      tags: ["React", "SCSS"],
      githubUrl: null,
      liveUrl: "http://shumunovsolutions.com",
      featured: true,
    },
    {
      id: 4,
      title: "Pomodoro",
      description:
        "Beautiful weather app with 7-day forecasts, location search, and animated weather icons.",
      image: "./assets/images/pomodoro.png",
      tags: ["JavaScript"],
      githubUrl: "https://github.com/shugknight24/pomodoro",
      liveUrl: "https://shugknight24.github.io/pomodoro/",
      featured: false,
    },
  ],
};

export default portfolioData;
