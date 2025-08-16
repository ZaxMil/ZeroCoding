import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, ImageIcon, FileIcon, Video, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface MediaUploaderProps {
  onUploadComplete?: (files: any[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number;
}

export default function MediaUploader({ 
  onUploadComplete, 
  acceptedTypes = ['image/*', 'video/*', 'audio/*'],
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024 // 50MB
}: MediaUploaderProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    disabled: isUploading
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const mediaFile of files) {
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, status: 'uploading' as const } : f
        ));

        const fileName = `${user.id}/${Date.now()}-${mediaFile.file.name}`;
        
        const { data, error } = await supabase.storage
          .from('user-media')
          .upload(fileName, mediaFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          setFiles(prev => prev.map(f => 
            f.id === mediaFile.id 
              ? { ...f, status: 'error' as const, error: error.message }
              : f
          ));
          continue;
        }

        // Mock database insertion since table doesn't exist yet
        const mediaRecord = {
          id: crypto.randomUUID(),
          file_path: data.path,
          file_name: mediaFile.file.name,
          file_type: mediaFile.file.type,
          file_size: mediaFile.file.size,
          created_at: new Date().toISOString(),
          metadata: {
            originalName: mediaFile.file.name,
            uploadedAt: new Date().toISOString()
          }
        };
        const dbError = null;

        if (dbError) {
          setFiles(prev => prev.map(f => 
            f.id === mediaFile.id 
              ? { ...f, status: 'error' as const, error: dbError.message }
              : f
          ));
          continue;
        }

        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        ));

        uploadedFiles.push(mediaRecord);
      }

      if (uploadedFiles.length > 0) {
        toast({
          title: 'Upload complete',
          description: `Successfully uploaded ${uploadedFiles.length} file(s).`
        });
        onUploadComplete?.(uploadedFiles);
      }

      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
        <CardDescription>
          Upload images, videos, or audio files. Max {maxFiles} files, {Math.round(maxSize / 1024 / 1024)}MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supports images, videos, and audio files
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files ({files.length})</h4>
              <Button 
                onClick={uploadFiles} 
                disabled={isUploading || files.every(f => f.status === 'success')}
                size="sm"
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((mediaFile) => (
                <div key={mediaFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {mediaFile.preview ? (
                    <img 
                      src={mediaFile.preview} 
                      alt="" 
                      className="h-10 w-10 object-cover rounded" 
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(mediaFile.file.type)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mediaFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    
                    {mediaFile.status === 'uploading' && (
                      <Progress value={mediaFile.progress} className="mt-1 h-1" />
                    )}
                    
                    {mediaFile.error && (
                      <p className="text-xs text-destructive mt-1">{mediaFile.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        mediaFile.status === 'success' ? 'default' :
                        mediaFile.status === 'error' ? 'destructive' :
                        mediaFile.status === 'uploading' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {mediaFile.status}
                    </Badge>
                    
                    {mediaFile.status !== 'uploading' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(mediaFile.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}