import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewCommentToastProps {
  chapterId: string;
  isReading: boolean;
}

export const NewCommentToast = ({ chapterId, isReading }: NewCommentToastProps) => {
  const [newComments, setNewComments] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isReading) return;

    // Simulate new comments while reading (in real app would use websockets/polling)
    const interval = setInterval(() => {
      const shouldShowComment = Math.random() < 0.1; // 10% chance every 30 seconds
      
      if (shouldShowComment) {
        setNewComments(prev => prev + 1);
        
        toast({
          title: "New comment",
          description: "Someone commented on this chapter",
          action: (
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>View</span>
            </div>
          ),
          duration: 5000,
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [chapterId, isReading, toast]);

  // Reset when changing chapters
  useEffect(() => {
    setNewComments(0);
  }, [chapterId]);

  return null; // This component only shows toasts
};

// Hook for managing comment notifications
export const useCommentNotifications = (chapterId: string, isReading: boolean) => {
  const [lastCommentCheck, setLastCommentCheck] = useState(Date.now());
  const { toast } = useToast();

  const checkForNewComments = async () => {
    // In real app, this would call an API
    // For demo, simulate random new comments
    const hasNewComments = Math.random() < 0.3;
    
    if (hasNewComments && isReading) {
      const mockComments = [
        "Great chapter!",
        "Plot twist incoming?",
        "Amazing artwork this chapter",
        "Can't wait for the next one!",
        "This series keeps getting better"
      ];
      
      const randomComment = mockComments[Math.floor(Math.random() * mockComments.length)];
      
      toast({
        title: "New comment",
        description: `"${randomComment}"`,
        action: (
          <MessageCircle className="h-4 w-4" />
        ),
      });
    }
  };

  useEffect(() => {
    if (!isReading) return;

    const interval = setInterval(checkForNewComments, 45000); // Check every 45 seconds
    return () => clearInterval(interval);
  }, [chapterId, isReading]);

  return { checkForNewComments };
};