import React from 'react';
import type { Submission } from '../context/GradientContext';

interface SubmissionsHistoryProps {
  readonly submissions: readonly Submission[];
  readonly onLoadSubmission: (sub: Submission) => void;
}

export function SubmissionsHistory({ submissions, onLoadSubmission }: SubmissionsHistoryProps): JSX.Element | null {
  if (submissions.length === 0) return null;

  return (
    <div className="history-card card">
      <div className="history-header">
        <h3>Your Submission History</h3>
      </div>
      <div className="history-list">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="history-item"
            onClick={() => onLoadSubmission(sub)}
          >
            <span className={`history-status status-text-${sub.status.toLowerCase().replace(/ /g, '-')}`}>
              {sub.status}
            </span>
            <span className="history-meta font-mono">{sub.language}</span>
            <span className="history-meta">{sub.score} pts</span>
            <span className="history-meta">{sub.timeUsedMs} ms</span>
            <span className="history-date">
              {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
