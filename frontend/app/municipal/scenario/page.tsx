'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';

export default function ScenarioPage() {
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [scenarioInput, setScenarioInput] = useState({
    temperature_change: 0,
    aqi_change: 0,
    traffic_multiplier: 1.0,
    service_degradation: 0,
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
      const result = await api.simulateScenario(selectedCity.toLowerCase(), scenarioInput);
      setSimulationResult(result);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setScenarioInput({
      temperature_change: 0,
      aqi_change: 0,
      traffic_multiplier: 1.0,
      service_degradation: 0,
    });
    setSimulationResult(null);
    setError('');
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Scenario Builder</h1>
            <p className="text-gray-600 mt-2">
              Simulate "what-if" scenarios to predict system behavior and prepare response plans
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Scenario Parameters
              </h2>

              {/* City Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature Change: {scenarioInput.temperature_change > 0 ? '+' : ''}{scenarioInput.temperature_change}°C
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={scenarioInput.temperature_change}
                  onChange={(e) => setScenarioInput({...scenarioInput, temperature_change: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-10°C</span>
                  <span>0°C</span>
                  <span>+10°C</span>
                </div>
              </div>

              {/* AQI Change */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AQI Change: {scenarioInput.aqi_change > 0 ? '+' : ''}{scenarioInput.aqi_change}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={scenarioInput.aqi_change}
                  onChange={(e) => setScenarioInput({...scenarioInput, aqi_change: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
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
                  Traffic Multiplier: {scenarioInput.traffic_multiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={scenarioInput.traffic_multiplier}
                  onChange={(e) => setScenarioInput({...scenarioInput, traffic_multiplier: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x (Less)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Heavy)</span>
                </div>
              </div>

              {/* Service Degradation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Degradation: {scenarioInput.service_degradation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={scenarioInput.service_degradation}
                  onChange={(e) => setScenarioInput({...scenarioInput, service_degradation: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSimulate}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Simulating...
                    </span>
                  ) : (
                    'Run Simulation'
                  )}
                </button>
                <button
                  onClick={resetScenario}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
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
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                  {/* Predicted Risk Score */}
                  <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600 mb-1">Predicted Risk Score</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {(simulationResult.predicted_risk_score * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {(simulationResult.current_risk_score * 100).toFixed(1)}% 
                      {simulationResult.predicted_risk_score > simulationResult.current_risk_score ? 
                        <span className="text-red-600 ml-2">↑ Increase</span> : 
                        <span className="text-green-600 ml-2">↓ Decrease</span>
                      }
                    </p>
                  </div>

                  {/* Impact Summary */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Impact Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Environment Impact</span>
                        <span className="text-sm font-medium">{simulationResult.impacts?.environment || 'Moderate'}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Traffic Impact</span>
                        <span className="text-sm font-medium">{simulationResult.impacts?.traffic || 'Moderate'}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Service Impact</span>
                        <span className="text-sm font-medium">{simulationResult.impacts?.services || 'Low'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {simulationResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Scenario ID */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Scenario ID: <span className="font-mono">{simulationResult.scenario_id}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Simulated at: {new Date(simulationResult.timestamp).toLocaleString()}
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
