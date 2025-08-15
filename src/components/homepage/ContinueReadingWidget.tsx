import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LazyImage from '@/components/LazyImage';
import { Link } from 'react-router-dom';
import { Clock, BookOpen } from 'lucide-react';

interface SeriesMeta { id: string; title: string; cover_image_url?: string | null }
interface ChapterMeta { id: string; title: string; chapter_number: number; series_id: string; }

export const ContinueReadingWidget = () => {
  const { user } = useAuth();
  const { items, mergeGuestIntoRemote } = useReadingHistory(user?.id);
  const topItems = useMemo(() => items.slice(0, 5), [items]);
  const [seriesMeta, setSeriesMeta] = useState<Record<string, SeriesMeta>>({});
  const [chapterMeta, setChapterMeta] = useState<Record<string, ChapterMeta>>({});

  useEffect(() => { if (user) mergeGuestIntoRemote(); }, [user]);

  useEffect(() => {
    const loadMeta = async () => {
      const sIds = Array.from(new Set(topItems.map(i => i.seriesId)));
      const cIds = Array.from(new Set(topItems.map(i => i.chapterId)));
      if (sIds.length) {
        const { data } = await supabase
          .from('manga_meta')
          .select('id,title,cover_image_url')
          .in('id', sIds);
        const map: Record<string, SeriesMeta> = {};
        data?.forEach((s: any) => { map[s.id] = { id: s.id, title: s.title, cover_image_url: s.cover_image_url } });
        setSeriesMeta(map);
      }
      if (cIds.length) {
        const { data } = await supabase
          .from('chapters')
          .select('id,title,chapter_number,series_id')
          .in('id', cIds);
        const map: Record<string, ChapterMeta> = {};
        data?.forEach((c: any) => { map[c.id] = { id: c.id, title: c.title, chapter_number: c.chapter_number, series_id: c.series_id } });
        setChapterMeta(map);
      }
    };
    if (topItems.length) loadMeta();
  }, [topItems.map(i => i.seriesId + ':' + i.chapterId).join('|')]);

  if (!topItems.length) return null;

  return (
    <section aria-labelledby="continue-reading-title" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 id="continue-reading-title" className="text-xl font-bold">Continue Reading</h2>
          <p className="text-sm text-muted-foreground">Pick up where you left off</p>
        </div>
        <Button variant="outline" asChild size="sm">
          <Link to="/history">View all</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        {topItems.map(item => {
          const s = seriesMeta[item.seriesId];
          const ch = chapterMeta[item.chapterId];
          const cover = s?.cover_image_url || '/placeholder.svg';
          const chapterPercent = item.totalPages ? Math.round(((item.page + 1) / item.totalPages) * 100) : 0;
          const href = `/reader/${item.chapterId}?page=${item.page}`;
          return (
            <Card key={item.seriesId} className="overflow-hidden">
              <div className="flex gap-3 p-3">
                <div className="w-16 aspect-[3/4] overflow-hidden rounded-md bg-muted flex-shrink-0">
                  <LazyImage src={cover} alt={`${s?.title || 'Series'} cover`} className="h-full w-full object-cover" width={128} height={170} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardContent className="p-0 space-y-1">
                    <h3 className="font-semibold truncate">{s?.title || 'Series'}</h3>
                    <p className="text-xs text-muted-foreground truncate">{ch ? `Ch. ${ch.chapter_number} — ${ch.title}` : 'Last read'}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /><span>{new Date(item.updatedAt).toLocaleString()}</span></div>
                    {item.totalPages ? (
                      <div className="pt-1">
                        <Progress value={chapterPercent} />
                        <div className="text-[11px] text-muted-foreground mt-1">Chapter progress: {chapterPercent}%</div>
                      </div>
                    ) : null}
                    <div className="pt-2">
                      <Button size="sm" className="w-full" asChild>
                        <Link to={href}><BookOpen className="h-4 w-4 mr-1" /> Continue</Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueReadingWidget;
