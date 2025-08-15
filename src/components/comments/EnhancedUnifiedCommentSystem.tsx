
import React, { useState, useEffect } from 'react';
import { EmojiReactionSystem } from './EmojiReactionSystem';
import { useAdvancedComments } from '@/hooks/useAdvancedComments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ThumbsUp,
  Search,
  Filter,
  Pin,
  Users
} from 'lucide-react';
import { CommentSearch } from './search/CommentSearch';
import { CommentBookmarks } from './bookmarks/CommentBookmarks';
import { CommentSectionHeader } from './CommentSectionHeader';
import { InfiniteCommentList } from './enhanced/InfiniteCommentList';
import { GuestCommentSystem } from './enhanced/GuestCommentSystem';
import { ThemeAwareComments } from './enhanced/ThemeAwareComments';
import { MobileOptimizedComments } from './enhanced/MobileOptimizedComments';
import { generateSampleComments, SampleCommentsNotice } from './enhanced/RealSampleComments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedUnifiedCommentSystemProps {
  targetType: 'series' | 'chapter';
  targetId: string; // series_id or chapter_id
  targetTitle: string; // Series title or chapter title
  seriesSlug?: string; // For series navigation link
  showRating?: boolean; // Show rating system for chapters
  onRatingSubmit?: (rating: number) => void;
  className?: string;
}

export const EnhancedUnifiedCommentSystem: React.FC<EnhancedUnifiedCommentSystemProps> = ({ 
  targetType, 
  targetId, 
  targetTitle, 
  seriesSlug,
  showRating = false,
  onRatingSubmit,
  className = ""
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showSampleComments, setShowSampleComments] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    comments: realComments,
    loading,
    submitting,
    submitComment,
    editComment,
    deleteComment,
    pinComment,
    addReaction,
    removeReaction,
    toggleBookmark
  } = useAdvancedComments(targetId, targetType);

  // Combine real comments with sample comments for demo
  const sampleComments = showSampleComments ? generateSampleComments(targetType) : [];
  const comments = [...sampleComments, ...realComments];

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmitComment = async (content: string, attachments?: File[]) => {
    if (!user) return;
    
    try {
      await submitComment({
        target_id: targetId,
        target_type: targetType,
        content,
        parent_id: null
      }, attachments);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleGuestComment = async (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => {
    try {
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      
      const commentData: any = {
        guest_name: data.name,
        guest_email: data.email,
        guest_website: data.website || null,
        content: data.content,
        status: 'active'
      };

      if (targetType === 'chapter') {
        commentData.chapter_id = targetId;
      } else {
        commentData.series_id = targetId;
      }

      const { error } = await supabase.from(tableName as any).insert([commentData]);
      if (error) throw error;

      toast.success('Comment posted successfully!');
      // Refresh comments after successful submission
      window.location.reload();
    } catch (error) {
      console.error('Failed to submit guest comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    await addReaction(commentId, emoji);
  };

  const handleBookmark = async (commentId: string) => {
    await toggleBookmark(commentId);
  };

  const handleReport = async (commentId: string, reason: string, details?: string) => {
    console.log('Report comment:', commentId, reason, details);
    // Will be implemented with the report system
  };

  const handleNewComment = () => {
    // Scroll to comment input or open mobile composer
    const commentInput = document.querySelector('[data-comment-input]');
    if (commentInput) {
      commentInput.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ThemeAwareComments className={className} showThemeControls={false}>
      {/* Sample Comments Notice */}
      {showSampleComments && (
        <SampleCommentsNotice onDismiss={() => setShowSampleComments(false)} />
      )}

      {/* Mobile-Optimized Comments for Small Screens */}
      {isMobile ? (
        <MobileOptimizedComments
          comments={comments}
          loading={loading}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReaction={handleReaction}
          onRemoveReaction={removeReaction}
          onReply={(parentId) => console.log('Reply to:', parentId)}
          onEdit={(comment) => editComment(comment.id, comment.content)}
          onDelete={deleteComment}
          onPin={pinComment}
          onBookmark={handleBookmark}
          onReport={handleReport}
          onLike={(commentId) => console.log('Like comment:', commentId)}
          onNewComment={handleNewComment}
          currentUserId={user?.id}
          showModerationActions={user?.app_metadata?.role === 'admin'}
        />
      ) : (
        <div className="space-y-6">
          {/* First Container - Header & Input */}
          <CommentSectionHeader
            targetType={targetType}
            targetId={targetId}
            targetTitle={targetTitle}
            seriesSlug={seriesSlug}
            onUserComment={handleSubmitComment}
            onGuestComment={handleGuestComment}
            isSubmitting={submitting}
          />

          {/* Second Container - Comments Display */}
          <InfiniteCommentList
            comments={comments}
            loading={loading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReaction={handleReaction}
            onRemoveReaction={removeReaction}
            onReply={(parentId) => console.log('Reply to:', parentId)}
            onEdit={(comment) => editComment(comment.id, comment.content)}
            onDelete={deleteComment}
            onPin={pinComment}
            onBookmark={handleBookmark}
            onReport={handleReport}
            onLike={(commentId) => console.log('Like comment:', commentId)}
            currentUserId={user?.id}
            showModerationActions={user?.app_metadata?.role === 'admin'}
          />
        </div>
      )}
    </ThemeAwareComments>
  );
};
