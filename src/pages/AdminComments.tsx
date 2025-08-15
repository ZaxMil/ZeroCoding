import React from 'react';
import { CommentsManager } from '@/components/comments/CommentsManager';

const AdminComments = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <CommentsManager />
    </div>
  );
};

export default AdminComments;