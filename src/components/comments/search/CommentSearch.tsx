import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Calendar, User, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string;
  reactions: Array<{ type: string; count: number }>;
  replies_count: number;
  is_edited: boolean;
  is_pinned: boolean;
  is_highlighted: boolean;
}

interface SearchFilters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  authors: string[];
  hasReplies: boolean | null;
  hasReactions: boolean | null;
  isEdited: boolean | null;
  isPinned: boolean | null;
  sortBy: 'newest' | 'oldest' | 'most_replies' | 'most_reactions' | 'relevance';
  contentType: 'all' | 'with_media' | 'text_only';
}

interface CommentSearchProps {
  comments: Comment[];
  onSearchResults: (results: Comment[]) => void;
  placeholder?: string;
  className?: string;
}

export const CommentSearch: React.FC<CommentSearchProps> = ({
  comments,
  onSearchResults,
  placeholder = "Search comments...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: {},
    authors: [],
    hasReplies: null,
    hasReactions: null,
    isEdited: null,
    isPinned: null,
    sortBy: 'newest',
    contentType: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique authors for filter dropdown
  const uniqueAuthors = useMemo(() => {
    const authorsMap = new Map();
    comments.forEach(comment => {
      if (!authorsMap.has(comment.author.id)) {
        authorsMap.set(comment.author.id, comment.author);
      }
    });
    return Array.from(authorsMap.values());
  }, [comments]);

  // Filter and search logic
  const filteredComments = useMemo(() => {
    let results = comments.filter(comment => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contentMatch = comment.content.toLowerCase().includes(query);
        const authorMatch = comment.author.name.toLowerCase().includes(query);
        if (!contentMatch && !authorMatch) return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const commentDate = new Date(comment.created_at);
        if (filters.dateRange.from && commentDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && commentDate > filters.dateRange.to) return false;
      }

      // Author filter
      if (filters.authors.length > 0 && !filters.authors.includes(comment.author.id)) {
        return false;
      }

      // Boolean filters
      if (filters.hasReplies !== null) {
        const hasReplies = comment.replies_count > 0;
        if (filters.hasReplies !== hasReplies) return false;
      }

      if (filters.hasReactions !== null) {
        const hasReactions = comment.reactions.some(r => r.count > 0);
        if (filters.hasReactions !== hasReactions) return false;
      }

      if (filters.isEdited !== null && filters.isEdited !== comment.is_edited) {
        return false;
      }

      if (filters.isPinned !== null && filters.isPinned !== comment.is_pinned) {
        return false;
      }

      return true;
    });

    // Sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'most_replies':
          return b.replies_count - a.replies_count;
        case 'most_reactions':
          const aReactions = a.reactions.reduce((sum, r) => sum + r.count, 0);
          const bReactions = b.reactions.reduce((sum, r) => sum + r.count, 0);
          return bReactions - aReactions;
        case 'relevance':
          // Simple relevance scoring based on search query
          if (!searchQuery) return 0;
          const query = searchQuery.toLowerCase();
          const aScore = (a.content.toLowerCase().includes(query) ? 1 : 0) + 
                        (a.author.name.toLowerCase().includes(query) ? 0.5 : 0);
          const bScore = (b.content.toLowerCase().includes(query) ? 1 : 0) + 
                        (b.author.name.toLowerCase().includes(query) ? 0.5 : 0);
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return results;
  }, [comments, searchQuery, filters]);

  // Update results when filters change
  useEffect(() => {
    onSearchResults(filteredComments);
  }, [filteredComments, onSearchResults]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      dateRange: {},
      authors: [],
      hasReplies: null,
      hasReactions: null,
      isEdited: null,
      isPinned: null,
      sortBy: 'newest',
      contentType: 'all'
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v != null);
    }
    return value !== null && value !== 'newest' && value !== 'all';
  }).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Comment Search
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredComments.length} results
            </Badge>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} filters
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="most_replies">Most replies</SelectItem>
              <SelectItem value="most_reactions">Most reactions</SelectItem>
              <SelectItem value="relevance">Most relevant</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="flex gap-2">
                  <DatePicker
                    date={filters.dateRange.from}
                    onDateChange={(date) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, from: date } 
                    }))}
                    placeholder="From date"
                  />
                  <DatePicker
                    date={filters.dateRange.to}
                    onDateChange={(date) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, to: date } 
                    }))}
                    placeholder="To date"
                  />
                </div>
              </div>

              <Separator />

              {/* Authors */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authors</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uniqueAuthors.map(author => (
                    <div key={author.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`author-${author.id}`}
                        checked={filters.authors.includes(author.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters(prev => ({ 
                              ...prev, 
                              authors: [...prev.authors, author.id] 
                            }));
                          } else {
                            setFilters(prev => ({ 
                              ...prev, 
                              authors: prev.authors.filter(id => id !== author.id) 
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`author-${author.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {author.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Boolean Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Filters</Label>
                
                {[
                  { key: 'hasReplies', label: 'Has replies' },
                  { key: 'hasReactions', label: 'Has reactions' },
                  { key: 'isEdited', label: 'Is edited' },
                  { key: 'isPinned', label: 'Is pinned' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Select
                      value={filters[key as keyof SearchFilters] === null ? 'any' : 
                             filters[key as keyof SearchFilters] ? 'yes' : 'no'}
                      onValueChange={(value) => {
                        const boolValue = value === 'any' ? null : value === 'yes';
                        setFilters(prev => ({ ...prev, [key]: boolValue }));
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Separator />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Search Stats */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''} 
            {searchQuery && ` for "${searchQuery}"`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};