import React, { useState, useEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Shield, 
  Star, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  comment_count?: number;
  like_count?: number;
  bookmark_count?: number;
  reading_streak?: number;
  badges?: string[];
}

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export const UserHoverCard: React.FC<UserHoverCardProps> = ({ userId, children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUserProfile = async () => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        // Get additional stats (mock data for now since we don't have these tables)
        const userProfile: UserProfile = {
          ...profileData,
          comment_count: Math.floor(Math.random() * 100) + 10,
          like_count: Math.floor(Math.random() * 500) + 20,
          bookmark_count: Math.floor(Math.random() * 50) + 5,
          reading_streak: Math.floor(Math.random() * 30) + 1,
          badges: ['Early Reader', 'Active Commenter']
        };
        
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs gap-1"><Crown className="h-3 w-3" />Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" />Mod</Badge>;
      case 'premium':
        return <Badge variant="default" className="text-xs gap-1"><Star className="h-3 w-3" />Premium</Badge>;
      default:
        return <Badge variant="outline" className="text-xs gap-1"><Users className="h-3 w-3" />Member</Badge>;
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild onMouseEnter={loadUserProfile}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" align="start">
        <Card className="border-0 shadow-lg">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : profile ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name?.[0] || profile.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base truncate">
                    {profile.full_name || profile.username || 'Anonymous User'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(profile.role)}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Joined {formatJoinDate(profile.created_at)}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{profile.comment_count}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">{profile.like_count}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">{profile.bookmark_count}</div>
                    <div className="text-xs text-muted-foreground">Bookmarks</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="text-sm font-medium">{profile.reading_streak}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Achievements</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.badges.map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Profile not found</p>
            </div>
          )}
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
};