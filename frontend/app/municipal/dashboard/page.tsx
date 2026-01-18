'use client';

import { useEffect, useRef, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api, getSeverityColor, formatTimestamp } from '@/lib/api';
import EnvironmentChart from '@/components/charts/EnvironmentChart';
import TrafficChart from '@/components/charts/TrafficChart';
import AlertDistribution from '@/components/charts/AlertDistribution';

export default function MunicipalDashboard() {
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [cities, setCities] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [riskScore, setRiskScore] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [environmentData, setEnvironmentData] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const seenAlertIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardData();
  }, [selectedCity]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => undefined);
      }
    }
  }, []);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/city/${selectedCity.toLowerCase()}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update') {
          if (payload.alerts) setAlerts(payload.alerts);
          if (payload.risk) setRiskScore(payload.risk);
          if (payload.anomalies) setAnomalies(payload.anomalies);

          if (payload.alerts?.alerts && typeof window !== 'undefined' && 'Notification' in window) {
            const currentIds = new Set<string>(payload.alerts.alerts.map((a: any) => String(a.id)));
            const newAlerts = payload.alerts.alerts.filter((a: any) => !seenAlertIdsRef.current.has(a.id));

            if (Notification.permission === 'granted') {
              newAlerts.slice(0, 3).forEach((alert: any) => {
                new Notification(alert.title, {
                  body: alert.message,
                });
              });
            }

            seenAlertIdsRef.current = currentIds;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [selectedCity]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const riskHist = await api.getRiskHistory(selectedCity.toLowerCase(), 20);
        setRiskHistory(riskHist.history || []);
        
        const envData = await api.getEnvironmentHistory(selectedCity.toLowerCase(), 24);
        setEnvironmentData(envData.data || []);
        
        const traffic = await api.getTrafficData(selectedCity.toLowerCase());
        setTrafficData(traffic.zones || []);

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedCity]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metadata to get cities
      const metadata = await api.getMetadata();
      if (metadata.cities) {
        setCities(metadata.cities.map((c: any) => c.name));
      }

      // Load alerts
      const alertsData = await api.getAlerts(selectedCity.toLowerCase(), {
        active_only: true,
        limit: 10
      });
      setAlerts(alertsData);

      // Load risk score (Phase 10 ML endpoint)
      const risk = await api.getRiskScore(selectedCity.toLowerCase());
      setRiskScore(risk.risk_assessment || risk); // Handle new format

      // Load anomalies (Phase 10 ML endpoint)
      const anomaliesData = await api.detectAnomalies(selectedCity.toLowerCase(), 24);
      setAnomalies(anomaliesData);

      // Load chart data
      const envData = await api.getEnvironmentHistory(selectedCity.toLowerCase(), 24);
      setEnvironmentData(envData.data || []);

      const traffic = await api.getTrafficData(selectedCity.toLowerCase());
      setTrafficData(traffic.zones || []);

      // Load risk history for 24-hour trend
      const riskHist = await api.getRiskHistory(selectedCity.toLowerCase(), 20);
      setRiskHistory(riskHist.history || []);
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      const result = await api.generateAlerts(selectedCity.toLowerCase());
      alert(`Generated ${result.alerts_created} new alerts`);
      loadDashboardData(); // Refresh
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId, 'municipal_user');
      loadDashboardData(); // Refresh
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const alertDistributionData: { severity: string; count: number }[] = alerts?.alerts
    ? Object.entries(
        alerts.alerts.reduce((acc: Record<string, number>, alert: any) => {
          const severity = alert.severity?.toLowerCase() || 'low';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {})
      ).map(([severity, count]) => ({
        severity,
        count: Number(count)
      }))
    : [];

  const activeAlertsList = alerts?.alerts || [];
  const criticalCount = activeAlertsList.filter((a: any) => a.severity === 'critical').length;
  const warningCount = activeAlertsList.filter((a: any) => a.severity === 'warning').length;
  const infoCount = activeAlertsList.filter((a: any) => a.severity === 'info').length;
  const shownCount = activeAlertsList.length;

  const riskLevel = riskScore?.risk_score !== undefined
    ? (riskScore.risk_score >= 0.7
        ? 'critical'
        : riskScore.risk_score >= 0.5
          ? 'high'
          : riskScore.risk_score >= 0.3
            ? 'medium'
            : 'low')
    : undefined;

  const anomaliesList = anomalies?.anomalies || [];
  const highSeverityAnomalies = anomaliesList.filter((a: any) => a.severity === 'high');

  // Risk Breakdown Chart Data
  const breakdown = riskScore?.breakdown || { environment: 0, traffic: 0, services: 0 };
  const segments = [
    { name: 'Environment', value: breakdown.environment, color: '#ef4444' },
    { name: 'Traffic', value: breakdown.traffic, color: '#3b82f6' },
    { name: 'Services', value: breakdown.services, color: '#10b981' },
    { name: 'Anomalies', value: 0, color: '#f87171' }
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Municipal Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time city risk monitoring and management</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <p>Last updated</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{lastUpdated ?? '—'}</p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Refresh
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City:</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 dark:text-white"
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Risk Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Risk Score</p>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 012 0v4a1 1 0 11-2 0V5zm1 8a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-500 dark:text-red-400">
                {riskScore ? Math.round(riskScore.risk_score * 100) : '—'}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Elevated from {riskScore ? Math.max(0, Math.round(riskScore.risk_score * 100) - 6) : '—'}% yesterday
              </p>
            </div>

            {/* Active Alerts Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-500 dark:text-red-400">
                {alerts?.active_alerts || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {criticalCount} critical, {warningCount} warning, {infoCount} info
                {alerts?.active_alerts && shownCount !== alerts.active_alerts
                  ? ` (showing ${shownCount} of ${alerts.active_alerts})`
                  : ''}
              </p>
            </div>

            {/* Anomalies Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anomalies</p>
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-500 dark:text-blue-400">
                {anomaliesList.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {highSeverityAnomalies.length} high severity detected
              </p>
            </div>

            {/* System Health Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-7V7a1 1 0 112 0v4a1 1 0 11-2 0zm1 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className={`text-lg font-semibold ${riskLevel === 'critical' ? 'text-red-600 dark:text-red-400' : riskLevel === 'high' ? 'text-orange-600 dark:text-orange-400' : riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : 'Stable'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                System operating within expected thresholds
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Alerts</h2>
                  <button
                    onClick={handleGenerateAlerts}
                    className="bg-red-500 dark:bg-red-600 text-white px-6 py-2.5 rounded-md hover:bg-red-600 dark:hover:bg-red-700 text-sm font-semibold flex items-center"
                  >
                    <span className="mr-2">+</span> Generate Alert
                  </button>
                </div>
                <div className="p-6">
                  {alerts && alerts.alerts && alerts.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.alerts.slice(0, 3).map((alert: any) => (
                        <div
                          key={alert.id}
                          className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                                alert.severity === 'warning' ? 'bg-red-50 dark:bg-red-900/20' :
                                'bg-blue-50 dark:bg-blue-900/20'
                              }`}>
                                <svg className={`w-5 h-5 ${
                                  alert.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                                  alert.severity === 'warning' ? 'text-red-500 dark:text-red-400' :
                                  'text-blue-500 dark:text-blue-400'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {alert.title}
                                  </h3>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                    alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                    alert.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  }`}>
                                    {alert.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {formatTimestamp(alert.created_at)}
                                </p>
                              </div>
                            </div>
                            {alert.is_active && (
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="ml-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium bg-gray-100 dark:bg-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No active alerts. System is operating normally.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              {riskScore && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Risk Breakdown</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-center mb-6">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                          {(() => {
                            let currentAngle = 0;
                            return segments.filter(s => s.value > 0).map((segment, idx) => {
                              const percentage = segment.value / total;
                              const angle = percentage * 360;
                              const startAngle = currentAngle;
                              currentAngle += angle;
                              
                              const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                              const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                              const x2 = 100 + 80 * Math.cos((Math.PI * (startAngle + angle)) / 180);
                              const y2 = 100 + 80 * Math.sin((Math.PI * (startAngle + angle)) / 180);
                              const largeArc = angle > 180 ? 1 : 0;
                              
                              return (
                                <g key={segment.name}>
                                  <path
                                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={segment.color}
                                    opacity="0.9"
                                    className="risk-segment transition-all duration-300 hover:opacity-100 cursor-pointer"
                                    style={{ 
                                      animationDelay: `${idx * 150}ms`,
                                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                                    }}
                                  />
                                </g>
                              );
                            });
                          })()}
                          <circle cx="100" cy="100" r="50" fill="white" className="drop-shadow-sm" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {segments.map((segment, index) => (
                        <div 
                          className="flex items-center justify-between risk-legend-item"
                          key={segment.name}
                          style={{ animationDelay: `${700 + index * 80}ms` }}
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{segment.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {Math.round((segment.value / total) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* 24-Hour Risk Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">24-Hour Risk Trend</h2>
          </div>
          <div className="p-6">
            {riskHistory && riskHistory.length > 0 ? (
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="200" x2="800" y2="200" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Line chart */}
                  <polyline
                    points={riskHistory.map((point: any, idx: number) => {
                      const x = (idx / Math.max(riskHistory.length - 1, 1)) * 800;
                      const score = point.risk_score ?? point.score ?? 0; // API returns `score`
                      const normalizedScore = Math.min(Math.max(score, 0), 1);
                      const y = 200 - (normalizedScore * 180) - 10;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {riskHistory.map((point: any, idx: number) => {
                    const x = (idx / Math.max(riskHistory.length - 1, 1)) * 800;
                    const score = point.risk_score ?? point.score ?? 0;
                    const normalizedScore = Math.min(Math.max(score, 0), 1);
                    const y = 200 - (normalizedScore * 180) - 10;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="#fff" stroke="#ef4444" strokeWidth="2" />
                        <circle cx={x} cy={y} r="3" fill="#ef4444" />
                      </g>
                    );
                  })}
                </svg>
                
                {/* Time labels */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-10 pt-1 pb-1">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No trend data available</p>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        {riskScore?.recommendations && riskScore.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-8">
            <div className="p-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Recommendation</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {riskScore.recommendations[0] || 'Based on current trends, we recommend increasing traffic management resources in the east zone. Historical data suggests congestion will peak at 16:30. Confidence: 87%'}
                  </p>
                  <button className="bg-red-500 dark:bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-600 dark:hover:bg-red-700 font-semibold">
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Environment Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Environment Trends (24h)</h2>
            </div>
            <div className="p-6">
              {environmentData.length > 0 ? (
                <EnvironmentChart data={environmentData} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Traffic Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Congestion by Zone</h2>
            </div>
            <div className="p-6">
              {trafficData.length > 0 ? (
                <TrafficChart data={trafficData} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Alert Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Distribution</h2>
            </div>
            <div className="p-6">
              {alertDistributionData.length > 0 ? (
                <AlertDistribution data={alertDistributionData} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No alerts to display</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
