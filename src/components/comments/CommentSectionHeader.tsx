import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedRichTextEditor } from './advanced/AdvancedRichTextEditor';
import { EmojiReactionSystem } from './EmojiReactionSystem';
import { DisplaySettingsDropdown } from './DisplaySettingsDropdown';
import { LogIn, Crown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CommentSectionHeaderProps {
  targetType: 'series' | 'chapter';
  targetId: string;
  targetTitle: string;
  seriesSlug?: string;
  onUserComment: (content: string, attachments?: File[]) => void;
  onGuestComment: (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const CommentSectionHeader: React.FC<CommentSectionHeaderProps> = ({
  targetType,
  targetId,
  targetTitle,
  seriesSlug,
  onUserComment,
  onGuestComment,
  isSubmitting = false,
  className
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestContent, setGuestContent] = useState('');

  // Parse the title to extract series name, chapter number, and chapter title
  const parseTitleInfo = () => {
    if (targetType === 'series') {
      return {
        seriesTitle: targetTitle,
        chapterNumber: null,
        chapterTitle: null
      };
    }

    // For chapter comments, parse: "Series Title - Chapter X: Chapter Title"
    const match = targetTitle.match(/^(.+?) - Chapter (\d+): (.+)$/);
    if (match) {
      return {
        seriesTitle: match[1],
        chapterNumber: match[2],
        chapterTitle: match[3]
      };
    }

    // Fallback parsing
    const parts = targetTitle.split(' - ');
    if (parts.length >= 2) {
      return {
        seriesTitle: parts[0],
        chapterNumber: null,
        chapterTitle: parts.slice(1).join(' - ')
      };
    }

    return {
      seriesTitle: targetTitle,
      chapterNumber: null,
      chapterTitle: null
    };
  };

  const { seriesTitle, chapterNumber, chapterTitle } = parseTitleInfo();

  const handleSeriesClick = () => {
    if (seriesSlug) {
      navigate(`/series/${seriesSlug}`);
    }
  };

  const handleUserComment = async (content: string, attachments?: File[]) => {
    await onUserComment(content, attachments);
    setContent('');
  };

  const handleGuestComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestContent.trim()) return;

    await onGuestComment({
      name: guestName.trim(),
      email: guestEmail.trim(),
      content: guestContent.trim()
    });

    setGuestName('');
    setGuestEmail('');
    setGuestContent('');
  };

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  return (
    <Card className={cn('border-border/30 bg-card/20 backdrop-blur-sm', className)}>
      <CardContent className="p-4">
        {/* Title Section */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            {seriesSlug ? (
              <button
                onClick={handleSeriesClick}
                className="text-primary hover:text-primary/80 underline decoration-1 underline-offset-2"
              >
                {seriesTitle}
              </button>
            ) : (
              <span>{seriesTitle}</span>
            )}
            {chapterNumber && chapterTitle && (
              <span className="text-muted-foreground">
                {' '}- Chapter {chapterNumber} - {chapterTitle}
              </span>
            )}
          </h2>
        </div>

        {/* Emoji Reactions */}
        <div className="mb-4">
          <EmojiReactionSystem
            targetType={targetType}
            targetId={targetId}
            targetTitle={targetTitle}
            className=""
          />
        </div>

        {/* Comment Input Area */}
        {user ? (
          // Logged in user - Rich text editor
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {user.user_metadata?.name?.slice(0, 2).toUpperCase() || 
                   user.email?.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {user.user_metadata?.name || user.email}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                </div>
              </div>
              <DisplaySettingsDropdown />
            </div>
            
            <AdvancedRichTextEditor
              content={content}
              onChange={setContent}
              onSubmit={handleUserComment}
              placeholder={`Share your thoughts about this ${targetType}...`}
              maxLength={2000}
              enableAttachments={true}
              enableMentions={true}
              disabled={isSubmitting}
            />
          </div>
        ) : (
          // Guest user - Rich text editor with guest info
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <Input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="guestEmail" className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <AdvancedRichTextEditor
              content={guestContent}
              onChange={setGuestContent}
              onSubmit={(content) => {
                if (!guestName.trim() || !guestEmail.trim()) {
                  return;
                }
                handleGuestComment({
                  name: guestName.trim(),
                  email: guestEmail.trim(),
                  content: content.trim(),
                } as any);
              }}
              placeholder={`Share your thoughts about this ${targetType}...`}
              maxLength={2000}
              enableAttachments={false}
              enableMentions={false}
              disabled={isSubmitting || !guestName.trim() || !guestEmail.trim()}
            />

            <div className="flex items-center gap-3 mt-3">
              <div className="text-muted-foreground text-sm">or</div>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleLogin}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login for full features
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};