// src/pages/Editor.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { generateMarkdown } from '../utils/markdownGenerator';
import { isLoggedIn, getStoredUser } from '../utils/auth';
import { DEFAULT_TEMPLATE_ID } from '../utils/templates';
import SkillsPicker from '../components/SkillsPicker';
import SocialLinksPicker from '../components/SocialLinksPicker';
import TemplateSelector from '../components/TemplateSelector';

const SECTION_NAMES = {
  header:      'Header & Title',
  description: 'Description',
  about:       'About Me',
  skills:      'Tech Stack',
  social:      'Social Links',
  projects:    'Projects',
  stats:       'GitHub Stats',
};

const EMPTY_PROJECT = { name: '', description: '', url: '', tech: '' };

const DEFAULT_FORM_DATA = {
  name:            '',
  subtitle:        'A passionate developer',
  description:     '',
  bio:             '',
  currentLearning: '',
  portfolio:       '',
  email:           '',
  githubUsername:  '',
  skills:          ['React', 'JavaScript', 'Python'],
  socialLinks: {
    github:    '',
    linkedin:  '',
    twitter:   '',
    instagram: '',
    youtube:   '',
    devto:     '',
    website:   '',
    email:     '',
  },
  projects:  [],
  showStats: true,
  theme:     'radical',
  template:  DEFAULT_TEMPLATE_ID,
  sections:  ['header', 'description', 'about', 'skills', 'projects', 'social', 'stats'],
};

