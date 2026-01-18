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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden px-4 py-10 transition-colors duration-200">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-orange-200/40 dark:bg-orange-900/20 blur-3xl rounded-full" />
        <div className="absolute -top-8 right-10 w-80 h-80 bg-amber-200/30 dark:bg-amber-900/20 blur-[110px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-100/50 dark:bg-orange-950/30 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 shadow-lg rounded-3xl mb-6">
            <svg className="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Portal</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Secure municipal operations access</p>
        </div>

        {/* Login Card */}
        <div className="p-[1px] rounded-3xl bg-gradient-to-br from-orange-200 via-white to-amber-100 dark:from-orange-900/30 dark:via-gray-800 dark:to-amber-900/30 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-3xl p-8 border border-orange-100 dark:border-gray-800 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Restricted</p>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">Administrator Access</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition shadow-sm"
                  placeholder="admin@city.gov"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition shadow-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 dark:from-orange-600 dark:via-amber-500 dark:to-orange-600 text-white font-semibold py-3 px-6 transition transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-offset-orange-100 dark:focus:ring-offset-gray-900 focus:ring-amber-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_12px_30px_rgba(244,124,70,0.25)] dark:shadow-[0_12px_30px_rgba(244,124,70,0.4)]"
              >
                <span className="relative z-10">{loading ? 'Authenticating…' : 'Sign In as Admin'}</span>
                <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-3">
                Demo Credentials
              </h3>
              
              {/* Admin Account */}
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left transition transform hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-60 disabled:cursor-not-allowed group shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      Admin Account
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      admin@urbanintel.com / admin12345
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Security Notice */}
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                    <strong>Restricted Access:</strong> Municipal administrators only. All actions are logged and monitored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 text-gray-500 dark:text-gray-400 text-xs">
          🔒 Secure connection • All actions are logged
        </div>
      </div>
    </div>
  );
}
