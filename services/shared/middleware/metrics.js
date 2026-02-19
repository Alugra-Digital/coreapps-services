/**
 * Prometheus metrics middleware for Express services.
 * Exports HTTP request duration histogram and basic counters.
 * Requires: npm install prom-client (when ready to activate)
 */

let metricsEnabled = false;
let register = null;
let httpRequestDuration = null;
let httpRequestTotal = null;

/**
 * Initialize metrics collection
 */
export async function initMetrics(serviceName) {
  try {
    const promClient = await import('prom-client');
    register = new promClient.Registry();

    // Default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register, prefix: `coreapps_${serviceName}_` });

    httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [register],
    });

    metricsEnabled = true;
    console.log(`[${serviceName}] Prometheus metrics initialized`);
  } catch {
    console.log(`[${serviceName}] prom-client not installed, metrics disabled`);
  }
}

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    if (!metricsEnabled) return next();

    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route?.path || req.path || 'unknown';
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      };

      httpRequestDuration?.observe(labels, duration);
      httpRequestTotal?.inc(labels);
    });

    next();
  };
}

/**
 * Handler for /metrics endpoint
 */
export async function metricsHandler(req, res) {
  if (!metricsEnabled || !register) {
    return res.status(503).json({ message: 'Metrics not available', code: 'SERVICE_UNAVAILABLE' });
  }

  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
