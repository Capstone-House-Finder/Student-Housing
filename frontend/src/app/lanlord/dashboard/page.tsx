'use client';
import { useEffect, useState } from 'react';
import { getLandlordDashboard, DashboardData } from '@/services/landlordService';
import PropertyCard from '@/components/PropertyCard';

export default function LandlordDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestedStudents, setInterestedStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      const data = await getLandlordDashboard();
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleViewInterested(propertyId: string) {
    const property = dashboard?.properties.find(p => p.id === propertyId);
    if (property) {
      setInterestedStudents(property.interestedStudents);
      setShowModal(true);
    }
  }

  function handleEditListing(propertyId: string) {
    window.location.href = `/landlord/listings/${propertyId}/edit`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Landlord Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your properties and interested students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{dashboard?.totalProperties || 0}</div>
            <div className="text-gray-600">Total Properties</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{dashboard?.totalInterested || 0}</div>
            <div className="text-gray-600">Total Interested Students</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboard?.properties.filter(p => p.status === 'pending').length || 0}
            </div>
            <div className="text-gray-600">Pending Properties</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard?.properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onStatusUpdate={fetchDashboard}
              onViewInterested={handleViewInterested}
              onEditListing={handleEditListing}
            />
          ))}
        </div>

        {dashboard?.properties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No properties yet. Create your first listing!</p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
              + Add Property
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Interested Students</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 text-2xl">
                  ✕
                </button>
              </div>
              <div className="p-4">
                {interestedStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No interested students yet</p>
                ) : (
                  <div className="space-y-4">
                    {interestedStudents.map((student) => (
                      <div key={student.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-gray-600">{student.phone}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(student.interestedDate).toLocaleDateString()}
                          </span>
                        </div>
                        {student.message && (
                          <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            "{student.message}"
                          </p>
                        )}
                        <button className="mt-3 text-sm text-blue-600">
                          Contact Student
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}