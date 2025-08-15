import { useEffect, useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

interface VerticalScrollEnforcementProps {
  onModeChange?: (isVerticalOnly: boolean) => void;
}

export const VerticalScrollEnforcement = ({ onModeChange }: VerticalScrollEnforcementProps) => {
  const [isVerticalOnly, setIsVerticalOnly] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const saved = localStorage.getItem('manga_vertical_scroll_only');
    if (saved !== null) {
      const verticalOnly = JSON.parse(saved);
      setIsVerticalOnly(verticalOnly);
      onModeChange?.(verticalOnly);
    }
  }, [onModeChange]);

  const handleToggle = (enabled: boolean) => {
    setIsVerticalOnly(enabled);
    localStorage.setItem('manga_vertical_scroll_only', JSON.stringify(enabled));
    onModeChange?.(enabled);

    // Apply scroll behavior to reader
    if (enabled && isMobile) {
      document.body.classList.add('vertical-scroll-only');
    } else {
      document.body.classList.remove('vertical-scroll-only');
    }
  };

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4" />
        <div>
          <Label htmlFor="vertical-scroll">Vertical Scroll Only</Label>
          <p className="text-xs text-muted-foreground">
            Disable horizontal scrolling for better mobile reading
          </p>
        </div>
      </div>
      <Switch
        id="vertical-scroll"
        checked={isVerticalOnly}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};

// Hook for managing vertical scroll enforcement
export const useVerticalScrollEnforcement = () => {
  const [isVerticalOnly, setIsVerticalOnly] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const saved = localStorage.getItem('manga_vertical_scroll_only');
    if (saved !== null) {
      setIsVerticalOnly(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (isVerticalOnly && isMobile) {
      // Prevent horizontal scrolling
      const preventHorizontalScroll = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          const deltaX = Math.abs(touch.clientX - (touch.target as any).initialX);
          const deltaY = Math.abs(touch.clientY - (touch.target as any).initialY);
          
          if (deltaX > deltaY) {
            e.preventDefault();
          }
        }
      };

      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        (touch.target as any).initialX = touch.clientX;
        (touch.target as any).initialY = touch.clientY;
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', preventHorizontalScroll, { passive: false });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', preventHorizontalScroll);
      };
    }
  }, [isVerticalOnly, isMobile]);

  return { isVerticalOnly, setIsVerticalOnly };
};

// CSS for vertical scroll enforcement
const verticalScrollStyles = `
.vertical-scroll-only {
  overflow-x: hidden !important;
}

.vertical-scroll-only .reader-container {
  touch-action: pan-y !important;
  overflow-x: hidden !important;
}

.vertical-scroll-only .reader-page {
  max-width: 100vw !important;
  overflow-x: hidden !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = verticalScrollStyles;
  document.head.appendChild(styleSheet);
}