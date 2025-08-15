import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Video, 
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  className = ""
}) => {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`File ${file.name} is too large. Max size is ${formatFileSize(maxFileSize)}`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`File ${file.name} has an invalid type`);
        } else if (error.code === 'too-many-files') {
          toast.error(`Too many files. Maximum is ${maxFiles} files`);
        }
      });
    });

    // Handle accepted files
    const newFiles: AttachedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    const updatedFiles = [...attachedFiles, ...newFiles].slice(0, maxFiles);
    setAttachedFiles(updatedFiles);
    onFilesChange(updatedFiles.map(f => f.file));
  }, [attachedFiles, maxFiles, maxFileSize, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - attachedFiles.length,
    maxSize: maxFileSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: attachedFiles.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    const updatedFiles = attachedFiles.filter(f => f.id !== id);
    setAttachedFiles(updatedFiles);
    onFilesChange(updatedFiles.map(f => f.file));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (file.type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {attachedFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxFiles} files, {formatFileSize(maxFileSize)} each
          </p>
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files ({attachedFiles.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {attachedFiles.map((attachedFile) => (
              <div key={attachedFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {attachedFile.preview ? (
                  <img
                    src={attachedFile.preview}
                    alt={attachedFile.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(attachedFile.file)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachedFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachedFile.file.size)}
                  </p>
                  
                  {attachedFile.uploading && (
                    <Progress value={attachedFile.progress || 0} className="mt-1" />
                  )}
                  
                  {attachedFile.error && (
                    <p className="text-xs text-destructive mt-1">{attachedFile.error}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(attachedFile.id)}
                  disabled={attachedFile.uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-muted-foreground">
        <span>Supported formats: </span>
        {acceptedTypes.map((type, index) => (
          <Badge key={type} variant="outline" className="text-xs mr-1">
            {type.replace('*', 'all').replace('.', '')}
          </Badge>
        ))}
      </div>
    </div>
  );
};