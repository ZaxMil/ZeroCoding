import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Zap, Leaf, Ban, Info } from 'lucide-react';

interface PreloadSettingsProps {
  metrics?: {
    preloadedCount: number;
    failedCount: number;
    avgLoadTime: number;
    memoryUsage: number;
  };
}

export const PreloadSettings = ({ metrics }: PreloadSettingsProps) => {
  const [settings, setSettings] = useLocalStorage('image-preload-settings', {
    strategy: 'conservative' as 'aggressive' | 'conservative' | 'disabled',
    maxMemoryMB: 50,
    enabled: true
  });

  const formatMemoryUsage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(mb * 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`;
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return <Zap className="h-4 w-4" />;
      case 'conservative': return <Leaf className="h-4 w-4" />;
      case 'disabled': return <Ban className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'Preloads 5 pages ahead with high priority. Best for fast connections.';
      case 'conservative': return 'Preloads 2 pages ahead with low priority. Balanced for most users.';
      case 'disabled': return 'No preloading. Images load only when viewed.';
      default: return '';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Image Preloading</h3>
        <p className="text-sm text-muted-foreground">
          Configure how images are preloaded for smoother reading experience.
        </p>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Preloaded</div>
            <div className="text-lg font-semibold">{metrics.preloadedCount}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Memory</div>
            <div className="text-lg font-semibold">{formatMemoryUsage(metrics.memoryUsage)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Avg Load</div>
            <div className="text-lg font-semibold">{metrics.avgLoadTime.toFixed(0)}ms</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Failed</div>
            <div className="text-lg font-semibold">{metrics.failedCount}</div>
          </div>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="preload-enabled">Enable Image Preloading</Label>
          <p className="text-xs text-muted-foreground">
            Preload images for faster page viewing
          </p>
        </div>
        <Switch
          id="preload-enabled"
          checked={settings.enabled}
          onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label>Preloading Strategy</Label>
            <Select
              value={settings.strategy}
              onValueChange={(strategy: 'aggressive' | 'conservative' | 'disabled') =>
                setSettings({ ...settings, strategy })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aggressive">
                  <div className="flex items-center gap-2">
                    {getStrategyIcon('aggressive')}
                    <div>
                      <div className="font-medium">Aggressive</div>
                      <div className="text-xs text-muted-foreground">
                        5 pages ahead, high priority
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="conservative">
                  <div className="flex items-center gap-2">
                    {getStrategyIcon('conservative')}
                    <div>
                      <div className="font-medium">Conservative</div>
                      <div className="text-xs text-muted-foreground">
                        2 pages ahead, low priority
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="disabled">
                  <div className="flex items-center gap-2">
                    {getStrategyIcon('disabled')}
                    <div>
                      <div className="font-medium">Disabled</div>
                      <div className="text-xs text-muted-foreground">
                        No preloading
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              {getStrategyIcon(settings.strategy)}
              <p className="text-xs text-muted-foreground">
                {getStrategyDescription(settings.strategy)}
              </p>
            </div>
          </div>

          {/* Memory Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Memory Limit</Label>
              <Badge variant="outline">{settings.maxMemoryMB}MB</Badge>
            </div>
            <Slider
              value={[settings.maxMemoryMB]}
              onValueChange={([value]) => setSettings({ ...settings, maxMemoryMB: value })}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum memory usage for preloaded images. Higher values allow more preloading but use more device memory.
            </p>
          </div>
        </>
      )}
    </Card>
  );
};