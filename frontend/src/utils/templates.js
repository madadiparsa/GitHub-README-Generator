// Metadata for the README templates available in the editor. `locked` marks
// templates that are only available to authenticated (GitHub-logged-in)
// users, matching the product rule: guests get the one free template,
// logged-in users unlock the rest.

export const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Badges',
    tagline: 'Bold shields.io badges, GitHub stats card, clean centered header.',
    accent: '#0d6efd',
    locked: false,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    tagline: 'Plain text, monospace tags, no graphics. Fast-loading and clean.',
    accent: '#10b981',
    locked: true,
  },
  {
    id: 'creative',
    name: 'Creative Banner',
    tagline: 'Animated wave banner, typing intro, streak stats, footer wave.',
    accent: '#ec4899',
    locked: true,
  },
];

export const DEFAULT_TEMPLATE_ID = 'modern';

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];