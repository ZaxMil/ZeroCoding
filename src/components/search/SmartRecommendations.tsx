import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LazyImage from '@/components/LazyImage';
import { Sparkles, TrendingUp, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecommendationItem {
  id: string;
  title: string;
  cover_image_url: string;
  genres: string[];
  rating: number;
  reason: string;
  type: 'trending' | 'similar' | 'popular' | 'recent';
}

interface SmartRecommendationsProps {
  searchQuery?: string;
  userHistory?: string[];
  currentGenres?: string[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  searchQuery,
  userHistory = [],
  currentGenres = []
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI-powered recommendations
    const generateRecommendations = () => {
      const mockRecommendations: RecommendationItem[] = [
        {
          id: '1',
          title: 'Attack on Titan',
          cover_image_url: 'https://picsum.photos/200/300?random=1',
          genres: ['Action', 'Drama', 'Fantasy'],
          rating: 4.8,
          reason: 'Based on your interest in action series',
          type: 'similar'
        },
        {
          id: '2',
          title: 'One Piece',
          cover_image_url: 'https://picsum.photos/200/300?random=2',
          genres: ['Adventure', 'Comedy', 'Action'],
          rating: 4.9,
          reason: 'Trending now with 15M+ views',
          type: 'trending'
        },
        {
          id: '3',
          title: 'Demon Slayer',
          cover_image_url: 'https://picsum.photos/200/300?random=3',
          genres: ['Action', 'Supernatural'],
          rating: 4.7,
          reason: 'Popular among action fans',
          type: 'popular'
        },
        {
          id: '4',
          title: 'My Hero Academia',
          cover_image_url: 'https://picsum.photos/200/300?random=4',
          genres: ['Action', 'School', 'Superhero'],
          rating: 4.6,
          reason: 'Recently updated',
          type: 'recent'
        }
      ];

      // Filter based on current context
      let filtered = mockRecommendations;
      
      if (currentGenres.length > 0) {
        filtered = filtered.filter(item => 
          item.genres.some(genre => currentGenres.includes(genre))
        );
      }

      setRecommendations(filtered);
      setLoading(false);
    };

    const timer = setTimeout(generateRecommendations, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, userHistory, currentGenres]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      case 'recent': return <Clock className="h-4 w-4" />;
      case 'popular': return <Users className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trending': return 'text-red-500';
      case 'recent': return 'text-blue-500';
      case 'popular': return 'text-green-500';
      default: return 'text-yellow-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map(item => (
            <div key={item.id} className="group">
              <Link to={`/series/${item.id}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">
                  <LazyImage
                    src={item.cover_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute top-2 right-2 ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-medium">⭐ {item.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.genres.slice(0, 2).map(genre => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {recommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available at the moment.</p>
            <p className="text-sm">Try browsing different genres or series to get personalized suggestions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};