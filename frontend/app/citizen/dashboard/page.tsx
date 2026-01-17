'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import { authUtils } from '@/lib/auth';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  city: string;
  timestamp: string;
  status: string;
  category?: string;
  recommendation?: string;
}

interface CityHealth {
  city: string;
  health: string;
  risk_score: number;
}

export default function CitizenDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cityHealth, setCityHealth] = useState<CityHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = authUtils.getUserInfo();
    if (userInfo && userInfo.email) {
      setIsLoggedIn(true);
    }

    loadDashboardData();

    // Set up WebSocket for real-time alert updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.hostname}:8001/ws/alerts`);

    ws.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts((prev) => [newAlert, ...prev]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch public alerts
      const alertsData = await api.getPublicAlerts();
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.alerts || []);

      // Fetch health data (if available publicly)
      try {
        const healthData = await api.getHealth();
        if (healthData && healthData.length > 0) {
          setCityHealth(healthData[0]);
        }
      } catch (err) {
        console.log('Health data not available');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Citizen Portal</h1>
            <p className="text-gray-600 mt-2">Stay informed about your city's health and safety</p>
          </div>

          {/* City Snapshot - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">Safe</p>
            </div>

            {/* Air Quality Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Air Quality</span>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">47</p>
              <p className="text-sm text-green-600 font-medium">Good</p>
            </div>

            {/* Temperature Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Temperature</span>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">28°C</p>
              <p className="text-sm text-blue-600 font-medium">Moderate</p>
            </div>

            {/* Active Alerts Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Active Alerts</span>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{alerts.length}</p>
              <button className="text-sm text-red-600 font-medium hover:underline">View all →</button>
            </div>
          </div>

          {/* AI City Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">AI City Summary</h2>
                <p className="text-gray-700 mb-4">
                  Your city is experiencing moderate conditions today. Air quality is within acceptable ranges, 
                  and temperature levels are comfortable. We're monitoring {alerts.length} active alerts that require attention. 
                  Overall, the city's health indicators show stable performance with no critical issues detected at this time.
                </p>
                <div className="bg-pink-50 border-l-4 border-pink-400 p-4 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-pink-900">AI Insight</p>
                      <p className="text-sm text-pink-800 mt-1">
                        Based on historical patterns, conditions are expected to remain stable throughout the day. 
                        The predictive model shows 92% confidence in maintaining current safety levels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No active alerts</p>
                <p className="text-sm">Everything is running smoothly in your city</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          alert.severity === 'high' ? 'bg-pink-100' : 'bg-blue-100'
                        }`}>
                          <svg className={`w-5 h-5 ${alert.severity === 'high' ? 'text-pink-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              alert.severity === 'high' 
                                ? 'bg-pink-100 text-pink-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity === 'high' ? 'Warning' : 'Info'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public Advisory Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Public Advisory</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Heat Advisory */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Heat Advisory</h3>
                    <p className="text-sm text-blue-800">Temperatures may reach 35°C. Stay hydrated and avoid outdoor activities during peak hours.</p>
                  </div>
                </div>
              </div>

              {/* Air Quality Notice */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Air Quality Notice</h3>
                    <p className="text-sm text-yellow-800">Air quality is moderate. Sensitive groups should consider reducing prolonged outdoor activities.</p>
                  </div>
                </div>
              </div>

              {/* Traffic Status */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Traffic Status</h3>
                    <p className="text-sm text-green-800">Traffic flow is normal across the city. No major congestion reported at this time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Citizen Actions</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Report Issue</h3>
                <p className="text-sm text-gray-600">Submit a concern or problem</p>
              </button>

              <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">View City Data</h3>
                <p className="text-sm text-gray-600">Access public city metrics</p>
              </button>

              <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Subscribe Alerts</h3>
                <p className="text-sm text-gray-600">Get notifications for your area</p>
              </button>

              <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Learn More</h3>
                <p className="text-sm text-gray-600">About our AI system</p>
              </button>
            </div>
          </div>

          {/* Trust & Transparency */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trust & Transparency</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-900 mb-2">Data Freshness</h3>
                    <p className="text-sm text-pink-800 mb-3">
                      All city data is updated every 5 minutes from real-time sensors and monitoring systems.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-pink-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Last updated: 2 minutes ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">AI Transparency</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Our AI models are regularly audited and validated for accuracy and fairness.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Model accuracy: 92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Access - Only for Logged In Users */}
          {isLoggedIn && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🎯 Scenario Simulator</h2>
                  <p className="text-blue-100 mb-4">
                    Test "what-if" scenarios and predict system behavior with our advanced simulation tools
                  </p>
                  <a
                    href="/citizen/simulator"
                    className="inline-block bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-50 transition"
                  >
                    Launch Simulator →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Signup CTA for Non-Logged In Users */}
          {!isLoggedIn && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-8 text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Want to Access the Scenario Simulator?</h2>
                <p className="text-red-100 mb-6">
                  Sign up now to access advanced simulation tools and personalized features
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="/signup"
                    className="bg-white text-red-600 px-8 py-3 rounded-md font-semibold hover:bg-red-50 transition"
                  >
                    Create Free Account
                  </a>
                  <a
                    href="/login"
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white hover:text-red-600 transition"
                  >
                    Sign In
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
