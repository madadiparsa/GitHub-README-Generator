// src/components/SkillsPicker.jsx
import React from 'react';
import { SKILLS_CATEGORIES } from '../utils/skills';

const SkillsPicker = ({ selectedSkills, onChange }) => {
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      onChange(selectedSkills.filter(s => s !== skill));
    } else {
      onChange([...selectedSkills, skill]);
    }
  };

  return (
    <div className="d-flex flex-column gap-4 mt-2">
      {Object.entries(SKILLS_CATEGORIES).map(([category, data]) => {
        const { color, skills } = data;

        return (
          <div key={category}>
            <h6
              className="small mb-3 fw-bold border-bottom pb-2"
              style={{ color, opacity: 0.9 }}
            >
              {category}
            </h6>

            {/* ✅ overflow fix: constrain width to 100% and allow wrapping */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                width: '100%',
                overflowX: 'hidden',
              }}
            >
              {skills.map(skill => {
                const isSelected = selectedSkills.includes(skill);

                return (
                  <span
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      userSelect: 'none',
                      flexShrink: 0,      
                      maxWidth: '100%',      
                      whiteSpace: 'normal',   
                      backgroundColor: isSelected ? color : `${color}1A`,
                      color: isSelected ? '#ffffff' : color,
                      border: `1px solid ${isSelected ? color : `${color}80`}`,
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected ? `0 4px 10px ${color}40` : 'none',
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SkillsPicker;