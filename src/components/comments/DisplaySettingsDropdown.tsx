import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Settings,
  Eye,
  EyeOff,
  Contrast
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DisplaySettingsDropdown: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    
    mediaQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-3 w-3" />;
      case 'dark':
        return <Moon className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Auto';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border z-50">
        <DropdownMenuLabel>Display Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-4">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Theme
            </label>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'Auto' }
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex-1 flex items-center gap-2 transition-all',
                    theme === value && 'ring-2 ring-primary/20'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Accessibility
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contrast className="h-3 w-3" />
                  <span className="text-xs">High Contrast</span>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reducedMotion ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span className="text-xs">Reduced Motion</span>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Current Theme Info */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Current
            </label>
            <div className="flex items-center gap-2">
              {getThemeIcon()}
              <span className="text-sm font-medium">{getThemeLabel()}</span>
              <Badge variant="outline" className="text-xs">
                {resolvedTheme}
              </Badge>
            </div>
          </div>

          {/* Theme Preview */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-background border border-border"></div>
              <div className="w-4 h-4 rounded bg-primary"></div>
              <div className="w-4 h-4 rounded bg-secondary"></div>
              <div className="w-4 h-4 rounded bg-muted"></div>
              <div className="text-xs font-medium">
                Sample text
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};