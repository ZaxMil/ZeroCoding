import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LazyImage from '../LazyImage';
import ChapterUnlockPopup from '../ChapterUnlockPopup';
import { runtime } from '@/config/runtime';
import { getUnlockedChapters } from '@/lib/mockStorage';
import { useOpenedChapters } from '@/hooks/useOpenedChapters';
import { ChapterLockIcon } from '@/components/chapter/ChapterLockIcon';
import { UnreadChaptersFilter } from '@/components/filters/UnreadChaptersFilter';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useScrollToElement } from '@/hooks/useScrollToElement';
import {
  Grid3X3,
  List,
  Clock,
  CheckCircle,
  Lock,
  Unlock,
  EyeOff,
  Eye,
  Square,
  Grid2X2,
  Columns3
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  page_count: number;
  release_date: string;
  view_count: number;
  is_locked: boolean;
  unlock_cost: number;
  thumbnail_url: string;
}

interface ModernChapterGridProps {
  chapters: Chapter[];
  seriesSlug?: string;
}

const ModernChapterGrid: React.FC<ModernChapterGridProps> = ({ chapters = [], seriesSlug }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isChapterOpened, markChapterOpened, getLastOpenedChapterId } = useOpenedChapters();
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(3);
  const [showLocked, setShowLocked] = useState<boolean>(true);
  const [showOnlyUnread, setShowOnlyUnread] = useLocalStorage('series-show-only-unread', false);
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({});
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const { scrollToElement } = useScrollToElement();

  // Progressive rendering: show 30 initially, then +10 when scrolled
  const [visibleCount, setVisibleCount] = useState(30);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Check user access to chapters
  useEffect(() => {
    if (chapters.length > 0) {
      checkUserAccess();
    }
  }, [user, chapters]);

  useEffect(() => {
    // Default anon behavior in mock mode: hide locked unless flag says otherwise
    setShowLocked(!!user || runtime.SHOW_LOCKED_FOR_ANON);
  }, [user]);

  const checkUserAccess = async () => {
    if (!chapters || chapters.length === 0) return;

    try {
      if (runtime.USE_MOCKS) {
        const accessMap: Record<string, boolean> = {};
        if (user) {
          const unlocked = getUnlockedChapters(user.id);
          chapters.forEach(c => {
            accessMap[c.id] = !c.is_locked || !!unlocked[c.id] || c.unlock_cost === 0;
          });
        } else {
          chapters.forEach(c => {
            accessMap[c.id] = !c.is_locked || c.unlock_cost === 0;
          });
        }
        setUserAccess(accessMap);
        return;
      }

      if (!user) return;
      const { data } = await supabase
        .from('chapter_access')
        .select('chapter_id')
        .eq('user_id', user.id)
        .in('chapter_id', chapters.map(c => c.id));
      const map: Record<string, boolean> = {};
      data?.forEach(row => { map[row.chapter_id] = true; });
      setUserAccess(map);
    } catch (error) {
      console.error('Error checking user access:', error);
    }
  };

  const sortedChapters = [...chapters].sort((a, b) => {
    // Prefer bumped display_published_at when present
    const ad = (a as any).display_published_at || a.release_date;
    const bd = (b as any).display_published_at || b.release_date;
    return new Date(bd).getTime() - new Date(ad).getTime();
  });

  // Apply both locked and unread filters
  let filteredChapters = showLocked 
    ? sortedChapters 
    : sortedChapters.filter(chapter => !chapter.is_locked || userAccess[chapter.id]);

  if (showOnlyUnread) {
    filteredChapters = filteredChapters.filter(chapter => !isChapterOpened(chapter.id));
  }

  const visibleChapters = filteredChapters.slice(0, visibleCount);

  // Reset visible count when chapter list or filter changes
  useEffect(() => {
    setVisibleCount(30);
  }, [chapters, showLocked, showOnlyUnread]);

  // Auto-scroll to last read chapter on mount
  useEffect(() => {
    if (chapters.length > 0) {
      const lastOpenedId = getLastOpenedChapterId();
      if (lastOpenedId) {
        // Use a small delay to ensure DOM is rendered
        setTimeout(() => {
          scrollToElement(`chapter-${lastOpenedId}`);
        }, 100);
      }
    }
  }, [chapters, getLastOpenedChapterId, scrollToElement]);

  // Infinite scroll observer: reveal +10 more when sentinel enters view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 10, filteredChapters.length));
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredChapters.length]);

  const getChapterStatus = (chapter: Chapter) => {
    if (!chapter.is_locked || chapter.unlock_cost === 0) return 'free';
    if (userAccess[chapter.id]) return 'unlocked';
    return 'locked';
  };

  const handleChapterClick = (chapter: Chapter) => {
    const status = getChapterStatus(chapter);
    
    if (status === 'locked') {
      setSelectedChapter(chapter);
      setShowUnlockPopup(true);
    } else {
      // Mark chapter as opened when accessed
      markChapterOpened(chapter.id);
      // Use the new read route format if seriesSlug is available
      if (seriesSlug) {
        navigate(`/read/${seriesSlug}/${chapter.chapter_number}`);
      } else {
        // Fallback to old route format
        navigate(`/reader/${chapter.id}`);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with View Toggle and Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Chapters</h2>
        
        <div className="flex items-center gap-4">
          {/* Show/Hide Locked Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-locked"
              checked={showLocked}
              onCheckedChange={setShowLocked}
            />
            <Label htmlFor="show-locked" className="text-sm font-medium">
              {showLocked ? (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Show locked
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hide locked
                </span>
              )}
            </Label>
          </div>

          {/* Unread Filter */}
          <UnreadChaptersFilter
            showOnlyUnread={showOnlyUnread}
            onToggle={setShowOnlyUnread}
          />
          
          {/* Column Toggle */}
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border border-border/20 rounded-lg p-1">
            <Button
              variant={gridColumns === 1 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridColumns(1)}
              className="h-8 w-8 p-0"
              title="1 per row"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={gridColumns === 2 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridColumns(2)}
              className="h-8 w-8 p-0"
              title="2 per row"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={gridColumns === 3 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setGridColumns(3)}
              className="h-8 w-8 p-0"
              title="3 per row"
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chapter Grid */}
      {!user && !showLocked && sortedChapters.some(c => c.is_locked) && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-card/30">
          <div className="text-sm text-muted-foreground">Sign in to view locked chapters</div>
          <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'signup' } }))}>Sign in</Button>
        </div>
      )}
      <div className={`grid gap-4 ${
        gridColumns === 1 ? 'grid-cols-1' :
        gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {visibleChapters.map((chapter) => {
          const daysAgo = Math.floor((Date.now() - new Date(chapter.release_date).getTime()) / (1000 * 60 * 60 * 24));
          const isNew = daysAgo <= 3;
          const status = getChapterStatus(chapter);

          return (
            <Card 
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              className={`group hover:bg-accent/80 transition-all duration-200 cursor-pointer border border-border/10 bg-card/20 backdrop-blur-sm hover:border-accent/40 ${
                gridColumns === 1 ? 'p-6' : gridColumns === 2 ? 'p-5' : 'p-4'
              } ${status === 'locked' ? 'opacity-80' : ''}`}
              onClick={() => handleChapterClick(chapter)}
            >
              <div className="flex items-center gap-4">
                {/* Chapter Number Badge */}
                <div className="flex-shrink-0 relative">
                  <div className={`${
                    gridColumns === 1 ? 'w-16 h-16' : gridColumns === 2 ? 'w-14 h-14' : 'w-12 h-12'
                  } rounded-lg flex items-center justify-center font-bold ${
                    gridColumns === 1 ? 'text-lg' : gridColumns === 2 ? 'text-base' : 'text-sm'
                  } shadow-lg border-2 ${
                    status === 'locked' ? 'bg-destructive text-destructive-foreground border-destructive/30' :
                    status === 'unlocked' ? 'bg-blue-500 text-white border-blue-500/30' :
                    'bg-green-600 text-white border-green-600/30'
                  }`}>
                    {chapter.chapter_number}
                  </div>
                  
                  {/* New indicator dot */}
                  {isNew && status !== 'locked' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse"></div>
                  )}
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold group-hover:text-primary transition-colors line-clamp-1 ${
                        gridColumns === 1 ? 'text-xl mb-2' : gridColumns === 2 ? 'text-lg mb-1' : 'text-base mb-1'
                      }`}>
                        Chapter {chapter.chapter_number}
                      </h3>
                      <p 
                        className={`text-muted-foreground ${gridColumns === 1 ? 'text-base' : 'text-sm'}`}
                        style={{ 
                          height: gridColumns === 1 ? '3rem' : '2.5rem', // Fixed height for 2 lines
                          lineHeight: gridColumns === 1 ? '1.5rem' : '1.25rem',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                        title={chapter.title}
                        aria-label={chapter.title}
                      >
                        {chapter.title}
                      </p>
                    </div>
                    
                    {/* Status and Time on right */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {/* Status Badge with Enhanced Lock Icon */}
                      {status === 'locked' ? (
                        <Badge variant="destructive" className={`gap-1 ${gridColumns === 1 ? 'text-sm' : 'text-xs'}`}>
                           {/* Use simplified icon logic */}
                          <Lock className="h-3 w-3" />
                          {chapter.unlock_cost} coins
                        </Badge>
                      ) : status === 'unlocked' ? (
                        <Badge variant="secondary" className={`gap-1 bg-blue-500/20 text-blue-600 border-blue-500/30 ${gridColumns === 1 ? 'text-sm' : 'text-xs'}`}>
                          <ChapterLockIcon 
                            isLocked={false}
                            isOpened={true}
                            className="h-3 w-3"
                          />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="default" className={`gap-1 bg-green-600 hover:bg-green-700 ${gridColumns === 1 ? 'text-sm' : 'text-xs'}`}>
                          <CheckCircle className="h-3 w-3" />
                          Free
                        </Badge>
                      )}
                      {(chapter as any).was_locked_now_free && status === 'free' && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-green-500/40 text-green-600">Now free</Badge>
                      )}
                      
                      <div className={`text-muted-foreground flex items-center gap-1 ${gridColumns === 1 ? 'text-sm' : 'text-xs'}`}>
                        <Clock className="h-3 w-3" />
                        {daysAgo === 0 ? '1h' : `${daysAgo}d`} ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {visibleCount < filteredChapters.length && (
        <div ref={sentinelRef} className="h-8" aria-label="load more sentinel" />
      )}

      {/* Chapter Unlock Popup */}
      {selectedChapter && (
        <ChapterUnlockPopup
          isOpen={showUnlockPopup}
          onClose={() => {
            setShowUnlockPopup(false);
            setSelectedChapter(null);
          }}
          chapterId={selectedChapter.id}
          chapterTitle={`Chapter ${selectedChapter.chapter_number}: ${selectedChapter.title}`}
          unlockCost={selectedChapter.unlock_cost}
          onUnlocked={() => {
            checkUserAccess();
          }}
        />
      )}
    </div>
  );
};

export default ModernChapterGrid;