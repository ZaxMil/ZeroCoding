import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface KeyboardAction {
  key: string;
  timestamp: number;
}

export const KeyboardVisualFeedback = () => {
  const [activeActions, setActiveActions] = useState<KeyboardAction[]>([]);

  useEffect(() => {
    const handleKeyboardAction = (e: CustomEvent) => {
      const { key, timestamp } = e.detail;
      
      setActiveActions(prev => {
        // Remove duplicates and old actions
        const filtered = prev.filter(action => 
          action.key !== key && Date.now() - action.timestamp < 2000
        );
        return [...filtered, { key, timestamp }];
      });
    };

    const handleKeyboardActionEnd = (e: CustomEvent) => {
      const { key } = e.detail;
      setTimeout(() => {
        setActiveActions(prev => prev.filter(action => action.key !== key));
      }, 150);
    };

    window.addEventListener('keyboardAction', handleKeyboardAction as EventListener);
    window.addEventListener('keyboardActionEnd', handleKeyboardActionEnd as EventListener);

    return () => {
      window.removeEventListener('keyboardAction', handleKeyboardAction as EventListener);
      window.removeEventListener('keyboardActionEnd', handleKeyboardActionEnd as EventListener);
    };
  }, []);

  // Auto cleanup old actions
  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveActions(prev => 
        prev.filter(action => Date.now() - action.timestamp < 2000)
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  if (activeActions.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        {activeActions.map((action) => (
          <div
            key={`${action.key}-${action.timestamp}`}
            className={cn(
              "px-3 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-lg",
              "animate-scale-in opacity-90 backdrop-blur-sm",
              "text-sm font-medium border border-primary/20"
            )}
            style={{
              animation: 'keyboardFeedback 0.8s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background/20 rounded text-xs">
                {action.key}
              </kbd>
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes keyboardFeedback {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1.05);
          }
          80% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-5px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};