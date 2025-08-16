import { useEffect, useRef, useCallback } from 'react';

interface GestureControlsProps {
  onNextPage: () => void;
  onPreviousPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  enabled: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  distance: number;
}

export const useGestureControls = ({
  onNextPage,
  onPreviousPage,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  enabled
}: GestureControlsProps) => {
  const touchDataRef = useRef<TouchData | null>(null);
  const pinchDataRef = useRef<{ distance: number; scale: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    if (e.touches.length === 1) {
      // Single touch
      const touch = e.touches[0];
      touchDataRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        distance: 0
      };
    } else if (e.touches.length === 2) {
      // Multi-touch for pinch
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      pinchDataRef.current = { distance, scale: 1 };
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    if (e.touches.length === 2 && pinchDataRef.current) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / pinchDataRef.current.distance;
      if (scale > 1.1) {
        onZoomIn();
        pinchDataRef.current.distance = distance;
      } else if (scale < 0.9) {
        onZoomOut();
        pinchDataRef.current.distance = distance;
      }
    }
  }, [enabled, onZoomIn, onZoomOut]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchDataRef.current) return;

    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const duration = endTime - touchDataRef.current.startTime;
    const deltaX = touch.clientX - touchDataRef.current.startX;
    const deltaY = touch.clientY - touchDataRef.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Tap gesture
    if (duration < 300 && distance < 10) {
      const screenWidth = window.innerWidth;
      const tapX = touch.clientX;
      
      if (tapX < screenWidth * 0.3) {
        onPreviousPage();
      } else if (tapX > screenWidth * 0.7) {
        onNextPage();
      } else {
        // Middle tap - toggle fullscreen
        onToggleFullscreen();
      }
    }
    
    // Swipe gesture
    else if (duration < 500 && distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          onPreviousPage();
        } else {
          onNextPage();
        }
      }
    }

    touchDataRef.current = null;
    pinchDataRef.current = null;
  }, [enabled, onNextPage, onPreviousPage, onToggleFullscreen]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        onPreviousPage();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
      case ' ':
        e.preventDefault();
        onNextPage();
        break;
      case '=':
      case '+':
        e.preventDefault();
        onZoomIn();
        break;
      case '-':
        e.preventDefault();
        onZoomOut();
        break;
      case 'f':
      case 'F':
      case 'F11':
        e.preventDefault();
        onToggleFullscreen();
        break;
    }
  }, [enabled, onNextPage, onPreviousPage, onZoomIn, onZoomOut, onToggleFullscreen]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);
};