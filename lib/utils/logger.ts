type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        formatted += `\nStack: ${error.stack}`;
      }
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };

    const formatted = this.formatMessage(entry);

    // In production, we might want to send to external service
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with services like Sentry, LogRocket, etc.
      this.sendToExternalService(entry);
    }

    // Console output
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // This is where you'd send to external logging service
    // For now, we'll just use console in production
    if (entry.level === 'error') {
      // In production, you might want to send errors to Sentry
      // Example: Sentry.captureException(entry.error);
    }
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: any) {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  // API-specific logging methods
  apiRequest(method: string, path: string, userId?: string) {
    this.info('API Request', {
      method,
      path,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  apiResponse(method: string, path: string, status: number, duration: number) {
    const level = status >= 400 ? 'warn' : 'info';
    this.log(level, 'API Response', {
      method,
      path,
      status,
      duration: `${duration}ms`
    });
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error('API Error', error, {
      method,
      path,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Credit-specific logging
  creditDeduction(userId: string, amount: number, reason: string, success: boolean) {
    const level = success ? 'info' : 'warn';
    this.log(level, 'Credit Deduction', {
      userId,
      amount,
      reason,
      success
    });
  }

  // Image generation logging
  imageGeneration(userId: string, mode: string, success: boolean, error?: string) {
    const level = success ? 'info' : 'error';
    this.log(level, 'Image Generation', {
      userId,
      mode,
      success,
      error
    });
  }

  // Authentication logging
  authAttempt(method: string, success: boolean, userId?: string, error?: string) {
    const level = success ? 'info' : 'warn';
    this.log(level, 'Authentication Attempt', {
      method,
      success,
      userId,
      error
    });
  }
}

// Export singleton instance
export const logger = new Logger();