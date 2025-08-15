import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useComments } from '../ui/CommentsProvider';

export const BlocksManager = () => {
  const { api, user } = useComments();
  const [blockedId, setBlockedId] = useState('');
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { (async () => {
    if (!user) return;
    setList(await api.getBlocks(user.id));
  })(); }, [user]);

  const add = async () => {
    if (!user || !blockedId) return;
    await api.blockUser(user.id, blockedId);
    setList(await api.getBlocks(user.id));
    setBlockedId('');
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-lg font-semibold">Blocked Users</h3>
      <div className="flex gap-2">
        <Input value={blockedId} onChange={(e)=>setBlockedId(e.target.value)} placeholder="User ID to block" />
        <Button onClick={add}>Block</Button>
      </div>
      <ul className="text-sm">
        {list?.map((b)=> (<li key={`${b.blockerId}:${b.blockedId}`}>{b.blockedId}</li>))}
      </ul>
    </Card>
  );
};
