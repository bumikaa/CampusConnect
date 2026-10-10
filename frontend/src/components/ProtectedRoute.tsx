import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, showToast } = useApp();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    showToast('Please log in to access this portal.', 'error');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const roleLabel = user.role === 'STUDENT' ? 'User / Student' : user.role === 'DELIVERY_PARTNER' ? 'Delivery Person' : 'Campus Operator';
    showToast(`Access Denied: Logged in as ${roleLabel}. You do not have permission to access this page.`, 'error');

    // Redirect to default home page for their role
    const fallbackPath = user.role === 'STUDENT' ? '/student' : user.role === 'DELIVERY_PARTNER' ? '/partner' : '/analytics';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
