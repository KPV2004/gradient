import React, { useState, useEffect, useCallback } from 'react';
import { useGradient } from '../context/GradientContext';
import { ShieldIcon, CpuIcon, DatabaseIcon, AlertCircleIcon, UserIcon } from './Icons';
import { Table, TableActionButton } from './Table';
import type { ColumnFilter } from './Table';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

interface AdminSubmission {
  ID: string;
  ProblemID: string;
  UserID: string;
  Username: string;
  Language: string;
  Status: string;
  Score: number;
  TimeUsedMs: number;
  MemoryUsedKb: number;
  CreatedAt: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

type AdminTab = 'overview' | 'users' | 'submissions' | 'logs';

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }): JSX.Element {
  return (
    <tr className="adm-skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><div className="adm-skeleton-cell" /></td>
      ))}
    </tr>
  );
}

function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="adm-empty-state">
      <div className="adm-empty-icon">
        <DatabaseIcon size={28} />
      </div>
      <p className="adm-empty-text">{message}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }): JSX.Element {
  const s = status.toLowerCase();
  let cls = 'adm-chip';
  if (s === 'accepted') cls += ' adm-chip-success';
  else if (s === 'pending' || s === 'running') cls += ' adm-chip-pending';
  else if (s === 'wrong_answer') cls += ' adm-chip-danger';
  else if (s === 'time_limit_exceeded') cls += ' adm-chip-warning';
  else if (s === 'compile_error') cls += ' adm-chip-warning';
  else cls += ' adm-chip-muted';

  const label =
    s === 'accepted' ? 'Accepted' :
    s === 'pending' ? 'Pending' :
    s === 'running' ? 'Running' :
    s === 'wrong_answer' ? 'Wrong Answer' :
    s === 'time_limit_exceeded' ? 'TLE' :
    s === 'compile_error' ? 'Compile Error' :
    s === 'runtime_error' ? 'Runtime Error' :
    s === 'memory_limit_exceeded' ? 'MLE' :
    status.replace(/_/g, ' ');

  return <span className={cls}>{label}</span>;
}

function RoleBadge({ role }: { role: string }): JSX.Element {
  let cls = 'adm-role-badge';
  if (role === 'admin') cls += ' adm-role-admin';
  else if (role === 'teacher') cls += ' adm-role-teacher';
  else cls += ' adm-role-student';
  return <span className={cls}>{role}</span>;
}

