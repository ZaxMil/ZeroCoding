import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useComments } from '../ui/CommentsProvider';

export const FiltersPanel = ({ onChange }: { onChange: (f: any) => void }) => {
  const [seriesSlug, setSeriesSlug] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const f: any = {};
    if (seriesSlug) f.seriesSlug = seriesSlug;
    if (chapterNumber) f.chapterNumber = Number(chapterNumber);
    if (userId) f.userId = userId;
    if (text) f.text = text;
    onChange(f);
  }, [seriesSlug, chapterNumber, userId, text]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <Label>Series Slug</Label>
        <Input value={seriesSlug} onChange={(e)=>setSeriesSlug(e.target.value)} />
      </div>
      <div>
        <Label>Chapter #</Label>
        <Input value={chapterNumber} onChange={(e)=>setChapterNumber(e.target.value)} />
      </div>
      <div>
        <Label>User ID</Label>
        <Input value={userId} onChange={(e)=>setUserId(e.target.value)} />
      </div>
      <div>
        <Label>Text</Label>
        <Input value={text} onChange={(e)=>setText(e.target.value)} />
      </div>
    </div>
  );
};
