'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface Report {
  id: number;
  reporter_id: number;
  target_type: string;
  target_id: number;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
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

  const fetchReports = async () => {
    if (!token) return;
    setIsLoading(true);
    const response = await adminApi.getReports(token);
    if (response.success && response.data) {
      setReports(response.data as Report[]);
    } else {
      setError(response.error?.message || 'Failed to fetch reports');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  const handleUpdateStatus = async (reportId: number, status: 'resolved' | 'dismissed') => {
    if (!token) return;
    const response = await adminApi.resolveReport(token, reportId, status);
    if (response.success) {
      setSuccessMessage(`Report ${status} successfully`);
      fetchReports();
    } else {
      setError(response.error?.message || `Failed to ${status} report`);
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
          <li className="breadcrumb-item active">Manage Reports</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Manage Reports</h1>
        <div className="text-muted small">{reports.filter(r => r.status === 'pending').length} Pending Reports</div>
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
                <th className="px-4 py-3">Report Details</th>
                <th className="py-3">Target</th>
                <th className="py-3">Status</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="px-4">
                    <div className="fw-bold">{r.reason}</div>
                    <div className="text-muted small">Reporter ID: {r.reporter_id}</div>
                  </td>
                  <td>
                    <div className="text-muted small">Type: {r.target_type}</div>
                    <div className="text-muted small">ID: {r.target_id}</div>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'pending' ? 'bg-warning text-dark' : r.status === 'resolved' ? 'bg-success' : 'bg-secondary'}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="text-end px-4">
                    {r.status === 'pending' && (
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateStatus(r.id, 'resolved')}
                        >
                          Resolve
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleUpdateStatus(r.id, 'dismissed')}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No reports found
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
