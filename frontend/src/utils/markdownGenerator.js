// src/utils/markdownGenerator.js
import { SOCIAL_PLATFORMS, buildSocialUrl } from './socialPlatforms';
import { SKILLS_CATEGORIES, getLogoName } from './skills';

const socialBadge = (platform, value, style) => {
  const url = buildSocialUrl(platform, value);
  const meta = SOCIAL_PLATFORMS[platform];
  if (!url || !meta) return '';
  return `[![${meta.label}](https://img.shields.io/badge/${encodeURIComponent(meta.label)}-${meta.color}?style=${style}&logo=${meta.logo}&logoColor=white)](${url})`;
};

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

const buildHeader = ({ name, subtitle, template }) => {
  if (!name && !subtitle) return '';

  if (template === 'creative') {
    const bannerText = encodeURIComponent(name || "Hi, I'm a developer");
    let s = `<div align="center">\n\n`;
    s += `![header](https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:ec4899&height=180&section=header&text=${bannerText}&fontSize=42&fontColor=ffffff&animation=fadeIn)\n\n`;
    if (subtitle) {
      s += `![typing intro](https://readme-typing-svg.demolab.com/?font=Fira+Code&size=20&pause=1000&color=A78BFA&center=true&vCenter=true&width=600&lines=${encodeURIComponent(subtitle)})\n\n`;
    }
    s += `</div>\n\n`;
    return s;
  }

  if (template === 'minimalist') {
    let s = `# ${name || 'Your Name'}\n`;
    if (subtitle) s += `*${subtitle}*\n`;
    s += `\n---\n\n`;
    return s;
  }

  // modern (default)
  let s = '';
  if (name) s += `<h1 align="center">${name}</h1>\n`;
  if (subtitle) s += `<h3 align="center">${subtitle}</h3>\n`;
  if (s) s += `\n---\n\n`;
  return s;
};

const buildDescription = ({ description, template }) => {
  if (!description) return '';
  if (template === 'minimalist') return `${description}\n\n`;
  if (template === 'creative') return `<p align="center">${description}</p>\n\n`;
  return `> ${description}\n\n`;
};

const buildAbout = ({ bio, currentLearning, template }) => {
  if (!bio && !currentLearning) return '';
  const heading = template === 'minimalist' ? '## About\n\n' : '## 🙋‍♂️ About Me\n\n';
  let s = heading;
  if (bio) {
    s += template === 'minimalist'
      ? `- Working on: **${bio}**\n`
      : `- 🔭 I'm currently working on **${bio}**\n`;
  }
  if (currentLearning) {
    s += template === 'minimalist'
      ? `- Learning: **${currentLearning}**\n`
      : `- 🌱 I'm currently learning **${currentLearning}**\n`;
  }
  s += `\n`;
  return s;
};

const buildSkills = ({ skills, template }) => {
  if (!skills || skills.length === 0) return '';
  let s = template === 'minimalist' ? `## Stack\n\n` : `## 🛠 Tech Stack\n\n`;

  for (const [category, data] of Object.entries(SKILLS_CATEGORIES)) {
    const categorySkills = skills.filter((sk) => data.skills.includes(sk));
    if (categorySkills.length === 0) continue;

    if (template === 'minimalist') {
      s += `**${category}:** \`${categorySkills.join('` `')}\`\n\n`;
      continue;
    }

    s += `### ${category}\n`;
    const badgeStyle = template === 'creative' ? 'flat-square' : 'for-the-badge';

    categorySkills.forEach((skill) => {
      const logo = getLogoName(skill);
      // ✅ Fix: escape '--' separators for shields.io BEFORE encodeURIComponent,
      //    then encode the whole thing so spaces/special chars are safe.
      const shieldsLabel = skill.replace(/-/g, '--').replace(/\s/g, '_');
      const encodedSkill = encodeURIComponent(shieldsLabel);
      s += `![${skill}](https://img.shields.io/badge/${encodedSkill}-${data.badgeColor}?style=${badgeStyle}&logo=${logo}&logoColor=white) `;
    });
    s += `\n\n`;
  }
  return s;
};

