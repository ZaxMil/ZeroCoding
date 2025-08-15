import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BookOpen, BookX } from 'lucide-react';

interface UnreadChaptersFilterProps {
  showOnlyUnread: boolean;
  onToggle: (checked: boolean) => void;
  className?: string;
}

export const UnreadChaptersFilter: React.FC<UnreadChaptersFilterProps> = ({
  showOnlyUnread,
  onToggle,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch
        id="show-only-unread"
        checked={showOnlyUnread}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="show-only-unread" className="text-sm font-medium cursor-pointer">
        {showOnlyUnread ? (
          <span className="flex items-center gap-1">
            <BookX className="h-3 w-3" />
            Unread only
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Show all
          </span>
        )}
      </Label>
    </div>
  );
};