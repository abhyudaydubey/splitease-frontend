import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuth, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // This effect is primarily for handling the case where auth state might change
    // *after* initial load, or to trigger the initial check if needed.
    // However, the main rendering logic below handles the immediate display/redirect.
    
    // Trigger a check if not loading and not authenticated, just to be sure,
    // especially if the component mounts without AuthProvider having finished its initial check.
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      checkAuth().then(isValid => {
        if (!isValid) {
          const isLogoutAction = sessionStorage.getItem('isLogoutAction') === 'true';
          if (!isLogoutAction) {
            toast.error('Please log in to access this page');
          }
        }
      });
    }
  }, [isLoading, isAuthenticated, location.pathname, checkAuth]);

  // 1. Handle Loading State:
  // If the authentication check is in progress (initial load or subsequent check),
  // show the loading spinner.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Handle Not Authenticated State (After Loading):
  // If loading is finished and the user is NOT authenticated, redirect to login.
  if (!isAuthenticated) {
    // Only redirect if not already on the login page to prevent loops.
    if (location.pathname !== '/login') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // If already on login page and not authenticated, allow login page to render
    // This case might not be hit if App.tsx routes login outside ProtectedRoute, which is typical.
    return null; 
  }

  // 3. Handle Authenticated State (After Loading):
  // If loading is finished and the user IS authenticated, render the child component.
  return <>{children}</>;
};

export default ProtectedRoute; 