import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EnhancedSEOHelmet } from '@/components/EnhancedSEOHelmet';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LazyImage from '@/components/LazyImage';
import { supabase } from '@/integrations/supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { configManager } from '@/utils/configManager';
import { Search, Eye, BookOpen } from 'lucide-react';

interface SeriesItem {
  id: string;
  title: string;
  slug?: string | null;
  cover_image_url?: string | null;
  status?: string | null;
  genres?: string[] | null;
  view_count?: number | null;
  rating_average?: number | null;
}

const AdvancedSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [siteName, setSiteName] = useState('MangaReader');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState<string[]>(searchParams.getAll('genre'));
  const [status, setStatus] = useState(searchParams.get('status') || 'any');
  const [minRating, setMinRating] = useState<number>(parseFloat(searchParams.get('minRating') || '0'));
  const [maxPrice, setMaxPrice] = useState<number | null>(searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : null);
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [size, setSize] = useState<number>(parseInt(searchParams.get('size') || '24', 10));
  const [results, setResults] = useState<SeriesItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [priceBySeries, setPriceBySeries] = useState<Record<string, number>>({});
  const debounceRef = useRef<number | null>(null);
  const inflightRef = useRef(0);

  useEffect(() => {
    configManager.loadConfig().then(cfg => setSiteName(cfg.site.siteName));
  }, []);

  const buildQuery = () => {
    const params: any = {};
    if (q) params.q = q;
    if (genre.length) params.genre = genre;
    if (status && status !== 'any') params.status = status;
    if (minRating) params.minRating = String(minRating);
    if (maxPrice != null) params.maxPrice = String(maxPrice);
    if (sort && sort !== 'relevance') params.sort = sort;
    if (page > 1) params.page = String(page);
    if (size !== 24) params.size = String(size);
    setSearchParams(params, { replace: true });
  };

  const fetchResults = async () => {
    const thisCall = ++inflightRef.current;
    try {
      setLoading(true);
      let query = supabase
        .from('manga_meta')
        .select('id,title,cover_image_url,status,genres,view_count,rating_average', { count: 'exact' });

      if (q) query = query.ilike('title', `%${q}%`);
      if (genre.length) query = query.contains('genres', genre);
      if (status !== 'any') query = query.eq('status', status as any);
      if (minRating) query = query.gte('rating_average', minRating);

      // Sorting
      if (sort === 'popularity') query = query.order('view_count', { ascending: false });
      else if (sort === 'newest') query = query.order('updated_at', { ascending: false });
      else query = query.order('title', { ascending: true });

      // Pagination
      const from = (page - 1) * size;
      const to = from + size - 1;
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      if (inflightRef.current !== thisCall) return; // cancelled

      setResults((data || []) as SeriesItem[]);
      setTotal(count || 0);

      // If price filter needed, batch-fetch prices for these series
      if (maxPrice != null && data && data.length) {
        const seriesIds = data.map(s => s.id);
        const { data: ch } = await supabase
          .from('chapters')
          .select('id,series_id')
          .in('series_id', seriesIds);
        const chIds = ch?.map(c => c.id) || [];
        if (chIds.length) {
          const { data: prices } = await supabase
            .from('chapter_prices')
            .select('chapter_id, coin_cost')
            .in('chapter_id', chIds);
          const minBySeries: Record<string, number> = {};
          ch?.forEach(c => {
            const price = prices?.find(p => p.chapter_id === c.id)?.coin_cost;
            if (typeof price === 'number') {
              if (!(c.series_id in minBySeries)) minBySeries[c.series_id] = price;
              else minBySeries[c.series_id] = Math.min(minBySeries[c.series_id], price);
            }
          });
          setPriceBySeries(minBySeries);
        }
      } else {
        setPriceBySeries({});
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      if (inflightRef.current === thisCall) setLoading(false);
    }
  };

  useEffect(() => {
    // debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      buildQuery();
      fetchResults();
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, genre.join(','), status, minRating, maxPrice, sort, page, size]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const prevUrl = page > 1 ? `/search?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page - 1) }).toString()}` : '';
  const nextUrl = page < totalPages ? `/search?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page + 1) }).toString()}` : '';

  return (
    <div className="container mx-auto px-4 py-8">
      <EnhancedSEOHelmet 
        title={`Search — ${siteName}`}
        description="Find series by title, genre, and status"
        canonical="/search"
      />
      <Helmet>
        {prevUrl && <link rel="prev" href={prevUrl} />}
        {nextUrl && <link rel="next" href={nextUrl} />}
      </Helmet>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search titles..." className="pl-10" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="mt-2 flex gap-2">
              {['any','ongoing','completed'].map(s => (
                <Button key={s} size="sm" variant={status===s? 'default':'outline'} onClick={() => { setStatus(s); setPage(1); }} aria-label={`Filter status ${s}`}>{s}</Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Min rating</label>
            <Input type="number" min={0} max={5} step={0.1} value={minRating} onChange={(e)=> { setMinRating(parseFloat(e.target.value)||0); setPage(1); }} />
          </div>

          <div>
            <label className="text-sm font-medium">Max price (coins)</label>
            <Input type="number" min={0} step={1} value={maxPrice ?? ''} onChange={(e)=> { const v=e.target.value; setMaxPrice(v===''? null : parseInt(v,10)); setPage(1); }} />
          </div>

          <div>
            <label className="text-sm font-medium">Sort by</label>
            <div className="mt-2 flex gap-2">
              {['relevance','popularity','newest'].map(s => (
                <Button key={s} size="sm" variant={sort===s? 'default':'outline'} onClick={() => { setSort(s); setPage(1); }} aria-label={`Sort ${s}`}>{s}</Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <main>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8}).map((_,i)=> (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">{total} results</div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Per page</label>
                  <Input type="number" value={size} onChange={(e)=> setSize(Math.max(4, parseInt(e.target.value||'24',10)))} className="w-20" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map(series => (
                  <Card key={series.id} className="group overflow-hidden bg-card/95 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-primary/30">
                    <Link to={`/series/${series.id}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                        <LazyImage src={series.cover_image_url || '/placeholder.svg'} alt={series.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-3 space-y-3">
                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-300">{series.title}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Eye className="h-3 w-3" />{(series.view_count || 0).toLocaleString()}</div>
                          <div className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{series.status}</div>
                        </div>
                        {maxPrice != null && (
                          <div>
                            {priceBySeries[series.id] != null ? (
                              <Badge variant={priceBySeries[series.id] === 0 ? 'secondary' : 'outline'}>
                                {priceBySeries[series.id] === 0 ? 'Free' : `${priceBySeries[series.id]} coins`}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Varies</Badge>
                            )}
                          </div>
                        )}
                        {series.genres && (
                          <div className="flex flex-wrap gap-1">
                            {series.genres.slice(0,2).map((g,i)=> (
                              <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button variant="outline" disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))}>Prev</Button>
                  <div className="text-sm">Page {page} of {totalPages}</div>
                  <Button variant="outline" disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))}>Next</Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdvancedSearch;
