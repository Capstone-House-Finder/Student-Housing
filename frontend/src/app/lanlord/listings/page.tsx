// frontend/src/app/landlord/listings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import { PropertyStatus } from '@/services/listingService';

interface Listing {
  id: string;
  title: string;
  price: number;
  image?: string;
  status: PropertyStatus;
  interestedCount: number;
}

export default function LandlordListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landlords/me/listings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (listingId: string, newStatus: PropertyStatus) => {
    // Update local state immediately (optimistic)
    setListings(prevListings =>
      prevListings.map(listing =>
        listing.id === listingId
          ? { ...listing, status: newStatus }
          : listing
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EA638C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchListings}
            className="px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: '#EA638C' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#190E4F' }}>
            Manage Your Properties
          </h1>
          <p className="text-gray-600 mt-2">
            Update property statuses - changes appear instantly to students
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Total Properties</p>
            <p className="text-2xl font-bold" style={{ color: '#190E4F' }}>{listings.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold" style={{ color: '#002A22' }}>
              {listings.filter(l => l.status === 'available').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-500">Under Negotiation</p>
            <p className="text-2xl font-bold" style={{ color: '#B33C86' }}>
              {listings.filter(l => l.status === 'under_negotiation').length}
            </p>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No properties yet. Create your first listing!</p>
            <button
              className="mt-4 px-6 py-2 rounded-md text-white"
              style={{ backgroundColor: '#EA638C' }}
            >
              + Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <PropertyCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                image={listing.image}
                status={listing.status}
                interestedCount={listing.interestedCount}
                onStatusChange={(newStatus) => handleStatusChange(listing.id, newStatus)}
                onViewDetails={() => window.location.href = `/listings/${listing.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}