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
    // Check authentication on mount and when the location changes
    const validateAuth = async () => {
      // Skip validation if we're already redirecting to login
      if (location.pathname === '/login') return;
      
      const isValid = await checkAuth();
      if (!isValid && !isLoading) {
        // Only show the toast if we're not already on the login page
        const isLogoutAction = sessionStorage.getItem('isLogoutAction') === 'true';
        if (!isLogoutAction) {
          toast.error('Please log in to access this page');
        }
      }
    };
    
    validateAuth();
  }, [location.pathname, checkAuth, isLoading]);

  // If loading, show nothing (or a loading spinner if you prefer)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only redirect when loading is complete and user is not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute; 