import { useState, useEffect } from 'react';
import { Heart, ThumbsUp, Laugh, Frown, Angry } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ReactionData {
  chapterId: string;
  reactions: {
    like: number;
    love: number;
    laugh: number;
    sad: number;
    angry: number;
  };
  userReaction?: string;
}

interface ChapterLikesDisplayProps {
  chapterId: string;
}

const reactionIcons = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  love: { icon: Heart, label: 'Love', color: 'text-red-500' },
  laugh: { icon: Laugh, label: 'Laugh', color: 'text-yellow-500' },
  sad: { icon: Frown, label: 'Sad', color: 'text-gray-500' },
  angry: { icon: Angry, label: 'Angry', color: 'text-orange-500' }
};

export const ChapterLikesDisplay = ({ chapterId }: ChapterLikesDisplayProps) => {
  const [reactionData, setReactionData] = useState<ReactionData>({
    chapterId,
    reactions: { like: 0, love: 0, laugh: 0, sad: 0, angry: 0 }
  });

  useEffect(() => {
    // Load reaction data from localStorage
    const saved = localStorage.getItem(`manga_reactions_${chapterId}`);
    if (saved) {
      setReactionData(JSON.parse(saved));
    } else {
      // Initialize with mock data
      const mockData: ReactionData = {
        chapterId,
        reactions: {
          like: Math.floor(Math.random() * 100) + 20,
          love: Math.floor(Math.random() * 80) + 15,
          laugh: Math.floor(Math.random() * 30) + 5,
          sad: Math.floor(Math.random() * 10) + 2,
          angry: Math.floor(Math.random() * 5) + 1
        }
      };
      setReactionData(mockData);
      localStorage.setItem(`manga_reactions_${chapterId}`, JSON.stringify(mockData));
    }
  }, [chapterId]);

  const handleReaction = (reactionType: keyof typeof reactionIcons) => {
    setReactionData(prev => {
      const updated = { ...prev };
      
      // Remove previous user reaction
      if (updated.userReaction && updated.userReaction !== reactionType) {
        updated.reactions[updated.userReaction as keyof typeof updated.reactions]--;
      }
      
      // Add or toggle current reaction
      if (updated.userReaction === reactionType) {
        updated.reactions[reactionType]--;
        updated.userReaction = undefined;
      } else {
        updated.reactions[reactionType]++;
        updated.userReaction = reactionType;
      }
      
      localStorage.setItem(`manga_reactions_${chapterId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const totalReactions = Object.values(reactionData.reactions).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Chapter Reactions</h3>
          <span className="text-sm text-muted-foreground">
            {totalReactions} total reactions
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {Object.entries(reactionIcons).map(([type, { icon: Icon, label, color }]) => {
            const count = reactionData.reactions[type as keyof typeof reactionData.reactions];
            const isSelected = reactionData.userReaction === type;
            
            return (
              <Button
                key={type}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleReaction(type as keyof typeof reactionIcons)}
                className="flex items-center gap-1"
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : color}`} />
                <span className="text-xs">{count}</span>
              </Button>
            );
          })}
        </div>

        <div className="mt-3 space-y-1">
          {Object.entries(reactionData.reactions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => {
              const percentage = totalReactions > 0 ? (count / totalReactions) * 100 : 0;
              const { label, color } = reactionIcons[type as keyof typeof reactionIcons];
              
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <span className={`w-12 ${color}`}>{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};