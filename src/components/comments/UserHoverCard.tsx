import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle, Star, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserProfile, UserLevel } from '@/types/comments';
import { UserBadge } from './UserBadge';

interface UserHoverCardProps {
  profile?: UserProfile;
  userLevel?: UserLevel;
  trigger: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function UserHoverCard({ profile, userLevel, trigger, side = 'top' }: UserHoverCardProps) {
  if (!profile) {
    return <>{trigger}</>;
  }

  const displayName = profile.display_name || 'Anonymous User';
  const joinDate = profile.created_at ? new Date(profile.created_at) : null;
  const level = userLevel?.level || 1;
  const xp = userLevel?.total_xp || 0;
  const commentsCount = userLevel?.comments_count || 0;
  const likesReceived = userLevel?.likes_received || 0;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side={side}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url} alt={displayName} />
              <AvatarFallback>
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{displayName}</h4>
                <UserBadge role={profile.role || 'member'} level={level} />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {joinDate ? `Joined ${formatDistanceToNow(joinDate)} ago` : 'Recently joined'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">Level {level}</div>
                <div className="text-xs text-muted-foreground">{xp} XP</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{commentsCount}</div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-3 w-3" />
              {likesReceived} likes received
            </div>
            
            {profile.is_banned && (
              <Badge variant="destructive" className="text-xs">
                Banned
              </Badge>
            )}
          </div>

          {/* Level Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{userLevel?.current_xp || 0}/100 XP</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((userLevel?.current_xp || 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}