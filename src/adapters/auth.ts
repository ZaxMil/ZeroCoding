// AuthAdapter interface and mock wrapper around existing AuthContext (non-destructive)
import { useAuth } from '@/contexts/AuthContext';

export type Role = 'anon' | 'member' | 'admin';

export interface AuthAdapter {
  currentUser: () => { id: string; email?: string } | null;
  role: () => Role;
  signIn: (email: string, password: string) => Promise<{ error: any }>; // delegates to AuthContext
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setRole: (r: Role) => void; // UI-only override, does not touch auth internals
}

const ROLE_KEY = 'dev:role_override';

export const useAuthAdapter = (): AuthAdapter => {
  const { user, signIn, signUp, signOut, userProfile } = useAuth();

  const currentUser = () => (user ? { id: user.id, email: user.email || undefined } : null);

  const role = (): Role => {
    try {
      const override = (sessionStorage.getItem(ROLE_KEY) || '') as Role;
      if (override === 'admin' || override === 'member' || override === 'anon') return override;
    } catch {}
    if (!user) return 'anon';
    const rp = (userProfile?.role || 'user');
    return rp === 'admin' ? 'admin' : 'member';
  };

  const setRole = (r: Role) => {
    try { sessionStorage.setItem(ROLE_KEY, r); } catch {}
    window.dispatchEvent(new Event('auth:role-override'));
  };

  return { currentUser, role, signIn, signUp, signOut, setRole };
};
