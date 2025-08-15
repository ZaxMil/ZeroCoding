import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onReactionSelect }) => {
  return (
    <Card className="p-2">
      <div className="flex gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => onReactionSelect(emoji)}
            className="text-lg hover:bg-accent"
          >
            {emoji}
          </Button>
        ))}
      </div>
    </Card>
  );
};