import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlock from '@tiptap/extension-code-block';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link as LinkIcon, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  Smile,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { MentionSuggestion } from './MentionSuggestion';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';

interface AdvancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  maxLength?: number;
  enableAttachments?: boolean;
  enableMentions?: boolean;
  className?: string;
  disabled?: boolean;
}

export const AdvancedRichTextEditor: React.FC<AdvancedRichTextEditorProps> = ({
  content,
  onChange,
  onSubmit,
  placeholder = 'Write your comment...',
  maxLength = 1000,
  enableAttachments = true,
  enableMentions = true,
  className,
  disabled = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      ...(enableMentions ? [
        Mention.configure({
          HTMLAttributes: {
            class: 'bg-primary/10 text-primary px-1 rounded',
          },
          suggestion: MentionSuggestion,
        })
      ] : []),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-muted p-3 rounded-lg font-mono text-sm',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback((url: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  }, [editor]);

  const handleSubmit = async () => {
    if (!editor || isSubmitting) return;
    
    const htmlContent = editor.getHTML();
    if (!htmlContent.trim() || htmlContent === '<p></p>') {
      toast.error('Please enter a comment');
      return;
    }

    if (editor.storage.characterCount.characters() > maxLength) {
      toast.error(`Comment is too long (${editor.storage.characterCount.characters()}/${maxLength} characters)`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(htmlContent, attachments);
      editor.commands.clearContent();
      setAttachments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (files: File[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!editor) return null;

  const characterCount = editor.storage.characterCount.characters();
  const isOverLimit = characterCount > maxLength;

  return (
    <Card className={cn('border-border bg-card shadow-lg', className)}>
      <div className="p-4">
        {/* Toolbar - Enhanced visibility */}
        <div className="flex flex-wrap items-center gap-1 mb-3 pb-3 border-b border-border bg-muted/30 rounded-lg p-3">
          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('strike') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('code') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and blocks */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
              onClick={setLink}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Media and extras */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 z-10 mt-1">
                  <EmojiPicker onEmojiSelect={insertEmoji} />
                </div>
              )}
            </div>

            {enableAttachments && (
              <ImageUpload
                onFileSelect={handleFileUpload}
                onImageInsert={insertImage}
                disabled={disabled}
              />
            )}

            <Button
              type="button"
              variant={showPreview ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        {showPreview ? (
          <div 
            className="prose prose-sm max-w-none min-h-[120px] p-3 rounded-lg border border-border bg-muted/30"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <EditorContent 
            editor={editor}
            className="prose prose-sm max-w-none min-h-[120px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-3 [&_.ProseMirror]:rounded-lg [&_.ProseMirror]:border [&_.ProseMirror]:border-border [&_.ProseMirror]:bg-background [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:text-foreground"
          />
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Attachments:</div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeAttachment(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={cn(
              'font-medium',
              isOverLimit && 'text-destructive'
            )}>
              {characterCount}/{maxLength} characters
            </span>
            {enableMentions && (
              <span>Use @ to mention users</span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || isOverLimit || characterCount === 0}
            className="ml-auto"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </Card>
  );
};