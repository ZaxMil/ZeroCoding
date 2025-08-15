import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChapterSEOData {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

interface ChapterSEOEditorProps {
  chapterId: string;
  chapterTitle: string;
  initialData: ChapterSEOData;
  onSEOUpdated: (data: ChapterSEOData) => void;
}

export const ChapterSEOEditor: React.FC<ChapterSEOEditorProps> = ({
  chapterId,
  chapterTitle,
  initialData,
  onSEOUpdated
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seoData, setSeoData] = useState<ChapterSEOData>({
    meta_title: initialData.meta_title || '',
    meta_description: initialData.meta_description || '',
    meta_keywords: initialData.meta_keywords || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          meta_title: seoData.meta_title || null,
          meta_description: seoData.meta_description || null,
          meta_keywords: seoData.meta_keywords || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      onSEOUpdated(seoData);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'SEO settings updated'
      });
    } catch (error: any) {
      console.error('SEO update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update SEO settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const generateSuggestions = () => {
    setSeoData(prev => ({
      ...prev,
      meta_title: prev.meta_title || `${chapterTitle} - Read Online`,
      meta_description: prev.meta_description || `Read ${chapterTitle} online. Latest chapter available now.`,
      meta_keywords: prev.meta_keywords || `${chapterTitle}, chapter, read online, manga, novel`
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>SEO Settings - {chapterTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input
              id="meta-title"
              value={seoData.meta_title || ''}
              onChange={(e) => setSeoData(prev => ({ ...prev, meta_title: e.target.value }))}
              placeholder="Chapter title for search engines"
              maxLength={60}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {(seoData.meta_title || '').length}/60 characters
            </div>
          </div>
          
          <div>
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              value={seoData.meta_description || ''}
              onChange={(e) => setSeoData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Chapter description for search results"
              maxLength={160}
              rows={3}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {(seoData.meta_description || '').length}/160 characters
            </div>
          </div>
          
          <div>
            <Label htmlFor="meta-keywords">Meta Keywords</Label>
            <Input
              id="meta-keywords"
              value={seoData.meta_keywords || ''}
              onChange={(e) => setSeoData(prev => ({ ...prev, meta_keywords: e.target.value }))}
              placeholder="Comma-separated keywords"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateSuggestions} className="flex-1">
              Generate Suggestions
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};