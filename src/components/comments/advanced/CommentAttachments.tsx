import React from 'react';
import { Card } from '@/components/ui/card';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface CommentAttachmentsProps {
  attachments: Attachment[];
}

export const CommentAttachments: React.FC<CommentAttachmentsProps> = ({ attachments }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-2">
          {attachment.file_type.startsWith('image/') ? (
            <img 
              src={attachment.file_url} 
              alt={attachment.file_name}
              className="w-full h-auto rounded"
            />
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm font-medium">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};