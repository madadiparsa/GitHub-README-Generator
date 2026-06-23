// src/utils/skills.js
// Single source of truth for skills/tech-stack data.
// Imported by SkillsPicker, markdownGenerator, and any future page that needs it.

export const SKILLS_CATEGORIES = {
  "Frontend": {
    color: "#0ea5e9",
    badgeColor: "0ea5e9",
    skills: [
      'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js',
      'Vue', 'Nuxt.js', 'Angular', 'Svelte', 'Tailwind', 'Sass', 'Redux',
      'Bootstrap',
    ]
  },
  "Backend": {
    color: "#10b981",
    badgeColor: "10b981",
    skills: [
      'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Node.js', 'Django',
      'Flask', 'FastAPI', 'Spring', 'Express', 'Ruby on Rails', 'PHP',
      'Laravel',
    ]
  },
  "Data Science & AI": {
    color: "#f43f5e",
    badgeColor: "f43f5e",
    skills: [
      'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
      'OpenCV', 'Jupyter', 'Matplotlib', 'Hugging Face',
    ]
  },
  "Database & Cloud": {
    color: "#f59e0b",
    badgeColor: "f59e0b",
    skills: [
      'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'Docker',
      'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'Firebase', 'Supabase',
    ]
  },
  "Tools & Other": {
    color: "#8b5cf6",
    badgeColor: "8b5cf6",
    skills: [
      'Linux', 'Git', 'GitHub', 'GitLab', 'Figma', 'Bash', 'Postman',
      'Nginx', 'GraphQL', 'Vite',
    ]
  }
};

/**
 * Returns the shields.io logo slug for a given skill name.
 * Special cases handle names that don't map cleanly to lowercase-no-spaces.
 */
export const getLogoName = (skill) => {
  const specialCases = {
    'Next.js':        'nextdotjs',
    'Nuxt.js':        'nuxtdotjs',
    'Vue':            'vuedotjs',
    'Node.js':        'nodedotjs',
    'C++':            'cplusplus',
    'C#':             'csharp',
    'Hugging Face':   'huggingface',
    'Google Cloud':   'googlecloud',
    'Scikit-learn':   'scikitlearn',
    'Ruby on Rails':  'rubyonrails',
    'Laravel':        'laravel',
    'Bootstrap':      'bootstrap',
    'Tailwind':       'tailwindcss',
  };
  return specialCases[skill] || skill.toLowerCase().replace(/\s+/g, '');
};

/**
 * Given a skill name, returns the category metadata ({ color, badgeColor })
 * or null if the skill isn't found.
 */
export const getCategoryForSkill = (skill) => {
  for (const data of Object.values(SKILLS_CATEGORIES)) {
    if (data.skills.includes(skill)) return data;
  }
  return null;
};