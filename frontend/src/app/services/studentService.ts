// frontend/src/app/services/studentService.ts

export interface PropertySummary {
  id: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  image?: string;
  landlordName: string;
  landlordContact: string;
  startDate?: string;
  endDate?: string;
  status: 'under_negotiation' | 'rented' | 'completed';
}

export interface DashboardData {
  underNegotiation: PropertySummary[];
  currentRentals: PropertySummary[];
  pastRentals: PropertySummary[];
  stats: {
    totalApplications: number;
    activeRentals: number;
    completedRentals: number;
  };
}

export async function getStudentDashboard(): Promise<DashboardData> {
  const token = sessionStorage.getItem('authToken');
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students/me/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load dashboard');
  }

  return response.json();
}