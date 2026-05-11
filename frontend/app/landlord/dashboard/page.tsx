'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsApi, listingsApi, rentalsApi } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';

interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  photos?: { url: string }[];
  created_at: string;
}

interface DashboardStats {
  total_listings: number;
  active_listings: number;
  rented_listings: number;
  total_views: number;
  total_contacts: number;
}

export default function LandlordDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    total_listings: 0,
    active_listings: 0,
    rented_listings: 0,
    total_views: 0,
    total_contacts: 0,
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Rental Modal State
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [rentalListingId, setRentalListingId] = useState<number | null>(null);
  const [rentalData, setRentalData] = useState({
    studentEmail: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [isRentalSubmitting, setIsRentalSubmitting] = useState(false);
  const [rentalError, setRentalError] = useState('');

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
    const fetchDashboardData = async () => {
      if (!token) return;

      setIsLoading(true);
      const response = await listingsApi.getLandlordDashboard(token);
      
      if (response.success && response.data) {
        const { stats, listings } = response.data as any;
        setStats(stats);
        setListings(listings);
      }

      setIsLoading(false);
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleStatusChange = async (listingId: number, newStatus: string) => {
    if (!token) return;

    if (newStatus === 'rented') {
      setRentalListingId(listingId);
      setShowRentalModal(true);
      return;
    }

    const result = await listingsApi.updateStatus(token, listingId, newStatus);
    if (result.success) {
      setListings(listings.map(l =>
        l.id === listingId ? { ...l, status: newStatus } : l
      ));
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rentalListingId) return;

    setIsRentalSubmitting(true);
    setRentalError('');

    const result = await rentalsApi.create(token, {
      listing_id: rentalListingId,
      student_email: rentalData.studentEmail,
      start_date: rentalData.startDate,
      end_date: rentalData.endDate || undefined
    });

    if (result.success) {
      setListings(listings.map(l =>
        l.id === rentalListingId ? { ...l, status: 'rented' } : l
      ));
      setShowRentalModal(false);
      setRentalData({ studentEmail: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    } else {
      setRentalError(result.error?.message || 'Failed to create rental record');
    }
    setIsRentalSubmitting(false);
  };

  const handleDelete = async (listingId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const result = await listingsApi.delete(token, listingId);
    if (result.success) {
      setListings(listings.filter(l => l.id !== listingId));
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success';
      case 'rented': return 'bg-danger';
      case 'under_negotiation': return 'bg-warning text-dark';
      case 'pending': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

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
          <h1 className="h3 mb-1">Landlord Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
        <Link href="/landlord/listings/create" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add New Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.total_listings}</h2>
                  <p className="text-muted mb-0 small">Total Listings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="h3 mb-0">{stats.active_listings}</h2>
                  <p className="text-muted mb-0 small">Active Listings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <Link href="/landlord/rentals" className="text-decoration-none">
            <div className="card h-100 hover-shadow transition" style={{ cursor: 'pointer' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-info" viewBox="0 0 16 16">
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                      <path fillRule="evenodd" d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="h3 mb-0">{stats.rented_listings}</h2>
                    <p className="text-muted mb-0 small">Active Rentals</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link href="/landlord/contacts" className="text-decoration-none">
            <div className="card h-100 hover-shadow transition" style={{ cursor: 'pointer' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-warning" viewBox="0 0 16 16">
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="h3 mb-0">{stats.total_contacts}</h2>
                    <p className="text-muted mb-0 small">Contact Requests</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
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
            className={`nav-link ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            My Listings ({listings.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Listings</h5>
                <Link href="/landlord/listings/create" className="btn btn-sm btn-outline-primary">
                  Add New
                </Link>
              </div>
              <div className="card-body">
                {listings.length > 0 ? (
                  <div className="row g-4">
                    {listings.slice(0, 4).map((listing) => (
                      <div key={listing.id} className="col-md-6">
                        <PropertyCard
                          property={listing}
                          showActions
                          onStatusChange={(status) => handleStatusChange(listing.id, status)}
                          onDelete={() => handleDelete(listing.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-muted mb-3" viewBox="0 0 16 16">
                      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                    </svg>
                    <h6 className="text-muted">No listings yet</h6>
                    <p className="text-muted small mb-3">Start by creating your first property listing.</p>
                    <Link href="/landlord/listings/create" className="btn btn-primary btn-sm">
                      Create Listing
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link href="/landlord/listings/create" className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    Add New Listing
                  </Link>
                  <Link href="/landlord/rentals" className="btn btn-outline-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                      <path fillRule="evenodd" d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                    </svg>
                    View Rentals
                  </Link>
                  <Link href="/profile" className="btn btn-outline-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                    </svg>
                    Edit Profile
                  </Link>
                  <Link href="/landlord/contacts" className="btn btn-outline-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                    </svg>
                    View Contacts
                  </Link>

                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Listing Status Guide</h5>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-success me-2">Available</span>
                  <small className="text-muted">Visible to students</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-warning text-dark me-2">Under Negotiation</span>
                  <small className="text-muted">Currently negotiating</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-danger me-2">Rented</span>
                  <small className="text-muted">Not available</small>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-info me-2">Pending</span>
                  <small className="text-muted">Awaiting approval</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">All Listings</h5>
            <Link href="/landlord/listings/create" className="btn btn-primary btn-sm">
              Add New Listing
            </Link>
          </div>
          <div className="card-body">
            {listings.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Price</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {listing.photos && listing.photos[0] ? (
                              <img
                                src={listing.photos[0].url}
                                alt={listing.title}
                                className="rounded me-3"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="bg-light rounded me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                                </svg>
                              </div>
                            )}
                            <div>
                              <strong>{listing.title}</strong>
                              <div className="text-muted small">{listing.property_type}</div>
                            </div>
                          </div>
                        </td>
                        <td>{listing.price.toLocaleString()} FCFA/mo</td>
                        <td>{listing.location}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(listing.status)}`}>
                            {formatStatus(listing.status)}
                          </span>
                        </td>
                        <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link href={`/listings/${listing.id}`} className="btn btn-outline-primary">
                              View
                            </Link>
                            <Link href={`/landlord/listings/${listing.id}/edit`} className="btn btn-outline-secondary">
                              Edit
                            </Link>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                              >
                                Status
                              </button>
                              <ul className="dropdown-menu">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(listing.id, 'available')}
                                  >
                                    Available
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(listing.id, 'under_negotiation')}
                                  >
                                    Under Negotiation
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusChange(listing.id, 'rented')}
                                  >
                                    Rented
                                  </button>
                                </li>
                              </ul>
                            </div>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(listing.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-muted mb-3" viewBox="0 0 16 16">
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
                </svg>
                <h6 className="text-muted">No listings yet</h6>
                <p className="text-muted small mb-3">Start by creating your first property listing.</p>
                <Link href="/landlord/listings/create" className="btn btn-primary btn-sm">
                  Create Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rental Modal */}
      {showRentalModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Mark as Rented</h5>
                <button type="button" className="btn-close" onClick={() => setShowRentalModal(false)}></button>
              </div>
              <form onSubmit={handleCreateRental}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-4">
                    To mark this property as rented, please provide the student's information and lease terms.
                  </p>
                  
                  {rentalError && <div className="alert alert-danger small">{rentalError}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Student Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="student@example.com"
                      value={rentalData.studentEmail}
                      onChange={e => setRentalData({...rentalData, studentEmail: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={rentalData.startDate}
                        onChange={e => setRentalData({...rentalData, startDate: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">End Date (Optional)</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={rentalData.endDate}
                        onChange={e => setRentalData({...rentalData, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 p-4">
                  <button type="button" className="btn btn-light" onClick={() => setShowRentalModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={isRentalSubmitting}>
                    {isRentalSubmitting ? 'Processing...' : 'Confirm Rental'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
