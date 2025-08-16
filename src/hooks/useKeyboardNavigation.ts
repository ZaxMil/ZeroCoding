import { useEffect, useCallback, useRef } from 'react';
import { useScrollToElement } from './useScrollToElement';

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'navigation' | 'controls' | 'shortcuts';
  action: () => void;
  enabled: boolean;
  modifiers?: {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
  };
}

export interface KeyboardNavigationSettings {
  enabled: boolean;
  visualFeedback: boolean;
  shortcuts: Record<string, boolean>;
}

interface UseKeyboardNavigationProps {
  // Navigation functions
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  
  // Control functions
  onToggleFullscreen?: () => void;
  onToggleSettings?: () => void;
  onToggleBookmark?: () => void;
  onToggleTheme?: () => void;
  onReloadChapter?: () => void;
  onToggleChapterList?: () => void;
  onFocusSearch?: () => void;
  onShowHelp?: () => void;
  onCloseModal?: () => void;
  
  // Chapter navigation
  onJumpToStart?: () => void;
  onJumpToEnd?: () => void;
  onJumpToPercentage?: (percentage: number) => void;
  
  // Settings
  settings?: KeyboardNavigationSettings;
  disabled?: boolean;
  scope?: 'reader' | 'global';
}

const defaultSettings: KeyboardNavigationSettings = {
  enabled: true,
  visualFeedback: true,
  shortcuts: {
    'ArrowLeft': true,
    'ArrowRight': true,
    'ArrowUp': true,
    'ArrowDown': true,
    ' ': true,
    'f': true,
    'm': true,
    'b': true,
    't': true,
    'g': true,
    'e': true,
    'n': true,
    'p': true,
    'r': true,
    'c': true,
    '/': true,
    '?': true,
    'Escape': true
  }
};

