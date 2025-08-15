import { useReadingHistory } from './useReadingHistory';

/**
 * Hook to determine which chapter is most recently read for icon display
 */
export const useRecentChapterLogic = (userId?: string) => {
  const { items } = useReadingHistory(userId);

  const getMostRecentChapter = (seriesId: string): string | null => {
    const seriesHistory = items.find(item => item.seriesId === seriesId);
    return seriesHistory?.chapterId || null;
  };

  const isRecentChapter = (seriesId: string, chapterId: string): boolean => {
    const recentChapterId = getMostRecentChapter(seriesId);
    return recentChapterId === chapterId;
  };

  return {
    getMostRecentChapter,
    isRecentChapter
  };
};