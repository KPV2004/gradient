import React from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon } from './Icons';

// ── Difficulty Badge Component ──────────────────────────────────────────────
export interface DifficultyBadgeProps {
  readonly difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps): JSX.Element {
  let diffClass = '';
  switch (difficulty) {
    case 'Easy':
      diffClass = 'diff-easy';
      break;
    case 'Medium':
      diffClass = 'diff-medium';
      break;
    case 'Hard':
      diffClass = 'diff-hard';
      break;
  }

  return (
    <span className={`badge ${diffClass}`}>
      {difficulty}
    </span>
  );
}

// ── Problem Solved/Status Indicator Component ────────────────────────────────
export type ProblemStatus = 'solved' | 'failed' | 'unattempted';

export interface ProblemStatusIconProps {
  readonly status: ProblemStatus;
}

export function ProblemStatusIcon({ status }: ProblemStatusIconProps): JSX.Element {
  switch (status) {
    case 'solved':
      return (
        <span className="status-indicator solved" title="Solved">
          <CheckCircleIcon size={18} />
        </span>
      );
    case 'failed':
      return (
        <span className="status-indicator failed" title="Attempted but incorrect">
          <XCircleIcon size={18} />
        </span>
      );
    case 'unattempted':
    default:
      return <span className="status-indicator unattempted">-</span>;
  }
}

// ── Submission Verdict Badge Component ───────────────────────────────────────
export type VerdictStatus = 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | string;

export interface VerdictBadgeProps {
  readonly status: VerdictStatus;
}

export function VerdictBadge({ status }: VerdictBadgeProps): JSX.Element {
  let pillClass = '';
  let icon: React.ReactNode = null;

  switch (status) {
    case 'Accepted':
      pillClass = 'pill-accepted';
      icon = <CheckCircleIcon size={14} className="mr-1" />;
      break;
    case 'Wrong Answer':
      pillClass = 'pill-wrong-answer';
      icon = <XCircleIcon size={14} className="mr-1" />;
      break;
    case 'Pending':
      pillClass = 'pill-pending';
      icon = <span className="spinner" />;
      break;
    case 'Running':
      pillClass = 'pill-running';
      icon = <span className="spinner running" />;
      break;
    case 'Time Limit Exceeded':
      pillClass = 'pill-time-limit-exceeded';
      icon = <AlertCircleIcon size={14} className="mr-1" />;
      break;
    case 'Compilation Error':
      pillClass = 'pill-compilation-error';
      icon = <AlertCircleIcon size={14} className="mr-1" />;
      break;
    default:
      pillClass = 'pill-grey';
  }

  return (
    <span className={`status-pill ${pillClass}`}>
      {icon}
      {status}
    </span>
  );
}

// ── Role Badge Component ─────────────────────────────────────────────────────
export interface RoleBadgeProps {
  readonly role: 'student' | 'teacher' | 'admin';
}

export function RoleBadge({ role }: RoleBadgeProps): JSX.Element {
  let chipClass = 'adm-chip-grey';
  if (role === 'admin') chipClass = 'adm-chip-danger';
  if (role === 'teacher') chipClass = 'adm-chip-primary';

  return (
    <span className={`adm-chip ${chipClass}`}>
      {role}
    </span>
  );
}

// ── Service Status Badge Component ───────────────────────────────────────────
export interface ServiceStatusBadgeProps {
  readonly ok: boolean;
}

export function ServiceStatusBadge({ ok }: ServiceStatusBadgeProps): JSX.Element {
  return (
    <span className={`adm-chip ${ok ? 'adm-chip-success' : 'adm-chip-danger'} adm-chip-sm`}>
      {ok ? 'Online' : 'Offline'}
    </span>
  );
}
