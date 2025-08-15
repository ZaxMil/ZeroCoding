import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { Eye, Edit3, ExternalLink, Plus, Trash2, Search, SortAsc, TrendingUp, Calendar, DollarSign, Users, Lock, Unlock, Globe, FileText, Copy, Check, X, Filter, ChevronDown, Settings, Archive, GripVertical, ImageIcon, StickyNote, History, Clock, User } from 'lucide-react';
import { DragDropReorder } from './chapter-drawer/DragDropReorder';
import { ChapterCoverUpload } from './chapter-drawer/ChapterCoverUpload';
import { ChapterSEOEditor } from './chapter-drawer/ChapterSEOEditor';
import { VersionHistoryViewer } from './chapter-drawer/VersionHistoryViewer';
import { ChapterStatsChart } from './chapter-drawer/ChapterStatsChart';
import { ChapterCloner } from './chapter-drawer/ChapterCloner';
import { ExportToCSV } from './chapter-drawer/ExportToCSV';
import { MobileEditorFAB } from './chapter-drawer/MobileEditorFAB';
import { AdminNotesEditor } from './chapter-drawer/AdminNotesEditor';
import { LockReasonEditor } from './chapter-drawer/LockReasonEditor';
import { ChapterAuditLog } from './chapter-drawer/ChapterAuditLog';
import { AutoLockScheduler } from './chapter-drawer/AutoLockScheduler';
import { ThumbnailPreview } from './chapter-drawer/ThumbnailPreview';
import { QuickChapterDuplicate } from './chapter-drawer/QuickChapterDuplicate';
import { AdvancedFilterChips } from './chapter-drawer/AdvancedFilterChips';
import { RealTimeStatsHeader } from './chapter-drawer/RealTimeStatsHeader';
import { ChapterEditor } from '@/components/admin/ChapterEditor';
import { useChapterAdminList } from '@/hooks/useChapterAdminList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSeriesChapterListMode } from '@/hooks/useSeriesChapterListMode';

interface SeriesChaptersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  seriesTitle: string;
}

interface ChapterRow {
  id: string;
  chapter_number: number;
  title: string | null;
  release_date: string;
  is_locked: boolean;
  coin_cost: number | null;
  sales: number;
  views: number;
  lock_reason?: string | null;
  lock_after?: string | null;
  unlock_after?: string | null;
  thumbnail_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  notes_admin?: string | null;
}

export const SeriesChaptersDrawer = ({ open, onOpenChange, seriesId, seriesTitle }: SeriesChaptersDrawerProps) => {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<ChapterRow | null>(null);
  const [summary, setSummary] = useState({ totalChapters: 0, totalViews: 0, totalSales: 0, avgPrice: 0 });
  
  // Bulk Actions State
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'publish' | 'unpublish' | 'lock' | 'unlock' | 'price' | null>(null);
  const [bulkPrice, setBulkPrice] = useState(0);
  
  // Extended Filters State
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);
  const [chapterRange, setChapterRange] = useState<[number, number]>([1, 999]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [viewRange, setViewRange] = useState<number[]>([0]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100]);
  
  // Quick Edit State
  const [quickEditDialogOpen, setQuickEditDialogOpen] = useState(false);
  const [quickEditChapter, setQuickEditChapter] = useState<ChapterRow | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState('');
  
  // Saved Views State
  const [savedViews, setSavedViews] = useState<Array<{name: string, filters: any, sort: any}>>([]);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  
  // Copy link state
  const [copiedChapterId, setCopiedChapterId] = useState<string | null>(null);

  const list = useChapterAdminList(seriesId, open);
  const { mode: chapterListMode } = useSeriesChapterListMode();

  const notifyChaptersUpdated = () => {
    try {
      window.dispatchEvent(new CustomEvent('chapters:updated', { detail: { seriesId } }));
    } catch (e) {
      console.warn('Failed to dispatch chapters:updated event', e);
    }
  };

