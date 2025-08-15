import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StickyNote, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotesEditorProps {
  chapterId: string;
  chapterTitle: string;
  initialNotes?: string | null;
  onNotesUpdated: (notes: string | null) => void;
}

export const AdminNotesEditor: React.FC<AdminNotesEditorProps> = ({
  chapterId,
  chapterTitle,
  initialNotes,
  onNotesUpdated
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          notes_admin: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      onNotesUpdated(notes.trim() || null);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Admin notes saved'
      });
    } catch (error: any) {
      console.error('Notes save failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const hasNotes = initialNotes && initialNotes.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={hasNotes ? 'text-amber-600' : ''}>
          <StickyNote className={`h-4 w-4 ${hasNotes ? 'fill-current' : ''}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Notes - {chapterTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-notes">Private Notes</Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this chapter (only visible to admins)"
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground mt-2">
              These notes are private and will not be visible to readers.
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};