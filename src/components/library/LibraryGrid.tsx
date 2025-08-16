import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Eye, Clock, Star, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface MangaSeries {
  id: string;
  title: string;
  cover_image: string;
  author: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  chapters_count: number;
  read_chapters: number;
  last_read: string | null;
  rating: number;
  genres: string[];
  description: string;
  views: number;
  likes: number;
  is_favorite: boolean;
}

interface LibraryGridProps {
  series: MangaSeries[];
  onSeriesClick: (series: MangaSeries) => void;
  onToggleFavorite: (seriesId: string) => void;
  onRemoveFromLibrary?: (seriesId: string) => void;
  showProgress?: boolean;
}

export function LibraryGrid({ 
  series, 
  onSeriesClick, 
  onToggleFavorite, 
  onRemoveFromLibrary,
  showProgress = true 
}: LibraryGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'hiatus': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getProgressPercentage = (read: number, total: number) => {
    return total > 0 ? (read / total) * 100 : 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {series.map((manga) => (
        <Card 
          key={manga.id} 
          className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
          onClick={() => onSeriesClick(manga)}
        >
          <div className="relative">
            <img
              src={manga.cover_image}
              alt={manga.title}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            
            {/* Status Badge */}
            <Badge 
              className={`absolute top-2 left-2 ${getStatusColor(manga.status)} text-white`}
            >
              {manga.status}
            </Badge>

            {/* Favorite & More Actions */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(manga.id);
                }}
              >
                <Heart 
                  className={`h-4 w-4 ${manga.is_favorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                />
              </Button>

              {onRemoveFromLibrary && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onRemoveFromLibrary(manga.id)}>
                      Remove from Library
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Reading Progress */}
            {showProgress && manga.read_chapters > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <Progress 
                  value={getProgressPercentage(manga.read_chapters, manga.chapters_count)} 
                  className="h-1"
                />
                <p className="text-xs text-white mt-1">
                  {manga.read_chapters} / {manga.chapters_count} chapters
                </p>
              </div>
            )}
          </div>

          <CardContent className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {manga.title}
            </h3>
            
            <p className="text-xs text-muted-foreground mb-2">
              by {manga.author}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {manga.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {manga.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {manga.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-2">
              {manga.genres.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs px-1 py-0">
                  {genre}
                </Badge>
              ))}
              {manga.genres.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{manga.genres.length - 2}
                </Badge>
              )}
            </div>

            {/* Last Read */}
            {manga.last_read && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last read: {new Date(manga.last_read).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}