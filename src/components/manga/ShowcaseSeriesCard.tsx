import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, Eye } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { getOptimizedImageUrl, getFallbackCoverImage } from '@/utils/imageOptimization';

interface SeriesCardData {
  id: string;
  title: string;
  cover_image_url?: string;
  status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | string;
  description?: string;
  author?: string;
  rating_average?: number;
  view_count?: number;
  chapter_count?: number;
  genres?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ShowcaseSeriesCardProps {
  series: SeriesCardData;
  className?: string;
}

export const ShowcaseSeriesCard = ({ series, className = '' }: ShowcaseSeriesCardProps) => {
  const optimizedCoverUrl = getOptimizedImageUrl(
    series.cover_image_url || getFallbackCoverImage(series.id),
    400,
    533
  );

  const statusLabel = (series.status || '').toString();

  const navigate = useNavigate();
  return (
    <Card
      className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl ${className}`}
    >
      <div
        role="link"
        tabIndex={0}
        aria-label={`View series ${series.title}`}
        onClick={() => navigate(`/series/${series.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/series/${series.id}`);
          }
        }}
        className="block h-full cursor-pointer"
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <LazyImage
            src={optimizedCoverUrl}
            alt={`${series.title} cover`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            width={400}
            height={533}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Top overlays */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {/* Status */}
            {statusLabel && (
              <Badge variant="secondary" className="uppercase tracking-wide text-[10px] font-semibold">
                {statusLabel}
              </Badge>
            )}
            {/* Rating */}
            {typeof series.rating_average === 'number' && (
              <div className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-xs text-foreground shadow">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span>{series.rating_average.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Bottom gradient and CTA */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent p-3">
            <div className="translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                View Series
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3 sm:p-4 space-y-2">
          {/* Title */}
          <h3
            className="line-clamp-2 font-bold text-sm sm:text-base md:text-lg group-hover:text-primary transition-colors"
            title={series.title}
          >
            {series.title}
          </h3>

          {/* Author */}
          {series.author && (
            <p className="text-xs sm:text-sm text-muted-foreground">by {series.author}</p>
          )}

          {/* Genres */}
          {Array.isArray(series.genres) && series.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {series.genres.slice(0, 3).map((g) => (
                <Link
                  key={g}
                  to={`/series?genre=${encodeURIComponent(g)}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Filter by genre ${g}`}
                  className="inline-block"
                >
                  <Badge variant="outline" className="text-[10px]">
                    {g}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{series.chapter_count ?? 0} ch</span>
            </div>
            <div className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{(series.view_count ?? 0).toLocaleString()} views</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
