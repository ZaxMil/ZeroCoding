import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBadges } from '@/hooks/useBadges';
import { 
  Star, 
  Crown, 
  Trophy, 
  Award, 
  Heart, 
  MessageCircle, 
  ThumbsUp,
  Flame,
  Shield,
  Zap
} from 'lucide-react';

interface UserBadgesProps {
  userId: string;
  showProgress?: boolean;
  layout?: 'horizontal' | 'grid';
  className?: string;
}

const badgeIcons: Record<string, React.ReactNode> = {
  star: <Star className="w-4 h-4" />,
  crown: <Crown className="w-4 h-4" />,
  trophy: <Trophy className="w-4 h-4" />,
  award: <Award className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  message: <MessageCircle className="w-4 h-4" />,
  thumbsUp: <ThumbsUp className="w-4 h-4" />,
  flame: <Flame className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
};

const rarityColors = {
  common: 'bg-slate-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
};

export const UserBadges: React.FC<UserBadgesProps> = ({
  userId,
  showProgress = false,
  layout = 'horizontal',
  className = ""
}) => {
  const { userBadges, badges, loading } = useBadges();

  const getIconFromUrl = (iconUrl?: string) => {
    if (!iconUrl) return <Award className="w-4 h-4" />;
    
    // Extract icon name from URL or use as key
    const iconKey = iconUrl.split('/').pop()?.split('.')[0] || 'award';
    return badgeIcons[iconKey] || <Award className="w-4 h-4" />;
  };

  const BadgeComponent: React.FC<{ 
    badge: any; 
    earned?: boolean; 
    progress?: number; 
    maxProgress?: number;
  }> = ({ badge, earned = true, progress, maxProgress }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`
            relative inline-flex items-center justify-center w-12 h-12 rounded-full
            ${earned ? badge.color || rarityColors[badge.rarity as keyof typeof rarityColors] : 'bg-muted'} 
            ${earned ? 'text-white' : 'text-muted-foreground'}
            transition-all hover:scale-110
          `}>
            {getIconFromUrl(badge.icon_url)}
            {!earned && progress !== undefined && maxProgress && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-xs">
                {Math.round((progress / maxProgress) * 100)}%
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {badge.granted_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Earned: {new Date(badge.granted_at).toLocaleDateString()}
              </p>
            )}
            {!earned && progress !== undefined && maxProgress && (
              <div className="mt-2">
                <Progress value={(progress / maxProgress) * 100} className="h-2" />
                <p className="text-xs mt-1">
                  {progress} / {maxProgress}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (loading) {
    return <div className="animate-pulse">Loading badges...</div>;
  }

  if (showProgress) {
    // Show all available badges with progress
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Achievement Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`
            ${layout === 'grid' 
              ? 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4' 
              : 'flex flex-wrap gap-4'
            }
          `}>
            {badges.map((badge) => {
              const userBadge = userBadges.find(ub => ub.badge?.id === badge.id);
              const earned = !!userBadge;
              
              return (
                <BadgeComponent
                  key={badge.id}
                  badge={badge}
                  earned={earned}
                  progress={earned ? undefined : 50} // Mock progress
                  maxProgress={earned ? undefined : 100}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only earned badges
  const earnedBadges = userBadges.filter(ub => ub.badge);
  
  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <div className={`
      ${layout === 'grid' 
        ? 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2' 
        : 'flex flex-wrap gap-2'
      } ${className}
    `}>
      {earnedBadges.map((userBadge) => (
        <BadgeComponent 
          key={userBadge.id} 
          badge={{
            ...userBadge.badge,
            granted_at: userBadge.granted_at
          }} 
        />
      ))}
    </div>
  );
};