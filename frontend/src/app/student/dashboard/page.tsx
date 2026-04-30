// frontend/src/app/student/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSection from '@/components/student/DashboardSection';
import EmptyState from '@/components/student/EmptyState';
import { getStudentDashboard, DashboardData } from '@/services/studentService';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EA638C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <EmptyState
          title="Unable to load dashboard"
          message={error}
          actionText="Try Again"
          onAction={fetchDashboard}
        />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <EmptyState
          title="No data available"
          message="We couldn't find any rental information for your account."
          actionText="Browse Properties"
          onAction={() => router.push('/search')}
        />
      </div>
    );
  }

  const hasAnyData = 
    dashboard.underNegotiation.length > 0 ||
    dashboard.currentRentals.length > 0 ||
    dashboard.pastRentals.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#190E4F' }}>
            Student Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your rental applications and housing history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#EA638C] to-[#B33C86] rounded-lg p-4 text-white">
            <p className="text-sm opacity-90">Active Applications</p>
            <p className="text-3xl font-bold">{dashboard.stats.totalApplications}</p>
            <p className="text-xs opacity-75 mt-1">Properties under negotiation</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#190E4F] to-[#03012C] rounded-lg p-4 text-white">
            <p className="text-sm opacity-90">Current Rentals</p>
            <p className="text-3xl font-bold">{dashboard.stats.activeRentals}</p>
            <p className="text-xs opacity-75 mt-1">Properties you're renting</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#002A22] to-[#002A22]/80 rounded-lg p-4 text-white">
            <p className="text-sm opacity-90">Past Rentals</p>
            <p className="text-3xl font-bold">{dashboard.stats.completedRentals}</p>
            <p className="text-xs opacity-75 mt-1">Completed rental history</p>
          </div>
        </div>

        {/* Dashboard Sections */}
        {!hasAnyData ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <EmptyState
              title="Welcome to your dashboard!"
              message="You haven't applied to any properties yet. Start browsing to find your perfect home."
              actionText="Browse Properties"
              onAction={() => router.push('/search')}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Under Negotiation Section */}
            {dashboard.underNegotiation.length > 0 && (
              <DashboardSection
                title="Under Negotiation"
                subtitle="Properties you've shown interest in - awaiting landlord response"
                properties={dashboard.underNegotiation}
                type="negotiation"
                icon="🤝"
                emptyMessage="No properties under negotiation"
                accentColor="#B33C86"
              />
            )}

            {/* Current Rentals Section */}
            {dashboard.currentRentals.length > 0 && (
              <DashboardSection
                title="Currently Renting"
                subtitle="Properties you're currently renting"
                properties={dashboard.currentRentals}
                type="current"
                icon="🏠"
                emptyMessage="No current rentals"
                accentColor="#002A22"
              />
            )}

            {/* Past Rentals Section */}
            {dashboard.pastRentals.length > 0 && (
              <DashboardSection
                title="Past Rentals"
                subtitle="Your rental history"
                properties={dashboard.pastRentals}
                type="past"
                icon="📜"
                emptyMessage="No past rentals"
                accentColor="#6B7280"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}