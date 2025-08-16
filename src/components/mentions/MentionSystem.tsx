import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AtSign, Bell, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionableUser {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

interface MentionSystemProps {
  onMention: (userId: string, username: string) => void;
  trigger?: string;
  className?: string;
}

export const MentionSystem: React.FC<MentionSystemProps> = ({
  onMention,
  trigger = '@',
  className
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      setUsers([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Mock user search - in real implementation, this would search profiles
      const mockUsers: MentionableUser[] = [
        {
          id: '1',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin'
        },
        {
          id: '2', 
          username: 'moderator',
          full_name: 'Moderator User',
          role: 'moderator'
        },
        {
          id: '3',
          username: 'reader123',
          full_name: 'Active Reader'
        }
      ].filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setUsers(mockUsers);
      setShowSuggestions(mockUsers.length > 0);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUser: MentionableUser) => {
    onMention(selectedUser.id, selectedUser.username || selectedUser.full_name || 'Unknown');
    setQuery('');
    setShowSuggestions(false);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Mod</Badge>;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 mb-2">
        <AtSign className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Type @ to mention users..."
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            if (value.startsWith('@')) {
              setQuery(value.slice(1));
            } else {
              setQuery(value);
            }
          }}
          className="flex-1"
        />
      </div>

      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border-border/50 shadow-lg">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Search className="h-3 w-3" />
              <span>Select user to mention</span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-1">
                {users.map((mentionUser) => (
                  <Button
                    key={mentionUser.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 hover:bg-accent"
                    onClick={() => handleUserSelect(mentionUser)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={mentionUser.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {(mentionUser.full_name || mentionUser.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm truncate">
                          {mentionUser.full_name || mentionUser.username}
                        </div>
                        {mentionUser.username && mentionUser.full_name && (
                          <div className="text-xs text-muted-foreground">
                            @{mentionUser.username}
                          </div>
                        )}
                      </div>
                      
                      {getRoleBadge(mentionUser.role)}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// Helper component for rendering mentions in content
export const MentionRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderWithMentions = (text: string) => {
    // Simple mention detection - in production this would be more sophisticated
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer transition-colors"
          >
            <AtSign className="h-3 w-3" />
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return <span>{renderWithMentions(content)}</span>;
};