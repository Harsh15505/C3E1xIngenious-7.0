'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      authUtils.setToken(data.access_token);

      // Verify it's an admin account
      const userInfo = authUtils.getUserInfo();
      if (userInfo?.role !== 'admin') {
        setError('This login is for administrators only. Citizens should use the citizen portal.');
        authUtils.removeToken();
        setLoading(false);
        return;
      }

      // Redirect to municipal dashboard
      router.push('/municipal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@urbanintel.com');
    setPassword('admin12345');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'admin@urbanintel.com', password: 'admin12345' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      authUtils.setToken(data.access_token);

      const userInfo = authUtils.getUserInfo();
      if (userInfo?.role !== 'admin') {
        setError('This login is for administrators only.');
        authUtils.removeToken();
        setLoading(false);
        return;
      }

      router.push('/municipal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-300 mt-2">Municipal Operations Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900">Administrator Access</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="admin@city.gov"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              DEMO CREDENTIALS
            </h3>
            
            {/* Admin Account */}
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                    Admin Account
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    admin@urbanintel.com / admin12345
                  </p>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-700">
                  <strong>Restricted Access:</strong> This portal is for authorized municipal administrators only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            🔒 Secure connection • All actions are logged
          </p>
        </div>
      </div>
    </div>
  );
}
