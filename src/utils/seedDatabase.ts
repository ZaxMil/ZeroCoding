import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const seedRoleDashboards = async () => {
  console.log('🌱 Seeding role_dashboards table...');
  
  const roleDashboards: Array<{
    role_name: UserRole;
    dashboard_config: any;
    menu_items: any;
    permissions: any;
  }> = [
    // Admin dashboard
    {
      role_name: 'admin' as UserRole,
      dashboard_config: { theme: 'admin', layout: 'grid' },
      menu_items: [
        { title: 'Overview', path: '/admin', icon: 'LayoutDashboard' },
        { title: 'User Management', path: '/admin/users', icon: 'Users' },
        { title: 'Series Manager', path: '/admin/series', icon: 'BookOpen' },
        { title: 'Chapter Manager', path: '/admin/chapters', icon: 'FileText' },
        { title: 'Analytics', path: '/admin/analytics', icon: 'BarChart' },
        { title: 'Settings', path: '/admin/settings', icon: 'Settings' }
      ],
      permissions: {
        can_manage_users: true,
        can_upload: true,
        can_moderate: true,
        can_view_analytics: true,
        can_manage_settings: true,
        can_delete: true
      }
    },
    // Uploader dashboard
    {
      role_name: 'uploader' as UserRole,
      dashboard_config: { theme: 'uploader', layout: 'grid' },
      menu_items: [
        { title: 'My Uploads', path: '/uploader/uploads', icon: 'Upload' },
        { title: 'Chapter Upload', path: '/uploader/new', icon: 'FileText' },
        { title: 'Upload History', path: '/uploader/history', icon: 'History' },
        { title: 'Series Manager', path: '/uploader/series', icon: 'BookOpen' }
      ],
      permissions: {
        can_upload: true,
        can_edit_own: true,
        can_view_stats: true
      }
    },
    // SEO Manager dashboard
    {
      role_name: 'seo_manager' as UserRole,
      dashboard_config: { theme: 'seo', layout: 'grid' },
      menu_items: [
        { title: 'SEO Dashboard', path: '/seo', icon: 'TrendingUp' },
        { title: 'Content Optimization', path: '/seo/optimize', icon: 'Edit' },
        { title: 'Meta Management', path: '/seo/meta', icon: 'Settings' },
        { title: 'Analytics', path: '/seo/analytics', icon: 'BarChart' }
      ],
      permissions: {
        can_edit_meta: true,
        can_optimize_content: true,
        can_view_seo_analytics: true
      }
    },
    // Author dashboard
    {
      role_name: 'author' as UserRole,
      dashboard_config: { theme: 'author', layout: 'grid' },
      menu_items: [
        { title: 'My Series', path: '/author/series', icon: 'BookOpen' },
        { title: 'Chapters', path: '/author/chapters', icon: 'FileText' },
        { title: 'Analytics', path: '/author/analytics', icon: 'BarChart' },
        { title: 'Profile', path: '/author/profile', icon: 'User' }
      ],
      permissions: {
        can_create_series: true,
        can_upload: true,
        can_edit_own: true,
        can_view_own_stats: true
      }
    },
    // Member dashboard
    {
      role_name: 'member' as UserRole,
      dashboard_config: { theme: 'member', layout: 'list' },
      menu_items: [
        { title: 'Reading List', path: '/library', icon: 'BookOpen' },
        { title: 'Profile', path: '/profile', icon: 'User' },
        { title: 'Preferences', path: '/settings', icon: 'Settings' },
        { title: 'History', path: '/profile?tab=history', icon: 'History' }
      ],
      permissions: {
        can_read: true,
        can_comment: true,
        can_rate: true,
        can_bookmark: true
      }
    }
  ];

  try {
    // Check if data already exists
    const { data: existingData } = await supabase
      .from('role_dashboards')
      .select('role_name');

    if (existingData && existingData.length > 0) {
      console.log('✅ Role dashboards already seeded');
      return;
    }

    // Insert all role dashboards
    const { error } = await supabase
      .from('role_dashboards')
      .upsert(roleDashboards, { onConflict: 'role_name' });

    if (error) {
      console.error('❌ Error seeding role_dashboards:', error);
      throw error;
    }

    console.log('✅ Successfully seeded role_dashboards table');
  } catch (error) {
    console.error('❌ Failed to seed role_dashboards:', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  try {
    await seedRoleDashboards();
    console.log('🎉 Database initialization complete');
  } catch (error) {
    console.error('💥 Database initialization failed:', error);
  }
};