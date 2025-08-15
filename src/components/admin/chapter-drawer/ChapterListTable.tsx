import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { format } from 'date-fns';
import { 
  Eye, Edit3, Trash2, Lock, Unlock, Copy, 
  GripVertical, ImageIcon, Clock, StickyNote, History 
} from 'lucide-react';
import { ThumbnailPreview } from './ThumbnailPreview';
import { LockReasonEditor } from './LockReasonEditor';
import { AutoLockScheduler } from './AutoLockScheduler';
import { QuickChapterDuplicate } from './QuickChapterDuplicate';
import { ChapterAuditLog } from './ChapterAuditLog';
import { AdminNotesEditor } from './AdminNotesEditor';
import type { ChapterRowData } from '@/hooks/useChapterAdminList';

interface ChapterListTableProps {
  chapters: ChapterRowData[];
  selectedChapters: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (chapter: ChapterRowData) => void;
  onDelete: (chapter: ChapterRowData) => void;
  onToggleLock: (chapter: ChapterRowData) => void;
  onCopyLink: (chapter: ChapterRowData) => void;
  onDuplicate: (chapter: ChapterRowData) => void;
  onReorder: (activeId: string, overId: string) => void;
  enableDragDrop: boolean;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export const ChapterListTable: React.FC<ChapterListTableProps> = ({
  chapters,
  selectedChapters,
  onToggleSelection,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleLock,
  onCopyLink,
  onDuplicate,
  onReorder,
  enableDragDrop,
  sortField,
  sortDir,
  onSort
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  };

  const allSelected = chapters.length > 0 && chapters.every(c => selectedChapters.has(c.id));
  const someSelected = chapters.some(c => selectedChapters.has(c.id));

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const renderTableContent = () => (
    <>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all chapters"
            />
          </TableHead>
          {enableDragDrop && <TableHead className="w-12"></TableHead>}
          <TableHead className="w-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('chapter_number')}
              className="h-auto p-0 font-medium"
            >
              # {getSortIcon('chapter_number')}
            </Button>
          </TableHead>
          <TableHead className="w-20">Preview</TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('title')}
              className="h-auto p-0 font-medium"
            >
              Title {getSortIcon('title')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('release_date')}
              className="h-auto p-0 font-medium"
            >
              Status {getSortIcon('release_date')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('is_locked')}
              className="h-auto p-0 font-medium"
            >
              Access {getSortIcon('is_locked')}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('coin_cost')}
              className="h-auto p-0 font-medium"
            >
              Price {getSortIcon('coin_cost')}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('views')}
              className="h-auto p-0 font-medium"
            >
              Views {getSortIcon('views')}
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSort('sales')}
              className="h-auto p-0 font-medium"
            >
              Sales {getSortIcon('sales')}
            </Button>
          </TableHead>
          <TableHead>Meta</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chapters.map((chapter) => {
          const isSelected = selectedChapters.has(chapter.id);
          const isPublished = new Date(chapter.release_date) <= new Date();
          const hasScheduledAction = chapter.lock_after || chapter.unlock_after;

          const rowContent = (
            <TableRow className={isSelected ? 'bg-accent/50' : ''}>
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(chapter.id)}
                  aria-label={`Select chapter ${chapter.chapter_number}`}
                />
              </TableCell>
              {enableDragDrop && (
                <TableCell>
                  <div className="cursor-grab active:cursor-grabbing p-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
              )}
              <TableCell className="font-medium">#{chapter.chapter_number}</TableCell>
              <TableCell>
                <ThumbnailPreview 
                  chapterId={chapter.id}
                  thumbnailUrl={chapter.thumbnail_url}
                  chapterTitle={chapter.title || 'Untitled'}
                  onUpdate={() => {}}
                />
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <div className="truncate font-medium">
                    {chapter.title || 'Untitled'}
                  </div>
                  {chapter.meta_title && (
                    <div className="text-xs text-muted-foreground truncate">
                      SEO: {chapter.meta_title}
                    </div>
                  )}
                  {chapter.notes_admin && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex items-center gap-1 mt-1">
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Admin note</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{chapter.notes_admin}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? 'Published' : 'Scheduled'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(chapter.release_date), 'MMM d, yyyy')}
                  </span>
                  {hasScheduledAction && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Clock className="h-3 w-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Has scheduled lock/unlock actions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={chapter.is_locked ? "destructive" : "outline"}>
                    {chapter.is_locked ? "Locked" : "Free"}
                  </Badge>
                  {chapter.is_locked && chapter.lock_reason && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{chapter.lock_reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">
                  {chapter.coin_cost || 0} coins
                </Badge>
              </TableCell>
              <TableCell className="text-right">{chapter.views}</TableCell>
              <TableCell className="text-right">{chapter.sales}</TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Created: {format(new Date(chapter.created_at), 'MMM d')}</div>
                  <div>Updated: {format(new Date(chapter.updated_at), 'MMM d')}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(chapter)}
                          aria-label="Edit chapter"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit chapter</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleLock(chapter)}
                          aria-label={chapter.is_locked ? "Unlock chapter" : "Lock chapter"}
                        >
                          {chapter.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {chapter.is_locked ? 'Unlock chapter' : 'Lock chapter'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <QuickChapterDuplicate 
                    chapterId={chapter.id}
                    seriesId="placeholder-series-id"
                    chapterData={{
                      title: chapter.title,
                      chapter_number: chapter.chapter_number,
                      is_locked: chapter.is_locked,
                      coin_cost: chapter.coin_cost,
                      lock_reason: chapter.lock_reason,
                      thumbnail_url: chapter.thumbnail_url,
                      meta_title: chapter.meta_title,
                      meta_description: chapter.meta_description,
                      meta_keywords: chapter.meta_keywords,
                      notes_admin: chapter.notes_admin,
                    }}
                    onSuccess={() => onDuplicate(chapter)}
                  />
                  
                  <ChapterAuditLog chapterId={chapter.id} chapterTitle={chapter.title || 'Untitled'} />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyLink(chapter)}
                          aria-label="Copy chapter link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy chapter link</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(chapter)}
                          aria-label="Delete chapter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete chapter</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          );

          if (enableDragDrop) {
            return (
              <SortableItem key={chapter.id} id={chapter.id}>
                {rowContent}
              </SortableItem>
            );
          }

          return <React.Fragment key={chapter.id}>{rowContent}</React.Fragment>;
        })}
      </TableBody>
    </>
  );

  if (enableDragDrop) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {renderTableContent()}
          </SortableContext>
        </Table>
      </DndContext>
    );
  }

  return <Table>{renderTableContent()}</Table>;
};