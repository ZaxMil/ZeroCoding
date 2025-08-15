import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface StatsData {
  date: string;
  views: number;
  sales: number;
}

interface ChapterStatsChartProps {
  seriesId: string;
  seriesTitle: string;
}

export const ChapterStatsChart: React.FC<ChapterStatsChartProps> = ({
  seriesId,
  seriesTitle
}) => {
  const [open, setOpen] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');
  const [metricType, setMetricType] = useState<'views' | 'sales'>('views');
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const days = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Get all chapters for this series
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('series_id', seriesId);

      if (!chapters?.length) {
        setStatsData([]);
        return;
      }

      const chapterIds = chapters.map(c => c.id);

      // Generate date range
      const dateRange: StatsData[] = [];
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dateRange.push({ date, views: 0, sales: 0 });
      }
      dateRange.reverse();

      // Get views data (from reading_progress)
      const { data: viewsData } = await supabase
        .from('reading_progress' as any)
        .select('chapter_id, created_at')
        .in('chapter_id', chapterIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get sales data (from coin_transactions)
      const { data: salesData } = await supabase
        .from('coin_transactions' as any)
        .select('reference_id, created_at')
        .eq('type', 'spend')
        .in('reference_id', chapterIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Aggregate data by date
      const viewsByDate = new Map<string, Set<string>>();
      const salesByDate = new Map<string, number>();

      viewsData?.forEach((view: any) => {
        const date = format(new Date(view.created_at), 'yyyy-MM-dd');
        if (!viewsByDate.has(date)) {
          viewsByDate.set(date, new Set());
        }
        viewsByDate.get(date)!.add(view.chapter_id);
      });

      salesData?.forEach((sale: any) => {
        const date = format(new Date(sale.created_at), 'yyyy-MM-dd');
        salesByDate.set(date, (salesByDate.get(date) || 0) + 1);
      });

      // Merge with date range
      const finalData = dateRange.map(item => ({
        ...item,
        views: viewsByDate.get(item.date)?.size || 0,
        sales: salesByDate.get(item.date) || 0
      }));

      setStatsData(finalData);
    } catch (error: any) {
      console.error('Failed to load stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadStatsData();
    }
  }, [open, timeWindow, seriesId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Stats Chart
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chapter Statistics - {seriesTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={timeWindow} onValueChange={(value: any) => setTimeWindow(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={metricType} onValueChange={(value: any) => setMetricType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {metricType === 'views' ? 'Daily Views' : 'Daily Sales'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      formatter={(value: number) => [value, metricType === 'views' ? 'Views' : 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey={metricType}
                      stroke={metricType === 'views' ? '#3b82f6' : '#10b981'}
                      fill={metricType === 'views' ? '#93c5fd' : '#86efac'}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};