import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Moon, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNightModeScheduler } from '@/hooks/useNightModeScheduler';

export const NightModeScheduler = () => {
  const { 
    settings, 
    isScheduleActive, 
    toggleEnabled, 
    setScheduleTime, 
    toggleWeekendsOnly 
  } = useNightModeScheduler();

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleTime(e.target.value, settings.endTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleTime(settings.startTime, e.target.value);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <h3 className="font-semibold">Night Mode Scheduler</h3>
          {isScheduleActive && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={toggleEnabled}
        />
      </div>

      {settings.enabled && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3" />
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={settings.startTime}
                  onChange={handleStartTimeChange}
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="end-time" className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3" />
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={settings.endTime}
                  onChange={handleEndTimeChange}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="weekends-only" className="text-sm font-medium">
                    Weekends Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only activate schedule on Saturday and Sunday
                  </p>
                </div>
              </div>
              <Switch
                id="weekends-only"
                checked={settings.weekendsOnly}
                onCheckedChange={toggleWeekendsOnly}
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
              <p className="font-medium">Current Schedule:</p>
              <p>• Dark mode: {settings.startTime} - {settings.endTime}</p>
              <p>• Days: {settings.weekendsOnly ? 'Weekends only' : 'Every day'}</p>
              {isScheduleActive && <p>• Status: Night mode is currently active</p>}
            </div>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Automatically switches between light and dark theme</p>
        <p>• Times that cross midnight (e.g., 18:00 to 06:00) are supported</p>
        <p>• Manual theme changes will override the schedule temporarily</p>
      </div>
    </Card>
  );
};