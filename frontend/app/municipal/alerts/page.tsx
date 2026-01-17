'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

type Alert = {
  id: string;
  city: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  audience: string;
  created_at: string;
  is_active: boolean;
  metadata?: Record<string, any>;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const cities = ['Ahmedabad', 'Gandhinagar', 'Vadodara'];

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedCity, severityFilter, audienceFilter, statusFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const allAlerts: Alert[] = [];
      for (const city of cities) {
        const cityAlerts = await api.getAlerts(city.toLowerCase());
        if (cityAlerts?.alerts?.length) {
          allAlerts.push(
            ...cityAlerts.alerts.map((alert: any) => ({
              ...alert,
              city
            }))
          );
        }
      }
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

    if (audienceFilter !== 'all') {
      filtered = filtered.filter(a => a.audience === audienceFilter);
    }

    if (statusFilter !== 'all') {
      const isResolved = statusFilter === 'resolved';
      filtered = filtered.filter(a => a.is_active === !isResolved);
    }

    setFilteredAlerts(filtered);
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId);
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, is_active: false } : a
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAudienceBadge = (audience: string) => {
    return audience === 'public' ? 
      'bg-blue-100 text-blue-700' : 
      'bg-purple-100 text-purple-700';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
              <p className="text-gray-600 mt-1">
                Create, monitor, and manage city alerts
              </p>
            </div>
            <button className="bg-red-500 text-white px-6 py-2.5 rounded-md hover:bg-red-600 text-sm font-semibold flex items-center">
              <span className="mr-2">+</span> Create Alert
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Filter Icon */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>

                {/* City Filter */}
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city.toLowerCase()}>{city}</option>
                  ))}
                </select>

                {/* Severity Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadAlerts}
                className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium text-gray-900">No alerts found</p>
              <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50 transition">
                      {/* Alert Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 ${
                            alert.severity === 'critical' || alert.severity === 'warning' ? 'bg-red-50' : 'bg-blue-50'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              alert.severity === 'critical' || alert.severity === 'warning' ? 'text-red-500' : 'text-blue-500'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                            <p className="text-sm text-gray-500">{alert.message}</p>
                          </div>
                        </div>
                      </td>

                      {/* Severity Column */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md ${
                          alert.severity === 'critical' || alert.severity === 'warning' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </span>
                      </td>

                      {/* City Column */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {alert.city.charAt(0).toUpperCase() + alert.city.slice(1)}
                        </p>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          alert.is_active ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {alert.is_active ? 'Active' : 'Resolved'}
                        </span>
                      </td>

                      {/* Time Column */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {getRelativeTime(alert.created_at)}
                        </p>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {alert.is_active && (
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            className="text-red-500 hover:text-red-700"
                            title="Delete alert"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
