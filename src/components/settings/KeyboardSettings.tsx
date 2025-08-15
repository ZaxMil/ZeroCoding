import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Keyboard, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Navigation, 
  Settings as SettingsIcon,
  Zap 
} from 'lucide-react';
import { KeyboardNavigationSettings } from '@/hooks/useKeyboardNavigation';

interface KeyboardSettingsProps {
  settings: KeyboardNavigationSettings;
  onSettingsChange: (settings: KeyboardNavigationSettings) => void;
}

const shortcutGroups = {
  navigation: {
    title: 'Navigation',
    icon: Navigation,
    shortcuts: {
      'ArrowLeft': 'Previous page',
      'ArrowRight': 'Next page', 
      'ArrowUp': 'Scroll up',
      'ArrowDown': 'Scroll down',
      ' ': 'Next page / Scroll down',
      '1-9': 'Jump to percentage'
    }
  },
  chapter: {
    title: 'Chapter Navigation',
    icon: SettingsIcon,
    shortcuts: {
      'g': 'Go to beginning',
      'e': 'Go to end',
      'n': 'Next chapter',
      'p': 'Previous chapter',
      'r': 'Reload chapter'
    }
  },
  controls: {
    title: 'Controls',
    icon: Zap,
    shortcuts: {
      'f': 'Toggle fullscreen',
      'm': 'Toggle settings',
      'b': 'Toggle bookmark',
      't': 'Toggle theme',
      'c': 'Toggle chapter list'
    }
  },
  utility: {
    title: 'Utility',
    icon: Keyboard,
    shortcuts: {
      '/': 'Focus search',
      '?': 'Show shortcuts help',
      'Escape': 'Close modal/panel'
    }
  }
};

export const KeyboardSettings = ({ settings, onSettingsChange }: KeyboardSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<KeyboardNavigationSettings>(settings);
  
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggleMaster = (enabled: boolean) => {
    const newSettings = { ...localSettings, enabled };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleToggleVisualFeedback = (visualFeedback: boolean) => {
    const newSettings = { ...localSettings, visualFeedback };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleToggleShortcut = (key: string, enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      shortcuts: { ...localSettings.shortcuts, [key]: enabled }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleResetToDefaults = () => {
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
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const getEnabledCount = () => {
    return Object.values(localSettings.shortcuts).filter(Boolean).length;
  };

  const getTotalCount = () => {
    return Object.keys(localSettings.shortcuts).length;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          <h3 className="font-semibold">Keyboard Navigation</h3>
          <Badge variant="outline" className="text-xs">
            {getEnabledCount()}/{getTotalCount()}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleResetToDefaults}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="keyboard-enabled" className="text-sm font-medium">
            Enable keyboard shortcuts
          </Label>
          <Switch
            id="keyboard-enabled"
            checked={localSettings.enabled}
            onCheckedChange={handleToggleMaster}
          />
        </div>

        {/* Visual feedback toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="visual-feedback" className="text-sm font-medium">
              Visual feedback
            </Label>
            {localSettings.visualFeedback ? (
              <Eye className="h-3 w-3 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <Switch
            id="visual-feedback"
            checked={localSettings.visualFeedback}
            onCheckedChange={handleToggleVisualFeedback}
            disabled={!localSettings.enabled}
          />
        </div>

        <Separator />

        {/* Individual shortcuts */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Individual Shortcuts</Label>
          
          <ScrollArea className="h-64">
            <div className="space-y-4 pr-4">
              {Object.entries(shortcutGroups).map(([groupKey, group]) => {
                const Icon = group.icon;
                const groupShortcuts = Object.entries(group.shortcuts);
                const enabledInGroup = groupShortcuts.filter(([key]) => 
                  localSettings.shortcuts[key] ?? true
                ).length;

                return (
                  <div key={groupKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium">{group.title}</span>
                      <Badge variant="secondary" className="text-xs h-5">
                        {enabledInGroup}/{groupShortcuts.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 ml-5">
                      {groupShortcuts.map(([key, description]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">
                              {key === ' ' ? 'Space' : key}
                            </kbd>
                            <span className="text-xs text-muted-foreground">
                              {description}
                            </span>
                          </div>
                          <Switch
                            checked={localSettings.shortcuts[key] ?? true}
                            onCheckedChange={(enabled) => handleToggleShortcut(key, enabled)}
                            disabled={!localSettings.enabled}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Shortcuts only work when not typing in text fields</p>
          <p>• Press <kbd className="px-1 py-0.5 bg-muted border rounded">?</kbd> anytime to see all shortcuts</p>
          <p>• Changes are saved automatically</p>
        </div>
      </div>
    </Card>
  );
};