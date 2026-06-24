// src/components/AIGenerator.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/auth';

const EXAMPLE_PROMPTS = [
  "Make it fun and approachable, with a focus on open source contributions",
  "Keep it professional and minimal, suitable for a job search",
  "Make it creative and visually rich with lots of personality",
  "Focus on my data science background and research projects",
];

const AIGenerator = ({ formData, onGenerated, theme }) => {
  const [prompt, setPrompt]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        name:            formData.name,
        subtitle:        formData.subtitle,
        description:     formData.description,
        bio:             formData.bio,
        currentLearning: formData.currentLearning,
        githubUsername:  formData.githubUsername,
        skills:          formData.skills,
        projects:        formData.projects,
        socialLinks:     formData.socialLinks,
        template:        formData.template,
        prompt:          prompt,
      };

      const response = await axios.post(
        `${API_URL}/api/generate/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.markdown) {
        onGenerated(response.data.markdown);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Generation failed. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-3 p-3 mb-2"
      style={{
        background:  'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08))',
        border:      '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{
            width:           32,
            height:          32,
            background:      'linear-gradient(135deg, #6366f1, #ec4899)',
            flexShrink:      0,
          }}
        >
          <i className="bi bi-stars text-white" style={{ fontSize: '0.9rem' }}></i>
        </div>
        <div>
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>AI README Generator</div>
          <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
            Powered by Llama 3.3 · Uses your form data as context
          </div>
        </div>
      </div>

      {/* Optional prompt input */}
      <div className="mb-2">
        <label className="form-label text-secondary fw-medium mb-1" style={{ fontSize: '0.8rem' }}>
          Optional — give the AI extra direction:
        </label>
        <textarea
          className="form-control form-control-sm"
          rows={2}
          placeholder='e.g. "Make it fun and creative" or "Keep it minimal and professional"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ fontSize: '0.85rem', resize: 'none' }}
        />
      </div>

      {/* Example prompt chips */}
      <div className="d-flex flex-wrap gap-1 mb-3">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="btn btn-sm rounded-pill px-2 py-0"
            style={{
              fontSize:        '0.7rem',
              backgroundColor: prompt === p ? 'rgba(99,102,241,0.15)' : 'transparent',
              border:          '1px solid rgba(99,102,241,0.25)',
              color:           'var(--text-h)',
              transition:      'all 0.15s ease',
            }}
            onClick={() => setPrompt(p)}
            disabled={loading}
          >
            {p.length > 40 ? p.slice(0, 40) + '…' : p}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-2 p-2 mb-3 d-flex align-items-start gap-2"
          style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)' }}
        >
          <i className="bi bi-exclamation-triangle-fill text-danger mt-1" style={{ fontSize: '0.8rem', flexShrink: 0 }}></i>
          <span className="text-danger" style={{ fontSize: '0.8rem' }}>{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          className="rounded-2 p-2 mb-3 d-flex align-items-center gap-2"
          style={{ backgroundColor: 'rgba(25,135,84,0.1)', border: '1px solid rgba(25,135,84,0.2)' }}
        >
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '0.8rem' }}></i>
          <span className="text-success" style={{ fontSize: '0.8rem' }}>
            README generated! Preview updated on the right.
          </span>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
        style={{
          background:    loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
          border:        'none',
          color:         '#fff',
          borderRadius:  '10px',
          padding:       '10px',
          fontSize:      '0.9rem',
          transition:    'opacity 0.2s ease',
          cursor:        loading ? 'not-allowed' : 'pointer',
        }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              style={{ width: '1rem', height: '1rem' }}
            />
            Generating your README...
          </>
        ) : (
          <>
            <i className="bi bi-stars"></i>
            Generate with AI
          </>
        )}
      </button>

      <p className="text-secondary text-center mb-0 mt-2" style={{ fontSize: '0.7rem' }}>
        Fill in your details above for best results — the AI uses them as context.
      </p>
    </div>
  );
};

export default AIGenerator;