useEffect(() => {
  if (open) list.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, seriesId]);

  // Calculate summary stats
  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chapter-views-${seriesId}`);
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load saved views', e);
      }
    }
  }, [seriesId]);

  useEffect(() => {
    const totalChapters = list.totalCount;
    const totalViews = list.rows.reduce((sum, row) => sum + row.views, 0);
    const totalSales = list.rows.reduce((sum, row) => sum + row.sales, 0);
    const paidChapters = list.rows.filter(row => row.coin_cost > 0);
    const avgPrice = paidChapters.length > 0 
      ? paidChapters.reduce((sum, row) => sum + row.coin_cost, 0) / paidChapters.length 
      : 0;
    
    setSummary({ totalChapters, totalViews, totalSales, avgPrice });
  }, [list.rows, list.totalCount]);

  // Clear selection when drawer closes
  useEffect(() => {
    if (!open) {
      setSelectedChapters(new Set());
    }
  }, [open]);

  const onUpdateChapter = async (id: string, patch: Partial<ChapterRow>) => {
    try {
      // Optimistic
      list.applyLocalUpdate(id, patch as any);
      if (patch.title !== undefined || patch.is_locked !== undefined || patch.release_date !== undefined) {
        const { error } = await supabase
          .from('chapters')
          .update({
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.is_locked !== undefined ? { is_locked: patch.is_locked } : {}),
            ...(patch.release_date !== undefined ? { release_date: patch.release_date } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: 'Chapter updated' });
      notifyChaptersUpdated();
    } catch (e) {
      console.error('Update failed', e);
      toast({ title: 'Error', description: 'Failed to update chapter', variant: 'destructive' });
      // Soft refresh to restore server truth
      list.refresh();
    }
  };
  const onUpdatePrice = async (id: string, coin_cost: number) => {
    try {
      // Optimistic
      list.applyLocalUpdate(id, { coin_cost } as any);
      const { error } = await supabase
        .from('chapter_prices')
        .upsert({ chapter_id: id, coin_cost, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Price updated' });
      notifyChaptersUpdated();
    } catch (e) {
      console.error('Price update failed', e);
      toast({ title: 'Error', description: 'Failed to update price', variant: 'destructive' });
      list.refresh();
    }
  };
  const startEdit = (row: ChapterRow) => {
    setEditingChapter({
      id: row.id,
      title: row.title || '',
      chapter_number: row.chapter_number,
      sort_order: row.chapter_number,
      is_locked: row.is_locked,
      page_count: 0,
      release_date: row.release_date,
    });
    // Close the drawer to avoid stacked overlays on mobile
    onOpenChange(false);
    setEditorOpen(true);
  };

  const startNewChapter = () => {
    const nextChapterNumber = Math.max(...list.rows.map(r => r.chapter_number), 0) + 1;
    setEditingChapter({
      id: null,
      title: `Chapter ${nextChapterNumber}`,
      chapter_number: nextChapterNumber,
      sort_order: nextChapterNumber,
      is_locked: false,
      page_count: 0,
      release_date: new Date().toISOString().split('T')[0],
      series_id: seriesId,
    });
    onOpenChange(false);
    setEditorOpen(true);
  };

  const startDelete = (row: ChapterRow) => {
    setChapterToDelete(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!chapterToDelete) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterToDelete.id);
      
      if (error) throw error;
      
      toast({ title: 'Deleted', description: 'Chapter deleted successfully' });
      list.refresh();
      notifyChaptersUpdated();
    } catch (e) {
      console.error('Delete failed', e);
      toast({ title: 'Error', description: 'Failed to delete chapter', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

  const togglePublishStatus = async (id: string, currentDate: string) => {
    const now = new Date().toISOString();
    const isCurrentlyPublished = new Date(currentDate) <= new Date();
    const newDate = isCurrentlyPublished 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      : now; // Now
    
    await onUpdateChapter(id, { release_date: newDate });
  };

  const previewUrl = (row: ChapterRow) => `/read/${seriesId}/${row.chapter_number}`;

  // Bulk Actions
  const selectAll = () => {
    if (selectedChapters.size === list.rows.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(list.rows.map(r => r.id)));
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedChapters);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedChapters(newSelection);
  };

  const startBulkAction = (action: typeof bulkAction) => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedChapters.size === 0) return;

    try {
      const selectedIds = Array.from(selectedChapters);
      
      switch (bulkAction) {
        case 'delete':
          await supabase.from('chapters').delete().in('id', selectedIds);
          toast({ title: 'Success', description: `Deleted ${selectedIds.length} chapters` });
          break;
          
        case 'publish':
          await supabase.from('chapters').update({ 
            release_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).in('id', selectedIds);
          toast({ title: 'Success', description: `Published ${selectedIds.length} chapters` });
          break;
          
        case 'unpublish':
          const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('chapters').update({ 
            release_date: futureDate,
            updated_at: new Date().toISOString()
          }).in('id', selectedIds);
          toast({ title: 'Success', description: `Unpublished ${selectedIds.length} chapters` });
          break;
          
        case 'lock':
          await supabase.from('chapters').update({ 
            is_locked: true,
            updated_at: new Date().toISOString()
          }).in('id', selectedIds);
          toast({ title: 'Success', description: `Locked ${selectedIds.length} chapters` });
          break;
          
        case 'unlock':
          await supabase.from('chapters').update({ 
            is_locked: false,
            updated_at: new Date().toISOString()
          }).in('id', selectedIds);
          toast({ title: 'Success', description: `Unlocked ${selectedIds.length} chapters` });
          break;
          
        case 'price':
          const priceUpdates = selectedIds.map(id => ({
            chapter_id: id,
            coin_cost: bulkPrice,
            updated_at: new Date().toISOString()
          }));
          await supabase.from('chapter_prices').upsert(priceUpdates);
          toast({ title: 'Success', description: `Updated price for ${selectedIds.length} chapters` });
          break;
      }
      
      list.refresh();
      notifyChaptersUpdated();
      setSelectedChapters(new Set());
    } catch (e) {
      console.error('Bulk action failed', e);
      toast({ title: 'Error', description: 'Bulk action failed', variant: 'destructive' });
    } finally {
      setBulkActionDialogOpen(false);
      setBulkAction(null);
    }
  };

  // Quick Actions
  const copyChapterLink = async (row: ChapterRow) => {
    const url = `${window.location.origin}${previewUrl(row)}`;
    await navigator.clipboard.writeText(url);
    setCopiedChapterId(row.id);
    toast({ title: 'Copied', description: 'Chapter link copied to clipboard' });
    setTimeout(() => setCopiedChapterId(null), 2000);
  };

  const startQuickEdit = (row: ChapterRow) => {
    setQuickEditChapter(row);
    setQuickEditTitle(row.title || '');
    setQuickEditDialogOpen(true);
  };

  const saveQuickEdit = async () => {
    if (!quickEditChapter) return;
    await onUpdateChapter(quickEditChapter.id, { title: quickEditTitle });
    setQuickEditDialogOpen(false);
    setQuickEditChapter(null);
  };

  // Saved Views
  const saveCurrentView = () => {
    if (!newViewName.trim()) return;
    
    const newView = {
      name: newViewName.trim(),
      filters: list.filters,
      sort: { field: list.sortField, dir: list.sortDir }
    };
    
    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem(`chapter-views-${seriesId}`, JSON.stringify(updated));
    setSaveViewDialogOpen(false);
    setNewViewName('');
    toast({ title: 'Saved', description: `View "${newView.name}" saved` });
  };

  const loadSavedView = (view: any) => {
    list.updateFilters(view.filters);
    list.updateSort(view.sort.field);
    if (list.sortDir !== view.sort.dir) {
      list.updateSort(view.sort.field);
    }
    toast({ title: 'Loaded', description: `Applied view "${view.name}"` });
  };

  const deleteSavedView = (index: number) => {
    const updated = savedViews.filter((_, i) => i !== index);
    setSavedViews(updated);
    localStorage.setItem(`chapter-views-${seriesId}`, JSON.stringify(updated));
    toast({ title: 'Deleted', description: 'View deleted' });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-none sm:w-[90vw] lg:w-[80vw] h-screen overflow-hidden flex flex-col">
          <SheetHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4 border-b shrink-0">
            <SheetTitle className="flex items-center justify-between">
              <span>Chapters · {seriesTitle}</span>
              <div className="flex gap-2">
                <ExportToCSV 
                  chapters={list.rows} 
                  seriesTitle={seriesTitle}
                  filterApplied={Object.values(list.filters).some(v => v !== 'any' && v !== '')}
                />
                <ChapterStatsChart seriesId={seriesId} seriesTitle={seriesTitle} />
                <Button onClick={startNewChapter} size="sm" className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chapter
                </Button>
              </div>
            </SheetTitle>
            
            {/* Real-time Summary Stats */}
            <RealTimeStatsHeader seriesId={seriesId} chapters={list.rows} />
            
            {/* Filter Chips */}
            <AdvancedFilterChips 
              filters={list.filters}
              onRemoveFilter={(type) => {
                if (type === 'search') list.updateFilters({ q: '' });
                else if (type === 'status') list.updateFilters({ status: 'any' });
                else if (type === 'published') list.updateFilters({ published: 'any' });
                else if (type === 'price') list.updateFilters({ price: 'any' });
                else if (type === 'sales') list.updateFilters({ sales: 'any' });
                else if (type === 'views') list.updateFilters({ views: 'any' });
              }}
              onClearAll={() => list.resetFilters()}
            />
          </SheetHeader>

          {/* Bulk Actions Toolbar */}
          {selectedChapters.size > 0 && (
            <div className="sticky top-[140px] z-20 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-md mx-4 p-3 mb-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedChapters.size} chapter{selectedChapters.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => startBulkAction('publish')}>
                          <Globe className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Publish Selected</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => startBulkAction('unpublish')}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Unpublish Selected</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => startBulkAction('lock')}>
                          <Lock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lock Selected</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => startBulkAction('unlock')}>
                          <Unlock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Unlock Selected</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => startBulkAction('price')}>
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Set Price</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="destructive" onClick={() => startBulkAction('delete')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Selected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedChapters(new Set())}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="sticky top-[140px] z-10 bg-background/95 backdrop-blur-sm py-4 border-b space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by title or chapter #..." 
                  value={list.filters.q} 
                  onChange={(e) => list.updateFilters({ q: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              {/* Sort */}
              <Select value={`${list.sortField}-${list.sortDir}`} onValueChange={(value) => {
                const [field, dir] = value.split('-') as [any, 'asc' | 'desc'];
                list.updateSort(field);
                if (list.sortDir !== dir) list.updateSort(field);
              }}>
                <SelectTrigger className="w-[180px] shrink-0">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chapter_number-asc">Chapter # ↑</SelectItem>
                  <SelectItem value="chapter_number-desc">Chapter # ↓</SelectItem>
                  <SelectItem value="release_date-desc">Date ↓</SelectItem>
                  <SelectItem value="release_date-asc">Date ↑</SelectItem>
                  <SelectItem value="views-desc">Views ↓</SelectItem>
                  <SelectItem value="views-asc">Views ↑</SelectItem>
                  <SelectItem value="sales-desc">Sales ↓</SelectItem>
                  <SelectItem value="sales-asc">Sales ↑</SelectItem>
                  <SelectItem value="coin_cost-desc">Price ↓</SelectItem>
                  <SelectItem value="coin_cost-asc">Price ↑</SelectItem>
                </SelectContent>
              </Select>

              {/* Saved Views */}
              {savedViews.length > 0 && (
                <Select onValueChange={(value) => {
                  if (value === 'save-new') {
                    setSaveViewDialogOpen(true);
                  } else {
                    const view = savedViews[parseInt(value)];
                    if (view) loadSavedView(view);
                  }
                }}>
                  <SelectTrigger className="w-[140px] shrink-0">
                    <Settings className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="My Views" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedViews.map((view, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {view.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="save-new">+ Save Current View</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtendedFilters(!showExtendedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                More Filters
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showExtendedFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Basic Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={list.filters.status} onValueChange={(value: any) => list.updateFilters({ status: value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Lock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Status</SelectItem>
                  <SelectItem value="locked">Locked Only</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={list.filters.published} onValueChange={(value: any) => list.updateFilters({ published: value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Publish Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Drafts</SelectItem>
                </SelectContent>
              </Select>

              <Select value={list.filters.price} onValueChange={(value: any) => list.updateFilters({ price: value })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Price Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              {(list.filters.q || list.filters.status !== 'any' || list.filters.published !== 'any' || list.filters.price !== 'any') && (
                <Button variant="outline" size="sm" onClick={list.resetFilters}>
                  Clear Filters
                </Button>
              )}

              {savedViews.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setSaveViewDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save View
                </Button>
              )}
            </div>

            {/* Extended Filters */}
            {showExtendedFilters && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chapter Number Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Chapter Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        value={chapterRange[0]}
                        onChange={(e) => setChapterRange([parseInt(e.target.value) || 1, chapterRange[1]])}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        value={chapterRange[1]}
                        onChange={(e) => setChapterRange([chapterRange[0], parseInt(e.target.value) || 999])}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            {dateRange.from ? format(dateRange.from, 'MMM dd') : 'From'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            {dateRange.to ? format(dateRange.to, 'MMM dd') : 'To'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* View Count Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Views: {viewRange[0]}</Label>
                    <Slider
                      value={viewRange}
                      onValueChange={setViewRange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Price Range: {priceRange[0]} - {priceRange[1]} coins</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setChapterRange([1, 999]);
                    setDateRange({});
                    setViewRange([0]);
                    setPriceRange([0, 100]);
                  }}>
                    Reset Extended
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {list.loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading chapters...</div>
            ) : list.rows.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-muted-foreground">No chapters found</div>
                <Button onClick={startNewChapter} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Chapter
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="border rounded-md overflow-hidden hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedChapters.size === list.rows.length && list.rows.length > 0}
                            onCheckedChange={selectAll}
                          />
                        </TableHead>
                         <TableHead className="w-[60px]">Thumb</TableHead>
                         <TableHead className="w-[80px]">#</TableHead>
                         <TableHead className="min-w-[200px]">Title</TableHead>
                         <TableHead className="w-[120px]">Lock Status</TableHead>
                         <TableHead className="w-[80px]">Price</TableHead>
                         <TableHead className="w-[120px]">Publish Status</TableHead>
                         <TableHead className="w-[80px]">Views</TableHead>
                         <TableHead className="w-[80px]">Sales</TableHead>
                         <TableHead className="text-right w-[240px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.rows.map(row => {
                        const isPublished = new Date(row.release_date) <= new Date();
                        return (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedChapters.has(row.id)}
                                onCheckedChange={() => toggleSelection(row.id)}
                              />
                            </TableCell>
                             <TableCell>
                               <ThumbnailPreview 
                                 chapterId={row.id}
                                 thumbnailUrl={row.thumbnail_url}
                                 chapterTitle={row.title || `Chapter ${row.chapter_number}`}
                                 onUpdate={() => list.refresh()}
                               />
                             </TableCell>
                             <TableCell className="font-mono">Ch. {row.chapter_number}</TableCell>
                            <TableCell>
                              <Input
                                value={row.title || ''}
                                onChange={(e) => onUpdateChapter(row.id, { title: e.target.value })}
                                onBlur={(e) => onUpdateChapter(row.id, { title: e.target.value })}
                                placeholder={`Chapter ${row.chapter_number}`}
                                className="border-0 shadow-none p-1 h-auto"
                              />
                            </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-2">
                                 <Switch
                                   checked={row.is_locked}
                                   onCheckedChange={(v) => onUpdateChapter(row.id, { is_locked: v })}
                                 />
                                 <LockReasonEditor 
                                   chapterId={row.id}
                                   isLocked={row.is_locked}
                                   lockReason={row.lock_reason}
                                   onUpdate={() => list.refresh()}
                                 />
                                 <AutoLockScheduler 
                                   chapterId={row.id}
                                   isLocked={row.is_locked}
                                   lockAfter={row.lock_after}
                                   unlockAfter={row.unlock_after}
                                   onUpdate={() => list.refresh()}
                                 />
                               </div>
                             </TableCell>
                            <TableCell>
                              {row.is_locked ? (
                                <Input
                                  type="number"
                                  min={0}
                                  value={row.coin_cost ?? 0}
                                  onChange={(e) => onUpdatePrice(row.id, parseInt(e.target.value || '0', 10))}
                                  onBlur={(e) => onUpdatePrice(row.id, parseInt(e.target.value || '0', 10))}
                                  className="w-16 text-xs border-0 shadow-none p-1 h-auto"
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">Free</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  variant={isPublished ? "secondary" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => togglePublishStatus(row.id, row.release_date)}
                                >
                                  {isPublished ? "Published" : "Draft"}
                                </Badge>
                                <Input
                                  type="date"
                                  value={(row.release_date || '').slice(0, 10)}
                                  onChange={(e) => onUpdateChapter(row.id, { release_date: e.target.value })}
                                  className="text-xs border-0 shadow-none p-1 h-auto"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{row.views ?? 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{row.sales ?? 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">{row.views ?? 0}</span>
                            </TableCell>
                             <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <ChapterAuditLog 
                                      chapterId={row.id}
                                      chapterTitle={row.title || `Chapter ${row.chapter_number}`}
                                    />
                                    <QuickChapterDuplicate 
                                      chapterId={row.id}
                                      seriesId={seriesId}
                                      chapterData={row}
                                      onSuccess={() => list.refresh()}
                                    />
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => copyChapterLink(row)}>
                                          {copiedChapterId === row.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy Link</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit Chapter</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" asChild>
                                          <a href={previewUrl(row)} target="_blank" rel="noopener">
                                            <Eye className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Preview</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => startDelete(row)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden space-y-3">
                  {list.rows.map((row) => {
                    const isPublished = new Date(row.release_date) <= new Date();
                    return (
                      <div key={row.id} className="p-4 rounded-lg border bg-card/50 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Ch. {row.chapter_number}</span>
                              <Badge variant={row.is_locked ? 'destructive' : 'secondary'}>
                                {row.is_locked ? 'Locked' : 'Free'}
                              </Badge>
                              <Badge 
                                variant={isPublished ? "secondary" : "outline"}
                                className="cursor-pointer"
                                onClick={() => togglePublishStatus(row.id, row.release_date)}
                              >
                                {isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <Input
                              value={row.title || ''}
                              onChange={(e) => onUpdateChapter(row.id, { title: e.target.value })}
                              onBlur={(e) => onUpdateChapter(row.id, { title: e.target.value })}
                              placeholder={`Chapter ${row.chapter_number}`}
                              className="mb-2"
                            />
                            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                              <div>
                                <div className="font-medium">Views</div>
                                <div>{row.views ?? 0}</div>
                              </div>
                              <div>
                                <div className="font-medium">Sales</div>
                                <div>{row.sales ?? 0}</div>
                              </div>
                              <div>
                                <div className="font-medium">Price</div>
                                <div>{row.is_locked ? `${row.coin_cost ?? 0} coins` : 'Free'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={row.is_locked}
                                onCheckedChange={(v) => onUpdateChapter(row.id, { is_locked: v })}
                              />
                              <span className="text-xs">Lock</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={previewUrl(row)} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => startDelete(row)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {row.is_locked && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Price:</span>
                            <Input
                              type="number"
                              min={0}
                              value={row.coin_cost ?? 0}
                              onChange={(e) => onUpdatePrice(row.id, parseInt(e.target.value || '0', 10))}
                              onBlur={(e) => onUpdatePrice(row.id, parseInt(e.target.value || '0', 10))}
                              className="w-20 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">coins</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {chapterListMode === 'pagination' && (
                  <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 shrink-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-muted-foreground">
                        Showing {list.start}–{list.end} of {list.totalCount} chapters
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => list.setPage(1)} disabled={list.page <= 1}>
                          First
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => list.setPage(list.page - 1)} disabled={list.page <= 1}>
                          Previous
                        </Button>
                        <span className="px-3 py-1 text-sm bg-muted rounded">
                          Page {list.page} of {list.totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => list.setPage(list.page + 1)} disabled={list.page >= list.totalPages}>
                          Next
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => list.setPage(list.totalPages)} disabled={list.page >= list.totalPages}>
                          Last
                        </Button>
                        <Select value={String(list.pageSize)} onValueChange={(value) => list.setPageSize(parseInt(value, 10))}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Full Editor */}
      <ChapterEditor
        chapter={editorOpen ? editingChapter : null}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={() => {
          setEditorOpen(false);
          list.refresh();
          notifyChaptersUpdated();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chapterToDelete?.title || `Chapter ${chapterToDelete?.chapter_number}`}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
