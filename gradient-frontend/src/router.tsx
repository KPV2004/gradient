import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ProblemList } from './components/ProblemList';
import { ProblemDetail } from './components/ProblemDetail';
import { ProblemForm } from './components/ProblemForm';
import { TestcaseManager } from './components/TestcaseManager';
import { SubmissionList } from './components/SubmissionList';
import { ContestList } from './components/ContestList';
import { ContestDetail } from './components/ContestDetail';
import { AdminDashboard } from './components/AdminDashboard';

function ProblemsRoute(): JSX.Element {
  const navigate = useNavigate();
  return (
    <ProblemList
      onSelectProblem={(id) => navigate(`/problems/${id}`)}
      onCreateProblem={() => navigate('/problems/new')}
      onEditProblem={(id) => navigate(`/problems/${id}/edit`)}
      onManageTestcases={(id) => navigate(`/problems/${id}/testcases`)}
    />
  );
}

function ProblemDetailRoute(): JSX.Element {
  const { id } = useParams<{ readonly id: string }>();
  const navigate = useNavigate();
  
  const query = new URLSearchParams(window.location.search);
  const from = query.get('from');
  
  const handleBack = () => {
    if (from === 'contests') {
      navigate('/contests');
    } else if (from === 'submissions') {
      navigate('/submissions');
    } else {
      navigate('/problems');
    }
  };

  return <ProblemDetail problemId={id ?? ''} onBack={handleBack} />;
}

function ProblemNewRoute(): JSX.Element {
  const navigate = useNavigate();
  return <ProblemForm onSave={() => navigate('/problems')} onCancel={() => navigate('/problems')} />;
}

function ProblemEditRoute(): JSX.Element {
  const { id } = useParams<{ readonly id: string }>();
  const navigate = useNavigate();
  return <ProblemForm problemId={id ?? ''} onSave={() => navigate('/problems')} onCancel={() => navigate('/problems')} />;
}

function TestcasesRoute(): JSX.Element {
  const { id } = useParams<{ readonly id: string }>();
  const navigate = useNavigate();
  return <TestcaseManager problemId={id ?? ''} onBack={() => navigate('/problems')} />;
}

function SubmissionsRoute(): JSX.Element {
  const navigate = useNavigate();
  return <SubmissionList onSelectProblem={(id) => navigate(`/problems/${id}?from=submissions`)} />;
}

function ContestsRoute(): JSX.Element {
  const navigate = useNavigate();
  return <ContestList onEnterContest={(id) => navigate(`/contests/${id}`)} />;
}

function ContestDetailRoute(): JSX.Element {
  const { id } = useParams<{ readonly id: string }>();
  const navigate = useNavigate();
  return (
    <ContestDetail
      contestId={id ?? ''}
      onBack={() => navigate('/contests')}
      onSelectProblem={(probId) => navigate(`/problems/${probId}?from=contest-${id}`)}
    />
  );
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'problems', element: <ProblemsRoute /> },
      { path: 'problems/new', element: <ProblemNewRoute /> },
      { path: 'problems/:id', element: <ProblemDetailRoute /> },
      { path: 'problems/:id/edit', element: <ProblemEditRoute /> },
      { path: 'problems/:id/testcases', element: <TestcasesRoute /> },
      { path: 'submissions', element: <SubmissionsRoute /> },
      { path: 'contests', element: <ContestsRoute /> },
      { path: 'contests/:id', element: <ContestDetailRoute /> },
      { path: 'admin', element: <AdminDashboard /> },
      { path: '', element: <Navigate to="/problems" replace /> }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/problems" replace />
  }
];
