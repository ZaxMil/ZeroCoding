import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  Search,
  BookOpen,
  Users,
  User
} from 'lucide-react';

interface MobileBottomNavProps {
  unreadNotifications?: number;
  isAuthenticated?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  unreadNotifications = 0,
  isAuthenticated = false
}) => {
  const location = useLocation();

  const navItems = [
    { 
      icon: Home, 
      label: 'Home', 
      href: '/',
      active: location.pathname === '/'
    },
    { 
      icon: Search, 
      label: 'Search', 
      href: '/search',
      active: location.pathname === '/search'
    },
    { 
      icon: BookOpen, 
      label: 'Library', 
      href: '/library',
      active: location.pathname === '/library'
    },
    { 
      icon: Users, 
      label: 'Community', 
      href: '/community',
      active: location.pathname === '/community'
    },
    { 
      icon: User, 
      label: isAuthenticated ? 'Profile' : 'Login', 
      href: isAuthenticated ? '/profile' : '/login',
      active: isAuthenticated ? location.pathname === '/profile' : location.pathname === '/login',
      count: isAuthenticated ? unreadNotifications : 0
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'text-primary bg-primary/10 scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${item.active ? 'scale-110' : ''} transition-transform`} />
                {item.count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium ${item.active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Safe area for notched devices */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </div>
  );
};