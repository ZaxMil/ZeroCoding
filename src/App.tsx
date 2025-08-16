import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import React, { Suspense } from 'react';
import { LoadingState } from './components/LoadingSpinner';
import { AuthProvider } from "./contexts/AuthContext";
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useColorScheme } from "./hooks/useColorScheme";
import { RouteWrapper } from "./components/RouteWrapper";
import { AsyncErrorBoundary } from "./components/AsyncErrorBoundary";
import { InstallationGate } from "./components/setup/InstallationGate";
import "./utils/logger";

// Import pages
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Reader from "./pages/Reader";
import Read from "./pages/Read";
import RedirectLegacyReader from "./components/reader/RedirectLegacyReader";
import RedirectLegacyReaderWithSeries from "./components/reader/RedirectLegacyReaderWithSeries";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Subscribe from "./pages/Subscribe";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";
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
import Library from "./pages/Library";
import MediaCenter from "./pages/MediaCenter";

// Lazy load heavy components
const Admin = React.lazy(() => import("./pages/Admin"));
const Author = React.lazy(() => import("./pages/Author"));
const CoinAnalytics = React.lazy(() => import("./pages/CoinAnalytics"));
const WordPressCrawler = React.lazy(() => import("./pages/WordPressCrawler").then(module => ({ default: module.WordPressCrawler })));
const Monetization = React.lazy(() => import("./pages/Monetization"));
const AdminMobile = React.lazy(() => import("./pages/AdminMobile"));
const LazyAdvancedSearch = React.lazy(() => import("./pages/AdvancedSearch"));
const LazyCoinBundles = React.lazy(() => import("./pages/CoinBundles"));

const queryClient = new QueryClient();

