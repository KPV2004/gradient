import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GradientProvider } from './context/GradientContext';
import { routes } from './router';

// Initialize React Router with automated folder routes mapping
const router = createBrowserRouter(routes);

export default function App(): JSX.Element {
  return (
    <GradientProvider>
      <RouterProvider router={router} />
    </GradientProvider>
  );
}
