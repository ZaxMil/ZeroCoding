import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageIcon, Upload, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThumbnailPreviewProps {
  chapterId: string;
  thumbnailUrl?: string | null;
  chapterTitle: string;
  onUpdate: () => void;
}

export const ThumbnailPreview = ({ 
  chapterId, 
  thumbnailUrl, 
  chapterTitle, 
  onUpdate 
}: ThumbnailPreviewProps) => {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `chapter-${chapterId}-thumbnail.${fileExt}`;
      const filePath = `chapters/thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chapter-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chapter-assets')
        .getPublicUrl(filePath);

      // Update chapter record
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ 
          thumbnail_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Thumbnail uploaded successfully' });
      onUpdate();
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      toast({ title: 'Error', description: 'Failed to upload thumbnail', variant: 'destructive' });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveThumbnail = async () => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ 
          thumbnail_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Thumbnail removed' });
      onUpdate();
    } catch (error) {
      console.error('Failed to remove thumbnail:', error);
      toast({ title: 'Error', description: 'Failed to remove thumbnail', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {thumbnailUrl ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="relative w-12 h-12 bg-muted rounded cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setPreviewDialogOpen(true)}
                >
                  <img
                    src={thumbnailUrl}
                    alt={`${chapterTitle} thumbnail`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to preview thumbnail</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={uploading}
              asChild
            >
              <label htmlFor={`thumbnail-upload-${chapterId}`} className="cursor-pointer">
                <Upload className="h-3 w-3 mr-1" />
                {uploading ? 'Uploading...' : thumbnailUrl ? 'Change' : 'Upload'}
              </label>
            </Button>
            {thumbnailUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={handleRemoveThumbnail}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        id={`thumbnail-upload-${chapterId}`}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{chapterTitle}</h3>
              <p className="text-sm text-muted-foreground">Chapter Thumbnail</p>
            </div>
            {thumbnailUrl && (
              <div className="flex justify-center">
                <img
                  src={thumbnailUrl}
                  alt={`${chapterTitle} thumbnail`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};