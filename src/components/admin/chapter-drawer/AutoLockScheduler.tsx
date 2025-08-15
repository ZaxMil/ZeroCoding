import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addHours, isPast, isWithinInterval } from 'date-fns';

interface AutoLockSchedulerProps {
  chapterId: string;
  isLocked: boolean;
  lockAfter?: string | null;
  unlockAfter?: string | null;
  onUpdate: () => void;
}

export const AutoLockScheduler = ({ 
  chapterId, 
  isLocked, 
  lockAfter, 
  unlockAfter, 
  onUpdate 
}: AutoLockSchedulerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lockTime, setLockTime] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (dialogOpen) {
      setLockTime(lockAfter ? format(new Date(lockAfter), "yyyy-MM-dd'T'HH:mm") : '');
      setUnlockTime(unlockAfter ? format(new Date(unlockAfter), "yyyy-MM-dd'T'HH:mm") : '');
    }
  }, [dialogOpen, lockAfter, unlockAfter]);

  const hasScheduledTimes = lockAfter || unlockAfter;
  const hasConflict = lockAfter && unlockAfter && new Date(lockAfter) >= new Date(unlockAfter);
  
  const getScheduleStatus = () => {
    const now = new Date();
    
    if (lockAfter && !isPast(new Date(lockAfter))) {
      return { type: 'warning', text: `Locks ${format(new Date(lockAfter), 'MMM d, HH:mm')}` };
    }
    
    if (unlockAfter && !isPast(new Date(unlockAfter))) {
      return { type: 'info', text: `Unlocks ${format(new Date(unlockAfter), 'MMM d, HH:mm')}` };
    }
    
    return null;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (lockTime) {
        updateData.lock_after = new Date(lockTime).toISOString();
      } else {
        updateData.lock_after = null;
      }

      if (unlockTime) {
        updateData.unlock_after = new Date(unlockTime).toISOString();
      } else {
        updateData.unlock_after = null;
      }

      const { error } = await supabase
        .from('chapters')
        .update(updateData)
        .eq('id', chapterId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Auto-lock schedule updated' });
      onUpdate();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast({ title: 'Error', description: 'Failed to update schedule', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const quickSetLock = (hours: number) => {
    const future = addHours(new Date(), hours);
    setLockTime(format(future, "yyyy-MM-dd'T'HH:mm"));
  };

  const scheduleStatus = getScheduleStatus();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasScheduledTimes ? "default" : "ghost"}
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-8 w-8 p-0 relative"
            >
              <Clock className="h-4 w-4" />
              {hasConflict && (
                <AlertTriangle className="h-3 w-3 absolute -top-1 -right-1 text-red-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium">Auto-Lock Schedule</p>
              {scheduleStatus && (
                <p className="text-sm text-muted-foreground mt-1">{scheduleStatus.text}</p>
              )}
              {hasConflict && (
                <p className="text-sm text-red-400 mt-1">⚠ Schedule conflict detected</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {scheduleStatus && (
        <Badge 
          variant={scheduleStatus.type === 'warning' ? "destructive" : "secondary"}
          className="ml-2 text-xs"
        >
          {scheduleStatus.text}
        </Badge>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auto-Lock Schedule</DialogTitle>
            <DialogDescription>
              Set automatic lock and unlock times for this chapter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lock-time">Auto-Lock After</Label>
              <Input
                id="lock-time"
                type="datetime-local"
                value={lockTime}
                onChange={(e) => setLockTime(e.target.value)}
              />
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => quickSetLock(1)}>
                  +1h
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickSetLock(24)}>
                  +24h
                </Button>
                <Button variant="outline" size="sm" onClick={() => quickSetLock(168)}>
                  +1w
                </Button>
                <Button variant="outline" size="sm" onClick={() => setLockTime('')}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unlock-time">Auto-Unlock After</Label>
              <Input
                id="unlock-time"
                type="datetime-local"
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={() => setUnlockTime('')}>
                Clear
              </Button>
            </div>

            {lockTime && unlockTime && new Date(lockTime) >= new Date(unlockTime) && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Lock time must be before unlock time
                </span>
              </div>
            )}

            {isLocked && lockTime && !isPast(new Date(lockTime)) && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  Chapter is currently locked but has a future lock time
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || hasConflict}
            >
              {loading ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};