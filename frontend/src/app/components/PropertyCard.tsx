'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Property, updatePropertyStatus } from '@/services/landlordService';

interface PropertyCardProps {
  property: Property;
  onStatusUpdate: () => void;
  onViewInterested: (propertyId: string) => void;
  onEditListing: (propertyId: string) => void;
}

export default function PropertyCard({ property, onStatusUpdate, onViewInterested, onEditListing }: PropertyCardProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(property.status);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await updatePropertyStatus(property.id, newStatus);
      setCurrentStatus(newStatus as Property['status']);
      onStatusUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {property.image ? (
          <Image src={property.image} alt={property.title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No image</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{property.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
            {currentStatus}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3">${property.price}/month</p>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">🎓 Interested Students</span>
            <span className="text-2xl font-bold text-blue-600">{property.interestedCount}</span>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Update Status:</label>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="w-full p-2 border rounded-md text-sm disabled:opacity-50"
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewInterested(property.id)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            View Interested ({property.interestedCount})
          </button>
          <button
            onClick={() => onEditListing(property.id)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}


/////
// frontend/src/components/PropertyCard.tsx
'use client';

import Image from 'next/image';
import PropertyStatusSelector from './PropertyStatusSelector';
import { PropertyStatus } from '@/services/listingService';

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  image?: string;
  status: PropertyStatus;
  interestedCount?: number;
  onStatusChange: (newStatus: PropertyStatus) => void;
  onViewDetails?: () => void;
}

export default function PropertyCard({
  id,
  title,
  price,
  image,
  status: initialStatus,
  interestedCount = 0,
  onStatusChange,
  onViewDetails,
}: PropertyCardProps) {
  const [status, setStatus] = useState(initialStatus);

  const handleStatusChange = (newStatus: PropertyStatus) => {
    setStatus(newStatus);
    onStatusChange(newStatus);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <PropertyStatusSelector
            listingId={id}
            currentStatus={status}
            onStatusChange={handleStatusChange}
          />
        </div>

        <p className="text-gray-600 text-sm mb-3">${price}/month</p>

        {/* Interested students count */}
        {interestedCount > 0 && (
          <div className="mb-3 p-2 rounded-md" style={{ backgroundColor: '#EA638C10' }}>
            <p className="text-sm" style={{ color: '#EA638C' }}>
              🎓 {interestedCount} interested student{interestedCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: '#190E4F',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#03012C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#190E4F';
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
