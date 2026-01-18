'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

interface AdminRecommendation {
  severity: string;
  action: string;
  reason: string;
  impact: string;
}

interface AdminRecommendationsResponse {
  success?: boolean;
  scenario_type: string;
  city?: string;
  city_name?: string;
  recommendations: AdminRecommendation[];
  data_sources?: string[];
  analysis_period_hours?: number;
  analysis_summary?: {
    traffic_zones_analyzed?: number;
    environment_records?: number;
    active_alerts?: number;
    risk_level?: string;
  };
  confidence?: number;
  generated_at?: string;
  response_time_ms?: number;
  model?: string;
}

export default function ScenarioPage() {
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [temperatureChange, setTemperatureChange] = useState(0);
  const [aqiChange, setAqiChange] = useState(0);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [serviceDegradation, setServiceDegradation] = useState(0);
  const [scenarioInput, setScenarioInput] = useState({
    zone: 'A',
    timeWindow: '08:00-11:00',
    trafficDensityChange: 0,
    heavyVehicleRestriction: false,
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<AdminRecommendationsResponse | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');

  const cities = ['Ahmedabad', 'Gandhinagar', 'Vadodara'];

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setSimulationResult(null);

    try {
      const enrichedInput = {
        ...scenarioInput,
        trafficDensityChange: (trafficMultiplier - 1.0) * 100,
        trafficMultiplier,
        temperatureChange,
        aqiChange,
        serviceDegradation,
      };
      const result = await api.simulateScenario(selectedCity.toLowerCase(), enrichedInput);
      setSimulationResult(result);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setTemperatureChange(0);
    setAqiChange(0);
    setTrafficMultiplier(1.0);
    setServiceDegradation(0);
    setScenarioInput({
      zone: 'A',
      timeWindow: '08:00-11:00',
      trafficDensityChange: 0,
      heavyVehicleRestriction: false,
    });
    setSimulationResult(null);
    setError('');
  };

  const fetchAIRecommendations = async (scenarioType: string) => {
    setLoadingRecommendations(true);
    setRecommendationError('');
    setAiRecommendations(null);

    try {
      // Map city name to city ID
      const cityIdMap: { [key: string]: string } = {
        'Ahmedabad': 'e61c1dc6-3e80-4eef-ab0f-f625207ca41f',
        'Gandhinagar': 'gandhinagar-city-id',
        'Vadodara': 'vadodara-city-id',
      };
      const cityId = cityIdMap[selectedCity] || cityIdMap['Ahmedabad'];
      
      const result = await api.getAdminRecommendations(scenarioType, cityId);
      setAiRecommendations(result);
    } catch (err: any) {
      setRecommendationError(err.message || 'Failed to fetch AI recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scenario Builder</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Simulate "what-if" scenarios to predict system behavior and prepare response plans
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Scenario Parameters
              </h2>

              {/* City Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature Change */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Temperature Change: {temperatureChange > 0 ? '+' : ''}{temperatureChange}°C
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={temperatureChange}
                  onChange={(e) => setTemperatureChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>-10°C</span>
                  <span>0°C</span>
                  <span>+10°C</span>
                </div>
              </div>

              {/* AQI Change */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  AQI Change: {aqiChange > 0 ? '+' : ''}{aqiChange}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="10"
                  value={aqiChange}
                  onChange={(e) => setAqiChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
              </div>

              {/* Traffic Multiplier */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Traffic Multiplier: {trafficMultiplier.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={trafficMultiplier}
                  onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0.5x (Less)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Heavy)</span>
                </div>
              </div>

              {/* Service Degradation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Service Degradation: {serviceDegradation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={serviceDegradation}
                  onChange={(e) => setServiceDegradation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Removed checkbox - keeping for potential backend compatibility */}
              <input
                type="hidden"
                checked={scenarioInput.heavyVehicleRestriction}
                onChange={(e) => setScenarioInput({...scenarioInput, heavyVehicleRestriction: e.target.checked})}
              />
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSimulate}
                  disabled={loading}
                  className="w-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Simulating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Run Simulation
                    </>
                  )}
                </button>
                <button
                  onClick={resetScenario}
                  className="w-full py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Simulation Results
              </h2>

              {!simulationResult ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg font-medium">No simulation run yet</p>
                  <p className="text-sm mt-1">Configure parameters and click "Run Simulation"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overall Confidence */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500 dark:border-orange-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Simulation Confidence</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {(simulationResult.overall_confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Based on {simulationResult.impacts?.length || 0} impact factors
                    </p>
                  </div>

                  {/* Recommendation */}
                  {simulationResult.recommendation && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 dark:border-blue-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendation</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">{simulationResult.recommendation}</p>
                    </div>
                  )}

                  {/* Impact Details */}
                  {simulationResult.impacts && simulationResult.impacts.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Impact Analysis</h3>
                      <div className="space-y-3">
                        {simulationResult.impacts.map((impact: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{impact.metric}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                impact.direction === 'decrease' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {impact.direction === 'decrease' ? '↓' : '↑'} {Math.abs(impact.change_percent)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                              <span className="font-medium">Baseline:</span> {impact.baseline} → 
                              <span className="font-medium ml-1">Predicted:</span> {impact.predicted}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span className="font-medium">Confidence:</span> {(impact.confidence * 100).toFixed(0)}%
                            </div>
                            {impact.explanation && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                {impact.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {simulationResult.explanation && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Detailed Explanation</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{simulationResult.explanation}</p>
                    </div>
                  )}

                  {/* Scenario ID */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Scenario ID: <span className="font-mono">{simulationResult.scenario_id}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Simulated at: {simulationResult.simulated_at ? new Date(simulationResult.simulated_at).toLocaleString() : 'Invalid Date'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Get AI-powered recommendations based on current city conditions and historical patterns.
            </p>

            {/* Scenario Type Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => fetchAIRecommendations('traffic')}
                disabled={loadingRecommendations}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Traffic
              </button>
              <button
                onClick={() => fetchAIRecommendations('pollution')}
                disabled={loadingRecommendations}
                className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Pollution
              </button>
              <button
                onClick={() => fetchAIRecommendations('emergency')}
                disabled={loadingRecommendations}
                className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency
              </button>
              <button
                onClick={() => fetchAIRecommendations('general')}
                disabled={loadingRecommendations}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                General
              </button>
            </div>

            {/* Loading State */}
            {loadingRecommendations && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 dark:border-gray-700 dark:border-t-purple-400"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing city data...</span>
              </div>
            )}

            {/* Error State */}
            {recommendationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{recommendationError}</span>
                </div>
              </div>
            )}

            {/* Recommendations Display */}
            {aiRecommendations && !loadingRecommendations && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                        {aiRecommendations.scenario_type.charAt(0).toUpperCase() + aiRecommendations.scenario_type.slice(1)} Analysis for {aiRecommendations.city_name || aiRecommendations.city || selectedCity}
                      </h3>
                      <div className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                        {aiRecommendations.analysis_period_hours && (
                          <p>Analysis Period: {aiRecommendations.analysis_period_hours} hours</p>
                        )}
                        {aiRecommendations.data_sources && aiRecommendations.data_sources.length > 0 && (
                          <p>Data Sources: {aiRecommendations.data_sources.join(', ')}</p>
                        )}
                        {aiRecommendations.confidence !== undefined && (
                          <p>Confidence: {(aiRecommendations.confidence * 100).toFixed(0)}%</p>
                        )}
                      </div>
                    </div>
                    {aiRecommendations.generated_at && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {new Date(aiRecommendations.generated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommendations List */}
                {aiRecommendations.recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No specific recommendations at this time. City conditions are within normal parameters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiRecommendations.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityBadgeColor(rec.severity)}`}>
                              {rec.severity.toUpperCase()}
                            </span>
                            <span className="ml-3 font-semibold text-gray-900 dark:text-white">
                              Recommendation {index + 1}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</h4>
                            <p className="text-sm text-gray-900 dark:text-white">{rec.action}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rec.reason}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Impact</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rec.impact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How Scenario Simulation Works</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  The scenario engine applies your parameter changes to current city conditions and runs predictive models 
                  to forecast system behavior. It considers environmental factors, traffic patterns, service capacity, and 
                  historical trends to generate risk scores and actionable recommendations. Use this tool to prepare contingency 
                  plans and test response strategies before real-world events occur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
