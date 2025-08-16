import { useState, useEffect } from 'react';
import { BookmarkData } from '@/components/reader/BookmarkManager';

const STORAGE_KEY = 'manga_reading_bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookmarks(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  const saveBookmarks = (newBookmarks: BookmarkData[]) => {
    try {
      setBookmarks(newBookmarks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  // Add a new bookmark
  const addBookmark = (bookmark: Omit<BookmarkData, 'id' | 'timestamp'>) => {
    const newBookmark: BookmarkData = {
      ...bookmark,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    const newBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(newBookmarks);
    return newBookmark;
  };

  // Update an existing bookmark
  const updateBookmark = (id: string, updates: Partial<BookmarkData>) => {
    const newBookmarks = bookmarks.map(bookmark =>
      bookmark.id === id ? { ...bookmark, ...updates } : bookmark
    );
    saveBookmarks(newBookmarks);
  };

  // Delete a bookmark
  const deleteBookmark = (id: string) => {
    const newBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    saveBookmarks(newBookmarks);
  };

  // Get bookmarks for a specific chapter
  const getChapterBookmarks = (chapterId: string) => {
    return bookmarks.filter(bookmark => bookmark.chapterId === chapterId);
  };

  // Get bookmark for a specific page
  const getPageBookmark = (chapterId: string, pageNumber: number) => {
    return bookmarks.find(
      bookmark => bookmark.chapterId === chapterId && bookmark.pageNumber === pageNumber
    );
  };

  // Check if a page is bookmarked
  const isPageBookmarked = (chapterId: string, pageNumber: number) => {
    return !!getPageBookmark(chapterId, pageNumber);
  };

  // Get all bookmarks grouped by chapter
  const getBookmarksByChapter = () => {
    const grouped: { [chapterId: string]: BookmarkData[] } = {};
    bookmarks.forEach(bookmark => {
      if (!grouped[bookmark.chapterId]) {
        grouped[bookmark.chapterId] = [];
      }
      grouped[bookmark.chapterId].push(bookmark);
    });
    return grouped;
  };

  // Search bookmarks
  const searchBookmarks = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.note?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getChapterBookmarks,
    getPageBookmark,
    isPageBookmarked,
    getBookmarksByChapter,
    searchBookmarks
  };
};