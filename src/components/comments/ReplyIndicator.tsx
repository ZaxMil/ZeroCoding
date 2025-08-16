import React from 'react';
import { MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReplyIndicatorProps {
  replyCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function ReplyIndicator({ 
  replyCount, 
  isCollapsed, 
  onToggle, 
  className = '' 
}: ReplyIndicatorProps) {
  if (replyCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`h-7 px-2 text-xs text-muted-foreground hover:text-primary ${className}`}
    >
      {isCollapsed ? (
        <ChevronRight className="h-3 w-3 mr-1" />
      ) : (
        <ChevronDown className="h-3 w-3 mr-1" />
      )}
      <MessageCircle className="h-3 w-3 mr-1" />
      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      {isCollapsed && (
        <Badge variant="secondary" className="ml-2 text-xs">
          +{replyCount}
        </Badge>
      )}
    </Button>
  );
}