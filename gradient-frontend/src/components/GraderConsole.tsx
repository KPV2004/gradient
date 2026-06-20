import React, { useState } from 'react';
import type { Submission } from '../context/GradientContext';
import { 
  AwardIcon, 
  ClockIcon, 
  CpuIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon 
} from './Icons';

interface GraderConsoleProps {
  readonly activeSubmission: Submission | undefined;
  readonly showConsole: boolean;
  readonly onClose: () => void;
}

interface ParsedTestcase {
  readonly name: string;
  readonly isSample: boolean;
  readonly status: 'passed' | 'failed' | 'running' | 'crashed';
  readonly details: string;
  readonly points?: string;
}

// Robust stdout parser to extract individual testcase results
function parseTestcases(stdout: string | undefined): readonly ParsedTestcase[] {
  if (!stdout) return [];
  const lines = stdout.split('\n').filter(l => l.trim().length > 0);
  
  return lines.map((line) => {
    const isSample = line.toLowerCase().includes('sample') || line.toLowerCase().includes('sample');
    let name = '';
    
    const matchName = line.match(/Testcase\s+\d+/i);
    if (matchName) {
      name = matchName[0];
      if (isSample) name += ' (Sample)';
    } else {
      name = line.split(':')[0] || 'Testcase';
    }
    
    let status: ParsedTestcase['status'] = 'running';
    let details = line;
    let points: string | undefined;

    if (line.includes('Success')) {
      status = 'passed';
      const ptsMatch = line.match(/\(\d+\/\d+\s*pts\)/i);
      if (ptsMatch) {
        points = ptsMatch[0].replace(/[()]/g, '');
      }
    } else if (line.includes('Failed')) {
      status = 'failed';
    } else if (line.includes('Crashed')) {
      status = 'crashed';
    } else if (line.includes('Running')) {
      status = 'running';
    } else {
      status = 'passed';
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      details = line.substring(colonIdx + 1).trim();
    }

    return {
      name,
      isSample,
      status,
      details,
      points
    };
  });
}

