import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onFileSelect: (files: File[]) => void;
  onImageInsert?: (url: string) => void;
  disabled?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onFileSelect,
  onImageInsert,
  disabled = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5
}) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.name} is not a valid image type`);
          } else {
            toast.error(`Error with file ${file.name}: ${error.message}`);
          }
        });
      });
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles);
      toast.success(`${acceptedFiles.length} file(s) selected for upload`);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    maxFiles,
    disabled,
    noClick: true, // We'll handle click manually
  });

  const handleImageUrlInsert = () => {
    if (!onImageInsert) return;

    const url = window.prompt('Enter image URL:');
    if (url && url.trim()) {
      onImageInsert(url.trim());
    }
  };

  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onDrop(files, []);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-1">
      {/* File Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={openFileDialog}
        disabled={disabled}
        title="Upload image files"
      >
        <Upload className="h-4 w-4" />
      </Button>

      {/* URL Insert Button */}
      {onImageInsert && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUrlInsert}
          disabled={disabled}
          title="Insert image from URL"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      )}

      {/* Hidden dropzone for drag & drop */}
      <div {...getRootProps()} className="fixed inset-0 pointer-events-none z-50">
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary pointer-events-auto flex items-center justify-center">
            <div className="bg-background/90 p-6 rounded-lg border shadow-lg">
              <div className="flex items-center gap-3 text-lg font-medium">
                <Upload className="h-6 w-6 text-primary" />
                Drop images here to upload
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};