import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Trash2, Edit, Search, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ReadingNote {
  id: string;
  chapterId: string;
  pageNumber: number;
  content: string;
  timestamp: number;
  type: 'general' | 'analysis' | 'theory' | 'favorite';
}

interface ReadingNotesProps {
  chapterId: string;
  currentPage: number;
  notes: ReadingNote[];
  onAddNote: (note: Omit<ReadingNote, 'id' | 'timestamp'>) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onGoToNote: (note: ReadingNote) => void;
}

const noteTypeColors = {
  general: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  analysis: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  theory: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  favorite: 'bg-pink-500/10 text-pink-700 border-pink-500/20'
};

const noteTypeLabels = {
  general: 'General',
  analysis: 'Analysis',
  theory: 'Theory',
  favorite: 'Favorite'
};

export const ReadingNotes: React.FC<ReadingNotesProps> = ({
  chapterId,
  currentPage,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onGoToNote
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ReadingNote['type'] | 'all'>('all');
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'general' as ReadingNote['type']
  });

  const chapterNotes = notes.filter(n => n.chapterId === chapterId);
  const filteredNotes = chapterNotes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesType;
  });

  const currentPageNotes = chapterNotes.filter(n => n.pageNumber === currentPage);

  const handleAddNote = () => {
    if (!newNote.content.trim()) return;

    onAddNote({
      chapterId,
      pageNumber: currentPage,
      content: newNote.content,
      type: newNote.type
    });

    setNewNote({ content: '', type: 'general' });
    setIsAddingNote(false);
  };

  const handleEditNote = (noteId: string, content: string) => {
    onUpdateNote(noteId, content);
    setEditingNote(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="font-semibold">Reading Notes</h3>
          <Badge variant="secondary">{chapterNotes.length}</Badge>
        </div>
        
        <Button
          size="sm"
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {currentPageNotes.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <FileText className="h-4 w-4" />
                Notes on this page ({currentPageNotes.length})
              </div>
              {currentPageNotes.map((note) => (
                <div key={note.id} className="text-sm bg-background/50 rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={noteTypeColors[note.type]}
                    >
                      {noteTypeLabels[note.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(note.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isAddingNote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Note</CardTitle>
            <CardDescription>Page {currentPage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-type">Type</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(noteTypeLabels).map(([type, label]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={newNote.type === type ? "default" : "outline"}
                    onClick={() => setNewNote(prev => ({ ...prev, type: type as ReadingNote['type'] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note here..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote}>
                Save Note
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAddingNote(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chapterNotes.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="note-search">Search Notes</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="note-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filterType === 'all' ? "default" : "outline"}
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                {Object.entries(noteTypeLabels).map(([type, label]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filterType === type ? "default" : "outline"}
                    onClick={() => setFilterType(type as ReadingNote['type'])}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={noteTypeColors[note.type]}
                          >
                            {noteTypeLabels[note.type]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Page {note.pageNumber}
                          </Badge>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNote(note.id);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={note.content}
                            onChange={(e) => onUpdateNote(note.id, e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => setEditingNote(null)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => onGoToNote(note)}
                          className="space-y-1"
                        >
                          <p className="text-sm">{note.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(note.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredNotes.length === 0 && searchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No notes found matching "{searchTerm}"
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {chapterNotes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No notes in this chapter</p>
          <p className="text-sm">Add notes to capture your thoughts while reading</p>
        </div>
      )}
    </div>
  );
};