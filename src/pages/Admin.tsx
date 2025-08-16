import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/SecureRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ModernDashboardOverview } from '@/components/admin/ModernDashboardOverview';
import { AdminDashboardProvider } from '@/contexts/AdminDashboardContext';
import { LoadingFallback } from '@/components/admin/LoadingFallback';

// 1. Dashboard & Analytics
import { UserAnalytics } from '@/components/admin/UserAnalytics';
import { SeriesAnalytics } from '@/components/admin/SeriesAnalytics';
import RevenueAnalytics from '@/components/admin/RevenueAnalytics';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import PerformancePanel from '@/components/admin/PerformancePanel';

// 2. Content & Community
import { SeriesManager } from '@/components/admin/SeriesManager';

import { ContentUpload } from '@/components/admin/ContentUpload';
import { UploadsManager } from '@/components/admin/UploadsManager';
import { CommentsManager } from '@/components/admin/CommentsManager';
import { SimpleUserManager } from '@/components/admin/SimpleUserManager';
import { RoleManager } from '@/components/admin/RoleManager';
import { BlogManager } from '@/components/admin/BlogManager';

// 3. Monetization & Store
import { CoinManager } from '@/components/monetization/CoinManager';
import CoinPricingManager from '@/components/admin/CoinPricingManager';
import PurchasesManager from '@/components/admin/PurchasesManager';
import MonetizationControlPanel from '@/components/admin/MonetizationControlPanel';
import PayPalSecretsChecker from '@/components/admin/PayPalSecretsChecker';
import PayPalSettings from '@/admin/PayPalSettings';
import ChapterUnlockSettings from '@/components/admin/ChapterUnlockSettings';
import UsageLimitsManager from '@/components/admin/UsageLimitsManager';
import { UserEconomyPanel } from '@/components/admin/UserEconomyPanel';

// 4. System & Settings
import { SiteSettings } from '@/components/admin/SiteSettings';
import ThemeManager from '@/components/admin/ThemeManager';
import { ThemeCustomizer } from '@/components/admin/ThemeCustomizer';
import { FooterManager } from '@/components/admin/FooterManager';
import { LegalPagesManager } from '@/components/admin/LegalPagesManager';
import { MediaManagement } from '@/components/admin/MediaManagement';
import { SystemChecklist } from '@/components/admin/SystemChecklist';
import { ProductionReadinessPanel } from '@/components/admin/ProductionReadinessPanel';

// 5. Dev Tools & Maintenance
import { DeveloperToolsPanel } from '@/components/admin/DeveloperToolsPanel';
import DatabaseExporter from '@/utils/DatabaseExporter';
import { SystemChangelog } from '@/components/admin/SystemChangelog';
import { ChangelogManager } from '@/components/admin/ChangelogManager';
import { DataResetPanel } from '@/components/admin/DataResetPanel';
import { ErrorMonitoringDashboard } from '@/components/admin/ErrorMonitoringDashboard';
import { OrganizedDeveloperTools } from '@/components/admin/OrganizedDeveloperTools';
import { ImprovedDataResetPanel } from '@/components/admin/ImprovedDataResetPanel';
import { CloudflarePanel } from '@/components/admin/CloudflarePanel';
import WatermarkSettings from '@/pages/admin/WatermarkSettings';

const Admin = () => {
  return (
    <AdminRoute>
      <AdminDashboardProvider>
        <AdminLayout>
          <Suspense fallback={<LoadingFallback type="dashboard" />}>
            <Routes>
              {/* 1. Dashboard & Analytics */}
              <Route index element={<ModernDashboardOverview />} />
              <Route path="user-analytics" element={<UserAnalytics />} />
              <Route path="revenue-analytics" element={<RevenueAnalytics />} />
              <Route path="series-analytics" element={<SeriesAnalytics />} />
              <Route path="performance" element={<PerformancePanel />} />

              {/* 2. Content & Community */}
              <Route path="series" element={<SeriesManager />} />
              
              <Route path="upload" element={<ContentUpload />} />
              <Route path="uploads" element={<UploadsManager />} />
              <Route path="comments" element={<CommentsManager />} />
              <Route path="users" element={<SimpleUserManager />} />
              <Route path="roles" element={<RoleManager />} />
              <Route path="blog" element={<BlogManager />} />

              {/* 3. Monetization & Store */}
              <Route path="coins" element={<CoinManager />} />
              <Route path="coin-pricing" element={<CoinPricingManager />} />
              <Route path="monetization-control" element={<MonetizationControlPanel />} />
              <Route path="purchases" element={<PurchasesManager />} />
              <Route path="user-economy" element={<UserEconomyPanel />} />
              <Route path="paypal-secrets" element={<PayPalSecretsChecker />} />
              <Route path="paypal-settings" element={<PayPalSettings />} />
              <Route path="billing" element={<PayPalSettings />} />
              <Route path="chapter-unlock" element={<ChapterUnlockSettings />} />
              <Route path="usage-limits" element={<UsageLimitsManager />} />

              {/* 4. System & Settings */}
              <Route path="settings" element={<SiteSettings />} />
              <Route path="themes" element={<ThemeManager />} />
              <Route path="theme-customizer" element={<ThemeCustomizer />} />
              <Route path="footer-manager" element={<FooterManager />} />
              <Route path="legal-pages" element={<LegalPagesManager />} />
              <Route path="media" element={<MediaManagement />} />
              <Route path="system-checklist" element={<SystemChecklist />} />
              <Route path="production-readiness" element={<ProductionReadinessPanel />} />

              {/* 5. Dev Tools & Maintenance */}
              <Route path="developer-tools" element={<OrganizedDeveloperTools />} />
              <Route path="error-monitoring" element={<ErrorMonitoringDashboard />} />
              <Route path="export" element={<DatabaseExporter />} />
              <Route path="changelog" element={<SystemChangelog />} />
              <Route path="changelog-manager" element={<ChangelogManager />} />
              <Route path="data-reset" element={<ImprovedDataResetPanel />} />
              <Route path="cloudflare" element={<CloudflarePanel />} />

              {/* 6. Security & Monitoring */}
              <Route path="security/watermark-settings" element={<WatermarkSettings />} />

              {/* Fallback for unknown routes */}
              <Route path="*" element={<ModernDashboardOverview />} />
            </Routes>
          </Suspense>
        </AdminLayout>
      </AdminDashboardProvider>
    </AdminRoute>
  );
};

export default Admin;