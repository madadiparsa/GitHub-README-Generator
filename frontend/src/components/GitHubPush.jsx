// src/components/GitHubPush.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL, isLoggedIn, startGithubLogin } from '../utils/auth';

const GitHubPush = ({ markdown, githubUsername }) => {
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [showAdvanced,  setShowAdvanced]  = useState(false);

  const handlePush = async () => {
    if (!isLoggedIn()) { startGithubLogin(); return; }

    if (!markdown || !markdown.trim()) {
      setError('Your README is empty. Add some content before pushing.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `${API_URL}/api/github/push/`,
        {
          access_token:   token,
          content:        markdown,
          commit_message: commitMessage.trim() || 'Update README.md via README Generator',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setResult(response.data);
    } catch (err) {
      const msg = err.response?.data?.error;

      if (err.response?.status === 403) {
        setError(
          'Permission denied. Make sure your GitHub OAuth app has the "repo" scope.'
        );
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log out and log back in.');
      } else {
        setError(msg || 'Push failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCommitMessage('');
    setShowAdvanced(false);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className="rounded-3 p-3 mb-2"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
          border:     '1px solid rgba(16,185,129,0.3)',
        }}
      >
        {/* Success header */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width:      36,
              height:     36,
              background: '#10b981',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-check-lg text-white fw-bold"></i>
          </div>
          <div>
            <div
              className="fw-bold"
              style={{ color: '#10b981', fontSize: '0.95rem' }}
            >
              Pushed to GitHub! 🎉
            </div>
            <div className="text-secondary" style={{ fontSize: '0.73rem' }}>
              {result.message}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="d-flex flex-column gap-2 mb-3">

          {/* View GitHub profile */}
          <button
            type="button"
            className="btn btn-sm fw-medium d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: '#24292e',
              color:           '#fff',
              border:          'none',
              borderRadius:    '10px',
              padding:         '8px',
            }}
            onClick={() =>
              window.open(result.profile_url, '_blank', 'noopener,noreferrer')
            }
          >
            <i className="bi bi-github"></i>
            View your GitHub profile
          </button>

          {/* View README.md */}
          <button
            type="button"
            className="btn btn-sm fw-medium d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: 'rgba(16,185,129,0.12)',
              color:           '#10b981',
              border:          '1px solid rgba(16,185,129,0.3)',
              borderRadius:    '10px',
              padding:         '8px',
            }}
            onClick={() =>
              window.open(result.readme_url, '_blank', 'noopener,noreferrer')
            }
          >
            <i className="bi bi-file-earmark-text"></i>
            View README.md on GitHub
          </button>

          {/* View commit */}
          {result.commit_url && (
            <button
              type="button"
              className="btn btn-sm border-0 d-flex align-items-center justify-content-center gap-1"
              style={{
                backgroundColor: 'transparent',
                color:           'var(--text-h)',
                fontSize:        '0.72rem',
              }}
              onClick={() =>
                window.open(result.commit_url, '_blank', 'noopener,noreferrer')
              }
            >
              <i className="bi bi-git"></i>
              View commit · {result.commit_sha?.slice(0, 7)}
            </button>
          )}
        </div>

        {/* Push again */}
        <button
          type="button"
          className="btn btn-sm w-100 border-0 fw-medium"
          style={{
            backgroundColor: 'rgba(16,185,129,0.1)',
            color:           '#10b981',
            borderRadius:    '8px',
          }}
          onClick={handleReset}
        >
          <i className="bi bi-arrow-repeat me-1"></i>
          Push again
        </button>
      </div>
    );
  }

  // ── Default state ─────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-3 p-3 mb-2"
      style={{
        background: 'linear-gradient(135deg, rgba(36,41,46,0.08), rgba(88,96,105,0.06))',
        border:     '1px solid rgba(88,96,105,0.25)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{
            width:      32,
            height:     32,
            background: '#24292e',
            flexShrink: 0,
          }}
        >
          <i
            className="bi bi-github text-white"
            style={{ fontSize: '1rem' }}
          ></i>
        </div>
        <div>
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
            Push to GitHub
          </div>
          <div className="text-secondary" style={{ fontSize: '0.73rem' }}>
            Commit README.md directly to your profile repo
          </div>
        </div>
      </div>

      {/* Info box */}
      <div
        className="rounded-2 p-2 mb-3"
        style={{
          backgroundColor: 'rgba(88,96,105,0.08)',
          border:          '1px solid rgba(88,96,105,0.15)',
          fontSize:        '0.78rem',
          color:           'var(--text-h)',
        }}
      >
        <p className="mb-1 fw-medium">What happens when you push:</p>
        <ul className="mb-0 ps-3" style={{ lineHeight: 1.8 }}>
          <li>
            Creates{' '}
            <code>
              {githubUsername || 'username'}/{githubUsername || 'username'}
            </code>{' '}
            repo if it doesn't exist
          </li>
          <li>
            Commits <code>README.md</code> to the <code>main</code> branch
          </li>
          <li>Your GitHub profile page updates immediately</li>
        </ul>
      </div>

      {/* Advanced: custom commit message */}
      <div className="mb-3">
        <button
          type="button"
          className="btn btn-sm border-0 p-0 d-flex align-items-center gap-1"
          style={{
            fontSize:   '0.75rem',
            background: 'transparent',
            color:      'var(--text-h)',
          }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
          {showAdvanced ? 'Hide options' : 'Custom commit message'}
        </button>

        {showAdvanced && (
          <div className="mt-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Update README.md via README Generator"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              maxLength={72}
              style={{ fontSize: '0.82rem' }}
            />
            <div
              className="text-end mt-1 text-secondary"
              style={{ fontSize: '0.7rem' }}
            >
              {commitMessage.length}/72
            </div>
          </div>
        )}
      </div>

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

      {/* Push button */}
      <button
        type="button"
        className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{
          background:   loading ? 'rgba(36,41,46,0.5)' : '#24292e',
          border:       'none',
          color:        '#fff',
          borderRadius: '10px',
          padding:      '10px',
          fontSize:     '0.9rem',
          cursor:       loading ? 'not-allowed' : 'pointer',
          transition:   'opacity 0.2s ease',
        }}
        onClick={handlePush}
        disabled={loading || !markdown?.trim()}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ width: '1rem', height: '1rem' }}
            />
            Pushing to GitHub…
          </>
        ) : (
          <>
            <i className="bi bi-cloud-upload-fill"></i>
            Push README to GitHub
          </>
        )}
      </button>

      <p
        className="text-secondary text-center mb-0 mt-2"
        style={{ fontSize: '0.7rem' }}
      >
        This will overwrite your existing profile README if one exists.
      </p>
    </div>
  );
};

export default GitHubPush;