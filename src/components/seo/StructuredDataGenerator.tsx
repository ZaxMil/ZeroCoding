import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MangaStructuredData {
  name: string;
  description: string;
  author: string;
  genre: string[];
  datePublished?: string;
  dateModified?: string;
  image: string;
  url: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  publisher?: {
    name: string;
    logo: string;
  };
}

interface ChapterStructuredData {
  name: string;
  description: string;
  partOfSeries: string;
  position: number;
  datePublished: string;
  author: string;
  image: string;
  url: string;
}

interface OrganizationStructuredData {
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    email: string;
  };
}

interface WebsiteStructuredData {
  name: string;
  description: string;
  url: string;
  potentialAction: {
    target: string;
    queryInput: string;
  };
}

interface StructuredDataGeneratorProps {
  type: 'manga' | 'chapter' | 'organization' | 'website' | 'breadcrumb';
  data: any;
}

export const StructuredDataGenerator: React.FC<StructuredDataGeneratorProps> = ({ 
  type, 
  data 
}) => {
  const generateMangaSchema = (manga: MangaStructuredData) => ({
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    "name": manga.name,
    "description": manga.description,
    "author": {
      "@type": "Person",
      "name": manga.author
    },
    "genre": manga.genre,
    "datePublished": manga.datePublished,
    "dateModified": manga.dateModified,
    "image": manga.image,
    "url": manga.url,
    "aggregateRating": manga.aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": manga.aggregateRating.ratingValue,
      "reviewCount": manga.aggregateRating.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "publisher": manga.publisher ? {
      "@type": "Organization",
      "name": manga.publisher.name,
      "logo": {
        "@type": "ImageObject",
        "url": manga.publisher.logo
      }
    } : undefined,
    "mainEntity": {
      "@type": "CreativeWork",
      "name": manga.name,
      "description": manga.description
    }
  });

  const generateChapterSchema = (chapter: ChapterStructuredData) => ({
    "@context": "https://schema.org",
    "@type": "ComicIssue",
    "name": chapter.name,
    "description": chapter.description,
    "isPartOf": {
      "@type": "ComicSeries",
      "name": chapter.partOfSeries
    },
    "position": chapter.position,
    "datePublished": chapter.datePublished,
    "author": {
      "@type": "Person",
      "name": chapter.author
    },
    "image": chapter.image,
    "url": chapter.url,
    "mainEntity": {
      "@type": "CreativeWork",
      "name": chapter.name,
      "description": chapter.description
    }
  });

  const generateOrganizationSchema = (org: OrganizationStructuredData) => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": org.name,
    "description": org.description,
    "url": org.url,
    "logo": {
      "@type": "ImageObject",
      "url": org.logo
    },
    "sameAs": org.sameAs,
    "contactPoint": org.contactPoint ? {
      "@type": "ContactPoint",
      "telephone": org.contactPoint.telephone,
      "contactType": org.contactPoint.contactType,
      "email": org.contactPoint.email
    } : undefined
  });

  const generateWebsiteSchema = (website: WebsiteStructuredData) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": website.name,
    "description": website.description,
    "url": website.url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": website.potentialAction.target
      },
      "query-input": website.potentialAction.queryInput
    }
  });

  const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  });

  const getSchema = () => {
    switch (type) {
      case 'manga':
        return generateMangaSchema(data);
      case 'chapter':
        return generateChapterSchema(data);
      case 'organization':
        return generateOrganizationSchema(data);
      case 'website':
        return generateWebsiteSchema(data);
      case 'breadcrumb':
        return generateBreadcrumbSchema(data);
      default:
        return null;
    }
  };

  const schema = getSchema();

  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema, null, 2)}
      </script>
    </Helmet>
  );
};

// Helper components for common use cases
export const MangaStructuredData: React.FC<{ manga: MangaStructuredData }> = ({ manga }) => (
  <StructuredDataGenerator type="manga" data={manga} />
);

export const ChapterStructuredData: React.FC<{ chapter: ChapterStructuredData }> = ({ chapter }) => (
  <StructuredDataGenerator type="chapter" data={chapter} />
);

export const OrganizationStructuredData: React.FC<{ organization: OrganizationStructuredData }> = ({ organization }) => (
  <StructuredDataGenerator type="organization" data={organization} />
);

export const WebsiteStructuredData: React.FC<{ website: WebsiteStructuredData }> = ({ website }) => (
  <StructuredDataGenerator type="website" data={website} />
);

export const BreadcrumbStructuredData: React.FC<{ breadcrumbs: Array<{ name: string; url: string }> }> = ({ breadcrumbs }) => (
  <StructuredDataGenerator type="breadcrumb" data={breadcrumbs} />
);