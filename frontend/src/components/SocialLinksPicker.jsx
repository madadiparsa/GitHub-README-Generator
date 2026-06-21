import React from 'react';
import { SOCIAL_PLATFORMS } from '../utils/socialPlatforms';

const SocialLinksPicker = ({ values, onChange }) => {
  const handleChange = (platform, value) => {
    onChange({ ...values, [platform]: value });
  };

  return (
    <div className="d-flex flex-column gap-2">
      {Object.entries(SOCIAL_PLATFORMS).map(([key, meta]) => (
        <div className="input-group input-group-sm" key={key}>
          <span
            className="input-group-text justify-content-center"
            style={{ width: 42 }}
            title={meta.label}
          >
            <i className={`bi ${meta.icon}`}></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder={`${meta.label} \u2014 ${meta.placeholder}`}
            value={values?.[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      ))}
      <p className="text-muted small mb-0 mt-1">
        Just enter your handle (e.g. <code>octocat</code>) — full links are built for you. Website and email take the full value.
      </p>
    </div>
  );
};

export default SocialLinksPicker;