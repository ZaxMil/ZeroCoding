import { useState, useEffect } from 'react';
import { StickyNote, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  chapterId: string;
  pageNumber: number;
  content: string;
  timestamp: number;
}

interface ReaderNotesProps {
  chapterId: string;
  currentPage: number;
}

export const ReaderNotes = ({ chapterId, currentPage }: ReaderNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load notes for this chapter
    const allNotes: Note[] = JSON.parse(localStorage.getItem('manga_reader_notes') || '[]');
    const chapterNotes = allNotes.filter(note => note.chapterId === chapterId);
    setNotes(chapterNotes.sort((a, b) => a.pageNumber - b.pageNumber));
  }, [chapterId]);

  const saveNote = () => {
    if (!noteContent.trim()) return;

    const allNotes: Note[] = JSON.parse(localStorage.getItem('manga_reader_notes') || '[]');
    
    if (editingNote) {
      // Update existing note
      const index = allNotes.findIndex(n => n.id === editingNote.id);
      if (index >= 0) {
        allNotes[index] = { ...editingNote, content: noteContent, timestamp: Date.now() };
      }
      toast({ title: "Note updated" });
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        chapterId,
        pageNumber: currentPage,
        content: noteContent,
        timestamp: Date.now()
      };
      allNotes.push(newNote);
      toast({ title: "Note saved", description: `Added note for page ${currentPage}` });
    }

    localStorage.setItem('manga_reader_notes', JSON.stringify(allNotes));
    
    // Refresh notes display
    const chapterNotes = allNotes.filter(note => note.chapterId === chapterId);
    setNotes(chapterNotes.sort((a, b) => a.pageNumber - b.pageNumber));
    
    setNoteContent('');
    setEditingNote(null);
    setShowDialog(false);
  };

  const deleteNote = (noteId: string) => {
    const allNotes: Note[] = JSON.parse(localStorage.getItem('manga_reader_notes') || '[]');
    const filtered = allNotes.filter(n => n.id !== noteId);
    localStorage.setItem('manga_reader_notes', JSON.stringify(filtered));
    
    const chapterNotes = filtered.filter(note => note.chapterId === chapterId);
    setNotes(chapterNotes.sort((a, b) => a.pageNumber - b.pageNumber));
    
    toast({ title: "Note deleted" });
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setShowDialog(true);
  };

  const startNewNote = () => {
    setEditingNote(null);
    setNoteContent('');
    setShowDialog(true);
  };

  const currentPageNotes = notes.filter(note => note.pageNumber === currentPage);
  const otherPageNotes = notes.filter(note => note.pageNumber !== currentPage);

  return (
    <div className="space-y-4">
      {/* Current page notes */}
      {currentPageNotes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Notes for Page {currentPage}
          </h4>
          {currentPageNotes.map(note => (
            <Card key={note.id} className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Page {note.pageNumber}
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => startEditing(note)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(note.timestamp).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add note button */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={startNewNote} className="w-full">
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note for Page {currentPage}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Note' : `Add Note for Page ${currentPage}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button onClick={saveNote} disabled={!noteContent.trim()}>
                {editingNote ? 'Update' : 'Save'} Note
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Other page notes */}
      {otherPageNotes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Other Notes ({otherPageNotes.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {otherPageNotes.map(note => (
              <Card key={note.id} className="bg-muted/50">
                <CardContent className="p-2">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline" className="text-xs">
                      Page {note.pageNumber}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => startEditing(note)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No notes for this chapter yet. Click the button above to add your first note!
        </p>
      )}
    </div>
  );
};

// Hook for notes management
export const useReaderNotes = (chapterId: string) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const allNotes: Note[] = JSON.parse(localStorage.getItem('manga_reader_notes') || '[]');
    const chapterNotes = allNotes.filter(note => note.chapterId === chapterId);
    setNotes(chapterNotes);
  }, [chapterId]);

  const getNotesForPage = (pageNumber: number) => {
    return notes.filter(note => note.pageNumber === pageNumber);
  };

  const hasNotesForPage = (pageNumber: number) => {
    return notes.some(note => note.pageNumber === pageNumber);
  };

  return { notes, getNotesForPage, hasNotesForPage };
};
