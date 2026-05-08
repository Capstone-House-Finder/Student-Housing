'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface DashboardStats {
  total_users: number;
  total_students: number;
  total_landlords: number;
  total_listings: number;
  pending_listings: number;
  total_reviews: number;
  total_reports: number;
  pending_reports: number;
}

interface RecentActivity {
  type: string;
  description: string;
  time: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_students: 0,
    total_landlords: 0,
    total_listings: 0,
    pending_listings: 0,
    total_reviews: 0,
    total_reports: 0,
    pending_reports: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      const statsResponse = await adminApi.getStats(token);
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as DashboardStats);
      }

      const activityResponse = await adminApi.getRecentActivity(token);
      if (activityResponse.success && activityResponse.data) {
        setRecentActivity(activityResponse.data as RecentActivity[]);
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
          <p className="mt-3 text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Admin Dashboard</h1>
          <p className="text-muted mb-0">Platform Overview</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/users" className="btn btn-outline-primary">
            Manage Users
          </Link>
          <Link href="/admin/listings" className="btn btn-outline-primary">
            Manage Listings
          </Link>
          <Link href="/admin/reports" className="btn btn-outline-danger">
            View Reports {stats.pending_reports > 0 && (
              <span className="badge bg-danger ms-1">{stats.pending_reports}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_users}</h2>
                  <p className="text-muted mb-0 small">Total Users</p>
                </div>
              </div>
              <div className="mt-3 d-flex gap-3 small">
                <span className="text-muted">{stats.total_students} Students</span>
                <span className="text-muted">{stats.total_landlords} Landlords</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_listings}</h2>
                  <p className="text-muted mb-0 small">Total Listings</p>
                </div>
              </div>
              {stats.pending_listings > 0 && (
                <div className="mt-3">
                  <Link href="/admin/listings?status=pending" className="badge bg-warning text-dark text-decoration-none">
                    {stats.pending_listings} Pending Approval
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_reviews}</h2>
                  <p className="text-muted mb-0 small">Total Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-danger">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_reports}</h2>
                  <p className="text-muted mb-0 small">Total Reports</p>
                </div>
              </div>
              {stats.pending_reports > 0 && (
                <div className="mt-3">
                  <Link href="/admin/reports" className="badge bg-danger text-decoration-none">
                    {stats.pending_reports} Pending Review
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* Quick Actions */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link href="/admin/users" className="btn btn-outline-primary text-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                  </svg>
                  Manage Users
                </Link>
                <Link href="/admin/listings" className="btn btn-outline-primary text-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                  </svg>
                  Manage Listings
                </Link>
                <Link href="/admin/reviews" className="btn btn-outline-primary text-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                  Manage Reviews
                </Link>
                <Link href="/admin/reports" className="btn btn-outline-danger text-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                  </svg>
                  View Reports
                  {stats.pending_reports > 0 && (
                    <span className="badge bg-danger ms-auto">{stats.pending_reports}</span>
                  )}
                </Link>
                <Link href="/admin/amenities" className="btn btn-outline-secondary text-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                  </svg>
                  Manage Amenities
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {recentActivity.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="list-group-item px-0">
                      <div className="d-flex align-items-start">
                        <div className={`bg-${activity.type === 'user' ? 'primary' : activity.type === 'listing' ? 'success' : activity.type === 'report' ? 'danger' : 'info'} bg-opacity-10 rounded-circle p-2 me-3`}>
                          {activity.type === 'user' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                              <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                            </svg>
                          )}
                          {activity.type === 'listing' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                              <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                            </svg>
                          )}
                          {activity.type === 'report' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                            </svg>
                          )}
                          {activity.type === 'review' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1">{activity.description}</p>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-muted mb-3" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  </svg>
                  <p className="text-muted">No recent activity to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Platform Health</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success rounded-circle p-2 me-2">&nbsp;</span>
                    <div>
                      <strong>API Status</strong>
                      <div className="text-muted small">Operational</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success rounded-circle p-2 me-2">&nbsp;</span>
                    <div>
                      <strong>Database</strong>
                      <div className="text-muted small">Connected</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success rounded-circle p-2 me-2">&nbsp;</span>
                    <div>
                      <strong>File Storage</strong>
                      <div className="text-muted small">Active</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <span className={`badge ${stats.pending_reports > 5 ? 'bg-warning' : 'bg-success'} rounded-circle p-2 me-2`}>&nbsp;</span>
                    <div>
                      <strong>Moderation Queue</strong>
                      <div className="text-muted small">{stats.pending_reports} pending items</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
