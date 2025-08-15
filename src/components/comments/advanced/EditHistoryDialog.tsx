import React from 'react';

interface EditHistoryDialogProps {
  commentId: string;
}

export const EditHistoryDialog: React.FC<EditHistoryDialogProps> = ({ commentId }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Edit history for comment {commentId} - Feature coming soon
      </p>
    </div>
  );
};