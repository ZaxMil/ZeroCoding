import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Scope } from '@/comments/core/types';
import { CommentsAPI, UserRef } from '@/comments/api/CommentsAPI';
import { bus } from '@/comments/realtime/Bus';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsContextValue {
  api: CommentsAPI;
  scope: Scope;
  user: UserRef | null;
  changedTick: number;
}

const CommentsContext = createContext<CommentsContextValue | null>(null);

export const useComments = () => {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error('useComments must be used within CommentsProvider');
  return ctx;
};

export const CommentsProvider = ({ scope, children, user: userProp }: { scope: Scope; children: ReactNode; user?: UserRef }) => {
  const { user: authUser } = useAuth();
  const user: UserRef | null = useMemo(() => (
    userProp ?? (authUser ? { id: authUser.id, name: authUser.user_metadata?.name || authUser.email || 'User', avatar: authUser.user_metadata?.avatar_url } : null)
  ), [userProp, authUser]);

  const api = useMemo(() => new CommentsAPI(), []);
  const [changedTick, setChangedTick] = useState(0);

  useEffect(() => bus.on(() => setChangedTick((x) => x + 1)), []);

  const value = useMemo(() => ({ api, scope, user, changedTick }), [api, scope, user, changedTick]);
  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>;
};
