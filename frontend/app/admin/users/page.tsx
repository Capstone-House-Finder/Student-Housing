'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    const response = await adminApi.getUsers(token);
    if (response.success && response.data) {
      setUsers(response.data as User[]);
    } else {
      setError(response.error?.message || 'Failed to fetch users');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleSuspendUser = async (userId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to suspend this user?')) return;

    const response = await adminApi.suspendUser(token, userId);
    if (response.success) {
      setSuccessMessage('User suspended successfully');
      fetchUsers();
    } else {
      setError(response.error?.message || 'Failed to suspend user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this user? This will anonymize their account and remove their data.')) return;

    const response = await adminApi.deleteUser(token, userId);
    if (response.success) {
      setSuccessMessage('User deleted successfully');
      fetchUsers();
    } else {
      setError(response.error?.message || 'Failed to delete user');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item active">Manage Users</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Manage Users</h1>
        <div className="text-muted small">{users.length} Total Users</div>
      </div>

      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {error}
        <button type="button" className="btn-close" onClick={() => setError('')}></button>
      </div>}
      
      {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
        {successMessage}
        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
      </div>}

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="py-3">Role</th>
                <th className="py-3">Status</th>
                <th className="py-3">Joined</th>
                <th className="py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4">
                    <div className="fw-bold">{u.email}</div>
                    <div className="text-muted small">ID: {u.id}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'landlord' ? 'bg-primary' : 'bg-info text-dark'}`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="text-end px-4">
                    <div className="d-flex justify-content-end gap-2">
                      {u.status === 'active' && u.role !== 'admin' && (
                        <button 
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleSuspendUser(u.id)}
                        >
                          Suspend
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
