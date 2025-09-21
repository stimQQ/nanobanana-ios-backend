import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

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

async function checkSupabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'Supabase Database',
        status: 'down',
        responseTime,
        error: error.message
      };
    }

    return {
      name: 'Supabase Database',
      status: 'operational',
      responseTime
    };
  } catch (error) {
    return {
      name: 'Supabase Database',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAPICore(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.apicore.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.APICORE_API_KEY}`
      },
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        name: 'API Core Service',
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}`
      };
    }

    return {
      name: 'API Core Service',
      status: 'operational',
      responseTime
    };
  } catch (error) {
    return {
      name: 'API Core Service',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAppleAuth(): Promise<ServiceStatus> {
  try {
    // Check if Apple Auth configuration is present
    const hasConfig = !!(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
    );

    if (!hasConfig) {
      return {
        name: 'Apple Authentication',
        status: 'down',
        error: 'Missing configuration'
      };
    }

    return {
      name: 'Apple Authentication',
      status: 'operational'
    };
  } catch (error) {
    return {
      name: 'Apple Authentication',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Run all checks in parallel
    const [supabaseStatus, apiCoreStatus, appleAuthStatus] = await Promise.all([
      checkSupabase(),
      checkAPICore(),
      checkAppleAuth()
    ]);

    const services = [supabaseStatus, apiCoreStatus, appleAuthStatus];

    // Calculate overall status
    const operationalCount = services.filter(s => s.status === 'operational').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const downCount = services.filter(s => s.status === 'down').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (downCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(usedMem / 1024 / 1024)}MB`,
          total: `${Math.round(totalMem / 1024 / 1024)}MB`,
          percentage: Math.round((usedMem / totalMem) * 100)
        }
      },
      endpoints: {
        total: 10, // Total number of API endpoints
        tested: services.length,
        operational: operationalCount
      }
    };

    return NextResponse.json(healthStatus, {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: [],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: '0MB',
          total: '0MB',
          percentage: 0
        }
      },
      endpoints: {
        total: 10,
        tested: 0,
        operational: 0
      }
    }, { status: 503 });
  }
}