'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Urban Intelligence</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            <a 
              href={isAdmin ? "/municipal/dashboard" : "/citizen/dashboard"} 
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive(isAdmin ? '/municipal/dashboard' : '/citizen/dashboard')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </a>

            <a 
              href={isAdmin ? "/municipal/alerts" : "/citizen/alerts"}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive('/alerts')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Alerts</span>
            </a>

            {isAdmin && (
              <>
                <a 
                  href="/municipal/scenario" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/municipal/scenario')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Simulator</span>
                </a>

                <a 
                  href="/municipal/system-health" 
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/municipal/system-health')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Health</span>
                </a>
              </>
            )}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
