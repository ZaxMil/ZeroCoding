import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  smileys: {
    label: '😀 Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
    ]
  },
  emotions: {
    label: '❤️ Emotions',
    emojis: [
      '😍', '🥰', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑',
      '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤',
      '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴'
    ]
  },
  gestures: {
    label: '👍 Gestures',
    emojis: [
      '👍', '👎', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖',
      '👏', '🙌', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'
    ]
  },
  hearts: {
    label: '💙 Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ]
  },
  objects: {
    label: '🎉 Objects',
    emojis: [
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟',
      '💫', '✨', '💥', '💯', '🔥', '💧', '💨', '⚡', '☀️', '🌙'
    ]
  }
};

const RECENT_EMOJIS_KEY = 'recentEmojis';

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    
    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    
    try {
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent));
    } catch (error) {
      console.warn('Failed to save recent emojis:', error);
    }
  };

  const filterEmojis = (emojis: string[]) => {
    if (!searchQuery) return emojis;
    // This is a simple search - in a real app you'd want emoji names/keywords
    return emojis;
  };

  const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);
  const filteredEmojis = searchQuery ? filterEmojis(allEmojis) : [];

  return (
    <div className="w-full">
      <div className="p-2 border-b">
        <Input
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      <Tabs defaultValue={searchQuery ? 'search' : 'recent'} className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-8 text-xs">
          <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
          {searchQuery && <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>}
        </TabsList>

        <TabsContent value="recent">
          <ScrollArea className="h-40">
            <div className="grid grid-cols-8 gap-1 p-2">
              {recentEmojis.length > 0 ? (
                recentEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-muted"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))
              ) : (
                <div className="col-span-8 text-center text-muted-foreground text-sm py-4">
                  No recent emojis
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="categories">
          <Tabs orientation="vertical" className="flex h-40">
            <TabsList className="flex flex-col h-full w-20 text-xs">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="w-full text-xs p-1"
                >
                  {category.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <TabsContent key={key} value={key} className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-6 gap-1 p-2">
                    {category.emojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:bg-muted"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {searchQuery && (
          <TabsContent value="search">
            <ScrollArea className="h-40">
              <div className="grid grid-cols-8 gap-1 p-2">
                {filteredEmojis.length > 0 ? (
                  filteredEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-muted"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))
                ) : (
                  <div className="col-span-8 text-center text-muted-foreground text-sm py-4">
                    No emojis found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};