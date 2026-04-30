// frontend/src/services/listingService.ts
// Add this function to your existing listingService.ts

export type PropertyStatus = 'available' | 'rented' | 'under_negotiation';

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  listing: {
    id: string;
    status: PropertyStatus;
  };
}

export async function updatePropertyStatus(
  listingId: string, 
  newStatus: PropertyStatus
): Promise<UpdateStatusResponse> {
  const token = sessionStorage.getItem('authToken');
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update status');
  }

  return response.json();
}