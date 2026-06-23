// src/pages/Templates.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { TEMPLATES } from '../utils/templates';
import { generateMarkdown } from '../utils/markdownGenerator';
import { isLoggedIn, startGithubLogin } from '../utils/auth';

// ---------------------------------------------------------------------------
// Sample data used to render each template preview so the user sees a
// realistic populated README rather than a blank card.
// ---------------------------------------------------------------------------
const PREVIEW_DATA = {
  name:            'Alex Johnson',
  subtitle:        'Full-Stack Developer & Open Source Enthusiast',
  description:     'Building elegant solutions to complex problems. Passionate about clean code, great UX, and developer tooling.',
  bio:             'An open-source CLI toolkit for developers',
  currentLearning: 'Rust & WebAssembly',
  githubUsername:  'alexjohnson',
  showStats:       true,
  theme:           'radical',
  skills:          ['React', 'TypeScript', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
  projects: [
    { name: 'DevToolkit', description: 'CLI toolkit for developers', url: 'https://github.com/alexjohnson/devtoolkit', tech: 'Rust, CLI' },
    { name: 'Portfolio',  description: 'Personal portfolio site',    url: 'https://alexjohnson.dev',                   tech: 'React, Tailwind' },
  ],
  socialLinks: {
    github:    'alexjohnson',
    linkedin:  'alexjohnson',
    twitter:   'alexjohnson',
    instagram: '',
    youtube:   '',
    devto:     'alexjohnson',
    website:   'https://alexjohnson.dev',
    email:     'alex@alexjohnson.dev',
  },
  sections: ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
};

// ---------------------------------------------------------------------------
// Single template card
// ---------------------------------------------------------------------------
const TemplateCard = ({ template, isAuthenticated }) => {
  const navigate   = useNavigate();
  const isLocked   = template.locked && !isAuthenticated;
  const [tab, setTab] = useState('preview'); // 'preview' | 'markdown'

  const previewMarkdown = generateMarkdown({ ...PREVIEW_DATA, template: template.id });

  const handleUse = () => {
    if (isLocked) {
      startGithubLogin();
      return;
    }
    navigate('/editor', { state: { template: template.id } });
  };

  return (
    <div
      className="card border-0 shadow-sm h-100 overflow-hidden"
      style={{
        backgroundColor:  'var(--glass-bg)',
        backdropFilter:   'blur(10px)',
        borderTop:        `3px solid ${template.accent} !important`,
        transition:       'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform  = 'translateY(-4px)';
        e.currentTarget.style.boxShadow  = `0 12px 32px rgba(0,0,0,0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform  = '';
        e.currentTarget.style.boxShadow  = '';
      }}
    >
      {/* Card header */}
      <div
        className="p-3 d-flex justify-content-between align-items-start"
        style={{ borderBottom: `1px solid var(--glass-border)`, background: `${template.accent}12` }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: template.accent, display: 'inline-block' }}
            />
            <h5 className="fw-bold m-0" style={{ color: template.accent }}>{template.name}</h5>
            {isLocked && (
              <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem' }}>
                <i className="bi bi-lock-fill me-1"></i>Pro
              </span>
            )}
          </div>
          <p className="text-secondary small m-0">{template.tagline}</p>
        </div>

        <button
          className="btn btn-sm fw-medium flex-shrink-0 ms-3"
          style={{
            backgroundColor: isLocked ? 'transparent' : template.accent,
            color:           isLocked ? template.accent : '#fff',
            border:          `1px solid ${template.accent}`,
            borderRadius:    '20px',
            padding:         '4px 16px',
          }}
          onClick={handleUse}
        >
          {isLocked
            ? <><i className="bi bi-github me-1"></i>Unlock</>
            : <><i className="bi bi-pencil-square me-1"></i>Use</>
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
              color:           tab === t ? template.accent : 'var(--text-h)',
              borderBottom:    tab === t ? `2px solid ${template.accent}` : '2px solid transparent',
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

      {/* Content area */}
      <div
        className="p-3 overflow-auto"
        style={{ maxHeight: '420px', minHeight: '420px', fontSize: '0.82rem' }}
      >
        {tab === 'preview' ? (
          <div className="markdown-preview" style={{ fontSize: '0.82rem' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {previewMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <pre
            style={{
              margin:     0,
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
              fontSize:   '0.75rem',
              color:      'var(--text-color)',
              background: 'transparent',
            }}
          >
            {previewMarkdown}
          </pre>
        )}
      </div>

      {/* Card footer */}
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderTop: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
      >
        {isLocked ? (
          <span className="text-secondary small">
            <i className="bi bi-github me-1"></i>Login with GitHub to unlock
          </span>
        ) : (
          <span className="text-secondary small">
            <i className="bi bi-check-circle-fill me-1" style={{ color: template.accent }}></i>
            Free — no login required
          </span>
        )}
        <button
          className="btn btn-sm fw-medium"
          style={{
            backgroundColor: template.accent,
            color:           '#fff',
            border:          'none',
            borderRadius:    '20px',
            padding:         '4px 20px',
          }}
          onClick={handleUse}
        >
          {isLocked ? 'Unlock' : 'Use Template'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const Templates = () => {
  const isAuthenticated = isLoggedIn();

  return (
    <div className="container fade-in-up main-content pb-5">

      {/* Page header */}
      <div className="text-center mb-5">
        <h1 className="fw-bold display-5">
          Choose a <span className="gradient-text">Template</span>
        </h1>
        <p className="text-secondary fs-5 mt-3 mx-auto" style={{ maxWidth: 560 }}>
          Pick a style that matches your personality. Every template is fully
          customisable in the editor — swap sections, update links, and preview
          in real time.
        </p>
        {!isAuthenticated && (
          <div
            className="alert d-inline-flex align-items-center gap-2 mt-3 px-4 py-2 border-0 rounded-pill"
            style={{ backgroundColor: 'rgba(13,110,253,0.1)', color: 'var(--accent-color)' }}
          >
            <i className="bi bi-info-circle-fill"></i>
            <span className="small fw-medium">
              Login with GitHub to unlock all templates
            </span>
          </div>
        )}
      </div>

      {/* Template grid */}
      <div className="row g-4">
        {TEMPLATES.map((template) => (
          <div className="col-12 col-lg-4" key={template.id}>
            <TemplateCard template={template} isAuthenticated={isAuthenticated} />
          </div>
        ))}
      </div>

      {/* Bottom CTA for guests */}
      {!isAuthenticated && (
        <div
          className="text-center mt-5 p-5 rounded-4 border"
          style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
        >
          <i className="bi bi-github" style={{ fontSize: '2.5rem', color: 'var(--accent-color)' }}></i>
          <h4 className="fw-bold mt-3">Unlock All Templates</h4>
          <p className="text-secondary mb-4">
            Login with GitHub to access the Minimalist and Creative Banner templates,
            plus auto-fill your profile from your GitHub account.
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

export default Templates;