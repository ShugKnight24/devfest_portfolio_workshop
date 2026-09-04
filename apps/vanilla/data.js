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
  light:  { name: 'Light',  primary: '#3B82F6', background: '#F9FAFB', text: '#1F2937', surface: '#FFFFFF', accent: '#8B5CF6' },
  dark:   { name: 'Dark',   primary: '#60A5FA', background: '#111827', text: '#F9FAFB', surface: '#1F2937', accent: '#A78BFA' },
  ocean:  { name: 'Ocean',  primary: '#06B6D4', background: '#F0FDFA', text: '#134E4A', surface: '#FFFFFF', accent: '#14B8A6' },
  forest: { name: 'Forest', primary: '#22C55E', background: '#F0FDF4', text: '#14532D', surface: '#FFFFFF', accent: '#A3E635' },
  sunset: { name: 'Sunset', primary: '#F97316', background: '#FFF7ED', text: '#7C2D12', surface: '#FFFFFF', accent: '#FB923C' },
};
