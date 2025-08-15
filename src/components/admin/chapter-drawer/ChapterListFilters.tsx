import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Filters } from '@/hooks/useChapterAdminList';

interface ChapterListFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onResetFilters: () => void;
  chapterRange: [number, number];
  onChapterRangeChange: (range: [number, number]) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  viewRange: number[];
  onViewRangeChange: (range: number[]) => void;
  priceRange: number[];
  onPriceRangeChange: (range: number[]) => void;
}

export const ChapterListFilters: React.FC<ChapterListFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
  chapterRange,
  onChapterRangeChange,
  dateRange,
  onDateRangeChange,
  viewRange,
  onViewRangeChange,
  priceRange,
  onPriceRangeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ status: value as Filters['status'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Status</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price</Label>
        <Select
          value={filters.price}
          onValueChange={(value) => onFiltersChange({ price: value as Filters['price'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Price</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Published</Label>
        <Select
          value={filters.published}
          onValueChange={(value) => onFiltersChange({ published: value as Filters['published'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Chapter Range</Label>
        <div className="px-2">
          <Slider
            value={chapterRange}
            onValueChange={onChapterRangeChange}
            max={999}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>#{chapterRange[0]}</span>
            <span>#{chapterRange[1]}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange.from ? format(dateRange.from, 'MMM d') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CalendarComponent
                selected={dateRange.from}
                onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
                mode="single"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange.to ? format(dateRange.to, 'MMM d') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CalendarComponent
                selected={dateRange.to}
                onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
                mode="single"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Sales</Label>
        <Select
          value={filters.sales}
          onValueChange={(value) => onFiltersChange({ sales: value as Filters['sales'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Sales</SelectItem>
            <SelectItem value="none">No Sales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Views</Label>
        <Select
          value={filters.views}
          onValueChange={(value) => onFiltersChange({ views: value as Filters['views'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Views</SelectItem>
            <SelectItem value="none">No Views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price Range (Coins)</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={onPriceRangeChange}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{priceRange[0]} coins</span>
            <span>{priceRange[1]} coins</span>
          </div>
        </div>
      </div>

      <div className="flex items-end">
        <Button onClick={onResetFilters} variant="outline" size="sm" className="w-full">
          <X className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};