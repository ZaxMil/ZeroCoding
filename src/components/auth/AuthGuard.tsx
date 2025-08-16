import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireRole?: 'admin' | 'author' | 'editor' | 'member' | 'uploader' | 'seo_manager';
  showFallback?: boolean;
}

export const AuthGuard = ({ 
  children, 
  fallback,
  requireRole,
  showFallback = true 
}: AuthGuardProps) => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Check authentication
  if (!user) {
    if (fallback) return <>{fallback}</>;
    
    if (!showFallback) return null;
    
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <span>You need to be signed in to access this feature.</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/auth')}
            className="ml-4"
          >
            Sign In
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Check role requirement
  if (requireRole && userProfile?.role !== requireRole) {
    if (fallback) return <>{fallback}</>;
    
    if (!showFallback) return null;
    
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/10">
        <User className="h-4 w-4 text-red-600" />
        <AlertDescription>
          You don't have permission to access this feature. Required role: {requireRole}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};