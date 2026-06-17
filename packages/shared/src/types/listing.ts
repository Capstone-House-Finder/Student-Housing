export type ListingStatus = 'available' | 'rented' | 'under_negotiation' | string;

export interface Photo {
  id?: number;
  url: string;
  public_id?: string;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  landlord_id?: number;
  landlord_email?: string;
  status?: ListingStatus;
  amenities?: Amenity[];
  photos?: Photo[];
  created_at?: string;
  updated_at?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
