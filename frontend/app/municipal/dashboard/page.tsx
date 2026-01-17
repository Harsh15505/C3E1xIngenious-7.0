'use client';

import { useEffect, useState } from 'react';
import { api, getSeverityColor, formatTimestamp } from '@/lib/api';

export default function MunicipalDashboard() {
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [cities, setCities] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [riskScore, setRiskScore] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
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

      // Load risk score
      const risk = await api.getRiskScore(selectedCity.toLowerCase());
      setRiskScore(risk);

      // Load anomalies
      const anomaliesData = await api.detectAnomalies(selectedCity.toLowerCase());
      setAnomalies(anomaliesData);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Urban Intelligence Platform
              </h1>
              <p className="text-sm text-gray-500 mt-1">Municipal Dashboard</p>
            </div>
            
            {/* City Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {riskScore ? (riskScore.overall_score * 100).toFixed(1) : '—'}
                </p>
                <p className={`text-sm font-semibold mt-1 ${
                  riskScore?.overall_level === 'HIGH' ? 'text-red-600' :
                  riskScore?.overall_level === 'MEDIUM' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {riskScore?.overall_level || '—'}
                </p>
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
                  {anomalies?.total_anomalies || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {anomalies?.high_severity || 0} high severity
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(riskScore.environment_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 35%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Traffic</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(riskScore.traffic_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 25%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Services</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(riskScore.services_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 25%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Anomalies</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(riskScore.anomaly_risk * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Weight: 15%</p>
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
      </div>
    </div>
  );
}
