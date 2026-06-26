// src/pages/PreviewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import { API_URL } from '../utils/auth';

const TEMPLATE_META = {
  modern:     { label: 'Modern',     color: '#0d6efd' },
  minimalist: { label: 'Minimalist', color: '#10b981' },
  creative:   { label: 'Creative',   color: '#ec4899' },
};

// ---------------------------------------------------------------------------
// Countdown to expiry
// ---------------------------------------------------------------------------
const ExpiryBadge = ({ expiresAt }) => {
  const now      = new Date();
  const expiry   = new Date(expiresAt);
  const diffMs   = expiry - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) return null;

  const color = diffDays <= 3
    ? '#ef4444'
    : diffDays <= 7
      ? '#f59e0b'
      : '#10b981';

  return (
    <span
      className="badge rounded-pill px-2 py-1"
      style={{
        backgroundColor: `${color}18`,
        color,
        border:          `1px solid ${color}40`,
        fontSize:        '0.7rem',
      }}
    >
      <i className="bi bi-clock me-1"></i>
      {diffDays === 1 ? 'Expires tomorrow' : `Expires in ${diffDays} days`}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Share button with copy-to-clipboard feedback
// ---------------------------------------------------------------------------
const ShareButton = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <button
      type="button"
      className="btn btn-sm fw-medium d-flex align-items-center gap-2"
      style={{
        backgroundColor: copied ? 'rgba(16,185,129,0.12)' : 'var(--glass-bg)',
        color:           copied ? '#10b981' : 'var(--text-color)',
        border:          `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
        borderRadius:    '20px',
        padding:         '5px 14px',
        transition:      'all 0.2s ease',
      }}
      onClick={handleCopy}
    >
      <i className={`bi ${copied ? 'bi-check-lg' : 'bi-link-45deg'}`}></i>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
};

// ---------------------------------------------------------------------------
// PreviewPage
// ---------------------------------------------------------------------------
const PreviewPage = () => {
  const { slug }            = useParams();
  const navigate            = useNavigate();
  const [data,    setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError] = useState(null);
  const [tab,     setTab]   = useState('preview');

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/api/preview/${slug}/`);
        setData(res.data);
      } catch (err) {
        if (err.response?.status === 410) {
          setError('expired');
        } else if (err.response?.status === 404) {
          setError('notfound');
        } else {
          setError('unknown');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [slug]);

  const shareUrl     = window.location.href;
  const templateMeta = data ? (TEMPLATE_META[data.template] || TEMPLATE_META.modern) : null;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="spinner-container fade-in-up">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <h5 className="mt-4 fw-medium text-secondary">Loading preview…</h5>
      </div>
    );
  }

  // ── Error: Expired ────────────────────────────────────────────────────────
  if (error === 'expired') {
    return (
      <div className="spinner-container fade-in-up">
        <i
          className="bi bi-hourglass-bottom"
          style={{ fontSize: '3rem', color: '#f59e0b' }}
        ></i>
        <h3 className="mt-3 fw-bold">Preview Expired</h3>
        <p className="text-secondary text-center" style={{ maxWidth: 400 }}>
          This shareable preview link has expired. Preview links are valid for
          30 days from creation.
        </p>
        <button
          className="btn btn-primary rounded-pill px-4 mt-2"
          onClick={() => navigate('/editor')}
        >
          <i className="bi bi-pencil-square me-2"></i>
          Create a new README
        </button>
      </div>
    );
  }

  // ── Error: Not found ──────────────────────────────────────────────────────
  if (error === 'notfound') {
    return (
      <div className="spinner-container fade-in-up">
        <i
          className="bi bi-file-earmark-x"
          style={{ fontSize: '3rem', opacity: 0.3 }}
        ></i>
        <h3 className="mt-3 fw-bold">Preview Not Found</h3>
        <p className="text-secondary text-center" style={{ maxWidth: 400 }}>
          This preview link doesn't exist or may have been removed.
        </p>
        <button
          className="btn btn-primary rounded-pill px-4 mt-2"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-house me-2"></i>
          Go home
        </button>
      </div>
    );
  }

  // ── Error: Unknown ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="spinner-container fade-in-up">
        <i
          className="bi bi-exclamation-triangle"
          style={{ fontSize: '3rem', color: '#ef4444' }}
        ></i>
        <h3 className="mt-3 fw-bold">Something went wrong</h3>
        <p className="text-secondary">Failed to load this preview. Please try again.</p>
        <button
          className="btn btn-outline-primary rounded-pill px-4 mt-2"
          onClick={() => window.location.reload()}
        >
          <i className="bi bi-arrow-repeat me-2"></i>
          Retry
        </button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <div
      className="container fade-in-up pb-5"
      style={{ paddingTop: '100px', maxWidth: 900 }}
    >

      {/* ── Top bar ── */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 rounded-4"
        style={{
          backgroundColor: 'var(--glass-bg)',
          backdropFilter:  'blur(12px)',
          border:          '1px solid var(--glass-border)',
        }}
      >
        {/* Left: title + meta */}
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <i className="bi bi-github fs-5"></i>
            <h5 className="fw-bold m-0">
              {data.title || 'README Preview'}
            </h5>
            {templateMeta && (
              <span
                className="badge rounded-pill px-2 py-1"
                style={{
                  backgroundColor: `${templateMeta.color}18`,
                  color:           templateMeta.color,
                  border:          `1px solid ${templateMeta.color}40`,
                  fontSize:        '0.68rem',
                }}
              >
                {templateMeta.label}
              </span>
            )}
            {data.expires_at && (
              <ExpiryBadge expiresAt={data.expires_at} />
            )}
          </div>
          <div
            className="d-flex align-items-center gap-3"
            style={{ fontSize: '0.75rem', color: 'var(--text-h)' }}
          >
            <span>
              <i className="bi bi-eye me-1"></i>
              {data.view_count} {data.view_count === 1 ? 'view' : 'views'}
            </span>
            <span>
              <i className="bi bi-calendar3 me-1"></i>
              {new Date(data.created_at).toLocaleDateString(undefined, {
                year:  'numeric',
                month: 'short',
                day:   'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <ShareButton url={shareUrl} />
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 fw-medium d-flex align-items-center gap-2"
            onClick={() =>
              navigate('/editor', {
                state: {
                  prefill:  { aiContent: data.content },
                  template: data.template,
                },
              })
            }
          >
            <i className="bi bi-pencil-square"></i>
            Open in Editor
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div
        className="d-flex mb-0 rounded-top-3 overflow-hidden"
        style={{ border: '1px solid var(--glass-border)', borderBottom: 'none' }}
      >
        {['preview', 'markdown'].map((t) => (
          <button
            key={t}
            type="button"
            className="btn border-0 rounded-0 px-4 py-2 fw-medium flex-grow-1"
            style={{
              backgroundColor: tab === t
                ? 'var(--glass-bg)'
                : 'rgba(127,127,127,0.05)',
              color:       tab === t
                ? (templateMeta?.color || 'var(--accent-color)')
                : 'var(--text-h)',
              borderBottom: tab === t
                ? `2px solid ${templateMeta?.color || 'var(--accent-color)'}`
                : '2px solid transparent',
              transition:   'all 0.15s ease',
              textTransform: 'capitalize',
            }}
            onClick={() => setTab(t)}
          >
            <i
              className={`bi ${t === 'preview' ? 'bi-eye' : 'bi-code-slash'} me-2`}
            ></i>
            {t === 'preview' ? 'Preview' : 'Raw Markdown'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div
        className="rounded-bottom-3 p-4"
        style={{
          backgroundColor: 'var(--glass-bg)',
          border:          '1px solid var(--glass-border)',
          backdropFilter:  'blur(10px)',
          minHeight:       500,
        }}
      >
        {tab === 'preview' ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {data.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="position-relative">
            <button
              type="button"
              className="btn btn-sm position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border:          '1px solid var(--glass-border)',
                borderRadius:    '8px',
                fontSize:        '0.75rem',
                color:           'var(--text-h)',
              }}
              onClick={() => {
                navigator.clipboard.writeText(data.content);
              }}
            >
              <i className="bi bi-clipboard"></i>
              Copy
            </button>
            <pre
              style={{
                margin:     0,
                whiteSpace: 'pre-wrap',
                wordBreak:  'break-word',
                fontSize:   '0.8rem',
                color:      'var(--text-color)',
                background: 'transparent',
                paddingTop: '2rem',
              }}
            >
              {data.content}
            </pre>
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div
        className="text-center mt-5 p-4 rounded-4"
        style={{
          backgroundColor: 'var(--glass-bg)',
          border:          '1px solid var(--glass-border)',
        }}
      >
        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem' }}>
          Want to create your own stunning GitHub README?
        </p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 py-2 fw-medium d-flex align-items-center gap-2 hover-scale"
            onClick={() => navigate('/editor')}
          >
            <i className="bi bi-pencil-square"></i>
            Create your README
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium d-flex align-items-center gap-2 hover-scale"
            onClick={() => navigate('/explore')}
          >
            <i className="bi bi-compass"></i>
            Explore examples
          </button>
        </div>
      </div>

    </div>
  );
};

export default PreviewPage;