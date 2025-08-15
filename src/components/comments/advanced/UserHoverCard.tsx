import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export const UserHoverCard: React.FC<UserHoverCardProps> = ({ userId, children }) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">User Profile</h4>
            <p className="text-sm text-muted-foreground">User details loading...</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};