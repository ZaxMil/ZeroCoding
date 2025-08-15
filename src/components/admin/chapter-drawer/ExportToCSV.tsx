import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface ExportToCSVProps {
  chapters: ChapterRowData[];
  seriesTitle: string;
  filterApplied?: boolean;
}

export const ExportToCSV: React.FC<ExportToCSVProps> = ({
  chapters,
  seriesTitle,
  filterApplied = false
}) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = [
        'Chapter Number',
        'Title',
        'Release Date',
        'Status',
        'Lock Status',
        'Price (Coins)',
        'Views',
        'Sales'
      ];

      // Convert chapters to CSV rows
      const csvRows = chapters.map(chapter => [
        chapter.chapter_number,
        `"${(chapter.title || 'Untitled').replace(/"/g, '""')}"`, // Escape quotes
        format(new Date(chapter.release_date), 'yyyy-MM-dd HH:mm:ss'),
        new Date(chapter.release_date) <= new Date() ? 'Published' : 'Scheduled',
        chapter.is_locked ? 'Locked' : 'Free',
        chapter.coin_cost || 0,
        chapter.views,
        chapter.sales
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename
        const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
        const filterSuffix = filterApplied ? '_filtered' : '';
        const filename = `${seriesTitle.replace(/[^a-zA-Z0-9]/g, '_')}_chapters${filterSuffix}_${timestamp}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Success',
          description: `Exported ${chapters.length} chapters to CSV`
        });
      }
    } catch (error: any) {
      console.error('CSV export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to export CSV file',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      disabled={chapters.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV ({chapters.length})
    </Button>
  );
};