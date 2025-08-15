import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Star, User } from 'lucide-react';

interface UserBadgeProps {
  role: 'admin' | 'moderator' | 'member' | 'author' | 'editor' | string;
  level?: number;
  className?: string;
}

export function UserBadge({ role, level, className }: UserBadgeProps) {
  const getBadgeConfig = () => {
    switch (role) {
      case 'admin':
        return {
          icon: Crown,
          label: 'Admin',
          variant: 'destructive' as const,
          className: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
      case 'moderator':
        return {
          icon: Shield,
          label: 'Moderator',
          variant: 'secondary' as const,
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        };
      case 'author':
        return {
          icon: Star,
          label: 'Author',
          variant: 'default' as const,
          className: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
        };
      case 'editor':
        return {
          icon: User,
          label: 'Editor',
          variant: 'outline' as const,
          className: 'bg-green-500/10 text-green-600 border-green-500/20'
        };
      default:
        if (level && level >= 10) {
          return {
            icon: Star,
            label: `Level ${level}`,
            variant: 'outline' as const,
            className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
          };
        }
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`text-xs flex items-center gap-1 ${config.className} ${className}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}