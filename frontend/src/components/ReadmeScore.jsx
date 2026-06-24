// src/components/ReadmeScore.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/auth';

// Category display order and accent colours
const CATEGORY_META = {
  Essential: { color: '#ef4444', icon: 'bi-star-fill'       },
  Content:   { color: '#f59e0b', icon: 'bi-card-text'       },
  Projects:  { color: '#6366f1', icon: 'bi-folder2-open'    },
  Social:    { color: '#0ea5e9', icon: 'bi-link-45deg'      },
  Polish:    { color: '#10b981', icon: 'bi-magic'           },
};

// Circular progress ring component
const ScoreRing = ({ score, grade, gradeColor, size = 88 }) => {
  const radius      = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={8}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={gradeColor}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      {/* Score text — counter-rotate so it reads upright */}
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          transform:  `rotate(90deg)`,
          transformOrigin: '50% 50%',
          fontSize:   size < 80 ? '1rem' : '1.3rem',
          fontWeight: 700,
          fill:       gradeColor,
        }}
      >
        {grade}
      </text>
    </svg>
  );
};

const ReadmeScore = ({ formData }) => {
  const [scoreData,  setScoreData]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [lastScored, setLastScored] = useState(null);

  const fetchScore = useCallback(async () => {
    setLoading(true);
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
        showStats:       formData.showStats,
      };

      const response = await axios.post(
        `${API_URL}/api/score/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      setScoreData(response.data);
      setLastScored(new Date());
    } catch (err) {
      console.error('Score fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Auto-score on mount
  useEffect(() => {
    fetchScore();
  }, []);

  // Group results by category
  const grouped = scoreData
    ? scoreData.results.reduce((acc, r) => {
        if (!acc[r.category]) acc[r.category] = [];
        acc[r.category].push(r);
        return acc;
      }, {})
    : {};

  const failingCount = scoreData
    ? scoreData.results.filter(r => !r.passed).length
    : 0;

  return (
    <div
      className="rounded-3 p-3 mb-2"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
        border:     '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Header row */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-2"
            style={{
              width:      32,
              height:     32,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-clipboard2-check text-white" style={{ fontSize: '0.9rem' }}></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>README Score</div>
            <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
              {lastScored
                ? `Last checked ${lastScored.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Click to check your score'}
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          className="btn btn-sm border-0 d-flex align-items-center gap-1"
          style={{
            backgroundColor: 'rgba(245,158,11,0.1)',
            color:           '#f59e0b',
            borderRadius:    '8px',
            fontSize:        '0.78rem',
          }}
          onClick={fetchScore}
          disabled={loading}
        >
          <i className={`bi bi-arrow-repeat ${loading ? 'spin' : ''}`}></i>
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {/* Score summary */}
      {scoreData && !loading && (
        <>
          <div className="d-flex align-items-center gap-3 mb-3">
            {/* Ring */}
            <ScoreRing
              score={scoreData.score}
              grade={scoreData.grade}
              gradeColor={scoreData.grade_color}
            />

            {/* Stats */}
            <div className="flex-grow-1">
              <div className="d-flex align-items-baseline gap-1 mb-1">
                <span
                  className="fw-bold"
                  style={{ fontSize: '2rem', color: scoreData.grade_color, lineHeight: 1 }}
                >
                  {scoreData.score}
                </span>
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>/100</span>
              </div>

              {/* Progress bar */}
              <div
                className="rounded-pill mb-2"
                style={{ height: 6, backgroundColor: 'var(--border)', overflow: 'hidden' }}
              >
                <div
                  className="rounded-pill"
                  style={{
                    width:           `${scoreData.score}%`,
                    height:          '100%',
                    backgroundColor: scoreData.grade_color,
                    transition:      'width 0.8s ease',
                  }}
                />
              </div>

              <div className="d-flex gap-3" style={{ fontSize: '0.75rem' }}>
                <span style={{ color: '#10b981' }}>
                  <i className="bi bi-check-circle-fill me-1"></i>
                  {scoreData.results.filter(r => r.passed).length} passed
                </span>
                {failingCount > 0 && (
                  <span style={{ color: '#ef4444' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {failingCount} to improve
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top suggestions (collapsed) */}
          {failingCount > 0 && !expanded && (
            <div className="mb-2">
              {scoreData.suggestions.slice(0, 2).map((suggestion, i) => (
                <div
                  key={i}
                  className="d-flex align-items-start gap-2 rounded-2 p-2 mb-1"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.07)',
                    border:          '1px solid rgba(245,158,11,0.15)',
                    fontSize:        '0.78rem',
                  }}
                >
                  <i
                    className="bi bi-lightbulb-fill mt-1 flex-shrink-0"
                    style={{ color: '#f59e0b', fontSize: '0.75rem' }}
                  ></i>
                  <span className="text-secondary">{suggestion}</span>
                </div>
              ))}
              {scoreData.suggestions.length > 2 && (
                <p className="text-secondary mb-0" style={{ fontSize: '0.73rem' }}>
                  +{scoreData.suggestions.length - 2} more suggestions below
                </p>
              )}
            </div>
          )}

          {/* Expand / collapse toggle */}
          <button
            type="button"
            className="btn btn-sm w-100 border-0 fw-medium d-flex align-items-center justify-content-center gap-1"
            style={{
              backgroundColor: 'rgba(245,158,11,0.1)',
              color:           '#f59e0b',
              borderRadius:    '8px',
              fontSize:        '0.8rem',
              padding:         '6px',
            }}
            onClick={() => setExpanded(!expanded)}
          >
            <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            {expanded ? 'Hide details' : 'Show full breakdown'}
          </button>

          {/* Full breakdown — expanded */}
          {expanded && (
            <div className="mt-3">
              {Object.entries(CATEGORY_META).map(([category, meta]) => {
                const rules = grouped[category] || [];
                if (rules.length === 0) return null;
                const catEarned = rules.filter(r => r.passed).reduce((s, r) => s + r.points, 0);
                const catTotal  = rules.reduce((s, r) => s + r.points, 0);

                return (
                  <div key={category} className="mb-3">
                    {/* Category header */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span
                        className="fw-semibold d-flex align-items-center gap-1"
                        style={{ fontSize: '0.8rem', color: meta.color }}
                      >
                        <i className={`bi ${meta.icon}`}></i>
                        {category}
                      </span>
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        {catEarned}/{catTotal} pts
                      </span>
                    </div>

                    {/* Rules */}
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="d-flex align-items-start gap-2 rounded-2 p-2 mb-1"
                        style={{
                          backgroundColor: rule.passed
                            ? 'rgba(16,185,129,0.06)'
                            : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${rule.passed
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(239,68,68,0.15)'}`,
                          fontSize: '0.78rem',
                        }}
                      >
                        <i
                          className={`bi ${rule.passed
                            ? 'bi-check-circle-fill'
                            : 'bi-x-circle-fill'} mt-1 flex-shrink-0`}
                          style={{
                            color:    rule.passed ? '#10b981' : '#ef4444',
                            fontSize: '0.75rem',
                          }}
                        ></i>
                        <div className="flex-grow-1">
                          <div
                            className="fw-medium"
                            style={{ color: rule.passed ? '#10b981' : 'var(--text-color)' }}
                          >
                            {rule.label}
                            <span
                              className="ms-1 text-secondary"
                              style={{ fontSize: '0.7rem', fontWeight: 400 }}
                            >
                              ({rule.points} pts)
                            </span>
                          </div>
                          {!rule.passed && rule.suggestion && (
                            <div className="text-secondary mt-1" style={{ fontSize: '0.74rem' }}>
                              <i className="bi bi-lightbulb me-1" style={{ color: '#f59e0b' }}></i>
                              {rule.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Perfect score message */}
              {failingCount === 0 && (
                <div
                  className="text-center rounded-2 p-3"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    border:          '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>🎉</div>
                  <div
                    className="fw-bold mt-1"
                    style={{ color: '#10b981', fontSize: '0.85rem' }}
                  >
                    Perfect score! Your README is complete.
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="d-flex align-items-center justify-content-center py-3">
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            style={{ color: '#f59e0b', width: '1rem', height: '1rem' }}
          />
          <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Analysing your README…
          </span>
        </div>
      )}
    </div>
  );
};

export default ReadmeScore;