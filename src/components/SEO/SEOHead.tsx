import { Helmet } from 'react-helmet-async';
import React from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  imageUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalPath,
  imageUrl,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = canonicalPath ? `${origin}${canonicalPath}` : undefined;

  // Basic, page-level CSP via meta (best effort for SPA)
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co",
    "font-src 'self' data:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* Basic CSP */}
      <meta httpEquiv="Content-Security-Policy" content={csp} />
    </Helmet>
  );
};

export default SEOHead;
