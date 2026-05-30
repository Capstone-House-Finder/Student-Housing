'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { listingsApi, amenitiesApi } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';

interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  photos?: { url: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PROPERTY_TYPES = ['apartment', 'house', 'room', 'condo', 'townhouse'];
const STATUS_OPTIONS = ['available', 'under_negotiation', 'rented'];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbAmenities, setDbAmenities] = useState<string[]>([]);

  // Filter states
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('property_type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchListings = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    const params: Record<string, string | number> = {
      page: currentPage,
      limit: 12,
    };

    if (location) params.location = location;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (propertyType) params.property_type = propertyType;
    if (status) params.status = status;
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');
    if (sortBy) params.sortBy = sortBy;

    const response = await listingsApi.search(token, params);

    if (response.success && response.data) {
      const data = response.data as { listings: Listing[]; pagination: Pagination };
      setListings(data.listings || []);
      setPagination(data.pagination || null);
    }

    setIsLoading(false);
  }, [token, location, minPrice, maxPrice, propertyType, status, selectedAmenities, sortBy, currentPage]);

  // Fetch amenities on mount
  useEffect(() => {
    const fetchAmenities = async () => {
      const response = await amenitiesApi.list();
      if (response.success && response.data) {
        // Assuming data is an array of objects with a 'name' property
        const names = (response.data as any[]).map(a => a.name);
        setDbAmenities(names);
      }
    };
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (token) {
      // Debounce search
      const timer = setTimeout(() => {
        fetchListings();
        updateURL();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [token, authLoading, isAuthenticated, router, fetchListings]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (propertyType) params.set('property_type', propertyType);
    if (status) params.set('status', status);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    if (sortBy) params.set('sortBy', sortBy);
    if (currentPage > 1) params.set('page', String(currentPage));

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setStatus('');
    setSelectedAmenities([]);
    setSortBy('date');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Search Properties</h1>

      <div className="row">
        {/* Filter Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card filter-sidebar">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-bold">Filters</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
            </div>
            <div className="card-body">
              {/* Location */}
              <div className="mb-3">
                <label htmlFor="location" className="form-label fw-semibold">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  className="form-control"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Price Range */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Price Range</label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-3">
                <label htmlFor="propertyType" className="form-label fw-semibold">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  className="form-select"
                  value={propertyType}
                  onChange={(e) => {
                    setPropertyType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="mb-3">
                <label htmlFor="status" className="form-label fw-semibold">
                  Listing Status
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amenities */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Amenities</label>
                <div className="d-flex flex-wrap gap-2">
                  {dbAmenities.length > 0 ? (
                    dbAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        className={`btn btn-sm ${selectedAmenities.includes(amenity)
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                          }`}
                        onClick={() => handleAmenityToggle(amenity)}
                      >
                        {amenity}
                      </button>
                    ))
                  ) : (
                    <p className="text-muted small">Loading amenities...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-lg-9">
          {/* Sort and Results Count */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">
              {pagination ? `${pagination.total} properties found` : 'Loading...'}
            </span>
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="sortBy" className="form-label mb-0 text-nowrap">
                Sort by:
              </label>
              <select
                id="sortBy"
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Searching properties...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-5">
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="empty-state-icon mb-3" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
                <h4>No Results Found</h4>
                <p className="text-muted">
                  Try adjusting your filters or search criteria.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClearFilters}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="col-md-6 col-xl-4">
                    <PropertyCard property={listing} showStatus />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <nav className="mt-4" aria-label="Search results pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.pages ||
                          Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, arr) => (
                        <>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <li key={`ellipsis-${page}`} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          <li
                            key={page}
                            className={`page-item ${currentPage === page ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        </>
                      ))}
                    <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
