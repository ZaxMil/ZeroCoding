const { createClient } = require('@supabase/supabase-js');
const { writeFileSync } = require('fs');
const { join } = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eslcxgomsaizesekdvcc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbGN4Z29tc2FpemVzZWtkdmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODQ4ODAsImV4cCI6MjA2ODk2MDg4MH0.1MeKBV8__kEK06kOlj9VlNnLwtm9BWJfOv_dLlnNRnM';
const SITE_URL = process.env.SITE_URL || 'https://lovable.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSitemap() {
  const urls = [];

  // Add static pages
  urls.push(
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/browse', changefreq: 'weekly', priority: 0.8 },
    { loc: '/categories', changefreq: 'weekly', priority: 0.7 },
    { loc: '/search', changefreq: 'monthly', priority: 0.6 },
    { loc: '/premium', changefreq: 'monthly', priority: 0.5 },
    { loc: '/support', changefreq: 'monthly', priority: 0.4 },
    { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { loc: '/terms', changefreq: 'yearly', priority: 0.3 }
  );

  try {
    // Fetch series
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (seriesError) {
      console.error('Error fetching series:', seriesError);
    } else {
      series?.forEach(s => {
        urls.push({
          loc: `/series/${s.slug}`,
          lastmod: s.updated_at,
          changefreq: 'weekly',
          priority: 0.9
        });
      });
    }

    // Fetch chapters for read URLs
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        chapter_number,
        updated_at,
        series!inner(slug)
      `)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000); // Limit to avoid too large sitemap

    if (chaptersError) {
      console.error('Error fetching chapters:', chaptersError);
    } else {
      chapters?.forEach(c => {
        if (c.series?.slug) {
          urls.push({
            loc: `/read/${c.series.slug}/${c.chapter_number}`,
            lastmod: c.updated_at,
            changefreq: 'monthly',
            priority: 0.7
          });
        }
      });
    }

    // Fetch blog posts if available
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (!blogError && blogPosts) {
      blogPosts.forEach(post => {
        urls.push({
          loc: `/blog/${post.slug}`,
          lastmod: post.updated_at,
          changefreq: 'monthly',
          priority: 0.6
        });
      });
    }

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  // Write to public directory
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`✅ Sitemap generated with ${urls.length} URLs: ${outputPath}`);
}

// Run if called directly
if (require.main === module) {
  generateSitemap().catch(console.error);
}

module.exports = { generateSitemap };