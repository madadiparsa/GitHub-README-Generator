import React from 'react';

const SKILLS_CATEGORIES = {
  "Frontend": {
    color: "#0ea5e9",
    skills: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Nuxt.js', 'Angular', 'Svelte', 'Tailwind', 'Sass', 'Redux']
  },
  "Backend": {
    color: "#10b981",
    skills: ['Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Express', 'Ruby on Rails', 'PHP']
  },
  "Data Science & AI": {
    color: "#f43f5e",
    skills: ['TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'Jupyter', 'Matplotlib', 'Hugging Face']
  },
  "Database & Cloud": {
    color: "#f59e0b",
    skills: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'Firebase', 'Supabase']
  },
  "Tools & Other": {
    color: "#8b5cf6",
    skills: ['Linux', 'Git', 'GitHub', 'GitLab', 'Figma', 'Bash', 'Postman', 'Nginx', 'GraphQL', 'Vite']
  }
};

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
              style={{ color: color, opacity: 0.9 }}
            >
              {category}
            </h6>

            <div className="d-flex flex-wrap gap-2">
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
