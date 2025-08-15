import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { CommentSortOption } from '@/types/comments';

interface CommentSortingProps {
  sortBy: CommentSortOption['value'];
  onSortChange: (value: CommentSortOption['value']) => void;
  className?: string;
}

const sortOptions: CommentSortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'top', label: 'Most Liked' },
  { value: 'controversial', label: 'Controversial' }
];

export function CommentSorting({ sortBy, onSortChange, className }: CommentSortingProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}