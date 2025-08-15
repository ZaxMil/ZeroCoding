import { useEffect, useRef } from 'react';

interface SwipeNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enabled?: boolean;
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enabled = true,
  threshold = 150,
  restraint = 100,
  allowedTime = 300
}: SwipeNavigationProps) => {
  const touchRef = useRef<HTMLElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (!enabled || !touchRef.current) return;

    const element = touchRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const distX = touch.clientX - startX.current;
      const distY = touch.clientY - startY.current;
      const elapsedTime = Date.now() - startTime.current;

      // Check if swipe meets criteria
      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          // Horizontal swipe
          if (distX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          // Vertical swipe
          if (distY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint, allowedTime]);

  return touchRef;
};