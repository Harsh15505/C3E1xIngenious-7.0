'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import AIChatPanel from '@/components/AIChatPanel';
import { api } from '@/lib/api';
import { authUtils } from '@/lib/auth';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
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

const formatRelativeTime = (timestamp?: string | null) => {
  if (!timestamp) return '—';
  const now = new Date();
  const ts = new Date(timestamp);
  const diffMs = now.getTime() - ts.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const statusFromRisk = (riskScore: number, activeAlerts: Alert[]) => {
  const hasCriticalAlert = activeAlerts.some((a) => a.severity?.toLowerCase() === 'critical' || a.severity?.toLowerCase() === 'high');
  if (riskScore >= 0.6 || hasCriticalAlert) return { label: 'Critical', badge: 'bg-red-100 text-red-700' };
  if (riskScore >= 0.3) return { label: 'Caution', badge: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Stable', badge: 'bg-green-100 text-green-700' };
};

const trafficDescriptor = (avg: number | null) => {
  if (avg === null || Number.isNaN(avg)) return { label: 'Unknown', detail: 'No recent traffic data' };
  if (avg >= 75) return { label: 'Heavy', detail: 'Expect congestion in major corridors' };
  if (avg >= 55) return { label: 'Moderate', detail: 'Typical peak conditions' };
  return { label: 'Light', detail: 'Smooth flow across most zones' };
};

export default function CitizenDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cityHealth, setCityHealth] = useState<CityHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [cities, setCities] = useState<string[]>(['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar']);
  const [citiesWithIds, setCitiesWithIds] = useState<{id: string; name: string}[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [environmentStats, setEnvironmentStats] = useState<{ aqi: number | null; temp: number | null }>({ aqi: null, temp: null });
  const [citySummary, setCitySummary] = useState<{ summary?: string; key_insights?: string[]; confidence?: number; explanation?: string }>({});
  const [trafficSnapshot, setTrafficSnapshot] = useState<{ average: number | null; status: string; detail: string; timestamp?: string }>({ average: null, status: 'Unknown', detail: 'No recent data' });
  const [freshness, setFreshness] = useState<any>(null);

  const targetFor = (path: string) => {
    if (path === '/citizen/alerts') return path; // alerts stay public
    return isLoggedIn ? path : '/login';
  };

  const getAqiCategory = (aqi: number | null) => {
    if (aqi === null || Number.isNaN(aqi)) return { label: '—', className: 'text-gray-500' };
    if (aqi <= 50) return { label: 'Good', className: 'text-green-600' };
    if (aqi <= 100) return { label: 'Moderate', className: 'text-yellow-600' };
    if (aqi <= 150) return { label: 'Unhealthy for SG', className: 'text-orange-600' };
    if (aqi <= 200) return { label: 'Unhealthy', className: 'text-red-600' };
    return { label: 'Very Unhealthy', className: 'text-red-700' };
  };

  const getTempCategory = (temp: number | null) => {
    if (temp === null || Number.isNaN(temp)) return { label: '—', className: 'text-gray-500' };
    if (temp >= 38) return { label: 'Heat warning', className: 'text-red-600' };
    if (temp >= 32) return { label: 'Hot', className: 'text-orange-600' };
    if (temp >= 26) return { label: 'Warm', className: 'text-yellow-600' };
    if (temp >= 18) return { label: 'Comfortable', className: 'text-green-600' };
    return { label: 'Cool', className: 'text-blue-600' };
  };

  useEffect(() => {
    // Check if user is logged in
    const user = authUtils.getUserInfo();
    if (user && user.email) {
      setIsLoggedIn(true);
      setUserInfo(user);
    }

    loadMetadata();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [selectedCity]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshLiveData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedCity]);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBaseUrl}/ws/city/${selectedCity.toLowerCase()}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update') {
          if (payload.alerts?.alerts) {
            setAlerts(payload.alerts.alerts.slice(0, 10));
          }
          if (payload.risk) {
            setCityHealth({
              city: selectedCity,
              health: payload.risk.risk_score < 0.3 ? 'Good' : payload.risk.risk_score < 0.6 ? 'Moderate' : 'Critical',
              risk_score: payload.risk.risk_score
            });
          }
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [selectedCity]);

  const loadMetadata = async () => {
    try {
      const metadata = await api.getMetadata();
      if (metadata.cities) {
        const cityList = metadata.cities.map((c: any) => ({ id: c.id, name: c.name }));
        setCitiesWithIds(cityList);
        setCities(cityList.map((c: any) => c.name));
        
        // Set initial city ID
        const initialCity = cityList.find((c: any) => c.name === selectedCity);
        if (initialCity) {
          setSelectedCityId(initialCity.id);
        }
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const refreshLiveData = async () => {
    try {
      const cityKey = selectedCity.toLowerCase();
      const [alertsData, risk, env, summaryRes, freshnessRes, trafficRes] = await Promise.all([
        api.getAlerts(cityKey, { active_only: true, limit: 10 }),
        api.getRiskScore(cityKey),
        api.getEnvironmentHistory(cityKey, 24),
        api.getCitySummary(cityKey),
        api.getFreshness(),
        api.getTrafficData(cityKey)
      ]);

      const alertsList = (alertsData?.alerts || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.message,
        severity: a.severity,
        city: selectedCity,
        timestamp: a.created_at,
        status: a.is_active ? 'Active' : 'Resolved',
        category: a.type
      }));
      setAlerts(alertsList);

      const riskScore = risk?.risk_score ?? 0;
      setCityHealth({
        city: selectedCity,
        health: riskScore < 0.3 ? 'Good' : riskScore < 0.6 ? 'Moderate' : 'Critical',
        risk_score: riskScore
      });

      const envHistory = env?.data || [];
      const latestEnv = envHistory[envHistory.length - 1];
      const latestAqi = latestEnv?.aqi ?? latestEnv?.air_quality_index ?? null;
      const latestTemp = latestEnv?.temperature ?? latestEnv?.temp ?? null;
      setEnvironmentStats({ aqi: latestAqi, temp: latestTemp });

      const summaryData = summaryRes?.summary || {};
      setCitySummary(summaryData);

      const zones = trafficRes?.zones || [];
      const avgCongestion = zones.length
        ? Math.round(zones.reduce((sum: number, z: any) => sum + (z.congestion ?? 0), 0) / zones.length)
        : null;
      const descriptor = trafficDescriptor(avgCongestion);
      const latestTrafficTs = zones[0]?.timestamp;
      setTrafficSnapshot({
        average: avgCongestion,
        status: descriptor.label,
        detail: descriptor.detail,
        timestamp: latestTrafficTs
      });

      const cityFreshness = freshnessRes?.cities?.find((c: any) => c.city?.toLowerCase() === cityKey) || null;
      setFreshness({
        overall: freshnessRes?.overall,
        generated_at: freshnessRes?.generated_at,
        city: cityFreshness,
        by_type: freshnessRes?.by_type
      });

      const freshestTs = latestEnv?.timestamp || latestTrafficTs;
      setLastUpdated(freshestTs ? new Date(freshestTs).toLocaleTimeString() : new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setAlerts([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await refreshLiveData();
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = statusFromRisk(cityHealth?.risk_score || 0, alerts);
  const aqiCategoryInfo = getAqiCategory(environmentStats.aqi);
  const tempCategoryInfo = getTempCategory(environmentStats.temp);
  const envFresh = freshness?.city?.environment;
  const trafficFresh = freshness?.city?.traffic;
  const servicesFresh = freshness?.city?.services;

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 dark:border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm w-fit border border-orange-200 dark:border-orange-800">
                Live city insights
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Citizen Portal</h1>
              <p className="text-gray-600 dark:text-gray-400">Stay informed about your city's health and safety</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                <p>Last updated</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{lastUpdated ?? '—'}</p>
              </div>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Refresh
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City:</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* City Snapshot - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusInfo.label}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.badge}`}>{(cityHealth?.risk_score ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Air Quality Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Air Quality</span>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{environmentStats.aqi ?? '—'}</p>
              <p className={`text-sm font-medium ${getAqiCategory(environmentStats.aqi).className}`}>
                {getAqiCategory(environmentStats.aqi).label}
              </p>
            </div>

            {/* Temperature Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Temperature</span>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{environmentStats.temp !== null ? `${Math.round(environmentStats.temp)}°C` : '—'}</p>
                <p className={`text-sm font-medium ${getTempCategory(environmentStats.temp).className}`}>
                  {getTempCategory(environmentStats.temp).label}
                </p>
            </div>

            {/* Active Alerts Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</span>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{alerts.length}</p>
              <button
                onClick={() => window.location.assign('/citizen/alerts')}
                className="text-sm text-red-600 font-medium hover:underline"
              >
                View all →
              </button>
            </div>
          </div>

          {/* AI City Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 mb-10 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI City Summary</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {citySummary.summary || 'Summary not available right now.'}
                </p>
                {citySummary.key_insights && citySummary.key_insights.length > 0 && (
                  <ul className="mb-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {citySummary.key_insights.slice(0, 3).map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400 flex-shrink-0"></span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-300">AI Insight</p>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mt-1 leading-relaxed">
                        {citySummary.explanation || 'Awaiting latest analysis.'}
                        {citySummary.confidence !== undefined && (
                          <span className="ml-1 font-semibold">Confidence: {(citySummary.confidence * 100).toFixed(0)}%</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Alerts</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          alert.severity === 'high' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <svg className={`w-5 h-5 ${alert.severity === 'high' ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              alert.severity === 'high' 
                                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' 
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}>
                              {alert.severity === 'high' ? 'Warning' : 'Info'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{alert.description || alert.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatRelativeTime(alert.timestamp)}</p>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Public Advisory</h2>
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
                    <h3 className="font-semibold text-blue-900 mb-1">{tempCategoryInfo.label} conditions</h3>
                    <p className="text-sm text-blue-800">
                      {environmentStats.temp !== null
                        ? `Current temperature ~${Math.round(environmentStats.temp)}°C. ${tempCategoryInfo.label === 'Heat warning' ? 'Limit strenuous outdoor activity and stay hydrated.' : tempCategoryInfo.label === 'Hot' ? 'Plan outdoor work for cooler hours.' : 'Comfortable conditions right now.'}`
                        : 'Temperature data is updating...'}
                    </p>
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
                    <h3 className="font-semibold text-yellow-900 mb-1">Air Quality: {aqiCategoryInfo.label}</h3>
                    <p className="text-sm text-yellow-800">
                      {environmentStats.aqi !== null
                        ? `AQI ${environmentStats.aqi}. ${aqiCategoryInfo.label === 'Good' ? 'Air is clean.' : 'Sensitive groups should adjust outdoor time.'}`
                        : 'Air quality data is updating...'}
                    </p>
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
                    <h3 className="font-semibold text-green-900 mb-1">Traffic: {trafficSnapshot.status}</h3>
                    <p className="text-sm text-green-800">
                      {trafficSnapshot.average !== null
                        ? `Avg congestion ~${trafficSnapshot.average}%. ${trafficSnapshot.detail}`
                        : 'Traffic data is updating...'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">{formatRelativeTime(trafficSnapshot.timestamp)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Chat Panel */}
          {citiesWithIds.length > 0 && selectedCityId && (
            <div className="mb-8">
              <AIChatPanel
                cities={citiesWithIds}
                selectedCityId={selectedCityId}
                onCityChange={(cityId) => {
                  setSelectedCityId(cityId);
                  const city = citiesWithIds.find(c => c.id === cityId);
                  if (city) {
                    setSelectedCity(city.name);
                  }
                }}
              />
            </div>
          )}

          {/* Citizen Actions (public view, auth redirect) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Citizen Actions</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href={targetFor('/citizen/report-issue')} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 text-left">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Report Data Issue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Flag incorrect data</p>
              </Link>

              <Link href={targetFor('/citizen/dataset-request')} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 text-left">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Request Dataset</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Access public city data</p>
              </Link>

              <Link href={targetFor('/citizen/alerts')} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 text-left">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">View All Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">See all city notifications</p>
              </Link>

              <Link href={targetFor('/citizen/simulator')} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 text-left">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Scenario Simulator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test policy changes</p>
              </Link>
            </div>
          </div>

          {/* Trust & Transparency */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trust & Transparency</h2>
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
                      Live ingest status for {selectedCity}. We surface the latest timestamps per data stream.
                    </p>
                    <div className="space-y-1 text-sm text-pink-800">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Environment:</span>
                        <span>{envFresh?.status ?? 'n/a'}</span>
                        <span className="text-pink-600">{formatRelativeTime(envFresh?.last_updated)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Traffic:</span>
                        <span>{trafficFresh?.status ?? 'n/a'}</span>
                        <span className="text-pink-600">{formatRelativeTime(trafficFresh?.last_updated)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Services:</span>
                        <span>{servicesFresh?.status ?? 'n/a'}</span>
                        <span className="text-pink-600">{formatRelativeTime(servicesFresh?.last_updated)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-pink-700 pt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Generated {formatRelativeTime(freshness?.generated_at)}</span>
                      </div>
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
                      <span className="font-medium">Model confidence: {citySummary.confidence !== undefined ? `${Math.round(citySummary.confidence * 100)}%` : 'updating...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Access */}
          {isLoggedIn ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🎯 Scenario Simulator</h2>
                  <p className="text-blue-100 dark:text-blue-200 mb-4">
                    Test "what-if" scenarios and predict system behavior with our advanced simulation tools
                  </p>
                  <a
                    href="/citizen/simulator"
                    className="inline-block bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors duration-200"
                  >
                    Launch Simulator →
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sign in to access simulator & actions</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Log in to run scenarios and use citizen tools.</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-500 dark:bg-red-600 rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200"
                  >
                    Sign In
                  </a>
                  <a
                    href="/signup"
                    className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    Create Account
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
