import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
interface ChapterProgressBarProps {
  currentPage: number;
  totalPages: number;
  className?: string;
  showDots?: boolean;
  variant?: 'bar' | 'dots' | 'both';
}
export const ChapterProgressBar = ({
  currentPage,
  totalPages,
  className,
  showDots = false,
  variant = 'bar'
}: ChapterProgressBarProps) => {
  const percentage = totalPages > 0 ? (currentPage + 1) / totalPages * 100 : 0;
  if (variant === 'dots' || variant === 'both') {
    // Calculate dots to show (max 20 for visual clarity)
    const maxDots = Math.min(totalPages, 20);
    const dotsPerPage = totalPages / maxDots;
    const activeDots = Math.floor((currentPage + 1) / dotsPerPage);
    return <div className={cn("space-y-2", className)}>
        {variant === 'both' && <Progress value={percentage} className="h-1" />}
        
        {variant === 'dots' && <div className="flex items-center justify-center gap-1 px-4">
            {Array.from({
          length: maxDots
        }, (_, i) => <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-200", i < activeDots ? "bg-primary" : "bg-muted-foreground/30")} />)}
          </div>}
        
        
      </div>;
  }
  return <div className={cn("space-y-1", className)}>
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Page {currentPage + 1}</span>
        <span>{Math.round(percentage)}%</span>
        <span>{totalPages} total</span>
      </div>
    </div>;
};