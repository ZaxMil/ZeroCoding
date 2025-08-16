import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings, Book, Eye, Palette } from 'lucide-react';

export interface ReadingPreferencesData {
  readingMode: 'single' | 'double' | 'webtoon';
  pageDirection: 'ltr' | 'rtl';
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  fitMode: 'width' | 'height' | 'original';
  darkMode: boolean;
  backgroundColor: string;
  showPageNumbers: boolean;
  enableZoom: boolean;
  preloadPages: number;
}

interface ReadingPreferencesProps {
  preferences: ReadingPreferencesData;
  onPreferencesChange: (preferences: ReadingPreferencesData) => void;
  onClose?: () => void;
}

export const ReadingPreferences: React.FC<ReadingPreferencesProps> = ({
  preferences,
  onPreferencesChange,
  onClose
}) => {
  const updatePreference = <K extends keyof ReadingPreferencesData>(
    key: K,
    value: ReadingPreferencesData[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Reading Preferences</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Reading Mode
          </CardTitle>
          <CardDescription>
            Choose how pages are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Page Layout</Label>
            <Select 
              value={preferences.readingMode} 
              onValueChange={(value: 'single' | 'double' | 'webtoon') => 
                updatePreference('readingMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Page</SelectItem>
                <SelectItem value="double">Double Page</SelectItem>
                <SelectItem value="webtoon">Webtoon (Vertical)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Page Direction</Label>
            <Select 
              value={preferences.pageDirection} 
              onValueChange={(value: 'ltr' | 'rtl') => 
                updatePreference('pageDirection', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ltr">Left to Right</SelectItem>
                <SelectItem value="rtl">Right to Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fit Mode</Label>
            <Select 
              value={preferences.fitMode} 
              onValueChange={(value: 'width' | 'height' | 'original') => 
                updatePreference('fitMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="width">Fit Width</SelectItem>
                <SelectItem value="height">Fit Height</SelectItem>
                <SelectItem value="original">Original Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Display Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-page-numbers">Show Page Numbers</Label>
            <Switch
              id="show-page-numbers"
              checked={preferences.showPageNumbers}
              onCheckedChange={(checked) => updatePreference('showPageNumbers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-zoom">Enable Zoom</Label>
            <Switch
              id="enable-zoom"
              checked={preferences.enableZoom}
              onCheckedChange={(checked) => updatePreference('enableZoom', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Preload Pages: {preferences.preloadPages}</Label>
            <Slider
              value={[preferences.preloadPages]}
              onValueChange={([value]) => updatePreference('preloadPages', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Auto Advance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-advance">Auto Advance Pages</Label>
            <Switch
              id="auto-advance"
              checked={preferences.autoAdvance}
              onCheckedChange={(checked) => updatePreference('autoAdvance', checked)}
            />
          </div>

          {preferences.autoAdvance && (
            <div className="space-y-2">
              <Label>Delay: {preferences.autoAdvanceDelay}s</Label>
              <Slider
                value={[preferences.autoAdvanceDelay]}
                onValueChange={([value]) => updatePreference('autoAdvanceDelay', value)}
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      )}
    </div>
  );
};