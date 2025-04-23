import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import MainLayout from './components/MainLayout';
import GroupDetailsPage from './pages/GroupDetailsPage';
import { AuthProvider } from './contexts/AuthProvider';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
            
            {/* MainLayout wraps Dashboard and GroupDetailsPage */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Support backward compatibility for old URL format */}
              <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
              {/* New clean URL format without showing the ID */}
              <Route path="/g/:groupName" element={<GroupDetailsPage />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;