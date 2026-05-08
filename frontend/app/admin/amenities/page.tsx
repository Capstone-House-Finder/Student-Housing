'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface Amenity {
  id: number;
  name: string;
}

export default function AdminAmenitiesPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [newAmenityName, setNewAmenityName] = useState('');
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

  const fetchAmenities = async () => {
    if (!token) return;
    setIsLoading(true);
    const response = await adminApi.getAmenities(token);
    if (response.success && response.data) {
      setAmenities(response.data as Amenity[]);
    } else {
      setError(response.error?.message || 'Failed to fetch amenities');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchAmenities();
    }
  }, [token]);

  const handleCreateAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAmenityName.trim()) return;

    const response = await adminApi.createAmenity(token, newAmenityName.trim());
    if (response.success) {
      setSuccessMessage('Amenity created successfully');
      setNewAmenityName('');
      fetchAmenities();
    } else {
      setError(response.error?.message || 'Failed to create amenity');
    }
  };

  const handleDeleteAmenity = async (amenityId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this amenity? It will be removed from all listings.')) return;

    const response = await adminApi.deleteAmenity(token, amenityId);
    if (response.success) {
      setSuccessMessage('Amenity deleted successfully');
      fetchAmenities();
    } else {
      setError(response.error?.message || 'Failed to delete amenity');
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
          <li className="breadcrumb-item active">Manage Amenities</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Manage Amenities</h1>
        <div className="text-muted small">{amenities.length} Total Amenities</div>
      </div>

      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {error}
        <button type="button" className="btn-close" onClick={() => setError('')}></button>
      </div>}
      
      {successMessage && <div className="alert alert-success alert-dismissible fade show" role="alert">
        {successMessage}
        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
      </div>}

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0">Add New Amenity</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateAmenity}>
                <div className="mb-3">
                  <label htmlFor="amenityName" className="form-label">Amenity Name</label>
                  <input
                    type="text"
                    id="amenityName"
                    className="form-control"
                    placeholder="e.g., Free WiFi, Swimming Pool"
                    value={newAmenityName}
                    onChange={(e) => setNewAmenityName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Create Amenity
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Amenity Name</th>
                    <th className="py-3">ID</th>
                    <th className="py-3 text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 fw-bold">{a.name}</td>
                      <td>{a.id}</td>
                      <td className="text-end px-4">
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteAmenity(a.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {amenities.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5 text-muted">
                        No amenities found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