function AppContent() {
  useColorScheme();
  
  return (
    <InstallationGate>
      <Suspense fallback={<LoadingState message="Loading..." />}>
        <Routes>
          {/* Home page with global analytics */}
          <Route path="/" element={
            <RouteWrapper
              enableGlobalAnalytics={true}
              title="Manga Reader - Your Premium Manga Reading Experience"
              description="Professional manga reading platform with high-quality pages, smooth navigation, and immersive reading experience."
              keywords="manga, read manga online, manga reader, japanese comics, webtoon"
            >
              <Home />
            </RouteWrapper>
          } />

          {/* Home redirect */}
          <Route path="/home" element={
            <RouteWrapper>
              <Home />
            </RouteWrapper>
          } />

          {/* Legacy routes - redirect to new canonical routes */}
          <Route path="/reader/:chapterId" element={<RedirectLegacyReader />} />
          <Route path="/reader/:seriesId/:chapterNumber" element={<RedirectLegacyReaderWithSeries />} />
          
          {/* Reader route without layout */}
          <Route path="/read/:seriesSlug/:chapterNumber" element={
            <RouteWrapper enableLayout={false}>
              <Read />
            </RouteWrapper>
          } />

          {/* Auth redirect */}
          <Route path="/login" element={<Navigate to="/?auth=login" replace />} />

          {/* Standard pages with layout */}
          <Route path="/profile" element={
            <RouteWrapper>
              <Profile />
            </RouteWrapper>
          } />

          <Route path="/support" element={
            <RouteWrapper>
              <Support />
            </RouteWrapper>
          } />

          <Route path="/subscribe" element={
            <RouteWrapper>
              <Subscribe />
            </RouteWrapper>
          } />

          <Route path="/premium" element={
            <RouteWrapper>
              <Premium />
            </RouteWrapper>
          } />

          <Route path="/buy" element={
            <RouteWrapper>
              <Buy />
            </RouteWrapper>
          } />

          <Route path="/contests" element={
            <RouteWrapper>
              <Contests />
            </RouteWrapper>
          } />

          <Route path="/coins" element={
            <RouteWrapper>
              <Coins />
            </RouteWrapper>
          } />

          <Route path="/series" element={
            <RouteWrapper>
              <Series />
            </RouteWrapper>
          } />

          <Route path="/series/:id" element={
            <RouteWrapper>
              <SeriesDetail />
            </RouteWrapper>
          } />

          <Route path="/browse" element={
            <RouteWrapper>
              <Browse />
            </RouteWrapper>
          } />

          <Route path="/categories" element={
            <RouteWrapper>
              <Categories />
            </RouteWrapper>
          } />

          <Route path="/contact" element={
            <RouteWrapper>
              <Contact />
            </RouteWrapper>
          } />

          <Route path="/help" element={
            <RouteWrapper>
              <Help />
            </RouteWrapper>
          } />

          <Route path="/blog" element={
            <RouteWrapper>
              <Blog />
            </RouteWrapper>
          } />

          <Route path="/blog/:slug" element={
            <RouteWrapper>
              <Blog />
            </RouteWrapper>
          } />

          <Route path="/settings" element={
            <RouteWrapper>
              <Settings />
            </RouteWrapper>
          } />

          <Route path="/chapters" element={
            <RouteWrapper>
              <Chapters />
            </RouteWrapper>
          } />

          <Route path="/feedback" element={
            <RouteWrapper>
              <Feedback />
            </RouteWrapper>
          } />

          <Route path="/community" element={
            <RouteWrapper>
              <Community />
            </RouteWrapper>
          } />

          <Route path="/library" element={
            <RouteWrapper>
              <Library />
            </RouteWrapper>
          } />

          <Route path="/media" element={
            <RouteWrapper>
              <MediaCenter />
            </RouteWrapper>
          } />

          {/* Legal pages */}
          <Route path="/dmca" element={
            <RouteWrapper>
              <DMCAPage />
            </RouteWrapper>
          } />

          <Route path="/privacy" element={
            <RouteWrapper>
              <PrivacyPage />
            </RouteWrapper>
          } />

          <Route path="/terms" element={
            <RouteWrapper>
              <TermsPage />
            </RouteWrapper>
          } />

          <Route path="/cookies" element={
            <RouteWrapper>
              <CookiesPage />
            </RouteWrapper>
          } />

          <Route path="/article/:id" element={
            <RouteWrapper>
              <Article />
            </RouteWrapper>
          } />

          {/* Lazy-loaded heavy components with error boundaries */}
          <Route path="/admin/*" element={
            <RouteWrapper enableLayout={false}>
              <AsyncErrorBoundary componentName="Admin Dashboard">
                <Suspense fallback={<LoadingState message="Loading admin..." />}>
                  <Admin />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/author/*" element={
            <RouteWrapper enableLayout={false}>
              <AsyncErrorBoundary componentName="Author Dashboard">
                <Suspense fallback={<LoadingState message="Loading author..." />}>
                  <Author />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/admin-mobile" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="Mobile Admin">
                <Suspense fallback={<LoadingState message="Loading mobile admin..." />}>
                  <AdminMobile />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/coins/bundles" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="Coin Bundles">
                <Suspense fallback={<LoadingState message="Loading..." />}>
                  <LazyCoinBundles />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/monetization" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="Monetization">
                <Suspense fallback={<LoadingState message="Loading..." />}>
                  <Monetization />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/coin-analytics" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="Coin Analytics">
                <Suspense fallback={<LoadingState message="Loading analytics..." />}>
                  <CoinAnalytics />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/wordpress-crawler" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="WordPress Crawler">
                <Suspense fallback={<LoadingState message="Loading crawler..." />}>
                  <WordPressCrawler />
                </Suspense>
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          <Route path="/search" element={
            <RouteWrapper>
              <AsyncErrorBoundary componentName="Advanced Search">
                <LazyAdvancedSearch />
              </AsyncErrorBoundary>
            </RouteWrapper>
          } />

          {/* Redirects and aliases */}
          <Route path="/history" element={<Navigate to="/profile?tab=history" replace />} />
          <Route path="/install" element={<Navigate to="/" replace />} />
          <Route path="/authors" element={<Navigate to="/browse" replace />} />
          <Route path="/trending" element={<Navigate to="/browse" replace />} />

          {/* Legacy routes - redirect to canonical */}
          <Route path="/read/:seriesSlug/:chapterSlug" element={<RedirectLegacyReaderWithSeries />} />
          <Route path="/series/:id/chapter/:chapterNumber" element={<RedirectLegacyReaderWithSeries />} />

          {/* Special routes */}
          <Route path="/setup" element={<Setup />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <RouteWrapper>
              <NotFound />
            </RouteWrapper>
          } />
        </Routes>
      </Suspense>
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