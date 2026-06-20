import React, { useState, useEffect } from 'react';
import { useGradient } from '../context/GradientContext';
import { ShieldIcon, CpuIcon, DatabaseIcon, AlertCircleIcon } from './Icons';

export function AdminDashboard(): JSX.Element {
  const { problems, submissions, role } = useGradient();

  // Simulated metrics
  const [cpuUsage, setCpuUsage] = useState(12);
  const [containerCount, setContainerCount] = useState(1);
  const [dbPools, setDbPools] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate resource fluctuation
      setCpuUsage(Math.floor(Math.random() * 25) + 5); // 5% to 30%
      setContainerCount(Math.floor(Math.random() * 3) + 1); // 1 to 4 containers active
      setDbPools(Math.floor(Math.random() * 4) + 4); // 4 to 8 active pools
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Compute stats
  const totalProblems = problems.length;
  const draftProblems = problems.filter(p => !p.isPublished).length;
  const totalSubmissions = submissions.length;
  
  const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted').length;
  const passRate = totalSubmissions > 0 
    ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) 
    : '0.0';

  if (role !== 'admin') {
    return (
      <div className="card text-center p-8">
        <AlertCircleIcon size={48} className="text-danger mx-auto mb-4" />
        <h2>Access Denied</h2>
        <p className="text-muted mt-2">Only administrators or instructors are authorized to view this control panel.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-subtitle">
            Monitor real-time sandbox compiler resource limits, platform metrics, and backend service states.
          </p>
        </div>
      </div>

      {/* Resource Telemetry Row */}
      <div className="metrics-grid-3">
        <div className="card metric-widget font-mono">
          <div className="widget-header">
            <CpuIcon className="widget-icon" />
            <span>Docker Sandboxes</span>
          </div>
          <div className="widget-large-val">{containerCount} <span className="text-sm text-muted">/ 8 containers</span></div>
          <div className="widget-bar-wrapper">
            <div className="widget-bar" style={{ width: `${(containerCount / 8) * 100}%`, backgroundColor: 'var(--accent)' }} />
          </div>
          <span className="widget-hint">Active grading sandbox environments</span>
        </div>

        <div className="card metric-widget font-mono">
          <div className="widget-header">
            <CpuIcon className="widget-icon text-orange" />
            <span>Sandbox CPU Load</span>
          </div>
          <div className="widget-large-val">{cpuUsage}% <span className="text-sm text-muted">utilization</span></div>
          <div className="widget-bar-wrapper">
            <div className="widget-bar bg-orange" style={{ width: `${cpuUsage}%` }} />
          </div>
          <span className="widget-hint">Docker host CPU cores load</span>
        </div>

        <div className="card metric-widget font-mono">
          <div className="widget-header">
            <DatabaseIcon className="widget-icon text-green" />
            <span>Postgres DB Pools</span>
          </div>
          <div className="widget-large-val">{dbPools} <span className="text-sm text-muted">connections</span></div>
          <div className="widget-bar-wrapper">
            <div className="widget-bar bg-green" style={{ width: `${(dbPools / 15) * 100}%` }} />
          </div>
          <span className="widget-hint">Active pg pool connections (max 15)</span>
        </div>
      </div>

      {/* Platform Analytics Cards */}
      <div className="analytics-panels-grid">
        <div className="card analytic-card">
          <h3>Problems Database</h3>
          <div className="number-rows-group">
            <div className="num-row">
              <span className="label">Total Challenges:</span>
              <span className="val font-mono">{totalProblems}</span>
            </div>
            <div className="num-row">
              <span className="label">Draft Mode (Unpublished):</span>
              <span className="val font-mono text-orange">{draftProblems}</span>
            </div>
            <div className="num-row">
              <span className="label">Active Published:</span>
              <span className="val font-mono text-green">{totalProblems - draftProblems}</span>
            </div>
          </div>
        </div>

        <div className="card analytic-card">
          <h3>Evaluation Analytics</h3>
          <div className="number-rows-group">
            <div className="num-row">
              <span className="label">Total Graded Runs:</span>
              <span className="val font-mono">{totalSubmissions}</span>
            </div>
            <div className="num-row">
              <span className="label">Success Pass Verdicts:</span>
              <span className="val font-mono text-green">{acceptedSubmissions}</span>
            </div>
            <div className="num-row">
              <span className="label">Sandbox Compilation Pass Rate:</span>
              <span className="val font-mono text-accent">{passRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status Map */}
      <div className="card service-status-card">
        <h3>Backend Microservice Architecture Status</h3>
        <div className="status-grid-list">
          <div className="status-item-row">
            <div className="status-meta">
              <span className="service-name">CMS Service API Gateway (Go / Gin)</span>
              <span className="service-url font-mono">http://localhost:8080</span>
            </div>
            <span className="status-indicator-badge success">Online (healthy)</span>
          </div>

          <div className="status-item-row">
            <div className="status-meta">
              <span className="service-name">Grader Evaluation Engine (Go / gRPC)</span>
              <span className="service-url font-mono">localhost:8081</span>
            </div>
            <span className="status-indicator-badge success">Listening (gRPC)</span>
          </div>

          <div className="status-item-row">
            <div className="status-meta">
              <span className="service-name">Postgres SQL Cluster</span>
              <span className="service-url font-mono">gradient_postgres:5432</span>
            </div>
            <span className="status-indicator-badge success">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
