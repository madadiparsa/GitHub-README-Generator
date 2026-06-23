// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import IslandNavbar from './components/IslandNavbar';
import AuthCallback from './pages/AuthCallback';
import Editor from './pages/Editor';
import Templates from './pages/Templates';
import Explore from './pages/Explore';

const Home = () => (
  <div className="container text-center mt-5 main-content">
    <h1 className="fw-bold display-3 fade-in-up">
      Create <span className="gradient-text">Beautiful</span> GitHub READMEs
    </h1>
    <p className="fs-5 mt-4 text-secondary fade-in-up delay-1">
      Build stunning profile pages in minutes. Drag, drop, and deploy. Zero coding required.
    </p>
    <div className="mt-5 fade-in-up delay-2">
      <Link
        to="/editor"
        className="btn btn-primary rounded-pill px-4 py-2 me-3 fs-5 shadow-sm hover-scale text-decoration-none"
      >
        Get Started
      </Link>
      <Link
        to="/templates"
        className="btn btn-outline-secondary rounded-pill px-4 py-2 fs-5 shadow-sm hover-scale text-decoration-none"
      >
        View Templates
      </Link>
    </div>

    {/* Feature highlights */}
    <div className="row g-4 mt-5 text-start fade-in-up delay-2">
      <div className="col-md-4">
        <div
          className="p-4 rounded-4 h-100"
          style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <div className="fs-2 mb-3">🎨</div>
          <h5 className="fw-bold">Multiple Templates</h5>
          <p className="text-secondary small mb-0">
            Choose from Modern Badges, Minimalist, and Creative Banner styles.
            Every template is fully customisable.
          </p>
        </div>
      </div>
      <div className="col-md-4">
        <div
          className="p-4 rounded-4 h-100"
          style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <div className="fs-2 mb-3">⚡</div>
          <h5 className="fw-bold">Live Preview</h5>
          <p className="text-secondary small mb-0">
            See your README render in real time as you type. Copy or download
            your finished file in one click.
          </p>
        </div>
      </div>
      <div className="col-md-4">
        <div
          className="p-4 rounded-4 h-100"
          style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <div className="fs-2 mb-3">🔗</div>
          <h5 className="fw-bold">GitHub Integration</h5>
          <p className="text-secondary small mb-0">
            Login with GitHub to auto-fill your profile, unlock all templates,
            and embed live stats cards.
          </p>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // data-theme drives our own CSS variables (index.css)
    // data-bs-theme is what Bootstrap 5 uses to switch its built-in palette
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="App">
        <IslandNavbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/editor"        element={<Editor />} />
          <Route path="/templates"     element={<Templates />} />
          <Route path="/explore"       element={<Explore />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;