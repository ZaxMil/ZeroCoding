import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import ModernChapterGrid from './ModernChapterGrid';
import { useSeriesChaptersPaginated } from '@/hooks/useSeriesChaptersPaginated';

interface Props {
  seriesId: string;
  seriesSlug?: string;
}

const SeriesChaptersPaginated: React.FC<Props> = ({ seriesId, seriesSlug }) => {
  const list = useSeriesChaptersPaginated(seriesId);

  // Preserve focus on page change
  const navRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (navRef.current) (navRef.current.querySelector('button,select') as HTMLElement | null)?.focus();
  }, [list.page, list.pageSize]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const prevUrl = list.page > 1 ? `${baseUrl}?page=${list.page - 1}&size=${list.pageSize}` : null;
  const nextUrl = list.page < list.totalPages ? `${baseUrl}?page=${list.page + 1}&size=${list.pageSize}` : null;

  return (
    <div className="space-y-4" aria-label="Series chapters list (pagination)">
      {/* SEO prev/next */}
      <Helmet>
        {prevUrl && <link rel="prev" href={prevUrl} />}
        {nextUrl && <link rel="next" href={nextUrl} />}
        <link rel="canonical" href={`${baseUrl}${list.page > 1 ? `?page=${list.page}&size=${list.pageSize}` : ''}`} />
      </Helmet>

      <ModernChapterGrid chapters={list.rows as any} seriesSlug={seriesSlug} />

      {list.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-3" ref={navRef}>
          <div className="text-sm text-muted-foreground">{list.start}–{list.end} of {list.totalCount}</div>
          <div className="flex items-center gap-1" role="navigation" aria-label="pagination">
            <Button variant="outline" size="sm" onClick={() => list.setPage(1)} disabled={list.page <= 1} aria-label="First page">«</Button>
            <Button variant="outline" size="sm" onClick={() => list.setPage(list.page - 1)} disabled={list.page <= 1} aria-label="Previous page">‹</Button>
            <Button variant="outline" size="sm" onClick={() => list.setPage(list.page + 1)} disabled={list.page >= list.totalPages} aria-label="Next page">›</Button>
            <Button variant="outline" size="sm" onClick={() => list.setPage(list.totalPages)} disabled={list.page >= list.totalPages} aria-label="Last page">»</Button>
            <select className="ml-2 h-8 rounded-md border bg-background px-2 text-sm" aria-label="Page size"
              value={list.pageSize}
              onChange={(e) => list.setPageSize(parseInt(e.target.value, 10))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesChaptersPaginated;
