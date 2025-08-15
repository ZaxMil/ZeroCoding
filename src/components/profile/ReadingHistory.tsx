import { useEffect, useMemo, useState } from 'react';
import LazyImage from '@/components/LazyImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, Pin, BookOpen } from 'lucide-react';

interface SeriesMeta { id: string; title: string; cover_image_url?: string | null; }
interface ChapterMeta { id: string; title: string; chapter_number: number; series_id: string; }

export default function ReadingHistory() {
  const { user } = useAuth();
  const { items, mergeGuestIntoRemote, clearSeries, togglePin } = useReadingHistory(user?.id);
  const [seriesMeta, setSeriesMeta] = useState<Record<string, SeriesMeta>>({});
  const [chapterMeta, setChapterMeta] = useState<Record<string, ChapterMeta>>({});
  const [seriesTotals, setSeriesTotals] = useState<Record<string, number>>({});
  const seriesIds = useMemo(() => Array.from(new Set(items.map(i => i.seriesId))), [items]);
  const chapterIds = useMemo(() => Array.from(new Set(items.map(i => i.chapterId))), [items]);

  useEffect(() => {
    if (user) mergeGuestIntoRemote();
  }, [user]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (seriesIds.length) {
        const { data } = await supabase.from('manga_meta').select('id,title,cover_image_url').in('id', seriesIds);
        const map: Record<string, SeriesMeta> = {};
        data?.forEach(s => { map[s.id] = { id: s.id, title: s.title, cover_image_url: s.cover_image_url }; });
        setSeriesMeta(map);
      } else setSeriesMeta({});
      if (chapterIds.length) {
        const { data } = await supabase.from('chapters').select('id,title,chapter_number,series_id').in('id', chapterIds);
        const map: Record<string, ChapterMeta> = {};
        data?.forEach(c => { map[c.id] = { id: c.id, title: c.title, chapter_number: c.chapter_number, series_id: c.series_id }; });
        setChapterMeta(map);
      } else setChapterMeta({});
      // total chapters per series
      if (seriesIds.length) {
        const { data } = await supabase.from('chapters').select('id,series_id').in('series_id', seriesIds);
        const totals: Record<string, number> = {};
        data?.forEach(c => { totals[c.series_id] = (totals[c.series_id] || 0) + 1; });
        setSeriesTotals(totals);
      } else setSeriesTotals({});
    };
    fetchMeta();
  }, [seriesIds.join(','), chapterIds.join(',')]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Reading History</h3>
        <p className="text-muted-foreground text-sm">Continue where you left off</p>
      </div>

      {!items.length && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reading history yet</h3>
          <p className="text-muted-foreground mb-4">Start reading and your progress will appear here.</p>
          <Link to="/series"><Button variant="outline">Browse Series</Button></Link>
        </div>
      )}

      {!!items.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {items.map(item => {
            const meta = seriesMeta[item.seriesId];
            const ch = chapterMeta[item.chapterId];
            const cover = meta?.cover_image_url || '/placeholder.svg';
            const chapterPercent = item.totalPages ? Math.round(((item.page + 1) / item.totalPages) * 100) : 0;
            const total = seriesTotals[item.seriesId] || 0;
            const readNumber = ch?.chapter_number || 0;
            const seriesPercent = total > 0 ? Math.min(100, Math.round((readNumber / total) * 100)) : 0;
            return (
              <Card key={item.seriesId} className="overflow-hidden group">
                <div className="flex gap-3 p-3">
                  <div className="w-20 aspect-[3/4] overflow-hidden rounded-md bg-muted flex-shrink-0">
                    <LazyImage src={cover} alt={`${meta?.title || 'Series'} cover`} className="h-full w-full object-cover" width={160} height={213} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardContent className="p-0 space-y-1">
                      <h3 className="font-semibold truncate">{meta?.title || 'Series'}</h3>
                      <p className="text-sm text-muted-foreground truncate">Last read: {ch ? `Ch. ${ch.chapter_number} — ${ch.title}` : '—'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" /><span>{new Date(item.updatedAt).toLocaleString()}</span></div>
                      <div className="pt-2">
                        <Progress value={seriesPercent} />
                        <div className="text-xs text-muted-foreground mt-1">Series progress: {seriesPercent}% ({readNumber}/{total} chapters)</div>
                      </div>
                      {item.totalPages ? (
                        <div className="pt-2">
                          <Progress value={chapterPercent} />
                          <div className="text-xs text-muted-foreground mt-1">Chapter progress: {chapterPercent}%</div>
                        </div>
                      ) : null}
                      <div className="pt-2 flex items-center gap-2">
                        <Link to={`/reader/${item.chapterId}?page=${item.page}`}><Button size="sm">Continue Reading</Button></Link>
                        <Button variant="ghost" size="icon" onClick={() => togglePin(item.seriesId)} aria-label="Pin">
                          <Pin className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => clearSeries(item.seriesId)}>Clear history</Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}