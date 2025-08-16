import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

interface LibraryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  genreFilter: string[];
  onGenreFilterChange: (genres: string[]) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  availableGenres: string[];
}

export function LibraryFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  genreFilter,
  onGenreFilterChange,
  viewMode,
  onViewModeChange,
  availableGenres
}: LibraryFiltersProps) {
  const statusOptions = ['ongoing', 'completed', 'hiatus'];
  const sortOptions = [
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'rating_desc', label: 'Highest Rated' },
    { value: 'rating_asc', label: 'Lowest Rated' },
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'added_desc', label: 'Recently Added' },
    { value: 'progress_desc', label: 'Most Progress' },
    { value: 'progress_asc', label: 'Least Progress' }
  ];

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusFilterChange([]);
    onGenreFilterChange([]);
    onSortChange('title_asc');
  };

  const hasActiveFilters = searchQuery || statusFilter.length > 0 || genreFilter.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Status
              {statusFilter.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {statusFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statusOptions.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onStatusFilterChange([...statusFilter, status]);
                  } else {
                    onStatusFilterChange(statusFilter.filter(s => s !== status));
                  }
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Genre Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Genres
              {genreFilter.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {genreFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 overflow-y-auto">
            {availableGenres.map(genre => (
              <DropdownMenuCheckboxItem
                key={genre}
                checked={genreFilter.includes(genre)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onGenreFilterChange([...genreFilter, genre]);
                  } else {
                    onGenreFilterChange(genreFilter.filter(g => g !== genre));
                  }
                }}
              >
                {genre}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {statusFilter.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onStatusFilterChange(statusFilter.filter(s => s !== status))}
              />
            </Badge>
          ))}
          
          {genreFilter.map(genre => (
            <Badge key={genre} variant="secondary" className="gap-1">
              {genre}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onGenreFilterChange(genreFilter.filter(g => g !== genre))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}