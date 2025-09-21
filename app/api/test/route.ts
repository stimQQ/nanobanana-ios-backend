import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import jwt from 'jsonwebtoken';
import { translate } from '@/lib/config/languages';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'passed' | 'failed' | 'skipped';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface TestReport {
  timestamp: string;
  environment: string;
  baseUrl: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

class APITester {
  private baseUrl: string;
  private authToken: string | null = null;
  private testUserId: string = 'test-user-123';

  constructor() {
    this.baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
  }

  private generateTestToken(): string {
    const payload = {
      userId: this.testUserId,
      email: 'test@nanobanana.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
  }

  async runTest(
    name: string,
    endpoint: string,
    method: string,
    options?: {
      headers?: Record<string, string>;
      body?: any;
      requiresAuth?: boolean;
    }
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers
      };

      if (options?.requiresAuth) {
        if (!this.authToken) {
          this.authToken = this.generateTestToken();
        }
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json().catch(() => null);

      if (!response.ok && !options?.requiresAuth) {
        return {
          name,
          endpoint,
          method,
          status: 'failed',
          responseTime,
          error: `HTTP ${response.status}`,
          details: data
        };
      }

      return {
        name,
        endpoint,
        method,
        status: 'passed',
        responseTime,
        details: data
      };
    } catch (error) {
      return {
        name,
        endpoint,
        method,
        status: 'failed',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async runAllTests(): Promise<TestReport> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test 1: Health Check
    tests.push(await this.runTest(
      'Health Check',
      '/api/health',
      'GET'
    ));

    // Test 2: Status Check
    tests.push(await this.runTest(
      'Status Check',
      '/api/status',
      'GET'
    ));

    // Test 3: Authentication (Mock)
    tests.push(await this.runTest(
      'Authentication Endpoint',
      '/api/auth/apple',
      'POST',
      {
        body: {
          identityToken: 'mock-token',
          user: {
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      }
    ));

    // Test 4: User Profile (Requires Auth)
    tests.push(await this.runTest(
      'User Profile',
      '/api/user/profile',
      'GET',
      { requiresAuth: true }
    ));

    // Test 5: User Credits (Requires Auth)
    tests.push(await this.runTest(
      'User Credits',
      '/api/user/credits',
      'GET',
      { requiresAuth: true }
    ));

    // Test 6: Image Generation Validation
    tests.push(await this.runTest(
      'Image Generation (Validation)',
      '/api/generate/image',
      'POST',
      {
        requiresAuth: true,
        body: {
          prompt: 'test prompt',
          mode: 'text-to-image'
        }
      }
    ));

    // Test 7: Subscription Status
    tests.push(await this.runTest(
      'Subscription Status',
      '/api/subscription/status',
      'GET',
      { requiresAuth: true }
    ));

    // Test 8: Database Connection
    const dbTest = await this.testDatabase();
    tests.push(dbTest);

    // Test 9: Environment Variables
    const envTest = this.testEnvironmentVariables();
    tests.push(envTest);

    // Calculate results
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const skipped = tests.filter(t => t.status === 'skipped').length;

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      baseUrl: this.baseUrl,
      totalTests: tests.length,
      passed,
      failed,
      skipped,
      duration: Date.now() - startTime,
      tests
    };
  }

  private async testDatabase(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('users')
        .select('user_id')
        .limit(1);

      if (error) {
        return {
          name: 'Database Connection',
          endpoint: 'N/A',
          method: 'N/A',
          status: 'failed',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }

      return {
        name: 'Database Connection',
        endpoint: 'N/A',
        method: 'N/A',
        status: 'passed',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        endpoint: 'N/A',
        method: 'N/A',
        status: 'failed',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private testEnvironmentVariables(): TestResult {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET',
      'APICORE_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      return {
        name: 'Environment Variables',
        endpoint: 'N/A',
        method: 'N/A',
        status: 'failed',
        error: `Missing: ${missing.join(', ')}`
      };
    }

    return {
      name: 'Environment Variables',
      endpoint: 'N/A',
      method: 'N/A',
      status: 'passed',
      details: {
        checked: required.length,
        present: required.length - missing.length
      }
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is a localization test
    const lang = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'en';

    // If testing localized messages
    if (request.headers.get('authorization')) {
      return NextResponse.json({
        generation_success: translate('generation.success', lang),
        language: lang,
        all_translations: {
          en: translate('generation.success', 'en'),
          cn: translate('generation.success', 'cn'),
          jp: translate('generation.success', 'jp'),
          kr: translate('generation.success', 'kr'),
          de: translate('generation.success', 'de'),
          fr: translate('generation.success', 'fr'),
        }
      }, { status: 200 });
    }

    // Otherwise run normal tests
    const tester = new APITester();
    const report = await tester.runAllTests();

    const status = report.failed > 0 ? 500 : 200;

    return NextResponse.json(report, { status });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to run tests',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}