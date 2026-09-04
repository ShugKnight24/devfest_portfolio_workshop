/**
 * Portfolio Data
 *
 * This file holds all the content for your portfolio.
 * Edit the values below to make it yours — then refresh the browser!
 *
 * Tip: Start with your name, title, and bio. Then add your real
 * skills and projects as you build them.
 */

const portfolioData = {
  personal: {
    name: 'Your Name',
    title: 'Web Developer',
    avatar: '',
    bio: 'A passionate developer who loves building for the web.',
    email: 'your.email@example.com',
    social: {
      github: 'https://github.com/yourusername',
      linkedin: '',
      twitter: '',
    },
  },

  skills: [
    { name: 'HTML', level: 'advanced', category: 'frontend' },
    { name: 'CSS', level: 'advanced', category: 'frontend' },
    { name: 'JavaScript', level: 'intermediate', category: 'frontend' },
  ],

  projects: [
    {
      id: 1,
      title: 'My First Project',
      description: 'A brief description of what this project does.',
      tags: ['HTML', 'CSS'],
      githubUrl: '#',
      liveUrl: '#',
    },
  ],
};

/**
 * Theme Definitions
 *
 * Each theme maps to a set of CSS custom properties.
 * The keys match the --color-* variables in style.css.
 */
const themes = {
  reacher: { name: 'Reacher', primary: '#00FFCC', primaryText: '#050608', background: '#050608', text: '#E2E8F0', surface: '#0D1117', border: '#1E293B', mutedText: '#94A3B8', accent: '#FFCC00' },
  light:  { name: 'Light',  primary: '#3B82F6', primaryText: '#FFFFFF', background: '#F9FAFB', text: '#1F2937', surface: '#FFFFFF', border: '#E5E7EB', mutedText: '#6B7280', accent: '#8B5CF6' },
  dark:   { name: 'Dark',   primary: '#60A5FA', primaryText: '#050608', background: '#111827', text: '#F9FAFB', surface: '#1F2937', border: '#374151', mutedText: '#9CA3AF', accent: '#A78BFA' },
  ocean:  { name: 'Ocean',  primary: '#06B6D4', primaryText: '#042F2E', background: '#F0FDFA', text: '#134E4A', surface: '#FFFFFF', border: '#CCFBF1', mutedText: '#0D9488', accent: '#14B8A6' },
  forest: { name: 'Forest', primary: '#22C55E', primaryText: '#052E16', background: '#F0FDF4', text: '#14532D', surface: '#FFFFFF', border: '#DCFCE7', mutedText: '#16A34A', accent: '#A3E635' },
  sunset: { name: 'Sunset', primary: '#F97316', primaryText: '#FFFFFF', background: '#FFF7ED', text: '#7C2D12', surface: '#FFFFFF', border: '#FFEDD5', mutedText: '#EA580C', accent: '#FB923C' },
};
