'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsApi, listingsApi } from '@/lib/api';
import StarRating from '@/components/StarRating';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  listing_id: number;
  listing_title?: string;
  created_at: string;
  reply?: {
    id: number;
    text: string;
    created_at: string;
  };
}

interface DashboardStats {
  total_reviews: number;
  contact_requests: number;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({ total_reviews: 0, contact_requests: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'student') {
        router.push('/');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      setIsLoading(true);
      const response = await listingsApi.getStudentDashboard(token);
      
      if (response.success && response.data) {
        const { stats, reviews } = response.data as any;
        setStats(stats);
        setReviews(reviews);
      }

      setIsLoading(false);
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (authLoading || isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Welcome back, {user?.email?.split('@')[0]}</h1>
          <p className="text-muted mb-0">Student Dashboard</p>
        </div>
        <Link href="/search" className="btn btn-primary">
          Browse Properties
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_reviews}</h2>
                  <p className="text-muted mb-0 small">Reviews Written</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.contact_requests}</h2>
                  <p className="text-muted mb-0 small">Contact Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 bg-primary text-white">
            <div className="card-body d-flex align-items-center justify-content-center">
              <div className="text-center">
                <h5 className="mb-2">Looking for a place?</h5>
                <Link href="/search" className="btn btn-light btn-sm">
                  Start Searching
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            My Reviews
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Activity</h5>
              </div>
              <div className="card-body">
                {reviews.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <p className="mb-1">
                              You reviewed <strong>{review.listing_title || `Listing #${review.listing_id}`}</strong>
                            </p>
                            <StarRating rating={review.rating} size="sm" />
                            <small className="text-muted d-block mt-1">
                              {new Date(review.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <Link href={`/listings/${review.listing_id}`} className="btn btn-outline-primary btn-sm">
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-muted mb-3" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
                    </svg>
                    <h6 className="text-muted">No recent activity</h6>
                    <p className="text-muted small mb-0">Start browsing properties and leave reviews!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link href="/search" className="btn btn-outline-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                    Search Properties
                  </Link>
                  <Link href="/profile" className="btn btn-outline-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">My Reviews ({reviews.length})</h5>
          </div>
          <div className="card-body">
            {reviews.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Reply</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td>{review.listing_title || `Listing #${review.listing_id}`}</td>
                        <td><StarRating rating={review.rating} size="sm" /></td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                          {review.comment || <span className="text-muted">No comment</span>}
                        </td>
                        <td>{new Date(review.created_at).toLocaleDateString()}</td>
                        <td>
                          {review.reply ? (
                            <span className="badge bg-success">Replied</span>
                          ) : (
                            <span className="badge bg-secondary">No reply</span>
                          )}
                        </td>
                        <td>
                          <Link href={`/listings/${review.listing_id}`} className="btn btn-sm btn-outline-primary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-muted mb-3" viewBox="0 0 16 16">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
                <h6 className="text-muted">No reviews yet</h6>
                <p className="text-muted small mb-3">You have not written any reviews yet.</p>
                <Link href="/search" className="btn btn-primary btn-sm">
                  Browse Properties
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
