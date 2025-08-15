import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChapterData {
  id: string;
  title: string | null;
  chapter_number: number;
  content_data?: any;
  is_locked: boolean;
  coin_cost: number | null;
  series_id: string;
}

interface ChapterClonerProps {
  chapter: ChapterData;
  maxChapterNumber: number;
  onChapterCloned: () => void;
  onOpenEditor?: (chapterId: string) => void;
}

export const ChapterCloner: React.FC<ChapterClonerProps> = ({
  chapter,
  maxChapterNumber,
  onChapterCloned,
  onOpenEditor
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [newTitle, setNewTitle] = useState(`${chapter.title || 'Chapter'} (Copy)`);
  const [newChapterNumber, setNewChapterNumber] = useState(maxChapterNumber + 1);

  const handleClone = async () => {
    setCloning(true);
    try {
      // Get full chapter data including content
      const { data: fullChapter, error: fetchError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapter.id)
        .single();

      if (fetchError) throw fetchError;

      // Create new chapter
      const { data: newChapter, error: createError } = await supabase
        .from('chapters')
        .insert({
          title: newTitle,
          chapter_number: newChapterNumber,
          series_id: chapter.series_id,
          pages: fullChapter.pages,
          is_locked: chapter.is_locked,
          release_date: new Date().toISOString(),
          page_count: fullChapter.page_count || 0,
          sort_order: newChapterNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // Clone chapter price if exists
      if (chapter.coin_cost > 0) {
        await supabase
          .from('chapter_prices')
          .insert({
            chapter_id: newChapter.id,
            coin_cost: chapter.coin_cost,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      onChapterCloned();
      setOpen(false);
      
      toast({
        title: 'Success',
        description: `Chapter cloned as "${newTitle}"`,
        action: onOpenEditor ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenEditor(newChapter.id)}
          >
            Edit Now
          </Button>
        ) : undefined
      });

    } catch (error: any) {
      console.error('Chapter cloning failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone chapter',
        variant: 'destructive'
      });
    } finally {
      setCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Chapter</DialogTitle>
          <DialogDescription>
            Create a copy of "{chapter.title}" with all content, settings, and pricing.
            The new chapter will be created as a draft.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-title">New Chapter Title</Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter title for cloned chapter"
            />
          </div>
          
          <div>
            <Label htmlFor="new-number">Chapter Number</Label>
            <Input
              id="new-number"
              type="number"
              value={newChapterNumber}
              onChange={(e) => setNewChapterNumber(parseInt(e.target.value) || maxChapterNumber + 1)}
              min={1}
            />
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Will be copied:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Chapter content and pages</li>
              <li>Lock status: {chapter.is_locked ? 'Locked' : 'Free'}</li>
              {chapter.coin_cost > 0 && <li>Price: {chapter.coin_cost} coins</li>}
              <li>Status will be set to "Draft"</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={cloning || !newTitle.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {cloning ? 'Cloning...' : 'Clone Chapter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};