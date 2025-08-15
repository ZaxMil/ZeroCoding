import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  chapterNumber: string;
  previewPages: string[]; // First 3 pages
  onStartReading: () => void;
}

export const ChapterPreviewModal = ({
  isOpen,
  onClose,
  chapterTitle,
  chapterNumber,
  previewPages,
  onStartReading
}: ChapterPreviewModalProps) => {
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Chapter Preview</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Chapter {chapterNumber}: {chapterTitle}
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {previewPages.length > 0 ? (
            <div className="space-y-4 p-4">
              {previewPages.map((page, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-lg overflow-hidden border",
                    index === currentPreviewPage && "ring-2 ring-primary"
                  )}
                >
                  <img
                    src={page}
                    alt={`Preview page ${index + 1}`}
                    className="w-full h-auto max-h-96 object-contain bg-muted"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-background/80">
                      {index + 1} / {previewPages.length}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="text-center py-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  This is just a preview. Start reading to see the full chapter.
                </p>
                <Button onClick={onStartReading} className="w-full">
                  Start Reading
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No preview available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};