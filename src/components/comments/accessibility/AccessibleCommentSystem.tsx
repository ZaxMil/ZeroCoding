import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  Heart,
  Smile,
  Pin,
  Flag,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  Minus,
  Plus
} from 'lucide-react';

interface AccessibleCommentSystemProps {
  comments: AdvancedComment[];
  onReaction: (commentId: string, emoji: string) => void;
  onReply: (parentId: string) => void;
  onBookmark: (commentId: string) => void;
  onReport: (commentId: string, reason: string) => void;
  currentUserId?: string;
  className?: string;
}

type ContrastMode = 'normal' | 'high' | 'ultra';
type FontSize = 'small' | 'medium' | 'large' | 'xl';
type MotionPreference = 'full' | 'reduced' | 'none';

interface AccessibilitySettings {
  contrastMode: ContrastMode;
  fontSize: FontSize;
  motionPreference: MotionPreference;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
  compactMode: boolean;
}

export const AccessibleCommentSystem: React.FC<AccessibleCommentSystemProps> = ({
  comments,
  onReaction,
  onReply,
  onBookmark,
  onReport,
  currentUserId,
  className
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    contrastMode: 'normal',
    fontSize: 'medium',
    motionPreference: 'full',
    screenReaderMode: false,
    keyboardNavigation: true,
    audioDescriptions: false,
    compactMode: false
  });

  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }

    // Load accessibility settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Detect user preferences from system
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, motionPreference: 'reduced' }));
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, contrastMode: 'high' }));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    
    // Apply CSS custom properties for dynamic styling
    const root = document.documentElement;
    
    // Font size adjustments
    const fontSizeMap = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xl: '1.25rem'
    };
    root.style.setProperty('--comment-font-size', fontSizeMap[settings.fontSize]);

    // Contrast adjustments
    if (settings.contrastMode === 'high') {
      root.style.setProperty('--comment-bg', 'hsl(0 0% 100%)');
      root.style.setProperty('--comment-text', 'hsl(0 0% 0%)');
      root.style.setProperty('--comment-border', 'hsl(0 0% 20%)');
    } else if (settings.contrastMode === 'ultra') {
      root.style.setProperty('--comment-bg', 'hsl(0 0% 0%)');
      root.style.setProperty('--comment-text', 'hsl(0 0% 100%)');
      root.style.setProperty('--comment-border', 'hsl(0 0% 80%)');
    }

    // Motion preferences
    if (settings.motionPreference !== 'full') {
      root.style.setProperty('--comment-animation-duration', settings.motionPreference === 'none' ? '0s' : '0.1s');
    }
  }, [settings]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, commentId: string) => {
    if (!settings.keyboardNavigation) return;

    const currentIndex = comments.findIndex(c => c.id === commentId);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < comments.length - 1) {
          setFocusedCommentId(comments[currentIndex + 1].id);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          setFocusedCommentId(comments[currentIndex - 1].id);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggleCommentExpansion(commentId);
        break;
      case 'r':
        if (event.ctrlKey) {
          event.preventDefault();
          onReply(commentId);
        }
        break;
      case 'l':
        if (event.ctrlKey) {
          event.preventDefault();
          onReaction(commentId, '👍');
        }
        break;
      case 'b':
        if (event.ctrlKey) {
          event.preventDefault();
          onBookmark(commentId);
        }
        break;
      case 's':
        if (event.ctrlKey && event.altKey) {
          event.preventDefault();
          speakComment(comments.find(c => c.id === commentId));
        }
        break;
    }
  }, [comments, settings.keyboardNavigation, onReply, onReaction, onBookmark]);

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      return newExpanded;
    });
  };

  const speakComment = (comment?: AdvancedComment) => {
    if (!comment || !speechSynthesis.current || !settings.audioDescriptions) return;

    if (isPlaying) {
      speechSynthesis.current.cancel();
      setIsPlaying(false);
      return;
    }

    const text = `Comment by ${comment.guest_name || comment.user?.user_metadata?.name || 'Anonymous'}. ${comment.content}. ${comment.like_count} likes. Posted on ${new Date(comment.created_at).toLocaleDateString()}.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.current.speak(utterance);
  };

  const updateSettings = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getContrastClasses = () => {
    switch (settings.contrastMode) {
      case 'high':
        return 'bg-white text-black border-gray-600';
      case 'ultra':
        return 'bg-black text-white border-gray-300';
      default:
        return '';
    }
  };

  const getFontSizeClasses = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const getAnimationClasses = () => {
    if (settings.motionPreference === 'none') {
      return '';
    }
    return settings.motionPreference === 'reduced' 
      ? 'transition-opacity duration-100' 
      : 'transition-all duration-300 hover:scale-[1.02] hover:shadow-md';
  };

  return (
    <div 
      className={cn("space-y-4", className)}
      ref={commentsContainerRef}
    >
      {/* Accessibility Settings Panel */}
      <Card className={cn("border-2", getContrastClasses())}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Accessibility Settings
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              aria-expanded={showSettings}
              aria-controls="accessibility-settings"
            >
              {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showSettings && (
            <div id="accessibility-settings" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Contrast Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Contrast Mode</label>
                <div className="flex gap-1">
                  {['normal', 'high', 'ultra'].map(mode => (
                    <Button
                      key={mode}
                      variant={settings.contrastMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings('contrastMode', mode)}
                      aria-pressed={settings.contrastMode === mode}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Font Size</label>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings('fontSize', 
                      settings.fontSize === 'small' ? 'small' : 
                      settings.fontSize === 'medium' ? 'small' :
                      settings.fontSize === 'large' ? 'medium' : 'large'
                    )}
                    aria-label="Decrease font size"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm border rounded-md min-w-[60px] text-center">
                    {settings.fontSize}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings('fontSize', 
                      settings.fontSize === 'small' ? 'medium' :
                      settings.fontSize === 'medium' ? 'large' :
                      settings.fontSize === 'large' ? 'xl' : 'xl'
                    )}
                    aria-label="Increase font size"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Audio Descriptions */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Audio Features</label>
                <Button
                  variant={settings.audioDescriptions ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings('audioDescriptions', !settings.audioDescriptions)}
                  aria-pressed={settings.audioDescriptions}
                  className="w-full"
                >
                  {settings.audioDescriptions ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                  Text-to-Speech
                </Button>
              </div>

              {/* Motion Preferences */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Motion</label>
                <div className="flex gap-1">
                  {['full', 'reduced', 'none'].map(motion => (
                    <Button
                      key={motion}
                      variant={settings.motionPreference === motion ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings('motionPreference', motion)}
                      aria-pressed={settings.motionPreference === motion}
                    >
                      {motion}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Compact Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Layout</label>
                <Button
                  variant={settings.compactMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings('compactMode', !settings.compactMode)}
                  aria-pressed={settings.compactMode}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Compact Mode
                </Button>
              </div>

              {/* Keyboard Navigation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Navigation</label>
                <Button
                  variant={settings.keyboardNavigation ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings('keyboardNavigation', !settings.keyboardNavigation)}
                  aria-pressed={settings.keyboardNavigation}
                  className="w-full"
                >
                  Keyboard Navigation
                </Button>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          {settings.keyboardNavigation && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <span><kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigate</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> Expand</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+R</kbd> Reply</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+L</kbd> Like</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+B</kbd> Bookmark</span>
                <span><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Alt+S</kbd> Speak</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4" role="main" aria-label="Comments section">
        {comments.map((comment, index) => (
          <AccessibleCommentCard
            key={comment.id}
            comment={comment}
            settings={settings}
            isExpanded={expandedComments.has(comment.id)}
            isFocused={focusedCommentId === comment.id}
            onToggleExpansion={() => toggleCommentExpansion(comment.id)}
            onReaction={onReaction}
            onReply={onReply}
            onBookmark={onBookmark}
            onReport={onReport}
            onSpeak={() => speakComment(comment)}
            onKeyDown={(e) => handleKeyDown(e, comment.id)}
            onFocus={() => setFocusedCommentId(comment.id)}
            currentUserId={currentUserId}
            isPlaying={isPlaying}
            index={index}
            total={comments.length}
          />
        ))}
      </div>

      {/* Skip to Navigation */}
      <div className="sr-only">
        <Button
          onClick={() => {
            const firstComment = commentsContainerRef.current?.querySelector('[role="article"]') as HTMLElement;
            firstComment?.focus();
          }}
        >
          Skip to first comment
        </Button>
      </div>
    </div>
  );
};

// Accessible individual comment card
const AccessibleCommentCard: React.FC<{
  comment: AdvancedComment;
  settings: AccessibilitySettings;
  isExpanded: boolean;
  isFocused: boolean;
  onToggleExpansion: () => void;
  onReaction: (commentId: string, emoji: string) => void;
  onReply: (parentId: string) => void;
  onBookmark: (commentId: string) => void;
  onReport: (commentId: string, reason: string) => void;
  onSpeak: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  currentUserId?: string;
  isPlaying: boolean;
  index: number;
  total: number;
}> = ({
  comment,
  settings,
  isExpanded,
  isFocused,
  onToggleExpansion,
  onReaction,
  onReply,
  onBookmark,
  onReport,
  onSpeak,
  onKeyDown,
  onFocus,
  currentUserId,
  isPlaying,
  index,
  total
}) => {
  const isOwn = comment.user_id === currentUserId;
  const isGuest = !!comment.guest_name;
  const authorName = comment.guest_name || comment.user?.user_metadata?.name || 'Anonymous';

  const getContrastClasses = () => {
    switch (settings.contrastMode) {
      case 'high':
        return 'bg-white text-black border-gray-600';
      case 'ultra':
        return 'bg-black text-white border-gray-300';
      default:
        return '';
    }
  };

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`Comment ${index + 1} of ${total} by ${authorName}`}
      aria-describedby={`comment-content-${comment.id}`}
      className={cn(
        "border-2 transition-all duration-200",
        isFocused && "ring-2 ring-primary ring-offset-2",
        isOwn && "border-primary/50",
        settings.compactMode ? "p-3" : "p-4",
        getContrastClasses(),
        settings.motionPreference !== 'none' && "hover:shadow-md"
      )}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <CardContent className={cn("p-0 space-y-3", settings.compactMode && "space-y-2")}>
        {/* Comment Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-xs font-medium">
                {authorName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-medium", settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base')}>
                  {authorName}
                </span>
                {isGuest && <Badge variant="outline" aria-label="Guest user">Guest</Badge>}
                {comment.profile?.role === 'admin' && <Badge variant="default" aria-label="Administrator">Admin</Badge>}
                {comment.is_pinned && <Pin className="h-4 w-4 text-primary" aria-label="Pinned comment" />}
              </div>
              <time 
                className="text-xs text-muted-foreground"
                dateTime={comment.created_at}
              >
                {new Date(comment.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
          </div>

          {/* Audio Control */}
          {settings.audioDescriptions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSpeak}
              aria-label={isPlaying ? 'Stop reading comment' : 'Read comment aloud'}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Comment Content */}
        <div 
          id={`comment-content-${comment.id}`}
          className={cn(
            "prose prose-sm max-w-none",
            settings.fontSize === 'small' && 'text-sm',
            settings.fontSize === 'large' && 'text-lg prose-lg',
            settings.fontSize === 'xl' && 'text-xl prose-xl'
          )}
        >
          <p className="leading-relaxed">{comment.content}</p>
        </div>

        {/* Comment Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span aria-label={`${comment.like_count} likes`}>
            <ThumbsUp className="h-4 w-4 inline mr-1" aria-hidden="true" />
            {comment.like_count}
          </span>
          {comment.replies && comment.replies.length > 0 && (
            <span aria-label={`${comment.replies.length} replies`}>
              <Reply className="h-4 w-4 inline mr-1" aria-hidden="true" />
              {comment.replies.length}
            </span>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReaction(comment.id, '👍')}
            aria-label="Like this comment"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Like
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            aria-label="Reply to this comment"
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark(comment.id)}
            aria-label={comment.is_bookmarked ? 'Remove bookmark' : 'Bookmark this comment'}
            aria-pressed={comment.is_bookmarked}
          >
            <Bookmark className={cn("h-4 w-4 mr-1", comment.is_bookmarked && "fill-current")} />
            {comment.is_bookmarked ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReport(comment.id, 'inappropriate')}
            aria-label="Report this comment"
          >
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-6 space-y-3 border-l-2 border-border/30 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpansion}
              aria-expanded={isExpanded}
              aria-controls={`replies-${comment.id}`}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>

            {isExpanded && (
              <div id={`replies-${comment.id}`} className="space-y-3">
                {comment.replies.map(reply => (
                  <div key={reply.id} className="p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {reply.guest_name || reply.user?.user_metadata?.name || 'Anonymous'}
                      </span>
                      {reply.profile?.role === 'admin' && (
                        <Badge variant="default" className="text-xs">Admin</Badge>
                      )}
                      <time className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};