export const useKeyboardNavigation = ({
  onPrevPage,
  onNextPage,
  onPrevChapter,
  onNextChapter,
  onScrollUp,
  onScrollDown,
  onToggleFullscreen,
  onToggleSettings,
  onToggleBookmark,
  onToggleTheme,
  onReloadChapter,
  onToggleChapterList,
  onFocusSearch,
  onShowHelp,
  onCloseModal,
  onJumpToStart,
  onJumpToEnd,
  onJumpToPercentage,
  settings = defaultSettings,
  disabled = false,
  scope = 'reader'
}: UseKeyboardNavigationProps) => {
  const { scrollToElement } = useScrollToElement();
  const activeKeyRef = useRef<string | null>(null);
  const feedbackTimeoutRef = useRef<number>();

  // Show visual feedback for keyboard actions
  const showVisualFeedback = useCallback((key: string) => {
    if (!settings.visualFeedback) return;
    
    activeKeyRef.current = key;
    
    // Dispatch custom event for visual feedback
    window.dispatchEvent(new CustomEvent('keyboardAction', {
      detail: { key, timestamp: Date.now() }
    }));
    
    // Clear feedback after animation
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      activeKeyRef.current = null;
      window.dispatchEvent(new CustomEvent('keyboardActionEnd', {
        detail: { key }
      }));
    }, 200);
  }, [settings.visualFeedback]);

  // Handle percentage jumps (1-9 keys)
  const handlePercentageJump = useCallback((num: number) => {
    if (!settings.shortcuts[num.toString()]) return;
    const percentage = num * 10;
    onJumpToPercentage?.(percentage);
    showVisualFeedback(`${num}`);
  }, [onJumpToPercentage, settings.shortcuts, showVisualFeedback]);

  // Get all keyboard shortcuts for help panel
  const getShortcuts = useCallback((): KeyboardShortcut[] => [
    // Navigation
    {
      key: '← / →',
      description: 'Previous / Next page (single/double mode)',
      category: 'navigation',
      action: () => {},
      enabled: settings.shortcuts['ArrowLeft'] && settings.shortcuts['ArrowRight']
    },
    {
      key: '↑ / ↓',
      description: 'Scroll up / down (webtoon mode)',
      category: 'navigation',
      action: () => {},
      enabled: settings.shortcuts['ArrowUp'] && settings.shortcuts['ArrowDown']
    },
    {
      key: 'Space',
      description: 'Next page / Scroll down',
      category: 'navigation',
      action: () => {},
      enabled: settings.shortcuts[' ']
    },
    {
      key: 'Shift + Space',
      description: 'Previous page / Scroll up',
      category: 'navigation',
      action: () => {},
      enabled: settings.shortcuts[' '],
      modifiers: { shift: true }
    },
    {
      key: '1-9',
      description: 'Jump to 10%-90% of chapter',
      category: 'navigation',
      action: () => {},
      enabled: true
    },
    
    // Chapter Navigation
    {
      key: 'G',
      description: 'Go to beginning of chapter',
      category: 'navigation',
      action: onJumpToStart || (() => {}),
      enabled: settings.shortcuts['g'] && !!onJumpToStart
    },
    {
      key: 'E',
      description: 'Go to end of chapter',
      category: 'navigation',
      action: onJumpToEnd || (() => {}),
      enabled: settings.shortcuts['e'] && !!onJumpToEnd
    },
    {
      key: 'N',
      description: 'Next chapter',
      category: 'navigation',
      action: onNextChapter || (() => {}),
      enabled: settings.shortcuts['n'] && !!onNextChapter
    },
    {
      key: 'P',
      description: 'Previous chapter',
      category: 'navigation',
      action: onPrevChapter || (() => {}),
      enabled: settings.shortcuts['p'] && !!onPrevChapter
    },
    
    // Controls
    {
      key: 'F',
      description: 'Toggle fullscreen',
      category: 'controls',
      action: onToggleFullscreen || (() => {}),
      enabled: settings.shortcuts['f'] && !!onToggleFullscreen
    },
    {
      key: 'M',
      description: 'Toggle settings menu',
      category: 'controls',
      action: onToggleSettings || (() => {}),
      enabled: settings.shortcuts['m'] && !!onToggleSettings
    },
    {
      key: 'B',
      description: 'Toggle bookmark',
      category: 'controls',
      action: onToggleBookmark || (() => {}),
      enabled: settings.shortcuts['b'] && !!onToggleBookmark
    },
    {
      key: 'T',
      description: 'Toggle theme',
      category: 'controls',
      action: onToggleTheme || (() => {}),
      enabled: settings.shortcuts['t'] && !!onToggleTheme
    },
    {
      key: 'R',
      description: 'Reload chapter',
      category: 'controls',
      action: onReloadChapter || (() => {}),
      enabled: settings.shortcuts['r'] && !!onReloadChapter
    },
    {
      key: 'C',
      description: 'Toggle chapter list',
      category: 'controls',
      action: onToggleChapterList || (() => {}),
      enabled: settings.shortcuts['c'] && !!onToggleChapterList
    },
    
    // Shortcuts
    {
      key: '/',
      description: 'Focus search',
      category: 'shortcuts',
      action: onFocusSearch || (() => {}),
      enabled: settings.shortcuts['/'] && !!onFocusSearch
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      category: 'shortcuts',
      action: onShowHelp || (() => {}),
      enabled: settings.shortcuts['?'] && !!onShowHelp
    },
    {
      key: 'Esc',
      description: 'Close modal/panel',
      category: 'shortcuts',
      action: onCloseModal || (() => {}),
      enabled: settings.shortcuts['Escape'] && !!onCloseModal
    }
  ], [
    settings.shortcuts,
    onPrevPage, onNextPage, onPrevChapter, onNextChapter,
    onToggleFullscreen, onToggleSettings, onToggleBookmark, onToggleTheme,
    onReloadChapter, onToggleChapterList, onFocusSearch, onShowHelp,
    onCloseModal, onJumpToStart, onJumpToEnd
  ]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || !settings.enabled) return;
    
    // Enhanced input detection - disable shortcuts when user is typing
    const target = e.target as HTMLElement;
    const isTypingInInput = 
      target instanceof HTMLInputElement || 
      target instanceof HTMLTextAreaElement || 
      target.contentEditable === 'true' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[data-comment-input]') ||
      target.closest('[role="textbox"]') ||
      target.closest('.comment-input') ||
      target.closest('.search-input') ||
      target.closest('[data-disable-shortcuts]');
    
    if (isTypingInInput) {
      return;
    }

    const key = e.key;
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isAlt = e.altKey;

    // Handle modifiers appropriately
    if (isCtrl || isAlt) return; // Skip Ctrl/Alt combinations

    // Check if shortcut is enabled
    if (!settings.shortcuts[key]) return;

    switch (key) {
      // Navigation keys
      case 'ArrowLeft':
        e.preventDefault();
        onPrevPage?.();
        showVisualFeedback('←');
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        onNextPage?.();
        showVisualFeedback('→');
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        onScrollUp?.();
        showVisualFeedback('↑');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        onScrollDown?.();
        showVisualFeedback('↓');
        break;
        
      case ' ':
        e.preventDefault();
        if (isShift) {
          if (onPrevPage) {
            onPrevPage();
          } else if (onScrollUp) {
            onScrollUp();
          }
          showVisualFeedback('Shift+Space');
        } else {
          if (onNextPage) {
            onNextPage();
          } else if (onScrollDown) {
            onScrollDown();
          }
          showVisualFeedback('Space');
        }
        break;

      // Number keys for percentage jumps
      case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9':
        e.preventDefault();
        handlePercentageJump(parseInt(key));
        break;

      // Chapter navigation
      case 'g':
      case 'G':
        e.preventDefault();
        onJumpToStart?.();
        showVisualFeedback('G');
        break;
        
      case 'e':
      case 'E':
        e.preventDefault();
        onJumpToEnd?.();
        showVisualFeedback('E');
        break;
        
      case 'n':
      case 'N':
        e.preventDefault();
        onNextChapter?.();
        showVisualFeedback('N');
        break;
        
      case 'p':
      case 'P':
        e.preventDefault();
        onPrevChapter?.();
        showVisualFeedback('P');
        break;

      // Control keys
      case 'f':
      case 'F':
        e.preventDefault();
        onToggleFullscreen?.();
        showVisualFeedback('F');
        break;
        
      case 'm':
      case 'M':
        e.preventDefault();
        onToggleSettings?.();
        showVisualFeedback('M');
        break;
        
      case 'b':
      case 'B':
        e.preventDefault();
        onToggleBookmark?.();
        showVisualFeedback('B');
        break;
        
      case 't':
      case 'T':
        e.preventDefault();
        onToggleTheme?.();
        showVisualFeedback('T');
        break;
        
      case 'r':
      case 'R':
        e.preventDefault();
        onReloadChapter?.();
        showVisualFeedback('R');
        break;
        
      case 'c':
      case 'C':
        e.preventDefault();
        onToggleChapterList?.();
        showVisualFeedback('C');
        break;

      // Special keys
      case '/':
        e.preventDefault();
        onFocusSearch?.();
        showVisualFeedback('/');
        break;
        
      case '?':
        e.preventDefault();
        onShowHelp?.();
        showVisualFeedback('?');
        break;
        
      case 'Escape':
        e.preventDefault();
        onCloseModal?.();
        showVisualFeedback('Esc');
        break;
    }
  }, [
    disabled, settings, onPrevPage, onNextPage, onScrollUp, onScrollDown,
    onToggleFullscreen, onToggleSettings, onToggleBookmark, onToggleTheme,
    onReloadChapter, onToggleChapterList, onFocusSearch, onShowHelp,
    onCloseModal, onJumpToStart, onJumpToEnd, onPrevChapter, onNextChapter,
    handlePercentageJump, showVisualFeedback
  ]);

  useEffect(() => {
    if (scope === 'reader') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, scope]);

  return {
    shortcuts: getShortcuts(),
    activeKey: activeKeyRef.current,
    showVisualFeedback,
    settings
  };
};