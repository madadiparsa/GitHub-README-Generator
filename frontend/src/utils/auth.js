
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liT4rxOdOerBclfH';
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/auth/callback';
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const isLoggedIn = () => Boolean(localStorage.getItem('access_token'));

export const getStoredUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse stored user data', error);
    return null;
  }
};

export const startGithubLogin = () => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user user:email`;
  window.location.href = githubAuthUrl;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('github_token');
  localStorage.removeItem('user');
};