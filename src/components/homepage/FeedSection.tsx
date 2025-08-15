import { useChaptersFeed } from '@/hooks/useChaptersFeed';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, TrendingUp } from 'lucide-react';
import { useHomepageSettings } from '@/hooks/useHomepageData';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
export const FeedSection = () => {
  const { settings } = useHomepageSettings();
  const feedCount = settings?.feed_chapters_count || 10;
  const { chapters, loading } = useChaptersFeed(30, feedCount);
  const navigate = useNavigate();
  if (loading) {
    return (
      <section className="w-full col-span-full">
        <div className="w-full px-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Latest Updates</h2>
            </div>
            <p className="text-muted-foreground text-sm">Fresh chapters from the past 30 days</p>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-4 w-full">
              <ScrollArea className="h-[420px] w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell w-[120px]">Type</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead className="hidden sm:table-cell w-[140px]">Chapter</TableHead>
                      <TableHead className="w-[140px]">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell className="hidden md:table-cell">
                          <div className="h-4 w-16 bg-muted rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-[200px] bg-muted rounded" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="h-4 w-24 bg-muted rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-muted rounded ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!chapters.length) {
    return (
      <section className="w-full col-span-full">
        <div className="w-full px-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Latest Updates</h2>
            </div>
            <p className="text-muted-foreground text-sm">Fresh chapters from the past 30 days</p>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-4 text-center w-full">
              <ScrollArea className="h-[420px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell w-[120px]">Type</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead className="hidden sm:table-cell w-[140px]">Chapter</TableHead>
                      <TableHead className="w-[140px]">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        <Clock className="h-5 w-5 inline-block mr-2" />
                        No new chapters in the past 30 days
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
      <section className="w-full col-span-full">
        <div className="w-full px-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Latest Updates</h2>
            </div>
            <p className="text-muted-foreground text-sm">Fresh chapters from the past 30 days</p>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-4 w-full">
              <ScrollArea className="h-[420px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell w-[120px]">Type</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead className="hidden sm:table-cell w-[140px]">Chapter</TableHead>
                      <TableHead className="w-[140px]">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapters.map((chapter) => (
                      <TableRow
                        key={chapter.chapter_id}
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/read/${chapter.series_id}/${chapter.chapter_number}`)}
                        data-series-id={chapter.series_id}
                      >
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">Chapter</Badge>
                        </TableCell>
                        <TableCell className="font-medium truncate">
                          {chapter.series_title}
                          {chapter.is_locked && (
                            <Badge variant="destructive" className="ml-2 text-[10px]">
                              Locked{typeof chapter.unlock_cost === 'number' ? ` • ${chapter.unlock_cost} coins` : ''}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground whitespace-nowrap truncate">
                          {chapter.chapter_title && chapter.chapter_title !== `Chapter ${chapter.chapter_number}`
                            ? chapter.chapter_title
                            : `Chapter ${chapter.chapter_number}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(chapter.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>
  );
};