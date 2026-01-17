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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        {/* City Selector */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Municipal Dashboard</h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">City:</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Risk Score Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Risk</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {riskScore ? (riskScore.risk_score * 100).toFixed(1) : '—'}
                </p>
                <p className={`text-sm font-semibold mt-1 ${
                  riskLevel === 'critical' ? 'text-red-600' :
                  riskLevel === 'high' ? 'text-orange-600' :
                  riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {riskLevel ? riskLevel.toUpperCase() : 'UNKNOWN'}
                </p>
                {riskScore?.confidence_score && (
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: {(riskScore.confidence_score * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          {/* Active Alerts Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {alerts?.active_alerts || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {alerts?.total_alerts || 0} total
                </p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>

          {/* Anomalies Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Anomalies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {anomaliesList.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {highSeverityAnomalies.length} high severity
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
            <button
              onClick={handleGenerateAlerts}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Generate New Alerts
            </button>
          </div>
          <div className="p-6">
            {alerts && alerts.alerts && alerts.alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {alert.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {alert.audience}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-2">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">
                          {alert.message}
                        </p>
                        {alert.metadata?.source === 'ml' && (
                          <p className="text-xs text-blue-600 mt-1">
                            ML Alert • Confidence: {(alert.metadata.confidence_score * 100).toFixed(0)}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(alert.created_at)}
                        </p>
                      </div>
                      {alert.is_active && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
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

        {/* Risk Breakdown */}
        {riskScore && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Risk Breakdown</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {riskScore?.breakdown?.environment !== undefined
                      ? (riskScore.breakdown.environment * 100).toFixed(0)
                      : '—'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 40%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Traffic</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {riskScore?.breakdown?.traffic !== undefined
                      ? (riskScore.breakdown.traffic * 100).toFixed(0)
                      : '—'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 35%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Services</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {riskScore?.breakdown?.services !== undefined
                      ? (riskScore.breakdown.services * 100).toFixed(0)
                      : '—'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 25%</p>
                </div>
              </div>

              {riskScore.recommendations && riskScore.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {riskScore.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-600 mr-2">→</span>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
