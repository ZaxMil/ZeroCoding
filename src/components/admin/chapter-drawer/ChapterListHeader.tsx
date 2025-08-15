import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { RealTimeStatsHeader } from './RealTimeStatsHeader';
import { AdvancedFilterChips } from './AdvancedFilterChips';
import { useDebounce } from '@/hooks/useDebounce';

interface ChapterListHeaderProps {
  seriesTitle: string;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddChapter: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onResetFilters: () => void;
  selectedCount: number;
  onBulkAction: () => void;
}

export const ChapterListHeader: React.FC<ChapterListHeaderProps> = ({
  seriesTitle,
  totalCount,
  searchQuery,
  onSearchChange,
  onAddChapter,
  onToggleFilters,
  showFilters,
  filters,
  onFiltersChange,
  onResetFilters,
  selectedCount,
  onBulkAction
}) => {
  const debouncedSearch = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{seriesTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} chapter{totalCount !== 1 ? 's' : ''}
            {selectedCount > 0 && (
              <span className="ml-2">
                • {selectedCount} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={onBulkAction}>
              Bulk Actions ({selectedCount})
            </Button>
          )}
          <Button onClick={onAddChapter} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>
      </div>

      <RealTimeStatsHeader seriesId="" chapters={[]} />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="shrink-0"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {Object.values(filters).some(v => v !== 'any' && v !== '' && v !== undefined) && (
            <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <AdvancedFilterChips
          filters={filters}
          onRemoveFilter={(filterType: string) => {
            if (filterType === 'search') {
              onFiltersChange({ q: '' });
            } else {
              onFiltersChange({ [filterType]: 'any' });
            }
          }}
          onClearAll={onResetFilters}
        />
      )}
    </div>
  );
};