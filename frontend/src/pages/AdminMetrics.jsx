/**
 * Admin Metrics — Grafana monitoring dashboard embed
 * Tries iframe embed first, falls back to external link
 */

import React, { useState } from 'react';

const GRAFANA_URL = 'http://localhost:3003';

export default function AdminMetrics() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Metrics</h1>
        <p className="page-subtitle">Monitor application performance and health</p>
      </div>

      {/* Quick links */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <a
          href={GRAFANA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="stat-card"
          id="grafana-link"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <span className="stat-icon">📊</span>
          <div className="stat-info">
            <span className="stat-label" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Open Grafana Dashboard
            </span>
            <span className="stat-label">Full monitoring UI →</span>
          </div>
        </a>
        <a
          href="http://localhost:9090"
          target="_blank"
          rel="noopener noreferrer"
          className="stat-card"
          id="prometheus-link"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <span className="stat-icon">🔥</span>
          <div className="stat-info">
            <span className="stat-label" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Open Prometheus
            </span>
            <span className="stat-label">Raw metrics & queries →</span>
          </div>
        </a>
      </div>

      {/* Grafana iframe embed */}
      {!iframeError ? (
        <div className="card" id="metrics-embed">
          <h2 className="card-title">Live Dashboard</h2>
          <div style={{
            borderRadius: 'var(--border-radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
          }}>
            <iframe
              src={GRAFANA_URL}
              title="Grafana Monitoring Dashboard"
              width="100%"
              height="600"
              style={{ border: 'none', display: 'block', background: 'var(--bg-primary)' }}
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                // If Grafana blocks embedding via X-Frame-Options, we can't detect it
                // via onError, so we provide the external link as fallback above
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Monitoring Dashboard</h2>
          <div className="empty-state">
            <p style={{ marginBottom: '1rem' }}>
              Unable to embed Grafana dashboard. It may be blocking iframe access.
            </p>
            <a
              href={GRAFANA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open Monitoring Dashboard ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
