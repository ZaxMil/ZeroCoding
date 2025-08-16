import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { EnhancedSEOHelmet } from '@/components/EnhancedSEOHelmet';
import { StructuredDataGenerator } from '@/components/seo/StructuredDataGenerator';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';

// Lazy load components for better performance
const Index = lazy(() => import('@/pages/Index'));
// TODO: Create these page components
// const MangaDetail = lazy(() => import('@/pages/MangaDetail'));
// const ChapterReader = lazy(() => import('@/pages/ChapterReader'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));

interface RouteConfig {
  path: string;
  component: React.ComponentType;
  seoConfig: {
    title: string;
    description: string;
    keywords: string;
    type?: string;
    generateStructuredData?: (params?: any) => any;
  };
  preloadData?: () => Promise<any>;
}

const routeConfigs: RouteConfig[] = [
  {
    path: '/',
    component: Index,
    seoConfig: {
      title: 'Manga Reader Pro - Premium Manga Reading Experience',
      description: 'Discover thousands of manga titles with our premium reading platform. Enjoy high-quality images, fast loading, and exclusive content.',
      keywords: 'manga reader, manga online, premium manga, manga platform, read manga',
      type: 'website',
      generateStructuredData: () => ({
        name: 'Manga Reader Pro',
        description: 'Premium manga reading platform',
        url: window.location.origin,
        potentialAction: {
          target: `${window.location.origin}/search?q={search_term_string}`,
          queryInput: 'required name=search_term_string'
        }
      })
    }
  }
  // TODO: Add manga and chapter routes when components are created
];

interface SEORouteProps {
  config: RouteConfig;
  component: React.ComponentType;
  params?: Record<string, string>;
}

const SEORoute: React.FC<SEORouteProps> = ({ config, component: Component, params = {} }) => {
  const location = useLocation();
  
  // Initialize performance optimizer for each route
  usePerformanceOptimizer({
    enablePrefetch: true,
    enableImageOptimization: true,
    enableCriticalResourceHints: true
  });

  // Interpolate SEO config with dynamic data
  const interpolateConfig = (template: string, data: Record<string, any>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  };

  const seoData = {
    mangaTitle: 'Sample Manga',
    mangaDescription: 'An exciting manga series',
    mangaGenres: 'action, adventure, fantasy',
    chapterNumber: '1',
    ...params
  };

  const title = interpolateConfig(config.seoConfig.title, seoData);
  const description = interpolateConfig(config.seoConfig.description, seoData);
  const keywords = interpolateConfig(config.seoConfig.keywords, seoData);

  const structuredData = config.seoConfig.generateStructuredData?.(seoData);

  return (
    <>
      <EnhancedSEOHelmet
        title={title}
        description={description}
        keywords={keywords}
        type={config.seoConfig.type}
        canonical={`${window.location.origin}${location.pathname}`}
      />
      
      {structuredData && (
        <StructuredDataGenerator 
          type={config.seoConfig.type === 'website' ? 'website' : 'manga'} 
          data={structuredData} 
        />
      )}
      
      <Component />
    </>
  );
};

// Loading component with SEO optimization
const SEOLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const SEOOptimizedRouter: React.FC = () => {
  return (
    <Suspense fallback={<SEOLoadingFallback />}>
      <Routes>
        {routeConfigs.map((config) => (
          <Route
            key={config.path}
            path={config.path}
            element={
              <SEORoute 
                config={config} 
                component={config.component}
              />
            }
          />
        ))}
      </Routes>
    </Suspense>
  );
};