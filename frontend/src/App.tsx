import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { PartnerDashboard } from './pages/PartnerDashboard';
import { BulkProcessingPage } from './pages/BulkProcessingPage';
import { RecoveryCenterPage } from './pages/RecoveryCenterPage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const HomeRoute: React.FC = () => {
  const { user, isAuthenticated } = useApp();
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }
  if (user.role === 'STUDENT') {
    return <Navigate to="/student" replace />;
  } else if (user.role === 'DELIVERY_PARTNER') {
    return <Navigate to="/partner" replace />;
  } else {
    return <Navigate to="/analytics" replace />;
  }
};

export const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-amazon-light font-sans text-gray-900 selection:bg-amazon-orange selection:text-amazon-navy">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomeRoute />} />

            {/* Role-Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentPortalPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/partner"
              element={
                <ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'OPERATIONS_MANAGER']}>
                  <PartnerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/processing"
              element={
                <ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'OPERATIONS_MANAGER']}>
                  <BulkProcessingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recovery"
              element={
                <ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'OPERATIONS_MANAGER']}>
                  <RecoveryCenterPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
