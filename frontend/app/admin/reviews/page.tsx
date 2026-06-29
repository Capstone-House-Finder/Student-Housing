'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import StarRating from '@/components/StarRating';

interface Review {
  id: number;
  listing_id: number;
  listing_title: string;
  student_email: string;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  reply?: {
    id: number;
    text: string;
    created_at: string;
  };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
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

  const fetchReviews = async () => {
    if (!token) return;
    setIsLoading(true);
    const response = await adminApi.getReviews(token);
    if (response.success) {
      setReviews(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch reviews');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token]);

  const handleUpdateStatus = async (reviewId: number, status: 'approved' | 'deleted' | 'flagged') => {
    if (!token) return;
    if (status === 'deleted' && !confirm('Are you sure you want to delete this review?')) return;

    const response = await adminApi.updateReviewStatus(token, reviewId, status);
    if (response.success) {
      setSuccessMessage(`Review ${status} successfully`);
      fetchReviews();
    } else {
      setError(response.error?.message || `Failed to ${status} review`);
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
          <li className="breadcrumb-item active">Manage Reviews</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Manage Reviews</h1>
        <div className="text-muted small">{reviews.length} Total Reviews</div>
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
                <th className="px-4 py-3">Review</th>
                <th className="py-3">Listing</th>
                <th className="py-3">Status</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4">
                    <div className="d-flex align-items-center mb-1">
                      <StarRating rating={r.rating} size="sm" />
                      <span className="ms-2 fw-bold">{r.rating}/5</span>
                    </div>
                    <div className="text-muted small">By: {r.student_email}</div>
                    {r.comment && (
                      <div className="mt-1 small text-truncate" style={{ maxWidth: '300px' }}>
                        {r.comment}
                      </div>
                    )}
                    {r.reply && (
                      <div className="mt-2 small bg-light p-2 rounded">
                        <strong>Landlord Reply:</strong> {r.reply.text}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-muted small">{r.listing_title}</div>
                    <div className="text-muted extra-small">ID: {r.listing_id}</div>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : r.status === 'flagged' ? 'bg-warning text-dark' : r.status === 'deleted' ? 'bg-secondary' : 'bg-info'}`}>
                      {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="text-end px-4">
                    <div className="d-flex justify-content-end gap-2">
                      {r.status !== 'approved' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateStatus(r.id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== 'flagged' && (
                        <button 
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleUpdateStatus(r.id, 'flagged')}
                        >
                          Flag
                        </button>
                      )}
                      {r.status !== 'deleted' && (
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleUpdateStatus(r.id, 'deleted')}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No reviews found
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
