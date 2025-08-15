import { useRef, useEffect, useState } from 'react';

interface DragScrollOptions {
  enabled?: boolean;
  direction?: 'vertical' | 'horizontal' | 'both';
  sensitivity?: number;
}

export const useDragScroll = ({
  enabled = true,
  direction = 'vertical',
  sensitivity = 1
}: DragScrollOptions = {}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      setIsDragging(true);
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = e.clientX - lastPositionRef.current.x;
      const deltaY = e.clientY - lastPositionRef.current.y;

      if (direction === 'vertical' || direction === 'both') {
        element.scrollTop -= deltaY * sensitivity;
      }
      
      if (direction === 'horizontal' || direction === 'both') {
        element.scrollLeft -= deltaX * sensitivity;
      }

      lastPositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handleMouseLeave = () => {
      if (isMouseDown) {
        handleMouseUp();
      }
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      isMouseDown = true;
      setIsDragging(true);
      lastPositionRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMouseDown || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPositionRef.current.x;
      const deltaY = touch.clientY - lastPositionRef.current.y;

      if (direction === 'vertical' || direction === 'both') {
        element.scrollTop -= deltaY * sensitivity;
      }
      
      if (direction === 'horizontal' || direction === 'both') {
        element.scrollLeft -= deltaX * sensitivity;
      }

      lastPositionRef.current = { x: touch.clientX, y: touch.clientY };
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    // Set initial cursor
    element.style.cursor = 'grab';

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      element.style.cursor = '';
      element.style.userSelect = '';
    };
  }, [enabled, direction, sensitivity]);

  return { elementRef, isDragging };
};