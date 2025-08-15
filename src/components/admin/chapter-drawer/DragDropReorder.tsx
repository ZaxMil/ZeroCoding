import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ChapterRowData {
  id: string;
  chapter_number: number;
  title: string | null;
  release_date: string;
  is_locked: boolean;
  coin_cost: number | null;
  sales: number;
  views: number;
}

interface DragDropReorderProps {
  chapters: ChapterRowData[];
  selectedChapters: Set<string>;
  onReorder: (startIndex: number, endIndex: number) => void;
  onToggleSelection: (id: string) => void;
  renderChapterActions: (chapter: ChapterRowData) => React.ReactNode;
}

export const DragDropReorder: React.FC<DragDropReorderProps> = ({
  chapters,
  selectedChapters,
  onReorder,
  onToggleSelection,
  renderChapterActions
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex !== endIndex) {
      onReorder(startIndex, endIndex);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="chapters-list">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {chapters.map((chapter, index) => (
              <Draggable 
                key={chapter.id} 
                draggableId={chapter.id} 
                index={index}
              >
                {(provided, snapshot) => (
                  <TableRow
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                      ${snapshot.isDragging ? 'bg-accent shadow-lg' : ''}
                      ${selectedChapters.has(chapter.id) ? 'bg-accent/50' : ''}
                    `}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          {...provided.dragHandleProps}
                          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Checkbox
                          checked={selectedChapters.has(chapter.id)}
                          onCheckedChange={() => onToggleSelection(chapter.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">#{chapter.chapter_number}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">{chapter.title || 'Untitled'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={new Date(chapter.release_date) <= new Date() ? "default" : "secondary"}
                        >
                          {new Date(chapter.release_date) <= new Date() ? 'Published' : 'Scheduled'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chapter.release_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={chapter.is_locked ? "destructive" : "outline"}>
                        {chapter.is_locked ? "Locked" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell>{chapter.coin_cost || 0} coins</TableCell>
                    <TableCell>{chapter.views}</TableCell>
                    <TableCell>{chapter.sales}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderChapterActions(chapter)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};