import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface SearchFilters {
  genres: string[];
  status: string;
  rating: number[];
  year: number[];
  author: string;
  sortBy: string;
}

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural'
];

const statusOptions = ['All', 'Ongoing', 'Completed', 'Hiatus', 'Cancelled'];
const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'alphabetical', label: 'A-Z' }
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter(g => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const hasActiveFilters = filters.genres.length > 0 || 
    filters.status !== 'All' || 
    filters.rating[0] > 0 || 
    filters.year[0] > 2000 || 
    filters.author.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Genres */}
        <div>
          <label className="text-sm font-medium mb-3 block">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <Badge
                key={genre}
                variant={filters.genres.includes(genre) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium mb-3 block">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Rating: {filters.rating[0]} - {filters.rating[1]} stars
          </label>
          <Slider
            value={filters.rating}
            onValueChange={(value) => onFiltersChange({ ...filters, rating: value })}
            max={5}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Publication Year */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Year: {filters.year[0]} - {filters.year[1]}
          </label>
          <Slider
            value={filters.year}
            onValueChange={(value) => onFiltersChange({ ...filters, year: value })}
            max={2024}
            min={2000}
            step={1}
            className="w-full"
          />
        </div>

        {/* Author */}
        <div>
          <label className="text-sm font-medium mb-3 block">Author</label>
          <Input
            value={filters.author}
            onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
            placeholder="Search by author name..."
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="text-sm font-medium mb-3 block">Sort By</label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};