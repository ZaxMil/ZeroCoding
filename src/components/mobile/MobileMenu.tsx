import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  Home,
  Search,
  BookOpen,
  Users,
  Settings,
  User,
  Heart,
  History,
  Bell,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';

interface MobileMenuProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    avatar: string;
    email: string;
  };
  unreadNotifications?: number;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isAuthenticated = false,
  user,
  unreadNotifications = 0
}) => {
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { icon: Home, label: 'Home', href: '/', count: 0 },
    { icon: Search, label: 'Search', href: '/search', count: 0 },
    { icon: BookOpen, label: 'Library', href: '/library', count: 0 },
    { icon: Users, label: 'Community', href: '/community', count: 0 }
  ];

  const userMenuItems = [
    { icon: User, label: 'Profile', href: '/profile', count: 0 },
    { icon: Heart, label: 'Favorites', href: '/favorites', count: 0 },
    { icon: History, label: 'Reading History', href: '/history', count: 0 },
    { icon: Bell, label: 'Notifications', href: '/notifications', count: unreadNotifications },
    { icon: Settings, label: 'Settings', href: '/settings', count: 0 }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b">
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Navigation
              </div>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* User Menu (when authenticated) */}
            {isAuthenticated && (
              <div className="p-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Account
                </div>
                {userMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* App Settings */}
            <div className="p-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                App Settings
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full text-left"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="flex-1">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          {isAuthenticated && (
            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          )}

          {/* App Info */}
          <div className="p-4 border-t bg-muted/30">
            <div className="text-center">
              <div className="text-sm font-semibold">KodeLex Reader</div>
              <div className="text-xs text-muted-foreground">Version 1.0.0</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};