const buildSocial = ({ socialLinks, template }) => {
  if (!socialLinks) return '';
  const entries = Object.entries(socialLinks).filter(([, value]) => value && value.trim());
  if (entries.length === 0) return '';

  const heading = template === 'minimalist' ? '## Connect\n\n' : '## 🌐 Connect With Me\n\n';
  let s = heading;

  if (template === 'minimalist') {
    const links = entries
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const meta = SOCIAL_PLATFORMS[platform];
        return url && meta ? `[${meta.label}](${url})` : null;
      })
      .filter(Boolean);
    s += `${links.join(' · ')}\n\n`;
    return s;
  }

  const wrapCenter = template === 'creative';
  if (wrapCenter) s += `<p align="center">\n`;
  entries.forEach(([platform, value]) => {
    s += `${socialBadge(platform, value, 'for-the-badge')} `;
  });
  s += `\n`;
  if (wrapCenter) s += `</p>\n`;
  s += `\n`;
  return s;
};

const buildProjects = ({ projects, template }) => {
  if (!projects || projects.length === 0) return '';

  const heading = template === 'minimalist'
    ? '## Projects\n\n'
    : '## 🚀 Projects\n\n';

  let s = heading;

  if (template === 'minimalist') {
    projects.forEach(({ name, description, url, tech }) => {
      if (!name) return;
      const title = url ? `[${name}](${url})` : name;
      s += `**${title}**`;
      if (tech) s += ` — \`${tech}\``;
      s += `\n`;
      if (description) s += `${description}\n`;
      s += `\n`;
    });
    return s;
  }

  if (template === 'creative') {
    s += `<div align="center">\n\n`;
    projects.forEach(({ name, description, url, tech }) => {
      if (!name) return;
      s += `### ${url ? `[${name}](${url})` : name}\n`;
      if (description) s += `<p>${description}</p>\n`;
      if (tech) s += `<p><em>${tech}</em></p>\n`;
      s += `\n`;
    });
    s += `</div>\n\n`;
    return s;
  }

  // modern (default) — card-style table
  s += `| Project | Description | Tech |\n`;
  s += `|--------|-------------|------|\n`;
  projects.forEach(({ name, description, url, tech }) => {
    if (!name) return;
    const title = url ? `[${name}](${url})` : name;
    s += `| **${title}** | ${description || '—'} | ${tech || '—'} |\n`;
  });
  s += `\n`;
  return s;
};

const buildStats = ({ showStats, githubUsername, theme, template }) => {
  if (!showStats || !githubUsername) return '';
  const heading = template === 'minimalist' ? '## Stats\n\n' : '## 📊 GitHub Stats\n\n';
  let s = heading;

  if (template === 'minimalist') {
    s += `![Stats](https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=default&hide_border=true&hide_title=true)\n\n`;
    return s;
  }

  if (template === 'creative') {
    s += `<div align="center">\n`;
    s += `  <img src="https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=${theme}&hide_border=true&border_radius=10" alt="${githubUsername}'s GitHub stats" height="165" />\n`;
    s += `  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${githubUsername}&theme=${theme}&hide_border=true&border_radius=10" alt="${githubUsername}'s GitHub streak" height="165" />\n`;
    s += `</div>\n\n`;
    return s;
  }

  // modern
  s += `<div align="center">\n`;
  s += `  <img src="https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=${theme}&hide_border=true" alt="${githubUsername}'s GitHub stats" />\n`;
  s += `</div>\n\n`;
  return s;
};

const buildFooter = ({ template, githubUsername }) => {
  if (template !== 'creative') return '';
  let s = `<div align="center">\n\n`;
  if (githubUsername) {
    s += `![Profile views](https://komarev.com/ghpvc/?username=${githubUsername}&color=6366f1&style=flat-square&label=Profile+Views)\n\n`;
  }
  s += `![footer](https://capsule-render.vercel.app/api?type=waving&color=0:ec4899,100:6366f1&height=100&section=footer)\n\n`;
  s += `</div>\n`;
  return s;
};

const SECTION_BUILDERS = {
  header:      buildHeader,
  description: buildDescription,
  about:       buildAbout,
  skills:      buildSkills,
  social:      buildSocial,
  projects:    buildProjects,
  stats:       buildStats,
};

export const generateMarkdown = (formData) => {
  const data = { ...formData, template: formData.template || 'modern' };
  let markdown = '';

  if (data.sections && data.sections.length > 0) {
    data.sections.forEach((sectionName) => {
      const builder = SECTION_BUILDERS[sectionName];
      if (builder) markdown += builder(data);
    });
  }

  markdown += buildFooter(data);
  return markdown;
};