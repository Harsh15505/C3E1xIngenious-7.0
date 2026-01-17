'use client';

import { useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const userInfo = authUtils.getUserInfo();
    setUser(userInfo);
  }, []);

  const handleLogout = () => {
    authUtils.removeToken();
    router.push('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Urban Intelligence</h1>
              <p className="text-xs text-gray-500">
                {isAdmin ? 'Municipal Dashboard' : 'Citizen Portal'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href={isAdmin ? "/municipal/dashboard" : "/citizen/dashboard"} 
              className="text-gray-700 hover:text-orange-600 transition"
            >
              Dashboard
            </a>
            {isAdmin && (
              <>
                <a href="/municipal/scenario" className="text-gray-700 hover:text-orange-600 transition">
                  Scenarios
                </a>
                <a href="/municipal/alerts" className="text-gray-700 hover:text-orange-600 transition">
                  Alerts
                </a>
                <a href="/municipal/system-health" className="text-gray-700 hover:text-orange-600 transition">
                  System
                </a>
              </>
            )}
            {!isAdmin && (
              <a href="/citizen/alerts" className="text-gray-700 hover:text-orange-600 transition">
                Alerts
              </a>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
