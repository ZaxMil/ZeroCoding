import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Star, 
  Calendar, 
  MessageSquare, 
  Award,
  Zap,
  Crown,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserBadge {
  badge_id: string;
  badge_name: string;
  badge_description?: string;
  badge_color?: string;
  badge_rarity?: string;
  is_equipped?: boolean;
}

interface UserLevel {
  level: number;
  current_xp: number;
  total_xp: number;
  comments_count: number;
  likes_received: number;
}

interface UserProfile {
  display_name?: string;
  role?: 'admin' | 'moderator' | 'member';
  created_at: string;
}

interface EnhancedUserHoverCardProps {
  userId: string;
  trigger: React.ReactNode;
  userProfile?: UserProfile;
  userLevel?: UserLevel;
  userBadges?: UserBadge[];
}

export const EnhancedUserHoverCard: React.FC<EnhancedUserHoverCardProps> = ({ 
  userId, 
  trigger, 
  userProfile,
  userLevel,
  userBadges = []
}) => {
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator': return <Shield className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'moderator': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getXPProgress = () => {
    if (!userLevel) return 0;
    const levelBase = (userLevel.level - 1) * 1000;
    const levelProgress = userLevel.current_xp - levelBase;
    const levelMax = 1000;
    return Math.min((levelProgress / levelMax) * 100, 100);
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-4">
          {/* User Header */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                {userProfile?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">
                  {userProfile?.display_name || 'Anonymous User'}
                </p>
                {getRoleIcon(userProfile?.role)}
              </div>
              <Badge className={`text-xs ${getRoleColor(userProfile?.role)}`}>
                {userProfile?.role?.toUpperCase() || 'MEMBER'}
              </Badge>
            </div>
          </div>
          
          {/* Level & XP */}
          {userLevel && (
            <Card className="p-3 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Level {userLevel.level}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  {userLevel.current_xp} XP
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getXPProgress()}%` }}
                />
              </div>
            </Card>
          )}
          
          <Separator />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <MessageSquare className="h-3 w-3" />
                {userLevel?.comments_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Star className="h-3 w-3" />
                {userLevel?.likes_received || 0}
              </div>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Calendar className="h-3 w-3" />
                {userProfile?.created_at ? formatDistanceToNow(new Date(userProfile.created_at), { addSuffix: false }) : 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">Member</p>
            </div>
          </div>
          
          {/* Badges */}
          {userBadges.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">Badges</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {userBadges.filter(b => b.is_equipped).map((badge) => (
                    <Badge 
                      key={badge.badge_id} 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: badge.badge_color,
                        color: badge.badge_color,
                        backgroundColor: `${badge.badge_color}10`
                      }}
                    >
                      {badge.badge_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

interface MobileOptimizedCommentProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileOptimizedComment: React.FC<MobileOptimizedCommentProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`
      // Mobile-first responsive design
      space-y-2 sm:space-y-3
      p-3 sm:p-4
      text-sm sm:text-base
      ${className}
    `}>
      {children}
    </div>
  );
};

interface CommentThreadCollapseProps {
  isCollapsed: boolean;
  onToggle: () => void;
  replyCount: number;
}

export const CommentThreadCollapse: React.FC<CommentThreadCollapseProps> = ({
  isCollapsed,
  onToggle,
  replyCount
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="text-xs text-muted-foreground hover:text-primary p-1 h-auto"
    >
      {isCollapsed ? '→' : '↓'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
    </Button>
  );
};