'use client';

import { useState, useEffect } from 'react';
import RangeSlider from '@/components/ui/RangeSlider';
import { getPropertyTypes, getAmenities } from '@/services/searchService';

interface SearchFiltersProps {
  filters: {
    location: string;
    minPrice: number;
    maxPrice: number;
    propertyType: string;
    amenities: string[];
    status: string;
  };
  onFilterChange: (filters: any) => void;
}

const locations = ['', 'Near Campus', 'Downtown', 'Northside', 'Southside', 'Eastside', 'Westside'];
const locationLabels = ['All Locations', 'Near Campus', 'Downtown', 'Northside', 'Southside', 'Eastside', 'Westside'];

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    const types = await getPropertyTypes();
    const amenities = await getAmenities();
    setPropertyTypes(types);
    setAmenitiesList(amenities);
  };

  const handleChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    handleChange('amenities', newAmenities);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center mb-2"
      >
        <h3 className="font-semibold" style={{ color: '#190E4F' }}>Filters</h3>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA638C]"
            >
              {locations.map((loc, index) => (
                <option key={loc} value={loc}>{locationLabels[index]}</option>
              ))}
            </select>
          </div>

          <RangeSlider
            min={0}
            max={5000}
            value={{ min: filters.minPrice, max: filters.maxPrice }}
            onChange={(value) => {
              handleChange('minPrice', value.min);
              handleChange('maxPrice', value.max);
            }}
            label="Budget Range ($/month)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              value={filters.propertyType}
              onChange={(e) => handleChange('propertyType', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="available"
                  checked={filters.status === 'available'}
                  onChange={(e) => handleChange('status', e.target.value)}
                />
                <span style={{ color: '#002A22' }}>Available</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="under_negotiation"
                  checked={filters.status === 'under_negotiation'}
                  onChange={(e) => handleChange('status', e.target.value)}
                />
                <span style={{ color: '#B33C86' }}>Under Negotiation</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value=""
                  checked={filters.status === ''}
                  onChange={(e) => handleChange('status', '')}
                />
                <span>All</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {amenitiesList.map(amenity => (
                <label key={amenity} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => onFilterChange({
              location: '',
              minPrice: 0,
              maxPrice: 5000,
              propertyType: '',
              amenities: [],
              status: 'available',
            })}
            className="w-full py-2 text-sm rounded-md transition-colors"
            style={{ backgroundColor: '#EA638C20', color: '#EA638C' }}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}