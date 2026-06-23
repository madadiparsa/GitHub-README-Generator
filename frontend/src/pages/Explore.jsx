// src/pages/Explore.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { generateMarkdown } from '../utils/markdownGenerator';
import { TEMPLATES } from '../utils/templates';
import { isLoggedIn, startGithubLogin } from '../utils/auth';

// ---------------------------------------------------------------------------
// Curated community example profiles
// ---------------------------------------------------------------------------
const EXPLORE_PROFILES = [
  {
    id:       'frontend-dev',
    label:    'Frontend Developer',
    template: 'modern',
    data: {
      name:            'Sarah Chen',
      subtitle:        'Frontend Developer & UI Enthusiast',
      description:     'I craft pixel-perfect interfaces and obsess over micro-interactions. Currently building design systems at scale.',
      bio:             'A component library for React',
      currentLearning: 'Three.js & WebGL',
      githubUsername:  'sarahchen',
      showStats:       true,
      theme:           'tokyonight',
      skills:          ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Sass', 'Figma', 'Redux'],
      projects: [
        { name: 'UIKit', description: 'Open-source React component library', url: 'https://github.com/sarahchen/uikit', tech: 'React, TypeScript, Storybook' },
        { name: 'PortfolioV3', description: 'Personal portfolio — v3', url: 'https://sarahchen.dev', tech: 'Next.js, Tailwind' },
      ],
      socialLinks: { github: 'sarahchen', linkedin: 'sarahchen', twitter: 'sarahchen', website: 'https://sarahchen.dev', email: 'sarah@sarahchen.dev', instagram: '', youtube: '', devto: '' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
  {
    id:       'backend-engineer',
    label:    'Backend Engineer',
    template: 'minimalist',
    data: {
      name:            'Marcus Rivera',
      subtitle:        'Backend Engineer · API Architect',
      description:     'I build fast, reliable APIs and distributed systems. Fan of Go, PostgreSQL, and boring technology that works.',
      bio:             'A high-performance REST framework in Go',
      currentLearning: 'eBPF & kernel networking',
      githubUsername:  'mrivera',
      showStats:       true,
      theme:           'github_dark',
      skills:          ['Go', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Nginx'],
      projects: [
        { name: 'GoAPI', description: 'Minimal REST framework for Go', url: 'https://github.com/mrivera/goapi', tech: 'Go' },
        { name: 'PgMigrate', description: 'Zero-dependency DB migration tool', url: 'https://github.com/mrivera/pgmigrate', tech: 'Go, PostgreSQL' },
      ],
      socialLinks: { github: 'mrivera', linkedin: 'mrivera', twitter: '', website: 'https://mrivera.io', email: 'marcus@mrivera.io', instagram: '', youtube: '', devto: 'mrivera' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
  {
    id:       'ml-engineer',
    label:    'ML Engineer',
    template: 'creative',
    data: {
      name:            'Priya Nair',
      subtitle:        'ML Engineer · Making machines smarter',
      description:     'Turning raw data into production models. Passionate about NLP, LLMs, and responsible AI.',
      bio:             'A lightweight LLM fine-tuning toolkit',
      currentLearning: 'Diffusion models & RL from human feedback',
      githubUsername:  'priyanair',
      showStats:       true,
      theme:           'radical',
      skills:          ['Python', 'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Hugging Face', 'Jupyter'],
      projects: [
        { name: 'TuneKit', description: 'LLM fine-tuning in < 100 lines', url: 'https://github.com/priyanair/tunekit', tech: 'Python, PyTorch, Hugging Face' },
        { name: 'DataLens', description: 'Visual EDA tool for tabular data', url: 'https://github.com/priyanair/datalens', tech: 'Python, Pandas, Streamlit' },
      ],
      socialLinks: { github: 'priyanair', linkedin: 'priyanair', twitter: 'priyanair', website: '', email: 'priya@priyanair.dev', instagram: '', youtube: '', devto: '' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
  {
    id:       'fullstack-laravel',
    label:    'Full-Stack (Laravel)',
    template: 'modern',
    data: {
      name:            'James Okafor',
      subtitle:        'Full-Stack Developer · Laravel & React',
      description:     'I build SaaS products end-to-end. Laravel on the backend, React on the frontend, shipped fast.',
      bio:             'A multi-tenant SaaS boilerplate',
      currentLearning: 'Inertia.js & Livewire',
      githubUsername:  'jamesokafor',
      showStats:       true,
      theme:           'dracula',
      skills:          ['PHP', 'Laravel', 'React', 'JavaScript', 'MySQL', 'Redis', 'Docker', 'Tailwind'],
      projects: [
        { name: 'LaunchPad', description: 'Multi-tenant SaaS boilerplate', url: 'https://github.com/jamesokafor/launchpad', tech: 'Laravel, React, MySQL' },
        { name: 'InvoiceFlow', description: 'Invoicing app for freelancers', url: 'https://github.com/jamesokafor/invoiceflow', tech: 'Laravel, Livewire' },
      ],
      socialLinks: { github: 'jamesokafor', linkedin: 'jamesokafor', twitter: '', website: 'https://jamesokafor.dev', email: 'james@jamesokafor.dev', instagram: '', youtube: '', devto: 'jamesokafor' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
  {
    id:       'devops-engineer',
    label:    'DevOps Engineer',
    template: 'minimalist',
    data: {
      name:            'Lena Hoffmann',
      subtitle:        'DevOps Engineer · Cloud & Automation',
      description:     'Automating everything that can be automated. Platform engineering, CI/CD pipelines, and infrastructure as code.',
      bio:             'A Terraform module registry',
      currentLearning: 'Platform Engineering & Backstage',
      githubUsername:  'lenahoffmann',
      showStats:       true,
      theme:           'github_dark',
      skills:          ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Bash', 'Python', 'Nginx', 'Git', 'Linux'],
      projects: [
        { name: 'TerraHub', description: 'Internal Terraform module registry', url: 'https://github.com/lenahoffmann/terrahub', tech: 'Go, Terraform, AWS' },
        { name: 'PipelineKit', description: 'Reusable GitHub Actions workflows', url: 'https://github.com/lenahoffmann/pipelinekit', tech: 'GitHub Actions, Bash' },
      ],
      socialLinks: { github: 'lenahoffmann', linkedin: 'lenahoffmann', twitter: 'lenahoffmann', website: '', email: 'lena@lenahoffmann.dev', instagram: '', youtube: '', devto: '' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
  {
    id:       'creative-developer',
    label:    'Creative Developer',
    template: 'creative',
    data: {
      name:            'Yuki Tanaka',
      subtitle:        'Creative Developer · Art × Code',
      description:     'I blend code and creativity to build interactive experiences, generative art, and experimental web things.',
      bio:             'A generative art toolkit for the browser',
      currentLearning: 'WebGPU & creative coding',
      githubUsername:  'yukitanaka',
      showStats:       true,
      theme:           'radical',
      skills:          ['JavaScript', 'TypeScript', 'React', 'Svelte', 'Figma', 'Vite', 'GraphQL'],
      projects: [
        { name: 'GenArt', description: 'Browser-based generative art toolkit', url: 'https://github.com/yukitanaka/genart', tech: 'JavaScript, Canvas API, WebGL' },
        { name: 'MotionUI', description: 'Physics-based animation library', url: 'https://github.com/yukitanaka/motionui', tech: 'TypeScript, Web Animations API' },
      ],
      socialLinks: { github: 'yukitanaka', linkedin: '', twitter: 'yukitanaka', website: 'https://yukitanaka.art', email: 'yuki@yukitanaka.art', instagram: 'yukitanaka.art', youtube: '', devto: '' },
      sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
    },
  },
];

// ---------------------------------------------------------------------------
// Single profile card
// ---------------------------------------------------------------------------
const ExploreCard = ({ profile, isAuthenticated }) => {
  const navigate   = useNavigate();
  const [tab, setTab] = useState('preview');

  const templateMeta = TEMPLATES.find((t) => t.id === profile.template) || TEMPLATES[0];
  const isLocked     = templateMeta.locked && !isAuthenticated;
  const markdown     = generateMarkdown({ ...profile.data, template: profile.template });

  const handleOpenInEditor = () => {
    if (isLocked) { startGithubLogin(); return; }
    navigate('/editor', { state: { prefill: profile.data, template: profile.template } });
  };

  return (
    <div
      className="card border-0 shadow-sm h-100 overflow-hidden"
      style={{
        backgroundColor: 'var(--glass-bg)',
        backdropFilter:  'blur(10px)',
        transition:      'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Card header */}
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid var(--glass-border)', background: `${templateMeta.accent}12` }}
      >
        <div>
          <div className="d-flex align-items-center gap-2">
            <span
              style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: templateMeta.accent, display: 'inline-block' }}
            />
            <span className="fw-semibold" style={{ color: templateMeta.accent }}>{profile.data.name}</span>
            {isLocked && (
              <span className="badge bg-secondary" style={{ fontSize: '0.6rem' }}>
                <i className="bi bi-lock-fill me-1"></i>Pro
              </span>
            )}
          </div>
          <div className="text-secondary small mt-1">{profile.label} · {templateMeta.name}</div>
        </div>

        <button
          className="btn btn-sm fw-medium flex-shrink-0"
          style={{
            backgroundColor: isLocked ? 'transparent' : templateMeta.accent,
            color:           isLocked ? templateMeta.accent : '#fff',
            border:          `1px solid ${templateMeta.accent}`,
            borderRadius:    '20px',
            padding:         '4px 14px',
          }}
          onClick={handleOpenInEditor}
        >
          {isLocked
            ? <><i className="bi bi-lock-fill me-1"></i>Unlock</>
            : <><i className="bi bi-pencil-square me-1"></i>Edit</>
          }
        </button>
      </div>

      {/* Tab switcher */}
      <div
        className="d-flex"
        style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
      >
        {['preview', 'markdown'].map((t) => (
          <button
            key={t}
            className="btn btn-sm border-0 rounded-0 px-4 py-2 fw-medium"
            style={{
              color:           tab === t ? templateMeta.accent : 'var(--text-h)',
              borderBottom:    tab === t ? `2px solid ${templateMeta.accent}` : '2px solid transparent',
              backgroundColor: 'transparent',
              transition:      'all 0.15s ease',
              textTransform:   'capitalize',
            }}
            onClick={() => setTab(t)}
          >
            <i className={`bi ${t === 'preview' ? 'bi-eye' : 'bi-code-slash'} me-1`}></i>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 overflow-auto" style={{ maxHeight: '400px', minHeight: '400px', fontSize: '0.82rem' }}>
        {tab === 'preview' ? (
          <div className="markdown-preview" style={{ fontSize: '0.82rem' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <pre
            style={{
              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              fontSize: '0.75rem', color: 'var(--text-color)', background: 'transparent',
            }}
          >
            {markdown}
          </pre>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderTop: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
      >
        <span className="text-secondary small">
          <i className="bi bi-people-fill me-1"></i>
          {profile.data.skills.length} skills · {profile.data.projects.length} projects
        </span>
        <button
          className="btn btn-sm fw-medium"
          style={{
            backgroundColor: templateMeta.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '4px 18px',
          }}
          onClick={handleOpenInEditor}
        >
          {isLocked ? 'Unlock' : 'Open in Editor'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const Explore = () => {
  const isAuthenticated        = isLoggedIn();
  const [search, setSearch]    = useState('');
  const [filter, setFilter]    = useState('all');

  const filtered = useMemo(() => {
    return EXPLORE_PROFILES.filter((p) => {
      const matchesFilter = filter === 'all' || p.template === filter;
      const q             = search.toLowerCase();
      const matchesSearch = !q
        || p.label.toLowerCase().includes(q)
        || p.data.name.toLowerCase().includes(q)
        || p.data.subtitle.toLowerCase().includes(q)
        || p.data.skills.some((s) => s.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  return (
    <div className="container fade-in-up main-content pb-5">

      {/* Page header */}
      <div className="text-center mb-5">
        <h1 className="fw-bold display-5">
          Explore <span className="gradient-text">READMEs</span>
        </h1>
        <p className="text-secondary fs-5 mt-3 mx-auto" style={{ maxWidth: 560 }}>
          Browse curated example profiles across different roles and templates.
          Click <strong>Open in Editor</strong> to use any profile as your starting point.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4 align-items-md-center justify-content-between">
        <div className="input-group" style={{ maxWidth: 360 }}>
          <span className="input-group-text border-0" style={{ backgroundColor: 'var(--glass-bg)' }}>
            <i className="bi bi-search text-secondary"></i>
          </span>
          <input
            type="text"
            className="form-control border-0 shadow-none"
            placeholder="Search by name, role, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-color)' }}
          />
          {search && (
            <button
              className="btn border-0"
              style={{ backgroundColor: 'var(--glass-bg)' }}
              onClick={() => setSearch('')}
            >
              <i className="bi bi-x text-secondary"></i>
            </button>
          )}
        </div>

        {/* Template filter pills */}
        <div className="d-flex gap-2 flex-wrap">
          {[{ id: 'all', label: 'All' }, ...TEMPLATES.map((t) => ({ id: t.id, label: t.name }))].map(({ id, label }) => {
            const meta    = TEMPLATES.find((t) => t.id === id);
            const accent  = meta?.accent || 'var(--accent-color)';
            const active  = filter === id;
            return (
              <button
                key={id}
                className="btn btn-sm rounded-pill px-3 fw-medium"
                style={{
                  backgroundColor: active ? accent : 'transparent',
                  color:           active ? '#fff' : 'var(--text-h)',
                  border:          `1px solid ${active ? accent : 'var(--border)'}`,
                  transition:      'all 0.15s ease',
                }}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="text-secondary small mb-4">
        Showing <strong>{filtered.length}</strong> of {EXPLORE_PROFILES.length} profiles
        {filter !== 'all' && <> · filtered by <strong>{TEMPLATES.find(t => t.id === filter)?.name}</strong></>}
        {search && <> · matching <strong>"{search}"</strong></>}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="row g-4">
          {filtered.map((profile) => (
            <div className="col-12 col-lg-6" key={profile.id}>
              <ExploreCard profile={profile} isAuthenticated={isAuthenticated} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-5 rounded-4 border"
          style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
        >
          <i className="bi bi-search" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
          <h5 className="mt-3 fw-semibold">No profiles found</h5>
          <p className="text-secondary small">Try a different search term or clear the filter.</p>
          <button
            className="btn btn-sm btn-outline-primary rounded-pill mt-1"
            onClick={() => { setSearch(''); setFilter('all'); }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Guest CTA */}
      {!isAuthenticated && (
        <div
          className="text-center mt-5 p-5 rounded-4 border"
          style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
        >
          <i className="bi bi-github" style={{ fontSize: '2.5rem', color: 'var(--accent-color)' }}></i>
          <h4 className="fw-bold mt-3">Unlock Pro Templates</h4>
          <p className="text-secondary mb-4">
            Login with GitHub to open Minimalist and Creative Banner profiles in the
            editor, plus auto-fill your own details from your GitHub account.
          </p>
          <button
            className="btn btn-dark rounded-pill px-4 py-2 fw-medium d-inline-flex align-items-center gap-2 hover-scale"
            onClick={startGithubLogin}
          >
            <i className="bi bi-github"></i> Login with GitHub
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;