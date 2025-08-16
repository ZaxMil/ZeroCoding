import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Star, Eye, Calendar, BookOpen, Download, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SeriesDetailProps {
  series: {
    id: string;
    title: string;
    author: string;
    artist?: string;
    description: string;
    cover_image: string;
    status: 'ongoing' | 'completed' | 'hiatus';
    genres: string[];
    rating: number;
    rating_count: number;
    views: number;
    likes: number;
    is_favorite: boolean;
    chapters_count: number;
    read_chapters: number;
    last_updated: string;
    publication_year: number;
    publisher?: string;
    alt_titles?: string[];
  };
  onToggleFavorite: () => void;
  onStartReading: () => void;
  onContinueReading?: () => void;
  onDownloadAll?: () => void;
  onShare?: () => void;
}

export function SeriesDetail({
  series,
  onToggleFavorite,
  onStartReading,
  onContinueReading,
  onDownloadAll,
  onShare
}: SeriesDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'hiatus': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const progressPercentage = series.chapters_count > 0 
    ? (series.read_chapters / series.chapters_count) * 100 
    : 0;

  const hasProgress = series.read_chapters > 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background Image with Overlay */}
            <div 
              className="h-64 bg-cover bg-center bg-no-repeat relative"
              style={{ backgroundImage: `url(${series.cover_image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Content Over Background */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-end gap-6">
                  {/* Cover Image */}
                  <img
                    src={series.cover_image}
                    alt={series.title}
                    className="w-32 h-44 object-cover rounded-lg shadow-xl border-2 border-white/20"
                  />
                  
                  {/* Series Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold mb-2 line-clamp-2">{series.title}</h1>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">by {series.author}</span>
                      {series.artist && series.artist !== series.author && (
                        <span className="text-sm opacity-90">Art by {series.artist}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <Badge className={`${getStatusColor(series.status)} text-white`}>
                        {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{series.rating.toFixed(1)}</span>
                        <span className="text-sm opacity-75">({series.rating_count} ratings)</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{series.views.toLocaleString()} views</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {hasProgress && onContinueReading ? (
                        <Button onClick={onContinueReading} size="lg">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Continue Reading
                        </Button>
                      ) : (
                        <Button onClick={onStartReading} size="lg">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Start Reading
                        </Button>
                      )}
                      
                      <Button
                        variant={series.is_favorite ? "default" : "outline"}
                        onClick={onToggleFavorite}
                        className={series.is_favorite ? "bg-red-500 hover:bg-red-600" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${series.is_favorite ? 'fill-current' : ''}`} />
                        {series.is_favorite ? 'Favorited' : 'Add to Favorites'}
                      </Button>
                      
                      {onDownloadAll && (
                        <Button variant="outline" onClick={onDownloadAll}>
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>
                      )}
                      
                      {onShare && (
                        <Button variant="outline" onClick={onShare}>
                          <Share className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reading Progress */}
          {hasProgress && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Reading Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{series.read_chapters} of {series.chapters_count} chapters read</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Synopsis</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {series.description}
              </p>
            </CardContent>
          </Card>

          {/* Genres */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{series.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapters:</span>
                  <span>{series.chapters_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views:</span>
                  <span>{series.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes:</span>
                  <span>{series.likes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDistanceToNow(new Date(series.last_updated), { addSuffix: true })}</span>
                </div>
                {series.publication_year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span>{series.publication_year}</span>
                  </div>
                )}
                {series.publisher && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publisher:</span>
                    <span>{series.publisher}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Titles */}
          {series.alt_titles && series.alt_titles.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Alternative Titles</h3>
                <div className="space-y-1 text-sm">
                  {series.alt_titles.map((title, index) => (
                    <div key={index} className="text-muted-foreground">
                      {title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}