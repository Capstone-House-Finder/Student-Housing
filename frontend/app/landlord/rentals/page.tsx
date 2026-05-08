'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { rentalsApi } from '@/lib/api';

interface RentalRecord {
  id: number;
  student_name: string;
  student_email: string;
  listing_title: string;
  listing_id: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function LandlordRentalsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'landlord') {
        router.push('/');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchRentals = async () => {
      if (!token) return;
      setIsLoading(true);
      const response = await rentalsApi.getLandlordRentals(token);
      if (response.success && response.data) {
        setRentals(response.data as RentalRecord[]);
      }
      setIsLoading(false);
    };

    if (token) {
      fetchRentals();
    }
  }, [token]);

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
          <li className="breadcrumb-item"><Link href="/landlord/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item active">Active Rentals</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Active Rentals</h1>
          <p className="text-muted small mb-0">Manage and view information about your current tenants.</p>
        </div>
        <span className="badge bg-success rounded-pill px-3 py-2">{rentals.length} Active</span>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0">Property</th>
                  <th className="py-3 border-0">Tenant</th>
                  <th className="py-3 border-0">Lease Period</th>
                  <th className="py-3 border-0">Created At</th>
                  <th className="px-4 py-3 border-0 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {rentals.length > 0 ? (
                  rentals.map((rental) => (
                    <tr key={rental.id}>
                      <td className="px-4 py-3">
                        <Link href={`/listings/${rental.listing_id}`} className="text-decoration-none fw-bold">
                          {rental.listing_title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold text-dark">{rental.student_name || 'Verified Student'}</div>
                        <div className="small text-muted">{rental.student_email}</div>
                      </td>
                      <td className="py-3">
                        <div className="small">
                          <span className="text-muted">From:</span> {new Date(rental.start_date).toLocaleDateString()}
                        </div>
                        {rental.end_date && (
                          <div className="small">
                            <span className="text-muted">To:</span> {new Date(rental.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-muted small">
                        {new Date(rental.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="opacity-25" viewBox="0 0 16 16">
                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                          <path fillRule="evenodd" d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                        </svg>
                      </div>
                      <h5>No active rentals found</h5>
                      <p className="small mb-0">When you mark a listing as "Rented", the tenant information will appear here.</p>
                      <Link href="/landlord/dashboard" className="btn btn-outline-primary btn-sm mt-3">
                        Go to Dashboard
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
