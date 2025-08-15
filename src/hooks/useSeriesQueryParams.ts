import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type SeriesQueryParams = {
  q?: string;
  genre?: string; // comma-separated list
  status?: string;
  sort?: string;
};

export default function useSeriesQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: SeriesQueryParams = useMemo(() => {
    const qp: SeriesQueryParams = {};
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort');
    if (q) qp.q = q;
    if (genre) qp.genre = genre;
    if (status) qp.status = status;
    if (sort) qp.sort = sort;
    return qp;
  }, [searchParams]);

  const setParams = (next: Partial<SeriesQueryParams>, options?: { replace?: boolean }) => {
    const newParams = new URLSearchParams(searchParams);
    (['q','genre','status','sort'] as const).forEach((key) => {
      const val = next[key];
      if (val === undefined || val === null || val === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(val));
      }
    });
    setSearchParams(newParams, { replace: options?.replace });
  };

  const clearParams = (options?: { replace?: boolean }) => {
    setSearchParams(new URLSearchParams(), { replace: options?.replace });
  };

  const buildTitleSuffix = () => {
    if (params.genre) return ` — ${decodeURIComponent(params.genre).split(',')[0]}`;
    if (params.q) return ` — ${params.q}`;
    return '';
  };

  return { params, setParams, clearParams, buildTitleSuffix };
}
