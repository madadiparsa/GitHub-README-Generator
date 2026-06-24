// src/components/GitHubSync.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/auth';

const GitHubSync = ({ onSync, githubUsername }) => {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [syncData, setSyncData] = useState(null);

  const handleSync = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in with GitHub to sync your data.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        `${API_URL}/api/github/sync/`,
        { access_token: token },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;
      setSyncData(data);
      onSync(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Sync failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3 p-3 mb-2"
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))',
        border:     '1px solid rgba(16,185,129,0.2)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{
            width:      32,
            height:     32,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            flexShrink: 0,
          }}
        >
          <i className="bi bi-github text-white" style={{ fontSize: '0.9rem' }}></i>
        </div>
        <div>
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
            Live GitHub Sync
          </div>
          <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
            Auto-fill from your real GitHub profile & repos
          </div>
        </div>
      </div>

      {/* What gets synced */}
      <div
        className="rounded-2 p-2 mb-3"
        style={{
          backgroundColor: 'rgba(16,185,129,0.06)',
          border:          '1px solid rgba(16,185,129,0.15)',
        }}
      >
        <p className="mb-1 fw-medium" style={{ fontSize: '0.78rem', color: '#10b981' }}>
          What gets synced:
        </p>
        <div
          className="d-flex flex-wrap gap-2"
          style={{ fontSize: '0.75rem', color: 'var(--text-h)' }}
        >
          {[
            { icon: 'bi-person-fill',     label: 'Name & Bio'       },
            { icon: 'bi-folder2-open',    label: 'Top 6 Repos'      },
            { icon: 'bi-code-slash',      label: 'Languages → Skills'},
            { icon: 'bi-envelope-fill',   label: 'Email & Website'  },
            { icon: 'bi-twitter',         label: 'Twitter Handle'   },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="d-flex align-items-center gap-1"
            >
              <i className={`bi ${icon}`} style={{ color: '#10b981' }}></i>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Sync result summary */}
      {syncData && success && (
        <div
          className="rounded-2 p-2 mb-3"
          style={{
            backgroundColor: 'rgba(16,185,129,0.08)',
            border:          '1px solid rgba(16,185,129,0.2)',
            fontSize:        '0.78rem',
          }}
        >
          <p className="fw-semibold mb-1" style={{ color: '#10b981' }}>
            <i className="bi bi-check-circle-fill me-1"></i>
            Sync complete!
          </p>
          <div className="d-flex flex-wrap gap-3 text-secondary">
            <span>
              <i className="bi bi-folder2 me-1"></i>
              {syncData.repo_count} repos found
            </span>
            <span>
              <i className="bi bi-star-fill me-1"></i>
              {syncData.projects?.length} projects imported
            </span>
            <span>
              <i className="bi bi-tools me-1"></i>
              {syncData.suggested_skills?.length} skills detected
            </span>
          </div>

          {/* Detected languages */}
          {syncData.detected_languages?.length > 0 && (
            <div className="mt-2">
              <span className="text-secondary" style={{ fontSize: '0.73rem' }}>
                Detected:{' '}
                {syncData.detected_languages.slice(0, 6).map((lang, i) => (
                  <span key={lang}>
                    <code style={{ fontSize: '0.72rem' }}>{lang}</code>
                    {i < Math.min(syncData.detected_languages.length, 6) - 1 ? ', ' : ''}
                  </span>
                ))}
                {syncData.detected_languages.length > 6 && (
                  <span> +{syncData.detected_languages.length - 6} more</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-2 p-2 mb-3 d-flex align-items-start gap-2"
          style={{
            backgroundColor: 'rgba(220,53,69,0.08)',
            border:          '1px solid rgba(220,53,69,0.2)',
          }}
        >
          <i
            className="bi bi-exclamation-triangle-fill text-danger mt-1"
            style={{ fontSize: '0.8rem', flexShrink: 0 }}
          ></i>
          <span className="text-danger" style={{ fontSize: '0.8rem' }}>{error}</span>
        </div>
      )}

      {/* Sync button */}
      <button
        type="button"
        className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{
          background:   loading
            ? 'rgba(16,185,129,0.5)'
            : 'linear-gradient(135deg, #10b981, #06b6d4)',
          border:       'none',
          color:        '#fff',
          borderRadius: '10px',
          padding:      '10px',
          fontSize:     '0.9rem',
          transition:   'opacity 0.2s ease',
          cursor:       loading ? 'not-allowed' : 'pointer',
        }}
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ width: '1rem', height: '1rem' }}
            />
            Syncing from GitHub...
          </>
        ) : (
          <>
            <i className="bi bi-arrow-repeat"></i>
            Sync from GitHub
          </>
        )}
      </button>

      <p
        className="text-secondary text-center mb-0 mt-2"
        style={{ fontSize: '0.7rem' }}
      >
        Overwrites name, bio, projects, and skills with your real GitHub data.
      </p>
    </div>
  );
};

export default GitHubSync;