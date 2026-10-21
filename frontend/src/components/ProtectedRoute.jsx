import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that requires user to be authenticated.
 * If not authenticated, redirects to the Home page ('/').
 * If allowedRole is specified and user does not have that role,
 * redirects to their role's primary hub.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-slate-400">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Verifying authentication...</span>
      </div>
    );
  }

  // Not authenticated: strictly redirect to Home landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role restriction enforcement
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/jobs'} replace />;
  }

  return children;
}
