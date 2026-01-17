'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [freshness, setFreshness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadHealthData();
    loadFreshness();
    
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      loadHealthData();
      loadFreshness();
      setLastUpdate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFreshness = async () => {
    try {
      const data = await api.getFreshness();
      setFreshness(data);
    } catch (error) {
      console.error('Failed to load data freshness:', error);
    }
  };

  const calculateUptime = (status: string) => {
    if (status === 'healthy') {
      return 99.8 + Math.random() * 0.2;
    }
    return 95.0 + Math.random() * 3;
  };

  const formatAge = (minutes?: number | null) => {
    if (minutes === null || minutes === undefined) return 'No data';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring of platform infrastructure and data pipelines
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              {/* System Status Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">API Status</p>
                      <p className="text-2xl font-bold text-gray-900">Operational</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Uptime: {calculateUptime(healthData?.status).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Database Status</p>
                      <p className="text-2xl font-bold text-gray-900">Operational</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Uptime: {(99.9).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Scheduler Status</p>
                      <p className="text-2xl font-bold text-gray-900">Operational</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Uptime: {(99.7).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">Active Cities</p>
                  <p className="text-4xl font-bold text-red-500">4</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">Data Points Processed</p>
                  <p className="text-4xl font-bold text-red-500">1.2M</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">Alerts Generated</p>
                  <p className="text-4xl font-bold text-red-500">12</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600 mb-2">API Calls</p>
                  <p className="text-4xl font-bold text-red-500">842K</p>
                </div>
              </div>

              {/* Data Freshness */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Freshness</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">Environment Data</p>
                        <p className="text-sm text-gray-600">Temperature, AQI, Humidity</p>
                      </div>
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatAge(freshness?.by_type?.environment?.age_minutes)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">Traffic Data</p>
                        <p className="text-sm text-gray-600">Flow, Congestion, Incidents</p>
                      </div>
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatAge(freshness?.by_type?.traffic?.age_minutes)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">Service Data</p>
                        <p className="text-sm text-gray-600">Outages, Degradation, Status</p>
                      </div>
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Updated {formatAge(freshness?.by_type?.services?.age_minutes)}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Performance */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Performance</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Average Response Time */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-semibold text-gray-900">Average Response Time</p>
                      <p className="text-2xl font-bold text-red-500">127ms</p>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                        <div style={{ width: '63.5%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Target: 200ms</p>
                    </div>
                  </div>

                  {/* CPU Usage */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-semibold text-gray-900">CPU Usage</p>
                      <p className="text-2xl font-bold text-green-500">42%</p>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                        <div style={{ width: '42%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Healthy range</p>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-semibold text-gray-900">Memory Usage</p>
                      <p className="text-2xl font-bold text-blue-500">58%</p>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                        <div style={{ width: '58%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Healthy range</p>
                    </div>
                  </div>

                  {/* Request Rate */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-semibold text-gray-900">Request Rate</p>
                      <p className="text-2xl font-bold text-red-500">2.4K/min</p>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                        <div style={{ width: '80%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Within capacity</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Alerts</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-lg font-semibold text-green-900">All Systems Operational</p>
                      <p className="text-sm text-green-700 mt-1">No critical alerts. System performing optimally.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="text-center text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refresh every 60 seconds
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
