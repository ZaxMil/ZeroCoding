import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, Link, Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  showCancel?: boolean;
  className?: string;
}

const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

export function CommentEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Share your thoughts...",
  submitLabel = "Post Comment",
  isSubmitting = false,
  showCancel = false,
  className
}: CommentEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.setSelectionRange(start + before.length, end + before.length);
      textarea.focus();
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      textarea.focus();
    }, 0);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('**', '**')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('_', '_')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('[', '](url)')}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => insertEmoji(emoji)}
                  className="h-8 w-8 p-0"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto text-xs text-muted-foreground">
          Markdown supported
        </div>
      </div>

      {/* Text Area */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px] resize-none"
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {value.length}/1000 characters
        </div>
        
        <div className="flex items-center gap-2">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !value.trim() || value.length > 1000}
            size="sm"
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}