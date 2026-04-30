export interface Property {
  id: string;
  title: string;
  status: 'available' | 'rented' | 'pending';
  interestedStudents: InterestedStudent[];
  interestedCount: number;
  image?: string;
  price: number;
}

export interface InterestedStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  interestedDate: string;
}

export interface DashboardData {
  properties: Property[];
  totalProperties: number;
  totalInterested: number;
}

export async function getLandlordDashboard(): Promise<DashboardData> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landlords/me/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function updatePropertyStatus(propertyId: string, newStatus: string): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landlords/properties/${propertyId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!response.ok) throw new Error('Failed to update status');
}