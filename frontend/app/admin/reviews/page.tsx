'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  if (authLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 text-center">
      <nav aria-label="breadcrumb" className="mb-4 text-start">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item active">Manage Reviews</li>
        </ol>
      </nav>

      <div className="py-5">
        <i className="bi bi-star text-muted" style={{ fontSize: '4rem' }}></i>
        <h2 className="mt-4">Review Moderation</h2>
        <p className="text-muted">This feature is coming soon. You can currently manage reports related to reviews in the Reports section.</p>
        <Link href="/admin/reports" className="btn btn-primary mt-3">
          Go to Reports
        </Link>
      </div>
    </div>
  );
}
