import React, { useState } from 'react';
import { useGradient } from '../context/GradientContext';
import type { Submission } from '../context/GradientContext';
import { Table, TableActionButton } from './Table';

import { ClockIcon, CpuIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from './Icons';

interface SubmissionListProps {
  readonly onSelectProblem: (problemId: string) => void;
}

export function SubmissionList({ onSelectProblem }: SubmissionListProps): JSX.Element {
  const { role, submissions, regradeSubmission, username } = useGradient();
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchProblem, setSearchProblem] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');

  // Filter submissions by role scope
  const scopedSubmissions = submissions.filter((sub) => {
    if (role === 'student' && sub.username !== username) return false;
    return true;
  });

  const filteredSubmissions = scopedSubmissions.filter((sub) => {
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    const matchesProblem = sub.problemTitle.toLowerCase().includes(searchProblem.toLowerCase());
    const matchesUser = sub.username.toLowerCase().includes(searchUser.toLowerCase());
    const matchesLanguage = sub.language.toLowerCase().includes(searchLanguage.toLowerCase());
    return matchesStatus && matchesProblem && matchesUser && matchesLanguage;
  });

  const getStatusBadgeClass = (status: Submission['status']): string => {
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

  // Table configurations
  const headers = [
    "Sub ID",
    "Problem",
    ...(role === 'admin' ? ["User"] : []),
    "Language",
    "Verdict",
    "Score",
    "Time",
    "Memory",
    "Submitted At",
    "Actions"
  ];

  const columnClasses = [
    "col-sub-id",
    "col-sub-prob",
    ...(role === 'admin' ? ["col-sub-user"] : []),
    "col-sub-lang",
    "col-sub-verdict",
    "col-sub-score",
    "col-sub-time",
    "col-sub-mem",
    "col-sub-date",
    "col-sub-actions"
  ];

  const columnAlignments: ('left' | 'center' | 'right')[] = [
    "left",
    "left",
    ...(role === 'admin' ? ["left" as const] : []),
    "left",
    "left",
    "center",
    "center",
    "center",
    "left",
    "right"
  ];

  const columnFilters = [
    null, // Sub ID
    {
      type: 'text' as const,
      placeholder: 'Search Problem...',
      value: searchProblem,
      onChange: setSearchProblem,
    },
    ...(role === 'admin' ? [
      {
        type: 'text' as const,
        placeholder: 'Search User...',
        value: searchUser,
        onChange: setSearchUser,
      }
    ] : []),
    {
      type: 'text' as const,
      placeholder: 'Search Lang...',
      value: searchLanguage,
      onChange: setSearchLanguage,
    },
    {
      type: 'status' as const,
      value: statusFilter,
      onChange: setStatusFilter,
      options: ['Accepted', 'Wrong Answer', 'Pending', 'Running', 'Time Limit Exceeded', 'Compilation Error'] as const,
    },
    null, // Score
    null, // Time
    null, // Memory
    null, // Submitted At
    null, // Actions
  ];

  const rows = filteredSubmissions.map((sub) => [
    <span key={`id-${sub.id}`} className="font-mono text-muted text-sm">
      {sub.id.substring(4, 12)}...
    </span>,
    <span 
      key={`prob-${sub.id}`} 
      className="nav-link-style" 
      onClick={() => onSelectProblem(sub.problemId)}
    >
      {sub.problemTitle}
    </span>,
    ...(role === 'admin' ? [
      <span key={`user-${sub.id}`} className="font-medium">
        {sub.username}
      </span>
    ] : []),
    <span key={`lang-${sub.id}`} className="text-capitalize font-mono text-sm">
      {sub.language}
    </span>,
    <span key={`verdict-${sub.id}`} className={`status-pill ${getStatusBadgeClass(sub.status)}`}>
      {sub.status === 'Pending' && <span className="spinner" />}
      {sub.status === 'Running' && <span className="spinner running" />}
      {sub.status === 'Accepted' && <CheckCircleIcon size={14} className="mr-1" />}
      {sub.status === 'Wrong Answer' && <XCircleIcon size={14} className="mr-1" />}
      {(sub.status === 'Time Limit Exceeded' || sub.status === 'Compilation Error') && <AlertCircleIcon size={14} className="mr-1" />}
      {sub.status}
    </span>,
    <span key={`score-${sub.id}`} className="font-mono font-medium">
      {sub.score}
    </span>,
    <span key={`time-${sub.id}`} className="font-mono text-sm">
      {sub.status !== 'Pending' && sub.status !== 'Running' ? `${sub.timeUsedMs} ms` : '-'}
    </span>,
    <span key={`mem-${sub.id}`} className="font-mono text-sm">
      {sub.status !== 'Pending' && sub.status !== 'Running' ? `${(sub.memoryUsedKb / 1024).toFixed(1)} MB` : '-'}
    </span>,
    <span key={`date-${sub.id}`} className="text-sm">
      {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>,
    <div key={`actions-${sub.id}`} className="admin-actions-group">
      <TableActionButton
        type="view"
        onClick={() => setSelectedSub(sub)}
        title="Inspect Code"
      />
      {role === 'admin' && (
        <TableActionButton
          type="regrade"
          onClick={() => regradeSubmission(sub.id)}
          disabled={sub.status === 'Pending' || sub.status === 'Running'}
          title="Re-run Grader Testcases"
        />
      )}
    </div>
  ]);

  const rowKeys = filteredSubmissions.map(sub => sub.id);

  return (
    <div className="submissions-page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">Submissions</h1>
          <p className="section-subtitle">
            {role === 'admin'
              ? 'Global real-time compiler sandboxed grading queue.'
              : 'Review your submission history, execution times, memory usage, and logic verdicts.'}
          </p>
        </div>
      </div>

      <div className="card list-card">
        <Table
          headers={headers}
          rows={rows}
          rowKeys={rowKeys}
          columnAlignments={columnAlignments}
          columnClasses={columnClasses}
          columnFilters={columnFilters}
          className="submissions-table"
        />
      </div>

      {/* Code Inspector Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal-content card code-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Submission Inspector</h3>
                <p className="modal-subtitle">
                  {selectedSub.problemTitle} • Sub ID: {selectedSub.id}
                </p>
              </div>
              <button 
                type="button" 
                className="btn-console-close" 
                onClick={() => setSelectedSub(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="submission-meta-grid">
                <div><strong>User:</strong> {selectedSub.username}</div>
                <div><strong>Language:</strong> {selectedSub.language}</div>
                <div><strong>Verdict:</strong> <span className={`status-text-${selectedSub.status.toLowerCase().replace(/ /g, '-')}`}>{selectedSub.status}</span></div>
                <div><strong>Score:</strong> {selectedSub.score} pts</div>
              </div>

              <div className="code-viewer-block">
                <span className="block-label">Submitted Source Code:</span>
                <pre className="viewer-pre">
                  <code>{selectedSub.sourceCode}</code>
                </pre>
              </div>

              {selectedSub.stdout && (
                <div className="console-viewer-block">
                  <span className="block-label">Grader Sandbox Output:</span>
                  <pre className="console-pre success-content">{selectedSub.stdout}</pre>
                </div>
              )}

              {selectedSub.stderr && (
                <div className="console-viewer-block">
                  <span className="block-label text-danger">Grader Error Stream:</span>
                  <pre className="console-pre error-content">{selectedSub.stderr}</pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedSub(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