const Editor = () => {
  const location                              = useLocation();
  const [formData, setFormData]               = useState(DEFAULT_FORM_DATA);
  const [markdown, setMarkdown]               = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 1. Check auth + prefill from stored GitHub user
  useEffect(() => {
    const authenticated = isLoggedIn();
    setIsAuthenticated(authenticated);

    const userData = getStoredUser();
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        name:           userData.name || userData.first_name || prev.name,
        githubUsername: userData.username || userData.github_username || prev.githubUsername,
        description:    userData.bio || prev.description,
        email:          userData.email || prev.email,
        socialLinks: {
          ...prev.socialLinks,
          github: prev.socialLinks.github || userData.username || '',
        },
      }));
    }
  }, []);

  // 2. Prefill from Explore page or Templates page navigation state
  useEffect(() => {
    if (!location.state) return;

    if (location.state.prefill) {
      setFormData((prev) => ({
        ...prev,
        ...location.state.prefill,
        // preserve auth-prefilled user data if it was already set
        name:           location.state.prefill.name || prev.name,
        githubUsername: location.state.prefill.githubUsername || prev.githubUsername,
      }));
    }

    if (location.state.template) {
      setFormData((prev) => ({ ...prev, template: location.state.template }));
    }
  }, [location.state]);

  // 3. Guard locked templates for guests
  useEffect(() => {
    if (!isAuthenticated && formData.template !== DEFAULT_TEMPLATE_ID) {
      setFormData((prev) => ({ ...prev, template: DEFAULT_TEMPLATE_ID }));
    }
  }, [isAuthenticated, formData.template]);

  // 4. Regenerate markdown on every form change
  useEffect(() => {
    setMarkdown(generateMarkdown(formData));
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ── Projects helpers ──────────────────────────────────────────────────────
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { ...EMPTY_PROJECT }],
    }));
  };

  const updateProject = (index, field, value) => {
    setFormData((prev) => {
      const updated = prev.projects.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
      return { ...prev, projects: updated };
    });
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  // ── Drag-and-drop section reorder ─────────────────────────────────────────
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('dragIndex', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    const dragIndex = Number(e.dataTransfer.getData('dragIndex'));
    const newSections = [...formData.sections];
    const [dragged] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, dragged);
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  // ── Export actions ────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    alert('Markdown copied to clipboard! ✅');
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container-fluid px-4 fade-in-up mb-5" style={{ paddingTop: '90px' }}>
      <div className="row g-4 h-100">

        {/* ── Left: settings panel ── */}
        <div className="col-lg-5">
          <div
            className="card shadow-sm border-0 h-100 p-4 overflow-auto"
            style={{
              backgroundColor: 'var(--glass-bg)',
              backdropFilter:  'blur(10px)',
              maxHeight:       '85vh',
            }}
          >
            <h4 className="fw-bold mb-4">✍️ Customize Profile</h4>

            <form>

              {/* ── Template ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-palette me-1"></i> Template
                </h6>
                <TemplateSelector
                  selected={formData.template}
                  isAuthenticated={isAuthenticated}
                  onChange={(template) => setFormData((prev) => ({ ...prev, template }))}
                />
              </div>

              {/* ── Basic Info ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-person me-1"></i> Basic Info
                </h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Your Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="e.g. Linus Torvalds"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Subtitle / Catchphrase</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* ── Description ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-card-text me-1"></i> Description
                </h6>
                <label className="form-label text-secondary fw-medium">
                  A short intro for your profile
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="3"
                  placeholder="e.g. Full-stack developer based in Berlin, building developer tools."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              {/* ── About Me ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-info-circle me-1"></i> About Me
                </h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Currently working on</label>
                  <input
                    type="text"
                    className="form-control"
                    name="bio"
                    placeholder="e.g. A new open source project"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Currently learning</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currentLearning"
                    placeholder="e.g. Machine Learning, Rust"
                    value={formData.currentLearning}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* ── Tech Stack ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-tools me-1"></i> Tech Stack
                </h6>
                <label className="form-label text-secondary fw-medium mb-3">
                  Select your skills:
                </label>
                <SkillsPicker
                  selectedSkills={formData.skills}
                  onChange={(newSkills) =>
                    setFormData((prev) => ({ ...prev, skills: newSkills }))
                  }
                />
              </div>

              {/* ── Projects ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-folder2-open me-1"></i> Projects
                </h6>
                <p className="text-muted small">
                  Showcase your best work — each project appears as a row in your README.
                </p>

                {formData.projects.map((project, index) => (
                  <div
                    key={index}
                    className="border rounded-3 p-3 mb-3 position-relative"
                    style={{ backgroundColor: 'rgba(127,127,127,0.05)' }}
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 py-0 px-2"
                      onClick={() => removeProject(index)}
                      title="Remove project"
                    >
                      <i className="bi bi-x"></i>
                    </button>

                    <div className="mb-2">
                      <label className="form-label text-secondary small fw-medium mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Portfolio Website"
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label text-secondary small fw-medium mb-1">
                        Short Description
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Personal portfolio built with React"
                        value={project.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label text-secondary small fw-medium mb-1">
                        GitHub / Live URL
                      </label>
                      <input
                        type="url"
                        className="form-control form-control-sm"
                        placeholder="https://github.com/you/project"
                        value={project.url}
                        onChange={(e) => updateProject(index, 'url', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label text-secondary small fw-medium mb-1">
                        Tech Used
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. React, Django, PostgreSQL"
                        value={project.tech}
                        onChange={(e) => updateProject(index, 'tech', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={addProject}
                >
                  <i className="bi bi-plus-circle"></i> Add Project
                </button>
              </div>

              {/* ── Social Links ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-link-45deg me-1"></i> Social Media Links
                </h6>
                <SocialLinksPicker
                  values={formData.socialLinks}
                  onChange={(socialLinks) =>
                    setFormData((prev) => ({ ...prev, socialLinks }))
                  }
                />
              </div>

              {/* ── GitHub Integration ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-github me-1"></i> GitHub Integration
                </h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">GitHub Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="githubUsername"
                    placeholder="Enter username for stats"
                    value={formData.githubUsername}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="showStats"
                    id="showStats"
                    checked={formData.showStats}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label text-secondary" htmlFor="showStats">
                    Show GitHub Stats Card
                  </label>
                </div>
                {formData.showStats && (
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-medium">Stats Theme</label>
                    <select
                      className="form-select"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                    >
                      <option value="radical">Radical</option>
                      <option value="tokyonight">Tokyo Night</option>
                      <option value="github_dark">GitHub Dark</option>
                      <option value="dracula">Dracula</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ── Reorder Sections ── */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3">
                  <i className="bi bi-list-task me-1"></i> Reorder Sections
                </h6>
                <p className="text-muted small">
                  Drag and drop to rearrange sections in your README.
                </p>
                <div className="d-flex flex-column gap-2">
                  {formData.sections.map((sec, index) => (
                    <div
                      key={sec}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="p-2 border rounded shadow-sm bg-body"
                      style={{ cursor: 'grab' }}
                    >
                      <i className="bi bi-grip-vertical text-secondary me-2"></i>
                      {SECTION_NAMES[sec]}
                    </div>
                  ))}
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="col-lg-7">
          <div
            className="card shadow-sm border-0 h-100 p-0 overflow-hidden d-flex flex-column"
            style={{
              backgroundColor: 'var(--bg-color)',
              border:          '1px solid var(--glass-border)',
              maxHeight:       '85vh',
            }}
          >
            {/* Preview toolbar */}
            <div
              className="d-flex justify-content-between align-items-center p-3 border-bottom"
              style={{ backgroundColor: 'var(--glass-bg)' }}
            >
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-eye text-primary"></i> Live Preview
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
                  onClick={handleCopy}
                >
                  <i className="bi bi-clipboard"></i> Copy
                </button>
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
                  onClick={handleDownload}
                >
                  <i className="bi bi-download"></i> Download
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="p-4 overflow-auto flex-grow-1 bg-body">
              {markdown ? (
                <div className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {markdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-muted mt-5">
                  Start typing to see the magic... ✨
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Editor;