import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

export interface RequestMetrics {
  startTime: number;
  method: string;
  path: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function startRequestTracking(request: NextRequest, userId?: string): RequestMetrics {
  const metrics: RequestMetrics = {
    startTime: Date.now(),
    method: request.method,
    path: request.nextUrl.pathname,
    userId,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined
  };

  logger.apiRequest(metrics.method, metrics.path, metrics.userId);

  return metrics;
}

export function endRequestTracking(metrics: RequestMetrics, status: number) {
  const duration = Date.now() - metrics.startTime;
  logger.apiResponse(metrics.method, metrics.path, status, duration);

  // Track slow requests
  if (duration > 3000) {
    logger.warn('Slow API Request', {
      ...metrics,
      duration: `${duration}ms`,
      status
    });
  }
}

export function trackError(metrics: RequestMetrics, error: Error) {
  logger.apiError(metrics.method, metrics.path, error, metrics.userId);
}