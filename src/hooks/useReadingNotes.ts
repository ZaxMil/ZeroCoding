import { useState, useEffect } from 'react';
import { ReadingNote } from '@/components/reader/ReadingNotes';

const STORAGE_KEY = 'manga_reading_notes';

export const useReadingNotes = () => {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotes(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading reading notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notes to localStorage whenever they change
  const saveNotes = (newNotes: ReadingNote[]) => {
    try {
      setNotes(newNotes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
    } catch (error) {
      console.error('Error saving reading notes:', error);
    }
  };

  // Add a new note
  const addNote = (note: Omit<ReadingNote, 'id' | 'timestamp'>) => {
    const newNote: ReadingNote = {
      ...note,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    const newNotes = [...notes, newNote];
    saveNotes(newNotes);
    return newNote;
  };

  // Update an existing note
  const updateNote = (id: string, content: string) => {
    const newNotes = notes.map(note =>
      note.id === id ? { ...note, content } : note
    );
    saveNotes(newNotes);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    const newNotes = notes.filter(note => note.id !== id);
    saveNotes(newNotes);
  };

  // Get notes for a specific chapter
  const getChapterNotes = (chapterId: string) => {
    return notes.filter(note => note.chapterId === chapterId);
  };

  // Get notes for a specific page
  const getPageNotes = (chapterId: string, pageNumber: number) => {
    return notes.filter(
      note => note.chapterId === chapterId && note.pageNumber === pageNumber
    );
  };

  // Get all notes grouped by chapter
  const getNotesByChapter = () => {
    const grouped: { [chapterId: string]: ReadingNote[] } = {};
    notes.forEach(note => {
      if (!grouped[note.chapterId]) {
        grouped[note.chapterId] = [];
      }
      grouped[note.chapterId].push(note);
    });
    return grouped;
  };

  // Get notes by type
  const getNotesByType = (type: ReadingNote['type']) => {
    return notes.filter(note => note.type === type);
  };

  // Search notes
  const searchNotes = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note =>
      note.content.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get note statistics
  const getNoteStats = () => {
    const totalNotes = notes.length;
    const notesByType = {
      general: notes.filter(n => n.type === 'general').length,
      analysis: notes.filter(n => n.type === 'analysis').length,
      theory: notes.filter(n => n.type === 'theory').length,
      favorite: notes.filter(n => n.type === 'favorite').length
    };
    
    const chaptersWithNotes = new Set(notes.map(n => n.chapterId)).size;
    
    return {
      totalNotes,
      notesByType,
      chaptersWithNotes
    };
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    getChapterNotes,
    getPageNotes,
    getNotesByChapter,
    getNotesByType,
    searchNotes,
    getNoteStats
  };
};