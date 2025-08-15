import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedRichTextEditor } from './advanced/AdvancedRichTextEditor';
import { GuestCommentForm } from './GuestCommentForm';
import { LogIn, UserPlus, MessageCircle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisplaySettingsDropdown } from './DisplaySettingsDropdown';
import { EmojiReactionSystem } from './EmojiReactionSystem';

interface UniversalCommentInputProps {
  onUserComment: (content: string, attachments?: File[]) => void;
  onGuestComment: (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => void;
  targetType: 'series' | 'chapter';
  targetId: string;
  targetTitle: string;
  isSubmitting?: boolean;
  className?: string;
}

export const UniversalCommentInput: React.FC<UniversalCommentInputProps> = ({
  onUserComment,
  onGuestComment,
  targetType,
  targetId,
  targetTitle,
  isSubmitting = false,
  className
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState(user ? 'user' : 'guest');

  const handleUserComment = async (content: string, attachments?: File[]) => {
    await onUserComment(content, attachments);
    setContent('');
  };

  const handleGuestComment = async (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => {
    await onGuestComment(data);
  };

  const CommentPrompt = () => (
    <div className="text-center py-6">
      <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-2">Share Your Thoughts</h3>
      <p className="text-muted-foreground mb-4">
        Join the discussion about this {targetType}
      </p>
    </div>
  );

  if (user) {
    return (
      <Card className={cn('border-border/30 bg-card/20 backdrop-blur-sm', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
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
          
          {/* Emoji Reactions directly below comment input */}
          <div className="mt-4">
            <EmojiReactionSystem
              targetType={targetType}
              targetId={targetId}
              targetTitle={targetTitle}
              className=""
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-border/30 bg-card/20 backdrop-blur-sm', className)}>
      <CardContent className="p-6">
        <CommentPrompt />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="guest" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comment as Guest
            </TabsTrigger>
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guest" className="mt-0">
            <GuestCommentForm
              onSubmit={handleGuestComment}
              isSubmitting={isSubmitting}
            />
            
            {/* Emoji Reactions for guests */}
            <div className="mt-4">
              <EmojiReactionSystem
                targetType={targetType}
                targetId={targetId}
                targetTitle={targetTitle}
                className=""
              />
            </div>
          </TabsContent>
          
          <TabsContent value="login" className="mt-0">
            <div className="text-center py-8">
              <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sign In for More Features</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to access advanced features like rich text editing, 
                file attachments, mentions, and personalized discussions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
                <Button 
                  variant="default" 
                  className="flex items-center gap-2"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Member Benefits:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Rich text formatting and file attachments</li>
                  <li>• Mention other users with @username</li>
                  <li>• Bookmark and save your favorite comments</li>
                  <li>• Edit and manage your comment history</li>
                  <li>• Participate in polls and advanced discussions</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};