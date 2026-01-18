'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

type Alert = {
  alert_id: string;
  city: string;
  severity: string;
  message: string;
  created_at: string;
};

export default function CitizenAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const cities = ['Ahmedabad', 'Gandhinagar', 'Vadodara'];

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedCity, severityFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const allAlerts: Alert[] = [];
      for (const city of cities) {
        const cityKey = city.toLowerCase();

        // Fetch existing alerts; if none, attempt to generate and re-fetch
        let res = await api.getAlerts(cityKey, { active_only: true, limit: 50 });
        if (!res?.alerts || res.alerts.length === 0) {
          try {
            await api.generateAlerts(cityKey);
            res = await api.getAlerts(cityKey, { active_only: true, limit: 50 });
          } catch (genErr) {
            console.warn(`Alert generation failed for ${cityKey}:`, genErr);
          }
        }

        const cityAlerts = (res?.alerts || [])
          .filter((a: any) => (a.audience?.toLowerCase?.() === 'public') || (a.audience?.toLowerCase?.() === 'both'))
          .map((a: any) => ({
          alert_id: a.id || a.alert_id,
          city: city,
          severity: a.severity,
          message: a.title || a.message,
          created_at: a.created_at,
        }));
        allAlerts.push(...cityAlerts);
      }
      // Sort by created_at descending
      allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (selectedCity !== 'all') {
      filtered = filtered.filter(a => a.city.toLowerCase() === selectedCity.toLowerCase());
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📌';
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Public Alerts</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Stay informed about important updates in your city
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                >
                  <option value="all">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city.toLowerCase()}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing <span className="font-medium">{filteredAlerts.length}</span> alerts
              </p>
              <button
                onClick={loadAlerts}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center transition"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 dark:text-white">No alerts at this time</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later for updates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-all duration-200 ${
                    alert.severity === 'critical' ? 'border-red-500 dark:border-red-600' :
                    alert.severity === 'high' ? 'border-orange-500 dark:border-orange-600' :
                    alert.severity === 'medium' ? 'border-yellow-500 dark:border-yellow-600' :
                    'border-green-500 dark:border-green-600'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="text-3xl mr-4">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          📍 {alert.city.charAt(0).toUpperCase() + alert.city.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white text-lg mb-2">{alert.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors duration-200">
            <div className="flex">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">About Public Alerts</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  These alerts are issued by municipal authorities to inform citizens about important events, 
                  environmental conditions, service disruptions, and safety advisories. Please follow any 
                  instructions provided in critical alerts and stay informed about conditions in your area.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
