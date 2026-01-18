'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { api } from '@/lib/api';

type DatasetType = 'environment' | 'traffic' | 'services' | 'all';
type RequestReason = 'research' | 'academic' | 'civic_project' | 'journalism' | 'other';

export default function DatasetRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    citizenName: string;
    citizenEmail: string;
    datasetType: DatasetType;
    reason: RequestReason;
    description: string;
  }>({
    citizenName: '',
    citizenEmail: '',
    datasetType: 'environment',
    reason: 'research',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.submitDatasetRequest(formData);
      setSuccess(true);
      setFormData({
        citizenName: '',
        citizenEmail: '',
        datasetType: 'environment',
        reason: 'research',
        description: '',
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/citizen/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Request Dataset Access</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Request access to urban data for research, academic, or civic projects
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-300">Request Submitted Successfully!</h3>
                  <p className="text-sm text-green-800 dark:text-green-400 mt-1">
                    Our team will review your request and contact you via email. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-300">Submission Failed</h3>
                  <p className="text-sm text-red-800 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.citizenName}
                  onChange={(e) => setFormData({...formData, citizenName: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.citizenEmail}
                  onChange={(e) => setFormData({...formData, citizenEmail: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>

              {/* Dataset Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dataset Type <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.datasetType}
                  onChange={(e) => setFormData({...formData, datasetType: e.target.value as DatasetType})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="environment">Environment Data (AQI, PM2.5, Temperature)</option>
                  <option value="traffic">Traffic Data (Congestion, Density)</option>
                  <option value="services">Public Services Data (Water, Waste, Power)</option>
                  <option value="all">All Datasets</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Request <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value as RequestReason})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="research">Research</option>
                  <option value="academic">Academic Study</option>
                  <option value="civic_project">Civic Project</option>
                  <option value="journalism">Journalism</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detailed Description <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="Describe how you plan to use the data, your project goals, and any specific requirements..."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Minimum 10 characters</p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">About Dataset Requests</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Requests are reviewed within 3-5 business days</li>
                      <li>You will receive an email confirmation upon approval</li>
                      <li>Data is provided in standard formats (CSV, JSON)</li>
                      <li>Please respect data usage guidelines and cite sources</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/citizen/dashboard')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
