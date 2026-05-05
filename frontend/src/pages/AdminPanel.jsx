/**
 * Admin Panel — User management (suspend/enable accounts)
 */

import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    setActionLoading(userId);
    setMessage('');

    try {
      const res = await api.patch(`/admin/users/${userId}`, {
        is_active: !currentStatus,
      });
      setMessage(res.data.message);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="page-loading">Loading users...</div>;

  const roleColors = {
    admin: '#f59e0b',
    teacher: '#3b82f6',
    student: '#10b981',
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const suspendedUsers = totalUsers - activeUsers;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p className="page-subtitle">Manage users and monitor system health</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-number">{totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-number">{activeUsers}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚫</span>
          <div className="stat-info">
            <span className="stat-number">{suspendedUsers}</span>
            <span className="stat-label">Suspended</span>
          </div>
        </div>
      </div>

      {/* User management table */}
      <div className="card">
        <h2 className="card-title">
          User Management
          <span className="badge">{users.length}</span>
        </h2>

        <div className="table-wrapper">
          <table className="data-table" id="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.is_active ? 'row-suspended' : ''}>
                  <td className="center-cell">{u.id}</td>
                  <td className="code-cell">{u.username}</td>
                  <td>{u.name}</td>
                  <td className="email-cell">{u.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: roleColors[u.role] || '#6b7280' }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'active' : 'suspended'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(u.id, u.is_active)}
                        disabled={actionLoading === u.id}
                      >
                        {actionLoading === u.id
                          ? '...'
                          : u.is_active
                            ? 'Suspend'
                            : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
