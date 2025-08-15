import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ChapterVersion {
  id: string;
  chapter_id: string;
  version_number: number;
  title: string | null;
  pages: any;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
}

interface VersionHistoryViewerProps {
  chapterId: string;
  chapterTitle: string;
  onVersionRestore?: (version: ChapterVersion) => void;
}

export const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({
  chapterId,
  chapterTitle,
  onVersionRestore
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapter_versions' as any)
        .select('*')
        .eq('chapter_id', chapterId)
        .order('version_number', { ascending: false });

      if (error) {
        // Table might not exist yet - show empty state
        console.warn('Chapter versions table not available:', error);
        setVersions([]);
        return;
      }
      setVersions(data as any || []);
    } catch (error: any) {
      console.error('Failed to load versions:', error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (version: ChapterVersion) => {
    setRestoring(version.id);
    try {
      // Create new version entry from current state
      const { data: currentChapter } = await supabase
        .from('chapters')
        .select('title, pages')
        .eq('id', chapterId)
        .single();

      if (currentChapter) {
        await supabase
          .from('chapter_versions' as any)
          .insert({
            chapter_id: chapterId,
            version_number: Math.max(...versions.map(v => v.version_number)) + 1,
            title: currentChapter.title,
            pages: currentChapter.pages,
            change_summary: `Backup before restoring version ${version.version_number}`,
            created_at: new Date().toISOString()
          });
      }

      // Restore the selected version
      const { error } = await supabase
        .from('chapters')
        .update({
          title: version.title,
          pages: version.pages,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      onVersionRestore?.(version);
      setOpen(false);
      toast({
        title: 'Success',
        description: `Restored to version ${version.version_number}`
      });
    } catch (error: any) {
      console.error('Version restore failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive'
      });
    } finally {
      setRestoring(null);
    }
  };

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, chapterId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History - {chapterTitle}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading version history...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No version history available
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Version {version.version_number}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreVersion(version)}
                      disabled={restoring === version.id}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {restoring === version.id ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{version.title || 'Untitled'}</h4>
                    {version.change_summary && (
                      <p className="text-sm text-muted-foreground">
                        {version.change_summary}
                      </p>
                    )}
                  </div>
                  
                  {version.pages && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <div className="max-h-16 overflow-hidden">
                        {Array.isArray(version.pages) 
                          ? `${version.pages.length} pages`
                          : 'Page content available'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};