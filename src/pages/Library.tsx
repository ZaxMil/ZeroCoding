import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibraryGrid } from '@/components/library/LibraryGrid';
import { LibraryFilters } from '@/components/library/LibraryFilters';
import { SeriesDetail } from '@/components/library/SeriesDetail';
import { ChapterList } from '@/components/library/ChapterList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data - in real app this would come from Supabase
const mockSeries = [
  {
    id: '1',
    title: 'Attack on Titan',
    author: 'Hajime Isayama',
    artist: 'Hajime Isayama',
    cover_image: '/placeholder.svg',
    status: 'completed' as const,
    chapters_count: 139,
    read_chapters: 45,
    last_read: '2024-01-15',
    rating: 9.2,
    rating_count: 25840,
    views: 1250000,
    likes: 89500,
    is_favorite: true,
    genres: ['Action', 'Drama', 'Fantasy', 'Military'],
    description: 'Humanity fights for survival against giant humanoid Titans that have brought civilization to the brink of extinction.',
    last_updated: '2021-04-09',
    publication_year: 2009,
    publisher: 'Kodansha',
    alt_titles: ['Shingeki no Kyojin', 'SnK']
  },
  {
    id: '2',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    cover_image: '/placeholder.svg',
    status: 'ongoing' as const,
    chapters_count: 1100,
    read_chapters: 0,
    last_read: null,
    rating: 9.5,
    rating_count: 45680,
    views: 2800000,
    likes: 156000,
    is_favorite: false,
    genres: ['Action', 'Adventure', 'Comedy', 'Shounen'],
    description: 'Follow Monkey D. Luffy and his crew as they search for the ultimate treasure known as One Piece.',
    last_updated: '2024-01-12',
    publication_year: 1997,
    publisher: 'Shueisha'
  },
  {
    id: '3',
    title: 'Demon Slayer',
    author: 'Koyoharu Gotouge',
    cover_image: '/placeholder.svg',
    status: 'completed' as const,
    chapters_count: 205,
    read_chapters: 205,
    last_read: '2023-12-20',
    rating: 8.8,
    rating_count: 38920,
    views: 1800000,
    likes: 125000,
    is_favorite: true,
    genres: ['Action', 'Historical', 'Supernatural', 'Shounen'],
    description: 'A young boy becomes a demon slayer to save his sister and avenge his family.',
    last_updated: '2020-05-18',
    publication_year: 2016,
    publisher: 'Shueisha',
    alt_titles: ['Kimetsu no Yaiba', 'KnY']
  }
];

const mockChapters = [
  {
    id: '1',
    number: 1,
    title: 'To You, 2000 Years From Now',
    pages: 45,
    upload_date: '2024-01-01',
    views: 125000,
    is_read: true,
    read_progress: 100,
    reading_time: 12,
    file_size: 25600000,
    file_url: '/placeholder.pdf'
  },
  {
    id: '2',
    number: 2,
    title: 'That Day',
    pages: 42,
    upload_date: '2024-01-02',
    views: 98000,
    is_read: true,
    read_progress: 100,
    reading_time: 11,
    file_size: 23400000,
    file_url: '/placeholder.pdf'
  },
  {
    id: '3',
    number: 3,
    title: 'A Dim Light in the Darkness of Despair',
    pages: 48,
    upload_date: '2024-01-03',
    views: 89000,
    is_read: false,
    read_progress: 65,
    reading_time: 13,
    file_size: 27800000,
    file_url: '/placeholder.pdf'
  }
];

type ViewMode = 'library' | 'series' | 'chapters';

