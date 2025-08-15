import { useCallback } from 'react';

export function useScrollToElement() {
  const scrollToElement = useCallback((elementId: string, options?: ScrollIntoViewOptions) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        ...options
      });
    }
  }, []);

  const scrollToSelector = useCallback((selector: string, options?: ScrollIntoViewOptions) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        ...options
      });
    }
  }, []);

  return { scrollToElement, scrollToSelector };
}