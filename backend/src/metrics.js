/**
 * Prometheus Metrics
 * - Exposes default Node.js metrics
 * - Adds custom HTTP request counter and duration histogram
 */

const client = require('prom-client');

// Collect default metrics (CPU, memory, event loop, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'studdash_' });

// Custom: HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'studdash_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Custom: HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'studdash_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

/**
 * Middleware to record metrics for each request
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
  });

  next();
}

module.exports = { client, metricsMiddleware };
