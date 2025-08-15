import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LockReasonEditorProps {
  chapterId: string;
  isLocked: boolean;
  lockReason?: string | null;
  onUpdate: () => void;
}

export const LockReasonEditor = ({ chapterId, isLocked, lockReason, onUpdate }: LockReasonEditorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReason, setEditReason] = useState(lockReason || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ 
          lock_reason: editReason.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Lock reason updated' });
      onUpdate();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update lock reason:', error);
      toast({ title: 'Error', description: 'Failed to update lock reason', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="destructive" 
              className="cursor-pointer hover:bg-destructive/80"
              onClick={() => setDialogOpen(true)}
            >
              <Lock className="h-3 w-3 mr-1" />
              Locked
              {lockReason && (
                <Edit3 className="h-3 w-3 ml-1" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium">Locked Chapter</p>
              {lockReason && (
                <p className="text-sm text-muted-foreground mt-1">{lockReason}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Click to edit reason</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lock Reason</DialogTitle>
            <DialogDescription>
              Specify why this chapter is locked (e.g., "Premium content", "Early access").
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter lock reason..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              maxLength={100}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};