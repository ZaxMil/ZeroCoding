import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimationSettings {
  pageTransitions: boolean;
  smoothScrolling: boolean;
  hoverEffects: boolean;
  loadingAnimations: boolean;
  feedbackAnimations: boolean;
}

interface AnimationSettingsProps {
  settings: AnimationSettings;
  onSettingsChange: (settings: AnimationSettings) => void;
}

const defaultSettings: AnimationSettings = {
  pageTransitions: true,
  smoothScrolling: true,
  hoverEffects: true,
  loadingAnimations: true,
  feedbackAnimations: true
};

export const AnimationSettings = ({ settings, onSettingsChange }: AnimationSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<AnimationSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = (key: keyof AnimationSettings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <h3 className="font-semibold">Animation Settings</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="page-transitions" className="text-sm font-medium">
              Page Transitions
            </Label>
            <p className="text-xs text-muted-foreground">
              Smooth animations when changing pages
            </p>
          </div>
          <Switch
            id="page-transitions"
            checked={localSettings.pageTransitions}
            onCheckedChange={(value) => handleToggle('pageTransitions', value)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="smooth-scrolling" className="text-sm font-medium">
              Smooth Scrolling
            </Label>
            <p className="text-xs text-muted-foreground">
              Smooth scrolling in webtoon mode
            </p>
          </div>
          <Switch
            id="smooth-scrolling"
            checked={localSettings.smoothScrolling}
            onCheckedChange={(value) => handleToggle('smoothScrolling', value)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hover-effects" className="text-sm font-medium">
              Hover Effects
            </Label>
            <p className="text-xs text-muted-foreground">
              Interactive hover animations on buttons and cards
            </p>
          </div>
          <Switch
            id="hover-effects"
            checked={localSettings.hoverEffects}
            onCheckedChange={(value) => handleToggle('hoverEffects', value)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="loading-animations" className="text-sm font-medium">
              Loading Animations
            </Label>
            <p className="text-xs text-muted-foreground">
              Skeleton and pulse effects while loading
            </p>
          </div>
          <Switch
            id="loading-animations"
            checked={localSettings.loadingAnimations}
            onCheckedChange={(value) => handleToggle('loadingAnimations', value)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="feedback-animations" className="text-sm font-medium">
              Visual Feedback
            </Label>
            <p className="text-xs text-muted-foreground">
              Animations for user actions and notifications
            </p>
          </div>
          <Switch
            id="feedback-animations"
            checked={localSettings.feedbackAnimations}
            onCheckedChange={(value) => handleToggle('feedbackAnimations', value)}
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p>• Disabling animations can improve performance on slower devices</p>
          <p>• Some accessibility features may override these settings</p>
          <p>• Changes apply immediately without requiring reload</p>
        </div>
      </div>
    </Card>
  );
};