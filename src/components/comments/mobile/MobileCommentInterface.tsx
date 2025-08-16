import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageCircle, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UniversalCommentInput } from '../UniversalCommentInput';
import { EnhancedCommentThread } from '../EnhancedCommentThread';
import { CommentType } from '@/types/comments';

interface MobileCommentInterfaceProps {
  targetId: string;
  targetType: CommentType;
  commentCount: number;
}

export const MobileCommentInterface: React.FC<MobileCommentInterfaceProps> = ({
  targetId,
  targetType,
  commentCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile Comment Button - Fixed at bottom */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg"
              variant="default"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                {commentCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {commentCount > 99 ? '99+' : commentCount}
                  </Badge>
                )}
              </div>
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="bottom" 
            className="h-[85vh] p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col h-full">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({commentCount})
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-hidden relative">
                <div className="h-full overflow-y-auto p-4 space-y-4">
                  {/* Comment Form */}
                  <div className="border-b pb-4">
                    <UniversalCommentInput
                      targetId={targetId}
                      targetType={targetType}
                      targetTitle="Comments"
                      onUserComment={async () => {}}
                      onGuestComment={async () => {}}
                    />
                  </div>
                  
                  {/* Comments Thread */}
                  <EnhancedCommentThread
                    targetId={targetId}
                    targetType={targetType}
                    mobileOptimized
                  />
                </div>
                
                {/* Scroll to top button */}
                {showScrollTop && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-lg"
                    onClick={scrollToTop}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};