function ActionChip({ action }: { action: string }): JSX.Element {
  let cls = 'adm-action-chip';
  if (action === 'login') cls += ' adm-action-login';
  else if (action === 'submit') cls += ' adm-action-submit';
  else cls += ' adm-action-register';
  return <span className={cls}>{action}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminDashboard(): JSX.Element {
  const { problems, submissions, role, token } = useGradient();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Real Prometheus/System metrics (ponytail: monitor real metrics instead of mock values)
  const [cpuUsage, setCpuUsage] = useState(0);
  const [containerCount, setContainerCount] = useState(0);
  const [dbPools, setDbPools] = useState(0);
  const [prometheusOk, setPrometheusOk] = useState(false);
  const [servicesStatus, setServicesStatus] = useState({
    cms: true,
    grader: true,
    postgres: true,
  });

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminSubs, setAdminSubs] = useState<AdminSubmission[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Filters
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  // Column search filters (ponytail: column-specific filtering)
  const [filterUser, setFilterUser] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  // User editing modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [updatingUser, setUpdatingUser] = useState(false);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<any> => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, [token]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { setUsers(await apiFetch('/api/admin/users')); }
    catch { /* silent */ }
    finally { setLoadingUsers(false); }
  }, [apiFetch]);

  const loadAdminSubs = useCallback(async () => {
    setLoadingSubs(true);
    try { setAdminSubs(await apiFetch('/api/admin/submissions')); }
    catch { /* silent */ }
    finally { setLoadingSubs(false); }
  }, [apiFetch]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try { setActivityLogs(await apiFetch('/api/admin/activity-logs?limit=100')); }
    catch { /* silent */ }
    finally { setLoadingLogs(false); }
  }, [apiFetch]);

  const loadInfraMetrics = useCallback(async () => {
    try {
      const data = await apiFetch('/api/admin/infra-metrics');
      setCpuUsage(data.cpu_usage ?? 0);
      setContainerCount(data.active_sandboxes ?? 0);
      setDbPools(data.db_connections ?? 0);
      setPrometheusOk(!!data.prometheus_ok);
      if (data.services) {
        setServicesStatus(data.services);
      }
    } catch { /* silent */ }
  }, [apiFetch]);

  useEffect(() => {
    loadInfraMetrics();
    const t = setInterval(loadInfraMetrics, 4000);
    return () => clearInterval(t);
  }, [loadInfraMetrics]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'submissions') loadAdminSubs();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, loadUsers, loadAdminSubs, loadLogs]);

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setUpdatingUser(true);
    try {
      const data = await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: editDisplayName,
          role: editRole,
        }),
      });
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, display_name: data.display_name, role: data.role } : u));
      showToast('User updated successfully');
      setEditingUser(null);
    } catch (e: any) {
      showToast(e.message, 'err');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete "${username}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`User @${username} removed`);
    } catch (e: any) { showToast(e.message, 'err'); }
  };

  const handleKillSubmission = async (subId: string) => {
    try {
      await apiFetch(`/api/admin/submissions/${subId}/kill`, { method: 'DELETE' });
      setAdminSubs(prev => prev.map(s => s.ID === subId ? { ...s, Status: 'system_error' } : s));
      showToast('Submission killed');
    } catch (e: any) { showToast(e.message, 'err'); }
  };

  const handleResendSubmission = async (subId: string) => {
    try {
      await apiFetch(`/api/admin/submissions/${subId}/resend`, { method: 'POST' });
      setAdminSubs(prev => prev.map(s => s.ID === subId ? { ...s, Status: 'pending', Score: 0 } : s));
      showToast('Submission reset to pending');
    } catch (e: any) { showToast(e.message, 'err'); }
  };

  // Stats
  const totalProblems = problems.length;
  const publishedProblems = problems.filter(p => p.isPublished).length;
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted').length;
  const pendingSubmissions = submissions.filter(s => s.status === 'Pending' || s.status === 'Running').length;
  const passRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) : '—';

  const filteredSubs = adminSubs.filter(s => subStatusFilter === 'all' || s.Status === subStatusFilter);
  const filteredUsers = users.filter(u => {
    const matchesUser =
      u.username.toLowerCase().includes(filterUser.toLowerCase()) ||
      u.display_name.toLowerCase().includes(filterUser.toLowerCase());
    const matchesEmail = u.email.toLowerCase().includes(filterEmail.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesUser && matchesEmail && matchesRole;
  });

  if (role !== 'admin') {
    return (
      <div className="adm-access-denied">
        <AlertCircleIcon size={40} />
        <h3>Access Restricted</h3>
        <p>This area is limited to administrators only.</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'logs', label: 'Activity' },
  ];

  return (
    <div className="adm-shell">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`adm-toast ${toast.type === 'err' ? 'adm-toast-err' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <div className="adm-header-icon">
            <ShieldIcon size={18} />
          </div>
          <div>
            <h1 className="adm-page-title">Admin Panel</h1>
            <p className="adm-page-sub">Platform monitoring and management</p>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div className="adm-tab-nav" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`adm-tab ${activeTab === tab.id ? 'adm-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'submissions' && pendingSubmissions > 0 && (
              <span className="adm-tab-badge">{pendingSubmissions}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="adm-tab-body">

          {/* Stat cards */}
          <div className="adm-stat-grid">
            <div className="adm-stat-card">
              <span className="adm-stat-label">Total Problems</span>
              <span className="adm-stat-value">{totalProblems}</span>
              <span className="adm-stat-sub">{publishedProblems} published · {totalProblems - publishedProblems} draft</span>
            </div>
            <div className="adm-stat-card">
              <span className="adm-stat-label">Total Submissions</span>
              <span className="adm-stat-value">{totalSubmissions}</span>
              <span className="adm-stat-sub">{acceptedSubmissions} accepted</span>
            </div>
            <div className="adm-stat-card">
              <span className="adm-stat-label">Pass Rate</span>
              <span className="adm-stat-value adm-stat-accent">{passRate}{totalSubmissions > 0 ? '%' : ''}</span>
              <span className="adm-stat-sub">Accepted / Total</span>
            </div>
            <div className="adm-stat-card">
              <span className="adm-stat-label">Queue Pending</span>
              <span className={`adm-stat-value ${pendingSubmissions > 0 ? 'adm-stat-warn' : ''}`}>{pendingSubmissions}</span>
              <span className="adm-stat-sub">Awaiting grader</span>
            </div>
          </div>

          {/* Infra monitors */}
          <div className="adm-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Infrastructure</span>
            <span className={`adm-chip ${prometheusOk ? 'adm-chip-success' : 'adm-chip-muted'}`} style={{ fontSize: '0.68rem', textTransform: 'none', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
              {prometheusOk ? 'Prometheus Active' : 'Direct System Metrics'}
            </span>
          </div>
          <div className="adm-infra-grid">
            <div className="adm-infra-card">
              <div className="adm-infra-header">
                <CpuIcon size={15} className="adm-infra-icon" />
                <span className="adm-infra-name">Docker Sandboxes</span>
                <span className="adm-infra-val font-mono">{containerCount} / 8</span>
              </div>
              <div className="adm-prog-track">
                <div className="adm-prog-fill adm-prog-accent" style={{ width: `${(containerCount / 8) * 100}%` }} />
              </div>
            </div>

            <div className="adm-infra-card">
              <div className="adm-infra-header">
                <CpuIcon size={15} className="adm-infra-icon" />
                <span className="adm-infra-name">CPU Load</span>
                <span className="adm-infra-val font-mono">{cpuUsage}%</span>
              </div>
              <div className="adm-prog-track">
                <div
                  className={`adm-prog-fill ${cpuUsage > 70 ? 'adm-prog-warn' : 'adm-prog-accent'}`}
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
            </div>

            <div className="adm-infra-card">
              <div className="adm-infra-header">
                <DatabaseIcon size={15} className="adm-infra-icon" />
                <span className="adm-infra-name">DB Connections</span>
                <span className="adm-infra-val font-mono">{dbPools} / 15</span>
              </div>
              <div className="adm-prog-track">
                <div className="adm-prog-fill adm-prog-success" style={{ width: `${(dbPools / 15) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="adm-section-label">Services</div>
          <div className="adm-services-card">
            {[
              { name: 'CMS Service', detail: 'Go · Gin · REST', addr: ':8080', ok: servicesStatus.cms },
              { name: 'Grader Engine', detail: 'Go · gRPC', addr: ':8081', ok: servicesStatus.grader },
              { name: 'PostgreSQL', detail: 'Database', addr: ':5432', ok: servicesStatus.postgres },
            ].map(svc => (
              <div key={svc.name} className="adm-service-row">
                <div className="adm-service-dot" data-ok={svc.ok} />
                <div className="adm-service-info">
                  <span className="adm-service-name">{svc.name}</span>
                  <span className="adm-service-detail">{svc.detail}</span>
                </div>
                <code className="adm-service-addr">{svc.addr}</code>
                <span className={`adm-chip ${svc.ok ? 'adm-chip-success' : 'adm-chip-danger'} adm-chip-sm`}>
                  {svc.ok ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          USERS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="adm-tab-body">
          <div className="adm-toolbar">
            <div className="adm-toolbar-left">
              <span className="adm-toolbar-title">User Management</span>
              <span className="adm-toolbar-count">{filteredUsers.length} users</span>
            </div>
            <div className="adm-toolbar-right">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={loadUsers}>
                Refresh
              </button>
            </div>
          </div>

          <div className="adm-table-shell">
            {loadingUsers ? (
              <table className="adm-table">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
                </tbody>
              </table>
            ) : (
              <Table
                headers={['User', 'Email', 'Role', 'Joined', 'Actions']}
                rows={filteredUsers.map(user => [
                  <div className="adm-user-cell" key={`user-${user.id}`}>
                    <div className="adm-user-avatar">
                      <UserIcon size={14} />
                    </div>
                    <div>
                      <div className="adm-user-name">{user.display_name}</div>
                      <div className="adm-user-handle font-mono">@{user.username}</div>
                    </div>
                  </div>,
                  user.email,
                  <RoleBadge role={user.role} key={`role-${user.id}`} />,
                  new Date(user.created_at).toLocaleDateString(),
                  <div className="adm-actions-cell" key={`actions-${user.id}`} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <TableActionButton
                      type="edit"
                      onClick={() => {
                        setEditingUser(user);
                        setEditDisplayName(user.display_name);
                        setEditRole(user.role);
                      }}
                      title="Edit User"
                    />
                    <TableActionButton
                      type="delete"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      title="Remove User"
                    />
                  </div>
                ])}
                rowKeys={filteredUsers.map(u => u.id)}
                columnAlignments={['left', 'left', 'left', 'left', 'right']}
                columnFilters={[
                  {
                    type: 'text',
                    placeholder: 'Search name...',
                    value: filterUser,
                    onChange: setFilterUser,
                  },
                  {
                    type: 'text',
                    placeholder: 'Search email...',
                    value: filterEmail,
                    onChange: setFilterEmail,
                  },
                  {
                    type: 'select',
                    options: ['student', 'teacher', 'admin'],
                    value: filterRole,
                    onChange: setFilterRole,
                  },
                  null, // Joined
                  null, // Actions
                ]}
                className="adm-table"
              />
            )}
            {!loadingUsers && filteredUsers.length === 0 && (
              <EmptyState message="No users match your filters." />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBMISSIONS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'submissions' && (
        <div className="adm-tab-body">
          <div className="adm-toolbar">
            <div className="adm-toolbar-left">
              <span className="adm-toolbar-title">Submission Monitor</span>
              <span className="adm-toolbar-count">{filteredSubs.length} entries</span>
            </div>
            <div className="adm-toolbar-right">
              <select
                className="adm-select"
                value={subStatusFilter}
                onChange={e => setSubStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="accepted">Accepted</option>
                <option value="wrong_answer">Wrong Answer</option>
                <option value="time_limit_exceeded">TLE</option>
                <option value="compile_error">Compile Error</option>
                <option value="runtime_error">Runtime Error</option>
                <option value="system_error">System Error</option>
              </select>
              <button type="button" className="adm-btn adm-btn-ghost" onClick={loadAdminSubs}>
                Refresh
              </button>
            </div>
          </div>

          <div className="adm-table-shell">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Lang</th>
                  <th>Status</th>
                  <th className="adm-th-right">Score</th>
                  <th className="adm-th-right">Time</th>
                  <th>Submitted</th>
                  <th className="adm-th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingSubs
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                  : filteredSubs.map(sub => (
                    <tr key={sub.ID} className="adm-tr">
                      <td className="adm-td-mono adm-td-muted adm-td-id">{sub.ID.slice(0, 8)}…</td>
                      <td className="adm-td-mono adm-td-sm">@{sub.Username}</td>
                      <td><span className="adm-lang-tag">{sub.Language.toUpperCase()}</span></td>
                      <td><StatusChip status={sub.Status} /></td>
                      <td className="adm-td-right adm-td-mono">{sub.Score}</td>
                      <td className="adm-td-right adm-td-mono adm-td-muted">{sub.TimeUsedMs}ms</td>
                      <td className="adm-td-muted adm-td-sm">{new Date(sub.CreatedAt).toLocaleString()}</td>
                      <td className="adm-td-right">
                        <div className="adm-action-row">
                          {(sub.Status === 'pending' || sub.Status === 'running') && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() => handleKillSubmission(sub.ID)}
                            >
                              Kill
                            </button>
                          )}
                          <button
                            type="button"
                            className="adm-btn adm-btn-ghost adm-btn-sm"
                            onClick={() => handleResendSubmission(sub.ID)}
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {!loadingSubs && filteredSubs.length === 0 && (
              <EmptyState message="No submissions match the current filter." />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIVITY LOGS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="adm-tab-body">
          <div className="adm-toolbar">
            <div className="adm-toolbar-left">
              <span className="adm-toolbar-title">Activity Log</span>
              <span className="adm-toolbar-count">{activityLogs.length} events</span>
            </div>
            <div className="adm-toolbar-right">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={loadLogs}>
                Refresh
              </button>
            </div>
          </div>

          <div className="adm-table-shell">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>IP Address</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  : activityLogs.map(log => (
                    <tr key={log.id} className="adm-tr">
                      <td className="adm-td-mono adm-td-muted adm-td-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="adm-td-mono adm-td-sm">@{log.username || '—'}</td>
                      <td><ActionChip action={log.action} /></td>
                      <td className="adm-td-mono adm-td-sm adm-td-muted">{log.ip_address || '—'}</td>
                      <td className="adm-td-muted adm-td-sm adm-td-truncate">{log.user_agent || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {!loadingLogs && activityLogs.length === 0 && (
              <EmptyState message="No activity recorded yet. Events appear after users log in or submit code." />
            )}
          </div>
        </div>
      )}

      {/* ── Edit User Modal (ponytail: reusable modal interface) ────────────────── */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <button type="button" className="modal-close-btn" onClick={() => setEditingUser(null)} aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div className="modal-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', alignItems: 'stretch', width: '100%', marginBottom: '20px' }}>
              <div>
                <h3 className="modal-title-text" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', margin: '0 0 4px 0', textAlign: 'left' }}>Edit User</h3>
                <p className="modal-message-text" style={{ fontSize: '0.875rem', color: 'var(--text)', margin: 0, textAlign: 'left' }}>Update details for @{editingUser.username}</p>
              </div>
              
              <div className="adm-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="adm-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Role</label>
                <select
                  className="form-control"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions-wrapper" style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary modal-btn-cancel" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary modal-btn-confirm" onClick={handleSaveEdit} disabled={updatingUser}>
                  {updatingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
