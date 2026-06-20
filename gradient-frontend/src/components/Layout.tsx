import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout(): JSX.Element {
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
