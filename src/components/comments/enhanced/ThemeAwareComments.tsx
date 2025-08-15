import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Eye,
  EyeOff,
  Contrast,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeAwareCommentsProps {
  children: React.ReactNode;
  showThemeControls?: boolean;
  className?: string;
}

export const ThemeAwareComments: React.FC<ThemeAwareCommentsProps> = ({
  children,
  showThemeControls = true,
  className
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    // Prevent hydration mismatch by returning a neutral state
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <div className={cn(
      'relative transition-all duration-300 ease-in-out',
      // Apply theme-specific styling
      resolvedTheme === 'dark' 
        ? 'bg-gradient-to-br from-background via-background/95 to-background/90' 
        : 'bg-gradient-to-br from-background via-background/98 to-background/95',
      // High contrast mode
      highContrast && 'contrast-125',
      // Reduced motion mode
      reducedMotion && '[&_*]:!transition-none [&_*]:!animate-none',
      className
    )}>

      {/* Comments Content with Theme-Aware Styling */}
      <div className={cn(
        'space-y-4',
        // Theme-specific content styling
        resolvedTheme === 'dark' && [
          '[&_.comment-card]:bg-card/50',
          '[&_.comment-card]:border-border/20',
          '[&_.comment-content]:text-foreground/90'
        ],
        resolvedTheme === 'light' && [
          '[&_.comment-card]:bg-card/80',
          '[&_.comment-card]:border-border/30',
          '[&_.comment-content]:text-foreground'
        ],
        // High contrast adjustments
        highContrast && [
          '[&_.comment-card]:border-border',
          '[&_.comment-content]:text-foreground',
          '[&_button]:border-2'
        ],
        // Reduced motion adjustments
        reducedMotion && [
          '[&_*]:transition-none',
          '[&_*]:animate-none'
        ]
      )}>
        {children}
      </div>

      {/* Theme Change Animation Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 pointer-events-none opacity-0 transition-opacity duration-300',
          'theme-transition-overlay'
        )}
        style={{
          display: 'none' // Will be controlled by theme transitions
        }}
      />
    </div>
  );
};

// Hook for theme-aware styling
export const useThemeAwareStyles = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getCommentCardStyles = () => {
    if (!mounted) return '';
    
    return cn(
      'comment-card transition-all duration-200',
      resolvedTheme === 'dark' 
        ? 'bg-card/30 border-border/20 hover:bg-card/50' 
        : 'bg-card/70 border-border/30 hover:bg-card/90',
      'backdrop-blur-sm'
    );
  };

  const getCommentContentStyles = () => {
    if (!mounted) return '';
    
    return cn(
      'comment-content',
      resolvedTheme === 'dark' 
        ? 'text-foreground/90' 
        : 'text-foreground'
    );
  };

  const getReactionButtonStyles = (isActive: boolean = false) => {
    if (!mounted) return '';
    
    return cn(
      'transition-all duration-150',
      isActive 
        ? 'bg-primary/20 text-primary border-primary/30 scale-110' 
        : resolvedTheme === 'dark'
          ? 'bg-background/50 border-border/20 hover:bg-background/80'
          : 'bg-background/80 border-border/30 hover:bg-background',
      'hover:scale-105'
    );
  };

  return {
    mounted,
    resolvedTheme,
    getCommentCardStyles,
    getCommentContentStyles,
    getReactionButtonStyles
  };
};