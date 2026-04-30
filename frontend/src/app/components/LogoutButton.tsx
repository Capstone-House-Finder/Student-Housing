// frontend/src/components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { logoutUser } from '@/services/authService';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    // Redirect to login page
    router.push('/login');
    // Prevent back navigation
    router.replace('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${className}`}
    >
      {children || 'Logout'}
    </button>
  );
}