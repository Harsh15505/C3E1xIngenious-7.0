'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

type AuditLog = {
  log_id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  details: any;
};

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [freshness, setFreshness] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
    loadFreshness();
    loadAuditLogs();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthData();
      loadFreshness();
    }, 30000);
    
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

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs.slice(0, 50)); // Show last 50 logs
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLogsLoading(false);
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

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    return status === 'healthy' ? '✓' : '✗';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatAge = (minutes?: number | null) => {
    if (minutes === null || minutes === undefined) return 'No data';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m ago`;
  };

  const freshnessClass = (status?: string) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'stale':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const freshnessIcon = (status?: string) => {
    switch (status) {
      case 'fresh':
        return '✓';
      case 'warning':
        return '⚠';
      case 'stale':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
            <p className="text-gray-600 mt-2">
              Real-time system status and audit trail
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              {/* System Status Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">API Status</h3>
                    <span className={`text-2xl ${getStatusColor(healthData?.status)}`}>
                      {getStatusIcon(healthData?.status)}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    {healthData?.status === 'healthy' ? 'Online' : 'Offline'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Version: {healthData?.version || 'N/A'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Database</h3>
                    <span className={`text-2xl ${getStatusColor(healthData?.database)}`}>
                      {getStatusIcon(healthData?.database)}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    {healthData?.database === 'healthy' ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-sm text-gray-600">
                    PostgreSQL (Aiven Cloud)
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Scheduler</h3>
                    <span className="text-2xl text-green-600">✓</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    Running
                  </p>
                  <p className="text-sm text-gray-600">
                    5 jobs scheduled
                  </p>
                </div>
              </div>

              {/* System Metrics */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">System Metrics</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {healthData?.uptime ? formatUptime(healthData.uptime) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Cities</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-xs text-gray-500">Gujarat Region</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data Points</p>
                    <p className="text-2xl font-bold text-gray-900">90K+</p>
                    <p className="text-xs text-gray-500">Historical + Live</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Update</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date().toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">Auto-refresh: 30s</p>
                  </div>
                </div>
              </div>

              {/* Data Freshness */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Freshness</h2>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${freshnessClass(freshness?.by_type?.environment?.status)}`}>
                    <div className="flex items-center">
                      <span className="w-6 h-6 mr-3 flex items-center justify-center">
                        {freshnessIcon(freshness?.by_type?.environment?.status)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Environment Data</p>
                        <p className="text-sm text-gray-600">Temperature, AQI, PM2.5</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatAge(freshness?.by_type?.environment?.age_minutes)}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border ${freshnessClass(freshness?.by_type?.traffic?.status)}`}>
                    <div className="flex items-center">
                      <span className="w-6 h-6 mr-3 flex items-center justify-center">
                        {freshnessIcon(freshness?.by_type?.traffic?.status)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Traffic Data</p>
                        <p className="text-sm text-gray-600">Zone congestion</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatAge(freshness?.by_type?.traffic?.age_minutes)}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border ${freshnessClass(freshness?.by_type?.services?.status)}`}>
                    <div className="flex items-center">
                      <span className="w-6 h-6 mr-3 flex items-center justify-center">
                        {freshnessIcon(freshness?.by_type?.services?.status)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Service Status</p>
                        <p className="text-sm text-gray-600">Water, Power, Waste</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatAge(freshness?.by_type?.services?.age_minutes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
                  <button
                    onClick={loadAuditLogs}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No audit logs available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.map((log) => (
                          <tr key={log.log_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {log.performed_by}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
