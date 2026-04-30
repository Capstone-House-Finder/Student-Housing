'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchFilters from '@/components/search/SearchFilters';
import SortDropdown from '@/components/search/SortDropdown';
import EmptyState from '@/components/search/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { searchListings, Property, SearchParams } from '@/services/searchService';

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48 bg-gray-200">
        {property.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{property.title}</h3>
        <p className="text-gray-600">${property.price}/month</p>
        <p className="text-sm text-gray-500 mt-1">{property.location}</p>
        <span 
          className="inline-block mt-2 px-2 py-1 rounded-full text-xs"
          style={{
            backgroundColor: property.status === 'available' ? '#002A2220' : '#B33C8620',
            color: property.status === 'available' ? '#002A22' : '#B33C86',
          }}
        >
          {property.status === 'available' ? 'Available' : 'Under Negotiation'}
        </span>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '5000'),
    propertyType: searchParams.get('type') || '',
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    status: searchParams.get('status') || 'available',
  });
  
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date_desc');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const debouncedFilters = useDebounce(filters, 500);
  const debouncedSortBy = useDebounce(sortBy, 300);

  useEffect(() => {
    loadResults();
  }, [debouncedFilters, debouncedSortBy]);

  useEffect(() => {
    updateURL();
  }, [filters, sortBy]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const params: SearchParams = {
        location: debouncedFilters.location || undefined,
        minPrice: debouncedFilters.minPrice || undefined,
        maxPrice: debouncedFilters.maxPrice || undefined,
        propertyType: debouncedFilters.propertyType || undefined,
        amenities: debouncedFilters.amenities.length > 0 ? debouncedFilters.amenities : undefined,
        status: debouncedFilters.status || undefined,
        sortBy: debouncedSortBy as any,
      };
      
      const results = await searchListings(params);
      setProperties(results.properties);
      setTotal(results.total);
    } catch (error) {
      console.error('Search failed:', error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice < 5000) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.propertyType) params.set('type', filters.propertyType);
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (filters.status && filters.status !== 'available') params.set('status', filters.status);
    if (sortBy !== 'date_desc') params.set('sortBy', sortBy);
    
    const newURL = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    router.replace(newURL, { scroll: false });
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({
      location: '',
      minPrice: 0,
      maxPrice: 5000,
      propertyType: '',
      amenities: [],
      status: 'available',
    });
    setSortBy('date_desc');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: '#190E4F' }}>
            Find Your Perfect Home
          </h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Searching...' : `Found ${total} property${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 flex-shrink-0">
            <SearchFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
              <SortDropdown value={sortBy} onChange={setSortBy} />
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1 rounded-md transition-colors"
                style={{ color: '#EA638C' }}
              >
                Reset Filters
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-12 h-12 border-4 border-[#EA638C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : properties.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onClick={() => router.push(`/listings/${property.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}