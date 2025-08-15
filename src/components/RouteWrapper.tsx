import React, { ReactNode } from 'react';
import { ThemeProvider } from './themes/ThemeProvider';
import { AnalyticsWrapper } from './AnalyticsWrapper';
import PWAInstaller from './PWAInstaller';
import Analytics from './Analytics';
import { EnhancedSEOHelmet } from './EnhancedSEOHelmet';
import Layout from './Layout';
import ErrorBoundary from './ErrorBoundary';
import AuthModal from './AuthModal';

interface RouteWrapperProps {
  children: ReactNode;
  
  // Optional providers - all enabled by default
  enableTheme?: boolean;
  enableAnalytics?: boolean;
  enablePWA?: boolean;
  enableLayout?: boolean;
  enableGlobalAnalytics?: boolean;
  
  // SEO props
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  
  // Error boundary props
  enableErrorBoundary?: boolean;
  customErrorFallback?: ReactNode;
}

export const RouteWrapper: React.FC<RouteWrapperProps> = ({
  children,
  enableTheme = true,
  enableAnalytics = true,
  enablePWA = true,
  enableLayout = true,
  enableGlobalAnalytics = false,
  enableErrorBoundary = true,
  customErrorFallback,
  title,
  description,
  keywords,
  image
}) => {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<'login' | 'signup'>('login');

  // Listen for global auth modal open events
  React.useEffect(() => {
    const openHandler = (e: Event) => {
      const ce = e as CustomEvent<{ tab?: 'login' | 'signup' }>;
      const tab = ce.detail?.tab === 'signup' ? 'signup' : 'login';
      setAuthTab(tab);
      setShowAuthModal(true);
    };

    window.addEventListener('open-auth-modal', openHandler as EventListener);
    return () => {
      window.removeEventListener('open-auth-modal', openHandler as EventListener);
    };
  }, []);

  let content = children;

  // Wrap with Layout if enabled
  if (enableLayout) {
    content = <Layout>{content}</Layout>;
  }

  // Add global Analytics component if enabled (typically for home page)
  if (enableGlobalAnalytics) {
    content = (
      <>
        <Analytics />
        {title && (
          <EnhancedSEOHelmet 
            title={title}
            description={description}
            keywords={keywords}
            image={image || `${window.location.origin}/placeholder.svg`}
          />
        )}
        {content}
      </>
    );
  }

  // Wrap with AnalyticsWrapper if enabled
  if (enableAnalytics) {
    content = <AnalyticsWrapper>{content}</AnalyticsWrapper>;
  }

  // Add PWA installer if enabled
  if (enablePWA) {
    content = (
      <>
        {content}
        <PWAInstaller />
      </>
    );
  }

  // Wrap with ThemeProvider if enabled
  if (enableTheme) {
    content = <ThemeProvider>{content}</ThemeProvider>;
  }

  // Wrap with ErrorBoundary if enabled
  if (enableErrorBoundary) {
    content = (
      <ErrorBoundary fallback={customErrorFallback}>
        {content}
      </ErrorBoundary>
    );
  }

  return <>{content}</>;
};