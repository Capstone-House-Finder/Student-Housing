'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Property {
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

interface PropertyCardProps {
  property: Property;
  showStatus?: boolean;
  showActions?: boolean;
  onStatusChange?: (status: string) => void;
  onDelete?: () => void;
}

export default function PropertyCard({
  property,
  showStatus = false,
  showActions = false,
  onStatusChange,
  onDelete,
}: PropertyCardProps) {
  const { isAuthenticated } = useAuth();

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'available':
        return 'bg-success';
      case 'rented':
        return 'bg-danger';
      case 'under_negotiation':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  };

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const defaultImage = 'https://placehold.co/400x300?text=No+Image';
  const imageUrl = property.photos && property.photos.length > 0
    ? property.photos[0].url
    : defaultImage;

  const CardContent = () => (
    <div className="card property-card h-100">
      <div className="position-relative">
        <img
          src={imageUrl}
          alt={property.title}
          className="card-img-top property-image"
        />
        {showStatus && property.status && (
          <span className={`badge ${getStatusBadgeClass(property.status)} position-absolute top-0 end-0 m-2`}>
            {formatStatus(property.status)}
          </span>
        )}
      </div>
      <div className="card-body">
        <h5 className="card-title text-truncate">{property.title}</h5>
        <p className="card-text text-muted mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
          </svg>
          {property.location}
        </p>
        <div className="d-flex justify-content-between align-items-center">
          <span className="h5 text-primary mb-0">{property.price.toLocaleString()} FCFA/mo</span>
          <span className="badge bg-light text-dark">
            {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
          </span>
        </div>
        {(property.bedrooms !== undefined || property.bathrooms !== undefined) && (
          <div className="mt-2 text-muted small">
            {property.bedrooms !== undefined && (
              <span className="me-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                  <path d="M2 13.5V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11.5a.5.5 0 0 1-.5.5H14v1h-1v-1H3v1H2v-1h-.5a.5.5 0 0 1-.5-.5zM1 2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1v1h-1v-1H3v1H2v-1a1 1 0 0 1-1-1V2z" />
                </svg>
                {property.bedrooms} bed
              </span>
            )}
            {property.bathrooms !== undefined && (
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                  <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                </svg>
                {property.bathrooms} bath
              </span>
            )}
          </div>
        )}
        {showActions && (
          <div className="d-flex gap-2 mt-3">
            {onStatusChange && (
              <select
                className="form-select form-select-sm"
                value={property.status || 'available'}
                onChange={(event) => onStatusChange(event.target.value)}
                onClick={(event) => event.preventDefault()}
              >
                <option value="available">Available</option>
                <option value="under_negotiation">Under Negotiation</option>
                <option value="rented">Rented</option>
              </select>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={(event) => {
                  event.preventDefault();
                  onDelete();
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isAuthenticated) {
    return (
      <Link href={`/listings/${property.id}`} className="text-decoration-none">
        <CardContent />
      </Link>
    );
  }

  return (
    <Link href="/login" className="text-decoration-none" title="Login to view details">
      <CardContent />
    </Link>
  );
}
