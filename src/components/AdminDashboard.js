import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ totalMoney: 0, totalTransferred: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    is_admin: false,
    name: '',
    father_name: '',
    phone_number: ''
  });
  const [addMoneyForm, setAddMoneyForm] = useState({
    iban: '',
    amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, totalMoneyRes, totalTransferredRes] = await Promise.all([
        axios.get('/admin/all_accounts'),
        axios.get('/admin/total_money'),
        axios.get('/admin/total_transferred_today')
      ]);

      setAccounts(accountsRes.data);
      setStats({
        totalMoney: totalMoneyRes.data.total_money,
        totalTransferred: totalTransferredRes.data.total_transferred_today
      });
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/create_user_account', newUser);
      toast.success('User and account created successfully!');
      setShowCreateUserModal(false);
      setNewUser({
        username: '',
        password: '',
        is_admin: false,
        name: '',
        father_name: '',
        phone_number: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/admin/add_money', addMoneyForm);
      toast.success(response.data.message);
      setShowAddMoneyModal(false);
      setAddMoneyForm({ iban: '', amount: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add money');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: '#495057' }}>Admin Dashboard</h1>
      
      {/* Bank Statistics */}
      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="stats-number">${stats.totalMoney.toFixed(2)}</div>
          <div className="stats-label">Total Money in Bank</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">${stats.totalTransferred.toFixed(2)}</div>
          <div className="stats-label">Total Transferred Today</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">{accounts.length}</div>
          <div className="stats-label">Total Accounts</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => setShowCreateUserModal(true)}
          >
            Create User & Account
          </button>
          <button 
            className="btn btn-success" 
            onClick={() => setShowAddMoneyModal(true)}
          >
            Add Money to Account
          </button>
        </div>
      </div>

      {/* All Accounts */}
      <div className="card">
        <h3>All Accounts</h3>
        {accounts.length > 0 ? (
          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>IBAN</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Balance</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px' }}>{account.id}</td>
                    <td style={{ padding: '12px' }}>{account.name}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{account.iban}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{account.address}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>${account.balance.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>{account.phone_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ marginTop: '20px', color: '#6c757d' }}>No accounts found.</p>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create User & Account</h3>
              <button className="close-btn" onClick={() => setShowCreateUserModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={newUser.is_admin}
                    onChange={(e) => setNewUser({...newUser, is_admin: e.target.checked})}
                  />
                  Is Admin?
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Father's Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.father_name}
                  onChange={(e) => setNewUser({...newUser, father_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create User & Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Money to Account</h3>
              <button className="close-btn" onClick={() => setShowAddMoneyModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddMoney}>
              <div className="form-group">
                <label className="form-label">IBAN</label>
                <select
                  className="form-select"
                  value={addMoneyForm.iban}
                  onChange={(e) => setAddMoneyForm({...addMoneyForm, iban: e.target.value})}
                  required
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.iban}>
                      {account.iban} - {account.name} (${account.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount to Add</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={addMoneyForm.amount}
                  onChange={(e) => setAddMoneyForm({...addMoneyForm, amount: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMoneyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 