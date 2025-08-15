import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LockReasonEditor } from './LockReasonEditor';
import { AutoLockScheduler } from './AutoLockScheduler';
import { AdminNotesEditor } from './AdminNotesEditor';
import { ChapterSEOEditor } from './ChapterSEOEditor';
import type { ChapterRowData } from '@/hooks/useChapterAdminList';

interface ChapterEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapter: ChapterRowData | null;
  onSave: (chapter: ChapterRowData) => void;
}

export const ChapterEditModal: React.FC<ChapterEditModalProps> = ({
  open,
  onOpenChange,
  chapter,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ChapterRowData>>({});

  useEffect(() => {
    if (chapter) {
      setFormData(chapter);
    }
  }, [chapter]);

  const handleSave = async () => {
    if (!chapter || !formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: formData.title.trim(),
          is_locked: formData.is_locked,
          release_date: formData.release_date,
          lock_reason: formData.lock_reason,
          lock_after: formData.lock_after,
          unlock_after: formData.unlock_after,
          notes_admin: formData.notes_admin,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          meta_keywords: formData.meta_keywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapter.id);

      if (error) throw error;

      // Update price if changed
      if (formData.coin_cost !== chapter.coin_cost) {
        const { error: priceError } = await supabase
          .from('chapter_prices')
          .upsert({
            chapter_id: chapter.id,
            coin_cost: formData.coin_cost || 0,
          });

        if (priceError) throw priceError;
      }

      onSave({ ...chapter, ...formData } as ChapterRowData);
      onOpenChange(false);

      toast({
        title: "Success",
        description: "Chapter updated successfully",
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof ChapterRowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!chapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Chapter #{chapter.chapter_number}</DialogTitle>
          <DialogDescription>
            Update chapter details, pricing, and publishing settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Chapter Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Enter chapter title"
              />
            </div>

            <div>
              <Label htmlFor="price">Price (Coins)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.coin_cost || 0}
                onChange={(e) => handleFieldChange('coin_cost', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="locked"
                checked={formData.is_locked || false}
                onCheckedChange={(checked) => handleFieldChange('is_locked', checked)}
              />
              <Label htmlFor="locked">Chapter is locked</Label>
            </div>

            <div>
              <Label>Release Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.release_date 
                      ? format(new Date(formData.release_date), 'PPP') 
                      : 'Pick a date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <CalendarComponent
                    selected={formData.release_date ? new Date(formData.release_date) : undefined}
                    onSelect={(date) => handleFieldChange('release_date', date?.toISOString())}
                    mode="single"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <LockReasonEditor
              chapterId={chapter.id}
              isLocked={formData.is_locked || false}
              lockReason={formData.lock_reason}
              onUpdate={() => {}}
            />
          </div>

          <div className="space-y-4">
            <AutoLockScheduler
              chapterId={chapter.id}
              isLocked={formData.is_locked || false}
              lockAfter={formData.lock_after}
              unlockAfter={formData.unlock_after}
              onUpdate={() => {}}
            />

            <AdminNotesEditor
              chapterId={chapter.id}
              chapterTitle={formData.title || 'Untitled'}
              initialNotes={formData.notes_admin}
              onNotesUpdated={(notes) => handleFieldChange('notes_admin', notes)}
            />

            <ChapterSEOEditor
              chapterId={chapter.id}
              chapterTitle={formData.title || 'Untitled'}
              initialData={{
                meta_title: formData.meta_title,
                meta_description: formData.meta_description,
                meta_keywords: formData.meta_keywords
              }}
              onSEOUpdated={(data) => {
                handleFieldChange('meta_title', data.meta_title);
                handleFieldChange('meta_description', data.meta_description);
                handleFieldChange('meta_keywords', data.meta_keywords);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};