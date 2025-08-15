import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import React, { Suspense } from 'react';
import { LoadingState } from './components/LoadingSpinner';
import { AuthProvider } from "./contexts/AuthContext";
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Analytics from "./components/Analytics";
import PWAInstaller from "./components/PWAInstaller";
import { useColorScheme } from "./hooks/useColorScheme";
import { ThemeProvider } from "./components/themes/ThemeProvider";
import { EnhancedSEOHelmet } from "./components/EnhancedSEOHelmet";
import Home from "./pages/Home";
import Blog from "./pages/Blog";

import Reader from "./pages/Reader";
import Read from "./pages/Read";
import RedirectLegacyReader from "./components/reader/RedirectLegacyReader";
import RedirectLegacyReaderWithSeries from "./components/reader/RedirectLegacyReaderWithSeries";
// Login page removed - use popup authentication only
import Profile from "./pages/Profile";

// Lazy load admin and heavy components
const Admin = React.lazy(() => import("./pages/Admin"));
const Author = React.lazy(() => import("./pages/Author"));
const CoinAnalytics = React.lazy(() => import("./pages/CoinAnalytics"));
const WordPressCrawler = React.lazy(() => import("./pages/WordPressCrawler").then(module => ({ default: module.WordPressCrawler })));
const Monetization = React.lazy(() => import("./pages/Monetization"));
const AdminMobile = React.lazy(() => import("./pages/AdminMobile"));
const LazyAdvancedSearch = React.lazy(() => import("./pages/AdvancedSearch"));
const LazyCoinBundles = React.lazy(() => import("./pages/CoinBundles"));
import Support from "./pages/Support";
import Subscribe from "./pages/Subscribe";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";
import Installation from "./pages/Installation";
import { AnalyticsWrapper } from './components/AnalyticsWrapper';
import Buy from "./pages/Buy";
import Contests from "./pages/Contests";
import Coins from "./pages/Coins";
import Series from "./pages/Series";
import Browse from "./pages/Browse";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Search from "./pages/Search";
import Setup from "./pages/Setup";
import SeriesDetail from "./pages/SeriesDetail";
import { InstallationGate } from "./components/setup/InstallationGate";
import History from "./pages/History";
import DMCAPage from "./pages/DMCAPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import Article from "./pages/Article";
import Feedback from "./pages/Feedback";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import Chapters from "./pages/Chapters";
import "./utils/logger";

const queryClient = new QueryClient();

function AppContent() {
  useColorScheme();
  
  return (
    <InstallationGate>
      <React.Suspense fallback={<LoadingState message="Loading..." />}>
        <Routes>
      <Route path="/" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Analytics />
            <EnhancedSEOHelmet 
              title="Manga Reader - Your Premium Manga Reading Experience"
              description="Professional manga reading platform with high-quality pages, smooth navigation, and immersive reading experience."
              keywords="manga, read manga online, manga reader, japanese comics, webtoon"
              image={`${window.location.origin}/placeholder.svg`}
            />
            <Layout>
              <Home />
            </Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/home" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Home /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
        {/* Legacy routes - redirect to new canonical routes */}
        <Route path="/reader/:chapterId" element={<RedirectLegacyReader />} />
        <Route path="/reader/:seriesId/:chapterNumber" element={<RedirectLegacyReaderWithSeries />} />
        
        {/* New canonical route */}
        <Route path="/read/:seriesSlug/:chapterNumber" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Read />
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
      {/* Login path opens global auth modal via query param */}
      <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
      <Route path="/profile" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Profile /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/support" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Support /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/subscribe" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Subscribe /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/premium" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Premium /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/admin/*" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Suspense fallback={<LoadingState message="Loading admin..." />}>
              <Admin />
            </Suspense>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/author/*" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Suspense fallback={<LoadingState message="Loading author..." />}>
              <Author />
            </Suspense>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/buy" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Buy /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/contests" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Contests /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/coins" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Coins /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/coins/bundles" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><React.Suspense fallback={<LoadingState message="Loading..." />}><LazyCoinBundles /></React.Suspense></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/monetization" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout>
              <Suspense fallback={<LoadingState message="Loading..." />}>
                <Monetization />
              </Suspense>
            </Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/series" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Series /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/series/:id" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><SeriesDetail /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/browse" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Browse /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/categories" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Categories /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/history" element={<Navigate to="/profile?tab=history" replace />} />
      <Route path="/authors" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Browse /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/trending" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Browse /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/contact" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Contact /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/help" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Help /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/search" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><LazyAdvancedSearch /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/setup" element={<Setup />} />
      <Route path="/dmca" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><DMCAPage /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/privacy" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><PrivacyPage /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/terms" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><TermsPage /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/cookies" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><CookiesPage /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/article/:id" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Article /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/feedback" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Feedback /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/community" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><Community /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
      <Route path="/install" element={<Navigate to="/" replace />} />
      <Route path="*" element={
        <ThemeProvider>
          <AnalyticsWrapper>
            <Layout><NotFound /></Layout>
            <PWAInstaller />
          </AnalyticsWrapper>
        </ThemeProvider>
      } />
        <Route path="/coin-analytics" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout>
                <Suspense fallback={<LoadingState message="Loading analytics..." />}>
                  <CoinAnalytics />
                </Suspense>
              </Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        <Route path="/wordpress-crawler" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout>
                <Suspense fallback={<LoadingState message="Loading crawler..." />}>
                  <WordPressCrawler />
                </Suspense>
              </Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        {/* Legacy MangaReader route - redirect to canonical */}
        <Route path="/read/:seriesSlug/:chapterSlug" element={<RedirectLegacyReaderWithSeries />} />
        
        {/* Legacy series/chapter route - redirect to canonical */}
        <Route path="/series/:id/chapter/:chapterNumber" element={<RedirectLegacyReaderWithSeries />} />
        <Route path="/blog" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout><Blog /></Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        <Route path="/blog/:slug" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout><Blog /></Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        <Route path="/settings" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout><Settings /></Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        <Route path="/chapters" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout><Chapters /></Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
        <Route path="/admin-mobile" element={
          <ThemeProvider>
            <AnalyticsWrapper>
              <Layout>
                <Suspense fallback={<LoadingState message="Loading mobile admin..." />}>
                  <AdminMobile />
                </Suspense>
              </Layout>
              <PWAInstaller />
            </AnalyticsWrapper>
          </ThemeProvider>
        } />
      </Routes>
      </React.Suspense>
    </InstallationGate>
  );
}

const App = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <FeatureFlagProvider>
                <Toaster />
                <AppContent />
              </FeatureFlagProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </BrowserRouter>
);

export default App;
