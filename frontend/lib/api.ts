/**
 * API Client for Urban Intelligence Platform
 * Updated for Phases 0-5 (System, Ingestion, Analytics, Scenario, Alerts)
 */

import { authUtils } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

// Helper to add auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = authUtils.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  // ========================================
  // AUTH APIs (Phase 5.5)
  // ========================================
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async register(email: string, password: string, fullName: string, role: string = 'citizen') {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  // ========================================
  // SYSTEM APIs (Phase 0 & 1)
  // ========================================
  async getHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Failed to fetch health');
    return response.json();
  },

  async getMetadata() {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/metadata`);
    if (!response.ok) throw new Error('Failed to fetch metadata');
    return response.json();
  },

  async getSchedulerStatus() {
    const response = await fetch(`${API_BASE_URL}/scheduler/status`);
    if (!response.ok) throw new Error('Failed to fetch scheduler status');
    return response.json();
  },

  async getFreshness() {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/freshness`);
    if (!response.ok) throw new Error('Failed to fetch data freshness');
    return response.json();
  },

  // ========================================
  // ANALYTICS APIs (Phase 3)
  // ========================================
  async getForecasts(city: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/system/forecasts/${city}`);
    if (!response.ok) throw new Error('Failed to fetch forecasts');
    return response.json();
  },

  async detectAnomalies(city: string, hours: number = 24) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/ml-anomalies/${city}?hours=${hours}`);
    if (!response.ok) throw new Error('Failed to detect anomalies');
    return response.json();
  },

  async getAnomalyHistory(city: string, limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/anomalies/${city}/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch anomaly history');
    return response.json();
  },

  async getRiskScore(city: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/ml-risk/${city}`);
    if (!response.ok) throw new Error('Failed to fetch risk score');
    return response.json();
  },

  async getRiskHistory(city: string, limit: number = 20) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/risk/${city}/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch risk history');
    return response.json();
  },

  // Phase 10 ML Endpoints
  async getForecast(city: string, days: number = 7) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/forecast/${city}?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch forecast');
    return response.json();
  },

  async getCitySummary(city: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/city-summary/${city}`);
    if (!response.ok) throw new Error('Failed to fetch city summary');
    return response.json();
  },

  // ========================================
  // SCENARIO APIs (Phase 4 - CENTERPIECE)
  // ========================================
  async simulateScenario(city: string, scenarioInput: any) {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenario/simulate/${city}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scenarioInput),
    });
    if (!response.ok) throw new Error('Simulation failed');
    return response.json();
  },

  async explainScenario(city: string, scenarioId: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenario/explain/${city}/${scenarioId}`);
    if (!response.ok) throw new Error('Failed to explain scenario');
    return response.json();
  },

  async getScenarioHistory(city: string, limit: number = 10) {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenario/history/${city}?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch scenario history');
    return response.json();
  },

  // ========================================
  // ALERT APIs (Phase 5)
  // ========================================
  async generateAlerts(city: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${city}/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate alerts');
    return response.json();
  },

  async getAlerts(city: string, filters?: {
    audience?: string;
    severity?: string;
    active_only?: boolean;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.audience) params.append('audience', filters.audience);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.active_only !== undefined) params.append('active_only', String(filters.active_only));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const url = params.toString() 
      ? `${API_BASE_URL}/api/v1/alerts/${city}?${params}`
      : `${API_BASE_URL}/api/v1/alerts/${city}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  },

  async getPublicAlerts(city: string = 'ahmedabad') {
    return this.getAlerts(city, { audience: 'public', active_only: true });
  },

  async resolveAlert(alertId: string, acknowledgedBy?: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    });
    if (!response.ok) throw new Error('Failed to resolve alert');
    return response.json();
  },

  async getAlertSummary(city: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${city}/summary`);
    if (!response.ok) throw new Error('Failed to fetch alert summary');
    return response.json();
  },

  // ========================================
  // INGESTION APIs (Phase 2)
  // ========================================
  async ingestEnvironment(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingest/environment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Environment ingestion failed');
    return response.json();
  },

  async ingestTraffic(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingest/traffic`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Traffic ingestion failed');
    return response.json();
  },

  async ingestServices(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingest/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Services ingestion failed');
    return response.json();
  },

  // Chart data endpoints
  async getEnvironmentHistory(city: string, hours: number = 24) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/cities/${city}/environment-data?limit=${hours}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch environment history');
    return response.json();
  },

  async getTrafficData(city: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/cities/${city}/traffic-data`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch traffic data');
    return response.json();
  },

  async getAuditLogs() {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/audit-logs`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function formatRiskLevel(level: string): string {
  return level?.toUpperCase() || 'UNKNOWN';
}

