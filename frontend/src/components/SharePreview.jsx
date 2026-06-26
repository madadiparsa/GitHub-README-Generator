// src/components/SharePreview.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/auth';

const SharePreview = ({ markdown, template, title }) => {
  const [loading,      setLoading]      = useState(false);
  const [shareData,    setShareData]    = useState(null);
  const [error,        setError]        = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [customTitle,  setCustomTitle]  = useState(title || '');
  const [showForm,     setShowForm]     = useState(false);

  const handleCreate = async () => {
    if (!markdown?.trim()) {
      setError('Your README is empty. Add some content first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/preview/create/`,
        {
          content:  markdown,
          template: template || 'modern',
          title:    customTitle.trim() || 'My README Preview',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setShareData(response.data);
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to create share link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareData?.shareable_url) return;
    navigator.clipboard.writeText(shareData.shareable_url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setShareData(null);
    setError(null);
    setCopied(false);
    setShowForm(false);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (shareData) {
    return (
      <div
        className="rounded-3 p-3 mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
          border:     '1px solid rgba(99,102,241,0.2)',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width:      32,
              height:     32,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-check-lg text-white" style={{ fontSize: '0.9rem' }}></i>
          </div>
          <div>
            <div className="fw-bold" style={{ color: '#6366f1', fontSize: '0.9rem' }}>
              Share link created!
            </div>
            <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
              {shareData.message}
            </div>
          </div>
        </div>

        {/* URL display */}
        <div
          className="rounded-2 p-2 mb-3 d-flex align-items-center gap-2"
          style={{
            backgroundColor: 'rgba(99,102,241,0.06)',
            border:          '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <i
            className="bi bi-link-45deg flex-shrink-0"
            style={{ color: '#6366f1', fontSize: '0.9rem' }}
          ></i>
          <span
            className="text-secondary flex-grow-1 text-truncate"
            style={{ fontSize: '0.75rem' }}
          >
            {shareData.shareable_url}
          </span>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 mb-2">
          <button
            type="button"
            className="btn btn-sm fw-medium flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            style={{
              background:   copied
                ? 'rgba(16,185,129,0.12)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color:        copied ? '#10b981' : '#fff',
              border:       copied
                ? '1px solid rgba(16,185,129,0.3)'
                : 'none',
              borderRadius: '10px',
              padding:      '8px',
              transition:   'all 0.2s ease',
            }}
            onClick={handleCopy}
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <button
            type="button"
            className="btn btn-sm fw-medium d-flex align-items-center justify-content-center gap-1"
            style={{
              backgroundColor: 'rgba(99,102,241,0.08)',
              color:           '#6366f1',
              border:          '1px solid rgba(99,102,241,0.2)',
              borderRadius:    '10px',
              padding:         '8px 12px',
            }}
            onClick={() =>
              window.open(shareData.shareable_url, '_blank', 'noopener,noreferrer')
            }
          >
            <i className="bi bi-box-arrow-up-right"></i>
          </button>
        </div>

        {/* Expiry notice */}
        <p
          className="text-secondary text-center mb-2"
          style={{ fontSize: '0.7rem' }}
        >
          <i className="bi bi-clock me-1"></i>
          Valid for 30 days ·{' '}
          {new Date(shareData.expires_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          })}
        </p>

        {/* Create new */}
        <button
          type="button"
          className="btn btn-sm w-100 border-0 fw-medium"
          style={{
            backgroundColor: 'rgba(99,102,241,0.08)',
            color:           '#6366f1',
            borderRadius:    '8px',
          }}
          onClick={handleReset}
        >
          <i className="bi bi-arrow-repeat me-1"></i>
          Create new link
        </button>
      </div>
    );
  }

  // ── Default state ─────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-3 p-3 mb-2"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
        border:     '1px solid rgba(99,102,241,0.18)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{
            width:      32,
            height:     32,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            flexShrink: 0,
          }}
        >
          <i className="bi bi-share text-white" style={{ fontSize: '0.85rem' }}></i>
        </div>
        <div>
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
            Share Preview
          </div>
          <div className="text-secondary" style={{ fontSize: '0.73rem' }}>
            Generate a public link to share your README
          </div>
        </div>
      </div>

      {/* Optional title input */}
      {showForm ? (
        <div className="mb-3">
          <label
            className="form-label text-secondary fw-medium mb-1"
            style={{ fontSize: '0.78rem' }}
          >
            Preview title (optional)
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder='e.g. "My Developer Profile"'
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            maxLength={255}
            style={{ fontSize: '0.82rem' }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            type="button"
            className="btn btn-sm border-0 p-0 mt-1 text-secondary"
            style={{ fontSize: '0.72rem', background: 'transparent' }}
            onClick={() => setShowForm(false)}
          >
            <i className="bi bi-chevron-up me-1"></i>
            Hide
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-sm border-0 p-0 mb-3 d-flex align-items-center gap-1"
          style={{
            fontSize:   '0.75rem',
            background: 'transparent',
            color:      'var(--text-h)',
          }}
          onClick={() => setShowForm(true)}
        >
          <i className="bi bi-chevron-down"></i>
          Add a custom title
        </button>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-2 p-2 mb-3 d-flex align-items-start gap-2"
          style={{
            backgroundColor: 'rgba(220,53,69,0.08)',
            border:          '1px solid rgba(220,53,69,0.2)',
            fontSize:        '0.8rem',
          }}
        >
          <i
            className="bi bi-exclamation-triangle-fill text-danger mt-1 flex-shrink-0"
            style={{ fontSize: '0.78rem' }}
          ></i>
          <span className="text-danger">{error}</span>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{
          background:   loading
            ? 'rgba(99,102,241,0.4)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border:       'none',
          color:        '#fff',
          borderRadius: '10px',
          padding:      '10px',
          fontSize:     '0.9rem',
          cursor:       loading ? 'not-allowed' : 'pointer',
          transition:   'opacity 0.2s ease',
        }}
        onClick={handleCreate}
        disabled={loading || !markdown?.trim()}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ width: '1rem', height: '1rem' }}
            />
            Creating link…
          </>
        ) : (
          <>
            <i className="bi bi-share-fill"></i>
            Generate share link
          </>
        )}
      </button>

      <p
        className="text-secondary text-center mb-0 mt-2"
        style={{ fontSize: '0.7rem' }}
      >
        No login required · Link valid for 30 days
      </p>
    </div>
  );
};

export default SharePreview;