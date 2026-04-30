// frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { getUser, getAuthToken } from '@/services/authService';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    
    // Check if token exists, redirect if not
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <LogoutButton />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Welcome back, {user.email}!</p>
          <p className="text-gray-600 mt-2">Role: {user.role}</p>
          <p className="text-gray-600 mt-2">You are now logged in.</p>
        </div>
      </div>
    </div>
  );
}