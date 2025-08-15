import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChapterFavoritesProps {
  chapterId: string;
  className?: string;
}

export const ChapterFavorites = ({ chapterId, className }: ChapterFavoritesProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('manga_favorites') || '[]');
    setIsFavorite(favorites.includes(chapterId));
  }, [chapterId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('manga_favorites') || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((id: string) => id !== chapterId)
      : [...favorites, chapterId];
    
    localStorage.setItem('manga_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Chapter removed from your library" : "Chapter saved to your library",
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFavorite}
      className={className}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
      />
      <span className="ml-2">{isFavorite ? 'Favorited' : 'Favorite'}</span>
    </Button>
  );
};