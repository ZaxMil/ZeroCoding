import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniReaderModeProps {
  onToggle?: (isMini: boolean) => void;
}

export const MiniReaderMode = ({ onToggle }: MiniReaderModeProps) => {
  const [isMiniMode, setIsMiniMode] = useState(false);

  const toggleMiniMode = () => {
    const newMode = !isMiniMode;
    setIsMiniMode(newMode);
    onToggle?.(newMode);
    
    // Apply mini mode styles to body
    if (newMode) {
      document.body.classList.add('mini-reader-mode');
    } else {
      document.body.classList.remove('mini-reader-mode');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMiniMode}
      className="fixed top-4 right-4 z-50"
    >
      {isMiniMode ? (
        <Maximize2 className="h-4 w-4" />
      ) : (
        <Minimize2 className="h-4 w-4" />
      )}
      <span className="ml-2">
        {isMiniMode ? 'Exit Mini' : 'Mini Mode'}
      </span>
    </Button>
  );
};

// Add CSS for mini reader mode
const miniReaderStyles = `
.mini-reader-mode {
  .reader-header,
  .reader-sidebar,
  .reader-footer,
  .reader-controls {
    display: none !important;
  }
  
  .reader-content {
    padding: 0 !important;
    margin: 0 !important;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = miniReaderStyles;
  document.head.appendChild(styleSheet);
}