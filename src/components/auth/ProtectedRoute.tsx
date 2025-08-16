import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'author' | 'editor' | 'member' | 'uploader' | 'seo_manager';
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireRole 
}: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if specific role is required
  if (requireRole && userProfile?.role !== requireRole) {
    // If user doesn't have required role, redirect based on their current role
    if (!userProfile) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    
    // Redirect to appropriate dashboard based on user role
    const roleDashboards = {
      admin: '/admin',
      author: '/author',
      editor: '/editor',
      uploader: '/uploader',
      seo_manager: '/seo',
      member: '/'
    };
    
    return <Navigate to={roleDashboards[userProfile.role] || '/'} replace />;
  }

  return <>{children}</>;
};