export function GraderConsole({ activeSubmission, showConsole, onClose }: GraderConsoleProps): JSX.Element | null {
  const [consoleTab, setConsoleTab] = useState<'visual' | 'raw'>('visual');

  if (!showConsole) return null;

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Accepted': return 'pill-accepted';
      case 'Wrong Answer': return 'pill-wrong-answer';
      case 'Pending': return 'pill-pending';
      case 'Running': return 'pill-running';
      case 'Time Limit Exceeded': return 'pill-time-limit-exceeded';
      case 'Compilation Error': return 'pill-compilation-error';
      default: return 'pill-grey';
    }
  };

  const parsedTCs = activeSubmission ? parseTestcases(activeSubmission.stdout) : [];

  return (
    <div className="console-card card">
      <div className="console-header">
        <h3>Grader Terminal Sandbox Console</h3>
        <button
          type="button"
          className="btn-console-close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="console-body">
        {activeSubmission ? (
          <div className="grading-report">
            {/* Overall Grading Header Status Badge and Metrics */}
            <div className="grading-status-row">
              <div className="status-badge-wrapper">
                <span className={`status-pill ${getStatusBadgeClass(activeSubmission.status)}`}>
                  {activeSubmission.status === 'Pending' && <span className="spinner" />}
                  {activeSubmission.status === 'Running' && <span className="spinner running" />}
                  {activeSubmission.status === 'Accepted' && <CheckCircleIcon size={16} className="mr-1" />}
                  {activeSubmission.status === 'Wrong Answer' && <XCircleIcon size={16} className="mr-1" />}
                  {(activeSubmission.status === 'Time Limit Exceeded' || activeSubmission.status === 'Compilation Error') && (
                    <AlertCircleIcon size={16} className="mr-1" />
                  )}
                  {activeSubmission.status}
                </span>
              </div>
              <div className="grading-metrics">
                {activeSubmission.status !== 'Pending' && activeSubmission.status !== 'Running' && (
                  <>
                    <div className="metric-badge">
                      <AwardIcon size={14} className="mr-1" />
                      Score: {activeSubmission.score} pts
                    </div>
                    <div className="metric-badge">
                      <ClockIcon size={14} className="mr-1" />
                      {activeSubmission.timeUsedMs} ms
                    </div>
                    <div className="metric-badge">
                      <CpuIcon size={14} className="mr-1" />
                      {(activeSubmission.memoryUsedKb / 1024).toFixed(1)} MB
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Spinner or loaders during sandbox compilation/evaluation */}
            {activeSubmission.status === 'Pending' || activeSubmission.status === 'Running' ? (
              <div className="console-loader">
                <div className="wave-loader">
                  <span></span><span></span><span></span>
                </div>
                <p className="loader-text">
                  {activeSubmission.status === 'Pending'
                    ? 'Sending source code to Grader gRPC Service...'
                    : 'Spinning up isolated Docker Sandbox Container...'}
                </p>
              </div>
            ) : (
              <div className="console-completed-container">
                {/* Console tabs toggle */}
                <div className="console-toggle-tabs">
                  <button
                    type="button"
                    className={`console-tab-link ${consoleTab === 'visual' ? 'active' : ''}`}
                    onClick={() => setConsoleTab('visual')}
                  >
                    Visual Testcases Verdict
                  </button>
                  <button
                    type="button"
                    className={`console-tab-link ${consoleTab === 'raw' ? 'active' : ''}`}
                    onClick={() => setConsoleTab('raw')}
                  >
                    Raw Grader Output Stream
                  </button>
                </div>

                {consoleTab === 'visual' ? (
                  <div className="testcase-visualizer-panel">
                    {activeSubmission.status === 'Compilation Error' ? (
                      <div className="compilation-error-banner card border-red">
                        <div className="error-title-wrapper text-danger">
                          <AlertCircleIcon size={18} className="mr-1" />
                          <strong>Compilation / Build Failed</strong>
                        </div>
                        <p className="error-desc text-muted">
                          Your code failed to compile inside our Docker sandbox compiler. Read the Stderr stream logs in the raw tab to fix syntax errors.
                        </p>
                        <pre className="error-log-snippet font-mono">{activeSubmission.stderr}</pre>
                      </div>
                    ) : (
                      <>
                        <div className="visual-section-intro">
                          <h4>Isolated Sandbox Sandbox test results:</h4>
                          <span className="text-muted text-sm">Each card represents an independent testcase verification execution.</span>
                        </div>
                        
                        <div className="testcase-cards-grid">
                          {parsedTCs.map((tc, idx) => (
                            <div 
                              key={`${tc.name}-${idx}`} 
                              className={`card testcase-verdict-card status-${tc.status}`}
                            >
                              <div className="tc-card-header">
                                <span className="tc-card-name font-medium">{tc.name}</span>
                                <span className={`tc-status-badge badge-${tc.status}`}>
                                  {tc.status === 'passed' && 'Passed'}
                                  {tc.status === 'failed' && 'Failed'}
                                  {tc.status === 'crashed' && 'Crashed'}
                                  {tc.status === 'running' && 'Running'}
                                </span>
                              </div>
                              <div className="tc-card-body">
                                <p className="tc-details font-mono text-sm">{tc.details}</p>
                                {tc.points && (
                                  <div className="tc-points-tag font-mono">+{tc.points}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="console-output-blocks">
                    {activeSubmission.stderr && (
                      <div className="output-section">
                        <span className="output-title text-danger">Compilation/Runtime Stderr:</span>
                        <pre className="output-content error-content font-mono">{activeSubmission.stderr}</pre>
                      </div>
                    )}
                    {activeSubmission.stdout && (
                      <div className="output-section">
                        <span className="output-title">Grader Evaluation Verdict (Stdout):</span>
                        <pre className="output-content success-content font-mono">{activeSubmission.stdout}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="console-empty">
            Ready. Click Submit to compile and run your solution inside the Docker Sandbox.
          </p>
        )}
      </div>
    </div>
  );
}
