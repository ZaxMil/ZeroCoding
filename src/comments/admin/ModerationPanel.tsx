import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useComments } from '../ui/CommentsProvider';
import { FiltersPanel } from '../ui/FiltersPanel';
import { makeScopeKey } from '@/comments/core/types';

export const BulkActions = ({ selected, onClear }: { selected: string[]; onClear: () => void }) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">Hide</Button>
      <Button variant="outline" size="sm">Unhide</Button>
      <Button variant="destructive" size="sm">Delete</Button>
      <Button variant="secondary" size="sm">Ban</Button>
      <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
    </div>
  );
};

export const ModerationPanel = () => {
  const { api } = useComments();
  const [filters, setFilters] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);

  const query = async () => {
    const scope = filters.chapterNumber ? { type:'chapter' as const, seriesSlug: filters.seriesSlug, chapterNumber: Number(filters.chapterNumber) } : filters.seriesSlug ? { type: 'series' as const, seriesSlug: filters.seriesSlug } : undefined;
    const { rows } = await api.queryComments({ scope, text: filters.text, userId: filters.userId, limit: 100, offset: 0 });
    setRows(rows);
  };

  useEffect(() => { query(); }, [filters]);

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Comments Moderation</h3>
      <FiltersPanel onChange={setFilters} />
      <div className="text-sm text-muted-foreground">{rows.length} comments</div>
      <div className="border rounded">
        {rows.map((c)=> (
          <div key={c.id} className="p-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.userName}</div>
                <div className="text-xs text-muted-foreground">{makeScopeKey(c.scope)} • {new Date(c.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xs">flags: {c.flags}</div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: c.content }} />
          </div>
        ))}
      </div>
    </Card>
  );
};
