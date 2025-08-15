import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

interface RecommendedSeries {
  id: string;
  title: string;
  genre: string;
  rating: number;
  coverImage: string;
}

interface NextRecommendedSeriesProps {
  currentGenre?: string;
  onSeriesSelect?: (seriesId: string) => void;
}

export const NextRecommendedSeries = ({ currentGenre, onSeriesSelect }: NextRecommendedSeriesProps) => {
  // Mock data - in real app would come from API
  const recommendations: RecommendedSeries[] = [
    {
      id: '1',
      title: 'Similar Adventure Series',
      genre: 'Adventure',
      rating: 4.8,
      coverImage: '/placeholder.svg'
    },
    {
      id: '2', 
      title: 'Trending Now',
      genre: 'Action',
      rating: 4.6,
      coverImage: '/placeholder.svg'
    },
    {
      id: '3',
      title: 'Editor\'s Pick',
      genre: currentGenre || 'Fantasy',
      rating: 4.9,
      coverImage: '/placeholder.svg'
    }
  ];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          What to Read Next
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((series) => (
            <div key={series.id} className="group cursor-pointer" onClick={() => onSeriesSelect?.(series.id)}>
              <div className="aspect-[3/4] bg-muted rounded-lg mb-2 overflow-hidden">
                <img 
                  src={series.coverImage} 
                  alt={series.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h4 className="font-medium truncate">{series.title}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{series.rating}</span>
                <span>•</span>
                <span>{series.genre}</span>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline">
          See More Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};