export default function Library() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title_asc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get available genres from series
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    mockSeries.forEach(series => {
      series.genres.forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, []);

  // Filter and sort series
  const filteredSeries = useMemo(() => {
    let filtered = mockSeries.filter(series => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = series.title.toLowerCase().includes(query);
        const matchesAuthor = series.author.toLowerCase().includes(query);
        const matchesGenre = series.genres.some(genre => 
          genre.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesAuthor && !matchesGenre) return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(series.status)) {
        return false;
      }

      // Genre filter
      if (genreFilter.length > 0 && !genreFilter.some(genre => 
        series.genres.includes(genre)
      )) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'rating_desc': return b.rating - a.rating;
        case 'rating_asc': return a.rating - b.rating;
        case 'updated_desc': return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        case 'progress_desc': return b.read_chapters - a.read_chapters;
        case 'progress_asc': return a.read_chapters - b.read_chapters;
        default: return 0;
      }
    });

    return filtered;
  }, [searchQuery, sortBy, statusFilter, genreFilter]);

  const currentSeries = selectedSeries ? mockSeries.find(s => s.id === selectedSeries) : null;

  // Handlers
  const handleSeriesClick = (series: any) => {
    setSelectedSeries(series.id);
    setCurrentView('series');
  };

  const handleToggleFavorite = (seriesId: string) => {
    toast({
      title: "Favorite Updated",
      description: "Series added to/removed from favorites"
    });
  };

  const handleStartReading = () => {
    if (currentSeries) {
      navigate(`/read/${currentSeries.id}/1`);
    }
  };

  const handleContinueReading = () => {
    if (currentSeries) {
      const nextChapter = currentSeries.read_chapters + 1;
      navigate(`/read/${currentSeries.id}/${nextChapter}`);
    }
  };

  const handleViewChapters = () => {
    setCurrentView('chapters');
  };

  const handleChapterClick = (chapter: any) => {
    if (currentSeries) {
      navigate(`/read/${currentSeries.id}/${chapter.number}`);
    }
  };

  const handleBackToLibrary = () => {
    setCurrentView('library');
    setSelectedSeries(null);
  };

  const handleBackToSeries = () => {
    setCurrentView('series');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentView !== 'library' && (
            <Button
              variant="ghost"
              onClick={currentView === 'chapters' ? handleBackToSeries : handleBackToLibrary}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div>
            <h1 className="text-3xl font-bold">
              {currentView === 'library' && 'My Library'}
              {currentView === 'series' && currentSeries?.title}
              {currentView === 'chapters' && `${currentSeries?.title} - Chapters`}
            </h1>
            {currentView === 'library' && (
              <p className="text-muted-foreground">
                {filteredSeries.length} series in your library
              </p>
            )}
          </div>
        </div>

        {currentView === 'library' && (
          <Button onClick={() => navigate('/browse')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Series
          </Button>
        )}
      </div>

      {/* Content */}
      {currentView === 'library' && (
        <>
          <LibraryFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            genreFilter={genreFilter}
            onGenreFilterChange={setGenreFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            availableGenres={availableGenres}
          />

          <LibraryGrid
            series={filteredSeries}
            onSeriesClick={handleSeriesClick}
            onToggleFavorite={handleToggleFavorite}
            showProgress={true}
          />
        </>
      )}

      {currentView === 'series' && currentSeries && (
        <>
          <SeriesDetail
            series={currentSeries}
            onToggleFavorite={() => handleToggleFavorite(currentSeries.id)}
            onStartReading={handleStartReading}
            onContinueReading={currentSeries.read_chapters > 0 ? handleContinueReading : undefined}
          />
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Chapters</h2>
            <Button variant="outline" onClick={handleViewChapters}>
              View All Chapters
            </Button>
          </div>
          
          <ChapterList
            chapters={mockChapters.slice(0, 5)}
            onChapterClick={handleChapterClick}
            compact={true}
          />
        </>
      )}

      {currentView === 'chapters' && currentSeries && (
        <ChapterList
          chapters={mockChapters}
          onChapterClick={handleChapterClick}
          onMarkAsRead={(chapterId) => toast({ title: "Marked as read" })}
          onDownload={(chapter) => toast({ title: `Downloading ${chapter.title}` })}
        />
      )}
    </div>
  );
}