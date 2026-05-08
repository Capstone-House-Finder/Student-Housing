'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  property_type: string;
  verified: boolean;
  flagged: boolean;
  landlord_id: number;
  created_at: string;
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
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

  const fetchListings = async () => {
    if (!token) return;
    setIsLoading(true);
    const response = await adminApi.getListings(token);
    if (response.success && response.data) {
      setListings(response.data as Listing[]);
    } else {
      setError(response.error?.message || 'Failed to fetch listings');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchListings();
    }
  }, [token]);

  const handleVerifyListing = async (listingId: number) => {
    if (!token) return;
    const response = await adminApi.verifyListing(token, listingId);
    if (response.success) {
      setSuccessMessage('Listing verified successfully');
      fetchListings();
    } else {
      setError(response.error?.message || 'Failed to verify listing');
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const response = await adminApi.deleteListing(token, listingId);
    if (response.success) {
      setSuccessMessage('Listing deleted successfully');
      fetchListings();
    } else {
      setError(response.error?.message || 'Failed to delete listing');
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
          <li className="breadcrumb-item active">Manage Listings</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Manage Listings</h1>
        <div className="text-muted small">{listings.length} Pending/Flagged Listings</div>
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
                <th className="px-4 py-3">Property</th>
                <th className="py-3">Type</th>
                <th className="py-3">Price</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-4">
                    <div className="fw-bold">{l.title}</div>
                    <div className="text-muted small">{l.location}</div>
                    <div className="text-muted extra-small">ID: {l.id} | Landlord: {l.landlord_id}</div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {l.property_type.charAt(0).toUpperCase() + l.property_type.slice(1)}
                    </span>
                  </td>
                  <td>${l.price.toLocaleString()}</td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {l.flagged && <span className="badge bg-danger">Flagged</span>}
                      {!l.verified && <span className="badge bg-warning text-dark">Pending Verification</span>}
                      {l.verified && !l.flagged && <span className="badge bg-success">Verified</span>}
                    </div>
                  </td>
                  <td className="text-end px-4">
                    <div className="d-flex justify-content-end gap-2">
                      <Link href={`/listings/${l.id}`} className="btn btn-sm btn-outline-primary">
                        View
                      </Link>
                      {!l.verified && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleVerifyListing(l.id)}
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteListing(l.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No pending or flagged listings found
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
