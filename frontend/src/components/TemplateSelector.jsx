import React from 'react';
import { TEMPLATES } from '../utils/templates';
import { startGithubLogin } from '../utils/auth';

const TemplateSelector = ({ selected, onChange, isAuthenticated }) => {
  return (
    <div className="d-flex flex-column gap-2">
      {TEMPLATES.map((tpl) => {
        const isLocked = tpl.locked && !isAuthenticated;
        const isSelected = selected === tpl.id;

        return (
          <div
            key={tpl.id}
            onClick={() => !isLocked && onChange(tpl.id)}
            className="p-3 border rounded-3 d-flex justify-content-between align-items-center gap-3"
            style={{
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.55 : 1,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? tpl.accent : 'var(--glass-border)',
              backgroundColor: isSelected ? `${tpl.accent}14` : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div className="fw-semibold d-flex align-items-center gap-2">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: tpl.accent,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                ></span>
                {tpl.name}
              </div>
              <div className="small text-secondary">{tpl.tagline}</div>
            </div>
            {isLocked && (
              <i className="bi bi-lock-fill text-secondary flex-shrink-0" title="Login with GitHub to unlock"></i>
            )}
            {isSelected && !isLocked && (
              <i className="bi bi-check-circle-fill flex-shrink-0" style={{ color: tpl.accent }}></i>
            )}
          </div>
        );
      })}

      {!isAuthenticated && (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mt-1 d-flex align-items-center justify-content-center gap-2"
          onClick={startGithubLogin}
        >
          <i className="bi bi-github"></i> Login with GitHub to unlock all templates
        </button>
      )}
    </div>
  );
};

export default TemplateSelector;