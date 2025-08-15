import { useState } from 'react';
import { useComments } from './CommentsProvider';
import { AdvancedRichTextEditor } from '@/components/comments/advanced/AdvancedRichTextEditor';
import AuthModal from '@/components/AuthModal';
import { toast } from 'sonner';

export const RichCommentEditor = ({ parentId }: { parentId?: string }) => {
  const { api, scope, user } = useComments();
  const [content, setContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubmit = async (htmlContent: string, attachments?: File[]) => {
    if (!user) { 
      setShowAuthModal(true); 
      return; 
    }
    
    try {
      // Convert HTML content to plain text for the current API
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Convert File[] to Attachment[] if needed
      const uploadedAttachments: any[] = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments.slice(0, 3)) {
          try {
            const attachment = await api.uploadImage(file);
            uploadedAttachments.push(attachment);
          } catch (e) {
            console.error('Failed to upload attachment:', e);
          }
        }
      }
      
      await api.postComment(scope, user, { 
        content: plainText, 
        parentId, 
        attachments: uploadedAttachments 
      });
      
      setContent('');
      toast.success('Comment posted successfully!');
    } catch (e: any) {
      console.error('Failed to post comment:', e);
      toast.error(e?.message || 'Failed to post comment. Please try again.');
    }
  };

  return (
    <>
      <AdvancedRichTextEditor
        content={content}
        onChange={setContent}
        onSubmit={handleSubmit}
        placeholder="Write your comment..."
        maxLength={2000}
        enableAttachments={true}
        enableMentions={true}
        disabled={!user}
        className="w-full"
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
