'use client';

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  environment: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
  };
  endpoints: {
    total: number;
    tested: number;
    operational: number;
  };
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setHealth(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    const bgClass = status === 'operational' || status === 'healthy'
      ? 'bg-green-100'
      : status === 'degraded'
      ? 'bg-yellow-100'
      : 'bg-red-100';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass} ${bgClass}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-md border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-yellow-400">NanoBanana API Status Dashboard</h1>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 disabled:bg-gray-600"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded mb-4 border border-red-800">
              Error: {error}
            </div>
          )}

          {health && (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                <div>
                  <h2 className="text-xl font-semibold">System Status</h2>
                  <p className="text-gray-400">Last updated: {lastUpdate.toLocaleString()}</p>
                </div>
                <div>{getStatusBadge(health.status)}</div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Services</h3>
                <div className="space-y-2">
                  {health.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'operational' ? 'bg-green-500' :
                          service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {service.responseTime !== undefined && (
                          <span className="text-sm text-gray-600">{service.responseTime}ms</span>
                        )}
                        {getStatusBadge(service.status)}
                        {service.error && (
                          <span className="text-sm text-red-600">{service.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Environment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-800 rounded">
                    <p className="text-sm text-gray-600">Node Version</p>
                    <p className="font-semibold">{health.environment.nodeVersion}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded">
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="font-semibold">{health.environment.platform}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded">
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="font-semibold">
                      {health.environment.memory.used} / {health.environment.memory.total}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${health.environment.memory.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoints Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">API Endpoints</h3>
                <div className="p-4 bg-gray-800 rounded">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{health.endpoints.total}</p>
                      <p className="text-sm text-gray-600">Total Endpoints</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-500">{health.endpoints.tested}</p>
                      <p className="text-sm text-gray-600">Tested</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{health.endpoints.operational}</p>
                      <p className="text-sm text-gray-600">Operational</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Endpoints List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Available Endpoints</h3>
                <div className="bg-gray-800 rounded p-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between">
                      <span>GET /api/health</span>
                      <span className="text-green-500">✓ Public</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GET /api/status</span>
                      <span className="text-green-500">✓ Public</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POST /api/auth/apple</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POST /api/generate/image</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POST /api/upload/image</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GET /api/user/profile</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GET /api/user/credits</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POST /api/subscription/purchase</span>
                      <span className="text-blue-500">🔐 Auth Required</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}