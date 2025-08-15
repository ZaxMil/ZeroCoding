import React, { useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Underline, 
  Quote, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Smile,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmojiPicker } from './EmojiPicker';
import { MentionsList } from './MentionsList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  onSubmit?: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom spoiler extension
const SpoilerExtension = StarterKit.configure({}).extend({
  name: 'spoiler',
  addAttributes() {
    return {
      'data-spoiler': {
        default: true,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-spoiler]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'spoiler-text' }, 0];
  },
  addCommands() {
    return {
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your comment...",
  maxLength = 2000,
  onSubmit,
  disabled = false,
  className = ""
}) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 rounded',
        },
        suggestion: {
          items: ({ query }) => {
            // This would be replaced with actual user search
            return [
              { id: '1', label: 'John Doe' },
              { id: '2', label: 'Jane Smith' },
            ].filter(item => 
              item.label.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            let component: any;
            return {
              onStart: (props: any) => {
                component = new MentionsList(props);
              },
              onUpdate(props: any) {
                component.updateProps(props);
              },
              onKeyDown(props: any) {
                return component.onKeyDown(props);
              },
              onExit() {
                component.destroy();
              },
            };
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      SpoilerExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  const uploadImage = useCallback(async (file: File) => {
    if (!user) {
      toast({ title: "Error", description: "Please log in to upload images", variant: "destructive" });
      return null;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comment-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comment-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, uploadImage]);

  const addLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  }, [editor, linkUrl]);

  const addImageFromUrl = useCallback(() => {
    if (!editor) return;
    
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl]);

  const insertEmoji = useCallback((emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
  }, [editor]);

  const toggleSpoiler = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleMark('spoiler').run();
  }, [editor]);

  if (!editor) {
    return <div className="h-32 bg-muted animate-pulse rounded" />;
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('spoiler') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleSpoiler}
          disabled={disabled}
          title="Spoiler text"
        >
          {editor.isActive('spoiler') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        
        {/* Link Dialog */}
        <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
              disabled={disabled}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label htmlFor="link-url">Link URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <Button onClick={addLink} size="sm">Add Link</Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Image Dialog */}
        <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Tabs defaultValue="url">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <Button onClick={addImageFromUrl} size="sm">Add Image</Button>
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="sm"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
        
        {/* Emoji Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <EmojiPicker onSelect={insertEmoji} />
          </PopoverContent>
        </Popover>
        
        {/* Preview Toggle */}
        <Button
          type="button"
          variant={showPreview ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Editor/Preview */}
      {showPreview ? (
        <Card className="p-4 min-h-[150px] border-t-0 rounded-t-none">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </Card>
      ) : (
        <div className="border border-t-0 rounded-b-lg">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none p-4 min-h-[150px] focus-within:outline-none"
          />
        </div>
      )}

      {/* Character Count */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{wordCount} words</span>
        <span className={characterCount > maxLength ? 'text-destructive' : ''}>
          {characterCount}/{maxLength} characters
        </span>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link)
        </p>
        <p>
          <strong>Mentions:</strong> Type @ to mention a user
        </p>
        <p>
          <strong>Spoilers:</strong> Select text and click the eye icon to hide spoilers
        </p>
      </div>
    </div>
  );
};