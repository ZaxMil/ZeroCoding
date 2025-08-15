import { useState, useEffect } from 'react';
import { Heart, Star, ArrowRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LazyImage from '@/components/LazyImage';

interface SimilarSeries {
  id: string;
  title: string;
  genre: string[];
  rating: number;
  coverImage: string;
  description: string;
  chapters: number;
  status: 'ongoing' | 'completed';
  similarity: number;
}

interface YouMayLikePopupProps {
  currentSeriesId: string;
  currentGenres?: string[];
  onSeriesSelect: (seriesId: string) => void;
  onClose: () => void;
}

export const YouMayLikePopup = ({ 
  currentSeriesId, 
  currentGenres = [], 
  onSeriesSelect, 
  onClose 
}: YouMayLikePopupProps) => {
  const [recommendations, setRecommendations] = useState<SimilarSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<SimilarSeries | null>(null);

  useEffect(() => {
    // Generate recommendations based on current series
    const mockRecommendations: SimilarSeries[] = [
      {
        id: 'rec-1',
        title: 'Adventures Beyond',
        genre: ['Adventure', 'Fantasy'],
        rating: 4.8,
        coverImage: '/placeholder.svg',
        description: 'An epic journey through mystical lands filled with ancient magic and legendary creatures.',
        chapters: 120,
        status: 'ongoing',
        similarity: 95
      },
      {
        id: 'rec-2',
        title: 'Magic Academy Chronicles',
        genre: ['Fantasy', 'School Life'],
        rating: 4.6,
        coverImage: '/placeholder.svg',
        description: 'Young mages learn to control their powers in this prestigious magical academy.',
        chapters: 85,
        status: 'ongoing',
        similarity: 87
      },
      {
        id: 'rec-3',
        title: 'Dragon Slayer Legend',
        genre: ['Action', 'Adventure'],
        rating: 4.9,
        coverImage: '/placeholder.svg',
        description: 'A legendary warrior\'s quest to defeat the ancient dragons threatening the realm.',
        chapters: 200,
        status: 'completed',
        similarity: 82
      }
    ];

    // Sort by similarity and user reading history
    const sortedRecommendations = mockRecommendations
      .filter(series => series.id !== currentSeriesId)
      .sort((a, b) => b.similarity - a.similarity);

    setRecommendations(sortedRecommendations);
  }, [currentSeriesId, currentGenres]);

  const handleSeriesClick = (series: SimilarSeries) => {
    setSelectedSeries(series);
  };

  const handleStartReading = () => {
    if (selectedSeries) {
      onSeriesSelect(selectedSeries.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              You May Also Like
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 h-[60vh]">
            {/* Recommendations List */}
            <div className="p-4 overflow-y-auto border-r">
              <p className="text-sm text-muted-foreground mb-4">
                Based on your reading preferences and similar series
              </p>
              
              <div className="space-y-3">
                {recommendations.map((series) => (
                  <div
                    key={series.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSeries?.id === series.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSeriesClick(series)}
                  >
                    <div className="flex gap-3">
                      <div className="w-12 aspect-[3/4] bg-muted rounded overflow-hidden flex-shrink-0">
                        <LazyImage
                          src={series.coverImage}
                          alt={series.title}
                          className="w-full h-full object-cover"
                          width={48}
                          height={64}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{series.title}</h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{series.rating}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {series.similarity}% match
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {series.genre.slice(0, 2).map(genre => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {series.chapters} chapters • {series.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Series Details */}
            <div className="p-4 overflow-y-auto">
              {selectedSeries ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-32 aspect-[3/4] mx-auto bg-muted rounded-lg overflow-hidden mb-3">
                      <LazyImage
                        src={selectedSeries.coverImage}
                        alt={selectedSeries.title}
                        className="w-full h-full object-cover"
                        width={128}
                        height={170}
                      />
                    </div>
                    <h3 className="text-xl font-bold">{selectedSeries.title}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selectedSeries.rating}</span>
                      </div>
                      <Badge variant="default">
                        {selectedSeries.similarity}% match
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedSeries.genre.map(genre => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      {selectedSeries.chapters} chapters • {selectedSeries.status}
                    </div>

                    <p className="text-sm leading-relaxed">
                      {selectedSeries.description}
                    </p>

                    <div className="space-y-2 pt-4">
                      <Button onClick={handleStartReading} className="w-full">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start Reading
                      </Button>
                      <Button variant="outline" className="w-full">
                        Add to Library
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a series to see details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for generating recommendations
export const useRecommendations = (seriesId: string, genres: string[] = []) => {
  const [recommendations, setRecommendations] = useState<SimilarSeries[]>([]);

  useEffect(() => {
    // In a real app, this would call an API with ML recommendations
    const generateRecommendations = () => {
      // Mock recommendation logic based on genres and reading history
      const readingHistory = JSON.parse(localStorage.getItem('manga_reading_history') || '[]');
      const favorites = JSON.parse(localStorage.getItem('manga_favorites') || '[]');
      
      // Generate recommendations based on user data
      const mockRecs: SimilarSeries[] = [
        // ... generate based on user preferences
      ];
      
      setRecommendations(mockRecs);
    };

    if (seriesId) {
      generateRecommendations();
    }
  }, [seriesId, genres]);

  return { recommendations };
};

// Hook for tracking recommendation interactions
export const useRecommendationAnalytics = () => {
  const trackRecommendationView = (seriesId: string, recommendedSeriesId: string) => {
    const analytics = JSON.parse(localStorage.getItem('manga_recommendation_analytics') || '[]');
    analytics.push({
      timestamp: Date.now(),
      action: 'view',
      sourceSeriesId: seriesId,
      recommendedSeriesId,
    });
    localStorage.setItem('manga_recommendation_analytics', JSON.stringify(analytics));
  };

  const trackRecommendationClick = (seriesId: string, recommendedSeriesId: string) => {
    const analytics = JSON.parse(localStorage.getItem('manga_recommendation_analytics') || '[]');
    analytics.push({
      timestamp: Date.now(),
      action: 'click',
      sourceSeriesId: seriesId,
      recommendedSeriesId,
    });
    localStorage.setItem('manga_recommendation_analytics', JSON.stringify(analytics));
  };

  return { trackRecommendationView, trackRecommendationClick };
};