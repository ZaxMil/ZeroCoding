import React from 'react';
import { EmojiPicker as CustomEmojiPicker } from '../EmojiPicker';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  className
}) => {
  return (
    <div className={className}>
      <CustomEmojiPicker onSelect={onEmojiSelect} />
    </div>
  );
};