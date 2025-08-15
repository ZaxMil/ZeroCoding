import { EnhancedSEOHelmet } from '@/components/EnhancedSEOHelmet';
import ModernSeriesDetail from '@/components/series/ModernSeriesDetail';

const SeriesDetail = () => {
  return (
    <>
      <EnhancedSEOHelmet title="Series Details" description="Read series details, chapters, and updates." />
      <ModernSeriesDetail />
    </>
  );
};

export default SeriesDetail;
