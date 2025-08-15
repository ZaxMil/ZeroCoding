import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, BookOpen } from 'lucide-react';
import ChapterUnlockPopup from '@/components/ChapterUnlockPopup';

interface NextUpCTAProps {
  seriesId: string;
}

interface ChapterLite {
  id: string;
  title: string | null;
  chapter_number: number;
  is_locked: boolean;
  release_date: string | null;
}

const NextUpCTA: React.FC<NextUpCTAProps> = ({ seriesId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chapters, setChapters] = useState<ChapterLite[]>([]);
  const [progress, setProgress] = useState<Record<string, { current_page: number; total_pages: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; title: string; number: number; price?: number } | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  // Load minimal chapter list and optional progress
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data: chData, error: chErr } = await supabase
          .from('chapters')
          .select('id,title,chapter_number,is_locked,release_date')
          .eq('series_id', seriesId)
          .order('chapter_number', { ascending: true });
        if (chErr) throw chErr;

        if (!active) return;
        setChapters((chData || []) as ChapterLite[]);

        // Load prices in batch for locked chapters
        const lockedIds = (chData || []).filter(c => c.is_locked).map(c => c.id);
        if (lockedIds.length) {
          const { data: prices } = await supabase
            .from('chapter_prices')
            .select('chapter_id, coin_cost')
            .in('chapter_id', lockedIds);
          const map: Record<string, number> = {};
          prices?.forEach((p: any) => { map[p.chapter_id] = p.coin_cost; });
          if (active) setPriceMap(map);
        }

        // Load reading progress for this user
        if (user) {
          const { data: prog } = await supabase
            .from('reading_progress' as any)
            .select('chapter_id,current_page,total_pages')
            .in('chapter_id', (chData || []).map(c => c.id));
          const p: Record<string, { current_page: number; total_pages: number | null }> = {};
          prog?.forEach((r: any) => { p[r.chapter_id] = { current_page: r.current_page, total_pages: r.total_pages }; });
          if (active) setProgress(p);
        } else {
          setProgress({});
        }
      } catch (e) {
        console.error('NextUpCTA load error', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    const onUnlocked = () => {
      // Recompute after unlocks
      load();
    };
    window.addEventListener('chapter-unlocked', onUnlocked);
    return () => { active = false; window.removeEventListener('chapter-unlocked', onUnlocked); };
  }, [seriesId, user?.id]);

  const nextUp = useMemo(() => {
    if (!chapters.length) return null;
    for (const ch of chapters) {
      const prog = progress[ch.id];
      const isComplete = prog && prog.total_pages ? prog.current_page >= (prog.total_pages - 1) : false;
      if (!isComplete) return ch;
    }
    return chapters[0];
  }, [chapters, progress]);

  if (loading || !nextUp) return null;

  const isLocked = nextUp.is_locked;
  const cost = isLocked ? priceMap[nextUp.id] : undefined;

  const handleClick = () => {
    if (!isLocked) {
      // navigate using anchor to reader route
      window.location.href = `/read/${seriesId}/${nextUp.chapter_number}`;
      return;
    }
    // Show unlock popup for locked chapter
    setSelected({ id: nextUp.id, title: `Chapter ${nextUp.chapter_number}${nextUp.title ? `: ${nextUp.title}` : ''}`, number: nextUp.chapter_number, price: cost });
    setShowUnlock(true);
  };

  return (
    <section aria-label="Next up" className="bg-card/50 border border-border/20 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Next up</div>
          <div className="text-base font-semibold">Chapter {nextUp.chapter_number}{nextUp.title ? ` — ${nextUp.title}` : ''}</div>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && typeof cost === 'number' && (
            <Badge variant="secondary" aria-label={`Unlock price ${cost} coins`}>
              <Lock className="h-3 w-3 mr-1" /> {cost}
            </Badge>
          )}
          <Button onClick={handleClick} aria-label={isLocked ? `Unlock and read chapter ${nextUp.chapter_number}` : `Read chapter ${nextUp.chapter_number}`}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" /> Unlock & Read
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" /> Read Chapter {nextUp.chapter_number}
              </>
            )}
          </Button>
        </div>
      </div>

      {selected && (
        <ChapterUnlockPopup
          isOpen={showUnlock}
          onClose={() => setShowUnlock(false)}
          chapterId={selected.id}
          chapterTitle={selected.title}
          unlockCost={selected.price || 0}
          onUnlocked={() => {
            setShowUnlock(false);
            window.location.href = `/read/${seriesId}/${selected.number}`;
          }}
        />
      )}
    </section>
  );
};

export default NextUpCTA;
