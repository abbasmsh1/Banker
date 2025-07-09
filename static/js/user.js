// user.js
document.addEventListener('DOMContentLoaded', () => {
  redirectIfNotLoggedIn(false);
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => { clearToken(); window.location.href = '/static/login.html'; };

  const dash = document.getElementById('userDashboard');
  let account, beneficiaries, transactions;

  function render() {
    dash.innerHTML = '';
    if (!account) {
      dash.innerHTML = '<div class="error">No account found. Please contact admin.</div>';
      return;
    }
    dash.innerHTML += `
      <h2>Account Details</h2>
      <div><b>Name:</b> ${account.name}</div>
      <div><b>IBAN:</b> ${account.iban}</div>
      <div><b>Crypto Address:</b> ${account.address}</div>
      <div><b>Phone:</b> ${account.phone_number}</div>
      <div><b>Balance:</b> $${account.balance.toFixed(2)}</div>
      <hr>
      <h2>Send Money</h2>
      <form id="transferForm">
        <input type="text" id="to_iban" placeholder="Recipient IBAN (optional)">
        <input type="text" id="to_address" placeholder="Recipient Address (optional)">
        <input type="number" id="amount" placeholder="Amount" min="0.01" step="0.01" required>
        <button type="submit">Send</button>
        <div id="transferError" class="error" style="display:none;"></div>
      </form>
      <hr>
      <h2>Add Beneficiary</h2>
      <form id="beneficiaryForm">
        <input type="text" id="ben_name" placeholder="Name" required>
        <input type="text" id="ben_iban" placeholder="IBAN" required>
        <input type="text" id="ben_address" placeholder="Address" required>
        <button type="submit">Add Beneficiary</button>
        <div id="benError" class="error" style="display:none;"></div>
      </form>
      <hr>
      <h2>Beneficiaries</h2>
      <ul>${beneficiaries.map(b => `<li>${b.name} (IBAN: ${b.iban}, Address: ${b.address})</li>`).join('')}</ul>
      <hr>
      <h2>Recent Transactions</h2>
      <ul>${transactions.slice(0, 10).map(t => `<li>${t.type === 'send' ? 'Sent' : 'Received'} $${t.amount} on ${new Date(t.timestamp).toLocaleString()}</li>`).join('')}</ul>
    `;
    document.getElementById('transferForm').onsubmit = handleTransfer;
    document.getElementById('beneficiaryForm').onsubmit = handleAddBeneficiary;
  }

  async function fetchAll() {
    try {
      const [acc, bens, txs] = await Promise.all([
        apiFetch('/accounts'),
        apiFetch('/beneficiaries'),
        apiFetch('/transactions')
      ]);
      account = acc[0];
      beneficiaries = bens;
      transactions = txs;
      render();
    } catch (e) {
      dash.innerHTML = `<div class="error">${e.message}</div>`;
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const to_iban = document.getElementById('to_iban').value;
    const to_address = document.getElementById('to_address').value;
    const amount = document.getElementById('amount').value;
    try {
      await apiFetch('/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_iban, to_address, amount })
      });
      fetchAll();
    } catch (e) {
      document.getElementById('transferError').style.display = 'block';
      document.getElementById('transferError').textContent = e.message;
    }
  }

  async function handleAddBeneficiary(e) {
    e.preventDefault();
    const name = document.getElementById('ben_name').value;
    const iban = document.getElementById('ben_iban').value;
    const address = document.getElementById('ben_address').value;
    try {
      await apiFetch('/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, iban, address })
      });
      fetchAll();
    } catch (e) {
      document.getElementById('benError').style.display = 'block';
      document.getElementById('benError').textContent = e.message;
    }
  }

  fetchAll();
}); 