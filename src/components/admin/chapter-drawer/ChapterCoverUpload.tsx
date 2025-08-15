import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageIcon, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChapterCoverUploadProps {
  chapterId: string;
  currentCoverUrl?: string | null;
  onCoverUpdated: (coverUrl: string | null) => void;
}

export const ChapterCoverUpload: React.FC<ChapterCoverUploadProps> = ({
  chapterId,
  currentCoverUrl,
  onCoverUpdated
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chapter-${chapterId}-cover.${fileExt}`;
      const filePath = `chapter-covers/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chapter-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chapter-covers')
        .getPublicUrl(filePath);

      const coverUrl = urlData.publicUrl;

      // Update chapter with cover URL
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ cover_url: coverUrl, updated_at: new Date().toISOString() })
        .eq('id', chapterId);

      if (updateError) throw updateError;

      onCoverUpdated(coverUrl);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Chapter cover uploaded successfully'
      });
    } catch (error: any) {
      console.error('Cover upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload cover image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeCover = async () => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ cover_url: null, updated_at: new Date().toISOString() })
        .eq('id', chapterId);

      if (error) throw error;

      onCoverUpdated(null);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Chapter cover removed'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove cover',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          {currentCoverUrl ? (
            <img 
              src={currentCoverUrl} 
              alt="Chapter cover" 
              className="w-8 h-8 object-cover rounded"
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chapter Cover</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {currentCoverUrl && (
            <div className="flex justify-center">
              <img 
                src={currentCoverUrl} 
                alt="Current cover" 
                className="max-w-full h-48 object-cover rounded"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => document.getElementById(`cover-upload-${chapterId}`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Cover'}
            </Button>
            {currentCoverUrl && (
              <Button variant="outline" onClick={removeCover}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            id={`cover-upload-${chapterId}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};