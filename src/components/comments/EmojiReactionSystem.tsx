import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[];
}
interface EmojiReactionSystemProps {
  targetType: 'chapter' | 'series';
  targetId: string;
  targetTitle: string;
  className?: string;
}
const EMOJI_OPTIONS = [{
  emoji: '😀',
  label: 'Great',
  description: 'Amazing chapter!'
}, {
  emoji: '😍',
  label: 'Love',
  description: 'Absolutely loved it!'
}, {
  emoji: '😔',
  label: 'Sad',
  description: 'This made me sad'
}, {
  emoji: '😡',
  label: 'Angry',
  description: 'This made me angry'
}, {
  emoji: '😱',
  label: 'Shocked',
  description: 'What a twist!'
}];
export const EmojiReactionSystem: React.FC<EmojiReactionSystemProps> = ({
  targetType,
  targetId,
  targetTitle,
  className = ""
}) => {
  const [reactions, setReactions] = useState<Record<string, EmojiReaction>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const tableName = targetType === 'chapter' ? 'chapter_reactions' : 'series_reactions';
  const foreignKey = targetType === 'chapter' ? 'chapter_id' : 'series_id';
  useEffect(() => {
    loadReactions();
  }, [targetId, targetType, user?.id]);
  const initializeReactions = () => {
    const initialReactions: Record<string, EmojiReaction> = {};
    EMOJI_OPTIONS.forEach(option => {
      initialReactions[option.emoji] = {
        emoji: option.emoji,
        count: 0,
        users: []
      };
    });
    return initialReactions;
  };
  const loadReactions = async () => {
    try {
      setLoading(true);

      // Initialize with zero counts
      const newReactions = initializeReactions();

      // Create table if it doesn't exist (for development)
      await ensureTableExists();

      // Load reactions from database with retry logic
      const reactionData = await loadWithRetry();
      if (reactionData) {
        // Process reaction data
        reactionData.forEach((reaction: any) => {
          const emoji = reaction.emoji;
          if (!newReactions[emoji]) {
            newReactions[emoji] = {
              emoji,
              count: 0,
              users: []
            };
          }
          newReactions[emoji].count++;
          newReactions[emoji].users.push(reaction.user_id);
        });

        // Set user reactions if authenticated
        if (user) {
          const userReactionEmojis = reactionData.filter((r: any) => r.user_id === user.id).map((r: any) => r.emoji);
          setUserReactions(new Set(userReactionEmojis));
        }
      }
      setReactions(newReactions);
    } catch (error) {
      console.error('Failed to load reactions:', error);
      // Use localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };
  const ensureTableExists = async () => {
    try {
      // Simple check to see if table exists
      const {
        error
      } = await supabase.from(tableName as any).select('count(*)', {
        count: 'exact',
        head: true
      }).limit(1);
      if (error && error.code === '42P01') {
        // Table doesn't exist, use localStorage fallback
        throw new Error('Table does not exist');
      }
    } catch (error) {
      // Table might not exist, we'll handle this gracefully
      throw error;
    }
  };
  const loadWithRetry = async (retries = 3): Promise<any[] | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const {
          data,
          error
        } = await supabase.from(tableName as any).select('emoji, user_id').eq(foreignKey, targetId);
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    return null;
  };
  const loadFromLocalStorage = () => {
    try {
      const storageKey = `reactions:${targetType}:${targetId}`;
      const stored = localStorage.getItem(storageKey);
      const userStorageKey = `user_reactions:${user?.id}:${targetType}:${targetId}`;
      const userStored = localStorage.getItem(userStorageKey);
      if (stored) {
        const storedReactions = JSON.parse(stored);
        setReactions({
          ...initializeReactions(),
          ...storedReactions
        });
      } else {
        setReactions(initializeReactions());
      }
      if (userStored && user) {
        setUserReactions(new Set(JSON.parse(userStored)));
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setReactions(initializeReactions());
    }
  };
  const saveToLocalStorage = (newReactions: Record<string, EmojiReaction>, newUserReactions: Set<string>) => {
    try {
      const storageKey = `reactions:${targetType}:${targetId}`;
      const userStorageKey = `user_reactions:${user?.id}:${targetType}:${targetId}`;
      localStorage.setItem(storageKey, JSON.stringify(newReactions));
      if (user) {
        localStorage.setItem(userStorageKey, JSON.stringify(Array.from(newUserReactions)));
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };
  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to react to this " + targetType,
        variant: "destructive"
      });
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      const hasReacted = userReactions.has(emoji);

      // Optimistic update
      const newReactions = {
        ...reactions
      };
      const newUserReactions = new Set(userReactions);
      if (hasReacted) {
        // Remove reaction
        newReactions[emoji].count = Math.max(0, newReactions[emoji].count - 1);
        newReactions[emoji].users = newReactions[emoji].users.filter(id => id !== user.id);
        newUserReactions.delete(emoji);
      } else {
        // Add reaction
        newReactions[emoji].count++;
        newReactions[emoji].users.push(user.id);
        newUserReactions.add(emoji);
      }
      setReactions(newReactions);
      setUserReactions(newUserReactions);

      // Try to save to database, fallback to localStorage
      try {
        if (hasReacted) {
          const {
            error
          } = await supabase.from(tableName as any).delete().eq(foreignKey, targetId).eq('user_id', user.id).eq('emoji', emoji);
          if (error) throw error;
        } else {
          const insertData = {
            [foreignKey]: targetId,
            user_id: user.id,
            emoji: emoji
          };
          const {
            error
          } = await supabase.from(tableName as any).insert(insertData);
          if (error) throw error;
        }
      } catch (dbError) {
        console.error('Database error, using localStorage:', dbError);
        // Save to localStorage as fallback
        saveToLocalStorage(newReactions, newUserReactions);
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      // Revert optimistic update on error
      await loadReactions();
      toast({
        title: "Error",
        description: "Failed to update your reaction",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const getTotalReactions = () => {
    return Object.values(reactions).reduce((sum, reaction) => sum + reaction.count, 0);
  };
  const getTopReactions = () => {
    return Object.values(reactions).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  };
  if (loading) {
    return <Card className={`p-6 ${className}`}>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="flex gap-4">
            {EMOJI_OPTIONS.map((_, i) => <div key={i} className="h-12 w-16 bg-muted rounded"></div>)}
          </div>
        </div>
      </Card>;
  }
  return <Card className={`border-border/30 bg-card/20 backdrop-blur-sm ${className}`}>
      <div className="p-6 px-[24px] py-[5px]">
        <div className="text-center mb-6">
          
          <p className="text-muted-foreground text-sm">
            Share your reaction with the community
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          {EMOJI_OPTIONS.map(option => {
          const reaction = reactions[option.emoji];
          const hasReacted = userReactions.has(option.emoji);
          return <Button key={option.emoji} variant={hasReacted ? "default" : "outline"} size="lg" onClick={() => handleReaction(option.emoji)} disabled={submitting} className={`flex flex-col items-center gap-2 h-auto py-4 px-6 transition-all duration-300 hover:scale-105 ${hasReacted ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 hover:border-primary/50 hover:bg-primary/10'}`} title={option.description} style={{ filter: hasReacted ? 'drop-shadow(0 4px 12px hsl(var(--primary) / 0.3))' : 'drop-shadow(0 2px 4px hsl(var(--foreground) / 0.1))' }}>
                <span className="text-3xl transition-all duration-200" style={{ filter: 'drop-shadow(0 2px 4px hsl(var(--foreground) / 0.1))' }}>{option.emoji}</span>
                <div className="text-center">
                  <div className="text-xs font-medium">{option.label}</div>
                  <div className="text-xs opacity-75">{reaction?.count || 0}</div>
                </div>
              </Button>;
        })}
        </div>

        {getTotalReactions() > 0 && <div className="space-y-4 border-t border-border/30 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Community Reactions</h4>
              <span className="text-xs text-muted-foreground">
                {getTotalReactions()} total reactions
              </span>
            </div>

            <div className="space-y-2">
              {getTopReactions().map(reaction => {
            const option = EMOJI_OPTIONS.find(opt => opt.emoji === reaction.emoji);
            const percentage = getTotalReactions() > 0 ? reaction.count / getTotalReactions() * 100 : 0;
            return <div key={reaction.emoji} className="flex items-center gap-3">
                    <span className="text-xl">{reaction.emoji}</span>
                    <span className="text-sm w-16">{option?.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{
                  width: `${percentage}%`
                }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {reaction.count}
                    </span>
                  </div>;
          })}
            </div>
          </div>}
      </div>
    </Card>;
};

// Component to format the title with series link
const ReactionsTitle: React.FC<{
  targetTitle: string;
  targetType: 'chapter' | 'series';
}> = ({
  targetTitle,
  targetType
}) => {
  const navigate = useNavigate();

  // Parse the title to extract series name and chapter title
  const parseTitle = (title: string) => {
    if (targetType === 'series') {
      return {
        seriesName: title,
        chapterTitle: null
      };
    }

    // For chapters, expect format: "Series Name - Chapter X: Chapter Title"
    const match = title.match(/^(.+?) - (.+)$/);
    if (match) {
      const [, seriesName, chapterPart] = match;
      return {
        seriesName: seriesName.trim(),
        chapterTitle: chapterPart.trim()
      };
    }

    // Fallback if format doesn't match
    return {
      seriesName: title,
      chapterTitle: null
    };
  };
  const {
    seriesName,
    chapterTitle
  } = parseTitle(targetTitle);
  const handleSeriesClick = () => {
    // Convert series name to slug (basic implementation)
    const slug = seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    navigate(`/series/${slug}`);
  };
  if (targetType === 'series') {
    return <>How did you like "{seriesName}"?</>;
  }
  return <>
      How did you like{' '}
      <button onClick={handleSeriesClick} className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
        {seriesName}
      </button>
      {chapterTitle && <>
          {' - '}
          {chapterTitle}
        </>}
      ?
    </>;
};