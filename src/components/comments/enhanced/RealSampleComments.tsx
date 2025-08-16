import React from 'react';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

// Generate realistic sample comments for demonstration
export const generateSampleComments = (targetType: 'series' | 'chapter'): AdvancedComment[] => {
  const sampleComments: AdvancedComment[] = [
    {
      id: 'sample-1',
      user_id: 'user-1',
      content: targetType === 'series' 
        ? "This series has incredible world-building! The way the author constructs the political intrigue reminds me of classic fantasy epics, but with a modern twist. Each character feels authentic and has clear motivations. Can't wait to see where this story goes!" 
        : "What an intense chapter! The cliffhanger at the end has me on the edge of my seat. The character development here is phenomenal - I love how the protagonist is slowly growing stronger while still maintaining their core values.",
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      like_count: 42,
      is_pinned: true,
      status: 'active',
      user: {
        id: 'user-1',
        email: 'sarah.chen@example.com',
        user_metadata: {
          name: 'Sarah Chen',
          avatar_url: null
        }
      },
      profile: {
        user_id: 'user-1',
        display_name: 'Sarah Chen',
        role: 'admin',
        is_banned: false,
        created_at: '2023-06-15T08:00:00Z'
      },
      user_level: {
        user_id: 'user-1',
        level: 15,
        current_xp: 2850,
        total_xp: 15600,
        comments_count: 127,
        likes_received: 890
      },
      user_badges: [
        {
          badge_id: 'admin-badge',
          badge_name: 'Admin',
          badge_description: 'Site Administrator',
          badge_color: '#FFD700',
          badge_rarity: 'legendary',
          is_premium: true,
          is_equipped: true,
          display_order: 1
        }
      ],
      reactions: [
        {
          id: 'reaction-1',
          reaction_type: 'emoji',
          reaction_value: '👍',
          user_id: 'user-2'
        },
        {
          id: 'reaction-2',
          reaction_type: 'emoji',
          reaction_value: '❤️',
          user_id: 'user-3'
        }
      ],
      replies: []
    },
    {
      id: 'sample-2',
      user_id: 'user-2',
      content: targetType === 'series'
        ? "I've been following this series from the beginning and the character growth is absolutely phenomenal! The way each arc builds upon the previous one shows incredible planning."
        : "The pacing in this chapter was perfect! Not too fast, not too slow. The dialogue felt natural and the action sequences were easy to follow.",
      created_at: '2024-01-15T11:45:00Z',
      updated_at: '2024-01-15T11:45:00Z',
      like_count: 23,
      status: 'active',
      user: {
        id: 'user-2',
        email: 'mike.johnson@example.com',
        user_metadata: {
          name: 'Mike Johnson',
          avatar_url: null
        }
      },
      profile: {
        user_id: 'user-2',
        display_name: 'Mike Johnson',
        role: 'moderator',
        is_banned: false,
        created_at: '2023-08-20T15:30:00Z'
      },
      user_level: {
        user_id: 'user-2',
        level: 12,
        current_xp: 1950,
        total_xp: 9800,
        comments_count: 89,
        likes_received: 445
      },
      user_badges: [
        {
          badge_id: 'moderator-badge',
          badge_name: 'Moderator',
          badge_description: 'Community Moderator',
          badge_color: '#8B5CF6',
          badge_rarity: 'epic',
          is_premium: true,
          is_equipped: true,
          display_order: 1
        }
      ],
      reactions: [
        {
          id: 'reaction-4',
          reaction_type: 'emoji',
          reaction_value: '👍',
          user_id: 'user-1'
        }
      ],
      replies: []
    },
    {
      id: 'sample-3',
      user_id: 'guest-1',
      guest_name: 'BookLover92',
      guest_email: 'booklover92@email.com',
      content: targetType === 'series'
        ? "Just discovered this series and I'm already hooked! Binge-read all available chapters in one sitting. When is the next update coming? 😄"
        : "This chapter had me crying! The emotional scene between the main characters was so well written.",
      created_at: '2024-01-15T18:45:00Z',
      updated_at: '2024-01-15T18:45:00Z',
      like_count: 12,
      status: 'active',
      reactions: [
        {
          id: 'reaction-7',
          reaction_type: 'emoji',
          reaction_value: '😂',
          user_id: 'user-2'
        }
      ],
      replies: []
    }
  ];

  return sampleComments;
};

// Component to display sample comments with a banner
export const SampleCommentsNotice: React.FC<{
  onDismiss: () => void;
}> = ({ onDismiss }) => {
  // Don't show the notice in production - auto-dismiss
  return null;
};