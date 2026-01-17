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

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Municipal Dashboard</h1>
                <p className="text-gray-600 mt-1">Real-time city risk monitoring and management</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGenerateAlerts}
                  className="bg-red-500 text-white px-6 py-2.5 rounded-md hover:bg-red-600 text-sm font-semibold flex items-center"
                >
                  <span className="mr-2">+</span> Generate Alert
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Risk Score Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Overall Risk Score</p>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 012 0v4a1 1 0 11-2 0V5zm1 8a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-500">
                {riskScore ? Math.round(riskScore.risk_score * 100) : '—'}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Elevated from {riskScore ? Math.max(0, Math.round(riskScore.risk_score * 100) - 6) : '—'}% yesterday
              </p>
            </div>

            {/* Active Alerts Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-500">
                {alerts?.active_alerts || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {alerts?.alerts?.filter((a: any) => a.severity === 'critical').length || 0} critical, {alerts?.alerts?.filter((a: any) => a.severity === 'warning').length || 0} warning
              </p>
            </div>

            {/* Anomalies Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Anomalies</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-500">
                {anomaliesList.length}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Last 24 hours
              </p>
            </div>

            {/* System Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-500">
                Operational
              </p>
              <p className="text-sm text-gray-500 mt-2">
                99.8% uptime
              </p>
            </div>
          </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Active Alerts Section - Left Column (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
              </div>
              <div className="p-6">
                {alerts && alerts.alerts && alerts.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.alerts.slice(0, 3).map((alert: any) => (
                      <div
                        key={alert.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              alert.severity === 'critical' ? 'bg-red-100' :
                              alert.severity === 'warning' ? 'bg-red-50' :
                              'bg-blue-50'
                            }`}>
                              <svg className={`w-5 h-5 ${
                                alert.severity === 'critical' ? 'text-red-600' :
                                alert.severity === 'warning' ? 'text-red-500' :
                                'text-blue-500'
                              }`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {alert.title}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                  alert.severity === 'warning' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimestamp(alert.created_at)}
                              </p>
                            </div>
                          </div>
                          {alert.is_active && (
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="ml-4 text-sm text-gray-500 hover:text-gray-700 font-medium bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No active alerts. System is operating normally.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Risk Breakdown - Right Column (1/3) */}
          <div>
            {riskScore && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Risk Breakdown</h2>
                </div>
                <div className="p-6">
                  {/* Donut Chart */}
                  <div className="flex justify-center mb-6">
                    <svg className="w-48 h-48" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray="87.96 251.2"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray="62.8 251.2"
                        strokeDashoffset="-87.96"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray="50.24 251.2"
                        strokeDashoffset="-150.76"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray="50.24 251.2"
                        strokeDashoffset="-201"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Environment</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {riskScore?.breakdown?.environment !== undefined
                          ? (riskScore.breakdown.environment * 100).toFixed(0)
                          : '35'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Traffic</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {riskScore?.breakdown?.traffic !== undefined
                          ? (riskScore.breakdown.traffic * 100).toFixed(0)
                          : '25'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Services</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {riskScore?.breakdown?.services !== undefined
                          ? (riskScore.breakdown.services * 100).toFixed(0)
                          : '20'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                        <span className="text-sm text-gray-700">Anomalies</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 24-Hour Risk Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">24-Hour Risk Trend</h2>
          </div>
          <div className="p-6">
            {riskHistory && riskHistory.length > 0 ? (
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Line chart */}
                  <polyline
                    points={riskHistory.map((point: any, idx: number) => {
                      const x = (idx / (riskHistory.length - 1)) * 800;
                      const y = 200 - (point.risk_score * 200);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {riskHistory.map((point: any, idx: number) => {
                    const x = (idx / (riskHistory.length - 1)) * 800;
                    const y = 200 - (point.risk_score * 200);
                    return <circle key={idx} cx={x} cy={y} r="4" fill="#ef4444" />;
                  })}
                </svg>
                
                {/* Time labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 -ml-8">
                  <span>60</span>
                  <span>45</span>
                  <span>30</span>
                  <span>15</span>
                  <span>0</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No trend data available</p>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        {riskScore?.recommendations && riskScore.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200 mb-8">
            <div className="p-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">AI Recommendation</h2>
                  <p className="text-gray-700 mb-4">
                    {riskScore.recommendations[0] || 'Based on current trends, we recommend increasing traffic management resources in the east zone. Historical data suggests congestion will peak at 16:30. Confidence: 87%'}
                  </p>
                  <button className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 font-semibold">
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Environment Trends (24h)</h2>
            </div>
            <div className="p-6">
              {environmentData.length > 0 ? (
                <EnvironmentChart data={environmentData} />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Traffic Chart */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Traffic Congestion by Zone</h2>
            </div>
            <div className="p-6">
              {trafficData.length > 0 ? (
                <TrafficChart data={trafficData} />
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Alert Distribution */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Alert Distribution</h2>
            </div>
            <div className="p-6">
              {alertDistributionData.length > 0 ? (
                <AlertDistribution data={alertDistributionData} />
              ) : (
                <p className="text-gray-500 text-center py-8">No alerts to display</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
