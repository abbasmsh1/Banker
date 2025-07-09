// common.js
const API_BASE = 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(API_BASE + path, { ...options, headers })
    .then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      return res.json();
    });
}

function redirectIfNotLoggedIn(isAdminPage = false) {
  const token = getToken();
  if (!token) {
    window.location.href = '/static/login.html';
    return;
  }
  // Optionally decode JWT to check admin
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (isAdminPage && !payload.is_admin) {
    window.location.href = '/static/user_dashboard.html';
  } else if (!isAdminPage && payload.is_admin) {
    window.location.href = '/static/admin_dashboard.html';
  }
} 