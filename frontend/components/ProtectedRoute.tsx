'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!authUtils.isAuthenticated()) {
      // Redirect to appropriate login page
      const loginPage = requireAdmin ? '/admin/login' : '/login';
      router.push(loginPage);
      return;
    }

    // Check admin requirement
    if (requireAdmin && !authUtils.isAdmin()) {
      router.push('/admin/login');
      return;
    }

    setIsAuthorized(true);
  }, [router, requireAdmin]);

  // Show loading or nothing while checking auth
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
