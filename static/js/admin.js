// admin.js
document.addEventListener('DOMContentLoaded', () => {
  redirectIfNotLoggedIn(true);
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => { clearToken(); window.location.href = '/static/login.html'; };

  const dash = document.getElementById('adminDashboard');
  let accounts = [], stats = {};

  function render() {
    dash.innerHTML = `
      <h2>Bank Statistics</h2>
      <div><b>Total Money in Bank:</b> $${stats.totalMoney?.toFixed(2) || '0.00'}</div>
      <div><b>Total Transferred Today:</b> $${stats.totalTransferred?.toFixed(2) || '0.00'}</div>
      <div><b>Total Accounts:</b> ${accounts.length}</div>
      <hr>
      <h2>Create User & Account</h2>
      <form id="createUserForm">
        <input type="text" id="newUsername" placeholder="Username" required>
        <input type="password" id="newPassword" placeholder="Password" required>
        <label><input type="checkbox" id="isAdmin"> Is Admin?</label>
        <input type="text" id="fullName" placeholder="Full Name" required>
        <input type="text" id="fatherName" placeholder="Father's Name" required>
        <input type="text" id="phoneNumber" placeholder="Phone Number" required>
        <button type="submit">Create User & Account</button>
        <div id="createUserError" class="error" style="display:none;"></div>
      </form>
      <hr>
      <h2>Add Money to Account</h2>
      <form id="addMoneyForm">
        <select id="accountIban" required>
          <option value="">Select Account</option>
          ${accounts.map(a => `<option value="${a.iban}">${a.iban} - ${a.name} ($${a.balance.toFixed(2)})</option>`).join('')}
        </select>
        <input type="number" id="addAmount" placeholder="Amount" min="0.01" step="0.01" required>
        <button type="submit">Add Money</button>
        <div id="addMoneyError" class="error" style="display:none;"></div>
      </form>
      <hr>
      <h2>All Accounts</h2>
      <table class="table">
        <thead><tr><th>ID</th><th>Name</th><th>IBAN</th><th>Address</th><th>Balance</th><th>Phone</th></tr></thead>
        <tbody>
          ${accounts.map(a => `<tr><td>${a.id}</td><td>${a.name}</td><td>${a.iban}</td><td>${a.address}</td><td>$${a.balance.toFixed(2)}</td><td>${a.phone_number}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('createUserForm').onsubmit = handleCreateUser;
    document.getElementById('addMoneyForm').onsubmit = handleAddMoney;
  }

  async function fetchAll() {
    try {
      const [accs, totalMoney, totalTransferred] = await Promise.all([
        apiFetch('/admin/all_accounts'),
        apiFetch('/admin/total_money'),
        apiFetch('/admin/total_transferred_today')
      ]);
      accounts = accs;
      stats = {
        totalMoney: totalMoney.total_money,
        totalTransferred: totalTransferred.total_transferred_today
      };
      render();
    } catch (e) {
      dash.innerHTML = `<div class="error">${e.message}</div>`;
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const is_admin = document.getElementById('isAdmin').checked;
    const name = document.getElementById('fullName').value;
    const father_name = document.getElementById('fatherName').value;
    const phone_number = document.getElementById('phoneNumber').value;
    try {
      await apiFetch('/admin/create_user_account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, is_admin, name, father_name, phone_number })
      });
      fetchAll();
    } catch (e) {
      document.getElementById('createUserError').style.display = 'block';
      document.getElementById('createUserError').textContent = e.message;
    }
  }

  async function handleAddMoney(e) {
    e.preventDefault();
    const iban = document.getElementById('accountIban').value;
    const amount = document.getElementById('addAmount').value;
    try {
      await apiFetch('/admin/add_money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iban, amount })
      });
      fetchAll();
    } catch (e) {
      document.getElementById('addMoneyError').style.display = 'block';
      document.getElementById('addMoneyError').textContent = e.message;
    }
  }

  fetchAll();
}); 