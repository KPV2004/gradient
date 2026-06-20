import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useGradient } from '../context/GradientContext';

export function Layout(): JSX.Element {
  const { token } = useGradient();

  // Route guard: Redirect to login if user is not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="app-layout-main">
        <Outlet />
      </main>
      <footer className="app-layout-footer">
        <p>© 2026 Gradient Platform. Dynamic Code Sandbox & Sandbox compiler container grader.</p>
      </footer>
    </>
  );
}
