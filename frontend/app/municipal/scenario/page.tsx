'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

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

  const cities = ['Ahmedabad', 'Gandhinagar', 'Vadodara'];

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setSimulationResult(null);

    try {
      const enrichedInput = {
        ...scenarioInput,
        trafficDensityChange: (trafficMultiplier - 1.0) * 100,
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

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Scenario Builder</h1>
            <p className="text-gray-600 mt-1">
              Simulate "what-if" scenarios to predict system behavior and prepare response plans
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Scenario Parameters
              </h2>

              {/* City Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
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
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Temperature Change: {temperatureChange > 0 ? '+' : ''}{temperatureChange}°C
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={temperatureChange}
                  onChange={(e) => setTemperatureChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>-10°C</span>
                  <span>0°C</span>
                  <span>+10°C</span>
                </div>
              </div>

              {/* AQI Change */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  AQI Change: {aqiChange > 0 ? '+' : ''}{aqiChange}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="10"
                  value={aqiChange}
                  onChange={(e) => setAqiChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
              </div>

              {/* Traffic Multiplier */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Traffic Multiplier: {trafficMultiplier.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={trafficMultiplier}
                  onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0.5x (Less)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Heavy)</span>
                </div>
              </div>

              {/* Service Degradation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Service Degradation: {serviceDegradation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={serviceDegradation}
                  onChange={(e) => setServiceDegradation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: '#ef4444'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
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
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="w-full py-3 px-6 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600 mb-1">Simulation Confidence</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {(simulationResult.overall_confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {simulationResult.impacts?.length || 0} impact factors
                    </p>
                  </div>

                  {/* Recommendation */}
                  {simulationResult.recommendation && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendation</p>
                      <p className="text-sm text-gray-800">{simulationResult.recommendation}</p>
                    </div>
                  )}

                  {/* Impact Details */}
                  {simulationResult.impacts && simulationResult.impacts.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Impact Analysis</h3>
                      <div className="space-y-3">
                        {simulationResult.impacts.map((impact: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900">{impact.metric}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                impact.direction === 'decrease' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {impact.direction === 'decrease' ? '↓' : '↑'} {Math.abs(impact.change_percent)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Baseline:</span> {impact.baseline} → 
                              <span className="font-medium ml-1">Predicted:</span> {impact.predicted}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              <span className="font-medium">Confidence:</span> {(impact.confidence * 100).toFixed(0)}%
                            </div>
                            {impact.explanation && (
                              <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-300">
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
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Detailed Explanation</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{simulationResult.explanation}</p>
                    </div>
                  )}

                  {/* Scenario ID */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Scenario ID: <span className="font-mono">{simulationResult.scenario_id}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Simulated at: {simulationResult.simulated_at ? new Date(simulationResult.simulated_at).toLocaleString() : 'Invalid Date'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">How Scenario Simulation Works</h3>
                <p className="text-sm text-blue-800">
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
