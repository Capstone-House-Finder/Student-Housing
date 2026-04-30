export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  propertyType: string;
  amenities: string[];
  images: string[];
  location: string;
  distance: number;
  createdAt: string;
  status: 'available' | 'rented' | 'under_negotiation';
  landlord: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface SearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  amenities?: string[];
  status?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'distance_asc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

export async function searchListings(params: SearchParams): Promise<SearchResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.location) queryParams.append('location', params.location);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.propertyType) queryParams.append('type', params.propertyType);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  
  if (params.amenities && params.amenities.length > 0) {
    params.amenities.forEach(amenity => {
      queryParams.append('amenities', amenity);
    });
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  
  return response.json();
}

export async function getPropertyTypes(): Promise<string[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/types`);
  if (!response.ok) return ['Apartment', 'House', 'Studio', 'Room'];
  return response.json();
}

export async function getAmenities(): Promise<string[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/amenities`);
  if (!response.ok) {
    return ['WiFi', 'AC', 'Parking', 'Laundry', 'Pool', 'Gym', 'Furnished', 'Pet Friendly'];
  }
  return response.json();
}