import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import UserProfileBadge from './UserProfileBadge';
import Footer from './Footer';
import ThemeSelector from './ThemeSelector';
import BackToTop from './BackToTop';
import CreativeNavBar from './CreativeNavBar';
import kodeLexLogo from '@/assets/kodelex-logo.png';
import { AmbientParticles } from './particles/AmbientParticles';
import { DevOverlay } from './dev/DevOverlay';
import { runtime } from '@/config/runtime';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Safely handle router context - may not exist during installation
  let location;
  try {
    location = useLocation();
  } catch (error) {
    // Router context not available, use fallback
    location = { pathname: window.location.pathname } as any;
  }
  
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [showDevOverlay, setShowDevOverlay] = useState(false);
  
  // Expanded reader routes for immersive experience
  const path = location.pathname || '';
  const isReaderPage = /\/reader\//i.test(path) || /\/read\//i.test(path) || /\/series\/.+\/chapter\/.+/i.test(path);

  // Listen for global auth modal open events and dev overlay
  useEffect(() => {
    const openHandler = (e: Event) => {
      const ce = e as CustomEvent<{ tab?: 'login' | 'signup' }>;
      const tab = ce.detail?.tab === 'signup' ? 'signup' : 'login';
      setAuthTab(tab);
      setShowAuthModal(true);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle dev overlay with Ctrl/Cmd + D
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setShowDevOverlay(!showDevOverlay);
      }
    };

    // Check for dev query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === '1') {
      setShowDevOverlay(true);
    }

    window.addEventListener('open-auth-modal', openHandler as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-auth-modal', openHandler as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDevOverlay]);

  // Also open auth modal via query param (?auth=login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthTab(authParam as 'login' | 'signup');
      setShowAuthModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  
  if (isReaderPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <AmbientParticles enabled={runtime.PARTICLES} density={runtime.PARTICLES_DENSITY} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <CreativeNavBar />
        <main className="flex-1">{children}</main>
        <BackToTop />
        <Footer />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialTab={authTab} />
        <DevOverlay 
          isOpen={showDevOverlay} 
          onClose={() => setShowDevOverlay(false)} 
        />
      </div>
    </div>
  );
};

export default Layout;