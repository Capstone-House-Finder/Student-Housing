// frontend/src/app/components/student/PropertyCard.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    price: number;
    location: string;
    propertyType: string;
    image?: string;
    landlordName: string;
    startDate?: string;
    endDate?: string;
    status: string;
  };
  type: 'negotiation' | 'current' | 'past';
}

export default function PropertyCard({ property, type }: PropertyCardProps) {
  const router = useRouter();

  const getStatusColor = () => {
    switch (type) {
      case 'negotiation':
        return { bg: '#B33C8620', text: '#B33C86', label: 'Under Negotiation' };
      case 'current':
        return { bg: '#002A2220', text: '#002A22', label: 'Currently Renting' };
      case 'past':
        return { bg: '#6B728020', text: '#6B7280', label: 'Past Rental' };
    }
  };

  const statusStyle = getStatusColor();

  return (
    <div 
      onClick={() => router.push(`/listings/${property.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-200">
          {property.image ? (
            <Image src={property.image} alt={property.title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-2xl">
              🏠
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">{property.title}</h3>
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {statusStyle.label}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">{property.location}</p>
          <p className="text-sm font-medium" style={{ color: '#EA638C' }}>
            ${property.price}/month
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {property.landlordName} • {property.propertyType}
          </p>
          
          {property.startDate && (
            <p className="text-xs text-gray-400 mt-1">
              Since: {new Date(property.startDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}