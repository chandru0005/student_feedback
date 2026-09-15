import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected route wrapper
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import SubmitFeedbackPage from './pages/student/SubmitFeedbackPage';
import FeedbackHistoryPage from './pages/student/FeedbackHistoryPage';
import StudentSubjectsPage from './pages/student/StudentSubjectsPage';
import ProfilePage from './pages/student/ProfilePage';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyFeedbackPage from './pages/faculty/FacultyFeedbackPage';
import FacultySubjectsPage from './pages/faculty/FacultySubjectsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageAcademicsPage from './pages/admin/ManageAcademicsPage';
import FeedbackModerationPage from './pages/admin/FeedbackModerationPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import ReportsPage from './pages/admin/ReportsPage';

import NotFoundPage from './pages/NotFoundPage';

// Root redirector based on user role
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/submit" element={<SubmitFeedbackPage />} />
            <Route path="/student/history" element={<FeedbackHistoryPage />} />
            <Route path="/student/subjects" element={<StudentSubjectsPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
          </Route>

          {/* Faculty Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/feedback" element={<FacultyFeedbackPage />} />
            <Route path="/faculty/subjects" element={<FacultySubjectsPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/admin/academics" element={<ManageAcademicsPage />} />
            <Route path="/admin/feedback" element={<FeedbackModerationPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
