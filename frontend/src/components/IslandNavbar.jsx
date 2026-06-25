// src/components/IslandNavbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn, startGithubLogin, logout, getStoredUser } from '../utils/auth';

const IslandNavbar = ({ theme, toggleTheme }) => {
  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData,        setUserData]        = useState(null);
  const navigate = useNavigate();

  // ── Sync auth state ───────────────────────────────────────────────────────
  // Reads from localStorage and, if logged in, tries to load the stored user
  // object first (set by AuthCallback) before falling back to a GitHub API
  // call.  Wrapped in useCallback so the storage-event listener can reference
  // the same function without stale closures.
  const syncAuthState = useCallback(async () => {
    const loggedIn = isLoggedIn();
    setIsAuthenticated(loggedIn);

    if (!loggedIn) {
      setUserData(null);
      return;
    }

    // 1. Try the user object cached by AuthCallback first — no extra request
    const storedUser = getStoredUser();
    if (storedUser) {
      setUserData(storedUser);
      return;
    }

    // 2. Fall back to the GitHub API using the correct token key ✅
    //    (was 'github_token' before — AuthCallback stores it as 'access_token')
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Failed to fetch GitHub user data', error);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    syncAuthState();
  }, [syncAuthState]);

  // ✅ Fix: re-run whenever another tab (or AuthCallback's reload) writes to
  //    localStorage, so the navbar reflects login/logout without a manual refresh.
  useEffect(() => {
    window.addEventListener('storage', syncAuthState);
    return () => window.removeEventListener('storage', syncAuthState);
  }, [syncAuthState]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUserData(null);
    navigate('/');
  };

  // ── Derived display values ────────────────────────────────────────────────
  const displayName = userData?.login       // GitHub API shape
    || userData?.username                   // dj-rest-auth shape
    || userData?.first_name
    || null;

  const avatarUrl = userData?.avatar_url || null;

  return (
    <div className="navbar-island-wrapper d-flex justify-content-center">
      <nav className="navbar navbar-expand-lg navbar-island px-3 px-md-4 col-11 col-md-10 col-lg-8">
        <div className="container-fluid p-0">

          {/* Brand / username */}
          <Link
            className="navbar-brand fw-bold fs-5 m-0 d-flex align-items-center gap-2"
            to="/"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || 'avatar'}
                width={28}
                height={28}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <i className="bi bi-github fs-4"></i>
            )}
            {isAuthenticated && displayName ? displayName : 'README Gen'}
          </Link>

          {/* Mobile: theme toggle + hamburger */}
          <div className="d-flex align-items-center gap-2 d-lg-none">
            <button
              className="btn btn-link p-0 border-0"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
            </button>
            <button
              className="navbar-toggler border-0 shadow-none p-1"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation"
            >
              <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} fs-3`}></i>
            </button>
          </div>

          {/* Collapsible nav */}
          <div
            className={`collapse navbar-collapse ${
              isMenuOpen ? 'show position-absolute top-100 start-0 w-100 mt-2' : ''
            }`}
          >
            {/* Nav links */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 align-items-center gap-lg-3">
              {['Editor', 'Templates', 'Explore', 'Gallery'].map((item) => (
                <li className="nav-item" key={item}>
                  <Link
                    className="nav-link"
                    to={`/${item.toLowerCase()}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right-side controls */}
            <div className="d-flex align-items-center gap-3 justify-content-center pb-3 pb-lg-0">

              {/* Desktop theme toggle */}
              <button
                className="btn btn-link p-0 border-0 d-none d-lg-flex align-items-center hover-scale"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
              </button>

              {isAuthenticated ? (
                <div className="d-flex align-items-center gap-2">
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'avatar'}
                      width={30}
                      height={30}
                      className="d-none d-lg-block"
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <button
                    className="btn btn-danger rounded-pill px-3 py-1 fw-medium hover-scale"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  className={`btn ${
                    theme === 'light' ? 'btn-dark' : 'btn-light'
                  } rounded-pill px-3 py-1 fw-medium hover-scale d-flex align-items-center gap-2`}
                  onClick={startGithubLogin}
                >
                  <i className="bi bi-github"></i> Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default IslandNavbar;