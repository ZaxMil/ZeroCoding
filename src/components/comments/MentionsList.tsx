import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  label: string;
  avatar_url?: string;
  display_name?: string;
}

interface MentionsListProps {
  items: User[];
  command: (item: User) => void;
  query: string;
  editor?: any;
}

export class MentionsList {
  private component: any;
  private props: MentionsListProps;

  constructor(props: MentionsListProps) {
    this.props = props;
    this.component = new ReactRenderer(MentionsListComponent, {
      props,
    });
  }

  updateProps(props: MentionsListProps) {
    this.props = props;
    this.component.updateProps(props);
  }

  onKeyDown(props: any) {
    if (props.event.key === 'Escape') {
      this.destroy();
      return true;
    }
    return this.component.ref?.onKeyDown(props);
  }

  destroy() {
    this.component.destroy();
  }
}

interface MentionsListComponentProps {
  items: User[];
  command: (item: User) => void;
}

const MentionsListComponent = forwardRef<any, MentionsListComponentProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
      setUsers(items);
      setSelectedIndex(0);
    }, [items]);

    const selectItem = (index: number) => {
      const item = users[index];
      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + users.length - 1) % users.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % users.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [users]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: any) => {
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

    if (users.length === 0) {
      return null;
    }

    return (
      <Card className="p-2 shadow-lg max-h-40 overflow-y-auto">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
            }`}
            onClick={() => selectItem(index)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-xs">
                {user.display_name?.charAt(0)?.toUpperCase() || user.label.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.display_name || user.label}</span>
          </div>
        ))}
      </Card>
    );
  }
);

MentionsListComponent.displayName = 'MentionsListComponent';

// Simple ReactRenderer implementation for TipTap
class ReactRenderer {
  public ref: any = null;
  private element: HTMLElement;
  private component: any;

  constructor(Component: any, options: any) {
    this.element = document.createElement('div');
    document.body.appendChild(this.element);
    
    // Simple React render (in a real app, you'd use createRoot)
    import('react-dom').then(({ render }) => {
      render(React.createElement(Component, { 
        ref: (el: any) => { this.ref = el; },
        ...options.props 
      }), this.element);
    });
  }

  updateProps(props: any) {
    if (this.ref && this.ref.updateProps) {
      this.ref.updateProps(props);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}