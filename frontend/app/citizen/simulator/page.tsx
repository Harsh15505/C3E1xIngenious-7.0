'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

interface SimulationHistory {
  id: string;
  timestamp: string;
  city: string;
  parameters: {
    temperature: number;
    aqi: number;
    traffic: number;
    service: number;
  };
  results: any;
}

export default function CitizenSimulator() {
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [temperatureChange, setTemperatureChange] = useState(0);
  const [aqiChange, setAqiChange] = useState(0);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [serviceDegradation, setServiceDegradation] = useState(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const cities = ['Ahmedabad', 'Gandhinagar', 'Vadodara'];

  // Load simulation history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('simulationHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (result: any) => {
    const newEntry: SimulationHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      city: selectedCity,
      parameters: {
        temperature: temperatureChange,
        aqi: aqiChange,
        traffic: trafficMultiplier,
        service: serviceDegradation,
      },
      results: result,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('simulationHistory', JSON.stringify(updatedHistory));
  };

  const loadFromHistory = (entry: SimulationHistory) => {
    setSelectedCity(entry.city);
    setTemperatureChange(entry.parameters.temperature);
    setAqiChange(entry.parameters.aqi);
    setTrafficMultiplier(entry.parameters.traffic);
    setServiceDegradation(entry.parameters.service);
    setSimulationResult(entry.results);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('simulationHistory');
  };

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setSimulationResult(null);

    try {
      const enrichedInput = {
        zone: 'citywide',
        timeWindow: '08:00-20:00',
        trafficDensityChange: (trafficMultiplier - 1) * 100,
        heavyVehicleRestriction: false,
        temperatureChange,
        aqiChange,
        serviceDegradation,
      };

      const result = await api.simulateScenario(selectedCity.toLowerCase(), enrichedInput);
      setSimulationResult(result);
      saveToHistory(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTemperatureChange(0);
    setAqiChange(0);
    setTrafficMultiplier(1.0);
    setServiceDegradation(0);
    setSimulationResult(null);
    setError('');
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scenario Simulator</h1>
              <p className="text-gray-600 mt-2">Test "what-if" scenarios and predict system behavior</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">History ({history.length})</span>
            </button>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Simulation History</h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No simulations run yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{entry.city}</h3>
                        <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Temp:</span>
                          <span className="ml-1 font-medium">{entry.parameters.temperature > 0 ? '+' : ''}{entry.parameters.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-gray-600">AQI:</span>
                          <span className="ml-1 font-medium">{entry.parameters.aqi > 0 ? '+' : ''}{entry.parameters.aqi}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Traffic:</span>
                          <span className="ml-1 font-medium">{entry.parameters.traffic}x</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Service:</span>
                          <span className="ml-1 font-medium">{entry.parameters.service}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Simulation Parameters</h2>

              {/* City Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature Change: <span className="text-red-500 font-semibold">{temperatureChange > 0 ? '+' : ''}{temperatureChange}°C</span>
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={temperatureChange}
                  onChange={(e) => setTemperatureChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-10°C</span>
                  <span>0°C</span>
                  <span>+10°C</span>
                </div>
              </div>

              {/* AQI Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Air Quality Index Change: <span className="text-red-500 font-semibold">{aqiChange > 0 ? '+' : ''}{aqiChange}</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={aqiChange}
                  onChange={(e) => setAqiChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
              </div>

              {/* Traffic Multiplier */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traffic Multiplier: <span className="text-red-500 font-semibold">{trafficMultiplier.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={trafficMultiplier}
                  onChange={(e) => setTrafficMultiplier(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* Service Degradation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Degradation: <span className="text-red-500 font-semibold">{serviceDegradation}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={serviceDegradation}
                  onChange={(e) => setServiceDegradation(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleSimulate}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run Simulation
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Simulation Results</h2>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {!simulationResult && !error && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No simulation run yet</p>
                  <p className="text-sm">Adjust parameters and click "Run Simulation" to see results</p>
                </div>
              )}

              {simulationResult && (
                <div className="space-y-6">
                  {/* Impact Summary */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 border border-red-100">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Impact Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                        <p className="text-2xl font-bold text-red-500">
                          {simulationResult.risk_score?.toFixed(1) || 'N/A'}%
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-600 mb-1">Predicted Alerts</p>
                        <p className="text-2xl font-bold text-orange-500">
                          {simulationResult.predicted_alerts || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Predictions */}
                  {simulationResult.predictions && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Key Predictions</h3>
                      <div className="space-y-2">
                        {Object.entries(simulationResult.predictions).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                      <div className="space-y-2">
                        {simulationResult.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-blue-900">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
