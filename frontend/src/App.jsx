/**
 * App Root — React Router with role-based routing
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import UploadAssignment from './pages/UploadAssignment';
import UploadNotes from './pages/UploadNotes';
import ViewAssignments from './pages/ViewAssignments';
import AdminPanel from './pages/AdminPanel';

/** Protected route — checks auth + optional role */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate home based on role
    const homes = { student: '/dashboard', teacher: '/upload-notes', admin: '/admin' };
    return <Navigate to={homes[user?.role] || '/login'} replace />;
  }

  return children;
}

/** Layout wrapper for authenticated pages */
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
}

/** Redirect based on role when hitting root */
function RoleRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const homes = { student: '/dashboard', teacher: '/upload-notes', admin: '/admin' };
  return <Navigate to={homes[user?.role] || '/login'} replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <RoleRedirect /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <RoleRedirect /> : <Register />}
      />

      {/* Student routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><Notes /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/submit-assignment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><UploadAssignment /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/upload-notes"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AppLayout><UploadNotes /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AppLayout><ViewAssignments /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AdminPanel /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
