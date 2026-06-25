// src/pages/Gallery.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import { API_URL, isLoggedIn, startGithubLogin } from '../utils/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const timeAgo = (dateStr) => {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const TEMPLATE_META = {
  modern:     { label: 'Modern',     color: '#0d6efd' },
  minimalist: { label: 'Minimalist', color: '#10b981' },
  creative:   { label: 'Creative',   color: '#ec4899' },
};

// ---------------------------------------------------------------------------
// Publish Modal — exported so Editor.jsx can import it
// ---------------------------------------------------------------------------

export const PublishModal = ({ markdown, template, onClose, onPublished }) => {
  const [title,   setTitle]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) { setError('Please enter a title for your README.'); return; }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/api/gallery/publish/`,
        { title: title.trim(), content: markdown, template },
        {
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      setSuccess(true);
      if (onPublished) onPublished();
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Publish failed. Make sure you are logged in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle rounded-4 p-4 shadow-lg"
        style={{
          zIndex:          1050,
          width:           'min(480px, 92vw)',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter:  'blur(20px)',
          border:          '1px solid var(--glass-border)',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
            <i className="bi bi-globe2 text-primary"></i>
            Publish to Gallery
          </h5>
          <button
            className="btn btn-sm btn-outline-secondary border-0 rounded-circle"
            style={{ width: 32, height: 32, padding: 0 }}
            onClick={onClose}
          >
            <i className="bi bi-x fs-5"></i>
          </button>
        </div>

        {success ? (
          <div className="text-center py-3">
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <h6 className="fw-bold mt-3" style={{ color: '#10b981' }}>
              Published successfully!
            </h6>
            <p className="text-secondary small">
              Your README is now live in the gallery.
            </p>
          </div>
        ) : (
          <>
            <p className="text-secondary small mb-3">
              Publishing adds your README to the public gallery where other
              developers can discover, preview, and fork it. You can update
              it at any time by publishing again from the editor.
            </p>

            <div className="mb-3">
              <label className="form-label fw-medium text-secondary">
                README Title *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder='e.g. "Full-Stack Developer — React & Django"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
              />
              <div
                className="text-end mt-1 text-secondary"
                style={{ fontSize: '0.72rem' }}
              >
                {title.length}/255
              </div>
            </div>

            {/* What gets published info box */}
            <div
              className="rounded-3 p-3 mb-3"
              style={{
                backgroundColor: 'rgba(13,110,253,0.06)',
                border:          '1px solid rgba(13,110,253,0.15)',
                fontSize:        '0.8rem',
              }}
            >
              <p className="fw-medium mb-2" style={{ color: 'var(--accent-color)' }}>
                <i className="bi bi-info-circle me-1"></i>
                What gets published:
              </p>
              <ul className="mb-0 text-secondary ps-3">
                <li>Your generated README content</li>
                <li>
                  Template style (
                  <strong>
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </strong>
                  )
                </li>
                <li>Your GitHub username as the author</li>
              </ul>
            </div>

            {error && (
              <div
                className="rounded-2 p-2 mb-3 d-flex align-items-start gap-2"
                style={{
                  backgroundColor: 'rgba(220,53,69,0.08)',
                  border:          '1px solid rgba(220,53,69,0.2)',
                  fontSize:        '0.82rem',
                }}
              >
                <i className="bi bi-exclamation-triangle-fill text-danger mt-1 flex-shrink-0"></i>
                <span className="text-danger">{error}</span>
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary flex-grow-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                onClick={handlePublish}
                disabled={loading || !title.trim()}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      style={{ width: '0.9rem', height: '0.9rem' }}
                    />
                    Publishing…
                  </>
                ) : (
                  <>
                    <i className="bi bi-globe2"></i>
                    Publish
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Single gallery card
// ---------------------------------------------------------------------------

const GalleryCard = ({ item, onFork }) => {
  const navigate          = useNavigate();
  const [tab, setTab]     = useState('preview');
  const [forking, setForking] = useState(false);
  const [forked,  setForked]  = useState(false);

  const meta = TEMPLATE_META[item.template_id] || TEMPLATE_META.modern;

  const handleFork = async () => {
    if (!isLoggedIn()) { startGithubLogin(); return; }
    setForking(true);
    try {
      const res = await axios.post(`${API_URL}/api/gallery/${item.slug}/fork/`);
      onFork(item.slug, res.data.fork_count);
      setForked(true);
      setTimeout(() => {
        navigate('/editor', {
          state: {
            prefill:  { aiContent: res.data.content },
            template: res.data.template,
          },
        });
      }, 600);
    } catch (err) {
      console.error('Fork failed:', err);
      setForking(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'preview') {
      axios.post(`${API_URL}/api/gallery/${item.slug}/view/`).catch(() => {});
    }
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
        className="p-3 d-flex justify-content-between align-items-start gap-2"
        style={{
          borderBottom: '1px solid var(--glass-border)',
          background:   `${meta.color}12`,
        }}
      >
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <span
              className="badge rounded-pill px-2 py-1"
              style={{
                backgroundColor: `${meta.color}20`,
                color:           meta.color,
                fontSize:        '0.65rem',
                border:          `1px solid ${meta.color}40`,
                flexShrink:      0,
              }}
            >
              {meta.label}
            </span>
            <h6
              className="fw-bold m-0 text-truncate"
              style={{ color: meta.color }}
            >
              {item.title}
            </h6>
          </div>
          <div
            className="d-flex align-items-center gap-2 flex-wrap"
            style={{ fontSize: '0.75rem', color: 'var(--text-h)' }}
          >
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={item.created_by}
                width={18} height={18}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <i className="bi bi-person-circle"></i>
            )}
            <span className="fw-medium">{item.created_by || 'Anonymous'}</span>
            <span className="text-secondary">·</span>
            <span className="text-secondary">{timeAgo(item.created_at)}</span>
          </div>
        </div>

        {/* Fork button */}
        <button
          className="btn btn-sm fw-medium flex-shrink-0"
          style={{
            backgroundColor: forked ? '#10b981' : meta.color,
            color:           '#fff',
            border:          'none',
            borderRadius:    '20px',
            padding:         '4px 14px',
            fontSize:        '0.8rem',
            minWidth:        72,
            transition:      'background-color 0.2s ease',
          }}
          onClick={handleFork}
          disabled={forking}
        >
          {forking ? (
            <span
              className="spinner-border spinner-border-sm"
              style={{ width: '0.8rem', height: '0.8rem' }}
            />
          ) : forked ? (
            <><i className="bi bi-check me-1"></i>Forked</>
          ) : (
            <><i className="bi bi-git me-1"></i>Fork</>
          )}
        </button>
      </div>

      {/* Tab switcher */}
      <div
        className="d-flex"
        style={{
          borderBottom:    '1px solid var(--glass-border)',
          backgroundColor: 'var(--glass-bg)',
        }}
      >
        {['preview', 'markdown'].map((t) => (
          <button
            key={t}
            className="btn btn-sm border-0 rounded-0 px-4 py-2 fw-medium"
            style={{
              color:           tab === t ? meta.color : 'var(--text-h)',
              borderBottom:    tab === t ? `2px solid ${meta.color}` : '2px solid transparent',
              backgroundColor: 'transparent',
              transition:      'all 0.15s ease',
              textTransform:   'capitalize',
              fontSize:        '0.82rem',
            }}
            onClick={() => handleTabChange(t)}
          >
            <i className={`bi ${t === 'preview' ? 'bi-eye' : 'bi-code-slash'} me-1`}></i>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="p-3 overflow-auto"
        style={{ maxHeight: '380px', minHeight: '380px', fontSize: '0.82rem' }}
      >
        {tab === 'preview' ? (
          <div className="markdown-preview" style={{ fontSize: '0.82rem' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {item.content}
            </ReactMarkdown>
          </div>
        ) : (
          <pre
            style={{
              margin:     0,
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
              fontSize:   '0.73rem',
              color:      'var(--text-color)',
              background: 'transparent',
            }}
          >
            {item.content}
          </pre>
        )}
      </div>

      {/* Card footer */}
      <div
        className="px-3 py-2 d-flex justify-content-between align-items-center"
        style={{
          borderTop:       '1px solid var(--glass-border)',
          backgroundColor: 'var(--glass-bg)',
          fontSize:        '0.75rem',
        }}
      >
        <div className="d-flex gap-3" style={{ color: 'var(--text-h)' }}>
          <span title="Views">
            <i className="bi bi-eye me-1"></i>
            {item.view_count ?? 0}
          </span>
          <span title="Forks">
            <i className="bi bi-git me-1"></i>
            {item.fork_count ?? 0}
          </span>
        </div>
        <button
          className="btn btn-sm fw-medium"
          style={{
            backgroundColor: meta.color,
            color:           '#fff',
            border:          'none',
            borderRadius:    '20px',
            padding:         '3px 16px',
            fontSize:        '0.78rem',
          }}
          onClick={handleFork}
          disabled={forking}
        >
          Open in Editor
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gallery page
// ---------------------------------------------------------------------------

const Gallery = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [sortBy,  setSortBy]  = useState('newest');

  const isAuthenticated = isLoggedIn();

  const fetchGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter !== 'all') params.template = filter;

      const res = await axios.get(`${API_URL}/api/gallery/`, { params });
      setItems(res.data);
    } catch (err) {
      setError('Failed to load gallery. Please try again.');
      console.error('Gallery fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [filter]);

  // Client-side search + sort
  const displayed = useMemo(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.created_by?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'forks') {
      result.sort((a, b) => (b.fork_count ?? 0) - (a.fork_count ?? 0));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
    }

    return result;
  }, [items, search, sortBy]);

  const handleForkUpdate = (slug, newCount) => {
    setItems((prev) =>
      prev.map((item) =>
        item.slug === slug ? { ...item, fork_count: newCount } : item
      )
    );
  };

  return (
    <div className="container fade-in-up main-content pb-5">

      {/* Page header */}
      <div className="text-center mb-5">
        <h1 className="fw-bold display-5">
          Community <span className="gradient-text">Gallery</span>
        </h1>
        <p
          className="text-secondary fs-5 mt-3 mx-auto"
          style={{ maxWidth: 560 }}
        >
          Browse READMEs published by the community. Fork any profile into
          the editor and make it your own in seconds.
        </p>
        {!isAuthenticated && (
          <div
            className="alert d-inline-flex align-items-center gap-2 mt-3 px-4 py-2 border-0 rounded-pill"
            style={{
              backgroundColor: 'rgba(13,110,253,0.1)',
              color:           'var(--accent-color)',
            }}
          >
            <i className="bi bi-info-circle-fill"></i>
            <span className="small fw-medium">
              Login with GitHub to publish your own README
            </span>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4 align-items-md-center">

        {/* Search */}
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span
            className="input-group-text border-0"
            style={{ backgroundColor: 'var(--glass-bg)' }}
          >
            <i className="bi bi-search text-secondary"></i>
          </span>
          <input
            type="text"
            className="form-control border-0 shadow-none"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: 'var(--glass-bg)',
              color:           'var(--text-color)',
            }}
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
          {[
            { id: 'all',        label: 'All',        color: 'var(--accent-color)' },
            { id: 'modern',     label: 'Modern',     color: '#0d6efd'             },
            { id: 'minimalist', label: 'Minimalist', color: '#10b981'             },
            { id: 'creative',   label: 'Creative',   color: '#ec4899'             },
          ].map(({ id, label, color }) => (
            <button
              key={id}
              className="btn btn-sm rounded-pill px-3 fw-medium"
              style={{
                backgroundColor: filter === id ? color : 'transparent',
                color:           filter === id ? '#fff' : 'var(--text-h)',
                border:          `1px solid ${filter === id ? color : 'var(--border)'}`,
                transition:      'all 0.15s ease',
              }}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ms-md-auto">
          <select
            className="form-select form-select-sm border-0"
            style={{
              backgroundColor: 'var(--glass-bg)',
              color:           'var(--text-color)',
              minWidth:        140,
            }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="forks">Most forked</option>
            <option value="views">Most viewed</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-secondary small mb-4">
          Showing <strong>{displayed.length}</strong> of {items.length} READMEs
          {filter !== 'all' && (
            <> · filtered by{' '}
              <strong>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </strong>
            </>
          )}
          {search && <> · matching <strong>"{search}"</strong></>}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: '2.5rem', height: '2.5rem' }}
          />
          <p className="text-secondary mt-3">Loading gallery…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="text-center py-5 rounded-4 border"
          style={{
            backgroundColor: 'var(--glass-bg)',
            borderColor:     'var(--glass-border)',
          }}
        >
          <i
            className="bi bi-exclamation-triangle text-danger"
            style={{ fontSize: '2.5rem' }}
          ></i>
          <h5 className="mt-3 fw-semibold">Failed to load gallery</h5>
          <p className="text-secondary small">{error}</p>
          <button
            className="btn btn-outline-primary btn-sm rounded-pill mt-1"
            onClick={fetchGallery}
          >
            <i className="bi bi-arrow-repeat me-1"></i>Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && displayed.length === 0 && (
        <div
          className="text-center py-5 rounded-4 border"
          style={{
            backgroundColor: 'var(--glass-bg)',
            borderColor:     'var(--glass-border)',
          }}
        >
          <i
            className="bi bi-collection"
            style={{ fontSize: '2.5rem', opacity: 0.3 }}
          ></i>
          <h5 className="mt-3 fw-semibold">
            {search || filter !== 'all'
              ? 'No READMEs match your filters'
              : 'The gallery is empty'}
          </h5>
          <p className="text-secondary small">
            {search || filter !== 'all'
              ? 'Try clearing the search or filter.'
              : 'Be the first to publish your README!'}
          </p>
          {(search || filter !== 'all') && (
            <button
              className="btn btn-sm btn-outline-primary rounded-pill mt-1"
              onClick={() => { setSearch(''); setFilter('all'); }}
            >
              Clear filters
            </button>
          )}
          {isAuthenticated && !search && filter === 'all' && (
            <button
              className="btn btn-primary rounded-pill px-4 mt-2"
              onClick={() => window.location.href = '/editor'}
            >
              <i className="bi bi-pencil-square me-2"></i>
              Create your README
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && displayed.length > 0 && (
        <div className="row g-4">
          {displayed.map((item) => (
            <div className="col-12 col-lg-6" key={item.id}>
              <GalleryCard item={item} onFork={handleForkUpdate} />
            </div>
          ))}
        </div>
      )}

      {/* Guest CTA */}
      {!isAuthenticated && !loading && (
        <div
          className="text-center mt-5 p-5 rounded-4 border"
          style={{
            backgroundColor: 'var(--glass-bg)',
            borderColor:     'var(--glass-border)',
          }}
        >
          <i
            className="bi bi-github"
            style={{ fontSize: '2.5rem', color: 'var(--accent-color)' }}
          ></i>
          <h4 className="fw-bold mt-3">Share Your README</h4>
          <p className="text-secondary mb-4">
            Login with GitHub to publish your README to the community gallery
            and inspire other developers.
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

export default Gallery;