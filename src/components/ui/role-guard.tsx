import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const RoleGuard = ({ children, allowedRoles = [] }: RoleGuardProps) => {
  const { userProfile } = useAuth();
  
  if (!userProfile?.role || !allowedRoles.includes(userProfile.role)) {
    return null;
  }
  
  return <>{children}</>;
};

interface AdminOnlyProps {
  children: ReactNode;
}

export const AdminOnly = ({ children }: AdminOnlyProps) => {
  const { userProfile } = useAuth();
  
  if (userProfile?.role !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
};

interface AuthorOnlyProps {
  children: ReactNode;
}

export const AuthorOnly = ({ children }: AuthorOnlyProps) => {
  const { userProfile } = useAuth();
  
  if (userProfile?.role !== 'author' && userProfile?.role !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
};

export default RoleGuard;