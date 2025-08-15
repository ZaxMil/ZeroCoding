import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOrientationLock } from '@/hooks/useOrientationLock';

export const OrientationSettings = () => {
  const { settings, isSupported, toggleEnabled, setOrientation } = useOrientationLock();

  if (!isSupported) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-muted-foreground">Orientation Lock</h3>
          <Badge variant="outline" className="text-xs">Not Supported</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Orientation lock is not supported on this device or browser.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4" />
        <h3 className="font-semibold">Orientation Lock</h3>
        <Badge variant="secondary" className="text-xs">Mobile</Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="orientation-enabled" className="text-sm font-medium">
              Enable Orientation Lock
            </Label>
            <p className="text-xs text-muted-foreground">
              Lock screen orientation while reading
            </p>
          </div>
          <Switch
            id="orientation-enabled"
            checked={settings.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        {settings.enabled && (
          <>
            <Separator />
            
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Preferred Orientation
              </Label>
              <RadioGroup
                value={settings.orientation}
                onValueChange={(value) => setOrientation(value as any)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="any" />
                  <Label htmlFor="any" className="text-sm">
                    Any (No lock)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait" className="text-sm">
                    Portrait
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape" className="text-sm">
                    Landscape
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p>• Orientation lock only works in fullscreen mode on most browsers</p>
          <p>• May not work in all browsers or devices</p>
          <p>• Automatically unlocks when leaving the reader</p>
        </div>
      </div>
    </Card>
  );
};