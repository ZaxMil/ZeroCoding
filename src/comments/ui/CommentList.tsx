import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useComments } from './CommentsProvider';
import { Block, Comment } from '@/comments/core/types';
import { Card } from '@/components/ui/card';
import { ReactionBar } from './ReactionBar';
import { RichCommentEditor } from './RichCommentEditor';

const Item = ({ c, onReact }: { c: Comment; onReact: (emoji: any) => void }) => {
  const [revealed, setRevealed] = useState(false);
  const content = c.spoiler && !revealed ? (
    <button className="rounded bg-muted px-3 py-2 text-sm" onClick={() => setRevealed(true)}>Reveal Spoiler</button>
  ) : (
    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: c.content }} />
  );
  return (
    <div className="p-3 border-b">
      <div className="flex items-center gap-2 text-sm"><span className="font-medium">{c.userName}</span><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span></div>
      <div className="mt-2">{content}</div>
      {c.attachments?.length ? (
        <div className="mt-2 flex gap-2 flex-wrap">
          {c.attachments.map((a)=> (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer"><img src={a.thumbUrl} alt="attachment" className="h-20 w-20 rounded object-cover" /></a>
          ))}
        </div>
      ) : null}
      <div className="mt-2">
        <ReactionBar counts={c.reactions as any} onToggle={onReact} />
      </div>
    </div>
  );
};

export const CommentList = () => {
  const { api, scope, user, changedTick } = useComments();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  const limit = 20;

  const load = async (reset = false) => {
    const off = reset ? 0 : page * limit;
    const { rows, total } = await api.queryComments({ scope, limit, offset: off });
    setTotal(total);
    const filtered = user ? rows.filter((c)=> !blocks.some((b)=> b.blockedId === c.userId)) : rows;
    setItems((prev) => (reset ? filtered : [...prev, ...filtered]));
    if (!reset) setPage((p) => p + 1);
  };

  useEffect(() => { load(true); }, [scope, changedTick, blocks]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const onReachEnd = async () => {
    if (items.length < total) await load(false);
  };

  useEffect(() => {
    const v = rowVirtualizer;
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) onReachEnd();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [items, total]);

  useEffect(() => { (async () => { if (user) setBlocks(await api.getBlocks(user.id)); else setBlocks([]); })(); }, [user, changedTick]);

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="mt-3">
          <RichCommentEditor />
        </div>
      </div>
      <div ref={parentRef} className="h-[480px] overflow-auto">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const c = items[vi.index];
            if (!c) return null;
            return (
              <div key={c.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}>
                <Item c={c} onReact={(e)=> user && api.toggleReaction(c.id, e, user.id)} />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
