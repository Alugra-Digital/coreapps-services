// Sentry error tracking middleware for Express services
// Requires: npm install @sentry/node (when ready to activate)

/**
 * Initialize error tracking. Call once during service startup.
 * Set SENTRY_DSN environment variable to enable.
 */
export function initErrorTracking(serviceName) {
  if (!process.env.SENTRY_DSN) {
    console.log(`[${serviceName}] Sentry DSN not configured, error tracking disabled`);
    return;
  }

  try {
    // Dynamic import to avoid requiring @sentry/node unless configured
    import('@sentry/node').then((Sentry) => {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        serverName: serviceName,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      });
      console.log(`[${serviceName}] Sentry error tracking initialized`);
    }).catch(() => {
      console.log(`[${serviceName}] @sentry/node not installed, skipping error tracking`);
    });
  } catch {
    // Sentry not available, continue without it
  }
}

/**
 * Express error handling middleware that captures errors to Sentry
 */
export function sentryErrorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Try to report to Sentry if available
  try {
    import('@sentry/node').then((Sentry) => {
      Sentry.captureException(err, {
        user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : undefined,
        extra: {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          query: req.query,
        },
      });
    }).catch(() => {});
  } catch {
    // Sentry not available
  }

  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      code: 'ERROR',
    });
  }
}
