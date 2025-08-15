import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickChapterDuplicateProps {
  chapterId: string;
  seriesId: string;
  chapterData: {
    title: string | null;
    chapter_number: number;
    is_locked: boolean;
    coin_cost: number | null;
    lock_reason?: string | null;
    thumbnail_url?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    notes_admin?: string | null;
  };
  onSuccess: () => void;
}

export const QuickChapterDuplicate = ({ 
  chapterId, 
  seriesId, 
  chapterData, 
  onSuccess 
}: QuickChapterDuplicateProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      // Get the highest chapter number for the series
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('series_id', seriesId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (chaptersError) throw chaptersError;

      const nextChapterNumber = (chapters?.[0]?.chapter_number || 0) + 1;

      // Get the original chapter content (these fields may not exist in schema)
      const { data: originalChapter } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      // Create new chapter
      const newChapterData = {
        series_id: seriesId,
        title: `${chapterData.title || 'Untitled'} (Copy)`,
        chapter_number: nextChapterNumber,
        sort_order: nextChapterNumber,
        is_locked: chapterData.is_locked,
        lock_reason: chapterData.lock_reason,
        thumbnail_url: chapterData.thumbnail_url,
        meta_title: chapterData.meta_title,
        meta_description: chapterData.meta_description,
        meta_keywords: chapterData.meta_keywords,
        notes_admin: chapterData.notes_admin,
        pages: (originalChapter as any)?.pages || [],
        page_count: (originalChapter as any)?.page_count || 0,
        release_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow (draft)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newChapter, error: createError } = await supabase
        .from('chapters')
        .insert(newChapterData)
        .select()
        .single();

      if (createError) throw createError;

      // Copy chapter price if it exists
      if (chapterData.coin_cost && chapterData.coin_cost > 0) {
        await supabase
          .from('chapter_prices')
          .insert({
            chapter_id: newChapter.id,
            coin_cost: chapterData.coin_cost,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      toast({ 
        title: 'Success', 
        description: `Chapter duplicated as Chapter ${nextChapterNumber}` 
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to duplicate chapter:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to duplicate chapter', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Duplicate chapter</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};