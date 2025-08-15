import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChapterRowData {
  id: string;
  chapter_number: number;
  title: string | null;
  release_date: string;
  is_locked: boolean;
  coin_cost: number | null;
  sales: number;
  views: number;
}

interface MobileEditorFABProps {
  chapters: ChapterRowData[];
  onNewChapter: () => void;
  onEditChapter: (chapter: ChapterRowData) => void;
  className?: string;
}

export const MobileEditorFAB: React.FC<MobileEditorFABProps> = ({
  chapters,
  onNewChapter,
  onEditChapter,
  className = ''
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const draftChapters = chapters.filter(chapter => 
    new Date(chapter.release_date) > new Date()
  );
  const mostRecentDraft = draftChapters.sort((a, b) => 
    new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  )[0];

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 ${className} md:hidden`}>
        <Button size="lg" className="rounded-full w-14 h-14 shadow-lg" onClick={() => setShowOptions(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chapter Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => { onNewChapter(); setShowOptions(false); }}>
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create New Chapter</div>
                  <div className="text-sm text-muted-foreground">Start writing a new chapter</div>
                </div>
              </div>
            </Button>
            {mostRecentDraft && (
              <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => { onEditChapter(mostRecentDraft); setShowOptions(false); }}>
                <div className="flex items-center gap-3">
                  <Edit className="h-5 w-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Continue Draft</div>
                    <div className="text-sm text-muted-foreground">Chapter {mostRecentDraft.chapter_number}: {mostRecentDraft.title || 'Untitled'}</div>
                    <Badge variant="secondary" className="mt-1">Draft</Badge>
                  </div>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};