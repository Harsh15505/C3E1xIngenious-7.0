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

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Alert Management</h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage system alerts across all cities
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city.toLowerCase()}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Audience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience
                </label>
                <select
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Audiences</option>
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredAlerts.length}</span> of <span className="font-medium">{alerts.length}</span> alerts
              </p>
              <button
                onClick={loadAlerts}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
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
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium text-gray-900">No alerts found</p>
              <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    !alert.is_active ? 'opacity-60 border-gray-300' : getSeverityColor(alert.severity).split(' ')[2].replace('border-', 'border-')
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAudienceBadge(alert.audience)}`}>
                          {alert.audience === 'public' ? '👁️ Public' : '🔒 Internal'}
                        </span>
                        <span className="text-sm text-gray-600">
                          📍 {alert.city.charAt(0).toUpperCase() + alert.city.slice(1)}
                        </span>
                        {!alert.is_active && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            ✓ Resolved
                          </span>
                        )}
                        {alert.metadata?.source === 'ml' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            🤖 ML
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 text-lg mb-1">{alert.title}</p>
                      <p className="text-gray-700 text-sm mb-2">{alert.message}</p>
                      {alert.metadata?.confidence_score !== undefined && (
                        <p className="text-xs text-blue-600 mb-2">
                          Confidence: {(alert.metadata.confidence_score * 100).toFixed(0)}%
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {new Date(alert.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        ID: {alert.id}
                      </p>
                    </div>

                    {alert.is_active && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
