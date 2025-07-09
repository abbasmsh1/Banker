// auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        // Decode token to check admin
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        window.location.href = payload.is_admin ? '/static/admin_dashboard.html' : '/static/user_dashboard.html';
      } catch (err) {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginError').textContent = err.message;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirm').value;
      if (password !== confirm) {
        document.getElementById('registerError').style.display = 'block';
        document.getElementById('registerError').textContent = 'Passwords do not match';
        return;
      }
      try {
        const res = await fetch('http://localhost:8000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
        document.getElementById('registerError').style.display = 'none';
        document.getElementById('registerSuccess').style.display = 'block';
        document.getElementById('registerSuccess').textContent = 'Registration successful! Please login.';
        setTimeout(() => window.location.href = '/static/login.html', 1500);
      } catch (err) {
        document.getElementById('registerError').style.display = 'block';
        document.getElementById('registerError').textContent = err.message;
      }
    });
  }
}); 