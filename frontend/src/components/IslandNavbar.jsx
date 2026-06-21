import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn, startGithubLogin, logout } from '../utils/auth';

const IslandNavbar = ({ theme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        setIsAuthenticated(true);
        try {
          const response = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${localStorage.getItem('github_token')}` }
          });
          setUserData(response.data);
        } catch (error) {
          console.error('Failed to fetch user data', error);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUserData(null);
    navigate('/');
  };

  return (
    <div className="navbar-island-wrapper d-flex justify-content-center">
      <nav className="navbar navbar-expand-lg navbar-island px-3 px-md-4 col-11 col-md-10 col-lg-8">
        <div className="container-fluid p-0">
          <Link className="navbar-brand fw-bold fs-5 m-0 d-flex align-items-center gap-2" to="/">
            <i className="bi bi-github fs-4"></i>
            {isAuthenticated && userData ? userData.login : 'README Gen'}
          </Link>

          <div className="d-flex align-items-center gap-2 d-lg-none">
            <button className="btn btn-link p-0 border-0" onClick={toggleTheme}>
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
            </button>
            <button className="navbar-toggler border-0 shadow-none p-1" type="button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} fs-3`}></i>
            </button>
          </div>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show position-absolute top-100 start-0 w-100 mt-2' : ''}`}>
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 align-items-center gap-lg-3">
              {['Editor', 'Templates', 'Explore'].map((item) => (
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

            <div className="d-flex align-items-center gap-3 justify-content-center pb-3 pb-lg-0">
              <button className="btn btn-link p-0 border-0 d-none d-lg-flex align-items-center hover-scale" onClick={toggleTheme}>
                <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
              </button>

              {isAuthenticated ? (
                <button className="btn btn-danger rounded-pill px-3 py-1 fw-medium hover-scale" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <button className={`btn ${theme === 'light' ? 'btn-dark' : 'btn-light'} rounded-pill px-3 py-1 fw-medium hover-scale d-flex align-items-center gap-2`} onClick={startGithubLogin}>
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