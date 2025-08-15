import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard, Navigation, Settings, Zap } from 'lucide-react';
import { KeyboardShortcut } from '@/hooks/useKeyboardNavigation';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const KeyboardShortcutsHelp = ({ 
  shortcuts, 
  open, 
  onOpenChange,
  trigger 
}: KeyboardShortcutsHelpProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const categorizedShortcuts = {
    navigation: shortcuts.filter(s => s.category === 'navigation' && s.enabled),
    controls: shortcuts.filter(s => s.category === 'controls' && s.enabled),
    shortcuts: shortcuts.filter(s => s.category === 'shortcuts' && s.enabled)
  };

  const categoryIcons = {
    navigation: Navigation,
    controls: Settings,
    shortcuts: Zap
  };

  const categoryTitles = {
    navigation: 'Navigation',
    controls: 'Controls',
    shortcuts: 'Shortcuts'
  };

  const formatKey = (key: string) => {
    return key.split(' / ').map((k, index) => (
      <span key={index}>
        <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
          {k}
        </kbd>
        {index < key.split(' / ').length - 1 && <span className="mx-2 text-muted-foreground">or</span>}
      </span>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Keyboard className="h-4 w-4" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(categorizedShortcuts).map(([category, categoryShortcuts]) => {
              if (categoryShortcuts.length === 0) return null;
              
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">
                      {categoryTitles[category as keyof typeof categoryTitles]}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryShortcuts.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {formatKey(shortcut.key)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {category !== 'shortcuts' && <Separator />}
                </div>
              );
            })}
            
            <div className="mt-6 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Press <kbd className="px-1 py-0.5 bg-background border rounded text-xs">?</kbd> anytime to show this help</li>
                <li>• Use number keys (1-9) for quick percentage jumps</li>
                <li>• Shortcuts work only when not typing in text fields</li>
                <li>• Some shortcuts may vary based on reading mode</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};