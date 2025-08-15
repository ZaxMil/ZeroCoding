import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Database, Smartphone, Scroll, RotateCcw } from 'lucide-react';

interface ProgressTrackingSettingsProps {
  userId?: string;
}

export const ProgressTrackingSettings = ({ userId }: ProgressTrackingSettingsProps) => {
  const [settings, setSettings] = useLocalStorage('progress-settings', {
    enableTracking: true,
    syncAcrossDevices: true,
    saveScrollPosition: true,
    autoResume: true,
    saveFrequency: 'medium' as 'low' | 'medium' | 'high'
  });

  const getSaveFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'low':
        return 'Save every 10 seconds (battery friendly)';
      case 'medium':
        return 'Save every 3 seconds (balanced)';
      case 'high':
        return 'Save every second (most responsive)';
      default:
        return '';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Reading Progress Tracking
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure how your reading progress is saved and synchronized.
        </p>
        {!userId && (
          <Badge variant="outline" className="text-xs">
            Guest Mode - Progress saved locally only
          </Badge>
        )}
      </div>

      {/* Enable Tracking */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="enable-tracking">Enable Progress Tracking</Label>
          <p className="text-xs text-muted-foreground">
            Track reading progress across chapters
          </p>
        </div>
        <Switch
          id="enable-tracking"
          checked={settings.enableTracking}
          onCheckedChange={(enableTracking) => 
            setSettings({ ...settings, enableTracking })
          }
        />
      </div>

      {settings.enableTracking && (
        <>
          {/* Sync Across Devices */}
          {userId && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-devices" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Sync Across Devices
                </Label>
                <p className="text-xs text-muted-foreground">
                  Keep progress synchronized between all your devices
                </p>
              </div>
              <Switch
                id="sync-devices"
                checked={settings.syncAcrossDevices}
                onCheckedChange={(syncAcrossDevices) => 
                  setSettings({ ...settings, syncAcrossDevices })
                }
              />
            </div>
          )}

          {/* Save Scroll Position */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="save-scroll" className="flex items-center gap-2">
                <Scroll className="h-4 w-4" />
                Save Scroll Position
              </Label>
              <p className="text-xs text-muted-foreground">
                Remember exact scroll position in webtoon mode
              </p>
            </div>
            <Switch
              id="save-scroll"
              checked={settings.saveScrollPosition}
              onCheckedChange={(saveScrollPosition) => 
                setSettings({ ...settings, saveScrollPosition })
              }
            />
          </div>

          {/* Auto Resume */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-resume" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Auto Resume
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically scroll to last read position
              </p>
            </div>
            <Switch
              id="auto-resume"
              checked={settings.autoResume}
              onCheckedChange={(autoResume) => 
                setSettings({ ...settings, autoResume })
              }
            />
          </div>

          {/* Save Frequency */}
          <div className="space-y-3">
            <Label>Save Frequency</Label>
            <Select
              value={settings.saveFrequency}
              onValueChange={(saveFrequency: 'low' | 'medium' | 'high') =>
                setSettings({ ...settings, saveFrequency })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div>
                    <div className="font-medium">Low</div>
                    <div className="text-xs text-muted-foreground">
                      Every 10 seconds
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div>
                    <div className="font-medium">Medium</div>
                    <div className="text-xs text-muted-foreground">
                      Every 3 seconds
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div>
                    <div className="font-medium">High</div>
                    <div className="text-xs text-muted-foreground">
                      Every second
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getSaveFrequencyDescription(settings.saveFrequency)}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};