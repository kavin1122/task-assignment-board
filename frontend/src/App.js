import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './hooks/useAuth';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Unauthorized from './pages/Unauthorized';
import Profile from './pages/Profile';
import TaskAttempt from './pages/TaskAttempt';
import TaskSubmissionView from './pages/TaskSubmissionView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className={`app-wrapper ${isAuthenticated ? 'with-sidebar' : ''}`}>
      <Navigation />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin-only Routes */}
          <Route path="/admin-dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />

          {/* Member-only Routes */}
          <Route path="/user-dashboard" element={<PrivateRoute requiredRole="member"><UserDashboard /></PrivateRoute>} />

          {/* Protected Routes (both admin and member) */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/project/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/task/:id/attempt" element={<PrivateRoute><TaskAttempt /></PrivateRoute>} />
          <Route path="/task/:id/view" element={<PrivateRoute><TaskSubmissionView /></PrivateRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
