import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import IslandNavbar from './components/IslandNavbar';
import AuthCallback from './pages/AuthCallback';
import Editor from './pages/Editor';

const Home = () => (
  <div className="container text-center mt-5 main-content">
    <h1 className="fw-bold display-3 fade-in-up">
      Create <span className="gradient-text">Beautiful</span> GitHub READMEs
    </h1>
    <p className="fs-5 mt-4 text-secondary fade-in-up delay-1">
      Build stunning profile pages in minutes. Drag, drop, and deploy. Zero coding required.
    </p>
    <div className="mt-5 fade-in-up delay-2">
      <Link to="/editor" className="btn btn-primary rounded-pill px-4 py-2 me-3 fs-5 shadow-sm hover-scale text-decoration-none">
        Get Started
      </Link>
      <button className="btn btn-outline-secondary rounded-pill px-4 py-2 fs-5 shadow-sm hover-scale">
        View Templates
      </button>
    </div>
  </div>
);

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // `data-theme` drives our own CSS variables (index.css), while
    // `data-bs-theme` is what Bootstrap 5 itself looks for to switch the
    // palette of its built-in components (cards, forms, buttons, text-*
    // utilities). Without both, Bootstrap elements stayed light-themed even
    // when the rest of the app switched to dark.
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div className="App">
        <IslandNavbar theme={theme} toggleTheme={toggleTheme} />
        {/* Container wrapper removed to allow Editor to use full width container-fluid */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;