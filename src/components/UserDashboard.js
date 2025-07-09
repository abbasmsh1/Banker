import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferForm, setTransferForm] = useState({
    to_iban: '',
    to_address: '',
    amount: ''
  });
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    iban: '',
    address: ''
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountRes, beneficiariesRes, transactionsRes] = await Promise.all([
        axios.get('/accounts'),
        axios.get('/beneficiaries'),
        axios.get('/transactions')
      ]);

      setAccount(accountRes.data[0] || null);
      setBeneficiaries(beneficiariesRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/transfer', transferForm);
      toast.success('Transfer successful!');
      setShowTransferModal(false);
      setTransferForm({ to_iban: '', to_address: '', amount: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/beneficiaries', newBeneficiary);
      toast.success('Beneficiary added successfully!');
      setShowBeneficiaryModal(false);
      setNewBeneficiary({ name: '', iban: '', address: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add beneficiary');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: '#495057' }}>User Dashboard</h1>
      
      {/* Account Overview */}
      <div className="dashboard-grid">
        <div className="stats-card">
          <div className="stats-number">${account?.balance?.toFixed(2) || '0.00'}</div>
          <div className="stats-label">Current Balance</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">{beneficiaries.length}</div>
          <div className="stats-label">Beneficiaries</div>
        </div>
        <div className="stats-card">
          <div className="stats-number">{transactions.length}</div>
          <div className="stats-label">Total Transactions</div>
        </div>
      </div>

      {/* Account Details */}
      <div className="card">
        <h3>Account Details</h3>
        {account ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div>
              <strong>Name:</strong> {account.name}
            </div>
            <div>
              <strong>IBAN:</strong> {account.iban}
            </div>
            <div>
              <strong>Crypto Address:</strong> {account.address}
            </div>
            <div>
              <strong>Phone:</strong> {account.phone_number}
            </div>
          </div>
        ) : (
          <p>No account found. Please contact your bank admin.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => setShowTransferModal(true)}
            disabled={!account}
          >
            Send Money
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowBeneficiaryModal(true)}
          >
            Add Beneficiary
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3>Recent Transactions</h3>
        {transactions.length > 0 ? (
          <div style={{ marginTop: '20px' }}>
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {tx.type === 'send' ? 'Sent' : 'Received'} ${tx.amount}
                  </div>
                  <div className="transaction-details">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className={`transaction-amount ${tx.type === 'send' ? 'sent' : ''}`}>
                  {tx.type === 'send' ? '-' : '+'}${tx.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '20px', color: '#6c757d' }}>No transactions found.</p>
        )}
      </div>

      {/* Beneficiaries */}
      <div className="card">
        <h3>Beneficiaries</h3>
        {beneficiaries.length > 0 ? (
          <div style={{ marginTop: '20px' }}>
            {beneficiaries.map((ben) => (
              <div key={ben.id} className="transaction-item">
                <div>
                  <div style={{ fontWeight: '600' }}>{ben.name}</div>
                  <div className="transaction-details">
                    IBAN: {ben.iban} | Address: {ben.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '20px', color: '#6c757d' }}>No beneficiaries found.</p>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Send Money</h3>
              <button className="close-btn" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">Recipient IBAN (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={transferForm.to_iban}
                  onChange={(e) => setTransferForm({...transferForm, to_iban: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Recipient Address (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={transferForm.to_address}
                  onChange={(e) => setTransferForm({...transferForm, to_address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Send Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showBeneficiaryModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Beneficiary</h3>
              <button className="close-btn" onClick={() => setShowBeneficiaryModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddBeneficiary}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBeneficiary.name}
                  onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">IBAN</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBeneficiary.iban}
                  onChange={(e) => setNewBeneficiary({...newBeneficiary, iban: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBeneficiary.address}
                  onChange={(e) => setNewBeneficiary({...newBeneficiary, address: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBeneficiaryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Add Beneficiary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard; 