import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterChip {
  key: string;
  label: string;
  value: string;
  type: 'status' | 'publish' | 'price' | 'sales' | 'views';
}

interface AdvancedFilterChipsProps {
  filters: {
    status: string;
    published: string;
    price: string;
    sales: string;
    views: string;
    q: string;
  };
  onRemoveFilter: (filterType: string) => void;
  onClearAll: () => void;
}

export const AdvancedFilterChips = ({ 
  filters, 
  onRemoveFilter, 
  onClearAll 
}: AdvancedFilterChipsProps) => {
  const activeFilters: FilterChip[] = [];

  // Add active filters to the array
  if (filters.status !== 'any') {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: filters.status === 'locked' ? 'Locked' : 'Free',
      type: 'status'
    });
  }

  if (filters.published !== 'any') {
    activeFilters.push({
      key: 'published',
      label: 'Published',
      value: filters.published === 'published' ? 'Published' : 'Scheduled',
      type: 'publish'
    });
  }

  if (filters.price !== 'any') {
    activeFilters.push({
      key: 'price',
      label: 'Price',
      value: filters.price === 'free' ? 'Free' : 'Paid',
      type: 'price'
    });
  }

  if (filters.sales !== 'any') {
    activeFilters.push({
      key: 'sales',
      label: 'Sales',
      value: filters.sales === 'none' ? 'No Sales' : 'Has Sales',
      type: 'sales'
    });
  }

  if (filters.views !== 'any') {
    activeFilters.push({
      key: 'views',
      label: 'Views',
      value: filters.views === 'none' ? 'No Views' : 'Has Views',
      type: 'views'
    });
  }

  if (filters.q.trim()) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: filters.q.trim(),
      type: 'status' // Using status as default type for search
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  const getChipVariant = (type: FilterChip['type']) => {
    switch (type) {
      case 'status':
        return 'default';
      case 'publish':
        return 'secondary';
      case 'price':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-lg border">
      <span className="text-sm text-muted-foreground font-medium">Filters:</span>
      
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant={getChipVariant(filter.type)}
          className="flex items-center gap-1 pr-1"
        >
          <span className="text-xs">
            <span className="font-medium">{filter.label}:</span> {filter.value}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-auto p-0.5 ml-1 hover:bg-background/50"
            onClick={() => onRemoveFilter(filter.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};