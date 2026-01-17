'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Register user
      const registerResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: 'citizen'
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        throw new Error(data.detail || 'Registration failed');
      }

      // Auto-login after successful registration
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authUtils.setToken(loginData.access_token);
        setSuccess(true);
        
        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        // Registration successful but login failed
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-green-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">Your account has been created.</p>
            <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white py-12">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-red-500">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Urban Intelligence Platform</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-fullname" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="signup-fullname"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Registration Benefits
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Access to scenario simulation tools
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personalized alerts and notifications
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time city data and forecasts
              </li>
            </ul>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-red-500 hover:text-red-600 font-medium">
              Sign In
            </a>
          </p>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
