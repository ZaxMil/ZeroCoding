import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface MentionSuggestionProps {
  items: User[];
  command: (item: User) => void;
}

export const MentionSuggestion = {
  items: async ({ query }: { query: string }) => {
    if (!query) return [];

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, role')
        .ilike('display_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      return profiles?.map(profile => ({
        id: profile.user_id,
        display_name: profile.display_name || profile.email,
        email: profile.email,
        role: profile.role,
      })) || [];
    } catch (error) {
      console.error('Error fetching mention suggestions:', error);
      return [];
    }
  },

  render: () => {
    let component: React.ComponentType<MentionSuggestionProps>;
    let popup: any;

    component = forwardRef<any, MentionSuggestionProps>((props, ref) => {
      const [selectedIndex, setSelectedIndex] = useState(0);

      const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
          props.command(item);
        }
      };

      const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
      };

      const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
      };

      const enterHandler = () => {
        selectItem(selectedIndex);
      };

      useEffect(() => setSelectedIndex(0), [props.items]);

      useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
          if (event.key === 'ArrowUp') {
            upHandler();
            return true;
          }

          if (event.key === 'ArrowDown') {
            downHandler();
            return true;
          }

          if (event.key === 'Enter') {
            enterHandler();
            return true;
          }

          return false;
        },
      }));

      if (props.items.length === 0) {
        return (
          <Card className="p-2">
            <div className="text-sm text-muted-foreground">No users found</div>
          </Card>
        );
      }

      return (
        <Card className="p-1 max-h-60 overflow-y-auto">
          {props.items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => selectItem(index)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.avatar_url} />
                <AvatarFallback className="text-xs">
                  {item.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.display_name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.email}
                </div>
              </div>
              {item.role !== 'member' && (
                <Badge variant="outline" className="text-xs">
                  {item.role}
                </Badge>
              )}
            </div>
          ))}
        </Card>
      );
    });

    popup = {
      render: () => {
        return {
          component,
        };
      },
    };

    return popup;
  },
};