import React, { useState, useEffect } from 'react';
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
  header: 'Header & Title',
  description: 'Description',
  about: 'About Me',
  skills: 'Tech Stack',
  social: 'Social Links',
  stats: 'GitHub Stats'
};

const DEFAULT_FORM_DATA = {
  name: '',
  subtitle: 'A passionate developer',
  description: '',
  bio: '',
  currentLearning: '',
  portfolio: '',
  email: '',
  githubUsername: '',
  skills: ['React', 'JavaScript', 'Python'],
  socialLinks: {
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    youtube: '',
    devto: '',
    website: '',
    email: '',
  },
  showStats: true,
  theme: 'radical',
  template: DEFAULT_TEMPLATE_ID,
  sections: ['header', 'description', 'about', 'skills', 'social', 'stats']
};

const Editor = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [markdown, setMarkdown] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 1. Check auth state + prefill from the GitHub user stored at login time.
  useEffect(() => {
    const authenticated = isLoggedIn();
    setIsAuthenticated(authenticated);

    const userData = getStoredUser();
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || userData.first_name || prev.name,
        githubUsername: userData.username || userData.github_username || prev.githubUsername,
        description: userData.bio || prev.description,
        email: userData.email || prev.email,
        socialLinks: {
          ...prev.socialLinks,
          github: prev.socialLinks.github || userData.username || '',
        },
      }));
    }
  }, []);

  // 2. Guests only get the free "modern" template -- guard against a stale
  //    selection if someone logs out mid-session.
  useEffect(() => {
    if (!isAuthenticated && formData.template !== DEFAULT_TEMPLATE_ID) {
      setFormData((prev) => ({ ...prev, template: DEFAULT_TEMPLATE_ID }));
    }
  }, [isAuthenticated, formData.template]);

  // 3. Regenerate markdown whenever the form changes.
  useEffect(() => {
    const md = generateMarkdown(formData);
    setMarkdown(md);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    const newSections = [...formData.sections];
    const draggedItem = newSections.splice(dragIndex, 1)[0];
    newSections.splice(dropIndex, 0, draggedItem);

    setFormData({ ...formData, sections: newSections });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    alert('Markdown code copied to clipboard! ✅');
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = "README.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container-fluid px-4 fade-in-up mb-5" style={{ paddingTop: '90px' }}>
      <div className="row g-4 h-100">

        {/* Left column: settings */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100 p-4 overflow-auto" style={{ backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(10px)', maxHeight: '85vh' }}>
            <h4 className="fw-bold mb-4">✍️ Customize Profile</h4>

            <form>
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-palette"></i> Template</h6>
                <TemplateSelector
                  selected={formData.template}
                  isAuthenticated={isAuthenticated}
                  onChange={(template) => setFormData({ ...formData, template })}
                />
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-person"></i> Basic Info</h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Your Name</label>
                  <input type="text" className="form-control" name="name" placeholder="e.g. Linus Torvalds" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Subtitle / Catchphrase</label>
                  <input type="text" className="form-control" name="subtitle" value={formData.subtitle} onChange={handleInputChange} />
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-card-text"></i> Description</h6>
                <div className="mb-1">
                  <label className="form-label text-secondary fw-medium">A short intro for your profile</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="3"
                    placeholder="e.g. Full-stack developer based in Berlin, building developer tools and obsessing over clean APIs."
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-info-circle"></i> About Me</h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Currently working on</label>
                  <input type="text" className="form-control" name="bio" placeholder="e.g. A new open source project" value={formData.bio} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">Currently learning</label>
                  <input type="text" className="form-control" name="currentLearning" placeholder="e.g. Machine Learning, Rust" value={formData.currentLearning} onChange={handleInputChange} />
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-tools"></i> Tech Stack</h6>
                <label className="form-label text-secondary fw-medium mb-3">Select your skills:</label>
                <SkillsPicker
                  selectedSkills={formData.skills}
                  onChange={(newSkills) => setFormData({ ...formData, skills: newSkills })}
                />
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-link-45deg"></i> Social Media Links</h6>
                <SocialLinksPicker
                  values={formData.socialLinks}
                  onChange={(socialLinks) => setFormData({ ...formData, socialLinks })}
                />
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-github"></i> GitHub Integration</h6>
                <div className="mb-3">
                  <label className="form-label text-secondary fw-medium">GitHub Username</label>
                  <input type="text" className="form-control" name="githubUsername" placeholder="Enter username for stats" value={formData.githubUsername} onChange={handleInputChange} />
                </div>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" name="showStats" id="showStats" checked={formData.showStats} onChange={handleInputChange} />
                  <label className="form-check-label text-secondary" htmlFor="showStats">Show GitHub Stats Card</label>
                </div>
                {formData.showStats && (
                  <div className="mb-3">
                    <label className="form-label text-secondary fw-medium">Stats Theme</label>
                    <select className="form-select" name="theme" value={formData.theme} onChange={handleInputChange}>
                      <option value="radical">Radical</option>
                      <option value="tokyonight">Tokyo Night</option>
                      <option value="github_dark">GitHub Dark</option>
                      <option value="dracula">Dracula</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-3"><i className="bi bi-list-task"></i> Reorder Sections</h6>
                <p className="text-muted small">Drag and drop to rearrange the sections in your README.</p>
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

        {/* Right column: preview */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100 p-0 overflow-hidden d-flex flex-column" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--glass-border)', maxHeight: '85vh' }}>

            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ backgroundColor: 'var(--glass-bg)' }}>
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-eye text-primary"></i> Live Preview
              </h5>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 shadow-sm" onClick={handleCopy}>
                  <i className="bi bi-clipboard"></i> Copy
                </button>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm" onClick={handleDownload}>
                  <i className="bi bi-download"></i> Download
                </button>
              </div>
            </div>

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